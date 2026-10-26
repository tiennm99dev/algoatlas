/** @typedef {import('$lib/algo-engine/collision-resolution.js').CollisionFrame} CollisionFrame */
/** @typedef {import('$lib/algo-engine/collision-resolution.js').ProbeMethod} ProbeMethod */

/** A count with its noun, singular for 1. */
/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @type {Record<ProbeMethod, string>} */
const METHOD_NAMES = {
  linear: 'linear probing',
  quadratic: 'quadratic probing',
  double: 'double hashing',
};

export const en = {
  slug: 'collision-resolution',
  topic: 'structures',
  level: 'Beginner',
  title: 'Collision resolution: chaining vs open addressing',
  intro:
    'Two keys often hash to the same bucket. Separate chaining keeps a list in every bucket; open addressing stores every key in the table itself and, on a collision, probes other slots in a fixed order. Fill both kinds of table with the same keys and compare where the keys end up and what each lookup costs.',
  summary:
    'Insert the same keys into a chained table and an open-addressing table side by side, and compare linear probing, quadratic probing and double hashing.',
  instruction:
    'Pick a probing method and a key set, then step through. Each key goes into the chaining table first (left column), then into the probing table (right column). Watch the probe sequence when the home slot is taken, then search for a key and compare the cost of a miss in both tables.',
  takeaways: [
    'Separate chaining never runs out of room: colliding keys share a list, and a lookup walks only that list.',
    'Open addressing keeps every key in the table. On a collision it tries the slots h(k) + f(i) for i = 1, 2, …, and a search stops at the key or at the first empty slot.',
    'Linear probing (f(i) = i) builds long runs of taken slots, called primary clusters; any key that lands in a run makes it longer.',
    'Quadratic probing (f(i) = i²) jumps out of runs, but keys with the same home still share one probe path, and it can miss empty slots: with 11 slots it reaches only 6 of them.',
    'Double hashing (f(i) = i · h₂(k)) gives each key its own step, so keys with the same home go different ways. Load “Same home” and switch between the three methods to see it.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'Search, chaining',
      'O(1 + α)',
      'On average: hash once and walk one chain, whose average length is the load factor α = n/m.',
    ],
    [
      'Miss, open addressing',
      '1/(1 − α)',
      'Expected probes with uniform hashing: each probe finds an empty slot with chance at least 1 − α.',
    ],
    ['Worst case, any method', 'O(n)', 'Every key can share one chain or one probe path.'],
    [
      'Memory',
      'O(m + n)',
      'Chaining adds a list node per key; open addressing uses only the m slots, so it needs n ≤ m.',
    ],
  ],
  nextTeaser:
    'Next up: load factor and rehashing, which keeps α small by growing the table, at an amortized O(1) cost per insert.',

  methodLabel: 'Probing',
  methods: {
    linear: 'Linear',
    quadratic: 'Quadratic',
    double: 'Double hashing',
  },
  methodNames: METHOD_NAMES,
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    mixed: 'Mixed',
    cluster: 'Clustered homes',
    'same-home': 'Same home',
    random: 'Random',
  },
  newKeys: 'New keys',
  keysLabel: 'Keys (comma-separated)',
  searchLabel: 'Search for',
  searchButton: 'Search',
  searchDropped: 'The search was cleared because the keys or the method changed.',
  keyErrors: {
    format: 'Keys must be whole numbers from 0 to 99, separated by commas.',
    range: 'Keys must be whole numbers from 0 to 99.',
    count: 'Use at most 10 keys, so the 11-slot table always has room.',
    duplicate: 'Each key may appear only once.',
  },
  tableLabel: 'Both tables, slot by slot',
  head: {
    slot: 'Slot',
    chaining: 'Chaining',
  },
  /** @param {ProbeMethod} method */
  probingHead: (method) => `Open addressing (${METHOD_NAMES[method]})`,
  homeMark: 'h',
  homeLabel: 'home of the current key',
  empty: 'empty',
  formulas: {
    linear: 's = (h(k) + i) mod 11',
    quadratic: 's = (h(k) + i²) mod 11',
    double: 's = (h(k) + i · h₂(k)) mod 11, h₂(k) = 7 − (k mod 7)',
  },
  sequenceTitle: 'Probe sequence of the current key',
  sequenceEmpty: 'no probes yet',
  sequenceHot: 'latest probe',
  /** @param {number} slot @param {number} i */
  sequenceChip: (slot, i) => `i=${i}: ${slot}`,
  stats: {
    chainCompares: 'Chain comparisons',
    probes: 'Slots probed',
    longest: 'Longest chain',
    emptySlots: 'Empty slots',
    failed: 'Keys probing could not place',
  },
  legend: {
    compare: 'Compared, or probed and taken (collision)',
    active: 'Just added',
    sorted: 'Found',
    frontier: 'Empty slot that ends a search',
  },
  marks: { compare: '?', collision: '×', active: '+', sorted: '✓', frontier: '○' },
  chipStates: {
    compare: 'being compared',
    collision: 'probed, taken: a collision',
    active: 'just added',
    sorted: 'found',
    frontier: 'empty slot that ends the search',
  },

  /** @param {CollisionFrame} f @param {ProbeMethod} method */
  describe(f, method) {
    const { key: k, home, slot, attempt: i } = f;
    const chain = home >= 0 ? f.chains[home] : [];
    const name = METHOD_NAMES[method];
    switch (f.kind) {
      case 'start':
        return `Two empty tables of 11 slots. The left column uses chaining, the right column ${name}.`;
      case 'hash': {
        const head = f.search ? `Search for ${k}` : `Insert ${k}`;
        const step =
          method === 'double' ? ` Its step is h₂(${k}) = 7 − (${k} mod 7) = ${f.step}.` : '';
        return `${head}: h(${k}) = ${k} mod 11 = ${home}.${step}`;
      }
      case 'chain-compare':
        return `Chaining: compare ${k} with ${chain[f.pos]}, key ${f.pos + 1} of chain ${home}.`;
      case 'chain-add':
        return chain.length === 1
          ? `Chaining: chain ${home} was empty, so ${k} starts it.`
          : `Chaining: a collision. Append ${k} to chain ${home}, which now holds ${chain.length} keys.`;
      case 'probe':
        return f.search
          ? `Probe i = ${i}: slot ${slot} holds ${f.slots[slot]}, not ${k}. Keep probing.`
          : `Probe i = ${i}: slot ${slot} holds ${f.slots[slot]}. A collision, so try i = ${i + 1}.`;
      case 'place':
        return i === 0
          ? `Probe i = 0: slot ${slot} is empty, so ${k} goes into its home slot.`
          : `Probe i = ${i}: slot ${slot} is empty. ${k} goes there after ${count(i, 'collision', 'collisions')}.`;
      case 'fail': {
        const free = f.slots.filter((s) => s === null).length;
        return `All 11 probes hit taken slots, so ${k} cannot be placed, although ${count(free, 'slot is', 'slots are')} still empty.`;
      }
      case 'chain-hit':
        return `Chaining: found ${k} in chain ${home} after ${count(f.pos + 1, 'comparison', 'comparisons')}.`;
      case 'chain-miss':
        return `Chaining: ${k} is not in chain ${home}. The miss cost ${count(chain.length, 'comparison', 'comparisons')}, the whole chain.`;
      case 'probe-hit':
        return `Probing: found ${k} in slot ${slot} after ${count(i + 1, 'probe', 'probes')}.`;
      case 'probe-miss':
        return slot >= 0
          ? `Probing: slot ${slot} is empty, so ${k} is not in the table. The miss cost ${count(i + 1, 'probe', 'probes')}.`
          : `Probing: all 11 probes hit other keys and never an empty slot, so ${k} is not in the table.`;
      case 'done':
        return `Done. Chaining made ${count(f.chainCompares, 'comparison', 'comparisons')}; ${name} inspected ${count(f.probes, 'slot', 'slots')}${f.failed ? ` and could not place ${count(f.failed, 'key', 'keys')}` : ''}.`;
    }
  },

  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Linear probing, 11 slots, h(k) = k mod 11. Insert 12, 13, 14, then 1 into an empty table. Which slot does 1 end in?',
      answer: 4,
      hints: [
        '12, 13 and 14 sit in their homes: slots 1, 2 and 3.',
        'The home of 1 is slot 1; step one slot at a time.',
      ],
      solution:
        'h(1) = 1 is taken by 12, slot 2 by 13, slot 3 by 14, and slot 4 is empty: 1 lands in slot 4 after 3 collisions. Load “Clustered homes” with linear probing to watch it.',
    },
    {
      type: 'number',
      prompt:
        'Double hashing with h₂(k) = 7 − (k mod 7). Slots 8 and 2 are taken. Which slot does 30 end in?',
      answer: 7,
      hints: [
        'h(30) = 30 mod 11 = 8 and h₂(30) = 7 − 2 = 5.',
        'The probes are 8, 8 + 5, 8 + 10, … mod 11.',
      ],
      solution:
        'Probe 0 is slot 8 (taken), probe 1 is (8 + 5) mod 11 = 2 (taken), probe 2 is (8 + 10) mod 11 = 7, which is empty. Load “Mixed” with double hashing to check.',
    },
    {
      type: 'number',
      prompt:
        'Load “Same home” with linear probing: 0, 11, 22, 33, 44, 55 and 66 fill slots 0 to 6. How many slots does a search for 77 probe before it stops?',
      answer: 8,
      unit: 'slots',
      hints: [
        '77 mod 11 = 0, so the search starts at slot 0.',
        'A miss stops at the first empty slot.',
      ],
      solution:
        'Slots 0 to 6 hold other keys and slot 7 is empty, so the search probes 8 slots and reports a miss. Chaining would compare 77 with all 7 keys of chain 0.',
    },
    {
      type: 'choice',
      prompt: 'Which method can fail to place a key while the 11-slot table still has empty slots?',
      options: ['Linear probing', 'Quadratic probing', 'Double hashing with a prime table size'],
      answer: 1,
      hints: ['List i² mod 11 for i = 0, 1, …, 10.'],
      solution:
        'i² mod 11 takes only the values 0, 1, 4, 9, 5 and 3, so quadratic probing visits 6 of the 11 slots. Linear probing visits all of them, and double hashing does too because the step is never 0 and 11 is prime.',
    },
  ],
};
