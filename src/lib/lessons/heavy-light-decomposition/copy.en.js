/** @typedef {import('$lib/algo-engine/heavy-light-decomposition.js').HldFrame} HldFrame */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'heavy-light-decomposition',
  topic: 'tree-techniques',
  level: 'Nâng cao',
  title: 'Phân rã nặng nhẹ',
  intro:
    'Heavy-light decomposition (HLD) cuts a tree into chains so that any path crosses only O(log n) of them. Number the nodes chain by chain and every chain becomes a block of an array, so a path query (sum, maximum, update) becomes a few range queries on one segment tree.',
  summary:
    'Split your own tree into heavy chains, then watch a path-sum query break into a few contiguous ranges of a segment tree.',
  instruction:
    'Step through the two walks: the first sizes every subtree and picks each node’s heavy child (H on the edge), the second numbers the nodes so each chain is a block. Then pick u and v and watch the query climb chain by chain, one range at a time. Select a node to change its value, add a child or remove it.',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    sample: 'Sample tree',
    binary: 'Complete binary tree',
    path: 'Path',
    random: 'Random',
  },
  uLabel: 'u',
  vLabel: 'v',
  valueLabel: 'Value',
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
    value: (max) => `A value is a whole number from 0 to ${max}.`,
  },
  treeTitle: 'Tree',
  /** @param {number} n */
  treeAria: (n) => `Rooted tree with ${plural(n, 'node')}; H marks a heavy edge.`,
  heavyMark: 'H',
  /** @param {number} value @param {number | null} pos */
  note: (value, pos) => (pos === null ? `${value}` : `${value} #${pos}`),
  noteKey: 'Under each node: its value, then #its position in the base array.',
  /** @param {string} label @param {number} value @param {number | null} pos @param {string} head @param {string} state */
  nodeLabel: (label, value, pos, head, state) =>
    [
      `Node ${label}`,
      `value ${value}`,
      pos === null ? '' : `position ${pos} on chain ${head}`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  states: {
    active: 'worked on now',
    visited: 'done',
    head: 'chain head',
    u: 'u is here',
    v: 'v is here',
    both: 'u and v are both here',
    range: 'in the range summed now',
    summed: 'already summed',
  },
  markers: { head: '◆', active: '▶' },
  legend: {
    active: '▶ Worked on now, or the range summed now (u, v mark the ends)',
    visited: 'Sized or placed',
    path: 'Already summed on the path',
    head: '◆ Chain head',
    heavy: 'H on an edge: heavy edge (to the largest child)',
    selected: 'Selected (thick teal ring)',
  },
  arrayTitle: 'Base array in position order: each chain is one block',
  arrayAria: 'Node values in position order, the summed ranges bracketed.',
  arrayEmpty: 'Empty until the second walk numbers the nodes.',
  /** @param {string} label @param {number} value */
  cellLabel: (label, value) => `${label}, value ${value}`,
  /** @param {string} head */
  windowLabel: (head) => `chain ${head}`,
  chainsTitle: 'Chains (head first)',
  chainsEmpty: 'not numbered yet',
  stats: {
    sum: 'Path sum',
    ranges: 'Chain ranges',
    visits: 'Segment-tree nodes',
    walk: 'Nodes on the path',
  },
  notYet: '?',
  /** @param {HldFrame} f @param {string[]} labels */
  describe(f, labels) {
    const L = (/** @type {number} */ x) => labels[x];
    const at = (/** @type {number} */ p) => f.pos.indexOf(p);
    switch (f.kind) {
      case 'start':
        return 'First walk (dfs1): compute every subtree size from the leaves up, and pick each node’s heavy child.';
      case 'size': {
        const h = /** @type {number} */ (f.heavy[f.current]);
        if (h < 0) return `${L(f.current)} is a leaf: size 1, no heavy child.`;
        const others =
          /** @type {number} */ (f.size[f.current]) - 1 - /** @type {number} */ (f.size[h]) > 0;
        return `${L(f.current)} has size ${f.size[f.current]}. Its largest child is ${L(h)} (size ${f.size[h]}), so ${L(f.current)}–${L(h)} is a heavy edge${others ? '; the edges to its other children are light' : ''}.`;
      }
      case 'place': {
        const x = f.current;
        const p = f.pos[x];
        if (f.via === 'root')
          return `Second walk (dfs2): the root ${L(x)} starts the first chain at position ${p}.`;
        if (f.via === 'heavy')
          return `${L(x)} is a heavy child: it continues chain ${L(/** @type {number} */ (f.head[x]))} at position ${p}, right after its parent.`;
        return `${L(x)} hangs on a light edge: it starts a new chain at position ${p}.`;
      }
      case 'query':
        return `Every chain is now a block of positions. Sum the values on the path ${L(f.u)} – ${L(f.v)} (${plural(f.pathNodes, 'node')}).`;
      case 'range': {
        const r = f.ranges[f.ranges.length - 1];
        const low = at(r.to);
        const span = r.from === r.to ? `${L(low)} alone` : `${L(r.head)} down to ${L(low)}`;
        return `${f.swapped ? 'Swap u and v first. ' : ''}head[u] = ${L(r.head)} is at least as deep as head[v] = ${L(/** @type {number} */ (f.head[f.v]))}, so add positions ${r.from}..${r.to} (${span}): +${r.sum}. Then u jumps over the light edge above ${L(r.head)} to ${L(f.u)}.`;
      }
      case 'last': {
        const r = f.ranges[f.ranges.length - 1];
        return `${L(at(r.from))} and ${L(at(r.to))} share a chain now${f.swapped ? ' (swapped so u is the upper one)' : ''}: add positions ${r.from}..${r.to}: +${r.sum}.`;
      }
      case 'done':
        return `Path sum = ${f.ranges.map((r) => r.sum).join(' + ')} = ${f.sum}, from ${plural(f.ranges.length, 'range')} and ${plural(f.visits, 'segment-tree node')}. Walking the path one node at a time reads ${plural(f.pathNodes, 'node')}.`;
    }
  },
  takeaways: [
    'Each node’s heavy child is the child with the largest subtree; the edge to it is heavy, every other edge is light.',
    'Below a light edge a subtree has at most half the nodes above it, so a root path crosses at most log₂ n light edges and any path meets O(log n) chains.',
    'Numbering the heavy child first gives every chain a block of consecutive positions, so one segment tree over that array serves every chain: a path query costs O(log n) ranges × O(log n) each = O(log² n).',
    'The query climbs from the end whose chain head is deeper, sums that chain’s block, and jumps over the light edge above the head, until both ends sit on one chain.',
    'Load the Path preset: the whole tree is one chain, so any query is a single range. Then load the Complete binary tree and query two leaves: four ranges.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Decompose (two walks)', 'O(n)', 'Each walk visits every node once.'],
    ['Build the segment tree', 'O(n)', 'One leaf per position, one sum per inner node.'],
    ['Path query', 'O(log² n)', 'O(log n) chain ranges, each an O(log n) segment-tree query.'],
    ['Point update', 'O(log n)', 'One segment-tree leaf and its ancestors.'],
    ['Naive path walk', 'O(n)', 'One step per node on the path; a long path is most of the tree.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'In the Sample tree, how many chains are there?',
      answer: 6,
      unit: 'chains',
      hints: [
        'Every chain has one head, marked ◆.',
        'Count the root plus every node reached over a light edge.',
      ],
      solution:
        'The heads are A, C, E, F, I and L: the root plus the five light children. The chains are A–B–D–H–M, C–G–K, E, F–J–N–O, I and L.',
    },
    {
      type: 'number',
      prompt: 'In the Sample tree, what is the sum of the values on the path M – L?',
      answer: 34,
      hints: [
        'Step to the end of the query and add the ranges.',
        'The ranges add up to 8 + 6 + 20.',
      ],
      solution:
        'L alone (+8), then C..G (+6), then A..M on the first chain (+20): 8 + 6 + 20 = 34. The path M, H, D, B, A, C, G, L has values 9 + 6 + 1 + 1 + 3 + 4 + 2 + 8 = 34.',
    },
    {
      type: 'choice',
      prompt: 'Why does a root-to-node path cross at most log₂ n light edges?',
      options: [
        'Light edges are always shorter than heavy edges.',
        'Crossing a light edge downwards at least halves the subtree size.',
        'Every node has at most two children.',
        'The segment tree has log₂ n levels.',
      ],
      answer: 1,
      hints: ['Compare a light child’s subtree with its parent’s subtree.'],
      solution:
        'The heavy sibling is at least as big as a light child c, so 2·size(c) < size(parent). Each light edge on the way down halves the size, and a size cannot halve more than log₂ n times.',
    },
  ],
  nextTeaser: 'Bài tiếp theo: Phân rã trọng tâm.',
};
