/** @typedef {import('$lib/algo-engine/best-worst-average-case.js').LinearFrame} LinearFrame */
/** @typedef {import('$lib/algo-engine/best-worst-average-case.js').CaseKind} CaseKind */

/** @param {number} x */
const num = (x) => x.toLocaleString('en-US', { maximumFractionDigits: 2, useGrouping: false });

export const vi = {
  slug: 'best-worst-average-case',
  topic: 'complexity',
  level: 'Cơ bản',
  title: 'Trường hợp tốt nhất, xấu nhất và trung bình',
  intro:
    'Cùng một thuật toán có thể chạy nhanh trên đầu vào này nhưng chậm trên một đầu vào khác cùng kích thước. Tìm kiếm tuần tự thấy phần tử đầu tiên chỉ sau một phép so sánh, nhưng phải so sánh cả n phần tử khi không có giá trị cần tìm, nên ta mô tả chi phí của nó theo từng trường hợp: tốt nhất, xấu nhất và trung bình (kì vọng).',
  summary:
    'Chạy tìm kiếm tuần tự với giá trị cần tìm ở trường hợp tốt nhất, xấu nhất và ngẫu nhiên, vẽ số phép so sánh, và xem trung bình của các lần chạy ngẫu nhiên tiến dần về (n + 1)/2.',
  instruction:
    'Sửa mảng và giá trị cần tìm, hoặc bấm Trường hợp tốt nhất, Trường hợp xấu nhất hay Phần tử ngẫu nhiên, rồi chạy từng bước quá trình quét. Bấm Phần tử ngẫu nhiên vài lần và so sánh trung bình các lần chạy với (n + 1)/2.',
  arrayLabel: 'Mảng (tối đa 12 số, 0–99)',
  targetLabel: 'Giá trị cần tìm x',
  search: 'Tìm',
  caseButtons: /** @type {Record<CaseKind, string>} */ ({
    best: 'Trường hợp tốt nhất',
    worst: 'Trường hợp xấu nhất',
    random: 'Phần tử ngẫu nhiên',
  }),
  clearRuns: 'Xoá các lần chạy',
  arrayError: 'Hãy nhập từ 1 đến 12 số nguyên từ 0 đến 99, cách nhau bởi dấu phẩy hoặc dấu cách.',
  targetError: 'Giá trị cần tìm phải là số nguyên từ 0 đến 99.',
  arrayAria: 'Mảng đang được tìm kiếm',
  pointer: 'i',
  /** @param {number} i @param {string} value @param {string} state */
  cellLabel: (i, value, state) => `A[${i}] = ${value}${state ? `, ${state}` : ''}`,
  states: { compare: 'đang so sánh', visited: 'không bằng', sorted: 'đã tìm thấy' },
  markers: { compare: '?', visited: '✗', sorted: '✓' },
  legend: { compare: 'Đang so sánh', visited: 'Đã xét, không bằng', sorted: 'Đã tìm thấy' },
  profileTitle: 'Số phép so sánh cho mọi kết quả có thể',
  /** @param {number} n */
  profileLabel: (n) =>
    `Biểu đồ cột: giá trị cần tìm gặp lần đầu ở chỉ số i tốn i + 1 phép so sánh, từ 1 ở chỉ số 0 đến ${n} ở chỉ số ${n - 1}; giá trị không có trong mảng tốn ${n}. Trung bình trên các vị trí tìm thấy: ${num((n + 1) / 2)}.`,
  absent: 'không có',
  axisIndex: 'chỉ số của x',
  /** @param {number} avg */
  averageLine: (avg) => `trung bình ${num(avg)}`,
  thisRun: 'kết quả lần chạy này',
  stats: {
    comparisons: 'Số phép so sánh (lần này)',
    best: 'Trường hợp tốt nhất',
    worst: 'Trường hợp xấu nhất',
    average: 'Trung bình, x có trong mảng',
  },
  runsTitle: 'Các lần chạy của em',
  runsEmpty: 'chưa có',
  runsHot: 'lần chạy mới nhất',
  /** @type {Record<CaseKind, string>} */
  runKinds: { best: 'tốt nhất', worst: 'xấu nhất', random: 'ngẫu nhiên' },
  /** @param {CaseKind | 'typed'} kind @param {number} x @param {number} c */
  runChip: (kind, x, c) => `${kind === 'typed' ? 'x' : vi.runKinds[kind]} ${x}: ${c}`,
  /** @param {number} count @param {number} avg */
  randomAverage: (count, avg) =>
    count === 0
      ? 'Chưa có lần chạy ngẫu nhiên nào.'
      : `Trung bình ${count} lần chạy ngẫu nhiên của em: ${num(avg)}`,
  num,
  practiceTitle: 'Tự kiểm tra',
  /** @param {LinearFrame} f */
  describe(f) {
    const n = f.values.length;
    switch (f.kind) {
      case 'start':
        return `Tìm x = ${f.target} trong ${n} phần tử, từ trái sang phải.`;
      case 'compare':
        return `So sánh A[${f.i}] = ${f.values[f.i]} với ${f.target}: ${f.match ? 'bằng nhau' : 'không bằng'}. Phép so sánh thứ ${f.comparisons}.`;
      case 'found':
        return `Tìm thấy ${f.target} ở chỉ số ${f.i}: trả về ${f.i}.`;
      case 'missing':
        return `${f.target} không có trong mảng: đã so sánh cả ${n} phần tử. Trả về −1.`;
      case 'done':
        return `Lần chạy này tốn ${f.comparisons} phép so sánh. Với ${n} phần tử, trường hợp tốt nhất là 1, xấu nhất là ${n}, trung bình là (n + 1)/2 = ${num((n + 1) / 2)}.`;
    }
  },
  takeaways: [
    'Chi phí phụ thuộc vào đầu vào, không chỉ vào kích thước của nó: tìm kiếm tuần tự trên n phần tử tốn từ 1 đến n phép so sánh.',
    'Trường hợp tốt nhất: giá trị cần tìm là phần tử đầu tiên, 1 phép so sánh, Θ(1). Trường hợp này ít khi hữu ích, vì em không thể trông chờ vào nó.',
    'Trường hợp xấu nhất: giá trị cần tìm ở cuối hoặc không có, n phép so sánh, Θ(n). Đây là một sự bảo đảm: không đầu vào nào kích thước n tốn hơn thế, nên người ta mặc định dùng nó.',
    'Trường hợp trung bình (kì vọng) cần một giả định về đầu vào. Nếu giá trị cần tìm có khả năng nằm ở mọi vị trí như nhau, chi phí kì vọng là (1 + 2 + … + n)/n = (n + 1)/2, vẫn là Θ(n).',
    'Thử bấm Phần tử ngẫu nhiên mười lần: trung bình các lần chạy dao động quanh (n + 1)/2 và ổn định dần khi số lần chạy tăng lên.',
  ],
  complexityHead: ['Trường hợp', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Tốt nhất', 'Θ(1)', 'x là A[0]: một phép so sánh.'],
    ['Xấu nhất', 'Θ(n)', 'x ở cuối hoặc không có: n phép so sánh.'],
    [
      'Trung bình, x có trong mảng',
      'Θ(n)',
      'Các vị trí có khả năng như nhau: trung bình (n + 1)/2 phép so sánh.',
    ],
    ['Bộ nhớ', 'O(1)', 'Chỉ có chỉ số i, dù ở trường hợp nào.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Tìm kiếm tuần tự trên n = 1000 phần tử. Giá trị cần tìm có trong mảng, với khả năng nằm ở mọi vị trí như nhau. Trung bình cần bao nhiêu phép so sánh?',
      answer: 500.5,
      unit: 'phép so sánh',
      hints: [
        'Vị trí i tốn i + 1 phép so sánh; mỗi vị trí có xác suất 1/n.',
        'Trung bình của 1, 2, …, n là (n + 1)/2.',
      ],
      solution: '(1 + 2 + … + 1000)/1000 = (1000 × 1001 / 2)/1000 = 1001/2 = 500.5 phép so sánh.',
    },
    {
      type: 'multi',
      prompt:
        'Tìm kiếm tuần tự trên 8 phần tử khác nhau. Những giá trị cần tìm nào rơi vào trường hợp xấu nhất, 8 phép so sánh?',
      options: [
        'Phần tử ở chỉ số 0',
        'Phần tử ở chỉ số 4',
        'Phần tử ở chỉ số 7',
        'Một giá trị không có trong mảng',
      ],
      answers: [2, 3],
      hints: ['Nhìn biểu đồ cột: những cột nào cao tới đỉnh?'],
      solution:
        'Chỉ số 7 tốn 7 + 1 = 8 phép so sánh, còn giá trị không có trong mảng thì phải so sánh với cả 8 phần tử. Chỉ số 0 tốn 1 và chỉ số 4 tốn 5.',
    },
    {
      type: 'number',
      prompt:
        'Tìm kiếm tuần tự trên n = 9 phần tử. Một nửa số lần, giá trị cần tìm không có trong mảng; còn lại, nó có khả năng nằm ở mọi vị trí như nhau. Số phép so sánh kì vọng là bao nhiêu?',
      answer: 7,
      unit: 'phép so sánh',
      hints: [
        'Không có trong mảng thì tốn n = 9. Có trong mảng thì trung bình tốn (n + 1)/2 = 5.',
        'Nhân mỗi trường hợp với xác suất của nó, 1/2.',
      ],
      solution: 'E = ½ × 9 + ½ × 5 = 4.5 + 2.5 = 7 phép so sánh.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao người ta thường nêu thời gian chạy của thuật toán theo trường hợp xấu nhất?',
      options: [
        'Nó chặn trên chi phí của mọi đầu vào cùng kích thước, nên là một sự bảo đảm',
        'Đó là đầu vào xuất hiện thường xuyên nhất',
        'Nó luôn bằng trường hợp trung bình',
      ],
      answer: 0,
      hints: ['Hãy nghĩ đến một hạn chót: con số nào em có thể hứa với người dùng?'],
      solution:
        'Không đầu vào nào kích thước n tốn hơn trường hợp xấu nhất, nên đó là lời hứa đúng với mọi đầu vào. Nó không nhất thiết hay gặp, và có thể khác xa trường hợp trung bình, như quicksort (sắp xếp nhanh): n² so với n log n.',
    },
  ],
  nextTeaser:
    'Thời gian chưa phải là tất cả. Bài sau, Độ phức tạp bộ nhớ, đếm phần bộ nhớ mà thuật toán cần thêm.',
};
