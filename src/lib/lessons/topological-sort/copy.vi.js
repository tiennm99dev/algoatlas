/** @typedef {import('$lib/algo-engine/topological-sort.js').TopoFrame} TopoFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);
/** @param {string[]} names @param {number[]} list */
const join = (names, list) => list.map((i) => nm(names, i)).join(', ');

export const vi = {
  slug: 'topological-sort',
  topic: 'graphs',
  level: 'Trung bình',
  title: 'Sắp xếp tô-pô',
  intro:
    'Một đồ thị có hướng không chu trình (DAG) có thể mô tả các công việc và thứ tự phụ thuộc giữa chúng: cạnh u → v nói rằng u phải làm trước v. Một thứ tự tô-pô liệt kê mọi đỉnh sao cho mọi cạnh đều chỉ về phía sau. Thứ tự ấy tồn tại đúng khi đồ thị không có chu trình có hướng, và hai thuật toán kinh điển tìm ra nó trong O(V + E): thuật toán Kahn và thứ tự hoàn tất của DFS đảo ngược.',
  summary:
    'Sắp thứ tự các công việc trong một đồ thị phụ thuộc bằng thuật toán Kahn hoặc bằng thứ tự hoàn tất của DFS đảo ngược, và xem cả hai cách phát hiện chu trình ra sao.',
  instruction:
    'Chọn Kahn hoặc DFS rồi chạy từng bước. Kahn lần lượt gỡ ra một việc có bậc vào đã giảm về 0; DFS lần theo các cạnh và chỉ ghi một việc xuống khi mọi việc phía sau nó đã xong. Dùng Nối để thêm một cạnh như G → A và xem cả hai cách báo có chu trình.',
  algoLabel: 'Cách làm',
  algos: { kahn: 'Kahn (bậc vào)', dfs: 'Thứ tự hoàn tất của DFS' },
  resetGraph: 'Đặt lại đồ thị',
  graphAria: 'Đồ thị phụ thuộc giữa các việc; cạnh từ u đến v nghĩa là u làm trước v.',
  tasksTitle: 'Các việc',
  /** Task names for the starting graph, by vertex id. */
  tasks: [
    'mua thực phẩm',
    'rửa rau',
    'thái rau',
    'đun nước',
    'luộc mì',
    'làm nước sốt',
    'dọn bữa tối',
  ],
  queueLabel: 'Hàng đợi (đầu hàng trước)',
  stackLabel: 'Ngăn xếp lời gọi (đỉnh trước)',
  orderLabel: 'Thứ tự đến lúc này',
  finishLabel: 'Đã hoàn tất (trước đến sau)',
  resultLabel: 'Thứ tự tô-pô',
  emptyText: 'rỗng',
  hotLabel: 'mới nhất',
  stats: {
    placed: 'Số đỉnh đã xếp',
    edges: 'Số cạnh đã xét',
    backward: 'Số cạnh chỉ ngược',
  },
  legend: {
    current: 'Đang xử lí',
    pending: 'Trong hàng đợi hoặc đang thăm',
    done: 'Đã xếp hoặc đã hoàn tất',
    cycle: 'Chu trình',
    stuck: 'Không bao giờ được xếp',
    edgeDone: 'Cạnh đã dùng',
  },
  states: {
    current: 'đang xét',
    queued: 'trong hàng đợi',
    inProgress: 'đang thăm',
    placed: 'đã xếp',
    finished: 'đã hoàn tất',
    cycle: 'trên chu trình',
    stuck: 'không được xếp',
  },
  /** @param {number} d */
  inNote: (d) => `bậc vào ${d}`,
  /** @param {number} k */
  finishNote: (k) => `xong thứ ${k}`,
  /** @param {string} name @param {string} state @param {string} note */
  vertexLabel: (name, state, note) => [`Việc ${name}`, state, note].filter(Boolean).join(', '),
  /**
   * @param {TopoFrame} f
   * @param {string[]} names
   * @param {'kahn' | 'dfs'} algo
   * @param {{from: number, to: number} | null} edge  The frame's edge, as vertex indices.
   */
  describe(f, names, algo, edge) {
    const u = nm(names, f.current);
    const v = edge ? nm(names, edge.to) : '';
    switch (f.kind) {
      case 'start':
        return algo === 'kahn'
          ? `Đếm số cạnh đi vào mỗi việc: ${names.map((n, i) => `${n} ${f.indeg[i]}`).join(', ')}.`
          : 'Ban đầu chưa việc nào được thăm. Ta thăm chúng theo thứ tự chữ cái.';
      case 'seed':
        return f.pending.length
          ? `Những việc có bậc vào 0 không phải chờ việc nào: đưa ${join(names, f.pending)} vào hàng đợi.`
          : 'Không việc nào có bậc vào 0, nên việc nào cũng chờ một việc khác: chắc chắn có chu trình.';
      case 'take':
        return `Lấy ${u} ra khỏi hàng đợi và xếp vào vị trí ${f.order.length}.`;
      case 'relax':
        return f.ready
          ? `Gỡ cạnh ${u} → ${v}: bậc vào của ${v} giờ bằng 0, nên đưa ${v} vào hàng đợi.`
          : `Gỡ cạnh ${u} → ${v}: ${v} vẫn còn chờ ${edge ? f.indeg[edge.to] : 0} việc nữa.`;
      case 'enter':
        return `Thăm ${u}: đánh dấu đang thăm.`;
      case 'edge':
        if (f.edgeKind === 'back')
          return `Cạnh ${u} → ${v} quay về ${v}, đỉnh vẫn đang thăm: đây là cạnh ngược, nên có chu trình.`;
        if (f.edgeKind === 'finished')
          return `Cạnh ${u} → ${v}: ${v} đã hoàn tất, nên nó sẽ đứng sau ${u}. Không cần làm gì.`;
        return `Cạnh ${u} → ${v}: ${v} chưa được thăm, nên thăm ${v} trước.`;
      case 'finish':
        return `Mọi việc phía sau ${u} đã xong, nên ${u} hoàn tất (thứ ${f.order.length}).`;
      case 'done':
        return algo === 'kahn'
          ? `Xong. Thứ tự: ${join(names, f.result)}. Mọi cạnh đều chỉ về phía sau.`
          : `Xong. Đảo ngược thứ tự hoàn tất: ${join(names, f.result)}. Mọi cạnh đều chỉ về phía sau.`;
      case 'cycle':
        return algo === 'kahn'
          ? `Hàng đợi đã rỗng nhưng ${join(names, f.cycle)} chưa bao giờ được xếp: mỗi việc vẫn chờ một việc khác, nên chúng nằm trên hoặc sau một chu trình. Không có thứ tự tô-pô nào.`
          : `Chu trình ${join(names, f.cycle)} → ${nm(names, f.cycle[0])}: không có thứ tự tô-pô nào.`;
    }
  },
  takeaways: [
    'Thứ tự tô-pô đặt mỗi đỉnh trước mọi đỉnh mà các cạnh của nó chỉ tới. Thứ tự ấy tồn tại đúng khi đồ thị có hướng không có chu trình, tức là khi nó là một DAG.',
    'Thuật toán Kahn giữ bậc vào (in-degree) của mọi đỉnh. Một đỉnh có bậc vào 0 không còn phụ thuộc vào đỉnh nào, nên có thể xếp ngay; gỡ nó ra sẽ làm giảm bậc vào của các đỉnh sau nó.',
    'Cách dùng DFS chỉ cho một đỉnh hoàn tất sau khi mọi đỉnh đi tới được từ nó đã hoàn tất, nên thứ tự hoàn tất đảo ngược là một thứ tự tô-pô.',
    'Cả hai cách đều phát hiện chu trình: Kahn kết thúc với những đỉnh không bao giờ được xếp, còn DFS gặp một cạnh đi vào đỉnh vẫn đang thăm (cạnh ngược). Một DAG thường có nhiều thứ tự hợp lệ.',
    'Thử xem: so sánh thứ tự Kahn và DFS cho cùng một đồ thị, rồi thêm cạnh G → A và xem mỗi cách báo chu trình ra sao.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian, Kahn',
      'O(V + E)',
      'Mỗi đỉnh vào hàng đợi và được xếp một lần; mỗi cạnh làm giảm một bậc vào đúng một lần.',
    ],
    [
      'Thời gian, DFS',
      'O(V + E)',
      'Mỗi đỉnh được thăm một lần và mỗi cạnh được xét một lần, từ đỉnh đầu của nó.',
    ],
    [
      'Bộ nhớ',
      'O(V)',
      'Bậc vào hoặc dấu đã thăm, cộng với một hàng đợi hoặc ngăn xếp lời gọi có nhiều nhất V phần tử.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt:
        'Chạy Kahn trên đồ thị ban đầu. Gõ thứ tự tô-pô nhận được, các chữ cái cách nhau bằng dấu phẩy.',
      accept: ['A, D, B, E, C, F, G', 'ADBECFG', 'A D B E C F G'],
      hints: [
        'Hàng đợi bắt đầu với A và D, hai việc không có cạnh nào chỉ tới.',
        'Sau khi xếp A và D, bậc vào của B rồi E lần lượt giảm về 0.',
      ],
      solution:
        'Hàng đợi A, D. Xếp A: B giảm về 0 (vào hàng đợi), E còn 1. Xếp D: E giảm về 0. Xếp B: C vào hàng đợi. Xếp E: G còn 1. Xếp C: F vào hàng đợi. Xếp F: G giảm về 0. Xếp G. Thứ tự: A, D, B, E, C, F, G.',
    },
    {
      type: 'text',
      prompt: 'Giờ chuyển sang DFS. Đảo ngược thứ tự hoàn tất cho ta thứ tự nào?',
      accept: ['D, A, E, B, C, F, G', 'DAEBCFG', 'D A E B C F G'],
      hints: [
        'DFS từ A lần theo A → B → C → F → G, nên G hoàn tất đầu tiên.',
        'Thứ tự hoàn tất: G, F, C, B, E, A, D. Hãy đảo ngược nó.',
      ],
      solution:
        'Thứ tự hoàn tất là G, F, C, B, E, A, D; đảo ngược lại được D, A, E, B, C, F, G. Thứ tự này khác thứ tự của Kahn, nhưng mọi cạnh vẫn chỉ về phía sau.',
    },
    {
      type: 'multi',
      prompt:
        'Với đồ thị ban đầu, những thứ tự nào sau đây là thứ tự tô-pô hợp lệ? (A mua, B rửa, C thái, D đun, E luộc mì, F làm sốt, G dọn.)',
      options: [
        'A, B, C, F, D, E, G',
        'D, A, B, C, E, F, G',
        'A, B, D, E, G, C, F',
        'B, A, C, D, E, F, G',
      ],
      answers: [0, 1],
      hints: [
        'Kiểm tra từng cạnh: A → B, B → C, C → F, A → E, D → E, E → G, F → G.',
        'G phải đứng cuối, và B phải đứng sau A.',
      ],
      solution:
        'Hai thứ tự đầu tôn trọng mọi cạnh. Thứ tự thứ ba đặt G trước F, vi phạm F → G. Thứ tự thứ tư đặt B trước A, vi phạm A → B.',
    },
    {
      type: 'choice',
      prompt:
        'Thuật toán Kahn dừng lại khi 3 trong 7 đỉnh chưa bao giờ được xếp. Điều đó cho bạn biết gì?',
      options: [
        'Đồ thị không liên thông.',
        'Đồ thị có một chu trình có hướng.',
        '3 đỉnh đó không có cạnh nào.',
        'Hàng đợi quá nhỏ.',
      ],
      answer: 1,
      hints: ['Một đỉnh chỉ không được xếp khi bậc vào của nó vẫn còn lớn hơn 0.'],
      solution:
        'Mỗi đỉnh chưa xếp vẫn còn một cạnh đi vào từ một đỉnh chưa xếp khác. Lần ngược theo các cạnh ấy giữa hữu hạn đỉnh, chắc chắn sẽ gặp lại một đỉnh, và đó là một chu trình có hướng.',
    },
  ],
  nextTeaser:
    'Bài sau dùng phép duyệt để tô màu và tìm vòng lặp: kiểm tra đồ thị hai phía và phát hiện chu trình.',
};
