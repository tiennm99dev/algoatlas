/**
 * Minimum spanning tree problems on one undirected weighted graph.
 *
 * - `judgeTree` checks a learner’s predicted tree: it must have V − 1 edges and no cycle,
 *   and it is minimum exactly when no edge outside it is lighter than the heaviest tree edge on
 *   the cycle that edge would close (the cycle property). When one is, the swap is returned.
 * - `bottleneckTrace` finds a minimum bottleneck path: a path from s to t whose heaviest edge
 *   is as light as possible. It runs Kruskal (edges by weight, ties by input order, union-find)
 *   and stops at the first edge after which s and t share a tree. That edge’s weight is the
 *   bottleneck, and the path through the forest built so far uses no heavier edge. The same
 *   path lies in the minimum spanning tree, so MST paths are minimum bottleneck paths.
 * - `secondBestTrace` finds a second-best spanning tree: the lightest spanning tree that differs
 *   from the minimum spanning tree T. One always differs from T by a single swap, so for every
 *   edge e outside T it drops the heaviest edge f on the T-path between e’s ends and keeps the
 *   cheapest W − w(f) + w(e). On a tie the first edge in input order stays.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; edges keep their input
 * order.
 */

import { indexEdges } from './weighted-edges.js';

/** Largest graph the lesson draws. */
export const MAX_NODES = 8;
/** Largest edge weight the lesson accepts (the smallest is 1). */
export const MAX_WEIGHT = 99;

/**
 * @typedef {object} UEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] Defaults to 1.
 */

/** @typedef {{u: number, v: number, w: number}} EdgeInfo */

/**
 * @typedef {object} TreeVerdict
 * @property {'disconnected'|'cycle'|'size'|'heavier'|'minimum'} kind
 * @property {number} weight  Total weight of the chosen edges.
 * @property {number} best    Weight of a minimum spanning tree (forest when disconnected).
 * @property {number} need    V − 1.
 * @property {number} count   Edges chosen.
 * @property {number} closing On 'cycle': a chosen edge that closes a cycle; else -1.
 * @property {number} add     On 'heavier': an edge outside the tree to add; else -1.
 * @property {number} drop    On 'heavier': the tree edge it replaces; else -1.
 */

/**
 * @typedef {object} BottleneckFrame
 * @property {'start'|'accept'|'reject'|'joined'|'done'} kind
 * @property {number} source
 * @property {number} target
 * @property {number} edge        Edge considered now, -1 when none.
 * @property {number[]} sorted    Edge indices in the order they are taken.
 * @property {('' | 'tree' | 'cycle')[]} status  Per input edge.
 * @property {number[]} parent    Union-find parent per vertex.
 * @property {number} considered
 * @property {number} bottleneck  The answer once found (Infinity before, or when s and t never meet).
 * @property {number[]} path      From 'joined' on: the vertices s → … → t in the forest.
 * @property {number[]} pathEdges From 'joined' on: the edges of that path, in order.
 * @property {number[]} lines
 */

/**
 * @typedef {object} SecondBestFrame
 * @property {'start'|'better'|'worse'|'done'} kind
 * @property {number[]} tree      Edges of the minimum spanning tree T.
 * @property {number} mst         Its weight W (Infinity when the graph is disconnected).
 * @property {number} edge        Edge e outside T examined now, -1 when none.
 * @property {number} drop        Heaviest edge f on the T-path between e’s ends, -1 when none.
 * @property {number[]} pathEdges That T-path, in order.
 * @property {number} candidate   W − w(f) + w(e) for this e.
 * @property {number} best        Lightest candidate so far (Infinity when none).
 * @property {number} bestAdd     Edge added by the best swap, -1 when none.
 * @property {number} bestDrop    Edge dropped by the best swap, -1 when none.
 * @property {number} checked     Edges outside T examined so far.
 * @property {number[]} lines
 */

export const bottleneckPseudocode = [
  'sort the edges by weight; every vertex is its own set',
  'for each edge u — v in sorted order:',
  '  if find(u) = find(v): skip it',
  '  union(u, v)',
  '  if find(s) = find(t): bottleneck = w(u — v); stop',
  'path s → t in the forest: no edge on it is heavier than the bottleneck',
];

export const secondBestPseudocode = [
  'T = a minimum spanning tree, of weight W',
  'best = ∞',
  'for each edge e = u — v not in T:',
  '  f = the heaviest edge on the path u → v in T',
  '  if W − w(f) + w(e) < best: best = W − w(f) + w(e); swap = (add e, drop f)',
  'return best    // the second-best spanning tree',
];

/**
 * Every input edge by its ends' vertex numbers; loops and unknown ends keep u = v = -1.
 * @param {number[]} ids
 * @param {UEdge[]} edges
 */
export function edgeInfo(ids, edges) {
  const { n, list: indexed } = indexEdges(ids, edges);
  /** @type {EdgeInfo[]} */
  const list = edges.map((e) => ({ u: -1, v: -1, w: e.weight ?? 1 }));
  for (const { u, v, w, edge } of indexed) list[edge] = { u, v, w };
  return { n, list };
}

/** @param {EdgeInfo[]} list */
const usable = (list) =>
  list.map((_, k) => k).filter((k) => list[k].u >= 0 && list[k].v >= 0 && list[k].u !== list[k].v);

/** @param {EdgeInfo[]} list */
const byWeight = (list) => usable(list).sort((a, b) => list[a].w - list[b].w || a - b);

/** @param {number} n */
function unionFind(n) {
  const parent = [...Array(n).keys()];
  /** @param {number} x @returns {number} */
  const find = (x) => {
    while (parent[x] !== x) x = parent[x];
    return x;
  };
  return { parent, find };
}

/**
 * A minimum spanning forest by Kruskal: edge indices, total weight and number of trees.
 * @param {number[]} ids
 * @param {UEdge[]} edges
 */
export function minimumTree(ids, edges) {
  const { n, list } = edgeInfo(ids, edges);
  const { parent, find } = unionFind(n);
  /** @type {number[]} */
  const tree = [];
  let weight = 0;
  for (const k of byWeight(list)) {
    const a = find(list[k].u);
    const b = find(list[k].v);
    if (a === b) continue;
    parent[b] = a;
    tree.push(k);
    weight += list[k].w;
  }
  return { tree, weight, components: n - tree.length };
}

/**
 * The path between two vertices using only the given edges, as vertices and edges in order;
 * null when there is none.
 * @param {number} n
 * @param {EdgeInfo[]} list
 * @param {number[]} chosen
 * @param {number} a
 * @param {number} b
 */
export function pathIn(n, list, chosen, a, b) {
  /** @type {{to: number, edge: number}[][]} */
  const adj = Array.from({ length: n }, () => []);
  for (const k of chosen) {
    adj[list[k].u].push({ to: list[k].v, edge: k });
    adj[list[k].v].push({ to: list[k].u, edge: k });
  }
  const via = new Array(n).fill(-2);
  via[a] = -1;
  const queue = [a];
  while (queue.length) {
    const x = /** @type {number} */ (queue.shift());
    for (const { to, edge } of adj[x]) {
      if (via[to] !== -2) continue;
      via[to] = edge;
      queue.push(to);
    }
  }
  if (via[b] === -2) return null;
  const vertices = [b];
  /** @type {number[]} */
  const path = [];
  for (let x = b; x !== a;) {
    const k = via[x];
    path.unshift(k);
    x = list[k].u === x ? list[k].v : list[k].u;
    vertices.unshift(x);
  }
  return { vertices, edges: path };
}

/** @param {EdgeInfo[]} list @param {number[]} path */
const heaviest = (list, path) =>
  path.reduce((best, k) => (best < 0 || list[k].w > list[best].w ? k : best), -1);

/**
 * Judges a predicted spanning tree.
 * @param {number[]} ids
 * @param {UEdge[]} edges
 * @param {number[]} chosen  Input edge indices.
 * @returns {TreeVerdict}
 */
export function judgeTree(ids, edges, chosen) {
  const { n, list } = edgeInfo(ids, edges);
  const picked = [...new Set(chosen)].filter((k) => list[k] && list[k].u >= 0);
  const mst = minimumTree(ids, edges);
  const weight = picked.reduce((s, k) => s + list[k].w, 0);
  const base = {
    weight,
    best: mst.weight,
    need: Math.max(0, n - 1),
    count: picked.length,
    closing: -1,
    add: -1,
    drop: -1,
  };
  if (mst.components > 1) return { kind: 'disconnected', ...base };
  const { parent, find } = unionFind(n);
  for (const k of picked) {
    const a = find(list[k].u);
    const b = find(list[k].v);
    if (a === b) return { kind: 'cycle', ...base, closing: k };
    parent[b] = a;
  }
  if (picked.length !== n - 1) return { kind: 'size', ...base };
  const inTree = new Set(picked);
  for (const k of byWeight(list)) {
    if (inTree.has(k)) continue;
    const path = pathIn(n, list, picked, list[k].u, list[k].v);
    const f = path ? heaviest(list, path.edges) : -1;
    if (f >= 0 && list[k].w < list[f].w) return { kind: 'heavier', ...base, add: k, drop: f };
  }
  return { kind: 'minimum', ...base };
}

/**
 * @param {{ ids: number[], edges: UEdge[], source: number, target: number }} input
 *   `source` and `target` are vertex indices.
 * @returns {BottleneckFrame[]}
 */
export function bottleneckTrace({ ids, edges, source, target }) {
  const { n, list } = edgeInfo(ids, edges);
  const sorted = byWeight(list);
  const { parent, find } = unionFind(n);
  /** @type {('' | 'tree' | 'cycle')[]} */
  const status = list.map(() => '');
  let considered = 0;
  let bottleneck = Infinity;
  /** @type {number[]} */
  let path = [];
  /** @type {number[]} */
  let pathEdges = [];
  /** @type {BottleneckFrame[]} */
  const frames = [];
  /** @param {Pick<BottleneckFrame, 'kind'|'lines'> & Partial<BottleneckFrame>} f */
  const push = (f) =>
    frames.push({
      edge: -1,
      ...f,
      source,
      target,
      sorted: sorted.slice(),
      status: status.slice(),
      parent: parent.slice(),
      considered,
      bottleneck,
      path: path.slice(),
      pathEdges: pathEdges.slice(),
    });

  const valid = source >= 0 && source < n && target >= 0 && target < n;
  push({ kind: 'start', lines: [0] });
  if (!valid) {
    push({ kind: 'done', lines: [5] });
    return frames;
  }
  if (source === target) {
    bottleneck = 0;
    path = [source];
    push({ kind: 'done', lines: [5] });
    return frames;
  }
  for (const k of sorted) {
    considered++;
    const a = find(list[k].u);
    const b = find(list[k].v);
    if (a === b) {
      status[k] = 'cycle';
      push({ kind: 'reject', edge: k, lines: [1, 2] });
      continue;
    }
    parent[b] = a;
    status[k] = 'tree';
    if (find(source) === find(target)) {
      bottleneck = list[k].w;
      const tree = status.flatMap((s, j) => (s === 'tree' ? [j] : []));
      const found = /** @type {{vertices: number[], edges: number[]}} */ (
        pathIn(n, list, tree, source, target)
      );
      path = found.vertices;
      pathEdges = found.edges;
      push({ kind: 'joined', edge: k, lines: [1, 3, 4] });
      push({ kind: 'done', lines: [5] });
      return frames;
    }
    push({ kind: 'accept', edge: k, lines: [1, 3, 4] });
  }
  push({ kind: 'done', lines: [5] });
  return frames;
}

/**
 * @param {{ ids: number[], edges: UEdge[] }} input
 * @returns {SecondBestFrame[]}
 */
export function secondBestTrace({ ids, edges }) {
  const { n, list } = edgeInfo(ids, edges);
  const mst = minimumTree(ids, edges);
  const connected = mst.components <= 1;
  const tree = mst.tree.slice();
  const W = connected ? mst.weight : Infinity;
  let best = Infinity;
  let bestAdd = -1;
  let bestDrop = -1;
  let checked = 0;
  /** @type {SecondBestFrame[]} */
  const frames = [];
  /** @param {Pick<SecondBestFrame, 'kind'|'lines'> & Partial<SecondBestFrame>} f */
  const push = (f) =>
    frames.push({
      edge: -1,
      drop: -1,
      pathEdges: [],
      candidate: Infinity,
      ...f,
      tree: tree.slice(),
      mst: W,
      best,
      bestAdd,
      bestDrop,
      checked,
    });

  push({ kind: 'start', lines: [0, 1] });
  if (!connected) {
    push({ kind: 'done', lines: [5] });
    return frames;
  }
  const inTree = new Set(tree);
  for (const k of usable(list)) {
    if (inTree.has(k)) continue;
    checked++;
    const path = /** @type {{edges: number[]}} */ (pathIn(n, list, tree, list[k].u, list[k].v));
    const f = heaviest(list, path.edges);
    const candidate = W - list[f].w + list[k].w;
    const base = { edge: k, drop: f, pathEdges: path.edges, candidate };
    if (candidate < best) {
      best = candidate;
      bestAdd = k;
      bestDrop = f;
      push({ kind: 'better', ...base, lines: [2, 3, 4] });
    } else push({ kind: 'worse', ...base, lines: [2, 3] });
  }
  push({ kind: 'done', lines: [5] });
  return frames;
}
