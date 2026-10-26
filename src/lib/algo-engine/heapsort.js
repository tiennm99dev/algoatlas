/**
 * Step trace for in-place heapsort on a 0-based array: slot i's children are 2i + 1 and
 * 2i + 2. Phase one builds a max-heap bottom-up by sifting down every internal node; phase two
 * swaps the root (the maximum) to the end of the heap, shrinks the heap by one and sifts the
 * new root down. The sorted tail grows from the right.
 */

/**
 * @typedef {object} HeapFrame
 * @property {'start'|'sift'|'children'|'compare'|'swap'|'leaf'|'extract'|'done'} kind
 * @property {'build'|'sort'} phase
 * @property {number[]} values  Array state after this step.
 * @property {number} size  Slots 0..size-1 form the heap; the rest is the sorted tail.
 * @property {number} node  The slot being sifted down; -1 when none.
 * @property {number} child  The larger child picked, or -1.
 * @property {number[]} focus  Slots read or written by this step.
 * @property {boolean} [stop]  On 'compare': the child is not larger, so the sift stops.
 * @property {number} comparisons  Running total of key comparisons.
 * @property {number} swaps  Running total of swaps.
 * @property {number[]} lines
 */

export const MAX_N = 15;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;

export const heapsortPseudocode = [
  'for i = n/2 - 1 down to 0: siftDown(a, i, n)',
  'for end = n - 1 down to 1:',
  '  swap(a[0], a[end])    // max to its final slot',
  '  siftDown(a, 0, end)   // heap is a[0..end-1]',
  'siftDown(a, i, size):',
  '  while 2i + 1 < size:  // i has a child',
  '    c = the larger child of i',
  '    if a[c] <= a[i]: stop',
  '    swap(a[i], a[c]); i = c',
  'done: a is sorted',
];

/**
 * Reads whole numbers separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseHeapValues(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length < 2 || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * Whether a[0..size-1] is a max-heap.
 * @param {number[]} a @param {number} [size]
 */
export function isMaxHeap(a, size = a.length) {
  for (let i = 1; i < size; i++) if (a[i] > a[Math.floor((i - 1) / 2)]) return false;
  return true;
}

/**
 * @param {number[]} input
 * @returns {HeapFrame[]}
 */
export function heapsortTrace(input) {
  const a = input.slice();
  const n = a.length;
  /** @type {HeapFrame[]} */
  const frames = [];
  let comparisons = 0;
  let swaps = 0;
  let size = n;
  /** @type {'build'|'sort'} */
  let phase = 'build';

  /** @param {Pick<HeapFrame, 'kind'|'lines'> & Partial<HeapFrame>} f */
  const push = (f) =>
    frames.push({
      node: -1,
      child: -1,
      focus: [],
      ...f,
      phase,
      values: a.slice(),
      size,
      comparisons,
      swaps,
    });

  /** @param {number} i @param {number[]} callLines */
  function siftDown(i, callLines) {
    push({ kind: 'sift', lines: [...callLines, 4], node: i, focus: [i] });
    while (2 * i + 1 < size) {
      const left = 2 * i + 1;
      const right = left + 1;
      let c = left;
      if (right < size) {
        comparisons++;
        if (a[right] > a[left]) c = right;
      }
      push({
        kind: 'children',
        lines: [5, 6],
        node: i,
        child: c,
        focus: right < size ? [left, right] : [left],
      });
      comparisons++;
      const stop = a[c] <= a[i];
      push({ kind: 'compare', lines: [7], node: i, child: c, focus: [i, c], stop });
      if (stop) return;
      [a[i], a[c]] = [a[c], a[i]];
      swaps++;
      push({ kind: 'swap', lines: [8], node: c, child: -1, focus: [i, c] });
      i = c;
    }
    push({ kind: 'leaf', lines: [5], node: i, focus: [i] });
  }

  push({ kind: 'start', lines: [] });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i, [0]);
  phase = 'sort';
  for (let end = n - 1; end >= 1; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    swaps++;
    size = end;
    push({ kind: 'extract', lines: [1, 2], focus: [0, end] });
    siftDown(0, [3]);
  }
  size = 0;
  push({ kind: 'done', lines: [9] });
  return frames;
}
