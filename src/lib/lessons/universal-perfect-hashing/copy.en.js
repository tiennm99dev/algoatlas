/** @typedef {import('$lib/algo-engine/universal-perfect-hashing.js').PerfectFrame} PerfectFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Two decimal places, without trailing zeros. @param {number} x */
const twoDp = (x) => String(Math.round(x * 100) / 100);

/** The working of one hash value. @param {number} k @param {number} a @param {number} b @param {number} m @param {number} p */
const working = (k, a, b, m, p) =>
  `((${a}·${k} + ${b}) mod ${p}) mod ${m} = ${(a * k + b) % p} mod ${m} = ${((a * k + b) % p) % m}`;

export const en = {
  slug: 'universal-perfect-hashing',
  topic: 'algebraic-randomised',
  level: 'Nâng cao',
  title: 'Băm phổ quát và băm hoàn hảo',
  intro:
    'Any one fixed hash function has a bad set of keys that all land in the same slot, and an adversary who knows the function can send exactly that set. Universal hashing draws the function at random from a family where two keys collide with probability at most 1/m, so every key set is good on average. Two levels of it build a perfect hash table for a fixed key set: no collisions at all, lookups in O(1) time in the worst case, and only O(n) memory.',
  summary:
    'Draw hash functions from the universal family ((a·k + b) mod p) mod m, average their collisions over many draws, and build a two-level perfect hash table step by step.',
  instruction:
    'Type up to 12 keys or pick an example, then step through the build: the first level spreads the keys over n buckets, and each bucket gets a collision-free table of nⱼ² slots. Press “Draw 100 functions” to average collisions over random draws and compare them with the fixed hash k mod n; “Attack” is a key set built to beat it.',
  fields: { keys: 'Keys', lookup: 'Look up a key' },
  presetLabel: 'Example',
  presets: {
    textbook: 'Textbook (9)',
    attack: 'Attack on k mod n (10)',
    small: 'Small (4)',
  },
  /** @param {number} minN @param {number} maxN @param {number} max */
  keysError: (minN, maxN, max) =>
    `Type ${minN} to ${maxN} different whole numbers from 0 to ${max}, separated by commas or spaces.`,
  /** @param {number} max */
  lookupError: (max) => `Look up a whole number from 0 to ${max}.`,
  lookupButton: 'Look up',
  lookupWait: 'Step to the end of the build first: lookups use the finished table.',
  /** @param {number} k @param {number} j @param {number} slot @param {boolean} found */
  lookupResult: (k, j, slot, found) =>
    slot < 0
      ? `${k} hashes to bucket ${j}, which is empty: ${k} is not stored. One hash was enough.`
      : `${k} hashes to bucket ${j}, then to its slot ${slot}: ${found ? `found ${k}` : `${k} is not there, so it is not stored`}. Two hashes and one comparison, whatever the keys.`,
  reroll: 'New random build',
  family: 'Family: h(k) = ((a·k + b) mod p) mod m, with p = 101',
  /** @param {number} a @param {number} b @param {number} n */
  firstLevel: (a, b, n) => `; first level a = ${a}, b = ${b}, m = ${n}`,
  tableTitle: 'The two-level table',
  /** @param {number} n */
  tableAria: (n) => `${n} buckets of the first level, each with its second-level slots`,
  /** @param {number} j @param {number} count */
  bucketLabel: (j, count) => `Bucket ${j}, ${plural(count, 'key', 'keys')}`,
  /** @param {number} m @param {number} a @param {number} b */
  secondParams: (m, a, b) => `m = ${m}, a = ${a}, b = ${b}`,
  emptyBucket: 'empty',
  emptySlot: '·',
  /** @param {number} s @param {number | null} key @param {string} state */
  slotLabel: (s, key, state) =>
    `Slot ${s}: ${key === null ? 'empty' : key}${state ? `, ${state}` : ''}`,
  roleNames: {
    placed: 'just placed',
    clash: 'collision',
    done: 'bucket finished',
    '': '',
  },
  roleMarkers: { placed: '→', clash: '✗', done: '✓', '': '' },
  legend: {
    placed: '→ Just placed',
    clash: '✗ Collision: draw again',
    done: '✓ Bucket finished, no collisions',
  },
  stats: {
    firstDraws: 'First-level draws',
    sumSquares: 'Σ nⱼ² (must be < 4n)',
    secondDraws: 'Second-level draws',
    slots: 'Slots in all, n + Σ mⱼ',
  },
  /** @param {number} sum @param {number} n */
  sumText: (sum, n) => `${sum} / ${4 * n}`,
  sampleTitle: 'Collisions over many random draws (m = n)',
  /** @param {number} k */
  sampleMany: (k) => `Draw ${k} functions`,
  clear: 'Clear draws',
  /** @param {number} max */
  samplesFull: (max) =>
    `The sample holds at most ${max.toLocaleString('en-US')} draws. Clear it to start again.`,
  sampleEmpty: 'Press “Draw 100 functions” to start sampling.',
  /** @param {number} draws */
  histAria: (draws) => `Histogram of colliding pairs over ${draws} draws`,
  /** @param {number} pairs @param {number} count */
  binLabel: (pairs, count) =>
    `${plural(pairs, 'colliding pair', 'colliding pairs')}: ${plural(count, 'draw', 'draws')}`,
  histMarks: '▲ mean of the draws   ◆ universal bound   ✗ fixed k mod n',
  sampleStats: {
    draws: 'Draws',
    mean: 'Mean colliding pairs',
    exact: 'Exact mean, all 10,100 functions',
    bound: 'Bound n(n − 1)/(2m)',
    fixed: 'Fixed k mod n',
    good: 'Draws with Σ nⱼ² < 4n',
  },
  twoDp,
  /** @param {number} good @param {number} draws */
  goodText: (good, draws) => `${good} of ${draws}`,
  /** @param {PerfectFrame} f @param {number} p */
  describe(f, p) {
    const n = f.keys.length;
    switch (f.kind) {
      case 'start':
        return `Build a perfect hash table for ${plural(n, 'key', 'keys')}: first spread them over ${n} buckets, then give each bucket its own collision-free table.`;
      case 'draw':
        return f.fallback
          ? `No good draw in many tries, so take the first good function in order: a = ${f.a}, b = ${f.b}.`
          : `Draw a first-level function at random: a = ${f.a}, b = ${f.b}. Its buckets start empty.`;
      case 'place':
        return `h(${f.key}) = ${working(f.key, f.a, f.b, n, p)}: put ${f.key} in bucket ${f.j}. Σ nⱼ² is now ${f.sumSquares}.`;
      case 'check':
        return f.accepted
          ? `Σ nⱼ² = ${f.sumSquares} < 4n = ${4 * n}: keep this function. The second level will use ${f.sumSquares} slots.`
          : `Σ nⱼ² = ${f.sumSquares} ≥ 4n = ${4 * n}: too many keys share buckets, so draw again. This happens with probability under 1/2.`;
      case 'second': {
        const t = f.tables[f.j];
        const size = f.buckets[f.j].length;
        return f.fallback
          ? `Bucket ${f.j}: no good draw in many tries, so take the first collision-free function in order: a = ${t.a}, b = ${t.b}.`
          : `Bucket ${f.j} holds ${plural(size, 'key', 'keys')}, so it gets ${size}² = ${t.m} ${t.m === 1 ? 'slot' : 'slots'}. Draw a = ${t.a}, b = ${t.b} (draw ${t.draws} for this bucket).`;
      }
      case 'slot': {
        const t = f.tables[f.j];
        return `h${f.j}(${f.key}) = ${working(f.key, t.a, t.b, t.m, p)}: slot ${f.slot} is free, so ${f.key} goes there.`;
      }
      case 'collide': {
        const t = f.tables[f.j];
        return `h${f.j}(${f.key}) = ${working(f.key, t.a, t.b, t.m, p)}, but slot ${f.slot} already holds ${f.clash}: a collision. Throw this function away and draw again.`;
      }
      case 'fits':
        return `Every key of bucket ${f.j} has its own slot, so bucket ${f.j} is finished.`;
      case 'done':
        return `Built with ${plural(f.firstDraws, 'first-level draw', 'first-level draws')} and ${plural(f.secondDraws, 'second-level draw', 'second-level draws')}, using ${n} + ${f.slots} = ${n + f.slots} slots. No two keys share a slot: look one up below.`;
    }
  },
  takeaways: [
    'A family of hash functions is universal when any two distinct keys collide under at most a 1/m share of its functions. ((a·k + b) mod p) mod m, with p prime, a ≠ 0 and keys below p, is one.',
    'Drawing the function at random takes the power away from the input: for any fixed set of n keys, the expected number of colliding pairs is at most n(n − 1)/(2m), so chains average O(1 + n/m) keys.',
    'With m = n², the expected number of colliding pairs is below 1/2, so a random function is collision-free with probability over 1/2. That is too much memory for all the keys at once, but fine for each small bucket.',
    'Two-level perfect hashing hashes the n keys into n buckets, redraws until Σ nⱼ² < 4n, and gives bucket j a collision-free table of nⱼ² slots. Every lookup is two hashes and one comparison, and memory is under 5n slots.',
    'Try “Attack on k mod n”: the fixed hash puts all 10 keys in one bucket (45 pairs), while 100 random draws average about 4 pairs, under the bound of 4.5.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'Lookup, perfect table',
      'O(1) worst case',
      'One first-level hash, one second-level hash, one comparison.',
    ],
    [
      'Lookup, universal hash with chaining',
      'O(1 + n/m) expected',
      'The expected colliding keys in a chain are at most (n − 1)/m for any key set.',
    ],
    [
      'Build, perfect table',
      'O(n) expected',
      'Each level’s draw succeeds with probability over 1/2, so fewer than 2 draws are expected, each costing O(size).',
    ],
    ['Memory, perfect table', 'O(n)', 'n buckets plus Σ nⱼ² < 4n second-level slots.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'With a = 3, b = 42, p = 101 and m = 9, what is h(75) = ((a·k + b) mod p) mod m?',
      answer: 2,
      hints: ['3 · 75 + 42 = 267. Reduce mod 101 first, then mod 9.'],
      solution: '267 mod 101 = 65, and 65 mod 9 = 2, so 75 goes to bucket 2.',
    },
    {
      type: 'number',
      prompt:
        'Load “Attack on k mod n”. How many colliding pairs does the fixed hash k mod n make on it?',
      answer: 45,
      unit: 'pairs',
      hints: [
        'Every key is a multiple of 10 and n = 10. How many pairs do 10 keys in one slot form?',
      ],
      solution: 'All 10 keys land in slot 0, so every pair collides: 10 · 9 / 2 = 45.',
    },
    {
      type: 'number',
      prompt:
        'For those 10 keys in m = 10 slots, what bound does universality give on the expected number of colliding pairs?',
      answer: 4.5,
      unit: 'pairs',
      hints: ['There are 10 · 9 / 2 = 45 pairs, and each collides with probability at most 1/m.'],
      solution: '45 pairs · 1/10 = 4.5. The exact average over all 10,100 functions is about 4.1.',
    },
    {
      type: 'number',
      prompt:
        'A first-level bucket receives 3 keys. How many slots does its second-level table get?',
      answer: 9,
      unit: 'slots',
      hints: ['The second level uses nⱼ² slots.'],
      solution: '3² = 9 slots, so the expected colliding pairs are at most 3/9 = 1/3 < 1/2.',
    },
    {
      type: 'multi',
      prompt: 'Which statements about the two-level perfect hash table are true?',
      options: [
        'A lookup costs O(1) in the worst case',
        'It uses O(n) memory',
        'Inserting a new key is always O(1)',
        'Each second-level draw is collision-free with probability over 1/2',
      ],
      answers: [0, 1, 3],
      hints: ['The table is built for a fixed set of keys. What could a new key do to its bucket?'],
      solution:
        'Lookups are two hashes and one comparison, and memory is n + Σ nⱼ² < 5n. A new key may collide in its bucket and force that bucket, or even the whole table, to be rebuilt, so perfect hashing suits static key sets.',
    },
  ],
  nextTeaser: 'Bài tiếp theo: Lí thuyết trò chơi: Nim và Sprague-Grundy.',
};
