/** @typedef {import('$lib/algo-engine/greedy-exchange-argument.js').ChangeFrame} ChangeFrame */

/** @param {number} x @param {string} word */
const plural = (x, word) => `${x} ${word}${x === 1 ? '' : 's'}`;

/**
 * A payment as a sum, largest coin first: 4 + 1 + 1.
 * @param {number[]} coins @param {number[]} taken
 */
function sum(coins, taken) {
  const parts = coins.flatMap((c, k) => Array(taken[k]).fill(c));
  return parts.length ? parts.join(' + ') : 'no coins';
}

export const en = {
  slug: 'greedy-exchange-argument',
  topic: 'greedy',
  level: 'Beginner',
  title: 'Greedy choice and exchange arguments',
  intro:
    'A greedy algorithm builds its answer one choice at a time and never takes a choice back: at every step it picks what looks best right now. Paying an amount with the fewest coins by always taking the largest coin that fits is the classic example. It is fast and simple, but it is only correct when the problem has the greedy-choice property, and an exchange argument is how you prove it.',
  summary:
    'Step through greedy change-making, compare it with the true fewest coins, and search for amounts where the greedy choice fails.',
  instruction:
    'Pick a coin set or type your own, set the amount, then step. The panel on the right shows the fewest coins possible. Press “Step through the smallest one” to load an amount where greedy loses.',
  coinsLabel: 'Coins',
  amountLabel: 'Amount',
  presetLabel: 'Coin set',
  presetPlaceholder: 'Load a coin set…',
  presets: {
    tricky: '1, 3, 4',
    us: 'US coins: 1, 5, 10, 25',
    vnd: 'Vietnamese notes (×1,000 ₫)',
    sevenTen: '1, 7, 10',
    noOne: 'No 1 coin: 3, 5',
  },
  errors: {
    format: 'Type whole coin values separated by commas or spaces. The last valid coins are back.',
    range: 'Keep every coin between 1 and 100. The last valid coins are back.',
    count: 'Use at most 8 different coins. The last valid coins are back.',
  },
  amountError: 'The amount must be a whole number from 1 to 200. The last valid amount is back.',
  newCoinsNotice: 'New coin set loaded.',
  /** @param {number} x */
  counterNotice: (x) => `Amount ${x} loaded: the smallest one where greedy is not optimal.`,
  /** @param {number[]} coins @param {number} rest */
  coinsAria: (coins, rest) => `Coins: ${coins.join(', ')}. Still to pay: ${rest}.`,
  /** @param {number} coin @param {number} taken @param {string} state */
  coinLabel: (coin, taken, state) =>
    `Coin ${coin}${state ? `, ${state}` : ''}${taken ? `, taken ${taken} times` : ''}`,
  coinPointer: 'c',
  legend: {
    trying: 'Coin tried now',
    taken: 'Taken at least once',
    skipped: 'Too big for what is left',
  },
  markers: { trying: '?', taken: '×q', skipped: '✗' },
  /** @param {number} q */
  takenMark: (q) => `×${q}`,
  stats: {
    rest: 'Still to pay',
    greedy: 'Greedy coins',
    best: 'Fewest coins',
    verdict: 'Verdict',
  },
  none: '—',
  verdicts: {
    optimal: 'Greedy is optimal',
    worse: 'Greedy uses too many coins',
    stuck: 'Greedy is stuck',
    impossible: 'No payment exists',
    pending: 'Still running',
  },
  greedyTitle: 'Greedy payment so far',
  bestTitle: 'A fewest-coin payment (dynamic programming)',
  emptyPay: 'no coins yet',
  noPay: 'this amount cannot be paid',
  counterTitle: 'Counterexample search',
  /** @param {number} n @param {number} limit */
  counterSummary: (n, limit) =>
    n === 0
      ? `Greedy is optimal for every amount from 1 to ${limit} with these coins.`
      : `Greedy is not optimal for ${plural(n, 'amount')} from 1 to ${limit}.`,
  /** @param {{amount: number, greedy: number, best: number, stuck: boolean}} c */
  counterChip: (c) =>
    c.stuck ? `${c.amount}: stuck, best ${c.best}` : `${c.amount}: ${c.greedy} vs ${c.best}`,
  counterChipsTitle: 'Amount: greedy coins vs fewest',
  counterEmpty: 'no counterexample',
  smallest: 'Step through the smallest one',
  practiceTitle: 'Check yourself',
  /** @param {ChangeFrame} f */
  describe(f) {
    const c = f.at >= 0 ? f.coins[f.at] : 0;
    switch (f.kind) {
      case 'start':
        return `Pay ${f.amount} with as few coins as possible from ${f.coins.join(', ')}. The greedy rule: always take the largest coin that still fits.`;
      case 'sort':
        return `Sort the coins from largest to smallest: ${f.coins.join(', ')}.`;
      case 'try':
        return `Coin ${c}: ⌊${f.rest} / ${c}⌋ = ${f.q}, so ${f.q === 0 ? 'it does not fit' : `${plural(f.q, 'coin')} of ${c} fit`}.`;
      case 'take':
        return `Take ${f.q} × ${c}. ${f.rest === 0 ? 'Nothing is left to pay.' : `${f.rest} is left to pay.`}`;
      case 'skip':
        return f.rest === 0
          ? `Skip ${c}: the amount is already paid.`
          : `Skip ${c}: it is larger than the ${f.rest} still to pay.`;
      case 'fail':
        return `Every coin has been tried and ${f.rest} is still unpaid: greedy is stuck, because no coin is small enough.`;
      case 'done': {
        const paid = sum(f.coins, f.taken);
        const best = sum(f.coins, f.bestTaken);
        switch (f.verdict) {
          case 'optimal':
            return `Greedy paid ${f.amount} = ${paid}, ${plural(f.count, 'coin')}, and no payment uses fewer. Correct on this amount, but that does not prove it is correct on every amount: try the counterexample search.`;
          case 'worse':
            return `Greedy paid ${f.amount} = ${paid}, ${plural(f.count, 'coin')}, but ${best} uses only ${f.best}. At some step the largest coin that fit was the wrong choice, so this coin set lacks the greedy-choice property.`;
          case 'stuck':
            return `Greedy got stuck with ${f.rest} unpaid, yet ${f.amount} = ${best} works with ${plural(f.best, 'coin')}. Taking the largest coin first was the wrong choice.`;
          case 'impossible':
            return `No combination of these coins pays ${f.amount}, so neither greedy nor any other method can.`;
          default:
            return '';
        }
      }
    }
  },
  takeaways: [
    'A greedy algorithm makes the locally best choice, commits to it and solves what is left. It never backtracks, so it is usually fast: change-making with k coins sorted takes k divisions.',
    'Greedy is correct when the problem has the greedy-choice property (some optimal solution starts with the greedy choice) and optimal substructure (what is left is a smaller copy of the same problem).',
    'An exchange argument proves the greedy-choice property: take any optimal solution that does not start with the greedy choice, swap a part of it for the greedy choice, and show the result is still feasible and no worse. For 1, 5, 10, 25 an optimal payment never holds five 1s, two 5s, three 10s, or two 10s and a 5, so whenever x ≥ 25 a 25 must be in it.',
    'One counterexample is enough to show greedy fails. With 1, 3, 4 greedy pays 6 = 4 + 1 + 1, three coins, while 3 + 3 uses two; with 3, 5 it gets stuck on 9 although 3 + 3 + 3 works. Then dynamic programming finds the true minimum.',
    'Load “1, 7, 10” and step through the smallest counterexample, then load the Vietnamese notes: the search finds no amount up to 200 where greedy loses. With a 1 coin, the smallest counterexample, when one exists, is always below the sum of the two largest coins, so a short search settles the question.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    [
      'Greedy change, coins sorted',
      'O(k) time',
      'One division ⌊x / c⌋ per coin, whatever the amount.',
    ],
    ['Sorting the coins', 'O(k log k)', 'Done once, before the loop.'],
    [
      'Fewest coins by dynamic programming',
      'O(k · x) time, O(x) memory',
      'Every amount 1..x tries every coin as its last coin.',
    ],
    [
      'Counterexample search up to L',
      'O(k · L)',
      'One DP table for 1..L, and one greedy run of O(k) per amount.',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'With coins 1, 3 and 4, how many coins does greedy use to pay 6?',
      answer: 3,
      unit: 'coins',
      hints: ['Greedy takes the largest coin that fits first: 4.', 'After 4, there is 2 left.'],
      solution:
        'Greedy takes 4, then 3 does not fit the 2 left, so it takes 1 + 1: 4 + 1 + 1 is 3 coins. The best payment 3 + 3 uses only 2.',
    },
    {
      type: 'number',
      prompt: 'What is the smallest amount where greedy is not optimal for coins 1, 7 and 10?',
      answer: 14,
      hints: [
        'Look for an amount that two 7s pay exactly.',
        'Load “1, 7, 10” and read the first chip of the counterexample search.',
      ],
      solution:
        'Every amount up to 13 is paid optimally, but 14 = 10 + 1 + 1 + 1 + 1 takes greedy 5 coins while 7 + 7 takes 2.',
    },
    {
      type: 'choice',
      prompt: 'For which coin set is greedy change-making optimal for every amount?',
      options: ['1, 3, 4', '1, 5, 6, 9', '1, 5, 10, 25', '1, 7, 10'],
      answer: 2,
      hints: [
        'Three of the sets have a small counterexample: try 6, 11 and 14.',
        'Run the counterexample search on each set.',
      ],
      solution:
        '1, 5, 10, 25 is canonical: an exchange argument shows an optimal payment never needs more small coins than the greedy one. 1, 3, 4 fails at 6, 1, 5, 6, 9 at 11 (9 + 1 + 1 against 6 + 5) and 1, 7, 10 at 14.',
    },
    {
      type: 'choice',
      prompt: 'What does greedy do when it pays 9 with coins 3 and 5?',
      options: [
        'Pays 3 + 3 + 3',
        'Pays 5 + 3 and is stuck with 1 unpaid',
        'Pays 5 + 5 and goes over',
        'Reports that 9 cannot be paid, which is true',
      ],
      answer: 1,
      hints: ['Greedy takes ⌊9 / 5⌋ fives first.', 'Then it takes ⌊4 / 3⌋ threes.'],
      solution:
        'Greedy takes one 5 and one 3, then 1 is left and no coin fits. 9 can be paid, as 3 + 3 + 3, so the greedy choice of 5 was a mistake it cannot undo.',
    },
    {
      type: 'order',
      prompt: 'Put the steps of an exchange argument in order.',
      items: [
        'Conclude that some optimal solution makes the greedy choice',
        'Take any optimal solution that does not make the greedy choice',
        'Show the new solution is still feasible and no worse',
        'Swap one of its parts for the greedy choice',
      ],
      answer: [1, 3, 2, 0],
      hints: [
        'You start from a solution you know is optimal.',
        'The swap comes before you check that nothing got worse.',
      ],
      solution:
        'Start from an arbitrary optimal solution, exchange a part of it for the greedy choice, check that the result is feasible and costs no more, and conclude that an optimal solution exists that starts greedily.',
    },
  ],
  nextTeaser:
    'Next up: Interval scheduling, where picking the meeting that finishes earliest fits the most meetings into one room.',
};
