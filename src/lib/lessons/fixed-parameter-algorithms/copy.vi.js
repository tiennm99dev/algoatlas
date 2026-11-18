/** @typedef {import('$lib/algo-engine/fixed-parameter-algorithms.js').FptFrame} FptFrame */
/** @typedef {import('$lib/algo-engine/fixed-parameter-algorithms.js').SearchNode} SearchNode */

/** @param {string[]} names @param {number[]} set */
const setText = (names, set) => (set.length ? `{${set.map((i) => names[i]).join(', ')}}` : '{ }');

export const vi = {
  slug: 'fixed-parameter-algorithms',
  topic: 'intractability',
  level: 'Nâng cao',
  title: 'Thuật toán tham số cố định',
  intro:
    'NP-khó không phải lúc nào cũng là vô vọng. Độ phức tạp tham số hoá đo thời gian chạy theo kích thước đầu vào n và một số thứ hai k, chẳng hạn kích thước của đáp án. Một bài toán giải được với tham số cố định (fixed-parameter tractable, FPT) khi nó giải được trong thời gian f(k) · poly(n): chỉ hàm mũ theo k. Phủ đỉnh là ví dụ kinh điển, giải được trong O(2ᵏ · m) bằng một cây tìm kiếm sâu không quá k.',
  summary:
    'Xác định một đồ thị có tập phủ đỉnh gồm k đỉnh hay không bằng cây tìm kiếm bị chặn, và thu nhỏ đồ thị trước bằng hạt nhân Buss.',
  instruction:
    'Chạy từng bước cây tìm kiếm và xem tập phủ trên đồ thị lớn lên rồi co lại khi phép tìm kiếm quay lui. Đổi k, bật hạt nhân, sửa đồ thị, hoặc bấm (hay nhấn Enter) vào một nút của cây để nhảy tới nó. So sánh ô “Số nút tìm kiếm” với cận 2^(k+1) − 1 và với vét cạn.',
  kLabel: 'k',
  kernelLabel: 'Rút gọn hạt nhân trước',
  kernels: { off: 'Tắt', on: 'Hạt nhân Buss' },
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    yes: 'Con nhện, k = 3',
    no: 'Con nhện, k = 2',
    stars: 'Hai hình sao, k = 2',
  },
  /** @param {number} max */
  kError: (max) => `k phải là số nguyên từ 0 đến ${max}.`,
  graphTitle: 'Đồ thị',
  graphAria: 'Đồ thị cần phủ. Vẽ nó bằng các công cụ.',
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => (state ? `Đỉnh ${name}, ${state}` : `Đỉnh ${name}`),
  states: { current: 'đang xử lí', cover: 'thuộc tập phủ', forced: 'bị hạt nhân buộc phải lấy' },
  markers: { forced: 'K' },
  treeTitle: 'Cây tìm kiếm',
  treeNote:
    'Mỗi hình tròn ghi số đỉnh còn được phép lấy, và số bên dưới là số cạnh chưa phủ. Mỗi cạnh của cây ghi đỉnh mà nó lấy. Cây không bao giờ sâu quá k.',
  treeAria: 'Cây tìm kiếm bị chặn, được dựng dần trong lúc chạy.',
  treeEmpty: 'Chưa tìm kiếm.',
  /** @param {string} name */
  edgeLabel: (name) => `+${name}`,
  /** @param {SearchNode} n @param {string} took */
  nodeLabel: (n, took) => {
    const state = {
      active: 'trên đường đi hiện tại',
      fail: 'hết ngân sách mà vẫn còn cạnh',
      yes: 'mọi cạnh đã được phủ',
      done: 'cả hai nhánh đều thất bại',
    }[n.status];
    return `${took ? `Đã lấy ${took}, ` : 'Gốc, '}còn được lấy ${n.budget} đỉnh, ${n.left} cạnh chưa phủ, ${state}.`;
  },
  nodeMarkers: { yes: '✓', fail: '✗' },
  legend: {
    current: 'Đang xử lí',
    cover: 'Thuộc tập phủ',
    forced: 'K Bị hạt nhân buộc phải lấy',
    branchEdge: 'Cạnh đang rẽ nhánh',
    covered: 'Cạnh đã được phủ',
    path: 'Trên đường đi hiện tại',
    found: '✓ Đã tìm được tập phủ',
    fail: '✗ Hết ngân sách',
    done: 'Cả hai nhánh đều thất bại',
  },
  stats: {
    made: 'Số nút tìm kiếm',
    budget: 'k sau khi rút gọn',
    brute: 'Số lần thử của vét cạn',
    answer: 'Câu trả lời',
  },
  /** @param {number} k */
  boundNote: (k) => `Tối đa 2^(${k} + 1) − 1 = ${2 ** (k + 1) - 1}.`,
  /** @param {number} n @param {number} k */
  bruteNote: (n, k) => `Mọi tập gồm tối đa ${k} trong ${n} đỉnh.`,
  /** @param {FptFrame} f @param {string[]} names */
  answer: (f, names) => {
    if (f.answer === 'yes') return `có, ${setText(names, f.cover)}`;
    if (f.answer === 'no') return 'không';
    return 'đang tìm';
  },
  /** @param {FptFrame} f @param {string[]} names */
  describe(f, names) {
    const node = f.current >= 0 ? f.nodes[f.current] : null;
    const e = f.edge >= 0 ? f.edges[f.edge] : null;
    const pair = e ? `${names[e[0]]} – ${names[e[1]]}` : '';
    switch (f.kind) {
      case 'start':
        return `Có tập phủ đỉnh nào gồm tối đa k = ${f.k} đỉnh không? Đồ thị có ${f.n} đỉnh và ${f.edges.length} cạnh.`;
      case 'forced':
        return `${names[f.vertex]} có nhiều hơn ${f.budget + 1} cạnh chưa phủ. Một tập phủ không chứa nó sẽ cần mọi đỉnh kề đó, quá nhiều, nên lấy ${names[f.vertex]}. Giờ k = ${f.budget}.`;
      case 'overBudget':
        return `${names[f.vertex]} vẫn còn cạnh nhưng k đã bằng 0. Không tập phủ nào vừa: câu trả lời là “không”.`;
      case 'tooBig':
        return `Giờ mỗi đỉnh phủ tối đa k = ${f.budget} cạnh, nên k đỉnh phủ tối đa ${f.budget * f.budget} cạnh. Còn lại ${f.covered.filter((c) => !c).length} cạnh: câu trả lời là “không”, chẳng cần tìm kiếm.`;
      case 'kernel':
        return `Hạt nhân đã sẵn sàng: còn ${f.covered.filter((c) => !c).length} cạnh, không quá k² = ${f.budget * f.budget}, với k = ${f.budget}. Bắt đầu tìm kiếm trên nó.`;
      case 'branch':
        return `${pair} là cạnh chưa phủ đầu tiên, và mọi tập phủ đều chứa ${names[e?.[0] ?? 0]} hoặc ${names[e?.[1] ?? 0]}. Rẽ nhánh: trước hết lấy ${names[e?.[0] ?? 0]}, sau đó còn được lấy ${(node?.budget ?? 1) - 1} đỉnh.`;
      case 'back':
        return `Nhánh đó không tìm được tập phủ. Thử đầu còn lại của ${pair}.`;
      case 'fail':
        return `Không còn đỉnh nào để lấy, nhưng vẫn còn ${node?.left ?? 0} cạnh chưa phủ. Ngõ cụt: quay lui.`;
      case 'yes':
        return `Mọi cạnh đã được phủ bởi ${setText(names, f.cover)}, gồm ${f.cover.length} đỉnh, không quá k. Câu trả lời là “có”.`;
      case 'done':
        return f.answer === 'yes'
          ? `Xong: “có”, sau ${f.nodes.length} nút tìm kiếm.`
          : f.nodes.length
            ? `Xong: mọi nhánh đều hết ngân sách, nên không có tập phủ nào gồm ${f.k} đỉnh. Phép tìm kiếm đã tạo ${f.nodes.length} nút.`
            : 'Xong: hạt nhân đã trả lời “không” trước khi tìm kiếm.';
    }
  },
  takeaways: [
    'Độ phức tạp tham số hoá hỏi thời gian chạy tăng ra sao theo n và theo một tham số k, tách riêng hai thứ. FPT nghĩa là f(k) · poly(n), nên một đồ thị rất lớn mà k nhỏ vẫn dễ.',
    'Cây tìm kiếm bị chặn rẽ nhánh trên một tập nhỏ chắc chắn chứa một phần của đáp án. Với phủ đỉnh, mỗi cạnh có một đầu thuộc tập phủ: hai nhánh, mỗi nhánh tiêu một đỉnh, nên có tối đa 2ᵏ lá.',
    'Rút gọn hạt nhân thu nhỏ đầu vào trong thời gian đa thức về một kích thước chỉ phụ thuộc k. Các quy tắc Buss để lại tối đa k² cạnh, hoặc trả lời “không” ngay.',
    'So sánh O(2ᵏ · m) với vét cạn qua mọi tập gồm k đỉnh, khoảng nᵏ. Với n = 1000 và k = 10, đó là khoảng một triệu bước so với 10³⁰.',
    'Nạp “Con nhện, k = 2” rồi chạy từng bước: phép tìm kiếm tạo 7 nút rồi mới nói “không”. Bật hạt nhân thì nó nói “không” ngay, vì A bị buộc phải lấy và 3 cạnh là nhiều hơn 1².',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Cây tìm kiếm',
      'O(2ᵏ · m)',
      'Tối đa 2^(k+1) − 1 nút, mỗi nút tìm một cạnh chưa phủ trong O(m).',
    ],
    ['Hạt nhân Buss', 'O(k · (n + m))', 'Tối đa k đỉnh bị buộc lấy, mỗi đỉnh một lần đếm bậc.'],
    [
      'Rút gọn rồi tìm kiếm',
      'O(k · (n + m) + 2ᵏ · k²)',
      'Phép tìm kiếm chạy trên một hạt nhân có tối đa k² cạnh.',
    ],
    ['Vét cạn', 'O(nᵏ · m)', 'Mọi tập gồm k đỉnh, mỗi tập kiểm tra với mọi cạnh.'],
    ['Bộ nhớ', 'O(k + m)', 'Một đường đi gồm tối đa k lần chọn, cộng với đồ thị.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Khi k = 4, cây tìm kiếm có nhiều nhất bao nhiêu nút?',
      answer: 31,
      unit: 'nút',
      hints: ['Một cây nhị phân sâu không quá k.'],
      solution: '2^(4 + 1) − 1 = 31 nút, dù đồ thị lớn đến đâu.',
    },
    {
      type: 'number',
      prompt: 'Nạp “Con nhện, k = 2”. Phép tìm kiếm tạo bao nhiêu nút trước khi trả lời “không”?',
      answer: 7,
      unit: 'nút',
      hints: ['Chạy tới bước cuối và đọc ô “Số nút tìm kiếm”.'],
      solution:
        'Mọi nhánh đều hết ngân sách, nên cây đầy đủ: 2³ − 1 = 7 nút, nhiều nhất mà cận cho phép khi k = 2.',
    },
    {
      type: 'number',
      prompt: 'Nạp “Con nhện, k = 3”. Phép tìm kiếm tạo bao nhiêu nút trước khi tìm được tập phủ?',
      answer: 15,
      unit: 'nút',
      hints: [
        'Phép tìm kiếm dừng ở tập phủ đầu tiên nó tìm được. Chạy tới bước cuối và đọc ô “Số nút tìm kiếm”.',
      ],
      solution:
        'Lấy A trước thì thất bại ở cả 7 nút của cây con. Lấy B, rồi A thất bại, sau đó C và D cho tập phủ {B, C, D}: 15 nút, đúng bằng cận 2⁴ − 1, vì tập phủ được tìm thấy ở chiếc lá cuối cùng.',
    },
    {
      type: 'choice',
      prompt: 'Trong hạt nhân Buss, vì sao một đỉnh có nhiều hơn k cạnh phải thuộc tập phủ?',
      options: [
        'Vì nó có bậc cao nhất.',
        'Vì bỏ nó ra thì tập phủ phải chứa hơn k đỉnh kề của nó.',
        'Vì thuật toán tham lam luôn lấy nó.',
        'Vì các cạnh của nó tạo thành một ghép cặp.',
      ],
      answer: 1,
      hints: ['Mỗi cạnh của v cần v hoặc đầu còn lại.'],
      solution:
        'Nếu bỏ v, mỗi cạnh của nó cần đầu còn lại, tức hơn k đỉnh. Vậy mọi tập phủ gồm tối đa k đỉnh đều lấy v.',
    },
    {
      type: 'multi',
      prompt: 'Những thời gian chạy nào là FPT theo k? Chọn mọi phương án đúng.',
      options: ['O(2ᵏ · n)', 'O(nᵏ)', 'O(k! · n³)', 'O(n^(k/2))'],
      answers: [0, 2],
      hints: ['FPT là f(k) nhân với một đa thức có bậc không phụ thuộc k.'],
      solution:
        '2ᵏ · n và k! · n³ tách k khỏi n. Trong nᵏ và n^(k/2), số mũ của n tăng theo k, nên chúng không phải FPT.',
    },
  ],
  nextTeaser:
    'Bài sau là phần luyện tập: phép quy dẫn và độ khó, nơi em tự phân loại các bài toán và chọn chiều quy dẫn.',
};
