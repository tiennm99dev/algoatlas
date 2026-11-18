/** @typedef {import('$lib/algo-engine/zero-one-bfs-dag.js').ZeroOneFrame} ZeroOneFrame */
/** @typedef {import('$lib/algo-engine/zero-one-bfs-dag.js').DagFrame} DagFrame */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : d === -Infinity ? '−∞' : String(d).replace('-', '−'));

/** A summand: a negative number goes in brackets, as in 1 + (−2). @param {number} d */
const term = (d) => (d < 0 && d !== -Infinity ? `(${show(d)})` : show(d));

export const vi = {
  slug: 'zero-one-bfs-dag',
  topic: 'shortest-paths',
  level: 'Trung bình',
  title: 'BFS 0-1 và đường đi ngắn nhất trên DAG',
  intro:
    'Thuật toán Dijkstra cần heap vì nó luôn phải tìm đỉnh chưa chốt gần nhất. Có hai trường hợp đặc biệt hay gặp cho ta thứ tự đó miễn phí, trong O(V + E). Khi mọi trọng số là 0 hoặc 1, một hàng đợi hai đầu (deque) giữ các đỉnh theo thứ tự khoảng cách. Khi đồ thị là đồ thị có hướng không chu trình (DAG), nới lỏng các đỉnh theo thứ tự tô-pô vẫn đúng kể cả khi có trọng số âm, và cùng một lượt duyệt đó tìm được cả đường đi dài nhất.',
  summary:
    'Chạy từng bước BFS 0-1 với hàng đợi hai đầu, và đường đi ngắn nhất, dài nhất trên DAG theo thứ tự tô-pô.',
  instruction:
    'Chọn một chế độ rồi chạy từng bước. Ở BFS 0-1, hãy xem cạnh trọng số 0 đưa đỉnh đích của nó lên đầu hàng đợi hai đầu, còn cạnh trọng số 1 đưa xuống cuối hàng. Ở các chế độ DAG, hãy xem lượt duyệt đi theo thứ tự tô-pô. Bật tắt hoặc gõ trọng số cạnh, hay đổi đỉnh nguồn, rồi chạy lại.',
  modeLabel: 'Chế độ',
  modes: { zeroOne: 'BFS 0-1', short: 'DAG, ngắn nhất', long: 'DAG, dài nhất' },
  sourceLabel: 'Đỉnh nguồn',
  resetWeights: 'Đặt lại trọng số',
  graphAria: {
    zeroOne: 'Đồ thị có hướng với trọng số cạnh 0 và 1. Mỗi đỉnh hiện nhãn khoảng cách d.',
    dag: 'Đồ thị có hướng không chu trình, có trọng số. Mỗi đỉnh hiện nhãn khoảng cách d.',
  },
  edgesTitle: 'Trọng số các cạnh',
  /** @param {number} w */
  toggleText: (w) => `w = ${w}`,
  /** @param {string} name @param {number} w */
  toggleAria: (name, w) => `Cạnh ${name} có trọng số ${w}. Bấm để đổi thành ${1 - w}.`,
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  /** @param {number} max */
  badWeight: (max) =>
    `Trọng số phải là số nguyên từ −${max} đến ${max}. Trọng số cũ được giữ nguyên.`,
  dequeTitle: 'Hàng đợi hai đầu (đầu hàng bên trái)',
  /** @param {string[]} items */
  dequeAria: (items) =>
    items.length
      ? `Hàng đợi hai đầu, từ đầu đến cuối: ${items.join(', ')}.`
      : 'Hàng đợi hai đầu đang rỗng.',
  staleTag: 'cũ',
  orderTitle: 'Thứ tự tô-pô',
  orderAria: 'Thứ tự tô-pô; lượt duyệt nới lỏng các cạnh ra của từng đỉnh từ trái sang phải.',
  pointer: 'u',
  stats: {
    pops: 'Số lần lấy ra',
    pushFront: 'Đẩy vào đầu hàng',
    pushBack: 'Đẩy vào cuối hàng',
    relaxations: 'Số cạnh đã xét',
    updates: 'Số nhãn đã đổi',
  },
  legend: {
    current: 'Đang mở rộng',
    neighbor: 'Đỉnh kề đang xét',
    queued: 'Trong hàng đợi hai đầu',
    done: 'Xong (nhãn cuối cùng)',
    passed: 'Đã đi qua trong thứ tự',
    pushed: 'Mục vừa đẩy vào',
    stale: 'Mục cũ',
    edgeNow: 'Cạnh đang xét',
    tree: 'Cạnh nối với cha',
  },
  states: {
    source: 'đỉnh nguồn',
    current: 'đang xét',
    neighbor: 'đỉnh kề đang xét',
    queued: 'trong hàng đợi hai đầu',
    done: 'đã xong',
    passed: 'đã đi qua',
  },
  /** @param {number} d */
  dNote: (d) => `d ${show(d)}`,
  /** @param {string} name @param {number} d @param {string} state */
  vertexLabel: (name, d, state) =>
    [`Đỉnh ${name}`, `d = ${show(d)}`, state].filter(Boolean).join(', '),
  /**
   * @param {ZeroOneFrame} f
   * @param {string[]} names
   */
  describeZeroOne(f, names) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    switch (f.kind) {
      case 'start':
        return f.deque.length
          ? `Đặt d[${names[f.deque[0].v]}] = 0, mọi nhãn khác là ∞, và đưa ${names[f.deque[0].v]} vào hàng đợi hai đầu.`
          : 'Đỉnh nguồn không nằm trong đồ thị.';
      case 'pop':
        return `Lấy ${u} ra từ đầu hàng. Nhãn ${show(f.dist[f.current])} của nó nhỏ nhất trong hàng đợi, nên đã là cuối cùng: đánh dấu ${u} đã xong.`;
      case 'skip':
        return `Lấy ${u} ra lần nữa: bản này được đẩy vào trước khi ta tìm được đường ngắn hơn, và ${u} đã xong. Bỏ qua.`;
      case 'improve':
        return f.front
          ? `Cạnh ${u} → ${v} có trọng số 0: d[${v}] = ${show(f.dist[f.current])} + 0 = ${f.dist[f.neighbor]} < ${show(f.before)}. Cùng khoảng cách với ${u}, nên đẩy ${v} vào đầu hàng.`
          : `Cạnh ${u} → ${v} có trọng số 1: d[${v}] = ${show(f.dist[f.current])} + 1 = ${f.dist[f.neighbor]} < ${show(f.before)}. Hơn ${u} một đơn vị, nên đẩy ${v} vào cuối hàng.`;
      case 'keep':
        return `Cạnh ${u} → ${v} (trọng số ${f.weight}): ${show(f.dist[f.current])} + ${f.weight} = ${show(f.dist[f.current] + f.weight)} không nhỏ hơn d[${v}] = ${show(f.before)}. Giữ nguyên.`;
      case 'done': {
        const missed = f.dist.filter((d) => d === Infinity).length;
        return `Hàng đợi hai đầu đã rỗng sau ${f.pops} lần lấy ra, ${f.pushFront} lần đẩy vào đầu hàng và ${f.pushBack} lần đẩy vào cuối hàng. Mọi nhãn đều đã là cuối cùng.${missed ? ` ${missed} đỉnh không đến được vẫn giữ ∞.` : ''}`;
      }
    }
  },
  /**
   * @param {DagFrame} f
   * @param {string[]} names
   * @param {boolean} longest
   */
  describeDag(f, names, longest) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const none = longest ? '−∞' : '∞';
    const sum = `${show(f.dist[f.current])} + ${term(f.weight)} = ${show(f.dist[f.current] + f.weight)}`;
    switch (f.kind) {
      case 'start':
        return `Sắp xếp tô-pô DAG: ${f.order.map((i) => names[i]).join(', ')}. Theo thứ tự này, mọi cạnh đều hướng từ trái sang phải.`;
      case 'init':
        return `Đặt nhãn của đỉnh nguồn là 0 và mọi nhãn khác là ${none}.`;
      case 'skip':
        return `${u} vẫn có d = ${none}: từ đỉnh nguồn không đến được nó, nên các cạnh của nó không giúp gì. Đi tiếp.`;
      case 'take':
        return `Xét ${u}. Mọi cạnh đi vào ${u} đều xuất phát từ một đỉnh đứng trước trong thứ tự, nên d[${u}] = ${show(f.dist[f.current])} đã là cuối cùng. Nới lỏng các cạnh ra của nó.`;
      case 'improve':
        return longest
          ? `Cạnh ${u} → ${v} (trọng số ${show(f.weight)}): ${sum} > ${show(f.before)}. Đường dài hơn, nên tăng d[${v}].`
          : `Cạnh ${u} → ${v} (trọng số ${show(f.weight)}): ${sum} < ${show(f.before)}. Giảm d[${v}].`;
      case 'keep':
        return `Cạnh ${u} → ${v} (trọng số ${show(f.weight)}): ${sum} không ${longest ? 'lớn' : 'nhỏ'} hơn d[${v}] = ${show(f.before)}. Giữ nguyên.`;
      case 'done':
        return `Một lượt duyệt theo thứ tự đã nới lỏng ${f.relaxations} cạnh, mỗi cạnh một lần, và mọi nhãn đều đã là cuối cùng: trọng số đường đi ${longest ? 'dài' : 'ngắn'} nhất từ đỉnh nguồn.`;
      case 'cycle':
        return 'Đồ thị này có chu trình, nên không có thứ tự tô-pô.';
    }
  },
  takeaways: [
    'BFS 0-1: khi mọi trọng số là 0 hoặc 1, đẩy đỉnh đích của cạnh 0 vào đầu hàng đợi hai đầu và đỉnh đích của cạnh 1 vào cuối hàng. Hàng đợi luôn chỉ chứa nhãn d và d + 1 theo thứ tự, nên đầu hàng luôn là một đỉnh gần nhất, như trong thuật toán Dijkstra, với chi phí O(1) cho mỗi lần đẩy vào.',
    'Một đỉnh có thể bị đẩy vào hai lần khi về sau một cạnh 0 thắng một cạnh 1 trước đó. Bản đến sau bị bỏ qua, giống hệt một mục cũ trong heap.',
    'Đường đi ngắn nhất trên DAG: nới lỏng các cạnh ra của từng đỉnh theo thứ tự tô-pô (topological sort). Khi đến lượt u, mọi cạnh đi vào u đã được nới lỏng, nên d[u] đã là cuối cùng. Trọng số âm không sao, vì DAG hoàn toàn không có chu trình.',
    'Tìm đường đi dài nhất trên đồ thị tổng quát rất khó, nhưng trên DAG cùng lượt duyệt đó làm được: khởi đầu bằng −∞ và giữ tổng lớn hơn. Đó chính là đường găng của một lịch công việc.',
    'Thử xem: ở BFS 0-1, đổi E → T thành trọng số 1 và thấy T chỉ có một mục thay vì hai; ở chế độ DAG dài nhất, so sánh đường đến Z với đường ngắn nhất.',
  ],
  complexityHead: ['Phương pháp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'BFS 0-1',
      'O(V + E)',
      'Mỗi đỉnh được mở rộng một lần và mỗi cạnh được xét một lần; đẩy vào và lấy ra ở hàng đợi hai đầu tốn O(1).',
    ],
    [
      'DAG, ngắn nhất hoặc dài nhất',
      'O(V + E)',
      'Sắp xếp tô-pô trong O(V + E), rồi một lượt duyệt nới lỏng mỗi cạnh đúng một lần.',
    ],
    [
      'Bộ nhớ',
      'O(V + E)',
      'Nhãn và cha, cộng với hàng đợi hai đầu chứa tối đa một mục cho mỗi lần nới lỏng thành công, hoặc bán bậc vào và thứ tự của phép sắp xếp tô-pô.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chạy BFS 0-1 trên đồ thị ban đầu từ S, T được lấy ra khỏi hàng đợi hai đầu bao nhiêu lần?',
      answer: 2,
      unit: 'lần',
      tolerance: 0,
      hints: [
        'T được chạm tới lần đầu từ D qua một cạnh 1, sau đó từ E qua một cạnh 0.',
        'Mỗi lần cải thiện đẩy vào một mục, và mỗi mục được lấy ra một lần.',
      ],
      solution:
        'D → T đẩy T vào cuối hàng với d = 2. Sau đó E → T, trọng số 0, giảm d[T] xuống 1 và đẩy T vào đầu hàng. T được lấy ra hai lần: lần đầu được đánh dấu xong với d = 1, lần sau là bản cũ và bị bỏ qua.',
    },
    {
      type: 'number',
      prompt: 'Chạy BFS 0-1 trên đồ thị ban đầu từ S, d[T] bằng bao nhiêu?',
      answer: 1,
      tolerance: 0,
      hints: ['Tìm một đường đi từ S đến T dùng càng ít cạnh 1 càng tốt.'],
      solution:
        'S → B → C → E → T có các trọng số 0, 0, 1, 0, nên d[T] = 1. Không có đường đi nào tránh được mọi cạnh 1.',
    },
    {
      type: 'number',
      prompt: 'Ở chế độ DAG ngắn nhất từ S với trọng số ban đầu, d[Z] bằng bao nhiêu?',
      answer: 3,
      tolerance: 0,
      hints: ['Các cạnh âm X → Y và Y → Z có ích.', 'Thử S → X → Y → Z.'],
      solution:
        'S → X → Y → Z có trọng số 6 − 1 − 2 = 3, nhỏ hơn S → T → Z (2 + 2 = 4). Lượt duyệt tìm ra nó vì X, Y và Z được nới lỏng theo thứ tự tô-pô.',
    },
    {
      type: 'number',
      prompt: 'Chuyển sang chế độ DAG dài nhất từ S với trọng số ban đầu. d[Z] bằng bao nhiêu?',
      answer: 10,
      tolerance: 0,
      hints: ['Đến X tốt nhất là qua T: 2 + 7 = 9.'],
      solution:
        'S → T → X → Z có trọng số 2 + 7 + 1 = 10. Các đường khác đến Z nhẹ hơn: S → T → Z là 4 và S → T → X → Y → Z là 6.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao phương pháp trên DAG xử lí được trọng số âm còn thuật toán Dijkstra thì không?',
      options: [
        'Nó kiểm tra lần lượt từng đường đi.',
        'Nó chỉ chốt một đỉnh sau khi mọi cạnh đi vào đỉnh đó đã được nới lỏng, điều mà thứ tự tô-pô bảo đảm.',
        'Nó cộng một hằng số để mọi trọng số đều dương.',
        'DAG không thể có trọng số âm.',
      ],
      answer: 1,
      hints: ['Hãy hỏi: đến lúc xét u thì các cạnh đi vào u đã ra sao?'],
      solution:
        'Theo thứ tự tô-pô, mọi đỉnh đứng trước u đều được xét trước, nên mọi cạnh đi vào u đều được nới lỏng trước khi dùng u. Còn thuật toán Dijkstra chốt theo nhãn nhỏ nhất, và một cạnh âm đến sau có thể phá vỡ điều đó.',
    },
  ],
  nextTeaser:
    'Khi đồ thị vừa có trọng số âm vừa có chu trình, cả hai mẹo trên đều không dùng được. Bài sau là thuật toán Bellman-Ford, xử lí được trường hợp đó.',
};
