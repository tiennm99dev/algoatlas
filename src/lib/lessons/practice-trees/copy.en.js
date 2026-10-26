/** @typedef {import('$lib/algo-engine/practice-trees.js').ValidateFrame} ValidateFrame */
/** @typedef {import('$lib/algo-engine/practice-trees.js').LcaFrame} LcaFrame */
/** @typedef {import('$lib/algo-engine/practice-trees.js').KeySlots} KeySlots */

/** @param {number} x */
const num = (x) => (x === -Infinity ? '−∞' : x === Infinity ? '+∞' : String(x));

/** @param {{lo: number, hi: number}} b */
const range = (b) => `(${num(b.lo)}, ${num(b.hi)})`;

export const en = {
  slug: 'practice-trees',
  topic: 'trees',
  level: 'Intermediate',
  title: 'Practice: tree problems',
  intro:
    'Two classic binary search tree problems. To validate a BST, every key must sit inside the range its ancestors allow, not just beside its parent. To find the lowest common ancestor of two keys, walk down from the root until the keys split to different sides.',
  summary:
    'Check whether a binary tree is a BST with key ranges, see why the parent-only check fails, and find lowest common ancestors by clicking two nodes.',
  instruction:
    'Pick a problem. For Validate, compare the range check with the parent-only check on the trap presets. For Lowest common ancestor, click two nodes to choose p and q and step through the walk. Use the widget to answer the questions below.',
  problemLabel: 'Problem',
  problems: { validate: 'Validate a BST', lca: 'Lowest common ancestor' },
  methodLabel: 'Check',
  methods: { range: 'Key ranges', local: 'Parent only (flawed)' },
  keysLabel: 'Keys (array order, - for empty)',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    valid: 'Valid BST',
    trap: 'Trap: 60 under 30',
    'deep-trap': 'Trap: 15 under 30',
    swapped: 'Swapped children',
    big: 'Valid, 15 keys',
  },
  keyErrors: {
    empty: 'Type at least the root key.',
    count: 'Use at most 15 slots (four levels).',
    format: 'Keys are whole numbers from 0 to 99; use - for an empty slot.',
    duplicate: 'Each key may appear only once.',
    orphan:
      'Every key needs a parent: slot i hangs under slot ⌊(i − 1) / 2⌋, which must be filled.',
  },
  treeTitle: 'Tree',
  /** @param {number[]} keys */
  treeAria: (keys) => `Binary tree, keys in array order: ${keys.join(', ')}.`,
  pickHint: 'Click or press Enter on a node to make it q; the old q becomes p.',
  /** @param {number} p @param {number} q */
  picksText: (p, q) => `p = ${p}, q = ${q}`,
  notBst:
    'This tree is not a BST, so the walk relies on an order that is not there and may stop at the wrong node.',
  /** @param {number | null} key */
  trueLca: (key) => `Lowest common ancestor by parent links: ${key ?? 'none'}.`,
  /** @param {number} key @param {string} state @param {string} extra */
  nodeLabel: (key, state, extra) => [`Key ${key}`, extra, state].filter(Boolean).join(', '),
  /** @param {{lo: number, hi: number}} b */
  rangeNote: range,
  /** @param {{lo: number, hi: number}} b */
  rangeText: (b) => `must lie in ${range(b)}`,
  states: {
    active: 'checked now',
    frontier: 'waiting for its subtrees',
    visited: 'passed',
    swap: 'failed',
    path: 'on the walk',
    sorted: 'lowest common ancestor',
  },
  markers: {
    active: '▶',
    frontier: '…',
    visited: '✓',
    swap: '✗',
    path: '•',
    sorted: '★',
    p: 'p',
    q: 'q',
  },
  legend: {
    active: 'Checked now',
    frontier: 'Waiting on the call stack',
    visited: 'Passed its test',
    swap: 'Failed its test',
    path: 'On the walk',
    sorted: 'Lowest common ancestor',
    picks: 'p, q: the two chosen keys (corner letter)',
  },
  inorderTitle: 'Inorder keys',
  inorderEmpty: 'none',
  dropLabel: 'smaller than the key before it',
  /** @param {boolean} ok */
  inorderVerdict: (ok) => (ok ? 'Strictly increasing: a BST.' : 'Not increasing: not a BST.'),
  stats: {
    comparisons: 'Key comparisons',
    checked: 'Nodes checked',
    visited: 'Nodes visited',
    depth: 'Stack depth',
    result: 'Result',
    answer: 'LCA',
  },
  results: { pending: '?', valid: 'valid', invalid: 'not a BST' },
  stackTitle: 'Call stack (outermost first)',
  stackEmpty: 'empty',
  /** @param {ValidateFrame} f @param {KeySlots} s */
  describeValidate(f, s) {
    const k = f.current >= 0 ? s[f.current] : null;
    const b = f.current >= 0 ? f.bounds[f.current] : null;
    const l = s[2 * f.current + 1];
    const r = s[2 * f.current + 2];
    switch (f.kind) {
      case 'start':
        return f.method === 'range'
          ? 'Check the root with the widest range, (−∞, +∞). Each step down narrows the range.'
          : 'Check each node against its own two children only.';
      case 'enter':
        if (f.method === 'range' && b)
          return f.status[f.current] === 'ok'
            ? `${num(b.lo)} < ${k} < ${num(b.hi)}: ${k} is inside its range.`
            : `${k} is not inside ${range(b)}.`;
        return f.status[f.current] === 'ok'
          ? `${k}: ${l == null ? 'no left child' : `left ${l} < ${k}`}, ${r == null ? 'no right child' : `right ${r} > ${k}`}. Fine locally.`
          : `${k} and its children are out of order.`;
      case 'empty':
        return `An empty subtree under ${k} is always fine.`;
      case 'go-left':
        return f.method === 'range'
          ? `Go left: keys there must be smaller than ${k}, so the range becomes (${num(b?.lo ?? -Infinity)}, ${k}).`
          : `Go left and check ${k}’s left subtree the same way.`;
      case 'go-right':
        return f.method === 'range'
          ? `Go right: keys there must be larger than ${k}, so the range becomes (${k}, ${num(b?.hi ?? Infinity)}).`
          : `Go right and check ${k}’s right subtree the same way.`;
      case 'fail':
        return f.method === 'range'
          ? `${k} breaks the BST property: an ancestor needs every key here to be in ${b ? range(b) : ''}. Return false.`
          : `${k} has a child on the wrong side. Return false.`;
      case 'done':
        if (f.result)
          return f.method === 'range'
            ? 'Every key lies inside its range: this is a valid BST.'
            : 'Every node is in order with its children. The parent-only check says “valid”, but compare with the inorder keys.';
        return 'Not a BST: the check returned false.';
    }
  },
  /** @param {LcaFrame} f @param {KeySlots} s */
  describeLca(f, s) {
    const k = f.current >= 0 ? s[f.current] : null;
    switch (f.kind) {
      case 'start':
        return `Find the lowest common ancestor of p = ${f.p} and q = ${f.q}: start at the root.`;
      case 'visit':
        return `Compare p = ${f.p} and q = ${f.q} with ${k}.`;
      case 'go-left':
        return `Both are smaller than ${k}, so both live in its left subtree. Go left.`;
      case 'go-right':
        return `Both are larger than ${k}, so both live in its right subtree. Go right.`;
      case 'found':
        return f.p === k || f.q === k
          ? `${k} is one of the two keys, and the other lies below it: ${k} is the lowest common ancestor.`
          : `${f.p} and ${f.q} fall on different sides of ${k}: ${k} is the lowest common ancestor.`;
      case 'fell-off':
        return 'The walk fell off the tree: a key is missing.';
      case 'done':
        return f.answer >= 0
          ? `Done in ${f.path.length} ${f.path.length === 1 ? 'step' : 'steps'}: LCA(${f.p}, ${f.q}) = ${s[f.answer]}.`
          : 'Done: no common ancestor found.';
    }
  },
  takeaways: [
    'A BST needs every key in a node’s left subtree to be smaller and every key in its right subtree larger, not only its children. Checking each node against its parent alone misses a key that sits on the wrong side of a higher ancestor.',
    'Pass a range down: the root gets (−∞, +∞), a left child gets (lo, key) and a right child (key, hi). One visit per node, so O(n). Equivalently, a tree is a BST exactly when its inorder keys strictly increase.',
    'In a BST, the lowest common ancestor of p and q is the first node on the walk from the root where they do not both go the same way. A node counts as its own ancestor, so if p is above q, the answer is p.',
    'The LCA walk follows one path, so it costs O(h): O(log n) when the tree is balanced, O(n) when it is a chain. In a tree that is not a BST it can stop at the wrong node.',
    'Try the trap presets with both checks: the parent-only check says “valid” while the inorder keys show a drop.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    ['Validate, time', 'O(n)', 'Each node is checked once against its range.'],
    ['Validate, memory', 'O(h)', 'One open call per level of the current path.'],
    ['LCA in a BST, time', 'O(h)', 'One step down per comparison; no backtracking.'],
    ['LCA in a BST, memory', 'O(1)', 'The walk is a loop with one pointer.'],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt:
        'Load “Trap: 60 under 30” (50; 30 and 70 below it; 20 and 60 under 30). What does the parent-only check report?',
      options: ['Valid', 'Not a BST, at 60', 'Not a BST, at 30'],
      answer: 0,
      hints: ['Pick Parent only and step to the end.', 'Is 60 larger than its parent 30?'],
      solution:
        'Every node is in order with its own children (20 < 30 < 60, 30 < 50 < 70), so the parent-only check says valid. It is wrong: 60 sits in 50’s left subtree but is larger than 50.',
    },
    {
      type: 'number',
      prompt: 'Same preset, range check: at which key does the check fail?',
      answer: 60,
      hints: ['Pick Key ranges and step until a node turns red.'],
      solution:
        '50 passes (−∞, +∞), 30 passes (−∞, 50), 20 passes (−∞, 30), then 60 must lie in (30, 50) and does not.',
    },
    {
      type: 'text',
      prompt:
        'In the “Trap: 15 under 30” preset (20; 10 and 30 below it; 15 and 40 under 30), what range must the key 15 lie in? Write it as (lo, hi).',
      accept: ['(20, 30)', '20 < x < 30', '20 < key < 30', 'between 20 and 30'],
      hints: [
        '15 is the left child of 30, which is the right child of 20.',
        'Going right from 20 sets lo = 20; going left from 30 sets hi = 30.',
      ],
      solution:
        'The range starts as (−∞, +∞), becomes (20, +∞) going right from 20 and (20, 30) going left from 30. 15 is not above 20, so the tree is not a BST.',
    },
    {
      type: 'number',
      prompt: 'Load “Valid BST”. What is the lowest common ancestor of 40 and 60?',
      answer: 50,
      hints: ['Switch to Lowest common ancestor and click 40, then 60.'],
      solution: '40 < 50 < 60, so the two keys split at the root: LCA(40, 60) = 50.',
    },
    {
      type: 'number',
      prompt: 'Load “Valid, 15 keys”. What is the lowest common ancestor of 54 and 78?',
      answer: 72,
      hints: ['Both keys are larger than the root 48, so the walk goes right first.'],
      solution:
        'At 48 both are larger: go right. At 72, 54 is smaller and 78 is larger, so they split: the LCA is 72.',
    },
    {
      type: 'number',
      prompt:
        'Same tree: how many nodes does the walk visit to find the lowest common ancestor of 30 and 36?',
      answer: 3,
      unit: 'nodes',
      hints: ['Click 30 and 36 and read “Nodes visited” at the end.', '36 is the parent of 30.'],
      solution:
        'It visits 48 (both smaller: left), 24 (both larger: right) and 36, which is q itself, so the LCA is 36: three nodes.',
    },
    {
      type: 'choice',
      prompt:
        'Load the trap with 60 under 30, switch to Lowest common ancestor and pick 20 and 60. What does the BST walk return?',
      options: [
        '30, the true lowest common ancestor',
        '50, which is wrong',
        'It falls off the tree',
      ],
      answer: 1,
      hints: ['Compare 20 and 60 with the root 50.'],
      solution:
        '20 < 50 < 60, so the walk stops at 50. The true lowest common ancestor is 30, the parent of both. The walk trusts an order the tree does not have.',
    },
  ],
  nextTeaser:
    'Next up: binary heaps, complete trees stored in an array where every parent beats its children.',
};
