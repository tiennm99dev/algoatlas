/** @typedef {import('$lib/algo-engine/gcd-extended-euclid.js').GcdFrame} GcdFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** A signed term for an equation, so 240·(−9) reads with a typographic minus. */
/** @param {number} v */
const signed = (v) => (v < 0 ? `(−${-v})` : String(v));

/** Plain text for a number that may be negative. @param {number} v */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

export const en = {
  slug: 'gcd-extended-euclid',
  topic: 'number-theory',
  level: 'Beginner',
  title: 'GCD and extended Euclid',
  intro:
    'The greatest common divisor of two numbers is the largest number that divides both. Euclid’s algorithm finds it with a few divisions, because gcd(a, b) = gcd(b, a mod b), and with a little bookkeeping it also writes the gcd as a·x + b·y. Those coefficients are what solve equations in integers, and later give modular inverses.',
  summary:
    'Run Euclid’s algorithm as a rectangle cut into squares, read off the Bézout coefficients, and solve a·x + b·y = c in integers.',
  instruction:
    'Type a, b and c, then step. Each division cuts squares off the rectangle and adds a row to the table. Watch the last squares: their side is the gcd, and they would tile the whole rectangle. Compare “Consecutive Fibonacci” with “First divides second” to see the most and the fewest divisions.',
  fields: { a: 'a', b: 'b', c: 'c in a·x + b·y = c' },
  presetLabel: 'Example',
  presets: {
    classic: '240 and 46',
    fibonacci: 'Consecutive Fibonacci',
    tall: 'a smaller than b',
    multiple: 'First divides second',
    noSolution: 'No integer solution',
  },
  /** @param {number} max */
  valueError: (max) => `a and b must be whole numbers from 1 to ${max}.`,
  /** @param {number} max */
  cError: (max) => `c must be a whole number from −${max} to ${max}.`,
  boardTitle: 'Cutting the rectangle into squares',
  /** @param {number} a @param {number} b @param {number} count @param {number} left */
  boardAria: (a, b, count, left) =>
    `A rectangle ${a} wide and ${b} tall, with ${plural(count, 'square', 'squares')} cut off and an area of ${left} left.`,
  /** @param {number} side @param {number} step @param {string} state */
  squareLabel: (side, step, state) =>
    `Square of side ${side}, cut by division ${step}${state ? `, ${state}` : ''}`,
  /** @param {number} w @param {number} h */
  restLabel: (w, h) => `Part left to cut, ${w} by ${h}`,
  /** @param {number} w @param {number} h */
  restText: (w, h) => `${w} × ${h}`,
  states: { fresh: 'just cut', earlier: 'cut earlier', final: 'side equals the gcd' },
  markers: { fresh: '+', earlier: '', final: '★', rest: '' },
  legend: {
    fresh: '+ Cut by this division',
    earlier: 'Cut earlier',
    final: '★ Side equals the gcd',
    rest: 'Dashed: left to cut',
  },
  tableTitle: 'The table: every row has r = s·a + t·b',
  tableHead: ['r', 'q', 's', 't'],
  /** @param {number} a @param {number} b */
  tableAria: (a, b) => `Extended Euclid table for a = ${a} and b = ${b}.`,
  /** @param {string} head @param {number} row @param {string} value @param {string} state */
  tableCell: (head, row, value, state) =>
    `Row ${row}, ${head}: ${value || 'blank'}${state ? `, ${state}` : ''}`,
  cellStates: { used: 'read by this division', fresh: 'new row', answer: 'the answer' },
  cellMarkers: { used: '÷', fresh: '+', answer: '★' },
  stats: {
    divisions: 'Divisions',
    subtractions: 'Squares cut (subtractions)',
    g: 'gcd(a, b)',
    bezout: 'Bézout x, y',
  },
  equationTitle: 'Integer solutions',
  /** @param {GcdFrame} f */
  equation(f) {
    return `${f.a}x + ${f.b}y = ${num(f.c)}`;
  },
  /** @param {GcdFrame} f */
  solutionText(f) {
    if (f.solvable === null) return 'Waiting for the gcd.';
    if (!f.solvable) return `No solution: ${f.g} does not divide ${num(f.c)}.`;
    if (f.stepX === null)
      return `One solution: x = ${num(Number(f.x0))}, y = ${num(Number(f.y0))}.`;
    return `x = ${num(Number(f.x0))} + ${f.stepX}k, y = ${num(Number(f.y0))} − ${f.stepY}k. The smallest x that is not negative: x = ${f.smallX}, y = ${num(Number(f.smallY))}.`;
  },
  /** @param {GcdFrame} f */
  describe(f) {
    const { a, b, c, g, x, y, q, r0, r1 } = f;
    switch (f.kind) {
      case 'start':
        return `Find gcd(${a}, ${b}). Rows 0 and 1 say ${a} = 1·a + 0·b and ${b} = 0·a + 1·b.`;
      case 'divide':
        return q === 0
          ? `${r0} is smaller than ${r1}, so q = 0: no square fits, and this division only swaps the two numbers.`
          : `${r0} = ${q}·${r1} + ${r0 - q * r1}, so cut ${plural(q, 'square', 'squares')} of side ${r1}.`;
      case 'update': {
        const row = f.rows.at(-1);
        return `New row: r = ${r1}, s = ${num(Number(row?.s))}, t = ${num(Number(row?.t))}. It keeps r = s·a + t·b, and ${r1 === 0 ? 'r has reached 0' : `gcd(${r0}, ${r1}) is still the same gcd`}.`;
      }
      case 'gcd':
        return `The remainder is 0, so gcd(${a}, ${b}) = ${g}: the last squares had side ${g}. Their row gives ${a}·${signed(Number(x))} + ${b}·${signed(Number(y))} = ${g}.`;
      case 'none':
        return `Every a·x + b·y is a multiple of ${g}, and ${num(c)} is not. So ${a}x + ${b}y = ${num(c)} has no integer solution.`;
      case 'solve':
        return `${g} divides ${num(c)}, so multiply the Bézout equation by ${num(c / Number(g))}: x₀ = ${num(Number(f.x0))} and y₀ = ${num(Number(f.y0))}.`;
      case 'general':
        return `Adding ${f.stepX} to x and taking ${f.stepY} from y keeps the sum, so there are infinitely many solutions. One is x = ${f.smallX}, y = ${num(Number(f.smallY))}.`;
      case 'done':
        return f.solvable
          ? `Done: gcd = ${g} after ${plural(f.divisions, 'division', 'divisions')}, where subtraction alone would take ${f.subtractions}. The equation has solutions.`
          : `Done: gcd = ${g} after ${plural(f.divisions, 'division', 'divisions')}, where subtraction alone would take ${f.subtractions}. The equation has no solution.`;
    }
  },
  takeaways: [
    'gcd(a, b) = gcd(b, a mod b), because a and b have exactly the same common divisors as b and a mod b. Repeat until the remainder is 0; the last non-zero remainder is the gcd.',
    'Each division is many subtractions at once, which is why it is fast: the remainder at least halves every two divisions. Consecutive Fibonacci numbers are the worst case.',
    'Bézout: the gcd can always be written as a·x + b·y. The table finds x and y by keeping r = s·a + t·b true on every row.',
    'a·x + b·y = c has integer solutions exactly when gcd(a, b) divides c. From one solution, all the others are x₀ + k·b/g and y₀ − k·a/g.',
    'Try a = 233 and b = 144, then a = 252 and b = 84. Read the Divisions card for both, and see how the last squares tile each rectangle.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    [
      'Euclid’s algorithm',
      'O(log min(a, b)) divisions',
      'After any two divisions the larger number has at least halved, so the numbers shrink fast.',
    ],
    [
      'By subtraction only',
      'O(max(a, b) / g) steps',
      'One subtraction per square: for a = 999 and b = 1 that is 999 squares against 1 division.',
    ],
    [
      'Extended Euclid',
      'O(log min(a, b)) divisions',
      'The same divisions, with a constant amount of extra work for s and t on each.',
    ],
    [
      'Memory',
      'O(1)',
      'Only two rows are ever needed. This page keeps all of them so you can read them.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'What is gcd(252, 105)?',
      answer: 21,
      hints: ['Divide: 252 = 2·105 + 42. Now find gcd(105, 42).'],
      solution:
        '252 = 2·105 + 42, then 105 = 2·42 + 21, then 42 = 2·21 + 0. The last non-zero remainder is 21.',
    },
    {
      type: 'number',
      prompt:
        'Load “240 and 46” and step to the end. How many squares does the rectangle split into?',
      answer: 13,
      unit: 'squares',
      hints: ['Add up the q column, or read the Squares card at the last step.'],
      solution:
        'The quotients are 5, 4, 1, 1 and 2, and each q cuts q squares: 5 + 4 + 1 + 1 + 2 = 13.',
    },
    {
      type: 'number',
      prompt: 'gcd(240, 46) = 2 and 240·(−9) + 46·y = 2. What is y?',
      answer: 47,
      hints: ['Compute 240·(−9) first, then ask what 46·y must be.'],
      solution:
        '240·(−9) = −2160, so 46·y = 2162 and y = 47. The table’s row for r = 2 shows the same.',
    },
    {
      type: 'choice',
      prompt: 'Does 6x + 9y = 7 have a solution in integers?',
      options: [
        'Yes, since 6 and 9 are positive',
        'No, since gcd(6, 9) = 3 does not divide 7',
        'Yes, but only with negative x',
      ],
      answer: 1,
      hints: ['Whatever x and y are, 6x + 9y is always a multiple of some number.'],
      solution:
        'Both 6x and 9y are multiples of 3, so their sum is too. 7 is not a multiple of 3, so no integers work.',
    },
    {
      type: 'number',
      prompt:
        'Among the integer solutions of 7x + 5y = 3, what is the smallest x that is not negative?',
      answer: 4,
      hints: [
        'Type a = 7, b = 5, c = 3 into the widget and step to the end, or try x = 0, 1, 2, … and look for a multiple of 5.',
      ],
      solution:
        'x = 0, 1, 2, 3 leave 3, −4, −11, −18, none a multiple of 5. x = 4 leaves 3 − 28 = −25 = 5·(−5), so x = 4 and y = −5.',
    },
  ],
  nextTeaser:
    'Next up: Modular arithmetic and fast exponentiation, where a power with a huge exponent takes only a few dozen multiplications.',
};
