/** @typedef {import('$lib/algo-engine/bellman-ford.js').BellmanFordFrame} BellmanFordFrame */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d).replace('-', '−'));

/** A summand: a negative number goes in brackets, as in 1 + (−2). @param {number} d */
const term = (d) => (d < 0 && d !== -Infinity ? `(${show(d)})` : show(d));

export const en = {
  slug: 'bellman-ford',
  topic: 'shortest-paths',
  level: 'Intermediate',
  title: 'Bellman-Ford',
  intro:
    'Bellman-Ford relaxes every edge, round after round. It is slower than Dijkstra, O(V·E), but it allows negative edge weights. It also answers a question Dijkstra cannot: is there a negative cycle reachable from the source, which would make shortest paths meaningless?',
  summary:
    'Watch Bellman-Ford fill a round-by-round table of distance labels and flag a negative cycle in round V.',
  instruction:
    'Step through the rounds and watch the table fill: row i holds the labels after round i. Pick “Negative cycle”, or lower the weight of D → A to 0 or less, to see round V find an edge that can still be relaxed.',
  presetLabel: 'Graph',
  presets: {
    negative: 'Negative edges, no cycle',
    good: 'Same graph, good edge order',
    cycle: 'Negative cycle',
  },
  sourceLabel: 'Source',
  resetGraph: 'Reset graph',
  graphAria:
    'Directed weighted graph; weights may be negative. Each vertex shows its distance label d.',
  edgesTitle: 'Edges, in the order each round relaxes them',
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  noEdges: 'No edges yet. Use Connect to draw one.',
  /** @param {number} max */
  badWeight: (max) =>
    `A weight must be a whole number from −${max} to ${max}. The old weight is kept.`,
  tableTitle: 'Labels after each round',
  /** @param {number} r @param {number} n */
  rowHeader: (r, n) => (r === n ? 'V' : String(r)),
  tableAria:
    'Distance table: one row per round, one column per vertex. Row 0 is the start; row V is the negative-cycle check.',
  /** @param {string} name @param {string} round @param {string} value @param {string} state */
  cellLabel: (name, round, value, state) =>
    [`Round ${round}, ${name}: ${value}`, state].filter(Boolean).join(', '),
  cycleTitle: 'Negative cycle',
  emptyText: 'none found',
  /** @param {number} r @param {number} last */
  roundStat: (r, last) => (r === 0 ? '—' : r > last ? 'V (check)' : `${r} of ${last}`),
  stats: {
    round: 'Round',
    relaxations: 'Edge checks',
    updates: 'Labels lowered',
  },
  legend: {
    tail: 'u, read now',
    write: 'v, label lowered now',
    head: 'v, label kept',
    cycle: 'On the negative cycle',
    changed: 'Changed in that round',
    edgeNow: 'Edge checked now',
    tree: 'Parent edge',
  },
  states: {
    source: 'source',
    tail: 'tail of the edge being checked',
    write: 'label just lowered',
    head: 'label kept',
    cycle: 'on the negative cycle',
    changed: 'changed this round',
    flagged: 'can still be lowered',
  },
  /** @param {number} d */
  dNote: (d) => `d ${show(d)}`,
  show,
  /** @param {string} name @param {number} d @param {string} state */
  vertexLabel: (name, d, state) =>
    [`Vertex ${name}`, `d = ${show(d)}`, state].filter(Boolean).join(', '),
  /**
   * @param {BellmanFordFrame} f
   * @param {string[]} names
   */
  describe(f, names) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const n = names.length;
    const head = `Edge ${u} → ${v} (weight ${show(f.weight)}):`;
    const sum = `${show(f.dist[f.current])} + ${term(f.weight)} = ${show(f.dist[f.current] + f.weight)}`;
    switch (f.kind) {
      case 'start':
        return `Set the source’s label to 0 and every other label to ∞. With ${n} vertices, at most ${Math.max(0, n - 1)} rounds are needed.`;
      case 'round':
        return `Round ${f.round}: relax every edge once, in list order.`;
      case 'improve':
        return `${head} ${sum} < ${show(f.before)}. Lower d[${v}] and set parent[${v}] = ${u}.`;
      case 'keep':
        return f.dist[f.current] === Infinity
          ? `${head} d[${u}] is still ∞, so nothing to do this round.`
          : `${head} ${sum} is not less than ${show(f.before)}. Keep d[${v}].`;
      case 'early':
        return `Round ${f.round} changed nothing, so the next round would not either. Stop early: the labels are final and no negative cycle is reachable.`;
      case 'check':
        return `All ${n - 1} rounds ran and the last one still changed a label. Round V checks every edge once more without changing anything.`;
      case 'ok':
        return `${head} ${sum} is not less than ${show(f.before)}. Fine.`;
      case 'cycle':
        return `${head} ${sum} < ${show(f.before)}: after V − 1 rounds an edge can still be relaxed, so a negative cycle is reachable. Following the parent links finds ${f.cycle.map((i) => names[i]).join(' → ')} → ${names[f.cycle[0]] ?? ''}.`;
      case 'done':
        return f.table.length === n + 1
          ? 'Round V found no edge to relax: the labels are the shortest distances, and no negative cycle is reachable.'
          : `Done after ${f.round} rounds and ${f.relaxations} edge checks: the labels are the shortest distances.`;
    }
  },
  takeaways: [
    'Bellman-Ford relaxes every edge in each round. After round i, every vertex whose shortest path uses at most i edges has its exact label. A shortest path visits each vertex at most once, so it has at most V − 1 edges, and V − 1 rounds are enough.',
    'Negative edge weights are fine, because no label is ever declared final early, unlike in Dijkstra.',
    'Round V is the negative-cycle check: if any edge can still be relaxed, a negative cycle is reachable from the source, and shortest paths through it do not exist (they get cheaper every lap). Parent links lead to the cycle.',
    'A round that changes nothing ends the run early. The edge order decides how many rounds that takes; the shortest-path answer does not depend on it.',
    'Try it: switch between “Negative edges, no cycle” and “Same graph, good edge order” and compare the round count, then set D → A to 0 and watch round V flag a cycle.',
  ],
  complexityHead: ['Case', 'Cost', 'Why'],
  complexity: [
    [
      'Time, worst case',
      'O(V·E)',
      'V − 1 rounds plus the check round, each relaxing all E edges once.',
    ],
    [
      'Time, best case',
      'O(E)',
      'With early stopping, an edge order that follows the shortest paths finishes in one round plus one round with no change.',
    ],
    ['Memory', 'O(V)', 'One label and one parent per vertex (the table is only for the lesson).'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'On “Negative edges, no cycle” from S, in which round does Bellman-Ford stop early (the first round with no change)?',
      answer: 3,
      tolerance: 0,
      hints: [
        'Round 1 sets C to 11 through A, but B → C was relaxed before B had a label.',
        'Round 2 lowers C to 5 through B. What happens in round 3?',
      ],
      solution:
        'Round 1 fills A 6, B 7, C 11, D 4. Round 2 lowers C to 5 via B → C. Round 3 changes nothing, so the run stops after round 3.',
    },
    {
      type: 'number',
      prompt: 'Now pick “Same graph, good edge order”. In which round does it stop early?',
      answer: 2,
      tolerance: 0,
      hints: ['In this order, B → C comes after S → B.'],
      solution:
        'Every edge comes after the edges that set its tail’s label, so round 1 finds every final label and round 2 changes nothing.',
    },
    {
      type: 'number',
      prompt:
        'On the starting graph, what is the smallest whole-number weight for D → A that keeps every cycle non-negative?',
      answer: 1,
      tolerance: 0,
      hints: [
        'List the cycles through D → A: A → B → D → A, A → B → C → D → A and A → C → D → A.',
        'A → B → D → A weighs 2 − 3 + w = w − 1.',
      ],
      solution:
        'The lightest cycle is A → B → D → A with weight w − 1, which is negative exactly when w < 1. The others weigh w + 3 and w + 8. So w = 1 is the smallest safe weight.',
    },
    {
      type: 'text',
      prompt:
        'Pick “Negative cycle” and step to the end. Which cycle does round V report? Type its vertices in order, starting from A.',
      accept: ['A, B, D', 'A B D', 'ABD', 'A → B → D', 'A → B → D → A', 'A->B->D', 'A->B->D->A'],
      hints: ['D → A has weight −1 there.', 'Its total weight is 2 − 3 − 1 = −2.'],
      solution:
        'B → C can still be relaxed in round V. Following parents from C reaches the cycle A → B → D → A, of weight 2 − 3 − 1 = −2.',
    },
    {
      type: 'choice',
      prompt: 'Why are V − 1 rounds enough when there is no negative cycle?',
      options: [
        'Each round fixes one more vertex, smallest label first.',
        'A shortest path has at most V − 1 edges, and round i makes exact every label whose shortest path has at most i edges.',
        'Each edge can lower a label at most once.',
        'The labels are non-negative after V − 1 rounds.',
      ],
      answer: 1,
      hints: ['Think of the edges of one shortest path s → … → v, in order.'],
      solution:
        'Round 1 relaxes the first edge of the path (among others), round 2 the second, and so on. A shortest path never repeats a vertex, so it has at most V − 1 edges.',
    },
  ],
  nextTeaser:
    'Next up: Floyd-Warshall, which finds the shortest paths between every pair of vertices at once.',
};
