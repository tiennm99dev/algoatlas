/** @typedef {import('$lib/algo-engine/bipartite-cycles.js').TwoColourFrame} TwoColourFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);
/** @param {string[]} names @param {number[]} list */
const join = (names, list) => list.map((i) => nm(names, i)).join(', ');

export const vi = {
  slug: 'bipartite-cycles',
  topic: 'graphs',
  level: 'Trung bình',
  title: 'Kiểm tra đồ thị hai phía và phát hiện chu trình',
  intro:
    'Một đồ thị là đồ thị hai phía khi tập đỉnh chia được thành hai phía sao cho mọi cạnh đều nối hai phía với nhau, giống như học sinh và các câu lạc bộ các bạn tham gia. Một lần BFS có thể thử tô đồ thị bằng hai màu, và việc tô thất bại đúng khi đồ thị có một chu trình độ dài lẻ. Cũng những ý tưởng tìm kiếm ấy giúp phát hiện chu trình, nhưng thế nào là một chu trình còn tuỳ cạnh có hướng hay không.',
  summary:
    'Tô hai màu cho đồ thị bằng BFS cho đến khi một chu trình lẻ chặn lại, và phát hiện chu trình bằng DFS trên đồ thị vô hướng lẫn có hướng.',
  instruction:
    'Chọn một phép kiểm tra và một đồ thị có sẵn, hoặc tự sửa đồ thị bằng các công cụ bên dưới. Chạy từng bước: phép tô hai màu cho mỗi đỉnh kề màu còn lại cho đến khi một cạnh nối hai đỉnh cùng màu, rồi chỉ ra chu trình lẻ. Các phép kiểm tra chu trình đi bằng DFS và dừng ở cạnh đầu tiên khép kín một chu trình.',
  modeLabel: 'Phép kiểm tra',
  modes: {
    bipartite: 'Tô hai màu (BFS)',
    undirected: 'Chu trình, vô hướng',
    directed: 'Chu trình, có hướng',
  },
  presetLabel: 'Đồ thị',
  presets: {
    odd: 'Chu trình lẻ',
    even: 'Chu trình chẵn',
    diamond: 'Hình thoi',
    tree: 'Cây',
  },
  graphAria: 'Đồ thị đầu vào.',
  queueLabel: 'Hàng đợi (đầu hàng trước)',
  stackLabel: 'Ngăn xếp lời gọi (đỉnh trước)',
  emptyText: 'rỗng',
  stats: {
    checks: 'Số lần xét cạnh',
    reached: 'Số đỉnh đã tới',
    sides: 'Phía 1 | phía 2',
    result: 'Kết quả',
  },
  results: {
    running: 'đang chạy…',
    bipartite: 'hai phía',
    /** @param {number} k */
    oddCycle: (k) => `chu trình lẻ dài ${k}`,
    /** @param {number} k */
    cycle: (k) => `chu trình dài ${k}`,
    acyclic: 'không có chu trình',
  },
  legend: {
    current: 'Đang xử lí',
    side1: 'Phía 1',
    side2: 'Phía 2',
    inProgress: 'Đang thăm (trên ngăn xếp)',
    finished: 'Đã hoàn tất',
    cycle: 'Chu trình tìm được',
    treeEdge: 'Cạnh dẫn tới một đỉnh mới',
    checkedEdge: 'Cạnh đã xét, không có gì mới',
  },
  states: {
    current: 'đang xét',
    side1: 'phía 1',
    side2: 'phía 2',
    inProgress: 'đang thăm',
    finished: 'đã hoàn tất',
    visited: 'đã thăm',
    cycle: 'trên chu trình',
  },
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Đỉnh ${name}`, state].filter(Boolean).join(', '),
  /** @param {TwoColourFrame} f @param {string[]} names @param {'bipartite'|'undirected'|'directed'} mode */
  describe(f, names, mode) {
    const u = nm(names, f.current);
    const v = nm(names, f.other);
    const arrow = mode === 'directed' ? '→' : '–';
    switch (f.kind) {
      case 'start':
        return mode === 'bipartite'
          ? 'Chưa đỉnh nào có màu.'
          : 'Ban đầu chưa đỉnh nào được thăm. Bắt đầu một lần DFS từ mỗi đỉnh còn chưa thăm.';
      case 'seed':
        return `${u} chưa có màu: tô màu 1 và bắt đầu một lần BFS từ đỉnh này.`;
      case 'dequeue':
        return `Lấy ${u} (màu ${f.colour[f.current]}) ra khỏi hàng đợi và xét các đỉnh kề của nó.`;
      case 'colour':
        return `${v} chưa có màu, nên nhận màu còn lại, màu ${f.colour[f.other]}.`;
      case 'agree':
        return `${v} đã có màu ${f.colour[f.other]}, khác màu với ${u}. Ổn.`;
      case 'conflict':
        return `${u} và ${v} cùng có màu ${f.colour[f.current]}, nhưng có một cạnh nối chúng. Chu trình lẻ ${join(names, f.cycle)}: đồ thị không phải đồ thị hai phía.`;
      case 'enter':
        return `Thăm ${u}.`;
      case 'edge':
        if (f.edgeKind === 'parent')
          return `${u} – ${v} là cạnh ta vừa đi theo để đến đây, không phải chu trình. Bỏ qua.`;
        if (f.edgeKind === 'back')
          return mode === 'directed'
            ? `Cạnh ${u} → ${v} dẫn tới ${v}, đỉnh vẫn đang thăm: đây là cạnh ngược.`
            : `${v} đã được thăm và không phải cha của ${u}: cạnh ${u} – ${v} khép kín một chu trình.`;
        if (f.edgeKind === 'finished')
          return `Cạnh ${u} → ${v}: ${v} đã hoàn tất, nên mọi đường đi từ ${v} đã được khám phá và không đường nào quay lại. Ở đây không có chu trình.`;
        return `Cạnh ${u} ${arrow} ${v}: ${v} chưa được thăm, nên ta thăm ${v}.`;
      case 'finish':
        return mode === 'directed'
          ? `Mọi cạnh đi ra từ ${u} đã được khám phá: đánh dấu ${u} hoàn tất.`
          : `${u} không còn đỉnh kề nào: quay lui.`;
      case 'cycle':
        return `Chu trình ${join(names, f.cycle)} ${arrow} ${nm(names, f.cycle[0])}.`;
      case 'done':
        if (mode === 'bipartite') {
          const one = f.colour.flatMap((c, i) => (c === 1 ? [i] : []));
          const two = f.colour.flatMap((c, i) => (c === 2 ? [i] : []));
          return `Đồ thị hai phía. Phía 1: ${join(names, one) || 'không có'}. Phía 2: ${join(names, two) || 'không có'}.`;
        }
        return mode === 'directed'
          ? 'Không có cạnh ngược nào: đồ thị có hướng này không có chu trình, nên nó là một DAG.'
          : 'Không cạnh nào khép kín chu trình: đồ thị là một rừng.';
    }
  },
  takeaways: [
    'Một đồ thị là đồ thị hai phía đúng khi tô được nó bằng hai màu sao cho mọi cạnh nối hai màu khác nhau, và cũng đúng khi nó không có chu trình độ dài lẻ.',
    'BFS tô mỗi đỉnh kề mới bằng màu còn lại. Một cạnh nối hai đỉnh cùng màu chứng minh có chu trình lẻ: hai đường đi trên cây BFS về tổ tiên chung của chúng, cộng với chính cạnh ấy.',
    'Trong đồ thị vô hướng, DFS tìm thấy chu trình khi gặp một đỉnh đã thăm mà không phải đỉnh cha nó vừa đi từ đó tới.',
    'Trong đồ thị có hướng, chỉ cạnh ngược, đi vào một đỉnh vẫn đang thăm, mới khép kín chu trình. Cạnh đi vào một đỉnh đã hoàn tất thì không: hình thoi A → B → D, A → C → D không có chu trình có hướng nào.',
    'Thử xem: mở Hình thoi và so sánh hai phép kiểm tra chu trình, rồi mở Chu trình lẻ và xoá một cạnh của nó để biến nó thành đồ thị hai phía.',
  ],
  complexityHead: ['Phép kiểm tra', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Tô hai màu (BFS)',
      'O(V + E)',
      'Mỗi đỉnh vào hàng đợi một lần và mỗi cạnh được xét từ cả hai đầu.',
    ],
    [
      'Kiểm tra chu trình, vô hướng',
      'O(V)',
      'Phép kiểm tra dừng ở cạnh đầu tiên không thuộc cây, mà một rừng có ít hơn V cạnh, nên nó chỉ xét O(V) cạnh.',
    ],
    [
      'Kiểm tra chu trình, có hướng',
      'O(V + E)',
      'Mỗi đỉnh được thăm một lần và mỗi cạnh được xét một lần từ đỉnh đầu của nó.',
    ],
    [
      'Bộ nhớ',
      'O(V)',
      'Mỗi đỉnh một màu hoặc một trạng thái, cộng với một hàng đợi hoặc ngăn xếp lời gọi.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Mở Chu trình lẻ và chạy phép tô hai màu. Chu trình lẻ được báo có bao nhiêu đỉnh?',
      answer: 5,
      unit: 'đỉnh',
      hints: ['Chạy đến bước cuối rồi đếm các đỉnh được nêu trong lời mô tả.'],
      solution:
        'C và D cùng nhận màu 1, và cạnh C – D nối chúng. Hai đường đi trên cây A, B, C và A, E, D cộng với cạnh đó cho chu trình A, B, C, D, E dài 5.',
    },
    {
      type: 'multi',
      prompt: 'Những đồ thị nào sau đây là đồ thị hai phía?',
      options: [
        'Một chu trình 6 đỉnh',
        'Một tam giác',
        'Một cây bất kì',
        'Một hình vuông có một đường chéo',
      ],
      answers: [0, 2],
      hints: ['Tìm một chu trình có độ dài lẻ.', 'Đường chéo chia hình vuông thành hai tam giác.'],
      solution:
        'Chu trình chẵn và mọi cây (hoàn toàn không có chu trình) đều tô được bằng hai màu. Tam giác là một chu trình lẻ, còn hình vuông có đường chéo chứa hai tam giác.',
    },
    {
      type: 'choice',
      prompt: 'Mở Hình thoi. Câu nào đúng với kết quả của hai phép kiểm tra chu trình?',
      options: [
        'Cả hai đều báo có chu trình.',
        'Bản vô hướng thấy chu trình; bản có hướng không thấy.',
        'Bản có hướng thấy chu trình; bản vô hướng không thấy.',
        'Không bản nào thấy chu trình.',
      ],
      answer: 1,
      hints: [
        'Trong phép kiểm tra có hướng, D đang ở trạng thái nào khi phép tìm kiếm tới nó lần thứ hai?',
      ],
      solution:
        'Với đồ thị vô hướng, A – B – D – C – A là một chu trình. Với đồ thị có hướng, D đã hoàn tất khi cạnh C → D được xét, nên cạnh đó không phải cạnh ngược, và không đường đi nào quay về A.',
    },
    {
      type: 'number',
      prompt: 'Mở Chu trình chẵn và chạy phép tô hai màu. Tổng cộng có bao nhiêu lần xét cạnh?',
      answer: 14,
      unit: 'lần',
      hints: [
        'Đồ thị có 7 cạnh và là đồ thị hai phía, nên BFS không bao giờ dừng sớm.',
        'Mỗi cạnh được xét một lần từ mỗi đầu.',
      ],
      solution:
        'Lục giác có 6 cạnh cộng với dây cung A – D, tức 7 cạnh, mỗi cạnh được xét từ cả hai đầu: 14 lần.',
    },
  ],
  nextTeaser:
    'Bài sau là Luyện tập: bài toán duyệt đồ thị, nơi bạn tự chọn giữa BFS và DFS cho từng câu hỏi.',
};
