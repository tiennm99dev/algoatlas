/** @typedef {import('$lib/algo-engine/practice-algebraic-randomised.js').RecurrenceFrame} RecurrenceFrame */
/** @typedef {import('$lib/algo-engine/practice-algebraic-randomised.js').BigFrame} BigFrame */
/** @typedef {import('$lib/algo-engine/practice-algebraic-randomised.js').Recurrence} Recurrence */

const SUB = '₀₁₂₃₄₅₆₇₈₉';
/** Subscript digits. @param {number} n */
const sub = (n) => [...String(n)].map((d) => SUB[Number(d)]).join('');

/** aₙ₋ᵢ, or aₙ for i = 0. @param {number} i */
const term = (i) => (i === 0 ? 'aₙ' : `aₙ₋${sub(i)}`);

/** A number as code writes it, with no grouping. @param {number} n */
const big = (n) => String(n);

/** The 10ᵏ place name. @param {number} k */
const place = (k) => `10${[...String(k)].map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('')}`;

/** The recurrence as a formula. @param {Recurrence} rec */
function formula(rec) {
  const parts = rec.coeffs
    .map((c, j) => (c === 0 ? '' : `${c === 1 ? '' : `${c}·`}${term(j + 1)}`))
    .filter(Boolean);
  if (rec.constant !== 0) parts.push(String(rec.constant));
  return `aₙ = ${parts.length ? parts.join(' + ') : '0'}`;
}

/** @param {Recurrence} rec */
const startText = (rec) => rec.initial.map((v, i) => `a${sub(i)} = ${v}`).join(', ');

export const vi = {
  slug: 'practice-algebraic-randomised',
  topic: 'algebraic-randomised',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán đại số và ngẫu nhiên',
  intro:
    'Hai bước đại số giải được cả một họ lớn các bài thi lập trình. Một hệ thức truy hồi (recurrence) tuyến tính trở thành một ma trận, nên số hạng thứ n chỉ tốn thời gian O(k³ log n) kể cả khi n gần 10¹⁵. Còn nhân hai số lớn chính là tích chập các chữ số của chúng rồi xử lí phần nhớ, vì thế FFT, một cách nhân đa thức nhanh, cũng nhân nhanh được những số nguyên khổng lồ.',
  summary:
    'Biến mọi hệ thức truy hồi tuyến tính có hằng số thành ma trận chuyển rồi nâng nó lên luỹ thừa n, và nhân số lớn như một tích chập chữ số cộng với phần nhớ.',
  instruction:
    'Chọn một bài toán. Với hệ thức truy hồi, nhập các hệ số, một hằng số nếu có và các giá trị ban đầu, rồi chạy từng bước: trước hết ma trận được dựng từng hàng, sau đó luỹ thừa nhị phân bình phương nó. Với số lớn, nhập hai thừa số và xem mỗi tổng cột c[k] hình thành dọc một đường chéo của lưới chữ số trước khi xử lí phần nhớ. Dùng những gì em thấy để trả lời các câu hỏi bên dưới nhé.',
  problemLabel: 'Bài toán',
  problems: { recurrence: 'Từ hệ thức truy hồi đến ma trận', bignum: 'Nhân số lớn' },
  fields: {
    coeffs: 'Hệ số c₁ … cₖ',
    constant: 'Hằng số d',
    initial: 'Giá trị ban đầu a₀ … aₖ₋₁',
    n: 'Chỉ số n',
    mod: 'Modulo m',
    x: 'Số x',
    y: 'Số y',
  },
  presetLabel: 'Ví dụ',
  recurrencePresets: {
    fibonacci: 'Fibonacci, n = 100',
    constant: 'aₙ = 2aₙ₋₁ + 3aₙ₋₂ + 5',
    tribonacci: 'Tribonacci, n = 10¹²',
  },
  bigPresets: { small: '1234 × 5678', carries: '9999 × 9999', long: 'Hai số 12 chữ số' },
  /** @param {number} maxK @param {number} max */
  coeffsError: (maxK, max) =>
    `Hãy nhập từ 1 đến ${maxK} hệ số, là số nguyên từ 0 đến ${max}, ngăn cách bằng dấu phẩy hoặc dấu cách.`,
  /** @param {number} k @param {number} max */
  initialError: (k, max) =>
    `Hãy nhập đúng ${k} giá trị ban đầu từ 0 đến ${max}, mỗi giá trị cho một số trong a₀ … aₖ₋₁.`,
  /** @param {number} max */
  constantError: (max) => `Hằng số d phải là số nguyên từ 0 đến ${max}.`,
  /** @param {number} max */
  nError: (max) => `n phải là số nguyên từ 0 đến ${big(max)}.`,
  /** @param {number} min @param {number} max */
  modError: (min, max) => `m phải là số nguyên từ ${min} đến ${big(max)}.`,
  /** @param {number} max */
  bigError: (max) => `Hãy nhập một số nguyên có từ 1 đến ${max} chữ số, không bắt đầu bằng 0.`,

  formula,
  startText,
  term,
  matrixTitle: 'Ma trận chuyển M: trạng thái mới = M · trạng thái cũ',
  /** @param {number} size */
  matrixAria: (size) => `Ma trận chuyển ${size} × ${size}`,
  /** Column j of M multiplies this entry of the old state. @param {number} j @param {number} k */
  colHead: (j, k) => (j < k ? term(j + 1) : '1'),
  /** Row i of M produces this entry of the new state. @param {number} i @param {number} k */
  rowHead: (i, k) => (i < k ? term(i) : '1'),
  /** @param {number} covered */
  rTitle: (covered) => `R = M^${big(covered)} (mod m)`,
  /** @param {number} power */
  pTitle: (power) => `P = M^${big(power)} (mod m)`,
  rAria: 'Ma trận kết quả R',
  pAria: 'Ma trận luỹ thừa P',
  notYet: 'Chưa bắt đầu.',
  /** @param {string[]} v */
  startVector: (v) => `v₀ = (${v.join(', ')})`,
  /** @param {string[]} v @param {number} n */
  resultVector: (v, n) => `v${n < 1000 ? sub(n) : 'ₙ'} = R · v₀ = (${v.join(', ')})`,
  recStats: {
    e: 'e, phần còn lại của n',
    products: 'Số phép nhân ma trận',
    answer: 'aₙ mod m',
    size: 'Cỡ ma trận',
  },
  /** @param {number} size */
  sizeText: (size) => `${size} × ${size}`,
  /** @param {RecurrenceFrame} f @param {Recurrence} rec */
  describeRecurrence(f, rec) {
    const k = f.order;
    switch (f.kind) {
      case 'start':
        return `${formula(rec)}, với ${startText(rec)}. Trạng thái giữ ${k} số hạng gần nhất${f.size > k ? ' và một hằng số 1' : ''}, nên M có cỡ ${f.size} × ${f.size}.`;
      case 'row':
        if (f.row === 0)
          return `Hàng 0 tính số hạng mới aₙ: nó chứa các hệ số ${rec.coeffs.join(', ')}${f.size > k ? ` rồi đến hằng số ${rec.constant}, nhân với số 1` : ''}.`;
        if (f.row < k)
          return `Hàng ${f.row} chỉ chép ${term(f.row)} từ trạng thái cũ: một số 1 ở cột ${f.row - 1}.`;
        return 'Hàng cuối giữ hằng số 1 luôn bằng 1: toàn số 0, trừ một số 1 trên đường chéo.';
      case 'init':
        return `Bắt đầu với R = I và P = M, và e = n = ${big(f.n)}.`;
      case 'multiply':
        return `e = ${big(f.e)} lẻ, nên nhân R với P: giờ R là M^${big(f.covered)}.`;
      case 'skip':
        return `e = ${big(f.e)} chẵn, nên R vẫn là M^${big(f.covered)}.`;
      case 'square':
        return `Chia đôi e còn ${big(f.e)} và bình phương P: giờ P là M^${big(f.power)}.`;
      case 'halve':
        return `Chia đôi e còn 0: R = M^${big(f.covered)} = Mⁿ, sau ${big(f.matrixProducts)} phép nhân ma trận.`;
      case 'apply':
        return `Nhân Mⁿ với trạng thái ban đầu v₀. Kết quả là vₙ = (aₙ₊ₖ₋₁, …, aₙ${f.size > k ? ', 1' : ''}).`;
      case 'done':
        return `Phần tử thứ ${k - 1} của vₙ là a${f.n < 1000 ? sub(f.n) : 'ₙ'} = ${f.answer} (mod ${big(f.mod)}), tìm được sau ${big(f.matrixProducts)} phép nhân ma trận thay vì ${big(Math.max(0, f.n - k + 1))} bước lặp.`;
    }
  },

  markers: { row: '●', sum: '+', carry: '→' },
  legend: {
    row: '● Hàng đang dựng',
    sum: '+ Đường chéo i + j = k và tổng c[k] của nó',
    carry: '→ Hàng đơn vị đang xử lí phần nhớ, và chữ số mới của nó',
  },
  gridTitle: 'Tích các chữ số a[i] · b[j], hàng cao nhất trước',
  /** @param {string} x @param {string} y */
  gridAria: (x, y) => `Tích các chữ số của ${x} và ${y}`,
  /** Column or row header: the digit itself. @param {number} digit */
  digitHead: (digit) => String(digit),
  convTitle: 'Tổng cột c[k], trước khi xử lí phần nhớ',
  convAria: 'Tích chập c, hàng cao nhất trước',
  digitsTitle: 'Các chữ số của tích',
  digitsAria: 'Các chữ số của tích đến lúc này, hàng cao nhất trước',
  bigStats: {
    products: 'Số tích chữ số',
    carry: 'Nhớ',
    answer: 'x · y',
    length: 'Số chữ số của x · y',
  },
  /** @param {BigFrame} f */
  describeBig(f) {
    const x = f.a.slice().reverse().join('');
    const y = f.b.slice().reverse().join('');
    switch (f.kind) {
      case 'start':
        return `Nhân ${x} với ${y}. Viết cả hai thành danh sách chữ số, chữ số thấp nhất trước: a = [${f.a.join(', ')}], b = [${f.b.join(', ')}].`;
      case 'conv':
        return `c[${f.k}] cộng các tích trên một đường chéo, nơi i + j = ${f.k}: ${f.terms.map(([i, j]) => `${f.a[i]}·${f.b[j]}`).join(' + ')} = ${f.c[f.k]}.`;
      case 'carry':
        return `Hàng ${place(f.k)}: t = c[${f.k}] + nhớ = ${f.t}, nên chữ số là ${f.t % 10} và nhớ ${Math.floor(f.t / 10)}.`;
      case 'extra':
        return `Vẫn còn nhớ: thêm ${f.t % 10} làm chữ số cao nhất mới.`;
      case 'done':
        return `${x} × ${y} = ${f.answer}, từ ${big(f.products)} tích chữ số. FFT sẽ cho cùng các tổng cột đó trong O(n log n).`;
    }
  },

  takeaways: [
    'Với aₙ = c₁aₙ₋₁ + … + cₖaₙ₋ₖ, trạng thái (aₙ₋₁, …, aₙ₋ₖ) trở thành (aₙ, …, aₙ₋ₖ₊₁) qua một ma trận k × k: các hệ số ở hàng 0 và một ma trận đơn vị dịch xuống ở bên dưới.',
    'Một hằng số d thêm một phần tử trạng thái luôn bằng 1: d đứng cuối hàng 0, và một hàng cuối mới 0 … 0 1 giữ số 1 tại chỗ.',
    'Luỹ thừa nhị phân cần một lần bình phương cho mỗi bit của n và một phép nhân cho mỗi bit 1, nên aₙ tốn O(k³ log n) phép tính, mọi phần tử đều lấy mod m.',
    'Các chữ số của x · y trước khi xử lí phần nhớ là tích chập c[k] = Σ a[i]·b[k − i]: chính là hệ số của tích hai đa thức. Cách nhân thủ công làm len(a) · len(b) tích chữ số; FFT tính cùng tích chập đó trong O(n log n).',
    'Thử 9999 × 9999: mọi tổng cột đều lớn hơn 10, và sau cột cuối vẫn còn nhớ, nên tích có 8 chữ số.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'aₙ của hệ thức truy hồi bậc k',
      'O(k³ log n)',
      'Khoảng 2 log₂ n phép nhân ma trận, mỗi phép k³ phép nhân số.',
    ],
    ['aₙ bằng vòng lặp thường', 'O(k · n)', 'Mỗi số hạng một bước: vô vọng khi n gần 10¹⁵.'],
    [
      'Nhân số lớn, cách thủ công',
      'O(len(x) · len(y))',
      'Mỗi cặp chữ số được nhân một lần, rồi O(len) lần xử lí nhớ.',
    ],
    [
      'Nhân số lớn, FFT',
      'O(n log n)',
      'Tính giá trị hai đa thức chữ số tại các căn của đơn vị, nhân từng điểm, nội suy, rồi xử lí nhớ.',
    ],
    ['Bộ nhớ', 'O(k²) hoặc O(len(x) + len(y))', 'Hai hoặc ba ma trận, hoặc các tổng cột.'],
  ],
  practiceTitle: 'Bài luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Ma trận chuyển của aₙ = 2aₙ₋₁ + 3aₙ₋₂ + 5 có cỡ bao nhiêu? Cho biết số hàng.',
      answer: 3,
      unit: 'hàng',
      hints: ['Hai số hạng trước đó, cộng một phần tử cho hằng số.'],
      solution:
        'Trạng thái là (aₙ₋₁, aₙ₋₂, 1), nên M có cỡ 3 × 3: các hàng (2, 3, 5), (1, 0, 0) và (0, 0, 1).',
    },
    {
      type: 'number',
      prompt: 'Với aₙ = 2aₙ₋₁ + 3aₙ₋₂ + 5 và a₀ = a₁ = 1, a₁₀ bằng bao nhiêu?',
      answer: 66430,
      hints: [
        'Chọn ví dụ “aₙ = 2aₙ₋₁ + 3aₙ₋₂ + 5” rồi chạy đến bước cuối; m đủ lớn để không làm đổi kết quả.',
      ],
      solution:
        'Các số hạng là 1, 1, 10, 28, 91, 271, 820, 2458, 7381, 22141, 66430, nên a₁₀ = 66430.',
    },
    {
      type: 'number',
      prompt: 'Số Fibonacci thứ 100, F₁₀₀ (F₀ = 0, F₁ = 1), theo mod 1000000007 bằng bao nhiêu?',
      answer: 687995182,
      hints: ['Chọn “Fibonacci, n = 100”: đáp án là phần tử cuối cùng mà lần chạy đọc ra.'],
      solution:
        'Nâng [[1, 1], [1, 0]] lên luỹ thừa 100 theo mod 1000000007 rồi áp vào (1, 0) cho F₁₀₀ ≡ 687995182.',
    },
    {
      type: 'number',
      prompt:
        'Luỹ thừa nhị phân làm bao nhiêu phép nhân ma trận với n = 1000000? Đếm cả các tích R · P lẫn các lần bình phương.',
      answer: 26,
      unit: 'phép nhân',
      hints: [
        '1000000 ở hệ nhị phân có 20 bit, trong đó 7 bit bằng 1. Hoặc đặt n = 1000000 rồi đọc bộ đếm.',
      ],
      solution: 'Mỗi bit 1 một phép nhân (7) và mỗi bit sau bit đầu một lần bình phương (19): 26.',
    },
    {
      type: 'number',
      prompt: 'Trong 1234 × 5678, tổng cột c[2] trước khi xử lí phần nhớ bằng bao nhiêu?',
      answer: 61,
      hints: [
        'Chữ số thấp nhất trước, a = [4, 3, 2, 1] và b = [8, 7, 6, 5]. Cộng các a[i]·b[2 − i].',
      ],
      solution: 'c[2] = 4·6 + 3·7 + 2·8 = 24 + 21 + 16 = 61.',
    },
    {
      type: 'number',
      prompt: 'Cách nhân thủ công làm bao nhiêu tích chữ số với hai số có 12 chữ số?',
      answer: 144,
      unit: 'tích',
      hints: ['Mỗi chữ số của x gặp mỗi chữ số của y đúng một lần.'],
      solution: '12 · 12 = 144, vì thế chi phí tăng theo bình phương độ dài.',
    },
    {
      type: 'number',
      prompt: '9999 × 9999 có bao nhiêu chữ số?',
      answer: 8,
      unit: 'chữ số',
      hints: ['Có 7 tổng cột; kiểm tra xem sau cột cuối còn nhớ hay không.'],
      solution:
        '7 tổng cột để lại phần nhớ cuối cùng, trở thành chữ số thứ 8: 9999 × 9999 = 99980001.',
    },
  ],
  nextTeaser:
    'Chủ đề tiếp theo mở đầu bằng P, NP và phép quy dẫn: vì sao có những bài toán nhiều khả năng không có thuật toán nhanh.',
};
