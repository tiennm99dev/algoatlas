/**
 * Step trace for a binary heap stored in a 0-based array: slot i has children 2i + 1 and
 * 2i + 2 and parent ⌊(i − 1) / 2⌋. The heap runs a log of operations from empty. Insert
 * appends the value and sifts it up; extract takes the root, moves the last slot into the
 * root and sifts it down. A min-heap keeps the smallest value on top, a max-heap the largest.
 */

/**
 * @typedef {'min'|'max'} HeapKind
 * @typedef {{type: 'insert', value: number} | {type: 'extract'}} HeapOp
 * @typedef {'build'|'drain'|'sorted'|'random'} HeapOpsPreset
 */

/**
 * @typedef {object} BinaryHeapFrame
 * @property {'start'|'insert'|'up-compare'|'up-swap'|'up-root'|'extract'|'down-children'|'down-compare'|'down-swap'|'down-leaf'|'returned'|'empty'|'done'} kind
 * @property {HeapKind} heap
 * @property {number[]} values  The heap array after this step.
 * @property {number} opIndex  The operation this step belongs to; -1 on start and done.
 * @property {number} node  The slot being sifted; -1 when none.
 * @property {number} other  The parent (sift up) or the chosen child (sift down); -1 when none.
 * @property {number[]} focus  Slots read or written by this step.
 * @property {boolean} [stop]  On a compare: heap order already holds, so the sift stops.
 * @property {number | null} value  The value inserted or removed by the current operation.
 * @property {number[]} out  Values removed so far, in order.
 * @property {number} comparisons  Running total of key comparisons.
 * @property {number} swaps  Running total of swaps.
 * @property {number[]} lines
 */

export const MAX_SIZE = 15;
export const MAX_OPS = 24;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;

export const minHeapPseudocode = [
  'insert(x):',
  '  append x; i = n − 1          // the new last slot',
  '  while i > 0 and a[i] < a[parent(i)]:',
  '    swap(a[i], a[parent(i)]); i = parent(i)',
  'extractMin():',
  '  top = a[0]; a[0] = last; n = n − 1; i = 0',
  '  while i has a child (2i + 1 < n):',
  '    c = the smaller child of i',
  '    if a[c] ≥ a[i]: stop',
  '    swap(a[i], a[c]); i = c',
  '  return top',
];

export const maxHeapPseudocode = [
  'insert(x):',
  '  append x; i = n − 1          // the new last slot',
  '  while i > 0 and a[i] > a[parent(i)]:',
  '    swap(a[i], a[parent(i)]); i = parent(i)',
  'extractMax():',
  '  top = a[0]; a[0] = last; n = n − 1; i = 0',
  '  while i has a child (2i + 1 < n):',
  '    c = the larger child of i',
  '    if a[c] ≤ a[i]: stop',
  '    swap(a[i], a[c]); i = c',
  '  return top',
];

/** @param {HeapKind} heap */
export const heapPseudocode = (heap) => (heap === 'min' ? minHeapPseudocode : maxHeapPseudocode);

/** @param {number} i */
export const parentOf = (i) => Math.floor((i - 1) / 2);

/**
 * Whether `a` keeps heap order: no child comes before its parent.
 * @param {number[]} a @param {HeapKind} heap
 */
export function isHeap(a, heap) {
  for (let i = 1; i < a.length; i++) {
    const p = a[parentOf(i)];
    if (heap === 'min' ? a[i] < p : a[i] > p) return false;
  }
  return true;
}

/**
 * The heap size after running `ops`: extracts on an empty heap change nothing.
 * @param {HeapOp[]} ops
 */
export function sizeAfter(ops) {
  let n = 0;
  for (const op of ops) n = op.type === 'insert' ? n + 1 : Math.max(0, n - 1);
  return n;
}

/**
 * @param {HeapOp[]} ops
 * @param {HeapKind} [heap]
 * @returns {BinaryHeapFrame[]}
 */
export function binaryHeapTrace(ops, heap = 'min') {
  /** @type {number[]} */
  const a = [];
  /** @type {number[]} */
  const out = [];
  /** @type {BinaryHeapFrame[]} */
  const frames = [];
  let comparisons = 0;
  let swaps = 0;
  let opIndex = -1;
  /** @type {number | null} */
  let value = null;
  /** True when x must sit above y. @param {number} x @param {number} y */
  const before = (x, y) => (heap === 'min' ? x < y : x > y);

  /** @param {Pick<BinaryHeapFrame, 'kind'|'lines'> & Partial<BinaryHeapFrame>} f */
  const push = (f) =>
    frames.push({
      node: -1,
      other: -1,
      focus: [],
      ...f,
      heap,
      values: a.slice(),
      opIndex,
      value,
      out: out.slice(),
      comparisons,
      swaps,
    });

  push({ kind: 'start', lines: [] });
  ops.forEach((op, k) => {
    opIndex = k;
    if (op.type === 'insert') {
      value = op.value;
      a.push(op.value);
      let i = a.length - 1;
      push({ kind: 'insert', lines: [0, 1], node: i, focus: [i] });
      while (i > 0) {
        const p = parentOf(i);
        comparisons++;
        const stop = !before(a[i], a[p]);
        push({ kind: 'up-compare', lines: [2], node: i, other: p, focus: [i, p], stop });
        if (stop) return;
        [a[i], a[p]] = [a[p], a[i]];
        swaps++;
        push({ kind: 'up-swap', lines: [3], node: p, other: i, focus: [i, p] });
        i = p;
      }
      push({ kind: 'up-root', lines: [2], node: 0, focus: [0] });
      return;
    }

    if (a.length === 0) {
      value = null;
      push({ kind: 'empty', lines: [4] });
      return;
    }
    value = a[0];
    out.push(a[0]);
    const last = /** @type {number} */ (a.pop());
    if (a.length === 0) {
      push({ kind: 'extract', lines: [4, 5] });
      push({ kind: 'returned', lines: [6, 10] });
      return;
    }
    a[0] = last;
    push({ kind: 'extract', lines: [4, 5], node: 0, focus: [0] });
    let i = 0;
    while (2 * i + 1 < a.length) {
      const left = 2 * i + 1;
      const right = left + 1;
      let c = left;
      if (right < a.length) {
        comparisons++;
        if (before(a[right], a[left])) c = right;
      }
      push({
        kind: 'down-children',
        lines: [6, 7],
        node: i,
        other: c,
        focus: right < a.length ? [left, right] : [left],
      });
      comparisons++;
      const stop = !before(a[c], a[i]);
      push({ kind: 'down-compare', lines: [8], node: i, other: c, focus: [i, c], stop });
      if (stop) break;
      [a[i], a[c]] = [a[c], a[i]];
      swaps++;
      push({ kind: 'down-swap', lines: [9], node: c, other: i, focus: [i, c] });
      i = c;
    }
    if (2 * i + 1 >= a.length) push({ kind: 'down-leaf', lines: [6], node: i, focus: [i] });
    push({ kind: 'returned', lines: [10] });
  });
  opIndex = -1;
  value = null;
  push({ kind: 'done', lines: [] });
  return frames;
}

/**
 * A ready-made operation log. `drain` inserts seven values and then extracts them all, so
 * the removed values come out in order.
 * @param {HeapOpsPreset} preset
 * @param {() => number} [rand]
 * @returns {HeapOp[]}
 */
export function makeHeapOps(preset, rand = Math.random) {
  /** @param {number[]} values @returns {HeapOp[]} */
  const inserts = (values) => values.map((value) => ({ type: 'insert', value }));
  /** @param {number} n @returns {HeapOp[]} */
  const extracts = (n) => Array.from({ length: n }, () => ({ type: 'extract' }));
  if (preset === 'build') return [...inserts([42, 17, 63, 8, 25, 91, 30, 5, 50]), ...extracts(1)];
  if (preset === 'drain') return [...inserts([31, 7, 56, 12, 88, 3, 45]), ...extracts(7)];
  if (preset === 'sorted') return inserts([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
  const values = Array.from({ length: 10 }, () => Math.floor(rand() * (MAX_VALUE + 1)));
  return [...inserts(values), ...extracts(3)];
}
