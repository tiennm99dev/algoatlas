/** @typedef {import('$lib/algo-engine/max-flow-min-cut.js').MinCutFrame} MinCutFrame */
/** @typedef {import('$lib/algo-engine/ford-fulkerson.js').PathArc} PathArc */

/**
 * A path as vertex names joined by arrows; a backward step is drawn ⇠.
 * @param {PathArc[]} path @param {string[]} names
 */
const route = (path, names) =>
  path.length
    ? [names[path[0].from], ...path.map((a) => `${a.forward ? '→' : '⇠'} ${names[a.to]}`)].join(' ')
    : '';

/** @param {string[]} list */
const join = (list) =>
  list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;

/** @param {string[]} list */
const set = (list) => `{${list.join(', ')}}`;

export const en = {
  slug: 'max-flow-min-cut',
  topic: 'flows',
  level: 'Advanced',
  title: 'Max-flow min-cut theorem',
  intro:
    'An s-t cut splits the vertices into a side S that holds the source and a side T that holds the sink. Every unit of flow must cross from S to T, so no flow can be larger than the capacity of any cut. The max-flow min-cut theorem says the two meet: the largest flow equals the smallest cut, and the final residual graph shows where that cut is.',
  summary:
    'Find a maximum flow, shade the vertices still reachable from s in the residual graph, and read off a minimum cut of the same value.',
  instruction:
    'Step through: the flow is found first, then BFS shades the vertices s can still reach. The edges marked ✂ at the end form the minimum cut. Then pick “Your cut”, move vertices between the two sides and compare your cut’s capacity with the maximum flow.',
  presetLabel: 'Network',
  presets: {
    classic: 'Textbook network',
    narrow: 'Narrow middle',
    ties: 'Several minimum cuts',
  },
  sourceLabel: 'Source s',
  sinkLabel: 'Sink t',
  viewLabel: 'View',
  views: { flow: 'Flow / capacity', residual: 'Residual graph', mine: 'Your cut' },
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
    flow: 'Flow network. Each edge shows flow / capacity; the source side of the cut is shaded.',
    residual:
      'Residual graph. Solid arcs have room c − f, dashed arcs cancel flow; the vertices reachable from s are shaded.',
    mine: 'Your cut. Shaded vertices are on the S side; edges from S to T are marked with their capacity.',
  },
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Vertex ${name}`, state].filter(Boolean).join(', '),
  /** @param {string} u @param {string} v @param {number} f @param {number} c @param {string} state */
  edgeTitle: (u, v, f, c, state) =>
    [`Edge ${u} → ${v}: flow ${f} of ${c}`, state].filter(Boolean).join(', '),
  /** @param {string} u @param {string} v @param {number} room @param {boolean} forward */
  arcTitle: (u, v, room, forward) =>
    forward ? `Arc ${u} → ${v}: room ${room}` : `Backward arc ${u} → ${v}: can cancel ${room}`,
  /** @param {string} u @param {string} v @param {number} c @param {boolean} crossing */
  mineTitle: (u, v, c, crossing) =>
    `Edge ${u} → ${v}: capacity ${c}${crossing ? ', crosses from S to T' : ''}`,
  /** @param {number} f @param {number} c */
  flowLabel: (f, c) => `${f}/${c}`,
  /** @param {number} c */
  cutLabel: (c) => `✂ ${c}`,
  states: {
    source: 'source',
    sink: 'sink',
    sSide: 'S side',
    reached: 'reachable from s',
    now: 'taken from the queue now',
    newly: 'just reached',
    onPath: 'on the path just pushed',
    cut: 'cut edge',
    full: 'saturated',
    carries: 'carries flow',
  },
  legend: {
    now: 'Taken from the queue',
    reached: 'Reachable from s (S side)',
    path: 'Path just pushed',
    cut: 'Cut edge, S → T',
    dashed: 'Backward arc',
    crossing: 'Crosses from S to T',
  },
  stats: {
    value: 'Flow value',
    paths: 'Augmenting paths',
    cut: 'Cut capacity',
    edges: 'Cut edges',
  },
  queueTitle: 'BFS queue',
  emptyQueue: 'empty',
  mine: {
    title: 'Your cut',
    help: 'Press a vertex to move it between the S side and the T side. s stays on the S side and t on the T side.',
    /** @param {string} name @param {boolean} inS */
    button: (name, inS) => `${name}: ${inS ? 'S' : 'T'}`,
    /** @param {string} name */
    aria: (name) => `${name} on the S side`,
    crossingTitle: 'Edges from S to T',
    none: 'none',
    /** @param {number} c @param {number} best */
    verdict: (c, best) =>
      c === best
        ? `Capacity ${c} = maximum flow ${best}: a minimum cut.`
        : `Capacity ${c} > maximum flow ${best}: a cut, but not a minimum one.`,
    /** @param {string} name @param {number} c */
    edge: (name, c) => `${name} (${c})`,
  },
  /**
   * @param {MinCutFrame} f
   * @param {string[]} names
   * @param {{ s: string, t: string }} ends
   * @param {{ name: string, cap: number }[]} edgeInfo  Per input edge.
   */
  describe(f, names, { s, t }, edgeInfo) {
    const sSide = names.filter((_, v) => f.side[v]);
    switch (f.kind) {
      case 'start':
        return `First find a maximum flow from ${s} to ${t}; here Edmonds-Karp pushes along shortest augmenting paths.`;
      case 'augment':
        return `Pushed ${f.bottleneck} along ${route(f.path, names)}. Flow value: ${f.value}.`;
      case 'maxflow':
        return `No path from ${s} to ${t} has room left, so the flow of value ${f.value} is maximum. Now find the vertices ${s} can still reach through arcs with room.`;
      case 'visit':
        return f.found.length
          ? `Take ${names[f.at]} from the queue. Its arcs with room reach ${join(f.found.map((v) => names[v]))}, which join the S side.`
          : `Take ${names[f.at]} from the queue. It reaches no new vertex: its arcs are full or lead back into the S side.`;
      case 'cut': {
        const parts = f.cut.map((k) => edgeInfo[k]);
        return parts.length
          ? `S = ${set(sSide)}, and T holds the rest. The cut edges ${join(parts.map((p) => p.name))} are all saturated, and edges from T back to S carry nothing, so c(S, T) = ${parts.map((p) => p.cap).join(' + ')} = ${f.cutCapacity} = |f|.`
          : `S = ${set(sSide)}: no edge leaves it, so the cut has capacity 0, the same as the flow.`;
      }
      case 'done':
        return f.side.some(Boolean)
          ? `A minimum cut of capacity ${f.cutCapacity}, equal to the maximum flow. No cut can be smaller, because every unit of flow crosses every cut.`
          : 'Pick two different vertices as the source and the sink.';
    }
  },
  takeaways: [
    'An s-t cut (S, T) puts s in S and t in T. Its capacity c(S, T) is the total capacity of the edges from S to T; edges from T back to S do not count.',
    'For any flow f and any cut, |f| = (flow S → T) − (flow T → S) ≤ c(S, T). So every cut bounds every flow from above.',
    'When no augmenting path is left, let S be the vertices reachable from s in the residual graph. Each S → T edge is full and each T → S edge is empty, so |f| = c(S, T): this flow is maximum and this cut is minimum.',
    'The reachability search costs only O(V + E) after the flow. When several minimum cuts exist, it returns the one with the smallest S side.',
    'Try it: on “Several minimum cuts”, use “Your cut” to find every source side whose capacity equals the maximum flow 7.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'Maximum flow',
      'O(V·E²)',
      'Edmonds-Karp; any maximum-flow algorithm works, Dinic in O(V²·E).',
    ],
    ['Reachable set', 'O(V + E)', 'One BFS over the residual arcs with room.'],
    ['Cut edges', 'O(E)', 'One pass over the edges, keeping those from S to T.'],
    ['Memory', 'O(V + E)', 'Flows, residual arcs and one side mark per vertex.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'On the “Textbook network”, use “Your cut” with S = {S, A}. What is the capacity of this cut?',
      answer: 25,
      tolerance: 0,
      hints: [
        'Count only edges that leave {S, A}. B → A enters it, so it does not count.',
        'The edges leaving are S → B and A → C.',
      ],
      solution: 'S → B (13) + A → C (12) = 25, which is more than the maximum flow 23.',
    },
    {
      type: 'number',
      prompt: 'On the same network, what is the capacity of the cut with S = {S} alone?',
      answer: 29,
      tolerance: 0,
      hints: ['Add the capacities of the edges out of S.'],
      solution: 'S → A (16) + S → B (13) = 29.',
    },
    {
      type: 'multi',
      prompt:
        'On “Several minimum cuts” the maximum flow is 7. Which source sides give a cut of capacity 7?',
      options: ['{S}', '{S, A}', '{S, B}', '{S, A, B}'],
      answers: [0, 1, 3],
      hints: ['Try each one with “Your cut”.', '{S, A} is crossed by S → B, A → B and A → T.'],
      solution:
        '{S}: 4 + 3 = 7. {S, A}: 3 + 2 + 2 = 7. {S, B}: S → A 4 + B → T 5 = 9. {S, A, B}: 2 + 5 = 7. Three of the four are minimum cuts.',
    },
    {
      type: 'choice',
      prompt: 'On “Several minimum cuts”, which minimum cut does the reachability search return?',
      options: ['{S}', '{S, A}', '{S, A, B}', 'It depends on the order of the edges'],
      answer: 0,
      hints: ['After the maximum flow, which arcs out of S still have room?'],
      solution:
        'Both edges out of S are saturated, so BFS reaches nothing and S = {S}. The search always returns the minimum cut with the smallest source side, whatever maximum flow it starts from.',
    },
    {
      type: 'choice',
      prompt: 'Why can no flow be larger than the capacity of any s-t cut?',
      options: [
        'Because Ford-Fulkerson stops at the first cut it meets.',
        'Because every unit leaving s must cross from S to T, and the edges from S to T hold at most c(S, T).',
        'Because the cut edges are always saturated.',
        'Because a cut has fewer edges than a path.',
      ],
      answer: 1,
      hints: ['Write |f| as the flow crossing the cut forwards minus the flow crossing back.'],
      solution:
        '|f| = f(S → T) − f(T → S) ≤ f(S → T) ≤ c(S, T). Cut edges are saturated only for a maximum flow and a minimum cut.',
    },
  ],
  nextTeaser:
    'Next up: Bipartite matching, which pairs up two groups by turning the question into a maximum flow.',
};
