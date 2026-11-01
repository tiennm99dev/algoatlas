/** @typedef {import('$lib/algo-engine/practice-dynamic-programming.js').DesignFrame} DesignFrame */
/** @typedef {import('$lib/algo-engine/practice-dynamic-programming.js').Problem} Problem */
/** @typedef {import('$lib/algo-engine/practice-dynamic-programming.js').Term} Term */

/** A value with a real minus sign, or a dash for an empty cell. @param {number|null} v */
const num = (v) => (v === null ? '–' : v < 0 ? `−${-v}` : String(v));

/** @type {Record<Term, string>} */
const TERM_LABELS = {
  a: 'a[i]',
  'prev-a': 'dp[i−1] + a[i]',
  'prev2-a': 'dp[i−2] + a[i]',
  prev: 'dp[i−1]',
  prev2: 'dp[i−2]',
  'prev-if': 'dp[i−1], if a[i] ≠ 0',
  'prev2-if': 'dp[i−2], if a[i−1]a[i] is 10 to 26',
};

export const en = {
  slug: 'practice-dynamic-programming',
  topic: 'dynamic-programming',
  level: 'Intermediate',
  title: 'Practice: dynamic programming problems',
  intro:
    'Solving a new DP problem comes down to two decisions: what dp[i] means, and how dp[i] follows from smaller cells. Here you make both decisions yourself on three problems. Your design runs on small inputs, every cell is checked against a brute-force value for the meaning you declared, and the answer is checked against the problem. So you see not only that a design fails but where and why.',
  summary:
    'Declare what dp[i] means, build the recurrence, and test it on small inputs, with each cell checked against brute force.',
  instruction:
    'Pick a problem, then choose a meaning for dp[i], the terms and the way to combine them, the base value and how to read the answer. The Test on samples list updates at once. Click a sample and step through it: a ✕ marks the first cell that breaks your state’s promise.',
  problemLabel: 'Problem',
  problems: { 'max-subarray': 'Maximum subarray', climb: 'Cheapest climb', decode: 'Decode ways' },
  /** @type {Record<Problem, string>} */
  goals: {
    'max-subarray': 'Find the largest sum of a non-empty run of neighbouring values.',
    climb:
      'Start on the ground and climb 1 or 2 steps at a time. Pay a[i] for each step you stand on and finish on step n, for the least money.',
    decode:
      'Digits stand for letters, 1 → A up to 26 → Z. Count the ways to read the whole string as letters. A letter never starts with 0.',
  },
  valuesLabel: { 'max-subarray': 'Values a', climb: 'Step costs a', decode: 'Digits' },
  randomInput: 'Random input',
  /** @param {number} min @param {number} max @param {number} abs */
  errors: (min, max, abs) => ({
    format: {
      'max-subarray': 'Write whole numbers separated by commas.',
      climb: 'Write whole numbers separated by commas.',
      decode: 'Write digits only, for example 226.',
    },
    count: `Type ${min} to ${max} values.`,
    range: {
      'max-subarray': `Each value must be from −${abs} to ${abs}.`,
      climb: `Each cost must be from 1 to ${abs}.`,
      decode: 'Write digits only, for example 226.',
    },
  }),
  designTitle: 'Your design',
  stateLabel: 'dp[i] means',
  /** @type {Record<string, string>} */
  states: {
    ending: 'the best sum of a run that ends exactly at i',
    within: 'the best sum of a run anywhere in the first i values',
    'on-step': 'the least cost of a climb that ends on step i',
    every: 'the cost of standing on every step from 1 to i',
    prefix: 'the ways to read the first i digits',
    single: 'the ways to read the first i digits with digit i as a letter on its own',
  },
  termsLabel: 'Terms',
  terms: TERM_LABELS,
  combineLabel: 'Combine with',
  combines: { max: 'max', min: 'min', sum: 'sum' },
  baseLabel: 'dp[0]',
  answerLabel: 'The answer is',
  answers: { last: 'dp[n]', largest: 'the largest dp[i]', smallest: 'the smallest dp[i]' },
  tableTitle: 'Your table against the truth',
  tableNote:
    'The row a is the input. The row dp is what your recurrence computes. The row true is what your chosen meaning says each cell should hold, found by brute force. dp[0] is the base and is not checked.',
  rows: { a: 'a', dp: 'dp', truth: 'true' },
  /** @param {number} n */
  tableAria: (n) => `Three rows for ${n} cells: the input, your dp and the true values.`,
  /** @param {string} row @param {number} i @param {string} v @param {string} state */
  cellLabel: (row, i, v, state) =>
    `${row}[${i}]: ${v === '' ? 'empty' : v}${state ? `, ${state}` : ''}`,
  cellStates: {
    current: 'filled now',
    read: 'read',
    right: 'matches the truth',
    wrong: 'differs from the truth',
  },
  legend: {
    current: 'Filled now',
    read: 'Read by this cell',
    right: 'Matches the truth',
    wrong: 'Differs from the truth',
  },
  markers: { current: '●', read: '○', right: '✓', wrong: '✕' },
  optionsTitle: 'What each term offers',
  optionsEmpty: 'Step to a cell to see its terms.',
  offersNothing: 'nothing',
  chosen: '✓ chosen',
  stats: {
    wrong: 'Wrong cells',
    reads: 'Cells read',
    got: 'Your answer',
    expected: 'Right answer',
  },
  pending: '…',
  pass: '✓',
  fail: '✕',
  jumpWrong: 'Jump to the first wrong cell',
  noWrong: 'Every cell keeps your state’s promise on this input.',
  samplesTitle: 'Test on samples',
  /** @param {number} passed @param {number} total */
  samplesSummary: (passed, total) =>
    passed === total
      ? `All ${total} samples pass: the cells keep the promise and the answer is right.`
      : `${passed} of ${total} samples pass.`,
  /** @param {number} k */
  sampleName: (k) => `Sample ${k}`,
  yourInput: 'Your input',
  expectedLabel: 'expected',
  gotLabel: 'got',
  /** @param {number} n */
  wrongCells: (n) => (n === 0 ? 'all cells right' : `${n} wrong ${n === 1 ? 'cell' : 'cells'}`),
  /**
   * @param {string} name @param {string} input @param {number} expected @param {number|null} got
   * @param {number} wrong @param {boolean} ok
   */
  sampleAria: (name, input, expected, got, wrong, ok) =>
    `${name}, ${input}: expected ${num(expected)}, got ${num(got)}, ${wrong} wrong cells, ${ok ? 'passes' : 'fails'}. Load it.`,
  /** @param {Problem} p @param {number[]} a */
  inputText: (p, a) => (p === 'decode' ? a.join('') : a.map(num).join(', ')),
  num,
  /** @param {DesignFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `Run your design on ${f.a.length} ${f.a.length === 1 ? 'value' : 'values'}.`;
      case 'base':
        return `Base: dp[0] = ${f.dp[0]}.`;
      case 'cell': {
        const parts = f.options.map(
          (o) => `${TERM_LABELS[o.term]} → ${o.value === null ? 'nothing' : num(o.value)}`,
        );
        const head = parts.length ? `${parts.join('; ')}. ` : 'No terms chosen. ';
        const cell = `dp[${f.i}] = ${num(f.value)}`;
        return f.right[f.i]
          ? `${head}${cell}. ✓ It matches the meaning you chose.`
          : `${head}${cell}. ✕ Your meaning says it should be ${num(f.truth[f.i])}.`;
      }
      case 'answer':
        return `Your answer is ${num(f.got)}; the right answer is ${num(f.expected)}.`;
      case 'done':
        if (f.answerOk && f.wrong === 0)
          return 'Solved on this input: every cell keeps its promise and the answer is right.';
        if (!f.answerOk && f.wrong === 0)
          return 'Every cell keeps its promise, but the answer is wrong. Either the state does not answer the question, or the answer is read from the wrong place.';
        if (f.answerOk)
          return `The answer is right, but ${f.wrong} ${f.wrong === 1 ? 'cell does' : 'cells do'} not mean what you declared. Fix the meaning, or the next input may break it.`;
        return `The answer is wrong and ${f.wrong} ${f.wrong === 1 ? 'cell breaks' : 'cells break'} the promise. Jump to the first wrong cell.`;
    }
  },
  takeaways: [
    'Define the state first, as one precise sentence about dp[i]. If you cannot say what a cell means, you cannot tell whether a recurrence is right.',
    'Find the transition by asking what the last step was. A run ending at i either extends the run ending at i − 1 or starts afresh. A climb arrived from 1 or 2 steps below. A reading ends with a one-digit or two-digit letter.',
    'A state must carry enough. “Best run anywhere in the first i values” cannot be extended, since the best run may have ended long ago. “Ends exactly at i” can, and the answer is then the largest cell.',
    'Base cases are part of the design: in decode ways, dp[0] = 1 counts the one way to read nothing. With 0 there, every cell is 0.',
    'Test small inputs against brute force, cell by cell. Try the climb with the terms set to dp[i−1] + a[i] alone and the meaning “every step”: every cell is right, and the answer is still wrong.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    ['Any design here', 'O(n)', 'n cells, each reading a fixed number of smaller cells.'],
    [
      'Memory',
      'O(1) to O(n)',
      'These recurrences read at most two earlier cells, so two variables can replace the table if no cell is revisited.',
    ],
    ['Brute force, maximum subarray', 'O(n²)', 'Every run, with a running sum.'],
    [
      'Brute force, climb and decode',
      'O(φⁿ)',
      'Choosing 1 or 2 at each point branches like Fibonacci, with φ ≈ 1.618.',
    ],
  ],
  practiceTitle: 'Practice problems',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'In how many ways can 226 be read as letters? Build the working design for Decode ways, or count by hand.',
      answer: 3,
      unit: 'ways',
      hints: [
        'Use dp[0] = 1, the terms with conditions, and the sum.',
        'BBF, VF and BZ are the readings to find.',
      ],
      solution: '2 2 6 → BBF, 22 6 → VF, 2 26 → BZ. So dp = 1, 1, 2, 3 and the answer is 3.',
    },
    {
      type: 'number',
      prompt:
        'With dp[i] = the best sum of a run ending exactly at i, what is dp[7] for −2, 1, −3, 4, −1, 2, 1, −5, 4?',
      answer: 6,
      unit: 'sum',
      hints: ['Load Sample 1 of Maximum subarray with terms a[i] and dp[i−1] + a[i], and max.'],
      solution:
        'The cells are −2, 1, −2, 4, 3, 5, 6, 1, 5, so dp[7] = 6: the run 4, −1, 2, 1 ends at position 7.',
    },
    {
      type: 'number',
      prompt: 'What is the cheapest climb for step costs 1, 100, 1, 1, 1, 100, 1, 1, 100, 1?',
      answer: 6,
      unit: 'cost',
      hints: ['Load Sample 2 of Cheapest climb with both dp + a[i] terms and min.'],
      solution:
        'Stand on steps 1, 3, 5, 7, 8 and 10: six steps that cost 1 each, jumping over every 100. So dp[10] = 6.',
    },
    {
      type: 'number',
      prompt: 'In how many ways can 100 be read as letters?',
      answer: 0,
      unit: 'ways',
      hints: ['Step through it: what can the last 0 attach to?'],
      solution:
        '10 is J, but the last 0 cannot stand alone and 00 is not a letter. So dp = 1, 1, 1, 0 and the answer is 0.',
    },
    {
      type: 'choice',
      prompt: 'In Decode ways, what happens when dp[0] = 0 instead of 1?',
      options: [
        'Nothing changes, since dp[0] is not checked.',
        'Every cell becomes 0, because all counts grow out of dp[0].',
        'Only the last cell is wrong.',
        'The answer is one too small.',
      ],
      answer: 1,
      hints: ['Set dp[0] to 0 with the working terms and watch the row.'],
      solution:
        'Counting sums build on the base. dp[0] = 1 stands for the one empty reading; with 0, no reading can begin, so every cell stays 0.',
    },
    {
      type: 'multi',
      prompt: 'Which choices make Maximum subarray pass every sample? Pick all that are needed.',
      options: [
        'dp[i] means the best sum of a run ending exactly at i',
        'The terms a[i] and dp[i−1] + a[i], with max',
        'The term dp[i−1], so a cell can skip a bad value',
        'The answer is the largest dp[i]',
      ],
      answers: [0, 1, 3],
      hints: ['A run must stay connected, so can a cell skip a value?'],
      solution:
        'A run ending at i extends the one ending at i − 1 or starts at i, and the best run may end anywhere, so the answer is the largest cell. Copying dp[i−1] would join runs that are not neighbours.',
    },
    {
      type: 'choice',
      prompt:
        'Why can no choice of terms make “the best sum of a run anywhere in the first i values” work?',
      options: [
        'Because max is the wrong way to combine.',
        'Because the cell does not say where its best run ends, so adding a[i] may join values that are not neighbours.',
        'Because dp[0] must be 1.',
        'Because that meaning has no brute-force value.',
      ],
      answer: 1,
      hints: ['Try it on Sample 1 and read the first ✕.'],
      solution:
        'The meaning itself is true and useful, but it does not carry enough to extend. It needs a second value, the best run ending at i. That second value is the state that works.',
    },
    {
      type: 'order',
      prompt: 'Put the steps of designing a DP in order.',
      items: [
        'Write the recurrence from the last step taken',
        'Check small inputs against brute force',
        'Say in one sentence what dp[i] means',
        'Set the base cases and where the answer is read',
      ],
      answer: [2, 0, 3, 1],
      hints: ['You cannot write a recurrence for a cell whose meaning is not yet decided.'],
      solution:
        'State first, then the transition, then base cases and the answer, then test. A failed test usually sends you back to the state.',
    },
  ],
  nextTeaser:
    'Next up: Backtracking and the search tree, for problems that must try choices one by one when no table of smaller answers will do.',
};
