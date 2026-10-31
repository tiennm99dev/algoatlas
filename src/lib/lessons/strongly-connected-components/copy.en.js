/** @typedef {import('$lib/algo-engine/strongly-connected-components.js').SccFrame} SccFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);
/** @param {string[]} names @param {number[]} list */
const join = (names, list) => list.map((i) => nm(names, i)).join(', ');
/** 1st, 2nd, 3rd, 4th, …, 11th, 12th, 13th, 21st. @param {number} k */
const ordinal = (k) => {
  const tens = k % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] ?? 'th');
  return `${k}${suffix}`;
};

export const en = {
  slug: 'strongly-connected-components',
  topic: 'advanced-graphs',
  level: 'Intermediate',
  title: 'Strongly connected components',
  intro:
    'In a directed graph, two vertices are strongly connected when each can reach the other. The graph splits into strongly connected components (SCCs): largest groups in which every vertex reaches every other. Collapse each SCC to one vertex and what is left, the condensation, has no cycle at all. Tarjan’s and Kosaraju’s algorithms both find the SCCs in O(V + E).',
  summary:
    'Find the strongly connected components of a directed graph with Tarjan’s low-links or Kosaraju’s two passes, then collapse them into the condensation DAG.',
  instruction:
    'Pick Tarjan or Kosaraju and step through. Tarjan labels each vertex tin/low and pops a component when low equals tin; Kosaraju records finish order, then walks the edges backwards. At the last step the condensation DAG appears under the graph. Use Connect to add an edge such as F → A and watch two components merge.',
  algoLabel: 'Algorithm',
  algos: { tarjan: 'Tarjan (low-link)', kosaraju: 'Kosaraju (two passes)' },
  resetGraph: 'Reset graph',
  graphAria: 'Directed graph whose strongly connected components are found.',
  condensedTitle: 'Condensation DAG',
  condensedAria: 'Condensation: one vertex per strongly connected component.',
  condensedWait:
    'Step to the end: once every vertex has a component, each component collapses to one vertex here.',
  /** @param {number} k @param {number} e */
  condensedSummary: (k, e) =>
    `${k} ${k === 1 ? 'component' : 'components'} and ${e} ${e === 1 ? 'edge' : 'edges'} between them. No cycle is left: every cycle of the graph lies inside one component.`,
  /** @param {number} c */
  compName: (c) => `C${c}`,
  /** @param {number} c @param {string} members */
  compLabel: (c, members) => `Component C${c}: ${members}`,
  stackLabel: 'SCC stack (top first)',
  callLabel: 'Call stack (top first)',
  finishTitle: 'Finish order of pass 1 (first to last)',
  compsLabel: 'Components found',
  emptyText: 'empty',
  hotLabel: 'newest',
  /** @param {number} c @param {string} members */
  compChip: (c, members) => `C${c}: ${members}`,
  stats: {
    comps: 'Components',
    edges: 'Edges examined',
    time: 'Vertices visited',
    pass: 'Pass',
  },
  legend: {
    current: 'Acted on now',
    open: 'On the DFS path or stack',
    waiting: 'Finished, waits on the stack for its root',
    finished: 'Finished in pass 1',
    popped: 'Component just completed',
    done: 'In a component (number at the corner)',
    edge: 'Edge examined now',
    inside: 'Edge inside a component',
  },
  states: {
    current: 'current',
    open: 'on the stack',
    path: 'on the DFS path',
    waiting: 'finished, still on the stack',
    finished: 'finished',
    popped: 'just completed',
  },
  /** @param {number} tin @param {number} low */
  tinLow: (tin, low) => `${tin}/${low}`,
  /** @param {number} k */
  finishNote: (k) => `fin ${k}`,
  /** @param {number} tin @param {number} low */
  tinLowLabel: (tin, low) => `tin ${tin}, low ${low}`,
  /** @param {number} k */
  finishLabel: (k) => `finished ${ordinal(k)}`,
  /** @param {string} name @param {string} state @param {string} detail @param {number} comp */
  vertexLabel: (name, state, detail, comp) =>
    [`Vertex ${name}`, state, detail, comp > 0 ? `component C${comp}` : '']
      .filter(Boolean)
      .join(', '),
  /**
   * @param {SccFrame} f
   * @param {string[]} names
   * @param {'tarjan' | 'kosaraju'} algo
   */
  describe(f, names, algo) {
    const u = nm(names, f.current);
    const v = nm(names, f.other);
    switch (f.kind) {
      case 'start':
        return algo === 'tarjan'
          ? 'Every vertex starts unvisited. Run one DFS in letter order, giving each vertex its discovery time tin and a low-link low.'
          : 'Pass 1: run a DFS in letter order and write each vertex down when it finishes.';
      case 'enter':
        if (algo === 'kosaraju' && f.pass === 2) return `${u} joins component C${f.count}.`;
        return algo === 'tarjan'
          ? `Visit ${u}: tin = low = ${f.tin[f.current]}. Push ${u} on the stack.`
          : `Visit ${u}, the ${ordinal(f.tin[f.current] + 1)} vertex discovered.`;
      case 'edge':
        if (algo === 'kosaraju' && f.pass === 2)
          return f.edgeKind === 'tree'
            ? `Edge ${v} → ${u} runs into ${u}, so in the reversed graph ${u} reaches ${v}: ${v} has no component yet, add it to C${f.count}.`
            : `Edge ${v} → ${u} reversed reaches ${v}, which already has a component. Skip it.`;
        if (f.edgeKind === 'tree') return `Edge ${u} → ${v}: ${v} is unvisited, so visit it.`;
        if (f.edgeKind === 'stack')
          return `Edge ${u} → ${v}: ${v} is still on the stack, so ${u} can climb back to it. low[${u}] = min(low, tin[${v}]) = ${f.low[f.current]}.`;
        return algo === 'tarjan'
          ? `Edge ${u} → ${v}: ${v} already belongs to a finished component, so this edge leaves ${u}’s component. Ignore it.`
          : `Edge ${u} → ${v}: ${v} is already visited. Nothing to do.`;
      case 'return':
        return `Back from ${v} to ${u}: low[${u}] = min(low[${u}], low[${v}]) = ${f.low[f.current]}.`;
      case 'keep':
        return `${u} is done but low[${u}] = ${f.low[f.current]} < tin[${u}] = ${f.tin[f.current]}: it reaches an older vertex on the stack, so ${u} stays there and joins that vertex’s component later.`;
      case 'root':
        return algo === 'tarjan'
          ? `low[${u}] = tin[${u}] = ${f.tin[f.current]}: ${u} is the root of a component. Pop ${join(names, f.popped)} as C${f.count}.`
          : `Component C${f.count} is complete: ${join(names, f.popped)}.`;
      case 'finish':
        return `${u} has no unvisited successor left: it finishes ${ordinal(f.finished.length)}.`;
      case 'transpose':
        return `Pass 1 is over: finish order ${join(names, f.finished)}. Now reverse every edge and take vertices from the last finished back to the first.`;
      case 'seed':
        return `${u} finished latest among the vertices left and has no component: start C${f.count} from it.`;
      case 'skip':
        return `${u} already has a component. Skip it.`;
      case 'done':
        return `Done: ${f.count} ${f.count === 1 ? 'component' : 'components'}. ${
          algo === 'tarjan'
            ? 'Tarjan found them sinks first, the reverse of a topological order of the condensation.'
            : 'Kosaraju found them sources first, in a topological order of the condensation.'
        }`;
    }
  },
  takeaways: [
    'An SCC is a largest set of vertices that all reach each other. Every vertex is in exactly one SCC, and every directed cycle lies inside one SCC.',
    'Tarjan runs one DFS. low[u] is the smallest tin that u’s subtree reaches through one edge into a vertex still on the stack. When low[u] = tin[u], u is a root and the stack above it is one SCC.',
    'Kosaraju runs two DFS passes: one on the graph for finish times, one on the reversed graph started from the latest-finished vertex left. Each start of pass 2 collects exactly one SCC.',
    'Collapsing each SCC to one vertex gives the condensation, which is always a DAG. Tarjan finds its vertices in reverse topological order, Kosaraju in topological order.',
    'Try it: add the edge F → A. A, B, C, D, E and F now reach each other, so two components merge and the condensation shrinks to two vertices.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    [
      'Time, Tarjan',
      'O(V + E)',
      'One DFS: each vertex is pushed and popped once, each edge is examined once.',
    ],
    [
      'Time, Kosaraju',
      'O(V + E)',
      'Two DFS passes plus building the reversed edge lists, each linear.',
    ],
    [
      'Condensation',
      'O(V + E)',
      'One look at every edge: keep it when its ends are in different SCCs.',
    ],
    [
      'Memory',
      'O(V + E)',
      'tin, low and component per vertex, the stack, and the reversed graph for Kosaraju.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many strongly connected components does the starting graph have?',
      answer: 3,
      unit: 'components',
      hints: ['Look for directed cycles: each cycle sits inside one component.'],
      solution:
        'Three: A → B → C → A, D → E → F → D and G ⇄ H. The edges B → D and G → F only go one way, so they join no components.',
    },
    {
      type: 'number',
      prompt: 'Run Tarjan on the starting graph. What is low[C] when C is done?',
      answer: 0,
      hints: [
        'C is visited third (tin 2) and has the edge C → A.',
        'A is still on the stack then.',
      ],
      solution:
        'A is on the stack with tin 0, so the edge C → A sets low[C] = min(2, 0) = 0. That value travels up to B and A, and A pops A, B, C as one component.',
    },
    {
      type: 'choice',
      prompt: 'Which component does Kosaraju’s second pass collect first on the starting graph?',
      options: ['{A, B, C}', '{D, E, F}', '{G, H}'],
      answer: 2,
      hints: ['Pass 2 starts from the vertex that finished last in pass 1.'],
      solution:
        'Pass 1 finishes C, F, E, D, B, A, H, G. G finished last, and walking reversed edges from G reaches only H, so {G, H} comes first. It is a source of the condensation.',
    },
    {
      type: 'number',
      prompt: 'Add the edge F → A. How many components are left?',
      answer: 2,
      unit: 'components',
      hints: ['Can A now reach F, and F reach A?'],
      solution:
        'A → B → D → E → F → A is a new cycle, so {A, B, C} and {D, E, F} merge into one component of six vertices. With {G, H}, two components remain.',
    },
  ],
  nextTeaser:
    'Next up: bridges and articulation points, the edges and vertices whose loss splits an undirected graph, found with the same tin and low labels.',
};
