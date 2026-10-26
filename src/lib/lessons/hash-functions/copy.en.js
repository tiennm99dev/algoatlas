/** @typedef {import('$lib/algo-engine/hash-functions.js').HashFnFrame} HashFnFrame */
/** @typedef {import('$lib/algo-engine/hash-functions.js').FixedHash} FixedHash */

/** A count with its noun, singular for 1. */
/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @type {Record<FixedHash, string>} */
const FIXED_NAMES = { mod: 'k mod 16', multiply: 'the multiplication method' };

export const en = {
  slug: 'hash-functions',
  topic: 'structures',
  level: 'Intermediate',
  title: 'Designing hash functions',
  intro:
    'A hash table is only as fast as its hash function is even: the goal is for every key to be equally likely to land in any bucket. Any fixed function has inputs that all collide, and an adversary who knows it can send exactly those. Universal hashing picks the function at random when the table is made, so no input is bad on average.',
  summary:
    'Hash the same keys with a fixed function and a randomly drawn universal one, and compare their bucket histograms and colliding pairs.',
  instruction:
    'Pick a fixed hash and a key set, then step through. Each key lands in one bar on the left (the fixed hash) and one on the right (the universal hash). Load “Attack” to send keys an adversary chose against the fixed hash, then draw new a and b and see the right side stay spread.',
  takeaways: [
    'A good hash spreads keys uniformly: each of the m buckets gets about n/m keys, so chains stay short and the expected number of colliding pairs is about C(n, 2)/m.',
    'Every fixed hash sends at least 1/m of all possible keys to one bucket. An adversary who knows the function can send only those keys and turn every lookup into O(n).',
    'k mod m only uses the low bits of k when m is a power of two: keys that are multiples of 16 all land in bucket 0.',
    'Universal hashing draws h(k) = ((a·k + b) mod p) mod m at random with a prime p larger than every key. Then any two distinct keys collide with chance at most 1/m, whatever the keys are. Some draws are unlucky for some keys, but none is unlucky on average.',
    'Load “Attack” with k mod 16, then type a = 3 and b = 5: that draw happens to be bad for multiples of 16. Press “New a, b” a few times and compare the colliding pairs with the expected value.',
  ],
  complexityHead: ['Hash', 'Expected chain length', 'Why'],
  complexity: [
    ['Uniform (ideal)', 'O(1 + α)', 'Each key lands in any bucket with chance 1/m, independently.'],
    [
      'Universal, any fixed keys',
      'O(1 + α)',
      'Each pair collides with chance ≤ 1/m over the random choice of a, b.',
    ],
    ['Fixed, adversarial keys', 'O(n)', 'The adversary picks keys that all share one bucket.'],
    ['Computing h(k)', 'O(1)', 'A multiply, an add and two remainders.'],
  ],
  nextTeaser:
    'Next up: sets, maps and frequency counting, where a hash table answers “have I seen this?” and “how many times?” in O(1) on average.',

  fixedLabel: 'Fixed hash',
  fixedOptions: { mod: 'k mod 16', multiply: 'Multiplication' },
  fixedNames: FIXED_NAMES,
  keysLabel: 'Keys',
  keySets: { attack: 'Attack', sequential: 'Sequential', random: 'Random' },
  countLabel: 'Count',
  newKeys: 'New keys',
  aLabel: 'a',
  bLabel: 'b',
  drawButton: 'New a, b',
  abError: 'a must be a whole number from 1 to 1008 and b one from 0 to 1008.',
  /** @param {FixedHash} fn */
  leftTitle: (fn) => `Fixed: ${FIXED_NAMES[fn]}`,
  /** @param {number} a @param {number} b */
  rightTitle: (a, b) => `Universal: ((${a}·k + ${b}) mod 1009) mod 16`,
  /** @param {string} title @param {number[]} counts */
  histogramAria: (title, counts) =>
    `${title}. Keys per bucket, bucket 0 to 15: ${counts.join(', ')}.`,
  bucketAxis: 'Buckets 0 to 15, left to right',
  /** @param {number} pairs */
  pairsLine: (pairs) => `Colliding pairs: ${pairs}`,
  /** @param {number} n @param {number} e */
  expectedLine: (n, e) =>
    `A truly random hash expects C(${n}, 2)/16 = ${Number.isInteger(e) ? e : e.toFixed(1)} colliding pairs.`,
  stats: {
    leftMax: 'Fullest bucket, fixed',
    rightMax: 'Fullest bucket, universal',
    leftEmpty: 'Empty buckets, fixed',
    rightEmpty: 'Empty buckets, universal',
  },
  keysTitle: 'Keys in order',
  keysHot: 'key being hashed',
  legend: { active: 'Bucket that just got the key' },
  marks: { active: '+' },

  /** @param {HashFnFrame} f @param {FixedHash} fn @param {number} a @param {number} b */
  describe(f, fn, a, b) {
    const k = f.key;
    switch (f.kind) {
      case 'start':
        return `Two empty histograms of 16 buckets. Left: ${FIXED_NAMES[fn]}. Right: universal hashing with a = ${a}, b = ${b}.`;
      case 'hash': {
        const left =
          fn === 'mod' ? `${k} mod 16 = ${f.lb}` : `⌊16 · frac(${k} · 0.618…)⌋ = ${f.lb}`;
        return `Key ${k}: ${left}; ((${a}·${k} + ${b}) mod 1009) mod 16 = ${f.rb}.`;
      }
      case 'count':
        return `Left bucket ${f.lb} now holds ${count(f.left[f.lb], 'key', 'keys')}; right bucket ${f.rb} holds ${count(f.right[f.rb], 'key', 'keys')}.`;
      case 'done':
        return `${count(f.n, 'key', 'keys')} hashed. Colliding pairs: ${f.leftPairs} with the fixed hash, ${f.rightPairs} with the universal one.`;
    }
  },

  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Hash the keys 0, 16, 32, 48 and 64 with k mod 16. How many colliding pairs are there?',
      answer: 10,
      unit: 'pairs',
      hints: ['All five keys land in the same bucket.', 'Count the pairs among 5 keys: C(5, 2).'],
      solution:
        'Every key is a multiple of 16, so all five land in bucket 0, and every pair collides: C(5, 2) = 5 · 4 / 2 = 10. Load “Attack” with 5 keys to check.',
    },
    {
      type: 'number',
      prompt: 'With a = 3, b = 5, p = 1009 and m = 16, which bucket does key 100 go to?',
      answer: 1,
      hints: ['First compute 3 · 100 + 5 = 305, then take it mod 1009, then mod 16.'],
      solution:
        '305 mod 1009 = 305, and 305 = 19 · 16 + 1, so the key goes to bucket 1. Type a = 3 and b = 5 and step to a key to see the same arithmetic.',
    },
    {
      type: 'number',
      prompt:
        'Universal hashing puts 32 keys into 16 buckets. At most how many colliding pairs do you expect?',
      answer: 31,
      unit: 'pairs',
      hints: ['There are C(32, 2) pairs, and each collides with chance at most 1/16.'],
      solution:
        'C(32, 2) = 32 · 31 / 2 = 496 pairs, each colliding with chance at most 1/16, so the expectation is at most 496/16 = 31 pairs. With 32 keys in one bucket it would be all 496.',
    },
    {
      type: 'choice',
      prompt:
        'Why are a and b drawn at random when the table is created, rather than fixed in the code?',
      options: [
        'Random numbers make the arithmetic faster',
        'So that no key set chosen in advance is bad on average: an adversary cannot know which keys will collide',
        'So that the table never has any collisions',
      ],
      answer: 1,
      hints: ['Think about the attack keys: who chooses them, and when?'],
      solution:
        'Any fixed function has a bad key set. Drawing the function at random after the keys are fixed makes every pair collide with chance at most 1/m, so the expected cost is O(1 + α) for every input. Collisions still happen, just rarely.',
    },
  ],
};
