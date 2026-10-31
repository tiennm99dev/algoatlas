/** @typedef {import('$lib/algo-engine/eulerian-paths.js').EulerFrame} EulerFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);
/** @param {string[]} names @param {number[]} list */
const join = (names, list) => list.map((i) => nm(names, i)).join(', ');

export const en = {
  slug: 'eulerian-paths',
  topic: 'advanced-graphs',
  level: 'Intermediate',
  title: 'Eulerian paths and circuits',
  intro:
    'An Euler path uses every edge of a graph exactly once; an Euler circuit is one that ends where it started. Euler showed in 1736, with the bridges of Königsberg, that the answer depends only on degrees: a connected graph has an Euler circuit when every degree is even, and an Euler path when exactly two degrees are odd. Hierholzer’s algorithm then draws one in O(V + E).',
  summary:
    'Test the degree conditions, then watch Hierholzer’s algorithm trace every edge once, splicing detour cycles into an Euler path or circuit.',
  instruction:
    'Step through: the pen walks along unused edges until it gets stuck, then backs up, writing vertices onto the route, and starts a detour wherever unused edges remain. Under each vertex is its count of unused edges. Use Delete or Connect to change the graph, for example remove G — E to get an Euler path that is not a circuit.',
  resetGraph: 'Reset graph',
  graphAria: 'Undirected graph in which an Euler path is traced.',
  stackLabel: 'Stack (top last)',
  routeLabel: 'Route, in pop order',
  pathLabel: 'Euler path',
  emptyText: 'empty',
  hotLabel: 'newest',
  startMark: 'S',
  stats: {
    used: 'Edges used',
    odd: 'Odd-degree vertices',
    depth: 'Stack depth',
    detours: 'Detours spliced',
  },
  legend: {
    pen: 'Pen (top of the stack)',
    stack: 'On the stack',
    done: 'On the finished route',
    odd: 'Odd degree',
    trail: 'Edge walked, still on the stack',
    route: 'Edge on the finished route',
    edge: 'Edge just walked or popped',
  },
  states: {
    pen: 'pen is here',
    stack: 'on the stack',
    done: 'on the route',
    odd: 'odd degree',
    start: 'start',
  },
  /** @param {number} d */
  degNote: (d) => `deg ${d}`,
  /** @param {number} k */
  leftNote: (k) => `${k} left`,
  /** @param {string} name @param {string[]} states @param {string} note */
  vertexLabel: (name, states, note) =>
    [`Vertex ${name}`, ...states, note].filter(Boolean).join(', '),
  /** @param {string[]} names @param {number[]} path */
  arrows: (names, path) => path.map((v) => nm(names, v)).join(' → '),
  /**
   * @param {EulerFrame} f
   * @param {string[]} names
   */
  describe(f, names) {
    const u = nm(names, f.current);
    const v = nm(names, f.other);
    switch (f.kind) {
      case 'start':
        return `Count degrees: ${f.odd.length === 0 ? 'every degree is even' : `${f.odd.length} odd (${join(names, f.odd)})`}.`;
      case 'pick':
        return f.circuit
          ? `All degrees are even and the edges are connected, so an Euler circuit exists. Start at ${u}.`
          : `Exactly two odd vertices, ${join(names, f.odd)}: an Euler path exists and must run between them. Start at ${u}.`;
      case 'walk':
        return f.detour
          ? `${u} still has unused edges: start a detour cycle here along ${u} — ${v}. It will be spliced into the route at ${u}.`
          : `Walk ${u} — ${v} and push ${v}. ${f.left[f.current]} unused ${f.left[f.current] === 1 ? 'edge is' : 'edges are'} left at ${u}.`;
      case 'pop':
        return f.stack.length === 0
          ? `${u} has no unused edge: pop it. The stack is empty and every edge is on the route.`
          : `${u} has no unused edge: pop it onto the route. Back up to ${nm(names, f.stack[f.stack.length - 1])}.`;
      case 'done':
        if (f.reason === 'empty') return 'There are no edges to trace. Use Connect to draw some.';
        if (f.reason === 'odd')
          return `${f.odd.length} vertices have odd degree (${join(names, f.odd)}). A path enters and leaves every middle vertex, so only its two ends may be odd: no Euler path exists.`;
        if (f.reason === 'disconnected')
          return 'The degrees pass, but the edges fall into more than one connected piece, so no single walk can use them all.';
        return `Done. Reading the route backwards gives the Euler ${f.circuit ? 'circuit' : 'path'} ${f.path.map((x) => nm(names, x)).join(' → ')}, using all ${f.used} edges once.`;
    }
  },
  takeaways: [
    'Each pass through a vertex uses two of its edges, one in and one out. So a closed walk over every edge needs every degree even, and an open one exactly two odd vertices, its two ends.',
    'For a connected graph (ignoring isolated vertices) the degree test is also enough: an Euler circuit exists when every degree is even, an Euler path when exactly two are odd.',
    'Hierholzer walks until it is stuck, which can only happen where the walk must end. Backing up, it starts a detour at any vertex with unused edges, and that detour is spliced into the route there.',
    'In a directed graph the test becomes in-degree = out-degree at every vertex for a circuit; for a path, one vertex has one more out-edge and another one more in-edge.',
    'Try it: remove G — E. E and G become odd, the pen starts at E and the route ends at G, a path rather than a circuit.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    ['Degree test', 'O(V + E)', 'Count each edge at both ends, then check connectivity once.'],
    [
      'Hierholzer',
      'O(V + E)',
      'Each edge is walked once, and a pointer per vertex skips used edges, never going back.',
    ],
    ['Memory', 'O(V + E)', 'Adjacency lists, a used mark per edge, the stack and the route.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many vertices of the starting graph have odd degree?',
      answer: 0,
      unit: 'vertices',
      hints: ['Read the deg labels on the first step.'],
      solution:
        'C and E have degree 4, every other vertex degree 2. With no odd vertex the graph has an Euler circuit.',
    },
    {
      type: 'text',
      prompt:
        'Step to the end on the starting graph. Which Euler circuit does Hierholzer give? Type the letters separated by commas.',
      accept: ['A, B, C, D, E, F, G, E, C, A', 'ABCDEFGECA', 'A B C D E F G E C A'],
      hints: [
        'The route is written in pop order: A, C, E, G, F, E, D, C, B, A.',
        'Read it backwards.',
      ],
      solution:
        'The pen gets stuck at A after A → B → C → A, detours C → D → E → C, then E → F → G → E. Reversing the pop order A, C, E, G, F, E, D, C, B, A gives A, B, C, D, E, F, G, E, C, A.',
    },
    {
      type: 'number',
      prompt: 'How many detour cycles get spliced in on the starting graph?',
      answer: 2,
      unit: 'detours',
      hints: ['A detour starts each time the walk resumes after a pop.'],
      solution:
        'One at C (C → D → E → C) and one at E (E → F → G → E), as the Detours spliced counter shows.',
    },
    {
      type: 'choice',
      prompt: 'Remove the edge G — E. What happens?',
      options: [
        'No Euler path exists any more.',
        'An Euler path from E to G exists, but no circuit.',
        'The Euler circuit stays, just shorter.',
        'The graph becomes disconnected.',
      ],
      answer: 1,
      hints: ['Which degrees change, and do they become odd?'],
      solution:
        'E drops to degree 3 and G to degree 1: exactly two odd vertices. An Euler path exists, and it must start at one of them and end at the other.',
    },
  ],
  nextTeaser:
    'Next up: 2-SAT, which turns clauses of two literals into an implication graph and solves them with strongly connected components.',
};
