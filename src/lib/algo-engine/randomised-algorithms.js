/**
 * Randomised quicksort as in CLRS: RANDOMIZED-PARTITION swaps a uniformly random element of
 * A[p … r] to the end, then Lomuto partitions around it (A[j] ≤ x goes left). Each partition of
 * a subarray of length L makes L − 1 comparisons. The algorithm is Las Vegas: the output is
 * always sorted, and only the running time is random. On distinct keys the expected number of
 * comparisons is 2(n + 1)Hₙ − 4n ≈ 1.39 n log₂ n, whatever the input order, while the fixed
 * “last element” pivot makes n(n − 1)/2 on sorted input.
 */

export const MIN_N = 2;
export const MAX_N = 16;
export const MAX_VALUE = 99;
export const RUN_BATCH = 100;
export const MAX_RUNS = 5000;

/** @typedef {'random' | 'last'} PivotRule */

export const quicksortPseudocode = [
  'quicksort(A, p, r):',
  '  if p < r:',
  '    k = random index in p … r   (or k = r)',
  '    swap A[k] and A[r]; x = A[r]; i = p − 1',
  '    for j = p to r − 1:',
  '      if A[j] ≤ x:',
  '        i = i + 1; swap A[i] and A[j]',
  '    swap A[i + 1] and A[r]; q = i + 1',
  '    quicksort(A, p, q − 1); quicksort(A, q + 1, r)',
];

/**
 * @typedef {object} QuickFrame
 * @property {'start'|'call'|'pick'|'compare'|'swap'|'place'|'done'} kind
 * @property {PivotRule} rule
 * @property {{ id: number, value: number }[]} items
 * @property {number} lo  The subarray being partitioned; -1 when none.
 * @property {number} hi
 * @property {number} picked  pick: the index the pivot came from.
 * @property {number} i  Last index of the ≤ x part; lo − 1 when it is empty.
 * @property {number} j  The element being compared; -1 when none.
 * @property {boolean} goesLeft  compare: whether A[j] ≤ x.
 * @property {boolean[]} placed  Positions already final.
 * @property {number} comparisons
 * @property {number} swaps
 * @property {number} depth  Recursion depth of the current call.
 * @property {number} maxDepth
 * @property {number[]} lines
 */

/**
 * @param {number[]} values
 * @param {PivotRule} rule
 * @param {() => number} [rand]
 * @returns {QuickFrame[]}
 */
export function quicksortTrace(values, rule, rand = Math.random) {
  const items = values.map((value, id) => ({ id, value }));
  const n = items.length;
  const placed = Array(n).fill(false);
  let lo = -1;
  let hi = -1;
  let picked = -1;
  let i = -1;
  let j = -1;
  let goesLeft = false;
  let comparisons = 0;
  let swaps = 0;
  let depth = 0;
  let maxDepth = 0;
  /** @type {QuickFrame[]} */
  const frames = [];

  /** @param {QuickFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      rule,
      items: items.map((it) => ({ ...it })),
      lo,
      hi,
      picked,
      i,
      j,
      goesLeft,
      placed: placed.slice(),
      comparisons,
      swaps,
      depth,
      maxDepth,
      lines,
    });

  /** @param {number} a @param {number} b */
  const swap = (a, b) => {
    [items[a], items[b]] = [items[b], items[a]];
    if (a !== b) swaps++;
  };

  /** @param {number} p @param {number} r @param {number} level */
  const sort = (p, r, level) => {
    if (p > r) return;
    if (p === r) {
      placed[p] = true;
      return;
    }
    lo = p;
    hi = r;
    depth = level;
    maxDepth = Math.max(maxDepth, level);
    i = -1;
    j = -1;
    picked = -1;
    push('call', [0, 1]);
    picked = rule === 'random' ? p + Math.floor(rand() * (r - p + 1)) : r;
    swap(picked, r);
    const x = items[r].value;
    i = p - 1;
    push('pick', [2, 3]);
    for (j = p; j < r; j++) {
      comparisons++;
      goesLeft = items[j].value <= x;
      push('compare', [4, 5]);
      if (goesLeft) {
        i++;
        swap(i, j);
        push('swap', [6]);
      }
    }
    j = -1;
    swap(i + 1, r);
    const q = i + 1;
    placed[q] = true;
    push('place', [7, 8]);
    sort(p, q - 1, level + 1);
    sort(q + 1, r, level + 1);
  };

  push('start', [0]);
  sort(0, n - 1, 1);
  lo = hi = picked = i = j = -1;
  push('done', [0]);
  return frames;
}

/**
 * One run without frames, for sampling many runs quickly: its comparison count and whether its
 * output came out sorted.
 * @param {number[]} values
 * @param {PivotRule} rule
 * @param {() => number} [rand]
 * @returns {{ comparisons: number, sorted: boolean }}
 */
export function quicksortRun(values, rule, rand = Math.random) {
  const a = values.slice();
  let comparisons = 0;
  /** @type {[number, number][]} */
  const stack = [[0, a.length - 1]];
  while (stack.length > 0) {
    const [p, r] = /** @type {[number, number]} */ (stack.pop());
    if (p >= r) continue;
    const k = rule === 'random' ? p + Math.floor(rand() * (r - p + 1)) : r;
    [a[k], a[r]] = [a[r], a[k]];
    const x = a[r];
    let i = p - 1;
    for (let j = p; j < r; j++) {
      comparisons++;
      if (a[j] <= x) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
      }
    }
    [a[i + 1], a[r]] = [a[r], a[i + 1]];
    stack.push([i + 2, r], [p, i]);
  }
  return { comparisons, sorted: a.every((v, k) => k === 0 || a[k - 1] <= v) };
}

/**
 * Expected comparisons of randomised quicksort on n distinct keys: 2(n + 1)Hₙ − 4n.
 * @param {number} n
 */
export function expectedComparisons(n) {
  let harmonic = 0;
  for (let k = 1; k <= n; k++) harmonic += 1 / k;
  return 2 * (n + 1) * harmonic - 4 * n;
}

/** The most comparisons any pivot choice can cause: n(n − 1)/2. @param {number} n */
export const worstComparisons = (n) => (n * (n - 1)) / 2;

/**
 * Counts of whole-number samples in at most `maxBins` equal bins from the smallest to the
 * largest sample.
 * @param {number[]} samples
 * @param {number} maxBins
 * @returns {{ from: number, width: number, counts: number[] }}
 */
export function histogram(samples, maxBins) {
  if (samples.length === 0) return { from: 0, width: 1, counts: [] };
  const lo = Math.min(...samples);
  const hi = Math.max(...samples);
  const width = Math.max(1, Math.ceil((hi - lo + 1) / maxBins));
  const counts = Array(Math.floor((hi - lo) / width) + 1).fill(0);
  for (const s of samples) counts[Math.floor((s - lo) / width)]++;
  return { from: lo, width, counts };
}

/** @type {Record<'shuffled'|'sorted'|'reversed'|'small', number[]>} */
export const QUICK_PRESETS = {
  shuffled: [42, 7, 88, 23, 61, 15, 94, 36, 70, 3, 55, 29, 81, 12, 67, 48],
  sorted: [3, 7, 12, 15, 23, 29, 36, 42, 48, 55, 61, 67, 70, 81, 88, 94],
  reversed: [94, 88, 81, 70, 67, 61, 55, 48, 42, 36, 29, 23, 15, 12, 7, 3],
  small: [5, 2, 8, 1, 9, 3],
};
