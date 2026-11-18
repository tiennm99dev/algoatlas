/** @typedef {import('$lib/algo-engine/quickselect.js').SelectFrame} SelectFrame */
/** @typedef {import('$lib/algo-engine/quickselect.js').PivotRule} PivotRule */

export const vi = {
  slug: 'quickselect',
  topic: 'divide-and-conquer',
  level: 'Nâng cao',
  title: 'Quickselect và trung vị của các trung vị',
  intro:
    'Thống kê thứ tự thứ k là giá trị sẽ nằm ở ô k − 1 nếu mảng được sắp xếp: k = 1 là giá trị nhỏ nhất, k = ⌈n/2⌉ là trung vị. Quickselect tìm nó mà không cần sắp xếp. Thuật toán phân hoạch quanh một chốt (pivot) như quicksort (sắp xếp nhanh), rồi chỉ giữ lại phía chứa ô k − 1, nên mỗi vòng lại bỏ đi một phần mảng.',
  summary:
    'Chạy từng bước quickselect khi mỗi lần phân hoạch bỏ đi một phía, và so sánh ba cách chọn chốt: giá trị cuối, ngẫu nhiên và trung vị của các trung vị, trên cùng một đầu vào.',
  instruction:
    'Nhập các giá trị và hạng k, chọn cách lấy chốt, rồi chạy từng bước. Các ô bị làm mờ là đã bị bỏ hẳn. Thử mảng đã sắp xếp với k = 1 theo từng cách chọn chốt rồi so sánh số vòng và số lần so sánh.',
  valuesLabel: 'Giá trị',
  kLabel: 'k (hạng)',
  ruleLabel: 'Chốt',
  rules: { last: 'Giá trị cuối', random: 'Ngẫu nhiên', mom: 'Trung vị của các trung vị' },
  presetLabel: 'Mảng ban đầu',
  presetPlaceholder: 'Chọn một mảng…',
  presets: {
    example: 'Ví dụ',
    sorted: 'Đã sắp xếp',
    reversed: 'Đảo ngược',
    duplicates: 'Có giá trị lặp',
  },
  shuffle: 'Mảng ngẫu nhiên',
  errors: {
    format:
      'Hãy nhập các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách. Mảng hợp lệ gần nhất đã được khôi phục.',
    range: 'Mỗi giá trị phải từ 0 đến 99. Mảng hợp lệ gần nhất đã được khôi phục.',
    count: 'Hãy dùng từ 2 đến 20 giá trị. Mảng hợp lệ gần nhất đã được khôi phục.',
  },
  /** @param {number} n */
  kError: (n) => `k phải là số nguyên từ 1 đến ${n}. Giá trị k hợp lệ gần nhất đã được khôi phục.`,
  newArrayNotice: 'Đã nạp mảng mới.',
  /** @param {string} rule */
  ruleNotice: (rule) => `Cách chọn chốt: ${rule}. Vết chạy bắt đầu lại.`,
  /** @param {number[]} values @param {number} lo @param {number} hi */
  arrayAria: (values, lo, hi) => `Mảng: ${values.join(', ')}. Đoạn còn xét [${lo}–${hi}].`,
  /** @param {number} at */
  groupLabel: (at) => `g${at + 1}`,
  legend: {
    pivot: 'Chốt',
    compare: 'Đang so sánh với chốt',
    swap: 'Vừa đổi chỗ',
    low: 'Phía thấp: ≤ chốt',
    median: 'Trung vị của nhóm',
    answer: 'Đáp án',
    faded: 'Mờ: đã bị bỏ',
  },
  markers: { pivot: 'C', compare: '?', swap: '⇄', low: '≤', median: 'm', answer: '✓' },
  targetPointer: 'k−1',
  stats: {
    comparisons: 'Số lần so sánh',
    swaps: 'Số lần đổi chỗ',
    rounds: 'Số vòng',
    live: 'Giá trị còn xét',
  },
  sizesTitle: 'Số giá trị còn xét ở đầu mỗi vòng',
  sizesEmpty: 'chưa có vòng nào',
  compareTitle: 'Số lần so sánh trên đầu vào này',
  /** @param {number} c */
  compareRow: (c) => `${c} lần so sánh`,
  /** @param {number} n */
  sortRow: (n) => `≈ ${Math.round(n * Math.log2(n))} (n·log₂ n)`,
  sortLabel: 'Sắp xếp trước, rồi lấy theo chỉ số',
  /** @param {number} pivotCost */
  pivotCost: (pivotCost) => `${pivotCost} lần trong số đó dùng để chọn chốt`,
  practiceTitle: 'Tự kiểm tra',
  /**
   * @param {SelectFrame} f
   * @param {PivotRule} rule
   */
  describe(f, rule) {
    const v = (/** @type {number} */ i) => f.values[i];
    const size = f.hi - f.lo + 1;
    switch (f.kind) {
      case 'start':
        return `Tìm phần tử nhỏ thứ ${f.k} trong ${f.values.length} giá trị. Khi mảng đã sắp xếp, nó sẽ nằm ở ô ${f.k - 1}. Mỗi vòng đưa một chốt về đúng vị trí đã sắp xếp của nó và bỏ đi phía không thể chứa ô ${f.k - 1}.`;
      case 'round':
        return `Vòng ${f.sizes.length}: còn ${size} giá trị đang xét trong [${f.lo}–${f.hi}].`;
      case 'groups':
        return `Chia [${f.lo}–${f.hi}] thành ${f.groups.length} nhóm, mỗi nhóm tối đa 5 giá trị, sắp xếp từng nhóm và lấy trung vị dưới của nhóm: ${f.groups.map((g) => v(g.median)).join(', ')}.`;
      case 'medians':
        return `Trung vị của ${f.groups.length} trung vị là ${v(f.pivot)}, tìm được nhờ một lần chọn đệ quy. Khoảng 3/10 số giá trị còn xét ≤ ${v(f.pivot)} và cũng chừng ấy giá trị ≥ nó, nên không vòng nào giữ lại quá khoảng 7/10 số giá trị.`;
      case 'pivot':
        if (rule === 'last') return `Chốt là giá trị cuối cùng còn xét, ${v(f.pivot)}.`;
        if (rule === 'random')
          return `Một ô chọn ngẫu nhiên cho chốt ${v(f.pivot)}. Chốt được chuyển xuống cuối đoạn.`;
        return `Trung vị của các trung vị ${v(f.pivot)} được chuyển xuống cuối đoạn để làm chốt.`;
      case 'scan':
        return f.low
          ? `${v(f.j)} ≤ chốt ${v(f.pivot)}: nó vào phía thấp.`
          : `${v(f.j)} > chốt ${v(f.pivot)}: nó ở lại phía cao.`;
      case 'swap':
        return `Đổi chỗ ô ${f.i} và ô ${f.j} để nới rộng phía thấp.`;
      case 'place':
        return `Chốt ${v(f.placed)} rơi vào ô ${f.placed}, đúng vị trí đã sắp xếp của nó: các giá trị còn xét bên trái nó đều ≤ ${v(f.placed)}, các giá trị bên phải đều lớn hơn.`;
      case 'discard': {
        const [from, to] = /** @type {[number, number]} */ (f.cut);
        const side = f.k - 1 < f.placed ? 'bên trái' : 'bên phải';
        return `Ô ${f.k - 1} nằm ${side} ô ${f.placed}, nên bỏ [${from}–${to}], gồm ${to - from + 1} giá trị kể cả chốt. Còn ${size} giá trị đang xét.`;
      }
      case 'found':
        return f.placed === f.answer
          ? `Chốt rơi đúng vào ô ${f.k - 1}: phần tử nhỏ thứ ${f.k} là ${v(f.answer)}.`
          : `Chỉ còn ô ${f.answer} đang xét, nên nó chứa đáp án: ${v(f.answer)}.`;
      case 'done': {
        const extra =
          rule === 'mom' ? ` (${f.pivotComparisons} lần trong số đó dùng để chọn chốt)` : '';
        return `Phần tử nhỏ thứ ${f.k} là ${v(f.answer)}, tìm được sau ${f.sizes.length} vòng với ${f.comparisons} lần so sánh${extra}. Mảng chưa bao giờ được sắp xếp toàn bộ.`;
      }
    }
  },
  takeaways: [
    'Thống kê thứ tự thứ k là giá trị ở ô k − 1 của mảng đã sắp xếp. Sắp xếp tìm được nó trong O(n log n), nhưng bài toán chọn chỉ cần O(n).',
    'Quickselect phân hoạch như quicksort rồi chỉ giữ lại một phía. Chốt ngẫu nhiên trung bình giữ lại một tỉ lệ cố định, nên khối lượng việc kì vọng là n + n/2 + n/4 + … = O(n).',
    'Một chốt cố định có thể lần nào cũng là lựa chọn tệ nhất: giá trị cuối của mảng đã sắp xếp chỉ bỏ được chính nó, nên tìm giá trị nhỏ nhất tốn (n − 1) + (n − 2) + … + 1 = Θ(n²).',
    'Trung vị của các trung vị chọn chốt từ các nhóm 5 phần tử: lấy trung vị của mỗi nhóm, rồi lấy trung vị của các trung vị ấy. Mỗi phía có ít nhất khoảng 3n/10 giá trị, nên T(n) ≤ T(n/5) + T(7n/10) + O(n) = O(n) ngay cả trong trường hợp xấu nhất. Hằng số của nó lớn hơn, và khi có nhiều giá trị bằng nhau thì cần phân hoạch ba phần để giữ được bảo đảm này.',
    'Chọn “Đã sắp xếp”, đặt k = 1 rồi đi đến bước cuối với từng cách chọn chốt: chốt là giá trị cuối cần 11 vòng và 66 lần so sánh, trung vị của các trung vị cần 3 vòng và 36 lần, một nửa trong số đó dùng để chọn chốt.',
  ],
  complexityHead: ['Cách làm', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Quickselect, chốt ngẫu nhiên',
      'O(n) kì vọng',
      'Trung bình mỗi vòng giữ lại một tỉ lệ cố định: một cấp số nhân.',
    ],
    ['Quickselect, chốt tệ nhất', 'O(n²)', 'Chốt nằm ở một đầu của đoạn chỉ bỏ được chính nó.'],
    [
      'Trung vị của các trung vị',
      'O(n) trong trường hợp xấu nhất',
      'T(n) ≤ T(n/5) + T(7n/10) + O(n), và 1/5 + 7/10 < 1.',
    ],
    [
      'Sắp xếp, rồi lấy theo chỉ số',
      'O(n log n)',
      'Nó xếp thứ tự mọi giá trị, nhiều hơn mức câu hỏi cần.',
    ],
    [
      'Bộ nhớ thêm',
      'O(1) hoặc O(log n)',
      'Vòng lặp phân hoạch tại chỗ; phép tìm trung vị đệ quy cần call stack (ngăn xếp lời gọi).',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với chốt là giá trị cuối, quickselect thực hiện bao nhiêu lần so sánh để tìm giá trị nhỏ nhất (k = 1) của mảng đã sắp xếp 1, 2, …, 10?',
      answer: 45,
      unit: 'lần so sánh',
      hints: [
        'Chốt luôn là giá trị lớn nhất còn xét, nên chỉ chốt bị bỏ.',
        'Các vòng lần lượt so sánh 9, 8, 7, … giá trị với chốt.',
      ],
      solution:
        'Mỗi vòng quét mọi giá trị còn xét trừ chốt, rồi chỉ bỏ đi chốt: 9 + 8 + … + 1 = 45 lần so sánh. Nhập 1, 2, …, 10 vào ô Giá trị với k = 1 và chốt là giá trị cuối để kiểm tra trên hình minh hoạ.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao quickselect ngẫu nhiên có thời gian kì vọng O(n), còn quicksort ngẫu nhiên là O(n log n)?',
      options: [
        'Quickselect dùng cách phân hoạch tốt hơn',
        'Quickselect chỉ đệ quy vào một phía, nên khối lượng việc giảm theo cấp số nhân',
        'Quickselect không bao giờ so sánh hai giá trị bằng nhau',
        'Quickselect chỉ sắp xếp k giá trị đầu',
      ],
      answer: 1,
      hints: [
        'Quicksort xử lí cả hai phía của mọi chốt.',
        'Cộng kích thước các đoạn mà quickselect còn phải quét.',
      ],
      solution:
        'Quicksort tốn n cho mỗi tầng, với khoảng log n tầng. Quickselect chỉ đi theo một phía, nên kích thước các đoạn phải quét kì vọng vào khoảng n, n/2, n/4, …, cộng lại được O(n).',
    },
    {
      type: 'number',
      prompt:
        '25 giá trị đôi một khác nhau được chia thành 5 nhóm, mỗi nhóm 5 giá trị. Có ít nhất bao nhiêu giá trị ≤ trung vị của các trung vị x?',
      answer: 9,
      unit: 'giá trị',
      hints: [
        'x là giá trị nhỏ thứ 3 trong 5 trung vị của nhóm, nên có 3 trung vị ≤ x (kể cả x).',
        'Mỗi nhóm như vậy có 3 giá trị ≤ trung vị của nhóm.',
      ],
      solution:
        'Có ba nhóm có trung vị ≤ x, và mỗi nhóm có 3 giá trị ≤ trung vị của nó, nên ít nhất 3 · 3 = 9 giá trị ≤ x. Lập luận tương tự, ít nhất 9 giá trị ≥ x, nên dù một vòng giữ lại phía nào thì phía đó cũng có tối đa 25 − 9 = 16 giá trị.',
    },
    {
      type: 'text',
      prompt:
        'Giải hệ thức của trung vị của các trung vị T(n) = T(n/5) + T(7n/10) + n. Viết T(n) theo kí hiệu O lớn.',
      accept: ['O(n)', 'Θ(n)', 'n', 'linear', 'tuyến tính'],
      hints: [
        'Hai lời gọi cộng lại nhận 1/5 + 7/10 = 9/10 đầu vào.',
        'Chi phí các tầng là n, 9n/10, 81n/100, …, một cấp số nhân.',
      ],
      solution:
        'Tầng i của cây đệ quy tốn tối đa (9/10)ⁱ n, nên tổng tối đa là n · 1 / (1 − 9/10) = 10n = O(n).',
    },
    {
      type: 'order',
      prompt: 'Sắp xếp các việc trong một vòng quickselect theo đúng thứ tự.',
      items: [
        'Bỏ đi phía không thể chứa ô k − 1',
        'Chọn chốt và chuyển nó xuống cuối đoạn',
        'So sánh ô p của chốt với k − 1',
        'Phân hoạch đoạn quanh chốt',
      ],
      answer: [1, 3, 2, 0],
      hints: [
        'Phải chọn chốt trước khi so sánh bất cứ giá trị nào với nó.',
        'Chỉ so sánh được p với k − 1 khi chốt đã nằm ở ô cuối cùng của nó.',
      ],
      solution:
        'Chọn chốt, phân hoạch để chốt rơi vào ô đã sắp xếp p của nó, so sánh p với k − 1 (dừng nếu bằng nhau), rồi bỏ đi phía còn lại.',
    },
  ],
  nextTeaser:
    'Bài sau chuyển sang phép nhân: thuật toán Karatsuba và Strassen bớt đi một tích đệ quy ở mỗi lần chia, và định lí thợ cho thấy điều đó đáng giá đến đâu.',
};
