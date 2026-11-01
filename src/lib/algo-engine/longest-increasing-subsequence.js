/**
 * Step traces for the longest strictly increasing subsequence, two ways.
 *
 * - O(n²) DP: L[i] = length of the longest increasing subsequence that ends at a[i]
 *   = 1 + max L[j] over j < i with a[j] < a[i]; prev[i] remembers that j. The answer ends at
 *   the first index with the largest L.
 * - Patience sorting, O(n log n): deal the values left to right onto piles, each on the
 *   leftmost pile whose top is ≥ the value (found by binary search over the pile tops, which
 *   stay increasing), or on a new pile on the right. The number of piles is the LIS length,
 *   and back pointers to the top of the pile on the left rebuild one LIS.
 */

/** @typedef {'dp'|'patience'} LisMethod */

/**
 * @typedef {object} LisFrame
 * @property {'start'|'begin'|'compare'|'extend'|'best'|'take'|'probe'|'place'|'newpile'|'trace'|'done'} kind
 * @property {LisMethod} method
 * @property {number[]} values
 * @property {number} i  The value being handled, -1 for none.
 * @property {number} j  dp: the earlier index compared with i, -1 for none.
 * @property {(number|null)[]} L  dp: L[i] so far; null before i is reached.
 * @property {number[]} prev  dp: prev[i], -1 for none. patience: back[i], -1 for none.
 * @property {number[][]} piles  patience: indices on each pile, bottom first.
 * @property {number} lo  patience: binary search bounds over the pile tops, half-open.
 * @property {number} hi
 * @property {number} mid  patience: the pile top compared now, -1 for none.
 * @property {number} pile  patience: the pile a value goes on, -1 for none.
 * @property {number[]} lis  Indices of the subsequence rebuilt so far, in order.
 * @property {number} comparisons
 * @property {number} length  The best length found so far.
 * @property {number[]} lines
 */

export const MAX_N = 12;
export const MAX_ABS = 99;

/** The example from many textbooks: one LIS is 10, 22, 33, 50, 60, 80. */
export const LIS_EXAMPLE = [10, 22, 9, 33, 21, 50, 41, 60, 80, 3];

export const lisPseudocode = {
  dp: [
    'lisDP(a[0..n-1]):',
    '  for i = 0 to n - 1:',
    '    L[i] = 1; prev[i] = none      // a[i] alone',
    '    for j = 0 to i - 1:',
    '      if a[j] < a[i] and L[j] + 1 > L[i]:',
    '        L[i] = L[j] + 1; prev[i] = j   // extend the run ending at j',
    '  end = first i with the largest L[i]',
    '  follow prev from end to rebuild the LIS',
  ],
  patience: [
    'lisPatience(a[0..n-1]):',
    '  piles = []                 // pile tops stay increasing',
    '  for i = 0 to n - 1:',
    '    k = leftmost pile with top ≥ a[i]   // binary search',
    '    if there is none: start a new pile k on the right',
    '    put a[i] on pile k; back[i] = top of pile k − 1',
    '  follow back from the top of the last pile',
  ],
};

/**
 * Reads whole numbers separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'count'|'range'}}
 */
export function parseLisValues(text) {
  const parts = text
    .replace(/[−–]/g, '-')
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (parts.some((p) => !/^-?\d+$/.test(p))) return { error: 'format' };
  const values = parts.map(Number);
  if (values.length < 1 || values.length > MAX_N) return { error: 'count' };
  if (values.some((v) => Math.abs(v) > MAX_ABS)) return { error: 'range' };
  return { values };
}

/**
 * @param {LisMethod} method
 * @param {number[]} input  1 to MAX_N values.
 * @returns {LisFrame[]}
 */
export function lisTrace(method, input) {
  const a = input.slice();
  const n = a.length;
  /** @type {LisFrame[]} */
  const frames = [];
  /** @type {(number|null)[]} */
  const L = Array(n).fill(null);
  const prev = Array(n).fill(-1);
  /** @type {number[][]} */
  const piles = [];
  /** @type {number[]} */
  let lis = [];
  let comparisons = 0;
  let length = 0;

  /** @param {Pick<LisFrame, 'kind'|'lines'> & Partial<LisFrame>} f */
  const push = (f) =>
    frames.push({
      i: -1,
      j: -1,
      lo: -1,
      hi: -1,
      mid: -1,
      pile: -1,
      ...f,
      lines: f.lines.slice(),
      method,
      values: a.slice(),
      L: L.slice(),
      prev: prev.slice(),
      piles: piles.map((p) => p.slice()),
      lis: lis.slice(),
      comparisons,
      length,
    });

  push({ kind: 'start', lines: [0, 1] });

  /** @param {number} end @param {number} line */
  const rebuild = (end, line) => {
    for (let k = end; k >= 0; k = prev[k]) {
      lis = [k, ...lis];
      push({ kind: 'trace', lines: [line], i: k });
    }
  };

  if (method === 'dp') {
    for (let i = 0; i < n; i++) {
      L[i] = 1;
      push({ kind: 'begin', lines: [1, 2], i });
      for (let j = 0; j < i; j++) {
        comparisons++;
        const li = /** @type {number} */ (L[i]);
        const lj = /** @type {number} */ (L[j]);
        if (a[j] < a[i] && lj + 1 > li) {
          L[i] = lj + 1;
          prev[i] = j;
          length = Math.max(length, lj + 1);
          push({ kind: 'extend', lines: [3, 4, 5], i, j });
        } else {
          push({ kind: 'compare', lines: [3, 4], i, j });
        }
      }
      length = Math.max(length, /** @type {number} */ (L[i]));
    }
    const nums = /** @type {number[]} */ (L);
    const end = nums.indexOf(Math.max(...nums));
    push({ kind: 'best', lines: [6], i: end });
    rebuild(end, 7);
  } else {
    for (let i = 0; i < n; i++) {
      push({ kind: 'take', lines: [2], i });
      let lo = 0;
      let hi = piles.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        comparisons++;
        push({ kind: 'probe', lines: [3], i, lo, hi, mid });
        if (a[/** @type {number} */ (piles[mid].at(-1))] >= a[i]) hi = mid;
        else lo = mid + 1;
      }
      prev[i] = lo > 0 ? /** @type {number} */ (piles[lo - 1].at(-1)) : -1;
      if (lo === piles.length) {
        piles.push([i]);
        length = piles.length;
        push({ kind: 'newpile', lines: [4, 5], i, pile: lo, lo, hi: lo });
      } else {
        piles[lo].push(i);
        push({ kind: 'place', lines: [5], i, pile: lo, lo, hi: lo });
      }
    }
    rebuild(/** @type {number} */ (piles.at(-1)?.at(-1)), 6);
  }

  push({ kind: 'done', lines: [], i: -1 });
  return frames;
}
