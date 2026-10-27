/**
 * Two priority-queue patterns on a binary min-heap (0-based array; slot i has children
 * 2i + 1 and 2i + 2).
 *
 * Merge k sorted lists: the heap holds at most one entry per list, its current head. Each
 * step pops the smallest head into the output and pushes the next value of the same list.
 * Ties break by list index, so equal values leave in list order.
 *
 * Top k: a min-heap of size k keeps the k largest values seen so far. A new value enters only
 * when it beats the heap's minimum, which it then replaces.
 */

import { makeHeap } from '$lib/components/item-heap.js';

/**
 * @typedef {{value: number, list: number}} HeadEntry
 * @typedef {'merge'|'top-k'} PqProblem
 */

/**
 * @typedef {object} MergeFrame
 * @property {'start'|'seed'|'pop'|'push'|'exhausted'|'done'} kind
 * @property {HeadEntry[]} heap  Heap array after this step.
 * @property {HeadEntry[]} out  The merged output so far.
 * @property {number[]} heads  Next unread position in each list.
 * @property {number} list  The list acted on; -1 when none.
 * @property {number | null} value  The value popped or pushed.
 * @property {number} slot  Where the pushed entry settled; -1 when none.
 * @property {number} comparisons  Heap comparisons so far.
 * @property {number} heapOps  Pushes plus pops so far.
 * @property {number[]} lines
 */

/**
 * @typedef {object} TopKFrame
 * @property {'start'|'read'|'push'|'replace'|'skip'|'done'} kind
 * @property {number[]} heap  Heap array after this step.
 * @property {number} index  Stream position being handled; -1 when none.
 * @property {number | null} value  The value read.
 * @property {number | null} evicted  The value pushed out on a replace.
 * @property {number} slot  Where the new value settled; -1 when none.
 * @property {number} comparisons
 * @property {number} heapOps
 * @property {number[]} lines
 */

export const MAX_LISTS = 5;
export const MAX_LIST_LEN = 6;
export const MAX_STREAM = 16;
export const MAX_K = 6;
export const MAX_VALUE = 99;

export const mergePseudocode = [
  'merge(lists):',
  '  for each list j: if j is not empty, push (head of j, j)',
  '  while the heap is not empty:',
  '    (x, j) = popMin()',
  '    append x to the output',
  '    if list j has a next value y: push (y, j)',
  '  return the output',
];

export const topKPseudocode = [
  'topK(stream, k):          // min-heap of the k largest so far',
  '  for each x in the stream:',
  '    if the heap holds fewer than k: push x',
  '    else if x > heap.min():',
  '      replace the min with x; sift down',
  '    else: skip x            // too small for the top k',
  '  return the heap           // its min is the kth largest',
];

/**
 * @param {number[][]} lists  Each list sorted in non-decreasing order.
 * @returns {MergeFrame[]}
 */
export function mergeTrace(lists) {
  const heap = makeHeap(
    /** @param {HeadEntry} x @param {HeadEntry} y */
    (x, y) => x.value < y.value || (x.value === y.value && x.list < y.list),
  );
  const heads = lists.map(() => 0);
  /** @type {HeadEntry[]} */
  const out = [];
  /** @type {MergeFrame[]} */
  const frames = [];
  let heapOps = 0;

  /** @param {Pick<MergeFrame, 'kind'|'lines'> & Partial<MergeFrame>} f */
  const push = (f) =>
    frames.push({
      list: -1,
      value: null,
      slot: -1,
      ...f,
      heap: heap.a.map((e) => ({ ...e })),
      out: out.map((e) => ({ ...e })),
      heads: heads.slice(),
      comparisons: heap.counter.comparisons,
      heapOps,
    });

  push({ kind: 'start', lines: [0] });
  lists.forEach((list, j) => {
    if (list.length === 0) {
      push({ kind: 'exhausted', lines: [1], list: j });
      return;
    }
    heads[j] = 1;
    heapOps++;
    const slot = heap.push({ value: list[0], list: j });
    push({ kind: 'seed', lines: [1], list: j, value: list[0], slot });
  });
  while (heap.a.length) {
    const top = heap.pop();
    heapOps++;
    out.push(top);
    push({ kind: 'pop', lines: [2, 3, 4], list: top.list, value: top.value });
    const j = top.list;
    if (heads[j] < lists[j].length) {
      const y = lists[j][heads[j]];
      heads[j]++;
      heapOps++;
      const slot = heap.push({ value: y, list: j });
      push({ kind: 'push', lines: [5], list: j, value: y, slot });
    } else {
      push({ kind: 'exhausted', lines: [5], list: j });
    }
  }
  push({ kind: 'done', lines: [6] });
  return frames;
}

/**
 * @param {number[]} stream
 * @param {number} k
 * @returns {TopKFrame[]}
 */
export function topKTrace(stream, k) {
  const heap = makeHeap(/** @param {number} x @param {number} y */ (x, y) => x < y);
  /** @type {TopKFrame[]} */
  const frames = [];
  let heapOps = 0;
  let extra = 0;

  /** @param {Pick<TopKFrame, 'kind'|'lines'> & Partial<TopKFrame>} f */
  const push = (f) =>
    frames.push({
      index: -1,
      value: null,
      evicted: null,
      slot: -1,
      ...f,
      heap: heap.a.slice(),
      comparisons: heap.counter.comparisons + extra,
      heapOps,
    });

  push({ kind: 'start', lines: [0] });
  stream.forEach((x, index) => {
    push({ kind: 'read', lines: [1], index, value: x });
    if (heap.a.length < k) {
      heapOps++;
      const slot = heap.push(x);
      push({ kind: 'push', lines: [2], index, value: x, slot });
      return;
    }
    extra++;
    if (x > heap.a[0]) {
      const evicted = heap.a[0];
      heapOps++;
      const slot = heap.replaceTop(x);
      push({ kind: 'replace', lines: [3, 4], index, value: x, evicted, slot });
    } else {
      push({ kind: 'skip', lines: [3, 5], index, value: x });
    }
  });
  push({ kind: 'done', lines: [6] });
  return frames;
}

/**
 * Reads sorted lists separated by `/` or `;`, values by commas or spaces.
 * @param {string} text
 * @returns {{lists: number[][]} | {error: 'format'|'range'|'count'|'length'|'unsorted'}}
 */
export function parseLists(text) {
  const parts = text.split(/[/;]/).map((p) => p.split(/[\s,]+/).filter(Boolean));
  if (parts.some((p) => p.length === 0 || !p.every((s) => /^\d+$/.test(s)))) {
    return { error: 'format' };
  }
  const lists = parts.map((p) => p.map(Number));
  if (lists.some((l) => l.some((v) => v > MAX_VALUE))) return { error: 'range' };
  if (lists.length < 2 || lists.length > MAX_LISTS) return { error: 'count' };
  if (lists.some((l) => l.length > MAX_LIST_LEN)) return { error: 'length' };
  if (lists.some((l) => l.some((v, i) => i > 0 && v < l[i - 1]))) return { error: 'unsorted' };
  return { lists };
}

/** @param {number[][]} lists */
export const formatLists = (lists) => lists.map((l) => l.join(', ')).join(' / ');

/**
 * Reads a stream of whole numbers separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseStream(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v > MAX_VALUE)) return { error: 'range' };
  if (values.length > MAX_STREAM) return { error: 'count' };
  return { values };
}

/**
 * Random sorted lists for the merge.
 * @param {() => number} [rand]
 */
export function makeLists(rand = Math.random) {
  const k = 3 + Math.floor(rand() * 2);
  return Array.from({ length: k }, () => {
    const len = 2 + Math.floor(rand() * 4);
    return Array.from({ length: len }, () => Math.floor(rand() * (MAX_VALUE + 1))).sort(
      (x, y) => x - y,
    );
  });
}

/**
 * A random stream for top k.
 * @param {() => number} [rand]
 */
export function makeStream(rand = Math.random) {
  return Array.from({ length: 12 }, () => Math.floor(rand() * (MAX_VALUE + 1)));
}
