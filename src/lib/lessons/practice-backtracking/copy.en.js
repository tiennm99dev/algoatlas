/** @typedef {import('$lib/algo-engine/practice-backtracking.js').WordFrame} WordFrame */
/** @typedef {import('$lib/algo-engine/practice-backtracking.js').SumFrame} SumFrame */
/** @typedef {import('$lib/algo-engine/practice-backtracking.js').SumNode} SumNode */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'practice-backtracking',
  topic: 'backtracking',
  level: 'Intermediate',
  title: 'Practice: backtracking problems',
  intro:
    'Two classic problems use the same three moves in different ways. Word search walks a letter grid, marking each cell it steps on and clearing the mark when it retreats. Combination sum picks numbers that may repeat, and prunes as soon as a number is too big. Work out the state and the undo for each one, then check yourself on the widget.',
  summary:
    'Run a word search that explores and retreats letter by letter, and a combination sum that prunes numbers too big to fit.',
  instruction:
    'In Word search, type a word and step: the path grows along matching letters and retreats at dead ends. Click or press Enter on a cell to jump to the first time it was checked. In Combination sum, type your own numbers and total, and watch the tree grow and the results fill in. Use the widget to answer the questions below.',
  modeLabel: 'Problem',
  modes: { word: 'Word search', sum: 'Combination sum' },
  gridLabel: 'Grid rows',
  wordLabel: 'Word',
  candidatesLabel: 'Numbers',
  totalLabel: 'Total',
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  wordPresets: {
    found: 'ABCCED, found',
    absent: 'ABCB, absent',
    retreat: 'Many dead ends',
    trap: 'Too many paths',
  },
  /** @type {Record<string, string>} */
  sumPresets: {
    seven: '2 3 6 7, total 7',
    eight: '2 3 5, total 8',
    none: 'No combination',
    ten: '1 2, total 10',
  },
  /** @param {number} max */
  gridError: (max) =>
    `Enter 1 to ${max} rows of equal length, up to ${max} letters each, separated by spaces.`,
  /** @param {number} max */
  wordError: (max) => `The word must be 1 to ${max} letters from A to Z.`,
  /** @param {number} maxN @param {number} maxV */
  candidatesError: (maxN, maxV) => `Enter 1 to ${maxN} different whole numbers from 1 to ${maxV}.`,
  /** @param {number} max */
  totalError: (max) => `The total must be a whole number from 1 to ${max}.`,
  gridTitle: 'Letter grid',
  /** @param {number} rows @param {number} cols */
  gridAria: (rows, cols) => `Letter grid, ${rows} rows by ${cols} columns.`,
  /** @param {number} r @param {number} c @param {string} letter @param {string} state */
  gridCell: (r, c, letter, state) => `Row ${r}, column ${c}: ${letter}${state ? `, ${state}` : ''}`,
  neverChecked: 'The search never reached that cell, so there is no step to jump to.',
  gridNote: 'A path moves up, down, left or right, and uses each cell at most once.',
  cellStates: {
    now: 'checked now',
    path: 'on the path',
    wrong: 'wrong letter',
    used: 'already on the path',
    back: 'just left',
    found: 'part of the word',
  },
  marks: { wrong: '×', used: '↺', back: '←' },
  wordLegend: {
    now: 'Checked now',
    path: 'On the path, numbered in order',
    wrong: '× wrong letter, ↺ already used',
    back: '← just retreated from',
    found: 'The word found',
  },
  wordStripTitle: 'Word',
  wordStripAria: 'The word, with the letters matched so far marked.',
  /** @param {number} i @param {string} letter @param {boolean} on */
  wordCell: (i, letter, on) => `Letter ${i}: ${letter}${on ? ', matched' : ''}`,
  wordPointer: 'k',
  matchMark: '✓',
  stats: {
    checked: 'Cells checked',
    retreats: 'Retreats',
    matched: 'Letters matched',
    result: 'Result',
    calls: 'Calls',
    stops: 'Early stops',
    remaining: 'Still to reach',
    solutions: 'Combinations',
  },
  wordResults: { searching: 'Searching', found: 'Found', absent: 'Not found', cutoff: 'Too long' },
  sumTitle: 'Numbers, sorted',
  sumAria: 'The numbers, sorted. Each may be used any number of times.',
  /** @param {number} i @param {number} v @param {number} times */
  sumCell: (i, v, times) => `Number ${v} at index ${i}, used ${plural(times, 'time', 'times')}`,
  treeTitle: 'Recursion tree',
  treeNote: 'A circle shows what is still to reach. The edge says which number was picked.',
  treeAria: 'Recursion tree of combination sum, built as it runs.',
  /** @param {SumNode} n */
  nodeLabel: (n) =>
    `Call with ${n.remaining} still to reach${n.hit ? ', an exact hit' : ''}${n.open ? ', still running' : ''}.`,
  hitMark: '★',
  sumLegend: {
    active: 'Acted on now',
    open: 'The current path',
    finished: 'Returned',
    hit: 'Reached the total exactly',
  },
  pathTitle: 'Picked now',
  pathEmpty: 'Nothing picked.',
  solutionsTitle: 'Combinations found',
  solutionsEmpty: 'None yet.',
  /** @param {number[]} s */
  solution: (s) => s.join(' + '),
  /** @param {WordFrame} f */
  describeWord(f) {
    const want = f.word[f.k];
    const cell = `(${f.r}, ${f.c})`;
    switch (f.kind) {
      case 'start':
        return `Look for ${f.word} in the grid. Try each cell in turn as the first letter.`;
      case 'match':
        return `Cell ${cell} holds ${want}, letter ${f.k + 1} of ${f.word.length}. Mark it as used and try its neighbours for ${f.word[f.k + 1]}.`;
      case 'wrong':
        return `Cell ${cell} holds ${f.grid[f.r][f.c]}, but the word needs ${want} here. Go back.`;
      case 'used':
        return `Cell ${cell} is already on the path, and a cell can be used only once. Go back.`;
      case 'retreat':
        return `No neighbour of ${cell} continues the word. Clear its mark, so another path may use it, and retreat.`;
      case 'found':
        return `Cell ${cell} holds the last letter, ${want}. The whole word is on the path.`;
      case 'done':
        if (f.found)
          return `${f.word} is in the grid, after checking ${plural(f.checked, 'cell', 'cells')}.`;
        return f.cutoff
          ? `Stopped here: this search has too many paths to show. It had checked ${plural(f.checked, 'cell', 'cells')} with no answer yet.`
          : `${f.word} is not in the grid. Every path was tried: ${plural(f.checked, 'cell', 'cells')} checked, ${plural(f.retreats, 'retreat', 'retreats')}.`;
    }
  },
  /** @param {SumFrame} f */
  describeSum(f) {
    const v = f.at >= 0 ? f.candidates[f.at] : 0;
    switch (f.kind) {
      case 'start':
        return `Find every combination of these numbers that adds up to ${f.total}. A number may be used more than once.`;
      case 'pick':
        return `Pick ${v}, leaving ${f.remaining} to reach. The next call may pick ${v} again, but nothing before it.`;
      case 'hit':
        return `Exactly ${f.total}. Record ${f.path.join(' + ')} and go back.`;
      case 'stop':
        return `${v} is more than the ${f.remaining} left. The numbers are sorted, so every later one is too. Stop this loop.`;
      case 'unpick':
        return `Unpick ${v}, back to ${f.remaining} left, and try the next number.`;
      case 'done':
        return f.cutoff
          ? `Stopped here: this input has too many combinations to show. ${plural(f.solutions.length, 'combination', 'combinations')} found so far.`
          : `Done: ${plural(f.solutions.length, 'combination', 'combinations')} from ${plural(f.calls, 'call', 'calls')}.`;
    }
  },
  takeaways: [
    'The state is what a call must know. Word search needs the cell, the letter index and the used marks. Combination sum needs the start index, the amount left and the path.',
    'Every mark needs its undo. A word-search cell must be unmarked on the way back, or a later path that really needs it will fail for no visible reason.',
    'Avoiding duplicates comes from the start index. Passing i rather than i + 1 is what lets a number repeat, and never going back to earlier numbers keeps 2 + 2 + 3 from also appearing as 2 + 3 + 2.',
    'Cheap checks up front pay for themselves. Sorting lets one comparison stop a whole loop, and in word search, counting letters first would reject a word the grid cannot spell without taking a single step.',
    'Load Too many paths and step to the end: the search gives up with no answer, yet the grid has no C at all. Then change the word to AAAAAAAA and see how quickly a real path turns up.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    [
      'Word search, time',
      'O(m · n · 3ᴸ)',
      'm · n starts; after the first step, at most 3 new ways per letter of a word of length L.',
    ],
    [
      'Word search, memory',
      'O(L)',
      'The call stack and path hold at most L cells, plus the marks.',
    ],
    [
      'Combination sum, time',
      'exponential in T / min',
      'The depth reaches total ÷ smallest number, with a choice at each level.',
    ],
    [
      'Combination sum, memory',
      'O(T / min)',
      'The deepest path is the total divided by the smallest number.',
    ],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Grid ABCE, SFCS, ADEE with the word ABCB. How many times does the search retreat? Neighbours are tried right, down, left, up.',
      answer: 4,
      unit: 'retreats',
      hints: ['Load ABCB, absent and read Retreats at the last step.'],
      solution:
        'Four. The path A, B, C reaches the C at (0, 2), where no neighbour is a free B, so it retreats. No other neighbour continues the word, so B and then the first A retreat too. The other A, at (2, 0), matches the first letter but has no B beside it, so it retreats as well.',
    },
    {
      type: 'number',
      prompt: 'The same grid with the word ABCCED. How many cells are checked in all?',
      answer: 9,
      unit: 'cells',
      hints: ['Load ABCCED, found and read Cells checked.'],
      solution:
        'Nine: the 6 cells of the word, and 3 wrong tries along the way. There are no retreats, since the right-first order happens to walk straight to the answer.',
    },
    {
      type: 'multi',
      prompt: 'Grid ABCE, SFCS, ADEE. Which of these words can be found? Pick all that apply.',
      options: ['SEE', 'ABCB', 'ABFS', 'ASADF'],
      answers: [0, 2, 3],
      hints: ['Type each word and step to the end.', 'A cell cannot be used twice.'],
      solution:
        'SEE and ABFS are there, and ASADF goes down the first column, right, then up. ABCB would need the B at (0, 1) twice.',
    },
    {
      type: 'number',
      prompt: 'Numbers 2, 3, 6, 7 and total 7. How many combinations are there?',
      answer: 2,
      unit: 'combinations',
      hints: ['Load the example and step to the end.'],
      solution: 'Two: 2 + 2 + 3 and 7. The search makes 10 calls to find them.',
    },
    {
      type: 'number',
      prompt: 'Numbers 2, 3, 5 and total 8. How many combinations are there?',
      answer: 3,
      unit: 'combinations',
      hints: ['Load the example and read the list of results.'],
      solution: 'Three: 2 + 2 + 2 + 2, 2 + 3 + 3 and 3 + 5.',
    },
    {
      type: 'number',
      prompt: 'Numbers 1, 2 and total 10. How many combinations are there?',
      answer: 6,
      unit: 'combinations',
      hints: ['Think about how many 2s are used: from 0 up to 5.'],
      solution: 'The number of 2s can be 0, 1, 2, 3, 4 or 5, and 1s fill the rest. That is 6.',
    },
    {
      type: 'choice',
      prompt: 'What goes wrong in word search if a cell is never unmarked when the path retreats?',
      options: [
        'The search runs forever.',
        'A later path that needs that cell is refused, so a real word can be missed.',
        'A cell can be used twice in one path.',
        'Nothing, because each cell is only visited once anyway.',
      ],
      answer: 1,
      hints: ['Load Many dead ends and think about the cells of a failed start.'],
      solution:
        'The mark means “on the current path”. Left in place, it blocks paths that are perfectly valid, and the search reports a word as absent when it is there.',
    },
    {
      type: 'choice',
      prompt: 'In combination sum, what changes if the call passes i + 1 instead of i?',
      options: [
        'Each number can be used at most once.',
        'The same combinations come out, only faster.',
        'Combinations appear in several orders.',
        'The search no longer needs sorted numbers.',
      ],
      answer: 0,
      hints: ['What may the next call pick?'],
      solution: 'The next call starts after this number, so it can never pick the number again.',
    },
    {
      type: 'order',
      prompt: 'Order the moves of one word-search step on a cell that holds the right letter.',
      items: ['Try each neighbour', 'Unmark the cell', 'Mark the cell as used'],
      answer: [2, 0, 1],
      hints: ['Choose, explore, unchoose.'],
      solution: 'Mark it (choose), try the neighbours (explore), unmark it (unchoose).',
    },
  ],
  nextTeaser:
    'Next up: Why balance matters, which opens balanced search trees by showing what sorted input does to a plain BST.',
};
