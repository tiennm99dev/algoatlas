/** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').FibFrame} FibFrame */
/** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').FibOp} FibOp */
/** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').HeapVariant} HeapVariant */

export const vi = {
  slug: 'fibonacci-heaps',
  topic: 'advanced-heaps',
  level: 'Nâng cao',
  title: 'Heap nhị thức và heap Fibonacci',
  intro:
    'Heap nhị thức (binomial heap) hay heap Fibonacci là một rừng các cây có thứ tự heap: mỗi gốc nhỏ hơn mọi nút bên dưới nó, và gốc nhỏ nhất chính là phần tử nhỏ nhất. Hai heap như vậy gộp lại chỉ bằng cách nối danh sách gốc của chúng, nên đây là các heap gộp được. Heap Fibonacci còn đi xa hơn và “lười”: chèn và giảm khoá (decrease-key) chỉ đụng tới danh sách gốc, tốn O(1) khấu hao, còn việc dọn dẹp thì để dành cho lần lấy min.',
  summary:
    'Chèn, lấy min và giảm khoá trên heap Fibonacci hoặc heap nhị thức, đi từng bước qua danh sách gốc lười, phép hợp nhất theo bậc và các lần cắt dây chuyền.',
  instruction:
    'Gõ một khoá rồi bấm Chèn (hoặc Enter), hoặc bấm Lấy min và xem phép hợp nhất nối các gốc cùng bậc. Muốn giảm một khoá, hãy bấm vào một nút trong rừng, gõ khoá mới rồi bấm Giảm khoá. Chuyển qua lại giữa Fibonacci và Nhị thức để so sánh lúc mỗi heap làm việc của mình.',
  valueLabel: 'Khoá',
  insert: 'Chèn',
  extract: 'Lấy min',
  newKeyLabel: 'Khoá mới',
  decrease: 'Giảm khoá',
  undo: 'Hoàn tác',
  reset: 'Làm lại',
  variantLabel: 'Loại heap',
  variants: { fibonacci: 'Fibonacci (lười)', binomial: 'Nhị thức (chăm)' },
  presetLabel: 'Bộ mẫu',
  presetPlaceholder: 'Nạp một bộ mẫu…',
  presets: {
    lazy: 'Chèn 9, lấy 1',
    cascade: 'Cắt dây chuyền',
    counter: 'Chèn 8 (bộ đếm nhị phân)',
    random: 'Ngẫu nhiên',
  },
  valueError: 'Hãy gõ một số nguyên từ 0 đến 99.',
  full: 'Ở đây heap chứa tối đa 15 khoá. Hãy lấy bớt một khoá trước.',
  emptyError: 'Heap đang rỗng, nên không có gì để lấy.',
  logFull: 'Nhật kí đã đủ 24 thao tác. Hãy hoàn tác hoặc làm lại để thử thêm.',
  pickFirst: 'Hãy bấm vào một nút trong rừng trước để chọn khoá cần giảm.',
  goneError: 'Nút đó đã bị lấy ra. Hãy bấm vào một nút vẫn còn trong heap.',
  /** @param {number} key */
  notSmaller: (key) => `Khoá mới phải nhỏ hơn khoá hiện tại là ${key}.`,
  /** @param {number} key */
  selectedInfo: (key) => `Nút đã chọn: khoá ${key}. Gõ một khoá nhỏ hơn rồi bấm Giảm khoá.`,
  selectHint:
    'Bấm vào một nút (hoặc đưa tiêu điểm tới nó rồi nhấn Enter) để chọn nó cho Giảm khoá.',
  forestTitle: 'Danh sách gốc: một rừng các cây có thứ tự heap',
  /** @param {number} trees @param {number} n */
  forestAria: (trees, n) => (n === 0 ? 'Heap đang rỗng.' : `${trees} cây chứa ${n} khoá.`),
  emptyForest: 'Heap đang rỗng.',
  /** @param {number} key @param {string[]} notes @param {number} depth */
  nodeLabel: (key, notes, depth) =>
    [`Khoá ${key}`, depth === 0 ? 'gốc' : `độ sâu ${depth}`, ...notes].join(', '),
  nodeNotes: {
    min: 'phần tử nhỏ nhất',
    marked: 'đã đánh dấu',
    active: 'đang được xử lí',
    other: 'nút thứ hai trong bước này',
  },
  tableTitle: 'Bảng bậc A (hợp nhất)',
  /** @param {(number | null)[]} keys */
  tableAria: (keys) =>
    `Bảng bậc: ${keys.map((k, d) => `bậc ${d}: ${k === null ? 'trống' : `khoá ${k}`}`).join('; ')}.`,
  tableIdle: 'Bảng này chỉ được dùng khi lấy min và hợp nhất các gốc.',
  stats: {
    size: 'Số khoá',
    roots: 'Số gốc t',
    marked: 'Số nút đánh dấu m',
    potential: 'Thế năng Φ = t + 2m',
    links: 'Số lần nối',
    cuts: 'Số lần cắt',
    siftSwaps: 'Số lần đổi chỗ khi vun lên',
    min: 'Phần tử nhỏ nhất',
  },
  noMin: '—',
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'đang chạy',
  /** @param {FibOp} op @param {number | undefined} old */
  opChip: (op, old) =>
    op.type === 'insert'
      ? `+${op.value}`
      : op.type === 'extract'
        ? 'min'
        : `${old ?? '?'}↓${op.value}`,
  outTitle: 'Đã lấy ra, theo thứ tự',
  outEmpty: 'chưa có gì',
  legend: {
    active: 'Nút đang được xử lí',
    compare: 'Nút còn lại trong bước này',
    swap: 'Vừa được nối, cắt hoặc đổi chỗ',
    sorted: 'Phần tử nhỏ nhất',
    visited: 'Đã đánh dấu: đã mất một con',
  },
  markers: { active: '→', compare: '?', swap: '⇄', sorted: '★', visited: '×' },
  /**
   * @param {FibFrame} f
   * @param {(id: number) => number | undefined} keyOf  The key of an item in this frame.
   */
  describe(f, keyOf) {
    const k = (/** @type {number} */ id) => keyOf(id) ?? '?';
    const lazy = f.variant === 'fibonacci';
    switch (f.kind) {
      case 'start':
        return lazy
          ? 'Một heap Fibonacci rỗng: một danh sách gốc gồm các cây có thứ tự heap và một con trỏ tới gốc nhỏ nhất.'
          : 'Một heap nhị thức rỗng: một danh sách gốc có nhiều nhất một cây cho mỗi bậc, giống các chữ số của một số nhị phân.';
      case 'insert':
        return lazy
          ? `Chèn ${f.value}: thêm nó vào danh sách gốc như một cây một nút rồi cập nhật min. Không nối gì cả: O(1).`
          : `Chèn ${f.value}: nó bắt đầu là một số nhớ, tức một cây bậc 0.`;
      case 'carry':
        return `Gốc ${k(f.other)} cũng có bậc ${f.degree}, nên hai cây phải được nối, giống 1 + 1 trong hệ nhị phân.`;
      case 'carry-link':
        return `Nối: ${k(f.other)} xuống dưới ${k(f.node)}, gốc nhỏ hơn. Số nhớ giờ có bậc ${f.degree}.`;
      case 'placed':
        return `Không còn gốc nào khác có bậc ${f.degree}: số nhớ vào danh sách gốc. Mỗi bậc xuất hiện nhiều nhất một lần.`;
      case 'empty':
        return 'Heap đang rỗng, nên không có gì để lấy.';
      case 'extract':
        return lazy
          ? `Lấy min: con trỏ min chỉ vào ${f.value}. Bỏ nó đi và đưa các con của nó lên danh sách gốc.`
          : `Lấy min: quét các gốc để tìm gốc nhỏ nhất, là ${f.value}. Bỏ nó đi và đưa các con của nó lên danh sách gốc.`;
      case 'promote':
        return f.trees.length === 0
          ? `Trả về ${f.value}. Không còn gì, nên không cần hợp nhất.`
          : `${f.value} đã được lấy ra; các con của nó giờ là gốc. Cần hợp nhất ${f.trees.length} gốc.`;
      case 'scan':
        return `Hợp nhất: lấy gốc ${k(f.node)}, có bậc ${f.degree}.`;
      case 'link':
        return `A[${f.degree}] đã có một cây bậc ${f.degree}: nối ${k(f.other)} xuống dưới ${k(f.node)}, gốc nhỏ hơn. Bậc ${f.degree} → ${f.degree + 1}.`;
      case 'slot':
        return `A[${f.degree}] còn trống: cất ${k(f.node)} vào đó.`;
      case 'rebuild':
        return f.node < 0
          ? 'Heap đang rỗng.'
          : `Giờ mỗi bậc chỉ xuất hiện một lần. Các gốc trong A tạo thành danh sách gốc mới; phần tử nhỏ nhất là ${k(f.node)}. Trả về ${f.value}.`;
      case 'decrease':
        return lazy
          ? `Giảm ${f.old} xuống ${f.value}.${f.other < 0 ? ' Nó là một gốc, nên thứ tự heap không thể bị phá vỡ.' : ` Cha của nó chứa ${k(f.other)}.`}`
          : `Giảm ${f.old} xuống ${f.value}, rồi vun nó lên trong cây chừng nào nó còn nhỏ hơn cha.`;
      case 'cut':
        return `${f.value} < ${k(f.other)} phá vỡ thứ tự heap: cắt ${k(f.node)} ra cùng cây con của nó và biến nó thành một gốc (bỏ đánh dấu).`;
      case 'mark':
        return `${k(f.node)} vừa mất đứa con đầu tiên: đánh dấu nó rồi dừng. Mất thêm một con nữa là nó cũng bị cắt.`;
      case 'cascade':
        return `${k(f.node)} đã được đánh dấu từ trước, nên giờ nó đã mất hai con: cắt cả nó (cắt dây chuyền) rồi đi lên ${k(f.other)}.`;
      case 'sift':
        return `${f.value} nhỏ hơn cha của nó: đổi chỗ hai phần tử, nên ${f.value} lên một tầng.`;
      case 'settled':
        return lazy
          ? `Xong trong O(1) khấu hao. Phần tử nhỏ nhất là ${f.minId === null ? '—' : k(f.minId)}.`
          : `${f.value} đã đúng chỗ${f.other < 0 ? ' ở gốc' : ''}: nhiều nhất O(log n) lần đổi chỗ. Phần tử nhỏ nhất là ${f.minId === null ? '—' : k(f.minId)}.`;
      case 'done':
        return `Đã làm xong mọi thao tác: ${f.links} lần nối, ${f.cuts} lần cắt${lazy ? '' : ` và ${f.siftSwaps} lần đổi chỗ khi vun lên`}.`;
    }
  },
  takeaways: [
    'Cả hai heap đều là rừng các cây có thứ tự heap, và phần tử nhỏ nhất là một trong các gốc. Gộp hai heap chỉ cần nối danh sách gốc của chúng, vì thế chúng được gọi là heap gộp được.',
    'Heap nhị thức giữ một cây cho mỗi bậc, và cây bậc k chứa đúng 2ᵏ khoá. Các bậc đi theo các chữ số nhị phân của n, nên một lần chèn nối cây giống như phép cộng có nhớ trong hệ nhị phân.',
    'Heap Fibonacci thì lười: chèn chỉ thêm một gốc. Lấy min trả giá cho sự bừa bộn đó bằng phép hợp nhất, nối các gốc cùng bậc qua bảng bậc A, tốn O(log n) khấu hao.',
    'Giảm khoá cắt nút lên danh sách gốc và đánh dấu cha của nó; một nút cha mất con thứ hai cũng bị cắt (cắt dây chuyền). Với thế năng Φ = t + 2m, việc này tốn O(1) khấu hao, chính là lí do thuật toán Dijkstra và Prim chạy nhanh hơn trên heap Fibonacci.',
    'Thử xem: nạp bộ Cắt dây chuyền, đi tới bước cuối ở cả hai chế độ, rồi so sánh số lần nối, số lần cắt và số lần đổi chỗ khi vun lên.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Chèn',
      'Fibonacci O(1); nhị thức O(log n) xấu nhất, O(1) khấu hao',
      'Fibonacci chỉ thêm một gốc; nhị thức nhớ qua nhiều nhất log₂ n lần nối.',
    ],
    [
      'Tìm min',
      'O(1)',
      'Một con trỏ min chỉ vào gốc nhỏ nhất (heap nhị thức có thể quét ≤ log₂ n + 1 gốc của nó).',
    ],
    [
      'Gộp hai heap',
      'O(1) với Fibonacci; O(log n) với nhị thức',
      'Nối các danh sách gốc (và xử lí số nhớ).',
    ],
    [
      'Lấy min',
      'O(log n) khấu hao',
      'Các gốc thừa được trả bằng thế năng; còn lại nhiều nhất D(n) = O(log n) gốc.',
    ],
    [
      'Giảm khoá',
      'Fibonacci O(1) khấu hao; nhị thức O(log n)',
      'Một lần cắt cộng các lần cắt dây chuyền, mỗi lần giải phóng 2 đơn vị thế năng, so với một lần vun lên dài bằng chiều cao của cây.',
    ],
    [
      'Bộ nhớ',
      'O(n)',
      'Mỗi khoá một nút, có liên kết tới cha, con và anh em, cùng một bậc và một dấu.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Một heap nhị thức chứa 13 khoá. Danh sách gốc của nó có bao nhiêu cây? (13 = 1101 trong hệ nhị phân.)',
      answer: 3,
      unit: 'cây',
      hints: ['Mỗi chữ số 1 trong biểu diễn nhị phân của n ứng với một cây bậc k, chứa 2ᵏ khoá.'],
      solution: '13 = 8 + 4 + 1, nên danh sách gốc có các cây bậc 3, 2 và 0: tất cả 3 cây.',
    },
    {
      type: 'number',
      prompt: 'Nạp bộ Chèn 9, lấy 1 với heap Fibonacci. Phép hợp nhất thực hiện bao nhiêu lần nối?',
      answer: 7,
      unit: 'lần',
      hints: [
        'Sau khi phần tử nhỏ nhất bị lấy đi còn lại tám gốc. Mỗi lần nối gộp hai cây thành một.',
      ],
      solution:
        'Tám gốc một nút cuối cùng thành một cây bậc 3. Mỗi lần nối làm số cây giảm đi một, nên có 8 − 1 = 7 lần nối.',
    },
    {
      type: 'choice',
      prompt:
        'Trong heap Fibonacci, phép giảm khoá cắt nút x khỏi cha y của nó, và y đã được đánh dấu từ trước. Điều gì xảy ra tiếp theo?',
      options: [
        'y được bỏ đánh dấu và ở nguyên chỗ cũ',
        'y cũng bị cắt lên danh sách gốc, và việc kiểm tra đi tiếp lên cha của y',
        'cả cây được hợp nhất lại',
        'x được đặt trở lại dưới y',
      ],
      answer: 1,
      hints: ['Một dấu nghĩa là nút đó đã mất một con kể từ lúc nó được nối vào.'],
      solution:
        'Một y đã đánh dấu giờ đã mất hai con, nên nó cũng bị cắt (cắt dây chuyền), và cùng phép kiểm tra đó chạy tiếp trên cha của nó. Nhờ vậy mọi cây bậc k luôn có ít nhất Fₖ₊₂ nút.',
    },
    {
      type: 'number',
      prompt:
        'Một heap Fibonacci có 6 gốc và 2 nút được đánh dấu. Thế năng Φ = t + 2m của nó là bao nhiêu?',
      answer: 10,
      hints: ['t đếm số gốc, còn m đếm số nút được đánh dấu.'],
      solution: 'Φ = 6 + 2 · 2 = 10.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Cây van Emde Boas, cho thấy khi các khoá là số nguyên nhỏ thì một cấu trúc chia căn vũ trụ có thể nhanh hơn mọi heap dựa trên so sánh.',
};
