/** @typedef {import('$lib/algo-engine/ford-fulkerson.js').FordFulkersonFrame} FordFulkersonFrame */
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

export const en = {
  slug: 'ford-fulkerson',
  topic: 'flows',
  level: 'Intermediate',
  title: 'Flow networks and Ford-Fulkerson',
  intro:
    'A flow network is a directed graph whose edges carry a capacity: how much can pass through per unit of time, like water through a pipe. Goods leave a source s and arrive at a sink t, and every other vertex passes on exactly what it receives. Ford-Fulkerson finds the largest possible flow by pushing more along augmenting paths of the residual graph until none is left.',
  summary:
    'Push flow along augmenting paths of the residual graph, cancel bad choices through backward arcs, and reach the maximum flow.',
  instruction:
    'Step through the run and watch each augmenting path light up, then its bottleneck pushed along it. Switch the view to “Residual graph” to see the arcs the search really walks, backward arcs dashed. Pick “Cancelling flow” to see a path use an edge backwards.',
  presetLabel: 'Network',
  presets: {
    classic: 'Textbook network',
    cancel: 'Cancelling flow',
    split: 'Two routes',
  },
  sourceLabel: 'Source s',
  sinkLabel: 'Sink t',
  viewLabel: 'View',
  views: { flow: 'Flow / capacity', residual: 'Residual graph' },
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
    flow: 'Flow network. Each edge shows flow / capacity; each vertex shows the flow in and out.',
    residual:
      'Residual graph. A solid arc u → v has room c − f; a dashed arc v → u can cancel f units of flow.',
  },
  /** @param {string} name @param {string} state @param {string} balance */
  vertexLabel: (name, state, balance) =>
    [`Vertex ${name}`, balance, state].filter(Boolean).join(', '),
  /** @param {string} u @param {string} v @param {number} f @param {number} c @param {string} state */
  edgeTitle: (u, v, f, c, state) =>
    [`Edge ${u} → ${v}: flow ${f} of ${c}`, state].filter(Boolean).join(', '),
  /** @param {string} u @param {string} v @param {number} room @param {boolean} forward @param {boolean} hot */
  arcTitle: (u, v, room, forward, hot) =>
    [
      forward ? `Arc ${u} → ${v}: room ${room}` : `Backward arc ${u} → ${v}: can cancel ${room}`,
      hot ? 'on the augmenting path' : '',
    ]
      .filter(Boolean)
      .join(', '),
  /** @param {number} f @param {number} c */
  flowLabel: (f, c) => `${f}/${c}`,
  /** @param {'source'|'sink'|'inner'} role @param {number} into @param {number} out */
  balance: (role, into, out) =>
    role === 'source' ? `out ${out}` : role === 'sink' ? `in ${into}` : `in ${into} = out ${out}`,
  states: {
    source: 'source',
    sink: 'sink',
    onPath: 'on the augmenting path',
    searched: 'reached by the search',
    forward: 'path adds flow here',
    backward: 'path cancels flow here',
    full: 'saturated',
    carries: 'carries flow',
  },
  legend: {
    onPath: 'On the path',
    searched: 'Reached by the search',
    forward: 'Path adds flow',
    backward: 'Path cancels flow',
    carries: 'Carries flow',
    full: 'Saturated (f = c)',
    dashed: 'Backward arc',
  },
  stats: {
    value: 'Flow value',
    paths: 'Augmenting paths',
    bottleneck: 'Bottleneck b',
    checks: 'Arc checks',
  },
  pathTitle: 'Augmenting path',
  emptyPath: 'none yet',
  /** @param {string} u @param {string} v @param {boolean} forward */
  pathStep: (u, v, forward) => (forward ? `${u} → ${v}` : `${u} ⇠ ${v} (cancel)`),
  /**
   * @param {FordFulkersonFrame} f
   * @param {string[]} names
   * @param {{ s: string, t: string }} ends
   */
  describe(f, names, { s, t }) {
    const back = f.path.filter((a) => !a.forward);
    const cancels = join(back.map((a) => `${names[a.to]} → ${names[a.from]}`));
    switch (f.kind) {
      case 'start':
        return `Every edge starts with flow 0. Look for a path from ${s} to ${t} whose arcs all have room left.`;
      case 'path':
        return `Depth-first search found ${route(f.path, names)}. Its smallest room is the bottleneck b = ${f.bottleneck}.${
          back.length
            ? ` The step${back.length > 1 ? 's' : ''} drawn ⇠ use${back.length > 1 ? '' : 's'} ${cancels} backwards.`
            : ''
        }`;
      case 'push':
        return `Push ${f.bottleneck} along the path: add it on each forward edge${
          back.length ? ` and take it off ${cancels}` : ''
        }. The flow value is now ${f.value}, and every vertex except ${s} and ${t} still sends out what it receives.`;
      case 'none':
        return `No path from ${s} to ${t} has room left: the search reached only ${join(
          f.seen.map((v) => names[v]),
        )}. No augmenting path means the flow is maximum.`;
      case 'done':
        return f.augmentations
          ? `Done after ${f.augmentations} augmenting path${f.augmentations > 1 ? 's' : ''} and ${f.checks} arc checks: the maximum flow from ${s} to ${t} is ${f.value}.`
          : `Done: no flow can get from ${s} to ${t}, so the maximum flow is 0.`;
    }
  },
  takeaways: [
    'A flow respects two rules: on every edge 0 ≤ f ≤ c (capacity), and at every vertex except s and t the flow in equals the flow out (conservation). Its value is the net flow leaving s.',
    'The residual graph shows what can still change: an edge u → v with c − f > 0 gives a forward arc with that room, and an edge carrying f > 0 gives a backward arc v → u that can cancel up to f.',
    'An augmenting path is any s → t path in the residual graph. Pushing its bottleneck keeps both rules and raises the value by the bottleneck.',
    'Backward arcs let the method undo an early bad choice, so the order in which paths are found does not stop it from reaching the maximum. With whole-number capacities it ends after at most (maximum flow) pushes.',
    'Try it: on “Cancelling flow”, raise S → A to 2 and predict the new maximum before stepping (count what can enter T), then check the residual view at the last step.',
  ],
  complexityHead: ['Case', 'Cost', 'Why'],
  complexity: [
    [
      'Time, whole capacities',
      'O(E · |f*|)',
      'Each search costs O(V + E) and each push adds at least 1, so at most |f*| (the maximum flow value) searches run.',
    ],
    [
      'Time, bad choices',
      'Can be huge',
      'Two unlucky paths can each move only 1 unit through a middle edge, so a network with capacities of a million needs two million pushes; with irrational capacities the method may not even stop.',
    ],
    ['Memory', 'O(V + E)', 'One flow value per edge, the residual arcs and the search’s marks.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'On the “Textbook network”, step to the end. What is the maximum flow from S to T?',
      answer: 23,
      tolerance: 0,
      hints: [
        'Read the flow value at the last step, or add the flow on the edges entering T.',
        'C → T carries 19 and D → T carries 4.',
      ],
      solution:
        'Four augmenting paths push 4, 8, 4 and 7, so the value is 23. The edges into T carry 19 + 4 = 23.',
    },
    {
      type: 'number',
      prompt:
        'Edge A → C has capacity 12 and carries 8 units. What is the room on the backward arc C → A in the residual graph?',
      answer: 8,
      tolerance: 0,
      hints: ['A backward arc can cancel the flow the edge already carries.'],
      solution:
        'The forward arc A → C has room 12 − 8 = 4, and the backward arc C → A has room 8: a path may cancel all 8 units.',
    },
    {
      type: 'choice',
      prompt:
        'On “Cancelling flow”, depth-first search first sends 1 unit along S → A → B → T. Which edge carries no flow at the end?',
      options: ['S → A', 'A → B', 'A → T', 'B → T'],
      answer: 1,
      hints: ['The second path is S → B ⇠ A → T.', 'The step B ⇠ A cancels the unit on A → B.'],
      solution:
        'The second path uses A → B backwards and takes its unit off, so the final flow sends S → A → T and S → B → T, with nothing on A → B.',
    },
    {
      type: 'multi',
      prompt: 'Which statements hold for every flow, at every step of Ford-Fulkerson?',
      options: [
        'Each edge carries at most its capacity.',
        'Every vertex other than s and t receives exactly what it sends.',
        'Every edge out of s is saturated.',
        'The value equals the net flow entering t (in minus out).',
      ],
      answers: [0, 1, 3],
      hints: ['Look at the notes under the vertices on the “Textbook network”.'],
      solution:
        'Capacity and conservation are the two rules of a flow, and conservation forces the net flow out of s to arrive at t as net flow in. Edges out of s need not be full: at the end S → A carries 12 of 16.',
    },
  ],
  nextTeaser:
    'Next up: Edmonds-Karp and Dinic, which pick the augmenting paths with breadth-first search so the number of rounds no longer depends on the capacities.',
};
