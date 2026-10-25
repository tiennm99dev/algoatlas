/** @typedef {import('$lib/algo-engine/algorithms-ram-model.js').RamFrame} RamFrame */
/** @typedef {import('$lib/algo-engine/algorithms-ram-model.js').RamProgram} RamProgram */

export const en = {
  slug: 'algorithms-ram-model',
  topic: 'complexity',
  level: 'Beginner',
  title: 'Algorithms and the RAM model',
  intro:
    'An algorithm is a finite list of exact steps that turns any valid input into the right output. To compare algorithms without a stopwatch, we run them on an imaginary machine, the word-RAM, where every primitive operation costs one step, and count the steps.',
  summary:
    'Count the primitive steps of a loop on a toy word-RAM machine, and see that a correct program and a fast program are two different goals.',
  instruction:
    'Pick a program and a value of n, then step through the run. Watch the memory cells being read (R) and written (W), and the step tally grow with each line.',
  nLabel: 'n',
  programLegend: 'Program',
  programs: /** @type {Record<RamProgram, string>} */ ({
    loop: 'Loop',
    formula: 'Formula',
    buggy: 'Buggy loop',
  }),
  nError: 'n must be a whole number from 0 to 30.',
  memoryTitle: 'Memory (one word per variable)',
  unset: '—',
  /** @param {string} name @param {string} value @param {string} state */
  cellLabel: (name, value, state) => `${name} = ${value}${state ? `, ${state}` : ''}`,
  states: { read: 'read', write: 'written' },
  markers: { read: 'R', write: 'W' },
  legend: { read: 'Read this step', write: 'Written this step' },
  stats: {
    assign: 'Assignments',
    compare: 'Comparisons',
    arith: 'Arithmetic',
    ret: 'Returns',
    total: 'Total primitive steps',
  },
  /** @param {number} d */
  thisStep: (d) => `This step: +${d}`,
  formulaTitle: 'Step count of this program',
  /** @type {Record<RamProgram, string>} */
  formulas: { loop: '5n + 4', formula: '5 (no n at all)', buggy: '5n − 1 (n ≥ 1)' },
  /** @param {number} n @param {number} ops */
  atN: (n, ops) => `n = ${n}: ${ops} steps`,
  resultTitle: 'Answer check',
  /** @param {number} expected */
  expectedLine: (expected) => `Right answer 1 + … + n = ${expected}`,
  /** @param {number} got @param {boolean} ok */
  resultLine: (got, ok) => (ok ? `Returned ${got}: correct ✓` : `Returned ${got}: wrong ✗`),
  pending: 'Not returned yet.',
  practiceTitle: 'Check yourself',
  /** @param {RamFrame} f */
  describe(f) {
    const v = f.vars;
    switch (f.kind) {
      case 'start':
        return f.program === 'formula'
          ? `Call sumTo(${f.n}). The formula version has no loop.`
          : `Call sumTo(${f.n}). Memory holds n = ${f.n}; s and i are not set yet.`;
      case 'init-s':
        return 'Set s = 0: one assignment.';
      case 'init-i':
        return 'Set i = 1: one assignment.';
      case 'test': {
        const op = f.program === 'loop' ? '≤' : '<';
        return f.test
          ? `Test ${v.i} ${op} ${f.n}: true, so run the body. One comparison.`
          : `Test ${v.i} ${op} ${f.n}: false, so leave the loop. One comparison.`;
      }
      case 'add':
        return `s = s + i makes s = ${v.s}: one addition and one assignment.`;
      case 'step':
        return `i = i + 1 makes i = ${v.i}: one addition and one assignment.`;
      case 'compute':
        return `s = ${f.n} × ${f.n + 1} / 2 = ${v.s}: three arithmetic operations and one assignment, whatever n is.`;
      case 'return':
        return `Return s = ${v.s}: one step.`;
      case 'done':
        return `Done after ${f.total} primitive steps.`;
    }
  },
  takeaways: [
    'An algorithm is a finite sequence of exact, unambiguous steps that ends with the right output for every valid input.',
    'The word-RAM model charges one step for each primitive operation on a word of at least log₂ n bits: an assignment, comparison, arithmetic operation, memory read or jump. This toy machine folds each variable read into the operation that uses it. Counting steps measures an algorithm independently of the computer.',
    'The loop does 5n + 4 steps, so its cost grows in proportion to n; the formula always does 5 steps.',
    'Correctness comes first: the buggy loop is even a little faster, but it returns the wrong answer, so its speed is worthless.',
    'Try n = 30 with Loop, then Formula: 154 steps against 5, and the gap widens with every extra n.',
  ],
  complexityHead: ['Program', 'Cost', 'Why'],
  complexity: [
    ['Loop, time', 'O(n)', 'The loop body runs n times; each pass costs 5 steps.'],
    ['Formula, time', 'O(1)', 'Five steps, whatever n is.'],
    ['Both, memory', 'O(1)', 'A fixed number of words: n, s and i.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'How many primitive steps does the Loop program take for n = 7? Count every assignment, comparison, arithmetic operation and the return.',
      answer: 39,
      unit: 'steps',
      hints: [
        'Two assignments before the loop, one return after it.',
        'The test runs n + 1 = 8 times; each of the 7 passes does 2 additions and 2 assignments.',
      ],
      solution: '2 + 8 tests + 7 × 4 + 1 = 39 steps, matching 5n + 4 = 5 × 7 + 4.',
    },
    {
      type: 'multi',
      prompt: 'In the word-RAM model, which of these cost one step each?',
      options: [
        'Adding two words',
        'Comparing two words',
        'Reading A[i] from memory',
        'Sorting an array of n words',
      ],
      answers: [0, 1, 2],
      hints: ['One step means one primitive machine operation on a fixed number of words.'],
      solution:
        'Adding, comparing and reading a word are primitive. Sorting n words is a whole algorithm made of many steps, so it is not one step.',
    },
    {
      type: 'choice',
      prompt:
        'For n = 10 the buggy loop takes 49 steps and the correct loop 54. Which program should you use?',
      options: [
        'The buggy loop, because it is faster',
        'The correct loop, because a fast wrong answer is useless',
        'Either, because both are O(n)',
      ],
      answer: 1,
      hints: ['Compare what each program returns for n = 10.'],
      solution:
        'The buggy loop returns 45 instead of 55. Efficiency only matters among correct algorithms, so use the correct loop (or, better, the formula).',
    },
  ],
  nextTeaser:
    'Next up: Big-O, Omega and Theta, which keep only how the step count grows and drop the constants.',
};
