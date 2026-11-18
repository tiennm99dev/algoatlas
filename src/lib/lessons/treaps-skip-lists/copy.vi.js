import { MAX_TOWER } from '$lib/algo-engine/treaps-skip-lists.js';

/** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').SkipFrame} SkipFrame */
/** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').SkipOp} SkipOp */
/** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').TreapFrame} TreapFrame */
/** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').TreapOp} TreapOp */

/** Vietnamese names of the two rotation directions. */
const SIDE = /** @type {const} */ ({ left: 'trái', right: 'phải' });
/** @param {SkipOp | TreapOp} op */
const opChip = (op) =>
  `${op.type === 'insert' ? vi.insert : op.type === 'search' ? vi.search : vi.remove} ${op.key}`;
/** @param {number} x */
const decimal = (x) => x.toFixed(1).replace('.', ',');

export const vi = {
  slug: 'treaps-skip-lists',
  topic: 'balanced-bst',
  level: 'Nâng cao',
  title: 'Treap và skip list',
  intro:
    'Thay cho các quy tắc cân bằng chặt chẽ, hai cấu trúc này dùng sự ngẫu nhiên. Skip list xếp chồng nhiều danh sách liên kết (linked list) đã sắp xếp, chiều cao cột của mỗi khoá do tung đồng xu quyết định, nên phép tìm đi nhanh trên các tầng cao rồi tụt dần xuống. Treap gán cho mỗi khoá một độ ưu tiên ngẫu nhiên và giữ cây vừa là BST theo khoá, vừa là heap nhỏ nhất theo độ ưu tiên, nên độ ưu tiên nhỏ nhất nằm ở gốc. Cả hai đều đạt thời gian kì vọng O(log n), dù chèn theo thứ tự nào.',
  summary:
    'Chạy từng bước các cột skip list dựng bằng tung đồng xu và phép tìm tụt xuống từng tầng, rồi xem độ ưu tiên ngẫu nhiên quay một treap thành hình.',
  instruction:
    'Chọn một cấu trúc, rồi gõ một khoá và chèn, tìm hoặc xoá. Với skip list, hãy theo đường tìm kiếm khi nó sang phải và tụt xuống. Với treap, để trống ô độ ưu tiên để lấy một giá trị ngẫu nhiên, hoặc gõ một giá trị, rồi xem nút mới quay dần lên.',
  modeLabel: 'Cấu trúc',
  modes: { skip: 'Skip list', treap: 'Treap' },
  keyLabel: 'Khoá',
  priorityLabel: 'Độ ưu tiên (để trống = ngẫu nhiên)',
  towerLabel: 'Chiều cao cột',
  towerCoin: 'Tung đồng xu',
  insert: 'Chèn',
  search: 'Tìm',
  remove: 'Xoá',
  undo: 'Hoàn tác',
  reset: 'Đặt lại',
  presetLabel: 'Dãy có sẵn',
  presetPlaceholder: 'Chọn một dãy có sẵn…',
  skipPresets: {
    towers: 'Các cột trải đều',
    flat: 'Không có cột cao',
    random: 'Tung đồng xu ngẫu nhiên',
  },
  treapPresets: {
    shuffled: 'Khoá tăng dần, độ ưu tiên lẫn lộn',
    reordered: 'Cùng các cặp, thứ tự khác',
    chain: 'Khoá tăng dần, độ ưu tiên tăng dần',
    random: 'Độ ưu tiên ngẫu nhiên',
  },
  skipFull: 'Danh sách đã đầy (12 khoá).',
  treapFull: 'Cây đã đầy (12 khoá).',
  treapLogFull: 'Danh sách thao tác đã đầy (20 thao tác). Hãy hoàn tác hoặc đặt lại để làm tiếp.',
  logFull: 'Danh sách thao tác đã đầy (24 thao tác). Hãy hoàn tác hoặc đặt lại để làm tiếp.',
  keyError: 'Khoá phải là số nguyên từ 0 đến 99.',
  priorityError:
    'Độ ưu tiên phải là số nguyên từ 0 đến 99, hoặc để trống để lấy giá trị ngẫu nhiên.',
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác hiện tại',
  skipOpChip: opChip,
  treapOpChip: opChip,
  flipsTitle: 'Các lần tung đồng xu cho cột này',
  flipsEmpty: 'chưa có',
  flipHeads: 'S',
  flipTails: 'N',
  flipsHot: 'lần tung gần nhất',
  head: 'Đ',
  headName: 'đầu danh sách',
  end: 'NIL',
  skipStats: {
    comparisons: 'Số phép so sánh (thao tác này)',
    rights: 'Số lần sang phải',
    drops: 'Số lần tụt xuống',
    levels: 'Số tầng đang dùng',
    size: 'Số khoá',
  },
  treapStats: {
    comparisons: 'Số phép so sánh (thao tác này)',
    opRotations: 'Số phép quay (thao tác này)',
    rotations: 'Số phép quay (tất cả)',
    height: 'Chiều cao',
    size: 'Số khoá',
  },
  /** @param {number} n */
  skipNote: (n) =>
    n === 0
      ? 'Một danh sách phẳng đã sắp xếp phải so sánh với mọi khoá đứng trước khoá cần tìm.'
      : `Một danh sách phẳng đã sắp xếp gồm ${n} khoá tốn tới ${n} phép so sánh. Số tầng kì vọng ở đây: khoảng log₂ n = ${decimal(Math.log2(Math.max(n, 2)))}.`,
  /** @param {number} n */
  treapNote: (n) =>
    n === 0
      ? 'Với độ ưu tiên ngẫu nhiên, chiều cao kì vọng là O(log n).'
      : `Một cây hoàn hảo gồm ${n} khoá có chiều cao ${Math.ceil(Math.log2(n + 1))}. Độ ưu tiên ngẫu nhiên giữ chiều cao kì vọng chỉ gấp mức đó một hằng số lần.`,
  priorityNote: (/** @type {number} */ p) => `p ${p}`,
  legendSkip: {
    active: '● vị trí hiện tại',
    path: 'đã đi qua trên đường tìm',
    compare: '? khoá được so sánh',
    found: '✓ đã tìm thấy hoặc vừa nối',
  },
  legendTreap: {
    compare: '? đang so sánh',
    path: 'trên đường đi',
    added: '+ mới',
    up: '↑ được quay lên',
    down: '↓ bị quay xuống',
    ok: '✓ thứ tự heap đã đúng',
  },
  markers: { active: '●', compare: '?', found: '✓', added: '+', up: '↑', down: '↓', ok: '✓' },
  /** @param {{key: number, height: number}[]} towers @param {number} top */
  skipLabel: (towers, top) =>
    `Skip list gồm ${towers.length} khoá và ${top} tầng. Các cột: ${towers.map((t) => `${t.key} cao ${t.height}`).join(', ') || 'chưa có'}.`,
  /** @param {string} name @param {number} level @param {string} role */
  cellLabel: (name, level, role) => `${name}, tầng ${level}${role ? `, ${role}` : ''}`,
  cellRoles: {
    active: 'vị trí hiện tại',
    path: 'đã đi qua',
    compare: 'đang so sánh',
    found: 'đã tìm thấy hoặc vừa nối',
  },
  /** @param {number[]} keys @param {number} h */
  treapLabel: (keys, h) =>
    `Treap gồm ${keys.length} khoá, chiều cao ${h}. Theo thứ tự giữa: ${keys.join(', ') || 'chưa có khoá nào'}.`,
  /** @param {string} key @param {string} note @param {string} role */
  treapNodeLabel: (key, note, role) => `Khoá ${key}, ${note}${role ? `, ${role}` : ''}`,
  treapRoles: {
    compare: 'đang so sánh',
    path: 'trên đường đi',
    added: 'mới',
    up: 'được quay lên',
    down: 'bị quay xuống',
    ok: 'thứ tự heap đã đúng',
  },
  skipEmpty: 'Danh sách đang rỗng.',
  treapEmpty: 'Treap đang rỗng.',
  /** @param {SkipFrame} f */
  describeSkip(f) {
    const key = f.op?.key ?? 0;
    const here = f.at >= 0 ? `${f.towers[f.at].key}` : 'đầu danh sách';
    const nextKey = f.next >= 0 ? f.towers[f.next].key : null;
    switch (f.kind) {
      case 'start':
        return vi.skipEmpty;
      case 'begin':
        return `Bắt đầu ở đầu danh sách trên tầng ${f.level}, tầng cao nhất, để tìm ${key}.`;
      case 'right':
        return `${here} < ${key} trên tầng ${f.level}, nên sang phải tới nó. Một bước nhảy này vượt qua các cột thấp hơn ở giữa.`;
      case 'drop':
        return `Trên tầng ${f.level + 1}, khoá kế tiếp là ${nextKey === null ? 'điểm cuối' : nextKey}, không nhỏ hơn ${key}. Ở lại ${here} và tụt xuống tầng ${f.level}.`;
      case 'found':
        return f.op?.type === 'delete'
          ? `Đã tìm thấy ${key}, cột cần gỡ.`
          : `Đã tìm thấy ${key} ở tầng dưới cùng, sau ${f.comparisons} phép so sánh.`;
      case 'missing':
        return `Khoá kế tiếp ở tầng dưới cùng là ${nextKey === null ? 'điểm cuối' : nextKey}, nên ${key} không có trong danh sách.`;
      case 'dup':
        return `${key} đã có trong danh sách, nên lệnh chèn bị bỏ qua trước khi tung đồng xu nào.`;
      case 'flip': {
        const heads = f.flips.at(-1);
        const height = f.flips.filter(Boolean).length + 1;
        if (!heads) return `Ngửa: cột dừng ở chiều cao ${height}.`;
        return height < MAX_TOWER
          ? `Sấp: cột cao lên ${height}. Tung tiếp.`
          : `Sấp: cột cao lên ${height}, mức tối đa của hình minh hoạ này, nên không tung nữa.`;
      }
      case 'link':
        return `Nối cột mới của ${key} vào, lấy các vị trí đã ghi nhớ ở mỗi lần tụt xuống làm hàng xóm bên trái của nó.`;
      case 'unlink':
        return `Gỡ cột khỏi mọi tầng mà nó chạm tới. Danh sách giờ còn ${f.size} khoá.`;
      case 'done':
        return f.size === 0 ? vi.skipEmpty : `Danh sách chứa ${f.size} khoá trên ${f.top} tầng.`;
    }
  },
  /** @param {TreapFrame} f */
  describeTreap(f) {
    const key = f.op?.key ?? 0;
    const at = f.current >= 0 ? f.nodes[f.current].key : null;
    const other = f.other >= 0 ? f.nodes[f.other] : null;
    const side = f.direction ? SIDE[f.direction] : '';
    switch (f.kind) {
      case 'start':
        return vi.treapEmpty;
      case 'visit':
        return `So sánh ${key} với ${at}.`;
      case 'go-left':
        return `${key} < ${at}, nên rẽ trái.`;
      case 'go-right':
        return `${key} > ${at}, nên rẽ phải.`;
      case 'attach':
        return `Gắn ${key} thành một lá với độ ưu tiên ${f.op?.priority ?? 0}. Thứ tự BST đã đúng; giờ kiểm tra thứ tự heap.`;
      case 'found':
        return f.op?.type === 'delete'
          ? `Đã tìm thấy ${key}. Để xoá nó, ta quay nó xuống cho đến khi nó thành lá.`
          : `Đã tìm thấy ${key} sau ${f.comparisons} phép so sánh.`;
      case 'missing':
        return `${key} không có trong treap.`;
      case 'dup':
        return `${key} đã có trong treap, nên lệnh chèn bị bỏ qua.`;
      case 'heap-ok':
        return other
          ? `Nút cha ${other.key} có độ ưu tiên ${other.priority}, không lớn hơn ${f.nodes[f.current].priority}, nên thứ tự heap đã đúng.`
          : `${at} giờ là gốc, nên thứ tự heap đã đúng.`;
      case 'rotate-up':
        return `Nút cha ${other?.key} có độ ưu tiên ${other?.priority}, lớn hơn ${f.nodes[f.current].priority}. Quay ${side}: ${at} được đưa lên.`;
      case 'rotate-down':
        return `Quay ${side}: con ${other?.key} được đưa lên và ${at} bị đưa xuống. Khi có hai con, con có độ ưu tiên nhỏ hơn được đưa lên, để giữ đúng thứ tự heap.`;
      case 'remove':
        return `Giờ nút đã là lá, nên gỡ nó đi. Treap còn ${f.size} khoá.`;
      case 'done':
        return f.size === 0
          ? vi.treapEmpty
          : `Treap chứa ${f.size} khoá, chiều cao ${f.height}, vừa là BST theo khoá vừa là heap theo độ ưu tiên.`;
    }
  },
  takeaways: [
    'Tầng dưới cùng của skip list chứa mọi khoá theo thứ tự. Cột của mỗi khoá cao thêm một tầng sau mỗi lần sấp, nên khoảng một nửa số khoá lên tới tầng 2, một phần tư lên tới tầng 3, cứ thế, tổng cộng khoảng log₂ n tầng.',
    'Phép tìm sang phải khi khoá kế tiếp còn nhỏ hơn, và tụt xuống trong trường hợp ngược lại. Mỗi tầng chỉ ghé kì vọng khoảng hai nút, nên thời gian kì vọng là O(log n), không cần phép quay nào.',
    'Treap cùng lúc là BST theo khoá và heap theo độ ưu tiên; ở đây là heap nhỏ nhất, nên độ ưu tiên nhỏ hơn nằm gần gốc hơn. Nếu các độ ưu tiên khác nhau, với một tập cặp (khoá, độ ưu tiên) cho trước chỉ có đúng một cây như vậy, dù chèn theo thứ tự nào.',
    'Vì độ ưu tiên là ngẫu nhiên chứ không do đầu vào quyết định, không ai có thể ép cây thành hình xấu bằng thứ tự chèn. Cây trông như một BST dựng từ thứ tự chèn ngẫu nhiên, với chiều cao kì vọng O(log n).',
    'Trong skip list, thử “Các cột trải đều” rồi so với “Không có cột cao”: tìm 70 tốn 6 phép so sánh so với 7, và khoảng cách đó lớn dần khi danh sách dài ra. Với treap, so sánh “Khoá tăng dần, độ ưu tiên lẫn lộn” (cao 4) với “Khoá tăng dần, độ ưu tiên tăng dần” (cao 7), rồi mở “Cùng các cặp, thứ tự khác”.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Tìm trên skip list', 'O(log n) kì vọng', 'Khoảng log₂ n tầng, mỗi tầng khoảng hai nút.'],
    [
      'Chèn, xoá trên skip list',
      'O(log n) kì vọng',
      'Một lần tìm, rồi nối hoặc gỡ ở mỗi tầng mà cột chạm tới.',
    ],
    [
      'Tìm trên treap',
      'O(log n) kì vọng',
      'Độ ưu tiên ngẫu nhiên cho cây một hình dạng như ngẫu nhiên, với chiều cao kì vọng O(log n).',
    ],
    ['Chèn, xoá trên treap', 'O(log n) kì vọng', 'Một lượt đi, rồi kì vọng ít hơn 2 phép quay.'],
    [
      'Bất kì cấu trúc nào, khi gặp xui',
      'O(n) trường hợp xấu nhất',
      'Rất khó xảy ra với lựa chọn ngẫu nhiên, và đầu vào không thể ép được.',
    ],
    [
      'Bộ nhớ',
      'O(n)',
      'Skip list trung bình khoảng 2 liên kết mỗi khoá; treap lưu thêm một độ ưu tiên mỗi khoá.',
    ],
  ],
  nextTeaser:
    'Bài sau bàn về ánh xạ có thứ tự và cây tăng cường: lưu thêm kích thước cây con ở mỗi nút để trả lời truy vấn thứ hạng và phần tử nhỏ thứ k.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Trong skip list, mở “Các cột trải đều”, ở đó 10, …, 80 có chiều cao lần lượt 1, 2, 1, 3, 1, 2, 1, 4. Phép tìm 70 của dãy này tốn bao nhiêu phép so sánh khoá?',
      answer: 6,
      unit: 'phép so sánh',
      hints: [
        'Dãy có sẵn kết thúc bằng phép tìm này, nên hãy chạy từng bước rồi đọc ô số liệu.',
        'Liệt kê các khoá được so sánh: đầu tiên là 80, rồi 40, và cứ thế.',
      ],
      solution:
        'Các phép so sánh là 80 (tụt xuống), 40 (sang phải), 80 (tụt xuống), 60 (sang phải), 80 (tụt xuống) và 70 (tìm thấy), tổng là 6.',
    },
    {
      type: 'number',
      prompt: 'Giờ mở “Không có cột cao”. Cũng phép tìm đó tốn bao nhiêu phép so sánh?',
      answer: 7,
      unit: 'phép so sánh',
      hints: ['Chỉ có một tầng, nên phép tìm ghé các khoá theo thứ tự.'],
      solution:
        'Nó lần lượt so sánh 10, 20, 30, 40, 50, 60 và 70, tổng là 7. Với chỉ 8 khoá thì chênh lệch còn nhỏ, nhưng nó tăng rất nhanh: số này tăng tuyến tính, còn số của các cột tăng theo lôgarit.',
    },
    {
      type: 'number',
      prompt:
        'Với một đồng xu cân đối, chiều cao kì vọng của một cột là bao nhiêu, nếu bỏ qua mức tối đa?',
      answer: 2,
      hints: [
        'Chiều cao bằng 1 cộng số lần sấp trước lần ngửa đầu tiên.',
        'Số lần sấp kì vọng trước lần ngửa đầu tiên là 1.',
      ],
      solution:
        'Chiều cao 1 có xác suất 1/2, chiều cao 2 có 1/4, chiều cao 3 có 1/8, và cứ thế. Tổng 1/2 + 2/4 + 3/8 + … = 2, nên tổng số liên kết vào khoảng 2n.',
    },
    {
      type: 'number',
      prompt: 'Xác suất để một cột cao từ 3 trở lên là bao nhiêu? Trả lời bằng số thập phân.',
      answer: 0.25,
      tolerance: 0.001,
      hints: ['Cần đúng hai lần sấp liên tiếp, bất kể sau đó ra gì.'],
      solution: 'Hai lần sấp liên tiếp có xác suất 1/2 × 1/2 = 0,25.',
    },
    {
      type: 'number',
      prompt:
        'Trong treap, mở “Khoá tăng dần, độ ưu tiên tăng dần”, ở đó 10, …, 70 có độ ưu tiên 1, …, 7. Treap cao bao nhiêu?',
      answer: 7,
      hints: ['Mỗi khoá mới đều có khoá lớn nhất và độ ưu tiên lớn nhất tính đến lúc đó.'],
      solution:
        'Không phép quay nào xảy ra, và mỗi khoá đều là con phải của khoá trước nó. Chiều cao 7 là trường hợp xấu nhất: với độ ưu tiên thật sự ngẫu nhiên, hình dạng này rất khó xảy ra.',
    },
    {
      type: 'choice',
      prompt:
        'Trong treap heap nhỏ nhất này, một lá mới có khoá 40, độ ưu tiên 5 là con phải của khoá 20, độ ưu tiên 9. Điều gì xảy ra tiếp theo?',
      options: [
        'Quay trái, để 40 thành cha của 20',
        'Quay phải, để 40 thành cha của 20',
        'Không có gì, vì 40 > 20 là đúng thứ tự khoá',
        'Đổi chỗ khoá của hai nút',
      ],
      answer: 0,
      hints: [
        'Độ ưu tiên nhỏ hơn phải nằm gần gốc hơn.',
        'Muốn đưa một con phải lên thì dùng phép quay trái.',
      ],
      solution:
        'Độ ưu tiên 5 nhỏ hơn 9, nên thứ tự heap bị vi phạm. Một phép quay trái đưa con phải 40 lên trên 20 mà vẫn giữ các khoá đúng thứ tự BST.',
    },
    {
      type: 'multi',
      prompt:
        'Những khẳng định nào đúng với các treap heap nhỏ nhất của bài này, khi các độ ưu tiên khác nhau?',
      options: [
        'Tập các cặp (khoá, độ ưu tiên) quyết định hình dạng của cây',
        'Nút có độ ưu tiên nhỏ nhất là gốc',
        'Duyệt giữa ghé các khoá theo thứ tự tăng dần',
        'Chiều cao luôn không quá 2 log₂(n + 1)',
      ],
      answers: [0, 1, 2],
      hints: [
        'Mở “Cùng các cặp, thứ tự khác” và so sánh kết quả.',
        'Dãy có sẵn dạng chuỗi cũng là một treap.',
      ],
      solution:
        'Độ ưu tiên nhỏ nhất phải là gốc, và nó chia các khoá làm hai phía, nên mỗi phía cũng được xác định theo cùng cách đó. Treap cũng là một BST, nên duyệt giữa cho thứ tự tăng dần. Chiều cao chỉ là O(log n) theo kì vọng: độ ưu tiên xấu cho ra một chuỗi.',
    },
    {
      type: 'order',
      prompt: 'Sắp xếp các bước xoá trên treap theo đúng thứ tự.',
      items: [
        'Gỡ nút, giờ đã là một lá',
        'Đi xuống theo khoá để tìm nút',
        'Chừng nào nút còn con, quay con có độ ưu tiên nhỏ hơn lên',
      ],
      answer: [1, 2, 0],
      hints: ['Gỡ một lá thì dễ, nên trước hết hãy biến nút thành lá.'],
      solution:
        'Tìm nút, rồi quay nó xuống, mỗi lần đều đưa con có độ ưu tiên nhỏ hơn lên để thứ tự heap luôn đúng. Khi nó đã là lá thì gỡ đi.',
    },
  ],
};
