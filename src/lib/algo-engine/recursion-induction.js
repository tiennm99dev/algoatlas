/**
 * Step traces that check a correctness argument while the code runs. The three loops carry
 * a loop invariant, checked on entry (initialization), after every iteration (maintenance)
 * and on exit (termination). The recursive sum carries the claim P(k) “sum(a, k) returns
 * a[0] + … + a[k − 1]”, checked at the base case and at every inductive step. Each program
 * has a buggy twin with one changed line, so a learner can watch the argument break.
 */

/** @typedef {'sum'|'max'|'insertion'|'recursive'} InductionProgram */

/**
 * @typedef {'init'|'maintain'|'end'|'base'|'step'} CheckPhase
 */

/**
 * @typedef {object} CheckEntry
 * @property {CheckPhase} phase
 * @property {number} at  The loop index i, or k for the recursive claim.
 * @property {boolean} holds
 */

/**
 * @typedef {object} InductionFrame
 * @property {'start'|'init'|'body'|'check'|'exit'|'call'|'base'|'step'|'done'} kind
 * @property {InductionProgram} program
 * @property {boolean} buggy
 * @property {number[]} items  The array as it is now (insertion sort rearranges it).
 * @property {number} i  Loop index, or k of the running call; -1 before the first.
 * @property {number} prefix  How many leading items the invariant or claim talks about.
 * @property {number|null} acc  s, m, or the value sum(a, k) returned; null when not set.
 * @property {number|null} expected  The value the invariant or claim says acc must have.
 * @property {number} disorder  Insertion sort: first p with items[p] > items[p + 1] inside the
 *                              prefix, -1 when the prefix is sorted.
 * @property {boolean|null} holds  The check made on this frame; null when nothing is checked.
 * @property {CheckPhase|null} phase
 * @property {CheckEntry[]} log  Every check so far.
 * @property {number} passed
 * @property {number} failed
 * @property {number[]} stack  Recursive sum: the k of every call on the stack, first call first.
 * @property {number} moved  Insertion sort, body frames: how many items shifted right.
 * @property {number|null} key  Insertion sort, body frames: the value just inserted.
 * @property {boolean|null} correct  exit and done: whether the answer is right.
 * @property {number[]} lines
 */

export const INDUCTION_PROGRAMS = /** @type {InductionProgram[]} */ ([
  'sum',
  'max',
  'insertion',
  'recursive',
]);

export const MAX_N = 10;
export const MAX_ABS = 99;

/** Correct pseudocode. Each buggy twin differs in exactly one line (`BUG_LINE`). */
export const inductionPseudocode = {
  sum: [
    'sum(a):',
    '  s = 0; i = 0',
    '  // invariant: s = a[0] + … + a[i − 1]',
    '  while i < n:',
    '    s = s + a[i]',
    '    i = i + 1',
    '  return s        // i = n, so s = a[0] + … + a[n − 1]',
  ],
  max: [
    'max(a):           // a has at least one value',
    '  m = a[0]; i = 1',
    '  // invariant: m = max(a[0], …, a[i − 1])',
    '  while i < n:',
    '    if a[i] > m: m = a[i]',
    '    i = i + 1',
    '  return m        // i = n, so m is the maximum of a',
  ],
  insertion: [
    'insertionSort(a):',
    '  i = 1',
    '  // invariant: a[0..i − 1] holds the first i values, sorted',
    '  while i < n:',
    '    key = a[i]; j = i − 1',
    '    while j >= 0 and a[j] > key: a[j + 1] = a[j]; j = j − 1',
    '    a[j + 1] = key',
    '    i = i + 1',
    '  return a        // i = n, so all of a is sorted',
  ],
  recursive: [
    'sum(a, k):        // claim P(k): returns a[0] + … + a[k − 1]',
    '  if k == 0: return 0          // base case: P(0)',
    '  r = sum(a, k − 1)            // hypothesis: P(k − 1) holds',
    '  return r + a[k − 1]          // step: so P(k) holds',
  ],
};

export const BUG_LINE = { sum: 1, max: 4, insertion: 5, recursive: 1 };

export const buggyPseudocode = {
  sum: replaceLine(
    inductionPseudocode.sum,
    BUG_LINE.sum,
    '  s = 0; i = 1          // bug: skips a[0]',
  ),
  max: replaceLine(
    inductionPseudocode.max,
    BUG_LINE.max,
    '    if a[i] < m: m = a[i]  // bug: < instead of >',
  ),
  insertion: replaceLine(
    inductionPseudocode.insertion,
    BUG_LINE.insertion,
    '    while j > 0 and a[j] > key: a[j + 1] = a[j]; j = j − 1   // bug: j > 0',
  ),
  recursive: replaceLine(
    inductionPseudocode.recursive,
    BUG_LINE.recursive,
    '  if k == 0: return 1          // bug: wrong base value',
  ),
};

/** @param {string[]} lines @param {number} at @param {string} text */
function replaceLine(lines, at, text) {
  return lines.map((line, i) => (i === at ? text : line));
}

/**
 * Reads a list of whole numbers separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'count'|'range'}}
 */
export function parseValues(text) {
  const parts = text
    .replace(/[−–]/g, '-')
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (parts.some((p) => !/^-?\d+$/.test(p))) return { error: 'format' };
  const values = parts.map(Number);
  if (values.length < 1 || values.length > MAX_N) return { error: 'count' };
  if (values.some((v) => Math.abs(v) > MAX_ABS)) return { error: 'range' };
  return { values };
}

/** @param {number[]} a @param {number} k */
const prefixSum = (a, k) => a.slice(0, k).reduce((s, v) => s + v, 0);

/** @param {number[]} a @param {number} k */
function firstDisorder(a, k) {
  for (let p = 0; p + 1 < k; p++) if (a[p] > a[p + 1]) return p;
  return -1;
}

/**
 * Whether `prefix` holds exactly the values of `original.slice(0, k)`, ignoring order.
 * @param {number[]} prefix
 * @param {number[]} original
 * @param {number} k
 */
function sameValues(prefix, original, k) {
  const x = prefix.slice(0, k).sort((p, q) => p - q);
  const y = original.slice(0, k).sort((p, q) => p - q);
  return x.every((v, i) => v === y[i]);
}

/**
 * @param {InductionProgram} program
 * @param {number[]} input  1 to MAX_N whole numbers.
 * @param {boolean} [buggy]
 * @returns {InductionFrame[]}
 */
export function inductionTrace(program, input, buggy = false) {
  const a = input.slice();
  const n = a.length;
  /** @type {InductionFrame[]} */
  const frames = [];
  /** @type {CheckEntry[]} */
  const log = [];
  let passed = 0;
  let failed = 0;
  /** @type {number[]} */
  const stack = [];

  /**
   * @param {Pick<InductionFrame, 'kind'|'lines'> & Partial<InductionFrame>} f
   */
  const push = (f) =>
    frames.push({
      i: -1,
      prefix: 0,
      acc: null,
      expected: null,
      disorder: -1,
      holds: null,
      phase: null,
      moved: 0,
      key: null,
      correct: null,
      ...f,
      program,
      buggy,
      items: a.slice(),
      log: log.map((e) => ({ ...e })),
      passed,
      failed,
      stack: stack.slice(),
    });

  /**
   * Records one check and returns the outcome.
   * @param {CheckPhase} phase
   * @param {number} at
   * @param {boolean} holds
   */
  const record = (phase, at, holds) => {
    log.push({ phase, at, holds });
    if (holds) passed++;
    else failed++;
    return holds;
  };

  push({ kind: 'start', lines: [0] });

  if (program === 'recursive') {
    /** @param {number} k @returns {number} */
    const sum = (k) => {
      stack.push(k);
      push({ kind: 'call', lines: [0], i: k, prefix: k });
      /** @type {number} */
      let value;
      if (k === 0) {
        value = buggy ? 1 : 0;
        const holds = record('base', 0, value === 0);
        push({
          kind: 'base',
          lines: [1],
          i: 0,
          prefix: 0,
          acc: value,
          expected: 0,
          holds,
          phase: 'base',
        });
      } else {
        const r = sum(k - 1);
        value = r + a[k - 1];
        const expected = prefixSum(a, k);
        const holds = record('step', k, value === expected);
        push({
          kind: 'step',
          lines: [2, 3],
          i: k,
          prefix: k,
          acc: value,
          expected,
          holds,
          phase: 'step',
        });
      }
      stack.pop();
      return value;
    };
    const result = sum(n);
    const expected = prefixSum(a, n);
    push({
      kind: 'done',
      lines: [],
      i: n,
      prefix: n,
      acc: result,
      expected,
      correct: result === expected,
    });
    return frames;
  }

  if (program === 'insertion') {
    const original = input.slice();
    /** @param {number} k */
    const check = (k) => firstDisorder(a, k) === -1 && sameValues(a, original, k);
    let i = 1;
    push({
      kind: 'init',
      lines: [1, 2],
      i,
      prefix: Math.min(i, n),
      disorder: firstDisorder(a, i),
      holds: record('init', i, check(i)),
      phase: 'init',
    });
    while (i < n) {
      const key = a[i];
      let j = i - 1;
      let moved = 0;
      while ((buggy ? j > 0 : j >= 0) && a[j] > key) {
        a[j + 1] = a[j];
        j--;
        moved++;
      }
      a[j + 1] = key;
      push({
        kind: 'body',
        lines: [3, 4, 5, 6],
        i,
        prefix: i,
        moved,
        key,
        disorder: firstDisorder(a, i),
      });
      i++;
      push({
        kind: 'check',
        lines: [7, 2],
        i,
        prefix: i,
        disorder: firstDisorder(a, i),
        holds: record('maintain', i, check(i)),
        phase: 'maintain',
      });
    }
    const sorted = original.slice().sort((p, q) => p - q);
    const correct = a.every((v, p) => v === sorted[p]);
    push({
      kind: 'exit',
      lines: [3, 8],
      i,
      prefix: n,
      disorder: firstDisorder(a, n),
      holds: record('end', i, check(n)),
      phase: 'end',
      correct,
    });
    push({ kind: 'done', lines: [], i, prefix: n, disorder: firstDisorder(a, n), correct });
    return frames;
  }

  // The sum and max loops share one shape: an accumulator and an index.
  const isSum = program === 'sum';
  /** @param {number} k */
  const truth = (k) => (isSum ? prefixSum(a, k) : Math.max(...a.slice(0, k)));
  let i = isSum ? (buggy ? 1 : 0) : 1;
  let acc = isSum ? 0 : a[0];
  /** @param {CheckPhase} phase */
  const checkNow = (phase) => {
    const expected = truth(i);
    return { acc, expected, holds: record(phase, i, acc === expected), phase };
  };
  push({ kind: 'init', lines: [1, 2], i, prefix: i, ...checkNow('init') });
  while (i < n) {
    if (isSum) acc += a[i];
    else if (buggy ? a[i] < acc : a[i] > acc) acc = a[i];
    // Mid-step: acc already includes a[i] but i has not moved, so nothing is checked here.
    push({ kind: 'body', lines: [3, 4], i, prefix: i, acc, expected: truth(i) });
    i++;
    push({ kind: 'check', lines: [5, 2], i, prefix: i, ...checkNow('maintain') });
  }
  const answer = truth(n);
  push({
    kind: 'exit',
    lines: [3, 6],
    i,
    prefix: n,
    ...checkNow('end'),
    correct: acc === answer,
  });
  push({ kind: 'done', lines: [], i, prefix: n, acc, expected: answer, correct: acc === answer });
  return frames;
}
