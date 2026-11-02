/**
 * Modular inverses and systems of congruences. An inverse comes from extended Euclid, which keeps
 * r ≡ t·a (mod m) on every row, or from Fermat’s little theorem when the modulus is prime. The
 * system is solved one congruence at a time: every number R + k·M satisfies the congruences merged
 * so far, so walking k moves only the clock of the next modulus, and an inverse finds the right k
 * directly. Moduli need not be coprime; a system that contradicts itself ends in `conflict`.
 */

export const MAX_INVERSE_VALUE = 9999;
export const MAX_INVERSE_MODULUS = 9999;
export const MAX_CONGRUENCES = 4;
export const MAX_CRT_MODULUS = 30;
export const MAX_CRT_REMAINDER = 999;

export const euclidPseudocode = [
  '(r₀, t₀) = (m, 0)',
  '(r₁, t₁) = (a mod m, 1)',
  'while r₁ ≠ 0:',
  '  q = ⌊r₀ / r₁⌋',
  '  (r₀, r₁) = (r₁, r₀ − q·r₁)',
  '  (t₀, t₁) = (t₁, t₀ − q·t₁)',
  'if r₀ ≠ 1: no inverse',
  'return t₀ mod m',
];

export const fermatPseudocode = [
  'if a ≡ 0 (mod p): no inverse',
  'x = 1, y = a mod p, e = p − 2',
  'while e > 0:',
  '  if e is odd: x = x · y mod p',
  '  y = y · y mod p',
  '  e = ⌊e / 2⌋',
  'return x   // a · x ≡ 1 (mod p)',
];

export const crtPseudocode = [
  '(R, M) = (r₁ mod m₁, m₁)',
  'for each next congruence x ≡ r (mod m):',
  '  g = gcd(M, m)',
  '  if g does not divide r − R: no solution',
  '  u = inverse of M/g modulo m/g',
  '  t = ((r − R)/g) · u mod (m/g)   // walk R + k·M up to k = t',
  '  (R, M) = (R + t·M, M · m/g)',
  'return x ≡ R (mod M)',
];

/**
 * @typedef {object} ModClock
 * @property {number} m
 * @property {number} goal  Where the hand must point.
 * @property {number} value  Where the hand points now.
 * @property {boolean} aligned
 * @property {'merged'|'now'|'later'} role  Already satisfied for good, being solved, or waiting.
 */

/**
 * @typedef {object} Congruence
 * @property {number} r
 * @property {number} m
 */

/**
 * @typedef {object} ModFrame
 * @property {'euclid'|'fermat'|'crt'} mode
 * @property {'start'|'step'|'bit'|'found'|'none'|'merge'|'conflict'|'inverse'|'walk'|'combine'|'done'} kind
 * @property {(number|string)[][]} rows  The table: columns depend on the mode.
 * @property {ModClock[]} clocks
 * @property {number} a  Inverse modes: the number to invert.
 * @property {number} m  Inverse modes: the modulus.
 * @property {number|null} inverse  Inverse modes: the answer, once known.
 * @property {number} g  The gcd of the last pair looked at.
 * @property {number} q  euclid: the last quotient.
 * @property {number} steps  Divisions in Euclid, loop rounds in Fermat, walked steps in the system.
 * @property {number} multiplications  fermat: products computed so far.
 * @property {number} e  fermat: what is left of the exponent.
 * @property {number} bit  fermat: the bit just read.
 * @property {Congruence[]} system  crt: the congruences, with remainders reduced.
 * @property {number} next  crt: the congruence being merged, -1 when none.
 * @property {number} R  crt: the running solution.
 * @property {number} M  crt: its modulus.
 * @property {number} u  crt: the inverse of M/g modulo m/g.
 * @property {number} t  crt: how many steps of M the next clock needs.
 * @property {number} k  crt: how many steps of M were walked for this congruence.
 * @property {number} candidate  crt: the number the clocks show.
 * @property {boolean|null} solvable  crt: whether the system has a solution, once known.
 * @property {number[]} lines
 */

const BLANK = {
  a: 0,
  m: 0,
  inverse: null,
  g: 0,
  q: 0,
  steps: 0,
  multiplications: 0,
  e: 0,
  bit: 0,
  next: -1,
  R: 0,
  M: 0,
  u: 0,
  t: 0,
  k: 0,
  candidate: 0,
  solvable: null,
};

/** A remainder that is never negative. @param {number} v @param {number} m */
const mod = (v, m) => ((v % m) + m) % m;

/**
 * Whether n is prime, by trial division: the page checks this before Fermat, which needs it.
 * @param {number} n
 */
export function isPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/** @param {number} a @param {number} b @returns {number} */
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

/**
 * The inverse of a modulo m, for coprime a and m. Modulo 1 everything is 0.
 * @param {number} a
 * @param {number} m
 */
function inverseOf(a, m) {
  let [r0, r1, t0, t1] = [m, mod(a, m), 0, 1];
  while (r1 !== 0) {
    const q = Math.floor(r0 / r1);
    [r0, r1] = [r1, r0 - q * r1];
    [t0, t1] = [t1, t0 - q * t1];
  }
  return mod(t0, m);
}

/**
 * The inverse of a modulo m by extended Euclid.
 * @param {number} a0
 * @param {number} m  At least 2.
 * @returns {ModFrame[]}
 */
export function euclidInverseTrace(a0, m) {
  const a = a0 % m;
  let [r0, r1, t0, t1] = [m, a, 0, 1];
  /** @type {(number|string)[][]} */
  const rows = [
    [m, '', 0],
    [a, '', 1],
  ];
  /** @type {ModFrame[]} */
  const frames = [];
  let steps = 0;
  let q = 0;
  /** @type {number|null} */
  let inverse = null;

  /** @param {ModFrame['kind']} kind @param {number[]} lines @param {number} value */
  const push = (kind, lines, value) =>
    frames.push({
      ...BLANK,
      system: [],
      mode: 'euclid',
      kind,
      rows: rows.map((row) => row.slice()),
      clocks: [{ m, goal: 1, value, aligned: value === 1, role: 'now' }],
      a: a0,
      m,
      inverse,
      g: r0,
      q,
      steps,
      lines,
    });

  push('start', [0, 1], a);

  while (r1 !== 0) {
    q = Math.floor(r0 / r1);
    [r0, r1] = [r1, r0 - q * r1];
    [t0, t1] = [t1, t0 - q * t1];
    steps++;
    rows.push([r1, q, t1]);
    push('step', [2, 3, 4, 5], r1);
  }

  if (r0 === 1) {
    inverse = mod(t0, m);
    push('found', [7], 1);
  } else {
    push('none', [6], 0);
  }
  push('done', [], r0 === 1 ? 1 : 0);
  return frames;
}

/**
 * The inverse of a modulo a prime p by Fermat: a^(p−2).
 * @param {number} a0
 * @param {number} p  A prime.
 * @returns {ModFrame[]}
 */
export function fermatInverseTrace(a0, p) {
  const a = a0 % p;
  let [x, y, e] = [1, a, p - 2];
  /** @type {(number|string)[][]} */
  const rows = [];
  /** @type {ModFrame[]} */
  const frames = [];
  let steps = 0;
  let multiplications = 0;
  let bit = 0;
  /** @type {number|null} */
  let inverse = null;

  /** @param {ModFrame['kind']} kind @param {number[]} lines @param {number} value */
  const push = (kind, lines, value) =>
    frames.push({
      ...BLANK,
      system: [],
      mode: 'fermat',
      kind,
      rows: rows.map((row) => row.slice()),
      clocks: [{ m: p, goal: 1, value, aligned: value === 1, role: 'now' }],
      a: a0,
      m: p,
      inverse,
      g: a === 0 ? p : 1,
      steps,
      multiplications,
      e,
      bit,
      lines,
    });

  if (a === 0) {
    push('start', [0], 0);
    push('none', [0], 0);
    push('done', [], 0);
    return frames;
  }

  push('start', [0, 1], a);

  while (e > 0) {
    bit = e % 2;
    const before = e;
    if (bit === 1) {
      x = (x * y) % p;
      multiplications++;
    }
    const used = y;
    y = (y * y) % p;
    multiplications++;
    e = Math.floor(e / 2);
    steps++;
    rows.push([before, bit, used, x]);
    push('bit', [2, 3, 4, 5], (a * x) % p);
  }

  inverse = x;
  push('found', [6], (a * x) % p);
  push('done', [], (a * x) % p);
  return frames;
}

/**
 * Solves x ≡ r (mod m) for a list of congruences, merging them in order.
 * @param {Congruence[]} given
 * @returns {ModFrame[]}
 */
export function crtTrace(given) {
  const system = given.map(({ r, m }) => ({ r: r % m, m }));
  /** @type {(number|string)[][]} */
  const rows = [];
  /** @type {ModFrame[]} */
  const frames = [];
  let R = system[0].r;
  let M = system[0].m;
  let merged = 1;
  let next = -1;
  let g = 0;
  let u = 0;
  let t = 0;
  let k = 0;
  let steps = 0;
  /** @type {boolean|null} */
  let solvable = null;

  /** @param {ModFrame['kind']} kind @param {number[]} lines @param {number} candidate */
  const push = (kind, lines, candidate) =>
    frames.push({
      ...BLANK,
      mode: 'crt',
      kind,
      rows: rows.map((row) => row.slice()),
      clocks: system.map(({ r, m }, i) => {
        const value = candidate % m;
        /** @type {ModClock['role']} */
        const role = i < merged ? 'merged' : i === next ? 'now' : 'later';
        return { m, goal: r, value, aligned: value === r, role };
      }),
      g,
      steps,
      system: system.map((c) => ({ ...c })),
      next,
      R,
      M,
      u,
      t,
      k,
      candidate,
      solvable,
      lines,
    });

  rows.push([1, R, M]);
  push('start', [0], R);

  for (let i = 1; i < system.length; i++) {
    const { r, m } = system[i];
    next = i;
    g = gcd(M, m);
    k = 0;
    push('merge', [1, 2], R);
    if ((r - R) % g !== 0) {
      solvable = false;
      push('conflict', [3], R);
      next = -1;
      push('done', [], R);
      return frames;
    }
    const step = m / g;
    u = inverseOf(M / g, step);
    t = mod(((r - R) / g) * u, step);
    push('inverse', [4], R);
    for (k = 1; k <= t; k++) {
      steps++;
      push('walk', [5], R + k * M);
    }
    k = t;
    R += t * M;
    M *= step;
    merged = i + 1;
    rows.push([i + 1, R, M]);
    push('combine', [6], R);
  }

  solvable = true;
  next = -1;
  push('done', [7], R);
  return frames;
}

/**
 * Reads a system typed as `2 mod 3, 3 mod 5`. Failures are reported in this order: a piece that
 * is not `r mod m` (`format`), a value out of range (`range`), too many congruences (`count`).
 * @param {string} text
 * @returns {{ system: Congruence[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseSystem(text) {
  const pieces = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (pieces.length === 0) return { error: 'format' };
  const system = [];
  for (const piece of pieces) {
    const match = /^(\d+)\s*(?:mod|%)\s*(\d+)$/i.exec(piece);
    if (!match) return { error: 'format' };
    system.push({ r: Number(match[1]), m: Number(match[2]) });
  }
  if (system.some(({ r, m }) => r > MAX_CRT_REMAINDER || m < 2 || m > MAX_CRT_MODULUS)) {
    return { error: 'range' };
  }
  if (system.length > MAX_CONGRUENCES) return { error: 'count' };
  return { system };
}

/**
 * Writes a system the way parseSystem reads it.
 * @param {Congruence[]} system
 */
export const formatSystem = (system) => system.map(({ r, m }) => `${r} mod ${m}`).join(', ');

/** @type {Record<'simple'|'noInverse'|'bigPrime', {a: number, m: number}>} */
export const INVERSE_PRESETS = {
  simple: { a: 3, m: 7 },
  noInverse: { a: 4, m: 6 },
  bigPrime: { a: 1234, m: 9973 },
};

/** @type {Record<'sunTzu'|'four'|'shared'|'conflict', string>} */
export const CRT_PRESETS = {
  sunTzu: '2 mod 3, 3 mod 5, 2 mod 7',
  four: '1 mod 3, 4 mod 5, 6 mod 7, 10 mod 11',
  shared: '1 mod 4, 3 mod 6',
  conflict: '1 mod 4, 2 mod 6',
};
