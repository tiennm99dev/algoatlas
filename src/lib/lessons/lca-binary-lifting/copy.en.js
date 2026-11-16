/** @typedef {import('$lib/algo-engine/lca-binary-lifting.js').LiftFrame} LiftFrame */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** 2^k written with a superscript. @param {number} k */
const pow = (k) => `2${'⁰¹²³⁴⁵⁶⁷⁸⁹'[k]}`;

export const en = {
  slug: 'lca-binary-lifting',
  topic: 'tree-techniques',
  level: 'Intermediate',
  title: 'Lowest common ancestor and binary lifting',
  intro:
    'The lowest common ancestor (LCA) of two nodes is the deepest node that has both of them below it: the place where their paths to the root meet. Walking up one parent at a time costs O(depth) per query. Binary lifting stores, for every node, its ancestors 1, 2, 4, 8, … levels up, so any climb splits into O(log n) jumps.',
  summary:
    'Build the binary-lifting jump table on your own tree, then watch two nodes jump by powers of two to their lowest common ancestor.',
  instruction:
    'Pick u and v, or select a node and add or remove children. Step through the build to see each cell come from two half-size jumps, then through the query: first u climbs to v’s depth, then both climb while their ancestors still differ.',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    family: 'Family tree',
    path: 'Path of 16',
    broom: 'Broom',
    random: 'Random',
  },
  uLabel: 'u',
  vLabel: 'v',
  addChild: 'Add child',
  remove: 'Remove subtree',
  undo: 'Undo',
  /** @param {string} label */
  selectedText: (label) => `Selected: ${label}`,
  errors: {
    /** @param {number} max */
    full: (max) => `The tree is full (${max} nodes). Remove a subtree first.`,
    root: 'The root stays: remove one of its subtrees instead, or load a preset.',
  },
  treeTitle: 'Tree',
  /** @param {number} n */
  treeAria: (n) => `Rooted tree with ${plural(n, 'node')}.`,
  /** @param {string} label @param {number | null} depth @param {string} state */
  nodeLabel: (label, depth, state) =>
    [`Node ${label}`, depth === null ? '' : `depth ${depth}`, state].filter(Boolean).join(', '),
  /** @param {number | null} depth */
  note: (depth) => (depth === null ? '' : `d${depth}`),
  states: {
    filling: 'its cell is being filled',
    halfway: 'halfway ancestor',
    landing: 'where the jump lands',
    u: 'u is here',
    v: 'v is here',
    both: 'u and v are both here',
    candidate: 'common ancestor, too high to jump to',
    climbed: 'already climbed past',
    lca: 'the lowest common ancestor',
    path: 'on the u–v path',
  },
  markers: { active: '▶', frontier: '◇', compare: '→', visited: '·', sorted: '★', path: '★' },
  legend: {
    active: '▶ Filling this node’s cell, or u and v (marked u, v)',
    frontier: '◇ Halfway ancestor, or a common ancestor too high to jump to',
    compare: '→ Where the jump lands',
    visited: 'Climbed past',
    sorted: '★ The LCA',
    path: 'The u–v path through the LCA',
    selected: 'Selected (thick teal ring)',
  },
  tableTitle: 'Jump table: up[k][v] is the ancestor 2ᵏ levels above v',
  /** @param {number} k */
  rowHeader: (k) => pow(k),
  tableAria: 'Jump table, one row per power of two, one column per node.',
  /** @param {number} k @param {string} node @param {string | null} target */
  cellLabel: (k, node, target) =>
    `${pow(k)} = ${2 ** k} levels above ${node}: ${target ?? 'not filled yet'}`,
  eulerTitle: 'Same answer by Euler tour + range minimum',
  eulerAria: 'Euler tour of the tree, the range between the first visits of u and v bracketed.',
  /** @param {string} label @param {number} depth */
  eulerCell: (label, depth) => `${label}, depth ${depth}`,
  eulerWindow: 'first u … first v',
  /** @param {string} u @param {string} v @param {string} lca @param {number} depth @param {number} len */
  eulerNote: (u, v, lca, depth, len) =>
    `The walk lists a node on entry and after each child returns (${len} entries). Between the first visits of ${u} and ${v}, the shallowest entry is ${lca} (depth ${depth}): their LCA. A sparse table answers that range minimum in O(1).`,
  stats: {
    lca: 'LCA',
    d: 'Depth difference d',
    cells: 'Table cells filled',
    reads: 'Query table reads',
  },
  notYet: '?',
  /**
   * @param {LiftFrame} f @param {string[]} labels
   */
  describe(f, labels) {
    const L = (/** @type {number} */ x) => labels[x];
    const n = f.depth.length;
    switch (f.kind) {
      case 'start':
        return `Build the jump table first: ${n} nodes × 4 rows (1, 2, 4 and 8 levels up) are enough for any depth below 16.`;
      case 'base':
        return `Row ${pow(0)} is each node’s parent, read straight off the tree, with each node’s depth. The root ${L(0)} is its own parent, so a jump past the root stays at the root.`;
      case 'fill': {
        const to = /** @type {number} */ (f.up[f.k][f.node]);
        return `up[${f.k}][${L(f.node)}]: ${plural(2 ** (f.k - 1), 'level')} up from ${L(f.node)} is ${L(f.mid)}, and ${2 ** (f.k - 1)} more from there is ${L(to)}. Two half jumps make one jump of ${2 ** f.k}.`;
      }
      case 'query':
        return `Table done (${f.cells} cells). Now ask lca(${L(f.u)}, ${L(f.v)}).`;
      case 'level':
        return f.swapped
          ? `${L(f.u)} is deeper, so swap: u = ${L(f.u)} (depth ${f.depth[f.u]}), v = ${L(f.v)} (depth ${f.depth[f.v]}). u must climb d = ${f.d} levels.`
          : `u = ${L(f.u)} (depth ${f.depth[f.u]}) is at least as deep as v = ${L(f.v)} (depth ${f.depth[f.v]}). u must climb d = ${f.d} levels.`;
      case 'lift':
        return `Bit ${f.k} of d = ${f.d} is 1: u jumps ${plural(2 ** f.k, 'level')}, ${L(f.from)} → ${L(f.u)}.`;
      case 'skip':
        return `Bit ${f.k} of d = ${f.d} is 0: no jump of ${2 ** f.k}.`;
      case 'same':
        return `u and v meet at the same depth on the same node, ${L(f.u)}: v was an ancestor of u, so the LCA is ${L(f.u)}.`;
      case 'apart':
        return `Same depth now, but ${L(f.u)} ≠ ${L(f.v)}. Climb both together, largest jumps first, but only while the landing nodes differ.`;
      case 'jump':
        return `up[${f.k}] gives ${L(f.u)} and ${L(f.v)}: different, so the LCA is higher. Both jump ${2 ** f.k}: ${L(f.from)} → ${L(f.u)}, ${L(f.fromV)} → ${L(f.v)}.`;
      case 'hold': {
        const at = /** @type {number} */ (f.up[f.k][f.u]);
        return `up[${f.k}] gives ${L(at)} for both: a common ancestor, maybe too high. Do not jump ${2 ** f.k}.`;
      }
      case 'answer':
        return `${L(f.u)} and ${L(f.v)} are now children of the same node, one step below the meeting point. The LCA is their parent, ${L(f.answer)}.`;
      case 'done':
        return `lca = ${L(f.answer)}, after ${plural(f.reads, 'table read')} and ${plural(f.moves, 'pointer move')}.`;
    }
  },
  takeaways: [
    'The jump table up[k][v] holds the ancestor 2ᵏ levels above v. Row 0 is the parent; every later row is two jumps of the row before: up[k][v] = up[k−1][up[k−1][v]]. Building it costs O(n log n).',
    'Any climb of d levels splits into the powers of two in d’s binary form, so lifting u to v’s depth takes at most log₂ n jumps.',
    'After that, jump both nodes by 2ᵏ for k from high to low, only when the landing nodes differ. They stop just below the LCA, which is one parent up: O(log n) per query.',
    'An Euler tour turns LCA into a range minimum: between the first visits of u and v, the shallowest node is the LCA. With a sparse table that is O(n log n) to build and O(1) per query.',
    'Load “Path of 16” and query P with A: d = 15 = 8 + 4 + 2 + 1, so u reaches A in 4 jumps where walking would take 15 steps.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'Build the jump table',
      'O(n log n)',
      'log n rows of n cells, each cell two reads of the row above.',
    ],
    [
      'One LCA query',
      'O(log n)',
      'At most log n jumps to level the depths, then log n paired checks.',
    ],
    [
      'Naive LCA (walk parents)',
      'O(depth)',
      'One step per level: n − 1 steps on a path-shaped tree.',
    ],
    [
      'Euler tour + sparse table',
      'O(n log n) build, O(1) query',
      'A tour of 2n − 1 entries; a range minimum over two overlapping blocks.',
    ],
    ['Memory', 'O(n log n)', 'The jump table; the Euler tour itself is O(n).'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Load the Family tree. How many cells does the jump table fill before the first query?',
      answer: 56,
      unit: 'cells',
      hints: [
        'The table has one column per node and one row per power of two.',
        '14 nodes × 4 rows.',
      ],
      solution:
        'The Family tree has 14 nodes and the table has 4 rows (1, 2, 4, 8 levels), so 14 × 4 = 56 cells.',
    },
    {
      type: 'choice',
      prompt: 'In the Family tree, what is lca(N, I)?',
      options: ['A', 'B', 'D', 'E'],
      answer: 1,
      hints: [
        'N’s ancestors are L, H, D, B, A. I’s ancestors are E, B, A.',
        'Find the deepest node on both lists.',
      ],
      solution:
        'N climbs 2 levels to H (depth 3, like I). up[0] then gives D and E, which differ, so both jump to D and E; their parent B is the LCA.',
    },
    {
      type: 'number',
      prompt:
        'On the Path of 16, query lca(P, A). How many jumps does u make while levelling the depths?',
      answer: 4,
      unit: 'jumps',
      hints: ['P is at depth 15 and A at depth 0, so d = 15.', 'Write 15 in binary.'],
      solution: 'd = 15 = 1111 in binary = 8 + 4 + 2 + 1, so u jumps four times and lands on A.',
    },
    {
      type: 'text',
      prompt: 'Fill in the rule that builds row k of the table: up[k][v] = …',
      accept: ['up[k-1][up[k-1][v]]', 'up[k−1][up[k−1][v]]'],
      hints: [
        'A jump of 2ᵏ is two jumps of 2ᵏ⁻¹.',
        'Jump 2ᵏ⁻¹ from v, then 2ᵏ⁻¹ again from there.',
      ],
      solution:
        'up[k][v] = up[k−1][up[k−1][v]]: first jump 2ᵏ⁻¹ levels from v, then 2ᵏ⁻¹ more from where that lands.',
    },
  ],
  nextTeaser:
    'Next up: heavy-light decomposition, which cuts a tree into chains so a whole path query becomes a few segment-tree ranges.',
};
