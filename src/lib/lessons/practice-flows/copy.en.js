/** @typedef {import('$lib/algo-engine/practice-flows.js').ModelFrame} ModelFrame */
/** @typedef {import('$lib/algo-engine/practice-flows.js').ModelCheck} ModelCheck */
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

/** @param {number} k @param {string} one @param {string} [many] */
const count = (k, one, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;

export const en = {
  slug: 'practice-flows',
  topic: 'flows',
  level: 'Advanced',
  title: 'Practice: flow modelling',
  intro:
    'Most flow problems do not arrive as a network. They arrive as a story about farms, routers, students or trucks, and the real work is building the network: what flows, where it starts and ends, and which limits become capacities. Once the model is right, any maximum-flow algorithm gives the answer, and the minimum cut says what limits it.',
  summary:
    'Turn word problems into flow networks with super sources and sinks, split vertices and unit capacities, then check the model and solve it with a maximum flow.',
  instruction:
    'Pick a story and read it. In “Build”, add, delete and reconnect edges and set their capacities until the drawing models the story, then press “Check model”. Switch to “Run” and step through Edmonds-Karp on your drawing; the edges marked ✂ at the end are what limits the answer.',
  scenarioLabel: 'Story',
  scenarios: {
    supply: {
      name: 'Farms and markets',
      labels: ['S', 'F', 'G', 'D', 'P', 'Q', 'T'],
      story:
        'Farms F and G harvest 9 and 7 tonnes of vegetables a day. Trucks carry them along one-way roads with daily limits: F → D 5, F → P 3, G → D 6 and G → Q 2, then from the depot D → P 4 and D → Q 6. Market P can sell 8 tonnes a day and market Q 9. How many tonnes a day can reach the markets? S and T are spare vertices for your model.',
      tip: 'Two sources and two sinks: join S to each farm with its harvest as the capacity, and each market to T with what it can sell.',
    },
    routers: {
      name: 'Routers with limits',
      labels: ['S', 'A', 'A′', 'B', 'B′', 'T'],
      story:
        'Server S streams to T through routers A and B. The links carry, in Mbit/s, S → A 8, S → B 6, A → B 4, A → T 5 and B → T 9. Router A can forward at most 6 Mbit/s in total and router B at most 7. What is the highest total rate? A′ and B′ are spare vertices for your model.',
      tip: 'A limit on a vertex is not an edge yet. Split A into A → A′ with capacity 6: links into A stay on A, links out of A leave from A′. Do the same for B.',
    },
    clubs: {
      name: 'Students and clubs',
      labels: ['S', 'X', 'Y', 'Z', 'C', 'R', 'T'],
      story:
        'Students X, Y and Z sign up for the chess club C and the robotics club R. X and Z like both clubs, Y likes only chess. X and Z have time for two clubs, Y for one. Chess has 2 free places and robotics 3. Nobody joins a club twice. How many sign-ups can be made?',
      tip: 'One unit of flow is one sign-up. S → student carries how many clubs the student may join, student → club carries 1 (at most once), club → T carries the free places.',
    },
    convoys: {
      name: 'Trucks on shared roads',
      labels: ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'T'],
      story:
        'Trucks leave depot S for city T along one-way roads; the numbers drawn are the road lengths in km. For safety no two trucks may use the same road. How many trucks can make the trip?',
      tip: 'Length does not limit how many trucks pass. “Each road at most once” is capacity 1 on every road, and the maximum flow counts edge-disjoint paths.',
    },
  },
  viewLabel: 'View',
  views: { build: 'Build', run: 'Run' },
  checkModel: 'Check model',
  showModel: 'Show a correct model',
  resetDrawing: 'Reset drawing',
  tipTitle: 'Stuck? Show a tip',
  storyTitle: 'The story',
  editor: {
    graphAria: 'Modelling canvas: a directed graph whose edge weights are the capacities.',
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
  shownModel: 'This is one correct model. Switch to Run to watch the maximum flow on it.',
  boardAria:
    'Your model while the maximum flow runs. Each edge shows flow / capacity; after the run the source side of the minimum cut is shaded.',
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Vertex ${name}`, state].filter(Boolean).join(', '),
  /** @param {string} u @param {string} v @param {number} f @param {number} c @param {string} state */
  edgeTitle: (u, v, f, c, state) =>
    [`Edge ${u} → ${v}: flow ${f} of ${c}`, state].filter(Boolean).join(', '),
  /** @param {number} f @param {number} c */
  flowLabel: (f, c) => `${f}/${c}`,
  /** @param {number} f @param {number} c */
  cutLabel: (f, c) => `✂ ${f}/${c}`,
  states: {
    source: 'source',
    sink: 'sink',
    sSide: 'S side of the cut',
    onPath: 'on the path just pushed',
    cut: 'cut edge',
    full: 'saturated',
    carries: 'carries flow',
  },
  legend: {
    sSide: 'Still reachable from S (cut side)',
    path: 'Path just pushed',
    full: 'Saturated',
    carries: 'Carries flow',
    cut: 'Cut edge: limits the answer',
  },
  stats: {
    value: 'Flow of your model',
    paths: 'Augmenting paths',
    edges: 'Edges drawn',
    cut: 'Cut capacity',
  },
  check: {
    title: 'Model check',
    idle: 'Build the model, then press “Check model”.',
    /** @param {number} answer */
    ok: (answer) =>
      `Correct model. Its maximum flow, ${answer}, answers the question in the story.`,
    /** @param {ModelCheck} c */
    summary: (c) =>
      `Not yet: ${[
        c.missing.length && `${count(c.missing.length, 'edge')} missing`,
        c.extra.length && `${count(c.extra.length, 'edge')} the story does not need`,
        c.wrong.length && `${count(c.wrong.length, 'capacity', 'capacities')} wrong`,
      ]
        .filter(Boolean)
        .join(', ')}.`,
    extraTitle: 'Not needed',
    wrongTitle: 'Wrong capacity',
    /** @param {string} name @param {number} got */
    wrong: (name, got) => `${name} (${got})`,
  },
  /**
   * @param {ModelFrame} f
   * @param {string[]} names
   * @param {{ s: string, t: string, vertices: number }} ends
   * @param {{ name: string, cap: number }[]} edgeInfo  Per input edge.
   */
  describe(f, names, { s, t, vertices }, edgeInfo) {
    if (!f.valid)
      return 'The model needs both S and T. Press “Reset drawing” to bring back a deleted vertex.';
    switch (f.kind) {
      case 'start':
        return `Your model has ${count(vertices, 'vertex', 'vertices')} and ${count(edgeInfo.length, 'edge')}. Edmonds-Karp now pushes flow from ${s} to ${t} along shortest paths with room.`;
      case 'augment':
        return `Pushed ${f.bottleneck} along ${route(f.path, names)}. Flow so far: ${f.value}.`;
      case 'maxflow': {
        const parts = f.cut.map((k) => edgeInfo[k]);
        const side = names.filter((_, v) => f.side[v]);
        return parts.length
          ? `No path from ${s} to ${t} has room left. ${s} still reaches {${side.join(', ')}}; the full edges ${join(parts.map((p) => p.name))} leave that side, a minimum cut of ${parts.map((p) => p.cap).join(' + ')} = ${f.cutCapacity}. They limit the answer.`
          : `No edge leaves {${side.join(', ')}}, the vertices ${s} reaches, so nothing gets from ${s} to ${t}. Connect them.`;
      }
      case 'done':
        return `Your model carries at most ${f.value}. If the model is right, that is the answer to the story; press “Check model” to compare.`;
    }
  },
  takeaways: [
    'To model a story as a flow, ask what moves (goods, data, people, trucks), where it starts and ends, and what limits it. Every limit becomes a capacity, and one unit of flow is one unit of the answer.',
    'Several sources or sinks: add a super source S with an edge to each source whose capacity is its supply, and a super sink T with an edge from each sink whose capacity is its demand.',
    'A vertex capacity c on v: split v into v and v′ joined by v → v′ with capacity c. Edges into v stay on v and edges out of v leave from v′, so all flow through v crosses that one edge. Splitting every vertex costs only V more vertices and V more edges.',
    'Rules like “at most once” become capacity 1: student → club in an assignment, or every road when counting edge-disjoint paths. The maximum flow then counts choices or paths, and the minimum cut names the bottleneck.',
    'Try it: on “Routers with limits”, run the drawing as given (14), then split A and B. The answer drops to 12 and the cut passes through A → A′, router A’s limit.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'Build the model',
      'O(V + E)',
      'One vertex per place plus S, T and split copies; one edge per route and per limit.',
    ],
    [
      'Split every vertex',
      '2V vertices, E + V edges',
      'Each split adds one vertex v′ and one edge v → v′.',
    ],
    ['Maximum flow', 'O(V·E²)', 'Edmonds-Karp on the model; Dinic in O(V²·E) for bigger models.'],
    [
      'Unit capacities',
      'O(f·E), f ≤ V',
      'Each augmenting path adds 1, and at most deg(s) paths leave the source.',
    ],
    ['Memory', 'O(V + E)', 'The model, its flows and the residual arcs.'],
  ],
  practiceTitle: 'Model and solve',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Farms and markets: build the model and run it. How many tonnes a day can reach the markets?',
      answer: 15,
      unit: 'tonnes',
      tolerance: 0,
      hints: [
        'Add S → F 9, S → G 7, P → T 8 and Q → T 9, then switch to Run.',
        'Into P at most F → P 3 + D → P 4 = 7 can arrive, into Q at most G → Q 2 + D → Q 6 = 8.',
      ],
      solution:
        'The maximum flow of the model is 15. It cannot be more: P can receive at most 3 + 4 = 7 and Q at most 2 + 6 = 8, so the roads into the markets cap the total at 15 even though the farms harvest 16 and the markets would sell 17. The run marks another minimum cut of the same size: S → G 7, F → D 5 and F → P 3.',
    },
    {
      type: 'number',
      prompt:
        'Routers with limits: run the drawing as given, before any change. What maximum flow does it report?',
      answer: 14,
      unit: 'Mbit/s',
      tolerance: 0,
      hints: ['Press “Reset drawing”, switch to Run and step to the end.'],
      solution:
        'Without router limits the answer is 14: S → A carries 8 (5 straight to T, 3 on to B) and S → B carries 6, so B → T carries 9. That is wrong for the story, because router A would forward 8 and router B 9.',
    },
    {
      type: 'number',
      prompt:
        'Now split A and B as the tip says (A → A′ 6, B → B′ 7) and run again. What is the highest total rate?',
      answer: 12,
      unit: 'Mbit/s',
      tolerance: 0,
      hints: [
        'Links out of A must leave from A′: A′ → B 4 and A′ → T 5. The link out of B leaves from B′: B′ → T 9.',
        'A can forward 6 at most: 5 to T and 1 on to B.',
      ],
      solution:
        'A forwards 6 (5 to T, 1 to B) and B forwards 6 + 1 = 7, its limit. 5 + 7 = 12, and the cut S → B 6 + A → A′ 6 = 12 proves no more is possible.',
    },
    {
      type: 'multi',
      prompt:
        'In the correct routers model, which edges does the run mark ✂ as the minimum cut at the end?',
      options: ['S → A', 'S → B', 'A → A′', 'B → B′', 'A′ → T'],
      answers: [1, 2],
      hints: ['Step to the end on the correct model; “Show a correct model” loads it.'],
      solution:
        'S still reaches A (S → A has room 2), but A → A′ is full, so S = {S, A}. The edges leaving it are S → B (6) and A → A′ (6): 6 + 6 = 12, the maximum flow. Router A’s limit and the link into B are the bottleneck.',
    },
    {
      type: 'number',
      prompt: 'Students and clubs: how many sign-ups can be made at most?',
      answer: 4,
      unit: 'sign-ups',
      tolerance: 0,
      hints: [
        'S → X 2, S → Y 1, S → Z 2; each liked club gets a capacity-1 edge; C → T 2 and R → T 3.',
        'Robotics has 3 places but only X and Z like it.',
      ],
      solution:
        'Chess takes 2 of X, Y and Z, robotics takes X and Z, so 2 + 2 = 4. The cut found by the run is X → R, Z → R and C → T: 1 + 1 + 2 = 4.',
    },
    {
      type: 'number',
      prompt: 'Trucks on shared roads: how many trucks can make the trip?',
      answer: 2,
      unit: 'trucks',
      tolerance: 0,
      hints: [
        'Set every capacity to 1; the lengths do not matter.',
        'Every route from the left half to the right half uses A → D or C → F.',
      ],
      solution:
        'With capacity 1 on every road the maximum flow is 2, for example S → A → D → T and S → C → F → T. The cut {A → D, C → F} shows that a third truck would have to reuse one of those roads. Running the drawing with lengths as capacities gives 12, which means nothing here.',
    },
    {
      type: 'choice',
      prompt: 'Vertex v may pass at most c units. How do you put that limit into a flow network?',
      options: [
        'Give every edge into v capacity c.',
        'Give every edge out of v capacity c.',
        'Split v into v and v′ joined by v → v′ of capacity c; edges into v stay, edges out of v leave from v′.',
        'Add an edge v → t of capacity c.',
      ],
      answer: 2,
      hints: ['The limit is on the total through v, not on any one edge.'],
      solution:
        'All flow through v must cross the single edge v → v′, so its capacity c limits the total. Capping each edge separately would still let several edges together carry more than c.',
    },
    {
      type: 'number',
      prompt:
        'A network has 9 vertices and 14 edges. You split 4 vertices to give them capacities. How many edges does the new network have?',
      answer: 18,
      unit: 'edges',
      tolerance: 0,
      hints: ['Splitting moves edges from v to v′ but removes none; it adds one edge per split.'],
      solution:
        'Each split adds the edge v → v′ and the vertex v′, so there are 14 + 4 = 18 edges (and 9 + 4 = 13 vertices).',
    },
  ],
  nextTeaser:
    'Next up: Bitmask DP and travelling salesman, which runs dynamic programming over subsets stored as bits.',
};
