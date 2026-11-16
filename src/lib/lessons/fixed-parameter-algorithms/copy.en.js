/** @typedef {import('$lib/algo-engine/fixed-parameter-algorithms.js').FptFrame} FptFrame */
/** @typedef {import('$lib/algo-engine/fixed-parameter-algorithms.js').SearchNode} SearchNode */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {string[]} names @param {number[]} set */
const setText = (names, set) => (set.length ? `{${set.map((i) => names[i]).join(', ')}}` : '{ }');

export const en = {
  slug: 'fixed-parameter-algorithms',
  topic: 'intractability',
  level: 'Advanced',
  title: 'Fixed-parameter algorithms',
  intro:
    'NP-hard does not always mean hopeless. Parameterised complexity measures the running time in the input size n and a second number k, such as the size of the answer. A problem is fixed-parameter tractable when it can be solved in f(k) · poly(n) time: exponential only in k. Vertex cover is the classic example, solved in O(2ᵏ · m) by a search tree at most k deep.',
  summary:
    'Decide whether a graph has a vertex cover of k vertices with a bounded search tree, and shrink the graph first with the Buss kernel.',
  instruction:
    'Step through the search tree and watch the cover on the graph grow and shrink as the search backtracks. Change k, turn the kernel on, edit the graph, or click or press Enter on a tree node to jump to it. Compare Search nodes with the 2^(k+1) − 1 bound and with brute force.',
  kLabel: 'k',
  kernelLabel: 'Kernel first',
  kernels: { off: 'Off', on: 'Buss kernel' },
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    yes: 'Spider, k = 3',
    no: 'Spider, k = 2',
    stars: 'Two stars, k = 2',
  },
  /** @param {number} max */
  kError: (max) => `k must be a whole number from 0 to ${max}.`,
  graphTitle: 'Graph',
  graphAria: 'Graph to cover. Draw it with the tools.',
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => (state ? `Vertex ${name}, ${state}` : `Vertex ${name}`),
  states: { current: 'acted on now', cover: 'in the cover', forced: 'forced by the kernel' },
  markers: { forced: 'K' },
  treeTitle: 'Search tree',
  treeNote:
    'A circle shows the vertices still allowed, and the number below it the uncovered edges. An edge is labelled with the vertex it takes. The tree is never deeper than k.',
  treeAria: 'Bounded search tree, built as it runs.',
  treeEmpty: 'No search yet.',
  /** @param {string} name */
  edgeLabel: (name) => `+${name}`,
  /** @param {SearchNode} n @param {string} took */
  nodeLabel: (n, took) => {
    const state = {
      active: 'on the current path',
      fail: 'out of budget with edges left',
      yes: 'every edge covered',
      done: 'both branches failed',
    }[n.status];
    return `${took ? `Took ${took}, ` : 'Root, '}${plural(n.budget, 'vertex', 'vertices')} left to spend, ${plural(n.left, 'edge', 'edges')} uncovered, ${state}.`;
  },
  nodeMarkers: { yes: '✓', fail: '✗' },
  legend: {
    current: 'Acted on now',
    cover: 'In the cover',
    forced: 'K Forced by the kernel',
    branchEdge: 'The edge branched on',
    covered: 'A covered edge',
    path: 'On the current path',
    found: '✓ Cover found',
    fail: '✗ Out of budget',
    done: 'Both branches failed',
  },
  stats: {
    made: 'Search nodes',
    budget: 'k after the kernel',
    brute: 'Brute force tries',
    answer: 'Answer',
  },
  /** @param {number} k */
  boundNote: (k) => `At most 2^(${k} + 1) − 1 = ${2 ** (k + 1) - 1}.`,
  /** @param {number} n @param {number} k */
  bruteNote: (n, k) => `Every set of at most ${k} of ${n} vertices.`,
  /** @param {FptFrame} f @param {string[]} names */
  answer: (f, names) => {
    if (f.answer === 'yes') return `yes, ${setText(names, f.cover)}`;
    if (f.answer === 'no') return 'no';
    return 'searching';
  },
  /** @param {FptFrame} f @param {string[]} names */
  describe(f, names) {
    const node = f.current >= 0 ? f.nodes[f.current] : null;
    const e = f.edge >= 0 ? f.edges[f.edge] : null;
    const pair = e ? `${names[e[0]]} – ${names[e[1]]}` : '';
    switch (f.kind) {
      case 'start':
        return `Is there a vertex cover of at most k = ${f.k} vertices? The graph has ${plural(f.n, 'vertex', 'vertices')} and ${plural(f.edges.length, 'edge', 'edges')}.`;
      case 'forced':
        return `${names[f.vertex]} has more than ${f.budget + 1} uncovered edges. A cover without it would need all those neighbours, too many, so take ${names[f.vertex]}. Now k = ${f.budget}.`;
      case 'overBudget':
        return `${names[f.vertex]} still has edges but k is 0. No cover fits: the answer is no.`;
      case 'tooBig':
        return `Every vertex now covers at most k = ${f.budget} edges, so k vertices cover at most ${f.budget * f.budget}. ${f.covered.filter((c) => !c).length} edges are left: the answer is no, without any search.`;
      case 'kernel':
        return `The kernel is ready: ${plural(f.covered.filter((c) => !c).length, 'edge', 'edges')} left, at most k² = ${f.budget * f.budget}, with k = ${f.budget}. Search it.`;
      case 'branch':
        return `${pair} is the first uncovered edge, and any cover holds ${names[e?.[0] ?? 0]} or ${names[e?.[1] ?? 0]}. Branch: first take ${names[e?.[0] ?? 0]}, with ${plural((node?.budget ?? 1) - 1, 'vertex', 'vertices')} left after it.`;
      case 'back':
        return `That branch found no cover. Try the other end of ${pair}.`;
      case 'fail':
        return `No vertices left to spend, but ${plural(node?.left ?? 0, 'edge is', 'edges are')} still uncovered. Dead end: go back.`;
      case 'yes':
        return `Every edge is covered by ${setText(names, f.cover)}, ${plural(f.cover.length, 'vertex', 'vertices')}, at most k. The answer is yes.`;
      case 'done':
        return f.answer === 'yes'
          ? `Done: yes, after ${plural(f.nodes.length, 'search node', 'search nodes')}.`
          : f.nodes.length
            ? `Done: every branch ran out of budget, so no cover of ${f.k} vertices exists. The search made ${plural(f.nodes.length, 'node', 'nodes')}.`
            : 'Done: the kernel answered no before any search.';
    }
  },
  takeaways: [
    'Parameterised complexity asks how the running time grows with n and with a parameter k separately. FPT means f(k) · poly(n), so a huge graph with a small k is easy.',
    'A bounded search tree branches on a small set that must contain part of the answer. For vertex cover, every edge has an end in the cover: two branches, each spending one vertex, so at most 2ᵏ leaves.',
    'A kernel shrinks the input in polynomial time to a size that depends only on k. The Buss rules leave at most k² edges, or answer no straight away.',
    'Compare O(2ᵏ · m) with brute force over all sets of k vertices, about nᵏ. For n = 1000 and k = 10, that is about a million steps against 10³⁰.',
    'Load Spider, k = 2, and step through: the search makes 7 nodes before it says no. Turn on the kernel and it says no at once, because A is forced and 3 edges are more than 1².',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'Search tree',
      'O(2ᵏ · m)',
      'At most 2^(k+1) − 1 nodes, each finds an uncovered edge in O(m).',
    ],
    ['Buss kernel', 'O(k · (n + m))', 'At most k forced vertices, one degree count each.'],
    [
      'Kernel then search',
      'O(n + m + 2ᵏ · k²)',
      'The search runs on a kernel of at most k² edges.',
    ],
    ['Brute force', 'O(nᵏ · m)', 'Every set of k vertices, checked against every edge.'],
    ['Memory', 'O(k + m)', 'One path of at most k picks, plus the graph.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'What is the most nodes the search tree can have when k = 4?',
      answer: 31,
      unit: 'nodes',
      hints: ['A binary tree at most k deep.'],
      solution: '2^(4 + 1) − 1 = 31 nodes, however large the graph is.',
    },
    {
      type: 'number',
      prompt: 'Load Spider, k = 2. How many search nodes does it make before answering no?',
      answer: 7,
      unit: 'nodes',
      hints: ['Step to the end and read Search nodes.'],
      solution:
        'Every branch runs out of budget, so the tree is full: 2³ − 1 = 7 nodes, the most the bound allows for k = 2.',
    },
    {
      type: 'number',
      prompt: 'Load Spider, k = 3. How many search nodes does it make before it finds a cover?',
      answer: 15,
      unit: 'nodes',
      hints: [
        'The search stops at the first cover it finds. Step to the end and read Search nodes.',
      ],
      solution:
        'Taking A first fails in all 7 nodes of its subtree. Taking B, then A fails, then C and D give the cover {B, C, D}: 15 nodes, the full bound of 2⁴ − 1, because the cover is found on the very last leaf.',
    },
    {
      type: 'choice',
      prompt: 'In the Buss kernel, why must a vertex with more than k edges be in the cover?',
      options: [
        'It has the highest degree.',
        'Leaving it out would need all its more than k neighbours in the cover.',
        'Greedy always takes it.',
        'Its edges form a matching.',
      ],
      answer: 1,
      hints: ['Each edge of v needs v or the other end.'],
      solution:
        'If v is out, each of its edges needs the other end, which is more than k vertices. So any cover of at most k vertices takes v.',
    },
    {
      type: 'multi',
      prompt: 'Which running times are fixed-parameter tractable in k? Pick all that apply.',
      options: ['O(2ᵏ · n)', 'O(nᵏ)', 'O(k! · n³)', 'O(n^(k/2))'],
      answers: [0, 2],
      hints: ['FPT is f(k) times a polynomial whose degree does not depend on k.'],
      solution:
        '2ᵏ · n and k! · n³ separate k from n. In nᵏ and n^(k/2) the exponent of n grows with k, so they are not FPT.',
    },
  ],
  nextTeaser:
    'Next up: Practice: reductions and hardness, where you sort problem cards into polynomial, NP-complete and approximable.',
};
