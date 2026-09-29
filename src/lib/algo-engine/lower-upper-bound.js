/**
 * Lower bound and upper bound as one step trace over a half-open window
 * [lo, hi). Both run the same loop; only the test on a[mid] differs.
 */

/**
 * @typedef {object} BoundFrame
 * @property {'start'|'probe'|'go-right'|'go-left'|'done'} kind
 * @property {'lower'|'upper'} variant
 * @property {number} lo
 * @property {number} hi        Exclusive.
 * @property {number} mid       -1 when no midpoint is being read.
 * @property {number} answer    -1 until 'done', then lo.
 * @property {number[]} lines
 * @property {number} comparisons  Running total of array reads.
 */

const shared = [
  'lo = 0; hi = n            // half-open window [lo, hi)',
  'while lo < hi:',
  '  mid = lo + floor((hi - lo) / 2)',
];
const tail = [
  '    lo = mid + 1          // answer is right of mid',
  '  else: hi = mid          // mid could still be the answer',
  'return lo                 // first index where the test fails',
];

/** @type {{lower: string[], upper: string[]}} */
export const boundPseudocode = {
  lower: [...shared, '  if a[mid] < x:          // upper bound: a[mid] <= x', ...tail],
  upper: [...shared, '  if a[mid] <= x:         // lower bound: a[mid] < x', ...tail],
};

/**
 * @param {number[]} a Sorted ascending; duplicates allowed.
 * @param {number} x
 * @param {'lower'|'upper'} variant
 * @returns {BoundFrame[]}
 */
export function boundTrace(a, x, variant) {
  let lo = 0;
  let hi = a.length;
  let comparisons = 0;
  /** @type {BoundFrame[]} */
  const frames = [{ kind: 'start', variant, lo, hi, mid: -1, answer: -1, lines: [0], comparisons }];

  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    comparisons++;
    frames.push({ kind: 'probe', variant, lo, hi, mid, answer: -1, lines: [1, 2, 3], comparisons });
    const goRight = variant === 'lower' ? a[mid] < x : a[mid] <= x;
    if (goRight) {
      lo = mid + 1;
      frames.push({ kind: 'go-right', variant, lo, hi, mid, answer: -1, lines: [4], comparisons });
    } else {
      hi = mid;
      frames.push({ kind: 'go-left', variant, lo, hi, mid, answer: -1, lines: [5], comparisons });
    }
  }
  frames.push({ kind: 'done', variant, lo, hi, mid: -1, answer: lo, lines: [1, 6], comparisons });
  return frames;
}

/**
 * A non-decreasing array where each value repeats the previous one about
 * a third of the time.
 * @param {number} n
 * @param {() => number} [rand]
 * @returns {number[]}
 */
export function makeSortedArrayWithDuplicates(n, rand = Math.random) {
  /** @type {number[]} */
  const out = [];
  for (let i = 0; i < n; i++) {
    if (i === 0) out.push(Math.floor(rand() * 5) + 1);
    else if (rand() < 0.35) out.push(out[i - 1]);
    else out.push(out[i - 1] + Math.floor(rand() * 4) + 1);
  }
  return out;
}
