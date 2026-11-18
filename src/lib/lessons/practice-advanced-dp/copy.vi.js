/** @typedef {import('$lib/algo-engine/practice-advanced-dp.js').RaceProblem} RaceProblem */

/** Whole numbers in programming notation, so a typed copy of the visual is a valid answer. @param {number} n */
const big = (n) => String(n);

export const vi = {
  slug: 'practice-advanced-dp',
  topic: 'advanced-dp',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán QHĐ nâng cao',
  intro:
    'Biết hệ thức truy hồi mới là một nửa của một bài quy hoạch động (dynamic programming) nâng cao; nửa còn lại là nhận ra cách nén trạng thái hay kĩ thuật tối ưu nào làm lời giải đủ nhanh. Trình chạy này giải ba bài toán hai lần, một lần theo cách ngây thơ và một lần đã tối ưu, trên cùng một đầu vào. Hai cách phải cho cùng đáp án, còn các bộ đếm công việc và thời gian cho thấy chúng cách xa nhau tới đâu.',
  summary:
    'Cho lời giải QHĐ ngây thơ và lời giải đã tối ưu chạy đua trên cùng một đầu vào: chú ếch nhảy trong cửa sổ, bước nhảy có chi phí bình phương, và bài toán người du lịch.',
  instruction:
    'Chọn một bài toán, đặt kích thước và tham số, rồi chọn số hiệu đầu vào. Các bộ đếm công việc cập nhật ngay; nhấn “Chạy và đo thời gian” để đo cả hai cách trên trình duyệt của bạn và điền bảng tăng trưởng. Sau đó dùng trình chạy để trả lời các câu hỏi bên dưới.',
  problemLabel: 'Bài toán',
  problems: {
    window: 'Chú ếch nhảy trong cửa sổ',
    squares: 'Bước nhảy có chi phí bình phương',
    tour: 'Hành trình ngắn nhất',
  },
  /** @type {Record<RaceProblem, string>} */
  statements: {
    window:
      'Các hòn đá 1..n có giá a[i]. Một chú ếch xuất phát ở hòn đá 1 và mỗi lần nhảy về phía trước từ 1 đến k hòn đá cho tới khi đáp xuống hòn đá n, trả tiền cho mọi hòn đá nó đáp xuống, tính cả hòn đầu và hòn cuối. Tìm tổng chi phí rẻ nhất. dp[i] = a[i] + min(dp[i − k..i − 1]).',
    squares:
      'Các hòn đá nằm ở các vị trí tăng dần x[1..n]. Một bước nhảy từ một hòn đá tới bất kì hòn đá nào phía sau tốn bình phương khoảng cách cộng một hằng số C. Tìm cách rẻ nhất để đi từ hòn đá đầu tới hòn đá cuối. dp[i] = min theo j < i của dp[j] + (x[i] − x[j])² + C.',
    tour: 'n thành phố nằm trên một lưới, khoảng cách tính bằng số bước trên lưới. Tìm hành trình khép kín ngắn nhất xuất phát từ thành phố 0, thăm mỗi thành phố đúng một lần rồi quay về. Cách đã tối ưu giữ một trạng thái cho mỗi tập thành phố đã thăm và thành phố đang đứng.',
  },
  /** @type {Record<RaceProblem, string>} */
  optimisation: {
    window: 'Hàng đợi đơn điệu: O(n) thay cho O(n·k)',
    squares: 'Kĩ thuật bao lồi: O(n) thay cho O(n²)',
    tour: 'QHĐ trên mặt nạ bit (Held-Karp): O(2ⁿ · n²) thay cho O(n!)',
  },
  sizeLabel: 'Kích thước n',
  /** @type {Record<RaceProblem, string>} */
  paramLabel: { window: 'Cửa sổ k', squares: 'Chi phí mỗi bước nhảy C', tour: '' },
  seedLabel: 'Số hiệu đầu vào',
  newInput: 'Đầu vào mới',
  run: 'Chạy và đo thời gian',
  /** @param {number} lo @param {number} hi */
  sizeError: (lo, hi) => `n phải là số nguyên từ ${lo} đến ${hi}.`,
  /** @param {RaceProblem} p @param {number} lo @param {number} hi */
  paramError: (p, lo, hi) =>
    p === 'window'
      ? `k phải là số nguyên từ ${lo} đến ${hi}, và nhỏ hơn n.`
      : `C phải là số nguyên từ ${lo} đến ${hi}.`,
  /** @param {number} max */
  seedError: (max) => `Số hiệu đầu vào phải là số nguyên từ 1 đến ${max}.`,
  inputTitle: 'Đầu vào',
  /** @param {RaceProblem} p @param {number} n */
  inputAria: (p, n) =>
    p === 'window'
      ? `Giá của những hòn đá đầu tiên trong ${n} hòn đá.`
      : p === 'squares'
        ? `Vị trí của những hòn đá đầu tiên trong ${n} hòn đá.`
        : `Vị trí của những thành phố đầu tiên trong ${n} thành phố.`,
  /** @param {number} shown @param {number} n */
  inputMore: (shown, n) => (shown < n ? `${shown} giá trị đầu tiên trong ${big(n)} giá trị.` : ''),
  /** @param {{x: number, y: number}} c */
  city: (c) => `(${c.x}, ${c.y})`,
  naiveTitle: 'Ngây thơ',
  fastTitle: 'Đã tối ưu',
  answer: 'Đáp án',
  work: 'Công việc',
  time: 'Thời gian',
  notTimed: 'Hãy nhấn “Chạy”',
  /** @param {number} ms */
  ms: (ms) => `${ms < 10 ? ms.toFixed(2) : ms.toFixed(1)} ms`,
  big,
  /** @param {number} naive @param {number} fast */
  ratio: (naive, fast) =>
    naive >= fast
      ? `Cách đã tối ưu làm ít việc hơn ${(naive / Math.max(1, fast)).toFixed(1)} lần.`
      : `Ở kích thước này, cách ngây thơ làm ít việc hơn: kĩ thuật tối ưu chỉ có lợi khi n lớn hơn.`,
  same: 'Hai cách cho cùng đáp án.',
  /** @param {number} a @param {number} b */
  differ: (a, b) => `Hai đáp án khác nhau: ${a} và ${b}.`,
  workNote: {
    window:
      'Công việc: số giá trị trong cửa sổ đã đọc, so với số lần đọc, đẩy vào và lấy ra ở hàng đợi hai đầu.',
    squares:
      'Công việc: số ứng viên j đã thử, so với số lần kiểm tra bao, dời con trỏ và đẩy đường vào.',
    tour: 'Công việc: số phép cộng trên mọi hành trình, so với số lần chuyển trạng thái của Held-Karp.',
  },
  barsAria: 'Các cột so sánh công việc của hai cách.',
  growthTitle: 'Tăng trưởng',
  growthHead: [
    'n',
    'Công việc ngây thơ',
    'Công việc đã tối ưu',
    'Thời gian ngây thơ',
    'Thời gian đã tối ưu',
  ],
  growthEmpty: 'Nhấn “Chạy và đo thời gian” để điền bảng này cho ba kích thước tới n.',
  codeTitle: { naive: 'Ngây thơ', fast: 'Đã tối ưu' },
  takeaways: [
    'Nén trạng thái: khi trạng thái phải nhớ một tập hợp, hãy lưu nó bằng các bit. Các trạng thái (mask, thành phố) của Held-Karp biến (n − 1)! hành trình thành 2ⁿ · n trạng thái.',
    'Lấy giá trị nhỏ nhất trên một cửa sổ trượt các trạng thái trước đó thì dùng hàng đợi đơn điệu: một giá trị mới hơn và nhỏ hơn làm các giá trị cũ vô dụng mãi mãi.',
    'Chi phí tách được thành dp[j] + b[j]·x[i] cộng các số hạng chỉ phụ thuộc i thì dùng kĩ thuật bao lồi: mỗi j là một đường thẳng, mỗi i là một truy vấn.',
    'Kĩ thuật tối ưu có chi phí phụ: với n rất nhỏ, vòng lặp ngây thơ có thể làm ít việc hơn. Hãy so sánh sự tăng trưởng, đừng chỉ nhìn một kích thước.',
    'Tăng n dần dần cho một bài toán và nhấn “Chạy” mỗi lần: xem công việc ngây thơ tăng theo n·k, n² hay n! trong khi công việc đã tối ưu gần như không đổi.',
  ],
  complexityHead: ['Bài toán', 'Ngây thơ → đã tối ưu', 'Vì sao'],
  complexity: [
    [
      'Chú ếch nhảy trong cửa sổ',
      'O(n·k) → O(n)',
      'Mỗi chỉ số vào và ra khỏi hàng đợi hai đầu một lần.',
    ],
    [
      'Bước nhảy có chi phí bình phương',
      'O(n²) → O(n)',
      'Hệ số góc giảm và truy vấn tăng, nên con trỏ trên bao chỉ dịch sang phải.',
    ],
    [
      'Hành trình ngắn nhất',
      'O(n! · n) → O(2ⁿ · n²)',
      'Chỉ tập thành phố đã thăm và thành phố đang đứng là quan trọng.',
    ],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chú ếch nhảy trong cửa sổ, n = 10, k = 3, số hiệu đầu vào 1. Tổng chi phí rẻ nhất là bao nhiêu?',
      answer: 61,
      hints: ['Đặt kích thước 10 và cửa sổ 3, giữ số hiệu đầu vào 1, rồi đọc ô “Đáp án”.'],
      solution:
        '61. Hai cách cho cùng đáp án. Các hòn đá 1, 4, 7 và 10 có giá 31 + 17 + 4 + 9 = 61; không có dãy bước nhảy nào khác, mỗi bước tối đa 3, rẻ hơn.',
    },
    {
      type: 'number',
      prompt:
        'Chú ếch nhảy trong cửa sổ, n = 1000, k = 50: cách ngây thơ đọc bao nhiêu giá trị trong cửa sổ?',
      answer: 48725,
      unit: 'giá trị',
      hints: [
        'Đọc ô “Công việc” của cách ngây thơ với n = 1000, k = 50.',
        'Hòn đá i đọc min(i − 1, k) giá trị.',
      ],
      solution:
        '1 + 2 + … + 49 = 1225 cho những hòn đá đầu, rồi 950 hòn đá × 50 = 47 500: tổng cộng 48 725.',
    },
    {
      type: 'number',
      prompt: 'Bước nhảy có chi phí bình phương, n = 2000: cách ngây thơ thử bao nhiêu ứng viên?',
      answer: 1999000,
      unit: 'ứng viên',
      hints: ['Mỗi hòn đá i thử mọi hòn đá j đứng trước nó.'],
      solution: '1 + 2 + … + 1999 = 2000 · 1999 / 2 = 1 999 000.',
    },
    {
      type: 'number',
      prompt: 'Hành trình ngắn nhất, n = 9: cách ngây thơ làm bao nhiêu phép cộng?',
      answer: 362880,
      unit: 'phép cộng',
      hints: ['Có 8! thứ tự các thành phố sau thành phố 0, và mỗi hành trình cộng 9 khoảng cách.'],
      solution:
        '8! · 9 = 40 320 · 9 = 362 880, so với vài nghìn lần chuyển trạng thái của Held-Karp.',
    },
    {
      type: 'choice',
      prompt: 'Kĩ thuật tối ưu nào làm bài bước nhảy có chi phí bình phương chạy nhanh?',
      options: ['Hàng đợi đơn điệu', 'Kĩ thuật bao lồi', 'QHĐ trên mặt nạ bit', 'Tối ưu Knuth'],
      answer: 1,
      hints: ['Khai triển (x[i] − x[j])² rồi nhóm các số hạng có chứa j.'],
      solution:
        'dp[j] + x[j]² − 2x[j]·x[i] là một đường thẳng theo x[i] với hệ số góc −2x[j]: đó là kĩ thuật bao lồi.',
    },
    {
      type: 'choice',
      prompt:
        'Chú ếch nhảy trong cửa sổ, n = 10, k = 3, số hiệu đầu vào 1. Cách nào làm ít việc hơn?',
      options: ['Cách ngây thơ', 'Hàng đợi đơn điệu', 'Hai cách làm lượng việc như nhau'],
      answer: 0,
      hints: ['So sánh hai bộ đếm “Công việc” khi n = 10.'],
      solution:
        'Cách ngây thơ đọc 24 giá trị; hàng đợi hai đầu làm 27 bước. Hàng đợi chỉ thắng khi n·k lớn lên, như bảng tăng trưởng cho thấy.',
    },
  ],
  nextTeaser:
    'Bài sau chuyển sang cây: tổ tiên chung gần nhất và nhảy nhị phân trả lời mỗi truy vấn LCA trong O(log n).',
};
