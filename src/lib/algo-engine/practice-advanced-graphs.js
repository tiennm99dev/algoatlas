/**
 * Two problem runners for the advanced-graphs practice.
 *
 * - Network reliability: knock out one node of an undirected network, then label the parts
 *   that still talk to each other with a breadth-first flood. The node is critical (an
 *   articulation point) exactly when the network falls into more parts than before.
 * - Dependency cycles: an edge A → B says module A needs B. Tarjan’s SCC search groups the
 *   modules; a component of two or more modules is a dependency cycle. With no cycle, the
 *   order in which Tarjan completes components (sinks first) is a valid build order.
 *
 * Vertices are numbered by ascending id; neighbours and dependencies are tried in order of
 * their number.
 */
import { indexEdges } from './weighted-edges.js';

/** Largest graph the lesson draws; both traces stay well under 400 frames at the cap. */
export const MAX_NODES = 8;

/**
 * @typedef {object} PlainEdge
 * @property {number} from  Vertex id.
 * @property {number} to    Vertex id.
 */

/**
 * @typedef {object} FailureFrame
 * @property {'start'|'fail'|'seed'|'expand'|'reach'|'done'} kind
 * @property {number} failed     Index of the failed node, -1 when none.
 * @property {number} current    Node acted on, -1 when none.
 * @property {number} other      Neighbour just reached, -1 when none.
 * @property {number[]} part     Part number per node (from 1), 0 when not reached, -1 failed.
 * @property {number} parts      Parts found so far.
 * @property {number[]} sizes    sizes[k - 1] = nodes in part k so far.
 * @property {number[]} queue    Flood queue, front first.
 * @property {number} before     Connected pieces of the whole network, before the failure.
 * @property {number} checks     Links examined so far.
 * @property {number[]} lines
 */

export const failurePseudocode = [
  'before = number of connected pieces of the whole network',
  'remove the failed node and every link it has',
  'for each working node v: if v has no part yet:',
  '  parts += 1; give v that part; queue = [v]',
  '  while queue is not empty: u = queue.dequeue()',
  '    for each working neighbour w of u without a part: give w the part; enqueue w',
  'the failed node is critical exactly when parts > before',
];

/**
 * @typedef {object} CycleFrame
 * @property {'start'|'enter'|'scc'|'done'} kind
 * @property {number} current    Module acted on, -1 when none.
 * @property {number[]} tin      Discovery time per module, -1 when unvisited.
 * @property {number[]} low      Low-link per module, -1 when unvisited.
 * @property {number[]} stack    Tarjan’s stack, bottom first.
 * @property {number[]} comp     Component number per module (from 1), 0 when not found yet.
 * @property {number} count      Components found so far.
 * @property {number[]} popped   Modules of the component completed on this frame.
 * @property {boolean} blocked   `scc`: the component is a cycle or needs, directly or not, a
 *   module on one, so it cannot be built.
 * @property {number[][]} cycles Components of two or more modules found so far.
 * @property {number[]} order    Modules in the order their components completed.
 * @property {number} checks     Dependencies examined so far.
 * @property {number[]} lines
 */

export const cyclePseudocode = [
  'run Tarjan’s SCC search over the modules (A → B: A needs B)',
  'connect(u): tin[u] = low[u] = time; time += 1; push u',
  '  for each dependency u → v: connect(v) if unvisited, then lower low[u] by low[v] or tin[v]',
  '  if low[u] == tin[u]: pop the stack down to u as one component',
  '    a component of 2 or more modules is a dependency cycle',
  'no cycle: the order the components were completed in is a build order',
];

/** @param {number[]} ids @param {PlainEdge[]} edges */
function undirected(ids, edges) {
  const { n, list } = indexEdges(ids, edges);
  /** @type {number[][]} */
  const adj = Array.from({ length: n }, () => []);
  for (const { u, v } of list) {
    adj[u].push(v);
    adj[v].push(u);
  }
  for (const l of adj) l.sort((a, b) => a - b);
  return { n, adj };
}

/**
 * Pieces of a network, optionally without one node (union-find over the links).
 * @param {number} n @param {number[][]} adj @param {number} skip
 */
function pieces(n, adj, skip) {
  const parent = Array.from({ length: n }, (_, i) => i);
  /** @param {number} x @returns {number} */
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  adj.forEach((list, u) => {
    if (u === skip) return;
    for (const v of list) if (v !== skip) parent[find(u)] = find(v);
  });
  let count = 0;
  for (let v = 0; v < n; v++) if (v !== skip && find(v) === v) count++;
  return count;
}

/**
 * @param {{ ids: number[], edges: PlainEdge[], failed: number }} input  `failed` is a vertex
 *   id, or -1 for no failure.
 * @returns {FailureFrame[]}
 */
export function failureTrace({ ids, edges, failed }) {
  const { n, adj } = undirected(ids, edges);
  const sorted = ids.slice().sort((a, b) => a - b);
  const f = sorted.indexOf(failed);
  const before = pieces(n, adj, -1);
  const part = new Array(n).fill(0);
  /** @type {number[]} */
  const sizes = [];
  /** @type {number[]} */
  let queue = [];
  let head = 0;
  let parts = 0;
  let checks = 0;

  /** @type {FailureFrame[]} */
  const frames = [];
  /** @param {Pick<FailureFrame, 'kind'|'lines'> & Partial<Pick<FailureFrame, 'current'|'other'>>} fr */
  const push = (fr) =>
    frames.push({
      current: -1,
      other: -1,
      ...fr,
      failed: f,
      part: part.slice(),
      parts,
      sizes: sizes.slice(),
      queue: queue.slice(head),
      before,
      checks,
    });

  push({ kind: 'start', lines: [0] });
  if (f >= 0) {
    part[f] = -1;
    push({ kind: 'fail', current: f, lines: [1] });
  }
  for (let v = 0; v < n; v++) {
    if (part[v] !== 0) continue;
    parts++;
    part[v] = parts;
    sizes.push(1);
    queue = [v];
    head = 0;
    push({ kind: 'seed', current: v, lines: [2, 3] });
    while (head < queue.length) {
      const u = queue[head++];
      push({ kind: 'expand', current: u, lines: [4] });
      for (const w of adj[u]) {
        // The failed node's links are gone, so they are not checked.
        if (w === f) continue;
        checks++;
        if (part[w] !== 0) continue;
        part[w] = parts;
        sizes[parts - 1]++;
        queue.push(w);
        push({ kind: 'reach', current: u, other: w, lines: [5] });
      }
    }
  }
  push({ kind: 'done', lines: [6] });
  return frames;
}

/**
 * @param {{ ids: number[], edges: PlainEdge[] }} graph
 * @returns {CycleFrame[]}
 */
export function cycleTrace({ ids, edges }) {
  const { n, list } = indexEdges(ids, edges);
  /** @type {number[][]} */
  const out = Array.from({ length: n }, () => []);
  for (const { u, v } of list) out[u].push(v);
  for (const l of out) l.sort((a, b) => a - b);

  const tin = new Array(n).fill(-1);
  const low = new Array(n).fill(-1);
  const comp = new Array(n).fill(0);
  const onStack = new Array(n).fill(false);
  /** @type {number[]} */
  const stack = [];
  /** @type {number[][]} */
  const cycles = [];
  /** @type {number[]} */
  const order = [];
  let time = 0;
  let count = 0;
  let checks = 0;

  /** @type {CycleFrame[]} */
  const frames = [];
  /** Per component number - 1: it is a cycle or needs a module on one. */
  /** @type {boolean[]} */
  const blockedComp = [];

  /** @param {Pick<CycleFrame, 'kind'|'lines'> & Partial<Pick<CycleFrame, 'current'|'popped'|'blocked'>>} f */
  const push = (f) =>
    frames.push({
      current: -1,
      blocked: false,
      ...f,
      popped: f.popped ? f.popped.slice() : [],
      tin: tin.slice(),
      low: low.slice(),
      stack: stack.slice(),
      comp: comp.slice(),
      count,
      cycles: cycles.map((c) => c.slice()),
      order: order.slice(),
      checks,
    });

  /** @param {number} u */
  function connect(u) {
    tin[u] = low[u] = time++;
    stack.push(u);
    onStack[u] = true;
    push({ kind: 'enter', current: u, lines: [1, 2] });
    for (const v of out[u]) {
      checks++;
      if (tin[v] === -1) {
        connect(v);
        low[u] = Math.min(low[u], low[v]);
      } else if (onStack[v]) low[u] = Math.min(low[u], tin[v]);
    }
    if (low[u] !== tin[u]) return;
    count++;
    /** @type {number[]} */
    const popped = [];
    let w;
    do {
      w = /** @type {number} */ (stack.pop());
      onStack[w] = false;
      comp[w] = count;
      popped.push(w);
      order.push(w);
    } while (w !== u);
    if (popped.length > 1) cycles.push(popped.slice().sort((a, b) => a - b));
    // Everything a component needs outside itself completed earlier (sinks first).
    const blocked =
      popped.length > 1 ||
      popped.some((w) => out[w].some((x) => comp[x] !== count && blockedComp[comp[x] - 1]));
    blockedComp.push(blocked);
    push({ kind: 'scc', current: u, popped, blocked, lines: popped.length > 1 ? [3, 4] : [3] });
  }

  push({ kind: 'start', lines: [0] });
  for (let v = 0; v < n; v++) if (tin[v] === -1) connect(v);
  push({ kind: 'done', lines: [5] });
  return frames;
}
