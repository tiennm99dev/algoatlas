/**
 * Dijkstra's algorithm on an undirected graph with non-negative edge weights, using a binary
 * min-heap of (distance, vertex) entries and lazy deletion: when a shorter route to v is found,
 * a new entry is pushed and the old one is left in the heap. An entry whose distance is larger
 * than the vertex's current label is stale; it is skipped when it reaches the top.
 *
 * Vertices are numbered by their position in `ids` sorted ascending. Heap entries compare by
 * distance, then by vertex number, so runs are deterministic. A vertex's edges are examined in
 * order of the neighbour's number.
 */

/** Largest graph the lesson draws. */
export const MAX_NODES = 8;
/** Largest edge weight the lesson accepts. */
export const MAX_WEIGHT = 99;

/**
 * @typedef {object} UEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] Defaults to 1.
 */

/**
 * @typedef {object} HeapEntry
 * @property {number} d  Distance stored with the entry.
 * @property {number} v  Vertex index.
 */

/**
 * @typedef {object} DijkstraFrame
 * @property {'start'|'settle'|'stale'|'improve'|'keep'|'done'} kind
 * @property {number} current     Vertex being settled or whose edges are examined, -1 when none.
 * @property {number} neighbor    Vertex at the other end of the examined edge, -1 when none.
 * @property {number} edge        Index of the examined edge in the input list, -1 when none.
 * @property {number} weight      Weight of the examined edge.
 * @property {HeapEntry | null} popped  Entry just removed from the heap.
 * @property {number} pushedAt    Heap slot of the entry just pushed, -1 when none.
 * @property {number} before      Neighbour's label before this relaxation.
 * @property {HeapEntry[]} heap   The binary heap in array order (slot 0 is the minimum).
 * @property {number[]} dist      Label per vertex (Infinity = ∞).
 * @property {number[]} parent    Parent per vertex, -1 when none.
 * @property {boolean[]} settled
 * @property {number[]} order     Vertices in the order they were settled.
 * @property {number} pushes
 * @property {number} pops
 * @property {number} stale       Stale entries skipped.
 * @property {number} relaxations Edges examined from a settled vertex.
 * @property {number} maxHeap     Largest heap size so far.
 * @property {number[]} lines
 */

export const dijkstraPseudocode = [
  'dist[v] = ∞ for every v; dist[s] = 0',
  'heap = [(0, s)]',
  'while heap is not empty:',
  '  (d, u) = heap.popMin()',
  '  if d > dist[u]: continue    // stale entry, skip it',
  '  settle u',
  '  for each edge u — v of weight w:',
  '    if dist[u] + w < dist[v]:',
  '      dist[v] = dist[u] + w; parent[v] = u',
  '      heap.push((dist[v], v))',
  'return dist, parent',
];

/** @param {HeapEntry} a @param {HeapEntry} b */
const less = (a, b) => a.d < b.d || (a.d === b.d && a.v < b.v);

/**
 * Pushes an entry and sifts it up.
 * @param {HeapEntry[]} heap
 * @param {HeapEntry} entry
 * @returns {number} The slot the entry ends in.
 */
export function heapPush(heap, entry) {
  heap.push(entry);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (!less(heap[i], heap[p])) break;
    [heap[i], heap[p]] = [heap[p], heap[i]];
    i = p;
  }
  return i;
}

/**
 * Removes the minimum: the last entry moves to the root and sifts down.
 * @param {HeapEntry[]} heap
 * @returns {HeapEntry | undefined}
 */
export function heapPop(heap) {
  const top = heap[0];
  const last = heap.pop();
  if (!heap.length || !last) return top;
  heap[0] = last;
  let i = 0;
  for (;;) {
    const l = 2 * i + 1;
    const r = l + 1;
    let m = i;
    if (l < heap.length && less(heap[l], heap[m])) m = l;
    if (r < heap.length && less(heap[r], heap[m])) m = r;
    if (m === i) break;
    [heap[i], heap[m]] = [heap[m], heap[i]];
    i = m;
  }
  return top;
}

/**
 * @param {number[]} ids
 * @param {UEdge[]} edges
 */
function adjacency(ids, edges) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const index = new Map(sorted.map((id, i) => [id, i]));
  /** @type {{to: number, w: number, edge: number}[][]} */
  const adj = sorted.map(() => []);
  edges.forEach((e, k) => {
    const u = index.get(e.from);
    const v = index.get(e.to);
    if (u === undefined || v === undefined || u === v) return;
    const w = e.weight ?? 1;
    adj[u].push({ to: v, w, edge: k });
    adj[v].push({ to: u, w, edge: k });
  });
  for (const list of adj) list.sort((a, b) => a.to - b.to || a.edge - b.edge);
  return { n: sorted.length, adj };
}

/**
 * @param {{ ids: number[], edges: UEdge[], source: number }} input  `source` is a vertex index.
 * @returns {DijkstraFrame[]}
 */
export function dijkstraTrace({ ids, edges, source }) {
  const { n, adj } = adjacency(ids, edges);
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  const settled = new Array(n).fill(false);
  /** @type {number[]} */
  const order = [];
  /** @type {HeapEntry[]} */
  const heap = [];
  let pushes = 0;
  let pops = 0;
  let stale = 0;
  let relaxations = 0;
  let maxHeap = 0;

  /** @type {DijkstraFrame[]} */
  const frames = [];
  /**
   * @param {Pick<DijkstraFrame, 'kind'|'lines'> & Partial<DijkstraFrame>} f
   */
  const push = (f) =>
    frames.push({
      current: -1,
      neighbor: -1,
      edge: -1,
      weight: 0,
      popped: null,
      pushedAt: -1,
      before: Infinity,
      ...f,
      heap: heap.map((e) => ({ ...e })),
      dist: dist.slice(),
      parent: parent.slice(),
      settled: settled.slice(),
      order: order.slice(),
      pushes,
      pops,
      stale,
      relaxations,
      maxHeap,
    });

  if (source < 0 || source >= n) {
    push({ kind: 'start', lines: [0, 1] });
    push({ kind: 'done', lines: [10] });
    return frames;
  }
  dist[source] = 0;
  const at = heapPush(heap, { d: 0, v: source });
  pushes++;
  maxHeap = 1;
  push({ kind: 'start', pushedAt: at, lines: [0, 1] });

  while (heap.length) {
    const top = /** @type {HeapEntry} */ (heapPop(heap));
    pops++;
    const u = top.v;
    if (top.d > dist[u]) {
      stale++;
      push({ kind: 'stale', current: u, popped: { ...top }, lines: [2, 3, 4] });
      continue;
    }
    settled[u] = true;
    order.push(u);
    push({ kind: 'settle', current: u, popped: { ...top }, lines: [2, 3, 5] });
    for (const { to, w, edge } of adj[u]) {
      relaxations++;
      const before = dist[to];
      const base = { current: u, neighbor: to, edge, weight: w, before };
      if (dist[u] + w < dist[to]) {
        dist[to] = dist[u] + w;
        parent[to] = u;
        const slot = heapPush(heap, { d: dist[to], v: to });
        pushes++;
        maxHeap = Math.max(maxHeap, heap.length);
        push({ kind: 'improve', ...base, pushedAt: slot, lines: [6, 7, 8, 9] });
      } else {
        push({ kind: 'keep', ...base, lines: [6, 7] });
      }
    }
  }
  push({ kind: 'done', lines: [10] });
  return frames;
}
