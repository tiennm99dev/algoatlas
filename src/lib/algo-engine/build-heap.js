/**
 * Step trace for turning an array into a min-heap, 0-based (slot i has children 2i + 1 and
 * 2i + 2). Bottom-up heapify sifts down every internal node from the last one, ⌊n/2⌋ − 1, back
 * to the root: when slot i is sifted, both its subtrees are already heaps. The one-by-one
 * method grows a heap prefix a[0..i−1] and sifts each next slot up into it. Every swap is
 * credited to the level (depth) of the slot whose sift caused it, so the page can show that
 * bottom-up work is cheap exactly where most nodes are: near the leaves.
 */

/**
 * @typedef {'bottom-up'|'one-by-one'} BuildMethod
 * @typedef {'random'|'ascending'|'descending'} BuildPreset
 */

/**
 * @typedef {object} BuildHeapFrame
 * @property {'start'|'sift'|'children'|'compare'|'swap'|'leaf'|'up-compare'|'up-swap'|'up-root'|'done'} kind
 * @property {BuildMethod} method
 * @property {number[]} values  Array state after this step.
 * @property {number} start  The slot whose sift is running; -1 when none.
 * @property {number} node  Where the sifted value is now; -1 when none.
 * @property {number} other  The chosen child (down) or the parent (up); -1 when none.
 * @property {number[]} focus  Slots read or written by this step.
 * @property {boolean} [stop]  On a compare: heap order holds, so the sift stops.
 * @property {number} region  Bottom-up: slots ≥ region root finished sub-heaps. One by one:
 *   slots < region form the heap so far.
 * @property {number[]} levelMoves  Swaps so far, by the depth of the slot that started the sift.
 * @property {number} comparisons
 * @property {number} swaps
 * @property {number[]} lines
 */

export const MAX_N = 31;
export const MIN_N = 2;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;
export const SIZES = [7, 15, 31];

export const bottomUpPseudocode = [
  'buildHeap(a):              // bottom-up',
  '  for i = ⌊n/2⌋ − 1 down to 0:',
  '    siftDown(a, i)          // both subtrees are heaps',
  'siftDown(a, i):',
  '  while i has a child (2i + 1 < n):',
  '    c = the smaller child of i',
  '    if a[c] ≥ a[i]: stop',
  '    swap(a[i], a[c]); i = c',
];

export const oneByOnePseudocode = [
  'buildHeap(a):              // one insert at a time',
  '  for i = 1 to n − 1:',
  '    siftUp(a, i)            // a[0..i−1] is a heap',
  'siftUp(a, i):',
  '  while i > 0 and a[i] < a[parent(i)]:',
  '    swap(a[i], a[parent(i)]); i = parent(i)',
];

/** @param {BuildMethod} method */
export const buildPseudocode = (method) =>
  method === 'bottom-up' ? bottomUpPseudocode : oneByOnePseudocode;

/** Depth of slot i in the implicit tree. @param {number} i */
export const depthOf = (i) => Math.floor(Math.log2(i + 1));

/**
 * The most swaps one sift can make for a slot at each depth: bottom-up a value can sink at
 * most to the bottom level (h − d swaps), one by one it can climb at most to the root (d).
 * @param {number} n @param {BuildMethod} method
 * @returns {{depth: number, nodes: number, cap: number}[]}
 */
export function levelCaps(n, method) {
  if (n === 0) return [];
  const h = depthOf(n - 1);
  return Array.from({ length: h + 1 }, (_, d) => {
    const first = 2 ** d - 1;
    const nodes = Math.min(n, 2 * first + 1) - first;
    // The leftmost slot at depth d has a path of h − d left children inside the array.
    return { depth: d, nodes, cap: method === 'one-by-one' ? d : h - d };
  });
}

/**
 * Reads whole numbers separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseBuildValues(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length < MIN_N || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * @param {BuildPreset} preset @param {number} n @param {() => number} [rand]
 * @returns {number[]}
 */
export function makeBuildValues(preset, n, rand = Math.random) {
  const step = Math.max(1, Math.floor(MAX_VALUE / n));
  if (preset === 'ascending') return Array.from({ length: n }, (_, i) => (i + 1) * step);
  if (preset === 'descending') return Array.from({ length: n }, (_, i) => (n - i) * step);
  return Array.from({ length: n }, () => Math.floor(rand() * (MAX_VALUE + 1)));
}

/** Whether a is a min-heap. @param {number[]} a */
export function isMinHeap(a) {
  for (let i = 1; i < a.length; i++) if (a[i] < a[Math.floor((i - 1) / 2)]) return false;
  return true;
}

/**
 * @param {number[]} input
 * @param {BuildMethod} [method]
 * @returns {BuildHeapFrame[]}
 */
export function buildHeapTrace(input, method = 'bottom-up') {
  const a = input.slice();
  const n = a.length;
  /** @type {BuildHeapFrame[]} */
  const frames = [];
  const levelMoves = n === 0 ? [] : Array.from({ length: depthOf(n - 1) + 1 }, () => 0);
  let comparisons = 0;
  let swaps = 0;
  let start = -1;
  let region = method === 'bottom-up' ? Math.floor(n / 2) : Math.min(1, n);

  /** @param {Pick<BuildHeapFrame, 'kind'|'lines'> & Partial<BuildHeapFrame>} f */
  const push = (f) =>
    frames.push({
      node: -1,
      other: -1,
      focus: [],
      ...f,
      method,
      values: a.slice(),
      start,
      region,
      levelMoves: levelMoves.slice(),
      comparisons,
      swaps,
    });

  push({ kind: 'start', lines: [0] });
  if (method === 'bottom-up') {
    for (let s = Math.floor(n / 2) - 1; s >= 0; s--) {
      start = s;
      region = s + 1;
      let i = s;
      push({ kind: 'sift', lines: [1, 2, 3], node: i, focus: [i] });
      let stopped = false;
      while (2 * i + 1 < n) {
        const left = 2 * i + 1;
        const right = left + 1;
        let c = left;
        if (right < n) {
          comparisons++;
          if (a[right] < a[left]) c = right;
        }
        push({
          kind: 'children',
          lines: [4, 5],
          node: i,
          other: c,
          focus: right < n ? [left, right] : [left],
        });
        comparisons++;
        const stop = a[c] >= a[i];
        push({ kind: 'compare', lines: [6], node: i, other: c, focus: [i, c], stop });
        if (stop) {
          stopped = true;
          break;
        }
        [a[i], a[c]] = [a[c], a[i]];
        swaps++;
        levelMoves[depthOf(s)]++;
        push({ kind: 'swap', lines: [7], node: c, other: i, focus: [i, c] });
        i = c;
      }
      if (!stopped) push({ kind: 'leaf', lines: [4], node: i, focus: [i] });
    }
    region = 0;
  } else {
    for (let s = 1; s < n; s++) {
      start = s;
      region = s;
      let i = s;
      push({ kind: 'sift', lines: [1, 2, 3], node: i, focus: [i] });
      let stopped = false;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        comparisons++;
        const stop = a[i] >= a[p];
        push({ kind: 'up-compare', lines: [4], node: i, other: p, focus: [i, p], stop });
        if (stop) {
          stopped = true;
          break;
        }
        [a[i], a[p]] = [a[p], a[i]];
        swaps++;
        levelMoves[depthOf(s)]++;
        push({ kind: 'up-swap', lines: [5], node: p, other: i, focus: [i, p] });
        i = p;
      }
      if (!stopped) push({ kind: 'up-root', lines: [4], node: 0, focus: [0] });
    }
    region = n;
  }
  start = -1;
  push({ kind: 'done', lines: [] });
  return frames;
}
