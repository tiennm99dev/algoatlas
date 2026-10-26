/**
 * Linear search as a step trace, in two variants over the same array:
 * - `plain`: test the bound `i < n`, then compare `a[i]` with x, on every step;
 * - `sentinel`: copy x into an extra slot a[n] first, so the loop needs no
 *   bound test and only one bound test runs after it stops.
 * Both return the first index holding x, or -1 when x is absent.
 */

export const MIN_N = 1;
export const MAX_N = 16;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;

/** @typedef {'plain'|'sentinel'} LinearVariant */

/**
 * @typedef {object} LinearFrame
 * @property {'start'|'compare'|'found'|'not-found'} kind
 * @property {LinearVariant} variant
 * @property {number} i            Index being compared; -1 before the first comparison.
 * @property {boolean} match       True on a compare frame whose a[i] equals x.
 * @property {number} answer       -2 until the search ends, then the index found or -1.
 * @property {number} comparisons  Running total of key comparisons a[i] == x.
 * @property {number} boundChecks  Running total of bound tests i < n.
 * @property {number[]} lines
 */

/** @type {Record<LinearVariant, string[]>} */
export const linearPseudocode = {
  plain: [
    'i = 0',
    'while i < n:              // bound check',
    '  if a[i] == x: return i  // key comparison',
    '  i = i + 1',
    'return -1                 // x is not in a',
  ],
  sentinel: [
    'a[n] = x; i = 0           // sentinel after the last cell',
    'while a[i] != x:          // key comparison only',
    '  i = i + 1',
    'if i < n: return i        // the one bound check',
    'return -1                 // stopped on the sentinel',
  ],
};

/**
 * @param {number[]} a Any order; duplicates allowed.
 * @param {number} x
 * @param {LinearVariant} variant
 * @returns {LinearFrame[]}
 */
export function linearSearchTrace(a, x, variant) {
  const n = a.length;
  let comparisons = 0;
  let boundChecks = 0;
  /** @type {LinearFrame[]} */
  const frames = [];
  /** @param {Omit<LinearFrame, 'variant'|'comparisons'|'boundChecks'>} f */
  const push = (f) => frames.push({ ...f, variant, comparisons, boundChecks });

  push({ kind: 'start', i: -1, match: false, answer: -2, lines: [0] });

  if (variant === 'plain') {
    for (let i = 0; ; i++) {
      // i = i + 1 runs between two iterations, then the bound check on line 1.
      const step = i === 0 ? [] : [3];
      boundChecks++;
      if (i >= n) {
        push({ kind: 'not-found', i, match: false, answer: -1, lines: [...step, 1, 4] });
        return frames;
      }
      comparisons++;
      const match = a[i] === x;
      push({ kind: 'compare', i, match, answer: -2, lines: [...step, 1, 2] });
      if (match) {
        push({ kind: 'found', i, match, answer: i, lines: [2] });
        return frames;
      }
    }
  }

  // Sentinel: the copy of x at index n guarantees the loop stops by i = n.
  let i = 0;
  for (;;) {
    comparisons++;
    const match = i === n || a[i] === x;
    push({ kind: 'compare', i, match, answer: -2, lines: i === 0 ? [1] : [2, 1] });
    if (match) break;
    i++;
  }
  boundChecks++;
  if (i < n) push({ kind: 'found', i, match: true, answer: i, lines: [3] });
  else push({ kind: 'not-found', i, match: true, answer: -1, lines: [3, 4] });
  return frames;
}

/**
 * Reads a comma- or space-separated list of whole numbers.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseValues(text) {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (!parts.every((p) => /^-?\d+$/.test(p))) return { error: 'format' };
  const values = parts.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length < MIN_N || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * Distinct-ish random values in no particular order.
 * @param {number} n
 * @param {() => number} [rand]
 */
export function makeUnsortedArray(n, rand = Math.random) {
  return Array.from({ length: n }, () => Math.floor(rand() * 90) + 10);
}
