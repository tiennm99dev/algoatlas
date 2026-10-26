/**
 * Topological sort of a directed graph, two ways. Kahn's algorithm repeatedly removes a vertex
 * with no incoming edges (FIFO queue). The DFS method lists vertices in the order they finish
 * and reverses that list. Both detect a cycle: Kahn's leaves vertices behind, DFS meets an edge
 * into a vertex that is still in progress (a back edge).
 *
 * Vertices are numbered by their position in `ids` sorted ascending; ties are broken by that
 * number, and each vertex's out-edges are tried in order of their target.
 */

/** Largest graph the lesson draws. */
export const MAX_NODES = 8;

/**
 * @typedef {object} DagEdge
 * @property {number} from  Vertex id.
 * @property {number} to    Vertex id.
 */

/**
 * @typedef {object} TopoFrame
 * @property {'start'|'seed'|'take'|'relax'|'enter'|'edge'|'finish'|'done'|'cycle'} kind
 * @property {number} current     Vertex index acted on, -1 when none.
 * @property {number} edge        Index into the edge list, -1 when none.
 * @property {'tree'|'finished'|'back'|''} edgeKind  DFS only: what the edge led to.
 * @property {boolean} ready      Kahn only: the relaxed edge brought its target to 0.
 * @property {number[]} indeg     Kahn: remaining in-degree per vertex. DFS: all 0.
 * @property {number[]} status    0 waiting, 1 queued or in progress, 2 output or finished.
 * @property {number[]} pending   Kahn: the queue, front first. DFS: the call stack, bottom first.
 * @property {number[]} order     Kahn: output so far. DFS: vertices in finish order.
 * @property {number[]} result    The topological order, filled on 'done'.
 * @property {number[]} cycle     Vertices of the cycle found (DFS) or left over (Kahn).
 * @property {number} edgesSeen   Edges examined so far.
 * @property {number[]} used      Indices of the edges examined so far.
 * @property {number[]} lines
 */

export const kahnPseudocode = [
  'indeg[v] = number of edges into v, for every vertex v',
  'queue = every vertex v with indeg[v] = 0',
  'while queue is not empty:',
  '  u = queue.dequeue()',
  '  order.append(u)',
  '  for each edge u → v:',
  '    indeg[v] -= 1',
  '    if indeg[v] == 0: queue.enqueue(v)',
  'if order holds every vertex: return order',
  'else: the vertices left over lie on or behind a cycle',
];

export const dfsTopoPseudocode = [
  'for each vertex s: if s is unvisited: visit(s)',
  'visit(u):',
  '  mark u in progress',
  '  for each edge u → v:',
  '    if v is in progress: back edge, cycle found — stop',
  '    if v is unvisited: visit(v)',
  '  mark u finished; finished.append(u)',
  'order = finished, reversed',
];

/**
 * @param {number[]} ids
 * @param {DagEdge[]} edges
 */
function prepare(ids, edges) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const index = new Map(sorted.map((id, i) => [id, i]));
  /** @type {{to: number, edge: number}[][]} */
  const out = sorted.map(() => []);
  edges.forEach((e, k) => {
    const u = index.get(e.from);
    const v = index.get(e.to);
    if (u !== undefined && v !== undefined && u !== v) out[u].push({ to: v, edge: k });
  });
  for (const list of out) list.sort((a, b) => a.to - b.to || a.edge - b.edge);
  return { n: sorted.length, out };
}

/**
 * @param {{ ids: number[], edges: DagEdge[] }} graph
 * @returns {TopoFrame[]}
 */
export function kahnTrace({ ids, edges }) {
  const { n, out } = prepare(ids, edges);
  const indeg = new Array(n).fill(0);
  for (const list of out) for (const { to } of list) indeg[to]++;
  const status = new Array(n).fill(0);
  /** @type {number[]} */
  const queue = [];
  let head = 0;
  /** @type {number[]} */
  const order = [];
  let edgesSeen = 0;
  /** @type {number[]} */
  const used = [];

  /** @type {TopoFrame[]} */
  const frames = [];
  /**
   * @param {Pick<TopoFrame, 'kind'|'current'|'edge'|'lines'>} f
   * @param {{ready?: boolean, result?: number[], cycle?: number[]}} [extra]
   */
  const push = (f, extra = {}) =>
    frames.push({
      edgeKind: '',
      ready: extra.ready ?? false,
      ...f,
      indeg: indeg.slice(),
      status: status.slice(),
      pending: queue.slice(head),
      order: order.slice(),
      result: extra.result ? extra.result.slice() : [],
      cycle: extra.cycle ? extra.cycle.slice() : [],
      edgesSeen,
      used: used.slice(),
    });

  push({ kind: 'start', current: -1, edge: -1, lines: [0] });
  for (let v = 0; v < n; v++) {
    if (indeg[v] === 0) {
      queue.push(v);
      status[v] = 1;
    }
  }
  push({ kind: 'seed', current: -1, edge: -1, lines: [1] });
  while (head < queue.length) {
    const u = queue[head++];
    order.push(u);
    status[u] = 2;
    push({ kind: 'take', current: u, edge: -1, lines: [2, 3, 4] });
    for (const { to, edge } of out[u]) {
      edgesSeen++;
      used.push(edge);
      indeg[to]--;
      const ready = indeg[to] === 0;
      if (ready) {
        queue.push(to);
        status[to] = 1;
      }
      push({ kind: 'relax', current: u, edge, lines: ready ? [5, 6, 7] : [5, 6] }, { ready });
    }
  }
  if (order.length === n) {
    push({ kind: 'done', current: -1, edge: -1, lines: [8] }, { result: order });
  } else {
    const left = [];
    for (let v = 0; v < n; v++) if (status[v] !== 2) left.push(v);
    push({ kind: 'cycle', current: -1, edge: -1, lines: [8, 9] }, { cycle: left });
  }
  return frames;
}

/**
 * @param {{ ids: number[], edges: DagEdge[] }} graph
 * @returns {TopoFrame[]}
 */
export function dfsTopoTrace({ ids, edges }) {
  const { n, out } = prepare(ids, edges);
  const indeg = new Array(n).fill(0);
  const status = new Array(n).fill(0);
  /** @type {number[]} */
  const stack = [];
  /** @type {number[]} */
  const finished = [];
  let edgesSeen = 0;
  /** @type {number[]} */
  const used = [];

  /** @type {TopoFrame[]} */
  const frames = [];
  /**
   * @param {Pick<TopoFrame, 'kind'|'current'|'edge'|'lines'>} f
   * @param {{edgeKind?: TopoFrame['edgeKind'], result?: number[], cycle?: number[]}} [extra]
   */
  const push = (f, extra = {}) =>
    frames.push({
      ready: false,
      edgeKind: extra.edgeKind ?? '',
      ...f,
      indeg: indeg.slice(),
      status: status.slice(),
      pending: stack.slice(),
      order: finished.slice(),
      result: extra.result ? extra.result.slice() : [],
      cycle: extra.cycle ? extra.cycle.slice() : [],
      edgesSeen,
      used: used.slice(),
    });

  /**
   * @param {number} u
   * @param {number[]} callLines  Lines that led here: the outer loop or a recursive call.
   * @returns {boolean} true when a cycle was found and the search stopped.
   */
  function visit(u, callLines) {
    status[u] = 1;
    stack.push(u);
    push({ kind: 'enter', current: u, edge: -1, lines: [...callLines, 1, 2] });
    for (const { to, edge } of out[u]) {
      edgesSeen++;
      used.push(edge);
      if (status[to] === 1) {
        const cycle = stack.slice(stack.indexOf(to));
        push({ kind: 'edge', current: u, edge, lines: [3, 4] }, { edgeKind: 'back', cycle });
        push({ kind: 'cycle', current: u, edge, lines: [4] }, { cycle });
        return true;
      }
      if (status[to] === 2) {
        push({ kind: 'edge', current: u, edge, lines: [3] }, { edgeKind: 'finished' });
        continue;
      }
      push({ kind: 'edge', current: u, edge, lines: [3] }, { edgeKind: 'tree' });
      if (visit(to, [5])) return true;
    }
    status[u] = 2;
    stack.pop();
    finished.push(u);
    push({ kind: 'finish', current: u, edge: -1, lines: [6] });
    return false;
  }

  push({ kind: 'start', current: -1, edge: -1, lines: [0] });
  for (let s = 0; s < n; s++) {
    if (status[s] === 0 && visit(s, [0])) return frames;
  }
  push({ kind: 'done', current: -1, edge: -1, lines: [7] }, { result: finished.slice().reverse() });
  return frames;
}

/**
 * Number of edges that point backwards in an order (0 for a valid topological order).
 * @param {number[]} order  Vertex indices.
 * @param {{ ids: number[], edges: DagEdge[] }} graph
 */
export function backwardEdges(order, { ids, edges }) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const pos = new Map(order.map((v, i) => [sorted[v], i]));
  let bad = 0;
  for (const e of edges) {
    const a = pos.get(e.from);
    const b = pos.get(e.to);
    if (a !== undefined && b !== undefined && a > b) bad++;
  }
  return bad;
}
