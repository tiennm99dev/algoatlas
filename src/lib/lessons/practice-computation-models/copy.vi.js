/** @typedef {import('$lib/algo-engine/practice-computation-models.js').MatchFrame} MatchFrame */
/** @typedef {import('$lib/algo-engine/practice-computation-models.js').Model} Model */

/** Whole numbers in plain digits, ratios with two decimals, ∞ for no bound. @param {number} v */
const num = (v) =>
  !Number.isFinite(v) ? '∞' : Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);

/** @type {Record<Model, string>} */
const MODEL_NAMES = {
  parallel: 'Song song (work và span)',
  distributed: 'Phân tán (số vòng)',
  external: 'Bộ nhớ ngoài',
  online: 'Trực tuyến (tỉ số cạnh tranh)',
};

/** @type {Record<Model, string>} */
const UNITS = {
  parallel: 'bước',
  distributed: 'thông điệp',
  external: 'lần chuyển khối',
  online: '× OPT',
};

/** @param {Model} model @param {number} v */
const costText = (model, v) =>
  model === 'online'
    ? Number.isFinite(v)
      ? `${num(v)} × OPT`
      : 'không bị chặn'
    : `${num(v)} ${UNITS[model]}`;

/**
 * @type {Record<string, {title: string, job: string, why: string, params: Record<string, string>,
 *   candidates: Record<string, {name: string, why: string}>}>}
 */
const CARDS = {
  sum: {
    title: 'Tính tổng một mảng lớn',
    job: 'Cộng n số trên một máy có P lõi dùng chung bộ nhớ.',
    why: 'Nhiều bộ xử lí dùng chung một bộ nhớ và công việc xong khi mạch cuối cùng xong: đếm số bước thời gian bằng work và span.',
    params: { logN: 'Số lượng số n', p: 'Số lõi P' },
    candidates: {
      loop: {
        name: 'Vòng lặp thường',
        why: 'n − 1 phép cộng nối tiếp nhau; các lõi còn lại ngồi không.',
      },
      forkJoin: {
        name: 'Tính tổng kiểu fork-join, mỗi mạch một phép cộng',
        why: 'Work n − 1, span log₂ n, nên lịch tham lam mất khoảng (n − 1)/P + log₂ n bước.',
      },
      chunks: {
        name: 'Mỗi lõi một đoạn, rồi gộp lại',
        why: 'Mỗi lõi cộng n/P số (n/P − 1 bước), rồi log₂ P vòng gộp các tổng riêng phần.',
      },
    },
  },
  sort: {
    title: 'Sắp xếp trên nhiều lõi',
    job: 'Sắp xếp n khoá trên một máy có P lõi dùng chung bộ nhớ.',
    why: 'Các lõi dùng chung bộ nhớ và làm việc song song: đếm số bước thời gian bằng work và span.',
    params: { logN: 'Số khoá n', p: 'Số lõi P' },
    candidates: {
      serial: { name: 'Sắp xếp trộn trên một lõi', why: 'n log₂ n bước, dù P là bao nhiêu.' },
      serialMerge: {
        name: 'Sắp xếp trộn song song, trộn tuần tự',
        why: 'Work n log₂ n nhưng span khoảng 2n, vì mỗi phép trộn là một mạch dài: n log₂ n / P + 2n.',
      },
      parallelMerge: {
        name: 'Sắp xếp trộn song song, trộn song song',
        why: 'Cùng work nhưng span chỉ khoảng log₂³ n: n log₂ n / P + log₂³ n.',
      },
    },
  },
  election: {
    title: 'Bầu một máy điều phối',
    job: 'n máy chủ nối thành một vòng, mỗi máy có một ID riêng và không dùng chung bộ nhớ, phải thống nhất chọn một máy điều phối.',
    why: 'Các máy riêng rẽ chỉ thấy thông điệp từ máy kề và đi theo từng vòng: đếm số thông điệp.',
    params: { n: 'Số máy chủ n' },
    candidates: {
      floodMax: {
        name: 'FloodMax: chuyển tiếp ID lớn nhất trong D vòng',
        why: 'Trên vòng có D = ⌊n/2⌋ vòng, mỗi liên kết hai thông điệp mỗi vòng: 2n · ⌊n/2⌋.',
      },
      allIds: {
        name: 'Gửi mọi ID cho mọi máy, rồi chọn ID lớn nhất',
        why: 'Mỗi ID trong n ID đi qua mỗi liên kết trong n liên kết theo cả hai chiều: 2n².',
      },
    },
  },
  transpose: {
    title: 'Chuyển vị một ma trận khổng lồ',
    job: 'Chuyển vị một ma trận N × N không vừa cache. Bộ nhớ di chuyển theo từng khối B từ nhớ và cache giữ được M từ nhớ.',
    why: 'Việc chuyển khối giữa bộ nhớ và cache chiếm phần lớn thời gian: đếm số lần chuyển khối.',
    params: { logN: 'Cạnh ma trận N', logB: 'Khối B (từ nhớ)', logM: 'Cache M (từ nhớ)' },
    candidates: {
      rows: {
        name: 'Vòng lặp theo từng hàng',
        why: '2N²/B khi cache giữ được một khối cho mỗi hàng nó ghi (M ≥ N · B); nếu không thì khoảng một lần chuyển cho mỗi phần tử, N² + N²/B.',
      },
      recursive: {
        name: 'Chuyển vị đệ quy, không phụ thuộc cache',
        why: '2N²/B với giả thiết cache cao M ≥ B²; nếu không thì cũng khoảng N² + N²/B.',
      },
    },
  },
  servers: {
    title: 'Thuê hay mua máy chủ',
    job: 'Một dự án cần máy chủ trong một số ngày mà không ai biết trước. Thuê tốn 1 mỗi ngày; mua tốn b.',
    why: 'Lựa chọn mỗi ngày phải đưa ra trước khi biết dự án dài bao lâu: so với tối ưu ngoại tuyến bằng tỉ số cạnh tranh.',
    params: { b: 'Giá mua b (bằng số ngày thuê)' },
    candidates: {
      buyNow: { name: 'Mua ngay ngày 1', why: 'Dự án một ngày tốn b so với 1: tỉ số b.' },
      breakEven: {
        name: 'Thuê tới ngày b − 1, mua vào ngày b',
        why: 'Dự án tệ nhất kết thúc ngay sau khi mua: (2b − 1)/b = 2 − 1/b.',
      },
      alwaysRent: {
        name: 'Luôn thuê',
        why: 'Dự án dài d ngày tốn d so với b: không bị chặn.',
      },
    },
  },
  webCache: {
    title: 'Lưu đệm trang web',
    job: 'Một máy chủ web giữ k trang trong bộ nhớ nhanh và phải phục vụ mỗi yêu cầu ngay khi nó tới.',
    why: 'Mỗi lần đẩy trang ra được chọn trước khi biết các yêu cầu sau: đánh giá bằng tỉ số cạnh tranh.',
    params: { k: 'Số trang k' },
    candidates: {
      lru: {
        name: 'Đẩy ra trang lâu chưa dùng nhất',
        why: 'k-cạnh tranh: nhiều nhất k lỗi trang trong mỗi pha gồm k trang khác nhau, trong khi OPT lỗi ít nhất một lần.',
      },
      mru: {
        name: 'Đẩy ra trang vừa dùng gần nhất',
        why: 'Khi cache đã đầy, xen kẽ giữa trang cuối của nó và một trang mới làm nó lỗi ở mọi yêu cầu, còn OPT chỉ đẩy một trang khác ra một lần rồi sau đó toàn trúng: không bị chặn.',
      },
    },
  },
};

export const vi = {
  slug: 'practice-computation-models',
  topic: 'computation-models',
  level: 'Nâng cao',
  title: 'Luyện tập: chọn mô hình tính toán',
  intro:
    'Thuật toán đúng phụ thuộc vào thứ mà công việc phải trả giá. Trên nhiều lõi, đó là số bước thời gian, do work và span quyết định; giữa nhiều máy, đó là số vòng và số thông điệp; với dữ liệu lớn, đó là số lần chuyển khối; còn khi chưa biết trước đầu vào, đó là tỉ số so với tối ưu ngoại tuyến. Hãy ghép mỗi thẻ tình huống với mô hình và thuật toán tốt nhất của nó.',
  summary:
    'Ghép các thẻ tình huống với mô hình tính toán và thuật toán phù hợp, rồi đổi các con số trên mỗi thẻ để thấy khi nào một thuật toán khác trở nên rẻ nhất.',
  instruction:
    'Chọn một thẻ, chọn mô hình và thuật toán bạn cho là phù hợp, rồi bấm Kiểm tra cách ghép. Sau đó chạy từng bước: mô hình được kiểm tra, mọi thuật toán được tính chi phí trong mô hình đó với các con số của thẻ, và thuật toán rẻ nhất thắng. Kéo các thanh trượt rồi kiểm tra lại.',
  cardLabel: 'Thẻ',
  cardTitles: Object.fromEntries(Object.entries(CARDS).map(([id, c]) => [id, c.title])),
  /** @param {string} id */
  card: (id) => CARDS[id],
  modelLabel: 'Mô hình',
  modelNames: MODEL_NAMES,
  algorithmLabel: 'Thuật toán',
  check: 'Kiểm tra cách ghép',
  /** @param {{key: string, pow2?: boolean}} spec @param {number} v */
  paramValue: (spec, v) => (spec.pow2 ? `2^${v} = ${2 ** v}` : String(v)),
  costsTitle: 'Chi phí trong mô hình của thẻ',
  costPending: 'chưa tính',
  costText,
  bestMark: '✓ rẻ nhất',
  pickMark: '◀ bạn chọn',
  /** @param {number} done @param {number} total */
  score: (done, total) => `Đã ghép đúng ${done}/${total} thẻ`,
  scoreTitle: 'Các lần ghép của bạn',
  scoreMarks: { right: '✓', wrong: '✗', open: '·' },
  /** @param {string} title @param {'right'|'wrong'|'open'} state */
  scoreLabel: (title, state) =>
    `${title}: ${state === 'right' ? 'đã ghép đúng' : state === 'wrong' ? 'chưa đúng' : 'chưa kiểm tra'}`,
  /**
   * @param {MatchFrame} f @param {string} id
   * @param {{model: Model, algorithm: string}} pick
   */
  describe(f, id, pick) {
    const c = CARDS[id];
    switch (f.kind) {
      case 'start':
        return `${c.title}: ${c.job} Cách ghép của bạn: ${MODEL_NAMES[pick.model]}, “${c.candidates[pick.algorithm].name}”.`;
      case 'model':
        return f.modelOk
          ? `Đúng mô hình: ${MODEL_NAMES[f.model]}. ${c.why}`
          : `Không phải ${MODEL_NAMES[pick.model]}: đây là ${MODEL_NAMES[f.model]}. ${c.why}`;
      case 'cost': {
        const cost = /** @type {{cost: number}} */ (f.costs.at(-1)).cost;
        return `${c.candidates[f.candidate].name}: ${costText(f.model, cost)}. ${c.candidates[f.candidate].why}`;
      }
      case 'verdict':
      case 'done': {
        const names = f.best.map((b) => `“${c.candidates[b].name}”`).join(' và ');
        const tie = f.best.length > 1 ? ' (hoà nhau)' : '';
        const mine = f.algorithmOk
          ? f.modelOk
            ? 'Cách ghép của bạn đúng rồi.'
            : 'Thuật toán bạn chọn đúng, nhưng hãy xem lại mô hình.'
          : 'Thuật toán bạn chọn không phải rẻ nhất ở đây.';
        return `Rẻ nhất: ${names}${tie}. ${mine}`;
      }
    }
  },
  takeaways: [
    'Trước hết hãy hỏi công việc phải trả giá cho điều gì: thời gian trên các lõi dùng chung bộ nhớ (work và span), số vòng và số thông điệp giữa các máy, số lần chuyển khối tới bộ nhớ chậm, hay cái giá của việc quyết định khi chưa biết tương lai.',
    'Trên P lõi, một thuật toán có work T₁ và span T∞ chạy trong khoảng T₁/P + T∞: giảm span tới khi nó không còn áp đảo, rồi giữ work nhỏ.',
    'Với dữ liệu lớn hơn cache nhiều, hãy đếm khối chứ không đếm lệnh: quét tốn n/B, và các cách lưu đệ quy, không phụ thuộc cache giữ cho mọi lần chuyển khối đều có ích.',
    'Khi đầu vào tới từng phần một, hãy so với tối ưu ngoại tuyến: kế hoạch hoà vốn cho bài toán thuê hay mua, LRU cho việc lưu đệm.',
    'Thử xem: ở thẻ Sắp xếp trên nhiều lõi, kéo P từ 1 lên 64 và xem thuật toán rẻ nhất thay đổi; ở thẻ Chuyển vị một ma trận khổng lồ, thu nhỏ cache xuống dưới B².',
  ],
  complexityHead: ['Mô hình', 'Thước đo chi phí', 'Cận thường gặp'],
  complexity: [
    [
      'Song song (work và span)',
      'Số bước thời gian trên P lõi',
      'T_P ≈ T₁/P + T∞ (lập lịch tham lam)',
    ],
    ['Phân tán (đồng bộ)', 'Số vòng và số thông điệp', 'FloodMax: D vòng, O(|E| · D) thông điệp'],
    ['Bộ nhớ ngoài', 'Số lần chuyển khối', 'Quét n/B; chuyển vị và sắp xếp bằng cách chia đệ quy'],
    ['Trực tuyến', 'Tỉ số cạnh tranh', 'Thuê ván trượt 2 − 1/b; phân trang LRU k'],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Thẻ “Tính tổng một mảng lớn” với các con số ban đầu (n = 2^20, P = 8). Thuật toán rẻ nhất mất bao nhiêu bước?',
      answer: 131074,
      unit: 'bước',
      hints: ['Kiểm tra một cách ghép bất kì rồi chạy tới bước kết luận; hàng rẻ nhất có dấu ✓.'],
      solution:
        'Mỗi lõi một đoạn: 2^20/8 − 1 = 131071 phép cộng trên mỗi lõi, rồi log₂ 8 = 3 vòng để gộp, tổng cộng 131074 bước. Tính tổng kiểu fork-join cần 131092 bước và vòng lặp thường cần 1048575 bước.',
    },
    {
      type: 'choice',
      prompt: 'Thẻ “Sắp xếp trên nhiều lõi” với P = 1 lõi. Thuật toán nào rẻ nhất?',
      options: [
        'Sắp xếp trộn trên một lõi',
        'Sắp xếp trộn song song, trộn tuần tự',
        'Sắp xếp trộn song song, trộn song song',
      ],
      answer: 0,
      hints: ['Đặt thanh trượt Số lõi về 1 rồi đọc ba chi phí.'],
      solution:
        'Với một lõi, các bản song song làm cùng lượng work và còn cộng thêm span của chúng: sắp xếp trộn thường mất 20971520 bước, so với 23068672 và 20979520.',
    },
    {
      type: 'number',
      prompt: 'Cùng thẻ đó với n = 2^20 và P = 16. Thuật toán rẻ nhất mất bao nhiêu bước?',
      answer: 1318720,
      unit: 'bước',
      hints: ['Trộn song song giữ cho span nhỏ.'],
      solution:
        'Sắp xếp trộn song song với phép trộn song song: 20 · 2^20 / 16 = 1310720 cộng với span 20³ = 8000, tức 1318720 bước. Bản trộn tuần tự phải trả span 2n = 2097152.',
    },
    {
      type: 'number',
      prompt:
        'Thẻ “Chuyển vị một ma trận khổng lồ” với các con số ban đầu (N = 2^12, B = 2^6, M = 2^14). Vòng lặp theo từng hàng tốn số lần chuyển khối gấp bao nhiêu lần phép chuyển vị đệ quy?',
      answer: 32.5,
      tolerance: 0.01,
      hints: ['Đọc cả hai chi phí rồi chia.'],
      solution:
        'Cache (2^14 từ nhớ) nhỏ hơn N · B = 2^18, nên vòng lặp tốn N² + N²/B = 17039360. Cache lại không nhỏ hơn B² = 2^12, nên phép chuyển vị đệ quy tốn 2N²/B = 524288. 17039360 / 524288 = 32.5.',
    },
    {
      type: 'choice',
      prompt: 'Trên cùng thẻ đó, đặt B = 2^8 và giữ M = 2^14. Giờ cách nào rẻ nhất?',
      options: [
        'Vòng lặp theo từng hàng',
        'Phép chuyển vị đệ quy',
        'Không cách nào: hai cách hoà nhau ở khoảng một lần chuyển cho mỗi phần tử',
      ],
      answer: 2,
      hints: ['So M với B² = 2^16.'],
      solution:
        'M = 2^14 < B² = 2^16 phá vỡ giả thiết cache cao, và M < N · B nữa, nên cả hai đều tốn N² + N²/B = 16842752. Thuật toán không phụ thuộc cache cần một cache cao.',
    },
    {
      type: 'number',
      prompt:
        'Thẻ “Thuê hay mua máy chủ” với b = 24. Tỉ số cạnh tranh của kế hoạch tốt nhất là bao nhiêu? Lấy hai chữ số thập phân.',
      answer: 1.96,
      tolerance: 0.005,
      hints: ['Kế hoạch tốt nhất mua vào ngày b.'],
      solution:
        'Kế hoạch hoà vốn: 2 − 1/24 ≈ 1.96. Mua ngay có tỉ số 24, còn luôn thuê thì không bị chặn.',
    },
    {
      type: 'multi',
      prompt: 'Những thẻ nào được đánh giá bằng tỉ số cạnh tranh?',
      options: [
        'Tính tổng một mảng lớn',
        'Bầu một máy điều phối',
        'Thuê hay mua máy chủ',
        'Lưu đệm trang web',
      ],
      answers: [2, 3],
      hints: ['Công việc nào phải quyết định trước khi phần còn lại của đầu vào tới?'],
      solution:
        'Việc thuê hay mua và việc chọn trang để đẩy ra đều phải quyết định trước khi biết tương lai, nên chúng là bài toán trực tuyến. Tính tổng là bài toán song song, còn bầu máy điều phối là bài toán phân tán.',
    },
  ],
  nextTeaser:
    'Bài sau, Ôn tập: thuật toán nâng cao, gom lại các kĩ thuật nâng cao bạn đã gặp trong phần này.',
};
