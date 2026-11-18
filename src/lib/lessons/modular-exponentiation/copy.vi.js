/** @typedef {import('$lib/algo-engine/modular-exponentiation.js').PowFrame} PowFrame */

export const vi = {
  slug: 'modular-exponentiation',
  topic: 'number-theory',
  level: 'Cơ bản',
  title: 'Số học đồng dư và luỹ thừa nhanh',
  intro:
    'Số học đồng dư chỉ giữ lại số dư khi chia cho m, và a ≡ b (mod m) nghĩa là hai số có cùng số dư. Vì tổng và tích chỉ phụ thuộc vào số dư, ta có thể lấy dư sau mỗi bước để các số luôn nhỏ. Kết hợp với bình phương liên tiếp, cách này tính aᵉ mod m trong khoảng log₂ e bước, kể cả khi bản thân aᵉ có hàng trăm triệu chữ số.',
  summary:
    'Tính a mũ e theo modulo m bằng cách đọc từng bit của e, bình phương dần và lấy dư sau mỗi phép nhân.',
  instruction:
    'Nhập a, e và m rồi chạy từng bước. Dải ô biểu diễn e ở hệ nhị phân, mỗi bit sáng lên khi được đọc, từ phải sang trái. Bit bằng 1 thì nhân bình phương hiện tại vào kết quả. So sánh ô “Số phép nhân” với “Nếu không bình phương”, rồi thử số mũ rất lớn.',
  fields: { a: 'Cơ số a', e: 'Số mũ e', m: 'Modulo m' },
  presetLabel: 'Ví dụ',
  presets: {
    classic: '3¹³ mod 7',
    onlyOneBit: 'Chỉ một bit 1',
    allOnes: 'Mọi bit đều là 1',
    fermat: 'Fermat: 7¹² mod 13',
    huge: '2 mũ 10⁹, mod 10⁹ + 7',
  },
  /** @param {number} max */
  aError: (max) => `Cơ số phải là số nguyên từ 0 đến ${max}.`,
  /** @param {number} max */
  eError: (max) => `Số mũ phải là số nguyên từ 0 đến ${max}.`,
  /** @param {number} max */
  mError: (max) => `Modulo phải là số nguyên từ 1 đến ${max}.`,
  bitsTitle: 'Các bit của số mũ, đọc từ phải sang',
  /** @param {number} e */
  bitsAria: (e) => `Số mũ ${e} ở hệ nhị phân.`,
  /** @param {number} i @param {number} bit @param {string} state */
  bitLabel: (i, bit, state) => `Bit có trọng số 2 mũ ${i}: ${bit}${state ? `, ${state}` : ''}`,
  bitStates: { current: 'đang đọc', used: 'đã nhân vào', skipped: 'bỏ qua', waiting: '' },
  bitMarkers: { current: '▲', used: '✓', skipped: '·', waiting: '' },
  bitPointer: 'đọc',
  legend: {
    current: '▲ Đang đọc',
    used: '✓ Bằng 1: nhân vào',
    skipped: '· Bằng 0: bỏ qua',
  },
  squaresTitle: 'Các bình phương đã tính',
  squaresHead: { k: 'k', power: 'Luỹ thừa', x: 'Giá trị mod m', bit: 'Bit', used: 'Trong kết quả' },
  /** @param {number} power */
  powerName: (power) => `a^${power}`,
  usedYes: '✓ có dùng',
  usedNo: '· bỏ qua',
  usedWaiting: '…',
  currentRow: '→',
  squaresEmpty: 'Chạy một bước để đọc bit đầu tiên.',
  chipsTitle: 'Kết quả là a mũ tổng các số này',
  chipsEmpty: 'chưa có',
  stats: {
    result: 'Kết quả hiện tại',
    x: 'Bình phương hiện tại x',
    multiplications: 'Số phép nhân',
    naive: 'Nếu không bình phương',
    productDigits: 'Số chữ số của tích lớn nhất',
    fullDigits: 'Số chữ số của aᵉ khi viết đầy đủ',
  },
  invariantTitle: 'Điều đang đúng lúc này',
  /** @param {PowFrame} f */
  invariant: (f) => `result ≡ a^${f.covered} (mod ${f.m})`,
  /** @param {PowFrame} f */
  describe(f) {
    const { a, e0, m, k, x, result, before, e } = f;
    switch (f.kind) {
      case 'start':
        return e0 === 0
          ? `e = 0 nên không có bit nào để dùng. Đáp số là 1, lấy dư cho ${m}: ${result}.`
          : `Tính ${a}^${e0} mod ${m}. Ở hệ nhị phân, e là ${f.bits.join('')}. Bắt đầu với result = ${result} và x = ${a} mod ${m} = ${x}.`;
      case 'bit':
        return e % 2 === 1
          ? `e = ${e} lẻ nên bit ${k} bằng 1: luỹ thừa a^${2 ** k} có mặt trong đáp số.`
          : `e = ${e} chẵn nên bit ${k} bằng 0: bỏ qua a^${2 ** k}.`;
      case 'multiply':
        return `result = ${before}·${x} mod ${m} = ${result}, nên giờ result ≡ a^${f.covered}.`;
      case 'square':
        return e === 0
          ? `x = ${before}·${before} mod ${m} = ${x}. Giờ e bằng 0 nên vòng lặp dừng. Bình phương cuối này thật ra không cần đến.`
          : `x = ${before}·${before} mod ${m} = ${x}, tức là a^${2 ** (k + 1)} mod ${m}. Chia đôi e còn ${e}.`;
      case 'done':
        return `${a}^${e0} mod ${m} = ${result}, chỉ dùng ${f.multiplications} phép nhân thay vì ${e0}.`;
    }
  },
  takeaways: [
    'a ≡ b (mod m) nghĩa là m chia hết a − b, tức a và b có cùng số dư. Có thể cộng và nhân các đồng dư thức: (x·y) mod m = ((x mod m)·(y mod m)) mod m.',
    'Vì vậy hãy lấy dư sau mỗi phép nhân. Khi đó mọi tích đều nhỏ hơn m², dù luỹ thừa thật lớn đến đâu.',
    'Mọi số mũ đều là tổng các luỹ thừa của 2: 13 = 8 + 4 + 1, nên a¹³ = a⁸·a⁴·a¹. Mỗi bình phương này có được bằng cách bình phương số trước nó.',
    'Chi phí là một phép bình phương cho mỗi bit cộng một phép nhân cho mỗi bit 1, tổng cộng không quá 2·log₂ e + 2, so với e phép nhân nếu nhân lặp lại.',
    'Thử ví dụ “2 mũ 10⁹, mod 10⁹ + 7”: so sánh số chữ số của luỹ thừa đầy đủ với số chữ số của tích lớn nhất, rồi đếm số phép nhân.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Nhân lặp lại',
      'O(e)',
      'Mỗi đơn vị của số mũ là một phép nhân, không thể làm nổi khi e gần 10⁹.',
    ],
    [
      'Luỹ thừa nhị phân',
      'O(log e)',
      'Mỗi vòng e giảm một nửa, nên vòng lặp chạy một lần cho mỗi bit: một phép bình phương, thêm một phép nhân nếu bit bằng 1.',
    ],
    ['Độ lớn các số', 'nhỏ hơn m²', 'Lấy dư sau mỗi phép nhân giữ cả hai thừa số nhỏ hơn m.'],
    ['Bộ nhớ', 'O(1)', 'Chỉ cần result, x và e. Trang này giữ lại các hàng để em đọc.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'multi',
      prompt: 'Những số nào đồng dư với 2 (mod 5)?',
      options: ['7', '12', '15', '−3', '22'],
      answers: [0, 1, 3, 4],
      hints: ['Kiểm tra xem 5 có chia hết số đó trừ 2 không.'],
      solution:
        '7 − 2 = 5, 12 − 2 = 10, −3 − 2 = −5 và 22 − 2 = 20 đều là bội của 5. Còn 15 − 2 = 13 thì không.',
    },
    {
      type: 'number',
      prompt: 'Không nhân hẳn ra, (123·456) mod 10 bằng bao nhiêu?',
      answer: 8,
      hints: ['Chỉ số dư là quan trọng: 123 mod 10 và 456 mod 10.'],
      solution: '123 ≡ 3 và 456 ≡ 6, nên tích ≡ 3·6 = 18 ≡ 8 (mod 10).',
    },
    {
      type: 'number',
      prompt: 'Chọn ví dụ 3¹³ mod 7 và chạy đến bước cuối. Kết quả là bao nhiêu?',
      answer: 3,
      hints: ['Các bit của 13 là 1101, nên 3¹³ = 3⁸·3⁴·3¹. Lấy dư từng số cho 7.'],
      solution: '3¹ ≡ 3, 3² ≡ 2, 3⁴ ≡ 4 và 3⁸ ≡ 2 (mod 7). Vậy 3¹³ ≡ 2·4·3 = 24 ≡ 3 (mod 7).',
    },
    {
      type: 'order',
      prompt: 'Với e = 13, xếp các luỹ thừa theo thứ tự mã nhân chúng vào kết quả.',
      items: ['a⁸', 'a¹', 'a⁴'],
      answer: [1, 2, 0],
      hints: ['Vòng lặp đọc các bit của e từ bit thấp nhất lên.'],
      solution: '13 = 1101 ở hệ nhị phân. Đọc từ phải sang: a¹ trước, bỏ qua a², rồi a⁴, rồi a⁸.',
    },
    {
      type: 'number',
      prompt:
        'Chọn ví dụ “2 mũ 10⁹, mod 10⁹ + 7” và chạy đến bước cuối. Mã thực hiện bao nhiêu phép nhân, tính cả các phép bình phương?',
      answer: 43,
      unit: 'phép nhân',
      hints: [
        'Đọc ô Số phép nhân ở bước cuối, hoặc tự đếm: mỗi bit một phép, cộng thêm mỗi bit 1 một phép.',
      ],
      solution:
        '10⁹ có 30 bit, trong đó 13 bit bằng 1. Vậy mã bình phương 30 lần và nhân 13 lần: tổng cộng 43.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, nghịch đảo modulo và định lí số dư Trung Hoa, dạy cách “chia” khi chỉ còn số dư và cách giải nhiều đồng dư thức cùng lúc.',
};
