/** @typedef {import('$lib/algo-engine/fenwick-tree.js').FenwickFrame} FenwickFrame */
/** @typedef {import('$lib/algo-engine/fenwick-tree.js').FenwickOp} FenwickOp */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

/** A signed number with a Unicode minus. @param {number} x */
const signed = (x) => (x < 0 ? `−${-x}` : String(x));

/** An increment with its sign always shown. @param {number} x */
const plusMinus = (x) => (x < 0 ? `−${-x}` : `+${x}`);

/** @param {number} i */
const low = (i) => i & -i;

export const en = {
  slug: 'fenwick-tree',
  topic: 'range-queries',
  level: 'Intermediate',
  title: 'Fenwick tree',
  intro:
    'A Fenwick tree, also called a binary indexed tree, keeps prefix sums while values change. It is a single array where each cell sums a block of values, and the block’s length is the lowest set bit of the cell’s index. Reads and updates each jump through about log₂ n cells at most.',
  summary:
    'Update values and read prefix sums in O(log n) with one array, jumping between cells by the lowest set bit of the index.',
  instruction:
    'Set an index by typing it or clicking a cell of t, then press Prefix sum, Add, or Range sum and step through. Watch the arcs: a query clears the lowest bit and jumps left, an update adds it and jumps right. The bars show which values each cell sums.',
  valuesLabel: 'Values',
  indexLabel: 'Index i',
  deltaLabel: 'Delta',
  fromLabel: 'From l',
  prefixButton: 'Prefix sum to i',
  addButton: 'Add delta at i',
  rangeButton: 'Range sum l..i',
  undo: 'Undo last',
  reset: 'Reset',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 3, −1, 4.',
    range: 'Every value must be from −99 to 99.',
    count: 'Type from 1 to 16 values.',
  },
  /** @param {number} n */
  indexError: (n) => `Indices are 1-based here: use a whole number from 1 to ${n}.`,
  deltaError: 'Delta must be a whole number from −99 to 99.',
  rangeError: 'A range needs l ≤ i. Lower From l or raise Index i.',
  logFull: 'The log is full (8 operations). Undo or reset to continue.',
  pickHint: 'Click a cell of t to set the index; arrow keys and Enter work too.',
  /** @param {number} i @param {number} n */
  picked: (i, n) =>
    `Index ${i} = ${i.toString(2).padStart(n.toString(2).length, '0')}: t[${i}] sums a[${i - low(i) + 1}..${i}], ${plural(low(i), 'value')}.`,
  treeAria: 'Fenwick array t, index 1 first. Each cell sums the block of values shown by its bar.',
  treeName: 't',
  valuesName: 'a',
  stopLow: '0',
  stopHigh: '> n',
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'running now',
  visitedTitle: 'Cells of t this operation touched',
  /** @param {FenwickOp} op */
  opChip: (op) => {
    if (op.type === 'add') return `add(${op.i}, ${signed(op.delta)})`;
    if (op.type === 'prefix') return `prefix(${op.i})`;
    return `range(${op.l}, ${op.r})`;
  },
  /** @param {number} i @param {number} v @param {number} start @param {string} state */
  cellLabel: (i, v, start, state) =>
    `t[${i}] = ${signed(v)}, sum of a[${start}..${i}]${state ? `, ${state}` : ''}`,
  /** @param {number} i */
  bitsLine: (i) =>
    `i = ${i} = ${i.toString(2)}₂, lowbit(${i}) = ${low(i)}, t[${i}] sums a[${i - low(i) + 1}..${i}]`,
  markers: { cursor: 'i', read: '+', write: '✎', done: '✓' },
  states: {
    active: 'where i points now',
    compare: 'read',
    swap: 'written',
    path: 'already touched',
    frontier: '',
    visited: '',
    sorted: '',
  },
  legend: {
    cursor: 'i Where i points after a jump',
    read: '+ Read into the sum',
    write: '✎ Written',
    path: '✓ Touched by this operation',
  },
  stats: {
    reads: 'Cells of t read (this operation)',
    writes: 'Cells of t written (this operation)',
    sum: 'Sum',
  },
  /**
   * What the same operation costs without a Fenwick tree: reading a plain array, or rewriting a
   * prefix-sum array after a change.
   * @param {FenwickOp | null} op @param {number} n
   */
  plainCost(op, n) {
    if (op === null) return { label: 'Without the tree', cost: '—' };
    if (op.type === 'add') {
      return { label: 'Prefix-sum array would rewrite', cost: String(n - op.i + 1) };
    }
    if (op.type === 'prefix') return { label: 'Plain array would read', cost: String(op.i) };
    return { label: 'Plain array would read', cost: String(op.r - op.l + 1) };
  },
  /** @param {FenwickFrame} f */
  sumShown: (f) => (f.result !== null ? signed(f.result) : f.target !== null ? signed(f.sum) : '—'),
  practiceTitle: 'Check yourself',
  /** @param {FenwickFrame} f @param {number} n */
  describe(f, n) {
    switch (f.kind) {
      case 'start':
        return `All ${plural(n, 'cell')} of t start at 0. The build pushes each cell into its parent once.`;
      case 'build-self':
        return `t[${f.cursor}] gets a[${f.cursor}] = ${signed(f.a[f.cursor])}, so now t[${f.cursor}] = ${signed(f.t[f.cursor])}.`;
      case 'build-push':
        return `Parent of ${f.from} is ${f.from} + lowbit(${f.from}) = ${f.to}: t[${f.to}] gains t[${f.from}] and becomes ${signed(f.t[f.to])}.`;
      case 'add-start':
        return `add(${f.cursor}, ${signed(/** @type {{delta: number}} */ (f.op).delta)}): a[${f.cursor}] changes, so every cell whose block contains ${f.cursor} must change too.`;
      case 'add-visit':
        return `t[${f.cursor}] covers a[${f.cursor - low(f.cursor) + 1}..${f.cursor}], which contains the changed value. Add ${plusMinus(/** @type {{delta: number}} */ (f.op).delta)}: t[${f.cursor}] = ${signed(f.t[f.cursor])}.`;
      case 'add-jump':
        return f.to > n
          ? `i = ${f.from} + ${low(f.from)} = ${f.to}, past n = ${n}, so the update stops after ${plural(f.writes, 'write')}.`
          : `Add the lowest bit: i = ${f.from} + ${low(f.from)} = ${f.to}, the next cell whose block contains the change.`;
      case 'query-start':
        return f.target === 0
          ? `prefix(0) is empty, so its sum is 0 and no cell is read.`
          : `prefix(${f.target}): start with sum = 0 and i = ${f.target}.`;
      case 'query-visit':
        return `t[${f.cursor}] sums a[${f.cursor - low(f.cursor) + 1}..${f.cursor}], ${signed(f.t[f.cursor])}. Running sum = ${signed(f.sum)}.`;
      case 'query-jump':
        return f.to === 0
          ? `Clear the lowest bit: i = ${f.from} − ${low(f.from)} = 0, so the prefix is complete.`
          : `Clear the lowest bit: i = ${f.from} − ${low(f.from)} = ${f.to}, the end of the part still missing, a[1..${f.to}].`;
      case 'query-end':
        return `prefix(${f.target}) = ${signed(f.sum)}.`;
      case 'range-end': {
        const op = /** @type {{l: number, r: number}} */ (f.op);
        return `a[${op.l}..${op.r}] = prefix(${op.r}) − prefix(${op.l - 1}) = ${signed(/** @type {number} */ (f.upper))} − ${signed(f.sum)} = ${signed(/** @type {number} */ (f.result))}, reading ${plural(f.reads, 'cell')} of t.`;
      }
      case 'done':
        return `Done: the operations read ${plural(f.totalReads, 'cell')} and wrote ${plural(f.totalWrites, 'cell')} of t in total, after a build of ${plural(f.buildSteps, 'addition')}.`;
    }
  },
  takeaways: [
    'lowbit(i) = i & −i is the lowest set bit of i. t[i] stores the sum of a[i − lowbit(i) + 1..i], so odd cells hold one value and t[8] holds eight.',
    'prefix(i) adds t[i] and clears the lowest bit, which moves to the block just before the one read. It takes one step per set bit of i.',
    'add(i, delta) adds delta to t[i] and adds the lowest bit, which moves to the next block that contains i. The lowest bit grows every time, so there are at most ⌊log₂ n⌋ + 1 steps.',
    'A range sum is prefix(r) − prefix(l − 1). That subtraction is why this works for sum but not directly for min or max, which have no inverse.',
    'Try the prefix and update of index 8 on 8 values: prefix(8) reads only t[8], because 8 = 1000₂ has one set bit. Then try index 7 = 0111₂, which reads 3 cells, and compare with add at 1, which writes 4.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Build by pushing to parents', 'O(n)', 'Each cell adds itself once to its one parent.'],
    ['prefix(i)', 'O(log n)', 'One step per set bit of i, at most ⌊log₂ n⌋ + 1.'],
    ['add(i, delta)', 'O(log n)', 'The lowest bit grows on every jump, until i passes n.'],
    ['rangeSum(l, r)', 'O(log n)', 'Two prefix walks and one subtraction.'],
    ['Memory', 'O(n)', 'One array of n cells: no pointers and no extra levels.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many values does t[12] sum?',
      unit: 'values',
      answer: 4,
      hints: ['12 = 1100₂. Find its lowest set bit.'],
      solution: 'lowbit(12) = 4, so t[12] sums the 4 values a[9..12].',
    },
    {
      type: 'number',
      prompt: 'With a = [3, 1, 4, 1, 5, 9, 2, 6] (a[1] = 3), what does t[6] hold?',
      answer: 14,
      hints: ['6 = 110₂, so lowbit(6) = 2 and the block has two values.', 'It covers a[5..6].'],
      solution: 't[6] = a[5] + a[6] = 5 + 9 = 14.',
    },
    {
      type: 'number',
      prompt: 'Same array. What is the range sum of a[3..7]?',
      answer: 21,
      hints: [
        'Use prefix(7) − prefix(2).',
        'prefix(7) = t[7] + t[6] + t[4] = 2 + 14 + 9, and prefix(2) = t[2].',
      ],
      solution:
        'prefix(7) = 25 and prefix(2) = 4, so the sum is 25 − 4 = 21, which is 4 + 1 + 5 + 9 + 2.',
    },
    {
      type: 'number',
      prompt: 'How many cells of t does prefix(13) read?',
      unit: 'cells',
      answer: 3,
      hints: ['Write 13 in binary and count the set bits.'],
      solution: '13 = 1101₂ has three set bits: it reads t[13], t[12] and t[8], then i reaches 0.',
    },
    {
      type: 'order',
      prompt: 'Put the cells that add(5, delta) writes in order, for n = 16.',
      items: ['t[16]', 't[6]', 't[8]', 't[5]'],
      answer: [3, 1, 2, 0],
      hints: ['Start at i = 5 and keep adding lowbit(i).'],
      solution:
        '5 + 1 = 6, 6 + 2 = 8, 8 + 8 = 16, and 16 + 16 = 32 is past n. So the order is t[5], t[6], t[8], t[16].',
    },
    {
      type: 'choice',
      prompt: 'Why does a plain Fenwick tree not answer range minimum on any a[l..r]?',
      options: [
        'Minimum has no inverse, so prefix(r) and prefix(l − 1) cannot be subtracted',
        'lowbit does not work on negative values',
        'The array would need 2n cells',
        'Minimum takes more than O(1) to compute',
      ],
      answer: 0,
      hints: ['What step turns two prefix answers into a range answer?'],
      solution:
        'A range sum subtracts prefix(l − 1) from prefix(r). Knowing the minimum of a longer prefix and of a shorter one does not give the minimum of the part between, so it needs another structure.',
    },
  ],
  nextTeaser:
    'Next up: Segment tree, a real tree of ranges that merges with any associative function, so range minimum works with updates too.',
};
