/** @typedef {import('$lib/algo-engine/min-cost-flow.js').HungarianFrame} HungarianFrame */

/** Name of row i (a worker). @param {number} i */
const rowName = (i) => String.fromCharCode(65 + i);
/** Name of column j (a job). @param {number} j */
const colName = (j) => String(j + 1);
/** A number with a true minus sign. @param {number} x */
const show = (x) => String(x).replace('-', '−');

/** @param {string[]} list */
const join = (list) =>
  list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} và ${list.at(-1)}`;

/** @param {number} n @returns {number} */
const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

export const vi = {
  slug: 'min-cost-flow',
  topic: 'flows',
  level: 'Nâng cao',
  title: 'Luồng chi phí nhỏ nhất và bài toán phân công',
  intro:
    'Khi mỗi cạnh còn có thêm chi phí cho mỗi đơn vị luồng, câu hỏi trở thành: làm sao gửi đủ một lượng luồng cho trước với chi phí thấp nhất? Bài toán phân công là trường hợp kinh điển: n người, n việc, mỗi cặp người – việc có một chi phí, và mỗi người phải nhận một việc khác nhau. Thuật toán Hungary giải nó trong O(n³) bằng cách thêm từng người một theo một đường tăng luồng (augmenting path) rẻ nhất, được dẫn đường bởi các thế năng trên hàng và cột.',
  summary:
    'Xem thuật toán Hungary điều chỉnh thế năng của hàng và cột cho đến khi một tập các ô có chi phí rút gọn bằng 0 cho ra phép phân công rẻ nhất.',
  instruction:
    'Chạy từng bước và theo dõi các chi phí rút gọn: mỗi lượt quét tìm độ dư (slack) nhỏ nhất δ, các thế năng u và v dịch đi δ, và một số 0 mới xuất hiện. Các ô có dấu sao là phép phân công. Sửa chi phí ở dưới bảng, hoặc chọn “Bẫy tham lam” để thấy vì sao lấy ô rẻ nhất trước lại thất bại.',
  rowName,
  colName,
  show,
  presetLabel: 'Chi phí',
  presets: {
    jobs: 'Người và việc',
    trap: 'Bẫy tham lam',
    five: 'Năm nhân năm',
  },
  sizeLabel: 'Kích thước n',
  resetCosts: 'Đặt lại chi phí',
  tableTitle: 'Chi phí rút gọn r(i, j) = c(i, j) − u[i] − v[j], kèm các thế năng',
  tableAria:
    'Bảng chi phí rút gọn: mỗi hàng là một người, mỗi cột là một việc, tiếp theo là các thế năng u (cột cuối) và v (hàng v), cùng độ dư của mỗi cột ngoài cây.',
  potentialU: 'u',
  potentialV: 'v',
  slackRow: 'độ dư',
  /** @param {string} row @param {string} col @param {string} value @param {string} state */
  cellLabel: (row, col, value, state) =>
    [`${row}, ${col}: ${value}`, state].filter(Boolean).join(', '),
  /** @param {number} j */
  colHead: (j) => `việc ${colName(j)}`,
  /** @param {number} i */
  rowHead: (i) => `người ${rowName(i)}`,
  costsTitle: 'Chi phí c(i, j)',
  /** @param {string} row @param {string} col */
  costAria: (row, col) => `Chi phí khi người ${row} làm việc ${col}`,
  /** @param {number} max */
  badCost: (max) => `Chi phí phải là số nguyên từ 0 đến ${max}. Chi phí cũ được giữ lại.`,
  states: {
    assigned: 'đã phân công',
    flipped: 'vừa được lật vào phép phân công',
    read: 'được đọc ở lượt quét này',
    picked: 'độ dư nhỏ nhất',
    tree: 'thuộc cây',
    shifted: 'thế năng vừa dịch',
  },
  legend: {
    assigned: 'Cặp đã phân công',
    flipped: 'Vừa lật',
    read: 'Được lượt quét đọc',
    picked: 'Độ dư nhỏ nhất δ',
    tree: 'Hàng hoặc cột thuộc cây',
    shifted: 'Thế năng vừa dịch',
  },
  stats: {
    cost: 'Chi phí các cặp',
    bound: 'Σ u + Σ v',
    rows: 'Số hàng đã phân công',
    reads: 'Số lần đọc chi phí rút gọn',
  },
  /**
   * @param {HungarianFrame} f
   */
  describe(f) {
    const n = f.u.length;
    const rows = f.treeRows.map(rowName);
    const cols = f.treeCols.map(colName);
    const j = colName(f.pick);
    switch (f.kind) {
      case 'start':
        return 'Mọi thế năng bắt đầu bằng 0, nên mỗi chi phí rút gọn bằng đúng chi phí của nó. Các hàng lần lượt được thêm vào, mỗi hàng được xếp theo một đường tăng luồng rẻ nhất.';
      case 'row':
        return `Thêm người ${rowName(f.root)}. Cây xen kẽ của người này lúc đầu chỉ có hàng ${rowName(f.root)}.`;
      case 'scan':
        return `Đọc chi phí rút gọn của hàng ${rowName(f.from)} vào độ dư của mỗi cột ngoài cây. Độ dư nhỏ nhất là δ = ${show(f.delta)}, ở cột ${j} (từ hàng ${rowName(f.via[f.pick])})${
          f.delta === 0 ? ': cạnh đó đã chặt, nên các thế năng giữ nguyên.' : '.'
        }`;
      case 'adjust':
        return `Cộng δ = ${show(f.delta)} vào u của hàng ${join(rows)}${
          cols.length ? ` và trừ nó khỏi v của cột ${join(cols)}` : ''
        }. Các cạnh của cây vẫn bằng 0, không chi phí rút gọn nào xuống dưới 0, và r(${rowName(f.via[f.pick])}, ${j}) thành 0.`;
      case 'tight': {
        const r = rowName(/** @type {number} */ (f.treeRows.at(-1)));
        return `Cột ${colName(/** @type {number} */ (f.treeCols.at(-1)))} vào cây. Cột này đã giao cho hàng ${r}, nên hàng ${r} cũng vào cây, và các cạnh của nó được đọc tiếp theo.`;
      }
      case 'free':
        return `Cột ${colName(/** @type {number} */ (f.treeCols.at(-1)))} vào cây và còn trống: có một đường gồm các chi phí rút gọn bằng 0 dẫn từ hàng ${rowName(f.root)} đến nó.`;
      case 'augment':
        return `Lật đường đi: ${join(f.path.map(([r, c]) => `${rowName(r)} → ${colName(c)}`))}. Đã phân công ${f.colOf.filter((x) => x >= 0).length}/${n} hàng, chi phí ${f.cost}; Σ u + Σ v = ${show(f.bound)}.`;
      case 'done':
        return n
          ? `Xong: ${join(f.colOf.map((c, r) => `${rowName(r)} → ${colName(c)}`))} có chi phí ${f.cost}, và Σ u + Σ v cũng bằng ${show(f.bound)}, điều này chứng tỏ không phép phân công nào rẻ hơn. Vét cạn sẽ phải so sánh ${factorial(n)} phép phân công.`
          : 'Không có gì để phân công.';
    }
  },
  takeaways: [
    'Luồng chi phí nhỏ nhất gắn một chi phí lên mỗi cạnh và tìm một luồng có giá trị cho trước với tổng chi phí thấp nhất. Phương pháp lần lượt các đường đi ngắn nhất làm điều đó bằng cách luôn tăng luồng theo một đường s → t rẻ nhất trong đồ thị thặng dư (residual graph), nơi cung ngược hoàn lại chi phí (−chi phí).',
    'Bài toán phân công là luồng chi phí nhỏ nhất trên s → người → việc → t với sức chứa 1: một cách ghép cặp đầy đủ có tổng chi phí nhỏ nhất.',
    'Các thế năng u và v làm mọi chi phí rút gọn r(i, j) = c(i, j) − u[i] − v[j] không âm, nên đường tăng luồng rẻ nhất tìm được theo kiểu Dijkstra; mỗi hàng thêm vào là một đường đi ngắn nhất, nên n hàng, mỗi hàng tốn O(n²), tổng cộng O(n³).',
    'Mọi phép phân công đều có chi phí bằng Σ u + Σ v cộng với các chi phí rút gọn của nó, mà chúng đều ≥ 0. Khi phép phân công chỉ dùng các ô bằng 0, chi phí của nó bằng Σ u + Σ v, mức thấp nhất có thể: đó chính là chứng minh tối ưu.',
    'Thử xem: trên “Bẫy tham lam”, tự cộng tay phép phân công lấy ô rẻ nhất trước, rồi chạy đến cuối và so sánh với kết quả của thuật toán Hungary.',
  ],
  complexityHead: ['Phương pháp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thuật toán Hungary',
      'O(n³)',
      'n hàng; mỗi hàng phát triển cây trong tối đa n bước, và mỗi bước cập nhật n độ dư.',
    ],
    ['Vét cạn', 'O(n · n!)', 'Xét cả n! phép phân công, mỗi phép cộng trong O(n).'],
    [
      'Lần lượt các đường đi ngắn nhất',
      'O(F · E log V)',
      'F lần tăng luồng cho luồng có giá trị F, mỗi lần chạy Dijkstra trên chi phí rút gọn.',
    ],
    ['Bộ nhớ', 'O(n²)', 'Ma trận chi phí, cộng thêm O(n) cho thế năng, độ dư và liên kết.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trên “Người và việc”, phép phân công rẻ nhất có chi phí bao nhiêu?',
      answer: 13,
      tolerance: 0,
      hints: ['Chạy đến cuối và đọc chi phí, hoặc xem Σ u + Σ v.'],
      solution:
        'A → 2, B → 1, C → 3, D → 4 có chi phí 2 + 6 + 1 + 4 = 13, và Σ u + Σ v = 18 − 5 = 13.',
    },
    {
      type: 'number',
      prompt:
        'Trên “Bẫy tham lam”, mỗi lần lấy ô rẻ nhất còn lại (gạch bỏ hàng và cột của ô đó). Phép phân công đó có chi phí bao nhiêu?',
      answer: 13,
      tolerance: 0,
      hints: [
        'Ô rẻ nhất là A – 1 (chi phí 1). Những ô nào còn lại?',
        'Tiếp theo là C – 2 (chi phí 3), và B buộc phải nhận việc 3.',
      ],
      solution:
        'A → 1 (1), C → 2 (3), B → 3 (9): 13. Thuật toán Hungary tìm ra A → 2, B → 1, C → 3 với 2 + 2 + 4 = 8.',
    },
    {
      type: 'number',
      prompt:
        'Trên “Người và việc”, khi hàng C được thêm vào, δ ở lượt quét đầu tiên từ hàng C bằng bao nhiêu?',
      answer: 1,
      tolerance: 0,
      hints: ['Lúc đó, chi phí rút gọn của hàng C là 5, 8, 1, 8.'],
      solution:
        'u và v vẫn bằng 0 với hàng C và mọi cột, nên độ dư của nó chính là chi phí 5, 8, 1, 8, và nhỏ nhất là 1 ở cột 3, cột đang giao cho B.',
    },
    {
      type: 'number',
      prompt:
        'Lần lượt các đường đi ngắn nhất: cạnh u → v có chi phí 5 cho mỗi đơn vị và đang mang 2 đơn vị. Trong đồ thị thặng dư, cung ngược v → u có chi phí mỗi đơn vị là bao nhiêu?',
      answer: -5,
      tolerance: 0,
      hints: [
        'Gửi một đơn vị ngược theo v → u là huỷ một đơn vị trên u → v. Hoá đơn thay đổi thế nào?',
      ],
      solution:
        'Huỷ một đơn vị luồng trên u → v thì được hoàn lại chi phí của nó, nên cung ngược có chi phí −5. Vì thế đồ thị thặng dư có thể có cung âm, và cần thế năng trước khi Dijkstra tìm kiếm được trên nó.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao Σ u + Σ v không bao giờ lớn hơn chi phí của bất kì phép phân công nào?',
      options: [
        'Vì các thế năng chỉ giảm dần.',
        'Vì mỗi phép phân công có chi phí bằng Σ u + Σ v cộng các chi phí rút gọn của nó, và chi phí rút gọn không bao giờ âm.',
        'Vì thuật toán dừng ngay khi Σ u + Σ v bằng chi phí.',
        'Vì u và v là giá trị nhỏ nhất của hàng và cột.',
      ],
      answer: 1,
      hints: ['Viết c(i, j) = u[i] + v[j] + r(i, j) rồi cộng lại trên cả một phép phân công.'],
      solution:
        'Một phép phân công dùng mỗi hàng và mỗi cột đúng một lần, nên chi phí của nó là Σ u + Σ v + Σ r trên các ô của nó, và mọi r ≥ 0. Dấu bằng xảy ra khi mọi ô của nó đều bằng 0.',
    },
    {
      type: 'text',
      prompt: 'Thuật toán Hungary này chạy trong thời gian bao nhiêu trên ma trận n × n?',
      accept: ['O(n^3)', 'O(n³)', 'n^3', 'n³', 'O(n*n*n)'],
      hints: ['n hàng, mỗi hàng phát triển trong tối đa n bước, mỗi bước tốn O(n).'],
      solution:
        'Mỗi hàng trong n hàng thêm tối đa n cột vào cây của nó, và mỗi lần thêm cập nhật n độ dư: O(n³).',
    },
  ],
  nextTeaser:
    'Bài sau, luyện tập: mô hình hoá bằng luồng, em tự dựng mạng luồng cho những bài toán có lời văn.',
};
