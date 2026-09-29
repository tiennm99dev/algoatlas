/** @typedef {import('$lib/algo-engine/hash-table.js').HashFrame} HashFrame */
/** @typedef {import('$lib/algo-engine/hash-table.js').HashFn} HashFn */

/** @param {number} c */
const plural = (c) => `${c} comparison${c === 1 ? '' : 's'}`;

export const en = {
  slug: 'hash-table',
  topic: 'structures',
  level: 'Intermediate',
  title: 'Hash table',
  intro:
    'A hash table turns a key into a bucket number, so finding the key means looking in one short list instead of the whole collection. Watch keys land in buckets, collide, and get spread out again when the table grows.',
  instruction:
    'Pick a hash function and a set of keys, then step through the inserts. When the table is more than 75% full it doubles in size and every key is rehashed. Then search for a key that is present or missing.',
  takeaways: [
    'Chaining keeps every key whose hash collides in one list per bucket. A lookup walks only that list.',
    'The load factor n/m sets the average chain length. Growing the table when it passes 0.75 keeps lookups O(1) on average, and each key is moved O(1) times on average across all the growth.',
    'A bad table size ruins a good-looking hash: with m a power of two, k mod m keeps only the last bits, so multiples of 8 all land in the same few buckets. A prime m, or the multiplication method, spreads them.',
    'A search for a missing key costs the whole chain; a hit stops at the key’s position.',
  ],
  complexity: [
    ['Average', 'O(1)', 'Chains stay short while the load factor is bounded.'],
    ['Worst', 'O(n)', 'Every key hashes to one bucket.'],
    [
      'Grow',
      'O(n) once, O(1) amortized',
      'Doubling spreads the cost of rehashing over the inserts that filled the table.',
    ],
  ],
  nextTeaser:
    'Next up: binary search trees, which keep keys in order so you can also ask for the smallest, largest, or next key.',

  hashLabel: 'Hash',
  hashes: {
    'mod-prime': 'k mod m, m prime',
    'mod-pow2': 'k mod m, m = 2ᵖ',
    multiply: 'Multiplication',
  },
  /** @param {HashFn} fn @param {number} size */
  formula(fn, size) {
    return fn === 'multiply' ? `h(k) = ⌊${size} · frac(k · 0.618…)⌋` : `h(k) = k mod ${size}`;
  },
  presetLabel: 'Keys',
  presets: {
    random: 'Random',
    sequential: 'Sequential',
    'multiples-of-8': 'Multiples of 8',
    custom: 'Custom',
  },
  customLabel: 'Keys (comma-separated)',
  countLabel: 'Count',
  newKeys: 'New keys',
  searchLabel: 'Search for',
  searchButton: 'Search',
  keyErrors: {
    format: 'Keys must be whole numbers from 0 to 999, separated by commas.',
    range: 'Keys must be whole numbers from 0 to 999.',
    count: 'Use at most 24 keys.',
  },
  stats: {
    comparisons: 'Comparisons',
    collisions: 'Collisions',
    load: 'Load factor',
    longest: 'Longest chain',
    size: 'Table size',
  },
  bucketsLabel: 'Buckets',
  pendingLabel: 'Waiting to rehash',
  pendingEmpty: 'none left',
  emptyBucket: 'empty',
  /** @param {number} n */
  more(n) {
    return `+${n}`;
  },
  legend: {
    compare: 'Comparing',
    hit: 'Found',
    new: 'Just added',
    moving: 'Just moved',
  },
  /** Visible marks that accompany the chip colors. */
  marks: { compare: '?', hit: '✓', new: '+', moved: '→' },
  /** Spoken state of a highlighted chip. */
  chipStates: {
    compare: 'being compared',
    hit: 'found',
    new: 'just added',
    moved: 'just moved',
  },

  /** @param {HashFrame} f */
  describe(f) {
    const { key, bucket: b, pos, n, m, load } = f;
    const chain = b >= 0 ? f.buckets[b] : [];
    const search = f.lines.includes(6);
    switch (f.kind) {
      case 'start':
        return `Start with an empty table of ${m} buckets.`;
      case 'hash':
        return search ? `Search ${key}: hash to bucket ${b}.` : `Hash ${key} to bucket ${b}.`;
      case 'walk':
        return `Compare ${key} with ${chain[pos]} at position ${pos} of chain ${b}.`;
      case 'append':
        return chain.length === 1
          ? `Bucket ${b} is empty, so ${key} starts its chain.`
          : `Collision: bucket ${b} already holds ${chain.length - 1} key${chain.length === 2 ? '' : 's'}. Append ${key} to the chain.`;
      case 'update':
        return `${key} is already in chain ${b}, so update it in place.`;
      case 'grow':
        return `Load factor ${load.toFixed(2)} is over 0.75. Grow the table and rehash all ${n} keys.`;
      case 'rehash':
        return `Rehash ${f.moved} into bucket ${b} of ${m}. ${f.pending.length} still waiting.`;
      case 'grown':
        return `The table now has ${m} buckets and a load factor of ${load.toFixed(2)}.`;
      case 'search-hit':
        return `Found ${key} at position ${pos} of chain ${b} after ${plural(pos + 1)}.`;
      case 'search-miss':
        return `${key} is not in chain ${b}: ${plural(chain.length)}.`;
      case 'done':
        return `Inserted ${n} keys into ${m} buckets. Load factor ${load.toFixed(2)}.`;
    }
  },
};
