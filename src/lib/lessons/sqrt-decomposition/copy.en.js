/** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').BlockFrame} BlockFrame */
/** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').BlockOp} BlockOp */
/** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').MoFrame} MoFrame */
/** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').MoQuery} MoQuery */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

/** A signed number with a Unicode minus. @param {number} x */
const show = (x) => (x < 0 ? `−${-x}` : String(x));

export const en = {
  slug: 'sqrt-decomposition',
  topic: 'range-queries',
  level: 'Advanced',
  title: 'Sqrt decomposition and Mo’s algorithm',
  intro:
    'Sqrt decomposition splits an array into blocks of about √n cells and stores one answer per block, so a range query reads a few loose cells and a few whole blocks: O(√n) with almost no code. Mo’s algorithm uses the same blocks in another way. When all queries are known in advance, it reorders them so one sliding window can answer them all with little movement.',
  summary:
    'Answer range queries through blocks of about √n cells, then reorder offline queries with Mo’s algorithm to keep a sliding window’s moves small.',
  instruction:
    'In Blocks, click two cells (or type l and r) to run a query, and watch it read loose cells at the ends and whole blocks in between. Change the block size and watch the worst case climb as s moves far from √n in either direction. In Mo’s algorithm, step through the window and compare the sorted moves with the typed order.',
  modeLabel: 'Technique',
  modes: { blocks: 'Blocks', mo: 'Mo’s algorithm' },
  valuesLabel: 'Values',
  blockLabel: 'Block size s',
  rootButton: 'Use ⌊√n⌋',
  lLabel: 'From l',
  rLabel: 'To r',
  queryButton: 'Query sum',
  indexLabel: 'Index i',
  valueLabel: 'New value',
  setButton: 'Set a[i]',
  undo: 'Undo last',
  reset: 'Reset',
  queriesLabel: 'Queries (l r, …)',
  presetLabel: 'Query set',
  presetPlaceholder: 'Load a query set…',
  presets: { zigzag: 'Jumping left and right', nested: 'Nested ranges' },
  valueErrors: {
    format: () => 'Type whole numbers separated by commas or spaces, for example 3, −1, 4.',
    range: () => 'Every value must be from −99 to 99.',
    /** @param {number} max */
    count: (max) => `Type from 1 to ${max} values.`,
  },
  queryErrors: {
    format: () => 'Write each query as two whole numbers “l r”, separated by commas.',
    /** @param {number} n */
    range: (n) => `Each query needs 0 ≤ l ≤ r ≤ ${n - 1}.`,
    count: () => 'Use from 1 to 6 queries.',
  },
  /** @param {number} n */
  blockError: (n) => `The block size must be a whole number from 1 to ${n}.`,
  /** @param {number} n */
  rangeError: (n) => `l and r must be whole numbers with 0 ≤ l ≤ r ≤ ${n - 1}.`,
  /** @param {number} n */
  indexError: (n) => `The index must be a whole number from 0 to ${n - 1}.`,
  valueError: 'The new value must be a whole number from −99 to 99.',
  logFull: 'The log is full (8 operations). Undo or reset to continue.',
  pickHint: 'Click a cell to start a query range, then another to run it. Enter works too.',
  /** @param {number} i */
  pickFirst: (i) => `Range starts at ${i}. Pick the cell where it ends.`,
  arrayTitle: 'Array a, split into blocks',
  /** @param {number} s */
  arrayAria: (s) => `Array a, index 0 first, split into blocks of ${s}.`,
  sumsTitle: 'Block sums: one stored sum per block',
  sumsAria: 'Block sums, block 0 first',
  /** @param {number} b */
  blockName: (b) => `B${b}`,
  /** @param {number} i @param {number} v @param {number} b */
  cellLabel: (i, v, b) => `a[${i}] = ${show(v)}, in block ${b}`,
  /** @param {number} b @param {number} v */
  sumLabel: (b, v) => `Block ${b} sum = ${show(v)}`,
  /** @param {number} n @param {number} s @param {number} worst */
  tradeOff: (n, s, worst) =>
    `With n = ${n} and s = ${s}, the costliest range needs ${worst} reads, counting its loose cells and whole blocks.`,
  show,
  /** @param {BlockOp} op */
  opChip: (op) => (op.type === 'query' ? `sum(${op.l}, ${op.r})` : `set(${op.i}, ${show(op.x)})`),
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'running now',
  markers: {
    write: '✎',
    read: '?',
    cell: '·',
    block: '✓',
    add: '+',
    remove: '−',
    left: 'L',
    right: 'R',
  },
  legend: {
    range: 'In the query range, not read yet',
    read: '? Reading this cell',
    cell: '· Read as a loose cell',
    block: '✓ Covered by a stored block sum',
    write: '✎ Just written',
    window: 'In the window',
    added: '+ Just added',
    removed: '− Just removed',
  },
  stats: {
    reads: 'Reads (this query)',
    scan: 'Reads by scanning',
    total: 'Running total',
    worst: 'Worst reads at this s',
    moves: 'Moves so far',
    distinct: 'Distinct in the window',
    sortedMoves: 'Total moves, sorted',
    inputMoves: 'Total moves, typed order',
  },
  pending: '—',
  /** @param {number} s */
  moArrayTitle: (s) => `Array a, the window, and blocks of s = ⌊√n⌋ = ${s}`,
  /** @param {number} l @param {number} r */
  moArrayAria: (l, r) =>
    r < l ? 'Array a. The window is empty.' : `Array a. The window covers cells ${l} to ${r}.`,
  /** @param {number} k */
  targetWindow: (k) => `Q${k + 1}`,
  queriesTitle: 'Queries, in the order they run',
  countsTitle: 'Values in the window, value × count',
  /** @param {number} k @param {MoQuery} q @param {number | null} answer @param {number} s */
  queryChip: (k, q, answer, s) =>
    `Q${k + 1} [${q.l}, ${q.r}] B${Math.floor(q.l / s)}${answer === null ? '' : ` = ${answer}`}`,
  /** @param {number} v @param {number} c */
  countChip: (v, c) => `${show(v)} × ${c}`,
  practiceTitle: 'Check yourself',
  /** @param {BlockFrame} f */
  describeBlocks(f) {
    const s = f.blockSize;
    const op = f.op;
    switch (f.kind) {
      case 'start':
        return `Split ${plural(f.items.length, 'value')} into blocks of ${s} and add up each block.`;
      case 'build':
        return `a[${f.at}] = ${show(f.items[f.at])} is in block ${f.block}, whose sum is now ${show(f.sums[f.block])}.`;
      case 'query-start':
        return `Sum of a[${op?.type === 'query' ? op.l : 0}..${op?.type === 'query' ? op.r : 0}]: start at the left end with total 0.`;
      case 'read-cell':
        return `Cell ${f.at} cannot use a whole block here, so read it: ${show(f.items[f.at])}. Total = ${show(f.total)}.`;
      case 'read-block':
        return `Block ${f.block} fits inside the range, so read its stored sum ${show(f.sums[f.block])} instead of ${plural(Math.min(s, f.items.length - f.block * s), 'cell')}. Total = ${show(f.total)}.`;
      case 'answer':
        return `The sum is ${show(/** @type {number} */ (f.result))}, from ${plural(f.reads, 'read')} instead of ${f.scan}.`;
      case 'set':
        return `a[${f.at}] becomes ${show(f.items[f.at])}, and block ${f.block}’s sum shifts to ${show(f.sums[f.block])}. Two writes, whatever the array size.`;
      case 'done':
        return `Done. Try another block size: the worst case at this one is ${plural(f.worst, 'read')}.`;
    }
  },
  /** @param {MoFrame} f */
  describeMo(f) {
    const k = f.current >= 0 ? f.order[f.current] : -1;
    const q = k >= 0 ? f.queries[k] : null;
    switch (f.kind) {
      case 'start':
        return `${plural(f.queries.length, 'query', 'queries')} over ${plural(f.items.length, 'value')}, all known in advance. The window starts empty.`;
      case 'sort':
        return `Sort by the block of l, then by r. Now the left end stays inside one block at a time, and the right end only grows within that block.`;
      case 'query-start':
        return `Next is Q${k + 1}, [${q?.l}, ${q?.r}]. Slide the window there one cell at a time.`;
      case 'add-left':
      case 'add-right':
        return `Add a[${f.at}] = ${show(f.items[f.at])}. Distinct values in the window: ${f.distinct}.`;
      case 'remove-left':
      case 'remove-right':
        return `Remove a[${f.at}] = ${show(f.items[f.at])}. Distinct values in the window: ${f.distinct}.`;
      case 'answer':
        return `The window matches Q${k + 1}: it holds ${plural(f.distinct, 'distinct value')}. That is stored in Q${k + 1}’s own slot.`;
      case 'done':
        return `Done: ${plural(f.moves, 'move')} in sorted order, against ${f.inputMoves} in the typed order. Answers: ${f.answers.join(', ')}, in the typed order.`;
    }
  },
  takeaways: [
    'A query reads at most 2(s − 1) loose cells and ⌈n / s⌉ whole blocks. Balancing the two gives s ≈ √n and O(√n) per query. A point update changes one cell and one block sum.',
    'The structure is easy to adapt: a block can store a sum, a minimum, or a sorted copy. It is slower than a segment tree’s O(log n), but it handles questions with no simple merge.',
    'Mo’s algorithm is offline: it needs all queries first, then sorts them by (⌊l / s⌋, r). Within a block the right end only moves right, and the left end moves at most s per query.',
    'With O(1) add and remove and s ≈ √n, the window’s total work is O((n + q)·√n). Answers go back to each query’s original slot, so the reordering stays hidden from the user.',
    'Try the block size at 1 and then at n on 16 values: the worst case is 16 and then 15 reads, against 8 at s = 4. (s = 3 needs only 7: small constants shift the exact best, not the O(√n) shape.) In Mo’s algorithm, compare both move counts on “Jumping left and right” and on “Nested ranges”.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Build blocks', 'O(n)', 'Each value is added to one block sum.'],
    ['Range query', 'O(√n)', 'At most 2(s − 1) loose cells plus ⌈n / s⌉ blocks, with s ≈ √n.'],
    ['Point update', 'O(1)', 'One cell and one block sum change.'],
    ['Mo: sort', 'O(q log q)', 'A comparison sort on (⌊l / s⌋, r).'],
    [
      'Mo: all moves',
      'O((n + q)·√n)',
      'Within a block the left end moves at most s per query, and the right end at most n per block, over about √n blocks.',
    ],
    ['Memory', 'O(n)', 'The array and √n block sums, or the array and the value counts for Mo.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'What block size does the s ≈ √n rule give for n = 100?',
      answer: 10,
      hints: ['Loose cells grow with s and whole blocks with n / s. They match near √n.'],
      solution:
        '√100 = 10, which gives 10 blocks of 10 cells: at most 18 loose cells and 10 stored sums.',
    },
    {
      type: 'number',
      prompt:
        'a = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3], s = 4. How many reads does the query on a[2..13] make?',
      unit: 'reads',
      answer: 6,
      hints: [
        'Blocks are [0, 3], [4, 7], [8, 11] and [12, 15].',
        'Loose cells 2 and 3, whole blocks B1 and B2, loose cells 12 and 13.',
      ],
      solution: '2 loose cells + 2 blocks + 2 loose cells = 6 reads, against 12 by scanning.',
    },
    {
      type: 'number',
      prompt: 'Same query. What is the sum of a[2..13]?',
      answer: 64,
      hints: ['B1 holds 22 and B2 holds 21.', 'Add the loose cells 4 and 1, and 9 and 7.'],
      solution: '4 + 1 + 22 + 21 + 9 + 7 = 64.',
    },
    {
      type: 'number',
      prompt: 'Same array. After setting a[5] = 0, what does block 1’s sum hold?',
      answer: 13,
      hints: ['Block 1 held 22, and a[5] was 9.'],
      solution: 'The update adds x − a[i] = 0 − 9 to the block sum: 22 − 9 = 13.',
    },
    {
      type: 'number',
      prompt: 'For n = 16 and s = 4, what is the largest number of reads any range can need?',
      unit: 'reads',
      answer: 8,
      hints: ['Try a range that starts just after a block start and ends just before a block end.'],
      solution:
        'The range [1, 14] reads loose cells 1, 2, 3, then B1 and B2, then loose cells 12, 13, 14: 8 reads. The widget’s Worst reads card shows the same.',
    },
    {
      type: 'order',
      prompt: 'With s = 4, put these queries in the order Mo’s algorithm runs them.',
      items: ['[9, 10]', '[1, 7]', '[2, 3]', '[5, 6]'],
      answer: [2, 1, 3, 0],
      hints: [
        'Their left ends are in blocks 2, 0, 0 and 1.',
        'Within block 0, the smaller r goes first.',
      ],
      solution:
        'Block 0 comes first, sorted by r: [2, 3], then [1, 7]. Block 1 has [5, 6], and block 2 has [9, 10].',
    },
    {
      type: 'choice',
      prompt: 'When can Mo’s algorithm not be used directly?',
      options: [
        'When each query must be answered before the next one is revealed',
        'When the array holds duplicates',
        'When the question is the count of distinct values',
        'When there are more queries than cells',
      ],
      answer: 0,
      hints: ['What does the first step need to have in hand?'],
      solution:
        'Mo’s algorithm sorts all queries first, so it is offline. A query that arrives only after the previous answer cannot be reordered.',
    },
    {
      type: 'text',
      prompt: 'With s ≈ √n, what is the total cost of the window’s moves in O notation?',
      accept: [
        'O((n+q)√n)',
        'O((n + q)·√n)',
        'O((n+q)sqrt(n))',
        'O((n+q)*sqrt(n))',
        'O((n + q) sqrt n)',
        'O((n+q)*√n)',
        'O((n+q)·sqrt(n))',
        'O((n+q)·sqrt n)',
        'O(√n(n+q))',
        'O(sqrt(n)(n+q))',
        'O(n√n+q√n)',
        '(n+q)√n',
        '(n+q)sqrt(n)',
        '(n+q) sqrt n',
      ],
      hints: [
        'The left end moves about √n per query. The right end sweeps n per block, over about √n blocks.',
      ],
      solution: 'Left end: q·√n. Right end: n·√n. So the total is O((n + q)·√n).',
    },
  ],
  nextTeaser:
    'Next up: Practice: range query problems, where you build a workload and compare what each structure would cost on it.',
};
