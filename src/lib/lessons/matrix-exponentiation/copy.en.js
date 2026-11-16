/** @typedef {import('$lib/algo-engine/matrix-exponentiation.js').MatrixPowFrame} MatrixPowFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** @param {number} n */
const num = (n) => n.toLocaleString('en-US');

export const en = {
  slug: 'matrix-exponentiation',
  topic: 'algebraic-randomised',
  level: 'Intermediate',
  title: 'Matrix exponentiation',
  intro:
    'A linear recurrence such as Fibonacci, Fₙ = Fₙ₋₁ + Fₙ₋₂, moves a small state vector one step by multiplying it by a fixed matrix M. So n steps are one multiplication by Mⁿ, and Mⁿ comes from repeated squaring in about log₂ n matrix products. That finds the 10¹⁵-th Fibonacci number mod 10⁹ + 7 in 69 matrix products instead of 10¹⁵ additions.',
  summary:
    'Turn a linear recurrence into a matrix and compute its n-th term in O(k³ log n) by squaring the matrix.',
  instruction:
    'Pick a recurrence, type n, and step. Each bit of n is read from the right: a 1 multiplies the current square P into the result R, and P is squared for the next bit. Compare “Matrix products” with “Steps of the plain loop”, then switch to “mod m” and try n = 10¹⁵.',
  fields: {
    recurrence: 'Recurrence',
    arithmetic: 'Arithmetic',
    n: 'Index n',
    m: 'Modulus m',
  },
  recurrences: {
    fibonacci: 'Fibonacci: Fₙ = Fₙ₋₁ + Fₙ₋₂',
    pell: 'Pell: Pₙ = 2Pₙ₋₁ + Pₙ₋₂',
    tribonacci: 'Tribonacci: Tₙ = Tₙ₋₁ + Tₙ₋₂ + Tₙ₋₃',
  },
  /** The sequence letter each recurrence uses in narration. */
  letters: { fibonacci: 'F', pell: 'P', tribonacci: 'T' },
  arithmetic: { exact: 'Exact', mod: 'mod m' },
  presetLabel: 'Example',
  presets: {
    fib10: 'F₁₀, exact',
    fib1000: 'F₁₀₀₀, exact (209 digits)',
    fibMod: 'F at 10¹⁵, mod 10⁹ + 7',
    pellMod: 'Pell at 10⁶, mod 10⁹ + 7',
    tribonacci: 'Tribonacci T₂₀',
  },
  /** @param {number} max */
  nError: (max) => `n must be a whole number from 0 to ${num(max)}.`,
  /** @param {number} min @param {number} max */
  mError: (min, max) => `The modulus must be a whole number from ${num(min)} to ${num(max)}.`,
  /** @param {number} max */
  exactClamped: (max) =>
    `Exact numbers grow by about 0.2 digits per step, so exact mode stops at n = ${num(max)}. n was set to ${num(max)}.`,
  setupTitle: 'The recurrence as a matrix',
  setupNote: 'One step: (next state) = M · (state). n steps: Mⁿ · v₀.',
  matrixM: 'M',
  vectorV0: 'v₀',
  /** @param {number} k */
  vectorHint: (k) =>
    k === 2 ? 'v₀ = (a₁, a₀), the first two terms' : 'v₀ = (a₂, a₁, a₀), the first three terms',
  bitsTitle: 'Bits of n, read from the right',
  /** @param {number} n */
  bitsAria: (n) => `The index ${num(n)} in binary.`,
  /** @param {number} i @param {number} bit @param {string} state */
  bitLabel: (i, bit, state) => `Bit with weight 2 to the ${i}: ${bit}${state ? `, ${state}` : ''}`,
  bitStates: { current: 'being read', used: 'multiplied in', skipped: 'skipped', waiting: '' },
  bitMarkers: { current: '▲', used: '✓', skipped: '·', waiting: '' },
  bitPointer: 'read',
  legend: {
    current: '▲ Being read',
    used: '✓ Is 1: P multiplied into R',
    skipped: '· Is 0: skipped',
  },
  /** @param {number} power */
  resultTitle: (power) => `Result R = M^${num(power)}`,
  /** @param {number} power */
  squareTitle: (power) => `Current square P = M^${num(power)}`,
  changed: '✱ just changed',
  /** @param {string} name @param {number} rows */
  matrixAria: (name, rows) => `${name}, a ${rows} by ${rows} matrix`,
  /**
   * An entry short enough for a matrix cell; the full number is in its title.
   * @param {string} s
   */
  entry: (s) => (s.length <= 12 ? s : `${s.slice(0, 5)}…${s.slice(-5)}`),
  /** @param {string} s */
  entryTitle: (s) => (s.length <= 12 ? s : `${s} (${s.length} digits)`),
  stats: {
    answer: 'aₙ',
    products: 'Matrix products',
    scalar: 'Number multiplications',
    loop: 'Steps of the plain loop',
    digits: 'Digits in the largest entry',
  },
  /** @param {string} letter @param {number} n */
  answerName: (letter, n) => `${letter}(${num(n)})`,
  answerPending: 'step to the end',
  invariantTitle: 'What is true right now',
  /** @param {MatrixPowFrame} f */
  invariant: (f) =>
    `R = M^${num(f.covered)}, P = M^${num(f.power)}${f.mod === null ? '' : ` (mod ${num(f.mod)})`}`,
  chipsTitle: 'R is M to the sum of these powers',
  chipsEmpty: 'nothing yet',
  /**
   * @param {MatrixPowFrame} f
   * @param {string} letter
   */
  describe(f, letter) {
    const modText = f.mod === null ? '' : `, mod ${num(f.mod)}`;
    switch (f.kind) {
      case 'start':
        return f.n === 0
          ? `n = 0, so no bits to read: R stays the identity and ${letter}(0) is the last entry of v₀.`
          : `Find ${letter}(${num(f.n)})${modText}. In binary n is ${f.bits.join('')}. Start with R = I (that is M⁰) and P = M.`;
      case 'bit':
        return f.e % 2 === 1
          ? `e = ${num(f.e)} is odd, so bit ${f.k} is 1: M^${num(f.power)} belongs in the answer.`
          : `e = ${num(f.e)} is even, so bit ${f.k} is 0: skip M^${num(f.power)}.`;
      case 'multiply':
        return `R = R · P, a ${f.size}×${f.size} product (${f.size ** 3} number multiplications). Now R = M^${num(f.covered)}.`;
      case 'square':
        return `Halve e to ${num(f.e)}, and square P = P · P to get M^${num(f.power)} for the next bit.`;
      case 'halve':
        return `Halve e to 0. Every bit is read, so the loop ends without one more squaring.`;
      case 'done':
        return `R = Mⁿ, so ${letter}(${num(f.n)})${modText} = ${f.answer.length > 40 ? `a number with ${f.answer.length} digits` : f.answer}, found with ${plural(f.matrixProducts, 'matrix product', 'matrix products')} instead of ${plural(f.n, 'step', 'steps')}.`;
    }
  },
  takeaways: [
    'A linear recurrence of order k keeps a state of its last k terms. One step is a k×k matrix M times that state: the first row holds the coefficients, and the ones below the diagonal shift the old terms down.',
    'So the n-th state is Mⁿ times the starting vector. For Fibonacci, Mⁿ = [[Fₙ₊₁, Fₙ], [Fₙ, Fₙ₋₁]].',
    'Matrix multiplication is associative, so Mⁿ can be built by squaring, exactly like aⁿ: one squaring per bit of n and one product per set bit, at most 2·log₂ n products.',
    'Each product of k×k matrices costs k³ multiplications, so the total is O(k³ log n). Exact entries grow by about 0.21 digits per Fibonacci step, which is why contest problems ask for the answer mod m.',
    'Try “F at 10¹⁵, mod 10⁹ + 7”: n has 50 bits, so 69 matrix products replace 10¹⁵ loop steps.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    ['Plain loop', 'O(k·n)', 'One step per index, each adding k earlier terms.'],
    [
      'Matrix exponentiation',
      'O(k³ log n)',
      'About 2·log₂ n products of k×k matrices, each with k³ number multiplications.',
    ],
    ['Memory', 'O(k²)', 'Only R, P and M. This page keeps every frame so you can step back.'],
    [
      'Exact Fibonacci',
      'O(n) digits',
      'Fₙ has about 0.209·n digits, so exact arithmetic gets slower as n grows; mod m keeps every entry below m.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Load “F₁₀, exact” and step to the end. How many matrix products does it take?',
      answer: 5,
      unit: 'products',
      hints: ['10 is 1010 in binary: count one squaring per bit after the first, plus one per 1.'],
      solution:
        '10 = 1010₂ has 4 bits, so P is squared 3 times, and two bits are 1, so R takes 2 products: 5 in all. The answer is F₁₀ = 55.',
    },
    {
      type: 'choice',
      prompt:
        'The recurrence aₙ = 3aₙ₋₁ − 2aₙ₋₂ uses the state (aₙ₋₁, aₙ₋₂). Which matrix moves it one step?',
      options: ['[[3, −2], [1, 0]]', '[[1, 0], [3, −2]]', '[[3, 1], [−2, 0]]', '[[−2, 3], [0, 1]]'],
      answer: 0,
      hints: [
        'The first row must produce the new term aₙ; the second row must copy aₙ₋₁ down into the second slot.',
      ],
      solution:
        'Row one gives 3aₙ₋₁ − 2aₙ₋₂ = aₙ, and row two (1, 0) copies aₙ₋₁. So M = [[3, −2], [1, 0]].',
    },
    {
      type: 'text',
      prompt: 'What is the running time of matrix exponentiation for a recurrence of order k?',
      accept: ['O(k^3 log n)', 'O(k³ log n)', 'O(log n · k^3)', 'O(k^3 · log n)'],
      hints: ['Count the matrix products, then the cost of each one.'],
      solution:
        'There are O(log n) products (one or two per bit of n), and each k×k product costs k³ multiplications: O(k³ log n).',
    },
    {
      type: 'number',
      prompt:
        'Pick Tribonacci, keep exact arithmetic, set n = 20 and step to the end. What is the value of T(20)?',
      answer: 35890,
      hints: [
        'Tribonacci here starts 0, 0, 1, so T(3) = 1, T(4) = 2, T(5) = 4, …',
        'Read the aₙ card on the last step.',
      ],
      solution:
        'The sequence runs 0, 0, 1, 1, 2, 4, 7, 13, 24, 44, 81, 149, 274, 504, 927, 1705, 3136, 5768, 10609, 19513, 35890, so T(20) = 35890.',
    },
    {
      type: 'number',
      prompt:
        'Load “F at 10¹⁵, mod 10⁹ + 7” and step to the end. How many number multiplications does it take?',
      answer: 552,
      unit: 'multiplications',
      hints: [
        '10¹⁵ has 50 bits and 20 of them are 1. Each 2×2 product costs 2³ = 8 multiplications.',
      ],
      solution:
        'P is squared once per bit after the first (49 times) and multiplied into R once per set bit (20 times): 69 matrix products. Each costs 8 multiplications, so 69 · 8 = 552.',
    },
  ],
  nextTeaser:
    'Next up: Fast Fourier transform, which multiplies two polynomials in O(n log n) by evaluating them at the roots of unity.',
};
