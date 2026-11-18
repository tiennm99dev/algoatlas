/** @typedef {import('$lib/algo-engine/bipartite-matching.js').MatchFrame} MatchFrame */
/** @typedef {import('$lib/algo-engine/bipartite-matching.js').MatchMethod} MatchMethod */

/** Name of left vertex i. @param {number} i */
const leftName = (i) => String.fromCharCode(65 + i);
/** Name of right vertex i. @param {number} i */
const rightName = (i) => String(i + 1);

/** An alternating path l0, r0, l1, r1, … as names. @param {number[]} path */
const route = (path) => path.map((x, i) => (i % 2 ? rightName(x) : leftName(x))).join(' – ');

/** @param {string[]} list */
const join = (list) =>
  list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} và ${list.at(-1)}`;

export const vi = {
  slug: 'bipartite-matching',
  topic: 'flows',
  level: 'Nâng cao',
  title: 'Ghép cặp trên đồ thị hai phía',
  intro:
    'Đồ thị hai phía có hai nhóm đỉnh, chẳng hạn người và công việc, và cạnh chỉ nối giữa hai nhóm. Một cách ghép cặp nối các đỉnh dọc theo cạnh sao cho không ai bị dùng hai lần; mục tiêu là có nhiều cặp nhất. Thêm một đỉnh phát trước nhóm bên trái và một đỉnh thu sau nhóm bên phải, cho mọi cạnh sức chứa 1, khi đó luồng cực đại chính là cách ghép cặp lớn nhất. Thuật toán Kuhn và thuật toán Hopcroft-Karp chạy luồng đó ngay trên hai cột đỉnh.',
  summary:
    'Tăng dần cách ghép cặp lớn nhất trên đồ thị hai phía bằng cách lật các đường tăng, lần lượt từng đường với thuật toán Kuhn hoặc theo từng loạt đường ngắn nhất với Hopcroft-Karp.',
  instruction:
    'Chạy từng bước thuật toán Kuhn và xem một đường tăng được lật: các cạnh đã ghép (xanh lá, nét đậm) và các cạnh chưa ghép đổi vai cho nhau dọc theo đường. Đánh dấu hoặc bỏ dấu các ô trong bảng để đổi cạnh, rồi chuyển sang Hopcroft-Karp để thấy nhiều đường ngắn nhất được lật trong một pha.',
  leftName,
  rightName,
  methodLabel: 'Thuật toán',
  methods: { kuhn: 'Kuhn', hk: 'Hopcroft-Karp' },
  presetLabel: 'Đồ thị',
  presets: {
    chain: 'Đường tăng dài',
    detours: 'Kuhn đổi cặp',
    hall: 'Có người bị thừa',
  },
  leftLabel: 'Số đỉnh bên trái',
  rightLabel: 'Số đỉnh bên phải',
  resetGraph: 'Đặt lại đồ thị',
  graphAria:
    'Đồ thị hai phía: các đỉnh bên trái A, B, … ở một cột, các đỉnh bên phải 1, 2, … ở cột kia. Cạnh nét đậm là cạnh đã ghép.',
  tableTitle: 'Các cạnh (bấm vào một ô để thêm hoặc xoá cạnh)',
  tableAria:
    'Bảng cạnh: mỗi hàng là một đỉnh bên trái, mỗi cột là một đỉnh bên phải. Dấu tích đánh dấu một cạnh.',
  /** @param {string} l @param {string} r @param {boolean} on @param {boolean} matched */
  cellLabel: (l, r, on, matched) =>
    `${l} – ${r}: ${on ? (matched ? 'có cạnh, đã ghép' : 'có cạnh') : 'không có cạnh'}`,
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Đỉnh ${name}`, state].filter(Boolean).join(', '),
  /** @param {number} layer */
  layerNote: (layer) => (layer < 0 ? '' : `L${layer}`),
  states: {
    matched: 'đã ghép',
    free: 'chưa ghép',
    now: 'đang tìm kiếm',
    looked: 'đang được xét',
    visited: 'đã thăm trong lần tìm này',
  },
  legend: {
    now: 'Tìm kiếm từ',
    looked: 'Đang xét',
    visited: 'Đã thăm (lần tìm này)',
    matched: 'Đã ghép',
    path: 'Đường xen kẽ',
    edgeNow: 'Cạnh đang xét',
  },
  stats: {
    size: 'Số cặp đã ghép',
    checks: 'Số lần xét cạnh',
    searches: { kuhn: 'Số lần bắt đầu tìm', hk: 'Số pha' },
  },
  pathTitle: 'Đường xen kẽ',
  emptyPath: 'chưa có',
  /**
   * @param {MatchFrame} f
   * @param {MatchMethod} method
   */
  describe(f, method) {
    const x = leftName(f.at);
    const r = rightName(f.right);
    const p = route(f.path);
    switch (f.kind) {
      case 'start':
        return method === 'kuhn'
          ? 'Chưa có cặp nào. Thuật toán Kuhn lần lượt lấy các đỉnh bên trái A, B, … và tìm một đường tăng từ mỗi đỉnh.'
          : 'Chưa có cặp nào. Mỗi pha của Hopcroft-Karp tìm kiếm cùng lúc từ mọi đỉnh bên trái chưa ghép.';
      case 'begin':
        return `Bắt đầu từ ${leftName(f.root)}: xoá các dấu đã thăm và chạy try(${leftName(f.root)}).`;
      case 'look':
        return `${x} xét ${r}: ${r} chưa ghép. Đường xen kẽ ${p} kết thúc ở một đỉnh chưa ghép, nên đó là một đường tăng.`;
      case 'follow':
        return `${x} xét ${r}: ${r} đã ghép với ${leftName(f.matchR[f.right])}. Liệu ${leftName(f.matchR[f.right])} có chuyển sang bạn ghép khác được không? Chạy try(${leftName(f.matchR[f.right])}).`;
      case 'skip':
        return `${x} bỏ qua ${r}: lần tìm này đã thăm đỉnh đó rồi.`;
      case 'back':
        return `${x} không còn đỉnh kề nào chưa ghép hoặc đổi cặp được, nên try(${x}) thất bại. Lùi lại.`;
      case 'flip':
        return method === 'kuhn'
          ? `Lật đường ${p}: các cạnh chưa ghép trên đường thành đã ghép, các cạnh đã ghép thành chưa ghép. Số cặp tăng lên ${f.size}.`
          : `DFS từ ${leftName(f.root)} tìm được ${p}, một đường tăng ngắn nhất không đụng các đường khác của pha này. Lật nó: ${f.size} cặp.`;
      case 'fail':
        return `Không có đường tăng nào bắt đầu từ ${leftName(f.root)}, nên đỉnh này vẫn chưa ghép. Các lần tìm sau chỉ làm số cặp tăng thêm, nên chúng không bao giờ mở ra đường đi cho nó.`;
      case 'phase': {
        const free = f.layer.flatMap((l, i) => (l === 0 ? [leftName(i)] : []));
        return `Pha ${f.phases}: BFS từ các đỉnh bên trái chưa ghép ${join(free)} cho thấy đường tăng ngắn nhất có ${f.length} cạnh. Ghi chú L cho biết tầng của mỗi đỉnh bên trái.`;
      }
      case 'stuck':
        return `DFS từ ${leftName(f.root)} không tìm được đường tăng ngắn nhất nào tránh được các đường đã lật trong pha này.`;
      case 'blocked':
        return `Pha ${f.phases} đã lật ${f.phasePaths} đường không chung đỉnh. Không còn đường tăng nào dài ${f.length} cạnh, nên các đường của pha sau sẽ dài hơn.`;
      case 'none':
        return 'BFS từ các đỉnh bên trái chưa ghép không đến được đỉnh bên phải nào chưa ghép: không còn đường tăng.';
      case 'done':
        return method === 'kuhn'
          ? `Xong: ${f.size} cặp sau ${f.checks} lần xét cạnh. Không còn đường tăng, nên cách ghép cặp đã lớn nhất.`
          : `Xong: ${f.size} cặp sau ${f.phases} pha và ${f.checks} lần xét cạnh. Không còn đường tăng, nên cách ghép cặp đã lớn nhất.`;
    }
  },
  takeaways: [
    'Quy dẫn về luồng cực đại: thêm đỉnh phát s nối đến mọi đỉnh bên trái bằng cạnh sức chứa 1, cho mọi cạnh trái–phải sức chứa 1 (hướng từ trái sang phải), và nối mọi đỉnh bên phải đến đỉnh thu t với sức chứa 1. Giá trị luồng cực đại là số cặp của cách ghép lớn nhất, và các cạnh mang luồng chính là các cặp.',
    'Một đường tăng bắt đầu ở một đỉnh bên trái chưa ghép, đi xen kẽ cạnh chưa ghép và cạnh đã ghép, rồi kết thúc ở một đỉnh bên phải chưa ghép. Lật nó thêm được một cặp. Một cách ghép cặp là lớn nhất khi và chỉ khi không còn đường tăng nào (định lí Berge).',
    'Thuật toán Kuhn chạy một lần DFS cho mỗi đỉnh bên trái, mỗi lần tìm thăm mỗi đỉnh bên phải tối đa một lần: tổng cộng O(V·E). Một đỉnh bên phải đã ghép sẽ nhờ bạn ghép của nó chuyển sang chỗ khác, đó chính là cung ngược của mạng luồng.',
    'Hopcroft-Karp là Dinic trên mạng sức chứa 1 này: mỗi pha lật một tập tối đại các đường tăng ngắn nhất không chung đỉnh, chỉ cần O(√V) pha, và tổng chi phí là O(E·√V).',
    'Thử xem: trên “Có người bị thừa”, đặt bên phải 4 đỉnh và đánh dấu B – 4. Đoán số cặp lớn nhất mới trước khi chạy, rồi so sánh cách Kuhn và Hopcroft-Karp đạt được nó.',
  ],
  complexityHead: ['Thuật toán', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Kuhn', 'O(V·E)', 'Một lần DFS cho mỗi đỉnh bên trái, mỗi lần xét mỗi cạnh tối đa một lần.'],
    ['Hopcroft-Karp', 'O(E·√V)', 'O(√V) pha, mỗi pha gồm một lần BFS và một lượt DFS tốn O(E).'],
    [
      'Giải như luồng cực đại',
      'O(V·E)',
      'Ford-Fulkerson với giá trị luồng tối đa V/2 cần tối đa V/2 lần tăng luồng, mỗi lần O(E).',
    ],
    ['Bộ nhớ', 'O(V + E)', 'Danh sách kề, một bạn ghép cho mỗi đỉnh và các dấu đã thăm.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chạy Kuhn trên “Đường tăng dài”: B thấy 1 đã ghép với A và nhờ A đổi cặp. Đường tăng được lật cho B có bao nhiêu cạnh?',
      answer: 3,
      unit: 'cạnh',
      tolerance: 0,
      hints: ['Đọc đường đi ở bước lật: B – 1 – A – 2.'],
      solution:
        'B – 1 (chưa ghép), 1 – A (đã ghép), A – 2 (chưa ghép): 3 cạnh. Lật nó thì B ghép với 1 và A ghép với 2.',
    },
    {
      type: 'number',
      prompt:
        'Chạy Hopcroft-Karp trên “Đường tăng dài”: ở pha 2, đường tăng ngắn nhất có bao nhiêu cạnh?',
      answer: 7,
      unit: 'cạnh',
      tolerance: 0,
      hints: ['Sau pha 1, bên trái chỉ còn B chưa ghép và bên phải chỉ còn 4.'],
      solution:
        'Đường tăng duy nhất là B – 1 – A – 2 – C – 3 – D – 4, gồm 7 cạnh. Lật nó cho đủ cả bốn cặp.',
    },
    {
      type: 'number',
      prompt: 'Trên “Có người bị thừa”, cách ghép cặp lớn nhất có bao nhiêu cặp?',
      answer: 3,
      tolerance: 0,
      hints: ['A và B chỉ có thể dùng 1.'],
      solution:
        'A và B tranh nhau 1, nên một trong hai phải ở lại một mình. C và D lấy được 2 và 3, nên tối đa là 3 cặp.',
    },
    {
      type: 'number',
      prompt:
        'Trong mạng luồng của bài toán ghép cặp, cạnh từ s đến mỗi đỉnh bên trái có sức chứa 1. Với 4 đỉnh bên trái và 3 đỉnh bên phải, giá trị luồng lớn nhất có thể là bao nhiêu, dù các cạnh thế nào?',
      answer: 3,
      tolerance: 0,
      hints: ['Mỗi đơn vị luồng đến t qua đúng một đỉnh bên phải.'],
      solution:
        'Mỗi đỉnh bên phải gửi tối đa 1 đơn vị đến t, nên luồng không quá 3, bằng số đỉnh của phía nhỏ hơn.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao Hopcroft-Karp lật được nhiều đường tăng trong một pha?',
      options: [
        'Vì các đường nó lật cùng lúc không chung đỉnh nào, nên lật đường này không làm hỏng đường kia.',
        'Vì nó lật mọi cạnh của đồ thị cùng một lúc.',
        'Vì BFS đã chọn sẵn cách ghép cặp cuối cùng.',
        'Vì đường ngắn nhất không bao giờ chung cạnh với cách ghép hiện tại.',
      ],
      answer: 0,
      hints: ['Chuyện gì sẽ hỏng nếu hai đường dùng chung một đỉnh bên phải?'],
      solution:
        'Các đường không chung đỉnh chạm vào những đỉnh khác nhau, nên sau khi lật một đường, các đường còn lại vẫn là đường tăng. Giống luồng chặn trong Dinic, pha dừng khi không còn đường ngắn nhất nào tránh được chúng.',
    },
  ],
  nextTeaser:
    'Bài sau, luồng chi phí nhỏ nhất và bài toán phân công gắn thêm chi phí cho mỗi cạnh và tìm cách ghép rẻ nhất.',
};
