/**
 * Binary search on the answer, on the "ship packages in D days" problem:
 * parcels with weights w must leave in the given order, at most one truck
 * load per day, and the truck's capacity c is the same every day. Find the
 * smallest c that ships everything within D days.
 *
 * feasible(c) is monotone: false for every c below the answer and true for
 * every c from it on. The search runs over capacities, not over an array,
 * on the closed range [max(w), sum(w)], where feasible(sum(w)) is always true.
 */

export const MIN_N = 1;
export const MAX_N = 10;
export const MIN_WEIGHT = 1;
export const MAX_WEIGHT = 15;

/**
 * @typedef {object} Check  One evaluated capacity.
 * @property {number} cap
 * @property {boolean} ok
 */

/**
 * @typedef {object} AnswerFrame
 * @property {'start'|'probe'|'check'|'go-left'|'go-right'|'done'} kind
 * @property {number} lo
 * @property {number} hi        Inclusive; feasible(hi) is known to be true.
 * @property {number} mid       -1 when no capacity is under test.
 * @property {number[][]} days  On a check frame: the parcels each day carries at capacity mid.
 * @property {boolean} ok       On a check frame and after it: feasible(mid).
 * @property {Check[]} checked  Every capacity tested so far, in order.
 * @property {number} checks    Running number of feasibility checks.
 * @property {number} reads     Running number of parcel weights read by the checks.
 * @property {number} answer    -1 until 'done', then lo.
 * @property {number[]} lines
 */

export const answerPseudocode = [
  'lo = max(w); hi = sum(w)  // hi works',
  'while lo < hi:',
  '  mid = lo + floor((hi - lo) / 2)',
  '  if feasible(mid):',
  '    hi = mid        // so may smaller c',
  '  else: lo = mid + 1  // all c ≤ mid fail',
  'return lo           // smallest c that works',
  'feasible(c): days = 1; load = 0',
  '  for each weight x in w:',
  '    if load + x > c: days += 1; load = 0',
  '    load = load + x',
  '  return days <= D',
];

/** Lines 0 to 6 are the search; lines from FEASIBLE_FROM on are feasible(c). */
export const FEASIBLE_FROM = 7;

/**
 * Greedy packing: fill each day as full as capacity c allows, in order.
 * Requires c ≥ max(w).
 * @param {number[]} w
 * @param {number} c
 * @returns {number[][]} The weights carried on each day.
 */
export function packDays(w, c) {
  /** @type {number[][]} */
  const days = [[]];
  let load = 0;
  for (const x of w) {
    if (load + x > c) {
      days.push([]);
      load = 0;
    }
    days[days.length - 1].push(x);
    load += x;
  }
  return days;
}

/**
 * @param {number[]} w
 * @param {number} c
 * @param {number} limit D
 */
export function feasible(w, c, limit) {
  return c >= Math.max(...w) && packDays(w, c).length <= limit;
}

/**
 * The bounds of the capacity range searched.
 * @param {number[]} w
 */
export function capRange(w) {
  return { lo: Math.max(...w), hi: w.reduce((s, x) => s + x, 0) };
}

/**
 * @param {number[]} w   1 to MAX_N parcels.
 * @param {number} limit D, from 1 to w.length.
 * @returns {AnswerFrame[]}
 */
export function answerTrace(w, limit) {
  let { lo, hi } = capRange(w);
  let checks = 0;
  let reads = 0;
  /** @type {Check[]} */
  const checked = [];
  /** @type {AnswerFrame[]} */
  const frames = [];
  /** @param {Omit<AnswerFrame, 'lo'|'hi'|'checked'|'checks'|'reads'>} f */
  const push = (f) =>
    frames.push({
      ...f,
      days: f.days.map((d) => d.slice()),
      lo,
      hi,
      checked: checked.map((c) => ({ ...c })),
      checks,
      reads,
    });

  push({ kind: 'start', mid: -1, days: [], ok: false, answer: -1, lines: [0] });
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    push({ kind: 'probe', mid, days: [], ok: false, answer: -1, lines: [1, 2] });
    const days = packDays(w, mid);
    const ok = days.length <= limit;
    checks++;
    reads += w.length;
    checked.push({ cap: mid, ok });
    push({ kind: 'check', mid, days, ok, answer: -1, lines: [3, 7, 8, 9, 10, 11] });
    if (ok) {
      hi = mid;
      push({ kind: 'go-left', mid, days: [], ok, answer: -1, lines: [4] });
    } else {
      lo = mid + 1;
      push({ kind: 'go-right', mid, days: [], ok, answer: -1, lines: [5] });
    }
  }
  push({ kind: 'done', mid: -1, days: packDays(w, lo), ok: true, answer: lo, lines: [1, 6] });
  return frames;
}

/**
 * Reads a comma- or space-separated list of parcel weights.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseWeights(text) {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (!parts.every((p) => /^-?\d+$/.test(p))) return { error: 'format' };
  const values = parts.map(Number);
  if (values.some((v) => v < MIN_WEIGHT || v > MAX_WEIGHT)) return { error: 'range' };
  if (values.length < MIN_N || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * @param {number} n
 * @param {() => number} [rand]
 */
export function makeWeights(n, rand = Math.random) {
  return Array.from({ length: n }, () => Math.floor(rand() * MAX_WEIGHT) + MIN_WEIGHT);
}
