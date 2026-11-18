/** @typedef {import('$lib/algo-engine/heapsort.js').HeapFrame} HeapFrame */

export const vi = {
  slug: 'heapsort',
  topic: 'sorting',
  level: 'Trung bình',
  title: 'Heapsort',
  intro:
    'Heapsort (sắp xếp vun đống) trước hết sắp lại mảng thành một max-heap (heap lớn nhất): một cây nhị phân lưu ngay trong mảng, trong đó mọi nút cha đều lớn hơn hoặc bằng các nút con. Khi đó giá trị lớn nhất nằm ở gốc, nên ta đổi chỗ gốc về cuối mảng, thu heap (đống) lại một phần tử rồi sửa lại heap. Thuật toán tốn O(n log n) kể cả trong trường hợp xấu nhất và không cần mảng phụ.',
  summary:
    'Đi từng bước heapsort trên hình cây và hình mảng gắn với nhau: dựng max-heap, rồi đưa giá trị lớn nhất về cuối và đẩy xuống cho đến khi mảng được sắp xếp.',
  instruction:
    'Gõ tối đa 15 giá trị, hoặc chọn một mảng ban đầu rồi bấm Mảng mới để lấy mảng khác, sau đó đi từng bước. Cây và mảng bên dưới là cùng một dữ liệu: ô i có các con là 2i + 1 và 2i + 2. Để ý phần đuôi đã sắp xếp (màu nhạt) lớn dần từ bên phải.',
  valuesLabel: 'Các giá trị',
  presetLabel: 'Mảng ban đầu',
  presets: {
    random: 'Ngẫu nhiên',
    sorted: 'Đã sắp xếp',
    reversed: 'Đảo ngược',
    'few-unique': 'Ít giá trị khác nhau',
  },
  valueErrors: {
    format: 'Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 4, 10, 3.',
    range: 'Mọi giá trị phải nằm trong khoảng 0–99.',
    count: 'Hãy gõ từ 2 đến 15 giá trị.',
  },
  newArrayButton: 'Mảng mới',
  newArrayNotice: 'Đã nạp mảng mới.',
  heapTitle: 'Heap ở dạng cây và dạng mảng',
  /** @param {number[]} values @param {number} size */
  heapAria: (values, size) =>
    `Mảng: ${values.join(', ')}. Heap gồm các ô 0 đến ${size - 1}${size < values.length ? `; các ô ${size} đến ${values.length - 1} đã xếp xong` : ''}.`,
  emptyHeapAria: (/** @type {number[]} */ values) =>
    `Mảng: ${values.join(', ')}. Đã xếp xong toàn bộ.`,
  stats: {
    comparisons: 'Số lần so sánh',
    swaps: 'Số lần đổi chỗ',
    size: 'Kích thước heap',
    phase: 'Giai đoạn',
  },
  phases: { build: 'Dựng heap', sort: 'Lấy giá trị lớn nhất' },
  /** @param {number} n */
  boundLabel: (n) => `2n·log₂ n với n = ${n}`,
  legend: {
    node: 'Đang đẩy xuống',
    child: 'Con lớn hơn',
    compare: 'Đang so sánh',
    swap: 'Đang đổi chỗ',
    sorted: 'Đuôi đã xếp',
  },
  markers: { node: 'i', child: 'c', compare: '?', swap: '⇄', sorted: '✓' },
  /** @param {HeapFrame} f */
  describe(f) {
    const v = (/** @type {number} */ i) => f.values[i];
    const n = f.values.length;
    switch (f.kind) {
      case 'start':
        return n < 2
          ? 'Chỉ có một giá trị thì đã được sắp xếp.'
          : `Trước hết, ta biến mảng thành một max-heap, nơi mọi nút cha ≥ các nút con. Mỗi lá tự nó đã là một heap, nên ta đẩy xuống từng nút trong, từ ô ${Math.floor(n / 2) - 1} lùi về ô 0.`;
      case 'sift':
        return f.phase === 'build'
          ? `Đẩy xuống ô ${f.node} (${v(f.node)}): các cây con của nó đã là heap.`
          : `Đẩy gốc mới ${v(0)} xuống để khôi phục heap gồm ${f.size} phần tử.`;
      case 'children': {
        const [l, r] = f.focus;
        return r === undefined
          ? `Ô ${f.node} có một con, ${v(l)} ở ô ${l}.`
          : `Các con của ô ${f.node}: ${v(l)} và ${v(r)}. Con lớn hơn là ${v(f.child)} ở ô ${f.child}.`;
      }
      case 'compare':
        return f.stop
          ? `${v(f.child)} ≤ ${v(f.node)}: nút cha không nhỏ hơn, nên thứ tự heap vẫn đúng. Dừng.`
          : `${v(f.child)} > ${v(f.node)}: nút con lớn hơn, nên hai nút đổi chỗ.`;
      case 'swap':
        return `Đã đổi chỗ: ${v(f.node)} xuống ô ${f.node} và tiếp tục đẩy xuống.`;
      case 'leaf':
        return `Ô ${f.node} không có con nào trong heap, nên việc đẩy xuống kết thúc.`;
      case 'extract':
        return `Gốc đang giữ giá trị lớn nhất, ${v(f.size)}. Đổi chỗ nó về ô ${f.size}, vị trí cuối cùng của nó. Heap thu lại còn ${f.size} phần tử.`;
      case 'done':
        return `Đã sắp xếp xong với ${f.comparisons} lần so sánh và ${f.swaps} lần đổi chỗ, tất cả ngay trong mảng.`;
    }
  },
  takeaways: [
    'Một max-heap lưu trong mảng không cần con trỏ: các con của ô i là 2i + 1 và 2i + 2, còn cha của nó là ⌊(i − 1)/2⌋.',
    'Dựng heap từ dưới lên chỉ tốn O(n): phần lớn các nút nằm gần đáy và chỉ đẩy xuống một hai tầng.',
    'Mỗi lần trong n − 1 lần lấy giá trị lớn nhất, ta đổi chỗ gốc về cuối và đẩy xuống nhiều nhất log₂ n tầng, nên heapsort tốn O(n log n) kể cả trong trường hợp xấu nhất. Khác với quicksort (sắp xếp nhanh), không đầu vào nào làm nó tốn thời gian bậc hai.',
    'Thuật toán sắp xếp tại chỗ (in-place) với O(1) bộ nhớ thêm, khác với merge sort (sắp xếp trộn), nhưng nó không ổn định (stable), và việc nhảy qua lại trong mảng khiến nó chậm hơn quicksort trong thực tế.',
    'Thử mảng “Đã sắp xếp”: giai đoạn dựng heap phải dời gần như mọi giá trị, còn mảng “Đảo ngược” vốn đã là max-heap nên dựng xong mà không đổi chỗ lần nào.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Dựng heap',
      'O(n)',
      'Một nút ở chiều cao h đẩy xuống nhiều nhất h tầng; tổng trên mọi nút nhỏ hơn 2n.',
    ],
    [
      'Một lần lấy giá trị lớn nhất',
      'O(log n)',
      'Một lần đổi chỗ, rồi đẩy xuống theo chiều cao của cây.',
    ],
    [
      'Cả quá trình, xấu nhất',
      'O(n log n)',
      'n − 1 lần lấy ra, mỗi lần O(log n); không đầu vào nào tệ hơn.',
    ],
    ['Bộ nhớ thêm', 'O(1)', 'Heap nằm ngay trong mảng; phần đuôi đã xếp lớn dần phía sau nó.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt:
        'Dựng max-heap từ 4, 10, 3, 5, 1 theo cách từ dưới lên. Gõ mảng sau khi dựng xong, các số cách nhau bằng dấu phẩy.',
      accept: ['10, 5, 3, 4, 1', '10 5 3 4 1', '[10, 5, 3, 4, 1]', '10,5,3,4,1'],
      hints: [
        'n = 5, nên ta đẩy xuống ô 1 rồi đến ô 0.',
        'Ô 1 (10) có các con 5 và 1: nó đã lớn hơn rồi. Sau đó đẩy xuống ô 0 (4).',
      ],
      solution:
        'Ô 1 giữ 10, lớn hơn các con 5 và 1, nên không có gì di chuyển. Ô 0 giữ 4; con lớn hơn của nó là 10, nên hai ô đổi chỗ: 10, 4, 3, 5, 1. Giờ 4 ở ô 1 có các con 5 và 1; 5 lớn hơn, nên chúng đổi chỗ: 10, 5, 3, 4, 1.',
    },
    {
      type: 'number',
      prompt: 'Trong heap lưu bằng mảng đánh chỉ số từ 0, con trái của ô 4 nằm ở ô nào?',
      answer: 9,
      hints: ['Con trái của ô i là 2i + 1.'],
      solution: '2 × 4 + 1 = 9. Con phải là ô 10, còn cha của ô 4 là ⌊3/2⌋ = 1.',
    },
    {
      type: 'number',
      prompt: 'Khi dựng heap gồm 10 giá trị, ô nào được đẩy xuống đầu tiên?',
      answer: 4,
      hints: [
        'Các lá không cần xử lí. Ô cuối cùng có con chính là cha của ô cuối cùng.',
        'Ô cuối cùng là 9, và cha của nó là ⌊(9 − 1)/2⌋.',
      ],
      solution:
        'Việc dựng heap bắt đầu ở ⌊n/2⌋ − 1 = 4, cha của ô 9. Các ô 5 đến 9 là lá, tự chúng đã là heap.',
    },
    {
      type: 'choice',
      prompt:
        'Heapsort các lá bài 2a, 2b, 1, trong đó chữ cái chỉ đánh dấu thứ tự đầu vào. Thứ tự cuối cùng là gì?',
      options: ['1, 2a, 2b', '1, 2b, 2a', '2a, 2b, 1', '2b, 2a, 1'],
      answer: 1,
      hints: [
        'Đầu vào đã là một max-heap: 2a ở gốc, các con là 2b và 1.',
        'Lần lấy ra đầu tiên đổi chỗ gốc 2a với ô 2.',
      ],
      solution:
        'Lần lấy ra thứ nhất đưa 2a về ô 2: 1, 2b, 2a. Đẩy 1 xuống thì nó đổi chỗ với 2b: 2b, 1, 2a. Lần lấy ra thứ hai đưa 2b về ô 1: 1, 2b, 2a. Hai lá 2 kết thúc sai thứ tự, nên heapsort không ổn định.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo là cận dưới của sắp xếp bằng so sánh: vì sao không thuật toán nào chỉ dựa vào phép so sánh lại nhanh hơn O(n log n).',
};
