/** @typedef {import('$lib/algo-engine/red-black-trees.js').RbFrame} RbFrame */
/** @typedef {import('$lib/algo-engine/red-black-trees.js').RbOp} RbOp */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'red-black-trees',
  topic: 'balanced-bst',
  level: 'Advanced',
  title: 'Red-black trees',
  intro:
    'A red-black tree gives every node a colour and enforces a few colour rules instead of exact heights. Red nodes can never stack, and every path has the same number of black nodes, so the longest path is at most twice the shortest. An insert is repaired with recolouring and at most two rotations.',
  summary:
    'Insert keys into a red-black tree and follow each recolour and rotation, with the colour rules and black height checked live.',
  instruction:
    'Type a key and insert or search it, then step through the repair. Letters mark z, its parent P, uncle U and grandparent G. Watch the rule list: a rule may break for a moment during a repair. Load the three case presets to see each repair alone.',
  keyLabel: 'Key',
  insert: 'Insert',
  search: 'Search',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    clrs: 'Textbook example',
    uncle: 'Red uncle',
    inner: 'Black uncle, inner child',
    outer: 'Black uncle, outer child',
    sorted: 'Sorted keys',
    random: 'Random',
  },
  full: 'The tree is full (15 keys).',
  logFull: 'The log is full (24 operations). Undo or reset to continue.',
  keyError: 'Keys must be whole numbers from 0 to 99.',
  emptyTree: 'The tree is empty.',
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  /** @param {RbOp} op */
  opChip: (op) => `${op.type === 'insert' ? en.insert : en.search} ${op.key}`,
  stats: {
    comparisons: 'Comparisons (this operation)',
    recolours: 'Colour changes (all)',
    rotations: 'Rotations (all)',
    height: 'Height',
    blackHeight: 'Black height of the root',
    size: 'Keys',
  },
  uneven: 'uneven',
  /** @param {number} n */
  bound: (n) =>
    n === 0
      ? 'An empty tree has height 0.'
      : `With ${plural(n, 'key')}, the height is at most 2 log₂(n + 1) = ${(2 * Math.log2(n + 1)).toFixed(1)}.`,
  rulesTitle: 'The colour rules',
  rules: {
    colour: 'Every node is red or black',
    root: 'The root is black',
    nil: 'Every NIL leaf is black',
    redRed: 'A red node has only black children',
    black: 'All paths from a node to its NILs hold the same number of black nodes',
  },
  ruleOk: '✓',
  ruleBroken: '✗',
  ruleOkLabel: 'holds',
  ruleBrokenLabel: 'broken for now',
  /** @param {number} blackHeight */
  note: (blackHeight) => (blackHeight < 0 ? 'bh ?' : `bh ${blackHeight}`),
  colourLetter: { red: 'R', black: 'B' },
  colourName: { red: 'red', black: 'black' },
  legend: {
    red: 'R red node',
    black: 'B black node',
    z: 'z the node being repaired',
    parent: 'P parent',
    uncle: 'U uncle',
    grand: 'G grandparent',
    compare: '? key compared on the walk down',
    path: 'walked path',
    pivot: '↓ rotated down',
    bh: 'bh: black height, counting the NIL but not the node',
  },
  roles: {
    compare: '?',
    z: 'z',
    parent: 'P',
    uncle: 'U',
    grand: 'G',
    pivot: '↓',
  },
  roleNames: {
    compare: 'compared',
    z: 'node being repaired',
    parent: 'parent',
    uncle: 'uncle',
    grand: 'grandparent',
    pivot: 'rotated down',
  },
  /** @param {number[]} keys @param {number} h @param {number} bh */
  treeLabel: (keys, h, bh) =>
    `Red-black tree with ${plural(keys.length, 'key')}, height ${h}, black height ${bh < 0 ? 'uneven' : bh}. In order: ${keys.join(', ') || 'none'}.`,
  /** @param {number} key @param {string} colour @param {string} role @param {string} note */
  nodeLabel: (key, colour, role, note) =>
    `Key ${key}, ${colour}, ${note}${role ? `, ${role}` : ''}`,
  /** @param {RbFrame} f */
  describe(f) {
    const key = f.op?.key ?? 0;
    const k = (/** @type {number} */ s) => (s >= 0 ? f.nodes[s].key : 'NIL');
    switch (f.kind) {
      case 'start':
        return en.emptyTree;
      case 'visit':
        return `Compare ${key} with ${k(f.z)}.`;
      case 'go-left':
        return `${key} < ${k(f.z)}, so go left.`;
      case 'go-right':
        return `${key} > ${k(f.z)}, so go right.`;
      case 'attach':
        return `Attach ${key} as a red leaf. Red adds nothing to any path’s black count, so only the red rules can break.`;
      case 'found':
        return `Found ${key} after ${plural(f.comparisons, 'comparison')}. A search ignores colours.`;
      case 'missing':
        return `${key} is not in the tree.`;
      case 'dup':
        return `${key} is already in the tree, so the insert is ignored.`;
      case 'red-red':
        return `${k(f.z)} is red and so is its parent ${k(f.parent)}. The uncle is ${f.uncle < 0 ? 'a NIL, which counts as black' : `${k(f.uncle)}, ${f.nodes[f.uncle].color}`}, and that picks the repair.`;
      case 'recolour-uncle':
        return `The uncle is red: paint parent ${k(f.parent)} and uncle ${k(f.uncle)} black and grandparent ${k(f.grand)} red. Black counts stay equal, but the problem may move up to ${k(f.grand)}.`;
      case 'rotate-inner':
        return `The node was an inner child: rotate ${f.direction} at ${k(f.pivot)} to straighten the bend. Now ${k(f.z)} is the outer child, with the same keys in the same order.`;
      case 'recolour-outer':
        return `The uncle is black and z is an outer child: paint parent ${k(f.parent)} black and grandparent ${k(f.grand)} red, ready to rotate.`;
      case 'rotate-outer':
        return `Rotate ${f.direction} at ${k(f.pivot)}: ${k(f.parent)} moves up in black, its children are both red, and the repair is finished.`;
      case 'parent-black':
        return `The parent of ${k(f.z)} is black, so every rule holds and no more work is needed.`;
      case 'paint-root':
        return `The root is red, so paint it black. That adds one black node to every path at once, so all the black counts stay equal.`;
      case 'done':
        return f.size === 0
          ? en.emptyTree
          : `The tree has ${plural(f.size, 'key')}, height ${f.height} and black height ${f.blackHeight}.`;
    }
  },
  takeaways: [
    'The rules: every node is red or black, the root and the NIL leaves are black, a red node has only black children, and all paths from a node to its NILs hold the same number of black nodes.',
    'Black height bh counts the black nodes below a node, including the NIL. A path of bh black nodes holds at most bh red ones between them, so the longest path is at most twice the shortest, and the height is at most 2 log₂(n + 1).',
    'A new key is always red, so the black counts stay equal and only the red rules can break. With a red uncle, recolour and move the problem two levels up. With a black uncle, one or two rotations end the repair.',
    'An insert does at most two rotations and O(log n) recolourings. Delete, not shown here, has more cases but needs at most three rotations. That small number of structural changes is why libraries such as C++ std::map and Java’s TreeMap use this tree.',
    'Try “Sorted keys” and compare the height with the AVL lesson’s: 10 sorted keys reach height 5 here and 4 there, the price of the looser rules. Then load “Red uncle” to see a repair with no rotation at all.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Search', 'O(log n)', 'One path from the root, and the height is at most 2 log₂(n + 1).'],
    [
      'Insert',
      'O(log n)',
      'A walk down, then recolouring that may climb, with at most 2 rotations.',
    ],
    ['Delete', 'O(log n)', 'More cases, not shown here, with at most 3 rotations.'],
    ['One rotation', 'O(1)', 'A fixed number of links change.'],
    ['Memory', 'O(n)', 'One node per key, plus a single colour bit each.'],
  ],
  nextTeaser:
    'Next up: B-trees, which pack many keys into each node and split them upward, so a search touches very few disk blocks.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Insert 10, 20, 30 into an empty tree. Over all three inserts, how many times does a node change colour?',
      answer: 3,
      unit: 'changes',
      hints: [
        'The first key starts red and the root must be black.',
        'The third insert has a black uncle (a NIL) and an outer child.',
      ],
      solution:
        'Key 10 is painted black as the root (1). Then 30 has a red parent and a NIL uncle, so 20 turns black and 10 turns red (2 more), and a left rotation at 10 finishes. That is 3 changes.',
    },
    {
      type: 'choice',
      prompt: 'A new red node has a red parent and a red uncle. What does the repair do?',
      options: [
        'Rotate at the grandparent',
        'Paint parent and uncle black and the grandparent red, then continue from the grandparent',
        'Paint the new node black',
        'Rotate at the parent, then stop',
      ],
      answer: 1,
      hints: ['No rotation is needed when both children of the grandparent are red.'],
      solution:
        'Moving the black down from the grandparent to both children keeps every black count equal and removes the red-red pair here. The grandparent is now red, so its own parent may need the same check.',
    },
    {
      type: 'number',
      prompt:
        'Load the “Textbook example”, which inserts 11, 2, 14, 1, 7, 15, 5, 8, 4. Which key is the root at the end?',
      answer: 7,
      hints: [
        'Step to the last frame and read the top of the tree.',
        'The last insert, 4, climbs and then rotates twice.',
      ],
      solution:
        'Key 4 first recolours with a red uncle, which moves the problem up to 7. Then 7 is an inner child with a black uncle, so a left rotation at 2 and a right rotation at 11 lift 7 to the root.',
    },
    {
      type: 'number',
      prompt: 'In that final tree, what is the black height of the root?',
      answer: 2,
      hints: [
        'Follow any path, say 7 → 2 → 1 → NIL, and count blacks below the root.',
        'Count the NIL but not the root.',
      ],
      solution:
        'On 7 → 2 → 1 → NIL, node 2 is red and node 1 and the NIL are black, which gives 2. Any other path gives the same count.',
    },
    {
      type: 'number',
      prompt: 'What is the largest height the bound 2 log₂(n + 1) allows for a tree with 15 keys?',
      answer: 8,
      hints: ['Compute log₂ 16 first.'],
      solution:
        '2 log₂(15 + 1) = 2 × 4 = 8. A perfect tree of 15 keys has height 4, so the bound allows twice that.',
    },
    {
      type: 'number',
      prompt:
        'Insert 1, 2, 3, 4, 5, 6, 7 in that order. What is the final height of the red-black tree?',
      answer: 4,
      hints: ['Press Reset first, then type the keys one by one and read the height card.'],
      solution:
        'The tree ends with root 2 and height 4, on the path 2 → 4 → 6 → 7. An AVL tree with the same inserts reaches height 3, since its rules are stricter.',
    },
    {
      type: 'multi',
      prompt: 'Which of these are always true at rest in a red-black tree?',
      options: [
        'A red node’s children are black',
        'The longest root-to-NIL path is at most twice the shortest',
        'Every leaf is at the same depth',
        'Red and black alternate on every path',
      ],
      answers: [0, 1],
      hints: ['Two blacks in a row are fine.', 'Only the black count must match, not the depth.'],
      solution:
        'Red-red is forbidden, and since every path has the same black count with at most one red per black, the longest is at most twice the shortest. Depths may differ, and black nodes may follow one another.',
    },
    {
      type: 'order',
      prompt: 'A new node z is an inner child and its uncle is black. Put the repair in order.',
      items: [
        'Paint the parent black and the grandparent red',
        'Rotate at the parent to make the new shape an outer child',
        'Rotate at the grandparent',
      ],
      answer: [1, 0, 2],
      hints: ['Straighten the bend first, then repaint, then lift.'],
      solution:
        'First rotate at the parent so the bend becomes a line. Then paint the node now above z black and the grandparent red, and rotate at the grandparent. No more work is needed.',
    },
  ],
};
