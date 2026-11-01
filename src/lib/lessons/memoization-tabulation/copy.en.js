/** @typedef {import('$lib/algo-engine/memoization-tabulation.js').FibFrame} FibFrame */
/** @typedef {import('$lib/algo-engine/memoization-tabulation.js').FibMode} FibMode */

/** @param {number} k */
const fib = (k) => `fib(${k})`;
/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'memoization-tabulation',
  topic: 'dynamic-programming',
  level: 'Beginner',
  title: 'Memoization and tabulation',
  intro:
    'Plain recursion for Fibonacci works out fib(2) again and again, because the subproblems overlap: fib(5) and fib(4) both need fib(3). Dynamic programming stores each subproblem’s answer once and reuses it. Memoization does this top-down, keeping the recursion and caching its results; tabulation does it bottom-up, filling a table from the base cases with no recursion at all.',
  summary:
    'Watch the exponential Fibonacci call tree collapse into a chain once memoization is on, then fill the same table bottom-up with tabulation.',
  instruction:
    'Start with plain recursion and step to the end: count how often each fib(k) was worked out in the bottom row. Then switch to memoization and watch repeated calls turn into one-step lookups, and to tabulation, which fills the table left to right without a single call.',
  modeLabel: 'Method',
  modes: { plain: 'Plain recursion', memo: 'Memoization', table: 'Tabulation' },
  nLabel: 'n',
  /** @param {number} max */
  nError: (max) => `n must be a whole number from 0 to ${max}.`,
  stats: {
    calls: 'Calls made',
    additions: 'Additions',
    hits: 'Table lookups',
    result: 'Result',
  },
  resultPending: '…',
  treeTitle: 'Call tree',
  treeEmpty: 'No calls yet.',
  tableTreeText: 'Tabulation makes no calls: a loop fills the table instead.',
  /** @param {number} n @param {number} calls */
  treeAria: (n, calls) => `Call tree of ${fib(n)}: ${plural(calls, 'call', 'calls')} so far.`,
  /**
   * @param {number} k
   * @param {number|null} result
   * @param {'active'|'waiting'|'returned'|'cached'} status
   */
  nodeAria: (k, result, status) =>
    `${fib(k)}, ${
      {
        active: 'running',
        waiting: 'waiting for a call it made',
        returned: `worked out, returned ${result}`,
        cached: `looked up in the table, returned ${result}`,
      }[status]
    }`,
  tableTitle: 'Table',
  /** @param {FibMode} mode */
  rowStored: (mode) => ({ plain: '—', memo: 'm', table: 'dp' })[mode],
  rowComputed: '×',
  /** @param {FibMode} mode */
  tableNote: (mode) =>
    ({
      plain:
        'Plain recursion keeps no table: the top row stays empty. The bottom row counts how often each fib(k) was worked out.',
      memo: 'Top row (m): memo[k], filled the first time fib(k) returns. Bottom row (×): how often fib(k) was worked out.',
      table:
        'Top row (dp): dp[k], filled left to right. Bottom row (×): how often fib(k) was worked out.',
    })[mode],
  tableAria: 'Table of stored Fibonacci values and how often each was worked out.',
  /**
   * @param {FibMode} mode
   * @param {number} k
   * @param {number|null} value
   * @param {string} state
   */
  storedCell: (mode, k, value, state) =>
    `${mode === 'table' ? 'dp' : 'memo'}[${k}]: ${value === null ? 'empty' : value}${state ? `, ${state}` : ''}`,
  /** @param {number} k @param {number} times */
  computedCell: (k, times) =>
    `${fib(k)} worked out ${times === 1 ? 'once' : `${times} times`}${times > 1 ? ', repeated work' : ''}`,
  cellStates: { write: 'just written', read: 'read now', answer: 'the answer' },
  legend: {
    active: 'Running now',
    waiting: 'Waiting for a call it made',
    returned: 'Worked out; the note shows its value',
    cached: 'Looked up in the table: no further calls',
  },
  markers: { active: '▶', waiting: '…', returned: '✓', cached: '↺' },
  cellLegend: {
    write: 'Written now',
    read: 'Read now',
    answer: 'The answer, fib(n)',
    repeat: 'Worked out more than once',
  },
  cellMarkers: { write: '●', read: '○', answer: '★', repeat: '!' },
  /** @param {FibFrame} f */
  describe(f) {
    const memo = f.mode === 'memo';
    switch (f.kind) {
      case 'start':
        return {
          plain: `Ready to call ${fib(f.n)}. Plain recursion stores nothing, so it will work out the same values again and again.`,
          memo: `Ready to call ${fib(f.n)} with an empty memo table. Each answer is stored the first time it is worked out.`,
          table: `Ready to compute ${fib(f.n)} bottom-up: fill dp[0], dp[1], … in order, so every cell a step reads is already filled.`,
        }[f.mode];
      case 'call':
        return memo
          ? `Call ${fib(f.k)}. First check the table: is memo[${f.k}] set?`
          : `Call ${fib(f.k)}. Is ${f.k} ≤ 1?`;
      case 'hit':
        return `memo[${f.k}] is already ${f.value}: ${fib(f.k)} returns it at once, with no further calls. Plain recursion would redo this whole subtree.`;
      case 'base':
        if (f.mode === 'table')
          return f.n >= 1
            ? 'Base cases: dp[0] = 0 and dp[1] = 1.'
            : 'Base case: dp[0] = 0. The loop has nothing to do.';
        return memo
          ? `memo[${f.k}] is empty and ${f.k} ≤ 1, a base case: store memo[${f.k}] = ${f.k} and return it.`
          : `${f.k} ≤ 1, a base case: ${fib(f.k)} returns ${f.k}.`;
      case 'return':
        return memo
          ? `${fib(f.k)} = ${fib(f.k - 1)} + ${fib(f.k - 2)} = ${f.a} + ${f.b} = ${f.value}. Store it in memo[${f.k}] so every later call can look it up.`
          : `${fib(f.k)} = ${fib(f.k - 1)} + ${fib(f.k - 2)} = ${f.a} + ${f.b} = ${f.value}. Nothing is stored, so the next call of ${fib(f.k)} starts over.`;
      case 'fill':
        return `dp[${f.k}] = dp[${f.k - 1}] + dp[${f.k - 2}] = ${f.a} + ${f.b} = ${f.value}. Both cells were filled earlier in the loop.`;
      case 'done': {
        const head = `${fib(f.n)} = ${f.result}`;
        if (f.mode === 'table')
          return `${head} after ${plural(f.additions, 'addition', 'additions')} and no calls at all.`;
        if (memo)
          return `${head} after ${plural(f.callCount, 'call', 'calls')}: each value was worked out once, and ${plural(f.hits, 'call was', 'calls were')} answered from the table.`;
        const most = Math.max(...f.computed);
        const k = f.computed.indexOf(most);
        return `${head} after ${plural(f.callCount, 'call', 'calls')} and ${plural(f.additions, 'addition', 'additions')}. ${fib(k)} alone was worked out ${most === 1 ? 'once' : `${most} times`}.`;
      }
    }
  },
  takeaways: [
    'A problem has overlapping subproblems when the same smaller instance is needed again and again: fib(n − 1) and fib(n − 2) both need fib(n − 3).',
    'Plain recursion repeats that work, so fib(n) makes 2·fib(n + 1) − 1 calls: exponential time.',
    'Memoization (top-down) keeps the recursion and stores each answer the first time; a repeated call becomes a lookup, so fib(n) makes only 2n − 1 calls.',
    'Tabulation (bottom-up) fills the table in an order where every cell it reads is already filled: no recursion, no call stack, n − 1 additions.',
    'Set n = 8 and compare “Calls made” across the three methods: 67, 15 and 0, all for the same answer 21.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    [
      'Plain recursion, time',
      'O(φⁿ) ≈ O(1.618ⁿ)',
      '2·fib(n + 1) − 1 calls: every subproblem is solved again each time it is needed.',
    ],
    [
      'Memoization, time',
      'O(n)',
      'Each of the n + 1 subproblems is worked out once; the other n − 2 calls are O(1) lookups.',
    ],
    [
      'Memoization, memory',
      'O(n)',
      'The memo table has n + 1 cells and the call stack is up to n frames deep.',
    ],
    ['Tabulation, time', 'O(n)', 'One loop pass with one addition per cell.'],
    [
      'Tabulation, memory',
      'O(n), or O(1)',
      'The full table has n + 1 cells; keeping only the last two values is enough for fib.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'With plain recursion, how many calls does fib(6) make in total?',
      answer: 25,
      unit: 'calls',
      hints: [
        'Pick plain recursion, set n = 6 and read “Calls made” at the last step.',
        'calls(n) = 1 + calls(n − 1) + calls(n − 2), with calls(0) = calls(1) = 1.',
      ],
      solution:
        'calls(2) = 3, calls(3) = 5, calls(4) = 9, calls(5) = 15, calls(6) = 1 + 15 + 9 = 25, which is 2·fib(7) − 1 = 2·13 − 1.',
    },
    {
      type: 'number',
      prompt: 'With plain recursion, how many times is fib(2) worked out while computing fib(6)?',
      answer: 5,
      unit: 'times',
      hints: ['Run plain recursion with n = 6 and read the bottom row of the table under 2.'],
      solution:
        'fib(k) is worked out fib(n − k + 1) times, so fib(2) is worked out fib(5) = 5 times. Memoization works it out once.',
    },
    {
      type: 'number',
      prompt: 'With memoization, how many calls does fib(6) make, counting the lookups?',
      answer: 11,
      unit: 'calls',
      hints: [
        'Switch to memoization with n = 6 and read “Calls made”.',
        'The left spine fib(6) → fib(5) → … → fib(0) has 7 calls; each fib(k) for k ≥ 3 also makes one call that is a lookup.',
      ],
      solution:
        'The chain fib(6), fib(5), …, fib(0) is 7 calls, and fib(6), fib(5), fib(4), fib(3) each make one more call that finds its answer in memo: 7 + 4 = 11 = 2·6 − 1.',
    },
    {
      type: 'number',
      prompt: 'With tabulation, how many additions does fib(8) need?',
      answer: 7,
      unit: 'additions',
      hints: ['The loop runs for i = 2 to n, with one addition per cell.'],
      solution: 'dp[2] to dp[8] each need one addition: 8 − 1 = 7 additions.',
    },
    {
      type: 'choice',
      prompt: 'What is the main difference between memoization and tabulation?',
      options: [
        'Memoization gives the exact answer and tabulation an estimate.',
        'Memoization recurses from the original problem and caches answers; tabulation fills the table from the base cases upwards in a fixed order.',
        'Tabulation stores every answer, memoization stores none.',
        'Memoization works only for Fibonacci.',
      ],
      answer: 1,
      hints: ['Compare the call tree of the two methods: one has calls, the other has none.'],
      solution:
        'Both store every subproblem’s answer once and get the same result in O(n) time. Memoization is top-down: it starts at fib(n) and recurses, so it solves only the subproblems it reaches. Tabulation is bottom-up: a loop fills the table in an order where every needed cell is already done.',
    },
  ],
  nextTeaser:
    'Next up: the SRTBOT framework, a six-step recipe for designing any dynamic program, from choosing the subproblems to bounding the running time.',
};
