/** @typedef {import('$lib/algo-engine/practice-complexity.js').DoublingFrame} DoublingFrame */
/** @typedef {import('$lib/algo-engine/practice-complexity.js').Bucket} Bucket */
/** @typedef {import('$lib/algo-engine/practice-complexity.js').SnippetId} SnippetId */

/**
 * A number in programming notation, as a reader would type it: whole numbers with no grouping,
 * others to two decimals with a decimal point.
 * @param {number} x
 */
const fmt = (x) => x.toLocaleString('en-US', { maximumFractionDigits: 2, useGrouping: false });

/** @type {Record<Bucket, string>} */
const BUCKET_NAMES = {
  1: 'O(1)',
  log: 'O(log n)',
  n: 'O(n)',
  nlogn: 'O(n log n)',
  n2: 'O(n²)',
  exp: 'O(2ⁿ)',
};

/** @type {Record<SnippetId, string>} */
const CARD_NAMES = {
  formula: 'Công thức Gauss',
  halving: 'Vòng lặp chia đôi',
  single: 'Tính tổng một mảng',
  'fixed-inner': 'Vòng trong cố định',
  nested: 'Hai vòng lặp đầy đủ',
  triangle: 'Vòng lặp tam giác',
  loglinear: 'Vòng lặp có vòng trong nhân đôi',
  geometric: 'Vòng ngoài nhân đôi',
  split: 'Chia làm hai nửa',
  fib: 'Fibonacci ngây thơ',
};

export const vi = {
  slug: 'practice-complexity',
  topic: 'complexity',
  level: 'Trung bình',
  title: 'Luyện tập: ước lượng thời gian chạy',
  intro:
    'Ước lượng thời gian chạy là đếm xem thao tác cơ bản chạy bao nhiêu lần rồi chỉ giữ lại lớp tốc độ tăng. Ở đây em xếp mười đoạn mã vào các ngăn O lớn (big-O), rồi kiểm tra dự đoán bằng một thí nghiệm nhân đôi: chạy đoạn mã với n = 1, 2, 4, … và xem số lần đếm thay đổi thế nào mỗi khi n tăng gấp đôi.',
  summary:
    'Xếp các đoạn mã vào các ngăn O(1), O(log n), O(n), O(n log n), O(n²) và O(2ⁿ), rồi kiểm tra từng dự đoán bằng cách đếm số thao tác khi n tăng gấp đôi.',
  instruction:
    'Chọn một thẻ (bấm, chạm hoặc nhấn Enter), rồi bấm nút “Đặt vào đây” của một ngăn, hoặc kéo thẻ thả vào ngăn. Thẻ đang chọn cũng được đo: chạy từng bước thí nghiệm nhân đôi của nó và quan sát cột tỉ số. Khi đã đặt hết các thẻ, hãy kiểm tra cách xếp của em.',
  trayTitle: 'Thẻ chưa xếp',
  trayEmpty: 'Đã xếp hết các thẻ.',
  toTray: 'Trả về khay',
  putHere: 'Đặt vào đây',
  /** @param {string} bucket */
  putHereLabel: (bucket) => `Đặt thẻ đang chọn vào ${bucket}`,
  toTrayLabel: 'Trả thẻ đang chọn về khay',
  bucketEmpty: 'Thả thẻ vào đây',
  buckets: BUCKET_NAMES,
  cards: CARD_NAMES,
  /** @param {string} name @param {string} where @param {boolean} picked @param {string} verdict */
  cardLabel: (name, where, picked, verdict) =>
    `${name}, ${where}${picked ? ', đang chọn' : ''}${verdict ? `, ${verdict}` : ''}`,
  inTray: 'trong khay',
  /** @param {string} bucket */
  inBucket: (bucket) => `trong ${bucket}`,
  verdicts: { right: '✓ đúng', wrong: '✗ sai' },
  check: 'Kiểm tra cách xếp',
  reveal: 'Xem đáp án',
  reset: 'Làm lại từ đầu',
  /** @param {number} right @param {number} total @param {number} unplaced */
  score: (right, total, unplaced) =>
    `${right}/${total} thẻ nằm đúng ngăn${unplaced ? `, ${unplaced} thẻ vẫn còn trong khay` : ''}.`,
  allRight: 'Đúng cả mười thẻ: em ước lượng rất tốt!',
  /** @param {string} name */
  picked: (name) => `Đã chọn: ${name}. Giờ hãy chọn một ngăn.`,
  /** @param {string} name @param {string} bucket */
  moved: (name, bucket) => `Đã chuyển ${name} vào ${bucket}.`,
  /** @param {string} name */
  backToTray: (name) => `Đã trả ${name} về khay.`,
  noPick: 'Hãy chọn một thẻ trước, rồi chọn chỗ đặt nó.',
  revealed: 'Mọi thẻ giờ đã nằm đúng ngăn. Đọc lí do ở dưới mỗi thẻ.',
  why: /** @type {Record<SnippetId, string>} */ ({
    formula: 'Một bước tính, dù n bằng bao nhiêu.',
    halving: 'i giảm một nửa cho đến khi bằng 1: ⌊log₂ n⌋ lượt.',
    single: 'Một lượt duyệt qua n phần tử.',
    'fixed-inner': 'Vòng trong chạy 10 lần, là một hằng số: 10n.',
    nested: 'n lượt, mỗi lượt n bước: n².',
    triangle: '1 + 2 + … + n = n(n + 1)/2, vẫn là Θ(n²).',
    loglinear: 'n lượt của một vòng nhân đôi dài ⌈log₂ n⌉ bước.',
    geometric: '1 + 2 + 4 + … ≤ 2n: lượt cuối chiếm phần lớn, nên là Θ(n).',
    split: 'Mỗi tầng chia đôi làm n phần việc, qua log₂ n tầng.',
    fib: 'Hai lời gọi với n − 1 và n − 2: Θ(φⁿ), φ ≈ 1,618, nằm trong O(2ⁿ).',
  }),
  measureTitle: 'Thí nghiệm nhân đôi',
  /** @param {string} name */
  measuring: (name) => `Đang đo: ${name}`,
  tableAria: 'Số thao tác với mỗi n, kèm tỉ số và hiệu so với hàng trước',
  cols: ['số lần', '× trước', '+ trước'],
  /** @param {number} n */
  rowHead: (n) => `n=${n}`,
  dash: '–',
  fmt,
  stats: { n: 'n', count: 'Số lần', ratio: 'Tỉ số so với n/2' },
  /** @param {DoublingFrame} f @param {string} name */
  describe(f, name) {
    const r = f.rows.at(-1);
    switch (f.kind) {
      case 'start':
        return `${name}: ta sẽ chạy nó với n = 1, 2, 4, … và mỗi lần đếm số lần dòng được tô sáng chạy.`;
      case 'measure': {
        const row = /** @type {NonNullable<typeof r>} */ (r);
        const head = `n = ${fmt(row.n)}: dòng được tô sáng đã chạy ${fmt(row.count)} lần.`;
        if (row.diff === null) return `${head} Đây là lần đo đầu tiên.`;
        if (row.ratio === null) return `${head} Nhiều hơn lần trước ${fmt(row.diff)}.`;
        return `${head} Nhân đôi n làm số lần nhân lên ${fmt(row.ratio)} (+${fmt(row.diff)}).`;
      }
      case 'done': {
        const row = /** @type {NonNullable<typeof r>} */ (r);
        const tail =
          row.ratio === null
            ? ''
            : ` Lần nhân đôi cuối làm số lần nhân lên ${fmt(row.ratio)} và tăng thêm ${fmt(/** @type {number} */ (row.diff))}.`;
        return `Xong ở n = ${fmt(row.n)} với ${fmt(row.count)} thao tác.${tail} Quy luật đó chỉ về ngăn nào?`;
      }
    }
  },
  practiceTitle: 'Câu hỏi cho thí nghiệm nhân đôi',
  takeaways: [
    'Đếm số lần thao tác cơ bản chạy theo n, rồi chỉ giữ lại số hạng tăng nhanh nhất và bỏ các hằng số nhân.',
    'Vòng lặp lồng nhau thì nhân, vòng lặp nối tiếp thì cộng, nhưng hãy xem kĩ cận của vòng lặp: vòng trong chạy 10 lần là hằng số, còn vòng trong chạy đến i vẫn cho n(n + 1)/2 = Θ(n²).',
    'Một biến giảm một nửa hoặc tăng gấp đôi sau mỗi lượt cho log₂ n lượt. Vòng ngoài nhân đôi có vòng trong chạy i lần thì tổng chưa tới 2n: Θ(n), không phải n log n.',
    'Phép thử nhân đôi: khi n tăng gấp đôi, số lần đếm giữ nguyên với O(1), tăng thêm một hằng số với O(log n), gấp đôi với O(n), hơn gấp đôi một chút với O(n log n), gấp bốn với O(n²), và bùng nổ với tốc độ tăng mũ.',
    'Thử xem: đặt thẻ Vòng ngoài nhân đôi, rồi đo nó. Tỉ số của nó ổn định ở 2, giống hệt Tính tổng một mảng.',
  ],
  complexityHead: ['Dạng mã', 'Tốc độ tăng', 'Số lần khi n gấp đôi'],
  complexity: [
    ['Một số cố định câu lệnh', 'O(1)', 'Không đổi.'],
    ['Một biến chia đôi hoặc nhân đôi cho đến khi chạm n', 'O(log n)', 'Tăng khoảng 1.'],
    ['Một vòng lặp đến n, hoặc vòng lặp có vòng trong cố định', 'O(n)', 'Khoảng × 2.'],
    [
      'n lượt của một vòng nhân đôi hoặc chia đôi; đệ quy chia đôi với n phần việc mỗi tầng',
      'O(n log n)',
      'Hơn × 2 một chút.',
    ],
    ['Hai vòng lặp lồng nhau đến n, hoặc đến i', 'O(n²)', 'Khoảng × 4.'],
    ['Hai lời gọi đệ quy với n − 1 và n − 2', 'O(2ⁿ)', 'Chính tỉ số cũng cứ tăng mãi.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Đo Vòng lặp tam giác. Lệnh c = c + 1 chạy bao nhiêu lần khi n = 64?',
      answer: 2080,
      unit: 'lần',
      hints: [
        'Chọn thẻ Vòng lặp tam giác và chạy thí nghiệm của nó đến n = 64.',
        'Số lần đếm là 1 + 2 + … + 64.',
      ],
      solution:
        '1 + 2 + … + 64 = 64 × 65 / 2 = 2080. Nó tăng như n²/2, nên thẻ này thuộc ngăn O(n²).',
    },
    {
      type: 'number',
      prompt: 'Đo Vòng ngoài nhân đôi. Lệnh c = c + 1 chạy bao nhiêu lần khi n = 1024?',
      answer: 2047,
      unit: 'lần',
      hints: [
        'Vòng trong chạy i lần với i = 1, 2, 4, …, 1024.',
        'Một tổng các luỹ thừa của hai: 1 + 2 + 4 + … + 2ᵏ = 2ᵏ⁺¹ − 1.',
      ],
      solution:
        '1 + 2 + 4 + … + 1024 = 2047, nhỏ hơn 2n = 2048. Số lần chỉ gấp đôi khi n gấp đôi, nên đoạn mã là O(n), không phải O(n log n).',
    },
    {
      type: 'number',
      prompt: 'Đo Fibonacci ngây thơ. fib(16) thực hiện bao nhiêu lời gọi?',
      answer: 3193,
      unit: 'lời gọi',
      hints: [
        'Chạy thí nghiệm đến hàng cuối, n = 16.',
        'calls(n) = 1 + calls(n − 1) + calls(n − 2), tính ra bằng 2·F(n + 1) − 1.',
      ],
      solution:
        'calls(16) = 2 · F(17) − 1 = 2 · 1597 − 1 = 3193. Từ n = 8 (67 lời gọi), số lần đã tăng khoảng 48 lần: tốc độ tăng mũ.',
    },
    {
      type: 'choice',
      prompt:
        'Đo Chia làm hai nửa. Từ n = 512 đến n = 1024, số lần đếm tăng lên khoảng bao nhiêu lần?',
      options: ['Đúng 1', 'Khoảng 2.22', 'Đúng 4', 'Khoảng 47'],
      answer: 1,
      hints: ['Đọc cột × trước ở hàng cuối.', 'n log₂ n đi từ 512 × 9 đến 1024 × 10.'],
      solution:
        '4608 → 10240 là × 2.22: hơn gấp đôi một chút, dấu hiệu của O(n log n). Thừa số dư 10/9 chính là log₂ 1024 ÷ log₂ 512.',
    },
    {
      type: 'multi',
      prompt: 'Những đoạn mã nào là Θ(n)? Dùng cột tỉ số để kiểm tra.',
      options: [
        'Tính tổng một mảng',
        'Vòng trong cố định',
        'Vòng ngoài nhân đôi',
        'Vòng lặp có vòng trong nhân đôi',
        'Vòng lặp chia đôi',
      ],
      answers: [0, 1, 2],
      hints: [
        'Số lần đếm của Θ(n) gấp đôi khi n gấp đôi.',
        'Một trong hai vòng lặp có biến nhân đôi cho tổng chưa tới 2n.',
      ],
      solution:
        'Tính tổng một mảng (n), Vòng trong cố định (10n) và Vòng ngoài nhân đôi (< 2n) đều gấp đôi theo n. Vòng trong nhân đôi cho n·⌈log₂ n⌉, còn vòng lặp chia đôi chỉ cho log₂ n.',
    },
    {
      type: 'order',
      prompt: 'Sắp xếp các đoạn mã theo số lần đếm tại n = 1024, nhỏ nhất trước.',
      items: [
        'Vòng lặp tam giác',
        'Tính tổng một mảng',
        'Vòng lặp có vòng trong nhân đôi',
        'Vòng lặp chia đôi',
        'Vòng ngoài nhân đôi',
      ],
      answer: [3, 1, 4, 2, 0],
      hints: [
        'Đọc hàng n = 1024 trong thí nghiệm của từng đoạn mã.',
        'Các số lần đếm là 10, 1024, 2047, 10240 và 524800.',
      ],
      solution:
        'Vòng lặp chia đôi 10, Tính tổng một mảng 1024, Vòng ngoài nhân đôi 2047, Vòng lặp có vòng trong nhân đôi 10240, Vòng lặp tam giác 524800.',
    },
    {
      type: 'text',
      prompt: 'Viết lớp O lớn của Vòng lặp có vòng trong nhân đôi.',
      accept: [
        'O(n log n)',
        'n log n',
        'O(n logn)',
        'O(nlogn)',
        'nlogn',
        'Θ(n log n)',
        'O(n log2 n)',
        'O(n log₂ n)',
      ],
      hints: [
        'Vòng ngoài chạy n lần. Lệnh j = 2 · j chạy bao nhiêu lần trước khi j chạm n?',
        'Tại n = 1024 số lần đếm là 1024 × 10.',
      ],
      solution: 'n lượt, mỗi lượt ⌈log₂ n⌉ lần nhân đôi: n⌈log₂ n⌉ = Θ(n log n).',
    },
  ],
  nextTeaser:
    'Có công cụ đo rồi, ta bắt đầu với cấu trúc dữ liệu đầu tiên. Bài sau, Mảng tĩnh và mảng động, cho thấy vì sao thêm phần tử vào cuối mảng vẫn rẻ.',
};
