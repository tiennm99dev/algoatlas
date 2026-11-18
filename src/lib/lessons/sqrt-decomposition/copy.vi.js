/** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').BlockFrame} BlockFrame */
/** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').BlockOp} BlockOp */
/** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').MoFrame} MoFrame */
/** @typedef {import('$lib/algo-engine/sqrt-decomposition.js').MoQuery} MoQuery */

/** A signed number with a Unicode minus. @param {number} x */
const show = (x) => (x < 0 ? `−${-x}` : String(x));

export const vi = {
  slug: 'sqrt-decomposition',
  topic: 'range-queries',
  level: 'Nâng cao',
  title: 'Chia căn và thuật toán Mo',
  intro:
    'Chia căn (sqrt decomposition) cắt mảng thành các khối khoảng √n ô và lưu một đáp án cho mỗi khối, nên một truy vấn đoạn chỉ đọc vài ô lẻ và vài khối nguyên: O(√n) mà gần như không cần viết bao nhiêu mã. Thuật toán Mo dùng chính các khối đó theo cách khác. Khi đã biết trước mọi truy vấn, nó sắp xếp lại thứ tự để một cửa sổ trượt (sliding window) trả lời tất cả mà chỉ phải dịch chuyển ít.',
  summary:
    'Trả lời truy vấn đoạn qua các khối khoảng √n ô, rồi sắp xếp lại các truy vấn ngoại tuyến bằng thuật toán Mo để cửa sổ trượt dịch chuyển ít nhất.',
  instruction:
    'Ở chế độ Khối, bấm hai ô (hoặc gõ l và r) để chạy một truy vấn, và xem nó đọc các ô lẻ ở hai đầu và các khối nguyên ở giữa. Đổi kích thước khối và xem trường hợp xấu nhất tăng lên khi s càng xa √n về cả hai phía. Ở chế độ Thuật toán Mo, chạy từng bước cửa sổ và so số bước dịch khi đã sắp xếp với khi giữ thứ tự đã gõ.',
  modeLabel: 'Kĩ thuật',
  modes: { blocks: 'Khối', mo: 'Thuật toán Mo' },
  valuesLabel: 'Giá trị',
  blockLabel: 'Kích thước khối s',
  rootButton: 'Dùng ⌊√n⌋',
  lLabel: 'Từ l',
  rLabel: 'Đến r',
  queryButton: 'Truy vấn tổng',
  indexLabel: 'Chỉ số i',
  valueLabel: 'Giá trị mới',
  setButton: 'Gán a[i]',
  undo: 'Hoàn tác',
  reset: 'Làm lại',
  queriesLabel: 'Các truy vấn (l r, …)',
  presetLabel: 'Bộ truy vấn',
  presetPlaceholder: 'Nạp một bộ truy vấn…',
  presets: { zigzag: 'Nhảy qua lại trái phải', nested: 'Các đoạn lồng nhau' },
  valueErrors: {
    format: () => 'Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 3, −1, 4.',
    range: () => 'Mỗi giá trị phải nằm trong khoảng từ −99 đến 99.',
    /** @param {number} max */
    count: (max) => `Hãy gõ từ 1 đến ${max} giá trị.`,
  },
  queryErrors: {
    format: () =>
      'Hãy viết mỗi truy vấn là hai số nguyên “l r”, các truy vấn cách nhau bằng dấu phẩy.',
    /** @param {number} n */
    range: (n) => `Mỗi truy vấn cần 0 ≤ l ≤ r ≤ ${n - 1}.`,
    count: () => 'Hãy dùng từ 1 đến 6 truy vấn.',
  },
  /** @param {number} n */
  blockError: (n) => `Kích thước khối phải là số nguyên từ 1 đến ${n}.`,
  /** @param {number} n */
  rangeError: (n) => `l và r phải là số nguyên với 0 ≤ l ≤ r ≤ ${n - 1}.`,
  /** @param {number} n */
  indexError: (n) => `Chỉ số phải là số nguyên từ 0 đến ${n - 1}.`,
  valueError: 'Giá trị mới phải là số nguyên từ −99 đến 99.',
  logFull: 'Nhật kí đã đầy (8 thao tác). Hãy hoàn tác hoặc làm lại để tiếp tục.',
  pickHint:
    'Bấm một ô để bắt đầu đoạn truy vấn, rồi bấm ô khác để chạy truy vấn. Phím Enter cũng dùng được.',
  /** @param {number} i */
  pickFirst: (i) => `Đoạn bắt đầu ở ${i}. Hãy chọn ô kết thúc đoạn.`,
  arrayTitle: 'Mảng a, chia thành các khối',
  /** @param {number} s */
  arrayAria: (s) => `Mảng a, chỉ số 0 đứng đầu, chia thành các khối ${s} ô.`,
  sumsTitle: 'Tổng các khối: mỗi khối lưu một tổng',
  sumsAria: 'Tổng các khối, khối 0 đứng đầu',
  /** @param {number} b */
  blockName: (b) => `B${b}`,
  /** @param {number} i @param {number} v @param {number} b */
  cellLabel: (i, v, b) => `a[${i}] = ${show(v)}, thuộc khối ${b}`,
  /** @param {number} b @param {number} v */
  sumLabel: (b, v) => `Tổng khối ${b} = ${show(v)}`,
  /** @param {number} n @param {number} s @param {number} worst */
  tradeOff: (n, s, worst) =>
    `Với n = ${n} và s = ${s}, đoạn tốn kém nhất cần ${worst} lần đọc, tính cả ô lẻ và khối nguyên.`,
  show,
  /** @param {BlockOp} op */
  opChip: (op) => (op.type === 'query' ? `sum(${op.l}, ${op.r})` : `set(${op.i}, ${show(op.x)})`),
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'đang chạy',
  markers: {
    write: '✎',
    read: '?',
    cell: '·',
    block: '✓',
    add: '+',
    remove: '−',
    left: 'L',
    right: 'R',
  },
  legend: {
    range: 'Thuộc đoạn truy vấn, chưa đọc',
    read: '? Đang đọc ô này',
    cell: '· Đọc như một ô lẻ',
    block: '✓ Đã tính qua tổng khối đã lưu',
    write: '✎ Vừa ghi',
    window: 'Nằm trong cửa sổ',
    added: '+ Vừa thêm',
    removed: '− Vừa bỏ',
  },
  stats: {
    reads: 'Số lần đọc (truy vấn này)',
    scan: 'Số lần đọc nếu duyệt',
    total: 'Tổng hiện tại',
    worst: 'Số lần đọc xấu nhất với s này',
    moves: 'Số bước dịch đến giờ',
    distinct: 'Số giá trị phân biệt trong cửa sổ',
    sortedMoves: 'Tổng số bước dịch, đã sắp xếp',
    inputMoves: 'Tổng số bước dịch, theo thứ tự đã gõ',
  },
  pending: '—',
  /** @param {number} s */
  moArrayTitle: (s) => `Mảng a, cửa sổ, và các khối s = ⌊√n⌋ = ${s}`,
  /** @param {number} l @param {number} r */
  moArrayAria: (l, r) =>
    r < l ? 'Mảng a. Cửa sổ đang rỗng.' : `Mảng a. Cửa sổ phủ các ô từ ${l} đến ${r}.`,
  /** @param {number} k */
  targetWindow: (k) => `Q${k + 1}`,
  queriesTitle: 'Các truy vấn, theo thứ tự chạy',
  countsTitle: 'Các giá trị trong cửa sổ, giá trị × số lần',
  /** @param {number} k @param {MoQuery} q @param {number | null} answer @param {number} s */
  queryChip: (k, q, answer, s) =>
    `Q${k + 1} [${q.l}, ${q.r}] B${Math.floor(q.l / s)}${answer === null ? '' : ` = ${answer}`}`,
  /** @param {number} v @param {number} c */
  countChip: (v, c) => `${show(v)} × ${c}`,
  practiceTitle: 'Tự kiểm tra',
  /** @param {BlockFrame} f */
  describeBlocks(f) {
    const s = f.blockSize;
    const op = f.op;
    switch (f.kind) {
      case 'start':
        return `Chia ${f.items.length} giá trị thành các khối ${s} ô và cộng từng khối.`;
      case 'build':
        return `a[${f.at}] = ${show(f.items[f.at])} thuộc khối ${f.block}, tổng của khối giờ là ${show(f.sums[f.block])}.`;
      case 'query-start':
        return `Tổng của a[${op?.type === 'query' ? op.l : 0}..${op?.type === 'query' ? op.r : 0}]: bắt đầu từ đầu trái với total = 0.`;
      case 'read-cell':
        return `Ô ${f.at} không dùng được cả khối ở đây, nên ta đọc nó: ${show(f.items[f.at])}. Tổng hiện tại = ${show(f.total)}.`;
      case 'read-block':
        return `Khối ${f.block} nằm trọn trong đoạn, nên ta đọc tổng đã lưu ${show(f.sums[f.block])} thay vì ${Math.min(s, f.items.length - f.block * s)} ô. Tổng hiện tại = ${show(f.total)}.`;
      case 'answer':
        return `Tổng bằng ${show(/** @type {number} */ (f.result))}, sau ${f.reads} lần đọc thay vì ${f.scan}.`;
      case 'set':
        return `a[${f.at}] thành ${show(f.items[f.at])}, và tổng của khối ${f.block} đổi thành ${show(f.sums[f.block])}. Chỉ hai lần ghi, dù mảng lớn đến đâu.`;
      case 'done':
        return `Xong. Hãy thử kích thước khối khác: với kích thước này, trường hợp xấu nhất cần ${f.worst} lần đọc.`;
    }
  },
  /** @param {MoFrame} f */
  describeMo(f) {
    const k = f.current >= 0 ? f.order[f.current] : -1;
    const q = k >= 0 ? f.queries[k] : null;
    switch (f.kind) {
      case 'start':
        return `${f.queries.length} truy vấn trên ${f.items.length} giá trị, đã biết hết từ trước. Cửa sổ ban đầu rỗng.`;
      case 'sort':
        return `Sắp xếp theo khối của l, rồi theo r. Giờ đầu trái chỉ ở trong một khối tại mỗi thời điểm, còn đầu phải chỉ tăng dần trong khối đó.`;
      case 'query-start':
        return `Tiếp theo là Q${k + 1}, [${q?.l}, ${q?.r}]. Trượt cửa sổ tới đó từng ô một.`;
      case 'add-left':
      case 'add-right':
        return `Thêm a[${f.at}] = ${show(f.items[f.at])}. Số giá trị phân biệt trong cửa sổ: ${f.distinct}.`;
      case 'remove-left':
      case 'remove-right':
        return `Bỏ a[${f.at}] = ${show(f.items[f.at])}. Số giá trị phân biệt trong cửa sổ: ${f.distinct}.`;
      case 'answer':
        return `Cửa sổ khớp với Q${k + 1}: nó chứa ${f.distinct} giá trị phân biệt. Kết quả được ghi vào đúng ô của Q${k + 1}.`;
      case 'done':
        return `Xong: ${f.moves} bước dịch theo thứ tự đã sắp, so với ${f.inputMoves} theo thứ tự đã gõ. Đáp án: ${f.answers.join(', ')}, theo thứ tự đã gõ.`;
    }
  },
  takeaways: [
    'Một truy vấn đọc tối đa 2(s − 1) ô lẻ và ⌈n / s⌉ khối nguyên. Cân bằng hai phần này cho s ≈ √n và O(√n) mỗi truy vấn. Cập nhật điểm đổi một ô và một tổng khối.',
    'Cấu trúc này dễ biến đổi: mỗi khối có thể lưu tổng, giá trị nhỏ nhất, hoặc một bản sao đã sắp xếp. Nó chậm hơn O(log n) của segment tree (cây phân đoạn), nhưng xử lý được những câu hỏi không có phép gộp đơn giản.',
    'Thuật toán Mo là ngoại tuyến: nó cần có mọi truy vấn trước, rồi sắp xếp theo (⌊l / s⌋, r). Trong một khối, đầu phải chỉ dịch sang phải, còn đầu trái dịch tối đa s ô mỗi truy vấn.',
    'Với thao tác thêm và bỏ O(1) và s ≈ √n, tổng công việc của cửa sổ là O((n + q)·√n). Đáp án được trả về đúng vị trí ban đầu của từng truy vấn, nên người dùng không thấy việc sắp xếp lại.',
    'Thử kích thước khối bằng 1 rồi bằng n với 16 giá trị: trường hợp xấu nhất là 16 rồi 15 lần đọc, so với 8 khi s = 4. (s = 3 chỉ cần 7: các hằng số nhỏ làm lệch giá trị tốt nhất chính xác, nhưng không đổi dạng O(√n).) Ở thuật toán Mo, so hai số bước dịch với bộ “Nhảy qua lại trái phải” và bộ “Các đoạn lồng nhau”.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Dựng các khối', 'O(n)', 'Mỗi giá trị được cộng vào một tổng khối.'],
    ['Truy vấn đoạn', 'O(√n)', 'Tối đa 2(s − 1) ô lẻ cộng ⌈n / s⌉ khối, với s ≈ √n.'],
    ['Cập nhật điểm', 'O(1)', 'Một ô và một tổng khối thay đổi.'],
    ['Mo: sắp xếp', 'O(q log q)', 'Một thuật toán sắp xếp so sánh theo (⌊l / s⌋, r).'],
    [
      'Mo: mọi bước dịch',
      'O((n + q)·√n)',
      'Trong một khối, đầu trái dịch tối đa s ô mỗi truy vấn, còn đầu phải dịch tối đa n ô mỗi khối, qua khoảng √n khối.',
    ],
    ['Bộ nhớ', 'O(n)', 'Mảng và √n tổng khối, hoặc mảng và bảng đếm giá trị với thuật toán Mo.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Với n = 100, quy tắc s ≈ √n cho kích thước khối bằng bao nhiêu?',
      answer: 10,
      hints: ['Số ô lẻ tăng theo s, còn số khối nguyên tăng theo n / s. Hai số gặp nhau gần √n.'],
      solution: '√100 = 10, cho 10 khối mỗi khối 10 ô: tối đa 18 ô lẻ và 10 tổng đã lưu.',
    },
    {
      type: 'number',
      prompt:
        'a = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3], s = 4. Truy vấn trên a[2..13] đọc bao nhiêu lần?',
      unit: 'lần',
      answer: 6,
      hints: [
        'Các khối là [0, 3], [4, 7], [8, 11] và [12, 15].',
        'Ô lẻ 2 và 3, khối nguyên B1 và B2, ô lẻ 12 và 13.',
      ],
      solution: '2 ô lẻ + 2 khối + 2 ô lẻ = 6 lần đọc, so với 12 nếu duyệt.',
    },
    {
      type: 'number',
      prompt: 'Cùng truy vấn đó. Tổng của a[2..13] bằng bao nhiêu?',
      answer: 64,
      hints: ['B1 lưu 22 và B2 lưu 21.', 'Cộng thêm các ô lẻ 4 và 1, 9 và 7.'],
      solution: '4 + 1 + 22 + 21 + 9 + 7 = 64.',
    },
    {
      type: 'number',
      prompt: 'Cùng mảng đó. Sau khi gán a[5] = 0, tổng của khối 1 bằng bao nhiêu?',
      answer: 13,
      hints: ['Khối 1 đang lưu 22, và a[5] bằng 9.'],
      solution: 'Phép cập nhật cộng x − a[i] = 0 − 9 vào tổng khối: 22 − 9 = 13.',
    },
    {
      type: 'number',
      prompt: 'Với n = 16 và s = 4, một đoạn bất kì cần nhiều nhất bao nhiêu lần đọc?',
      unit: 'lần',
      answer: 8,
      hints: ['Thử một đoạn bắt đầu ngay sau đầu một khối và kết thúc ngay trước cuối một khối.'],
      solution:
        'Đoạn [1, 14] đọc các ô lẻ 1, 2, 3, rồi B1 và B2, rồi các ô lẻ 12, 13, 14: 8 lần đọc. Thẻ Số lần đọc xấu nhất trên hình tương tác cũng cho kết quả này.',
    },
    {
      type: 'order',
      prompt: 'Với s = 4, sắp xếp các truy vấn này theo thứ tự thuật toán Mo chạy chúng.',
      items: ['[9, 10]', '[1, 7]', '[2, 3]', '[5, 6]'],
      answer: [2, 1, 3, 0],
      hints: [
        'Đầu trái của chúng lần lượt thuộc khối 2, 0, 0 và 1.',
        'Trong khối 0, truy vấn có r nhỏ hơn chạy trước.',
      ],
      solution:
        'Khối 0 đi trước, sắp theo r: [2, 3], rồi [1, 7]. Khối 1 có [5, 6], và khối 2 có [9, 10].',
    },
    {
      type: 'choice',
      prompt: 'Khi nào không thể dùng trực tiếp thuật toán Mo?',
      options: [
        'Khi phải trả lời mỗi truy vấn trước khi biết truy vấn tiếp theo',
        'Khi mảng có giá trị trùng nhau',
        'Khi câu hỏi là đếm số giá trị phân biệt',
        'Khi số truy vấn nhiều hơn số ô',
      ],
      answer: 0,
      hints: ['Bước đầu tiên cần có sẵn những gì trong tay?'],
      solution:
        'Thuật toán Mo sắp xếp mọi truy vấn trước, nên nó là ngoại tuyến. Một truy vấn chỉ đến sau khi có đáp án của truy vấn trước thì không thể sắp xếp lại.',
    },
    {
      type: 'text',
      prompt:
        'Với s ≈ √n, tổng chi phí các bước dịch của cửa sổ là bao nhiêu, viết bằng kí hiệu O?',
      accept: [
        'O((n+q)√n)',
        'O((n + q)·√n)',
        'O((n+q)sqrt(n))',
        'O((n+q)*sqrt(n))',
        'O((n + q) sqrt n)',
        'O((n+q)*√n)',
        'O((n+q)·sqrt(n))',
        'O((n+q)·sqrt n)',
        'O(√n(n+q))',
        'O(sqrt(n)(n+q))',
        'O(n√n+q√n)',
        '(n+q)√n',
        '(n+q)sqrt(n)',
        '(n+q) sqrt n',
      ],
      hints: [
        'Đầu trái dịch khoảng √n ô mỗi truy vấn. Đầu phải quét n ô mỗi khối, qua khoảng √n khối.',
      ],
      solution: 'Đầu trái: q·√n. Đầu phải: n·√n. Vậy tổng là O((n + q)·√n).',
    },
  ],
  nextTeaser:
    'Bài tiếp theo: Luyện tập: bài toán truy vấn đoạn, nơi em chọn cấu trúc phù hợp cho từng bài.',
};
