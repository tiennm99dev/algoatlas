/**
 * Divide and conquer with a combine step the learner builds. Two problems share one split:
 * a range [lo, hi] (closed, 0-based) halves at mid = floor((lo + hi) / 2) into [lo, mid] and
 * [mid + 1, hi] until it holds one cell.
 *
 * - Maximum subarray (non-empty, so an all-negative array answers its largest value): the
 *   combine may use L and R (the halves' answers), C (best suffix of the left half plus best
 *   prefix of the right half, the best subarray crossing mid) and T (the sum of the range).
 *   The correct combine is max(L, R, C).
 * - Majority element (a value filling more than half the range, or none): the combine may try
 *   the candidates L and R and may count each in the whole range. The correct combine tries
 *   both and returns one only when its count is more than half.
 *
 * The run is traced once; every return is checked against a brute-force answer for its own
 * range, so the page can show the first call whose combine went wrong.
 */

export const MIN_N = 1;
export const MAX_N = 16;
export const MIN_VALUE = -99;
export const MAX_VALUE = 99;

/** @typedef {'max-subarray'|'majority'} Problem */
/** @typedef {'left'|'right'|'cross'|'total'|'count'} Part */

export const PROBLEMS = /** @type {Problem[]} */ (['max-subarray', 'majority']);

/** The parts the learner may switch on, in the order the code lists them. */
/** @type {Record<Problem, Part[]>} */
export const PARTS = {
  'max-subarray': ['left', 'right', 'cross', 'total'],
  majority: ['left', 'right', 'count'],
};

/** A correct combine for each problem. */
/** @type {Record<Problem, Part[]>} */
export const CORRECT = {
  'max-subarray': ['left', 'right', 'cross'],
  majority: ['left', 'right', 'count'],
};

/** Sample inputs the combine is checked on. */
/** @type {Record<Problem, number[][]>} */
export const SAMPLES = {
  'max-subarray': [
    [-2, 1, -3, 4, -1, 2, 1, -5, 4],
    [13, -3, -25, 20, -3, -16, -23, 18, 20, -7, 12, -5, -22, 15, -4, 7],
    [-8, -3, -6, -2, -5, -4],
    [5, -9, 6, -2, 3],
    [4, -1, 2, 1],
  ],
  majority: [
    [3, 3, 4, 2, 4, 4, 2, 4, 4],
    [4, 4, 4, 1, 2],
    [7, 1, 7, 2, 7, 3, 7],
    [1, 2, 3, 1, 2, 3],
    [1, 1, 2, 2],
  ],
};

/** @type {Record<string, string>} */
const TERM = { left: 'L', right: 'R', cross: 'C', total: 'T' };

/**
 * Keeps the parts of this problem, once each, in their listed order.
 * @param {Problem} problem @param {Part[]} parts
 */
export function normalizeParts(problem, parts) {
  return PARTS[problem].filter((p) => parts.includes(p));
}

/**
 * The learner's code: fixed lines plus the combine they built. Line indices are the same for
 * every combine of a problem, so frames can name lines without knowing the parts.
 * @param {Problem} problem @param {Part[]} parts
 * @returns {string[]}
 */
export function combinePseudocode(problem, parts) {
  const on = normalizeParts(problem, parts);
  if (problem === 'max-subarray') {
    const terms = on.map((p) => TERM[p]);
    return [
      'best(lo, hi):',
      '  if lo == hi: return a[lo]',
      '  mid = floor((lo + hi) / 2)',
      '  L = best(lo, mid); R = best(mid + 1, hi)',
      '  C = maxSuffix(lo, mid) + maxPrefix(mid + 1, hi)',
      '  T = sum(lo, hi)',
      terms.length ? `  return max(${terms.join(', ')})` : '  return nothing',
    ];
  }
  const cands = [on.includes('left') ? 'L' : '', on.includes('right') ? 'R' : ''].filter(Boolean);
  return [
    'major(lo, hi):',
    '  if lo == hi: return a[lo]',
    '  mid = floor((lo + hi) / 2)',
    '  L = major(lo, mid); R = major(mid + 1, hi)',
    `  for each x ≠ none in [${cands.join(', ')}]:`,
    on.includes('count') ? '    if count(x, lo, hi) > (hi − lo + 1) / 2: return x' : '    return x',
    '  return none',
  ];
}

export const maxSubarrayPseudocode = combinePseudocode('max-subarray', CORRECT['max-subarray']);
export const majorityPseudocode = combinePseudocode('majority', CORRECT.majority);

/**
 * @typedef {'waiting'|'open'|'right'|'wrong'} CallStatus
 *
 * @typedef {object} DcFrame
 * @property {'start'|'split'|'base'|'measure'|'count'|'combine'|'done'} kind
 * @property {Problem} problem
 * @property {number} lo   The call acted on; -1 on 'start' and 'done'.
 * @property {number} hi
 * @property {number} mid  -1 when the call has not split.
 * @property {Record<string, CallStatus>} status  By call id `lo-hi`; calls not yet made are absent.
 * @property {Record<string, number | null>} results  Returned values by call id; null is “nothing” or “none”.
 * @property {string[]} stack  Open call ids, outermost first.
 * @property {number | null} L
 * @property {number | null} R
 * @property {number | null} C  Maximum subarray only: the best crossing sum.
 * @property {number | null} T  Maximum subarray only: the range sum.
 * @property {[number, number] | null} suffix  Maximum subarray: the best suffix [s, mid] of the left half.
 * @property {[number, number] | null} prefix  Maximum subarray: the best prefix [mid + 1, e] of the right half.
 * @property {number} countL  Majority: copies of L in the range, -1 when not counted.
 * @property {number} countR  Majority: copies of R in the range, -1 when not counted.
 * @property {string} picked  The term or candidate returned ('L', 'R', 'C', 'T', 'a[lo]'), '' for nothing.
 * @property {number | null} result  The value returned by this call.
 * @property {number | null} expected  The right answer for this call's range.
 * @property {boolean} ok  result equals expected; on 'done', for the whole array.
 * @property {string} firstWrong  Id of the first call that returned a wrong value, '' if none so far.
 * @property {number} calls  Calls made so far.
 * @property {number} reads  Array cells read so far.
 * @property {number[]} lines
 */

/** @param {number} lo @param {number} hi */
export const callId = (lo, hi) => `${lo}-${hi}`;

/**
 * Brute force over every subarray: the largest sum of a non-empty a[lo..hi] piece.
 * @param {number[]} a @param {number} [lo] @param {number} [hi]
 * @returns {number | null} null for an empty range.
 */
export function bruteMaxSubarray(a, lo = 0, hi = a.length - 1) {
  let best = null;
  for (let i = lo; i <= hi; i++) {
    let s = 0;
    for (let j = i; j <= hi; j++) {
      s += a[j];
      if (best === null || s > best) best = s;
    }
  }
  return best;
}

/**
 * Brute force: the value filling more than half of a[lo..hi], or null.
 * @param {number[]} a @param {number} [lo] @param {number} [hi]
 * @returns {number | null}
 */
export function bruteMajority(a, lo = 0, hi = a.length - 1) {
  const len = hi - lo + 1;
  for (let i = lo; i <= hi; i++) {
    let c = 0;
    for (let j = lo; j <= hi; j++) if (a[j] === a[i]) c++;
    if (2 * c > len) return a[i];
  }
  return null;
}

/** @param {Problem} problem @param {number[]} a @param {number} lo @param {number} hi */
const expectedFor = (problem, a, lo, hi) =>
  problem === 'max-subarray' ? bruteMaxSubarray(a, lo, hi) : bruteMajority(a, lo, hi);

/**
 * Runs the divide and conquer with the given combine on `a` and records every step.
 * @param {Problem} problem
 * @param {Part[]} parts
 * @param {number[]} a  1 to MAX_N values.
 * @returns {DcFrame[]}
 */
export function solveTrace(problem, parts, a) {
  const on = normalizeParts(problem, parts);
  /** @type {Record<string, CallStatus>} */
  const status = {};
  /** @type {Record<string, number | null>} */
  const results = {};
  /** @type {string[]} */
  const stack = [];
  /** @type {DcFrame[]} */
  const frames = [];
  let calls = 0;
  let reads = 0;
  let firstWrong = '';

  /** @type {Omit<DcFrame, 'kind'|'problem'|'status'|'results'|'stack'|'firstWrong'|'calls'|'reads'|'lines'>} */
  const blank = {
    lo: -1,
    hi: -1,
    mid: -1,
    L: null,
    R: null,
    C: null,
    T: null,
    suffix: null,
    prefix: null,
    countL: -1,
    countR: -1,
    picked: '',
    result: null,
    expected: null,
    ok: true,
  };

  /** @param {DcFrame['kind']} kind @param {number[]} lines @param {Partial<DcFrame>} fields */
  const push = (kind, lines, fields) =>
    frames.push({
      ...blank,
      ...fields,
      suffix: fields.suffix ? [fields.suffix[0], fields.suffix[1]] : null,
      prefix: fields.prefix ? [fields.prefix[0], fields.prefix[1]] : null,
      kind,
      problem,
      status: { ...status },
      results: { ...results },
      stack: stack.slice(),
      firstWrong,
      calls,
      reads,
      lines,
    });

  /**
   * @param {number} lo @param {number} hi @param {Partial<DcFrame>} fields
   * @param {number | null} result @param {DcFrame['kind']} kind @param {number[]} lines
   */
  const finish = (lo, hi, fields, result, kind, lines) => {
    const id = callId(lo, hi);
    const expected = expectedFor(problem, a, lo, hi);
    const ok = result === expected;
    status[id] = ok ? 'right' : 'wrong';
    results[id] = result;
    if (!ok && !firstWrong) firstWrong = id;
    stack.pop();
    push(kind, lines, { ...fields, lo, hi, result, expected, ok });
    return result;
  };

  /** @param {number} lo @param {number} hi @returns {number | null} */
  function solve(lo, hi) {
    const id = callId(lo, hi);
    calls++;
    status[id] = 'open';
    stack.push(id);
    if (lo === hi) {
      reads++;
      return finish(lo, hi, { picked: 'a[lo]' }, a[lo], 'base', [0, 1]);
    }
    const mid = Math.floor((lo + hi) / 2);
    push('split', [0, 1, 2, 3], { lo, hi, mid });
    status[id] = 'waiting';
    const L = solve(lo, mid);
    const R = solve(mid + 1, hi);
    status[id] = 'open';
    return problem === 'max-subarray'
      ? combineMax(lo, mid, hi, L, R)
      : combineMajority(lo, mid, hi, L, R);
  }

  /**
   * @param {number} lo @param {number} mid @param {number} hi
   * @param {number | null} L @param {number | null} R
   */
  function combineMax(lo, mid, hi, L, R) {
    // One pass outward from mid reads every cell of the range once.
    let s = 0;
    let bestS = -Infinity;
    let from = mid;
    for (let i = mid; i >= lo; i--) {
      s += a[i];
      reads++;
      if (s > bestS) {
        bestS = s;
        from = i;
      }
    }
    const leftSum = s;
    s = 0;
    let bestP = -Infinity;
    let to = mid + 1;
    for (let j = mid + 1; j <= hi; j++) {
      s += a[j];
      reads++;
      if (s > bestP) {
        bestP = s;
        to = j;
      }
    }
    const C = bestS + bestP;
    const T = leftSum + s;
    /** @type {[number, number]} */
    const suffix = [from, mid];
    /** @type {[number, number]} */
    const prefix = [mid + 1, to];
    const base = { lo, hi, mid, L, R, C, T, suffix, prefix };
    push('measure', [4, 5], base);
    /** @type {Record<string, number | null>} */
    const value = { L, R, C, T };
    let picked = '';
    /** @type {number | null} */
    let result = null;
    for (const p of on) {
      const v = value[TERM[p]];
      if (v !== null && (result === null || v > result)) {
        result = v;
        picked = TERM[p];
      }
    }
    return finish(lo, hi, { ...base, picked }, result, 'combine', [6]);
  }

  /**
   * @param {number} lo @param {number} mid @param {number} hi
   * @param {number | null} L @param {number | null} R
   */
  function combineMajority(lo, mid, hi, L, R) {
    /** @type {[string, number | null][]} */
    const cands = [];
    if (on.includes('left')) cands.push(['L', L]);
    if (on.includes('right')) cands.push(['R', R]);
    const live = cands.filter(([, v]) => v !== null);
    let countL = -1;
    let countR = -1;
    const base = { lo, hi, mid, L, R };
    if (on.includes('count') && live.length > 0) {
      // One pass over the range counts every candidate at once.
      countL = live.some(([n]) => n === 'L') ? 0 : -1;
      countR = live.some(([n]) => n === 'R') ? 0 : -1;
      for (let i = lo; i <= hi; i++) {
        reads++;
        if (countL >= 0 && a[i] === L) countL++;
        if (countR >= 0 && a[i] === R) countR++;
      }
      push('count', [4, 5], { ...base, countL, countR });
    }
    const len = hi - lo + 1;
    for (const [name, v] of live) {
      const c = name === 'L' ? countL : countR;
      if (!on.includes('count') || 2 * c > len) {
        return finish(lo, hi, { ...base, countL, countR, picked: name }, v, 'combine', [4, 5]);
      }
    }
    return finish(lo, hi, { ...base, countL, countR }, null, 'combine', [4, 6]);
  }

  push('start', [0], {});
  const answer = a.length ? solve(0, a.length - 1) : null;
  const expected = a.length ? expectedFor(problem, a, 0, a.length - 1) : null;
  push('done', [0], { result: answer, expected, ok: answer === expected });
  return frames;
}

/**
 * The value the combine returns for the whole array, and the right answer.
 * @param {Problem} problem @param {Part[]} parts @param {number[]} a
 */
export function runCombine(problem, parts, a) {
  const last = /** @type {DcFrame} */ (solveTrace(problem, parts, a).at(-1));
  return { got: last.result, expected: last.expected, ok: last.ok, firstWrong: last.firstWrong };
}

/**
 * @typedef {object} CallRange
 * @property {string} id
 * @property {number} lo
 * @property {number} hi
 * @property {CallRange[]} children  Empty for a one-cell range, else the two halves.
 */

/**
 * Every call range of the split, as a binary tree, so a page can draw calls not made yet.
 * @param {number} n @param {number} [lo] @param {number} [hi]
 * @returns {CallRange | null}
 */
export function callTree(n, lo = 0, hi = n - 1) {
  if (n <= 0 || lo > hi) return null;
  const id = callId(lo, hi);
  if (lo === hi) return { id, lo, hi, children: [] };
  const mid = Math.floor((lo + hi) / 2);
  const left = /** @type {CallRange} */ (callTree(n, lo, mid));
  const right = /** @type {CallRange} */ (callTree(n, mid + 1, hi));
  return { id, lo, hi, children: [left, right] };
}

/**
 * Reads whole numbers separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseValues(text) {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (!parts.every((p) => /^[-−]?\d+$/.test(p))) return { error: 'format' };
  const values = parts.map((p) => Number(p.replace('−', '-')));
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length < MIN_N || values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * A random input: mixed-sign values for maximum subarray, a few small values (often with a
 * majority) for majority element.
 * @param {Problem} problem @param {number} n @param {() => number} [rand]
 */
export function randomValues(problem, n, rand = Math.random) {
  if (problem === 'max-subarray') {
    return Array.from({ length: n }, () => Math.floor(rand() * 41) - 20);
  }
  const hot = Math.floor(rand() * 9) + 1;
  return Array.from({ length: n }, () => (rand() < 0.5 ? hot : Math.floor(rand() * 9) + 1));
}
