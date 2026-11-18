/** @typedef {import('$lib/algo-engine/practice-dynamic-programming.js').DesignFrame} DesignFrame */
/** @typedef {import('$lib/algo-engine/practice-dynamic-programming.js').Problem} Problem */
/** @typedef {import('$lib/algo-engine/practice-dynamic-programming.js').Term} Term */

/** A value with a real minus sign, or a dash for an empty cell. @param {number|null} v */
const num = (v) => (v === null ? '–' : v < 0 ? `−${-v}` : String(v));

/** @type {Record<Term, string>} */
const TERM_LABELS = {
  a: 'a[i]',
  'prev-a': 'dp[i−1] + a[i]',
  'prev2-a': 'dp[i−2] + a[i]',
  prev: 'dp[i−1]',
  prev2: 'dp[i−2]',
  'prev-if': 'dp[i−1], nếu a[i] ≠ 0',
  'prev2-if': 'dp[i−2], nếu a[i−1]a[i] từ 10 đến 26',
};

export const vi = {
  slug: 'practice-dynamic-programming',
  topic: 'dynamic-programming',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán quy hoạch động',
  intro:
    'Giải một bài quy hoạch động (dynamic programming) mới quy về hai quyết định: dp[i] nghĩa là gì, và dp[i] suy ra từ các ô nhỏ hơn như thế nào. Ở đây em tự đưa ra cả hai quyết định cho ba bài toán. Thiết kế của em chạy trên các đầu vào nhỏ, mỗi ô được đối chiếu với giá trị vét cạn theo đúng ý nghĩa em đã khai báo, và đáp án được đối chiếu với đề bài. Nhờ vậy em thấy không chỉ là thiết kế sai, mà còn sai ở đâu và vì sao.',
  summary:
    'Khai báo dp[i] nghĩa là gì, dựng hệ thức truy hồi và thử trên các đầu vào nhỏ, với mỗi ô được đối chiếu với vét cạn.',
  instruction:
    'Chọn một bài toán, rồi chọn ý nghĩa của dp[i], các số hạng và cách kết hợp chúng, giá trị cơ sở và cách đọc đáp án. Danh sách Thử trên các mẫu cập nhật ngay lập tức. Bấm vào một mẫu và chạy từng bước: dấu ✕ đánh dấu ô đầu tiên phá vỡ lời hứa của trạng thái em chọn.',
  problemLabel: 'Bài toán',
  problems: {
    'max-subarray': 'Đoạn con có tổng lớn nhất',
    climb: 'Leo thang rẻ nhất',
    decode: 'Số cách giải mã',
  },
  /** @type {Record<Problem, string>} */
  goals: {
    'max-subarray': 'Tìm tổng lớn nhất của một đoạn khác rỗng gồm các giá trị liền nhau.',
    climb:
      'Bắt đầu từ mặt đất và mỗi lần leo 1 hoặc 2 bậc. Mỗi bậc em đứng lên tốn a[i], và phải dừng ở bậc n, sao cho tốn ít tiền nhất.',
    decode:
      'Mỗi chữ số ứng với một chữ cái, 1 → A cho đến 26 → Z. Đếm số cách đọc cả xâu thành các chữ cái. Một chữ cái không bao giờ bắt đầu bằng 0.',
  },
  valuesLabel: {
    'max-subarray': 'Các giá trị a',
    climb: 'Chi phí các bậc a',
    decode: 'Các chữ số',
  },
  randomInput: 'Đầu vào ngẫu nhiên',
  /** @param {number} min @param {number} max @param {number} abs */
  errors: (min, max, abs) => ({
    format: {
      'max-subarray': 'Hãy viết các số nguyên cách nhau bởi dấu phẩy.',
      climb: 'Hãy viết các số nguyên cách nhau bởi dấu phẩy.',
      decode: 'Chỉ viết chữ số, ví dụ 226.',
    },
    count: `Hãy gõ từ ${min} đến ${max} giá trị.`,
    range: {
      'max-subarray': `Mỗi giá trị phải từ −${abs} đến ${abs}.`,
      climb: `Mỗi chi phí phải từ 1 đến ${abs}.`,
      decode: 'Chỉ viết chữ số, ví dụ 226.',
    },
  }),
  designTitle: 'Thiết kế của em',
  stateLabel: 'dp[i] nghĩa là',
  /** @type {Record<string, string>} */
  states: {
    ending: 'tổng lớn nhất của một đoạn kết thúc đúng ở i',
    within: 'tổng lớn nhất của một đoạn nằm ở đâu đó trong i giá trị đầu tiên',
    'on-step': 'chi phí ít nhất của một cách leo dừng ở bậc i',
    every: 'chi phí khi đứng lên mọi bậc từ 1 đến i',
    prefix: 'số cách đọc i chữ số đầu tiên',
    single: 'số cách đọc i chữ số đầu tiên mà chữ số thứ i đứng riêng thành một chữ cái',
  },
  termsLabel: 'Các số hạng',
  terms: TERM_LABELS,
  combineLabel: 'Kết hợp bằng',
  combines: { max: 'max', min: 'min', sum: 'tổng' },
  baseLabel: 'dp[0]',
  answerLabel: 'Đáp án là',
  answers: { last: 'dp[n]', largest: 'dp[i] lớn nhất', smallest: 'dp[i] nhỏ nhất' },
  tableTitle: 'Bảng của em so với giá trị đúng',
  tableNote:
    'Hàng a là đầu vào. Hàng dp là những gì hệ thức truy hồi của em tính ra. Hàng đúng là giá trị mỗi ô phải có theo ý nghĩa em đã chọn, tìm bằng vét cạn. dp[0] là giá trị cơ sở và không được kiểm tra.',
  rows: { a: 'a', dp: 'dp', truth: 'đúng' },
  /** @param {number} n */
  tableAria: (n) => `Ba hàng cho ${n} ô: đầu vào, dp của em và các giá trị đúng.`,
  /** @param {string} row @param {number} i @param {string} v @param {string} state */
  cellLabel: (row, i, v, state) =>
    `${row}[${i}]: ${v === '' ? 'trống' : v}${state ? `, ${state}` : ''}`,
  cellStates: {
    current: 'vừa lấp',
    read: 'được đọc',
    right: 'khớp với giá trị đúng',
    wrong: 'khác giá trị đúng',
  },
  legend: {
    current: 'Vừa lấp',
    read: 'Được ô này đọc',
    right: 'Khớp với giá trị đúng',
    wrong: 'Khác giá trị đúng',
  },
  markers: { current: '●', read: '○', right: '✓', wrong: '✕' },
  optionsTitle: 'Mỗi số hạng đưa ra gì',
  optionsEmpty: 'Chạy tới một ô để xem các số hạng của nó.',
  offersNothing: 'không có gì',
  chosen: '✓ được chọn',
  stats: {
    wrong: 'Số ô sai',
    reads: 'Số ô đã đọc',
    got: 'Đáp án của em',
    expected: 'Đáp án đúng',
  },
  pending: '…',
  pass: '✓',
  fail: '✕',
  jumpWrong: 'Nhảy tới ô sai đầu tiên',
  noWrong: 'Mọi ô đều giữ đúng lời hứa của trạng thái em chọn trên đầu vào này.',
  samplesTitle: 'Thử trên các mẫu',
  /** @param {number} passed @param {number} total */
  samplesSummary: (passed, total) =>
    passed === total
      ? `Cả ${total} mẫu đều đạt: các ô giữ đúng lời hứa và đáp án đúng.`
      : `Đạt ${passed}/${total} mẫu.`,
  /** @param {number} k */
  sampleName: (k) => `Mẫu ${k}`,
  yourInput: 'Đầu vào của em',
  expectedLabel: 'cần ra',
  gotLabel: 'ra',
  /** @param {number} n */
  wrongCells: (n) => (n === 0 ? 'mọi ô đều đúng' : `${n} ô sai`),
  /**
   * @param {string} name @param {string} input @param {number} expected @param {number|null} got
   * @param {number} wrong @param {boolean} ok
   */
  sampleAria: (name, input, expected, got, wrong, ok) =>
    `${name}, ${input}: cần ra ${num(expected)}, ra ${num(got)}, ${wrong} ô sai, ${ok ? 'đạt' : 'chưa đạt'}. Nạp mẫu này.`,
  /** @param {Problem} p @param {number[]} a */
  inputText: (p, a) => (p === 'decode' ? a.join('') : a.map(num).join(', ')),
  num,
  /** @param {DesignFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `Chạy thiết kế của em trên ${f.a.length} giá trị.`;
      case 'base':
        return `Cơ sở: dp[0] = ${f.dp[0]}.`;
      case 'cell': {
        const parts = f.options.map(
          (o) => `${TERM_LABELS[o.term]} → ${o.value === null ? 'không có gì' : num(o.value)}`,
        );
        const head = parts.length ? `${parts.join('; ')}. ` : 'Chưa chọn số hạng nào. ';
        const cell = `dp[${f.i}] = ${num(f.value)}`;
        return f.right[f.i]
          ? `${head}${cell}. ✓ Khớp với ý nghĩa em đã chọn.`
          : `${head}${cell}. ✕ Theo ý nghĩa em chọn, ô này phải là ${num(f.truth[f.i])}.`;
      }
      case 'answer':
        return `Đáp án của em là ${num(f.got)}; đáp án đúng là ${num(f.expected)}.`;
      case 'done':
        if (f.answerOk && f.wrong === 0)
          return 'Đã giải được trên đầu vào này: mọi ô đều giữ đúng lời hứa và đáp án đúng.';
        if (!f.answerOk && f.wrong === 0)
          return 'Mọi ô đều giữ đúng lời hứa, nhưng đáp án sai. Hoặc trạng thái không trả lời đúng câu hỏi, hoặc đáp án được đọc sai chỗ.';
        if (f.answerOk)
          return `Đáp án đúng, nhưng có ${f.wrong} ô không mang ý nghĩa em đã khai báo. Hãy sửa ý nghĩa, kẻo đầu vào tiếp theo sẽ làm nó sai.`;
        return `Đáp án sai và có ${f.wrong} ô phá vỡ lời hứa. Hãy nhảy tới ô sai đầu tiên.`;
    }
  },
  takeaways: [
    'Định nghĩa trạng thái trước, bằng một câu chính xác về dp[i]. Nếu không nói được một ô nghĩa là gì, em không thể biết hệ thức truy hồi có đúng không.',
    'Tìm công thức chuyển bằng cách hỏi bước cuối cùng là gì. Một đoạn kết thúc ở i hoặc nối dài đoạn kết thúc ở i − 1, hoặc bắt đầu mới. Một cách leo tới từ 1 hoặc 2 bậc bên dưới. Một cách đọc kết thúc bằng một chữ cái gồm một hoặc hai chữ số.',
    'Trạng thái phải mang đủ thông tin. “Đoạn tốt nhất ở đâu đó trong i giá trị đầu tiên” không nối dài được, vì đoạn tốt nhất có thể đã kết thúc từ lâu. “Kết thúc đúng ở i” thì được, và khi đó đáp án là ô lớn nhất.',
    'Trường hợp cơ sở là một phần của thiết kế: trong bài số cách giải mã, dp[0] = 1 đếm cách duy nhất để đọc xâu rỗng. Đặt 0 ở đó thì mọi ô đều bằng 0.',
    'Thử các đầu vào nhỏ so với vét cạn, từng ô một. Thử bài leo thang với số hạng chỉ có dp[i−1] + a[i] và ý nghĩa “mọi bậc”: ô nào cũng đúng, nhưng đáp án vẫn sai.',
  ],
  complexityHead: ['Cách làm', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Mọi thiết kế ở đây', 'O(n)', 'n ô, mỗi ô đọc một số cố định các ô nhỏ hơn.'],
    [
      'Bộ nhớ',
      'O(1) đến O(n)',
      'Các hệ thức truy hồi này đọc nhiều nhất hai ô trước đó, nên hai biến có thể thay cả bảng nếu không ô nào được xem lại.',
    ],
    ['Vét cạn, đoạn con có tổng lớn nhất', 'O(n²)', 'Mọi đoạn, với một tổng cộng dồn.'],
    [
      'Vét cạn, leo thang và giải mã',
      'O(φⁿ)',
      'Chọn 1 hoặc 2 ở mỗi điểm sẽ rẽ nhánh như dãy Fibonacci, với φ ≈ 1,618.',
    ],
  ],
  practiceTitle: 'Bài tập luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Có bao nhiêu cách đọc 226 thành các chữ cái? Hãy dựng thiết kế đúng cho bài Số cách giải mã, hoặc đếm bằng tay.',
      answer: 3,
      unit: 'cách',
      hints: [
        'Dùng dp[0] = 1, các số hạng có điều kiện, và phép tổng.',
        'Các cách đọc cần tìm là BBF, VF và BZ.',
      ],
      solution: '2 2 6 → BBF, 22 6 → VF, 2 26 → BZ. Vậy dp = 1, 1, 2, 3 và đáp án là 3.',
    },
    {
      type: 'number',
      prompt:
        'Với dp[i] = tổng lớn nhất của một đoạn kết thúc đúng ở i, dp[7] bằng bao nhiêu với −2, 1, −3, 4, −1, 2, 1, −5, 4?',
      answer: 6,
      unit: 'tổng',
      hints: [
        'Nạp Mẫu 1 của bài Đoạn con có tổng lớn nhất với các số hạng a[i] và dp[i−1] + a[i], kết hợp bằng max.',
      ],
      solution:
        'Các ô là −2, 1, −2, 4, 3, 5, 6, 1, 5, nên dp[7] = 6: đoạn 4, −1, 2, 1 kết thúc ở vị trí 7.',
    },
    {
      type: 'number',
      prompt:
        'Cách leo rẻ nhất với chi phí các bậc 1, 100, 1, 1, 1, 100, 1, 1, 100, 1 là bao nhiêu?',
      answer: 6,
      unit: 'chi phí',
      hints: ['Nạp Mẫu 2 của bài Leo thang rẻ nhất với cả hai số hạng dp + a[i] và min.'],
      solution:
        'Đứng lên các bậc 1, 3, 5, 7, 8 và 10: sáu bậc, mỗi bậc tốn 1, nhảy qua mọi bậc 100. Vậy dp[10] = 6.',
    },
    {
      type: 'number',
      prompt: 'Có bao nhiêu cách đọc 100 thành các chữ cái?',
      answer: 0,
      unit: 'cách',
      hints: ['Chạy từng bước: chữ số 0 cuối cùng có thể gắn với cái gì?'],
      solution:
        '10 là J, nhưng chữ số 0 cuối không thể đứng riêng và 00 không phải chữ cái. Vậy dp = 1, 1, 1, 0 và đáp án là 0.',
    },
    {
      type: 'choice',
      prompt: 'Trong bài Số cách giải mã, chuyện gì xảy ra khi dp[0] = 0 thay vì 1?',
      options: [
        'Không có gì thay đổi, vì dp[0] không được kiểm tra.',
        'Mọi ô đều thành 0, vì mọi số đếm đều phát triển từ dp[0].',
        'Chỉ ô cuối cùng sai.',
        'Đáp án bị nhỏ đi 1.',
      ],
      answer: 1,
      hints: ['Đặt dp[0] bằng 0 với các số hạng đúng rồi quan sát hàng.'],
      solution:
        'Các tổng đếm được xây trên giá trị cơ sở. dp[0] = 1 ứng với một cách đọc rỗng duy nhất; với 0, không cách đọc nào bắt đầu được, nên mọi ô vẫn là 0.',
    },
    {
      type: 'multi',
      prompt:
        'Những lựa chọn nào giúp bài Đoạn con có tổng lớn nhất đạt mọi mẫu? Chọn tất cả những gì cần có.',
      options: [
        'dp[i] nghĩa là tổng lớn nhất của một đoạn kết thúc đúng ở i',
        'Các số hạng a[i] và dp[i−1] + a[i], kết hợp bằng max',
        'Số hạng dp[i−1], để một ô có thể bỏ qua một giá trị xấu',
        'Đáp án là dp[i] lớn nhất',
      ],
      answers: [0, 1, 3],
      hints: ['Một đoạn phải liền nhau, vậy một ô có được bỏ qua một giá trị không?'],
      solution:
        'Một đoạn kết thúc ở i hoặc nối dài đoạn kết thúc ở i − 1, hoặc bắt đầu ở i, và đoạn tốt nhất có thể kết thúc ở bất kì đâu, nên đáp án là ô lớn nhất. Chép dp[i−1] sẽ nối những đoạn không liền nhau.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao không cách chọn số hạng nào làm được ý nghĩa “tổng lớn nhất của một đoạn ở đâu đó trong i giá trị đầu tiên”?',
      options: [
        'Vì max là cách kết hợp sai.',
        'Vì ô đó không cho biết đoạn tốt nhất của nó kết thúc ở đâu, nên cộng thêm a[i] có thể nối những giá trị không liền nhau.',
        'Vì dp[0] phải bằng 1.',
        'Vì ý nghĩa đó không có giá trị vét cạn.',
      ],
      answer: 1,
      hints: ['Thử nó trên Mẫu 1 rồi đọc dấu ✕ đầu tiên.'],
      solution:
        'Bản thân ý nghĩa đó đúng và hữu ích, nhưng không mang đủ thông tin để nối dài. Nó cần thêm một giá trị thứ hai, đoạn tốt nhất kết thúc ở i. Giá trị thứ hai đó chính là trạng thái dùng được.',
    },
    {
      type: 'order',
      prompt: 'Sắp xếp các bước thiết kế một lời giải QHĐ theo đúng thứ tự.',
      items: [
        'Viết hệ thức truy hồi từ bước cuối cùng',
        'Đối chiếu các đầu vào nhỏ với vét cạn',
        'Nói trong một câu dp[i] nghĩa là gì',
        'Đặt các trường hợp cơ sở và nơi đọc đáp án',
      ],
      answer: [2, 0, 3, 1],
      hints: ['Em không thể viết hệ thức truy hồi cho một ô khi chưa quyết định ý nghĩa của nó.'],
      solution:
        'Trạng thái trước, rồi công thức chuyển, rồi trường hợp cơ sở và đáp án, rồi thử. Một lần thử thất bại thường đưa em quay lại trạng thái.',
    },
  ],
  nextTeaser:
    'Chương sau mở đầu bằng bài Quay lui và cây tìm kiếm: thử mọi lựa chọn và cắt tỉa những nhánh không thể dẫn tới lời giải.',
};
