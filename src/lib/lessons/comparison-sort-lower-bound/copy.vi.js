/** @typedef {import('$lib/algo-engine/comparison-sort-lower-bound.js').TreeFrame} TreeFrame */
/** @typedef {import('$lib/algo-engine/comparison-sort-lower-bound.js').DecisionNode} DecisionNode */

const NAMES = ['A', 'B', 'C'];

/** @param {number[]} order */
const chain = (order) => order.map((i) => NAMES[i]).join(' < ');

/** @param {[number, number]} pair */
const question = ([x, y]) => `${NAMES[x]} < ${NAMES[y]}`;

export const vi = {
  slug: 'comparison-sort-lower-bound',
  topic: 'sorting',
  level: 'Nâng cao',
  title: 'Cận dưới của sắp xếp bằng so sánh',
  intro:
    'Mọi thuật toán sắp xếp ta gặp đến giờ chỉ biết về đầu vào bằng cách so sánh hai phần tử. Hãy vẽ mọi câu hỏi nó có thể đặt ra thành một cây nhị phân: mỗi nút trong là một phép so sánh, mỗi lá là một thứ tự đã sắp xếp có thể xảy ra. Vì n phần tử có thể đến theo n! thứ tự, cây cần ít nhất n! lá, nên có một đường đi sâu ít nhất log₂ n!. Đó là lí do không thuật toán sắp xếp bằng so sánh nào nhanh hơn n log n trong trường hợp xấu nhất.',
  summary:
    'Đi theo cây quyết định của một thuật toán sắp xếp bằng so sánh trên ba phần tử, đếm số lá và độ sâu, và xem vì sao mọi thuật toán sắp xếp bằng so sánh đều cần Ω(n log n) phép so sánh.',
  instruction:
    'Chọn một thuật toán và một thứ tự đầu vào bí mật, rồi đi xuống cây: mỗi bước hỏi một câu. Bấm vào một lá bất kì để lấy thứ tự của lá đó làm thứ tự bí mật. Bên dưới cây, đổi n để xem n! và cận dưới tăng nhanh thế nào.',
  algorithmLabel: 'Thuật toán',
  algorithms: { insertion: 'Sắp xếp chèn', selection: 'Sắp xếp chọn' },
  orderLabel: 'Thứ tự đầu vào bí mật',
  chain,
  treeTitle: 'Cây quyết định cho ba phần tử A, B, C',
  /** @param {string} algo @param {number} leaves @param {number} height */
  treeAria: (algo, leaves, height) =>
    `Cây quyết định của ${algo.toLowerCase()} trên ba phần tử: ${leaves} lá đến được, ${height} phép so sánh trên đường đi dài nhất.`,
  treeNote:
    'Mỗi vòng tròn hỏi “x < y?”: cạnh trái là có, cạnh phải là không. Số dưới một câu hỏi đếm các thứ tự đầu vào còn có thể đến đó. Mỗi lá liệt kê các phần tử từ nhỏ đến lớn.',
  yes: 'có',
  no: 'không',
  impossibleLabel: '✕',
  /** @param {DecisionNode} d @param {string} role */
  nodeAria(d, role) {
    const tail = role ? `, ${role}` : '';
    if (d.kind === 'compare' && d.pair)
      return `Câu hỏi: có ${question(d.pair)} không? ${d.possible} thứ tự có thể đến đây${tail}`;
    if (d.kind === 'leaf' && d.order) return `Lá: ${chain(d.order)}${tail}`;
    return `Lá không thể xảy ra: không thứ tự đầu vào nào cho các câu trả lời này${tail}`;
  },
  roles: { current: 'đang xét', path: 'trên đường đi', found: 'đáp án' },
  notLeafNotice: 'Bấm vào một lá để chọn thứ tự của nó làm đầu vào bí mật.',
  impossibleNotice:
    'Không thứ tự đầu vào nào đến được lá này: các câu trả lời của nó mâu thuẫn nhau.',
  /** @param {string} order */
  pickedNotice: (order) => `Đã đặt thứ tự bí mật là ${order}. Đi xuống để đến lá của nó.`,
  stats: {
    comparisons: 'Số phép so sánh đến giờ',
    possible: 'Số thứ tự còn có thể',
    height: 'Xấu nhất (chiều cao cây)',
    leaves: 'Lá đến được / không thể',
  },
  /** @param {number} reachable @param {number} impossible */
  leavesValue: (reachable, impossible) => `${reachable} / ${impossible}`,
  boundTitle: 'Cận dưới cho n phần tử',
  boundN: 'n',
  boundError: 'n phải là số nguyên từ 1 đến 20.',
  boundRows: {
    orders: 'Số thứ tự đầu vào, n!',
    log: 'log₂ n!',
    bound: 'Xấu nhất ít nhất ⌈log₂ n!⌉',
    nlogn: 'n·log₂ n, để đối chiếu',
  },
  /** @param {bigint} v */
  bigNumber: (v) => v.toString(),
  /** @param {number} v */
  decimal: (v) => v.toFixed(2),
  legend: {
    current: 'Vị trí đang đi tới',
    path: 'Các câu hỏi đã trả lời',
    found: 'Lá đã đến',
    impossible: 'Lá không thể xảy ra',
  },
  markers: { current: '▼', found: '✓', impossible: '✕' },
  /** @param {TreeFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return 'Thứ tự bí mật là một trong 3! = 6 thứ tự. Thuật toán chỉ được hỏi “x < y?”, và mỗi câu trả lời loại bớt một số thứ tự.';
      case 'compare': {
        const pair = /** @type {[number, number]} */ (f.pair);
        const left =
          f.possible === 1
            ? 'Giờ chỉ còn 1 thứ tự phù hợp: đã biết đáp án.'
            : `Còn ${f.possible}/6 thứ tự phù hợp.`;
        return `Có ${question(pair)} không? ${f.answer ? 'Có' : 'Không'}. ${left}`;
      }
      case 'done':
        return f.order
          ? `Đến lá sau ${f.comparisons} phép so sánh: thứ tự đã sắp xếp là ${chain(f.order)}.`
          : 'Đã đi hết.';
    }
  },
  takeaways: [
    'Một thuật toán sắp xếp bằng so sánh là một cây quyết định: thứ tự đầu vào quyết định nó nhận được những câu trả lời nào, và vì thế dừng ở lá nào.',
    'Một thuật toán sắp xếp đúng phải đến một lá khác nhau cho mỗi thứ tự trong n! thứ tự đầu vào, nên cây của nó có ít nhất n! lá.',
    'Một cây nhị phân có chiều cao h có nhiều nhất 2ʰ lá, nên h ≥ log₂ n!. Vì log₂ n! ≈ n log₂ n − 1,44n, mọi thuật toán sắp xếp bằng so sánh đều cần Ω(n log n) phép so sánh trong trường hợp xấu nhất.',
    'Cận dưới này chỉ đếm phép so sánh. Sắp xếp đếm (counting sort) và sắp xếp theo cơ số (radix sort) nhìn vào các chữ số của khoá, nên chúng không bị cận này ràng buộc.',
    'Chuyển sang sắp xếp chọn: nó luôn hỏi 3 câu, đôi khi hỏi cả câu mà nó đã biết đáp án, và phí hai lá cho những câu trả lời không thể xảy ra.',
  ],
  complexityHead: ['Sự kiện', 'Giá trị', 'Vì sao'],
  complexity: [
    ['Số thứ tự đầu vào của n phần tử khác nhau', 'n!', 'Mỗi thứ tự phải dừng ở lá riêng của nó.'],
    ['Số lá của cây nhị phân chiều cao h', '≤ 2ʰ', 'Mỗi tầng nhiều nhất làm số lá gấp đôi.'],
    [
      'Số phép so sánh xấu nhất, mọi thuật toán sắp xếp bằng so sánh',
      'Ω(n log n)',
      'h ≥ log₂ n! ≈ n log₂ n − 1,44n.',
    ],
    [
      'Sắp xếp trộn và sắp xếp vun đống',
      'O(n log n)',
      'Chúng đạt đúng cận dưới, nên là tối ưu nếu bỏ qua hằng số.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Một cây quyết định sắp xếp 4 phần tử khác nhau. Nó phải có ít nhất bao nhiêu lá?',
      answer: 24,
      unit: 'lá',
      hints: ['Mỗi thứ tự đầu vào cần một lá riêng. 4 phần tử có bao nhiêu thứ tự?'],
      solution: '4! = 4 × 3 × 2 × 1 = 24 thứ tự, nên cần ít nhất 24 lá.',
    },
    {
      type: 'number',
      prompt:
        'Trong trường hợp xấu nhất, một thuật toán sắp xếp bằng so sánh cần ít nhất bao nhiêu phép so sánh để sắp xếp 5 phần tử khác nhau?',
      answer: 7,
      unit: 'phép so sánh',
      hints: ['Cây cần 5! = 120 lá.', 'Tìm h nhỏ nhất sao cho 2ʰ ≥ 120.'],
      solution:
        '2⁶ = 64 < 120 ≤ 128 = 2⁷, nên chiều cao ít nhất là ⌈log₂ 120⌉ = 7. Thực tế, bảy phép so sánh là đủ cho 5 phần tử.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao cây phải có chiều cao ít nhất log₂ n!?',
      options: [
        'Cây nhị phân chiều cao h có nhiều nhất 2ʰ lá, mà cây cần n! lá',
        'Mọi thuật toán sắp xếp bằng so sánh đều chạy sắp xếp trộn bên trong',
        'Mỗi phép so sánh loại được nhiều nhất một thứ tự',
        'Cây phải cân bằng hoàn hảo',
      ],
      answer: 0,
      hints: ['Một cây có chiều cao 1, 2, 3 có nhiều nhất bao nhiêu lá?'],
      solution:
        'Mỗi tầng nhiều nhất làm số lá gấp đôi, nên chiều cao h cho phép nhiều nhất 2ʰ lá. Cần n! lá thì 2ʰ ≥ n!, nên h ≥ log₂ n!.',
    },
    {
      type: 'number',
      prompt:
        'Cây của sắp xếp chèn cho ba phần tử có các lá ở độ sâu 2, 3, 3, 3, 3 và 2. Tính trung bình trên 6 thứ tự đầu vào, nó làm bao nhiêu phép so sánh? Làm tròn đến hai chữ số thập phân.',
      answer: 2.67,
      tolerance: 0.01,
      unit: 'phép so sánh',
      hints: ['Cộng sáu độ sâu rồi chia cho 6.'],
      solution:
        '(2 + 3 + 3 + 3 + 3 + 2) / 6 = 16 / 6 ≈ 2.67. Số trung bình này cũng không thể nhỏ hơn log₂ 6 ≈ 2.58.',
    },
    {
      type: 'choice',
      prompt: 'Thuật toán sắp xếp nào dưới đây không bị cận Ω(n log n) giới hạn?',
      options: [
        'Sắp xếp vun đống',
        'Sắp xếp trộn',
        'Sắp xếp đếm trên các khoá nguyên nhỏ',
        'Sắp xếp nhanh',
      ],
      answer: 2,
      hints: ['Cận dưới chỉ áp dụng cho các thuật toán biết về khoá bằng cách so sánh chúng.'],
      solution:
        'Sắp xếp đếm không bao giờ so sánh hai khoá: nó dùng mỗi khoá làm chỉ số mảng. Các thuật toán còn lại đều sắp xếp bằng so sánh, nên cần Ω(n log n) phép so sánh trong trường hợp xấu nhất.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo là sắp xếp đếm và sắp xếp theo cơ số: hai cách vượt qua cận n log n bằng cách không so sánh khoá.',
};
