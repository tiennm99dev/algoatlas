/** @typedef {import('$lib/algo-engine/dijkstra-general.js').DijkstraFrame} DijkstraFrame */
/** @typedef {import('$lib/algo-engine/dijkstra-general.js').HeapEntry} HeapEntry */

/** @param {number} d */
const show = (d) => (d === Infinity ? '∞' : String(d));

export const vi = {
  slug: 'dijkstra-general',
  topic: 'shortest-paths',
  level: 'Trung bình',
  title: 'Thuật toán Dijkstra trên đồ thị tổng quát',
  intro:
    'Trên đồ thị có trọng số cạnh không âm, thuật toán Dijkstra chốt các đỉnh theo thứ tự khoảng cách tăng dần từ đỉnh nguồn. Một heap nhỏ nhất dạng nhị phân tìm đỉnh gần nhất tiếp theo trong O(log V). Thay vì sửa một mục nằm trong heap, cách cài đặt thường gặp đẩy vào một mục mới và để dành bỏ qua mục cũ về sau: đó là xoá lười.',
  summary:
    'Chạy thuật toán Dijkstra bằng heap nhị phân trên đồ thị do bạn vẽ, và xem xoá lười để lại rồi bỏ qua các mục cũ trong heap.',
  instruction:
    'Chọn đỉnh nguồn rồi chạy từng bước. Hãy để ý heap: mỗi lần tìm được đường ngắn hơn, ta đẩy vào một mục (khoảng cách, đỉnh) mới, và mục cũ của đỉnh đó thành bản cũ. Vẽ cạnh bằng công cụ Nối, hoặc đổi trọng số trong bảng, để tạo thêm bản cũ.',
  sourceLabel: 'Đỉnh nguồn',
  resetGraph: 'Đặt lại đồ thị',
  graphAria: 'Đồ thị vô hướng có trọng số. Mỗi đỉnh hiện nhãn khoảng cách d.',
  edgesTitle: 'Trọng số các cạnh',
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
  /** @param {number} max */
  badWeight: (max) => `Trọng số phải là số nguyên từ 0 đến ${max}. Trọng số cũ được giữ nguyên.`,
  heapTitle: 'Heap nhị phân (dạng cây)',
  /** @param {HeapEntry[]} heap @param {string[]} names */
  heapAria: (heap, names) =>
    heap.length
      ? `Heap nhỏ nhất gồm ${heap.length} mục, theo thứ tự mảng: ${heap.map((e) => `(${e.d}, ${names[e.v]})`).join(', ')}.`
      : 'Heap đang rỗng.',
  heapArrayTitle: 'Mảng của heap (ô 0 là nhỏ nhất)',
  orderTitle: 'Thứ tự chốt',
  emptyText: 'rỗng',
  hotLabel: 'mới nhất',
  staleTag: 'cũ',
  /** @param {HeapEntry} e @param {string[]} names */
  entry: (e, names) => `(${e.d}, ${names[e.v]})`,
  stats: {
    pushes: 'Số lần đẩy vào',
    pops: 'Số lần lấy ra',
    stale: 'Số bản cũ đã bỏ qua',
    relaxations: 'Số cạnh đã xét',
    maxHeap: 'Kích thước heap lớn nhất',
  },
  legend: {
    current: 'Đang chốt hoặc mở rộng',
    neighbor: 'Đỉnh kề đang xét',
    queued: 'Trong heap, chưa chốt',
    settled: 'Đã chốt (khoảng cách cuối cùng)',
    pushed: 'Mục vừa đẩy vào',
    stale: 'Mục cũ trong heap',
    edgeNow: 'Cạnh đang xét',
    tree: 'Cạnh nối với cha',
    order: 'Thứ tự chốt',
  },
  states: {
    source: 'đỉnh nguồn',
    current: 'đang xét',
    neighbor: 'đỉnh kề đang xét',
    queued: 'trong heap',
    settled: 'đã chốt',
  },
  /** @param {number} d */
  dNote: (d) => `d ${show(d)}`,
  /** @param {string} name @param {number} d @param {string} state */
  vertexLabel: (name, d, state) =>
    [`Đỉnh ${name}`, `d = ${show(d)}`, state].filter(Boolean).join(', '),
  /**
   * @param {DijkstraFrame} f
   * @param {string[]} names
   */
  describe(f, names) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const p = f.popped ? `(${f.popped.d}, ${u})` : '';
    switch (f.kind) {
      case 'start':
        return f.heap.length
          ? `Đặt dist[${names[f.heap[0].v]}] = 0 và mọi nhãn khác là ∞. Đẩy (0, ${names[f.heap[0].v]}) vào heap.`
          : 'Đồ thị chưa có đỉnh nào.';
      case 'stale':
        return `Lấy ${p} ra, nhưng dist[${u}] đã là ${show(f.dist[f.current])}: mục này là bản cũ, còn sót lại khi ta tìm được đường ngắn hơn. Bỏ qua nó.`;
      case 'settle':
        return `Lấy ${p} ra, mục nhỏ nhất, và nó khớp với dist[${u}]. Chốt ${u}: không đường nào về sau ngắn hơn được, vì mọi mục khác đều từ ${f.popped?.d ?? 0} trở lên và trọng số không âm.`;
      case 'improve':
        return `Cạnh ${u} — ${v} (trọng số ${f.weight}): ${show(f.dist[f.current])} + ${f.weight} = ${f.dist[f.neighbor]} < ${show(f.before)}. Giảm dist[${v}] và đẩy (${f.dist[f.neighbor]}, ${v}) vào${f.before === Infinity ? '.' : `; mục cũ (${f.before}, ${v}) vẫn nằm trong heap, giờ thành bản cũ.`}`;
      case 'keep':
        return f.settled[f.neighbor]
          ? `Cạnh ${u} — ${v} (trọng số ${f.weight}): ${v} đã được chốt, nên không có gì thay đổi.`
          : `Cạnh ${u} — ${v} (trọng số ${f.weight}): ${show(f.dist[f.current])} + ${f.weight} = ${show(f.dist[f.current] + f.weight)} không nhỏ hơn ${show(f.before)}. Giữ nguyên dist[${v}].`;
      case 'done': {
        const missed = f.settled.filter((s) => !s).length;
        return `Heap đã rỗng. Đã chốt ${f.order.length} đỉnh với ${f.pushes} lần đẩy vào và ${f.pops} lần lấy ra, trong đó ${f.stale} lần là bản cũ.${missed ? ` ${missed} đỉnh không đến được vẫn giữ ∞.` : ''}`;
      }
    }
  },
  takeaways: [
    'Thuật toán Dijkstra chốt đỉnh chưa chốt có nhãn nhỏ nhất. Với trọng số không âm, không đường nào về sau rẻ hơn được, nên nhãn của nó là cuối cùng ngay khi được lấy ra.',
    'Một heap nhỏ nhất chứa các cặp (khoảng cách, đỉnh) cho ta đỉnh đó trong O(log V). Mỗi lần nới lỏng thành công đẩy vào một mục, nên có tối đa E + 1 lần đẩy vào và chừng ấy lần lấy ra. Trên đồ thị vô hướng, một cạnh chỉ nới lỏng thành công được từ một đầu: khi mở rộng đầu thứ hai, đầu thứ nhất đã được chốt với nhãn không lớn hơn.',
    'Xoá lười: thay vì thao tác giảm khoá, ta đẩy vào một mục mới và để nguyên mục cũ. Khi một mục lấy ra có khoảng cách lớn hơn nhãn của đỉnh, đó là bản cũ và được bỏ qua.',
    'Tổng chi phí là O((V + E) log V). Với đồ thị dày, quét một mảng để tìm nhỏ nhất cho O(V²), có thể còn tốt hơn.',
    'Thử xem: đổi trọng số của A — C từ 1 thành 5, xem còn lại bao nhiêu bản cũ, rồi chọn một đỉnh nguồn khác.',
  ],
  complexityHead: ['Cách cài đặt', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Heap nhị phân, xoá lười',
      'O((V + E) log V)',
      'Mỗi đỉnh được lấy ra và chốt một lần; mỗi cạnh có thể đẩy vào một mục, và mỗi lần đẩy vào hay lấy ra tốn O(log E) = O(log V).',
    ],
    [
      'Quét mảng, không dùng heap',
      'O(V²)',
      'V lần, mỗi lần quét mọi nhãn để tìm đỉnh chưa chốt nhỏ nhất; tốt hơn khi E gần bằng V².',
    ],
    ['Bộ nhớ', 'O(V + E)', 'Nhãn và cha, cộng với tối đa một mục heap cho mỗi lần nới lỏng.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trên đồ thị ban đầu với đỉnh nguồn A, khoảng cách cuối cùng đến F là bao nhiêu?',
      answer: 13,
      tolerance: 0,
      hints: ['Chạy đến bước cuối rồi đọc nhãn của F.', 'Đường đi là A → C → B → D → E → F.'],
      solution: 'A → C → B → D → E → F có trọng số 1 + 2 + 5 + 2 + 3 = 13.',
    },
    {
      type: 'text',
      prompt: 'Trên đồ thị ban đầu với đỉnh nguồn A, các đỉnh được chốt theo thứ tự nào?',
      accept: ['A, C, B, D, E, F', 'ACBDEF', 'A C B D E F'],
      hints: ['Các đỉnh được chốt theo thứ tự khoảng cách cuối cùng: A 0, C 1, B 3, …'],
      solution:
        'Khoảng cách cuối cùng là A 0, C 1, B 3, D 8, E 10, F 13, và thuật toán Dijkstra chốt theo khoảng cách tăng dần: A, C, B, D, E, F.',
    },
    {
      type: 'number',
      prompt: 'Lần chạy từ A bỏ qua bao nhiêu bản cũ?',
      answer: 4,
      unit: 'mục',
      tolerance: 0,
      hints: ['Mỗi khi một đỉnh đã nằm trong heap nhận được nhãn ngắn hơn, một mục thành bản cũ.'],
      solution:
        'B giảm từ 4 xuống 3, D từ 9 xuống 8, E từ 11 xuống 10, và F từ 14 xuống 13. Mỗi lần để lại một mục cũ, nên có 4 lần lấy ra bản cũ.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao bản dùng heap có độ phức tạp O((V + E) log V)?',
      options: [
        'Mỗi đỉnh được đẩy vào đúng một lần.',
        'Mỗi lần nới lỏng đẩy vào tối đa một mục, và mỗi lần đẩy vào hay lấy ra tốn O(log V).',
        'Heap không bao giờ chứa quá log V mục.',
        'Mỗi cạnh được nới lỏng log V lần.',
      ],
      answer: 1,
      hints: ['Đếm số thao tác trên heap, rồi nhân với chi phí của một thao tác.'],
      solution:
        'Có tối đa E + 1 lần đẩy vào và chừng ấy lần lấy ra. Một thao tác heap tốn O(log(kích thước heap)) = O(log E) = O(log V), vì E < V². Việc chốt đỉnh và duyệt cạnh tốn thêm O(V + E).',
    },
    {
      type: 'choice',
      prompt: 'Nếu có cạnh trọng số âm thì điều gì hỏng?',
      options: [
        'Không sao cả: thuật toán Dijkstra xử lí được mọi trọng số.',
        'Heap không còn so sánh được các mục.',
        'Một đỉnh đã chốt về sau có thể đến được rẻ hơn, nên nhãn “cuối cùng” của nó có thể sai.',
        'Thuật toán không bao giờ dừng.',
      ],
      answer: 2,
      hints: [
        'Việc chốt đỉnh dựa trên giả thiết: kéo dài một đường đi không bao giờ làm nó rẻ hơn.',
      ],
      solution:
        'Thuật toán Dijkstra cố định nhãn của một đỉnh khi lấy nó ra, tin rằng mọi đường khác đều dài ít nhất bằng. Một cạnh âm có thể khiến một đường trông dài hơn lại rẻ hơn sau khi đỉnh đã chốt. Thuật toán Bellman-Ford xử lí được trọng số âm.',
    },
  ],
  nextTeaser:
    'Khi trọng số chỉ là 0 hoặc 1, hay khi đồ thị không có chu trình, ta không cần heap. Bài sau: BFS 0-1 và đường đi ngắn nhất trên DAG.',
};
