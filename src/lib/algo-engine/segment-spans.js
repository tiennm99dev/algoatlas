/**
 * The shape of a segment tree over n values, shared by the segment tree and lazy propagation
 * engines: heap numbering, the root is node 1, node v has children 2v and 2v + 1.
 */

/** @typedef {{ v: number, lo: number, hi: number }} SegSpan  Node `v` covers a[lo..hi]. */

/**
 * Every node of the tree, in pre-order.
 * @param {number} n
 * @returns {SegSpan[]}
 */
export function treeSpans(n) {
  /** @type {SegSpan[]} */
  const out = [];
  /** @param {number} v @param {number} lo @param {number} hi */
  const go = (v, lo, hi) => {
    out.push({ v, lo, hi });
    if (lo === hi) return;
    const mid = Math.floor((lo + hi) / 2);
    go(2 * v, lo, mid);
    go(2 * v + 1, mid + 1, hi);
  };
  go(1, 0, n - 1);
  return out;
}
