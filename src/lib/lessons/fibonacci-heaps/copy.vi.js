/** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').FibFrame} FibFrame */
/** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').FibOp} FibOp */
/** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').HeapVariant} HeapVariant */

/** @param {number} k @param {string} one @param {string} many */
const count = (k, one, many) => `${k} ${k === 1 ? one : many}`;

export const vi = {
  slug: 'fibonacci-heaps',
  topic: 'advanced-heaps',
  level: 'Nâng cao',
  title: 'Heap nhị thức và heap Fibonacci',
  intro:
    'A binomial or Fibonacci heap is a forest of heap-ordered trees: every root is smaller than everything below it, and the smallest root is the minimum. Two such heaps merge just by joining their root lists, so these are mergeable heaps. A Fibonacci heap goes further and is lazy: insert and decrease-key only touch the root list, in O(1) amortized time, and the tidying waits for extract-min.',
  summary:
    'Insert, extract-min and decrease-key on a Fibonacci heap or a binomial heap, stepping through lazy root lists, consolidation by degree and cascading cuts.',
  instruction:
    'Type a key and press Insert (or Enter), or press Extract min and watch consolidation link roots of equal degree. To decrease a key, press a node in the forest, type its new key and press Decrease key. Switch between Fibonacci and Binomial to compare when each heap does its work.',
  valueLabel: 'Key',
  insert: 'Insert',
  extract: 'Extract min',
  newKeyLabel: 'New key',
  decrease: 'Decrease key',
  undo: 'Undo',
  reset: 'Reset',
  variantLabel: 'Heap',
  variants: { fibonacci: 'Fibonacci (lazy)', binomial: 'Binomial (eager)' },
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    lazy: 'Insert 9, extract 1',
    cascade: 'Cascading cut',
    counter: 'Insert 8 (binary counter)',
    random: 'Random',
  },
  valueError: 'Type a whole number from 0 to 99.',
  full: 'The heap holds at most 15 keys here. Extract one first.',
  emptyError: 'The heap is empty, so there is nothing to extract.',
  logFull: 'The log holds 24 operations. Undo or reset to try more.',
  pickFirst: 'Press a node of the forest first to choose the key to decrease.',
  goneError: 'That node has been extracted. Press a node still in the heap.',
  /** @param {number} key */
  notSmaller: (key) => `The new key must be smaller than the current key ${key}.`,
  /** @param {number} key */
  selectedInfo: (key) => `Selected node: key ${key}. Type a smaller key and press Decrease key.`,
  selectHint: 'Press a node (or focus it and press Enter) to choose it for Decrease key.',
  forestTitle: 'Root list: a forest of heap-ordered trees',
  /** @param {number} trees @param {number} n */
  forestAria: (trees, n) =>
    n === 0
      ? 'The heap is empty.'
      : `${count(trees, 'tree', 'trees')} holding ${count(n, 'key', 'keys')}.`,
  emptyForest: 'The heap is empty.',
  /** @param {number} key @param {string[]} notes @param {number} depth */
  nodeLabel: (key, notes, depth) =>
    [`Key ${key}`, depth === 0 ? 'root' : `depth ${depth}`, ...notes].join(', '),
  nodeNotes: {
    min: 'the minimum',
    marked: 'marked',
    active: 'acted on now',
    other: 'second node in this step',
  },
  tableTitle: 'Degree table A (consolidation)',
  /** @param {(number | null)[]} keys */
  tableAria: (keys) =>
    `Degree table: ${keys.map((k, d) => `degree ${d}: ${k === null ? 'empty' : `key ${k}`}`).join('; ')}.`,
  tableIdle: 'The table is used only while extract-min consolidates the roots.',
  stats: {
    size: 'Keys',
    roots: 'Roots t',
    marked: 'Marked m',
    potential: 'Potential Φ = t + 2m',
    links: 'Links',
    cuts: 'Cuts',
    siftSwaps: 'Sift-up swaps',
    min: 'Minimum',
  },
  noMin: '—',
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'running now',
  /** @param {FibOp} op @param {number | undefined} old */
  opChip: (op, old) =>
    op.type === 'insert'
      ? `+${op.value}`
      : op.type === 'extract'
        ? 'min'
        : `${old ?? '?'}↓${op.value}`,
  outTitle: 'Removed, in order',
  outEmpty: 'nothing yet',
  legend: {
    active: 'Node acted on now',
    compare: 'The other node in this step',
    swap: 'Just linked, cut or swapped',
    sorted: 'The minimum',
    visited: 'Marked: lost a child',
  },
  markers: { active: '→', compare: '?', swap: '⇄', sorted: '★', visited: '×' },
  /**
   * @param {FibFrame} f
   * @param {(id: number) => number | undefined} keyOf  The key of an item in this frame.
   */
  describe(f, keyOf) {
    const k = (/** @type {number} */ id) => keyOf(id) ?? '?';
    const lazy = f.variant === 'fibonacci';
    switch (f.kind) {
      case 'start':
        return lazy
          ? 'An empty Fibonacci heap: a root list of heap-ordered trees and a pointer to the smallest root.'
          : 'An empty binomial heap: a root list with at most one tree of each degree, like the digits of a binary number.';
      case 'insert':
        return lazy
          ? `Insert ${f.value}: add it to the root list as a one-node tree and update min. No linking at all: O(1).`
          : `Insert ${f.value}: it starts as a carry, a tree of degree 0.`;
      case 'carry':
        return `The root ${k(f.other)} also has degree ${f.degree}, so the two trees must link, like 1 + 1 in binary.`;
      case 'carry-link':
        return `Link: ${k(f.other)} goes under ${k(f.node)}, the smaller root. The carry now has degree ${f.degree}.`;
      case 'placed':
        return `No other root has degree ${f.degree}: the carry joins the root list. Every degree appears at most once.`;
      case 'empty':
        return 'The heap is empty, so there is nothing to extract.';
      case 'extract':
        return lazy
          ? `Extract min: the min pointer names ${f.value}. Remove it and lift its children into the root list.`
          : `Extract min: scan the roots for the smallest, ${f.value}. Remove it and lift its children into the root list.`;
      case 'promote':
        return f.trees.length === 0
          ? `Return ${f.value}. Nothing is left, so there is nothing to consolidate.`
          : `${f.value} is gone; its children are roots now. ${count(f.trees.length, 'root', 'roots')} to consolidate.`;
      case 'scan':
        return `Consolidate: take the root ${k(f.node)}, of degree ${f.degree}.`;
      case 'link':
        return `A[${f.degree}] already held a tree of degree ${f.degree}: link ${k(f.other)} under ${k(f.node)}, the smaller root. Degree ${f.degree} → ${f.degree + 1}.`;
      case 'slot':
        return `A[${f.degree}] is free: store ${k(f.node)} there.`;
      case 'rebuild':
        return f.node < 0
          ? 'The heap is empty.'
          : `Every degree now appears once. The roots in A form the new root list; the minimum is ${k(f.node)}. Return ${f.value}.`;
      case 'decrease':
        return lazy
          ? `Decrease ${f.old} to ${f.value}.${f.other < 0 ? ' It is a root, so heap order cannot break.' : ` Its parent holds ${k(f.other)}.`}`
          : `Decrease ${f.old} to ${f.value}, then sift it up its tree while it is smaller than its parent.`;
      case 'cut':
        return `${f.value} < ${k(f.other)} breaks heap order: cut ${k(f.node)} out with its subtree and make it a root (unmarked).`;
      case 'mark':
        return `${k(f.node)} just lost its first child: mark it and stop. One more lost child and it will be cut too.`;
      case 'cascade':
        return `${k(f.node)} was already marked, so it has now lost two children: cut it too (cascading cut) and move up to ${k(f.other)}.`;
      case 'sift':
        return `${f.value} is smaller than its parent: swap the two items, so ${f.value} moves up a level.`;
      case 'settled':
        return lazy
          ? `Done in O(1) amortized time. The minimum is ${f.minId === null ? '—' : k(f.minId)}.`
          : `${f.value} is in place${f.other < 0 ? ' at the root' : ''}: O(log n) swaps at most. The minimum is ${f.minId === null ? '—' : k(f.minId)}.`;
      case 'done':
        return `All operations done: ${count(f.links, 'link', 'links')}, ${count(f.cuts, 'cut', 'cuts')}${lazy ? '' : ` and ${count(f.siftSwaps, 'sift-up swap', 'sift-up swaps')}`}.`;
    }
  },
  takeaways: [
    'Both heaps are forests of heap-ordered trees, and the minimum is one of the roots. Merging two heaps just joins their root lists, which is why they are called mergeable heaps.',
    'A binomial heap keeps one tree per degree, and a tree of degree k holds exactly 2ᵏ keys. The degrees follow the binary digits of n, so an insert links like a binary carry.',
    'A Fibonacci heap is lazy: insert just adds a root. Extract-min pays for the clutter by consolidating, linking equal-degree roots through the degree table A, in O(log n) amortized time.',
    'Decrease-key cuts the node to the root list and marks its parent; a parent that loses a second child is cut too (a cascading cut). With the potential Φ = t + 2m this costs O(1) amortized, the reason Dijkstra and Prim run faster on a Fibonacci heap.',
    'Try it: load Cascading cut, step to the end in both modes, and compare the links, cuts and sift-up swaps.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'Insert',
      'Fibonacci O(1); binomial O(log n) worst, O(1) amortized',
      'Fibonacci only adds a root; binomial carries through at most log₂ n links.',
    ],
    [
      'Find min',
      'O(1)',
      'A min pointer names the smallest root (a binomial heap may scan its ≤ log₂ n + 1 roots).',
    ],
    ['Merge two heaps', 'O(1) Fibonacci; O(log n) binomial', 'Join the root lists (and carry).'],
    [
      'Extract min',
      'O(log n) amortized',
      'The extra roots are paid for by the potential; at most D(n) = O(log n) roots remain.',
    ],
    [
      'Decrease key',
      'Fibonacci O(1) amortized; binomial O(log n)',
      'A cut plus cascading cuts that each release 2 units of potential, against a sift-up the height of the tree.',
    ],
    [
      'Memory',
      'O(n)',
      'One node per key with parent, child and sibling links, a degree and a mark.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'A binomial heap holds 13 keys. How many trees are in its root list? (13 = 1101 in binary.)',
      answer: 3,
      unit: 'trees',
      hints: ['There is one tree of degree k for each binary digit 1 of n, and it holds 2ᵏ keys.'],
      solution: '13 = 8 + 4 + 1, so the root list has trees of degrees 3, 2 and 0: 3 trees.',
    },
    {
      type: 'number',
      prompt:
        'Load Insert 9, extract 1 with Fibonacci. How many links does the consolidation make?',
      answer: 7,
      unit: 'links',
      hints: ['Eight roots are left after the minimum goes. Each link joins two trees into one.'],
      solution:
        'The eight one-node roots end as one tree of degree 3. Every link cuts the number of trees by one, so 8 − 1 = 7 links.',
    },
    {
      type: 'choice',
      prompt:
        'In a Fibonacci heap, decrease-key cuts a node x from its parent y, and y was already marked. What happens next?',
      options: [
        'y is unmarked and stays where it is',
        'y is cut to the root list too, and the check moves up to y’s parent',
        'the whole tree is consolidated',
        'x is put back under y',
      ],
      answer: 1,
      hints: ['A mark means the node has already lost one child since it was linked.'],
      solution:
        'A marked y has now lost two children, so it is cut as well (a cascading cut), and the same check runs on its parent. This keeps every tree of degree k at least Fₖ₊₂ nodes large.',
    },
    {
      type: 'number',
      prompt: 'A Fibonacci heap has 6 roots and 2 marked nodes. What is its potential Φ = t + 2m?',
      answer: 10,
      hints: ['t counts the roots and m the marked nodes.'],
      solution: 'Φ = 6 + 2 · 2 = 10.',
    },
  ],
  nextTeaser: 'Bài tiếp theo: Cây van Emde Boas.',
};
