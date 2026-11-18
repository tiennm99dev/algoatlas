/** @typedef {import('$lib/algo-engine/practice-tree-techniques.js').TreeOpFrame} TreeOpFrame */
/** @typedef {import('$lib/algo-engine/practice-tree-techniques.js').TreeOp} TreeOp */

export const vi = {
  slug: 'practice-tree-techniques',
  topic: 'tree-techniques',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán cây nâng cao',
  intro:
    'Hai bài toán cây kinh điển: tổng các giá trị trên một đường đi, và khoảng cách giữa hai nút, trong khi các giá trị liên tục thay đổi. Chạy danh sách truy vấn của chính bạn bằng phân rã nặng nhẹ (heavy-light decomposition, HLD) và bằng cách thô đi dọc đường đi, rồi so sánh khối lượng công việc của mỗi cách.',
  summary:
    'Nhập các truy vấn tổng trên đường đi, khoảng cách và cập nhật trên một cây, rồi so sánh phân rã nặng nhẹ với cách thô đi dọc đường đi, từng truy vấn một.',
  instruction:
    'Sửa danh sách thao tác (sum u v, dist u v, set v x, cách nhau bằng dấu phẩy) hoặc chọn một mẫu, rồi chạy từng bước. Mỗi bước chạy một thao tác theo cả hai cách: đường đi sáng lên, các đoạn trên chuỗi được đóng ngoặc trong mảng nền, và chi phí của cả hai cách được cộng vào tổng.',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presets: {
    sample: 'Cây mẫu',
    caterpillar: 'Cây sâu bướm 26 nút',
    random: 'Cây và truy vấn ngẫu nhiên',
  },
  opsLabel: 'Các thao tác',
  opsHelp: 'sum u v · dist u v · set v x (x từ 0 đến 9), cách nhau bằng dấu phẩy',
  opErrors: {
    empty: 'Hãy nhập ít nhất một thao tác, ví dụ “sum A B”.',
    format: 'Mỗi thao tác có dạng “sum u v”, “dist u v” hoặc “set v x”.',
    node: 'Dùng tên các nút có trên cây.',
    value: 'Giá trị mới là số nguyên từ 0 đến 9.',
    many: 'Mỗi lần nhiều nhất 12 thao tác.',
  },
  treeTitle: 'Cây',
  /** @param {number} n */
  treeAria: (n) => `Cây gồm ${n} nút; H đánh dấu cạnh nặng.`,
  heavyMark: 'H',
  /** @param {number} value */
  note: (value) => String(value),
  noteKey: 'Dưới mỗi nút: giá trị của nó. H trên một cạnh: cạnh nặng.',
  /** @param {string} label @param {number} value @param {string} state */
  nodeLabel: (label, value, state) =>
    [`Nút ${label}`, `giá trị ${value}`, state].filter(Boolean).join(', '),
  states: {
    path: 'trên đường đi của truy vấn',
    lca: 'tổ tiên chung gần nhất',
    set: 'vừa đặt giá trị',
    u: 'u',
    v: 'v',
  },
  markers: { sorted: '★', swap: '✎' },
  legend: {
    path: 'Trên đường đi của truy vấn (u, v đánh dấu hai đầu)',
    sorted: '★ Tổ tiên chung gần nhất',
    swap: '✎ Vừa đặt giá trị',
  },
  arrayTitle: 'Mảng nền theo thứ tự HLD: mỗi chuỗi là một khối',
  arrayAria:
    'Giá trị các nút theo thứ tự nặng nhẹ, các đoạn trên chuỗi của truy vấn được đóng ngoặc.',
  /** @param {string} label @param {number} value */
  cellLabel: (label, value) => `${label}, giá trị ${value}`,
  /** @param {number} i */
  windowLabel: (i) => `đoạn ${i + 1}`,
  opsTitle: 'Các thao tác (kết quả · cách thô · HLD)',
  opsEmpty: 'không có',
  /** @param {string} op @param {number | null} answer @param {number} naive @param {number} hld */
  opChip: (op, answer, naive, hld) =>
    answer === null ? op : `${op} → ${answer} · ${naive} · ${hld}`,
  stats: {
    answer: 'Kết quả',
    step: 'Thao tác',
    naive: 'Công việc, cách thô',
    hld: 'Công việc, HLD',
  },
  none: '–',
  /**
   * @param {TreeOpFrame} f @param {TreeOp[]} ops @param {string[]} labels @param {number[]} depth
   * @param {number} chains
   */
  describe(f, ops, labels, depth, chains) {
    const L = (/** @type {number} */ x) => labels[x];
    const op = f.op >= 0 ? ops[f.op] : null;
    switch (f.kind) {
      case 'start':
        return `${ops.length} thao tác trên một cây ${labels.length} nút, được cắt thành ${chains} chuỗi nặng. Mỗi bước chạy một thao tác theo cả hai cách.`;
      case 'sum':
        if (!op || op.type === 'set') return '';
        return `sum ${L(op.u)} ${L(op.v)} = ${f.answer}. Cách thô: đi qua ${f.naive} nút của đường đi. HLD: ${f.ranges.length} đoạn trên chuỗi, thăm ${f.hld} nút cây phân đoạn.`;
      case 'dist':
        if (!op || op.type === 'set') return '';
        return `dist ${L(op.u)} ${L(op.v)} = ${f.answer} cạnh: lca là ${L(f.lca)}, nên ${depth[op.u]} + ${depth[op.v]} − 2·${depth[f.lca]}. Cách thô: đi qua ${f.naive} nút. HLD: leo qua ${f.ranges.length} chuỗi đến ${L(f.lca)}, rồi đọc 3 độ sâu: ${f.hld} bước.`;
      case 'set':
        if (!op || op.type !== 'set') return '';
        return `set ${L(op.u)} ${op.x}: cách thô ghi 1 giá trị; HLD còn cập nhật lá của cây phân đoạn và các tổ tiên của nó: ${f.hld} nút.`;
      case 'done': {
        const winner =
          f.naiveTotal === f.hldTotal
            ? 'hai cách hoà nhau'
            : f.naiveTotal < f.hldTotal
              ? 'ở đây cách thô làm ít việc hơn'
              : 'ở đây HLD làm ít việc hơn';
        return `Xong hết: cách thô ${f.naiveTotal}, HLD ${f.hldTotal}, ${winner}. Trên một cây nhỏ thế này thì đường đi ngắn; O(log² n) của HLD thắng khi đường đi dài ra.`;
      }
    }
  },
  takeaways: [
    'Tổng trên đường đi bằng phân rã nặng nhẹ là một đoạn cây phân đoạn cho mỗi chuỗi mà đường đi gặp: O(log n) đoạn, mỗi đoạn O(log n). Cách thô đọc mọi nút trên đường đi, có thể tới n nút.',
    'Khoảng cách chỉ cần tổ tiên chung gần nhất: dist(u, v) = depth[u] + depth[v] − 2·depth[lca]. Leo lên theo từng chuỗi tìm được LCA trong O(log n) bước; nhảy nhị phân cũng làm được.',
    'Cập nhật là lúc một mảng giá trị bình thường toả sáng (một lần ghi) và là lúc HLD phải trả O(log n). Tổng tiền tố dọc các đường đi từ gốc, một cách sửa dễ khác, sẽ phải trả O(n) cho mỗi lần cập nhật.',
    'Trên cây rất nhỏ, hằng số quyết định, và cách thô thường thắng. Trên một đường thẳng 100 000 nút, cách thô tốn 100 000 cho mỗi truy vấn, còn O(log² n) chỉ vài trăm.',
    'Chọn Cây sâu bướm và so sánh sum N Z với sum Y Z: chi phí cách thô theo độ dài đường đi (15 so với 4), còn chi phí HLD theo số đoạn và cây phân đoạn, không theo độ dài (20 so với 30).',
  ],
  complexityHead: ['Thao tác', 'Cách thô', 'Phân rã nặng nhẹ'],
  complexity: [
    [
      'Tổng hoặc giá trị lớn nhất trên đường đi',
      'O(độ dài đường đi), tới O(n)',
      'O(log² n): O(log n) chuỗi, mỗi chuỗi một đoạn cây phân đoạn',
    ],
    ['Khoảng cách', 'O(độ dài đường đi)', 'O(log n): leo theo chuỗi đến LCA, rồi đọc ba độ sâu'],
    ['Đặt một giá trị', 'O(1)', 'O(log n): một lá của cây phân đoạn và các tổ tiên của nó'],
    ['Chuẩn bị', 'không cần', 'O(n): hai lượt duyệt và dựng cây phân đoạn'],
  ],
  practiceTitle: 'Bài tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chọn Cây mẫu và chạy các thao tác của nó. Sau “set D 0”, lần “sum M L” thứ hai trả về bao nhiêu?',
      answer: 33,
      hints: [
        'Lần sum M L đầu tiên cho 34.',
        'D nằm trên đường đi và giá trị của nó giảm từ 1 xuống 0.',
      ],
      solution:
        'Đường đi M, H, D, B, A, C, G, L có tổng 34. Đặt D từ 1 thành 0 làm tổng giảm 1: 33.',
    },
    {
      type: 'number',
      prompt: 'Trên Cây mẫu, dist K O bằng bao nhiêu?',
      answer: 8,
      unit: 'cạnh',
      hints: [
        'Chạy đến thao tác cuối và đọc lời thuyết minh.',
        'Tổ tiên chung gần nhất của chúng là gốc A.',
      ],
      solution:
        'K ở độ sâu 3, O ở độ sâu 5, và LCA của chúng là A ở độ sâu 0: 3 + 5 − 2·0 = 8 cạnh.',
    },
    {
      type: 'number',
      prompt: 'Chọn Cây sâu bướm 26 nút. “sum N Z” được chia thành bao nhiêu đoạn trên chuỗi?',
      answer: 2,
      unit: 'đoạn',
      hints: [
        'Xương sống A–M, rồi Z treo dưới M, là một chuỗi nặng.',
        'N treo dưới A qua một cạnh nhẹ.',
      ],
      solution:
        'N tự là một chuỗi, còn phần còn lại của đường đi, từ A qua M xuống Z, nằm trên chuỗi của xương sống: 2 đoạn.',
    },
    {
      type: 'number',
      prompt:
        'Trên Cây sâu bướm, tổng công việc của cách thô cho cả danh sách thao tác là bao nhiêu?',
      answer: 50,
      hints: [
        'Chạy đến cuối và đọc tổng của cách thô.',
        'Cộng các độ dài đường đi: 15 + 15 + 4 + 1 + 15.',
      ],
      solution:
        'sum N Z đi qua 15 nút, dist N Z 15 nút, sum Y Z 4 nút, set G 9 ghi 1 lần và sum N Z cuối cùng lại đi qua 15 nút: 50.',
    },
    {
      type: 'multi',
      prompt: 'Trên Cây sâu bướm, những thao tác nào cách thô tốn ít công việc hơn HLD?',
      options: ['sum N Z', 'dist N Z', 'sum Y Z', 'set G 9'],
      answers: [0, 2, 3],
      hints: [
        'So sánh hai chi phí trên mỗi thẻ trong danh sách Các thao tác.',
        'Khoảng cách chỉ cần leo theo chuỗi, không cần truy vấn cây phân đoạn.',
      ],
      solution:
        'sum N Z tốn 15 so với 20, sum Y Z 4 so với 30, và set G 9 1 so với 5. Chỉ dist N Z rẻ hơn khi dùng HLD: 5 bước so với 15.',
    },
    {
      type: 'text',
      prompt: 'Viết dist(u, v) theo depth và tổ tiên chung gần nhất lca.',
      accept: [
        'depth[u] + depth[v] − 2·depth[lca]',
        'depth[u] + depth[v] - 2*depth[lca]',
        'depth[u] + depth[v] - 2 depth[lca]',
        'depth(u) + depth(v) - 2*depth(lca)',
        'depth(u) + depth(v) − 2·depth(lca)',
      ],
      hints: ['Cả hai nút leo lên đến LCA.', 'u leo depth[u] − depth[lca] cạnh.'],
      solution:
        'u leo depth[u] − depth[lca] cạnh và v leo depth[v] − depth[lca] cạnh, nên dist(u, v) = depth[u] + depth[v] − 2·depth[lca].',
    },
  ],
  nextTeaser:
    'Cây đã xong; bài sau, Luỹ thừa ma trận, dùng phép nhân ma trận lặp lại để tính nhanh các dãy truy hồi.',
};
