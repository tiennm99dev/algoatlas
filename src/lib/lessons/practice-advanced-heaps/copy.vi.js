/** @typedef {import('$lib/algo-engine/practice-advanced-heaps.js').RaceFrame} RaceFrame */
/** @typedef {import('$lib/algo-engine/practice-advanced-heaps.js').Costs} Costs */

const NAMES = { binary: 'heap nhị phân', fibonacci: 'heap Fibonacci', veb: 'cây vEB' };

/** Counts mirror the widget, so they use plain programming notation with no grouping. */
/** @param {number} k */
const num = (k) => String(k);

/** @param {Costs} c */
const costs = (c) => `nhị phân ${num(c.binary)}, Fibonacci ${num(c.fibonacci)}, vEB ${num(c.veb)}`;

/** @param {Costs} c @param {number} k */
const perOp = (c, k) => ({
  binary: c.binary / k,
  fibonacci: c.fibonacci / k,
  veb: c.veb / k,
});

export const vi = {
  slug: 'practice-advanced-heaps',
  topic: 'advanced-heaps',
  level: 'Nâng cao',
  title: 'Luyện tập: heap nâng cao',
  intro:
    'Một thuật toán nên dùng hàng đợi ưu tiên (priority queue) nào? Điều đó phụ thuộc vào tỉ lệ các thao tác nó dùng, vào số khoá hàng đợi chứa, và vào việc các khoá có phải là số nguyên nhỏ hay không. Hãy cho heap nhị phân, heap Fibonacci và cây van Emde Boas thi đấu trên đúng các thao tác hàng đợi mà thuật toán Dijkstra thực hiện, hoặc trên một tỉ lệ thao tác do bạn đặt, rồi xem cấu trúc nào tốn ít bước nhất.',
  summary:
    'Cho heap nhị phân, heap Fibonacci và cây van Emde Boas thi đấu trên các thao tác hàng đợi của thuật toán Dijkstra hoặc trên một tỉ lệ thao tác, rồi chọn đúng hàng đợi ưu tiên.',
  instruction:
    'Ở chế độ Dijkstra, kéo các thanh trượt để đổi đồ thị (hoặc bấm Đồ thị mới) rồi đi từng bước qua lần chạy: mỗi lần chèn, lấy min và giảm khoá đều được tính cho cả ba hàng đợi. Ở chế độ Tỉ lệ thao tác, đặt kích thước hàng đợi và số thao tác mỗi vòng. Đổi vũ trụ u của cây vEB ở cả hai chế độ, và bấm Đến bước cuối để đọc tổng số bước.',
  modeLabel: 'Khối lượng công việc',
  modes: { dijkstra: 'Dijkstra', mix: 'Tỉ lệ thao tác' },
  verticesLabel: 'Số đỉnh V',
  edgesLabel: 'Số cạnh E',
  weightLabel: 'Trọng số lớn nhất',
  newGraph: 'Đồ thị mới',
  /** @param {number} seed */
  graphName: (seed) => `Đồ thị số ${seed}`,
  sizeLabel: 'Kích thước hàng đợi n',
  insertsLabel: 'Số lần chèn mỗi vòng',
  decreasesLabel: 'Số lần giảm khoá mỗi vòng',
  extractsLabel: 'Số lần lấy min mỗi vòng',
  universeLabel: 'Vũ trụ u của cây vEB',
  /** @param {number} bits */
  universeOption: (bits) => `2^${bits}`,
  resetSettings: 'Đặt lại cài đặt',
  /** @param {number} bits */
  power: (bits) => `2^${bits} = ${2 ** bits}`,
  raceTitle: 'Số bước đến giờ',
  /** @param {RaceFrame} f */
  raceAria: (f) => `Số bước đến giờ: ${costs(f.total)}.`,
  queues: { binary: 'Heap nhị phân', fibonacci: 'Heap Fibonacci', veb: 'Cây van Emde Boas' },
  /** @param {number} step */
  stepNote: (step) => `+${num(step)} ở bước này`,
  /** @param {number} steps */
  total: (steps) => num(steps),
  leader: '✓ ít bước nhất',
  noFit: '✗ khoá không nằm gọn trong u',
  stats: {
    inserts: 'Số lần chèn',
    decreases: 'Số lần giảm khoá',
    extracts: 'Số lần lấy min',
    size: 'Kích thước hàng đợi (lớn nhất)',
    maxKey: 'Khoá lớn nhất',
    memory: 'Bộ nhớ của cây vEB: u ô',
  },
  noKeys: '—',
  costTitle: 'Số bước mỗi thao tác ở kích thước này',
  /** @param {number} s */
  costCaption: (s) => `Tính với s = ${s} khoá trong hàng đợi.`,
  costHead: ['Thao tác', 'Nhị phân', 'Fibonacci', 'vEB'],
  opNames: { insert: 'chèn', decrease: 'giảm khoá', extract: 'lấy min' },
  modelTitle: 'Mô hình chi phí',
  model: [
    'Heap nhị phân: ⌊log₂ s⌋ + 1 cho mọi thao tác, tức một đường đi từ gốc xuống lá.',
    'Heap Fibonacci (khấu hao): 1 cho chèn và giảm khoá; ⌊log_φ s⌋ + 1 cho lấy min.',
    'Cây van Emde Boas: log₂ log₂ u + 1 cho mọi thao tác, nhưng chỉ với khoá nguyên nhỏ hơn u.',
  ],
  legend: {
    sorted: 'Ít bước nhất đến giờ',
    pruned: 'Không chứa được các khoá này',
  },
  markers: { sorted: '✓', pruned: '✗' },
  /** @param {RaceFrame} f @param {{v: number, e: number}} graph @param {number} bits */
  describe(f, graph, bits) {
    const one = f.batch > 0 ? perOp(f.step, f.batch) : f.step;
    const fit = f.fits
      ? ''
      : ` Cây vEB không tham gia được: ${f.mode === 'dijkstra' ? `khoá ${f.maxKey} không nhỏ hơn u = 2^${bits}` : `n = ${f.size} khoá không nằm gọn trong u = 2^${bits}`}.`;
    switch (f.kind) {
      case 'start':
        return f.mode === 'dijkstra'
          ? `Thuật toán Dijkstra xuất phát từ đỉnh 0 trên ${graph.v} đỉnh và ${graph.e} cạnh. Mỗi thao tác hàng đợi đều được tính cho cả ba hàng đợi.`
          : `Một hàng đợi gồm n = ${f.size} khoá chạy 10 vòng theo tỉ lệ đã đặt. Mỗi thao tác đều được tính cho cả ba hàng đợi.`;
      case 'insert':
        if (f.mode === 'mix')
          return `Vòng ${f.round}: ${f.batch} lần chèn. Mỗi lần tốn ${costs(one)}.${fit}`;
        return f.opIndex === 0
          ? `insert(0, 0): đỉnh nguồn vào hàng đợi. Chi phí: ${costs(f.step)}.`
          : `Lần đầu tới được đỉnh ${f.vertex}: chèn nó với khoá ${f.key}. Chi phí: ${costs(f.step)}.${fit}`;
      case 'decrease':
        if (f.mode === 'mix')
          return `Vòng ${f.round}: ${f.batch} lần giảm khoá. Mỗi lần tốn ${costs(one)}.${fit}`;
        return `Có đường đi ngắn hơn tới đỉnh ${f.vertex}: giảm khoá của nó xuống ${f.key}. Chi phí: ${costs(f.step)}.`;
      case 'extract':
        if (f.mode === 'mix')
          return `Vòng ${f.round}: ${f.batch} lần lấy min. Mỗi lần tốn ${costs(one)}.${fit}`;
        return `extractMin() trả về đỉnh ${f.vertex}: khoảng cách ${f.key} của nó đã là cuối cùng. Chi phí: ${costs(f.step)}.`;
      case 'done': {
        const all = /** @type {(keyof Costs)[]} */ (['binary', 'fibonacci', 'veb']).filter(
          (k) => k !== 'veb' || f.fits,
        );
        const best = Math.min(...all.map((k) => f.total[k]));
        const win = all
          .filter((k) => f.total[k] === best)
          .map((k) => NAMES[k])
          .join(' và ');
        return `Xong: ${f.counts.insert} lần chèn, ${f.counts.decrease} lần giảm khoá, ${f.counts.extract} lần lấy min. Tổng: ${costs(f.total)}. Ít bước nhất: ${win}.${fit}`;
      }
    }
  },
  takeaways: [
    'Thuật toán Dijkstra thực hiện V lần chèn, V lần lấy min và tối đa E lần giảm khoá. Heap nhị phân tốn log V cho mỗi thao tác, tổng O((V + E) log V); heap Fibonacci chỉ tốn O(1) khấu hao cho mỗi lần giảm khoá, tổng O(E + V log V), nên thắng trên đồ thị dày.',
    'Lấy min trên heap Fibonacci tốn hơn trên heap nhị phân (cận log_φ n vào khoảng 1,44 log₂ n), nên khối lượng công việc gồm chủ yếu là lấy min có lợi cho heap nhị phân; trong mã thật, hằng số lớn hơn và việc lần theo con trỏ còn nới rộng khoảng cách đó.',
    'Với khoá nguyên nhỏ hơn u, cây van Emde Boas làm mọi thao tác trong O(log log u), nhanh hơn log n khi hàng đợi đủ lớn. Nó cần các khoá nằm gọn trong u, và tốn O(u) bộ nhớ dù chứa ít khoá đến đâu.',
    'Chọn theo khối lượng công việc: mặc định dùng heap nhị phân, dùng heap Fibonacci (hoặc heap ghép cặp) khi phép giảm khoá chiếm đa số, và dùng cây vEB hoặc hàng đợi theo ngăn khi có nhiều khoá nguyên nhỏ.',
    'Thử xem: ở chế độ Tỉ lệ thao tác, đặt n = 2^20 với chỉ chèn và lấy min, rồi đổi u từ 2^32 xuống 2^16 và xem cây vEB bị loại.',
  ],
  complexityHead: ['Hàng đợi', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Heap nhị phân',
      'O(log n) cho mỗi thao tác',
      'Chèn, lấy min và giảm khoá đều đi dọc một đường từ gốc xuống lá.',
    ],
    [
      'Heap Fibonacci',
      'O(1) cho chèn và giảm khoá, O(log n) cho lấy min, tính khấu hao',
      'Danh sách gốc lười, hợp nhất khi lấy min, cắt dây chuyền.',
    ],
    [
      'Cây van Emde Boas',
      'O(log log u) cho mỗi thao tác',
      'Mỗi tầng một lời gọi thật sự, và có log₂ log₂ u + 1 tầng; chỉ dùng được với khoá nguyên nhỏ hơn u.',
    ],
    [
      'Dijkstra',
      'O((V + E) log V) với heap nhị phân; O(E + V log V) với heap Fibonacci',
      'V lần chèn và lấy min, tối đa E lần giảm khoá.',
    ],
    [
      'Bộ nhớ',
      'O(n) với heap; O(u) với vEB',
      'Heap chỉ lưu các khoá của nó; cây vEB có một ô cho mọi khoá trong u.',
    ],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Bắt đầu từ cài đặt mặc định (Đặt lại cài đặt): Dijkstra trên 12 đỉnh và 40 cạnh, trọng số lớn nhất 20, Đồ thị số 2. Lần chạy này thực hiện bao nhiêu lần giảm khoá?',
      answer: 5,
      unit: 'lần',
      hints: ['Bấm Đến bước cuối rồi đọc ô Số lần giảm khoá.'],
      solution:
        'Chỉ 5 trong 40 cạnh tìm được đường đi ngắn hơn tới một đỉnh đã ở trong hàng đợi; những lần nới lỏng cạnh khác hoặc tới một đỉnh lần đầu (một lần chèn), hoặc không cải thiện được gì.',
    },
    {
      type: 'number',
      prompt: 'Vẫn lần chạy đó, heap Fibonacci tốn tổng cộng bao nhiêu bước?',
      answer: 60,
      unit: 'bước',
      hints: ['Đọc cột của heap Fibonacci ở bước cuối.'],
      solution:
        '12 lần chèn và 5 lần giảm khoá của nó mỗi lần tốn 1 bước (17), còn 12 lần lấy min mỗi lần tốn ⌊log_φ s⌋ + 1, tổng cộng 43: tất cả 60 bước, so với 80 của heap nhị phân.',
    },
    {
      type: 'choice',
      prompt: 'Vẫn lần chạy đó, đặt vũ trụ của cây vEB là u = 2^4. Điều gì xảy ra?',
      options: [
        'Cây vEB nhanh hơn và thắng',
        'Cây vEB bị loại: có khoá lớn hơn hoặc bằng 16',
        'Không có gì thay đổi',
        'Heap nhị phân bị loại',
      ],
      answer: 1,
      hints: ['Đọc ô Khoá lớn nhất, rồi so sánh với u = 16.'],
      solution:
        'Khoá lớn nhất là khoảng cách 27, còn cây vEB trên u = 16 chỉ chứa được các khoá từ 0 đến 15, nên nó không chạy được lần Dijkstra này. u nhỏ hơn thì ít tầng hơn, nhưng các khoá phải nằm gọn trong u.',
    },
    {
      type: 'choice',
      prompt:
        'Chuyển sang Tỉ lệ thao tác với n = 2^10, u = 2^16 và mỗi vòng 4 lần chèn, 0 lần giảm khoá, 4 lần lấy min. Hàng đợi nào tốn ít bước nhất?',
      options: ['Heap nhị phân', 'Heap Fibonacci', 'Cây van Emde Boas'],
      answer: 2,
      hints: ['Đặt các thanh trượt, bấm Đến bước cuối rồi tìm dấu ✓ ít bước nhất.'],
      solution:
        'Mỗi vòng cây vEB tốn 8 × 5 = 40 bước, heap Fibonacci 4 × 1 + 4 × 15 = 64 và heap nhị phân 8 × 11 = 88. Qua 10 vòng: 400, 640 và 880.',
    },
    {
      type: 'number',
      prompt:
        'Giữ n = 2^10 và u = 2^16, đặt mỗi vòng 0 lần chèn, 0 lần giảm khoá và 4 lần lấy min. Heap Fibonacci tốn nhiều hơn heap nhị phân bao nhiêu bước?',
      answer: 160,
      unit: 'bước',
      hints: ['Đọc cả hai tổng ở bước cuối rồi trừ đi.'],
      solution:
        'Mỗi lần lấy min tốn 11 bước với heap nhị phân và ⌊log_φ 1024⌋ + 1 = 15 bước với heap Fibonacci. 40 lần lấy min: 440 so với 600, tức nhiều hơn 160. Công việc nặng về lấy min có lợi cho heap nhị phân.',
    },
    {
      type: 'choice',
      prompt:
        'Giờ đặt mỗi vòng 4 lần chèn, 20 lần giảm khoá và 4 lần lấy min (n = 2^10, u = 2^16). Hàng đợi nào thắng?',
      options: ['Heap nhị phân', 'Heap Fibonacci', 'Cây van Emde Boas'],
      answer: 1,
      hints: ['Với heap Fibonacci, mỗi lần giảm khoá tốn 1 bước.'],
      solution:
        'Mỗi vòng: Fibonacci 4 + 20 + 4 × 15 = 84, vEB 28 × 5 = 140, nhị phân 28 × 11 = 308. Qua 10 vòng: 840, 1400 và 3080. Nhiều lần giảm khoá chính là lúc heap Fibonacci toả sáng, như thuật toán Dijkstra trên đồ thị dày.',
    },
    {
      type: 'multi',
      prompt: 'Những khẳng định nào đúng?',
      options: [
        'Cây vEB trên u = 2^16 không thể chứa một hàng đợi gồm n = 2^20 khoá khác nhau',
        'Heap Fibonacci làm cho từng lần lấy min đều nhanh',
        'Thuật toán Dijkstra với heap Fibonacci chạy trong O(E + V log V)',
        'Bộ nhớ của cây vEB tăng theo u, không theo số khoá',
      ],
      answers: [0, 2, 3],
      hints: ['Thử n = 2^20 với u = 2^16 ở chế độ Tỉ lệ thao tác.'],
      solution:
        'Chỉ có 2^16 khoá nhỏ hơn u = 2^16, nên 2^20 khoá khác nhau không thể nằm gọn trong đó. Các cận của heap Fibonacci là khấu hao: một lần lấy min có thể phải hợp nhất cả một danh sách gốc dài. Dijkstra tốn O(1) cho mỗi lần giảm khoá và O(log V) cho mỗi lần lấy min, nên tổng là O(E + V log V). Cây vEB dành sẵn chỗ cho toàn bộ u.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Thuật toán đa luồng, xem cách chia việc cho nhiều luồng chạy song song và đo xem làm vậy nhanh lên được bao nhiêu.',
};
