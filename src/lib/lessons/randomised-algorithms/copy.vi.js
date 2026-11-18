/** @typedef {import('$lib/algo-engine/randomised-algorithms.js').QuickFrame} QuickFrame */

/** One decimal place. @param {number} x */
const oneDp = (x) => (Math.round(x * 10) / 10).toFixed(1);

export const vi = {
  slug: 'randomised-algorithms',
  topic: 'algebraic-randomised',
  level: 'Trung bình',
  title: 'Thuật toán ngẫu nhiên',
  intro:
    'Một thuật toán ngẫu nhiên (randomised algorithm) tung đồng xu trong lúc chạy. Thuật toán kiểu Las Vegas, như sắp xếp nhanh ngẫu nhiên, luôn trả về đáp án đúng nhưng thời gian chạy là ngẫu nhiên; thuật toán kiểu Monte Carlo, như phép kiểm tra số nguyên tố Miller-Rabin, luôn chạy nhanh nhưng có thể sai với một xác suất nhỏ. Chọn chốt ngẫu nhiên nghĩa là không có đầu vào cố định nào là xấu: mọi đầu vào đều được sắp xếp trong thời gian kì vọng O(n log n).',
  summary:
    'Sắp xếp nhanh ngẫu nhiên, một thuật toán Las Vegas: chạy nhiều lần, vẽ số phép so sánh, rồi so giá trị trung bình với kì vọng 2(n + 1)Hₙ − 4n.',
  instruction:
    'Nhập một dãy hoặc chọn sẵn, chọn quy tắc lấy chốt rồi chạy từng bước một lần chạy. Sau đó bấm “Chạy 100 lần” và xem biểu đồ tần suất số phép so sánh: với chốt ngẫu nhiên, các cột dồn quanh giá trị kì vọng dù đầu vào xếp thế nào. Chuyển sang “Phần tử cuối” trên dãy đã sắp xếp để thấy mọi lần chạy đều rơi vào trường hợp xấu nhất.',
  fields: { values: 'Các giá trị', rule: 'Chốt' },
  rules: { random: 'Ngẫu nhiên', last: 'Phần tử cuối' },
  presetLabel: 'Ví dụ',
  presets: {
    shuffled: 'Xáo trộn (16)',
    sorted: 'Đã sắp xếp (16)',
    reversed: 'Đảo ngược (16)',
    small: 'Nhỏ (6)',
  },
  /** @param {number} minN @param {number} maxN @param {number} max */
  valuesError: (minN, maxN, max) =>
    `Hãy nhập từ ${minN} đến ${maxN} số nguyên trong khoảng 0 đến ${max}, ngăn cách bằng dấu phẩy hoặc dấu cách.`,
  reroll: 'Chạy ngẫu nhiên lần khác',
  runMany: (/** @type {number} */ k) => `Chạy ${k} lần`,
  clear: 'Xoá các lần chạy',
  /** @param {number} max */
  runsFull: (max) => `Biểu đồ giữ nhiều nhất ${max} lần chạy. Hãy xoá để bắt đầu lại.`,
  barsTitle: 'Một lần chạy, từng bước',
  /** @param {number[]} values */
  barsAria: (values) => `Các cột ứng với giá trị ${values.join(', ')}`,
  barStates: {
    pivot: 'P',
    compare: '?',
    left: '≤',
    right: '>',
    placed: '✓',
    '': '',
  },
  legend: {
    pivot: 'P Chốt x',
    compare: '? Đang so sánh',
    left: '≤ Không lớn hơn x',
    right: '> Lớn hơn x',
    placed: '✓ Đã ở đúng chỗ cuối cùng',
  },
  stats: {
    comparisons: 'Số phép so sánh lần này',
    swaps: 'Số lần đổi chỗ',
    depth: 'Lời gọi sâu nhất',
    expected: 'Kì vọng, khoá phân biệt',
    worst: 'Xấu nhất n(n − 1)/2',
  },
  histTitle: 'Số phép so sánh qua nhiều lần chạy',
  /** @param {number} runs */
  histAria: (runs) => `Biểu đồ tần suất số phép so sánh qua ${runs} lần chạy`,
  /** @param {number} from @param {number} to @param {number} count */
  binLabel: (from, to, count) =>
    `${from === to ? from : `từ ${from} đến ${to}`} phép so sánh: ${count} lần chạy`,
  histEmpty: 'Bấm “Chạy 100 lần” để bắt đầu lấy mẫu.',
  histMean: '▲ trung bình các lần chạy',
  histExpected: '◆ giá trị kì vọng',
  runStats: {
    runs: 'Số lần chạy',
    mean: 'Trung bình',
    min: 'Ít nhất',
    max: 'Nhiều nhất',
    correct: 'Sắp xếp đúng',
  },
  /** @param {number} x */
  oneDp,
  /** @param {number} ok @param {number} runs */
  correctText: (ok, runs) => `${ok}/${runs}`,
  /** @param {QuickFrame} f @param {number} pivot */
  describe(f, pivot) {
    switch (f.kind) {
      case 'start':
        return `Sắp xếp ${f.items.length} giá trị, mỗi lời gọi dùng ${f.rule === 'random' ? 'một chốt chọn ngẫu nhiên đều' : 'phần tử cuối làm chốt'}.`;
      case 'call':
        return `Phân hoạch các vị trí từ ${f.lo} đến ${f.hi} (độ sâu lời gọi ${f.depth}).`;
      case 'pick':
        return f.rule === 'random'
          ? `Đồng xu chọn vị trí ${f.picked}: đổi nó về cuối, nên chốt là x = ${pivot}.`
          : `Chốt là phần tử cuối, x = ${pivot}.`;
      case 'compare': {
        const v = f.items[f.j].value;
        return f.goesLeft
          ? `So sánh ${v} với x = ${pivot}: ${v} ≤ ${pivot}, nên nó vào phần bên trái.`
          : `So sánh ${v} với x = ${pivot}: ${v} > ${pivot}, nên nó ở lại phần bên phải.`;
      }
      case 'swap':
        return `Nới phần bên trái đến vị trí ${f.i} và đổi phần tử vào đó.`;
      case 'place':
        return `Đổi chốt ${pivot} vào vị trí ${f.i + 1}, chỗ cuối cùng của nó; rồi sắp xếp hai bên.`;
      case 'done':
        return `Đã sắp xếp xong với ${f.comparisons} phép so sánh, lời gọi sâu nhất ở độ sâu ${f.maxDepth}. ${f.rule === 'random' ? 'Lần chạy khác có thể tốn số phép so sánh khác, nhưng kết quả luôn được sắp xếp.' : 'Mọi lần chạy trên đầu vào này đều đi đúng những bước như nhau.'}`;
    }
  },
  takeaways: [
    'Thuật toán Las Vegas luôn đúng và có thời gian chạy ngẫu nhiên; thuật toán Monte Carlo có thời gian chạy bị chặn và một khả năng nhỏ trả lời sai. Lặp một phép kiểm tra Monte Carlo k lần có thể thu nhỏ khả năng đó xuống (1/2)ᵏ hoặc thấp hơn.',
    'Với một quy tắc chọn chốt cố định, luôn có đầu vào xấu: quy tắc lấy phần tử cuối làm n(n − 1)/2 phép so sánh trên đầu vào đã sắp xếp. Chốt ngẫu nhiên chuyển sự ngẫu nhiên từ đầu vào vào trong thuật toán, nên không ai cố tình tạo được đầu vào xấu.',
    'Phân tích kì vọng: hai phần tử zᵢ < zⱼ chỉ được so sánh khi một trong hai là chốt đầu tiên được chọn trong zᵢ … zⱼ, điều này xảy ra với xác suất 2/(j − i + 1). Cộng trên mọi cặp được 2(n + 1)Hₙ − 4n ≈ 1,39 n log₂ n phép so sánh.',
    'Trường hợp xấu nhất vẫn là n(n − 1)/2, nhưng nó đòi một chuỗi lần tung đồng xu cực kì xui, và biểu đồ tần suất cho thấy điều đó hiếm đến mức nào.',
    'Thử “Đã sắp xếp (16)” với “Phần tử cuối”, chạy 100 lần, rồi chuyển sang “Ngẫu nhiên”: cột nhọn ở 120 biến thành một quả đồi quanh 51.',
  ],
  complexityHead: ['Trường hợp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Kì vọng, mọi đầu vào',
      'O(n log n)',
      'Tính tuyến tính của kì vọng trên các cặp: tổng các 2/(j − i + 1) là 2(n + 1)Hₙ − 4n.',
    ],
    [
      'Xấu nhất',
      'O(n²)',
      'Mọi chốt rút ra đều là phần tử nhỏ nhất hoặc lớn nhất còn lại; khả năng này giảm rất nhanh khi n tăng.',
    ],
    [
      'Chốt cố định ở cuối, đầu vào đã sắp xếp',
      'Θ(n²)',
      'Mỗi lời gọi chỉ bớt được chốt, nên các độ dài n, n − 1, … 2 tốn n(n − 1)/2.',
    ],
    ['Bộ nhớ', 'O(log n) kì vọng', 'Độ sâu đệ quy, cũng là một đại lượng ngẫu nhiên.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt: 'Sắp xếp nhanh ngẫu nhiên thuộc loại thuật toán ngẫu nhiên nào?',
      options: [
        'Las Vegas: luôn đúng, thời gian chạy ngẫu nhiên',
        'Monte Carlo: thời gian chạy cố định, có thể sai',
        'Không loại nào, vì nó tất định',
        'Cả hai cùng lúc',
      ],
      answer: 0,
      hints: ['Có lần chạy nào trả về một dãy chưa sắp xếp không?'],
      solution:
        'Mọi lần chạy đều trả về dãy đã sắp xếp; chỉ số phép so sánh là thay đổi. Vì vậy nó thuộc loại Las Vegas.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Đã sắp xếp (16)” với chốt “Phần tử cuối” rồi chạy đến bước cuối. Có bao nhiêu phép so sánh?',
      answer: 120,
      unit: 'phép so sánh',
      hints: ['Mỗi lời gọi chỉ bớt được chốt: 15 + 14 + … + 1.'],
      solution: 'Các lần phân hoạch so sánh 15, 14, …, 1 lần, tức là 16 · 15 / 2 = 120.',
    },
    {
      type: 'number',
      prompt:
        'Với n = 16 khoá phân biệt, số phép so sánh kì vọng 2(n + 1)Hₙ − 4n bằng bao nhiêu, làm tròn đến một chữ số thập phân?',
      answer: 50.9,
      tolerance: 0.05,
      hints: ['H₁₆ ≈ 3.3807. Thẻ “Kì vọng” cũng hiện giá trị này.'],
      solution: '2 · 17 · 3.3807 − 64 ≈ 114.94 − 64 = 50.9.',
    },
    {
      type: 'multi',
      prompt: 'Những thuật toán nào dưới đây thuộc loại Monte Carlo?',
      options: [
        'Phép kiểm tra số nguyên tố Miller-Rabin',
        'Sắp xếp nhanh ngẫu nhiên',
        'Thuật toán co cạnh ngẫu nhiên của Karger tìm lát cắt nhỏ nhất',
        'Chọn phần tử ngẫu nhiên (quickselect)',
      ],
      answers: [0, 2],
      hints: ['Hỏi với từng thuật toán: nó có bao giờ trả lời sai không?'],
      solution:
        'Miller-Rabin có thể gọi một hợp số là số nguyên tố, và một lần chạy thuật toán Karger có thể bỏ lỡ lát cắt nhỏ nhất. Sắp xếp nhanh và quickselect luôn trả về đáp án đúng, nên chúng thuộc loại Las Vegas.',
    },
    {
      type: 'number',
      prompt:
        'Với 3 khoá phân biệt, xác suất để khoá nhỏ nhất và khoá lớn nhất từng được so sánh với nhau là bao nhiêu? Viết dưới dạng số thập phân.',
      answer: 2 / 3,
      tolerance: 0.01,
      hints: [
        'Chúng chỉ được so sánh khi một trong hai là chốt đầu tiên được chọn trong cả ba khoá.',
      ],
      solution:
        'Cặp này trải trên 3 khoá, nên xác suất là 2 / (3 − 1 + 1) = 2/3: nếu khoá ở giữa làm chốt đầu tiên, hai khoá kia rơi về hai phía và không bao giờ được so sánh.',
    },
  ],
  nextTeaser:
    'Bài sau là băm phổ quát và băm hoàn hảo: rút ngẫu nhiên một hàm băm để va chạm hiếm, rồi dựng bảng không có va chạm nào.',
};
