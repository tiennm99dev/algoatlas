/** @typedef {import('$lib/algo-engine/lca-binary-lifting.js').LiftFrame} LiftFrame */

/** 2^k written with a superscript. @param {number} k */
const pow = (k) => `2${'⁰¹²³⁴⁵⁶⁷⁸⁹'[k]}`;

export const vi = {
  slug: 'lca-binary-lifting',
  topic: 'tree-techniques',
  level: 'Trung bình',
  title: 'Tổ tiên chung gần nhất và nhảy nhị phân',
  intro:
    'Tổ tiên chung gần nhất (LCA) của hai nút là nút sâu nhất có cả hai nút đó ở bên dưới: nơi hai đường đi từ chúng lên gốc gặp nhau. Đi lên từng bước một theo nút cha tốn O(độ sâu) cho mỗi truy vấn. Nhảy nhị phân (binary lifting) lưu sẵn, cho mọi nút, các tổ tiên ở 1, 2, 4, 8, … tầng phía trên, nên mọi lần leo đều tách được thành O(log n) bước nhảy.',
  summary:
    'Dựng bảng nhảy nhị phân trên cây của chính em, rồi xem hai nút nhảy theo luỹ thừa của 2 đến tổ tiên chung gần nhất của chúng.',
  instruction:
    'Chọn u và v, hoặc chọn một nút rồi thêm hay xoá con của nó. Chạy từng bước phần dựng bảng để thấy mỗi ô được ghép từ hai bước nhảy dài một nửa, rồi đến phần truy vấn: đầu tiên u leo lên bằng độ sâu của v, sau đó cả hai cùng leo chừng nào tổ tiên của chúng còn khác nhau.',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presets: {
    family: 'Cây gia phả',
    path: 'Đường thẳng 16 nút',
    broom: 'Cây chổi',
    random: 'Ngẫu nhiên',
  },
  uLabel: 'u',
  vLabel: 'v',
  addChild: 'Thêm con',
  remove: 'Xoá cây con',
  undo: 'Hoàn tác',
  /** @param {string} label */
  selectedText: (label) => `Đang chọn: ${label}`,
  errors: {
    /** @param {number} max */
    full: (max) => `Cây đã đầy (${max} nút). Hãy xoá một cây con trước.`,
    root: 'Gốc phải giữ lại: hãy xoá một cây con của nó, hoặc chọn một mẫu.',
  },
  treeTitle: 'Cây',
  /** @param {number} n */
  treeAria: (n) => `Cây có gốc gồm ${n} nút.`,
  /** @param {string} label @param {number | null} depth @param {string} state */
  nodeLabel: (label, depth, state) =>
    [`Nút ${label}`, depth === null ? '' : `độ sâu ${depth}`, state].filter(Boolean).join(', '),
  /** @param {number | null} depth */
  note: (depth) => (depth === null ? '' : `d${depth}`),
  states: {
    filling: 'đang điền ô của nút',
    halfway: 'tổ tiên ở nửa đường',
    landing: 'nơi bước nhảy đáp xuống',
    u: 'u ở đây',
    v: 'v ở đây',
    both: 'cả u và v đều ở đây',
    candidate: 'tổ tiên chung, quá cao để nhảy tới',
    climbed: 'đã leo qua',
    lca: 'tổ tiên chung gần nhất',
    path: 'trên đường đi u–v',
  },
  markers: { active: '▶', frontier: '◇', compare: '→', visited: '·', sorted: '★', path: '★' },
  legend: {
    active: '▶ Đang điền ô của nút này, hoặc u và v (đánh dấu u, v)',
    frontier: '◇ Tổ tiên ở nửa đường, hoặc tổ tiên chung quá cao để nhảy tới',
    compare: '→ Nơi bước nhảy đáp xuống',
    visited: 'Đã leo qua',
    sorted: '★ LCA',
    path: 'Đường đi u–v qua LCA',
    selected: 'Đang chọn (vòng xanh mòng két đậm)',
  },
  tableTitle: 'Bảng nhảy: up[k][v] là tổ tiên cách v 2ᵏ tầng về phía trên',
  /** @param {number} k */
  rowHeader: (k) => pow(k),
  tableAria: 'Bảng nhảy, mỗi hàng một luỹ thừa của 2, mỗi cột một nút.',
  /** @param {number} k @param {string} node @param {string | null} target */
  cellLabel: (k, node, target) =>
    `${pow(k)} = ${2 ** k} tầng phía trên ${node}: ${target ?? 'chưa điền'}`,
  eulerTitle: 'Cùng đáp án bằng chu trình Euler + giá trị nhỏ nhất trên đoạn',
  eulerAria: 'Chu trình Euler của cây, đoạn giữa lần thăm đầu tiên của u và của v được đóng ngoặc.',
  /** @param {string} label @param {number} depth */
  eulerCell: (label, depth) => `${label}, độ sâu ${depth}`,
  eulerWindow: 'lần đầu gặp u … lần đầu gặp v',
  /** @param {string} u @param {string} v @param {string} lca @param {number} depth @param {number} len */
  eulerNote: (u, v, lca, depth, len) =>
    `Chu trình ghi lại một nút khi đi vào nó và sau mỗi lần một con của nó quay về (${len} mục). Giữa lần thăm đầu tiên của ${u} và của ${v}, mục nông nhất là ${lca} (độ sâu ${depth}): đó là LCA của chúng. Sparse table trả lời truy vấn giá trị nhỏ nhất trên đoạn này trong O(1).`,
  stats: {
    lca: 'LCA',
    d: 'Chênh lệch độ sâu d',
    cells: 'Số ô đã điền',
    reads: 'Số lần đọc bảng khi truy vấn',
  },
  notYet: '?',
  /**
   * @param {LiftFrame} f @param {string[]} labels
   */
  describe(f, labels) {
    const L = (/** @type {number} */ x) => labels[x];
    const n = f.depth.length;
    switch (f.kind) {
      case 'start':
        return `Dựng bảng nhảy trước: ${n} nút × 4 hàng (1, 2, 4 và 8 tầng phía trên) là đủ cho mọi độ sâu dưới 16.`;
      case 'base':
        return `Hàng ${pow(0)} là cha của mỗi nút, đọc thẳng từ cây, kèm độ sâu của từng nút. Gốc ${L(0)} là cha của chính nó, nên một bước nhảy vượt quá gốc sẽ dừng ở gốc.`;
      case 'fill': {
        const to = /** @type {number} */ (f.up[f.k][f.node]);
        return `up[${f.k}][${L(f.node)}]: đi lên ${2 ** (f.k - 1)} tầng từ ${L(f.node)} là ${L(f.mid)}, và lên thêm ${2 ** (f.k - 1)} tầng từ đó là ${L(to)}. Hai bước nhảy một nửa ghép thành một bước nhảy ${2 ** f.k}.`;
      }
      case 'query':
        return `Đã dựng xong bảng (${f.cells} ô). Giờ hỏi lca(${L(f.u)}, ${L(f.v)}).`;
      case 'level':
        return f.swapped
          ? `${L(f.u)} sâu hơn, nên đổi chỗ: u = ${L(f.u)} (độ sâu ${f.depth[f.u]}), v = ${L(f.v)} (độ sâu ${f.depth[f.v]}). u phải leo d = ${f.d} tầng.`
          : `u = ${L(f.u)} (độ sâu ${f.depth[f.u]}) sâu ít nhất bằng v = ${L(f.v)} (độ sâu ${f.depth[f.v]}). u phải leo d = ${f.d} tầng.`;
      case 'lift':
        return `Bit thứ ${f.k} của d = ${f.d} là 1: u nhảy lên ${2 ** f.k} tầng, ${L(f.from)} → ${L(f.u)}.`;
      case 'skip':
        return `Bit thứ ${f.k} của d = ${f.d} là 0: không nhảy ${2 ** f.k} tầng.`;
      case 'same':
        return `u và v gặp nhau ở cùng độ sâu trên cùng một nút, ${L(f.u)}: v là tổ tiên của u, nên LCA là ${L(f.u)}.`;
      case 'apart':
        return `Giờ đã cùng độ sâu, nhưng ${L(f.u)} ≠ ${L(f.v)}. Cho cả hai cùng leo, bước nhảy dài nhất trước, nhưng chỉ khi hai nút đáp xuống còn khác nhau.`;
      case 'jump':
        return `up[${f.k}] cho ${L(f.u)} và ${L(f.v)}: khác nhau, nên LCA còn ở cao hơn. Cả hai nhảy ${2 ** f.k} tầng: ${L(f.from)} → ${L(f.u)}, ${L(f.fromV)} → ${L(f.v)}.`;
      case 'hold': {
        const at = /** @type {number} */ (f.up[f.k][f.u]);
        return `up[${f.k}] cho ${L(at)} với cả hai: một tổ tiên chung, có thể đã quá cao. Không nhảy ${2 ** f.k} tầng.`;
      }
      case 'answer':
        return `${L(f.u)} và ${L(f.v)} giờ là con của cùng một nút, ngay dưới điểm gặp nhau một bậc. LCA là cha của chúng, ${L(f.answer)}.`;
      case 'done':
        return `lca = ${L(f.answer)}, sau ${f.reads} lần đọc bảng và ${f.moves} lần dời con trỏ.`;
    }
  },
  takeaways: [
    'Bảng nhảy up[k][v] chứa tổ tiên cách v 2ᵏ tầng về phía trên. Hàng 0 là cha; mỗi hàng sau là hai bước nhảy của hàng trước: up[k][v] = up[k−1][up[k−1][v]]. Dựng bảng tốn O(n log n).',
    'Mọi lần leo d tầng đều tách được thành các luỹ thừa của 2 trong dạng nhị phân của d, nên đưa u lên bằng độ sâu của v cần nhiều nhất log₂ n bước nhảy.',
    'Sau đó, cho cả hai nút nhảy 2ᵏ tầng với k từ lớn đến nhỏ, chỉ khi hai nút đáp xuống còn khác nhau. Chúng dừng ngay dưới LCA, và LCA là cha của chúng: O(log n) mỗi truy vấn.',
    'Chu trình Euler biến bài LCA thành bài giá trị nhỏ nhất trên đoạn: giữa lần thăm đầu tiên của u và của v, nút nông nhất chính là LCA. Dùng sparse table (bảng thưa) thì dựng mất O(n log n) và mỗi truy vấn O(1).',
    'Chọn mẫu “Đường thẳng 16 nút” và hỏi P với A: d = 15 = 8 + 4 + 2 + 1, nên u đến A sau 4 bước nhảy, trong khi đi bộ phải mất 15 bước.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Dựng bảng nhảy',
      'O(n log n)',
      'log n hàng, mỗi hàng n ô, mỗi ô đọc hai lần ở hàng phía trên.',
    ],
    [
      'Một truy vấn LCA',
      'O(log n)',
      'Nhiều nhất log n bước nhảy để cân độ sâu, rồi log n lần kiểm tra theo cặp.',
    ],
    [
      'LCA theo cách thô (đi theo cha)',
      'O(độ sâu)',
      'Mỗi tầng một bước: n − 1 bước trên cây có dạng đường thẳng.',
    ],
    [
      'Chu trình Euler + sparse table',
      'Dựng O(n log n), truy vấn O(1)',
      'Chu trình dài 2n − 1 mục; giá trị nhỏ nhất trên đoạn lấy từ hai khối chồng lên nhau.',
    ],
    ['Bộ nhớ', 'O(n log n)', 'Cho bảng nhảy; bản thân chu trình Euler chỉ O(n).'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Chọn mẫu Cây gia phả. Trước truy vấn đầu tiên, bảng nhảy điền bao nhiêu ô?',
      answer: 56,
      unit: 'ô',
      hints: ['Bảng có mỗi cột một nút và mỗi hàng một luỹ thừa của 2.', '14 nút × 4 hàng.'],
      solution: 'Cây gia phả có 14 nút và bảng có 4 hàng (1, 2, 4, 8 tầng), nên có 14 × 4 = 56 ô.',
    },
    {
      type: 'choice',
      prompt: 'Trong Cây gia phả, lca(N, I) là nút nào?',
      options: ['A', 'B', 'D', 'E'],
      answer: 1,
      hints: [
        'Các tổ tiên của N là L, H, D, B, A. Các tổ tiên của I là E, B, A.',
        'Tìm nút sâu nhất có mặt trong cả hai danh sách.',
      ],
      solution:
        'N leo 2 tầng đến H (độ sâu 3, bằng I). Khi đó up[0] cho D và E, hai nút khác nhau, nên cả hai nhảy đến D và E; cha của chúng là B, chính là LCA.',
    },
    {
      type: 'number',
      prompt: 'Trên Đường thẳng 16 nút, truy vấn lca(P, A). Khi cân độ sâu, u nhảy bao nhiêu lần?',
      answer: 4,
      unit: 'lần',
      hints: ['P ở độ sâu 15 còn A ở độ sâu 0, nên d = 15.', 'Viết 15 dưới dạng nhị phân.'],
      solution:
        'd = 15 = 1111 trong hệ nhị phân = 8 + 4 + 2 + 1, nên u nhảy bốn lần và đáp xuống A.',
    },
    {
      type: 'text',
      prompt: 'Điền vào quy tắc dựng hàng k của bảng: up[k][v] = …',
      accept: ['up[k-1][up[k-1][v]]', 'up[k−1][up[k−1][v]]'],
      hints: [
        'Một bước nhảy 2ᵏ là hai bước nhảy 2ᵏ⁻¹.',
        'Nhảy 2ᵏ⁻¹ tầng từ v, rồi nhảy 2ᵏ⁻¹ tầng nữa từ chỗ đó.',
      ],
      solution:
        'up[k][v] = up[k−1][up[k−1][v]]: trước hết nhảy 2ᵏ⁻¹ tầng từ v, rồi nhảy thêm 2ᵏ⁻¹ tầng từ chỗ vừa đáp xuống.',
    },
  ],
  nextTeaser:
    'Nhảy nhị phân trả lời câu hỏi về tổ tiên; muốn tính tổng trên cả một đường đi thì bài sau, Phân rã nặng nhẹ, cắt cây thành các chuỗi để dùng segment tree (cây phân đoạn).',
};
