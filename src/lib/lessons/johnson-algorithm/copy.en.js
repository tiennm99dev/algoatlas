/** @typedef {import('$lib/algo-engine/johnson-algorithm.js').JohnsonFrame} JohnsonFrame */

/** @param {number | null} d */
const show = (d) => (d === null ? '—' : d === Infinity ? '∞' : String(d).replace('-', '−'));

/** A summand: a negative number goes in brackets, as in 1 + (−2). @param {number} d */
const term = (d) => (d < 0 ? `(${show(d)})` : show(d));

export const en = {
  slug: 'johnson-algorithm',
  topic: 'shortest-paths',
  level: 'Advanced',
  title: 'Johnson’s algorithm',
  intro:
    'Johnson’s algorithm finds the shortest paths between all pairs of vertices in a sparse graph that may have negative edge weights. One run of Bellman-Ford computes a potential h(v) for every vertex; reweighting each edge with w′(u, v) = w(u, v) + h(u) − h(v) makes every weight non-negative without changing which paths are shortest. Then Dijkstra can run from every vertex, which beats Floyd-Warshall’s O(V³) when the graph has few edges.',
  summary:
    'Watch Johnson’s algorithm turn negative edge weights into non-negative ones with Bellman-Ford potentials, then run Dijkstra from every vertex.',
  instruction:
    'Step through the three phases: Bellman-Ford from the extra vertex q fills the potentials h, every edge gets its new weight w′, then Dijkstra runs once per source and fills one row of the matrix. Switch “Weights shown” to w′ to see the reweighted graph; edit a weight in the edge table or draw edges in w view.',
  presetLabel: 'Graph',
  presets: {
    negative: 'Negative edges, no cycle',
    cycle: 'Negative cycle',
    positive: 'No negative edges',
  },
  viewLabel: 'Weights shown',
  views: { w: 'w (original)', wp: 'w′ (reweighted)' },
  resetGraph: 'Reset graph',
  graphAria: 'Directed weighted graph; weights may be negative.',
  graphAriaReweighted:
    'The same graph with the reweighted edge weights w′. Edges not reweighted yet show no weight.',
  edgesTitle: 'Edges: w′ = w + h(u) − h(v)',
  edgeHead: ['Edge u → v', 'w', 'h(u)', 'h(v)', 'w′'],
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  noEdges: 'No edges yet. Use Connect to draw one.',
  /** @param {number} max */
  badWeight: (max) =>
    `A weight must be a whole number from −${max} to ${max}. The old weight is kept.`,
  potentialsTitle: 'Potentials h(v) = distance from q',
  /** @param {string} name @param {number} h */
  potentialChip: (name, h) => `h(${name}) = ${show(h)}`,
  potentialsEmpty: 'not computed yet',
  hotLabel: 'just changed',
  cycleTitle: 'Negative cycle',
  matrixTitle: 'Distances d(s, t): row = from s, column = to t',
  matrixAria:
    'All-pairs distance matrix. Row s fills in when the Dijkstra run from s ends; ∞ means t cannot be reached from s.',
  /** @param {string} from @param {string} to @param {string} value @param {string} state */
  cellLabel: (from, to, value, state) =>
    [`From ${from} to ${to}: ${value}`, state].filter(Boolean).join(', '),
  stats: {
    phase: 'Phase',
    bfChecks: 'Bellman-Ford edge checks',
    dijkstraChecks: 'Dijkstra edge checks',
  },
  phases: {
    start: 'Add q',
    bf: '1. Bellman-Ford from q',
    reweight: '2. Reweight edges',
    /** @param {string} s */
    dijkstra: (s) => `3. Dijkstra from ${s}`,
    cycle: 'Stopped: negative cycle',
    done: 'Done',
  },
  legend: {
    source: 'Dijkstra source',
    tail: 'u, read now',
    write: 'v, label lowered now',
    settled: 'Settled in this Dijkstra run',
    cycle: 'On the negative cycle',
    edgeNow: 'Edge used now',
    tree: 'Dijkstra parent edge',
    row: 'Row just filled',
  },
  states: {
    source: 'Dijkstra source',
    tail: 'read now',
    write: 'label lowered now',
    settled: 'settled',
    cycle: 'on the negative cycle',
    row: 'just filled',
  },
  /** @param {number} h */
  hNote: (h) => `h ${show(h)}`,
  /** @param {number} d */
  dNote: (d) => `d′ ${show(d)}`,
  show,
  /** @param {string} name @param {string} note @param {string} state */
  vertexLabel: (name, note, state) => [`Vertex ${name}`, note, state].filter(Boolean).join(', '),
  /**
   * @param {JohnsonFrame} f
   * @param {string[]} names
   * @param {number[]} weights  Original weight per input edge.
   */
  describe(f, names, weights) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const s = names[f.source] ?? '';
    const w = weights[f.edge] ?? 0;
    switch (f.kind) {
      case 'start':
        return names.length
          ? `Add a new vertex q with an edge of weight 0 to each of the ${names.length} vertices. Every vertex is now reachable from q.`
          : 'The graph is empty: add a vertex to start.';
      case 'bf-round':
        return `Bellman-Ford round ${f.round}: relax q’s edges, then every edge of the graph in list order.`;
      case 'bf-q':
        return 'Relaxing q → v with weight 0 sets every h to 0. Negative edges can still pull some of them lower.';
      case 'bf-lower':
        return `Edge ${u} → ${v} (weight ${show(w)}): h(${u}) + ${term(w)} = ${show(f.h[f.current])} + ${term(w)} = ${show(f.h[f.neighbor])} < ${show(f.before)}, so lower h(${v}) to ${show(f.h[f.neighbor])}.`;
      case 'bf-early':
        return `Round ${f.round} changed nothing, so the potentials are final: h(v) is the shortest distance from q to v, never above 0.`;
      case 'bf-check':
        return 'Bellman-Ford ran all its rounds and the last one still changed a label. One more pass checks for a negative cycle.';
      case 'cycle': {
        const loop = f.cycle.map((i) => names[i]).join(' → ');
        return `Edge ${u} → ${v} can still be relaxed, so the graph has a negative cycle: ${loop} → ${names[f.cycle[0]] ?? ''}. Shortest paths through it do not exist, and Johnson’s algorithm stops here.`;
      }
      case 'reweight': {
        const hu = f.h[f.current];
        const hv = f.h[f.neighbor];
        const wp = f.reweighted[f.edge] ?? 0;
        return `Edge ${u} → ${v}: w′ = ${show(w)} + ${term(hu)} − ${term(hv)} = ${show(wp)}. It is ≥ 0 because h(${v}) ≤ h(${u}) + w.`;
      }
      case 'dij-start':
        return `Dijkstra from ${s} on the reweighted graph: d′(${s}) = 0, every other d′ = ∞. All w′ are ≥ 0, so Dijkstra is safe.`;
      case 'settle':
        return `Settle ${u} at d′ = ${show(f.dPrime[f.current])}: no unsettled vertex has a smaller label.`;
      case 'lower': {
        const wp = f.reweighted[f.edge] ?? 0;
        return `Edge ${u} → ${v} (w′ = ${show(wp)}): ${show(f.dPrime[f.current])} + ${show(wp)} = ${show(f.dPrime[f.neighbor])} < ${show(f.before)}, so lower d′(${v}).`;
      }
      case 'row': {
        const t = f.matrix[f.source].findIndex((x, i) => i !== f.source && x !== Infinity);
        if (t < 0)
          return `Dijkstra from ${s} is done, but ${s} reaches no other vertex. Row ${s} is 0 on the diagonal and ∞ elsewhere.`;
        const T = names[t];
        return `Dijkstra from ${s} is done. Undo the shift for each target, for example d(${s}, ${T}) = d′(${T}) − h(${s}) + h(${T}) = ${show(f.dPrime[t])} − ${term(f.h[f.source])} + ${term(f.h[t])} = ${show(f.matrix[f.source][t])}.`;
      }
      case 'done':
        return f.cycle.length
          ? 'Stopped: with a negative cycle there is no all-pairs answer to give.'
          : `Done: ${f.matrix.length} Dijkstra runs filled the whole matrix after a single Bellman-Ford run.`;
    }
  },
  takeaways: [
    'Reweighting with potentials: w′(u, v) = w(u, v) + h(u) − h(v). Along a path s → … → t the h terms cancel in pairs, so every s-to-t path changes by the same amount h(s) − h(t), and the shortest one stays shortest.',
    'Adding a constant to every edge does not work: it penalises paths with many edges. Potentials shift whole paths, not single edges.',
    'h comes from one Bellman-Ford run from a new vertex q joined to every vertex by a 0-weight edge. The triangle inequality h(v) ≤ h(u) + w(u, v) is exactly w′ ≥ 0. If Bellman-Ford finds a negative cycle, there is no answer and the algorithm stops.',
    'Bellman-Ford then Dijkstra: O(V·E) once, plus V Dijkstra runs at O(E log V) each. On a sparse graph that is about O(V² log V), well below Floyd-Warshall’s O(V³).',
    'Try it: pick “No negative edges” and see that every h is 0 and w′ = w, then set D → C to −6 and watch Bellman-Ford stop the run at a negative cycle.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'Bellman-Ford from q',
      'O(V·E)',
      'At most V rounds over E + V edges: the graph’s edges plus q’s.',
    ],
    ['Reweighting', 'O(E)', 'One addition and one subtraction per edge.'],
    [
      'V Dijkstra runs',
      'O(V·E log V)',
      'Each run costs O((V + E) log V) with a binary heap; O(V² log V + V·E) with a Fibonacci heap.',
    ],
    [
      'Total on a sparse graph (E ≈ V)',
      'O(V² log V)',
      'Better than Floyd-Warshall’s O(V³); on a dense graph (E ≈ V²) Floyd-Warshall is simpler and as fast.',
    ],
    ['Memory', 'O(V²)', 'The output matrix; the algorithm itself needs O(V + E).'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'On “Negative edges, no cycle”, step until the potentials are final. What is h(C)?',
      answer: -5,
      tolerance: 0,
      hints: [
        'h(C) is the shortest distance from q to C. Every path from q starts with a 0-weight edge.',
        'Try q → D → C.',
      ],
      solution: 'q → D costs 0 and D → C costs −5, so h(C) = −5. No path from q to C is cheaper.',
    },
    {
      type: 'number',
      prompt: 'On the same graph, what is the reweighted weight w′ of edge A → C (w = 8)?',
      answer: 13,
      tolerance: 0,
      hints: ['w′ = w + h(A) − h(C), and h(A) = 0.'],
      solution:
        'w′ = 8 + 0 − (−5) = 13. The table shows it once the reweighting phase reaches A → C.',
    },
    {
      type: 'number',
      prompt:
        'Dijkstra from B finds d′(C) = 0 on the reweighted graph. What is the real distance d(B, C)?',
      answer: -4,
      tolerance: 0,
      hints: ['d(B, C) = d′(C) − h(B) + h(C), with h(B) = −1 and h(C) = −5.'],
      solution: 'd(B, C) = 0 − (−1) + (−5) = −4, which is the path B → D → C: 1 + (−5) = −4.',
    },
    {
      type: 'choice',
      prompt:
        'Why not just add 5 to every edge so that the smallest weight, −5, becomes 0, and then run Dijkstra?',
      options: [
        'It would make Dijkstra slower.',
        'A path with k edges gets 5k more, so paths with more edges are penalised and the shortest path can change.',
        'Dijkstra cannot handle a weight of exactly 0.',
        'It works, and Johnson’s algorithm does exactly this.',
      ],
      answer: 1,
      hints: ['Compare a one-edge path and a three-edge path between the same two vertices.'],
      solution:
        'A constant shift adds 5 per edge, so it favours paths with fewer edges. Potentials add h(s) − h(t) to every s-to-t path, whatever its length, so the order of the paths is kept.',
    },
  ],
  nextTeaser:
    'Next up: A* search, which adds a heuristic to Dijkstra so that it heads straight for the goal.',
};
