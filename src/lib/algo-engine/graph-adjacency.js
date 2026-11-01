/**
 * Adjacency lists for the graph lessons. Vertices are numbered by ascending
 * id (see `indexEdges`), and every list is sorted by the other end, then by
 * edge index, so a trace visits neighbours in a fixed, readable order.
 */
import { indexEdges } from './weighted-edges.js';

/** @typedef {{ to: number, edge: number }} Arc  One end of an edge, with the edge's input index. */

/**
 * Arcs out of (and, for a directed graph, into) each vertex. An undirected
 * edge appears in the lists of both its ends; `inn` is then empty lists.
 * @param {number[]} ids
 * @param {Array<{ from: number, to: number, weight?: number }>} edges
 * @param {boolean} directed
 * @returns {{ n: number, out: Arc[][], inn: Arc[][] }}
 */
export function arcLists(ids, edges, directed) {
  const { n, list } = indexEdges(ids, edges);
  /** @type {Arc[][]} */
  const out = Array.from({ length: n }, () => []);
  /** @type {Arc[][]} */
  const inn = Array.from({ length: n }, () => []);
  for (const { u, v, edge } of list) {
    out[u].push({ to: v, edge });
    if (directed) inn[v].push({ to: u, edge });
    else out[v].push({ to: u, edge });
  }
  const byEnd = (/** @type {Arc} */ a, /** @type {Arc} */ b) => a.to - b.to || a.edge - b.edge;
  for (const l of out) l.sort(byEnd);
  for (const l of inn) l.sort(byEnd);
  return { n, out, inn };
}

/**
 * Plain neighbour lists: the other end of every arc, in the same order.
 * @param {Arc[][]} lists
 * @returns {number[][]}
 */
export function neighbourLists(lists) {
  return lists.map((l) => l.map((a) => a.to));
}
