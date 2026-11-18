/** @typedef {import('$lib/algo-engine/practice-intractability.js').SortFrame} SortFrame */
/** @typedef {import('$lib/algo-engine/practice-intractability.js').Bin} Bin */

/** @type {Record<string, {name: string, statement: string, why: string}>} */
const cards = {
  eulerCircuit: {
    name: 'Chu trình Euler',
    statement: 'Có đường đi khép kín nào dùng mỗi cạnh đúng một lần không?',
    why: 'Thuật toán Hierholzer chạy trong O(V + E): chu trình tồn tại khi và chỉ khi mọi đỉnh có bậc chẵn và mọi cạnh nằm trong một thành phần liên thông.',
  },
  hamCycle: {
    name: 'Chu trình Hamilton',
    statement: 'Có chu trình nào đi qua mỗi đỉnh đúng một lần không?',
    why: 'Quy dẫn từ phủ đỉnh (hoặc 3-SAT). Đây là câu hỏi có/không, nên không có chuyện xấp xỉ.',
  },
  twoSat: {
    name: '2-SAT',
    statement: 'Một công thức CNF với hai literal mỗi mệnh đề có thoả được không?',
    why: 'Mỗi mệnh đề thành hai phép kéo theo, và các thành phần liên thông mạnh quyết định câu trả lời trong thời gian tuyến tính.',
  },
  threeSat: {
    name: '3-SAT',
    statement: 'Một công thức CNF với ba literal mỗi mệnh đề có thoả được không?',
    why: 'Quy dẫn từ SAT, bài toán mà định lí Cook–Levin chứng minh là NP-đầy đủ đầu tiên.',
  },
  metricTsp: {
    name: 'TSP metric',
    statement:
      'Hành trình ngắn nhất qua mọi thành phố khi khoảng cách thoả bất đẳng thức tam giác.',
    why: 'Quy dẫn từ chu trình Hamilton, với chi phí 1 và 2. Nhân đôi một cây khung nhỏ nhất cho thuật toán 2-xấp xỉ, còn thuật toán Christofides đạt 1,5.',
  },
  generalTsp: {
    name: 'TSP tổng quát',
    statement: 'Hành trình ngắn nhất qua mọi thành phố, với khoảng cách bất kì.',
    why: 'Quy dẫn từ chu trình Hamilton, đặt chi phí rất lớn cho các cạnh không có: mọi phép xấp xỉ với hệ số hằng đều sẽ giải được bài toán chu trình Hamilton.',
  },
  vertexCover: {
    name: 'Phủ đỉnh nhỏ nhất',
    statement: 'Ít đỉnh nhất chạm tới mọi cạnh.',
    why: 'Quy dẫn từ 3-SAT. Lấy cả hai đầu của một ghép cặp tối đại là thuật toán 2-xấp xỉ.',
  },
  dagLongestPath: {
    name: 'Đường đi dài nhất trên DAG',
    statement: 'Đường đi dài nhất trong một đồ thị có hướng không có chu trình.',
    why: 'Quy hoạch động theo thứ tự tô-pô, O(V + E). Khi không có chu trình, “dài nhất” dễ y như “ngắn nhất”.',
  },
  longestPath: {
    name: 'Đường đi đơn dài nhất',
    statement: 'Đường đi dài nhất không lặp lại đỉnh nào, trên đồ thị bất kì.',
    why: 'Quy dẫn từ đường đi Hamilton: một đường đi gồm n − 1 cạnh thăm mọi đỉnh. Không có phép xấp xỉ hệ số hằng nào, trừ khi P = NP.',
  },
  shortestPath: {
    name: 'Đường đi ngắn nhất',
    statement: 'Đường đi rẻ nhất giữa hai đỉnh, với trọng số không âm.',
    why: 'Thuật toán Dijkstra, O((V + E) log V).',
  },
  twoColouring: {
    name: 'Tô 2 màu',
    statement:
      'Có thể tô các đỉnh bằng hai màu sao cho không cạnh nào nằm trong cùng một màu không?',
    why: 'Tô hai màu bằng BFS thất bại đúng khi có chu trình lẻ, O(V + E).',
  },
  threeColouring: {
    name: 'Tô 3 màu',
    statement:
      'Có thể tô các đỉnh bằng ba màu sao cho không cạnh nào nằm trong cùng một màu không?',
    why: 'Quy dẫn từ 3-SAT bằng một tam giác đúng/sai/nền và các cấu kiện cho mệnh đề. Đây là câu hỏi có/không.',
  },
  maxClique: {
    name: 'Clique lớn nhất',
    statement: 'Tập đỉnh lớn nhất mà các đỉnh đôi một nối với nhau.',
    why: 'Quy dẫn từ 3-SAT. Không thể xấp xỉ nó trong hệ số n^(1−ε) với bất kì ε > 0 nào, trừ khi P = NP.',
  },
  knapsack: {
    name: 'Cái túi 0/1',
    statement: 'Tập đồ vật nguyên vẹn có tổng giá trị lớn nhất mà không vượt giới hạn khối lượng.',
    why: 'Quy dẫn từ tổng tập con. Làm tròn các giá trị cho phép (1 − ε)-xấp xỉ với mọi ε, trong thời gian đa thức.',
  },
  fractionalKnapsack: {
    name: 'Cái túi phân số',
    statement: 'Cũng vậy, nhưng đồ vật có thể cắt ra thành từng phần.',
    why: 'Tham lam theo giá trị trên mỗi đơn vị khối lượng là tối ưu, O(n log n).',
  },
  binPacking: {
    name: 'Xếp thùng',
    statement: 'Ít thùng cỡ 1 nhất chứa được mọi đồ vật.',
    why: 'Quy dẫn từ bài toán phân hoạch (partition). Chiến lược “vừa đầu tiên, giảm dần” dùng tối đa 11/9 · OPT + 6/9 thùng.',
  },
  maxCut: {
    name: 'Lát cắt lớn nhất',
    statement: 'Chia các đỉnh thành hai phần để cắt được càng nhiều cạnh càng tốt.',
    why: 'Quy dẫn từ NAE-3-SAT. Một cách chia ngẫu nhiên cắt trung bình một nửa số cạnh, còn thuật toán Goemans–Williamson đạt 0,878.',
  },
  matching: {
    name: 'Ghép cặp cực đại',
    statement: 'Nhiều cạnh nhất không dùng chung đỉnh, trên đồ thị bất kì.',
    why: 'Thuật toán bông hoa (blossom) của Edmonds chạy trong thời gian đa thức; với đồ thị hai phía, dùng luồng cực đại.',
  },
};

/** @type {Record<Bin, string>} */
const bins = { p: 'Đa thức', npc: 'NP-đầy đủ', approx: 'Xấp xỉ được' };

export const vi = {
  slug: 'practice-intractability',
  topic: 'intractability',
  level: 'Nâng cao',
  title: 'Luyện tập: phép quy dẫn và độ khó',
  intro:
    'Trước khi thử giải một bài toán, hãy xác định xem nó khó tới đâu. Nhiều bài toán dễ và khó trông gần như giống hệt nhau: đường đi ngắn nhất và dài nhất, chu trình Euler và chu trình Hamilton, 2-SAT và 3-SAT. Nhận ra mình đang gặp bài nào cho bạn biết nên tìm một thuật toán chính xác, một phép xấp xỉ, hay một phép quy dẫn (reduction) chứng minh rằng cả hai đều không có.',
  summary:
    'Xếp các thẻ bài toán vào ba ô đa thức, NP-đầy đủ và xấp xỉ được, rồi chạy từng bước phần kiểm tra để xem thuật toán hay phép quy dẫn đứng sau mỗi thẻ.',
  instruction:
    'Đặt mỗi thẻ vào một ô, rồi chạy từng bước phần kiểm tra: mỗi bước mở đáp án của một thẻ, kèm thuật toán giải nó hoặc bài toán quy dẫn về nó. Nút “Kiểm tra tất cả” nhảy thẳng tới điểm số. Chia một lượt thẻ mới để gặp các thẻ khác, rồi trả lời các câu hỏi bên dưới.',
  binsLabel: 'Ô',
  bins,
  /** @type {Record<Bin, string>} */
  binNotes: {
    p: 'Giải chính xác được trong thời gian đa thức.',
    npc: 'NP-đầy đủ khi hỏi dạng có/không. Một bài toán tối ưu thuộc ô này khi nó NP-khó và không có phép xấp xỉ hệ số hằng nào, trừ khi P = NP.',
    approx:
      'Giải chính xác thì NP-khó, nhưng đạt được trong một hệ số hằng bằng thuật toán đa thức.',
  },
  cards,
  handTitle: 'Các thẻ của bạn',
  checkAll: 'Kiểm tra tất cả',
  deal: 'Chia lượt thẻ mới',
  clear: 'Xoá các câu trả lời',
  /** @param {string} name */
  cardLegend: (name) => `Ô cho ${name}`,
  verdicts: {
    right: '✓ Đúng',
    wrong: '✗ Chưa đúng',
    unsorted: '? Chưa xếp',
  },
  /** @param {Bin} bin */
  belongs: (bin) => `Thẻ này thuộc ô ${bins[bin]}.`,
  legend: {
    active: 'Đang kiểm tra',
    right: '✓ Đúng',
    wrong: '✗ Chưa đúng',
  },
  stats: { right: 'Đúng', wrong: 'Chưa đúng', unsorted: 'Chưa xếp', checked: 'Đã kiểm tra' },
  /** @param {SortFrame} f @param {Bin} want */
  describe(f, want) {
    const card = f.card >= 0 ? cards[f.hand[f.card]] : null;
    switch (f.kind) {
      case 'start':
        return `Xếp ${f.hand.length} thẻ, rồi chạy tới để kiểm tra từng thẻ một.`;
      case 'right':
        return `${card?.name}: đúng, ${bins[want]}. ${card?.why}`;
      case 'wrong':
        return `${card?.name}: không phải ${bins[/** @type {Bin} */ (f.answers[f.card])]}, mà là ${bins[want]}. ${card?.why}`;
      case 'unsorted':
        return `${card?.name}: chưa xếp. Thẻ này thuộc ô ${bins[want]}. ${card?.why}`;
      case 'done':
        return `Đúng ${f.right}/${f.hand.length} thẻ${f.wrong ? `, ${f.wrong} thẻ chưa đúng` : ''}${f.unsorted ? `, ${f.unsorted} thẻ chưa xếp` : ''}.${f.right === f.hand.length ? ' Xếp hoàn hảo.' : ' Lùi về bất kì thẻ nào để đọc lí do.'}`;
    }
  },
  takeaways: [
    'Một thay đổi nhỏ có thể biến bài toán từ dễ thành NP-đầy đủ: hai hay ba literal mỗi mệnh đề, hai hay ba màu, mọi cạnh hay mọi đỉnh, DAG hay đồ thị bất kì.',
    'Muốn chứng minh một bài toán mới là khó, hãy chọn bài toán NP-đầy đủ đã biết giống nó nhất: chu trình Hamilton cho lộ trình và thứ tự, 3-SAT cho lựa chọn đúng/sai, phủ đỉnh hay clique cho việc chọn đỉnh, tổng tập con hay phân hoạch cho các con số.',
    'NP-đầy đủ là một khẳng định về đáp án chính xác. Nhiều bài toán tối ưu NP-khó vẫn có phép xấp xỉ tốt, như phủ đỉnh, TSP metric, bài toán cái túi (knapsack) và xếp thùng, trong khi những bài khác, như clique và TSP tổng quát, không chịu bất kì hệ số hằng nào.',
    'Khi vẫn cần đáp án chính xác, hãy dùng một tham số cố định, nhánh cận (branch and bound), hoặc quy hoạch động trên một miền số nhỏ, như cách giải giả đa thức của bài toán cái túi.',
    'Chia vài lượt thẻ mới cho tới khi bạn đã gặp mọi thẻ, và thử nói ra bài toán nguồn của phép quy dẫn cho mỗi thẻ trước khi chạy tới nó.',
  ],
  complexityHead: ['Bài toán', 'Tốt nhất đã biết', 'Vì sao'],
  complexity: [
    [
      'Đường đi ngắn nhất, MST, 2-SAT',
      'đa thức',
      'Quy tắc tham lam, quy hoạch động hoặc tìm kiếm trên đồ thị giải chính xác được chúng.',
    ],
    [
      '3-SAT, chu trình Hamilton, tô 3 màu',
      'hàm mũ',
      'NP-đầy đủ: một thuật toán đa thức cho một bài sẽ dẫn tới P = NP.',
    ],
    [
      'Phủ đỉnh, TSP metric, xếp thùng',
      'hệ số hằng',
      'NP-khó, nhưng có thuật toán đa thức không kém tối ưu quá một hệ số cố định.',
    ],
    [
      'Clique, TSP tổng quát',
      'không có hệ số hằng',
      'Trừ khi P = NP, ngay cả việc xấp xỉ chúng cũng khó.',
    ],
  ],
  practiceTitle: 'Câu hỏi',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trong lượt thẻ ban đầu, có bao nhiêu thẻ thuộc ô “Đa thức”?',
      answer: 3,
      unit: 'thẻ',
      hints: [
        'Bấm “Kiểm tra tất cả” và đếm các kết luận “Đa thức”, hoặc nghĩ xem: trong mỗi cặp trông giống nhau, bài nào là bài dễ?',
      ],
      solution:
        'Chu trình Euler, 2-SAT và đường đi dài nhất trên DAG: 3 thẻ. Các bài trông giống chúng, chu trình Hamilton, 3-SAT và đường đi đơn dài nhất, đều NP-đầy đủ.',
    },
    {
      type: 'multi',
      prompt: 'Những thẻ nào trong lượt thẻ ban đầu thuộc ô “Xấp xỉ được”?',
      options: ['TSP metric', 'TSP tổng quát', 'Phủ đỉnh nhỏ nhất', '3-SAT'],
      answers: [0, 2],
      hints: ['Chạy tới hai thẻ TSP và so sánh lí do của chúng.'],
      solution:
        'TSP metric (hệ số 2 nhờ nhân đôi một MST) và phủ đỉnh (hệ số 2 nhờ một ghép cặp tối đại). TSP tổng quát không có hệ số hằng nào trừ khi P = NP, còn 3-SAT là câu hỏi có/không.',
    },
    {
      type: 'choice',
      prompt:
        'Bạn muốn chứng minh bài toán đường đi đơn dài nhất là NP-khó. Nên quy dẫn từ bài toán đã biết nào là tự nhiên nhất?',
      options: ['Đường đi ngắn nhất', 'Đường đi Hamilton', '2-SAT', 'Ghép cặp cực đại'],
      answer: 1,
      hints: ['Một đường đi gồm n − 1 cạnh không lặp đỉnh thì thăm mọi đỉnh.'],
      solution:
        'Đường đi Hamilton: G có một đường như vậy khi và chỉ khi đường đi đơn dài nhất của nó có n − 1 cạnh. Ba bài còn lại thuộc P, nên quy dẫn từ chúng không chứng minh được gì.',
    },
    {
      type: 'text',
      prompt:
        'TSP tổng quát không có phép xấp xỉ hệ số hằng nào trừ khi P = NP. Chứng minh đó quy dẫn từ bài toán NP-đầy đủ nào?',
      accept: [
        'chu trình Hamilton',
        'chu trình Hamiltonian',
        'Hamilton',
        'Hamiltonian cycle',
        'Hamilton cycle',
        'Hamiltonian circuit',
        'ham cycle',
        'HAM-CYCLE',
      ],
      hints: ['Đọc lí do trên thẻ “TSP tổng quát”.'],
      solution:
        'Chu trình Hamilton: chi phí 1 trên các cạnh của G và một chi phí rất lớn ở mọi chỗ khác. Một phép xấp xỉ trong hệ số đó sẽ tìm được hành trình chi phí n khi và chỉ khi G có chu trình Hamilton.',
    },
    {
      type: 'choice',
      prompt:
        'Bạn phải phủ một đồ thị một triệu đỉnh trong vòng một giây, và gấp đôi tối ưu vẫn chấp nhận được. Bạn dùng gì?',
      options: [
        'Cây tìm kiếm bị chặn, vì phủ đỉnh là FPT.',
        'Vét cạn qua mọi tập con.',
        'Cả hai đầu của một ghép cặp tối đại.',
        'Không cách nào dùng được, vì phủ đỉnh là NP-đầy đủ.',
      ],
      answer: 2,
      hints: ['Chính xác hay xấp xỉ: cách nào chạy trong thời gian tuyến tính và có bảo đảm?'],
      solution:
        'Quy tắc ghép cặp chạy trong O(V + E) và không bao giờ tệ hơn gấp đôi tối ưu. Cây tìm kiếm chỉ nhanh khi kích thước tập phủ k nhỏ.',
    },
    {
      type: 'order',
      prompt:
        'Sắp xếp các bài sau theo mức độ độ lớn của các con số ảnh hưởng tới thuật toán chính xác tốt nhất đã biết, từ không ảnh hưởng tới ảnh hưởng nhiều nhất.',
      items: [
        'Cái túi 0/1 với khối lượng bất kì',
        'Cái túi phân số',
        'Cái túi 0/1 với giới hạn khối lượng W không quá 1000',
      ],
      answer: [1, 2, 0],
      hints: [
        'Cái túi phân số giải bằng tham lam. Giới hạn khối lượng nhỏ cho phép lập bảng với mỗi khối lượng một cột.',
      ],
      solution:
        'Cái túi phân số giải bằng tham lam trong O(n log n), bất kể các con số. Khi W ≤ 1000, bảng quy hoạch động có cỡ O(n · W), đa thức chỉ vì W nhỏ. Với khối lượng bất kì, bảng đó có thể lớn theo hàm mũ của kích thước đầu vào, và cái túi 0/1 là NP-khó.',
    },
  ],
  nextTeaser:
    'Bài sau quay về cấu trúc dữ liệu: heap nhị thức và heap Fibonacci hợp nhất và giảm khoá nhanh hơn heap thường.',
};
