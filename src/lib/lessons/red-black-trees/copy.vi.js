/** @typedef {import('$lib/algo-engine/red-black-trees.js').RbFrame} RbFrame */
/** @typedef {import('$lib/algo-engine/red-black-trees.js').RbOp} RbOp */

/** Vietnamese names of the two rotation directions. */
const SIDE = /** @type {const} */ ({ left: 'trái', right: 'phải' });
/** Vietnamese colour names, as the engine's `color` field gives them. */
const COLOUR = /** @type {const} */ ({ red: 'đỏ', black: 'đen' });

export const vi = {
  slug: 'red-black-trees',
  topic: 'balanced-bst',
  level: 'Nâng cao',
  title: 'Cây đỏ đen',
  intro:
    'Cây đỏ đen tô cho mỗi nút một màu và giữ vài quy tắc về màu thay cho chiều cao chính xác. Hai nút đỏ không bao giờ nối tiếp nhau, và mọi đường đi có cùng số nút đen, nên đường dài nhất không quá hai lần đường ngắn nhất. Một lần chèn được sửa bằng cách tô lại màu và nhiều nhất hai phép quay.',
  summary:
    'Chèn khoá vào cây đỏ đen và theo dõi từng lần tô lại màu, từng phép quay, với các quy tắc màu và chiều cao đen được kiểm tra trực tiếp.',
  instruction:
    'Gõ một khoá rồi chèn hoặc tìm nó, sau đó chạy từng bước phần sửa cây. Các chữ cái đánh dấu z, cha P, chú U và ông G của nó. Hãy để ý danh sách quy tắc: trong lúc sửa, một quy tắc có thể bị vi phạm trong chốc lát. Mở ba dãy có sẵn theo từng trường hợp để xem riêng từng cách sửa.',
  keyLabel: 'Khoá',
  insert: 'Chèn',
  search: 'Tìm',
  undo: 'Hoàn tác',
  reset: 'Đặt lại',
  presetLabel: 'Dãy có sẵn',
  presetPlaceholder: 'Chọn một dãy có sẵn…',
  presets: {
    clrs: 'Ví dụ trong sách',
    uncle: 'Chú đỏ',
    inner: 'Chú đen, con phía trong',
    outer: 'Chú đen, con phía ngoài',
    sorted: 'Khoá tăng dần',
    random: 'Ngẫu nhiên',
  },
  full: 'Cây đã đầy (15 khoá).',
  logFull: 'Danh sách thao tác đã đầy (24 thao tác). Hãy hoàn tác hoặc đặt lại để làm tiếp.',
  keyError: 'Khoá phải là số nguyên từ 0 đến 99.',
  emptyTree: 'Cây đang rỗng.',
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác hiện tại',
  /** @param {RbOp} op */
  opChip: (op) => `${op.type === 'insert' ? vi.insert : vi.search} ${op.key}`,
  stats: {
    comparisons: 'Số phép so sánh (thao tác này)',
    recolours: 'Số lần đổi màu (tất cả)',
    rotations: 'Số phép quay (tất cả)',
    height: 'Chiều cao',
    blackHeight: 'Chiều cao đen của gốc',
    size: 'Số khoá',
  },
  uneven: 'không đều',
  /** @param {number} n */
  bound: (n) =>
    n === 0
      ? 'Cây rỗng có chiều cao 0.'
      : `Với ${n} khoá, chiều cao nhiều nhất là 2 log₂(n + 1) = ${(2 * Math.log2(n + 1)).toFixed(1).replace('.', ',')}.`,
  rulesTitle: 'Các quy tắc màu',
  rules: {
    colour: 'Mọi nút đều đỏ hoặc đen',
    root: 'Gốc màu đen',
    nil: 'Mọi lá NIL đều đen',
    redRed: 'Nút đỏ chỉ có con đen',
    black: 'Mọi đường đi từ một nút xuống các lá NIL của nó có cùng số nút đen',
  },
  ruleOk: '✓',
  ruleBroken: '✗',
  ruleOkLabel: 'đang thoả',
  ruleBrokenLabel: 'tạm thời bị vi phạm',
  /** @param {number} blackHeight */
  note: (blackHeight) => (blackHeight < 0 ? 'bh ?' : `bh ${blackHeight}`),
  colourLetter: { red: 'đỏ', black: 'đen' },
  colourName: COLOUR,
  legend: {
    red: 'đỏ: nút đỏ',
    black: 'đen: nút đen',
    z: 'z: nút đang được sửa',
    parent: 'P: cha',
    uncle: 'U: chú (anh em của cha)',
    grand: 'G: ông',
    compare: '?: khoá được so sánh trên đường đi xuống',
    path: 'đường đã đi qua',
    pivot: '↓: bị quay xuống',
    bh: 'bh: chiều cao đen, có đếm lá NIL nhưng không đếm chính nút đó',
  },
  roles: {
    compare: '?',
    z: 'z',
    parent: 'P',
    uncle: 'U',
    grand: 'G',
    pivot: '↓',
  },
  roleNames: {
    compare: 'đang so sánh',
    z: 'nút đang được sửa',
    parent: 'cha',
    uncle: 'chú',
    grand: 'ông',
    pivot: 'bị quay xuống',
  },
  /** @param {number[]} keys @param {number} h @param {number} bh */
  treeLabel: (keys, h, bh) =>
    `Cây đỏ đen gồm ${keys.length} khoá, chiều cao ${h}, chiều cao đen ${bh < 0 ? 'không đều' : bh}. Theo thứ tự giữa: ${keys.join(', ') || 'chưa có khoá nào'}.`,
  /** @param {number} key @param {string} colour @param {string} role @param {string} note */
  nodeLabel: (key, colour, role, note) =>
    `Khoá ${key}, ${colour}, ${note}${role ? `, ${role}` : ''}`,
  /** @param {RbFrame} f */
  describe(f) {
    const key = f.op?.key ?? 0;
    const k = (/** @type {number} */ s) => (s >= 0 ? f.nodes[s].key : 'NIL');
    const side = f.direction ? SIDE[f.direction] : '';
    switch (f.kind) {
      case 'start':
        return vi.emptyTree;
      case 'visit':
        return `So sánh ${key} với ${k(f.z)}.`;
      case 'go-left':
        return `${key} < ${k(f.z)}, nên rẽ trái.`;
      case 'go-right':
        return `${key} > ${k(f.z)}, nên rẽ phải.`;
      case 'attach':
        return `Gắn ${key} thành một lá đỏ. Màu đỏ không làm tăng số nút đen trên đường đi nào, nên chỉ các quy tắc về màu đỏ có thể bị vi phạm.`;
      case 'found':
        return `Đã tìm thấy ${key} sau ${f.comparisons} phép so sánh. Phép tìm không quan tâm đến màu.`;
      case 'missing':
        return `${key} không có trong cây.`;
      case 'dup':
        return `${key} đã có trong cây, nên lệnh chèn bị bỏ qua.`;
      case 'red-red':
        return `${k(f.z)} màu đỏ và cha ${k(f.parent)} của nó cũng đỏ. Nút chú là ${f.uncle < 0 ? 'một lá NIL, được tính là đen' : `${k(f.uncle)}, màu ${COLOUR[f.nodes[f.uncle].color]}`}, và chính nút chú quyết định cách sửa.`;
      case 'recolour-uncle':
        return `Nút chú màu đỏ: tô cha ${k(f.parent)} và chú ${k(f.uncle)} thành đen, ông ${k(f.grand)} thành đỏ. Số nút đen trên các đường vẫn bằng nhau, nhưng vấn đề có thể dời lên ${k(f.grand)}.`;
      case 'rotate-inner':
        return `Nút đang là con phía trong: quay ${side} tại ${k(f.pivot)} để nắn thẳng chỗ gập. Giờ ${k(f.z)} là con phía ngoài, các khoá vẫn như cũ và đúng thứ tự cũ.`;
      case 'recolour-outer':
        return `Nút chú màu đen và z là con phía ngoài: tô cha ${k(f.parent)} thành đen và ông ${k(f.grand)} thành đỏ, sẵn sàng để quay.`;
      case 'rotate-outer':
        return `Quay ${side} tại ${k(f.pivot)}: ${k(f.parent)} được đưa lên với màu đen, hai con của nó đều đỏ, và việc sửa đã xong.`;
      case 'parent-black':
        return `Cha của ${k(f.z)} màu đen, nên mọi quy tắc đều thoả và không cần làm gì thêm.`;
      case 'paint-root':
        return `Gốc đang đỏ, nên tô nó thành đen. Việc này thêm đúng một nút đen vào mọi đường đi cùng lúc, nên số nút đen trên các đường vẫn bằng nhau.`;
      case 'done':
        return f.size === 0
          ? vi.emptyTree
          : `Cây có ${f.size} khoá, chiều cao ${f.height} và chiều cao đen ${f.blackHeight}.`;
    }
  },
  takeaways: [
    'Các quy tắc: mọi nút đỏ hoặc đen, gốc và các lá NIL màu đen, nút đỏ chỉ có con đen, và mọi đường đi từ một nút xuống các lá NIL của nó có cùng số nút đen.',
    'Chiều cao đen bh đếm số nút đen bên dưới một nút, kể cả lá NIL. Một đường đi có bh nút đen chỉ xen được nhiều nhất bh nút đỏ, nên đường dài nhất không quá hai lần đường ngắn nhất, và chiều cao không quá 2 log₂(n + 1).',
    'Khoá mới luôn màu đỏ, nên số nút đen trên các đường vẫn bằng nhau và chỉ quy tắc về màu đỏ có thể bị vi phạm. Nếu chú đỏ, ta tô lại màu và đẩy vấn đề lên hai tầng. Nếu chú đen, một hoặc hai phép quay kết thúc việc sửa.',
    'Một lần chèn tốn nhiều nhất hai phép quay và O(log n) lần tô lại màu. Thao tác xoá, không minh hoạ ở đây, có nhiều trường hợp hơn nhưng cần nhiều nhất ba phép quay. Số lần đổi cấu trúc ít ỏi đó là lí do các thư viện như std::map của C++ và TreeMap của Java dùng loại cây này.',
    'Thử “Khoá tăng dần” và so sánh chiều cao với bài cây AVL: 10 khoá tăng dần cao 5 ở đây và 4 ở bên kia, đó là cái giá của quy tắc lỏng hơn. Sau đó mở “Chú đỏ” để xem một lần sửa không cần phép quay nào.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Tìm kiếm', 'O(log n)', 'Một đường đi từ gốc, và chiều cao không quá 2 log₂(n + 1).'],
    [
      'Chèn',
      'O(log n)',
      'Một lượt đi xuống, rồi tô lại màu có thể leo dần lên, với nhiều nhất 2 phép quay.',
    ],
    ['Xoá', 'O(log n)', 'Nhiều trường hợp hơn, không minh hoạ ở đây, với nhiều nhất 3 phép quay.'],
    ['Một phép quay', 'O(1)', 'Chỉ một số cố định liên kết thay đổi.'],
    ['Bộ nhớ', 'O(n)', 'Mỗi khoá một nút, cộng thêm một bit màu cho mỗi nút.'],
  ],
  nextTeaser:
    'Bài sau là cây B: mỗi nút chứa nhiều khoá và nhiều nhánh, tách đôi khi đầy, nên cây rất thấp và hợp với dữ liệu trên đĩa.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chèn 10, 20, 30 vào một cây rỗng. Qua cả ba lần chèn, tổng cộng có bao nhiêu lần một nút đổi màu?',
      answer: 3,
      unit: 'lần',
      hints: [
        'Khoá đầu tiên bắt đầu màu đỏ, mà gốc phải màu đen.',
        'Lần chèn thứ ba có chú đen (một lá NIL) và là con phía ngoài.',
      ],
      solution:
        'Khoá 10 được tô đen vì là gốc (1 lần). Rồi 30 có cha đỏ và chú là NIL, nên 20 thành đen và 10 thành đỏ (thêm 2 lần), và một phép quay trái tại 10 kết thúc việc sửa. Tổng là 3 lần đổi màu.',
    },
    {
      type: 'choice',
      prompt: 'Một nút đỏ mới có cha đỏ và chú đỏ. Việc sửa sẽ làm gì?',
      options: [
        'Quay tại nút ông',
        'Tô cha và chú thành đen, ông thành đỏ, rồi làm tiếp từ nút ông',
        'Tô nút mới thành đen',
        'Quay tại nút cha, rồi dừng',
      ],
      answer: 1,
      hints: ['Không cần phép quay khi cả hai con của nút ông đều đỏ.'],
      solution:
        'Chuyển màu đen từ nút ông xuống cả hai con giữ cho số nút đen trên mọi đường vẫn bằng nhau và xoá cặp đỏ-đỏ ở đây. Nút ông giờ màu đỏ, nên cha của nó có thể cần kiểm tra y như vậy.',
    },
    {
      type: 'number',
      prompt:
        'Mở “Ví dụ trong sách”, dãy này chèn 11, 2, 14, 1, 7, 15, 5, 8, 4. Cuối cùng khoá nào ở gốc?',
      answer: 7,
      hints: [
        'Chạy đến khung hình cuối và đọc nút trên cùng của cây.',
        'Lần chèn cuối, khoá 4, leo lên rồi quay hai lần.',
      ],
      solution:
        'Khoá 4 trước hết được tô lại màu vì có chú đỏ, đẩy vấn đề lên 7. Rồi 7 là con phía trong có chú đen, nên một phép quay trái tại 2 và một phép quay phải tại 11 đưa 7 lên làm gốc.',
    },
    {
      type: 'number',
      prompt: 'Trong cây cuối cùng đó, chiều cao đen của gốc là bao nhiêu?',
      answer: 2,
      hints: [
        'Đi theo một đường bất kì, chẳng hạn 7 → 2 → 1 → NIL, và đếm các nút đen bên dưới gốc.',
        'Đếm cả lá NIL nhưng không đếm gốc.',
      ],
      solution:
        'Trên đường 7 → 2 → 1 → NIL, nút 2 màu đỏ, còn nút 1 và lá NIL màu đen, nên được 2. Mọi đường khác cũng cho cùng kết quả.',
    },
    {
      type: 'number',
      prompt:
        'Với cây có 15 khoá, chặn trên 2 log₂(n + 1) cho phép chiều cao lớn nhất là bao nhiêu?',
      answer: 8,
      hints: ['Tính log₂ 16 trước.'],
      solution:
        '2 log₂(15 + 1) = 2 × 4 = 8. Một cây hoàn hảo có 15 khoá thì cao 4, nên chặn trên cho phép gấp đôi mức đó.',
    },
    {
      type: 'number',
      prompt: 'Chèn lần lượt 1, 2, 3, 4, 5, 6, 7. Cây đỏ đen cuối cùng cao bao nhiêu?',
      answer: 4,
      hints: ['Bấm “Đặt lại” trước, rồi gõ từng khoá một và đọc ô chiều cao.'],
      solution:
        'Cây cuối cùng có gốc 2 và cao 4, theo đường 2 → 4 → 6 → 7. Cây AVL với cùng dãy chèn chỉ cao 3, vì quy tắc của nó chặt hơn.',
    },
    {
      type: 'multi',
      prompt: 'Khi đã sửa xong, những điều nào luôn đúng với một cây đỏ đen?',
      options: [
        'Các con của một nút đỏ đều màu đen',
        'Đường dài nhất từ gốc đến NIL không quá hai lần đường ngắn nhất',
        'Mọi lá đều ở cùng một độ sâu',
        'Trên mọi đường đi, đỏ và đen xen kẽ nhau',
      ],
      answers: [0, 1],
      hints: [
        'Hai nút đen liền nhau vẫn hợp lệ.',
        'Chỉ số nút đen phải bằng nhau, độ sâu thì không cần.',
      ],
      solution:
        'Hai nút đỏ liền nhau bị cấm, và vì mọi đường có cùng số nút đen với nhiều nhất một nút đỏ đi kèm mỗi nút đen, đường dài nhất không quá hai lần đường ngắn nhất. Độ sâu có thể khác nhau, và các nút đen có thể nối tiếp nhau.',
    },
    {
      type: 'order',
      prompt:
        'Nút mới z là con phía trong và chú của nó màu đen. Sắp xếp các bước sửa theo đúng thứ tự.',
      items: [
        'Tô cha thành đen và ông thành đỏ',
        'Quay tại nút cha để hình dạng mới thành con phía ngoài',
        'Quay tại nút ông',
      ],
      answer: [1, 0, 2],
      hints: ['Nắn thẳng chỗ gập trước, rồi tô lại màu, rồi nâng lên.'],
      solution:
        'Trước hết quay tại nút cha để chỗ gập thành đường thẳng. Rồi tô nút giờ đang nằm trên z thành đen và nút ông thành đỏ, sau đó quay tại nút ông. Không cần làm gì thêm.',
    },
  ],
};
