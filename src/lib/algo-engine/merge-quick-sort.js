/**
 * Step traces for merge sort and quicksort. The recursion is flattened into a
 * linear list of immutable frames; every frame snapshots the active call
 * ranges, so a visualizer can render any step (or step backwards) without
 * replaying the algorithm.
 */

/** @typedef {import('./sorting.js').Item} Item */

/**
 * @typedef {object} DivideFrame
 * @property {'start'|'split'|'copy'|'take'|'merged'|'call'|'pivot'|'scan'|'swap'|'place'|'done'} kind
 * @property {Item[]} items   Always a permutation of the input ids. During a merge,
 *                            slots lo..k hold the output so far and the rest hold the
 *                            untaken buffer items, so ids stay unique and bars can animate.
 * @property {number[]} focus
 * @property {number[]} sorted   Final positions (quick: placed pivots and 1-element ranges; merge: all at done).
 * @property {number[]} lines
 * @property {number} comparisons
 * @property {number} swaps       Merge: writes to the main array. Quick: real swaps (i !== j).
 * @property {[number, number] | null} range  Current call's [lo, hi]; bars outside it are dimmed.
 * @property {[number, number][]} stack  Merge: active calls with lo < hi, outermost first. Quick: pending ranges, bottom first.
 * @property {number} depth       Current call depth (0 at start and done).
 * @property {number} maxDepth    Running maximum.
 * @property {Item[] | null} aux  Merge only: copy of a[lo..hi] from 'copy' until 'merged'; otherwise null.
 * @property {number} i  Merge: left buffer head (absolute index). Quick: Lomuto i. -1 when none.
 * @property {number} j  Merge: right buffer head. Quick: scan pointer. -1 when none.
 * @property {number} k  Merge: slot being written. -1 otherwise.
 * @property {[number, number][]} runs  Merge: finished runs (sorted within the run, not final). Quick: [].
 * @property {number} pivot  Quick: pivot index (hi) from 'pivot' until 'place'; -1 otherwise.
 * @property {boolean} [swapped]  On 'scan': a[j] <= pivot, so it moves to the low side.
 */

/** @typedef {'last'|'median3'|'random'} PivotRule */

export const mergePseudocode = [
  'mergeSort(a, lo, hi):',
  '  if lo >= hi: return',
  '  mid = floor((lo + hi) / 2)',
  '  mergeSort(a, lo, mid); mergeSort(a, mid + 1, hi)',
  '  aux = copy of a[lo..hi]; i = lo; j = mid + 1',
  '  for k = lo to hi:',
  '    if i > mid: a[k] = aux[j++]            // left run used up',
  '    else if j > hi: a[k] = aux[i++]        // right run used up',
  '    else if aux[j] < aux[i]: a[k] = aux[j++]   // strict: left wins ties',
  '    else: a[k] = aux[i++]',
  'done: array is sorted',
];

export const quickPseudocode = [
  'quickSort(a, lo, hi):',
  '  if lo >= hi: return',
  '  swap chosen pivot into a[hi]; pivot = a[hi]',
  '  i = lo - 1',
  '  for j = lo to hi - 1:',
  '    if a[j] <= pivot: i = i + 1; swap(a[i], a[j])',
  '  swap(a[i + 1], a[hi])        // pivot lands in its final slot',
  '  quickSort(a, lo, i); quickSort(a, i + 2, hi)',
  'done: array is sorted',
];

/** @param {number} n @returns {number[]} */
const indices = (n) => Array.from({ length: n }, (_, i) => i);

/** @param {[number, number][]} ranges @returns {[number, number][]} */
const copyRanges = (ranges) => ranges.map(([lo, hi]) => [lo, hi]);

/**
 * @param {Item[]} input
 * @returns {DivideFrame[]}
 */
export function mergeSortTrace(input) {
  const a = input.slice();
  const n = a.length;
  /** @type {DivideFrame[]} */
  const frames = [];
  let comparisons = 0;
  let swaps = 0;
  let maxDepth = 0;
  /** @type {number[]} */
  let sorted = [];
  /** @type {[number, number][]} */
  const stack = [];
  /** @type {[number, number][]} */
  let runs = [];

  /**
   * @param {Pick<DivideFrame, 'kind'|'focus'|'lines'> & Partial<DivideFrame>} f
   */
  const push = (f) =>
    frames.push({
      range: null,
      depth: 0,
      aux: null,
      i: -1,
      j: -1,
      k: -1,
      pivot: -1,
      ...f,
      items: a.slice(),
      sorted: sorted.slice(),
      comparisons,
      swaps,
      stack: copyRanges(stack),
      runs: copyRanges(runs),
      maxDepth,
    });

  /**
   * @param {number} lo
   * @param {number} hi
   * @param {number} depth
   */
  function sort(lo, hi, depth) {
    // A one-element range is trivially sorted and emits no frames.
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    maxDepth = Math.max(maxDepth, depth);
    stack.push([lo, hi]);
    push({ kind: 'split', focus: [], lines: [0, 1, 2, 3], range: [lo, hi], depth });
    sort(lo, mid, depth + 1);
    sort(mid + 1, hi, depth + 1);

    const aux = a.slice(lo, hi + 1);
    let i = lo;
    let j = mid + 1;
    push({
      kind: 'copy',
      focus: [],
      lines: [4],
      range: [lo, hi],
      depth,
      aux: aux.slice(),
      i,
      j,
    });
    for (let k = lo; k <= hi; k++) {
      /** @type {number[]} */
      let lines;
      if (i > mid) {
        a[k] = aux[j++ - lo];
        lines = [5, 6];
      } else if (j > hi) {
        a[k] = aux[i++ - lo];
        lines = [5, 7];
      } else {
        comparisons++;
        if (aux[j - lo].value < aux[i - lo].value) {
          a[k] = aux[j++ - lo];
          lines = [5, 8];
        } else {
          a[k] = aux[i++ - lo];
          lines = [5, 8, 9];
        }
      }
      swaps++;
      // Slots after k show the untaken buffer items, so every id appears exactly once.
      let slot = k + 1;
      for (let p = i; p <= mid; p++) a[slot++] = aux[p - lo];
      for (let p = j; p <= hi; p++) a[slot++] = aux[p - lo];
      push({ kind: 'take', focus: [k], lines, range: [lo, hi], depth, aux: aux.slice(), i, j, k });
    }
    stack.pop();
    runs = [...runs.filter(([s, e]) => s < lo || e > hi), [lo, hi]];
    push({ kind: 'merged', focus: [], lines: [5], range: [lo, hi], depth });
  }

  push({ kind: 'start', focus: [], lines: [] });
  sort(0, n - 1, 1);
  sorted = indices(n);
  push({ kind: 'done', focus: [], lines: [10] });
  return frames;
}

/**
 * Median by (value, index) of three positions, so ties resolve deterministically.
 * @param {Item[]} a
 * @param {number} lo
 * @param {number} hi
 */
function medianOfThree(a, lo, hi) {
  const cand = [lo, Math.floor((lo + hi) / 2), hi];
  cand.sort((x, y) => a[x].value - a[y].value || x - y);
  return cand[1];
}

/**
 * @param {Item[]} input
 * @param {PivotRule} [rule]
 * @param {() => number} [rand] Injectable for deterministic tests.
 * @returns {DivideFrame[]}
 */
export function quickSortTrace(input, rule = 'last', rand = Math.random) {
  const a = input.slice();
  const n = a.length;
  /** @type {DivideFrame[]} */
  const frames = [];
  let comparisons = 0;
  let swaps = 0;
  let maxDepth = 0;
  /** @type {number[]} */
  let sorted = [];
  /** @type {[number, number, number][]} */
  const work = [];

  /** Pending ranges that still need work, bottom first. */
  const pending = () =>
    /** @type {[number, number][]} */ (
      work.filter(([lo, hi]) => lo < hi).map(([lo, hi]) => [lo, hi])
    );

  /**
   * @param {Pick<DivideFrame, 'kind'|'focus'|'lines'> & Partial<DivideFrame>} f
   */
  const push = (f) =>
    frames.push({
      range: null,
      depth: 0,
      aux: null,
      i: -1,
      j: -1,
      k: -1,
      pivot: -1,
      ...f,
      items: a.slice(),
      sorted: sorted.slice(),
      comparisons,
      swaps,
      stack: pending(),
      runs: [],
      maxDepth,
    });

  /** @param {number} lo @param {number} hi */
  function choosePivot(lo, hi) {
    if (rule === 'median3') return medianOfThree(a, lo, hi);
    if (rule === 'random') return lo + Math.floor(rand() * (hi - lo + 1));
    return hi;
  }

  push({ kind: 'start', focus: [], lines: [] });
  work.push([0, n - 1, 1]);
  while (work.length > 0) {
    const [lo, hi, depth] = /** @type {[number, number, number]} */ (work.pop());
    if (lo > hi) continue;
    if (lo === hi) {
      sorted = [...sorted, lo];
      continue;
    }
    maxDepth = Math.max(maxDepth, depth);
    /** @type {[number, number]} */
    const range = [lo, hi];
    push({ kind: 'call', focus: [], lines: [0, 1], range, depth });

    const p = choosePivot(lo, hi);
    if (p !== hi) {
      [a[p], a[hi]] = [a[hi], a[p]];
      swaps++;
    }
    const pivotValue = a[hi].value;
    let i = lo - 1;
    push({
      kind: 'pivot',
      focus: p === hi ? [hi] : [p, hi],
      lines: [2, 3],
      range,
      depth,
      i,
      pivot: hi,
    });

    for (let j = lo; j < hi; j++) {
      comparisons++;
      const low = a[j].value <= pivotValue;
      push({
        kind: 'scan',
        focus: [j, hi],
        lines: [4, 5],
        range,
        depth,
        i,
        j,
        pivot: hi,
        swapped: low,
      });
      if (!low) continue;
      i++;
      if (i !== j) {
        [a[i], a[j]] = [a[j], a[i]];
        swaps++;
        push({ kind: 'swap', focus: [i, j], lines: [5], range, depth, i, j, pivot: hi });
      }
    }

    if (i + 1 !== hi) {
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      swaps++;
    }
    sorted = [...sorted, i + 1];
    work.push([i + 2, hi, depth + 1], [lo, i, depth + 1]);
    push({ kind: 'place', focus: [i + 1], lines: [6, 7], range, depth, i });
  }
  sorted = indices(n);
  push({ kind: 'done', focus: [], lines: [8] });
  return frames;
}
