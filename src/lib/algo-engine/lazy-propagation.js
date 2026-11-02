/**
 * Segment tree with lazy propagation: add x to every value of a[l..r], and read the sum of
 * a[l..r], both in O(log n). Ranges are 0-based and inclusive. Node 1 covers [0, n − 1]; node v
 * over [lo, hi] splits at mid = ⌊(lo + hi) / 2⌋ into 2v and 2v + 1.
 *
 * sum[v] is always right for v's own range, apart from tags still waiting on its ancestors.
 * tag[v] is an addition that v's children have not received yet. A node fully inside an update
 * takes the change at once and keeps it as a tag, so nothing below it is touched. Any later
 * operation that must go below that node first pushes the tag to its two children.
 * Leaves have no children, so they never hold a tag.
 */

export const MAX_N = 12;
export const MIN_VALUE = -99;
export const MAX_VALUE = 99;
export const MAX_OPS = 8;

export const lazyPseudocode = [
  'apply(v, lo, hi, x):',
  '  sum[v] = sum[v] + x · (hi − lo + 1)',
  '  if lo < hi: tag[v] = tag[v] + x',
  'push(v, lo, hi):',
  '  if tag[v] ≠ 0: apply tag[v] to both children; tag[v] = 0',
  'add(v, lo, hi, l, r, x):',
  '  if r < lo or hi < l: return',
  '  if l ≤ lo and hi ≤ r: apply(v, lo, hi, x); return',
  '  push(v, lo, hi); add to both children',
  '  sum[v] = sum[2v] + sum[2v + 1]',
  'query(v, lo, hi, l, r):',
  '  if r < lo or hi < l: return 0',
  '  if l ≤ lo and hi ≤ r: return sum[v]',
  '  push(v, lo, hi); return query(2v, …) + query(2v + 1, …)',
];

/**
 * @typedef {{ type: 'add', l: number, r: number, x: number }
 *   | { type: 'query', l: number, r: number }} LazyOp
 */

/**
 * @typedef {object} LazySpan
 * @property {number} v  Node number.
 * @property {number} lo
 * @property {number} hi
 */

/**
 * @typedef {object} LazyFrame
 * @property {'start'|'build-leaf'|'build-pull'|'split'|'outside'|'apply'|'cover'|'push'|'pull'|'return'|'answer'|'done'} kind
 * @property {number[]} items  The array as it truly is, after the additions so far.
 * @property {number[]} leaves  What the tree’s leaves hold; behind `items` while tags wait above them.
 * @property {(number|null)[]} sum  sum[v] by node number; null until built or for unused numbers.
 * @property {number[]} tag  tag[v] by node number.
 * @property {LazySpan[]} spans  Every node, in pre-order; the shape never changes.
 * @property {number} node  The node being looked at, 0 when none.
 * @property {number[]} pushedTo  Children receiving a tag on a push frame.
 * @property {number} pushed  The value being pushed, 0 otherwise.
 * @property {number} opIndex  Index into the operations, -1 outside them.
 * @property {LazyOp | null} op
 * @property {number[]} covered  Nodes fully inside the range.
 * @property {number[]} split  Nodes the operation passed through.
 * @property {number[]} outside  Nodes outside the range.
 * @property {number | null} value  The value this frame returns.
 * @property {number | null} result  The sum, once the query has finished.
 * @property {number} visits  Nodes this operation has visited.
 * @property {number} pushes  Push-downs this operation has made.
 * @property {number} writes  Node sums this operation has changed.
 * @property {number} eager  Node sums an update without tags would have to change.
 * @property {number} totalWrites  Node sums changed by all operations so far.
 * @property {number} totalEager  The same count without tags.
 * @property {number[]} lines
 */

/**
 * Every node of the tree over n values, in pre-order.
 * @param {number} n
 * @returns {LazySpan[]}
 */
export function lazySpans(n) {
  /** @type {LazySpan[]} */
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
 * How many nodes contain any of a[l..r]: the sums an update without tags must change.
 * @param {number} n @param {number} l @param {number} r
 */
export function eagerWrites(n, l, r) {
  return lazySpans(n).filter((s) => s.lo <= r && l <= s.hi).length;
}

/**
 * Reads a comma- or space-separated list of whole numbers.
 * @param {string} text
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseLazyValues(text) {
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
 * Builds the tree, then replays the operations. At the cap of 12 values and 8 operations the trace
 * stays under 400 frames; the test holds it to that.
 * @param {number[]} values  1 to MAX_N entries.
 * @param {LazyOp[]} ops
 * @returns {LazyFrame[]}
 */
export function lazyTrace(values, ops) {
  const n = values.length;
  const items = values.slice();
  const spans = lazySpans(n);
  const leafOf = Array(n).fill(0);
  for (const s of spans) if (s.lo === s.hi) leafOf[s.lo] = s.v;
  /** @type {(number|null)[]} */
  const sum = Array(4 * n).fill(null);
  /** @type {number[]} */
  const tag = Array(4 * n).fill(0);
  /** @type {LazyFrame[]} */
  const frames = [];
  let node = 0;
  /** @type {number[]} */
  let pushedTo = [];
  let pushed = 0;
  let opIndex = -1;
  /** @type {LazyOp | null} */
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
  let pushes = 0;
  let writes = 0;
  let eager = 0;
  let totalWrites = 0;
  let totalEager = 0;

  /** @param {LazyFrame['kind']} kind @param {number[]} lines */
  const emit = (kind, lines) => {
    frames.push({
      kind,
      items: items.slice(),
      leaves: leafOf.map((v, i) => sum[v] ?? values[i]),
      sum: sum.slice(),
      tag: tag.slice(),
      spans: spans.map((s) => ({ ...s })),
      node,
      pushedTo: pushedTo.slice(),
      pushed,
      opIndex,
      op,
      covered: covered.slice(),
      split: split.slice(),
      outside: outside.slice(),
      value,
      result,
      visits,
      pushes,
      writes,
      eager,
      totalWrites,
      totalEager,
      lines,
    });
  };

  const pullValue = (/** @type {number} */ v) => {
    sum[v] = /** @type {number} */ (sum[2 * v]) + /** @type {number} */ (sum[2 * v + 1]);
  };

  /** @param {number} v @param {number} lo @param {number} hi @param {number} x */
  const applyTo = (v, lo, hi, x) => {
    sum[v] = /** @type {number} */ (sum[v]) + x * (hi - lo + 1);
    if (lo < hi) tag[v] += x;
    writes++;
    totalWrites++;
  };

  emit('start', [0]);

  /** @param {number} v @param {number} lo @param {number} hi */
  const build = (v, lo, hi) => {
    node = v;
    if (lo === hi) {
      sum[v] = items[lo];
      value = sum[v];
      emit('build-leaf', [1]);
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    build(2 * v, lo, mid);
    build(2 * v + 1, mid + 1, hi);
    node = v;
    pullValue(v);
    value = sum[v];
    emit('build-pull', [9]);
  };
  build(1, 0, n - 1);
  value = null;

  /** @param {number} v @param {number} lo @param {number} hi @param {number} mid */
  const pushDown = (v, lo, hi, mid) => {
    if (tag[v] === 0) return;
    const x = tag[v];
    applyTo(2 * v, lo, mid, x);
    applyTo(2 * v + 1, mid + 1, hi, x);
    tag[v] = 0;
    pushes++;
    node = v;
    pushedTo = [2 * v, 2 * v + 1];
    pushed = x;
    value = null;
    emit('push', [3, 4]);
    pushedTo = [];
    pushed = 0;
  };

  /** @param {number} v @param {number} lo @param {number} hi @param {number} l @param {number} r @param {number} x */
  const add = (v, lo, hi, l, r, x) => {
    node = v;
    visits++;
    value = null;
    if (r < lo || hi < l) {
      outside.push(v);
      emit('outside', [5, 6]);
      return;
    }
    if (l <= lo && hi <= r) {
      covered.push(v);
      applyTo(v, lo, hi, x);
      emit('apply', [0, 1, 2, 7]);
      return;
    }
    split.push(v);
    emit('split', [8]);
    const mid = Math.floor((lo + hi) / 2);
    pushDown(v, lo, hi, mid);
    add(2 * v, lo, mid, l, r, x);
    add(2 * v + 1, mid + 1, hi, l, r, x);
    node = v;
    pullValue(v);
    writes++;
    totalWrites++;
    value = sum[v];
    emit('pull', [9]);
  };

  /** @param {number} v @param {number} lo @param {number} hi @param {number} l @param {number} r @returns {number} */
  const query = (v, lo, hi, l, r) => {
    node = v;
    visits++;
    if (r < lo || hi < l) {
      outside.push(v);
      value = 0;
      emit('outside', [10, 11]);
      return 0;
    }
    if (l <= lo && hi <= r) {
      covered.push(v);
      value = /** @type {number} */ (sum[v]);
      emit('cover', [12]);
      return value;
    }
    split.push(v);
    value = null;
    emit('split', [13]);
    const mid = Math.floor((lo + hi) / 2);
    pushDown(v, lo, hi, mid);
    const left = query(2 * v, lo, mid, l, r);
    const right = query(2 * v + 1, mid + 1, hi, l, r);
    node = v;
    value = left + right;
    emit('return', [13]);
    return value;
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
    pushes = 0;
    writes = 0;
    eager = 0;
    if (next.type === 'add') {
      for (let i = next.l; i <= next.r; i++) items[i] += next.x;
      eager = eagerWrites(n, next.l, next.r);
      totalEager += eager;
      add(1, 0, n - 1, next.l, next.r, next.x);
    } else {
      result = query(1, 0, n - 1, next.l, next.r);
      node = 0;
      value = result;
      emit('answer', [13]);
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
  pushes = 0;
  writes = 0;
  eager = 0;
  emit('done', [0]);
  return frames;
}
