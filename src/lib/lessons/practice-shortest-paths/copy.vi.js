/** @typedef {import('$lib/algo-engine/practice-shortest-paths.js').SpFrame} SpFrame */
/** @typedef {import('$lib/algo-engine/practice-shortest-paths.js').Algo} Algo */
/** @typedef {import('$lib/algo-engine/practice-shortest-paths.js').Verdict} Verdict */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d).replace('-', '−'));

/** A summand: a negative number goes in brackets, as in 1 + (−2). @param {number} d */
const term = (d) => (d < 0 ? `(${show(d)})` : show(d));

/** @type {Record<Algo, string>} */
const algoNames = { bfs: 'BFS', dijkstra: 'Dijkstra', 'bellman-ford': 'Bellman-Ford' };

export const vi = {
  slug: 'practice-shortest-paths',
  topic: 'shortest-paths',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán đường đi ngắn nhất',
  intro:
    'Cái khó của một bài toán đường đi ngắn nhất thường không nằm ở thuật toán mà ở việc chọn thuật toán nào. Mọi cạnh cùng chi phí thì dùng BFS, trọng số không âm thì dùng thuật toán Dijkstra, có trọng số âm thì dùng thuật toán Bellman-Ford. Nhiều câu đố cũng là đồ thị trá hình: các đỉnh là trạng thái của câu đố, các cạnh là nước đi.',
  summary:
    'Chọn BFS, Dijkstra hoặc Bellman-Ford cho từng tình huống, xem lựa chọn của bạn chạy, và biết kết quả của nó có đúng không.',
  instruction:
    'Chọn một thẻ tình huống, chọn một thuật toán rồi chạy đến bước cuối: phần nhận xét cho biết kết quả có đúng không và thuật toán nào hợp nhất. Bảng chạy cả ba thuật toán trên cùng đồ thị. Đổi trọng số trong danh sách cạnh, hoặc vẽ thêm cạnh, để xem nhận xét thay đổi.',
  scenarioLabel: 'Tình huống',
  scenarios: {
    moves: {
      title: 'Ít nước đi nhất',
      story:
        'Một bộ đếm đang hiện 1. Mỗi nước đi hoặc cộng thêm 1, hoặc nhân đôi số đó. Cần ít nhất bao nhiêu nước đi để đến 10? Mỗi đỉnh là một số, mỗi cạnh là một nước đi.',
    },
    roads: {
      title: 'Chuyến đi đường bộ',
      story:
        'Các con đường một chiều kèm thời gian đi tính bằng phút. Đường nào nhanh nhất từ S đến T? Lộ trình qua ít con đường nhất không phải là lộ trình nhanh nhất.',
    },
    cashback: {
      title: 'Chuyến bay hoàn tiền',
      story:
        'Giá vé giữa các thành phố, và chuyến bay từ B đến A hoàn lại cho bạn 4. Chuyến đi rẻ nhất từ S đến T là bao nhiêu?',
    },
    arbitrage: {
      title: 'Vòng giao dịch',
      story:
        'Chi phí của mỗi lần giao dịch; chi phí âm nghĩa là có lãi. Cách rẻ nhất từ S đến T là gì? Coi chừng một vòng lặp cứ đi quanh là có lãi.',
    },
  },
  algoLabel: 'Lựa chọn của bạn',
  algos: algoNames,
  sourceLabel: 'Từ',
  targetLabel: 'Đến',
  resetScenario: 'Đặt lại tình huống',
  graphAria: 'Đồ thị có hướng có trọng số của tình huống. Mỗi đỉnh hiện nhãn hiện tại d.',
  edgesTitle: 'Các cạnh và trọng số',
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
  /** @param {number} max */
  badWeight: (max) =>
    `Trọng số phải là số nguyên từ −${max} đến ${max}. Trọng số cũ được giữ nguyên.`,
  frontierTitle: {
    bfs: 'Hàng đợi (đầu hàng trước, số = số cạnh đã dùng)',
    dijkstra: 'Hàng đợi ưu tiên (nhãn nhỏ nhất trước)',
    'bellman-ford': 'Các nhãn d (số = nhãn hiện tại)',
  },
  frontierEmpty: 'rỗng',
  hotLabel: 'vừa thêm',
  /** @param {string} name @param {number} d */
  chip: (name, d) => `${name} ${show(d)}`,
  stats: {
    checks: 'Số cạnh đã xét',
    taken: 'Số đỉnh đã lấy',
    answer: 'Kết quả cho đỉnh đích',
  },
  compareTitle: 'Cả ba trên đồ thị này',
  compareHead: ['Thuật toán', 'Kết quả', 'Số cạnh đã xét'],
  cycleAnswer: 'chu trình âm',
  verdictTitle: 'Nhận xét',
  verdictPending: 'Chạy đến bước cuối để xem nhận xét.',
  verdicts: {
    best: 'Đúng, và đây là lựa chọn hợp nhất cho đồ thị này.',
    works: 'Đúng, và ở đây luôn đúng, nhưng chậm hơn lựa chọn hợp nhất.',
    lucky:
      'Lần này đúng, nhưng chỉ là may mắn: thuật toán này không được bảo đảm đúng trên đồ thị này.',
    wrong: 'Sai kết quả.',
  },
  /**
   * @param {Verdict} v @param {Algo} algo @param {string[]} names @param {number} target
   */
  verdictDetail(v, algo, names, target) {
    const best = `Hợp nhất: ${algoNames[v.best]}.`;
    if (v.negativeCycle)
      return algo === 'bellman-ford'
        ? `Từ đỉnh nguồn đến được một chu trình âm, nên đường đi ngắn nhất không tồn tại, và chỉ Bellman-Ford nói ra được điều đó. ${best}`
        : `Từ đỉnh nguồn đến được một chu trình âm, nên không có đường đi ngắn nhất, vậy mà ${algoNames[algo]} vẫn in ra các con số. ${best}`;
    const name = names[target] ?? '';
    if (v.verdict === 'wrong')
      return `${algoNames[algo]} cho d(${name}) = ${show(v.got[target])}, nhưng khoảng cách ngắn nhất là ${show(v.truth[target])}. ${best}`;
    return `d(${name}) = ${show(v.truth[target] ?? Infinity)}, sau khi xét ${v.checks} cạnh. ${best}`;
  },
  legend: {
    taken: 'Đã lấy hoặc đã chốt',
    current: 'u, đang được lấy hoặc đọc',
    write: 'v, nhãn vừa giảm',
    cycle: 'Trên chu trình âm',
    target: 'Đỉnh đích',
    edgeNow: 'Cạnh đang xét',
    tree: 'Cạnh nối với cha',
  },
  states: {
    source: 'đỉnh nguồn',
    target: 'đỉnh đích',
    taken: 'đã lấy',
    current: 'đang được đọc',
    write: 'nhãn vừa giảm',
    cycle: 'trên chu trình âm',
  },
  /** @param {number} d */
  dNote: (d) => `d ${show(d)}`,
  show,
  /** @param {string} name @param {number} d @param {string} state */
  vertexLabel: (name, d, state) =>
    [`Đỉnh ${name}`, `d = ${show(d)}`, state].filter(Boolean).join(', '),
  /**
   * @param {SpFrame} f
   * @param {string[]} names
   * @param {Algo} algo
   */
  describe(f, names, algo) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const head = `Cạnh ${u} → ${v} (trọng số ${show(f.weight)})`;
    const sum = `${show(f.dist[f.current])} + ${term(f.weight)} = ${show(f.dist[f.current] + f.weight)}`;
    switch (f.kind) {
      case 'start':
        return algo === 'bfs'
          ? 'BFS: đưa đỉnh nguồn vào hàng đợi. Khi tìm kiếm, nó đếm số cạnh và bỏ qua trọng số.'
          : algo === 'dijkstra'
            ? 'Dijkstra: đỉnh nguồn có nhãn 0, mọi đỉnh khác là ∞.'
            : `Bellman-Ford: đỉnh nguồn có nhãn 0, mọi đỉnh khác là ∞. Tối đa ${Math.max(0, names.length - 1)} vòng.`;
      case 'take':
        return algo === 'bfs'
          ? `Lấy ${u} ra khỏi hàng đợi, cách đỉnh nguồn ${f.hops[f.current]} cạnh.`
          : `Chốt ${u} với d = ${show(f.dist[f.current])}, nhãn nhỏ nhất còn lại. Nhãn này sẽ không bao giờ đổi nữa.`;
      case 'skip':
        return `Lấy ra một mục cũ của ${u} (${show(f.before)}): ${u} đã được chốt, bỏ qua.`;
      case 'relax':
        return algo === 'bfs'
          ? `${head}: ${v} là đỉnh mới. Nó cách ${f.hops[f.neighbor]} cạnh, và đường đi này tốn ${sum}.`
          : `${head}: ${sum} < ${show(f.before)}. Giảm d[${v}].`;
      case 'keep':
        return algo === 'bfs'
          ? `${head}: ${v} đã được thấy rồi, nên BFS bỏ qua cạnh này, bất kể trọng số.`
          : `${head}: ${sum} không nhỏ hơn ${show(f.before)}. Giữ nguyên d[${v}].`;
      case 'round':
        return `Vòng ${f.round}: nới lỏng mỗi cạnh một lần, theo thứ tự trong danh sách.`;
      case 'early':
        return `Vòng ${f.round} không đổi gì, nên các nhãn đã là cuối cùng và không đến được chu trình âm nào.`;
      case 'cycle':
        return `${head}: ${sum} < ${show(f.before)} dù đã qua V − 1 vòng. Đến được một chu trình âm: ${f.cycle.map((i) => names[i]).join(' → ')} → ${names[f.cycle[0]] ?? ''}.`;
      case 'done':
        if (f.cycle.length)
          return 'Đã dừng: đi thêm một vòng quanh chu trình âm luôn làm đường đi rẻ hơn, nên không có đường đi ngắn nhất.';
        return `Xong sau khi xét ${f.checks} cạnh.`;
    }
  },
  takeaways: [
    'Mọi cạnh cùng chi phí: BFS. Trọng số không âm: thuật toán Dijkstra. Có trọng số âm: thuật toán Bellman-Ford, đồng thời phát hiện được chu trình âm.',
    'Chọn một thuật toán chậm hơn mà vẫn đúng thì tốn thời gian; chọn thuật toán có giả thiết bị vi phạm thì cho kết quả sai. BFS bỏ qua trọng số, còn thuật toán Dijkstra chốt một đỉnh trước khi một cạnh âm kịp hạ nhãn của nó.',
    'Câu đố giấu đồ thị bên trong: coi mỗi trạng thái là một đỉnh và mỗi nước đi là một cạnh. Khi đó ít nước đi nhất là một bài BFS; nếu nước đi có chi phí khác nhau thì thành bài cho thuật toán Dijkstra.',
    'Ngoài một đỉnh nguồn: mọi cặp đỉnh trên đồ thị nhỏ hoặc dày thì dùng thuật toán Floyd-Warshall; trên đồ thị thưa có cạnh âm thì dùng thuật toán Johnson. Trọng số chỉ có 0 và 1: BFS 0-1. Lưới có ước lượng khoảng cách tốt: A*.',
    'Thử xem: ở Ít nước đi nhất, cho bước nhảy 5 → 10 tốn 3. BFS vẫn trả lời 6 qua bước đó, còn thuật toán Dijkstra tìm ra lộ trình 5 nước giờ đã rẻ hơn.',
  ],
  complexityHead: ['Thuật toán', 'Chi phí', 'Dùng khi'],
  complexity: [
    [
      'BFS',
      'O(V + E)',
      'Mọi cạnh cùng chi phí; cả các câu đố trên không gian trạng thái tính theo số nước đi.',
    ],
    ['BFS 0-1', 'O(V + E)', 'Mọi trọng số đều là 0 hoặc 1.'],
    ['Dijkstra (heap nhị phân)', 'O((V + E) log V)', 'Trọng số không âm.'],
    ['Bellman-Ford', 'O(V·E)', 'Có trọng số âm, hoặc cần phát hiện chu trình âm.'],
    ['Floyd-Warshall', 'O(V³)', 'Mọi cặp đỉnh trên đồ thị nhỏ hoặc dày.'],
    ['Johnson', 'O(V·E log V)', 'Mọi cặp đỉnh trên đồ thị thưa có cạnh âm.'],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Ít nước đi nhất: cần bao nhiêu nước đi để biến 1 thành 10?',
      answer: 4,
      unit: 'nước',
      tolerance: 0,
      hints: [
        'Chọn BFS: mọi nước đi cùng chi phí, nên số cạnh ít nhất chính là đáp án.',
        'Đọc nhãn của đỉnh 10 khi lần chạy kết thúc.',
      ],
      solution:
        '1 → 2 → 4 → 5 → 10: nhân đôi, nhân đôi, cộng 1, nhân đôi. BFS gán nhãn 4 cho đỉnh 10.',
    },
    {
      type: 'number',
      prompt: 'Chuyến đi đường bộ: chọn BFS. Lộ trình nó tìm được đến T mất bao nhiêu phút?',
      answer: 12,
      unit: 'phút',
      tolerance: 0,
      hints: ['BFS chọn lộ trình qua ít con đường nhất: S → A → T.'],
      solution:
        'BFS đến T qua A bằng hai con đường, 4 + 8 = 12 phút. Thuật toán Dijkstra tìm ra S → B → A → C → D → T, chỉ mất 8 phút.',
    },
    {
      type: 'number',
      prompt:
        'Chuyến đi đường bộ: tính cả vòng không có thay đổi, thuật toán Bellman-Ford xét tổng cộng bao nhiêu cạnh?',
      answer: 16,
      unit: 'cạnh',
      tolerance: 0,
      hints: [
        'Đọc cột “Số cạnh đã xét” trong bảng.',
        'Với thứ tự cạnh này, vòng 1 tìm ra mọi nhãn cuối cùng và vòng 2 xác nhận lại.',
      ],
      solution:
        'Hai vòng trên 8 cạnh: 16. Ở đây thuật toán Dijkstra chỉ xét 8 cạnh, vì vậy nó là lựa chọn hợp hơn.',
    },
    {
      type: 'number',
      prompt: 'Chuyến bay hoàn tiền: chọn Dijkstra. Nó báo giá đến T là bao nhiêu?',
      answer: 7,
      tolerance: 0,
      hints: [
        'Thuật toán Dijkstra chốt A ở 2 trước khi chốt B ở 5.',
        'Khi nó xét B → A, A đã được chốt và bị bỏ qua.',
      ],
      solution:
        'Thuật toán Dijkstra báo 7, qua S → A → C → T. Chuyến rẻ nhất là S → B → A → C → T: 5 − 4 + 2 + 3 = 6, và thuật toán Bellman-Ford tìm ra nó.',
    },
    {
      type: 'text',
      prompt:
        'Vòng giao dịch: chọn Bellman-Ford rồi chạy đến bước cuối. Nó báo chu trình nào? Gõ các đỉnh theo thứ tự, bắt đầu từ A.',
      accept: [
        'A, B, C',
        'A, B, C, A',
        'A B C',
        'A B C A',
        'ABC',
        'ABCA',
        'A → B → C',
        'A → B → C → A',
        'A→B→C',
        'A→B→C→A',
        'A->B->C',
        'A->B->C->A',
        'A-B-C',
        'A-B-C-A',
      ],
      hints: ['Tổng các trọng số của nó là 2 + (−3) + (−1).'],
      solution:
        'A → B → C → A có trọng số 2 − 3 − 1 = −2. Mỗi vòng quanh lại làm đường đi rẻ hơn, nên không có đường đi ngắn nhất đến A, B, C hay T.',
    },
    {
      type: 'multi',
      prompt: 'Chuyến đi đường bộ: những lựa chọn nào cho kết quả đúng? Chọn mọi phương án đúng.',
      options: ['BFS', 'Dijkstra', 'Bellman-Ford'],
      answers: [1, 2],
      hints: ['Chạy từng thuật toán rồi đọc nhận xét.'],
      solution:
        'Dijkstra và Bellman-Ford đều đúng, vì không có trọng số âm. Thuật toán Dijkstra hợp hơn; BFS sai vì các trọng số khác nhau.',
    },
    {
      type: 'choice',
      prompt:
        'Một mê cung: bước lên ô thường tốn 1, trượt lên ô băng tốn 0. Thuật toán nào hợp nhất?',
      options: ['BFS', 'BFS 0-1', 'Bellman-Ford', 'Floyd-Warshall'],
      answer: 1,
      hints: ['Chỉ có hai giá trị trọng số, và một trong hai là 0.'],
      solution:
        'BFS 0-1: đẩy cạnh 0 vào đầu hàng đợi hai đầu và cạnh 1 vào cuối hàng. Nó chạy trong O(V + E). BFS thường sẽ đếm cả các bước trượt băng là nước đi.',
    },
    {
      type: 'choice',
      prompt:
        'Bạn cần khoảng cách giữa mọi cặp trong 200 nhà ga, biết đủ cả 40 000 tuyến nối và có tuyến mang trọng số âm. Không có chu trình âm. Thuật toán nào hợp nhất?',
      options: ['Dijkstra từ mọi nhà ga', 'Floyd-Warshall', 'BFS từ mọi nhà ga', 'A*'],
      answer: 1,
      hints: ['Mọi cặp đỉnh, đồ thị dày, có trọng số âm.'],
      solution:
        'Thuật toán Floyd-Warshall: mọi cặp đỉnh trong O(V³) với ba vòng lặp ngắn, và trọng số âm không sao. Thuật toán Dijkstra sai khi có trọng số âm; trên đồ thị dày, thuật toán Johnson không có lợi gì hơn thuật toán Floyd-Warshall.',
    },
  ],
  nextTeaser:
    'Chương sau chuyển sang các bài toán gom nhóm, bắt đầu với tập hợp rời nhau: gộp hai nhóm và hỏi hai phần tử có chung nhóm không.',
};
