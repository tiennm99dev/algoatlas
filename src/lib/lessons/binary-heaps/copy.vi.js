/** @typedef {import('$lib/algo-engine/binary-heaps.js').BinaryHeapFrame} BinaryHeapFrame */
/** @typedef {import('$lib/algo-engine/binary-heaps.js').HeapOp} HeapOp */
/** @typedef {import('$lib/algo-engine/binary-heaps.js').HeapKind} HeapKind */

/** @param {HeapKind} h */
const word = (h) => (h === 'min' ? 'nhỏ nhất' : 'lớn nhất');
/** @param {HeapKind} h */
const name = (h) => (h === 'min' ? 'min-heap' : 'max-heap');
/** @param {HeapKind} h */
const lt = (h) => (h === 'min' ? '<' : '>');
/** @param {HeapKind} h */
const ge = (h) => (h === 'min' ? '≥' : '≤');

export const vi = {
  slug: 'binary-heaps',
  topic: 'heaps',
  level: 'Cơ bản',
  title: 'Heap nhị phân',
  intro:
    'Heap nhị phân (đống nhị phân) là một cây nhị phân đầy đủ trong đó mỗi nút cha luôn đứng trước các con: trong min-heap (heap nhỏ nhất), không con nào nhỏ hơn cha, nên giá trị nhỏ nhất luôn nằm ở gốc. Vì cây đầy đủ nên nó xếp gọn được vào một mảng mà không cần con trỏ nào. Thao tác chèn và thao tác lấy phần tử ở đỉnh đều chỉ đi theo một đường từ gốc tới lá, nên cả hai đều tốn O(log n).',
  summary:
    'Chèn vào và lấy ra khỏi một min-heap hoặc max-heap theo từng bước, với cây và mảng vẽ cạnh nhau khi các giá trị được vun lên và vun xuống.',
  instruction:
    'Nhập một giá trị rồi bấm Chèn (hoặc Enter), hoặc bấm Lấy ra min. Mỗi thao tác được thêm vào nhật kí; chạy từng bước và xem cùng các ô đó di chuyển trong cây và trong mảng. Chuyển sang max-heap (heap lớn nhất) để đảo thứ tự, hoặc bấm vào một ô để xem cha và các con của nó.',
  valueLabel: 'Giá trị',
  insert: 'Chèn',
  /** @param {HeapKind} h */
  extract: (h) => (h === 'min' ? 'Lấy ra min' : 'Lấy ra max'),
  undo: 'Hoàn tác',
  reset: 'Làm lại',
  heapLabel: 'Loại heap',
  heaps: { min: 'Min-heap', max: 'Max-heap' },
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presets: {
    build: 'Chèn 9, lấy ra 1',
    drain: 'Chèn 7, lấy ra hết',
    sorted: 'Chèn theo thứ tự tăng dần',
    random: 'Ngẫu nhiên',
  },
  valueError: 'Hãy nhập một số nguyên từ 0 đến 99.',
  full: 'Ở đây heap chứa tối đa 15 giá trị. Hãy lấy ra một giá trị trước đã.',
  emptyError: 'Heap đang rỗng, không có gì để lấy ra.',
  logFull: 'Nhật kí chứa tối đa 24 thao tác. Hãy hoàn tác hoặc làm lại để thử thêm.',
  heapTitle: 'Heap dạng cây và dạng mảng',
  /** @param {number[]} values @param {HeapKind} h */
  heapAria: (values, h) =>
    values.length === 0
      ? 'Heap đang rỗng.'
      : `${h === 'min' ? 'Min-heap' : 'Max-heap'} gồm ${values.length} phần tử, dạng mảng: ${values.join(', ')}.`,
  /** @param {number} i @param {number} n */
  slotInfo: (i, n) => {
    const kids = [2 * i + 1, 2 * i + 2].filter((c) => c < n);
    const parent = i === 0 ? 'đây là gốc' : `cha là ⌊(${i} − 1)/2⌋ = ${Math.floor((i - 1) / 2)}`;
    const children =
      kids.length === 0
        ? 'không có con (là lá)'
        : `các con là 2·${i} + 1 = ${2 * i + 1}${kids.length === 2 ? ` và 2·${i} + 2 = ${2 * i + 2}` : ''}`;
    return `Ô ${i}: ${parent}; ${children}.`;
  },
  slotHint: 'Bấm vào một ô, hoặc nhấn Enter trên ô đó, để xem cha và các con của nó.',
  stats: {
    size: 'Kích thước',
    height: 'Chiều cao (số tầng dưới gốc)',
    comparisons: 'Số phép so sánh',
    swaps: 'Số lần đổi chỗ',
    /** @param {HeapKind} h */
    top: (h) => (h === 'min' ? 'Đỉnh: giá trị nhỏ nhất' : 'Đỉnh: giá trị lớn nhất'),
  },
  noTop: '—',
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'đang chạy',
  /** @param {HeapOp} op @param {HeapKind} h */
  opChip: (op, h) => (op.type === 'insert' ? `+${op.value}` : h === 'min' ? 'min' : 'max'),
  outTitle: 'Đã lấy ra, theo thứ tự',
  outEmpty: 'chưa có',
  legend: {
    active: 'Giá trị đang được vun',
    frontier: 'Con được chọn',
    compare: 'Đang so sánh',
    swap: 'Vừa đổi chỗ',
    sorted: 'Đã về đúng chỗ',
  },
  markers: { active: 'i', frontier: 'c', compare: '?', swap: '⇄', sorted: '✓' },
  /** @param {BinaryHeapFrame} f */
  describe(f) {
    const v = (/** @type {number} */ i) => f.values[i];
    const h = f.heap;
    switch (f.kind) {
      case 'start':
        return `Một ${name(h)} rỗng. Mỗi nút cha phải ${h === 'min' ? '≤' : '≥'} các con, nên giá trị ${word(h)} sẽ nằm ở gốc.`;
      case 'insert':
        return `Chèn ${f.value}: đặt vào ô trống tiếp theo, ô ${f.node}, để cây vẫn đầy đủ. Sau đó vun nó lên.`;
      case 'up-compare':
        return f.stop
          ? `${v(f.node)} ${ge(h)} cha của nó là ${v(f.other)} ở ô ${f.other}: thứ tự heap vẫn đúng. Dừng.`
          : `${v(f.node)} ${lt(h)} cha của nó là ${v(f.other)} ở ô ${f.other}: hai giá trị sai thứ tự.`;
      case 'up-swap':
        return `Đổi chỗ: ${v(f.node)} lên ô ${f.node}, ${v(f.other)} xuống ô ${f.other}.`;
      case 'up-root':
        return `${v(0)} đã lên tới gốc: đó là giá trị ${word(h)} mới.`;
      case 'empty':
        return 'Heap đang rỗng, không có gì để lấy ra.';
      case 'extract':
        return f.values.length === 0
          ? `Lấy gốc ${f.value}. Đó là giá trị duy nhất, nên giờ heap rỗng.`
          : `Lấy gốc ${f.value}, giá trị ${word(h)}. Chuyển giá trị cuối, ${v(0)}, lên gốc để cây vẫn đầy đủ, rồi vun nó xuống.`;
      case 'down-children': {
        const [l, r] = f.focus;
        return r === undefined
          ? `Ô ${f.node} có một con, ${v(l)} ở ô ${l}.`
          : `Các con của ô ${f.node}: ${v(l)} và ${v(r)}. Con ${h === 'min' ? 'nhỏ hơn' : 'lớn hơn'} là ${v(f.other)} ở ô ${f.other}.`;
      }
      case 'down-compare':
        return f.stop
          ? `${v(f.other)} ${ge(h)} ${v(f.node)}: con không cần đứng trên cha. Dừng.`
          : `${v(f.other)} ${lt(h)} ${v(f.node)}: con phải đứng trên, nên hai giá trị đổi chỗ.`;
      case 'down-swap':
        return `Đổi chỗ: ${v(f.node)} xuống ô ${f.node} và tiếp tục vun xuống.`;
      case 'down-leaf':
        return `Ô ${f.node} không có con, nên việc vun xuống kết thúc.`;
      case 'returned':
        return `Trả về ${f.value}. Giờ heap chứa ${f.values.length} giá trị.`;
      case 'done':
        return `Đã xong mọi thao tác: ${f.comparisons} phép so sánh và ${f.swaps} lần đổi chỗ.`;
    }
  },
  takeaways: [
    'Tính chất heap: mỗi nút cha đứng trước các con (≤ trong min-heap, ≥ trong max-heap), nên giá trị ở đỉnh nằm ở gốc. Các nút anh em không có thứ tự gì với nhau.',
    'Heap là cây đầy đủ, được lấp từng tầng từ trái sang, nên nó nằm gọn trong một mảng: ô i có các con 2i + 1 và 2i + 2, và cha ⌊(i − 1)/2⌋.',
    'Chèn đặt giá trị vào ô trống tiếp theo rồi vun lên (sift up); lấy ra chuyển giá trị cuối lên gốc rồi vun xuống (sift down). Mỗi thao tác đi qua nhiều nhất ⌊log₂ n⌋ tầng.',
    'Xem phần tử ở đỉnh chỉ tốn O(1); heap là cách thường dùng để cài đặt priority queue (hàng đợi ưu tiên).',
    'Thử mẫu Chèn 7, lấy ra hết: các giá trị lấy ra đã được sắp xếp. Đó chính là ý tưởng cốt lõi của heapsort (sắp xếp vun đống).',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Xem phần tử ở đỉnh', 'O(1)', 'Giá trị ở đỉnh luôn nằm ở ô 0.'],
    [
      'Chèn',
      'O(log n)',
      'Một lần vun lên từ lá, nhiều nhất ⌊log₂ n⌋ lần đổi chỗ; giá trị ngẫu nhiên thường chỉ lên một hai tầng.',
    ],
    ['Lấy ra phần tử ở đỉnh', 'O(log n)', 'Một lần vun xuống từ gốc, hai phép so sánh mỗi tầng.'],
    [
      'Tìm một giá trị bất kì khác',
      'O(n)',
      'Thứ tự heap không cho biết giá trị không ở đỉnh nằm ở đâu.',
    ],
    ['Bộ nhớ', 'O(n)', 'Chính mảng đó; không cần con trỏ, vì vị trí đã mã hoá cây.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trong heap lưu bằng mảng đánh chỉ số từ 0, ô nào là cha của ô 11?',
      answer: 5,
      hints: ['Cha của ô i là ⌊(i − 1)/2⌋.'],
      solution: '⌊(11 − 1)/2⌋ = 5. Kiểm tra lại: các con của ô 5 là 2·5 + 1 = 11 và 12.',
    },
    {
      type: 'choice',
      prompt: 'Mảng nào là một min-heap hợp lệ?',
      options: ['3, 5, 4, 9, 6, 8', '3, 5, 4, 2, 6, 8', '5, 3, 4, 9, 6, 8', '3, 9, 4, 5, 6, 8'],
      answer: 0,
      hints: [
        'Kiểm tra từng ô với cha của nó: ô 1 và 2 dưới ô 0, ô 3 và 4 dưới ô 1, ô 5 dưới ô 2.',
      ],
      solution:
        '3, 5, 4, 9, 6, 8: 5 và 4 đều ≥ 3, 9 và 6 đều ≥ 5, 8 ≥ 4. Các mảng khác đều sai: 2 nằm dưới 5, 3 nằm dưới gốc 5, còn 5 và 6 nằm dưới 9.',
    },
    {
      type: 'text',
      prompt:
        'Chèn 1 vào min-heap 2, 4, 3, 7, 5. Nhập mảng sau khi vun lên, các số cách nhau bằng dấu phẩy.',
      accept: ['1, 4, 2, 7, 5, 3', '1 4 2 7 5 3', '[1, 4, 2, 7, 5, 3]', '1,4,2,7,5,3'],
      hints: [
        '1 vào ô 5. Cha của nó là ô ⌊4/2⌋ = 2.',
        'Sau khi đổi chỗ với 3 ở ô 2, so sánh với gốc 2.',
      ],
      solution:
        '1 vào ô 5: 2, 4, 3, 7, 5, 1. Nó nhỏ hơn cha 3 (ô 2), nên đổi chỗ: 2, 4, 1, 7, 5, 3. Nó nhỏ hơn gốc 2, nên lại đổi chỗ: 1, 4, 2, 7, 5, 3.',
    },
    {
      type: 'text',
      prompt:
        'Lấy giá trị nhỏ nhất ra khỏi min-heap 1, 4, 2, 7, 5, 3. Nhập mảng sau khi vun xuống, các số cách nhau bằng dấu phẩy.',
      accept: ['2, 4, 3, 7, 5', '2 4 3 7 5', '[2, 4, 3, 7, 5]', '2,4,3,7,5'],
      hints: [
        'Bỏ 1 và chuyển giá trị cuối, 3, lên gốc.',
        'Các con của gốc là 4 và 2; con nhỏ hơn là 2.',
      ],
      solution:
        'Bỏ 1 và chuyển 3 lên gốc ta được 3, 4, 2, 7, 5. Con nhỏ hơn là 2 < 3, nên đổi chỗ: 2, 4, 3, 7, 5. Giờ ô 2 không có con, nên việc vun xuống kết thúc.',
    },
  ],
  nextTeaser:
    'Chèn lần lượt n giá trị tốn O(n log n), nhưng có một cách nhanh hơn để biến cả mảng thành heap. Bài sau: Dựng heap trong thời gian tuyến tính.',
};
