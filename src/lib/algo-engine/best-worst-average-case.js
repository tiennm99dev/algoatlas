/**
 * Linear search scanned left to right (0-based), counting element comparisons, plus the cost
 * profile behind best, worst and average case: a target found first at index i costs i + 1
 * comparisons, an absent target costs n.
 */

export const MAX_N = 12;
export const MAX_VALUE = 99;

/** @typedef {'best' | 'worst' | 'random'} CaseKind */

export const linearSearchPseudocode = [
  'linearSearch(A, x):',
  '  for i = 0 to n − 1:',
  '    if A[i] == x:',
  '      return i',
  '  return −1',
];

/**
 * @typedef {object} LinearFrame
 * @property {'start'|'compare'|'found'|'missing'|'done'} kind
 * @property {number[]} values
 * @property {number} target
 * @property {number} i  Index being compared, -1 when none.
 * @property {boolean | null} match  Whether A[i] == x on a compare step.
 * @property {number} comparisons
 * @property {number} foundAt  -1 until found (and when absent).
 * @property {number[]} lines
 */

/**
 * @param {number[]} values
 * @param {number} target
 * @returns {LinearFrame[]}
 */
export function linearSearchTrace(values, target) {
  const a = values.slice();
  /** @type {LinearFrame[]} */
  const frames = [];
  let comparisons = 0;
  let foundAt = -1;

  /** @param {LinearFrame['kind']} kind @param {number} i @param {boolean | null} match @param {number[]} lines */
  function push(kind, i, match, lines) {
    frames.push({
      kind,
      values: a.slice(),
      target,
      i,
      match,
      comparisons,
      foundAt,
      lines: lines.slice(),
    });
  }

  push('start', -1, null, [0]);
  for (let i = 0; i < a.length; i++) {
    comparisons++;
    const match = a[i] === target;
    push('compare', i, match, [1, 2]);
    if (match) {
      foundAt = i;
      push('found', i, true, [3]);
      push('done', i, true, [3]);
      return frames;
    }
  }
  push('missing', -1, null, [4]);
  push('done', -1, null, [4]);
  return frames;
}

/**
 * Comparisons for every outcome on n elements: index i costs i + 1, and the last entry is the
 * absent target, which costs n.
 * @param {number} n
 */
export function costProfile(n) {
  return [...Array.from({ length: n }, (_, i) => i + 1), n];
}

/** Expected comparisons when the target is equally likely at each of n positions. @param {number} n */
export const averageFound = (n) => (n + 1) / 2;

/**
 * A target that produces the case: best is the first element, worst is an absent value (the
 * smallest from 0 up that is not in the array), random is a uniformly chosen element.
 * @param {number[]} values  Non-empty, at most MAX_N values from 0 to MAX_VALUE.
 * @param {CaseKind} kind
 * @param {() => number} [rand]
 */
export function caseTarget(values, kind, rand = Math.random) {
  if (kind === 'best') return values[0];
  if (kind === 'random') return values[Math.floor(rand() * values.length)];
  let x = 0;
  while (values.includes(x)) x++;
  return x;
}
