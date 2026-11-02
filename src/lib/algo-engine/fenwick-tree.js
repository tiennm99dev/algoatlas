/**
 * Fenwick tree (binary indexed tree) for prefix sums with point updates. Indices are 1-based:
 * t[i] stores the sum of a[i − lowbit(i) + 1..i], where lowbit(i) = i & −i is the lowest set bit.
 *
 * - prefix(i): add t[i], then clear the lowest set bit (i −= lowbit(i)) until i is 0.
 * - add(i, delta): add delta to t[i], then jump to the next block containing i
 *   (i += lowbit(i)) until i passes n.
 * - rangeSum(l, r) = prefix(r) − prefix(l − 1).
 * - build: push each t[i] once into its parent t[i + lowbit(i)], which takes O(n).
 */

import { parseValueList } from './parse-values.js';

export const MAX_N = 16;
export const MIN_VALUE = -99;
export const MAX_VALUE = 99;
export const MAX_OPS = 8;

export const fenwickPseudocode = [
  'build(a):',
  '  for i = 1 to n: t[i] = t[i] + a[i]',
  '    if i + lowbit(i) ≤ n: t[i + lowbit(i)] += t[i]',
  'add(i, delta):',
  '  while i ≤ n:',
  '    t[i] = t[i] + delta',
  '    i = i + lowbit(i)',
  'prefix(i):',
  '  sum = 0',
  '  while i > 0:',
  '    sum = sum + t[i]',
  '    i = i − lowbit(i)',
  '  return sum',
  'rangeSum(l, r): return prefix(r) − prefix(l − 1)',
];

/**
 * @typedef {{ type: 'add', i: number, delta: number }
 *   | { type: 'prefix', i: number }
 *   | { type: 'range', l: number, r: number }} FenwickOp
 */

/**
 * @typedef {object} FenwickFrame
 * @property {'start'|'build-self'|'build-push'|'add-start'|'add-visit'|'add-jump'|'query-start'|'query-visit'|'query-jump'|'query-end'|'range-end'|'done'} kind
 * @property {number[]} a  The values, index 0 unused so a[1] is the first.
 * @property {number[]} t  The tree, index 0 unused.
 * @property {number} cursor  The index i the code is on, 0 when none.
 * @property {number} from  Start of the jump being drawn, 0 when none.
 * @property {number} to  End of the jump being drawn; may be 0 (query) or past n (add).
 * @property {number[]} visited  Indices of t this operation has touched, in order.
 * @property {number} opIndex  Index into the operations, -1 outside them.
 * @property {FenwickOp | null} op
 * @property {number | null} target  The i of the prefix being summed, null outside queries.
 * @property {number} sum  The running sum of the current prefix.
 * @property {number | null} upper  prefix(r), once a range query has it.
 * @property {number | null} result  The answer of the current query, once known.
 * @property {number} reads  Cells of t read by this operation.
 * @property {number} writes  Cells of t written by this operation.
 * @property {number} totalReads  Cells of t read by all operations so far.
 * @property {number} totalWrites  Cells of t written by all operations so far.
 * @property {number} buildSteps  Additions the build made.
 * @property {number[]} lines
 */

/** The lowest set bit of i. @param {number} i */
export const lowbit = (i) => i & -i;

/** First index of the block t[i] covers. @param {number} i */
export const blockStart = (i) => i - lowbit(i) + 1;

/**
 * Reads a comma- or space-separated list of whole numbers.
 * @param {string} text
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseFenwickValues(text) {
  return parseValueList(text, { min: MIN_VALUE, max: MAX_VALUE, maxN: MAX_N, signed: true });
}

/**
 * Builds the tree from `values` (a[1] = values[0]) and replays the operations. At the cap of 16
 * values and 8 range queries the trace has fewer than 250 frames.
 * @param {number[]} values
 * @param {FenwickOp[]} ops
 * @returns {FenwickFrame[]}
 */
export function fenwickTrace(values, ops) {
  const n = values.length;
  const a = [0, ...values];
  const t = Array(n + 1).fill(0);
  /** @type {FenwickFrame[]} */
  const frames = [];
  let cursor = 0;
  let from = 0;
  let to = 0;
  /** @type {number[]} */
  let visited = [];
  let opIndex = -1;
  /** @type {FenwickOp | null} */
  let op = null;
  /** @type {number | null} */
  let target = null;
  let sum = 0;
  /** @type {number | null} */
  let upper = null;
  /** @type {number | null} */
  let result = null;
  let reads = 0;
  let writes = 0;
  let totalReads = 0;
  let totalWrites = 0;
  let buildSteps = 0;

  /** @param {FenwickFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) => {
    frames.push({
      kind,
      a: a.slice(),
      t: t.slice(),
      cursor,
      from,
      to,
      visited: visited.slice(),
      opIndex,
      op,
      target,
      sum,
      upper,
      result,
      reads,
      writes,
      totalReads,
      totalWrites,
      buildSteps,
      lines,
    });
  };

  push('start', [0]);

  for (let i = 1; i <= n; i++) {
    cursor = i;
    from = 0;
    to = 0;
    t[i] += a[i];
    buildSteps++;
    push('build-self', [1]);
    const parent = i + lowbit(i);
    if (parent <= n) {
      from = i;
      to = parent;
      t[parent] += t[i];
      buildSteps++;
      push('build-push', [2]);
    }
  }

  /** @param {number} i */
  const runPrefix = (i) => {
    target = i;
    sum = 0;
    cursor = i;
    from = 0;
    to = 0;
    push('query-start', [7, 8]);
    while (cursor > 0) {
      from = 0;
      to = 0;
      sum += t[cursor];
      reads++;
      totalReads++;
      visited.push(cursor);
      push('query-visit', [9, 10]);
      from = cursor;
      to = cursor - lowbit(cursor);
      cursor = to;
      push('query-jump', [11]);
    }
    return sum;
  };

  for (const [index, next] of ops.entries()) {
    opIndex = index;
    op = { ...next };
    visited = [];
    reads = 0;
    writes = 0;
    upper = null;
    result = null;
    target = null;
    sum = 0;

    if (next.type === 'add') {
      a[next.i] += next.delta;
      cursor = next.i;
      from = 0;
      to = 0;
      push('add-start', [3]);
      while (cursor <= n) {
        from = 0;
        to = 0;
        t[cursor] += next.delta;
        writes++;
        totalWrites++;
        visited.push(cursor);
        push('add-visit', [4, 5]);
        from = cursor;
        to = cursor + lowbit(cursor);
        cursor = to;
        push('add-jump', [6]);
      }
    } else if (next.type === 'prefix') {
      result = runPrefix(next.i);
      from = 0;
      to = 0;
      push('query-end', [12]);
    } else {
      upper = runPrefix(next.r);
      from = 0;
      to = 0;
      push('query-end', [12]);
      const lower = runPrefix(next.l - 1);
      from = 0;
      to = 0;
      push('query-end', [12]);
      result = upper - lower;
      cursor = 0;
      push('range-end', [13]);
    }
  }

  cursor = 0;
  from = 0;
  to = 0;
  opIndex = -1;
  op = null;
  target = null;
  push('done', [0]);
  return frames;
}
