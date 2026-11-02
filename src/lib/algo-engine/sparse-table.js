/**
 * Sparse table over a static array: st[k][i] holds op(a[i], …, a[i + 2^k − 1]), the answer for
 * the block of length 2^k that starts at i. A block is built from the two half-length blocks
 * inside it, level by level, in O(n log n).
 *
 * A query on a[l..r] (0-based, inclusive) takes k = ⌊log₂(r − l + 1)⌋ and combines the two blocks
 * of length 2^k that start at l and end at r. Together they cover the range, and they always
 * overlap, because 2·2^k exceeds the range length. That is harmless only for an idempotent
 * operation, where op(x, x) = x, such as min, max or gcd. Sum is included to show the failure.
 */

export const MAX_N = 16;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;

/** @typedef {'min' | 'max' | 'gcd' | 'sum'} SparseOp */

export const SPARSE_OPS = /** @type {SparseOp[]} */ (['min', 'max', 'gcd', 'sum']);

export const sparsePseudocode = [
  'build(a):',
  '  for i = 0 to n − 1: st[0][i] = a[i]',
  '  for k = 1 while 2^k ≤ n:',
  '    for i = 0 while i + 2^k ≤ n:',
  '      st[k][i] = op(st[k − 1][i], st[k − 1][i + 2^(k − 1)])',
  'query(l, r):',
  '  k = ⌊log₂(r − l + 1)⌋',
  '  left = st[k][l]',
  '  right = st[k][r − 2^k + 1]',
  '  return op(left, right)',
];

/**
 * @typedef {object} SparseFrame
 * @property {'start'|'base'|'cell'|'pick-k'|'left'|'right'|'combine'|'done'} kind
 * @property {SparseOp} op
 * @property {number[]} items  The input array.
 * @property {(number|null)[][]} table  st[k][i], null until filled and where the block would
 *   run past the end of the array.
 * @property {number} level  The level k being filled or used, -1 when none.
 * @property {number} at  Start index of the block being filled, -1 when none.
 * @property {number} l  Left end of the query.
 * @property {number} r  Right end of the query (inclusive).
 * @property {number} leftAt  Start of the left query block, -1 until read.
 * @property {number} rightAt  Start of the right query block, -1 until read.
 * @property {number} overlap  Cells both query blocks cover, 0 until both are read.
 * @property {number | null} leftValue  st[k][l] once read.
 * @property {number | null} rightValue  st[k][r − 2^k + 1] once read.
 * @property {number | null} result  op(left, right) once combined.
 * @property {number} truth  op over a[l..r] element by element, the independent answer.
 * @property {number} filled  Table cells filled so far.
 * @property {number} merges  Calls to op while building.
 * @property {number} reads  Table cells read by the query.
 * @property {number[]} lines
 */

/** @param {number} a @param {number} b @returns {number} */
export function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/** @param {SparseOp} op @param {number} a @param {number} b */
export function combine(op, a, b) {
  if (op === 'min') return Math.min(a, b);
  if (op === 'max') return Math.max(a, b);
  if (op === 'gcd') return gcd(a, b);
  return a + b;
}

/** ⌊log₂ x⌋ for x ≥ 1. @param {number} x */
export const floorLog2 = (x) => 31 - Math.clz32(x);

/** op over a[l..r] by reading every element. @param {number[]} a @param {number} l @param {number} r @param {SparseOp} op */
export function foldRange(a, l, r, op) {
  let acc = a[l];
  for (let i = l + 1; i <= r; i++) acc = combine(op, acc, a[i]);
  return acc;
}

/**
 * Reads a comma- or space-separated list of whole numbers.
 * @param {string} text
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseSparseValues(text) {
  const tokens = text
    .replace(/[−–]/g, '-')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^-?\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * Builds the table, then answers one query. The query starts at the frame of kind 'pick-k'.
 * At the cap of 16 values the trace has 42 cell frames plus 7 others.
 * @param {number[]} values  1 to MAX_N entries.
 * @param {number} l
 * @param {number} r
 * @param {SparseOp} op
 * @returns {SparseFrame[]}
 */
export function sparseTrace(values, l, r, op) {
  const n = values.length;
  const levels = floorLog2(n) + 1;
  /** @type {(number|null)[][]} */
  const table = Array.from({ length: levels }, () => Array(n).fill(null));
  const truth = foldRange(values, l, r, op);
  /** @type {SparseFrame[]} */
  const frames = [];
  let filled = 0;
  let merges = 0;
  let reads = 0;
  let level = -1;
  let at = -1;
  let leftAt = -1;
  let rightAt = -1;
  let overlap = 0;
  /** @type {number | null} */
  let leftValue = null;
  /** @type {number | null} */
  let rightValue = null;
  /** @type {number | null} */
  let result = null;

  /** @param {SparseFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) => {
    frames.push({
      kind,
      op,
      items: values.slice(),
      table: table.map((row) => row.slice()),
      level,
      at,
      l,
      r,
      leftAt,
      rightAt,
      overlap,
      leftValue,
      rightValue,
      result,
      truth,
      filled,
      merges,
      reads,
      lines,
    });
  };

  push('start', [0]);

  level = 0;
  for (let i = 0; i < n; i++) table[0][i] = values[i];
  filled = n;
  push('base', [1]);

  for (let k = 1; 1 << k <= n; k++) {
    level = k;
    const half = 1 << (k - 1);
    for (let i = 0; i + (1 << k) <= n; i++) {
      at = i;
      table[k][i] = combine(
        op,
        /** @type {number} */ (table[k - 1][i]),
        /** @type {number} */ (table[k - 1][i + half]),
      );
      filled++;
      merges++;
      push('cell', [2, 3, 4]);
    }
  }

  at = -1;
  const k = floorLog2(r - l + 1);
  level = k;
  push('pick-k', [5, 6]);

  leftAt = l;
  leftValue = table[k][l];
  reads++;
  push('left', [7]);

  rightAt = r - (1 << k) + 1;
  rightValue = table[k][rightAt];
  reads++;
  overlap = leftAt + (1 << k) - rightAt;
  push('right', [8]);

  result = combine(op, /** @type {number} */ (leftValue), /** @type {number} */ (rightValue));
  push('combine', [9]);

  push('done', [9]);
  return frames;
}
