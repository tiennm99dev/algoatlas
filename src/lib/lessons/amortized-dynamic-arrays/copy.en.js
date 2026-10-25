/** @typedef {import('$lib/algo-engine/amortized-dynamic-arrays.js').AppendFrame} AppendFrame */
/** @typedef {'accounting' | 'aggregate'} AppendMethod */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

/** Whole numbers as they are, others to two decimals. @param {number} x */
const num = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2));

/** A signed coin count. @param {number} b */
const coins = (b) => (b < 0 ? `−${-b}` : String(b));

export const en = {
  slug: 'amortized-dynamic-arrays',
  topic: 'arrays-strings',
  level: 'Intermediate',
  title: 'Amortized analysis of dynamic arrays',
  intro:
    'A dynamic array that doubles when full makes most appends cost 1 step, but the append that triggers a resize copies the whole array. Amortized analysis shows that the expensive appends are rare enough that any n appends cost under 3n steps in total, so each append is O(1) amortized. No probability is involved: the bound holds for every run.',
  summary:
    'Charge every append a fixed number of coins, spend one coin per write and per copy, and see that a charge of 3 keeps the bank out of debt forever while the total cost stays under 3n.',
  instruction:
    'Set the number of appends n and the charge c per append, then step. Each write and each copy takes one coin from the bank. Try c = 2 and watch the bank go into debt on a resize; c = 3 never does. Switch to Aggregate to add up the same costs directly.',
  appendsLabel: 'Appends n',
  chargeLabel: 'Charge c',
  appendsError: 'n must be a whole number from 1 to 64.',
  chargeError: 'c must be a whole number from 1 to 4.',
  methodLegend: 'Method',
  methods: /** @type {Record<AppendMethod, string>} */ ({
    accounting: 'Accounting',
    aggregate: 'Aggregate',
  }),
  arrayTitle: 'Array A',
  newBlockTitle: 'Array A, copying into a block twice the size',
  oldBlockTitle: 'Old block',
  arrayAria: 'Slots of the array, index 0 first',
  oldAria: 'Slots of the old block being copied, index 0 first',
  pointerSize: 'size',
  pointerI: 'i',
  spare: '·',
  /** @param {number} i @param {number | null} v @param {string} state */
  cellLabel: (i, v, state) =>
    `Index ${i}: ${v === null ? 'spare slot' : v}${state ? `, ${state}` : ''}`,
  states: { read: 'read for copying', written: 'just written, 1 coin' },
  legend: {
    read: 'Read from the old block',
    written: 'Written now (spends 1 coin)',
    spare: 'Spare slot (·)',
  },
  bankTitle: 'Coin bank',
  coin: '¢',
  debt: 'In debt',
  chartTitle: 'Cost per append and the bank',
  chartScroller: 'Cost chart, scrolls sideways',
  /** @param {number} done @param {number} n @param {number} total @param {number} bank */
  chartLabel: (done, n, total, bank) =>
    `Bar chart of the actual cost of appends 1 to ${done} of ${n}, total ${total} steps, with a line for the bank, now ${coins(bank)} coins.`,
  chartLegend: {
    cost: 'Actual cost (writes + copies)',
    now: 'Append running now',
    bank: 'Bank after each append',
    charge: 'Charge c per append',
  },
  axisOps: 'Append →',
  stats: {
    op: 'Append',
    opCost: 'Cost this append',
    total: 'Total cost',
    bound: 'Charged so far',
    bank: 'Bank',
    worst: 'Worst single append',
  },
  accounting: {
    title: 'Accounting: charge c, spend 1 per step',
    rule: 'Every append pays c coins into the bank first. Writing the new element spends 1 coin and copying an element during a resize spends 1 coin. If the bank never goes below 0, the real cost is at most the c × n coins charged.',
    /** @param {number} charged @param {number} spent @param {number} bank */
    balance: (charged, spent, bank) =>
      `${charged} charged − ${spent} spent = ${coins(bank)} ${Math.abs(bank) === 1 ? 'coin' : 'coins'}.`,
    ok: 'The bank has never gone below 0, so every append so far is paid for by its charge.',
    /** @param {number} op @param {number} c */
    broke: (op, c) =>
      `The bank first went into debt during append ${op}: a charge of ${c} is too little to prepay the copies.`,
    why: 'Why 3 is enough: each new element pays 1 for its own write and saves 2 — one to copy itself at the next resize, one to copy an older element whose savings are already spent.',
  },
  aggregate: {
    title: 'Aggregate: add up the whole run',
    /** @param {number} done @param {number} writes @param {number[]} resizes @param {number} copies @param {number} total */
    sum: (done, writes, resizes, copies, total) =>
      done === 0
        ? 'Total cost of n appends = n writes + the copies of every resize. Resizes happen at sizes 1, 2, 4, 8, …'
        : `${plural(done, 'append')}: ${plural(writes, 'write')} + copies ${resizes.length ? resizes.join(' + ') : '0'} = ${writes} + ${copies} = ${total} steps.`,
    /** @param {number} done @param {number} total */
    bound: (done, total) =>
      done === 0
        ? 'The copies 1 + 2 + 4 + … stop below 2n, so the total is below 3n.'
        : `${total} < 3 × ${done} = ${3 * done}, an average of ${num(total / done)} steps per append.`,
  },
  practiceTitle: 'Check yourself',
  /** @param {AppendFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `An empty dynamic array with capacity 1 and an empty bank. We will run ${plural(f.n, 'append')}, each charged ${plural(f.charge, 'coin')}.`;
      case 'charge':
        return `Append ${f.op}: pay ${plural(f.charge, 'coin')} into the bank, which now holds ${coins(f.bank)}.`;
      case 'allocate':
        return `The array is full (${f.size} of ${f.size}). Allocate a block of ${f.capacity} slots; the ${plural(f.size, 'element')} must be copied across.`;
      case 'copy':
        return `Copy element ${f.at} for 1 coin. Bank: ${coins(f.bank)}${f.bank < 0 ? ' — in debt!' : '.'}`;
      case 'grown':
        return `Resize done: capacity ${f.capacity}, ${plural(f.opCost, 'copy', 'copies')} paid from savings.`;
      case 'write':
        return `Write ${f.cells[f.at]} into A[${f.at}] for 1 coin. Append ${f.op} cost ${plural(f.opCost, 'step')}; the bank holds ${coins(f.bank)}${f.bank < 0 ? ', in debt' : ''}.`;
      case 'done': {
        const worst = f.costs.length ? Math.max(...f.costs) : 0;
        const verdict =
          f.firstDebt < 0
            ? `The bank never went below 0, so c = ${f.charge} pays for every append.`
            : `The bank went into debt on append ${f.firstDebt}, so c = ${f.charge} is not enough.`;
        return `Done: ${plural(f.n, 'append')} cost ${f.total} steps, under 3n = ${3 * f.n}, though one append alone cost ${worst}. ${verdict}`;
      }
    }
  },
  takeaways: [
    'Amortized cost is the total cost of a sequence divided by its length, for the worst sequence. It is a guarantee, not an average over random inputs.',
    'Aggregate method: n appends write n elements and copy 1 + 2 + 4 + … (the powers of 2 below n), less than 2n, so the total is under 3n and each append is O(1) amortized.',
    'Accounting method: charge each append 3 coins. One pays for its write and two are saved for the next resize. The bank never goes negative, so the real total is at most 3n.',
    'Doubling is what makes this work: resizes get twice as far apart as they get twice as expensive. Growing by a constant number of slots makes n appends Θ(n²).',
    'Try n = 64 with c = 2, then c = 3: with 2 the bank goes into debt on append 5; with 3 it drops to exactly 3 coins after every resize but never below 0.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['One append, worst case', 'Θ(n)', 'A full array copies all n elements into the new block.'],
    ['n appends from empty', 'Θ(n) total', 'n writes + 1 + 2 + 4 + … < 2n copies: under 3n.'],
    [
      'One append, amortized',
      'O(1)',
      'A charge of 3 coins pays for every write and copy, with the bank never in debt.',
    ],
    ['Space', 'Θ(n)', 'Capacity is less than 2n; the coins exist only in the analysis.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'A dynamic array starts with capacity 1 and doubles. What is the total cost (writes + copies) of 16 appends?',
      answer: 31,
      unit: 'steps',
      hints: ['Appends 2, 3, 5 and 9 find the array full.', '16 writes plus 1 + 2 + 4 + 8 copies.'],
      solution: '16 writes + 15 copies = 31 steps, under 3 × 16 = 48.',
    },
    {
      type: 'number',
      prompt:
        'With a charge of 3 coins per append, how many coins are left after those 16 appends?',
      answer: 17,
      unit: 'coins',
      hints: ['Coins left = charged − spent.'],
      solution:
        '3 × 16 = 48 coins are charged and 31 are spent, so 17 remain. Set n = 16, c = 3 and check the bank.',
    },
    {
      type: 'number',
      prompt:
        'With a charge of only 2 coins per append, during which append does the bank first go into debt?',
      answer: 5,
      hints: [
        'Track the bank: append 1 leaves 1 coin, append 2 leaves 1, append 3 leaves 0.',
        'Append 5 must copy 4 elements and write 1.',
      ],
      solution:
        'After append 4 the bank holds 1 coin. Append 5 adds 2, making 3, then needs 4 copies and 1 write: 5 coins, so the bank ends at −2.',
    },
    {
      type: 'number',
      prompt: 'What does the most expensive of 33 appends cost?',
      answer: 33,
      unit: 'steps',
      hints: ['The last resize happens at append 33, when the array of 32 is full.'],
      solution:
        'Append 33 copies 32 elements and writes 1: 33 steps. One append can be Θ(n) even though the amortized cost is O(1).',
    },
    {
      type: 'choice',
      prompt: 'What does “append is O(1) amortized” guarantee?',
      options: [
        'Any sequence of n appends costs O(n) in total',
        'Every single append costs O(1)',
        'Appends cost O(1) on average over random inputs',
        'Resizes never happen after the first few appends',
      ],
      answer: 0,
      hints: ['Amortized bounds are about the total of a sequence, with no probability.'],
      solution:
        'It bounds the total: n appends cost at most a constant times n, here under 3n. A single append can still cost Θ(n), and no randomness is assumed.',
    },
  ],
  nextTeaser:
    'Next up: Two pointers, where two indices walk towards each other to find a pair in one pass.',
};
