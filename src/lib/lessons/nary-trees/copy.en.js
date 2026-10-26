/** @typedef {import('$lib/algo-engine/nary-trees.js').NaryFrame} NaryFrame */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** @param {number} h */
const hText = (h) => (h < 0 ? '−1' : String(h));

export const en = {
  slug: 'nary-trees',
  topic: 'trees',
  level: 'Intermediate',
  title: 'N-ary trees and tree recursion',
  intro:
    'An n-ary tree lets a node have any number of children, so each node keeps a list of them: files in folders, staff in an organisation, a parse of a sentence. Most questions about such a tree are answered by one recursion that asks every child first and then combines the answers on the way back up.',
  summary:
    'Build a general tree and watch subtree sizes, heights and the tree diameter bubble up from the leaves in one postorder walk.',
  instruction:
    'Select a node to add a child under it or remove its subtree, or load a preset. Step through the walk: each node shows s (subtree size, growing as children report back) and h (height). At the end the diameter path lights up.',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    org: 'Organisation chart',
    skewed: 'Diameter away from the root',
    star: 'Star',
    path: 'Path',
    random: 'Random',
  },
  addChild: 'Add child',
  remove: 'Remove subtree',
  undo: 'Undo',
  /** @param {string} label */
  selectedText: (label) => `Selected: ${label}`,
  errors: {
    /** @param {number} max */
    full: (max) => `The tree is full (${max} nodes). Remove a subtree first.`,
    /** @param {number} max */
    depth: (max) => `Nodes may sit at most at depth ${max} here.`,
    /** @param {string} label @param {number} max */
    wide: (label, max) => `${label} already has ${max} children, the most this drawing allows.`,
    root: 'The root stays: remove one of its subtrees instead, or load a preset.',
  },
  treeTitle: 'Tree',
  /** @param {number} n @param {number} diameter */
  treeAria: (n, diameter) =>
    `Tree with ${plural(n, 'node')}${diameter >= 0 ? `, diameter so far ${plural(diameter, 'edge')}` : ''}.`,
  /** @param {string} label @param {number | null} size @param {number | null} height @param {string} state */
  nodeLabel: (label, size, height, state) =>
    [
      `Node ${label}`,
      size === null ? '' : `subtree size ${size}`,
      height === null ? '' : `height ${height}`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  /** @param {number | null} s @param {number | null} h */
  note: (s, h) => [s === null ? '' : `s${s}`, h === null ? '' : `h${h}`].filter(Boolean).join(' '),
  states: {
    active: 'running now',
    frontier: 'waiting for its children',
    compare: 'reporting to its parent',
    visited: 'finished',
    path: 'on the diameter path',
  },
  markers: { active: '▶', frontier: '…', compare: '↑', visited: '✓', path: '◆' },
  legend: {
    active: 'Running now',
    frontier: 'Waiting on the call stack',
    compare: 'Child reporting back',
    visited: 'Finished: size and height final',
    path: 'Diameter path',
    selected: 'Selected (thick teal ring)',
  },
  listsTitle: 'Children lists',
  /** @param {string} label @param {string[]} kids */
  listRow: (label, kids) => `${label}: ${kids.length ? kids.join(', ') : '(leaf)'}`,
  stats: {
    size: 'Root subtree size',
    height: 'Height',
    diameter: 'Diameter (edges)',
    calls: 'dfs calls',
  },
  notYet: '?',
  stackTitle: 'Call stack (outermost first)',
  stackEmpty: 'empty',
  /** @param {NaryFrame} f @param {string[]} labels @param {number[][]} kids */
  describe(f, labels, kids) {
    const v = f.current >= 0 ? labels[f.current] : '';
    const c = f.child >= 0 ? labels[f.child] : '';
    switch (f.kind) {
      case 'start':
        return `Call dfs on the root ${labels[0]}. Each call returns its subtree’s size and height.`;
      case 'enter':
        return kids[f.current].length === 0
          ? `${v} has an empty children list: a leaf. Its size starts and stays at 1.`
          : `Enter ${v}: size starts at 1 (the node itself). ${v} has ${plural(kids[f.current].length, 'child', 'children')} to ask.`;
      case 'descend':
        return `${v} asks its child ${c}: call dfs(${c}) and wait.`;
      case 'add':
        return `${c} reports size ${f.size[f.child]} and height ${f.height[f.child]}. ${v}’s size grows to ${f.size[f.current]}; its two tallest children are now a = ${hText(f.top[0])}, b = ${hText(f.top[1])}.`;
      case 'up': {
        const [a, b] = f.top;
        return `${v} is done: height ${hText(a)} + 1 = ${f.height[f.current]}, and the longest path bending at ${v} has ${hText(a)} + ${hText(b)} + 2 = ${f.bend[f.current]} edges. Best so far: ${f.diameter}.`;
      }
      case 'done':
        return `Done: ${plural(Number(f.size[0]), 'node')}, height ${f.height[0]}, diameter ${plural(f.diameter, 'edge')}: ${f.path.map((u) => labels[u]).join(' – ')}, bending at ${labels[f.best]}.`;
    }
  },
  takeaways: [
    'Store a general tree as children lists (each node keeps a list of its children) or as a parent array (each node keeps its parent). Children lists suit walking down; a parent array is compact and suits walking up.',
    'Tree recursion asks each child, then combines: size(v) = 1 + the sum of the children’s sizes, height(v) = 1 + the tallest child’s height. Both are postorder: a node finishes after all its children.',
    'The diameter is the longest path between any two nodes. Every path has one highest node where it bends, so the best path bending at v uses v’s two tallest children: a + b + 2 edges. The diameter is the largest such bend.',
    'Each node is entered once and each edge is used twice (down and back up), so the walk is O(n) whatever the shape.',
    'Load “Diameter away from the root”: the longest path bends at B, not at the root, so the answer must be kept as a running best rather than read off the root.',
  ],
  complexityHead: ['Computation', 'Cost', 'Why'],
  complexity: [
    ['All subtree sizes and heights', 'O(n)', 'One call per node; each child reports back once.'],
    ['Diameter', 'O(n)', 'Same walk: keep the two tallest children at each node.'],
    [
      'Recursion stack',
      'O(h)',
      'One open call per level of the current path; a path-shaped tree makes h = n − 1.',
    ],
    ['Children lists memory', 'O(n)', 'Every node except the root appears in exactly one list.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Load the Organisation chart. What is the subtree size of F?',
      answer: 5,
      unit: 'nodes',
      hints: ['Step until F is finished and read its s label.', 'Count F and everything below it.'],
      solution:
        'F’s children are G, I and J, and G has one child H. size(G) = 2, so size(F) = 1 + 2 + 1 + 1 = 5.',
    },
    {
      type: 'number',
      prompt: 'What is the diameter of the Organisation chart, in edges?',
      answer: 5,
      unit: 'edges',
      hints: [
        'At the root, the two tallest children are F (height 2) and B (height 1).',
        'Bend = a + b + 2.',
      ],
      solution:
        'The best bend is at A: 2 + 1 + 2 = 5 edges, the path H – G – F – A – B – C. No other node bends a longer path.',
    },
    {
      type: 'choice',
      prompt: 'A star has one centre and k ≥ 2 leaves attached to it. What is its diameter?',
      options: ['1 edge', '2 edges', 'k edges', 'k − 1 edges'],
      answer: 1,
      hints: ['Load the Star preset. Any two leaves are joined through the centre.'],
      solution:
        'At the centre a = b = 0, so the bend is 0 + 0 + 2 = 2 edges: leaf – centre – leaf, however many leaves there are.',
    },
  ],
  nextTeaser:
    'Next up: practice tree problems, checking whether a tree is a binary search tree and finding lowest common ancestors.',
};
