/** @typedef {import('$lib/algo-engine/practice-balanced-bst.js').RunnerFrame} RunnerFrame */
/** @typedef {import('$lib/algo-engine/practice-balanced-bst.js').RunnerOp} RunnerOp */

const NAMES = { bst: 'plain BST', avl: 'AVL tree', skip: 'skip list' };
const IDS = /** @type {const} */ (['bst', 'avl', 'skip']);

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** @param {RunnerFrame} f */
const costs = (f, field = /** @type {'cost'|'total'} */ ('cost')) =>
  IDS.map((id) => `${NAMES[id]} ${f[id][field]}`).join(', ');

/** @param {RunnerFrame} f */
function cheapest(f) {
  const best = Math.min(...IDS.map((id) => f[id].total));
  const winners = IDS.filter((id) => f[id].total === best).map((id) => NAMES[id]);
  return winners.length === 1
    ? `the ${winners[0]} is cheapest`
    : `the ${winners.join(' and the ')} tie for cheapest`;
}

export const en = {
  slug: 'practice-balanced-bst',
  topic: 'balanced-bst',
  level: 'Intermediate',
  title: 'Practice: balanced tree problems',
  intro:
    'Choosing an ordered structure comes down to what it will actually be asked to do. Run one sequence of operations through a plain BST, an AVL tree and a skip list, count the comparisons each spends, and see when balance earns its keep and what a rank query costs with and without stored counts.',
  summary:
    'Run an operation sequence through a plain BST, an AVL tree and a skip list, compare their costs, and see what stored counts do for rank queries.',
  instruction:
    'Load a preset or type your own sequence, then step through it or jump to the last step for the totals. Switch how rank is answered, flip new coins for the skip list, and use the widget to answer the questions below.',
  opsLabel: 'Operations',
  opsAria:
    'Operations: i for insert, s for search, d for delete, r for rank, each followed by a key from 0 to 99.',
  opsHelp: 'i insert, s search, d delete, r rank, then a key: i5 i3 s5 r5 d3',
  run: 'Run',
  coins: 'Flip new coins',
  rankLabel: 'Rank queries',
  rankModes: { walk: 'No stored counts', counted: 'Stored counts' },
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    sorted: 'Sorted inserts',
    shuffled: 'Shuffled inserts',
    scoreboard: 'Scoreboard with ranks',
    window: 'Sliding window',
    random: 'Random',
  },
  opErrors: {
    empty: 'Type at least one operation.',
    format: 'Write each operation as a letter (i, s, d or r) and a key from 0 to 99, like i42.',
    count: 'Use at most 40 operations.',
    full: 'At most 15 keys can be stored at once, so the trees stay readable.',
  },
  structures: { bst: 'Plain BST', avl: 'AVL tree', skip: 'Skip list' },
  costTitle: 'Comparisons so far',
  stats: {
    thisOp: 'this operation',
    worst: 'worst',
    height: 'height',
    levels: 'levels',
    keys: 'Keys stored',
    rotations: 'AVL rotations',
    rank: 'Rank found',
  },
  noRank: '—',
  heightWord: 'height',
  levelsWord: 'levels',
  /** @param {string} name @param {number} h @param {number[]} keys */
  treeLabel: (name, h, keys) => `${name}, height ${h}. In order: ${keys.join(', ') || 'none'}.`,
  emptyTree: 'The tree is empty.',
  emptySkip: 'The skip list is empty.',
  /** @param {string} key @param {string} state */
  nodeLabel: (key, state) => `Key ${key}${state ? `, ${state}` : ''}`,
  /** @param {number} level */
  levelHead: (level) => `L${level}`,
  skipHeadCell: 'head',
  /** @param {number} levels @param {string} list */
  skipLabel: (levels, list) => `Skip list with ${plural(levels, 'level')}. Towers: ${list}.`,
  /** @param {number} key @param {number} height */
  towerText: (key, height) => `${key} (height ${height})`,
  roles: { compare: 'compared', added: 'new', hit: 'found' },
  markers: { compare: '?', added: '+', hit: '★' },
  opsTitle: 'Sequence',
  opsEmpty: 'none',
  opsHotLabel: 'current operation',
  /** @param {RunnerOp} op */
  opChip: (op) => `${op.type[0]}${op.key}`,
  /** @param {RunnerFrame} f @param {boolean} counted */
  describe(f, counted) {
    if (f.kind === 'start') {
      return 'Nothing has run yet. Step through the sequence, or jump to the last step for the totals.';
    }
    if (f.kind === 'done') {
      return `Totals: ${costs(f, 'total')}, so ${cheapest(f)}.`;
    }
    const op = /** @type {RunnerOp} */ (f.op);
    const key = op.key;
    /** @type {string} */
    let head;
    switch (f.outcome) {
      case 'added':
        head = `Insert ${key}.`;
        break;
      case 'dup':
        head = `${key} is already stored, so the insert changes nothing.`;
        break;
      case 'found':
        head = `Search for ${key}: found.`;
        break;
      case 'removed':
        head = `Delete ${key}.`;
        break;
      case 'ranked':
        head = counted
          ? `The rank of ${key} is ${f.rank}, found by walking one path and adding up what it skips.`
          : `The rank of ${key} is ${f.rank}, found by comparing keys in sorted order.`;
        break;
      default:
        head =
          op.type === 'delete'
            ? `${key} is not stored, so the delete changes nothing.`
            : `Search for ${key}: not there.`;
    }
    const spin =
      f.opRotations > 0 ? ` The AVL tree needed ${plural(f.opRotations, 'rotation')}.` : '';
    return `${head} Comparisons: ${costs(f)}.${spin}`;
  },
  takeaways: [
    'A plain BST’s cost depends on the order keys arrive in. Sorted keys make a chain, and n inserts then cost n(n − 1) / 2 comparisons. Shuffled keys give a shape about as good as a balanced tree’s, without any rotations.',
    'Balance is insurance. An AVL tree caps its height at about 1.44 log₂ n whatever the input, and pays with rotations and a stored height. A red-black tree relaxes the cap to 2 log₂(n + 1) and rotates less per update, so it suits write-heavy maps.',
    'A skip list reaches the same expected cost without rotations, and its code is short. The cost depends on the coin flips, not the input, so the same sequence can land above or below a balanced tree.',
    'Rank needs a stored count. Without one, any of these structures must compare keys one by one in sorted order, which is O(n). With subtree sizes or link widths it is one O(log n) walk, at the price of one more number per node to keep up to date.',
    'Try “Scoreboard with ranks” with and without stored counts and compare the totals. Then flip new coins on “Sorted inserts” and see how far the skip list moves while the AVL total stays put.',
  ],
  complexityHead: ['Structure or query', 'Cost', 'Why'],
  complexity: [
    ['Plain BST, sorted input', 'O(n) per operation', 'The tree is a chain of height n.'],
    [
      'Plain BST, shuffled input',
      'O(log n) expected',
      'Random order gives an average depth near 2 ln n.',
    ],
    ['AVL tree', 'O(log n) worst case', 'The height stays below about 1.44 log₂ n.'],
    [
      'Skip list',
      'O(log n) expected',
      'About log₂ n levels from fair coin flips, whatever the input.',
    ],
    ['Rank, no stored counts', 'O(n)', 'It compares keys in sorted order up to k.'],
    ['Rank, stored counts', 'O(log n)', 'One walk, reading one stored count per node.'],
    ['Memory', 'O(n)', 'All three use one node per key; a skip list averages 2 links per key.'],
  ],
  nextTeaser:
    'Next up: Review: core algorithms, a quiz across everything from sorting to balanced trees.',
  practiceTitle: 'Practice problems',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Load “Sorted inserts”. How many comparisons does the plain BST spend in total over the whole sequence?',
      answer: 170,
      unit: 'comparisons',
      hints: [
        'Jump to the last step and read the plain BST’s total.',
        'The 15 inserts cost 0 + 1 + … + 14, and each search walks down the chain.',
      ],
      solution:
        'The inserts cost 0 + 1 + … + 14 = 105 comparisons, and the searches for 15, 14, 13, 12 and 11 cost 15 + 14 + 13 + 12 + 11 = 65, which gives 170.',
    },
    {
      type: 'number',
      prompt:
        'On the same preset, what does the AVL tree’s dearest single operation cost? That is the “worst” value on its card.',
      answer: 4,
      unit: 'comparisons',
      hints: ['Read the AVL card at the last step. Compare its height with this value.'],
      solution:
        'The AVL tree ends with height 4, so no walk can compare more than 4 keys. The plain BST’s worst is 15, the height of its chain.',
    },
    {
      type: 'choice',
      prompt: 'Load “Shuffled inserts” and go to the last step. Which tree spends less in total?',
      options: [
        'The plain BST',
        'The AVL tree',
        'They spend exactly the same',
        'It changes when the coins are flipped',
      ],
      answer: 0,
      hints: ['Read both totals. Coin flips only affect the skip list.'],
      solution:
        'The plain BST spends 57 against the AVL tree’s 59, and it needs no rotations. On shuffled input balance buys nothing here, which is why it is insurance against bad orders and not a free win.',
    },
    {
      type: 'number',
      prompt:
        'Load “Scoreboard with ranks”. How many comparisons does the AVL tree save in total when rank queries use stored counts instead of none?',
      answer: 50,
      unit: 'comparisons',
      hints: ['Read the AVL total with each setting, at the last step.'],
      solution:
        'Without stored counts the AVL total is 117, and with them it is 67, a saving of 50. The ten ranks fall from 80 comparisons to 30, while the 37 spent on inserts do not change.',
    },
    {
      type: 'number',
      prompt:
        'Load “Sliding window”, where the oldest key leaves as each new one arrives. How many comparisons does the plain BST spend in total?',
      answer: 100,
      unit: 'comparisons',
      hints: ['Jump to the last step and read the plain BST’s total.'],
      solution:
        'It spends 100 against the AVL tree’s 69. Every new key is the largest, so inserts walk the whole right-leaning chain, even though each delete at the far left is cheap.',
    },
    {
      type: 'number',
      prompt: 'Type the sequence i10 i20 i30 i40 i50 r35 and run it. What rank does r35 report?',
      answer: 4,
      hints: ['Rank is 1 plus the number of smaller keys. The key need not be stored.'],
      solution:
        'The keys 10, 20 and 30 are smaller than 35, so the rank is 3 + 1 = 4, the position 35 would take in sorted order.',
    },
    {
      type: 'number',
      prompt:
        'The “Sorted inserts” total starts with 0 + 1 + … + 14 for 15 inserts. How many comparisons would 1,000 sorted inserts cost a plain BST?',
      answer: 499500,
      unit: 'comparisons',
      hints: ['The sum 0 + 1 + … + (n − 1) is n(n − 1) / 2.'],
      solution:
        '1,000 × 999 / 2 = 499,500 comparisons. An AVL tree would need about 1,000 × log₂ 1,000, or roughly 10,000, which is why balance matters most as n grows.',
    },
    {
      type: 'choice',
      prompt:
        'A game keeps a live scoreboard. Scores change constantly and players ask “what place am I in?”. Which structure fits best?',
      options: [
        'A hash table of scores',
        'A plain BST ordered by score',
        'A balanced tree with subtree sizes',
        'A sorted array',
      ],
      answer: 2,
      hints: [
        'The queries need order, and both updates and ranks must be fast.',
        'What does a sorted array cost per update?',
      ],
      solution:
        'A balanced tree with subtree sizes does updates and ranks in O(log n). A hash table has no order, a sorted array needs O(n) per update, and a plain BST can degrade to a chain.',
    },
    {
      type: 'multi',
      prompt: 'Which pairings of need and structure are sensible?',
      options: [
        'An index on disk, where each node read is slow: a B-tree',
        'Exact-match lookups with no need for order: a hash table',
        'Keys arrive sorted and must stay searchable: a plain BST',
        'A short, simple ordered map with no rotations: a skip list',
      ],
      answers: [0, 1, 3],
      hints: ['Think about the shape each structure takes on its worst input.'],
      solution:
        'A B-tree packs many keys into each disk page, a hash table gives expected O(1) when order does not matter, and a skip list needs no rotations. Sorted input is exactly what turns a plain BST into a chain.',
    },
  ],
};
