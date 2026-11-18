export const vi = {
  slug: 'review-core-lesson',
  topic: 'review-core',
  level: 'Nâng cao',
  title: 'Ôn tập: thuật toán cốt lõi',
  intro:
    'Bài trắc nghiệm này trộn câu hỏi từ mọi chương của phần thuật toán cốt lõi: đường đi ngắn nhất, DSU (cấu trúc các tập rời nhau), cây khung nhỏ nhất (MST), đồ thị nâng cao, chia để trị (divide and conquer), thuật toán tham lam (greedy), quy hoạch động (dynamic programming), quay lui (backtracking) và cây tìm kiếm cân bằng. Nhiều câu mô tả một bài toán rồi hỏi thuật toán hay mô hình giải nào hợp với nó, vì nhận ra hình dạng của bài toán chính là kĩ năng mà các chương này rèn luyện; các câu còn lại yêu cầu em tự chạy tay một thuật toán.',
  summary:
    'Bài trắc nghiệm tổng hợp cho cả phần thuật toán cốt lõi: chọn thuật toán đồ thị, nhận ra mô hình giải từ đề bài, và ôn lại cây tìm kiếm cân bằng.',
  instruction:
    'Trả lời từng câu rồi bấm Kiểm tra. Trả lời sai thì em biết ngay. Hãy mở từng gợi ý một; sau lần thử đầu tiên là đọc được lời giải đầy đủ. Câu đã giải giữ dấu tích trong trình duyệt này.',
  practiceTitle: 'Trắc nghiệm phần thuật toán cốt lõi',
  takeaways: [
    'Để trọng số cạnh chọn thuật toán đường đi ngắn nhất: mọi cạnh như nhau thì dùng BFS, chỉ có 0 và 1 thì dùng deque (hàng đợi hai đầu), không âm thì dùng Dijkstra, có cạnh âm thì dùng Bellman-Ford, còn trên DAG chỉ cần một lượt theo thứ tự tô-pô.',
    'Đọc đề để nhận ra mô hình giải: hai nửa độc lập gợi ý chia để trị, một lựa chọn chứng minh được là an toàn gợi ý tham lam, các bài toán con gối nhau (overlapping subproblems) gợi ý quy hoạch động, còn “liệt kê mọi cách sắp xếp hợp lệ” gợi ý quay lui.',
    'Tham lam phải được chứng minh, không được mặc nhiên coi là đúng. Chọn hoạt động kết thúc sớm nhất và bài toán cái túi dạng phân số là an toàn, còn cùng quy tắc giá trị trên khối lượng đó lại sai với bài toán cái túi 0/1.',
    'Các cây cân bằng giữ chiều cao ở mức O(log n) theo nhiều cách: cây AVL chặn chênh lệch chiều cao của cây con, cây đỏ đen dùng luật tô màu, cây B dùng nút rộng cho ổ đĩa, còn treap và skip list dùng tính ngẫu nhiên.',
    'Thử xem: cố ý trả lời sai một câu thuộc chương em thấy yếu nhất, đọc gợi ý đầu tiên và xem nó có đủ để tìm ra đáp án mà không cần lời giải hay không.',
  ],
  complexityHead: ['Cấu trúc hoặc thuật toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Dijkstra với heap nhị phân',
      'O((V + E) log V)',
      'Mỗi đỉnh được chốt một lần và mỗi cạnh có thể đẩy một mục vào heap; trọng số phải không âm.',
    ],
    [
      'BFS 0-1; nới lỏng cạnh trên DAG theo thứ tự tô-pô',
      'O(V + E)',
      'Một deque hoặc một thứ tự đỉnh cố định thay cho heap, nên không cần thêm thừa số log.',
    ],
    [
      'Bellman-Ford',
      'O(VE)',
      'V − 1 vòng nới lỏng mọi cạnh; nếu thêm một vòng nữa mà vẫn giảm được một khoảng cách thì chắc chắn có chu trình âm.',
    ],
    [
      'Floyd-Warshall',
      'O(V³) thời gian, O(V²) bộ nhớ',
      'Ba vòng lặp lồng nhau thử mọi đỉnh k làm điểm trung gian cho mọi cặp đỉnh.',
    ],
    [
      'Thuật toán Johnson',
      'O(VE + V(V + E) log V)',
      'Một lần Bellman-Ford tìm thế năng để khử trọng số âm, rồi chạy Dijkstra từ từng đỉnh.',
    ],
    [
      'DSU với hợp theo hạng và nén đường đi',
      'O(α(n)) khấu hao',
      'Hàm Ackermann ngược không vượt quá 4 với mọi n vừa bộ nhớ.',
    ],
    [
      'Kruskal; Prim dùng heap; Prim dùng mảng',
      'O(E log E); O((V + E) log V); O(V²)',
      'Chi phí của Kruskal nằm ở việc sắp xếp các cạnh, còn Prim dạng mảng hợp với đồ thị dày.',
    ],
    [
      'Tarjan tìm thành phần liên thông mạnh, tìm cầu, Hierholzer',
      'O(V + E)',
      'Một lần DFS hoặc một lần đi dùng mỗi cạnh một số lần không đổi.',
    ],
    [
      'Chia để trị kiểu trộn (đếm nghịch thế, cặp điểm gần nhất)',
      'O(n log n)',
      'T(n) = 2T(n/2) + O(n): log₂ n tầng, mỗi tầng làm lượng việc tuyến tính.',
    ],
    [
      'Karatsuba; Strassen',
      'O(n^1.585); O(n^2.807)',
      'Ba phép nhân đệ quy thay cho bốn, và bảy thay cho tám, làm thay đổi kết quả của định lí thợ.',
    ],
    [
      'Quickselect; trung vị của các trung vị',
      'O(n) kì vọng; O(n) trường hợp xấu nhất',
      'Chỉ tìm tiếp ở một phía của phép phân hoạch, nên lượng việc tạo thành một cấp số nhân giảm dần.',
    ],
    [
      'Lập lịch các đoạn; mã Huffman',
      'O(n log n)',
      'Sắp xếp theo thời điểm kết thúc, hoặc một heap chứa n kí hiệu, là bước duy nhất vượt mức tuyến tính.',
    ],
    [
      'QHĐ dạng bảng: khoảng cách sửa; cái túi 0/1',
      'O(nm); O(nW)',
      'Chi phí bằng số trạng thái nhân số công thức chuyển. O(nW) của bài toán cái túi là giả đa thức, vì W là một con số chứ không phải độ dài đầu vào.',
    ],
    [
      'Quay lui',
      'Hàm mũ trong trường hợp xấu nhất',
      'Cây tìm kiếm có thể chứa mọi cách sắp xếp; cắt tỉa bớt được nhánh nhưng hiếm khi thay đổi cận của trường hợp xấu nhất.',
    ],
    [
      'AVL, đỏ đen, treap (kì vọng), skip list (kì vọng)',
      'O(log n)',
      'Mỗi loại giữ chiều cao hoặc số tầng ở mức logarit, nên mọi thao tác chỉ đi trên một đường ngắn.',
    ],
    [
      'Cây B bậc m',
      'O(log_m n) lần đọc nút',
      'Nút rộng giữ cho cây rất thấp, nên chỉ cần ít lần đọc ổ đĩa chậm.',
    ],
  ],
  nextTeaser:
    'Bài sau mở đầu phần chủ đề nâng cao với sparse table (bảng thưa): dựng trước một lần trong O(n log n), rồi trả lời mỗi truy vấn giá trị nhỏ nhất trên đoạn chỉ trong O(1).',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'multi',
      prompt:
        'Đường đi ngắn nhất. Một đồ thị có hướng có vài cạnh âm nhưng không có chu trình âm. Những cách nào cho đường đi ngắn nhất đúng?',
      options: [
        'Dijkstra không bao giờ xét lại đỉnh đã chốt',
        'Bellman-Ford',
        'Floyd-Warshall',
        'Thuật toán Johnson',
        'BFS thông thường đếm số cạnh',
      ],
      answers: [1, 2, 3],
      hints: [
        'Chứng minh của Dijkstra cần khoảng cách đã chốt không bao giờ giảm được nữa.',
        'Johnson đổi trọng số các cạnh trước để không cạnh nào âm.',
      ],
      solution:
        'Bellman-Ford và Floyd-Warshall cho phép cạnh âm miễn là không có chu trình âm, còn Johnson khử cạnh âm bằng thế năng trước khi chạy Dijkstra. Dijkstra chốt một lần có thể chốt một khoảng cách mà một cạnh âm phía sau lẽ ra còn giảm được, còn BFS thì bỏ qua trọng số hoàn toàn.',
    },
    {
      type: 'choice',
      prompt:
        'Đường đi ngắn nhất. Tỉ giá giữa các loại tiền tạo thành một đồ thị có hướng. Với trọng số cạnh −log(rate), em muốn biết có vòng giao dịch nào sinh lời không. Thuật toán nào phù hợp?',
      options: [
        'Dijkstra từ mọi loại tiền',
        'Bellman-Ford, rồi thêm một vòng nới lỏng cạnh nữa',
        'BFS từ mọi loại tiền',
        'Kruskal trên các tỉ giá',
      ],
      answer: 1,
      hints: [
        'Một vòng sinh lời có tích tỉ giá lớn hơn 1. Khi đó tổng các trọng số −log sẽ ra sao?',
        'Thuật toán nào phát hiện được chu trình âm?',
      ],
      solution:
        'Một vòng có tích lớn hơn 1 thì tổng −log(rate) là số âm, tức nó là một chu trình âm. Bellman-Ford nới lỏng (relax) mọi cạnh V − 1 lần; nếu thêm một vòng nữa vẫn giảm được một khoảng cách thì có chu trình âm. Dijkstra không đúng khi có trọng số âm.',
    },
    {
      type: 'order',
      prompt:
        'Đường đi ngắn nhất. Các cạnh có hướng: A→B 7, A→C 2, C→B 3, C→D 8, B→D 1, D→E 2, B→E 9. Sắp các đỉnh theo thứ tự Dijkstra chốt chúng khi xuất phát từ A.',
      items: ['A', 'B', 'C', 'D', 'E'],
      answer: [0, 2, 1, 3, 4],
      hints: [
        'Dijkstra luôn chốt đỉnh chưa chốt có khoảng cách tạm thời nhỏ nhất.',
        'Sau khi chốt C, khoảng cách của B giảm từ 7 xuống 5.',
      ],
      solution:
        'Khoảng cách cuối cùng là A 0, C 2, B 5 (qua C), D 6 (qua B) và E 8 (qua D). Dijkstra chốt các đỉnh theo khoảng cách tăng dần, nên thứ tự là A, C, B, D, E.',
    },
    {
      type: 'choice',
      prompt:
        'Đường đi ngắn nhất. Trên một lưới, đi qua ô trống tốn 0 còn phá một bức tường tốn 1. Em muốn phá ít tường nhất để đi từ điểm xuất phát đến đích trong O(V + E). Cách nào phù hợp?',
      options: [
        'BFS thông thường với một queue',
        'Floyd-Warshall',
        'Bellman-Ford',
        'BFS 0-1 với deque: cạnh 0 vào đầu deque, cạnh 1 vào cuối deque',
      ],
      answer: 3,
      hints: [
        'BFS thông thường coi mọi cạnh như nhau.',
        'Cấu trúc cần giữ các đỉnh theo thứ tự khoảng cách, mỗi lúc chỉ có hai giá trị khoảng cách khác nhau.',
      ],
      solution:
        'Khi trọng số chỉ là 0 và 1, deque luôn được sắp theo khoảng cách nếu cạnh 0 vào đầu deque và cạnh 1 vào cuối deque. Cách này cho đúng thứ tự của Dijkstra mà không cần heap, trong O(V + E). BFS thông thường sẽ đếm số bước đi chứ không đếm số tường.',
    },
    {
      type: 'number',
      prompt:
        'Đường đi ngắn nhất. Các công việc của một dự án tạo thành một DAG, thời lượng tính bằng ngày ghi trên các cạnh: A→B 3, A→C 2, B→D 4, C→D 6, D→E 1. Đường đi dài nhất từ A đến E, tức thời gian dự án cần, dài bao nhiêu?',
      answer: 9,
      unit: 'ngày',
      hints: [
        'Nới lỏng các cạnh theo thứ tự tô-pô, giữ giá trị lớn nhất thay vì nhỏ nhất.',
        'Đường dài nhất đến D là số lớn hơn giữa 3 + 4 và 2 + 6.',
      ],
      solution:
        'Theo thứ tự tô-pô A, B, C, D, E: B = 3, C = 2, D = max(3 + 4, 2 + 6) = 8, E = 8 + 1 = 9. Tìm đường đi dài nhất là bài khó trên đồ thị tổng quát, nhưng DAG không có chu trình, nên một lượt theo thứ tự tô-pô là đủ.',
    },
    {
      type: 'text',
      prompt:
        'Đường đi ngắn nhất. A* chắc chắn trả về đường đi tối ưu khi hàm ước lượng h(n) của nó không bao giờ đánh giá quá chi phí thật còn lại. Hàm ước lượng như vậy được gọi là gì?',
      accept: [
        'chấp nhận được',
        'hàm ước lượng chấp nhận được',
        'admissible',
        'an admissible heuristic',
        'admissible heuristic',
      ],
      hints: [
        'Đó không phải “nhất quán”, vốn là điều kiện mạnh hơn theo kiểu bất đẳng thức tam giác.',
        'Cụm từ gồm ba chữ, bắt đầu bằng “chấp”.',
      ],
      solution:
        'Hàm ước lượng không bao giờ đánh giá quá được gọi là chấp nhận được. Tính nhất quán, h(u) ≤ w(u, v) + h(v), mạnh hơn: nó còn bảo đảm không đỉnh nào phải mở lại. Với h = 0, A* chính là Dijkstra.',
    },
    {
      type: 'number',
      prompt:
        'DSU. Các đỉnh từ 1 đến 8 ban đầu đứng riêng. Thêm lần lượt các cạnh (1, 2), (3, 4), (2, 3), (5, 6), (1, 4). Còn lại bao nhiêu thành phần liên thông?',
      answer: 4,
      unit: 'thành phần',
      hints: [
        'Mỗi phép hợp nối hai tập khác nhau làm số thành phần giảm đi một.',
        'Khi cạnh (1, 4) đến, 1 và 4 đã có chung gốc.',
      ],
      solution:
        'Bốn cạnh đầu mỗi cạnh gộp hai tập, nên số thành phần giảm từ 8 xuống 4: {1, 2, 3, 4}, {5, 6}, {7}, {8}. Cạnh (1, 4) thấy hai đầu có cùng gốc, nên không gộp gì; đó là cạnh khép kín một chu trình.',
    },
    {
      type: 'number',
      prompt:
        'DSU. Dùng hợp theo hạng (union by rank) mà không nén đường đi, trong đó một phần tử đứng riêng có hạng 0. Bắt đầu từ 16 phần tử riêng lẻ, hạng lớn nhất mà một gốc có thể đạt là bao nhiêu?',
      answer: 4,
      hints: [
        'Hạng chỉ tăng khi nối hai gốc có cùng hạng.',
        'Một gốc hạng r có ít nhất 2^r phần tử bên dưới, tính cả chính nó.',
      ],
      solution:
        'Hạng r cần ít nhất 2^r phần tử, nên 16 = 2⁴ phần tử cho phép đạt hạng 4, bằng cách nối từng cặp bằng hạng: 8 gốc hạng 1, 4 gốc hạng 2, 2 gốc hạng 3, rồi 1 gốc hạng 4. Vì vậy một lần find tốn nhiều nhất O(log n) ngay cả khi chưa thêm nén đường đi.',
    },
    {
      type: 'number',
      prompt:
        'Cây khung. Một đồ thị vô hướng có các cạnh A–B 1, B–C 2, A–C 3, C–D 4, B–D 5, D–E 6, C–E 7. Tổng trọng số cây khung nhỏ nhất của nó là bao nhiêu?',
      answer: 13,
      hints: [
        'Chạy Kruskal: lấy các cạnh theo trọng số tăng dần và bỏ qua cạnh nào sẽ khép kín chu trình.',
        'A–C 3 và B–D 5 bị bỏ qua.',
      ],
      solution:
        'Kruskal lấy A–B 1 và B–C 2, bỏ A–C 3 (tạo chu trình), lấy C–D 4, bỏ B–D 5, và lấy D–E 6. Được V − 1 = 4 cạnh với tổng 1 + 2 + 4 + 6 = 13.',
    },
    {
      type: 'multi',
      prompt:
        'Cây khung. Một đồ thị vô hướng liên thông có mọi trọng số cạnh khác nhau. Những phát biểu nào về cây khung nhỏ nhất của nó là đúng?',
      options: [
        'Cạnh nhẹ nhất đi qua một lát cắt bất kì luôn thuộc cây',
        'Cạnh nặng nhất trên một chu trình bất kì không thuộc cây',
        'Đường đi trên cây giữa hai đỉnh luôn là đường đi ngắn nhất giữa chúng',
        'Cây có đúng V − 1 cạnh',
        'Cộng 1 vào mọi trọng số cạnh có thể làm thay đổi các cạnh được chọn',
      ],
      answers: [0, 1, 3],
      hints: [
        'Hai phát biểu đầu là tính chất lát cắt và tính chất chu trình.',
        'Kruskal chỉ quan tâm đến thứ tự của các trọng số.',
      ],
      solution:
        'Tính chất lát cắt và tính chất chu trình đều đúng, và mọi cây khung đều có V − 1 cạnh. MST làm nhỏ nhất tổng trọng số, không phải từng đường đi, nên đường đi trên cây chưa chắc ngắn nhất. Cộng 1 vào mọi trọng số giữ nguyên thứ tự của chúng, nên Kruskal chọn đúng các cạnh cũ.',
    },
    {
      type: 'choice',
      prompt:
        'Cây khung. Em cần nối 5000 điểm, và có thể kéo cáp giữa hai điểm bất kì, nên đồ thị là đồ thị đầy đủ. Cách cài đặt nào phù hợp nhất?',
      options: [
        'Dijkstra với heap nhị phân',
        'Prim với một mảng thường, O(V²)',
        'Kruskal, sắp xếp toàn bộ các cạnh',
        'Bellman-Ford',
      ],
      answer: 1,
      hints: [
        'Đồ thị đầy đủ 5000 đỉnh có khoảng 12,5 triệu cạnh.',
        'So sánh V² với E log E trên các con số đó.',
      ],
      solution:
        'Với E ≈ V²/2, Prim dạng mảng tốn khoảng V² = 25 triệu bước. Kruskal phải sắp xếp 12,5 triệu cạnh, cỡ 300 triệu phép so sánh. Kruskal mạnh trên đồ thị thưa, còn Dijkstra và Bellman-Ford giải một bài toán khác.',
    },
    {
      type: 'choice',
      prompt:
        'Đồ thị nâng cao. Trong một mạng máy chủ, em cần tìm mọi sợi cáp mà nếu một mình nó hỏng thì mạng bị tách làm hai. Thuật toán nào phù hợp?',
      options: [
        'Tìm cầu bằng giá trị low của DFS',
        'Thuật toán Kosaraju tìm thành phần liên thông mạnh',
        'Sắp xếp tô-pô',
        'Cây khung nhỏ nhất',
      ],
      answer: 0,
      hints: [
        'Một cạnh vô hướng mà xoá đi làm đồ thị mất liên thông có một tên gọi riêng.',
        'Trong cây DFS, có cạnh ngược nào leo vượt qua cạnh cây đó không?',
      ],
      solution:
        'Cạnh như vậy là một cầu. DFS tính tin và low cho từng đỉnh, và cạnh cây (u, v) là cầu khi low[v] > tin[u], nghĩa là không gì bên dưới v quay ngược lên được u hay cao hơn. Chỉ cần một lần DFS, nên tốn O(V + E).',
    },
    {
      type: 'number',
      prompt:
        'Đồ thị nâng cao. Một đồ thị có hướng có các cạnh A→B, B→C, C→A, C→D, D→E, E→D, E→F. Nó có bao nhiêu thành phần liên thông mạnh?',
      answer: 3,
      unit: 'thành phần',
      hints: [
        'Hai đỉnh chung một thành phần khi mỗi đỉnh đều đi tới được đỉnh kia.',
        'A, B, C tạo thành một chu trình, D và E cũng vậy. F có quay lại được không?',
      ],
      solution:
        'Các thành phần là {A, B, C}, {D, E} và {F}: A, B, C tạo thành chu trình, D và E đi tới được nhau, còn F không có cạnh đi ra. Rút gọn chúng cho DAG {A, B, C} → {D, E} → {F}.',
    },
    {
      type: 'choice',
      prompt:
        'Đồ thị nâng cao. Một bản đồ phố vô hướng, liên thông có năm ngã rẽ với bậc 4, 3, 3, 2, 2. Một xe quét đường muốn đi qua mỗi con phố đúng một lần. Điều gì làm được?',
      options: [
        'Một hành trình khép kín quay về điểm xuất phát',
        'Không có đường đi lẫn hành trình khép kín',
        'Một đường đi bắt đầu và kết thúc ở hai ngã rẽ bậc 3, nhưng không có hành trình khép kín',
        'Một đường đi từ ngã rẽ bất kì đến ngã rẽ bất kì khác',
      ],
      answer: 2,
      hints: [
        'Đếm số ngã rẽ có bậc lẻ.',
        'Mỗi lần đi qua một ngã rẽ dùng hai con phố của nó, nên chỉ hai đầu của đường đi mới có thể có bậc lẻ.',
      ],
      solution:
        'Một đồ thị liên thông có chu trình Euler khi không đỉnh nào có bậc lẻ, và có đường đi Euler khi có đúng hai đỉnh bậc lẻ. Ở đây hai ngã rẽ có bậc 3, nên có đường đi, và nó phải bắt đầu ở một ngã rẽ và kết thúc ở ngã rẽ kia. Thuật toán Hierholzer dựng nó trong O(E).',
    },
    {
      type: 'choice',
      prompt:
        'Đồ thị nâng cao. Trong đồ thị kéo theo của bài toán 2-SAT, mệnh đề (a ∨ b) thêm những cạnh nào?',
      options: ['a → b và b → a', '¬a → ¬b và ¬b → ¬a', 'a → ¬b và b → ¬a', '¬a → b và ¬b → a'],
      answer: 3,
      hints: [
        'Nếu a sai, điều gì phải đúng để mệnh đề vẫn thoả mãn?',
        'Mỗi mệnh đề cho một phép kéo theo và phép phản đảo của nó.',
      ],
      solution:
        'Nếu a sai thì b phải đúng, và nếu b sai thì a phải đúng. Vậy các cạnh là ¬a → b và ¬b → a. Công thức không thoả mãn được khi và chỉ khi có một x mà x và ¬x nằm chung một thành phần liên thông mạnh.',
    },
    {
      type: 'text',
      prompt:
        'Chia để trị. Giải T(n) = 4T(n/2) + n bằng định lí thợ. Viết đáp án bằng kí hiệu O lớn.',
      accept: ['O(n²)', 'O(n^2)', 'Θ(n²)', 'theta(n^2)', 'n²', 'n^2', 'O(n*n)'],
      hints: [
        'Ở đây a = 4 và b = 2, nên hãy so f(n) = n với n^(log₂ 4).',
        'Phần nào lớn hơn: lượng việc ở các lá hay lượng việc ở gốc?',
      ],
      solution:
        'n^(log₂ 4) = n², tăng nhanh hơn f(n) = n, nên các lá chiếm ưu thế và T(n) = O(n²). Karatsuba thắng nhờ giảm a từ 4 xuống 3, cho O(n^(log₂ 3)) ≈ O(n^1.585).',
    },
    {
      type: 'number',
      prompt:
        'Chia để trị. Mảng [3, 1, 4, 1, 5, 9, 2, 6] có bao nhiêu nghịch thế, tức cặp i < j mà a[i] > a[j]?',
      answer: 8,
      unit: 'nghịch thế',
      hints: [
        'Với mỗi phần tử, đếm các phần tử nhỏ hơn nằm bên phải nó. Các phần tử bằng nhau không tính.',
        'Số 3 đếm được 1, 1 và 2, tức 3 nghịch thế.',
      ],
      solution:
        'Xét từng phần tử từ trái sang: 3 → 3, 1 → 0, 4 → 2, 1 → 0, 5 → 1, 9 → 2, 2 → 0, 6 → 0, tổng cộng 8. Merge sort (sắp xếp trộn) đếm đúng con số này trong O(n log n): mỗi khi lấy từ nửa phải, mọi phần tử còn lại ở nửa trái tạo thành một nghịch thế.',
    },
    {
      type: 'choice',
      prompt:
        'Chia để trị. Em chỉ cần trung vị của 1 000 000 số chưa sắp xếp, một lần duy nhất, trong thời gian kì vọng tuyến tính. Cách nào phù hợp?',
      options: [
        'Merge sort, rồi đọc phần tử giữa',
        'Một cây tìm kiếm cân bằng chứa mọi số',
        'Quickselect: phân hoạch, rồi đệ quy vào phía chứa thứ hạng cần tìm',
        'Tìm kiếm nhị phân trên mảng chưa sắp xếp',
      ],
      answer: 2,
      hints: [
        'Sắp xếp làm nhiều việc hơn câu hỏi cần.',
        'Sau một lần phân hoạch, thứ hạng cuối cùng của chốt (pivot) cho biết phía nào mới quan trọng.',
      ],
      solution:
        'Quickselect phân hoạch quanh một chốt ngẫu nhiên và chỉ đi tiếp ở phía chứa thứ hạng cần tìm, nên lượng việc kì vọng là n + n/2 + n/4 + … = O(n). Phương pháp trung vị của các trung vị chọn chốt sao cho cận O(n) đúng cả trong trường hợp xấu nhất.',
    },
    {
      type: 'multi',
      prompt:
        'Tham lam. Những quy tắc tham lam nào dưới đây luôn cho đáp án tối ưu trên bài toán của nó?',
      options: [
        'Lập lịch các đoạn: lấy hoạt động kết thúc sớm nhất',
        'Lập lịch các đoạn: lấy hoạt động bắt đầu sớm nhất',
        'Cái túi dạng phân số: lấy món có giá trị trên khối lượng tốt nhất trước',
        'Cái túi 0/1: lấy món có giá trị trên khối lượng tốt nhất trước',
        'Mã Huffman: gộp hai kí hiệu có tần suất nhỏ nhất',
        'Ít đồng xu nhất với mệnh giá {1, 3, 4}: lấy đồng lớn nhất còn vừa',
      ],
      answers: [0, 2, 4],
      hints: [
        'Lập luận hoán đổi có hiệu lực khi việc đổi sang lựa chọn tham lam không bao giờ làm kết quả tệ đi.',
        'Mệnh giá {1, 3, 4} với số tiền 6: so 4 + 1 + 1 với 3 + 3.',
      ],
      solution:
        'Kết thúc sớm nhất, giá trị trên khối lượng ở dạng phân số và cách gộp của Huffman đều có chứng minh bằng lập luận hoán đổi. Bắt đầu sớm nhất thất bại khi một hoạt động dài chặn nhiều hoạt động ngắn, cái túi 0/1 theo tỉ số có thể để thừa sức chứa, còn mệnh giá {1, 3, 4} tạo 6 bằng 3 + 3 chứ không phải 4 + 1 + 1.',
    },
    {
      type: 'number',
      prompt:
        'Tham lam. Các hoạt động (bắt đầu, kết thúc): (1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11), (8, 12), (2, 14), (12, 16). Một hoạt động được bắt đầu ngay khi hoạt động khác vừa kết thúc. Một phòng chứa được nhiều nhất bao nhiêu hoạt động?',
      answer: 4,
      unit: 'hoạt động',
      hints: [
        'Sắp xếp theo thời điểm kết thúc, rồi giữ mỗi hoạt động bắt đầu không sớm hơn thời điểm kết thúc cuối cùng.',
        'Lựa chọn đầu tiên là (1, 4), tiếp theo là (5, 7).',
      ],
      solution:
        'Chọn kết thúc sớm nhất lấy (1, 4), (5, 7), (8, 11), (12, 16), tức 4 hoạt động. Lập luận hoán đổi cho thấy mọi lịch tối ưu đều có thể đổi hoạt động đầu tiên của nó thành hoạt động kết thúc sớm nhất, nên tham lam không bao giờ tệ hơn.',
    },
    {
      type: 'number',
      prompt:
        'Tham lam. Sáu kí hiệu có tần suất a 45, b 13, c 12, d 16, e 9, f 5. Mã Huffman dùng tổng cộng bao nhiêu bit, tính tổng tần suất × độ dài mã?',
      answer: 224,
      unit: 'bit',
      hints: [
        'Lặp lại việc gộp hai giá trị nhỏ nhất. Lần gộp đầu là 5 + 9 = 14.',
        'Tổng cần tìm bằng tổng mọi trọng số sau khi gộp.',
      ],
      solution:
        'Các lần gộp là 5 + 9 = 14, 12 + 13 = 25, 14 + 16 = 30, 25 + 30 = 55 và 45 + 55 = 100. Mỗi lần gộp thêm một bit vào mọi kí hiệu bên dưới nó, nên tổng là 14 + 25 + 30 + 55 + 100 = 224 bit, so với 300 bit của mã cố định 3 bit.',
    },
    {
      type: 'number',
      prompt:
        'Quy hoạch động. Bài toán cái túi 0/1 có sức chứa 50 và các món (khối lượng, giá trị): (10, 60), (20, 100), (30, 120). Tổng giá trị tốt nhất là bao nhiêu?',
      answer: 220,
      hints: [
        'Chọn theo giá trị trên khối lượng sẽ lấy hai món đầu được 160, và món thứ ba không còn vừa.',
        'Thử mọi tập con có tổng khối lượng không quá 50.',
      ],
      solution:
        'Tập con tốt nhất là (20, 100) và (30, 120), khối lượng 50 và giá trị 220. Tham lam theo tỉ số dừng ở 160, nên dạng 0/1 cần QHĐ theo sức chứa trong O(nW). Nếu được cắt nhỏ các món, đáp án dạng phân số sẽ là 240.',
    },
    {
      type: 'number',
      prompt:
        'Quy hoạch động. Khoảng cách sửa (chèn, xoá, thay thế, mỗi phép tốn 1) từ “kitten” đến “sitting” là bao nhiêu?',
      answer: 3,
      unit: 'phép sửa',
      hints: [
        'So hai từ theo từng chữ cái: k/s và e/i khác nhau.',
        '“sitting” dài hơn một chữ cái.',
      ],
      solution:
        'kitten → sitten (thay k) → sittin (thay e) → sitting (chèn g), tức 3 phép sửa. Ít hơn là không thể: bảng trên mọi cặp tiền tố tìm ra 3 trong thời gian O(nm).',
    },
    {
      type: 'number',
      prompt:
        'Quy hoạch động. Nhân các ma trận A (10 × 30), B (30 × 5) và C (5 × 60). Tích ABC cần ít nhất bao nhiêu phép nhân số?',
      answer: 4500,
      unit: 'phép nhân',
      hints: [
        'Có hai cách đặt ngoặc: (AB)C và A(BC).',
        'Nhân ma trận p × q với ma trận q × r tốn p · q · r phép nhân.',
      ],
      solution:
        '(AB)C tốn 10 · 30 · 5 + 10 · 5 · 60 = 1500 + 3000 = 4500, còn A(BC) tốn 30 · 5 · 60 + 10 · 30 · 60 = 9000 + 18 000 = 27 000. QHĐ trên đoạn thử mọi điểm chia k cho mọi đoạn, điền bảng theo độ dài đoạn.',
    },
    {
      type: 'order',
      prompt: 'Quy hoạch động. Sắp các bước của khung SRTBOT theo đúng thứ tự.',
      items: [
        'B: trường hợp cơ sở',
        'O: bài toán ban đầu',
        'R: quan hệ giữa các bài toán con',
        'S: các bài toán con',
        'T: phân tích thời gian',
        'T: thứ tự tô-pô',
      ],
      answer: [3, 2, 5, 0, 1, 4],
      hints: [
        'Các chữ cái ghép thành S, R, T, B, O, T.',
        'Chữ T đầu tiên nói giải các bài toán con theo thứ tự nào; chữ T cuối cùng nói chi phí là bao nhiêu.',
      ],
      solution:
        'Bài toán con, quan hệ, thứ tự tô-pô, trường hợp cơ sở, bài toán ban đầu, thời gian. Mỗi đáp án cần một trạng thái được định nghĩa rõ, rồi cách nó dựng lên từ các trạng thái nhỏ hơn, rồi một thứ tự bảo đảm các trạng thái đó đã có sẵn.',
    },
    {
      type: 'number',
      prompt:
        'Quay lui. Trên bàn cờ 6 × 6, có bao nhiêu cách đặt 6 quân hậu sao cho không hai quân nào ăn được nhau? Các cách xoay và lật được tính là khác nhau.',
      answer: 4,
      unit: 'cách',
      hints: [
        'Đặt mỗi hàng một quân hậu; quân hậu ở cột c hàng r chặn cột đó và hai đường chéo.',
        'r + c và r − c xác định các đường chéo, nên hãy chạy trên giấy hoặc bằng một chương trình ngắn.',
      ],
      solution:
        'Một lượt tìm kiếm đặt mỗi hàng một quân hậu và cắt tỉa mọi ô bị khống chế tìm ra 4 cách, ít hơn rất nhiều so với 6⁶ cách chọn cột thô. Một trong số đó đặt các quân hậu ở cột 2, 4, 6, 1, 3, 5, lần lượt theo từng hàng.',
    },
    {
      type: 'choice',
      prompt:
        'Quay lui. Trong nhánh cận (branch and bound) cho bài toán tìm giá trị lớn nhất, lời giải đầy đủ tốt nhất tìm được đến giờ có giá trị 42. Cận trên của một nút cho biết không gì bên dưới nó vượt quá 40. Lượt tìm kiếm nên làm gì?',
      options: [
        'Khám phá nút đó, vì cận có thể sai',
        'Thay giá trị tốt nhất bằng 40',
        'Hạ cận của các nút khác xuống 40',
        'Cắt tỉa nút đó mà không khám phá',
      ],
      answer: 3,
      hints: [
        'Có gì bên dưới nút này vượt được 42 không?',
        'Một cận trên hợp lệ không bao giờ thấp quá.',
      ],
      solution:
        'Mọi thứ dưới nút đều có giá trị không quá 40, thấp hơn 42 đã có trong tay, nên nhánh đó không thể cải thiện đáp án và bị cắt tỉa. Cận chặt và tìm được một lời giải tốt từ sớm là điều khiến phương pháp này nhanh.',
    },
    {
      type: 'number',
      prompt:
        'Cây cân bằng. Một nút đơn lẻ có chiều cao 1. Một cây AVL chiều cao 5 có ít nhất bao nhiêu nút?',
      answer: 12,
      unit: 'nút',
      hints: [
        'Cây thưa nhất có các cây con chiều cao h − 1 và h − 2.',
        'N(1) = 1, N(2) = 2 và N(h) = N(h − 1) + N(h − 2) + 1.',
      ],
      solution:
        'N(3) = 2 + 1 + 1 = 4, N(4) = 4 + 2 + 1 = 7, N(5) = 7 + 4 + 1 = 12. Các số này tăng giống dãy Fibonacci, cho cận chiều cao khoảng 1,44 log₂ n.',
    },
    {
      type: 'choice',
      prompt:
        'Cây cân bằng. Thêm 30, 10, 20 vào một cây AVL rỗng. Cách sửa nào khôi phục được cân bằng?',
      options: [
        'Một phép quay phải tại 30',
        'Một phép quay trái tại 10',
        'Quay trái tại 10, rồi quay phải tại 30',
        'Quay phải tại 10, rồi quay trái tại 30',
      ],
      answer: 2,
      hints: [
        '30 lệch trái, nhưng con trái 10 của nó lại lệch phải.',
        'Đó là trường hợp trái-phải, một phép quay đơn không sửa được.',
      ],
      solution:
        'Đây là trường hợp trái-phải. Quay trái tại 10 nắn thẳng đường đi thành 30, 20, 10, rồi quay phải tại 30 đưa 20 lên làm gốc với các con 10 và 30. Chỉ quay phải một lần tại 30 sẽ chỉ làm cây lệch sang phía kia.',
    },
    {
      type: 'multi',
      prompt: 'Cây cân bằng. Những phát biểu nào về cây đỏ đen là đúng?',
      options: [
        'Một nút đỏ không bao giờ có con đỏ',
        'Mọi đường đi từ gốc đến null có cùng số nút đen',
        'Hai cây con của một nút chênh nhau về chiều cao không quá 1',
        'Đường đi dài nhất từ gốc đến null dài không quá hai lần đường ngắn nhất',
        'Một lần thêm có thể cần Θ(log n) phép quay',
      ],
      answers: [0, 1, 3],
      hints: [
        'Kết hợp hai luật màu: với một số nút đen cho trước, một đường đi dài được bao nhiêu?',
        'Việc tô lại màu có thể leo lên cây, nhưng số phép quay thì ít.',
      ],
      solution:
        'Các luật màu cấm đỏ liền đỏ và cố định số nút đen, nên một đường đi nhiều nhất chỉ xen kẽ đỏ và đen, cho hệ số 2. Cân bằng chiều cao chính xác là luật của AVL. Một lần thêm tô lại màu tối đa O(log n) nút nhưng chỉ làm nhiều nhất hai phép quay.',
    },
    {
      type: 'number',
      prompt:
        'Cây cân bằng. Một cây B bậc 100, tức mỗi nút có tối đa 100 con và 99 khoá. Một cây 3 tầng chứa được nhiều nhất bao nhiêu khoá?',
      answer: 999999,
      unit: 'khoá',
      hints: ['Khi đầy, ba tầng có 1 + 100 + 10 000 nút.', 'Mỗi nút đầy chứa 99 khoá.'],
      solution:
        'Các tầng đầy có 1, 100 và 10 000 nút, tổng cộng 10 101 nút, mỗi nút 99 khoá: 10 101 × 99 = 999 999 = 100³ − 1. Một triệu khoá tới được chỉ sau 3 lần đọc nút, đó là lí do cơ sở dữ liệu dùng cây B để đánh chỉ mục trên ổ đĩa.',
    },
    {
      type: 'number',
      prompt:
        'Cây cân bằng. Một cây thống kê thứ tự lưu kích thước của các cây con. Cây con trái của gốc có kích thước 5, và em muốn tìm khoá nhỏ thứ 7. Nó nằm ở cây con phải. Ở đó cần tìm thứ hạng bao nhiêu?',
      answer: 1,
      hints: ['Chính gốc là khoá nhỏ thứ 6.', 'Lấy thứ hạng trừ đi cây con trái và gốc.'],
      solution:
        '5 khoá bên trái và gốc đứng trước, nên thứ hạng mới là 7 − 5 − 1 = 1: khoá nhỏ nhất trong cây con phải. Mỗi lần xuống một tầng, nên phép chọn tốn O(log n) trên cây cân bằng.',
    },
    {
      type: 'choice',
      prompt:
        'Cây cân bằng. Vì sao treap vẫn thấp ngay cả khi các khoá đến theo thứ tự đã sắp xếp?',
      options: [
        'Nó dựng lại từ đầu sau mỗi n lần thêm',
        'Độ ưu tiên ngẫu nhiên của mỗi khoá cố định hình dạng cây, như thể các khoá được thêm theo thứ tự ngẫu nhiên',
        'Nó giữ chênh lệch chiều cao giữa hai cây con của mọi nút không quá 1',
        'Nó sắp các khoá vào một mảng trước khi dựng cây',
      ],
      answer: 1,
      hints: [
        'Treap tuân theo luật BST trên khoá và luật heap trên độ ưu tiên.',
        'Độ ưu tiên không liên quan gì đến thứ tự các khoá đến.',
      ],
      solution:
        'Khoá và độ ưu tiên cùng nhau xác định đúng một cây: cây mà một BST thông thường sẽ dựng nếu các khoá đến theo thứ tự độ ưu tiên. Vì độ ưu tiên là ngẫu nhiên, hình dạng cây giống một BST ngẫu nhiên dù khoá đến theo thứ tự nào, nên chiều cao kì vọng là O(log n).',
    },
    {
      type: 'text',
      prompt:
        'Mô hình giải. Các bài toán con của một bài toán gối nhau, và đáp án tốt nhất cho mỗi trạng thái được dựng từ đáp án tốt nhất của các trạng thái nhỏ hơn, mỗi trạng thái giải một lần rồi lưu vào bảng. Hãy gọi tên mô hình giải này.',
      accept: ['quy hoạch động', 'QHĐ', 'dynamic programming', 'DP'],
      hints: [
        'Việc gối nhau loại trừ chia để trị thông thường, vốn có các phần độc lập.',
        'Hai cách làm của nó là đệ quy có nhớ và lập bảng.',
      ],
      solution:
        'Đó là quy hoạch động: cấu trúc con tối ưu (optimal substructure) cộng với các bài toán con gối nhau. Đệ quy có nhớ (memoization) làm từ trên xuống, lập bảng (tabulation) làm từ dưới lên, và cả hai đều giải mỗi trạng thái một lần.',
    },
    {
      type: 'choice',
      prompt:
        'Mô hình giải. Quyết định xem một xâu độ dài n có tách được thành các từ trong từ điển không, khi đáp án cho một tiền tố phụ thuộc vào các tiền tố ngắn hơn. Mô hình giải nào phù hợp?',
      options: [
        'Tham lam: luôn lấy từ khớp dài nhất',
        'Chia để trị: luôn cắt xâu làm đôi',
        'Quy hoạch động trên các tiền tố',
        'Cây khung nhỏ nhất trên các chữ cái',
      ],
      answer: 2,
      hints: [
        'Thử “aaaa” với các từ “aaa” và “aa”: lấy từ dài nhất trước sẽ lấy “aaa” rồi kẹt ở chữ “a” cuối.',
        'Nhiều cách tách khác nhau dẫn tới cùng một tiền tố, nên các bài toán con gối nhau.',
      ],
      solution:
        'Gọi ok[i] cho biết i chữ cái đầu có tách được thành các từ không; ok[i] đúng khi có một j mà ok[j] đúng và đoạn từ j đến i là một từ. Lấy dài nhất trước có thể sai: “aaaa” với “aaa” và “aa” cần “aa” + “aa”. Cắt làm đôi có thể cắt ngang một từ.',
    },
    {
      type: 'choice',
      prompt:
        'Mô hình giải. Liệt kê mọi cách giao 10 việc cho 4 người theo các luật xung đột, bỏ một phương án dở dang ngay khi nó vi phạm một luật. Mô hình giải nào phù hợp?',
      options: [
        'Quay lui: chọn, khám phá, bỏ chọn',
        'Tham lam theo độ lớn của việc',
        'Kruskal trên các xung đột',
        'Chia để trị với cận theo định lí thợ',
      ],
      answer: 0,
      hints: [
        'Đầu ra là mọi cách sắp xếp hợp lệ, không phải một giá trị tốt nhất.',
        'Bỏ một phương án dở dang chính là cắt tỉa cây tìm kiếm.',
      ],
      solution:
        'Liệt kê mọi cách sắp xếp và bỏ sớm phương án hỏng là quay lui: mở rộng một phương án dở dang, đệ quy, rồi hoàn tác lựa chọn. Một nhánh bị cắt tỉa bỏ qua mọi cách sắp xếp có chung phần đầu bị hỏng đó. Chi phí phụ thuộc vào kích thước đầu ra và là hàm mũ trong trường hợp xấu nhất.',
    },
    {
      type: 'choice',
      prompt:
        'Mô hình giải. Mỗi công việc chiếm một khung giờ, đem lại một khoản lợi nhuận và phải xong trước hạn chót của nó. Em muốn tổng lợi nhuận lớn nhất, và chứng minh được rằng giữ công việc lời nhất còn xếp vừa không bao giờ làm kết quả tệ đi. Mô hình giải nào phù hợp?',
      options: [
        'Quay lui trên mọi thứ tự của các công việc',
        'Chia để trị: giải riêng từng nửa của trục thời gian',
        'Quy hoạch động trên mọi tập công việc',
        'Tham lam: xét theo lợi nhuận giảm dần, đặt mỗi việc vào khung trống muộn nhất trước hạn chót của nó',
      ],
      answer: 3,
      hints: [
        'Đề bài đã cho sẵn chứng minh rằng một lựa chọn là an toàn.',
        'Lựa chọn an toàn thì không bao giờ phải rút lại, nên không cần tìm kiếm hay lập bảng.',
      ],
      solution:
        'Một lựa chọn được chứng minh an toàn bằng lập luận hoán đổi là dấu hiệu của tham lam: một lần sắp xếp và một lượt duyệt cho lịch tốt nhất. Quay lui và QHĐ trên các tập công việc cũng tìm ra nó, nhưng tốn thời gian hàm mũ, còn chia đôi trục thời gian bỏ qua việc một công việc có thể dùng bất kì khung giờ nào trước hạn chót của nó.',
    },
    {
      type: 'choice',
      prompt:
        'Mô hình giải. Trong một mảng 100 000 số, đếm số cặp i < j mà a[i] > 2 · a[j] trong O(n log n). Cách tiếp cận nào phù hợp?',
      options: [
        'Thuật toán Prim trên các chỉ số',
        'Chia để trị: đếm các cặp nằm ở hai nửa trong lúc merge sort',
        'Thử mọi cặp bằng hai vòng lặp lồng nhau',
        'Quay lui trên mọi tập con',
      ],
      answer: 1,
      hints: [
        'Bài này trông rất giống đếm nghịch thế.',
        'Khi cả hai nửa đã sắp xếp, hai con trỏ di chuyển đếm được các cặp chéo trong thời gian tuyến tính.',
      ],
      solution:
        'Mỗi cặp nằm trong nửa trái, trong nửa phải, hoặc vắt qua điểm chia. Đệ quy xử lí hai loại đầu; khi cả hai nửa đã sắp xếp, một con trỏ đếm các cặp chéo trong O(n) mỗi tầng, nên T(n) = 2T(n/2) + O(n) = O(n log n). Hai vòng lặp lồng nhau phải thử khoảng 5 × 10⁹ cặp.',
    },
  ],
};
