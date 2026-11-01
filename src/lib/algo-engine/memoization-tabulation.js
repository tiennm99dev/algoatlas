/**
 * Step traces for three ways to compute the Fibonacci number fib(n), with fib(0) = 0 and
 * fib(1) = 1. Plain recursion solves the same subproblem again and again; memoization
 * (top-down) keeps the same recursion but stores each answer in a table the first time and
 * looks it up afterwards; tabulation (bottom-up) drops the recursion and fills the table
 * from the base cases upwards. Every frame snapshots the call tree, the table and how many
 * times each fib(k) was worked out.
 */

/** @typedef {'plain'|'memo'|'table'} FibMode */

/**
 * One node of the call tree.
 * @typedef {object} FibCall
 * @property {number} id  Call number, in call order.
 * @property {number} n
 * @property {number|null} parent  Id of the caller; null for the first call.
 * @property {number|null} result  Null until the call returns.
 * @property {boolean} cached  True when the call returned a stored answer without working.
 */

/**
 * @typedef {object} FibFrame
 * @property {'start'|'call'|'base'|'hit'|'return'|'fill'|'done'} kind
 * @property {FibMode} mode
 * @property {number} n  The argument of the first call.
 * @property {FibCall[]} calls  Every call made so far, in call order (empty for tabulation).
 * @property {number[]} stack  Ids of the calls waiting or running, first call first.
 * @property {number} current  Id of the running call, -1 when none runs.
 * @property {(number|null)[]} table  memo[k] or dp[k]; null while empty. Plain recursion
 *                                    stores nothing, so its table stays empty.
 * @property {number[]} computed  How many times fib(k) was worked out (not looked up).
 * @property {number} cell  The table cell written or looked up now, -1 for none.
 * @property {number[]} reads  Table cells read to compute `cell`.
 * @property {number} k  The argument this step is about (call, base, hit, return, fill).
 * @property {number|null} value  The value returned or written.
 * @property {number|null} a  return/fill: fib(k − 1).
 * @property {number|null} b  return/fill: fib(k − 2).
 * @property {number} callCount
 * @property {number} additions
 * @property {number} hits  Answers looked up in the table instead of recomputed.
 * @property {number|null} result  done: fib(n).
 * @property {number[]} lines
 */

/** Largest n, so plain recursion stays under 400 frames (fib(8) makes 67 calls). */
export const MAX_N = 8;

export const fibPseudocode = {
  plain: [
    'fib(n):',
    '  if n <= 1:',
    '    return n                 // base cases',
    '  return fib(n - 1) + fib(n - 2)',
  ],
  memo: [
    'fib(n):',
    '  if memo[n] is set:',
    '    return memo[n]           // reuse a stored answer',
    '  if n <= 1: memo[n] = n     // base cases',
    '  else: memo[n] = fib(n - 1) + fib(n - 2)',
    '  return memo[n]',
  ],
  table: [
    'fib(n):',
    '  dp = table of cells 0..n',
    '  dp[0] = 0; if n >= 1: dp[1] = 1   // base cases',
    '  for i = 2 to n:',
    '    dp[i] = dp[i - 1] + dp[i - 2]',
    '  return dp[n]',
  ],
};

/**
 * @param {FibMode} mode
 * @param {number} n  An integer from 0 to MAX_N.
 * @returns {FibFrame[]}
 */
export function fibTrace(mode, n) {
  /** @type {FibFrame[]} */
  const frames = [];
  /** @type {FibCall[]} */
  const calls = [];
  /** @type {number[]} */
  const stack = [];
  /** @type {(number|null)[]} */
  const table = Array(n + 1).fill(null);
  const computed = Array(n + 1).fill(0);
  let callCount = 0;
  let additions = 0;
  let hits = 0;

  /** @param {Pick<FibFrame, 'kind'|'lines'> & Partial<FibFrame>} f */
  const push = (f) =>
    frames.push({
      cell: -1,
      reads: [],
      k: -1,
      value: null,
      a: null,
      b: null,
      result: null,
      ...f,
      lines: f.lines.slice(),
      mode,
      n,
      calls: calls.map((c) => ({ ...c })),
      stack: stack.slice(),
      current: stack.at(-1) ?? -1,
      table: table.slice(),
      computed: computed.slice(),
      callCount,
      additions,
      hits,
    });

  push({ kind: 'start', lines: [] });

  if (mode === 'table') {
    table[0] = 0;
    computed[0]++;
    if (n >= 1) {
      table[1] = 1;
      computed[1]++;
    }
    push({ kind: 'base', lines: [0, 1, 2], cell: Math.min(n, 1), k: Math.min(n, 1) });
    for (let i = 2; i <= n; i++) {
      const a = /** @type {number} */ (table[i - 1]);
      const b = /** @type {number} */ (table[i - 2]);
      table[i] = a + b;
      computed[i]++;
      additions++;
      push({
        kind: 'fill',
        lines: [3, 4],
        cell: i,
        reads: [i - 1, i - 2],
        k: i,
        value: a + b,
        a,
        b,
      });
    }
    push({ kind: 'done', lines: [5], cell: n, k: n, result: table[n] });
    return frames;
  }

  const memo = mode === 'memo';
  const p = memo
    ? { call: [0, 1], hit: [1, 2], base: [3, 5], ret: [4, 5] }
    : { call: [0, 1], hit: [], base: [1, 2], ret: [3] };

  /**
   * @param {number} k
   * @param {number|null} parent
   * @returns {number}
   */
  function fib(k, parent) {
    /** @type {FibCall} */
    const rec = { id: calls.length, n: k, parent, result: null, cached: false };
    calls.push(rec);
    stack.push(rec.id);
    callCount++;
    push({ kind: 'call', lines: p.call, k });

    const stored = memo ? table[k] : null;
    if (stored !== null) {
      hits++;
      rec.result = stored;
      rec.cached = true;
      push({ kind: 'hit', lines: p.hit, k, cell: k, value: stored });
      stack.pop();
      return stored;
    }
    if (k <= 1) {
      rec.result = k;
      computed[k]++;
      if (memo) table[k] = k;
      push({ kind: 'base', lines: p.base, k, cell: memo ? k : -1, value: k });
      stack.pop();
      return k;
    }
    const a = fib(k - 1, rec.id);
    const b = fib(k - 2, rec.id);
    rec.result = a + b;
    computed[k]++;
    additions++;
    if (memo) table[k] = a + b;
    push({
      kind: 'return',
      lines: p.ret,
      k,
      cell: memo ? k : -1,
      reads: memo ? [k - 1, k - 2] : [],
      value: a + b,
      a,
      b,
    });
    stack.pop();
    return a + b;
  }

  const result = fib(n, null);
  push({ kind: 'done', lines: [], k: n, result });
  return frames;
}
