/** @typedef {import('$lib/algo-engine/matrix-exponentiation.js').MatrixPowFrame} MatrixPowFrame */

/** A number as code writes it: no grouping, so it matches the visual. @param {number} n */
const num = (n) => String(n);

export const vi = {
  slug: 'matrix-exponentiation',
  topic: 'algebraic-randomised',
  level: 'Trung bình',
  title: 'Luỹ thừa ma trận',
  intro:
    'Một hệ thức truy hồi (recurrence) tuyến tính như dãy Fibonacci, Fₙ = Fₙ₋₁ + Fₙ₋₂, đẩy một vectơ trạng thái nhỏ đi một bước bằng cách nhân nó với một ma trận cố định M. Vậy n bước là một phép nhân với Mⁿ, và ta tính Mⁿ bằng cách bình phương liên tiếp, chỉ mất khoảng log₂ n phép nhân ma trận. Nhờ đó số Fibonacci thứ 10¹⁵ theo modulo 10⁹ + 7 chỉ cần 69 phép nhân ma trận thay vì 10¹⁵ phép cộng.',
  summary:
    'Biến một hệ thức truy hồi tuyến tính thành ma trận và tính số hạng thứ n trong O(k³ log n) bằng cách bình phương ma trận.',
  instruction:
    'Chọn một hệ thức truy hồi, nhập n rồi chạy từng bước. Các bit của n được đọc từ phải sang trái: bit 1 nhân bình phương hiện tại P vào kết quả R, rồi P được bình phương cho bit tiếp theo. So sánh “Số phép nhân ma trận” với “Số bước của vòng lặp thường”, rồi chuyển sang “mod m” và thử n = 10¹⁵ nhé.',
  fields: {
    recurrence: 'Hệ thức truy hồi',
    arithmetic: 'Phép tính',
    n: 'Chỉ số n',
    m: 'Modulo m',
  },
  recurrences: {
    fibonacci: 'Fibonacci: Fₙ = Fₙ₋₁ + Fₙ₋₂',
    pell: 'Pell: Pₙ = 2Pₙ₋₁ + Pₙ₋₂',
    tribonacci: 'Tribonacci: Tₙ = Tₙ₋₁ + Tₙ₋₂ + Tₙ₋₃',
  },
  /** The sequence letter each recurrence uses in narration. */
  letters: { fibonacci: 'F', pell: 'P', tribonacci: 'T' },
  arithmetic: { exact: 'Chính xác', mod: 'mod m' },
  presetLabel: 'Ví dụ',
  presets: {
    fib10: 'F₁₀, chính xác',
    fib1000: 'F₁₀₀₀, chính xác (209 chữ số)',
    fibMod: 'F tại 10¹⁵, mod 10⁹ + 7',
    pellMod: 'Pell tại 10⁶, mod 10⁹ + 7',
    tribonacci: 'Tribonacci T₂₀',
  },
  /** @param {number} max */
  nError: (max) => `n phải là số nguyên từ 0 đến ${num(max)}.`,
  /** @param {number} min @param {number} max */
  mError: (min, max) => `Modulo phải là số nguyên từ ${num(min)} đến ${num(max)}.`,
  /** @param {number} max */
  exactClamped: (max) =>
    `Số chính xác dài thêm một lượng chữ số cố định sau mỗi bước, nên chế độ chính xác dừng ở n = ${num(max)}. n đã được đặt về ${num(max)}.`,
  setupTitle: 'Hệ thức truy hồi dưới dạng ma trận',
  setupNote: 'Một bước: (trạng thái mới) = M · (trạng thái). n bước: Mⁿ · v₀.',
  matrixM: 'M',
  vectorV0: 'v₀',
  /** @param {number} k */
  vectorHint: (k) =>
    k === 2 ? 'v₀ = (a₁, a₀), hai số hạng đầu' : 'v₀ = (a₂, a₁, a₀), ba số hạng đầu',
  bitsTitle: 'Các bit của n, đọc từ phải sang trái',
  /** @param {number} n */
  bitsAria: (n) => `Chỉ số ${num(n)} viết ở hệ nhị phân.`,
  /** @param {number} i @param {number} bit @param {string} state */
  bitLabel: (i, bit, state) => `Bit có trọng số 2 mũ ${i}: ${bit}${state ? `, ${state}` : ''}`,
  bitStates: { current: 'đang đọc', used: 'đã nhân vào', skipped: 'bỏ qua', waiting: '' },
  bitMarkers: { current: '▲', used: '✓', skipped: '·', waiting: '' },
  bitPointer: 'đọc',
  legend: {
    current: '▲ Đang đọc',
    used: '✓ Bằng 1: nhân P vào R',
    skipped: '· Bằng 0: bỏ qua',
  },
  /** @param {number} power */
  resultTitle: (power) => `Kết quả R = M^${num(power)}`,
  /** @param {number} power */
  squareTitle: (power) => `Bình phương hiện tại P = M^${num(power)}`,
  changed: '✱ vừa đổi',
  /** @param {string} name @param {number} rows */
  matrixAria: (name, rows) => `${name}, ma trận ${rows} × ${rows}`,
  /**
   * An entry short enough for a matrix cell; the full number is in its title.
   * @param {string} s
   */
  entry: (s) => (s.length <= 12 ? s : `${s.slice(0, 5)}…${s.slice(-5)}`),
  /** @param {string} s */
  entryTitle: (s) => (s.length <= 12 ? s : `${s} (${s.length} chữ số)`),
  stats: {
    answer: 'aₙ',
    products: 'Số phép nhân ma trận',
    scalar: 'Số phép nhân số',
    loop: 'Số bước của vòng lặp thường',
    digits: 'Số chữ số của phần tử lớn nhất',
  },
  /** @param {string} letter @param {number} n */
  answerName: (letter, n) => `${letter}(${num(n)})`,
  answerPending: 'chạy đến bước cuối',
  invariantTitle: 'Điều đang đúng lúc này',
  /** @param {MatrixPowFrame} f */
  invariant: (f) =>
    `R = M^${num(f.covered)}, P = M^${num(f.power)}${f.mod === null ? '' : ` (mod ${num(f.mod)})`}`,
  chipsTitle: 'R là M mũ tổng các luỹ thừa này',
  chipsEmpty: 'chưa có gì',
  /**
   * @param {MatrixPowFrame} f
   * @param {string} letter
   */
  describe(f, letter) {
    const modText = f.mod === null ? '' : `, mod ${num(f.mod)}`;
    switch (f.kind) {
      case 'start':
        return f.n === 0
          ? `n = 0 nên không có bit nào để đọc: R vẫn là ma trận đơn vị và ${letter}(0) là phần tử cuối của v₀.`
          : `Tìm ${letter}(${num(f.n)})${modText}. Ở hệ nhị phân, n là ${f.bits.join('')}. Bắt đầu với R = I (tức M⁰) và P = M.`;
      case 'bit':
        return f.e % 2 === 1
          ? `e = ${num(f.e)} lẻ nên bit ${f.k} bằng 1: M^${num(f.power)} góp vào đáp án.`
          : `e = ${num(f.e)} chẵn nên bit ${f.k} bằng 0: bỏ qua M^${num(f.power)}.`;
      case 'multiply':
        return `R = R · P, một tích ${f.size}×${f.size} (${f.size ** 3} phép nhân số). Giờ R = M^${num(f.covered)}.`;
      case 'square':
        return `Chia đôi e còn ${num(f.e)}, rồi bình phương P = P · P để có M^${num(f.power)} cho bit tiếp theo.`;
      case 'halve':
        return `Chia đôi e còn 0. Mọi bit đã được đọc, nên vòng lặp kết thúc mà không cần bình phương thêm lần nào.`;
      case 'done':
        return `R = Mⁿ, nên ${letter}(${num(f.n)})${modText} = ${f.answer.length > 40 ? `một số có ${f.answer.length} chữ số` : f.answer}, tìm được sau ${num(f.matrixProducts)} phép nhân ma trận thay vì ${num(f.n)} bước.`;
    }
  },
  takeaways: [
    'Một hệ thức truy hồi tuyến tính bậc k giữ trạng thái gồm k số hạng gần nhất. Một bước là ma trận M cỡ k×k nhân với trạng thái đó: hàng đầu chứa các hệ số, còn các số 1 ngay dưới đường chéo đẩy các số hạng cũ xuống.',
    'Vì vậy trạng thái thứ n là Mⁿ nhân với vectơ ban đầu. Với dãy Fibonacci, Mⁿ = [[Fₙ₊₁, Fₙ], [Fₙ, Fₙ₋₁]].',
    'Phép nhân ma trận có tính kết hợp, nên ta dựng Mⁿ bằng cách bình phương, y như với aⁿ: mỗi bit của n sau bit đầu tốn một lần bình phương, mỗi bit 1 tốn một phép nhân, tổng cộng nhiều nhất 2⌊log₂ n⌋ + 1 phép nhân ma trận.',
    'Mỗi tích hai ma trận k×k tốn k³ phép nhân, nên tổng là O(k³ log n). Ở chế độ chính xác, mỗi bước Fibonacci thêm khoảng 0,21 chữ số, vì thế các đề thi lập trình thường hỏi đáp án theo modulo m.',
    'Thử “F tại 10¹⁵, mod 10⁹ + 7”: n có 50 bit, nên 69 phép nhân ma trận thay cho 10¹⁵ bước lặp.',
  ],
  complexityHead: ['Cách làm', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Vòng lặp thường', 'O(k·n)', 'Mỗi chỉ số một bước, mỗi bước cộng k số hạng trước đó.'],
    [
      'Luỹ thừa ma trận',
      'O(k³ log n)',
      'Khoảng 2·log₂ n tích ma trận k×k, mỗi tích k³ phép nhân số.',
    ],
    ['Bộ nhớ', 'O(k²)', 'Chỉ cần R, P và M. Trang này giữ mọi khung hình để bạn lùi lại được.'],
    [
      'Fibonacci chính xác',
      'O(n) chữ số',
      'Fₙ có khoảng 0,209·n chữ số, nên tính chính xác chậm dần khi n lớn; lấy mod m giữ mọi phần tử nhỏ hơn m.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Chọn “F₁₀, chính xác” rồi chạy đến bước cuối. Cần bao nhiêu phép nhân ma trận?',
      answer: 5,
      unit: 'phép nhân',
      hints: [
        '10 viết ở hệ nhị phân là 1010: đếm một lần bình phương cho mỗi bit sau bit đầu, cộng thêm một cho mỗi bit 1.',
      ],
      solution:
        '10 = 1010₂ có 4 bit, nên P được bình phương 3 lần, và có hai bit bằng 1, nên R nhận 2 phép nhân: tổng cộng 5. Đáp án là F₁₀ = 55.',
    },
    {
      type: 'choice',
      prompt:
        'Hệ thức aₙ = 3aₙ₋₁ − 2aₙ₋₂ dùng trạng thái (aₙ₋₁, aₙ₋₂). Ma trận nào đẩy nó đi một bước?',
      options: ['[[3, −2], [1, 0]]', '[[1, 0], [3, −2]]', '[[3, 1], [−2, 0]]', '[[−2, 3], [0, 1]]'],
      answer: 0,
      hints: ['Hàng đầu phải tạo ra số hạng mới aₙ; hàng thứ hai phải chép aₙ₋₁ xuống ô thứ hai.'],
      solution:
        'Hàng một cho 3aₙ₋₁ − 2aₙ₋₂ = aₙ, còn hàng hai (1, 0) chép aₙ₋₁. Vậy M = [[3, −2], [1, 0]].',
    },
    {
      type: 'text',
      prompt: 'Thời gian chạy của luỹ thừa ma trận với hệ thức truy hồi bậc k là bao nhiêu?',
      accept: ['O(k^3 log n)', 'O(k³ log n)', 'O(log n · k^3)', 'O(k^3 · log n)'],
      hints: ['Đếm số phép nhân ma trận, rồi nhân với chi phí của mỗi phép.'],
      solution:
        'Có O(log n) phép nhân ma trận (một hoặc hai phép cho mỗi bit của n), và mỗi tích k×k tốn k³ phép nhân: O(k³ log n).',
    },
    {
      type: 'number',
      prompt:
        'Chọn Tribonacci, giữ chế độ chính xác, đặt n = 20 rồi chạy đến bước cuối. T(20) bằng bao nhiêu?',
      answer: 35890,
      hints: [
        'Dãy Tribonacci ở đây bắt đầu bằng 0, 0, 1, nên T(3) = 1, T(4) = 2, T(5) = 4, …',
        'Đọc thẻ aₙ ở bước cuối.',
      ],
      solution:
        'Dãy chạy 0, 0, 1, 1, 2, 4, 7, 13, 24, 44, 81, 149, 274, 504, 927, 1705, 3136, 5768, 10609, 19513, 35890, nên T(20) = 35890.',
    },
    {
      type: 'number',
      prompt: 'Chọn “F tại 10¹⁵, mod 10⁹ + 7” rồi chạy đến bước cuối. Cần bao nhiêu phép nhân số?',
      answer: 552,
      unit: 'phép nhân',
      hints: ['10¹⁵ có 50 bit, trong đó 20 bit bằng 1. Mỗi tích 2×2 tốn 2³ = 8 phép nhân.'],
      solution:
        'P được bình phương một lần cho mỗi bit sau bit đầu (49 lần) và nhân vào R một lần cho mỗi bit 1 (20 lần): 69 phép nhân ma trận. Mỗi phép tốn 8 phép nhân số, nên 69 · 8 = 552.',
    },
  ],
  nextTeaser:
    'Bài sau dùng một ý tưởng chia đôi tương tự cho đa thức: biến đổi Fourier nhanh nhân hai đa thức trong O(n log n).',
};
