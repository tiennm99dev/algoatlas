/** @typedef {import('$lib/algo-engine/prim.js').PrimFrame} PrimFrame */
/** @typedef {import('$lib/algo-engine/prim.js').PrimEntry} PrimEntry */
/** @typedef {{u: number, v: number, w: number}} EdgeInfo */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d));

export const vi = {
  slug: 'prim',
  topic: 'mst',
  level: 'Trung bình',
  title: 'Thuật toán Prim',
  intro:
    'Thuật toán Prim nuôi một cây duy nhất từ một đỉnh xuất phát. Ở mỗi bước, ta thêm cạnh rẻ nhất có một đầu trong cây và đầu kia ở ngoài; theo tính chất lát cắt (cut property), cạnh đó luôn an toàn. Dùng một heap chứa các cạnh đi qua lát cắt thì chi phí là O(E log V), hợp với đồ thị thưa; dùng một mảng khoá thì chi phí là O(V²), hợp với đồ thị dày.',
  summary:
    'Nuôi cây khung nhỏ nhất (MST) từ một đỉnh xuất phát, bằng heap các cạnh đi qua lát cắt hoặc bằng mảng khoá, rồi so chi phí hai cách trên đồ thị thưa và đồ thị dày.',
  instruction:
    'Chọn một đỉnh xuất phát rồi đi từng bước: mỗi bước, cây (màu xanh lá) nhận thêm cạnh rẻ nhất ở biên. Chuyển qua lại giữa bản dùng heap và bản dùng mảng, rồi nạp đồ thị đầy đủ để xem bản nào làm ít việc hơn khi gần như mọi cặp đỉnh đều được nối.',
  variantLabel: 'Tìm cạnh rẻ nhất bằng',
  variants: { heap: 'Heap các cạnh', array: 'Mảng khoá' },
  startLabel: 'Xuất phát',
  presetLabel: 'Đồ thị',
  presets: { sparse: 'Đồ thị ban đầu (9 cạnh)', dense: 'Đồ thị đầy đủ (15 cạnh)' },
  resetGraph: 'Khôi phục đồ thị',
  graphAria:
    'Đồ thị vô hướng có trọng số. Các đỉnh trong cây, các đỉnh ở biên và thứ tự các đỉnh vào cây đều được đánh dấu.',
  edgesTitle: 'Trọng số các cạnh',
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
  /** @param {number} max */
  badWeight: (max) => `Trọng số phải là số nguyên từ 1 đến ${max}. Trọng số cũ được giữ nguyên.`,
  heapTitle: 'Heap các cạnh đi qua lát cắt (nhỏ nhất trước)',
  keysTitle: 'Khoá của các đỉnh ngoài cây',
  addedTitle: 'Các đỉnh đã vào cây, theo thứ tự',
  emptyText: 'rỗng',
  hotLabel: 'vừa đổi',
  staleTag: 'cũ',
  /** @param {PrimEntry} e @param {string[]} names @param {boolean} stale */
  heapChip: (e, names, stale) => `${names[e.from]} — ${names[e.to]} ${e.w}${stale ? ' cũ' : ''}`,
  /** @param {string} name @param {number} key @param {string} via */
  keyChip: (name, key, via) => `${name} ${show(key)}${via ? ` qua ${via}` : ''}`,
  /** @param {number} key */
  keyNote: (key) => `khoá ${show(key)}`,
  stats: {
    comparisons: 'Số phép so sánh để tìm cạnh rẻ nhất',
    examined: 'Số cạnh đã xét',
    pushes: 'Số lần đẩy vào heap',
    pops: 'Số lần lấy ra khỏi heap',
    stale: 'Số cạnh cũ đã bỏ qua',
    weight: 'Trọng số cây',
  },
  legend: {
    current: 'Đỉnh vừa thêm hoặc đang mở rộng',
    neighbor: 'Đầu kia của cạnh đang xét',
    frontier: 'Biên: tới được bằng một cạnh',
    tree: 'Trong cây',
    order: 'Thứ tự vào cây',
    edgeNow: 'Cạnh đang xét',
    edgeStale: 'Cạnh cũ vừa lấy ra',
    treeEdge: 'Cạnh của cây',
    candidate: 'Cạnh đi qua lát cắt đang chờ',
  },
  states: {
    start: 'xuất phát',
    current: 'vừa thêm hoặc đang mở rộng',
    neighbor: 'đầu kia của cạnh',
    frontier: 'ở biên',
    tree: 'trong cây',
  },
  /** @param {string} name @param {string} state @param {number} joined */
  vertexLabel: (name, state, joined) =>
    [`Đỉnh ${name}`, state, joined > 0 ? `vào cây thứ ${joined}` : ''].filter(Boolean).join(', '),
  /**
   * @param {PrimFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  describe(f, names, info) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const w = info[f.edge]?.w ?? 0;
    const n = f.inTree.length;
    const missed = n - f.added.length;
    switch (f.kind) {
      case 'start':
        if (!n) return 'Đồ thị không có đỉnh nào.';
        if (f.current < 0) return 'Hãy chọn một đỉnh xuất phát.';
        if (f.variant === 'array')
          return `Đặt key[${u}] = 0 và mọi khoá khác bằng ∞. Khoá của một đỉnh là trọng số của cạnh nhẹ nhất đã biết nối cây với đỉnh đó.`;
        return f.heap.length
          ? `Bắt đầu cây ở ${u} và đẩy ${f.heap.length} cạnh của nó vào heap: ${f.heap.map((e) => `${names[e.from]} — ${names[e.to]} ${e.w}`).join(', ')}.`
          : `Bắt đầu cây ở ${u}. Đỉnh này không có cạnh nào, nên heap vẫn rỗng.`;
      case 'add':
        if (f.variant === 'array')
          return f.edge < 0
            ? `Duyệt các khoá ngoài cây: ${u} có khoá nhỏ nhất, 0. Nó vào cây làm gốc.`
            : `Duyệt các khoá ngoài cây: ${u} có khoá nhỏ nhất, ${w} qua ${v}. Thêm ${u} và cạnh ${v} — ${u}. Trọng số cây giờ là ${f.weight}.`;
        return `Lấy ra ${v} — ${u} (trọng số ${w}), cạnh nhẹ nhất trong heap. ${u} ở ngoài cây, nên cạnh đi qua lát cắt: thêm ${u} và cạnh đó. Trọng số cây giờ là ${f.weight}.`;
      case 'push':
        return `${v} ở ngoài cây: đẩy ${u} — ${v} (trọng số ${w}) vào heap.`;
      case 'stale':
        return `Lấy ra ${u} — ${v} (trọng số ${w}), nhưng ${v} đã ở trong cây. Cả hai đầu đều ở trong, nên cạnh không còn đi qua lát cắt: đó là cạnh cũ. Bỏ qua.`;
      case 'improve':
        return `Cạnh ${u} — ${v} (trọng số ${w}) nhẹ hơn key[${v}] = ${show(f.before)}. Đặt key[${v}] = ${w} và parent[${v}] = ${u}.`;
      case 'keep':
        return `Cạnh ${u} — ${v} (trọng số ${w}) không nhẹ hơn key[${v}] = ${show(f.before)}. Giữ nguyên khoá.`;
      case 'unreachable':
        return `Khoá nhỏ nhất ngoài cây là ∞: không cạnh nào tới được ${missed} đỉnh còn lại. Dừng.`;
      case 'done':
        if (!f.added.length) return 'Không có gì để làm.';
        if (missed)
          return `Xong. ${missed} đỉnh không tới được từ ${names[f.added[0]]}: thuật toán Prim chỉ phủ thành phần liên thông chứa đỉnh xuất phát, ở đây với trọng số ${f.weight}.`;
        return f.variant === 'heap'
          ? `Cả ${n} đỉnh đều đã ở trong cây, trọng số ${f.weight}. ${f.heap.length ? `${f.heap.length} mục còn lại trong heap không bao giờ được lấy ra.` : 'Heap đã rỗng.'}`
          : `Cả ${n} đỉnh đều đã ở trong cây, trọng số ${f.weight}, sau ${f.comparisons} phép so sánh khoá.`;
    }
  },
  takeaways: [
    'Thuật toán Prim nuôi một cây duy nhất. Mỗi bước thêm cạnh rẻ nhất có một đầu trong cây, một đầu ngoài cây: đó là cạnh nhẹ nhất đi qua lát cắt (cây, phần còn lại), nên theo tính chất lát cắt, nó thuộc một cây khung nhỏ nhất.',
    'Bản dùng heap: khi một đỉnh vào cây, đẩy các cạnh của nó tới những đỉnh ngoài cây. Cạnh lấy ra mà đầu xa đã vào cây là cạnh cũ và bị bỏ qua. Có nhiều nhất E lần đẩy và E lần lấy ra: O(E log E) = O(E log V).',
    'Bản dùng mảng: key[v] là cạnh nhẹ nhất nối cây với v. Mỗi vòng trong V vòng duyệt mọi khoá, nên chi phí là O(V²) bất kể E bằng bao nhiêu.',
    'Đồ thị thưa (E gần V) hợp với heap; đồ thị dày (E gần V²) hợp với mảng, vì V² nhỏ hơn V² log V. Trên đồ thị không liên thông, thuật toán Prim chỉ phủ thành phần liên thông chứa đỉnh xuất phát.',
    'Thử xem: nạp đồ thị đầy đủ và so “Số phép so sánh để tìm cạnh rẻ nhất” của hai bản, rồi bắt đầu ở một đỉnh khác: trọng số cây vẫn như cũ.',
  ],
  complexityHead: ['Phiên bản', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Heap các cạnh đi qua lát cắt (bản lười)',
      'O(E log V)',
      'Mỗi cạnh được đẩy vào và lấy ra nhiều nhất một lần, mỗi lần tốn O(log E) = O(log V).',
    ],
    [
      'Mảng khoá',
      'O(V²)',
      'V vòng, mỗi vòng duyệt tới V khoá để tìm khoá nhỏ nhất; mỗi cạnh được xét một lần từ mỗi đầu.',
    ],
    [
      'Heap Fibonacci',
      'O(E + V log V)',
      'Giảm khoá tốn O(1) theo phân tích khấu hao; đây là cận tốt nhất trên lí thuyết, nhưng hiếm khi nhanh hơn trên thực tế.',
    ],
    ['Bộ nhớ', 'O(V + E)', 'Cờ “trong cây” và khoá cho mỗi đỉnh, cùng tối đa E mục trong heap.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt: 'Trên đồ thị ban đầu, xuất phát từ A, các đỉnh vào cây theo thứ tự nào?',
      accept: ['A, B, C, D, E, F', 'ABCDEF', 'A B C D E F'],
      hints: ['Sau A, cạnh rẻ nhất đi qua lát cắt là A — B (3). Sau đó hãy xét cả các cạnh của B.'],
      solution:
        'A, rồi B qua A — B 3, C qua B — C 2, D qua B — D 5, E qua D — E 7, F qua E — F 1. Thuật toán Prim thêm cạnh rẻ nhất đi qua lát cắt chứ không xét tên đỉnh, nên F vào cây cuối cùng dù E — F chỉ nặng 1.',
    },
    {
      type: 'number',
      prompt:
        'Với bản dùng heap trên đồ thị ban đầu, xuất phát từ A, có bao nhiêu cạnh cũ bị lấy ra rồi bỏ qua?',
      answer: 2,
      unit: 'cạnh',
      tolerance: 0,
      hints: ['Một cạnh là cạnh cũ khi lúc nó được lấy ra, cả hai đầu đều đã ở trong cây.'],
      solution:
        'A — C (4) được lấy ra sau khi C đã vào cây qua B — C, và C — D (6) sau khi D đã vào cây qua B — D. Cả hai bị bỏ qua: 2 cạnh cũ. C — E và D — F vẫn còn trong heap khi cây đã đủ.',
    },
    {
      type: 'text',
      prompt: 'Giờ hãy xuất phát từ F. Các đỉnh vào cây theo thứ tự nào?',
      accept: ['F, E, D, B, C, A', 'FEDBCA', 'F E D B C A'],
      hints: ['Từ F, các cạnh đi qua lát cắt là E — F 1 và D — F 9.'],
      solution:
        'F, rồi E (E — F 1), D (D — E 7, nhẹ hơn C — E 8 và D — F 9), B (B — D 5), C (B — C 2), A (A — B 3). Trọng số vẫn là 1 + 7 + 5 + 2 + 3 = 18.',
    },
    {
      type: 'number',
      prompt:
        'Với bản dùng mảng, thuật toán Prim thực hiện bao nhiêu phép so sánh khoá trên một đồ thị liên thông bất kì có 6 đỉnh?',
      answer: 15,
      unit: 'phép so sánh',
      tolerance: 0,
      hints: ['Vòng thứ k duyệt các đỉnh còn ở ngoài cây: lần lượt 6, 5, 4, … đỉnh.'],
      solution:
        'Tìm khoá nhỏ nhất trong m khoá cần m − 1 phép so sánh, nên các vòng tốn 5 + 4 + 3 + 2 + 1 + 0 = 15 = V(V − 1)/2, bất kể các cạnh ra sao.',
    },
    {
      type: 'choice',
      prompt:
        'Một đồ thị có 1000 đỉnh và gần như mọi cặp đỉnh đều có cạnh nối. Bạn nên dùng bản nào của thuật toán Prim?',
      options: [
        'Bản dùng heap: O(E log V) luôn tốt hơn.',
        'Bản dùng mảng: O(V²) = 10⁶ bước, ít hơn E log V ≈ 5 × 10⁵ × 10.',
        'Bản nào cũng được, chi phí như nhau.',
        'Không bản nào: thuật toán Prim không xử lí được đồ thị dày.',
      ],
      answer: 1,
      hints: ['Với E ≈ V²/2, hãy so V² với E log V.'],
      solution:
        'E khoảng 500 000, nên bản dùng heap làm khoảng 500 000 × log₂ 1000 ≈ 5 triệu bước trên heap, còn bản dùng mảng làm khoảng V² = 1 triệu bước. Trên đồ thị dày, bản dùng mảng thắng.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo là Luyện tập: bài toán cây khung nhỏ nhất, nơi bạn tự đoán cây, tìm cạnh nút cổ chai và cây khung tốt nhì.',
};
