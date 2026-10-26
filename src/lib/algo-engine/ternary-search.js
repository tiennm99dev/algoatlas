/**
 * Ternary search for the maximum of a function on a real interval [a, b].
 * Two probes m1 < m2 split the interval into thirds; comparing f(m1) with
 * f(m2) rules out one outer third. This is correct when f is unimodal
 * (strictly rises, then strictly falls); on other functions it still stops,
 * but may stop at a lower, local peak.
 */

/** @typedef {'parabola'|'tent'|'bell'|'two-peaks'} Shape */

export const SHAPES = /** @type {Shape[]} */ (['parabola', 'tent', 'bell', 'two-peaks']);
export const DOMAIN = /** @type {const} */ ([0, 6]);
export const EPSILONS = [0.5, 0.1, 0.01, 0.001];
export const PEAK_MIN = 0.5;
export const PEAK_MAX = 5.5;

/**
 * f for a shape with its peak at p. two-peaks ignores p.
 * @param {Shape} shape
 * @param {number} p
 * @returns {(x: number) => number}
 */
export function makeFunction(shape, p) {
  switch (shape) {
    case 'parabola':
      return (x) => 5 - 0.5 * (x - p) ** 2;
    case 'tent':
      return (x) => 5 - Math.abs(x - p);
    case 'bell':
      return (x) => 0.5 + 4.5 * Math.exp(-((x - p) ** 2) / 1.5);
    case 'two-peaks':
      // A tall narrow peak at 0.8 and a lower wide one at 4.
      return (x) =>
        0.2 + 4.8 * Math.exp(-((x - 0.8) ** 2) / 0.3) + 3 * Math.exp(-((x - 4) ** 2) / 2);
  }
}

/** True for the shapes that have a single peak. @param {Shape} shape */
export const isUnimodal = (shape) => shape !== 'two-peaks';

/**
 * @typedef {object} TernaryFrame
 * @property {'start'|'probe'|'cut-left'|'cut-right'|'done'} kind
 * @property {number} lo
 * @property {number} hi
 * @property {number} m1           NaN when no probes are on screen.
 * @property {number} m2
 * @property {number} f1           f(m1), NaN when no probes are on screen.
 * @property {number} f2
 * @property {number} iterations   Rounds finished so far.
 * @property {number} evaluations  Running number of calls to f.
 * @property {number} answer       NaN until 'done', then (lo + hi) / 2.
 * @property {number[]} lines
 */

export const ternaryPseudocode = [
  'lo = a; hi = b',
  'while hi - lo > ε:',
  '  m1 = lo + (hi - lo) / 3',
  '  m2 = hi - (hi - lo) / 3',
  '  if f(m1) < f(m2):',
  '    lo = m1     // peak not in [lo, m1)',
  '  else: hi = m2  // peak not in (m2, hi]',
  'return (lo + hi) / 2',
];

/**
 * @param {(x: number) => number} f
 * @param {number} a
 * @param {number} b
 * @param {number} eps  Stop when the interval is at most this wide.
 * @returns {TernaryFrame[]}
 */
export function ternaryTrace(f, a, b, eps) {
  let lo = a;
  let hi = b;
  let iterations = 0;
  let evaluations = 0;
  /** @type {TernaryFrame[]} */
  const frames = [];
  /** @param {Pick<TernaryFrame, 'kind'|'m1'|'m2'|'f1'|'f2'|'answer'|'lines'>} fr */
  const push = (fr) => frames.push({ ...fr, lo, hi, iterations, evaluations });

  push({ kind: 'start', m1: NaN, m2: NaN, f1: NaN, f2: NaN, answer: NaN, lines: [0] });
  while (hi - lo > eps) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    const f1 = f(m1);
    const f2 = f(m2);
    evaluations += 2;
    push({ kind: 'probe', m1, m2, f1, f2, answer: NaN, lines: [1, 2, 3, 4] });
    iterations++;
    if (f1 < f2) {
      lo = m1;
      push({ kind: 'cut-left', m1, m2, f1, f2, answer: NaN, lines: [5] });
    } else {
      hi = m2;
      push({ kind: 'cut-right', m1, m2, f1, f2, answer: NaN, lines: [6] });
    }
  }
  const answer = (lo + hi) / 2;
  push({ kind: 'done', m1: NaN, m2: NaN, f1: NaN, f2: NaN, answer, lines: [1, 7] });
  return frames;
}

/**
 * Rounds ternary search needs to shrink width w to at most eps: the width is
 * multiplied by 2/3 per round.
 * @param {number} w
 * @param {number} eps
 */
export function roundsNeeded(w, eps) {
  let rounds = 0;
  while (w > eps) {
    w = (w * 2) / 3;
    rounds++;
  }
  return rounds;
}
