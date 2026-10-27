/**
 * Edge relaxation on a directed weighted graph, in an order the learner chooses. Every vertex
 * starts with the distance label ∞ except the source (0). Relaxing an edge u → v of weight w
 * asks whether going through u beats the best route to v found so far: if d[u] + w < d[v],
 * lower d[v] and remember u as v's parent. Labels only ever go down and never drop below the
 * true shortest distance, so once a label is exact it stays exact.
 *
 * Vertices are indices 0..n-1; an edge index is its position in the edge list.
 */

/** Most relaxations one sequence may hold. */
export const MAX_OPS = 40;
/** Largest edge weight the lesson accepts (weights are whole numbers from 0). */
export const MAX_WEIGHT = 99;

/**
 * @typedef {object} WeightedEdge
 * @property {number} from
 * @property {number} to
 * @property {number} weight
 */

/**
 * @typedef {object} RelaxFrame
 * @property {'start'|'relax'|'done'} kind
 * @property {number} op          Position in the relaxation sequence, -1 when none.
 * @property {number} edge        Edge relaxed now, -1 when none.
 * @property {boolean} improved   The relaxation lowered d[v].
 * @property {number} before      d[v] before this relaxation (Infinity when unknown).
 * @property {number} candidate   d[u] + w for this relaxation (Infinity when d[u] is ∞).
 * @property {number[]} dist      Distance label per vertex (Infinity = ∞).
 * @property {number[]} parent    Parent per vertex in the current tree, -1 when none.
 * @property {number} relaxations Relaxations done so far.
 * @property {number} updates     Relaxations that lowered a label.
 * @property {number} exact       Vertices whose label equals the true shortest distance.
 * @property {number[]} lines
 */

export const relaxPseudocode = [
  'd[s] = 0; d[v] = ∞ and parent[v] = none for every other v',
  'for each edge (u, v, w) in the chosen order:',
  '  if d[u] + w < d[v]:',
  '    d[v] = d[u] + w',
  '    parent[v] = u',
  'return d, parent',
];

/**
 * True shortest distances from `source` (Bellman-Ford; the lesson's weights are never negative).
 * @param {number} n
 * @param {WeightedEdge[]} edges
 * @param {number} source
 * @returns {number[]} Infinity for an unreachable vertex.
 */
export function shortestDistances(n, edges, source) {
  const d = new Array(n).fill(Infinity);
  if (source < 0 || source >= n) return d;
  d[source] = 0;
  for (let round = 1; round < n; round++) {
    let changed = false;
    for (const { from, to, weight } of edges) {
      if (d[from] + weight < d[to]) {
        d[to] = d[from] + weight;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return d;
}

/**
 * The tree path from the source to `v` by parent links, source first; empty when v has none.
 * @param {number[]} parent
 * @param {number} source
 * @param {number} v
 */
export function treePath(parent, source, v) {
  /** @type {number[]} */
  const path = [];
  for (let at = v, guard = 0; at !== -1 && guard <= parent.length; at = parent[at], guard++) {
    path.push(at);
    if (at === source) return path.reverse();
  }
  return [];
}

/**
 * Relaxes the edges listed in `ops` (edge indices, repeats allowed) one by one.
 * @param {{ n: number, edges: WeightedEdge[], source: number, ops: number[] }} input
 * @returns {RelaxFrame[]}
 */
export function relaxationTrace({ n, edges, source, ops }) {
  const truth = shortestDistances(n, edges, source);
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  dist[source] = 0;
  let relaxations = 0;
  let updates = 0;

  /** @type {RelaxFrame[]} */
  const frames = [];
  /** @param {Pick<RelaxFrame, 'kind'|'op'|'edge'|'improved'|'before'|'candidate'|'lines'>} f */
  const push = (f) =>
    frames.push({
      ...f,
      dist: dist.slice(),
      parent: parent.slice(),
      relaxations,
      updates,
      exact: dist.filter((d, v) => d === truth[v]).length,
    });

  const none = { op: -1, edge: -1, improved: false, before: Infinity, candidate: Infinity };
  push({ kind: 'start', ...none, lines: [0] });
  ops.slice(0, MAX_OPS).forEach((k, op) => {
    const e = edges[k];
    if (!e) return;
    relaxations++;
    const before = dist[e.to];
    const candidate = dist[e.from] + e.weight;
    const improved = candidate < before;
    if (improved) {
      dist[e.to] = candidate;
      parent[e.to] = e.from;
      updates++;
    }
    push({
      kind: 'relax',
      op,
      edge: k,
      improved,
      before,
      candidate,
      lines: improved ? [1, 2, 3, 4] : [1, 2],
    });
  });
  push({ kind: 'done', ...none, lines: [5] });
  return frames;
}
