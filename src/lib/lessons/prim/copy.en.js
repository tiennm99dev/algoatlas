/** @typedef {import('$lib/algo-engine/prim.js').PrimFrame} PrimFrame */
/** @typedef {import('$lib/algo-engine/prim.js').PrimEntry} PrimEntry */
/** @typedef {{u: number, v: number, w: number}} EdgeInfo */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d));
/** @param {number} k @param {string} one @param {string} many */
const count = (k, one, many) => `${k} ${k === 1 ? one : many}`;

export const en = {
  slug: 'prim',
  topic: 'mst',
  level: 'Intermediate',
  title: 'Prim’s algorithm',
  intro:
    'Prim’s algorithm grows one tree from a start vertex. At every step it adds the cheapest edge with one end in the tree and the other outside, which the cut property says is safe. A heap of crossing edges makes that O(E log V), best on sparse graphs; an array of keys makes it O(V²), best on dense ones.',
  summary:
    'Grow a minimum spanning tree from a start vertex, with a heap of crossing edges or an array of keys, and compare their cost on sparse and dense graphs.',
  instruction:
    'Pick a start vertex and step through: the tree (green) gains the cheapest frontier edge each step. Switch between the heap and the array version, and load the complete graph to see which one does less work when almost every pair is joined.',
  variantLabel: 'Find the cheapest edge with',
  variants: { heap: 'Heap of edges', array: 'Array of keys' },
  startLabel: 'Start',
  presetLabel: 'Graph',
  presets: { sparse: 'Starting graph (9 edges)', dense: 'Complete graph (15 edges)' },
  resetGraph: 'Reset graph',
  graphAria:
    'Undirected weighted graph. Tree vertices, frontier vertices and the order vertices joined are marked.',
  edgesTitle: 'Edge weights',
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  noEdges: 'No edges yet. Use Connect to draw one.',
  /** @param {number} max */
  badWeight: (max) => `A weight must be a whole number from 1 to ${max}. The old weight is kept.`,
  heapTitle: 'Heap of crossing edges (minimum first)',
  keysTitle: 'Keys of vertices outside the tree',
  addedTitle: 'Joined the tree, in order',
  emptyText: 'empty',
  hotLabel: 'just changed',
  staleTag: 'stale',
  /** @param {PrimEntry} e @param {string[]} names @param {boolean} stale */
  heapChip: (e, names, stale) => `${names[e.from]} — ${names[e.to]} ${e.w}${stale ? ' stale' : ''}`,
  /** @param {string} name @param {number} key @param {string} via */
  keyChip: (name, key, via) => `${name} ${show(key)}${via ? ` via ${via}` : ''}`,
  /** @param {number} key */
  keyNote: (key) => `key ${show(key)}`,
  stats: {
    comparisons: 'Comparisons to find the cheapest',
    examined: 'Edges examined',
    pushes: 'Heap pushes',
    pops: 'Heap pops',
    stale: 'Stale edges skipped',
    weight: 'Tree weight',
  },
  legend: {
    current: 'Vertex just added or expanded',
    neighbor: 'Other end of the edge examined',
    frontier: 'Frontier: reachable by one edge',
    tree: 'In the tree',
    order: 'Join order',
    edgeNow: 'Edge examined now',
    edgeStale: 'Stale edge popped',
    treeEdge: 'Tree edge',
    candidate: 'Crossing edge waiting',
  },
  states: {
    start: 'start',
    current: 'just added or expanded',
    neighbor: 'other end of the edge',
    frontier: 'on the frontier',
    tree: 'in the tree',
  },
  /** @param {string} name @param {string} state @param {number} joined */
  vertexLabel: (name, state, joined) =>
    [`Vertex ${name}`, state, joined > 0 ? `joined ${joined}` : ''].filter(Boolean).join(', '),
  /**
   * @param {PrimFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  describe(f, names, info) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const w = info[f.edge]?.w ?? 0;
    const n = f.inTree.length;
    const missed = n - f.added.length;
    switch (f.kind) {
      case 'start':
        if (!n) return 'The graph has no vertices.';
        if (f.current < 0) return 'Pick a start vertex.';
        if (f.variant === 'array')
          return `Set key[${u}] = 0 and every other key to ∞. A key is the weight of the lightest known edge from the tree to that vertex.`;
        return f.heap.length
          ? `Start the tree at ${u} and push its ${count(f.heap.length, 'edge', 'edges')} into the heap: ${f.heap.map((e) => `${names[e.from]} — ${names[e.to]} ${e.w}`).join(', ')}.`
          : `Start the tree at ${u}. It has no edges, so the heap stays empty.`;
      case 'add':
        if (f.variant === 'array')
          return f.edge < 0
            ? `Scan the keys outside the tree: ${u} has the smallest, 0. It joins as the root.`
            : `Scan the keys outside the tree: ${u} has the smallest, ${w} via ${v}. Add ${u} and edge ${v} — ${u}. Tree weight is now ${f.weight}.`;
        return `Pop ${v} — ${u} (weight ${w}), the lightest edge in the heap. ${u} is outside the tree, so the edge crosses the cut: add ${u} and the edge. Tree weight is now ${f.weight}.`;
      case 'push':
        return `${v} is outside the tree: push ${u} — ${v} (weight ${w}) into the heap.`;
      case 'stale':
        return `Pop ${u} — ${v} (weight ${w}), but ${v} is already in the tree. Both ends are inside, so the edge no longer crosses the cut: it is stale. Skip it.`;
      case 'improve':
        return `Edge ${u} — ${v} (weight ${w}) is lighter than key[${v}] = ${show(f.before)}. Set key[${v}] = ${w} and parent[${v}] = ${u}.`;
      case 'keep':
        return `Edge ${u} — ${v} (weight ${w}) is not lighter than key[${v}] = ${show(f.before)}. Keep the key.`;
      case 'unreachable':
        return `The smallest key outside the tree is ∞: no edge reaches the remaining ${count(missed, 'vertex', 'vertices')}. Stop.`;
      case 'done':
        if (!f.added.length) return 'Nothing to do.';
        if (missed)
          return `Done. ${count(missed, 'vertex', 'vertices')} cannot be reached from ${names[f.added[0]]}: Prim spans only the start’s component, here with weight ${f.weight}.`;
        return f.variant === 'heap'
          ? `All ${n} vertices are in the tree, weight ${f.weight}. ${f.heap.length ? `${count(f.heap.length, 'entry', 'entries')} left in the heap ${f.heap.length === 1 ? 'is' : 'are'} never popped.` : 'The heap is empty.'}`
          : `All ${n} vertices are in the tree, weight ${f.weight}, after ${f.comparisons} key comparisons.`;
    }
  },
  takeaways: [
    'Prim grows a single tree. Each step adds the cheapest edge with one end in the tree and one outside: the lightest edge across the cut (tree, rest), so by the cut property it belongs to a minimum spanning tree.',
    'Heap version: when a vertex joins, push its edges to vertices outside. A popped edge whose far end already joined is stale and skipped. At most E pushes and pops: O(E log E) = O(E log V).',
    'Array version: key[v] is the lightest edge from the tree to v. Each of the V rounds scans every key, so it costs O(V²) whatever E is.',
    'Sparse graphs (E close to V) favour the heap; dense graphs (E close to V²) favour the array, because V² beats V² log V. On a disconnected graph Prim spans only the start’s component.',
    'Try it: load the complete graph and compare Comparisons to find the cheapest for both versions, then start at another vertex: the tree weight stays the same.',
  ],
  complexityHead: ['Version', 'Cost', 'Why'],
  complexity: [
    [
      'Heap of crossing edges (lazy)',
      'O(E log V)',
      'Every edge is pushed and popped at most once, each at O(log E) = O(log V).',
    ],
    [
      'Array of keys',
      'O(V²)',
      'V rounds, each scanning up to V keys for the smallest; every edge is examined once from each end.',
    ],
    [
      'Fibonacci heap',
      'O(E + V log V)',
      'Decrease-key costs O(1) amortised; the best bound in theory, rarely faster in practice.',
    ],
    ['Memory', 'O(V + E)', 'Tree flags and keys per vertex, plus up to E heap entries.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt: 'On the starting graph from A, in which order do the vertices join the tree?',
      accept: ['A, B, C, D, E, F', 'ABCDEF', 'A B C D E F'],
      hints: ['After A, the cheapest crossing edge is A — B (3). Then look at B’s edges too.'],
      solution:
        'A, then B by A — B 3, C by B — C 2, D by B — D 5, E by D — E 7, F by E — F 1. Prim adds the cheapest crossing edge, not the lightest vertex label, so F joins last although E — F weighs 1.',
    },
    {
      type: 'number',
      prompt:
        'With the heap version on the starting graph from A, how many stale edges are popped and skipped?',
      answer: 2,
      unit: 'edges',
      tolerance: 0,
      hints: ['An edge is stale when both its ends are in the tree by the time it is popped.'],
      solution:
        'A — C (4) is popped after C joined through B — C, and C — D (6) after D joined through B — D. Both are skipped: 2 stale edges. C — E and D — F are still in the heap when the tree is complete.',
    },
    {
      type: 'text',
      prompt: 'Start at F instead. In which order do the vertices join?',
      accept: ['F, E, D, B, C, A', 'FEDBCA', 'F E D B C A'],
      hints: ['From F the crossing edges are E — F 1 and D — F 9.'],
      solution:
        'F, then E (E — F 1), D (D — E 7, lighter than C — E 8 and D — F 9), B (B — D 5), C (B — C 2), A (A — B 3). The weight is again 1 + 7 + 5 + 2 + 3 = 18.',
    },
    {
      type: 'number',
      prompt:
        'With the array version, how many key comparisons does Prim make on any connected graph with 6 vertices?',
      answer: 15,
      unit: 'comparisons',
      tolerance: 0,
      hints: ['Round k scans the vertices still outside the tree: 6, 5, 4, … of them.'],
      solution:
        'Finding the smallest of m keys takes m − 1 comparisons, so the rounds cost 5 + 4 + 3 + 2 + 1 + 0 = 15 = V(V − 1)/2, whatever the edges are.',
    },
    {
      type: 'choice',
      prompt:
        'A graph has 1,000 vertices and an edge between almost every pair. Which version of Prim should you use?',
      options: [
        'The heap version: O(E log V) is always better.',
        'The array version: O(V²) = 10⁶ steps beats E log V ≈ 5 × 10⁵ × 10.',
        'Either, they cost the same.',
        'Neither: Prim cannot handle dense graphs.',
      ],
      answer: 1,
      hints: ['With E ≈ V²/2, compare V² with E log V.'],
      solution:
        'E is about 500,000, so the heap version does about 500,000 × log₂ 1,000 ≈ 5 million heap steps, while the array version does about V² = 1 million. On dense graphs the array wins.',
    },
  ],
  nextTeaser:
    'Next up: Practice: MST problems, where you predict a minimum spanning tree and use it to find bottleneck paths and the second-best tree.',
};
