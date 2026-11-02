/** @typedef {import('$lib/algo-engine/modular-inverse-crt.js').ModFrame} ModFrame */
/** @typedef {import('$lib/algo-engine/modular-inverse-crt.js').ModClock} ModClock */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Plain text for a number that may be negative. @param {number} v */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

export const en = {
  slug: 'modular-inverse-crt',
  topic: 'number-theory',
  level: 'Intermediate',
  title: 'Modular inverse and Chinese remainder theorem',
  intro:
    'The inverse of a modulo m is the number x with a·x ≡ 1 (mod m): it is how you divide when only remainders exist. It exists exactly when gcd(a, m) = 1. With inverses you can also solve several congruences at once: the Chinese remainder theorem says that remainders for pairwise coprime moduli pin down exactly one number modulo their product.',
  summary:
    'Find a modular inverse with extended Euclid or Fermat, then combine congruences one at a time until every clock points at its remainder.',
  instruction:
    'In “Solve a system”, type congruences such as 2 mod 3, 3 mod 5, then step. Each clock’s hand shows the candidate modulo that clock, and ◆ marks where it must point. Watch the walk: adding M never moves a clock that is already aligned. In “Inverse”, watch the hand fall to 1, and compare the two methods.',
  taskLabel: 'Task',
  tasks: { crt: 'Solve a system', inverse: 'Inverse' },
  methodLabel: 'Method',
  methods: { euclid: 'Extended Euclid', fermat: 'Fermat' },
  fields: { a: 'Number a', m: 'Modulus m', system: 'Congruences, as r mod m' },
  presetLabel: 'Example',
  inversePresets: {
    simple: '3 mod 7',
    noInverse: '4 mod 6: no inverse',
    bigPrime: '1234 mod 9973',
  },
  crtPresets: {
    sunTzu: 'Sun Tzu: answer 23',
    four: 'Four clocks',
    shared: 'Moduli share a factor',
    conflict: 'No solution',
  },
  /** @param {number} max */
  aError: (max) => `a must be a whole number from 0 to ${max}.`,
  /** @param {number} max */
  mError: (max) => `m must be a whole number from 2 to ${max}.`,
  primeError: 'Fermat’s method needs a prime modulus. Use Extended Euclid for this one.',
  /** @param {number} maxM @param {number} maxR @param {number} maxN */
  systemErrors: (maxM, maxR, maxN) => ({
    format: 'Write each congruence as r mod m, separated by commas, for example 2 mod 3, 3 mod 5.',
    range: `Each modulus must be from 2 to ${maxM}, and each remainder at most ${maxR}.`,
    count: `Use at most ${maxN} congruences.`,
  }),
  clocksTitle: 'Clocks: one per modulus',
  inverseClockTitle: 'Clock modulo m: the hand shows a·x',
  /** @param {ModClock} c @param {string} role */
  clockAria: (c, role) =>
    `Clock modulo ${c.m}: the hand points at ${c.value}, and it must point at ${c.goal}. ${role}`,
  clockRoles: {
    aligned: 'Aligned',
    merged: 'Merged: it stays aligned',
    now: 'Being solved',
    later: 'Waiting',
  },
  clockMarkers: { aligned: '✓', merged: '✓', now: '→', later: '·' },
  /** @param {ModClock} c */
  clockCaption: (c) => `x ≡ ${c.goal} (mod ${c.m})`,
  /** @param {ModClock} c */
  inverseCaption: (c) => `a·x ≡ ${c.value} (mod ${c.m})`,
  legend: {
    goal: '◆ Where the hand must point',
    aligned: '✓ Hand on its mark',
    now: '→ Being solved',
    later: '· Waiting',
  },
  /** Text for a table cell, so a negative number reads with a typographic minus. @param {number|string|null} v */
  cellText: (v) => (typeof v === 'number' ? num(v) : String(v ?? '')),
  tableTitle: {
    euclid: 'Rows keep r ≡ t·a (mod m)',
    fermat: 'Squaring toward a^(p − 2)',
    crt: 'Merged so far: x ≡ R (mod M)',
  },
  tableHead: {
    euclid: ['r', 'q', 't'],
    fermat: ['e', 'bit', 'y', 'x'],
    crt: ['clocks', 'R', 'M'],
  },
  /** @param {string} name */
  tableAria: (name) => `Working table: ${name}.`,
  /** @param {string} head @param {number} row @param {string} value @param {string} state */
  tableCell: (head, row, value, state) =>
    `Row ${row}, ${head}: ${value || 'blank'}${state ? `, ${state}` : ''}`,
  cellStates: { fresh: 'newest row', answer: 'gives the answer', bad: 'not 1' },
  cellMarkers: { fresh: '+', answer: '★', bad: '✗' },
  stats: {
    inverse: 'Inverse x',
    check: 'a·x mod m',
    rounds: { euclid: 'Divisions', fermat: 'Loop rounds' },
    gcd: 'gcd(a, m)',
    multiplications: 'Multiplications',
    candidate: 'Candidate x',
    M: 'Step size M',
    walked: 'Steps walked',
    solution: 'Solution',
  },
  statNone: 'none',
  /** @param {ModFrame} f */
  solutionValue(f) {
    if (f.solvable === null) return '…';
    return f.solvable ? `${f.R} mod ${f.M}` : this.statNone;
  },
  /** @param {ModFrame} f */
  describe(f) {
    return f.mode === 'crt'
      ? this.describeSystem(f)
      : f.mode === 'euclid'
        ? this.describeEuclid(f)
        : this.describeFermat(f);
  },
  /** @param {ModFrame} f */
  describeEuclid(f) {
    const { a, m, g, inverse } = f;
    const row = /** @type {number[]} */ (f.rows.at(-1));
    const answerRow = /** @type {number[]} */ (f.rows.at(-2));
    switch (f.kind) {
      case 'start':
        return `Find x with ${a}·x ≡ 1 (mod ${m}). The rows start from ${m} ≡ 0·a and ${a % m} ≡ 1·a.`;
      case 'step':
        return `q = ${row[1]}, so the new row is r = ${row[0]}, t = ${num(row[2])}. That says ${num(row[2])}·a ≡ ${row[0]} (mod ${m}), which is where the hand points.`;
      case 'found':
        return `The last non-zero remainder is 1, so ${num(answerRow[2])}·a ≡ 1 (mod ${m}). Reduced, the inverse is x = ${inverse}.`;
      case 'none':
        return `gcd(${a}, ${m}) = ${g}, not 1. Every a·x mod ${m} is a multiple of ${g}, so the hand can never reach 1: there is no inverse.`;
      default:
        return inverse === null
          ? `Done: ${a} has no inverse modulo ${m}, as they share the factor ${g}.`
          : `Done: ${a}·${inverse} ≡ 1 (mod ${m}), after ${plural(f.steps, 'division', 'divisions')}.`;
    }
  },
  /** @param {ModFrame} f */
  describeFermat(f) {
    const { a, m, inverse } = f;
    const row = /** @type {number[]} */ (f.rows.at(-1));
    switch (f.kind) {
      case 'start':
        if (a % m === 0) return `Find the inverse of ${a} modulo ${m} with Fermat’s theorem.`;
        return `${m} is prime, so a^${m - 1} ≡ 1 (mod ${m}) and a^${m - 2} is the inverse. Compute it by squaring, from e = ${m - 2}.`;
      case 'bit':
        return row[1] === 1
          ? `e = ${row[0]} is odd, so x picks up y = ${row[2]} and becomes ${row[3]}. Square y and halve e.`
          : `e = ${row[0]} is even, so x stays ${row[3]}. Square y and halve e.`;
      case 'found':
        return `e is 0, so x = a^${m - 2} mod ${m} = ${inverse}. Check: ${a % m}·${inverse} mod ${m} = 1.`;
      case 'none':
        return `${a} ≡ 0 (mod ${m}), and 0 has no inverse.`;
      default:
        return inverse === null
          ? `Done: ${a} has no inverse modulo ${m}.`
          : `Done: the inverse is ${inverse}, after ${plural(f.multiplications, 'multiplication', 'multiplications')}.`;
    }
  },
  /** @param {ModFrame} f */
  describeSystem(f) {
    const { R, M, g, u, t, k } = f;
    const c = f.next >= 0 ? f.system[f.next] : null;
    switch (f.kind) {
      case 'start':
        return `Start with the first congruence: x ≡ ${R} (mod ${M}). The candidate is ${R}.`;
      case 'merge':
        return `Next: x ≡ ${c?.r} (mod ${c?.m}). Any candidate ${R} + k·${M} keeps the merged clocks in place, because ${M} is a multiple of their moduli. Here gcd(${M}, ${c?.m}) = ${g}.`;
      case 'conflict':
        return `R + k·M always leaves ${R % g} modulo ${g}, but this congruence needs ${Number(c?.r) % g}. No candidate can fit, so the system has no solution.`;
      case 'inverse':
        return t === 0
          ? `The clock modulo ${c?.m} is already on its mark, so no steps are needed.`
          : `The inverse of ${M / g} modulo ${Number(c?.m) / g} is ${u}, so the clock needs t = ${t} ${t === 1 ? 'step' : 'steps'} of ${M}. Walk them to see it.`;
      case 'walk':
        return k === t
          ? `k = ${k}: x = ${f.candidate}. The clock modulo ${c?.m} lands on ${c?.r}, just as the inverse predicted, and the merged clocks never moved.`
          : `k = ${k}: x = ${f.candidate}. Only the clock modulo ${c?.m} moves.`;
      case 'combine':
        return `Merged: x ≡ ${R} (mod ${M}). The new step size ${M} is the least common multiple of the moduli so far.`;
      default:
        return f.solvable
          ? `Done: x ≡ ${R} (mod ${M}). The smallest solution that is not negative is ${R}, and every clock points at its mark.`
          : 'Done: these congruences contradict each other, so no number satisfies them all.';
    }
  },
  takeaways: [
    'a has an inverse modulo m exactly when gcd(a, m) = 1. If they share a factor g, every a·x mod m is a multiple of g and never 1.',
    'Extended Euclid finds it from a·x + m·y = 1 and works for any modulus. Fermat gives a^(p − 2), but only when the modulus p is prime.',
    'The Chinese remainder theorem: pairwise coprime moduli give exactly one solution modulo their product. Moduli that share a factor g may conflict, and when they agree the solution is modulo their least common multiple.',
    'Merge one congruence at a time. Adding the current M keeps the merged clocks aligned, so x = R + t·M only has to fix the next clock, and an inverse gives t without walking.',
    'Try “Sun Tzu”, then change 2 mod 7 to 3 mod 7 and see where the answer lands. Then try “No solution” and read why the walk never starts.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    [
      'Inverse by Euclid',
      'O(log m)',
      'The same divisions as gcd(a, m), and it works for any modulus.',
    ],
    ['Inverse by Fermat', 'O(log p)', 'Fast power with exponent p − 2. The modulus must be prime.'],
    [
      'System of k congruences',
      'O(k log M)',
      'One gcd and one inverse for each merge, where M is the final modulus.',
    ],
    [
      'Walking instead of using an inverse',
      'O(m) per merge',
      'Up to m candidates to try for the next clock: fine by hand, slow for a large modulus.',
    ],
    ['Memory', 'O(k)', 'The congruences, plus R and M.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'What is the inverse of 3 modulo 7?',
      answer: 5,
      hints: ['Try 3·1, 3·2, 3·3, … modulo 7 until you reach 1, or run the Inverse task.'],
      solution: '3·5 = 15 = 2·7 + 1, so 3·5 ≡ 1 (mod 7).',
    },
    {
      type: 'multi',
      prompt: 'Which of these have an inverse modulo 12?',
      options: ['5', '6', '7', '9'],
      answers: [0, 2],
      hints: ['A number has an inverse modulo 12 exactly when it shares no factor with 12.'],
      solution:
        'gcd(5, 12) = 1 and gcd(7, 12) = 1, so those have inverses. gcd(6, 12) = 6 and gcd(9, 12) = 3, so those do not.',
    },
    {
      type: 'number',
      prompt: 'Using Fermat, the inverse of 2 modulo 11 is 2⁹ mod 11. What is it?',
      answer: 6,
      hints: ['2⁹ = 512. Divide by 11, or run the Fermat method with a = 2 and m = 11.'],
      solution: '512 = 46·11 + 6, so the inverse is 6. Check: 2·6 = 12 ≡ 1 (mod 11).',
    },
    {
      type: 'number',
      prompt:
        'Sun Tzu’s puzzle: x leaves 2 when divided by 3, 3 when divided by 5, and 2 when divided by 7. What is the smallest such positive x?',
      answer: 23,
      hints: ['Load the Sun Tzu example and step to the end.'],
      solution:
        '2 mod 3 and 3 mod 5 merge to 8 mod 15. Then 8, 23: 23 mod 7 = 2, so x = 23, and the solutions repeat every 105.',
    },
    {
      type: 'choice',
      prompt: 'Does the system x ≡ 1 (mod 4), x ≡ 2 (mod 6) have a solution?',
      options: [
        'Yes, since each congruence has a solution',
        'No, since the first makes x odd and the second makes x even',
        'Yes, but only modulo 24',
      ],
      answer: 1,
      hints: ['4 and 6 share the factor 2. What does each congruence say about x modulo 2?'],
      solution:
        'x ≡ 1 (mod 4) forces x to be odd, and x ≡ 2 (mod 6) forces x to be even. No number is both.',
    },
    {
      type: 'number',
      prompt:
        'The system x ≡ 1 (mod 4), x ≡ 3 (mod 6) has solutions. Modulo what number do they repeat?',
      answer: 12,
      hints: ['Load “Moduli share a factor” and read M at the last step.'],
      solution:
        'The moduli share the factor 2, so solutions repeat every lcm(4, 6) = 12, not every 24. The smallest is x = 9.',
    },
  ],
  nextTeaser:
    'Next up: Sieve of Eratosthenes and factorisation, which finds every prime up to n by crossing out multiples.',
};
