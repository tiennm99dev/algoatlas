/**
 * LUP decomposition by Gaussian elimination with partial pivoting, then LUP-SOLVE, as in CLRS
 * chapter 28 but 0-based. The matrix is factored in place: after column k is done, the
 * multipliers l[i][k] sit below the diagonal and row k of U on and above it, so P·A = L·U with
 * L unit lower triangular. Partial pivoting picks the row with the largest |a[i][k]| at or
 * below row k; the plain LU variant always pivots on a[k][k] and fails on a zero there even when
 * A is invertible. Arithmetic is exact with fractions, so the steps can be checked by hand.
 */

import { fabs, fcmp, fdiv, fmul, frac, fsub, isZero } from './rational.js';

/** @typedef {import('./rational.js').Frac} Frac */

export const MIN_SIZE = 2;
export const MAX_SIZE = 4;
export const MAX_ENTRY = 9;

/** Line names, mapped to indices per variant so each pseudocode is covered line by line. */
const LINES = {
  lup: ['loop', 'choose', 'zero', 'swap', 'rows', 'multiplier', 'update', 'forward', 'back', 'ret'],
  lu: ['loop', 'choose', 'zero', 'rows', 'multiplier', 'update', 'forward', 'back', 'ret'],
};

export const lupPseudocode = [
  'for k = 0 to n − 1:',
  '  p = the row i ≥ k with the largest |a[i][k]|',
  '  if a[p][k] = 0: stop, A is singular',
  '  swap rows k and p of a, and π[k] with π[p]',
  '  for i = k + 1 to n − 1:',
  '    a[i][k] = a[i][k] / a[k][k]      (into L)',
  '    a[i][j] −= a[i][k] · a[k][j] for j > k   (U)',
  'y[i] = b[π[i]] − Σ(j < i) l[i][j]·y[j], top down',
  'x[i] = (y[i] − Σ(j > i) u[i][j]·x[j]) / u[i][i], bottom up',
  'return x',
];

export const luPseudocode = [
  'for k = 0 to n − 1:',
  '  p = k   (no pivoting)',
  '  if a[k][k] = 0: stop, zero pivot',
  '  for i = k + 1 to n − 1:',
  '    a[i][k] = a[i][k] / a[k][k]      (into L)',
  '    a[i][j] −= a[i][k] · a[k][j] for j > k   (U)',
  'y[i] = b[i] − Σ(j < i) l[i][j]·y[j], top down',
  'x[i] = (y[i] − Σ(j > i) u[i][j]·x[j]) / u[i][i], bottom up',
  'return x',
];

/**
 * @typedef {object} LupFrame
 * @property {'start'|'pivot'|'swap'|'eliminate'|'factored'|'forward'|'back'|'stuck'|'done'} kind
 * @property {boolean} pivoting
 * @property {number} size
 * @property {Frac[][]} a  The working matrix: L below the diagonal of finished columns, U above.
 * @property {number[]} perm  π: row i of P·A is row π[i] of A.
 * @property {Frac[]} b
 * @property {(Frac | null)[]} y
 * @property {(Frac | null)[]} x
 * @property {number} k  The column being eliminated; -1 when none.
 * @property {number} row  pivot/swap: the pivot row p. eliminate: the row i. forward/back: i.
 * @property {number} finished  Columns of L (and rows of U) already final.
 * @property {Frac | null} multiplier  eliminate: l[i][k].
 * @property {boolean} failed  The factoring stopped on a zero pivot.
 * @property {number} swaps
 * @property {number} factorOps  Divisions and multiplications while factoring.
 * @property {number} solveOps  Multiplications and divisions while solving.
 * @property {number[]} lines
 */

/** @param {Frac[][]} a */
const copyMatrix = (a) => a.map((row) => row.map((f) => ({ ...f })));

/**
 * @param {number[][]} matrix  size × size whole numbers.
 * @param {number[]} rhs  size whole numbers.
 * @param {boolean} pivoting  true for LUP, false for plain LU.
 * @returns {LupFrame[]}
 */
export function lupTrace(matrix, rhs, pivoting) {
  const size = matrix.length;
  const names = pivoting ? LINES.lup : LINES.lu;
  /** @param {string[]} keys */
  const at = (...keys) => keys.map((key) => names.indexOf(key));
  const a = matrix.map((row) => row.map((v) => frac(v)));
  const b = rhs.map((v) => frac(v));
  const perm = Array.from({ length: size }, (_, i) => i);
  /** @type {(Frac | null)[]} */
  const y = Array(size).fill(null);
  /** @type {(Frac | null)[]} */
  const x = Array(size).fill(null);
  let k = -1;
  let row = -1;
  let finished = 0;
  /** @type {Frac | null} */
  let multiplier = null;
  let failed = false;
  let swaps = 0;
  let factorOps = 0;
  let solveOps = 0;
  /** @type {LupFrame[]} */
  const frames = [];

  /** @param {LupFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      pivoting,
      size,
      a: copyMatrix(a),
      perm: perm.slice(),
      b: b.map((f) => ({ ...f })),
      y: y.map((f) => (f ? { ...f } : null)),
      x: x.map((f) => (f ? { ...f } : null)),
      k,
      row,
      finished,
      multiplier: multiplier ? { ...multiplier } : null,
      failed,
      swaps,
      factorOps,
      solveOps,
      lines,
    });

  push('start', at('loop'));
  for (k = 0; k < size; k++) {
    multiplier = null;
    let p = k;
    if (pivoting) {
      for (let i = k + 1; i < size; i++) if (fcmp(fabs(a[i][k]), fabs(a[p][k])) > 0) p = i;
    }
    row = p;
    push('pivot', at('loop', 'choose', 'zero'));
    if (isZero(a[p][k])) {
      failed = true;
      push('stuck', at('zero'));
      push('done', at('zero'));
      return frames;
    }
    if (p !== k) {
      [a[k], a[p]] = [a[p], a[k]];
      [perm[k], perm[p]] = [perm[p], perm[k]];
      swaps++;
      push('swap', at('swap'));
    }
    for (let i = k + 1; i < size; i++) {
      row = i;
      multiplier = fdiv(a[i][k], a[k][k]);
      a[i][k] = multiplier;
      factorOps++;
      for (let j = k + 1; j < size; j++) {
        a[i][j] = fsub(a[i][j], fmul(multiplier, a[k][j]));
        factorOps++;
      }
      push(
        'eliminate',
        i === k + 1 ? at('rows', 'multiplier', 'update') : at('multiplier', 'update'),
      );
    }
    finished = k + 1;
  }
  k = -1;
  row = -1;
  multiplier = null;
  push('factored', at('loop'));

  for (let i = 0; i < size; i++) {
    row = i;
    let sum = b[perm[i]];
    for (let j = 0; j < i; j++) {
      sum = fsub(sum, fmul(a[i][j], /** @type {Frac} */ (y[j])));
      solveOps++;
    }
    y[i] = sum;
    push('forward', at('forward'));
  }
  for (let i = size - 1; i >= 0; i--) {
    row = i;
    let sum = /** @type {Frac} */ (y[i]);
    for (let j = i + 1; j < size; j++) {
      sum = fsub(sum, fmul(a[i][j], /** @type {Frac} */ (x[j])));
      solveOps++;
    }
    x[i] = fdiv(sum, a[i][i]);
    solveOps++;
    push('back', at('back'));
  }
  row = -1;
  push('done', at('ret'));
  return frames;
}

/**
 * Splits a finished working matrix into L (unit lower), U (upper) and P (P[i][π[i]] = 1).
 * @param {LupFrame} f
 */
export function splitFactors(f) {
  const n = f.size;
  const L = f.a.map((row, i) => row.map((v, j) => (j < i ? v : frac(i === j ? 1 : 0))));
  const U = f.a.map((row, i) => row.map((v, j) => (j >= i ? v : frac(0))));
  const P = f.perm.map((src) => Array.from({ length: n }, (_, j) => frac(j === src ? 1 : 0)));
  return { L, U, P };
}

/**
 * @type {Record<'clrs'|'zeroPivot'|'twoByTwo'|'fourByFour'|'singular', {a: number[][], b: number[]}>}
 */
export const LUP_PRESETS = {
  clrs: {
    a: [
      [1, 2, 0],
      [3, 4, 4],
      [5, 6, 3],
    ],
    b: [3, 7, 8],
  },
  zeroPivot: {
    a: [
      [0, 2, 1],
      [1, 1, 1],
      [2, 1, 3],
    ],
    b: [3, 3, 6],
  },
  twoByTwo: {
    a: [
      [1, 2],
      [3, 4],
    ],
    b: [5, 11],
  },
  fourByFour: {
    a: [
      [2, 1, 1, 0],
      [4, 3, 3, 1],
      [8, 7, 9, 5],
      [6, 7, 9, 8],
    ],
    b: [4, 11, 29, 30],
  },
  singular: {
    a: [
      [1, 2, 3],
      [2, 4, 6],
      [1, 0, 1],
    ],
    b: [1, 2, 3],
  },
};
