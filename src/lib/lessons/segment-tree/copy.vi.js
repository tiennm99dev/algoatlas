/** @typedef {import('$lib/algo-engine/segment-tree.js').SegFrame} SegFrame */
/** @typedef {import('$lib/algo-engine/segment-tree.js').SegMerge} SegMerge */
/** @typedef {import('$lib/algo-engine/segment-tree.js').SegOp} SegOp */
/** @typedef {import('$lib/algo-engine/segment-tree.js').SegSpan} SegSpan */

/** A value with a Unicode minus, and the identities of min and max as infinities. @param {number} x */
const show = (x) => {
  if (x === Infinity) return '+∞';
  if (x === -Infinity) return '−∞';
  return x < 0 ? `−${-x}` : String(x);
};

/** @param {number} lo @param {number} hi */
const range = (lo, hi) => `[${lo}, ${hi}]`;

export const vi = {
  slug: 'segment-tree',
  topic: 'range-queries',
  level: 'Trung bình',
  title: 'Cây phân đoạn',
  intro:
    'Cây phân đoạn (segment tree) là một cây nhị phân của các đoạn: gốc phủ cả mảng, mỗi nút chia đôi đoạn của nó, và mỗi lá là một giá trị. Mỗi nút lưu kết quả gộp trên đoạn của nó. Đoạn truy vấn nào cũng tách được thành tối đa hai nút ở mỗi tầng, nên cả truy vấn đoạn lẫn cập nhật điểm đều tốn O(log n).',
  summary:
    'Kéo chọn một đoạn và xem cây phân đoạn trả lời nó từ vài nút đã lưu, với hàm gộp bất kì, rồi cập nhật một giá trị dọc theo một đường đi.',
  instruction:
    'Kéo qua mảng để chọn một đoạn: các nút trả lời đoạn đó sáng lên kèm dấu tích. Dùng Chạy lại truy vấn để đi từng bước qua phép đệ quy. Đổi phép gộp sang Min hoặc Max, hoặc gán lại một giá trị và xem chỉ một đường đi được tính lại.',
  mergeLegend: 'Phép gộp',
  merges: /** @type {Record<SegMerge, string>} */ ({ sum: 'Tổng', min: 'Min', max: 'Max' }),
  valuesLabel: 'Giá trị',
  indexLabel: 'Chỉ số i',
  valueLabel: 'Giá trị mới',
  setButton: 'Gán a[i]',
  undo: 'Hoàn tác',
  reset: 'Làm lại',
  replay: 'Chạy lại truy vấn',
  valueErrors: {
    format: 'Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 3, −1, 4.',
    range: 'Mỗi giá trị phải nằm trong khoảng từ −99 đến 99.',
    count: 'Hãy gõ từ 1 đến 12 giá trị.',
  },
  /** @param {number} n */
  indexError: (n) => `Chỉ số phải là số nguyên từ 0 đến ${n - 1}.`,
  valueError: 'Giá trị mới phải là số nguyên từ −99 đến 99.',
  logFull: 'Nhật kí đã đầy (8 thao tác). Hãy hoàn tác hoặc làm lại để tiếp tục.',
  /** @param {number} i */
  pickFirst: (i) => `Đoạn bắt đầu ở ${i}. Hãy chọn ô kết thúc đoạn.`,
  dragTitle: 'Mảng a: kéo để chọn đoạn truy vấn',
  dragAria: 'Mảng a. Kéo qua các ô, hoặc nhấn Enter trên hai ô, để chọn một đoạn.',
  dragHint:
    'Bàn phím: phím mũi tên để di chuyển, Enter trên một ô để bắt đầu đoạn và trên ô khác để kết thúc.',
  treeScroller: 'Hình vẽ cây, cuộn ngang được',
  treeTitle: 'Cây phân đoạn: mỗi nút ghi giá trị và đoạn của nó',
  /** @param {SegFrame} f */
  treeAria: (f) =>
    `Cây phân đoạn trên ${f.items.length} giá trị với phép ${f.merge}. Gốc ${f.tree[1] === null ? 'chưa lưu gì' : `lưu ${show(f.tree[1])}`}.`,
  unbuilt: '·',
  show,
  /** @param {number} i @param {number} v */
  cellLabel: (i, v) => `a[${i}] = ${show(v)}`,
  /** @param {number} lo @param {number} hi @param {string} value @param {string} state */
  nodeLabel: (lo, hi, value, state) =>
    `Nút trên ${range(lo, hi)}, giá trị ${value}${state ? `, ${state}` : ''}`,
  /** @param {SegOp} op */
  opChip: (op) => (op.type === 'query' ? `query(${op.l}, ${op.r})` : `set(${op.i}, ${show(op.x)})`),
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'đang chạy',
  markers: { cover: '✓', split: '↓', outside: '✕', write: '✎', merge: 'm' },
  states: {
    cover: 'nằm trọn trong đoạn, trả lời truy vấn',
    split: 'nằm một phần trong đoạn, phải tách',
    outside: 'nằm ngoài đoạn',
    written: 'vừa ghi giá trị',
    merged: 'đang gộp hai con',
  },
  legend: {
    cover: '✓ Nằm trọn trong đoạn: dùng giá trị của nút',
    split: '↓ Nằm một phần: tách ra',
    outside: '✕ Nằm ngoài: phần tử trung hoà',
    write: '✎ Vừa ghi giá trị',
    merge: 'm Đang gộp hai con',
  },
  stats: {
    visits: 'Số nút đã thăm (thao tác này)',
    merges: 'Số lần gộp (thao tác này)',
    naive: 'Số lần đọc nếu duyệt cả đoạn',
    result: 'Đáp án truy vấn',
  },
  pending: '—',
  /** @param {SegSpan[]} spans @param {(number|null)[]} tree @param {SegMerge} merge */
  coverLine: (spans, tree, merge) =>
    `Phủ: ${spans.map((s) => `${range(s.lo, s.hi)} = ${show(/** @type {number} */ (tree[s.v]))}`).join(', ')}. ${vi.merges[merge]} của ${spans.length} nút.`,
  practiceTitle: 'Tự kiểm tra',
  /** @param {SegFrame} f */
  describe(f) {
    const span = f.spans.find((s) => s.v === f.node);
    const here = span ? range(span.lo, span.hi) : '';
    const op = f.op;
    const asked = op?.type === 'query' ? range(op.l, op.r) : '';
    switch (f.kind) {
      case 'start':
        return `Dựng từ dưới lên trên ${f.items.length} giá trị với phép ${f.merge}: lá chép giá trị từ mảng, và mỗi nút cha gộp hai con của nó.`;
      case 'build-leaf':
        return `Lá ${here} chép giá trị ${show(/** @type {number} */ (f.value))}.`;
      case 'build-pull':
        return `Nút ${here} = ${f.merge}(con trái, con phải) = ${show(/** @type {number} */ (f.value))}.`;
      case 'split':
        return `Nút ${here} chỉ nằm một phần trong ${asked}, nên không dùng được giá trị đã lưu. Ta tách nó ra.`;
      case 'outside':
        return `Nút ${here} nằm ngoài ${asked}: trả về phần tử trung hoà ${show(/** @type {number} */ (f.value))}, không làm thay đổi kết quả.`;
      case 'cover':
        return `Nút ${here} nằm trọn trong ${asked}: trả về giá trị ${show(/** @type {number} */ (f.value))} mà không cần đi sâu hơn.`;
      case 'return':
        return `Nút ${here} gộp các kết quả mà hai con trả về: ${show(/** @type {number} */ (f.value))}.`;
      case 'answer':
        return `query${asked} = ${show(/** @type {number} */ (f.result))}, từ ${f.covered.length} nút phủ và ${f.visits} lần thăm.`;
      case 'descend':
        return `Chỉ số ${op?.type === 'set' ? op.i : 0} nằm trong ${here}. Đi xuống con có đoạn chứa chỉ số đó.`;
      case 'write':
        return `Lá ${here} nhận giá trị mới ${show(/** @type {number} */ (f.value))}.`;
      case 'pull':
        return `Đi ngược lên: nút ${here} gộp lại hai con và giờ lưu ${show(/** @type {number} */ (f.value))}. Các nhánh khác giữ nguyên giá trị.`;
      case 'done':
        return `Xong: đã chạy hết các thao tác. Gốc lưu ${show(/** @type {number} */ (f.tree[1]))}.`;
    }
  },
  takeaways: [
    'Mỗi nút lưu kết quả gộp trên đoạn của nó, và mỗi lần chia tại mid = ⌊(lo + hi) / 2⌋. Với n giá trị, cây có 2n − 1 nút và việc dựng cần n − 1 lần gộp.',
    'Một truy vấn gặp ba trường hợp: nằm ngoài đoạn (trả về phần tử trung hoà), nằm trọn trong đoạn (trả về giá trị đã lưu và dừng), hoặc nằm một phần (tách ra rồi gộp).',
    'Các nút nằm trọn trong đoạn tạo thành phần phủ của đoạn: tối đa hai nút mỗi tầng, tức khoảng 2 log₂ n nút. Chỉ hai đường đi ở biên là đi sâu, nên truy vấn tốn O(log n).',
    'Phép gộp có thể là bất kì hàm kết hợp nào có phần tử trung hoà: tổng với 0, min với +∞, max với −∞, ƯCLN với 0. Thứ tự hai con được giữ nguyên, nên phép gộp không cần giao hoán.',
    'Thử kéo cả mảng: chỉ gốc được thăm. Rồi kéo từ ô 1 đến ô áp chót, dạng đoạn tốn kém nhất, và so số lần thăm với số lần đọc nếu duyệt cả đoạn.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Dựng cây', 'O(n)', '2n − 1 nút, mỗi nút trong một lần gộp tốn thời gian hằng số.'],
    ['Truy vấn đoạn', 'O(log n)', 'Mỗi tầng thăm tối đa bốn nút, trong một cây cao khoảng log₂ n.'],
    [
      'Cập nhật điểm',
      'O(log n)',
      'Chỉ một đường đi từ gốc xuống lá được tính lại; các nút khác không chứa chỉ số đó.',
    ],
    ['Bộ nhớ', 'O(n)', '2n − 1 nút; dạng mảng dành sẵn 4n ô để vừa với mọi n.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Cây phân đoạn trên 8 giá trị có bao nhiêu nút?',
      unit: 'nút',
      answer: 15,
      hints: ['Có 8 lá. Mỗi nút trong gộp hai con.'],
      solution: '8 lá + 7 nút trong = 2n − 1 = 15.',
    },
    {
      type: 'number',
      prompt: 'Với a = [2, 5, 1, 4, 9, 3, 7, 6] và phép Tổng, nút trên [4, 7] lưu giá trị nào?',
      answer: 25,
      hints: ['Nút lưu tổng của a[4], a[5], a[6] và a[7].'],
      solution: '9 + 3 + 7 + 6 = 25.',
    },
    {
      type: 'number',
      prompt: 'Cùng mảng đó. Phần phủ của truy vấn [1, 6] gồm bao nhiêu nút?',
      unit: 'nút',
      answer: 4,
      hints: [
        'Một nút chỉ được dùng khi nó nằm trọn trong [1, 6] còn nút cha thì không.',
        'Xem các nút [1], [2, 3], [4, 5] và [6].',
      ],
      solution:
        'Phần phủ là [1], [2, 3], [4, 5] và [6]: bốn nút. Tổng của chúng là 5 + 5 + 12 + 7 = 29. Kéo chọn đoạn này trên hình tương tác để kiểm tra.',
    },
    {
      type: 'number',
      prompt: 'Cùng mảng đó, giờ dùng phép Min. Truy vấn [1, 6] trả về bao nhiêu?',
      answer: 1,
      hints: ['Cây được dựng lại với phép gộp mới. Đoạn chứa 5, 1, 4, 9, 3, 7.'],
      solution: 'Các nút phủ lưu 5, 1, 3 và 7, nhỏ nhất là 1.',
    },
    {
      type: 'number',
      prompt:
        'Cùng mảng đó với phép Tổng. Gán a[4] = 0 thì phải tính lại bao nhiêu nút, tính cả lá?',
      unit: 'nút',
      answer: 4,
      hints: ['Chỉ những nút có đoạn chứa chỉ số 4 mới thay đổi.'],
      solution:
        'Đường đi là [0, 7], [4, 7], [4, 5] và [4]: 4 nút, mỗi tầng một nút. Gốc giảm từ 37 xuống 28.',
    },
    {
      type: 'text',
      prompt: 'Với phép gộp Min, một nút nằm ngoài đoạn truy vấn nên trả về gì?',
      accept: [
        '+∞',
        '∞',
        'vô cùng',
        '+vô cùng',
        'dương vô cùng',
        'vô cực',
        'dương vô cực',
        'infinity',
        '+infinity',
        'inf',
        '+inf',
      ],
      hints: ['Giá trị đó phải giữ nguyên vế còn lại của min(x, ?) với mọi x.'],
      solution: 'min(x, +∞) = x với mọi x, nên +∞ là phần tử trung hoà của min.',
    },
    {
      type: 'multi',
      prompt: 'Hàm nào sau đây dùng được làm phép gộp của cây phân đoạn?',
      options: [
        'Ước chung lớn nhất',
        'Trung bình cộng của hai con',
        'Giá trị lớn nhất',
        'Tích hai ma trận 2 × 2',
      ],
      answers: [0, 2, 3],
      hints: [
        'Phép gộp phải có tính kết hợp: cách nhóm không được làm đổi kết quả.',
        'Trung bình của (trung bình của 1 và 2) với 3 khác trung bình của 1 với (trung bình của 2 và 3).',
      ],
      solution:
        'ƯCLN, max và tích ma trận đều có tính kết hợp. Tích ma trận không giao hoán, nhưng không sao vì con trái luôn ở bên trái. Trung bình của hai trung bình phụ thuộc cách nhóm, nên nút phải lưu tổng và số lượng thay vào đó.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo: Cập nhật lười, cách cộng một lượng vào cả một đoạn mà chỉ tốn O(log n).',
};
