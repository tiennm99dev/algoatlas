/** @typedef {import('$lib/algo-engine/online-algorithms.js').SkiFrame} SkiFrame */
/** @typedef {import('$lib/algo-engine/online-algorithms.js').PagingFrame} PagingFrame */
/** @typedef {import('$lib/algo-engine/online-algorithms.js').Policy} Policy */

/** At most two decimals, with no trailing zeros. @param {number} v */
const num = (v) => (Number.isFinite(v) ? String(Math.round(v * 100) / 100) : '∞');

/** @type {Record<Policy, string>} */
const POLICY_NAMES = { lru: 'LRU', fifo: 'FIFO', opt: 'OPT' };

export const vi = {
  slug: 'online-algorithms',
  topic: 'computation-models',
  level: 'Nâng cao',
  title: 'Thuật toán trực tuyến và phân tích cạnh tranh',
  intro:
    'Thuật toán trực tuyến phải quyết định ngay khi đầu vào tới, mà không thấy được phần sau. Ta đánh giá nó bằng tỉ số cạnh tranh (competitive ratio): trong trường hợp xấu nhất, nó tốn nhiều hơn bao nhiêu lần so với lời giải ngoại tuyến tốt nhất, vốn biết trước toàn bộ đầu vào. Bài toán thuê ván trượt và bài toán phân trang là hai ví dụ kinh điển.',
  summary:
    'Chơi bài toán thuê ván trượt với một mùa trượt bí mật hoặc do đối thủ chọn và so chi phí của bạn với tối ưu, rồi cho LRU, FIFO và OPT ngoại tuyến thi đấu trên một dãy yêu cầu phân trang do bạn gõ.',
  instruction:
    'Ở Thuê ván trượt, bấm Thuê hôm nay hoặc Mua hôm nay và xem tỉ số của bạn khi mùa kết thúc, hoặc chọn sẵn một kế hoạch rồi kéo độ dài mùa để tìm trường hợp xấu nhất của nó. Ở Phân trang, gõ một dãy yêu cầu, đặt kích thước cache k, rồi chạy từng bước để so số lỗi trang của LRU, FIFO và OPT.',
  modeLabel: 'Bài toán',
  modes: { ski: 'Thuê ván trượt', paging: 'Phân trang' },
  priceLabel: 'Giá mua ván b',
  strategyLabel: 'Kế hoạch',
  strategies: { play: 'Bạn tự quyết', fixed: 'Mua vào ngày k', never: 'Không bao giờ mua' },
  buyDayLabel: 'Mua vào ngày k',
  seasonLabel: 'Độ dài mùa d',
  seasonRuleLabel: 'Mùa kết thúc',
  seasonRules: { random: 'Bí mật', adversary: 'Do đối thủ chọn' },
  rent: 'Thuê hôm nay',
  buy: 'Mua hôm nay',
  newSeason: 'Mùa mới',
  notices: {
    over: 'Mùa trượt đã kết thúc. Bấm Mùa mới để chơi lại.',
    format: 'Chỉ dùng các chữ cái từ A đến Z, mỗi yêu cầu một chữ.',
    empty: 'Hãy gõ ít nhất một yêu cầu.',
    length: 'Dùng tối đa 30 yêu cầu.',
  },
  daysTitle: 'Mùa trượt của bạn',
  /** @param {number} n */
  daysAria: (n) => `Mùa trượt của bạn tới lúc này: ${n} ngày.`,
  dayMarks: { rent: 'T', buy: 'M', own: '✓' },
  /** @param {number} day @param {'rent'|'buy'|'own'} a */
  dayLabel: (day, a) =>
    `Ngày ${day}: ${a === 'rent' ? 'thuê, 1' : a === 'buy' ? 'mua ván' : 'trượt bằng ván của mình, 0'}`,
  dayLegend: {
    rent: 'T Thuê (1)',
    buy: 'M Mua (b)',
    own: '✓ Ván của mình (0)',
  },
  noDays: 'Chưa có ngày nào: hãy thuê hoặc mua cho ngày 1.',
  curveTitle: 'Tỉ số với mọi độ dài mùa',
  /** @param {string} worst */
  curveAria: (worst) =>
    `Tỉ số của kế hoạch này với các mùa dài từ 1 đến 30 ngày; xấu nhất là ${worst}.`,
  /** @param {number} d @param {number} r */
  barLabel: (d, r) => `Mùa dài ${d} ngày: tỉ số ${num(r)}`,
  /** @param {number} k @param {number} b */
  curveNote: (k, b) =>
    k === 0
      ? `Không bao giờ mua: tỉ số d/b cứ tăng theo độ dài mùa, nên không bị chặn.`
      : `Trường hợp xấu nhất: mùa kết thúc vào ngày ${k}, ngay sau khi mua, cho (k − 1 + b)/min(k, b) = ${num((k - 1 + b) / Math.min(k, b))}. Kế hoạch tốt nhất, k = b, đảm bảo 2 − 1/b = ${num(2 - 1 / b)}.`,
  worstMark: '▲',
  seasonMark: '●',
  curveLegend: { worst: '▲ Mùa xấu nhất cho kế hoạch này', season: '● Mùa hiện tại' },
  skiStats: {
    day: 'Ngày',
    cost: 'Chi phí của bạn',
    opt: 'Tối ưu min(d, b)',
    ratio: 'Tỉ số',
  },
  num,
  /** @param {number} r */
  planRatio: (r) =>
    Number.isFinite(r)
      ? `Tỉ số cạnh tranh của kế hoạch này: ${num(r)}.`
      : 'Tỉ số cạnh tranh của kế hoạch này: không bị chặn.',
  kLabel: 'Kích thước cache k',
  requestsLabel: 'Dãy yêu cầu',
  presetLabel: 'Ví dụ',
  presets: { belady: 'Dãy của Belady', locality: 'Tính cục bộ', loop: 'Vòng k + 1 trang' },
  requestsAria: 'Dãy yêu cầu',
  policyNames: POLICY_NAMES,
  policyNotes: {
    lru: 'đẩy ra trang lâu chưa dùng nhất',
    fifo: 'đẩy ra trang được nạp sớm nhất',
    opt: 'ngoại tuyến: đẩy ra trang lâu nữa mới cần',
  },
  /** @param {string} policy @param {number} faults */
  cacheAria: (policy, faults) => `Cache ${policy}, ${faults} lỗi trang tới lúc này.`,
  /** @param {string | null} page @param {string} state */
  slotLabel: (page, state) => `${page ?? 'trống'}${state ? `, ${state}` : ''}`,
  slotStates: { hit: 'trúng', loaded: 'vừa nạp' },
  slotMarks: { hit: '✓', loaded: '+' },
  /** @param {string} page */
  evicted: (page) => `ra: ${page}`,
  /** @param {number} f */
  faults: (f) => `${f} lỗi trang`,
  pagingLegend: {
    hit: '✓ Trúng: trang đã có trong cache',
    loaded: '+ Lỗi trang: trang vừa được nạp',
  },
  pagingStats: {
    request: 'Yêu cầu',
    lru: 'Lỗi trang LRU',
    fifo: 'Lỗi trang FIFO',
    opt: 'Lỗi trang OPT',
  },
  /** @param {number} t @param {number} n */
  request: (t, n) => `${t} / ${n}`,
  /** @param {number} lru @param {number} opt @param {number} k */
  boundNote: (lru, opt, k) =>
    `LRU / OPT = ${opt === 0 ? '—' : num(lru / opt)}; LRU là k-cạnh tranh: không bao giờ quá k · OPT = ${k * opt}.`,
  /**
   * @param {SkiFrame} f @param {number} b
   * @param {{plan: 'play'|'fixed'|'never', k: number, rule: 'random'|'adversary'}} ctx
   */
  describeSki(f, b, ctx) {
    const ratio = f.opt === 0 ? 0 : f.cost / f.opt;
    switch (f.kind) {
      case 'start':
        return ctx.plan === 'play'
          ? `Mua ván giá ${b}; thuê tốn 1 mỗi ngày. ${ctx.rule === 'adversary' ? 'Một đối thủ sẽ kết thúc mùa vào lúc tệ nhất cho bạn.' : 'Mùa kết thúc vào một ngày bí mật.'} Hãy thuê hoặc mua cho ngày 1.`
          : `Mua ván giá ${b}; thuê tốn 1 mỗi ngày. Kế hoạch ${ctx.plan === 'never' ? 'thuê mọi ngày' : `thuê tới ngày ${ctx.k - 1} và mua vào ngày ${ctx.k}`}.`;
      case 'day': {
        const a = f.actions[f.day - 1];
        const what =
          a === 'rent'
            ? 'Bạn thuê: +1.'
            : a === 'buy'
              ? `Bạn mua ván: +${b}.`
              : 'Bạn trượt bằng ván của mình: +0.';
        return `Ngày ${f.day}: ${what} Chi phí ${f.cost}. Nếu mùa kết thúc hôm nay, tối ưu sẽ trả min(${f.day}, ${b}) = ${f.opt}: tỉ số ${num(ratio)}.`;
      }
      case 'done':
        if (!f.over)
          return f.day === 0
            ? `Mua ván giá ${b}; thuê tốn 1 mỗi ngày. Hãy thuê hoặc mua cho ngày 1.`
            : `Sau ngày ${f.day} bạn đã trả ${f.cost}. Mùa vẫn tiếp tục: hãy thuê hoặc mua cho ngày ${f.day + 1}.`;
        return `Mùa trượt kéo dài ${f.day} ngày. Bạn đã trả ${f.cost}; nếu biết trước d, tối ưu trả min(${f.day}, ${b}) = ${f.opt}. Tỉ số ${num(ratio)}${ratio <= 2 - 1 / b + 1e-9 ? ', nằm trong mức đảm bảo hoà vốn 2 − 1/b.' : ', tệ hơn mức 2 − 1/b = ' + num(2 - 1 / b) + ' của kế hoạch hoà vốn.'}`;
    }
  },
  /** @param {PagingFrame} f @param {string[]} req @param {number} k */
  describePaging(f, req, k) {
    switch (f.kind) {
      case 'start':
        return `${req.length} yêu cầu và một cache chứa ${k} trang. Cả ba cache đều bắt đầu trống; chỉ OPT được nhìn trước.`;
      case 'request': {
        const page = req[f.t];
        const parts = /** @type {Policy[]} */ (['lru', 'fifo', 'opt']).map((q) => {
          const s = f.policies[q];
          if (s.hit) return `${POLICY_NAMES[q]} trúng`;
          return s.evicted
            ? `${POLICY_NAMES[q]} lỗi trang và đẩy ${s.evicted} ra`
            : `${POLICY_NAMES[q]} lỗi trang`;
        });
        return `Yêu cầu ${f.t + 1}, trang ${page}: ${parts.join('; ')}.`;
      }
      case 'done': {
        const { lru, fifo, opt } = f.policies;
        return `Xong: lỗi trang của LRU là ${lru.faults}, FIFO ${fifo.faults}, OPT ${opt.faults}. Không quy tắc trực tuyến nào biết trước tương lai, nên OPT là thước đo: LRU ${opt.faults === 0 ? 'không có lỗi trang nào để so' : `có số lỗi trang gấp ${num(lru.faults / opt.faults)} lần`}.`;
      }
    }
  },
  takeaways: [
    'Thuật toán trực tuyến quyết định mà không thấy tương lai. Tỉ số cạnh tranh của nó là trường hợp xấu nhất, trên mọi đầu vào, của chi phí của nó chia cho chi phí của tối ưu ngoại tuyến.',
    'Thuê ván trượt: thuê cho tới khi tổng tiền thuê sắp bằng giá mua, rồi mua vào ngày b, thì không bao giờ trả quá 2 − 1/b lần tối ưu, và không kế hoạch tất định nào làm tốt hơn. Mùa tệ nhất kết thúc ngay sau khi bạn mua.',
    'Phân trang: OPT đẩy ra trang lâu nữa mới cần nhất, nên nó phải biết cả dãy yêu cầu. LRU là k-cạnh tranh: với cache k trang, nó không bao giờ lỗi trang quá k lần số lỗi của OPT, và một vòng lặp qua k + 1 trang làm nó lỗi ở mọi yêu cầu.',
    'FIFO cũng là k-cạnh tranh, nhưng có thể lỗi nhiều hơn khi cache lớn hơn (nghịch lí Belady); LRU thì không bao giờ như vậy.',
    'Thử xem: với Bạn tự quyết và Do đối thủ chọn, hãy thử vượt mức 2 − 1/b. Rồi mở Dãy của Belady ở Phân trang và so số lỗi trang của FIFO khi k = 3 và k = 4.',
  ],
  complexityHead: ['Thuật toán', 'Tỉ số cạnh tranh hoặc thời gian', 'Vì sao'],
  complexity: [
    [
      'Thuê ván trượt, mua vào ngày b',
      '2 − 1/b',
      'Nếu d < b bạn trả d, đúng bằng tối ưu; nếu không bạn trả b − 1 + b so với b của tối ưu.',
    ],
    ['Mua ngay ngày 1', 'b', 'Mùa chỉ một ngày làm bạn tốn b so với 1.'],
    ['Không bao giờ mua', 'Không bị chặn', 'Mùa dài d ngày tốn d so với b.'],
    [
      'Phân trang với LRU hoặc FIFO',
      'k',
      'Chia dãy yêu cầu thành các pha gồm k trang khác nhau: LRU lỗi nhiều nhất k lần mỗi pha, OPT ít nhất một lần.',
    ],
    [
      'Phân trang, thời gian mỗi yêu cầu',
      'O(k) khi trực tuyến, O(k + n) với OPT',
      'Tra trang và chọn trang bị đẩy ra trong k ô; OPT còn phải quét n yêu cầu phía trước.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chọn Mua vào ngày k với b = 10 và k = 10. Tỉ số xấu nhất của kế hoạch này trên mọi độ dài mùa là bao nhiêu?',
      answer: 1.9,
      tolerance: 0.001,
      hints: ['Tìm dấu ▲ trên biểu đồ tỉ số, hoặc đặt độ dài mùa là 10 ngày.'],
      solution:
        'Nếu mùa kết thúc vào ngày 10, bạn trả 9 + 10 = 19 trong khi tối ưu mua (hoặc thuê) với giá 10: 19/10 = 1.9 = 2 − 1/b.',
    },
    {
      type: 'number',
      prompt: 'Giữ b = 10 và đặt k = 1 (mua ngay). Tỉ số xấu nhất của kế hoạch giờ là bao nhiêu?',
      answer: 10,
      hints: ['Mùa ngắn là trường hợp bất lợi cho việc mua sớm.'],
      solution:
        'Mùa chỉ một ngày tốn 10 để mua ván, trong khi tối ưu thuê với giá 1: tỉ số 10 = b.',
    },
    {
      type: 'number',
      prompt:
        'Ở Phân trang, mở Dãy của Belady với k = 3 (A B C D A B E A B C D E). OPT gặp bao nhiêu lỗi trang?',
      answer: 7,
      unit: 'lỗi trang',
      hints: ['Bấm Đến bước cuối rồi đọc Lỗi trang OPT.'],
      solution:
        'OPT lỗi trang ở bốn yêu cầu đầu tiên và ở E, C, D: 7 lỗi trang, so với 10 của LRU và 9 của FIFO.',
    },
    {
      type: 'choice',
      prompt: 'Trên cùng dãy đó, tăng k từ 3 lên 4. Điều gì xảy ra với FIFO?',
      options: [
        'Nó lỗi ít hơn, như mọi quy tắc nên thế',
        'Nó lỗi nhiều hơn: 10 thay vì 9',
        'Nó lỗi đúng bằng số lần cũ',
        'Nó trở thành tối ưu',
      ],
      answer: 1,
      hints: ['Đọc số lỗi trang của FIFO ở cả hai kích thước.'],
      solution:
        'Đây là nghịch lí Belady: FIFO lỗi 9 lần với 3 trang và 10 lần với 4 trang. LRU giảm từ 10 xuống 8, vì một thuật toán ngăn xếp không bao giờ tệ đi khi cache lớn hơn.',
    },
  ],
  nextTeaser:
    'Bài sau, Luyện tập: chọn mô hình tính toán, cho bạn ghép từng tình huống với mô hình và thuật toán phù hợp.',
};
