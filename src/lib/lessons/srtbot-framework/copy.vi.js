/** @typedef {import('$lib/algo-engine/srtbot-framework.js').SrtbotFrame} SrtbotFrame */
/** @typedef {import('$lib/algo-engine/srtbot-framework.js').SrtbotProblem} SrtbotProblem */
/** @typedef {import('$lib/algo-engine/srtbot-framework.js').SrtbotOption} SrtbotOption */
/** @typedef {import('$lib/algo-engine/srtbot-framework.js').SrtbotStep} SrtbotStep */

/** @param {number} n */
const num = (n) => String(n).replace('-', '−');
/** Wraps a negative number in brackets inside a product or sum. @param {number} n */
const term = (n) => (n < 0 ? `(${num(n)})` : num(n));

/**
 * @param {SrtbotFrame} f
 * @param {SrtbotOption} o
 */
function optionText(f, o) {
  const i = f.cell;
  const t = (/** @type {number} */ k) => term(/** @type {number} */ (f.table[k]));
  const v = f.values;
  switch (o.kind) {
    case 'skip':
      return `bỏ qua ki ${i}: B(${i + 1}) = ${num(o.value)}`;
    case 'one':
      return `ném trúng ki ${i}: ${num(v[i])} + ${t(i + 1)} = ${num(o.value)}`;
    case 'pair':
      return `ném trúng ki ${i} và ${i + 1}: ${term(v[i])}·${term(v[i + 1])} + ${t(i + 2)} = ${num(o.value)}`;
    case 'fresh':
      return `bắt đầu đoạn mới: ${num(o.value)}`;
    case 'extend':
      return `nối dài đoạn kết thúc ở ${i - 1}: ${num(v[i])} + ${t(i - 1)} = ${num(o.value)}`;
  }
}

export const vi = {
  slug: 'srtbot-framework',
  topic: 'dynamic-programming',
  level: 'Cơ bản',
  title: 'Khung SRTBOT',
  intro:
    'SRTBOT là công thức sáu bước để thiết kế một lời giải quy hoạch động (dynamic programming): chọn các bài toán con (Subproblems), liên hệ (Relate) mỗi bài toán con với các bài toán con nhỏ hơn, kiểm tra có thứ tự tô-pô (Topological order), chốt các trường hợp cơ sở (Base cases), nói rõ bài toán gốc (Original problem) được đọc ra từ các bài toán con thế nào, và chặn trên thời gian (Time). Mọi lời giải QHĐ trong chương này đều là sáu câu trả lời đó. Ở đây bạn thiết kế hai lời giải, cho bài ném ki và bài đoạn con có tổng lớn nhất, rồi chạy thiết kế trên dãy số của chính bạn.',
  summary:
    'Đi qua sáu bước SRTBOT cho bài ném ki và bài đoạn con có tổng lớn nhất, rồi xem thiết kế lấp bảng trên dãy số của chính bạn.',
  instruction:
    'Chọn một bài toán rồi chạy từng bước: bảng hướng dẫn bên phải sáng lên ở mỗi bước SRTBOT khi lần chạy tới đó, và bảng được lấp theo thứ tự tô-pô. Bấm nút “Xem” của một bước để nhảy tới bước đó, hoặc gõ dãy số của bạn và xem phương án nào thắng ở mỗi ô.',
  problemLabel: 'Bài toán',
  problems: { bowling: 'Ném ki', maxsub: 'Đoạn con có tổng lớn nhất' },
  valuesLabel: 'Các giá trị',
  /** @param {SrtbotProblem} p */
  valuesHint: (p) =>
    p === 'bowling'
      ? 'Giá trị các ki từ trái sang phải, từ −9 đến 9.'
      : 'Giá trị các phần tử mảng từ trái sang phải, từ −9 đến 9.',
  exampleButton: 'Nạp ví dụ',
  /** @param {number} max @param {number} abs */
  valueErrors: (max, abs) => ({
    format: 'Hãy gõ các số nguyên cách nhau bởi dấu phẩy hoặc dấu cách, ví dụ 3, −1, 4.',
    count: `Hãy gõ từ 1 đến ${max} số.`,
    range: `Mỗi số phải nằm trong khoảng từ −${abs} đến ${abs}.`,
  }),
  /** @param {SrtbotProblem} p */
  problemText: (p) =>
    p === 'bowling'
      ? 'Các ki đứng thành một hàng, mỗi ki có một giá trị. Mỗi lần ném trúng một ki được điểm bằng giá trị của nó, hoặc trúng hai ki kề nhau được điểm bằng tích hai giá trị; bạn có thể bỏ qua ki, và mỗi ki bị ném trúng nhiều nhất một lần. Tìm tổng điểm lớn nhất.'
      : 'Tìm tổng lớn nhất của một đoạn khác rỗng gồm các giá trị liền nhau a[i..j].',
  guideTitle: 'Hướng dẫn SRTBOT',
  stepOrder: /** @type {SrtbotStep[]} */ ([
    'subproblems',
    'relate',
    'topo',
    'base',
    'original',
    'time',
  ]),
  stepLetters: { subproblems: 'S', relate: 'R', topo: 'T', base: 'B', original: 'O', time: 'T' },
  stepNames: {
    subproblems: 'Bài toán con',
    relate: 'Liên hệ',
    topo: 'Thứ tự tô-pô',
    base: 'Trường hợp cơ sở',
    original: 'Bài toán gốc',
    time: 'Thời gian',
  },
  /** @type {Record<SrtbotProblem, Record<SrtbotStep, string>>} */
  stepText: {
    bowling: {
      subproblems:
        'B(i) = điểm lớn nhất khi chỉ dùng các ki từ i đến n − 1, một hậu tố của hàng. Có n + 1 bài toán con, i = 0 … n.',
      relate:
        'Xét ki i, ki đầu tiên còn lại: bỏ qua nó, B(i + 1); ném trúng riêng nó, v[i] + B(i + 1); hoặc ném trúng nó cùng ki i + 1, v[i]·v[i + 1] + B(i + 2). B(i) là giá trị lớn nhất trong ba phương án.',
      topo: 'B(i) chỉ cần B(i + 1) và B(i + 2), nên ta tính i = n, n − 1, …, 0. Các phụ thuộc không bao giờ tạo thành chu trình.',
      base: 'B(n) = 0: không còn ki nào thì không có điểm.',
      original: 'B(0): điểm lớn nhất khi dùng cả hàng.',
      time: 'n + 1 bài toán con × nhiều nhất 3 phương án mỗi bài = thời gian O(n) và bộ nhớ O(n).',
    },
    maxsub: {
      subproblems:
        'x(i) = tổng lớn nhất của một đoạn kết thúc đúng ở chỉ số i. Có n bài toán con, i = 0 … n − 1.',
      relate:
        'Một đoạn kết thúc ở i hoặc chỉ gồm a[i], hoặc là a[i] nối vào đoạn tốt nhất kết thúc ở i − 1: x(i) = max(a[i], a[i] + x(i − 1)).',
      topo: 'x(i) chỉ cần x(i − 1), nên ta tính i = 0, 1, …, n − 1.',
      base: 'x(0) = a[0]: đoạn duy nhất kết thúc ở chỉ số 0.',
      original:
        'Đoạn tốt nhất kết thúc ở đâu đó, nên đáp án là x(i) lớn nhất, chứ không phải một bài toán con cố định.',
      time: 'n bài toán con × 2 phương án mỗi bài, cộng một lượt tìm giá trị lớn nhất = thời gian O(n).',
    },
  },
  showButton: 'Xem',
  /** @param {string} name */
  showAria: (name) => `Nhảy tới bước ${name}`,
  stepStatus: { current: 'đang làm', done: 'đã xong', todo: 'sắp tới' },
  stepMarkers: { current: '▶', done: '✓', todo: '' },
  tableTitle: 'Đầu vào và các bài toán con',
  /** @param {SrtbotProblem} p */
  rowHeaders: (p) => (p === 'bowling' ? ['v', 'B'] : ['a', 'x']),
  tableAria: 'Các giá trị đầu vào ở trên, giá trị các bài toán con ở dưới.',
  /**
   * @param {SrtbotProblem} p
   * @param {number} r
   * @param {number} c
   * @param {number|string|null} value
   * @param {string} state
   */
  cellLabel: (p, r, c, value, state) => {
    const name =
      r === 0 ? `${p === 'bowling' ? 'v' : 'a'}[${c}]` : `${p === 'bowling' ? 'B' : 'x'}(${c})`;
    const shown = value === null || value === '' ? 'trống' : num(Number(value));
    return `${name}: ${shown}${state ? `, ${state}` : ''}`;
  },
  cellStates: {
    write: 'vừa tính',
    read: 'đang đọc',
    answer: 'đáp án',
    base: 'trường hợp cơ sở',
  },
  legend: {
    write: 'Vừa tính',
    read: 'Được phương án thắng đọc',
    answer: 'Nơi đọc đáp án',
  },
  markers: { write: '●', read: '○', answer: '★' },
  optionsTitle: 'Các phương án được so sánh',
  optionsEmpty: 'Quan hệ sẽ so sánh các phương án khi bảng bắt đầu được lấp.',
  chosenMark: '✓ tốt nhất',
  /** @param {SrtbotOption['kind']} kind @param {number} i */
  optionName: (kind, i) =>
    ({
      skip: `Bỏ qua ki ${i}`,
      one: `Ném trúng riêng ki ${i}`,
      pair: `Ném trúng ki ${i} và ${i + 1}`,
      fresh: `Bắt đầu đoạn mới ở ${i}`,
      extend: `Nối dài đoạn kết thúc ở ${i - 1}`,
    })[kind],
  stats: {
    filled: 'Bài toán con đã giải',
    work: 'Phương án đã so sánh',
    answer: 'Đáp án',
  },
  answerPending: '…',
  /** @param {SrtbotFrame} f */
  describe(f) {
    const bowling = f.problem === 'bowling';
    const s = (/** @type {number} */ i) => `${bowling ? 'B' : 'x'}(${i})`;
    const size = f.table.length;
    switch (f.kind) {
      case 'start':
        return `Thiết kế lời giải QHĐ cho bài ${bowling ? 'ném ki' : 'đoạn con có tổng lớn nhất'} qua sáu bước SRTBOT, rồi chạy nó trên ${f.values.length} giá trị này.`;
      case 'subproblems':
        return bowling
          ? `S, bài toán con: B(i) là điểm lớn nhất khi chỉ dùng các ki từ i đến ${f.values.length - 1}. Bảng có ${size} ô trống, từ B(0) đến B(${size - 1}).`
          : `S, bài toán con: x(i) là tổng lớn nhất của một đoạn kết thúc ở chỉ số i. Bảng có ${size} ô trống, từ x(0) đến x(${size - 1}).`;
      case 'relation':
        return bowling
          ? 'R, liên hệ: ki đầu tiên còn lại bị bỏ qua, bị ném trúng riêng, hoặc bị ném trúng cùng ki bên cạnh. Mỗi lựa chọn để lại một hậu tố nhỏ hơn, nên B(i) = max(B(i + 1), v[i] + B(i + 1), v[i]·v[i + 1] + B(i + 2)).'
          : 'R, liên hệ: một đoạn kết thúc ở i hoặc bắt đầu mới ở i, hoặc nối dài đoạn tốt nhất kết thúc ở i − 1, nên x(i) = max(a[i], a[i] + x(i − 1)).';
      case 'order':
        return bowling
          ? `T, thứ tự tô-pô: mỗi B(i) chỉ cần các chỉ số lớn hơn, nên ta lấp từ B(${size - 1}) xuống B(0).`
          : `T, thứ tự tô-pô: mỗi x(i) chỉ cần x(i − 1), nên ta lấp từ x(0) lên x(${size - 1}).`;
      case 'base':
        return bowling
          ? `B, trường hợp cơ sở: B(${f.cell}) = 0. Không còn ki nào, nên không có điểm.`
          : `B, trường hợp cơ sở: x(0) = a[0] = ${num(f.values[0])}, đoạn duy nhất kết thúc ở chỉ số 0.`;
      case 'compute': {
        const best = f.options[f.chosen];
        return `${s(f.cell)} = giá trị lớn nhất trong: ${f.options.map((o) => optionText(f, o)).join('; ')}. Tốt nhất là ${num(best.value)}.`;
      }
      case 'original':
        return bowling
          ? `O, bài toán gốc: B(0) = ${num(f.answer ?? 0)}, điểm lớn nhất trên cả hàng.`
          : `O, bài toán gốc: đoạn tốt nhất có thể kết thúc ở bất kì đâu, nên ta lấy x(i) lớn nhất. Đó là x(${f.answerCells[0]}) = ${num(f.answer ?? 0)}.`;
      case 'done':
        return `T, thời gian: ${f.filled} bài toán con, tổng cộng ${f.work} phương án đã so sánh. Mỗi bài toán con tốn O(1), nên cả lần chạy là O(n).`;
    }
  },
  takeaways: [
    'S: chọn bài toán con là tiền tố, hậu tố hoặc xâu con của đầu vào. Với bài ném ki là các hậu tố B(i), với bài đoạn con có tổng lớn nhất là “kết thúc ở i”.',
    'R: liên hệ một bài toán con với các bài toán con nhỏ hơn bằng cách đoán một lựa chọn cục bộ, chẳng hạn chuyện gì xảy ra với ki đầu tiên, rồi thử mọi phương án.',
    'T và B: quan hệ không được vòng lại, nên luôn có một thứ tự để lấp bảng; các bài toán con nhỏ nhất là trường hợp cơ sở.',
    'O và T: bài toán gốc có thể là một bài toán con, B(0), hoặc một tổ hợp, x(i) lớn nhất. Thời gian bằng số bài toán con nhân với công việc cho mỗi bài toán con.',
    'Nạp ví dụ ném ki, bấm Xem ở bước R rồi chạy từng bước: xem phương án nào trong bỏ qua, ném một ki và ném một cặp thắng ở mỗi ô, và thử một hàng mà mọi ki đều âm.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Ném ki, thời gian', 'O(n)', 'n + 1 bài toán con, mỗi bài so sánh nhiều nhất 3 phương án.'],
    ['Ném ki, bộ nhớ', 'O(n)', 'Mỗi hậu tố một ô; mỗi lúc chỉ cần hai ô gần nhất.'],
    [
      'Đoạn con có tổng lớn nhất, thời gian',
      'O(n)',
      'n bài toán con, mỗi bài 2 phương án, cộng một lượt tìm x(i) lớn nhất.',
    ],
    [
      'Mọi thiết kế SRTBOT',
      'số bài toán con × công việc mỗi bài',
      'Đệ quy có nhớ hay lập bảng đều giải mỗi bài toán con một lần, mỗi lần làm phần việc của quan hệ.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'order',
      prompt: 'Sắp xếp sáu bước SRTBOT theo đúng thứ tự.',
      items: [
        'Trường hợp cơ sở',
        'Bài toán con',
        'Thời gian',
        'Liên hệ',
        'Bài toán gốc',
        'Thứ tự tô-pô',
      ],
      answer: [1, 3, 5, 0, 4, 2],
      hints: ['Các chữ cái đầu ghép thành S, R, T, B, O, T.'],
      solution:
        'Bài toán con, Liên hệ, Thứ tự tô-pô, Trường hợp cơ sở, Bài toán gốc, Thời gian. Trước hết ta nói cần tính gì, rồi các phần phụ thuộc nhau thế nào, rồi bắt đầu và kết thúc ở đâu, cuối cùng là mất bao lâu.',
    },
    {
      type: 'number',
      prompt: 'Điểm ném ki lớn nhất với các ki 3, 4, −1, 5 là bao nhiêu?',
      answer: 17,
      unit: 'điểm',
      hints: [
        'Chọn Ném ki, gõ 3, 4, −1, 5 rồi chạy đến bước cuối.',
        'So sánh việc ném trúng 3 và 4 thành một cặp với việc ném từng ki một.',
      ],
      solution:
        'B(4) = 0, B(3) = 5, B(2) = max(5, −1 + 5, −1·5 + 0) = 5, B(1) = max(5, 4 + 5, 4·(−1) + 5) = 9, B(0) = max(9, 3 + 9, 3·4 + 5) = 17: ném trúng cặp 3 và 4, bỏ qua −1, ném trúng 5.',
    },
    {
      type: 'number',
      prompt: 'Tổng lớn nhất của một đoạn trong 2, −5, 3, −1, 4, −6, 2 là bao nhiêu?',
      answer: 6,
      hints: [
        'Chọn Đoạn con có tổng lớn nhất, gõ các giá trị rồi chạy đến bước bài toán gốc.',
        'x(i) là đoạn tốt nhất kết thúc ở i; đáp án là x(i) lớn nhất.',
      ],
      solution: 'x = 2, −3, 3, 2, 6, 0, 2. Lớn nhất là x(4) = 6, ứng với đoạn 3, −1, 4.',
    },
    {
      type: 'choice',
      prompt: 'Bài ném ki dùng các bài toán con hậu tố B(i). Phải lấp bảng theo thứ tự nào?',
      options: [
        'i = 0, 1, …, n, vì B(0) là đáp án.',
        'i = n, n − 1, …, 0, vì B(i) cần B(i + 1) và B(i + 2).',
        'Thứ tự nào cũng được: các B(i) độc lập với nhau.',
        'Từ ki có giá trị lớn nhất đến ki có giá trị nhỏ nhất.',
      ],
      answer: 1,
      hints: ['Xem quan hệ của B(i) đọc những ô nào.'],
      solution:
        'Thứ tự tô-pô đặt mỗi bài toán con sau những bài nó cần. B(i) đọc B(i + 1) và B(i + 2), là các chỉ số lớn hơn, nên thứ tự là i giảm dần, bắt đầu từ trường hợp cơ sở B(n).',
    },
    {
      type: 'choice',
      prompt: 'Vì sao đáp án của bài đoạn con có tổng lớn nhất không đơn giản là x(n − 1)?',
      options: [
        'Vì x(n − 1) là trường hợp cơ sở.',
        'Vì đoạn tốt nhất không nhất thiết kết thúc ở chỉ số cuối.',
        'Vì x(n − 1) luôn âm.',
        'Đúng là như vậy: x(n − 1) luôn lớn nhất.',
      ],
      answer: 1,
      hints: ['Nạp ví dụ rồi so sánh x(6) với x(8).'],
      solution:
        'x(n − 1) chỉ xét các đoạn kết thúc ở giá trị cuối. Trong ví dụ x(8) = 5 nhưng x(6) = 6, nên bài toán gốc là giá trị lớn nhất trong mọi x(i).',
    },
    {
      type: 'text',
      prompt:
        'Thời gian chạy của thiết kế cho bài ném ki là bao nhiêu, viết theo kí hiệu O lớn của n ki?',
      accept: ['O(n)', 'Θ(n)', 'theta(n)'],
      hints: ['Nhân số bài toán con với công việc cho mỗi bài toán con.'],
      solution: 'n + 1 bài toán con, mỗi bài tốn O(1): O(n).',
    },
  ],
  nextTeaser:
    'Bài sau, QHĐ một chiều, áp dụng SRTBOT cho ba bài kinh điển: leo cầu thang, đổi tiền và ăn trộm nhà.',
};
