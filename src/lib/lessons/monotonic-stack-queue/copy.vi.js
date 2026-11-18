/** @typedef {import('$lib/algo-engine/monotonic-stack-queue.js').MonoFrame} MonoFrame */

/** @param {MonoFrame} f @param {number} j */
const val = (f, j) => f.items[j];

/** Values of the held indices, in order. @param {MonoFrame} f */
const heldValues = (f) => f.held.map((j) => f.items[j]).join(', ');

export const vi = {
  slug: 'monotonic-stack-queue',
  topic: 'stacks-queues',
  level: 'Nâng cao',
  title: 'Ngăn xếp đơn điệu và hàng đợi đơn điệu',
  intro:
    'Ngăn xếp đơn điệu (monotonic stack) hay hàng đợi đơn điệu (monotonic queue) giữ các giá trị của nó luôn theo thứ tự bằng cách bỏ đi mọi giá trị không thể là đáp án nữa. Mỗi cột mới pop các cột thấp hơn mà nó vượt qua, nên việc tìm phần tử lớn hơn kế tiếp của mọi phần tử, hay giá trị lớn nhất của mọi cửa sổ trượt (sliding window), chỉ cần một lượt quét từ trái sang phải: mỗi chỉ số được push một lần và pop nhiều nhất một lần, tổng cộng O(n).',
  summary:
    'Xem ngăn xếp đơn điệu tìm phần tử lớn hơn kế tiếp và hàng đợi hai đầu đơn điệu tìm giá trị lớn nhất trên cửa sổ trượt, có đếm mọi lần push và pop.',
  instruction:
    'Chọn một bài toán, tự nhập các giá trị (và k cho cửa sổ), rồi chạy từng bước. Xem một cột mới pop các cột thấp hơn ra khỏi ngăn xếp, và so sánh bộ đếm push, pop với 2n. Thử mẫu “Tăng dần” và “Giảm dần” để thấy hai trường hợp cực đoan.',
  modeLabel: 'Bài toán',
  modes: {
    'next-greater': 'Phần tử lớn hơn kế tiếp',
    'window-max': 'Lớn nhất trên cửa sổ trượt',
  },
  valuesLabel: 'Các giá trị (1 đến 99)',
  kLabel: 'Cửa sổ k',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presets: { mixed: 'Lẫn lộn', falling: 'Giảm dần', rising: 'Tăng dần', random: 'Ngẫu nhiên' },
  barsTitle: 'Các giá trị, đọc từ trái sang phải',
  stackTitle: 'Ngăn xếp đơn điệu (chỉ số)',
  dequeTitle: 'Hàng đợi hai đầu đơn điệu (chỉ số)',
  answerTitle: {
    'next-greater': 'answer[i]: giá trị lớn hơn kế tiếp (−1 nếu không có)',
    'window-max': 'Lớn nhất của cửa sổ, theo vị trí bắt đầu',
  },
  unknown: '?',
  /** @param {MonoFrame} f */
  barsLabel: (f) =>
    `Các giá trị ${f.items.join(', ')}${f.i >= 0 ? `, đang đọc chỉ số ${f.i} (${f.items[f.i]})` : ''}.`,
  /** @param {MonoFrame} f */
  heldLabel: (f) =>
    f.held.length === 0
      ? `${f.mode === 'next-greater' ? 'Ngăn xếp' : 'Hàng đợi hai đầu'} đang rỗng.`
      : f.mode === 'next-greater'
        ? `Ngăn xếp, từ đáy lên đỉnh: ${f.held.map((j) => `chỉ số ${j} (${f.items[j]})`).join(', ')}.`
        : `Hàng đợi hai đầu, từ đầu đến cuối: ${f.held.map((j) => `chỉ số ${j} (${f.items[j]})`).join(', ')}.`,
  /** @param {MonoFrame} f */
  answerLabel: (f) =>
    `${f.mode === 'next-greater' ? 'Đáp án lớn hơn kế tiếp' : 'Lớn nhất của các cửa sổ'}: ${f.answer
      .map((a) => (a === null ? 'chưa biết' : a))
      .join(', ')}.`,
  /** @param {number} j @param {number} v */
  heldItem: (j, v) => `a[${j}]=${v}`,
  stats: {
    pushes: 'Số lần push',
    pops: 'Số lần pop',
    comparisons: 'Số lần so sánh',
    bound: 'Push + pop, nhiều nhất 2n',
  },
  valueErrors: {
    format: 'Ngăn cách các số nguyên bằng dấu phẩy hoặc dấu cách.',
    range: 'Các giá trị phải từ 1 đến 99.',
    count: 'Chỉ dùng tối đa 12 giá trị.',
  },
  /** @param {number} n */
  kError: (n) => `k phải là số nguyên từ 1 đến ${n}, tức số lượng giá trị.`,
  markers: { active: '▸', compare: '?', swap: '×' },
  legend: {
    active: 'Giá trị vừa đến a[i]',
    compare: 'Được so sánh với a[i]',
    swap: 'Đã pop',
    frontier: 'Đang được giữ trong cấu trúc',
    outside: 'Nằm ngoài cửa sổ (làm mờ)',
    unread: 'Chưa đọc (làm mờ)',
  },
  /** @param {MonoFrame} f */
  describe(f) {
    const v = f.i >= 0 ? val(f, f.i) : 0;
    const ng = f.mode === 'next-greater';
    switch (f.kind) {
      case 'start':
        return ng
          ? 'Quét từ trái sang phải. Ngăn xếp giữ các chỉ số còn đang chờ một giá trị lớn hơn; giá trị của chúng không bao giờ tăng khi đi lên đỉnh.'
          : `Quét từ trái sang phải với cửa sổ k = ${f.k}. Hàng đợi hai đầu giữ các chỉ số có giá trị giảm dần từ đầu đến cuối, nên đầu hàng là giá trị lớn nhất.`;
      case 'read':
        return `a[${f.i}] = ${v} đến.`;
      case 'compare': {
        const x = val(f, f.compared);
        if (ng)
          return f.smaller
            ? `Đỉnh là a[${f.compared}] = ${x}, nhỏ hơn ${v}: ${v} là phần tử lớn hơn kế tiếp của nó.`
            : `Đỉnh là a[${f.compared}] = ${x}, không nhỏ hơn ${v}: dừng pop.`;
        return f.smaller
          ? `Cuối hàng là a[${f.compared}] = ${x} ≤ ${v}: chừng nào ${v} còn trong cửa sổ, ${x} không bao giờ là giá trị lớn nhất.`
          : `Cuối hàng là a[${f.compared}] = ${x} > ${v}: sau này nó vẫn có thể là giá trị lớn nhất, nên dừng.`;
      }
      case 'pop': {
        const j = f.popped[0];
        return ng
          ? `Pop chỉ số ${j} và ghi answer[${j}] = ${v}. Nó bị bỏ hẳn.`
          : `Pop chỉ số ${j} (${val(f, j)}) ở cuối hàng. Nó bị bỏ hẳn.`;
      }
      case 'push':
        return `Push chỉ số ${f.i}. Các giá trị đang giữ: ${heldValues(f)}${ng ? ', không bao giờ tăng.' : ', giảm dần.'}`;
      case 'expire': {
        const j = f.popped[0];
        return `Chỉ số ${j} đã trượt ra khỏi cửa sổ a[${f.i - f.k + 1}..${f.i}]: pop nó ở đầu hàng.`;
      }
      case 'emit': {
        const start = f.i - f.k + 1;
        return `Cửa sổ a[${start}..${f.i}] đã đủ: giá trị lớn nhất của nó ở đầu hàng, a[${f.held[0]}] = ${val(f, f.held[0])}.`;
      }
      case 'leftover':
        return `Quét xong. Không có giá trị lớn hơn nào đến sau chỉ số ${f.held.join(', ')}: đáp án −1.`;
      case 'done': {
        const n = f.items.length;
        return `Xong. ${f.pushes} lần push và ${f.pops} lần pop: ${f.pushes + f.pops} ≤ 2n = ${2 * n}, nên cả lượt quét là O(n).`;
      }
    }
  },
  takeaways: [
    'Ngăn xếp hay hàng đợi hai đầu đơn điệu giữ các giá trị luôn có thứ tự bằng cách, trước mỗi lần push, pop mọi giá trị mà giá trị mới làm cho vô dụng.',
    'Phần tử lớn hơn kế tiếp: giữ một ngăn xếp có giá trị không bao giờ tăng. Giá trị mới pop mọi giá trị nhỏ hơn và chính là đáp án của chúng; những gì còn lại ở cuối thì không có (−1).',
    'Lớn nhất trên cửa sổ trượt: giữ một hàng đợi hai đầu có giá trị giảm dần. Pop ở cuối hàng các giá trị ≤ giá trị mới, pop ở đầu hàng khi nó rời khỏi cửa sổ, và đọc giá trị lớn nhất ở đầu hàng.',
    'Một bước có thể pop nhiều giá trị, nhưng mỗi chỉ số chỉ được push một lần và pop nhiều nhất một lần, nên cả n bước cộng lại tốn O(n): O(1) khấu hao mỗi bước.',
    'Với bài phần tử lớn hơn kế tiếp, chọn mẫu “Tăng dần” rồi “Giảm dần”: đếm số lần pop mỗi lần và xem công việc dồn vào đâu.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Phần tử lớn hơn kế tiếp', 'O(n)', 'Tổng cộng n lần push và nhiều nhất n lần pop.'],
    [
      'Lớn nhất trên cửa sổ trượt',
      'O(n)',
      'Mỗi chỉ số vào hàng đợi hai đầu một lần và ra nhiều nhất một lần.',
    ],
    [
      'Một bước, trường hợp xấu nhất',
      'O(n)',
      'Một giá trị lớn có thể pop nhiều giá trị một lúc, nhưng mỗi giá trị chỉ một lần: O(1) khấu hao.',
    ],
    ['Vét cạn', 'O(n·k)', 'Quét lại mọi cửa sổ; O(n²) với bài lớn hơn kế tiếp.'],
    ['Bộ nhớ thêm', 'O(n)', 'Ngăn xếp có thể chứa cả n giá trị; hàng đợi hai đầu nhiều nhất k.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Các giá trị 4, 2, 7, 3, 1, 5, 8, 6. Phần tử lớn hơn kế tiếp của số 3 (chỉ số 3) là bao nhiêu?',
      answer: 5,
      hints: ['Tìm bên phải chỉ số 3 giá trị đầu tiên lớn hơn hẳn 3.'],
      solution:
        'Bên phải số 3 là 1 (nhỏ hơn) rồi đến 5. Khi chạy, 5 đến, pop 1 rồi pop 3, ghi 5 cho cả hai.',
    },
    {
      type: 'number',
      prompt:
        'Với cùng các giá trị đó, lượt quét tìm phần tử lớn hơn kế tiếp pop tổng cộng bao nhiêu lần?',
      answer: 6,
      unit: 'lần',
      hints: ['Một chỉ số bị pop đúng lúc nó nhận được một đáp án khác −1.'],
      solution:
        'Các đáp án là 7, 7, 8, 5, 5, 8, −1, −1. Sáu chỉ số có đáp án thật, nên có sáu lần pop. Chọn mẫu “Lẫn lộn” để kiểm tra.',
    },
    {
      type: 'number',
      prompt:
        'Các giá trị 4, 2, 7, 3, 1, 5, 8, 6 với k = 3. Giá trị lớn nhất của cửa sổ bắt đầu ở chỉ số 3 là bao nhiêu?',
      answer: 5,
      hints: ['Cửa sổ đó là a[3..5].'],
      solution:
        'a[3..5] = 3, 1, 5, nên giá trị lớn nhất là 5. Lớn nhất của mọi cửa sổ: 7, 7, 7, 5, 8, 8.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao cả lượt quét tìm phần tử lớn hơn kế tiếp là O(n) dù một bước có thể pop nhiều giá trị?',
      options: [
        'Mỗi chỉ số được push một lần và pop nhiều nhất một lần',
        'Ngăn xếp không bao giờ chứa quá hai giá trị',
        'Các giá trị được sắp xếp trước',
      ],
      answer: 0,
      hints: ['Đếm tổng số lần push và pop trong cả lượt chạy, không phải trong từng bước.'],
      solution:
        'Tổng cộng có n lần push và nhiều nhất n lần pop, nên công việc của mọi bước cộng lại chỉ khoảng 2n: O(1) khấu hao cho mỗi giá trị.',
    },
  ],
  nextTeaser:
    'Bài sau, Luyện tập: ngăn xếp và hàng đợi, ghép hai ngăn xếp thành một hàng đợi và dựng một ngăn xếp luôn biết giá trị nhỏ nhất.',
};
