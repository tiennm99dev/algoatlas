/**
 * Binary search as a step trace, plus the single-step rule the "you drive"
 * mode checks learner guesses against.
 */

/**
 * @typedef {object} SearchFrame
 * @property {'start'|'mid'|'found'|'go-right'|'go-left'|'not-found'} kind
 * @property {number} lo
 * @property {number} hi
 * @property {number} mid          -1 when no midpoint is under inspection.
 * @property {number} line
 * @property {number} comparisons  Running total of array reads.
 */

export const binaryPseudocode = [
  'lo = 0; hi = n - 1',
  'while lo <= hi:',
  '  mid = floor((lo + hi) / 2)',
  '  if a[mid] == target: return mid',
  '  if a[mid] < target: lo = mid + 1',
  '  else: hi = mid - 1',
  'return "not found"',
];

/** @param {number} lo @param {number} hi */
export function midpoint(lo, hi) {
  return Math.floor((lo + hi) / 2);
}

/**
 * Which way binary search moves after reading a[mid].
 * @param {number[]} a
 * @param {number} mid
 * @param {number} target
 * @returns {'found'|'go-right'|'go-left'}
 */
export function decide(a, mid, target) {
  if (a[mid] === target) return 'found';
  return a[mid] < target ? 'go-right' : 'go-left';
}

/**
 * @param {number[]} a Sorted ascending.
 * @param {number} target
 * @returns {SearchFrame[]}
 */
export function binarySearchTrace(a, target) {
  let lo = 0;
  let hi = a.length - 1;
  let comparisons = 0;
  /** @type {SearchFrame[]} */
  const frames = [{ kind: 'start', lo, hi, mid: -1, line: 0, comparisons }];

  while (lo <= hi) {
    const mid = midpoint(lo, hi);
    frames.push({ kind: 'mid', lo, hi, mid, line: 2, comparisons });
    comparisons++;
    const move = decide(a, mid, target);
    if (move === 'found') {
      frames.push({ kind: 'found', lo, hi, mid, line: 3, comparisons });
      return frames;
    }
    if (move === 'go-right') {
      lo = mid + 1;
      frames.push({ kind: 'go-right', lo, hi, mid, line: 4, comparisons });
    } else {
      hi = mid - 1;
      frames.push({ kind: 'go-left', lo, hi, mid, line: 5, comparisons });
    }
  }
  frames.push({ kind: 'not-found', lo, hi, mid: -1, line: 6, comparisons });
  return frames;
}

/**
 * How many elements a left-to-right scan reads before it can answer.
 * @param {number[]} a
 * @param {number} target
 */
export function linearSearchComparisons(a, target) {
  const i = a.indexOf(target);
  return i === -1 ? a.length : i + 1;
}

/**
 * Sorted, distinct values with random gaps so guessing is not arithmetic.
 * @param {number} n
 * @param {() => number} [rand]
 */
export function makeSortedArray(n, rand = Math.random) {
  const out = [];
  let v = Math.floor(rand() * 5) + 1;
  for (let i = 0; i < n; i++) {
    out.push(v);
    v += Math.floor(rand() * 6) + 1;
  }
  return out;
}
