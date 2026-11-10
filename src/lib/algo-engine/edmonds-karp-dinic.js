/**
 * Two ways to choose augmenting paths with breadth-first search.
 *
 * Edmonds-Karp is Ford-Fulkerson where every augmenting path is a shortest one (fewest arcs),
 * found by BFS over the residual arcs with room. The distance from s never drops between
 * searches, so it needs O(V·E) augmentations, whatever the capacities.
 *
 * Dinic works in phases. A phase runs BFS once to give every vertex a level (its distance from
 * s), keeps only the level graph (arcs with room from one level to the next), then pushes paths
 * found by depth-first search in that graph until none is left: a blocking flow. A current-arc
 * pointer per vertex makes DFS skip arcs it already gave up on, and a vertex it backs out of is
 * a dead end for the rest of the phase. Every phase raises the distance from s to t, so at most
 * V − 1 phases run.
 *
 * Both share the residual network helpers of the Ford-Fulkerson engine. Vertices are numbered
 * by their position in `ids` sorted ascending; edge weights are capacities.
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
/** @typedef {'ek' | 'dinic'} FlowMethod */

/**
 * @typedef {object} PhaseFrame
 * @property {'start'|'bfs'|'path'|'push'|'dead'|'blocked'|'none'|'done'} kind
 * @property {number[]} flow         Flow per input edge.
 * @property {number[]} level        BFS distance from s per vertex, −1 when not reached.
 * @property {PathArc[]} path        The current augmenting path.
 * @property {number} bottleneck
 * @property {number} at             The dead-end vertex on 'dead', −1 otherwise.
 * @property {number[]} dead         Dead ends of the current Dinic phase.
 * @property {number} value          Flow value so far.
 * @property {number} augmentations  Paths pushed so far.
 * @property {number} searches       BFS runs so far (Dinic: phases begun).
 * @property {number} phaseFlow      Flow pushed in the current Dinic phase.
 * @property {number} checks         Residual arcs looked at so far, BFS and DFS together.
 * @property {number[]} lines
 */

export const edmondsKarpPseudocode = [
  'f(u, v) = 0 for every edge',
  'loop: BFS from s over the arcs with room; dist[v] = fewest arcs from s',
  '  if t was not reached: return f (it is maximum)',
  '  P = the path BFS found to t, a shortest one; b = smallest room on P',
  '  push b along P (add on forward arcs, cancel on backward ones)',
];

export const dinicPseudocode = [
  'f(u, v) = 0 for every edge',
  'loop (one phase): BFS from s over the arcs with room; level[v] = fewest arcs',
  '  if t was not reached: return f (it is maximum)',
  '  level graph: the arcs u → v with room and level[v] = level[u] + 1',
  '  while DFS from s finds a path P to t in the level graph:',
  '    push the bottleneck b of P along it',
  '    (DFS backs out of a dead end and skips it for the rest of the phase)',
  '  no level-graph path is left: the phase’s flow is blocking',
];

/**
 * @param {{ ids: number[], edges: CapEdge[], source: number, sink: number, method: FlowMethod }} input
 *   `source` and `sink` are vertex indices.
 * @returns {PhaseFrame[]}
 */
export function phaseFlowTrace({ ids, edges, source, sink, method }) {
  const { n, list } = flowNetwork(ids, edges);
  const adj = residualAdjacency(n, list);
  const flow = new Array(list.length).fill(0);
  const valid = source >= 0 && source < n && sink >= 0 && sink < n && source !== sink;
  let level = new Array(n).fill(-1);
  /** @type {(ResidualArc | null)[]} */
  let via = new Array(n).fill(null);
  /** @type {ResidualArc[]} */
  let path = [];
  /** @type {boolean[]} */
  let dead = new Array(n).fill(false);
  let b = 0;
  let at = -1;
  let value = 0;
  let augmentations = 0;
  let searches = 0;
  let phaseFlow = 0;
  let checks = 0;

  /** @type {PhaseFrame[]} */
  const frames = [];
  /** @param {PhaseFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      flow: flowByEdge(list, flow, edges.length),
      level: level.slice(),
      path: pathArcs(list, path),
      bottleneck: b,
      at,
      dead: dead.flatMap((d, v) => (d ? [v] : [])),
      value,
      augmentations,
      searches,
      phaseFlow,
      checks,
      lines,
    });

  /** BFS over arcs with room; fills `level` and `via`. @returns {boolean} t reached */
  function bfs() {
    searches++;
    level = new Array(n).fill(-1);
    via = new Array(n).fill(null);
    level[source] = 0;
    const queue = [source];
    for (let h = 0; h < queue.length; h++) {
      const u = queue[h];
      for (const a of adj[u]) {
        checks++;
        if (level[a.to] < 0 && residual(list, flow, a) > 0) {
          level[a.to] = level[u] + 1;
          via[a.to] = a;
          queue.push(a.to);
        }
      }
    }
    return level[sink] >= 0;
  }

  /** The BFS tree path from s to t. */
  function treePath() {
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
    push('done', [2]);
    return frames;
  }

  if (method === 'ek') {
    while (bfs()) {
      path = treePath();
      b = bottleneck(list, flow, path);
      push('bfs', [1, 3]);
      pushAlong(flow, path, b);
      value += b;
      augmentations++;
      push('push', [4]);
    }
    path = [];
    b = 0;
    push('none', [1, 2]);
    push('done', [2]);
    return frames;
  }

  /** Current-arc pointer per vertex for this phase. */
  let next = new Array(n).fill(0);
  /** @type {ResidualArc[]} */
  let stack = [];

  /** DFS in the level graph from u, extending `stack`. @param {number} u @returns {boolean} */
  function advance(u) {
    if (u === sink) return true;
    while (next[u] < adj[u].length) {
      const a = adj[u][next[u]];
      checks++;
      if (level[a.to] === level[u] + 1 && !dead[a.to] && residual(list, flow, a) > 0) {
        stack.push(a);
        if (advance(a.to)) return true;
        stack.pop();
      }
      next[u]++;
    }
    if (u !== source) {
      dead[u] = true;
      at = u;
      path = stack.slice();
      b = 0;
      push('dead', [6]);
      at = -1;
    }
    return false;
  }

  while (bfs()) {
    dead = new Array(n).fill(false);
    next = new Array(n).fill(0);
    phaseFlow = 0;
    path = [];
    b = 0;
    push('bfs', [1, 3]);
    for (;;) {
      stack = [];
      if (!advance(source)) break;
      path = stack.slice();
      b = bottleneck(list, flow, path);
      push('path', [4]);
      pushAlong(flow, path, b);
      value += b;
      phaseFlow += b;
      augmentations++;
      push('push', [5]);
    }
    path = [];
    b = 0;
    push('blocked', [7]);
  }
  dead = new Array(n).fill(false);
  push('none', [1, 2]);
  push('done', [2]);
  return frames;
}
