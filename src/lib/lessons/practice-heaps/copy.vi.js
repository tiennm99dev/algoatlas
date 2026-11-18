/** @typedef {import('$lib/algo-engine/practice-heaps.js').MedianFrame} MedianFrame */
/** @typedef {import('$lib/algo-engine/practice-heaps.js').ClosestFrame} ClosestFrame */
/** @typedef {import('$lib/algo-engine/practice-heaps.js').Point} Point */

/** @param {number} i */
const pointName = (i) => 'ABCDEFGHIJKL'[i] ?? String(i + 1);
/** @param {Point} p */
const coords = (p) => `(${p.x}, ${p.y})`;
/** A coordinate squared, with a negative one in brackets: (−2)². @param {number} v */
const sq = (v) => (v < 0 ? `(${v})²` : `${v}²`);

export const vi = {
  slug: 'practice-heaps',
  topic: 'heaps',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán về heap',
  intro:
    'Hai bài toán heap kinh điển. Trung vị động chia dòng dữ liệu thành hai nửa: một heap lớn nhất chứa nửa nhỏ hơn và một heap nhỏ nhất chứa nửa lớn hơn, với kích thước bằng nhau hoặc nửa dưới hơn một phần tử, nên trung vị nằm ngay ở đỉnh của chúng. Bài k điểm gần nhất giữ một heap lớn nhất cỡ k, có gốc là điểm xa nhất vẫn còn trong đáp án.',
  summary:
    'Giữ trung vị động của một dòng dữ liệu bằng hai heap cân bằng và tìm k điểm gần gốc toạ độ nhất bằng heap lớn nhất cỡ k, rồi dùng công cụ để trả lời câu hỏi.',
  instruction:
    'Chọn một bài toán. Với Trung vị động, nhập một dòng dữ liệu rồi chạy từng bước: xem mỗi giá trị vào một nửa và hai nửa cân bằng lại. Với K điểm gần nhất, nhập các điểm dạng (x, y) và k, rồi xem các điểm xa bị loại. Dùng công cụ này để trả lời các câu hỏi bên dưới.',
  problemLabel: 'Bài toán',
  problems: { median: 'Trung vị động', closest: 'K điểm gần nhất' },
  streamLabel: 'Dòng dữ liệu',
  pointsLabel: 'Các điểm (x, y)',
  kLabel: 'k',
  newInputButton: 'Đầu vào mới',
  newInputNotice: 'Đã nạp đầu vào mới.',
  streamErrors: {
    format: 'Hãy nhập các số nguyên cách nhau bằng dấu phẩy hoặc dấu cách.',
    range: 'Mọi giá trị phải từ 0 đến 99.',
    count: 'Dòng dữ liệu chứa tối đa 15 giá trị.',
  },
  pointErrors: {
    format: 'Viết mỗi điểm dạng (x, y), ví dụ (1, 2) (−3, 0).',
    range: 'Toạ độ phải từ −5 đến 5.',
    count: 'Dùng tối đa 12 điểm.',
    duplicate: 'Mỗi điểm chỉ được xuất hiện một lần.',
  },
  kError: 'k phải là số nguyên từ 1 đến 6.',
  streamTitle: 'Dòng dữ liệu',
  streamAria: (/** @type {number[]} */ values) => `Dòng dữ liệu: ${values.join(', ') || 'rỗng'}.`,
  lowTitle: 'Nửa dưới: heap lớn nhất',
  highTitle: 'Nửa trên: heap nhỏ nhất',
  /** @param {'low'|'high'} side @param {number[]} values */
  halfAria: (side, values) =>
    `${side === 'low' ? 'Nửa dưới, heap lớn nhất' : 'Nửa trên, heap nhỏ nhất'}: ${values.length === 0 ? 'rỗng' : values.join(', ')}.`,
  /** @param {'low'|'high'} side */
  halfEmpty: (side) => (side === 'low' ? 'Nửa dưới đang rỗng.' : 'Nửa trên đang rỗng.'),
  /** @param {number} i @param {string} label @param {string} state */
  slotLabel: (i, label, state) => `Ô ${i}: ${label}${state ? `, ${state}` : ''}`,
  mediansTitle: 'Các trung vị tới giờ',
  mediansEmpty: 'chưa có',
  balanceText: (/** @type {number} */ low, /** @type {number} */ high) =>
    `Kích thước: nửa dưới ${low}, nửa trên ${high}`,
  planeTitle: 'Các điểm quanh gốc toạ độ O',
  /** @param {Point[]} points */
  planeAria: (points) =>
    `Các điểm: ${points.map((p, i) => `${pointName(i)} ${coords(p)}`).join(', ') || 'không có'}.`,
  originLabel: 'O',
  /** @param {number} i @param {Point} p @param {string} state */
  pointLabel: (i, p, state) =>
    `Điểm ${pointName(i)} tại ${coords(p)}, khoảng cách² ${p.x * p.x + p.y * p.y}${state ? `, ${state}` : ''}`,
  heapTitle: 'Heap lớn nhất theo khoảng cách²',
  /** @param {string[]} labels */
  heapAria: (labels) =>
    labels.length === 0 ? 'Heap đang rỗng.' : `Heap lớn nhất dạng mảng: ${labels.join(', ')}.`,
  pointName,
  states: {
    active: 'đang xử lí',
    frontier: 'tạm giữ',
    visited: 'bị loại',
    sorted: 'thuộc đáp án',
    compare: 'gốc cần vượt qua',
  },
  legendMedian: {
    active: 'Giá trị vừa thêm hoặc vừa chuyển',
    compare: 'Đỉnh của một nửa: trung vị lấy từ đây',
    visited: 'Đã đọc',
  },
  legendClosest: {
    active: 'Điểm đang đọc',
    frontier: 'Đang giữ trong heap',
    compare: 'Gốc của heap: điểm xa nhất đang giữ',
    visited: 'Bị loại',
    sorted: 'Thuộc đáp án cuối cùng',
  },
  markers: { active: '▶', frontier: 'k', visited: '✗', sorted: '★', compare: 'đỉnh' },
  readMarker: '✓',
  stats: {
    median: 'Trung vị',
    moves: 'Số lần chuyển giữa hai nửa',
    heapOps: 'Số lần push và pop',
    comparisons: 'Số phép so sánh',
    read: 'Đã đọc',
  },
  /** @param {MedianFrame} f */
  describeMedian(f) {
    const lo = f.low[0];
    const hi = f.high[0];
    switch (f.kind) {
      case 'start':
        return 'low là heap lớn nhất chứa nửa nhỏ hơn, high là heap nhỏ nhất chứa nửa lớn hơn. low được phép nhiều hơn high một giá trị.';
      case 'read':
        return `Đọc ${f.value}.`;
      case 'push-low':
        return f.low.length === 1
          ? `low đang rỗng, nên ${f.value} vào low.`
          : `${f.value} ≤ đỉnh của low là ${lo}, nên nó thuộc nửa nhỏ hơn: push vào low.`;
      case 'push-high':
        return `${f.value} > đỉnh của low là ${lo}, nên nó thuộc nửa lớn hơn: push vào high.`;
      case 'move-up':
        return `low nhiều hơn high hai giá trị. Pop đỉnh ${f.value} của low và push vào high.`;
      case 'move-down':
        return `high nhiều hơn low. Pop đỉnh ${f.value} của high và push vào low.`;
      case 'median':
        return f.low.length > f.high.length
          ? `Số lượng lẻ: trung vị là đỉnh của low, ${f.median}.`
          : `Số lượng chẵn: trung vị là (${lo} + ${hi}) / 2 = ${f.median}.`;
      case 'done':
        return f.medians.length === 0
          ? 'Dòng dữ liệu rỗng.'
          : `Xong: ${f.medians.length} trung vị, ${f.moves} lần chuyển giữa hai nửa.`;
    }
  },
  /** @param {ClosestFrame} f @param {Point[]} points @param {number} k */
  describeClosest(f, points, k) {
    const p = f.index >= 0 ? points[f.index] : null;
    const name = pointName(f.index);
    const d = p ? p.x * p.x + p.y * p.y : 0;
    const top = f.heap[0];
    switch (f.kind) {
      case 'start':
        return `Giữ ${k} điểm gần nhất trong một heap lớn nhất theo khoảng cách², để khỏi phải khai căn. Gốc của nó là điểm xa nhất đang giữ.`;
      case 'read':
        return p
          ? `Đọc ${name} ${coords(p)}: khoảng cách² = ${sq(p.x)} + ${sq(p.y)} = ${d}.`
          : `Đọc ${name}.`;
      case 'push':
        return `Heap đang có ít hơn ${k} điểm, nên push ${name}.`;
      case 'replace':
        return `${d} < ${points[f.evicted].x ** 2 + points[f.evicted].y ** 2} của ${pointName(f.evicted)}, điểm xa nhất đang giữ: bỏ ${pointName(f.evicted)} và đặt ${name} vào chỗ đó.`;
      case 'skip':
        return `${d} ≥ ${top ? `${top.d2} của ${pointName(top.index)}` : 'gốc'}: ${name} không gần hơn điểm xa nhất đang giữ. Loại.`;
      case 'done':
        return f.heap.length === 0
          ? 'Không có điểm nào.'
          : `${f.heap.length} điểm gần nhất: ${f.heap
              .slice()
              .sort((a, b) => a.d2 - b.d2 || a.index - b.index)
              .map((e) => pointName(e.index))
              .join(', ')}.`;
    }
  },
  takeaways: [
    'Trung vị động: một heap lớn nhất giữ nửa nhỏ hơn và một heap nhỏ nhất giữ nửa lớn hơn. Mỗi giá trị tốn một lần push và nhiều nhất một lần chuyển, O(log n), và trung vị được đọc từ các đỉnh trong O(1).',
    'Giữ hai nửa cân bằng (low có bằng hoặc nhiều hơn high một phần tử) và đúng thứ tự (mọi giá trị trong low ≤ mọi giá trị trong high); khi đó trung vị là đỉnh của low hoặc trung bình cộng của hai đỉnh.',
    'Với k điểm gần nhất, giữ một heap lớn nhất cỡ k theo khoảng cách: gốc của nó là điểm cần vượt qua. Cách này tốn thời gian O(n log k) và bộ nhớ O(k).',
    'So sánh bình phương khoảng cách, x² + y²: chúng xếp thứ tự các điểm giống hệt khoảng cách thật mà không cần khai căn.',
    'Thử dòng dữ liệu 1, 2, 3, 4, 5: cứ hai giá trị lại có một giá trị phải chuyển từ high sang low. Một dòng giảm dần làm các giá trị chuyển theo chiều ngược lại.',
  ],
  complexityHead: ['Việc', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thêm một giá trị vào trung vị động',
      'O(log n)',
      'Một lần push, cùng nhiều nhất một lần pop và push.',
    ],
    ['Đọc trung vị', 'O(1)', 'Đó là đỉnh của low, hoặc trung bình cộng của hai đỉnh.'],
    [
      'Trung vị động bằng cách sắp xếp lại mỗi lần',
      'O(n log n)',
      'Cho mỗi giá trị: sắp xếp lại phần đầu dãy là làm lại việc đã làm.',
    ],
    [
      'K điểm gần nhất trong n điểm',
      'O(n log k)',
      'Một phép so sánh cho mỗi điểm và một lần vun O(log k) khi nó được vào.',
    ],
    ['Bộ nhớ, trung vị động', 'O(n)', 'Hai nửa cộng lại giữ mọi giá trị.'],
    ['Bộ nhớ, k điểm gần nhất', 'O(k)', 'Heap chỉ giữ k điểm thắng.'],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Chạy dòng dữ liệu 5, 15, 1, 3. Trung vị sau giá trị thứ tư là bao nhiêu?',
      answer: 4,
      hints: [
        'Sau bốn giá trị, mỗi nửa có hai giá trị, nên trung vị là trung bình cộng của hai đỉnh.',
        'low giữ 1 và 3, high giữ 5 và 15.',
      ],
      solution:
        'Sắp xếp lại, các giá trị là 1, 3, 5, 15. Đỉnh của low là 3 và đỉnh của high là 5: (3 + 5) / 2 = 4.',
    },
    {
      type: 'number',
      prompt: 'Chạy dòng dữ liệu 2, 8, 4, 6, 10. Cuối cùng giá trị nào nằm ở gốc của low?',
      answer: 6,
      hints: ['low giữ ba giá trị nhỏ hơn trong năm giá trị, và nó là heap lớn nhất.'],
      solution:
        'Đã sắp xếp: 2, 4, 6, 8, 10. low giữ 2, 4 và 6 với 6 ở đỉnh, cũng chính là trung vị; high giữ 8 và 10.',
    },
    {
      type: 'number',
      prompt: 'Chạy dòng dữ liệu 1, 2, 3, 4, 5. Có bao nhiêu giá trị phải chuyển giữa hai nửa?',
      answer: 2,
      unit: 'lần',
      hints: [
        'Mọi giá trị lớn hơn đỉnh của low đều vào high. Kiểm tra kích thước sau mỗi giá trị.',
        'Sau 3, high giữ 2 và 3 trong khi low chỉ giữ 1.',
      ],
      solution:
        '1 → low. 2 → high (kích thước 1, 1). 3 → high, giờ high nhiều hơn, nên 2 chuyển sang low. 4 → high (2, 2). 5 → high, nên 3 chuyển sang low. Hai lần chuyển.',
    },
    {
      type: 'multi',
      prompt:
        'Các điểm A (1, 2), B (3, 1), C (−2, −2), D (0, 1), E (2, −3). Hai điểm nào gần gốc toạ độ nhất?',
      options: ['A', 'B', 'C', 'D', 'E'],
      answers: [0, 3],
      hints: ['Tính x² + y² cho từng điểm: A là 1 + 4 = 5.'],
      solution:
        'Bình phương khoảng cách: A 5, B 10, C 8, D 1, E 13. Hai giá trị nhỏ nhất là D (1) và A (5).',
    },
    {
      type: 'number',
      prompt: 'Với cùng năm điểm đó và k = 2, có bao nhiêu điểm thay gốc của heap?',
      answer: 2,
      unit: 'điểm',
      hints: [
        'A và B lấp đầy heap; gốc là B với 10.',
        'Sau đó lần lượt so sánh C (8), D (1) và E (13) với gốc hiện tại.',
      ],
      solution:
        'C: 8 < 10 thay B (gốc thành C với 8). D: 1 < 8 thay C (gốc là A với 5). E: 13 ≥ 5 bị loại. Hai lần thay.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao bài k điểm gần nhất giữ heap lớn nhất chứ không phải heap nhỏ nhất?',
      options: [
        'Heap lớn nhất dựng nhanh hơn.',
        'Gốc phải là điểm xa nhất đang giữ, điểm mà điểm mới phải vượt qua.',
        'Heap nhỏ nhất không chứa được điểm.',
        'Đáp án phải được đưa ra từ xa đến gần.',
      ],
      answer: 1,
      hints: ['Khi có điểm mới, nó có thể đẩy điểm đang giữ nào ra?'],
      solution:
        'Điểm mới chỉ có thể thế chỗ điểm xa nhất trong k điểm đang giữ. Heap lớn nhất theo khoảng cách đặt đúng điểm đó ở gốc, nên chỉ cần một phép so sánh để quyết định và một lần vun để sửa lại.',
    },
  ],
  nextTeaser:
    'Chủ đề tiếp theo chuyển sang đồ thị: các đỉnh nối với nhau bằng cạnh, bắt đầu với Biểu diễn đồ thị.',
};
