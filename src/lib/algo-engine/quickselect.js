/**
 * Quickselect: the k-th smallest value (k from 1) by repeated Lomuto partitioning. Each round
 * puts a pivot in its final sorted place p and keeps only the side that holds slot k − 1, so
 * one side is discarded every round. The pivot comes from one of three rules: the last value
 * of the range, a random index, or median of medians (groups of 5, the lower median of each,
 * then the median of those medians, found by a recursive selection). Median of medians keeps
 * at least about 3n/10 values out of the larger side, which makes the worst case linear.
 */

export const MIN_N = 2;
export const MAX_N = 20;
export const MAX_VALUE = 99;
export const GROUP = 5;

/** @typedef {'last' | 'random' | 'mom'} PivotRule */

/**
 * @typedef {object} Group
 * @property {number} from  First index of the group.
 * @property {number} to  One past its last index.
 * @property {number} median  Index of its lower median.
 */

/**
 * @typedef {object} SelectFrame
 * @property {'start'|'round'|'groups'|'medians'|'pivot'|'scan'|'swap'|'place'|'discard'|'found'|'done'} kind
 * @property {number[]} values
 * @property {number} k  Target rank, 1-based; the answer ends at slot k − 1.
 * @property {number} lo  Live range start; values outside lo..hi are discarded.
 * @property {number} hi
 * @property {number} pivot  Pivot index from 'medians' or 'pivot' until 'place'; -1 otherwise.
 * @property {number} i  Lomuto boundary: lo..i hold values ≤ pivot. lo − 1 when empty, -2 when unused.
 * @property {number} j  Scan index on scan and swap frames, -1 otherwise.
 * @property {number} placed  Final index of the last placed pivot, -1 when none.
 * @property {boolean} low  On 'scan': a[j] ≤ pivot.
 * @property {Group[]} groups  Median-of-medians groups on 'groups' and 'medians' frames.
 * @property {[number, number] | null} cut  On 'discard': the discarded slots [from, to].
 * @property {number} answer  Index of the answer on 'found' and 'done', -1 before.
 * @property {number} comparisons  Including those spent choosing pivots.
 * @property {number} pivotComparisons  The part spent choosing median-of-medians pivots.
 * @property {number} swaps  Real swaps (two different slots).
 * @property {number[]} sizes  Live range size at the start of each round so far.
 * @property {number[]} lines
 */

/** @param {PivotRule} rule */
export function selectPseudocode(rule) {
  const choose = {
    last: '    p = hi                               // the last value is the pivot',
    random: '    p = random index in lo..hi; swap(a[p], a[hi])',
    mom: '    p = medianOfMedians(a, lo, hi); swap(a[p], a[hi])',
  }[rule];
  const lines = [
    'select(a, k):                     // the k-th smallest, k from 1',
    '  lo = 0; hi = n − 1',
    '  while lo < hi:',
    choose,
    '    i = lo − 1',
    '    for j = lo to hi − 1:',
    '      if a[j] <= a[hi]: i = i + 1; swap(a[i], a[j])',
    '    swap(a[i + 1], a[hi]); p = i + 1     // the pivot’s final place',
    '    if p = k − 1: return a[p]',
    '    if k − 1 < p: hi = p − 1             // discard p..hi',
    '    else: lo = p + 1                     // discard lo..p',
    '  return a[lo]                          // one value left: the answer',
  ];
  if (rule !== 'mom') return lines;
  return [
    ...lines,
    'medianOfMedians(a, lo, hi):',
    '  cut a[lo..hi] into groups of 5 (the last may be smaller)',
    '  sort each group and take its lower median',
    '  return the index of select(medians, ⌈m / 2⌉)   // recursive',
  ];
}

/**
 * Reads whole numbers 0..MAX_VALUE separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseSelectValues(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v > MAX_VALUE)) return { error: 'range' };
  if (values.length < MIN_N || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * Insertion sort of a copy, counting comparisons.
 * @param {number[]} input
 * @returns {{sorted: number[], comparisons: number}}
 */
function insertionSort(input) {
  const a = input.slice();
  let comparisons = 0;
  for (let i = 1; i < a.length; i++) {
    const v = a[i];
    let j = i - 1;
    while (j >= 0) {
      comparisons++;
      if (a[j] <= v) break;
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = v;
  }
  return { sorted: a, comparisons };
}

/**
 * Deterministic linear-time selection (median of medians) without frames: the value of rank
 * k (1-based) and the comparisons it took. Used for the recursive call on the medians.
 * @param {number[]} values
 * @param {number} k
 * @returns {{value: number, comparisons: number}}
 */
export function momSelect(values, k) {
  if (values.length <= GROUP) {
    const { sorted, comparisons } = insertionSort(values);
    return { value: sorted[k - 1], comparisons };
  }
  let comparisons = 0;
  /** @type {number[]} */
  const medians = [];
  for (let s = 0; s < values.length; s += GROUP) {
    const g = insertionSort(values.slice(s, s + GROUP));
    comparisons += g.comparisons;
    medians.push(g.sorted[Math.floor((g.sorted.length - 1) / 2)]);
  }
  const pivot = momSelect(medians, Math.ceil(medians.length / 2));
  comparisons += pivot.comparisons;
  /** @type {number[]} */
  const less = [];
  /** @type {number[]} */
  const greater = [];
  let equal = 0;
  for (const v of values) {
    comparisons++;
    if (v < pivot.value) less.push(v);
    else if (v > pivot.value) greater.push(v);
    else equal++;
  }
  if (k <= less.length) {
    const r = momSelect(less, k);
    return { value: r.value, comparisons: comparisons + r.comparisons };
  }
  if (k <= less.length + equal) return { value: pivot.value, comparisons };
  const r = momSelect(greater, k - less.length - equal);
  return { value: r.value, comparisons: comparisons + r.comparisons };
}

/**
 * The groups of 5 over a[lo..hi] with each group's lower median, and the comparisons spent
 * sorting them.
 * @param {number[]} a
 * @param {number} lo
 * @param {number} hi
 * @returns {{groups: Group[], comparisons: number}}
 */
export function groupsOf(a, lo, hi) {
  /** @type {Group[]} */
  const groups = [];
  let comparisons = 0;
  for (let from = lo; from <= hi; from += GROUP) {
    const to = Math.min(from + GROUP, hi + 1);
    const idx = Array.from({ length: to - from }, (_, t) => from + t);
    const sorted = insertionSort(idx.map((x) => a[x]));
    comparisons += sorted.comparisons;
    const value = sorted.sorted[Math.floor((sorted.sorted.length - 1) / 2)];
    groups.push({ from, to, median: /** @type {number} */ (idx.find((x) => a[x] === value)) });
  }
  return { groups, comparisons };
}

/**
 * @param {number[]} input
 * @param {number} k  1..input.length
 * @param {PivotRule} [rule]
 * @param {() => number} [rand]  Injectable for deterministic tests.
 * @returns {SelectFrame[]}
 */
export function selectTrace(input, k, rule = 'last', rand = Math.random) {
  const a = input.slice();
  const target = k - 1;
  /** @type {SelectFrame[]} */
  const frames = [];
  let lo = 0;
  let hi = a.length - 1;
  let comparisons = 0;
  let pivotComparisons = 0;
  let swaps = 0;
  /** @type {number[]} */
  const sizes = [];

  /** @param {Pick<SelectFrame, 'kind'|'lines'> & Partial<SelectFrame>} f */
  const push = (f) =>
    frames.push({
      pivot: -1,
      i: -2,
      j: -1,
      placed: -1,
      low: false,
      cut: null,
      answer: -1,
      ...f,
      groups: (f.groups ?? []).map((g) => ({ ...g })),
      values: a.slice(),
      k,
      lo,
      hi,
      comparisons,
      pivotComparisons,
      swaps,
      sizes: sizes.slice(),
    });

  /** @param {number} x @param {number} y */
  const swap = (x, y) => {
    if (x === y) return;
    [a[x], a[y]] = [a[y], a[x]];
    swaps++;
  };

  push({ kind: 'start', lines: [0, 1] });
  while (lo < hi) {
    sizes.push(hi - lo + 1);
    push({ kind: 'round', lines: [2] });

    let p = hi;
    if (rule === 'random') p = lo + Math.floor(rand() * (hi - lo + 1));
    if (rule === 'mom') {
      const { groups, comparisons: sortCost } = groupsOf(a, lo, hi);
      comparisons += sortCost;
      pivotComparisons += sortCost;
      push({ kind: 'groups', lines: [3, 12, 13], groups });
      const medianValues = groups.map((g) => a[g.median]);
      const mm = momSelect(medianValues, Math.ceil(medianValues.length / 2));
      comparisons += mm.comparisons;
      pivotComparisons += mm.comparisons;
      p = /** @type {Group} */ (groups.find((g) => a[g.median] === mm.value)).median;
      push({ kind: 'medians', lines: [14, 15], groups, pivot: p });
    }
    swap(p, hi);
    const pivotValue = a[hi];
    let i = lo - 1;
    push({ kind: 'pivot', lines: [3, 4], pivot: hi, i });
    for (let j = lo; j < hi; j++) {
      comparisons++;
      const low = a[j] <= pivotValue;
      push({ kind: 'scan', lines: [5, 6], pivot: hi, i, j, low });
      if (!low) continue;
      i++;
      if (i !== j) {
        swap(i, j);
        push({ kind: 'swap', lines: [6], pivot: hi, i, j });
      }
    }
    swap(i + 1, hi);
    p = i + 1;
    push({ kind: 'place', lines: [7], placed: p, i });
    if (p === target) {
      push({ kind: 'found', lines: [8], placed: p, answer: p });
      push({ kind: 'done', lines: [8], placed: p, answer: p });
      return frames;
    }
    /** @type {[number, number]} */
    const cut = target < p ? [p, hi] : [lo, p];
    if (target < p) hi = p - 1;
    else lo = p + 1;
    push({ kind: 'discard', lines: [target < cut[0] ? 9 : 10], placed: p, cut });
  }
  push({ kind: 'found', lines: [11], answer: lo });
  push({ kind: 'done', lines: [11], answer: lo });
  return frames;
}
