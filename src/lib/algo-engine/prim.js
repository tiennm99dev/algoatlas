/**
 * Prim’s algorithm on an undirected weighted graph: grow one tree from a start vertex, and at
 * every step add the lightest edge with exactly one end in the tree. Two ways to find that
 * edge, so their costs can be compared on the same input:
 *
 * - `heap` (lazy Prim): a binary min-heap of crossing edges. When a vertex joins the tree,
 *   every edge from it to a vertex outside is pushed. A popped edge whose far end is already
 *   in the tree no longer crosses the cut; it is stale and skipped. O(E log E) = O(E log V),
 *   good for sparse graphs.
 * - `array` (eager Prim): key[v] is the lightest known edge from the tree to v. Each round scans
 *   every vertex outside the tree for the smallest key, then lowers the keys of the new
 *   vertex’s neighbours. O(V²) whatever E is, good for dense graphs.
 *
 * Heap entries compare by weight, then by input edge index; the array scan breaks ties by the
 * smaller vertex number. Vertices are numbered by their position in `ids` sorted ascending;
 * a vertex’s edges are examined in order of the neighbour’s number. Only the start vertex’s
 * component is spanned; other vertices are reported unreachable.
 */

import { makeHeap } from '$lib/components/item-heap.js';
import { indexEdges } from './weighted-edges.js';

/** Largest graph the lesson draws. */
export const MAX_NODES = 8;
/** Largest edge weight the lesson accepts (the smallest is 1). */
export const MAX_WEIGHT = 99;

/** @typedef {'heap' | 'array'} PrimVariant */
export const VARIANTS = /** @type {PrimVariant[]} */ (['heap', 'array']);

/**
 * @typedef {object} UEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] Defaults to 1.
 */

/**
 * @typedef {object} PrimEntry
 * @property {number} w     Edge weight.
 * @property {number} edge  Input edge index.
 * @property {number} from  Tree end when pushed.
 * @property {number} to    Far end.
 */

/**
 * @typedef {object} PrimFrame
 * @property {'start'|'stale'|'add'|'push'|'improve'|'keep'|'unreachable'|'done'} kind
 * @property {PrimVariant} variant
 * @property {number} current     Vertex just added, or whose edges are examined, or the tree end
 *   of a stale edge; -1 when none.
 * @property {number} neighbor    Other end of that edge (on 'add', the tree end), -1 when none.
 * @property {number} edge        Input index of that edge, -1 when none.
 * @property {number} before      Array variant: neighbour’s key before the update.
 * @property {boolean[]} inTree
 * @property {number[]} parentEdge  Input edge index that joined each vertex, -1 when none.
 * @property {number[]} key       Array variant: lightest known edge into each vertex (∞ none).
 * @property {PrimEntry[]} heap   Heap variant: the heap in array order, minimum first.
 * @property {number[]} added     Vertices in the order they joined the tree.
 * @property {number} weight      Total weight of the tree edges.
 * @property {number} pushes      Heap pushes.
 * @property {number} pops        Heap pops.
 * @property {number} stale       Stale entries skipped.
 * @property {number} comparisons Heap comparisons, or keys compared in the array scans.
 * @property {number} examined    Edges looked at from a vertex that just joined.
 * @property {number[]} lines
 */

/** @type {Record<PrimVariant, string[]>} */
export const primPseudocode = {
  heap: [
    'tree = {s}; push every edge s — x into heap',
    'while heap is not empty and tree has fewer than V vertices:',
    '  (w, u — v) = heap.popMin()       // v is the far end',
    '  if v is in tree: skip it   // stale: no longer crosses the cut',
    '  add v and edge u — v to tree',
    '  for each edge v — x with x not in tree:',
    '    heap.push((w(v — x), v — x))',
    'return tree',
  ],
  array: [
    'key[v] = ∞ for every v; key[s] = 0',
    'repeat V times:',
    '  u = vertex not in tree with the smallest key   // scan them all',
    '  if key[u] = ∞: stop   // the rest is unreachable',
    '  add u and edge parent[u] — u to tree',
    '  for each edge u — x with x not in tree:',
    '    if w(u — x) < key[x]: key[x] = w(u — x); parent[x] = u',
    'return tree',
  ],
};

/**
 * @param {number[]} ids
 * @param {UEdge[]} edges
 */
function adjacency(ids, edges) {
  const { n, list } = indexEdges(ids, edges);
  /** @type {{to: number, w: number, edge: number}[][]} */
  const adj = Array.from({ length: n }, () => []);
  for (const { u, v, w, edge } of list) {
    adj[u].push({ to: v, w, edge });
    adj[v].push({ to: u, w, edge });
  }
  for (const l of adj) l.sort((x, y) => x.to - y.to || x.edge - y.edge);
  return { n, adj };
}

/**
 * @param {{ ids: number[], edges: UEdge[], start: number, variant?: PrimVariant }} input
 *   `start` is a vertex index.
 * @returns {PrimFrame[]}
 */
export function primTrace({ ids, edges, start, variant = 'heap' }) {
  const { n, adj } = adjacency(ids, edges);
  const inTree = new Array(n).fill(false);
  const parentEdge = new Array(n).fill(-1);
  const key = new Array(n).fill(Infinity);
  /** @type {number[]} */
  const added = [];
  const heap = makeHeap(
    /** @param {PrimEntry} a @param {PrimEntry} b */
    (a, b) => a.w < b.w || (a.w === b.w && a.edge < b.edge),
  );
  let weight = 0;
  let pushes = 0;
  let pops = 0;
  let stale = 0;
  let scanned = 0;
  let examined = 0;

  /** @type {PrimFrame[]} */
  const frames = [];
  /** @param {Pick<PrimFrame, 'kind'|'lines'> & Partial<PrimFrame>} f */
  const push = (f) =>
    frames.push({
      current: -1,
      neighbor: -1,
      edge: -1,
      before: Infinity,
      ...f,
      variant,
      inTree: inTree.slice(),
      parentEdge: parentEdge.slice(),
      key: variant === 'array' ? key.slice() : [],
      heap: heap.a.map((e) => ({ ...e })),
      added: added.slice(),
      weight,
      pushes,
      pops,
      stale,
      comparisons: variant === 'heap' ? heap.counter.comparisons : scanned,
      examined,
    });

  if (start < 0 || start >= n) {
    push({ kind: 'start', lines: [0] });
    push({ kind: 'done', lines: [7] });
    return frames;
  }

  if (variant === 'heap') {
    inTree[start] = true;
    added.push(start);
    for (const { to, w, edge } of adj[start]) {
      examined++;
      heap.push({ w, edge, from: start, to });
      pushes++;
    }
    push({ kind: 'start', current: start, lines: [0] });
    while (heap.a.length && added.length < n) {
      const top = heap.pop();
      pops++;
      const base = { current: top.from, neighbor: top.to, edge: top.edge };
      if (inTree[top.to]) {
        stale++;
        push({ kind: 'stale', ...base, lines: [1, 2, 3] });
        continue;
      }
      const v = top.to;
      inTree[v] = true;
      parentEdge[v] = top.edge;
      added.push(v);
      weight += top.w;
      push({ kind: 'add', current: v, neighbor: top.from, edge: top.edge, lines: [1, 2, 4] });
      for (const { to, w, edge } of adj[v]) {
        examined++;
        if (inTree[to]) continue;
        heap.push({ w, edge, from: v, to });
        pushes++;
        push({ kind: 'push', current: v, neighbor: to, edge, lines: [5, 6] });
      }
    }
    push({ kind: 'done', lines: [1, 7] });
    return frames;
  }

  key[start] = 0;
  push({ kind: 'start', current: start, lines: [0] });
  for (let round = 0; round < n; round++) {
    let u = -1;
    for (let x = 0; x < n; x++) {
      if (inTree[x]) continue;
      if (u >= 0) scanned++;
      if (u < 0 || key[x] < key[u]) u = x;
    }
    if (key[u] === Infinity) {
      push({ kind: 'unreachable', current: u, lines: [1, 2, 3] });
      break;
    }
    inTree[u] = true;
    added.push(u);
    if (parentEdge[u] >= 0) weight += key[u];
    const from = parentEdge[u] >= 0 ? otherEnd(adj, u, parentEdge[u]) : -1;
    push({ kind: 'add', current: u, neighbor: from, edge: parentEdge[u], lines: [1, 2, 4] });
    for (const { to, w, edge } of adj[u]) {
      examined++;
      if (inTree[to]) continue;
      const before = key[to];
      const base = { current: u, neighbor: to, edge, before };
      if (w < key[to]) {
        key[to] = w;
        parentEdge[to] = edge;
        push({ kind: 'improve', ...base, lines: [5, 6] });
      } else push({ kind: 'keep', ...base, lines: [5, 6] });
    }
  }
  push({ kind: 'done', lines: [7] });
  return frames;
}

/**
 * @param {{to: number, edge: number}[][]} adj
 * @param {number} u
 * @param {number} edge
 */
function otherEnd(adj, u, edge) {
  return adj[u].find((a) => a.edge === edge)?.to ?? -1;
}
