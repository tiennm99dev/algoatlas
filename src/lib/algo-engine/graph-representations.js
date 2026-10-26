/**
 * Builds the two classic graph representations from an edge list, one edge per step: an
 * n × n adjacency matrix and an array of adjacency lists. Vertices are numbered by their
 * position in `ids` (sorted ascending), so row i of the matrix and list i both belong to the
 * vertex `ids[i]`. A matrix cell holds 0 for "no edge", or the edge weight (1 when the graph is
 * unweighted). Weights are at least 1, so 0 never collides with a real edge.
 */

/** Largest graph the lesson draws: an 8 × 8 matrix still fits a phone screen. */
export const MAX_NODES = 8;

/**
 * @typedef {object} RepEdge
 * @property {number} from  Vertex id.
 * @property {number} to    Vertex id.
 * @property {number} [weight]
 */

/**
 * @typedef {object} ListEntry
 * @property {number} to      Index of the neighbour.
 * @property {number} weight  1 when the graph is unweighted.
 */

/**
 * @typedef {object} RepFrame
 * @property {'start'|'edge'|'mirror'|'done'} kind
 * @property {number[][]} matrix   matrix[i][j], 0 when there is no edge.
 * @property {ListEntry[][]} lists lists[i], in the order the entries were appended.
 * @property {number} from         Row just written, -1 when none.
 * @property {number} to           Column just written, -1 when none.
 * @property {number} weight       Value just written, 0 when none.
 * @property {number} edgeIndex    Index into the input edge list, -1 when none.
 * @property {number} matrixWrites Matrix cells written so far.
 * @property {number} listEntries  List entries appended so far.
 * @property {number[]} lines
 */

export const representationsPseudocode = [
  'matrix = n × n table of 0; list = n empty lists',
  'for each edge (u, v, w) in the edge list:',
  '  matrix[u][v] = w                 // w = 1 when unweighted',
  '  list[u].append((v, w))',
  '  if the graph is undirected:',
  '    matrix[v][u] = w; list[v].append((u, w))',
  'return matrix, list',
];

/**
 * The edges a representation stores: duplicates dropped, self loops dropped, and for an
 * undirected graph a pair (v, u) dropped when (u, v) came first.
 * @param {RepEdge[]} edges
 * @param {boolean} directed
 * @returns {RepEdge[]}
 */
export function cleanEdges(edges, directed) {
  const seen = new Set();
  /** @type {RepEdge[]} */
  const out = [];
  for (const e of edges) {
    if (e.from === e.to) continue;
    const key = directed || e.from < e.to ? `${e.from}>${e.to}` : `${e.to}>${e.from}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...e });
  }
  return out;
}

/**
 * @param {{ ids: number[], edges: RepEdge[], directed: boolean, weighted: boolean }} input
 *   `ids` are the vertex ids, `edges` should already be cleaned with `cleanEdges`.
 * @returns {RepFrame[]}
 */
export function representationsTrace({ ids, edges, directed, weighted }) {
  const order = ids.slice().sort((a, b) => a - b);
  const index = new Map(order.map((id, i) => [id, i]));
  const n = order.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  /** @type {ListEntry[][]} */
  const lists = Array.from({ length: n }, () => []);
  let matrixWrites = 0;
  let listEntries = 0;

  /** @type {RepFrame[]} */
  const frames = [];
  /** @param {Omit<RepFrame, 'matrix'|'lists'|'matrixWrites'|'listEntries'>} f */
  const push = (f) =>
    frames.push({
      ...f,
      matrix: matrix.map((r) => r.slice()),
      lists: lists.map((l) => l.map((e) => ({ ...e }))),
      matrixWrites,
      listEntries,
    });
  const none = { from: -1, to: -1, weight: 0, edgeIndex: -1 };

  push({ kind: 'start', ...none, lines: [0] });
  edges.forEach((e, edgeIndex) => {
    const u = index.get(e.from);
    const v = index.get(e.to);
    if (u === undefined || v === undefined) return;
    const w = weighted ? (e.weight ?? 1) : 1;
    matrix[u][v] = w;
    lists[u].push({ to: v, weight: w });
    matrixWrites++;
    listEntries++;
    push({ kind: 'edge', from: u, to: v, weight: w, edgeIndex, lines: [1, 2, 3, 4] });
    if (!directed) {
      matrix[v][u] = w;
      lists[v].push({ to: u, weight: w });
      matrixWrites++;
      listEntries++;
      push({ kind: 'mirror', from: v, to: u, weight: w, edgeIndex, lines: [4, 5] });
    }
  });
  push({ kind: 'done', ...none, lines: [6] });
  return frames;
}

/**
 * Out-degree (or degree, when undirected) of every vertex, read off the finished lists.
 * @param {ListEntry[][]} lists
 */
export function degrees(lists) {
  return lists.map((l) => l.length);
}
