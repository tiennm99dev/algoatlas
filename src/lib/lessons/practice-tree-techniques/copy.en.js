/** @typedef {import('$lib/algo-engine/practice-tree-techniques.js').TreeOpFrame} TreeOpFrame */
/** @typedef {import('$lib/algo-engine/practice-tree-techniques.js').TreeOp} TreeOp */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'practice-tree-techniques',
  topic: 'tree-techniques',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán cây nâng cao',
  intro:
    'Two classic tree problems: the sum of the values on a path, and the distance between two nodes, while values keep changing. Run your own list of queries with heavy-light decomposition and with the plain walk along the path, and compare the work each one does.',
  summary:
    'Type path-sum, distance and update queries on a tree and compare heavy-light decomposition with the naive path walk, query by query.',
  instruction:
    'Edit the operations (sum u v, dist u v, set v x, separated by commas) or load a preset, then step through them. Each step runs one operation both ways: the path lights up, the chain ranges are bracketed in the base array, and both costs are added to the totals.',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    sample: 'Sample tree',
    caterpillar: 'Caterpillar of 26',
    random: 'Random tree and queries',
  },
  opsLabel: 'Operations',
  opsHelp: 'sum u v · dist u v · set v x (x from 0 to 9), separated by commas',
  opErrors: {
    empty: 'Type at least one operation, such as “sum A B”.',
    format: 'Each operation is “sum u v”, “dist u v” or “set v x”.',
    node: 'Use the node names shown in the tree.',
    value: 'A new value is a whole number from 0 to 9.',
    many: 'At most 12 operations at a time.',
  },
  treeTitle: 'Tree',
  /** @param {number} n */
  treeAria: (n) => `Tree with ${plural(n, 'node')}; H marks a heavy edge.`,
  heavyMark: 'H',
  /** @param {number} value */
  note: (value) => String(value),
  noteKey: 'Under each node: its value. H on an edge: heavy edge.',
  /** @param {string} label @param {number} value @param {string} state */
  nodeLabel: (label, value, state) =>
    [`Node ${label}`, `value ${value}`, state].filter(Boolean).join(', '),
  states: {
    path: 'on the query path',
    lca: 'the lowest common ancestor',
    set: 'value just set',
    u: 'u',
    v: 'v',
  },
  markers: { sorted: '★', swap: '✎' },
  legend: {
    path: 'On the path of the query (u, v mark the ends)',
    sorted: '★ Lowest common ancestor',
    swap: '✎ Value just set',
  },
  arrayTitle: 'Base array in HLD order: each chain is one block',
  arrayAria: 'Node values in heavy-light order, the chain ranges of the query bracketed.',
  /** @param {string} label @param {number} value */
  cellLabel: (label, value) => `${label}, value ${value}`,
  /** @param {number} i */
  windowLabel: (i) => `range ${i + 1}`,
  opsTitle: 'Operations (result · naive · HLD)',
  opsEmpty: 'none',
  /** @param {string} op @param {number | null} answer @param {number} naive @param {number} hld */
  opChip: (op, answer, naive, hld) =>
    answer === null ? op : `${op} → ${answer} · ${naive} · ${hld}`,
  stats: {
    answer: 'Result',
    step: 'Operation',
    naive: 'Naive work',
    hld: 'HLD work',
  },
  none: '–',
  /**
   * @param {TreeOpFrame} f @param {TreeOp[]} ops @param {string[]} labels @param {number[]} depth
   * @param {number} chains
   */
  describe(f, ops, labels, depth, chains) {
    const L = (/** @type {number} */ x) => labels[x];
    const op = f.op >= 0 ? ops[f.op] : null;
    switch (f.kind) {
      case 'start':
        return `${plural(ops.length, 'operation')} on a tree of ${plural(labels.length, 'node')}, cut into ${plural(chains, 'heavy chain')}. Each step runs one operation both ways.`;
      case 'sum':
        if (!op || op.type === 'set') return '';
        return `sum ${L(op.u)} ${L(op.v)} = ${f.answer}. Naive: walk the ${f.naive} nodes of the path. HLD: ${plural(f.ranges.length, 'chain range')}, ${plural(f.hld, 'segment-tree node')} visited.`;
      case 'dist':
        if (!op || op.type === 'set') return '';
        return `dist ${L(op.u)} ${L(op.v)} = ${f.answer} edges: lca ${L(f.lca)}, so ${depth[op.u]} + ${depth[op.v]} − 2·${depth[f.lca]}. Naive: walk ${f.naive} nodes. HLD: climb ${plural(f.ranges.length, 'chain')} to ${L(f.lca)}, then read 3 depths: ${f.hld} steps.`;
      case 'set':
        if (!op || op.type !== 'set') return '';
        return `set ${L(op.u)} ${op.x}: the naive way writes 1 value; HLD also updates the segment-tree leaf and its ancestors: ${plural(f.hld, 'node')}.`;
      case 'done': {
        const winner =
          f.naiveTotal === f.hldTotal
            ? 'a tie'
            : f.naiveTotal < f.hldTotal
              ? 'the naive walk did less here'
              : 'HLD did less here';
        return `All done: naive ${f.naiveTotal}, HLD ${f.hldTotal}, ${winner}. On a tree this small the walk is short; HLD’s O(log² n) wins as paths grow long.`;
      }
    }
  },
  takeaways: [
    'A path sum with heavy-light decomposition is one segment-tree range per chain the path meets: O(log n) ranges of O(log n) each. The naive walk reads every node of the path, up to n.',
    'A distance only needs the lowest common ancestor: dist(u, v) = depth[u] + depth[v] − 2·depth[lca]. Climbing chain by chain finds the LCA in O(log n) steps; binary lifting would too.',
    'Updates are where a plain array of values shines (one write) and where HLD pays O(log n). Prefix sums along root paths, the other easy fix, would pay O(n) per update.',
    'On tiny trees the constant factors decide, and the walk often wins. On a path of 100 000 nodes the walk costs 100 000 per query, while O(log² n) is a few hundred.',
    'Load the Caterpillar and compare sum N Z with sum Y Z: the naive cost follows the path length (15 against 4), while HLD’s cost follows the ranges and the segment tree, not the length (20 against 30).',
  ],
  complexityHead: ['Operation', 'Naive walk', 'Heavy-light decomposition'],
  complexity: [
    [
      'Path sum or maximum',
      'O(path length), up to O(n)',
      'O(log² n): O(log n) chains, each a segment-tree range',
    ],
    ['Distance', 'O(path length)', 'O(log n): climb chains to the LCA, then three depths'],
    ['Set one value', 'O(1)', 'O(log n): a segment-tree leaf and its ancestors'],
    ['Preparation', 'none', 'O(n): two walks and a segment-tree build'],
  ],
  practiceTitle: 'Problems',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Load the Sample tree and run its operations. What does the second “sum M L” return, after “set D 0”?',
      answer: 33,
      hints: ['The first sum M L gives 34.', 'D lies on the path and its value drops from 1 to 0.'],
      solution:
        'The path M, H, D, B, A, C, G, L summed to 34. Setting D from 1 to 0 lowers it by 1: 33.',
    },
    {
      type: 'number',
      prompt: 'On the Sample tree, what is dist K O?',
      answer: 8,
      unit: 'edges',
      hints: [
        'Step to the last operation and read the narration.',
        'Their lowest common ancestor is the root A.',
      ],
      solution:
        'K is at depth 3 and O at depth 5, and their LCA is A at depth 0: 3 + 5 − 2·0 = 8 edges.',
    },
    {
      type: 'number',
      prompt: 'Load the Caterpillar of 26. Into how many chain ranges does “sum N Z” split?',
      answer: 2,
      unit: 'ranges',
      hints: [
        'The spine A–M, then Z hanging from M, is one heavy chain.',
        'N hangs from A on a light edge.',
      ],
      solution:
        'N is a chain on its own, and the rest of the path, A through M down to Z, lies on the spine’s chain: 2 ranges.',
    },
    {
      type: 'number',
      prompt: 'On the Caterpillar, what is the naive walk’s total work for its whole workload?',
      answer: 50,
      hints: [
        'Step to the end and read the naive total.',
        'Add the path lengths: 15 + 15 + 4 + 1 + 15.',
      ],
      solution:
        'sum N Z walks 15 nodes, dist N Z 15, sum Y Z 4, set G 9 writes 1 and the last sum N Z walks 15 again: 50.',
    },
    {
      type: 'multi',
      prompt: 'On the Caterpillar, which operations cost the naive way less work than HLD?',
      options: ['sum N Z', 'dist N Z', 'sum Y Z', 'set G 9'],
      answers: [0, 2, 3],
      hints: [
        'Compare the two costs on each chip in the Operations list.',
        'Distances need only the chain climb, not a segment-tree query.',
      ],
      solution:
        'sum N Z costs 15 against 20, sum Y Z 4 against 30, and set G 9 1 against 5. Only dist N Z is cheaper with HLD: 5 steps against 15.',
    },
    {
      type: 'text',
      prompt: 'Write dist(u, v) using depth and the lowest common ancestor lca.',
      accept: [
        'depth[u] + depth[v] − 2·depth[lca]',
        'depth[u] + depth[v] - 2*depth[lca]',
        'depth[u] + depth[v] - 2 depth[lca]',
        'depth(u) + depth(v) - 2*depth(lca)',
        'depth(u) + depth(v) − 2·depth(lca)',
      ],
      hints: ['Both nodes climb to the LCA.', 'u climbs depth[u] − depth[lca] edges.'],
      solution:
        'u climbs depth[u] − depth[lca] edges and v climbs depth[v] − depth[lca], so dist(u, v) = depth[u] + depth[v] − 2·depth[lca].',
    },
  ],
  nextTeaser: 'Bài tiếp theo: Luỹ thừa ma trận.',
};
