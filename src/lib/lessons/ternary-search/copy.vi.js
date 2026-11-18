/** @typedef {import('$lib/algo-engine/ternary-search.js').TernaryFrame} TernaryFrame */
/** @typedef {import('$lib/algo-engine/ternary-search.js').Shape} Shape */

/** Three decimals, the precision the plot can show. @param {number} x */
const fmt = (x) => x.toFixed(3);

export const vi = {
  slug: 'ternary-search',
  topic: 'searching',
  level: 'Trung bình',
  title: 'Tìm kiếm tam phân',
  intro:
    'Một hàm đơn đỉnh (unimodal) đi lên tới một đỉnh duy nhất rồi đi xuống. Tìm kiếm tam phân (ternary search) tìm ra đỉnh đó mà không cần đạo hàm: tính hàm tại hai điểm chia khoảng thành ba phần bằng nhau, và điểm thử thấp hơn cho biết phần ngoài nào chắc chắn không chứa đỉnh.',
  summary:
    'Thu hẹp dần về đỉnh của một hàm đơn đỉnh bằng cách thử hai điểm và bỏ đi một phần ba khoảng sau mỗi vòng.',
  instruction:
    'Chọn một đường cong và kéo thanh trượt vị trí đỉnh, chọn độ rộng dừng ε, rồi chạy từng bước: mỗi vòng đặt hai điểm thử m1 và m2, so sánh f(m1) với f(m2) và tô xám phần ba không thể chứa đỉnh. Đánh dấu Phóng to để theo dõi khoảng khi nó đã hẹp. Thử “Hai đỉnh” để thấy điều gì sai.',
  takeaways: [
    'Đơn đỉnh nghĩa là tăng thực sự cho tới đỉnh và giảm thực sự sau đỉnh. Khi đó giá trị nhỏ hơn trong f(m1) và f(m2) nằm trên một sườn dốc, xa đỉnh.',
    'Nếu f(m1) < f(m2) thì đỉnh không nằm trong [lo, m1), nên lo = m1. Ngược lại đỉnh không nằm trong (m2, hi], nên hi = m2. Mỗi vòng bỏ đi một phần ba.',
    'Ta tìm trên số thực, nên dừng khi hi − lo ≤ ε. Độ rộng còn lại 2/3 sau mỗi vòng: khoảng log₁.₅((b − a) / ε) vòng, mỗi vòng tính f 2 lần.',
    'Với hàm có hai đỉnh, quy tắc vẫn dừng, nhưng có thể bỏ mất đỉnh cao hơn ngay vòng đầu. Tính đơn đỉnh là điều kiện bắt buộc.',
    'Thử cùng một đường cong với ε = 0.5 và ε = 0.001: 7 vòng so với 22 vòng. Mỗi chữ số chính xác thêm tốn khoảng 5,7 vòng nữa.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Số vòng', 'O(log((b − a) / ε))', 'Độ rộng nhân với 2/3 sau mỗi vòng.'],
    [
      'Số lần tính f',
      '2 mỗi vòng',
      'f(m1) và f(m2); tìm kiếm lát cắt vàng dùng lại một giá trị nên chỉ cần 1.',
    ],
    [
      'Trên số nguyên',
      'O(log n)',
      'Cùng quy tắc trên một đoạn chỉ số, cho tới khi còn không quá ba phần tử.',
    ],
    ['Bộ nhớ', 'O(1)', 'lo, hi và hai điểm thử.'],
  ],
  nextTeaser:
    'Đã đến lúc tự tay áp dụng mọi cách tìm vừa học, kể cả tìm lỗi trong mã. Vào Luyện tập: bài toán tìm kiếm.',
  shapeLabel: 'Đường cong',
  shapes: /** @type {Record<Shape, string>} */ ({
    parabola: 'Parabol',
    tent: 'Hình mái nhà',
    bell: 'Hình chuông',
    'two-peaks': 'Hai đỉnh',
  }),
  /** @param {number} p */
  peakLabel: (p) => `Đỉnh tại x = ${p.toFixed(1)}`,
  epsLabel: 'Dừng ở độ rộng ε',
  zoomLabel: 'Phóng to [lo, hi]',
  /** @param {string} name @param {number} lo @param {number} hi */
  plotLabel: (name, lo, hi) =>
    `Đồ thị đường cong ${name.toLowerCase()} trên [0, 6]. Đỉnh vẫn có thể nằm trong [${fmt(lo)}, ${fmt(hi)}]; phần còn lại đã bị bỏ.`,
  legend: {
    curve: 'f(x)',
    kept: 'Khoảng [lo, hi] còn giữ',
    cut: 'Đã bỏ: không thể chứa đỉnh',
    probe: 'Hai điểm thử m1 và m2',
    answer: 'Đáp án (lo + hi) / 2',
  },
  stats: {
    rounds: 'Số vòng',
    evaluations: 'Số lần tính f',
    width: 'Độ rộng hi − lo',
    predicted: 'Số vòng cần cho ε',
  },
  intervalsTitle: 'Khoảng sau mỗi vòng',
  intervalsEmpty: 'Chưa có vòng nào',
  /** @param {number} lo @param {number} hi */
  interval: (lo, hi) => `[${fmt(lo)}, ${fmt(hi)}]`,
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Đặt ε = 0.01 trên một đường cong bất kì. Lần tìm tính f bao nhiêu lần trước khi dừng?',
      answer: 32,
      unit: 'lần',
      hints: [
        'Chạy tới bước cuối rồi đọc thẻ Số lần tính f.',
        'Độ rộng 6 phải nhân với 2/3 mỗi vòng cho tới khi không quá 0.01; việc đó mất 16 vòng.',
      ],
      solution:
        '6 × (2/3)¹⁶ ≈ 0.009 ≤ 0.01, còn 15 vòng thì độ rộng vẫn khoảng 0.014. 16 vòng × 2 lần tính = 32.',
    },
    {
      type: 'choice',
      prompt:
        'Parabol có đỉnh tại 3.7: hai điểm thử đầu tiên là m1 = 2 và m2 = 4, với f(2) ≈ 3.555 và f(4) ≈ 4.955. Lần tìm sẽ làm gì?',
      options: [
        'lo = 2: đỉnh không thể nằm bên trái m1.',
        'hi = 4: đỉnh không thể nằm bên phải m2.',
        'Dừng lại: đỉnh nằm giữa hai điểm thử.',
        'Bỏ phần ba ở giữa [2, 4].',
      ],
      answer: 0,
      hints: [
        'Chạy thêm một bước sau khung có hai điểm thử đầu tiên.',
        'f(m1) < f(m2): điểm thử bên trái thấp hơn, nên nó nằm trên sườn đi lên.',
      ],
      solution:
        'f(m1) < f(m2), nên m1 nằm ở sườn đi lên của đỉnh và không điểm nào trong [0, 2) có thể là đỉnh: lo = 2. Khoảng còn giữ [2, 6] bằng hai phần ba khoảng cũ.',
    },
    {
      type: 'choice',
      prompt:
        'Chọn “Hai đỉnh” và chạy tới bước cuối. Vì sao kết quả là x ≈ 4 trong khi đường cong cao nhất ở gần 0.8?',
      options: [
        'ε quá lớn.',
        'Đường cong không đơn đỉnh, nên vòng đầu đã bỏ đi phần ba chứa đỉnh cao hơn.',
        'Tìm kiếm tam phân tìm giá trị nhỏ nhất chứ không phải lớn nhất.',
        'Các điểm thử đã bị làm tròn thành số nguyên.',
      ],
      answer: 1,
      hints: [
        'Xem vòng đầu tiên: f(2) ≈ 0.646 và f(4) ≈ 3.2.',
        'Sau phép so sánh đó, phần ba nào bị tô xám?',
      ],
      solution:
        'f(2) < f(4), nên lần tìm bỏ [0, 2) và bỏ luôn đỉnh cao ở 0.8. Quy tắc chỉ an toàn khi có một đỉnh duy nhất; ở đây nó dừng ở đỉnh cục bộ gần 4.',
    },
    {
      type: 'number',
      prompt:
        'Sau một vòng, khoảng còn lại bao nhiêu phần so với ban đầu? Viết dưới dạng số thập phân, làm tròn tới ba chữ số sau dấu phẩy.',
      answer: 0.667,
      tolerance: 0.001,
      hints: [
        'So sánh thẻ độ rộng trước và sau một lần cắt.',
        'Mỗi vòng bỏ một trong ba phần bằng nhau.',
      ],
      solution:
        'Hai trong ba phần còn lại: 2/3 ≈ 0,667. Vì vậy số vòng tăng theo lôgarit cơ số 1,5 của tỉ số giữa độ rộng và ε.',
    },
  ],
  /** @param {TernaryFrame} f @param {number} eps @param {(x: number) => number} fn @param {Shape} shape */
  describe(f, eps, fn, shape) {
    switch (f.kind) {
      case 'start':
        return `Ta tìm điểm cao nhất của f trên [${fmt(f.lo)}, ${fmt(f.hi)}]. Mỗi vòng giữ lại hai phần ba khoảng, cho tới khi độ rộng không quá ε = ${eps}.`;
      case 'probe':
        return `Thử tại hai điểm chia ba: f(m1) = f(${fmt(f.m1)}) = ${fmt(f.f1)} và f(m2) = f(${fmt(f.m2)}) = ${fmt(f.f2)}, nên f(m1) ${f.f1 < f.f2 ? '<' : '≥'} f(m2).`;
      case 'cut-left':
        return `f(m1) < f(m2): m1 nằm trên sườn đi lên, nên đỉnh không ở bên trái nó. lo = ${fmt(f.lo)}; giờ khoảng rộng ${fmt(f.hi - f.lo)}.`;
      case 'cut-right':
        return `f(m1) ≥ f(m2): m2 nằm trên sườn đi xuống, nên đỉnh không ở bên phải nó. hi = ${fmt(f.hi)}; giờ khoảng rộng ${fmt(f.hi - f.lo)}.`;
      case 'done': {
        const head = `Độ rộng ${fmt(f.hi - f.lo)} ≤ ε. Đỉnh ở khoảng x = ${fmt(f.answer)}, f(x) = ${fmt(fn(f.answer))}, sau ${f.iterations} vòng và ${f.evaluations} lần tính f.`;
        return shape === 'two-peaks'
          ? `${head} Nhưng đường cong này có hai đỉnh: đỉnh cao hơn, gần x = 0.8 với f ≈ 5.018, đã bị bỏ ngay vòng đầu.`
          : head;
      }
    }
  },
};
