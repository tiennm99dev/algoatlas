/**
 * Counting inversions by merge sort. An inversion is a pair of positions i < j with
 * a[i] > a[j]. Sorting each half counts the pairs inside it; while the halves merge, every
 * time an element is taken from the right run it jumps ahead of all the elements still
 * waiting in the left run, and each of those is one cross inversion. Ties take from the left,
 * because equal values are not inversions. Top-down, mid = floor((lo + hi) / 2), the left
 * half is lo..mid.
 */

export const MIN_N = 2;
export const MAX_N = 16;
export const MAX_VALUE = 99;

/**
 * @typedef {object} CallCount
 * @property {number} left  Inversions inside the left half.
 * @property {number} right  Inversions inside the right half.
 * @property {number} cross  Pairs with one element in each half.
 */

/**
 * @typedef {object} InversionFrame
 * @property {'start'|'split'|'copy'|'take-left'|'take-right'|'merged'|'done'} kind
 * @property {number[]} values  The array as the algorithm holds it. During a merge, slots
 *   lo..k are already written; later slots of the range still hold stale values.
 * @property {[number, number] | null} range  Current call's [lo, hi].
 * @property {number} mid  -1 outside a call.
 * @property {number[]} left  L, the copy of a[lo..mid] while merging; [] otherwise.
 * @property {number[]} right  R, the copy of a[mid+1..hi] while merging; [] otherwise.
 * @property {number} i  Next index into L (after the take on take frames).
 * @property {number} j  Next index into R (after the take on take frames).
 * @property {number} k  Slot written on this frame, -1 when none.
 * @property {number} gained  Cross inversions added on this frame.
 * @property {number} inversions  Total found so far.
 * @property {number} comparisons  L[i] <= R[j] tests so far.
 * @property {CallCount | null} call  The current call's tally, on merge and take frames.
 * @property {[number, number][]} pairs  Every inversion found so far as (larger, smaller) values.
 * @property {[number, number][]} stack  Active calls, outermost first.
 * @property {number[]} lines
 */

export const inversionPseudocode = [
  'sortCount(a, lo, hi):          // sorts a[lo..hi], returns its inversions',
  '  if lo >= hi: return 0',
  '  mid = floor((lo + hi) / 2)',
  '  inv = sortCount(a, lo, mid) + sortCount(a, mid + 1, hi)',
  '  L = a[lo..mid]; R = a[mid+1..hi]; i = 0; j = 0',
  '  for k = lo to hi:',
  '    if j = |R| or (i < |L| and L[i] <= R[j]): a[k] = L[i]; i++',
  '    else: a[k] = R[j]; j++; inv += |L| − i   // R[j] jumps over every L left',
  '  return inv',
  'answer = sortCount(a, 0, n − 1)',
];

/**
 * Reads whole numbers 0..MAX_VALUE separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseInversionValues(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v > MAX_VALUE)) return { error: 'range' };
  if (values.length < MIN_N || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/** Every pair i < j with a[i] > a[j], checked one by one: the O(n²) oracle. @param {number[]} a */
export function bruteForceInversions(a) {
  let count = 0;
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) count++;
  return count;
}

/**
 * @param {number[]} input
 * @returns {InversionFrame[]}
 */
export function inversionTrace(input) {
  const a = input.slice();
  /** @type {InversionFrame[]} */
  const frames = [];
  let inversions = 0;
  let comparisons = 0;
  /** @type {[number, number][]} */
  const pairs = [];
  /** @type {[number, number][]} */
  const stack = [];

  /**
   * @param {Pick<InversionFrame, 'kind'|'lines'> & Partial<InversionFrame>} f
   */
  const push = (f) =>
    frames.push({
      range: null,
      mid: -1,
      i: -1,
      j: -1,
      k: -1,
      gained: 0,
      call: null,
      ...f,
      left: (f.left ?? []).slice(),
      right: (f.right ?? []).slice(),
      values: a.slice(),
      inversions,
      comparisons,
      pairs: pairs.map(([x, y]) => [x, y]),
      stack: stack.map(([lo, hi]) => [lo, hi]),
    });

  /**
   * @param {number} lo
   * @param {number} hi
   * @returns {number}
   */
  function sortCount(lo, hi) {
    // A one-element range has no inversions and emits no frames.
    if (lo >= hi) return 0;
    const mid = Math.floor((lo + hi) / 2);
    /** @type {[number, number]} */
    const range = [lo, hi];
    stack.push([lo, hi]);
    push({ kind: 'split', lines: [0, 1, 2, 3], range, mid });
    const leftInv = sortCount(lo, mid);
    const rightInv = sortCount(mid + 1, hi);

    const L = a.slice(lo, mid + 1);
    const R = a.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let cross = 0;
    const call = () => ({ left: leftInv, right: rightInv, cross });
    push({ kind: 'copy', lines: [4], range, mid, left: L, right: R, i, j, call: call() });
    for (let k = lo; k <= hi; k++) {
      let leftFirst = j === R.length;
      if (!leftFirst && i < L.length) {
        comparisons++;
        leftFirst = L[i] <= R[j];
      }
      if (leftFirst) {
        a[k] = L[i++];
        push({
          kind: 'take-left',
          lines: [5, 6],
          range,
          mid,
          left: L,
          right: R,
          i,
          j,
          k,
          call: call(),
        });
      } else {
        a[k] = R[j];
        const gained = L.length - i;
        for (let t = i; t < L.length; t++) pairs.push([L[t], R[j]]);
        j++;
        cross += gained;
        inversions += gained;
        push({
          kind: 'take-right',
          lines: [5, 7],
          range,
          mid,
          left: L,
          right: R,
          i,
          j,
          k,
          gained,
          call: call(),
        });
      }
    }
    stack.pop();
    push({ kind: 'merged', lines: [8], range, mid, left: L, right: R, i, j, call: call() });
    return leftInv + rightInv + cross;
  }

  push({ kind: 'start', lines: [9] });
  sortCount(0, a.length - 1);
  push({ kind: 'done', lines: [9] });
  return frames;
}
