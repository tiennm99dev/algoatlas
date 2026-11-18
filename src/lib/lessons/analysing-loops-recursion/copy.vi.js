/** @typedef {import('$lib/algo-engine/analysing-loops-recursion.js').RecursionFrame} RecursionFrame */
/** @typedef {import('$lib/algo-engine/analysing-loops-recursion.js').Recurrence} Recurrence */

const SUB = /** @type {Record<string, string>} */ ({ 2: '₂', 3: '₃', 4: '₄' });

/** The work term n^d as text. @param {number} d */
const work = (d) => (d === 0 ? '1' : d === 1 ? 'n' : 'n²');

/** @param {Recurrence} r */
function recText(r) {
  return `${r.a === 1 ? '' : r.a}T(n/${r.b}) + ${work(r.d)}`;
}

/** The Θ class the recursion tree gives. @param {Recurrence} r */
function thetaText(r) {
  const bd = r.b ** r.d;
  if (r.a < bd) return `Θ(${work(r.d)})`;
  if (r.a === bd) return r.d === 0 ? 'Θ(log n)' : `Θ(${work(r.d)} log n)`;
  const e = Math.log(r.a) / Math.log(r.b);
  const whole = Math.round(e);
  if (Math.abs(e - whole) < 1e-9) return `Θ(${whole === 1 ? 'n' : 'n²'})`;
  return `Θ(n^(log${SUB[r.b]} ${r.a})) ≈ Θ(n^${e.toFixed(2)})`;
}

export const vi = {
  slug: 'analysing-loops-recursion',
  topic: 'complexity',
  level: 'Trung bình',
  title: 'Phân tích vòng lặp và đệ quy',
  intro:
    'Chi phí của một vòng lặp là một tổng: cộng lại phần việc của từng lượt. Chi phí của một thuật toán đệ quy là một hệ thức truy hồi (recurrence) như T(n) = 2T(n/2) + n, và cây đệ quy biến hệ thức đó trở lại thành một tổng, từng tầng một.',
  summary:
    'Dựng cây đệ quy của T(n) = a·T(n/b) + n^d theo từng tầng, cộng chi phí của mỗi tầng, và xem tầng nào chiếm phần lớn.',
  instruction:
    'Chọn một hệ thức truy hồi hoặc đặt a, b, d và độ sâu k (n = bᵏ), rồi chạy từng bước: mỗi tầng được cộng lại, rồi tách thành các lời gọi nhỏ hơn. So sánh chi phí các tầng trong bảng bên phải.',
  fields: { a: 'a (số lời gọi)', b: 'b (số chia)', d: 'd (phần việc n^d)', k: 'Độ sâu k' },
  presetLabel: 'Hệ thức truy hồi',
  presetPlaceholder: 'Chọn một hệ thức…',
  presets: {
    binary: 'Tìm kiếm nhị phân: T(n/2) + 1',
    halving: 'Quét chia đôi: T(n/2) + n',
    traversal: 'Duyệt cây: 2T(n/2) + 1',
    merge: 'Merge sort: 2T(n/2) + n',
    karatsuba: 'Karatsuba: 3T(n/2) + n',
    quad: 'Bốn nửa: 4T(n/2) + n',
  },
  /** @param {number} max */
  fieldError: (max) =>
    `Hãy dùng số nguyên với 1 ≤ a ≤ 4, 2 ≤ b ≤ 4, 0 ≤ d ≤ 2 và 1 ≤ k ≤ 6, và giữ cây không quá ${max} nút.`,
  recText,
  thetaText,
  /** @param {Recurrence} r */
  nLine: (r) => `n = ${r.b}^${r.k} = ${r.b ** r.k}`,
  treeLabel: 'Cây đệ quy; mỗi nút ghi kích thước bài toán con của nó',
  emptyTree: 'Chưa có cây.',
  /** @param {import('$lib/components/tree-layout.js').TreeNode} node @param {number} depth */
  nodeLabel: (node, depth) =>
    `Lời gọi kích thước ${node.label} ở tầng ${depth}${node.state ? `, ${vi.states[node.state] ?? node.state}` : ''}`,
  states: /** @type {Record<string, string>} */ ({
    active: 'đang cộng',
    frontier: 'bài toán con mới',
    visited: 'đã cộng',
    sorted: 'lá, đã cộng',
  }),
  legend: {
    active: 'Tầng đang cộng',
    frontier: 'Bài toán con mới',
    visited: 'Đã cộng',
    sorted: 'Lá, đã cộng',
  },
  selectedTitle: 'Lời gọi đang chọn',
  selectHint:
    'Chọn một nút (bấm vào, hoặc dùng Tab đến cây rồi dùng phím mũi tên và Enter) để xem chi phí của cả cây con dưới nó.',
  /** @param {Recurrence} r @param {number} size @param {number} level @param {number} cost */
  selectedLine: (r, size, level, cost) =>
    size === 1
      ? `Một lá ở tầng ${level}: T(1) = 1.`
      : `T(${size}) ở tầng ${level} = ${r.a === 1 ? '' : `${r.a} × `}T(${size / r.b}) + ${size ** r.d} = ${cost}: phần việc riêng ${size ** r.d} cộng với mọi thứ bên dưới nó.`,
  levelsTitle: 'Chi phí mỗi tầng',
  levelHead: ['Tầng', 'Số lời gọi × chi phí', 'Chi phí tầng'],
  /** @param {number} nodes @param {number} nodeCost */
  levelCell: (nodes, nodeCost) => `${nodes} × ${nodeCost}`,
  totalRow: 'Tổng',
  stats: { n: 'n', levels: 'Số tầng đã cộng', total: 'Tổng tạm thời', calls: 'Số lời gọi đã vẽ' },
  practiceTitle: 'Tự kiểm tra',
  /** @param {RecursionFrame} f */
  describe(f) {
    const r = f.rec;
    const row = f.levels[f.levels.length - 1];
    switch (f.kind) {
      case 'start':
        return `T(n) = ${recText(r)} với n = ${f.n}. Tầng 0 là lời gọi duy nhất có kích thước ${f.n}.`;
      case 'level':
        return `Tầng ${row.depth}: ${row.nodes} lời gọi kích thước ${row.size}, mỗi lời gọi làm ${row.nodeCost} phần việc, nên tầng này tốn ${row.cost}. Tổng tạm thời ${f.total}.`;
      case 'expand': {
        const size = f.n / r.b ** f.current;
        return `Tách mỗi lời gọi thành ${r.a} lời gọi kích thước ${size}: tầng ${f.current} có ${r.a ** f.current} lời gọi.`;
      }
      case 'leaves':
        return `Tầng ${row.depth}: ${row.nodes} lá kích thước 1, mỗi lá tốn 1, nên tầng này tốn ${row.cost}. Tổng tạm thời ${f.total}.`;
      case 'done': {
        const bd = r.b ** r.d;
        const lead = `T(${f.n}) = ${f.total}, nên T(n) = ${thetaText(r)}.`;
        if (f.treeCase === 'root')
          return `${lead} a = ${r.a} < b^d = ${bd}: chi phí các tầng giảm theo cấp số nhân, nên phần ${work(r.d)} ở gốc chiếm phần lớn.`;
        if (f.treeCase === 'equal')
          return `${lead} a = b^d = ${bd}: tầng nào cũng tốn như nhau, nhân với log${SUB[r.b]} n + 1 tầng.`;
        return `${lead} a = ${r.a} > b^d = ${bd}: chi phí các tầng tăng dần, nên aᵏ = ${r.a ** r.k} lá chiếm phần lớn.`;
      }
    }
  },
  takeaways: [
    'Đếm một vòng lặp bằng cách cộng các lượt của nó. Hai vòng lặp lồng nhau trên 0..n−1 chạy n·n lần; khi vòng trong bắt đầu từ i + 1, thân vòng lặp chạy (n−1) + (n−2) + … + 0 = n(n−1)/2 lần, vẫn là Θ(n²).',
    'Một vòng lặp chia đôi i sau mỗi lượt chạy khoảng log₂ n lần, nên nếu bên trong nó có một vòng lặp chạy n lần thì tổng là Θ(n log n).',
    'Một thuật toán chia để trị (divide and conquer) có hệ thức truy hồi T(n) = a·T(n/b) + n^d: a lời gọi trên các phần kích thước n/b, cộng n^d phần việc để chia và gộp.',
    'Trong cây đệ quy, tầng i có aⁱ lời gọi kích thước n/bⁱ. Nếu a < b^d thì gốc chiếm phần lớn, Θ(n^d); nếu a = b^d thì mọi tầng bằng nhau, Θ(n^d log n); nếu a > b^d thì các lá chiếm phần lớn, Θ(n^(log_b a)).',
    'Thử Merge sort (sắp xếp trộn), rồi Bốn nửa: chi phí các tầng chuyển từ bằng nhau (16, 16, 16…) sang gấp đôi sau mỗi tầng, và tổng nhảy từ n log n lên n².',
  ],
  complexityHead: ['Dạng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Hai vòng lặp lồng nhau đến n', 'Θ(n²)', 'n lượt của một vòng trong dài n bước.'],
    ['Vòng trong j > i', 'Θ(n²)', 'n(n−1)/2 lượt: một nửa của n², vẫn là bậc hai.'],
    ['Vòng lặp chia đôi', 'Θ(log n)', 'i giảm một nửa sau mỗi lượt, nên có khoảng log₂ n lượt.'],
    ['T(n) = 2T(n/2) + n', 'Θ(n log n)', 'log₂ n + 1 tầng, mỗi tầng tốn n.'],
    ['T(n) = T(n/2) + 1', 'Θ(log n)', 'Mỗi tầng một lời gọi, có log₂ n + 1 tầng.'],
    [
      'Độ sâu đệ quy',
      'O(log_b n) stack',
      'Mỗi tầng của cây thêm một khung vào call stack (ngăn xếp lời gọi).',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với n = 10, lệnh count++ chạy bao nhiêu lần trong “for i = 0 to n − 1: for j = i + 1 to n − 1: count++” (vòng j nằm trong vòng i)?',
      answer: 45,
      unit: 'lần',
      hints: [
        'Với i = 0 vòng trong chạy 9 lần, với i = 1 nó chạy 8 lần, và cứ thế.',
        '9 + 8 + … + 1 + 0 = n(n − 1)/2.',
      ],
      solution: 'Vòng trong chạy n − 1 − i lần, nên tổng là 9 + 8 + … + 0 = 10 × 9 / 2 = 45.',
    },
    {
      type: 'number',
      prompt: 'Với n = 64, thân của “i = n; while i > 1: i = i / 2” chạy bao nhiêu lần?',
      answer: 6,
      unit: 'lần',
      hints: ['Theo dõi i: 64, 32, 16, …', 'Đếm xem cần bao nhiêu lần chia đôi để về 1.'],
      solution: 'i đi 64 → 32 → 16 → 8 → 4 → 2 → 1: sáu lần chia đôi, đúng bằng log₂ 64 = 6.',
    },
    {
      type: 'number',
      prompt:
        'Chọn Merge sort (T(n) = 2T(n/2) + n, T(1) = 1) với độ sâu 4, tức n = 16. T(16) bằng bao nhiêu?',
      answer: 80,
      hints: [
        'Mọi tầng của cây tốn như nhau. Mỗi tầng tốn bao nhiêu, và có bao nhiêu tầng?',
        'Các tầng 0 đến 3 mỗi tầng tốn 16, và 16 lá mỗi lá tốn 1.',
      ],
      solution:
        'Năm tầng, mỗi tầng tốn 16 (bốn tầng trong cộng tầng 16 lá), nên T(16) = 5 × 16 = 80 = n log₂ n + n.',
    },
    {
      type: 'choice',
      prompt: 'Với T(n) = 3T(n/2) + n, phần nào của cây đệ quy chiếm phần lớn tổng chi phí?',
      options: [
        'Gốc, nên T(n) = Θ(n)',
        'Mọi tầng như nhau, nên T(n) = Θ(n log n)',
        'Các lá, nên T(n) = Θ(n^(log₂ 3)) ≈ Θ(n^1.58)',
      ],
      answer: 2,
      hints: [
        'So sánh a = 3 với b^d = 2¹ = 2.',
        'Tầng i tốn 3ⁱ × n/2ⁱ = n × 1.5ⁱ: giá trị đó tăng hay giảm theo i?',
      ],
      solution:
        'Chi phí các tầng tăng gấp 1,5 lần sau mỗi tầng, nên 3ᵏ = n^(log₂ 3) lá chiếm phần lớn: Θ(n^1.58). Đây chính là phép nhân Karatsuba.',
    },
    {
      type: 'text',
      prompt: 'Viết lớp Θ của T(n) = 4T(n/2) + n.',
      accept: ['Θ(n²)', 'Theta(n²)', 'n²'],
      hints: ['So sánh a = 4 với b^d = 2. Số lá là 4ᵏ = (2ᵏ)² = n².'],
      solution:
        'a = 4 > b^d = 2, nên các lá chiếm phần lớn: có 4^(log₂ n) = n² lá, nên T(n) = Θ(n²).',
    },
  ],
  nextTeaser:
    'Cùng một kích thước, có đầu vào chạy nhanh và có đầu vào chạy chậm. Bài sau, Trường hợp tốt nhất, xấu nhất và trung bình, tách bạch từng trường hợp.',
};
