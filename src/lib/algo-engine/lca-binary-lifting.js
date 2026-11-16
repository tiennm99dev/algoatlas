/**
 * Lowest common ancestor by binary lifting on a rooted tree.
 *
 * The tree is a parent list: node 0 is the root (parent −1) and every other node's parent has a
 * smaller index, so one forward pass sees a parent before its children. The jump table
 * up[k][v] is the ancestor 2^k levels above v; the root is its own parent, so a jump past the
 * root stays at the root. A query first lifts the deeper node by the depth difference, reading
 * its bits from high to low, then lifts both nodes together by every power of two that keeps
 * them apart. They end one step below the answer, so the answer is up[0] of either.
 *
 * The same answer also comes from the Euler tour: list every node when the walk enters it and
 * again after each child returns. Between the first visits of u and v, the shallowest node in
 * the tour is their LCA, so an LCA query becomes a range-minimum query.
 *
 * This file also holds the small editable tree model the other tree-technique lessons share.
 */

export const MAX_NODES = 16;
/** Rows of the jump table: 2^LOG > the deepest possible depth, MAX_NODES − 1. */
export const LOG = 4;

/**
 * A rooted tree with stable letter names, so a node keeps its name when others are removed.
 * @typedef {object} RootedTree
 * @property {string[]} labels
 * @property {number[]} parent  parent[0] = −1 and parent[v] < v for every other node.
 */

/** @param {RootedTree} t */
export function isRootedTree(t) {
  return (
    t.labels.length === t.parent.length &&
    t.parent.length > 0 &&
    t.parent[0] === -1 &&
    t.parent.every((p, v) => v === 0 || (Number.isInteger(p) && p >= 0 && p < v))
  );
}

/** Children of every node, in index order. @param {number[]} parent @returns {number[][]} */
export function childrenOf(parent) {
  /** @type {number[][]} */
  const kids = parent.map(() => []);
  parent.forEach((p, v) => {
    if (p >= 0) kids[p].push(v);
  });
  return kids;
}

/** Edges from the root down to every node. @param {number[]} parent */
export function depthsOf(parent) {
  /** @type {number[]} */
  const depth = [];
  parent.forEach((p, v) => (depth[v] = p < 0 ? 0 : depth[p] + 1));
  return depth;
}

/** First letter A–Z not used yet. @param {string[]} labels */
export function nextLabel(labels) {
  for (let c = 65; c <= 90; c++) {
    const l = String.fromCharCode(c);
    if (!labels.includes(l)) return l;
  }
  return '?';
}

/** @param {number[]} parent @returns {RootedTree} */
export const lettered = (parent) => ({
  labels: parent.map((_, i) => String.fromCharCode(65 + i)),
  parent: parent.slice(),
});

/**
 * Adds a new leaf under p, or returns null when the tree already has `max` nodes.
 * @param {RootedTree} t @param {number} p @param {number} [max]
 * @returns {RootedTree | null}
 */
export function addLeaf(t, p, max = MAX_NODES) {
  if (t.parent.length >= max) return null;
  return { labels: [...t.labels, nextLabel(t.labels)], parent: [...t.parent, p] };
}

/**
 * Removes v and everything below it. `keep` lists the old index of every node left, in their
 * new order, so a caller can carry its own per-node arrays across. The root cannot be removed.
 * @param {RootedTree} t @param {number} v
 * @returns {{ tree: RootedTree, keep: number[] }}
 */
export function removeSubtree(t, v) {
  const gone = t.parent.map(() => false);
  if (v > 0) t.parent.forEach((p, u) => (gone[u] = u === v || (p >= 0 && gone[p])));
  /** @type {number[]} */
  const keep = [];
  /** @type {number[]} */
  const newIndex = [];
  gone.forEach((g, u) => {
    newIndex[u] = g ? -1 : keep.length;
    if (!g) keep.push(u);
  });
  return {
    tree: {
      labels: keep.map((u) => t.labels[u]),
      parent: keep.map((u) => (t.parent[u] < 0 ? -1 : newIndex[t.parent[u]])),
    },
    keep,
  };
}

/**
 * A random parent list of n nodes, each node hanging under an earlier one. Recent nodes are
 * favoured, so the trees come out deeper than a uniform pick would make them.
 * @param {number} n @param {() => number} [rand]
 */
export function randomParents(n, rand = Math.random) {
  /** @type {number[]} */
  const parent = [-1];
  for (let v = 1; v < n; v++) {
    const span = Math.min(v, 4);
    parent.push(v - 1 - Math.floor(rand() * span));
  }
  return parent;
}

/** The deepest node, the first one on a tie. @param {number[]} parent */
export function deepestNode(parent) {
  const depth = depthsOf(parent);
  return depth.reduce((best, d, v) => (d > depth[best] ? v : best), 0);
}

/** LCA by walking parents, the oracle and the naive method. @param {number[]} parent @param {number} u @param {number} v */
export function naiveLca(parent, u, v) {
  const depth = depthsOf(parent);
  let a = u;
  let b = v;
  while (depth[a] > depth[b]) a = parent[a];
  while (depth[b] > depth[a]) b = parent[b];
  while (a !== b) {
    a = parent[a];
    b = parent[b];
  }
  return a;
}

export const liftingPseudocode = [
  'build: for each v: depth[v] = depth[parent[v]] + 1; up[0][v] = parent[v]',
  '  for k = 1 to LOG − 1:',
  '    for each v: up[k][v] = up[k−1][ up[k−1][v] ]',
  'lca(u, v):',
  '  if depth[u] < depth[v]: swap u, v',
  '  d = depth[u] − depth[v]',
  '  for k = LOG − 1 down to 0:',
  '    if bit k of d is 1: u = up[k][u]',
  '  if u = v: return u',
  '  for k = LOG − 1 down to 0:',
  '    if up[k][u] ≠ up[k][v]: u = up[k][u]; v = up[k][v]',
  '  return up[0][u]',
];

/**
 * @typedef {object} LiftFrame
 * @property {'start'|'base'|'fill'|'query'|'level'|'lift'|'skip'|'same'|'apart'|'jump'|'hold'|'answer'|'done'} kind
 * @property {(number | null)[][]} up  LOG rows; null for a cell not filled yet.
 * @property {(number | null)[]} depth
 * @property {number} k  Row in use, −1 when none.
 * @property {number} node  fill: the node whose cell is filled; −1 otherwise.
 * @property {number} mid  fill: up[k−1][node], the halfway ancestor; −1 otherwise.
 * @property {number} u  The query's u as the pseudocode names it now, −1 before the query.
 * @property {number} v  The query's v as the pseudocode names it now, −1 before the query.
 * @property {number} from  lift, jump: where u was before the move; −1 otherwise.
 * @property {number} fromV  jump: where v was before the move; −1 otherwise.
 * @property {boolean} swapped  level: whether u and v traded names.
 * @property {number} d  The depth difference, −1 before it is known.
 * @property {number} answer  −1 until found.
 * @property {number} cells  Table cells filled so far.
 * @property {number} reads  Table cells read by the query so far.
 * @property {number} moves  Pointer moves made by the query so far.
 * @property {number[]} lines
 */

/**
 * Builds the jump table, then answers lca(u, v).
 * @param {RootedTree} t @param {number} qu @param {number} qv
 * @returns {LiftFrame[]}
 */
export function liftingTrace(t, qu, qv) {
  if (!isRootedTree(t)) throw new Error('Not a rooted tree');
  const n = t.parent.length;
  if (!(qu >= 0 && qu < n && qv >= 0 && qv < n)) throw new Error('Query node out of range');
  /** @type {(number | null)[][]} */
  const up = Array.from({ length: LOG }, () => Array(n).fill(null));
  /** @type {(number | null)[]} */
  const depth = Array(n).fill(null);
  /** @type {LiftFrame[]} */
  const frames = [];
  let cells = 0;
  let reads = 0;
  let moves = 0;
  let u = -1;
  let v = -1;
  let d = -1;
  let answer = -1;

  /**
   * @param {LiftFrame['kind']} kind @param {number[]} lines
   * @param {Partial<Pick<LiftFrame, 'k'|'node'|'mid'|'from'|'fromV'|'swapped'>>} [extra]
   */
  function push(kind, lines, extra = {}) {
    frames.push({
      kind,
      up: up.map((r) => r.slice()),
      depth: depth.slice(),
      k: extra.k ?? -1,
      node: extra.node ?? -1,
      mid: extra.mid ?? -1,
      u,
      v,
      from: extra.from ?? -1,
      fromV: extra.fromV ?? -1,
      swapped: extra.swapped ?? false,
      d,
      answer,
      cells,
      reads,
      moves,
      lines: lines.slice(),
    });
  }
  /** @param {number} k @param {number} x */
  const cell = (k, x) => /** @type {number} */ (up[k][x]);

  push('start', [0]);
  for (let x = 0; x < n; x++) {
    const p = t.parent[x];
    depth[x] = p < 0 ? 0 : /** @type {number} */ (depth[p]) + 1;
    up[0][x] = p < 0 ? x : p;
    cells++;
  }
  push('base', [0]);
  for (let k = 1; k < LOG; k++) {
    for (let x = 0; x < n; x++) {
      const mid = cell(k - 1, x);
      up[k][x] = cell(k - 1, mid);
      cells++;
      push('fill', [1, 2], { k, node: x, mid });
    }
  }

  u = qu;
  v = qv;
  push('query', [3]);
  const swapped = /** @type {number} */ (depth[u]) < /** @type {number} */ (depth[v]);
  if (swapped) [u, v] = [v, u];
  d = /** @type {number} */ (depth[u]) - /** @type {number} */ (depth[v]);
  push('level', [4, 5], { swapped });
  for (let k = LOG - 1; k >= 0; k--) {
    if ((d >> k) & 1) {
      const from = u;
      reads++;
      moves++;
      u = cell(k, u);
      push('lift', [6, 7], { k, from });
    } else {
      push('skip', [6, 7], { k });
    }
  }
  if (u === v) {
    answer = u;
    push('same', [8]);
  } else {
    push('apart', [8]);
    for (let k = LOG - 1; k >= 0; k--) {
      reads += 2;
      if (cell(k, u) !== cell(k, v)) {
        const from = u;
        const fromV = v;
        moves += 2;
        u = cell(k, u);
        v = cell(k, v);
        push('jump', [9, 10], { k, from, fromV });
      } else {
        push('hold', [9, 10], { k });
      }
    }
    reads++;
    answer = cell(0, u);
    push('answer', [11]);
  }
  push('done', []);
  return frames;
}

/** Index of the frame where the query starts. @param {LiftFrame[]} frames */
export const queryStart = (frames) => frames.findIndex((f) => f.kind === 'query');

/**
 * The Euler tour of the tree, children in index order: a node is listed when the walk enters
 * it and again each time one of its children returns, 2n − 1 entries in all.
 * @param {number[]} parent
 * @returns {{ tour: number[], first: number[] }}
 */
export function eulerTour(parent) {
  const kids = childrenOf(parent);
  /** @type {number[]} */
  const tour = [];
  /** @type {number[]} */
  const first = parent.map(() => -1);
  /** @param {number} x */
  const walk = (x) => {
    first[x] = tour.length;
    tour.push(x);
    for (const c of kids[x]) {
      walk(c);
      tour.push(x);
    }
  };
  walk(0);
  return { tour, first };
}

/**
 * LCA as a range minimum over the Euler tour: the shallowest entry between the first visits of
 * u and v, both ends included. `at` is that entry's index in the tour.
 * @param {number[]} parent @param {number} u @param {number} v
 * @returns {{ tour: number[], lo: number, hi: number, at: number, node: number }}
 */
export function eulerLca(parent, u, v) {
  const { tour, first } = eulerTour(parent);
  const depth = depthsOf(parent);
  const lo = Math.min(first[u], first[v]);
  const hi = Math.max(first[u], first[v]);
  let at = lo;
  for (let i = lo + 1; i <= hi; i++) if (depth[tour[i]] < depth[tour[at]]) at = i;
  return { tour, lo, hi, at, node: tour[at] };
}

/**
 * Nodes on the path from a up to its ancestor top, both included.
 * @param {number[]} parent @param {number} a @param {number} top
 */
export function pathUp(parent, a, top) {
  const out = [a];
  for (let x = a; x !== top && x > 0;) {
    x = parent[x];
    out.push(x);
  }
  return out;
}

export const PRESETS = /** @type {const} */ (['family', 'path', 'broom', 'random']);
/** @typedef {typeof PRESETS[number]} LiftPreset */

/**
 * A preset tree and a query pair worth stepping through.
 * @param {LiftPreset} preset @param {() => number} [rand]
 * @returns {{ tree: RootedTree, u: number, v: number }}
 */
export function makeLiftPreset(preset, rand = Math.random) {
  if (preset === 'family')
    return { tree: lettered([-1, 0, 0, 1, 1, 2, 3, 3, 4, 5, 5, 7, 9, 11]), u: 13, v: 8 };
  if (preset === 'path')
    return { tree: lettered(Array.from({ length: 16 }, (_, i) => i - 1)), u: 15, v: 0 };
  if (preset === 'broom')
    return { tree: lettered([-1, 0, 1, 2, 3, 4, 5, 6, 6, 6, 8, 9, 7]), u: 10, v: 12 };
  const n = 8 + Math.floor(rand() * (MAX_NODES - 7));
  const parent = randomParents(n, rand);
  const u = deepestNode(parent);
  return { tree: lettered(parent), u, v: u === n - 1 ? Math.max(1, n - 2) : n - 1 };
}
