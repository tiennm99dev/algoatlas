/**
 * Shared pieces of the edge-list shortest-path engines (Bellman-Ford, Johnson and the
 * shortest-path practice): vertex ids mapped to indices with the edges listed between them,
 * and the walk that reads a negative cycle back out of the parent links.
 */

/**
 * @typedef {object} WeightedEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] Defaults to 1.
 */

/**
 * @typedef {object} IndexedEdge
 * @property {number} u     Index of the tail vertex.
 * @property {number} v     Index of the head vertex.
 * @property {number} w     Weight.
 * @property {number} edge  Position of the edge in the input list.
 */

/**
 * Numbers the vertices by ascending id and lists the edges between them by index, in input
 * order. Loops and edges to unknown ids are left out.
 * @param {number[]} ids
 * @param {WeightedEdge[]} edges
 * @returns {{ n: number, list: IndexedEdge[] }}
 */
export function indexEdges(ids, edges) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const index = new Map(sorted.map((id, i) => [id, i]));
  /** @type {IndexedEdge[]} */
  const list = [];
  edges.forEach((e, k) => {
    const u = index.get(e.from);
    const v = index.get(e.to);
    if (u !== undefined && v !== undefined && u !== v)
      list.push({ u, v, w: e.weight ?? 1, edge: k });
  });
  return { n: sorted.length, list };
}

/**
 * Follows parent links back from a vertex that an edge could still improve, lands on the
 * cycle after n steps, and lists the cycle in edge order, smallest vertex first. Empty when
 * the links never close a cycle.
 * @param {number[]} parent  Parent links with the improving edge applied (-1 for none).
 * @param {number} start
 * @param {number} n  Number of vertices the walk may pass.
 * @returns {number[]}
 */
export function cycleFrom(parent, start, n) {
  let x = start;
  for (let i = 0; i < n && x >= 0; i++) x = parent[x];
  if (x < 0) return [];
  const cycle = [x];
  for (let y = parent[x]; y !== x; y = parent[y]) {
    if (y < 0 || cycle.length > n) return [];
    cycle.push(y);
  }
  cycle.reverse();
  // Start at the smallest vertex so the same cycle always reads the same way.
  const at = cycle.indexOf(Math.min(...cycle));
  return [...cycle.slice(at), ...cycle.slice(0, at)];
}
