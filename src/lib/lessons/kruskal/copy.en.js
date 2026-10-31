/** @typedef {import('$lib/algo-engine/kruskal.js').KruskalFrame} KruskalFrame */
/** @typedef {{u: number, v: number, w: number}} EdgeInfo */

/** @param {EdgeInfo | undefined} e @param {string[]} names */
const edgeName = (e, names) => (e ? `${names[e.u] ?? '?'} — ${names[e.v] ?? '?'}` : '');
/** @param {EdgeInfo | undefined} e @param {string[]} names */
const edgeWithWeight = (e, names) => (e ? `${edgeName(e, names)} (weight ${e.w})` : '');

export const en = {
  slug: 'kruskal',
  topic: 'mst',
  level: 'Intermediate',
  title: 'Kruskal’s algorithm',
  intro:
    'Kruskal’s algorithm builds a minimum spanning tree by sorting the edges from lightest to heaviest and taking each edge that joins two different trees. An edge whose ends are already in the same tree would close a cycle, so it is skipped. Union-find answers “same tree?” in almost constant time, so sorting is the expensive part: O(E log E).',
  summary:
    'Feed a sorted edge list into a graph you draw and watch union-find accept edges that join two trees and reject edges that would close a cycle.',
  instruction:
    'Step through the sorted edge list on the right. Each accepted edge merges two trees in the union-find forest; each rejected edge has both ends under one root. Change a weight in the table, or draw a new edge with Connect, to change the order.',
  resetGraph: 'Reset graph',
  randomWeights: 'Random weights',
  graphAria:
    'Undirected weighted graph. Each vertex shows the root of its union-find tree as a marker.',
  edgesTitle: 'Edge weights',
  /** @param {string} name */
  weightAria: (name) => `Weight of edge ${name}`,
  noEdges: 'No edges yet. Use Connect to draw one.',
  /** @param {number} max */
  badWeight: (max) => `A weight must be a whole number from 1 to ${max}. The old weight is kept.`,
  sortedTitle: 'Edges in sorted order',
  sortedAria: 'Edges sorted by weight, with what Kruskal did to each.',
  noSorted: 'No edges to sort.',
  status: { tree: 'accepted', cycle: 'rejected', current: 'now', pending: 'waiting' },
  /** @param {string} edge @param {number} w @param {string} status */
  sortedItem: (edge, w, status) => `${edge}, weight ${w}, ${status}`,
  forestTitle: 'Union-find forest (union by rank, path compression)',
  /** @param {number} sets */
  forestAria: (sets) => `Union-find forest with ${sets} ${sets === 1 ? 'tree' : 'trees'}.`,
  noVertices: 'No vertices.',
  /** @param {number} r */
  rankNote: (r) => `r${r}`,
  /** @param {string} name @param {string} parent */
  forestNode: (name, parent) =>
    parent === name ? `${name} is a root` : `${name}, parent ${parent}`,
  stats: {
    considered: 'Edges considered',
    accepted: 'Accepted',
    rejected: 'Rejected',
    components: 'Trees in the forest',
    finds: 'find calls',
    weight: 'Tree weight',
  },
  legend: {
    ends: 'Ends of the edge considered',
    root: 'Root of the vertex’s tree',
    edgeAccept: 'Edge being accepted',
    edgeReject: 'Edge being rejected',
    tree: 'Tree edge',
    rejected: 'Rejected edge',
    rank: 'r = rank',
    marks: '→ now, ✓ accepted, ✗ rejected',
  },
  /** @param {string} name @param {string} root @param {boolean} end */
  vertexLabel: (name, root, end) =>
    [`Vertex ${name}`, `in the tree of ${root}`, end ? 'end of the edge considered' : '']
      .filter(Boolean)
      .join(', '),
  /**
   * @param {KruskalFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  describe(f, names, info) {
    const e = info[f.edge];
    const n = f.parent.length;
    switch (f.kind) {
      case 'start':
        if (!n) return 'The graph has no vertices.';
        if (!f.sorted.length)
          return 'There are no edges to sort. Every vertex stays its own tree. Draw edges with Connect.';
        return `Sort the ${f.sorted.length} edges by weight: ${f.sorted.map((k) => `${edgeName(info[k], names)} ${info[k].w}`).join(', ')}. Every vertex starts as its own tree.`;
      case 'accept':
        return `Edge ${edgeWithWeight(e, names)}: find(${names[f.u]}) = ${names[f.ru]} and find(${names[f.v]}) = ${names[f.rv]} are different roots, so the edge joins two trees. Accept it and union them. Tree weight is now ${f.weight}.`;
      case 'reject':
        return `Edge ${edgeWithWeight(e, names)}: find(${names[f.u]}) = find(${names[f.v]}) = ${names[f.ru]}, so both ends are already in one tree. Adding it would close a cycle. Skip it.`;
      case 'stop': {
        const left = f.sorted.length - f.considered;
        return `The tree has V − 1 = ${f.accepted} edges, so every vertex is connected. Stop: the ${left} remaining ${left === 1 ? 'edge is' : 'edges are'} never looked at.`;
      }
      case 'done':
        if (!n) return 'Nothing to do.';
        return f.components > 1
          ? `The edges ran out with ${f.components} trees left, so the graph is not connected. The accepted ${f.accepted} edges form a minimum spanning forest of weight ${f.weight}.`
          : `Done: the minimum spanning tree has ${f.accepted} edges and weight ${f.weight}, found with ${f.finds} find calls.`;
    }
  },
  takeaways: [
    'Kruskal sorts the edges by weight and takes them from lightest to heaviest. An edge is accepted when its ends are in different trees and rejected when they are in the same one.',
    'Each accepted edge is the lightest edge across the cut between its own tree and the rest of the graph, so the cut property says it belongs in a minimum spanning tree.',
    'Union-find keeps the trees: find(u) = find(v) means u and v are already connected. With union by rank and path compression each operation costs almost O(1) (inverse Ackermann).',
    'Sorting costs O(E log E), which is O(E log V) because E < V². The loop can stop once V − 1 edges are accepted; on a disconnected graph it runs out of edges and returns a minimum spanning forest.',
    'Try it: raise D — E from 7 to 10 and step again. C — E (8) is now the lightest edge that joins {A, B, C, D} to {E, F}, so it takes D — E’s place.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'Sort the edges',
      'O(E log E)',
      'A comparison sort of E edges. Since E < V², log E < 2 log V, so this is also O(E log V).',
    ],
    [
      'Union-find over all edges',
      'O(E α(V))',
      'Two finds per edge and at most V − 1 unions; with union by rank and path compression each costs α(V), at most 4 in practice.',
    ],
    [
      'Total',
      'O(E log E)',
      'Sorting dominates. If the edges come already sorted, it is O(E α(V)).',
    ],
    ['Memory', 'O(V + E)', 'The sorted edge list, plus a parent and a rank per vertex.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'order',
      prompt: 'On the starting graph, put the accepted edges in the order Kruskal accepts them.',
      items: ['A — B (3)', 'B — D (5)', 'E — F (1)', 'D — E (7)', 'B — C (2)'],
      answer: [2, 4, 0, 1, 3],
      hints: ['Kruskal takes edges by increasing weight; accepted edges keep that order.'],
      solution:
        'By weight: E — F 1, B — C 2, A — B 3, A — C 4 (rejected), B — D 5, C — D 6 (rejected), D — E 7. The accepted ones in order are E — F, B — C, A — B, B — D, D — E.',
    },
    {
      type: 'number',
      prompt:
        'On the starting graph, how many edges does Kruskal take from the sorted list before it stops?',
      answer: 7,
      unit: 'edges',
      tolerance: 0,
      hints: [
        'It stops when the tree has V − 1 = 5 edges. Count the rejected edges on the way too.',
      ],
      solution:
        'Five accepted plus two rejected (A — C and C — D) make 7. The tree is complete after D — E, so C — E and D — F are never considered.',
    },
    {
      type: 'number',
      prompt:
        'Change the weight of D — E to 10 and run Kruskal again. What is the weight of the new minimum spanning tree?',
      answer: 19,
      tolerance: 0,
      hints: [
        'The first four accepted edges do not change. Which edge is now the lightest that reaches E or F?',
      ],
      solution:
        'E — F 1, B — C 2, A — B 3 and B — D 5 are accepted as before. Then C — D 6 is rejected and C — E 8 joins {A, B, C, D} to {E, F}: 1 + 2 + 3 + 5 + 8 = 19.',
    },
    {
      type: 'choice',
      prompt: 'Why does Kruskal use union-find instead of a graph search to test each edge?',
      options: [
        'A search would give a wrong answer on weighted graphs.',
        'find(u) = find(v) answers “already connected?” in almost O(1), while a search costs O(V) per edge.',
        'Union-find sorts the edges as a side effect.',
        'Union-find makes the tree lighter.',
      ],
      answer: 1,
      hints: ['Both give the same answer. Compare their cost over E edges.'],
      solution:
        'A search over the tree edges also tells whether u and v are connected, but costs O(V) each time, O(E·V) in all. Union-find with union by rank and path compression costs α(V) per operation.',
    },
    {
      type: 'text',
      prompt: 'What is the running time of Kruskal’s algorithm, in big-O?',
      accept: ['O(E log E)', 'O(E log V)', 'E log E', 'E log V', 'O(m log m)', 'O(m log n)'],
      hints: ['Which step is slower: sorting the edges or the union-find operations?'],
      solution:
        'Sorting the edges costs O(E log E) = O(E log V), and the union-find work is only O(E α(V)), so the total is O(E log E).',
    },
  ],
  nextTeaser:
    'Next up: Prim’s algorithm, which grows one tree from a start vertex and keeps adding the cheapest edge leaving it.',
};
