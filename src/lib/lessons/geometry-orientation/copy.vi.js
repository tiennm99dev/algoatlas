/** @typedef {import('$lib/algo-engine/geometry-orientation.js').OrientationFrame} OrientationFrame */
/** @typedef {import('$lib/algo-engine/geometry-orientation.js').Point} Point */
/** @typedef {import('$lib/algo-engine/geometry-orientation.js').Turn} Turn */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');
/** @param {Point} p */
const pt = (p) => `(${num(p.x)}, ${num(p.y)})`;
/** @param {number} v */
const float = (v) => (v === 0 ? '0' : v.toExponential(2).replace(/-/g, '−'));

/** @param {number} v @returns {Turn} */
const exactTurn = (v) => (v > 0 ? 'left' : v < 0 ? 'right' : 'collinear');

/** @type {Record<Turn, string>} */
const TURN = { left: 'Rẽ trái', right: 'Rẽ phải', collinear: 'Thẳng hàng' };

export const vi = {
  slug: 'geometry-orientation',
  topic: 'geometry',
  level: 'Cơ bản',
  title: 'Điểm, vectơ và hướng quay',
  intro:
    'Gần như mọi bài hình học tính toán đều quy về một câu hỏi: đi từ a đến b thì c nằm bên trái, bên phải hay ngay phía trước? Tích có hướng (cross product) trả lời câu hỏi này chỉ bằng hai phép nhân và một phép trừ, không cần góc, không cần phép chia. Trên số nguyên, kết quả chính xác tuyệt đối; trên số thực dấu phẩy động (float), kết quả có thể sai.',
  summary:
    'Tính tích vô hướng (dot product) và tích có hướng trên các điểm em kéo, đọc hướng quay từ dấu của kết quả và xem số thực dấu phẩy động tính sai.',
  instruction:
    'Kéo A, B hoặc C, hoặc chọn một điểm rồi nhấn Shift + phím mũi tên để dời nó. Dấu của tích có hướng và hướng quay cập nhật ngay khi em dời điểm. Lùi từng bước để xem riêng hai vectơ và từng tích, rồi chọn ví dụ “Bẫy số thực”.',
  presetLabel: 'Ví dụ',
  presets: {
    left: 'Rẽ trái',
    right: 'Rẽ phải',
    collinear: 'Thẳng hàng',
    rightAngle: 'Góc vuông',
    obtuse: 'Góc tù',
    floatTrap: 'Bẫy số thực',
  },
  /** @param {string} name @param {number} x @param {number} y */
  pointLabel: (name, x, y) => `Điểm ${name} ở (${x}, ${y})`,
  planeLabel:
    'Mặt phẳng toạ độ với các điểm A, B, C và các vectơ xuất phát từ A. Phím mũi tên chuyển giữa các điểm; Shift + mũi tên dời một điểm.',
  legend: {
    u: 'u = b − a',
    v: 'v = c − a',
    left: 'Tam giác: rẽ trái',
    right: 'Tam giác: rẽ phải',
  },
  stats: {
    dot: 'Tích vô hướng u · v',
    cross: 'Tích có hướng u × v',
    angle: 'Góc tại a',
    area: 'Diện tích tam giác',
    turn: 'a → b → c',
    multiplications: 'Số phép nhân',
  },
  pending: '…',
  angles: {
    acute: 'Nhọn (tích vô hướng > 0)',
    right: 'Vuông (tích vô hướng = 0)',
    obtuse: 'Tù (tích vô hướng < 0)',
    none: 'Không có: một vectơ bằng 0',
  },
  turns: TURN,
  precisionTitle: 'Cùng các điểm ấy, tính theo phần mười',
  precisionHint: 'Đọc mỗi toạ độ là x / 10, như một chương trình đang giữ các giá trị 0.1 và 0.3.',
  precisionRows: {
    exact: 'Tích có hướng chính xác',
    float: 'Tích có hướng bằng số thực, xét dấu trực tiếp',
    epsilon: 'Tích có hướng bằng số thực, coi |giá trị| < 10⁻⁹ là 0',
  },
  precisionWrong: 'Số thực tính sai ở trường hợp này.',
  precisionFine: 'Lần này số thực cho kết quả đúng.',
  /** @param {number} crossValue */
  exactInTenths: (crossValue) => num(crossValue / 100),
  float,
  workedTitle: 'Ví dụ mẫu: a = (1, 1), b = (5, 2), c = (3, 6)',
  workedSteps: [
    'Lấy hai điểm còn lại trừ đi a: u = b − a = (4, 1) và v = c − a = (2, 5).',
    'Tích vô hướng: 4 · 2 + 1 · 5 = 13. Kết quả dương nên góc tại a là góc nhọn.',
    'Tích có hướng: 4 · 5 − 1 · 2 = 18. Kết quả dương nên a → b → c rẽ trái.',
    'Diện tích tam giác bằng một nửa độ lớn của tích có hướng: 18 / 2 = 9.',
  ],
  /** @param {OrientationFrame} f */
  describe: (f) => {
    switch (f.kind) {
      case 'start':
        return `Ba điểm: a = ${pt(f.a)}, b = ${pt(f.b)}, c = ${pt(f.c)}. Đi từ a đến b thì c nằm ở đâu?`;
      case 'u':
        return `u = b − a = ${pt(/** @type {Point} */ (f.u))}: hướng đi từ a đến b.`;
      case 'v':
        return `v = c − a = ${pt(/** @type {Point} */ (f.v))}: hướng đi từ a đến c.`;
      case 'dot':
        if (f.angle === 'none')
          return `Tích vô hướng = ${num(/** @type {number} */ (f.dot))}, nhưng có một vectơ bằng 0 nên không có góc tại a.`;
        return `Tích vô hướng = u.x · v.x + u.y · v.y = ${num(/** @type {number} */ (f.dot))}. Dấu của nó cho biết góc tại a: ${
          f.angle === 'acute'
            ? 'dương nên góc nhọn'
            : f.angle === 'obtuse'
              ? 'âm nên góc tù'
              : 'bằng 0 nên góc vuông'
        }.`;
      case 'cross':
        return `Tích có hướng = u.x · v.y − u.y · v.x = ${num(/** @type {number} */ (f.cross))}. Độ lớn của nó gấp đôi diện tích tam giác, còn dấu của nó chính là câu trả lời.`;
      case 'precision':
        return f.floatTurn === exactTurn(/** @type {number} */ (f.cross))
          ? `Tính theo phần mười, tổng bằng số thực cho ${float(/** @type {number} */ (f.floatCross))}, cùng dấu với tổng chính xác.`
          : `Tính theo phần mười, tổng bằng số thực cho ${float(/** @type {number} */ (f.floatCross))}, nhưng đáp án chính xác là ${num(/** @type {number} */ (f.cross) / 100)}. Sai số làm tròn đã đổi kết luận.`;
      case 'done':
        if (f.turn === 'left')
          return `Tích có hướng ${num(/** @type {number} */ (f.cross))} > 0: c nằm bên trái a → b, ta rẽ ngược chiều kim đồng hồ.`;
        if (f.turn === 'right')
          return `Tích có hướng ${num(/** @type {number} */ (f.cross))} < 0: c nằm bên phải a → b, ta rẽ theo chiều kim đồng hồ.`;
        return 'Tích có hướng = 0: ba điểm cùng nằm trên một đường thẳng nên tam giác không có diện tích.';
    }
  },
  takeaways: [
    'Tích vô hướng u · v = u.x · v.x + u.y · v.y: dấu của nó cho biết góc giữa hai vectơ là nhọn, vuông hay tù.',
    'Tích có hướng u × v = u.x · v.y − u.y · v.x: dấu của nó cho biết v quay về phía nào so với u, còn độ lớn của nó là diện tích hình bình hành tạo bởi hai vectơ.',
    'orient(a, b, c) là tích có hướng của b − a và c − a: dương là rẽ trái, âm là rẽ phải, bằng 0 là thẳng hàng.',
    'Hãy làm việc với số nguyên khi có thể: nhân các toạ độ thập phân lên thành số nguyên thì tích có hướng chính xác. Với toạ độ nhỏ hơn khoảng 10⁹, phép tính không thể tràn số nguyên 64 bit. Epsilon chỉ là phương án dự phòng khi buộc phải dùng số thực.',
    'Chọn ví dụ “Bẫy số thực”: đáp án chính xác là thẳng hàng, nhưng số thực lại kết luận rẽ phải, lệch khoảng 10⁻¹⁷. Sau đó dời C đi một ô và xem dấu đổi thật sự.',
  ],
  complexityHead: ['Phép toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Tích vô hướng hoặc tích có hướng',
      'Thời gian O(1)',
      'Hai phép nhân và một phép cộng hoặc trừ.',
    ],
    [
      'Kiểm tra hướng quay',
      'Thời gian O(1), bộ nhớ O(1)',
      'Hai phép trừ cho mỗi vectơ, rồi một tích có hướng.',
    ],
    [
      'Tính góc bằng atan2 thay thế',
      'O(1), nhưng chậm hơn và không chính xác',
      'Hàm lượng giác trả về số thực đã làm tròn, và phép so sánh cần cẩn thận ở gần ±π.',
    ],
  ],
  nextTeaser:
    'Bài sau dùng chính phép kiểm tra hướng quay này để xét giao của hai đoạn thẳng mà không cần giải phương trình đường thẳng nào.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với a = (0, 0), b = (4, 1) và c = (1, 3), tích có hướng của b − a và c − a bằng bao nhiêu?',
      answer: 11,
      hints: ['u = (4, 1) và v = (1, 3).', 'u.x · v.y − u.y · v.x = 4 · 3 − 1 · 1.'],
      solution: 'u = (4, 1), v = (1, 3), nên tích có hướng = 12 − 1 = 11. Kết quả dương: rẽ trái.',
    },
    {
      type: 'choice',
      prompt: 'Đi từ a = (2, 2) đến b = (6, 2), rồi tiếp tục về phía c = (6, 0), em rẽ hướng nào?',
      options: ['Rẽ trái', 'Rẽ phải', 'Đi thẳng'],
      answer: 1,
      hints: [
        'Tính u = b − a và v = c − a.',
        'u = (4, 0), v = (4, −2). Tìm dấu của tích có hướng.',
      ],
      solution: 'Tích có hướng = 4 · (−2) − 0 · 4 = −8. Kết quả âm nên c nằm bên phải a → b.',
    },
    {
      type: 'number',
      prompt: 'Tích vô hướng của u = (3, 4) và v = (4, −3) bằng bao nhiêu?',
      answer: 0,
      hints: ['u.x · v.x + u.y · v.y.'],
      solution:
        '3 · 4 + 4 · (−3) = 12 − 12 = 0. Tích vô hướng bằng 0 nghĩa là hai vectơ vuông góc.',
    },
    {
      type: 'number',
      prompt: 'Tam giác có các đỉnh (1, 1), (5, 1) và (2, 4) có diện tích bằng bao nhiêu?',
      answer: 6,
      hints: ['Diện tích bằng một nửa độ lớn của tích có hướng.', 'u = (4, 0) và v = (1, 3).'],
      solution: 'Tích có hướng = 4 · 3 − 0 · 1 = 12, nên diện tích là 12 / 2 = 6.',
    },
    {
      type: 'choice',
      prompt:
        'Toạ độ các điểm của em là số thập phân, đo đến phần trăm mét. Cách nào kiểm tra ba điểm thẳng hàng đáng tin cậy nhất?',
      options: [
        'So sánh hệ số góc (b.y − a.y) / (b.x − a.x) bằng ==',
        'So sánh tích có hướng tính bằng số thực với 0 bằng ==',
        'Nhân các toạ độ lên thành số nguyên rồi kiểm tra tích có hướng chính xác',
      ],
      answer: 2,
      hints: ['Cách nào có thể lệch vì làm tròn? Cách nào chia cho 0 khi đường thẳng thẳng đứng?'],
      solution:
        'Số nguyên cho tích có hướng chính xác, nên kết quả 0 nghĩa là thẳng hàng thật sự. Hệ số góc chia cho 0 với đường thẳng đứng, còn tổng số thực có thể làm tròn một số 0 thật thành một số rất nhỏ.',
    },
  ],
};
