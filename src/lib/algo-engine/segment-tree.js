/**
 * Recursive segment tree over a[0..n − 1] with point update and range query, using any
 * associative merge function that has an identity. Node 1 is the root over [0, n − 1]; node v
 * over [lo, hi] splits at mid = ⌊(lo + hi) / 2⌋ into 2v over [lo, mid] and 2v + 1 over
 * [mid + 1, hi]. Ranges are 0-based and inclusive.
 *
 * A query stops at a node in one of three ways: outside the range (return the identity), fully
 * inside (return its stored value without going deeper), or partly inside (recurse and merge).
 * The fully-inside nodes are the range's canonical cover: at most two per level.
 */

export const MAX_N = 12;
export const MIN_VALUE = -99;
export const MAX_VALUE = 99;
export const MAX_OPS = 8;

/** @typedef {'sum' | 'min' | 'max'} SegMerge */

export const SEG_MERGES = /** @type {SegMerge[]} */ (['sum', 'min', 'max']);

export const segmentPseudocode = [
  'build(v, lo, hi):',
  '  if lo == hi: tree[v] = a[lo]; return',
  '  build both children, then tree[v] = merge(tree[2v], tree[2v + 1])',
  'query(v, lo, hi, l, r):',
  '  if r < lo or hi < l: return identity',
  '  if l ≤ lo and hi ≤ r: return tree[v]',
  '  mid = ⌊(lo + hi) / 2⌋',
  '  return merge(query(2v, lo, mid, l, r), query(2v + 1, mid + 1, hi, l, r))',
  'set(v, lo, hi, i, x):',
  '  if lo == hi: tree[v] = x; return',
  '  recurse into the child whose range holds i',
  '  tree[v] = merge(tree[2v], tree[2v + 1])',
];

/**
 * @typedef {{ type: 'query', l: number, r: number } | { type: 'set', i: number, x: number }} SegOp
 */

/**
 * @typedef {object} SegSpan
 * @property {number} v  Node number.
 * @property {number} lo
 * @property {number} hi
 */

/**
 * @typedef {object} SegFrame
 * @property {'start'|'build-leaf'|'build-pull'|'split'|'outside'|'cover'|'return'|'descend'|'write'|'pull'|'answer'|'done'} kind
 * @property {SegMerge} merge
 * @property {number[]} items  The current array.
 * @property {(number|null)[]} tree  Node values by node number, null until built or for unused numbers.
 * @property {SegSpan[]} spans  Every node of the tree, in pre-order; the shape never changes.
 * @property {number} node  The node being looked at, 0 when none.
 * @property {number} opIndex  Index into the operations, -1 outside them.
 * @property {SegOp | null} op
 * @property {number[]} covered  Nodes fully inside the range, whose values the query used.
 * @property {number[]} split  Nodes the query or update passed through.
 * @property {number[]} outside  Nodes the query rejected without going deeper.
 * @property {number | null} value  The value this frame returns or writes.
 * @property {number | null} result  The answer, once the query has finished.
 * @property {number} visits  Nodes this operation has visited.
 * @property {number} merges  Merge calls this operation has made.
 * @property {number} buildMerges  Merge calls the build made.
 * @property {number[]} lines
 */

/** @param {SegMerge} merge @param {number} a @param {number} b */
export function mergeValues(merge, a, b) {
  if (merge === 'min') return Math.min(a, b);
  if (merge === 'max') return Math.max(a, b);
  return a + b;
}

/** The value that leaves the other side unchanged. @param {SegMerge} merge */
export function identityOf(merge) {
  if (merge === 'min') return Infinity;
  if (merge === 'max') return -Infinity;
  return 0;
}

/** merge over a[l..r] by reading every element. @param {number[]} a @param {number} l @param {number} r @param {SegMerge} merge */
export function foldRange(a, l, r, merge) {
  let acc = identityOf(merge);
  for (let i = l; i <= r; i++) acc = mergeValues(merge, acc, a[i]);
  return acc;
}

/**
 * Every node of the tree over n values, in pre-order.
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

/**
 * The nodes that answer a query: the ones fully inside [l, r] whose parents are not.
 * @param {number} n @param {number} l @param {number} r
 * @returns {SegSpan[]} left to right.
 */
export function canonicalCover(n, l, r) {
  /** @type {SegSpan[]} */
  const out = [];
  /** @param {number} v @param {number} lo @param {number} hi */
  const go = (v, lo, hi) => {
    if (r < lo || hi < l) return;
    if (l <= lo && hi <= r) {
      out.push({ v, lo, hi });
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    go(2 * v, lo, mid);
    go(2 * v + 1, mid + 1, hi);
  };
  go(1, 0, n - 1);
  return out;
}

/**
 * Reads a comma- or space-separated list of whole numbers.
 * @param {string} text
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseSegmentValues(text) {
  const tokens = text
    .replace(/[−–]/g, '-')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^-?\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * Builds the tree, then replays the operations. At the cap of 12 values and 8 queries the trace
 * stays under 400 frames; the test holds it to that.
 * @param {number[]} values  1 to MAX_N entries.
 * @param {SegOp[]} ops
 * @param {SegMerge} merge
 * @returns {SegFrame[]}
 */
export function segmentTrace(values, ops, merge) {
  const n = values.length;
  const items = values.slice();
  const spans = treeSpans(n);
  /** @type {(number|null)[]} */
  const tree = Array(4 * n).fill(null);
  /** @type {SegFrame[]} */
  const frames = [];
  let node = 0;
  let opIndex = -1;
  /** @type {SegOp | null} */
  let op = null;
  /** @type {number[]} */
  let covered = [];
  /** @type {number[]} */
  let split = [];
  /** @type {number[]} */
  let outside = [];
  /** @type {number | null} */
  let value = null;
  /** @type {number | null} */
  let result = null;
  let visits = 0;
  let merges = 0;
  let buildMerges = 0;

  /** @param {SegFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) => {
    frames.push({
      kind,
      merge,
      items: items.slice(),
      tree: tree.slice(),
      spans: spans.map((s) => ({ ...s })),
      node,
      opIndex,
      op,
      covered: covered.slice(),
      split: split.slice(),
      outside: outside.slice(),
      value,
      result,
      visits,
      merges,
      buildMerges,
      lines,
    });
  };

  const pull = (/** @type {number} */ v) => {
    tree[v] = mergeValues(
      merge,
      /** @type {number} */ (tree[2 * v]),
      /** @type {number} */ (tree[2 * v + 1]),
    );
  };

  push('start', [0]);

  /** @param {number} v @param {number} lo @param {number} hi */
  const build = (v, lo, hi) => {
    node = v;
    if (lo === hi) {
      tree[v] = items[lo];
      value = tree[v];
      push('build-leaf', [1]);
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    build(2 * v, lo, mid);
    build(2 * v + 1, mid + 1, hi);
    node = v;
    pull(v);
    buildMerges++;
    value = tree[v];
    push('build-pull', [2]);
  };
  build(1, 0, n - 1);
  value = null;

  /** @param {number} v @param {number} lo @param {number} hi @param {number} l @param {number} r @returns {number} */
  const query = (v, lo, hi, l, r) => {
    node = v;
    visits++;
    if (r < lo || hi < l) {
      outside.push(v);
      value = identityOf(merge);
      push('outside', [3, 4]);
      return value;
    }
    if (l <= lo && hi <= r) {
      covered.push(v);
      value = /** @type {number} */ (tree[v]);
      push('cover', [5]);
      return value;
    }
    split.push(v);
    value = null;
    push('split', [6]);
    const mid = Math.floor((lo + hi) / 2);
    const left = query(2 * v, lo, mid, l, r);
    const right = query(2 * v + 1, mid + 1, hi, l, r);
    node = v;
    merges++;
    value = mergeValues(merge, left, right);
    push('return', [7]);
    return value;
  };

  /** @param {number} v @param {number} lo @param {number} hi @param {number} i @param {number} x */
  const assign = (v, lo, hi, i, x) => {
    node = v;
    visits++;
    split.push(v);
    if (lo === hi) {
      tree[v] = x;
      items[lo] = x;
      value = x;
      push('write', [8, 9]);
      return;
    }
    value = null;
    push('descend', [10]);
    const mid = Math.floor((lo + hi) / 2);
    if (i <= mid) assign(2 * v, lo, mid, i, x);
    else assign(2 * v + 1, mid + 1, hi, i, x);
    node = v;
    pull(v);
    merges++;
    value = tree[v];
    push('pull', [11]);
  };

  for (const [index, next] of ops.entries()) {
    opIndex = index;
    op = { ...next };
    covered = [];
    split = [];
    outside = [];
    result = null;
    value = null;
    visits = 0;
    merges = 0;
    if (next.type === 'query') {
      result = query(1, 0, n - 1, next.l, next.r);
      node = 0;
      value = result;
      push('answer', [7]);
    } else {
      assign(1, 0, n - 1, next.i, next.x);
    }
  }

  node = 0;
  value = null;
  opIndex = -1;
  op = null;
  covered = [];
  split = [];
  outside = [];
  result = null;
  visits = 0;
  merges = 0;
  push('done', [0]);
  return frames;
}
