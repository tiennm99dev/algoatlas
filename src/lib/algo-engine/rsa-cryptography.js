/**
 * Textbook RSA with small primes: key generation, encryption and decryption of one number, plus
 * the attacker who factors n by trial division. Toy sizes keep every product under 2^53, so plain
 * numbers are exact. Real RSA uses primes of over 300 digits and random padding.
 */

import { gcd } from './number-theory.js';

export const MAX_PRIME = 499;
export const MIN_PRIME = 3;

export const rsaPseudocode = [
  'n = p · q',
  'φ = (p − 1) · (q − 1)',
  'choose e with 1 < e < φ and gcd(e, φ) = 1',
  'd = e⁻¹ mod φ, by extended Euclid',
  'publish (n, e); keep d secret',
  'c = M^e mod n',
  'M′ = c^d mod n',
  'return M′',
];

export const attackPseudocode = [
  'try = 2',
  'while n mod try ≠ 0:',
  '  try = next candidate',
  'p = try, q = n / try',
  'φ = (p − 1) · (q − 1), d = e⁻¹ mod φ',
  'M = c^d mod n',
];

/**
 * The smallest usable public exponent for φ: every φ here is at least 8, and has a coprime below
 * itself because φ − 1 always qualifies.
 * @param {number} phi
 */
export function smallestExponent(phi) {
  let e = 3;
  while (gcd(e, phi) !== 1) e += 2;
  return e;
}

/** @param {number} e @param {number} phi */
export const validExponent = (e, phi) =>
  Number.isInteger(e) && e > 1 && e < phi && gcd(e, phi) === 1;

/**
 * @typedef {object} EuclidRow
 * @property {number} q  The quotient that led here; 0 on the first two rows.
 * @property {number} r  The remainder.
 * @property {number} t  The coefficient: r ≡ t·e (mod φ).
 */

/**
 * The extended Euclid table for e mod φ.
 * @param {number} e
 * @param {number} phi
 * @returns {{ rows: EuclidRow[], d: number }}
 */
export function euclidRows(e, phi) {
  /** @type {EuclidRow[]} */
  const rows = [
    { q: 0, r: phi, t: 0 },
    { q: 0, r: e, t: 1 },
  ];
  while (rows[rows.length - 1].r > 1) {
    const [a, b] = rows.slice(-2);
    const q = Math.floor(a.r / b.r);
    rows.push({ q, r: a.r - q * b.r, t: a.t - q * b.t });
  }
  const last = rows[rows.length - 1].t;
  return { rows, d: ((last % phi) + phi) % phi };
}

/**
 * @typedef {object} PowerState
 * @property {number} base
 * @property {number} exponent
 * @property {number[]} bits  The exponent's bits, highest first.
 * @property {number} k  The bit being read, from the lowest.
 * @property {number} x  base^(2^k) mod n.
 * @property {number} result
 * @property {number} before  The value this step changed.
 * @property {boolean} multiplied  Whether this bit multiplied x in.
 */

/**
 * The frames of one right-to-left square-and-multiply run: one frame per exponent bit, showing
 * the multiplication if the bit is 1 and then the squaring.
 * @param {number} base
 * @param {number} exponent
 * @param {number} n
 * @returns {PowerState[]}
 */
export function powerSteps(base, exponent, n) {
  const bits = [...exponent.toString(2)].map(Number);
  /** @type {PowerState[]} */
  const steps = [];
  let x = base % n;
  let result = 1 % n;
  let e = exponent;
  for (let k = 0; e > 0; k++) {
    const multiplied = e % 2 === 1;
    const before = result;
    if (multiplied) result = (result * x) % n;
    steps.push({ base, exponent, bits, k, x, result, before, multiplied });
    x = (x * x) % n;
    e = Math.floor(e / 2);
  }
  return steps;
}

/**
 * @typedef {object} RsaFrame
 * @property {'start'|'modulus'|'phi'|'public'|'euclid'|'private'|'keys'|'encrypt'|'cipher'|'decrypt'|'recovered'|'done'} kind
 * @property {number} p
 * @property {number} q
 * @property {number} e
 * @property {number} M
 * @property {number|null} n
 * @property {number|null} phi
 * @property {number|null} d
 * @property {number|null} c
 * @property {number|null} recovered
 * @property {EuclidRow[]} euclid
 * @property {PowerState|null} power  The current bit of a power run.
 * @property {number} multiplications  Modular multiplications used by both powers so far.
 * @property {number[]} lines
 */

/**
 * @param {number} p  A prime from MIN_PRIME to MAX_PRIME.
 * @param {number} q  Another prime in that range.
 * @param {number} e  Valid for φ.
 * @param {number} M  From 0 to n − 1.
 * @returns {RsaFrame[]}
 */
export function rsaTrace(p, q, e, M) {
  /** @type {RsaFrame[]} */
  const frames = [];
  /** @type {number|null} */
  let n = null;
  /** @type {number|null} */
  let phi = null;
  /** @type {number|null} */
  let d = null;
  /** @type {number|null} */
  let c = null;
  /** @type {number|null} */
  let recovered = null;
  /** @type {EuclidRow[]} */
  let euclid = [];
  let multiplications = 0;

  /** @param {RsaFrame['kind']} kind @param {number[]} lines @param {PowerState|null} [power] */
  const push = (kind, lines, power = null) =>
    frames.push({
      kind,
      p,
      q,
      e,
      M,
      n,
      phi,
      d,
      c,
      recovered,
      euclid: euclid.map((row) => ({ ...row })),
      power: power ? { ...power, bits: power.bits.slice() } : null,
      multiplications,
      lines,
    });

  push('start', [0]);
  n = p * q;
  push('modulus', [0]);
  phi = (p - 1) * (q - 1);
  push('phi', [1]);
  push('public', [2]);
  const solved = euclidRows(e, phi);
  for (let i = 2; i <= solved.rows.length; i++) {
    euclid = solved.rows.slice(0, i);
    push('euclid', [3]);
  }
  d = solved.d;
  push('private', [3]);
  push('keys', [4]);
  const modulus = n;

  /** @param {'encrypt'|'decrypt'} kind @param {number} base @param {number} exponent @param {number} line */
  const runPower = (kind, base, exponent, line) => {
    const steps = powerSteps(base, exponent, modulus);
    for (const step of steps) {
      multiplications += step.multiplied ? 2 : 1;
      push(kind, [line], step);
    }
    return steps[steps.length - 1].result;
  };

  c = runPower('encrypt', M, e, 5);
  push('cipher', [5]);
  recovered = runPower('decrypt', c, d, 6);
  push('recovered', [6]);
  push('done', [7]);
  return frames;
}

/**
 * @typedef {object} AttackFrame
 * @property {'start'|'try'|'found'|'private'|'done'} kind
 * @property {number} n
 * @property {number} e
 * @property {number} c
 * @property {number} candidate  The divisor being tried; 0 at the start.
 * @property {number} remainder  n mod candidate.
 * @property {number} trials
 * @property {number|null} p
 * @property {number|null} q
 * @property {number|null} phi
 * @property {number|null} d
 * @property {number|null} M
 * @property {number[]} lines
 */

/**
 * Factors n by trying 2 and then the odd numbers, then rebuilds the private key.
 * @param {number} n  A product of two odd primes.
 * @param {number} e
 * @param {number} c
 * @returns {AttackFrame[]}
 */
export function attackTrace(n, e, c) {
  /** @type {AttackFrame[]} */
  const frames = [];
  let candidate = 0;
  let remainder = 0;
  let trials = 0;
  /** @type {number|null} */
  let p = null;
  /** @type {number|null} */
  let q = null;
  /** @type {number|null} */
  let phi = null;
  /** @type {number|null} */
  let d = null;
  /** @type {number|null} */
  let M = null;

  /** @param {AttackFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({ kind, n, e, c, candidate, remainder, trials, p, q, phi, d, M, lines });

  push('start', [0]);
  candidate = 2;
  remainder = n % candidate;
  trials = 1;
  push('try', [1]);
  while (remainder !== 0) {
    candidate = candidate === 2 ? 3 : candidate + 2;
    remainder = n % candidate;
    trials++;
    push('try', [1, 2]);
  }
  p = candidate;
  q = n / candidate;
  push('found', [3]);
  phi = (p - 1) * (q - 1);
  d = euclidRows(e, phi).d;
  push('private', [4]);
  const steps = powerSteps(c, d, n);
  M = steps[steps.length - 1].result;
  push('done', [5]);
  return frames;
}

/**
 * Roughly how long trial division takes on an n of this many digits, trying only odd numbers up
 * to √n at a billion a second, as a base-10 exponent of years. Negative means well under a year.
 * @param {number} digits
 */
export function trialYearsExponent(digits) {
  const SECONDS_PER_YEAR = 3.156e7;
  const logTrials = digits / 2 - Math.log10(2);
  return logTrials - 9 - Math.log10(SECONDS_PER_YEAR);
}

/** Sizes of n in decimal digits for the scale table: toy, small, RSA-1024 and RSA-2048. */
export const KEY_DIGITS = [6, 20, 40, 100, 309, 617];

/** @type {Record<'classic'|'tiny'|'multiple'|'largest', {p: number, q: number, e: number, M: number}>} */
export const RSA_PRESETS = {
  classic: { p: 61, q: 53, e: 17, M: 65 },
  tiny: { p: 3, q: 11, e: 3, M: 2 },
  multiple: { p: 61, q: 53, e: 17, M: 122 },
  largest: { p: 499, q: 491, e: 17, M: 123456 },
};
