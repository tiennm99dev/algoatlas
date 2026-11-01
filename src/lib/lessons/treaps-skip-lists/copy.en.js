import { MAX_TOWER } from '$lib/algo-engine/treaps-skip-lists.js';

/** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').SkipFrame} SkipFrame */
/** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').SkipOp} SkipOp */
/** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').TreapFrame} TreapFrame */
/** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').TreapOp} TreapOp */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
/** @param {SkipOp | TreapOp} op */
const opChip = (op) =>
  `${op.type === 'insert' ? en.insert : op.type === 'search' ? en.search : en.remove} ${op.key}`;

export const en = {
  slug: 'treaps-skip-lists',
  topic: 'balanced-bst',
  level: 'Advanced',
  title: 'Treaps and skip lists',
  intro:
    'Instead of strict balance rules, these structures use randomness. A skip list stacks sorted linked lists, with each key’s tower height set by coin flips, so a search rides the high levels and drops down. A treap gives each key a random priority and keeps the tree a BST by key and a min-heap by priority, so the smallest priority is the root. Both reach O(log n) expected time, whatever the insert order.',
  summary:
    'Step through coin-flip skip list towers and a search that drops level by level, then watch random priorities rotate a treap into shape.',
  instruction:
    'Pick a structure, then type a key and insert, search or delete. In the skip list, follow the search path as it moves right and drops. In the treap, leave the priority blank for a random one, or type one, and watch the new node rotate up.',
  modeLabel: 'Structure',
  modes: { skip: 'Skip list', treap: 'Treap' },
  keyLabel: 'Key',
  priorityLabel: 'Priority (blank = random)',
  towerLabel: 'Tower height',
  towerCoin: 'Flip coins',
  insert: 'Insert',
  search: 'Search',
  remove: 'Delete',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  skipPresets: {
    towers: 'Well-spread towers',
    flat: 'No tall towers',
    random: 'Random coin flips',
  },
  treapPresets: {
    shuffled: 'Sorted keys, mixed priorities',
    reordered: 'Same pairs, other order',
    chain: 'Sorted keys, rising priorities',
    random: 'Random priorities',
  },
  skipFull: 'The list is full (12 keys).',
  treapFull: 'The tree is full (12 keys).',
  treapLogFull: 'The log is full (20 operations). Undo or reset to continue.',
  logFull: 'The log is full (24 operations). Undo or reset to continue.',
  keyError: 'Keys must be whole numbers from 0 to 99.',
  priorityError: 'Priorities must be whole numbers from 0 to 99, or blank for a random one.',
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  skipOpChip: opChip,
  treapOpChip: opChip,
  flipsTitle: 'Coin flips for this tower',
  flipsEmpty: 'none yet',
  flipHeads: 'H',
  flipTails: 'T',
  flipsHot: 'latest flip',
  head: 'H',
  end: 'NIL',
  skipStats: {
    comparisons: 'Comparisons (this operation)',
    rights: 'Moves right',
    drops: 'Drops',
    levels: 'Levels in use',
    size: 'Keys',
  },
  treapStats: {
    comparisons: 'Comparisons (this operation)',
    opRotations: 'Rotations (this operation)',
    rotations: 'Rotations (all)',
    height: 'Height',
    size: 'Keys',
  },
  /** @param {number} n */
  skipNote: (n) =>
    n === 0
      ? 'A flat sorted list would compare with every key before the target.'
      : `A flat sorted list of ${plural(n, 'key')} costs up to ${n} comparisons. Expected levels here: about log₂ n = ${Math.log2(Math.max(n, 2)).toFixed(1)}.`,
  /** @param {number} n */
  treapNote: (n) =>
    n === 0
      ? 'With random priorities the expected height is O(log n).'
      : `A perfect tree of ${plural(n, 'key')} has height ${Math.ceil(Math.log2(n + 1))}. Random priorities keep the expected height within a constant factor of it.`,
  priorityNote: (/** @type {number} */ p) => `p ${p}`,
  legendSkip: {
    active: '● current position',
    path: 'visited on the path',
    compare: '? key compared',
    found: '✓ found or just linked',
  },
  legendTreap: {
    compare: '? compared',
    path: 'on the walk',
    added: '+ new',
    up: '↑ rotated up',
    down: '↓ rotated down',
    ok: '✓ heap order holds',
  },
  markers: { active: '●', compare: '?', found: '✓', added: '+', up: '↑', down: '↓', ok: '✓' },
  /** @param {{key: number, height: number}[]} towers @param {number} top */
  skipLabel: (towers, top) =>
    `Skip list with ${plural(towers.length, 'key')} and ${plural(top, 'level')}. Towers: ${towers.map((t) => `${t.key} height ${t.height}`).join(', ') || 'none'}.`,
  /** @param {string} name @param {number} level @param {string} role */
  cellLabel: (name, level, role) => `${name}, level ${level}${role ? `, ${role}` : ''}`,
  cellRoles: {
    active: 'current position',
    path: 'visited',
    compare: 'compared',
    found: 'found or just linked',
  },
  /** @param {number[]} keys @param {number} h */
  treapLabel: (keys, h) =>
    `Treap with ${plural(keys.length, 'key')}, height ${h}. In order: ${keys.join(', ') || 'none'}.`,
  /** @param {string} key @param {string} note @param {string} role */
  treapNodeLabel: (key, note, role) => `Key ${key}, ${note}${role ? `, ${role}` : ''}`,
  treapRoles: {
    compare: 'compared',
    path: 'on the walk',
    added: 'new',
    up: 'rotated up',
    down: 'rotated down',
    ok: 'heap order holds',
  },
  skipEmpty: 'The list is empty.',
  treapEmpty: 'The treap is empty.',
  /** @param {SkipFrame} f */
  describeSkip(f) {
    const key = f.op?.key ?? 0;
    const here = f.at >= 0 ? `${f.towers[f.at].key}` : 'the head';
    const nextKey = f.next >= 0 ? f.towers[f.next].key : null;
    switch (f.kind) {
      case 'start':
        return en.skipEmpty;
      case 'begin':
        return `Start at the head on level ${f.level}, the top, looking for ${key}.`;
      case 'right':
        return `${here} < ${key} on level ${f.level}, so move right to it. This one hop skips the shorter towers in between.`;
      case 'drop':
        return `On level ${f.level + 1} the next is ${nextKey === null ? 'the end' : nextKey}, which is not below ${key}. Stay at ${here} and drop to level ${f.level}.`;
      case 'found':
        return f.op?.type === 'delete'
          ? `Found ${key}, the tower to remove.`
          : `Found ${key} on the bottom level, after ${plural(f.comparisons, 'comparison')}.`;
      case 'missing':
        return `The next key on the bottom level is ${nextKey === null ? 'the end' : nextKey}, so ${key} is not in the list.`;
      case 'dup':
        return `${key} is already in the list, so the insert is ignored before any coin is flipped.`;
      case 'flip': {
        const heads = f.flips.at(-1);
        const height = f.flips.filter(Boolean).length + 1;
        if (!heads) return `Tails: the tower stops at height ${height}.`;
        return height < MAX_TOWER
          ? `Heads: the tower grows to height ${height}. Flip again.`
          : `Heads: the tower grows to height ${height}, the cap in this widget, so there is no more flipping.`;
      }
      case 'link':
        return `Link the new tower for ${key}, with the positions remembered on each drop as its left neighbours.`;
      case 'unlink':
        return `Unlink the tower from every level it reached. The list now holds ${plural(f.size, 'key')}.`;
      case 'done':
        return f.size === 0
          ? en.skipEmpty
          : `The list holds ${plural(f.size, 'key')} on ${plural(f.top, 'level')}.`;
    }
  },
  /** @param {TreapFrame} f */
  describeTreap(f) {
    const key = f.op?.key ?? 0;
    const at = f.current >= 0 ? f.nodes[f.current].key : null;
    const other = f.other >= 0 ? f.nodes[f.other] : null;
    switch (f.kind) {
      case 'start':
        return en.treapEmpty;
      case 'visit':
        return `Compare ${key} with ${at}.`;
      case 'go-left':
        return `${key} < ${at}, so go left.`;
      case 'go-right':
        return `${key} > ${at}, so go right.`;
      case 'attach':
        return `Attach ${key} as a leaf with priority ${f.op?.priority ?? 0}. The BST order is right; now check the heap order.`;
      case 'found':
        return f.op?.type === 'delete'
          ? `Found ${key}. To delete it, rotate it down until it is a leaf.`
          : `Found ${key} after ${plural(f.comparisons, 'comparison')}.`;
      case 'missing':
        return `${key} is not in the treap.`;
      case 'dup':
        return `${key} is already in the treap, so the insert is ignored.`;
      case 'heap-ok':
        return other
          ? `Parent ${other.key} has priority ${other.priority}, no larger than ${f.nodes[f.current].priority}, so the heap order holds.`
          : `${at} is now the root, so the heap order holds.`;
      case 'rotate-up':
        return `Parent ${other?.key} has priority ${other?.priority}, larger than ${f.nodes[f.current].priority}. Rotate ${f.direction}: ${at} moves up.`;
      case 'rotate-down':
        return `Rotate ${f.direction}: child ${other?.key} moves up and ${at} moves down. When there are two children, the smaller priority goes up, which keeps the heap order.`;
      case 'remove':
        return `The node is a leaf now, so remove it. The treap holds ${plural(f.size, 'key')}.`;
      case 'done':
        return f.size === 0
          ? en.treapEmpty
          : `The treap holds ${plural(f.size, 'key')}, height ${f.height}, a BST by key and a heap by priority.`;
    }
  },
  takeaways: [
    'A skip list’s bottom level holds all the keys in order. Each key’s tower grows one level per heads, so about half the keys reach level 2, a quarter reach level 3, and so on, for about log₂ n levels.',
    'A search moves right while the next key is smaller and drops otherwise. A level visits only about two nodes in expectation, which gives O(log n) expected time, without any rotations.',
    'A treap is a BST by key and a heap by priority at the same time; here it is a min-heap, so a smaller priority sits nearer the root. With distinct priorities there is exactly one such tree for a set of pairs, whatever the insert order.',
    'Because priorities are random and not set by the input, an adversary can’t force a bad shape through the insert order. The tree looks like a BST built from a random insert order, with expected height O(log n).',
    'Try “Well-spread towers” against “No tall towers” in the skip list: searching 70 costs 6 comparisons against 7, and the gap widens with size. In the treap, compare “Sorted keys, mixed priorities” (height 4) with “Sorted keys, rising priorities” (height 7), then load “Same pairs, other order”.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'Skip list search',
      'O(log n) expected',
      'About log₂ n levels with about two nodes per level.',
    ],
    [
      'Skip list insert, delete',
      'O(log n) expected',
      'A search, then a link or unlink on each level the tower reaches.',
    ],
    [
      'Treap search',
      'O(log n) expected',
      'Random priorities give a random-looking shape, with expected height O(log n).',
    ],
    [
      'Treap insert, delete',
      'O(log n) expected',
      'A walk, then an expected fewer than 2 rotations.',
    ],
    [
      'Any of them, bad luck',
      'O(n) worst case',
      'Very unlikely for random choices, and not something the input can force.',
    ],
    [
      'Memory',
      'O(n)',
      'A skip list averages about 2 links per key; a treap stores one priority per key.',
    ],
  ],
  nextTeaser:
    'Next up: Ordered maps and augmented trees, where each node also stores its subtree size to answer rank and k-th smallest queries.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'In the skip list, load “Well-spread towers”, where 10, …, 80 have heights 1, 2, 1, 3, 1, 2, 1, 4. How many key comparisons does its search for 70 make?',
      answer: 6,
      unit: 'comparisons',
      hints: [
        'The preset ends with this search, so step through it and read the card.',
        'List the keys compared: first 80, then 40, and so on.',
      ],
      solution:
        'The comparisons are 80 (drop), 40 (right), 80 (drop), 60 (right), 80 (drop) and 70 (found), which makes 6.',
    },
    {
      type: 'number',
      prompt: 'Now load “No tall towers”. How many comparisons does the same search make?',
      answer: 7,
      unit: 'comparisons',
      hints: ['There is only one level, so it visits keys in order.'],
      solution:
        'It compares 10, 20, 30, 40, 50, 60 and 70 in turn, which makes 7. With only 8 keys the gap is small, but it grows quickly: this count is linear and the towers’ count is logarithmic.',
    },
    {
      type: 'number',
      prompt: 'With a fair coin, what is the expected tower height, ignoring any cap?',
      answer: 2,
      hints: [
        'The height is 1 plus the number of heads before the first tails.',
        'The expected number of heads before the first tails is 1.',
      ],
      solution:
        'Height 1 has chance 1/2, height 2 has 1/4, height 3 has 1/8, and so on. The sum 1/2 + 2/4 + 3/8 + … = 2, so the links in total are about 2n.',
    },
    {
      type: 'number',
      prompt: 'What is the chance a tower reaches height 3 or more? Answer as a decimal.',
      answer: 0.25,
      tolerance: 0.001,
      hints: ['It takes exactly two heads in a row, whatever comes next.'],
      solution: 'Two heads in a row has chance 1/2 × 1/2 = 0.25.',
    },
    {
      type: 'number',
      prompt:
        'In the treap, load “Sorted keys, rising priorities”, where 10, …, 70 have priorities 1, …, 7. What height does the treap reach?',
      answer: 7,
      hints: ['Each new key has the largest key and the largest priority so far.'],
      solution:
        'No rotation fires, and every key stays the right child of the one before. Height 7 is the worst case: real random priorities make this shape very unlikely.',
    },
    {
      type: 'choice',
      prompt:
        'In this min-heap treap, a new leaf with key 40, priority 5 is the right child of key 20, priority 9. What happens next?',
      options: [
        'Rotate left, so 40 becomes the parent of 20',
        'Rotate right, so 40 becomes the parent of 20',
        'Nothing, because 40 > 20 is the correct key order',
        'Swap the keys of the two nodes',
      ],
      answer: 0,
      hints: [
        'A smaller priority must sit nearer the root.',
        'A right child is lifted by a left rotation.',
      ],
      solution:
        'Priority 5 is smaller than 9, so the heap order is broken. A left rotation lifts the right child 40 above 20 and keeps the keys in BST order.',
    },
    {
      type: 'multi',
      prompt:
        'Which statements are true of this lesson’s min-heap treaps with distinct priorities?',
      options: [
        'The set of (key, priority) pairs fixes the shape of the tree',
        'The node with the smallest priority is the root',
        'An in-order walk visits the keys in sorted order',
        'The height is always at most 2 log₂(n + 1)',
      ],
      answers: [0, 1, 2],
      hints: [
        'Load “Same pairs, other order” and compare the result.',
        'The chain preset is a treap too.',
      ],
      solution:
        'The smallest priority must be the root, and it splits the keys, so each side is fixed the same way. It is also a BST, so in-order is sorted. Height is only O(log n) in expectation: bad priorities give a chain.',
    },
    {
      type: 'order',
      prompt: 'Put the steps of a treap delete in order.',
      items: [
        'Remove the node, which is now a leaf',
        'Walk down by key to find the node',
        'While it has a child, rotate up the child with the smaller priority',
      ],
      answer: [1, 2, 0],
      hints: ['A leaf is easy to remove, so first make it one.'],
      solution:
        'Find the node, then rotate it down, always lifting the child with the smaller priority so that the heap order stays correct. Once it is a leaf, remove it.',
    },
  ],
};
