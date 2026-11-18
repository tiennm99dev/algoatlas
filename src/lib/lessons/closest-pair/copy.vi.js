/** @typedef {import('$lib/algo-engine/closest-pair.js').ClosestFrame} ClosestFrame */

import { letter } from '$lib/components/graph-editor.js';

/** A squared distance as a plain distance. @param {number} d2 */
const fmt = (d2) => (d2 === Infinity ? '∞' : Math.sqrt(d2).toFixed(2));

/** @param {[number, number] | null} pair */
const pairText = (pair) => (pair ? `${letter(pair[0])}–${letter(pair[1])}` : 'chưa có');

/** @param {number} n */
const allPairs = (n) => (n * (n - 1)) / 2;

export const vi = {
  slug: 'closest-pair',
  topic: 'divide-and-conquer',
  level: 'Nâng cao',
  title: 'Cặp điểm gần nhất',
  intro:
    'Cho n điểm trên mặt phẳng, hãy tìm hai điểm gần nhau nhất. Xét mọi cặp tốn O(n²). Chia để trị (divide and conquer) tách các điểm bằng một đường thẳng đứng, giải từng nửa, rồi chỉ cần xem một dải hẹp quanh đường chia, nhờ vậy chi phí giảm xuống O(n log n).',
  summary:
    'Chạy từng bước thuật toán chia để trị tìm cặp điểm gần nhất: chia các điểm theo x, giải từng nửa, và chỉ kiểm tra dải rộng 2d quanh đường chia.',
  instruction:
    'Bấm vào chỗ trống trên mặt phẳng để thêm một điểm, bấm vào một điểm để xoá nó, hoặc nhập toạ độ các điểm. Sau đó chạy từng bước: theo dõi đường chia, dải rộng 2d, và xem trong dải chỉ có rất ít cặp phải đo.',
  pointsLabel: 'Các điểm (x, y)',
  presetLabel: 'Bộ điểm ban đầu',
  presetPlaceholder: 'Chọn một bộ điểm…',
  presets: {
    example: 'Ví dụ',
    crowded: 'Dải đông điểm',
    clusters: 'Hai cụm',
  },
  shuffle: 'Điểm ngẫu nhiên',
  errors: {
    format:
      'Hãy nhập các điểm dưới dạng cặp x, y, ví dụ “(10, 80) (22, 30)”. Bộ điểm hợp lệ gần nhất đã được khôi phục.',
    range: 'Mỗi toạ độ phải từ 0 đến 99. Bộ điểm hợp lệ gần nhất đã được khôi phục.',
    count: 'Hãy dùng từ 2 đến 16 điểm. Bộ điểm hợp lệ gần nhất đã được khôi phục.',
    duplicate: 'Các điểm phải khác nhau. Bộ điểm hợp lệ gần nhất đã được khôi phục.',
  },
  newPointsNotice: 'Đã nạp bộ điểm mới.',
  /** @param {number} id @param {number} x @param {number} y */
  addedNotice: (id, x, y) => `Đã thêm điểm ${letter(id)} tại (${x}, ${y}). Vết chạy bắt đầu lại.`,
  /** @param {number} x @param {number} y */
  removedNotice: (x, y) => `Đã xoá điểm tại (${x}, ${y}). Vết chạy bắt đầu lại.`,
  fullNotice: 'Mặt phẳng chứa tối đa 16 điểm. Hãy xoá bớt một điểm trước.',
  minNotice: 'Cần giữ lại ít nhất 2 điểm.',
  takenNotice: 'Chỗ đó đã có một điểm.',
  /** @param {number} n */
  planeLabel: (n) =>
    `Mặt phẳng có ${n} điểm, trục x hướng sang phải và trục y hướng lên, từ 0 đến 99. Bấm vào chỗ trống để thêm một điểm.`,
  /** @param {number} id @param {number} x @param {number} y @param {string} state */
  pointLabel: (id, x, y, state) =>
    `Điểm ${letter(id)} tại (${x}, ${y})${state ? `, ${state}` : ''}. Nhấn Enter để xoá điểm này.`,
  letter,
  states: /** @type {Record<string, string>} */ ({
    compare: 'đang được đo',
    sorted: 'thuộc cặp tốt nhất của lời gọi này',
    frontier: 'nằm trong dải',
    path: 'thuộc cặp gần nhất',
  }),
  markers: /** @type {Record<string, string>} */ ({
    compare: '?',
    sorted: '★',
    frontier: 'S',
    path: '★',
  }),
  legend: {
    compare: 'Cặp đang được đo',
    sorted: 'Cặp tốt nhất của lời gọi này',
    frontier: 'Nằm trong dải',
    path: 'Cặp gần nhất',
    line: 'Đường chia',
    band: 'Dải rộng 2d',
    faded: 'Mờ: nằm ngoài lời gọi này',
  },
  stats: {
    checks: 'Số lần tính khoảng cách',
    pairs: 'Mọi cặp, n(n − 1)/2',
    d: 'd trong lời gọi này',
    best: 'Tốt nhất đến giờ',
  },
  /** @param {number} d2 */
  fmt,
  pairText,
  stackTitle: 'Các lời gọi đang mở (vị trí theo thứ tự x)',
  stackEmpty: 'không có',
  /** @param {number} lo @param {number} hi */
  rangeChip: (lo, hi) => `[${lo}–${hi}]`,
  practiceTitle: 'Tự kiểm tra',
  /** @param {ClosestFrame} f */
  describe(f) {
    const ids = (/** @type {number[]} */ list) => list.map((id) => letter(id)).join(', ');
    const [lo, hi] = f.range ?? [0, 0];
    const count = hi - lo + 1;
    switch (f.kind) {
      case 'start':
        return `Tìm hai điểm gần nhau nhất trong ${f.points.length} điểm. Xét mọi cặp sẽ phải tính khoảng cách ${allPairs(f.points.length)} lần.`;
      case 'sort':
        return `Sắp xếp các điểm theo x một lần: ${ids(f.points.map((p) => p.id))}. Mỗi lời gọi xử lí một đoạn liên tiếp của thứ tự này.`;
      case 'split': {
        const left = Math.floor(count / 2);
        return `Chia ${count} điểm này tại x = ${f.line}: giải riêng ${left} điểm bên trái và ${count - left} điểm bên phải.`;
      }
      case 'base':
        return `Chỉ có ${count} điểm: xét trực tiếp mọi cặp.`;
      case 'brute': {
        const [a, b] = /** @type {[number, number]} */ (f.checking);
        const v = f.closer
          ? 'tốt nhất trong lời gọi này đến giờ'
          : `không gần hơn d = ${fmt(f.d2)}`;
        return `dist(${letter(a)}, ${letter(b)}) = ${fmt(distOf(f, a, b))}: ${v}.`;
      }
      case 'combine':
        return `Cả hai nửa đã được giải: d = min(dL, dR) = ${fmt(f.d2)}, từ cặp ${pairText(f.pair)}. Một cặp gần hơn buộc phải nằm chéo qua đường x = ${f.line}, nên cả hai điểm của nó đều cách đường chia chưa đến d.`;
      case 'strip':
        return f.strip.length < 2
          ? `Dải |x − ${f.line}| < ${fmt(f.d2)} có ${f.strip.length} điểm: không cặp nào nằm chéo qua đường chia mà gần hơn d.`
          : `Dải |x − ${f.line}| < ${fmt(f.d2)} có ${f.strip.length} điểm, theo thứ tự y: ${ids(f.strip)}. Mỗi điểm chỉ được so với các điểm tiếp theo cao hơn nó chưa đến d.`;
      case 'strip-check': {
        const [a, b] = /** @type {[number, number]} */ (f.checking);
        const v = distOf(f, a, b);
        return f.closer
          ? `dist(${letter(a)}, ${letter(b)}) = ${fmt(v)} < d: có một cặp gần hơn nằm chéo qua đường chia, nên d = ${fmt(f.d2)}.`
          : `dist(${letter(a)}, ${letter(b)}) = ${fmt(v)}, không nhỏ hơn d = ${fmt(f.d2)}.`;
      }
      case 'return':
        return `Lời gọi này trả về d = ${fmt(f.d2)}, từ cặp ${pairText(f.pair)}.`;
      case 'done':
        return `Cặp gần nhất là ${pairText(f.pair)} với khoảng cách ${fmt(f.d2)} (√${f.d2}), tìm được sau ${f.checks} lần tính khoảng cách thay vì ${allPairs(f.points.length)}.`;
    }
  },
  takeaways: [
    'Sắp xếp các điểm theo x một lần. Mỗi lời gọi dùng một đường thẳng đứng tại trung vị để chia các điểm của nó thành nửa trái và nửa phải, rồi giải đệ quy cả hai nửa.',
    'Đặt d = min(dL, dR). Mọi cặp gần hơn d đều phải nằm chéo qua đường chia, nên cả hai điểm của nó cách đường chia chưa đến d: chỉ dải rộng 2d là đáng xét.',
    'Theo thứ tự y, một điểm trong dải chỉ cần so với các điểm tiếp theo cao hơn nó chưa đến d. Các điểm cùng một phía cách nhau ít nhất d, nên một hình chữ nhật d × 2d chứa tối đa 8 điểm, và mỗi điểm chỉ phải so với tối đa 7 điểm khác: dải tốn O(n).',
    'Nếu hai nửa được trộn theo y như sắp xếp trộn, T(n) = 2T(n/2) + O(n) = O(n log n). Sắp xếp lại dải trong mọi lời gọi cho O(n log² n); xét mọi cặp là O(n²).',
    'Chọn “Dải đông điểm” rồi chạy qua lời gọi ngoài cùng: rất nhiều điểm nằm sát đường chia, vậy mà mỗi điểm trong dải chỉ được đo với vài điểm lân cận phía trên nó.',
  ],
  complexityHead: ['Cách làm', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Chia để trị, trộn hai nửa theo y',
      'O(n log n)',
      'T(n) = 2T(n/2) + O(n): bước kiểm tra dải là tuyến tính.',
    ],
    [
      'Sắp xếp lại dải trong mọi lời gọi',
      'O(n log² n)',
      'T(n) = 2T(n/2) + O(n log n), trường hợp 2 của định lí thợ.',
    ],
    ['Xét mọi cặp', 'O(n²)', 'n(n − 1)/2 khoảng cách.'],
    ['Bộ nhớ thêm', 'O(n)', 'Bản sao đã sắp xếp theo x, dải, và ngăn xếp lời gọi sâu log₂ n.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với bộ điểm Ví dụ, đi đến bước xét dải của lời gọi ngoài cùng. Dải rộng 2d quanh x = 53 chứa bao nhiêu điểm?',
      answer: 5,
      unit: 'điểm',
      hints: [
        'Sau khi giải xong hai nửa, d = √313 ≈ 17.69.',
        'Đếm các điểm có 53 − 17.69 < x < 53 + 17.69, tức là 35.31 < x < 70.69.',
      ],
      solution:
        'Các điểm có x = 41, 48, 53, 62 và 70 nằm trong dải. Điểm có x = 35 nằm ngoài, chỉ thiếu 0.31, vì 18² = 324 không nhỏ hơn 313.',
    },
    {
      type: 'number',
      prompt:
        'Trong dải đã sắp xếp theo y, mỗi điểm phải so với tối đa bao nhiêu điểm đứng sau nó?',
      answer: 7,
      unit: 'điểm',
      hints: [
        'Xét hình chữ nhật d × 2d ngay phía trên điểm đó, bị đường chia cắt làm đôi.',
        'Mỗi ô vuông d/2 × d/2 trong đó chứa tối đa một điểm, vì các điểm cùng một phía cách nhau ít nhất d.',
      ],
      solution:
        'Hình chữ nhật d × 2d phía trên một điểm của dải được chia thành tám ô vuông d/2 × d/2, và mỗi ô chứa tối đa một điểm. Một trong số đó là chính điểm ấy, nên chỉ có tối đa 7 điểm khác cần kiểm tra.',
    },
    {
      type: 'text',
      prompt:
        'Giải T(n) = 2T(n/2) + n, chi phí khi hai nửa được trộn theo y. Viết đáp án theo kí hiệu O lớn.',
      accept: ['O(n log n)', 'n log n', 'Θ(n log n)', 'O(nlogn)'],
      hints: [
        'c = log₂ 2 = 1 khớp với f(n) = n.',
        'Trường hợp 2 của định lí thợ thêm một thừa số log.',
      ],
      solution: 'a = 2, b = 2, c = 1 và f(n) = Θ(n), nên trường hợp 2 cho Θ(n log n).',
    },
    {
      type: 'choice',
      prompt: 'Nếu mọi lời gọi đều sắp xếp lại dải theo y từ đầu, thuật toán tốn bao nhiêu?',
      options: ['O(n)', 'O(n log n)', 'O(n log² n)', 'O(n²)'],
      answer: 2,
      hints: [
        'Sắp xếp dải cộng thêm O(n log n) vào f(n).',
        'T(n) = 2T(n/2) + n log n là trường hợp 2 với p = 1.',
      ],
      solution:
        'T(n) = 2T(n/2) + Θ(n log n) có f(n) = Θ(n¹ · log n) với c = 1, nên trường hợp 2 cho Θ(n log² n). Trả hai nửa lên trên ở dạng đã trộn theo y giữ bước kết hợp ở mức O(n).',
    },
    {
      type: 'choice',
      prompt: 'Vì sao bước kết hợp có thể bỏ qua các điểm cách đường chia xa hơn d?',
      options: [
        'Chúng đã được sắp xếp theo y',
        'Một cặp gần hơn d có cả hai điểm cách đường chia chưa đến d',
        'Chúng không thuộc nửa nào',
        'Chỉ điểm trung vị mới có thể thuộc một cặp nằm chéo',
      ],
      answer: 1,
      hints: [
        'Một cặp nằm chéo có một điểm ở mỗi phía.',
        'Khoảng cách theo phương ngang của cặp ít nhất bằng khoảng cách từ mỗi điểm đến đường chia.',
      ],
      solution:
        'Nếu p ở bên trái đường chia và q ở bên phải, thì line − p.x ≤ q.x − p.x ≤ dist(p, q) < d, và tương tự với q. Vậy cả hai điểm của mọi cặp nằm chéo gần hơn d đều nằm trong dải.',
    },
  ],
  nextTeaser:
    'Bài sau là Luyện tập: bài toán chia để trị. Bạn tự viết bước kết hợp cho đoạn con có tổng lớn nhất và phần tử chiếm đa số, rồi kiểm tra trên dữ liệu mẫu.',
};

/** Squared distance between two points of a frame, by id. @param {ClosestFrame} f @param {number} a @param {number} b */
function distOf(f, a, b) {
  const p = /** @type {{x: number, y: number}} */ (f.points.find((q) => q.id === a));
  const q = /** @type {{x: number, y: number}} */ (f.points.find((r) => r.id === b));
  return (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
}
