/** @typedef {import('$lib/algo-engine/linear-search.js').LinearFrame} LinearFrame */
/** @typedef {import('$lib/algo-engine/linear-search.js').LinearVariant} LinearVariant */

export const vi = {
  slug: 'linear-search',
  topic: 'searching',
  level: 'Cơ bản',
  title: 'Tìm kiếm tuần tự',
  intro:
    'Tìm kiếm tuần tự xét lần lượt từng ô từ trái sang, cho tới khi gặp giá trị cần tìm hoặc hết ô. Thuật toán không cần mảng có thứ tự nên dùng được với mọi mảng, nhưng một lần tìm hụt sẽ phải xem hết mọi ô.',
  summary:
    'Quét một mảng chưa sắp xếp từng ô một, đếm số phép so sánh và xem phần tử cầm canh bỏ được phép kiểm tra biên khỏi vòng lặp ra sao.',
  instruction:
    'Nhập một mảng và giá trị cần tìm, hoặc bấm vào một ô để tìm giá trị của ô đó, rồi chạy từng bước. Chuyển sang kiểu Cầm canh và so sánh thẻ Số lần kiểm tra biên trên cùng đầu vào.',
  takeaways: [
    'Tìm kiếm tuần tự là một lần quét lần lượt: so sánh a[0], a[1], a[2], … với x và dừng ở chỗ khớp đầu tiên. Nếu x xuất hiện nhiều lần, ta trả về vị trí đầu tiên.',
    'Thuật toán không cần sắp xếp, nên là lựa chọn duy nhất khi dữ liệu chưa có thứ tự và ta chỉ tìm một lần.',
    'Nếu x nằm ở chỉ số k thì mất k + 1 phép so sánh. Trường hợp xấu nhất, x ở cuối hoặc không có, phải đọc cả n ô: O(n).',
    'Vòng lặp thường tốn hai phép thử mỗi ô: i < n và a[i] == x. Phần tử cầm canh (sentinel) là một bản sao của x đặt ngay sau ô cuối; nó bảo đảm vòng lặp sẽ dừng, nên chỉ còn đúng một lần kiểm tra biên, sau vòng lặp.',
    'Thử “Không có giá trị cần tìm” ở cả hai kiểu: kiểu thường tốn n phép so sánh và n + 1 lần kiểm tra biên, kiểu cầm canh tốn n + 1 phép so sánh và chỉ 1 lần kiểm tra biên.',
  ],
  complexityHead: ['Trường hợp', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Tốt nhất', 'O(1)', 'x nằm ở ô đầu tiên: một phép so sánh.'],
    [
      'Trung bình (x có trong mảng, mọi vị trí khả năng như nhau)',
      'O(n)',
      'Khoảng (n + 1) / 2 phép so sánh.',
    ],
    ['Xấu nhất (x ở cuối hoặc không có)', 'O(n)', 'Mọi ô đều được so sánh một lần.'],
    ['Bộ nhớ', 'O(1)', 'Chỉ cần chỉ số i; phần tử cầm canh cần thêm một ô trống.'],
  ],
  nextTeaser:
    'Nếu mảng đã được sắp xếp, mỗi lần so sánh có thể loại bỏ cả nửa mảng. Đó là Tìm kiếm nhị phân.',
  variantLabel: 'Kiểu',
  variants: /** @type {Record<LinearVariant, string>} */ ({
    plain: 'Thường',
    sentinel: 'Cầm canh',
  }),
  valuesLabel: 'Mảng',
  targetLabel: 'Giá trị cần tìm x',
  valueErrors: {
    format: 'Hãy nhập các số nguyên cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 31, 8, 52.',
    range: 'Mọi giá trị phải từ 0 đến 99.',
    count: 'Hãy nhập từ 1 đến 16 giá trị.',
  },
  targetError: 'Giá trị cần tìm phải là số nguyên từ 0 đến 99.',
  newArray: 'Mảng mới',
  targetFirst: 'Giá trị ở đầu mảng',
  targetLast: 'Giá trị ở cuối mảng',
  targetMissing: 'Không có giá trị cần tìm',
  /** @param {number} x */
  pickedNotice: (x) => `Giờ ta tìm ${x}. Bấm bước tiếp để bắt đầu quét.`,
  selectHint: 'Bấm vào một ô, hoặc đưa tiêu điểm tới ô rồi nhấn Enter, để tìm giá trị của ô đó.',
  /** @param {number[]} values @param {boolean} sentinel @param {number} x */
  arrayLabel: (values, sentinel, x) =>
    `Mảng: ${values.join(', ')}${sentinel ? `, rồi đến phần tử cầm canh ${x}` : ''}`,
  /** @param {number} i @param {number} v @param {string} state */
  cellLabel: (i, v, state) => `Chỉ số ${i}: ${v}${state ? `, ${state}` : ''}`,
  /** @param {number} i @param {number} x */
  sentinelLabel: (i, x) => `Chỉ số ${i}: bản sao cầm canh của ${x}`,
  cellStates: {
    checked: 'đã xét, khác x',
    compare: 'đang so sánh',
    found: 'đã tìm thấy',
  },
  legend: {
    compare: 'Đang so sánh',
    visited: 'Đã xét, khác x',
    sorted: 'Đã tìm thấy',
    frontier: 'Ô cầm canh a[n]',
  },
  markers: { compare: '?', visited: '✕', sorted: '✓', frontier: 'S' },
  stats: {
    comparisons: 'Số phép so sánh khoá',
    boundChecks: 'Số lần kiểm tra biên',
    total: 'Tổng số phép thử',
    worst: 'Số phép so sánh xấu nhất',
  },
  compareTitle: 'Hai kiểu trên đầu vào này',
  /** @param {number} comparisons @param {number} bounds */
  compareRow: (comparisons, bounds) =>
    `${comparisons} phép so sánh + ${bounds} lần kiểm tra biên = ${comparisons + bounds}`,
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Kiểu thường, mảng ban đầu 31, 8, 52, 19, 77, 40, 63, 25, 90, 14 và giá trị cần tìm 63. Lần quét thực hiện bao nhiêu phép so sánh khoá?',
      answer: 7,
      unit: 'phép so sánh',
      hints: [
        'Chạy tới bước cuối rồi đọc thẻ Số phép so sánh khoá.',
        '63 nằm ở chỉ số 6, mà lần quét tìm thấy x ở chỉ số k thì tốn k + 1 phép so sánh.',
      ],
      solution:
        '63 ở chỉ số 6, nên lần quét so sánh từ a[0] tới a[6]: 7 phép so sánh, kèm 7 lần kiểm tra biên trước đó.',
    },
    {
      type: 'number',
      prompt:
        'Trên chính mảng 10 ô đó, tìm một giá trị không có trong mảng bằng kiểu thường. Tổng cộng có bao nhiêu phép thử, gồm phép so sánh và lần kiểm tra biên?',
      answer: 21,
      unit: 'phép thử',
      hints: [
        'Bấm Không có giá trị cần tìm rồi đọc thẻ Tổng số phép thử ở bước cuối.',
        'Mỗi ô tốn một lần kiểm tra biên và một phép so sánh, thêm một lần kiểm tra biên nữa (10 < 10) để kết thúc vòng lặp.',
      ],
      solution:
        '10 phép so sánh và 11 lần kiểm tra biên: 21 phép thử. Có phần tử cầm canh thì cùng lần tìm hụt đó tốn 11 phép so sánh và 1 lần kiểm tra biên, tức 12 phép thử.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao vòng lặp cầm canh bỏ được phép thử i < n?',
      options: [
        'Vì mảng đã được sắp xếp.',
        'Vì a[n] giữ một bản sao của x, nên muộn nhất tới i = n thì a[i] == x sẽ đúng.',
        'Vì vòng lặp đếm ngược từ n về 0.',
        'Vì vòng lặp dừng sau n / 2 bước.',
      ],
      answer: 1,
      hints: [
        'Nhìn ô thêm có đánh dấu S ở kiểu Cầm canh.',
        'Khi x không có trong các ô thật, điều gì làm vòng lặp dừng?',
      ],
      solution:
        'Bản sao của x sau ô cuối chắc chắn khớp, nên lần quét không bao giờ chạy quá chỉ số n. Một lần kiểm tra biên sau vòng lặp phân biệt chỗ khớp thật (i < n) với phần tử cầm canh (i = n).',
    },
    {
      type: 'text',
      prompt:
        'Thời gian chạy xấu nhất của tìm kiếm tuần tự trên n ô, viết theo kí hiệu O lớn, là gì?',
      accept: ['O(n)'],
      hints: [
        'Chọn một giá trị không có trong mảng và đếm số ô phải đọc.',
        'Số đó tăng đúng theo n.',
      ],
      solution:
        'O(n): khi x ở cuối hoặc không có, cả n ô đều được so sánh một lần. Phần tử cầm canh chỉ bớt lần kiểm tra biên chứ không bớt phép so sánh, nên vẫn là O(n).',
    },
  ],
  /** @param {LinearFrame} f @param {number[]} a @param {number} x */
  describe(f, a, x) {
    const n = a.length;
    const sentinel = f.variant === 'sentinel';
    switch (f.kind) {
      case 'start':
        return sentinel
          ? `Chép ${x} vào ô trống a[${n}] làm phần tử cầm canh và đặt i = 0. Giờ lần quét chắc chắn sẽ dừng.`
          : `Quét ${n} ô từ trái sang phải để tìm ${x}, bắt đầu từ i = 0.`;
      case 'compare': {
        if (sentinel && f.i === n)
          return `i = ${n}: đây là phần tử cầm canh, một bản sao của ${x}, nên a[i] != x sai và vòng lặp dừng.`;
        const bound = sentinel ? '' : `${f.i} < ${n}? Đúng. `;
        return f.match
          ? `${bound}So sánh a[${f.i}] = ${a[f.i]} với ${x}: bằng nhau, vòng lặp dừng ở đây.`
          : `${bound}So sánh a[${f.i}] = ${a[f.i]} với ${x}: khác nhau, chuyển sang i = ${f.i + 1}.`;
      }
      case 'found':
        return sentinel
          ? `Vòng lặp dừng ở i = ${f.i}, và ${f.i} < ${n}, nên đây là bản sao thật: trả về ${f.i}.`
          : `Tìm thấy ${x} ở chỉ số ${f.i} sau ${f.comparisons} phép so sánh.`;
      case 'not-found':
        return sentinel
          ? `Vòng lặp dừng ở i = ${n}: chỉ phần tử cầm canh khớp. ${x} không có trong mảng, trả về −1.`
          : `${n} < ${n}? Sai: mọi ô đều đã được xét. ${x} không có trong mảng, trả về −1.`;
    }
  },
};
