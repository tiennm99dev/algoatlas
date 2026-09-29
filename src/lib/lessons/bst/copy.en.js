/** @typedef {import('$lib/algo-engine/bst.js').BstFrame} BstFrame */
/** @typedef {import('$lib/algo-engine/bst.js').BstOp} BstOp */

export const en = {
  slug: 'bst',
  topic: 'structures',
  level: 'Intermediate',
  title: 'Binary search tree',
  intro:
    'A binary search tree keeps every key smaller than a node on its left and every larger key on its right. Search, insert, and delete each walk one path from the root, so their cost is the height of the tree.',
  summary:
    'Insert, search, and delete keys in a binary search tree, and watch sorted inserts turn it into a list.',
  instruction:
    'Type a key and insert, search, or delete it, then step through the walk. Load the sorted preset to see the tree lean into a list. Undo removes the last operation.',
  keyLabel: 'Key',
  insert: 'Insert',
  search: 'Search',
  remove: 'Delete',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: { balanced: 'Balanced order', sorted: 'Sorted order', random: 'Random' },
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'last operation',
  treeScroller: 'Tree drawing, scrolls sideways',
  /** @param {BstOp} op */
  opChip: (op) =>
    `${op.type === 'insert' ? en.insert : op.type === 'search' ? en.search : en.remove} ${op.key}`,
  stats: { comparisons: 'Comparisons (this operation)', height: 'Height', size: 'Size' },
  /** @param {number} h */
  balanced: (h) => `Perfectly balanced height: ${h}`,
  full: 'The tree is full (15 keys).',
  logFull: 'The log is full (40 operations). Undo or reset to continue.',
  keyError: 'Keys must be whole numbers from 0 to 99.',
  emptyTree: 'The tree is empty.',
  /** @param {number[]} keys @param {number} h @param {number | null} root @param {number} ideal */
  treeLabel: (keys, h, root, ideal) =>
    `Tree with ${keys.length} keys, height ${h}. In order: ${keys.join(', ')}.` +
    (root === null ? '' : ` Root ${root}. Balanced height would be ${ideal}.`),
  /** @param {number} key @param {string} state */
  nodeLabel: (key, state) => (state ? `Key ${key}, ${state}` : `Key ${key}`),
  states: {
    compare: 'compared',
    path: 'on the path',
    found: 'found',
    new: 'new',
    removing: 'removing',
    successor: 'successor',
  },
  markers: { path: '', compare: '?', found: '✓', new: '+', removing: '×', successor: 'S' },
  legend: {
    compare: 'Compared',
    path: 'On the path',
    found: 'Found',
    new: 'New',
    removing: 'Removing',
    successor: 'Successor',
  },
  /** @param {BstFrame} f */
  describe(f) {
    const key = f.op?.key ?? 0;
    const nodeKey = f.current >= 0 ? f.nodes[f.current].key : null;
    switch (f.kind) {
      case 'start':
        return en.emptyTree;
      case 'visit':
        return `Compare ${key} with ${nodeKey}.`;
      case 'go-left':
        return `${key} < ${nodeKey}, so go left.`;
      case 'go-right':
        return `${key} > ${nodeKey}, so go right.`;
      case 'insert':
        return `The walk fell off the tree: attach ${key} as a new leaf.`;
      case 'found':
        return f.op?.type === 'delete'
          ? `Found ${key}, the node to delete.`
          : `Found ${key} after ${f.comparisons} comparisons.`;
      case 'dup':
        return `${key} is already in the tree, so the insert is ignored.`;
      case 'missing':
        return `${key} is not in the tree.`;
      case 'successor':
        return `Two children: find the smallest key in the right subtree, ${f.nodes[f.succ].key}.`;
      case 'relink':
        return f.succ >= 0
          ? `Copy the successor key ${f.nodes[f.succ].key} into the node that held ${key}.`
          : `At most one child: the parent now points past ${key} to that child.`;
      case 'remove':
        return `The unlinked node is gone. The tree has ${f.size} keys.`;
      case 'done':
        return `Tree has ${f.size} keys, height ${f.height}.`;
    }
  },
  takeaways: [
    'Each comparison throws away one whole subtree, so an operation costs one step per level: O(height).',
    'Insert keys in sorted order and every new key goes right: the tree becomes a list with height n. Balanced trees such as AVL and red-black trees rotate to prevent this.',
    'Deleting a node with two children copies in its successor (the smallest key in the right subtree), then deletes the successor. That node has at most one child, so the second delete is easy.',
    'An in-order walk (left, node, right) visits the keys in sorted order.',
    'Try “Sorted order”: every key goes right and the height grows to n, so each operation costs O(n).',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    ['Time, balanced', 'O(log n)', 'Height stays about log₂ n.'],
    ['Time, worst', 'O(n)', 'Sorted inserts build a single long branch.'],
    ['Memory', 'O(n)', 'One node per key.'],
  ],
  nextTeaser: 'Next up: breadth-first search on a grid, where a queue finds the shortest path.',
};
