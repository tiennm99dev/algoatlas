/**
 * A window [left, right) that slides over an array while a running sum follows it, so each
 * step updates the sum by the elements that enter or leave instead of adding the window up
 * again.
 *
 * - `fixed`: the largest sum of k consecutive values. The first window costs k additions;
 *   every slide after it adds the entering value and subtracts the leaving one.
 * - `variable`: the shortest window whose sum is at least S, for values ≥ 0. The right end
 *   grows the window; while the sum is big enough the left end shrinks it. Every element
 *   enters once and leaves at most once, so the scan is O(n).
 */

export const MAX_N = 20;
export const MAX_VALUE = 99;
export const MAX_TARGET = MAX_N * MAX_VALUE;

/** @typedef {'fixed' | 'variable'} WindowMode */

export const windowPseudocode = {
  fixed: [
    'maxWindowSum(a, k):',
    '  sum = a[0] + … + a[k − 1]',
    '  best = sum',
    '  for r = k to n − 1:',
    '    sum = sum + a[r] − a[r − k]   ▹ slide right by one',
    '    best = max(best, sum)',
    '  return best',
  ],
  variable: [
    'shortestWindow(a, S):         ▹ every a[i] ≥ 0',
    '  l = 0; sum = 0; best = ∞',
    '  for r = 0 to n − 1:',
    '    sum = sum + a[r]          ▹ grow on the right',
    '    while sum ≥ S:',
    '      best = min(best, r − l + 1)',
    '      sum = sum − a[l]; l = l + 1   ▹ shrink on the left',
    '  return best',
  ],
};

/**
 * @typedef {object} WindowFrame
 * @property {'start'|'fill'|'first'|'slide'|'expand'|'record'|'shrink'|'done'} kind
 * @property {WindowMode} mode
 * @property {number[]} items
 * @property {number} target  k (fixed) or S (variable).
 * @property {number} left  First index in the window.
 * @property {number} right  One past the last index in the window.
 * @property {number} sum  Sum of items[left..right).
 * @property {number} entering  Index just added to the sum, -1 when none.
 * @property {number} leaving  Index just subtracted from the sum, -1 when none.
 * @property {number} best  Best sum (fixed) or shortest length (variable); 0 means none yet.
 * @property {number} bestFrom  Start of the best window, -1 when none.
 * @property {number} bestTo  One past the end of the best window, -1 when none.
 * @property {boolean} improved  The best changed on this frame.
 * @property {number} updates  Elements added to or subtracted from the sum so far.
 * @property {number} shrinks  Times the left end moved (variable).
 * @property {number[]} lines
 */

/**
 * Reads a comma- or space-separated list of whole numbers from 0 to MAX_VALUE.
 * @param {string} text
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseWindowValues(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v > MAX_VALUE)) return { error: 'range' };
  if (values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * Random values from 1 to 9, short enough to add up in your head.
 * @param {number} n @param {() => number} [rand]
 */
export function randomWindowValues(n, rand = Math.random) {
  return Array.from({ length: n }, () => 1 + Math.floor(rand() * 9));
}

/**
 * @param {WindowMode} mode @param {number[]} items @param {number} target
 */
function recorder(mode, items, target) {
  /** @type {WindowFrame[]} */
  const frames = [];
  const s = {
    left: 0,
    right: 0,
    sum: 0,
    entering: -1,
    leaving: -1,
    best: 0,
    bestFrom: -1,
    bestTo: -1,
    improved: false,
    updates: 0,
    shrinks: 0,
  };
  /** @param {WindowFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({ kind, mode, items: items.slice(), target, ...s, lines: lines.slice() });
    s.entering = -1;
    s.leaving = -1;
    s.improved = false;
  }
  return { frames, s, push };
}

/**
 * Largest sum of k consecutive values; ties keep the first window.
 * @param {number[]} values  1 ≤ length ≤ MAX_N.
 * @param {number} k  1 ≤ k ≤ length.
 * @returns {WindowFrame[]}
 */
export function fixedWindowTrace(values, k) {
  const a = values.slice();
  const { frames, s, push } = recorder('fixed', a, k);
  push('start', [0]);
  for (let r = 0; r < k; r++) {
    s.sum += a[r];
    s.right = r + 1;
    s.entering = r;
    s.updates++;
    push('fill', [1]);
  }
  s.best = s.sum;
  s.bestFrom = 0;
  s.bestTo = k;
  s.improved = true;
  push('first', [2]);
  for (let r = k; r < a.length; r++) {
    s.sum += a[r] - a[r - k];
    s.updates += 2;
    s.entering = r;
    s.leaving = r - k;
    s.left = r - k + 1;
    s.right = r + 1;
    if (s.sum > s.best) {
      s.best = s.sum;
      s.bestFrom = s.left;
      s.bestTo = s.right;
      s.improved = true;
    }
    push('slide', [3, 4, 5]);
  }
  push('done', [6]);
  return frames;
}

/**
 * Shortest window with sum ≥ S; ties keep the first window found.
 * @param {number[]} values  1 ≤ length ≤ MAX_N, every value ≥ 0.
 * @param {number} target  S ≥ 1.
 * @returns {WindowFrame[]}
 */
export function shortestWindowTrace(values, target) {
  const a = values.slice();
  const { frames, s, push } = recorder('variable', a, target);
  push('start', [0, 1]);
  for (let r = 0; r < a.length; r++) {
    s.sum += a[r];
    s.right = r + 1;
    s.entering = r;
    s.updates++;
    push('expand', [2, 3]);
    while (s.sum >= target) {
      const len = s.right - s.left;
      if (s.best === 0 || len < s.best) {
        s.best = len;
        s.bestFrom = s.left;
        s.bestTo = s.right;
        s.improved = true;
      }
      push('record', [4, 5]);
      s.sum -= a[s.left];
      s.leaving = s.left;
      s.left++;
      s.updates++;
      s.shrinks++;
      push('shrink', [6]);
    }
  }
  push('done', [7]);
  return frames;
}

/** @param {WindowMode} mode @param {number[]} values @param {number} target */
export function windowTrace(mode, values, target) {
  return mode === 'fixed' ? fixedWindowTrace(values, target) : shortestWindowTrace(values, target);
}
