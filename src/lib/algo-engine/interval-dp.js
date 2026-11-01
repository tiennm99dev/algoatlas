/**
 * Step traces for two interval dynamic programs. Cell (i, j), with 1-based i ≤ j, answers the
 * problem for the stretch i..j of the input, and the table fills by length: every interval
 * of length len reads only shorter intervals, split at some k into i..k and k + 1..j.
 *
 * - Matrix chain: A[i] has shape p[i−1] × p[i]. m[i][j] is the fewest scalar multiplications
 *   for A[i]..A[j]. A split after A[k] costs m[i][k] + m[k+1][j] + p[i−1]·p[k]·p[j]. The first
 *   smallest k wins a tie.
 * - Rod cutting: a rod of n units sells by a price list p[1..n]. r[i][j] is the most money for
 *   the piece made of units i..j: sold whole, p[j − i + 1], or cut after unit k, r[i][k] +
 *   r[k+1][j]. Selling whole wins a tie, then the first k. Since only the length matters, the
 *   cells of one length all hold the same value, which is why rod cutting also fits in a row.
 *
 * s[i][j] stores the best split, 0 for a piece sold whole; it rebuilds the answer top-down.
 */

/** @typedef {'matrix'|'rod'} IntervalProblem */

/**
 * @typedef {object} IntervalFrame
 * @property {'start'|'base'|'length'|'open'|'try'|'settle'|'trace'|'done'} kind
 * @property {IntervalProblem} problem
 * @property {number[]} input  Matrix dimensions p[0..n], or prices p[1..n].
 * @property {number} n  Matrices in the chain, or units in the rod.
 * @property {(number|null)[][]} table  n × n, cell (i, j) at [i − 1][j − 1]; null if not filled.
 * @property {(number|null)[][]} splits  n × n, the best k so far, 0 for sold whole.
 * @property {number} len  Current interval length, 0 for none.
 * @property {number} i  Current interval start, 1-based, 0 for none.
 * @property {number} j  Current interval end, 1-based, 0 for none.
 * @property {number} k  try, settle, trace: the split, 0 for sold whole or none.
 * @property {number} left  try, settle: the value of i..k.
 * @property {number} right  try, settle: the value of k + 1..j.
 * @property {number} cost  try: what this split offers; open: the rod's whole price.
 * @property {number|null} best  The best value before this split; settle: the final value.
 * @property {boolean} improved  try: this split beat the best.
 * @property {[number, number][]} path  Intervals visited by the rebuild, as (i, j).
 * @property {string} order  The rebuilt matrix order; rod: the piece lengths joined by +.
 * @property {number} tried  Splits tried so far.
 * @property {number} filled  Intervals finished so far.
 * @property {number|null} result
 * @property {number[]} lines
 */

export const MAX_MATRICES = 7;
export const MAX_DIM = 100;
export const MAX_ROD = 8;
export const MAX_PRICE = 99;

export const INTERVAL_PRESETS = {
  /** @type {{key: string, input: number[]}[]} */
  matrix: [
    { key: 'three', input: [10, 100, 5, 50] },
    { key: 'four', input: [40, 20, 30, 10, 30] },
    { key: 'six', input: [30, 35, 15, 5, 10, 20, 25] },
  ],
  /** @type {{key: string, input: number[]}[]} */
  rod: [
    { key: 'four', input: [1, 5, 8, 9] },
    { key: 'eight', input: [1, 5, 8, 9, 10, 17, 17, 20] },
    { key: 'whole', input: [1, 2, 9] },
  ],
};

/** @type {Record<IntervalProblem, string[]>} */
export const intervalPseudocode = {
  matrix: [
    'chain(p[0..n]):          // A[i] is p[i-1] × p[i]',
    '  m[i][i] = 0 for every i        // one matrix, no work',
    '  for len = 2 to n:',
    '    for i = 1 to n-len+1:  j = i+len-1',
    '      m[i][j] = ∞',
    '      for k = i to j-1:          // split after A[k]',
    '        cost = m[i][k] + m[k+1][j] + p[i-1]·p[k]·p[j]',
    '        if cost < m[i][j]: m[i][j] = cost; s[i][j] = k',
    '  read the order from s[1][n], top-down',
  ],
  rod: [
    'rod(p[1..n]):            // r[i][j]: best for units i..j',
    '  r[i][i] = p[1] for every i     // one unit, no cut',
    '  for len = 2 to n:',
    '    for i = 1 to n-len+1:  j = i+len-1',
    '      r[i][j] = p[len]; s[i][j] = 0   // sell it whole',
    '      for k = i to j-1:          // cut after unit k',
    '        value = r[i][k] + r[k+1][j]',
    '        if value > r[i][j]: r[i][j] = value; s[i][j] = k',
    '  read the cuts from s[1][n], top-down',
  ],
};

/**
 * Reads matrix dimensions (2 to MAX_MATRICES + 1 numbers) or prices (1 to MAX_ROD numbers).
 * @param {IntervalProblem} problem
 * @param {string} text
 * @returns {{input: number[]} | {error: 'format'|'count'|'range'}}
 */
export function parseInput(problem, text) {
  const parts = text
    .split(/[,;×x\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const [lo, hi] = problem === 'matrix' ? [2, MAX_MATRICES + 1] : [1, MAX_ROD];
  if (parts.length < lo || parts.length > hi) return { error: 'count' };
  if (!parts.every((p) => /^\d+$/.test(p))) return { error: 'format' };
  const input = parts.map(Number);
  const bad =
    problem === 'matrix'
      ? input.some((d) => d < 1 || d > MAX_DIM)
      : input.some((d) => d > MAX_PRICE);
  return bad ? { error: 'range' } : { input };
}

/** Scalar multiplications of the most expensive order, for comparison. @param {number[]} dims */
export function worstOrderCost(dims) {
  const n = dims.length - 1;
  const worst = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
  for (let len = 2; len <= n; len++)
    for (let i = 1; i + len - 1 <= n; i++) {
      const j = i + len - 1;
      for (let k = i; k < j; k++)
        worst[i][j] = Math.max(
          worst[i][j],
          worst[i][k] + worst[k + 1][j] + dims[i - 1] * dims[k] * dims[j],
        );
    }
  return worst[1][n];
}

/**
 * How many different answers brute force would compare: the Catalan number C(n − 1) of
 * parenthesisations, or the 2^(n − 1) ways to cut a rod of n units.
 * @param {IntervalProblem} problem
 * @param {number} n
 */
export function orderCount(problem, n) {
  if (problem === 'rod') return 2 ** (n - 1);
  let c = 1;
  for (let k = 0; k < n - 1; k++) c = (c * 2 * (2 * k + 1)) / (k + 2);
  return Math.round(c);
}

/**
 * @param {IntervalProblem} problem
 * @param {number[]} input
 * @returns {IntervalFrame[]}
 */
export function intervalTrace(problem, input) {
  const matrix = problem === 'matrix';
  const n = matrix ? input.length - 1 : input.length;
  /** @type {(number|null)[][]} */
  const table = Array.from({ length: n }, () => Array(n).fill(null));
  /** @type {(number|null)[][]} */
  const splits = Array.from({ length: n }, () => Array(n).fill(null));
  /** @type {IntervalFrame[]} */
  const frames = [];
  /** @type {[number, number][]} */
  const path = [];
  const revealed = new Set();
  let tried = 0;
  let filled = 0;
  let order = '';

  /** @param {number} i @param {number} j */
  const val = (i, j) => /** @type {number} */ (table[i - 1][j - 1]);
  /** @param {number} i @param {number} j */
  const split = (i, j) => /** @type {number} */ (splits[i - 1][j - 1]);

  /** @param {Pick<IntervalFrame, 'kind'|'lines'> & Partial<IntervalFrame>} f */
  const push = (f) =>
    frames.push({
      len: 0,
      i: 0,
      j: 0,
      k: 0,
      left: 0,
      right: 0,
      cost: 0,
      best: null,
      improved: false,
      result: null,
      ...f,
      lines: f.lines.slice(),
      problem,
      input: input.slice(),
      n,
      table: table.map((r) => r.slice()),
      splits: splits.map((r) => r.slice()),
      path: path.map((p) => /** @type {[number, number]} */ ([p[0], p[1]])),
      order,
      tried,
      filled,
    });

  /** The matrix order, with intervals not reached yet as A[i]..A[j]. */
  /** @param {number} i @param {number} j @returns {string} */
  function matrixOrder(i, j) {
    if (i === j) return `A${i}`;
    if (!revealed.has(`${i}-${j}`)) return `A${i}..A${j}`;
    const k = split(i, j);
    return `(${matrixOrder(i, k)} ${matrixOrder(k + 1, j)})`;
  }

  /** The rod's piece lengths, left to right, as far as the rebuild has reached. */
  /** @param {number} i @param {number} j @returns {number[]} */
  function rodPieces(i, j) {
    const k = i === j ? 0 : split(i, j);
    if (!k || !revealed.has(`${i}-${j}`)) return [j - i + 1];
    return [...rodPieces(i, k), ...rodPieces(k + 1, j)];
  }

  const describeOrder = () =>
    n === 0 ? '' : matrix ? matrixOrder(1, n) : rodPieces(1, n).join(' + ');

  push({ kind: 'start', lines: [0] });

  for (let i = 1; i <= n; i++) {
    table[i - 1][i - 1] = matrix ? 0 : input[0];
    splits[i - 1][i - 1] = 0;
    filled++;
  }
  push({ kind: 'base', lines: [1], len: 1 });

  for (let len = 2; len <= n; len++) {
    push({ kind: 'length', lines: [2], len });
    for (let i = 1; i + len - 1 <= n; i++) {
      const j = i + len - 1;
      if (!matrix) {
        table[i - 1][j - 1] = input[len - 1];
        splits[i - 1][j - 1] = 0;
      }
      push({
        kind: 'open',
        lines: [3, 4],
        len,
        i,
        j,
        cost: matrix ? 0 : input[len - 1],
      });
      for (let k = i; k < j; k++) {
        const left = val(i, k);
        const right = val(k + 1, j);
        const cost = matrix ? left + right + input[i - 1] * input[k] * input[j] : left + right;
        const best = table[i - 1][j - 1];
        const improved = best === null || (matrix ? cost < best : cost > best);
        tried++;
        if (improved) {
          table[i - 1][j - 1] = cost;
          splits[i - 1][j - 1] = k;
        }
        push({
          kind: 'try',
          lines: improved ? [5, 6, 7] : [5, 6],
          len,
          i,
          j,
          k,
          left,
          right,
          cost,
          best,
          improved,
        });
      }
      filled++;
      const k = split(i, j);
      push({
        kind: 'settle',
        lines: [3],
        len,
        i,
        j,
        k,
        left: k ? val(i, k) : 0,
        right: k ? val(k + 1, j) : 0,
        best: val(i, j),
      });
    }
  }

  order = describeOrder();
  const result = n > 0 ? val(1, n) : 0;

  /** @param {number} i @param {number} j */
  function rebuild(i, j) {
    if (i === j) return;
    const k = split(i, j);
    revealed.add(`${i}-${j}`);
    path.push([i, j]);
    order = describeOrder();
    push({ kind: 'trace', lines: [8], len: j - i + 1, i, j, k });
    if (k) {
      rebuild(i, k);
      rebuild(k + 1, j);
    }
  }
  rebuild(1, n);

  push({ kind: 'done', lines: [8], result });
  return frames;
}
