/**
 * Two problem runners for algebra practice.
 *
 * Recurrence to matrix: aₙ = c₁·aₙ₋₁ + … + cₖ·aₙ₋ₖ + d. The state vᵢ = (aᵢ₊ₖ₋₁, …, aᵢ, 1)
 * moves one step with vᵢ₊₁ = M·vᵢ, where M has c₁ … cₖ (and d) in its first row, a shifted
 * identity below it, and, when d ≠ 0, a last row 0 … 0 1 that keeps the constant 1. Then
 * vₙ = Mⁿ·v₀, and aₙ is entry k − 1 of vₙ (the slot a₀ started in). Mⁿ mod m comes from binary
 * exponentiation over BigInt entries.
 *
 * Big-number multiplication: the digits of a product are the convolution
 * c[k] = Σ a[i]·b[k − i] of the digit lists (lowest digit first), followed by carrying. The
 * convolution is a polynomial product, the step FFT does in O(n log n) instead of O(n²).
 */

export const MAX_ORDER = 4;
export const MAX_COEFF = 99;
export const MAX_INDEX = 1_000_000_000_000_000;
export const MIN_MODULUS = 2;
export const MAX_MODULUS = 1_000_000_007;
export const MAX_DIGITS = 12;

/** @typedef {'recurrence'|'bignum'} Problem */
export const PROBLEMS = /** @type {Problem[]} */ (['recurrence', 'bignum']);

/** @type {Record<Problem, string[]>} */
export const PSEUDOCODE = {
  recurrence: [
    'dựng M cỡ k (k + 1 if có hằng số d):',
    '  hàng 0 = c₁ … cₖ (rồi d)',
    '  hàng i = 1 ở cột i − 1, với i = 1 … k − 1',
    '  hàng cuối = 0 … 0 1   // giữ hằng số 1',
    'R = I, P = M, e = n',
    'while e > 0:',
    '  if e lẻ: R = R · P mod m',
    '  e = ⌊e / 2⌋; if e > 0: P = P · P mod m',
    'v = R · v₀ mod m, với v₀ = (aₖ₋₁, …, a₀ (, 1))',
    'aₙ = phần tử k − 1 của v   // chỗ a₀ đứng lúc đầu',
  ],
  bignum: [
    'a, b = danh sách chữ số, chữ số thấp nhất trước',
    'for k = 0 to len(a) + len(b) − 2:',
    '  c[k] = Σ a[i] · b[k − i]   // tích chập',
    'carry = 0',
    'for k = 0 to len(c) − 1:',
    '  t = c[k] + carry; digit[k] = t mod 10; carry = ⌊t / 10⌋',
    'while carry > 0: digit.append(carry mod 10); carry = ⌊carry / 10⌋',
    'return các chữ số, chữ số cao nhất trước',
  ],
};

/**
 * @typedef {object} Recurrence
 * @property {number[]} coeffs  c₁ … cₖ.
 * @property {number} constant  d.
 * @property {number[]} initial  a₀ … aₖ₋₁.
 */

/** @param {bigint[][]} A @param {bigint[][]} B @param {bigint} mod */
function multiply(A, B, mod) {
  return A.map((row) => B[0].map((_, j) => row.reduce((s, x, t) => (s + x * B[t][j]) % mod, 0n)));
}

/** @param {bigint[][]} A */
const strings = (A) => A.map((row) => row.map(String));

/**
 * The transition matrix of a recurrence, as BigInt rows.
 * @param {Recurrence} rec
 * @returns {bigint[][]}
 */
export function transitionMatrix(rec) {
  const k = rec.coeffs.length;
  const withConst = rec.constant !== 0;
  const size = k + (withConst ? 1 : 0);
  /** @type {bigint[][]} */
  const M = Array.from({ length: size }, () => Array(size).fill(0n));
  rec.coeffs.forEach((c, j) => (M[0][j] = BigInt(c)));
  if (withConst) M[0][k] = BigInt(rec.constant);
  for (let i = 1; i < k; i++) M[i][i - 1] = 1n;
  if (withConst) M[k][k] = 1n;
  return M;
}

/**
 * aₙ mod m by running the recurrence term by term (the oracle; fine for small n).
 * @param {Recurrence} rec
 * @param {number} n
 * @param {number} mod
 */
export function recurrenceByLoop(rec, n, mod) {
  const m = BigInt(mod);
  const a = rec.initial.map((v) => BigInt(v) % m);
  const k = rec.coeffs.length;
  for (let i = k; i <= n; i++) {
    let next = BigInt(rec.constant);
    for (let j = 1; j <= k; j++) next += BigInt(rec.coeffs[j - 1]) * a[i - j];
    a.push(next % m);
  }
  return String(a[n]);
}

/**
 * @typedef {object} RecurrenceFrame
 * @property {'start'|'row'|'init'|'multiply'|'skip'|'square'|'halve'|'apply'|'done'} kind
 * @property {number} order  k.
 * @property {number} size  k, or k + 1 with a constant.
 * @property {number} n
 * @property {number} mod
 * @property {(string | null)[][]} matrix  M, with rows not built yet as null cells.
 * @property {number} row  row: the row just built; -1 otherwise.
 * @property {string[][]} r  R; empty before init.
 * @property {string[][]} p  P; empty before init.
 * @property {number} e  What is left of n.
 * @property {number} covered  R = M^covered.
 * @property {number} power  P = M^power.
 * @property {string[]} start  v₀.
 * @property {string[]} result  v = R·v₀, from the apply frame on.
 * @property {string} answer  aₙ, on the done frame.
 * @property {number} matrixProducts
 * @property {number[]} lines
 */

/**
 * Builds the matrix of a recurrence and raises it to the n-th power, frame by frame.
 * @param {Recurrence} rec
 * @param {number} n
 * @param {number} mod
 * @returns {RecurrenceFrame[]}
 */
export function recurrenceTrace(rec, n, mod) {
  const m = BigInt(mod);
  const k = rec.coeffs.length;
  const M = transitionMatrix(rec).map((row) => row.map((x) => x % m));
  const size = M.length;
  /** @type {(string | null)[][]} */
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  const start = [...rec.initial.slice().reverse(), ...(size > k ? [1] : [])].map((v) =>
    String(BigInt(v) % m),
  );
  let row = -1;
  /** @type {bigint[][]} */
  let R = [];
  /** @type {bigint[][]} */
  let P = [];
  let e = n;
  let covered = 0;
  let power = 1;
  /** @type {string[]} */
  let result = [];
  let answer = '';
  let matrixProducts = 0;
  /** @type {RecurrenceFrame[]} */
  const frames = [];

  /** @param {RecurrenceFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      order: k,
      size,
      n,
      mod,
      matrix: matrix.map((r) => r.slice()),
      row,
      r: strings(R),
      p: strings(P),
      e,
      covered,
      power,
      start: start.slice(),
      result: result.slice(),
      answer,
      matrixProducts,
      lines,
    });

  push('start', [0]);
  for (row = 0; row < size; row++) {
    matrix[row] = M[row].map(String);
    push('row', row === 0 ? [0, 1] : row < k ? [2] : [3]);
  }
  row = -1;
  R = M.map((r, i) => r.map((_, j) => (i === j ? 1n % m : 0n)));
  P = M.map((r) => r.slice());
  push('init', [4]);
  while (e > 0) {
    if (e % 2 === 1) {
      R = multiply(R, P, m);
      covered += power;
      matrixProducts++;
      push('multiply', [5, 6]);
    } else {
      push('skip', [5, 6]);
    }
    e = Math.floor(e / 2);
    if (e > 0) {
      P = multiply(P, P, m);
      power *= 2;
      matrixProducts++;
      push('square', [7]);
    } else {
      push('halve', [7]);
    }
  }
  const v0 = start.map(BigInt);
  result = R.map((r) => String(r.reduce((s, x, t) => (s + x * v0[t]) % m, 0n)));
  push('apply', [8]);
  answer = result[k - 1];
  push('done', [9]);
  return frames;
}

/**
 * The digits of a whole number written in decimal, lowest first.
 * @param {string} text
 */
export const digitsOf = (text) => [...text].reverse().map(Number);

/**
 * Reads a whole number of 1 to MAX_DIGITS digits with no leading zero (0 itself is fine).
 * @param {string} text
 * @returns {string | null}
 */
export function parseBig(text) {
  const t = text.replace(/[\s,]/g, '');
  if (!/^\d+$/.test(t) || t.length > MAX_DIGITS || (t.length > 1 && t[0] === '0')) return null;
  return t;
}

/**
 * @typedef {object} BigFrame
 * @property {'start'|'conv'|'carry'|'extra'|'done'} kind
 * @property {number[]} a  Digits of x, lowest first.
 * @property {number[]} b  Digits of y, lowest first.
 * @property {(number | null)[]} c  The convolution; null before it is summed.
 * @property {number} k  The coefficient or digit at hand; -1 when none.
 * @property {[number, number][]} terms  conv: the (i, k − i) pairs summed.
 * @property {number} t  carry: c[k] + carry.
 * @property {number[]} digits  The product’s digits so far, lowest first.
 * @property {number} carry
 * @property {number} products  Digit products so far.
 * @property {string} answer  The product, on the done frame.
 * @property {number[]} lines
 */

/**
 * Multiplies two whole numbers as a digit convolution followed by carrying.
 * @param {string} x
 * @param {string} y
 * @returns {BigFrame[]}
 */
export function bigTrace(x, y) {
  const a = digitsOf(x);
  const b = digitsOf(y);
  const len = a.length + b.length - 1;
  /** @type {(number | null)[]} */
  const c = Array(len).fill(null);
  let k = -1;
  /** @type {[number, number][]} */
  let terms = [];
  let t = 0;
  /** @type {number[]} */
  const digits = [];
  let carry = 0;
  let products = 0;
  let answer = '';
  /** @type {BigFrame[]} */
  const frames = [];

  /** @param {BigFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      a: a.slice(),
      b: b.slice(),
      c: c.slice(),
      k,
      terms: terms.map((p) => [p[0], p[1]]),
      t,
      digits: digits.slice(),
      carry,
      products,
      answer,
      lines,
    });

  push('start', [0]);
  for (k = 0; k < len; k++) {
    terms = [];
    let sum = 0;
    for (let i = Math.max(0, k - b.length + 1); i <= Math.min(k, a.length - 1); i++) {
      terms.push([i, k - i]);
      sum += a[i] * b[k - i];
      products++;
    }
    c[k] = sum;
    push('conv', [1, 2]);
  }
  terms = [];
  for (k = 0; k < len; k++) {
    t = /** @type {number} */ (c[k]) + carry;
    digits.push(t % 10);
    carry = Math.floor(t / 10);
    push('carry', k === 0 ? [3, 4, 5] : [4, 5]);
  }
  while (carry > 0) {
    t = carry;
    digits.push(carry % 10);
    carry = Math.floor(carry / 10);
    push('extra', [6]);
  }
  k = -1;
  while (digits.length > 1 && digits[digits.length - 1] === 0) digits.pop();
  answer = digits.slice().reverse().join('');
  push('done', [7]);
  return frames;
}

/** @type {Record<'fibonacci'|'constant'|'tribonacci', { rec: Recurrence, n: number, mod: number }>} */
export const RECURRENCE_PRESETS = {
  fibonacci: { rec: { coeffs: [1, 1], constant: 0, initial: [0, 1] }, n: 100, mod: 1_000_000_007 },
  constant: { rec: { coeffs: [2, 3], constant: 5, initial: [1, 1] }, n: 10, mod: 1_000_000_007 },
  tribonacci: {
    rec: { coeffs: [1, 1, 1], constant: 0, initial: [0, 0, 1] },
    n: 1_000_000_000_000,
    mod: 1_000_000_007,
  },
};

/** @type {Record<'small'|'carries'|'long', [string, string]>} */
export const BIG_PRESETS = {
  small: ['1234', '5678'],
  carries: ['9999', '9999'],
  long: ['314159265358', '271828182845'],
};
