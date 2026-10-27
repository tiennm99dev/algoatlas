/** @typedef {import('$lib/algo-engine/floyd-warshall.js').FloydFrame} FloydFrame */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d).replace('-', '−'));

export const en = {
  slug: 'floyd-warshall',
  topic: 'shortest-paths',
  level: 'Intermediate',
  title: 'Floyd-Warshall',
  intro:
    'Floyd-Warshall finds the shortest path between every pair of vertices with three nested loops over a distance matrix. Phase k lets vertex k serve as a stop in the middle of a path; after the last phase, every vertex is allowed and the matrix holds all shortest distances. It takes O(V³) time, handles negative edges, and reveals a negative cycle on the diagonal.',
  summary:
    'Watch the Floyd-Warshall distance matrix improve as each intermediate vertex k is allowed, and read any shortest path from it.',
  instruction:
    'Step through, or press Next k to finish a phase. In phase k, each cell (i, j) compares its value with the path through k: the cells in row k and column k are the only inputs. Pick a cell to see that pair’s current best path on the graph.',
  presetLabel: 'Graph',
  presets: { start: 'Negative edges, no cycle', cycle: 'Negative cycle' },
  resetGraph: 'Reset graph',
  nextK: 'Next k',
  graphAria: 'Directed weighted graph; weights may be negative.',
  matrixTitle: 'Distance matrix: row = from, column = to',
  matrixAria:
    'Distance matrix. Row i, column j holds the shortest i to j distance found so far. Pick a cell to show its path.',
  /** @param {string} from @param {string} to @param {string} value @param {string} state */
  cellLabel: (from, to, value, state) =>
    [`From ${from} to ${to}: ${value}`, state].filter(Boolean).join(', '),
  edgesTitle: 'Edge weights',
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  noEdges: 'No edges yet. Use Connect to draw one.',
  /** @param {number} max */
  badWeight: (max) =>
    `A weight must be a whole number from −${max} to ${max}. The old weight is kept.`,
  allowedTitle: 'Allowed intermediate vertices',
  emptyText: 'none yet: direct edges only',
  pathTitle: 'Picked pair',
  /** @param {string} from @param {string} to @param {string[]} path @param {number} d */
  pathText: (from, to, path, d) =>
    path.length
      ? `${from} → ${to}: ${path.join(' → ')}, weight ${show(d)}.`
      : d === Infinity
        ? `${from} → ${to}: no path found yet.`
        : `${from} → ${to}: the path runs into a negative cycle.`,
  stats: {
    phase: 'Phase k',
    comparisons: 'Comparisons',
    updates: 'Cells improved',
  },
  legend: {
    k: 'k, the new intermediate',
    ends: 'i and j, the pair compared',
    path: 'Picked pair’s best path',
    rowcol: 'Row k and column k',
    inputs: 'dist[i][k] and dist[k][j], read now',
    write: 'dist[i][j], improved now',
    kept: 'dist[i][j], kept',
    negative: 'Negative diagonal: on a negative cycle',
  },
  states: {
    k: 'intermediate k',
    end: 'compared now',
    rowcol: 'row or column k',
    input: 'read now',
    write: 'improved now',
    kept: 'kept',
    negative: 'negative cycle',
    picked: 'picked',
  },
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Vertex ${name}`, state].filter(Boolean).join(', '),
  show,
  /**
   * @param {FloydFrame} f
   * @param {string[]} names
   */
  describe(f, names) {
    const k = names[f.k] ?? '';
    const i = names[f.i] ?? '';
    const j = names[f.j] ?? '';
    const ik = f.k >= 0 && f.i >= 0 ? show(f.dist[f.i][f.k]) : '';
    const kj = f.k >= 0 && f.j >= 0 ? show(f.dist[f.k][f.j]) : '';
    switch (f.kind) {
      case 'start':
        return 'Start with direct edges only: dist[i][j] is the edge weight, 0 on the diagonal, ∞ where there is no edge.';
      case 'phase':
        return f.k === 0
          ? `Phase k = ${k}: paths may now pass through ${k}.`
          : `Phase k = ${k}: paths may now pass through ${names.slice(0, f.k + 1).join(', ')}. Every cell already holds the best path through ${names.slice(0, f.k).join(', ')}.`;
      case 'improve':
        return `${i} → ${k} → ${j}: ${ik} + ${kj} = ${show(f.via)} < ${show(f.before)}. Going through ${k} is shorter, so dist[${i}][${j}] = ${show(f.via)}.`;
      case 'keep':
        return f.via === Infinity
          ? `${i} → ${k} → ${j}: ${ik} + ${kj} = ∞, no path through ${k}. Keep ${show(f.before)}.`
          : `${i} → ${k} → ${j}: ${ik} + ${kj} = ${show(f.via)}, not less than ${show(f.before)}. Keep it.`;
      case 'done':
        return `Done: ${f.comparisons} comparisons, ${f.updates} improvements. Every cell holds a shortest distance, and the diagonal has no negative entry.`;
      case 'negative':
        return `The diagonal is negative for ${f.negative.map((v) => names[v]).join(', ')}: a path from each back to itself has negative weight, so they lie on a negative cycle and their distances are meaningless.`;
    }
  },
  takeaways: [
    'Floyd-Warshall solves all-pairs shortest paths. dist[i][j] starts as the direct edge weight, 0 on the diagonal and ∞ elsewhere.',
    'Phase k allows vertex k as an intermediate stop. After it, dist[i][j] is the shortest path whose middle vertices all come from the first k + 1 vertices. The update is dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).',
    'Three nested loops over V vertices give O(V³) time and O(V²) memory, whatever the number of edges: good for dense or small graphs. The loop over k must be the outermost.',
    'Negative edges are fine. After the last phase, a negative dist[v][v] means v lies on a negative cycle. A next matrix rebuilds each path.',
    'Try it: pick the cell from D to A and step phase by phase with Next k to watch its value fall from ∞ to 3, then load “Negative cycle” and look at the diagonal.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    ['Time', 'O(V³)', 'V phases, each comparing all V² pairs once.'],
    ['Memory', 'O(V²)', 'The distance matrix and the next matrix, updated in place.'],
    [
      'Compared with V runs of Dijkstra',
      'O(V·(V + E) log V)',
      'Better on sparse graphs with non-negative weights; Floyd-Warshall is simpler and wins when E is close to V².',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'On the starting graph, what is the final distance from D to A?',
      answer: 3,
      tolerance: 0,
      hints: ['D has one edge out: D → B of weight −1.', 'Then B → A has weight 4.'],
      solution: 'D → B → A weighs −1 + 4 = 3. It is the only way out of D.',
    },
    {
      type: 'number',
      prompt:
        'On the starting graph, what is dist[B][C] once phase k = A has finished (A is the only allowed stop)?',
      answer: 2,
      tolerance: 0,
      hints: ['The direct edge B → C weighs 3.', 'Through A: B → A is 4 and A → C is −2.'],
      solution: 'min(3, 4 + (−2)) = 2: going through A beats the direct edge.',
    },
    {
      type: 'number',
      prompt: 'How many (i, j) comparisons does Floyd-Warshall make on a graph with 5 vertices?',
      answer: 125,
      unit: 'comparisons',
      tolerance: 0,
      hints: ['Count the loops: k, i and j each run over every vertex.'],
      solution:
        '5 · 5 · 5 = 125: five phases, each comparing all 25 pairs. The edges do not matter.',
    },
    {
      type: 'choice',
      prompt: 'What does dist[i][j] hold right after phase k finishes?',
      options: [
        'The shortest path from i to j with at most k edges.',
        'The shortest path from i to j whose intermediate vertices all come from the first k + 1 vertices.',
        'The shortest path from i to j through k.',
        'The final shortest distance from i to j.',
      ],
      answer: 1,
      hints: ['Phase k adds one more allowed stop; it does not limit the edge count.'],
      solution:
        'Each phase allows one more vertex as a stop in the middle of a path. The edge-count reading describes Bellman-Ford rounds, not Floyd-Warshall phases.',
    },
    {
      type: 'text',
      prompt: 'Give the running time of Floyd-Warshall in Big-O notation.',
      accept: ['O(V^3)', 'O(V³)', 'O(n^3)', 'O(n³)', 'V^3', 'n^3'],
      hints: ['Three nested loops, each over all vertices.'],
      solution: 'O(V³): V phases × V rows × V columns, with O(1) work per comparison.',
    },
  ],
  nextTeaser:
    'Next up: Johnson’s algorithm, which reweights edges so that Dijkstra can solve all pairs on sparse graphs with negative edges.',
};
