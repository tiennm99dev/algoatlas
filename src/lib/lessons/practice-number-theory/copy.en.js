/** @typedef {import('$lib/algo-engine/practice-number-theory.js').PracticeFrame} PracticeFrame */
/** @typedef {import('$lib/algo-engine/practice-number-theory.js').CalcOp} CalcOp */

/** @param {number} n */
const big = (n) => n.toLocaleString('en-US');

export const en = {
  slug: 'practice-number-theory',
  topic: 'number-theory',
  level: 'Intermediate',
  title: 'Practice: number theory problems',
  intro:
    'Many contest problems reduce to counting with remainders or summing over divisors. This sandbox runs four classic techniques one step at a time and checks your working: compute the next running total yourself, and the step only moves on when it is right. The calculator beside it does the modular arithmetic on the way.',
  summary:
    'Practise divisor sums and modular counting in a step-by-step sandbox that checks each running total you compute, with a modular calculator alongside.',
  instruction:
    'Pick a problem and type your own input. At each step, work out the next running total, type it under “Your turn” and press Check, or press Next step to see it. Use the calculator for the arithmetic, then answer the questions below.',
  puzzleLabel: 'Problem',
  puzzles: {
    divisors: 'σ(n) and τ(n)',
    rangeSum: 'Sum of σ(i) up to N',
    pairs: 'Pairs divisible by m',
    subarrays: 'Subarrays divisible by m',
  },
  fields: { n: 'Number n', N: 'Limit N', values: 'Values', m: 'Modulus m' },
  /** @param {number} max */
  nError: (max) => `n must be a whole number from 1 to ${big(max)}.`,
  /** @param {number} max */
  rangeError: (max) => `N must be a whole number from 1 to ${max}.`,
  /** @param {number} max */
  modulusError: (max) => `m must be a whole number from 1 to ${max}.`,
  /** @param {number} maxN @param {number} max */
  valuesError: (maxN, max) => `Enter 1 to ${maxN} whole numbers from 0 to ${max}, split by commas.`,

  valuesTitle: 'The values',
  /** @param {number} m */
  valuesAria: (m) => `The values, read left to right with modulus ${m}.`,
  valuePointer: 'a',
  seenTitle: 'seen[r]: how many remainders of each kind so far',
  seenAria: 'The count of each remainder seen so far.',
  /** @param {number} r @param {number} count @param {string} state */
  seenLabel: (r, count, state) => `Remainder ${r}: seen ${count}${state ? `, ${state}` : ''}`,
  seenStates: { lookup: 'looked up', bumped: 'just counted', plain: '' },
  seenMarkers: { lookup: '?', bumped: '+', plain: '' },
  legend: { lookup: '? Looked up now', bumped: '+ This value counted here' },
  tableTitle: 'Your working',
  tableHead: {
    divisors: ['Prime p', 'Exponent e', '1 + p + … + pᵉ', 'σ so far'],
    rangeSum: ['d', '⌊N / d⌋', 'd · ⌊N / d⌋', 'Total'],
  },
  tableEmpty: 'Rows appear as the steps finish.',
  /** @param {number} hidden */
  tableHidden: (hidden) => `${hidden} earlier ${hidden === 1 ? 'row' : 'rows'} above.`,
  divisorsTitle: 'All divisors of n',
  divisorsEmpty: 'listed at the last step',

  askTitle: 'Your turn',
  askLabels: {
    divisors: 'σ after this prime',
    rangeSum: 'Total after this d',
    pairs: 'Total after this value',
    subarrays: 'Total after this value',
  },
  askCheck: 'Check',
  askIdle: 'Nothing to work out at this step. Press Next step.',
  askEmpty: 'Type a whole number first.',
  /** @param {number} value */
  askRight: (value) => `Correct: the total is ${big(value)}.`,
  /** @param {PracticeFrame} f */
  askWrong(f) {
    switch (f.puzzle) {
      case 'divisors':
        return `Not quite. Multiply σ = ${big(f.total)} by ${big(f.count)}.`;
      case 'rangeSum':
        return `Not quite. Add d · ⌊N / d⌋ to ${big(f.total)}.`;
      default:
        return `Not quite. Add seen[${f.need}] to ${f.total}.`;
    }
  },
  stats: {
    answer: {
      divisors: 'σ so far',
      rangeSum: 'Total so far',
      pairs: 'Pairs so far',
      subarrays: 'Subarrays so far',
    },
    tau: 'τ so far',
    steps: 'Steps',
    brute: 'Checks by brute force',
    right: 'Your right answers',
    wrong: 'Your wrong answers',
  },
  /** @param {PracticeFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        switch (f.puzzle) {
          case 'divisors':
            return `Find the sum σ and the count τ of the divisors of ${big(f.input)}. Each prime power contributes one factor to each.`;
          case 'rangeSum':
            return `Find σ(1) + … + σ(${f.input}). Instead of listing each number’s divisors, ask how many numbers each d divides.`;
          case 'pairs':
            return `Count pairs whose sum is divisible by ${f.m}. Read each value once and match it with the earlier values of the opposite remainder.`;
          default:
            return `Count subarrays whose sum is divisible by ${f.m}. seen[0] starts at 1 for the empty prefix, because two equal prefix remainders bound one such subarray.`;
        }
      case 'factor':
        return `${big(f.d)}^${f.e} exactly divides n. Its divisors contribute 1 + … + ${big(f.d)}^${f.e} = ${big(f.count)} to σ and ${f.e + 1} to τ. What is σ now?`;
      case 'apply':
        return `σ = ${big(f.total)} and τ = ${f.tau}.`;
      case 'term':
        return `d = ${f.d} divides ⌊${f.input} / ${f.d}⌋ = ${f.count} of the numbers up to ${f.input}, so it adds ${f.d}·${f.count}. What is the total now?`;
      case 'add':
        return `${f.added} added: the total is ${big(f.total)}.`;
      case 'read':
        return f.puzzle === 'pairs'
          ? `Value ${f.values[f.i]} has remainder ${f.r}, so it needs remainder ${f.need}: seen[${f.need}] = ${f.seen[f.need]}. What is the total now?`
          : `Value ${f.values[f.i]} takes the prefix remainder to s = ${f.r}, and seen[${f.r}] = ${f.seen[f.r]}. What is the total now?`;
      case 'count':
        return `${f.added} added: the total is ${f.total}. Count this remainder in seen[${f.r}].`;
      case 'done':
        switch (f.puzzle) {
          case 'divisors':
            return `σ(${big(f.input)}) = ${big(f.total)} and τ(${big(f.input)}) = ${f.tau}.`;
          case 'rangeSum':
            return `σ(1) + … + σ(${f.input}) = ${big(f.total)}, in ${f.steps} rounds.`;
          case 'pairs':
            return `${f.total} ${f.total === 1 ? 'pair sums' : 'pairs sum'} to a multiple of ${f.m}.`;
          default:
            return `${f.total} ${f.total === 1 ? 'subarray sums' : 'subarrays sum'} to a multiple of ${f.m}.`;
        }
    }
  },

  calcTitle: 'Modular calculator',
  calcFields: { a: 'a', op: 'Operation', b: 'b', m: 'mod m' },
  calcOps: {
    add: 'a + b',
    sub: 'a − b',
    mul: 'a · b',
    pow: 'a to the power b',
    div: 'a ÷ b (a · b⁻¹)',
  },
  /** @param {number} max */
  calcValueError: (max) => `a and b must be whole numbers from 0 to ${big(max)}.`,
  /** @param {number} max */
  calcModulusError: (max) => `m must be a whole number from 1 to ${big(max)}.`,
  /** @param {number} b @param {number} m */
  calcNoInverse: (b, m) => `${big(b)} has no inverse mod ${big(m)}, because they share a factor.`,
  /**
   * @param {CalcOp} op @param {number} a @param {number} b @param {number} m @param {number} value
   * @param {number | null} inverse
   */
  calcResult(op, a, b, m, value, inverse) {
    const symbol = { add: '+', sub: '−', mul: '·', pow: '^', div: '÷' }[op];
    const line = `${big(a)} ${symbol} ${big(b)} ≡ ${big(value)} (mod ${big(m)})`;
    return inverse === null ? line : `${line}, using ${big(b)}⁻¹ ≡ ${big(inverse)}`;
  },

  takeaways: [
    'If n = p₁^e₁ ··· pₖ^eₖ, then τ(n) = ∏(eᵢ + 1) and σ(n) = ∏(1 + pᵢ + … + pᵢ^eᵢ). Every divisor picks one power of each prime, which is why the sum factors.',
    'τ(n) is odd exactly when n is a perfect square, since divisors pair up as d and n/d except for √n.',
    'Swap the order of a double sum: σ(1) + … + σ(N) = Σ d·⌊N/d⌋, because d divides ⌊N/d⌋ of the numbers up to N. That cuts O(N²) checks to O(N) rounds.',
    'Count by remainders instead of pairs. (a + b) ≡ 0 (mod m) only asks for opposite remainders, and a subarray has sum ≡ 0 exactly when its two prefix sums have the same remainder. One pass with m buckets replaces O(n²) checks.',
    'Try the values 3, 3, 3, 3 with m = 3 in both counting problems: every pair and every subarray counts. Compare the totals with n(n − 1)/2 and n(n + 1)/2.',
  ],
  complexityHead: ['Technique', 'Cost', 'Why'],
  complexity: [
    [
      'σ(n) and τ(n)',
      'O(√n) time, O(1) memory',
      'Trial divide up to √n. What is left over is 1 or one more prime.',
    ],
    [
      'Sum of σ(i) up to N',
      'O(N) time, O(1) memory',
      'One round per d. Grouping equal values of ⌊N/d⌋ brings it to O(√N).',
    ],
    [
      'Pairs with sum divisible by m',
      'O(n + m) time, O(m) memory',
      'One lookup and one update per value, against n(n − 1)/2 pairs by brute force.',
    ],
    [
      'Subarrays with sum divisible by m',
      'O(n + m) time, O(m) memory',
      'The same buckets over prefix remainders, against n(n + 1)/2 subarrays.',
    ],
  ],
  practiceTitle: 'Problems',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Find σ(360), the sum of all the divisors of 360.',
      answer: 1170,
      hints: ['360 = 2³·3²·5. Run the first problem with n = 360.'],
      solution: 'σ = (1 + 2 + 4 + 8)·(1 + 3 + 9)·(1 + 5) = 15·13·6 = 1170.',
    },
    {
      type: 'number',
      prompt: 'How many divisors does 360 have?',
      answer: 24,
      unit: 'divisors',
      hints: ['Multiply exponent + 1 over the primes of 360.'],
      solution: '360 = 2³·3²·5, so τ = (3 + 1)(2 + 1)(1 + 1) = 24.',
    },
    {
      type: 'multi',
      prompt: 'Which of these numbers have an odd number of divisors?',
      options: ['36', '49', '50', '360'],
      answers: [0, 1],
      hints: ['Run the first problem on each, and read τ. What do the odd ones have in common?'],
      solution:
        'τ(36) = 9 and τ(49) = 3 are odd, as both are perfect squares. τ(50) = 6 and τ(360) = 24 are even.',
    },
    {
      type: 'number',
      prompt: 'Find σ(1) + σ(2) + … + σ(10).',
      answer: 87,
      hints: ['Run the second problem with N = 10, and read the last total.'],
      solution:
        'Σ d·⌊10/d⌋ = 10 + 10 + 9 + 8 + 10 + 6 + 7 + 8 + 9 + 10 = 87. Term by term, σ(1) to σ(10) add to the same: 1 + 3 + 4 + 7 + 6 + 12 + 8 + 15 + 13 + 18.',
    },
    {
      type: 'number',
      prompt: 'In the list 1, 2, 3, 4, 5, 6, how many pairs have a sum divisible by 3?',
      answer: 5,
      unit: 'pairs',
      hints: ['Run the third problem with m = 3. The remainders are 1, 2, 0, 1, 2, 0.'],
      solution:
        'Two remainder-1 values pair with two remainder-2 values: 4 pairs. The two values with remainder 0 give one more: 5.',
    },
    {
      type: 'number',
      prompt: 'In the list 4, 5, 0, 2, 3, 1, how many subarrays have a sum divisible by 5?',
      answer: 7,
      unit: 'subarrays',
      hints: [
        'Run the fourth problem with m = 5.',
        'The prefix remainders, starting from the empty prefix, are 0, 4, 4, 4, 1, 4, 0.',
      ],
      solution:
        'Remainder 4 appears 4 times and remainder 0 twice, so C(4, 2) + C(2, 2) = 6 + 1 = 7.',
    },
    {
      type: 'number',
      prompt: 'How many integers from 1 to 100 leave remainder 3 when divided by 7?',
      answer: 14,
      hints: ['They are 3, 10, 17, …. How many steps of 7 fit between 3 and 100?'],
      solution: '⌊(100 − 3) / 7⌋ + 1 = 13 + 1 = 14, ending at 94.',
    },
    {
      type: 'number',
      prompt: 'Use the calculator: what is 5 ÷ 3 mod 7?',
      answer: 4,
      hints: ['Division means multiplying by the inverse. Pick a ÷ b in the calculator.'],
      solution: '3·5 = 15 ≡ 1, so 3⁻¹ ≡ 5 (mod 7) and 5 ÷ 3 ≡ 5·5 = 25 ≡ 4. Check: 4·3 = 12 ≡ 5.',
    },
  ],
  nextTeaser:
    'Next up: Points, vectors and orientation, which starts computational geometry from one exact test: which way three points turn.',
};
