/** @typedef {import('$lib/algo-engine/dp-one-dimensional.js').OneDimFrame} OneDimFrame */
/** @typedef {import('$lib/algo-engine/dp-one-dimensional.js').OneDimProblem} OneDimProblem */
/** @typedef {import('$lib/algo-engine/dp-one-dimensional.js').OneDimCandidate} OneDimCandidate */

/** @param {number|null} v */
const show = (v) => (v === null ? '' : v === Infinity ? '∞' : String(v));
/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** @param {string[]} items */
const list = (items) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

export const en = {
  slug: 'dp-one-dimensional',
  topic: 'dynamic-programming',
  level: 'Beginner',
  title: '1D DP: climbing stairs, coin change, house robber',
  intro:
    'Many dynamic programs need only a row of cells: dp[i] answers the problem for a prefix of the input, the first i steps, the amount i or the first i houses. Each cell is built from a few cells to its left, so filling the row left to right always has what it needs. The same row can count (how many ways) or optimise (fewest coins, most money); only the way the cells are combined changes.',
  summary:
    'Fill a row of DP cells left to right for climbing stairs, coin change and house robber, with arrows to the cells each one reads.',
  instruction:
    'Pick a problem, edit its input and step: the arrows show which earlier cells the current one reads, and the bold ✓ arrow is the choice that wins. At the last step the chain of winning choices shows which coins or houses make the answer.',
  problemLabel: 'Problem',
  problems: { stairs: 'Climbing stairs', coins: 'Coin change', robber: 'House robber' },
  stepsLabel: 'Steps n',
  coinsLabel: 'Coins',
  amountLabel: 'Amount',
  housesLabel: 'Houses',
  /** @param {OneDimProblem} p */
  problemText: (p) =>
    ({
      stairs:
        'Count the ways to climb n steps when each move climbs 1 or 2 steps. dp[i] = ways to reach step i.',
      coins:
        'Make the amount with as few coins as possible; every coin can be used any number of times. dp[a] = fewest coins that sum to a.',
      robber:
        'Rob houses along a street for the most money, but never two neighbours. dp[i] = most money from houses 1 to i.',
    })[p],
  errors: {
    /** @param {number} max */
    steps: (max) => `n must be a whole number from 0 to ${max}.`,
    /** @param {number} max */
    amount: (max) => `The amount must be a whole number from 0 to ${max}.`,
    /** @param {number} count @param {number} max */
    coins: (count, max) => `Type 1 to ${count} coin values from 1 to ${max}, for example 1, 3, 4.`,
    /** @param {number} count @param {number} max */
    houses: (count, max) =>
      `Type 1 to ${count} house values from 0 to ${max}, for example 2, 7, 9, 3, 1.`,
  },
  rowTitle: 'DP row',
  /** @param {OneDimProblem} p @param {number} filled @param {number} size */
  rowAria: (p, filled, size) =>
    `DP row for ${{ stairs: 'climbing stairs', coins: 'coin change', robber: 'house robber' }[p]}: ${filled} of ${size} cells filled.`,
  /** @param {OneDimProblem} p @param {number} i @param {number|null} v @param {string} state */
  cellLabel: (p, i, v, state) =>
    `dp[${i}]${p === 'robber' && i > 0 ? ` (house ${i})` : ''}: ${v === null ? 'empty' : v === Infinity ? 'impossible' : v}${state ? `, ${state}` : ''}`,
  houseRow: 'h',
  cellStates: {
    current: 'filled now',
    read: 'read now',
    chosen: 'read by the winning choice',
    base: 'base case',
    answer: 'the answer',
    path: 'on the best chain',
  },
  legend: {
    current: 'Filled now',
    read: 'Read now',
    chosen: 'Winning choice',
    path: 'Chain of best choices',
    answer: 'The answer',
  },
  markers: { current: '●', read: '○', chosen: '✓', path: '◆', answer: '★' },
  /** @param {OneDimProblem} p @param {OneDimCandidate} c */
  arcLabel: (p, c) =>
    p === 'stairs'
      ? c.tag === 'one'
        ? '+1'
        : '+2'
      : p === 'coins'
        ? `coin ${c.coin}`
        : c.tag === 'skip'
          ? 'skip'
          : `rob ${c.coin}`,
  infinity: '∞',
  stats: {
    filled: 'Cells filled',
    lookups: 'Cells read',
    result: 'Answer',
  },
  resultPending: '…',
  picksTitle: { coins: 'Coins used', robber: 'Houses robbed' },
  picksEmpty: 'Shown at the last step.',
  picksNone: 'None.',
  /** @param {OneDimProblem} p @param {number} k */
  pickLabel: (p, k) => (p === 'coins' ? String(k) : `house ${k}`),
  /** @param {OneDimFrame} f */
  describe(f) {
    const p = f.problem;
    switch (f.kind) {
      case 'start':
        return {
          stairs: `Count the ways to climb ${plural(f.input.n, 'step', 'steps')}. The row has a cell per step, dp[0] to dp[${f.input.n}].`,
          coins: `Make ${f.input.amount} from the coins ${list(f.input.coins.map(String))} with as few coins as possible. The row has a cell per amount, dp[0] to dp[${f.input.amount}].`,
          robber: `Rob ${plural(f.input.houses.length, 'house', 'houses')} for the most money without robbing two neighbours. dp[i] is the best from the first i houses.`,
        }[p];
      case 'base':
        return {
          stairs:
            f.written.length > 1
              ? 'Base cases: dp[0] = 1, the one way to climb nothing, and dp[1] = 1, a single step.'
              : 'Base case: dp[0] = 1, the one way to climb nothing.',
          coins: 'Base case: dp[0] = 0. No coins make the amount 0.',
          robber: `Base cases: dp[0] = 0 with no houses, and dp[1] = h[1] = ${f.input.houses[0]}: with one house, rob it.`,
        }[p];
      case 'fill': {
        const i = f.cell;
        const v = show(f.dp[i]);
        const c = f.candidates;
        if (p === 'stairs')
          return `The last move to step ${i} climbed 1 step (from ${i - 1}) or 2 (from ${i - 2}). Count both: dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${c[0].value} + ${c[1].value} = ${v}.`;
        if (p === 'coins') {
          if (c.length === 0)
            return `No coin is ${i} or less, so dp[${i}] = ∞: ${i} cannot be made.`;
          const tries = c.map((x) => `coin ${x.coin} → dp[${x.from}] + 1 = ${show(x.value)}`);
          return f.chosen < 0
            ? `Try each coin as the last one: ${tries.join('; ')}. All are impossible, so dp[${i}] = ∞.`
            : `Try each coin as the last one: ${tries.join('; ')}. The fewest is ${v}, with coin ${c[f.chosen].coin} last.`;
        }
        const h = f.input.houses[i - 1];
        return `House ${i}: skip it and keep dp[${i - 1}] = ${c[0].value}, or rob it for ${h} + dp[${i - 2}] = ${c[1].value}. ${f.chosen === 1 ? 'Rob it' : 'Skip it'}: dp[${i}] = ${v}.`;
      }
      case 'done': {
        const r = show(f.result);
        if (p === 'stairs')
          return `There are ${r} ways to climb ${plural(f.input.n, 'step', 'steps')}, after ${plural(f.lookups, 'cell read', 'cells read')}. Counting adds the choices instead of picking one.`;
        if (p === 'coins')
          return f.result === Infinity
            ? `dp[${f.input.amount}] = ∞: these coins cannot make ${f.input.amount}.`
            : `${f.input.amount} needs ${plural(/** @type {number} */ (f.result), 'coin', 'coins')}: ${f.picks.join(' + ')}. Following the winning choice back from dp[${f.input.amount}] gives the coins.`;
        return f.picks.length
          ? `The most is ${r}, robbing ${list(f.picks.map((k) => `house ${k}`))}. Following the winning choice back from dp[${f.input.houses.length}] gives the houses.`
          : `The most is ${r}: every house is empty.`;
      }
    }
  },
  takeaways: [
    'State as a prefix: dp[i] answers the problem for the first i steps, the amount i or the first i houses, so n + 1 cells cover every subproblem.',
    'Transition from smaller states: each cell reads only cells to its left, so filling left to right is a valid order.',
    'Counting combines the choices with +, as climbing stairs does; optimising picks the best with min or max, as coin change and house robber do.',
    'Remember which choice won in each cell, and you can walk back from the answer to rebuild the coins or houses, not just the number.',
    'Try coins 1, 3, 4 and amount 6: greedy takes 4 + 1 + 1, but the row finds 3 + 3. Then change the coins to 2, 5 and the amount to 3.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    ['Climbing stairs, time', 'O(n)', 'n + 1 cells, each reading 2 earlier cells.'],
    ['Coin change, time', 'O(A · k)', 'A + 1 cells for amount A, each trying up to k coins.'],
    ['House robber, time', 'O(n)', 'n + 1 cells, each comparing skip and rob.'],
    [
      'Memory',
      'O(n), or O(1)',
      'The row has n + 1 cells; stairs and robber read only the last two, so two variables are enough. Coin change needs the last max(coin) cells.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'In how many ways can you climb 6 steps, taking 1 or 2 steps at a time?',
      answer: 13,
      unit: 'ways',
      hints: [
        'Pick Climbing stairs, set n = 6 and step to the end.',
        'dp[i] = dp[i − 1] + dp[i − 2], starting 1, 1.',
      ],
      solution: 'dp = 1, 1, 2, 3, 5, 8, 13, so there are 13 ways.',
    },
    {
      type: 'number',
      prompt: 'With coins 1, 3 and 4, what is the fewest number of coins that make 6?',
      answer: 2,
      unit: 'coins',
      hints: [
        'Pick Coin change with the default input and step to the end.',
        'Greedy takes the largest coin first. Is 4 + 1 + 1 the best?',
      ],
      solution:
        'dp = 0, 1, 2, 1, 1, 2, 2. dp[6] = 1 + min(dp[5], dp[3], dp[2]) = 1 + 1 = 2, with 3 + 3. Greedy would use 3 coins.',
    },
    {
      type: 'number',
      prompt: 'How many earlier cells does coin change read in all for coins 1, 3, 4 and amount 6?',
      answer: 13,
      unit: 'cells',
      hints: ['Read “Cells read” at the last step, or count the coins that fit each amount.'],
      solution:
        'Amounts 1 and 2 fit one coin each, amount 3 fits two, and amounts 4, 5 and 6 fit all three: 1 + 1 + 2 + 3 + 3 + 3 = 13.',
    },
    {
      type: 'number',
      prompt:
        'What is the most a robber can take from houses 2, 7, 9, 3, 1 without robbing neighbours?',
      answer: 12,
      hints: ['Pick House robber with the default input.'],
      solution: 'dp = 0, 2, 7, 11, 11, 12. The best is 12, robbing houses 1, 3 and 5 (2 + 9 + 1).',
    },
    {
      type: 'choice',
      prompt: 'Which of the three problems counts rather than optimises?',
      options: ['Climbing stairs', 'Coin change', 'House robber'],
      answer: 0,
      hints: ['Which recurrence uses + between the choices instead of min or max?'],
      solution:
        'Climbing stairs adds the ways through both choices, dp[i − 1] + dp[i − 2]. Coin change takes a minimum and house robber a maximum, keeping only the best choice.',
    },
  ],
  nextTeaser:
    'Next up: longest increasing subsequence, where each cell may read every cell before it, and a clever pile trick cuts the work to O(n log n).',
};
