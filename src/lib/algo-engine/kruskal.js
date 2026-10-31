/**
 * Kruskal’s algorithm on an undirected weighted graph. The edges are sorted by weight (ties by
 * input order, a stable sort) and taken one by one; union-find tells whether an edge’s ends are
 * already in the same tree. An edge joining two different trees is accepted and the trees are
 * merged; one with both ends in the same tree would close a cycle and is rejected. The loop
 * stops as soon as the tree has V − 1 edges. On a disconnected graph it runs out of edges first
 * and returns a minimum spanning forest.
 *
 * Union-find uses union by rank and full path compression. `union(u, v)` hangs the root of
 * smaller rank under the other; on equal ranks the root of v goes under the root of u, whose
 * rank grows by one.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; edges keep their input
 * order.
 */

import { indexEdges } from './weighted-edges.js';

/** Largest graph the lesson draws. */
export const MAX_NODES = 8;
/** Largest edge weight the lesson accepts (the smallest is 1). */
export const MAX_WEIGHT = 99;

/**
 * @typedef {object} UEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] Defaults to 1.
 */

/**
 * @typedef {object} KruskalFrame
 * @property {'start'|'accept'|'reject'|'stop'|'done'} kind
 * @property {number} edge        Input index of the edge considered now, -1 when none.
 * @property {number} pos         Its position in the sorted order, -1 when none.
 * @property {number} u           Its ends as vertex numbers, -1 when none.
 * @property {number} v
 * @property {number} ru          Root of u’s tree before any union, -1 when none.
 * @property {number} rv          Root of v’s tree before any union, -1 when none.
 * @property {number[]} sorted    Edge indices in the order Kruskal takes them.
 * @property {('' | 'tree' | 'cycle')[]} status  Per input edge: accepted, rejected, or not yet.
 * @property {number[]} parent    Union-find parent per vertex.
 * @property {number[]} rank
 * @property {number} considered  Edges taken from the sorted list so far.
 * @property {number} finds       Calls to find.
 * @property {number} hops        Parent links followed inside find.
 * @property {number} accepted
 * @property {number} rejected
 * @property {number} weight      Total weight of the accepted edges.
 * @property {number} components  Trees in the forest (V − accepted).
 * @property {number[]} lines
 */

export const kruskalPseudocode = [
  'sort the edges by weight',
  'make every vertex its own set; tree = []',
  'for each edge u — v in sorted order:',
  '  if tree has V − 1 edges: stop',
  '  if find(u) = find(v): skip it   // it would close a cycle',
  '  union(u, v); add u — v to tree',
  'return tree',
];

/**
 * Numbers the vertices and lists every input edge by its ends' numbers. An edge that is a loop
 * or names an unknown vertex keeps u = v = -1 and is never considered.
 * @param {number[]} ids
 * @param {UEdge[]} edges
 */
export function edgeList(ids, edges) {
  const { n, list: indexed } = indexEdges(ids, edges);
  const list = edges.map((e) => ({ u: -1, v: -1, w: e.weight ?? 1 }));
  for (const { u, v, w, edge } of indexed) list[edge] = { u, v, w };
  return { n, list };
}

/**
 * @param {{ ids: number[], edges: UEdge[] }} input
 * @returns {KruskalFrame[]}
 */
export function kruskalTrace({ ids, edges }) {
  const { n, list } = edgeList(ids, edges);
  const sorted = list
    .map((_, k) => k)
    .filter((k) => list[k].u >= 0 && list[k].v >= 0 && list[k].u !== list[k].v)
    .sort((a, b) => list[a].w - list[b].w || a - b);
  const parent = [...Array(n).keys()];
  const rank = new Array(n).fill(0);
  /** @type {('' | 'tree' | 'cycle')[]} */
  const status = list.map(() => '');
  let considered = 0;
  let finds = 0;
  let hops = 0;
  let accepted = 0;
  let rejected = 0;
  let weight = 0;

  /** @param {number} x */
  function find(x) {
    finds++;
    let r = x;
    while (parent[r] !== r) {
      r = parent[r];
      hops++;
    }
    while (parent[x] !== r) {
      const next = parent[x];
      parent[x] = r;
      x = next;
    }
    return r;
  }

  /** @type {KruskalFrame[]} */
  const frames = [];
  /** @param {Pick<KruskalFrame, 'kind'|'lines'> & Partial<KruskalFrame>} f */
  const push = (f) =>
    frames.push({
      edge: -1,
      pos: -1,
      u: -1,
      v: -1,
      ru: -1,
      rv: -1,
      ...f,
      sorted: sorted.slice(),
      status: status.slice(),
      parent: parent.slice(),
      rank: rank.slice(),
      considered,
      finds,
      hops,
      accepted,
      rejected,
      weight,
      components: n - accepted,
    });

  push({ kind: 'start', lines: [0, 1] });
  for (let pos = 0; pos < sorted.length; pos++) {
    if (accepted === n - 1) {
      push({ kind: 'stop', lines: [2, 3] });
      break;
    }
    const k = sorted[pos];
    const { u, v, w } = list[k];
    considered++;
    const ru = find(u);
    const rv = find(v);
    const base = { edge: k, pos, u, v, ru, rv };
    if (ru === rv) {
      rejected++;
      status[k] = 'cycle';
      push({ kind: 'reject', ...base, lines: [2, 4] });
      continue;
    }
    if (rank[ru] < rank[rv]) parent[ru] = rv;
    else {
      parent[rv] = ru;
      if (rank[ru] === rank[rv]) rank[ru]++;
    }
    accepted++;
    weight += w;
    status[k] = 'tree';
    push({ kind: 'accept', ...base, lines: [2, 4, 5] });
  }
  push({ kind: 'done', lines: [6] });
  return frames;
}
