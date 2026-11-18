/** @typedef {import('$lib/algo-engine/augmented-trees.js').AugFrame} AugFrame */
/** @typedef {import('$lib/algo-engine/augmented-trees.js').AugNode} AugNode */
/** @typedef {import('$lib/algo-engine/augmented-trees.js').AugOp} AugOp */

/** Vietnamese names of the two rotation directions. */
const SIDE = /** @type {const} */ ({ left: 'trái', right: 'phải' });

/** @param {number} lo @param {number} hi */
const span = (lo, hi) => `[${lo}, ${hi}]`;
/** @param {AugNode} n */
const nodeSpan = (n) => span(n.key, n.high);
/** @param {AugFrame} f */
const querySpan = (f) => {
  const op = /** @type {{ key: number, high: number }} */ (f.op);
  return span(op.key, op.high);
};

/**
 * The sentences a rotation shares in both trees.
 * @param {AugFrame} f
 * @param {(n: AugNode) => string} name
 * @param {(n: AugNode) => string} field
 */
function rotation(f, name, field) {
  const up = f.nodes[f.moved];
  const down = f.nodes[f.sunk];
  const side = f.direction ? SIDE[f.direction] : '';
  const head = f.prepares
    ? `Nửa đầu của ${f.imbalance}: quay ${side} tại ${name(down)} để nắn thẳng chỗ gập.`
    : `Cây mất cân bằng (${f.imbalance}): quay ${side} tại ${name(down)}.`;
  return `${head} Chỉ hai nút cần tính lại: giờ ${name(up)} có ${field(up)} và ${name(down)} có ${field(down)}.`;
}

export const vi = {
  slug: 'augmented-trees',
  topic: 'balanced-bst',
  level: 'Nâng cao',
  title: 'Ánh xạ có thứ tự và cây tăng cường',
  intro:
    'Ánh xạ có thứ tự giữ các khoá theo thứ tự tăng dần, nên nó trả lời được cả “khoá tiếp theo là gì?” lẫn “khoá này có không?”. Lưu thêm một trường nhỏ trong mỗi nút của cây cân bằng thì cây trả lời được nhiều hơn: kích thước cây con (size) cho ta khoá nhỏ thứ k và thứ hạng của một khoá, còn đầu mút lớn nhất trong mỗi cây con (max) giúp tìm các đoạn giao nhau. Mỗi truy vấn chỉ đi một đường, nên vẫn tốn O(log n).',
  summary:
    'Lưu kích thước cây con trong cây cân bằng để trả lời truy vấn thứ hạng và khoá nhỏ thứ k trong O(log n), và lưu đầu mút lớn nhất để tìm các đoạn giao nhau.',
  instruction:
    'Mỗi nút hiện kích thước của nó. Chạy từng bước các truy vấn, xem k nhỏ dần và ngoặc đánh dấu trên dãy khoá đã sắp xếp lớn dần. Gõ một khoá, rồi chèn, xoá, hỏi thứ hạng của nó hoặc dùng nó làm k. Sau đó chuyển sang cây đoạn và thử dãy có sẵn “Đoạn dài”.',
  modeLabel: 'Trường lưu thêm',
  modes: { order: 'Kích thước cây con', interval: 'Cây đoạn' },
  keyLabel: 'Khoá hoặc k',
  lowLabel: 'Đầu trái',
  highLabel: 'Đầu phải',
  insert: 'Chèn',
  remove: 'Xoá',
  rank: 'Thứ hạng của khoá',
  select: 'Khoá nhỏ thứ k',
  overlap: 'Tìm đoạn giao',
  undo: 'Hoàn tác',
  reset: 'Đặt lại',
  presetLabel: 'Dãy có sẵn',
  presetPlaceholder: 'Chọn một dãy có sẵn…',
  orderPresets: {
    queries: 'Thứ hạng và khoá thứ k',
    rotations: 'Khoá tăng dần, có phép quay',
    scores: 'Bảng điểm',
    random: 'Ngẫu nhiên',
  },
  intervalPresets: {
    textbook: 'Mười đoạn',
    long: 'Đoạn dài',
    rotations: 'Đầu trái tăng dần, có phép quay',
    random: 'Ngẫu nhiên',
  },
  fullKeys: 'Cây đã đầy (15 khoá).',
  fullIntervals: 'Cây đã đầy (10 đoạn).',
  logFull: 'Danh sách thao tác đã đầy (20 thao tác). Hãy hoàn tác hoặc đặt lại để làm tiếp.',
  keyError: 'Hãy dùng một số nguyên từ 0 đến 99.',
  orderError: 'Đầu trái không được lớn hơn đầu phải.',
  emptyTree: 'Cây đang rỗng.',
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác hiện tại',
  /** @param {AugOp} op */
  opChip: (op) => {
    const at = 'high' in op ? span(op.key, op.high) : String(op.key);
    return op.type === 'insert'
      ? `chèn ${at}`
      : op.type === 'delete'
        ? `xoá ${at}`
        : op.type === 'select'
          ? `select(${op.key})`
          : op.type === 'rank'
            ? `rank(${op.key})`
            : `tìm giao ${at}`;
  },
  stats: {
    comparisons: 'Số nút đã xét (thao tác này)',
    updates: 'Số nút tính lại (thao tác này)',
    rotations: 'Số phép quay (tất cả)',
    height: 'Chiều cao',
    keys: 'Số khoá',
    intervals: 'Số đoạn',
    answer: 'Kết quả',
  },
  noAnswer: '—',
  noOverlap: 'không có',
  sortedTitle: 'Cũng các khoá đó, theo thứ tự tăng dần',
  sortedNote: 'Số phía trên mỗi khoá là thứ hạng của nó.',
  countedLabel: 'đứng trước kết quả',
  pointerX: 'x',
  pointerGap: 'chỗ trống',
  /** @param {number[]} keys */
  sortedLabel: (keys) => `Các khoá theo thứ tự tăng dần: ${keys.join(', ') || 'chưa có'}.`,
  /** @param {number} rank @param {number} key @param {string} state */
  sortedCell: (rank, key, state) => `Thứ hạng ${rank}, khoá ${key}${state ? `, ${state}` : ''}`,
  lineTitle: 'Cũng các đoạn đó, trên trục số',
  lineQuery: 'truy vấn',
  /** @param {string[]} spans @param {string | null} query */
  lineLabel: (spans, query) =>
    `Các đoạn trên trục số từ 0 đến 99: ${spans.join(', ') || 'chưa có'}.${query ? ` Truy vấn ${query}.` : ''}`,
  /** @param {number} lo @param {number} hi */
  span,
  /** @param {number} lo @param {number} hi */
  nodeText: (lo, hi) => `${lo}–${hi}`,
  /** @param {number} size */
  sizeNote: (size) => `size ${size}`,
  /** @param {number} max */
  maxNote: (max) => `max ${max}`,
  /** @param {number[]} keys @param {number} h */
  treeLabel: (keys, h) =>
    `Cây thống kê thứ tự gồm ${keys.length} khoá, chiều cao ${h}. Theo thứ tự giữa: ${keys.join(', ') || 'chưa có khoá nào'}.`,
  /** @param {string[]} spans @param {number} h */
  intervalTreeLabel: (spans, h) =>
    `Cây đoạn gồm ${spans.length} đoạn, chiều cao ${h}. Theo thứ tự giữa: ${spans.join(', ') || 'chưa có đoạn nào'}.`,
  /** @param {string} name @param {string} note @param {string} state */
  nodeLabel: (name, note, state) => `${name}, ${note}${state ? `, ${state}` : ''}`,
  roles: {
    compare: 'đang xét',
    path: 'trên đường đi',
    added: 'mới',
    retrace: 'đang tính lại',
    up: 'được quay lên',
    down: 'bị quay xuống',
    successor: 'nút kế tiếp',
    answer: 'kết quả',
  },
  markers: {
    compare: '?',
    path: '',
    added: '+',
    retrace: '✓',
    up: '↑',
    down: '↓',
    successor: 'S',
    answer: '★',
  },
  /** @param {AugFrame} f */
  describeOrder(f) {
    const key = f.op?.key ?? 0;
    const cur = f.current >= 0 ? f.nodes[f.current] : null;
    const at = cur?.key ?? null;
    /** @param {number} s */
    const sz = (s) => (s === -1 ? 0 : f.nodes[s].size);
    const leftSize = cur ? sz(cur.left) : 0;
    switch (f.kind) {
      case 'start':
        return vi.emptyTree;
      case 'go-left':
        return `${key} < ${at}, nên rẽ trái.`;
      case 'go-right':
        return `${key} > ${at}, nên rẽ phải.`;
      case 'attach':
        return `Gắn ${key} thành một lá có size 1. Mọi size phía trên giờ đều thiếu 1, nên ta đi ngược lên.`;
      case 'found':
        return `Đã tìm thấy ${key}, nút cần xoá.`;
      case 'missing':
        return `${key} không có trong cây, nên không có gì thay đổi.`;
      case 'dup':
        return `${key} đã có trong cây, nên lệnh chèn bị bỏ qua và không size nào thay đổi.`;
      case 'successor':
        return `Nút có hai con: nút kế tiếp là khoá nhỏ nhất bên phải, tức ${f.nodes[f.succ].key}.`;
      case 'copy':
        return `Chép khoá kế tiếp ${f.nodes[f.succ].key} vào nút đang giữ ${key}. Nút cũ của nó sẽ bị gỡ ngay sau đây.`;
      case 'unlink':
        return 'Nút đã được gỡ khỏi cây. Mọi size phía trên giờ đều thừa 1, nên ta đi ngược lên.';
      case 'retrace': {
        const n = /** @type {AugNode} */ (cur);
        return `Tại ${at}: size = 1 + ${sz(n.left)} + ${sz(n.right)} = ${n.size}.`;
      }
      case 'rotate':
        return rotation(
          f,
          (n) => String(n.key),
          (n) => `size ${n.size}`,
        );
      case 'select-range':
        return `Không có khoá nhỏ thứ ${Math.max(key, 0)}: size của gốc cho biết cây chỉ có ${f.size} khoá. Không cần đi xuống.`;
      case 'select-begin':
        return `Tìm khoá nhỏ thứ ${key}, bắt đầu từ gốc với k = ${key}.`;
      case 'select-left':
        return `Tại ${at}: s = ${leftSize} + 1 = ${f.s}. k = ${f.remaining} < ${f.s}, nên kết quả nằm bên trái và k vẫn là ${f.remaining}.`;
      case 'select-right':
        return `Tại ${at}: s = ${leftSize} + 1 = ${f.s}. k = ${f.remaining + f.s} > ${f.s}, nên bỏ qua ${f.s} khoá đó: k = ${f.remaining + f.s} − ${f.s} = ${f.remaining}, rồi rẽ phải.`;
      case 'select-found':
        return `Tại ${at}: s = ${leftSize} + 1 = ${f.s}, đúng bằng k. Khoá nhỏ thứ ${key} là ${f.result}.`;
      case 'rank-begin':
        return `Tìm thứ hạng của ${key}, bắt đầu từ gốc với r = 1.`;
      case 'rank-left':
        return `${key} < ${at}: ${at} và mọi khoá bên phải nó đều lớn hơn, nên không đếm gì và rẽ trái.`;
      case 'rank-right':
        return `${key} > ${at}: ${at} và ${leftSize} khoá bên trái nó đều nhỏ hơn, nên cộng thêm ${leftSize + 1}. Giờ r = ${f.counted + 1}. Rẽ phải.`;
      case 'rank-found':
        return `Đã tìm thấy ${key}. ${leftSize} khoá bên trái nó cũng nhỏ hơn, nên thứ hạng là ${f.result}.`;
      case 'rank-missing':
        return `${key} không có trong cây, nhưng phép đếm vẫn dùng được: có ${f.counted} khoá nhỏ hơn, nên nếu có trong cây thì nó sẽ có thứ hạng ${f.result}.`;
      case 'done':
        return f.size === 0
          ? vi.emptyTree
          : `Cây có ${f.size} khoá và chiều cao ${f.height}, và mọi size đã lưu đều đúng.`;
      default:
        return '';
    }
  },
  /** @param {AugFrame} f */
  describeInterval(f) {
    const cur = f.current >= 0 ? f.nodes[f.current] : null;
    const at = cur ? nodeSpan(cur) : '';
    const op = /** @type {{ key: number, high: number }} */ (f.op ?? { key: 0, high: 0 });
    const asked = span(op.key, op.high);
    const left = cur && cur.left !== -1 ? f.nodes[cur.left] : null;
    switch (f.kind) {
      case 'start':
        return vi.emptyTree;
      case 'go-left':
        return `${asked} đứng trước ${at}, xếp theo đầu trái rồi đến đầu phải, nên rẽ trái.`;
      case 'go-right':
        return `${asked} đứng sau ${at}, xếp theo đầu trái rồi đến đầu phải, nên rẽ phải.`;
      case 'attach':
        return `Gắn ${asked} thành một lá có max ${op.high}. Các max phía trên giờ có thể quá nhỏ, nên ta đi ngược lên.`;
      case 'found':
        return `Đã tìm thấy ${asked}, nút cần xoá.`;
      case 'missing':
        return `${asked} không có trong cây. Lệnh xoá cần đúng đoạn đó, nên không có gì thay đổi.`;
      case 'dup':
        return `${asked} đã có trong cây, nên lệnh chèn bị bỏ qua.`;
      case 'successor':
        return `Nút có hai con: nút kế tiếp là đoạn đứng ngay sau theo thứ tự, ${nodeSpan(f.nodes[f.succ])}.`;
      case 'copy':
        return `Chép đoạn kế tiếp ${nodeSpan(f.nodes[f.succ])} vào nút đang giữ ${asked}. Nút cũ của nó sẽ bị gỡ ngay sau đây.`;
      case 'unlink':
        return 'Nút đã được gỡ khỏi cây. Các max phía trên giờ có thể quá lớn, nên ta đi ngược lên.';
      case 'retrace': {
        const n = /** @type {AugNode} */ (cur);
        const parts = [n.high];
        if (n.left !== -1) parts.push(f.nodes[n.left].max);
        if (n.right !== -1) parts.push(f.nodes[n.right].max);
        return `Tại ${at}: max = số lớn nhất trong ${parts.join(', ')} = ${n.max}.`;
      }
      case 'rotate':
        return rotation(f, nodeSpan, (n) => `max ${n.max}`);
      case 'overlap-begin':
        return `Tìm một đoạn bất kì giao với ${querySpan(f)}, bắt đầu từ gốc.`;
      case 'overlap-check': {
        const n = /** @type {AugNode} */ (cur);
        const why =
          n.high < op.key
            ? `nó kết thúc ở ${n.high}, trước ${op.key}`
            : `nó bắt đầu ở ${n.key}, sau ${op.high}`;
        return `${at} không giao với ${querySpan(f)}: ${why}.`;
      }
      case 'overlap-left':
        return `Giá trị max của cây con trái là ${left?.max} ≥ ${op.key}, nên rẽ trái. Nếu bên đó không có đoạn nào giao, thì bên phải cũng không có.`;
      case 'overlap-right':
        return left
          ? `Giá trị max của cây con trái là ${left.max} < ${op.key}: mọi đoạn bên đó đều kết thúc trước khi truy vấn bắt đầu, nên rẽ phải.`
          : 'Không có cây con trái, nên rẽ phải.';
      case 'overlap-found':
        return `${at} giao với ${querySpan(f)}: ${cur?.key} ≤ ${op.high} và ${op.key} ≤ ${cur?.high}. Tìm thấy sau ${f.comparisons} lần xét.`;
      case 'overlap-none':
        return `Lượt đi đã ra khỏi cây sau ${f.comparisons} lần xét, nên không đoạn nào giao với ${querySpan(f)}.`;
      case 'done':
        return f.size === 0
          ? vi.emptyTree
          : `Cây có ${f.size} đoạn và chiều cao ${f.height}, và mọi max đã lưu đều đúng.`;
      default:
        return '';
    }
  },
  takeaways: [
    'Một ánh xạ có thứ tự (TreeMap của Java, std::map của C++) bên dưới là một cây cân bằng. Chính việc giữ khoá theo thứ tự cho phép tìm khoá liền trước, liền sau, duyệt theo thứ tự và truy vấn đoạn, những việc mà bảng băm (hash table) không làm được.',
    'Lưu size trong mỗi nút. Với select, s = size(left) + 1 là vị trí của nút hiện tại trong cây con của nó: dừng nếu k = s, rẽ trái nếu k < s, còn lại thì trừ s khỏi k và rẽ phải. Với rank, mỗi lần lượt đi rẽ phải thì cộng thêm s.',
    'Một trường được cập nhật rẻ khi nó chỉ phụ thuộc vào chính nút và hai con của nút. Mỗi thay đổi chỉ chạm một đường đi, và một phép quay chỉ tính lại hai nút, nên chèn và xoá vẫn tốn O(log n). Không thể lưu thứ hạng của nút theo cách này: chèn một khoá nhỏ nhất mới sẽ làm đổi mọi thứ hạng.',
    'Cây đoạn xếp các đoạn theo đầu trái và lưu đầu phải lớn nhất của mỗi cây con. Nếu left.max ≥ lo thì rẽ trái là an toàn: khi bên trái không có đoạn nào giao, đoạn có đầu phải bằng left.max phải bắt đầu sau khi truy vấn kết thúc, và không đoạn nào bên phải bắt đầu sớm hơn.',
    'Thử dãy có sẵn “Đoạn dài”: đoạn duy nhất giao với [80, 85] là [10, 90], nằm tít bên trái theo đầu trái, và max đã lưu dẫn thẳng đến nó. Sau đó đếm xem trong “Thứ hạng và khoá thứ k” có bao nhiêu khoá nằm trong một khoảng, chỉ dùng hai truy vấn thứ hạng.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['select, rank', 'O(log n)', 'Một đường đi từ gốc xuống lá, mỗi nút đọc một size.'],
    ['Kích thước cả cây', 'O(1)', 'Đó chính là size lưu ở gốc.'],
    [
      'Chèn, xoá',
      'O(log n)',
      'Phần việc riêng của cây cân bằng, cộng một lần tính lại cho mỗi nút tổ tiên.',
    ],
    ['Một phép quay', 'O(1)', 'Tính lại hai nút từ các con của chúng.'],
    ['Tìm một đoạn giao', 'O(log n)', 'max đã lưu quyết định hướng đi tại mỗi nút.'],
    [
      'Tìm cả k đoạn giao',
      'O(min(n, k log n))',
      'Lặp lại phép tìm và gỡ từng kết quả, hoặc duyệt cả cây và dùng max đã lưu để cắt tỉa.',
    ],
    ['Bộ nhớ', 'O(n)', 'Mỗi khoá một nút, mỗi nút lưu thêm một số.'],
  ],
  nextTeaser:
    'Bài sau là luyện tập: bài toán cây cân bằng, nơi bạn chạy cùng một dãy thao tác trên BST, cây AVL và skip list để so sánh chi phí.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Mở “Thứ hạng và khoá thứ k”, dãy này dựng cây gồm 10, 20, …, 70 với gốc là 40. Chạy select(6). Sau khi rời gốc, k bằng bao nhiêu?',
      answer: 2,
      hints: ['Tại gốc, s = size(left) + 1.', 'Cây con trái có 3 khoá, nên s = 4.'],
      solution: 's = 3 + 1 = 4. Vì 6 > 4, ta bỏ qua 4 khoá đó và rẽ phải với k = 6 − 4 = 2.',
    },
    {
      type: 'number',
      prompt: 'select(6) đó trả về khoá nào?',
      answer: 60,
      hints: ['Tại 60, cây con trái có 1 khoá, nên s = 2.'],
      solution:
        'Tại 60, s = 1 + 1 = 2, đúng bằng k = 2, nên select(6) trả về 60. Khoá thứ sáu trong 10, 20, 30, 40, 50, 60, 70 đúng là 60.',
    },
    {
      type: 'number',
      prompt: 'Cũng trong cây đó, rank(45) trả về bao nhiêu? Khoá 45 không có trong cây.',
      answer: 5,
      hints: [
        'Thứ hạng bằng 1 cộng số khoá nhỏ hơn.',
        'Chạy truy vấn và để ý r ở mỗi lần rẽ phải.',
      ],
      solution:
        'Tại 40, lượt đi rẽ phải và cộng 3 + 1 = 4, nên r = 5. Sau đó nó rẽ trái tại 60 và tại 50 mà không cộng gì, rồi ra khỏi cây với r = 5. Các khoá 10, 20, 30, 40 nhỏ hơn 45.',
    },
    {
      type: 'number',
      prompt:
        'Trong cây đó, có bao nhiêu khoá nằm trong khoảng từ 25 đến 55? Dùng hai truy vấn thứ hạng thay vì duyệt từng khoá.',
      answer: 3,
      unit: 'khoá',
      hints: [
        'Đếm số khoá nhỏ hơn 56, rồi trừ đi số khoá nhỏ hơn 25.',
        'rank(x) − 1 là số khoá nhỏ hơn x.',
      ],
      solution:
        'rank(56) = 6 và rank(25) = 3, và 6 − 3 = 3. Đó là các khoá 30, 40 và 50. Mỗi truy vấn thứ hạng tốn O(log n), nên phép đếm trong một khoảng cũng vậy, dù khoảng đó chứa bao nhiêu khoá.',
    },
    {
      type: 'number',
      prompt:
        'Mở “Khoá tăng dần, có phép quay”. Khi chèn 30, phép quay đầu tiên đưa 20 lên. Phép quay đó tính lại bao nhiêu nút?',
      answer: 2,
      unit: 'nút',
      hints: ['Chạy đến phép quay và đọc lời thuật.'],
      solution:
        'Chỉ 20 và 10 đổi con, nên chỉ size của hai nút đó được tính lại. Nút nào ở phía trên vẫn chứa đúng các khoá cũ, nên size của nó không đổi.',
    },
    {
      type: 'multi',
      prompt:
        'Một nút có thể lưu và giữ đúng những giá trị nào với chi phí O(log n) cho mỗi lần chèn hoặc xoá?',
      options: [
        'Số khoá trong cây con của nó',
        'Tổng các khoá trong cây con của nó',
        'Đầu phải lớn nhất trong cây con của nó',
        'Thứ hạng của nó trong cả cây',
        'Độ sâu của nó tính từ gốc',
      ],
      answers: [0, 1, 2],
      hints: [
        'Hỏi xem giá trị đó có tính được chỉ từ chính nút và hai con của nút không.',
        'Khi chèn một khoá nhỏ nhất mới, mọi thứ hạng thay đổi thế nào? Sau một phép quay ở gốc, độ sâu thay đổi thế nào?',
      ],
      solution:
        'Kích thước, tổng và giá trị lớn nhất chỉ phụ thuộc vào một nút và các con của nó, nên chỉ cần tính lại một đường đi và vài phép quay. Một khoá nhỏ nhất mới làm đổi mọi thứ hạng, và một phép quay làm đổi độ sâu của cả một cây con, nên hai giá trị đó có thể cần O(n) lần cập nhật.',
    },
    {
      type: 'text',
      prompt:
        'Mở “Đoạn dài” và chạy truy vấn đầu tiên, [80, 85]. Nó tìm thấy đoạn nào? Viết dưới dạng đầu trái, đầu phải.',
      accept: ['10, 90', '[10, 90]', '10 90', '10-90', '10–90', '10 đến 90', '(10, 90)'],
      hints: ['Theo dõi các giá trị max: con trái của gốc có max 90.'],
      solution:
        'Tại [40, 45], max bên trái là 90 ≥ 80, nên rẽ trái. Tại [20, 25], max bên trái lại là 90, nên rẽ trái, tới [10, 90], đoạn này giao với [80, 85].',
    },
    {
      type: 'choice',
      prompt:
        'Tại một nút không giao với truy vấn, left.max ≥ lo. Vì sao nếu bên trái không có đoạn giao thì phép tìm có thể yên tâm bỏ qua cây con phải?',
      options: [
        'Vì mọi đoạn bên phải đều ngắn hơn',
        'Vì đoạn có đầu phải bằng left.max phải bắt đầu sau khi truy vấn kết thúc, và không đoạn nào bên phải bắt đầu sớm hơn',
        'Vì max của cây con phải luôn nhỏ hơn max của cây con trái',
        'Vì một cây cân bằng có nhiều nhất một đoạn giao',
      ],
      answer: 1,
      hints: [
        'Xét đoạn bên trái có đầu phải bằng left.max. Nó vươn tới lo nhưng không giao với truy vấn. Điều đó nói gì về đầu trái của nó?',
      ],
      solution:
        'Đoạn đó kết thúc tại lo hoặc sau lo mà vẫn không giao, nên đầu trái của nó phải lớn hơn hi. Các đầu trái được xếp tăng dần, nên mọi đoạn bên phải cũng bắt đầu sau hi và không thể giao với truy vấn.',
    },
    {
      type: 'number',
      prompt:
        'Mở “Đoạn dài”, rồi xoá [10, 90] (đầu trái 10, đầu phải 90). Giờ max của gốc là bao nhiêu?',
      answer: 75,
      hints: ['Chỉ đường đi từ nút đó lên gốc cần tính lại.'],
      solution:
        'Bên trái giờ chỉ vươn tới 35, còn max của cây con phải là 75, từ đoạn [70, 75]. Đầu phải của chính gốc là 45, nên max của gốc là số lớn nhất trong 45, 35 và 75, tức 75.',
    },
  ],
};
