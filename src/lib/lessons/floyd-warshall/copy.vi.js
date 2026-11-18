/** @typedef {import('$lib/algo-engine/floyd-warshall.js').FloydFrame} FloydFrame */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d).replace('-', '−'));

/** A summand: a negative number goes in brackets, as in 1 + (−2). @param {number} d */
const term = (d) => (d < 0 && d !== -Infinity ? `(${show(d)})` : show(d));

export const vi = {
  slug: 'floyd-warshall',
  topic: 'shortest-paths',
  level: 'Trung bình',
  title: 'Thuật toán Floyd-Warshall',
  intro:
    'Thuật toán Floyd-Warshall tìm đường đi ngắn nhất giữa mọi cặp đỉnh bằng ba vòng lặp lồng nhau trên một ma trận khoảng cách. Giai đoạn k cho phép đỉnh k làm điểm dừng ở giữa đường đi; sau giai đoạn cuối, mọi đỉnh đều được phép và ma trận chứa mọi khoảng cách ngắn nhất. Thuật toán tốn O(V³) thời gian, xử lí được cạnh âm, và để lộ chu trình âm trên đường chéo.',
  summary:
    'Xem ma trận khoảng cách của thuật toán Floyd-Warshall tốt dần lên khi lần lượt cho phép từng đỉnh trung gian k, và đọc ra bất kì đường đi ngắn nhất nào từ nó.',
  instruction:
    'Chạy từng bước, hoặc bấm k tiếp theo để xong một giai đoạn. Ở giai đoạn k, mỗi ô (i, j) so giá trị của nó với đường đi qua k: chỉ các ô ở hàng k và cột k là dữ liệu đầu vào. Chọn một ô để xem đường đi tốt nhất hiện tại của cặp đỉnh đó trên đồ thị.',
  presetLabel: 'Đồ thị',
  presets: { start: 'Có cạnh âm, không có chu trình âm', cycle: 'Chu trình âm' },
  resetGraph: 'Đặt lại đồ thị',
  nextK: 'k tiếp theo',
  graphAria: 'Đồ thị có hướng có trọng số; trọng số có thể âm.',
  matrixTitle: 'Ma trận khoảng cách: hàng = từ, cột = đến',
  matrixAria:
    'Ma trận khoảng cách. Hàng i, cột j chứa khoảng cách ngắn nhất từ i đến j tìm được cho đến lúc này. Chọn một ô để hiện đường đi của nó.',
  /** @param {string} from @param {string} to @param {string} value @param {string} state */
  cellLabel: (from, to, value, state) =>
    [`Từ ${from} đến ${to}: ${value}`, state].filter(Boolean).join(', '),
  edgesTitle: 'Trọng số các cạnh',
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
  /** @param {number} max */
  badWeight: (max) =>
    `Trọng số phải là số nguyên từ −${max} đến ${max}. Trọng số cũ được giữ nguyên.`,
  allowedTitle: 'Các đỉnh trung gian được phép',
  emptyText: 'chưa có: chỉ dùng cạnh trực tiếp',
  pathTitle: 'Cặp đỉnh đã chọn',
  /** @param {string} from @param {string} to @param {string[]} path @param {number} d */
  pathText: (from, to, path, d) =>
    path.length
      ? `${from} → ${to}: ${path.join(' → ')}, trọng số ${show(d)}.`
      : d === Infinity
        ? `${from} → ${to}: chưa tìm thấy đường đi.`
        : `${from} → ${to}: đường đi lọt vào một chu trình âm.`,
  stats: {
    phase: 'Giai đoạn k',
    comparisons: 'Số phép so sánh',
    updates: 'Số ô đã cải thiện',
  },
  legend: {
    k: 'k, đỉnh trung gian mới',
    ends: 'i và j, cặp đang so sánh',
    path: 'Đường đi tốt nhất của cặp đã chọn',
    rowcol: 'Hàng k và cột k',
    inputs: 'dist[i][k] và dist[k][j], đang được đọc',
    write: 'dist[i][j], vừa cải thiện',
    kept: 'dist[i][j], giữ nguyên',
    negative: 'Đường chéo âm: nằm trên chu trình âm',
  },
  states: {
    k: 'đỉnh trung gian k',
    end: 'đang so sánh',
    rowcol: 'hàng hoặc cột k',
    input: 'đang được đọc',
    write: 'vừa cải thiện',
    kept: 'giữ nguyên',
    negative: 'chu trình âm',
    picked: 'đã chọn',
  },
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Đỉnh ${name}`, state].filter(Boolean).join(', '),
  show,
  /**
   * @param {FloydFrame} f
   * @param {string[]} names
   */
  describe(f, names) {
    const k = names[f.k] ?? '';
    const i = names[f.i] ?? '';
    const j = names[f.j] ?? '';
    const ik = f.k >= 0 && f.i >= 0 ? show(f.dist[f.i][f.k]) : '';
    const kj = f.k >= 0 && f.j >= 0 ? term(f.dist[f.k][f.j]) : '';
    switch (f.kind) {
      case 'start':
        return 'Bắt đầu chỉ với các cạnh trực tiếp: dist[i][j] là trọng số cạnh, 0 trên đường chéo, ∞ ở chỗ không có cạnh.';
      case 'phase':
        return f.k === 0
          ? `Giai đoạn k = ${k}: giờ đường đi được phép đi qua ${k}.`
          : `Giai đoạn k = ${k}: giờ đường đi được phép đi qua ${names.slice(0, f.k + 1).join(', ')}. Mỗi ô đã chứa đường đi tốt nhất qua ${names.slice(0, f.k).join(', ')}.`;
      case 'improve':
        return `${i} → ${k} → ${j}: ${ik} + ${kj} = ${show(f.via)} < ${show(f.before)}. Đi qua ${k} ngắn hơn, nên dist[${i}][${j}] = ${show(f.via)}.`;
      case 'keep':
        return f.via === Infinity
          ? `${i} → ${k} → ${j}: ${ik} + ${kj} = ∞, không có đường đi qua ${k}. Giữ ${show(f.before)}.`
          : `${i} → ${k} → ${j}: ${ik} + ${kj} = ${show(f.via)}, không nhỏ hơn ${show(f.before)}. Giữ nguyên.`;
      case 'done':
        return `Xong: ${f.comparisons} phép so sánh, ${f.updates} lần cải thiện. Mỗi ô chứa một khoảng cách ngắn nhất, và đường chéo không có giá trị âm nào.`;
      case 'negative':
        return `Đường chéo âm ở ${f.negative.map((v) => names[v]).join(', ')}: có đường đi từ mỗi đỉnh này quay về chính nó với trọng số âm, nên chúng nằm trên một chu trình âm và khoảng cách của chúng không có ý nghĩa.`;
    }
  },
  takeaways: [
    'Thuật toán Floyd-Warshall giải bài toán đường đi ngắn nhất giữa mọi cặp đỉnh. Ban đầu dist[i][j] là trọng số cạnh trực tiếp, 0 trên đường chéo và ∞ ở các chỗ còn lại.',
    'Giai đoạn k cho phép đỉnh k làm điểm dừng trung gian. Sau giai đoạn đó, dist[i][j] là đường đi ngắn nhất mà mọi đỉnh ở giữa đều thuộc k + 1 đỉnh đầu tiên. Công thức cập nhật là dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).',
    'Ba vòng lặp lồng nhau trên V đỉnh cho O(V³) thời gian và O(V²) bộ nhớ, bất kể số cạnh: phù hợp với đồ thị dày hoặc nhỏ. Vòng lặp theo k phải nằm ngoài cùng.',
    'Cạnh âm không sao. Sau giai đoạn cuối, dist[v][v] âm nghĩa là v nằm trên một chu trình âm. Một ma trận lưu đỉnh kế tiếp trên mỗi đường giúp dựng lại từng đường đi.',
    'Thử xem: chọn ô từ D đến A và đi từng giai đoạn bằng nút k tiếp theo để xem giá trị giảm từ ∞ xuống 3, rồi nạp “Chu trình âm” và nhìn đường chéo.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Thời gian', 'O(V³)', 'V giai đoạn, mỗi giai đoạn so sánh cả V² cặp một lần.'],
    ['Bộ nhớ', 'O(V²)', 'Ma trận khoảng cách và ma trận đỉnh kế tiếp, cập nhật tại chỗ.'],
    [
      'So với chạy V lần thuật toán Dijkstra',
      'O(V·(V + E) log V)',
      'Tốt hơn trên đồ thị thưa có trọng số không âm; thuật toán Floyd-Warshall đơn giản hơn và thắng khi E gần bằng V².',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trên đồ thị ban đầu, khoảng cách cuối cùng từ D đến A là bao nhiêu?',
      answer: 3,
      tolerance: 0,
      hints: ['D có đúng một cạnh đi ra: D → B trọng số −1.', 'Sau đó B → A có trọng số 4.'],
      solution: 'D → B → A có trọng số −1 + 4 = 3. Đó là lối ra duy nhất từ D.',
    },
    {
      type: 'number',
      prompt:
        'Trên đồ thị ban đầu, dist[B][C] bằng bao nhiêu ngay khi giai đoạn k = A xong (A là điểm dừng duy nhất được phép)?',
      answer: 2,
      tolerance: 0,
      hints: ['Cạnh trực tiếp B → C có trọng số 3.', 'Qua A: B → A là 4 và A → C là −2.'],
      solution: 'min(3, 4 + (−2)) = 2: đi qua A thắng cạnh trực tiếp.',
    },
    {
      type: 'number',
      prompt:
        'Trên một đồ thị 5 đỉnh, thuật toán Floyd-Warshall thực hiện bao nhiêu phép so sánh (i, j)?',
      answer: 125,
      unit: 'phép so sánh',
      tolerance: 0,
      hints: ['Đếm các vòng lặp: k, i và j đều chạy qua mọi đỉnh.'],
      solution:
        '5 · 5 · 5 = 125: năm giai đoạn, mỗi giai đoạn so sánh cả 25 cặp. Số cạnh không ảnh hưởng.',
    },
    {
      type: 'choice',
      prompt: 'Ngay sau khi giai đoạn k kết thúc, dist[i][j] chứa gì?',
      options: [
        'Đường đi ngắn nhất từ i đến j dùng tối đa k cạnh.',
        'Đường đi ngắn nhất từ i đến j mà mọi đỉnh trung gian đều thuộc k + 1 đỉnh đầu tiên.',
        'Đường đi ngắn nhất từ i đến j đi qua k.',
        'Khoảng cách ngắn nhất cuối cùng từ i đến j.',
      ],
      answer: 1,
      hints: ['Giai đoạn k cho phép thêm một điểm dừng; nó không giới hạn số cạnh.'],
      solution:
        'Mỗi giai đoạn cho phép thêm một đỉnh làm điểm dừng ở giữa đường đi. Cách hiểu theo số cạnh là mô tả các vòng của thuật toán Bellman-Ford, không phải các giai đoạn của thuật toán Floyd-Warshall.',
    },
    {
      type: 'text',
      prompt: 'Viết thời gian chạy của thuật toán Floyd-Warshall bằng kí hiệu O lớn.',
      accept: ['O(V^3)', 'O(V³)', 'O(n^3)', 'O(n³)', 'V^3', 'n^3'],
      hints: ['Ba vòng lặp lồng nhau, mỗi vòng chạy qua mọi đỉnh.'],
      solution: 'O(V³): V giai đoạn × V hàng × V cột, mỗi phép so sánh tốn O(1).',
    },
  ],
  nextTeaser:
    'Trên đồ thị thưa, có cách nhanh hơn để tính mọi cặp đỉnh dù có cạnh âm. Bài sau là thuật toán Johnson, ghép thuật toán Bellman-Ford với thuật toán Dijkstra.',
};
