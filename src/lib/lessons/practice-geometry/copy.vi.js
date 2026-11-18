/** @typedef {import('$lib/algo-engine/practice-geometry.js').GeoFrame} GeoFrame */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');
/** @param {number} v */
const dec = (v) => {
  const rounded = Math.round(v * 100) / 100;
  return `${Math.abs(rounded - v) > 1e-9 ? '≈ ' : ''}${rounded}`;
};
export const vi = {
  slug: 'practice-geometry',
  topic: 'geometry',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán hình học',
  intro:
    'Mã hình học thường sai theo hai kiểu: một phép so sánh bị làm tròn sai hướng, và một bài toán giải bằng vét cạn trong khi bao lồi đã đủ. Sa bàn này chạy ba bài toán kinh điển trên các điểm em đặt. Trước mỗi bước, hãy dự đoán số nguyên chính xác mà bước đó tính ra; nút “Kiểm tra” chỉ cho đi tiếp khi em trả lời đúng.',
  summary:
    'Đặt các điểm rồi dự đoán chính xác tích có hướng, tổng dây giày và bình phương khoảng cách trong ba bài toán về bao lồi và hướng quay, kiểm tra từng bước.',
  instruction:
    'Chọn một bài toán, rồi kéo các điểm, nhấn vào chỗ trống để thêm điểm, hoặc chọn một ví dụ. Ở mỗi bước, nhập giá trị vào ô “Đến lượt em” rồi nhấn “Kiểm tra”, hoặc nhấn “Bước tiếp” để xem đáp án. Sau đó dùng sa bàn để trả lời các câu hỏi bên dưới.',
  puzzleLabel: 'Bài toán',
  puzzles: {
    side: 'Điểm nằm phía nào của đường thẳng AB?',
    fence: 'Diện tích bên trong hàng rào ngắn nhất',
    diameter: 'Cặp điểm xa nhau nhất',
  },
  presetLabel: 'Ví dụ',
  presets: {
    field: 'Cánh đồng',
    square: 'Hình vuông có điểm bên trong',
    triangle: 'Tam giác',
  },
  random: 'Ngẫu nhiên',
  fields: { x: 'x', y: 'y' },
  addPoint: 'Thêm điểm',
  removePoint: 'Xoá điểm đang chọn',
  /** @param {string} name @param {number} x @param {number} y @param {string} role */
  pointLabel: (name, x, y, role) => `Điểm ${name} ở (${x}, ${y})${role ? `, ${role}` : ''}`,
  planeLabel:
    'Các điểm trên mặt phẳng toạ độ. Phím mũi tên chuyển giữa các điểm; Shift + mũi tên dời một điểm, Enter chọn một điểm và Delete xoá điểm đó.',
  /** @param {number} xMax @param {number} yMax */
  coordError: (xMax, yMax) => `x phải là số nguyên từ 0 đến ${xMax}, còn y từ 0 đến ${yMax}.`,
  /** @param {number} max */
  fullError: (max) => `Chỉ dùng nhiều nhất ${max} điểm.`,
  /** @param {number} min */
  minError: (min) => `Cần giữ lại ít nhất ${min} điểm.`,
  occupiedError: 'Ở đó đã có một điểm.',
  selectFirst: 'Hãy chọn một điểm trước: nhấn vào nó, hoặc chọn nó bằng bàn phím rồi nhấn Enter.',
  roles: {
    lineEnd: 'một đầu của đường thẳng AB',
    current: 'đang kiểm tra',
    left: 'bên trái A → B',
    right: 'bên phải A → B',
    on: 'trên đường thẳng AB',
    corner: 'một đỉnh của bao lồi',
    pair: 'thuộc cặp đang so sánh',
    best: 'thuộc cặp xa nhất cho tới giờ',
  },
  notes: { left: 'T', right: 'P', on: '0' },
  legend: {
    side: [
      ['active', 'A và B: đường thẳng A → B'],
      ['compare', 'p, điểm đang kiểm tra'],
      ['frontier', 'T: bên trái, tích có hướng > 0'],
      ['visited', 'P: bên phải, tích có hướng < 0'],
      ['path', '0: trên đường thẳng, tích có hướng = 0'],
    ],
    fence: [
      ['sorted', 'Các đỉnh của bao lồi và hàng rào'],
      ['compare', 'Cạnh đang cộng'],
    ],
    diameter: [
      ['sorted', 'Các đỉnh của bao lồi'],
      ['compare', 'Cặp đang so sánh'],
      ['path', 'Cặp xa nhất cho tới giờ'],
    ],
  },
  /** @param {number} d2 */
  bestLabel: (d2) => `d² = ${d2}`,
  askTitle: 'Đến lượt em',
  askLabels: {
    side: 'cross(B − A, p − A)',
    fence: 'twice sau cạnh này',
    diameter: 'd² của cặp này',
  },
  askCheck: 'Kiểm tra',
  askIdle: 'Bước này không có gì cần tính. Nhấn “Bước tiếp”.',
  askDone: 'Đã xong. Hãy dời một điểm hoặc chọn bài toán khác.',
  askEmpty: 'Hãy nhập một số nguyên trước đã.',
  /** @param {number} value */
  askRight: (value) => `Đúng rồi: ${num(value)}.`,
  /** @param {GeoFrame} f @param {(id: number) => string} name */
  askWrong(f, name) {
    if (f.puzzle === 'side')
      return 'Chưa đúng. Với u = B − A và v = p − A, hãy tính u.x · v.y − u.y · v.x.';
    const [p, q] = /** @type {[number, number]} */ (f.edge);
    if (f.puzzle === 'fence')
      return `Chưa đúng. Cộng x${name(p)} · y${name(q)} − x${name(q)} · y${name(p)} vào twice = ${num(f.twice)}.`;
    return `Chưa đúng. Bình phương hiệu hoành độ và hiệu tung độ của ${name(p)} và ${name(q)}, rồi cộng lại.`;
  },
  listTitles: {
    left: 'Bên trái (T)',
    right: 'Bên phải (P)',
    on: 'Trên đường thẳng (0)',
    hull: 'Các đỉnh của bao lồi',
  },
  listEmpty: 'chưa có',
  stats: {
    left: 'Bên trái',
    right: 'Bên phải',
    on: 'Trên đường thẳng',
    corners: 'Số đỉnh của bao lồi',
    twice: 'Hai lần diện tích',
    area: 'Diện tích',
    perimeter: 'Chiều dài hàng rào',
    best: 'd² lớn nhất',
    distance: 'Khoảng cách √d²',
    pairs: 'Số cặp đã so sánh',
    brute: 'Số cặp khi vét cạn',
    correct: 'Số câu em trả lời đúng',
    wrong: 'Số câu em trả lời sai',
  },
  pending: '…',
  /**
   * @param {GeoFrame} f
   * @param {(id: number) => string} name
   */
  describe(f, name) {
    const pt = (/** @type {number} */ id) => {
      const p = /** @type {{x: number, y: number}} */ (f.points.find((q) => q.id === id));
      return `${name(id)} (${p.x}, ${p.y})`;
    };
    switch (f.kind) {
      case 'start':
        if (f.puzzle === 'side') {
          const [a, b] = /** @type {[number, number]} */ (f.line);
          return `Đường thẳng A → B đi từ ${pt(a)} đến ${pt(b)}. Phân loại ${f.brute} điểm còn lại theo dấu của một tích có hướng chính xác.`;
        }
        return f.puzzle === 'fence'
          ? `Hàng rào ngắn nhất quanh ${f.points.length} điểm chính là bao lồi của chúng. Tìm diện tích mà nó bao quanh.`
          : `Tìm hai điểm xa nhau nhất trong ${f.points.length} điểm. Vét cạn phải so sánh cả ${f.brute} cặp.`;
      case 'read':
        return `p = ${pt(/** @type {number} */ (f.current))}. cross(B − A, p − A) bằng bao nhiêu?`;
      case 'classify': {
        const c = /** @type {number} */ (f.value);
        const p = name(/** @type {number} */ (f.current));
        if (c === 0)
          return `cross = 0 đúng tuyệt đối, nên ${p} nằm trên đường thẳng. Với số nguyên, số 0 này là chính xác; với số thực dấu phẩy động, nó có thể ra một giá trị ± rất nhỏ.`;
        return `cross = ${num(c)} ${c > 0 ? '> 0' : '< 0'}, nên ${p} nằm ${c > 0 ? 'bên trái' : 'bên phải'} A → B.`;
      }
      case 'hull':
        return f.puzzle === 'fence'
          ? `Bao lồi có ${/** @type {number[]} */ (f.hull).length} đỉnh: ${/** @type {number[]} */ (f.hull).map(name).join(', ')}. Các điểm bên trong không bao giờ chạm hàng rào.`
          : `Hai điểm xa nhau nhất luôn là đỉnh của bao lồi, nên chỉ cần so sánh ${/** @type {number[]} */ (f.hull).length} đỉnh đó.`;
      case 'edge': {
        const [p, q] = /** @type {[number, number]} */ (f.edge);
        return `Cạnh ${pt(p)} → ${pt(q)}. Số hạng dây giày của nó là x${name(p)} · y${name(q)} − x${name(q)} · y${name(p)}. Giờ twice bằng bao nhiêu?`;
      }
      case 'add':
        return `Số hạng bằng ${num(/** @type {number} */ (f.value))}, nên twice = ${num(f.twice)}. Đến giờ hàng rào dài ${dec(f.perimeter)}.`;
      case 'pair': {
        const [p, q] = /** @type {[number, number]} */ (f.edge);
        return `So sánh ${pt(p)} và ${pt(q)}. Bình phương khoảng cách d² của chúng bằng bao nhiêu?`;
      }
      case 'compare': {
        const [p, q] = /** @type {[number, number]} */ (f.edge);
        const d = /** @type {number} */ (f.value);
        const isBest = f.bestPair && f.bestPair[0] === p && f.bestPair[1] === q;
        return isBest
          ? `d² = ${d} lớn nhất cho tới giờ: ${name(p)} và ${name(q)} là cặp xa nhất mới.`
          : `d² = ${d} không lớn hơn ${f.best}, nên cặp xa nhất giữ nguyên.`;
      }
      case 'done':
        if (f.puzzle === 'side')
          return `${f.sides.left.length} điểm bên trái, ${f.sides.right.length} điểm bên phải và ${f.sides.on.length} điểm trên đường thẳng, sau ${f.steps} phép kiểm tra chính xác.`;
        if (f.puzzle === 'fence')
          return `twice = ${num(f.twice)}, nên diện tích là ${dec(f.twice / 2)}, bên trong một hàng rào dài ${dec(f.perimeter)}. Chỉ chia đôi ở bước cuối giúp mọi bước đều chính xác.`;
        if (!f.bestPair) return 'Chưa đủ hai điểm: không có cặp nào để so sánh.';
        return `Cặp xa nhất là ${name(f.bestPair[0])} và ${name(f.bestPair[1])}: d² = ${f.best}, khoảng cách ${dec(Math.sqrt(f.best))}. Căn bậc hai chỉ lấy một lần, ở cuối, sau ${f.steps} cặp thay vì ${f.brute}.`;
    }
  },
  takeaways: [
    'Với toạ độ nguyên, tích có hướng, số hạng dây giày và bình phương khoảng cách cũng là số nguyên, nên mọi phép so sánh đều chính xác. Hãy so sánh chúng với 0 hoặc với nhau, đừng đi qua phép chia, góc hay căn bậc hai.',
    'Tích có hướng đúng bằng 0 nghĩa là thẳng hàng. Đầu vào là số thực dấu phẩy động thì cần một epsilon, và khi đó “trên đường thẳng” trở thành chuyện ước lượng; số nguyên tránh được điều này.',
    'Bao lồi trả lời được nhiều câu hỏi: hàng rào ngắn nhất quanh các điểm, diện tích lớn nhất chúng bao được, và cặp điểm xa nhau nhất, luôn là hai đỉnh của bao lồi.',
    'So sánh d² thay vì d cho cùng một thứ tự, vì phép bình phương đồng biến với khoảng cách ≥ 0. Chỉ lấy căn bậc hai một lần ở cuối, để hiển thị.',
    'Chọn “Cánh đồng” trong bài cặp điểm xa nhất và so sánh số cặp đã kiểm tra với số cặp khi vét cạn. Sau đó kéo một điểm bên trong ra ngoài bao lồi: số cặp được so sánh thay đổi theo số đỉnh mới của bao, còn số cặp khi vét cạn giữ nguyên.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Điểm nằm phía nào của đường thẳng',
      'Thời gian O(n)',
      'Mỗi điểm một tích có hướng chính xác.',
    ],
    [
      'Diện tích bên trong hàng rào',
      'Thời gian O(n log n)',
      'Dựng bao lồi tốn O(n log n); tổng dây giày trên h đỉnh của bao tốn O(h).',
    ],
    [
      'Cặp xa nhất, chỉ xét các đỉnh',
      'Thời gian O(n log n + h²)',
      'Dựng bao lồi, rồi so sánh cả h(h − 1)/2 cặp đỉnh. Kĩ thuật thước cặp xoay (rotating calipers) đưa chi phí này về O(n log n).',
    ],
    ['Cặp xa nhất, vét cạn', 'Thời gian O(n²)', 'So sánh cả n(n − 1)/2 cặp.'],
    ['Bộ nhớ', 'O(n)', 'Các điểm, bao lồi và vài tổng đang cộng dồn.'],
  ],
  nextTeaser:
    'Bài sau chuyển sang đồ thị: mạng luồng và thuật toán Ford-Fulkerson, tìm lượng hàng lớn nhất có thể chuyển qua một mạng lưới.',
  practiceTitle: 'Giải bằng sa bàn',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chọn ví dụ “Cánh đồng” và bài toán “Điểm nằm phía nào của đường thẳng AB?”. Ngoài A và B, có bao nhiêu điểm nằm đúng trên đường thẳng?',
      answer: 2,
      unit: 'điểm',
      hints: [
        'Đi từng bước, hoặc nhấn “Đến bước cuối” rồi đọc ô “Trên đường thẳng”.',
        'Một điểm nằm trên đường thẳng khi tích có hướng của nó đúng bằng 0.',
      ],
      solution:
        'D (5, 3) và G (9, 5) đều cho cross = 0: với B − A = (10, 5), D − A = (4, 2) cho 10 · 2 − 5 · 4 = 0, còn G − A = (8, 4) cho 10 · 4 − 5 · 8 = 0.',
    },
    {
      type: 'number',
      prompt:
        'Vẫn với “Cánh đồng” và đường thẳng AB, cross(B − A, C − A) với C ở (2, 5) bằng bao nhiêu?',
      answer: 35,
      hints: ['B − A = (10, 5) và C − A = (1, 4).', 'Tính 10 · 4 − 5 · 1.'],
      solution:
        'B − A = (10, 5), C − A = (1, 4), nên cross = 10 · 4 − 5 · 1 = 35 > 0: C nằm bên trái A → B.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Cánh đồng” và bài toán “Diện tích bên trong hàng rào ngắn nhất”. Hàng rào bao quanh diện tích bằng bao nhiêu?',
      answer: 46.5,
      unit: 'đơn vị diện tích',
      hints: ['Bước cuối cho thấy hai lần diện tích.', 'twice = 93, sau đó mới chia cho 2.'],
      solution:
        'Bao lồi là A, E, H, B, F, C. Các số hạng dây giày của nó là −7, 6, 38, 53, 6 và −3, cộng lại được twice = 93, nên diện tích là 46.5.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Cánh đồng” và bài toán “Cặp điểm xa nhau nhất”. Bình phương khoảng cách d² lớn nhất bằng bao nhiêu?',
      answer: 125,
      hints: ['Cặp xa nhất là hai đỉnh của bao lồi.', 'Thử A (1, 1) và B (11, 6).'],
      solution:
        'A và B cách nhau 10 theo x và 5 theo y: d² = 100 + 25 = 125, và không cặp đỉnh nào khác lớn hơn. Khoảng cách là √125 ≈ 11.18.',
    },
    {
      type: 'number',
      prompt:
        'Trong cùng lần chạy tìm cặp xa nhất trên “Cánh đồng”, phương pháp dùng bao lồi so sánh bao nhiêu cặp? (Vét cạn so sánh 36 cặp.)',
      answer: 15,
      unit: 'cặp',
      hints: [
        'Đếm số đỉnh của bao lồi trước: gọi là h.',
        'Phương pháp này so sánh h(h − 1)/2 cặp.',
      ],
      solution:
        'Bao lồi có 6 đỉnh, nên có 6 · 5 / 2 = 15 cặp, so với 9 · 8 / 2 = 36 cặp khi xét cả 9 điểm.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao khi tìm cặp xa nhất ta so sánh d² thay vì khoảng cách d?',
      options: [
        'd² luôn nhỏ hơn nên so sánh nhanh hơn',
        'Với các điểm toạ độ nguyên, d² là số nguyên nên phép so sánh chính xác, và nó sắp thứ tự các cặp đúng như d',
        'Khoảng cách d có thể âm',
      ],
      answer: 1,
      hints: ['Phép lấy căn bậc hai làm gì với một số nguyên như 125?'],
      solution:
        'Phép bình phương đồng biến với d ≥ 0, nên d² xếp hạng các cặp giống hệt d. Nó tránh phép √, vốn biến số nguyên thành số thực đã làm tròn, và còn rẻ hơn.',
    },
    {
      type: 'multi',
      prompt: 'Với toạ độ nguyên, những phép kiểm tra nào dưới đây là chính xác?',
      options: [
        'Dấu của cross(B − A, p − A)',
        'So sánh hai bình phương khoảng cách',
        'So sánh hai hệ số góc tính bằng dy / dx',
        'So sánh hai góc tính bằng atan2',
      ],
      answers: [0, 1],
      hints: ['Phép kiểm tra nào chỉ dùng +, − và ×?'],
      solution:
        'Tích có hướng và bình phương khoảng cách chỉ dùng +, − và ×, nên vẫn là số nguyên. Phép chia có thể làm tròn và hỏng với đường thẳng đứng, còn atan2 trả về số thực đã làm tròn.',
    },
  ],
};
