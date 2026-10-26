/**
 * Monotonic structures: keep only the indices that can still matter, in value order, and
 * throw the rest away for good. Each index is pushed once and popped at most once, so a scan
 * of n values costs O(n) in total even though one step may pop many (amortized O(1) a step).
 *
 * - `next-greater`: for each a[i], the first value to its right that is strictly greater
 *   (−1 when none). A stack holds the indices still waiting for an answer; their values
 *   never increase from bottom to top. A new value pops every smaller one and answers it.
 * - `window-max`: the maximum of every window of k consecutive values. A deque holds
 *   indices whose values strictly decrease from front to back; the front is the window's
 *   maximum. A new value pops every value ≤ it from the back, and the front leaves once it
 *   slides out of the window.
 */

export const MAX_N = 12;
export const MIN_VALUE = 1;
export const MAX_VALUE = 99;

/** @typedef {'next-greater' | 'window-max'} MonoMode */

export const monoPseudocode = {
  'next-greater': [
    'for i = 0 to n − 1:',
    '  while stack not empty and a[top] < a[i]:',
    '    answer[top] = a[i]; pop()',
    '  push(i)',
    'every index left on the stack: answer = −1',
  ],
  'window-max': [
    'for i = 0 to n − 1:',
    '  if front = i − k: popFront()        ▹ slid out of the window',
    '  while deque not empty and a[back] ≤ a[i]: popBack()',
    '  pushBack(i)',
    '  if i ≥ k − 1: max of a[i − k + 1..i] = a[front]',
  ],
};

/**
 * @typedef {object} MonoFrame
 * @property {'start'|'read'|'compare'|'pop'|'push'|'leftover'|'expire'|'emit'|'done'} kind
 * @property {MonoMode} mode
 * @property {number[]} items
 * @property {number} k  Window size (window-max); 0 for next-greater.
 * @property {number} i  Index being read, −1 when none.
 * @property {number[]} held  Indices in the stack (bottom to top) or deque (front to back).
 * @property {(number | null)[]} answer  next-greater: one per index (null = not known yet,
 *   −1 = none). window-max: one per window, by its first index.
 * @property {number} compared  Index compared with a[i] on this step, −1 when none.
 * @property {boolean} smaller  For a compare step: whether that index gets popped.
 * @property {number[]} popped  Indices popped on this step.
 * @property {number} pushes
 * @property {number} pops
 * @property {number} comparisons
 * @property {number[]} lines
 */

/**
 * @param {MonoMode} mode
 * @param {number[]} items
 * @param {number} [k]  Window size for window-max, 1 to items.length.
 * @returns {MonoFrame[]}
 */
export function monoTrace(mode, items, k = 0) {
  const n = items.length;
  const sliding = mode === 'window-max';
  /** @type {number[]} */
  const held = [];
  /** @type {(number | null)[]} */
  const answer = Array(sliding ? Math.max(0, n - k + 1) : n).fill(null);
  const s = {
    i: -1,
    compared: -1,
    smaller: false,
    /** @type {number[]} */
    popped: [],
    pushes: 0,
    pops: 0,
    comparisons: 0,
  };
  /** @type {MonoFrame[]} */
  const frames = [];

  /** @param {MonoFrame['kind']} kind @param {number[]} lines */
  function emit(kind, lines) {
    frames.push({
      kind,
      mode,
      items: items.slice(),
      k: sliding ? k : 0,
      i: s.i,
      held: held.slice(),
      answer: answer.slice(),
      compared: s.compared,
      smaller: s.smaller,
      popped: s.popped.slice(),
      pushes: s.pushes,
      pops: s.pops,
      comparisons: s.comparisons,
      lines: lines.slice(),
    });
    s.compared = -1;
    s.smaller = false;
    s.popped = [];
  }

  emit('start', []);
  for (let i = 0; i < n; i++) {
    s.i = i;
    emit('read', [0]);
    if (sliding && held.length > 0 && held[0] === i - k) {
      s.popped = [/** @type {number} */ (held.shift())];
      s.pops++;
      emit('expire', [1]);
    }
    const line = sliding ? 2 : 1;
    while (held.length > 0) {
      const back = held[held.length - 1];
      s.comparisons++;
      const goes = sliding ? items[back] <= items[i] : items[back] < items[i];
      s.compared = back;
      s.smaller = goes;
      emit('compare', [line]);
      if (!goes) break;
      held.pop();
      if (!sliding) answer[back] = items[i];
      s.popped = [back];
      s.pops++;
      emit('pop', [line + (sliding ? 0 : 1)]);
    }
    held.push(i);
    s.pushes++;
    emit('push', [3]);
    if (sliding && i >= k - 1) {
      answer[i - k + 1] = items[held[0]];
      emit('emit', [4]);
    }
  }
  s.i = -1;
  if (!sliding && held.length > 0) {
    for (const j of held) answer[j] = -1;
    emit('leftover', [4]);
  }
  emit('done', []);
  return frames;
}

/**
 * Reads a comma- or space-separated list of whole numbers from MIN_VALUE to MAX_VALUE.
 * @param {string} text
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseMonoValues(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((t) => /^\d+$/.test(t))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * @param {'mixed'|'falling'|'rising'|'random'} preset
 * @param {() => number} [rand]
 */
export function makeMonoValues(preset, rand = Math.random) {
  if (preset === 'mixed') return [4, 2, 7, 3, 1, 5, 8, 6];
  if (preset === 'falling') return [9, 8, 6, 5, 3, 2, 1];
  if (preset === 'rising') return [1, 2, 3, 5, 6, 8, 9];
  return Array.from({ length: 10 }, () => MIN_VALUE + Math.floor(rand() * 20));
}
