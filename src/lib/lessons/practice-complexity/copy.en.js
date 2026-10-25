/** @typedef {import('$lib/algo-engine/practice-complexity.js').DoublingFrame} DoublingFrame */
/** @typedef {import('$lib/algo-engine/practice-complexity.js').Bucket} Bucket */
/** @typedef {import('$lib/algo-engine/practice-complexity.js').SnippetId} SnippetId */

/** Whole numbers with commas, others to two decimals. @param {number} x */
const fmt = (x) =>
  Number.isInteger(x)
    ? x.toLocaleString('en-US')
    : x.toLocaleString('en-US', { maximumFractionDigits: 2 });

/** @type {Record<Bucket, string>} */
const BUCKET_NAMES = {
  1: 'O(1)',
  log: 'O(log n)',
  n: 'O(n)',
  nlogn: 'O(n log n)',
  n2: 'O(n²)',
  exp: 'O(2ⁿ)',
};

/** @type {Record<SnippetId, string>} */
const CARD_NAMES = {
  formula: 'Gauss formula',
  halving: 'Halving loop',
  single: 'Sum an array',
  'fixed-inner': 'Fixed inner loop',
  nested: 'Two full loops',
  triangle: 'Triangle loops',
  loglinear: 'Loop with doubling inner loop',
  geometric: 'Doubling outer loop',
  split: 'Split in halves',
  fib: 'Naive Fibonacci',
};

export const en = {
  slug: 'practice-complexity',
  topic: 'complexity',
  level: 'Intermediate',
  title: 'Practice: estimating running time',
  intro:
    'Estimating running time means counting how often the basic operation runs and keeping only the growth class. Here you sort ten code snippets into Big-O buckets, then test your guess with a doubling experiment: run the code for n = 1, 2, 4, … and see what happens to the count each time n doubles.',
  summary:
    'Sort code snippets into O(1), O(log n), O(n), O(n log n), O(n²) and O(2ⁿ) buckets, and check each guess by counting operations as n doubles.',
  instruction:
    'Pick a card (click, tap or Enter), then pick a bucket’s “Put here” button, or drag the card onto a bucket. The picked card is also measured: step through its doubling experiment and watch the ratio column. Check your sorting when every card is placed.',
  trayTitle: 'Unsorted cards',
  trayEmpty: 'All cards are sorted.',
  toTray: 'Back to tray',
  putHere: 'Put here',
  /** @param {string} bucket */
  putHereLabel: (bucket) => `Put the picked card in ${bucket}`,
  toTrayLabel: 'Put the picked card back in the tray',
  bucketEmpty: 'Drop cards here',
  buckets: BUCKET_NAMES,
  cards: CARD_NAMES,
  /** @param {string} name @param {string} where @param {boolean} picked @param {string} verdict */
  cardLabel: (name, where, picked, verdict) =>
    `${name}, ${where}${picked ? ', picked' : ''}${verdict ? `, ${verdict}` : ''}`,
  inTray: 'in the tray',
  /** @param {string} bucket */
  inBucket: (bucket) => `in ${bucket}`,
  verdicts: { right: '✓ right', wrong: '✗ wrong' },
  check: 'Check my sorting',
  reveal: 'Show the answers',
  reset: 'Start over',
  /** @param {number} right @param {number} total @param {number} unplaced */
  score: (right, total, unplaced) =>
    `${right} of ${total} cards in the right bucket${unplaced ? `, ${unplaced} still in the tray` : ''}.`,
  allRight: 'All ten right: well estimated!',
  /** @param {string} name */
  picked: (name) => `Picked: ${name}. Now choose a bucket.`,
  /** @param {string} name @param {string} bucket */
  moved: (name, bucket) => `Moved ${name} to ${bucket}.`,
  /** @param {string} name */
  backToTray: (name) => `Moved ${name} back to the tray.`,
  noPick: 'Pick a card first, then choose where it goes.',
  revealed: 'Every card is now in its right bucket. Read why under each card.',
  why: /** @type {Record<SnippetId, string>} */ ({
    formula: 'One arithmetic step, whatever n is.',
    halving: 'i halves until it reaches 1: ⌊log₂ n⌋ passes.',
    single: 'One pass over n elements.',
    'fixed-inner': 'The inner loop runs 10 times, a constant: 10n.',
    nested: 'n passes of n steps: n².',
    triangle: '1 + 2 + … + n = n(n + 1)/2, still Θ(n²).',
    loglinear: 'n passes of a ⌈log₂ n⌉-step doubling loop.',
    geometric: '1 + 2 + 4 + … ≤ 2n: the last pass dominates, so Θ(n).',
    split: 'Each level of halves does n work, over log₂ n levels.',
    fib: 'Two calls on n − 1 and n − 2: Θ(φⁿ), φ ≈ 1.618, within O(2ⁿ).',
  }),
  measureTitle: 'Doubling experiment',
  /** @param {string} name */
  measuring: (name) => `Measuring: ${name}`,
  tableAria: 'Operation counts for each n, with the ratio and difference to the previous row',
  cols: ['count', '× prev', '+ prev'],
  /** @param {number} n */
  rowHead: (n) => `n=${n}`,
  dash: '–',
  fmt,
  stats: { n: 'n', count: 'Count', ratio: 'Ratio to n/2' },
  /** @param {DoublingFrame} f @param {string} name */
  describe(f, name) {
    const r = f.rows.at(-1);
    switch (f.kind) {
      case 'start':
        return `${name}: we will run it for n = 1, 2, 4, … and count the highlighted line each time.`;
      case 'measure': {
        const row = /** @type {NonNullable<typeof r>} */ (r);
        const head = `n = ${fmt(row.n)}: the highlighted line ran ${fmt(row.count)} time${row.count === 1 ? '' : 's'}.`;
        if (row.diff === null) return `${head} This is the first measurement.`;
        if (row.ratio === null) return `${head} That is ${fmt(row.diff)} more than before.`;
        return `${head} Doubling n multiplied the count by ${fmt(row.ratio)} (+${fmt(row.diff)}).`;
      }
      case 'done': {
        const row = /** @type {NonNullable<typeof r>} */ (r);
        const tail =
          row.ratio === null
            ? ''
            : ` The last doubling multiplied the count by ${fmt(row.ratio)} and added ${fmt(/** @type {number} */ (row.diff))}.`;
        return `Done at n = ${fmt(row.n)} with ${fmt(row.count)} operations.${tail} Which bucket does that pattern point to?`;
      }
    }
  },
  practiceTitle: 'Questions for the doubling experiment',
  takeaways: [
    'Count how often the basic operation runs as a function of n, then keep only the fastest-growing term and drop constant factors.',
    'Nested loops multiply and loops in sequence add, but look at the bounds: an inner loop of 10 is a constant, and an inner loop to i still gives n(n + 1)/2 = Θ(n²).',
    'A variable that halves or doubles each pass gives log₂ n passes. A doubling outer loop whose inner loop runs i times sums to under 2n: Θ(n), not n log n.',
    'The doubling test: when n doubles, the count stays the same for O(1), grows by a constant for O(log n), doubles for O(n), a little more than doubles for O(n log n), quadruples for O(n²), and explodes for exponential growth.',
    'Try it: place the Doubling outer loop card, then measure it. Its ratio settles at 2, the same as Sum an array.',
  ],
  complexityHead: ['Code pattern', 'Growth', 'Count when n doubles'],
  complexity: [
    ['A fixed number of statements', 'O(1)', 'Unchanged.'],
    ['A variable halved or doubled until it hits n', 'O(log n)', 'Grows by about 1.'],
    ['One loop to n, or a loop with a constant inner loop', 'O(n)', 'About × 2.'],
    ['n passes of a halving loop; halves split recursively', 'O(n log n)', 'A bit over × 2.'],
    ['Two nested loops to n, or to i', 'O(n²)', 'About × 4.'],
    ['Two recursive calls on n − 1 and n − 2', 'O(2ⁿ)', 'The ratio itself keeps growing.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Measure Triangle loops. How many times does c = c + 1 run for n = 64?',
      answer: 2080,
      unit: 'times',
      hints: [
        'Pick the Triangle loops card and step its experiment to n = 64.',
        'The count is 1 + 2 + … + 64.',
      ],
      solution:
        '1 + 2 + … + 64 = 64 × 65 / 2 = 2,080. It grows like n²/2, so the card belongs in O(n²).',
    },
    {
      type: 'number',
      prompt: 'Measure the Doubling outer loop. How many times does c = c + 1 run for n = 1,024?',
      answer: 2047,
      unit: 'times',
      hints: [
        'The inner loop runs i times for i = 1, 2, 4, …, 1,024.',
        'A sum of powers of two: 1 + 2 + 4 + … + 2ᵏ = 2ᵏ⁺¹ − 1.',
      ],
      solution:
        '1 + 2 + 4 + … + 1,024 = 2,047, less than 2n = 2,048. The count only doubles when n doubles, so the snippet is O(n), not O(n log n).',
    },
    {
      type: 'number',
      prompt: 'Measure Naive Fibonacci. How many calls does fib(16) make?',
      answer: 3193,
      unit: 'calls',
      hints: [
        'Step the experiment to its last row, n = 16.',
        'calls(n) = 1 + calls(n − 1) + calls(n − 2), which works out to 2·F(n + 1) − 1.',
      ],
      solution:
        'calls(16) = 2 · F(17) − 1 = 2 · 1,597 − 1 = 3,193. From n = 8 (67 calls) the count grew about 48 times: exponential growth.',
    },
    {
      type: 'choice',
      prompt:
        'Measure Split in halves. By about what factor does the count grow from n = 512 to n = 1,024?',
      options: ['Exactly 1', 'About 2.22', 'Exactly 4', 'About 47'],
      answer: 1,
      hints: [
        'Read the × prev column on the last row.',
        'n log₂ n goes from 512 × 9 to 1,024 × 10.',
      ],
      solution:
        '4,608 → 10,240 is × 2.22: a bit more than doubling, the signature of O(n log n). The extra factor 10/9 is log₂ 1,024 ÷ log₂ 512.',
    },
    {
      type: 'multi',
      prompt: 'Which snippets are Θ(n)? Use the ratio column to check.',
      options: [
        'Sum an array',
        'Fixed inner loop',
        'Doubling outer loop',
        'Loop with doubling inner loop',
        'Halving loop',
      ],
      answers: [0, 1, 2],
      hints: [
        'A Θ(n) count doubles when n doubles.',
        'One of the two loops with a doubling variable sums to under 2n.',
      ],
      solution:
        'Sum an array (n), Fixed inner loop (10n) and Doubling outer loop (< 2n) all double with n. The doubling inner loop gives n·⌈log₂ n⌉, and the halving loop only log₂ n.',
    },
    {
      type: 'order',
      prompt: 'Order these snippets by their count at n = 1,024, smallest first.',
      items: [
        'Triangle loops',
        'Sum an array',
        'Loop with doubling inner loop',
        'Halving loop',
        'Doubling outer loop',
      ],
      answer: [3, 1, 4, 2, 0],
      hints: [
        'Read the n = 1,024 row of each experiment.',
        'The counts are 10, 1,024, 2,047, 10,240 and 524,800.',
      ],
      solution:
        'Halving loop 10, Sum an array 1,024, Doubling outer loop 2,047, Loop with doubling inner loop 10,240, Triangle loops 524,800.',
    },
    {
      type: 'text',
      prompt: 'Give the Big-O class of Loop with doubling inner loop.',
      accept: [
        'O(n log n)',
        'n log n',
        'O(n logn)',
        'O(nlogn)',
        'nlogn',
        'Θ(n log n)',
        'O(n log2 n)',
        'O(n log₂ n)',
      ],
      hints: [
        'The outer loop runs n times. How many times does j = 2 · j run before j reaches n?',
        'At n = 1,024 the count is 1,024 × 10.',
      ],
      solution: 'n passes of ⌈log₂ n⌉ doublings: n⌈log₂ n⌉ = Θ(n log n).',
    },
  ],
  nextTeaser:
    'Next up: Static and dynamic arrays, the first data structure, where these cost estimates meet real operations.',
};
