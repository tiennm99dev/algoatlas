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

/**
 * A number in programming notation, as a reader would type it: whole numbers in full with no
 * grouping, others to 4 significant digits with a decimal point.
 * @param {number} x
 */
function fmt(x) {
  if (Number.isInteger(x)) return x.toLocaleString('en-US', { useGrouping: false });
  return x.toLocaleString('en-US', { maximumSignificantDigits: 4, useGrouping: false });
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

export const vi = {
  slug: 'asymptotic-notation',
  topic: 'complexity',
  level: 'Cơ bản',
  title: 'Kí hiệu tiệm cận: O lớn, Omega, Theta',
  intro:
    'Số bước đếm chính xác như 3n² + 20n + 50 thì đúng nhưng rườm rà. Kí hiệu tiệm cận chỉ giữ lại tốc độ tăng của số bước khi n lớn dần: O lớn (big-O) là cận trên, Omega là cận dưới, còn Theta là cả hai cùng lúc.',
  summary:
    'Vẽ một hàm so với n, n log n, n² và 2ⁿ trên thang logarit, rồi quyết định xem nó là O, Omega hay Theta của cận đã chọn.',
  instruction:
    'Đặt các hệ số của f(n) = a·n² + b·n + c và chọn một cận g(n), rồi tăng dần n. Quan sát tỉ số f(n)/g(n): nó ổn định, giảm dần về 0, hay cứ tăng mãi.',
  fields: { a: 'a (n²)', b: 'b (n)', c: 'c', maxN: 'n lớn nhất' },
  boundLegend: 'Cận g(n)',
  names: NAMES,
  fieldError: 'Các hệ số phải là số nguyên: a từ 0 đến 10, b từ 0 đến 100, c từ 0 đến 1000.',
  zeroError: 'f(n) không được bằng 0 ở mọi nơi: hãy cho ít nhất một hệ số giá trị dương.',
  maxNError: 'n lớn nhất phải là số nguyên từ 2 đến 40.',
  plotScroller: 'Đồ thị tốc độ tăng, cuộn ngang được',
  fLabel: 'f(n)',
  /** @param {string} name */
  boundLabel: (name) => `${name} (cận g)`,
  /** @param {AsymptoticFrame} f @param {Poly} p @param {GrowthKey} bound */
  plotLabel: (f, p, bound) =>
    f.n === 0
      ? `Đồ thị thang logarit còn trống của f(n) = ${polyText(p)} so với ${NAMES[bound]}.`
      : `Đồ thị thang logarit đến n = ${f.n}: f(n) = ${fmt(/** @type {number} */ (f.f))}, ${NAMES[bound]} = ${fmt(/** @type {number} */ (f.g))}.`,
  /** @param {number} k */
  decade: (k) => (k === 0 ? '1' : `10${String(k).replace(/\d/g, (d) => SUP[d])}`),
  axisN: 'n',
  stats: {
    f: 'f(n)',
    g: 'g(n)',
    ratio: 'Tỉ số f(n) / g(n)',
    lead: 'Phần của f do số hạng bậc cao nhất',
  },
  noValue: '—',
  fmt,
  polyText,
  /** @param {number} share */
  percent: (share) => `${(share * 100).toFixed(1)}%`,
  valuesTitle: 'Giá trị tại n này',
  verdictTitle: 'Kết luận',
  verdictPending: 'Chạy đến bước cuối để xem kết luận.',
  /** @type {Record<import('$lib/algo-engine/asymptotic-notation.js').Verdict, string>} */
  verdictShort: { theta: 'Θ (chặt)', 'big-o': 'Chỉ O (cận trên)', omega: 'Chỉ Ω (cận dưới)' },
  practiceTitle: 'Tự kiểm tra',
  /** @param {AsymptoticFrame} f @param {Poly} p @param {GrowthKey} bound */
  describe(f, p, bound) {
    const g = NAMES[bound];
    switch (f.kind) {
      case 'start':
        return `f(n) = ${polyText(p)}. Chạy từng bước để so f(n) với g(n) = ${g} tại n = 1, 2, 3, …`;
      case 'eval':
        return f.ratio === null
          ? `n = ${f.n}: f(n) = ${fmt(/** @type {number} */ (f.f))} và ${g} = 0, nên tại đây tỉ số không xác định.`
          : `n = ${f.n}: f(n) = ${fmt(/** @type {number} */ (f.f))}, ${g} = ${fmt(/** @type {number} */ (f.g))}, tỉ số ${fmt(f.ratio)}.`;
      case 'done': {
        const w = /** @type {import('$lib/algo-engine/asymptotic-notation.js').Witness} */ (
          f.witness
        );
        const fp = `f(n) = ${polyText(p)}`;
        if (w.verdict === 'theta')
          return `${fp} = Θ(${g}): ${w.lower}·${g} ≤ f(n) ≤ ${w.upper}·${g} với mọi n ≥ 1, nên tỉ số luôn nằm giữa ${w.lower} và ${w.upper}.`;
        if (w.verdict === 'big-o')
          return `${fp} = O(${g}) nhưng không phải Ω(${g}): f(n) ≤ ${w.upper}·${g} với mọi n ≥ ${w.upperFrom}, và tỉ số giảm dần về 0.`;
        return `${fp} = Ω(${g}) nhưng không phải O(${g}): f(n) ≥ ${w.lower}·${g} với mọi n ≥ 1, và tỉ số tăng không giới hạn.`;
      }
    }
  },
  takeaways: [
    'f(n) = O(g(n)) nghĩa là có các hằng số c > 0 và n₀ sao cho f(n) ≤ c·g(n) với mọi n ≥ n₀: khi n lớn, g là cận trên của f, sai khác một hằng số nhân.',
    'f(n) = Ω(g(n)) là cận dưới tương ứng, f(n) ≥ c·g(n) với mọi n ≥ n₀; Θ nghĩa là có cả hai, nên f và g tăng cùng tốc độ.',
    'Chỉ số hạng trội mới quan trọng: trong 3n² + 20n + 50, số hạng n² lấn át khi n tăng, nên cả tổng là Θ(n²) và các hằng số 3, 20, 50 bị bỏ đi.',
    'Từ chậm nhất đến nhanh nhất: 1 < log n < n < n log n < n² < 2ⁿ. Trên đồ thị thang logarit, 2ⁿ là một đường thẳng bỏ xa mọi đa thức.',
    'Thử a = 0, b = 100, c = 1000 so với n², n lớn nhất là 40: lúc đầu f nằm cao hơn n² rất nhiều, nhưng tỉ số giảm từ 1100 tại n = 1 xuống khoảng 3 tại n = 40 và còn tiếp tục giảm về 0, nên f = O(n²) nhưng không phải Θ(n²).',
  ],
  complexityHead: ['Kí hiệu', 'Ý nghĩa', 'Định nghĩa'],
  complexity: [
    ['f = O(g)', 'f ≤ c·g', 'Cận trên: với một c > 0, một n₀ nào đó và mọi n ≥ n₀.'],
    ['f = Ω(g)', 'f ≥ c·g', 'Cận dưới: với một c > 0, một n₀ nào đó và mọi n ≥ n₀.'],
    ['f = Θ(g)', 'c₁·g ≤ f ≤ c₂·g', 'Cả hai cận cùng lúc: f và g tăng cùng tốc độ.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt: 'Viết cận chặt của f(n) = 4n² + 100n + 7 bằng kí hiệu Θ.',
      accept: ['Θ(n²)', 'Theta(n²)', 'Θ n²', 'n²'],
      hints: ['Giữ lại số hạng trội và bỏ hằng số nhân của nó.'],
      solution:
        'Khi n lớn, số hạng 4n² lấn át: 4n² ≤ f(n) ≤ 111n² với mọi n ≥ 1, nên f(n) = Θ(n²).',
    },
    {
      type: 'multi',
      prompt: 'Cho f(n) = 5n + 3. Những khẳng định nào đúng?',
      options: ['f(n) = O(n)', 'f(n) = O(n²)', 'f(n) = Ω(n²)', 'f(n) = Θ(n)'],
      answers: [0, 1, 3],
      hints: [
        'O lớn chỉ là cận trên, nên một cận trên lỏng hơn vẫn đúng.',
        'Đặt a = 0, b = 5, c = 3 rồi thử các cận n và n² trong phần tương tác.',
      ],
      solution:
        '5n ≤ 5n + 3 ≤ 8n với n ≥ 1 cho ta Θ(n), do đó cũng là O(n). n² tăng nhanh hơn nên f = O(n²) cũng đúng, nhưng f không phải Ω(n²): tỉ số (5n + 3)/n² giảm dần về 0.',
    },
    {
      type: 'number',
      prompt:
        'Với f(n) = 3n² + 20n + 50 và g(n) = n², số nguyên n₀ nhỏ nhất sao cho f(n) ≤ 4·g(n) với mọi n ≥ n₀ là bao nhiêu?',
      answer: 23,
      hints: [
        'f(n) ≤ 4n² tương đương với n² ≥ 20n + 50.',
        'Trong phần tương tác, tìm n đầu tiên mà tỉ số f(n)/g(n) giảm xuống 4 hoặc thấp hơn.',
      ],
      solution:
        'n² − 20n − 50 ≥ 0 đúng khi n ≥ 10 + √150 ≈ 22,2. Tại n = 22: 484 < 490, nên chưa thoả; tại n = 23: 529 ≥ 510, nên n₀ = 23 (tỉ số ≈ 3.96).',
    },
    {
      type: 'order',
      prompt: 'Sắp xếp các tốc độ tăng này từ chậm nhất đến nhanh nhất.',
      items: ['n²', 'log n', '2ⁿ', 'n log n', 'n'],
      answer: [1, 4, 3, 0, 2],
      hints: ['So sánh chúng tại n = 1024, khi đó log₂ n = 10.'],
      solution:
        'Tại n = 1024: log n = 10, n = 1024, n log n = 10\u00a0240, n² ≈ 1 triệu, còn 2ⁿ có 309 chữ số. Vậy log n < n < n log n < n² < 2ⁿ.',
    },
  ],
  nextTeaser:
    'Đã có kí hiệu, giờ ta áp dụng nó. Bài sau, Phân tích vòng lặp và đệ quy, biến mã thành một tổng hay một hệ thức truy hồi.',
};
