/** @typedef {import('$lib/algo-engine/build-heap.js').BuildHeapFrame} BuildHeapFrame */

export const vi = {
  slug: 'build-heap',
  topic: 'heaps',
  level: 'Trung bình',
  title: 'Dựng heap trong thời gian tuyến tính',
  intro:
    'Để biến n giá trị thành một heap (đống), ta có thể chèn lần lượt từng giá trị, mỗi lần tốn O(log n). Heapify (vun đống) từ dưới lên làm tốt hơn: coi mảng là một cây, bỏ qua các lá và vun xuống mọi nút còn lại, từ nút cha cuối cùng ngược về gốc. Cả quá trình chỉ tốn O(n), vì phần lớn các nút nằm gần đáy và chỉ có thể chìm xuống một hai tầng.',
  summary:
    'Chạy từng bước cách heapify từ dưới lên và cách chèn lần lượt trên cùng một mảng, với bảng theo từng tầng cho thấy vì sao cách từ dưới lên chỉ tốn O(n).',
  instruction:
    'Nhập tối đa 31 giá trị hoặc chọn kích thước và mảng ban đầu, rồi chạy từng bước. Chuyển qua lại giữa Từ dưới lên và Chèn lần lượt rồi so sánh số lần đổi chỗ. Trong bảng các tầng, để ý công việc dồn vào đâu: phần lớn các nút nằm ở các tầng dưới cùng.',
  methodLabel: 'Cách dựng',
  methods: { 'bottom-up': 'Từ dưới lên', 'one-by-one': 'Chèn lần lượt' },
  valuesLabel: 'Các giá trị',
  presetLabel: 'Mảng ban đầu',
  presets: { random: 'Ngẫu nhiên', ascending: 'Tăng dần', descending: 'Giảm dần' },
  sizeLabel: 'Kích thước',
  newArrayButton: 'Mảng mới',
  newArrayNotice: 'Đã nạp mảng mới.',
  valueErrors: {
    format: 'Hãy nhập các số nguyên cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 9, 4, 7.',
    range: 'Mọi giá trị phải từ 0 đến 99.',
    count: 'Hãy nhập từ 2 đến 31 giá trị.',
  },
  heapTitle: 'Mảng dạng cây',
  /** @param {number[]} values @param {number} region @param {'bottom-up'|'one-by-one'} method */
  heapAria: (values, region, method) =>
    method === 'bottom-up'
      ? `Mảng dạng cây: ${values.join(', ')}.`
      : `Heap hiện tại: ${values.slice(0, region).join(', ') || 'rỗng'}. Đang chờ: ${values.slice(region).join(', ') || 'không còn'}.`,
  arrayAria: (/** @type {number[]} */ values) => `Mảng: ${values.join(', ')}.`,
  /** @param {number} i @param {number} value @param {string} state */
  slotLabel: (i, value, state) => `Ô ${i}: ${value}${state ? `, ${state}` : ''}`,
  states: {
    active: 'đang được vun',
    frontier: 'con được chọn',
    compare: 'đang so sánh',
    swap: 'vừa đổi chỗ',
    visited: 'gốc của một heap đã xong',
    waiting: 'chưa được chèn',
  },
  legend: {
    active: 'Giá trị đang được vun',
    frontier: 'Con được chọn',
    compare: 'Đang so sánh',
    swap: 'Vừa đổi chỗ',
    visited: 'Gốc của một heap con đã xong',
  },
  waitingLegend: 'Mờ: chưa vào heap (cách chèn lần lượt)',
  markers: { active: 'i', frontier: 'c', compare: '?', swap: '⇄', visited: '✓' },
  stats: {
    comparisons: 'Số phép so sánh',
    swaps: 'Số lần đổi chỗ',
    /** @param {number} n */
    bottomUp: (n) => `Tổng của cách từ dưới lên trên ${n} giá trị này`,
    /** @param {number} n */
    oneByOne: (n) => `Tổng của cách chèn lần lượt trên ${n} giá trị này`,
  },
  levelsTitle: 'Số lần đổi chỗ theo tầng của nút bắt đầu vun',
  levelHead: ['Tầng', 'Số nút', 'Tối đa mỗi nút', 'Cận', 'Số lần đổi chỗ'],
  /** @param {number} d */
  levelName: (d) => (d === 0 ? '0 (gốc)' : String(d)),
  totalRow: 'Tổng',
  /** @param {'bottom-up'|'one-by-one'} method */
  levelsNote: (method) =>
    method === 'bottom-up'
      ? 'Một nút chỉ có thể chìm tới đáy, nên các tầng sâu nhất, nơi chứa phần lớn các nút, lại di chuyển ít nhất.'
      : 'Một giá trị mới chỉ có thể leo tới gốc, nên các tầng sâu nhất, nơi chứa phần lớn các nút, lại có thể di chuyển nhiều nhất.',
  /** @param {BuildHeapFrame} f */
  describe(f) {
    const v = (/** @type {number} */ i) => f.values[i];
    const n = f.values.length;
    switch (f.kind) {
      case 'start':
        if (n < 2) return 'Một giá trị đã là một heap.';
        return f.method === 'bottom-up'
          ? `Các ô từ ${Math.floor(n / 2)} đến ${n - 1} là lá, và một lá vốn đã là heap. Vun xuống từng nút cha, từ ô ${Math.floor(n / 2) - 1} ngược về ô 0.`
          : 'Riêng ô 0 đã là một heap. Thêm lần lượt các ô 1, 2, 3, … và vun lên từng ô, như khi chèn.';
      case 'sift':
        return f.method === 'bottom-up'
          ? `Vun xuống ô ${f.start} (${v(f.start)}). Hai cây con của nó đều đã là heap.`
          : `Chèn ô ${f.start} (${v(f.start)}) vào heap gồm các ô 0 đến ${f.start - 1} bằng cách vun lên.`;
      case 'children': {
        const [l, r] = f.focus;
        return r === undefined
          ? `Ô ${f.node} có một con, ${v(l)} ở ô ${l}.`
          : `Các con của ô ${f.node}: ${v(l)} và ${v(r)}. Con nhỏ hơn là ${v(f.other)} ở ô ${f.other}.`;
      }
      case 'compare':
        return f.stop
          ? `${v(f.other)} ≥ ${v(f.node)}: cha đã là nhỏ nhất. Dừng.`
          : `${v(f.other)} < ${v(f.node)}: con nhỏ hơn, nên hai giá trị đổi chỗ.`;
      case 'swap':
        return `Đổi chỗ: ${v(f.node)} chìm xuống ô ${f.node}.`;
      case 'leaf':
        return `Ô ${f.node} là lá, nên việc vun xuống kết thúc.`;
      case 'up-compare':
        return f.stop
          ? `${v(f.node)} ≥ cha của nó là ${v(f.other)}: thứ tự heap vẫn đúng. Dừng.`
          : `${v(f.node)} < cha của nó là ${v(f.other)}: nó phải leo lên.`;
      case 'up-swap':
        return `Đổi chỗ: ${v(f.node)} leo lên ô ${f.node}.`;
      case 'up-root':
        return `${v(0)} đã lên tới gốc: đó là giá trị nhỏ nhất tới giờ.`;
      case 'done':
        return `Mảng đã là một min-heap sau ${f.swaps} lần đổi chỗ và ${f.comparisons} phép so sánh.`;
    }
  },
  takeaways: [
    'Heapify từ dưới lên bỏ qua các lá, khoảng một nửa mảng, và vun xuống từng nút cha từ ô ⌊n/2⌋ − 1 ngược về 0. Khi vun một ô, hai cây con của nó đều đã là heap.',
    'Một lần vun xuống tốn nhiều nhất bằng chiều cao của nút. Một nửa số nút có chiều cao 0, một phần tư có chiều cao 1, một phần tám có chiều cao 2, … nên tổng là n·(1/4 + 2/8 + 3/16 + …) < n lần đổi chỗ: O(n).',
    'Chèn lần lượt tốn O(n log n) trong trường hợp xấu nhất, vì rất nhiều nút ở sâu lại chính là những nút có thể leo xa nhất.',
    'Cách dựng O(n) là lí do pha đầu của heapsort (sắp xếp vun đống) rẻ, và vì sao một priority queue (hàng đợi ưu tiên) dựng từ một danh sách có sẵn nên heapify thay vì chèn từng phần tử.',
    'Thử mảng Giảm dần với kích thước 31 ở cả hai cách: từ dưới lên tốn 26 lần đổi chỗ, chèn lần lượt tốn 98, và mỗi tầng chạm đúng cận của nó.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Dựng từ dưới lên',
      'O(n)',
      'Σ (số nút có chiều cao h) × h ≤ Σ n/2^(h+1) × h < n lần đổi chỗ, mỗi lần hai phép so sánh.',
    ],
    [
      'Chèn lần lượt, trường hợp xấu nhất',
      'O(n log n)',
      'Khoảng n/2 giá trị nằm ở tầng đáy và mỗi giá trị có thể leo log₂ n tầng.',
    ],
    ['Chèn lần lượt, mảng đã là heap', 'O(n)', 'Mỗi lần chèn chỉ một phép so sánh rồi dừng ngay.'],
    ['Bộ nhớ thêm', 'O(1)', 'Cả hai cách đều làm ngay trong mảng.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Heapify từ dưới lên với 20 giá trị: ô nào được vun xuống đầu tiên?',
      answer: 9,
      hints: ['Các lá không cần làm gì. Ô đầu tiên được vun là ⌊n/2⌋ − 1.'],
      solution: '⌊20/2⌋ − 1 = 9. Con trái của nó là ô 19, ô cuối cùng; các ô từ 10 đến 19 là lá.',
    },
    {
      type: 'text',
      prompt:
        'Vun 9, 4, 7, 1, 8, 2, 6 thành min-heap (heap nhỏ nhất) theo cách từ dưới lên. Nhập mảng sau khi dựng xong, các số cách nhau bằng dấu phẩy.',
      accept: ['1, 4, 2, 9, 8, 7, 6', '1 4 2 9 8 7 6', '[1, 4, 2, 9, 8, 7, 6]', '1,4,2,9,8,7,6'],
      hints: [
        'Vun ô 2, rồi ô 1, rồi ô 0.',
        'Ô 2 (7) đổi chỗ với 2; ô 1 (4) đổi chỗ với 1; sau đó 9 chìm từ gốc xuống hai tầng.',
      ],
      solution:
        'Ô 2: 7 đổi chỗ với con nhỏ hơn là 2 → 9, 4, 2, 1, 8, 7, 6. Ô 1: 4 đổi chỗ với 1 → 9, 1, 2, 4, 8, 7, 6. Ô 0: 9 đổi chỗ với 1, rồi với 4 → 1, 4, 2, 9, 8, 7, 6.',
    },
    {
      type: 'number',
      prompt:
        'Một heap đầy gồm 15 giá trị có các tầng từ 0 đến 3. Heapify từ dưới lên có thể đổi chỗ tổng cộng nhiều nhất bao nhiêu lần?',
      answer: 11,
      unit: 'lần',
      hints: [
        'Một nút ở tầng d chỉ có thể chìm nhiều nhất 3 − d tầng.',
        'Các tầng 0, 1, 2 có 1, 2 và 4 nút; tầng 3 có 8 lá.',
      ],
      solution:
        '1·3 + 2·2 + 4·1 + 8·0 = 11. Chèn lần lượt có thể cần tới 0 + 2·1 + 4·2 + 8·3 = 34.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao heapify từ dưới lên tốn O(n) chứ không phải O(n log n)?',
      options: [
        'Mỗi lần vun xuống chỉ tốn O(1).',
        'Phần lớn các nút ở gần đáy, nơi việc vun xuống rất ngắn; chỉ vài nút có thể chìm xa.',
        'Nó bỏ qua một nửa số nút, và n/2 · log n là O(n).',
        'Nó chỉ dùng được với mảng gần như đã sắp xếp.',
      ],
      answer: 1,
      hints: ['Một nút có thể chìm bao xa, và có bao nhiêu nút có ngần ấy chỗ?'],
      solution:
        'Một lần vun xuống tốn tới bằng chiều cao của nút. Một nửa số nút là lá (chiều cao 0) và một phần tư có chiều cao 1; chỉ gốc có chiều cao log₂ n. Tổng Σ h · n/2^(h+1) luôn nhỏ hơn n. Riêng việc bỏ qua các lá thì vẫn còn n/2 · log n.',
    },
  ],
  nextTeaser:
    'Có heap trong tay, ta dùng nó làm priority queue để trộn danh sách và giữ k số lớn nhất. Bài sau: Ứng dụng của priority queue.',
};
