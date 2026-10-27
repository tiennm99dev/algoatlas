/**
 * Floyd-Warshall all-pairs shortest paths on a directed weighted graph. dist[i][j] starts as
 * the direct edge weight. Phase k then allows vertex k as an intermediate stop: every pair
 * (i, j) checks whether going i → … → k → … → j beats the best path found so far. After phase
 * k, dist[i][j] is the shortest path whose intermediate vertices all come from the first k + 1
 * vertices. Negative edges are fine; a negative entry on the diagonal at the end means a
 * negative cycle. `next[i][j]` is the first step on the best path, for path reconstruction.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; k, i and j run in that
 * order. Parallel edges keep the lightest weight.
 */

/** Largest graph the lesson draws (6³ = 216 comparisons). */
export const MAX_NODES = 6;
/** Weights range from −MAX_WEIGHT to MAX_WEIGHT. */
export const MAX_WEIGHT = 99;

/**
 * @typedef {object} FwEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] Defaults to 1.
 */

/**
 * @typedef {object} FloydFrame
 * @property {'start'|'phase'|'improve'|'keep'|'done'|'negative'} kind
 * @property {number} k        Intermediate vertex allowed in this phase, -1 before the first.
 * @property {number} i        Row (start vertex) compared now, -1 when none.
 * @property {number} j        Column (end vertex) compared now, -1 when none.
 * @property {number} before   dist[i][j] before the comparison.
 * @property {number} via      dist[i][k] + dist[k][j].
 * @property {number[][]} dist Distance matrix (Infinity = no path yet).
 * @property {number[][]} next First vertex after i on the best i → j path, -1 when none.
 * @property {number} comparisons
 * @property {number} updates
 * @property {number[]} negative  Vertices with dist[v][v] < 0, filled on 'negative'.
 * @property {number[]} lines
 */

export const floydPseudocode = [
  'dist[i][j] = w(i, j) for each edge, 0 when i = j, ∞ otherwise',
  'next[i][j] = j for each edge i → j',
  'for each vertex k:    // k may now be an intermediate stop',
  '  for each vertex i:',
  '    for each vertex j:',
  '      if dist[i][k] + dist[k][j] < dist[i][j]:',
  '        dist[i][j] = dist[i][k] + dist[k][j]; next[i][j] = next[i][k]',
  'if dist[v][v] < 0 for some v: report a negative cycle',
  'return dist, next',
];

/**
 * @param {{ ids: number[], edges: FwEdge[] }} graph
 * @returns {FloydFrame[]}
 */
export function floydWarshallTrace({ ids, edges }) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const index = new Map(sorted.map((id, i) => [id, i]));
  const n = sorted.length;
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)),
  );
  const next = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? j : -1)),
  );
  for (const e of edges) {
    const u = index.get(e.from);
    const v = index.get(e.to);
    if (u === undefined || v === undefined || u === v) continue;
    const w = e.weight ?? 1;
    if (w < dist[u][v]) {
      dist[u][v] = w;
      next[u][v] = v;
    }
  }
  let comparisons = 0;
  let updates = 0;

  /** @type {FloydFrame[]} */
  const frames = [];
  /** @param {Pick<FloydFrame, 'kind'|'lines'> & Partial<FloydFrame>} f */
  const push = (f) =>
    frames.push({
      k: -1,
      i: -1,
      j: -1,
      before: Infinity,
      via: Infinity,
      negative: [],
      ...f,
      dist: dist.map((r) => r.slice()),
      next: next.map((r) => r.slice()),
      comparisons,
      updates,
    });

  push({ kind: 'start', lines: [0, 1] });
  for (let k = 0; k < n; k++) {
    push({ kind: 'phase', k, lines: [2] });
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        comparisons++;
        const before = dist[i][j];
        const via = dist[i][k] + dist[k][j];
        if (via < before) {
          dist[i][j] = via;
          next[i][j] = next[i][k];
          updates++;
          push({ kind: 'improve', k, i, j, before, via, lines: [3, 4, 5, 6] });
        } else {
          push({ kind: 'keep', k, i, j, before, via, lines: [3, 4, 5] });
        }
      }
    }
  }
  const negative = [];
  for (let v = 0; v < n; v++) if (dist[v][v] < 0) negative.push(v);
  if (negative.length) push({ kind: 'negative', negative, lines: [7] });
  else push({ kind: 'done', lines: [7, 8] });
  return frames;
}

/**
 * The best i → j path by following `next`, as vertex indices; empty when there is none or the
 * walk loops (a negative cycle on the way).
 * @param {number[][]} next
 * @param {number} i
 * @param {number} j
 */
export function pathOf(next, i, j) {
  if (next[i]?.[j] === undefined || next[i][j] < 0) return [];
  const path = [i];
  for (let at = i; at !== j;) {
    at = next[at][j];
    if (at < 0 || path.length > next.length) return [];
    path.push(at);
  }
  return path;
}
