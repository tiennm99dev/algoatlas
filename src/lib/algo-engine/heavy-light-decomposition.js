/**
 * Heavy-light decomposition of a rooted tree, then a path-sum query split into chain ranges.
 *
 * The tree is a parent list (node 0 the root, parent[v] < v) with a value on every node. The
 * first walk computes subtree sizes in post-order; each node's heavy child is the child with
 * the largest subtree, the first in index order on a tie, and the edge to it is heavy. Every
 * other edge is light. The second walk numbers the nodes, heavy child first, so every chain of
 * heavy edges takes a block of consecutive positions, and records each node's chain head.
 *
 * Below a light edge a subtree has at most half its parent's nodes, so any root path crosses at
 * most log₂ n light edges and any u–v path meets O(log n) chains. A path query climbs from the
 * end whose chain head is deeper, summing that chain's range of positions, until both ends
 * share a chain; then one last range covers the stretch between them. Each range is one
 * query on a sum segment tree over the positions, counted here as the nodes it visits.
 */

import { childrenOf, depthsOf, isRootedTree } from './lca-binary-lifting.js';

export const MAX_VALUE = 9;

/**
 * @typedef {import('./lca-binary-lifting.js').RootedTree & { value: number[] }} ValuedTree
 */

/**
 * @typedef {object} ChainRange
 * @property {number} from  First position, inclusive.
 * @property {number} to  Last position, inclusive.
 * @property {number} head  The chain head the range starts at, or the upper end of the last range.
 * @property {number} sum
 * @property {number} visits  Segment-tree nodes the range query visited.
 */

/**
 * @typedef {object} HldFrame
 * @property {'start'|'size'|'place'|'query'|'range'|'last'|'done'} kind
 * @property {(number | null)[]} size
 * @property {(number | null)[]} heavy  −1 for a leaf; null until known.
 * @property {(number | null)[]} head
 * @property {(number | null)[]} pos
 * @property {number} current  Node sized or placed now, −1 otherwise.
 * @property {'root'|'heavy'|'light'|''} via  place: how the walk reached the node.
 * @property {number} u  −1 before the query.
 * @property {number} v  −1 before the query.
 * @property {boolean} swapped  range, last: whether u and v traded names first.
 * @property {ChainRange[]} ranges  Ranges summed so far, in order.
 * @property {number} sum  Running answer.
 * @property {number} visits  Segment-tree nodes visited so far.
 * @property {number} pathNodes  Nodes on the u–v path, what a walk along it reads; 0 before the query.
 * @property {number[]} lines
 */

export const hldPseudocode = [
  'dfs1(v): size[v] = 1; for each child c: dfs1(c); size[v] += size[c]',
  '  heavy[v] = the child with the largest size (none for a leaf)',
  'dfs2(v, h): head[v] = h; pos[v] = next++',
  '  if v has a heavy child: dfs2(heavy[v], h)     (same chain)',
  '  for each light child c: dfs2(c, c)            (new chain)',
  'query(u, v):',
  '  while head[u] ≠ head[v]:',
  '    if depth[head[u]] < depth[head[v]]: swap u, v',
  '    ans += sum(pos[head[u]] .. pos[u]); u = parent[head[u]]',
  '  if depth[u] > depth[v]: swap u, v',
  '  ans += sum(pos[u] .. pos[v]); return ans',
];

/**
 * Sizes, heavy children, heads and positions in one go, without a trace.
 * @param {number[]} parent
 */
export function decompose(parent) {
  const kids = childrenOf(parent);
  const n = parent.length;
  const size = Array(n).fill(1);
  for (let v = n - 1; v > 0; v--) size[parent[v]] += size[v];
  const heavy = kids.map((cs) =>
    cs.reduce((best, c) => (best < 0 || size[c] > size[best] ? c : best), -1),
  );
  const head = Array(n).fill(0);
  const pos = Array(n).fill(0);
  let next = 0;
  /** @param {number} v @param {number} h */
  const place = (v, h) => {
    head[v] = h;
    pos[v] = next++;
    if (heavy[v] >= 0) place(heavy[v], h);
    for (const c of kids[v]) if (c !== heavy[v]) place(c, c);
  };
  place(0, 0);
  return { size, heavy, head, pos, depth: depthsOf(parent) };
}

/**
 * A sum segment tree over `base`, counting the nodes a range query visits, the calls that
 * return at once because they lie outside the range included.
 * @param {number[]} base
 */
export function sumTree(base) {
  const n = base.length;
  const tree = Array(4 * Math.max(1, n)).fill(0);
  /** @param {number} node @param {number} lo @param {number} hi */
  const build = (node, lo, hi) => {
    if (lo === hi) {
      tree[node] = base[lo];
      return;
    }
    const mid = (lo + hi) >> 1;
    build(2 * node, lo, mid);
    build(2 * node + 1, mid + 1, hi);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
  };
  build(1, 0, n - 1);
  return {
    /**
     * @param {number} l @param {number} r  Inclusive positions.
     * @returns {{ sum: number, visits: number }}
     */
    query(l, r) {
      let visits = 0;
      /** @param {number} node @param {number} lo @param {number} hi @returns {number} */
      const go = (node, lo, hi) => {
        visits++;
        if (r < lo || hi < l) return 0;
        if (l <= lo && hi <= r) return tree[node];
        const mid = (lo + hi) >> 1;
        return go(2 * node, lo, mid) + go(2 * node + 1, mid + 1, hi);
      };
      const sum = go(1, 0, n - 1);
      return { sum, visits };
    },
    /** @param {number} i @param {number} x @returns {number} nodes written */
    set(i, x) {
      let writes = 0;
      /** @param {number} node @param {number} lo @param {number} hi */
      const go = (node, lo, hi) => {
        writes++;
        if (lo === hi) {
          tree[node] = x;
          return;
        }
        const mid = (lo + hi) >> 1;
        if (i <= mid) go(2 * node, lo, mid);
        else go(2 * node + 1, mid + 1, hi);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
      };
      go(1, 0, n - 1);
      return writes;
    },
  };
}

/**
 * The nodes of the u–v path, u first, by walking parents.
 * @param {number[]} parent @param {number} u @param {number} v
 */
export function pathNodes(parent, u, v) {
  const depth = depthsOf(parent);
  /** @type {number[]} */
  const left = [];
  /** @type {number[]} */
  const right = [];
  let a = u;
  let b = v;
  while (depth[a] > depth[b]) {
    left.push(a);
    a = parent[a];
  }
  while (depth[b] > depth[a]) {
    right.push(b);
    b = parent[b];
  }
  while (a !== b) {
    left.push(a);
    right.push(b);
    a = parent[a];
    b = parent[b];
  }
  return [...left, a, ...right.reverse()];
}

/**
 * Splits the u–v path into position ranges, as the query loop does.
 * @param {ReturnType<typeof decompose>} d @param {number[]} parent @param {number} u0 @param {number} v0
 * @returns {{ from: number, to: number, head: number, swapped: boolean, last: boolean }[]}
 */
export function pathRanges(d, parent, u0, v0) {
  /** @type {{ from: number, to: number, head: number, swapped: boolean, last: boolean }[]} */
  const out = [];
  let u = u0;
  let v = v0;
  while (d.head[u] !== d.head[v]) {
    const swapped = d.depth[d.head[u]] < d.depth[d.head[v]];
    if (swapped) [u, v] = [v, u];
    out.push({ from: d.pos[d.head[u]], to: d.pos[u], head: d.head[u], swapped, last: false });
    u = parent[d.head[u]];
  }
  const swapped = d.depth[u] > d.depth[v];
  if (swapped) [u, v] = [v, u];
  out.push({ from: d.pos[u], to: d.pos[v], head: u, swapped, last: true });
  return out;
}

/**
 * Decomposes the tree, then sums the values on the u–v path.
 * @param {ValuedTree} t @param {number} qu @param {number} qv
 * @returns {HldFrame[]}
 */
export function hldTrace(t, qu, qv) {
  if (!isRootedTree(t) || t.value.length !== t.parent.length) throw new Error('Not a rooted tree');
  const n = t.parent.length;
  if (!(qu >= 0 && qu < n && qv >= 0 && qv < n)) throw new Error('Query node out of range');
  const kids = childrenOf(t.parent);
  /** @type {(number | null)[]} */
  const size = Array(n).fill(null);
  /** @type {(number | null)[]} */
  const heavy = Array(n).fill(null);
  /** @type {(number | null)[]} */
  const head = Array(n).fill(null);
  /** @type {(number | null)[]} */
  const pos = Array(n).fill(null);
  /** @type {ChainRange[]} */
  const ranges = [];
  let u = -1;
  let v = -1;
  let sum = 0;
  let visits = 0;
  let along = 0;
  /** @type {HldFrame[]} */
  const frames = [];

  /**
   * @param {HldFrame['kind']} kind @param {number[]} lines
   * @param {{ current?: number, via?: HldFrame['via'], swapped?: boolean }} [extra]
   */
  function push(kind, lines, extra = {}) {
    frames.push({
      kind,
      size: size.slice(),
      heavy: heavy.slice(),
      head: head.slice(),
      pos: pos.slice(),
      current: extra.current ?? -1,
      via: extra.via ?? '',
      u,
      v,
      swapped: extra.swapped ?? false,
      ranges: ranges.map((r) => ({ ...r })),
      sum,
      visits,
      pathNodes: along,
      lines: lines.slice(),
    });
  }

  push('start', [0]);
  /** @param {number} x */
  const dfs1 = (x) => {
    let s = 1;
    let best = -1;
    for (const c of kids[x]) {
      dfs1(c);
      const sc = /** @type {number} */ (size[c]);
      s += sc;
      if (best < 0 || sc > /** @type {number} */ (size[best])) best = c;
    }
    size[x] = s;
    heavy[x] = best;
    push('size', [0, 1], { current: x });
  };
  dfs1(0);

  let next = 0;
  /** @param {number} x @param {number} h @param {HldFrame['via']} via */
  const dfs2 = (x, h, via) => {
    head[x] = h;
    pos[x] = next++;
    push('place', via === 'root' ? [2] : via === 'heavy' ? [3, 2] : [4, 2], { current: x, via });
    const hx = /** @type {number} */ (heavy[x]);
    if (hx >= 0) dfs2(hx, h, 'heavy');
    for (const c of kids[x]) if (c !== hx) dfs2(c, c, 'light');
  };
  dfs2(0, 0, 'root');

  const d = decompose(t.parent);
  const base = Array(n).fill(0);
  t.value.forEach((x, i) => (base[d.pos[i]] = x));
  const seg = sumTree(base);

  u = qu;
  v = qv;
  along = pathNodes(t.parent, qu, qv).length;
  push('query', [5]);
  for (const r of pathRanges(d, t.parent, qu, qv)) {
    const q = seg.query(r.from, r.to);
    sum += q.sum;
    visits += q.visits;
    ranges.push({ from: r.from, to: r.to, head: r.head, sum: q.sum, visits: q.visits });
    if (r.swapped) [u, v] = [v, u];
    if (r.last) {
      push('last', [6, 9, 10], { swapped: r.swapped });
    } else {
      u = t.parent[r.head];
      push('range', [6, 7, 8], { swapped: r.swapped });
    }
  }
  push('done', [10]);
  return frames;
}

/**
 * Index of the frame where the query starts. @param {HldFrame[]} frames
 */
export const hldQueryStart = (frames) => frames.findIndex((f) => f.kind === 'query');

/** @param {number[]} parent @param {number[]} value @returns {ValuedTree} */
const valued = (parent, value) => ({
  labels: parent.map((_, i) => String.fromCharCode(65 + i)),
  parent: parent.slice(),
  value: value.slice(),
});

export const HLD_PRESETS = /** @type {const} */ (['sample', 'binary', 'path', 'random']);
/** @typedef {typeof HLD_PRESETS[number]} HldPreset */

/**
 * @param {HldPreset} preset @param {() => number} [rand]
 * @returns {{ tree: ValuedTree, u: number, v: number }}
 */
export function makeHldPreset(preset, rand = Math.random) {
  if (preset === 'sample')
    return {
      tree: valued(
        [-1, 0, 0, 1, 1, 1, 2, 3, 3, 5, 6, 6, 7, 9, 13],
        [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 2],
      ),
      u: 12,
      v: 11,
    };
  if (preset === 'binary')
    return {
      tree: valued(
        Array.from({ length: 15 }, (_, i) => (i === 0 ? -1 : (i - 1) >> 1)),
        [5, 3, 8, 1, 4, 7, 9, 2, 6, 3, 1, 5, 8, 2, 4],
      ),
      u: 8,
      v: 13,
    };
  if (preset === 'path')
    return {
      tree: valued(
        Array.from({ length: 10 }, (_, i) => i - 1),
        [2, 7, 1, 8, 2, 8, 1, 8, 2, 8],
      ),
      u: 8,
      v: 2,
    };
  const n = 8 + Math.floor(rand() * 8);
  /** @type {number[]} */
  const parent = [-1];
  for (let x = 1; x < n; x++) parent.push(Math.floor(rand() * x));
  const value = parent.map(() => Math.floor(rand() * (MAX_VALUE + 1)));
  return { tree: valued(parent, value), u: n - 1, v: n - 2 };
}
