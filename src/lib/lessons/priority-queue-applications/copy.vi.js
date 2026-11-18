/** @typedef {import('$lib/algo-engine/priority-queue-applications.js').MergeFrame} MergeFrame */
/** @typedef {import('$lib/algo-engine/priority-queue-applications.js').TopKFrame} TopKFrame */

/** @param {number} j */
const listName = (j) => 'ABCDE'[j] ?? String(j + 1);

export const vi = {
  slug: 'priority-queue-applications',
  topic: 'heaps',
  level: 'Trung bình',
  title: 'Ứng dụng của priority queue',
  intro:
    'Priority queue (hàng đợi ưu tiên) luôn trao ra phần tử cấp bách nhất trước, và heap nhị phân (đống nhị phân) làm cho mỗi lần push và pop chỉ tốn O(log n). Nhiều bài toán trở nên dễ ngay khi ta tự hỏi “phần tử nào nên đi tiếp theo?”: trộn k danh sách đã sắp xếp, giữ k giá trị lớn nhất của một dòng dữ liệu, và chạy các sự kiện theo thứ tự thời gian.',
  summary:
    'Trộn k danh sách đã sắp xếp bằng cách lấy phần tử đầu nhỏ nhất ra khỏi một min-heap, và giữ k giá trị lớn nhất của một dòng dữ liệu bằng min-heap cỡ k, từng bước một.',
  instruction:
    'Chọn một bài toán. Với Trộn, nhập các danh sách đã sắp xếp, ngăn cách bằng /, và xem mỗi lần pop lấy phần tử đầu nhỏ nhất rồi push giá trị tiếp theo của chính danh sách đó. Với Top k, nhập một dòng dữ liệu và k, rồi xem một giá trị chỉ được vào khi nó lớn hơn min của heap.',
  problemLabel: 'Bài toán',
  problems: { merge: 'Trộn k danh sách đã sắp xếp', 'top-k': 'Top k số lớn nhất' },
  listsLabel: 'Các danh sách đã sắp xếp, ngăn cách bằng /',
  streamLabel: 'Dòng dữ liệu',
  kLabel: 'k',
  newInputButton: 'Đầu vào mới',
  newInputNotice: 'Đã nạp đầu vào mới.',
  listErrors: {
    format:
      'Hãy nhập các số nguyên trong mỗi danh sách, và ngăn cách các danh sách bằng /, ví dụ 1, 4 / 2, 3.',
    range: 'Mọi giá trị phải từ 0 đến 99.',
    count: 'Hãy nhập từ 2 đến 5 danh sách.',
    length: 'Mỗi danh sách chứa tối đa 6 giá trị.',
    unsorted: 'Mỗi danh sách phải được sắp xếp từ nhỏ đến lớn.',
  },
  streamErrors: {
    format: 'Hãy nhập các số nguyên cách nhau bằng dấu phẩy hoặc dấu cách.',
    range: 'Mọi giá trị phải từ 0 đến 99.',
    count: 'Dòng dữ liệu chứa tối đa 16 giá trị.',
  },
  kError: 'k phải là số nguyên từ 1 đến 6.',
  listName,
  /** @param {number} j @param {number[]} values */
  listAria: (j, values) => `Danh sách ${listName(j)}: ${values.join(', ') || 'rỗng'}.`,
  /** @param {number} i @param {number} value @param {string} state */
  cellLabel: (i, value, state) => `Vị trí ${i}: ${value}${state ? `, ${state}` : ''}`,
  /** @param {number} i @param {number} value @param {number} list @param {string} state */
  outCellLabel: (i, value, list, state) =>
    `Vị trí ${i}: ${value} từ danh sách ${listName(list)}, ${state}`,
  headPointer: 'đầu',
  nextPointer: 'tiếp',
  listsTitle: 'Các danh sách đầu vào',
  heapTitle: 'Min-heap',
  /** @param {string[]} labels */
  heapAria: (labels) =>
    labels.length === 0 ? 'Heap đang rỗng.' : `Min-heap dạng mảng: ${labels.join(', ')}.`,
  /** @param {number} value @param {number} list */
  entryLabel: (value, list) => `${value} từ danh sách ${listName(list)}`,
  /** @param {number} i @param {string} label @param {string} state */
  slotLabel: (i, label, state) => `Ô ${i}: ${label}${state ? `, ${state}` : ''}`,
  outTitle: 'Kết quả sau khi trộn',
  outAria: (/** @type {number[]} */ values) =>
    values.length === 0 ? 'Kết quả: rỗng.' : `Kết quả: ${values.join(', ')}.`,
  streamTitle: 'Dòng dữ liệu',
  streamAria: (/** @type {number[]} */ values) => `Dòng dữ liệu: ${values.join(', ') || 'rỗng'}.`,
  states: {
    active: 'đang xử lí',
    frontier: 'đang trong heap',
    visited: 'đã xong',
    compare: 'min của heap',
    sorted: 'đã vào kết quả',
  },
  legendMerge: {
    active: 'Vừa push hoặc pop',
    frontier: 'Phần tử đầu đang chờ trong heap',
    visited: 'Đã trộn',
    sorted: 'Kết quả, đánh dấu danh sách nguồn',
  },
  outMarker: 'A–E',
  legendTopK: {
    active: 'Giá trị đang đọc, hoặc chỗ nó dừng lại',
    compare: 'Min của heap: số lớn thứ k tới giờ',
    visited: 'Đã đọc',
  },
  markers: { active: '▶', frontier: 'h', visited: '✓', sorted: '✓', compare: 'min' },
  stats: {
    comparisons: 'Số phép so sánh',
    heapOps: 'Số lần push và pop',
    n: 'Số giá trị n',
    k: 'Số danh sách k',
    kTop: 'k',
    /** @param {number} n @param {number} k */
    bound: (n, k) => `n·log₂ k với n = ${n}, k = ${k}`,
  },
  resultTitle: 'Top k, lớn nhất trước',
  resultEmpty: 'chưa có',
  /** @param {MergeFrame} f @param {number[][]} lists */
  describeMerge(f, lists) {
    const name = listName(f.list);
    switch (f.kind) {
      case 'start':
        return `Trộn ${lists.length} danh sách đã sắp xếp gồm ${lists.flat().length} giá trị. Chỉ các phần tử đầu mới có thể đi tiếp, nên đưa phần tử đầu của mỗi danh sách vào một min-heap.`;
      case 'seed':
        return `Push ${f.value}, phần tử đầu của danh sách ${name}.`;
      case 'pop':
        return `Pop phần tử đầu nhỏ nhất, ${f.value} từ danh sách ${name}, và thêm nó vào cuối kết quả.`;
      case 'push':
        return `Danh sách ${name} đi tiếp: push giá trị tiếp theo của nó, ${f.value}. Heap lại giữ đúng một phần tử đầu cho mỗi danh sách chưa hết.`;
      case 'exhausted':
        return `Danh sách ${name} đã hết giá trị, nên không có gì thay vào. Heap nhỏ lại.`;
      case 'done':
        return `Đã trộn ${f.out.length} giá trị với ${f.heapOps} thao tác trên heap và ${f.comparisons} phép so sánh. Heap chưa bao giờ chứa quá ${lists.length} phần tử.`;
    }
  },
  /** @param {TopKFrame} f @param {number} k */
  describeTopK(f, k) {
    switch (f.kind) {
      case 'start':
        return `Giữ ${k} giá trị lớn nhất trong một min-heap cỡ ${k}. Min của heap là số nhỏ nhất trong nhóm thắng, chính là số cần vượt qua.`;
      case 'read':
        return `Đọc ${f.value}.`;
      case 'push':
        return `Heap đang có ít hơn ${k} giá trị, nên push ${f.value}.`;
      case 'replace':
        return `${f.value} > min ${f.evicted}: bỏ ${f.evicted}, đặt ${f.value} vào gốc rồi vun xuống.`;
      case 'skip':
        return `${f.value} ≤ min ${f.heap[0]}: nó không thể thuộc ${k} số lớn nhất. Bỏ qua.`;
      case 'done':
        return f.heap.length === 0
          ? 'Dòng dữ liệu rỗng.'
          : `Xong. Heap giữ ${f.heap.length} giá trị lớn nhất, và gốc ${f.heap[0]} của nó là ${f.heap.length === k ? `số lớn thứ ${k}` : 'số nhỏ nhất trong nhóm đó'}.`;
    }
  },
  takeaways: [
    'Hãy nghĩ tới priority queue mỗi khi câu hỏi là “phần tử nào tiếp theo?” và tập ứng viên thay đổi trong lúc làm.',
    'Trộn k danh sách đã sắp xếp chỉ cần k phần tử đầu. Pop phần tử nhỏ nhất, push phần tử đứng sau nó: n lần pop và n lần push trên heap cỡ k tốn O(n log k).',
    'Để giữ k số lớn nhất của một dòng dữ liệu, dùng min-heap (heap nhỏ nhất) cỡ k: gốc của nó là mức cần vượt qua. Cách này tốn thời gian O(n log k) và bộ nhớ O(k), kể cả khi dòng dữ liệu quá dài để lưu hết.',
    'Mô phỏng sự kiện giữ các sự kiện tương lai trong min-heap theo thời gian; pop sự kiện sớm nhất rồi push những sự kiện nó gây ra thì luôn xử lí đúng thứ tự thời gian. Thuật toán Dijkstra tìm đường đi ngắn nhất cũng làm như vậy.',
    'Thử một dòng chỉ tăng, như 1, 2, 3, … với k = 3: mọi giá trị sau giá trị thứ ba đều thay gốc. Một dòng giảm dần thì bỏ qua mọi giá trị sau giá trị thứ ba.',
  ],
  complexityHead: ['Việc', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Trộn k danh sách, n giá trị',
      'O(n log k)',
      'Mỗi giá trị được push và pop một lần trên heap có không quá k phần tử.',
    ],
    [
      'Trộn bằng cách quét lặp lại',
      'O(n·k)',
      'Quét để tìm phần tử nhỏ nhất trong k phần tử đầu tốn k cho mỗi giá trị.',
    ],
    [
      'Top k trong n giá trị',
      'O(n log k)',
      'Một phép so sánh cho mỗi giá trị, cộng một lần vun O(log k) khi nó được vào.',
    ],
    [
      'Top k bằng cách sắp xếp',
      'O(n log n)',
      'Sắp xếp tất cả tốn nhiều công hơn và cần giữ cả n giá trị trong bộ nhớ.',
    ],
    ['Bộ nhớ', 'O(k)', 'Heap giữ một phần tử cho mỗi danh sách, hoặc k số thắng.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trộn các danh sách 1, 4, 9 / 2, 3, 8 / 5, 6, 7. Lần pop thứ tư trả về giá trị nào?',
      answer: 4,
      hints: [
        'Kết quả của phép trộn là mọi giá trị theo thứ tự đã sắp xếp.',
        'Đã sắp xếp: 1, 2, 3, 4, …',
      ],
      solution:
        'Các lần pop trả về 1, 2, 3, 4, … theo thứ tự đã sắp xếp. Lần pop thứ tư lấy 4 từ danh sách thứ nhất, sau khi 3 đã được pop và 8 được push.',
    },
    {
      type: 'choice',
      prompt: 'Để giữ 10 giá trị lớn nhất của một dòng dữ liệu dài, em giữ heap nào?',
      options: [
        'Một max-heap chứa mọi giá trị đã gặp',
        'Một min-heap cỡ 10',
        'Một max-heap cỡ 10',
        'Một min-heap chứa mọi giá trị đã gặp',
      ],
      answer: 1,
      hints: [
        'Giá trị mới phải vượt qua số yếu nhất trong nhóm đang thắng. Heap nào cho thấy số đó?',
      ],
      solution:
        'Min-heap cỡ 10 giữ số thắng nhỏ nhất ở gốc, nên chỉ một phép so sánh là biết giá trị mới có được vào không. Heap chứa tất cả thì tốn bộ nhớ O(n).',
    },
    {
      type: 'number',
      prompt:
        'Top 3 của dòng dữ liệu 5, 1, 9, 3, 7, 2, 8 với min-heap cỡ 3: có bao nhiêu giá trị thay gốc?',
      answer: 3,
      unit: 'giá trị',
      hints: [
        'Ba giá trị đầu lấp đầy heap: 1, 5, 9 với gốc 1.',
        'Sau đó lần lượt so sánh 3, 7, 2, 8 với gốc hiện tại.',
      ],
      solution:
        '3 > 1 thay 1 (gốc 3); 7 > 3 thay 3 (gốc 5); 2 ≤ 5 bị bỏ qua; 8 > 5 thay 5. Ba lần thay; heap cuối cùng là 7, 8, 9.',
    },
    {
      type: 'order',
      prompt:
        'Một chương trình mô phỏng giữ các sự kiện trong min-heap theo thời gian. Heap đang có “xe buýt lúc 9”, “chuông báo lúc 7” và “thư lúc 8”. Pop “chuông báo lúc 7” sẽ hẹn thêm “cà phê lúc 10”. Các sự kiện được xử lí theo thứ tự nào?',
      items: ['xe buýt lúc 9', 'cà phê lúc 10', 'chuông báo lúc 7', 'thư lúc 8'],
      answer: [2, 3, 0, 1],
      hints: ['Mỗi lần pop lấy thời điểm sớm nhất trong heap, kể cả các sự kiện thêm vào sau.'],
      solution:
        'Chuông báo (7) trước; nó thêm cà phê (10). Rồi đến thư (8), xe buýt (9) và cà phê (10): luôn là thời điểm sớm nhất đang chờ.',
    },
  ],
  nextTeaser:
    'Hai heap đặt cạnh nhau còn tìm được trung vị của cả một dòng dữ liệu. Thử sức ở Luyện tập: bài toán về heap.',
};
