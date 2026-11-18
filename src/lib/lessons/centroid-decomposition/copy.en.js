/** @typedef {import('$lib/algo-engine/centroid-decomposition.js').CentroidFrame} CentroidFrame */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Half of n, written with a decimal point when n is odd. @param {number} n */
const half = (n) => String(n / 2);

export const en = {
  slug: 'centroid-decomposition',
  topic: 'tree-techniques',
  level: 'Nâng cao',
  title: 'Phân rã trọng tâm',
  intro:
    'A centroid is a node whose removal leaves no piece with more than half of the tree. Remove it, then do the same in every piece that is left: the centroids form a new tree of depth O(log n). Every path in the original tree passes through exactly one highest centroid, so questions about all paths, such as how many pairs of nodes are K edges apart, split into small pieces.',
  summary:
    'Find the centroid of your own tree, remove it, recurse into the pieces and watch the centroid tree grow while pairs at distance K are counted.',
  instruction:
    'Step through: each piece is sized, a walk heads into any child holding more than half of it, and the node where the walk stops is the centroid. It counts the pairs through it, is removed, and the parts left are decomposed in turn. Change K, load a preset, or select a node to add a child or remove its subtree.',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    sample: 'Sample tree',
    path: 'Path of 15',
    star: 'Star',
    random: 'Random',
  },
  kLabel: 'Distance K',
  addChild: 'Add child',
  remove: 'Remove subtree',
  undo: 'Undo',
  /** @param {string} label */
  selectedText: (label) => `Selected: ${label}`,
  errors: {
    /** @param {number} max */
    full: (max) => `The tree is full (${max} nodes). Remove a subtree first.`,
    root: 'The root stays: remove one of its subtrees instead, or load a preset.',
    /** @param {number} max */
    k: (max) => `K is a whole number of edges from 1 to ${max}.`,
  },
  treeTitle: 'Tree',
  /** @param {number} n */
  treeAria: (n) => `Tree with ${plural(n, 'node')}; removed centroids are greyed out.`,
  centroidTreeTitle: 'Centroid tree',
  centroidTreeAria:
    'The centroid tree built so far: each centroid sits above the centroids of its parts.',
  /** @param {string} label @param {number} level @param {boolean} current */
  centroidNodeLabel: (label, level, current) =>
    `Centroid ${label}, level ${level}${current ? ', removed just now' : ''}`,
  centroidTreeEmpty: 'No centroid removed yet.',
  /** @param {number | null} size */
  sizeNote: (size) => (size === null ? '' : `s${size}`),
  /** @param {number | null} d */
  distNote: (d) => (d === null ? '' : `d${d}`),
  /** @param {number} level */
  levelNote: (level) => `lvl ${level}`,
  noteKey:
    'Under each node: s = subtree size in the piece, d = distance from the centroid, lvl = level in the centroid tree.',
  /** @param {string} label @param {string} state @param {string} note */
  nodeLabel: (label, state, note) => [`Node ${label}`, note, state].filter(Boolean).join(', '),
  states: {
    walk: 'the walk is here',
    centroid: 'the centroid of this piece',
    piece: 'in the piece worked on',
    pending: 'in a piece waiting its turn',
    removed: 'removed earlier as a centroid',
  },
  spoken: {
    /** @param {number} s */
    size: (s) => `subtree size ${s}`,
    /** @param {number} d */
    dist: (d) => `distance ${d} from the centroid`,
    /** @param {number} l */
    level: (l) => `level ${l} in the centroid tree`,
  },
  markers: { active: '▶', sorted: '★', frontier: '…' },
  legend: {
    active: '▶ The walk towards the heavy side',
    sorted: '★ The centroid',
    frontier: '… Waiting in a later piece',
    pruned: 'Removed earlier (dashed edges are cut)',
    selected: 'Selected (thick teal ring)',
  },
  pendingTitle: 'Pieces waiting (next one last)',
  pendingEmpty: 'none',
  stats: {
    pairs: 'Pairs at distance K',
    removed: 'Centroids removed',
    levels: 'Centroid-tree levels',
    work: 'Nodes sized in all',
  },
  /** @param {CentroidFrame} f @param {string[]} labels */
  describe(f, labels) {
    const L = (/** @type {number} */ x) => labels[x];
    const total = f.piece.length;
    const n = f.removed.length;
    switch (f.kind) {
      case 'start':
        return `Decompose the whole tree, ${plural(n, 'node')}, and count the pairs of nodes exactly K = ${f.k} edges apart on the way.`;
      case 'component':
        return `Next piece: ${plural(total, 'node')}, rooted at ${L(f.piece[0])}. Size every subtree inside it; a centroid leaves no part bigger than ${half(total)}.`;
      case 'walk':
        return `${L(f.c)} holds ${f.size[f.c]} nodes, more than half of ${total}: the centroid must be in there. Move to ${L(f.c)}.`;
      case 'centroid':
        return total === 1
          ? `${L(f.c)} is alone in its piece, so it is its own centroid.`
          : `No child of ${L(f.c)} holds more than half of the piece (${half(total)}), and neither does the rest above it. ${L(f.c)} is the centroid: removing it leaves parts of ${f.parts.join(', ')}.`;
      case 'count':
        return `Distances from ${L(f.c)} are under the nodes. Pairs through ${L(f.c)} at distance ${f.k}, from different parts or with ${L(f.c)} itself: +${f.added}, ${plural(f.pairs, 'pair')} so far.`;
      case 'remove': {
        const p = /** @type {number} */ (f.ctParent[f.c]);
        const where =
          p < 0
            ? 'the root of the centroid tree'
            : `a child of ${L(p)} in the centroid tree, level ${f.level[f.c]}`;
        return `Remove ${L(f.c)}: it becomes ${where}. ${plural(f.pending.length, 'piece')} now ${f.pending.length === 1 ? 'waits' : 'wait'}.`;
      }
      case 'done': {
        const levels = Math.max(0, ...f.level.map((l) => (l === null ? 0 : l + 1)));
        return `Done: the centroid tree has ${plural(levels, 'level')} for ${plural(n, 'node')}, and ${plural(f.work, 'node')} were sized in all pieces together. Pairs exactly ${f.k} edges apart: ${f.pairs}.`;
      }
    }
  },
  takeaways: [
    'A centroid is a node whose removal leaves no part with more than half of the nodes. Every tree has one: start anywhere and keep stepping into a child that holds more than half, until no child does.',
    'Removing the centroid and recursing in every part builds the centroid tree. Each part has at most half the nodes, so the centroid tree has at most log₂ n + 1 levels.',
    'A node is sized once per level it sits in, so the whole decomposition costs O(n log n).',
    'Every path has one highest centroid on it, the first centroid removed that touches it. Counting the paths through each centroid, across different parts, counts every path exactly once.',
    'Load “Path of 15”: the centroid is always the middle node, so the centroid tree is a perfectly balanced binary tree of 4 levels. Then try the Star with K = 2: one centroid does all the counting.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'Find one centroid',
      'O(size of the piece)',
      'One sizing pass, then a walk down at most one path.',
    ],
    [
      'Whole decomposition',
      'O(n log n)',
      'Each node is sized in at most log₂ n + 1 pieces, one per level.',
    ],
    ['Centroid-tree depth', 'O(log n)', 'Each level at least halves the piece size.'],
    [
      'Count pairs at distance K',
      'O(n log n)',
      'At each centroid, one distance per node of its piece and one table lookup.',
    ],
    ['Naive pair count', 'O(n²)', 'A breadth-first search from every node.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt: 'Which node is the first centroid of the Sample tree?',
      options: ['A', 'B', 'D', 'F'],
      answer: 1,
      hints: [
        'B’s subtree holds 8 of the 14 nodes: more than half.',
        'Does any child of B hold more than 7?',
      ],
      solution:
        'From the root A, B holds 8 > 7 nodes, so the walk moves to B. B’s children hold 5 and 2, and the part above B holds 14 − 8 = 6: all at most 7. B is the centroid.',
    },
    {
      type: 'number',
      prompt: 'How many levels does the centroid tree of the Path of 15 have?',
      answer: 4,
      unit: 'levels',
      hints: ['Each centroid is the middle node of its piece.', '15 → 7 → 3 → 1 nodes.'],
      solution:
        'The middle node splits 15 nodes into two paths of 7, then 3, then 1: four levels, H at the top.',
    },
    {
      type: 'number',
      prompt:
        'In the Star (one centre, 8 leaves), how many pairs of nodes are exactly 2 edges apart?',
      answer: 28,
      unit: 'pairs',
      hints: ['Two nodes are 2 apart exactly when both are leaves.', 'Choose 2 of the 8 leaves.'],
      solution:
        'Any two leaves are joined through the centre, so the count is 8 × 7 / 2 = 28, all found at the first centroid.',
    },
  ],
  nextTeaser: 'Bài tiếp theo: Luyện tập: bài toán cây nâng cao.',
};
