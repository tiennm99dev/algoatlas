/** @typedef {import('$lib/algo-engine/b-trees.js').BFrame} BFrame */
/** @typedef {import('$lib/algo-engine/b-trees.js').BOp} BOp */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'b-trees',
  topic: 'balanced-bst',
  level: 'Intermediate',
  title: 'B-trees',
  intro:
    'A B-tree stores many keys in each node and has many children per node, so it stays only a few levels deep. A node that overflows splits and sends its median key up, one that runs short borrows or merges, and all the leaves stay at the same depth. Databases and file systems use it because one node fits one disk block, and reading a block is what costs time.',
  summary:
    'Insert and delete keys in a B-tree of order 3, 4 or 5, and watch nodes split upward, borrow and merge while counting node reads.',
  instruction:
    'Pick an order, type a key, then insert, search or delete. Step through to see each node read, then a split sending its median up, or a borrow or merge when a node runs short. Change the order to rebuild the same log and compare the height.',
  orderLabel: 'Order m (most children per node)',
  orderOption: (/** @type {number} */ m) => String(m),
  keyLabel: 'Key',
  insert: 'Insert',
  search: 'Search',
  remove: 'Delete',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    grow: 'Sorted keys, splits climb',
    mixed: 'Mixed keys',
    merge: 'Deletes that merge and borrow',
    random: 'Random',
  },
  full: 'The tree is full (20 keys).',
  logFull: 'The log is full (24 operations). Undo or reset to continue.',
  keyError: 'Keys must be whole numbers from 0 to 99.',
  emptyTree: 'The tree is empty.',
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  /** @param {BOp} op */
  opChip: (op) =>
    `${op.type === 'insert' ? en.insert : op.type === 'search' ? en.search : en.remove} ${op.key}`,
  stats: {
    reads: 'Node reads (this operation)',
    scanned: 'Keys compared (this operation)',
    splits: 'Splits (all)',
    fixes: 'Merges + borrows (all)',
    height: 'Height (levels)',
    size: 'Keys',
  },
  /** @param {number} order @param {number} n @param {number} h */
  facts: (order, n, h) =>
    n === 0
      ? `Order ${order}: at most ${order - 1} keys per node, and at least ${Math.ceil(order / 2) - 1} in every node but the root.`
      : `Order ${order}: at most ${order - 1} keys per node, and at least ${Math.ceil(order / 2) - 1} in every node but the root. With height ${h} this order holds up to ${order ** h - 1} keys. A binary tree of ${plural(n, 'key')} needs at least ${Math.ceil(Math.log2(n + 1))} levels.`,
  legend: {
    read: '? read',
    path: 'read earlier',
    found: '✓ found',
    changed: '* changed now',
    broken: '! too many or too few keys',
    partner: '+ other node involved',
    moved: 'Key that moved',
  },
  markers: { read: '?', changed: '*', found: '✓', broken: '!', partner: '+', path: '' },
  roleNames: {
    read: 'being read',
    changed: 'changed now',
    found: 'found',
    broken: 'over or under the limit',
    partner: 'other node involved',
    path: 'read earlier',
  },
  /** @param {number[][]} rows @param {number} order @param {number} h */
  treeLabel: (rows, order, h) =>
    `B-tree of order ${order}, height ${h}. ${rows.map((row, i) => `Level ${i + 1}: ${row.join(', ')}.`).join(' ')}`,
  /** @param {number[]} keys @param {string} role */
  nodeLabel: (keys, role) => `Node ${keys.join(', ') || 'with no keys'}${role ? `, ${role}` : ''}`,
  /** @param {BFrame} f */
  describe(f) {
    const key = f.op?.key ?? 0;
    switch (f.kind) {
      case 'start':
        return en.emptyTree;
      case 'read':
        return `Read a node (read ${f.reads} of this operation) and scan its keys for ${key}.`;
      case 'found':
        return f.op?.type === 'delete'
          ? `Found ${key}, the key to delete.`
          : `Found ${key} after ${plural(f.reads, 'node read')}.`;
      case 'missing':
        return `${key} is not in the tree.`;
      case 'dup':
        return `${key} is already in the tree, so the insert is ignored.`;
      case 'place':
        return `Add ${key} to the leaf, in key order. A leaf only ever gains keys here; the tree grows from the top.`;
      case 'overflow':
        return `This node holds ${f.order} keys, one too many for order ${f.order}. It must split.`;
      case 'split':
        return `Split: ${f.moved} moves up into the parent, and the keys on either side become two nodes. The parent may now overflow too.`;
      case 'new-root':
        return `There is no parent, so ${f.moved} becomes a new root. This is the only way the height grows, so all the leaves stay level.`;
      case 'swap-in':
        return `${key} sits in an inner node. Replace it with its predecessor ${f.moved}, the largest key to its left, which is in a leaf.`;
      case 'remove':
        return `Remove the key from the leaf.`;
      case 'underflow':
        return `This node has fewer than the ${Math.ceil(f.order / 2) - 1} ${Math.ceil(f.order / 2) - 1 === 1 ? 'key' : 'keys'} order ${f.order} requires. Look at its siblings.`;
      case 'borrow':
        return `A sibling can spare a key: ${f.moved} moves up to the parent, and the old separator moves down into the short node.`;
      case 'merge':
        return `No sibling can spare a key: merge with one, pulling the separator ${f.moved} down from the parent. The parent may now run short too.`;
      case 'shrink':
        return `The root has no keys left, so its only child becomes the root. This is the only way the height falls.`;
      case 'done':
        return f.size === 0
          ? en.emptyTree
          : `The tree has ${plural(f.size, 'key')} in ${plural(f.height, 'level')}, with every leaf at the same depth.`;
    }
  },
  takeaways: [
    'An order m node has up to m children and m − 1 keys. Every node but the root keeps at least ⌈m/2⌉ − 1 keys, so nodes stay usefully full.',
    'A node with m keys splits: the median moves up, and the keys on each side become two nodes. Splits can climb, and only a split of the root adds a level, which is why all leaves stay at the same depth.',
    'A delete that leaves a node short borrows through the parent if a sibling can spare a key. Otherwise it merges with a sibling and pulls the separator down, and only emptying the root removes a level.',
    'Height is about log base m of n, so a real order of 1000 needs only 3 or 4 levels for a billion keys. Each level is one disk block read, far slower than the key comparisons inside it, which is why databases and file systems use B-trees and their cousins.',
    'Try “Sorted keys, splits climb” at order 3, then switch to order 5: the same 7 keys take 3 levels, then 2, and the last insert at order 3 splits all the way up to a new root.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'Search: node reads',
      'O(logₘ n)',
      'One node per level, and a tree of order m is that shallow.',
    ],
    [
      'Search: comparisons',
      'O(m logₘ n) = O(log n) for a fixed m',
      'A scan of up to m − 1 keys in each node read.',
    ],
    [
      'Insert',
      'O(logₘ n) node writes',
      'A walk down, then at most one split per level on the way back.',
    ],
    ['Delete', 'O(logₘ n) node writes', 'A walk down, then at most one borrow or merge per level.'],
    ['Memory', 'O(n)', 'Nodes stay at least about half full, apart from the root.'],
  ],
  nextTeaser:
    'Next up: Treaps and skip lists, which reach the same logarithmic height by flipping coins instead of following strict balance rules.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Insert 10, 20, 30, 40, 50, 60, 70 into an order 3 B-tree. What is its final height, in levels?',
      answer: 3,
      unit: 'levels',
      hints: [
        'Load “Sorted keys, splits climb” at order 3 and read the height at the end.',
        'A height of h at order 3 holds at most 3ʰ − 1 keys.',
      ],
      solution:
        'The tree ends with root 40, level two 20 and 60, and leaves 10, 30, 50, 70. That is 3 levels, even though 7 keys could fit in 2 levels at order 3: sorted inserts leave most nodes half empty.',
    },
    {
      type: 'number',
      prompt: 'How many splits does that same run make in total?',
      answer: 4,
      unit: 'splits',
      hints: [
        'Read the “Splits (all)” card on the last step.',
        'Adding 70 splits a leaf and then its parent.',
      ],
      solution:
        'Key 30 splits a leaf once, key 50 splits a leaf once, and key 70 splits a leaf and then the overflowing root, which adds a new root. That makes 1 + 1 + 2 = 4.',
    },
    {
      type: 'choice',
      prompt: 'A leaf of an order 3 tree holds 10 and 20, and 30 arrives. What happens?',
      options: [
        '20 moves up to the parent; 10 and 30 become separate leaves',
        '30 moves up to the parent; 10 and 20 stay together',
        '10 moves up to the parent; 20 and 30 stay together',
        'The leaf keeps three keys until the next insert',
      ],
      answer: 0,
      hints: ['At order 3 a node may hold only 2 keys.', 'Which key keeps the two sides correct?'],
      solution:
        'Three keys are one too many, so the node splits around its median 20. The parent gets 20, and 10 and 30 sit on either side of it, as the search order requires.',
    },
    {
      type: 'number',
      prompt: 'What is the most keys an order 3 B-tree of height 3 can hold?',
      answer: 26,
      unit: 'keys',
      hints: [
        'Full nodes have 2 keys and 3 children. Count the nodes per level: 1, 3, 9.',
        'That gives 13 nodes with 2 keys each.',
      ],
      solution: '1 + 3 + 9 = 13 nodes × 2 keys = 26, which is the general formula mʰ − 1 = 3³ − 1.',
    },
    {
      type: 'number',
      prompt: 'A real B-tree has order 1001. What is the most keys it can hold in height 3?',
      answer: 1003003000,
      unit: 'keys',
      hints: ['Use mʰ − 1.'],
      solution:
        '1001³ − 1 = 1,003,003,000. So just 3 block reads can reach any of about a billion keys, against about 30 levels in a binary tree.',
    },
    {
      type: 'number',
      prompt: 'How few keys may a non-root node of an order 5 B-tree hold?',
      answer: 2,
      unit: 'keys',
      hints: ['The minimum is ⌈m/2⌉ − 1.'],
      solution: '⌈5/2⌉ − 1 = 3 − 1 = 2. Any fewer and the node must borrow or merge.',
    },
    {
      type: 'number',
      prompt:
        'Load “Deletes that merge and borrow” at order 3. How many merges does deleting 70 cost, before the next delete starts?',
      answer: 2,
      unit: 'merges',
      hints: [
        'Step to the frame just before “Delete 40” begins and read the card.',
        'A merge can leave the parent short as well.',
      ],
      solution:
        'Leaf 70 empties and merges with leaf 50 and separator 60. That leaves its parent with no keys, and the parent merges with its sibling and the root’s 40. The empty root then goes, so the height falls from 3 to 2.',
    },
    {
      type: 'order',
      prompt: 'A node in a B-tree has just run short after a delete. Put what to try in order.',
      items: [
        'Merge with a sibling and the separator between them',
        'Check whether a sibling can spare a key',
        'If the root is empty, make its only child the new root',
        'Borrow a key through the parent',
      ],
      answer: [1, 3, 0, 2],
      hints: ['A merge is the fallback, and it can pass the problem upward.'],
      solution:
        'First check the siblings, and borrow if one has a spare key. Otherwise merge. A merge takes a key from the parent, so the problem can climb, and it may end by emptying the root, whose child then replaces it.',
    },
    {
      type: 'multi',
      prompt: 'Why do databases prefer B-trees to binary search trees on disk?',
      options: [
        'One node can fill a disk block, so a block read brings in many keys',
        'Few levels mean few slow block reads',
        'Comparing keys inside a node is far cheaper than reading a block',
        'They use less memory because they store no keys in inner nodes',
      ],
      answers: [0, 1, 2],
      hints: ['What is the slow step on a disk?', 'Inner nodes of the B-tree here do hold keys.'],
      solution:
        'The cost that matters is block reads. A wide node packs one block, so the tree needs few levels, and the scan inside a block costs almost nothing beside the read. A B-tree stores keys in inner nodes as well, and a B+ tree, which keeps the data in leaves, still uses inner keys as separators.',
    },
  ],
};
