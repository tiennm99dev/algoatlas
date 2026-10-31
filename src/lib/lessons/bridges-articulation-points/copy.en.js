/** @typedef {import('$lib/algo-engine/bridges-articulation-points.js').CutFrame} CutFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);

export const en = {
  slug: 'bridges-articulation-points',
  topic: 'advanced-graphs',
  level: 'Intermediate',
  title: 'Bridges and articulation points',
  intro:
    'A bridge is an edge whose removal disconnects an undirected graph; an articulation point (cut vertex) is a vertex whose removal does. They are the single points of failure of a network. One DFS finds them all in O(V + E): it numbers each vertex with its discovery time tin and computes low, the highest point its subtree can climb back to.',
  summary:
    'Run one DFS with tin and low labels to find every bridge and articulation point of an undirected graph you edit.',
  instruction:
    'Step through the DFS. Each vertex shows tin/low under it; tree edges turn lilac, back edges blue. When the DFS returns from v to u it compares low[v] with tin[u]: a bridge turns red, and an articulation point turns red with the AP mark. Use Connect to add an edge such as D — F and watch the bridge disappear.',
  resetGraph: 'Reset graph',
  graphAria: 'Undirected graph searched for bridges and articulation points.',
  pathLabel: 'DFS path (deepest first)',
  bridgesLabel: 'Bridges',
  cutsLabel: 'Articulation points',
  emptyText: 'none yet',
  noneText: 'none',
  hotLabel: 'just found',
  cutMark: 'AP',
  stats: {
    bridges: 'Bridges',
    cuts: 'Articulation points',
    visited: 'Vertices visited',
    checks: 'Edge checks',
  },
  legend: {
    current: 'Acted on now',
    path: 'On the DFS path',
    finished: 'Finished',
    cut: 'Articulation point (AP)',
    edge: 'Edge examined now',
    tree: 'Tree edge',
    back: 'Back edge',
    bridge: 'Bridge',
  },
  states: {
    current: 'current',
    path: 'on the DFS path',
    finished: 'finished',
    cut: 'articulation point',
  },
  /** @param {number} tin @param {number} low */
  tinLow: (tin, low) => `${tin}/${low}`,
  /** @param {string} name @param {string[]} states @param {number} tin @param {number} low */
  vertexLabel: (name, states, tin, low) =>
    [`Vertex ${name}`, ...states, tin >= 0 ? `tin ${tin}, low ${low}` : '']
      .filter(Boolean)
      .join(', '),
  /** @param {string} a @param {string} b */
  edgeName: (a, b) => `${a} — ${b}`,
  /**
   * @param {CutFrame} f
   * @param {string[]} names
   */
  describe(f, names) {
    const u = nm(names, f.current);
    const v = nm(names, f.other);
    switch (f.kind) {
      case 'start':
        return 'Every vertex starts unvisited. Run a DFS in letter order and label each vertex tin/low.';
      case 'enter':
        return f.current === f.root
          ? `Start a DFS tree at ${u}: tin = low = ${f.tin[f.current]}. ${u} is its root.`
          : `Enter ${u} from ${nm(names, f.parent[f.current])}: tin = low = ${f.tin[f.current]}.`;
      case 'parent':
        return `${u} — ${v} is the edge ${u} came in by. Skip it: going back along the same edge is not another route up.`;
      case 'back':
        return `${u} — ${v} is a back edge to an ancestor: low[${u}] = min(low, tin[${v}]) = ${f.low[f.current]}.`;
      case 'down':
        return `${u} — ${v}: ${v} is a finished descendant, so this back edge was already counted from ${v}’s side. Nothing changes.`;
      case 'tree':
        return `${v} is unvisited: ${u} — ${v} becomes a tree edge. Go down to ${v}.`;
      case 'return': {
        const head = `Back from ${v} to ${u}: low[${u}] = ${f.low[f.current]}. low[${v}] = ${f.low[f.other]}`;
        const t = f.tin[f.current];
        if (f.isBridge && f.isCut)
          return `${head} > tin[${u}] = ${t}: nothing under ${v} climbs back to ${u}, so ${u} — ${v} is a bridge and ${u} is an articulation point.`;
        if (f.isBridge)
          return `${head} > tin[${u}] = ${t}: nothing under ${v} climbs back to ${u}, so ${u} — ${v} is a bridge. ${
            f.current === f.root
              ? `${u} is the root, so the root rule decides whether it is a cut vertex.`
              : `${u} is already an articulation point.`
          }`;
        if (f.isCut)
          return `${head} ≥ tin[${u}] = ${t}: ${v}’s subtree reaches ${u} but nothing above it, so removing ${u} cuts it off. ${u} is an articulation point.`;
        if (f.low[f.other] >= t)
          return f.current === f.root
            ? `${head} ≥ tin[${u}] = ${t}, but ${u} is the root: the root rule decides.`
            : `${head} ≥ tin[${u}] = ${t}: ${u} is already an articulation point.`;
        return `${head} < tin[${u}] = ${t}: ${v}’s subtree climbs above ${u}, so neither the edge nor ${u} is critical here.`;
      }
      case 'root':
        return f.isCut
          ? `${u} is a root with ${f.children} tree children. They can only meet through ${u}, so ${u} is an articulation point.`
          : `${u} is a root with ${f.children} tree ${f.children === 1 ? 'child' : 'children'}, so removing it disconnects nothing. Not an articulation point.`;
      case 'done':
        return `Done: ${f.bridges.length} ${f.bridges.length === 1 ? 'bridge' : 'bridges'} and ${f.cuts.length} ${f.cuts.length === 1 ? 'articulation point' : 'articulation points'}, after ${f.checks} edge checks.`;
    }
  },
  takeaways: [
    'A DFS of an undirected graph has only tree edges and back edges: every non-tree edge joins a vertex to one of its ancestors.',
    'low[u] is the smallest tin reachable from u’s subtree using tree edges down and one back edge up. It is computed bottom-up as the DFS returns.',
    'A tree edge u — v is a bridge exactly when low[v] > tin[u]. Back edges are never bridges, because they lie on a cycle with tree edges.',
    'A non-root u is an articulation point when some child v has low[v] ≥ tin[u]; the root is one exactly when it has 2 or more tree children. A vertex can be critical even when no bridge touches it.',
    'Try it: add the edge D — F. The bridge E — F now lies on a cycle, so it disappears, and E stops being an articulation point.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    [
      'Time',
      'O(V + E)',
      'One DFS: each vertex is entered once and each edge checked from both ends.',
    ],
    [
      'Brute force',
      'O(E · (V + E))',
      'Removing each edge (or vertex) and re-checking connectivity repeats a whole search per item.',
    ],
    [
      'Memory',
      'O(V)',
      'tin, low and parent per vertex, plus the DFS call stack of depth at most V.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many bridges does the starting graph have?',
      answer: 1,
      unit: 'bridges',
      hints: ['An edge on a cycle is never a bridge. Which edge lies on no cycle?'],
      solution: 'Only E — F. Every other edge lies on one of the triangles A B C, C D E or F G H.',
    },
    {
      type: 'multi',
      prompt: 'Which vertices of the starting graph are articulation points?',
      options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      answers: [2, 4, 5],
      hints: ['Remove a vertex in your head: does the rest fall apart?'],
      solution:
        'C joins the two triangles, and E and F are the ends of the bridge. Removing any other vertex leaves the rest connected.',
    },
    {
      type: 'number',
      prompt: 'Step to the end. What is low[D]?',
      answer: 2,
      hints: ['D’s subtree is D, E, F, G, H. Which back edge from it climbs highest?'],
      solution:
        'The back edge E — C reaches tin[C] = 2, and nothing in D’s subtree reaches higher, so low[D] = 2.',
    },
    {
      type: 'choice',
      prompt:
        'C is an articulation point although no bridge touches it. Which test, at the return from D, shows that?',
      options: [
        'low[D] = 2 > tin[C] = 2',
        'low[D] = 2 ≥ tin[C] = 2',
        'tin[D] = 3 > tin[C] = 2',
        'C has two tree children',
      ],
      answer: 1,
      hints: ['The bridge test is strict; the articulation-point test is not.'],
      solution:
        'low[D] = tin[C]: D’s subtree climbs back to C but no higher, so C — D is not a bridge (the back edge E — C goes around it), yet removing C cuts that subtree off.',
    },
    {
      type: 'number',
      prompt: 'Use Connect to add the edge D — F. How many bridges are left?',
      answer: 0,
      unit: 'bridges',
      hints: ['Does E — F lie on a cycle now?'],
      solution:
        'E — F — D — E is a cycle, so E — F is no longer a bridge, and every edge now lies on some cycle: 0 bridges. C and F stay articulation points.',
    },
  ],
  nextTeaser:
    'Next up: Eulerian paths and circuits, tracing every edge exactly once with Hierholzer’s algorithm.',
};
