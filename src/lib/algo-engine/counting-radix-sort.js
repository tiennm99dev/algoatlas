/**
 * Step traces for two sorts that never compare keys. Counting sort tallies how often each key
 * appears, turns the tallies into end positions with a running sum, and places every item
 * from right to left so equal keys keep their order. LSD radix sort runs one stable bucket
 * pass per decimal digit, from the ones digit up; because each pass is stable, ties on the
 * current digit stay in the order the earlier digits put them in.
 */

/** @typedef {import('./sorting.js').Item} Item */

/**
 * @typedef {object} CountingFrame
 * @property {'start'|'count'|'prefix'|'place'|'done'} kind
 * @property {Item[]} input  The input, never reordered.
 * @property {number[]} count  The count array after this step: tallies, then end positions.
 * @property {(Item | null)[]} output  The output array; null slots are not written yet.
 * @property {number} i  Input slot read by this step; -1 when none.
 * @property {number} v  Count cell updated by this step; -1 when none.
 * @property {number} pos  Output slot written by 'place'; -1 otherwise.
 * @property {number} steps  Loop iterations so far: n to count, k to sum, n to place.
 * @property {number[]} lines
 */

/**
 * @typedef {object} RadixFrame
 * @property {'start'|'pass'|'drop'|'collect'|'done'} kind
 * @property {Item[]} items  The array after this step.
 * @property {Item[][]} buckets  Ten queues, one per digit value.
 * @property {number} place  1, 10 or 100 during a pass; 0 at start and done.
 * @property {number} i  Slot of the item just dropped; -1 when none.
 * @property {number} digit  Bucket it went to; -1 when none.
 * @property {number} passes  Passes started so far.
 * @property {number} moves  Items appended to buckets or written back so far.
 * @property {number[]} lines
 */

export const MAX_N = 12;
export const MAX_COUNT_KEY = 9;
export const MAX_RADIX_KEY = 999;

export const countingPseudocode = [
  'k = largest key; count = k + 1 zeros',
  'for i = 0 to n - 1: count[a[i]] += 1',
  'for v = 1 to k: count[v] += count[v - 1]',
  'for i = n - 1 down to 0:  // keeps ties in order',
  '  count[a[i]] -= 1; out[count[a[i]]] = a[i]',
  'done: out is sorted',
];

export const radixPseudocode = [
  'for each digit place, ones first:',
  '  buckets 0..9 = empty queues',
  '  for x in a: append x to buckets[digit of x]',
  '  a = buckets 0..9 joined   // stable',
  'done: a is sorted',
];

/**
 * Reads whole numbers from 0 to `max`, separated by commas or spaces.
 * @param {string} text
 * @param {number} max
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseKeys(text, max) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v > max)) return { error: 'range' };
  if (values.length < 2 || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * n random keys from 0 to max.
 * @param {number} n @param {number} max @param {() => number} [rand]
 */
export function randomKeys(n, max, rand = Math.random) {
  return Array.from({ length: n }, () => Math.floor(rand() * (max + 1)));
}

/**
 * The decimal digit of x at a place value (1, 10, 100).
 * @param {number} x @param {number} place
 */
export function digitAt(x, place) {
  return Math.floor(x / place) % 10;
}

/**
 * @param {Item[]} input
 * @returns {CountingFrame[]}
 */
export function countingSortTrace(input) {
  const a = input.map((it) => ({ ...it }));
  const n = a.length;
  const k = Math.max(0, ...a.map((it) => it.value));
  const count = Array.from({ length: k + 1 }, () => 0);
  /** @type {(Item | null)[]} */
  const out = Array.from({ length: n }, () => null);
  /** @type {CountingFrame[]} */
  const frames = [];
  let steps = 0;

  /** @param {Pick<CountingFrame, 'kind'|'lines'> & Partial<CountingFrame>} f */
  const push = (f) =>
    frames.push({
      i: -1,
      v: -1,
      pos: -1,
      ...f,
      input: a.map((it) => ({ ...it })),
      count: count.slice(),
      output: out.map((it) => (it ? { ...it } : null)),
      steps,
    });

  push({ kind: 'start', lines: [0] });
  for (let i = 0; i < n; i++) {
    count[a[i].value]++;
    steps++;
    push({ kind: 'count', lines: [1], i, v: a[i].value });
  }
  for (let v = 1; v <= k; v++) {
    count[v] += count[v - 1];
    steps++;
    push({ kind: 'prefix', lines: [2], v });
  }
  for (let i = n - 1; i >= 0; i--) {
    const v = a[i].value;
    count[v]--;
    out[count[v]] = a[i];
    steps++;
    push({ kind: 'place', lines: [3, 4], i, v, pos: count[v] });
  }
  push({ kind: 'done', lines: [5] });
  return frames;
}

/**
 * @param {Item[]} input
 * @returns {RadixFrame[]}
 */
export function radixSortTrace(input) {
  let a = input.map((it) => ({ ...it }));
  const max = Math.max(0, ...a.map((it) => it.value));
  const digits = String(max).length;
  /** @type {Item[][]} */
  let buckets = Array.from({ length: 10 }, () => []);
  /** @type {RadixFrame[]} */
  const frames = [];
  let passes = 0;
  let moves = 0;

  /** @param {Pick<RadixFrame, 'kind'|'lines'> & Partial<RadixFrame>} f */
  const push = (f) =>
    frames.push({
      place: 0,
      i: -1,
      digit: -1,
      ...f,
      items: a.map((it) => ({ ...it })),
      buckets: buckets.map((b) => b.map((it) => ({ ...it }))),
      passes,
      moves,
    });

  push({ kind: 'start', lines: [] });
  for (let d = 0, place = 1; d < digits; d++, place *= 10) {
    buckets = Array.from({ length: 10 }, () => []);
    passes++;
    push({ kind: 'pass', lines: [0, 1], place });
    for (let i = 0; i < a.length; i++) {
      const digit = digitAt(a[i].value, place);
      buckets[digit].push(a[i]);
      moves++;
      push({ kind: 'drop', lines: [2], place, i, digit });
    }
    a = buckets.flat();
    moves += a.length;
    push({ kind: 'collect', lines: [3], place });
  }
  buckets = Array.from({ length: 10 }, () => []);
  push({ kind: 'done', lines: [4] });
  return frames;
}
