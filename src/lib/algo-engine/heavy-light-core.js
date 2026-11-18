/**
 * Heavy-light decomposition helpers without a trace: the decomposition itself, a sum segment
 * tree that counts the nodes a query visits, the nodes of a u–v path and its split into chain
 * ranges. Lessons that decompose a tree import these instead of keeping their own copy.
 */

import { childrenOf, depthsOf } from './rooted-tree.js';

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
