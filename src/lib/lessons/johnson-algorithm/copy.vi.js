/** @typedef {import('$lib/algo-engine/johnson-algorithm.js').JohnsonFrame} JohnsonFrame */

/** @param {number | null} d */
const show = (d) => (d === null ? '—' : d === Infinity ? '∞' : String(d).replace('-', '−'));

/** A summand: a negative number goes in brackets, as in 1 + (−2). @param {number} d */
const term = (d) => (d < 0 ? `(${show(d)})` : show(d));

export const vi = {
  slug: 'johnson-algorithm',
  topic: 'shortest-paths',
  level: 'Nâng cao',
  title: 'Thuật toán Johnson',
  intro:
    'Thuật toán Johnson tìm đường đi ngắn nhất giữa mọi cặp đỉnh trên một đồ thị thưa có thể có trọng số cạnh âm. Một lần chạy thuật toán Bellman-Ford tính thế năng h(v) cho mọi đỉnh; đổi trọng số từng cạnh thành w′(u, v) = w(u, v) + h(u) − h(v) làm mọi trọng số không âm mà không đổi đường đi nào là ngắn nhất. Sau đó thuật toán Dijkstra chạy được từ mọi đỉnh, nhanh hơn O(V³) của thuật toán Floyd-Warshall khi đồ thị có ít cạnh.',
  summary:
    'Xem thuật toán Johnson biến trọng số cạnh âm thành không âm nhờ thế năng tính bằng thuật toán Bellman-Ford, rồi chạy thuật toán Dijkstra từ mọi đỉnh.',
  instruction:
    'Chạy từng bước qua ba giai đoạn: thuật toán Bellman-Ford từ đỉnh phụ q điền các thế năng h, mỗi cạnh nhận trọng số mới w′, rồi thuật toán Dijkstra chạy một lần cho mỗi đỉnh nguồn và điền một hàng của ma trận. Chuyển “Trọng số hiển thị” sang w′ để xem đồ thị đã đổi trọng số; sửa trọng số trong bảng cạnh hoặc vẽ cạnh ở chế độ xem w.',
  presetLabel: 'Đồ thị',
  presets: {
    negative: 'Có cạnh âm, không có chu trình âm',
    cycle: 'Chu trình âm',
    positive: 'Không có cạnh âm',
  },
  viewLabel: 'Trọng số hiển thị',
  views: { w: 'w (ban đầu)', wp: 'w′ (đã đổi)' },
  resetGraph: 'Đặt lại đồ thị',
  graphAria: 'Đồ thị có hướng có trọng số; trọng số có thể âm.',
  graphAriaReweighted:
    'Cùng đồ thị đó với trọng số đã đổi w′. Các cạnh chưa đổi trọng số thì không hiện trọng số.',
  edgesTitle: 'Các cạnh: w′ = w + h(u) − h(v)',
  edgeHead: ['Cạnh u → v', 'w', 'h(u)', 'h(v)', 'w′'],
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
  /** @param {number} max */
  badWeight: (max) =>
    `Trọng số phải là số nguyên từ −${max} đến ${max}. Trọng số cũ được giữ nguyên.`,
  potentialsTitle: 'Thế năng h(v) = khoảng cách từ q',
  /** @param {string} name @param {number} h */
  potentialChip: (name, h) => `h(${name}) = ${show(h)}`,
  potentialsEmpty: 'chưa tính',
  hotLabel: 'vừa đổi',
  cycleTitle: 'Chu trình âm',
  matrixTitle: 'Khoảng cách d(s, t): hàng = từ s, cột = đến t',
  matrixAria:
    'Ma trận khoảng cách giữa mọi cặp đỉnh. Hàng s được điền khi lần chạy Dijkstra từ s kết thúc; ∞ nghĩa là từ s không đến được t.',
  /** @param {string} from @param {string} to @param {string} value @param {string} state */
  cellLabel: (from, to, value, state) =>
    [`Từ ${from} đến ${to}: ${value}`, state].filter(Boolean).join(', '),
  stats: {
    phase: 'Giai đoạn',
    bfChecks: 'Số lần xét cạnh của Bellman-Ford',
    dijkstraChecks: 'Số lần xét cạnh của Dijkstra',
  },
  phases: {
    start: 'Thêm q',
    bf: '1. Bellman-Ford từ q',
    reweight: '2. Đổi trọng số cạnh',
    /** @param {string} s */
    dijkstra: (s) => `3. Dijkstra từ ${s}`,
    cycle: 'Đã dừng: chu trình âm',
    done: 'Xong',
  },
  legend: {
    source: 'Đỉnh nguồn của Dijkstra',
    tail: 'u, đang được đọc',
    write: 'v, nhãn vừa giảm',
    settled: 'Đã chốt trong lần chạy Dijkstra này',
    cycle: 'Trên chu trình âm',
    edgeNow: 'Cạnh đang dùng',
    tree: 'Cạnh nối với cha trong Dijkstra',
    row: 'Hàng vừa điền',
  },
  states: {
    source: 'đỉnh nguồn của Dijkstra',
    tail: 'đang được đọc',
    write: 'nhãn vừa giảm',
    settled: 'đã chốt',
    cycle: 'trên chu trình âm',
    row: 'vừa điền',
  },
  /** @param {number} h */
  hNote: (h) => `h ${show(h)}`,
  /** @param {number} d */
  dNote: (d) => `d′ ${show(d)}`,
  show,
  /** @param {string} name @param {string} note @param {string} state */
  vertexLabel: (name, note, state) => [`Đỉnh ${name}`, note, state].filter(Boolean).join(', '),
  /**
   * @param {JohnsonFrame} f
   * @param {string[]} names
   * @param {number[]} weights  Original weight per input edge.
   */
  describe(f, names, weights) {
    const u = names[f.current] ?? '';
    const v = names[f.neighbor] ?? '';
    const s = names[f.source] ?? '';
    const w = weights[f.edge] ?? 0;
    switch (f.kind) {
      case 'start':
        return names.length
          ? `Thêm một đỉnh mới q, nối đến mỗi đỉnh trong ${names.length} đỉnh bằng một cạnh trọng số 0. Giờ từ q đến được mọi đỉnh.`
          : 'Đồ thị đang trống: hãy thêm một đỉnh để bắt đầu.';
      case 'bf-round':
        return `Bellman-Ford, vòng ${f.round}: nới lỏng các cạnh của q, rồi mọi cạnh của đồ thị theo thứ tự trong danh sách.`;
      case 'bf-q':
        return 'Nới lỏng q → v với trọng số 0 đặt mọi h bằng 0. Các cạnh âm vẫn có thể kéo một số h xuống thấp hơn.';
      case 'bf-lower':
        return `Cạnh ${u} → ${v} (trọng số ${show(w)}): h(${u}) + ${term(w)} = ${show(f.h[f.current])} + ${term(w)} = ${show(f.h[f.neighbor])} < ${show(f.before)}, nên giảm h(${v}) xuống ${show(f.h[f.neighbor])}.`;
      case 'bf-early':
        return `Vòng ${f.round} không đổi gì, nên các thế năng đã là cuối cùng: h(v) là khoảng cách ngắn nhất từ q đến v, không bao giờ lớn hơn 0.`;
      case 'bf-check':
        return 'Thuật toán Bellman-Ford đã chạy đủ số vòng mà vòng cuối vẫn đổi một nhãn. Thêm một lượt nữa để kiểm tra chu trình âm.';
      case 'cycle': {
        const loop = f.cycle.map((i) => names[i]).join(' → ');
        return `Cạnh ${u} → ${v} vẫn còn nới lỏng được, nên đồ thị có chu trình âm: ${loop} → ${names[f.cycle[0]] ?? ''}. Đường đi ngắn nhất qua nó không tồn tại, và thuật toán Johnson dừng ở đây.`;
      }
      case 'reweight': {
        const hu = f.h[f.current];
        const hv = f.h[f.neighbor];
        const wp = f.reweighted[f.edge] ?? 0;
        return `Cạnh ${u} → ${v}: w′ = ${show(w)} + ${term(hu)} − ${term(hv)} = ${show(wp)}. Nó ≥ 0 vì h(${v}) ≤ h(${u}) + w.`;
      }
      case 'dij-start':
        return `Dijkstra từ ${s} trên đồ thị đã đổi trọng số: d′(${s}) = 0, mọi d′ khác = ∞. Mọi w′ đều ≥ 0, nên dùng thuật toán Dijkstra là an toàn.`;
      case 'settle':
        return `Chốt ${u} với d′ = ${show(f.dPrime[f.current])}: không đỉnh chưa chốt nào có nhãn nhỏ hơn.`;
      case 'lower': {
        const wp = f.reweighted[f.edge] ?? 0;
        return `Cạnh ${u} → ${v} (w′ = ${show(wp)}): ${show(f.dPrime[f.current])} + ${show(wp)} = ${show(f.dPrime[f.neighbor])} < ${show(f.before)}, nên giảm d′(${v}).`;
      }
      case 'row': {
        const t = f.matrix[f.source].findIndex((x, i) => i !== f.source && x !== Infinity);
        if (t < 0)
          return `Dijkstra từ ${s} đã xong, nhưng từ ${s} không đến được đỉnh nào khác. Hàng ${s} là 0 trên đường chéo và ∞ ở các ô còn lại.`;
        const T = names[t];
        return `Dijkstra từ ${s} đã xong. Bỏ phần dịch chuyển cho từng đỉnh đích, chẳng hạn d(${s}, ${T}) = d′(${T}) − h(${s}) + h(${T}) = ${show(f.dPrime[t])} − ${term(f.h[f.source])} + ${term(f.h[t])} = ${show(f.matrix[f.source][t])}.`;
      }
      case 'done':
        return f.cycle.length
          ? 'Đã dừng: khi có chu trình âm thì không có kết quả cho mọi cặp đỉnh.'
          : `Xong: ${f.matrix.length} lần chạy Dijkstra đã điền kín ma trận sau chỉ một lần chạy Bellman-Ford.`;
    }
  },
  takeaways: [
    'Đổi trọng số bằng thế năng: w′(u, v) = w(u, v) + h(u) − h(v). Dọc một đường đi s → … → t, các số hạng h triệt tiêu từng cặp, nên mọi đường đi từ s đến t đều thay đổi cùng một lượng h(s) − h(t), và đường ngắn nhất vẫn ngắn nhất.',
    'Cộng một hằng số vào mọi cạnh thì không được: cách đó phạt các đường đi nhiều cạnh. Thế năng dịch chuyển cả đường đi chứ không phải từng cạnh riêng lẻ.',
    'h có được từ một lần chạy thuật toán Bellman-Ford từ đỉnh mới q, nối với mọi đỉnh bằng cạnh trọng số 0. Bất đẳng thức tam giác h(v) ≤ h(u) + w(u, v) chính là w′ ≥ 0. Nếu thuật toán Bellman-Ford tìm thấy chu trình âm thì không có kết quả và thuật toán dừng.',
    'Bellman-Ford rồi Dijkstra: O(V·E) một lần, cộng V lần chạy Dijkstra, mỗi lần O(E log V). Trên đồ thị thưa, tổng cộng khoảng O(V² log V), thấp hơn hẳn O(V³) của thuật toán Floyd-Warshall.',
    'Thử xem: chọn “Không có cạnh âm” để thấy mọi h đều bằng 0 và w′ = w, rồi đặt D → C bằng −6 và xem thuật toán Bellman-Ford dừng lần chạy ở một chu trình âm.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Bellman-Ford từ q',
      'O(V·E)',
      'Tối đa V vòng trên E + V cạnh: các cạnh của đồ thị cộng các cạnh của q.',
    ],
    ['Đổi trọng số', 'O(E)', 'Mỗi cạnh một phép cộng và một phép trừ.'],
    [
      'V lần chạy Dijkstra',
      'O(V·E log V)',
      'Mỗi lần chạy tốn O((V + E) log V) với heap nhị phân; O(V² log V + V·E) với heap Fibonacci.',
    ],
    [
      'Tổng trên đồ thị thưa (E ≈ V)',
      'O(V² log V)',
      'Tốt hơn O(V³) của thuật toán Floyd-Warshall; trên đồ thị dày (E ≈ V²), thuật toán Floyd-Warshall đơn giản hơn mà nhanh không kém.',
    ],
    ['Bộ nhớ', 'O(V²)', 'Ma trận kết quả; bản thân thuật toán chỉ cần O(V + E).'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với “Có cạnh âm, không có chu trình âm”, chạy từng bước đến khi các thế năng là cuối cùng. h(C) bằng bao nhiêu?',
      answer: -5,
      tolerance: 0,
      hints: [
        'h(C) là khoảng cách ngắn nhất từ q đến C. Mọi đường đi từ q đều bắt đầu bằng một cạnh trọng số 0.',
        'Thử q → D → C.',
      ],
      solution: 'q → D tốn 0 và D → C tốn −5, nên h(C) = −5. Không đường nào từ q đến C rẻ hơn.',
    },
    {
      type: 'number',
      prompt: 'Trên cùng đồ thị đó, trọng số đã đổi w′ của cạnh A → C (w = 8) là bao nhiêu?',
      answer: 13,
      tolerance: 0,
      hints: ['w′ = w + h(A) − h(C), và h(A) = 0.'],
      solution:
        'w′ = 8 + 0 − (−5) = 13. Bảng hiện giá trị này khi giai đoạn đổi trọng số đến cạnh A → C.',
    },
    {
      type: 'number',
      prompt:
        'Dijkstra từ B tìm được d′(C) = 0 trên đồ thị đã đổi trọng số. Khoảng cách thật d(B, C) là bao nhiêu?',
      answer: -4,
      tolerance: 0,
      hints: ['d(B, C) = d′(C) − h(B) + h(C), với h(B) = −1 và h(C) = −5.'],
      solution: 'd(B, C) = 0 − (−1) + (−5) = −4, chính là đường đi B → D → C: 1 + (−5) = −4.',
    },
    {
      type: 'choice',
      prompt:
        'Sao không cộng 5 vào mọi cạnh để trọng số nhỏ nhất là −5 thành 0, rồi chạy thuật toán Dijkstra?',
      options: [
        'Vì như vậy thuật toán Dijkstra chạy chậm hơn.',
        'Một đường đi k cạnh bị cộng thêm 5k, nên đường nhiều cạnh bị phạt và đường đi ngắn nhất có thể thay đổi.',
        'Vì thuật toán Dijkstra không xử lí được trọng số đúng bằng 0.',
        'Cách đó đúng, và thuật toán Johnson làm chính xác như vậy.',
      ],
      answer: 1,
      hints: ['So sánh một đường đi một cạnh với một đường đi ba cạnh giữa cùng hai đỉnh.'],
      solution:
        'Dịch một hằng số cộng thêm 5 cho mỗi cạnh, nên nó ưu tiên đường ít cạnh. Thế năng cộng h(s) − h(t) vào mọi đường đi từ s đến t, bất kể dài bao nhiêu, nên thứ tự các đường đi được giữ nguyên.',
    },
  ],
  nextTeaser:
    'Khi chỉ cần đường đến một đích, ta có thể đoán hướng để mở rộng ít ô hơn. Bài sau là tìm kiếm A*, thuật toán Dijkstra có thêm hàm ước lượng.',
};
