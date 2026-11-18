/** @typedef {import('$lib/algo-engine/space-complexity.js').SpaceFrame} SpaceFrame */
/** @typedef {import('$lib/algo-engine/space-complexity.js').SpaceAlgo} SpaceAlgo */

/** @type {Record<SpaceAlgo, string>} */
const CLASS = {
  'sum-rec': 'Θ(n): mỗi giá trị từ n về 0 một khung',
  'bits-rec': 'Θ(log n): n giảm một nửa sau mỗi lời gọi',
  'sum-loop': 'Θ(1): một khung, dù n bằng bao nhiêu',
  'reverse-copy': 'Θ(n): bản sao B cần n từ máy',
  'reverse-in-place': 'Θ(1): chỉ có i, j và t, nên chạy tại chỗ',
};

export const vi = {
  slug: 'space-complexity',
  topic: 'complexity',
  level: 'Trung bình',
  title: 'Độ phức tạp bộ nhớ',
  intro:
    'Thuật toán dùng cả bộ nhớ lẫn thời gian. Độ phức tạp bộ nhớ đếm phần bộ nhớ thêm mà thuật toán cần ngoài đầu vào, gọi là bộ nhớ phụ, và phần đó tính cả call stack (ngăn xếp lời gọi): mỗi lời gọi đệ quy chưa trả về vẫn đang giữ một khung.',
  summary:
    'Xem thanh bộ nhớ lớn dần theo call stack của một hàm đệ quy, rồi so sánh với một vòng lặp, một bản sao và một phép đảo ngược tại chỗ.',
  instruction:
    'Chọn một chương trình và n, rồi chạy từng bước. Mỗi lời gọi đẩy một khung vào call stack và thanh bộ nhớ dài ra; mỗi lần trả về lấy một khung ra. So sánh mức đỉnh của sum đệ quy với bits, vòng lặp và hai cách đảo ngược.',
  nLabel: 'n',
  algoLabel: 'Chương trình',
  algos: /** @type {Record<SpaceAlgo, string>} */ ({
    'sum-rec': 'sum(n), đệ quy',
    'bits-rec': 'bits(n), đệ quy chia đôi',
    'sum-loop': 'sumLoop(n), vòng lặp',
    'reverse-copy': 'reversedCopy(A), vào mảng mới',
    'reverse-in-place': 'reverseInPlace(A), hai con trỏ',
  }),
  nError: 'n phải là số nguyên từ 1 đến 12.',
  memoryTitle: 'Bộ nhớ đang dùng (từ máy)',
  /** @param {number} used @param {number} scale */
  memoryLabel: (used, scale) =>
    `Thanh bộ nhớ: đang dùng ${used}/${scale} từ máy. Thang đo là mức đỉnh lớn nhất của năm chương trình với n này.`,
  /** @param {string} fn @param {number | 'A'} arg @param {number} words */
  frameChip: (fn, arg, words) => `${fn}(${arg}) · ${words} từ`,
  heapChip: (/** @type {number} */ words) => `B · ${words} từ`,
  /** @param {string} fn @param {number | 'A'} arg */
  frameName: (fn, arg) => `${fn}(${arg})`,
  stackTitle: 'Call stack',
  stackAria: 'Call stack, khung trên đỉnh là lời gọi đang chạy',
  arrayA: 'Đầu vào A (không tính)',
  arrayB: 'Mảng B trên vùng heap',
  pointerI: 'i',
  pointerJ: 'j',
  legend: {
    frame: 'Khung trên call stack',
    top: 'Khung đang chạy (đỉnh)',
    heap: 'Vùng heap (mảng mới)',
    peak: 'Mức đỉnh đến giờ',
  },
  arrayLegend: {
    compare: 'Vừa đọc',
    swap: 'Vừa ghi (đổi chỗ hoặc sao chép)',
    sorted: 'Đã điền vào B',
  },
  stats: {
    words: 'Số từ máy đang dùng',
    peak: 'Số từ máy ở mức đỉnh',
    depth: 'Độ sâu call stack',
    maxDepth: 'Call stack sâu nhất',
  },
  classTitle: 'Bộ nhớ phụ',
  classes: CLASS,
  /** @param {SpaceAlgo} algo @param {number} n @param {number} peak */
  peakFormula: (algo, n, peak) =>
    ({
      'sum-rec': `(n + 1) khung × 2 từ = ${peak}`,
      'bits-rec': `(⌊log₂ ${n}⌋ + 1) khung × 2 từ = ${peak}`,
      'sum-loop': `1 khung × 4 từ = ${peak}`,
      'reverse-copy': `khung 4 từ + n = ${n} từ trên heap = ${peak}`,
      'reverse-in-place': `1 khung × 5 từ = ${peak}`,
    })[algo],
  practiceTitle: 'Tự kiểm tra',
  /** @param {SpaceFrame} f */
  describe(f) {
    const top = f.stack[f.stack.length - 1];
    switch (f.kind) {
      case 'start':
        return `Call stack chưa có gì. Chạy với n = ${f.n}.`;
      case 'call':
        return `Gọi ${top.fn}(${top.arg}): đẩy vào một khung ${top.words} từ máy. Độ sâu ${f.stack.length}, đang dùng ${f.words} từ máy.`;
      case 'base':
        return `${top.fn}(${top.arg}) là trường hợp cơ sở và trả về ${f.value} mà không gọi thêm. Call stack đang sâu nhất: ${f.stack.length} khung.`;
      case 'return':
        if (f.stack.length === 0) {
          const what =
            f.algo === 'reverse-in-place'
              ? 'Trả về'
              : f.algo === 'reverse-copy'
                ? 'Trả về B (nó ở lại trên heap làm đầu ra)'
                : `Trả về ${f.value}`;
          return `${what} và lấy khung cuối cùng ra: đang dùng ${f.words} từ máy.`;
        }
        return `Trả ${f.value} về cho ${f.stack[f.stack.length - 1].fn}(${f.stack[f.stack.length - 1].arg}) và lấy một khung ra: đang dùng ${f.words} từ máy.`;
      case 'init':
        return f.algo === 'sum-loop'
          ? 's = 0. Vòng lặp sẽ dùng lại đúng khung này: mỗi lượt không tốn thêm bộ nhớ.'
          : `i = 0, j = ${f.j}. Hai chỉ số và một biến tạm t, tất cả trong một khung.`;
      case 'alloc':
        return `Cấp phát B: ${f.n} từ máy mới trên heap. Bộ nhớ đang dùng tăng vọt lên ${f.words} từ máy.`;
      case 'step':
        return f.algo === 'sum-loop'
          ? `i = ${f.i}: s = ${f.value}. Vẫn là ${f.words} từ máy.`
          : `B[${f.n - 1 - f.i}] = A[${f.i}] = ${f.input?.[f.i]}.`;
      case 'swap':
        return `Đổi chỗ A[${f.i}] và A[${f.j}] qua t, ngay trong A.`;
      case 'move':
        return `Tiến vào giữa: i = ${f.i}, j = ${f.j}.`;
      case 'exit':
        return `i ≥ j: mọi cặp đã đổi chỗ và A đã được đảo ngược, không cần mảng phụ.`;
      case 'done':
        return `Xong. Mức đỉnh ${f.peak} từ máy, call stack sâu nhất ${f.maxDepth} khung: ${CLASS[f.algo]}.`;
    }
  },
  takeaways: [
    'Độ phức tạp bộ nhớ đếm bộ nhớ phụ: số từ máy mà thuật toán cần ngoài đầu vào, tính theo n.',
    'Mỗi lời gọi chưa trả về giữ một khung trên call stack, nên độ sâu đệ quy cũng là bộ nhớ: lúc sâu nhất sum(n) giữ n + 1 khung, Θ(n), còn bits(n) chia đôi n nên chỉ giữ ⌊log₂ n⌋ + 1 khung, Θ(log n).',
    'Vòng lặp dùng lại một khung, nên cùng phép tính tổng mà viết bằng vòng lặp chỉ tốn Θ(1) bộ nhớ. Thời gian thì vẫn là Θ(n) trong cả hai cách.',
    'Thuật toán tại chỗ (in-place) sắp đặt lại đầu vào mà chỉ dùng Θ(1) từ máy thêm, như insertion sort (sắp xếp chèn), heapsort (sắp xếp vun đống) hay phép đảo ngược bằng hai con trỏ; dựng một mảng mới n phần tử thì tốn Θ(n).',
    'Thử n = 12 với sum(n) rồi với bits(n): 26 từ máy so với 8, và khoảng cách còn tăng theo n.',
  ],
  complexityHead: ['Chương trình', 'Bộ nhớ', 'Vì sao'],
  complexity: [
    ['sum(n), đệ quy', 'Θ(n)', 'Lúc sâu nhất có n + 1 khung trên call stack.'],
    ['bits(n), chia đôi', 'Θ(log n)', 'n giảm một nửa sau mỗi lời gọi: ⌊log₂ n⌋ + 1 khung.'],
    ['sumLoop(n)', 'Θ(1)', 'Một khung được mọi lượt dùng lại.'],
    ['reversedCopy(A)', 'Θ(n)', 'Một mảng mới B gồm n từ máy.'],
    ['reverseInPlace(A)', 'Θ(1)', 'Đổi chỗ ngay trong A với i, j và t.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Mỗi khung của hàm đệ quy sum(n) giữ 2 từ máy. Mức bộ nhớ đỉnh của nó khi n = 10 là bao nhiêu?',
      answer: 22,
      unit: 'từ máy',
      hints: [
        'Ở trường hợp cơ sở, các lời gọi sum(10), sum(9), …, sum(0) đều đang ở trên call stack.',
        'Tức là n + 1 = 11 khung.',
      ],
      solution: 'Từ sum(10) xuống sum(0) là 11 khung cùng lúc, 11 × 2 = 22 từ máy.',
    },
    {
      type: 'number',
      prompt: 'Lúc sâu nhất của bits(1000), trên call stack có bao nhiêu khung?',
      answer: 10,
      unit: 'khung',
      hints: ['Theo dõi đối số: 1000, 500, 250, 125, …', 'Đáp án là ⌊log₂ 1000⌋ + 1.'],
      solution:
        '1000 → 500 → 250 → 125 → 62 → 31 → 15 → 7 → 3 → 1 là 10 lời gọi, khớp với ⌊log₂ 1000⌋ + 1 = 9 + 1 = 10.',
    },
    {
      type: 'choice',
      prompt: 'Bộ nhớ phụ của reverseInPlace(A) trên một mảng n phần tử là bao nhiêu?',
      options: ['Θ(1)', 'Θ(log n)', 'Θ(n)'],
      answer: 0,
      hints: ['Thanh bộ nhớ có dài ra khi em tăng n không?', 'Bản thân đầu vào A không được tính.'],
      solution:
        'Nó dùng một khung chứa i, j, t và một địa chỉ trả về, 5 từ máy với mọi n, nên là Θ(1). Mảng A là đầu vào, không phải bộ nhớ phụ.',
    },
    {
      type: 'multi',
      prompt: 'Những thuật toán nào chạy tại chỗ (bộ nhớ phụ Θ(1), không tính call stack)?',
      options: [
        'Insertion sort',
        'Đảo ngược mảng bằng hai con trỏ',
        'Heapsort',
        'Merge sort có trộn vào một mảng đệm',
      ],
      answers: [0, 1, 2],
      hints: ['Hãy tìm xem có mảng nào gồm n phần tử thêm không.'],
      solution:
        'Insertion sort, đảo ngược bằng hai con trỏ và heapsort chỉ di chuyển phần tử bên trong đầu vào. Merge sort (sắp xếp trộn) trên mảng sao chép vào một mảng đệm n phần tử, nên cần Θ(n) bộ nhớ thêm.',
    },
  ],
  nextTeaser:
    'Có thao tác thường rẻ nhưng thỉnh thoảng lại rất đắt. Bài sau, Phân tích khấu hao: gộp, kế toán, thế năng, cho thấy cái giá trung bình thật sự của chúng.',
};
