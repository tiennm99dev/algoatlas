/** @typedef {import('$lib/algo-engine/interval-dp.js').IntervalFrame} IntervalFrame */
/** @typedef {import('$lib/algo-engine/interval-dp.js').IntervalProblem} IntervalProblem */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** @param {number} i @param {number} j */
const chain = (i, j) => (i === j ? `A${i}` : `A${i}..A${j}`);
/** @param {number} i @param {number} j */
const units = (i, j) => (i === j ? `unit ${i}` : `units ${i}..${j}`);

export const en = {
  slug: 'interval-dp',
  topic: 'dynamic-programming',
  level: 'Advanced',
  title: 'Interval DP: matrix chain and rod cutting',
  intro:
    'Some problems have no natural left-to-right order: the last step can split the input anywhere. Interval DP lets cell (i, j) stand for the stretch from i to j and tries every split point k between them. Every split reads two shorter intervals, so the table fills by length, one diagonal at a time. Matrix chain multiplication and rod cutting are the classic examples.',
  summary:
    'Fill a triangular table by interval length, try every split point k, and rebuild the best matrix order or the best rod cuts.',
  instruction:
    'Pick a problem, type the dimensions or prices and step. Each diagonal is one interval length; the two arrows show the shorter intervals a split reads, and ✓ marks the best split when the cell settles. Click any filled cell to jump to it. The last steps read the answer back from the split table.',
  problemLabel: 'Problem',
  problems: { matrix: 'Matrix chain', rod: 'Rod cutting' },
  inputLabel: { matrix: 'Dimensions p', rod: 'Prices by length' },
  presetLabel: 'Example',
  /** @type {Record<IntervalProblem, Record<string, string>>} */
  presets: {
    matrix: {
      three: '3 matrices: 10, 100, 5, 50',
      four: '4 matrices: 40, 20, 30, 10, 30',
      six: '6 matrices: 30, 35, 15, 5, 10, 20, 25',
    },
    rod: {
      four: 'Rod of 4: 1, 5, 8, 9',
      eight: 'Rod of 8: 1, 5, 8, 9, 10, 17, 17, 20',
      whole: 'Rod of 3: 1, 2, 9',
    },
  },
  /**
   * @param {number} maxMatrices
   * @param {number} maxDim
   * @param {number} maxRod
   * @param {number} maxPrice
   */
  errors: (maxMatrices, maxDim, maxRod, maxPrice) => ({
    format: 'Write whole numbers separated by commas.',
    count: {
      matrix: `Type 2 to ${maxMatrices + 1} dimensions: n matrices have n + 1.`,
      rod: `Type 1 to ${maxRod} prices, one for each length.`,
    },
    range: {
      matrix: `Each dimension must be from 1 to ${maxDim}.`,
      rod: `Each price must be from 0 to ${maxPrice}.`,
    },
  }),
  tableTitle: { matrix: 'Fewest multiplications m[i][j]', rod: 'Best price r[i][j]' },
  splitTitle: 'Best split s[i][j]',
  /** @param {IntervalProblem} p */
  tableNote: (p) =>
    p === 'matrix'
      ? 'Cell (i, j) is the cheapest way to multiply A[i]..A[j]. Only i ≤ j is an interval, so the table is a triangle, and each diagonal is one length.'
      : 'Cell (i, j) is the most money for the piece of units i..j. Only i ≤ j is an interval, so the table is a triangle. All cells on a diagonal match, because only the length of the piece matters.',
  /** @param {IntervalProblem} p */
  splitNote: (p) =>
    p === 'matrix'
      ? 'The k whose split won. Split after A[k].'
      : 'The k whose cut won. Cut after unit k; a dash means sell the piece whole.',
  noSplit: '–',
  outside: '·',
  /** @param {IntervalProblem} p @param {number} n */
  tableAria: (p, n) =>
    p === 'matrix'
      ? `Triangular table of fewest multiplications for ${plural(n, 'matrix', 'matrices')}.`
      : `Triangular table of the best price for a rod of ${plural(n, 'unit', 'units')}.`,
  /** @param {number} n */
  splitAria: (n) => `Table of the best split for each interval, ${n} by ${n}.`,
  /** @param {IntervalProblem} p @param {number} i @param {number} j @param {string} v @param {string} state */
  cellLabel: (p, i, j, v, state) => {
    if (i > j) return `Row ${i}, column ${j}: not an interval`;
    const name = p === 'matrix' ? chain(i, j) : units(i, j);
    return `${name}: ${v === '' ? 'empty' : v}${state ? `, ${state}` : ''}`;
  },
  cellStates: {
    current: 'filled now',
    read: 'read',
    kept: 'read, best split',
    frontier: 'this length, waiting',
    path: 'used by the answer',
    answer: 'the answer',
  },
  legend: {
    current: 'Filled now',
    frontier: 'This length, waiting',
    read: 'Read by this split',
    kept: 'Best split',
    path: 'Used by the answer',
    answer: 'The answer',
  },
  markers: { current: '●', frontier: '◇', read: '○', kept: '✓', path: '◆', answer: '★' },
  /** @param {IntervalProblem} p */
  stripLabel: (p) => (p === 'matrix' ? 'The chain' : 'The rod'),
  /** @param {IntervalProblem} p @param {number} i @param {number} j @param {number} k */
  stripAria: (p, i, j, k) => {
    if (!i) return p === 'matrix' ? 'The chain of matrices.' : 'The units of the rod.';
    const name = p === 'matrix' ? chain(i, j) : units(i, j);
    return `Interval ${name}${k ? `, split after ${p === 'matrix' ? `A${k}` : `unit ${k}`}` : ''}.`;
  },
  /** @param {IntervalProblem} p @param {number} i */
  stripCell: (p, i) => (p === 'matrix' ? `A${i}` : String(i)),
  windows: { left: 'left', right: 'right', whole: 'interval' },
  shapesTitle: { matrix: 'Matrix shapes', rod: 'Price by length' },
  /** @param {IntervalProblem} p @param {number[]} input @param {number} k */
  shapeChip: (p, input, k) =>
    p === 'matrix' ? `A${k + 1}: ${input[k]}×${input[k + 1]}` : `${k + 1} → ${input[k]}`,
  orderTitle: { matrix: 'Order', rod: 'Pieces' },
  orderEmpty: 'Read from the split table after the last cell.',
  stats: {
    tried: 'Splits tried',
    filled: 'Intervals filled',
    answer: { matrix: 'Fewest multiplications', rod: 'Best price' },
    baseline: { matrix: 'Worst order', rod: 'Sold whole' },
    orders: { matrix: 'Orders brute force compares', rod: 'Cuttings brute force compares' },
  },
  pending: '…',
  /** @param {IntervalFrame} f */
  describe(f) {
    const matrix = f.problem === 'matrix';
    const T = matrix ? 'm' : 'r';
    const name = matrix ? chain : units;
    const cell = `${T}[${f.i}][${f.j}]`;
    switch (f.kind) {
      case 'start':
        return matrix
          ? `Multiply ${plural(f.n, 'matrix', 'matrices')} with the fewest scalar multiplications. The product is the same in any order, but the work is not.`
          : `Sell a rod of ${plural(f.n, 'unit', 'units')} for the most money. Cut it anywhere, or not at all.`;
      case 'base':
        return matrix
          ? 'Length 1: one matrix needs no multiplication, so the diagonal is 0.'
          : `Length 1: one unit cannot be cut, so each cell on the diagonal is its price, ${f.input[0]}.`;
      case 'length':
        return `Length ${f.len}: every interval on this diagonal splits into two shorter ones, and those are all finished.`;
      case 'open':
        return matrix
          ? `Interval ${name(f.i, f.j)}: start at ∞ and try ${plural(f.j - f.i, 'split', 'splits')}.`
          : `Interval ${name(f.i, f.j)}: selling it whole brings p[${f.len}] = ${f.cost}. Then try ${plural(f.j - f.i, 'cut', 'cuts')}.`;
      case 'try': {
        const after = matrix ? `A${f.k}` : `unit ${f.k}`;
        const sum = matrix
          ? `${f.left} + ${f.right} + ${f.input[f.i - 1]}·${f.input[f.k]}·${f.input[f.j]} = ${f.cost}`
          : `${f.left} + ${f.right} = ${f.cost}`;
        const verdict = f.improved
          ? f.best === null
            ? 'The first option, so it is the best so far.'
            : `Better than ${f.best}, so it is the new best.`
          : `Not better than ${f.best}.`;
        return `${matrix ? 'Split' : 'Cut'} after ${after}: ${sum}. ${verdict}`;
      }
      case 'settle':
        return f.k
          ? `${cell} = ${f.best}, with the best ${matrix ? 'split' : 'cut'} after ${matrix ? `A${f.k}` : `unit ${f.k}`}: ${name(f.i, f.k)} and ${name(f.k + 1, f.j)}.`
          : `${cell} = ${f.best}: no cut beats selling this piece whole.`;
      case 'trace':
        return f.k
          ? `s[${f.i}][${f.j}] = ${f.k}: ${name(f.i, f.j)} ${matrix ? 'splits' : 'is cut'} into ${name(f.i, f.k)} and ${name(f.k + 1, f.j)}.`
          : `s[${f.i}][${f.j}] = 0: sell ${name(f.i, f.j)} whole.`;
      case 'done':
        return matrix
          ? `The fewest multiplications: ${f.result}, with the order ${f.order}.`
          : `The best price: ${f.result}, with pieces ${f.order}.`;
    }
  },
  takeaways: [
    'DP over intervals: cell (i, j) answers the problem for the stretch i..j. There are n(n + 1) / 2 intervals, which makes a triangular table.',
    'The split point k is the choice: the whole stretch is finished by joining i..k and k + 1..j. Try every k, keep the best, and store it in s[i][j]. The answer is then rebuilt top-down from s[1][n].',
    'Fill by length, not by row from the top: both parts of a split are shorter than the whole, so they are done once all smaller lengths are done.',
    'Matrix chain: m[i][j] = min over k of m[i][k] + m[k+1][j] + p[i−1]·p[k]·p[j]. The last term multiplies the two finished parts. Order can change the work tenfold, as the first example shows.',
    'Rod cutting fits the same table, but every diagonal repeats, because a piece’s value depends only on its length. So it shrinks to one row: r[n] = max over i of p[i] + r[n − i], in O(n²). Load the rod of 8 and read the diagonals, then type your own prices so that selling whole wins.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    [
      'Time',
      'O(n³)',
      'O(n²) intervals, with up to n − 1 splits each; (n³ − n) / 6 splits in total.',
    ],
    ['Memory', 'O(n²)', 'A triangle of n(n + 1) / 2 values, plus the split table.'],
    ['Rebuild the order', 'O(n)', 'One visit per split: n − 1 for a chain of n matrices.'],
    [
      'Rod cutting in one row',
      'O(n²) time, O(n) memory',
      'A value depends only on length, so one row r[0..n] is enough.',
    ],
    [
      'Brute force',
      'Θ(4ⁿ / n^1.5)',
      'The Catalan number of parenthesisations; a rod has 2^(n − 1) cuttings.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Matrices A1, A2, A3 have dimensions p = 10, 100, 5, 50. What is the fewest number of scalar multiplications?',
      answer: 7500,
      unit: 'multiplications',
      hints: ['Load the 3 matrices example and step to the end.'],
      solution:
        '(A1 A2) A3 costs 10·100·5 + 10·5·50 = 5000 + 2500 = 7500. A1 (A2 A3) costs 100·5·50 + 10·100·50 = 25000 + 50000 = 75000, ten times as much.',
    },
    {
      type: 'number',
      prompt: 'In the 6-matrix example p = 30, 35, 15, 5, 10, 20, 25, what is m[2][5]?',
      answer: 7125,
      unit: 'multiplications',
      hints: ['Load the 6 matrices example and click row 2, column 5.'],
      solution:
        'The best split is after A3: m[2][3] + m[4][5] + 35·5·20 = 2625 + 1000 + 3500 = 7125.',
    },
    {
      type: 'number',
      prompt: 'How many splits does the matrix chain table try for 6 matrices?',
      answer: 35,
      unit: 'splits',
      hints: ['Load the 6 matrices example and read Splits tried at the end.', 'Use (n³ − n) / 6.'],
      solution: '(6³ − 6) / 6 = 210 / 6 = 35 splits across 15 intervals of length 2 or more.',
    },
    {
      type: 'choice',
      prompt: 'Why does the table fill by interval length?',
      options: [
        'Because long intervals are more important.',
        'Because both parts of a split are shorter than the whole, so they are already finished.',
        'Because the table is square.',
        'Because k always equals the length.',
      ],
      answer: 1,
      hints: ['Which cells does a split of (i, j) read?'],
      solution:
        'A split reads (i, k) and (k + 1, j), both strictly shorter than (i, j). Finishing all shorter lengths first guarantees they are ready.',
    },
    {
      type: 'number',
      prompt: 'A rod of 8 has prices 1, 5, 8, 9, 10, 17, 17, 20. What is the best price?',
      answer: 22,
      unit: 'money',
      hints: ['Load the Rod of 8 example and step to the end.'],
      solution:
        'Cut it into pieces of 2 and 6: p[2] + p[6] = 5 + 17 = 22, against 20 for selling whole.',
    },
    {
      type: 'choice',
      prompt:
        'In the rod table, all cells on one diagonal hold the same value. What does that show?',
      options: [
        'The table has a bug.',
        'A piece’s best price depends only on its length, so one row is enough.',
        'Every rod should be sold whole.',
        'The split point does not matter.',
      ],
      answer: 1,
      hints: ['What do r[1][3] and r[2][4] have in common?'],
      solution:
        'Both are pieces of 3 units, and the price list reads only the length. So r[len] alone is enough: r[n] = max over i of p[i] + r[n − i].',
    },
    {
      type: 'number',
      prompt: 'How many different ways can 6 matrices be fully parenthesised?',
      answer: 42,
      unit: 'orders',
      hints: ['Read the Orders brute force compares stat, or use the Catalan number C(5).'],
      solution:
        'C(5) = 42. The count grows close to 4ⁿ, which is why comparing them one by one fails.',
    },
    {
      type: 'text',
      prompt: 'What is the running time of the interval table for n matrices?',
      accept: ['O(n^3)', 'O(n³)', 'Θ(n^3)', 'n^3'],
      hints: ['There are O(n²) cells, each with up to n − 1 splits.'],
      solution: 'O(n²) intervals with O(n) splits each: O(n³). Exactly (n³ − n) / 6 splits.',
    },
  ],
  nextTeaser:
    'Next up: Grid and path DP, where each cell of a grid is built from the cell above it and the cell to its left.',
};
