/** @typedef {import('$lib/algo-engine/practice-union-find.js').StreamFrame} StreamFrame */
/** @typedef {import('$lib/algo-engine/practice-union-find.js').Edge} Edge */

import { letter } from '$lib/components/graph-editor.js';

/** @param {Edge} e */
const edgeName = ([u, v]) => `${letter(u)}–${letter(v)}`;
/** Vietnamese nouns do not inflect for number. @param {number} k @param {string} [noun] */
const plural = (k, noun = 'thành phần') => `${k} ${noun}`;

export const vi = {
  slug: 'practice-union-find',
  topic: 'union-find',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán hợp và tìm',
  intro:
    'Union-find phát huy sức mạnh khi đồ thị đến dần từng cạnh một. Mỗi cạnh mới tốn hai lần find: nếu hai đầu đã có chung gốc, cạnh đó khép kín một chu trình; ngược lại, một phép union gộp hai thành phần. Sau mỗi cạnh, ta đã biết số thành phần và chu trình đầu tiên, mà không phải tìm kiếm trên cả đồ thị.',
  summary:
    'Đưa một dòng cạnh vào union-find, đếm số thành phần liên thông theo kiểu trực tuyến và đánh dấu mọi cạnh khép kín một chu trình.',
  instruction:
    'Mở một dòng cạnh có sẵn hoặc tự thêm cạnh bằng Từ, Đến và Thêm cạnh, rồi chạy từng bước. Các đỉnh được tô màu và gọi tên theo thành phần; cạnh nét đứt màu xám là cạnh chưa đến, cạnh đậm đã nối hai thành phần, còn cạnh đỏ có dấu ✕ đã khép kín một chu trình. Hoàn tác sẽ bỏ cạnh cuối cùng.',
  fromLabel: 'Từ',
  toLabel: 'Đến',
  add: 'Thêm cạnh',
  undo: 'Hoàn tác',
  clear: 'Xoá hết',
  presetLabel: 'Dòng cạnh',
  presetPlaceholder: 'Mở một dòng cạnh…',
  presets: { roads: 'Mạng đường', tree: 'Cây khung', random: 'Ngẫu nhiên' },
  letter,
  edgeName,
  streamTitle: 'Dòng cạnh',
  streamEmpty: 'chưa có cạnh nào',
  historyTitle: 'Số thành phần sau mỗi cạnh',
  historyEmpty: 'chưa xử lí cạnh nào',
  hotLabel: 'cạnh đang xét',
  /** @param {number} i @param {Edge} e @param {'pending'|'tree'|'cycle'} s */
  streamChip: (i, e, s) =>
    `#${i + 1} ${edgeName(e)}${s === 'tree' ? ' ✓' : s === 'cycle' ? ' ✕' : ''}`,
  /** @param {number} i @param {number} c */
  historyChip: (i, c) => `#${i + 1}: ${c}`,
  stats: {
    components: 'Số thành phần',
    accepted: 'Số cạnh đã gộp',
    cycles: 'Số cạnh khép chu trình',
    first: 'Cạnh đầu tiên khép chu trình',
  },
  /** @param {number} i */
  firstCycle: (i) => (i < 0 ? '—' : `#${i + 1}`),
  /** @param {number} c */
  setNote: (c) => `tập ${letter(c)}`,
  legend: {
    pending: 'Chưa đến',
    tree: '✓ Đã gộp hai thành phần',
    cycle: '✕ Đã khép kín chu trình',
    current: 'Cạnh đang xử lí',
    component: 'Màu đỉnh và tên “tập”: thành phần của đỉnh',
  },
  /** @param {number} v @param {number} c @param {boolean} current */
  vertexLabel: (v, c, current) =>
    `Đỉnh ${letter(v)}, thuộc tập ${letter(c)}${current ? ', một đầu của cạnh đang xét' : ''}`,
  /** @param {number} i @param {Edge} e @param {'pending'|'tree'|'cycle'} s */
  edgeLabel: (i, e, s) =>
    `Cạnh #${i + 1} ${edgeName(e)}: ${s === 'pending' ? 'chưa đến' : s === 'tree' ? 'đã gộp hai thành phần' : 'đã khép kín chu trình'}`,
  /** @param {number[][]} groups @param {string[]} flagged */
  graphLabel: (groups, flagged) =>
    `${plural(groups.length)}: ${groups.map((g) => `{${g.map(letter).join(', ')}}`).join(', ')}. ${
      flagged.length
        ? `Các cạnh khép kín chu trình: ${flagged.join(', ')}.`
        : 'Chưa cạnh nào khép kín chu trình.'
    }`,
  edits: {
    loop: 'Hãy chọn hai đỉnh khác nhau: cạnh nối một đỉnh với chính nó là một chu trình tầm thường.',
    repeat: 'Cạnh này đã có trong dòng cạnh.',
    full: 'Dòng cạnh đã đầy (16 cạnh). Hãy hoàn tác hoặc xoá hết để làm tiếp.',
  },
  /** @param {StreamFrame} f @param {Edge[]} edges */
  describe(f, edges) {
    const e = f.edgeIndex >= 0 ? edges[f.edgeIndex] : null;
    const name = e ? `#${f.edgeIndex + 1} ${edgeName(e)}` : '';
    switch (f.kind) {
      case 'start':
        return `${edges.length === 0 ? 'Chưa có cạnh nào.' : `${edges.length} cạnh sẽ lần lượt đến từng cạnh một.`} Ban đầu mỗi đỉnh đứng một mình: ${plural(f.components)}.`;
      case 'take':
        return `Cạnh ${name}: find(${letter(e?.[0] ?? 0)}) = ${letter(f.ru)}, find(${letter(e?.[1] ?? 0)}) = ${letter(f.rv)}.`;
      case 'cycle':
        return `Cùng gốc ${letter(f.ru)}: hai đầu đã liên thông, nên ${name} khép kín một chu trình. Đánh dấu cạnh này; vẫn còn ${plural(f.components)}.`;
      case 'merge':
        return `Hai gốc khác nhau: hợp chúng lại. Hai thành phần đã gộp thành một: còn ${plural(f.components)}.`;
      case 'done':
        return `Đã xử lí hết ${plural(edges.length, 'cạnh')}: còn ${plural(f.components)}, ${plural(f.cycles, 'cạnh')} khép kín chu trình${
          f.firstCycle >= 0 ? `, cạnh đầu tiên là #${f.firstCycle + 1}` : ''
        }.`;
    }
  },
  takeaways: [
    'Đếm thành phần theo kiểu trực tuyến: bắt đầu từ n và trừ đi một với mỗi cạnh mà hai đầu có gốc khác nhau. Số đếm đúng sau từng cạnh một.',
    'Phát hiện chu trình: một cạnh mà hai đầu đã có chung gốc sẽ khép kín một chu trình, vì giữa hai đầu đã có sẵn một đường đi. Thuật toán Kruskal bỏ qua đúng những cạnh này.',
    'Các cạnh được nhận tạo thành một rừng khung. Rừng ấy luôn có n − c cạnh, với c là số thành phần, nên n − 1 cạnh nối được mọi đỉnh mà không tạo chu trình.',
    'Mỗi cạnh tốn hai lần find và nhiều nhất một lần union, tức O(α(n)) khi dùng cả hai mẹo tối ưu, thay vì một lần tìm kiếm O(V + E) mới cho mỗi cạnh.',
    'Thử “Mạng đường”: chạy đến cạnh #4 để xem vì sao A–D bị đánh dấu, rồi hoàn tác các cạnh cho đến khi không còn chu trình.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Xử lí m cạnh trên n đỉnh',
      'O(n + m α(n))',
      'Khởi tạo, rồi mỗi cạnh hai lần find và có thể một lần union.',
    ],
    [
      'Cùng bài toán, mỗi cạnh một lần tìm kiếm',
      'O(m (n + m))',
      'BFS hoặc DFS trên các cạnh đã có, với mỗi cạnh mới.',
    ],
    ['Số thành phần sau mỗi cạnh', 'O(1) mỗi lần', 'Một bộ đếm giảm đi sau mỗi lần gộp.'],
    ['Bộ nhớ', 'O(n)', 'Mỗi đỉnh một ô parent và một ô size; không cần lưu các cạnh.'],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Mở Mạng đường và chạy đến bước cuối. Còn lại bao nhiêu thành phần?',
      answer: 2,
      unit: 'thành phần',
      hints: [
        'Đọc ô Số thành phần ở bước cuối. Một đỉnh không có cạnh nào cũng là một thành phần.',
      ],
      solution:
        'Từ A đến G cuối cùng thuộc một thành phần, còn H không bao giờ có cạnh, nên còn 2 thành phần.',
    },
    {
      type: 'number',
      prompt: 'Trong Mạng đường, cạnh số mấy là cạnh đầu tiên khép kín chu trình?',
      answer: 4,
      hints: [
        'Chạy từng bước qua dòng cạnh và để ý cạnh đỏ đầu tiên.',
        'Sau A–B, C–D và B–C, A và D đã liên thông chưa?',
      ],
      solution:
        'Cạnh #4 A–D: đường A–B–C–D đã nối sẵn hai đầu của nó, nên find(A) và find(D) trả về cùng một gốc.',
    },
    {
      type: 'number',
      prompt: 'Trong Mạng đường, ngay sau cạnh #6 có bao nhiêu thành phần?',
      answer: 3,
      unit: 'thành phần',
      hints: ['Danh sách Số thành phần sau mỗi cạnh cho biết số đếm sau từng cạnh.'],
      solution:
        'Các cạnh #1, #2, #3, #5 và #6 mỗi cạnh gộp hai thành phần, còn #4 khép kín một chu trình: 8 − 5 = 3 thành phần, {A, B, C, D}, {E, F, G} và {H}.',
    },
    {
      type: 'number',
      prompt:
        'Dựng lại Mạng đường mà không có cạnh #8 (D–E): mở nó, hoàn tác hai cạnh cuối, rồi thêm lại B–F. Giờ có bao nhiêu cạnh khép kín chu trình?',
      answer: 2,
      unit: 'cạnh',
      hints: [
        'Không có D–E, khi B–F đến thì B đã liên thông với F chưa?',
        'Chạy đến bước cuối rồi đọc ô Số cạnh khép chu trình.',
      ],
      solution:
        'A–D và G–E vẫn khép kín chu trình, nhưng giờ B–F lần đầu nối {A, B, C, D} với {E, F, G}, nên nó gộp hai thành phần. Một cạnh có bị đánh dấu hay không phụ thuộc vào các cạnh đến trước nó.',
    },
    {
      type: 'number',
      prompt:
        'Một dòng cạnh trên 8 đỉnh kết thúc với 3 thành phần và không cạnh nào từng khép kín chu trình. Dòng cạnh đó có bao nhiêu cạnh?',
      answer: 5,
      unit: 'cạnh',
      hints: ['Mỗi cạnh được nhận làm số thành phần giảm đúng một, bắt đầu từ 8.'],
      solution:
        'Mỗi cạnh được nhận gộp hai thành phần, nên đi từ 8 xuống 3 cần 8 − 3 = 5 cạnh. Mở Cây khung để xem trường hợp còn 1 thành phần: 7 cạnh.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao nên dùng union-find thay vì chạy BFS trước mỗi cạnh mới để kiểm tra hai đầu của nó có liên thông không?',
      options: [
        'BFS cho kết quả sai trên đồ thị vô hướng.',
        'Union-find tốn khoảng O(α(n)) cho mỗi cạnh, còn mỗi lần BFS có thể phải quét lại cả đồ thị.',
        'Union-find còn tìm được chu trình ngắn nhất.',
        'Union-find có thể xoá cạnh về sau, còn BFS thì không.',
      ],
      answer: 1,
      hints: ['So sánh chi phí cho mỗi cạnh của hai cách.'],
      solution:
        'Cả hai đều đúng, nhưng mỗi lần BFS cho một cạnh tốn O(V + E), còn union-find giữ các thành phần luôn cập nhật với thời gian gần như hằng số cho mỗi cạnh. Nó không xoá được cạnh và không cho biết gì về độ dài chu trình.',
    },
  ],
  nextTeaser:
    'Bài sau dùng chính phép phát hiện chu trình này cho cây khung: tính chất lát cắt và cây khung nhỏ nhất cơ bản.',
};
