/** @typedef {import('$lib/algo-engine/ternary-search.js').TernaryFrame} TernaryFrame */
/** @typedef {import('$lib/algo-engine/ternary-search.js').Shape} Shape */

/** @param {number} k @param {string} one @param {string} many */
const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;

/** Three decimals, the precision the plot can show. @param {number} x */
const fmt = (x) => x.toFixed(3);

export const en = {
  slug: 'ternary-search',
  topic: 'searching',
  level: 'Intermediate',
  title: 'Ternary search',
  intro:
    'A unimodal function climbs to a single peak and then falls. Ternary search finds that peak without derivatives: probe the function at two points that split the interval into thirds, and the lower probe tells you which outer third cannot hold the peak.',
  summary:
    'Close in on the peak of a unimodal function by probing two points and throwing away a third of the interval each round.',
  instruction:
    'Pick a curve and drag the peak slider, choose the stopping width ε, then step: each round places probes m1 and m2, compares f(m1) with f(m2) and greys out the third that cannot hold the peak. Tick Zoom to follow a narrow interval. Try “Two peaks” to see what goes wrong.',
  takeaways: [
    'Unimodal means strictly rising up to the peak and strictly falling after it. Then the lower of f(m1) and f(m2) lies on a slope, away from the peak.',
    'If f(m1) < f(m2), the peak is not in [lo, m1), so lo = m1. Otherwise it is not in (m2, hi], so hi = m2. One third is discarded per round.',
    'The search runs over real numbers, so it stops when hi − lo ≤ ε. The width shrinks to 2/3 per round: about log₁.₅((b − a) / ε) rounds, each with 2 evaluations of f.',
    'On a function with two peaks the rule still stops, but it can throw away the higher peak in the first round. Unimodality is not optional.',
    'Try the same curve at ε = 0.5 and ε = 0.001: 7 rounds against 22. Each extra digit of precision costs about 5.7 more rounds.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    ['Rounds', 'O(log((b − a) / ε))', 'The width is multiplied by 2/3 per round.'],
    [
      'Evaluations of f',
      '2 per round',
      'f(m1) and f(m2); golden-section search reuses one and needs 1.',
    ],
    ['On integers', 'O(log n)', 'The same rule on an index range, until three or fewer remain.'],
    ['Memory', 'O(1)', 'lo, hi and the two probes.'],
  ],
  nextTeaser:
    'Next up: Practice: searching problems, where you debug binary searches that loop forever or miss the target.',
  shapeLabel: 'Curve',
  shapes: /** @type {Record<Shape, string>} */ ({
    parabola: 'Parabola',
    tent: 'Tent',
    bell: 'Bell',
    'two-peaks': 'Two peaks',
  }),
  /** @param {number} p */
  peakLabel: (p) => `Peak at x = ${p.toFixed(1)}`,
  epsLabel: 'Stop at width ε',
  zoomLabel: 'Zoom to [lo, hi]',
  /** @param {string} name @param {number} lo @param {number} hi */
  plotLabel: (name, lo, hi) =>
    `Plot of the ${name} curve on [0, 6]. The peak is still possible in [${fmt(lo)}, ${fmt(hi)}]; the rest is discarded.`,
  legend: {
    curve: 'f(x)',
    kept: 'Interval [lo, hi] still kept',
    cut: 'Discarded: cannot hold the peak',
    probe: 'Probes m1 and m2',
    answer: 'Answer (lo + hi) / 2',
  },
  stats: {
    rounds: 'Rounds',
    evaluations: 'Evaluations of f',
    width: 'Width hi − lo',
    predicted: 'Rounds needed for ε',
  },
  intervalsTitle: 'Interval after each round',
  intervalsEmpty: 'No round yet',
  /** @param {number} lo @param {number} hi */
  interval: (lo, hi) => `[${fmt(lo)}, ${fmt(hi)}]`,
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Set ε = 0.01 on any curve. How many evaluations of f does the search make before it stops?',
      answer: 32,
      unit: 'evaluations',
      hints: [
        'Step to the end and read the Evaluations card.',
        'The width 6 must shrink by 2/3 per round until it is at most 0.01; that takes 16 rounds.',
      ],
      solution:
        '6 × (2/3)¹⁶ ≈ 0.009 ≤ 0.01, while 15 rounds leave about 0.014. 16 rounds × 2 evaluations = 32.',
    },
    {
      type: 'choice',
      prompt:
        'Parabola with its peak at 3.7: the first probes are m1 = 2 and m2 = 4, with f(2) ≈ 3.555 and f(4) ≈ 4.955. What does the search do?',
      options: [
        'lo = 2: the peak cannot be left of m1.',
        'hi = 4: the peak cannot be right of m2.',
        'It stops: the peak is between the probes.',
        'It discards the middle third [2, 4].',
      ],
      answer: 0,
      hints: [
        'Step once past the first probe frame.',
        'f(m1) < f(m2): the left probe is lower, so it sits on the rising slope.',
      ],
      solution:
        'f(m1) < f(m2), so m1 is on the rising side of the peak and nothing in [0, 2) can be the peak: lo = 2. The kept interval [2, 6] is two thirds of the old one.',
    },
    {
      type: 'choice',
      prompt:
        'Pick “Two peaks” and step to the end. Why does it report x ≈ 4 when the curve is highest near 0.8?',
      options: [
        'ε is too large.',
        'The curve is not unimodal, so the first round threw away the third that held the higher peak.',
        'Ternary search finds minimums, not maximums.',
        'The probes were rounded to whole numbers.',
      ],
      answer: 1,
      hints: [
        'Watch the first round: f(2) ≈ 0.646 and f(4) ≈ 3.2.',
        'Which third is greyed out after that comparison?',
      ],
      solution:
        'f(2) < f(4), so the search discards [0, 2) and with it the tall peak at 0.8. The rule is only safe when there is a single peak; here it settles on the local peak near 4.',
    },
    {
      type: 'number',
      prompt:
        'What fraction of the interval is left after one round? Give it as a decimal to three places.',
      answer: 0.667,
      tolerance: 0.001,
      hints: [
        'Compare the width card before and after one cut.',
        'Each round discards one of three equal thirds.',
      ],
      solution:
        'Two of the three thirds survive: 2/3 ≈ 0.667. That is why the round count grows with log base 1.5 of the width over ε.',
    },
  ],
  /** @param {TernaryFrame} f @param {number} eps @param {(x: number) => number} fn @param {Shape} shape */
  describe(f, eps, fn, shape) {
    switch (f.kind) {
      case 'start':
        return `Look for the highest point of f on [${fmt(f.lo)}, ${fmt(f.hi)}]. Each round keeps two thirds of the interval, until it is at most ε = ${eps} wide.`;
      case 'probe':
        return `Probe the thirds: f(m1) = f(${fmt(f.m1)}) = ${fmt(f.f1)} and f(m2) = f(${fmt(f.m2)}) = ${fmt(f.f2)}, so f(m1) ${f.f1 < f.f2 ? '<' : '≥'} f(m2).`;
      case 'cut-left':
        return `f(m1) < f(m2): m1 is on the rising slope, so the peak is not left of it. lo = ${fmt(f.lo)}; the interval is now ${fmt(f.hi - f.lo)} wide.`;
      case 'cut-right':
        return `f(m1) ≥ f(m2): m2 is on the falling slope, so the peak is not right of it. hi = ${fmt(f.hi)}; the interval is now ${fmt(f.hi - f.lo)} wide.`;
      case 'done': {
        const head = `Width ${fmt(f.hi - f.lo)} ≤ ε. The peak is at about x = ${fmt(f.answer)}, f(x) = ${fmt(fn(f.answer))}, after ${plural(f.iterations, 'round', 'rounds')} and ${plural(f.evaluations, 'evaluation', 'evaluations')}.`;
        return shape === 'two-peaks'
          ? `${head} But this curve has two peaks: the higher one, near x = 0.8 with f ≈ 5.018, was discarded in the first round.`
          : head;
      }
    }
  },
};
