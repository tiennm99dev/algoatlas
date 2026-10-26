/** @typedef {import('$lib/algo-engine/topological-sort.js').TopoFrame} TopoFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);
/** @param {string[]} names @param {number[]} list */
const join = (names, list) => list.map((i) => nm(names, i)).join(', ');

export const en = {
  slug: 'topological-sort',
  topic: 'graphs',
  level: 'Intermediate',
  title: 'Topological sort',
  intro:
    'A directed acyclic graph (DAG) can model tasks and their dependencies: an edge u → v says u must happen before v. A topological order lists every vertex so that all edges point forward. It exists exactly when the graph has no directed cycle, and two classic algorithms find one in O(V + E): Kahn’s algorithm and the reversed DFS finish order.',
  summary:
    'Order the tasks of a dependency graph with Kahn’s algorithm or the reversed DFS finish order, and see how both detect a cycle.',
  instruction:
    'Pick Kahn or DFS and step through. Kahn peels off a task whose in-degree has dropped to 0; DFS dives along the edges and writes a task down once everything after it is finished. Use Connect to add an edge such as G → A and watch both methods report the cycle.',
  algoLabel: 'Method',
  algos: { kahn: 'Kahn (in-degree)', dfs: 'DFS finish order' },
  resetGraph: 'Reset graph',
  graphAria: 'Task dependency graph; an edge u to v means u comes before v.',
  tasksTitle: 'Tasks',
  /** Task names for the starting graph, by vertex id. */
  tasks: [
    'buy food',
    'wash vegetables',
    'chop vegetables',
    'boil water',
    'cook pasta',
    'make sauce',
    'serve dinner',
  ],
  queueLabel: 'Queue (front first)',
  stackLabel: 'Call stack (top first)',
  orderLabel: 'Order so far',
  finishLabel: 'Finished (first to last)',
  resultLabel: 'Topological order',
  emptyText: 'empty',
  hotLabel: 'newest',
  stats: {
    placed: 'Vertices placed',
    edges: 'Edges examined',
    backward: 'Edges pointing back',
  },
  legend: {
    current: 'Acted on now',
    pending: 'Queued or in progress',
    done: 'Placed or finished',
    cycle: 'Cycle',
    stuck: 'Never placed',
    edgeDone: 'Edge already used',
  },
  states: {
    current: 'current',
    queued: 'queued',
    inProgress: 'in progress',
    placed: 'placed',
    finished: 'finished',
    cycle: 'on the cycle',
    stuck: 'never placed',
  },
  /** @param {number} d */
  inNote: (d) => `in ${d}`,
  /** @param {number} k */
  finishNote: (k) => `done ${k}`,
  /** @param {string} name @param {string} state @param {string} note */
  vertexLabel: (name, state, note) => [`Task ${name}`, state, note].filter(Boolean).join(', '),
  /**
   * @param {TopoFrame} f
   * @param {string[]} names
   * @param {'kahn' | 'dfs'} algo
   * @param {{from: number, to: number} | null} edge  The frame's edge, as vertex indices.
   */
  describe(f, names, algo, edge) {
    const u = nm(names, f.current);
    const v = edge ? nm(names, edge.to) : '';
    switch (f.kind) {
      case 'start':
        return algo === 'kahn'
          ? `Count the edges into each task: ${names.map((n, i) => `${n} ${f.indeg[i]}`).join(', ')}.`
          : 'Every task starts unvisited. Visit them in letter order.';
      case 'seed':
        return f.pending.length
          ? `Tasks with in-degree 0 need nothing first: queue ${join(names, f.pending)}.`
          : 'No task has in-degree 0, so every task waits on another: there must be a cycle.';
      case 'take':
        return `Dequeue ${u} and place it at position ${f.order.length}.`;
      case 'relax':
        return f.ready
          ? `Remove ${u} → ${v}: ${v} now has in-degree 0, so enqueue it.`
          : `Remove ${u} → ${v}: ${v} still waits on ${edge ? f.indeg[edge.to] : 0} more.`;
      case 'enter':
        return `Visit ${u}: mark it in progress.`;
      case 'edge':
        if (f.edgeKind === 'back')
          return `Edge ${u} → ${v} leads back to ${v}, which is still in progress: a back edge, so there is a cycle.`;
        if (f.edgeKind === 'finished')
          return `Edge ${u} → ${v}: ${v} is already finished, so it will come after ${u}. Nothing to do.`;
        return `Edge ${u} → ${v}: ${v} is unvisited, so visit it first.`;
      case 'finish':
        return `Everything after ${u} is finished, so finish ${u} (number ${f.order.length}).`;
      case 'done':
        return algo === 'kahn'
          ? `Done. Order: ${join(names, f.result)}. Every edge points forward.`
          : `Done. Reverse the finish order: ${join(names, f.result)}. Every edge points forward.`;
      case 'cycle':
        return algo === 'kahn'
          ? `The queue is empty but ${join(names, f.cycle)} were never placed: each still waits on another, so they lie on or behind a cycle. No topological order exists.`
          : `Cycle ${join(names, f.cycle)} → ${nm(names, f.cycle[0])}: no topological order exists.`;
    }
  },
  takeaways: [
    'A topological order puts every vertex before all the vertices its edges point to. It exists exactly when the directed graph has no cycle, that is, when it is a DAG.',
    'Kahn’s algorithm keeps the in-degree of every vertex. A vertex with in-degree 0 depends on nothing left, so it can go next; removing it lowers the in-degree of its successors.',
    'The DFS method finishes a vertex only after everything reachable from it has finished, so the reversed finish order is a topological order.',
    'Both detect cycles: Kahn’s ends with vertices never placed, and DFS meets an edge into a vertex still in progress (a back edge). A DAG usually has many valid orders.',
    'Try it: compare the orders Kahn and DFS give for the same graph, then add the edge G → A and watch each method report the cycle.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    [
      'Time, Kahn',
      'O(V + E)',
      'Each vertex is queued and placed once; each edge lowers one in-degree once.',
    ],
    [
      'Time, DFS',
      'O(V + E)',
      'Each vertex is visited once and each edge is examined once, from its tail.',
    ],
    ['Memory', 'O(V)', 'In-degrees or visit marks, plus a queue or a call stack of at most V.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt:
        'Run Kahn on the starting graph. Type the topological order it gives, as letters separated by commas.',
      accept: ['A, D, B, E, C, F, G', 'ADBECFG', 'A D B E C F G'],
      hints: [
        'The queue starts with A and D, the two tasks nothing points to.',
        'After A and D are placed, B and E reach in-degree 0, in that order.',
      ],
      solution:
        'Queue A, D. Place A: B drops to 0 (queued), E to 1. Place D: E drops to 0. Place B: C is queued. Place E: G drops to 1. Place C: F is queued. Place F: G drops to 0. Place G. Order: A, D, B, E, C, F, G.',
    },
    {
      type: 'text',
      prompt: 'Now switch to DFS. Which order does the reversed finish order give?',
      accept: ['D, A, E, B, C, F, G', 'DAEBCFG', 'D A E B C F G'],
      hints: [
        'DFS from A dives A → B → C → F → G, so G finishes first.',
        'Finish order: G, F, C, B, E, A, D. Reverse it.',
      ],
      solution:
        'The finish order is G, F, C, B, E, A, D; reversed it is D, A, E, B, C, F, G. It differs from Kahn’s order, yet every edge still points forward.',
    },
    {
      type: 'multi',
      prompt:
        'For the starting graph, which of these are valid topological orders? (A buy, B wash, C chop, D boil, E pasta, F sauce, G serve.)',
      options: [
        'A, B, C, F, D, E, G',
        'D, A, B, C, E, F, G',
        'A, B, D, E, G, C, F',
        'B, A, C, D, E, F, G',
      ],
      answers: [0, 1],
      hints: [
        'Check each edge: A → B, B → C, C → F, A → E, D → E, E → G, F → G.',
        'G must come last, and B must come after A.',
      ],
      solution:
        'The first two respect every edge. The third puts G before F, breaking F → G. The fourth puts B before A, breaking A → B.',
    },
    {
      type: 'choice',
      prompt: 'Kahn’s algorithm stops with 3 of 7 vertices never placed. What does that tell you?',
      options: [
        'The graph is disconnected.',
        'The graph has a directed cycle.',
        'Those 3 vertices have no edges.',
        'The queue was too small.',
      ],
      answer: 1,
      hints: ['A vertex is never placed only while its in-degree stays above 0.'],
      solution:
        'Each unplaced vertex still has an incoming edge from another unplaced vertex. Walking those edges backwards among finitely many vertices must repeat one, which is a directed cycle.',
    },
  ],
  nextTeaser:
    'Next up: bipartite check and cycle detection, two-colouring a graph and finding the cycles that break it.',
};
