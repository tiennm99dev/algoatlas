/**
 * Strongly connected components of a directed graph, two ways.
 *
 * - Tarjan: one DFS gives every vertex a discovery time `tin` and a low-link `low`, the
 *   smallest `tin` it can reach through its subtree plus one edge into a vertex still on the
 *   stack. A vertex whose `low` equals its own `tin` is the root of an SCC: pop the stack down
 *   to it. Components come out sinks first (reverse topological order of the condensation).
 * - Kosaraju: a first DFS on the graph lists vertices by finish time; a second DFS on the
 *   reversed graph, started from the latest-finishing vertex left, collects one component per
 *   start. Components come out sources first (topological order of the condensation).
 *
 * Vertices are numbered by ascending id; each vertex tries its out-edges (or, in Kosaraju's
 * second pass, its in-edges) in order of the other end's number.
 */
import { indexEdges } from './weighted-edges.js';

/** Largest graph the lesson draws; a complete graph on 8 vertices stays under 400 frames. */
export const MAX_NODES = 8;

/**
 * @typedef {object} SccEdge
 * @property {number} from  Vertex id.
 * @property {number} to    Vertex id.
 */

/**
 * @typedef {'start'|'enter'|'edge'|'return'|'keep'|'root'|'finish'|'transpose'|'seed'|'skip'|'done'} SccKind
 */

/**
 * @typedef {object} SccFrame
 * @property {SccKind} kind
 * @property {number} current     Vertex index acted on, -1 when none.
 * @property {number} other       The other end of the frame's edge (or the child returned from), -1.
 * @property {number} edge        Index into the input edge list, -1 when none.
 * @property {'tree'|'stack'|'done'|''} edgeKind
 *   Tarjan: `tree` to an unvisited vertex, `stack` to one still on the stack, `done` to one
 *   already in a finished SCC. Kosaraju: `tree` to an unvisited vertex, `done` otherwise.
 * @property {1|2} pass           Kosaraju pass (Tarjan is always 1).
 * @property {number[]} tin       Discovery time per vertex, -1 when unvisited.
 * @property {number[]} low       Tarjan low-link per vertex, -1 when unvisited (Kosaraju: all -1).
 * @property {number[]} status    0 unvisited, 1 on the DFS path, 2 finished.
 * @property {number[]} stack     Tarjan: the SCC stack, bottom first. Kosaraju: the call stack.
 * @property {number[]} finished  Kosaraju: vertices in finish order of pass 1 (Tarjan: []).
 * @property {number[]} comp      Component number per vertex (from 1), 0 when not assigned yet.
 * @property {number} count       Components found so far.
 * @property {number[]} popped    Vertices of the component completed on this frame.
 * @property {number} edgesSeen   Edge examinations so far (each edge once per pass).
 * @property {number[]} lines
 */

export const tarjanPseudocode = [
  'time = 0; stack = []; for each vertex s: if s is unvisited: connect(s)',
  'connect(u):',
  '  tin[u] = low[u] = time; time += 1; push u on the stack',
  '  for each edge u → v:',
  '    if v is unvisited: connect(v); low[u] = min(low[u], low[v])',
  '    else if v is on the stack: low[u] = min(low[u], tin[v])',
  '  if low[u] == tin[u]:',
  '    pop the stack down to u: those vertices form one SCC',
  'every vertex is in exactly one SCC',
];

export const kosarajuPseudocode = [
  'pass 1: for each vertex s: if s is unvisited: dfs1(s)',
  'dfs1(u): mark u visited; for each edge u → v: if v is unvisited: dfs1(v)',
  '  finished.append(u)',
  'reverse every edge',
  'pass 2: for each u in finished, from last to first:',
  '  if u has no component: c += 1; dfs2(u, c)',
  'dfs2(u, c): comp[u] = c; for each reversed edge u → v: if v has no component: dfs2(v, c)',
  'every vertex is in exactly one SCC',
];

/**
 * @param {number[]} ids
 * @param {SccEdge[]} edges
 */
function adjacency(ids, edges) {
  const { n, list } = indexEdges(ids, edges);
  /** @type {{to: number, edge: number}[][]} */
  const out = Array.from({ length: n }, () => []);
  /** @type {{to: number, edge: number}[][]} */
  const inn = Array.from({ length: n }, () => []);
  for (const { u, v, edge } of list) {
    out[u].push({ to: v, edge });
    inn[v].push({ to: u, edge });
  }
  const byEnd = (/** @type {{to: number, edge: number}} */ a, /** @type {typeof a} */ b) =>
    a.to - b.to || a.edge - b.edge;
  for (const l of out) l.sort(byEnd);
  for (const l of inn) l.sort(byEnd);
  return { n, out, inn };
}

/** @param {number} n */
function makeState(n) {
  return {
    tin: new Array(n).fill(-1),
    low: new Array(n).fill(-1),
    status: new Array(n).fill(0),
    comp: new Array(n).fill(0),
    /** @type {number[]} */
    stack: [],
    /** @type {number[]} */
    finished: [],
    count: 0,
    edgesSeen: 0,
  };
}

/**
 * @param {ReturnType<typeof makeState>} s
 * @param {SccFrame[]} frames
 */
function pusher(s, frames) {
  /**
   * @param {Pick<SccFrame, 'kind'|'lines'> & Partial<Pick<SccFrame, 'current'|'other'|'edge'|'edgeKind'|'popped'|'pass'>>} f
   */
  return (f) =>
    frames.push({
      current: -1,
      other: -1,
      edge: -1,
      edgeKind: '',
      pass: 1,
      ...f,
      popped: f.popped ? f.popped.slice() : [],
      tin: s.tin.slice(),
      low: s.low.slice(),
      status: s.status.slice(),
      stack: s.stack.slice(),
      finished: s.finished.slice(),
      comp: s.comp.slice(),
      count: s.count,
      edgesSeen: s.edgesSeen,
    });
}

/**
 * @param {{ ids: number[], edges: SccEdge[] }} graph
 * @returns {SccFrame[]}
 */
export function tarjanTrace({ ids, edges }) {
  const { n, out } = adjacency(ids, edges);
  const s = makeState(n);
  const onStack = new Array(n).fill(false);
  let time = 0;
  /** @type {SccFrame[]} */
  const frames = [];
  const push = pusher(s, frames);

  /** @param {number} u @param {number[]} callLines */
  function connect(u, callLines) {
    s.tin[u] = s.low[u] = time++;
    s.status[u] = 1;
    s.stack.push(u);
    onStack[u] = true;
    push({ kind: 'enter', current: u, lines: [...callLines, 1, 2] });
    for (const { to: v, edge } of out[u]) {
      s.edgesSeen++;
      if (s.tin[v] === -1) {
        push({ kind: 'edge', current: u, other: v, edge, edgeKind: 'tree', lines: [3, 4] });
        connect(v, [4]);
        s.low[u] = Math.min(s.low[u], s.low[v]);
        push({ kind: 'return', current: u, other: v, edge, edgeKind: 'tree', lines: [4] });
      } else if (onStack[v]) {
        s.low[u] = Math.min(s.low[u], s.tin[v]);
        push({ kind: 'edge', current: u, other: v, edge, edgeKind: 'stack', lines: [3, 5] });
      } else {
        push({ kind: 'edge', current: u, other: v, edge, edgeKind: 'done', lines: [3] });
      }
    }
    if (s.low[u] === s.tin[u]) {
      s.count++;
      const popped = [];
      let w;
      do {
        w = /** @type {number} */ (s.stack.pop());
        onStack[w] = false;
        s.comp[w] = s.count;
        s.status[w] = 2;
        popped.push(w);
      } while (w !== u);
      push({ kind: 'root', current: u, popped, lines: [6, 7] });
    } else {
      s.status[u] = 2;
      push({ kind: 'keep', current: u, lines: [6] });
    }
  }

  push({ kind: 'start', lines: [0] });
  for (let v = 0; v < n; v++) if (s.tin[v] === -1) connect(v, [0]);
  push({ kind: 'done', lines: [8] });
  return frames;
}

/**
 * @param {{ ids: number[], edges: SccEdge[] }} graph
 * @returns {SccFrame[]}
 */
export function kosarajuTrace({ ids, edges }) {
  const { n, out, inn } = adjacency(ids, edges);
  const s = makeState(n);
  let time = 0;
  /** @type {SccFrame[]} */
  const frames = [];
  const push = pusher(s, frames);

  /** @param {number} u @param {number[]} callLines */
  function dfs1(u, callLines) {
    s.tin[u] = time++;
    s.status[u] = 1;
    s.stack.push(u);
    push({ kind: 'enter', current: u, lines: [...callLines, 1] });
    for (const { to: v, edge } of out[u]) {
      s.edgesSeen++;
      if (s.status[v] === 0) {
        push({ kind: 'edge', current: u, other: v, edge, edgeKind: 'tree', lines: [1] });
        dfs1(v, [1]);
      } else {
        push({ kind: 'edge', current: u, other: v, edge, edgeKind: 'done', lines: [1] });
      }
    }
    s.status[u] = 2;
    s.stack.pop();
    s.finished.push(u);
    push({ kind: 'finish', current: u, lines: [2] });
  }

  /** @param {number} u @param {number[]} callLines @param {number[]} members */
  function dfs2(u, callLines, members) {
    s.comp[u] = s.count;
    s.stack.push(u);
    members.push(u);
    push({ kind: 'enter', current: u, pass: 2, lines: [...callLines, 6] });
    for (const { to: v, edge } of inn[u]) {
      s.edgesSeen++;
      if (s.comp[v] === 0) {
        push({ kind: 'edge', current: u, other: v, edge, edgeKind: 'tree', pass: 2, lines: [6] });
        dfs2(v, [6], members);
      } else {
        push({ kind: 'edge', current: u, other: v, edge, edgeKind: 'done', pass: 2, lines: [6] });
      }
    }
    s.stack.pop();
  }

  push({ kind: 'start', lines: [0] });
  for (let v = 0; v < n; v++) if (s.status[v] === 0) dfs1(v, [0]);
  push({ kind: 'transpose', pass: 2, lines: [3] });
  for (let k = s.finished.length - 1; k >= 0; k--) {
    const u = s.finished[k];
    if (s.comp[u] !== 0) {
      push({ kind: 'skip', current: u, pass: 2, lines: [4] });
      continue;
    }
    s.count++;
    push({ kind: 'seed', current: u, pass: 2, lines: [4, 5] });
    /** @type {number[]} */
    const members = [];
    dfs2(u, [5], members);
    push({ kind: 'root', current: u, pass: 2, popped: members, lines: [5] });
  }
  push({ kind: 'done', pass: 2, lines: [7] });
  return frames;
}

/**
 * The condensation of a graph: one vertex per component, and one edge a → b for every pair
 * of components joined by at least one original edge. Always a DAG.
 * @param {{ ids: number[], edges: SccEdge[] }} graph
 * @param {number[]} comp  Component number per vertex index (from 1).
 * @returns {{ members: number[][], edges: [number, number][] }}  Components by number - 1.
 */
export function condensation({ ids, edges }, comp) {
  const { list } = indexEdges(ids, edges);
  const count = comp.reduce((m, c) => Math.max(m, c), 0);
  /** @type {number[][]} */
  const members = Array.from({ length: count }, () => []);
  comp.forEach((c, v) => c > 0 && members[c - 1].push(v));
  const seen = new Set();
  /** @type {[number, number][]} */
  const out = [];
  for (const { u, v } of list) {
    const a = comp[u];
    const b = comp[v];
    if (a === b || seen.has(`${a}>${b}`)) continue;
    seen.add(`${a}>${b}`);
    out.push([a, b]);
  }
  out.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return { members, edges: out };
}
