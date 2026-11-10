/**
 * Ford-Fulkerson on a directed flow network: while the residual graph has a path from the source
 * s to the sink t, push the path's bottleneck (its smallest residual capacity) along it. A
 * residual arc is either a real edge u → v with spare room c − f, or the reverse v → u of an edge
 * that carries flow f, which cancels some of that flow. The path is found by depth-first search,
 * trying each vertex's arcs in order of the far end, forward arcs first. With whole-number
 * capacities every push adds at least 1, so the loop ends; when no path is left the flow is
 * maximum.
 *
 * The network helpers here (`flowNetwork`, `residualAdjacency`, `residual`, `pushAlong`,
 * `flowByEdge`) are shared with the other flow lessons' engines.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; edges keep their order and
 * their `weight` is the capacity.
 */

import { indexEdges } from './weighted-edges.js';

/** Largest network the lessons draw. */
export const MAX_NODES = 7;
/** Capacities range from 1 to MAX_CAPACITY, which keeps the number of pushes small. */
export const MAX_CAPACITY = 20;

/**
 * @typedef {object} CapEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] The capacity; defaults to 1.
 */

/**
 * @typedef {object} NetEdge
 * @property {number} u     Tail index.
 * @property {number} v     Head index.
 * @property {number} cap
 * @property {number} edge  Position of the edge in the input list.
 */

/**
 * One arc of the residual graph: edge `i` of the network list, forwards (u → v, room c − f) or
 * backwards (v → u, room f).
 * @typedef {object} ResidualArc
 * @property {number} i
 * @property {boolean} forward
 * @property {number} from
 * @property {number} to
 */

/**
 * A step of an augmenting path, by input edge.
 * @typedef {object} PathArc
 * @property {number} edge     Position of the edge in the input list.
 * @property {boolean} forward False when the path uses the edge backwards (cancelling flow).
 * @property {number} from     Vertex index the path leaves.
 * @property {number} to       Vertex index the path enters.
 */

/**
 * Numbers the vertices and lists the edges with their capacities. Loops and edges to unknown ids
 * are left out.
 * @param {number[]} ids
 * @param {CapEdge[]} edges
 * @returns {{ n: number, list: NetEdge[] }}
 */
export function flowNetwork(ids, edges) {
  const { n, list } = indexEdges(ids, edges);
  return { n, list: list.map(({ u, v, w, edge }) => ({ u, v, cap: Math.max(0, w), edge })) };
}

/**
 * The arcs leaving each vertex in the residual graph (whether or not they have room now),
 * sorted by the far end, forward arcs before backward ones, then by edge.
 * @param {number} n
 * @param {NetEdge[]} list
 * @returns {ResidualArc[][]}
 */
export function residualAdjacency(n, list) {
  /** @type {ResidualArc[][]} */
  const out = Array.from({ length: n }, () => []);
  list.forEach(({ u, v }, i) => {
    out[u].push({ i, forward: true, from: u, to: v });
    out[v].push({ i, forward: false, from: v, to: u });
  });
  for (const arcs of out)
    arcs.sort((a, b) => a.to - b.to || Number(b.forward) - Number(a.forward) || a.i - b.i);
  return out;
}

/**
 * Room left on a residual arc.
 * @param {NetEdge[]} list @param {number[]} flow  Flow per list edge. @param {ResidualArc} a
 */
export const residual = (list, flow, a) => (a.forward ? list[a.i].cap - flow[a.i] : flow[a.i]);

/**
 * Pushes `b` units along a path of residual arcs: adds on forward arcs, cancels on backward ones.
 * @param {number[]} flow  Flow per list edge, changed in place.
 * @param {ResidualArc[]} path
 * @param {number} b
 */
export function pushAlong(flow, path, b) {
  for (const a of path) flow[a.i] += a.forward ? b : -b;
}

/**
 * Flow per input edge (0 for edges the network left out).
 * @param {NetEdge[]} list @param {number[]} flow @param {number} count  Number of input edges.
 */
export function flowByEdge(list, flow, count) {
  const out = new Array(count).fill(0);
  list.forEach((e, i) => (out[e.edge] = flow[i]));
  return out;
}

/**
 * Residual arcs as path steps by input edge.
 * @param {NetEdge[]} list @param {ResidualArc[]} path @returns {PathArc[]}
 */
export const pathArcs = (list, path) =>
  path.map((a) => ({ edge: list[a.i].edge, forward: a.forward, from: a.from, to: a.to }));

/**
 * Smallest room on a path of residual arcs (0 for an empty path).
 * @param {NetEdge[]} list @param {number[]} flow @param {ResidualArc[]} path
 */
export function bottleneck(list, flow, path) {
  return path.length ? Math.min(...path.map((a) => residual(list, flow, a))) : 0;
}

/**
 * Net flow out of the source.
 * @param {NetEdge[]} list @param {number[]} flow @param {number} s
 */
export function flowValue(list, flow, s) {
  let value = 0;
  list.forEach((e, i) => {
    if (e.u === s) value += flow[i];
    if (e.v === s) value -= flow[i];
  });
  return value;
}

/**
 * @typedef {object} FordFulkersonFrame
 * @property {'start'|'path'|'push'|'none'|'done'} kind
 * @property {number[]} flow         Flow per input edge.
 * @property {PathArc[]} path        The augmenting path found by the latest search.
 * @property {number} bottleneck     Smallest residual capacity on the path.
 * @property {number} value          Flow value so far (net flow out of s).
 * @property {number} augmentations  Paths pushed so far.
 * @property {number} checks         Residual arcs looked at by every search so far.
 * @property {number[]} seen         Vertices the latest search reached, in visiting order.
 * @property {number[]} lines
 */

export const fordFulkersonPseudocode = [
  'f(u, v) = 0 for every edge',
  'while the residual graph has a path P from s to t (depth-first search):',
  '  b = smallest residual capacity on P',
  '  for each arc (u, v) on P:',
  '    if (u, v) is an edge: f(u, v) += b',
  '    else: f(v, u) −= b   (cancel flow on the reverse edge)',
  'return f; its value is the net flow out of s',
];

/**
 * @param {{ ids: number[], edges: CapEdge[], source: number, sink: number }} input
 *   `source` and `sink` are vertex indices.
 * @returns {FordFulkersonFrame[]}
 */
export function fordFulkersonTrace({ ids, edges, source, sink }) {
  const { n, list } = flowNetwork(ids, edges);
  const adj = residualAdjacency(n, list);
  const flow = new Array(list.length).fill(0);
  const valid = source >= 0 && source < n && sink >= 0 && sink < n && source !== sink;
  let value = 0;
  let augmentations = 0;
  let checks = 0;
  let b = 0;
  /** @type {ResidualArc[]} */
  let path = [];
  /** @type {number[]} */
  let seen = [];

  /** @type {FordFulkersonFrame[]} */
  const frames = [];
  /** @param {FordFulkersonFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      flow: flowByEdge(list, flow, edges.length),
      path: pathArcs(list, path),
      bottleneck: b,
      value,
      augmentations,
      checks,
      seen: seen.slice(),
      lines,
    });

  /** Depth-first search for a path with room; fills `path` and `seen`. */
  function search() {
    const mark = new Array(n).fill(false);
    /** @type {(ResidualArc | null)[]} */
    const via = new Array(n).fill(null);
    seen = [];
    /** @param {number} u @returns {boolean} */
    const dfs = (u) => {
      mark[u] = true;
      seen.push(u);
      if (u === sink) return true;
      for (const a of adj[u]) {
        checks++;
        if (!mark[a.to] && residual(list, flow, a) > 0) {
          via[a.to] = a;
          if (dfs(a.to)) return true;
        }
      }
      return false;
    };
    path = [];
    if (!dfs(source)) return false;
    for (let x = sink; x !== source;) {
      const a = /** @type {ResidualArc} */ (via[x]);
      path.unshift(a);
      x = a.from;
    }
    return true;
  }

  push('start', [0]);
  if (valid) {
    while (search()) {
      b = bottleneck(list, flow, path);
      push('path', [1, 2]);
      pushAlong(flow, path, b);
      value += b;
      augmentations++;
      const lines = [3];
      if (path.some((a) => a.forward)) lines.push(4);
      if (path.some((a) => !a.forward)) lines.push(5);
      push('push', lines);
    }
    b = 0;
    push('none', [1]);
  }
  path = [];
  push('done', [6]);
  return frames;
}
