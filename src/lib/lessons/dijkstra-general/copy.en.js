/** @typedef {import('$lib/algo-engine/dijkstra-general.js').DijkstraFrame} DijkstraFrame */
/** @typedef {import('$lib/algo-engine/dijkstra-general.js').HeapEntry} HeapEntry */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d));

export const en = {
  slug: 'dijkstra-general',
  topic: 'shortest-paths',
  level: 'Intermediate',
  title: 'Dijkstra on general graphs',
  intro:
    'On a graph with non-negative edge weights, Dijkstra’s algorithm settles vertices in order of distance from the source. A binary min-heap finds the next closest vertex in O(log V). Instead of updating an entry inside the heap, the usual implementation pushes a fresh entry and skips the old, stale one later: lazy deletion.',
  summary:
    'Run Dijkstra with a binary heap on a graph you draw, and watch lazy deletion leave and skip stale heap entries.',
  instruction:
    'Pick a source and step through. Watch the heap: every shorter route pushes a new (distance, vertex) entry, and the old entry for that vertex goes stale. Draw edges with Connect, or change a weight in the table, to make new stale entries.',
  sourceLabel: 'Source',
  resetGraph: 'Reset graph',
  graphAria: 'Undirected weighted graph. Each vertex shows its distance label d.',
  edgesTitle: 'Edge weights',
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  noEdges: 'No edges yet. Use Connect to draw one.',
  /** @param {number} max */
  badWeight: (max) => `A weight must be a whole number from 0 to ${max}. The old weight is kept.`,
  heapTitle: 'Binary heap (tree view)',
  /** @param {HeapEntry[]} heap @param {string[]} names */
  heapAria: (heap, names) =>
    heap.length
      ? `Binary min-heap of ${heap.length} entries, in array order: ${heap.map((e) => `(${e.d}, ${names[e.v]})`).join(', ')}.`
      : 'The heap is empty.',
  heapArrayTitle: 'Heap array (slot 0 is the minimum)',
  orderTitle: 'Settled, in order',
  emptyText: 'empty',
  hotLabel: 'newest',
  staleTag: 'stale',
  /** @param {HeapEntry} e @param {string[]} names */
  entry: (e, names) => `(${e.d}, ${names[e.v]})`,
  stats: {
    pushes: 'Pushes',
    pops: 'Pops',
    stale: 'Stale entries skipped',
    relaxations: 'Edges examined',
    maxHeap: 'Largest heap size',
  },
  legend: {
    current: 'Being settled or expanded',
    neighbor: 'Neighbour examined',
    queued: 'In the heap, not settled',
    settled: 'Settled (distance final)',
    pushed: 'Entry just pushed',
    stale: 'Stale heap entry',
    edgeNow: 'Edge examined now',
    tree: 'Parent edge',
    order: 'Settle order',
  },
  states: {
    source: 'source',
    current: 'current',
    neighbor: 'neighbour examined',
    queued: 'in the heap',
    settled: 'settled',
  },
  /** @param {number} d */
  dNote: (d) => `d ${show(d)}`,
  /** @param {string} name @param {number} d @param {string} state */
  vertexLabel: (name, d, state) =>
    [`Vertex ${name}`, `d = ${show(d)}`, state].filter(Boolean).join(', '),
  /**
   * @param {DijkstraFrame} f
   * @param {string[]} names
   */
  describe(f, names) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const p = f.popped ? `(${f.popped.d}, ${u})` : '';
    switch (f.kind) {
      case 'start':
        return f.heap.length
          ? `Set dist[${names[f.heap[0].v]}] = 0 and every other label to ∞. Push (0, ${names[f.heap[0].v]}) into the heap.`
          : 'The graph has no vertices.';
      case 'stale':
        return `Pop ${p}, but dist[${u}] is already ${show(f.dist[f.current])}: this entry is stale, left behind when a shorter route was found. Skip it.`;
      case 'settle':
        return `Pop ${p}, the smallest entry, and it matches dist[${u}]. Settle ${u}: no later route can be shorter, because every other entry is at least ${f.popped?.d ?? 0} and weights are not negative.`;
      case 'improve':
        return `Edge ${u} — ${v} (weight ${f.weight}): ${show(f.dist[f.current])} + ${f.weight} = ${f.dist[f.neighbor]} < ${show(f.before)}. Lower dist[${v}] and push (${f.dist[f.neighbor]}, ${v})${f.before === Infinity ? '.' : `; the old (${f.before}, ${v}) stays in the heap, now stale.`}`;
      case 'keep':
        return f.settled[f.neighbor]
          ? `Edge ${u} — ${v} (weight ${f.weight}): ${v} is already settled, so nothing changes.`
          : `Edge ${u} — ${v} (weight ${f.weight}): ${show(f.dist[f.current])} + ${f.weight} = ${show(f.dist[f.current] + f.weight)} is not less than ${show(f.before)}. Keep dist[${v}].`;
      case 'done': {
        const missed = f.settled.filter((s) => !s).length;
        return `The heap is empty. ${f.order.length} vertices settled with ${f.pushes} pushes and ${f.pops} pops, ${f.stale} of them stale.${missed ? ` ${missed} unreachable ${missed === 1 ? 'vertex keeps' : 'vertices keep'} ∞.` : ''}`;
      }
    }
  },
  takeaways: [
    'Dijkstra settles the unsettled vertex with the smallest label. With non-negative weights no later route can undercut it, so its label is final the moment it is popped.',
    'A binary min-heap of (distance, vertex) pairs gives that vertex in O(log V). Each successful relaxation pushes one entry, so there are at most E + 1 pushes and pops (2E + 1 when each undirected edge counts both ways).',
    'Lazy deletion: instead of a decrease-key operation, push a new entry and leave the old one. When a popped entry’s distance is larger than the vertex’s label, it is stale and is skipped.',
    'The total is O((V + E) log V). For a dense graph, scanning an array for the minimum gives O(V²), which can be better.',
    'Try it: change the weight of A — C from 1 to 5 and watch how many stale entries remain, then pick a different source.',
  ],
  complexityHead: ['Version', 'Cost', 'Why'],
  complexity: [
    [
      'Binary heap, lazy deletion',
      'O((V + E) log V)',
      'Every vertex is popped and settled once; every edge may push one entry, and each push or pop costs O(log E) = O(log V).',
    ],
    [
      'Array scan, no heap',
      'O(V²)',
      'V times, scan all labels for the smallest unsettled one; better when E is close to V².',
    ],
    ['Memory', 'O(V + E)', 'Labels and parents, plus up to one heap entry per relaxation.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'On the starting graph from source A, what is the final distance to F?',
      answer: 13,
      tolerance: 0,
      hints: ['Step to the end and read F’s label.', 'The route is A → C → B → D → E → F.'],
      solution: 'A → C → B → D → E → F weighs 1 + 2 + 5 + 2 + 3 = 13.',
    },
    {
      type: 'text',
      prompt: 'On the starting graph from source A, in which order are the vertices settled?',
      accept: ['A, C, B, D, E, F', 'ACBDEF', 'A C B D E F'],
      hints: ['Vertices are settled in order of their final distance: A 0, C 1, B 3, …'],
      solution:
        'Final distances are A 0, C 1, B 3, D 8, E 10, F 13, and Dijkstra settles in increasing distance: A, C, B, D, E, F.',
    },
    {
      type: 'number',
      prompt: 'How many stale entries does the run from A skip?',
      answer: 4,
      unit: 'entries',
      tolerance: 0,
      hints: [
        'An entry goes stale each time a vertex that is already in the heap gets a shorter label.',
      ],
      solution:
        'B improves from 4 to 3, D from 9 to 8, E from 11 to 10, and F from 14 to 13. Each leaves one old entry, so 4 stale pops.',
    },
    {
      type: 'choice',
      prompt: 'Why is the heap version O((V + E) log V)?',
      options: [
        'Every vertex is pushed exactly once.',
        'Each relaxation pushes at most one entry, and each push and pop costs O(log V).',
        'The heap never holds more than log V entries.',
        'Each edge is relaxed log V times.',
      ],
      answer: 1,
      hints: ['Count heap operations, then multiply by the cost of one.'],
      solution:
        'There are at most E + 1 pushes, and as many pops. One heap operation costs O(log(heap size)) = O(log E) = O(log V), since E < V². Settling and scanning edges adds O(V + E).',
    },
    {
      type: 'choice',
      prompt: 'What goes wrong if an edge weight is negative?',
      options: [
        'Nothing: Dijkstra handles any weights.',
        'The heap can no longer compare entries.',
        'A settled vertex might later be reachable more cheaply, so its “final” label can be wrong.',
        'The algorithm never stops.',
      ],
      answer: 2,
      hints: ['Settling assumes that extending a path never makes it cheaper.'],
      solution:
        'Dijkstra fixes a vertex’s label when it is popped, trusting that every other route is at least as long. A negative edge can make a longer-looking route cheaper after the vertex is settled. Bellman-Ford handles negative weights.',
    },
  ],
  nextTeaser:
    'Next up: 0-1 BFS and DAG shortest paths, two special cases that need no heap at all.',
};
