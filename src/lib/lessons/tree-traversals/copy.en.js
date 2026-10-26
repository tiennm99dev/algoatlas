/** @typedef {import('$lib/algo-engine/tree-traversals.js').TraversalFrame} TraversalFrame */
/** @typedef {import('$lib/algo-engine/tree-traversals.js').TraversalOrder} TraversalOrder */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** @type {Record<TraversalOrder, string>} */
const ORDER_NAMES = {
  pre: 'Preorder',
  in: 'Inorder',
  post: 'Postorder',
  level: 'Level order',
};

export const en = {
  slug: 'tree-traversals',
  topic: 'trees',
  level: 'Beginner',
  title: 'Tree traversals',
  intro:
    'A traversal visits every node of a tree exactly once. Preorder visits a node before its subtrees, inorder between them and postorder after them; level order sweeps the tree level by level. Each runs in O(n), and each order answers different questions.',
  summary:
    'Step through preorder, inorder, postorder and level order with an explicit stack or queue, and watch each node get its visit number.',
  instruction:
    'Pick a traversal, then step. Each visited node gets its number in the corner. Edit the tree in array order (- for an empty slot) or load a preset, and switch orders to compare the numbers on the same tree.',
  orderLabel: 'Traversal',
  orders: ORDER_NAMES,
  treeLabel: 'Tree (array order, - for empty)',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    letters: 'Letters',
    expression: 'Expression (a + b) × (c − d)',
    chain: 'Left chain',
    perfect: 'Perfect, 15 nodes',
  },
  treeErrors: {
    empty: 'Type at least the root.',
    count: 'Use at most 15 slots (four levels).',
    format: 'Labels are 1 or 2 letters, digits or operators; use - for an empty slot.',
    duplicate: 'Each label may appear only once.',
    orphan:
      'Every node needs a parent: slot i hangs under slot ⌊(i − 1) / 2⌋, which must be filled.',
  },
  treeTitle: 'Tree',
  /** @param {string[]} visited @param {number} total */
  treeAria: (visited, total) =>
    `Binary tree with ${plural(total, 'node')}. Visited so far: ${visited.length === 0 ? 'none' : visited.join(', ')}.`,
  /** @param {string} label @param {number | null} n @param {string} state */
  nodeLabel: (label, n, state) =>
    [`Node ${label}`, n === null ? 'not visited yet' : `visited ${ordinal(n)}`, state]
      .filter(Boolean)
      .join(', '),
  states: { active: 'acted on now', frontier: 'waiting in the stack or queue' },
  markers: { active: '▶', frontier: '…' },
  legend: {
    active: 'Acted on now',
    frontier: 'Waiting in the stack or queue',
    visited: 'Visited (number = visit order)',
    idle: 'Not reached yet',
  },
  /** @param {TraversalOrder} order */
  workTitle: (order) => (order === 'level' ? 'Queue (front → back)' : 'Stack (bottom → top)'),
  /** @param {string} label @param {boolean} visit */
  workItem: (label, visit) => (visit ? `visit ${label}` : label),
  workLegend: {
    expand: 'expand: explore this subtree',
    visit: 'visit: output when popped',
  },
  /** @param {TraversalOrder} order @param {string[]} items */
  workAria: (order, items) =>
    `${order === 'level' ? 'Queue, front first' : 'Stack, bottom first'}: ${items.length === 0 ? 'empty' : items.join(', ')}.`,
  outputTitle: 'Output, in visit order',
  outputEmpty: 'nothing yet',
  stats: { visited: 'Visited', pushes: 'Pushes', pops: 'Pops', peak: 'Peak size' },
  /** @param {number} a @param {number} b */
  ofTotal: (a, b) => `${a} of ${b}`,
  allTitle: 'All four orders on this tree',
  allHidden: 'Step to the end to compare all four orders.',
  recursiveTitle: 'Recursive form',
  /** @type {Record<TraversalOrder, string[]>} */
  recursive: {
    pre: ['pre(node):', '  if node is empty: return', '  output node', '  pre(left); pre(right)'],
    in: ['in(node):', '  if node is empty: return', '  in(left)', '  output node; in(right)'],
    post: [
      'post(node):',
      '  if node is empty: return',
      '  post(left); post(right)',
      '  output node',
    ],
    level: [
      'Level order has no short recursive form:',
      'the queue keeps each level in order,',
      'which the call stack cannot do.',
    ],
  },
  /** @param {TraversalFrame} f @param {(string | null)[]} slots */
  describe(f, slots) {
    const at = f.current >= 0 ? String(slots[f.current]) : '';
    const L = 2 * f.current + 1;
    const R = 2 * f.current + 2;
    const kid = (/** @type {number} */ i) => (slots[i] ? String(slots[i]) : null);
    const kids = [kid(L), kid(R)].filter(Boolean);
    switch (f.kind) {
      case 'start':
        return f.order === 'level'
          ? `${ORDER_NAMES.level}: put the root ${slots[0]} in the queue.`
          : `${ORDER_NAMES[f.order]}: push “expand ${slots[0]}”, the whole tree, on the stack.`;
      case 'expand': {
        const parts = {
          pre: `visit ${at} first, then its left subtree, then its right`,
          in: `its left subtree first, then visit ${at}, then its right subtree`,
          post: `its left subtree, then its right, and visit ${at} last`,
        }[/** @type {'pre'|'in'|'post'} */ (f.order)];
        return `Pop “expand ${at}”. Push its parts in reverse so they pop as: ${parts}.${kids.length === 0 ? ` ${at} has no children, so only “visit ${at}” is pushed.` : ''}`;
      }
      case 'visit':
        return f.order === 'level'
          ? `Dequeue ${at} and output it: visit number ${f.output.length}.`
          : `Pop “visit ${at}” and output it: visit number ${f.output.length}.`;
      case 'enqueue':
        return `Enqueue the children of ${at} (${kids.join(', ')}) at the back, so the next level waits behind this one.`;
      case 'done':
        return `Done: ${ORDER_NAMES[f.order].toLowerCase()} is ${f.output.map((i) => slots[i]).join(' ')}. Every node was visited once.`;
    }
  },
  takeaways: [
    'Preorder (node, left, right) copies or prints a tree top-down. Inorder (left, node, right) lists a binary search tree in sorted order. Postorder (left, right, node) finishes children first, so it suits deleting a tree or computing sizes and heights.',
    'On an expression tree, preorder gives prefix notation, inorder the usual infix (without brackets) and postorder the postfix form that a stack calculator evaluates.',
    'Recursion keeps its place on the call stack. An explicit stack does the same job: push the parts of a node in reverse and they pop in order. Only where “visit node” sits changes between the three depth-first orders.',
    'Level order swaps the stack for a queue: first in, first out keeps the levels in order. That is breadth-first search on a tree.',
    'Try the left chain: the stack grows with the height, while the queue never holds more than one node. On the perfect tree the queue grows to the widest level, 8.',
  ],
  complexityHead: ['Traversal', 'Cost', 'Why'],
  complexity: [
    ['Any of the four, time', 'O(n)', 'Each node is pushed and popped a constant number of times.'],
    [
      'Pre, in, post: memory',
      'O(h)',
      'The stack holds at most a few items per level of the current path.',
    ],
    [
      'Level order: memory',
      'O(w)',
      'The queue holds at most about one level, up to w = n / 2 on a perfect tree.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt:
        'Load “Letters” (A; B and C below it; D and E under B; F as C’s right child). Type its postorder, letters separated by spaces.',
      accept: ['D E B F C A', 'DEBFCA', 'D, E, B, F, C, A'],
      hints: ['Left subtree, right subtree, then the node.', 'Pick Postorder and step to the end.'],
      solution:
        'Postorder of B’s subtree is D E B, of C’s subtree F C, and A comes last: D E B F C A.',
    },
    {
      type: 'choice',
      prompt: 'Which traversal of a binary search tree lists its keys in increasing order?',
      options: ['Preorder', 'Inorder', 'Postorder', 'Level order'],
      answer: 1,
      hints: ['Every smaller key sits in the left subtree, every larger key in the right.'],
      solution:
        'Inorder visits the whole left subtree (all smaller keys), then the node, then the right subtree (all larger keys), so the keys come out sorted.',
    },
    {
      type: 'order',
      prompt:
        'Put the expression tree (a + b) × (c − d) in postorder, the order a stack calculator evaluates it.',
      items: ['×', 'a', '+', 'b', 'c', '−', 'd'],
      answer: [1, 3, 2, 4, 6, 5, 0],
      hints: ['Load the Expression preset and pick Postorder.'],
      solution:
        'Postorder is a b + c d − ×: both operands come before their operator, so a stack calculator can push a and b, apply +, and so on.',
    },
  ],
  nextTeaser:
    'Next up: binary search trees, where inorder comes out sorted and every operation walks one path.',
};

/** @param {number} n */
function ordinal(n) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
  return `${n}${s}`;
}
