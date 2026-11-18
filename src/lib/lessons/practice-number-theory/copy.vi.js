/** @typedef {import('$lib/algo-engine/practice-number-theory.js').PracticeFrame} PracticeFrame */
/** @typedef {import('$lib/algo-engine/practice-number-theory.js').CalcOp} CalcOp */

/** Numbers that mirror the widget use plain programming notation, with no grouping. */
/** @param {number} n */
const big = (n) => String(n);

export const vi = {
  slug: 'practice-number-theory',
  topic: 'number-theory',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán lí thuyết số',
  intro:
    'Nhiều bài thi lập trình quy về việc đếm theo số dư hoặc tính tổng trên các ước. Sân tập này chạy bốn kĩ thuật kinh điển từng bước một và kiểm tra phần làm của em: tự tính tổng tạm thời tiếp theo, và nút Kiểm tra chỉ cho đi tiếp khi em tính đúng. Máy tính bên cạnh lo phần số học đồng dư trên đường đi.',
  summary:
    'Luyện tính tổng các ước và đếm theo số dư trong một sân tập từng bước, nơi mỗi tổng tạm thời em tính đều được kiểm tra, kèm một máy tính đồng dư.',
  instruction:
    'Chọn một bài toán và nhập đầu vào của riêng em. Ở mỗi bước, tính tổng tạm thời tiếp theo, nhập vào ô “Đến lượt em” rồi bấm Kiểm tra, hoặc bấm Bước tiếp để xem đáp số. Dùng máy tính cho phần tính toán, rồi trả lời các câu hỏi bên dưới.',
  puzzleLabel: 'Bài toán',
  puzzles: {
    divisors: 'σ(n) và τ(n)',
    rangeSum: 'Tổng σ(i) đến N',
    pairs: 'Cặp chia hết cho m',
    subarrays: 'Mảng con chia hết cho m',
  },
  fields: { n: 'Số n', N: 'Giới hạn N', values: 'Các giá trị', m: 'Modulo m' },
  /** @param {number} max */
  nError: (max) => `n phải là số nguyên từ 1 đến ${big(max)}.`,
  /** @param {number} max */
  rangeError: (max) => `N phải là số nguyên từ 1 đến ${max}.`,
  /** @param {number} max */
  modulusError: (max) => `m phải là số nguyên từ 1 đến ${max}.`,
  /** @param {number} maxN @param {number} max */
  valuesError: (maxN, max) =>
    `Nhập từ 1 đến ${maxN} số nguyên trong khoảng 0 đến ${max}, cách nhau bằng dấu phẩy.`,

  valuesTitle: 'Các giá trị',
  /** @param {number} m */
  valuesAria: (m) => `Các giá trị, đọc từ trái sang phải, với modulo ${m}.`,
  valuePointer: 'a',
  seenTitle: 'seen[r]: đến giờ đã gặp bao nhiêu số dư mỗi loại',
  seenAria: 'Số lần gặp mỗi số dư đến giờ.',
  /** @param {number} r @param {number} count @param {string} state */
  seenLabel: (r, count, state) => `Số dư ${r}: đã gặp ${count}${state ? `, ${state}` : ''}`,
  seenStates: { lookup: 'đang tra', bumped: 'vừa đếm', plain: '' },
  seenMarkers: { lookup: '?', bumped: '+', plain: '' },
  legend: { lookup: '? Đang tra', bumped: '+ Giá trị này được đếm ở đây' },
  tableTitle: 'Phần làm của em',
  tableHead: {
    divisors: ['Số nguyên tố p', 'Số mũ e', '1 + p + … + pᵉ', 'σ đến giờ'],
    rangeSum: ['d', '⌊N / d⌋', 'd · ⌊N / d⌋', 'Tổng'],
  },
  tableEmpty: 'Các hàng hiện ra khi từng bước xong.',
  /** @param {number} hidden */
  tableHidden: (hidden) => `Còn ${hidden} hàng trước đó ở phía trên.`,
  divisorsTitle: 'Mọi ước của n',
  divisorsEmpty: 'liệt kê ở bước cuối',

  askTitle: 'Đến lượt em',
  askLabels: {
    divisors: 'σ sau số nguyên tố này',
    rangeSum: 'Tổng sau d này',
    pairs: 'Tổng sau giá trị này',
    subarrays: 'Tổng sau giá trị này',
  },
  askCheck: 'Kiểm tra',
  askIdle: 'Bước này không có gì để tính. Bấm Bước tiếp.',
  askDone: 'Đã xong. Nhập đầu vào mới hoặc chọn bài toán khác.',
  askEmpty: 'Hãy nhập một số nguyên trước đã.',
  /** @param {number} value */
  askRight: (value) => `Đúng rồi! Tổng là ${big(value)}.`,
  /** @param {PracticeFrame} f */
  askWrong(f) {
    switch (f.puzzle) {
      case 'divisors':
        return `Chưa đúng. Nhân σ = ${big(f.total)} với ${big(f.count)}.`;
      case 'rangeSum':
        return `Chưa đúng. Cộng d · ⌊N / d⌋ vào ${big(f.total)}.`;
      default:
        return `Chưa đúng. Cộng seen[${f.need}] vào ${f.total}.`;
    }
  },
  stats: {
    answer: {
      divisors: 'σ đến giờ',
      rangeSum: 'Tổng đến giờ',
      pairs: 'Số cặp đến giờ',
      subarrays: 'Số mảng con đến giờ',
    },
    tau: 'τ đến giờ',
    steps: 'Số bước',
    brute: 'Số lần kiểm tra nếu vét cạn',
    right: 'Số câu em trả lời đúng',
    wrong: 'Số câu em trả lời sai',
  },
  /** @param {PracticeFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        switch (f.puzzle) {
          case 'divisors':
            return `Tìm tổng σ và số lượng τ các ước của ${big(f.input)}. Mỗi luỹ thừa của một số nguyên tố góp một thừa số vào mỗi đại lượng.`;
          case 'rangeSum':
            return `Tính σ(1) + … + σ(${f.input}). Thay vì liệt kê ước của từng số, hãy hỏi mỗi d là ước của bao nhiêu số.`;
          case 'pairs':
            return `Đếm các cặp có tổng chia hết cho ${f.m}. Đọc mỗi giá trị một lần và ghép nó với các giá trị trước đó có số dư bù với nó.`;
          default:
            return `Đếm các mảng con có tổng chia hết cho ${f.m}. seen[0] bắt đầu bằng 1 cho tiền tố rỗng, vì hai tiền tố có cùng số dư xác định một mảng con như vậy.`;
        }
      case 'factor':
        return `${big(f.d)}^${f.e} là luỹ thừa cao nhất của ${big(f.d)} chia hết n. Nó nhân σ với 1 + … + ${big(f.d)}^${f.e} = ${big(f.count)} và nhân τ với ${f.e + 1}. Giờ σ bằng bao nhiêu?`;
      case 'apply':
        return `σ = ${big(f.total)} và τ = ${big(f.tau)}.`;
      case 'term':
        return `d = ${f.d} là ước của ⌊${f.input} / ${f.d}⌋ = ${f.count} số trong các số đến ${f.input}, nên nó góp thêm ${f.d}·${f.count}. Giờ tổng bằng bao nhiêu?`;
      case 'add':
        return `Cộng thêm ${f.added}: tổng là ${big(f.total)}.`;
      case 'read':
        return f.puzzle === 'pairs'
          ? `Giá trị ${f.values[f.i]} có số dư ${f.r}, nên cần số dư ${f.need}: seen[${f.need}] = ${f.seen[f.need]}. Giờ tổng bằng bao nhiêu?`
          : `Giá trị ${f.values[f.i]} đưa số dư của tiền tố thành s = ${f.r}, và seen[${f.r}] = ${f.seen[f.r]}. Giờ tổng bằng bao nhiêu?`;
      case 'count':
        return `Cộng thêm ${f.added}: tổng là ${f.total}. Đếm số dư này vào seen[${f.r}].`;
      case 'done':
        switch (f.puzzle) {
          case 'divisors':
            return `σ(${big(f.input)}) = ${big(f.total)} và τ(${big(f.input)}) = ${big(f.tau)}.`;
          case 'rangeSum':
            return `σ(1) + … + σ(${f.input}) = ${big(f.total)}, sau ${f.steps} vòng.`;
          case 'pairs':
            return `Có ${f.total} cặp có tổng là bội của ${f.m}.`;
          default:
            return `Có ${f.total} mảng con có tổng là bội của ${f.m}.`;
        }
    }
  },

  calcTitle: 'Máy tính đồng dư',
  calcFields: { a: 'a', op: 'Phép toán', b: 'b', m: 'mod m' },
  calcOps: {
    add: 'a + b',
    sub: 'a − b',
    mul: 'a · b',
    pow: 'a mũ b',
    div: 'a ÷ b (a · b⁻¹)',
  },
  /** @param {number} max */
  calcValueError: (max) => `a và b phải là số nguyên từ 0 đến ${big(max)}.`,
  /** @param {number} max */
  calcModulusError: (max) => `m phải là số nguyên từ 1 đến ${big(max)}.`,
  /** @param {number} b @param {number} m */
  calcNoInverse: (b, m) =>
    `${big(b)} không có nghịch đảo theo modulo ${big(m)}, vì hai số có ước chung.`,
  /**
   * @param {CalcOp} op @param {number} a @param {number} b @param {number} m @param {number} value
   * @param {number | null} inverse
   */
  calcResult(op, a, b, m, value, inverse) {
    const symbol = { add: '+', sub: '−', mul: '·', pow: '^', div: '÷' }[op];
    const line = `${big(a)} ${symbol} ${big(b)} ≡ ${big(value)} (mod ${big(m)})`;
    return inverse === null ? line : `${line}, dùng ${big(b)}⁻¹ ≡ ${big(inverse)}`;
  },

  takeaways: [
    'Nếu n = p₁^e₁ ··· pₖ^eₖ thì τ(n) = ∏(eᵢ + 1) và σ(n) = ∏(1 + pᵢ + … + pᵢ^eᵢ). Mỗi ước chọn một luỹ thừa của từng số nguyên tố, vì thế tổng tách được thành tích.',
    'τ(n) lẻ khi và chỉ khi n là số chính phương, vì các ước ghép đôi thành d và n/d, trừ √n.',
    'Đổi thứ tự một tổng kép: σ(1) + … + σ(N) = Σ d·⌊N/d⌋, vì d là ước của ⌊N/d⌋ số trong các số đến N. Cách này giảm O(N²) lần kiểm tra xuống còn O(N) vòng.',
    'Đếm theo số dư thay vì theo cặp. (a + b) ≡ 0 (mod m) chỉ đòi hai số dư bù nhau, còn một mảng con có tổng ≡ 0 khi và chỉ khi hai prefix sum (tổng tiền tố) ở hai đầu có cùng số dư. Một lượt duyệt với m bucket (ngăn) thay cho O(n²) lần kiểm tra.',
    'Thử các giá trị 3, 3, 3, 3 với m = 3 ở cả hai bài đếm: mọi cặp và mọi mảng con đều được tính. So sánh các tổng với n(n − 1)/2 và n(n + 1)/2.',
  ],
  complexityHead: ['Kĩ thuật', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'σ(n) và τ(n)',
      'O(√n) thời gian, O(1) bộ nhớ',
      'Chia thử đến √n. Phần còn lại là 1 hoặc thêm một số nguyên tố nữa.',
    ],
    [
      'Tổng σ(i) đến N',
      'O(N) thời gian, O(1) bộ nhớ',
      'Mỗi d một vòng. Gộp các d có cùng giá trị ⌊N/d⌋ thì còn O(√N).',
    ],
    [
      'Cặp có tổng chia hết cho m',
      'O(n + m) thời gian, O(m) bộ nhớ',
      'Mỗi giá trị một lần tra và một lần cập nhật, so với n(n − 1)/2 cặp nếu vét cạn.',
    ],
    [
      'Mảng con có tổng chia hết cho m',
      'O(n + m) thời gian, O(m) bộ nhớ',
      'Cũng các bucket ấy nhưng trên số dư của tiền tố, so với n(n + 1)/2 mảng con.',
    ],
  ],
  practiceTitle: 'Bài tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Tính σ(360), tổng mọi ước của 360.',
      answer: 1170,
      hints: ['360 = 2³·3²·5. Chạy bài toán thứ nhất với n = 360.'],
      solution: 'σ = (1 + 2 + 4 + 8)·(1 + 3 + 9)·(1 + 5) = 15·13·6 = 1170.',
    },
    {
      type: 'number',
      prompt: '360 có bao nhiêu ước?',
      answer: 24,
      unit: 'ước',
      hints: ['Nhân các (số mũ + 1) theo từng số nguyên tố của 360.'],
      solution: '360 = 2³·3²·5, nên τ = (3 + 1)(2 + 1)(1 + 1) = 24.',
    },
    {
      type: 'multi',
      prompt: 'Những số nào có số ước là số lẻ?',
      options: ['36', '49', '50', '360'],
      answers: [0, 1],
      hints: ['Chạy bài toán thứ nhất với từng số và đọc τ. Các số có τ lẻ có điểm gì chung?'],
      solution:
        'τ(36) = 9 và τ(49) = 3 là số lẻ, vì cả hai đều là số chính phương. τ(50) = 6 và τ(360) = 24 là số chẵn.',
    },
    {
      type: 'number',
      prompt: 'Tính σ(1) + σ(2) + … + σ(10).',
      answer: 87,
      hints: ['Chạy bài toán thứ hai với N = 10 và đọc tổng cuối cùng.'],
      solution:
        'Σ d·⌊10/d⌋ = 10 + 10 + 9 + 8 + 10 + 6 + 7 + 8 + 9 + 10 = 87. Cộng từng số, σ(1) đến σ(10) cũng ra như vậy: 1 + 3 + 4 + 7 + 6 + 12 + 8 + 15 + 13 + 18.',
    },
    {
      type: 'number',
      prompt: 'Trong dãy 1, 2, 3, 4, 5, 6, có bao nhiêu cặp có tổng chia hết cho 3?',
      answer: 5,
      unit: 'cặp',
      hints: ['Chạy bài toán thứ ba với m = 3. Các số dư là 1, 2, 0, 1, 2, 0.'],
      solution:
        'Hai giá trị dư 1 ghép với hai giá trị dư 2: 4 cặp. Hai giá trị dư 0 cho thêm một cặp: tổng cộng 5.',
    },
    {
      type: 'number',
      prompt: 'Trong dãy 4, 5, 0, 2, 3, 1, có bao nhiêu mảng con có tổng chia hết cho 5?',
      answer: 7,
      unit: 'mảng con',
      hints: [
        'Chạy bài toán thứ tư với m = 5.',
        'Các số dư của tiền tố, bắt đầu từ tiền tố rỗng, là 0, 4, 4, 4, 1, 4, 0.',
      ],
      solution: 'Số dư 4 xuất hiện 4 lần và số dư 0 hai lần, nên C(4, 2) + C(2, 2) = 6 + 1 = 7.',
    },
    {
      type: 'number',
      prompt: 'Có bao nhiêu số nguyên từ 1 đến 100 chia cho 7 dư 3?',
      answer: 14,
      hints: ['Đó là 3, 10, 17, …. Từ 3 đến 100 chứa được bao nhiêu bước nhảy 7?'],
      solution: '⌊(100 − 3) / 7⌋ + 1 = 13 + 1 = 14, số cuối cùng là 94.',
    },
    {
      type: 'number',
      prompt: 'Dùng máy tính: 5 ÷ 3 mod 7 bằng bao nhiêu?',
      answer: 4,
      hints: ['Chia nghĩa là nhân với nghịch đảo. Chọn a ÷ b trong máy tính.'],
      solution: '3·5 = 15 ≡ 1, nên 3⁻¹ ≡ 5 (mod 7) và 5 ÷ 3 ≡ 5·5 = 25 ≡ 4. Thử lại: 4·3 = 12 ≡ 5.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo mở đầu chủ đề hình học tính toán: điểm, vectơ và hướng quay, nền móng cho mọi bài toán hình học trên máy tính.',
};
