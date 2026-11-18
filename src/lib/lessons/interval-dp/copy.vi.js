/** @typedef {import('$lib/algo-engine/interval-dp.js').IntervalFrame} IntervalFrame */
/** @typedef {import('$lib/algo-engine/interval-dp.js').IntervalProblem} IntervalProblem */

/** @param {number} i @param {number} j */
const chain = (i, j) => (i === j ? `A${i}` : `A${i}..A${j}`);
/** @param {number} i @param {number} j */
const units = (i, j) => (i === j ? `khúc ${i}` : `các khúc ${i}..${j}`);

export const vi = {
  slug: 'interval-dp',
  topic: 'dynamic-programming',
  level: 'Nâng cao',
  title: 'QHĐ trên đoạn: nhân chuỗi ma trận và cắt thanh',
  intro:
    'Có những bài toán không có thứ tự tự nhiên từ trái sang phải: bước cuối cùng có thể chia đầu vào ở bất kì đâu. QHĐ trên đoạn cho ô (i, j) ứng với đoạn từ i đến j và thử mọi điểm chia k nằm giữa. Mỗi cách chia đọc hai đoạn ngắn hơn, nên bảng được lấp theo độ dài, mỗi lần một đường chéo. Nhân chuỗi ma trận và cắt thanh là hai ví dụ kinh điển.',
  summary:
    'Lấp một bảng tam giác theo độ dài đoạn, thử mọi điểm chia k, rồi dựng lại thứ tự nhân ma trận tốt nhất hoặc cách cắt thanh tốt nhất.',
  instruction:
    'Chọn một bài toán, gõ các kích thước hoặc các mức giá rồi chạy từng bước. Mỗi đường chéo là một độ dài đoạn; hai mũi tên cho thấy hai đoạn ngắn hơn mà một cách chia đọc, và dấu ✓ đánh dấu cách chia tốt nhất khi ô được chốt. Bấm vào ô đã lấp bất kì để nhảy tới ô đó. Các bước cuối đọc ngược đáp án từ bảng điểm chia.',
  problemLabel: 'Bài toán',
  problems: { matrix: 'Chuỗi ma trận', rod: 'Cắt thanh' },
  inputLabel: { matrix: 'Các kích thước p', rod: 'Giá theo độ dài' },
  presetLabel: 'Ví dụ',
  /** @type {Record<IntervalProblem, Record<string, string>>} */
  presets: {
    matrix: {
      three: '3 ma trận: 10, 100, 5, 50',
      four: '4 ma trận: 40, 20, 30, 10, 30',
      six: '6 ma trận: 30, 35, 15, 5, 10, 20, 25',
    },
    rod: {
      four: 'Thanh dài 4: 1, 5, 8, 9',
      eight: 'Thanh dài 8: 1, 5, 8, 9, 10, 17, 17, 20',
      whole: 'Thanh dài 3: 1, 2, 9',
    },
  },
  /**
   * @param {number} maxMatrices
   * @param {number} maxDim
   * @param {number} maxRod
   * @param {number} maxPrice
   */
  errors: (maxMatrices, maxDim, maxRod, maxPrice) => ({
    format: 'Hãy viết các số nguyên cách nhau bởi dấu phẩy.',
    count: {
      matrix: `Hãy gõ từ 2 đến ${maxMatrices + 1} kích thước: n ma trận có n + 1 kích thước.`,
      rod: `Hãy gõ từ 1 đến ${maxRod} mức giá, mỗi độ dài một mức.`,
    },
    range: {
      matrix: `Mỗi kích thước phải từ 1 đến ${maxDim}.`,
      rod: `Mỗi mức giá phải từ 0 đến ${maxPrice}.`,
    },
  }),
  tableTitle: { matrix: 'Số phép nhân ít nhất m[i][j]', rod: 'Giá tốt nhất r[i][j]' },
  splitTitle: 'Điểm chia tốt nhất s[i][j]',
  /** @param {IntervalProblem} p */
  tableNote: (p) =>
    p === 'matrix'
      ? 'Ô (i, j) là cách rẻ nhất để nhân A[i]..A[j]. Chỉ i ≤ j mới là một đoạn, nên bảng có hình tam giác, và mỗi đường chéo ứng với một độ dài.'
      : 'Ô (i, j) là số tiền nhiều nhất cho mẩu gồm các khúc i..j. Chỉ i ≤ j mới là một đoạn, nên bảng có hình tam giác. Mọi ô trên một đường chéo đều bằng nhau, vì chỉ độ dài của mẩu là quan trọng.',
  /** @param {IntervalProblem} p */
  splitNote: (p) =>
    p === 'matrix'
      ? 'Giá trị k của cách chia thắng. Chia ngay sau A[k].'
      : 'Giá trị k của nhát cắt thắng. Cắt ngay sau khúc k; dấu gạch nghĩa là bán nguyên mẩu.',
  noSplit: '–',
  outside: '·',
  /** @param {IntervalProblem} p @param {number} n */
  tableAria: (p, n) =>
    p === 'matrix'
      ? `Bảng tam giác số phép nhân ít nhất cho ${n} ma trận.`
      : `Bảng tam giác giá tốt nhất cho thanh dài ${n} khúc.`,
  /** @param {number} n */
  splitAria: (n) => `Bảng điểm chia tốt nhất cho mỗi đoạn, ${n} × ${n}.`,
  /** @param {IntervalProblem} p @param {number} i @param {number} j @param {string} v @param {string} state */
  cellLabel: (p, i, j, v, state) => {
    if (i > j) return `Hàng ${i}, cột ${j}: không phải một đoạn`;
    const name = p === 'matrix' ? chain(i, j) : units(i, j);
    return `${name}: ${v === '' ? 'trống' : v}${state ? `, ${state}` : ''}`;
  },
  cellStates: {
    current: 'vừa lấp',
    read: 'được đọc',
    kept: 'được đọc, cách chia tốt nhất',
    frontier: 'cùng độ dài, đang chờ',
    path: 'được đáp án dùng',
    answer: 'đáp án',
  },
  legend: {
    current: 'Vừa lấp',
    frontier: 'Cùng độ dài, đang chờ',
    read: 'Được cách chia này đọc',
    kept: 'Cách chia tốt nhất',
    path: 'Được đáp án dùng',
    answer: 'Đáp án',
  },
  markers: { current: '●', frontier: '◇', read: '○', kept: '✓', path: '◆', answer: '★' },
  /** @param {IntervalProblem} p */
  stripLabel: (p) => (p === 'matrix' ? 'Chuỗi ma trận' : 'Thanh'),
  /** @param {IntervalProblem} p @param {number} i @param {number} j @param {number} k */
  stripAria: (p, i, j, k) => {
    if (!i) return p === 'matrix' ? 'Chuỗi các ma trận.' : 'Các khúc của thanh.';
    const name = p === 'matrix' ? chain(i, j) : units(i, j);
    return `Đoạn ${name}${k ? `, chia ngay sau ${p === 'matrix' ? `A${k}` : `khúc ${k}`}` : ''}.`;
  },
  /** @param {IntervalProblem} p @param {number} i */
  stripCell: (p, i) => (p === 'matrix' ? `A${i}` : String(i)),
  windows: { left: 'trái', right: 'phải', whole: 'đoạn' },
  shapesTitle: { matrix: 'Kích thước ma trận', rod: 'Giá theo độ dài' },
  /** @param {IntervalProblem} p @param {number[]} input @param {number} k */
  shapeChip: (p, input, k) =>
    p === 'matrix' ? `A${k + 1}: ${input[k]}×${input[k + 1]}` : `${k + 1} → ${input[k]}`,
  orderTitle: { matrix: 'Thứ tự', rod: 'Các mẩu' },
  orderEmpty: 'Đọc ra từ bảng điểm chia sau ô cuối cùng.',
  stats: {
    tried: 'Số cách chia đã thử',
    filled: 'Số đoạn đã lấp',
    answer: { matrix: 'Số phép nhân ít nhất', rod: 'Giá tốt nhất' },
    baseline: { matrix: 'Thứ tự tệ nhất', rod: 'Bán nguyên thanh' },
    orders: {
      matrix: 'Số thứ tự mà vét cạn phải so sánh',
      rod: 'Số cách cắt mà vét cạn phải so sánh',
    },
  },
  pending: '…',
  /** @param {IntervalFrame} f */
  describe(f) {
    const matrix = f.problem === 'matrix';
    const T = matrix ? 'm' : 'r';
    const name = matrix ? chain : units;
    const cell = `${T}[${f.i}][${f.j}]`;
    switch (f.kind) {
      case 'start':
        return matrix
          ? `Nhân ${f.n} ma trận với ít phép nhân số nhất. Tích là như nhau với mọi thứ tự, nhưng khối lượng công việc thì không.`
          : `Bán một thanh dài ${f.n} khúc để được nhiều tiền nhất. Cắt ở đâu cũng được, hoặc không cắt.`;
      case 'base':
        return matrix
          ? 'Độ dài 1: một ma trận không cần phép nhân nào, nên đường chéo bằng 0.'
          : `Độ dài 1: một khúc không cắt được, nên mỗi ô trên đường chéo là giá của nó, ${f.input[0]}.`;
      case 'length':
        return `Độ dài ${f.len}: mọi đoạn trên đường chéo này chia thành hai đoạn ngắn hơn, và các đoạn đó đều đã xong.`;
      case 'open':
        return matrix
          ? `Đoạn ${name(f.i, f.j)}: bắt đầu bằng ∞ và thử ${f.j - f.i} cách chia.`
          : `Đoạn ${name(f.i, f.j)}: bán nguyên mẩu được p[${f.len}] = ${f.cost}. Sau đó thử ${f.j - f.i} nhát cắt.`;
      case 'try': {
        const after = matrix ? `A${f.k}` : `khúc ${f.k}`;
        const sum = matrix
          ? `${f.left} + ${f.right} + ${f.input[f.i - 1]}·${f.input[f.k]}·${f.input[f.j]} = ${f.cost}`
          : `${f.left} + ${f.right} = ${f.cost}`;
        const verdict = f.improved
          ? f.best === null
            ? 'Đây là phương án đầu tiên, nên tạm thời là tốt nhất.'
            : `Tốt hơn ${f.best}, nên là tốt nhất mới.`
          : `Không tốt hơn ${f.best}.`;
        return `${matrix ? 'Chia' : 'Cắt'} ngay sau ${after}: ${sum}. ${verdict}`;
      }
      case 'settle':
        return f.k
          ? `${cell} = ${f.best}, với ${matrix ? 'cách chia' : 'nhát cắt'} tốt nhất ngay sau ${matrix ? `A${f.k}` : `khúc ${f.k}`}: ${name(f.i, f.k)} và ${name(f.k + 1, f.j)}.`
          : `${cell} = ${f.best}: không nhát cắt nào tốt hơn bán nguyên mẩu này.`;
      case 'trace':
        return f.k
          ? `s[${f.i}][${f.j}] = ${f.k}: ${name(f.i, f.j)} được ${matrix ? 'chia' : 'cắt'} thành ${name(f.i, f.k)} và ${name(f.k + 1, f.j)}.`
          : `s[${f.i}][${f.j}] = 0: bán nguyên ${name(f.i, f.j)}.`;
      case 'done':
        return matrix
          ? `Số phép nhân ít nhất: ${f.result}, với thứ tự ${f.order}.`
          : `Giá tốt nhất: ${f.result}, với các mẩu ${f.order}.`;
    }
  },
  takeaways: [
    'QHĐ trên các đoạn: ô (i, j) là đáp án cho đoạn i..j. Có n(n + 1) / 2 đoạn, tạo thành một bảng tam giác.',
    'Điểm chia k là lựa chọn: cả đoạn được hoàn thành bằng cách ghép i..k với k + 1..j. Thử mọi k, giữ cái tốt nhất và lưu nó vào s[i][j]. Sau đó dựng lại đáp án từ trên xuống, bắt đầu ở s[1][n].',
    'Lấp theo độ dài, không lấp theo hàng từ trên xuống: cả hai phần của một cách chia đều ngắn hơn cả đoạn, nên chúng đã xong khi mọi độ dài nhỏ hơn đã xong.',
    'Chuỗi ma trận: m[i][j] = min theo k của m[i][k] + m[k+1][j] + p[i−1]·p[k]·p[j]. Số hạng cuối là phép nhân hai phần đã xong. Thứ tự nhân có thể làm khối lượng công việc chênh nhau mười lần, như ví dụ đầu tiên cho thấy.',
    'Bài cắt thanh vừa với cùng bảng đó, nhưng mọi đường chéo lặp lại, vì giá trị của một mẩu chỉ phụ thuộc vào độ dài. Nên nó thu gọn còn một hàng: r[n] = max theo i của p[i] + r[n − i], trong O(n²). Nạp thanh dài 8 và đọc các đường chéo, rồi gõ bảng giá của riêng bạn sao cho bán nguyên thanh là tốt nhất.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian',
      'O(n³)',
      'O(n²) đoạn, mỗi đoạn tối đa n − 1 cách chia; tổng cộng (n³ − n) / 6 cách chia.',
    ],
    ['Bộ nhớ', 'O(n²)', 'Một tam giác gồm n(n + 1) / 2 giá trị, cộng bảng điểm chia.'],
    ['Dựng lại thứ tự', 'O(n)', 'Mỗi điểm chia ghé một lần: n − 1 lần cho chuỗi n ma trận.'],
    [
      'Cắt thanh bằng một hàng',
      'thời gian O(n²), bộ nhớ O(n)',
      'Giá trị chỉ phụ thuộc vào độ dài, nên một hàng r[0..n] là đủ.',
    ],
    ['Vét cạn', 'Θ(4ⁿ / n^1.5)', 'Số Catalan các cách đặt ngoặc; một thanh có 2^(n − 1) cách cắt.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Các ma trận A1, A2, A3 có kích thước p = 10, 100, 5, 50. Cần ít nhất bao nhiêu phép nhân số?',
      answer: 7500,
      unit: 'phép nhân',
      hints: ['Nạp ví dụ 3 ma trận rồi chạy đến bước cuối.'],
      solution:
        '(A1 A2) A3 tốn 10·100·5 + 10·5·50 = 5000 + 2500 = 7500. A1 (A2 A3) tốn 100·5·50 + 10·100·50 = 25000 + 50000 = 75000, gấp mười lần.',
    },
    {
      type: 'number',
      prompt: 'Trong ví dụ 6 ma trận p = 30, 35, 15, 5, 10, 20, 25, m[2][5] bằng bao nhiêu?',
      answer: 7125,
      unit: 'phép nhân',
      hints: ['Nạp ví dụ 6 ma trận rồi bấm vào hàng A2, cột A5.'],
      solution:
        'Cách chia tốt nhất là ngay sau A3: m[2][3] + m[4][5] + 35·5·20 = 2625 + 1000 + 3500 = 7125.',
    },
    {
      type: 'number',
      prompt: 'Bảng chuỗi ma trận thử bao nhiêu cách chia cho 6 ma trận?',
      answer: 35,
      unit: 'cách chia',
      hints: [
        'Nạp ví dụ 6 ma trận rồi đọc Số cách chia đã thử ở cuối.',
        'Dùng công thức (n³ − n) / 6.',
      ],
      solution: '(6³ − 6) / 6 = 210 / 6 = 35 cách chia trên 15 đoạn có độ dài từ 2 trở lên.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao bảng được lấp theo độ dài đoạn?',
      options: [
        'Vì các đoạn dài quan trọng hơn.',
        'Vì cả hai phần của một cách chia đều ngắn hơn cả đoạn, nên chúng đã xong từ trước.',
        'Vì bảng có hình vuông.',
        'Vì k luôn bằng độ dài.',
      ],
      answer: 1,
      hints: ['Một cách chia của (i, j) đọc những ô nào?'],
      solution:
        'Một cách chia đọc (i, k) và (k + 1, j), cả hai đều ngắn hơn hẳn (i, j). Làm xong mọi độ dài ngắn hơn trước sẽ bảo đảm chúng đã sẵn sàng.',
    },
    {
      type: 'number',
      prompt: 'Một thanh dài 8 có bảng giá 1, 5, 8, 9, 10, 17, 17, 20. Giá tốt nhất là bao nhiêu?',
      answer: 22,
      hints: ['Nạp ví dụ Thanh dài 8 rồi chạy đến bước cuối.'],
      solution:
        'Cắt thành hai mẩu dài 2 và 6: p[2] + p[6] = 5 + 17 = 22, so với 20 khi bán nguyên thanh.',
    },
    {
      type: 'choice',
      prompt:
        'Trong bảng cắt thanh, mọi ô trên cùng một đường chéo có cùng giá trị. Điều đó cho thấy gì?',
      options: [
        'Bảng có lỗi.',
        'Giá tốt nhất của một mẩu chỉ phụ thuộc vào độ dài của nó, nên một hàng là đủ.',
        'Thanh nào cũng nên bán nguyên.',
        'Điểm chia không quan trọng.',
      ],
      answer: 1,
      hints: ['r[1][3] và r[2][4] có điểm gì chung?'],
      solution:
        'Cả hai đều là mẩu dài 3 khúc, và bảng giá chỉ đọc độ dài. Nên chỉ cần r[len]: r[n] = max theo i của p[i] + r[n − i].',
    },
    {
      type: 'number',
      prompt: 'Có bao nhiêu cách đặt ngoặc đầy đủ cho 6 ma trận?',
      answer: 42,
      unit: 'thứ tự',
      hints: ['Đọc số liệu Số thứ tự mà vét cạn phải so sánh, hoặc dùng số Catalan C(5).'],
      solution:
        'C(5) = 42. Con số này tăng gần như 4ⁿ, nên so sánh từng thứ tự một là không khả thi.',
    },
    {
      type: 'text',
      prompt: 'Thời gian chạy của bảng QHĐ trên đoạn cho n ma trận là bao nhiêu?',
      accept: ['O(n^3)', 'O(n³)', 'Θ(n^3)', 'n^3'],
      hints: ['Có O(n²) ô, mỗi ô tối đa n − 1 cách chia.'],
      solution: 'O(n²) đoạn, mỗi đoạn O(n) cách chia: O(n³). Chính xác là (n³ − n) / 6 cách chia.',
    },
  ],
  nextTeaser:
    'Bài sau, QHĐ trên lưới và đường đi, lấp một lưới theo từng hàng để đếm đường đi hoặc tìm đường rẻ nhất, kể cả khi có tường chắn.',
};
