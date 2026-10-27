/** @typedef {import('$lib/algo-engine/practice-shortest-paths.js').SpFrame} SpFrame */
/** @typedef {import('$lib/algo-engine/practice-shortest-paths.js').Algo} Algo */
/** @typedef {import('$lib/algo-engine/practice-shortest-paths.js').Verdict} Verdict */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d).replace('-', '−'));

/** A summand: a negative number goes in brackets, as in 1 + (−2). @param {number} d */
const term = (d) => (d < 0 ? `(${show(d)})` : show(d));

/** @type {Record<Algo, string>} */
const algoNames = { bfs: 'BFS', dijkstra: 'Dijkstra', 'bellman-ford': 'Bellman-Ford' };

export const en = {
  slug: 'practice-shortest-paths',
  topic: 'shortest-paths',
  level: 'Advanced',
  title: 'Practice: shortest-path problems',
  intro:
    'The hard part of a shortest-path problem is often not the algorithm but the choice of it. Equal edge costs call for BFS, non-negative weights for Dijkstra, negative weights for Bellman-Ford. Many puzzles are graphs in disguise too: the vertices are the states of the puzzle and the edges are the moves.',
  summary:
    'Pick BFS, Dijkstra or Bellman-Ford for each scenario, watch your pick run, and see whether its answer is right.',
  instruction:
    'Choose a scenario card, pick an algorithm and step to the end: the verdict says whether the answer is right and which algorithm fits best. The table runs all three on the same graph. Change weights in the edge list, or draw edges, to see a verdict flip.',
  scenarioLabel: 'Scenario',
  scenarios: {
    moves: {
      title: 'Fewest moves',
      story:
        'A counter shows 1. Each move either adds 1 or doubles the number. What is the fewest number of moves to reach 10? Each vertex is a number, each edge a move.',
    },
    roads: {
      title: 'Road trip',
      story:
        'One-way roads with travel times in minutes. What is the quickest way from S to T? The route with the fewest roads is not the quickest one.',
    },
    cashback: {
      title: 'Cashback flight',
      story:
        'Ticket prices between cities, and the flight from B to A pays you 4 back. What is the cheapest trip from S to T?',
    },
    arbitrage: {
      title: 'Trading loop',
      story:
        'The cost of each trade; a negative cost is a profit. What is the cheapest way from S to T? Watch out for a loop that pays every time around.',
    },
  },
  algoLabel: 'Your pick',
  algos: algoNames,
  sourceLabel: 'From',
  targetLabel: 'To',
  resetScenario: 'Reset scenario',
  graphAria: 'Directed weighted graph of the scenario. Each vertex shows its current label d.',
  edgesTitle: 'Edges and weights',
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  noEdges: 'No edges yet. Use Connect to draw one.',
  /** @param {number} max */
  badWeight: (max) =>
    `A weight must be a whole number from −${max} to ${max}. The old weight is kept.`,
  frontierTitle: {
    bfs: 'Queue (front first, number = edges used)',
    dijkstra: 'Priority queue (smallest label first)',
    'bellman-ford': 'Labels d (number = current label)',
  },
  frontierEmpty: 'empty',
  hotLabel: 'just added',
  /** @param {string} name @param {number} d */
  chip: (name, d) => `${name} ${show(d)}`,
  stats: {
    checks: 'Edges looked at',
    taken: 'Vertices taken',
    answer: 'Answer for the target',
  },
  compareTitle: 'All three on this graph',
  compareHead: ['Algorithm', 'Answer', 'Edges looked at'],
  cycleAnswer: 'negative cycle',
  verdictTitle: 'Verdict',
  verdictPending: 'Step to the end of the run to see the verdict.',
  verdicts: {
    best: 'Right answer, and the best fit for this graph.',
    works: 'Right answer, and always right here, but slower than the best fit.',
    lucky:
      'Right answer this time, but only by luck: this algorithm is not guaranteed on this graph.',
    wrong: 'Wrong answer.',
  },
  /**
   * @param {Verdict} v @param {Algo} algo @param {string[]} names @param {number} target
   */
  verdictDetail(v, algo, names, target) {
    const best = `Best fit: ${algoNames[v.best]}.`;
    if (v.negativeCycle)
      return algo === 'bellman-ford'
        ? `A negative cycle is reachable, so shortest paths do not exist, and only Bellman-Ford can say so. ${best}`
        : `A negative cycle is reachable from the source, so no shortest path exists, yet ${algoNames[algo]} still printed numbers. ${best}`;
    const name = names[target] ?? '';
    if (v.verdict === 'wrong')
      return `${algoNames[algo]} says d(${name}) = ${show(v.got[target])}, but the shortest distance is ${show(v.truth[target])}. ${best}`;
    return `d(${name}) = ${show(v.truth[target] ?? Infinity)}, after looking at ${v.checks} edges. ${best}`;
  },
  legend: {
    taken: 'Taken or settled',
    current: 'u, taken or read now',
    write: 'v, label lowered now',
    cycle: 'On the negative cycle',
    target: 'Target',
    edgeNow: 'Edge looked at now',
    tree: 'Parent edge',
  },
  states: {
    source: 'source',
    target: 'target',
    taken: 'taken',
    current: 'read now',
    write: 'label lowered now',
    cycle: 'on the negative cycle',
  },
  /** @param {number} d */
  dNote: (d) => `d ${show(d)}`,
  show,
  /** @param {string} name @param {number} d @param {string} state */
  vertexLabel: (name, d, state) =>
    [`Vertex ${name}`, `d = ${show(d)}`, state].filter(Boolean).join(', '),
  /**
   * @param {SpFrame} f
   * @param {string[]} names
   * @param {Algo} algo
   */
  describe(f, names, algo) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const head = `Edge ${u} → ${v} (weight ${show(f.weight)})`;
    const sum = `${show(f.dist[f.current])} + ${term(f.weight)} = ${show(f.dist[f.current] + f.weight)}`;
    switch (f.kind) {
      case 'start':
        return algo === 'bfs'
          ? 'BFS: put the source in the queue. It will count edges and ignore the weights while it searches.'
          : algo === 'dijkstra'
            ? 'Dijkstra: the source gets label 0, every other vertex ∞.'
            : `Bellman-Ford: the source gets label 0, every other vertex ∞. At most ${Math.max(0, names.length - 1)} rounds.`;
      case 'take':
        return algo === 'bfs'
          ? `Dequeue ${u}, ${f.hops[f.current]} edges from the source.`
          : `Settle ${u} at d = ${show(f.dist[f.current])}, the smallest label left. It will never change again.`;
      case 'skip':
        return `Pop an old entry for ${u} (${show(f.before)}): ${u} is already settled, skip it.`;
      case 'relax':
        return algo === 'bfs'
          ? `${head}: ${v} is new. It is ${f.hops[f.neighbor]} edges away, and this path costs ${sum}.`
          : `${head}: ${sum} < ${show(f.before)}. Lower d[${v}].`;
      case 'keep':
        return algo === 'bfs'
          ? `${head}: ${v} was already seen, so BFS ignores this edge, whatever its weight.`
          : `${head}: ${sum} is not less than ${show(f.before)}. Keep d[${v}].`;
      case 'round':
        return `Round ${f.round}: relax every edge once, in list order.`;
      case 'early':
        return `Round ${f.round} changed nothing, so the labels are final and no negative cycle is reachable.`;
      case 'cycle':
        return `${head}: ${sum} < ${show(f.before)} even after V − 1 rounds. A negative cycle is reachable: ${f.cycle.map((i) => names[i]).join(' → ')} → ${names[f.cycle[0]] ?? ''}.`;
      case 'done':
        if (f.cycle.length)
          return 'Stopped: going round the negative cycle again always makes a path cheaper, so no shortest path exists.';
        return `Done after looking at ${f.checks} edges.`;
    }
  },
  takeaways: [
    'Every edge costs the same: BFS. Weights that are non-negative: Dijkstra. Any negative weight: Bellman-Ford, which also detects a negative cycle.',
    'Picking a slower but still correct algorithm costs time; picking one whose assumption fails gives wrong answers. BFS ignores weights, and Dijkstra settles a vertex before a negative edge can lower it.',
    'Puzzles hide graphs: make each state a vertex and each move an edge. Fewest moves is then a BFS; moves with different costs make it a Dijkstra.',
    'Beyond single source: all pairs on a small or dense graph is Floyd-Warshall; on a sparse graph with negative edges, Johnson. Weights of only 0 and 1: 0-1 BFS. A grid with a good distance estimate: A*.',
    'Try it: on Fewest moves, make the jump 5 → 10 cost 3. BFS still answers 6 through it, while Dijkstra finds the 5-move route that is now cheaper.',
  ],
  complexityHead: ['Algorithm', 'Cost', 'Use it when'],
  complexity: [
    ['BFS', 'O(V + E)', 'Every edge has the same cost; also state-space puzzles counted in moves.'],
    ['0-1 BFS', 'O(V + E)', 'Every weight is 0 or 1.'],
    ['Dijkstra (binary heap)', 'O((V + E) log V)', 'Weights are non-negative.'],
    ['Bellman-Ford', 'O(V·E)', 'Some weights are negative, or a negative cycle must be detected.'],
    ['Floyd-Warshall', 'O(V³)', 'All pairs on a small or dense graph.'],
    ['Johnson', 'O(V·E log V)', 'All pairs on a sparse graph with negative edges.'],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Fewest moves: how many moves does it take to turn 1 into 10?',
      answer: 4,
      unit: 'moves',
      tolerance: 0,
      hints: [
        'Pick BFS: every move costs the same, so the fewest edges is the answer.',
        'Read the label of vertex 10 at the end of the run.',
      ],
      solution: '1 → 2 → 4 → 5 → 10: double, double, add 1, double. BFS labels 10 with 4.',
    },
    {
      type: 'number',
      prompt: 'Road trip: pick BFS. How many minutes does the route it finds to T take?',
      answer: 12,
      unit: 'minutes',
      tolerance: 0,
      hints: ['BFS takes the route with the fewest roads: S → A → T.'],
      solution:
        'BFS reaches T through A in two roads, 4 + 8 = 12 minutes. Dijkstra finds S → B → A → C → D → T, which takes 8.',
    },
    {
      type: 'number',
      prompt:
        'Road trip: how many edges does Bellman-Ford look at in total, the round with no change included?',
      answer: 16,
      unit: 'edges',
      tolerance: 0,
      hints: [
        'Read the “Edges looked at” column of the table.',
        'With this edge order, round 1 finds every final label and round 2 confirms it.',
      ],
      solution:
        'Two rounds over 8 edges: 16. Dijkstra looks at only 8 here, which is why it is the better fit.',
    },
    {
      type: 'number',
      prompt: 'Cashback flight: pick Dijkstra. What price does it report for T?',
      answer: 7,
      tolerance: 0,
      hints: [
        'Dijkstra settles A at 2 before it settles B at 5.',
        'When it looks at B → A, A is already settled and is skipped.',
      ],
      solution:
        'Dijkstra reports 7 through S → A → C → T. The cheapest trip is S → B → A → C → T: 5 − 4 + 2 + 3 = 6, which Bellman-Ford finds.',
    },
    {
      type: 'text',
      prompt:
        'Trading loop: pick Bellman-Ford and step to the end. Which cycle does it report? Type its vertices in order, starting from A.',
      accept: [
        'A, B, C',
        'A, B, C, A',
        'A B C',
        'A B C A',
        'ABC',
        'ABCA',
        'A → B → C',
        'A → B → C → A',
        'A→B→C',
        'A→B→C→A',
        'A->B->C',
        'A->B->C->A',
        'A-B-C',
        'A-B-C-A',
      ],
      hints: ['Its weights add up to 2 + (−3) + (−1).'],
      solution:
        'A → B → C → A weighs 2 − 3 − 1 = −2. Every lap makes a path cheaper, so no shortest path to A, B, C or T exists.',
    },
    {
      type: 'multi',
      prompt: 'Road trip: which picks give the right answer? Select all that apply.',
      options: ['BFS', 'Dijkstra', 'Bellman-Ford'],
      answers: [1, 2],
      hints: ['Run each one and read the verdict.'],
      solution:
        'Dijkstra and Bellman-Ford are both right, since no weight is negative. Dijkstra is the better fit; BFS is wrong because the weights differ.',
    },
    {
      type: 'choice',
      prompt:
        'A maze where stepping onto a normal tile costs 1 and sliding onto ice costs 0. Which algorithm fits best?',
      options: ['BFS', '0-1 BFS', 'Bellman-Ford', 'Floyd-Warshall'],
      answer: 1,
      hints: ['There are only two edge weights, and one of them is 0.'],
      solution:
        '0-1 BFS: push 0-edges to the front of a deque and 1-edges to the back. It runs in O(V + E). Plain BFS would count the ice steps as moves.',
    },
    {
      type: 'choice',
      prompt:
        'You need the distance between every pair of 200 stations, with all 40,000 connections known and some negative. No negative cycle exists. Which fits best?',
      options: ['Dijkstra from every station', 'Floyd-Warshall', 'BFS from every station', 'A*'],
      answer: 1,
      hints: ['All pairs, a dense graph, negative weights.'],
      solution:
        'Floyd-Warshall: all pairs in O(V³) with three short loops, and negative weights are fine. Dijkstra breaks on negative weights; on a dense graph Johnson brings no gain over Floyd-Warshall.',
    },
  ],
  nextTeaser:
    'Next up: Disjoint set union, a structure that tracks which items belong together as groups merge.',
};
