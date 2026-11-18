/** @typedef {import('$lib/algo-engine/doubly-circular-lists.js').DoublyFrame} DoublyFrame */
/** @typedef {import('$lib/algo-engine/doubly-circular-lists.js').DoublyOp} DoublyOp */

/** How a node id reads in narration: S for the sentinel, null, or the node's value. */
/** @param {DoublyFrame} f @param {number} id */
const name = (f, id) => (id === -2 ? 'S' : id === -1 ? 'null' : String(f.nodes[id]?.value));

/** @param {DoublyFrame} f @param {'next'|'prev'} field */
const of = (f, field) => (f.node >= 0 ? f.nodes[f.node][field] : -1);

export const vi = {
  slug: 'doubly-circular-lists',
  topic: 'linked-lists',
  level: 'Cơ bản',
  title: 'Linked list đôi và linked list vòng',
  intro:
    'Linked list đôi (danh sách liên kết đôi) cho mỗi nút thêm một con trỏ ngược (prev) bên cạnh con trỏ xuôi, nên em đi được cả hai chiều và gỡ được một nút đang cầm trong tay mà không phải tìm nút đứng trước nó. Khép danh sách thành một vòng quanh một nút giả gọi là nút cầm canh (sentinel), thì danh sách rỗng, nút đầu và nút cuối trông như nhau: không cần kiểm tra null nào cả.',
  summary:
    'Thêm và gỡ nút trong linked list đôi, có và không có nút cầm canh vòng, và xem cả hai lần cập nhật con trỏ của mỗi lần gỡ.',
  instruction:
    'Chọn một nút trong hình (bấm vào nó, hoặc dùng phím mũi tên và Enter), rồi bấm “Gỡ nút đã chọn” và chạy từng bước qua hai lần ghi con trỏ. Thêm vào đầu hoặc cuối, và đổi cách thiết kế để so sánh những trường hợp đặc biệt mà mỗi cách cần.',
  modeLabel: 'Thiết kế',
  modes: { sentinel: 'Vòng, có nút cầm canh', plain: 'Có head và tail, hai đầu null' },
  valueLabel: 'Giá trị',
  pushFront: 'Thêm vào đầu',
  pushBack: 'Thêm vào cuối',
  remove: 'Gỡ nút đã chọn',
  undo: 'Hoàn tác',
  reset: 'Xoá hết',
  presetLabel: 'Ví dụ',
  presetPlaceholder: 'Nạp một ví dụ…',
  presets: { back: 'Bốn nút thêm vào cuối', front: 'Bốn nút thêm vào đầu', random: 'Ngẫu nhiên' },
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác đang chạy',
  scroller: 'Hình vẽ danh sách, cuộn ngang được',
  nullLabel: 'null',
  /** @param {DoublyOp} op @param {number | null} value */
  opChip: (op, value) =>
    op.type === 'push-front'
      ? `front(${op.value})`
      : op.type === 'push-back'
        ? `back(${op.value})`
        : `remove(${value ?? '?'})`,
  stats: {
    writes: 'Số lần ghi con trỏ (thao tác này)',
    special: 'Số trường hợp đặc biệt ở đầu null (cả nhật kí)',
    length: 'Độ dài',
    selected: 'Nút đã chọn',
  },
  noneSelected: 'chưa chọn',
  valueError: 'Giá trị phải là số nguyên từ 0 đến 99.',
  full: 'Danh sách đã đầy (8 nút). Hãy gỡ bớt một nút trước.',
  logFull: 'Nhật kí đã đầy (20 thao tác). Hãy hoàn tác hoặc xoá hết để làm tiếp.',
  pickFirst: 'Hãy chọn nút cần gỡ trước: bấm vào nó trong hình.',
  sentinelPick:
    'Nút cầm canh S không bao giờ bị gỡ: chính nó giữ cho danh sách không bao giờ rỗng.',
  gonePick:
    'Nút đó không còn trong danh sách ở cuối nhật kí. Hãy chọn một nút trong danh sách cuối cùng.',
  /** @param {number[]} values @param {number[]} back @param {'sentinel'|'plain'} mode */
  listLabel: (values, back, mode) =>
    mode === 'sentinel'
      ? values.length === 0
        ? 'Linked list đôi, vòng, chỉ có nút cầm canh S, trỏ vào chính nó theo cả hai chiều.'
        : `Linked list đôi, vòng: S ⇄ ${values.join(' ⇄ ')} ⇄ quay về S. Đi ngược: ${back.join(', ')}.`
      : values.length === 0
        ? 'Linked list đôi rỗng: head và tail là null.'
        : `Linked list đôi: null ← ${values.join(' ⇄ ')} → null. Đi ngược: ${back.join(', ')}.`,
  /** @param {string} label @param {string} state @param {boolean} inList */
  nodeTitle: (label, state, inList) =>
    [label === 'S' ? 'Nút cầm canh S' : `Nút ${label}`, inList ? '' : 'nằm ngoài danh sách', state]
      .filter(Boolean)
      .join(', '),
  states: {
    active: 'đang được thêm',
    swap: 'đang bị gỡ ra',
    frontier: 'đã chọn',
    visited: 'nút cầm canh',
  },
  markers: { active: '+', swap: '×', frontier: '●' },
  legend: {
    active: 'Đang được thêm',
    swap: 'Đang bị gỡ ra',
    frontier: 'Đã chọn để gỡ',
    visited: 'Nút cầm canh S',
    hot: 'Con trỏ vừa ghi',
  },
  /** @param {DoublyFrame} f */
  describe(f) {
    const v = f.value;
    const sentinel = f.mode === 'sentinel';
    const kind = f.op?.type;
    switch (f.kind) {
      case 'start':
        return sentinel
          ? 'Bắt đầu chỉ với nút cầm canh S: next và prev của nó trỏ vào chính nó.'
          : 'Bắt đầu với danh sách rỗng: head và tail là null.';
      case 'create':
        return sentinel
          ? `Tạo một nút cho ${v} với prev = ${name(f, f.after)} và next = ${name(f, of(f, 'next'))}. Chưa có gì trỏ tới nó.`
          : kind === 'push-front'
            ? `Tạo một nút cho ${v} với prev = null và next = head (${name(f, of(f, 'next'))}).`
            : `Tạo một nút cho ${v} với prev = tail (${name(f, of(f, 'prev'))}) và next = null.`;
      case 'link-prev':
        return sentinel
          ? `${name(f, of(f, 'next'))}.prev = n: nút đứng sau chỗ trống giờ trỏ ngược về ${v}.`
          : `head.prev = n: nút đầu cũ, ${name(f, of(f, 'next'))}, giờ trỏ ngược về ${v}.`;
      case 'link-next':
        return sentinel
          ? `${name(f, f.after)}.next = n: ${v} đã vào danh sách. Bốn lần ghi con trỏ mà không có lệnh if nào.`
          : `tail.next = n: nút cuối cũ, ${name(f, of(f, 'prev'))}, giờ trỏ tới ${v}.`;
      case 'set-head':
        return kind === 'push-front'
          ? `head = n: ${v} đứng đầu.`
          : kind === 'push-back'
            ? `Danh sách đang rỗng, nên head cũng phải trỏ tới ${v}. Một trường hợp đặc biệt.`
            : `${v} không có nút nào đứng trước, nên head dời sang ${name(f, of(f, 'next'))}. Một trường hợp đặc biệt.`;
      case 'set-tail':
        return kind === 'push-back'
          ? `tail = n: ${v} đứng cuối.`
          : kind === 'push-front'
            ? `Danh sách đang rỗng, nên tail cũng phải trỏ tới ${v}. Một trường hợp đặc biệt.`
            : `${v} không có nút nào đứng sau, nên tail lùi về ${name(f, of(f, 'prev'))}. Một trường hợp đặc biệt.`;
      case 'select':
        return `Gỡ ${v}. Ta đang cầm sẵn nút này nên không phải tìm: prev (${name(f, of(f, 'prev'))}) và next (${name(f, of(f, 'next'))}) của nó cho biết hai con trỏ cần sửa.`;
      case 'unlink-next':
        return `${name(f, of(f, 'prev'))}.next = ${name(f, of(f, 'next'))}: đi xuôi giờ bỏ qua ${v}.`;
      case 'unlink-prev':
        return `${name(f, of(f, 'next'))}.prev = ${name(f, of(f, 'prev'))}: đi ngược cũng bỏ qua ${v}.`;
      case 'free':
        return `${v} được giải phóng sau ${f.writes} lần ghi con trỏ. Danh sách có ${f.length} nút.`;
      case 'missing':
        return 'Nút đó không còn trong danh sách nên không có gì để gỡ.';
      case 'done':
        return sentinel
          ? `Xong. ${f.length} nút quanh nút cầm canh, và ${f.special} trường hợp đặc biệt.`
          : `Xong. ${f.length} nút, và ${f.special} trường hợp đặc biệt vì đầu null.`;
    }
  },
  takeaways: [
    'Mỗi nút có con trỏ ngược và con trỏ xuôi. Mỗi lần thêm ghi bốn con trỏ, mỗi lần gỡ ghi hai, dù nút nằm ở đâu: O(1).',
    'Gỡ một nút đang cầm trong tay không cần tìm, vì con trỏ ngược của nó chỉ ra nút cần sửa con trỏ xuôi. Linked list đơn thì phải đi từ đầu để tìm nút đó.',
    'Khi hai đầu là null, thêm vào danh sách rỗng hay gỡ nút đầu, nút cuối sẽ rẽ sang một nhánh khác để dời head hoặc tail. Lỗi thường nấp ở chính những nhánh này.',
    'Nút cầm canh S khép danh sách thành một vòng: nút sau S là nút đầu, nút trước S là nút cuối, và S trỏ vào chính nó khi danh sách rỗng. Khi đó nút nào cũng có hàng xóm thật ở hai bên, nên mã không cần lệnh if nào.',
    'Thử gỡ nút đầu và nút cuối trong cả hai cách thiết kế: số trường hợp đặc biệt chỉ tăng khi không có nút cầm canh.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thêm vào đầu hoặc cuối',
      'O(1)',
      'Hai con trỏ của S (hoặc head và tail) chạm tới cả hai đầu ngay.',
    ],
    [
      'Gỡ một nút đang cầm',
      'O(1)',
      'Hai lần ghi: con trỏ xuôi của nút trước và con trỏ ngược của nút sau.',
    ],
    ['Tìm một giá trị hoặc chỉ số', 'O(n)', 'Vẫn phải đi từ một đầu.'],
    ['Bộ nhớ', 'O(n)', 'Hai con trỏ cho mỗi nút, cộng một nút cầm canh.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với cách thiết kế có nút cầm canh, gỡ một nút tốn bao nhiêu lần ghi con trỏ, dù nút đó nằm ở đâu?',
      answer: 2,
      unit: 'lần ghi',
      hints: [
        'Chạy từng bước một lần gỡ và để ý các mũi tên xanh ngọc.',
        'Một lần ghi cho chiều xuôi, một lần cho chiều ngược.',
      ],
      solution:
        'Nút trước trỏ xuôi qua n tới nút sau, và nút sau trỏ ngược qua n về nút trước: hai lần ghi. Nút cầm canh bảo đảm luôn có đủ hai hàng xóm, nên không bao giờ phải rẽ nhánh.',
    },
    {
      type: 'multi',
      prompt:
        'Khi không có nút cầm canh (có head, tail và hai đầu null), những lần gỡ nào rơi vào trường hợp đặc biệt? Chọn mọi phương án đúng.',
      options: ['Gỡ nút đầu', 'Gỡ một nút ở giữa', 'Gỡ nút cuối', 'Gỡ nút duy nhất'],
      answers: [0, 2, 3],
      hints: ['Trường hợp đặc biệt là một nhánh mà nút trước hoặc nút sau của n là null.'],
      solution:
        'Nút đầu không có nút trước (head phải dời), nút cuối không có nút sau (tail phải dời), còn nút duy nhất không có cả hai nên rơi vào cả hai trường hợp. Nút ở giữa có hàng xóm thật ở cả hai bên.',
    },
    {
      type: 'choice',
      prompt:
        'Trong danh sách vòng rỗng có nút cầm canh S, hai con trỏ xuôi và ngược của S trỏ vào đâu?',
      options: [
        'Cả hai là null',
        'Cả hai trỏ vào chính S',
        'Con trỏ xuôi là null, con trỏ ngược trỏ vào S',
      ],
      answer: 1,
      hints: ['Xoá hết danh sách trong cách thiết kế có nút cầm canh rồi nhìn các mũi tên ở S.'],
      solution:
        'S trỏ vào chính nó theo cả hai chiều. Nhờ vậy insertAfter(S, v) chạy trên danh sách rỗng y hệt như trên danh sách đầy.',
    },
    {
      type: 'choice',
      prompt:
        'insertAfter(x, v) chạy dòng 3 (nút sau x trỏ ngược về n) trước dòng 4 (x trỏ xuôi tới n). Nếu đổi chỗ hai dòng đó thì sai ở đâu?',
      options: [
        'Không sao cả: hai lần ghi độc lập với nhau',
        'Con trỏ ngược của n trỏ vào chính n, còn hàng xóm cũ vẫn trỏ ngược về x',
        'Danh sách mất mọi nút đứng sau x',
      ],
      answer: 1,
      hints: ['Khi x đã trỏ xuôi tới n rồi, thì “nút sau x” là nút nào?'],
      solution:
        'Khi x đã trỏ xuôi tới n, “nút sau x” chính là n, nên lần ghi còn lại gán con trỏ ngược của n bằng n. Hàng xóm cũ vẫn giữ con trỏ ngược về x, và đi ngược sẽ bỏ qua n.',
    },
  ],
  nextTeaser:
    'Bài sau dùng con trỏ nhanh, con trỏ chậm và nút giả để giải các bài khó hơn: kĩ thuật trên linked list.',
};
