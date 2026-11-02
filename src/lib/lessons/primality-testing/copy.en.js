/** @typedef {import('$lib/algo-engine/primality-testing.js').PrimalityFrame} PrimalityFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {number} v */
const big = (v) => v.toLocaleString('en-US');

export const en = {
  slug: 'primality-testing',
  topic: 'number-theory',
  level: 'Advanced',
  title: 'Primality testing',
  intro:
    'Is one large number prime? Trial division answers for certain but takes about √n steps. The Fermat test checks a^(n−1) ≡ 1 (mod n) for a few bases, and a failure proves n composite without finding a factor, yet Carmichael numbers slip through. Miller-Rabin also inspects the squarings on the way to a^(n−1), which closes that gap and leads to the test used in practice.',
  summary:
    'Test numbers for primality by trial division, by the Fermat test, and by Miller-Rabin, watching witnesses and liars for each base.',
  instruction:
    'Choose a method, a number and some bases, then step. Each row of the table is one base, and a row ending in ✗ is a witness that proves n composite. Load 561 with Fermat, where every chosen base lies, then switch to Miller-Rabin and watch base 2 catch it.',
  methodLabel: 'Method',
  methods: { trial: 'Trial division', fermat: 'Fermat', miller: 'Miller-Rabin' },
  fields: { n: 'Number n', bases: 'Bases a' },
  presetLabel: 'Example',
  presets: {
    smallPrime: 'Prime: 97',
    semiprime: '9991 = 97 · 103',
    carmichael: 'Carmichael: 561',
    fools: 'Strong pseudoprime: 2047',
    billion: 'Prime: 10⁹ + 7',
    mersenne: 'Prime: 2³¹ − 1',
  },
  /** @param {number} max */
  nError: (max) => `n must be a whole number from 2 to ${big(max)}.`,
  /** @param {number} maxBase @param {number} maxBases */
  basesErrors: (maxBase, maxBases) => ({
    format: 'Type bases as whole numbers separated by commas or spaces.',
    range: `Each base must be from 2 to ${big(maxBase)}.`,
    count: `Use from 1 to ${maxBases} bases.`,
  }),
  roundsTitle: {
    fermat: 'One row per base: a^(n − 1) mod n',
    miller: 'One row per base: x, then x² each time',
  },
  trialTitle: 'Trial division up to √n',
  /** @param {PrimalityFrame} f */
  decomposition: (f) => `n − 1 = ${f.n - 1} = 2^${f.s} · ${f.d}`,
  decompositionWaiting: 'Waiting to split n − 1',
  baseHead: 'a',
  valuesHead: 'x',
  outcomeHead: 'Result',
  outcomes: {
    pass: '✓ passes',
    witness: '✗ witness',
    skip: '– skipped',
    running: '…',
  },
  minusOne: '= n − 1',
  rowsEmpty: 'No base tried yet.',
  skippedNote: 'Trial division uses no bases.',
  /** @param {number} d @param {number} limit */
  trialProgress: (d, limit) => `d = ${big(d)} of at most ${big(limit)}`,
  trialWaiting: 'Waiting to start',
  recentTitle: 'Divisors just tried',
  recentEmpty: 'none yet',
  legend: {
    current: 'x computed now',
    good: 'x = 1 or n − 1: passes',
    bad: 'Witness: n is composite',
  },
  stats: {
    verdict: 'Verdict',
    cost: { trial: 'Divisions', fermat: 'Multiplications', miller: 'Multiplications' },
    tested: 'Bases tried',
    liars: { fermat: 'Fermat liars among all bases', miller: 'Strong liars among all bases' },
    divisor: 'Divisor found',
    limit: 'Largest d to try',
  },
  verdicts: {
    pending: '…',
    prime: 'Prime',
    composite: 'Composite',
    probable: 'Probably prime',
    unknown: 'Not tested',
  },
  /** @param {number} liars @param {number} bases */
  liarValue: (liars, bases) => `${liars} of ${bases}`,
  liarsNone: 'n/a',
  /** @param {PrimalityFrame} f */
  describe(f) {
    const { n, d, s, limit, divisor, method } = f;
    const round = f.rounds.at(-1);
    const a = round?.a;
    const x = round?.values.at(-1);
    switch (f.kind) {
      case 'start':
        return method === 'trial'
          ? `Is ${big(n)} prime? Look for a divisor up to √n.`
          : method === 'fermat'
            ? `Is ${big(n)} prime? If it is, every base a must give a^${big(n - 1)} ≡ 1 (mod n).`
            : `Is ${big(n)} prime? If it is, the only square roots of 1 modulo n are 1 and n − 1.`;
      case 'small':
        return `${n} is 2 or 3, which are prime.`;
      case 'even':
        return `${big(n)} is even and larger than 2, so 2 divides it and it is composite.`;
      case 'try':
        return `No divisor among the odd numbers up to ${big(d)}. Keep going while d·d ≤ ${big(n)}.`;
      case 'divisor':
        return `${big(n)} = ${big(divisor)} · ${big(n / divisor)}, so it is composite. It took ${plural(f.divisions, 'check', 'checks')}.`;
      case 'decompose':
        return `Split off the powers of two: ${big(n - 1)} = 2^${s} · ${big(d)}, so a^(n−1) comes from a^${big(d)} by squaring ${plural(s, 'time', 'times')}.`;
      case 'skip':
        return `Base ${a} is outside 2 to n − 2, so it tells nothing. Skip it.`;
      case 'power':
        return method === 'fermat'
          ? `Base ${a}: a^${big(n - 1)} mod ${big(n)} = ${big(Number(x))}.`
          : `Base ${a}: x = a^${big(d)} mod ${big(n)} = ${big(Number(x))}.`;
      case 'square':
        return `Square: x = ${big(Number(x))}${x === 1 ? '. The last x was a square root of 1 other than ±1, which a prime cannot have' : ''}.`;
      case 'pass':
        return method === 'fermat'
          ? `Base ${a} gives 1, so it passes. That is not proof: a composite n can pass too.`
          : `Base ${a} passes: x is ${x === 1 ? '1' : 'n − 1'} here, as it would be if n were prime.`;
      case 'witness':
        return method === 'fermat'
          ? `a^${big(n - 1)} is not 1, so ${a} is a witness and ${big(n)} is composite, even though no factor was found.`
          : `After all the squarings x never reached n − 1, so ${a} is a witness and ${big(n)} is composite.`;
      case 'verdict':
        if (method === 'trial') {
          return `No d up to ${big(limit)} divides ${big(n)}, so it is prime, after ${plural(f.divisions, 'check', 'checks')}.`;
        }
        if (f.verdict === 'unknown') return 'No usable base, so the test could not say anything.';
        return f.verdict === 'prime'
          ? `Bases 2, 3, 5 and 7 all pass, and that settles every n below 3,215,031,751: ${big(n)} is prime.`
          : `Every base passed, so ${big(n)} is probably prime. Passing is evidence, not proof.`;
      case 'done':
        return `Done: ${this.verdicts[f.verdict ?? 'pending'].toLowerCase()}, using ${
          method === 'trial'
            ? plural(f.divisions, 'division', 'divisions')
            : plural(f.multiplications, 'multiplication', 'multiplications')
        }.`;
    }
  },
  takeaways: [
    'Trial division is certain, and a divisor must appear by √n. For a 19-digit number that already means billions of steps.',
    'Fermat’s little theorem: for a prime n and a not divisible by n, a^(n−1) ≡ 1 (mod n). If this fails for some a, that a is a witness, and n is composite even though no factor is known.',
    'Carmichael numbers such as 561 pass Fermat for every base coprime to them, so more rounds do not always help.',
    'Miller-Rabin adds one check: x² ≡ 1 with x not ±1 proves n composite. A composite n passes for at most a quarter of the bases, so k random rounds err with probability at most 4⁻ᵏ.',
    'Load 561 with Miller-Rabin, then read the liar card, then try 2047 with bases 2 and 3 to see one base fooled and the next one catch it.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    [
      'Trial division',
      'O(√n)',
      'A composite n has a divisor at most √n. Exact, but hopeless for 100-digit numbers.',
    ],
    [
      'Fermat, k bases',
      'O(k log n)',
      'One fast power of about 2·log₂ n multiplications per base. Carmichael numbers can fool it.',
    ],
    [
      'Miller-Rabin, k bases',
      'O(k log n)',
      'One fast power plus at most s squarings per base. Error at most 4⁻ᵏ on random bases.',
    ],
    ['Memory', 'O(1)', 'Only x and the counters. This page keeps the rows so you can read them.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Run trial division on 9991. What divisor does it find first?',
      answer: 97,
      hints: ['Load “9991 = 97 · 103” with Trial division and step to the end.'],
      solution:
        'The loop tries odd d from 3. Nothing divides 9991 until d = 97, since 9991 = 97 · 103 and both factors are prime.',
    },
    {
      type: 'number',
      prompt: 'For n = 561, Miller-Rabin writes n − 1 = 2^s · d with d odd. What is s?',
      answer: 4,
      hints: ['Keep halving 560 until the result is odd, and count the halvings.'],
      solution: '560 → 280 → 140 → 70 → 35 is four halvings, so 560 = 2⁴ · 35.',
    },
    {
      type: 'multi',
      prompt: 'Run the Fermat test on 561 = 3 · 11 · 17. Which of these bases are witnesses?',
      options: ['2', '3', '5', '7', '11'],
      answers: [1, 4],
      hints: ['Try the bases in the widget, or ask which ones share a factor with 561.'],
      solution:
        '561 is a Carmichael number, so every base coprime to it passes. Only 3 and 11, which share a factor with 561, fail.',
    },
    {
      type: 'choice',
      prompt: 'The Fermat test says 341 passes for base 2. What does that prove?',
      options: [
        '341 is prime',
        '341 is composite',
        'Nothing certain: 341 = 11 · 31 passes base 2 anyway, and base 3 shows it',
      ],
      answer: 2,
      hints: ['A pass is only evidence. Try base 3 in the widget.'],
      solution:
        'A pass never proves primality. 341 = 11 · 31 is a Fermat pseudoprime to base 2, and 3³⁴⁰ mod 341 = 56 exposes it.',
    },
    {
      type: 'number',
      prompt: 'Run Miller-Rabin on 2047 with bases 2 and 3. Which base is the witness?',
      answer: 3,
      hints: ['Load “Strong pseudoprime: 2047” and read the last row.'],
      solution:
        '2047 = 23 · 89 is a strong pseudoprime to base 2, so base 2 passes. Base 3 is a witness.',
    },
    {
      type: 'text',
      prompt: 'What is the cost of trial division on n, in big-O notation?',
      accept: ['O(√n)', 'O(sqrt(n))', 'O(sqrt n)', 'O(n^0.5)', '√n', 'sqrt(n)'],
      hints: ['If n = p·q with p ≤ q, how large can p be?'],
      solution:
        'A composite n has a divisor at most √n, so the loop runs at most about √n / 2 times.',
    },
  ],
  nextTeaser:
    'Next up: Combinatorics: binomials and Catalan numbers, where Pascal’s triangle counts choices modulo a prime.',
};
