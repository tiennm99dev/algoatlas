/** @typedef {import('$lib/algo-engine/memoization-tabulation.js').FibFrame} FibFrame */
/** @typedef {import('$lib/algo-engine/memoization-tabulation.js').FibMode} FibMode */

/** @param {number} k */
const fib = (k) => `fib(${k})`;
/** @param {number} times */
const timesText = (times) => (times === 1 ? 'một lần' : `${times} lần`);

export const vi = {
  slug: 'memoization-tabulation',
  topic: 'dynamic-programming',
  level: 'Cơ bản',
  title: 'Đệ quy có nhớ và lập bảng',
  intro:
    'Đệ quy thuần cho dãy Fibonacci tính đi tính lại fib(2), vì các bài toán con gối nhau (overlapping subproblems): fib(5) và fib(4) đều cần fib(3). Quy hoạch động (dynamic programming) lưu đáp án của mỗi bài toán con đúng một lần rồi dùng lại. Đệ quy có nhớ (memoization) làm việc này từ trên xuống: giữ nguyên đệ quy và ghi nhớ kết quả; lập bảng (tabulation) làm từ dưới lên: lấp một bảng bắt đầu từ các trường hợp cơ sở, không cần đệ quy.',
  summary:
    'Xem cây lời gọi Fibonacci tăng theo hàm mũ thu gọn thành một chuỗi khi bật đệ quy có nhớ, rồi lấp cùng bảng đó từ dưới lên bằng cách lập bảng.',
  instruction:
    'Bắt đầu với đệ quy thuần và chạy đến bước cuối: đếm xem mỗi fib(k) được tính bao nhiêu lần ở hàng dưới. Sau đó chuyển sang đệ quy có nhớ để thấy các lời gọi lặp lại thành phép tra bảng một bước, rồi sang lập bảng, cách lấp bảng từ trái sang phải mà không có lời gọi nào.',
  modeLabel: 'Cách làm',
  modes: { plain: 'Đệ quy thuần', memo: 'Đệ quy có nhớ', table: 'Lập bảng' },
  nLabel: 'n',
  /** @param {number} max */
  nError: (max) => `n phải là số nguyên từ 0 đến ${max}.`,
  stats: {
    calls: 'Số lời gọi',
    additions: 'Số phép cộng',
    hits: 'Số lần tra bảng',
    result: 'Kết quả',
  },
  resultPending: '…',
  treeTitle: 'Cây lời gọi',
  treeEmpty: 'Chưa có lời gọi nào.',
  tableTreeText: 'Lập bảng không gọi hàm nào: một vòng lặp lấp bảng thay cho đệ quy.',
  /** @param {number} n @param {number} calls */
  treeAria: (n, calls) => `Cây lời gọi của ${fib(n)}: đến giờ có ${calls} lời gọi.`,
  /**
   * @param {number} k
   * @param {number|null} result
   * @param {'active'|'waiting'|'returned'|'cached'} status
   */
  nodeAria: (k, result, status) =>
    `${fib(k)}, ${
      {
        active: 'đang chạy',
        waiting: 'đang chờ một lời gọi nó tạo ra',
        returned: `đã tính xong, trả về ${result}`,
        cached: `tra trong bảng, trả về ${result}`,
      }[status]
    }`,
  tableTitle: 'Bảng',
  /** @param {FibMode} mode */
  rowStored: (mode) => ({ plain: '—', memo: 'm', table: 'dp' })[mode],
  rowComputed: '×',
  /** @param {FibMode} mode */
  tableNote: (mode) =>
    ({
      plain:
        'Đệ quy thuần không giữ bảng nào: hàng trên để trống. Hàng dưới đếm số lần mỗi fib(k) được tính.',
      memo: 'Hàng trên (m): memo[k], được ghi lần đầu fib(k) trả về. Hàng dưới (×): số lần fib(k) được tính.',
      table:
        'Hàng trên (dp): dp[k], lấp từ trái sang phải. Hàng dưới (×): số lần fib(k) được tính.',
    })[mode],
  tableAria: 'Bảng các giá trị Fibonacci đã lưu và số lần mỗi giá trị được tính.',
  /**
   * @param {FibMode} mode
   * @param {number} k
   * @param {number|null} value
   * @param {string} state
   */
  storedCell: (mode, k, value, state) =>
    `${mode === 'table' ? 'dp' : 'memo'}[${k}]: ${value === null ? 'trống' : value}${state ? `, ${state}` : ''}`,
  /** @param {number} k @param {number} times */
  computedCell: (k, times) =>
    `${fib(k)} được tính ${timesText(times)}${times > 1 ? ', làm lặp lại' : ''}`,
  cellStates: { write: 'vừa ghi', read: 'đang đọc', answer: 'đáp án' },
  legend: {
    active: 'Đang chạy',
    waiting: 'Đang chờ một lời gọi nó tạo ra',
    returned: 'Đã tính xong; ghi chú cho biết giá trị',
    cached: 'Tra trong bảng: không gọi thêm',
  },
  markers: { active: '▶', waiting: '…', returned: '✓', cached: '↺' },
  cellLegend: {
    write: 'Vừa ghi',
    read: 'Đang đọc',
    answer: 'Đáp án, fib(n)',
    repeat: 'Được tính nhiều hơn một lần',
  },
  cellMarkers: { write: '●', read: '○', answer: '★', repeat: '!' },
  /** @param {FibFrame} f */
  describe(f) {
    const memo = f.mode === 'memo';
    switch (f.kind) {
      case 'start':
        return {
          plain: `Sẵn sàng gọi ${fib(f.n)}. Đệ quy thuần không lưu gì, nên ta sẽ tính đi tính lại cùng những giá trị.`,
          memo: `Sẵn sàng gọi ${fib(f.n)} với bảng memo trống. Mỗi đáp án được lưu ngay lần đầu tính ra.`,
          table: `Sẵn sàng tính ${fib(f.n)} từ dưới lên: lấp dp[0], dp[1], … theo thứ tự, nên ô nào ta đọc cũng đã được lấp.`,
        }[f.mode];
      case 'call':
        return memo
          ? `Gọi ${fib(f.k)}. Trước hết kiểm tra bảng: memo[${f.k}] đã có giá trị chưa?`
          : `Gọi ${fib(f.k)}. ${f.k} ≤ 1 không?`;
      case 'hit':
        return `memo[${f.k}] đã bằng ${f.value}: ${fib(f.k)} trả về ngay, không gọi thêm. Đệ quy thuần sẽ phải tính lại cả cây con này.`;
      case 'base':
        if (f.mode === 'table')
          return f.n >= 1
            ? 'Trường hợp cơ sở: dp[0] = 0 và dp[1] = 1.'
            : 'Trường hợp cơ sở: dp[0] = 0. Vòng lặp không phải làm gì.';
        return memo
          ? `memo[${f.k}] còn trống và ${f.k} ≤ 1, một trường hợp cơ sở: lưu memo[${f.k}] = ${f.k} rồi trả về.`
          : `${f.k} ≤ 1, một trường hợp cơ sở: ${fib(f.k)} trả về ${f.k}.`;
      case 'return':
        return memo
          ? `${fib(f.k)} = ${fib(f.k - 1)} + ${fib(f.k - 2)} = ${f.a} + ${f.b} = ${f.value}. Lưu vào memo[${f.k}] để mọi lời gọi sau tra được.`
          : `${fib(f.k)} = ${fib(f.k - 1)} + ${fib(f.k - 2)} = ${f.a} + ${f.b} = ${f.value}. Không lưu gì, nên lần sau gọi ${fib(f.k)} lại phải tính từ đầu.`;
      case 'fill':
        return `dp[${f.k}] = dp[${f.k - 1}] + dp[${f.k - 2}] = ${f.a} + ${f.b} = ${f.value}. Cả hai ô đã được lấp ở các lần lặp trước.`;
      case 'done': {
        const head = `${fib(f.n)} = ${f.result}`;
        if (f.mode === 'table')
          return `${head} sau ${f.additions} phép cộng và không có lời gọi nào.`;
        if (memo)
          return `${head} sau ${f.callCount} lời gọi: mỗi giá trị chỉ được tính một lần, và ${f.hits} lời gọi được trả lời bằng cách tra bảng.`;
        const most = Math.max(...f.computed);
        const k = f.computed.indexOf(most);
        return `${head} sau ${f.callCount} lời gọi và ${f.additions} phép cộng. Riêng ${fib(k)} đã được tính ${timesText(most)}.`;
      }
    }
  },
  takeaways: [
    'Một bài toán có các bài toán con gối nhau khi cùng một trường hợp nhỏ hơn được cần đến nhiều lần: fib(n − 1) và fib(n − 2) đều cần fib(n − 3).',
    'Đệ quy thuần làm lặp lại phần việc đó, nên fib(n) tạo ra 2·fib(n + 1) − 1 lời gọi: thời gian tăng theo hàm mũ.',
    'Đệ quy có nhớ (từ trên xuống) giữ nguyên đệ quy và lưu mỗi đáp án ngay lần đầu; lời gọi lặp lại trở thành một lần tra bảng, nên fib(n) chỉ còn 2n − 1 lời gọi.',
    'Lập bảng (từ dưới lên) lấp bảng theo thứ tự sao cho ô nào được đọc cũng đã có sẵn: không đệ quy, không có ngăn xếp lời gọi (call stack), chỉ n − 1 phép cộng.',
    'Đặt n = 8 và so sánh “Số lời gọi” của ba cách: 67, 15 và 0, cùng cho đáp án 21.',
  ],
  complexityHead: ['Cách làm', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Đệ quy thuần, thời gian',
      'O(φⁿ) ≈ O(1.618ⁿ)',
      '2·fib(n + 1) − 1 lời gọi: mỗi bài toán con bị giải lại mỗi lần cần đến.',
    ],
    [
      'Đệ quy có nhớ, thời gian',
      'O(n)',
      'Mỗi bài toán con trong n + 1 bài toán con được tính một lần; n − 2 lời gọi còn lại là phép tra bảng O(1).',
    ],
    ['Đệ quy có nhớ, bộ nhớ', 'O(n)', 'Bảng memo có n + 1 ô và ngăn xếp lời gọi sâu tới n tầng.'],
    ['Lập bảng, thời gian', 'O(n)', 'Một lượt vòng lặp, mỗi ô một phép cộng.'],
    [
      'Lập bảng, bộ nhớ',
      'O(n), hoặc O(1)',
      'Bảng đầy đủ có n + 1 ô; với fib, chỉ cần giữ hai giá trị cuối là đủ.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Với đệ quy thuần, fib(6) tạo ra tất cả bao nhiêu lời gọi?',
      answer: 25,
      unit: 'lời gọi',
      hints: [
        'Chọn đệ quy thuần, đặt n = 6 rồi đọc “Số lời gọi” ở bước cuối.',
        'Gọi g(n) là số lời gọi khi tính fib(n): g(n) = 1 + g(n − 1) + g(n − 2), với g(0) = g(1) = 1.',
      ],
      solution:
        'g(2) = 3, g(3) = 5, g(4) = 9, g(5) = 15, g(6) = 1 + 15 + 9 = 25, đúng bằng 2·fib(7) − 1 = 2·13 − 1.',
    },
    {
      type: 'number',
      prompt: 'Với đệ quy thuần, khi tính fib(6) thì fib(2) được tính bao nhiêu lần?',
      answer: 5,
      unit: 'lần',
      hints: ['Chạy đệ quy thuần với n = 6 rồi đọc hàng dưới của bảng ở cột 2.'],
      solution:
        'fib(k) được tính fib(n − k + 1) lần, nên fib(2) được tính fib(5) = 5 lần. Đệ quy có nhớ chỉ tính nó một lần.',
    },
    {
      type: 'number',
      prompt: 'Với đệ quy có nhớ, fib(6) tạo ra bao nhiêu lời gọi, tính cả các lần tra bảng?',
      answer: 11,
      unit: 'lời gọi',
      hints: [
        'Chuyển sang đệ quy có nhớ với n = 6 rồi đọc “Số lời gọi”.',
        'Nhánh trái fib(6) → fib(5) → … → fib(0) có 7 lời gọi; mỗi fib(k) với k ≥ 3 còn tạo thêm một lời gọi là phép tra bảng.',
      ],
      solution:
        'Chuỗi fib(6), fib(5), …, fib(0) gồm 7 lời gọi, và fib(6), fib(5), fib(4), fib(3) mỗi hàm tạo thêm một lời gọi tìm thấy đáp án trong memo: 7 + 4 = 11 = 2·6 − 1.',
    },
    {
      type: 'number',
      prompt: 'Với cách lập bảng, fib(8) cần bao nhiêu phép cộng?',
      answer: 7,
      unit: 'phép cộng',
      hints: ['Vòng lặp chạy với i = 2 đến n, mỗi ô một phép cộng.'],
      solution: 'Mỗi ô từ dp[2] đến dp[8] cần một phép cộng: 8 − 1 = 7 phép cộng.',
    },
    {
      type: 'choice',
      prompt: 'Khác biệt chính giữa đệ quy có nhớ và lập bảng là gì?',
      options: [
        'Đệ quy có nhớ cho đáp án chính xác, còn lập bảng chỉ cho ước lượng.',
        'Đệ quy có nhớ gọi đệ quy từ bài toán gốc và ghi nhớ đáp án; lập bảng lấp bảng từ các trường hợp cơ sở trở lên theo một thứ tự cố định.',
        'Lập bảng lưu mọi đáp án, còn đệ quy có nhớ không lưu gì.',
        'Đệ quy có nhớ chỉ dùng được cho dãy Fibonacci.',
      ],
      answer: 1,
      hints: ['So sánh cây lời gọi của hai cách: một cách có lời gọi, cách kia không có.'],
      solution:
        'Cả hai đều lưu đáp án của mỗi bài toán con đúng một lần và cho cùng kết quả trong thời gian O(n). Đệ quy có nhớ đi từ trên xuống: bắt đầu ở fib(n) rồi gọi đệ quy, nên chỉ giải những bài toán con nó chạm tới. Lập bảng đi từ dưới lên: một vòng lặp lấp bảng theo thứ tự sao cho ô nào cần đến cũng đã xong.',
    },
  ],
  nextTeaser:
    'Bài sau, Khung SRTBOT, gom mọi lời giải quy hoạch động vào sáu bước: bài toán con, liên hệ, thứ tự, trường hợp cơ sở, bài toán gốc và thời gian.',
};
