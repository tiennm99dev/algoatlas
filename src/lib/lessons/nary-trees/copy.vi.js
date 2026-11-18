/** @typedef {import('$lib/algo-engine/nary-trees.js').NaryFrame} NaryFrame */

/** @param {number} h */
const hText = (h) => (h < 0 ? '−1' : String(h));

export const vi = {
  slug: 'nary-trees',
  topic: 'trees',
  level: 'Trung bình',
  title: 'Cây nhiều nhánh và đệ quy trên cây',
  intro:
    'Cây nhiều nhánh cho phép một nút có bao nhiêu con cũng được, nên mỗi nút giữ một danh sách các con: tệp trong thư mục, nhân viên trong một tổ chức, cấu trúc ngữ pháp của một câu. Phần lớn câu hỏi về loại cây này được giải bằng một lần đệ quy: hỏi mọi con trước, rồi gộp các câu trả lời trên đường quay lên.',
  summary:
    'Dựng một cây tổng quát và xem kích thước cây con, chiều cao và đường kính của cây dồn dần lên từ các lá trong một lần duyệt sau.',
  instruction:
    'Chọn một nút để thêm con dưới nó hoặc xoá cây con của nó, hoặc mở một mẫu. Chạy từng bước phép duyệt: mỗi nút ghi s (kích thước cây con, tăng dần khi các con báo về) và h (chiều cao). Đến cuối, đường đi tạo nên đường kính sẽ sáng lên.',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Mở một mẫu…',
  presets: {
    org: 'Sơ đồ tổ chức',
    skewed: 'Đường kính không qua gốc',
    star: 'Hình sao',
    path: 'Đường thẳng',
    random: 'Ngẫu nhiên',
  },
  addChild: 'Thêm con',
  remove: 'Xoá cây con',
  undo: 'Hoàn tác',
  /** @param {string} label */
  selectedText: (label) => `Đang chọn: ${label}`,
  errors: {
    /** @param {number} max */
    full: (max) => `Cây đã đầy (${max} nút). Hãy xoá bớt một cây con trước.`,
    /** @param {number} max */
    depth: (max) => `Ở đây nút chỉ được nằm tối đa ở độ sâu ${max}.`,
    /** @param {string} label @param {number} max */
    wide: (label, max) => `${label} đã có ${max} con, nhiều nhất hình vẽ này cho phép.`,
    root: 'Gốc phải giữ lại: hãy xoá một cây con của nó, hoặc mở một mẫu.',
  },
  treeTitle: 'Cây',
  /** @param {number} n @param {number} diameter */
  treeAria: (n, diameter) =>
    `Cây gồm ${n} nút${diameter >= 0 ? `, đường kính tới lúc này là ${diameter} cạnh` : ''}.`,
  /** @param {string} label @param {number | null} size @param {number | null} height @param {string} state */
  nodeLabel: (label, size, height, state) =>
    [
      `Nút ${label}`,
      size === null ? '' : `kích thước cây con ${size}`,
      height === null ? '' : `chiều cao ${height}`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  /** @param {number | null} s @param {number | null} h */
  note: (s, h) => [s === null ? '' : `s${s}`, h === null ? '' : `h${h}`].filter(Boolean).join(' '),
  states: {
    active: 'đang chạy',
    frontier: 'đang chờ các con',
    compare: 'đang báo về cho cha',
    visited: 'đã xong',
    path: 'trên đường kính',
  },
  markers: { active: '▶', frontier: '…', compare: '↑', visited: '✓', path: '◆' },
  legend: {
    active: 'Đang chạy',
    frontier: 'Đang chờ trên call stack',
    compare: 'Con đang báo về',
    visited: 'Đã xong: kích thước và chiều cao cuối cùng',
    path: 'Đường kính',
    selected: 'Đang chọn (viền xanh đậm)',
  },
  listsTitle: 'Danh sách con',
  /** @param {string} label @param {string[]} kids */
  listRow: (label, kids) => `${label}: ${kids.length ? kids.join(', ') : '(lá)'}`,
  stats: {
    size: 'Kích thước cây con gốc',
    height: 'Chiều cao',
    diameter: 'Đường kính (số cạnh)',
    calls: 'Số lời gọi dfs',
  },
  notYet: '?',
  stackTitle: 'Call stack (ngoài cùng trước)',
  stackEmpty: 'rỗng',
  /** @param {NaryFrame} f @param {string[]} labels @param {number[][]} kids */
  describe(f, labels, kids) {
    const v = f.current >= 0 ? labels[f.current] : '';
    const c = f.child >= 0 ? labels[f.child] : '';
    switch (f.kind) {
      case 'start':
        return `Gọi dfs trên gốc ${labels[0]}. Mỗi lời gọi trả về kích thước và chiều cao của cây con.`;
      case 'enter':
        return kids[f.current].length === 0
          ? `${v} có danh sách con rỗng: đó là lá. Kích thước của nó bắt đầu và giữ nguyên ở 1.`
          : `Vào ${v}: kích thước bắt đầu ở 1 (chính nút đó). ${v} có ${kids[f.current].length} con cần hỏi.`;
      case 'descend':
        return `${v} hỏi con ${c}: gọi dfs(${c}) và chờ.`;
      case 'add':
        return `${c} báo về kích thước ${f.size[f.child]} và chiều cao ${f.height[f.child]}. Kích thước của ${v} tăng lên ${f.size[f.current]}; hai con cao nhất của nó giờ là a = ${hText(f.top[0])}, b = ${hText(f.top[1])}.`;
      case 'up': {
        const [a, b] = f.top;
        return `${v} đã xong: chiều cao ${hText(a)} + 1 = ${f.height[f.current]}, và đường đi dài nhất gấp khúc tại ${v} có ${hText(a)} + ${hText(b)} + 2 = ${f.bend[f.current]} cạnh. Tốt nhất tới lúc này: ${f.diameter}.`;
      }
      case 'done':
        return `Xong: ${Number(f.size[0])} nút, chiều cao ${f.height[0]}, đường kính ${f.diameter} cạnh: ${f.path.map((u) => labels[u]).join(' – ')}, gấp khúc tại ${labels[f.best]}.`;
    }
  },
  takeaways: [
    'Lưu một cây tổng quát bằng danh sách con (mỗi nút giữ danh sách các con của nó) hoặc bằng mảng cha (mỗi nút giữ cha của nó). Danh sách con hợp để đi xuống; mảng cha gọn và hợp để đi lên.',
    'Đệ quy trên cây hỏi từng con rồi gộp lại: size(v) = 1 + tổng kích thước các con, height(v) = 1 + chiều cao của con cao nhất. Cả hai đều theo thứ tự duyệt sau: một nút xong sau khi mọi con của nó đã xong.',
    'Đường kính là đường đi dài nhất giữa hai nút bất kì. Mọi đường đi đều có đúng một nút cao nhất, nơi nó gấp khúc, nên đường tốt nhất gấp khúc tại v dùng hai con cao nhất của v: a + b + 2 cạnh. Đường kính là giá trị gấp khúc lớn nhất như vậy.',
    'Mỗi nút được vào một lần và mỗi cạnh được dùng hai lần (đi xuống và quay lên), nên phép duyệt tốn O(n) dù cây có hình dạng thế nào.',
    'Mở mẫu “Đường kính không qua gốc”: đường đi dài nhất gấp khúc tại B chứ không phải tại gốc, nên đáp án phải được giữ như một giá trị tốt nhất đang chạy, không đọc thẳng ở gốc.',
  ],
  complexityHead: ['Phép tính', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Mọi kích thước cây con và chiều cao', 'O(n)', 'Mỗi nút một lời gọi; mỗi con báo về một lần.'],
    ['Đường kính', 'O(n)', 'Cùng lần duyệt đó: giữ hai con cao nhất ở mỗi nút.'],
    [
      'Stack đệ quy',
      'O(h)',
      'Mỗi tầng trên đường đi hiện tại có một lời gọi đang mở; cây dạng đường thẳng cho h = n − 1.',
    ],
    ['Bộ nhớ danh sách con', 'O(n)', 'Mọi nút trừ gốc xuất hiện trong đúng một danh sách.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Mở mẫu Sơ đồ tổ chức. Kích thước cây con của F là bao nhiêu?',
      answer: 5,
      unit: 'nút',
      hints: [
        'Chạy từng bước tới khi F xong rồi đọc nhãn s của nó.',
        'Đếm F và mọi nút bên dưới nó.',
      ],
      solution:
        'Các con của F là G, I và J, còn G có một con là H. size(G) = 2, nên size(F) = 1 + 2 + 1 + 1 = 5.',
    },
    {
      type: 'number',
      prompt: 'Đường kính của Sơ đồ tổ chức dài bao nhiêu cạnh?',
      answer: 5,
      unit: 'cạnh',
      hints: [
        'Ở gốc, hai con cao nhất là F (chiều cao 2) và B (chiều cao 1).',
        'Giá trị gấp khúc = a + b + 2.',
      ],
      solution:
        'Chỗ gấp khúc tốt nhất là A: 2 + 1 + 2 = 5 cạnh, đường đi H – G – F – A – B – C. Không nút nào khác gấp khúc một đường dài hơn.',
    },
    {
      type: 'choice',
      prompt: 'Một hình sao có một tâm và k ≥ 2 lá gắn vào tâm. Đường kính của nó là bao nhiêu?',
      options: ['1 cạnh', '2 cạnh', 'k cạnh', 'k − 1 cạnh'],
      answer: 1,
      hints: ['Mở mẫu Hình sao. Hai lá bất kì nối với nhau qua tâm.'],
      solution:
        'Ở tâm a = b = 0, nên giá trị gấp khúc là 0 + 0 + 2 = 2 cạnh: lá – tâm – lá, dù có bao nhiêu lá.',
    },
  ],
  nextTeaser:
    'Tiếp theo là bài Luyện tập: bài toán về cây, nơi em dùng đệ quy trên cây để giải các bài toán quen thuộc.',
};
