/** @typedef {import('$lib/algo-engine/sparse-table.js').SparseFrame} SparseFrame */
/** @typedef {import('$lib/algo-engine/sparse-table.js').SparseOp} SparseOp */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

/** @param {SparseOp} op */
const opName = (op) => op;

export const en = {
  slug: 'sparse-table',
  topic: 'range-queries',
  level: 'Intermediate',
  title: 'Sparse table',
  intro:
    'A sparse table answers range minimum questions on an array that never changes. It stores the answer for every block whose length is a power of two, then covers any range with two of those blocks. They overlap, and for min that does no harm, so each query takes O(1).',
  summary:
    'Build a table of power-of-two blocks in O(n log n), then answer range minimum, maximum or gcd queries in O(1) with two overlapping blocks.',
  instruction:
    'Click two cells of the array (or type l and r) to choose a range and watch the two blocks that cover it. Click a table cell to see which block it stores. Step back to watch the table being built, then switch to Sum to see why the overlap breaks it.',
  opLegend: 'Operation',
  ops: /** @type {Record<SparseOp, string>} */ ({
    min: 'Min',
    max: 'Max',
    gcd: 'Gcd',
    sum: 'Sum',
  }),
  valuesLabel: 'Values',
  lLabel: 'From l',
  rLabel: 'To r',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 5, 2, 4.',
    range: 'Every value must be from 0 to 99.',
    count: 'Type from 1 to 16 values.',
  },
  /** @param {number} n */
  rangeError: (n) => `l and r must be whole numbers with 0 ≤ l ≤ r ≤ ${n - 1}.`,
  pickHint: 'Click a cell to start a range, then another to end it. Enter works too.',
  /** @param {number} i */
  pickFirst: (i) => `Range starts at ${i}. Pick the cell where it ends.`,
  arrayTitle: 'Array a',
  arrayAria: 'Array a, index 0 first',
  tableTitle: 'Table st[k][i]: the block of length 2^k starting at i',
  tableAria: 'Sparse table, one row per k, one column per start index i',
  tableHint: 'Click a cell to see the block it stores. A dash means the block would not fit.',
  noBlock: '–',
  /** @param {number} k @param {number} i @param {number} n */
  noBlockNotice: (k, i, n) =>
    `No block here: length ${1 << k} starting at ${i} would run past the end of the ${n} values.`,
  /** @param {number} k */
  rowHeader: (k) => `k=${k}`,
  /** @param {number} k */
  blockWindow: (k) => `2^${k}`,
  /** @param {number} l @param {number} r */
  rangeWindow: (l, r) => `a[${l}..${r}]`,
  /** @param {number} k @param {number} i */
  inspectWindow: (k, i) => `st[${k}][${i}]`,
  /** @param {number} k @param {number} i @param {number | null} value @param {SparseOp} op */
  inspectLine: (k, i, value, op) =>
    `st[${k}][${i}] covers a[${i}..${i + (1 << k) - 1}], ${plural(1 << k, 'cell')}: ${opName(op)} = ${value === null ? 'not built yet' : value}.`,
  markers: { left: 'L', right: 'R', both: '×2' },
  /** @param {number} i @param {number} v @param {string} state */
  cellLabel: (i, v, state) => `a[${i}] = ${v}${state ? `, ${state}` : ''}`,
  /** @param {number} k @param {number} i @param {number | null} v @param {boolean} fits @param {string} state */
  tableCellLabel: (k, i, v, fits, state) =>
    !fits
      ? `st[${k}][${i}]: no such block`
      : `st[${k}][${i}]: ${v === null ? 'not filled yet' : v}${state ? `, ${state}` : ''}`,
  states: {
    both: 'in both blocks',
    left: 'in the left block',
    right: 'in the right block',
    range: 'in the range',
    target: 'just filled',
    source: 'read to fill it',
    read: 'read by the query',
  },
  legend: {
    range: 'In the query range',
    write: 'Cell just filled',
    source: 'Half block read to fill it',
    block: 'L / R The query’s two blocks',
    both: '×2 Covered by both blocks',
  },
  stats: {
    filled: 'Table cells filled',
    merges: 'Merges while building',
    reads: 'Cells read by the query',
    naive: 'Reads without the table',
    result: 'Query answer',
    truth: 'True answer',
  },
  pending: '—',
  /** @param {SparseFrame} f */
  resultLine(f) {
    const size = 1 << f.level;
    return `a[${f.l}..${f.r}]: ${opName(f.op)}(st[${f.level}][${f.leftAt}], st[${f.level}][${f.rightAt}]) = ${opName(f.op)}(${f.leftValue}, ${f.rightValue}) = ${f.result}, blocks of ${size}.`;
  },
  practiceTitle: 'Check yourself',
  /** @param {SparseFrame} f */
  describe(f) {
    const size = f.level >= 0 ? 1 << f.level : 0;
    const name = opName(f.op);
    switch (f.kind) {
      case 'start':
        return `Build the table for ${plural(f.items.length, 'value')} with ${name}, then answer a[${f.l}..${f.r}].`;
      case 'base':
        return `Level 0 holds blocks of length 1, so each entry is the value itself.`;
      case 'cell': {
        const half = size / 2;
        return `st[${f.level}][${f.at}] covers a[${f.at}..${f.at + size - 1}]: ${name}(st[${f.level - 1}][${f.at}], st[${f.level - 1}][${f.at + half}]) = ${name}(${f.table[f.level - 1][f.at]}, ${f.table[f.level - 1][f.at + half]}) = ${f.table[f.level][f.at]}.`;
      }
      case 'pick-k':
        return `The range has ${plural(f.r - f.l + 1, 'cell')}. The largest power of two that fits is 2^${f.level} = ${size}, so k = ${f.level}.`;
      case 'left':
        return `Left block: st[${f.level}][${f.leftAt}] covers a[${f.leftAt}..${f.leftAt + size - 1}] and holds ${f.leftValue}.`;
      case 'right':
        return `Right block: st[${f.level}][${f.rightAt}] covers a[${f.rightAt}..${f.rightAt + size - 1}] and holds ${f.rightValue}. The blocks share ${plural(f.overlap, 'cell')}.`;
      case 'combine':
        return f.op === 'sum'
          ? `Sum gives ${f.leftValue} + ${f.rightValue} = ${f.result}, but the true sum is ${f.truth}: the ${plural(f.overlap, 'shared cell')} counted twice. Sum is not idempotent.`
          : `${name}(${f.leftValue}, ${f.rightValue}) = ${f.result}. Reading the ${plural(f.overlap, 'shared cell')} twice changes nothing, because ${name}(x, x) = x.`;
      case 'done':
        return f.op === 'sum'
          ? `Done: 2 reads, wrong answer ${f.result} instead of ${f.truth}. Sum needs another structure, such as prefix sums or a Fenwick tree.`
          : `Done: the answer ${f.result} took 2 reads instead of ${plural(f.r - f.l + 1, 'read')}, and any other range also takes 2.`;
    }
  },
  takeaways: [
    'st[k][i] stores the answer for the 2^k cells starting at i. Each block is two half-length blocks merged: st[k][i] = op(st[k − 1][i], st[k − 1][i + 2^(k − 1)]).',
    'Any range of length len fits two blocks of size 2^k, with k = ⌊log₂ len⌋: one starts at l and one ends at r. Because 2·2^k > len, together they cover the range, and they always share at least one cell.',
    'The overlap is safe only for an idempotent operation, where op(x, x) = x: min, max, gcd, bitwise AND and OR. Sum and product count the shared cells twice.',
    'The table is static. Changing one value can invalidate up to O(n log n) cells, so an array that changes needs a Fenwick tree or a segment tree.',
    'Try Sum on the range l = 1, r = 6: the blocks a[1..4] and a[3..6] share a[3] and a[4]. The result is too large by exactly those two values. Then switch back to Min.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Build', 'O(n log n)', 'About log₂ n levels with at most n cells each, each cell one merge.'],
    ['Query (idempotent)', 'O(1)', 'Compute k, read two cells, combine them.'],
    ['Query by scanning', 'O(r − l + 1)', 'Read every cell of the range.'],
    ['Update one value', 'O(n log n)', 'Rebuild: many blocks may contain the changed cell.'],
    ['Memory', 'O(n log n)', 'One row of up to n cells per level.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'For a range of 6 cells, which k does the query use?',
      answer: 2,
      hints: ['Find the largest power of two that is at most 6.'],
      solution: '2² = 4 ≤ 6 and 2³ = 8 > 6, so k = ⌊log₂ 6⌋ = 2. Two blocks of 4 cover 6 cells.',
    },
    {
      type: 'number',
      prompt: 'For a = [5, 2, 4, 7, 1, 3, 6, 8] with Min, what does st[2][1] hold?',
      answer: 1,
      hints: ['k = 2 means a block of 4 cells. It starts at index 1.', 'It covers a[1..4].'],
      solution: 'st[2][1] covers a[1..4] = 2, 4, 7, 1, whose minimum is 1.',
    },
    {
      type: 'number',
      prompt:
        'Same array, range a[1..6], with Sum instead of Min. The true sum is 23. What does the sparse-table query return?',
      answer: 31,
      hints: [
        'k = 2, so the blocks are a[1..4] and a[3..6].',
        'They share a[3] = 7 and a[4] = 1, which count twice.',
      ],
      solution:
        'The blocks hold 2 + 4 + 7 + 1 = 14 and 7 + 1 + 3 + 6 = 17, so the query returns 14 + 17 = 31. That is the true sum 23 plus the shared 7 + 1. Load these values in the widget and pick Sum to check.',
    },
    {
      type: 'number',
      prompt: 'How many table cells does a sparse table fill for n = 16?',
      unit: 'cells',
      answer: 54,
      hints: [
        'Level k has n − 2^k + 1 cells.',
        'The levels are k = 0, 1, 2, 3, 4, with 16, 15, 13, 9 and 1 cells.',
      ],
      solution:
        '16 + 15 + 13 + 9 + 1 = 54. Compare 16 · log₂ 16 = 64, the O(n log n) upper estimate.',
    },
    {
      type: 'multi',
      prompt: 'Which operations can use the two overlapping blocks directly?',
      options: ['Minimum', 'Sum', 'Greatest common divisor', 'Bitwise OR', 'Product'],
      answers: [0, 2, 3],
      hints: ['Check whether op(x, x) = x.'],
      solution:
        'min(x, x), gcd(x, x) and x OR x all equal x, so shared cells do no harm. x + x and x · x generally differ from x, so sum and product count the overlap twice.',
    },
    {
      type: 'choice',
      prompt:
        'An array receives a point update between every pair of range minimum queries. Is a sparse table a good fit?',
      options: [
        'Yes: queries are O(1), so updates do not matter',
        'No: each update can force an O(n log n) rebuild, so use a segment tree',
        'Yes: an update changes only one cell of the table',
        'No: sparse tables cannot answer range minimum queries',
      ],
      answer: 1,
      hints: ['How many blocks contain a given cell?'],
      solution:
        'A cell belongs to up to 2^k blocks at level k, so one update can invalidate many table cells. Sparse tables suit static data; a segment tree handles updates and queries in O(log n).',
    },
  ],
  nextTeaser:
    'Next up: Fenwick tree, where sums come back and updates are allowed, using one small array and the lowest set bit of each index.',
};
