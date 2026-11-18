/** @typedef {import('$lib/algo-engine/bellman-ford.js').BellmanFordFrame} BellmanFordFrame */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d).replace('-', '−'));

/** A summand: a negative number goes in brackets, as in 1 + (−2). @param {number} d */
const term = (d) => (d < 0 && d !== -Infinity ? `(${show(d)})` : show(d));

export const vi = {
  slug: 'bellman-ford',
  topic: 'shortest-paths',
  level: 'Trung bình',
  title: 'Thuật toán Bellman-Ford',
  intro:
    'Thuật toán Bellman-Ford nới lỏng mọi cạnh, hết vòng này đến vòng khác. Nó chậm hơn thuật toán Dijkstra, O(V·E), nhưng chấp nhận trọng số cạnh âm. Nó còn trả lời được một câu hỏi mà thuật toán Dijkstra không trả lời được: từ đỉnh nguồn có đến được một chu trình âm nào không? Nếu có, khái niệm đường đi ngắn nhất không còn ý nghĩa.',
  summary:
    'Xem thuật toán Bellman-Ford điền bảng nhãn khoảng cách theo từng vòng và phát hiện chu trình âm ở vòng thứ V.',
  instruction:
    'Chạy từng bước qua các vòng và xem bảng được điền dần: hàng i chứa các nhãn sau vòng i. Chọn “Chu trình âm”, hoặc hạ trọng số của D → A xuống 0 hay nhỏ hơn, để thấy vòng thứ V tìm ra một cạnh vẫn còn nới lỏng được.',
  presetLabel: 'Đồ thị',
  presets: {
    negative: 'Có cạnh âm, không có chu trình âm',
    good: 'Cùng đồ thị, thứ tự cạnh tốt',
    cycle: 'Chu trình âm',
  },
  sourceLabel: 'Đỉnh nguồn',
  resetGraph: 'Đặt lại đồ thị',
  graphAria: 'Đồ thị có hướng có trọng số; trọng số có thể âm. Mỗi đỉnh hiện nhãn khoảng cách d.',
  edgesTitle: 'Các cạnh, theo thứ tự mỗi vòng nới lỏng',
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
  /** @param {number} max */
  badWeight: (max) =>
    `Trọng số phải là số nguyên từ −${max} đến ${max}. Trọng số cũ được giữ nguyên.`,
  tableTitle: 'Các nhãn sau mỗi vòng',
  /** @param {number} r @param {number} n */
  rowHeader: (r, n) => (r === n ? 'V' : String(r)),
  tableAria:
    'Bảng khoảng cách: mỗi vòng một hàng, mỗi đỉnh một cột. Hàng 0 là lúc bắt đầu; hàng V là vòng kiểm tra chu trình âm.',
  /** @param {string} name @param {string} round @param {string} value @param {string} state */
  cellLabel: (name, round, value, state) =>
    [`Vòng ${round}, ${name}: ${value}`, state].filter(Boolean).join(', '),
  cycleTitle: 'Chu trình âm',
  emptyText: 'chưa tìm thấy',
  /** @param {number} r @param {number} last */
  roundStat: (r, last) => (r === 0 ? '—' : r > last ? 'V (kiểm tra)' : `${r}/${last}`),
  stats: {
    round: 'Vòng',
    relaxations: 'Số lần xét cạnh',
    updates: 'Số nhãn đã giảm',
  },
  legend: {
    tail: 'u, đang được đọc',
    write: 'v, nhãn vừa giảm',
    head: 'v, nhãn giữ nguyên',
    cycle: 'Trên chu trình âm',
    changed: 'Đã đổi trong vòng đó',
    edgeNow: 'Cạnh đang xét',
    tree: 'Cạnh nối với cha',
  },
  states: {
    source: 'đỉnh nguồn',
    tail: 'đầu cạnh đang xét',
    write: 'nhãn vừa giảm',
    head: 'nhãn giữ nguyên',
    cycle: 'trên chu trình âm',
    changed: 'đã đổi trong vòng này',
    flagged: 'vẫn còn giảm được',
  },
  /** @param {number} d */
  dNote: (d) => `d ${show(d)}`,
  show,
  /** @param {string} name @param {number} d @param {string} state */
  vertexLabel: (name, d, state) =>
    [`Đỉnh ${name}`, `d = ${show(d)}`, state].filter(Boolean).join(', '),
  /**
   * @param {BellmanFordFrame} f
   * @param {string[]} names
   */
  describe(f, names) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const n = names.length;
    const head = `Cạnh ${u} → ${v} (trọng số ${show(f.weight)}):`;
    const sum = `${show(f.dist[f.current])} + ${term(f.weight)} = ${show(f.dist[f.current] + f.weight)}`;
    switch (f.kind) {
      case 'start':
        return `Đặt nhãn của đỉnh nguồn là 0 và mọi nhãn khác là ∞. Với ${n} đỉnh, cần tối đa ${Math.max(0, n - 1)} vòng.`;
      case 'round':
        return `Vòng ${f.round}: nới lỏng mỗi cạnh một lần, theo thứ tự trong danh sách.`;
      case 'improve':
        return `${head} ${sum} < ${show(f.before)}. Giảm d[${v}] và đặt parent[${v}] = ${u}.`;
      case 'keep':
        return f.dist[f.current] === Infinity
          ? `${head} d[${u}] vẫn là ∞, nên vòng này chưa có gì để làm.`
          : `${head} ${sum} không nhỏ hơn ${show(f.before)}. Giữ nguyên d[${v}].`;
      case 'early':
        return `Vòng ${f.round} không đổi gì, nên vòng sau cũng vậy. Dừng sớm: các nhãn đã là cuối cùng và không đến được chu trình âm nào.`;
      case 'check':
        return `Đã chạy đủ ${n - 1} vòng mà vòng cuối vẫn đổi một nhãn. Vòng thứ V xét lại mọi cạnh một lần nữa mà không thay đổi gì.`;
      case 'ok':
        return `${head} ${sum} không nhỏ hơn ${show(f.before)}. Ổn.`;
      case 'cycle':
        return `${head} ${sum} < ${show(f.before)}: sau V − 1 vòng vẫn còn cạnh nới lỏng được, nên từ đỉnh nguồn đến được một chu trình âm. Lần theo các liên kết cha, ta tìm ra ${f.cycle.map((i) => names[i]).join(' → ')} → ${names[f.cycle[0]] ?? ''}.`;
      case 'done':
        return f.table.length === n + 1
          ? 'Vòng thứ V không tìm thấy cạnh nào để nới lỏng: các nhãn là khoảng cách ngắn nhất, và không đến được chu trình âm nào.'
          : `Xong sau ${f.round} vòng và ${f.relaxations} lần xét cạnh: các nhãn là khoảng cách ngắn nhất.`;
    }
  },
  takeaways: [
    'Thuật toán Bellman-Ford nới lỏng mọi cạnh trong mỗi vòng. Sau vòng i, mọi đỉnh có đường đi ngắn nhất dùng tối đa i cạnh đều có nhãn chính xác. Một đường đi ngắn nhất đi qua mỗi đỉnh tối đa một lần, nên có tối đa V − 1 cạnh, và V − 1 vòng là đủ.',
    'Trọng số cạnh âm không sao, vì không nhãn nào bị coi là cuối cùng quá sớm, khác với thuật toán Dijkstra.',
    'Vòng thứ V là vòng kiểm tra chu trình âm: nếu còn cạnh nào nới lỏng được, từ đỉnh nguồn đến được một chu trình âm, và đường đi ngắn nhất qua nó không tồn tại (mỗi vòng quanh lại rẻ hơn). Các liên kết cha dẫn tới chu trình đó.',
    'Một vòng không đổi gì sẽ kết thúc lần chạy sớm. Thứ tự cạnh quyết định cần bao nhiêu vòng; kết quả đường đi ngắn nhất không phụ thuộc vào nó.',
    'Thử xem: chuyển qua lại giữa “Có cạnh âm, không có chu trình âm” và “Cùng đồ thị, thứ tự cạnh tốt” để so số vòng, rồi đặt D → A bằng 0 và xem vòng thứ V báo chu trình.',
  ],
  complexityHead: ['Trường hợp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian, xấu nhất',
      'O(V·E)',
      'V − 1 vòng cộng vòng kiểm tra, mỗi vòng nới lỏng cả E cạnh một lần.',
    ],
    [
      'Thời gian, tốt nhất',
      'O(E)',
      'Có dừng sớm, một thứ tự cạnh đi theo các đường đi ngắn nhất xong trong một vòng cộng một vòng không đổi gì.',
    ],
    ['Bộ nhớ', 'O(V)', 'Mỗi đỉnh một nhãn và một cha (bảng chỉ dùng cho bài học).'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với “Có cạnh âm, không có chu trình âm” từ S, thuật toán Bellman-Ford dừng sớm ở vòng nào (vòng đầu tiên không có thay đổi)?',
      answer: 3,
      tolerance: 0,
      hints: [
        'Vòng 1 đặt C bằng 11 qua A, nhưng B → C được nới lỏng trước khi B có nhãn.',
        'Vòng 2 giảm C xuống 5 qua B. Vòng 3 thì sao?',
      ],
      solution:
        'Vòng 1 điền A 6, B 7, C 11, D 4. Vòng 2 giảm C xuống 5 qua B → C. Vòng 3 không đổi gì, nên lần chạy dừng sau vòng 3.',
    },
    {
      type: 'number',
      prompt: 'Giờ chọn “Cùng đồ thị, thứ tự cạnh tốt”. Nó dừng sớm ở vòng nào?',
      answer: 2,
      tolerance: 0,
      hints: ['Theo thứ tự này, B → C đứng sau S → B.'],
      solution:
        'Mỗi cạnh đều đứng sau các cạnh đặt nhãn cho đỉnh đầu của nó, nên vòng 1 tìm ra mọi nhãn cuối cùng và vòng 2 không đổi gì.',
    },
    {
      type: 'number',
      prompt:
        'Trên đồ thị ban đầu, trọng số nguyên nhỏ nhất của D → A là bao nhiêu để mọi chu trình đều không âm?',
      answer: 1,
      tolerance: 0,
      hints: [
        'Liệt kê các chu trình đi qua D → A: A → B → D → A, A → B → C → D → A và A → C → D → A.',
        'A → B → D → A có trọng số 2 − 3 + w = w − 1.',
      ],
      solution:
        'Chu trình nhẹ nhất là A → B → D → A với trọng số w − 1, âm đúng khi w < 1. Các chu trình còn lại có trọng số w + 3 và w + 8. Vậy w = 1 là trọng số an toàn nhỏ nhất.',
    },
    {
      type: 'text',
      prompt:
        'Chọn “Chu trình âm” rồi chạy đến bước cuối. Vòng thứ V báo chu trình nào? Gõ các đỉnh theo thứ tự, bắt đầu từ A.',
      accept: ['A, B, D', 'A B D', 'ABD', 'A → B → D', 'A → B → D → A', 'A->B->D', 'A->B->D->A'],
      hints: ['Ở đó D → A có trọng số −1.', 'Tổng trọng số của nó là 2 − 3 − 1 = −2.'],
      solution:
        'B → C vẫn còn nới lỏng được ở vòng thứ V. Lần theo cha từ C, ta đến chu trình A → B → D → A, trọng số 2 − 3 − 1 = −2.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao V − 1 vòng là đủ khi không có chu trình âm?',
      options: [
        'Mỗi vòng chốt thêm một đỉnh, nhãn nhỏ nhất trước.',
        'Một đường đi ngắn nhất có tối đa V − 1 cạnh, và vòng i làm chính xác mọi nhãn có đường đi ngắn nhất dùng tối đa i cạnh.',
        'Mỗi cạnh chỉ giảm được một nhãn tối đa một lần.',
        'Sau V − 1 vòng, các nhãn đều không âm.',
      ],
      answer: 1,
      hints: ['Hãy nghĩ về các cạnh của một đường đi ngắn nhất s → … → v, theo thứ tự.'],
      solution:
        'Vòng 1 nới lỏng cạnh thứ nhất của đường đi (cùng các cạnh khác), vòng 2 nới lỏng cạnh thứ hai, và cứ thế. Đường đi ngắn nhất không lặp lại đỉnh, nên có tối đa V − 1 cạnh.',
    },
  ],
  nextTeaser:
    'Nếu cần khoảng cách giữa mọi cặp đỉnh chứ không chỉ từ một đỉnh nguồn thì sao? Bài sau là thuật toán Floyd-Warshall, chỉ với ba vòng lặp lồng nhau.',
};
