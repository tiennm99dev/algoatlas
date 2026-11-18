/** @typedef {import('$lib/algo-engine/suffix-arrays.js').SuffixFrame} SuffixFrame */

export const vi = {
  slug: 'suffix-arrays',
  topic: 'string-algorithms',
  level: 'Nâng cao',
  title: 'Mảng hậu tố và LCP',
  intro:
    'Mảng hậu tố (suffix array) liệt kê vị trí bắt đầu của mọi hậu tố của văn bản theo thứ tự đã sắp xếp, nên sau đó có thể tìm bất kì mẫu nào bằng tìm kiếm nhị phân. Kĩ thuật nhân đôi tiền tố dựng mảng này trong khoảng log₂ n vòng bằng cách sắp xếp theo 2, 4, 8, … kí tự, rồi thuật toán Kasai tìm tiền tố chung dài nhất (LCP) của mỗi cặp hậu tố kề nhau trong O(n). Kết hợp lại, chúng trả lời các câu hỏi về đoạn lặp và xâu con chỉ với một lượt.',
  summary:
    'Sắp xếp mọi hậu tố của một văn bản bằng nhân đôi tiền tố, rồi tính LCP của từng cặp kề nhau bằng thuật toán Kasai.',
  instruction:
    'Gõ một xâu và chạy từng bước. Mỗi vòng sắp xếp theo một cặp hạng, hai hạng cộng lại phủ gấp đôi số kí tự, hiện bằng hai màu nhạt. Sau đó Kasai điền các thanh giữa những hàng kề nhau theo thứ tự trong văn bản. Hãy để ý h: nó không bao giờ giảm quá một, nên phần lớn kí tự không bao giờ bị đọc hai lần.',
  textLabel: 'Xâu',
  presetLabel: 'Ví dụ',
  presets: {
    banana: 'banana',
    mississippi: 'mississippi',
    repeats: 'Chỉ một chữ cái',
    blocks: 'Khối lặp lại',
  },
  /** @param {number} max */
  fieldErrors: (max) => ({
    empty: 'Hãy gõ ít nhất một chữ cái.',
    format: 'Chỉ dùng chữ cái a đến z, không có dấu cách.',
    length: `Xâu dài tối đa ${max} chữ cái.`,
  }),
  boardTitle: 'Các hậu tố theo thứ tự hiện tại',
  /** @param {string} s */
  boardAria: (s) => `Các hậu tố của ${s} theo thứ tự hiện tại, với các thanh LCP nằm giữa.`,
  heads: { rank: 'Hàng', start: 'Bắt đầu', key: 'Khoá' },
  boardNote:
    'Các kí tự nằm ngoài khoá sắp xếp hiện tại chưa được tính, nên những hàng bằng khoá nhau có thể trông như sai thứ tự. Thanh giữa hai hàng là tiền tố chung dài nhất của chúng.',
  /** @param {number} row @param {number} start @param {string} suffix @param {string} state */
  rowLabel: (row, start, suffix, state) =>
    `Hàng ${row}: hậu tố ${suffix}, bắt đầu ở ${start}${state ? `, ${state}` : ''}`,
  /** @param {number} h */
  barLabel: (h) => `LCP ${h}`,
  states: {
    first: 'nửa đầu của khoá',
    second: 'nửa sau của khoá',
    shared: 'tiền tố chung đã biết',
    equal: 'kí tự bằng nhau',
    miss: 'kí tự khác nhau',
  },
  rowStates: { current: 'hậu tố i', above: 'hàng kề j ở trên' },
  markers: { first: '¹', second: '²', shared: '=', equal: '✓', miss: '✗' },
  rowMarkers: { current: 'i', above: 'j' },
  legend: {
    first: '¹ Khoá: nửa đầu',
    second: '² Khoá: nửa sau',
    shared: '= Tiền tố chung',
    equal: '✓ Kí tự bằng nhau',
    miss: '✗ Kí tự khác nhau',
  },
  rowLegend: 'Nhãn ở hàng: i là hậu tố đang xử lí, j là hàng kề ở trên nó.',
  stats: {
    k: 'Số kí tự mỗi hạng (k)',
    rounds: 'Số vòng sắp xếp',
    keyChecks: 'Số lần so khoá',
    comparisons: 'Số lần so sánh của Kasai',
    h: 'Giá trị h hiện tại',
    direct: 'Số kí tự phải đọc nếu sắp xếp trực tiếp',
    distinct: 'Số xâu con khác nhau',
    repeat: 'Đoạn lặp dài nhất',
  },
  repeatNone: 'không có',
  arraysTitle: 'Mảng hậu tố, theo từng hàng',
  lcpTitle: 'Mảng LCP, theo từng hàng',
  lcpEmpty: 'chưa tính',
  /** @param {SuffixFrame} f */
  describe(f) {
    const { s, k, i, j, h } = f;
    switch (f.kind) {
      case 'start':
        return 'Bắt đầu từ hạng của từng chữ cái: a = 0, b = 1, cứ thế tiếp tục. Như vậy mới chỉ sắp theo chữ cái đầu, và các hàng vẫn theo thứ tự trong văn bản.';
      case 'pairs':
        return `Mỗi hậu tố nhận một khoá gồm hai hạng: hạng của chính nó, và hạng ở vị trí cách đó ${k} kí tự, hoặc −1 nếu vượt quá cuối xâu. Hai hạng cộng lại phủ ${2 * k} kí tự.`;
      case 'sorted':
        return `Sắp xếp các hàng theo khoá. Giờ các hậu tố đã đúng thứ tự theo ${2 * k} kí tự đầu.`;
      case 'rerank':
        return `Đánh hạng mới: các khoá bằng nhau có cùng hạng. ${f.rank.length - new Set(f.rank).size === 0 ? 'Mọi hạng đều khác nhau.' : 'Vẫn còn hậu tố bằng hạng nhau.'}`;
      case 'double':
        return `Vẫn còn hạng trùng, nên nhân đôi k thành ${k}.`;
      case 'stop':
        return `Mọi hạng đều khác nhau sau ${f.rounds} vòng, nên mảng hậu tố đã xong.`;
      case 'kasai':
        return 'Thuật toán Kasai thăm các hậu tố theo thứ tự trong văn bản, không theo thứ tự hàng, và giữ một biến h chạy dần.';
      case 'skip':
        return `Hậu tố ${i} nằm ở hàng trên cùng, không có hàng kề ở trên. Đặt lại h = 0.`;
      case 'visit':
        return h > 0
          ? `Hậu tố ${i} có hàng kề ${j} ở trên. Bước trước đã chứng tỏ ${h} kí tự khớp sẵn, nên bắt đầu từ h = ${h}.`
          : `Hậu tố ${i} có hàng kề ${j} ở trên. So sánh từ h = 0.`;
      case 'compare':
        return f.equal
          ? `s[${i + h}] = s[${j + h}] = ${s[i + h]}, nên h tăng lên ${h + 1}.`
          : `s[${i + h}] = ${s[i + h]} khác s[${j + h}] = ${s[j + h]}, nên h giữ nguyên ${h}.`;
      case 'store':
        return `LCP = ${h} giữa hậu tố ${j} và hậu tố ${i}.`;
      case 'shrink':
        return `Hậu tố kế tiếp bắt đầu muộn hơn một kí tự, nên đoạn khớp mất tối đa một kí tự: h thành ${h}.`;
      case 'done':
        return `Xong: ${f.rounds} vòng sắp xếp và ${f.comparisons} lần so sánh của Kasai cho ${s.length} chữ cái.`;
    }
  },
  takeaways: [
    'Mảng hậu tố là vị trí bắt đầu của mọi hậu tố, theo thứ tự đã sắp xếp. Nó gồm n số nguyên, và có thể tìm một mẫu trong đó bằng tìm kiếm nhị phân với O(m log n).',
    'Nhân đôi tiền tố biến thứ tự theo k kí tự thành thứ tự theo 2k kí tự: phép so sánh chỉ cần một cặp hạng.',
    'Mảng LCP lưu tiền tố chung dài nhất của các hàng kề nhau. Hai hậu tố bất kì có phần chung bằng LCP nhỏ nhất nằm giữa hai hàng của chúng.',
    'Kasai thăm các hậu tố theo thứ tự trong văn bản vì khi đó h giảm tối đa một sau mỗi bước. Nhờ vậy số lần so kí tự không quá 2n.',
    'Thử “Chỉ một chữ cái” và “banana”, rồi so số vòng, và đọc đoạn lặp dài nhất cùng số xâu con khác nhau ở bước cuối.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Nhân đôi tiền tố',
      'O(n log² n)',
      'Tối đa khoảng log₂ n vòng, mỗi vòng là một lần sắp xếp so sánh n khoá. Radix sort (sắp xếp theo cơ số) các cặp hạng đưa chi phí xuống O(n log n).',
    ],
    [
      'LCP bằng Kasai',
      'O(n)',
      'h tăng sau mỗi lần so sánh khớp và giảm tối đa một cho mỗi hậu tố, nên có tối đa 2n lần so sánh.',
    ],
    [
      'Sắp xếp trực tiếp các hậu tố',
      'O(n² log n)',
      'Mỗi lần so sánh có thể phải đọc đến n kí tự khi văn bản lặp lại.',
    ],
    ['Tìm một mẫu', 'O(m log n)', 'Tìm kiếm nhị phân trên các hàng, mỗi lần so sánh đọc m kí tự.'],
    ['Bộ nhớ', 'O(n)', 'Mảng hậu tố, mảng hạng và mảng LCP mỗi mảng gồm n số nguyên.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'order',
      prompt: 'Xếp các hậu tố của banana theo thứ tự từ điển.',
      items: ['banana', 'anana', 'nana', 'ana', 'na', 'a'],
      answer: [5, 3, 1, 0, 4, 2],
      hints: ['Hậu tố nào là tiền tố của hậu tố khác thì đứng trước, nên a đứng trước ana.'],
      solution: 'a, ana, anana, banana, na, nana. Vậy mảng hậu tố là 5, 3, 1, 0, 4, 2.',
    },
    {
      type: 'number',
      prompt: 'LCP của hai hàng kề nhau ana và anana bằng bao nhiêu?',
      answer: 3,
      unit: 'kí tự',
      hints: ['So chúng theo từng kí tự cho đến khi khác nhau hoặc một xâu hết.'],
      solution: 'ana là tiền tố của anana, nên cả ba kí tự của nó đều là phần chung.',
    },
    {
      type: 'text',
      prompt: 'Xâu con dài nhất của banana xuất hiện ít nhất hai lần là gì?',
      accept: ['ana'],
      hints: ['Đó là tiền tố của hai hàng nằm quanh LCP lớn nhất.'],
      solution: 'LCP lớn nhất là 3, giữa ana và anana. Tiền tố chung của chúng là ana.',
    },
    {
      type: 'number',
      prompt: 'banana có bao nhiêu xâu con khác rỗng và khác nhau?',
      answer: 15,
      unit: 'xâu con',
      hints: ['Theo vị trí có n(n + 1) / 2 xâu con. Trừ đi tổng của mảng LCP.'],
      solution:
        'Sáu chữ cái cho 21 xâu con theo vị trí. Các LCP là 1, 3, 0, 0 và 2, tổng bằng 6, nên có 21 − 6 = 15 xâu con khác nhau.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Chỉ một chữ cái”, gồm 8 chữ cái. Kĩ thuật nhân đôi cần bao nhiêu vòng sắp xếp?',
      answer: 3,
      unit: 'vòng',
      hints: ['Mỗi vòng phủ gấp đôi số kí tự. Chạy đến bước cuối rồi đọc ô số liệu.'],
      solution:
        'Các vòng phủ 2, 4 và 8 kí tự. Sau 8 kí tự, mọi hậu tố đều khác nhau, vì mỗi hậu tố có một độ dài khác nhau.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Thuật toán Manacher, tìm xâu đối xứng dài nhất trong O(n) bằng mẹo soi gương quanh một tâm.',
};
