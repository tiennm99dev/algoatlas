/** @typedef {import('$lib/algo-engine/binary-trees.js').BinaryTreeFrame} BinaryTreeFrame */

export const vi = {
  slug: 'binary-trees',
  topic: 'trees',
  level: 'Cơ bản',
  title: 'Cây nhị phân và thuật ngữ',
  intro:
    'Cây nhị phân là một nút gốc có con trái và con phải đều là những cây nhị phân nhỏ hơn, và con nào cũng có thể rỗng. Độ sâu đếm số cạnh đi xuống từ gốc, chiều cao đếm số cạnh đi xuống tới lá sâu nhất, còn cây đầy đủ thì xếp được vào một mảng mà không để lại ô trống nào.',
  summary:
    'Dựng một cây nhị phân từng nút một và theo dõi độ sâu, chiều cao của mọi nút, các phép kiểm tra cây đủ và cây đầy đủ, cùng các ô mảng của cây.',
  instruction:
    'Chọn một nút, rồi thêm con trái, con phải hoặc xoá cây con của nó. Mỗi nút ghi d (độ sâu) và h (chiều cao). Chạy từng bước phép đo để thấy độ sâu đi xuống và chiều cao đi ngược lên, và xem hàng mảng bên dưới cây.',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Mở một mẫu…',
  presets: {
    complete: 'Đầy đủ',
    perfect: 'Hoàn hảo',
    full: 'Đủ, chưa đầy đủ',
    chain: 'Chuỗi lệch phải',
    random: 'Ngẫu nhiên',
  },
  addLeft: 'Thêm con trái',
  addRight: 'Thêm con phải',
  addRoot: 'Thêm gốc',
  remove: 'Xoá cây con',
  undo: 'Hoàn tác',
  /** @param {string | null} label */
  selectedText: (label) => (label ? `Đang chọn: ${label}` : 'Hãy chọn một nút trên cây.'),
  errors: {
    select: 'Hãy chọn một nút trước đã.',
    /** @param {number} max */
    depth: (max) => `Ở đây nút chỉ được nằm tối đa ở độ sâu ${max}, nên con này sẽ quá sâu.`,
    /** @param {string} label @param {'left'|'right'} side */
    taken: (label, side) => `${label} đã có con ${side === 'left' ? 'trái' : 'phải'} rồi.`,
  },
  treeTitle: 'Cây',
  /** @param {number} size @param {number} height */
  treeAria: (size, height) =>
    size === 0 ? 'Cây rỗng.' : `Cây nhị phân gồm ${size} nút, chiều cao ${height}.`,
  /** @param {string} label @param {number | null} depth @param {number | null} height @param {string} state */
  nodeLabel: (label, depth, height, state) =>
    [
      `Nút ${label}`,
      depth === null ? 'chưa có độ sâu' : `độ sâu ${depth}`,
      height === null ? 'chưa có chiều cao' : `chiều cao ${height}`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  /** @param {number | null} d @param {number | null} h */
  note: (d, h) => [d === null ? '' : `d${d}`, h === null ? '' : `h${h}`].filter(Boolean).join(' '),
  arrayTitle: 'Biểu diễn bằng mảng',
  emptySlot: '·',
  /** @param {(string | null)[]} slots */
  arrayAria: (slots) =>
    `Mảng gồm ${slots.length} ô: ${slots.map((s, i) => `${i} ${s ?? 'trống'}`).join(', ')}.`,
  /** @param {number} i @param {string | null} v */
  slotLabel: (i, v) => `Ô ${i}: ${v ?? 'trống'}`,
  /** @param {number} i @param {number} parent @param {number} left @param {number} right @param {number} max */
  slotMath: (i, parent, left, right, max) =>
    `Ô ${i}: cha ⌊(i − 1) / 2⌋ = ${parent < 0 ? 'không có (gốc)' : parent}, con 2i + 1 = ${left < max ? left : '—'} và 2i + 2 = ${right < max ? right : '—'}.`,
  states: {
    active: 'đang đo',
    frontier: 'đang chờ các con',
    visited: 'đã đo',
    swap: 'phá vỡ tính chất',
  },
  markers: { active: '▶', frontier: '…', visited: '✓', swap: '!' },
  legend: {
    active: 'Đang đo',
    frontier: 'Đang chờ trên call stack',
    visited: 'Đã biết độ sâu và chiều cao',
    swap: 'Phá vỡ tính đủ hoặc đầy đủ',
    selected: 'Đang chọn (viền xanh đậm)',
  },
  stats: { size: 'Số nút', leaves: 'Số lá', height: 'Chiều cao', array: 'Độ dài mảng' },
  notYet: '?',
  stackTitle: 'Call stack (ngoài cùng trước)',
  stackEmpty: 'rỗng',
  /** @param {string} label @param {number} d */
  stackChip: (label, d) => `measure(${label}, ${d})`,
  propsTitle: 'Tính chất',
  props: { full: 'Đủ', complete: 'Đầy đủ', perfect: 'Hoàn hảo' },
  /** @param {boolean | null} v */
  verdict: (v) => (v === null ? 'chưa kiểm tra' : v ? 'có' : 'không'),
  /** @param {BinaryTreeFrame} f */
  describe(f) {
    const at = f.current >= 0 ? f.slots[f.current] : null;
    switch (f.kind) {
      case 'start':
        return f.size === 0
          ? 'Cây đang rỗng. Hãy thêm một gốc để bắt đầu.'
          : `Gọi measure trên gốc ${f.slots[0]} với độ sâu 0.`;
      case 'enter':
        return f.depth[f.current] === 0
          ? `${at} là gốc, nên độ sâu của nó là 0.`
          : `${at} nằm dưới cha một cạnh, nên độ sâu của nó là ${f.depth[f.current]}.`;
      case 'leaf':
        return `${at} không có con: nó là lá, chiều cao 0.`;
      case 'descend':
        return `${at} là nút trong. Chiều cao của nó phụ thuộc vào các con, nên ta đo các con trước.`;
      case 'up': {
        const kids = [2 * f.current + 1, 2 * f.current + 2].filter(
          (c) => c < f.slots.length && f.slots[c] !== null,
        );
        const hs = kids.map((c) => `${f.slots[c]} ${f.height[c]}`).join(', ');
        const h = Number(f.height[f.current]);
        return `Đã đo xong các con (${hs}), nên ${at} có chiều cao 1 + ${h - 1} = ${h}.`;
      }
      case 'full':
        return f.full
          ? 'Mọi nút đều có 0 hoặc 2 con, nên cây là cây đủ.'
          : `${at} có đúng một con, nên cây không phải cây đủ.`;
      case 'complete':
        return f.complete
          ? `${f.size} nút lấp kín các ô từ 0 đến ${Math.max(0, f.size - 1)} không chừa ô trống, nên cây là cây đầy đủ.`
          : `Ô ${f.current} trống nhưng một ô phía sau lại có nút, nên cây không phải cây đầy đủ.`;
      case 'done':
        return f.size === 0
          ? 'Xong: theo quy ước, cây rỗng vừa đủ, vừa đầy đủ, vừa hoàn hảo.'
          : `Xong: chiều cao ${f.height[0]}, ${f.leaves} lá. ${f.perfect ? `Cây hoàn hảo: cả 2^(h + 1) − 1 = ${f.size} ô của các tầng đều có nút.` : `Một cây hoàn hảo cùng chiều cao sẽ có ${2 ** (Number(f.height[0]) + 1) - 1} nút.`}`;
    }
  },
  takeaways: [
    'Gốc có độ sâu 0 và mỗi cạnh đi xuống cộng thêm 1. Chiều cao đếm số cạnh trên đường dài nhất đi xuống một lá, nên lá có chiều cao 0 và chiều cao của cây là chiều cao của gốc. Một số sách đếm số tầng thay vì số cạnh, tức là cộng thêm 1.',
    'Độ sâu truyền xuống (độ sâu của cha + 1) còn chiều cao truyền lên (1 + chiều cao của con cao hơn), nên một lần duyệt đệ quy tính được cả hai: độ sâu trước khi xuống các con, chiều cao sau khi các con xong.',
    'Cây đủ nghĩa là mọi nút có 0 hoặc 2 con. Cây đầy đủ nghĩa là mọi tầng đều kín, có thể trừ tầng cuối, và tầng cuối được lấp từ trái sang. Cây hoàn hảo vừa đủ vừa đầy đủ: mọi tầng đều kín, tổng cộng 2^(h + 1) − 1 nút.',
    'Trong biểu diễn bằng mảng, ô i có các con 2i + 1, 2i + 2 và cha ⌊(i − 1) / 2⌋. Cây đầy đủ dùng đúng n ô; heap (đống) dựa vào điều này.',
    'Thử mẫu “Chuỗi lệch phải”: 4 nút cần tới 15 ô mảng, vì mỗi lần sang phải chỉ số ô lại tăng gấp đôi.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Đo mọi độ sâu và chiều cao', 'O(n)', 'Mỗi nút một lời gọi, mỗi lời gọi tốn hằng số việc.'],
    ['Stack đệ quy', 'O(h)', 'Mỗi lúc mỗi tầng chỉ có một lời gọi đang mở.'],
    ['Tìm cha hoặc con trong mảng', 'O(1)', 'Tính chỉ số: 2i + 1, 2i + 2, ⌊(i − 1) / 2⌋.'],
    [
      'Bộ nhớ mảng',
      'từ n đến 2ⁿ − 1 ô',
      'Đúng n ô cho cây đầy đủ; một chuỗi làm chỉ số tăng gấp đôi ở mỗi tầng.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Một cây nhị phân hoàn hảo có chiều cao 3 (đếm theo cạnh). Cây có bao nhiêu nút?',
      answer: 15,
      unit: 'nút',
      hints: ['Các tầng 0 đến 3 lần lượt chứa 1, 2, 4 và 8 nút.'],
      solution: 'Cây hoàn hảo chiều cao h có 2^(h + 1) − 1 nút: 1 + 2 + 4 + 8 = 15.',
    },
    {
      type: 'number',
      prompt: 'Trong biểu diễn bằng mảng, ô nào chứa cha của nút ở ô 9?',
      answer: 4,
      hints: ['Cha của ô i là ⌊(i − 1) / 2⌋.'],
      solution: '⌊(9 − 1) / 2⌋ = 4. Kiểm tra lại: ô 4 có các con 2·4 + 1 = 9 và 2·4 + 2 = 10.',
    },
    {
      type: 'multi',
      prompt:
        'Mở mẫu “Đủ, chưa đầy đủ” (A có hai con B và C, C có hai con D và E). Những khẳng định nào đúng?',
      options: ['B là lá', 'Cây có chiều cao 2', 'D có độ sâu 1', 'Mảng cần 7 ô cho 5 nút'],
      answers: [0, 1, 3],
      hints: ['Chạy đến bước cuối rồi đọc nhãn d, h và hàng mảng.'],
      solution:
        'B không có con nên là lá. D và E nằm ở độ sâu 2, làm cây có chiều cao 2. Chúng nằm ở ô 5 và 6, nên mảng có 7 ô với chỗ trống ở ô 3 và 4.',
    },
  ],
  nextTeaser:
    'Bài sau, Duyệt cây, đi qua mọi nút theo ba thứ tự trước, giữa, sau và theo từng tầng.',
};
