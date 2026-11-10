/**
 * The max-flow min-cut theorem, constructively. First a maximum flow (Edmonds-Karp: shortest
 * augmenting paths by BFS). Then one more BFS from s over the residual arcs with room: the
 * vertices it reaches form S, every other vertex forms T. Each edge from S to T is saturated
 * (otherwise its head would be reachable) and each edge from T to S carries nothing (otherwise
 * its backward arc would reach the tail), so the cut's capacity equals the flow value. No flow
 * exceeds any cut, so this cut is a minimum one and this flow a maximum one.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; edge weights are
 * capacities.
 */

import {
  bottleneck,
  flowByEdge,
  flowNetwork,
  pathArcs,
  pushAlong,
  residual,
  residualAdjacency,
} from './ford-fulkerson.js';

export { MAX_CAPACITY, MAX_NODES } from './ford-fulkerson.js';

/** @typedef {import('./ford-fulkerson.js').CapEdge} CapEdge */
/** @typedef {import('./ford-fulkerson.js').PathArc} PathArc */
/** @typedef {import('./ford-fulkerson.js').ResidualArc} ResidualArc */

/**
 * @typedef {object} MinCutFrame
 * @property {'start'|'augment'|'maxflow'|'visit'|'cut'|'done'} kind
 * @property {number[]} flow         Flow per input edge.
 * @property {PathArc[]} path        The path just pushed, on 'augment'.
 * @property {number} bottleneck     Amount pushed on 'augment'.
 * @property {number} value          Flow value so far.
 * @property {number} augmentations
 * @property {number} at             Vertex the reachability BFS takes from its queue, −1 otherwise.
 * @property {number[]} found        Vertices that vertex reached for the first time.
 * @property {boolean[]} side        Reached from s through arcs with room (the S side so far).
 * @property {number[]} queue        BFS queue after this step.
 * @property {number[]} cut          Input edges from S to T, on 'cut' and 'done'.
 * @property {number} cutCapacity    Their total capacity.
 * @property {number[]} lines
 */

export const minCutPseudocode = [
  'find a maximum flow f (here with Edmonds-Karp)',
  '  push along shortest augmenting paths while one exists',
  'no s → t path with room is left in the residual graph',
  'S = {s}; BFS from s over residual arcs with room:',
  '  for each arc u → v with room and v not in S: add v to S',
  'T = all other vertices; cut edges = edges from S to T',
  'c(S, T) = sum of their capacities = |f|',
  'return the minimum cut (S, T)',
];

/**
 * Capacity of the cut whose source side is `inS`: the total capacity of the edges leaving it.
 * @param {number[]} ids
 * @param {CapEdge[]} edges
 * @param {boolean[]} inS  By vertex index.
 */
export function cutCapacity(ids, edges, inS) {
  const { list } = flowNetwork(ids, edges);
  return list.reduce((sum, e) => sum + (inS[e.u] && !inS[e.v] ? e.cap : 0), 0);
}

/**
 * @param {{ ids: number[], edges: CapEdge[], source: number, sink: number }} input
 *   `source` and `sink` are vertex indices.
 * @returns {MinCutFrame[]}
 */
export function minCutTrace({ ids, edges, source, sink }) {
  const { n, list } = flowNetwork(ids, edges);
  const adj = residualAdjacency(n, list);
  const flow = new Array(list.length).fill(0);
  const valid = source >= 0 && source < n && sink >= 0 && sink < n && source !== sink;
  /** @type {ResidualArc[]} */
  let path = [];
  let b = 0;
  let value = 0;
  let augmentations = 0;
  let at = -1;
  /** @type {number[]} */
  let found = [];
  let side = new Array(n).fill(false);
  /** @type {number[]} */
  let queue = [];
  /** @type {number[]} */
  let cut = [];
  let capacity = 0;

  /** @type {MinCutFrame[]} */
  const frames = [];
  /** @param {MinCutFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      flow: flowByEdge(list, flow, edges.length),
      path: pathArcs(list, path),
      bottleneck: b,
      value,
      augmentations,
      at,
      found: found.slice(),
      side: side.slice(),
      queue: queue.slice(),
      cut: cut.slice(),
      cutCapacity: capacity,
      lines,
    });

  /** Shortest path with room from s to t, or null. */
  function shortest() {
    /** @type {(ResidualArc | null)[]} */
    const via = new Array(n).fill(null);
    const seen = new Array(n).fill(false);
    seen[source] = true;
    const q = [source];
    for (let h = 0; h < q.length && !seen[sink]; h++)
      for (const a of adj[q[h]])
        if (!seen[a.to] && residual(list, flow, a) > 0) {
          seen[a.to] = true;
          via[a.to] = a;
          q.push(a.to);
        }
    if (!seen[sink]) return null;
    /** @type {ResidualArc[]} */
    const out = [];
    for (let x = sink; x !== source;) {
      const a = /** @type {ResidualArc} */ (via[x]);
      out.unshift(a);
      x = a.from;
    }
    return out;
  }

  push('start', [0]);
  if (!valid) {
    push('done', [7]);
    return frames;
  }

  for (let p = shortest(); p; p = shortest()) {
    path = p;
    b = bottleneck(list, flow, path);
    pushAlong(flow, path, b);
    value += b;
    augmentations++;
    push('augment', [0, 1]);
  }
  path = [];
  b = 0;
  push('maxflow', [2]);

  side = new Array(n).fill(false);
  side[source] = true;
  queue = [source];
  while (queue.length) {
    at = /** @type {number} */ (queue.shift());
    found = [];
    for (const a of adj[at])
      if (!side[a.to] && residual(list, flow, a) > 0) {
        side[a.to] = true;
        found.push(a.to);
        queue.push(a.to);
      }
    push('visit', [3, 4]);
  }
  at = -1;
  found = [];
  list.forEach((e) => {
    if (side[e.u] && !side[e.v]) {
      cut.push(e.edge);
      capacity += e.cap;
    }
  });
  cut.sort((x, y) => x - y);
  push('cut', [5, 6]);
  push('done', [7]);
  return frames;
}
