/**
 * Unweighted edge lists for graph lessons that only need which vertices are joined. Weighted
 * edge lists, with their own `indexEdges`, live in `weighted-edges.js`.
 */

/**
 * @typedef {object} PlainEdge
 * @property {number} from  Vertex id.
 * @property {number} to    Vertex id.
 */

/**
 * Numbers the vertices by sorted id and lists each edge once as a pair of indices, in input
 * order; loops, edges to unknown ids and repeated edges are dropped.
 * @param {number[]} ids
 * @param {PlainEdge[]} edges
 * @returns {{n: number, pairs: [number, number][]}}
 */
export function indexPairs(ids, edges) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const index = new Map(sorted.map((id, i) => [id, i]));
  /** @type {[number, number][]} */
  const pairs = [];
  const seen = new Set();
  for (const e of edges) {
    const a = index.get(e.from);
    const b = index.get(e.to);
    if (a === undefined || b === undefined || a === b) continue;
    const key = Math.min(a, b) * 64 + Math.max(a, b);
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push([a, b]);
  }
  return { n: sorted.length, pairs };
}
