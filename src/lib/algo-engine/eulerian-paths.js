/**
 * Euler paths and circuits of an undirected graph with Hierholzer’s algorithm (the stack
 * version). First the degree test: an Euler circuit needs every degree even, an Euler path
 * exactly two odd degrees, and in both cases all edges must lie in one connected piece.
 * Then walk: from the vertex on top of the stack take any unused edge and push its other
 * end; when the top has no unused edge left, pop it onto the route. A walk that resumes
 * after a pop starts a detour cycle, which ends up spliced into the route at that vertex.
 * The route, read backwards, uses every edge exactly once.
 *
 * Vertices are numbered by ascending id. The walk starts at the lowest-numbered odd vertex,
 * or at the lowest-numbered vertex with an edge when all degrees are even, and always takes
 * the unused edge whose other end has the lowest number.
 */
import { indexEdges } from './weighted-edges.js';

/** Largest graph the lesson draws; a complete graph on 8 vertices stays well under 400 frames. */
export const MAX_NODES = 8;

/**
 * @typedef {object} EulerEdge
 * @property {number} from  Vertex id.
 * @property {number} to    Vertex id.
 */

/**
 * @typedef {object} EulerFrame
 * @property {'start'|'pick'|'walk'|'pop'|'done'} kind
 * @property {number} current    Vertex index acted on, -1 when none.
 * @property {number} other      Vertex the walk moved to, -1 when none.
 * @property {number} edge       Input index of the edge just used, -1 when none.
 * @property {boolean} detour    `walk`: the walk resumes after a pop, starting a detour cycle.
 * @property {number[]} degree   Degree per vertex.
 * @property {number[]} odd      Vertices of odd degree, ascending.
 * @property {number[]} left     Unused edges per vertex.
 * @property {number[]} stack    Vertex stack, bottom first.
 * @property {number[]} trail    Input indices of the used edges still on the stack, bottom first.
 * @property {number[]} route    Vertices popped so far, in pop order.
 * @property {number[]} routeEdges Input indices of the edges popped with the route.
 * @property {number} start      Start vertex, -1 when none.
 * @property {''|'empty'|'odd'|'disconnected'} reason  Why no Euler path exists ('' when one does).
 * @property {boolean} circuit   Every degree is even, so the path is a closed circuit.
 * @property {number[]} path     The Euler path, filled on a successful 'done'.
 * @property {number} used       Edges used so far.
 * @property {number} detours    Detour cycles started so far.
 * @property {number[]} lines
 */

export const eulerPseudocode = [
  'count the vertices of odd degree',
  'if odd ∉ {0, 2}, or the edges are not all connected: no Euler path',
  'start = the odd vertex if odd = 2, else any vertex with an edge',
  'stack = [start]; route = []',
  'while stack is not empty:',
  '  u = top of the stack',
  '  if u has an unused edge u — v: mark it used; push v',
  '  else: pop u; route.append(u)',
  'route reversed uses every edge once (a circuit when odd = 0)',
];

/**
 * @param {{ ids: number[], edges: EulerEdge[] }} graph
 * @returns {EulerFrame[]}
 */
export function eulerTrace({ ids, edges }) {
  const { n, list } = indexEdges(ids, edges);
  /** @type {{to: number, edge: number}[][]} */
  const adj = Array.from({ length: n }, () => []);
  for (const { u, v, edge } of list) {
    adj[u].push({ to: v, edge });
    adj[v].push({ to: u, edge });
  }
  for (const l of adj) l.sort((a, b) => a.to - b.to || a.edge - b.edge);
  const degree = adj.map((l) => l.length);
  const left = degree.slice();
  const odd = degree.flatMap((d, v) => (d % 2 === 1 ? [v] : []));
  const usedEdge = new Set();
  /** Next position to try in each adjacency list. */
  const next = new Array(n).fill(0);

  /** @type {number[]} */
  const stack = [];
  /** @type {number[]} */
  const trail = [];
  /** @type {number[]} */
  const route = [];
  /** @type {number[]} */
  const routeEdges = [];
  let start = -1;
  /** @type {EulerFrame['reason']} */
  let reason = '';
  let used = 0;
  let detours = 0;

  /** @type {EulerFrame[]} */
  const frames = [];
  /**
   * @param {Pick<EulerFrame, 'kind'|'lines'> & Partial<Pick<EulerFrame, 'current'|'other'|'edge'|'detour'|'path'>>} f
   */
  const push = (f) =>
    frames.push({
      current: -1,
      other: -1,
      edge: -1,
      detour: false,
      ...f,
      path: f.path ? f.path.slice() : [],
      degree: degree.slice(),
      odd: odd.slice(),
      left: left.slice(),
      stack: stack.slice(),
      trail: trail.slice(),
      route: route.slice(),
      routeEdges: routeEdges.slice(),
      start,
      reason,
      circuit: odd.length === 0,
      used,
      detours,
    });

  push({ kind: 'start', lines: [0] });

  // Every vertex with an edge must sit in one connected piece (union-find check).
  const parent = Array.from({ length: n }, (_, i) => i);
  /** @param {number} x @returns {number} */
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const { u, v } of list) parent[find(u)] = find(v);
  const pieces = new Set(degree.flatMap((d, v) => (d > 0 ? [find(v)] : [])));

  if (list.length === 0) reason = 'empty';
  else if (odd.length !== 0 && odd.length !== 2) reason = 'odd';
  else if (pieces.size > 1) reason = 'disconnected';
  if (reason) {
    push({ kind: 'done', lines: [0, 1] });
    return frames;
  }

  start = odd.length === 2 ? odd[0] : degree.findIndex((d) => d > 0);
  stack.push(start);
  push({ kind: 'pick', current: start, lines: [1, 2, 3] });

  let afterPop = false;
  while (stack.length > 0) {
    const u = stack[stack.length - 1];
    while (next[u] < adj[u].length && usedEdge.has(adj[u][next[u]].edge)) next[u]++;
    if (next[u] < adj[u].length) {
      const { to: v, edge } = adj[u][next[u]];
      usedEdge.add(edge);
      left[u]--;
      left[v]--;
      used++;
      if (afterPop) detours++;
      stack.push(v);
      trail.push(edge);
      push({ kind: 'walk', current: u, other: v, edge, detour: afterPop, lines: [4, 5, 6] });
      afterPop = false;
    } else {
      stack.pop();
      route.push(u);
      const edge = trail.pop();
      if (edge !== undefined) routeEdges.push(edge);
      push({ kind: 'pop', current: u, edge: edge ?? -1, lines: [4, 5, 7] });
      afterPop = true;
    }
  }
  push({ kind: 'done', path: route.slice().reverse(), lines: [8] });
  return frames;
}
