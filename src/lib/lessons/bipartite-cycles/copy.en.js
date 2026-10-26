/** @typedef {import('$lib/algo-engine/bipartite-cycles.js').TwoColourFrame} TwoColourFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);
/** @param {string[]} names @param {number[]} list */
const join = (names, list) => list.map((i) => nm(names, i)).join(', ');

export const en = {
  slug: 'bipartite-cycles',
  topic: 'graphs',
  level: 'Intermediate',
  title: 'Bipartite check and cycle detection',
  intro:
    'A graph is bipartite when its vertices split into two sides with every edge crossing between them, like students and the clubs they join. A BFS can try to two-colour the graph, and it fails exactly when the graph has a cycle of odd length. The same search ideas detect cycles, but what counts as a cycle depends on whether the edges are directed.',
  summary:
    'Two-colour a graph with BFS until an odd cycle stops it, and detect cycles with DFS in undirected and directed graphs.',
  instruction:
    'Pick a check and a preset graph, or edit the graph yourself with the tools under it. Step through: the two-colouring gives each neighbour the other colour until an edge joins two vertices of the same colour, then shows the odd cycle. The cycle checks walk with DFS and stop at the first edge that closes a cycle.',
  modeLabel: 'Check',
  modes: {
    bipartite: 'Two-colour (BFS)',
    undirected: 'Cycle, undirected',
    directed: 'Cycle, directed',
  },
  presetLabel: 'Graph',
  presets: {
    odd: 'Odd cycle',
    even: 'Even cycle',
    diamond: 'Diamond',
    tree: 'Tree',
  },
  graphAria: 'Input graph.',
  queueLabel: 'Queue (front first)',
  stackLabel: 'Call stack (top first)',
  emptyText: 'empty',
  stats: {
    checks: 'Edge checks',
    reached: 'Vertices reached',
    sides: 'Side 1 | side 2',
    result: 'Result',
  },
  results: {
    running: 'running…',
    bipartite: 'bipartite',
    /** @param {number} k */
    oddCycle: (k) => `odd cycle of ${k}`,
    /** @param {number} k */
    cycle: (k) => `cycle of ${k}`,
    acyclic: 'no cycle',
  },
  legend: {
    current: 'Acted on now',
    side1: 'Side 1',
    side2: 'Side 2',
    inProgress: 'In progress (on the stack)',
    finished: 'Finished',
    cycle: 'Cycle found',
    treeEdge: 'Edge that reached a new vertex',
    checkedEdge: 'Edge checked, nothing new',
  },
  states: {
    current: 'current',
    side1: 'side 1',
    side2: 'side 2',
    inProgress: 'in progress',
    finished: 'finished',
    visited: 'visited',
    cycle: 'on the cycle',
  },
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Vertex ${name}`, state].filter(Boolean).join(', '),
  /** @param {TwoColourFrame} f @param {string[]} names @param {'bipartite'|'undirected'|'directed'} mode */
  describe(f, names, mode) {
    const u = nm(names, f.current);
    const v = nm(names, f.other);
    const arrow = mode === 'directed' ? '→' : '–';
    switch (f.kind) {
      case 'start':
        return mode === 'bipartite'
          ? 'No vertex has a colour yet.'
          : 'Every vertex starts unvisited. Start a DFS from each one still unvisited.';
      case 'seed':
        return `${u} has no colour: give it colour 1 and start a BFS from it.`;
      case 'dequeue':
        return `Dequeue ${u} (colour ${f.colour[f.current]}) and check its neighbours.`;
      case 'colour':
        return `${v} has no colour, so it gets the other colour, ${f.colour[f.other]}.`;
      case 'agree':
        return `${v} already has colour ${f.colour[f.other]}, different from ${u}. Fine.`;
      case 'conflict':
        return `${u} and ${v} both have colour ${f.colour[f.current]}, but an edge joins them. Odd cycle ${join(names, f.cycle)}: the graph is not bipartite.`;
      case 'enter':
        return `Visit ${u}.`;
      case 'edge':
        if (f.edgeKind === 'parent')
          return `${u} – ${v} is the edge we arrived along, not a cycle. Skip it.`;
        if (f.edgeKind === 'back')
          return mode === 'directed'
            ? `Edge ${u} → ${v} leads to ${v}, which is still in progress: a back edge.`
            : `${v} is already visited and is not ${u}’s parent: the edge ${u} – ${v} closes a cycle.`;
        if (f.edgeKind === 'finished')
          return `Edge ${u} → ${v}: ${v} is finished, so every path from it is explored and none leads back. No cycle here.`;
        return `Edge ${u} ${arrow} ${v}: ${v} is unvisited, so visit it.`;
      case 'finish':
        return mode === 'directed'
          ? `All edges out of ${u} are explored: mark ${u} finished.`
          : `${u} has no more neighbours: go back.`;
      case 'cycle':
        return `Cycle ${join(names, f.cycle)} ${arrow} ${nm(names, f.cycle[0])}.`;
      case 'done':
        if (mode === 'bipartite') {
          const one = f.colour.flatMap((c, i) => (c === 1 ? [i] : []));
          const two = f.colour.flatMap((c, i) => (c === 2 ? [i] : []));
          return `Bipartite. Side 1: ${join(names, one) || 'none'}. Side 2: ${join(names, two) || 'none'}.`;
        }
        return mode === 'directed'
          ? 'No back edge anywhere: the directed graph has no cycle, so it is a DAG.'
          : 'No edge closed a cycle: the graph is a forest.';
    }
  },
  takeaways: [
    'A graph is bipartite exactly when it can be two-coloured so every edge joins different colours, and exactly when it has no cycle of odd length.',
    'BFS colours each new neighbour with the other colour. An edge between two vertices of the same colour proves an odd cycle: the two BFS tree paths to their common ancestor plus that edge.',
    'In an undirected graph, DFS finds a cycle when it meets a visited vertex that is not the parent it came from.',
    'In a directed graph, only a back edge, into a vertex still in progress, closes a cycle. An edge into a finished vertex does not: the diamond A → B → D, A → C → D has no directed cycle.',
    'Try it: load the Diamond and compare the two cycle checks, then load the Odd cycle and delete one of its edges to make it bipartite.',
  ],
  complexityHead: ['Check', 'Cost', 'Why'],
  complexity: [
    [
      'Two-colouring (BFS)',
      'O(V + E)',
      'Each vertex is queued once and each edge is checked from both ends.',
    ],
    [
      'Cycle check, undirected',
      'O(V)',
      'It stops at the first non-tree edge, and a forest has fewer than V edges, so it examines O(V) edges.',
    ],
    [
      'Cycle check, directed',
      'O(V + E)',
      'Each vertex is visited once and each edge is examined once from its tail.',
    ],
    ['Memory', 'O(V)', 'A colour or state per vertex, plus a queue or a call stack.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Load the Odd cycle and run the two-colouring. How many vertices lie on the odd cycle it reports?',
      answer: 5,
      unit: 'vertices',
      hints: ['Step to the end and count the vertices named in the narration.'],
      solution:
        'C and D both get colour 1, and the edge C – D joins them. The tree paths A, B, C and A, E, D plus that edge give the cycle A, B, C, D, E of length 5.',
    },
    {
      type: 'multi',
      prompt: 'Which of these graphs are bipartite?',
      options: ['A cycle of 6 vertices', 'A triangle', 'Any tree', 'A square with one diagonal'],
      answers: [0, 2],
      hints: ['Look for a cycle of odd length.', 'A diagonal splits a square into two triangles.'],
      solution:
        'An even cycle and any tree (no cycles at all) can be two-coloured. A triangle is an odd cycle, and a square with a diagonal contains two triangles.',
    },
    {
      type: 'choice',
      prompt: 'Load the Diamond. Which statement matches what the two cycle checks report?',
      options: [
        'Both report a cycle.',
        'Undirected finds a cycle; directed finds none.',
        'Directed finds a cycle; undirected finds none.',
        'Neither finds a cycle.',
      ],
      answer: 1,
      hints: [
        'In the directed check, what state is D in when the search reaches it the second time?',
      ],
      solution:
        'Undirected, A – B – D – C – A is a cycle. Directed, D is already finished when C → D is examined, so that edge is not a back edge, and no path leads back to A.',
    },
    {
      type: 'number',
      prompt:
        'Load the Even cycle and run the two-colouring. How many edge checks does it make in total?',
      answer: 14,
      unit: 'checks',
      hints: [
        'The graph has 7 edges and is bipartite, so the BFS never stops early.',
        'Every edge is checked once from each end.',
      ],
      solution:
        'The hexagon has 6 edges plus the chord A – D, so 7 edges, each checked from both ends: 14.',
    },
  ],
  nextTeaser:
    'Next up: practice traversal problems, choosing BFS or DFS for grid puzzles and running BFS from many sources at once.',
};
