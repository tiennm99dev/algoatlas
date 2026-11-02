/** @typedef {import('$lib/algo-engine/practice-range-queries.js').StructureId} StructureId */
/** @typedef {import('$lib/algo-engine/practice-range-queries.js').WorkloadFrame} WorkloadFrame */
/** @typedef {import('$lib/algo-engine/practice-range-queries.js').WorkloadOp} WorkloadOp */

/** @type {Record<StructureId, string>} */
const NAMES = {
  plain: 'Plain array',
  prefix: 'Prefix sums',
  sparse: 'Sparse table',
  fenwick: 'Fenwick tree',
  segment: 'Segment tree',
  sqrt: 'Sqrt blocks',
};

const IDS = /** @type {StructureId[]} */ (Object.keys(NAMES));

/** A count with thousands separators. @param {number} x */
const count = (x) => x.toLocaleString('en-US');

/** @param {string[]} parts */
const list = (parts) =>
  parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;

/** @param {WorkloadOp} op */
function opText(op) {
  if (op.type === 'set') return `Set a[${op.i}] = ${op.v}`;
  return `${op.type === 'sum' ? 'Sum' : 'Minimum'} of a[${op.l}..${op.r}]`;
}

export const en = {
  slug: 'practice-range-queries',
  topic: 'range-queries',
  level: 'Advanced',
  title: 'Practice: range query problems',
  intro:
    'No range query structure wins everywhere. The right one depends on the mix of operations: whether the array changes, whether you need sums or minimums, how long the ranges are and how many queries there will be. Build a workload here, run it through six structures, and count what each one really touches.',
  summary:
    'Build a workload of range sums, range minimums and point sets, and compare what a plain array, prefix sums, a sparse table, a Fenwick tree, a segment tree and sqrt blocks each spend on it.',
  instruction:
    'Pick a preset or set your own counts and array size, and the totals appear at once. Step back or rewind to watch one operation at a time, and type your own operations to probe a single case. Use the widget to answer the questions below.',
  sizeLabel: 'Array size n',
  sumsLabel: 'Range sums',
  minsLabel: 'Range mins',
  setsLabel: 'Point sets',
  rangesLabel: 'Range size',
  rangeSizes: { any: 'Any', short: 'Up to 8', long: 'At least n / 2' },
  newRanges: 'New ranges',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    staticSums: 'Sums, no changes',
    sumsAndSets: 'Sums and sets',
    staticMins: 'Mins, no changes',
    minsAndSets: 'Mins and sets',
    everything: 'Sums, mins and sets',
    shortRanges: 'Short ranges and sets',
  },
  opsLabel: 'Operations',
  opsAria:
    'Operations: s for a range sum, m for a range minimum, each with a range like 2-9, or u for a set, like u4=50.',
  opsHelp: 's sum, m min, u set, 0-based and inclusive: s2-9 m0-5 u4=50',
  run: 'Run',
  sizeError: 'The array size must be a whole number from 4 to 1,024.',
  sizeTooSmall:
    'Some of these typed operations reach past that size. Change them first, or load a preset.',
  countError: 'Each count must be a whole number, with 1 to 300 operations in total.',
  opErrors: {
    empty: 'Type at least one operation.',
    format: 'Write each operation like s2-9 (sum), m2-9 (minimum) or u4=50 (set).',
    count: 'Use at most 300 operations.',
    range: 'A range must run left to right and every index must be inside the array.',
    value: 'A new value must be from 0 to 99.',
  },
  structures: NAMES,
  costTitle: 'Touches so far',
  costHelp:
    'A touch is one stored number read or written, or one tree node visited. Looking at the current a[i] is free.',
  barBuild: 'building',
  barWork: 'operations',
  barCut: 'bar cut off at three times the cheapest total',
  barCutMark: '»',
  cheapestMark: '★',
  cheapestWord: 'cheapest',
  outMark: '✕',
  outWord: 'out',
  /** @type {Record<StructureId, string>} */
  outWhy: {
    plain: '',
    prefix: 'a minimum cannot be subtracted away',
    sparse: 'its overlapping blocks would count cells twice in a sum',
    fenwick: 'a plain Fenwick tree only subtracts prefixes',
    segment: '',
    sqrt: '',
  },
  stats: {
    thisOp: 'this operation',
    worst: 'worst',
    build: 'build',
    work: 'operations',
    slots: 'numbers stored',
    size: 'Array size',
    ops: 'Operations',
    answer: 'Answer',
    cheapest: 'Cheapest',
  },
  noValue: '—',
  rangeTitle: 'Where this operation lands',
  rangeIdle: 'No operation on this step.',
  rangeRead: 'cells a query covers',
  rangeWrite: 'cell a set changes',
  /** @param {WorkloadOp} op */
  rangeCaption(op) {
    if (op.type === 'set') return `${opText(op)}: one cell changes.`;
    return `${opText(op)}: ${count(op.r - op.l + 1)} of the cells.`;
  },
  /** @param {WorkloadOp} op @param {number} n */
  rangeLabel: (op, n) => `${opText(op)} in an array of ${count(n)} cells.`,
  opsTitle: 'Workload, around this step',
  opsEmpty: 'none',
  opsHotLabel: 'current operation',
  /** @param {WorkloadFrame} f */
  describe(f) {
    const stats = f.stats;
    if (f.kind === 'start') {
      return `${count(f.n)} cells and nothing built yet. Step forward to build every structure.`;
    }
    if (f.kind === 'build') {
      return `Built, in touches: ${IDS.map((id) => `${NAMES[id]} ${count(stats[id].build)}`).join(', ')}.`;
    }
    if (f.kind === 'done') {
      const best = stats[f.cheapest[0]].total;
      const out = IDS.filter((id) => stats[id].out).map((id) => NAMES[id]);
      const left = out.length > 0 ? ` Out of the running: ${list(out)}.` : '';
      return `Cheapest: ${list(f.cheapest.map((id) => NAMES[id]))} with ${count(best)} ${best === 1 ? 'touch' : 'touches'}.${left}`;
    }
    const op = /** @type {WorkloadOp} */ (f.op);
    const head = f.truth === null ? `${opText(op)}.` : `${opText(op)} is ${count(f.truth)}.`;
    const spent = IDS.filter((id) => !stats[id].out).map(
      (id) => `${NAMES[id]} ${count(stats[id].cost)}`,
    );
    const dropped =
      f.dropped.length > 0
        ? ` ${list(f.dropped.map((id) => NAMES[id]))} cannot answer it and ${f.dropped.length === 1 ? 'drops' : 'drop'} out.`
        : '';
    return `${head} Touches: ${spent.join(', ')}.${dropped}`;
  },
  takeaways: [
    'Ask two questions first. Does the array change? Do you need sums, minimums or both? Prefix sums and a sparse table are hard to beat on an array that never changes, and sets ruin either of them.',
    'For sums with point sets, choose a Fenwick tree. It costs O(log n) like a segment tree but walks short chains, so it touches far less, and it needs one small array and a few lines of code.',
    'For range minimums with sets, or anything a Fenwick tree cannot subtract, choose a segment tree. It works with any merge function, and one tree can hold the sum and the minimum together.',
    'Constants and build costs matter. On a small array or short ranges a plain array can beat all of them, and a few queries may not repay an expensive build. A big-O class says how the cost grows, not who wins at your size.',
    'Load “Mins and sets” at n = 1,024 and note the winner, then lower n to 16. Then put n back to 1,024, load “Sums and sets” and move sums into sets: near 50 sums, sqrt blocks pass the Fenwick tree.',
  ],
  complexityHead: ['Structure', 'Cost', 'Why'],
  complexity: [
    ['Plain array', 'No build, query O(n), set O(1)', 'It reads every cell of the range.'],
    [
      'Prefix sums',
      'Build O(n), sum O(1), set O(n)',
      'A sum subtracts two entries, and a set shifts every later entry.',
    ],
    [
      'Sparse table',
      'Build O(n log n), min O(1), set O(n log n)',
      'Two overlapping blocks answer a minimum; the simple repair after a set is a full rebuild.',
    ],
    [
      'Fenwick tree',
      'Build O(n), sum O(log n), set O(log n)',
      'Each walk clears or adds the lowest set bit of the index.',
    ],
    [
      'Segment tree',
      'Build O(n), any query O(log n), set O(log n)',
      'A range splits into at most two nodes per level, and a set rewrites one root path.',
    ],
    [
      'Sqrt blocks',
      'Build O(n), any query O(√n), set O(1) for sums, O(√n) for mins',
      'A query reads loose cells and whole blocks; a block’s minimum must be reread after a set.',
    ],
    [
      'Memory beside the array',
      'From none to O(n log n)',
      'Sqrt blocks keep about √n numbers, prefix sums and both trees O(n), and a sparse table O(n log n).',
    ],
  ],
  nextTeaser:
    'Next up: Tries, a tree of characters where every word shares its path with the words that start the same way.',
  practiceTitle: 'Practice problems',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Keep n = 1,024 and load “Sums and sets”, which has 150 of each. How many touches does the Fenwick tree spend in total, build included?',
      answer: 4435,
      unit: 'touches',
      hints: ['Jump to the last step and read the number on the Fenwick tree’s card.'],
      solution:
        'The build takes 2,047 touches and the 300 operations take 2,388, which gives 4,435. That is about 8 touches per operation, close to log₂ 1,024 = 10.',
    },
    {
      type: 'number',
      prompt:
        'On the same workload, how many more touches does the segment tree spend than the Fenwick tree? Both cost O(log n) per operation.',
      answer: 4154,
      unit: 'touches',
      hints: [
        'Subtract the two totals on the last step.',
        'Their builds cost the same here, so all the difference comes from the operations.',
      ],
      solution:
        'The segment tree totals 8,589 and the Fenwick tree 4,435, a difference of 4,154. The growth class is the same, but a segment tree query visits many more nodes than a Fenwick chain has cells.',
    },
    {
      type: 'choice',
      prompt: 'Keep n = 1,024 and load “Mins and sets”. Which structure is cheapest?',
      options: ['Plain array', 'Sparse table', 'Segment tree', 'Sqrt blocks'],
      answer: 2,
      hints: [
        'Prefix sums and the Fenwick tree are out. Compare the totals on the remaining four cards.',
      ],
      solution:
        'The segment tree spends 8,589 touches and sqrt blocks 12,404. The plain array spends 50,480 on its scans, and the sparse table over 1.3 million because each of the 150 sets rebuilds all 9,228 cells.',
    },
    {
      type: 'choice',
      prompt:
        'Keep “Mins and sets” loaded and lower n to 16. Which structure is cheapest now, and why?',
      options: [
        'Segment tree, because O(log n) always beats O(n)',
        'Plain array, because a scan of a few cells costs less than walking the tree',
        'Sparse table, because its queries read two cells',
        'Sqrt blocks, because every block is a single cell',
      ],
      answer: 1,
      hints: ['Read the totals at n = 16. Which card has the star?'],
      solution:
        'The plain array totals 1,075 touches, sqrt blocks 1,455 and the segment tree 2,299. On 16 cells a scan averages about 6 reads, while a segment tree query visits about 10 nodes. Big-O describes growth, not small inputs.',
    },
    {
      type: 'multi',
      prompt:
        'Keep n = 1,024 and load “Sums, mins and sets”. Which structures stay in the running until the end?',
      options: [
        'Plain array',
        'Prefix sums',
        'Sparse table',
        'Fenwick tree',
        'Segment tree',
        'Sqrt blocks',
      ],
      answers: [0, 4, 5],
      hints: ['A structure drops out at the first query it cannot answer. Look for the ✕ marks.'],
      solution:
        'Prefix sums and the Fenwick tree cannot answer a range minimum, and the sparse table’s overlapping blocks cannot add a sum. The plain array, the segment tree and sqrt blocks handle both, and the segment tree is the cheapest of them.',
    },
    {
      type: 'number',
      prompt:
        'Keep n = 1,024 and type the single operation u0=5. How many touches does the Fenwick tree spend on it?',
      answer: 11,
      unit: 'touches',
      hints: [
        'The tree is 1-based inside, so index 0 is its position 1. Step to the operation and read “this operation”.',
        'Each jump adds the lowest set bit: 1, 2, 4, 8, …',
      ],
      solution:
        'The walk visits 1, 2, 4, 8, 16, 32, 64, 128, 256, 512 and 1,024: 11 writes. Prefix sums spend 1,024 writes on the same set, because every entry after the first changes.',
    },
    {
      type: 'text',
      prompt:
        'Keep n = 1,024 and load “Short ranges and sets”, where no range is longer than 8 cells. Which structure wins?',
      accept: ['plain array', 'array', 'the plain array', 'a plain array', 'plain'],
      hints: ['Compare what a scan of at most 8 cells costs with what a tree walk costs.'],
      solution:
        'The plain array totals 863 touches: at most 8 reads per query and one write per set, with nothing to build. Every other structure still standing spends more on its build alone.',
    },
  ],
};
