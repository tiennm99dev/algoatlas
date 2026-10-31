/**
 * Bridges and articulation points of an undirected graph from one DFS (Tarjan’s low-link
 * method). Each vertex gets a discovery time `tin` and a low-link `low`: the smallest `tin`
 * reachable from its DFS subtree using tree edges down and at most one back edge up.
 *
 * - A tree edge u — v is a bridge exactly when low[v] > tin[u]: nothing under v climbs back
 *   to u or above it.
 * - A non-root u is an articulation point when some tree child v has low[v] ≥ tin[u]; the
 *   root is one exactly when it has two or more tree children.
 *
 * Vertices are numbered by ascending id. Each vertex tries its edges in order of the other
 * end’s number, and skips only the very edge it was entered by, so the parent is skipped
 * by edge, not by vertex.
 */
import { indexEdges } from './weighted-edges.js';

/** Largest graph the lesson draws; a complete graph on 8 vertices stays under 400 frames. */
export const MAX_NODES = 8;

/**
 * @typedef {object} CutEdge
 * @property {number} from  Vertex id.
 * @property {number} to    Vertex id.
 */

/**
 * @typedef {object} CutFrame
 * @property {'start'|'enter'|'parent'|'back'|'down'|'tree'|'return'|'root'|'done'} kind
 *   `back` is an edge to an ancestor (it may lower low), `down` the same edge seen again from
 *   the ancestor’s side, `parent` the skipped edge to the parent, `tree` an edge to an
 *   unvisited vertex.
 * @property {number} current    Vertex index acted on, -1 when none.
 * @property {number} other      Other end of the frame’s edge (or the child returned from), -1.
 * @property {number} edge       Index into the input edge list, -1 when none.
 * @property {number} root       Root of the DFS tree being built, -1 when none.
 * @property {number} children   Tree children of that root so far.
 * @property {number[]} tin      Discovery time per vertex, -1 when unvisited.
 * @property {number[]} low      Low-link per vertex, -1 when unvisited.
 * @property {number[]} status   0 unvisited, 1 on the DFS path, 2 finished.
 * @property {number[]} parent   Parent vertex index in the DFS tree, -1 for roots and unvisited.
 * @property {number[]} tree     Input indices of the tree edges so far.
 * @property {number[]} backEdges Input indices of the back edges so far.
 * @property {number[]} bridges  Input indices of the bridges so far.
 * @property {number[]} cuts     Articulation points so far, ascending vertex indices.
 * @property {boolean} isBridge  `return`: the edge to the child is a bridge.
 * @property {boolean} isCut     `return` or `root`: this check made `current` an articulation point.
 * @property {number} checks     Edge examinations so far (each edge from both ends).
 * @property {number[]} lines
 */

export const cutPseudocode = [
  'timer = 0; for each vertex s: if s is unvisited: dfs(s, none)',
  'dfs(u, parentEdge):',
  '  tin[u] = low[u] = timer; timer += 1',
  '  for each edge e = u — v except parentEdge:',
  '    if v is visited: low[u] = min(low[u], tin[v])',
  '    else: dfs(v, e); low[u] = min(low[u], low[v])',
  '      if low[v] > tin[u]: e is a bridge',
  '      if low[v] ≥ tin[u] and u is not a root: u is an articulation point',
  '  if u is a root with 2 or more tree children: u is an articulation point',
  'report the bridges and the articulation points',
];

/**
 * Undirected adjacency by vertex index, each list sorted by the other end.
 * @param {number[]} ids
 * @param {CutEdge[]} edges
 */
export function undirectedAdjacency(ids, edges) {
  const { n, list } = indexEdges(ids, edges);
  /** @type {{to: number, edge: number}[][]} */
  const adj = Array.from({ length: n }, () => []);
  for (const { u, v, edge } of list) {
    adj[u].push({ to: v, edge });
    adj[v].push({ to: u, edge });
  }
  for (const l of adj) l.sort((a, b) => a.to - b.to || a.edge - b.edge);
  return { n, adj };
}

/**
 * @param {{ ids: number[], edges: CutEdge[] }} graph
 * @returns {CutFrame[]}
 */
export function cutTrace({ ids, edges }) {
  const { n, adj } = undirectedAdjacency(ids, edges);
  const tin = new Array(n).fill(-1);
  const low = new Array(n).fill(-1);
  const status = new Array(n).fill(0);
  const parent = new Array(n).fill(-1);
  /** @type {number[]} */
  const tree = [];
  /** @type {number[]} */
  const backEdges = [];
  /** @type {number[]} */
  const bridges = [];
  const cutSet = new Set();
  let timer = 0;
  let checks = 0;
  let root = -1;
  let children = 0;

  /** @type {CutFrame[]} */
  const frames = [];
  /**
   * @param {Pick<CutFrame, 'kind'|'lines'> & Partial<Pick<CutFrame, 'current'|'other'|'edge'|'isBridge'|'isCut'>>} f
   */
  const push = (f) =>
    frames.push({
      current: -1,
      other: -1,
      edge: -1,
      isBridge: false,
      isCut: false,
      ...f,
      root,
      children,
      tin: tin.slice(),
      low: low.slice(),
      status: status.slice(),
      parent: parent.slice(),
      tree: tree.slice(),
      backEdges: backEdges.slice(),
      bridges: bridges.slice(),
      cuts: [...cutSet].sort((a, b) => a - b),
      checks,
    });

  /** @param {number} u @param {number} via @param {number[]} callLines */
  function dfs(u, via, callLines) {
    tin[u] = low[u] = timer++;
    status[u] = 1;
    push({ kind: 'enter', current: u, edge: via, lines: [...callLines, 1, 2] });
    for (const { to: v, edge } of adj[u]) {
      checks++;
      if (edge === via) {
        push({ kind: 'parent', current: u, other: v, edge, lines: [3] });
        continue;
      }
      if (tin[v] !== -1) {
        const up = tin[v] < tin[u];
        if (up) {
          low[u] = Math.min(low[u], tin[v]);
          if (!backEdges.includes(edge)) backEdges.push(edge);
        }
        push({ kind: up ? 'back' : 'down', current: u, other: v, edge, lines: [3, 4] });
        continue;
      }
      parent[v] = u;
      tree.push(edge);
      if (u === root) children++;
      push({ kind: 'tree', current: u, other: v, edge, lines: [3, 5] });
      dfs(v, edge, [5]);
      low[u] = Math.min(low[u], low[v]);
      const isBridge = low[v] > tin[u];
      if (isBridge) bridges.push(edge);
      const isCut = u !== root && low[v] >= tin[u] && !cutSet.has(u);
      if (isCut) cutSet.add(u);
      push({ kind: 'return', current: u, other: v, edge, isBridge, isCut, lines: [5, 6, 7] });
    }
    if (u === root) {
      const isCut = children >= 2;
      if (isCut) cutSet.add(u);
      status[u] = 2;
      push({ kind: 'root', current: u, isCut, lines: [8] });
    } else {
      status[u] = 2;
    }
  }

  push({ kind: 'start', lines: [0] });
  for (let s = 0; s < n; s++) {
    if (tin[s] !== -1) continue;
    root = s;
    children = 0;
    dfs(s, -1, [0]);
  }
  root = -1;
  children = 0;
  push({ kind: 'done', lines: [9] });
  return frames;
}
