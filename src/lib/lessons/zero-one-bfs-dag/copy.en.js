/** @typedef {import('$lib/algo-engine/zero-one-bfs-dag.js').ZeroOneFrame} ZeroOneFrame */
/** @typedef {import('$lib/algo-engine/zero-one-bfs-dag.js').DagFrame} DagFrame */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : d === -Infinity ? '−∞' : String(d).replace('-', '−'));

export const en = {
  slug: 'zero-one-bfs-dag',
  topic: 'shortest-paths',
  level: 'Intermediate',
  title: '0-1 BFS and DAG shortest paths',
  intro:
    'Dijkstra needs a heap because it must always find the closest unsettled vertex. Two common special cases get that order for free in O(V + E). When every weight is 0 or 1, a double-ended queue keeps vertices sorted by distance. When the graph is a DAG, relaxing vertices in topological order works even with negative weights, and the same pass finds longest paths.',
  summary:
    'Step through 0-1 BFS with a deque and DAG shortest and longest paths in topological order.',
  instruction:
    'Pick a mode and step through. In 0-1 BFS, watch a 0-edge put its target at the front of the deque and a 1-edge at the back. In the DAG modes, watch the pass follow the topological order. Toggle or type edge weights, or change the source, and run again.',
  modeLabel: 'Mode',
  modes: { zeroOne: '0-1 BFS', short: 'DAG shortest', long: 'DAG longest' },
  sourceLabel: 'Source',
  resetWeights: 'Reset weights',
  graphAria: {
    zeroOne: 'Directed graph with edge weights 0 and 1. Each vertex shows its distance label d.',
    dag: 'Directed acyclic weighted graph. Each vertex shows its distance label d.',
  },
  edgesTitle: 'Edge weights',
  /** @param {number} w */
  toggleText: (w) => `w = ${w}`,
  /** @param {string} name @param {number} w */
  toggleAria: (name, w) => `Edge ${name} has weight ${w}. Press to make it ${1 - w}.`,
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  /** @param {number} max */
  badWeight: (max) =>
    `A weight must be a whole number from −${max} to ${max}. The old weight is kept.`,
  dequeTitle: 'Deque (front on the left)',
  /** @param {string[]} items */
  dequeAria: (items) =>
    items.length ? `Deque, front to back: ${items.join(', ')}.` : 'The deque is empty.',
  staleTag: 'stale',
  orderTitle: 'Topological order',
  orderAria: 'Topological order; the pass relaxes each vertex’s edges from left to right.',
  pointer: 'u',
  stats: {
    pops: 'Pops',
    pushFront: 'Pushed to front',
    pushBack: 'Pushed to back',
    relaxations: 'Edges examined',
    updates: 'Labels changed',
  },
  legend: {
    current: 'Being expanded',
    neighbor: 'Neighbour examined',
    queued: 'In the deque',
    done: 'Done (label final)',
    passed: 'Already passed in the order',
    pushed: 'Entry just pushed',
    stale: 'Stale entry',
    edgeNow: 'Edge examined now',
    tree: 'Parent edge',
  },
  states: {
    source: 'source',
    current: 'current',
    neighbor: 'neighbour examined',
    queued: 'in the deque',
    done: 'done',
    passed: 'passed',
  },
  /** @param {number} d */
  dNote: (d) => `d ${show(d)}`,
  /** @param {string} name @param {number} d @param {string} state */
  vertexLabel: (name, d, state) =>
    [`Vertex ${name}`, `d = ${show(d)}`, state].filter(Boolean).join(', '),
  /**
   * @param {ZeroOneFrame} f
   * @param {string[]} names
   */
  describeZeroOne(f, names) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    switch (f.kind) {
      case 'start':
        return f.deque.length
          ? `Set d[${names[f.deque[0].v]}] = 0, every other label ∞, and put ${names[f.deque[0].v]} in the deque.`
          : 'The source is not in the graph.';
      case 'pop':
        return `Pop ${u} from the front. Its label ${show(f.dist[f.current])} is the smallest in the deque, so it is final: mark ${u} done.`;
      case 'skip':
        return `Pop ${u} again: this copy was pushed before a shorter route was found, and ${u} is already done. Skip it.`;
      case 'improve':
        return f.front
          ? `Edge ${u} → ${v} has weight 0: d[${v}] = ${show(f.dist[f.current])} + 0 = ${f.dist[f.neighbor]} < ${show(f.before)}. Same distance as ${u}, so push ${v} to the front.`
          : `Edge ${u} → ${v} has weight 1: d[${v}] = ${show(f.dist[f.current])} + 1 = ${f.dist[f.neighbor]} < ${show(f.before)}. One more than ${u}, so push ${v} to the back.`;
      case 'keep':
        return `Edge ${u} → ${v} (weight ${f.weight}): ${show(f.dist[f.current])} + ${f.weight} = ${show(f.dist[f.current] + f.weight)} is not less than d[${v}] = ${show(f.before)}. Keep it.`;
      case 'done': {
        const missed = f.dist.filter((d) => d === Infinity).length;
        return `The deque is empty after ${f.pops} pops, ${f.pushFront} to the front and ${f.pushBack} to the back. Every label is final.${missed ? ` ${missed} unreachable ${missed === 1 ? 'vertex keeps' : 'vertices keep'} ∞.` : ''}`;
      }
    }
  },
  /**
   * @param {DagFrame} f
   * @param {string[]} names
   * @param {boolean} longest
   */
  describeDag(f, names, longest) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const none = longest ? '−∞' : '∞';
    const sum = `${show(f.dist[f.current])} + ${show(f.weight)} = ${show(f.dist[f.current] + f.weight)}`;
    switch (f.kind) {
      case 'start':
        return `Sort the DAG topologically: ${f.order.map((i) => names[i]).join(', ')}. Every edge points from left to right in this order.`;
      case 'init':
        return `Set the source’s label to 0 and every other label to ${none}.`;
      case 'skip':
        return `${u} still has d = ${none}: the source cannot reach it, so its edges cannot help. Move on.`;
      case 'take':
        return `Take ${u}. Every edge into ${u} comes from a vertex earlier in the order, so d[${u}] = ${show(f.dist[f.current])} is already final. Relax its out-edges.`;
      case 'improve':
        return longest
          ? `Edge ${u} → ${v} (weight ${show(f.weight)}): ${sum} > ${show(f.before)}. A longer path, so raise d[${v}].`
          : `Edge ${u} → ${v} (weight ${show(f.weight)}): ${sum} < ${show(f.before)}. Lower d[${v}].`;
      case 'keep':
        return `Edge ${u} → ${v} (weight ${show(f.weight)}): ${sum} is not ${longest ? 'more' : 'less'} than d[${v}] = ${show(f.before)}. Keep it.`;
      case 'done':
        return `One pass over the order relaxed ${f.relaxations} edges, each once, and every label is final: the ${longest ? 'longest' : 'shortest'} path weights from the source.`;
      case 'cycle':
        return 'This graph has a cycle, so it has no topological order.';
    }
  },
  takeaways: [
    '0-1 BFS: when every weight is 0 or 1, push the target of a 0-edge to the front of a deque and the target of a 1-edge to the back. The deque always holds labels d and d + 1 in order, so the front is always a closest vertex, as in Dijkstra, at O(1) per push.',
    'A vertex may be pushed twice when a 0-edge later beats an earlier 1-edge. The later copy is skipped, just like a stale heap entry.',
    'DAG shortest paths: relax every vertex’s out-edges in topological order. When u’s turn comes, every edge into u has already been relaxed, so d[u] is final. Negative weights are fine, since a DAG has no cycles at all.',
    'Longest paths are hard in general graphs, but in a DAG the same pass finds them: start at −∞ and keep the larger sum. That is the critical path of a task schedule.',
    'Try it: in 0-1 BFS, switch E → T to weight 1 and see T get one deque entry instead of two; in DAG longest, compare Z’s path with the shortest one.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    [
      '0-1 BFS',
      'O(V + E)',
      'Each vertex is expanded once and each edge examined once; deque pushes and pops are O(1).',
    ],
    [
      'DAG shortest or longest',
      'O(V + E)',
      'Topological sort in O(V + E), then one pass that relaxes each edge exactly once.',
    ],
    [
      'Memory',
      'O(V + E)',
      'Labels and parents, plus a deque of up to one entry per successful relaxation, or the in-degrees and order of the topological sort.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'In 0-1 BFS on the starting graph from S, how many times is T popped from the deque?',
      answer: 2,
      unit: 'times',
      tolerance: 0,
      hints: [
        'T is first reached from D by a 1-edge, then from E by a 0-edge.',
        'Each improvement pushes one entry, and each entry is popped once.',
      ],
      solution:
        'D → T pushes T to the back with d = 2. Then E → T, weight 0, lowers d[T] to 1 and pushes T to the front. T is popped twice: first as done with d = 1, then the stale copy is skipped.',
    },
    {
      type: 'number',
      prompt: 'In 0-1 BFS on the starting graph from S, what is d[T]?',
      answer: 1,
      tolerance: 0,
      hints: ['Find a path from S to T that uses as few 1-edges as possible.'],
      solution:
        'S → B → C → E → T has weights 0, 0, 1, 0, so d[T] = 1. No path avoids every 1-edge.',
    },
    {
      type: 'number',
      prompt: 'In DAG shortest mode from S with the starting weights, what is d[Z]?',
      answer: 3,
      tolerance: 0,
      hints: ['The negative edges X → Y and Y → Z help.', 'Try S → X → Y → Z.'],
      solution:
        'S → X → Y → Z weighs 6 − 1 − 2 = 3, less than S → T → Z (2 + 2 = 4). The pass finds it because X, Y and Z are relaxed in topological order.',
    },
    {
      type: 'number',
      prompt: 'Switch to DAG longest from S with the starting weights. What is d[Z]?',
      answer: 10,
      tolerance: 0,
      hints: ['X is best reached through T: 2 + 7 = 9.'],
      solution:
        'S → T → X → Z weighs 2 + 7 + 1 = 10. The other routes to Z are lighter: S → T → Z is 4 and S → T → X → Y → Z is 6.',
    },
    {
      type: 'choice',
      prompt: 'Why can the DAG method handle negative weights while Dijkstra cannot?',
      options: [
        'It checks every path one by one.',
        'It finalises a vertex only after every edge into it has been relaxed, which the topological order guarantees.',
        'It adds a constant to make every weight positive.',
        'Negative weights cannot occur in a DAG.',
      ],
      answer: 1,
      hints: ['Ask what has happened to the edges into u by the time u is taken.'],
      solution:
        'In topological order every predecessor of u comes first, so all edges into u are relaxed before u is used. Dijkstra instead finalises by smallest label, which a later negative edge can undercut.',
    },
  ],
  nextTeaser:
    'Next up: Bellman-Ford, which handles negative weights on any graph and detects negative cycles.',
};
