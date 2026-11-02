/** @typedef {import('$lib/algo-engine/modular-exponentiation.js').PowFrame} PowFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'modular-exponentiation',
  topic: 'number-theory',
  level: 'Beginner',
  title: 'Modular arithmetic and fast exponentiation',
  intro:
    'Modular arithmetic keeps only the remainder after dividing by m, and a ≡ b (mod m) says two numbers leave the same remainder. Since sums and products depend only on remainders, you can reduce after every step and keep the numbers small. Combined with repeated squaring, that computes a^e mod m in about log₂ e steps, even when a^e itself has hundreds of millions of digits.',
  summary:
    'Compute a to the power e modulo m by reading the bits of e, squaring as you go, and reducing after every multiplication.',
  instruction:
    'Type a, e and m, then step. The strip shows e in binary, and each bit lights up as it is read from the right. Bits that are 1 multiply the current square into the result. Compare “Multiplications” with “Without squaring”, then try the huge exponent.',
  fields: { a: 'Base a', e: 'Exponent e', m: 'Modulus m' },
  presetLabel: 'Example',
  presets: {
    classic: '3¹³ mod 7',
    onlyOneBit: 'One set bit',
    allOnes: 'All bits set',
    fermat: 'Fermat: 7¹² mod 13',
    huge: '2 to the 10⁹, mod 10⁹ + 7',
  },
  /** @param {number} max */
  aError: (max) => `The base must be a whole number from 0 to ${max.toLocaleString('en-US')}.`,
  /** @param {number} max */
  eError: (max) => `The exponent must be a whole number from 0 to ${max.toLocaleString('en-US')}.`,
  /** @param {number} max */
  mError: (max) => `The modulus must be a whole number from 1 to ${max.toLocaleString('en-US')}.`,
  bitsTitle: 'Bits of the exponent, read from the right',
  /** @param {number} e */
  bitsAria: (e) => `The exponent ${e} in binary.`,
  /** @param {number} i @param {number} bit @param {string} state */
  bitLabel: (i, bit, state) => `Bit with weight 2 to the ${i}: ${bit}${state ? `, ${state}` : ''}`,
  bitStates: { current: 'being read', used: 'multiplied in', skipped: 'skipped', waiting: '' },
  bitMarkers: { current: '▲', used: '✓', skipped: '·', waiting: '' },
  bitPointer: 'read',
  legend: {
    current: '▲ Being read',
    used: '✓ Is 1: multiplied in',
    skipped: '· Is 0: skipped',
  },
  squaresTitle: 'Squares built so far',
  squaresHead: { k: 'k', power: 'Power', x: 'Value mod m', bit: 'Bit', used: 'In result' },
  /** @param {number} power */
  powerName: (power) => `a^${power}`,
  usedYes: '✓ used',
  usedNo: '· skipped',
  usedWaiting: '…',
  currentRow: '→',
  squaresEmpty: 'Step to read the first bit.',
  chipsTitle: 'The result is a to the sum of these',
  chipsEmpty: 'nothing yet',
  stats: {
    result: 'Result so far',
    x: 'Current square x',
    multiplications: 'Multiplications',
    naive: 'Without squaring',
    productDigits: 'Digits in the largest product',
    fullDigits: 'Digits of aᵉ written out',
  },
  invariantTitle: 'What is true right now',
  /** @param {PowFrame} f */
  invariant: (f) => `result ≡ a^${f.covered} (mod ${f.m})`,
  /** @param {PowFrame} f */
  describe(f) {
    const { a, e0, m, k, x, result, before, e } = f;
    switch (f.kind) {
      case 'start':
        return e0 === 0
          ? `e = 0, so there are no bits to use. The answer is 1, reduced mod ${m}: ${result}.`
          : `Find ${a}^${e0} mod ${m}. In binary e is ${f.bits.join('')}. Start with result = ${result} and x = ${a} mod ${m} = ${x}.`;
      case 'bit':
        return e % 2 === 1
          ? `e = ${e} is odd, so bit ${k} is 1: the power a^${2 ** k} belongs in the answer.`
          : `e = ${e} is even, so bit ${k} is 0: skip a^${2 ** k}.`;
      case 'multiply':
        return `result = ${before}·${x} mod ${m} = ${result}, so now result ≡ a^${f.covered}.`;
      case 'square':
        return e === 0
          ? `x = ${before}·${before} mod ${m} = ${x}. e is now 0, so the loop ends. This last square was never needed.`
          : `x = ${before}·${before} mod ${m} = ${x}, which is a^${2 ** (k + 1)} mod ${m}. Halve e to ${e}.`;
      case 'done':
        return `${a}^${e0} mod ${m} = ${result}, using ${plural(f.multiplications, 'multiplication', 'multiplications')} instead of ${e0.toLocaleString('en-US')}.`;
    }
  },
  takeaways: [
    'a ≡ b (mod m) means m divides a − b, so a and b leave the same remainder. Congruences can be added and multiplied: (x·y) mod m = ((x mod m)·(y mod m)) mod m.',
    'So reduce after every multiplication. Each product then stays below m², however large the true power is.',
    'Any exponent is a sum of powers of two: 13 = 8 + 4 + 1, so a¹³ = a⁸·a⁴·a¹. Each of those squares comes from squaring the one before.',
    'That costs one squaring per bit plus one multiplication per set bit, at most 2·log₂ e + 2 in all, against e for plain repeated multiplication.',
    'Try “2 to the 10⁹, mod 10⁹ + 7”: compare the digits of the full power with the digits of the largest product, and count the multiplications.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    [
      'Repeated multiplication',
      'O(e)',
      'One multiplication for each unit of the exponent, which is hopeless for e near 10⁹.',
    ],
    [
      'Binary exponentiation',
      'O(log e)',
      'e halves each round, so the loop runs once per bit: one squaring, plus one multiplication if the bit is 1.',
    ],
    [
      'Size of the numbers',
      'below m²',
      'Reducing after each multiplication keeps both factors below m.',
    ],
    ['Memory', 'O(1)', 'Only result, x and e. This page keeps the rows so you can read them.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'multi',
      prompt: 'Which of these are congruent to 2 (mod 5)?',
      options: ['7', '12', '15', '−3', '22'],
      answers: [0, 1, 3, 4],
      hints: ['Check whether 5 divides the number minus 2.'],
      solution:
        '7 − 2 = 5, 12 − 2 = 10, −3 − 2 = −5 and 22 − 2 = 20 are all multiples of 5. 15 − 2 = 13 is not.',
    },
    {
      type: 'number',
      prompt: 'Without multiplying the numbers out, what is (123·456) mod 10?',
      answer: 8,
      hints: ['Only the remainders matter: 123 mod 10 and 456 mod 10.'],
      solution: '123 ≡ 3 and 456 ≡ 6, so the product is ≡ 3·6 = 18 ≡ 8 (mod 10).',
    },
    {
      type: 'number',
      prompt: 'Load the example 3¹³ mod 7 and step to the end. What is the result?',
      answer: 3,
      hints: ['The bits of 13 are 1101, so 3¹³ = 3⁸·3⁴·3¹. Reduce each one mod 7.'],
      solution: '3¹ ≡ 3, 3² ≡ 2, 3⁴ ≡ 4 and 3⁸ ≡ 2 (mod 7). So 3¹³ ≡ 2·4·3 = 24 ≡ 3 (mod 7).',
    },
    {
      type: 'order',
      prompt: 'For e = 13, put the powers in the order the code multiplies them into the result.',
      items: ['a⁸', 'a¹', 'a⁴'],
      answer: [1, 2, 0],
      hints: ['The loop reads the bits of e from the lowest one up.'],
      solution:
        '13 = 1101 in binary. Reading from the right: a¹ first, a² is skipped, then a⁴, then a⁸.',
    },
    {
      type: 'number',
      prompt:
        'Load “2 to the 10⁹, mod 10⁹ + 7” and step to the end. How many multiplications does the code do, counting the squarings?',
      answer: 43,
      unit: 'multiplications',
      hints: [
        'Read the Multiplications card at the last step, or count: one per bit plus one per set bit.',
      ],
      solution:
        '10⁹ has 30 bits, and 13 of them are 1. So the code squares 30 times and multiplies 13 times: 43 in all.',
    },
  ],
  nextTeaser:
    'Next up: Modular inverse and Chinese remainder theorem, which undoes multiplication mod m and combines several remainders into one number.',
};
