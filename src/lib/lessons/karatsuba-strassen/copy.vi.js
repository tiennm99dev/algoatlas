/** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').MulFrame} MulFrame */
/** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').CallNode} CallNode */
/** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').StrassenFrame} StrassenFrame */
/** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').SplitMethod} SplitMethod */

const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇'];

/** A signed number in a sum: "+ 3" or "− 3". @param {number} v */
const signed = (v) => (v < 0 ? `− ${-v}` : `+ ${v}`);

/** A factor in a product, bracketed when negative. @param {number} v */
const factor = (v) => (v < 0 ? `(−${-v})` : String(v));

/** @param {number} v */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

const TAGS = /** @type {Record<CallNode['tag'], string>} */ ({
  root: '×',
  a: 'a',
  b: 'b',
  c: 'c',
  d: 'd',
  z2: 'z₂',
  z1: 'z₁',
  z0: 'z₀',
});

const FORMULAS = [
  '(A₁₁ + A₂₂)(B₁₁ + B₂₂)',
  '(A₂₁ + A₂₂)·B₁₁',
  'A₁₁·(B₁₂ − B₂₂)',
  'A₂₂·(B₂₁ − B₁₁)',
  '(A₁₁ + A₁₂)·B₂₂',
  '(A₂₁ − A₁₁)(B₁₁ + B₁₂)',
  '(A₁₂ − A₂₂)(B₂₁ + B₂₂)',
];

/** Which M's each entry of C adds, with their signs, row-major. */
const ENTRY_TERMS = /** @type {[number, number][][]} */ ([
  [
    [0, 1],
    [3, 1],
    [4, -1],
    [6, 1],
  ],
  [
    [2, 1],
    [4, 1],
  ],
  [
    [1, 1],
    [3, 1],
  ],
  [
    [0, 1],
    [1, -1],
    [2, 1],
    [5, 1],
  ],
]);
const ENTRY_NAMES = ['C₁₁', 'C₁₂', 'C₂₁', 'C₂₂'];

/** @param {number[]} M @param {number} t */
function entryText(M, t) {
  const terms = ENTRY_TERMS[t];
  const names = terms
    .map(([i, s], at) => `${at === 0 ? '' : s < 0 ? ' − ' : ' + '}M${SUB[i + 1]}`)
    .join('');
  const values = terms
    .map(([i, s], at) => {
      const v = s * M[i];
      return at === 0 ? num(v) : ` ${signed(v)}`;
    })
    .join('');
  return { names, values };
}

/** Whether a sum of two halves grew a digit past both halves. @param {number} a @param {number} b */
const carries = (a, b) => String(a + b).length > Math.max(String(a).length, String(b).length);

/** @param {(number | null)[][]} C */
const matrixText = (C) => `[${C.map((r) => r.map((v) => num(v ?? 0)).join(' ')).join('; ')}]`;

export const vi = {
  slug: 'karatsuba-strassen',
  topic: 'divide-and-conquer',
  level: 'Nâng cao',
  title: 'Thuật toán Karatsuba và Strassen',
  intro:
    'Tách đôi hai số có n chữ số cho ta bốn tích cỡ một nửa, mà bốn tích cỡ một nửa thì tốn ngang cách nhân đặt tính: Θ(n²). Karatsuba nhận ra chỉ cần ba tích là đủ, nhờ vậy chi phí giảm xuống Θ(n^1.585). Strassen tìm ra mẹo tương tự cho ma trận: bảy tích khối thay vì tám. Cả hai đều là chia để trị (divide and conquer).',
  summary:
    'Dựng cây đệ quy của một phép nhân với bốn tích mỗi lần chia, rồi với ba tích của Karatsuba, đếm số phép nhân một chữ số, và chạy từng bước bảy tích ma trận của Strassen.',
  instruction:
    'Chọn Số hoặc Ma trận. Với số, nhập hai thừa số rồi chuyển qua lại giữa bốn tích và ba tích: cây cho thấy mọi lời gọi đệ quy, và bạn có thể chọn một lời gọi để xem nó được chia ra sao. Với ma trận, nhập A và B rồi chạy từng bước từ M₁ đến M₇.',
  modeLabel: 'Phép nhân',
  modes: { numbers: 'Số', matrices: 'Ma trận 2×2' },
  methodLabel: 'Số tích mỗi lần chia',
  methods: { four: 'Bốn (chia thường)', three: 'Ba (Karatsuba)' },
  xLabel: 'x',
  yLabel: 'y',
  exampleLabel: 'Ví dụ',
  examplePlaceholder: 'Chọn một ví dụ…',
  examples: {
    clean: '1213 × 3141 (không có nhớ)',
    classic: '1234 × 5678',
    two: '12 × 34',
    big: '999999 × 999999',
  },
  factorErrors: {
    format: 'Hãy nhập một số nguyên chỉ gồm các chữ số. Thừa số hợp lệ gần nhất đã được khôi phục.',
    size: 'Mỗi thừa số có tối đa 6 chữ số. Thừa số hợp lệ gần nhất đã được khôi phục.',
  },
  aLabel: 'A (theo từng hàng)',
  bLabel: 'B (theo từng hàng)',
  matrixErrors: {
    format:
      'Hãy nhập bốn số nguyên theo từng hàng, ví dụ “1 2; 3 4”. Ma trận hợp lệ gần nhất đã được khôi phục.',
    range: 'Mỗi phần tử phải từ −9 đến 9. Ma trận hợp lệ gần nhất đã được khôi phục.',
  },
  methodNotice: {
    four: 'Đang dùng bốn tích mỗi lần chia.',
    three: 'Đang dùng ba tích mỗi lần chia của Karatsuba.',
  },
  treeLabel: 'Cây đệ quy của phép nhân; bên dưới mỗi lời gọi là hai thừa số của nó',
  emptyTree: 'Chưa có lời gọi nào.',
  /** @param {CallNode['tag']} tag */
  tag: (tag) => TAGS[tag],
  /** @param {CallNode} n */
  noteOf: (n) => `${n.x}·${n.y}`,
  /** @param {CallNode} n @param {string} state */
  nodeLabel: (n, state) =>
    `${n.tag === 'root' ? 'Gốc' : TAGS[n.tag]}: ${n.x} × ${n.y}${n.result === null ? '' : ` = ${n.result}`}${state ? `, ${state}` : ''}`,
  states: /** @type {Record<string, string>} */ ({
    active: 'lời gọi hiện tại',
    frontier: 'đang chờ',
    visited: 'đã kết hợp',
    sorted: 'tích một chữ số',
  }),
  markers: /** @type {Record<string, string>} */ ({
    active: '▶',
    frontier: '…',
    visited: '+',
    sorted: '✓',
  }),
  legend: {
    active: 'Lời gọi hiện tại',
    frontier: 'Đang chờ',
    visited: 'Kết hợp từ các phần',
    sorted: 'Tích một chữ số',
  },
  strassenLegend: {
    active: 'Đang tính',
    visited: 'Đã tính tích',
    sorted: 'Đã tính phần tử của C',
  },
  selectedTitle: 'Lời gọi đang chọn',
  selectHint:
    'Chọn một lời gọi (bấm vào nó, hoặc dùng Tab để đến cây, rồi dùng phím mũi tên và Enter) để xem nó được chia ra sao.',
  /** @param {CallNode} n */
  selectedLines(n) {
    const lines = [`${n.x} × ${n.y}${n.result === null ? ' = ?' : ` = ${n.result}`}`];
    if (n.parts) {
      const { x1, x0, y1, y0 } = n.parts;
      lines.push(`m = ${n.m}: x = ${x1}·10^${n.m} + ${x0}, y = ${y1}·10^${n.m} + ${y0}`);
    } else if (n.result !== null) {
      lines.push('Hai thừa số một chữ số: một phép nhân một chữ số.');
    }
    return lines;
  },
  stats: {
    products: 'Số phép nhân một chữ số',
    calls: 'Số lời gọi',
    adds: 'Số phép cộng và trừ',
    multiplications: 'Số phép nhân',
    additions: 'Số phép cộng và trừ',
  },
  compareTitle: 'Số phép nhân một chữ số với các thừa số này',
  growthTitle: 'Hai thừa số n chữ số, n là luỹ thừa của 2, không có nhớ',
  growthHead: ['n chữ số', 'Bốn tích: n²', 'Ba tích: n^1.585'],
  mTitle: 'Các tích M₁ đến M₇',
  /** @param {number} i */
  mName: (i) => `M${SUB[i + 1]}`,
  matrixA: 'Ma trận A',
  matrixB: 'Ma trận B',
  matrixC: 'C = A·B',
  definitionTitle: 'Theo định nghĩa, để so sánh',
  definitionLine:
    '8 phép nhân và 4 phép cộng: mỗi phần tử của C là một hàng của A nhân với một cột của B.',
  /** @param {string} name @param {(number | string | null)[][]} values */
  matrixAria: (name, values) =>
    `${name}: ${values.map((r) => r.map((v) => (v === null ? 'chưa tính' : v)).join(', ')).join('; ')}`,
  practiceTitle: 'Tự kiểm tra',
  /** @param {MulFrame} f @param {SplitMethod} method */
  describe(f, method) {
    const root = f.nodes[0];
    const node = f.current >= 0 ? f.nodes[f.current] : root;
    switch (f.kind) {
      case 'start':
        return method === 'four'
          ? `Nhân ${root.x} × ${root.y}. Tách đôi cả hai thừa số rồi nhân bốn cặp nửa với nhau. Đệ quy dừng khi gặp hai thừa số một chữ số.`
          : `Nhân ${root.x} × ${root.y} theo cách của Karatsuba: tách đôi cả hai thừa số, nhưng lấy số hạng giữa từ một tích duy nhất. Đệ quy dừng khi gặp hai thừa số một chữ số.`;
      case 'split': {
        const p = /** @type {NonNullable<CallNode['parts']>} */ (node.parts);
        const head = `${node.x} × ${node.y}: chia tại m = ${node.m}, nên ${node.x} = ${p.x1}·10^${node.m} + ${p.x0} và ${node.y} = ${p.y1}·10^${node.m} + ${p.y0}.`;
        if (method === 'four')
          return `${head} Bốn tích: ${p.x1}·${p.y1}, ${p.x1}·${p.y0}, ${p.x0}·${p.y1} và ${p.x0}·${p.y0}.`;
        const carry =
          carries(p.x1, p.x0) || carries(p.y1, p.y0)
            ? ' Một tổng bị nhớ sang thêm một chữ số, nên tích ở giữa dài hơn một chút.'
            : '';
        return `${head} Ba tích: z₂ = ${p.x1}·${p.y1}, z₀ = ${p.x0}·${p.y0}, và (${p.x1} + ${p.x0})·(${p.y1} + ${p.y0}) = ${p.x1 + p.x0}·${p.y1 + p.y0} cho số hạng giữa.${carry}`;
      }
      case 'base':
        return `${node.x} × ${node.y} = ${node.result}: một phép nhân một chữ số, đến giờ là ${f.products} phép.`;
      case 'combine': {
        const r = node.children.map((id) => /** @type {number} */ (f.nodes[id].result));
        const mm = node.m;
        if (method === 'four') {
          const [a, b, c, d] = r;
          return `${node.x} × ${node.y} = a·10^${2 * mm} + (b + c)·10^${mm} + d = ${a}·10^${2 * mm} + ${b + c}·10^${mm} + ${d} = ${node.result}.`;
        }
        const [z2, mid, z0] = r;
        const z1 = mid - z2 - z0;
        return `z₁ = ${mid} − ${z2} − ${z0} = ${z1}, nên ${node.x} × ${node.y} = ${z2}·10^${2 * mm} + ${z1}·10^${mm} + ${z0} = ${node.result}.`;
      }
      case 'done':
        return `${root.x} × ${root.y} = ${root.result}, dùng ${f.products} phép nhân một chữ số trong ${f.calls} lời gọi.`;
    }
  },
  /** @param {StrassenFrame} f */
  describeStrassen(f) {
    switch (f.kind) {
      case 'start':
        return 'Nhân hai ma trận 2×2. Theo định nghĩa cần 8 tích, mỗi phần tử của C cần 2 tích. Strassen chỉ cần 7, đổi lại phải làm thêm phép cộng.';
      case 'product': {
        const [p, q] = /** @type {[number, number]} */ (f.factors);
        return `M${SUB[f.current + 1]} = ${FORMULAS[f.current]} = ${factor(p)} × ${factor(q)} = ${num(/** @type {number} */ (f.M[f.current]))}. Đến giờ là ${f.multiplications} phép nhân.`;
      }
      case 'entry': {
        const { names, values } = entryText(/** @type {number[]} */ (f.M), f.current);
        const value = /** @type {number} */ (f.C[Math.floor(f.current / 2)][f.current % 2]);
        return `${ENTRY_NAMES[f.current]} = ${names} = ${values} = ${num(value)}. Không có phép nhân nào, chỉ có phép cộng.`;
      }
      case 'done':
        return `C = ${matrixText(f.C)}, với 7 phép nhân và 18 phép cộng và trừ. Với ma trận n×n được cắt thành bốn khối n/2, bớt được một tích khối cho T(n) = 7T(n/2) + Θ(n²) = Θ(n^(log₂ 7)) ≈ Θ(n^2.81), so với Θ(n³).`;
    }
  },
  takeaways: [
    'Tách x = x₁·10^m + x₀ và y = y₁·10^m + y₀. Khi đó x·y = x₁y₁·10^(2m) + (x₁y₀ + x₀y₁)·10^m + x₀y₀: bốn tích cỡ một nửa, nên T(n) = 4T(n/2) + O(n) = Θ(n²), không hơn gì cách nhân đặt tính.',
    'Karatsuba: (x₁ + x₀)(y₁ + y₀) − x₁y₁ − x₀y₀ = x₁y₀ + x₀y₁, nên ba tích là đủ. T(n) = 3T(n/2) + O(n) = Θ(n^(log₂ 3)) ≈ Θ(n^1.585). Một phép nhân được đổi lấy vài phép cộng O(n).',
    'Strassen làm điều tương tự với ma trận: theo định nghĩa, các khối 2×2 cần 8 tích khối, còn công thức của Strassen chỉ cần 7. T(n) = 7T(n/2) + Θ(n²) = Θ(n^(log₂ 7)) ≈ Θ(n^2.81) thay vì Θ(n³).',
    'Khoản tiết kiệm chỉ đáng kể với đầu vào lớn: các tổng có thể nhớ sang thêm một chữ số và các phép cộng thêm cũng tốn thời gian, nên thư viện thực tế quay về cách nhân đặt tính khi kích thước nhỏ hơn một ngưỡng.',
    'Thử 1213 × 3141 với bốn tích rồi ba tích: 16 so với 9 phép nhân một chữ số. Sau đó chọn 1234 × 5678, nơi phép nhớ đẩy Karatsuba lên 17, và 999999 × 999999, nơi Karatsuba thắng 43 so với 52.',
  ],
  complexityHead: ['Cách làm', 'Thời gian', 'Vì sao'],
  complexity: [
    ['Số, bốn tích', 'Θ(n²)', 'T(n) = 4T(n/2) + O(n), và log₂ 4 = 2.'],
    ['Karatsuba, ba tích', 'Θ(n^1.585)', 'T(n) = 3T(n/2) + O(n), và log₂ 3 ≈ 1.585.'],
    ['Ma trận, tám tích khối', 'Θ(n³)', 'T(n) = 8T(n/2) + Θ(n²), và log₂ 8 = 3.'],
    ['Strassen, bảy tích khối', 'Θ(n^2.81)', 'T(n) = 7T(n/2) + Θ(n²), và log₂ 7 ≈ 2.807.'],
    ['Bộ nhớ thêm', 'O(n) / O(n²)', 'Các tổng và tích trung gian ở mỗi tầng đệ quy.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Hai số 8 chữ số được nhân bằng cách tách đôi với bốn tích mỗi lần chia, cho đến khi còn các thừa số một chữ số. Có bao nhiêu phép nhân một chữ số?',
      answer: 64,
      unit: 'phép nhân',
      hints: [
        'Mỗi lần chia biến một tích thành bốn tích cỡ một nửa.',
        '8 → 4 → 2 → 1 chữ số là ba tầng.',
      ],
      solution:
        'Ba tầng chia bốn cho 4³ = 64 = 8² tích một chữ số, đúng bằng số phép nhân của cách nhân đặt tính.',
    },
    {
      type: 'number',
      prompt:
        'Vẫn hai số 8 chữ số ấy nhưng dùng Karatsuba, giả sử không tổng nào bị nhớ: có bao nhiêu phép nhân một chữ số?',
      answer: 27,
      unit: 'phép nhân',
      hints: ['Giờ mỗi lần chia tạo ra ba tích cỡ một nửa.', 'Lại là ba tầng.'],
      solution:
        '3³ = 27 = 8^(log₂ 3). Chọn 1213 × 3141 trên hình minh hoạ để xem trường hợp 4 chữ số: 3² = 9.',
    },
    {
      type: 'choice',
      prompt: '(x₁ + x₀)(y₁ + y₀) − x₁y₁ − x₀y₀ bằng gì?',
      options: ['x₁y₁ + x₀y₀', 'x₁y₀ + x₀y₁', 'x₁x₀ + y₁y₀', '2·x₁y₀'],
      answer: 1,
      hints: [
        'Khai triển (x₁ + x₀)(y₁ + y₀) thành bốn số hạng.',
        'Hai trong bốn số hạng lại bị trừ đi.',
      ],
      solution:
        '(x₁ + x₀)(y₁ + y₀) = x₁y₁ + x₁y₀ + x₀y₁ + x₀y₀. Bớt đi x₁y₁ và x₀y₀ còn lại x₁y₀ + x₀y₁, chính là số hạng giữa, chỉ từ một tích.',
    },
    {
      type: 'text',
      prompt: 'Giải hệ thức của Karatsuba T(n) = 3T(n/2) + n. Viết T(n) dưới dạng Θ(…).',
      accept: [
        'Θ(n^(log₂ 3))',
        'Θ(n^(log2 3))',
        'Θ(n^1.585)',
        'Θ(n^1.58)',
        'Θ(n^1.59)',
        'n^1.585',
        'n^(log2 3)',
        'O(n^1.585)',
        'O(n^(log2 3))',
      ],
      hints: [
        'c = log₂ 3 ≈ 1.585 lớn hơn 1, số mũ của f(n) = n.',
        'Trường hợp 1 của định lí thợ: các lá chiếm ưu thế.',
      ],
      solution:
        'a = 3, b = 2, c = log₂ 3 ≈ 1.585 > 1, nên trường hợp 1 cho Θ(n^(log₂ 3)) ≈ Θ(n^1.585).',
    },
    {
      type: 'number',
      prompt:
        'Phương pháp Strassen trên ma trận 4×4 đệ quy xuống các khối 2×2, rồi xuống từng số. Nó thực hiện bao nhiêu phép nhân hai số?',
      answer: 49,
      unit: 'phép nhân',
      hints: ['Mỗi tầng tạo ra 7 tích cỡ một nửa.', 'Hai tầng: 4 → 2 → 1.'],
      solution: '7 · 7 = 49 phép nhân, so với 8 · 8 = 64 = 4³ theo định nghĩa.',
    },
  ],
  nextTeaser:
    'Bài sau đưa chia để trị lên mặt phẳng: tìm cặp điểm gần nhất bằng cách chia đôi các điểm và chỉ kiểm tra một dải hẹp quanh đường chia.',
};
