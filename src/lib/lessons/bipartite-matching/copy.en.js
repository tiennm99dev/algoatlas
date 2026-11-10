/** @typedef {import('$lib/algo-engine/bipartite-matching.js').MatchFrame} MatchFrame */
/** @typedef {import('$lib/algo-engine/bipartite-matching.js').MatchMethod} MatchMethod */

/** Name of left vertex i. @param {number} i */
const leftName = (i) => String.fromCharCode(65 + i);
/** Name of right vertex i. @param {number} i */
const rightName = (i) => String(i + 1);

/** An alternating path l0, r0, l1, r1, … as names. @param {number[]} path */
const route = (path) => path.map((x, i) => (i % 2 ? rightName(x) : leftName(x))).join(' – ');

/** @param {number} n @param {string} word */
const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** @param {string[]} list */
const join = (list) =>
  list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;

export const en = {
  slug: 'bipartite-matching',
  topic: 'flows',
  level: 'Advanced',
  title: 'Bipartite matching',
  intro:
    'A bipartite graph has two groups, such as people and jobs, with edges only between the groups. A matching pairs vertices along edges so that nobody is used twice; the goal is as many pairs as possible. Add a source before the left group and a sink after the right group, give every edge capacity 1, and a maximum flow is a maximum matching. Kuhn’s and Hopcroft-Karp’s algorithms run that flow directly on the two columns.',
  summary:
    'Grow a maximum bipartite matching by flipping augmenting paths, one at a time with Kuhn’s algorithm or in shortest batches with Hopcroft-Karp.',
  instruction:
    'Step through Kuhn’s algorithm and watch an augmenting path flip: matched edges (thick green) and unmatched ones swap along it. Tick or clear cells in the table to change the edges, and switch to Hopcroft-Karp to see several shortest paths flipped in one phase.',
  leftName,
  rightName,
  methodLabel: 'Algorithm',
  methods: { kuhn: 'Kuhn', hk: 'Hopcroft-Karp' },
  presetLabel: 'Graph',
  presets: {
    chain: 'Long augmenting path',
    detours: 'Kuhn re-routes',
    hall: 'Someone is left out',
  },
  leftLabel: 'Left vertices',
  rightLabel: 'Right vertices',
  resetGraph: 'Reset graph',
  graphAria:
    'Bipartite graph: left vertices A, B, … in one column, right vertices 1, 2, … in the other. Thick edges are matched.',
  tableTitle: 'Edges (press a cell to add or remove one)',
  tableAria:
    'Edge table: one row per left vertex, one column per right vertex. A tick marks an edge.',
  /** @param {string} l @param {string} r @param {boolean} on @param {boolean} matched */
  cellLabel: (l, r, on, matched) =>
    `${l} – ${r}: ${on ? (matched ? 'edge, matched' : 'edge') : 'no edge'}`,
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Vertex ${name}`, state].filter(Boolean).join(', '),
  /** @param {number} layer */
  layerNote: (layer) => (layer < 0 ? '' : `L${layer}`),
  states: {
    matched: 'matched',
    free: 'free',
    now: 'searching now',
    looked: 'looked at now',
    visited: 'visited in this search',
  },
  legend: {
    now: 'Searching from',
    looked: 'Looked at',
    visited: 'Visited (this search)',
    matched: 'Matched',
    path: 'Alternating path',
    edgeNow: 'Edge looked at',
  },
  stats: {
    size: 'Matching size',
    checks: 'Edge checks',
    searches: { kuhn: 'Searches started', hk: 'Phases' },
  },
  pathTitle: 'Alternating path',
  emptyPath: 'none',
  /**
   * @param {MatchFrame} f
   * @param {MatchMethod} method
   */
  describe(f, method) {
    const x = leftName(f.at);
    const r = rightName(f.right);
    const p = route(f.path);
    switch (f.kind) {
      case 'start':
        return method === 'kuhn'
          ? 'No pairs yet. Kuhn’s algorithm takes the left vertices A, B, … in turn and searches for an augmenting path from each.'
          : 'No pairs yet. Each Hopcroft-Karp phase searches from all free left vertices together.';
      case 'begin':
        return `Start from ${leftName(f.root)}: clear the visited marks and run try(${leftName(f.root)}).`;
      case 'look':
        return `${x} looks at ${r}: ${r} is free. The alternating path ${p} ends at a free vertex, so it is an augmenting path.`;
      case 'follow':
        return `${x} looks at ${r}: ${r} is taken by ${leftName(f.matchR[f.right])}. Can ${leftName(f.matchR[f.right])} move to another partner? Run try(${leftName(f.matchR[f.right])}).`;
      case 'skip':
        return `${x} skips ${r}: this search has already visited it.`;
      case 'back':
        return `${x} has no free or re-routable neighbour left, so try(${x}) fails. Back up.`;
      case 'flip':
        return method === 'kuhn'
          ? `Flip the path ${p}: its unmatched edges become matched and its matched edges unmatched. The matching grows to ${f.size}.`
          : `DFS from ${leftName(f.root)} found ${p}, a shortest augmenting path that avoids this phase’s other paths. Flip it: size ${f.size}.`;
      case 'fail':
        return `No augmenting path starts at ${leftName(f.root)}, so it stays unmatched. Later searches only grow the matching, so they never open a path for it.`;
      case 'phase': {
        const free = f.layer.flatMap((l, i) => (l === 0 ? [leftName(i)] : []));
        return `Phase ${f.phases}: BFS from the free left vertices ${join(free)} finds that the shortest augmenting paths have ${count(f.length, 'edge')}. The L notes give each left vertex its layer.`;
      }
      case 'stuck':
        return `DFS from ${leftName(f.root)} finds no shortest augmenting path that avoids the paths already flipped in this phase.`;
      case 'blocked':
        return `Phase ${f.phases} flipped ${count(f.phasePaths, 'vertex-disjoint path')}. No augmenting path of ${count(f.length, 'edge')} is left, so the next phase’s paths are longer.`;
      case 'none':
        return 'BFS from the free left vertices reaches no free right vertex: no augmenting path is left.';
      case 'done':
        return method === 'kuhn'
          ? `Done: ${count(f.size, 'pair')} after ${count(f.checks, 'edge check')}. No augmenting path is left, so the matching is maximum.`
          : `Done: ${count(f.size, 'pair')} in ${count(f.phases, 'phase')} and ${count(f.checks, 'edge check')}. No augmenting path is left, so the matching is maximum.`;
    }
  },
  takeaways: [
    'Reduction to max flow: add a source s with an edge of capacity 1 to every left vertex, give every left–right edge capacity 1 (directed left to right), and join every right vertex to a sink t with capacity 1. The maximum flow value is the size of a maximum matching, and the edges carrying flow are the pairs.',
    'An augmenting path starts at a free left vertex, alternates unmatched and matched edges, and ends at a free right vertex. Flipping it adds one pair. A matching is maximum exactly when no augmenting path exists (Berge’s theorem).',
    'Kuhn’s algorithm runs one depth-first search per left vertex, visiting each right vertex at most once per search: O(V·E) in all. A taken right vertex asks its partner to move elsewhere, which is the backward arc of the flow network.',
    'Hopcroft-Karp is Dinic on this unit network: each phase flips a maximal set of vertex-disjoint shortest augmenting paths, only O(√V) phases are needed, and the total is O(E·√V).',
    'Try it: on “Someone is left out”, set the right side to 4 vertices and tick B – 4. Predict the new maximum before stepping, then compare how Kuhn and Hopcroft-Karp reach it.',
  ],
  complexityHead: ['Algorithm', 'Cost', 'Why'],
  complexity: [
    ['Kuhn', 'O(V·E)', 'One DFS per left vertex, each looking at every edge at most once.'],
    ['Hopcroft-Karp', 'O(E·√V)', 'O(√V) phases, each one BFS and one round of DFS costing O(E).'],
    [
      'As a max flow',
      'O(V·E)',
      'Ford-Fulkerson with flow value at most V/2 needs at most V/2 augmentations of O(E) each.',
    ],
    ['Memory', 'O(V + E)', 'Adjacency lists, one partner per vertex and the visited marks.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Kuhn on “Long augmenting path”: B finds 1 taken by A and re-routes A. How many edges does the augmenting path that gets flipped for B have?',
      answer: 3,
      unit: 'edges',
      tolerance: 0,
      hints: ['Read the path in the flip step: B – 1 – A – 2.'],
      solution:
        'B – 1 (unmatched), 1 – A (matched), A – 2 (unmatched): 3 edges. Flipping it matches B with 1 and A with 2.',
    },
    {
      type: 'number',
      prompt:
        'Hopcroft-Karp on “Long augmenting path”: how many edges do the shortest augmenting paths have in phase 2?',
      answer: 7,
      unit: 'edges',
      tolerance: 0,
      hints: ['After phase 1 only B is free on the left and only 4 on the right.'],
      solution:
        'The only augmenting path is B – 1 – A – 2 – C – 3 – D – 4, with 7 edges. Flipping it gives all four pairs.',
    },
    {
      type: 'number',
      prompt: 'What is the maximum matching size on “Someone is left out”?',
      answer: 3,
      tolerance: 0,
      hints: ['A and B can only use 1.'],
      solution:
        'A and B compete for 1, so one of them stays single. C and D can take 2 and 3, so 3 pairs is the maximum.',
    },
    {
      type: 'number',
      prompt:
        'In the flow network for a matching, the edge from s to each left vertex has capacity 1. With 4 left vertices and 3 right vertices, what is the largest possible flow value, whatever the edges?',
      answer: 3,
      tolerance: 0,
      hints: ['Every unit of flow reaches t through one right vertex.'],
      solution:
        'Each right vertex sends at most 1 unit to t, so the flow is at most 3, the size of the smaller side.',
    },
    {
      type: 'choice',
      prompt: 'Why can Hopcroft-Karp flip several augmenting paths in one phase?',
      options: [
        'Because the paths it flips together share no vertex, so flipping one does not spoil another.',
        'Because it flips every edge of the graph at once.',
        'Because BFS already chose the final matching.',
        'Because shortest paths never share an edge with the current matching.',
      ],
      answer: 0,
      hints: ['What would go wrong if two paths used the same right vertex?'],
      solution:
        'Vertex-disjoint paths touch different vertices, so after one is flipped the others are still augmenting paths. Like a blocking flow in Dinic, the phase stops when no shortest path avoids them.',
    },
  ],
  nextTeaser:
    'Next up: Min-cost flow and the assignment problem, where each pair has a cost and the Hungarian algorithm finds the cheapest perfect matching.',
};
