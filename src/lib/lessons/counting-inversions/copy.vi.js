/** @typedef {import('$lib/algo-engine/counting-inversions.js').InversionFrame} InversionFrame */

/** Pairs a check of every pair reads. @param {number} n */
const allPairs = (n) => (n * (n - 1)) / 2;

export const vi = {
  slug: 'counting-inversions',
  topic: 'divide-and-conquer',
  level: 'Trung bình',
  title: 'Đếm nghịch thế',
  intro:
    'Một nghịch thế là một cặp vị trí i < j có giá trị bị ngược thứ tự, a[i] > a[j]. Số nghịch thế cho biết mảng còn cách thứ tự đã sắp xếp bao xa, và dùng để so sánh hai bảng xếp hạng của cùng các đối tượng. Xét mọi cặp tốn O(n²); merge sort (sắp xếp trộn) đếm được tất cả trong O(n log n) ngay trong lúc sắp xếp, đúng tinh thần chia để trị (divide and conquer).',
  summary:
    'Chạy từng bước merge sort được mở rộng để đếm nghịch thế: mỗi lần một giá trị từ dãy bên phải vượt lên trước dãy bên trái, nó cộng thêm một nghịch thế cho mỗi giá trị nó vượt qua.',
  instruction:
    'Nhập các giá trị hoặc chọn một mảng có sẵn, rồi chạy từng bước. Hãy để ý bước trộn: khi một giá trị được lấy từ R, mọi giá trị còn chờ trong L đều lớn hơn nó, nên số đếm tăng ngay |L| − i.',
  valuesLabel: 'Giá trị',
  presetLabel: 'Mảng ban đầu',
  presetPlaceholder: 'Chọn một mảng…',
  presets: {
    example: 'Ví dụ',
    sorted: 'Đã sắp xếp',
    reversed: 'Đảo ngược',
    nearly: 'Gần như đã sắp xếp',
    duplicates: 'Có giá trị lặp',
  },
  shuffle: 'Mảng ngẫu nhiên',
  errors: {
    format:
      'Hãy nhập các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách. Mảng hợp lệ gần nhất đã được khôi phục.',
    range: 'Mỗi giá trị phải từ 0 đến 99. Mảng hợp lệ gần nhất đã được khôi phục.',
    count: 'Hãy dùng từ 2 đến 16 giá trị. Mảng hợp lệ gần nhất đã được khôi phục.',
  },
  newArrayNotice: 'Đã nạp mảng mới.',
  /** @param {number[]} values @param {[number, number] | null} range */
  arrayAria: (values, range) =>
    `Mảng: ${values.join(', ')}.${range ? ` Đang xử lí [${range[0]}–${range[1]}].` : ''}`,
  /** @param {string} name @param {number[]} values @param {number} next */
  bufferAria: (name, values, next) =>
    values.length === 0
      ? `${name}: rỗng.`
      : `${name}: ${values.join(', ')}. ${next < values.length ? `Giá trị kế tiếp: ${values[next]}.` : 'Đã dùng hết.'}`,
  leftTitle: 'L, nửa trái đã sắp xếp',
  rightTitle: 'R, nửa phải đã sắp xếp',
  bufferIdle: 'L và R được điền khi một lượt trộn bắt đầu.',
  windowLeft: 'trái',
  windowRight: 'phải',
  legend: {
    head: 'Giá trị kế tiếp của L hoặc R',
    moved: 'Vừa ghi vào mảng',
    jumped: 'Bị vượt qua: mỗi giá trị là một nghịch thế',
    written: 'Đã ghi trong lượt trộn này',
    sorted: 'Đã sắp xếp',
    faded: 'Mờ: nằm ngoài lời gọi, đã được lấy, hoặc đã cũ',
  },
  markers: { head: '↑', moved: '↓', jumped: '>', written: '✓', sorted: '✓' },
  stats: {
    inversions: 'Số nghịch thế',
    comparisons: 'Số lần so sánh',
    cross: 'Cặp chéo trong lượt trộn này',
    brute: 'Số cặp phải xét nếu thử mọi cặp',
  },
  /** @param {InversionFrame} f */
  crossStat: (f) => (f.call ? String(f.call.cross) : '—'),
  pairsTitle: 'Các nghịch thế đã tìm, mới nhất trước',
  pairsEmpty: 'chưa có',
  /** @param {number} big @param {number} small */
  pairChip: (big, small) => `${big} > ${small}`,
  stackTitle: 'Call stack (ngoài cùng trước)',
  stackEmpty: 'rỗng',
  /** @param {number} lo @param {number} hi */
  rangeChip: (lo, hi) => `[${lo}–${hi}]`,
  practiceTitle: 'Tự kiểm tra',
  /** @param {InversionFrame} f */
  describe(f) {
    const [lo, hi] = f.range ?? [0, 0];
    switch (f.kind) {
      case 'start':
        return `Đếm các cặp i < j có a[i] > a[j]. Thử mọi cặp sẽ phải xét ${allPairs(f.values.length)} cặp; merge sort tìm ra chúng ngay trong lúc sắp xếp.`;
      case 'split':
        return `Chia [${lo}–${hi}] tại ${f.mid}: đếm các nghịch thế bên trong nửa trái, rồi bên trong nửa phải.`;
      case 'copy': {
        const c = /** @type {NonNullable<InversionFrame['call']>} */ (f.call);
        return `Cả hai nửa của [${lo}–${hi}] đã được sắp xếp, bên trong có ${c.left} và ${c.right} nghịch thế. Chép chúng vào L và R rồi trộn, vừa trộn vừa đếm các cặp chéo.`;
      }
      case 'take-left': {
        const v = f.left[f.i - 1];
        if (f.j === f.right.length)
          return `R đã dùng hết: ghi ${v} vào ô ${f.k}. Không giá trị nào của R vượt qua nó, nên +0.`;
        return v === f.right[f.j]
          ? `L[${f.i - 1}] = ${v} = R[${f.j}]: ghi ${v} vào ô ${f.k}. Khi bằng nhau ta lấy bên trái, nên hai giá trị bằng nhau không bao giờ được đếm. +0.`
          : `L[${f.i - 1}] = ${v} < R[${f.j}] = ${f.right[f.j]}: ghi ${v} vào ô ${f.k}. Không giá trị nào của R vượt qua nó, nên +0.`;
      }
      case 'take-right': {
        const v = f.right[f.j - 1];
        if (f.i === f.left.length)
          return `L đã dùng hết: ghi ${v} vào ô ${f.k}. Không còn gì để vượt qua, nên +0.`;
        const jumped = f.left.slice(f.i);
        return `R[${f.j - 1}] = ${v} < L[${f.i}] = ${f.left[f.i]}: ghi ${v} vào ô ${f.k}. Nó vượt lên trước ${f.gained} giá trị còn trong L (${jumped.join(', ')}), mỗi giá trị là một nghịch thế: +${f.gained}.`;
      }
      case 'merged': {
        const c = /** @type {NonNullable<InversionFrame['call']>} */ (f.call);
        return `Đã trộn [${lo}–${hi}]: ${c.left} bên trái + ${c.right} bên phải + ${c.cross} cặp chéo = ${c.left + c.right + c.cross} nghịch thế trong đoạn này.`;
      }
      case 'done': {
        const lead = `Có ${f.inversions} nghịch thế, tìm được sau ${f.comparisons} lần so sánh. Thử mọi cặp phải xét ${allPairs(f.values.length)} cặp.`;
        if (f.inversions === 0) return `${lead} Mảng vốn đã được sắp xếp.`;
        if (f.inversions === allPairs(f.values.length))
          return `${lead} Cặp nào cũng là nghịch thế: mảng ban đầu giảm ngặt.`;
        return lead;
      }
    }
  },
  takeaways: [
    'Một nghịch thế là một cặp i < j có a[i] > a[j]. Mảng đã sắp xếp có 0 nghịch thế, còn mảng giảm ngặt có nhiều nhất, n(n − 1)/2. Bubble sort (sắp xếp nổi bọt) đổi chỗ đúng một lần cho mỗi nghịch thế, còn insertion sort (sắp xếp chèn) dời đúng một lần cho mỗi nghịch thế.',
    'Chia: mọi nghịch thế hoặc nằm trong nửa trái, hoặc nằm trong nửa phải, hoặc nằm chéo giữa hai nửa. Sắp xếp đệ quy từng nửa sẽ đếm được hai loại đầu.',
    'Kết hợp: trong bước trộn, khi R[j] được lấy trong lúc L còn |L| − i giá trị, tất cả các giá trị ấy đều lớn hơn R[j] và đứng trước nó, nên ta cộng ngay |L| − i thay vì xét từng cặp.',
    'Khi bằng nhau ta lấy từ L, nên hai giá trị bằng nhau không bao giờ được đếm. Bước trộn tốn O(n) mỗi tầng và có log₂ n tầng, nên tổng cộng là O(n log n), so với O(n²) khi xét mọi cặp.',
    'Chọn “Đảo ngược” rồi đi đến bước cuối: cả 66 cặp đều là nghịch thế, vậy mà các lượt trộn đếm hết chúng chỉ với 20 lần so sánh.',
  ],
  complexityHead: ['Cách làm', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Đếm bằng merge sort',
      'O(n log n)',
      'log₂ n tầng; mỗi tầng trộn n giá trị và cộng mỗi loạt cặp chéo trong một bước.',
    ],
    ['Xét mọi cặp', 'O(n²)', 'n(n − 1)/2 cặp, mỗi cặp so sánh một lần.'],
    ['Liệt kê cả các cặp', 'O(n log n + I)', 'Viết ra I nghịch thế tốn một bước cho mỗi cặp.'],
    [
      'Bộ nhớ thêm',
      'O(n)',
      'Hai bản sao L và R của một lượt trộn, cộng call stack (ngăn xếp lời gọi) sâu log₂ n.',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Mảng [2, 4, 1, 3, 5] có bao nhiêu nghịch thế?',
      answer: 3,
      unit: 'nghịch thế',
      hints: [
        'Với mỗi giá trị, đếm các giá trị nhỏ hơn nó nằm bên phải nó.',
        'Sau 2 có một giá trị nhỏ hơn, sau 4 có hai.',
      ],
      solution:
        'Các cặp ngược thứ tự là (2, 1), (4, 1) và (4, 3). Sau 1, 3 và 5 không có giá trị nào nhỏ hơn, nên tổng là 3.',
    },
    {
      type: 'number',
      prompt:
        'Khi trộn L = [2, 5, 9] với R = [1, 6, 7], bước trộn cộng thêm bao nhiêu nghịch thế chéo?',
      answer: 5,
      unit: 'nghịch thế',
      hints: [
        '1 được lấy đầu tiên, khi cả ba giá trị của L vẫn đang chờ.',
        'Khi lấy 6 và 7, trong L chỉ còn 9.',
      ],
      solution:
        'Lấy 1 thì vượt qua 2, 5 và 9 (+3). Sau đó 2 và 5 được ghi xuống từ L. Lấy 6 thì vượt qua 9 (+1), lấy 7 cũng vượt qua 9 (+1). Tổng là 3 + 1 + 1 = 5: các cặp (2, 1), (5, 1), (9, 1), (9, 6) và (9, 7).',
    },
    {
      type: 'number',
      prompt: 'Một mảng gồm 10 giá trị đôi một khác nhau có nhiều nhất bao nhiêu nghịch thế?',
      answer: 45,
      unit: 'nghịch thế',
      hints: ['Đạt được khi mọi cặp đều ngược thứ tự.', 'Có n(n − 1)/2 cặp.'],
      solution:
        'Một mảng giảm ngặt làm mọi cặp đều ngược thứ tự, và 10 giá trị tạo thành 10 · 9 / 2 = 45 cặp.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao bước trộn lấy từ L khi L[i] bằng R[j]?',
      options: [
        'Để bước trộn nhanh hơn',
        'Hai giá trị bằng nhau không phải nghịch thế, mà lấy R trước sẽ tính cả L[i] là bị vượt qua',
        'R luôn phải được dùng hết trước',
        'Điều đó không ảnh hưởng đến số đếm',
      ],
      answer: 1,
      hints: [
        'Một nghịch thế cần a[i] > a[j], lớn hơn ngặt.',
        'Lấy R[j] sẽ cộng |L| − i, và L[i] là một trong các giá trị đó.',
      ],
      solution:
        'Lấy R[j] trước sẽ cộng |L| − i, trong đó có L[i] = R[j], một cặp bằng nhau không phải nghịch thế. Lấy từ L trước thì cặp ấy không bao giờ được đếm.',
    },
    {
      type: 'text',
      prompt:
        'Đếm nghịch thế bằng merge sort có thời gian chạy bao nhiêu, viết theo kí hiệu O lớn?',
      accept: ['O(n log n)', 'n log n', 'Θ(n log n)', 'O(nlogn)'],
      hints: [
        'Hệ thức truy hồi giống hệt của merge sort.',
        'T(n) = 2T(n/2) + n, trường hợp 2 của định lí thợ.',
      ],
      solution:
        'Việc đếm chỉ thêm O(1) vào mỗi bước của lượt trộn, nên T(n) = 2T(n/2) + Θ(n) = Θ(n log n), giống merge sort.',
    },
  ],
  nextTeaser:
    'Bài sau giữ lại bước phân hoạch của quicksort (sắp xếp nhanh) nhưng chỉ đi vào một phía: Quickselect và trung vị của các trung vị tìm phần tử nhỏ thứ k mà không cần sắp xếp cả mảng.',
};
