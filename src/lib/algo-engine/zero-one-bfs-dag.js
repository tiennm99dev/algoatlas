/**
 * Two shortest-path methods that need no heap.
 *
 * 0-1 BFS: when every weight is 0 or 1, a deque replaces Dijkstra's heap. An edge of weight 0
 * keeps the distance, so its target goes to the front; an edge of weight 1 adds one, so its
 * target goes to the back. The deque then always holds labels d and d + 1 in sorted order. A
 * vertex can sit in the deque twice; the later copy is skipped once the vertex is done.
 *
 * DAG paths: in a directed acyclic graph, relax every vertex's out-edges in topological order.
 * When u is reached, every edge into u has already been relaxed, so d[u] is final. Weights may
 * be negative, and flipping the comparison (start at −∞, keep the larger sum) gives longest
 * paths, which are hard in general graphs but easy in a DAG.
 *
 * Vertices are indices 0..n-1. Out-edges are tried in order of their target, then edge index.
 * The topological order is Kahn's, taking the smallest ready vertex first.
 */

/** Largest edge weight in DAG mode, and the most negative is its opposite. */
export const MAX_WEIGHT = 99;

/**
 * @typedef {object} DirEdge
 * @property {number} from
 * @property {number} to
 * @property {number} weight
 */

/**
 * @typedef {object} DequeEntry
 * @property {number} v  Vertex index.
 * @property {number} d  The vertex's label when the entry was pushed.
 */

/**
 * @typedef {object} ZeroOneFrame
 * @property {'start'|'pop'|'skip'|'improve'|'keep'|'done'} kind
 * @property {number} current   Vertex popped or expanded, -1 when none.
 * @property {number} neighbor  Target of the examined edge, -1 when none.
 * @property {number} edge      Examined edge index, -1 when none.
 * @property {number} weight    Weight of the examined edge.
 * @property {number} before    Target's label before the relaxation.
 * @property {boolean} front    The improved vertex went to the front of the deque.
 * @property {DequeEntry[]} deque  Entries, front first.
 * @property {number[]} dist    Label per vertex (Infinity = ∞).
 * @property {number[]} parent
 * @property {boolean[]} done   Vertices already expanded.
 * @property {number} pops
 * @property {number} pushFront
 * @property {number} pushBack
 * @property {number} relaxations  Edges examined.
 * @property {number[]} lines
 */

/**
 * @typedef {object} DagFrame
 * @property {'start'|'init'|'take'|'skip'|'improve'|'keep'|'done'|'cycle'} kind
 * @property {number} current   Vertex whose edges are relaxed, -1 when none.
 * @property {number} neighbor
 * @property {number} edge
 * @property {number} weight
 * @property {number} before
 * @property {number[]} order   Topological order (all vertices), empty on a cycle.
 * @property {number} pos       Position of `current` in `order`, -1 when none.
 * @property {number[]} dist    Label per vertex (±Infinity when unreached).
 * @property {number[]} parent
 * @property {number} relaxations
 * @property {number} updates
 * @property {number[]} lines
 */

export const zeroOnePseudocode = [
  'dist[v] = ∞ for every v; dist[s] = 0',
  'deque = [s]',
  'while deque is not empty:',
  '  u = deque.popFront()',
  '  if u is done: continue    // a later copy of u',
  '  mark u done',
  '  for each edge u → v of weight w (0 or 1):',
  '    if dist[u] + w < dist[v]:',
  '      dist[v] = dist[u] + w; parent[v] = u',
  '      if w == 0: deque.pushFront(v) else: deque.pushBack(v)',
  'return dist, parent',
];

export const dagShortPseudocode = [
  'order = a topological order of the DAG',
  'dist[v] = ∞ for every v; dist[s] = 0',
  'for each u in order:',
  '  if dist[u] == ∞: continue    // s cannot reach u',
  '  for each edge u → v of weight w:',
  '    if dist[u] + w < dist[v]:',
  '      dist[v] = dist[u] + w; parent[v] = u',
  'return dist, parent',
];

export const dagLongPseudocode = [
  'order = a topological order of the DAG',
  'dist[v] = −∞ for every v; dist[s] = 0',
  'for each u in order:',
  '  if dist[u] == −∞: continue    // s cannot reach u',
  '  for each edge u → v of weight w:',
  '    if dist[u] + w > dist[v]:',
  '      dist[v] = dist[u] + w; parent[v] = u',
  'return dist, parent',
];

/**
 * @param {number} n
 * @param {DirEdge[]} edges
 */
function outLists(n, edges) {
  /** @type {{to: number, w: number, edge: number}[][]} */
  const out = Array.from({ length: n }, () => []);
  edges.forEach((e, k) => {
    if (e.from >= 0 && e.from < n && e.to >= 0 && e.to < n && e.from !== e.to)
      out[e.from].push({ to: e.to, w: e.weight, edge: k });
  });
  for (const list of out) list.sort((a, b) => a.to - b.to || a.edge - b.edge);
  return out;
}

/**
 * Kahn's topological order, smallest ready vertex first; null when the graph has a cycle.
 * @param {number} n
 * @param {DirEdge[]} edges
 * @returns {number[] | null}
 */
export function topologicalOrder(n, edges) {
  const out = outLists(n, edges);
  const indeg = new Array(n).fill(0);
  for (const list of out) for (const { to } of list) indeg[to]++;
  /** @type {number[]} */
  const ready = [];
  for (let v = 0; v < n; v++) if (indeg[v] === 0) ready.push(v);
  const order = [];
  while (ready.length) {
    ready.sort((a, b) => a - b);
    const u = /** @type {number} */ (ready.shift());
    order.push(u);
    for (const { to } of out[u]) if (--indeg[to] === 0) ready.push(to);
  }
  return order.length === n ? order : null;
}

/**
 * @param {{ n: number, edges: DirEdge[], source: number }} input  Weights must be 0 or 1.
 * @returns {ZeroOneFrame[]}
 */
export function zeroOneTrace({ n, edges, source }) {
  const out = outLists(n, edges);
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  const done = new Array(n).fill(false);
  /** @type {DequeEntry[]} */
  let deque = [];
  let pops = 0;
  let pushFront = 0;
  let pushBack = 0;
  let relaxations = 0;

  /** @type {ZeroOneFrame[]} */
  const frames = [];
  /** @param {Pick<ZeroOneFrame, 'kind'|'lines'> & Partial<ZeroOneFrame>} f */
  const push = (f) =>
    frames.push({
      current: -1,
      neighbor: -1,
      edge: -1,
      weight: 0,
      before: Infinity,
      front: false,
      ...f,
      deque: deque.map((e) => ({ ...e })),
      dist: dist.slice(),
      parent: parent.slice(),
      done: done.slice(),
      pops,
      pushFront,
      pushBack,
      relaxations,
    });

  if (source < 0 || source >= n) {
    push({ kind: 'start', lines: [0, 1] });
    push({ kind: 'done', lines: [10] });
    return frames;
  }
  dist[source] = 0;
  deque = [{ v: source, d: 0 }];
  push({ kind: 'start', lines: [0, 1] });
  while (deque.length) {
    const u = /** @type {DequeEntry} */ (deque.shift()).v;
    pops++;
    if (done[u]) {
      push({ kind: 'skip', current: u, lines: [2, 3, 4] });
      continue;
    }
    done[u] = true;
    push({ kind: 'pop', current: u, lines: [2, 3, 5] });
    for (const { to, w, edge } of out[u]) {
      relaxations++;
      const before = dist[to];
      const base = { current: u, neighbor: to, edge, weight: w, before };
      if (dist[u] + w < dist[to]) {
        dist[to] = dist[u] + w;
        parent[to] = u;
        const front = w === 0;
        if (front) {
          deque = [{ v: to, d: dist[to] }, ...deque];
          pushFront++;
        } else {
          deque.push({ v: to, d: dist[to] });
          pushBack++;
        }
        push({ kind: 'improve', ...base, front, lines: [6, 7, 8, 9] });
      } else {
        push({ kind: 'keep', ...base, lines: [6, 7] });
      }
    }
  }
  push({ kind: 'done', lines: [10] });
  return frames;
}

/**
 * @param {{ n: number, edges: DirEdge[], source: number, longest?: boolean }} input
 * @returns {DagFrame[]}
 */
export function dagTrace({ n, edges, source, longest = false }) {
  const out = outLists(n, edges);
  const order = topologicalOrder(n, edges);
  const unreached = longest ? -Infinity : Infinity;
  const dist = new Array(n).fill(unreached);
  const parent = new Array(n).fill(-1);
  let relaxations = 0;
  let updates = 0;
  /** @param {number} a @param {number} b */
  const better = (a, b) => (longest ? a > b : a < b);

  /** @type {DagFrame[]} */
  const frames = [];
  /** @param {Pick<DagFrame, 'kind'|'lines'> & Partial<DagFrame>} f */
  const push = (f) =>
    frames.push({
      current: -1,
      neighbor: -1,
      edge: -1,
      weight: 0,
      before: unreached,
      pos: -1,
      ...f,
      order: order ? order.slice() : [],
      dist: dist.slice(),
      parent: parent.slice(),
      relaxations,
      updates,
    });

  if (!order) {
    push({ kind: 'cycle', lines: [0] });
    return frames;
  }
  push({ kind: 'start', lines: [0] });
  if (source >= 0 && source < n) dist[source] = 0;
  push({ kind: 'init', lines: [1] });
  order.forEach((u, pos) => {
    if (dist[u] === unreached) {
      push({ kind: 'skip', current: u, pos, lines: [2, 3] });
      return;
    }
    push({ kind: 'take', current: u, pos, lines: [2] });
    for (const { to, w, edge } of out[u]) {
      relaxations++;
      const before = dist[to];
      const base = { current: u, pos, neighbor: to, edge, weight: w, before };
      if (better(dist[u] + w, dist[to])) {
        dist[to] = dist[u] + w;
        parent[to] = u;
        updates++;
        push({ kind: 'improve', ...base, lines: [4, 5, 6] });
      } else {
        push({ kind: 'keep', ...base, lines: [4, 5] });
      }
    }
  });
  push({ kind: 'done', lines: [7] });
  return frames;
}
