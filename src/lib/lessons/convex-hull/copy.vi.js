/** @typedef {import('$lib/algo-engine/convex-hull.js').HullFrame} HullFrame */
/** @typedef {import('$lib/algo-engine/convex-hull.js').HullPoint} HullPoint */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');
export const vi = {
  slug: 'convex-hull',
  topic: 'geometry',
  level: 'Trung bình',
  title: 'Bao lồi',
  intro:
    'Bao lồi (convex hull) là đa giác lồi nhỏ nhất bao quanh một tập điểm, giống hình mà một sợi dây chun ôm sát lại. Ta sắp xếp các điểm, rồi duyệt chúng với một ngăn xếp (stack): mỗi khi ba điểm mới nhất không tạo thành một lần rẽ trái, điểm ở giữa không thể là đỉnh của bao, nên ta lấy nó ra. Mỗi điểm được đẩy vào một lần và lấy ra nhiều nhất một lần, nên sau bước sắp xếp O(n log n), phần duyệt chỉ tốn O(n).',
  summary:
    'Dựng bao lồi của các điểm bạn đặt bằng thuật toán Graham hoặc thuật toán chuỗi đơn điệu của Andrew, và xem các khúc rẽ lõm bị loại khỏi ngăn xếp.',
  instruction:
    'Chọn một thuật toán rồi đi từng bước. Mỗi phép kiểm tra cho thấy khúc rẽ second → top → p, và nếu không phải rẽ trái thì top bị lấy ra. Sau đó kéo một điểm, nhấn vào chỗ trống để thêm điểm, hoặc nhấn “Ngẫu nhiên”. Kéo một đỉnh vào phía trong để thấy bao lồi thay đổi ngay.',
  methodLabel: 'Thuật toán',
  methods: { graham: 'Thuật toán Graham', monotone: 'Chuỗi đơn điệu' },
  presetLabel: 'Ví dụ',
  presets: {
    cloud: 'Đám điểm',
    square: 'Hình vuông có điểm trên các cạnh',
    allOnHull: 'Điểm nào cũng là đỉnh',
    zigzag: 'Đường zích zắc',
    line: 'Tất cả trên một đường thẳng',
  },
  fields: { x: 'x', y: 'y' },
  addPoint: 'Thêm điểm',
  removePoint: 'Xoá điểm đang chọn',
  random: 'Ngẫu nhiên',
  /** @param {string} name @param {number} x @param {number} y */
  pointLabel: (name, x, y) => `Điểm ${name} ở (${x}, ${y})`,
  planeLabel:
    'Một đám điểm trên mặt phẳng toạ độ. Phím mũi tên chuyển giữa các điểm; Shift + mũi tên dời một điểm, Enter chọn một điểm và Delete xoá điểm đó.',
  /** @param {number} xMax @param {number} yMax */
  coordError: (xMax, yMax) => `x phải là số nguyên từ 0 đến ${xMax}, còn y từ 0 đến ${yMax}.`,
  /** @param {number} max */
  fullError: (max) => `Chỉ dùng nhiều nhất ${max} điểm.`,
  minError: 'Cần giữ lại ít nhất một điểm.',
  occupiedError: 'Ở đó đã có một điểm.',
  selectFirst: 'Hãy chọn một điểm trước: nhấn vào nó, hoặc chọn nó bằng bàn phím rồi nhấn Enter.',
  legend: {
    chain: 'Chuỗi trong ngăn xếp',
    lower: 'Chuỗi dưới đã xong',
    hull: 'Bao lồi đã xong',
    current: 'p, điểm đang được thêm',
    popped: 'Đã lấy ra: không phải đỉnh',
    test: 'Khúc rẽ đang kiểm tra',
  },
  /** @param {number} rank */
  rankNote: (rank) => `#${rank}`,
  stackTitle: 'Ngăn xếp, từ đáy lên đỉnh',
  stackEmpty: 'rỗng',
  orderTitle: 'Thứ tự duyệt',
  orderEmpty: 'chưa sắp xếp',
  compareTitle: 'Hai thuật toán trên cùng các điểm này',
  compareHeads: { method: 'Thuật toán', tests: 'Phép kiểm tra', pops: 'Lần lấy ra' },
  stats: {
    hull: 'Số đỉnh của bao',
    points: 'Số điểm',
    tests: 'Số phép kiểm tra hướng quay',
    pushes: 'Số lần đẩy vào',
    pops: 'Số lần lấy ra',
  },
  pending: '…',
  workedTitle: 'Ví dụ mẫu: thuật toán Graham trên (0, 0), (4, 0), (4, 1), (5, 3)',
  workedSteps: [
    'Điểm mốc là (0, 0), điểm thấp nhất. Sắp theo góc quanh nó, các điểm còn lại là (4, 0), (4, 1), (5, 3).',
    'Đẩy (0, 0) và (4, 0) vào. Bên dưới mới chỉ có một điểm nên chưa cần kiểm tra.',
    'Tiếp theo là (4, 1). orient((0, 0), (4, 0), (4, 1)) = 4 > 0, rẽ trái, nên đẩy nó vào.',
    'Tiếp theo là (5, 3). orient((4, 0), (4, 1), (5, 3)) = −1 < 0, rẽ phải, nên lấy (4, 1) ra.',
    'orient((0, 0), (4, 0), (5, 3)) = 12 > 0, rẽ trái, nên đẩy (5, 3) vào. Bao lồi là (0, 0), (4, 0), (5, 3).',
  ],
  /**
   * @param {HullFrame} f
   * @param {(id: number) => string} name
   */
  describe: (f, name) => {
    switch (f.kind) {
      case 'start':
        return `Cần bao quanh ${f.points.length} điểm.`;
      case 'pivot':
        return f.pivot === null
          ? 'Không có điểm nào, nên không có điểm mốc.'
          : `Điểm mốc là ${name(f.pivot)}: điểm thấp nhất, nên chắc chắn là một đỉnh của bao.`;
      case 'sort':
        return f.method === 'graham'
          ? 'Sắp xếp các điểm còn lại theo góc quanh điểm mốc, dùng phép kiểm tra hướng quay thay cho góc. Nếu hoà, điểm gần hơn đứng trước.'
          : 'Sắp xếp các điểm theo x, rồi theo y. Điểm đầu và điểm cuối chắc chắn là đỉnh của bao.';
      case 'pass':
        return f.chain === 'lower'
          ? 'Lượt thứ nhất, từ trái sang phải: lượt này dựng chuỗi dưới.'
          : 'Lượt thứ hai, từ phải sang trái: lượt này dựng chuỗi trên trên cùng các điểm.';
      case 'consider':
        return `Tiếp theo là ${name(/** @type {number} */ (f.current))}. Kiểm tra khúc rẽ nó tạo với đỉnh ngăn xếp.`;
      case 'test': {
        const [second, top, p] = /** @type {[number, number, number]} */ (f.triple);
        const value = /** @type {number} */ (f.cross);
        const route = `${name(second)} → ${name(top)} → ${name(p)}`;
        return value > 0
          ? `${route}: tích có hướng ${num(value)} > 0, rẽ trái. Giữ ${name(top)}.`
          : `${route}: tích có hướng ${num(value)} ${value === 0 ? '= 0, đi thẳng' : '< 0, rẽ phải'}. ${name(top)} không phải đỉnh của bao.`;
      }
      case 'pop':
        return `Lấy ${name(/** @type {number} */ (f.popped[f.popped.length - 1]))} ra. Điểm này nằm bên trong hoặc trên cạnh của bao.`;
      case 'push':
        return `Đẩy ${name(f.stack[f.stack.length - 1])} vào. Ngăn xếp có ${f.stack.length} điểm.`;
      case 'done': {
        const hull = /** @type {number[]} */ (f.hull);
        if (hull.length === 0) return 'Không có điểm nào, nên không có bao lồi.';
        return `Bao lồi có ${hull.length} đỉnh: ${hull.map(name).join(', ')}, theo ngược chiều kim đồng hồ. Ta đã dùng ${f.tests} phép kiểm tra và ${f.pops} lần lấy ra.`;
      }
    }
  },
  takeaways: [
    'Cả hai thuật toán đều sắp xếp, rồi duyệt với một ngăn xếp, lấy ra mọi đỉnh ngăn xếp tạo khúc rẽ không phải rẽ trái. Chỉ thứ tự sắp xếp là khác: theo góc quanh một điểm mốc, hoặc theo x rồi theo y.',
    'Chuỗi đơn điệu duyệt hai lần, một lần cho chuỗi dưới và một lần cho chuỗi trên, rồi ghép hai chuỗi lại. Nó không cần so sánh góc, nên dễ viết đúng hơn.',
    'Mỗi điểm được đẩy vào một lần trong mỗi lượt và lấy ra nhiều nhất một lần, nên phần duyệt là O(n). Bước sắp xếp mới là phần O(n log n), và nói chung không thể nhanh hơn, vì có thể dùng một thuật toán bao lồi để sắp xếp.',
    'Lấy ra khi tích có hướng ≤ 0 sẽ bỏ các điểm thẳng hàng với một cạnh. Muốn giữ chúng, chỉ lấy ra khi tích có hướng < 0, và cẩn thận với các điểm hoà trên tia cuối cùng của thuật toán Graham.',
    'Chọn “Điểm nào cũng là đỉnh”: thuật toán Graham không lấy ra điểm nào, nhưng chuỗi đơn điệu vẫn lấy ra, vì lượt dưới của nó đẩy các đỉnh phía trên vào rồi mới lấy chúng ra. Sau đó chọn đường zích zắc và so sánh số lần lấy ra của hai phương pháp trên cùng các điểm.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Sắp xếp', 'Thời gian O(n log n)', 'Theo góc quanh điểm mốc, hoặc theo x rồi theo y.'],
    [
      'Duyệt',
      'Thời gian O(n)',
      'Mỗi điểm được đẩy vào một lần trong mỗi lượt và lấy ra nhiều nhất một lần, nên mỗi lượt có nhiều nhất khoảng 2n phép kiểm tra.',
    ],
    ['Bộ nhớ', 'O(n)', 'Thứ tự đã sắp xếp và ngăn xếp.'],
    [
      'Toàn bộ thuật toán',
      'O(n log n)',
      'Bước sắp xếp chiếm phần lớn. Trên các điểm đã sắp xếp sẵn, chỉ riêng phần duyệt là O(n).',
    ],
  ],
  nextTeaser:
    'Bài sau giới thiệu thuật toán đường quét: trượt một đường thẳng qua mặt phẳng để tìm các đoạn giao nhau mà không phải xét mọi cặp.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Bao lồi của (0, 0), (4, 0), (4, 4), (0, 4), (2, 2), (2, 0) có bao nhiêu đỉnh?',
      answer: 4,
      unit: 'đỉnh',
      hints: ['(2, 2) nằm bên trong.', '(2, 0) nằm trên một cạnh, nên không phải đỉnh.'],
      solution:
        'Chỉ bốn điểm ngoài cùng là đỉnh. (2, 2) nằm bên trong, còn (2, 0) thẳng hàng với (0, 0) và (4, 0), nên quy tắc lấy ra khi tích có hướng ≤ 0 loại nó.',
    },
    {
      type: 'number',
      prompt:
        'Ngăn xếp đang là (0, 0), (4, 0), (4, 1), và điểm tiếp theo theo thứ tự của thuật toán Graham là (5, 3). Có bao nhiêu điểm bị lấy ra?',
      answer: 1,
      unit: 'điểm',
      hints: ['Kiểm tra (4, 0) → (4, 1) → (5, 3) trước.', 'Rồi kiểm tra (0, 0) → (4, 0) → (5, 3).'],
      solution:
        'orient((4, 0), (4, 1), (5, 3)) = −1, nên lấy (4, 1) ra. orient((0, 0), (4, 0), (5, 3)) = 12 > 0, nên dừng. Tất cả là một lần lấy ra.',
    },
    {
      type: 'choice',
      prompt:
        'Một phép kiểm tra cho orient(second, top, p) = 0. Theo quy tắc ≤ 0 thông thường, điều gì xảy ra?',
      options: [
        'Bỏ qua p',
        'Lấy top ra, vì nó nằm trên đường thẳng từ second đến p',
        'Dừng việc duyệt',
      ],
      answer: 1,
      hints: ['Một điểm nằm giữa một đoạn thẳng có phải là đỉnh không?'],
      solution:
        'Tích có hướng bằng 0 nghĩa là second, top và p thẳng hàng, với top nằm giữa theo thứ tự duyệt. Nó không phải đỉnh, nên bị loại.',
    },
    {
      type: 'text',
      prompt:
        'Tổng thời gian chạy của thuật toán chuỗi đơn điệu trên n điểm chưa sắp xếp là bao nhiêu, viết theo kí hiệu O lớn?',
      accept: ['O(n log n)', 'n log n'],
      hints: ['Sắp xếp tốn nhiều thời gian hơn duyệt.'],
      solution:
        'O(n log n): bước sắp xếp tốn chừng đó, còn mỗi lượt duyệt chỉ O(n) vì mỗi điểm được đẩy vào một lần và lấy ra nhiều nhất một lần.',
    },
    {
      type: 'order',
      prompt: 'Sắp xếp các bước của thuật toán chuỗi đơn điệu theo đúng thứ tự.',
      items: [
        'Dựng chuỗi trên, duyệt từ phải sang trái',
        'Sắp xếp các điểm theo x, rồi theo y',
        'Ghép hai chuỗi, bỏ điểm cuối của mỗi chuỗi',
        'Dựng chuỗi dưới, duyệt từ trái sang phải',
      ],
      answer: [1, 3, 0, 2],
      hints: ['Sắp xếp làm đầu tiên, còn ghép làm cuối cùng.'],
      solution:
        'Sắp xếp, chuỗi dưới, chuỗi trên, rồi ghép. Hai chuỗi chung hai điểm đầu mút, vì vậy mỗi chuỗi bỏ điểm cuối của nó.',
    },
  ],
};
