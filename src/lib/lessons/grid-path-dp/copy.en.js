/** @typedef {import('$lib/algo-engine/grid-path-dp.js').GridFrame} GridFrame */
/** @typedef {import('$lib/algo-engine/grid-path-dp.js').GridMode} GridMode */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** @param {number} v */
const num = (v) => (v === Infinity ? '∞' : String(v));

export const en = {
  slug: 'grid-path-dp',
  topic: 'dynamic-programming',
  level: 'Intermediate',
  title: 'Grid and path DP',
  intro:
    'If you may only move right or down, a path reaches a cell from the cell above it or the cell to its left. So each cell’s answer follows from those two, and filling the grid row by row always has them ready. The same grid can count the paths or find the cheapest one, and a wall is just a cell no path may use.',
  summary:
    'Edit a grid and see each cell’s number of paths or cheapest cost, built from the cell above and the cell to its left.',
  instruction:
    'Click or press Enter on a cell in the Grid to add or remove a wall, and watch the table update. In Minimum path sum, set Clicking a cell to Changes cost to raise a cell’s cost. Click a cell of the table to see how it was built, or step to watch it fill.',
  modeLabel: 'Problem',
  modes: { count: 'Count paths', min: 'Minimum path sum' },
  toolLabel: 'Clicking a cell',
  tools: { wall: 'Toggles a wall', cost: 'Changes cost' },
  rowsLabel: 'Rows',
  colsLabel: 'Columns',
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    maze: 'Maze, 4 × 5',
    pillar: 'One wall, 3 × 3',
    open: 'Open, 3 × 7',
    costs: 'Costs, 3 × 3',
    trap: 'Greedy trap, 3 × 3',
  },
  resetGrid: 'Reset grid',
  /** @param {number} max */
  sideError: (max) => `Rows and columns must be whole numbers from 1 to ${max}.`,
  gridTitle: 'Grid',
  /** @param {GridMode} mode */
  gridNote: (mode) =>
    mode === 'count'
      ? 'S is the start and G is the goal. # is a wall. Moves go right or down.'
      : 'S is the start and G is the goal. # is a wall, a number is what entering the cell costs. Moves go right or down.',
  wallText: '#',
  openText: '·',
  startMark: 'S',
  goalMark: 'G',
  /** @param {number} rows @param {number} cols */
  gridAria: (rows, cols) => `Editable grid, ${rows} rows by ${cols} columns.`,
  /** @param {number} r @param {number} c @param {number} v @param {GridMode} mode @param {string} state */
  gridCell: (r, c, v, mode, state) => {
    const what = v === 0 ? 'wall' : mode === 'count' ? 'open' : `cost ${v}`;
    return `Cell (${r}, ${c}): ${what}${state ? `, ${state}` : ''}`;
  },
  tableTitle: { count: 'Paths reaching each cell', min: 'Cheapest cost to each cell' },
  /** @param {GridMode} mode */
  tableNote: (mode) =>
    mode === 'count'
      ? 'P[r][c] is the number of right-and-down paths from the start to this cell. A wall counts as 0.'
      : 'B[r][c] is the cheapest total cost of a path to this cell, its own cost and the start’s included. ∞ means no path reaches it.',
  /** @param {GridMode} mode @param {number} rows @param {number} cols */
  tableAria: (mode, rows, cols) =>
    `${mode === 'count' ? 'Path counts' : 'Cheapest costs'}, ${rows} rows by ${cols} columns.`,
  /** @param {number} r @param {number} c @param {string} v @param {string} state */
  tableCell: (r, c, v, state) =>
    `Cell (${r}, ${c}): ${v === '' ? 'empty' : v}${state ? `, ${state}` : ''}`,
  cellStates: {
    current: 'filled now',
    read: 'read',
    kept: 'read, and kept',
    path: 'on the best path',
    answer: 'the answer',
  },
  legend: {
    current: 'Filled now',
    read: 'Read by this cell',
    kept: 'The neighbour it keeps',
    path: 'On the best path',
    answer: 'The answer',
  },
  markers: { current: '●', read: '○', kept: '✓', path: '◆', answer: '★' },
  /** @param {number|null} v */
  value: (v) => (v === null ? '' : num(v)),
  stats: {
    filled: 'Cells filled',
    answer: { count: 'Paths to the goal', min: 'Cheapest cost' },
    open: 'Paths in an open grid',
    greedy: 'Always the cheaper next step',
  },
  pending: '…',
  stuck: 'stuck',
  pathTitle: 'Cheapest path',
  pathEmpty: 'Read off during the walk back.',
  /** @param {number} r @param {number} c */
  pathChip: (r, c) => `(${r}, ${c})`,
  sumsTitle: 'How this cell adds up',
  sumsEmpty: 'Step to a cell, or click one in the table.',
  /** @param {GridFrame} f */
  sums(f) {
    if (f.kind !== 'fill') return '';
    const v = f.table[f.r][f.c];
    const parts = f.options.map((o) => `${o.move === 'up' ? 'above' : 'left'} ${num(o.value)}`);
    return f.mode === 'count'
      ? `${parts.join(' + ')} = ${num(/** @type {number} */ (v))}`
      : `${f.grid[f.r][f.c]} + min(${parts.join(', ')}) = ${num(/** @type {number} */ (v))}`;
  },
  /** @param {GridFrame} f */
  describe(f) {
    const counting = f.mode === 'count';
    const T = counting ? 'P' : 'B';
    const here = `${T}[${f.r}][${f.c}]`;
    const v = f.r >= 0 ? f.table[f.r][f.c] : null;
    const rows = f.grid.length;
    const cols = f.grid[0].length;
    switch (f.kind) {
      case 'start':
        return counting
          ? `Count the paths from the top-left cell to the bottom-right cell of this ${rows} × ${cols} grid, moving only right or down.`
          : `Find the cheapest path from the top-left cell to the bottom-right cell of this ${rows} × ${cols} grid, moving only right or down.`;
      case 'wall':
        return counting
          ? `(${f.r}, ${f.c}) is a wall, so no path passes through it: ${here} = 0.`
          : `(${f.r}, ${f.c}) is a wall, so no path passes through it: ${here} = ∞.`;
      case 'first':
        return counting
          ? 'Base case: one path reaches the start, the empty one. P[0][0] = 1.'
          : `Base case: the start costs its own ${f.grid[0][0]}. B[0][0] = ${f.grid[0][0]}.`;
      case 'fill': {
        const above = f.options.find((o) => o.move === 'up');
        const left = f.options.find((o) => o.move === 'left');
        if (counting) {
          if (above && left)
            return `A path arrives from above or from the left: ${here} = ${above.value} + ${left.value} = ${v}.`;
          return above
            ? `The first column has only the cell above: ${here} = ${above.value}.`
            : `The first row has only the cell to the left: ${here} = ${left?.value}.`;
        }
        if (v === Infinity) return `Both ways in are blocked, so no path reaches it: ${here} = ∞.`;
        const c = f.grid[f.r][f.c];
        if (above && left)
          return `Cost ${c}. Above is ${num(above.value)}, left is ${num(left.value)}. Keep the ${f.move === 'up' ? 'one above' : 'left one'}: ${here} = ${c} + ${num(f.move === 'up' ? above.value : left.value)} = ${v}.`;
        return `Cost ${c}, with one way in: ${here} = ${c} + ${num((above ?? left)?.value ?? 0)} = ${v}.`;
      }
      case 'trace':
        return `At (${f.r}, ${f.c}): this cell’s total came from the cell ${f.move === 'up' ? 'above' : 'to the left'}, so step ${f.move === 'up' ? 'up' : 'left'}.`;
      case 'done':
        if (counting)
          return f.result
            ? `${plural(/** @type {number} */ (f.result), 'path reaches', 'paths reach')} the goal.`
            : 'No path reaches the goal: walls block every route.';
        return f.result === Infinity
          ? 'No path reaches the goal: walls block every route, so the cost stays ∞.'
          : `The cheapest path costs ${f.result} and visits ${plural(f.path.length, 'cell', 'cells')}.`;
    }
  },
  takeaways: [
    'A right-and-down path enters a cell from above or from the left, so each cell needs only those two. Filling row by row guarantees both are ready.',
    'Counting adds: P[r][c] = P[r−1][c] + P[r][c−1]. The two sets of paths never overlap, because they differ in their last step. Without walls the answer is the binomial coefficient C(m + n − 2, m − 1).',
    'Optimising takes the smaller: B[r][c] = grid[r][c] + min(B[r−1][c], B[r][c−1]). Always moving to the cheaper next cell can miss the best path, because it never sees what comes later.',
    'A wall is an obstacle that holds 0 when counting and ∞ when minimising. Either value means the same thing to its neighbours: no path comes through here.',
    'Load the Greedy trap in Minimum path sum and compare the two costs. Then count paths on the Open grid, add one wall and see how many paths passed through that cell.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    ['Time', 'O(mn)', 'Every cell is filled once, reading at most two neighbours.'],
    ['Memory, full table', 'O(mn)', 'Keeping every cell lets the walk back rebuild the path.'],
    ['Memory, value only', 'O(min(m, n))', 'Each row reads only itself and the row above.'],
    ['Walk back', 'O(m + n)', 'Each step moves up or left, m + n − 2 steps in all.'],
    ['Brute force', 'C(m + n − 2, m − 1)', 'One walk per path: about 4ⁿ on an n × n grid.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many paths cross an open grid of 3 rows and 7 columns?',
      answer: 28,
      unit: 'paths',
      hints: ['Load the Open example in Count paths and step to the end.'],
      solution:
        'C(3 + 7 − 2, 3 − 1) = C(8, 2) = 28. The last row of the table reads 1, 3, 6, 10, 15, 21, 28.',
    },
    {
      type: 'number',
      prompt: 'A 3 × 3 grid has a wall in its middle cell. How many paths remain?',
      answer: 2,
      unit: 'paths',
      hints: ['Load the One wall example.', 'An open 3 × 3 grid has 6 paths.'],
      solution:
        'Only the two paths around the border remain. The wall holds 0, so the other 4 of the 6 paths, all through the middle, are gone.',
    },
    {
      type: 'number',
      prompt: 'How many paths cross the Maze example?',
      answer: 7,
      unit: 'paths',
      hints: ['Load the Maze example and read the goal cell of the table.'],
      solution:
        'P[3][4] = 7. The rows below the first read 1, 0, 1, 0, 1, then 1, 1, 2, 2, 3, then 1, 0, 2, 4, 7, with each wall counted as 0.',
    },
    {
      type: 'number',
      prompt: 'What is the cheapest path through the grid 1 3 1 / 1 5 1 / 4 2 1?',
      answer: 7,
      unit: 'cost',
      hints: ['Load the Costs example in Minimum path sum.'],
      solution: 'Along the top row and down the right side: 1 + 3 + 1 + 1 + 1 = 7.',
    },
    {
      type: 'number',
      prompt:
        'In the Greedy trap, 1 2 9 / 5 9 9 / 1 1 1, how much does always taking the cheaper next cell overpay?',
      answer: 5,
      unit: 'cost',
      hints: ['Compare the Cheapest cost stat with the stat beside it.'],
      solution:
        'The cheaper-next walk goes 1, 2, 9, 1, 1 for 14. The table goes 1, 5, 1, 1, 1 for 9. It overpays by 5.',
    },
    {
      type: 'choice',
      prompt: 'What should a wall hold when counting paths, and why?',
      options: [
        '1, because the cell still exists.',
        '0, because no path passes through it, so it adds nothing to its neighbours.',
        '∞, because it can never be reached.',
        'The sum of its neighbours, as for any other cell.',
      ],
      answer: 1,
      hints: ['What does a neighbour do with this value?'],
      solution:
        'Counting adds the neighbours, so 0 adds nothing. ∞ plays the same role only when taking a minimum.',
    },
    {
      type: 'multi',
      prompt: 'Which orders of filling are safe for right-and-down moves? Pick all that apply.',
      options: [
        'Row by row, left to right',
        'Column by column, top to bottom',
        'Row by row, from the bottom row up',
        'Along the anti-diagonals r + c = 0, 1, 2, …',
      ],
      answers: [0, 1, 3],
      hints: ['A cell needs the one above and the one to its left to be done already.'],
      solution:
        'Row, column and anti-diagonal order all finish both neighbours first. Starting from the bottom row reaches a cell before the one above it.',
    },
    {
      type: 'text',
      prompt: 'What is the running time for a grid of m rows and n columns?',
      accept: ['O(mn)', 'O(m·n)', 'O(m*n)', 'O(nm)', 'Θ(mn)'],
      hints: ['Count the cells and the work per cell.'],
      solution: 'm·n cells with at most two reads each: O(mn).',
    },
  ],
  nextTeaser:
    'Next up: Practice: dynamic programming problems, where you define the state and the transition yourself and test them on small inputs.',
};
