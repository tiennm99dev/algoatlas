/** @typedef {import('$lib/algo-engine/load-factor-rehashing.js').LoadFrame} LoadFrame */
/** @typedef {import('$lib/algo-engine/load-factor-rehashing.js').Growth} Growth */
/** @typedef {import('$lib/algo-engine/load-factor-rehashing.js').Threshold} Threshold */

/** A count with its noun, singular for 1. */
/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {number} x */
const fixed2 = (x) => x.toFixed(2);

/** @type {Record<Growth, string>} */
const GROWTH_TEXT = { double: 'doubling m', add: 'adding 4 buckets' };

export const en = {
  slug: 'load-factor-rehashing',
  topic: 'structures',
  level: 'Intermediate',
  title: 'Load factor and rehashing',
  intro:
    'The load factor α = n/m, keys per bucket, decides how long a chain or a probe run gets. A table keeps α small by growing: when α passes a threshold it allocates more buckets and rehashes every key into them. One resize is expensive, but if the table doubles, the total cost stays O(1) per insert.',
  summary:
    'Insert keys into a chained table, watch the load-factor gauge cross its threshold and trigger a rehash, and compare the amortized cost of doubling with adding a fixed number of buckets.',
  instruction:
    'Choose how many keys to insert, the resize threshold and the growth rule, then step through. Each time the gauge passes the threshold the table grows and every key moves one by one. The bar chart shows the steps each insert cost: watch the spikes and the average.',
  takeaways: [
    'The load factor α = n/m is the average chain length. A search costs O(1 + α) with chaining, so the table must keep α bounded.',
    'When α passes the threshold, the table allocates new buckets and rehashes every key: k mod m changes when m changes, so no key can stay where it was.',
    'One resize moves all n keys, but doubling makes resizes rare: the moves add up to n/2 + n/4 + … < 2n, so n inserts cost under 3n steps, O(1) amortized each.',
    'Adding a fixed 4 buckets resizes every few inserts, and each resize moves all the keys so far, so the moves grow like n²: O(n) per insert on average.',
    'A lower threshold means shorter chains but more memory. Set 32 inserts and switch between “Double” and “Add 4”, then try “Never” and read the longest chain.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Insert, no resize', 'O(1)', 'On average: hash once and append to a short chain.'],
    ['One resize', 'O(n)', 'Every key is rehashed into the new table.'],
    [
      'n inserts, doubling',
      'O(n)',
      'In total, so O(1) amortized per insert: the moves form a geometric series below 2n.',
    ],
    [
      'n inserts, adding 4',
      'O(n²)',
      'In total: a resize every few inserts, each moving all keys so far.',
    ],
    ['Memory', 'O(n + m)', 'With doubling, m stays within a constant factor of n.'],
  ],
  nextTeaser:
    'Next up: designing hash functions, where a weak hash piles keys into a few buckets and a randomly chosen one spreads them even against an adversary.',

  countLabel: 'Inserts',
  thresholdLabel: 'Resize threshold',
  thresholds: { 0.5: '0.5', 0.75: '0.75', 1: '1', never: 'Never' },
  growthLabel: 'Growth',
  growths: { double: 'Double', add: 'Add 4' },
  gaugeLabel: 'Load factor',
  /** @param {number} n @param {number} m @param {Threshold} t */
  gaugeText: (n, m, t) =>
    `α = ${n}/${m} = ${fixed2(n / m)}${t === null ? ', never resizes' : `, threshold ${t}`}`,
  gaugeOver: 'over the threshold',
  thresholdMark: 'threshold',
  bucketsLabel: 'Buckets',
  bucketPrefix: 'Bucket',
  emptyBucket: 'empty',
  /** @param {number} to */
  growingTo: (to) => `Rehashing into ${to} buckets`,
  pendingTitle: 'Waiting to move',
  pendingEmpty: 'none',
  costsLabel: 'Steps spent on each insert',
  /** @param {number[]} costs */
  costsAria: (costs) =>
    costs.length === 0 ? 'No inserts yet.' : `Steps per insert, in order: ${costs.join(', ')}.`,
  /** @param {number} work @param {number} n */
  average: (work, n) =>
    n === 0 ? 'Average: –' : `Average: ${work}/${n} = ${fixed2(work / n)} steps per insert`,
  stats: {
    n: 'Keys n',
    m: 'Buckets m',
    work: 'Total steps',
    perInsert: 'Steps per insert',
    grows: 'Resizes',
    longest: 'Longest chain',
  },
  none: '–',
  legend: {
    active: 'Just inserted',
    frontier: 'Just moved by the rehash',
    swap: 'An insert that paid for a resize',
  },
  marks: { active: '+', frontier: '→', swap: '!' },
  chipStates: { active: 'just inserted', frontier: 'just moved' },

  /** @param {LoadFrame} f @param {Threshold} t @param {Growth} g */
  describe(f, t, g) {
    switch (f.kind) {
      case 'start':
        return t === null
          ? 'An empty table with 4 buckets that never resizes.'
          : `An empty table with 4 buckets. It grows by ${GROWTH_TEXT[g]} when α passes ${t}.`;
      case 'insert':
        return `Insert ${f.key} into chain ${f.key} mod ${f.m} = ${f.bucket}. Now n = ${f.n}. One step.`;
      case 'check':
        if (t === null)
          return `α = ${f.n}/${f.m} = ${fixed2(f.load)}. This table never resizes, so its chains keep growing.`;
        return f.over
          ? `α = ${f.n}/${f.m} = ${fixed2(f.load)} > ${t}: time to grow.`
          : `α = ${f.n}/${f.m} = ${fixed2(f.load)} ≤ ${t}: no resize.`;
      case 'grow':
        return `Allocate ${f.nextM} buckets by ${GROWTH_TEXT[g]}. All ${f.n} keys must move, because k mod ${f.nextM} is not k mod ${f.m}.`;
      case 'move':
        return `Move ${f.moved} to chain ${f.moved} mod ${f.m} = ${f.movedTo}. ${count(f.pending.length, 'key', 'keys')} still waiting.`;
      case 'rehashed': {
        const cost = f.costs[f.costs.length - 1];
        return `Rehashed: α drops to ${f.n}/${f.m} = ${fixed2(f.load)}. This insert cost 1 + ${cost - 1} = ${cost} steps.`;
      }
      case 'done':
        return f.n === 0
          ? 'No keys inserted.'
          : `${count(f.n, 'insert', 'inserts')} cost ${f.work} steps with ${count(f.grows, 'resize', 'resizes')}: ${fixed2(f.work / f.n)} steps per insert on average.`;
    }
  },

  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'A chained table holds 12 keys in 16 buckets. What is its load factor α?',
      answer: 0.75,
      tolerance: 0.001,
      hints: ['α = n / m.'],
      solution: 'α = n/m = 12/16 = 0.75: on average three quarters of a key per bucket.',
    },
    {
      type: 'number',
      prompt:
        'Start with 4 buckets, double when α > 0.75, and insert 24 keys. How many keys are moved by resizes in total?',
      answer: 24,
      unit: 'keys',
      hints: [
        'The table grows at n = 4 (4/4 > 0.75), n = 7 (7/8) and n = 13 (13/16).',
        'Each resize moves every key stored at that moment.',
      ],
      solution:
        'Resizes happen at n = 4, 7 and 13 and move 4 + 7 + 13 = 24 keys. With the 24 inserts that is 48 steps, exactly 2 per insert. Set 24 inserts, 0.75 and “Double” to check.',
    },
    {
      type: 'number',
      prompt:
        'Start with 4 buckets, add 4 buckets when α > 1, and insert 20 keys. How many steps do the inserts cost in total, counting 1 per insert and 1 per key moved?',
      answer: 64,
      unit: 'steps',
      hints: ['Resizes happen at n = 5, 9, 13 and 17.', 'Add the 20 inserts to the keys moved.'],
      solution:
        'The resizes move 5 + 9 + 13 + 17 = 44 keys, so the total is 20 + 44 = 64 steps, 3.2 per insert, and the average keeps rising with n. Set 20 inserts, threshold 1 and “Add 4” to check.',
    },
    {
      type: 'choice',
      prompt: 'Why is a doubling resize O(1) amortized per insert, although one resize is O(n)?',
      options: [
        'Each resize moves only the keys that collide',
        'After a resize that moved n keys, about n cheap inserts must happen before the next resize, and they pay for its moves',
        'Rehashing does not depend on the number of keys',
      ],
      answer: 1,
      hints: ['How many inserts separate two resizes when m doubles?'],
      solution:
        'A resize moves every key, but doubling leaves room for many cheap inserts before the next resize. The moves form the series n + n/2 + n/4 + … < 2n, so n inserts cost under 3n steps.',
    },
  ],
};
