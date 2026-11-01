/**
 * A state designer for one-dimensional dynamic programs. The learner declares what dp[i] means,
 * builds a recurrence out of terms, picks the base value and how the answer is read, and the
 * design runs on small inputs. Each cell is checked against a brute-force value for the
 * declared meaning, and the answer against a brute-force value for the problem, so a design
 * can fail in two separate ways: a cell breaks the promise of the state, or the cells all keep
 * it and the state still does not answer the question.
 *
 * Inputs are 1-based, a[1..n]. dp[0] is the base and is not checked. A term that reads off
 * the table, or whose condition fails, offers nothing. A sum of nothing is 0, and a max or min
 * of nothing leaves the cell empty.
 *
 * - Maximum subarray: the largest sum of a non-empty run of neighbouring values.
 * - Cheapest climb: start on the ground below step 1, climb 1 or 2 steps at a time, pay a[i]
 *   for each step stood on, and finish on step n.
 * - Decode ways: digits map to letters by 1 → A .. 26 → Z. Count the ways to read the string
 *   as letters; a leading 0 is not a letter, so 06 is not 6.
 */

export const MIN_N = 1;
export const MAX_N = 10;
export const MAX_ABS = 99;

/** @typedef {'max-subarray'|'climb'|'decode'} Problem */
/** @typedef {'a'|'prev-a'|'prev2-a'|'prev'|'prev2'|'prev-if'|'prev2-if'} Term */
/** @typedef {'max'|'min'|'sum'} Combine */
/** @typedef {'last'|'largest'|'smallest'} AnswerRead */
/** @typedef {'ending'|'within'|'on-step'|'every'|'prefix'|'single'} StateId */

/**
 * @typedef {object} Design
 * @property {StateId} state
 * @property {Combine} combine
 * @property {Term[]} terms
 * @property {number} base
 * @property {AnswerRead} answer
 */

export const PROBLEMS = /** @type {Problem[]} */ (['max-subarray', 'climb', 'decode']);
export const COMBINES = /** @type {Combine[]} */ (['max', 'min', 'sum']);
export const BASES = [0, 1];
export const ANSWERS = /** @type {AnswerRead[]} */ (['last', 'largest', 'smallest']);

/** The meanings on offer, the useful one first. */
/** @type {Record<Problem, StateId[]>} */
export const STATES = {
  'max-subarray': ['ending', 'within'],
  climb: ['on-step', 'every'],
  decode: ['prefix', 'single'],
};

/** @type {Record<Problem, Term[]>} */
export const TERMS = {
  'max-subarray': ['a', 'prev-a', 'prev', 'prev2-a'],
  climb: ['a', 'prev-a', 'prev2-a', 'prev'],
  decode: ['prev', 'prev-if', 'prev2', 'prev2-if'],
};

/** A design that solves each problem. */
/** @type {Record<Problem, Design>} */
export const CORRECT = {
  'max-subarray': {
    state: 'ending',
    combine: 'max',
    terms: ['a', 'prev-a'],
    base: 0,
    answer: 'largest',
  },
  climb: {
    state: 'on-step',
    combine: 'min',
    terms: ['prev-a', 'prev2-a'],
    base: 0,
    answer: 'last',
  },
  decode: {
    state: 'prefix',
    combine: 'sum',
    terms: ['prev-if', 'prev2-if'],
    base: 1,
    answer: 'last',
  },
};

/** Each problem opens one idea short of working, so the first run shows a bug. */
/** @type {Record<Problem, Design>} */
export const STARTERS = {
  'max-subarray': { state: 'within', combine: 'max', terms: ['prev-a'], base: 0, answer: 'last' },
  climb: { state: 'on-step', combine: 'min', terms: ['prev-a'], base: 0, answer: 'last' },
  decode: { state: 'prefix', combine: 'sum', terms: ['prev', 'prev2'], base: 0, answer: 'last' },
};

/** Small inputs each design is tested on. */
/** @type {Record<Problem, number[][]>} */
export const SAMPLES = {
  'max-subarray': [
    [-2, 1, -3, 4, -1, 2, 1, -5, 4],
    [1, 2, 3],
    [-3, -1, -2],
    [5, -9, 6, -2, 3],
    [2, -1, 2, -5, 4],
  ],
  climb: [[10, 15, 20], [1, 100, 1, 1, 1, 100, 1, 1, 100, 1], [5], [3, 2, 4, 1], [1, 1, 1, 1]],
  decode: [
    [2, 2, 6],
    [1, 2],
    [0, 6],
    [1, 1, 1, 0, 6],
    [1, 0, 0],
  ],
};

/** @type {Record<Term, string>} */
const TERM_CODE = {
  a: 'a[i]',
  'prev-a': 'dp[i-1] + a[i]',
  'prev2-a': 'dp[i-2] + a[i]',
  prev: 'dp[i-1]',
  prev2: 'dp[i-2]',
  'prev-if': '(dp[i-1] if a[i] ≠ 0)',
  'prev2-if': '(dp[i-2] if a[i-1]a[i] is 10..26)',
};

/**
 * Keeps the terms of this problem, once each, in their listed order.
 * @param {Problem} problem @param {Term[]} terms
 */
export function normalizeTerms(problem, terms) {
  return TERMS[problem].filter((t) => terms.includes(t));
}

/**
 * The learner's code. Line indices are the same for every design, so frames can name lines.
 * @param {Problem} problem @param {Design} design
 * @returns {string[]}
 */
export function designPseudocode(problem, design) {
  const parts = normalizeTerms(problem, design.terms).map((t) => TERM_CODE[t]);
  let body = 'nothing';
  if (parts.length) {
    body = design.combine === 'sum' ? parts.join(' + ') : `${design.combine}(${parts.join(', ')})`;
  }
  const read = {
    last: 'return dp[n]',
    largest: 'return max(dp[1..n])',
    smallest: 'return min(dp[1..n])',
  };
  return [
    'solve(a[1..n]):',
    `  dp[0] = ${design.base}`,
    '  for i = 1 to n:',
    `    dp[i] = ${body}`,
    `  ${read[design.answer]}`,
  ];
}

/**
 * What one term offers at cell i, or null when it offers nothing.
 * @param {Term} term @param {number} i @param {number[]} a  1-based values at a[i − 1]
 * @param {(number|null)[]} dp
 * @returns {number|null}
 */
function offer(term, i, a, dp) {
  const here = a[i - 1];
  const before = i >= 1 ? dp[i - 1] : null;
  const before2 = i >= 2 ? dp[i - 2] : null;
  const plus = (/** @type {number|null} */ v) => (v === null ? null : v + here);
  switch (term) {
    case 'a':
      return here;
    case 'prev-a':
      return plus(before);
    case 'prev2-a':
      return plus(before2);
    case 'prev':
      return before;
    case 'prev2':
      return before2;
    case 'prev-if':
      return here !== 0 ? before : null;
    case 'prev2-if': {
      if (i < 2) return null;
      const pair = a[i - 2] * 10 + here;
      return pair >= 10 && pair <= 26 ? before2 : null;
    }
  }
}

/**
 * Every way to read the first i digits as letters, by trying each one.
 * @param {number[]} digits
 * @param {number} i
 * @returns {number}
 */
function decodings(digits, i) {
  if (i === 0) return 1;
  let ways = 0;
  if (digits[i - 1] !== 0) ways += decodings(digits, i - 1);
  if (i >= 2) {
    const pair = digits[i - 2] * 10 + digits[i - 1];
    if (pair >= 10 && pair <= 26) ways += decodings(digits, i - 2);
  }
  return ways;
}

/**
 * The cheapest total of any climb that ends standing on step i, by trying each one.
 * @param {number[]} costs
 * @param {number} i
 * @returns {number}
 */
function cheapestClimb(costs, i) {
  if (i === 0) return 0;
  const one = cheapestClimb(costs, i - 1);
  const two = i >= 2 ? cheapestClimb(costs, i - 2) : Infinity;
  return costs[i - 1] + Math.min(one, two);
}

/**
 * The value cell i should hold under a declared meaning, by brute force.
 * @param {StateId} state
 * @param {number[]} a
 * @param {number} i  From 1 to n.
 * @returns {number}
 */
export function truthOf(state, a, i) {
  switch (state) {
    case 'ending': {
      let best = -Infinity;
      let sum = 0;
      for (let l = i - 1; l >= 0; l--) {
        sum += a[l];
        best = Math.max(best, sum);
      }
      return best;
    }
    case 'within': {
      let best = -Infinity;
      for (let l = 0; l < i; l++) {
        let sum = 0;
        for (let r = l; r < i; r++) {
          sum += a[r];
          best = Math.max(best, sum);
        }
      }
      return best;
    }
    case 'on-step':
      return cheapestClimb(a, i);
    case 'every':
      return a.slice(0, i).reduce((s, v) => s + v, 0);
    case 'prefix':
      return decodings(a, i);
    case 'single':
      return a[i - 1] !== 0 ? decodings(a, i - 1) : 0;
  }
}

/**
 * The right answer to the problem itself, by brute force.
 * @param {Problem} problem @param {number[]} a
 */
export function expectedAnswer(problem, a) {
  if (problem === 'max-subarray') return truthOf('within', a, a.length);
  if (problem === 'climb') return cheapestClimb(a, a.length);
  return decodings(a, a.length);
}

/**
 * @typedef {object} CellOption
 * @property {Term} term
 * @property {number|null} value  null when the term offers nothing here.
 *
 * @typedef {object} DesignFrame
 * @property {'start'|'base'|'cell'|'answer'|'done'} kind
 * @property {Problem} problem
 * @property {number[]} a
 * @property {(number|null)[]} dp  dp[0..n]; null while not filled, or left empty.
 * @property {(number|null)[]} truth  Brute-force value per cell, null while not reached.
 * @property {(boolean|null)[]} right  Per cell: whether dp matches the truth, null if unchecked.
 * @property {number} i  Current cell, -1 for none.
 * @property {CellOption[]} options  cell: what each chosen term offers.
 * @property {Term|null} winner  cell: for max and min, the first term offering the result.
 * @property {number|null} value  cell: the cell's new value.
 * @property {number|null} got  answer, done: the answer the design returns.
 * @property {number} expected  The right answer to the problem.
 * @property {boolean} answerOk  answer, done: got equals expected.
 * @property {number} wrong  Wrong cells so far.
 * @property {number} reads  Cell values read so far.
 * @property {number[]} lines
 */

/**
 * Runs a design once on an input.
 * @param {Problem} problem @param {Design} design @param {number[]} a
 * @returns {DesignFrame[]}
 */
export function designTrace(problem, design, a) {
  const n = a.length;
  const terms = normalizeTerms(problem, design.terms);
  const expected = expectedAnswer(problem, a);
  /** @type {(number|null)[]} */
  const dp = Array(n + 1).fill(null);
  /** @type {(number|null)[]} */
  const truth = Array(n + 1).fill(null);
  /** @type {(boolean|null)[]} */
  const right = Array(n + 1).fill(null);
  /** @type {DesignFrame[]} */
  const frames = [];
  let wrong = 0;
  let reads = 0;
  /** @type {number|null} */
  let got = null;
  let answerOk = false;

  /** @param {Pick<DesignFrame, 'kind'|'lines'> & Partial<DesignFrame>} f */
  const push = (f) =>
    frames.push({
      i: -1,
      winner: null,
      value: null,
      ...f,
      options: (f.options ?? []).map((o) => ({ ...o })),
      lines: f.lines.slice(),
      problem,
      a: a.slice(),
      dp: dp.slice(),
      truth: truth.slice(),
      right: right.slice(),
      got,
      expected,
      answerOk,
      wrong,
      reads,
    });

  push({ kind: 'start', lines: [0] });
  dp[0] = design.base;
  push({ kind: 'base', lines: [1] });

  for (let i = 1; i <= n; i++) {
    const options = terms.map((term) => ({ term, value: offer(term, i, a, dp) }));
    const usable = options.filter((o) => o.value !== null);
    const values = usable.map((o) => /** @type {number} */ (o.value));
    reads += usable.filter((o) => o.term !== 'a').length;
    /** @type {number|null} */
    let value = null;
    if (design.combine === 'sum') value = values.reduce((s, v) => s + v, 0);
    else if (values.length)
      value = design.combine === 'max' ? Math.max(...values) : Math.min(...values);
    dp[i] = value;
    truth[i] = truthOf(design.state, a, i);
    right[i] = value === truth[i];
    if (!right[i]) wrong++;
    const winner =
      design.combine === 'sum' ? null : (usable.find((o) => o.value === value)?.term ?? null);
    push({ kind: 'cell', lines: [2, 3], i, options, winner, value });
  }

  const cells = /** @type {number[]} */ (dp.slice(1).filter((v) => v !== null));
  if (design.answer === 'last') got = dp[n];
  else if (cells.length)
    got = design.answer === 'largest' ? Math.max(...cells) : Math.min(...cells);
  answerOk = got === expected;
  push({ kind: 'answer', lines: [4] });
  push({ kind: 'done', lines: [4] });
  return frames;
}

/**
 * The verdict of a design on one input, without keeping the frames.
 * @param {Problem} problem @param {Design} design @param {number[]} a
 */
export function runDesign(problem, design, a) {
  const last = /** @type {DesignFrame} */ (designTrace(problem, design, a).at(-1));
  return {
    got: last.got,
    expected: last.expected,
    answerOk: last.answerOk,
    cellsOk: last.wrong === 0,
    wrong: last.wrong,
    ok: last.answerOk && last.wrong === 0,
  };
}

/**
 * Reads the input: whole numbers, or for decode a run of digits.
 * @param {Problem} problem @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'count'|'range'}}
 */
export function parseValues(problem, text) {
  if (problem === 'decode') {
    const digits = text.replace(/[\s,]/g, '');
    if (!/^\d*$/.test(digits)) return { error: 'format' };
    if (digits.length < MIN_N || digits.length > MAX_N) return { error: 'count' };
    return { values: [...digits].map(Number) };
  }
  const parts = text
    .replace(/[−–—]/g, '-')
    .split(/[,;\s]+/)
    .filter(Boolean);
  if (parts.length < MIN_N || parts.length > MAX_N) return { error: 'count' };
  if (!parts.every((p) => /^-?\d+$/.test(p))) return { error: 'format' };
  const values = parts.map(Number);
  const low = problem === 'climb' ? 1 : -MAX_ABS;
  if (values.some((v) => v < low || v > MAX_ABS)) return { error: 'range' };
  return { values };
}

/**
 * @param {Problem} problem @param {number} n @param {() => number} [rand]
 * @returns {number[]}
 */
export function randomValues(problem, n, rand = Math.random) {
  return Array.from({ length: n }, () => {
    if (problem === 'decode')
      return Math.floor(rand() * 4) === 0 ? Math.floor(rand() * 10) : 1 + Math.floor(rand() * 2);
    if (problem === 'climb') return 1 + Math.floor(rand() * 20);
    return Math.floor(rand() * 21) - 10;
  });
}
