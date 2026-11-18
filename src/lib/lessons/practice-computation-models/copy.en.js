/** @typedef {import('$lib/algo-engine/practice-computation-models.js').MatchFrame} MatchFrame */
/** @typedef {import('$lib/algo-engine/practice-computation-models.js').Model} Model */

/** Whole numbers with thousands separators, ratios with two decimals, ∞ for no bound. @param {number} v */
const num = (v) =>
  !Number.isFinite(v)
    ? '∞'
    : Number.isInteger(v)
      ? v.toLocaleString('en-US')
      : String(Math.round(v * 100) / 100);

/** @type {Record<Model, string>} */
const MODEL_NAMES = {
  parallel: 'Parallel (work and span)',
  distributed: 'Distributed (rounds)',
  external: 'External memory',
  online: 'Online (competitive)',
};

/** @type {Record<Model, string>} */
const UNITS = {
  parallel: 'steps',
  distributed: 'messages',
  external: 'block transfers',
  online: '× OPT',
};

/** @param {Model} model @param {number} v */
const costText = (model, v) =>
  model === 'online'
    ? Number.isFinite(v)
      ? `${num(v)} × OPT`
      : 'unbounded'
    : `${num(v)} ${UNITS[model]}`;

/**
 * @type {Record<string, {title: string, job: string, why: string, params: Record<string, string>,
 *   candidates: Record<string, {name: string, why: string}>}>}
 */
const CARDS = {
  sum: {
    title: 'Sum a big array',
    job: 'Add up n numbers on one machine whose P cores share memory.',
    why: 'Many processors share one memory and the job finishes when the last strand does: count time steps with work and span.',
    params: { logN: 'Numbers n', p: 'Cores P' },
    candidates: {
      loop: { name: 'Plain loop', why: 'n − 1 additions one after another; extra cores sit idle.' },
      forkJoin: {
        name: 'Fork-join sum, one add per strand',
        why: 'Work n − 1, span log₂ n, so a greedy schedule takes about (n − 1)/P + log₂ n steps.',
      },
      chunks: {
        name: 'One chunk per core, then combine',
        why: 'Each core adds n/P numbers (n/P − 1 steps), then log₂ P rounds combine the partial sums.',
      },
    },
  },
  sort: {
    title: 'Sort on many cores',
    job: 'Sort n keys on one machine whose P cores share memory.',
    why: 'The cores share memory and work in parallel: count time steps with work and span.',
    params: { logN: 'Keys n', p: 'Cores P' },
    candidates: {
      serial: { name: 'Merge sort on one core', why: 'n log₂ n steps, whatever P is.' },
      serialMerge: {
        name: 'Parallel merge sort, serial merge',
        why: 'Work n log₂ n but span about 2n, because each merge is one long strand: n log₂ n / P + 2n.',
      },
      parallelMerge: {
        name: 'Parallel merge sort, parallel merge',
        why: 'The same work with span about log₂³ n: n log₂ n / P + log₂³ n.',
      },
    },
  },
  election: {
    title: 'Elect a coordinator',
    job: 'n servers wired in a ring, each with a unique ID and no shared memory, must agree on one coordinator.',
    why: 'Separate machines see only their neighbours’ messages and move in rounds: count messages.',
    params: { n: 'Servers n' },
    candidates: {
      floodMax: {
        name: 'FloodMax: forward the largest ID for D rounds',
        why: 'D = ⌊n/2⌋ rounds on a ring, two messages per link per round: 2n · ⌊n/2⌋.',
      },
      allIds: {
        name: 'Flood every ID to everyone, then pick the largest',
        why: 'Each of the n IDs crosses each of the n links both ways: 2n².',
      },
    },
  },
  transpose: {
    title: 'Transpose a huge matrix',
    job: 'Transpose an N × N matrix that does not fit in the cache. Memory moves in blocks of B words and the cache holds M words.',
    why: 'Moving blocks between memory and the cache dominates the time: count block transfers.',
    params: { logN: 'Matrix side N', logB: 'Block B (words)', logM: 'Cache M (words)' },
    candidates: {
      rows: {
        name: 'Row-by-row loop',
        why: '2N²/B when the cache keeps a block for every row it writes (M ≥ N · B); otherwise about one transfer per element, N² + N²/B.',
      },
      recursive: {
        name: 'Recursive, cache-oblivious transpose',
        why: '2N²/B under the tall-cache assumption M ≥ B²; otherwise about N² + N²/B as well.',
      },
    },
  },
  servers: {
    title: 'Rent or buy a server',
    job: 'A project needs a server for a number of days that nobody knows in advance. Renting costs 1 a day; buying costs b.',
    why: 'Each day’s choice comes before the project’s length is known: compare with the offline optimum by the competitive ratio.',
    params: { b: 'Price b (days of rent)' },
    candidates: {
      buyNow: { name: 'Buy on day 1', why: 'A one-day project costs b against 1: ratio b.' },
      breakEven: {
        name: 'Rent until day b − 1, buy on day b',
        why: 'The worst project ends right after the purchase: (2b − 1)/b = 2 − 1/b.',
      },
      alwaysRent: { name: 'Always rent', why: 'A project of d days costs d against b: no bound.' },
    },
  },
  webCache: {
    title: 'Cache web pages',
    job: 'A web server keeps k pages in fast memory and must serve each request the moment it arrives.',
    why: 'Each eviction is chosen before later requests are known: judge it by the competitive ratio.',
    params: { k: 'Pages k' },
    candidates: {
      lru: {
        name: 'Evict the least recently used page',
        why: 'k-competitive: at most k faults per phase of k distinct pages, where OPT faults at least once.',
      },
      mru: {
        name: 'Evict the most recently used page',
        why: 'Once the cache is full, alternating between its last page and a new one makes it fault on every request, while OPT evicts another page once and then only hits: no bound.',
      },
    },
  },
};

export const en = {
  slug: 'practice-computation-models',
  topic: 'computation-models',
  level: 'Nâng cao',
  title: 'Luyện tập: chọn mô hình tính toán',
  intro:
    'The right algorithm depends on what the job pays for. On many cores it is time steps, set by work and span; across machines it is rounds and messages; with big data it is block transfers; and with unknown input it is the ratio to the offline optimum. Match each scenario card to its model and its best algorithm.',
  summary:
    'Match scenario cards to the right model of computation and algorithm, and change each card’s numbers to see when another algorithm becomes cheapest.',
  instruction:
    'Pick a card, choose the model and the algorithm you think fit, and press Check my match. Then step through: the model is checked, every algorithm is costed in that model at the card’s numbers, and the cheapest one wins. Move the sliders and check again.',
  cardLabel: 'Card',
  cardTitles: Object.fromEntries(Object.entries(CARDS).map(([id, c]) => [id, c.title])),
  /** @param {string} id */
  card: (id) => CARDS[id],
  modelLabel: 'Model',
  modelNames: MODEL_NAMES,
  algorithmLabel: 'Algorithm',
  check: 'Check my match',
  /** @param {{key: string, pow2?: boolean}} spec @param {number} v */
  paramValue: (spec, v) => (spec.pow2 ? `2^${v} = ${(2 ** v).toLocaleString('en-US')}` : String(v)),
  costsTitle: 'Costs in the card’s model',
  costPending: 'not costed yet',
  costText,
  bestMark: '✓ cheapest',
  pickMark: '◀ your pick',
  /** @param {number} done @param {number} total */
  score: (done, total) => `Matched ${done} of ${total} cards`,
  scoreTitle: 'Your matches',
  scoreMarks: { right: '✓', wrong: '✗', open: '·' },
  /** @param {string} title @param {'right'|'wrong'|'open'} state */
  scoreLabel: (title, state) =>
    `${title}: ${state === 'right' ? 'matched' : state === 'wrong' ? 'not yet right' : 'not checked'}`,
  /**
   * @param {MatchFrame} f @param {string} id
   * @param {{model: Model, algorithm: string}} pick
   */
  describe(f, id, pick) {
    const c = CARDS[id];
    switch (f.kind) {
      case 'start':
        return `${c.title}: ${c.job} Your match: ${MODEL_NAMES[pick.model]}, “${c.candidates[pick.algorithm].name}”.`;
      case 'model':
        return f.modelOk
          ? `Right model: ${MODEL_NAMES[f.model]}. ${c.why}`
          : `Not ${MODEL_NAMES[pick.model]}: this is ${MODEL_NAMES[f.model]}. ${c.why}`;
      case 'cost': {
        const cost = /** @type {{cost: number}} */ (f.costs.at(-1)).cost;
        return `${c.candidates[f.candidate].name}: ${costText(f.model, cost)}. ${c.candidates[f.candidate].why}`;
      }
      case 'verdict':
      case 'done': {
        const names = f.best.map((b) => `“${c.candidates[b].name}”`).join(' and ');
        const tie = f.best.length > 1 ? ' (a tie)' : '';
        const mine = f.algorithmOk
          ? f.modelOk
            ? 'Your match is right.'
            : 'Your algorithm is right, but recheck the model.'
          : 'Your algorithm is not the cheapest here.';
        return `Cheapest: ${names}${tie}. ${mine}`;
      }
    }
  },
  takeaways: [
    'First ask what the job pays for: time on shared-memory cores (work and span), rounds and messages between machines, block transfers to slow memory, or the cost of deciding without the future.',
    'On P cores, an algorithm with work T₁ and span T∞ runs in about T₁/P + T∞: lower the span until it no longer dominates, then keep the work small.',
    'For data much bigger than the cache, count blocks, not instructions: scanning costs n/B, and recursive, cache-oblivious layouts keep every transfer useful.',
    'When input arrives piece by piece, compare against the offline optimum: break-even for rent-or-buy, LRU for caching.',
    'Try it: on Sort on many cores, move P from 1 to 64 and watch the cheapest algorithm change; on Transpose a huge matrix, shrink the cache below B².',
  ],
  complexityHead: ['Model', 'Cost measure', 'Typical bound'],
  complexity: [
    ['Parallel (work and span)', 'Time steps on P cores', 'T_P ≈ T₁/P + T∞ (greedy scheduling)'],
    ['Distributed (synchronous)', 'Rounds and messages', 'FloodMax: D rounds, O(|E| · D) messages'],
    ['External memory', 'Block transfers', 'Scan n/B; transpose and sort with recursive splitting'],
    ['Online', 'Competitive ratio', 'Ski rental 2 − 1/b; LRU paging k'],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Card “Sum a big array” at its starting numbers (n = 2^20, P = 8). How many steps does the cheapest algorithm take?',
      answer: 131074,
      unit: 'steps',
      hints: ['Check any match and step to the verdict; the cheapest row is marked ✓.'],
      solution:
        'One chunk per core: 2^20/8 − 1 = 131,071 additions per core, then log₂ 8 = 3 rounds to combine, 131,074 steps. The fork-join sum needs 131,092 and the plain loop 1,048,575.',
    },
    {
      type: 'choice',
      prompt: 'Card “Sort on many cores” with P = 1 core. Which algorithm is cheapest?',
      options: [
        'Merge sort on one core',
        'Parallel merge sort, serial merge',
        'Parallel merge sort, parallel merge',
      ],
      answer: 0,
      hints: ['Set the Cores slider to 1 and read the three costs.'],
      solution:
        'With one core the parallel versions do the same work and add their span on top: 20,971,520 steps for plain merge sort against 23,068,672 and 20,979,520.',
    },
    {
      type: 'number',
      prompt:
        'Same card with n = 2^20 and P = 16. How many steps does the cheapest algorithm take?',
      answer: 1318720,
      unit: 'steps',
      hints: ['Parallel merging keeps the span small.'],
      solution:
        'Parallel merge sort with a parallel merge: 20 · 2^20 / 16 = 1,310,720 plus a span of 20³ = 8,000, so 1,318,720 steps. The serial merge pays a span of 2n = 2,097,152 instead.',
    },
    {
      type: 'number',
      prompt:
        'Card “Transpose a huge matrix” at its starting numbers (N = 2^12, B = 2^6, M = 2^14). How many times more block transfers does the row-by-row loop take than the recursive transpose?',
      answer: 32.5,
      tolerance: 0.01,
      hints: ['Read both costs and divide.'],
      solution:
        'The cache (2^14 words) is smaller than N · B = 2^18, so the loop pays N² + N²/B = 17,039,360. It is at least B² = 2^12, so the recursive transpose pays 2N²/B = 524,288. 17,039,360 / 524,288 = 32.5.',
    },
    {
      type: 'choice',
      prompt: 'On the same card, set B = 2^8 and keep M = 2^14. Which is cheapest now?',
      options: [
        'The row-by-row loop',
        'The recursive transpose',
        'Neither: they tie at about one transfer per element',
      ],
      answer: 2,
      hints: ['Compare M with B² = 2^16.'],
      solution:
        'M = 2^14 < B² = 2^16 breaks the tall-cache assumption, and M < N · B too, so both pay N² + N²/B = 16,842,752. Cache-oblivious algorithms need a tall cache.',
    },
    {
      type: 'number',
      prompt:
        'Card “Rent or buy a server” with b = 24. What is the competitive ratio of the best plan? Give two decimals.',
      answer: 1.96,
      tolerance: 0.005,
      hints: ['The best plan buys on day b.'],
      solution:
        'Break-even: 2 − 1/24 ≈ 1.96. Buying at once has ratio 24 and always renting has no bound.',
    },
    {
      type: 'multi',
      prompt: 'Which cards are judged by the competitive ratio?',
      options: [
        'Sum a big array',
        'Elect a coordinator',
        'Rent or buy a server',
        'Cache web pages',
      ],
      answers: [2, 3],
      hints: ['Which jobs must decide before the rest of the input arrives?'],
      solution:
        'Renting or buying and choosing which page to evict are made before the future is known, so they are online problems. Summing is parallel and the election is distributed.',
    },
  ],
  nextTeaser: 'Bài tiếp theo: Ôn tập: thuật toán nâng cao.',
};
