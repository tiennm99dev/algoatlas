/**
 * Matrix exponentiation for a linear recurrence aₙ = c₁·aₙ₋₁ + … + c_k·aₙ₋ₖ. The state vector
 * vᵢ = (aᵢ₊ₖ₋₁, …, aᵢ) moves one step with vᵢ₊₁ = M·vᵢ, where M has the coefficients in its
 * first row and a shifted identity below. So vₙ = Mⁿ·v₀ and aₙ is the last entry of Mⁿ·v₀.
 * Mⁿ comes from binary exponentiation: read the bits of n from the lowest, keep P = M^(2^k) by
 * squaring, and multiply P into the result R when the bit is 1. Entries are BigInt, either
 * exact or reduced mod m after every multiplication.
 */

export const MAX_EXACT_N = 1000;
export const MAX_N = 1_000_000_000_000_000;
export const MAX_MODULUS = 1_000_000_007;
export const MIN_MODULUS = 2;

/**
 * @typedef {object} Recurrence
 * @property {number[]} coeffs  c₁ … c_k.
 * @property {number[]} initial  a₀ … aₖ₋₁.
 */

/** @type {Record<'fibonacci'|'pell'|'tribonacci', Recurrence>} */
export const RECURRENCES = {
  fibonacci: { coeffs: [1, 1], initial: [0, 1] },
  pell: { coeffs: [2, 1], initial: [0, 1] },
  tribonacci: { coeffs: [1, 1, 1], initial: [0, 0, 1] },
};

export const matrixPowPseudocode = [
  'R = I   (the identity)',
  'P = M',
  'while e > 0:',
  '  if e is odd:',
  '    R = R · P',
  '  e = ⌊e / 2⌋',
  '  if e > 0: P = P · P',
  'aₙ = last entry of R · v₀',
];

/**
 * @typedef {object} MatrixPowFrame
 * @property {'start'|'bit'|'multiply'|'square'|'halve'|'done'} kind
 * @property {number} n  The index asked for.
 * @property {number | null} mod  null for exact arithmetic.
 * @property {number} size  k, the order of the recurrence.
 * @property {string[][]} matrix  M.
 * @property {string[]} start  v₀ = (aₖ₋₁, …, a₀).
 * @property {number[]} bits  The bits of n, highest first.
 * @property {number} k  The bit being read, counted from the lowest; -1 when none.
 * @property {number} e  What is left of n.
 * @property {string[][]} r  R = M^covered.
 * @property {string[][]} p  P = M^power.
 * @property {number} covered
 * @property {number} power
 * @property {number[]} used  The powers 2^k multiplied into R so far.
 * @property {string} answer  aₙ, set on the done frame.
 * @property {number} matrixProducts
 * @property {number} scalarProducts  k³ per matrix product.
 * @property {number} digits  Digits of the largest entry so far.
 * @property {number[]} lines
 */

/** @param {number} k @returns {bigint[][]} */
function identity(k) {
  return Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => (i === j ? 1n : 0n)),
  );
}

/**
 * The transition matrix of a recurrence: coefficients on the first row, ones just below the
 * diagonal.
 * @param {number[]} coeffs
 * @returns {bigint[][]}
 */
export function transitionMatrix(coeffs) {
  const k = coeffs.length;
  return Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => {
      if (i === 0) return BigInt(coeffs[j]);
      return j === i - 1 ? 1n : 0n;
    }),
  );
}

/**
 * aₙ by running the recurrence forward n times, the oracle and the cost to beat.
 * @param {Recurrence} rec
 * @param {number} n
 * @param {number | null} mod
 * @returns {string}
 */
export function recurrenceByLoop(rec, n, mod) {
  const k = rec.coeffs.length;
  const m = mod === null ? null : BigInt(mod);
  const reduce = (/** @type {bigint} */ v) => (m === null ? v : v % m);
  const window = rec.initial.map((v) => reduce(BigInt(v)));
  if (n < k) return window[n].toString();
  for (let i = k; i <= n; i++) {
    let next = 0n;
    for (let j = 0; j < k; j++) next += BigInt(rec.coeffs[j]) * window[k - 1 - j];
    window.shift();
    window.push(reduce(next));
  }
  return window[k - 1].toString();
}

/** @param {bigint[][]} a */
const show = (a) => a.map((row) => row.map(String));

/**
 * @param {Recurrence} rec
 * @param {number} n  From 0 to MAX_N (MAX_EXACT_N when mod is null).
 * @param {number | null} mod  From MIN_MODULUS to MAX_MODULUS, or null for exact.
 * @returns {MatrixPowFrame[]}
 */
export function matrixPowTrace(rec, n, mod) {
  const size = rec.coeffs.length;
  const m = mod === null ? null : BigInt(mod);
  const reduce = (/** @type {bigint} */ v) => (m === null ? v : v % m);
  const M = transitionMatrix(rec.coeffs).map((row) => row.map(reduce));
  const v0 = rec.initial
    .slice()
    .reverse()
    .map((v) => reduce(BigInt(v)));
  const bits = [...n.toString(2)].map(Number);
  let R = identity(size).map((row) => row.map(reduce));
  let P = M.map((row) => row.slice());
  let e = n;
  let k = -1;
  let covered = 0;
  let power = 1;
  let matrixProducts = 0;
  let scalarProducts = 0;
  let digits = 1;
  let answer = '';
  /** @type {number[]} */
  const used = [];
  /** @type {MatrixPowFrame[]} */
  const frames = [];

  /** @param {bigint[][]} a @param {bigint[][]} b */
  const times = (a, b) => {
    matrixProducts++;
    scalarProducts += size ** 3;
    const out = a.map((row) =>
      b[0].map((_, j) => reduce(row.reduce((sum, x, t) => sum + x * b[t][j], 0n))),
    );
    for (const row of out) for (const x of row) digits = Math.max(digits, x.toString().length);
    return out;
  };

  /** @param {MatrixPowFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      n,
      mod,
      size,
      matrix: show(M),
      start: v0.map(String),
      bits: bits.slice(),
      k,
      e,
      r: show(R),
      p: show(P),
      covered,
      power,
      used: used.slice(),
      answer,
      matrixProducts,
      scalarProducts,
      digits,
      lines,
    });

  push('start', [0, 1]);
  while (e > 0) {
    k++;
    push('bit', [2, 3]);
    if (e % 2 === 1) {
      R = times(R, P);
      covered += power;
      used.push(power);
      push('multiply', [4]);
    }
    e = Math.floor(e / 2);
    if (e > 0) {
      P = times(P, P);
      power *= 2;
      push('square', [5, 6]);
    } else {
      push('halve', [5]);
    }
  }
  k = -1;
  answer = reduce(R[size - 1].reduce((sum, x, j) => sum + x * v0[j], 0n)).toString();
  push('done', [7]);
  return frames;
}

/** @type {Record<'fib10'|'fib1000'|'fibMod'|'pellMod'|'tribonacci', {rec: keyof typeof RECURRENCES, n: number, mod: number | null}>} */
export const MATRIX_PRESETS = {
  fib10: { rec: 'fibonacci', n: 10, mod: null },
  fib1000: { rec: 'fibonacci', n: 1000, mod: null },
  fibMod: { rec: 'fibonacci', n: 1_000_000_000_000_000, mod: 1_000_000_007 },
  pellMod: { rec: 'pell', n: 1_000_000, mod: 1_000_000_007 },
  tribonacci: { rec: 'tribonacci', n: 20, mod: null },
};
