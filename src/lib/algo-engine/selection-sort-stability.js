/**
 * Step traces for selection sort on cards that carry a key and a tag. Cards with equal keys
 * get tags a, b, c … in input order, so the final order of the tags shows whether the sort is
 * stable. Two in-place variants share the same scan for the minimum: the classic one swaps the
 * minimum into place (unstable), the other shifts the cards in between one slot right and drops
 * the minimum in front (stable, but it writes more slots).
 */

/**
 * A card to sort. `tag` counts earlier cards with the same key: 0 is the first (a), 1 the
 * second (b), and so on.
 * @typedef {{id: number, key: number, tag: number}} Card
 */

/** @typedef {'swap'|'shift'} SelectionVariant */

/**
 * @typedef {object} SelectionFrame
 * @property {'start'|'pass'|'compare'|'swap'|'shift'|'keep'|'done'} kind
 * @property {SelectionVariant} variant
 * @property {Card[]} items  Card order after this step.
 * @property {number} i  Slot this pass fills; -1 at start and done.
 * @property {number} j  Card being compared with the minimum; -1 when not scanning.
 * @property {number} min  Smallest card found so far in this pass; -1 when none.
 * @property {number} sortedCount  Slots 0..sortedCount-1 hold their final cards.
 * @property {number} comparisons  Running total of key comparisons.
 * @property {number} writes  Running total of array slots written.
 * @property {boolean} [smaller]  On 'compare': a[j] is smaller, so min moves to j.
 * @property {number} from  On 'swap' and 'shift': where the minimum came from; -1 otherwise.
 * @property {number[]} lines
 */

export const MAX_N = 10;
export const MIN_KEY = 0;
export const MAX_KEY = 99;

const head = [
  'for i = 0 to n - 2:',
  '  min = i',
  '  for j = i + 1 to n - 1:',
  '    if a[j].key < a[min].key: min = j',
];

/** @type {Record<SelectionVariant, string[]>} */
export const selectionPseudocode = {
  swap: [...head, '  if min != i: swap(a[i], a[min])', 'done: a is sorted'],
  shift: [
    ...head,
    '  if min != i: shift a[i..min-1] right; put old a[min] at i',
    'done: a is sorted',
  ],
};

/**
 * Tags equal keys a, b, c … in input order.
 * @param {number[]} keys
 * @returns {Card[]}
 */
export function toCards(keys) {
  /** @type {Map<number, number>} */
  const seen = new Map();
  return keys.map((key, id) => {
    const tag = seen.get(key) ?? 0;
    seen.set(key, tag + 1);
    return { id, key, tag };
  });
}

/**
 * Reads keys typed as whole numbers separated by commas or spaces.
 * @param {string} text
 * @returns {{keys: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseKeys(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const keys = tokens.map(Number);
  if (keys.some((k) => k < MIN_KEY || k > MAX_KEY)) return { error: 'range' };
  if (keys.length < 2 || keys.length > MAX_N) return { error: 'count' };
  return { keys };
}

/**
 * Random keys from 1 to 4, so most arrays have repeated keys to watch.
 * @param {number} n @param {() => number} [rand]
 */
export function randomKeys(n, rand = Math.random) {
  return Array.from({ length: n }, () => 1 + Math.floor(rand() * 4));
}

/**
 * For every key that appears more than once: its tags in the current order, and whether they
 * are still in input order.
 * @param {Card[]} items
 * @returns {{key: number, tags: number[], kept: boolean}[]}
 */
export function equalKeyOrder(items) {
  /** @type {Map<number, number[]>} */
  const groups = new Map();
  for (const c of items) groups.set(c.key, [...(groups.get(c.key) ?? []), c.tag]);
  return [...groups.entries()]
    .filter(([, tags]) => tags.length > 1)
    .sort(([a], [b]) => a - b)
    .map(([key, tags]) => ({ key, tags, kept: tags.every((t, k) => k === 0 || tags[k - 1] < t) }));
}

/**
 * @param {Card[]} input
 * @param {SelectionVariant} [variant]
 * @returns {SelectionFrame[]}
 */
export function selectionSortTrace(input, variant = 'swap') {
  const a = input.map((c) => ({ ...c }));
  const n = a.length;
  /** @type {SelectionFrame[]} */
  const frames = [];
  let comparisons = 0;
  let writes = 0;
  let sortedCount = 0;

  /** @param {Pick<SelectionFrame, 'kind'|'lines'> & Partial<SelectionFrame>} f */
  const push = (f) =>
    frames.push({
      i: -1,
      j: -1,
      min: -1,
      from: -1,
      ...f,
      variant,
      items: a.map((c) => ({ ...c })),
      sortedCount,
      comparisons,
      writes,
    });

  push({ kind: 'start', lines: [] });
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    push({ kind: 'pass', lines: [0, 1], i, min });
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      const smaller = a[j].key < a[min].key;
      if (smaller) min = j;
      push({ kind: 'compare', lines: [2, 3], i, j, min, smaller });
    }
    if (min === i) {
      sortedCount = i + 1;
      push({ kind: 'keep', lines: [4], i, min });
      continue;
    }
    const x = a[min];
    if (variant === 'swap') {
      a[min] = a[i];
      a[i] = x;
      writes += 2;
    } else {
      for (let k = min; k > i; k--) a[k] = a[k - 1];
      a[i] = x;
      writes += min - i + 1;
    }
    sortedCount = i + 1;
    push({ kind: variant, lines: [4], i, min: i, from: min });
  }
  sortedCount = n;
  push({ kind: 'done', lines: [5] });
  return frames;
}
