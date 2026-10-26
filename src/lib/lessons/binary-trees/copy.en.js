/** @typedef {import('$lib/algo-engine/binary-trees.js').BinaryTreeFrame} BinaryTreeFrame */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'binary-trees',
  topic: 'trees',
  level: 'Beginner',
  title: 'Binary trees and terminology',
  intro:
    'A binary tree is a root node whose left and right children are smaller binary trees, either of which may be empty. Depth counts the edges down from the root, height the edges down to the deepest leaf, and a complete tree packs into an array with no gaps.',
  summary:
    'Build a binary tree node by node and watch every node’s depth and height, the full and complete checks, and its array slots.',
  instruction:
    'Select a node, then add a left or right child or remove its subtree. Each node shows d (depth) and h (height). Step through the measure walk to see depth go down and height come back up, and watch the array row below the tree.',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    complete: 'Complete',
    perfect: 'Perfect',
    full: 'Full, not complete',
    chain: 'Right chain',
    random: 'Random',
  },
  addLeft: 'Add left child',
  addRight: 'Add right child',
  addRoot: 'Add root',
  remove: 'Remove subtree',
  undo: 'Undo',
  /** @param {string | null} label */
  selectedText: (label) => (label ? `Selected: ${label}` : 'Select a node in the tree.'),
  errors: {
    select: 'Select a node first.',
    /** @param {number} max */
    depth: (max) => `Nodes may sit at most at depth ${max} here, so this child would be too deep.`,
    /** @param {string} label @param {'left'|'right'} side */
    taken: (label, side) => `${label} already has a ${side} child.`,
  },
  treeTitle: 'Tree',
  /** @param {number} size @param {number} height */
  treeAria: (size, height) =>
    size === 0 ? 'Empty tree.' : `Binary tree with ${plural(size, 'node')}, height ${height}.`,
  /** @param {string} label @param {number | null} depth @param {number | null} height @param {string} state */
  nodeLabel: (label, depth, height, state) =>
    [
      `Node ${label}`,
      depth === null ? 'depth not set yet' : `depth ${depth}`,
      height === null ? 'height not set yet' : `height ${height}`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  /** @param {number | null} d @param {number | null} h */
  note: (d, h) => [d === null ? '' : `d${d}`, h === null ? '' : `h${h}`].filter(Boolean).join(' '),
  arrayTitle: 'Array representation',
  emptySlot: '·',
  /** @param {(string | null)[]} slots */
  arrayAria: (slots) =>
    `Array of ${plural(slots.length, 'slot')}: ${slots.map((s, i) => `${i} ${s ?? 'empty'}`).join(', ')}.`,
  /** @param {number} i @param {string | null} v */
  slotLabel: (i, v) => `Slot ${i}: ${v ?? 'empty'}`,
  /** @param {number} i @param {number} parent @param {number} left @param {number} right @param {number} max */
  slotMath: (i, parent, left, right, max) =>
    `Slot ${i}: parent ⌊(i − 1) / 2⌋ = ${parent < 0 ? 'none (root)' : parent}, children 2i + 1 = ${left < max ? left : '—'} and 2i + 2 = ${right < max ? right : '—'}.`,
  states: {
    active: 'measuring now',
    frontier: 'waiting for its children',
    visited: 'measured',
    swap: 'breaks the property',
  },
  markers: { active: '▶', frontier: '…', visited: '✓', swap: '!' },
  legend: {
    active: 'Measuring now',
    frontier: 'Waiting on the call stack',
    visited: 'Depth and height known',
    swap: 'Breaks full or complete',
    selected: 'Selected (thick teal ring)',
  },
  stats: { size: 'Nodes', leaves: 'Leaves', height: 'Height', array: 'Array length' },
  notYet: '?',
  stackTitle: 'Call stack (outermost first)',
  stackEmpty: 'empty',
  /** @param {string} label @param {number} d */
  stackChip: (label, d) => `measure(${label}, ${d})`,
  propsTitle: 'Properties',
  props: { full: 'Full', complete: 'Complete', perfect: 'Perfect' },
  /** @param {boolean | null} v */
  verdict: (v) => (v === null ? 'not checked yet' : v ? 'yes' : 'no'),
  /** @param {BinaryTreeFrame} f */
  describe(f) {
    const at = f.current >= 0 ? f.slots[f.current] : null;
    switch (f.kind) {
      case 'start':
        return f.size === 0
          ? 'The tree is empty. Add a root to begin.'
          : `Call measure on the root ${f.slots[0]} with depth 0.`;
      case 'enter':
        return f.depth[f.current] === 0
          ? `${at} is the root, so its depth is 0.`
          : `${at} is one edge below its parent, so its depth is ${f.depth[f.current]}.`;
      case 'leaf':
        return `${at} has no children: it is a leaf, with height 0.`;
      case 'descend':
        return `${at} is an internal node. Its height depends on its children, so measure them first.`;
      case 'up': {
        const kids = [2 * f.current + 1, 2 * f.current + 2].filter(
          (c) => c < f.slots.length && f.slots[c] !== null,
        );
        const hs = kids.map((c) => `${f.slots[c]} ${f.height[c]}`).join(', ');
        const h = Number(f.height[f.current]);
        return `Children done (${hs}), so ${at} has height 1 + ${h - 1} = ${h}.`;
      }
      case 'full':
        return f.full
          ? 'Every node has 0 or 2 children, so the tree is full.'
          : `${at} has exactly one child, so the tree is not full.`;
      case 'complete':
        return f.complete
          ? `The ${plural(f.size, 'node')} fill slots 0 to ${Math.max(0, f.size - 1)} with no gap, so the tree is complete.`
          : `Slot ${f.current} is empty but a later slot is filled, so the tree is not complete.`;
      case 'done':
        return f.size === 0
          ? 'Done: the empty tree is full, complete and perfect by convention.'
          : `Done: height ${f.height[0]}, ${plural(f.leaves, 'leaf', 'leaves')}. ${f.perfect ? `Perfect: all 2^(h + 1) − 1 = ${f.size} slots of its levels are filled.` : `A perfect tree of this height would have ${2 ** (Number(f.height[0]) + 1) - 1} nodes.`}`;
    }
  },
  takeaways: [
    'The root has depth 0 and every edge down adds 1. Height counts edges on the longest path down to a leaf, so a leaf has height 0 and the tree’s height is the root’s height. Some books count levels instead, which adds 1.',
    'Depth flows down (parent + 1) and height flows up (1 + the taller child), so one recursive walk computes both: depth before the children, height after them.',
    'Full means every node has 0 or 2 children. Complete means every level is filled except perhaps the last, which fills from the left. Perfect means both: all levels are filled, 2^(h + 1) − 1 nodes.',
    'In the array representation, slot i has children 2i + 1 and 2i + 2 and parent ⌊(i − 1) / 2⌋. A complete tree uses exactly n slots; heaps rely on this.',
    'Try “Right chain”: 4 nodes need 15 array slots, because each step right doubles the slot index.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Measure all depths and heights', 'O(n)', 'One call per node, constant work per call.'],
    ['Recursion stack', 'O(h)', 'One call per level is open at a time.'],
    ['Parent or child in the array', 'O(1)', 'Index arithmetic: 2i + 1, 2i + 2, ⌊(i − 1) / 2⌋.'],
    [
      'Array memory',
      'n to 2ⁿ − 1 slots',
      'Exactly n for a complete tree; a chain doubles the index at every level.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'A perfect binary tree has height 3 (counting edges). How many nodes does it have?',
      answer: 15,
      unit: 'nodes',
      hints: ['Levels 0 to 3 hold 1, 2, 4 and 8 nodes.'],
      solution: 'A perfect tree of height h has 2^(h + 1) − 1 nodes: 1 + 2 + 4 + 8 = 15.',
    },
    {
      type: 'number',
      prompt: 'In the array representation, which slot holds the parent of the node in slot 9?',
      answer: 4,
      hints: ['The parent of slot i is ⌊(i − 1) / 2⌋.'],
      solution: '⌊(9 − 1) / 2⌋ = 4. Check: slot 4 has children 2·4 + 1 = 9 and 2·4 + 2 = 10.',
    },
    {
      type: 'multi',
      prompt:
        'Load the “Full, not complete” preset (A with children B and C, C with children D and E). Which statements are true?',
      options: [
        'B is a leaf',
        'The tree has height 2',
        'D has depth 1',
        'The array needs 7 slots for 5 nodes',
      ],
      answers: [0, 1, 3],
      hints: ['Step to the end and read the d and h labels and the array row.'],
      solution:
        'B has no children, so it is a leaf. D and E sit at depth 2, which makes the height 2. They live in slots 5 and 6, so the array has 7 slots with gaps at 3 and 4.',
    },
  ],
  nextTeaser:
    'Next up: tree traversals, the four standard orders for visiting every node of a binary tree.',
};
