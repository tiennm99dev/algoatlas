/** @typedef {import('$lib/algo-engine/n-queens-sudoku.js').QueensFrame} QueensFrame */
/** @typedef {import('$lib/algo-engine/n-queens-sudoku.js').SudokuFrame} SudokuFrame */
/** @typedef {import('$lib/algo-engine/n-queens-sudoku.js').SudokuReject} SudokuReject */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** @param {number[]} xs */
const listOf = (xs) =>
  xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

export const en = {
  slug: 'n-queens-sudoku',
  topic: 'backtracking',
  level: 'Intermediate',
  title: 'N-queens and Sudoku',
  intro:
    'N-queens and Sudoku are constraint problems: fill in choices so that no rule is ever broken. Backtracking fits them well, because a rule can be checked the moment a choice is made. A clash in the first few squares throws away every board that would have started that way, without ever building one.',
  summary:
    'Place queens on a chess board and digits in a Sudoku grid, and watch the search back up the moment a constraint fails.',
  instruction:
    'Step through N-queens and watch a queen go back whenever a row has no safe square. Change n, or click or press Enter on a square of the top row to hold the first queen there. In Sudoku, click a cell to change its digit, then step to see the search solve your grid.',
  modeLabel: 'Puzzle',
  modes: { queens: 'N-queens', sudoku: 'Sudoku' },
  nLabel: 'Board size n',
  goalLabel: 'Stop after',
  goals: { first: 'First solution', all: 'All solutions' },
  presetLabel: 'Grid',
  /** @type {Record<string, string>} */
  presets: {
    small: 'Small, 4 × 4',
    empty: 'Empty, 4 × 4',
    nine: 'Full size, 9 × 9',
    clash: 'Clashing clues',
  },
  resetGrid: 'Reset grid',
  /** @param {number} max */
  sizeError: (max) => `The board size must be a whole number from 1 to ${max}.`,
  /** @param {number} max */
  allError: (max) =>
    `All solutions is available up to n = ${max}. Above that the run gets too long to step through.`,
  topRowOnly: 'Only a square in the top row, row 0, can hold the first queen.',
  queensTitle: 'Chess board',
  sudokuTitle: 'Sudoku grid',
  /** @param {number} n */
  queensAria: (n) => `Chess board of ${n} by ${n} squares.`,
  /** @param {number} n */
  sudokuAria: (n) => `Sudoku grid of ${n} by ${n} cells.`,
  queenText: '♛',
  removedText: '♕',
  rejectedText: '×',
  attackedText: '·',
  heldMark: '◆',
  /** @param {number} r @param {number} c @param {string} what */
  squareLabel: (r, c, what) => `Row ${r}, column ${c}: ${what}.`,
  squareStates: {
    queen: 'a queen',
    placed: 'a queen, just placed',
    removed: 'the queen just taken back',
    rejected: 'tested, and attacked',
    attacked: 'attacked by a queen above',
    free: 'free',
  },
  /** @param {number} r @param {number} c @param {number} v @param {boolean} clue */
  cellLabel: (r, c, v, clue) =>
    `Row ${r}, column ${c}: ${v === 0 ? 'empty' : `${v}${clue ? ', given' : ''}`}.`,
  queensNote:
    'The queens fill the board row by row. A dot marks a square attacked by a queen above it, and ◆ marks a top-row square where the first queen is held.',
  sudokuNote:
    'Bold digits are given. The search fills the first empty cell, left to right and top to bottom.',
  legend: {
    placed: 'Placed now',
    kept: 'Placed earlier',
    removed: 'Taken back now',
    rejected: 'Tested and refused',
    solved: 'Solved',
  },
  stats: {
    placed: 'Placed',
    removed: 'Taken back',
    tested: { queens: 'Squares tested', sudoku: 'Digits tested' },
    solutions: 'Solutions',
    result: 'Result',
    naive: 'Boards with no checks',
  },
  results: { searching: 'Searching', solved: 'Solved', none: 'No solution', cutoff: 'Too long' },
  solutionsTitle: 'Solutions: the column for each row',
  solutionsEmpty: 'None yet.',
  /** @param {number[]} s */
  solution: (s) => s.join(' '),
  rejectedTitle: 'Refused just now',
  rejectedEmpty: 'Nothing refused on this step.',
  /** @param {SudokuReject} x */
  rejectChip: (x) => `${x.digit}: in the ${x.why}`,
  /** @param {QueensFrame} f */
  describeQueens(f) {
    const cols = (/** @type {number[]} */ xs) =>
      `${xs.length === 1 ? 'column' : 'columns'} ${listOf(xs)}`;
    switch (f.kind) {
      case 'start':
        return f.fixed === null
          ? `Put ${plural(f.n, 'queen', 'queens')} on this ${f.n} × ${f.n} board so that no two share a row, column or diagonal. Fill one row at a time.`
          : `Put ${plural(f.n, 'queen', 'queens')} on this board, with the first held in column ${f.fixed}. Fill one row at a time.`;
      case 'place':
        return f.rejected.length
          ? `Row ${f.row}: ${cols(f.rejected)} attacked, so skip. Column ${f.col} is safe. Put a queen there.`
          : `Row ${f.row}: column ${f.col} is safe. Put a queen there.`;
      case 'dead':
        return `Row ${f.row}: every column is attacked. This board cannot be finished, so back up to row ${f.row - 1}.`;
      case 'remove':
        return `Nothing worked with the queen at row ${f.row}, column ${f.col}. Take it back and try the next column.`;
      case 'solved':
        return `All ${f.n} rows are filled. Solution ${f.solutions.length}: ${f.solutions[f.solutions.length - 1].join(' ')}.`;
      case 'done':
        if (f.solutions.length === 0)
          return `No solution for n = ${f.n}${f.fixed === null ? '' : ` with the first queen in column ${f.fixed}`}. Every way of placing the queens fails.`;
        return f.goal === 'first'
          ? `First solution found, after testing ${plural(f.tested, 'square', 'squares')} and taking back ${plural(f.removed, 'queen', 'queens')}.`
          : `Found all ${f.solutions.length} ${f.solutions.length === 1 ? 'solution' : 'solutions'}, after testing ${plural(f.tested, 'square', 'squares')}.`;
    }
  },
  /** @param {SudokuFrame} f */
  describeSudoku(f) {
    const refused = f.rejected.length
      ? ` ${listOf(f.rejected.map((x) => x.digit))} already ${f.rejected.length === 1 ? 'clashes' : 'clash'}.`
      : '';
    switch (f.kind) {
      case 'start':
        return `Fill the grid so each row, column and box holds every digit from 1 to ${f.grid.length} once.`;
      case 'place':
        return `Cell (${f.r}, ${f.c}):${refused} ${f.digit} fits, so write it and move on.`;
      case 'dead':
        return `Cell (${f.r}, ${f.c}): no digit that is left fits.${refused} Back up.`;
      case 'remove':
        return `Nothing worked with ${f.digit} in cell (${f.r}, ${f.c}). Erase it and try the next digit.`;
      case 'solved':
        return 'No empty cell is left, and every placement passed its checks: solved.';
      case 'clash':
        return `The clues already break a rule: the ${f.digit} at cell (${f.r}, ${f.c}) appears twice in a row, column or box. No search can fix that.`;
      case 'done':
        if (f.solved)
          return `Solved, after testing ${plural(f.tested, 'digit', 'digits')} and erasing ${plural(f.removed, 'digit', 'digits')}.`;
        if (f.cutoff)
          return `Stopped here: the search needs more steps than this trace can show. Add more clues and run it again.`;
        return f.placed === 0 && f.tested === 0
          ? 'No solution: the clues clash, so the search never starts.'
          : 'No solution: every choice ended in a clash.';
    }
  },
  takeaways: [
    'A constraint check at the moment of placing is the same as pruning: it removes every completed board that would have started that way. With no checks, 8-queens has 8⁸ = 16,777,216 boards to look at. The search here tests 876 squares.',
    'Placing and undoing must be exact opposites. In N-queens, that means clearing the column and both diagonal flags. Any state left behind silently breaks later branches.',
    'The checks are fast because of the state kept. The two diagonals are r − c and r + c, so one flag per column and per diagonal answers “is this square attacked?” in O(1).',
    'Choosing a good order makes a big difference. Sudoku solvers usually fill the most constrained cell next, the one with the fewest digits left, which fails sooner and so prunes earlier. This lesson’s simple left-to-right order is easier to follow, but slower.',
    'Set n to 8 and read Squares tested. Then click column 3 of the top row, and compare. Which first move would you have guessed is best?',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    [
      'N-queens, worst case',
      'O(n!)',
      'One queen per column as well as per row: at most n! boards.',
    ],
    ['A safety check', 'O(1)', 'Flags for each column and diagonal, instead of a scan.'],
    ['N-queens, memory', 'O(n)', 'The queens placed, the flags, and the call stack.'],
    [
      'Sudoku, worst case',
      'O(sᵉ)',
      'e empty cells with s digits each, cut sharply in practice by the checks.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many solutions does the 4-queens puzzle have?',
      answer: 2,
      unit: 'solutions',
      hints: ['Set n to 4 and All solutions, then step to the end.'],
      solution:
        'Two: 1 3 0 2 and 2 0 3 1, written as the column for each row. Each is the mirror image of the other.',
    },
    {
      type: 'number',
      prompt: 'How many solutions does the 6-queens puzzle have?',
      answer: 4,
      unit: 'solutions',
      hints: ['Set n to 6 and All solutions.', 'It has fewer than the 10 of n = 5.'],
      solution:
        'Four. The count does not always rise with n: n = 5 has 10 and n = 6 has 4, while n = 2 and n = 3 have none.',
    },
    {
      type: 'number',
      prompt: 'For n = 4, stopping at the first solution, how many times is a queen taken back?',
      answer: 4,
      unit: 'queens',
      hints: ['Read the Taken back stat at the last step.'],
      solution:
        'Four. The first queen starts in column 0, where nothing works. Three queens go back during that branch, then the first queen itself, and column 1 then leads straight to 1 3 0 2.',
    },
    {
      type: 'number',
      prompt: 'For n = 8, stopping at the first solution, how many squares are tested?',
      answer: 876,
      unit: 'squares',
      hints: ['Set n to 8, stay on First solution and read Squares tested.'],
      solution:
        'The search tests 876 squares, places 113 queens and takes back 105, then stops at 0 4 7 5 2 6 1 3. Nearly 17 million boards with no checks shrink to under a thousand tests.',
    },
    {
      type: 'number',
      prompt:
        'A queen stands at row 2, column 5. On which down-right diagonal number r − c does it sit?',
      answer: -3,
      hints: ['Subtract the column from the row.'],
      solution: 'r − c = 2 − 5 = −3. Every square on that diagonal gives the same value.',
    },
    {
      type: 'order',
      prompt: 'Order the moves for one square of N-queens, once the square has passed its check.',
      items: [
        'Clear the column and diagonal flags',
        'Set the column and diagonal flags',
        'Solve the next row',
      ],
      answer: [1, 2, 0],
      hints: ['Place, explore, then undo.'],
      solution: 'Set the flags (place), solve the next row (explore), then clear the flags (undo).',
    },
    {
      type: 'multi',
      prompt: 'Which do the checks in a Sudoku step look at? Pick all that apply.',
      options: [
        'The cell’s row',
        'The cell’s column',
        'The cell’s box',
        'The two long diagonals of the grid',
      ],
      answers: [0, 1, 2],
      hints: ['Classic Sudoku has three kinds of rule.'],
      solution: 'Row, column and box. The long diagonals only count in a variant called Sudoku X.',
    },
    {
      type: 'choice',
      prompt: 'Why does filling N-queens one row at a time help?',
      options: [
        'It makes the row rule true automatically, so only columns and diagonals need checking.',
        'It guarantees that the first attempt succeeds.',
        'It makes the problem run in polynomial time.',
        'It removes the need to undo placements.',
      ],
      answer: 0,
      hints: ['With exactly one queen per row, which rule can never fail?'],
      solution:
        'One queen per row means two can never share one. That removes one rule and shrinks the choices from n² squares to n per queen.',
    },
  ],
  nextTeaser:
    'Next up: Branch and bound, which adds a best-so-far score to backtracking so an optimisation problem can prune too.',
};
