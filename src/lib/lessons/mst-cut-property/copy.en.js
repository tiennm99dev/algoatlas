/** @typedef {import('$lib/algo-engine/mst-cut-property.js').CutFrame} CutFrame */
/** @typedef {import('$lib/algo-engine/mst-cut-property.js').CycleFrame} CycleFrame */
/** @typedef {{u: number, v: number, w: number}} EdgeInfo */

/** @param {EdgeInfo | undefined} e @param {string[]} names */
const edgeName = (e, names) => (e ? `${names[e.u] ?? '?'} — ${names[e.v] ?? '?'}` : '');
/** @param {EdgeInfo | undefined} e @param {string[]} names */
const edgeWithWeight = (e, names) => (e ? `${edgeName(e, names)} (weight ${e.w})` : '');
/** @param {string[]} list */
const set = (list) => `{${list.join(', ')}}`;

export const en = {
  slug: 'mst-cut-property',
  topic: 'mst',
  level: 'Intermediate',
  title: 'Cut property and MST basics',
  intro:
    'A spanning tree of a connected graph keeps every vertex and just enough edges, V − 1 of them, to connect them all with no cycle. A minimum spanning tree (MST) is one whose edge weights add up to the least total. Two simple rules decide which edges belong in it: the cut property and the cycle property.',
  summary:
    'Split a graph with a cut you choose and find the lightest crossing edge, then test any edge against the cycle property.',
  instruction:
    'In Cut mode, click a vertex (or focus it and press Enter) to move it across the cut, then step through the scan for the lightest crossing edge. In Cycle mode, pick an edge to test and watch the search over lighter edges decide whether any MST can use it.',
  modeLabel: 'Property',
  modes: { cut: 'Cut', cycle: 'Cycle' },
  testLabel: 'Edge to test',
  showMst: 'Show a minimum spanning tree',
  resetGraph: 'Reset graph',
  cutHelp: 'Click a vertex to move it to the other side of the cut.',
  graphAria:
    'Undirected weighted graph. In Cut mode, each vertex is on side S or on the other side; selecting a vertex moves it across.',
  edgesTitle: 'Edge weights',
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  noEdges: 'No edges yet. Use Connect to draw one.',
  /** @param {number} max */
  badWeight: (max) => `A weight must be a whole number from 1 to ${max}. The old weight is kept.`,
  crossingTitle: 'Crossing edges found',
  queueTitle: 'Search queue',
  emptyText: 'none',
  hotLabel: 'lightest so far',
  /** @param {EdgeInfo} e @param {string[]} names */
  edgeChip: (e, names) => `${edgeName(e, names)} ${e.w}`,
  /** @param {EdgeInfo | undefined} e @param {string[]} names */
  edgeOption: (e, names) => edgeWithWeight(e, names),
  stats: {
    checked: 'Edges checked',
    crossing: 'Crossing edges',
    lightest: 'Lightest crossing weight',
    reached: 'Vertices reached',
    tested: 'Tested edge weight',
    mst: 'MST weight',
    treeEdges: 'Edges in a spanning tree',
  },
  none: '—',
  /** @param {number} weight @param {number} components */
  mstValue: (weight, components) =>
    components > 1 ? `${weight} (forest of ${components})` : String(weight),
  legend: {
    sideS: 'Side S of the cut',
    other: 'Other side',
    current: 'Vertex being expanded',
    queued: 'Reached, in the queue',
    reached: 'Reached, done',
    path: 'Lighter route a → b',
    edgeNow: 'Edge examined now',
    best: 'Lightest crossing edge',
    crossing: 'Other crossing edge',
    tested: 'Edge under test',
    used: 'Lighter edge used by the search',
    mst: 'Minimum spanning tree edge',
    ends: 'a and b: ends of the tested edge',
  },
  states: {
    sideS: 'side S',
    other: 'other side',
    current: 'being expanded',
    queued: 'in the queue',
    reached: 'reached',
    path: 'on the lighter route',
    a: 'search start a',
    b: 'target b',
  },
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Vertex ${name}`, state].filter(Boolean).join(', '),
  /**
   * @param {CutFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   * @param {boolean[]} side
   */
  describeCut(f, names, info, side) {
    const inS = names.filter((_, i) => side[i]);
    const e = info[f.edge];
    const best = info[f.best];
    switch (f.kind) {
      case 'start':
        if (!inS.length || inS.length === names.length)
          return 'Every vertex is on the same side, so no edge can cross this cut. Click a vertex to move it across.';
        return `S = ${set(inS)}. Scan every edge and keep the lightest one with one end in S and the other end outside.`;
      case 'inside':
        return `Edge ${edgeWithWeight(e, names)}: both ends are ${side[e.u] ? 'in S' : 'outside S'}, so it does not cross the cut. Skip it.`;
      case 'best':
        return f.crossing.length === 1
          ? `Edge ${edgeWithWeight(e, names)} crosses the cut. It is the first crossing edge, so it is the lightest so far.`
          : `Edge ${edgeWithWeight(e, names)} crosses the cut and is lighter than the best so far. It becomes the new best.`;
      case 'heavier':
        return `Edge ${edgeWithWeight(e, names)} crosses the cut, but it is not lighter than ${edgeWithWeight(best, names)}. Keep the best.`;
      case 'done': {
        if (!best) {
          if (!inS.length || inS.length === names.length)
            return 'No edge crosses a cut with an empty side. Move a vertex across to make a real cut.';
          return 'No edge crosses this cut, so the two sides are not connected: the graph has no spanning tree.';
        }
        const others = f.ties.filter((k) => k !== f.best).map((k) => edgeName(info[k], names));
        return `The lightest crossing edge is ${edgeWithWeight(best, names)}. Every spanning tree needs a crossing edge to join the sides, and swapping that edge for ${edgeName(best, names)} never makes the tree heavier, so some MST contains ${edgeName(best, names)}.${others.length ? ` ${others.join(', ')} ${others.length === 1 ? 'ties' : 'tie'} with it: each lightest crossing edge is in some MST.` : ''}`;
      }
    }
  },
  /**
   * @param {CycleFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  describeCycle(f, names, info) {
    const t = info[f.target];
    const tn = edgeName(t, names);
    const a = names[f.a] ?? '';
    const b = names[f.b] ?? '';
    const x = names[f.current] ?? '';
    const y = names[f.neighbor] ?? '';
    const e = info[f.edge];
    const route = f.path.map((v) => names[v]).join(' → ');
    switch (f.kind) {
      case 'start':
        return t
          ? `Test edge ${tn} (weight ${f.w}). Search from ${a} using only edges lighter than ${f.w}. If the search reaches ${b}, that route plus ${tn} is a cycle on which ${tn} is the heaviest edge.`
          : 'There is no edge to test. Draw one with Connect.';
      case 'pop':
        return `Take ${x} from the front of the queue and look at its edges.`;
      case 'heavy':
        return f.edge === f.target
          ? `Edge ${tn} is the edge under test, so the search may not use it.`
          : `Edge ${edgeWithWeight(e, names)} is not lighter than ${f.w}, so the search may not use it.`;
      case 'seen':
        return `Edge ${edgeWithWeight(e, names)} is lighter, but ${y} is already reached.`;
      case 'follow':
        return `Edge ${edgeWithWeight(e, names)} is lighter than ${f.w}: reach ${y} and add it to the queue.`;
      case 'found':
        return `Edge ${edgeWithWeight(e, names)} reaches ${b}. The route ${route} uses only edges lighter than ${f.w}.`;
      case 'done':
        if (!t) return 'Nothing to test.';
        if (f.verdict === 'cycle')
          return `Cycle property: ${tn} (weight ${f.w}) is strictly the heaviest edge on the cycle ${route} → ${a}. In any tree that used it, swapping it for a lighter edge of that cycle gives a lighter tree, so no MST contains ${tn}.`;
        return `The search ran out without reaching ${b}. The reached vertices ${set(names.filter((_, i) => f.reached[i]))} form a cut that ${tn} crosses, and no crossing edge is lighter than ${f.w}. By the cut property, some MST contains ${tn}.`;
    }
  },
  takeaways: [
    'A spanning tree of a connected graph on V vertices has exactly V − 1 edges and no cycle. Add any other edge and you close exactly one cycle; remove a tree edge and the tree falls into two parts.',
    'Cut property: for any split of the vertices into two sides, a lightest edge crossing the split belongs to some minimum spanning tree, and to every MST when it is strictly the lightest.',
    'Cycle property: an edge that is strictly the heaviest on some cycle belongs to no minimum spanning tree.',
    'Both proofs are the same exchange argument: swap one edge for another across the same cut or around the same cycle, and the total weight cannot go down. Kruskal’s and Prim’s algorithms are just two ways to pick cuts.',
    'Try it: in Cycle mode test D — E, then lower C — E from 8 to 6 and test D — E again. The search now reaches E, so D — E drops out of every MST.',
  ],
  complexityHead: ['Check', 'Cost', 'Why'],
  complexity: [
    [
      'Lightest edge across one cut',
      'O(E)',
      'Look at every edge once and compare the crossing ones with the best so far.',
    ],
    [
      'Is edge a — b in some MST?',
      'O(V + E)',
      'One breadth-first search from a over edges lighter than w(a — b), visiting each vertex and edge at most once.',
    ],
    [
      'Spanning tree size',
      'V − 1 edges',
      'A tree on V vertices always has V − 1 edges, whatever the weights.',
    ],
    ['Memory', 'O(V + E)', 'The adjacency lists, plus the side, reached and queue arrays.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'On the starting graph with S = {A, B, C}, what is the weight of the lightest edge crossing the cut?',
      answer: 5,
      tolerance: 0,
      hints: [
        'The crossing edges are the ones with one end in {A, B, C} and the other in {D, E, F}.',
      ],
      solution:
        'The crossing edges are B — D (5), C — D (6) and C — E (8). The lightest is B — D, weight 5.',
    },
    {
      type: 'number',
      prompt: 'How many edges does every spanning tree of the starting graph have?',
      answer: 5,
      unit: 'edges',
      tolerance: 0,
      hints: ['A spanning tree on V vertices has V − 1 edges.'],
      solution: 'The graph has 6 vertices, so every spanning tree has 6 − 1 = 5 edges.',
    },
    {
      type: 'number',
      prompt:
        'What is the total weight of the minimum spanning tree of the starting graph? Use Show a minimum spanning tree to check.',
      answer: 18,
      tolerance: 0,
      hints: [
        'Take edges from lightest to heaviest, skipping any edge that would close a cycle, until you have 5.',
      ],
      solution:
        'E — F (1), B — C (2), A — B (3) are taken; A — C (4) would close a cycle; B — D (5) is taken; C — D (6) would close a cycle; D — E (7) is taken. 1 + 2 + 3 + 5 + 7 = 18.',
    },
    {
      type: 'choice',
      prompt: 'In Cycle mode, what does the test say about C — D (weight 6)?',
      options: [
        'It is in every MST, because it is the only edge from C to D.',
        'It is in no MST: C → B → D uses only lighter edges, so C — D is the heaviest edge on that cycle.',
        'It is in some MST, because it crosses the cut {A, B, C}.',
        'It depends on where the search starts.',
      ],
      answer: 1,
      hints: ['Look for a route from C to D that uses only edges lighter than 6.'],
      solution:
        'C — B (2) and B — D (5) are both lighter than 6, so the cycle C → B → D → C has C — D as its strict maximum. By the cycle property no MST contains C — D. It does cross {A, B, C}, but it is not the lightest crossing edge.',
    },
    {
      type: 'multi',
      prompt: 'Which of these edges of the starting graph are in the minimum spanning tree?',
      options: ['A — C (4)', 'B — D (5)', 'C — E (8)', 'D — E (7)'],
      answers: [1, 3],
      hints: [
        'An edge is out when a route of strictly lighter edges joins its ends (cycle property).',
      ],
      solution:
        'A — C is out (A — B 3 and B — C 2 join A and C), and C — E is out (C — B, B — D, D — E all lighter than 8). B — D is the lightest edge across {A, B, C}, and D — E is the lightest edge across {A, B, C, D}, so both are in.',
    },
  ],
  nextTeaser:
    'Next up: Kruskal’s algorithm, which sorts the edges by weight and uses union-find to take each lightest edge that joins two separate pieces.',
};
