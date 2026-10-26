/**
 * Three searches over one small graph:
 * - a BFS two-colouring of an undirected graph, which fails exactly on an odd cycle;
 * - a DFS cycle check of an undirected graph, where any visited neighbour other than the
 *   parent closes a cycle;
 * - a DFS cycle check of a directed graph with three states (unvisited, in progress,
 *   finished), where only an edge into a vertex still in progress (a back edge) closes a cycle.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; neighbours are tried in
 * that order. Undirected searches treat (u, v) and (v, u) as one edge and keep the first.
 */

/** Largest graph the lesson draws. */
export const MAX_NODES = 8;

/**
 * @typedef {object} PlainEdge
 * @property {number} from  Vertex id.
 * @property {number} to    Vertex id.
 */

/**
 * @typedef {object} TwoColourFrame
 * @property {'start'|'seed'|'dequeue'|'colour'|'agree'|'conflict'|'enter'|'edge'|'finish'|'cycle'|'done'} kind
 * @property {number} current  Vertex acted on, -1 when none.
 * @property {number} other    The neighbour on the current edge, -1 when none.
 * @property {number} edge     Index into the input edge list, -1 when none.
 * @property {'tree'|'parent'|'back'|'finished'|''} edgeKind  DFS only: what the edge led to.
 * @property {number[]} colour  Two-colouring: 0 none, 1 or 2. DFS: 0 unvisited, 1 in progress, 2 finished.
 * @property {number[]} pending Queue (front first) or call stack (bottom first).
 * @property {number[]} used    Edge indices examined so far.
 * @property {number[]} tree    Edge indices that discovered a vertex.
 * @property {number[]} cycle   Vertices of the cycle found, in order around it; [] when none.
 * @property {number} checks    Edge examinations so far (an undirected edge counts from each end).
 * @property {number[]} lines
 */

export const bipartitePseudocode = [
  'every vertex starts with no colour',
  'for each vertex s with no colour:',
  '  colour[s] = 1; queue = [s]',
  '  while queue is not empty:',
  '    u = queue.dequeue()',
  '    for each neighbour v of u:',
  '      if v has no colour: colour[v] = the other colour; queue.enqueue(v)',
  '      else if colour[v] == colour[u]: odd cycle, not bipartite — stop',
  'bipartite: the two colours are the two sides',
];

export const undirectedCyclePseudocode = [
  'for each vertex s: if s is unvisited: visit(s, none)',
  'visit(u, parent):',
  '  mark u visited',
  '  for each neighbour v of u:',
  '    if v == parent: skip, that is the edge we came along',
  '    else if v is visited: cycle found — stop',
  '    else: visit(v, u)',
  'no cycle: the graph is a forest',
];

export const directedCyclePseudocode = [
  'for each vertex s: if s is unvisited: visit(s)',
  'visit(u):',
  '  mark u in progress',
  '  for each edge u → v:',
  '    if v is in progress: back edge, cycle found — stop',
  '    if v is finished: no cycle through v, skip it',
  '    if v is unvisited: visit(v)',
  '  mark u finished',
  'no cycle: the graph is a DAG',
];

/**
 * @param {number[]} ids
 * @param {PlainEdge[]} edges
 * @param {boolean} directed
 * @returns {{n: number, adj: {to: number, edge: number}[][]}}
 */
function adjacency(ids, edges, directed) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const index = new Map(sorted.map((id, i) => [id, i]));
  /** @type {{to: number, edge: number}[][]} */
  const adj = sorted.map(() => []);
  const seen = new Set();
  edges.forEach((e, k) => {
    const u = index.get(e.from);
    const v = index.get(e.to);
    if (u === undefined || v === undefined || u === v) return;
    const key = directed || u < v ? `${u}>${v}` : `${v}>${u}`;
    if (seen.has(key)) return;
    seen.add(key);
    adj[u].push({ to: v, edge: k });
    if (!directed) adj[v].push({ to: u, edge: k });
  });
  for (const list of adj) list.sort((a, b) => a.to - b.to);
  return { n: sorted.length, adj };
}

/**
 * Frame recorder shared by the three searches.
 * @param {number} n
 */
function recorder(n) {
  const state = {
    colour: new Array(n).fill(0),
    /** @type {number[]} */
    pending: [],
    head: 0,
    /** @type {number[]} */
    used: [],
    /** @type {number[]} */
    tree: [],
    checks: 0,
  };
  /** @type {TwoColourFrame[]} */
  const frames = [];
  /**
   * @param {Pick<TwoColourFrame, 'kind'|'lines'> & Partial<TwoColourFrame>} f
   */
  const push = (f) =>
    frames.push({
      current: -1,
      other: -1,
      edge: -1,
      edgeKind: '',
      ...f,
      colour: state.colour.slice(),
      pending: state.pending.slice(state.head),
      used: state.used.slice(),
      tree: state.tree.slice(),
      cycle: f.cycle ? f.cycle.slice() : [],
      checks: state.checks,
    });
  return { state, frames, push };
}

/**
 * @param {{ ids: number[], edges: PlainEdge[] }} graph
 * @returns {TwoColourFrame[]}
 */
export function bipartiteTrace({ ids, edges }) {
  const { n, adj } = adjacency(ids, edges, false);
  const { state, frames, push } = recorder(n);
  const { colour } = state;
  const parent = new Array(n).fill(-1);
  const depth = new Array(n).fill(0);

  push({ kind: 'start', lines: [0] });
  for (let s = 0; s < n; s++) {
    if (colour[s] !== 0) continue;
    colour[s] = 1;
    state.pending = [s];
    state.head = 0;
    push({ kind: 'seed', current: s, lines: [1, 2] });
    while (state.head < state.pending.length) {
      const u = state.pending[state.head++];
      push({ kind: 'dequeue', current: u, lines: [3, 4] });
      for (const { to: v, edge } of adj[u]) {
        state.checks++;
        state.used.push(edge);
        if (colour[v] === 0) {
          colour[v] = 3 - colour[u];
          parent[v] = u;
          depth[v] = depth[u] + 1;
          state.tree.push(edge);
          state.pending.push(v);
          push({ kind: 'colour', current: u, other: v, edge, lines: [5, 6] });
        } else if (colour[v] === colour[u]) {
          // Walk both ends up the BFS tree to their lowest common ancestor.
          const up = [u];
          const vp = [v];
          let a = u;
          let b = v;
          while (depth[a] > depth[b]) up.push((a = parent[a]));
          while (depth[b] > depth[a]) vp.push((b = parent[b]));
          while (a !== b) {
            up.push((a = parent[a]));
            vp.push((b = parent[b]));
          }
          // lca … u, then v … the child of lca: consecutive vertices are joined by an edge.
          const cycle = [...up.reverse(), ...vp.slice(0, -1)];
          push({ kind: 'conflict', current: u, other: v, edge, cycle, lines: [5, 7] });
          return frames;
        } else {
          push({ kind: 'agree', current: u, other: v, edge, lines: [5, 7] });
        }
      }
    }
  }
  state.pending = [];
  state.head = 0;
  push({ kind: 'done', lines: [8] });
  return frames;
}

/**
 * @param {{ ids: number[], edges: PlainEdge[] }} graph
 * @param {boolean} directed
 * @returns {TwoColourFrame[]}
 */
function dfsCycleTrace({ ids, edges }, directed) {
  const { n, adj } = adjacency(ids, edges, directed);
  const { state, frames, push } = recorder(n);
  const { colour } = state;
  const stack = state.pending;
  // Pseudocode line numbers differ only after the shared first lines.
  const L = directed
    ? { back: [3, 4], finished: [3, 5], tree: [3, 6], finish: [7], done: [8] }
    : { back: [3, 5], finished: [3, 5], tree: [3, 6], finish: [3], done: [7] };

  /**
   * @param {number} u @param {number} from Parent vertex, -1 at a root.
   * @param {number[]} callLines
   * @returns {boolean} true once a cycle is found.
   */
  function visit(u, from, callLines) {
    colour[u] = 1;
    stack.push(u);
    push({ kind: 'enter', current: u, lines: [...callLines, 1, 2] });
    let skippedParent = false;
    for (const { to: v, edge } of adj[u]) {
      state.checks++;
      state.used.push(edge);
      if (!directed && v === from && !skippedParent) {
        skippedParent = true;
        push({ kind: 'edge', current: u, other: v, edge, edgeKind: 'parent', lines: [3, 4] });
        continue;
      }
      if (colour[v] === 1 || (!directed && colour[v] !== 0)) {
        const cycle = stack.slice(stack.indexOf(v));
        push({ kind: 'edge', current: u, other: v, edge, edgeKind: 'back', cycle, lines: L.back });
        push({ kind: 'cycle', current: u, other: v, edge, cycle, lines: L.back });
        return true;
      }
      if (colour[v] === 2) {
        push({
          kind: 'edge',
          current: u,
          other: v,
          edge,
          edgeKind: 'finished',
          lines: L.finished,
        });
        continue;
      }
      state.tree.push(edge);
      push({ kind: 'edge', current: u, other: v, edge, edgeKind: 'tree', lines: L.tree });
      if (visit(v, u, [6])) return true;
    }
    colour[u] = 2;
    stack.pop();
    push({ kind: 'finish', current: u, lines: L.finish });
    return false;
  }

  push({ kind: 'start', lines: [0] });
  for (let s = 0; s < n; s++) {
    if (colour[s] === 0 && visit(s, -1, [0])) return frames;
  }
  push({ kind: 'done', lines: L.done });
  return frames;
}

/** @param {{ ids: number[], edges: PlainEdge[] }} graph */
export const undirectedCycleTrace = (graph) => dfsCycleTrace(graph, false);

/** @param {{ ids: number[], edges: PlainEdge[] }} graph */
export const directedCycleTrace = (graph) => dfsCycleTrace(graph, true);
