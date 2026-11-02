/**
 * Binary exponentiation, right to left: read the exponent’s bits from the lowest, square x at
 * each bit so x ≡ a^(2^k), and multiply it into the result when the bit is 1. Reducing mod m
 * after each multiplication keeps every number below m, because (x·y) mod m depends only on
 * x mod m and y mod m. Products can reach about 10^18, so they are computed with BigInt.
 */

export const MAX_BASE = 1_000_000_000;
export const MAX_EXPONENT = 1_000_000_000;
export const MAX_MODULUS = 1_000_000_007;

export const powPseudocode = [
  'result = 1 mod m',
  'x = a mod m',
  'while e > 0:',
  '  if e is odd:',
  '    result = result · x mod m',
  '  x = x · x mod m',
  '  e = ⌊e / 2⌋',
  'return result',
];

/**
 * @typedef {object} PowRow
 * @property {number} k  The bit position.
 * @property {number} power  2^k.
 * @property {number} x  a^(2^k) mod m.
 * @property {number} bit
 */

/**
 * @typedef {object} PowFrame
 * @property {'start'|'bit'|'multiply'|'square'|'done'} kind
 * @property {number} a
 * @property {number} e0  The exponent as given.
 * @property {number} m
 * @property {number[]} bits  The exponent’s bits, highest first.
 * @property {number} k  The bit being read, counted from the lowest; -1 when none.
 * @property {number} e  What is left of the exponent.
 * @property {number} x  a^(2^k) mod m.
 * @property {number} result
 * @property {number} before  multiply: the result before this step. square: x before this step.
 * @property {number} covered  result ≡ a^covered: the part of the exponent already used.
 * @property {PowRow[]} rows
 * @property {number[]} used  The powers 2^k multiplied in so far.
 * @property {number} multiplications
 * @property {number} productDigits  Digits of the largest product computed so far.
 * @property {number[]} lines
 */

/**
 * Digits of a^e written out in full, the size the reduction avoids.
 * @param {number} a
 * @param {number} e
 * @returns {number}
 */
export function powerDigits(a, e) {
  if (e === 0 || a <= 1) return 1;
  return Math.floor(e * Math.log10(a)) + 1;
}

/** @param {number} e */
function bitsOf(e) {
  return [...e.toString(2)].map(Number);
}

/**
 * @param {number} a  From 0 to MAX_BASE.
 * @param {number} e0  From 0 to MAX_EXPONENT.
 * @param {number} m  From 1 to MAX_MODULUS.
 * @returns {PowFrame[]}
 */
export function powTrace(a, e0, m) {
  const big = BigInt(m);
  let x = a % m;
  let result = 1 % m;
  let e = e0;
  let k = -1;
  let before = 0;
  let covered = 0;
  let multiplications = 0;
  let productDigits = 1;
  const bits = bitsOf(e0);
  /** @type {PowRow[]} */
  const rows = [];
  /** @type {number[]} */
  const used = [];
  /** @type {PowFrame[]} */
  const frames = [];

  /** @param {number} p @param {number} q */
  const times = (p, q) => {
    const product = BigInt(p) * BigInt(q);
    multiplications++;
    productDigits = Math.max(productDigits, product.toString().length);
    return Number(product % big);
  };

  /** @param {PowFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      a,
      e0,
      m,
      bits: bits.slice(),
      k,
      e,
      x,
      result,
      before,
      covered,
      rows: rows.map((row) => ({ ...row })),
      used: used.slice(),
      multiplications,
      productDigits,
      lines,
    });

  push('start', [0, 1]);

  let power = 1;
  while (e > 0) {
    k++;
    const bit = e % 2;
    rows.push({ k, power, x, bit });
    push('bit', [2, 3]);
    if (bit === 1) {
      before = result;
      result = times(result, x);
      covered += power;
      used.push(power);
      push('multiply', [4]);
    }
    before = x;
    x = times(x, x);
    e = Math.floor(e / 2);
    power *= 2;
    push('square', [5, 6]);
  }

  k = -1;
  push('done', [7]);
  return frames;
}

/** @type {Record<'classic'|'onlyOneBit'|'allOnes'|'fermat'|'huge', {a: number, e: number, m: number}>} */
export const POW_PRESETS = {
  classic: { a: 3, e: 13, m: 7 },
  onlyOneBit: { a: 2, e: 1024, m: 1000 },
  allOnes: { a: 5, e: 255, m: 1000 },
  fermat: { a: 7, e: 12, m: 13 },
  huge: { a: 2, e: 1_000_000_000, m: 1_000_000_007 },
};
