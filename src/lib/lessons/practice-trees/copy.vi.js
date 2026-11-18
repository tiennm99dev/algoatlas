/** @typedef {import('$lib/algo-engine/practice-trees.js').ValidateFrame} ValidateFrame */
/** @typedef {import('$lib/algo-engine/practice-trees.js').LcaFrame} LcaFrame */
/** @typedef {import('$lib/algo-engine/practice-trees.js').KeySlots} KeySlots */

/** @param {number} x */
const num = (x) => (x === -Infinity ? '−∞' : x === Infinity ? '+∞' : String(x));

/** @param {{lo: number, hi: number}} b */
const range = (b) => `(${num(b.lo)}, ${num(b.hi)})`;

export const vi = {
  slug: 'practice-trees',
  topic: 'trees',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán về cây',
  intro:
    'Hai bài toán kinh điển trên cây nhị phân tìm kiếm (BST). Để kiểm tra một cây có phải BST không, mọi khoá phải nằm trong khoảng mà các tổ tiên của nó cho phép, chứ không chỉ đúng phía so với cha. Để tìm tổ tiên chung gần nhất (lowest common ancestor) của hai khoá, ta đi xuống từ gốc tới khi hai khoá tách sang hai phía khác nhau.',
  summary:
    'Kiểm tra một cây nhị phân có phải BST không bằng khoảng giá trị của khoá, xem vì sao chỉ so với cha là sai, và tìm tổ tiên chung gần nhất bằng cách bấm vào hai nút.',
  instruction:
    'Chọn một bài toán. Với Kiểm tra BST, so phép kiểm tra theo khoảng với phép chỉ so với cha trên các mẫu bẫy. Với Tổ tiên chung gần nhất, bấm vào hai nút để chọn p và q rồi chạy từng bước đường đi. Dùng công cụ này để trả lời các câu hỏi bên dưới.',
  problemLabel: 'Bài toán',
  problems: { validate: 'Kiểm tra BST', lca: 'Tổ tiên chung gần nhất' },
  methodLabel: 'Cách kiểm tra',
  methods: { range: 'Khoảng giá trị', local: 'Chỉ so với cha (sai)' },
  keysLabel: 'Khoá (thứ tự mảng, - cho ô trống)',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Mở một mẫu…',
  presets: {
    valid: 'BST hợp lệ',
    trap: 'Bẫy: 60 dưới 30',
    'deep-trap': 'Bẫy: 15 dưới 30',
    swapped: 'Hai con bị đổi chỗ',
    big: 'Hợp lệ, 15 khoá',
  },
  keyErrors: {
    empty: 'Hãy nhập ít nhất là khoá gốc.',
    count: 'Dùng tối đa 15 ô (bốn tầng).',
    format: 'Khoá là số nguyên từ 0 đến 99; dùng - cho ô trống.',
    duplicate: 'Mỗi khoá chỉ được xuất hiện một lần.',
    orphan: 'Khoá nào cũng cần có cha: ô i treo dưới ô ⌊(i − 1) / 2⌋, nên ô đó phải có khoá.',
  },
  treeTitle: 'Cây',
  /** @param {number[]} keys */
  treeAria: (keys) => `Cây nhị phân, các khoá theo thứ tự mảng: ${keys.join(', ')}.`,
  pickHint: 'Bấm hoặc nhấn Enter trên một nút để nó thành q; q cũ trở thành p.',
  /** @param {number} p @param {number} q */
  picksText: (p, q) => `p = ${p}, q = ${q}`,
  notBst:
    'Cây này không phải BST, nên đường đi dựa vào một thứ tự không hề có và có thể dừng ở sai nút.',
  /** @param {number | null} key */
  trueLca: (key) => `Tổ tiên chung gần nhất theo liên kết cha: ${key ?? 'không có'}.`,
  /** @param {number} key @param {string} state @param {string} extra */
  nodeLabel: (key, state, extra) => [`Khoá ${key}`, extra, state].filter(Boolean).join(', '),
  /** @param {{lo: number, hi: number}} b */
  rangeNote: range,
  /** @param {{lo: number, hi: number}} b */
  rangeText: (b) => `phải nằm trong ${range(b)}`,
  states: {
    active: 'đang kiểm tra',
    frontier: 'đang chờ các cây con',
    visited: 'đạt',
    swap: 'không đạt',
    path: 'trên đường đi',
    sorted: 'tổ tiên chung gần nhất',
  },
  markers: {
    active: '▶',
    frontier: '…',
    visited: '✓',
    swap: '✗',
    path: '•',
    sorted: '★',
    p: 'p',
    q: 'q',
  },
  legend: {
    active: 'Đang kiểm tra',
    frontier: 'Đang chờ trên call stack',
    visited: 'Đạt phép kiểm tra',
    swap: 'Không đạt phép kiểm tra',
    path: 'Trên đường đi',
    sorted: 'Tổ tiên chung gần nhất',
    picks: 'p, q: hai khoá đã chọn (chữ ở góc)',
  },
  inorderTitle: 'Các khoá theo thứ tự duyệt giữa',
  inorderEmpty: 'chưa có',
  dropLabel: 'nhỏ hơn khoá đứng trước nó',
  /** @param {boolean} ok */
  inorderVerdict: (ok) => (ok ? 'Tăng ngặt: đây là BST.' : 'Không tăng ngặt: không phải BST.'),
  stats: {
    comparisons: 'Số lần so sánh khoá',
    checked: 'Số nút đã kiểm tra',
    visited: 'Số nút đã thăm',
    depth: 'Độ sâu stack',
    result: 'Kết quả',
    answer: 'LCA',
  },
  results: { pending: '?', valid: 'hợp lệ', invalid: 'không phải BST' },
  stackTitle: 'Call stack (ngoài cùng trước)',
  stackEmpty: 'rỗng',
  /** @param {ValidateFrame} f @param {KeySlots} s */
  describeValidate(f, s) {
    const k = f.current >= 0 ? s[f.current] : null;
    const b = f.current >= 0 ? f.bounds[f.current] : null;
    const l = s[2 * f.current + 1];
    const r = s[2 * f.current + 2];
    switch (f.kind) {
      case 'start':
        return f.method === 'range'
          ? 'Kiểm tra gốc với khoảng rộng nhất, (−∞, +∞). Mỗi lần đi xuống, khoảng lại hẹp đi.'
          : 'Chỉ kiểm tra mỗi nút với hai con của chính nó.';
      case 'enter':
        if (f.method === 'range' && b)
          return f.status[f.current] === 'ok'
            ? `${num(b.lo)} < ${k} < ${num(b.hi)}: ${k} nằm trong khoảng của nó.`
            : `${k} không nằm trong ${range(b)}.`;
        return f.status[f.current] === 'ok'
          ? `${k}: ${l == null ? 'không có con trái' : `con trái ${l} < ${k}`}, ${r == null ? 'không có con phải' : `con phải ${r} > ${k}`}. Đúng thứ tự tại chỗ.`
          : `${k} và các con của nó sai thứ tự.`;
      case 'empty':
        return `Một cây con rỗng dưới ${k} thì luôn hợp lệ.`;
      case 'go-left':
        return f.method === 'range'
          ? `Sang trái: các khoá ở đó phải nhỏ hơn ${k}, nên khoảng thành (${num(b?.lo ?? -Infinity)}, ${k}).`
          : `Sang trái và kiểm tra cây con trái của ${k} theo cùng cách.`;
      case 'go-right':
        return f.method === 'range'
          ? `Sang phải: các khoá ở đó phải lớn hơn ${k}, nên khoảng thành (${k}, ${num(b?.hi ?? Infinity)}).`
          : `Sang phải và kiểm tra cây con phải của ${k} theo cùng cách.`;
      case 'fail':
        return f.method === 'range'
          ? `${k} phá vỡ tính chất BST: một tổ tiên đòi mọi khoá ở đây phải nằm trong ${b ? range(b) : ''}. Trả về false.`
          : `${k} có một con nằm sai phía. Trả về false.`;
      case 'done':
        if (f.result)
          return f.method === 'range'
            ? 'Mọi khoá đều nằm trong khoảng của nó: đây là một BST hợp lệ.'
            : 'Mọi nút đều đúng thứ tự với các con. Phép chỉ so với cha báo “hợp lệ”, nhưng hãy đối chiếu với các khoá theo thứ tự duyệt giữa.';
        return 'Không phải BST: phép kiểm tra trả về false.';
    }
  },
  /** @param {LcaFrame} f @param {KeySlots} s */
  describeLca(f, s) {
    const k = f.current >= 0 ? s[f.current] : null;
    switch (f.kind) {
      case 'start':
        return `Tìm tổ tiên chung gần nhất của p = ${f.p} và q = ${f.q}: bắt đầu từ gốc.`;
      case 'visit':
        return `So sánh p = ${f.p} và q = ${f.q} với ${k}.`;
      case 'go-left':
        return `Cả hai đều nhỏ hơn ${k}, nên cả hai nằm trong cây con trái của nó. Sang trái.`;
      case 'go-right':
        return `Cả hai đều lớn hơn ${k}, nên cả hai nằm trong cây con phải của nó. Sang phải.`;
      case 'found':
        return f.p === k || f.q === k
          ? `${k} là một trong hai khoá, và khoá còn lại nằm bên dưới nó: ${k} là tổ tiên chung gần nhất.`
          : `${f.p} và ${f.q} nằm ở hai phía khác nhau của ${k}: ${k} là tổ tiên chung gần nhất.`;
      case 'fell-off':
        return 'Đường đi đã rơi ra khỏi cây: có một khoá không tồn tại.';
      case 'done':
        return f.answer >= 0
          ? `Xong sau ${f.path.length} bước: LCA(${f.p}, ${f.q}) = ${s[f.answer]}.`
          : 'Xong: không tìm thấy tổ tiên chung.';
    }
  },
  takeaways: [
    'BST đòi mọi khoá trong cây con trái của một nút phải nhỏ hơn và mọi khoá trong cây con phải phải lớn hơn khoá của nút, chứ không chỉ các con. Chỉ so mỗi nút với cha sẽ bỏ sót một khoá nằm sai phía so với một tổ tiên ở cao hơn.',
    'Truyền một khoảng xuống: gốc nhận (−∞, +∞), con trái nhận (lo, key) và con phải nhận (key, hi). Mỗi nút được thăm một lần, nên tốn O(n). Nói cách khác, một cây là BST khi và chỉ khi các khoá theo thứ tự duyệt giữa tăng ngặt.',
    'Trong BST, tổ tiên chung gần nhất của p và q là nút đầu tiên trên đường đi từ gốc mà tại đó hai khoá không cùng đi về một phía. Một nút được coi là tổ tiên của chính nó, nên nếu p nằm trên q thì đáp án là p.',
    'Đường đi tìm LCA chỉ theo một nhánh, nên tốn O(h): O(log n) khi cây cân bằng, O(n) khi cây là một chuỗi. Trên cây không phải BST, nó có thể dừng ở sai nút.',
    'Thử các mẫu bẫy với cả hai cách kiểm tra: phép chỉ so với cha báo “hợp lệ” trong khi các khoá theo thứ tự duyệt giữa lại có chỗ tụt xuống.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Kiểm tra BST, thời gian', 'O(n)', 'Mỗi nút được kiểm tra một lần với khoảng của nó.'],
    ['Kiểm tra BST, bộ nhớ', 'O(h)', 'Mỗi tầng trên đường đi hiện tại có một lời gọi đang mở.'],
    ['LCA trong BST, thời gian', 'O(h)', 'Mỗi lần so sánh đi xuống một bước; không quay lui.'],
    ['LCA trong BST, bộ nhớ', 'O(1)', 'Đường đi là một vòng lặp với một con trỏ.'],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt:
        'Mở mẫu “Bẫy: 60 dưới 30” (50; 30 và 70 ở dưới; 20 và 60 dưới 30). Phép chỉ so với cha báo gì?',
      options: ['Hợp lệ', 'Không phải BST, tại 60', 'Không phải BST, tại 30'],
      answer: 0,
      hints: [
        'Chọn Chỉ so với cha rồi chạy đến bước cuối.',
        '60 có lớn hơn cha của nó là 30 không?',
      ],
      solution:
        'Mọi nút đều đúng thứ tự với các con của chính nó (20 < 30 < 60, 30 < 50 < 70), nên phép chỉ so với cha báo hợp lệ. Kết luận đó sai: 60 nằm trong cây con trái của 50 nhưng lại lớn hơn 50.',
    },
    {
      type: 'number',
      prompt: 'Cùng mẫu đó, dùng cách kiểm tra theo khoảng: phép kiểm tra thất bại ở khoá nào?',
      answer: 60,
      hints: ['Chọn Khoảng giá trị rồi chạy từng bước tới khi một nút chuyển màu đỏ.'],
      solution:
        '50 nằm trong (−∞, +∞), 30 nằm trong (−∞, 50), 20 nằm trong (−∞, 30), rồi 60 phải nằm trong (30, 50) nhưng lại không.',
    },
    {
      type: 'text',
      prompt:
        'Trong mẫu “Bẫy: 15 dưới 30” (20; 10 và 30 ở dưới; 15 và 40 dưới 30), khoá 15 phải nằm trong khoảng nào? Viết dưới dạng (lo, hi).',
      accept: ['(20, 30)', '20 < x < 30', '20 < key < 30', 'giữa 20 và 30', 'từ 20 đến 30'],
      hints: [
        '15 là con trái của 30, còn 30 là con phải của 20.',
        'Sang phải từ 20 đặt lo = 20; sang trái từ 30 đặt hi = 30.',
      ],
      solution:
        'Khoảng bắt đầu là (−∞, +∞), thành (20, +∞) khi sang phải từ 20 và (20, 30) khi sang trái từ 30. 15 không lớn hơn 20, nên cây không phải BST.',
    },
    {
      type: 'number',
      prompt: 'Mở mẫu “BST hợp lệ”. Tổ tiên chung gần nhất của 40 và 60 là gì?',
      answer: 50,
      hints: ['Chuyển sang Tổ tiên chung gần nhất rồi bấm 40, sau đó bấm 60.'],
      solution: '40 < 50 < 60, nên hai khoá tách ra ngay ở gốc: LCA(40, 60) = 50.',
    },
    {
      type: 'number',
      prompt: 'Mở mẫu “Hợp lệ, 15 khoá”. Tổ tiên chung gần nhất của 54 và 78 là gì?',
      answer: 72,
      hints: ['Cả hai khoá đều lớn hơn gốc 48, nên đường đi sang phải trước.'],
      solution:
        'Tại 48 cả hai đều lớn hơn: sang phải. Tại 72, 54 nhỏ hơn còn 78 lớn hơn, nên chúng tách ra: LCA là 72.',
    },
    {
      type: 'number',
      prompt:
        'Cùng cây đó: đường đi thăm bao nhiêu nút để tìm tổ tiên chung gần nhất của 30 và 36?',
      answer: 3,
      unit: 'nút',
      hints: ['Bấm 30 và 36 rồi đọc “Số nút đã thăm” ở cuối.', '36 là cha của 30.'],
      solution:
        'Nó thăm 48 (cả hai nhỏ hơn: sang trái), 24 (cả hai lớn hơn: sang phải) và 36, chính là q, nên LCA là 36: ba nút.',
    },
    {
      type: 'choice',
      prompt:
        'Mở mẫu bẫy có 60 dưới 30, chuyển sang Tổ tiên chung gần nhất và chọn 20 và 60. Đường đi kiểu BST trả về gì?',
      options: ['30, đúng là tổ tiên chung gần nhất', '50, một đáp án sai', 'Rơi ra khỏi cây'],
      answer: 1,
      hints: ['So sánh 20 và 60 với gốc 50.'],
      solution:
        '20 < 50 < 60, nên đường đi dừng ở 50. Tổ tiên chung gần nhất thật là 30, cha của cả hai. Đường đi tin vào một thứ tự mà cây không có.',
    },
  ],
  nextTeaser:
    'Bài sau, Heap nhị phân, xếp một cây nhị phân đầy đủ vào mảng để luôn lấy được phần tử nhỏ nhất thật nhanh.',
};
