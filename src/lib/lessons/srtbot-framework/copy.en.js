/** @typedef {import('$lib/algo-engine/srtbot-framework.js').SrtbotFrame} SrtbotFrame */
/** @typedef {import('$lib/algo-engine/srtbot-framework.js').SrtbotProblem} SrtbotProblem */
/** @typedef {import('$lib/algo-engine/srtbot-framework.js').SrtbotOption} SrtbotOption */
/** @typedef {import('$lib/algo-engine/srtbot-framework.js').SrtbotStep} SrtbotStep */

/** @param {number} n */
const num = (n) => String(n).replace('-', '−');
/** Wraps a negative number in brackets inside a product or sum. @param {number} n */
const term = (n) => (n < 0 ? `(${num(n)})` : num(n));

/**
 * @param {SrtbotFrame} f
 * @param {SrtbotOption} o
 */
function optionText(f, o) {
  const i = f.cell;
  const t = (/** @type {number} */ k) => term(/** @type {number} */ (f.table[k]));
  const v = f.values;
  switch (o.kind) {
    case 'skip':
      return `skip pin ${i}: B(${i + 1}) = ${num(o.value)}`;
    case 'one':
      return `hit pin ${i}: ${num(v[i])} + ${t(i + 1)} = ${num(o.value)}`;
    case 'pair':
      return `hit pins ${i} and ${i + 1}: ${term(v[i])}·${term(v[i + 1])} + ${t(i + 2)} = ${num(o.value)}`;
    case 'fresh':
      return `start a new run: ${num(o.value)}`;
    case 'extend':
      return `extend the run ending at ${i - 1}: ${num(v[i])} + ${t(i - 1)} = ${num(o.value)}`;
  }
}

export const en = {
  slug: 'srtbot-framework',
  topic: 'dynamic-programming',
  level: 'Beginner',
  title: 'The SRTBOT framework',
  intro:
    'SRTBOT is a six-step recipe for designing a dynamic program: choose the Subproblems, Relate each one to smaller ones, check a Topological order exists, fix the Base cases, say how the Original problem is read from the subproblems, and bound the Time. Every dynamic program in this chapter is these six answers. Here you design two of them, bowling and maximum subarray, and then run the design on your own numbers.',
  summary:
    'Walk through the six SRTBOT steps for bowling and maximum subarray, then watch the design fill its table on your own numbers.',
  instruction:
    'Pick a problem and step: the guide on the right lights up each SRTBOT step as the run reaches it, and the table fills in topological order. Press a step’s “Show” button to jump to it, or type your own numbers and watch which option wins each cell.',
  problemLabel: 'Problem',
  problems: { bowling: 'Bowling', maxsub: 'Maximum subarray' },
  valuesLabel: 'Values',
  /** @param {SrtbotProblem} p */
  valuesHint: (p) =>
    p === 'bowling'
      ? 'Pin values left to right, from −9 to 9.'
      : 'Array values left to right, from −9 to 9.',
  exampleButton: 'Load the example',
  /** @param {number} max @param {number} abs */
  valueErrors: (max, abs) => ({
    format: 'Type whole numbers separated by commas or spaces, for example 3, −1, 4.',
    count: `Type from 1 to ${max} numbers.`,
    range: `Each number must be from −${abs} to ${abs}.`,
  }),
  /** @param {SrtbotProblem} p */
  problemText: (p) =>
    p === 'bowling'
      ? 'Pins stand in a row, each with a value. A throw hits one pin for its value or two neighbours for the product of their values; you may skip pins, and each pin is hit at most once. Find the best total score.'
      : 'Find the largest sum of a non-empty run of neighbouring values a[i..j].',
  guideTitle: 'SRTBOT guide',
  stepOrder: /** @type {SrtbotStep[]} */ ([
    'subproblems',
    'relate',
    'topo',
    'base',
    'original',
    'time',
  ]),
  stepLetters: { subproblems: 'S', relate: 'R', topo: 'T', base: 'B', original: 'O', time: 'T' },
  stepNames: {
    subproblems: 'Subproblems',
    relate: 'Relate',
    topo: 'Topological order',
    base: 'Base cases',
    original: 'Original problem',
    time: 'Time',
  },
  /** @type {Record<SrtbotProblem, Record<SrtbotStep, string>>} */
  stepText: {
    bowling: {
      subproblems:
        'B(i) = the best score using only pins i to n − 1, a suffix of the row. That is n + 1 subproblems, i = 0 … n.',
      relate:
        'Look at pin i, the first one left: skip it, B(i + 1); hit it alone, v[i] + B(i + 1); or hit it with pin i + 1, v[i]·v[i + 1] + B(i + 2). B(i) is the largest of these.',
      topo: 'B(i) needs only B(i + 1) and B(i + 2), so compute i = n, n − 1, …, 0. The dependencies never form a cycle.',
      base: 'B(n) = 0: with no pins left there are no points.',
      original: 'B(0): the best score using the whole row.',
      time: 'n + 1 subproblems × at most 3 options each = O(n) time and O(n) memory.',
    },
    maxsub: {
      subproblems:
        'x(i) = the largest sum of a run that ends exactly at index i. That is n subproblems, i = 0 … n − 1.',
      relate:
        'A run ending at i is either a[i] alone or a[i] added to the best run ending at i − 1: x(i) = max(a[i], a[i] + x(i − 1)).',
      topo: 'x(i) needs only x(i − 1), so compute i = 0, 1, …, n − 1.',
      base: 'x(0) = a[0]: the only run that ends at index 0.',
      original:
        'The best run ends somewhere, so the answer is the largest x(i), not one subproblem.',
      time: 'n subproblems × 2 options each, plus one pass for the maximum = O(n) time.',
    },
  },
  showButton: 'Show',
  /** @param {string} name */
  showAria: (name) => `Jump to the ${name} step`,
  stepStatus: { current: 'now', done: 'done', todo: 'to come' },
  stepMarkers: { current: '▶', done: '✓', todo: '' },
  tableTitle: 'Input and subproblems',
  /** @param {SrtbotProblem} p */
  rowHeaders: (p) => (p === 'bowling' ? ['v', 'B'] : ['a', 'x']),
  tableAria: 'Input values above, subproblem values below.',
  /**
   * @param {SrtbotProblem} p
   * @param {number} r
   * @param {number} c
   * @param {number|string|null} value
   * @param {string} state
   */
  cellLabel: (p, r, c, value, state) => {
    const name =
      r === 0 ? `${p === 'bowling' ? 'v' : 'a'}[${c}]` : `${p === 'bowling' ? 'B' : 'x'}(${c})`;
    const shown = value === null || value === '' ? 'empty' : num(Number(value));
    return `${name}: ${shown}${state ? `, ${state}` : ''}`;
  },
  cellStates: {
    write: 'computed now',
    read: 'read now',
    answer: 'the answer',
    base: 'base case',
  },
  legend: {
    write: 'Computed now',
    read: 'Read by the winning option',
    answer: 'Where the answer is read',
  },
  markers: { write: '●', read: '○', answer: '★' },
  optionsTitle: 'Options compared',
  optionsEmpty: 'The relation compares options once the table starts filling.',
  chosenMark: '✓ best',
  /** @param {SrtbotOption['kind']} kind @param {number} i */
  optionName: (kind, i) =>
    ({
      skip: `Skip pin ${i}`,
      one: `Hit pin ${i} alone`,
      pair: `Hit pins ${i} and ${i + 1}`,
      fresh: `Start a new run at ${i}`,
      extend: `Extend the run ending at ${i - 1}`,
    })[kind],
  stats: {
    filled: 'Subproblems solved',
    work: 'Options compared',
    answer: 'Answer',
  },
  answerPending: '…',
  /** @param {SrtbotFrame} f */
  describe(f) {
    const bowling = f.problem === 'bowling';
    const s = (/** @type {number} */ i) => `${bowling ? 'B' : 'x'}(${i})`;
    const size = f.table.length;
    switch (f.kind) {
      case 'start':
        return `Design a dynamic program for ${bowling ? 'bowling' : 'maximum subarray'} in six SRTBOT steps, then run it on these ${f.values.length} values.`;
      case 'subproblems':
        return bowling
          ? `S, subproblems: B(i) is the best score on pins i to ${f.values.length - 1} only. The table has ${size} empty cells, B(0) to B(${size - 1}).`
          : `S, subproblems: x(i) is the best sum of a run that ends at index i. The table has ${size} empty cells, x(0) to x(${size - 1}).`;
      case 'relation':
        return bowling
          ? 'R, relate: the first pin left is skipped, hit alone, or hit with its neighbour. Each choice leaves a smaller suffix, so B(i) = max(B(i + 1), v[i] + B(i + 1), v[i]·v[i + 1] + B(i + 2)).'
          : 'R, relate: a run ending at i starts fresh at i or extends the best run ending at i − 1, so x(i) = max(a[i], a[i] + x(i − 1)).';
      case 'order':
        return bowling
          ? `T, topological order: every B(i) needs larger indices only, so fill from B(${size - 1}) down to B(0).`
          : `T, topological order: every x(i) needs x(i − 1) only, so fill from x(0) up to x(${size - 1}).`;
      case 'base':
        return bowling
          ? `B, base case: B(${f.cell}) = 0. No pins are left, so no points.`
          : `B, base case: x(0) = a[0] = ${num(f.values[0])}, the only run that ends at index 0.`;
      case 'compute': {
        const best = f.options[f.chosen];
        return `${s(f.cell)} = max of ${f.options.map((o) => optionText(f, o)).join('; ')}. The best is ${num(best.value)}.`;
      }
      case 'original':
        return bowling
          ? `O, original problem: B(0) = ${num(f.answer ?? 0)}, the best score on the whole row.`
          : `O, original problem: the best run may end anywhere, so take the largest x(i). It is x(${f.answerCells[0]}) = ${num(f.answer ?? 0)}.`;
      case 'done':
        return `T, time: ${f.filled} subproblems, ${f.work} options compared in all. Each subproblem does O(1) work, so the whole run is O(n).`;
    }
  },
  takeaways: [
    'S: pick subproblems that are prefixes, suffixes or substrings of the input. Suffixes B(i) for bowling, “ends at i” for maximum subarray.',
    'R: relate a subproblem to smaller ones by guessing one local choice, such as what happens to the first pin, and trying every option.',
    'T and B: the relation must never loop back, so there is an order to fill the table in; the smallest subproblems are the base cases.',
    'O and T: the original problem may be one subproblem, B(0), or a combination, the largest x(i). Time is the number of subproblems times the work per subproblem.',
    'Load the bowling example and press Show on R, then step: watch which of skip, hit one and hit a pair wins each cell, and try a row where every pin is negative.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    ['Bowling, time', 'O(n)', 'n + 1 subproblems, each comparing at most 3 options.'],
    ['Bowling, memory', 'O(n)', 'One table cell per suffix; only the last two are needed at once.'],
    [
      'Maximum subarray, time',
      'O(n)',
      'n subproblems with 2 options each, plus one pass for the largest x(i).',
    ],
    [
      'Any SRTBOT design',
      'subproblems × work each',
      'Memoization or tabulation solves every subproblem once, doing the relation’s work each time.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'order',
      prompt: 'Put the six SRTBOT steps in order.',
      items: [
        'Base cases',
        'Subproblems',
        'Time',
        'Relate',
        'Original problem',
        'Topological order',
      ],
      answer: [1, 3, 5, 0, 4, 2],
      hints: ['The letters spell S, R, T, B, O, T.'],
      solution:
        'Subproblems, Relate, Topological order, Base cases, Original problem, Time. You first say what to compute, then how the pieces depend on each other, then where to start and finish, and last how long it takes.',
    },
    {
      type: 'number',
      prompt: 'What is the best bowling score for the pins 3, 4, −1, 5?',
      answer: 17,
      unit: 'points',
      hints: [
        'Pick Bowling, type 3, 4, −1, 5 and step to the end.',
        'Compare hitting 3 and 4 as a pair with hitting them one by one.',
      ],
      solution:
        'B(4) = 0, B(3) = 5, B(2) = max(5, −1 + 5, −1·5 + 0) = 5, B(1) = max(5, 4 + 5, 4·(−1) + 5) = 9, B(0) = max(9, 3 + 9, 3·4 + 5) = 17: hit 3 and 4 as a pair, skip −1, hit 5.',
    },
    {
      type: 'number',
      prompt: 'What is the largest sum of a run in 2, −5, 3, −1, 4, −6, 2?',
      answer: 6,
      hints: [
        'Pick Maximum subarray, type the values and step to the original problem.',
        'x(i) is the best run ending at i; the answer is the largest x(i).',
      ],
      solution: 'x = 2, −3, 3, 2, 6, 0, 2. The largest is x(4) = 6, the run 3, −1, 4.',
    },
    {
      type: 'choice',
      prompt: 'Bowling uses suffix subproblems B(i). In which order must the table be filled?',
      options: [
        'i = 0, 1, …, n, because B(0) is the answer.',
        'i = n, n − 1, …, 0, because B(i) needs B(i + 1) and B(i + 2).',
        'Any order: each B(i) is independent.',
        'From the most valuable pin to the least.',
      ],
      answer: 1,
      hints: ['Look at which cells the relation for B(i) reads.'],
      solution:
        'A topological order puts every subproblem after the ones it needs. B(i) reads B(i + 1) and B(i + 2), larger indices, so the order is decreasing i, starting from the base case B(n).',
    },
    {
      type: 'choice',
      prompt: 'Why is the answer to maximum subarray not simply x(n − 1)?',
      options: [
        'Because x(n − 1) is the base case.',
        'Because the best run does not have to end at the last index.',
        'Because x(n − 1) is always negative.',
        'It is: x(n − 1) is always the largest.',
      ],
      answer: 1,
      hints: ['Load the example and compare x(6) with x(8).'],
      solution:
        'x(n − 1) only covers runs that end at the last value. In the example x(8) = 5 but x(6) = 6, so the original problem is the largest of all the x(i).',
    },
    {
      type: 'text',
      prompt: 'What is the running time of the bowling design, in big-O terms of the n pins?',
      accept: ['O(n)', 'Θ(n)', 'theta(n)'],
      hints: ['Multiply the number of subproblems by the work per subproblem.'],
      solution: 'n + 1 subproblems with O(1) work each: O(n).',
    },
  ],
  nextTeaser:
    'Next up: 1D DP: climbing stairs, coin change and house robber, where the state is a prefix and each cell reads a few cells before it.',
};
