/** @typedef {import('$lib/algo-engine/disjoint-set-union.js').DsuFrame} DsuFrame */
/** @typedef {import('$lib/algo-engine/disjoint-set-union.js').DsuOp} DsuOp */

/** @param {number[]} g */
const groupText = (g) => `{${g.join(', ')}}`;

export const vi = {
  slug: 'disjoint-set-union',
  topic: 'union-find',
  level: 'Cơ bản',
  title: 'Cấu trúc DSU',
  intro:
    'DSU (cấu trúc các tập rời nhau), còn gọi là union-find, giữ các phần tử trong những nhóm không bao giờ chồng lên nhau. Mỗi nhóm là một cây lưu trong một mảng parent duy nhất, và gốc của cây là tên của nhóm. Hai thao tác làm hết mọi việc: find leo lên tới gốc, còn union treo gốc này dưới gốc kia.',
  summary:
    'Gộp các tập bằng union, leo lên gốc đại diện bằng find, và hỏi xem hai phần tử có cùng một tập không.',
  instruction:
    'Gõ hai phần tử rồi bấm Hợp a và b, Cùng tập? hoặc Tìm gốc của a, sau đó chạy từng bước để xem phép leo tới từng gốc. Bấm vào một nút bất kì, hoặc chọn nó rồi nhấn Enter, để chạy find trên nút đó. Mở Chuỗi để thấy những phép hợp kém may mắn dựng nên một cây cao thế nào.',
  aLabel: 'a',
  bLabel: 'b',
  union: 'Hợp a và b',
  same: 'Cùng tập?',
  find: 'Tìm gốc của a',
  undo: 'Hoàn tác',
  reset: 'Đặt lại',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Mở một mẫu…',
  presets: { friends: 'Nhóm bạn bè', chain: 'Chuỗi', random: 'Ngẫu nhiên' },
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'đang chạy',
  groupsTitle: 'Các tập hiện tại',
  groupsEmpty: 'không có phần tử',
  /** @param {DsuOp} op */
  opChip: (op) =>
    op.type === 'find'
      ? `find(${op.a})`
      : `${op.type === 'union' ? 'union' : 'same'}(${op.a}, ${op.b})`,
  groupText,
  /** @param {number[][]} groups */
  forestLabel: (groups) =>
    `${groups.reduce((s, g) => s + g.length, 0)} phần tử thuộc ${groups.length} tập: ${groups.map(groupText).join(', ')}.`,
  stats: {
    sets: 'Số tập',
    height: 'Cây cao nhất (số liên kết)',
    opSteps: 'Số liên kết đã đi (thao tác này)',
    steps: 'Số liên kết đã đi (tổng)',
  },
  logFull: 'Nhật kí đã đầy (16 thao tác). Hãy hoàn tác hoặc đặt lại để làm tiếp.',
  elementError: 'Phần tử phải là số nguyên từ 0 đến 9.',
  legend: {
    current: 'find đang ở đây',
    climbed: 'Đã leo qua',
    root: 'Đã tìm thấy gốc',
    linked: 'Vừa treo dưới gốc kia',
    operand: 'Toán hạng a hoặc b, chưa thăm',
  },
  markers: { current: '?', climbed: '↑', root: '✓', linked: '↓' },
  /** @param {DsuFrame} f */
  describe(f) {
    const op = f.op;
    const start = f.side === 'b' ? (op?.b ?? 0) : (op?.a ?? 0);
    const prev = f.path.length > 1 ? f.path[f.path.length - 2] : f.current;
    const root = f.side === 'b' ? f.rb : f.ra;
    switch (f.kind) {
      case 'start':
        return `Ban đầu mỗi phần tử đứng một mình: parent[x] = x, nên mỗi phần tử là gốc của tập riêng nó. Có ${f.sets} tập.`;
      case 'visit':
        return op?.type === 'find'
          ? `find(${start}): bắt đầu ở ${start} và leo theo liên kết parent cho đến khi gặp phần tử là cha của chính nó.`
          : `Tìm gốc của ${f.side} = ${start}: bắt đầu ở ${start}.`;
      case 'climb':
        return `parent[${prev}] = ${f.current}, nên leo lên ${f.current}.`;
      case 'root':
        return `parent[${root}] = ${root}: ${root} là gốc, tức tên của tập chứa ${start}. Ta đã đi qua ${f.path.length - 1} liên kết.`;
      case 'same-set':
        return `Cả hai gốc đều là ${f.ra}: ${op?.a} và ${op?.b} đã ở cùng một tập, nên không có gì thay đổi.`;
      case 'link':
        return `Hai gốc khác nhau, nên gán parent[${f.rb}] = ${f.ra}. Hai tập đã gộp thành một: còn ${f.sets} tập.`;
      case 'answer':
        return f.answer
          ? `Cả hai gốc đều là ${f.ra}: có, ${op?.a} và ${op?.b} ở cùng một tập.`
          : `Hai gốc ${f.ra} và ${f.rb} khác nhau: không, ${op?.a} và ${op?.b} ở hai tập khác nhau.`;
      case 'done':
        return `Xong: ${f.sets} tập, cây cao nhất dài ${f.height} liên kết, tổng cộng đã đi qua ${f.steps} liên kết parent.`;
    }
  },
  takeaways: [
    'Mỗi tập là một cây trong một mảng parent duy nhất. Gốc là cha của chính nó, và là phần tử đại diện của tập: hai phần tử cùng tập đúng khi find cho ra cùng một gốc.',
    'find(x) leo theo liên kết parent tới gốc. union(a, b) tìm hai gốc và, nếu chúng khác nhau, cho gốc này làm cha của gốc kia; số tập giảm đi một.',
    'Cấu trúc này trả lời các câu hỏi liên thông động theo kiểu trực tuyến: sau mỗi kết nối mới, em hỏi được hai phần tử có nối với nhau không mà không cần tìm kiếm lại trên đồ thị. Nó chỉ thêm liên kết; nó không tách được một tập.',
    'Cả hai thao tác tốn một bước cho mỗi liên kết phải leo, nên chi phí của chúng bằng chiều cao của cây. Nếu không cẩn thận, cây có thể thành một chuỗi cao n − 1.',
    'Thử “Chuỗi”: sáu phép hợp dựng nên một đường dài, và lần find(0) cuối cùng phải leo qua mọi liên kết. Bài sau sẽ sửa điều này.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'find(x)',
      'O(chiều cao), O(n) xấu nhất',
      'Mỗi liên kết parent một bước; một chuỗi có n − 1 liên kết.',
    ],
    ['union(a, b)', 'O(chiều cao)', 'Hai lần find, rồi một lần ghi parent.'],
    ['same(a, b)', 'O(chiều cao)', 'Hai lần find và một phép so sánh hai gốc.'],
    ['Bộ nhớ', 'O(n)', 'Mỗi phần tử một ô parent.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Mở Nhóm bạn bè và chạy đến bước cuối. Có bao nhiêu tập?',
      answer: 5,
      unit: 'tập',
      hints: ['Đọc ô Số tập, hoặc đếm số cây trong rừng. Phần tử đứng một mình cũng được tính.'],
      solution:
        'Các nhóm là {0, 1, 2, 3}, {4, 5, 6}, và các tập một phần tử {7}, {8}, {9}: 5 tập. Năm phép hợp mỗi lần gộp hai tập (10 − 5 = 5), còn union(0, 2) thấy hai phần tử đã ở cùng nhau.',
    },
    {
      type: 'number',
      prompt: 'Mở Chuỗi. Lần find(0) cuối cùng leo qua bao nhiêu liên kết parent?',
      answer: 6,
      unit: 'liên kết',
      hints: [
        'Mỗi lần union(k, k − 1) treo chuỗi cũ dưới phần tử mới k.',
        'Chạy từng bước thao tác cuối và theo dõi ô Số liên kết đã đi (thao tác này).',
      ],
      solution:
        'Các phép hợp dựng nên đường 0 → 1 → 2 → 3 → 4 → 5 → 6, nên find(0) leo qua 6 liên kết rồi mới tới gốc 6.',
    },
    {
      type: 'choice',
      prompt:
        'Bắt đầu lại từ đầu và chạy union(0, 1), union(2, 3), union(1, 3), trong đó union gán parent[rb] = ra. Sau đó parent[2] bằng bao nhiêu?',
      options: ['0', '1', '2', '3'],
      answer: 0,
      hints: ['union(1, 3) trước hết tìm gốc của 1 và của 3. Đó là những gốc nào?'],
      solution:
        'Sau hai phép hợp đầu, 1 treo dưới 0 và 3 treo dưới 2. union(1, 3) tìm được hai gốc 0 và 2, rồi gán parent[2] = 0. Để ý rằng 1 và 3 không bao giờ được nối trực tiếp: chỉ các gốc mới được nối.',
    },
    {
      type: 'choice',
      prompt: 'Câu hỏi nào DSU trả lời được nhanh khi các kết nối lần lượt xuất hiện?',
      options: [
        'Sau khi thêm liên kết c–d, a và b có liên thông không?',
        'Sau khi bỏ liên kết c–d, a và b còn liên thông không?',
        'Đường đi ngắn nhất từ a đến b là gì?',
        'Các liên kết đã được thêm theo thứ tự nào?',
      ],
      answer: 0,
      hints: ['union chỉ gộp các tập. Nó có bao giờ tách một tập ra không?'],
      solution:
        'Cấu trúc hỗ trợ thêm liên kết và hỏi hai phần tử có chung một tập không. Bỏ một liên kết có thể tách một tập, điều nó không làm ngược lại được, và nó không lưu đường đi hay lịch sử nào.',
    },
  ],
  nextTeaser: 'Bài sau giữ cho cây luôn thấp bằng hai mẹo nhỏ: hợp theo hạng và nén đường đi.',
};
