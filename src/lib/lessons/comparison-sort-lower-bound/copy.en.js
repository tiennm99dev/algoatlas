/** @typedef {import('$lib/algo-engine/comparison-sort-lower-bound.js').TreeFrame} TreeFrame */
/** @typedef {import('$lib/algo-engine/comparison-sort-lower-bound.js').DecisionNode} DecisionNode */

const NAMES = ['A', 'B', 'C'];

/** @param {number[]} order */
const chain = (order) => order.map((i) => NAMES[i]).join(' < ');

/** @param {[number, number]} pair */
const question = ([x, y]) => `${NAMES[x]} < ${NAMES[y]}`;

export const en = {
  slug: 'comparison-sort-lower-bound',
  topic: 'sorting',
  level: 'Advanced',
  title: 'Comparison sort lower bound',
  intro:
    'Every sort so far learns about its input only by comparing two items. Draw all the questions it could ask as a binary tree: each inner node is one comparison and each leaf one possible sorted order. Since n items can arrive in n! orders, the tree needs at least n! leaves, so some path is at least log₂ n! deep. That is why no comparison sort beats n log n in the worst case.',
  summary:
    'Walk the decision tree of a comparison sort on three items, count its leaves and depth, and see why every comparison sort needs Ω(n log n) comparisons.',
  instruction:
    'Pick a sort and a hidden input order, then step down the tree: each step asks one question. Click any leaf to make its order the hidden one. Under the tree, change n to see how fast n! and the bound grow.',
  algorithmLabel: 'Sort',
  algorithms: { insertion: 'Insertion sort', selection: 'Selection sort' },
  orderLabel: 'Hidden input order',
  chain,
  treeTitle: 'Decision tree for three items A, B, C',
  /** @param {string} algo @param {number} leaves @param {number} height */
  treeAria: (algo, leaves, height) =>
    `Decision tree of ${algo} on three items: ${leaves} reachable leaves, ${height} comparisons on the longest path.`,
  treeNote:
    'Each circle asks “is x < y?”: left edge yes, right edge no. The number under a question counts the input orders that can still reach it. Leaves list the items smallest first.',
  yes: 'yes',
  no: 'no',
  impossibleLabel: '✕',
  /** @param {DecisionNode} d @param {string} role */
  nodeAria(d, role) {
    const tail = role ? `, ${role}` : '';
    if (d.kind === 'compare' && d.pair)
      return `Question: is ${question(d.pair)}? ${d.possible} orders can reach it${tail}`;
    if (d.kind === 'leaf' && d.order) return `Leaf: ${chain(d.order)}${tail}`;
    return `Impossible leaf: no input order gives these answers${tail}`;
  },
  roles: { current: 'current', path: 'on the path', found: 'the answer' },
  notLeafNotice: 'Click a leaf to pick its order as the hidden input.',
  impossibleNotice: 'No input order reaches this leaf: its answers contradict each other.',
  /** @param {string} order */
  pickedNotice: (order) => `Hidden order set to ${order}. Step down to reach its leaf.`,
  stats: {
    comparisons: 'Comparisons so far',
    possible: 'Orders still possible',
    height: 'Worst case (tree height)',
    leaves: 'Leaves reachable / impossible',
  },
  /** @param {number} reachable @param {number} impossible */
  leavesValue: (reachable, impossible) => `${reachable} / ${impossible}`,
  boundTitle: 'The bound for n items',
  boundN: 'n',
  boundError: 'n must be a whole number from 1 to 20.',
  boundRows: {
    orders: 'Input orders, n!',
    log: 'log₂ n!',
    bound: 'Worst case at least ⌈log₂ n!⌉',
    nlogn: 'n·log₂ n, for scale',
  },
  /** @param {bigint} v */
  bigNumber: (v) => v.toLocaleString('en-US'),
  /** @param {number} v */
  decimal: (v) => v.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
  legend: {
    current: 'Where the walk is',
    path: 'Questions already answered',
    found: 'The leaf reached',
    impossible: 'Impossible leaf',
  },
  markers: { current: '▼', found: '✓', impossible: '✕' },
  /** @param {TreeFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return 'The hidden order is one of 3! = 6. The sort can only ask “is x < y?”, and each answer rules some orders out.';
      case 'compare': {
        const pair = /** @type {[number, number]} */ (f.pair);
        const left =
          f.possible === 1
            ? 'Only 1 order fits now: it is known.'
            : `${f.possible} of 6 orders still fit.`;
        return `Is ${question(pair)}? ${f.answer ? 'Yes' : 'No'}. ${left}`;
      }
      case 'done':
        return f.order
          ? `Leaf reached after ${f.comparisons} ${f.comparisons === 1 ? 'comparison' : 'comparisons'}: the sorted order is ${chain(f.order)}.`
          : 'The walk ended.';
    }
  },
  takeaways: [
    'A comparison sort is a decision tree: the input order decides which answers it gets, and so which leaf it ends at.',
    'A correct sort must reach a different leaf for each of the n! input orders, so its tree has at least n! leaves.',
    'A binary tree of height h has at most 2ʰ leaves, so h ≥ log₂ n!. Since log₂ n! ≈ n log₂ n − 1.44n, every comparison sort needs Ω(n log n) comparisons in the worst case.',
    'The bound counts comparisons only. Counting sort and radix sort look at the digits of keys instead, so they are not bound by it.',
    'Switch to selection sort: it always asks 3 questions, sometimes one whose answer it already knows, and wastes two leaves on impossible answers.',
  ],
  complexityHead: ['Fact', 'Value', 'Why'],
  complexity: [
    ['Input orders of n distinct items', 'n!', 'Each must end at its own leaf.'],
    ['Leaves of a binary tree of height h', '≤ 2ʰ', 'Each level at most doubles the count.'],
    [
      'Worst-case comparisons, any comparison sort',
      'Ω(n log n)',
      'h ≥ log₂ n! ≈ n log₂ n − 1.44n.',
    ],
    [
      'Merge sort and heapsort',
      'O(n log n)',
      'They meet the bound, so they are optimal up to a constant.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'A decision tree sorts 4 distinct items. At least how many leaves must it have?',
      answer: 24,
      unit: 'leaves',
      hints: ['Every input order needs its own leaf. How many orders do 4 items have?'],
      solution: '4! = 4 × 3 × 2 × 1 = 24 orders, so at least 24 leaves.',
    },
    {
      type: 'number',
      prompt:
        'What is the fewest comparisons a comparison sort can need, in the worst case, to sort 5 distinct items?',
      answer: 7,
      unit: 'comparisons',
      hints: ['The tree needs 5! = 120 leaves.', 'Find the smallest h with 2ʰ ≥ 120.'],
      solution:
        '2⁶ = 64 < 120 ≤ 128 = 2⁷, so the height is at least ⌈log₂ 120⌉ = 7. Seven comparisons are in fact enough for 5 items.',
    },
    {
      type: 'choice',
      prompt: 'Why must the tree have height at least log₂ n!?',
      options: [
        'A binary tree of height h has at most 2ʰ leaves, and it needs n! of them',
        'Every comparison sort runs merge sort inside',
        'Each comparison can rule out at most one order',
        'The tree must be perfectly balanced',
      ],
      answer: 0,
      hints: ['How many leaves can a tree of height 1, 2, 3 have at most?'],
      solution:
        'Each level at most doubles the number of leaves, so height h allows at most 2ʰ leaves. With n! leaves needed, 2ʰ ≥ n!, so h ≥ log₂ n!.',
    },
    {
      type: 'number',
      prompt:
        'Insertion sort’s tree for three items has leaves at depths 2, 3, 3, 3, 3 and 2. On average over the 6 input orders, how many comparisons does it make? Give two decimals.',
      answer: 2.67,
      tolerance: 0.01,
      unit: 'comparisons',
      hints: ['Add the six depths and divide by 6.'],
      solution:
        '(2 + 3 + 3 + 3 + 3 + 2) / 6 = 16 / 6 ≈ 2.67. The average cannot drop below log₂ 6 ≈ 2.58 either.',
    },
    {
      type: 'choice',
      prompt: 'Which of these sorts is not limited by the Ω(n log n) bound?',
      options: ['Heapsort', 'Merge sort', 'Counting sort on small whole-number keys', 'Quicksort'],
      answer: 2,
      hints: ['The bound only applies to sorts that learn about keys by comparing them.'],
      solution:
        'Counting sort never compares two keys: it uses each key as an array index. The others are comparison sorts, so they need Ω(n log n) comparisons in the worst case.',
    },
  ],
  nextTeaser:
    'Next up: counting sort and radix sort, which step around the bound by never comparing keys.',
};
