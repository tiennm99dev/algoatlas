/** @typedef {import('$lib/algo-engine/z-function.js').ZFrame} ZFrame */

export const vi = {
  slug: 'z-function',
  topic: 'string-algorithms',
  level: 'Trung bình',
  title: 'Hàm Z',
  intro:
    'Hàm Z (Z-function) ghi lại, với mỗi vị trí của một xâu, có bao nhiêu kí tự tính từ đó khớp với phần đầu của xâu. Tính lại từng giá trị từ đầu có thể tốn O(n²), nhưng đoạn khớp xa nhất bên phải tìm được đến lúc đó, gọi là hộp Z, đã cho biết các kí tự bên trong nó trông thế nào. Nhờ vậy ta có cả mảng trong O(n), và thêm một kí tự ngăn cách thì nó cũng là một thuật toán so khớp mẫu.',
  summary:
    'Tính đoạn dài nhất khớp với tiền tố ở mọi vị trí trong thời gian tuyến tính nhờ dùng lại hộp Z, rồi dùng nó để tìm một mẫu.',
  instruction:
    'Gõ một xâu và chạy từng bước. Hàng giữa trượt tiền tố xuống dưới vị trí i, và hai dấu [ ] đánh dấu hai đầu hộp Z. Khi i nằm trong hộp, hãy xem giá trị được chép từ vị trí soi gương: không kí tự nào phải đọc cho phần đó. Thêm một mẫu để tìm kiếm với P$T, nơi các giá trị Z bằng độ dài mẫu đánh dấu những lần khớp.',
  textLabel: 'Xâu hoặc văn bản',
  patternLabel: 'Mẫu (không bắt buộc)',
  presetLabel: 'Ví dụ',
  presets: {
    classic: 'Các khối lặp lại',
    palindrome: 'Xâu đối xứng',
    repeats: 'Chỉ một chữ cái',
    search: 'Tìm một mẫu',
  },
  /** @param {number} max */
  fieldErrors: (max) => ({
    empty: 'Hãy gõ ít nhất một chữ cái.',
    format: 'Chỉ dùng chữ cái a đến z, không có dấu cách.',
    length: `Xâu dài tối đa ${max} chữ cái.`,
    combined: `Mẫu, kí tự ngăn cách và văn bản cộng lại dài tối đa ${max} kí tự.`,
  }),
  boardTitle: 'Hộp Z trên xâu',
  rows: { s: 'S', prefix: 'pre', z: 'Z' },
  boardNote:
    'Hàng pre là phần đầu của S, được dời sao cho kí tự đầu tiên nằm dưới i. Z[0] để trống, vì cả xâu hiển nhiên khớp với chính nó.',
  /** @param {string} s */
  boardAria: (s) => `Xâu ${s}, tiền tố của nó đặt thẳng hàng dưới vị trí i, và các giá trị Z.`,
  /** @param {string} rowName @param {number} c @param {string} value @param {string} state */
  cellLabel: (rowName, c, value, state) =>
    `${rowName} cột ${c}: ${value || 'trống'}${state ? `, ${state}` : ''}`,
  rowNames: { s: 'Xâu', prefix: 'Tiền tố', z: 'Giá trị Z' },
  states: {
    box: 'trong hộp Z',
    mirror: 'vị trí soi gương của i',
    matched: 'đã khớp đến giờ',
    equal: 'kí tự bằng nhau',
    miss: 'kí tự khác nhau',
    current: 'vị trí i',
    found: 'tìm thấy mẫu',
  },
  markers: { box: '', mirror: 'm', matched: '=', equal: '✓', miss: '✗', current: 'i', found: '★' },
  legend: {
    box: '[ ] Trong hộp Z',
    mirror: 'Vị trí soi gương của i',
    matched: 'Đã khớp đến giờ',
    equal: 'Kí tự bằng nhau',
    miss: 'Kí tự khác nhau',
    current: 'Vị trí i',
    found: 'Tìm thấy mẫu',
  },
  boxEnds: { left: '[', right: ']' },
  stats: {
    i: 'Vị trí i',
    box: 'Hộp Z [l, r)',
    comparisons: 'Số lần so kí tự',
    reused: 'Số kí tự dùng lại không cần đọc',
    naive: 'Số lần so sánh nếu không có hộp',
    matches: 'Số lần khớp mẫu',
  },
  /** @param {number} l @param {number} r */
  boxValue: (l, r) => (l === r ? '—' : `[${l}, ${r})`),
  matchesTitle: 'Khớp tại',
  matchesEmpty: 'chưa có',
  /** @param {ZFrame} f */
  describe(f) {
    const { s, i, value, l, r } = f;
    switch (f.kind) {
      case 'start':
        return f.patternLength > 0
          ? `Tìm kiếm với S = ${s}: kí tự ngăn cách $ không xuất hiện ở chỗ nào khác, nên không giá trị Z nào vượt quá ${f.patternLength}.`
          : `Tính hàm Z của ${s}. Ban đầu hộp Z rỗng.`;
      case 'outside':
        return `i = ${i} nằm ngoài hộp, nên chưa biết gì: bắt đầu từ Z[${i}] = 0.`;
      case 'inside':
        return value === r - i
          ? `i = ${i} nằm trong hộp [${l}, ${r}), vị trí soi gương là ${f.mirror}. Bắt đầu từ min(r − i, Z[${f.mirror}]) = ${value}, và mọi thứ đến r đều đã biết. Đọc tiếp từ đó.`
          : `i = ${i} nằm trong hộp [${l}, ${r}), vị trí soi gương là ${f.mirror}. Bắt đầu từ min(r − i, Z[${f.mirror}]) = ${value}, không cần đọc các kí tự đó.`;
      case 'compare':
        return f.equal
          ? `S[${value}] = ${s[value]} bằng S[${i + value}], nên Z[${i}] tăng lên ${value + 1}.`
          : `S[${value}] = ${s[value]} khác S[${i + value}] = ${s[i + value]}, nên Z[${i}] dừng ở ${value}.`;
      case 'box':
        return `Đoạn khớp này vươn xa sang phải hơn hộp cũ, nên hộp Z trở thành [${l}, ${r}).`;
      case 'store':
        return `Z[${i}] = ${value}: ${value} kí tự tính từ ${i} khớp với phần đầu của S.`;
      case 'report':
        return `Z[${i}] bằng độ dài mẫu, ${f.patternLength}, nên mẫu xuất hiện ở vị trí ${i - f.patternLength - 1} trong văn bản.`;
      case 'done':
        return f.patternLength > 0
          ? `Xong: ${f.matches.length} lần khớp với ${f.comparisons} lần so sánh.`
          : `Xong: ${f.comparisons} lần so sánh, và ${f.reused} kí tự được dùng lại không cần đọc.`;
    }
  },
  takeaways: [
    'Z[i] là độ dài của xâu con dài nhất bắt đầu tại i đồng thời là tiền tố của S.',
    'Hộp Z [l, r) là đoạn khớp vươn xa nhất sang phải đến giờ. S[l..r) bằng S[0..r − l), nên vị trí i bên trong nó giống hệt vị trí i − l.',
    'Trong hộp, Z[i] bắt đầu từ min(r − i, Z[i − l]). Chỉ những kí tự vượt quá r mới được đọc lần đầu, nên r tiến lên tối đa n lần.',
    'Để tìm P trong T, tính hàm Z của P + $ + T: chỗ nào Z bằng m thì P xuất hiện ở đó. Kí tự ngăn cách giữ cho mọi giá trị Z không vượt quá m.',
    'Thử “Chỉ một chữ cái”, rồi một xâu cùng độ dài không lặp: so số lần so sánh với số lần nếu không có hộp.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Hàm Z',
      'O(n)',
      'Mỗi lần so sánh khớp đẩy r sang phải, và mỗi i có nhiều nhất một lần so sánh thất bại: tổng cộng tối đa 2n.',
    ],
    ['Tìm mẫu', 'O(n + m)', 'Một lần chạy trên xâu P + $ + T, có độ dài n + m + 1.'],
    ['Không có hộp', 'O(n²)', 'Một xâu chỉ có một chữ cái khiến mỗi vị trí phải đọc đến tận cuối.'],
    ['Bộ nhớ', 'O(n)', 'Một giá trị Z cho mỗi vị trí của xâu.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Với S = abacaba, Z[4] bằng bao nhiêu?',
      answer: 3,
      unit: 'kí tự',
      hints: ['Từ chỉ số 4, các kí tự là aba. Có bao nhiêu kí tự khớp với phần đầu của S?'],
      solution: 'Từ chỉ số 4, phần còn lại là aba, và aba đúng là phần đầu của S, nên Z[4] = 3.',
    },
    {
      type: 'number',
      prompt: 'Với S = aaaaa, Z[2] bằng bao nhiêu?',
      answer: 3,
      unit: 'kí tự',
      hints: ['Mọi kí tự đều khớp, nên chỉ có cuối xâu mới dừng được đoạn khớp.'],
      solution:
        'Các chỉ số 2, 3 và 4 chứa các kí tự đều khớp với phần đầu, rồi xâu kết thúc. Vậy Z[2] = 3.',
    },
    {
      type: 'number',
      prompt:
        'Với S = aabxaabxc, hộp Z là [4, 8) khi i = 5, và Z[1] = 1. Trước khi đọc kí tự nào, Z[5] bắt đầu từ giá trị nào?',
      answer: 1,
      unit: 'kí tự',
      hints: ['Dùng min(r − i, Z[i − l]).'],
      solution: 'min(8 − 5, Z[5 − 4]) = min(3, Z[1]) = min(3, 1) = 1.',
    },
    {
      type: 'number',
      prompt:
        'Tìm P = ab trong T = abab. Với S = ab$abab, có bao nhiêu vị trí của S có giá trị Z đúng bằng 2?',
      answer: 2,
      unit: 'vị trí',
      hints: ['Gõ văn bản và mẫu vào phần tương tác, rồi đọc hàng Z.'],
      solution:
        'Từ chỉ số 1 trở đi, S có các giá trị Z là 0, 0, 2, 0, 2, 0. Hai số 2 ứng với hai lần khớp ở vị trí 0 và 2 trong văn bản.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Chỉ một chữ cái” rồi chạy đến bước cuối. So với việc tính từng giá trị từ 0, hộp Z tiết kiệm được bao nhiêu lần so sánh?',
      answer: 55,
      unit: 'lần',
      hints: ['Đọc hai ô số liệu ở bước cuối rồi trừ.'],
      solution:
        'Không có hộp, mỗi vị trí đọc đến cuối: 11 + 10 + … + 1 = 66. Có hộp, chỉ vị trí đầu tiên phải đọc kí tự: 11. Vậy tiết kiệm được 66 − 11 = 55 lần.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Thuật toán Aho-Corasick, tìm cùng lúc nhiều mẫu trong một lượt đọc văn bản nhờ một trie có liên kết thất bại.',
};
