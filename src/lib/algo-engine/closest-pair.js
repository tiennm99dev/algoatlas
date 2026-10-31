/**
 * Closest pair of points by divide and conquer. The points are sorted by x once. Each call
 * splits its points at the median index: the left half is P[0..mid−1], the right half
 * P[mid..], and the dividing line is x = P[mid].x. After both halves return, d = min(dL, dR);
 * a closer pair would have to cross the line, so it lies in the strip |x − line| < d. In
 * y order, each strip point only needs the next points whose y differs by less than d, at
 * most 7 of them. Three or fewer points are checked pair by pair. Distances are compared
 * squared, on whole numbers, so ties are exact.
 */

export const MIN_N = 2;
export const MAX_N = 16;
export const MAX_COORD = 99;

/**
 * @typedef {object} Point
 * @property {number} id  Input order, used for the letter label.
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} ClosestFrame
 * @property {'start'|'sort'|'split'|'base'|'brute'|'combine'|'strip'|'strip-check'|'return'|'done'} kind
 * @property {Point[]} points  Sorted by x (then y) from the 'sort' frame on; input order before.
 * @property {[number, number] | null} range  The call's points: indices lo..hi into `points`.
 * @property {number | null} line  The dividing x of the call, null when none.
 * @property {number} d2  The call's best squared distance so far, Infinity when none.
 * @property {[number, number] | null} pair  Ids of the call's best pair so far.
 * @property {number} best2  Smallest squared distance found anywhere so far.
 * @property {[number, number] | null} bestPair
 * @property {number[]} strip  Ids in the strip, in y order, on strip frames.
 * @property {[number, number] | null} checking  Ids compared on this frame.
 * @property {number} checks  Distance computations so far.
 * @property {boolean} closer  On brute and strip-check frames: the compared pair beat d.
 * @property {[number, number][]} stack  Open calls, outermost first.
 * @property {number[]} lines
 */

export const closestPseudocode = [
  'closest(P):  // P sorted by x; returns the smallest distance',
  '  if |P| ≤ 3: check every pair and return the smallest',
  '  mid = ⌊|P| / 2⌋; line: x = P[mid].x  // split by x',
  '  dL = closest(P[0..mid − 1]); dR = closest(P[mid..])',
  '  d = min(dL, dR)',
  '  S = points with |x − line| < d, in y order  // strip of width 2d',
  '  for each p in S, and each later q while q.y − p.y < d:',
  '    if dist(p, q) < d: d = dist(p, q)  // a closer pair crosses the line',
  '  return d',
  'sort the points by x once; answer = closest(all points)',
];

/** @param {Point} p @param {Point} q */
export const dist2 = (p, q) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2;

/**
 * Reads points written as `x, y` pairs, optionally in brackets, separated by spaces or
 * semicolons: "(3, 4) (10, 2)" or "3,4; 10,2".
 * @param {string} text
 * @returns {{points: Point[]} | {error: 'format'|'range'|'count'|'duplicate'}}
 */
export function parsePoints(text) {
  const pair = /(\d+)\s*,\s*(\d+)/g;
  const coords = [...text.matchAll(pair)].map((mt) => [Number(mt[1]), Number(mt[2])]);
  if (coords.length === 0 || !/^[\s;()]*$/.test(text.replace(pair, ''))) {
    return { error: 'format' };
  }
  if (coords.some(([x, y]) => x > MAX_COORD || y > MAX_COORD)) return { error: 'range' };
  if (coords.length < MIN_N || coords.length > MAX_N) return { error: 'count' };
  const seen = new Set(coords.map(([x, y]) => `${x},${y}`));
  if (seen.size !== coords.length) return { error: 'duplicate' };
  return { points: coords.map(([x, y], id) => ({ id, x, y })) };
}

/**
 * Checks every pair: the O(n²) oracle.
 * @param {Point[]} points
 * @returns {{d2: number, pair: [number, number] | null}}
 */
export function bruteForceClosest(points) {
  let d2 = Infinity;
  /** @type {[number, number] | null} */
  let pair = null;
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++) {
      const v = dist2(points[i], points[j]);
      if (v < d2) {
        d2 = v;
        pair = [points[i].id, points[j].id];
      }
    }
  return { d2, pair };
}

/**
 * @param {Point[]} input  At least two distinct points.
 * @returns {ClosestFrame[]}
 */
export function closestTrace(input) {
  let points = input.map((p) => ({ ...p }));
  /** @type {ClosestFrame[]} */
  const frames = [];
  let checks = 0;
  let best2 = Infinity;
  /** @type {[number, number] | null} */
  let bestPair = null;
  /** @type {[number, number][]} */
  const stack = [];

  /** @param {Pick<ClosestFrame, 'kind'|'lines'> & Partial<ClosestFrame>} f */
  const push = (f) =>
    frames.push({
      range: null,
      line: null,
      d2: Infinity,
      pair: null,
      checking: null,
      closer: false,
      ...f,
      strip: (f.strip ?? []).slice(),
      points: points.map((p) => ({ ...p })),
      best2,
      bestPair: bestPair ? [bestPair[0], bestPair[1]] : null,
      checks,
      stack: stack.map(([lo, hi]) => [lo, hi]),
    });

  /**
   * Measures one pair and keeps it when it beats d2.
   * @param {Point} p @param {Point} q @param {number} d2 @param {[number, number] | null} pair
   */
  function check(p, q, d2, pair) {
    checks++;
    const v = dist2(p, q);
    const closer = v < d2;
    if (v < best2) {
      best2 = v;
      bestPair = [p.id, q.id];
    }
    return closer
      ? { d2: v, pair: /** @type {[number, number]} */ ([p.id, q.id]), closer }
      : { d2, pair, closer };
  }

  /**
   * @param {number} lo
   * @param {number} hi
   * @returns {{d2: number, pair: [number, number] | null}}
   */
  function closest(lo, hi) {
    /** @type {[number, number]} */
    const range = [lo, hi];
    stack.push([lo, hi]);
    let d2 = Infinity;
    /** @type {[number, number] | null} */
    let pair = null;
    if (hi - lo + 1 <= 3) {
      push({ kind: 'base', lines: [0, 1], range });
      for (let i = lo; i <= hi; i++)
        for (let j = i + 1; j <= hi; j++) {
          const r = check(points[i], points[j], d2, pair);
          ({ d2, pair } = r);
          push({
            kind: 'brute',
            lines: [1],
            range,
            d2,
            pair,
            checking: [points[i].id, points[j].id],
            closer: r.closer,
          });
        }
      stack.pop();
      push({ kind: 'return', lines: [8], range, d2, pair });
      return { d2, pair };
    }
    const mid = lo + Math.floor((hi - lo + 1) / 2);
    const line = points[mid].x;
    push({ kind: 'split', lines: [0, 2, 3], range, line });
    const left = closest(lo, mid - 1);
    const right = closest(mid, hi);
    ({ d2, pair } = left.d2 <= right.d2 ? left : right);
    push({ kind: 'combine', lines: [4], range, line, d2, pair });

    const strip = points
      .slice(lo, hi + 1)
      .filter((p) => (p.x - line) ** 2 < d2)
      .sort((p, q) => p.y - q.y || p.x - q.x);
    push({ kind: 'strip', lines: [5], range, line, d2, pair, strip: strip.map((p) => p.id) });
    for (let i = 0; i < strip.length; i++) {
      for (let j = i + 1; j < strip.length && (strip[j].y - strip[i].y) ** 2 < d2; j++) {
        const r = check(strip[i], strip[j], d2, pair);
        ({ d2, pair } = r);
        push({
          kind: 'strip-check',
          lines: [6, 7],
          range,
          line,
          d2,
          pair,
          strip: strip.map((p) => p.id),
          checking: [strip[i].id, strip[j].id],
          closer: r.closer,
        });
      }
    }
    stack.pop();
    push({ kind: 'return', lines: [8], range, line, d2, pair });
    return { d2, pair };
  }

  push({ kind: 'start', lines: [9] });
  points = points.slice().sort((p, q) => p.x - q.x || p.y - q.y);
  push({ kind: 'sort', lines: [9] });
  const answer = closest(0, points.length - 1);
  push({ kind: 'done', lines: [9], d2: answer.d2, pair: answer.pair });
  return frames;
}
