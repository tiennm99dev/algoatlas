/** @typedef {import('$lib/algo-engine/segment-intersection.js').SegmentFrame} SegmentFrame */
/** @typedef {import('$lib/algo-engine/segment-intersection.js').Point} Point */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');

/** A coordinate with at most two decimals; `≈` says when it was rounded. */
/** @param {number} v */
export const coord = (v) => {
  const rounded = Math.round(v * 100) / 100;
  return `${Math.abs(rounded - v) > 1e-9 ? '≈ ' : ''}${num(rounded)}`;
};

/** @param {Point} p */
const pt = (p) => `(${coord(p.x)}, ${coord(p.y)})`;

const NAMES = ['o1', 'o2', 'o3', 'o4'];
const TESTED = ['a', 'b', 'c', 'd'];
const LINE = ['cd', 'cd', 'ab', 'ab'];

/** @param {number | null} v */
const side = (v) =>
  v === null ? '' : v > 0 ? 'bên trái' : v < 0 ? 'bên phải' : 'trên đường thẳng';

export const vi = {
  slug: 'segment-intersection',
  topic: 'geometry',
  level: 'Trung bình',
  title: 'Giao của hai đoạn thẳng',
  intro:
    'Hai đoạn thẳng có cắt nhau không? Nếu giải hệ phương trình để tìm giao điểm, ta phải chia và xử lí riêng trường hợp hai đường thẳng song song. Bốn phép kiểm tra hướng quay cho câu trả lời chính xác: hai đoạn cắt nhau khi hai đầu mút của mỗi đoạn nằm ở hai phía khác nhau của đoạn kia. Một đầu mút thẳng hàng cần thêm một phép kiểm tra, và chỉ khi đó ta mới cần chia để tìm vị trí giao điểm.',
  summary:
    'Xác định hai đoạn thẳng có giao nhau không từ dấu của bốn phép kiểm tra hướng quay, kể cả các trường hợp thẳng hàng, rồi tính giao điểm.',
  instruction:
    'Kéo một đầu mút bất kì, hoặc chọn một đầu mút rồi nhấn Shift + phím mũi tên. Hai đoạn chuyển sang màu đỏ khi chúng giao nhau, kèm dấu × tại giao điểm. Đi từng bước để xem lần lượt o1 đến o4, rồi chọn các ví dụ thẳng hàng, nơi cả bốn dấu đều bằng 0.',
  presetLabel: 'Ví dụ',
  presets: {
    crossing: 'Cắt nhau thực sự',
    tee: 'Hình chữ T',
    overlap: 'Thẳng hàng, chồng lên nhau',
    endToEnd: 'Thẳng hàng, nối đầu với đuôi',
    gap: 'Thẳng hàng, có khoảng hở',
    parallel: 'Song song',
    lineOnly: 'Đường thẳng cắt nhau, đoạn thẳng thì không',
  },
  /** @param {string} name @param {number} x @param {number} y */
  pointLabel: (name, x, y) => `Đầu mút ${name} ở (${x}, ${y})`,
  planeLabel:
    'Hai đoạn thẳng AB và CD trên mặt phẳng toạ độ. Phím mũi tên chuyển giữa các đầu mút; Shift + mũi tên dời một đầu mút.',
  legend: {
    idle: 'Đoạn thẳng, chưa biết có giao không',
    hit: 'Hai đoạn giao nhau',
    line: 'Nét đứt: đường thẳng đang dùng để kiểm tra',
    tested: 'Đầu mút đang kiểm tra',
    shared: 'Phần chung',
    point: '× Giao điểm',
  },
  tableTitle: 'Dấu của các phép kiểm tra hướng quay',
  tableHeads: { name: 'Phép kiểm tra', value: 'Giá trị', side: 'Phía' },
  /** @param {number} i */
  testName: (i) => `${NAMES[i]}: ${TESTED[i]} so với ${LINE[i]}`,
  /** @param {number} v */
  value: num,
  side,
  pending: '…',
  stats: {
    verdict: 'Kết quả',
    tests: 'Số phép kiểm tra hướng quay',
    boxChecks: 'Số phép kiểm tra hộp bao',
    t: 't dọc theo ab',
    where: 'Vị trí',
  },
  outcomes: {
    cross: 'Cắt nhau thực sự',
    touch: 'Chạm nhau',
    overlap: 'Chồng lên nhau',
    none: 'Không giao nhau',
  },
  /** @param {{ num: number, den: number }} t */
  fraction: (t) => (t.den === 1 ? num(t.num) : `${num(t.num)} / ${t.den}`),
  pt,
  /** @param {Point} p @param {Point} q */
  stretch: (p, q) => `${pt(p)} đến ${pt(q)}`,
  none: '—',
  workedTitle: 'Ví dụ mẫu: a = (0, 0), b = (6, 3), c = (0, 3), d = (6, 0)',
  workedSteps: [
    'a và b có nằm ở hai phía của cd không? o1 = orient(c, d, a) = −18 và o2 = orient(c, d, b) = 18. Hai dấu trái nhau.',
    'c và d có nằm ở hai phía của ab không? o3 = orient(a, b, c) = 18 và o4 = orient(a, b, d) = −18. Lại trái dấu, nên hai đoạn cắt nhau.',
    'r = b − a = (6, 3) và s = d − c = (6, −3), nên r × s = −18 − 18 = −36.',
    '(c − a) × s = (0, 3) × (6, −3) = 0 − 18 = −18, nên t = −18 / −36 = 1/2.',
    'Giao điểm là a + t · r = (0, 0) + ½ · (6, 3) = (3, 1.5).',
  ],
  /** @param {SegmentFrame} f */
  describe: (f) => {
    switch (f.kind) {
      case 'start':
        return `Đoạn ab từ ${pt(f.a)} đến ${pt(f.b)}, và đoạn cd từ ${pt(f.c)} đến ${pt(f.d)}. Chúng có giao nhau không?`;
      case 'orient': {
        const i = /** @type {number} */ (f.at);
        const v = /** @type {number} */ (f.o[i]);
        return `${NAMES[i]} = ${num(v)}: ${TESTED[i]} nằm ${
          v === 0 ? 'trên đường thẳng qua' : `${side(v)} đường thẳng`
        } ${LINE[i]}.`;
      }
      case 'straddle':
        return f.passed
          ? 'a và b nằm ở hai phía của cd, còn c và d nằm ở hai phía của ab. Hai đoạn cắt nhau.'
          : 'Các đầu mút không nằm ở hai phía theo cả hai chiều, nên hai đoạn không cắt nhau thực sự. Một đầu mút thẳng hàng vẫn có thể chạm đoạn kia.';
      case 'onSegment': {
        const i = /** @type {number} */ (f.at);
        if (f.o[i] !== 0) return `${NAMES[i]} khác 0, nên ${TESTED[i]} không nằm trên ${LINE[i]}.`;
        return f.passed
          ? `${NAMES[i]} = 0 và ${TESTED[i]} nằm trong hộp bao của ${LINE[i]}: ${TESTED[i]} nằm trên đoạn thẳng.`
          : `${NAMES[i]} = 0, nhưng ${TESTED[i]} nằm ngoài hộp bao của ${LINE[i]}: nó ở trên đường thẳng, nhưng vượt quá đoạn thẳng.`;
      }
      case 'vectors':
        return `Hai đoạn giao nhau. Các vectơ chỉ phương: r = ${pt(/** @type {Point} */ (f.r))} và s = ${pt(/** @type {Point} */ (f.s))}.`;
      case 'shared':
        return f.shared
          ? `r × s = 0, nên hai đoạn song song và cùng nằm trên một đường thẳng. Hai đầu mút ở giữa sau khi sắp xếp cho phần chung, từ ${pt(f.shared[0])} đến ${pt(f.shared[1])}.`
          : `r × s = 0, và hai đầu mút ở giữa sau khi sắp xếp trùng nhau: hai đoạn chỉ chung một điểm ${pt(/** @type {Point} */ (f.point))}.`;
      case 'parameter':
        return `t = ((c − a) × s) / (r × s) = ${vi.fraction(/** @type {{ num: number, den: number }} */ (f.t))}, tức là phần quãng đường đã đi dọc theo ab.`;
      case 'point':
        return `a + t · r = ${pt(/** @type {Point} */ (f.point))}.`;
      case 'done':
        if (f.outcome === 'none')
          return 'Không phép kiểm tra nào thành công, nên hai đoạn không giao nhau.';
        if (f.outcome === 'overlap')
          return `Hai đoạn chồng lên nhau từ ${pt(/** @type {[Point, Point]} */ (f.shared)[0])} đến ${pt(/** @type {[Point, Point]} */ (f.shared)[1])}.`;
        return f.outcome === 'cross'
          ? `Hai đoạn cắt nhau tại ${pt(/** @type {Point} */ (f.point))}.`
          : `Hai đoạn chạm nhau tại ${pt(/** @type {Point} */ (f.point))}.`;
    }
  },
  takeaways: [
    'Hai đoạn cắt nhau thực sự khi và chỉ khi o1, o2 trái dấu và o3, o4 trái dấu. Cần cả hai cặp: một cặp thôi chỉ cho biết một đường thẳng bị cắt qua.',
    'Hướng quay bằng 0 nghĩa là một đầu mút nằm trên đường thẳng chứa đoạn kia. Nó chỉ nằm trên đoạn thẳng nếu còn nằm trong hộp bao của đoạn đó.',
    'Khi cả bốn giá trị bằng 0, hai đoạn thẳng hàng: sắp xếp bốn đầu mút, và nếu hai đoạn thật sự chồng lên nhau thì hai đầu mút ở giữa là phần chung.',
    'Câu trả lời có hay không chẳng cần phép chia. Chỉ vị trí giao điểm mới cần, theo t = ((c − a) × s) / (r × s), nên hãy giữ nó ở dạng phân số khi cần kết quả chính xác.',
    'Chọn “Đường thẳng cắt nhau, đoạn thẳng thì không” rồi đi từng bước: o3 và o4 trái dấu, nhưng o1 và o2 thì không. Giờ kéo B vượt qua đường thẳng CD và xem cả hai cặp đều trái dấu.',
  ],
  complexityHead: ['Phép toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Có giao nhau không?',
      'Thời gian O(1), bộ nhớ O(1)',
      'Bốn phép kiểm tra hướng quay và nhiều nhất bốn phép kiểm tra hộp bao.',
    ],
    ['Giao nhau ở đâu?', 'Thời gian O(1)', 'Thêm hai tích có hướng và một phép chia.'],
    [
      'Mọi cặp trong n đoạn thẳng',
      'Thời gian O(n²)',
      'Mỗi cặp một phép kiểm tra thời gian hằng; thuật toán đường quét làm tốt hơn khi ít cặp giao nhau.',
    ],
  ],
  nextTeaser:
    'Bài sau đi một vòng quanh các cạnh để tính diện tích đa giác và điểm trong đa giác chỉ bằng tích có hướng.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Đoạn từ (0, 0) đến (6, 3) và đoạn từ (0, 3) đến (6, 0) cắt nhau. Tung độ y của giao điểm bằng bao nhiêu?',
      answer: 1.5,
      hints: ['Dùng t = ((c − a) × s) / (r × s).', 'Tính ra t = 1/2. Rồi đọc y từ a + t · r.'],
      solution:
        'r = (6, 3), s = (6, −3), r × s = −36 và (c − a) × s = −18, nên t = 1/2. Giao điểm là (3, 1.5).',
    },
    {
      type: 'multi',
      prompt: 'Những đoạn nào dưới đây giao với đoạn từ (0, 0) đến (4, 0)?',
      options: ['(2, 0) đến (2, 3)', '(5, 0) đến (8, 0)', '(1, 1) đến (3, 1)', '(4, 0) đến (6, 2)'],
      answers: [0, 3],
      hints: [
        'Chạm nhau tại một đầu mút vẫn tính là giao nhau.',
        'Đoạn thứ hai nằm trên cùng đường thẳng, nhưng ở quá đầu mút.',
      ],
      solution:
        'Đoạn thứ nhất chạm tại (2, 0), đoạn cuối chạm tại (4, 0). Đoạn thứ hai thẳng hàng nhưng có khoảng hở, còn đoạn thứ ba song song.',
    },
    {
      type: 'choice',
      prompt:
        'Với a = (1, 1), b = (5, 3), c = (8, 1) và d = (8, 7), o3 và o4 trái dấu. Bạn kết luận được gì?',
      options: [
        'Hai đoạn cắt nhau',
        'c và d nằm ở hai phía của đường thẳng qua a và b, nhưng vẫn cần xét o1 và o2',
        'Hai đoạn thẳng hàng',
      ],
      answer: 1,
      hints: ['o3 và o4 chỉ so sánh c và d với đường thẳng qua a và b.'],
      solution:
        'Chỉ một cặp trái dấu thì chỉ cho biết đường thẳng qua ab đi giữa c và d. Ở đây a và b đều nằm bên trái cd, nên hai đoạn không giao nhau.',
    },
    {
      type: 'number',
      prompt:
        'Đoạn từ (1, 1) đến (7, 4) và đoạn từ (3, 2) đến (11, 6) chồng lên nhau. Hoành độ x của điểm cuối bên phải của phần chung bằng bao nhiêu?',
      answer: 7,
      hints: [
        'Hai đoạn thẳng hàng, nên hãy sắp xếp bốn đầu mút theo x.',
        'Các giá trị x sau khi sắp xếp là 1, 3, 7, 11. Lấy hai giá trị ở giữa.',
      ],
      solution: 'Hai đầu mút ở giữa là (3, 2) và (7, 4), nên phần chung kết thúc tại x = 7.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao hướng quay bằng 0 còn cần thêm phép kiểm tra hộp bao?',
      options: [
        'Vì tích có hướng có thể đã bị làm tròn thành 0',
        'Vì 0 chỉ cho biết điểm nằm trên đường thẳng vô hạn, chưa chắc nằm trên đoạn thẳng',
        'Vì kiểm tra hộp bao nhanh hơn kiểm tra hướng quay',
      ],
      answer: 1,
      hints: ['Hàm orient nhìn thấy gì: đoạn thẳng, hay đường thẳng chứa nó?'],
      solution:
        'Hàm orient so sánh một điểm với cả một đường thẳng. Một điểm trên đường thẳng đó vẫn có thể nằm vượt quá một trong hai đầu mút của đoạn, và phép kiểm tra hộp bao loại trường hợp này.',
    },
  ],
};
