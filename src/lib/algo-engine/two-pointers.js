/**
 * Two pointers that start at the two ends of an array and walk towards each other.
 *
 * - `pair`: on a sorted array, find indices lo < hi with a[lo] + a[hi] = T. A sum that is too
 *   small cannot be fixed by any partner of a[lo] (a[hi] is already the largest one left), so
 *   lo moves right; a sum that is too large rules out a[hi] in the same way. Every step
 *   discards one element, so at most n − 1 sums are checked instead of n(n − 1)/2 pairs.
 * - `partition`: rearrange an array in place so every value < p comes before every value
 *   ≥ p. i grows the left part, j grows the right part, and a misplaced pair is swapped.
 */

export const MAX_N = 16;
export const MIN_VALUE = -99;
export const MAX_VALUE = 99;

/** @typedef {'pair' | 'partition'} PointerMode */

export const pointerPseudocode = {
  pair: [
    'pairSum(a, T):          ▹ a sorted ascending',
    '  lo = 0; hi = n − 1',
    '  while lo < hi:',
    '    s = a[lo] + a[hi]',
    '    if s == T: return (lo, hi)',
    '    else if s < T: lo = lo + 1',
    '    else: hi = hi − 1',
    '  return none',
  ],
  partition: [
    'partition(a, p):        ▹ values < p to the left',
    '  i = 0; j = n − 1',
    '  while i ≤ j:',
    '    if a[i] < p: i = i + 1',
    '    else if a[j] ≥ p: j = j − 1',
    '    else:',
    '      swap a[i], a[j]',
    '      i = i + 1; j = j − 1',
    '  return i             ▹ a[0..i) < p ≤ a[i..n)',
  ],
};

/**
 * @typedef {object} PointerFrame
 * @property {'start'|'sum'|'found'|'move-left'|'move-right'|'missing'|'keep-left'|'keep-right'|'swap'|'done'} kind
 * @property {PointerMode} mode
 * @property {number[]} items  The array as it stands (sorted for `pair`).
 * @property {number} left  lo (pair) or i (partition).
 * @property {number} right  hi (pair) or j (partition).
 * @property {number} target  T (pair) or p (partition).
 * @property {number | null} sum  a[lo] + a[hi] on a `sum` frame and after it, else null.
 * @property {number} checks  Sums checked (pair) or comparisons with p (partition).
 * @property {number} swaps
 * @property {[number, number] | null} found  The pair of indices, once found.
 * @property {[number, number] | null} swapped  The two indices just swapped.
 * @property {number} boundary  The returned i of a partition, -1 until it is known.
 * @property {number[]} lines
 */

/**
 * Reads a comma- or space-separated list of whole numbers.
 * @param {string} text
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseValues(text) {
  const tokens = text
    .replace(/[−–]/g, '-')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^-?\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length < 2 || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * A random array of n values from 1 to 40.
 * @param {number} n @param {() => number} [rand]
 */
export function randomValues(n, rand = Math.random) {
  return Array.from({ length: n }, () => 1 + Math.floor(rand() * 40));
}

/**
 * @param {PointerMode} mode
 * @param {number[]} items
 * @param {number} target
 */
function recorder(mode, items, target) {
  /** @type {PointerFrame[]} */
  const frames = [];
  const state = {
    left: 0,
    right: items.length - 1,
    /** @type {number | null} */
    sum: null,
    checks: 0,
    swaps: 0,
    /** @type {[number, number] | null} */
    found: null,
    /** @type {[number, number] | null} */
    swapped: null,
    boundary: -1,
  };
  /** @param {PointerFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      mode,
      items: items.slice(),
      left: state.left,
      right: state.right,
      target,
      sum: state.sum,
      checks: state.checks,
      swaps: state.swaps,
      found: state.found ? [state.found[0], state.found[1]] : null,
      swapped: state.swapped ? [state.swapped[0], state.swapped[1]] : null,
      boundary: state.boundary,
      lines: lines.slice(),
    });
  }
  return { frames, state, push };
}

/**
 * Converging pair search on the values sorted ascending.
 * @param {number[]} values  2 ≤ length ≤ MAX_N.
 * @param {number} target
 * @returns {PointerFrame[]}
 */
export function pairSumTrace(values, target) {
  const a = values.slice().sort((x, y) => x - y);
  const { frames, state, push } = recorder('pair', a, target);
  push('start', [0, 1]);
  while (state.left < state.right) {
    state.sum = a[state.left] + a[state.right];
    state.checks++;
    push('sum', [2, 3]);
    if (state.sum === target) {
      state.found = [state.left, state.right];
      push('found', [4]);
      break;
    }
    if (state.sum < target) {
      state.left++;
      push('move-left', [5]);
    } else {
      state.right--;
      push('move-right', [6]);
    }
  }
  if (!state.found) push('missing', [2, 7]);
  push('done', frames[frames.length - 1].lines);
  return frames;
}

/**
 * In-place two-pointer partition around p.
 * @param {number[]} values  2 ≤ length ≤ MAX_N.
 * @param {number} pivot
 * @returns {PointerFrame[]}
 */
export function partitionTrace(values, pivot) {
  const a = values.slice();
  const { frames, state, push } = recorder('partition', a, pivot);
  push('start', [0, 1]);
  while (state.left <= state.right) {
    state.swapped = null;
    state.checks++;
    if (a[state.left] < pivot) {
      state.left++;
      push('keep-left', [2, 3]);
      continue;
    }
    state.checks++;
    if (a[state.right] >= pivot) {
      state.right--;
      push('keep-right', [2, 3, 4]);
      continue;
    }
    const i = state.left;
    const j = state.right;
    [a[i], a[j]] = [a[j], a[i]];
    state.swaps++;
    state.swapped = [i, j];
    state.left++;
    state.right--;
    push('swap', [3, 4, 5, 6, 7]);
  }
  state.swapped = null;
  state.boundary = state.left;
  push('done', [2, 8]);
  return frames;
}

/**
 * @param {PointerMode} mode @param {number[]} values @param {number} target
 */
export function pointerTrace(mode, values, target) {
  return mode === 'pair' ? pairSumTrace(values, target) : partitionTrace(values, target);
}
