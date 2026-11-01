import { balanceOf } from '$lib/algo-engine/avl-trees.js';

/** @typedef {import('$lib/algo-engine/avl-trees.js').AvlFrame} AvlFrame */
/** @typedef {import('$lib/algo-engine/avl-trees.js').AvlOp} AvlOp */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * The tallest AVL tree that `n` keys can form, from the fewest keys each height needs:
 * N(h) = N(h − 1) + N(h − 2) + 1.
 * @param {number} n
 */
function tallest(n) {
  let h = 1;
  let shorter = 0;
  let fewest = 1;
  while (fewest + shorter + 1 <= n) {
    [shorter, fewest] = [fewest, fewest + shorter + 1];
    h++;
  }
  return h;
}

export const en = {
  slug: 'avl-trees',
  topic: 'balanced-bst',
  level: 'Intermediate',
  title: 'AVL trees',
  intro:
    'An AVL tree is a binary search tree in which the heights of every node’s two subtrees differ by at most 1. Each node stores its height, and after a change the ancestors recheck their balance factor on the way up and rotate as soon as one reaches ±2.',
  summary:
    'Insert and delete keys in an AVL tree, read each node’s balance factor, and step through the single and double rotations that repair it.',
  instruction:
    'Type a key or click a node, then insert, search or delete. Each node shows its balance factor. Step through the walk down and the retrace back up, and load the four case presets to see each rotation.',
  keyLabel: 'Key',
  insert: 'Insert',
  search: 'Search',
  remove: 'Delete',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    ll: 'Left-left',
    rr: 'Right-right',
    lr: 'Left-right',
    rl: 'Right-left',
    sorted: 'Sorted keys',
    cascade: 'Delete rotating twice',
    random: 'Random',
  },
  full: 'The tree is full (15 keys).',
  logFull: 'The log is full (20 operations). Undo or reset to continue.',
  keyError: 'Keys must be whole numbers from 0 to 99.',
  emptyTree: 'The tree is empty.',
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  /** @param {AvlOp} op */
  opChip: (op) =>
    `${op.type === 'insert' ? en.insert : op.type === 'search' ? en.search : en.remove} ${op.key}`,
  stats: {
    comparisons: 'Comparisons (this operation)',
    opRotations: 'Rotations (this operation)',
    rotations: 'Rotations (all)',
    height: 'Height',
    size: 'Keys',
  },
  /** @param {number} n */
  bound: (n) =>
    n === 0
      ? 'An empty tree has height 0.'
      : `With ${plural(n, 'key')}, an AVL tree’s height is at most ${tallest(n)}.`,
  casesTitle: 'The four repairs',
  caseHead: ['Case', 'Shape', 'Fix'],
  cases: {
    LL: ['Left child leans left or even', 'Rotate right'],
    LR: ['Left child leans right', 'Rotate left at child, then right'],
    RR: ['Right child leans right or even', 'Rotate left'],
    RL: ['Right child leans left', 'Rotate right at child, then left'],
  },
  caseCurrent: '(now)',
  /** @param {number} bf */
  signed: (bf) => `${bf > 0 ? '+' : bf < 0 ? '−' : ''}${Math.abs(bf)}`,
  /** @param {number} bf */
  note: (bf) => `bf ${en.signed(bf)}`,
  /** @param {number[]} keys @param {number} h */
  treeLabel: (keys, h) =>
    `AVL tree with ${plural(keys.length, 'key')}, height ${h}. In order: ${keys.join(', ') || 'none'}.`,
  /** @param {string} key @param {string} note @param {string} state */
  nodeLabel: (key, note, state) => `Key ${key}, ${note}${state ? `, ${state}` : ''}`,
  roles: {
    compare: 'compared',
    path: 'on the path',
    added: 'new',
    retrace: 'rechecking',
    unbalanced: 'unbalanced',
    up: 'rotated up',
    down: 'rotated down',
    successor: 'successor',
  },
  markers: {
    compare: '?',
    path: '',
    added: '+',
    retrace: '✓',
    unbalanced: '!',
    up: '↑',
    down: '↓',
    successor: 'S',
  },
  /** @param {AvlFrame} f */
  describe(f) {
    const key = f.op?.key ?? 0;
    const at = f.current >= 0 ? f.nodes[f.current].key : null;
    switch (f.kind) {
      case 'start':
        return en.emptyTree;
      case 'visit':
        return `Compare ${key} with ${at}.`;
      case 'go-left':
        return `${key} < ${at}, so go left.`;
      case 'go-right':
        return `${key} > ${at}, so go right.`;
      case 'insert':
        return `Attach ${key} as a new leaf. The heights above it are now out of date, so walk back up.`;
      case 'found':
        return f.op?.type === 'delete'
          ? `Found ${key}, the node to delete.`
          : `Found ${key} after ${plural(f.comparisons, 'comparison')}. A search changes nothing.`;
      case 'missing':
        return `${key} is not in the tree.`;
      case 'dup':
        return `${key} is already in the tree, so the insert is ignored.`;
      case 'successor':
        return `Two children: the successor is the smallest key on the right, heading to ${f.nodes[f.succ].key}.`;
      case 'copy':
        return `Copy the successor ${f.nodes[f.succ].key} into the node that held ${key}. Its old node is removed next.`;
      case 'unlink':
        return `The node is unlinked. Its ancestors may now be too short on this side, so walk back up.`;
      case 'retrace':
        return `At ${at}, refresh the height to ${f.nodes[f.current].height}. Its balance factor is ${en.signed(balanceOf(f.nodes, f.current))}.`;
      case 'unbalanced':
        return `${at} has balance factor ${en.signed(balanceOf(f.nodes, f.current))}, so the height rule is broken. This is the ${f.imbalance} case.`;
      case 'rotate': {
        const up = f.nodes[f.moved].key;
        const down = f.nodes[f.sunk].key;
        return f.prepares
          ? `First half of ${f.imbalance}: rotate ${f.direction} at ${down}, so ${up} moves up and the bend straightens into a line.`
          : `Rotate ${f.direction} at ${down}: ${up} moves up, ${down} moves down, and this subtree is balanced again.`;
      }
      case 'done':
        return f.size === 0
          ? en.emptyTree
          : `The tree has ${plural(f.size, 'key')} and height ${f.height}, with every balance factor within ±1.`;
    }
  },
  takeaways: [
    'The balance factor is height(left) − height(right). The AVL invariant says it is −1, 0 or +1 at every node.',
    'A factor of +2 points at the left child, −2 at the right. If the child leans the same way or is even, one rotation fixes it (LL, RR). If it leans the opposite way, a first rotation straightens the bend and a second one fixes it (LR, RL).',
    'The fewest keys in a tree of height h obey N(h) = N(h − 1) + N(h − 2) + 1, a Fibonacci-like growth. So h stays below about 1.44 log₂(n + 2), and every operation is O(log n).',
    'After an insert one repair is enough, because it puts the subtree back at its old height. A delete can shorten the subtree, so it may rotate at many levels on the way up.',
    'Try “Delete rotating twice”: 12 keys form the sparsest possible tree of height 5, and removing 80 makes 70 and then the root rebalance. Then load “Sorted keys” and count the rotations.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Search', 'O(log n)', 'One path from the root, and the height is below 1.44 log₂(n + 2).'],
    [
      'Insert',
      'O(log n)',
      'A walk down, a retrace up, and at most one repair of 1 or 2 rotations.',
    ],
    ['Delete', 'O(log n)', 'A walk down, a retrace up, and up to one repair per level.'],
    ['One rotation', 'O(1)', 'A fixed number of links and two stored heights change.'],
    ['Memory', 'O(n)', 'One node per key, each with a small stored height.'],
  ],
  nextTeaser:
    'Next up: Red-black trees, which relax the balance rule so most inserts can fix themselves by recolouring.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Insert 40, 20, 60, 10, 30, 25 in that order. Just before the rotation, what is the balance factor of the root, 40?',
      answer: 2,
      hints: [
        'Heights count nodes. The right subtree is just 60.',
        'On the left, the longest path is 20 → 30 → 25.',
      ],
      solution:
        'height(left) = 3 for the path 20, 30, 25, and height(right) = 1 for 60. So the factor is 3 − 1 = +2, which breaks the AVL rule.',
    },
    {
      type: 'choice',
      prompt: 'In that same tree, which case repairs node 40?',
      options: [
        'LL: rotate right',
        'LR: rotate left at 20, then right at 40',
        'RR: rotate left',
        'RL: rotate right at 60, then left at 40',
      ],
      answer: 1,
      hints: [
        'The factor +2 means the left side is too tall. Now look at the left child, 20.',
        'Node 20 has left height 1 and right height 2.',
      ],
      solution:
        'The left child 20 has balance factor 1 − 2 = −1, so it leans right. That bend is the LR case: rotate left at 20, lifting 30, then right at 40, leaving 30 as the root.',
    },
    {
      type: 'text',
      prompt:
        'Insert 10, 20, 30 into an empty AVL tree. Which direction is the rotation that repairs it?',
      accept: [
        'left',
        'rotate left',
        'left rotation',
        'a left rotation',
        'single left',
        'single left rotation',
      ],
      hints: ['All the weight is on the right, in a straight line.'],
      solution:
        'Node 10 has factor −2 and its right child 20 also leans right. That is the RR case, a single left rotation at 10, which lifts 20 to the root.',
    },
    {
      type: 'number',
      prompt:
        'Load the “Sorted keys” preset, which inserts 1 to 10. How many single rotations does it spend in total?',
      answer: 6,
      unit: 'rotations',
      hints: ['Go to the last step and read “Rotations (all)”.'],
      solution:
        'The keys 3, 5, 6, 7, 9 and 10 each trigger one left rotation, which gives 6. The tree ends with height 4, not 10.',
    },
    {
      type: 'number',
      prompt: 'What is the smallest number of keys an AVL tree of height 5 can have?',
      answer: 12,
      unit: 'keys',
      hints: [
        'A sparsest tree of height h has a root, one sparsest subtree of height h − 1 and one of height h − 2.',
        'N(0) = 0, N(1) = 1, and N(h) = N(h − 1) + N(h − 2) + 1.',
      ],
      solution:
        'N(2) = 2, N(3) = 4, N(4) = 7, and N(5) = 7 + 4 + 1 = 12. The “Delete rotating twice” preset builds exactly such a tree.',
    },
    {
      type: 'multi',
      prompt: 'Which statements about AVL trees are true?',
      options: [
        'One repair is always enough after an insert',
        'A delete may need repairs at several levels',
        'Every node’s two subtrees have exactly the same height',
        'A rotation changes the sorted order of the keys only temporarily',
      ],
      answers: [0, 1],
      hints: [
        'Compare the height of the repaired subtree with its height before the change.',
        'Is a balance factor of +1 allowed?',
      ],
      solution:
        'An insert’s repair restores the subtree’s old height, so nothing above changes, while a delete’s repair can leave it one shorter, so ancestors may need their own repairs. Factors of ±1 are allowed, and a rotation never changes the sorted order.',
    },
    {
      type: 'order',
      prompt: 'Put the steps of an AVL insert in order.',
      items: [
        'Rotate if a factor has reached ±2',
        'Walk down from the root comparing keys',
        'Recompute the height and balance factor of an ancestor',
        'Attach the new key as a leaf',
      ],
      answer: [1, 3, 2, 0],
      hints: ['The rebalance happens on the way back up, after the leaf exists.'],
      solution:
        'First walk down, then attach the leaf. On the way back up each ancestor refreshes its height and factor, and rotates as soon as the factor reaches ±2.',
    },
    {
      type: 'number',
      prompt:
        'Load “Delete rotating twice” and step to the last frame of the final delete, one before the end. How many single rotations has it spent?',
      answer: 3,
      unit: 'rotations',
      hints: [
        'Read “Rotations (this operation)” there; the very last frame belongs to no operation and shows 0.',
        'The first repair is a double rotation.',
      ],
      solution:
        'Removing 80 leaves 70 with factor +2 and a left child leaning right, an LR repair of 2 rotations. That subtree is now shorter, so root 50 reaches +2 and takes a single rotation, making 3.',
    },
  ],
};
