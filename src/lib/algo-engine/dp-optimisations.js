/**
 * The convex hull trick for a minimum: given lines y = m·x + b, answer "the smallest y at x"
 * for many x, keeping only the lines of the lower envelope.
 *
 * Lines are added by slope, largest first, so each new line is the lowest one far to the right.
 * Before it is pushed, the last hull line is popped while it is never strictly lowest: when the
 * new line crosses the second-to-last line at or before the point where the last line takes
 * over. Lines of equal slope keep only the lowest. Queries run from the smallest x up, so a
 * pointer only ever moves right along the hull: O(n + q) in total after sorting.
 *
 * With lines a, b, c of slopes m_a > m_b > m_c, b is useless when
 * (b_c − b_a)(m_a − m_b) ≤ (b_b − b_a)(m_a − m_c): the crossing of a and c is not to the right of
 * the crossing of a and b. Ties pop, so a line that only touches the envelope is dropped.
 */

/**
 * @typedef {object} Line
 * @property {number} id  Position in the typed list; the page names it L1, L2, …
 * @property {number} m  Slope.
 * @property {number} b  Intercept.
 */

/**
 * @typedef {object} HullFrame
 * @property {'start'|'sort'|'consider'|'skip'|'check'|'push'|'advance'|'answer'|'done'} kind
 * @property {Line[]} pool  The lines, in slope order (largest first) once sorted.
 * @property {number[]} queries  The query x values, smallest first.
 * @property {number[]} hull  Ids of the hull lines, left to right.
 * @property {number[]} removed  Ids of lines popped or skipped.
 * @property {number} cur  consider, skip, check, push: the new line's id; −1 for none.
 * @property {number[]} triple  check: ids of the second-to-last, last and new line.
 * @property {boolean} pops  check: the last hull line is useless.
 * @property {number} q  advance, answer: the query index; −1 for none.
 * @property {number} p  The pointer, an index into hull; −1 before the queries.
 * @property {(number|null)[]} answers  The smallest y at each query x so far.
 * @property {number} checks  Hull checks so far.
 * @property {number} moves  Pointer moves so far.
 * @property {number} compares  Pointer comparisons so far: hull[p + 1](x) against hull[p](x).
 * @property {number[]} lines  Pseudocode lines this step executes.
 */

export const MAX_LINES = 8;
export const MAX_QUERIES = 11;
export const SLOPE_RANGE = 5;
export const INTERCEPT_MIN = -20;
export const INTERCEPT_MAX = 30;
export const PLOT = { xMax: 10, yMax: 12 };

/** @type {{key: string, lines: [number, number][], queries: number[]}[]} */
export const HULL_PRESETS = [
  {
    key: 'cap',
    lines: [
      [2, 1],
      [1, 3],
      [0, 7],
      [0, 9],
      [-1, 13],
      [-2, 20],
    ],
    queries: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    key: 'useless',
    lines: [
      [-1, 14],
      [1, 4],
      [0, 10],
      [2, 1],
      [-2, 20],
    ],
    queries: [0, 2, 4, 6, 8, 10],
  },
  {
    key: 'touch',
    lines: [
      [-2, 12],
      [-1, 9],
      [0, 5],
      [1, 1],
    ],
    queries: [0, 3, 4, 5, 6, 10],
  },
];

export const hullPseudocode = [
  'minAt(lines, queries):     // m·x + b nhỏ nhất tại mỗi x',
  '  sắp xếp lines theo hệ số góc giảm dần; cùng hệ số góc thì giữ đường thấp nhất',
  '  for L in lines:',
  '    while hull có từ 2 đường and đường cuối không bao giờ',
  '          thấp nhất thực sự khi L vào:  pop đường cuối',
  '    push L vào hull',
  '  p = 0;  for x in queries:  // x nhỏ nhất trước',
  '    while p + 1 < size and hull[p+1](x) ≤ hull[p](x): p = p + 1',
  '    answer(x) = hull[p](x)',
];

/** @param {Line} l @param {number} x */
export const valueAt = (l, x) => l.m * x + l.b;

/**
 * Whether b is useless between a and c, slopes a.m > b.m > c.m.
 * @param {Line} a @param {Line} b @param {Line} c
 */
export function useless(a, b, c) {
  return (c.b - a.b) * (a.m - b.m) <= (b.b - a.b) * (a.m - c.m);
}

/**
 * Reads "m b" pairs separated by commas or semicolons, such as "2 1, -1 13".
 * @param {string} text
 * @returns {{lines: [number, number][]} | {error: 'format'|'count'|'range'}}
 */
export function parseLines(text) {
  const parts = text
    .replace(/−/g, '-')
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 1 || parts.length > MAX_LINES) return { error: 'count' };
  /** @type {[number, number][]} */
  const lines = [];
  for (const p of parts) {
    const match = /^(-?\d+)\s+(-?\d+)$/.exec(p);
    if (!match) return { error: 'format' };
    const [m, b] = [Number(match[1]), Number(match[2])];
    if (Math.abs(m) > SLOPE_RANGE || b < INTERCEPT_MIN || b > INTERCEPT_MAX)
      return { error: 'range' };
    lines.push([m, b]);
  }
  return { lines };
}

/**
 * Reads whole x values from 0 to PLOT.xMax, sorted and without repeats.
 * @param {string} text
 * @returns {{queries: number[]} | {error: 'format'|'count'|'range'}}
 */
export function parseQueries(text) {
  const parts = text
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.every((p) => /^\d+$/.test(p))) return { error: 'format' };
  const xs = [...new Set(parts.map(Number))].sort((a, b) => a - b);
  if (xs.length < 1 || xs.length > MAX_QUERIES) return { error: 'count' };
  if (xs.some((x) => x > PLOT.xMax)) return { error: 'range' };
  return { queries: xs };
}

/**
 * @param {[number, number][]} pairs  Lines as [slope, intercept], in typed order.
 * @param {number[]} queries  x values, smallest first.
 * @returns {HullFrame[]}
 */
export function hullTrace(pairs, queries) {
  /** @type {Line[]} */
  const typed = pairs.map(([m, b], id) => ({ id, m, b }));
  /** @type {Line[]} */
  const sorted = typed.slice().sort((a, b) => b.m - a.m || a.b - b.b || a.id - b.id);
  const byId = new Map(sorted.map((l) => [l.id, l]));
  /** @type {number[]} */
  const hull = [];
  /** @type {number[]} */
  const removed = [];
  /** @type {(number|null)[]} */
  const answers = queries.map(() => null);
  /** @type {HullFrame[]} */
  const frames = [];
  let checks = 0;
  let moves = 0;
  let compares = 0;
  let p = -1;

  const line = (/** @type {number} */ id) => /** @type {Line} */ (byId.get(id));

  /** @param {Pick<HullFrame, 'kind'|'lines'> & Partial<HullFrame>} f */
  const push = (f) =>
    frames.push({
      cur: -1,
      pops: false,
      q: -1,
      ...f,
      lines: f.lines.slice(),
      pool: (f.kind === 'start' ? typed : sorted).map((l) => ({ ...l })),
      queries: queries.slice(),
      hull: hull.slice(),
      removed: removed.slice(),
      p,
      answers: answers.slice(),
      checks,
      moves,
      compares,
      triple: (f.triple ?? []).slice(),
    });

  push({ kind: 'start', lines: [0] });
  push({ kind: 'sort', lines: [1] });

  for (const L of sorted) {
    push({ kind: 'consider', lines: [2], cur: L.id });
    const last = hull.length ? line(hull[hull.length - 1]) : null;
    if (last && last.m === L.m) {
      // Sorted by intercept within a slope, so the hull's line is at least as low.
      removed.push(L.id);
      push({ kind: 'skip', lines: [1], cur: L.id });
      continue;
    }
    while (hull.length >= 2) {
      const a = line(hull[hull.length - 2]);
      const b = line(hull[hull.length - 1]);
      const pops = useless(a, b, L);
      checks++;
      if (pops) {
        hull.pop();
        removed.push(b.id);
      }
      push({ kind: 'check', lines: [3, 4], cur: L.id, triple: [a.id, b.id, L.id], pops });
      if (!pops) break;
    }
    hull.push(L.id);
    push({ kind: 'push', lines: [5], cur: L.id });
  }

  p = 0;
  queries.forEach((x, q) => {
    while (p + 1 < hull.length) {
      compares++;
      if (valueAt(line(hull[p + 1]), x) > valueAt(line(hull[p]), x)) break;
      p++;
      moves++;
      push({ kind: 'advance', lines: [6, 7], q });
    }
    answers[q] = valueAt(line(hull[p]), x);
    push({ kind: 'answer', lines: [6, 8], q });
  });

  push({ kind: 'done', lines: [8] });
  return frames;
}

/**
 * The part of a line inside the plot box [x0, x1] × [0, PLOT.yMax], or null if it misses it.
 * @param {Line} l @param {number} [x0] @param {number} [x1]
 * @returns {{x1: number, y1: number, x2: number, y2: number} | null}
 */
export function clipToPlot(l, x0 = 0, x1 = PLOT.xMax) {
  let lo = x0;
  let hi = x1;
  if (l.m === 0) {
    if (l.b < 0 || l.b > PLOT.yMax) return null;
  } else {
    const a = (0 - l.b) / l.m;
    const c = (PLOT.yMax - l.b) / l.m;
    lo = Math.max(lo, Math.min(a, c));
    hi = Math.min(hi, Math.max(a, c));
  }
  if (lo > hi) return null;
  return { x1: lo, y1: valueAt(l, lo), x2: hi, y2: valueAt(l, hi) };
}

/**
 * The lower envelope of hull lines over [0, PLOT.xMax]: which line is lowest on which stretch.
 * The hull is in slope order, largest first, so the pieces run left to right.
 * @param {Line[]} hull
 * @returns {{id: number, from: number, to: number}[]}
 */
export function envelopePieces(hull) {
  /** @type {{id: number, from: number, to: number}[]} */
  const pieces = [];
  hull.forEach((l, i) => {
    const prev = hull[i - 1];
    const next = hull[i + 1];
    const from = prev ? (l.b - prev.b) / (prev.m - l.m) : -Infinity;
    const to = next ? (next.b - l.b) / (l.m - next.m) : Infinity;
    const a = Math.max(0, from);
    const b = Math.min(PLOT.xMax, to);
    if (a < b) pieces.push({ id: l.id, from: a, to: b });
  });
  return pieces;
}
