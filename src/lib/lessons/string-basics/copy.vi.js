/** @typedef {import('$lib/algo-engine/string-basics.js').StringFrame} StringFrame */
/** @typedef {import('$lib/algo-engine/string-basics.js').JoinMode} JoinMode */

/** Characters of a string, so lengths count code points. @param {string} s */
const len = (s) => Array.from(s).length;

/** @param {(string | null)[]} cells */
const text = (cells) => cells.filter((c) => c !== null).join('');

export const vi = {
  slug: 'string-basics',
  topic: 'arrays-strings',
  level: 'Cơ bản',
  title: 'Xâu cơ bản và thao tác trên xâu',
  intro:
    'Xâu là một mảng kí tự, và mỗi kí tự là một con số, gọi là điểm mã (code point), được lưu thành các byte theo một cách mã hoá như UTF-8 hay UTF-16. Trong Java, Python và JavaScript, xâu là bất biến: một thao tác trông như sửa xâu thực ra dựng một xâu mới. Vì thế s = s + p trong vòng lặp sao chép mọi thứ hết lần này đến lần khác, còn bộ dựng xâu (string builder) mới là công cụ đúng để nối nhiều mảnh.',
  summary:
    'Nối các mảnh bằng phép nối lặp lại hoặc bằng vùng đệm lớn dần của bộ dựng xâu, đếm từng lần sao chép kí tự, và xem các kí tự trở thành byte UTF-8 và đơn vị UTF-16 ra sao.',
  instruction:
    'Chọn một cách nối và một bộ mẫu, hoặc tự nhập các mảnh, rồi chạy từng bước. Để ý phép nối sao chép cả xâu sang xâu mới cho mỗi mảnh, còn bộ dựng xâu ghi vào các ô trống và chỉ sao chép khi gấp đôi. So sánh tổng công việc với thẻ của cách còn lại.',
  modeLegend: 'Cách nối',
  modes: /** @type {Record<JoinMode, string>} */ ({
    concat: 's = s + p',
    builder: 'Bộ dựng xâu',
  }),
  piecesLabel: 'Các mảnh (cách nhau bởi dấu cách)',
  capacityLabel: 'Sức chứa ban đầu',
  presetsLegend: 'Bộ mẫu',
  presets: {
    letters: 'Mười chữ cái',
    words: 'Một câu ngắn',
    vietnamese: 'Lời chào',
  },
  pieceErrors: {
    empty: 'Hãy nhập ít nhất một mảnh.',
    long: 'Mỗi mảnh có nhiều nhất 8 kí tự.',
    count: 'Hãy nhập nhiều nhất 12 mảnh.',
    total: 'Tổng số kí tự của các mảnh nhiều nhất là 32.',
  },
  capacityError: 'Sức chứa ban đầu phải là số nguyên từ 1 đến 16.',
  blocks: {
    s: 'Xâu s',
    t: 'Xâu mới t',
    buffer: 'Vùng đệm',
    newBuffer: 'Vùng đệm mới',
    result: 'Xâu kết quả',
  },
  /** @param {number} length @param {number} capacity */
  blockLine: (length, capacity) =>
    length === capacity ? `${length} kí tự` : `${length} kí tự trong ${capacity} ô`,
  emptyString: 's là xâu rỗng "": chưa cấp phát gì.',
  /** @param {string} name */
  blockAria: (name) => `${name}, chỉ số 0 trước`,
  spare: '·',
  markers: { read: '◦', written: '+' },
  /** @param {number} i @param {string | null} c @param {string} state */
  cellLabel: (i, c, state) =>
    `Chỉ số ${i}: ${c === null ? 'ô trống' : c === ' ' ? 'dấu cách' : c}${state ? `, ${state}` : ''}`,
  states: { read: 'được sao chép đi', written: 'vừa ghi' },
  legend: {
    stored: 'Kí tự',
    spare: 'Ô trống (đánh dấu ·)',
    read: '◦ Được sao chép đi',
    written: '+ Vừa ghi',
  },
  stats: {
    copies: 'Số kí tự cũ đã sao chép',
    writes: 'Số kí tự mới đã ghi',
    work: 'Tổng công việc',
    other: 'Cách còn lại',
    allocations: 'Số lần cấp phát',
    garbage: 'Số khối rác',
  },
  /** @param {JoinMode} mode */
  otherNote: (mode) =>
    `Tổng công việc là số lần sao chép cộng số lần ghi. Thẻ còn lại chạy ${mode === 'concat' ? 'bộ dựng xâu' : 's = s + p'} trên cùng các mảnh.`,
  piecesTitle: 'Các mảnh cần nối',
  piecesEmpty: 'chưa có',
  piecesHot: 'đang nối',
  inspectTitle: 'Kí tự và cách mã hoá',
  inspectLabel: 'Văn bản cần xem',
  inspectErrors: {
    empty: 'Hãy nhập ít nhất một kí tự.',
    long: 'Hãy nhập nhiều nhất 16 kí tự.',
  },
  inspectHead: ['Kí tự', 'Điểm mã', 'Byte UTF-8', 'Đơn vị UTF-16'],
  /** @param {string} c */
  showChar: (c) => (c === ' ' ? '(dấu cách)' : c),
  /** @param {number} chars @param {number} utf8 @param {number} utf16 */
  inspectSummary: (chars, utf8, utf16) =>
    `${chars} kí tự (điểm mã), ${utf8} byte UTF-8, ${utf16} đơn vị UTF-16. length của JavaScript và length() của Java đếm đơn vị UTF-16, nên chúng cho ra ${utf16}.`,
  inspectNote:
    'UTF-8 dùng 1 byte cho ASCII; 2 byte cho phần lớn chữ Latinh có dấu như ă hay ơ, và cho chữ Hy Lạp, Kirin, Ả Rập, Do Thái; 3 byte cho các chữ như ệ và cho chữ Hán, chữ Nhật, chữ Thái cùng hầu hết hệ chữ khác; 4 byte cho emoji. Một điểm mã lớn hơn U+FFFF cần hai đơn vị UTF-16, gọi là cặp thay thế (surrogate pair).',
  practiceTitle: 'Tự kiểm tra',
  /** @param {StringFrame} f */
  describe(f) {
    const p = f.piece >= 0 ? f.pieces[f.piece] : '';
    const pl = len(p);
    switch (f.kind) {
      case 'start':
        return f.mode === 'concat'
          ? `Nối ${f.pieces.length} mảnh bằng s = s + p. s bắt đầu là xâu rỗng, và xâu là bất biến: đã tạo ra thì không bao giờ đổi.`
          : `Nối ${f.pieces.length} mảnh bằng bộ dựng xâu. Vùng đệm của nó bắt đầu với ${f.capacity} ô trống, và bản thân vùng đệm thì sửa được.`;
      case 'allocate':
        return `Mảnh ${f.piece + 1}, “${p}”: s không thể lớn lên tại chỗ, nên cấp phát một xâu mới t gồm ${f.length} + ${pl} = ${f.length + pl} kí tự.`;
      case 'copy':
        if (f.mode === 'concat')
          return f.length === 0
            ? 's đang rỗng, nên chưa có gì để sao chép.'
            : `Sao chép cả ${f.length} kí tự của s sang t. Bản thân s vẫn giữ nguyên; chỉ t được ghi.`;
        return f.length === 0
          ? 'Vùng đệm vẫn rỗng, nên không có gì để sao chép.'
          : `Sao chép ${f.length} kí tự đang có trong vùng đệm sang, đúng một lần, rồi bỏ vùng đệm cũ.`;
      case 'append': {
        if (f.mode === 'concat')
          return `Ghi “${p}” vào sau chúng rồi cho s = t: ${pl} lần ghi và ${f.opCopies} lần sao chép cho mảnh này.${f.piece > 0 ? ' Xâu s cũ giờ thành rác.' : ''}`;
        return `Ghi “${p}” vào các ô trống: ${pl} lần ghi${f.opCopies > 0 ? ` sau ${f.opCopies} lần sao chép` : ', không sao chép'}. Đã dùng ${f.length}/${f.capacity} ô.`;
      }
      case 'grow':
        return `Mảnh ${f.piece + 1}, “${p}”, cần ${f.length + pl} ô nhưng vùng đệm chỉ có ${f.capacity}. Cấp phát vùng đệm mới gồm max(2 × ${f.capacity}, ${f.length + pl}) = ${f.next?.length ?? 0} ô.`;
      case 'build':
        return `toString: sao chép ${f.length} kí tự từ vùng đệm ra xâu kết quả, đúng một lần.`;
      case 'done': {
        const result = f.mode === 'concat' ? text(f.cells) : text(f.next ?? []);
        return `Xong: “${result}” sau ${f.copies} lần sao chép kí tự cũ và ${f.writes} lần ghi, tổng cộng ${f.copies + f.writes} bước.`;
      }
    }
  },
  takeaways: [
    'Mỗi kí tự là một con số, điểm mã của nó (A là U+0041, ệ là U+1EC7). Cách mã hoá lưu nó thành byte: UTF-8 dùng 1 đến 4 byte cho mỗi điểm mã, UTF-16 dùng 1 hoặc 2 đơn vị, mỗi đơn vị 2 byte. Độ dài trong JavaScript và Java đếm đơn vị UTF-16, không đếm kí tự.',
    'Xâu trong Java, Python và JavaScript là bất biến. Đọc s[i] là O(1) như mọi mảng, nhưng “sửa” một xâu luôn dựng ra xâu mới và bỏ xâu cũ thành rác.',
    's = s + p sao chép cả s sang một xâu mới. Nối k mảnh thì phần cũ bị sao chép đi sao chép lại: k mảnh một chữ cái tốn 0 + 1 + … + (k − 1) = k(k − 1)/2 lần sao chép, tức O(n²).',
    'Bộ dựng xâu (StringBuilder trong Java, một list rồi "".join trong Python, một mảng rồi join trong JavaScript) ghi vào phần sức chứa còn trống và gấp đôi khi đầy: mỗi kí tự được ghi một lần, số lần sao chép khi lớn lên dưới 2n, và một lần sao chép cuối tạo ra xâu. Tổng cộng O(n).',
    'Thử bộ mẫu “Mười chữ cái” với cả hai cách: 45 lần sao chép so với 22. Rồi đặt sức chứa ban đầu là 16 và xem bộ dựng xâu không phải lớn lên lần nào.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Đọc s[i]', 'O(1)', 'Các kí tự (đơn vị mã) nằm sát nhau, như trong một mảng.'],
    ['Một lần s + p', 'O(len(s) + len(p))', 'Cả hai xâu được sao chép sang một xâu mới.'],
    [
      'Nối k mảnh bằng s = s + p',
      'O(k·n)',
      'Bước i sao chép mọi thứ đã nối; n kí tự đơn lẻ cho O(n²).',
    ],
    [
      'Nối bằng bộ dựng xâu',
      'O(n)',
      'n lần ghi, dưới 2n lần sao chép khi gấp đôi, n lần cho lần sao chép cuối.',
    ],
    ['Bộ nhớ của bộ dựng xâu', 'O(n)', 'Vùng đệm có nhiều nhất khoảng 2n ô, cộng xâu kết quả.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Em nối sáu mảnh “ab”, “cd”, “ef”, “gh”, “ij”, “kl” bằng s = s + p. Tổng cộng có bao nhiêu kí tự cũ được sao chép?',
      answer: 30,
      unit: 'lần sao chép',
      hints: [
        'Trước mỗi mảnh, s có lần lượt 0, 2, 4, 6, 8 rồi 10 kí tự.',
        'Nhập sáu mảnh vào phần tương tác và xem “Số kí tự cũ đã sao chép”.',
      ],
      solution:
        'Mỗi bước đều sao chép cả s trước: 0 + 2 + 4 + 6 + 8 + 10 = 30 lần sao chép, chưa kể 12 lần ghi chính các mảnh.',
    },
    {
      type: 'number',
      prompt:
        'Một bộ dựng xâu bắt đầu với sức chứa 4 và nối mười mảnh một chữ cái. Nó sao chép bao nhiêu kí tự cũ, tính cả lần toString cuối?',
      answer: 22,
      unit: 'lần sao chép',
      hints: [
        'Nó lớn lên khi chữ cái thứ 5 và thứ 9 không vừa.',
        'Mỗi lần lớn lên sao chép những gì đang có trong vùng đệm: 4, rồi 8. Lần sao chép cuối chuyển cả 10.',
      ],
      solution:
        'Sức chứa 4 → 8 sao chép 4 chữ cái, 8 → 16 sao chép 8, và toString sao chép 10: 4 + 8 + 10 = 22. Phép nối thì sao chép 0 + 1 + … + 9 = 45.',
    },
    {
      type: 'number',
      prompt: '“Việt” chiếm bao nhiêu byte trong UTF-8? (ệ là U+1EC7.)',
      answer: 6,
      unit: 'byte',
      hints: [
        'V, i và t là ASCII. Một điểm mã từ U+0800 đến U+FFFF chiếm 3 byte.',
        'Nhập Việt vào ô xem kí tự.',
      ],
      solution: 'V, i và t mỗi chữ 1 byte, còn ệ chiếm 3: 1 + 1 + 3 + 1 = 6 byte cho 4 kí tự.',
    },
    {
      type: 'number',
      prompt: '"😀".length trong JavaScript cho ra bao nhiêu? (😀 là U+1F600.)',
      answer: 2,
      hints: ['Xâu JavaScript là dãy các đơn vị mã UTF-16.'],
      solution:
        'U+1F600 lớn hơn U+FFFF, nên UTF-16 lưu nó thành một cặp thay thế gồm hai đơn vị, và length đếm ra 2, dù đó chỉ là một kí tự.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao s = s + p trong vòng lặp qua n mảnh một chữ cái tốn thời gian O(n²)?',
      options: [
        'Xâu là bất biến, nên mỗi bước sao chép cả xâu đã dựng sang một xâu mới',
        'Mỗi kí tự chiếm đến 4 byte trong UTF-8',
        'Đọc s[i] tốn O(n)',
        'Vòng lặp chạy n² lần',
      ],
      answer: 0,
      hints: ['Xem các bước sao chép làm gì với s trong phần tương tác.'],
      solution:
        'Vòng lặp chỉ chạy n lần, nhưng bước i sao chép i kí tự đã nối: 0 + 1 + … + (n − 1) = n(n − 1)/2 lần sao chép. Bộ dựng xâu tránh điều đó bằng cách ghi vào phần sức chứa còn trống.',
    },
  ],
  nextTeaser:
    'Đến lúc dùng hết các kĩ thuật của chủ đề. Bài sau, Luyện tập: bài toán về mảng và xâu, để em chọn kĩ thuật cho từng bài.',
};
