/**
 * Step traces for three one-dimensional dynamic programs whose state is a prefix of the
 * input, filled left to right so each cell reads only cells before it.
 *
 * - Climbing stairs (counting): dp[i] = ways to climb i steps taking 1 or 2 at a time.
 *   dp[0] = dp[1] = 1, dp[i] = dp[i − 1] + dp[i − 2].
 * - Coin change (minimising): dp[a] = fewest coins summing to a, ∞ when impossible.
 *   dp[0] = 0, dp[a] = 1 + min over coins c ≤ a of dp[a − c].
 * - House robber (maximising): dp[i] = most money from the first i houses without robbing
 *   two neighbours. dp[0] = 0, dp[1] = h[1], dp[i] = max(dp[i − 1], dp[i − 2] + h[i]).
 *   Houses are numbered from 1, so dp[i] is the prefix of length i.
 */

/** @typedef {'stairs'|'coins'|'robber'} OneDimProblem */

/**
 * @typedef {object} OneDimInput
 * @property {number} n  stairs: the number of steps.
 * @property {number[]} coins  coins: distinct coin values, ascending.
 * @property {number} amount  coins: the amount to make.
 * @property {number[]} houses  robber: h[1..n] stored as houses[0..n − 1].
 */

/**
 * One earlier cell a fill reads, with the value it offers.
 * @typedef {object} OneDimCandidate
 * @property {number} from  The cell read.
 * @property {number} value  What this choice gives dp[cell]: the ways it adds (stairs), or
 *                           the total it offers (coins and robber; Infinity when impossible).
 * @property {'one'|'two'|'coin'|'skip'|'rob'} tag
 * @property {number} coin  coins: the coin value; robber 'rob': h[cell]; else 0.
 */

/**
 * @typedef {object} OneDimFrame
 * @property {'start'|'base'|'fill'|'done'} kind
 * @property {OneDimProblem} problem
 * @property {OneDimInput} input
 * @property {(number|null)[]} dp  null while empty; Infinity is an impossible amount.
 * @property {number} cell  The cell written now, -1 for none.
 * @property {number[]} written  base: the cells the base cases set.
 * @property {OneDimCandidate[]} candidates  fill: the earlier cells read.
 * @property {number} chosen  fill: index of the winning candidate; -1 when they are summed
 *                            (stairs) or none is possible.
 * @property {number[]} path  done: cells on the chain of best choices from the answer back.
 * @property {number[]} picks  done: coins used (coins) or houses robbed (robber).
 * @property {number} lookups  Earlier cells read so far.
 * @property {number} filled  Cells filled so far.
 * @property {number|null} result
 * @property {number[]} lines
 */

export const MAX_STAIRS = 15;
export const MAX_AMOUNT = 20;
export const MAX_COINS = 4;
export const MAX_COIN = 10;
export const MAX_HOUSES = 10;
export const MAX_HOUSE = 50;

export const oneDimPseudocode = {
  stairs: [
    'ways(n):',
    '  dp[0] = 1; dp[1] = 1       // stand still, or one step',
    '  for i = 2 to n:',
    '    dp[i] = dp[i - 1] + dp[i - 2]   // last step was 1 or 2',
    '  return dp[n]',
  ],
  coins: [
    'minCoins(coins, A):',
    '  dp[0] = 0                  // no coins make 0',
    '  for a = 1 to A:',
    '    dp[a] = ∞',
    '    for each coin c ≤ a:',
    '      dp[a] = min(dp[a], dp[a - c] + 1)   // last coin is c',
    '  return dp[A]               // ∞ means impossible',
  ],
  robber: [
    'rob(h[1..n]):',
    '  dp[0] = 0; dp[1] = h[1]    // no houses; one house',
    '  for i = 2 to n:',
    '    dp[i] = max(dp[i - 1],          // skip house i',
    '                dp[i - 2] + h[i])   // rob house i',
    '  return dp[n]',
  ],
};

/** @type {OneDimInput} */
export const DEFAULT_INPUT = { n: 5, coins: [1, 3, 4], amount: 6, houses: [2, 7, 9, 3, 1] };

/**
 * Reads whole numbers separated by commas or spaces, each from `min` to `max`.
 * @param {string} text
 * @param {{min: number, max: number, count: number}} limits
 * @returns {{values: number[]} | {error: 'format'|'count'|'range'}}
 */
export function parseOneDimList(text, { min, max, count }) {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (parts.some((p) => !/^\d+$/.test(p))) return { error: 'format' };
  const values = parts.map(Number);
  if (values.length < 1 || values.length > count) return { error: 'count' };
  if (values.some((v) => v < min || v > max)) return { error: 'range' };
  return { values };
}

/**
 * @param {OneDimProblem} problem
 * @param {OneDimInput} input
 * @returns {OneDimFrame[]}
 */
export function oneDimTrace(problem, input) {
  const inp = {
    n: input.n,
    coins: [...new Set(input.coins)].sort((a, b) => a - b),
    amount: input.amount,
    houses: input.houses.slice(),
  };
  const last = problem === 'stairs' ? inp.n : problem === 'coins' ? inp.amount : inp.houses.length;
  /** @type {(number|null)[]} */
  const dp = Array(last + 1).fill(null);
  /** @type {number[]} */
  const choice = Array(last + 1).fill(-1);
  /** @type {OneDimFrame[]} */
  const frames = [];
  let lookups = 0;
  let filled = 0;
  const L = { stairs: [2, 3], coins: [2, 3, 4, 5], robber: [2, 3, 4] }[problem];
  const doneLine = { stairs: 4, coins: 6, robber: 5 }[problem];

  /** @param {Pick<OneDimFrame, 'kind'|'lines'> & Partial<OneDimFrame>} f */
  const push = (f) =>
    frames.push({
      cell: -1,
      chosen: -1,
      result: null,
      ...f,
      written: (f.written ?? []).slice(),
      candidates: (f.candidates ?? []).map((c) => ({ ...c })),
      path: (f.path ?? []).slice(),
      picks: (f.picks ?? []).slice(),
      lines: f.lines.slice(),
      problem,
      input: { ...inp, coins: inp.coins.slice(), houses: inp.houses.slice() },
      dp: dp.slice(),
      lookups,
      filled,
    });

  push({ kind: 'start', lines: [] });

  /** @type {number[]} */
  const base = [0];
  if (problem === 'stairs') {
    dp[0] = 1;
    if (last >= 1) {
      dp[1] = 1;
      base.push(1);
    }
  } else if (problem === 'coins') {
    dp[0] = 0;
  } else {
    dp[0] = 0;
    if (last >= 1) {
      dp[1] = inp.houses[0];
      base.push(1);
    }
  }
  filled += base.length;
  push({ kind: 'base', lines: [0, 1], written: base, cell: base.at(-1) });

  for (let i = base.length; i <= last; i++) {
    /** @type {OneDimCandidate[]} */
    let candidates;
    let chosen = -1;
    /** @type {number} */
    let value;
    const at = (/** @type {number} */ k) => /** @type {number} */ (dp[k]);
    if (problem === 'stairs') {
      candidates = [
        { from: i - 1, value: at(i - 1), tag: 'one', coin: 0 },
        { from: i - 2, value: at(i - 2), tag: 'two', coin: 0 },
      ];
      value = at(i - 1) + at(i - 2);
    } else if (problem === 'coins') {
      candidates = inp.coins
        .filter((c) => c <= i)
        .map((c) => ({ from: i - c, value: at(i - c) + 1, tag: 'coin', coin: c }));
      value = Infinity;
      candidates.forEach((c, k) => {
        if (c.value < value) {
          value = c.value;
          chosen = k;
        }
      });
    } else {
      const h = inp.houses[i - 1];
      candidates = [
        { from: i - 1, value: at(i - 1), tag: 'skip', coin: 0 },
        { from: i - 2, value: at(i - 2) + h, tag: 'rob', coin: h },
      ];
      chosen = candidates[1].value > candidates[0].value ? 1 : 0;
      value = candidates[chosen].value;
    }
    lookups += candidates.length;
    dp[i] = value;
    choice[i] = chosen;
    filled++;
    const lines = problem === 'coins' && candidates.length === 0 ? [2, 3] : L;
    push({ kind: 'fill', lines, cell: i, candidates, chosen });
  }

  /** @type {number[]} */
  const path = [];
  /** @type {number[]} */
  const picks = [];
  if (problem === 'coins' && dp[last] !== Infinity) {
    for (let a = last; a > 0;) {
      const c = inp.coins.filter((x) => x <= a)[choice[a]];
      path.push(a);
      picks.push(c);
      a -= c;
    }
    path.push(0);
  } else if (problem === 'robber') {
    let i = last;
    while (i > 1) {
      path.push(i);
      if (choice[i] === 1) {
        picks.unshift(i);
        i -= 2;
      } else i -= 1;
    }
    if (i === 1) {
      path.push(1);
      if (inp.houses[0] > 0) picks.unshift(1);
    }
    path.push(0);
  }
  push({ kind: 'done', lines: [doneLine], cell: last, result: dp[last], path, picks });
  return frames;
}
