/** @typedef {import('$lib/algo-engine/online-algorithms.js').SkiFrame} SkiFrame */
/** @typedef {import('$lib/algo-engine/online-algorithms.js').PagingFrame} PagingFrame */
/** @typedef {import('$lib/algo-engine/online-algorithms.js').Policy} Policy */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** At most two decimals, with no trailing zeros. @param {number} v */
const num = (v) => (Number.isFinite(v) ? String(Math.round(v * 100) / 100) : '∞');

/** @type {Record<Policy, string>} */
const POLICY_NAMES = { lru: 'LRU', fifo: 'FIFO', opt: 'OPT' };

export const en = {
  slug: 'online-algorithms',
  topic: 'computation-models',
  level: 'Nâng cao',
  title: 'Thuật toán trực tuyến và phân tích cạnh tranh',
  intro:
    'An online algorithm must decide as the input arrives, without seeing what comes next. We judge it by its competitive ratio: in the worst case, how much more it pays than the best offline solution, which knew the whole input in advance. Ski rental and paging are the two classic examples.',
  summary:
    'Play ski rental against a hidden or adversarial season and watch your cost against the optimum, then race LRU, FIFO and the offline OPT on a paging sequence you type.',
  instruction:
    'In Ski rental, press Rent today or Buy today and see your ratio when the season ends, or fix a plan and drag the season length to find its worst case. In Paging, type a request sequence, set the cache size k, and step to compare the faults of LRU, FIFO and OPT.',
  modeLabel: 'Problem',
  modes: { ski: 'Ski rental', paging: 'Paging' },
  priceLabel: 'Skis cost b',
  strategyLabel: 'Plan',
  strategies: { play: 'You decide', fixed: 'Buy on day k', never: 'Never buy' },
  buyDayLabel: 'Buy on day k',
  seasonLabel: 'Season length d',
  seasonRuleLabel: 'Season ends',
  seasonRules: { random: 'Secretly', adversary: 'Adversary' },
  rent: 'Rent today',
  buy: 'Buy today',
  newSeason: 'New season',
  notices: {
    over: 'The season is over. Press New season to play again.',
    format: 'Use the letters A to Z only, one per request.',
    empty: 'Type at least one request.',
    length: 'Use at most 30 requests.',
  },
  daysTitle: 'Your season',
  /** @param {number} n */
  daysAria: (n) => `Your season so far: ${plural(n, 'day', 'days')}.`,
  dayMarks: { rent: 'R', buy: 'B', own: '✓' },
  /** @param {number} day @param {'rent'|'buy'|'own'} a */
  dayLabel: (day, a) =>
    `Day ${day}: ${a === 'rent' ? 'rented, 1' : a === 'buy' ? 'bought the skis' : 'skied on your own skis, 0'}`,
  dayLegend: {
    rent: 'R Rented (1)',
    buy: 'B Bought (b)',
    own: '✓ Own skis (0)',
  },
  noDays: 'No days yet: rent or buy for day 1.',
  curveTitle: 'Ratio for every season length',
  /** @param {string} worst */
  curveAria: (worst) => `Ratio of this plan for seasons of 1 to 30 days; the worst is ${worst}.`,
  /** @param {number} d @param {number} r */
  barLabel: (d, r) => `Season of ${plural(d, 'day', 'days')}: ratio ${num(r)}`,
  /** @param {number} k @param {number} b */
  curveNote: (k, b) =>
    k === 0
      ? `Never buying: the ratio d/b keeps growing with the season, so it has no bound.`
      : `Worst case: the season ends on day ${k}, right after buying, for (k − 1 + b)/min(k, b) = ${num((k - 1 + b) / Math.min(k, b))}. The best plan, k = b, guarantees 2 − 1/b = ${num(2 - 1 / b)}.`,
  worstMark: '▲',
  seasonMark: '●',
  curveLegend: { worst: '▲ Worst season for this plan', season: '● This season' },
  skiStats: {
    day: 'Day',
    cost: 'Your cost',
    opt: 'Optimum min(d, b)',
    ratio: 'Ratio',
  },
  num,
  /** @param {number} r */
  planRatio: (r) =>
    Number.isFinite(r)
      ? `This plan’s competitive ratio: ${num(r)}.`
      : 'This plan’s competitive ratio: unbounded.',
  kLabel: 'Cache size k',
  requestsLabel: 'Requests',
  presetLabel: 'Example',
  presets: { belady: 'Belady’s', locality: 'Locality', loop: 'Loop of k + 1' },
  requestsAria: 'Request sequence',
  policyNames: POLICY_NAMES,
  policyNotes: {
    lru: 'evicts the least recently used page',
    fifo: 'evicts the page loaded earliest',
    opt: 'offline: evicts the page needed furthest ahead',
  },
  /** @param {string} policy @param {number} faults */
  cacheAria: (policy, faults) => `${policy} cache, ${plural(faults, 'fault', 'faults')} so far.`,
  /** @param {string | null} page @param {string} state */
  slotLabel: (page, state) => `${page ?? 'empty'}${state ? `, ${state}` : ''}`,
  slotStates: { hit: 'hit', loaded: 'loaded now' },
  slotMarks: { hit: '✓', loaded: '+' },
  /** @param {string} page */
  evicted: (page) => `out: ${page}`,
  /** @param {number} f */
  faults: (f) => plural(f, 'fault', 'faults'),
  pagingLegend: {
    hit: '✓ Hit: the page was cached',
    loaded: '+ Fault: the page is loaded now',
  },
  pagingStats: {
    request: 'Request',
    lru: 'LRU faults',
    fifo: 'FIFO faults',
    opt: 'OPT faults',
  },
  /** @param {number} t @param {number} n */
  request: (t, n) => `${t} / ${n}`,
  /** @param {number} lru @param {number} opt @param {number} k */
  boundNote: (lru, opt, k) =>
    `LRU / OPT = ${opt === 0 ? '—' : num(lru / opt)}; LRU is k-competitive: never more than k · OPT = ${k * opt}.`,
  /**
   * @param {SkiFrame} f @param {number} b
   * @param {{plan: 'play'|'fixed'|'never', k: number, rule: 'random'|'adversary'}} ctx
   */
  describeSki(f, b, ctx) {
    const ratio = f.opt === 0 ? 0 : f.cost / f.opt;
    switch (f.kind) {
      case 'start':
        return ctx.plan === 'play'
          ? `Skis cost ${b}; renting costs 1 a day. ${ctx.rule === 'adversary' ? 'An adversary ends the season at the worst moment for you.' : 'The season ends on a secret day.'} Rent or buy for day 1.`
          : `Skis cost ${b}; renting costs 1 a day. The plan ${ctx.plan === 'never' ? 'rents every day' : `rents until day ${ctx.k - 1} and buys on day ${ctx.k}`}.`;
      case 'day': {
        const a = f.actions[f.day - 1];
        const what =
          a === 'rent'
            ? 'You rent: +1.'
            : a === 'buy'
              ? `You buy the skis: +${b}.`
              : 'You ski on your own skis: +0.';
        return `Day ${f.day}: ${what} Cost ${f.cost}. Had the season ended today, the optimum would pay min(${f.day}, ${b}) = ${f.opt}: ratio ${num(ratio)}.`;
      }
      case 'done':
        if (!f.over)
          return f.day === 0
            ? `Skis cost ${b}; renting costs 1 a day. Rent or buy for day 1.`
            : `After day ${f.day} you have paid ${f.cost}. The season goes on: rent or buy for day ${f.day + 1}.`;
        return `The season lasted ${plural(f.day, 'day', 'days')}. You paid ${f.cost}; knowing d, the optimum pays min(${f.day}, ${b}) = ${f.opt}. Ratio ${num(ratio)}${ratio <= 2 - 1 / b + 1e-9 ? ', within the break-even guarantee 2 − 1/b.' : ', worse than the break-even plan’s 2 − 1/b = ' + num(2 - 1 / b) + '.'}`;
    }
  },
  /** @param {PagingFrame} f @param {string[]} req @param {number} k */
  describePaging(f, req, k) {
    switch (f.kind) {
      case 'start':
        return `${plural(req.length, 'request', 'requests')} and a cache of ${plural(k, 'page', 'pages')}. All three caches start empty; only OPT may look ahead.`;
      case 'request': {
        const page = req[f.t];
        const parts = /** @type {Policy[]} */ (['lru', 'fifo', 'opt']).map((q) => {
          const s = f.policies[q];
          if (s.hit) return `${POLICY_NAMES[q]} hits`;
          return s.evicted
            ? `${POLICY_NAMES[q]} faults and evicts ${s.evicted}`
            : `${POLICY_NAMES[q]} faults`;
        });
        return `Request ${f.t + 1}, page ${page}: ${parts.join('; ')}.`;
      }
      case 'done': {
        const { lru, fifo, opt } = f.policies;
        return `Done: LRU ${lru.faults}, FIFO ${fifo.faults}, OPT ${opt.faults} faults. No online rule can know the future, so OPT is the yardstick: LRU made ${opt.faults === 0 ? 'no' : num(lru.faults / opt.faults) + ' times as many'} faults.`;
      }
    }
  },
  takeaways: [
    'An online algorithm decides without seeing the future. Its competitive ratio is the worst case, over all inputs, of its cost divided by the offline optimum’s cost.',
    'Ski rental: renting until the total rent would reach the price, then buying on day b, never pays more than 2 − 1/b times the optimum, and no deterministic plan does better. The worst season ends right after you buy.',
    'Paging: OPT evicts the page needed furthest in the future, which needs the whole sequence. LRU is k-competitive: on a cache of k pages it never makes more than k times OPT’s faults, and a loop over k + 1 pages makes it fault on every request.',
    'FIFO is k-competitive too, but it can fault more with a bigger cache (Belady’s anomaly); LRU never does.',
    'Try it: with You decide and Adversary, try to beat 2 − 1/b. Then load Belady’s sequence in Paging and compare FIFO’s faults at k = 3 and k = 4.',
  ],
  complexityHead: ['Algorithm', 'Competitive ratio or time', 'Why'],
  complexity: [
    [
      'Ski rental, buy on day b',
      '2 − 1/b',
      'If d < b you pay d, the optimum; otherwise you pay b − 1 + b against the optimum’s b.',
    ],
    ['Buy on day 1', 'b', 'A one-day season costs you b against 1.'],
    ['Never buy', 'Unbounded', 'A season of d days costs d against b.'],
    [
      'Paging with LRU or FIFO',
      'k',
      'Split the requests into phases of k distinct pages: LRU faults at most k times per phase, OPT at least once.',
    ],
    [
      'Paging, time per request',
      'O(k) online, O(k + n) for OPT',
      'Look up the page and pick a victim among k slots; OPT also scans the n requests ahead.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Choose Buy on day k with b = 10 and k = 10. What is the worst ratio of this plan over all season lengths?',
      answer: 1.9,
      tolerance: 0.001,
      hints: ['Look for ▲ in the ratio chart, or set the season length to 10 days.'],
      solution:
        'If the season ends on day 10 you pay 9 + 10 = 19 while the optimum buys (or rents) for 10: 19/10 = 1.9 = 2 − 1/b.',
    },
    {
      type: 'number',
      prompt: 'Keep b = 10 and set k = 1 (buy at once). What is the plan’s worst ratio now?',
      answer: 10,
      hints: ['A short season is the bad case for buying early.'],
      solution:
        'A one-day season costs 10 for the skis, while the optimum rents for 1: ratio 10 = b.',
    },
    {
      type: 'number',
      prompt:
        'In Paging, load Belady’s example with k = 3 (A B C D A B E A B C D E). How many faults does OPT make?',
      answer: 7,
      unit: 'faults',
      hints: ['Press Last step and read OPT faults.'],
      solution:
        'OPT faults on the first four requests and on E, C and D: 7 faults, against 10 for LRU and 9 for FIFO.',
    },
    {
      type: 'choice',
      prompt: 'On the same sequence, raise k from 3 to 4. What happens to FIFO?',
      options: [
        'It faults less, as every rule should',
        'It faults more: 10 instead of 9',
        'It faults exactly as often',
        'It becomes optimal',
      ],
      answer: 1,
      hints: ['Read FIFO faults at both sizes.'],
      solution:
        'This is Belady’s anomaly: FIFO makes 9 faults with 3 pages and 10 with 4. LRU drops from 10 to 8, as a stack algorithm never gets worse with a bigger cache.',
    },
  ],
  nextTeaser: 'Bài tiếp theo: Luyện tập: chọn mô hình tính toán.',
};
