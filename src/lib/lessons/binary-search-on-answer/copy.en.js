/** @typedef {import('$lib/algo-engine/binary-search-on-answer.js').AnswerFrame} AnswerFrame */

/** @param {number} k @param {string} one @param {string} many */
const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;

export const en = {
  slug: 'binary-search-on-answer',
  topic: 'searching',
  level: 'Intermediate',
  title: 'Binary search on the answer',
  intro:
    'Sometimes there is no sorted array to search, only a question with a yes-or-no test: “can it be done with capacity c?”. When every c above a working value also works, the answers form a strip of false cells followed by true cells, and binary search finds the boundary without trying every c.',
  summary:
    'Find the smallest truck capacity that ships every parcel in D days by halving the range of capacities with a feasibility check.',
  instruction:
    'Parcels leave in order, one truck load per day. Edit the weights or the days D, then step through: each step tests the middle capacity with a greedy packing and throws away half of the strip. Tick “Show every answer” to see the whole false-then-true strip.',
  takeaways: [
    'The search is over values, not positions: the candidates are the capacities from max(w) to sum(w), and no array of them is ever built.',
    'It works because the predicate is monotone. If capacity c ships everything in D days, so does every c′ > c, so the strip is all false, then all true.',
    'Each step costs one feasibility check, here a greedy O(n) packing. The search makes about log₂(sum(w) − max(w) + 1) checks instead of one per capacity.',
    'Pick the bounds so that the low end may fail and the high end surely works, then keep that invariant: hi = mid when mid works, lo = mid + 1 when it fails.',
    'Try weights 15, 15, 15, 15, 15, 15, 15, 15, 15, 15 with D = 1: 136 candidates, and only 7 checks find 150.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    ['One feasibility check', 'O(n)', 'The greedy packing reads every parcel once.'],
    [
      'Binary search on capacities',
      'O(n log S)',
      'At most about log₂ S checks: the range max(w) to sum(w) holds at most S = sum(w) capacities.',
    ],
    ['Trying every capacity upward', 'O(n · S)', 'Up to S checks before the first true.'],
    ['Memory', 'O(1)', 'lo, hi, mid and the running load.'],
  ],
  nextTeaser:
    'Next up: ternary search, which finds the peak of a function that rises and then falls.',
  weightsLabel: 'Parcel weights',
  daysLabel: 'Days D',
  tryLabel: 'Try a capacity',
  newParcels: 'New parcels',
  revealLabel: 'Show every answer',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 7, 2, 5.',
    range: 'Every weight must be from 1 to 15.',
    count: 'Type from 1 to 10 weights.',
  },
  /** @param {number} n */
  daysError: (n) => `D must be a whole number from 1 to ${n}, the number of parcels.`,
  /** @param {number} lo @param {number} hi */
  tryError: (lo, hi) => `Try a capacity from ${lo} to ${hi}.`,
  stripTitle: 'feasible(c) for every candidate capacity c',
  /** @param {number} lo @param {number} hi @param {number} wlo @param {number} whi */
  stripLabel: (lo, hi, wlo, whi) =>
    `Capacities ${lo} to ${hi}. Still possible: ${wlo} to ${whi}. Below ${wlo} fails, ${whi} and above works.`,
  legend: {
    active: 'Capacity being tested (mid)',
    no: 'Fails: below lo',
    yes: 'Works: hi and above',
    sorted: 'Smallest that works',
    tested: 'Tested by a check',
    revealed: 'Revealed by “Show every answer”',
  },
  markers: { no: '✕', yes: '✓', tested: '●' },
  packTitle: 'Feasibility check',
  /** @param {number} c */
  packHeading: (c) => `Greedy packing at capacity ${c}`,
  packEmpty: 'The packing appears when a capacity is checked.',
  /** @param {number} day @param {number[]} parcels @param {number} c */
  dayLabel: (day, parcels, c) =>
    `Day ${day}: ${parcels.join(' + ')} = ${parcels.reduce((s, x) => s + x, 0)} of ${c}`,
  /** @param {number} used @param {number} limit @param {boolean} ok */
  verdict: (used, limit, ok) =>
    `${plural(used, 'day', 'days')} ${ok ? '≤' : '>'} D = ${limit}: ${ok ? '✓ works' : '✕ fails'}`,
  dayShort: 'Day',
  stats: {
    checks: 'Feasibility checks',
    reads: 'Parcel reads',
    linear: 'Checks scanning up from max(w)',
    range: 'Candidate capacities',
  },
  pending: '—',
  testedTitle: 'Capacities tested',
  testedEmpty: 'None yet',
  /** @param {number} cap @param {boolean} ok */
  testedChip: (cap, ok) => `${cap} ${ok ? '✓' : '✕'}`,
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Starting parcels 7, 2, 5, 10, 8, 4, 9, 3 with D = 3. How many feasibility checks does the search make?',
      answer: 5,
      unit: 'checks',
      hints: [
        'Step to the end and read the Feasibility checks card.',
        'The range 10 to 48 holds 39 capacities, and ⌈log₂ 39⌉ = 6 is the most it could need.',
      ],
      solution:
        'It tests 29 ✓, 19 ✓, 14 ✕, 17 ✕ and 18 ✓: 5 checks. Scanning up from 10 would need 9 checks to reach 18.',
    },
    {
      type: 'number',
      prompt:
        'Keep the same parcels and set D = 2. What is the smallest capacity that ships everything?',
      answer: 24,
      hints: [
        'Change Days D to 2 and step to the end.',
        'Two days means splitting the row into a left and a right part; the heavier part decides.',
      ],
      solution:
        '24: day 1 carries 7 + 2 + 5 + 10 = 24 and day 2 carries 8 + 4 + 9 + 3 = 24. With capacity 23 the greedy packing needs a third day.',
    },
    {
      type: 'choice',
      prompt: 'Why can the search start at lo = max(w) rather than at 1?',
      options: [
        'A capacity below the heaviest parcel can never carry it, so every such c fails.',
        'Because max(w) is always the answer.',
        'Because binary search needs lo to be a power of two.',
        'Because the predicate is false at max(w).',
      ],
      answer: 0,
      hints: [
        'Put D equal to the number of parcels and see what the answer becomes.',
        'What happens to the heaviest parcel if c is smaller than it?',
      ],
      solution:
        'No day can carry a parcel heavier than c, so every c < max(w) is infeasible. max(w) itself may work (when D is large) or fail, so it is a valid low end of the window.',
    },
    {
      type: 'choice',
      prompt: 'Which property of feasible(c) makes binary search on the answer correct?',
      options: [
        'It is fast to compute.',
        'It is monotone: once true, it stays true for every larger c.',
        'It is true for exactly one c.',
        'The weights are sorted.',
      ],
      answer: 1,
      hints: [
        'Tick “Show every answer” and look at the shape of the strip.',
        'Halving only works if one test tells you about a whole side of the window.',
      ],
      solution:
        'Monotone: a capacity that works leaves room to spare at any larger capacity. So the strip is false…false true…true, and one test at mid rules out a whole half. The weights need not be sorted.',
    },
  ],
  /** @param {AnswerFrame} f @param {number} limit */
  describe(f, limit) {
    switch (f.kind) {
      case 'start':
        return `Candidates run from ${f.lo}, the heaviest parcel, to ${f.hi}, every parcel on one day. Capacity ${f.hi} surely works, so the answer is in [${f.lo}, ${f.hi}].`;
      case 'probe':
        return `The answer is in [${f.lo}, ${f.hi}]. Test the middle capacity, mid = ${f.mid}.`;
      case 'check':
        return `At capacity ${f.mid} the greedy packing needs ${plural(f.days.length, 'day', 'days')}, ${f.ok ? 'within' : 'more than'} D = ${limit}. feasible(${f.mid}) is ${f.ok ? 'true' : 'false'}.`;
      case 'go-left':
        return `${f.mid} works, so the answer is at most ${f.mid}: hi = ${f.hi}. Every capacity above it works too.`;
      case 'go-right':
        return `${f.mid} fails, and so does every smaller capacity: lo = ${f.lo}.`;
      case 'done':
        return `lo = hi = ${f.answer}. The smallest capacity that ships everything in ${plural(limit, 'day', 'days')} is ${f.answer}, found with ${plural(f.checks, 'check', 'checks')}.`;
    }
  },
};
