/** @typedef {import('$lib/algo-engine/practice-mst.js').BottleneckFrame} BottleneckFrame */
/** @typedef {import('$lib/algo-engine/practice-mst.js').SecondBestFrame} SecondBestFrame */
/** @typedef {import('$lib/algo-engine/practice-mst.js').TreeVerdict} TreeVerdict */
/** @typedef {{u: number, v: number, w: number}} EdgeInfo */

/** @param {EdgeInfo | undefined} e @param {string[]} names */
const edgeName = (e, names) => (e ? `${names[e.u] ?? '?'} — ${names[e.v] ?? '?'}` : '');
/** @param {EdgeInfo | undefined} e @param {string[]} names */
const withWeight = (e, names) => (e ? `${edgeName(e, names)} (${e.w})` : '');

export const en = {
  slug: 'practice-mst',
  topic: 'mst',
  level: 'Advanced',
  title: 'Practice: MST problems',
  intro:
    'A minimum spanning tree answers more than “cheapest network”. Its path between two vertices is a minimum bottleneck path, the route whose heaviest edge is as light as possible. And one swap of a tree edge for an outside edge gives the second-best spanning tree. Predict trees on a graph you edit, then check them.',
  summary:
    'Predict a minimum spanning tree and check it, then find minimum bottleneck paths and the second-best spanning tree on a graph you edit.',
  instruction:
    'In Predict, tick the edges you think form a minimum spanning tree and press Check my tree: a wrong tree gets a swap that makes it lighter. Bottleneck and Second best step through the algorithms; change the weights or the endpoints and step again.',
  modeLabel: 'Problem',
  modes: { predict: 'Predict the MST', bottleneck: 'Bottleneck path', second: 'Second best' },
  sourceLabel: 'From',
  targetLabel: 'To',
  check: 'Check my tree',
  clear: 'Clear my tree',
  resetGraph: 'Reset graph',
  graphAria: 'Undirected weighted graph for MST problems.',
  edgesTitle: 'Edges: weight, and whether it is in your tree',
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  /** @param {string} name */
  pickAria: (name) => `Edge ${name} in my tree`,
  noEdges: 'No edges yet. Use Connect to draw one.',
  /** @param {number} max */
  badWeight: (max) => `A weight must be a whole number from 1 to ${max}. The old weight is kept.`,
  predictHelp:
    'Tick edges below to build your tree. Ticked edges are drawn in yellow. The check tells you whether it is a spanning tree and whether it is minimum.',
  /** @param {number} count @param {number} need @param {number} weight */
  pickedSummary: (count, need, weight) =>
    `${count} of ${need} edges picked, total weight ${weight}.`,
  /**
   * @param {TreeVerdict} v
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  verdict(v, names, info) {
    switch (v.kind) {
      case 'disconnected':
        return 'This graph is not connected, so it has no spanning tree. Connect every vertex first.';
      case 'cycle':
        return `Not a tree: ${withWeight(info[v.closing], names)} closes a cycle with your other edges. A tree has no cycle.`;
      case 'size':
        return `A spanning tree on ${v.need + 1} vertices has exactly ${v.need} edges. You picked ${v.count}, and they contain no cycle, so ${v.count < v.need ? 'some vertices are not connected yet' : 'one more is impossible'}.`;
      case 'heavier': {
        const add = info[v.add];
        const drop = info[v.drop];
        return `A spanning tree of weight ${v.weight}, but the minimum is ${v.best}. Hint: ${withWeight(add, names)} closes a cycle with your tree on which ${withWeight(drop, names)} is heavier. Swap them to save ${drop.w - add.w}.`;
      }
      case 'minimum':
        return `Correct: a minimum spanning tree, weight ${v.weight}. No edge outside it is lighter than the heaviest tree edge on the cycle it would close.`;
    }
  },
  legend: {
    picked: 'Edge in your tree',
    swapIn: 'Edge the hint adds',
    flagged: 'Edge the hint drops, or one closing a cycle',
    skipNow: 'Edge being skipped now',
    source: 'From (s) and to (t)',
    tree: 'In the forest or the MST',
    rejected: 'Skipped: would close a cycle',
    now: 'Edge considered now',
    path: 'Path, or the swap candidate’s cycle',
    drop: 'Heaviest edge on that path (dropped)',
    add: 'Edge added by the swap',
    pathVertex: 'Vertex on the path',
  },
  sortedTitle: 'Edges in sorted order',
  emptyText: 'none',
  hotLabel: 'now',
  /** @param {EdgeInfo} e @param {string[]} names @param {string} mark */
  sortedChip: (e, names, mark) => `${edgeName(e, names)} ${e.w}${mark ? ` ${mark}` : ''}`,
  marks: { tree: '✓', cycle: '✗' },
  candidatesTitle: 'Swaps tried (add, drop → weight)',
  /** @param {EdgeInfo} add @param {EdgeInfo} drop @param {number} w @param {string[]} names */
  swapChip: (add, drop, w, names) => `+${edgeName(add, names)} −${edgeName(drop, names)} → ${w}`,
  stats: {
    picked: 'Edges picked',
    yourWeight: 'Your tree weight',
    considered: 'Edges considered',
    bottleneck: 'Bottleneck',
    pathEdges: 'Edges on the path',
    mst: 'MST weight',
    checked: 'Edges outside T tried',
    best: 'Second-best weight',
  },
  none: '—',
  /** @param {number} x */
  show: (x) => (x === Infinity ? '—' : String(x)),
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Vertex ${name}`, state].filter(Boolean).join(', '),
  states: { source: 'from', target: 'to', onPath: 'on the path' },
  /**
   * @param {BottleneckFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  describeBottleneck(f, names, info) {
    const s = names[f.source] ?? '';
    const t = names[f.target] ?? '';
    const e = info[f.edge];
    const route = f.path.map((v) => names[v]).join(' → ');
    switch (f.kind) {
      case 'start':
        return `Find a path from ${s} to ${t} whose heaviest edge is as light as possible. Take the edges from lightest to heaviest, as Kruskal does, until ${s} and ${t} are in one tree.`;
      case 'reject':
        return `Edge ${withWeight(e, names)}: both ends are already in one tree. Skip it.`;
      case 'accept':
        return `Edge ${withWeight(e, names)} joins two trees. ${s} and ${t} are still apart.`;
      case 'joined':
        return `Edge ${withWeight(e, names)} joins the tree of ${s} to the tree of ${t}. Every lighter edge was already tried, so no path can do better: the bottleneck is ${e?.w}.`;
      case 'done':
        if (f.source === f.target && f.source >= 0)
          return `${s} is both ends: the path is empty and its bottleneck is 0.`;
        if (!f.path.length) return `${t} cannot be reached from ${s}: there is no path at all.`;
        return `Minimum bottleneck path: ${route}. Its heaviest edge weighs ${f.bottleneck}. This is also the path between ${s} and ${t} in the minimum spanning tree.`;
    }
  },
  /**
   * @param {SecondBestFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  describeSecond(f, names, info) {
    const e = info[f.edge];
    const drop = info[f.drop];
    switch (f.kind) {
      case 'start':
        return f.mst === Infinity
          ? 'The graph is not connected, so it has no spanning tree at all.'
          : `The minimum spanning tree T weighs ${f.mst}. A second-best tree differs from T by one swap: add an edge outside T and drop the heaviest edge on the cycle it closes.`;
      case 'better':
        return `Add ${withWeight(e, names)}: the T-path between its ends has heaviest edge ${withWeight(drop, names)}. ${f.mst} − ${drop.w} + ${e.w} = ${f.candidate}, the best swap so far.`;
      case 'worse':
        return `Add ${withWeight(e, names)}: drop ${withWeight(drop, names)}, the heaviest on its T-path. ${f.mst} − ${drop.w} + ${e.w} = ${f.candidate}, not lighter than ${f.best}.`;
      case 'done':
        if (f.mst === Infinity) return 'No spanning tree, so no second-best one either.';
        if (f.bestAdd < 0)
          return 'Every edge is in T: the graph is a tree, so it has only one spanning tree.';
        return `Second-best spanning tree: add ${withWeight(info[f.bestAdd], names)}, drop ${withWeight(info[f.bestDrop], names)}, weight ${f.best}.${f.best === f.mst ? ' It ties with T: this graph has more than one minimum spanning tree.' : ''}`;
    }
  },
  takeaways: [
    'A tree is minimum exactly when no outside edge is lighter than the heaviest tree edge on the cycle it closes. If one is, swapping them gives a lighter tree.',
    'Minimum bottleneck path: run Kruskal until s and t meet. The edge that joins them is the bottleneck, and the path between s and t in any minimum spanning tree achieves it.',
    'Second-best spanning tree: it differs from the MST by one swap. For each outside edge, drop the heaviest edge on its tree path: O(V) per edge, O(V·E) in all, or O(E log V) with binary lifting.',
    'If the second-best weight equals the MST weight, the MST is not unique. With all weights different, the MST is unique.',
    'Try it: in Predict, pick C — E instead of D — E and check. Then try Bottleneck from A to C: the route through B beats the direct edge.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    [
      'Check a predicted tree',
      'O(V·E)',
      'Union-find finds a cycle; then each outside edge walks its tree path, O(V), to look for a lighter swap.',
    ],
    [
      'Minimum bottleneck path',
      'O(E log E)',
      'Kruskal sorts the edges and stops once s and t share a tree; the final path is one search, O(V).',
    ],
    [
      'Second-best spanning tree',
      'O(V·E)',
      'One MST, then one path walk per outside edge. Binary lifting on the tree brings it to O(E log V).',
    ],
    ['Memory', 'O(V + E)', 'The edge list, the union-find arrays and the tree’s adjacency lists.'],
  ],
  practiceTitle: 'Problems',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'On the starting graph, what is the minimum bottleneck between A and F, the smallest possible weight of the heaviest edge on a path?',
      answer: 7,
      tolerance: 0,
      hints: [
        'Choose Bottleneck path, From A, To F, and step until the two trees join.',
        'Every path to F must use E — F or D — F; to reach E or F from the left you need D — E, C — E or D — F.',
      ],
      solution:
        'Kruskal accepts E — F 1, B — C 2, A — B 3, B — D 5 and then D — E 7, which joins A’s tree to F’s. The path A → B → D → E → F has heaviest edge 7, and every lighter edge was already in, so no path does better.',
    },
    {
      type: 'number',
      prompt:
        'What is the minimum bottleneck between A and C? (Careful: there is a direct edge A — C of weight 4.)',
      answer: 3,
      tolerance: 0,
      hints: ['A path may take more edges if every one of them is lighter.'],
      solution:
        'A → B → C uses A — B 3 and B — C 2, so its heaviest edge is 3, lighter than the direct A — C 4. It is the A–C path in the minimum spanning tree.',
    },
    {
      type: 'number',
      prompt: 'What is the weight of the second-best spanning tree of the starting graph?',
      answer: 19,
      tolerance: 0,
      hints: ['Choose Second best and step: each outside edge proposes one swap.'],
      solution:
        'The MST weighs 18. The swaps give: add A — C drop A — B → 19; add C — D drop B — D → 19; add C — E drop D — E → 19; add D — F drop D — E → 20. The lightest is 19.',
    },
    {
      type: 'multi',
      prompt: 'Which single swaps turn the MST of the starting graph into a tree of weight 19?',
      options: [
        'Add A — C, drop A — B',
        'Add C — D, drop B — D',
        'Add C — E, drop D — E',
        'Add D — F, drop D — E',
      ],
      answers: [0, 1, 2],
      hints: ['New weight = 18 − (dropped weight) + (added weight).'],
      solution:
        '18 − 3 + 4 = 19, 18 − 5 + 6 = 19 and 18 − 7 + 8 = 19. Adding D — F (9) and dropping D — E (7) gives 20.',
    },
    {
      type: 'number',
      prompt:
        'Raise B — D from 5 to 9 and predict the new minimum spanning tree. What does it weigh? Check it with Check my tree.',
      answer: 19,
      tolerance: 0,
      hints: [
        'Only D’s connection changes. Which edge is now the cheapest way to reach D from {A, B, C}?',
      ],
      solution:
        'E — F 1, B — C 2 and A — B 3 stay. D is now reached by C — D 6, and D — E 7 still joins E and F: 1 + 2 + 3 + 6 + 7 = 19.',
    },
    {
      type: 'choice',
      prompt:
        'Why is the path between s and t in a minimum spanning tree a minimum bottleneck path?',
      options: [
        'Because the MST path is always the shortest path.',
        'If some s–t path had all edges lighter than the MST path’s heaviest edge f, removing f would split the tree, and swapping f for a lighter edge of that path that crosses the split would give a lighter spanning tree.',
        'Because the MST uses the lightest edge of the graph.',
        'It is not: Dijkstra is needed for bottleneck paths.',
      ],
      answer: 1,
      hints: ['Remove the heaviest tree edge on the path. What does that do to the tree?'],
      solution:
        'Removing f splits the tree into two parts, with s on one side and t on the other. Any s–t path must cross that cut. If all its edges were lighter than f, one of them crosses that cut, and swapping f for it gives a spanning tree lighter than the minimum, which is impossible. The MST path is not always the shortest path: A → B → C has total 5 against 4 for A — C.',
    },
  ],
  nextTeaser:
    'Next up: Strongly connected components, where directed graphs split into groups of vertices that can all reach each other.',
};
