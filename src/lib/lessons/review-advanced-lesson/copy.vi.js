export const vi = {
  slug: 'review-advanced-lesson',
  topic: 'review-advanced',
  level: 'Nâng cao',
  title: 'Ôn tập: thuật toán nâng cao',
  intro:
    'Bài trắc nghiệm này trộn câu hỏi từ mọi chương của phần chủ đề nâng cao: các cấu trúc truy vấn đoạn, thuật toán trên xâu, số học, hình học, luồng trên mạng, quy hoạch động (dynamic programming) nâng cao, kĩ thuật trên cây, thuật toán đại số và ngẫu nhiên, các bài toán khó, heap nâng cao và những mô hình tính toán khác. Có câu hỏi cấu trúc hay thuật toán nào hợp với một việc, có câu hỏi đâu là giới hạn của những gì tính nhanh được, còn các câu còn lại yêu cầu bạn tự chạy tay một thuật toán.',
  summary:
    'Bài trắc nghiệm tổng hợp cho cả phần chủ đề nâng cao: chọn cấu trúc hoặc thuật toán, giới hạn của tính toán hiệu quả, và các bài tập tính tay từ mọi chương nâng cao.',
  instruction:
    'Trả lời từng câu rồi bấm Kiểm tra. Trả lời sai thì bạn biết ngay; hãy mở từng gợi ý một, và sau lần thử đầu tiên bạn có thể đọc lời giải đầy đủ. Câu đã giải giữ dấu tích trong trình duyệt này.',
  practiceTitle: 'Trắc nghiệm phần chủ đề nâng cao',
  takeaways: [
    'Để truy vấn chọn cấu trúc: bảng thưa (sparse table) cho truy vấn luỹ đẳng trên mảng tĩnh trong O(1), cây Fenwick (BIT) cho tổng tiền tố có cập nhật điểm, cây phân đoạn (segment tree) cho mọi phép gộp có tính kết hợp, và cập nhật lười (lazy propagation) khi một lần cập nhật phủ cả đoạn.',
    'Xâu được so khớp trong thời gian tuyến tính nhờ dùng lại những gì các lần so sánh trước đã biết: hàm tiền tố, khối Z, liên kết thất bại của Aho-Corasick và phép soi gương của Manacher đều tránh phải lùi lại trong văn bản.',
    'Nhiều bài toán trở thành dạng quen thuộc sau khi được mô hình hoá: mạng luồng cho bài toán phân công và lát cắt, mặt nạ bit (bitmask) cho các tập con tới khoảng 20 phần tử, đường nặng hoặc nhảy nhị phân cho truy vấn dọc đường đi trên cây.',
    'Hãy biết giới hạn: khoảng 10⁸ bước đơn giản mỗi giây quyết định độ phức tạp nào vừa sức, còn một bài toán NP-khó cần một tham số nhỏ, một thuật toán xấp xỉ hoặc một hàm ước lượng thay vì một thuật toán chính xác mà nhanh.',
    'Thử xem: chọn chương bạn thấy yếu nhất, cố ý trả lời sai một câu của chương đó, và xem gợi ý đầu tiên có đủ để bạn tìm ra đáp án mà không cần lời giải hay không.',
  ],
  complexityHead: ['Cấu trúc hoặc thuật toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Bảng thưa',
      'Dựng O(n log n), truy vấn O(1)',
      'Hai khối độ dài luỹ thừa của 2 chồng lên nhau phủ được mọi đoạn, điều này an toàn với các phép gộp luỹ đẳng như min và gcd.',
    ],
    [
      'Cây Fenwick; cây phân đoạn (có cập nhật lười)',
      'O(log n) cho mỗi lần cập nhật hoặc truy vấn',
      'Mỗi thao tác chạm một ô cho mỗi bit, hoặc một số không đổi nút ở mỗi tầng trong O(log n) tầng của cây; cập nhật lười hoãn các lần cập nhật đoạn lại.',
    ],
    [
      'Thuật toán Mo',
      'O((n + q)√n)',
      'Sắp xếp các truy vấn ngoại tuyến theo khối giữ cho cả hai đầu cửa sổ chỉ dời một quãng ngắn.',
    ],
    [
      'KMP, hàm Z, Aho-Corasick',
      'O(n + m) (cộng số lần khớp)',
      'Con trỏ trên văn bản không bao giờ lùi lại, và liên kết thất bại dùng lại phần tiền tố đã khớp.',
    ],
    [
      'Mảng hậu tố cùng LCP của Kasai; Manacher',
      'O(n log n) hoặc O(n log² n); O(n)',
      'Nhân đôi tiền tố sắp xếp theo 2ᵏ kí tự mỗi vòng; mẹo soi gương dùng lại bán kính của các xâu đối xứng trước đó.',
    ],
    [
      'Euclid, Euclid mở rộng, luỹ thừa nhanh',
      'O(log n)',
      'Số dư giảm ít nhất một nửa sau mỗi hai bước, và bình phương làm số mũ giảm một nửa.',
    ],
    [
      'Sàng Eratosthenes',
      'O(n log log n)',
      'Mỗi hợp số bị gạch một lần cho mỗi ước nguyên tố phân biệt, và Σ n/p trên các số nguyên tố p ≤ n tăng như n log log n.',
    ],
    [
      'Bao lồi; đường quét',
      'O(n log n)',
      'Bước sắp xếp các điểm hay sự kiện chiếm ưu thế; mỗi điểm vào và ra khỏi bao lồi hoặc tập đang xét một lần.',
    ],
    [
      'Edmonds-Karp; Dinic; Hopcroft-Karp',
      'O(VE²); O(V²E); O(E√V)',
      'Đường tăng luồng ngắn nhất dài dần lên, nên số pha bị chặn.',
    ],
    [
      'Held-Karp cho bài toán người du lịch',
      'O(2ⁿ n²) thời gian, O(2ⁿ n) bộ nhớ',
      'Mỗi trạng thái ứng với một tập thành phố đã thăm và thành phố cuối, và mỗi trạng thái được thử từ mọi thành phố liền trước.',
    ],
    [
      'Nhảy nhị phân; phân rã nặng nhẹ',
      'Dựng O(n log n), O(log n); O(log² n) cho mỗi truy vấn đường đi',
      'Các bước nhảy 2ᵏ phủ được mọi độ sâu, và đường đi lên gốc chỉ cắt qua O(log n) chuỗi nặng.',
    ],
    [
      'Biến đổi Fourier nhanh; luỹ thừa ma trận',
      'O(n log n); O(k³ log n)',
      'Tính giá trị tại các căn của đơn vị chia đôi bài toán ở mỗi tầng; bình phương một ma trận k × k làm số mũ giảm một nửa.',
    ],
    [
      'Heap Fibonacci; cây van Emde Boas',
      'Giảm khoá O(1) khấu hao; O(log log u)',
      'Hợp nhất lười dồn việc cho extract-min; các cụm kích thước √u làm độ dài khoá giảm một nửa ở mỗi tầng.',
    ],
    [
      'Bài toán NP-khó',
      'Chưa biết thuật toán đa thức nào',
      'Tìm kiếm chính xác nói chung tốn thời gian hàm mũ, tốn O(2ᵏ n) khi tham số k nhỏ, hoặc một thuật toán xấp xỉ đổi tính tối ưu lấy tốc độ.',
    ],
  ],
  nextTeaser:
    'Đây là bài cuối cùng của chương trình: bạn đã đi hết phần chủ đề nâng cao. Hãy quay lại bất kì chương nào bạn muốn ôn thêm.',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt:
        'Truy vấn đoạn. Một mảng 10⁶ số không bao giờ thay đổi, và bạn phải trả lời 10⁶ truy vấn giá trị nhỏ nhất trên đoạn nhanh nhất có thể. Cấu trúc nào phù hợp nhất?',
      options: [
        'Cây Fenwick, O(log n) mỗi truy vấn',
        'Bảng thưa: dựng mất O(n log n), mỗi truy vấn O(1)',
        'Chia căn, O(√n) mỗi truy vấn',
        'Một vòng lặp qua cả đoạn cho mỗi truy vấn',
      ],
      answer: 1,
      hints: [
        'Không có gì được cập nhật, nên một cấu trúc cập nhật chậm cũng không sao.',
        'Lấy min hai lần trên cùng một phần tử không gây hại gì.',
      ],
      solution:
        'Phép lấy min có tính luỹ đẳng, nên một đoạn được phủ bởi hai khối độ dài 2ᵏ chồng lên nhau, với k = ⌊log₂ độ dài⌋, và mỗi truy vấn đọc hai ô của bảng. Bảng thưa không cập nhật rẻ được, nhưng mảng này không bao giờ thay đổi.',
    },
    {
      type: 'number',
      prompt:
        'Truy vấn đoạn. Một cây Fenwick đánh chỉ số từ 1, ô i lưu tổng của lowbit(i) phần tử kết thúc tại i. Để đọc tổng của 13 phần tử đầu tiên, cần cộng bao nhiêu ô?',
      answer: 3,
      unit: 'ô',
      hints: [
        'Bắt đầu với i = 13 và lặp i ← i − lowbit(i) cho đến khi i về 0.',
        '13 viết ở hệ nhị phân là 1101.',
      ],
      solution:
        'Truy vấn thăm 13 (phủ 13), rồi 12 (phủ 9 đến 12), rồi 8 (phủ 1 đến 8), rồi dừng ở 0. Đó là 3 ô, mỗi ô ứng với một bit 1 của 13 = 1101₂, nên một truy vấn tiền tố tốn O(log n).',
    },
    {
      type: 'choice',
      prompt:
        'Truy vấn đoạn. Bạn phải cộng v vào mọi phần tử của một đoạn và cũng phải trả lời các truy vấn tổng trên đoạn, mỗi loại 10⁵ lần, xen kẽ nhau. Cấu trúc nào xử lí được cả hai trong O(log n)?',
      options: [
        'Một bảng thưa',
        'Tổng tiền tố dựng lại sau mỗi lần cập nhật',
        'Một cây phân đoạn có cập nhật lười',
        'Thuật toán Mo trên các truy vấn',
      ],
      answer: 2,
      hints: [
        'Một lần cập nhật đoạn có thể chạm tới rất nhiều phần tử; cấu trúc nào lưu một thay đổi đang chờ trên một nút thay vào đó?',
        'Thuật toán Mo làm việc ngoại tuyến trên các truy vấn không có cập nhật.',
      ],
      solution:
        'Cây phân đoạn có cập nhật lười chia đoạn cập nhật thành O(log n) nút, cộng v × độ dài vào tổng của mỗi nút và để lại một nhãn chờ, chỉ đẩy xuống khi một thao tác sau đi xuống bên dưới. Tổng tiền tố dựng lại tốn O(n) mỗi lần cập nhật, còn bảng thưa không cập nhật rẻ được.',
    },
    {
      type: 'text',
      prompt:
        'Xâu. Viết hàm tiền tố π của từ “abacaba”, mỗi vị trí một giá trị, ngăn cách bằng dấu phẩy.',
      accept: ['0,0,1,0,1,2,3', '0 0 1 0 1 2 3', '0010123', '[0,0,1,0,1,2,3]', 'π=0,0,1,0,1,2,3'],
      hints: [
        'π[i] là độ dài của tiền tố thực sự dài nhất của s[0..i] mà cũng là hậu tố của nó.',
        'Giá trị cuối đến từ việc “abacaba” kết thúc bằng “aba”, cũng chính là phần đầu của nó.',
      ],
      solution:
        'a → 0, ab → 0, aba → 1 (“a”), abac → 0, abaca → 1 (“a”), abacab → 2 (“ab”), abacaba → 3 (“aba”). Vậy π = 0, 0, 1, 0, 1, 2, 3. KMP dùng các giá trị này để trượt mẫu đi mà không phải lùi lại trong văn bản.',
    },
    {
      type: 'choice',
      prompt:
        'Xâu. Một bộ lọc phải tìm mọi lần xuất hiện của 1000 từ cấm trong một nhật kí trò chuyện dài, chỉ đọc nhật kí một lần. Thuật toán nào phù hợp?',
      options: [
        'Aho-Corasick: một trie chứa mọi từ cùng các liên kết thất bại',
        'KMP, chạy một lần cho mỗi từ',
        'Thuật toán Manacher',
        'Boyer-Moore, chạy một lần cho mỗi từ',
      ],
      answer: 0,
      hints: [
        'Chạy một thuật toán so khớp một mẫu 1000 lần thì phải đọc nhật kí 1000 lần.',
        'Thuật toán nào mở rộng hàm tiền tố cho nhiều mẫu cùng lúc?',
      ],
      solution:
        'Aho-Corasick dựng một trie chứa mọi mẫu rồi thêm các liên kết thất bại, tức hàm tiền tố tổng quát hoá lên trie. Sau đó một lượt qua nhật kí độ dài n báo mọi lần khớp trong O(n + tổng độ dài các mẫu + số lần khớp). Manacher tìm xâu đối xứng, không phải các từ cho trước.',
    },
    {
      type: 'order',
      prompt:
        'Xâu. Sắp các hậu tố của “banana” theo thứ tự mảng hậu tố liệt kê chúng, nhỏ nhất trước.',
      items: ['banana', 'anana', 'nana', 'ana', 'na', 'a'],
      answer: [5, 3, 1, 0, 4, 2],
      hints: [
        'So sánh như trong từ điển: một từ là tiền tố của từ khác thì đứng trước.',
        'Có ba hậu tố bắt đầu bằng “a”; cái ngắn nhất trong số đó đứng trước.',
      ],
      solution:
        'Sau khi sắp xếp: a, ana, anana, banana, na, nana. Vị trí bắt đầu của chúng cho mảng hậu tố 5, 3, 1, 0, 4, 2. Mọi xâu con đều là tiền tố của một hậu tố nào đó, nên danh sách đã sắp xếp này trả lời được nhiều câu hỏi về xâu con bằng tìm kiếm nhị phân.',
    },
    {
      type: 'number',
      prompt:
        'Xâu. Trong các hậu tố đã sắp xếp của “banana”, các hậu tố kề nhau có tiền tố chung dài nhất lần lượt là 1, 3, 0, 0, 2. “banana” có bao nhiêu xâu con khác rỗng phân biệt?',
      answer: 15,
      unit: 'xâu con',
      hints: [
        'Một từ độ dài n có n(n + 1)/2 xâu con nếu tính cả các lần lặp.',
        'Mỗi giá trị LCP đếm số tiền tố của một hậu tố đã xuất hiện ở hậu tố đứng trước.',
      ],
      solution:
        '6 hậu tố có tổng cộng 6 + 5 + … + 1 = 21 tiền tố. Một tiền tố đã gặp ở hậu tố đứng trước trong thứ tự sắp xếp là một lần lặp, và mảng LCP đếm đúng chúng: 1 + 3 + 0 + 0 + 2 = 6. Vậy có 21 − 6 = 15 xâu con phân biệt.',
    },
    {
      type: 'number',
      prompt: 'Số học. Tìm nghịch đảo của 7 modulo 26: số x từ 0 đến 25 sao cho 7x ≡ 1 (mod 26).',
      answer: 15,
      hints: [
        'Nghịch đảo tồn tại vì gcd(7, 26) = 1. Chạy thuật toán Euclid mở rộng trên 26 và 7.',
        '26 = 3 × 7 + 5, 7 = 1 × 5 + 2, 5 = 2 × 2 + 1.',
      ],
      solution:
        'Thế ngược lại cho 1 = 3 × 26 − 11 × 7, nên 7 × (−11) ≡ 1 (mod 26) và x = −11 + 26 = 15. Kiểm tra: 7 × 15 = 105 = 4 × 26 + 1. Định lí Fermat nhỏ không áp dụng được ở đây, vì 26 không phải số nguyên tố.',
    },
    {
      type: 'number',
      prompt:
        'Số học. Tìm số nguyên dương x nhỏ nhất sao cho x ≡ 2 (mod 3), x ≡ 3 (mod 5) và x ≡ 2 (mod 7).',
      answer: 23,
      hints: [
        'Các modulo đôi một nguyên tố cùng nhau, nên định lí số dư Trung Hoa cho đúng một đáp án từ 0 đến 104.',
        'Gộp điều kiện thứ nhất và thứ ba: x ≡ 2 (mod 21). Rồi thử 2, 23, 44, … theo modulo 5.',
      ],
      solution:
        'x ≡ 2 theo cả modulo 3 và modulo 7 nghĩa là x ≡ 2 (mod 21), nên x là 2, 23, 44, 65 hoặc 86. Chỉ 23 chia 5 dư 3. Đáp án là duy nhất theo modulo 3 × 5 × 7 = 105.',
    },
    {
      type: 'number',
      prompt:
        'Số học. Một khoá RSA dùng p = 5, q = 11 và số mũ công khai e = 3. Số mũ bí mật d, tức nghịch đảo của e modulo φ(n), bằng bao nhiêu?',
      answer: 27,
      hints: ['n = 55 và φ(n) = (p − 1)(q − 1) = 40.', 'Tìm d sao cho 3d ≡ 1 (mod 40).'],
      solution:
        'φ(55) = 4 × 10 = 40, và 3 × 27 = 81 = 2 × 40 + 1, nên d = 27. Ai phân tích được n ra thừa số sẽ có φ(n) rồi tìm d theo đúng cách này, vì thế độ an toàn của RSA dựa trên việc phân tích ra thừa số là khó với n lớn.',
    },
    {
      type: 'number',
      prompt:
        'Hình học. Một đa giác có các đỉnh (0, 0), (4, 0), (4, 3), (1, 5) và (0, 3), theo đúng thứ tự đó. Diện tích của nó là bao nhiêu?',
      answer: 16,
      unit: 'đơn vị diện tích',
      hints: [
        'Dùng công thức dây giày: một nửa giá trị tuyệt đối của Σ (xᵢ yᵢ₊₁ − xᵢ₊₁ yᵢ).',
        'Năm số hạng tích chéo là 0, 12, 17, 3 và 0.',
      ],
      solution:
        'Các số hạng là 0·0 − 4·0 = 0, 4·3 − 4·0 = 12, 4·5 − 1·3 = 17, 1·3 − 0·5 = 3 và 0·0 − 0·3 = 0. Tổng của chúng là 32, dương vì các đỉnh đi ngược chiều kim đồng hồ, nên diện tích là 32 / 2 = 16. Đầu vào là số nguyên thì tổng được tính chính xác.',
    },
    {
      type: 'choice',
      prompt:
        'Hình học. Đi từ A = (0, 0) đến B = (4, 0) rồi tiếp tới C = (2, 3), tại B bạn rẽ theo hướng nào?',
      options: [
        'Cùng chiều kim đồng hồ, tức rẽ phải',
        'Không rẽ: ba điểm thẳng hàng',
        'Còn tuỳ vào độ dài AB',
        'Ngược chiều kim đồng hồ, tức rẽ trái',
      ],
      answer: 3,
      hints: ['Tính tích có hướng (B − A) × (C − A).', '(4, 0) × (2, 3) = 4 × 3 − 0 × 2.'],
      solution:
        'Tích có hướng là 4 × 3 − 0 × 2 = 12 > 0, nên A, B, C quay ngược chiều kim đồng hồ. Chỉ riêng dấu đã quyết định hướng quay, và chỉ dùng các phép nhân chính xác, vì thế các phép kiểm tra bao lồi và giao nhau đều dựa trên nó.',
    },
    {
      type: 'number',
      prompt:
        'Hình học. Bao lồi của các điểm sau có bao nhiêu đỉnh: (0, 0), (2, 0), (4, 0), (6, 2), (4, 4), (2, 3), (1, 1), (0, 4), (3, 2)? Các điểm nằm giữa một cạnh của bao lồi không được tính là đỉnh.',
      answer: 5,
      unit: 'đỉnh',
      hints: [
        'Phác các điểm ra giấy; bao lồi có hình dạng của một sợi dây chun quấn quanh chúng.',
        '(2, 0) nằm trên cạnh từ (0, 0) đến (4, 0).',
      ],
      solution:
        'Bao lồi (convex hull) là (0, 0), (4, 0), (6, 2), (4, 4), (0, 4). (2, 0) thẳng hàng với hai điểm kề nó, còn (2, 3), (1, 1) và (3, 2) nằm bên trong. Thuật toán chuỗi đơn điệu của Andrew loại một điểm ở mọi chỗ rẽ không hẳn sang trái, nên nó cũng bỏ các điểm thẳng hàng.',
    },
    {
      type: 'number',
      prompt:
        'Luồng. Một mạng có các cung s→a 10, s→b 8, a→b 4, a→t 6 và b→t 10, kèm sức chứa. Luồng cực đại từ s đến t là bao nhiêu?',
      answer: 16,
      hints: [
        'Định lí luồng cực đại, lát cắt nhỏ nhất nói rằng đáp án bằng lát cắt nhỏ nhất. Thử lát cắt quanh t.',
        'Các cung đi vào t mang nhiều nhất 6 + 10 = 16.',
      ],
      solution:
        'Gửi 6 theo s→a→t, 4 theo s→a→b→t và 6 theo s→b→t: tổng cộng 16. Lát cắt {s, a, b} | {t} có sức chứa 6 + 10 = 16, nên không luồng nào lớn hơn được. Các lát cắt khác là 18 ({s}), 18 ({s, a}) và 20 ({s, b}).',
    },
    {
      type: 'choice',
      prompt:
        'Luồng. Trong mọi đồ thị hai phía, kích thước của một ghép cặp cực đại bằng đại lượng nào khác?',
      options: [
        'Số đỉnh ở phía nhỏ hơn',
        'Kích thước của một phủ đỉnh nhỏ nhất',
        'Một nửa số cạnh',
        'Kích thước của một tập độc lập lớn nhất',
      ],
      answer: 1,
      hints: [
        'Mô hình hoá ghép cặp thành một luồng từ s qua phía trái sang phía phải rồi tới t, với sức chứa 1 ở mọi nơi.',
        'Một lát cắt s-t nhỏ nhất trong mạng đó trông như thế nào?',
      ],
      solution:
        'Đây là định lí Kőnig. Một lát cắt nhỏ nhất trong mạng sức chứa đơn vị chọn các đỉnh trái nằm phía đích và các đỉnh phải nằm phía nguồn, và chúng cùng nhau phủ mọi cạnh; luồng cực đại bằng lát cắt nhỏ nhất, nên ghép cặp lớn nhất bằng phủ đỉnh nhỏ nhất.',
    },
    {
      type: 'number',
      prompt:
        'QHĐ nâng cao. Held-Karp giải bài toán người du lịch với mỗi trạng thái là một cặp (tập thành phố đã thăm, thành phố hiện tại). Có bao nhiêu trạng thái với n = 15 thành phố?',
      answer: 491520,
      unit: 'trạng thái',
      hints: ['Có 2ⁿ tập con và n thành phố hiện tại có thể.', '2¹⁵ = 32 768.'],
      solution:
        '2¹⁵ × 15 = 32 768 × 15 = 491 520 trạng thái. Mỗi trạng thái thử tối đa n thành phố liền trước, nên thời gian là O(2ⁿ n²), ở đây vào khoảng 7 triệu bước, ít hơn rất nhiều so với 14! ≈ 8,7 × 10¹⁰ thứ tự nếu thử mọi hành trình.',
    },
    {
      type: 'number',
      prompt:
        'QHĐ nâng cao. Trong một cây, đỉnh 1 (trọng số 3) có các con 2 (trọng số 5) và 3 (trọng số 4); đỉnh 2 có các con 4 (trọng số 6) và 5 (trọng số 2); đỉnh 3 có con 6 (trọng số 3). Tổng trọng số lớn nhất của một tập đỉnh mà không có hai đỉnh nào kề nhau là bao nhiêu?',
      answer: 14,
      hints: [
        'Làm theo thứ tự duyệt sau với hai giá trị cho mỗi đỉnh: tốt nhất khi lấy đỉnh đó, và tốt nhất khi bỏ nó.',
        'Đỉnh 2 cho 5 khi lấy, hoặc 6 + 2 = 8 khi bỏ.',
      ],
      solution:
        'Các lá cho (lấy, bỏ) = (6, 0), (2, 0), (3, 0). Đỉnh 2: (5, 8); đỉnh 3: (4, 3). Lấy đỉnh 1: 3 + 8 + 3 = 14; bỏ đỉnh 1: 8 + 4 = 12. Tập tốt nhất là {1, 4, 5, 6} với trọng số 14, tìm được trong O(n).',
    },
    {
      type: 'choice',
      prompt:
        'QHĐ nâng cao. Một hệ thức truy hồi có dạng dp[i] = min theo j < i của (dp[j] + b[j] · x[i]), trong đó b[j] giảm khi j tăng và x[i] tăng khi i tăng. Kĩ thuật tối ưu nào đưa vòng lặp O(n²) xuống O(n)?',
      options: [
        'Tối ưu Knuth cho QHĐ trên đoạn',
        'Một hàng đợi đơn điệu cho giá trị nhỏ nhất trên cửa sổ trượt',
        'Đệ quy có nhớ',
        'Kĩ thuật bao lồi, với một con trỏ chỉ tiến về phía trước',
      ],
      answer: 3,
      hints: [
        'Coi mỗi j là một đường thẳng y = b[j] · x + dp[j].',
        'Bạn cần đường thấp nhất tại điểm x[i], và các điểm truy vấn chỉ tăng dần.',
      ],
      solution:
        'Mỗi j thêm một đường thẳng có hệ số góc b[j] và tung độ gốc dp[j]; dp[i] là đường thấp nhất tại x[i]. Các hệ số góc đến theo thứ tự giảm dần, nên đường bao dưới được giữ trong một hàng đợi hai đầu, và các truy vấn tăng dần cho phép một con trỏ đi dọc theo nó: tổng cộng O(n).',
    },
    {
      type: 'number',
      prompt:
        'Kĩ thuật trên cây. Một cây có gốc gồm n = 100 000 đỉnh và có thể chỉ là một đường dài. Nhảy nhị phân lưu các bước nhảy lên 2⁰, 2¹, …, 2^(LOG − 1) tổ tiên cho mỗi đỉnh. LOG nhỏ nhất sao cho 2^LOG ≥ n là bao nhiêu?',
      answer: 17,
      hints: ['2¹⁶ = 65 536.', '65 536 có lớn hơn hoặc bằng 100 000 không?'],
      solution:
        '2¹⁶ = 65 536 là quá nhỏ còn 2¹⁷ = 131 072 là đủ, nên LOG = 17. Mọi độ sâu nhỏ hơn n đều là tổng của các luỹ thừa phân biệt của 2 nhỏ hơn 2¹⁷, nên các truy vấn tổ tiên thứ k và tổ tiên chung gần nhất (LCA) chỉ tốn O(log n) bước nhảy sau O(n log n) tiền xử lí.',
    },
    {
      type: 'choice',
      prompt:
        'Kĩ thuật trên cây. Trong phân rã nặng nhẹ, vì sao đường đi từ một đỉnh bất kì lên gốc chỉ cắt qua O(log n) cạnh nhẹ?',
      options: [
        'Đi lên qua một cạnh nhẹ làm kích thước cây con bạn đang ở ít nhất tăng gấp đôi',
        'Mỗi chuỗi nặng có tối đa log n đỉnh',
        'Phép phân rã cân bằng lại cây trước',
        'Mỗi đỉnh có tối đa hai con',
      ],
      answer: 0,
      hints: [
        'Cây con của một con nhẹ không lớn hơn cây con của anh em nặng của nó.',
        'Kích thước một cây con tăng gấp đôi được bao nhiêu lần trước khi vượt n?',
      ],
      solution:
        'Cây con của một con nhẹ chứa không quá một nửa cây con của cha nó, nên mỗi lần đi lên qua một cạnh nhẹ kích thước ít nhất tăng gấp đôi, điều này xảy ra nhiều nhất log₂ n lần. Chuỗi nặng có thể dài, nhưng mỗi chuỗi là một đoạn liên tiếp trong cây phân đoạn, cho truy vấn đường đi O(log² n).',
    },
    {
      type: 'number',
      prompt:
        'Đại số và ngẫu nhiên. Trong trò chơi Nim với các đống 3, 4 và 5 viên sỏi, người đi trước có đúng một nước thắng, là lấy từ đống 3 viên. Nước đó lấy bao nhiêu viên?',
      answer: 2,
      unit: 'viên',
      hints: [
        'Một thế cờ là thua với người sắp đi khi và chỉ khi XOR các đống bằng 0.',
        '3 ⊕ 4 ⊕ 5 = 2. Đống p nào có p ⊕ 2 nhỏ hơn p?',
      ],
      solution:
        'XOR là 011 ⊕ 100 ⊕ 101 = 010 = 2. Đổi đống 3 viên thành 3 ⊕ 2 = 1 làm XOR bằng 0, nên hãy lấy 2 viên. Các đống còn lại sẽ phải tăng lên (4 ⊕ 2 = 6, 5 ⊕ 2 = 7), điều không được phép.',
    },
    {
      type: 'multi',
      prompt:
        'Đại số và ngẫu nhiên. Những thuật toán nào dưới đây là thuật toán Las Vegas, luôn cho đáp án đúng và chỉ có thời gian chạy là phụ thuộc may rủi?',
      options: [
        'Sắp xếp nhanh ngẫu nhiên',
        'Kiểm tra số nguyên tố Miller-Rabin',
        'Một lần chạy thuật toán co cạnh ngẫu nhiên của Karger tìm lát cắt nhỏ nhất',
        'Quickselect ngẫu nhiên',
        'Kiểm tra số nguyên tố Fermat',
      ],
      answers: [0, 3],
      hints: [
        'Thuật toán Monte Carlo có thời gian chạy cố định nhưng có thể trả lời sai.',
        'Một chốt ngẫu nhiên có bao giờ khiến phép sắp xếp hay phép chọn trả về kết quả sai không?',
      ],
      solution:
        'Chốt ngẫu nhiên chỉ thay đổi thời gian chạy của sắp xếp nhanh và quickselect, không bao giờ thay đổi đầu ra: đó là Las Vegas. Miller-Rabin và Fermat có thể gọi một hợp số là số nguyên tố, và một lần chạy Karger có thể bỏ lỡ lát cắt nhỏ nhất: đó là Monte Carlo, trở nên đáng tin nhờ chạy lặp lại.',
    },
    {
      type: 'number',
      prompt:
        'Đại số và ngẫu nhiên. Gọi M là ma trận 2 × 2 có các hàng (1, 1) và (1, 0). Phần tử ở góc trên bên phải của M¹⁰ là bao nhiêu?',
      answer: 55,
      hints: [
        'Mⁿ có các hàng (F(n + 1), F(n)) và (F(n), F(n − 1)), với F(1) = F(2) = 1.',
        'Dãy Fibonacci: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55.',
      ],
      solution:
        'Phần tử góc trên bên phải của Mⁿ là F(n), và F(10) = 55. Luỹ thừa nhanh tới M¹⁰ = M⁸ · M² bằng 3 lần bình phương và 1 phép nhân thêm, nên F(n) chỉ tốn O(log n) phép nhân ma trận thay vì n phép cộng.',
    },
    {
      type: 'multi',
      prompt:
        'Bài toán khó. Theo hiểu biết hiện nay, những bài toán quyết định nào dưới đây là NP-đầy đủ?',
      options: [
        '3-SAT',
        '2-SAT',
        'Phủ đỉnh: có phủ đỉnh nào gồm tối đa k đỉnh không?',
        'Đường đi ngắn nhất: có đường đi nào dài tối đa k không?',
        'Tổng tập con',
        'Ghép cặp hai phía: có ghép cặp nào gồm ít nhất k cạnh không?',
      ],
      answers: [0, 2, 4],
      hints: [
        'Ba bài trong số này có thuật toán đa thức từ các chương trước.',
        '2-SAT được giải bằng thành phần liên thông mạnh.',
      ],
      solution:
        '3-SAT, phủ đỉnh và tổng tập con là NP-đầy đủ. 2-SAT được giải trong O(n + m) bằng đồ thị kéo theo, đường đi ngắn nhất bằng Dijkstra hoặc Bellman-Ford, và ghép cặp hai phía bằng đường tăng luồng, nên ba bài đó thuộc lớp P.',
    },
    {
      type: 'choice',
      prompt:
        'Bài toán khó. Bạn muốn chứng minh một bài toán mới X là NP-khó. Bạn phải chỉ ra điều gì?',
      options: [
        'X quy dẫn được về 3-SAT trong thời gian đa thức',
        'X có một thuật toán thời gian hàm mũ',
        'Chưa ai tìm ra thuật toán đa thức cho X',
        'Một bài toán NP-khó đã biết, chẳng hạn 3-SAT, quy dẫn được về X trong thời gian đa thức',
      ],
      answer: 3,
      hints: [
        'Một phép quy dẫn A ≤ B nói rằng B ít nhất khó bằng A.',
        'Bạn muốn X ít nhất khó bằng một bài toán đã biết là khó.',
      ],
      solution:
        'Quy dẫn 3-SAT về X nghĩa là một thuật toán nhanh cho X cũng giải nhanh được 3-SAT, nên X ít nhất khó bằng 3-SAT: X là NP-khó. Quy dẫn X về 3-SAT cho thấy điều ngược lại, rằng X không khó hơn 3-SAT, điều đó chỉ đặt X vào lớp NP.',
    },
    {
      type: 'number',
      prompt:
        'Bài toán khó. Một cây tìm kiếm bị chặn giải bài toán phủ đỉnh với tham số k = 10: lấy một cạnh (u, v) bất kì chưa được phủ và rẽ nhánh theo việc đưa u hoặc v vào phủ đỉnh. Cây tìm kiếm có nhiều nhất bao nhiêu lá?',
      answer: 1024,
      unit: 'lá',
      hints: ['Mỗi nhánh thêm một đỉnh vào phủ đỉnh, nên độ sâu không quá k.', 'Mỗi nút có 2 con.'],
      solution:
        'Một trong hai đỉnh u và v phải thuộc mọi phủ đỉnh, nên hai nhánh là đủ, và mỗi nhánh dùng hết một trong k đỉnh. Một cây nhị phân độ sâu 10 có tối đa 2¹⁰ = 1024 lá, nên cả lượt tìm kiếm là O(2ᵏ (n + m)): chỉ hàm mũ theo k, không theo n.',
    },
    {
      type: 'text',
      prompt:
        'Heap nâng cao. Chi phí khấu hao của thao tác giảm khoá trong heap Fibonacci, viết bằng kí hiệu O lớn, là bao nhiêu?',
      accept: [
        'O(1)',
        'O(1) khấu hao',
        'khấu hao O(1)',
        'O(1) amortized',
        'amortized O(1)',
        'Θ(1)',
        'hằng số',
        'thời gian hằng số',
        'constant',
        'constant time',
      ],
      hints: [
        'Giảm khoá cắt nút ra và biến nó thành một gốc; các lần cắt dây chuyền được trả bằng các dấu đã đặt từ trước.',
        'Đây là lí do Dijkstra với heap Fibonacci chạy trong O(E + V log V).',
      ],
      solution:
        'O(1) khấu hao. Lần cắt và mỗi lần cắt dây chuyền được trả bằng thế năng tích trong các nút đã đánh dấu, còn việc hợp nhất được để lại cho extract-min, thao tác tốn O(log n) khấu hao. Với E lần giảm khoá và V lần extract-min, Dijkstra tốn O(E + V log V).',
    },
    {
      type: 'number',
      prompt:
        'Heap nâng cao. Một cây van Emde Boas trên vũ trụ u = 2¹⁶ chia mỗi khoá thành nửa cao và nửa thấp ở mỗi tầng. Độ dài khoá giảm một nửa bao nhiêu lần trước khi còn 1 bit?',
      answer: 4,
      unit: 'tầng',
      hints: ['Khoá ban đầu có 16 bit.', '16 → 8 → …'],
      solution:
        '16 → 8 → 4 → 2 → 1 bit là 4 lần chia đôi, đúng bằng log₂ log₂ u = log₂ 16 = 4. Một truy vấn phần tử kế tiếp làm lượng việc không đổi ở mỗi tầng, nên tốn O(log log u) bất kể đang lưu bao nhiêu khoá.',
    },
    {
      type: 'number',
      prompt:
        'Mô hình tính toán. Một chương trình fork-join có work T₁ = 100 ms và span T∞ = 10 ms. Một bộ lập lịch tham lam trên P = 5 bộ xử lí hoàn thành trong nhiều nhất bao nhiêu mili giây?',
      answer: 30,
      unit: 'ms',
      hints: ['Dùng cận của bộ lập lịch tham lam T_P ≤ T₁/P + T∞.', '100 / 5 = 20.'],
      solution:
        'T₅ ≤ 100 / 5 + 10 = 30 ms. Không lịch nào nhanh hơn được max(T₁/P, T∞) = 20 ms, nên lập lịch tham lam không kém tối ưu quá 2 lần. Độ song song T₁/T∞ = 10 cho biết dùng nhiều hơn khoảng 10 bộ xử lí cũng không giúp được bao nhiêu.',
    },
    {
      type: 'choice',
      prompt:
        'Mô hình tính toán. Thuê ván trượt tốn 1 mỗi ngày còn mua tốn 10, và bạn không biết mình sẽ trượt bao nhiêu ngày. Bạn thuê cho đến khi đã trả 9, rồi mua. Chiến lược này bảo đảm tỉ số cạnh tranh bằng bao nhiêu?',
      options: [
        '1: nó luôn trả đúng bằng lựa chọn ngoại tuyến tốt nhất',
        '1,9: nó không bao giờ trả quá 19 khi lựa chọn ngoại tuyến tốt nhất trả 10',
        '10: giá của bộ ván trượt',
        'Không có: chi phí không bị chặn vì không biết mùa trượt dài bao lâu',
      ],
      answer: 1,
      hints: [
        'Trường hợp xấu nhất là dừng ngay sau khi bạn vừa mua.',
        'Khi đó bạn đã trả 9 + 10, trong khi người biết trước tương lai sẽ mua ngay ngày đầu.',
      ],
      solution:
        'Nếu bạn trượt ít hơn 10 ngày, bạn trả đúng bằng lựa chọn ngoại tuyến tốt nhất. Ngược lại bạn trả 9 + 10 = 19 so với 10 của lựa chọn ngoại tuyến, tỉ số 1,9 = 2 − 1/10. Không chiến lược tất định nào làm tốt hơn, đó là cận kinh điển của bài toán thuê ván trượt.',
    },
    {
      type: 'multi',
      prompt:
        'Lựa chọn. Với n = 10⁵ và khoảng 10⁸ bước đơn giản mỗi giây, những thời gian chạy nào vừa trong khoảng một giây?',
      options: ['O(n log n)', 'O(n√n)', 'O(n²)', 'O(2ⁿ)', 'O(n log² n)'],
      answers: [0, 1, 4],
      hints: ['Thay số vào: log₂ 10⁵ ≈ 17 và √10⁵ ≈ 316.', 'n² là 10¹⁰.'],
      solution:
        'n log n ≈ 1,7 × 10⁶, n√n ≈ 3,2 × 10⁷ và n log² n ≈ 2,8 × 10⁷ đều vừa. n² = 10¹⁰ mất khoảng 100 giây, còn 2ⁿ vượt xa mọi máy tính. Kiểm tra giới hạn trước giúp loại bớt các cách làm trước khi bạn viết chúng.',
    },
    {
      type: 'order',
      prompt: 'Lựa chọn. Sắp các thời gian chạy này từ tăng chậm nhất đến tăng nhanh nhất.',
      items: ['O(n log n)', 'O(2ⁿ)', 'O(log log n)', 'O(n²)', 'O(√n)', 'O(n!)', 'O(log n)'],
      answer: [2, 6, 4, 0, 3, 1, 5],
      hints: [
        'Đa thức của log nằm dưới đa thức, đa thức nằm dưới hàm mũ.',
        'n! tăng nhanh hơn 2ⁿ, vì phần lớn các thừa số của nó lớn hơn 2.',
      ],
      solution:
        'log log n (van Emde Boas) < log n (cây cân bằng) < √n (chia căn) < n log n (sắp xếp) < n² (QHĐ đơn giản) < 2ⁿ (tập con) < n! (hoán vị). Mỗi bậc lên lại thu nhỏ giá trị n lớn nhất chạy vừa trong một giây.',
    },
    {
      type: 'choice',
      prompt:
        'Lựa chọn. Một cây có 10⁵ đỉnh mang giá trị. Bạn phải trả lời 10⁵ truy vấn “tổng các giá trị trên đường đi từ u đến v”, xen kẽ với các lần cập nhật đổi giá trị của một đỉnh. Cách tiếp cận nào phù hợp?',
      options: [
        'Chỉ dùng nhảy nhị phân',
        'Một bảng thưa trên chu trình Euler của cây',
        'Phân rã nặng nhẹ cùng một cây phân đoạn trên các chuỗi',
        'Floyd-Warshall trên cây',
      ],
      answer: 2,
      hints: [
        'Các giá trị thay đổi, nên một bảng tĩnh là không đủ.',
        'Chia mỗi đường đi thành một vài đoạn liên tiếp mà một cấu trúc tính tổng trên đoạn trả lời được.',
      ],
      solution:
        'Phân rã nặng nhẹ cắt mọi đường đi thành O(log n) chuỗi, mỗi chuỗi là một đoạn vị trí liên tiếp, và cây phân đoạn trả lời mỗi đoạn và mỗi lần cập nhật điểm trong O(log n): O(log² n) mỗi truy vấn. Bảng thưa không cập nhật được, còn O(n³) của Floyd-Warshall quá chậm.',
    },
  ],
};
