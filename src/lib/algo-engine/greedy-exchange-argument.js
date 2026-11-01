/**
 * Greedy change-making: pay an amount x with as few coins as possible by always taking the
 * largest coin that still fits. The trace runs the greedy rule once, coin by coin from the
 * largest, and compares its coin count with the true minimum from a dynamic-programming table.
 * Some coin systems (1, 5, 10, 25) are canonical, so greedy is always optimal; others (1, 3, 4)
 * are not, and greedy also gets stuck on systems without a 1 coin (3, 5 cannot pay 4 even though
 * 3 + 3 + 3 pays 9).
 */

export const MAX_COINS = 8;
export const MAX_COIN = 100;
export const MAX_AMOUNT = 200;
/** Amounts 1..SCAN_LIMIT are searched for counterexamples. */
export const SCAN_LIMIT = 200;

/**
 * @typedef {'optimal' | 'worse' | 'stuck' | 'impossible'} Verdict
 * `optimal`: greedy used the fewest coins; `worse`: it paid with more coins than needed;
 * `stuck`: it could not pay although some coins can; `impossible`: no coins can pay x.
 */

/**
 * @typedef {object} ChangeFrame
 * @property {'start'|'sort'|'try'|'take'|'skip'|'fail'|'done'} kind
 * @property {number[]} coins  Denominations, largest first.
 * @property {number} amount  The amount to pay.
 * @property {number} at  Index of the coin considered, -1 outside the loop.
 * @property {number} rest  What is still unpaid.
 * @property {number} q  On 'try', 'take' and 'skip': ⌊rest / coin⌋ before taking.
 * @property {number[]} taken  Coins of each denomination taken so far.
 * @property {number} count  Coins taken so far.
 * @property {number} divisions  Divisions ⌊x / c⌋ made so far, one per coin tried.
 * @property {number} best  Fewest coins that pay the amount, -1 when none can.
 * @property {number[]} bestTaken  One fewest-coin payment, per denomination; zeros when none.
 * @property {Verdict | ''} verdict  Set on 'done'.
 * @property {number[]} lines
 */

export const changePseudocode = [
  'greedyChange(coins, x):',
  '  sort coins from largest to smallest',
  '  for each coin c:',
  '    q = ⌊x / c⌋  // as many c coins as fit',
  '    if q > 0: take q coins of c; x = x − q·c',
  '  if x > 0: report “no change”  // greedy is stuck',
  '  return the coins taken',
];

/**
 * Reads distinct whole coin values 1..MAX_COIN, separated by commas or spaces. Repeats are
 * dropped and the coins come back largest first.
 * @param {string} text
 * @returns {{coins: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseCoins(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < 1 || v > MAX_COIN)) return { error: 'range' };
  const coins = [...new Set(values)].sort((a, b) => b - a);
  if (coins.length > MAX_COINS) return { error: 'count' };
  return { coins };
}

/**
 * Fewest coins for every amount 0..limit: `count[v]` (Infinity when v cannot be paid) and
 * `last[v]`, the index of a coin used in one best payment of v.
 * @param {number[]} coins
 * @param {number} limit
 */
export function fewestCoinsTable(coins, limit) {
  const count = Array.from({ length: limit + 1 }, (_, v) => (v === 0 ? 0 : Infinity));
  const last = Array(limit + 1).fill(-1);
  for (let v = 1; v <= limit; v++) {
    coins.forEach((c, k) => {
      if (c <= v && count[v - c] + 1 < count[v]) {
        count[v] = count[v - c] + 1;
        last[v] = k;
      }
    });
  }
  return { count, last };
}

/**
 * One fewest-coin payment of x, per denomination, or null when x cannot be paid.
 * @param {number[]} coins  Largest first.
 * @param {number} x
 * @returns {{count: number, taken: number[]} | null}
 */
export function fewestCoins(coins, x) {
  const { count, last } = fewestCoinsTable(coins, x);
  if (count[x] === Infinity) return null;
  const taken = coins.map(() => 0);
  for (let v = x; v > 0; v -= coins[last[v]]) taken[last[v]]++;
  return { count: count[x], taken };
}

/**
 * The greedy rule without frames: coins per denomination and what is left unpaid.
 * @param {number[]} coins  Largest first.
 * @param {number} x
 */
export function greedyCoins(coins, x) {
  let rest = x;
  const taken = coins.map((c) => {
    const q = Math.floor(rest / c);
    rest -= q * c;
    return q;
  });
  return { taken, rest, count: taken.reduce((s, q) => s + q, 0) };
}

/**
 * @param {number[]} coins  Largest first.
 * @param {number} x
 * @returns {Verdict}
 */
export function verdictOf(coins, x) {
  const g = greedyCoins(coins, x);
  const best = fewestCoins(coins, x);
  if (!best) return 'impossible';
  if (g.rest > 0) return 'stuck';
  return g.count === best.count ? 'optimal' : 'worse';
}

/**
 * Amounts 1..limit where greedy is not optimal (it uses more coins than needed or gets stuck
 * while some payment exists), each with the greedy and the best coin counts.
 * @param {number[]} coins  Largest first.
 * @param {number} [limit]
 * @returns {{amount: number, greedy: number, best: number, stuck: boolean}[]}
 */
export function counterexamples(coins, limit = SCAN_LIMIT) {
  const { count } = fewestCoinsTable(coins, limit);
  /** @type {{amount: number, greedy: number, best: number, stuck: boolean}[]} */
  const found = [];
  for (let x = 1; x <= limit; x++) {
    if (count[x] === Infinity) continue;
    const g = greedyCoins(coins, x);
    if (g.rest > 0 || g.count > count[x]) {
      found.push({ amount: x, greedy: g.count, best: count[x], stuck: g.rest > 0 });
    }
  }
  return found;
}

/**
 * @param {number[]} input  Distinct coins in any order.
 * @param {number} amount  1..MAX_AMOUNT
 * @returns {ChangeFrame[]}
 */
export function changeTrace(input, amount) {
  const coins = input.slice().sort((a, b) => b - a);
  const best = fewestCoins(coins, amount);
  /** @type {ChangeFrame[]} */
  const frames = [];
  const taken = coins.map(() => 0);
  let rest = amount;
  let count = 0;
  let divisions = 0;

  /** @param {Pick<ChangeFrame, 'kind'|'lines'> & Partial<ChangeFrame>} f */
  const push = (f) =>
    frames.push({
      at: -1,
      q: 0,
      verdict: '',
      ...f,
      coins: f.kind === 'start' ? input.slice() : coins.slice(),
      amount,
      rest,
      taken: taken.slice(),
      count,
      divisions,
      best: best ? best.count : -1,
      bestTaken: best ? best.taken.slice() : coins.map(() => 0),
    });

  push({ kind: 'start', lines: [0] });
  push({ kind: 'sort', lines: [1] });
  for (let at = 0; at < coins.length; at++) {
    const q = Math.floor(rest / coins[at]);
    divisions++;
    push({ kind: 'try', lines: [2, 3], at, q });
    if (q > 0) {
      taken[at] += q;
      count += q;
      rest -= q * coins[at];
      push({ kind: 'take', lines: [4], at, q });
    } else {
      push({ kind: 'skip', lines: [4], at, q });
    }
  }
  if (rest > 0) push({ kind: 'fail', lines: [5] });
  /** @type {Verdict} */
  let verdict = 'optimal';
  if (!best) verdict = 'impossible';
  else if (rest > 0) verdict = 'stuck';
  else if (count > best.count) verdict = 'worse';
  push({ kind: 'done', lines: rest > 0 ? [5] : [6], verdict });
  return frames;
}
