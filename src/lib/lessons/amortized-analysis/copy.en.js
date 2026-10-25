/** @typedef {import('$lib/algo-engine/amortized-analysis.js').CounterFrame} CounterFrame */
/** @typedef {'aggregate' | 'accounting' | 'potential'} AmortizedMethod */

/** @param {number} k @param {string} word */
const plural = (k, word) => `${k} ${word}${k === 1 ? '' : 's'}`;

/** Bits from the highest down, as written on paper. @param {number[]} bits */
const binary = (bits) => bits.slice().reverse().join('');

/** Whole numbers as they are, others to two decimals. @param {number} x */
const num = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2));

export const en = {
  slug: 'amortized-analysis',
  topic: 'complexity',
  level: 'Advanced',
  title: 'Amortized analysis: aggregate, accounting, potential',
  intro:
    'Some operations are usually cheap but now and then expensive: one increment of a binary counter can flip every bit. Amortized analysis bounds the total cost of a whole sequence of operations, so the rare expensive step is paid for by the many cheap ones. Unlike average-case analysis, it uses no probability: the bound holds for every sequence.',
  summary:
    'Increment a binary counter step by step while credit coins sit on its 1 bits and a potential graph tracks them, and see why m increments cost fewer than 2m flips.',
  instruction:
    'Set the number of bits k and increments m, then step. Each 1 → 0 flip spends the coin on that bit; each 0 → 1 flip costs 1 and leaves a new coin. Switch the method to read the same run as an aggregate count, a credit bank or a potential function.',
  bitsLabel: 'Bits k',
  opsLabel: 'Increments m',
  bitsError: 'k must be a whole number from 2 to 8.',
  opsError: 'm must be a whole number from 1 to 64.',
  methodLegend: 'Method',
  methods: /** @type {Record<AmortizedMethod, string>} */ ({
    aggregate: 'Aggregate',
    accounting: 'Accounting',
    potential: 'Potential',
  }),
  counterTitle: 'Counter A (highest bit on the left)',
  counterAria: 'Bits of the counter, highest bit first',
  pointerI: 'i',
  coin: '¢',
  /** @param {number} bit @param {number} b @param {boolean} coin @param {string} state */
  bitLabel: (bit, b, coin, state) =>
    `Bit ${bit}: ${b}${coin ? ', holds a coin' : ''}${state ? `, ${state}` : ''}`,
  /** @param {number[]} bits @param {number} value */
  valueLine: (bits, value) => `${binary(bits)}₂ = ${value}`,
  legend: {
    coin: 'A 1 bit holding one credit coin',
    reset: 'Just reset 1 → 0 (coin spent)',
    set: 'Just set 0 → 1 (new coin)',
  },
  states: { reset: 'just reset', set: 'just set' },
  chartTitle: 'Cost per increment and potential Φ',
  chartScroller: 'Cost chart, scrolls sideways',
  /** @param {number} done @param {number} m @param {number} total @param {number} phi */
  chartLabel: (done, m, total, phi) =>
    `Bar chart of the actual cost of increments 1 to ${done} of ${m}, total ${total} flips, with a line for the potential Φ, now ${phi}.`,
  chartLegend: {
    cost: 'Actual cost cₜ (flips)',
    now: 'Increment running now',
    phi: 'Potential Φₜ (number of 1s)',
  },
  axisOps: 'Increment t →',
  stats: {
    op: 'Increment',
    opCost: 'Flips this increment',
    total: 'Total flips',
    bound: 'Bound 2t',
    phi: 'Φ (1 bits = coins)',
    worst: 'Worst single increment',
  },
  aggregate: {
    title: 'Aggregate: count each bit’s flips',
    tableAria: 'Flips of each bit so far, next to the formula ⌊t/2ⁱ⌋',
    cols: ['flips', '⌊t/2ⁱ⌋'],
    /** @param {number} i */
    row: (i) => `bit ${i}`,
    /**
     * @param {number} t  Finished increments.
     * @param {number} bound  Σ ⌊t/2ⁱ⌋, the flips of those t increments.
     * @param {number} total  Flips so far, including the increment running now.
     */
    sum: (t, bound, total) => {
      const running =
        total > bound
          ? ` Increment ${t + 1} is running and has made ${plural(total - bound, 'flip')} so far.`
          : '';
      return t === 0
        ? `Bit i flips every 2ⁱ increments, so after t increments it has flipped ⌊t/2ⁱ⌋ times.${running}`
        : `After ${plural(t, 'increment')}: Σ ⌊${t}/2ⁱ⌋ = ${bound} < 2 × ${t} = ${2 * t} flips, an average of ${num(bound / t)} per increment.${running}`;
    },
  },
  accounting: {
    title: 'Accounting: a credit bank',
    rule: 'Charge 2 coins for each increment that sets a bit: 1 pays for the 0 → 1 flip and 1 stays on the new 1 to pay for resetting it later. An overflow charges 0: its resets are all prepaid.',
    charged: 'Charged',
    spent: 'Spent (flips)',
    bank: 'In the bank',
    /** @param {number} charged @param {number} spent @param {number} bank */
    balance: (charged, spent, bank) =>
      `${charged} − ${spent} = ${bank} coins, one on each 1 bit. The bank never goes below 0, so the real cost is at most the ${charged} charged.`,
  },
  potential: {
    title: 'Potential: Φ = number of 1 bits',
    /** @param {CounterFrame} f */
    formula: (f) => {
      if (f.op === 0)
        return 'ĉ = c + ΔΦ: the amortized cost is the actual cost plus the change in Φ.';
      const finished = f.amortized.length === f.op;
      const c = f.opCost;
      const d = f.phi - f.phiBefore;
      return finished
        ? `Increment ${f.op}: ĉ = c + ΔΦ = ${c} + (${f.phi} − ${f.phiBefore}) = ${c + d}.`
        : `Increment ${f.op} so far: c = ${c}, Φ ${f.phiBefore} → ${f.phi}.`;
    },
    /** @param {CounterFrame} f */
    sum: (f) => {
      const done = f.amortized.length;
      if (done === 0) return 'Φ₀ = 0 and Φ is never negative, so Σ c ≤ Σ ĉ.';
      const hat = f.amortized.reduce((s, a) => s + a, 0);
      return `Σ ĉ = ${hat} = Σ c + Φ − Φ₀ = ${f.total} + ${f.phi} − 0. Since Φ ≥ 0, Σ c ≤ ${hat} ≤ 2 × ${done}.`;
    },
  },
  practiceTitle: 'Check yourself',
  /** @param {CounterFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `A ${f.k}-bit counter at ${binary(f.bits)}: no 1s, no coins, Φ = 0. We will run ${plural(f.m, 'increment')}.`;
      case 'call':
        return `Increment ${f.op}: start at bit 0 of ${binary(f.bits)} (value ${f.value}).`;
      case 'reset':
        return `Bit ${f.i} is 1: reset it to 0 and spend its coin. ${plural(f.opCost, 'flip')} so far in this increment.`;
      case 'set':
        return `Bit ${f.i} is 0: set it to 1, paying 1 coin and leaving 1 on it. Increment ${f.op} cost ${plural(f.opCost, 'flip')}, amortized ${f.amortized[f.op - 1]}; the counter reads ${f.value}.`;
      case 'overflow':
        return `All ${f.k} bits were 1: every one was reset with its own coin and the counter wraps to 0. Cost ${f.opCost}, amortized 0, since Φ fell by ${f.k}.`;
      case 'done': {
        const worst = Math.max(...f.costs);
        return `Done: ${plural(f.m, 'increment')} cost ${f.total} flips in total, less than 2m = ${2 * f.m}, though one increment alone cost ${worst}. Each increment is O(1) amortized.`;
      }
    }
  },
  takeaways: [
    'Amortized cost is total cost ÷ number of operations over the worst sequence, with no probability involved: one increment can cost k flips, yet m increments from 0 never cost more than 2m.',
    'Aggregate method: count the total directly. Bit i flips ⌊m/2ⁱ⌋ times, and Σ ⌊m/2ⁱ⌋ < m(1 + ½ + ¼ + …) = 2m.',
    'Accounting method: charge each operation a fixed amount, here 2, and store the surplus as credit on the data; the stored credit must never go negative. Each 1 bit holds the coin that will pay for resetting it.',
    'Potential method: define Φ ≥ 0 with Φ₀ = 0 and charge ĉ = c + ΔΦ. Here Φ = number of 1s gives ĉ = 2 for every increment, and Σ c = Σ ĉ − Φₘ ≤ 2m.',
    'Try k = 4, m = 16 and watch increment 16: an overflow costs 4 flips while the potential line drops from 4 to 0, so its amortized cost is 0.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'One increment, worst case',
      'Θ(k)',
      'It can flip all k bits: 0111…1 → 1000…0, or an overflow.',
    ],
    ['m increments from 0', 'Θ(m) total', 'Σ ⌊m/2ⁱ⌋ < 2m flips (aggregate method).'],
    ['One increment, amortized', 'O(1)', 'ĉ = c + ΔΦ ≤ 2 with Φ = number of 1 bits.'],
    ['Space', 'Θ(k)', 'k bits; the coins and Φ exist only in the analysis.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'An 8-bit counter starts at 0. How many flips do the first 16 increments cost in total?',
      answer: 31,
      unit: 'flips',
      hints: [
        'Bit i flips ⌊16/2ⁱ⌋ times. Set k = 8, m = 16 and look at the aggregate table.',
        '16 + 8 + 4 + 2 + 1 + 0 + 0 + 0.',
      ],
      solution:
        'Bit 0 flips 16 times, bit 1 8 times, bit 2 4 times, bit 3 twice and bit 4 once: 31 flips, just under 2 × 16 = 32.',
    },
    {
      type: 'number',
      prompt:
        'With Φ = number of 1 bits, an increment resets three 1s and then sets one 0. What is its amortized cost c + ΔΦ?',
      answer: 2,
      hints: [
        'The actual cost is 3 resets + 1 set = 4.',
        'Φ loses three 1s and gains one: ΔΦ = −2.',
      ],
      solution:
        'c = 4 and ΔΦ = 1 − 3 = −2, so ĉ = 4 − 2 = 2, the same as for every non-overflow increment.',
    },
    {
      type: 'number',
      prompt: 'What is the most flips a single increment of an 8-bit counter can cost?',
      answer: 8,
      unit: 'flips',
      hints: ['Think of 01111111 → 10000000.'],
      solution:
        '01111111 → 10000000 resets seven bits and sets one: 8 flips. The overflow 11111111 → 00000000 also costs 8. That is Θ(k) for one increment, even though the amortized cost is O(1).',
    },
    {
      type: 'number',
      prompt: 'Set k = 8 and m = 64. How many flips do the 64 increments cost in total?',
      answer: 127,
      unit: 'flips',
      hints: ['Add ⌊64/2ⁱ⌋ for i = 0 to 7.', '64 + 32 + 16 + 8 + 4 + 2 + 1 + 0.'],
      solution: '64 + 32 + 16 + 8 + 4 + 2 + 1 + 0 = 127 flips, below the bound 2m = 128.',
    },
    {
      type: 'choice',
      prompt: 'In the accounting method, why does the credit bank never go negative?',
      options: [
        'Every 1 bit holds exactly one coin, and only 1 bits are ever reset',
        'Resets are free in the RAM model',
        'Each increment flips at most two bits',
        'The counter starts with a coin on every bit',
      ],
      answer: 0,
      hints: ['Which flips spend coins, and where do those coins sit?'],
      solution:
        'A coin is left on a bit when it becomes 1, and a 1 → 0 flip spends the coin on that same bit. So the bank always equals the number of 1s, which is never negative.',
    },
  ],
  nextTeaser:
    'Next up: Practice: estimating running time, where you sort code snippets into their Big-O classes.',
};
