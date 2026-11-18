export const vi = {
  slug: 'review-foundations-lesson',
  topic: 'review-foundations',
  level: 'Trung bình',
  title: 'Ôn tập: nền tảng',
  intro:
    'Bài trắc nghiệm này trộn câu hỏi từ mọi chương của phần nền tảng: độ phức tạp, mảng và xâu, sắp xếp, tìm kiếm, danh sách liên kết (linked list), ngăn xếp (stack) và hàng đợi (queue), băm, đệ quy, cây, heap và đồ thị. Phần lớn câu hỏi mô tả một việc cần làm rồi hỏi cấu trúc dữ liệu hay thuật toán nào hợp với nó, vì biết chọn đúng cũng quan trọng như biết từng thứ hoạt động ra sao.',
  summary:
    'Bài trắc nghiệm tổng hợp cho cả phần nền tảng: chi phí của các thao tác cơ bản, chọn cấu trúc dữ liệu cho một việc, và ôn lại sắp xếp, tìm kiếm.',
  instruction:
    'Trả lời từng câu rồi bấm Kiểm tra. Trả lời sai thì bạn biết ngay; hãy mở từng gợi ý một, và sau lần thử đầu tiên bạn có thể đọc lời giải đầy đủ. Câu đã giải giữ dấu tích trong trình duyệt này.',
  practiceTitle: 'Trắc nghiệm phần nền tảng',
  takeaways: [
    'Hãy đếm lượng công việc, đừng đếm giây: các vòng lặp lồng nhau thì nhân với nhau, chia đôi liên tục cho log n, còn một hệ thức truy hồi (recurrence) như T(n) = 2T(n/2) + n cho nghiệm n log n.',
    'Việc cần làm sẽ chọn cấu trúc: ngăn xếp cho “vào sau, ra trước”, hàng đợi cho thứ tự đến, bảng băm (hash table) cho câu hỏi “mình đã gặp cái này chưa?”, heap cho “việc nào gấp nhất lúc này?”, cây tìm kiếm cân bằng cho thứ tự đã sắp xếp mà vẫn cập nhật nhanh.',
    'Sắp xếp và tìm kiếm đi cùng nhau: sắp xếp một lần trong O(n log n), rồi trả lời mỗi lần tra cứu bằng tìm kiếm nhị phân trong O(log n). Tính ổn định, bộ nhớ phụ và miền giá trị của khoá quyết định nên dùng cách sắp xếp nào.',
    'Duyệt đồ thị tốn O(V + E): duyệt theo chiều rộng (BFS) cho đường đi ít cạnh nhất, duyệt theo chiều sâu (DFS) cho thứ tự kết thúc để sắp xếp tô-pô (topological sort) và tìm chu trình.',
    'Thử xem: cố ý trả lời sai một câu, đọc gợi ý đầu tiên và xem nó có đủ để bạn tìm ra đáp án mà không cần lời giải hay không.',
  ],
  complexityHead: ['Cấu trúc hoặc thuật toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Truy cập mảng theo chỉ số; các thao tác của ngăn xếp và hàng đợi',
      'O(1)',
      'Một chỉ số chỉ cần một phép tính địa chỉ, còn ngăn xếp hay hàng đợi chỉ làm việc ở hai đầu.',
    ],
    [
      'Thêm vào cuối mảng động',
      'O(1) khấu hao',
      'Nhân đôi sức chứa khiến tổng số lần sao chép sau n lần thêm luôn ít hơn 2n.',
    ],
    [
      'Tìm kiếm trên danh sách liên kết',
      'O(n)',
      'Muốn tìm một giá trị phải đi qua từng nút một; nối lại sau một nút đã biết chỉ tốn O(1).',
    ],
    [
      'Thêm, tra cứu, xoá trong bảng băm',
      'O(1) kì vọng',
      'Hàm băm tốt cùng hệ số tải bị chặn giữ cho các ngăn ngắn; nếu mọi khoá va chạm, một ngăn chứa tất cả và chi phí thành O(n).',
    ],
    [
      'Tìm kiếm nhị phân trên mảng đã sắp xếp',
      'O(log n)',
      'Mỗi lần dò chia đôi đoạn còn có thể chứa đáp án.',
    ],
    [
      'Sắp xếp trộn, sắp xếp vun đống',
      'O(n log n)',
      'Các thuật toán sắp xếp dựa trên so sánh cần Ω(n log n) phép so sánh trong trường hợp xấu nhất, và hai thuật toán này đạt đúng mức đó.',
    ],
    [
      'Sắp xếp đếm, khoá thuộc một miền có k giá trị',
      'O(n + k)',
      'Nó đếm số lần xuất hiện của khoá thay vì so sánh, nên cận n log n không áp dụng.',
    ],
    [
      'Tìm kiếm, thêm trên cây nhị phân tìm kiếm',
      'O(h)',
      'Mỗi bước xuống một tầng: khi cây cân bằng h vào khoảng log₂ n, nhưng thêm các khoá theo thứ tự tăng dần sẽ dựng thành một đường thẳng với h = n − 1.',
    ],
    [
      'Push, pop trên heap nhị phân',
      'O(log n)',
      'Phép vun chỉ đi dọc một đường từ gốc đến lá của một cây đầy đủ; dựng heap từ dưới lên tốn O(n).',
    ],
    [
      'BFS, DFS, sắp xếp tô-pô',
      'O(V + E)',
      'Mỗi đỉnh được thăm một lần và mỗi cạnh trong danh sách kề được xét một lần (hai lần nếu đồ thị vô hướng).',
    ],
  ],
  nextTeaser:
    'Bài sau mở đầu phần thuật toán cốt lõi với đồ thị có trọng số và tính chất của đường đi ngắn nhất: khi mỗi cạnh có một chi phí riêng, đường ít cạnh nhất không còn chắc là đường rẻ nhất.',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Độ phức tạp. Vòng lặp “for i = 1 to n: for j = 1 to i: count++” chạy với n = 10. Lệnh count++ được thực hiện bao nhiêu lần?',
      answer: 55,
      unit: 'lần',
      hints: [
        'Ở vòng thứ i, vòng lặp trong chạy i lần, nên hãy cộng 1 + 2 + … + 10.',
        'Tổng 1 + 2 + … + n bằng n(n + 1)/2.',
      ],
      solution:
        'Vòng thứ i chạy thân vòng lặp i lần, nên tổng là 1 + 2 + … + 10 = 10 · 11 / 2 = 55. Tổng quát là n(n + 1)/2, tức Θ(n²).',
    },
    {
      type: 'text',
      prompt:
        'Độ phức tạp. Sắp xếp trộn chia đôi đầu vào, sắp xếp hai nửa rồi trộn chúng trong thời gian tuyến tính: T(n) = 2T(n/2) + n. Viết T(n) bằng kí hiệu O lớn.',
      accept: [
        'O(n log n)',
        'O(nlogn)',
        'O(n log2 n)',
        'O(n log₂ n)',
        'Θ(n log n)',
        'theta(n log n)',
        'n log n',
        'nlogn',
        'O(n * log n)',
        'O(n·log n)',
      ],
      hints: [
        'Vẽ cây đệ quy: mỗi tầng làm bao nhiêu việc, và có bao nhiêu tầng?',
        'Mỗi tầng trộn tổng cộng n phần tử, và chia đôi liên tục thì sau log₂ n tầng sẽ còn kích thước 1.',
      ],
      solution:
        'Mỗi tầng của cây đệ quy làm tổng cộng n việc (2 lần trộn n/2, 4 lần trộn n/4, …), và có log₂ n tầng, nên T(n) = O(n log n).',
    },
    {
      type: 'number',
      prompt:
        'Mảng. Một mảng động (dynamic array) bắt đầu với sức chứa 1 và nhân đôi sức chứa mỗi khi đầy. Trong lúc bạn thêm 17 phần tử, có tổng cộng bao nhiêu lần sao chép phần tử?',
      answer: 31,
      unit: 'lần sao chép',
      hints: [
        'Mảng được nới rộng khi bạn thêm vào lúc nó đã đầy: ở các kích thước 1, 2, 4, 8 và 16.',
        'Mỗi lần nới rộng sao chép mọi phần tử đang có.',
      ],
      solution:
        'Mảng đầy ngay trước các lần thêm thứ 2, 3, 5, 9 và 17, nên nó sao chép 1 + 2 + 4 + 8 + 16 = 31 phần tử. Con số này ít hơn 2 × 17, đó là lí do thao tác thêm vào cuối có chi phí khấu hao O(1).',
    },
    {
      type: 'number',
      prompt:
        'Mảng. Với a = [3, 1, 4, 1, 5, 9, 2, 6] (chỉ số từ 0), tổng tiền tố (prefix sum) là P[0] = 0 và P[i + 1] = P[i] + a[i]. Hỏi P[6] − P[2], tức tổng a[2..5], bằng bao nhiêu?',
      answer: 19,
      hints: [
        'P[6] − P[2] cộng các phần tử ở chỉ số 2, 3, 4 và 5.',
        'Các phần tử đó là 4, 1, 5 và 9.',
      ],
      solution:
        'P = [0, 3, 4, 8, 9, 14, 23, 25, 31], nên P[6] − P[2] = 23 − 4 = 19, đúng bằng 4 + 1 + 5 + 9. Sau khi chuẩn bị mất O(n), mỗi tổng trên một đoạn chỉ tốn một phép trừ.',
    },
    {
      type: 'choice',
      prompt:
        'Chọn kĩ thuật. Tìm độ dài đoạn dài nhất của một xâu mà không có kí tự nào lặp lại, trong thời gian O(n). Kĩ thuật nào phù hợp?',
      options: [
        'Cửa sổ trượt: mở rộng đầu phải, thu hẹp đầu trái cho đến khi vượt qua kí tự bị lặp',
        'Tổng tiền tố trên mã của các kí tự',
        'Tìm kiếm nhị phân theo đáp án, mỗi lần đoán quét lại từ đầu, không dùng thêm cấu trúc nào',
        'Sắp xếp các kí tự, rồi quét một lần',
      ],
      answer: 0,
      hints: [
        'Đáp án là một đoạn liên tiếp, và một đoạn hợp lệ vẫn hợp lệ khi bị thu hẹp.',
        'Mỗi đầu của đoạn chỉ luôn tiến về phía trước.',
      ],
      solution:
        'Cửa sổ trượt (sliding window) giữ đoạn hiện tại không có kí tự lặp. Đầu phải thêm một kí tự; khi kí tự đó bị lặp, đầu trái dời qua bản sao trước của nó. Mỗi đầu dời tối đa n lần, nên cả lần quét là O(n). Sắp xếp sẽ phá mất các vị trí mà câu hỏi quan tâm.',
    },
    {
      type: 'multi',
      prompt:
        'Sắp xếp. Ở dạng thường gặp trong sách giáo khoa, những thuật toán sắp xếp nào là ổn định, tức giữ các khoá bằng nhau theo đúng thứ tự trong đầu vào?',
      options: [
        'Sắp xếp nổi bọt',
        'Sắp xếp chèn',
        'Sắp xếp chọn (đổi chỗ phần tử nhỏ nhất lên đầu)',
        'Sắp xếp trộn (khi bằng nhau thì lấy từ nửa trái)',
        'Sắp xếp nhanh (phân hoạch Lomuto)',
        'Sắp xếp vun đống',
      ],
      answers: [0, 1, 3],
      hints: [
        'Một thuật toán sắp xếp là ổn định khi nó chỉ đổi chỗ hoặc dời một phần tử qua các phần tử kề lớn hơn hẳn.',
        'Đổi chỗ ở khoảng cách xa có thể khiến một bản của khoá nhảy qua một bản khác của cùng khoá đó.',
      ],
      solution:
        'Sắp xếp nổi bọt và sắp xếp chèn chỉ dời một phần tử qua các phần tử kề lớn hơn hẳn, còn sắp xếp trộn giữ thứ tự các khoá bằng nhau nhờ lấy từ nửa trái trước. Sắp xếp chọn, sắp xếp nhanh (quicksort) kiểu Lomuto và sắp xếp vun đống (heapsort) đổi chỗ ở khoảng cách xa nên có thể đảo thứ tự các khoá bằng nhau, chẳng hạn sắp xếp chọn trên [2a, 2b, 1].',
    },
    {
      type: 'choice',
      prompt:
        'Sắp xếp. Bạn cần sắp xếp 1 000 000 điểm thi, mỗi điểm là một số nguyên từ 0 đến 100. Thuật toán sắp xếp nào phù hợp nhất?',
      options: [
        'Sắp xếp đếm, O(n + k) với k = 101',
        'Sắp xếp chèn, vì điểm thi là các số nhỏ',
        'Sắp xếp trộn, vì không gì nhanh hơn O(n log n)',
        'Sắp xếp chọn, vì nó ghi ít lần',
      ],
      answer: 0,
      hints: [
        'Khoá thuộc một miền rất nhỏ so với n.',
        'Cận dưới Ω(n log n) chỉ đúng với các thuật toán sắp xếp có so sánh khoá.',
      ],
      solution:
        'Chỉ có 101 giá trị khoá, nên sắp xếp đếm (counting sort) đếm số lần xuất hiện của từng điểm rồi ghi lại theo thứ tự trong thời gian O(n + k), khoảng 1 000 101 bước. Cận n log n chỉ áp dụng cho sắp xếp dựa trên so sánh, mà sắp xếp đếm thì không so sánh. Sắp xếp chèn và sắp xếp chọn ở đây là Θ(n²).',
    },
    {
      type: 'number',
      prompt:
        'Sắp xếp. Mọi thuật toán sắp xếp dựa trên so sánh đều là một cây quyết định có ít nhất n! lá. Số phép so sánh nhỏ nhất trong trường hợp xấu nhất để sắp xếp được mọi đầu vào gồm 4 phần tử phân biệt là bao nhiêu?',
      answer: 5,
      unit: 'phép so sánh',
      hints: [
        'Một cây nhị phân chiều cao h có tối đa 2^h lá, còn 4 phần tử có 4! = 24 thứ tự.',
        'Tìm h nhỏ nhất sao cho 2^h ≥ 24.',
      ],
      solution:
        'Có 4! = 24 thứ tự có thể, và 2⁴ = 16 < 24 ≤ 32 = 2⁵, nên trong trường hợp xấu nhất cần ít nhất ⌈log₂ 24⌉ = 5 phép so sánh. Phương pháp chèn kết hợp trộn đạt đúng 5, nên đáp án là 5.',
    },
    {
      type: 'number',
      prompt:
        'Tìm kiếm. Tìm kiếm nhị phân chạy trên một mảng đã sắp xếp gồm 1000 phần tử. Trong trường hợp xấu nhất, nó dò tổng cộng bao nhiêu phần tử ở giữa, tính cả lần dò cuối, cho đến khi tìm thấy mục tiêu hoặc kết luận không có?',
      answer: 10,
      unit: 'lần dò',
      hints: [
        'Mỗi lần dò trượt sẽ chia đôi đoạn còn lại.',
        'Tìm xem cần chia đôi bao nhiêu lần để 1000 về 0: 2¹⁰ = 1024.',
      ],
      solution:
        'Tìm kiếm nhị phân dò tối đa ⌊log₂ n⌋ + 1 phần tử. Vì 2⁹ = 512 ≤ 1000 < 1024 = 2¹⁰, con số đó là 9 + 1 = 10 lần dò. Tìm kiếm tuần tự có thể cần đến 1000 lần.',
    },
    {
      type: 'number',
      prompt:
        'Tìm kiếm. Trong mảng đã sắp xếp [1, 3, 3, 3, 5, 8] (chỉ số từ 0), upper_bound(3) trả về chỉ số của phần tử đầu tiên lớn hơn 3. Đó là chỉ số nào?',
      answer: 4,
      hints: [
        'Ba số 3 nằm ở các chỉ số 1, 2 và 3.',
        'upper_bound(3) − lower_bound(3) đếm số bản sao của 3.',
      ],
      solution:
        'Phần tử đầu tiên lớn hơn 3 là số 5 ở chỉ số 4. lower_bound(3) bằng 1, nên có 4 − 1 = 3 bản sao của 3, tìm được bằng hai lần tìm kiếm nhị phân trong O(log n).',
    },
    {
      type: 'choice',
      prompt:
        'Danh sách liên kết. Bạn cần biết một danh sách liên kết đơn có vòng lại chính nó hay không, chỉ dùng O(1) bộ nhớ phụ. Cách nào làm được?',
      options: [
        'Con trỏ nhanh và chậm: một con đi hai nút mỗi bước, con kia đi một; chúng chỉ gặp nhau khi có chu trình',
        'Lưu mọi nút đã thăm vào một tập băm',
        'Đảo ngược danh sách rồi so với bản gốc',
        'Đếm số nút rồi so với trường độ dài của danh sách',
      ],
      answer: 0,
      hints: [
        'Tập băm làm được nhưng tốn O(n) bộ nhớ.',
        'Trên một vòng chạy, người chạy nhanh sẽ đuổi kịp người chạy chậm.',
      ],
      solution:
        'Thuật toán rùa và thỏ của Floyd dùng hai con trỏ. Trên danh sách không có chu trình, con trỏ nhanh chạm tới null; nếu có chu trình, mỗi bước nó rút ngắn khoảng cách với con trỏ chậm đi một nút và gặp nó trong vòng một lượt quanh chu trình. Tổng cộng tốn O(n) thời gian và O(1) bộ nhớ.',
    },
    {
      type: 'text',
      prompt:
        'Ngăn xếp. Thực hiện push 1, push 2, pop, push 3, push 4, pop, pop trên một ngăn xếp rỗng. Những giá trị nào được lấy ra, theo thứ tự? Ngăn cách chúng bằng dấu phẩy.',
      accept: ['2, 4, 3', '2 4 3', '2;4;3', '[2, 4, 3]'],
      hints: [
        'Lệnh pop luôn lấy giá trị được push gần nhất mà còn nằm trong ngăn xếp.',
        'Sau push 3, push 4, ngăn xếp từ đáy lên đỉnh là 1, 3, 4.',
      ],
      solution:
        'Lần pop đầu lấy 2 (ngăn xếp còn 1). Sau đó 3 và 4 được đưa vào (ngăn xếp 1, 3, 4), và hai lần pop tiếp theo lấy 4 rồi 3. Vậy đầu ra là 2, 4, 3 và số 1 vẫn nằm trong ngăn xếp: vào sau, ra trước.',
    },
    {
      type: 'choice',
      prompt:
        'Chọn cấu trúc. Với nhiệt độ của mỗi ngày, bạn muốn biết ngày gần nhất sau đó ấm hơn, cho cả n ngày với tổng chi phí O(n). Cấu trúc nào phù hợp?',
      options: [
        'Một hàng đợi chứa mọi ngày theo thứ tự đến',
        'Một ngăn xếp đơn điệu chứa các ngày còn đang chờ một ngày ấm hơn',
        'Một bảng băm từ nhiệt độ sang ngày',
        'Một heap nhỏ nhất chứa mọi nhiệt độ',
      ],
      answer: 1,
      hints: [
        'Một ngày ấm mới trả lời được mọi ngày đang chờ mà lạnh hơn nó.',
        'Giữ các ngày đang chờ sao cho nhiệt độ giảm dần từ đáy lên đỉnh.',
      ],
      solution:
        'Ngăn xếp đơn điệu giữ các ngày còn chờ, ngày lạnh nhất ở đỉnh. Mỗi ngày mới lấy ra và trả lời mọi ngày lạnh hơn nó, rồi chính nó được đưa vào. Mỗi ngày được push một lần và pop nhiều nhất một lần, nên tổng chi phí là O(n).',
    },
    {
      type: 'number',
      prompt:
        'Băm. Một bảng có 7 ô, h(k) = k mod 7, và va chạm được xử lí bằng dò tuyến tính (linear probing), tức thử ô kế tiếp. Thêm 10, 17 và 24 vào bảng rỗng. Số 24 nằm ở ô nào?',
      answer: 5,
      hints: [
        'Cả ba khoá đều băm vào cùng một ô: 10, 17 và 24 đều chia 7 dư 3.',
        'Ô 3 thuộc về 10, ô 4 thuộc về 17.',
      ],
      solution:
        '10 vào ô 3. 17 cũng băm vào 3, thấy ô đã đầy nên lấy ô 4. 24 băm vào 3, dò tiếp ô 4 và cuối cùng lấy ô 5. Các khoá dồn cụm làm dãy dò dài ra, vì thế hệ số tải được giữ ở mức thấp.',
    },
    {
      type: 'choice',
      prompt:
        'Chọn cấu trúc. Cho n số và một giá trị đích, hãy quyết định có hai số nào cộng lại bằng giá trị đích không, trong thời gian kì vọng O(n). Cấu trúc nào phù hợp?',
      options: [
        'Một tập băm chứa các số đã gặp: với mỗi x, tra cứu target − x',
        'Một ngăn xếp chứa các số',
        'Một danh sách liên kết đã sắp xếp',
        'Một heap lớn nhất chứa các số',
      ],
      answer: 0,
      hints: [
        'Với mỗi số, câu hỏi là “mình đã gặp số đi cặp với nó chưa?”.',
        'Cấu trúc nào trả lời câu hỏi “có thuộc tập không” trong thời gian kì vọng O(1)?',
      ],
      solution:
        'Quét một lần; với mỗi x, kiểm tra target − x có trong tập băm không, rồi thêm x vào. Mỗi lần tra cứu và thêm tốn O(1) kì vọng, nên cả lần quét là O(n). Sắp xếp trước rồi dùng hai con trỏ cũng được, nhưng tốn O(n log n).',
    },
    {
      type: 'number',
      prompt:
        'Đệ quy. Hàm fib(n) cài đặt ngây thơ trả về n khi n ≤ 1 và fib(n − 1) + fib(n − 2) trong các trường hợp còn lại. Lời gọi fib(5) tạo ra tổng cộng bao nhiêu lời gọi, tính cả lời gọi đầu tiên?',
      answer: 15,
      unit: 'lời gọi',
      hints: [
        'Gọi C(n) là số lời gọi: C(0) = C(1) = 1 và C(n) = 1 + C(n − 1) + C(n − 2).',
        'C(2) = 3, C(3) = 5, C(4) = 9.',
      ],
      solution:
        'C(2) = 1 + 1 + 1 = 3, C(3) = 1 + 3 + 1 = 5, C(4) = 1 + 5 + 3 = 9, C(5) = 1 + 9 + 5 = 15. Số lời gọi tăng giống như chính dãy Fibonacci, tức theo hàm mũ, vì cùng một bài toán con bị giải đi giải lại.',
    },
    {
      type: 'order',
      prompt:
        'Cây. Thêm 50, 30, 70, 20, 40, 60, 80 vào một cây nhị phân tìm kiếm (BST) rỗng. Sắp các khoá theo thứ tự duyệt trước (preorder): nút, rồi cây con trái, rồi cây con phải.',
      items: ['20', '30', '40', '50', '60', '70', '80'],
      answer: [3, 1, 0, 2, 5, 4, 6],
      hints: [
        '50 là gốc, 30 là con trái và 70 là con phải của nó.',
        'Duyệt trước thăm gốc trước, rồi toàn bộ cây con trái, rồi toàn bộ cây con phải.',
      ],
      solution:
        'Cây có gốc 50, con trái 30 (các con 20 và 40) và con phải 70 (các con 60 và 80). Duyệt trước cho 50, 30, 20, 40, 70, 60, 80. Còn liệt kê các khoá theo thứ tự tăng dần chính là duyệt giữa.',
    },
    {
      type: 'number',
      prompt:
        'Heap. Một heap nhị phân được lưu trong mảng có chỉ số từ 0, nên các con của i là 2i + 1 và 2i + 2. Cha của chỉ số 9 có chỉ số bao nhiêu?',
      answer: 4,
      hints: ['Cha của i là ⌊(i − 1) / 2⌋.', 'Kiểm tra lại: các con của chỉ số 4 là 9 và 10.'],
      solution:
        'Cha là ⌊(9 − 1) / 2⌋ = 4, và đúng là 2 · 4 + 1 = 9. Vì heap là một cây đầy đủ, các công thức này thay được cho con trỏ.',
    },
    {
      type: 'choice',
      prompt:
        'Chọn cấu trúc. Các số lần lượt đến từng số một, và vào bất kì lúc nào bạn cũng phải báo được 10 số lớn nhất đã gặp, chỉ giữ 10 số trong bộ nhớ. Cấu trúc nào phù hợp?',
      options: [
        'Một heap nhỏ nhất chứa tối đa 10 số',
        'Một heap lớn nhất chứa mọi số',
        'Một hàng đợi chứa 10 số gần nhất',
        'Một mảng đã sắp xếp chứa mọi số',
      ],
      answer: 0,
      hints: [
        'Bạn cần biết nhanh số nào yếu nhất trong top 10 hiện tại.',
        'Khi một số mới lớn hơn số yếu nhất đó, số yếu nhất bị loại.',
      ],
      solution:
        'Giữ một heap nhỏ nhất kích thước 10. Gốc của nó là số nhỏ nhất trong top 10 hiện tại; một số mới lớn hơn gốc sẽ thay gốc trong O(log 10). Giữ mọi số thì cần O(n) bộ nhớ, còn 10 số gần nhất chưa chắc là 10 số lớn nhất.',
    },
    {
      type: 'choice',
      prompt:
        'Đồ thị. Trong một mê cung dạng lưới, mỗi bước đi giữa hai ô trống kề nhau có chi phí như nhau, và bạn muốn đi từ điểm xuất phát đến đích với ít bước nhất. Thuật toán nào phù hợp?',
      options: [
        'Duyệt theo chiều rộng với một hàng đợi',
        'Duyệt theo chiều sâu với một ngăn xếp',
        'Sắp xếp tô-pô',
        'Tìm kiếm nhị phân trên các ô',
      ],
      answer: 0,
      hints: [
        'Cách duyệt nào thăm các ô theo thứ tự khoảng cách tới điểm xuất phát?',
        'DFS tìm được một đường đi, nhưng không nhất thiết là đường ngắn.',
      ],
      solution:
        'BFS thăm các ô theo từng lớp: mọi ô cách 1 bước, rồi mọi ô cách 2 bước, và cứ thế. Lần đầu tiên nó chạm tới đích là theo một đường ít bước nhất, trong thời gian O(rows × cols). DFS có thể đi lang thang theo một đường dài trước.',
    },
    {
      type: 'multi',
      prompt: 'Đồ thị. Những đồ thị vô hướng nào dưới đây là đồ thị hai phía (tô được bằng 2 màu)?',
      options: [
        'Một chu trình 4 đỉnh',
        'Một tam giác (chu trình 3 đỉnh)',
        'Một cây bất kì',
        'Một chu trình 5 đỉnh',
        'Một đồ thị lưới hình chữ nhật',
      ],
      answers: [0, 2, 4],
      hints: [
        'Một đồ thị là hai phía khi và chỉ khi nó không có chu trình độ dài lẻ.',
        'Tô màu một ô lưới theo việc hàng + cột là chẵn hay lẻ.',
      ],
      solution:
        'Một đồ thị là hai phía khi và chỉ khi nó không có chu trình lẻ. Chu trình 4 đỉnh, mọi cây (không có chu trình nào) và lưới (tô theo tính chẵn lẻ của hàng + cột) đều là hai phía; tam giác và chu trình 5 đỉnh là chu trình lẻ.',
    },
    {
      type: 'order',
      prompt:
        'Đồ thị. Môn học tiên quyết: Nhập môn → Toán rời rạc, Nhập môn → Cấu trúc dữ liệu, Toán rời rạc → Cấu trúc dữ liệu, Cấu trúc dữ liệu → Thuật toán, Toán rời rạc → Thuật toán, Thuật toán → Chương trình dịch. Sắp các môn theo thứ tự tô-pô hợp lệ duy nhất.',
      items: ['Thuật toán', 'Chương trình dịch', 'Cấu trúc dữ liệu', 'Toán rời rạc', 'Nhập môn'],
      answer: [4, 3, 2, 0, 1],
      hints: [
        'Bắt đầu với môn không có môn tiên quyết nào.',
        'Với thuật toán Kahn, ở mỗi bước có đúng một môn không còn môn tiên quyết nào chưa học.',
      ],
      solution:
        'Thuật toán Kahn lấy Nhập môn (không có môn tiên quyết), rồi Toán rời rạc, rồi Cấu trúc dữ liệu (các môn tiên quyết của nó giờ đã xong), rồi Thuật toán, rồi Chương trình dịch. Ở mỗi bước chỉ có một môn sẵn sàng, nên thứ tự này là duy nhất: Nhập môn, Toán rời rạc, Cấu trúc dữ liệu, Thuật toán, Chương trình dịch.',
    },
  ],
};
