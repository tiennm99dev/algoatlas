/** @typedef {import('$lib/algo-engine/singly-linked-lists.js').SinglyFrame} SinglyFrame */
/** @typedef {import('$lib/algo-engine/singly-linked-lists.js').SinglyOp} SinglyOp */

/** @param {SinglyFrame} f @param {number} slot */
const valueAt = (f, slot) => f.nodes[slot]?.value;

export const vi = {
  slug: 'singly-linked-lists',
  topic: 'linked-lists',
  level: 'Cơ bản',
  title: 'Danh sách liên kết đơn',
  intro:
    'Danh sách liên kết (linked list) đơn cất mỗi giá trị trong một nút riêng, và mỗi nút giữ một con trỏ tới nút kế tiếp. Danh sách chỉ nhớ nút đầu, nên thêm hay xoá ở đầu chỉ cần nối lại một hai con trỏ, còn muốn tới giá trị thứ i thì phải đi qua i mối nối.',
  summary:
    'Thêm và xoá ở đầu danh sách liên kết đơn, đọc theo chỉ số, và xem các con trỏ tới nút sau được nối lại từng bước.',
  instruction:
    'Nhập một giá trị rồi thêm vào đầu, xoá nút đầu, đọc một chỉ số hoặc xoá một giá trị, sau đó chạy từng bước. Để ý mũi tên nào đổi ở mỗi bước: mũi tên màu xanh ngọc là con trỏ vừa được ghi.',
  valueLabel: 'Giá trị',
  indexLabel: 'Chỉ số',
  insertHead: 'Thêm vào đầu',
  deleteHead: 'Xoá nút đầu',
  get: 'Đọc chỉ số',
  remove: 'Xoá giá trị',
  undo: 'Hoàn tác',
  reset: 'Xoá hết',
  presetLabel: 'Ví dụ',
  presetPlaceholder: 'Nạp một ví dụ…',
  presets: { short: 'Bốn nút', long: 'Tám nút', random: 'Ngẫu nhiên' },
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác đang chạy',
  scroller: 'Hình vẽ danh sách, cuộn ngang được',
  nullLabel: 'null',
  /** @param {SinglyOp} op */
  opChip: (op) =>
    op.type === 'insert-head'
      ? `insertHead(${op.value})`
      : op.type === 'delete-head'
        ? 'deleteHead()'
        : op.type === 'get'
          ? `get(${op.index})`
          : `delete(${op.value})`,
  stats: {
    steps: 'Số bước nhảy (thao tác này)',
    writes: 'Số lần ghi con trỏ (thao tác này)',
    length: 'Độ dài',
  },
  valueError: 'Giá trị phải là số nguyên từ 0 đến 99.',
  indexError: 'Chỉ số phải là số nguyên từ 0 đến 9.',
  full: 'Danh sách đã đầy (10 nút). Hãy xoá bớt một nút trước.',
  logFull: 'Nhật kí đã đầy (18 thao tác). Hãy hoàn tác hoặc xoá hết để làm tiếp.',
  /** @param {number[]} values */
  listLabel: (values) =>
    values.length === 0
      ? 'Danh sách rỗng: head là null.'
      : `Danh sách liên kết đơn, từ đầu: ${values.join(' → ')} → null.`,
  /** @param {number | null} value @param {string} state @param {boolean} inList */
  nodeTitle: (value, state, inList) =>
    [`Nút ${value}`, inList ? '' : 'nằm ngoài danh sách', state].filter(Boolean).join(', '),
  states: {
    active: 'nút mới',
    compare: 'đang so sánh',
    frontier: 'cur',
    visited: 'đã đi qua',
    sorted: 'đã tìm thấy',
    swap: 'đang bị gỡ ra',
  },
  markers: { active: '+', compare: '?', sorted: '✓', swap: '×' },
  legend: {
    active: 'Nút mới',
    frontier: 'cur trỏ vào đây',
    compare: 'Đang so sánh',
    visited: 'Đã đi qua',
    sorted: 'Đã tìm thấy',
    swap: 'Đang bị gỡ ra',
    hot: 'Con trỏ vừa ghi',
  },
  /** @param {SinglyFrame} f */
  describe(f) {
    const v = f.op?.value;
    switch (f.kind) {
      case 'start':
        return f.length === 0 ? 'Danh sách rỗng: head là null.' : `Danh sách có ${f.length} nút.`;
      case 'create':
        return f.nodes[f.fresh].next === -1
          ? `Tạo một nút cho ${v}. Danh sách đang rỗng nên next của nó là null.`
          : `Tạo một nút cho ${v} và cho next của nó trỏ vào nút đầu hiện tại, ${valueAt(f, f.nodes[f.fresh].next)}. Danh sách chưa thay đổi gì.`;
      case 'link-head':
        return `Dời head sang nút mới. Giờ ${v} đứng đầu: 2 lần ghi con trỏ, không phải đi bước nào.`;
      case 'empty':
        return 'head là null: không có gì để xoá.';
      case 'unlink-head':
        return f.head === -1
          ? 'head dời sang next của nút đầu cũ, tức là null. Danh sách giờ rỗng.'
          : `head dời sang next của nút đầu cũ, ${valueAt(f, f.head)}. Không còn đường nào tới nút đầu cũ nữa.`;
      case 'free':
        return `Nút vừa gỡ ra được giải phóng. Danh sách còn ${f.length} nút.`;
      case 'walk-start':
        return f.cur === -1
          ? 'cur bắt đầu ở head, tức là null.'
          : `cur bắt đầu ở head, ${valueAt(f, f.cur)}. Để tới chỉ số ${f.op?.index}, nó phải đi theo ${f.op?.index} con trỏ next.`;
      case 'walk':
        return f.cur === -1
          ? `Bước nhảy ${f.steps}: cur đã đi quá cuối danh sách.`
          : `Bước nhảy ${f.steps}: cur = cur.next, giờ ở ${valueAt(f, f.cur)}.`;
      case 'found':
        return `Chỉ số ${f.op?.index} chứa ${valueAt(f, f.cur)}, tới được sau ${f.steps} bước nhảy. Không có lối tắt nào: truy cập theo chỉ số tốn O(n).`;
      case 'out-of-range':
        return `Chỉ số ${f.op?.index} vượt quá cuối danh sách: danh sách chỉ có ${f.length} nút.`;
      case 'scan-start':
        return f.cur === -1
          ? `cur bắt đầu ở head, tức là null, nên ${v} không thể có trong danh sách.`
          : `Tìm ${v}: prev bắt đầu là null, cur bắt đầu ở nút đầu.`;
      case 'compare':
        return valueAt(f, f.cur) === v
          ? `cur chứa ${v}: đây là nút cần xoá.`
          : `cur chứa ${valueAt(f, f.cur)}, không phải ${v}.`;
      case 'advance':
        return f.cur === -1
          ? 'prev dời tới cur, còn cur dời tới null: hết danh sách.'
          : `prev dời tới cur, còn cur đi tiếp tới ${valueAt(f, f.cur)}.`;
      case 'miss':
        return `${v} không có trong danh sách, sau ${f.steps} bước nhảy.`;
      case 'unlink':
        return f.prev === -1
          ? `${v} là nút đầu, nên head bỏ qua nó: head = cur.next. Một lần ghi con trỏ.`
          : `prev.next bỏ qua ${v}: nút ${valueAt(f, f.prev)} giờ trỏ tới chỗ ${v} từng trỏ. Một lần ghi con trỏ.`;
      case 'done':
        return f.length === 0 ? 'Xong. Danh sách rỗng.' : `Xong. Danh sách có ${f.length} nút.`;
    }
  },
  takeaways: [
    'Một nút gồm một giá trị và một con trỏ tới nút sau; bản thân danh sách chỉ là một con trỏ head. Nút cuối trỏ tới null.',
    'Thêm vào đầu ghi hai con trỏ (con trỏ của nút mới, rồi head), còn xoá nút đầu ghi một con trỏ, dù danh sách dài bao nhiêu: O(1).',
    'Cho nút mới trỏ tới nút đầu trước, rồi mới dời head. Làm ngược lại sẽ mất phần còn lại của danh sách, vì không còn gì trỏ tới nút đầu cũ.',
    'Không tính được địa chỉ theo chỉ số: muốn tới chỉ số i phải đi qua i mối nối, nên truy cập và tìm kiếm tốn O(n).',
    'Thử nạp “Tám nút”, rồi đọc chỉ số 7 và xoá nút đầu: đếm xem mỗi thao tác cần bao nhiêu bước nhảy.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Thêm hoặc xoá ở đầu', 'O(1)', 'Một hoặc hai lần ghi con trỏ, không phải đi.'],
    ['Truy cập chỉ số i', 'O(i), xấu nhất O(n)', 'Đi qua i mối nối từ nút đầu.'],
    ['Tìm hoặc xoá một giá trị', 'O(n)', 'Đi cho tới khi gặp giá trị; sau đó một lần ghi.'],
    ['Bộ nhớ', 'O(n)', 'Mỗi giá trị một nút, cộng thêm một con trỏ cho mỗi nút.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Danh sách là 12 → 7 → 30 → 4 → null. Lệnh get(3) phải đi qua bao nhiêu mối nối?',
      answer: 3,
      unit: 'bước nhảy',
      hints: [
        'cur bắt đầu ở nút đầu, chỉ số 0, trước mọi bước nhảy.',
        'Mỗi bước nhảy tiến thêm một chỉ số.',
      ],
      solution:
        'cur bắt đầu ở 12 (chỉ số 0) rồi nhảy tới 7, 30, rồi 4: ba bước nhảy để tới chỉ số 3. Nạp “Bốn nút” rồi chạy get(3) để xem.',
    },
    {
      type: 'order',
      prompt: 'Xếp các bước của insertHead(v) theo một thứ tự an toàn.',
      items: [
        'Dời head sang nút mới',
        'Tạo nút mới chứa v',
        'Cho nút mới trỏ tới nút đầu hiện tại',
      ],
      answer: [1, 2, 0],
      hints: [
        'Phải có nút trước thì mới gán con trỏ của nó được.',
        'Bước nào sẽ làm mất danh sách cũ nếu chạy đầu tiên?',
      ],
      solution:
        'Tạo nút, cho nó trỏ vào nút đầu hiện tại, rồi mới dời head. Nếu dời head trước thì không còn gì trỏ tới nút đầu cũ.',
    },
    {
      type: 'choice',
      prompt: 'Một danh sách liên kết đơn có một triệu nút. Xoá nút đầu của nó tốn bao nhiêu?',
      options: ['O(1)', 'O(log n)', 'O(n)'],
      answer: 0,
      hints: ['Đếm số lần ghi con trỏ trong deleteHead.'],
      solution:
        'deleteHead chỉ ghi một con trỏ, dời head sang nút thứ hai, dù danh sách dài bao nhiêu, nên tốn O(1).',
    },
    {
      type: 'number',
      prompt:
        'Danh sách là 5 → 18 → 23 → 41 → null. Lệnh delete(23) đi bằng prev và cur. cur nhảy bao nhiêu bước trước khi gỡ nút?',
      answer: 2,
      unit: 'bước nhảy',
      hints: ['cur bắt đầu ở 5, chưa tính bước nhảy nào.', 'cur dừng ở nút chứa 23.'],
      solution:
        'cur đi 5 → 18 → 23: hai bước nhảy. Sau đó con trỏ của prev (18) được gán bằng con trỏ của cur, nên 18 trỏ tới 41.',
    },
  ],
  nextTeaser:
    'Bài sau thêm con trỏ ngược và nối đuôi về đầu: danh sách liên kết đôi và danh sách liên kết vòng.',
};
