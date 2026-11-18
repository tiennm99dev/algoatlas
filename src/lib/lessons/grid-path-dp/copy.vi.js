/** @typedef {import('$lib/algo-engine/grid-path-dp.js').GridFrame} GridFrame */
/** @typedef {import('$lib/algo-engine/grid-path-dp.js').GridMode} GridMode */

/** @param {number} v */
const num = (v) => (v === Infinity ? '∞' : String(v));

export const vi = {
  slug: 'grid-path-dp',
  topic: 'dynamic-programming',
  level: 'Trung bình',
  title: 'QHĐ trên lưới và đường đi',
  intro:
    'Nếu chỉ được đi sang phải hoặc xuống dưới, một đường đi tới một ô phải đến từ ô phía trên hoặc ô bên trái nó. Vì thế đáp án của mỗi ô suy ra từ hai ô đó, và lấp lưới theo từng hàng luôn có sẵn chúng. Cùng một lưới có thể dùng để đếm số đường đi hoặc tìm đường đi rẻ nhất, còn tường chỉ là một ô mà không đường đi nào được dùng.',
  summary:
    'Sửa một lưới và xem số đường đi hoặc chi phí rẻ nhất của mỗi ô, dựng từ ô phía trên và ô bên trái.',
  instruction:
    'Bấm hoặc nhấn Enter vào một ô trong Lưới để thêm hay bỏ tường, rồi xem bảng cập nhật. Ở chế độ Tổng đường đi nhỏ nhất, đặt Bấm vào ô thành Đổi chi phí để tăng chi phí của một ô. Bấm vào một ô của bảng để xem ô đó được dựng thế nào, hoặc chạy từng bước để xem bảng được lấp.',
  modeLabel: 'Bài toán',
  modes: { count: 'Đếm đường đi', min: 'Tổng đường đi nhỏ nhất' },
  toolLabel: 'Bấm vào ô',
  tools: { wall: 'Bật/tắt tường', cost: 'Đổi chi phí' },
  rowsLabel: 'Số hàng',
  colsLabel: 'Số cột',
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    maze: 'Mê cung, 4 × 5',
    pillar: 'Một bức tường, 3 × 3',
    open: 'Lưới trống, 3 × 7',
    costs: 'Chi phí, 3 × 3',
    trap: 'Bẫy tham lam, 3 × 3',
  },
  resetGrid: 'Đặt lại lưới',
  /** @param {number} max */
  sideError: (max) => `Số hàng và số cột phải là số nguyên từ 1 đến ${max}.`,
  gridTitle: 'Lưới',
  /** @param {GridMode} mode */
  gridNote: (mode) =>
    mode === 'count'
      ? 'X là điểm xuất phát và Đ là đích. # là tường. Chỉ đi sang phải hoặc xuống dưới.'
      : 'X là điểm xuất phát và Đ là đích. # là tường, mỗi số là chi phí khi bước vào ô đó. Chỉ đi sang phải hoặc xuống dưới.',
  wallText: '#',
  openText: '·',
  startMark: 'X',
  goalMark: 'Đ',
  /** @param {number} rows @param {number} cols */
  gridAria: (rows, cols) => `Lưới sửa được, ${rows} hàng, ${cols} cột.`,
  /** @param {number} r @param {number} c @param {number} v @param {GridMode} mode @param {string} state */
  gridCell: (r, c, v, mode, state) => {
    const what = v === 0 ? 'tường' : mode === 'count' ? 'trống' : `chi phí ${v}`;
    return `Ô (${r}, ${c}): ${what}${state ? `, ${state}` : ''}`;
  },
  tableTitle: { count: 'Số đường đi tới mỗi ô', min: 'Chi phí rẻ nhất tới mỗi ô' },
  /** @param {GridMode} mode */
  tableNote: (mode) =>
    mode === 'count'
      ? 'P[r][c] là số đường đi sang phải và xuống dưới từ điểm xuất phát tới ô này. Tường được tính là 0.'
      : 'B[r][c] là tổng chi phí rẻ nhất của một đường đi tới ô này, tính cả chi phí của chính nó và của điểm xuất phát. ∞ nghĩa là không đường đi nào tới được.',
  /** @param {GridMode} mode @param {number} rows @param {number} cols */
  tableAria: (mode, rows, cols) =>
    `${mode === 'count' ? 'Số đường đi' : 'Chi phí rẻ nhất'}, ${rows} hàng, ${cols} cột.`,
  /** @param {number} r @param {number} c @param {string} v @param {string} state */
  tableCell: (r, c, v, state) =>
    `Ô (${r}, ${c}): ${v === '' ? 'trống' : v}${state ? `, ${state}` : ''}`,
  cellStates: {
    current: 'vừa lấp',
    read: 'được đọc',
    kept: 'được đọc và được giữ',
    path: 'trên đường đi tốt nhất',
    answer: 'đáp án',
  },
  legend: {
    current: 'Vừa lấp',
    read: 'Được ô này đọc',
    kept: 'Ô lân cận được giữ',
    path: 'Trên đường đi tốt nhất',
    answer: 'Đáp án',
  },
  markers: { current: '●', read: '○', kept: '✓', path: '◆', answer: '★' },
  /** @param {number|null} v */
  value: (v) => (v === null ? '' : num(v)),
  stats: {
    filled: 'Số ô đã lấp',
    answer: { count: 'Số đường đi tới đích', min: 'Chi phí rẻ nhất' },
    open: 'Số đường đi trên lưới trống',
    greedy: 'Luôn chọn bước kế tiếp rẻ hơn',
  },
  pending: '…',
  stuck: 'bế tắc',
  pathTitle: 'Đường đi rẻ nhất',
  pathEmpty: 'Đọc ra trong lúc đi ngược.',
  /** @param {number} r @param {number} c */
  pathChip: (r, c) => `(${r}, ${c})`,
  sumsTitle: 'Ô này được cộng thế nào',
  sumsEmpty: 'Chạy tới một ô, hoặc bấm vào một ô trong bảng.',
  /** @param {GridFrame} f */
  sums(f) {
    if (f.kind !== 'fill') return '';
    const v = f.table[f.r][f.c];
    const parts = f.options.map((o) => `${o.move === 'up' ? 'trên' : 'trái'} ${num(o.value)}`);
    return f.mode === 'count'
      ? `${parts.join(' + ')} = ${num(/** @type {number} */ (v))}`
      : `${f.grid[f.r][f.c]} + min(${parts.join(', ')}) = ${num(/** @type {number} */ (v))}`;
  },
  /** @param {GridFrame} f */
  describe(f) {
    const counting = f.mode === 'count';
    const T = counting ? 'P' : 'B';
    const here = `${T}[${f.r}][${f.c}]`;
    const v = f.r >= 0 ? f.table[f.r][f.c] : null;
    const rows = f.grid.length;
    const cols = f.grid[0].length;
    switch (f.kind) {
      case 'start':
        return counting
          ? `Đếm số đường đi từ ô trên cùng bên trái tới ô dưới cùng bên phải của lưới ${rows} × ${cols} này, chỉ đi sang phải hoặc xuống dưới.`
          : `Tìm đường đi rẻ nhất từ ô trên cùng bên trái tới ô dưới cùng bên phải của lưới ${rows} × ${cols} này, chỉ đi sang phải hoặc xuống dưới.`;
      case 'wall':
        return counting
          ? `(${f.r}, ${f.c}) là tường, nên không đường đi nào qua đó: ${here} = 0.`
          : `(${f.r}, ${f.c}) là tường, nên không đường đi nào qua đó: ${here} = ∞.`;
      case 'first':
        return counting
          ? 'Trường hợp cơ sở: có một đường đi tới điểm xuất phát, đó là đường đi rỗng. P[0][0] = 1.'
          : `Trường hợp cơ sở: điểm xuất phát tốn chi phí của chính nó, ${f.grid[0][0]}. B[0][0] = ${f.grid[0][0]}.`;
      case 'fill': {
        const above = f.options.find((o) => o.move === 'up');
        const left = f.options.find((o) => o.move === 'left');
        if (counting) {
          if (above && left)
            return `Đường đi tới từ phía trên hoặc từ bên trái: ${here} = ${above.value} + ${left.value} = ${v}.`;
          return above
            ? `Cột đầu tiên chỉ có ô phía trên: ${here} = ${above.value}.`
            : `Hàng đầu tiên chỉ có ô bên trái: ${here} = ${left?.value}.`;
        }
        if (v === Infinity)
          return `Mọi lối vào đều bị chặn, nên không đường đi nào tới được: ${here} = ∞.`;
        const c = f.grid[f.r][f.c];
        if (above && left)
          return `Chi phí ${c}. Phía trên là ${num(above.value)}, bên trái là ${num(left.value)}. Giữ ô ${f.move === 'up' ? 'phía trên' : 'bên trái'}: ${here} = ${c} + ${num(f.move === 'up' ? above.value : left.value)} = ${v}.`;
        return `Chi phí ${c}, chỉ có một lối vào: ${here} = ${c} + ${num((above ?? left)?.value ?? 0)} = ${v}.`;
      }
      case 'trace':
        return `Ở (${f.r}, ${f.c}): tổng của ô này đến từ ô ${f.move === 'up' ? 'phía trên' : 'bên trái'}, nên đi ${f.move === 'up' ? 'lên' : 'sang trái'}.`;
      case 'done':
        if (counting)
          return f.result
            ? `Có ${f.result} đường đi tới đích.`
            : 'Không đường đi nào tới được đích: tường chặn mọi lối.';
        return f.result === Infinity
          ? 'Không đường đi nào tới được đích: tường chặn mọi lối, nên chi phí vẫn là ∞.'
          : `Đường đi rẻ nhất tốn ${f.result} và đi qua ${f.path.length} ô.`;
    }
  },
  takeaways: [
    'Một đường đi sang phải và xuống dưới vào một ô từ phía trên hoặc từ bên trái, nên mỗi ô chỉ cần hai ô đó. Lấp theo từng hàng bảo đảm cả hai đã sẵn sàng.',
    'Bài đếm cộng lại: P[r][c] = P[r−1][c] + P[r][c−1]. Hai tập đường đi không bao giờ trùng nhau, vì bước cuối của chúng khác nhau. Không có tường thì đáp án là hệ số nhị thức C(m + n − 2, m − 1).',
    'Bài tối ưu lấy giá trị nhỏ hơn: B[r][c] = grid[r][c] + min(B[r−1][c], B[r][c−1]). Luôn bước sang ô kế tiếp rẻ hơn có thể bỏ lỡ đường đi tốt nhất, vì cách đó không bao giờ nhìn thấy phía sau.',
    'Tường là chướng ngại vật mang giá trị 0 khi đếm và ∞ khi tìm nhỏ nhất. Với các ô lân cận, giá trị nào cũng mang cùng một nghĩa: không đường đi nào qua đây.',
    'Nạp Bẫy tham lam ở chế độ Tổng đường đi nhỏ nhất và so sánh hai chi phí. Sau đó đếm đường đi trên Lưới trống, thêm một bức tường và xem bao nhiêu đường đi đã từng qua ô đó.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Thời gian', 'O(mn)', 'Mỗi ô được lấp một lần, đọc nhiều nhất hai ô lân cận.'],
    ['Bộ nhớ, cả bảng', 'O(mn)', 'Giữ mọi ô thì đường đi ngược mới dựng lại được đường đi.'],
    ['Bộ nhớ, chỉ cần giá trị', 'O(min(m, n))', 'Mỗi hàng chỉ đọc chính nó và hàng ngay trên.'],
    ['Đi ngược', 'O(m + n)', 'Mỗi bước đi lên hoặc sang trái, tổng cộng m + n − 2 bước.'],
    ['Vét cạn', 'C(m + n − 2, m − 1)', 'Mỗi đường đi một lượt: khoảng 4ⁿ trên lưới n × n.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Có bao nhiêu đường đi băng qua một lưới trống gồm 3 hàng và 7 cột?',
      answer: 28,
      unit: 'đường đi',
      hints: ['Nạp ví dụ Lưới trống ở chế độ Đếm đường đi rồi chạy đến bước cuối.'],
      solution:
        'C(3 + 7 − 2, 3 − 1) = C(8, 2) = 28. Hàng cuối của bảng là 1, 3, 6, 10, 15, 21, 28.',
    },
    {
      type: 'number',
      prompt: 'Một lưới 3 × 3 có tường ở ô chính giữa. Còn lại bao nhiêu đường đi?',
      answer: 2,
      unit: 'đường đi',
      hints: ['Nạp ví dụ Một bức tường.', 'Một lưới trống 3 × 3 có 6 đường đi.'],
      solution:
        'Chỉ còn hai đường đi vòng theo mép lưới. Tường mang giá trị 0, nên 4 trong 6 đường đi, đều đi qua ô giữa, đã mất.',
    },
    {
      type: 'number',
      prompt: 'Có bao nhiêu đường đi băng qua ví dụ Mê cung?',
      answer: 7,
      unit: 'đường đi',
      hints: ['Nạp ví dụ Mê cung rồi đọc ô đích của bảng.'],
      solution:
        'P[3][4] = 7. Các hàng dưới hàng đầu là 1, 0, 1, 0, 1, rồi 1, 1, 2, 2, 3, rồi 1, 0, 2, 4, 7, mỗi bức tường tính là 0.',
    },
    {
      type: 'number',
      prompt: 'Đường đi rẻ nhất qua lưới 1 3 1 / 1 5 1 / 4 2 1 tốn bao nhiêu?',
      answer: 7,
      unit: 'chi phí',
      hints: ['Nạp ví dụ Chi phí ở chế độ Tổng đường đi nhỏ nhất.'],
      solution: 'Đi dọc hàng trên cùng rồi xuống theo cạnh phải: 1 + 3 + 1 + 1 + 1 = 7.',
    },
    {
      type: 'number',
      prompt:
        'Trong Bẫy tham lam, 1 2 9 / 5 9 9 / 1 1 1, luôn chọn ô kế tiếp rẻ hơn, và đi xuống khi bằng nhau, thì trả dư bao nhiêu?',
      answer: 5,
      unit: 'chi phí',
      hints: ['So sánh số liệu Chi phí rẻ nhất với số liệu Luôn chọn bước kế tiếp rẻ hơn.'],
      solution:
        'Cách chọn ô kế tiếp rẻ hơn đi 1, 2, rồi xuống ở chỗ bằng nhau 9 và 9, rồi 1, 1, tổng 14. Bảng đi 1, 5, 1, 1, 1, tổng 9. Trả dư 5.',
    },
    {
      type: 'choice',
      prompt: 'Khi đếm đường đi, tường nên mang giá trị nào, và vì sao?',
      options: [
        '1, vì ô đó vẫn tồn tại.',
        '0, vì không đường đi nào qua đó, nên nó không cộng thêm gì cho các ô lân cận.',
        '∞, vì không bao giờ tới được ô đó.',
        'Tổng các ô lân cận của nó, như mọi ô khác.',
      ],
      answer: 1,
      hints: ['Ô lân cận làm gì với giá trị này?'],
      solution:
        'Bài đếm cộng các ô lân cận, nên 0 không cộng thêm gì. ∞ chỉ đóng vai trò tương tự khi lấy giá trị nhỏ nhất.',
    },
    {
      type: 'multi',
      prompt:
        'Những thứ tự lấp nào an toàn khi chỉ đi sang phải và xuống dưới? Chọn mọi phương án đúng.',
      options: [
        'Theo từng hàng, từ trái sang phải',
        'Theo từng cột, từ trên xuống dưới',
        'Theo từng hàng, từ hàng dưới cùng lên',
        'Theo các đường chéo phụ r + c = 0, 1, 2, …',
      ],
      answers: [0, 1, 3],
      hints: ['Một ô cần ô phía trên và ô bên trái đã xong từ trước.'],
      solution:
        'Thứ tự theo hàng, theo cột và theo đường chéo phụ đều làm xong hai ô lân cận trước. Bắt đầu từ hàng dưới cùng sẽ tới một ô trước ô phía trên nó.',
    },
    {
      type: 'text',
      prompt: 'Thời gian chạy cho một lưới m hàng và n cột là bao nhiêu?',
      accept: ['O(mn)', 'O(m·n)', 'O(m*n)', 'O(nm)', 'Θ(mn)'],
      hints: ['Đếm số ô và công việc cho mỗi ô.'],
      solution: 'm·n ô, mỗi ô đọc nhiều nhất hai lần: O(mn).',
    },
  ],
  nextTeaser:
    'Bài sau, Luyện tập: bài toán quy hoạch động, để bạn tự chọn trạng thái và công thức chuyển rồi thử trên đầu vào nhỏ.',
};
