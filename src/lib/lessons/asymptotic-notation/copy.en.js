/** @typedef {import('$lib/algo-engine/asymptotic-notation.js').AsymptoticFrame} AsymptoticFrame */
/** @typedef {import('$lib/algo-engine/asymptotic-notation.js').GrowthKey} GrowthKey */
/** @typedef {import('$lib/algo-engine/asymptotic-notation.js').Poly} Poly */

const SUP = /** @type {Record<string, string>} */ ({
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
});

/** A readable number: whole numbers in full with commas, others to 4 significant digits. @param {number} x */
function fmt(x) {
  if (Number.isInteger(x)) return x.toLocaleString('en-US');
  return x.toLocaleString('en-US', { maximumSignificantDigits: 4 });
}

/** @param {Poly} p */
function polyText(p) {
  const terms = [];
  if (p.a) terms.push(`${p.a === 1 ? '' : p.a}n²`);
  if (p.b) terms.push(`${p.b === 1 ? '' : p.b}n`);
  if (p.c) terms.push(String(p.c));
  return terms.join(' + ') || '0';
}

/** @type {Record<GrowthKey, string>} */
const NAMES = { n: 'n', nlogn: 'n log n', n2: 'n²', exp: '2ⁿ' };

export const en = {
  slug: 'asymptotic-notation',
  topic: 'complexity',
  level: 'Beginner',
  title: 'Asymptotic notation: Big-O, Omega, Theta',
  intro:
    'Exact step counts such as 3n² + 20n + 50 are precise but noisy. Asymptotic notation keeps only how fast the count grows as n gets large: Big-O is an upper bound, Omega a lower bound, and Theta both at once.',
  summary:
    'Plot a function against n, n log n, n² and 2ⁿ on a log scale and decide whether it is O, Omega or Theta of a chosen bound.',
  instruction:
    'Set the coefficients of f(n) = a·n² + b·n + c and pick a bound g(n), then step n upward. Watch the ratio f(n)/g(n): it settles, shrinks toward 0, or keeps growing.',
  fields: { a: 'a (n²)', b: 'b (n)', c: 'c', maxN: 'Largest n' },
  boundLegend: 'Bound g(n)',
  names: NAMES,
  fieldError:
    'Coefficients must be whole numbers: a from 0 to 10, b from 0 to 100, c from 0 to 1000.',
  zeroError: 'f(n) must not be 0 everywhere: give at least one coefficient a positive value.',
  maxNError: 'Largest n must be a whole number from 2 to 40.',
  plotScroller: 'Growth plot, scrolls sideways',
  fLabel: 'f(n)',
  /** @param {string} name */
  boundLabel: (name) => `${name} (bound g)`,
  /** @param {AsymptoticFrame} f @param {Poly} p @param {GrowthKey} bound */
  plotLabel: (f, p, bound) =>
    f.n === 0
      ? `Empty log-scale plot of f(n) = ${polyText(p)} against ${NAMES[bound]}.`
      : `Log-scale plot up to n = ${f.n}: f(n) = ${fmt(/** @type {number} */ (f.f))}, ${NAMES[bound]} = ${fmt(/** @type {number} */ (f.g))}.`,
  /** @param {number} k */
  decade: (k) => (k === 0 ? '1' : `10${String(k).replace(/\d/g, (d) => SUP[d])}`),
  axisN: 'n',
  stats: {
    f: 'f(n)',
    g: 'g(n)',
    ratio: 'Ratio f(n) / g(n)',
    lead: 'Share of f from its leading term',
  },
  noValue: '—',
  fmt,
  polyText,
  /** @param {number} share */
  percent: (share) => `${(share * 100).toFixed(1)}%`,
  valuesTitle: 'Values at this n',
  verdictTitle: 'Verdict',
  verdictPending: 'Step to the end to see the verdict.',
  /** @type {Record<import('$lib/algo-engine/asymptotic-notation.js').Verdict, string>} */
  verdictShort: { theta: 'Θ (tight)', 'big-o': 'O only (upper)', omega: 'Ω only (lower)' },
  practiceTitle: 'Check yourself',
  /** @param {AsymptoticFrame} f @param {Poly} p @param {GrowthKey} bound */
  describe(f, p, bound) {
    const g = NAMES[bound];
    switch (f.kind) {
      case 'start':
        return `f(n) = ${polyText(p)}. Step to evaluate it against g(n) = ${g} for n = 1, 2, 3, …`;
      case 'eval':
        return f.ratio === null
          ? `n = ${f.n}: f(n) = ${fmt(/** @type {number} */ (f.f))} and ${g} = 0, so the ratio is undefined here.`
          : `n = ${f.n}: f(n) = ${fmt(/** @type {number} */ (f.f))}, ${g} = ${fmt(/** @type {number} */ (f.g))}, ratio ${fmt(f.ratio)}.`;
      case 'done': {
        const w = /** @type {import('$lib/algo-engine/asymptotic-notation.js').Witness} */ (
          f.witness
        );
        const fp = `f(n) = ${polyText(p)}`;
        if (w.verdict === 'theta')
          return `${fp} = Θ(${g}): ${w.lower}·${g} ≤ f(n) ≤ ${w.upper}·${g} for every n ≥ 1, so the ratio stays between ${w.lower} and ${w.upper}.`;
        if (w.verdict === 'big-o')
          return `${fp} = O(${g}) but not Ω(${g}): f(n) ≤ ${w.upper}·${g} for every n ≥ ${w.upperFrom}, and the ratio shrinks toward 0.`;
        return `${fp} = Ω(${g}) but not O(${g}): f(n) ≥ ${w.lower}·${g} for every n ≥ 1, and the ratio grows without bound.`;
      }
    }
  },
  takeaways: [
    'f(n) = O(g(n)) means there are constants c > 0 and n₀ with f(n) ≤ c·g(n) for every n ≥ n₀: g is an upper bound, up to a constant factor, for large n.',
    'f(n) = Ω(g(n)) is the matching lower bound, f(n) ≥ c·g(n) for every n ≥ n₀; Θ means both, so f and g grow at the same rate.',
    'Only the dominant term matters: in 3n² + 20n + 50 the n² term takes over as n grows, so the whole sum is Θ(n²) and the constants 3, 20, 50 drop out.',
    'From slowest to fastest: 1 < log n < n < n log n < n² < 2ⁿ. On the log-scale plot 2ⁿ is a straight line that leaves every polynomial behind.',
    'Try a = 0, b = 100, c = 1000 against n² with largest n 40: f starts far above n², yet the ratio falls from 1,100 at n = 1 to about 3 at n = 40 and keeps falling toward 0, so f = O(n²) but not Θ(n²).',
  ],
  complexityHead: ['Notation', 'Meaning', 'Definition'],
  complexity: [
    ['f = O(g)', 'f ≤ c·g', 'Upper bound: for some c > 0, n₀ and every n ≥ n₀.'],
    ['f = Ω(g)', 'f ≥ c·g', 'Lower bound: for some c > 0, n₀ and every n ≥ n₀.'],
    ['f = Θ(g)', 'c₁·g ≤ f ≤ c₂·g', 'Both bounds at once: f and g grow at the same rate.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt: 'Give the tight bound of f(n) = 4n² + 100n + 7 in Θ notation.',
      accept: ['Θ(n²)', 'Theta(n²)', 'Θ n²', 'n²'],
      hints: ['Keep the dominant term and drop its constant factor.'],
      solution:
        'For large n the 4n² term dominates: 4n² ≤ f(n) ≤ 111n² for every n ≥ 1, so f(n) = Θ(n²).',
    },
    {
      type: 'multi',
      prompt: 'Let f(n) = 5n + 3. Which statements are true?',
      options: ['f(n) = O(n)', 'f(n) = O(n²)', 'f(n) = Ω(n²)', 'f(n) = Θ(n)'],
      answers: [0, 1, 3],
      hints: [
        'Big-O is only an upper bound, so a looser upper bound is still true.',
        'Set a = 0, b = 5, c = 3 and try the bounds n and n² in the widget.',
      ],
      solution:
        '5n ≤ 5n + 3 ≤ 8n for n ≥ 1 gives Θ(n), hence O(n). n² grows faster, so f = O(n²) too, but f is not Ω(n²): the ratio (5n + 3)/n² falls toward 0.',
    },
    {
      type: 'number',
      prompt:
        'With f(n) = 3n² + 20n + 50 and g(n) = n², what is the smallest whole n₀ such that f(n) ≤ 4·g(n) for every n ≥ n₀?',
      answer: 23,
      hints: [
        'f(n) ≤ 4n² is the same as n² ≥ 20n + 50.',
        'In the widget, find the first n where the ratio f(n)/g(n) drops to 4 or below.',
      ],
      solution:
        'n² − 20n − 50 ≥ 0 holds for n ≥ 10 + √150 ≈ 22.2. At n = 22: 484 < 490, so it fails; at n = 23: 529 ≥ 510, so n₀ = 23 (ratio ≈ 3.96).',
    },
    {
      type: 'order',
      prompt: 'Order these growth rates from slowest to fastest.',
      items: ['n²', 'log n', '2ⁿ', 'n log n', 'n'],
      answer: [1, 4, 3, 0, 2],
      hints: ['Compare them at n = 1024, where log₂ n = 10.'],
      solution:
        'At n = 1024: log n = 10, n = 1024, n log n = 10,240, n² ≈ 1 million, and 2ⁿ has 309 digits. So log n < n < n log n < n² < 2ⁿ.',
    },
  ],
  nextTeaser:
    'Next up: analysing loops and recursion, where a recursion tree turns a recurrence into a sum.',
};
