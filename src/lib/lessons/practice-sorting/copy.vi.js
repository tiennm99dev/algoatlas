/** @typedef {import('$lib/algo-engine/practice-sorting.js').RaceFrame} RaceFrame */
/** @typedef {import('$lib/algo-engine/practice-sorting.js').SortId} SortId */
/** @typedef {import('$lib/algo-engine/practice-sorting.js').Shape} Shape */
/** @typedef {import('$lib/algo-engine/practice-sorting.js').Constraint} Constraint */

const TAGS = 'abcdefghijklmnop';

/** @param {number} tag */
const tagName = (tag) => TAGS[tag] ?? String(tag + 1);

/** @type {Record<SortId, string>} */
const SORT_NAMES = {
  bubble: 'Bubble sort',
  insertion: 'Insertion sort',
  selection: 'Selection sort',
  merge: 'Merge sort',
  quick: 'Quicksort',
  heap: 'Heapsort',
};

/** A list of sort names for a sentence: only the first keeps its capital letter. @param {string[]} names */
const list = (names) => {
  const words = names.map((n, i) => (i === 0 ? n : n.charAt(0).toLowerCase() + n.slice(1)));
  return words.length <= 1
    ? (words[0] ?? '')
    : `${words.slice(0, -1).join(', ')} và ${words[words.length - 1]}`;
};

/** @param {number} k @param {string} unit */
const plural = (k, unit) => `${k} ${unit}`;

export const vi = {
  slug: 'practice-sorting',
  topic: 'sorting',
  level: 'Trung bình',
  title: 'Luyện tập: chọn thuật toán sắp xếp',
  intro:
    'Không có thuật toán sắp xếp nào thắng ở mọi nơi. Lựa chọn tốt nhất phụ thuộc vào dạng của đầu vào (ngẫu nhiên, gần như đã sắp xếp, đảo ngược, nhiều giá trị lặp) và vào yêu cầu của công việc: ổn định (stable), ít bộ nhớ thêm, bảo đảm trong trường hợp xấu nhất hay ít lần ghi. Ở đây, sáu thuật toán sắp xếp đua trên cùng một bộ lá bài, mỗi bước một phép so sánh, và phần chọn theo yêu cầu cho biết thuật toán nào hợp với một tập yêu cầu.',
  summary:
    'Cho bubble sort, insertion sort, selection sort, merge sort, quicksort và heapsort đua trên cùng một đầu vào, rồi ghép từng thuật toán với các yêu cầu về tính ổn định, bộ nhớ và trường hợp xấu nhất.',
  instruction:
    'Chọn một dạng đầu vào hoặc tự gõ các lá bài, rồi đi từng bước hoặc phát cuộc đua: mỗi bước, mọi thuật toán còn đang chạy làm thêm một phép so sánh. Khi tất cả xong, đọc bảng tổng kết, rồi đánh dấu các yêu cầu ở phần chọn theo yêu cầu để xem thuật toán nào phù hợp.',
  shapeLabel: 'Dạng đầu vào',
  shapes: /** @type {Record<Shape, string>} */ ({
    random: 'Ngẫu nhiên',
    'nearly-sorted': 'Gần như đã sắp xếp',
    sorted: 'Đã sắp xếp',
    reversed: 'Đảo ngược',
    'few-unique': 'Ít giá trị khác nhau',
  }),
  sizeLabel: 'Kích thước n',
  valuesLabel: 'Các lá bài',
  valueErrors: {
    format: 'Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 42, 17, 88.',
    range: 'Mọi lá bài phải nằm trong khoảng 0–99.',
    count: 'Hãy gõ từ 2 đến 16 lá bài.',
  },
  sizeError: 'Kích thước phải là số nguyên từ 2 đến 16.',
  sorts: SORT_NAMES,
  tagName,
  raceTitle: 'Cuộc đua',
  tagNote:
    'Một khoá lặp lại được gắn các chữ a, b, c ở phía trên theo thứ tự đầu vào, để em thấy thuật toán có giữ đúng thứ tự các khoá bằng nhau hay không.',
  /** @param {number} comparisons @param {number} writes */
  laneStats: (comparisons, writes) =>
    `${plural(comparisons, 'lần so sánh')} · ${plural(writes, 'lần ghi')}`,
  running: 'đang chạy',
  /** @param {number} place */
  finished: (place) => `✓ về đích thứ ${place}`,
  /** @param {string} name @param {string} status @param {number[]} keys */
  laneAria: (name, status, keys) => `${name}, ${status}: ${keys.join(', ')}`,
  legend: {
    compare: 'Vừa so sánh (sắp xếp trộn: ô vừa được ghi)',
    sorted: 'Thuật toán này đã xong',
    tag: 'Thứ tự của các khoá bằng nhau trong đầu vào',
  },
  markers: { compare: '▾', sorted: '✓', tag: 'a b' },
  stats: {
    step: 'Bước',
    length: 'Độ dài cuộc đua',
    running: 'Còn đang chạy',
    cards: 'Số lá bài',
  },
  /** @param {number} k @param {number} total */
  runningValue: (k, total) => `${k}/${total}`,
  resultsTitle: 'Tổng kết trên đầu vào này',
  resultsAria:
    'Số lần so sánh, số lần ghi, bộ nhớ thêm và tính ổn định của từng thuật toán trên đầu vào này',
  resultsCols: ['Thuật toán', 'So sánh', 'Ghi', 'Độ sâu', 'Vùng đệm', 'Ổn định ở đây'],
  resultsNote:
    'Độ sâu là độ sâu đệ quy lớn nhất, vùng đệm là số lá bài giữ thêm cùng lúc. Một hàng được điền khi thuật toán của hàng đó xong.',
  pending: '…',
  /** @param {boolean | null} stable */
  stableHere: (stable) =>
    stable === null ? '– không có giá trị lặp' : stable ? '✓ giữ thứ tự' : '✕ bị đảo thứ tự',
  pickerTitle: 'Chọn theo yêu cầu',
  pickerIntro:
    'Đánh dấu những gì công việc cần. Một thuật toán phù hợp khi nó đáp ứng mọi yêu cầu đã đánh dấu.',
  constraints: /** @type {Record<Constraint, string>} */ ({
    stable: 'Ổn định: các khoá bằng nhau giữ thứ tự',
    'in-place': 'Bộ nhớ thêm O(1)',
    average: 'Thời gian trung bình O(n log n)',
    worst: 'Thời gian O(n log n) kể cả trường hợp xấu nhất',
    adaptive: 'Thời gian O(n) trên đầu vào đã sắp xếp',
    'few-writes': 'Chỉ O(n) lần ghi',
  }),
  meets: '✓',
  fails: '✕',
  /** @param {string} name @param {boolean} fits @param {string[]} missing */
  fitAria: (name, fits, missing) =>
    fits ? `${name} phù hợp` : `${name} không phù hợp: không đạt ${missing.join(', ')}`,
  constraintShort: /** @type {Record<Constraint, string>} */ ({
    stable: 'ổn định',
    'in-place': 'bộ nhớ O(1)',
    average: 'trung bình n log n',
    worst: 'xấu nhất n log n',
    adaptive: 'O(n) nếu đã sắp xếp',
    'few-writes': 'O(n) lần ghi',
  }),
  /** @param {string[]} names */
  matchSummary: (names) =>
    names.length === 0
      ? 'Không thuật toán nào trong cuộc đua đáp ứng được mọi yêu cầu này. Bỏ bớt một yêu cầu, hoặc tìm một thuật toán lai như Timsort hay introsort.'
      : names.length === 6
        ? 'Thuật toán nào cũng phù hợp. Đánh dấu một yêu cầu để thu hẹp lựa chọn.'
        : `${names.length} thuật toán phù hợp: ${list(names)}.`,
  /** @param {RaceFrame} f */
  describe(f) {
    const n = f.lanes[0]?.items.length ?? 0;
    switch (f.kind) {
      case 'start':
        return `Sáu thuật toán sắp xếp, mỗi thuật toán nhận một bản sao riêng của cùng ${n} lá bài. Mỗi bước, mọi thuật toán còn đang chạy làm thêm một phép so sánh, cùng các lần di chuyển theo sau nó.`;
      case 'tick': {
        const left = f.lanes.filter((l) => !l.done).length;
        const head = `Bước ${f.t}: mọi thuật toán còn đang chạy đã làm ${plural(f.t, 'phép so sánh')}.`;
        if (f.finished.length === 0) return `${head} Còn ${left} thuật toán đang chạy.`;
        const who = list(f.finished.map((id) => SORT_NAMES[id]));
        const tail = left === 0 ? 'Mọi thuật toán đã xong.' : `Còn ${left} thuật toán đang chạy.`;
        return `${head} ${who} về đích lúc này. ${tail}`;
      }
      case 'done': {
        const first = f.lanes.filter((l) => l.place === 1);
        const worst = Math.max(...f.lanes.map((l) => l.comparisons));
        const last = f.lanes.filter((l) => l.comparisons === worst);
        const firstText = `${list(first.map((l) => SORT_NAMES[l.id]))} về đích đầu tiên với ${plural(first[0]?.comparisons ?? 0, 'phép so sánh')}`;
        if (first.length === f.lanes.length)
          return `Cả sáu đã sắp xếp xong. ${firstText}: cùng về đích một lúc.`;
        return `Cả sáu đã sắp xếp xong. ${firstText}; ${list(last.map((l) => SORT_NAMES[l.id]))} cần ${plural(worst, 'phép so sánh')}. Thử một dạng đầu vào khác: thứ hạng sẽ thay đổi.`;
      }
    }
  },
  practiceTitle: 'Câu hỏi về cuộc đua',
  takeaways: [
    'Dạng đầu vào quyết định cuộc đua. Trên đầu vào đã sắp xếp hoặc gần như đã sắp xếp, insertion sort (sắp xếp chèn) và bubble sort (sắp xếp nổi bọt) chỉ cần khoảng n phép so sánh, còn quicksort (sắp xếp nhanh) lấy lá cuối làm chốt (pivot) thì tụt xuống n(n − 1)/2 phép so sánh và đệ quy sâu n − 1 tầng.',
    'Merge sort (sắp xếp trộn) ổn định và tốn O(n log n) trên mọi đầu vào, nhưng cần thêm một vùng đệm n lá bài. Heapsort (sắp xếp vun đống) tốn O(n log n) với O(1) bộ nhớ thêm, nhưng không ổn định.',
    'Tính ổn định quan trọng khi em sắp xếp lần lượt theo từng khoá: một thuật toán ổn định giữ lại thứ tự cũ giữa các khoá bằng nhau. Một đầu vào có thể chứng minh thuật toán không ổn định, nhưng không bao giờ chứng minh được nó ổn định.',
    'Selection sort (sắp xếp chọn) làm n(n − 1)/2 phép so sánh trên mọi đầu vào nhưng chỉ đổi chỗ nhiều nhất n − 1 lần, điều này có lợi khi việc ghi tốn kém.',
    'Thử xem: chạy dạng Đã sắp xếp với n = 16, rồi Đảo ngược. Để ý độ sâu của quicksort và thứ hạng của insertion sort đổi chỗ cho nhau giữa hai lần.',
  ],
  complexityHead: ['Thuật toán', 'Thời gian xấu nhất', 'Tốt nhất, bộ nhớ và tính ổn định'],
  complexity: [
    ['Bubble sort (dừng sớm)', 'O(n²)', 'O(n) trên đầu vào đã sắp xếp; thêm O(1); ổn định.'],
    ['Insertion sort', 'O(n²)', 'O(n) trên đầu vào đã sắp xếp; thêm O(1); ổn định.'],
    [
      'Selection sort',
      'O(n²)',
      'Luôn n(n − 1)/2 phép so sánh nhưng nhiều nhất n − 1 lần đổi chỗ; thêm O(1); không ổn định.',
    ],
    ['Merge sort', 'O(n log n)', 'Như nhau trên mọi đầu vào; vùng đệm O(n); ổn định.'],
    [
      'Quicksort (chốt cuối)',
      'O(n²)',
      'Trung bình O(n log n); stack (ngăn xếp) trung bình O(log n), xấu nhất O(n); không ổn định.',
    ],
    ['Heapsort', 'O(n log n)', 'Trung bình cũng O(n log n); thêm O(1); không ổn định.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'multi',
      prompt:
        'Chạy cuộc đua trên các lá bài ban đầu. Những thuật toán nào đảo thứ tự một cặp bằng nhau (hai lá 17 hoặc hai lá 42)?',
      options: Object.values(SORT_NAMES),
      answers: [2, 4, 5],
      hints: [
        'Đi đến bước cuối và đọc cột Ổn định ở đây.',
        'Các chữ phía trên mỗi khoá lặp lại cho biết thứ tự: a đứng trước b nghĩa là giữ đúng.',
      ],
      solution:
        'Selection sort, quicksort và heapsort đảo thứ tự một cặp bằng nhau ở đây: những lần đổi chỗ xa của chúng đưa một lá vượt qua lá bằng nó. Bubble sort, insertion sort và merge sort chỉ đưa một lá vượt qua lá lớn hơn hẳn hoặc nhỏ hơn hẳn, nên chúng ổn định.',
    },
    {
      type: 'order',
      prompt:
        'Trên các lá bài ban đầu, xếp các thuật toán sau theo số phép so sánh, ít nhất trước.',
      items: ['Heapsort', 'Merge sort', 'Insertion sort', 'Quicksort'],
      answer: [1, 3, 2, 0],
      hints: ['Phát cuộc đua đến cuối và đọc cột So sánh.', 'Các con số là 30, 36, 41 và 50.'],
      solution:
        'Merge sort 30, quicksort 36, insertion sort 41, heapsort 50. Bubble sort và selection sort cùng về cuối với 66 = 12 × 11 / 2.',
    },
    {
      type: 'number',
      prompt:
        'Chọn dạng Đã sắp xếp với n = 16. Đệ quy của quicksort sâu bao nhiêu tầng (cột Độ sâu)?',
      answer: 15,
      unit: 'tầng',
      hints: [
        'Lấy lá cuối làm chốt, mỗi lần phân hoạch các lá đã sắp xếp đều để trống một bên.',
        'Mỗi lời gọi sắp xếp một đoạn ngắn hơn đoạn của lời gọi cha một lá.',
      ],
      solution:
        'Độ sâu 15 = n − 1, với 120 = 16 × 15 / 2 phép so sánh. Mỗi chốt là lá lớn nhất trong đoạn của nó, nên đoạn chỉ ngắn đi một lá sau mỗi lời gọi. Đây là trường hợp xấu nhất của quicksort cả về thời gian lẫn bộ nhớ stack.',
    },
    {
      type: 'choice',
      prompt: 'Vẫn với Đã sắp xếp và n = 16: những thuật toán nào về đích đầu tiên?',
      options: [
        'Bubble sort và insertion sort, cùng lúc',
        'Merge sort',
        'Heapsort',
        'Quicksort và selection sort, cùng lúc',
      ],
      answer: 0,
      hints: [
        'Để ý làn nào chuyển sang đã xong sớm nhất.',
        'Một thuật toán kiểm tra mỗi cặp kề nhau một lần mà không thấy cặp nào sai thứ tự sẽ dừng sau n − 1 phép so sánh.',
      ],
      solution:
        'Bubble sort và insertion sort đều dừng sau n − 1 = 15 phép so sánh: lượt đầu của bubble sort không đổi chỗ lần nào, còn insertion sort dừng mỗi khoá sau một phép so sánh. Merge sort cần 32, heapsort 85, còn quicksort và selection sort cần 120.',
    },
    {
      type: 'number',
      prompt: 'Chọn dạng Đảo ngược với n = 16. Bubble sort ghi bao nhiêu lần?',
      answer: 240,
      unit: 'lần ghi',
      hints: [
        'Trên đầu vào đảo ngược, phép so sánh nào cũng gặp một cặp sai thứ tự.',
        'Có 16 × 15 / 2 = 120 phép so sánh, và mỗi lần đổi chỗ ghi hai ô.',
      ],
      solution:
        'Cả 120 phép so sánh đều dẫn tới một lần đổi chỗ hai ô: 240 lần ghi. Selection sort trên cùng đầu vào cũng làm 120 phép so sánh nhưng chỉ 16 lần ghi.',
    },
    {
      type: 'number',
      prompt: 'Vẫn với Đảo ngược và n = 16: merge sort làm bao nhiêu phép so sánh?',
      answer: 32,
      unit: 'phép so sánh',
      hints: [
        'Trong mỗi lần trộn, mọi lá bên phải đều nhỏ hơn mọi lá bên trái.',
        'Nên mỗi lần trộn dừng sau số phép so sánh bằng số lá của nửa phải: 8 × 1 + 4 × 2 + 2 × 4 + 1 × 8.',
      ],
      solution:
        '8 × 1 + 4 × 2 + 2 × 4 + 1 × 8 = 32 phép so sánh qua log₂ 16 = 4 tầng. Trường hợp xấu nhất của merge sort là khoảng n log₂ n = 64, nên đầu vào đảo ngược là dễ với nó.',
    },
    {
      type: 'choice',
      prompt:
        'Em sắp xếp một triệu đơn hàng theo ngày. Các đơn đã được sắp xếp sẵn theo khách hàng, và thứ tự đó phải được giữ trong mỗi ngày. Thuật toán không bao giờ được tốn thời gian bậc hai. Dùng phần chọn theo yêu cầu: thuật toán nào phù hợp?',
      options: ['Quicksort', 'Heapsort', 'Merge sort', 'Insertion sort'],
      answer: 2,
      hints: [
        'Giữ thứ tự khách hàng giữa các ngày bằng nhau nghĩa là thuật toán phải ổn định.',
        'Đánh dấu Ổn định và Thời gian O(n log n) kể cả trường hợp xấu nhất.',
      ],
      solution:
        'Merge sort là thuật toán ổn định duy nhất ở đây có trường hợp xấu nhất O(n log n). Quicksort và heapsort không ổn định, còn insertion sort tốn thời gian bậc hai trên hầu hết các đầu vào.',
    },
    {
      type: 'choice',
      prompt:
        'Một thiết bị nhỏ gần như không còn bộ nhớ trống, và mọi lần sắp xếp phải xong trong thời gian O(n log n) dù đầu vào thế nào. Thuật toán nào phù hợp?',
      options: ['Merge sort', 'Heapsort', 'Quicksort', 'Selection sort'],
      answer: 1,
      hints: [
        'Đánh dấu Bộ nhớ thêm O(1) và Thời gian O(n log n) kể cả trường hợp xấu nhất.',
        'Vùng đệm của merge sort và stack của quicksort đều lớn dần theo n.',
      ],
      solution:
        'Heapsort sắp xếp ngay trong mảng với O(1) bộ nhớ thêm và tốn O(n log n) trên mọi đầu vào. Merge sort cần vùng đệm n lá, quicksort có thể tốn thời gian bậc hai và đệ quy sâu n tầng, còn selection sort luôn tốn thời gian bậc hai.',
    },
    {
      type: 'choice',
      prompt:
        'Một bảng xếp hạng gần như đã được sắp xếp sau mỗi vòng: chỉ vài người chơi đổi chỗ cho nhau. Em cần một thuật toán ổn định và sắp xếp tại chỗ (in-place). Thuật toán nào phù hợp nhất?',
      options: ['Insertion sort', 'Selection sort', 'Heapsort', 'Merge sort'],
      answer: 0,
      hints: [
        'Thử dạng Gần như đã sắp xếp và xem thuật toán nào về đích đầu tiên.',
        'Đánh dấu Ổn định, Bộ nhớ thêm O(1) và Thời gian O(n) trên đầu vào đã sắp xếp.',
      ],
      solution:
        'Insertion sort ổn định, tại chỗ, và chỉ tốn khoảng n phép so sánh khi chỉ vài phần tử kề nhau sai thứ tự. Selection sort và heapsort không ổn định, còn merge sort cần vùng đệm.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo là tìm kiếm tuần tự: cách đơn giản nhất để tìm một giá trị trong mảng, đi qua từng phần tử một.',
};
