/**
 * A boundary debugger for binary search. One correct closed-window search
 * ("find any index holding x, or -1") and four versions that each change a
 * single line. Each run is traced until it returns, reads outside the array,
 * or revisits a (lo, hi) state at the top of the loop: the code is
 * deterministic, so a repeated state means it would loop forever.
 */

export const MIN_N = 1;
export const MAX_N = 12;
export const MIN_VALUE = 0;
export const MAX_VALUE = 60;

/** @typedef {'A'|'B'|'C'|'D'|'E'} Version */
/** @typedef {'ok'|'miss'|'loop'|'out-of-bounds'} Outcome */

export const VERSIONS = /** @type {Version[]} */ (['A', 'B', 'C', 'D', 'E']);

const BASE = [
  'lo = 0; hi = n - 1',
  'while lo <= hi:',
  '  mid = floor((lo + hi) / 2)',
  '  if a[mid] == x: return mid',
  '  if a[mid] < x: lo = mid + 1',
  '  else: hi = mid - 1',
  'return -1',
];

/**
 * The line each version changes, as [line index, new text]; A is correct.
 * @type {Record<Version, [number, string] | null>}
 */
export const CHANGES = {
  A: null,
  B: [1, 'while lo < hi:'],
  C: [4, '  if a[mid] < x: lo = mid'],
  D: [0, 'lo = 0; hi = n'],
  E: [5, '  else: hi = mid'],
};

/** @type {Record<Version, string[]>} */
export const debugPseudocode = /** @type {Record<Version, string[]>} */ (
  Object.fromEntries(
    VERSIONS.map((v) => {
      const lines = BASE.slice();
      const change = CHANGES[v];
      if (change) lines[change[0]] = change[1];
      return [v, lines];
    }),
  )
);

/**
 * @typedef {object} DebugFrame
 * @property {'start'|'probe'|'go-right'|'go-left'|'done'} kind
 * @property {Version} version
 * @property {number} lo
 * @property {number} hi
 * @property {number} mid        -1 when no midpoint is being read.
 * @property {number} probes     Running number of reads of a[mid] inside the array.
 * @property {[number, number][]} states  (lo, hi) at the top of each loop pass so far.
 * @property {Outcome | ''} outcome  '' until 'done'.
 * @property {number} answer     The returned index or -1; -2 when the run never returns.
 * @property {number[]} lines
 */

/**
 * @param {Version} version
 * @param {number[]} a Non-decreasing.
 * @param {number} x
 * @returns {DebugFrame[]}
 */
export function debugTrace(version, a, x) {
  const n = a.length;
  let lo = 0;
  let hi = version === 'D' ? n : n - 1;
  let probes = 0;
  /** @type {[number, number][]} */
  const states = [];
  /** @type {DebugFrame[]} */
  const frames = [];
  /** @param {Pick<DebugFrame, 'kind'|'mid'|'outcome'|'answer'|'lines'>} f */
  const push = (f) =>
    frames.push({ ...f, version, lo, hi, probes, states: states.map(([p, q]) => [p, q]) });
  const present = a.includes(x);

  push({ kind: 'start', mid: -1, outcome: '', answer: -2, lines: [0] });
  for (;;) {
    if (states.some(([p, q]) => p === lo && q === hi)) {
      push({ kind: 'done', mid: -1, outcome: 'loop', answer: -2, lines: [1] });
      return frames;
    }
    states.push([lo, hi]);
    const enter = version === 'B' ? lo < hi : lo <= hi;
    if (!enter) {
      push({ kind: 'done', mid: -1, outcome: present ? 'miss' : 'ok', answer: -1, lines: [1, 6] });
      return frames;
    }
    const mid = Math.floor((lo + hi) / 2);
    if (mid >= n) {
      push({ kind: 'done', mid, outcome: 'out-of-bounds', answer: -2, lines: [1, 2, 3] });
      return frames;
    }
    probes++;
    if (a[mid] === x) {
      push({ kind: 'probe', mid, outcome: '', answer: -2, lines: [1, 2, 3] });
      push({ kind: 'done', mid, outcome: 'ok', answer: mid, lines: [3] });
      return frames;
    }
    push({ kind: 'probe', mid, outcome: '', answer: -2, lines: [1, 2, 3] });
    if (a[mid] < x) {
      lo = version === 'C' ? mid : mid + 1;
      push({ kind: 'go-right', mid, outcome: '', answer: -2, lines: [4] });
    } else {
      hi = version === 'E' ? mid : mid - 1;
      push({ kind: 'go-left', mid, outcome: '', answer: -2, lines: [5] });
    }
  }
}

/**
 * The outcome of a version for one target, from the end of its trace.
 * @param {Version} version @param {number[]} a @param {number} x
 * @returns {Outcome}
 */
export function outcomeOf(version, a, x) {
  return /** @type {Outcome} */ (debugTrace(version, a, x).at(-1)?.outcome);
}

/**
 * Every whole-number target from one below the smallest value to one above the
 * largest, so each gap and both ends are tried.
 * @param {number[]} a
 */
export function candidateTargets(a) {
  const out = [];
  for (let x = a[0] - 1; x <= a[a.length - 1] + 1; x++) out.push(x);
  return out;
}

/**
 * @param {Version} version @param {number[]} a
 * @returns {{x: number, outcome: Outcome}[]}
 */
export function scanTargets(version, a) {
  return candidateTargets(a).map((x) => ({ x, outcome: outcomeOf(version, a, x) }));
}

/**
 * Reads a sorted list of whole numbers.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'|'order'}}
 */
export function parseSorted(text) {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (!parts.every((p) => /^-?\d+$/.test(p))) return { error: 'format' };
  const values = parts.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length < MIN_N || values.length > MAX_N) return { error: 'count' };
  if (values.some((v, i) => i > 0 && v < values[i - 1])) return { error: 'order' };
  return { values };
}

/**
 * Sorted distinct values with random gaps of 1 to 5, so 12 of them stay within MAX_VALUE.
 * @param {number} n
 * @param {() => number} [rand]
 */
export function makeSorted(n, rand = Math.random) {
  const out = [];
  let v = Math.floor(rand() * 4) + 1;
  for (let i = 0; i < n; i++) {
    out.push(v);
    v += Math.floor(rand() * 5) + 1;
  }
  return out;
}
