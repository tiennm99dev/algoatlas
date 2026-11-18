/** @typedef {import('$lib/algo-engine/master-theorem.js').MasterFrame} MasterFrame */
/** @typedef {import('$lib/algo-engine/master-theorem.js').Recurrence} Recurrence */
/** @typedef {import('$lib/algo-engine/master-theorem.js').MasterCase} MasterCase */

const SUB = /** @type {Record<number, string>} */ ({ 2: '₂', 3: '₃', 4: '₄' });

/** n raised to a whole or half exponent. @param {number} e */
function powText(e) {
  if (e === 0) return '1';
  if (e === 0.5) return '√n';
  if (e === 1) return 'n';
  if (e === 2) return 'n²';
  if (e === 3) return 'n³';
  return `n^${e}`;
}

/** (log n)^p for p ≥ 1. @param {number} p */
const logText = (p) => (p === 1 ? 'log n' : `log${p === 2 ? '²' : p === 3 ? '³' : `^${p}`} n`);

/** n^e · (log n)^p as one term, p ≥ 0. @param {number} e @param {number} p */
function termText(e, p) {
  if (p === 0) return powText(e);
  return e === 0 ? logText(p) : `${powText(e)} ${logText(p)}`;
}

/** The work term f(n). @param {Recurrence} r */
function fText(r) {
  if (r.p < 0) return `${powText(r.d)} / log n`;
  return termText(r.d, r.p);
}

/** @param {Recurrence} r */
const recText = (r) => `${r.a === 1 ? '' : r.a}T(n/${r.b}) + ${fText(r)}`;

/**
 * A number as a short readable string in programming notation: a decimal point, no grouping,
 * and an exponent for very large values, so it reads the same as a typed answer.
 * @param {number} x
 */
function fmt(x) {
  if (Math.abs(x) >= 1e6) return x.toExponential(2).replace('e+', 'e');
  return x.toLocaleString('en-US', {
    maximumFractionDigits: Math.abs(x) < 10 ? 2 : 1,
    useGrouping: false,
  });
}

/** The exponent c = log_b a, exact when it is a whole or half number. @param {Recurrence} r */
function cExact(r) {
  const c = Math.log(r.a) / Math.log(r.b);
  const half = Math.round(2 * c) / 2;
  return Math.abs(c - half) < 1e-9 ? half : null;
}

/** c as text: "1", "0.5", or "log₂ 3 ≈ 1.58". @param {Recurrence} r */
function cText(r) {
  const exact = cExact(r);
  if (exact !== null) return String(exact);
  return `log${SUB[r.b]} ${r.a} ≈ ${(Math.log(r.a) / Math.log(r.b)).toFixed(2)}`;
}

/** n^c as text. @param {Recurrence} r */
function leavesText(r) {
  const exact = cExact(r);
  if (exact !== null) return powText(exact);
  return `n^(log${SUB[r.b]} ${r.a})`;
}

/** The Θ answer for a verdict, or null when no case applies. @param {Recurrence} r @param {MasterCase} v */
function thetaText(r, v) {
  if (v === 1) {
    const exact = cExact(r);
    const approx = (Math.log(r.a) / Math.log(r.b)).toFixed(2);
    return exact !== null ? `Θ(${powText(exact)})` : `Θ(${leavesText(r)}) ≈ Θ(n^${approx})`;
  }
  if (v === 2) return `Θ(${termText(r.d, r.p + 1)})`;
  if (v === 3) return `Θ(${fText(r)})`;
  return null;
}

export const vi = {
  slug: 'master-theorem',
  topic: 'divide-and-conquer',
  level: 'Trung bình',
  title: 'Chia để trị và định lí thợ',
  intro:
    'Một thuật toán chia để trị (divide and conquer) tách bài toán thành a bản sao nhỏ hơn, giải từng bản sao bằng đệ quy rồi kết hợp các đáp án lại. Thời gian chạy của nó là một hệ thức truy hồi (recurrence) T(n) = a·T(n/b) + f(n), và định lí thợ (master theorem) đọc ra đáp án bằng cách so sánh f(n) với n^(log_b a), số lá của cây đệ quy.',
  summary:
    'Nhập một hệ thức T(n) = a·T(n/b) + f(n), cộng cây đệ quy theo từng tầng, rồi xem trường hợp nào trong ba trường hợp của định lí thợ áp dụng được và tầng nào chiếm ưu thế.',
  instruction:
    'Chọn hệ thức của một thuật toán, hoặc tự đặt a, b và phần việc f(n) = n^d · (log n)^p, rồi chạy từng bước: mỗi tầng của cây được cộng lại, sau đó d được so sánh với c = log_b a. Ở bước kết luận, cây và các thanh chi phí đổi màu để chỉ ra những tầng trội.',
  fields: {
    a: 'a (số bài toán con)',
    b: 'b (hệ số chia)',
    d: 'd (số mũ của n)',
    p: 'p (số mũ của log n)',
    k: 'Độ sâu k',
  },
  /** @param {number} d */
  dOption: (d) => `${d} → ${powText(d)}`,
  /** @param {number} p */
  pOption: (p) => (p === 0 ? '0 → không có' : p < 0 ? '−1 → ÷ log n' : `${p} → ${logText(p)}`),
  presetLabel: 'Thuật toán',
  presetPlaceholder: 'Chọn một hệ thức…',
  presets: {
    binary: 'Tìm kiếm nhị phân: T(n/2) + 1',
    merge: 'Sắp xếp trộn: 2T(n/2) + n',
    karatsuba: 'Karatsuba: 3T(n/2) + n',
    strassen: 'Strassen: 7T(n/2) + n²',
    matrix: 'Nhân ma trận theo khối: 8T(n/2) + n²',
    closest: 'Cặp điểm gần nhất, sắp xếp lại: 2T(n/2) + n log n',
    root: 'Gốc nặng nhất: 2T(n/2) + n²',
    sqrt: 'Chia làm tư: 2T(n/4) + √n',
    gap: 'Ngoài các trường hợp: 2T(n/2) + n / log n',
  },
  /** @param {number} max */
  fieldError: (max) =>
    `Hãy dùng số nguyên với 1 ≤ a ≤ 8, 2 ≤ b ≤ 4 và 1 ≤ k ≤ 6, sao cho cây được vẽ có tối đa ${max} lời gọi. Giá trị hợp lệ gần nhất đã được khôi phục.`,
  recText,
  fText,
  /** @param {Recurrence} r @param {number} n */
  recLine: (r, n) => `T(n) = ${recText(r)}, T(1) = 1; vẽ với n = ${r.b}^${r.k} = ${n}`,
  treeLabel: 'Cây đệ quy: mỗi lời gọi ghi cỡ của nó, bên dưới là f(cỡ)',
  emptyTree: 'Chưa có cây.',
  /** @param {import('$lib/components/tree-layout.js').TreeNode} node @param {number} depth */
  nodeLabel: (node, depth) =>
    `Lời gọi cỡ ${node.label} ở tầng ${depth}, chi phí ${node.note}${node.state ? `, ${vi.states[node.state] ?? node.state}` : ''}`,
  states: /** @type {Record<string, string>} */ ({
    active: 'đang được cộng',
    visited: 'đã cộng',
    sorted: 'trội',
  }),
  markers: /** @type {Record<string, string>} */ ({ active: '∑', visited: '✓', sorted: '★' }),
  legend: {
    active: 'Tầng đang được cộng',
    visited: 'Đã cộng',
    sorted: 'Tầng trội (sau kết luận)',
  },
  barsTitle: 'Chi phí mỗi tầng',
  /** @param {number} depth @param {boolean} leaf */
  barLevel: (depth, leaf) => (leaf ? `Lá (${depth})` : `Tầng ${depth}`),
  barsEmpty: 'Bấm “Bước tiếp” để cộng tầng đầu tiên.',
  totalRow: 'T(n), tổng mọi tầng',
  fmt,
  stats: { n: 'n', c: 'c = log_b a', calls: 'Số lời gọi trong cây', total: 'Tổng đến giờ' },
  /** @param {MasterFrame} f */
  cStat: (f) => (f.c === null ? '?' : cText(f.rec)),
  verdictTitle: 'Kết luận',
  verdictPending: 'Đi đến bước cuối để so sánh f(n) với n^c.',
  /** @param {Recurrence} r @param {MasterCase} v */
  verdictLine(r, v) {
    const theta = thetaText(r, v);
    if (v === 'gap')
      return `Không trường hợp nào áp dụng: f(n) = ${fText(r)} chỉ lệch n^c một thừa số log.`;
    return `Trường hợp ${v}: T(n) = ${theta}`;
  },
  thetaText,
  practiceTitle: 'Tự kiểm tra',
  /** @param {MasterFrame} f */
  describe(f) {
    const r = f.rec;
    const row = f.levels[f.levels.length - 1];
    switch (f.kind) {
      case 'start':
        return `T(n) = ${recText(r)}. Chia: ${r.a} bài toán con cỡ n/${r.b}. Trị: giải từng bài toán con bằng đệ quy. Kết hợp: f(n) = ${fText(r)} là phần việc nằm ngoài các lời gọi đệ quy. Cây được vẽ với n = ${f.n}.`;
      case 'level':
        return `Tầng ${row.depth}: ${row.calls} lời gọi cỡ ${row.size}, mỗi lời gọi tốn f(${row.size}) = ${fmt(row.nodeCost)}, nên cả tầng tốn ${fmt(row.cost)}. Tổng đến giờ: ${fmt(f.total)}.`;
      case 'leaves':
        return `Tầng ${row.depth}: ${row.calls} lá cỡ 1, mỗi lá tốn 1. Có aᵏ = ${r.a}^${r.k} = ${row.calls} lá, và aᵏ = n^(log_b a). T(${f.n}) = ${fmt(f.total)}.`;
      case 'exponent': {
        const exact = cExact(r);
        const value = exact !== null ? `= ${exact}` : `≈ ${/** @type {number} */ (f.c).toFixed(2)}`;
        return `Số mũ tới hạn là c = log${SUB[r.b]} ${r.a} ${value}: riêng aᵏ lá đã tốn n^c = ${leavesText(r)}.`;
      }
      case 'compare': {
        const sign = f.cmp === -1 ? '<' : f.cmp === 0 ? '=' : '>';
        const ratio = `Mỗi tầng tốn khoảng a / b^d = ${fmt(f.ratio)} lần tầng ngay trên nó.`;
        return `f(n) = ${fText(r)} tăng như n^${r.d}${r.p === 0 ? '' : ' nhân với một luỹ thừa của log n'}. So sánh d = ${r.d} với c = ${cText(r)}: d ${sign} c. ${ratio}`;
      }
      case 'verdict': {
        const theta = thetaText(r, /** @type {MasterCase} */ (f.verdict));
        if (f.verdict === 1)
          return `Trường hợp 1: f(n) nhỏ hơn n^c một luỹ thừa của n, nên chi phí các tầng tăng dần về phía lá và các lá chiếm ưu thế. T(n) = ${theta}.`;
        if (f.verdict === 2)
          return r.p === 0
            ? `Trường hợp 2: f(n) khớp với n^c, nên log${SUB[r.b]} n + 1 tầng đều tốn như nhau. T(n) = ${theta}.`
            : `Trường hợp 2: f(n) khớp với n^c, chỉ lệch thừa số ${logText(r.p)}, nên chi phí các tầng chỉ giảm theo thừa số log và cả log${SUB[r.b]} n tầng đều đáng kể. T(n) = ${theta}, nhiều hơn f(n) một thừa số log.`;
        if (f.verdict === 3)
          return `Trường hợp 3: f(n) lớn hơn n^c một luỹ thừa của n, và điều kiện chính quy được thoả: a·f(n/b) ≤ ${fmt(f.ratio)}·f(n)${r.p < 0 ? ' khi n đủ lớn' : ''}, với ${fmt(f.ratio)} < 1. Chi phí các tầng giảm dần, nên gốc chiếm ưu thế. T(n) = ${theta}.`;
        return `d = c, nhưng f(n) = ${fText(r)} chỉ nhỏ hơn n^c một thừa số log n, chứ không phải một luỹ thừa n^ε. Không trường hợp nào trong ba trường hợp áp dụng được. Cộng trực tiếp theo cây được Θ(${r.d === 0 ? 'log log n' : `${powText(r.d)} log log n`}).`;
      }
      case 'done': {
        const theta = thetaText(r, /** @type {MasterCase} */ (f.verdict));
        if (f.verdict === 1) return `T(n) = ${theta}. Tầng được gắn sao là tầng lá.`;
        if (f.verdict === 2)
          return `T(n) = ${theta}. Tầng nào cũng được gắn sao: mọi tầng đều đáng kể.`;
        if (f.verdict === 3) return `T(n) = ${theta}. Tầng được gắn sao là gốc.`;
        return 'Không tầng nào được gắn sao: không có tầng nào chiếm ưu thế, và định lí thợ không kết luận được.';
      }
    }
  },
  takeaways: [
    'Chia để trị có ba bước: chia đầu vào thành a phần cỡ n/b, trị từng phần bằng đệ quy, rồi kết hợp các đáp án. f(n) là phần việc chia và kết hợp của một lời gọi.',
    'Tầng i của cây đệ quy có aⁱ lời gọi cỡ n/bⁱ, nên mỗi tầng tốn khoảng a / b^d lần tầng ngay trên nó. Cây có log_b n tầng và aᵏ = n^(log_b a) lá.',
    'Đặt c = log_b a. Trường hợp 1: f(n) tăng chậm hơn n^c một luỹ thừa của n, nên các lá thắng, Θ(n^c). Trường hợp 2: f(n) = Θ(n^c (log n)^p) với p ≥ 0, nên tầng nào cũng đáng kể, Θ(n^c (log n)^(p+1)). Trường hợp 3: f(n) tăng nhanh hơn một luỹ thừa của n và a·f(n/b) ≤ r·f(n) với một r < 1 nào đó, nên gốc thắng, Θ(f(n)).',
    'Giữa các trường hợp có khe hở: 2T(n/2) + n / log n có d = c nhưng f(n) chỉ nhỏ hơn một thừa số log, nên không trường hợp nào áp dụng (cộng theo cây được Θ(n log log n)).',
    'Thử Karatsuba, rồi đặt a = 4: kết luận đổi từ Θ(n^1.58) thành Θ(n²), vì chỉ thêm một bài toán con đã làm đổi số mũ của lá.',
  ],
  complexityHead: ['Trường hợp', 'T(n)', 'Vì sao'],
  complexity: [
    [
      '1: f(n) = O(n^(c − ε))',
      'Θ(n^c)',
      'Chi phí mỗi tầng tăng a / b^d > 1 lần, nên n^c lá chiếm ưu thế.',
    ],
    [
      '2: f(n) = Θ(n^c (log n)^p), p ≥ 0',
      'Θ(n^c (log n)^(p+1))',
      'log_b n + 1 tầng, mỗi tầng tốn khoảng f(n).',
    ],
    [
      '3: f(n) = Ω(n^(c + ε)), chính quy',
      'Θ(f(n))',
      'Chi phí mỗi tầng giảm a / b^d < 1 lần: một cấp số nhân do gốc dẫn đầu.',
    ],
    ['Độ sâu đệ quy', 'log_b n tầng', 'Qua mỗi tầng, kích thước giảm đi b lần.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt: 'Giải T(n) = 4T(n/2) + n bằng định lí thợ. Viết T(n) dưới dạng Θ(…).',
      accept: ['Θ(n^2)', 'Theta(n^2)', 'n^2', 'Θ(n*n)', 'Θ(n²)', 'n²'],
      hints: [
        'c = log₂ 4. So sánh nó với số mũ của f(n) = n.',
        'c = 2 > 1, nên đây là trường hợp 1: các lá chiếm ưu thế.',
      ],
      solution:
        'a = 4, b = 2, nên c = log₂ 4 = 2. f(n) = n = O(n^(2 − ε)), đúng trường hợp 1: T(n) = Θ(n^c) = Θ(n²).',
    },
    {
      type: 'choice',
      prompt: 'Định lí thợ cho kết quả gì với T(n) = 2T(n/2) + n log n?',
      options: [
        'Trường hợp 1: Θ(n)',
        'Trường hợp 2: Θ(n log² n)',
        'Trường hợp 3: Θ(n log n)',
        'Không trường hợp nào áp dụng',
      ],
      answer: 1,
      hints: [
        'c = log₂ 2 = 1, và f(n) = n · (log n)¹.',
        'd = c với p = 1 ≥ 0 là trường hợp 2, thêm đúng một thừa số log.',
      ],
      solution:
        'c = 1 và f(n) = Θ(n^1 · (log n)^1), nên trường hợp 2 với p = 1 cho Θ(n (log n)²). Tầng i tốn n · log(n/2ⁱ), và log n tầng cộng lại được khoảng n log² n / 2. Đây không phải trường hợp 3: n log n chỉ lớn hơn n một thừa số log, không phải một luỹ thừa n^ε.',
    },
    {
      type: 'number',
      prompt:
        'Với T(n) = 3T(n/4) + n², tìm hằng số r sao cho a·f(n/b) = r·f(n), tức phép kiểm tra tính chính quy của trường hợp 3.',
      answer: 0.1875,
      tolerance: 0.0001,
      hints: ['a·f(n/b) = 3·(n/4)².', '3·n²/16 = (3/16)·n².'],
      solution:
        'a·f(n/b) = 3(n/4)² = (3/16)n², nên r = 3/16 = 0.1875 < 1. Điều kiện chính quy được thoả và T(n) = Θ(n²).',
    },
    {
      type: 'choice',
      prompt: 'Hệ thức nào nằm ngoài cả ba trường hợp của định lí thợ?',
      options: [
        'T(n) = 9T(n/3) + n',
        'T(n) = T(n/2) + 1',
        'T(n) = 2T(n/2) + n / log n',
        'T(n) = 2T(n/2) + n²',
      ],
      answer: 2,
      hints: [
        'Tính c = log_b a cho từng hệ thức rồi so sánh với f(n).',
        'Với 2T(n/2) + n / log n, c = 1 và f(n) chỉ nhỏ hơn n một thừa số log.',
      ],
      solution:
        '9T(n/3) + n thuộc trường hợp 1 (Θ(n²)), T(n/2) + 1 thuộc trường hợp 2 (Θ(log n)), còn 2T(n/2) + n² thuộc trường hợp 3 (Θ(n²)). Với 2T(n/2) + n / log n, f(n) không phải O(n^(1 − ε)) với bất kì ε > 0 nào, cũng không phải Θ(n (log n)^p) với p ≥ 0, nên không trường hợp nào áp dụng. Cộng theo cây được Θ(n log log n).',
    },
    {
      type: 'number',
      prompt: 'Hệ thức của Strassen là T(n) = 7T(n/2) + n². Với n = 8, cây của nó có bao nhiêu lá?',
      answer: 343,
      unit: 'lá',
      hints: ['n = 8 = 2³, nên cây có 3 tầng chia.', 'Mỗi lần chia, số lời gọi nhân lên 7 lần.'],
      solution:
        'Số lá là aᵏ = 7³ = 343 lời gọi, bằng n^(log₂ 7) = 8^2.807… = 343. Vì log₂ 7 ≈ 2.81 > 2, các lá chiếm ưu thế: Θ(n^2.81).',
    },
  ],
  nextTeaser:
    'Bài sau dùng ngay hệ thức 2T(n/2) + n của sắp xếp trộn để đếm nghịch thế: đếm xem một mảng còn cách thứ tự đã sắp xếp bao xa.',
};
