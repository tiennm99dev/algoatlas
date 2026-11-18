/** @typedef {import('$lib/algo-engine/practice-advanced-dp.js').RaceProblem} RaceProblem */

/** Whole numbers with thousands separators. @param {number} n */
const big = (n) => n.toLocaleString('en-US');

export const en = {
  slug: 'practice-advanced-dp',
  topic: 'advanced-dp',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán QHĐ nâng cao',
  intro:
    'Knowing the recurrence is half of an advanced DP problem; the other half is noticing which state compression or optimisation makes it fast enough. This runner solves three problems twice, naively and optimised, on the same input. Both must give the same answer, and the work and time counters show how far apart they grow.',
  summary:
    'Race naive and optimised DP solutions on the same input: a sliding-window frog, hops with squared costs, and the travelling salesman.',
  instruction:
    'Pick a problem, set its size and parameter, and choose an input number. The work counts update at once; press Run and time to measure both methods in your browser and fill the growth table. Then answer the questions below with the runner.',
  problemLabel: 'Problem',
  problems: {
    window: 'Frog with a window',
    squares: 'Hops with squared cost',
    tour: 'Shortest tour',
  },
  /** @type {Record<RaceProblem, string>} */
  statements: {
    window:
      'Stones 1..n cost a[i]. A frog starts on stone 1 and jumps 1 to k stones forward until it lands on stone n, paying for every stone it lands on, the first and the last included. Find the cheapest total. dp[i] = a[i] + min(dp[i − k..i − 1]).',
    squares:
      'Stones stand at increasing positions x[1..n]. A hop from a stone to any later stone costs the square of the distance plus a fixed C. Find the cheapest way from the first stone to the last. dp[i] = min over j < i of dp[j] + (x[i] − x[j])² + C.',
    tour: 'n cities stand on a grid, with distances in grid steps. Find the shortest closed tour that starts at city 0, visits every city once and returns. The optimised method keeps one state per set of visited cities and current city.',
  },
  /** @type {Record<RaceProblem, string>} */
  optimisation: {
    window: 'Monotone queue: O(n) instead of O(n·k)',
    squares: 'Convex hull trick: O(n) instead of O(n²)',
    tour: 'Bitmask DP (Held-Karp): O(2ⁿ · n²) instead of O(n!)',
  },
  sizeLabel: 'Size n',
  /** @type {Record<RaceProblem, string>} */
  paramLabel: { window: 'Window k', squares: 'Hop cost C', tour: '' },
  seedLabel: 'Input number',
  newInput: 'New input',
  run: 'Run and time',
  /** @param {number} lo @param {number} hi */
  sizeError: (lo, hi) => `n must be a whole number from ${lo} to ${hi}.`,
  /** @param {RaceProblem} p @param {number} lo @param {number} hi */
  paramError: (p, lo, hi) =>
    p === 'window'
      ? `k must be a whole number from ${lo} to ${hi}, and below n.`
      : `C must be a whole number from ${lo} to ${hi}.`,
  /** @param {number} max */
  seedError: (max) => `The input number must be a whole number from 1 to ${max}.`,
  inputTitle: 'Input',
  /** @param {RaceProblem} p @param {number} n */
  inputAria: (p, n) =>
    p === 'window'
      ? `The first stone costs of ${n}.`
      : p === 'squares'
        ? `The first stone positions of ${n}.`
        : `The first city positions of ${n}.`,
  /** @param {number} shown @param {number} n */
  inputMore: (shown, n) => (shown < n ? `First ${shown} of ${big(n)} values.` : ''),
  /** @param {{x: number, y: number}} c */
  city: (c) => `(${c.x}, ${c.y})`,
  naiveTitle: 'Naive',
  fastTitle: 'Optimised',
  answer: 'Answer',
  work: 'Work',
  time: 'Time',
  notTimed: 'Press Run',
  /** @param {number} ms */
  ms: (ms) => `${ms < 10 ? ms.toFixed(2) : ms.toFixed(1)} ms`,
  big,
  /** @param {number} naive @param {number} fast */
  ratio: (naive, fast) =>
    naive >= fast
      ? `The optimised method does ${(naive / Math.max(1, fast)).toFixed(1)}× less work.`
      : `At this size the naive method does less work: the optimisation only pays off for larger n.`,
  same: 'Both methods agree.',
  /** @param {number} a @param {number} b */
  differ: (a, b) => `The answers differ: ${a} and ${b}.`,
  workNote: {
    window: 'Work: window values read, against deque reads, pushes and pops.',
    squares: 'Work: candidates j tried, against hull checks, pointer moves and pushes.',
    tour: 'Work: additions over all tours, against Held-Karp transitions.',
  },
  barsAria: 'Bars comparing the work of both methods.',
  growthTitle: 'Growth',
  growthHead: ['n', 'Naive work', 'Optimised work', 'Naive time', 'Optimised time'],
  growthEmpty: 'Press Run and time to fill this table for three sizes up to n.',
  codeTitle: { naive: 'Naive', fast: 'Optimised' },
  takeaways: [
    'State compression: when the state must remember a set, store it as bits. Held-Karp’s (mask, city) states turn (n − 1)! tours into 2ⁿ · n states.',
    'A minimum over a sliding window of earlier states calls for a monotone queue: a newer, smaller value makes older ones useless forever.',
    'A cost that splits into dp[j] + b[j]·x[i] plus terms of i alone calls for the convex hull trick: each j is a line, each i a query.',
    'An optimisation has overhead: for tiny n the naive loop can do less work. Compare the growth, not one size.',
    'Raise n step by step for one problem and press Run each time: watch the naive work grow by n·k, n² or n! while the optimised work barely moves.',
  ],
  complexityHead: ['Problem', 'Naive → optimised', 'Why'],
  complexity: [
    ['Frog with a window', 'O(n·k) → O(n)', 'Each index enters and leaves the deque once.'],
    [
      'Hops with squared cost',
      'O(n²) → O(n)',
      'Slopes fall and queries rise, so the hull pointer only moves right.',
    ],
    [
      'Shortest tour',
      'O(n! · n) → O(2ⁿ · n²)',
      'Only the set of visited cities and the current city matter.',
    ],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Frog with a window, n = 10, k = 3, input number 1. What is the cheapest total cost?',
      answer: 61,
      hints: ['Set the size to 10 and the window to 3, keep input number 1, and read Answer.'],
      solution:
        '61. Both methods agree. Stones 1, 4, 7 and 10 cost 31 + 17 + 4 + 9 = 61; no other path of jumps of at most 3 is cheaper.',
    },
    {
      type: 'number',
      prompt:
        'Frog with a window, n = 1000, k = 50: how many window values does the naive method read?',
      answer: 48725,
      unit: 'values',
      hints: ['Read the naive Work for n = 1000, k = 50.', 'Stone i reads min(i − 1, k) values.'],
      solution:
        '1 + 2 + … + 49 = 1,225 for the first stones, then 950 stones × 50 = 47,500: 48,725.',
    },
    {
      type: 'number',
      prompt: 'Hops with squared cost, n = 2000: how many candidates does the naive method try?',
      answer: 1999000,
      unit: 'candidates',
      hints: ['Every stone i tries every earlier stone j.'],
      solution: '1 + 2 + … + 1999 = 2000 · 1999 / 2 = 1,999,000.',
    },
    {
      type: 'number',
      prompt: 'Shortest tour, n = 9: how many additions does the naive method make?',
      answer: 362880,
      unit: 'additions',
      hints: ['There are 8! orders of the cities after city 0, and each tour adds 9 distances.'],
      solution: '8! · 9 = 40,320 · 9 = 362,880, against a few thousand transitions for Held-Karp.',
    },
    {
      type: 'choice',
      prompt: 'Which optimisation makes the hops with squared cost fast?',
      options: ['Monotone queue', 'Convex hull trick', 'Bitmask DP', 'Knuth’s optimisation'],
      answer: 1,
      hints: ['Expand (x[i] − x[j])² and group the terms that mention j.'],
      solution:
        'dp[j] + x[j]² − 2x[j]·x[i] is a line in x[i] with slope −2x[j]: the convex hull trick.',
    },
    {
      type: 'choice',
      prompt: 'Frog with a window, n = 10, k = 3, input number 1. Which method does less work?',
      options: ['The naive method', 'The monotone queue', 'They do the same work'],
      answer: 0,
      hints: ['Compare the two Work counters at n = 10.'],
      solution:
        'The naive method reads 24 values; the deque does 27 steps. The queue only wins once n·k grows, which the growth table shows.',
    },
  ],
  nextTeaser: 'Bài tiếp theo: Tổ tiên chung gần nhất và nhảy nhị phân.',
};
