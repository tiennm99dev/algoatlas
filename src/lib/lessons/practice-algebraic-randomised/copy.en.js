/** @typedef {import('$lib/algo-engine/practice-algebraic-randomised.js').RecurrenceFrame} RecurrenceFrame */
/** @typedef {import('$lib/algo-engine/practice-algebraic-randomised.js').BigFrame} BigFrame */
/** @typedef {import('$lib/algo-engine/practice-algebraic-randomised.js').Recurrence} Recurrence */

const SUB = '₀₁₂₃₄₅₆₇₈₉';
/** Subscript digits. @param {number} n */
const sub = (n) => [...String(n)].map((d) => SUB[Number(d)]).join('');

/** aₙ₋ᵢ, or aₙ for i = 0. @param {number} i */
const term = (i) => (i === 0 ? 'aₙ' : `aₙ₋${sub(i)}`);

/** @param {number} n */
const big = (n) => n.toLocaleString('en-US');

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${big(n)} ${n === 1 ? one : many}`;

/** The 10ᵏ place name. @param {number} k */
const place = (k) => `10${[...String(k)].map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('')}`;

/** The recurrence as a formula. @param {Recurrence} rec */
function formula(rec) {
  const parts = rec.coeffs
    .map((c, j) => (c === 0 ? '' : `${c === 1 ? '' : `${c}·`}${term(j + 1)}`))
    .filter(Boolean);
  if (rec.constant !== 0) parts.push(String(rec.constant));
  return `aₙ = ${parts.length ? parts.join(' + ') : '0'}`;
}

/** @param {Recurrence} rec */
const startText = (rec) => rec.initial.map((v, i) => `a${sub(i)} = ${v}`).join(', ');

export const en = {
  slug: 'practice-algebraic-randomised',
  topic: 'algebraic-randomised',
  level: 'Advanced',
  title: 'Practice: algebraic and randomised problems',
  intro:
    'Two algebra moves solve a large family of contest problems. A linear recurrence becomes a matrix, so its n-th term takes O(k³ log n) time even for n near 10¹⁵. And multiplying two big numbers is a convolution of their digits followed by carrying, which is why FFT, a fast polynomial product, also multiplies huge integers fast.',
  summary:
    'Turn any linear recurrence with a constant into its transition matrix and raise it to the n-th power, and multiply big numbers as a digit convolution plus carries.',
  instruction:
    'Pick a problem. For a recurrence, type the coefficients, an optional constant and the start values, then step through: first the matrix is built row by row, then binary exponentiation squares it. For big numbers, type two factors and watch each column sum c[k] form along a diagonal of the digit grid before the carries run. Use what you see to answer the questions below.',
  problemLabel: 'Problem',
  problems: { recurrence: 'Recurrence to matrix', bignum: 'Big-number multiplication' },
  fields: {
    coeffs: 'Coefficients c₁ … cₖ',
    constant: 'Constant d',
    initial: 'Start values a₀ … aₖ₋₁',
    n: 'Index n',
    mod: 'Modulus m',
    x: 'Number x',
    y: 'Number y',
  },
  presetLabel: 'Example',
  recurrencePresets: {
    fibonacci: 'Fibonacci, n = 100',
    constant: 'aₙ = 2aₙ₋₁ + 3aₙ₋₂ + 5',
    tribonacci: 'Tribonacci, n = 10¹²',
  },
  bigPresets: { small: '1234 × 5678', carries: '9999 × 9999', long: 'Two 12-digit numbers' },
  /** @param {number} maxK @param {number} max */
  coeffsError: (maxK, max) =>
    `Type 1 to ${maxK} coefficients, whole numbers from 0 to ${max}, separated by commas or spaces.`,
  /** @param {number} k @param {number} max */
  initialError: (k, max) =>
    `Type exactly ${k} start ${k === 1 ? 'value' : 'values'} from 0 to ${max}, one for each of a₀ … aₖ₋₁.`,
  /** @param {number} max */
  constantError: (max) => `The constant d must be a whole number from 0 to ${max}.`,
  /** @param {number} max */
  nError: (max) => `n must be a whole number from 0 to ${big(max)}.`,
  /** @param {number} min @param {number} max */
  modError: (min, max) => `m must be a whole number from ${min} to ${big(max)}.`,
  /** @param {number} max */
  bigError: (max) => `Type a whole number of 1 to ${max} digits, with no leading zero.`,

  formula,
  startText,
  term,
  matrixTitle: 'Transition matrix M: new state = M · old state',
  /** @param {number} size */
  matrixAria: (size) => `The ${size} × ${size} transition matrix`,
  /** Column j of M multiplies this entry of the old state. @param {number} j @param {number} k */
  colHead: (j, k) => (j < k ? term(j + 1) : '1'),
  /** Row i of M produces this entry of the new state. @param {number} i @param {number} k */
  rowHead: (i, k) => (i < k ? term(i) : '1'),
  /** @param {number} covered */
  rTitle: (covered) => `R = M^${big(covered)} (mod m)`,
  /** @param {number} power */
  pTitle: (power) => `P = M^${big(power)} (mod m)`,
  rAria: 'The result matrix R',
  pAria: 'The power matrix P',
  notYet: 'Not started yet.',
  /** @param {string[]} v */
  startVector: (v) => `v₀ = (${v.join(', ')})`,
  /** @param {string[]} v @param {number} n */
  resultVector: (v, n) => `v${n < 1000 ? sub(n) : 'ₙ'} = R · v₀ = (${v.join(', ')})`,
  recStats: {
    e: 'e, what is left of n',
    products: 'Matrix products',
    answer: 'aₙ mod m',
    size: 'Matrix size',
  },
  /** @param {number} size */
  sizeText: (size) => `${size} × ${size}`,
  /** @param {RecurrenceFrame} f @param {Recurrence} rec */
  describeRecurrence(f, rec) {
    const k = f.order;
    switch (f.kind) {
      case 'start':
        return `${formula(rec)}, with ${startText(rec)}. The state holds the last ${k} ${k === 1 ? 'term' : 'terms'}${f.size > k ? ' and a constant 1' : ''}, so M is ${f.size} × ${f.size}.`;
      case 'row':
        if (f.row === 0)
          return `Row 0 computes the new term aₙ: it holds the coefficients ${rec.coeffs.join(', ')}${f.size > k ? ` and then the constant ${rec.constant}, which multiplies the 1` : ''}.`;
        if (f.row < k)
          return `Row ${f.row} just copies ${term(f.row)} from the old state: a 1 in column ${f.row - 1}.`;
        return 'The last row keeps the constant 1 equal to 1: 0 everywhere except a 1 on the diagonal.';
      case 'init':
        return `Start with R = I and P = M, and e = n = ${big(f.n)}.`;
      case 'multiply':
        return `e = ${big(f.e)} is odd, so multiply R by P: R is now M^${big(f.covered)}.`;
      case 'skip':
        return `e = ${big(f.e)} is even, so R stays M^${big(f.covered)}.`;
      case 'square':
        return `Halve e to ${big(f.e)} and square P: P is now M^${big(f.power)}.`;
      case 'halve':
        return `Halve e to 0: R = M^${big(f.covered)} = Mⁿ, after ${plural(f.matrixProducts, 'matrix product', 'matrix products')}.`;
      case 'apply':
        return `Multiply Mⁿ by the start state v₀. The result is vₙ = (aₙ₊ₖ₋₁, …, aₙ${f.size > k ? ', 1' : ''}).`;
      case 'done':
        return `Entry ${k - 1} of vₙ is a${f.n < 1000 ? sub(f.n) : 'ₙ'} = ${f.answer} (mod ${big(f.mod)}), found with ${plural(f.matrixProducts, 'matrix product', 'matrix products')} instead of ${big(Math.max(0, f.n - k + 1))} steps of the loop.`;
    }
  },

  markers: { row: '●', sum: '+', carry: '→' },
  legend: {
    row: '● Row being built',
    sum: '+ The diagonal i + j = k and its sum c[k]',
    carry: '→ The place being carried, and its new digit',
  },
  gridTitle: 'Digit products a[i] · b[j], highest place first',
  /** @param {string} x @param {string} y */
  gridAria: (x, y) => `Products of the digits of ${x} and ${y}`,
  /** Column or row header: the digit itself. @param {number} digit */
  digitHead: (digit) => String(digit),
  convTitle: 'Column sums c[k], before carrying',
  convAria: 'The convolution c, highest place first',
  digitsTitle: 'Product digits',
  digitsAria: 'The digits of the product so far, highest place first',
  bigStats: {
    products: 'Digit products',
    carry: 'Carry',
    answer: 'x · y',
    length: 'Digits in x · y',
  },
  /** @param {BigFrame} f */
  describeBig(f) {
    const x = f.a.slice().reverse().join('');
    const y = f.b.slice().reverse().join('');
    switch (f.kind) {
      case 'start':
        return `Multiply ${x} by ${y}. Write both as digit lists, lowest digit first: a = [${f.a.join(', ')}], b = [${f.b.join(', ')}].`;
      case 'conv':
        return `c[${f.k}] sums the products on one diagonal, where i + j = ${f.k}: ${f.terms.map(([i, j]) => `${f.a[i]}·${f.b[j]}`).join(' + ')} = ${f.c[f.k]}.`;
      case 'carry':
        return `Place ${place(f.k)}: t = c[${f.k}] + carry = ${f.t}, so the digit is ${f.t % 10} and the carry is ${Math.floor(f.t / 10)}.`;
      case 'extra':
        return `A carry is left over: append ${f.t % 10} as a new highest digit.`;
      case 'done':
        return `${x} × ${y} = ${f.answer}, from ${plural(f.products, 'digit product', 'digit products')}. FFT would get the same column sums in O(n log n).`;
    }
  },

  takeaways: [
    'For aₙ = c₁aₙ₋₁ + … + cₖaₙ₋ₖ, the state (aₙ₋₁, …, aₙ₋ₖ) becomes (aₙ, …, aₙ₋ₖ₊₁) through a k × k matrix: the coefficients in row 0 and a shifted identity below.',
    'A constant term d adds one more state entry that is always 1: d goes at the end of row 0, and a new last row 0 … 0 1 keeps the 1 in place.',
    'Binary exponentiation needs one squaring per bit of n and one product per 1 bit, so aₙ costs O(k³ log n) arithmetic, with every entry reduced mod m.',
    'The digits of x · y before carrying are the convolution c[k] = Σ a[i]·b[k − i]: the coefficients of the product of two polynomials. Schoolbook does len(a) · len(b) digit products; FFT computes the same convolution in O(n log n).',
    'Try 9999 × 9999: every column sum is over 10, and a carry is left after the last column, so the product has 8 digits.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    [
      'aₙ of an order-k recurrence',
      'O(k³ log n)',
      'About 2 log₂ n matrix products, each k³ multiplications.',
    ],
    ['aₙ by the plain loop', 'O(k · n)', 'One step per term: hopeless for n near 10¹⁵.'],
    [
      'Big-number product, schoolbook',
      'O(len(x) · len(y))',
      'Every digit pair is multiplied once, then O(len) carries.',
    ],
    [
      'Big-number product, FFT',
      'O(n log n)',
      'Evaluate both digit polynomials at roots of unity, multiply pointwise, interpolate, then carry.',
    ],
    ['Memory', 'O(k²) or O(len(x) + len(y))', 'Two or three matrices, or the column sums.'],
  ],
  practiceTitle: 'Practice problems',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'What size is the transition matrix of aₙ = 2aₙ₋₁ + 3aₙ₋₂ + 5? Give the number of rows.',
      answer: 3,
      unit: 'rows',
      hints: ['Two earlier terms, plus one entry for the constant.'],
      solution:
        'The state is (aₙ₋₁, aₙ₋₂, 1), so M is 3 × 3: rows (2, 3, 5), (1, 0, 0) and (0, 0, 1).',
    },
    {
      type: 'number',
      prompt: 'For aₙ = 2aₙ₋₁ + 3aₙ₋₂ + 5 with a₀ = a₁ = 1, what is a₁₀?',
      answer: 66430,
      hints: [
        'Load the example “aₙ = 2aₙ₋₁ + 3aₙ₋₂ + 5” and step to the end; m is large enough not to change it.',
      ],
      solution:
        'The terms run 1, 1, 10, 28, 91, 271, 820, 2,458, 7,381, 22,141, 66,430, so a₁₀ = 66,430.',
    },
    {
      type: 'number',
      prompt: 'What is the 100th Fibonacci number F₁₀₀ (F₀ = 0, F₁ = 1) mod 1,000,000,007?',
      answer: 687995182,
      hints: ['Load “Fibonacci, n = 100”: the answer is the last entry the run reads.'],
      solution:
        'Raising [[1, 1], [1, 0]] to the 100th power mod 1,000,000,007 and applying it to (1, 0) gives F₁₀₀ ≡ 687,995,182.',
    },
    {
      type: 'number',
      prompt:
        'How many matrix products does binary exponentiation make for n = 1,000,000? Count both the R · P products and the squarings.',
      answer: 26,
      unit: 'products',
      hints: [
        '1,000,000 in binary has 20 bits, 7 of them 1. Or set n = 1000000 and read the counter.',
      ],
      solution: 'One product per 1 bit (7) and one squaring per bit after the first (19): 26.',
    },
    {
      type: 'number',
      prompt: 'In 1234 × 5678, what is the column sum c[2] before carrying?',
      answer: 61,
      hints: ['Lowest digit first, a = [4, 3, 2, 1] and b = [8, 7, 6, 5]. Sum a[i]·b[2 − i].'],
      solution: 'c[2] = 4·6 + 3·7 + 2·8 = 24 + 21 + 16 = 61.',
    },
    {
      type: 'number',
      prompt: 'How many digit products does the schoolbook method make for two 12-digit numbers?',
      answer: 144,
      unit: 'products',
      hints: ['Every digit of x meets every digit of y once.'],
      solution: '12 · 12 = 144, which is why the cost grows as the square of the length.',
    },
    {
      type: 'number',
      prompt: 'How many digits does 9999 × 9999 have?',
      answer: 8,
      unit: 'digits',
      hints: ['There are 7 column sums; check whether a carry is left after the last one.'],
      solution:
        'The 7 column sums leave a final carry, which becomes an 8th digit: 9999 × 9999 = 99,980,001.',
    },
  ],
  nextTeaser:
    'Next up: P, NP and reductions, where the question turns from how fast a problem can be solved to whether any fast algorithm can exist.',
};
