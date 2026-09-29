/**
 * Hash table with separate chaining (CLRS 11.2) and three hash functions
 * (CLRS 11.3). The trace inserts every key in order, growing the table when the
 * load factor passes MAX_LOAD, then optionally searches for one key.
 */

/** @typedef {'mod-prime'|'mod-pow2'|'multiply'} HashFn */
/** @typedef {'random'|'sequential'|'multiples-of-8'} KeyPreset */

/**
 * @typedef {object} HashFrame
 * @property {'start'|'hash'|'walk'|'append'|'update'|'grow'|'rehash'|'grown'|'search-hit'|'search-miss'|'done'} kind
 * @property {number[][]} buckets  Snapshot of every chain (deep-copied per frame).
 * @property {number} m            Table size.
 * @property {number} n            Distinct keys stored.
 * @property {number} key          Key in flight, -1 when none.
 * @property {number} bucket       Focus bucket, -1 when none.
 * @property {number} pos          Index in the chain being compared, -1 when none.
 * @property {number} moved        Key just moved by a rehash, -1 when none.
 * @property {number[]} pending    Keys still waiting to be rehashed (empty outside a grow).
 * @property {number[]} lines
 * @property {number} comparisons  Running total of key comparisons.
 * @property {number} collisions   Running total of inserts into a non-empty chain.
 * @property {number} load         n / m.
 * @property {number} longest      Longest chain length.
 */

/** Table sizes per hash function, smallest first. */
export const HASH_SIZES = /** @type {Record<HashFn, number[]>} */ ({
  'mod-prime': [5, 11, 23, 47],
  'mod-pow2': [4, 8, 16, 32],
  multiply: [4, 8, 16, 32],
});

export const MAX_LOAD = 0.75;
export const MAX_KEYS = 24;
export const MAX_KEY = 999;

export const hashPseudocode = [
  'insert(key):',
  '  b = hash(key) mod m',
  '  walk chain b: if an entry equals key, update it and stop',
  '  append key to chain b; n = n + 1',
  '  if n / m > 0.75: grow()',
  'grow(): m = larger size; re-insert every key with the new hash',
  'search(key): b = hash(key); walk chain b; found or not found',
];

/** Knuth's multiplicative constant, (sqrt(5) - 1) / 2. */
const A = (Math.sqrt(5) - 1) / 2;

/**
 * @param {number} key
 * @param {number} m
 * @param {HashFn} fn
 * @returns {number} Bucket index in [0, m).
 */
export function hashKey(key, m, fn) {
  if (fn === 'multiply') return Math.floor(m * ((key * A) % 1));
  return key % m;
}

/** @param {number[][]} buckets */
const longestChain = (buckets) => buckets.reduce((best, c) => Math.max(best, c.length), 0);

/**
 * @param {number[]} keys
 * @param {HashFn} fn
 * @param {number | null} [search] Key to look up after the inserts, or null.
 * @returns {HashFrame[]}
 */
export function hashTableTrace(keys, fn, search = null) {
  const sizes = HASH_SIZES[fn];
  let sizeIndex = 0;
  let m = sizes[0];
  /** @type {number[][]} */
  let buckets = Array.from({ length: m }, () => []);
  let n = 0;
  let comparisons = 0;
  let collisions = 0;
  /** @type {HashFrame[]} */
  const frames = [];

  /**
   * @param {HashFrame['kind']} kind
   * @param {number[]} lines
   * @param {Partial<HashFrame>} [extra]
   */
  function push(kind, lines, extra = {}) {
    frames.push({
      kind,
      buckets: buckets.map((c) => c.slice()),
      m: buckets.length,
      n,
      key: -1,
      bucket: -1,
      pos: -1,
      moved: -1,
      pending: [],
      lines,
      comparisons,
      collisions,
      load: n / buckets.length,
      longest: longestChain(buckets),
      ...extra,
    });
  }

  function grow() {
    const pending = buckets.flat();
    push('grow', [4, 5], { pending: pending.slice() });
    sizeIndex++;
    m = sizes[sizeIndex];
    buckets = Array.from({ length: m }, () => []);
    pending.forEach((key, i) => {
      const bucket = hashKey(key, m, fn);
      buckets[bucket].push(key);
      push('rehash', [5], { key: -1, bucket, moved: key, pending: pending.slice(i + 1) });
    });
    push('grown', [5]);
  }

  push('start', []);
  for (const key of keys) {
    const bucket = hashKey(key, m, fn);
    push('hash', [0, 1], { key, bucket });
    const chain = buckets[bucket];
    let found = false;
    for (let pos = 0; pos < chain.length; pos++) {
      comparisons++;
      push('walk', [2], { key, bucket, pos });
      if (chain[pos] === key) {
        push('update', [2], { key, bucket, pos });
        found = true;
        break;
      }
    }
    if (found) continue;
    if (chain.length > 0) collisions++;
    chain.push(key);
    n++;
    push('append', [3], { key, bucket, pos: chain.length - 1 });
    if (n / m > MAX_LOAD && sizeIndex < sizes.length - 1) grow();
  }

  if (search === null) {
    push('done', []);
    return frames;
  }

  const bucket = hashKey(search, m, fn);
  push('hash', [6], { key: search, bucket });
  const chain = buckets[bucket];
  for (let pos = 0; pos < chain.length; pos++) {
    comparisons++;
    push('walk', [6], { key: search, bucket, pos });
    if (chain[pos] === search) {
      push('search-hit', [6], { key: search, bucket, pos });
      return frames;
    }
  }
  push('search-miss', [6], { key: search, bucket });
  return frames;
}

/**
 * @param {KeyPreset} preset
 * @param {number} n Clamped to [1, MAX_KEYS].
 * @param {() => number} [rand]
 * @returns {number[]}
 */
export function makeKeys(preset, n, rand = Math.random) {
  const count = Math.max(1, Math.min(MAX_KEYS, Math.floor(n)));
  if (preset === 'sequential') return Array.from({ length: count }, (_, i) => 100 + i);
  if (preset === 'multiples-of-8') return Array.from({ length: count }, (_, i) => 8 * i);
  const seen = new Set();
  while (seen.size < count) seen.add(Math.floor(rand() * (MAX_KEY + 1)));
  return [...seen];
}

/**
 * @param {string} text Comma-separated whole numbers.
 * @returns {{keys: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseKeys(text) {
  const tokens = text.split(',').map((s) => s.trim());
  if (!tokens.every((s) => /^-?\d+$/.test(s))) return { error: 'format' };
  const keys = tokens.map(Number);
  if (keys.some((k) => k < 0 || k > MAX_KEY)) return { error: 'range' };
  if (keys.length > MAX_KEYS) return { error: 'count' };
  return { keys };
}
