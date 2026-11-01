/** @typedef {import('$lib/algo-engine/why-balance-matters.js').WhyBalanceFrame} WhyBalanceFrame */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'why-balance-matters',
  topic: 'balanced-bst',
  level: 'Beginner',
  title: 'Why balance matters',
  intro:
    'A binary search tree costs one step per level, so its speed depends entirely on its height. Insert keys in sorted order and a plain BST degenerates into a list of height n, while a balancing tree keeps its height near log₂ n by using small local moves called rotations.',
  summary:
    'Insert the same keys into a plain binary search tree and an AVL tree, and compare their heights and comparison counts.',
  instruction:
    'Type a list of keys or load a preset, then step through it. Each key goes into the plain BST first and the AVL tree second. Watch the plain tree lean while the AVL tree rotates, and compare the height and comparison counters.',
  keysLabel: 'Keys, in insert order',
  keysAria: 'Keys to insert, separated by commas',
  run: 'Run',
  resetLabel: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    sorted: 'Sorted',
    reversed: 'Reversed',
    zigzag: 'Zigzag',
    balanced: 'Already balanced order',
    random: 'Random',
  },
  errors: {
    empty: 'Type at least one key.',
    format: 'Use whole numbers separated by commas.',
    range: 'Keys must be from 0 to 99.',
    duplicate: 'Each key may appear only once.',
    count: 'Use at most 15 keys.',
  },
  plainTitle: 'Plain BST',
  avlTitle: 'AVL tree',
  emptyTree: 'Empty so far.',
  heightWord: 'height',
  stats: {
    plainHeight: 'Plain BST height',
    avlHeight: 'AVL height',
    plainComparisons: 'Plain BST comparisons',
    avlComparisons: 'AVL comparisons',
    rotations: 'AVL rotations',
    ideal: 'Least possible height',
  },
  heightNote:
    'Height counts the nodes on the longest path from the root, so one node has height 1.',
  legend: {
    added: 'New key',
    up: 'Rotated up',
    down: 'Rotated down',
  },
  markers: { added: '+', up: '↑', down: '↓' },
  /** @param {string} name @param {number} height @param {number[]} keys */
  treeLabel: (name, height, keys) =>
    `${name} with ${plural(keys.length, 'key')}, height ${height}. In order: ${keys.join(', ') || 'none'}.`,
  /** @param {string} key @param {string} state @param {number} depth */
  nodeLabel: (key, state, depth) => `Key ${key}${state ? `, ${state}` : ''}, depth ${depth}`,
  nodeStates: { added: 'new key', up: 'rotated up', down: 'rotated down' },
  /** @param {WhyBalanceFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return 'Both trees start empty. Step forward to insert the first key into each.';
      case 'insert-plain':
        return f.plainWalk === 0
          ? `Key ${f.key} becomes the root of the plain BST.`
          : `Plain BST: ${f.key} walks down ${plural(f.plainWalk, 'comparison')} and becomes a leaf. Nothing else changes, whatever the shape.`;
      case 'insert-avl':
        return f.avlWalk === 0
          ? `Key ${f.key} becomes the root of the AVL tree.`
          : `AVL tree: ${f.key} walks down ${plural(f.avlWalk, 'comparison')} and becomes a leaf. Now each ancestor rechecks its two child heights on the way back up.`;
      case 'rotate': {
        const r = /** @type {NonNullable<WhyBalanceFrame['rotation']>} */ (f.rotation);
        return r.prepares
          ? `The heavy side bends inward, so rotate ${r.direction} at ${r.pivot} first: ${r.up} moves up. This straightens the bend for the next rotation.`
          : `Two child heights differed by 2, so rotate ${r.direction} at ${r.pivot}: ${r.up} moves up, ${r.pivot} moves down. Only a few links change and the in-order sequence stays sorted.`;
      }
      case 'done':
        return `Done. Plain BST height ${f.plainHeight} and ${plural(f.plainComparisons, 'comparison')}; AVL height ${f.avlHeight} and ${plural(f.avlComparisons, 'comparison')}, after ${plural(f.rotations, 'rotation')}.`;
    }
  },
  takeaways: [
    'Search, insert and delete in a BST walk one root-to-leaf path, so they cost O(height). The question is only how tall the tree gets.',
    'A plain BST takes its shape from the insert order. Sorted, reversed or zigzag input builds one long branch of height n: a linked list with extra steps, costing O(n) per operation and about n²/2 comparisons in all.',
    'A balanced tree guarantees height O(log n). No binary tree of n keys can be shorter than ⌈log₂(n + 1)⌉ levels, and an AVL tree stays within about 1.44 times that.',
    'A rotation moves one child above its parent and passes one subtree across. It changes a constant number of links and never changes the in-order sequence, so the tree stays a valid BST.',
    'Try “Sorted”, then “Already balanced order”: the plain BST reaches height 10 with 10 keys in the first and only 4 with 15 keys in the second, which needs no rotation at all.',
  ],
  complexityHead: ['Tree', 'Cost per operation', 'Why'],
  complexity: [
    [
      'Plain BST, friendly order',
      'O(log n)',
      'Random inserts give an expected depth near 2 ln n and a height still in O(log n).',
    ],
    ['Plain BST, sorted order', 'O(n)', 'Every key becomes the right child of the last one.'],
    ['AVL tree, any order', 'O(log n)', 'The height stays below about 1.44 log₂(n + 2).'],
    ['One rotation', 'O(1)', 'Only a constant number of links change, whatever the tree size.'],
    ['Memory', 'O(n)', 'One node per key, plus a stored height in each AVL node.'],
  ],
  nextTeaser:
    'Next up: AVL trees, where you read balance factors and pick between single and double rotations yourself.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Insert 10, 20, 30, 40, 50, 60, 70, 80 in that order into an empty plain BST. How many key comparisons do all the inserts spend together?',
      answer: 28,
      unit: 'comparisons',
      hints: [
        'Each new key is larger than everything before it, so it walks the whole right branch.',
        'The k-th key compares with the k − 1 keys already there.',
      ],
      solution:
        'The keys cost 0, 1, 2, 3, 4, 5, 6 and 7 comparisons. Their sum is 0 + 1 + … + 7 = 28. Type the keys into the widget to confirm the counter.',
    },
    {
      type: 'number',
      prompt: 'The same eight sorted keys go into an AVL tree. What is its final height?',
      answer: 4,
      hints: [
        'Run the keys in the widget and read “AVL height”.',
        'Seven keys fit in a perfect tree of height 3, so the eighth starts a new level.',
      ],
      solution:
        'The rotations keep the tree as full as they can. Seven keys fill three levels, and the eighth needs a fourth, so the height is 4, against 8 for the plain BST.',
    },
    {
      type: 'number',
      prompt:
        'What is the least possible height of a binary tree holding 1000 keys, counting nodes on the longest path?',
      answer: 10,
      hints: [
        'A tree of height h holds at most 2ʰ − 1 keys.',
        'Find the smallest h with 2ʰ − 1 ≥ 1000.',
      ],
      solution:
        '2⁹ − 1 = 511 is too few and 2¹⁰ − 1 = 1023 is enough, so the least height is 10. A sorted plain BST with the same keys has height 1000.',
    },
    {
      type: 'choice',
      prompt: 'Which insert order makes a plain BST with the keys 1 to 7 as short as possible?',
      options: [
        '1, 2, 3, 4, 5, 6, 7',
        '7, 6, 5, 4, 3, 2, 1',
        '4, 2, 6, 1, 3, 5, 7',
        '1, 7, 2, 6, 3, 5, 4',
      ],
      answer: 2,
      hints: [
        'The first key inserted stays the root for ever.',
        'Which key splits 1 to 7 in half?',
      ],
      solution:
        'Starting with the middle key 4, then the middles 2 and 6 of each half, builds a perfect tree of height 3. The other three orders each build one long branch of height 7.',
    },
    {
      type: 'multi',
      prompt: 'Which of these are true of a single rotation?',
      options: [
        'The in-order sequence of keys stays the same',
        'It changes a constant number of links',
        'It makes every node in the tree change depth',
        'It always shrinks the tree by a whole level',
      ],
      answers: [0, 1],
      hints: [
        'A rotation only touches two nodes and one subtree that changes parent.',
        'Rotate a balanced tree and see whether it gets shorter.',
      ],
      solution:
        'A rotation keeps the BST order and relinks a fixed number of pointers. Only the moved nodes and subtrees change depth, and a rotation in the wrong place can make the tree taller, so it must be chosen by the heights.',
    },
    {
      type: 'number',
      prompt:
        'Insert 4, 2, 6, 1, 3, 5, 7 into the AVL side of the widget. How many rotations does it spend?',
      answer: 0,
      unit: 'rotations',
      hints: ['Each key lands in a level that the earlier keys have balanced.'],
      solution:
        'This order fills the tree level by level, so no node’s children ever differ in height by 2. Balancing costs only the height checks here, and both trees spend the same 10 comparisons.',
    },
  ],
};
