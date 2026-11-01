/**
 * Step traces that walk through the six SRTBOT steps of designing a dynamic program
 * (Subproblems, Relate, Topological order, Base cases, Original problem, Time) on two
 * problems, then evaluate the design on the learner's numbers.
 *
 * - Bowling: pins in a row with values v[0..n−1]. Each throw skips a pin, hits one pin for
 *   v[i] points, or hits two neighbours for v[i]·v[i+1]; every pin is hit at most once.
 *   Suffix subproblems B(i) = best score on pins i..n−1, filled from i = n down to 0.
 * - Maximum subarray: the largest sum of a non-empty run a[i..j]. Subproblems
 *   x(i) = largest sum of a run that ends at index i, filled from i = 0 up; the original
 *   problem is the largest x(i), not a single subproblem.
 */

/** @typedef {'bowling'|'maxsub'} SrtbotProblem */
/** @typedef {'subproblems'|'relate'|'topo'|'base'|'original'|'time'} SrtbotStep */

/**
 * One option the relation compares for a subproblem.
 * @typedef {object} SrtbotOption
 * @property {'skip'|'one'|'pair'|'fresh'|'extend'} kind
 * @property {number} value  The option's total.
 * @property {number[]} uses  Subproblem indices it reads.
 */

/**
 * @typedef {object} SrtbotFrame
 * @property {'start'|'subproblems'|'relation'|'order'|'base'|'compute'|'original'|'done'} kind
 * @property {SrtbotStep|null} step  The SRTBOT step this frame shows.
 * @property {SrtbotProblem} problem
 * @property {number[]} values  The input.
 * @property {(number|null)[]} table  Subproblem values; null while not computed.
 * @property {number} cell  The subproblem computed now, -1 for none.
 * @property {SrtbotOption[]} options  compute: the options compared, best first chosen.
 * @property {number} chosen  compute: index into `options` of the winner.
 * @property {number[]} order  The topological order of the subproblem indices.
 * @property {number[]} answerCells  original/done: the cells the answer is read from.
 * @property {number|null} answer
 * @property {number} filled  Subproblems computed so far, base cases included.
 * @property {number} work  Options compared so far.
 * @property {number[]} lines
 */

export const MAX_N = 10;
export const MAX_ABS = 9;

export const srtbotPseudocode = {
  bowling: [
    'bowling(v[0..n-1]):',
    '  B = table of cells 0..n      // S: B(i) = best on pins i..n-1',
    '  B[n] = 0                     // B: no pins left',
    '  for i = n - 1 down to 0:     // T: B(i) needs larger i only',
    '    B[i] = max(B[i+1],           // R: skip pin i',
    '               v[i] + B[i+1])    //    or hit it alone',
    '    if i + 1 < n:',
    '      B[i] = max(B[i], v[i]·v[i+1] + B[i+2])  // R: hit a pair',
    '  return B[0]                  // O: all the pins',
  ],
  maxsub: [
    'maxSubarray(a[0..n-1]):',
    '  x = table of cells 0..n-1    // S: x(i) = best run ending at i',
    '  x[0] = a[0]                  // B: a run of one',
    '  for i = 1 to n - 1:          // T: x(i) needs x(i-1)',
    '    x[i] = max(a[i],             // R: start a new run at i',
    '               a[i] + x[i-1])    //    or extend the best run',
    '  return max(x[0..n-1])        // O: best over every end',
  ],
};

/** Presets: the bowling row from MIT 6.006 and a classic maximum-subarray array. */
export const SRTBOT_PRESETS = {
  bowling: [-1, 1, 1, 1, 9, 9, 3, -3, -5, 2],
  maxsub: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
};

/**
 * Reads whole numbers separated by commas or spaces.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'count'|'range'}}
 */
export function parseSrtbotValues(text) {
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

/**
 * @param {SrtbotProblem} problem
 * @param {number[]} values  1 to MAX_N whole numbers.
 * @returns {SrtbotFrame[]}
 */
export function srtbotTrace(problem, values) {
  const v = values.slice();
  const n = v.length;
  const bowling = problem === 'bowling';
  const size = bowling ? n + 1 : n;
  /** @type {(number|null)[]} */
  const table = Array(size).fill(null);
  const order = bowling
    ? Array.from({ length: size }, (_, i) => n - i)
    : Array.from({ length: size }, (_, i) => i);
  /** @type {SrtbotFrame[]} */
  const frames = [];
  let filled = 0;
  let work = 0;

  /** @param {Pick<SrtbotFrame, 'kind'|'step'|'lines'> & Partial<SrtbotFrame>} f */
  const push = (f) =>
    frames.push({
      cell: -1,
      chosen: -1,
      answer: null,
      ...f,
      options: (f.options ?? []).map((o) => ({ ...o, uses: o.uses.slice() })),
      answerCells: (f.answerCells ?? []).slice(),
      lines: f.lines.slice(),
      problem,
      values: v.slice(),
      table: table.slice(),
      order: order.slice(),
      filled,
      work,
    });

  push({ kind: 'start', step: null, lines: [] });
  push({ kind: 'subproblems', step: 'subproblems', lines: [0, 1] });
  push({ kind: 'relation', step: 'relate', lines: bowling ? [4, 5, 6, 7] : [4, 5] });
  push({ kind: 'order', step: 'topo', lines: [3] });

  const baseCell = bowling ? n : 0;
  table[baseCell] = bowling ? 0 : v[0];
  filled++;
  push({ kind: 'base', step: 'base', lines: [2], cell: baseCell });

  for (const i of order.slice(1)) {
    /** @type {SrtbotOption[]} */
    let options;
    if (bowling) {
      const next = /** @type {number} */ (table[i + 1]);
      options = [
        { kind: 'skip', value: next, uses: [i + 1] },
        { kind: 'one', value: v[i] + next, uses: [i + 1] },
      ];
      if (i + 1 < n)
        options.push({
          kind: 'pair',
          value: v[i] * v[i + 1] + /** @type {number} */ (table[i + 2]),
          uses: [i + 2],
        });
    } else {
      const prev = /** @type {number} */ (table[i - 1]);
      options = [
        { kind: 'fresh', value: v[i], uses: [] },
        { kind: 'extend', value: v[i] + prev, uses: [i - 1] },
      ];
    }
    work += options.length;
    let chosen = 0;
    options.forEach((o, k) => {
      if (o.value > options[chosen].value) chosen = k;
    });
    table[i] = options[chosen].value;
    filled++;
    const lines = bowling ? (i + 1 < n ? [3, 4, 5, 6, 7] : [3, 4, 5, 6]) : [3, 4, 5];
    push({ kind: 'compute', step: 'relate', lines, cell: i, options, chosen });
  }

  const nums = /** @type {number[]} */ (table);
  let answerCells;
  let answer;
  if (bowling) {
    answerCells = [0];
    answer = nums[0];
  } else {
    answer = Math.max(...nums);
    answerCells = [nums.indexOf(answer)];
  }
  const last = bowling ? 8 : 6;
  push({ kind: 'original', step: 'original', lines: [last], answerCells, answer });
  push({ kind: 'done', step: 'time', lines: [last], answerCells, answer });
  return frames;
}
