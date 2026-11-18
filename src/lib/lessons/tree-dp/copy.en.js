/** @typedef {import('$lib/algo-engine/tree-dp.js').TreeDpFrame} TreeDpFrame */
/** @typedef {import('$lib/algo-engine/tree-dp.js').TreeProblem} TreeProblem */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** @param {number} v */
const node = (v) => String.fromCharCode(65 + v);

export const en = {
  slug: 'tree-dp',
  topic: 'advanced-dp',
  level: 'Nâng cao',
  title: 'QHĐ trên cây',
  intro:
    'A rooted tree splits into subtrees that share nothing, so a node’s answer can be built from its children’s answers. Visit the tree in post-order, children before their parent, and keep a few numbers per node, such as the best total with the node taken and with it left out. Rerooting adds a second, top-down pass that turns one root’s answer into every node’s answer in O(n).',
  summary:
    'Compute include and exclude values in post-order for the maximum-weight independent set, and reroot a tree to get every node’s distance sum in O(n).',
  instruction:
    'Pick a problem and step. Each node shows its values under it; ● is the node being solved, ◇ the nodes waiting on the recursion stack, ○ the child being folded in, and ✓ a finished subtree. Select a node to change its weight, add a child or remove its subtree.',
  problemLabel: 'Problem',
  problems: { mis: 'Independent set', reroot: 'Distance sums (rerooting)' },
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    company: 'Company party, 8 people',
    path: 'Path of 6',
    star: 'Star of 6',
  },
  randomTree: 'Random tree',
  addChild: 'Add child',
  removeSubtree: 'Remove subtree',
  weightLabel: 'Weight',
  /** @param {number} max */
  fullError: (max) => `The tree already has ${max} nodes, the most it shows.`,
  rootError: 'The root stays: remove one of its subtrees instead.',
  selectFirst: 'Select a node first: click it, or move to it with the arrow keys and press Enter.',
  /** @param {number} max */
  weightError: (max) => `A weight must be a whole number from 0 to ${max}.`,
  /** @param {TreeProblem} p @param {number} n */
  treeAria: (p, n) =>
    p === 'mis'
      ? `Tree of ${plural(n, 'node', 'nodes')}, each with a weight and its include and exclude values.`
      : `Tree of ${plural(n, 'node', 'nodes')}, each with its subtree size and distance sums.`,
  /** @param {string} name @param {number} w @param {TreeProblem} p @param {string} values @param {string} state */
  nodeLabel: (name, w, p, values, state) =>
    `Node ${name}${p === 'mis' ? `, weight ${w}` : ''}${values ? `, ${values}` : ''}${state ? `, ${state}` : ''}`,
  /** @param {string} name @param {number} w */
  nodeText: (name, w) => `${name}:${w}`,
  /** @param {number|null} inc @param {number|null} exc */
  misNote: (inc, exc) => (inc === null ? '' : `${inc} | ${exc}`),
  /** @param {number|null} inc @param {number|null} exc */
  misSpoken: (inc, exc) => (inc === null ? '' : `include ${inc}, exclude ${exc}`),
  /** @param {number|null} size @param {number|null} sub @param {number|null} all */
  rerootNote: (size, sub, all) =>
    all !== null ? `Σ${all}` : size === null ? '' : `${size} · ${sub}`,
  /** @param {number|null} size @param {number|null} sub @param {number|null} all */
  rerootSpoken: (size, sub, all) =>
    all !== null ? `distance sum ${all}` : size === null ? '' : `size ${size}, sum below ${sub}`,
  /** @param {TreeProblem} p */
  noteKey: (p) =>
    p === 'mis'
      ? 'Under each node: include | exclude. A node’s label ends with its weight.'
      : 'Under each node: size · distance sum below it, then Σ the distance sum to every node.',
  nodeStates: {
    current: 'being solved',
    stack: 'on the stack',
    child: 'child read now',
    settled: 'subtree finished',
    picked: 'picked',
    out: 'left out',
    known: 'distance sum known',
    best: 'best centre',
  },
  legend: {
    current: 'Being solved',
    stack: 'Waiting on the stack',
    child: 'Child read now',
    settled: 'Subtree finished',
    picked: 'Picked',
    out: 'Left out',
    known: 'Distance sum known',
    best: 'Smallest distance sum',
  },
  markers: {
    current: '●',
    stack: '◇',
    child: '○',
    settled: '✓',
    picked: '★',
    out: '–',
    known: '◆',
    best: '★',
  },
  tableTitle: { mis: 'Values per node', reroot: 'Values per node' },
  /** @type {Record<TreeProblem, string[]>} */
  rowHeads: { mis: ['inc', 'exc'], reroot: ['size', 'sub', 'all'] },
  /** @param {TreeProblem} p */
  tableAria: (p) =>
    p === 'mis'
      ? 'Table of include and exclude values, one column per node.'
      : 'Table of subtree size, distance sum below and distance sum to all, one column per node.',
  stats: {
    settled: 'Subtrees finished',
    edges: 'Edge visits',
    answer: { mis: 'Best total', reroot: 'Smallest sum' },
    naive: { mis: 'Subsets brute force tries', reroot: 'Edge visits, one search per root' },
  },
  pending: '…',
  pickedTitle: { mis: 'Picked nodes', reroot: 'Distance sums' },
  pickedEmpty: 'Read back after the root is solved.',
  /** @param {number} v @param {number|null} all */
  sumChip: (v, all) => `${node(v)}: ${all}`,
  /** @param {TreeDpFrame} f */
  describe(f) {
    const mis = f.problem === 'mis';
    const v = node(f.v);
    const c = node(f.c);
    switch (f.kind) {
      case 'start':
        return mis
          ? `Pick nodes of the largest total weight so that no two picked nodes are joined by an edge. ${plural(f.n, 'node', 'nodes')}, root A.`
          : `For every node, add up its distance in edges to all ${plural(f.n, 'node', 'nodes')}. Solve it for root A first, then move the root.`;
      case 'enter':
        return mis
          ? `Solve ${v}: picked alone it brings inc = ${f.weight[f.v]}; left out, exc = 0.${f.parent.includes(f.v) ? ' Its children come first.' : ' It is a leaf.'}`
          : `Enter ${v}: so far its subtree is ${v} alone, size 1, distance sum 0.`;
      case 'merge':
        return mis
          ? `Fold in ${c} (inc ${f.inc[f.c]}, exc ${f.exc[f.c]}). If ${v} is picked, ${c} must be left out: inc[${v}] += ${f.exc[f.c]} → ${f.inc[f.v]}. If not, ${c} takes its better value: exc[${v}] += ${Math.max(f.inc[f.c] ?? 0, f.exc[f.c] ?? 0)} → ${f.exc[f.v]}.`
          : `Fold in ${c}: its ${plural(f.size[f.c] ?? 0, 'node is', 'nodes are')} one edge further from ${v} than from ${c}, so sub[${v}] += ${f.sub[f.c]} + ${f.size[f.c]} → ${f.sub[f.v]}, size → ${f.size[f.v]}.`;
      case 'settle':
        return mis
          ? `${v} is finished: inc = ${f.inc[f.v]}, exc = ${f.exc[f.v]}. Its parent reads only these two numbers.`
          : `${v} is finished: size ${f.size[f.v]}, distance sum below ${f.sub[f.v]}.`;
      case 'answer':
        return `The root decides: max(inc[A], exc[A]) = max(${f.inc[0]}, ${f.exc[0]}) = ${f.result}. Now read the choice back from the top.`;
      case 'pick': {
        const p = f.parent[f.v];
        if (p >= 0 && f.taken[p]) return `${node(p)} is picked, so ${v} must be left out.`;
        return f.taken[f.v]
          ? `${v} is free and inc ${f.inc[f.v]} ≥ exc ${f.exc[f.v]}: pick ${v}.`
          : `${v} is free but exc ${f.exc[f.v]} > inc ${f.inc[f.v]}: leave ${v} out.`;
      }
      case 'root':
        return `With A as the root, the sum below A is the sum to every node: all[A] = ${f.all[0]}. Now move the root down, edge by edge.`;
      case 'move':
        return `Move the root from ${v} to ${c}: ${plural(f.size[f.c] ?? 0, 'node comes', 'nodes come')} one step closer and ${plural(f.n - (f.size[f.c] ?? 0), 'moves', 'move')} one step away. all[${c}] = ${f.all[f.v]} − ${f.size[f.c]} + ${f.n - (f.size[f.c] ?? 0)} = ${f.all[f.c]}.`;
      case 'done':
        return mis
          ? `Best total ${f.result}, from the picked nodes ${f.taken
              .map((t, i) => (t ? node(i) : ''))
              .filter(Boolean)
              .join(', ')}.`
          : `Every distance sum is known after two passes. The smallest is ${f.result}, at the tree’s centre.`;
    }
  },
  takeaways: [
    'Root the tree and solve it in post-order: a node is finished only after all its children, and its parent reads just a few numbers from it.',
    'Independent set: inc[v] = w[v] + Σ exc[c] and exc[v] = Σ max(inc[c], exc[c]). Two numbers per node replace the 2ⁿ subsets brute force would try.',
    'Read the answer back top-down: a node whose parent is picked must be left out; a free node is picked when inc[v] ≥ exc[v].',
    'Rerooting turns one root’s answer into all of them: moving the root from v to child c brings size[c] nodes one step closer and pushes n − size[c] one step away. Two passes, O(n), instead of n searches, O(n²).',
    'Switch to the star and give the centre a weight larger than all its leaves together, then smaller: watch exc[A] and inc[A] trade places.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    ['Post-order pass', 'O(n)', 'Each node is entered once and folded into its parent once.'],
    ['Rerooting pass', 'O(n)', 'Each edge moves the root once, in O(1).'],
    ['Memory', 'O(n)', 'A few numbers per node, plus the recursion stack of depth h.'],
    ['Brute force set', 'O(2ⁿ · n)', 'Every subset, each checked against the edges.'],
    ['Distance sums naively', 'O(n²)', 'One breadth-first search per node.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'In the Company party example, what is the heaviest total of an independent set?',
      answer: 16,
      hints: ['Step to the end and read Best total.'],
      solution:
        'Pick A (3), E (6), F (1), G (3) and H (3): 16. B weighs 5 but blocks E and F, which bring 7 together.',
    },
    {
      type: 'number',
      prompt:
        'In the Path of 6 example (weights 4, 5, 4, 3, 6, 2), what is exc[A], the best total with A left out?',
      answer: 11,
      hints: ['Load the Path of 6, step until A is finished, and read the exc row.'],
      solution:
        'With A out, the path B..F is free: B (5) and E (6) give 11, more than C and E (10) or B, D, F (10).',
    },
    {
      type: 'choice',
      prompt: 'Why must the tree be solved in post-order?',
      options: [
        'Because the root is the heaviest node.',
        'Because a node’s values are built from its children’s finished values.',
        'Because pre-order visits fewer nodes.',
        'Because leaves have weight 0.',
      ],
      answer: 1,
      hints: ['Which cells does the merge step read?'],
      solution:
        'inc[v] and exc[v] add up values of the children, so every child must be finished first: children before parent is post-order.',
    },
    {
      type: 'number',
      prompt:
        'In the Company party tree, the distance sum from A is 11. Child D has a subtree of 3 nodes. What is the distance sum from D?',
      answer: 13,
      hints: [
        'Switch to Distance sums and step to the move from A to D.',
        'all[c] = all[v] − size[c] + (n − size[c]).',
      ],
      solution: '11 − 3 + (8 − 3) = 13: three nodes come closer, five move away.',
    },
    {
      type: 'text',
      prompt: 'How long does rerooting take to find the distance sums of all n nodes?',
      accept: ['O(n)', 'Θ(n)', 'n', 'linear'],
      hints: ['Count the passes and the work per edge.'],
      solution: 'One post-order pass and one pre-order pass, each O(1) per edge: O(n) in total.',
    },
  ],
  nextTeaser: 'Bài tiếp theo: QHĐ chữ số.',
};
