import { balanceOf } from '$lib/algo-engine/avl-trees.js';

/** @typedef {import('$lib/algo-engine/avl-trees.js').AvlFrame} AvlFrame */
/** @typedef {import('$lib/algo-engine/avl-trees.js').AvlOp} AvlOp */

/** Vietnamese names of the two rotation directions. */
const SIDE = /** @type {const} */ ({ left: 'trái', right: 'phải' });

/**
 * The tallest AVL tree that `n` keys can form, from the fewest keys each height needs:
 * N(h) = N(h − 1) + N(h − 2) + 1.
 * @param {number} n
 */
function tallest(n) {
  let h = 1;
  let shorter = 0;
  let fewest = 1;
  while (fewest + shorter + 1 <= n) {
    [shorter, fewest] = [fewest, fewest + shorter + 1];
    h++;
  }
  return h;
}

export const vi = {
  slug: 'avl-trees',
  topic: 'balanced-bst',
  level: 'Trung bình',
  title: 'Cây AVL',
  intro:
    'Cây AVL là một cây nhị phân tìm kiếm (BST) mà tại mọi nút, chiều cao hai cây con lệch nhau không quá 1. Mỗi nút lưu chiều cao của nó; sau mỗi thay đổi, các nút tổ tiên kiểm tra lại hệ số cân bằng trên đường đi ngược lên và quay ngay khi có nút đạt ±2.',
  summary:
    'Chèn và xoá khoá trên cây AVL, đọc hệ số cân bằng của từng nút, và chạy từng bước các phép quay đơn, quay kép sửa lại cây.',
  instruction:
    'Gõ một khoá hoặc bấm vào một nút, rồi chèn, tìm hoặc xoá. Mỗi nút hiện hệ số cân bằng của nó. Chạy từng bước lượt đi xuống và lượt kiểm tra ngược lên, và mở bốn dãy có sẵn theo từng trường hợp để xem từng kiểu quay.',
  keyLabel: 'Khoá',
  insert: 'Chèn',
  search: 'Tìm',
  remove: 'Xoá',
  undo: 'Hoàn tác',
  reset: 'Đặt lại',
  presetLabel: 'Dãy có sẵn',
  presetPlaceholder: 'Chọn một dãy có sẵn…',
  presets: {
    ll: 'Trái-trái',
    rr: 'Phải-phải',
    lr: 'Trái-phải',
    rl: 'Phải-trái',
    sorted: 'Khoá tăng dần',
    cascade: 'Xoá phải quay hai lần',
    random: 'Ngẫu nhiên',
  },
  full: 'Cây đã đầy (15 khoá).',
  logFull: 'Danh sách thao tác đã đầy (20 thao tác). Hãy hoàn tác hoặc đặt lại để làm tiếp.',
  keyError: 'Khoá phải là số nguyên từ 0 đến 99.',
  emptyTree: 'Cây đang rỗng.',
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác hiện tại',
  /** @param {AvlOp} op */
  opChip: (op) =>
    `${op.type === 'insert' ? vi.insert : op.type === 'search' ? vi.search : vi.remove} ${op.key}`,
  stats: {
    comparisons: 'Số phép so sánh (thao tác này)',
    opRotations: 'Số phép quay (thao tác này)',
    rotations: 'Số phép quay (tất cả)',
    height: 'Chiều cao',
    size: 'Số khoá',
  },
  /** @param {number} n */
  bound: (n) =>
    n === 0
      ? 'Cây rỗng có chiều cao 0.'
      : `Với ${n} khoá, cây AVL cao nhiều nhất là ${tallest(n)}.`,
  casesTitle: 'Bốn cách sửa',
  caseHead: ['Trường hợp', 'Hình dạng', 'Cách sửa'],
  cases: {
    LL: ['Con trái lệch trái hoặc cân', 'Quay phải'],
    LR: ['Con trái lệch phải', 'Quay trái tại con, rồi quay phải'],
    RR: ['Con phải lệch phải hoặc cân', 'Quay trái'],
    RL: ['Con phải lệch trái', 'Quay phải tại con, rồi quay trái'],
  },
  caseCurrent: '(lúc này)',
  /** @param {number} bf */
  signed: (bf) => `${bf > 0 ? '+' : bf < 0 ? '−' : ''}${Math.abs(bf)}`,
  /** @param {number} bf */
  note: (bf) => `bf ${vi.signed(bf)}`,
  /** @param {number[]} keys @param {number} h */
  treeLabel: (keys, h) =>
    `Cây AVL gồm ${keys.length} khoá, chiều cao ${h}. Theo thứ tự giữa: ${keys.join(', ') || 'chưa có khoá nào'}.`,
  /** @param {string} key @param {string} note @param {string} state */
  nodeLabel: (key, note, state) => `Khoá ${key}, ${note}${state ? `, ${state}` : ''}`,
  roles: {
    compare: 'đang so sánh',
    path: 'trên đường đi',
    added: 'mới',
    retrace: 'đang kiểm tra lại',
    unbalanced: 'mất cân bằng',
    up: 'được quay lên',
    down: 'bị quay xuống',
    successor: 'nút kế tiếp',
  },
  markers: {
    compare: '?',
    path: '',
    added: '+',
    retrace: '✓',
    unbalanced: '!',
    up: '↑',
    down: '↓',
    successor: 'S',
  },
  /** @param {AvlFrame} f */
  describe(f) {
    const key = f.op?.key ?? 0;
    const at = f.current >= 0 ? f.nodes[f.current].key : null;
    const side = f.direction ? SIDE[f.direction] : '';
    switch (f.kind) {
      case 'start':
        return vi.emptyTree;
      case 'visit':
        return `So sánh ${key} với ${at}.`;
      case 'go-left':
        return `${key} < ${at}, nên rẽ trái.`;
      case 'go-right':
        return `${key} > ${at}, nên rẽ phải.`;
      case 'insert':
        return `Gắn ${key} thành một lá mới. Chiều cao của các nút phía trên giờ đã cũ, nên ta đi ngược lên.`;
      case 'found':
        return f.op?.type === 'delete'
          ? `Đã tìm thấy ${key}, nút cần xoá.`
          : `Đã tìm thấy ${key} sau ${f.comparisons} phép so sánh. Phép tìm không làm thay đổi gì.`;
      case 'missing':
        return `${key} không có trong cây.`;
      case 'dup':
        return `${key} đã có trong cây, nên lệnh chèn bị bỏ qua.`;
      case 'successor':
        return `Nút có hai con: nút kế tiếp là khoá nhỏ nhất bên phải, ta đi về phía ${f.nodes[f.succ].key}.`;
      case 'copy':
        return `Chép khoá kế tiếp ${f.nodes[f.succ].key} vào nút đang giữ ${key}. Nút cũ của nó sẽ bị gỡ ngay sau đây.`;
      case 'unlink':
        return `Nút đã được gỡ khỏi cây. Các nút tổ tiên giờ có thể bị thấp đi ở phía này, nên ta đi ngược lên.`;
      case 'retrace':
        return `Tại ${at}, cập nhật chiều cao thành ${f.nodes[f.current].height}. Hệ số cân bằng của nút là ${vi.signed(balanceOf(f.nodes, f.current))}.`;
      case 'unbalanced':
        return `${at} có hệ số cân bằng ${vi.signed(balanceOf(f.nodes, f.current))}, nên quy tắc chiều cao bị vi phạm. Đây là trường hợp ${f.imbalance}.`;
      case 'rotate': {
        const up = f.nodes[f.moved].key;
        const down = f.nodes[f.sunk].key;
        return f.prepares
          ? `Nửa đầu của ${f.imbalance}: quay ${side} tại ${down}, nên ${up} được đưa lên và chỗ gập được nắn thành một đường thẳng.`
          : `Quay ${side} tại ${down}: ${up} được đưa lên, ${down} bị đưa xuống, và cây con này cân bằng trở lại.`;
      }
      case 'done':
        return f.size === 0
          ? vi.emptyTree
          : `Cây có ${f.size} khoá và chiều cao ${f.height}, mọi hệ số cân bằng đều nằm trong ±1.`;
    }
  },
  takeaways: [
    'Hệ số cân bằng là chiều cao(trái) − chiều cao(phải). Bất biến AVL nói rằng nó bằng −1, 0 hoặc +1 tại mọi nút.',
    'Hệ số +2 chỉ về con trái, −2 chỉ về con phải. Nếu nút con lệch cùng phía hoặc cân, một phép quay là đủ (LL, RR). Nếu nó lệch ngược phía, phép quay thứ nhất nắn thẳng chỗ gập và phép quay thứ hai sửa xong (LR, RL).',
    'Số khoá ít nhất của một cây cao h thoả N(h) = N(h − 1) + N(h − 2) + 1, tăng giống dãy Fibonacci. Vì vậy h luôn dưới khoảng 1,44 log₂(n + 2), và mọi thao tác đều tốn O(log n).',
    'Sau một lần chèn, chỉ cần sửa một lần, vì việc sửa đưa cây con về đúng chiều cao cũ. Một lần xoá có thể làm cây con thấp đi, nên có thể phải quay ở nhiều tầng trên đường đi ngược lên.',
    'Thử “Xoá phải quay hai lần”: 12 khoá tạo nên cây thưa nhất có thể với chiều cao 5, và xoá 80 khiến nút 70 rồi đến gốc phải cân bằng lại. Sau đó mở “Khoá tăng dần” và đếm số phép quay.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Tìm kiếm', 'O(log n)', 'Một đường đi từ gốc, và chiều cao dưới 1,44 log₂(n + 2).'],
    [
      'Chèn',
      'O(log n)',
      'Một lượt đi xuống, một lượt kiểm tra ngược lên, và nhiều nhất một lần sửa gồm 1 hoặc 2 phép quay.',
    ],
    [
      'Xoá',
      'O(log n)',
      'Một lượt đi xuống, một lượt kiểm tra ngược lên, và mỗi tầng nhiều nhất một lần sửa.',
    ],
    ['Một phép quay', 'O(1)', 'Chỉ một số cố định liên kết và hai chiều cao đã lưu thay đổi.'],
    ['Bộ nhớ', 'O(n)', 'Mỗi khoá một nút, mỗi nút lưu thêm một chiều cao nhỏ.'],
  ],
  nextTeaser:
    'Bài sau gặp cây đỏ đen: thay vì lưu chiều cao, mỗi nút chỉ mang một màu, và vài quy tắc tô màu đủ giữ cây thấp.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chèn lần lượt 40, 20, 60, 10, 30, 25. Ngay trước phép quay, hệ số cân bằng của gốc 40 là bao nhiêu?',
      answer: 2,
      hints: [
        'Chiều cao đếm số nút. Cây con phải chỉ có 60.',
        'Bên trái, đường dài nhất là 20 → 30 → 25.',
      ],
      solution:
        'chiều cao(trái) = 3 theo đường 20, 30, 25, và chiều cao(phải) = 1 với 60. Vậy hệ số là 3 − 1 = +2, vi phạm quy tắc AVL.',
    },
    {
      type: 'choice',
      prompt: 'Cũng trong cây đó, trường hợp nào sửa nút 40?',
      options: [
        'LL: quay phải',
        'LR: quay trái tại 20, rồi quay phải tại 40',
        'RR: quay trái',
        'RL: quay phải tại 60, rồi quay trái tại 40',
      ],
      answer: 1,
      hints: [
        'Hệ số +2 nghĩa là phía trái quá cao. Giờ hãy nhìn con trái, nút 20.',
        'Nút 20 có chiều cao bên trái là 1 và bên phải là 2.',
      ],
      solution:
        'Con trái 20 có hệ số cân bằng 1 − 2 = −1, nên nó lệch phải. Chỗ gập đó là trường hợp LR: quay trái tại 20 để đưa 30 lên, rồi quay phải tại 40, khi đó 30 thành gốc.',
    },
    {
      type: 'text',
      prompt: 'Chèn 10, 20, 30 vào một cây AVL rỗng. Phép quay sửa cây quay về phía nào?',
      accept: [
        'trái',
        'quay trái',
        'phép quay trái',
        'quay trái đơn',
        'phép quay trái đơn',
        'sang trái',
        'left',
        'rotate left',
      ],
      hints: ['Toàn bộ sức nặng dồn về bên phải, trên một đường thẳng.'],
      solution:
        'Nút 10 có hệ số −2 và con phải 20 cũng lệch phải. Đó là trường hợp RR: một phép quay trái đơn tại 10, đưa 20 lên làm gốc.',
    },
    {
      type: 'number',
      prompt:
        'Mở dãy có sẵn “Khoá tăng dần”, dãy này chèn các khoá từ 1 đến 10. Tổng cộng cây tốn bao nhiêu phép quay đơn?',
      answer: 6,
      unit: 'phép quay',
      hints: ['Đến bước cuối rồi đọc ô “Số phép quay (tất cả)”.'],
      solution:
        'Các khoá 3, 5, 6, 7, 9 và 10, mỗi khoá gây ra một phép quay trái, tổng là 6. Cây cuối cùng cao 4, chứ không phải 10.',
    },
    {
      type: 'number',
      prompt: 'Một cây AVL cao 5 có ít nhất bao nhiêu khoá?',
      answer: 12,
      unit: 'khoá',
      hints: [
        'Cây thưa nhất có chiều cao h gồm một gốc, một cây con thưa nhất cao h − 1 và một cây con thưa nhất cao h − 2.',
        'N(0) = 0, N(1) = 1, và N(h) = N(h − 1) + N(h − 2) + 1.',
      ],
      solution:
        'N(2) = 2, N(3) = 4, N(4) = 7, và N(5) = 7 + 4 + 1 = 12. Dãy có sẵn “Xoá phải quay hai lần” dựng đúng một cây như vậy.',
    },
    {
      type: 'multi',
      prompt: 'Những khẳng định nào về cây AVL là đúng?',
      options: [
        'Sau một lần chèn, sửa một lần là luôn đủ',
        'Một lần xoá có thể cần sửa ở nhiều tầng',
        'Hai cây con của mọi nút có chiều cao bằng nhau',
        'Phép quay chỉ tạm thời làm đổi thứ tự tăng dần của các khoá',
      ],
      answers: [0, 1],
      hints: [
        'So sánh chiều cao của cây con đã sửa với chiều cao của nó trước khi thay đổi.',
        'Hệ số cân bằng +1 có được phép không?',
      ],
      solution:
        'Lần sửa sau khi chèn đưa cây con về đúng chiều cao cũ, nên phía trên không có gì đổi; còn lần sửa sau khi xoá có thể để cây con thấp đi một tầng, nên các nút tổ tiên có thể phải tự sửa tiếp. Hệ số ±1 vẫn được phép, và phép quay không bao giờ làm đổi thứ tự tăng dần.',
    },
    {
      type: 'order',
      prompt: 'Sắp xếp các bước của thao tác chèn vào cây AVL theo đúng thứ tự.',
      items: [
        'Quay nếu có hệ số đạt ±2',
        'Đi xuống từ gốc, so sánh các khoá',
        'Tính lại chiều cao và hệ số cân bằng của một nút tổ tiên',
        'Gắn khoá mới thành một lá',
      ],
      answer: [1, 3, 2, 0],
      hints: ['Việc cân bằng lại diễn ra trên đường đi ngược lên, sau khi đã có lá mới.'],
      solution:
        'Trước hết đi xuống, rồi gắn lá. Trên đường đi ngược lên, mỗi nút tổ tiên cập nhật chiều cao và hệ số, và quay ngay khi hệ số đạt ±2.',
    },
    {
      type: 'number',
      prompt:
        'Mở “Xoá phải quay hai lần” và chạy đến khung hình cuối của lần xoá sau cùng, tức trước bước kết thúc một bước. Lần xoá đó đã tốn bao nhiêu phép quay đơn?',
      answer: 3,
      unit: 'phép quay',
      hints: [
        'Đọc ô “Số phép quay (thao tác này)” ở đó; khung hình cuối cùng không thuộc thao tác nào và hiện 0.',
        'Lần sửa đầu tiên là một phép quay kép.',
      ],
      solution:
        'Xoá 80 khiến nút 70 có hệ số +2 và con trái lệch phải, phải sửa kiểu LR gồm 2 phép quay. Cây con đó giờ thấp đi, nên gốc 50 đạt +2 và cần thêm một phép quay đơn, tổng là 3.',
    },
  ],
};
