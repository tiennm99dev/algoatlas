/**
 * Two heap problems, each on binary heaps stored in 0-based arrays.
 *
 * Running median: `low` is a max-heap of the smaller half of the stream and `high` a min-heap
 * of the larger half. Every low value ≤ every high value, and low holds as many values as
 * high or one more, so the median is low's top, or the mean of both tops when the sizes are
 * equal.
 *
 * K closest points: a max-heap of size k keyed by squared distance to the origin keeps the k
 * closest points seen so far; its root is the farthest of them, the one a new point must beat.
 * Ties on distance keep the earlier point.
 */

/**
 * @typedef {'median'|'closest'} HeapProblem
 * @typedef {{x: number, y: number}} Point
 * @typedef {{index: number, d2: number}} PointEntry
 */

/**
 * @typedef {object} MedianFrame
 * @property {'start'|'read'|'push-low'|'push-high'|'move-up'|'move-down'|'median'|'done'} kind
 * @property {number[]} low  Max-heap array of the smaller half.
 * @property {number[]} high  Min-heap array of the larger half.
 * @property {number} index  Stream position being handled; -1 when none.
 * @property {number | null} value  The value read or moved.
 * @property {number} slot  Where the pushed or moved value settled in its heap; -1 when none.
 * @property {number | null} median  The median after this value; null before the first.
 * @property {number[]} medians  Medians reported so far.
 * @property {number} moves  Values moved between the heaps so far.
 * @property {number} heapOps  Pushes plus pops so far.
 * @property {number[]} lines
 */

/**
 * @typedef {object} ClosestFrame
 * @property {'start'|'read'|'push'|'replace'|'skip'|'done'} kind
 * @property {PointEntry[]} heap  Max-heap array by squared distance.
 * @property {number} index  Point being handled; -1 when none.
 * @property {number} evicted  Point dropped by a replace; -1 when none.
 * @property {number[]} rejected  Points read and no longer kept.
 * @property {number} comparisons
 * @property {number} heapOps
 * @property {number[]} lines
 */

export const MAX_STREAM = 15;
export const MAX_POINTS = 12;
export const MAX_K = 6;
export const MAX_VALUE = 99;
export const MAX_COORD = 5;

export const medianPseudocode = [
  'for each x in the stream:',
  '  if low is empty or x ≤ low.max: low.push(x)',
  '  else: high.push(x)',
  '  if low.size > high.size + 1: high.push(low.popMax())',
  '  else if high.size > low.size: low.push(high.popMin())',
  '  median = low.max when the sizes differ,',
  '           else (low.max + high.min) / 2',
];

export const closestPseudocode = [
  'kClosest(points, k):      // max-heap by distance², size k',
  '  for each point p:',
  '    if the heap holds fewer than k: push p',
  '    else if dist²(p) < heap.max():',
  '      replace the max with p; sift down',
  '    else: skip p              // farther than all k kept',
  '  return the heap',
];

/**
 * A binary heap whose root is the item `before` puts first, counting comparisons.
 * @template T
 * @param {(a: T, b: T) => boolean} before
 */
function makeHeap(before) {
  /** @type {T[]} */
  const a = [];
  const counter = { comparisons: 0 };
  /** @param {number} x @param {number} y */
  const first = (x, y) => {
    counter.comparisons++;
    return before(a[x], a[y]);
  };
  /** @param {number} i */
  function siftDown(i) {
    for (;;) {
      const l = 2 * i + 1;
      if (l >= a.length) return;
      let c = l;
      if (l + 1 < a.length && first(l + 1, l)) c = l + 1;
      if (!first(c, i)) return;
      [a[i], a[c]] = [a[c], a[i]];
      i = c;
    }
  }
  return {
    a,
    counter,
    /** @param {T} item @returns {number} the slot it settled in */
    push(item) {
      a.push(item);
      let i = a.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (!first(i, p)) break;
        [a[i], a[p]] = [a[p], a[i]];
        i = p;
      }
      return i;
    },
    /** @returns {T} */
    pop() {
      const top = a[0];
      const last = /** @type {T} */ (a.pop());
      if (a.length) {
        a[0] = last;
        siftDown(0);
      }
      return top;
    },
    /** @param {T} item */
    replaceTop(item) {
      a[0] = item;
      siftDown(0);
    },
  };
}

/**
 * @param {number[]} stream
 * @returns {MedianFrame[]}
 */
export function medianTrace(stream) {
  const low = makeHeap(/** @param {number} x @param {number} y */ (x, y) => x > y);
  const high = makeHeap(/** @param {number} x @param {number} y */ (x, y) => x < y);
  /** @type {number[]} */
  const medians = [];
  /** @type {MedianFrame[]} */
  const frames = [];
  let moves = 0;
  let heapOps = 0;
  /** @type {number | null} */
  let median = null;

  /** @param {Pick<MedianFrame, 'kind'|'lines'> & Partial<MedianFrame>} f */
  const push = (f) =>
    frames.push({
      index: -1,
      value: null,
      slot: -1,
      ...f,
      low: low.a.slice(),
      high: high.a.slice(),
      median,
      medians: medians.slice(),
      moves,
      heapOps,
    });

  push({ kind: 'start', lines: [] });
  stream.forEach((x, index) => {
    push({ kind: 'read', lines: [0], index, value: x });
    heapOps++;
    if (low.a.length === 0 || x <= low.a[0]) {
      const slot = low.push(x);
      push({ kind: 'push-low', lines: [1], index, value: x, slot });
    } else {
      const slot = high.push(x);
      push({ kind: 'push-high', lines: [2], index, value: x, slot });
    }
    if (low.a.length > high.a.length + 1) {
      const y = low.pop();
      const slot = high.push(y);
      heapOps += 2;
      moves++;
      push({ kind: 'move-up', lines: [3], index, value: y, slot });
    } else if (high.a.length > low.a.length) {
      const y = high.pop();
      const slot = low.push(y);
      heapOps += 2;
      moves++;
      push({ kind: 'move-down', lines: [4], index, value: y, slot });
    }
    median = low.a.length > high.a.length ? low.a[0] : (low.a[0] + high.a[0]) / 2;
    medians.push(median);
    push({ kind: 'median', lines: low.a.length > high.a.length ? [5] : [5, 6], index, value: x });
  });
  push({ kind: 'done', lines: [] });
  return frames;
}

/** @param {Point} p */
export const dist2 = (p) => p.x * p.x + p.y * p.y;

/**
 * @param {Point[]} points
 * @param {number} k
 * @returns {ClosestFrame[]}
 */
export function closestTrace(points, k) {
  // The root is the farthest kept point; on equal distance the later point counts as farther.
  const heap = makeHeap(
    /** @param {PointEntry} p @param {PointEntry} q */
    (p, q) => p.d2 > q.d2 || (p.d2 === q.d2 && p.index > q.index),
  );
  /** @type {number[]} */
  const rejected = [];
  /** @type {ClosestFrame[]} */
  const frames = [];
  let heapOps = 0;
  let extra = 0;

  /** @param {Pick<ClosestFrame, 'kind'|'lines'> & Partial<ClosestFrame>} f */
  const push = (f) =>
    frames.push({
      index: -1,
      evicted: -1,
      ...f,
      heap: heap.a.map((e) => ({ ...e })),
      rejected: rejected.slice(),
      comparisons: heap.counter.comparisons + extra,
      heapOps,
    });

  push({ kind: 'start', lines: [0] });
  points.forEach((p, index) => {
    const entry = { index, d2: dist2(p) };
    push({ kind: 'read', lines: [1], index });
    if (heap.a.length < k) {
      heapOps++;
      heap.push(entry);
      push({ kind: 'push', lines: [2], index });
      return;
    }
    extra++;
    if (entry.d2 < heap.a[0].d2) {
      const evicted = heap.a[0].index;
      heapOps++;
      heap.replaceTop(entry);
      rejected.push(evicted);
      push({ kind: 'replace', lines: [3, 4], index, evicted });
    } else {
      rejected.push(index);
      push({ kind: 'skip', lines: [3, 5], index });
    }
  });
  push({ kind: 'done', lines: [6] });
  return frames;
}

/**
 * Reads a stream of whole numbers separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseMedianStream(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v > MAX_VALUE)) return { error: 'range' };
  if (values.length > MAX_STREAM) return { error: 'count' };
  return { values };
}

/**
 * Reads points written as (x, y) pairs, for example `(1, 2) (-3, 0)`. A typographic minus
 * (−) counts as a minus sign, so copied examples parse.
 * @param {string} input
 * @returns {{points: Point[]} | {error: 'format'|'range'|'count'|'duplicate'}}
 */
export function parsePoints(input) {
  const text = input.replace(/\u2212/g, '-');
  const rest = text.replace(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g, '').replace(/[\s,;]/g, '');
  const matches = [...text.matchAll(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g)];
  if (rest !== '' || matches.length === 0) return { error: 'format' };
  const points = matches.map((mt) => ({ x: Number(mt[1]), y: Number(mt[2]) }));
  if (points.some((p) => Math.abs(p.x) > MAX_COORD || Math.abs(p.y) > MAX_COORD)) {
    return { error: 'range' };
  }
  if (points.length > MAX_POINTS) return { error: 'count' };
  const keys = new Set(points.map((p) => `${p.x},${p.y}`));
  if (keys.size !== points.length) return { error: 'duplicate' };
  return { points };
}

/** @param {Point[]} points */
export const formatPoints = (points) => points.map((p) => `(${p.x}, ${p.y})`).join(' ');

/** @param {() => number} [rand] */
export function makeMedianStream(rand = Math.random) {
  return Array.from({ length: 9 }, () => Math.floor(rand() * (MAX_VALUE + 1)));
}

/** @param {() => number} [rand] @returns {Point[]} */
export function makePoints(rand = Math.random) {
  /** @type {Map<string, Point>} */
  const seen = new Map();
  while (seen.size < 8) {
    const x = Math.floor(rand() * (2 * MAX_COORD + 1)) - MAX_COORD;
    const y = Math.floor(rand() * (2 * MAX_COORD + 1)) - MAX_COORD;
    seen.set(`${x},${y}`, { x, y });
  }
  return [...seen.values()];
}
