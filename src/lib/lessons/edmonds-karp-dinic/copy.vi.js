/** @typedef {import('$lib/algo-engine/edmonds-karp-dinic.js').PhaseFrame} PhaseFrame */
/** @typedef {import('$lib/algo-engine/edmonds-karp-dinic.js').FlowMethod} FlowMethod */
/** @typedef {import('$lib/algo-engine/ford-fulkerson.js').PathArc} PathArc */

/**
 * A path as vertex names joined by arrows; a backward step is drawn ⇠.
 * @param {PathArc[]} path @param {string[]} names
 */
const route = (path, names) =>
  path.length
    ? [names[path[0].from], ...path.map((a) => `${a.forward ? '→' : '⇠'} ${names[a.to]}`)].join(' ')
    : '';

export const vi = {
  slug: 'edmonds-karp-dinic',
  topic: 'flows',
  level: 'Nâng cao',
  title: 'Thuật toán Edmonds-Karp và Dinic',
  intro:
    'Thuật toán Ford-Fulkerson chạy được với bất kì đường tăng luồng (augmenting path) nào, nhưng chọn kém có thể khiến mỗi vòng chỉ đẩy được một lượng rất nhỏ. Thuật toán Edmonds-Karp luôn lấy một đường đi ngắn nhất, tìm bằng BFS (duyệt theo chiều rộng), nhờ đó số vòng không vượt quá O(V·E) dù sức chứa thế nào. Thuật toán Dinic còn đi xa hơn: một lần BFS dựng đồ thị phân tầng, rồi DFS (duyệt theo chiều sâu) đẩy cả một luồng chặn qua đó trước lần BFS tiếp theo.',
  summary:
    'So sánh các đường tăng luồng ngắn nhất của Edmonds-Karp với đồ thị phân tầng và luồng chặn của Dinic trên cùng một mạng.',
  instruction:
    'Chọn Edmonds-Karp, chạy từng bước và đếm số lần BFS; rồi chuyển sang Dinic trên cùng mạng đó. Với Dinic, các cung mờ nằm ngoài đồ thị phân tầng, ghi chú “L2” cho biết tầng của mỗi đỉnh, còn đỉnh màu xám là ngõ cụt trong pha hiện tại.',
  methodLabel: 'Thuật toán',
  methods: { ek: 'Edmonds-Karp', dinic: 'Dinic' },
  presetLabel: 'Mạng',
  presets: {
    classic: 'Mạng trong sách',
    layers: 'Mạng nhiều tầng',
    zigzag: 'Bẫy zíc zắc',
  },
  sourceLabel: 'Đỉnh phát s',
  sinkLabel: 'Đỉnh thu t',
  viewLabel: 'Chế độ xem',
  views: { residual: 'Thặng dư và tầng', flow: 'Luồng / sức chứa' },
  resetGraph: 'Đặt lại mạng',
  editTitle: 'Sửa mạng',
  editor: {
    graphAria: 'Trình sửa mạng: một đồ thị có hướng, trọng số của mỗi cạnh là sức chứa.',
    edgesTitle: 'Sức chứa',
    noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
    /** @param {string} name */
    capacityAria: (name) => `Sức chứa của cạnh ${name}`,
  },
  /** @param {number} max */
  badCapacity: (max) => `Sức chứa phải là số nguyên từ 1 đến ${max}. Sức chứa cũ được giữ lại.`,
  /** @param {number} max */
  clipped: (max) => `Sức chứa lớn hơn ${max} được giảm xuống ${max}.`,
  sameEnds: 'Đỉnh phát và đỉnh thu phải là hai đỉnh khác nhau. Lựa chọn cũ được giữ lại.',
  boardAria: {
    residual:
      'Đồ thị thặng dư kèm tầng BFS. Cung liền còn trống c − f, cung nét đứt huỷ luồng; các cung ngoài đồ thị phân tầng được làm mờ.',
    flow: 'Mạng luồng. Mỗi cạnh ghi luồng / sức chứa.',
  },
  /** @param {number} level */
  levelNote: (level) => (level < 0 ? 'L ∞' : `L${level}`),
  /** @param {string} name @param {number} level @param {string} state */
  vertexLabel: (name, level, state) =>
    [`Đỉnh ${name}`, level < 0 ? 'chưa đến được' : `tầng ${level}`, state]
      .filter(Boolean)
      .join(', '),
  /** @param {string} u @param {string} v @param {number} f @param {number} c @param {string} state */
  edgeTitle: (u, v, f, c, state) =>
    [`Cạnh ${u} → ${v}: luồng ${f}/${c}`, state].filter(Boolean).join(', '),
  /**
   * @param {string} u @param {string} v @param {number} room @param {boolean} forward
   * @param {string} state
   */
  arcTitle: (u, v, room, forward, state) =>
    [
      forward ? `Cung ${u} → ${v}: còn trống ${room}` : `Cung ngược ${u} → ${v}: huỷ được ${room}`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  /** @param {number} f @param {number} c */
  flowLabel: (f, c) => `${f}/${c}`,
  states: {
    source: 'đỉnh phát',
    sink: 'đỉnh thu',
    onPath: 'trên đường đi hiện tại',
    dead: 'ngõ cụt trong pha này',
    outside: 'ngoài đồ thị phân tầng',
    forward: 'đường đi thêm luồng ở đây',
    backward: 'đường đi huỷ luồng ở đây',
    full: 'bão hoà',
    carries: 'đang có luồng',
  },
  legend: {
    onPath: 'Trên đường đi',
    dead: 'Ngõ cụt (pha này)',
    forward: 'Đường đi thêm luồng',
    backward: 'Đường đi huỷ luồng',
    faded: 'Mờ: không thuộc đồ thị phân tầng',
    dashed: 'Cung ngược',
    carries: 'Đang có luồng',
    full: 'Bão hoà (f = c)',
  },
  stats: {
    value: 'Giá trị luồng',
    paths: 'Số đường tăng luồng',
    searches: { ek: 'Số lần BFS', dinic: 'Số pha (lần BFS)' },
    checks: 'Số lần xét cung',
  },
  pathTitle: 'Đường đi hiện tại',
  emptyPath: 'chưa có',
  /** @param {string} u @param {string} v @param {boolean} forward */
  pathStep: (u, v, forward) => (forward ? `${u} → ${v}` : `${u} ⇠ ${v} (huỷ)`),
  /**
   * @param {PhaseFrame} f
   * @param {FlowMethod} method
   * @param {string[]} names
   * @param {{ s: string, t: string, sink: number }} ends
   */
  describe(f, method, names, { s, t, sink }) {
    const p = route(f.path, names);
    switch (f.kind) {
      case 'start':
        return method === 'ek'
          ? `Mọi cạnh bắt đầu với luồng 0. Mỗi vòng chạy BFS từ ${s}, nên đường đi tìm được đến ${t} dùng ít cung nhất có thể.`
          : `Mọi cạnh bắt đầu với luồng 0. Mỗi pha chạy BFS một lần để xếp các đỉnh theo tầng, rồi đẩy hết mọi đường đi còn vừa trước lần BFS tiếp theo.`;
      case 'bfs':
        return method === 'ek'
          ? `BFS đến được ${t} sau ${f.level[sink]} cung, theo ${p}. Cổ chai của đường là b = ${f.bottleneck}.`
          : `Pha ${f.searches}: BFS đặt ${t} ở tầng ${f.level[sink]}. Chỉ những cung còn trống đi lên đúng một tầng mới ở lại đồ thị phân tầng; các cung còn lại được làm mờ.`;
      case 'path':
        return `DFS trong đồ thị phân tầng tìm được ${p}, cổ chai b = ${f.bottleneck}.`;
      case 'push':
        return method === 'ek'
          ? `Đẩy ${f.bottleneck} dọc theo đường đi. Giá trị luồng: ${f.value}. Đường đi ngắn nhất kế tiếp không bao giờ ngắn hơn đường này.`
          : `Đẩy ${f.bottleneck}. Pha này đã đẩy được ${f.phaseFlow}; giá trị luồng là ${f.value}. DFS bắt đầu lại từ ${s}, giữ nguyên vị trí đang xét trong danh sách cung của mỗi đỉnh.`;
      case 'dead':
        return `DFS đến được ${names[f.at]}, nhưng không cung nào của đồ thị phân tầng đi ra từ ${names[f.at]} còn trống: đây là ngõ cụt. DFS lùi lại và bỏ qua ${names[f.at]} trong phần còn lại của pha.`;
      case 'blocked':
        return `Đồ thị phân tầng không còn đường đi nào: pha ${f.searches} đã đẩy một luồng chặn bằng ${f.phaseFlow}. Lần BFS sau phải đặt ${t} xa hơn ít nhất một tầng.`;
      case 'none':
        return `BFS không còn đến được ${t}, nên luồng có giá trị ${f.value} là cực đại.`;
      case 'done':
        return f.augmentations
          ? `Xong: ${f.augmentations} đường tăng luồng và ${f.searches} lần BFS cho luồng cực đại ${f.value} từ ${s} đến ${t}.`
          : `Xong: không có luồng nào đi được từ ${s} đến ${t}, nên luồng cực đại là 0.`;
    }
  },
  takeaways: [
    'Edmonds-Karp là Ford-Fulkerson dùng BFS: mọi đường tăng luồng đều là đường ngắn nhất trong đồ thị thặng dư, tính theo số cung.',
    'Khoảng cách từ s không bao giờ giảm sau một lần đẩy, và mỗi lần đẩy làm bão hoà một cung nào đó trên đường ngắn nhất. Một cung chỉ làm cổ chai được O(V) lần, nên có O(V·E) lần tăng luồng và thời gian O(V·E²), dù sức chứa thế nào.',
    'Đồ thị phân tầng của Dinic chỉ giữ các cung đi lên một tầng. Luồng chặn lấp đầy nó đến khi mọi đường s → t trong đó đều có một cung đầy, nên lần BFS sau thấy t ở xa hơn hẳn, và có tối đa V − 1 pha.',
    'Trong một pha, mỗi đỉnh giữ một con trỏ đến cung đang xét và đánh dấu ngõ cụt, nên DFS không bao giờ thử lại cung đã bỏ; một luồng chặn tốn O(V·E), nên Dinic chạy trong O(V²·E), và O(E·√V) trên đồ thị hai phía có sức chứa bằng 1.',
    'Thử xem: trên “Mạng nhiều tầng”, so sánh số lần BFS của Edmonds-Karp và Dinic, rồi thêm một cạnh từ A đến E và xem Dinic có còn chỉ cần một pha không.',
  ],
  complexityHead: ['Thuật toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Edmonds-Karp',
      'O(V·E²)',
      'Tối đa O(V·E) lần tăng luồng, mỗi lần tìm bằng một lần BFS tốn O(E).',
    ],
    [
      'Dinic',
      'O(V²·E)',
      'Tối đa V − 1 pha; mỗi pha dựng tầng bằng một lần BFS và tìm luồng chặn trong O(V·E).',
    ],
    [
      'Dinic, sức chứa bằng 1',
      'O(E·√V)',
      'Trên mạng của bài toán ghép cặp hai phía chỉ cần O(√V) pha; đó chính là thuật toán Hopcroft-Karp.',
    ],
    ['Bộ nhớ', 'O(V + E)', 'Luồng, các cung thặng dư, tầng và một con trỏ cung cho mỗi đỉnh.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chạy Edmonds-Karp trên “Mạng trong sách”: BFS chạy bao nhiêu lần, tính cả lần cuối không đến được T?',
      answer: 4,
      tolerance: 0,
      hints: ['Mỗi đường tăng luồng một lần BFS, cộng thêm lần BFS chứng tỏ luồng đã cực đại.'],
      solution:
        'BFS tìm được S → A → C → T (12), S → B → D → T (4) và S → B → D → C → T (7), rồi lần BFS thứ tư không đến được T. Vậy có 4 lần chạy cho luồng bằng 23.',
    },
    {
      type: 'number',
      prompt:
        'Chạy Dinic trên cùng mạng đó: có bao nhiêu pha kết thúc bằng một luồng chặn trước khi BFS thất bại?',
      answer: 2,
      tolerance: 0,
      hints: ['Theo dõi tầng của T: ở pha đầu là 3.'],
      solution:
        'Pha 1 (T ở tầng 3) đẩy 12 + 4 = 16, pha 2 (T ở tầng 4) đẩy 7, rồi BFS không đến được T.',
    },
    {
      type: 'number',
      prompt: 'Chạy Dinic trên “Mạng nhiều tầng”: pha đầu tiên đẩy bao nhiêu đường tăng luồng?',
      answer: 4,
      tolerance: 0,
      hints: [
        'Mọi đường đi trong đồ thị phân tầng đều có 3 cung. Đếm các bước “tìm được” trước luồng chặn.',
      ],
      solution:
        'S → A → D → T, S → B → D → T, S → B → E → T và S → C → E → T, đẩy 3 + 2 + 1 + 3 = 9 trong một pha. Edmonds-Karp cần một lần BFS riêng cho mỗi đường.',
    },
    {
      type: 'number',
      prompt:
        'Trên “Bẫy zíc zắc”, cho Edmonds-Karp chạy xong. Ở cuối, cạnh giữa A → B mang bao nhiêu luồng?',
      answer: 0,
      tolerance: 0,
      hints: ['Cả hai đường ngắn nhất đều có hai cung. Có đường nào dùng A → B không?'],
      solution:
        'BFS tìm S → A → T rồi S → B → T, mỗi đường 2 cung; đường 3 cung đi qua A → B không bao giờ là ngắn nhất. Vậy A → B mang 0, và chỉ 2 lần tăng luồng đã đẩy hết 40 đơn vị, trong khi Ford-Fulkerson chọn thứ tự kém có thể cần 40 lần đẩy, mỗi lần 1 đơn vị.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao mỗi pha của Dinic đặt t xa s hơn hẳn so với pha trước?',
      options: [
        'Vì DFS luôn chọn cung còn trống nhiều nhất.',
        'Vì sau một luồng chặn, mọi đường đi có độ dài cũ đều có một cung đầy, và các cung ngược mới chỉ đi xuống một tầng.',
        'Vì mỗi pha bỏ một đỉnh khỏi mạng.',
        'Vì sức chứa là số nguyên.',
      ],
      answer: 1,
      hints: [
        'Những cung nào có thể xuất hiện trong đồ thị thặng dư sau khi đẩy dọc các cung của đồ thị phân tầng?',
      ],
      solution:
        'Đẩy dọc u → v (lên một tầng) chỉ có thể tạo cung ngược v → u, đi xuống một tầng. Vì vậy không có lối tắt mới nào xuất hiện, và luồng chặn đã cắt mọi đường đi có độ dài cũ: đường ngắn nhất kế tiếp phải dài hơn.',
    },
  ],
  nextTeaser:
    'Bài sau, định lí luồng cực đại, lát cắt nhỏ nhất cho thấy vì sao luồng tìm được không thể lớn hơn, và đồ thị thặng dư cuối cùng chỉ ra chỗ hẹp nhất của mạng.',
};
