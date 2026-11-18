/** @typedef {import('$lib/algo-engine/shortest-path-properties.js').RelaxFrame} RelaxFrame */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d));

export const vi = {
  slug: 'shortest-path-properties',
  topic: 'shortest-paths',
  level: 'Cơ bản',
  title: 'Đồ thị có trọng số và tính chất của đường đi ngắn nhất',
  intro:
    'Trong đồ thị có trọng số, mỗi cạnh có một chi phí, và trọng số của một đường đi là tổng trọng số các cạnh trên nó. Đường đi ngắn nhất từ s đến v là đường đi có trọng số nhỏ nhất; trọng số đó là khoảng cách δ(s, v). Mọi thuật toán đường đi ngắn nhất trong chương này đều dựng từ một thao tác duy nhất là nới lỏng cạnh (relax), và chỉ khác nhau ở thứ tự nới lỏng các cạnh.',
  summary:
    'Tự chọn thứ tự nới lỏng các cạnh của một đồ thị có trọng số và xem các nhãn khoảng cách giảm dần về khoảng cách ngắn nhất thật.',
  instruction:
    'Bấm Nới lỏng ở một cạnh, hoặc chọn sẵn một thứ tự, rồi chạy từng bước. Mỗi lần nới lỏng hỏi: đi qua u có rẻ hơn nhãn hiện tại của v không? Đổi một trọng số thì cả dãy chạy lại. Bấm vào một đỉnh để xem đường đi trên cây và trọng số của nó.',
  presetLabel: 'Thứ tự nới lỏng',
  presetPlaceholder: 'Chọn một thứ tự…',
  presets: {
    path: 'Dọc theo đường đi ngắn nhất đến D',
    list: 'Danh sách cạnh một lần',
    reverse: 'Danh sách cạnh đảo ngược',
    twice: 'Đảo ngược, hai lần',
  },
  undo: 'Hoàn tác',
  clear: 'Xoá dãy',
  resetWeights: 'Đặt lại trọng số',
  graphAria: 'Đồ thị có hướng, có trọng số, đỉnh nguồn S. Mỗi đỉnh hiện nhãn khoảng cách d.',
  edgesTitle: 'Các cạnh',
  edgeHead: ['Cạnh', 'Trọng số', 'Thao tác'],
  relax: 'Nới lỏng',
  /** @param {string} name */
  relaxAria: (name) => `Nới lỏng cạnh ${name}`,
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  sequenceTitle: 'Dãy nới lỏng',
  emptyText: 'trống — bấm Nới lỏng ở một cạnh',
  hotLabel: 'đang nới lỏng',
  stats: {
    relaxations: 'Số lần nới lỏng',
    updates: 'Số nhãn đã giảm',
    exact: 'Số nhãn đã chính xác',
  },
  legend: {
    source: 'Đỉnh nguồn',
    read: 'u đang được đọc, hoặc v giữ nguyên',
    write: 'v, nhãn vừa giảm',
    exact: 'Nhãn bằng khoảng cách thật',
    edgeNow: 'Cạnh đang nới lỏng',
    tree: 'Cạnh nối với cha',
    path: 'Đường đi trên cây đến đỉnh đã chọn',
  },
  states: {
    source: 'đỉnh nguồn',
    read: 'đầu cạnh đang nới lỏng',
    write: 'nhãn vừa giảm',
    unchanged: 'nhãn giữ nguyên',
    exact: 'chính xác',
  },
  /** @param {number} d */
  dNote: (d) => `d ${show(d)}`,
  /** @param {string} name @param {number} d @param {string} state */
  vertexLabel: (name, d, state) =>
    [`Đỉnh ${name}`, `d = ${show(d)}`, state].filter(Boolean).join(', '),
  pathTitle: 'Đường đi trên cây',
  /** @param {string} name */
  noPath: (name) => `${name} chưa có cha, nên ta chưa tìm thấy đường đi nào đến nó.`,
  /**
   * @param {string} name
   * @param {string[]} path  Vertex names, source first.
   * @param {number[]} weights  Edge weights along the path.
   * @param {number} label  The vertex’s current label.
   * @param {number} truth  The true shortest distance.
   */
  pathText(name, path, weights, label, truth) {
    const total = weights.reduce((a, b) => a + b, 0);
    const sum = weights.length ? `${weights.join(' + ')} = ${total}` : '0';
    const parts = [`${path.join(' → ')}: trọng số ${sum}.`];
    if (label !== total)
      parts.push(
        `Nhãn d[${name}] = ${show(label)} vẫn còn lớn hơn: một đỉnh phía trước trên đường đi đã giảm nhãn sau khi ${name} được gán, nên phải nới lỏng lại cạnh cuối.`,
      );
    parts.push(
      label === truth
        ? `Đó chính là khoảng cách thật δ(S, ${name}) = ${show(truth)}.`
        : `Khoảng cách thật δ(S, ${name}) là ${show(truth)}, nên cần nới lỏng thêm.`,
    );
    return parts.join(' ');
  },
  /** @param {string[]} path @param {number[]} prefix */
  substructure: (path, prefix) =>
    `Cấu trúc con tối ưu: mỗi đỉnh trên đường đi này được đến bằng chính đoạn đầu của đường đi, với trọng số ${path.map((v, i) => `${v} ${prefix[i]}`).join(', ')}.`,
  /** @param {number} n */
  opsFull: (n) => `Một dãy chứa tối đa ${n} lần nới lỏng. Hãy hoàn tác hoặc xoá dãy trước.`,
  /** @param {number} max */
  badWeight: (max) => `Trọng số phải là số nguyên từ 0 đến ${max}. Trọng số cũ được giữ nguyên.`,
  /**
   * @param {RelaxFrame} f
   * @param {string[]} names
   * @param {{from: number, to: number, weight: number} | null} edge  The frame’s edge.
   * @param {number} total  Vertices in the graph.
   */
  describe(f, names, edge, total) {
    switch (f.kind) {
      case 'start':
        return 'Bắt đầu: d[S] = 0 và mọi nhãn khác là ∞, vì ta chưa biết đường đi nào đến chúng.';
      case 'relax': {
        if (!edge) return '';
        const u = names[edge.from];
        const v = names[edge.to];
        const head = `Nới lỏng ${u} → ${v} (trọng số ${edge.weight}):`;
        if (f.candidate === Infinity)
          return `${head} d[${u}] là ∞, nên đi qua ${u} chưa giúp được gì. Thứ tự rất quan trọng.`;
        const sum = `d[${u}] + ${edge.weight} = ${show(f.dist[edge.from])} + ${edge.weight} = ${f.candidate}`;
        return f.improved
          ? `${head} ${sum} < ${show(f.before)}, nên ta giảm d[${v}] xuống ${f.candidate} và đặt parent[${v}] = ${u}.`
          : `${head} ${sum} không nhỏ hơn d[${v}] = ${show(f.before)}. Giữ nguyên nhãn.`;
      }
      case 'done':
        return f.exact === total
          ? `Xong sau ${f.relaxations} lần nới lỏng: mọi nhãn đều là khoảng cách ngắn nhất thật, và các cạnh nối với cha tạo thành một cây đường đi ngắn nhất.`
          : `Xong sau ${f.relaxations} lần nới lỏng, nhưng mới có ${f.exact}/${total} nhãn chính xác. Hãy nới lỏng thêm, theo một thứ tự tốt hơn.`;
    }
  },
  takeaways: [
    'Trọng số của một đường đi là tổng trọng số các cạnh của nó. Khoảng cách ngắn nhất δ(s, v) là trọng số nhỏ nhất trong mọi đường đi từ s đến v, và bằng ∞ khi không đến được v.',
    'Nới lỏng u → v là kiểm tra d[u] + w < d[v]; nếu đúng thì giảm d[v] và đặt parent[v] = u. Nhãn luôn là trọng số của một đường đi có thật, nên nó không bao giờ nhỏ hơn δ(s, v) và không bao giờ tăng.',
    'Cấu trúc con tối ưu (optimal substructure): mọi đoạn đầu của một đường đi ngắn nhất cũng là đường đi ngắn nhất. Vì vậy nếu nới lỏng các cạnh của một đường đi ngắn nhất theo đúng thứ tự trên đường, đỉnh cuối sẽ có khoảng cách chính xác, dù xen giữa ta nới lỏng thêm cạnh nào.',
    'Thuật toán Dijkstra, Bellman-Ford, BFS cho trọng số 0-1 và phương pháp trên DAG đều nới lỏng cạnh; chúng chỉ khác nhau ở thứ tự, và thứ tự quyết định cần bao nhiêu lần nới lỏng.',
    'Thử xem: chọn “Danh sách cạnh đảo ngược”, để ý xem có ít nhãn chính xác thế nào, rồi thêm từng lần nới lỏng cho đến khi mọi nhãn khớp khoảng cách thật.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Một lần nới lỏng', 'O(1)', 'Một phép cộng, một phép so sánh và tối đa hai lần ghi.'],
    [
      'k lần nới lỏng',
      'O(k)',
      'Thứ tự chính là toàn bộ thuật toán: thứ tự tốt cần ít lần nới lỏng, thứ tự kém cần nhiều.',
    ],
    ['Bộ nhớ', 'O(V)', 'Mỗi đỉnh một nhãn khoảng cách và một cha.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với trọng số ban đầu, đường đi S → A → C → D có trọng số bao nhiêu? (S → A là 6, A → C là 2, C → D là 1.)',
      answer: 9,
      tolerance: 0,
      hints: ['Cộng ba trọng số cạnh lại.'],
      solution:
        '6 + 2 + 1 = 9. Đây là một đường đi đến D nhưng không phải ngắn nhất: S → B → A → C → D có trọng số 2 + 3 + 2 + 1 = 8.',
    },
    {
      type: 'number',
      prompt:
        'Với trọng số ban đầu, chọn “Danh sách cạnh đảo ngược” rồi chạy đến bước cuối. Nhãn d[A] bằng bao nhiêu?',
      answer: 6,
      tolerance: 0,
      hints: [
        'Theo thứ tự đảo ngược, B → A đứng trước S → B, nên khi nới lỏng B → A thì d[B] vẫn là ∞.',
      ],
      solution:
        'Chỉ S → B (d[B] = 2) và S → A (d[A] = 6) có tác dụng. B → A chạy quá sớm, nên d[A] dừng ở 6 thay vì giá trị thật là 5.',
    },
    {
      type: 'number',
      prompt:
        'Với trọng số ban đầu và các nhãn mới khởi tạo, cần ít nhất bao nhiêu lần nới lỏng để d[D] chính xác?',
      answer: 4,
      unit: 'lần',
      tolerance: 0,
      hints: [
        'Đường đi ngắn nhất đến D là S → B → A → C → D.',
        'Phải nới lỏng từng cạnh của đường đi đó, theo đúng thứ tự.',
      ],
      solution:
        'Đường đi ngắn nhất đến D có 4 cạnh. Nới lỏng chúng theo thứ tự trên đường (S → B, B → A, A → C, C → D) làm từng nhãn chính xác lần lượt, nên 4 lần là đủ. Ít hơn thì không được: nhãn 8 phải đến từ một đường đi trọng số 8, và đường đi 4 cạnh này là đường duy nhất như vậy.',
    },
    {
      type: 'choice',
      prompt:
        'S → B → A → C → D là một đường đi ngắn nhất đến D. Từ cấu trúc con tối ưu suy ra được điều gì?',
      options: [
        'S → B → A là một đường đi ngắn nhất từ S đến A.',
        'Mỗi cạnh trên đường là cạnh rẻ nhất đi ra từ đỉnh đầu của nó.',
        'D không có đường đi nào khác cùng trọng số.',
        'Đường đi dùng ít cạnh nhất có thể.',
      ],
      answer: 0,
      hints: ['Giả sử có một đường rẻ hơn đến A. Khi đó đường đi đến D sẽ ra sao?'],
      solution:
        'Nếu có đường đến A rẻ hơn S → B → A, thay nó vào sẽ được một đường đến D rẻ hơn, mâu thuẫn. Vậy mọi đoạn đầu của đường đi ngắn nhất đều ngắn nhất. Các khẳng định còn lại không nhất thiết đúng.',
    },
  ],
  nextTeaser:
    'Bài sau đưa ý tưởng này lên lưới: thuật toán Dijkstra trên lưới nới lỏng các ô theo thứ tự khoảng cách tăng dần.',
};
