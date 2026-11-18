/** @typedef {import('$lib/algo-engine/van-emde-boas.js').VebFrame} VebFrame */
/** @typedef {import('$lib/algo-engine/van-emde-boas.js').VebOp} VebOp */
/** @typedef {import('$lib/algo-engine/van-emde-boas.js').VebOpType} VebOpType */

export const vi = {
  slug: 'van-emde-boas',
  topic: 'advanced-heaps',
  level: 'Nâng cao',
  title: 'Cây van Emde Boas',
  intro:
    'Khi các khoá là số nguyên thuộc một vũ trụ cố định {0, 1, …, u − 1}, cây van Emde Boas nhanh hơn mọi cấu trúc dựa trên phép so sánh. Nó chia vũ trụ thành √u cụm, mỗi cụm √u khoá, kèm một bản tóm tắt cho biết cụm nào có khoá, rồi lại chia y như vậy bên trong từng cụm. Mỗi thao tác chỉ đệ quy vào đúng một cấu trúc kích thước √u, nên chèn, xoá, tìm phần tử kế tiếp, min và max đều tốn O(log log u).',
  summary:
    'Chèn, xoá và tìm phần tử kế tiếp trên cây van Emde Boas với 16 hoặc 256 khoá, vũ trụ được chia thành các cụm và một bản tóm tắt, mỗi lời gọi được lần theo từng tầng.',
  instruction:
    'Gõ một khoá rồi bấm Chèn, Xoá hoặc Kế tiếp (Enter để chèn). Đi từng bước và xem lời gọi đi xuống từng tầng một: V là cả cây, V.S là bản tóm tắt của nó, V.3 là cụm 3 của nó, còn V.3.S là bản tóm tắt bên trong cụm đó. Đổi vũ trụ sang 256 để thấy thêm một tầng.',
  universeLabel: 'Vũ trụ u',
  /** @param {number} u */
  universeOption: (u) => `u = ${u}`,
  valueLabel: 'Khoá x',
  ops: { insert: 'Chèn', delete: 'Xoá', successor: 'Kế tiếp' },
  undo: 'Hoàn tác',
  reset: 'Làm lại',
  presetLabel: 'Bộ mẫu',
  presetPlaceholder: 'Nạp một bộ mẫu…',
  presets: {
    clrs: 'u = 16: {2, 3, 4, 5, 7, 14, 15}',
    deletes: 'u = 16: các phép xoá',
    wide: 'u = 256: tìm kế tiếp',
    random: 'Ngẫu nhiên',
  },
  /** @param {number} u */
  valueError: (u) => `Hãy gõ một số nguyên từ 0 đến ${u - 1}.`,
  full: 'Ở đây tập hợp chứa tối đa 12 khoá. Hãy xoá bớt một khoá trước.',
  /** @param {number} x */
  presentError: (x) => `${x} đã có trong tập hợp: cây vEB lưu mỗi khoá đúng một lần.`,
  /** @param {number} x */
  absentError: (x) => `${x} không có trong tập hợp, nên không có gì để xoá.`,
  logFull: 'Nhật kí đã đủ 16 thao tác. Hãy hoàn tác hoặc làm lại để thử thêm.',
  gridTitle: 'Vũ trụ, mỗi hàng là một cụm',
  /** @param {number} u @param {number[]} set */
  gridAria: (u, set) =>
    `Vũ trụ gồm ${u} khoá chia thành ${Math.sqrt(u)} cụm, mỗi cụm ${Math.sqrt(u)} khoá; đang lưu: ${set.length ? set.join(', ') : 'không có'}.`,
  /** @param {number} key @param {number} bit @param {string} state */
  cellLabel: (key, bit, state) =>
    [`Khoá ${key}: ${bit ? 'đang lưu' : 'không lưu'}`, state].filter(Boolean).join(', '),
  /** @param {number} c */
  rowHeader: (c) => `c${c}`,
  /** @param {number} x @param {number} u @param {number} high @param {number} low */
  split: (x, u, high, low) => {
    const r = Math.sqrt(u);
    return `x = ${x} trong một cấu trúc kích thước ${u}: high(x) = ⌊${x} / ${r}⌋ = ${high}, low(x) = ${x} mod ${r} = ${low}.`;
  },
  /** @param {number} x */
  baseSplit: (x) =>
    `x = ${x} trong một cấu trúc kích thước 2: trường hợp cơ sở, chỉ có min và max.`,
  splitIdle: 'Cách tách x thành high(x) và low(x) sẽ hiện ra khi một thao tác đang chạy.',
  treeTitle: 'Cấu trúc đệ quy: bản tóm tắt S và các cụm c0, c1, …',
  /** @param {number} n */
  treeAria: (n) => `Đã vẽ ${n} cấu trúc; các cấu trúc rỗng được lược bỏ.`,
  /** @param {number | null} min @param {number | null} max */
  minMax: (min, max) => (min === null ? '∅' : min === max ? `${min}` : `${min}–${max}`),
  /** @param {string} path @param {number} u @param {number | null} min @param {number | null} max @param {string} state */
  structLabel: (path, u, min, max, state) =>
    [
      `${path}, kích thước ${u}`,
      min === null ? 'rỗng' : min === max ? `chỉ chứa ${min}` : `min ${min}, max ${max}`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  states: {
    current: 'đang được ghé',
    open: 'lời gọi chưa kết thúc',
    write: 'min hoặc max vừa thay đổi',
  },
  stats: {
    keys: 'Số khoá đang lưu',
    levels: 'Số tầng: log₂ log₂ u + 1',
    calls: 'Số lời gọi, thao tác này',
    depth: 'Số tầng đã tới',
    total: 'Số lời gọi, mọi thao tác',
    answer: 'Phần tử kế tiếp gần nhất',
  },
  none: 'không có',
  pending: '—',
  stackTitle: 'Các lời gọi đang mở (ngoài cùng trước)',
  stackEmpty: 'không có',
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'đang chạy',
  /** @param {VebOp} op */
  opChip: (op) =>
    op.type === 'insert'
      ? `+${op.value}`
      : op.type === 'delete'
        ? `−${op.value}`
        : `succ ${op.value}`,
  legend: {
    active: 'Chính x',
    frontier: 'Các khoá mà x đại diện ở tầng này',
    sorted: 'Kết quả',
    visited: 'V.min: không bao giờ nằm trong cụm nào',
  },
  markers: { active: 'x', frontier: '·', sorted: '✓', visited: '★' },
  structLegend: {
    active: 'Cấu trúc đang được ghé',
    frontier: 'Có lời gọi chưa kết thúc ở phía trên',
    swap: 'Min hoặc max của nó vừa thay đổi',
  },
  structMarkers: { active: '→', frontier: '↑', swap: '✎' },
  /**
   * @param {VebFrame} f
   */
  describe(f) {
    const r = Math.sqrt(f.u);
    const name = f.path;
    const node = f.nodes.find((n) => n.path === f.path);
    switch (f.kind) {
      case 'start':
        return `Cây van Emde Boas trên u = ${f.universe}: ${Math.sqrt(f.universe)} cụm, mỗi cụm ${Math.sqrt(f.universe)} khoá, một bản tóm tắt, và cách chia y hệt bên trong từng phần.`;
      case 'present':
        return `${f.x} đã có trong tập hợp: cây vEB lưu mỗi khoá đúng một lần.`;
      case 'absent':
        return `${f.x} không có trong tập hợp, nên không có gì để xoá.`;
      case 'call':
        return f.u === 2
          ? `${f.op}(${name}, ${f.x}): kích thước 2, trường hợp cơ sở, chỉ có min và max.`
          : `${f.op}(${name}, ${f.x}) trên kích thước ${f.u}: high(${f.x}) = ${f.high}, low(${f.x}) = ${f.low}.`;
      case 'empty-insert':
        return `${name} đang rỗng: đặt min = max = ${f.x}. Không có gì đi vào cụm nào, nên bước này tốn O(1).`;
      case 'swap-min':
        return f.u === 2
          ? `${f.x} < min ${f.result}: ${f.x} trở thành min của ${name}, còn min cũ ${f.result} ở lại làm max.`
          : `${f.x} < min ${f.result}: ${f.x} trở thành min của ${name}, còn min cũ ${f.result} được chèn xuống dưới thay cho nó.`;
      case 'cluster-empty':
        return `Cụm ${f.high} đang rỗng: trước hết ghi ${f.high} vào bản tóm tắt.`;
      case 'fill-cluster':
        return `Sau đó cụm ${f.high} nhận min = max = ${f.low} trong O(1), nên chỉ lời gọi vào bản tóm tắt là làm việc thật sự.`;
      case 'into-cluster':
        return `Cụm ${f.high} đã có khoá: chèn low = ${f.low} vào đó. Bản tóm tắt giữ nguyên.`;
      case 'set-max':
        return `${f.x} lớn hơn max: max mới của ${name} là ${f.x}.`;
      case 'base':
        return f.result === null
          ? `Kích thước 2: ở đây không có gì lớn hơn ${f.x}, nên ${name} không có phần tử kế tiếp.`
          : `Kích thước 2: x = 0 và max = 1, nên phần tử kế tiếp là 1.`;
      case 'min-shortcut':
        return `${f.x} < min = ${f.result}: min chính là phần tử kế tiếp, không cần gọi xuống dưới.`;
      case 'in-cluster':
        return `max(cụm ${f.high}) lớn hơn low = ${f.low}: phần tử kế tiếp nằm trong cụm ${f.high}. Gọi xuống một tầng.`;
      case 'to-summary':
        return `Cụm ${f.high} không còn gì sau ${f.low}: hỏi bản tóm tắt cụm khác rỗng tiếp theo sau ${f.high}.`;
      case 'no-succ':
        return `Không cụm nào phía sau có khoá: ${f.x} không có phần tử kế tiếp trong ${name}.`;
      case 'combine': {
        const result = /** @type {number} */ (f.result);
        const h = Math.floor(result / r);
        const off = result % r;
        return f.lines[0] === 12
          ? `index(${h}, ${off}) = ${h}·${r} + ${off} = ${result}: phần tử kế tiếp trong ${name}.`
          : `Cụm có khoá tiếp theo là ${h}, và min của nó là ${off}: index(${h}, ${off}) = ${h}·${r} + ${off} = ${result}.`;
      }
      case 'answer':
        if (f.op === 'successor')
          return `successor(${f.x}) = ${f.result === null ? 'không có' : f.result}, sau ${f.calls} lời gọi trên ${f.depth} tầng.`;
        return `Đã ${f.op === 'insert' ? 'chèn' : 'xoá'} ${f.x}: ${f.calls} lời gọi trên ${f.depth} tầng.`;
      case 'del-only':
        return `${name} chỉ chứa ${f.x}: xoá min và max của nó trong O(1).`;
      case 'del-base':
        return `Kích thước 2 đang chứa cả 0 và 1: xoá ${f.x}, còn lại ${1 - f.x}.`;
      case 'del-min':
        return `Min của ${name} sắp bị xoá: khoá nhỏ tiếp theo, ${f.x} (min của cụm đầu tiên theo bản tóm tắt), trở thành min. Thay vào đó ta xoá ${f.x} khỏi cụm của nó.`;
      case 'del-into':
        return `Xoá low = ${f.low} khỏi cụm ${f.high}.`;
      case 'del-summary':
        return `Cụm ${f.high} giờ đã rỗng: xoá cả ${f.high} khỏi bản tóm tắt. Cụm đó chỉ chứa một khoá, nên lời gọi kia tốn O(1).`;
      case 'del-max':
        return `${f.x} từng là max của ${name}: max mới là ${node?.max ?? 'min của nó'}.`;
      case 'done':
        return `Đã làm xong mọi thao tác: tổng cộng ${f.totalCalls} lời gọi.`;
    }
  },
  takeaways: [
    'Cây vEB làm việc với khoá nguyên trong {0, …, u − 1}. Khoá x nằm ở cụm high(x) = ⌊x / √u⌋ tại vị trí low(x) = x mod √u, và index(h, l) = h·√u + l ghép nó lại.',
    'Bản tóm tắt bản thân cũng là một cây vEB kích thước √u ghi lại những cụm có khoá, nên “cụm khác rỗng tiếp theo” chỉ là một truy vấn tìm phần tử kế tiếp trên nó.',
    'Giữ min và max ở mọi tầng, và để min ở ngoài các cụm, khiến mỗi thao tác chỉ có một lời gọi làm việc thật sự: chèn vào một cụm rỗng hay xoá khoá cuối cùng của một cụm đều tốn O(1).',
    'Mỗi tầng lấy căn bậc hai, u → √u → u^(1/4) → … → 2, nên có log₂ log₂ u + 1 tầng và mỗi thao tác tốn O(log log u). Cái giá phải trả là bộ nhớ: O(u), dù lưu ít khoá đến đâu.',
    'Thử xem: hỏi successor(120) với u = 256 và đếm số tầng, rồi hỏi một phần tử kế tiếp với u = 16. Bình phương vũ trụ chỉ thêm đúng một tầng.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Min, max', 'O(1)', 'Được lưu ở cấu trúc trên cùng.'],
    [
      'Chèn, xoá',
      'O(log log u)',
      'Mỗi tầng có nhiều nhất một lời gọi làm việc thật sự; lời gọi còn lại gặp một cấu trúc rỗng hoặc chỉ có một khoá, tốn O(1).',
    ],
    [
      'Tìm kế tiếp, tìm liền trước',
      'O(log log u)',
      'Hoặc một lời gọi vào cụm, hoặc một lời gọi vào bản tóm tắt, không bao giờ cả hai: T(u) = T(√u) + O(1).',
    ],
    ['Kiểm tra thuộc', 'O(log log u)', 'So sánh với min và max, rồi xem trong một cụm.'],
    [
      'Bộ nhớ',
      'O(u)',
      'Mọi cụm và bản tóm tắt đều có sẵn từ đầu; dùng hash table (bảng băm) cho các cụm khác rỗng sẽ giảm xuống còn O(n).',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt: 'Với u = 16, high(13) và low(13) bằng bao nhiêu? Hãy gõ dạng high, low.',
      accept: ['3, 1', '3,1', '3 1', '(3, 1)'],
      hints: ['√16 = 4: high(x) = ⌊x / 4⌋ và low(x) = x mod 4.'],
      solution:
        'high(13) = ⌊13 / 4⌋ = 3 và low(13) = 13 mod 4 = 1: khoá 13 nằm ở vị trí 1 của cụm 3.',
    },
    {
      type: 'number',
      prompt:
        'Nạp bộ mẫu u = 16: {2, 3, 4, 5, 7, 14, 15}. Phép successor(7) thực hiện bao nhiêu lời gọi?',
      answer: 3,
      unit: 'lời gọi',
      hints: ['Đi tới kết quả của thao tác cuối cùng rồi đọc ô Số lời gọi, thao tác này.'],
      solution:
        'Cụm 1 không còn gì sau 7, nên successor(V, 7) hỏi bản tóm tắt V.S cụm nằm sau cụm 1, và lời gọi đó lại hỏi V.S.S, một trường hợp cơ sở kích thước 2: tất cả 3 lời gọi, mỗi tầng một lời gọi, và kết quả là 14.',
    },
    {
      type: 'number',
      prompt:
        'Một cây vEB trên u = 2³² = 4 294 967 296 khoá có bao nhiêu tầng, tính cả tầng trên cùng?',
      answer: 6,
      unit: 'tầng',
      hints: ['Mỗi tầng lấy căn bậc hai: 2³² → 2¹⁶ → 2⁸ → …, xuống tới kích thước 2.'],
      solution:
        'Các kích thước là 2³², 2¹⁶, 2⁸, 2⁴, 2², 2¹: sáu tầng, tức log₂ log₂ u + 1 = log₂ 32 + 1 = 6.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao chèn vào một cụm rỗng không tốn hai lời gọi đệ quy đầy đủ?',
      options: [
        'Vì bản tóm tắt không bao giờ được cập nhật',
        'Vì một cụm rỗng chỉ cần min = max = low(x), tốn O(1)',
        'Vì các cụm là hash table',
        'Vì high(x) luôn bằng 0',
      ],
      answer: 1,
      hints: ['Phép chèn làm gì khi V.min = nil?'],
      solution:
        'Một cấu trúc rỗng nhận khoá chỉ bằng cách đặt min = max, không cần gọi xuống dưới. Chỉ lần chèn vào bản tóm tắt là làm việc thật sự, nên T(u) = T(√u) + O(1) = O(log log u).',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Luyện tập: heap nâng cao, cho heap nhị phân, heap Fibonacci và cây vEB thi đấu trên cùng một chuỗi thao tác để xem cấu trúc nào hợp với việc nào.',
};
