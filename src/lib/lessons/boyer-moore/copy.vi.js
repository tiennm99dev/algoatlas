/** @typedef {import('$lib/algo-engine/boyer-moore.js').BoyerMooreFrame} BoyerMooreFrame */

export const vi = {
  slug: 'boyer-moore',
  topic: 'string-algorithms',
  level: 'Trung bình',
  title: 'Thuật toán Boyer-Moore',
  intro:
    'Boyer-Moore so mẫu với văn bản từ phải sang trái. Một lần không khớp làm lộ ra một kí tự của văn bản, và mẫu có thể nhảy tới chỗ kí tự đó thẳng hàng với lần xuất hiện cuối cùng của nó trong mẫu, hoặc nhảy qua hẳn khi mẫu không có kí tự ấy. Với mẫu dài trên bảng chữ cái lớn, thuật toán có thể bỏ qua phần lớn văn bản mà không cần đọc. Bài này chỉ dùng quy tắc kí tự xấu (bad-character rule).',
  summary:
    'Trượt mẫu trên văn bản với các phép so sánh từ phải sang trái, và xem quy tắc kí tự xấu nhảy qua những kí tự nó không bao giờ đọc.',
  instruction:
    'Gõ văn bản và mẫu, rồi chạy từng bước. Ở mỗi lần không khớp, khung bên cạnh ghi quy tắc cho ra bước nhảy. Kí tự nào đã được đọc sẽ chuyển xám kèm một dấu chấm, nên ở cuối, các kí tự còn trắng là những kí tự chưa từng được xem. Hãy so hai ví dụ “Không chung kí tự” và “Trường hợp xấu nhất”.',
  textLabel: 'Văn bản',
  patternLabel: 'Mẫu',
  presetLabel: 'Ví dụ',
  presets: {
    classic: 'Ví dụ kinh điển',
    absent: 'Không chung kí tự',
    matches: 'Nhiều lần khớp',
    worst: 'Trường hợp xấu nhất',
  },
  /** @param {number} maxText @param {number} maxPattern */
  fieldErrors: (maxText, maxPattern) => ({
    empty: 'Hãy gõ ít nhất một chữ cái.',
    format: 'Chỉ dùng chữ cái a đến z, không có dấu cách.',
    textLength: `Văn bản dài tối đa ${maxText} chữ cái.`,
    patternLength: `Mẫu dài tối đa ${maxPattern} chữ cái.`,
  }),
  boardTitle: 'Mẫu so với văn bản',
  rows: { text: 'T', pattern: 'P' },
  /** @param {string} text @param {string} pattern @param {number} shift */
  boardAria: (text, pattern, shift) => `Văn bản ${text}, mẫu ${pattern} đặt ở vị trí ${shift}.`,
  /** @param {string} rowName @param {number} c @param {string} value @param {string} state */
  cellLabel: (rowName, c, value, state) =>
    `${rowName} cột ${c}: ${value || 'trống'}${state ? `, ${state}` : ''}`,
  rowNames: { text: 'Văn bản', pattern: 'Mẫu', letter: 'Kí tự', last: 'Chỉ số cuối' },
  states: {
    read: 'đã đọc',
    equal: 'kí tự bằng nhau',
    miss: 'kí tự khác nhau',
    bad: 'quyết định bước nhảy',
    found: 'khớp toàn bộ',
  },
  markers: { read: '·', equal: '✓', miss: '✗', bad: '!', found: '★' },
  legend: {
    read: 'Đã đọc',
    equal: 'Kí tự bằng nhau',
    miss: 'Kí tự khác nhau',
    bad: 'Quyết định bước nhảy',
    found: 'Khớp toàn bộ',
  },
  tableTitle: 'Chỉ số xa nhất bên phải của mỗi kí tự',
  tableRows: { letter: 'c', last: 'last' },
  tableNote: 'Kí tự nào không có trong bảng thì last = −1.',
  /** @param {string} pattern */
  tableAria: (pattern) => `Chỉ số xa nhất bên phải của mỗi kí tự trong ${pattern}.`,
  ruleTitle: 'Bước nhảy',
  /** @param {BoyerMooreFrame} f */
  ruleLine(f) {
    if (f.kind !== 'shift') return 'Mỗi bước nhảy sẽ được tính ra ở đây.';
    const lastBad = f.last[f.badLetter] ?? -1;
    const m = f.pattern.length;
    if (f.afterMatch) {
      return f.badAt < 0
        ? 'Khớp ở cuối văn bản: nhảy 1.'
        : `m − last[${f.badLetter}] = ${m} − (${lastBad}) = ${f.skip}`;
    }
    return `max(1, j − last[${f.badLetter}]) = max(1, ${f.j} − (${lastBad})) = ${f.skip}`;
  },
  stats: {
    comparisons: 'Số lần so kí tự',
    alignments: 'Số vị trí đặt mẫu đã thử',
    unread: 'Số kí tự văn bản chưa đọc',
    naive: 'Số lần so sánh của cách tìm trực tiếp',
  },
  skipsTitle: 'Các bước nhảy',
  skipsEmpty: 'chưa có',
  matchesTitle: 'Khớp tại',
  matchesEmpty: 'chưa có',
  /** @param {BoyerMooreFrame} f */
  describe(f) {
    const { pattern: P, text: T, shift: s, j } = f;
    const unread = T.length - f.reads.length;
    switch (f.kind) {
      case 'start':
        return `Trước hết ghi lại vị trí xuất hiện cuối cùng của mỗi kí tự trong ${P}.`;
      case 'table':
        return `P[${j}] = ${P[j]}, nên last[${P[j]}] = ${j}.`;
      case 'align':
        return `Đặt P ở vị trí ${s} và bắt đầu từ kí tự cuối của nó.`;
      case 'compare':
        return f.equal
          ? `P[${j}] = ${P[j]} bằng T[${s + j}]. Lùi sang trái một kí tự.`
          : `P[${j}] = ${P[j]} khác T[${s + j}] = ${T[s + j]}.`;
      case 'match':
        return `Cả ${P.length} kí tự đều khớp: ${P} xuất hiện ở vị trí ${s}.`;
      case 'shift': {
        if (f.afterMatch) {
          return f.badAt < 0
            ? 'Lần khớp kết thúc đúng ở cuối văn bản, nên dời 1 rồi dừng.'
            : f.badLetter in f.last
              ? `Cho kí tự kế tiếp, ${f.badLetter}, thẳng hàng với lần xuất hiện xa nhất bên phải của nó trong P: nhảy ${f.skip}.`
              : `Kí tự kế tiếp, ${f.badLetter}, không có trong P, nên nhảy qua nó: nhảy ${f.skip}.`;
        }
        const at = f.last[f.badLetter] ?? -1;
        if (at < 0)
          return `P không có ${f.badLetter}, nên không vị trí đặt mẫu nào phủ lên nó có thể khớp: nhảy qua nó, nhảy ${f.skip}.`;
        if (at > j)
          return `Chữ ${f.badLetter} xa nhất bên phải trong P nằm bên phải j, nên cho nó thẳng hàng sẽ làm P lùi lại. Chỉ nhảy 1.`;
        return `Chữ ${f.badLetter} xa nhất bên phải trong P ở vị trí ${at}: cho nó thẳng hàng với văn bản, nhảy ${f.skip}.`;
      }
      case 'done':
        return `Xong: ${f.matches.length} lần khớp với ${f.comparisons} lần so sánh, và ${unread} kí tự của văn bản chưa từng được đọc.`;
    }
  },
  takeaways: [
    'So từ bên phải nghĩa là một lần không khớp thường cho thấy một kí tự loại được nhiều vị trí đặt mẫu cùng lúc.',
    'Quy tắc kí tự xấu nhảy j − last[c] vị trí, và luôn ít nhất 1. Một kí tự không có trong mẫu cho phép nhảy qua hẳn kí tự đó.',
    'Với đầu vào thuận lợi, thuật toán chỉ đọc khoảng n/m kí tự, tức là dưới tuyến tính: mẫu càng dài thì càng nhanh.',
    'Chỉ dùng kí tự xấu thì vẫn có thể tốn O(n · m), như trong ví dụ trường hợp xấu nhất. Thuật toán đầy đủ thêm quy tắc hậu tố tốt, đưa trường hợp xấu nhất về O(n + m) khi mẫu không xuất hiện, và cải tiến của Galil mở rộng điều đó cho mọi đầu vào.',
    'Thử “Không chung kí tự” rồi kéo dài mẫu bằng thêm các kí tự không có trong văn bản: số lần so sánh giảm khi mẫu dài ra.',
  ],
  complexityHead: ['Trường hợp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Chuẩn bị',
      'O(m + σ)',
      'Mỗi chữ cái của bảng chữ cái một ô trong bảng, điền bằng một lượt qua mẫu.',
    ],
    [
      'Tốt nhất',
      'O(n / m)',
      'Mọi vị trí đặt mẫu đều thất bại ngay ở lần so sánh đầu, tại một kí tự mà P không có.',
    ],
    ['Xấu nhất', 'O(n · m)', 'Mọi vị trí đặt mẫu đều đọc gần hết P rồi chỉ dời 1.'],
    ['Bộ nhớ', 'O(σ)', 'Bảng vị trí cuối, mỗi chữ cái của bảng chữ cái một ô.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'P = example, và lần so sánh đầu tiên, ở j = 6, gặp kí tự s của văn bản. Mẫu nhảy bao xa?',
      answer: 7,
      unit: 'vị trí',
      hints: ['example không có s, nên last[s] = −1. Dùng j − last[s].'],
      solution: 'max(1, 6 − (−1)) = 7: cả mẫu dời qua khỏi chữ s.',
    },
    {
      type: 'number',
      prompt: 'P = abcab. Lần so sánh ở j = 4 gặp kí tự c của văn bản. Mẫu nhảy bao xa?',
      answer: 2,
      unit: 'vị trí',
      hints: ['Chữ c xa nhất bên phải trong abcab ở chỉ số 2.'],
      solution: 'j − last[c] = 4 − 2 = 2, đưa chữ c của P thẳng hàng với chữ c của văn bản.',
    },
    {
      type: 'number',
      prompt:
        'P = abcab. Vị trí 4 và 3 khớp, rồi lần so sánh ở j = 2 gặp kí tự b của văn bản. Mẫu nhảy bao xa?',
      answer: 1,
      unit: 'vị trí',
      hints: ['Chữ b xa nhất bên phải ở chỉ số 4, nằm bên phải j.'],
      solution:
        'j − last[b] = 2 − 4 = −2. Dời theo số đó sẽ đi lùi, nên quy tắc dùng max(1, −2) = 1.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Không chung kí tự” (20 chữ a, mẫu xyz) rồi chạy đến bước cuối. Thuật toán so sánh bao nhiêu lần?',
      answer: 6,
      unit: 'lần',
      hints: ['Mỗi vị trí đặt mẫu thất bại ngay ở một chữ a, mà P không có a.'],
      solution:
        'Mỗi lần thất bại nhảy 3, nên mẫu lần lượt đặt ở 0, 3, 6, 9, 12 và 15, mỗi chỗ tốn một lần so sánh: tổng cộng 6. Cách tìm trực tiếp sẽ tốn 18.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Trường hợp xấu nhất” (16 chữ a, mẫu baaaa) rồi chạy đến bước cuối. Thuật toán so sánh bao nhiêu lần?',
      answer: 60,
      unit: 'lần',
      hints: ['Có 12 vị trí đặt mẫu. Mỗi vị trí đọc bao nhiêu kí tự trước khi thất bại ở chữ b?'],
      solution:
        'Cả 12 vị trí đều đọc đủ 5 kí tự, thất bại ở chữ b, rồi chỉ dời 1: 12 × 5 = 60. Với đầu vào này, cách tìm trực tiếp thất bại ngay và chỉ tốn 12.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Hàm Z, tính cho mỗi vị trí độ dài đoạn dài nhất khớp với tiền tố của xâu, và dùng nó để so khớp mẫu.',
};
