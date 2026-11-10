/** @typedef {import('$lib/algo-engine/edmonds-karp-dinic.js').PhaseFrame} PhaseFrame */
/** @typedef {import('$lib/algo-engine/edmonds-karp-dinic.js').FlowMethod} FlowMethod */
/** @typedef {import('$lib/algo-engine/ford-fulkerson.js').PathArc} PathArc */

/**
 * A path as vertex names joined by arrows; a backward step is drawn ⇠.
 * @param {PathArc[]} path @param {string[]} names
 */
const route = (path, names) =>
  path.length
    ? [names[path[0].from], ...path.map((a) => `${a.forward ? '→' : '⇠'} ${names[a.to]}`)].join(' ')
    : '';

/** @param {number} n @param {string} word */
const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const en = {
  slug: 'edmonds-karp-dinic',
  topic: 'flows',
  level: 'Advanced',
  title: 'Edmonds-Karp and Dinic',
  intro:
    'Ford-Fulkerson works with any augmenting path, but a poor choice can make it push a tiny amount per round. Edmonds-Karp always takes a shortest path, found by breadth-first search, which caps the number of rounds at O(V·E) whatever the capacities. Dinic goes further: one BFS builds a level graph, and depth-first search pushes a whole blocking flow through it before the next BFS.',
  summary:
    'Compare Edmonds-Karp’s shortest augmenting paths with Dinic’s level graphs and blocking flows on the same network.',
  instruction:
    'Pick Edmonds-Karp, step through and count the BFS runs; then switch to Dinic on the same network. In Dinic, the faded arcs are outside the level graph, “L2” notes give each vertex’s level, and grey vertices are dead ends for the current phase.',
  methodLabel: 'Algorithm',
  methods: { ek: 'Edmonds-Karp', dinic: 'Dinic' },
  presetLabel: 'Network',
  presets: {
    classic: 'Textbook network',
    layers: 'Layered network',
    zigzag: 'Zigzag trap',
  },
  sourceLabel: 'Source s',
  sinkLabel: 'Sink t',
  viewLabel: 'View',
  views: { residual: 'Residual and levels', flow: 'Flow / capacity' },
  resetGraph: 'Reset network',
  editTitle: 'Edit the network',
  editor: {
    graphAria: 'Network editor: a directed graph whose edge weights are the capacities.',
    edgesTitle: 'Capacities',
    noEdges: 'No edges yet. Use Connect to draw one.',
    /** @param {string} name */
    capacityAria: (name) => `Capacity of edge ${name}`,
  },
  /** @param {number} max */
  badCapacity: (max) =>
    `A capacity must be a whole number from 1 to ${max}. The old capacity is kept.`,
  /** @param {number} max */
  clipped: (max) => `Capacities above ${max} are cut down to ${max}.`,
  sameEnds: 'The source and the sink must be different vertices. The old choice is kept.',
  boardAria: {
    residual:
      'Residual graph with BFS levels. Solid arcs have room c − f, dashed arcs cancel flow; arcs outside the level graph are faded.',
    flow: 'Flow network. Each edge shows flow / capacity.',
  },
  /** @param {number} level */
  levelNote: (level) => (level < 0 ? 'L ∞' : `L${level}`),
  /** @param {string} name @param {number} level @param {string} state */
  vertexLabel: (name, level, state) =>
    [`Vertex ${name}`, level < 0 ? 'not reached' : `level ${level}`, state]
      .filter(Boolean)
      .join(', '),
  /** @param {string} u @param {string} v @param {number} f @param {number} c @param {string} state */
  edgeTitle: (u, v, f, c, state) =>
    [`Edge ${u} → ${v}: flow ${f} of ${c}`, state].filter(Boolean).join(', '),
  /**
   * @param {string} u @param {string} v @param {number} room @param {boolean} forward
   * @param {string} state
   */
  arcTitle: (u, v, room, forward, state) =>
    [
      forward ? `Arc ${u} → ${v}: room ${room}` : `Backward arc ${u} → ${v}: can cancel ${room}`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  /** @param {number} f @param {number} c */
  flowLabel: (f, c) => `${f}/${c}`,
  states: {
    source: 'source',
    sink: 'sink',
    onPath: 'on the current path',
    dead: 'dead end this phase',
    outside: 'outside the level graph',
    forward: 'path adds flow here',
    backward: 'path cancels flow here',
    full: 'saturated',
    carries: 'carries flow',
  },
  legend: {
    onPath: 'On the path',
    dead: 'Dead end (this phase)',
    forward: 'Path adds flow',
    backward: 'Path cancels flow',
    faded: 'Faded: not in the level graph',
    dashed: 'Backward arc',
    carries: 'Carries flow',
    full: 'Saturated (f = c)',
  },
  stats: {
    value: 'Flow value',
    paths: 'Augmenting paths',
    searches: { ek: 'BFS runs', dinic: 'Phases (BFS runs)' },
    checks: 'Arc checks',
  },
  pathTitle: 'Current path',
  emptyPath: 'none',
  /** @param {string} u @param {string} v @param {boolean} forward */
  pathStep: (u, v, forward) => (forward ? `${u} → ${v}` : `${u} ⇠ ${v} (cancel)`),
  /**
   * @param {PhaseFrame} f
   * @param {FlowMethod} method
   * @param {string[]} names
   * @param {{ s: string, t: string, sink: number }} ends
   */
  describe(f, method, names, { s, t, sink }) {
    const p = route(f.path, names);
    switch (f.kind) {
      case 'start':
        return method === 'ek'
          ? `Every edge starts with flow 0. Each round runs BFS from ${s}, so the path it finds to ${t} uses as few arcs as possible.`
          : `Every edge starts with flow 0. Each phase runs BFS once to sort the vertices into levels, then pushes as many paths as fit before the next BFS.`;
      case 'bfs':
        return method === 'ek'
          ? `BFS reached ${t} in ${count(f.level[sink], 'arc')} along ${p}. Its bottleneck is b = ${f.bottleneck}.`
          : `Phase ${f.searches}: BFS puts ${t} at level ${f.level[sink]}. Only arcs with room that climb exactly one level stay in the level graph; the rest are faded.`;
      case 'path':
        return `DFS in the level graph found ${p}, bottleneck b = ${f.bottleneck}.`;
      case 'push':
        return method === 'ek'
          ? `Push ${f.bottleneck} along the path. Flow value: ${f.value}. The next shortest path is never shorter than this one.`
          : `Push ${f.bottleneck}. This phase has pushed ${f.phaseFlow} so far; flow value ${f.value}. DFS starts again from ${s}, keeping its place in each vertex’s arc list.`;
      case 'dead':
        return `DFS reached ${names[f.at]}, but no level-graph arc out of ${names[f.at]} has room: it is a dead end. DFS backs out and skips ${names[f.at]} for the rest of the phase.`;
      case 'blocked':
        return `No path is left in the level graph: phase ${f.searches} pushed a blocking flow of ${f.phaseFlow}. The next BFS must put ${t} at least one level further away.`;
      case 'none':
        return `BFS cannot reach ${t} any more, so the flow of value ${f.value} is maximum.`;
      case 'done':
        return f.augmentations
          ? `Done: ${count(f.augmentations, 'augmenting path')} and ${count(f.searches, 'BFS run')} found the maximum flow ${f.value} from ${s} to ${t}.`
          : `Done: nothing can flow from ${s} to ${t}, so the maximum flow is 0.`;
    }
  },
  takeaways: [
    'Edmonds-Karp is Ford-Fulkerson with BFS: every augmenting path is a shortest one in the residual graph, measured in arcs.',
    'Distances from s never shrink after a push, and each push saturates some arc on a shortest path. An arc can be that bottleneck only O(V) times, so there are O(V·E) augmentations and O(V·E²) time, whatever the capacities.',
    'Dinic’s level graph keeps only arcs that climb one level. A blocking flow fills it until every s → t path in it has a full arc, so the next BFS finds t strictly further away and there are at most V − 1 phases.',
    'Inside a phase, a current-arc pointer per vertex and dead ends mean DFS never retries an arc it gave up on; a blocking flow costs O(V·E), so Dinic runs in O(V²·E), and in O(E·√V) on unit-capacity bipartite graphs.',
    'Try it: on the “Layered network”, compare the BFS runs of Edmonds-Karp and Dinic, then add an edge from A to E and see whether Dinic still needs only one phase.',
  ],
  complexityHead: ['Algorithm', 'Cost', 'Why'],
  complexity: [
    [
      'Edmonds-Karp',
      'O(V·E²)',
      'At most O(V·E) augmentations, each found by one BFS costing O(E).',
    ],
    [
      'Dinic',
      'O(V²·E)',
      'At most V − 1 phases; each builds levels with one BFS and finds a blocking flow in O(V·E).',
    ],
    [
      'Dinic, unit capacities',
      'O(E·√V)',
      'On bipartite matching networks only O(√V) phases are needed; this is Hopcroft-Karp.',
    ],
    ['Memory', 'O(V + E)', 'Flows, residual arcs, levels and one arc pointer per vertex.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Edmonds-Karp on the “Textbook network”: how many times does BFS run, counting the last one that fails to reach T?',
      answer: 4,
      tolerance: 0,
      hints: ['One BFS per augmenting path, plus the BFS that proves the flow is maximum.'],
      solution:
        'BFS finds S → A → C → T (12), S → B → D → T (4) and S → B → D → C → T (7), then a fourth BFS cannot reach T. That is 4 runs for a flow of 23.',
    },
    {
      type: 'number',
      prompt:
        'Dinic on the same network: how many phases end with a blocking flow before BFS fails?',
      answer: 2,
      tolerance: 0,
      hints: ['Watch the level of T: 3 in the first phase.'],
      solution:
        'Phase 1 (T at level 3) pushes 12 + 4 = 16, phase 2 (T at level 4) pushes 7, then BFS cannot reach T.',
    },
    {
      type: 'number',
      prompt:
        'Dinic on the “Layered network”: how many augmenting paths does the first phase push?',
      answer: 4,
      tolerance: 0,
      hints: [
        'Every path in the level graph has 3 arcs. Count the “found” steps before the blocking flow.',
      ],
      solution:
        'S → A → D → T, S → B → D → T, S → B → E → T and S → C → E → T, pushing 3 + 2 + 1 + 3 = 9 in one phase. Edmonds-Karp needs a separate BFS for each.',
    },
    {
      type: 'number',
      prompt:
        'On the “Zigzag trap”, Edmonds-Karp finishes. How much flow does the middle edge A → B carry at the end?',
      answer: 0,
      tolerance: 0,
      hints: ['Both shortest paths have two arcs. Does either of them use A → B?'],
      solution:
        'BFS finds S → A → T and then S → B → T, each with 2 arcs; the 3-arc path through A → B is never shortest. So A → B carries 0, and only 2 augmentations push all 40 units, where a bad Ford-Fulkerson order could need 40 pushes of 1 unit.',
    },
    {
      type: 'choice',
      prompt: 'Why does every Dinic phase put t strictly further from s than the previous one?',
      options: [
        'Because DFS always picks the arc with the largest room.',
        'Because after a blocking flow every path of the old length has a full arc, and new backward arcs only point down a level.',
        'Because each phase removes one vertex from the network.',
        'Because capacities are whole numbers.',
      ],
      answer: 1,
      hints: ['Which arcs can appear in the residual graph after pushing along level-graph arcs?'],
      solution:
        'Pushing along u → v (level up by one) can only create the backward arc v → u, which goes down a level. So no new shortcut appears, and the blocking flow has cut every path of the old length: the next shortest path is longer.',
    },
  ],
  nextTeaser:
    'Next up: the Max-flow min-cut theorem, which reads a minimum cut straight out of the final residual graph.',
};
