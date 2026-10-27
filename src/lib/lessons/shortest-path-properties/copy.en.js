/** @typedef {import('$lib/algo-engine/shortest-path-properties.js').RelaxFrame} RelaxFrame */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d));

export const en = {
  slug: 'shortest-path-properties',
  topic: 'shortest-paths',
  level: 'Beginner',
  title: 'Weighted graphs and shortest-path properties',
  intro:
    'In a weighted graph every edge has a cost, and the weight of a path is the sum of its edge weights. A shortest path from s to v is a path of least weight; its weight is the distance δ(s, v). Every shortest-path algorithm in this chapter is built from one move, relaxing an edge, and differs only in the order it relaxes them.',
  summary:
    'Relax the edges of a weighted graph in your own order and watch the distance labels fall to the true shortest distances.',
  instruction:
    'Press Relax on an edge, or pick a sequence, then step through. Each relaxation asks whether going through u beats v’s label. Change a weight and the whole sequence runs again. Click a vertex to see its tree path and weight.',
  presetLabel: 'Relaxation order',
  presetPlaceholder: 'Pick an order…',
  presets: {
    path: 'Along the shortest path to D',
    list: 'Edge list once',
    reverse: 'Edge list reversed',
    twice: 'Reversed, twice',
  },
  undo: 'Undo last',
  clear: 'Clear sequence',
  resetWeights: 'Reset weights',
  graphAria: 'Directed weighted graph with source S. Each vertex shows its distance label d.',
  edgesTitle: 'Edges',
  edgeHead: ['Edge', 'Weight', 'Action'],
  relax: 'Relax',
  /** @param {string} name */
  relaxAria: (name) => `Relax edge ${name}`,
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  sequenceTitle: 'Relaxation sequence',
  emptyText: 'empty — press Relax on an edge',
  hotLabel: 'relaxed now',
  stats: {
    relaxations: 'Relaxations',
    updates: 'Labels lowered',
    exact: 'Labels already exact',
  },
  legend: {
    source: 'Source',
    read: 'u read now, or v kept',
    write: 'v, label lowered now',
    exact: 'Label equals true distance',
    edgeNow: 'Edge relaxed now',
    tree: 'Parent edge',
    path: 'Tree path to the picked vertex',
  },
  states: {
    source: 'source',
    read: 'tail of the edge being relaxed',
    write: 'label just lowered',
    unchanged: 'label kept',
    exact: 'exact',
  },
  /** @param {number} d */
  dNote: (d) => `d ${show(d)}`,
  /** @param {string} name @param {number} d @param {string} state */
  vertexLabel: (name, d, state) =>
    [`Vertex ${name}`, `d = ${show(d)}`, state].filter(Boolean).join(', '),
  pathTitle: 'Tree path',
  /** @param {string} name */
  noPath: (name) => `${name} has no parent yet, so no path to it has been found.`,
  /**
   * @param {string} name
   * @param {string[]} path  Vertex names, source first.
   * @param {number[]} weights  Edge weights along the path.
   * @param {number} label  The vertex’s current label.
   * @param {number} truth  The true shortest distance.
   */
  pathText(name, path, weights, label, truth) {
    const total = weights.reduce((a, b) => a + b, 0);
    const sum = weights.length ? `${weights.join(' + ')} = ${total}` : '0';
    const parts = [`${path.join(' → ')}: weight ${sum}.`];
    if (label !== total)
      parts.push(
        `The label d[${name}] = ${show(label)} is still higher: an earlier vertex on the path improved after ${name} was set, so its last edge must be relaxed again.`,
      );
    parts.push(
      label === truth
        ? `That is the true distance δ(S, ${name}) = ${show(truth)}.`
        : `The true distance δ(S, ${name}) is ${show(truth)}, so more relaxations are needed.`,
    );
    return parts.join(' ');
  },
  /** @param {string[]} path @param {number[]} prefix */
  substructure: (path, prefix) =>
    `Optimal substructure: each vertex on this path is reached by the path’s own prefix, of weight ${path.map((v, i) => `${v} ${prefix[i]}`).join(', ')}.`,
  /** @param {number} n */
  opsFull: (n) => `A sequence holds at most ${n} relaxations. Undo or clear first.`,
  /** @param {number} max */
  badWeight: (max) => `A weight must be a whole number from 0 to ${max}. The old weight is kept.`,
  /**
   * @param {RelaxFrame} f
   * @param {string[]} names
   * @param {{from: number, to: number, weight: number} | null} edge  The frame’s edge.
   * @param {number} total  Vertices in the graph.
   */
  describe(f, names, edge, total) {
    switch (f.kind) {
      case 'start':
        return 'Start: d[S] = 0 and every other label is ∞, because no path to it is known yet.';
      case 'relax': {
        if (!edge) return '';
        const u = names[edge.from];
        const v = names[edge.to];
        const head = `Relax ${u} → ${v} (weight ${edge.weight}):`;
        if (f.candidate === Infinity)
          return `${head} d[${u}] is ∞, so going through ${u} gives nothing yet. Order matters.`;
        const sum = `d[${u}] + ${edge.weight} = ${show(f.dist[edge.from])} + ${edge.weight} = ${f.candidate}`;
        return f.improved
          ? `${head} ${sum} < ${show(f.before)}, so lower d[${v}] to ${f.candidate} and set parent[${v}] = ${u}.`
          : `${head} ${sum} is not less than d[${v}] = ${show(f.before)}. Keep the label.`;
      }
      case 'done':
        return f.exact === total
          ? `Done after ${f.relaxations} relaxations: every label is the true shortest distance, and the parent edges form a shortest-path tree.`
          : `Done after ${f.relaxations} relaxations, but only ${f.exact} of ${total} labels are exact. Relax more edges, in a better order.`;
    }
  },
  takeaways: [
    'The weight of a path is the sum of its edge weights. The shortest-path distance δ(s, v) is the least weight of any path from s to v, and ∞ when v is unreachable.',
    'Relaxing u → v tests whether d[u] + w < d[v] and, if so, lowers d[v] and sets parent[v] = u. A label is always the weight of some real path, so it never drops below δ(s, v) and never goes up.',
    'Optimal substructure: every prefix of a shortest path is itself a shortest path. So if the edges of a shortest path are relaxed in path order, the last vertex ends with the exact distance, whatever else is relaxed in between.',
    'Dijkstra, Bellman-Ford, BFS on 0-1 weights and the DAG method all relax edges; they differ only in the order, which decides how many relaxations they need.',
    'Try it: pick “Edge list reversed”, see how few labels are exact, then add relaxations one by one until every label matches the true distance.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['One relaxation', 'O(1)', 'One addition, one comparison, and at most two writes.'],
    [
      'k relaxations',
      'O(k)',
      'The order is the whole algorithm: a good order needs few relaxations, a bad one many.',
    ],
    ['Memory', 'O(V)', 'One distance label and one parent per vertex.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'With the starting weights, what is the weight of the path S → A → C → D? (S → A is 6, A → C is 2, C → D is 1.)',
      answer: 9,
      tolerance: 0,
      hints: ['Add the three edge weights.'],
      solution:
        '6 + 2 + 1 = 9. It is a path to D, but not the shortest: S → B → A → C → D weighs 2 + 3 + 2 + 1 = 8.',
    },
    {
      type: 'number',
      prompt:
        'With the starting weights, pick “Edge list reversed” and step to the end. What is the label d[A]?',
      answer: 6,
      tolerance: 0,
      hints: [
        'In reverse order B → A comes before S → B, so when B → A is relaxed d[B] is still ∞.',
      ],
      solution:
        'Only S → B (d[B] = 2) and S → A (d[A] = 6) help. B → A ran too early, so d[A] stays 6 instead of the true 5.',
    },
    {
      type: 'number',
      prompt:
        'What is the fewest relaxations that can make d[D] exact with the starting weights, starting from fresh labels?',
      answer: 4,
      unit: 'relaxations',
      tolerance: 0,
      hints: [
        'The shortest path to D is S → B → A → C → D.',
        'Each edge of that path must be relaxed, in order.',
      ],
      solution:
        'D’s shortest path has 4 edges. Relaxing them in path order (S → B, B → A, A → C, C → D) makes each label exact in turn, so 4 relaxations suffice. Fewer cannot work: a label of 8 must come from a path of weight 8, and this 4-edge path is the only one.',
    },
    {
      type: 'choice',
      prompt: 'S → B → A → C → D is a shortest path to D. What follows from optimal substructure?',
      options: [
        'S → B → A is a shortest path from S to A.',
        'Every edge on it is the cheapest edge out of its tail.',
        'D has no other path of the same weight.',
        'The path uses the fewest edges possible.',
      ],
      answer: 0,
      hints: ['Suppose a cheaper route to A existed. What would that do to the path to D?'],
      solution:
        'If some path to A were cheaper than S → B → A, swapping it in would give a cheaper path to D, a contradiction. So every prefix of a shortest path is shortest. The other statements need not hold.',
    },
  ],
  nextTeaser:
    'Next up: Dijkstra’s algorithm on a grid, which relaxes edges in order of distance using a priority queue.',
};
