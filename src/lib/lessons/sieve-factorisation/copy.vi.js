/** @typedef {import('$lib/algo-engine/sieve-factorisation.js').SieveFrame} SieveFrame */

export const vi = {
  slug: 'sieve-factorisation',
  topic: 'number-theory',
  level: 'Cơ bản',
  title: 'Sàng Eratosthenes và phân tích thừa số',
  intro:
    'Để tìm mọi số nguyên tố đến n, đừng kiểm tra từng số. Bắt đầu từ 2 và gạch bỏ bội của mỗi số nguyên tố gặp được: số nào còn sót lại là số nguyên tố. Nếu mỗi số còn nhớ số nguyên tố đầu tiên đã gạch nó, tức ước nguyên tố nhỏ nhất của nó, thì chính bảng ấy phân tích được mọi số đến n ra thừa số chỉ bằng vài phép chia.',
  summary:
    'Gạch bỏ bội của từng số nguyên tố để tìm mọi số nguyên tố đến n trong O(n log log n), rồi phân tích thừa số bằng bảng ước nguyên tố nhỏ nhất.',
  instruction:
    'Chọn n rồi chạy từng bước. Mỗi số nguyên tố gạch bỏ các bội của nó, và số nhỏ ở góc ô là số nguyên tố đã tới đó trước tiên. Đổi “Bắt đầu gạch từ” sang 2p và so sánh số lần gạch. Bấm chuột hoặc phím Enter vào ô bất kì để phân tích số đó ra thừa số.',
  fields: { n: 'Các số đến n', x: 'Phân tích x' },
  startLabel: 'Bắt đầu gạch từ',
  starts: { square: 'p·p', double: '2p' },
  presetLabel: 'Ví dụ',
  presets: {
    small: 'Đến 30',
    classic: 'Đến 60',
    hundred: 'Đến 100',
    large: 'Đến 200',
  },
  /** @param {number} max */
  nError: (max) => `n phải là số nguyên từ 2 đến ${max}.`,
  /** @param {number} n */
  xError: (n) => `x phải là số nguyên từ 2 đến ${n}.`,
  /** @param {number} v */
  pickError: (v) => `${v} không có ước nguyên tố nào. Hãy chọn một số từ 2 trở lên.`,
  gridTitle: 'Bảng số',
  /** @param {number} n */
  gridAria: (n) => `Các số từ 1 đến ${n}, mỗi hàng mười số.`,
  /** @param {number} v @param {string} state */
  cellLabel: (v, state) => `${v}${state ? `, ${state}` : ''}`,
  states: {
    unit: 'không phải số nguyên tố, cũng không phải hợp số',
    current: 'số nguyên tố p đang gạch',
    first: 'bị gạch lần đầu',
    again: 'bị gạch lại',
    crossed: 'đã bị gạch',
    prime: 'số nguyên tố',
    factor: 'phần còn lại của x',
    pending: 'chưa rõ',
  },
  /** @param {number} spf */
  spfMark: (spf) => `${spf}`,
  markers: { unit: '–', current: 'p', prime: '★', factor: '↓' },
  legend: {
    unit: '– 1: không nguyên tố, không hợp số',
    current: 'p Đang gạch',
    first: 'Vừa bị gạch',
    again: 'Bị gạch lại',
    crossed: 'Đã bị gạch; góc ô: ước nguyên tố nhỏ nhất',
    prime: '★ Số nguyên tố',
    factor: '↓ Phần còn lại của x',
  },
  stats: {
    p: 'p hiện tại',
    crossings: 'Số lần gạch',
    repeats: 'Số lần gạch lặp',
    primes: 'Số nguyên tố đã tìm',
    square: 'Tổng khi bắt đầu từ p·p',
    double: 'Tổng khi bắt đầu từ 2p',
  },
  primesTitle: 'Các số nguyên tố',
  primesEmpty: 'chưa có',
  factorsTitle: 'Các thừa số nguyên tố của x',
  factorsEmpty: 'chưa có',
  /** @param {SieveFrame} f */
  describe(f) {
    const { n, p, j, x, s, rest } = f;
    switch (f.kind) {
      case 'start':
        return `Viết các số đến ${n}. Mọi số từ 2 trở lên đều có thể là số nguyên tố, và tạm thời mỗi số là ước nhỏ nhất của chính nó.`;
      case 'skip':
        return `${p} đã bị gạch nên không phải số nguyên tố. Bội của nó cũng là bội của ${f.spf[p]}, nên ta bỏ qua.`;
      case 'prime':
        return `${p} chưa từng bị gạch nên là số nguyên tố. Gạch các bội của nó, bắt đầu từ ${s}${f.from === 'square' ? `, vì các bội nhỏ hơn đã có ước nhỏ hơn` : ''}.`;
      case 'cross':
        return f.first
          ? `Gạch ${j} = ${p}·${j / p}. Đây là lần đầu, nên ước nguyên tố nhỏ nhất của nó là ${p}.`
          : `${j} = ${p}·${j / p} đã bị ${f.spf[j]} gạch rồi. Lần gạch này là việc thừa.`;
      case 'stop':
        return `${p}·${p} = ${p * p} đã vượt quá ${n}, nên mọi hợp số đến ${n} đều đã bị một số nguyên tố nhỏ hơn gạch. Các số còn lại đều là số nguyên tố: có ${f.primes.length} số.`;
      case 'factorStart':
        return `Giờ phân tích x = ${x} bằng bảng: cứ chia mãi cho ước nguyên tố nhỏ nhất.`;
      case 'factor': {
        const was = rest * /** @type {number} */ (f.factors.at(-1));
        return `spf[${was}] = ${f.factors.at(-1)}, nên ghi lại nó và tiếp tục với ${was} / ${f.factors.at(-1)} = ${rest}.`;
      }
      case 'done':
        return `Xong: ${x} = ${f.factors.join(' · ')}, sau ${f.crossings} lần gạch.`;
    }
  },
  takeaways: [
    'Một số không bị số nguyên tố nhỏ hơn nào gạch thì là số nguyên tố, nên các số nguyên tố lần lượt lộ ra theo thứ tự.',
    'Có thể bắt đầu gạch từ p·p: mọi bội nhỏ hơn p·k đều có ước k < p, nên đã bị một số nguyên tố nhỏ hơn gạch rồi. Cũng vì thế mà p dừng được ngay khi p·p vượt quá n.',
    'Số nguyên tố đầu tiên gạch một số chính là ước nguyên tố nhỏ nhất của số đó, cho ta bảng spf.',
    'Có spf, phân tích thừa số chỉ tốn một phép chia cho mỗi thừa số nguyên tố. Mỗi phép chia làm x giảm ít nhất một nửa, nên tốn không quá log₂ x phép chia.',
    'Thử n = 200 với cả hai cách bắt đầu và so sánh tổng. Rồi bấm 180, sau đó 197: một số có nhiều thừa số, số kia không có ước nào ngoài chính nó.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Sàng',
      'O(n log log n)',
      'Mỗi số nguyên tố p gạch khoảng n/p số, và tổng các 1/p với p nguyên tố đến n tăng như log log n.',
    ],
    ['Phân tích bằng spf', 'O(log x)', 'Mỗi phép chia bỏ đi một thừa số ít nhất bằng 2.'],
    [
      'Chia thử cho từng số',
      'O(n√n)',
      'Kiểm tra mỗi số đến căn bậc hai của nó tốn nhiều công hơn sàng rất nhiều.',
    ],
    ['Bộ nhớ', 'O(n)', 'Mỗi số đến n một ô trong bảng.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chọn ví dụ “Đến 30” và chạy đến khi biết hết các số nguyên tố. Bắt đầu gạch từ p·p thì cần bao nhiêu lần gạch?',
      answer: 24,
      unit: 'lần gạch',
      hints: ['Đọc ô Số lần gạch. Làm tay: bội của 2 từ 4, của 3 từ 9, của 5 từ 25.'],
      solution: 'Bội của 2 từ 4: 14. Của 3 từ 9: 8. Của 5 từ 25: 2. Tổng là 14 + 8 + 2 = 24.',
    },
    {
      type: 'number',
      prompt: 'Có bao nhiêu số nguyên tố đến 200? Chạy sàng đến bước cuối để biết.',
      answer: 46,
      unit: 'số nguyên tố',
      hints: ['Chọn ví dụ “Đến 200” và đọc ô Số nguyên tố đã tìm ở bước cuối.'],
      solution: 'Sàng để lại 46 số không bị gạch, từ 2 đến 199.',
    },
    {
      type: 'number',
      prompt: 'Với n = 100, p lớn nhất từng gạch bỏ một số nào đó là bao nhiêu?',
      answer: 7,
      hints: ['p phải là số nguyên tố, và p·p không quá 100.'],
      solution: '7·7 = 49 ≤ 100, nhưng số nguyên tố kế tiếp 11 có 11·11 = 121 > 100.',
    },
    {
      type: 'number',
      prompt: 'Ước nguyên tố nhỏ nhất của 91 là bao nhiêu?',
      answer: 7,
      hints: [
        '91 là số lẻ, không chia hết cho 3 hay 5. Thử 7, hoặc bấm vào 91 trên bảng số đến 100.',
      ],
      solution: '91 = 7·13, và 2, 3, 5 đều không chia hết nó, nên spf[91] = 7.',
    },
    {
      type: 'order',
      prompt: 'Dùng bảng spf với x = 84, các thừa số được ghi lại theo thứ tự nào?',
      items: ['7', '3', '2', '2'],
      answer: [2, 3, 1, 0],
      hints: ['Mỗi lần chia cho ước nguyên tố nhỏ nhất: 84, rồi 42, rồi 21, rồi 7.'],
      solution: '84 → 2, 42 → 2, 21 → 3, 7 → 7. Vậy 84 = 2·2·3·7.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao với p = 7, việc gạch có thể bắt đầu từ 49 mà không phải từ 14?',
      options: [
        'Vì 14, 21, 28, 35 và 42 không phải bội của 7',
        'Vì mỗi số đó có một ước nhỏ hơn 7, nên đã bị một số nguyên tố nhỏ hơn gạch rồi',
        'Vì mọi số nhỏ hơn 49 đều là số nguyên tố',
      ],
      answer: 1,
      hints: ['Viết mỗi số dưới dạng 7·k. Có thể nói gì về k?'],
      solution:
        'Mỗi số là 7·k với k < 7, nên k có một ước nguyên tố nhỏ hơn 7, và số nguyên tố đó đã gạch số ấy rồi.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, kiểm tra số nguyên tố, cho biết một số rất lớn có nguyên tố không mà không cần sàng đến tận nó.',
};
