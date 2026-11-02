/** @typedef {import('$lib/algo-engine/sieve-factorisation.js').SieveFrame} SieveFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'sieve-factorisation',
  topic: 'number-theory',
  level: 'Beginner',
  title: 'Sieve of Eratosthenes and factorisation',
  intro:
    'To find every prime up to n, do not test each number. Start from 2 and cross out the multiples of each prime you reach: whatever survives is prime. If each number also remembers the first prime that crossed it out, its smallest prime factor, the same table factorises any number up to n in a handful of divisions.',
  summary:
    'Cross out multiples prime by prime to find all primes up to n in O(n log log n), and factorise with a smallest-prime-factor table.',
  instruction:
    'Pick n and step. Each prime crosses out its multiples, and the small number in a cell’s corner is the prime that got there first. Switch “Start crossing at” to 2p and compare the crossings. Click or press Enter on any cell to factorise that number.',
  fields: { n: 'Numbers up to n', x: 'Factorise x' },
  startLabel: 'Start crossing at',
  starts: { square: 'p·p', double: '2p' },
  presetLabel: 'Example',
  presets: {
    small: 'Up to 30',
    classic: 'Up to 60',
    hundred: 'Up to 100',
    large: 'Up to 200',
  },
  /** @param {number} max */
  nError: (max) => `n must be a whole number from 2 to ${max}.`,
  /** @param {number} n */
  xError: (n) => `x must be a whole number from 2 to ${n}.`,
  /** @param {number} v */
  pickError: (v) => `${v} has no prime factors. Pick a number from 2 up.`,
  gridTitle: 'Number grid',
  /** @param {number} n */
  gridAria: (n) => `The numbers from 1 to ${n}, ten to a row.`,
  /** @param {number} v @param {string} state */
  cellLabel: (v, state) => `${v}${state ? `, ${state}` : ''}`,
  states: {
    unit: 'neither prime nor composite',
    current: 'the prime p crossing now',
    first: 'crossed out for the first time',
    again: 'crossed out again',
    crossed: 'crossed out',
    prime: 'prime',
    factor: 'what is left of x',
    pending: 'not decided yet',
  },
  /** @param {number} spf */
  spfMark: (spf) => `${spf}`,
  markers: { unit: '–', current: 'p', prime: '★', factor: '↓' },
  legend: {
    current: 'p Crossing now',
    first: 'Crossed out now',
    again: 'Crossed out again',
    crossed: 'Crossed out; corner: smallest prime factor',
    prime: '★ Prime',
    factor: '↓ What is left of x',
  },
  stats: {
    p: 'Current p',
    crossings: 'Crossings',
    repeats: 'Repeated crossings',
    primes: 'Primes found',
    square: 'Total starting at p·p',
    double: 'Total starting at 2p',
  },
  primesTitle: 'Primes',
  primesEmpty: 'none yet',
  factorsTitle: 'Prime factors of x',
  factorsEmpty: 'none yet',
  /** @param {SieveFrame} f */
  describe(f) {
    const { n, p, j, x, s, rest } = f;
    switch (f.kind) {
      case 'start':
        return `Write the numbers up to ${n}. Every number from 2 up might be prime, and each is its own smallest factor for now.`;
      case 'skip':
        return `${p} is already crossed out, so it is not prime. Its multiples are multiples of ${f.spf[p]} too, so skip it.`;
      case 'prime':
        return `${p} was never crossed out, so it is prime. Cross out its multiples from ${s}${f.from === 'square' ? `, since smaller ones have a smaller factor` : ''}.`;
      case 'cross':
        return f.first
          ? `Cross out ${j} = ${p}·${j / p}. It is the first time, so its smallest prime factor is ${p}.`
          : `${j} = ${p}·${j / p} was already crossed out by ${f.spf[j]}. This crossing is wasted work.`;
      case 'stop':
        return `${p}·${p} = ${p * p} is past ${n}, so any composite up to ${n} already has a smaller factor crossed out. All that remain are prime: ${plural(f.primes.length, 'prime', 'primes')}.`;
      case 'factorStart':
        return `Now factorise x = ${x} with the table: keep dividing by the smallest prime factor.`;
      case 'factor': {
        const was = rest * /** @type {number} */ (f.factors.at(-1));
        return `spf[${was}] = ${f.factors.at(-1)}, so record it and go on with ${was} / ${f.factors.at(-1)} = ${rest}.`;
      }
      case 'done':
        return `Done: ${x} = ${f.factors.join(' · ')}, after ${plural(f.crossings, 'crossing', 'crossings')}.`;
    }
  },
  takeaways: [
    'A number that no smaller prime has crossed out is prime, so primes reveal themselves in order.',
    'Crossing can start at p·p: any smaller multiple p·k has a factor k < p, so a smaller prime already crossed it out. The same fact lets p stop once p·p passes n.',
    'The first prime to cross out a number is its smallest prime factor, which gives the table spf.',
    'With spf, factorising takes one division per prime factor. Each division at least halves x, so it costs at most log₂ x divisions.',
    'Try n = 200 with both starting points and compare the totals. Then click 180, then 197: one has several factors, the other none but itself.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    [
      'Sieve',
      'O(n log log n)',
      'Each prime p crosses about n/p numbers, and the sum of 1/p over primes up to n grows like log log n.',
    ],
    ['Factorise with spf', 'O(log x)', 'Each division removes a factor of at least 2.'],
    [
      'Trial division on every number',
      'O(n√n)',
      'Testing each number up to its square root does far more work than the sieve.',
    ],
    ['Memory', 'O(n)', 'One table entry per number up to n.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Load “Up to 30” and step until the primes are all known. How many crossings did it take, starting at p·p?',
      answer: 24,
      unit: 'crossings',
      hints: [
        'Read the Crossings card. By hand: multiples of 2 from 4, of 3 from 9, of 5 from 25.',
      ],
      solution:
        'Multiples of 2 from 4: 14. Of 3 from 9: 8. Of 5 from 25: 2. That is 14 + 8 + 2 = 24.',
    },
    {
      type: 'number',
      prompt: 'How many primes are there up to 200? Step the sieve to the end to find out.',
      answer: 46,
      unit: 'primes',
      hints: ['Load “Up to 200” and read the Primes found card at the last step.'],
      solution: 'The sieve leaves 46 numbers uncrossed, from 2 to 199.',
    },
    {
      type: 'number',
      prompt: 'For n = 100, what is the largest p that ever crosses anything out?',
      answer: 7,
      hints: ['p must be prime, and p·p must be at most 100.'],
      solution: '7·7 = 49 ≤ 100, but the next prime 11 has 11·11 = 121 > 100.',
    },
    {
      type: 'number',
      prompt: 'What is the smallest prime factor of 91?',
      answer: 7,
      hints: ['91 is odd, and not a multiple of 3 or 5. Try 7, or click 91 on a grid up to 100.'],
      solution: '91 = 7·13, and 2, 3 and 5 do not divide it, so spf[91] = 7.',
    },
    {
      type: 'order',
      prompt: 'Using the spf table on x = 84, in what order are the factors recorded?',
      items: ['7', '3', '2', '2'],
      answer: [2, 3, 1, 0],
      hints: ['Divide by the smallest prime factor each time: 84, then 42, then 21, then 7.'],
      solution: '84 → 2, 42 → 2, 21 → 3, 7 → 7. So 84 = 2·2·3·7.',
    },
    {
      type: 'choice',
      prompt: 'Why can the crossing for p = 7 start at 49 and not at 14?',
      options: [
        'Because 14, 21, 28, 35 and 42 are not multiples of 7',
        'Because each of them has a factor smaller than 7, so a smaller prime already crossed it out',
        'Because numbers below 49 are all prime',
      ],
      answer: 1,
      hints: ['Write each one as 7·k. What can you say about k?'],
      solution:
        'Each is 7·k with k < 7, so k has a prime factor below 7 and that prime already crossed the number out.',
    },
  ],
  nextTeaser:
    'Next up: Primality testing, which decides whether one huge number is prime without any table, using witnesses.',
};
