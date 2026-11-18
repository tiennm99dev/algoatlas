/** @typedef {import('$lib/algo-engine/graph-representations.js').RepFrame} RepFrame */

/** Vertex name from its row in the matrix. @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);

export const vi = {
  slug: 'graph-representations',
  topic: 'graphs',
  level: 'Cơ bản',
  title: 'Biểu diễn đồ thị',
  intro:
    'Đồ thị là một tập đỉnh nối với nhau bằng các cạnh: thành phố và đường đi, người và tình bạn bè, công việc và thứ tự phụ thuộc. Trước khi một thuật toán đi trên đồ thị, chương trình phải lưu nó lại, và hai cách kinh điển là ma trận kề và danh sách kề. Hai cách giữ cùng những cạnh ấy nhưng trả lời câu hỏi với chi phí rất khác nhau.',
  summary:
    'Vẽ một đồ thị và xem từng cạnh được ghi vào ma trận kề và danh sách kề, với đồ thị có hướng, vô hướng và có trọng số.',
  instruction:
    'Sửa đồ thị: kéo các đỉnh, dùng Nối để thêm hoặc bỏ một cạnh, Xoá để bỏ một đỉnh hay một cạnh, và Thêm đỉnh để có đỉnh mới. Chuyển giữa vô hướng và có hướng, giữa không trọng số và có trọng số. Chạy từng bước để thấy mỗi cạnh được ghi vào cả hai bảng, rồi bấm vào một đỉnh hoặc một ô của ma trận để so sánh mỗi cách biểu diễn phải đọc những gì.',
  directionLabel: 'Cạnh',
  directions: { undirected: 'Vô hướng', directed: 'Có hướng' },
  weightLabel: 'Trọng số',
  weights: { unweighted: 'Không trọng số', weighted: 'Có trọng số' },
  resetGraph: 'Đặt lại đồ thị',
  graphTitle: 'Đồ thị',
  graphAria: 'Đồ thị đầu vào.',
  matrixTitle: 'Ma trận kề',
  matrixHint: 'Hàng = đỉnh đi, cột = đỉnh đến. 0 nghĩa là không có cạnh.',
  /** @param {string[]} names */
  matrixAria: (names) =>
    `Ma trận kề ${names.length} × ${names.length}, hàng và cột lần lượt là ${names.join(', ')}.`,
  /** @param {string} from @param {string} to @param {number} value @param {string} state */
  matrixCell: (from, to, value, state) =>
    `Hàng ${from}, cột ${to}: ${value}${state ? `, ${state}` : ''}`,
  listsTitle: 'Danh sách kề',
  listsEmpty: 'không có đỉnh kề',
  justAdded: 'vừa thêm',
  selectedRow: 'đang chọn',
  stats: {
    vertices: 'Số đỉnh (n)',
    edges: 'Số cạnh (E)',
    matrixCells: 'Số ô ma trận (n²)',
    listEntries: 'Số mục đã ghi vào danh sách',
  },
  legend: {
    writing: 'Vừa ghi',
    stored: 'Cạnh đã lưu',
    selected: 'Hàng của đỉnh đang chọn',
  },
  states: { writing: 'vừa ghi', selected: 'hàng đang chọn' },
  /** @param {RepFrame} f @param {string[]} names @param {boolean} directed */
  describe(f, names, directed) {
    const a = nm(names, f.from);
    const b = nm(names, f.to);
    switch (f.kind) {
      case 'start':
        return `Bắt đầu với một ma trận ${names.length} × ${names.length} toàn số 0 và ${names.length} danh sách rỗng.`;
      case 'edge':
        return `Cạnh ${a} ${directed ? '→' : '–'} ${b}: ghi matrix[${a}][${b}] = ${f.weight} và thêm ${b} vào danh sách của ${a}.`;
      case 'mirror':
        return `Đồ thị vô hướng nên ta lưu cả chiều ngược lại: matrix[${a}][${b}] = ${f.weight} và thêm ${b} vào danh sách của ${a}.`;
      case 'done':
        return directed
          ? `Xong: ${f.listEntries} mục trong danh sách cho ${f.listEntries} cạnh có hướng, trong một ma trận ${names.length * names.length} ô.`
          : `Xong: mỗi cạnh trong ${f.listEntries / 2} cạnh xuất hiện hai lần, nên danh sách giữ ${f.listEntries} mục và ma trận đối xứng.`;
    }
  },
  /**
   * What each representation reads to list a vertex's neighbours.
   * @param {string} v @param {number} n @param {string[]} neighbours
   */
  neighboursQuery: (v, n, neighbours) =>
    `Các đỉnh kề ${v}: ${neighbours.length ? neighbours.join(', ') : 'không có'}. Ma trận phải quét cả ${n} ô của hàng ${v}; danh sách chỉ đọc ${neighbours.length} mục của nó.`,
  /**
   * What each representation reads to test one edge.
   * @param {string} a @param {string} b @param {number} value @param {number} scanned
   */
  edgeQuery: (a, b, value, scanned) =>
    `Có cạnh ${a} → ${b} không? Ma trận trả lời sau một lần đọc: ${value === 0 ? '0, không có' : `${value}, có`}. Danh sách phải quét ${scanned} mục của ${a} mới chắc chắn.`,
  takeaways: [
    'Đồ thị G = (V, E) gồm tập đỉnh V và tập cạnh E. Trong đồ thị có hướng mỗi cạnh có chiều u → v; trong đồ thị vô hướng cạnh u – v đi được cả hai chiều; đồ thị có trọng số gắn một con số (chi phí, khoảng cách) lên mỗi cạnh.',
    'Ma trận kề là một bảng n × n: ô [u][v] chứa 1 (hoặc trọng số) khi có cạnh, ngược lại chứa 0. Đồ thị vô hướng cho ma trận đối xứng.',
    'Danh sách kề chỉ giữ, với mỗi đỉnh, các đỉnh kề của nó. Danh sách có E mục với đồ thị có hướng và 2E mục với đồ thị vô hướng, cộng thêm n đầu danh sách.',
    'Chọn theo câu hỏi cần trả lời: ma trận kiểm tra một cạnh trong O(1) nhưng luôn tốn n² bộ nhớ; danh sách tốn O(n + E) bộ nhớ và liệt kê các đỉnh kề của một đỉnh trong O(bậc), hợp với đồ thị thưa và với BFS (duyệt theo chiều rộng), DFS (duyệt theo chiều sâu) ở các bài sau.',
    'Thử xem: chuyển sang Có hướng và xem ma trận mất tính đối xứng, rồi bấm vào một đỉnh có ít cạnh để so sánh ma trận và danh sách mỗi bên phải đọc bao nhiêu.',
  ],
  complexityHead: ['Thao tác', 'Ma trận | Danh sách', 'Vì sao'],
  complexity: [
    [
      'Bộ nhớ',
      'O(n²) | O(n + E)',
      'Ma trận lưu mọi cặp đỉnh; danh sách chỉ lưu những cạnh có thật.',
    ],
    ['Có cạnh u → v không?', 'O(1) | O(deg u)', 'Đọc một ô, so với quét danh sách của u.'],
    ['Liệt kê các đỉnh kề u', 'O(n) | O(deg u)', 'Cả một hàng ma trận, so với đúng các mục của u.'],
    ['Thêm một cạnh', 'O(1) | O(1)', 'Ghi một ô, hoặc thêm một mục (hai mục khi vô hướng).'],
    [
      'Đi qua mọi cạnh (BFS, DFS)',
      'O(n²) | O(n + E)',
      'Mỗi hàng bị quét trọn, so với mỗi danh sách đọc đúng một lần.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Đặt lại đồ thị (vô hướng, 5 đỉnh, 6 cạnh). Ở bước cuối, các danh sách kề giữ tổng cộng bao nhiêu mục?',
      answer: 12,
      unit: 'mục',
      hints: ['Trong đồ thị vô hướng, mỗi cạnh được lưu một lần ở mỗi đầu.'],
      solution: 'Mỗi cạnh trong 6 cạnh có mặt ở hai danh sách, nên danh sách giữ 2 × 6 = 12 mục.',
    },
    {
      type: 'number',
      prompt:
        'Một đồ thị có hướng có 100 đỉnh và 300 cạnh. Có bao nhiêu ô của ma trận chứa 0 (không có cạnh)?',
      answer: 9700,
      unit: 'ô',
      hints: ['Ma trận có n² ô, và mỗi cạnh có hướng lấp đúng một ô.'],
      solution:
        'Ma trận có 100² = 10 000 ô. 300 ô chứa cạnh, nên 10 000 − 300 = 9700 ô bằng 0. Danh sách kề chỉ cần lưu 300 mục.',
    },
    {
      type: 'choice',
      prompt: 'Ma trận kề của mọi đồ thị vô hướng có tính chất nào?',
      options: [
        'Mọi hàng có cùng số chữ số 1.',
        'Nó đối xứng: matrix[u][v] = matrix[v][u].',
        'Đường chéo chính toàn số 1.',
        'Nó có đúng E ô khác 0.',
      ],
      answer: 1,
      hints: ['Chuyển công cụ giữa Có hướng và Vô hướng rồi so sánh hàng B với cột B.'],
      solution:
        'Cạnh vô hướng u – v được ghi cả vào [u][v] lẫn [v][u], nên ma trận bằng ma trận chuyển vị của nó. Ma trận có 2E ô khác 0, và đường chéo bằng 0 khi không có khuyên.',
    },
    {
      type: 'choice',
      prompt:
        'Một mạng xã hội có một triệu người dùng, mỗi người khoảng 200 người bạn. Cách biểu diễn nào phù hợp?',
      options: [
        'Ma trận kề, vì kiểm tra cạnh mất O(1).',
        'Danh sách kề, vì đồ thị thưa.',
        'Cách nào cũng được, bộ nhớ như nhau.',
      ],
      answer: 1,
      hints: ['So sánh n² với n + 2E khi n = 10⁶ và E ≈ 10⁸.'],
      solution:
        'Ma trận cần 10¹² ô. Danh sách cần khoảng n + 2E ≈ 2 × 10⁸ mục, ít hơn hàng nghìn lần, và BFS trên đó tốn O(n + E).',
    },
  ],
  nextTeaser:
    'Bài sau, ta dùng danh sách đỉnh kề để loang từng lớp: BFS trên lưới tìm đường ngắn nhất qua mê cung.',
};
