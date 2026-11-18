/** @typedef {import('$lib/algo-engine/static-dynamic-arrays.js').ArrayFrame} ArrayFrame */
/** @typedef {import('$lib/algo-engine/static-dynamic-arrays.js').Growth} Growth */

/** Two decimal places unless whole, as on the steps-per-push card. @param {number} x */
const num = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2));

export const vi = {
  slug: 'static-dynamic-arrays',
  topic: 'arrays-strings',
  level: 'Cơ bản',
  title: 'Mảng tĩnh và mảng động',
  intro:
    'Mảng lưu các phần tử nằm sát nhau trong một khối bộ nhớ, nên địa chỉ của phần tử i bằng địa chỉ đầu khối cộng i nhân kích thước một phần tử. Nhờ vậy, đọc một chỉ số bất kì chỉ mất một bước. Mảng tĩnh có sức chứa cố định; mảng động (dynamic array) thì lớn lên bằng cách chuyển toàn bộ sang một khối lớn hơn mỗi khi hết chỗ.',
  summary:
    'Thêm giá trị vào cuối một mảng tĩnh hoặc mảng động, xem mảng đầy cấp phát một khối lớn hơn rồi sao chép từng phần tử sang, và đọc một chỉ số bất kì chỉ bằng một phép tính địa chỉ.',
  instruction:
    'Chọn quy tắc tăng, sức chứa ban đầu và số lần thêm, rồi chạy từng bước. Để ý các ô trống cạn dần, số lần sao chép nhảy lên mỗi khi đổi kích thước, và khối dời sang địa chỉ mới. Bấm vào một ô đang chứa giá trị để tính địa chỉ của nó.',
  growthLegend: 'Quy tắc tăng',
  growths: /** @type {Record<Growth, string>} */ ({
    static: 'Tĩnh',
    double: 'Gấp đôi',
    'plus-one': 'Thêm 1',
  }),
  capacityLabel: 'Sức chứa ban đầu',
  pushesLabel: 'Số lần thêm n',
  capacityError: 'Sức chứa ban đầu phải là số nguyên từ 1 đến 8.',
  pushesError: 'Số lần thêm phải là số nguyên từ 0 đến 24.',
  blockA: 'Mảng A',
  blockB: 'Khối mới B',
  /** @param {number} base @param {number} cap @param {number} bytes */
  blockLine: (base, cap, bytes) =>
    `Bắt đầu ở địa chỉ ${base}, ${cap} ô × ${bytes} byte = ${cap * bytes} byte`,
  blockAria: 'Các ô của mảng A, chỉ số 0 trước',
  blockBAria: 'Các ô của khối mới B, chỉ số 0 trước',
  pointerSize: 'size',
  pointerI: 'i',
  spare: '·',
  /** @param {number} i @param {number | null} value @param {number} address @param {string} state */
  cellLabel: (i, value, address, state) =>
    `Chỉ số ${i} ở địa chỉ ${address}: ${value === null ? 'ô trống' : value}${state ? `, ${state}` : ''}`,
  states: { read: 'đang đọc để sao chép', written: 'vừa ghi' },
  legend: {
    stored: 'Phần tử đã lưu',
    spare: 'Ô trống (đánh dấu ·)',
    read: 'Đọc từ A',
    written: 'Vừa ghi',
  },
  stats: {
    size: 'Kích thước / sức chứa',
    spare: 'Số ô trống',
    opCopies: 'Sao chép ở lần thêm này',
    copies: 'Tổng số lần sao chép',
    resizes: 'Số lần đổi kích thước',
    average: 'Số bước mỗi lần thêm',
  },
  readTitle: 'Đọc một chỉ số trong O(1)',
  readHint: 'Bấm hoặc nhấn Enter trên một ô đang chứa giá trị của A để tính xem nó nằm ở đâu.',
  /** @param {number} i @param {number} base @param {number} bytes @param {number} address @param {number} value */
  readLine: (i, base, bytes, address, value) =>
    `A[${i}] nằm ở ${base} + ${bytes} × ${i} = ${address}. Một phép nhân, một phép cộng và một lần đọc bộ nhớ cho ra ${value}, dù mảng dài bao nhiêu.`,
  /** @param {number} i */
  readSpare: (i) => `Chỉ số ${i} là ô trống: nó chưa chứa gì, nên đọc nó là lỗi.`,
  pushesTitle: 'Các giá trị được thêm',
  pushesEmpty: 'chưa có',
  pushesHot: 'đang thêm',
  practiceTitle: 'Tự kiểm tra',
  /** @param {ArrayFrame} f */
  describe(f) {
    const kind = f.growth === 'static' ? 'tĩnh' : 'động';
    switch (f.kind) {
      case 'start':
        return f.n === 0
          ? `Một mảng ${kind} rỗng, sức chứa ${f.capacity}, ở địa chỉ ${f.base}. Không có lần thêm nào để chạy.`
          : `Một mảng ${kind} rỗng, sức chứa ${f.capacity}, ở địa chỉ ${f.base}. Ta sẽ thêm ${f.n} giá trị: 10, 20, 30, …`;
      case 'write':
        return `Lần thêm ${f.op}: ghi ${f.value} vào A[${f.at}] và tăng size lên ${f.size}. ${f.opCopies === 0 ? 'Còn ô trống, nên lần thêm này tốn 1 bước.' : `Cộng cả ${f.opCopies} lần sao chép, lần thêm này tốn ${f.opCopies + 1} bước.`}`;
      case 'full':
        return `Lần thêm ${f.op}: size ${f.size} bằng sức chứa ${f.capacity}. Mảng tĩnh không lớn lên được, nên ${f.value} bị từ chối, ${f.refused === 1 ? 'và không còn lần thêm nào sau nó' : `cùng ${f.refused - 1} lần thêm sau nó`}.`;
      case 'allocate':
        return `Lần thêm ${f.op}: A đã đầy (${f.size}/${f.capacity}). Cấp phát khối B gồm ${f.next?.length ?? 0} ô ở địa chỉ ${f.nextBase}; vùng nhớ ngay sau A có thể đã bị dùng, nên mảng không thể cứ thế nối dài tại chỗ.`;
      case 'copy':
        return `Sao chép A[${f.at}] = ${f.cells[f.at]} sang B[${f.at}]. Lần thêm này đã sao chép ${f.opCopies} lần.`;
      case 'free':
        return `Cả ${f.size} phần tử đã sang khối mới. Giải phóng khối cũ: A giờ bắt đầu ở ${f.base}, sức chứa ${f.capacity}.`;
      case 'done': {
        const stored = f.writes;
        const steps = f.writes + f.copies;
        if (f.refused > 0)
          return `Xong: lưu được ${stored} giá trị, ${f.refused} lần thêm bị từ chối vì mảng tĩnh đã đầy.`;
        return stored === 0
          ? 'Xong: không có giá trị nào được thêm.'
          : `Xong: ${stored} lần thêm gồm ${f.writes} lần ghi và ${f.copies} lần sao chép qua ${f.resizes} lần đổi kích thước, trung bình ${num(steps / stored)} bước mỗi lần thêm.`;
      }
    }
  },
  takeaways: [
    'Mảng là một khối liền: phần tử i nằm ở base + i × kích thước phần tử, nên đọc hay ghi một chỉ số bất kì đều là O(1), không phải đi từ đầu mảng.',
    'Sức chứa của mảng tĩnh cố định từ lúc tạo. Khi size bằng sức chứa, lần thêm tiếp theo không còn chỗ.',
    'Mảng động giữ sẵn ô trống. Khi hết ô trống, nó cấp phát khối lớn hơn, sao chép cả size phần tử sang rồi giải phóng khối cũ, nên riêng lần thêm đó tốn Θ(n).',
    'Gấp đôi khiến việc đổi kích thước hiếm: từ sức chứa 1, 17 lần thêm chỉ sao chép 1 + 2 + 4 + 8 + 16 = 31 phần tử. Tăng từng ô một thì gần như lần nào cũng sao chép, tổng cộng 1 + 2 + … + (n − 1), tức Θ(n²).',
    'Thử 24 lần thêm từ sức chứa 1 với “Gấp đôi”, rồi với “Thêm 1”, và so sánh tổng số lần sao chép cùng số bước mỗi lần thêm.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Đọc hoặc ghi A[i]', 'O(1)', 'Một phép tính địa chỉ: base + i × kích thước phần tử.'],
    ['Thêm khi còn ô trống', 'O(1)', 'Ghi A[size] rồi tăng size thêm 1.'],
    ['Thêm vào mảng đã đầy', 'Θ(n)', 'Cấp phát khối mới và sao chép cả n phần tử sang.'],
    [
      'n lần thêm, gấp đôi',
      'Θ(n) tổng cộng',
      'Sao chép 1 + 2 + 4 + … < 2n, nên mỗi lần thêm là O(1) khấu hao.',
    ],
    ['n lần thêm, tăng từng ô', 'Θ(n²) tổng cộng', 'Sao chép 1 + 2 + … + (n − 1) = n(n − 1)/2.'],
    ['Bộ nhớ', 'Θ(n)', 'Gấp đôi thì nhiều nhất khoảng một nửa số ô còn trống.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Một mảng gấp đôi bắt đầu với sức chứa 1. 17 lần thêm sao chép tổng cộng bao nhiêu phần tử?',
      answer: 31,
      unit: 'lần sao chép',
      hints: [
        'Mảng đổi kích thước khi một lần thêm gặp size = sức chứa: ở các kích thước 1, 2, 4, 8 và 16.',
        'Mỗi lần đổi kích thước sao chép đúng size hiện tại: 1 + 2 + 4 + 8 + 16.',
      ],
      solution:
        'Các lần thêm thứ 2, 3, 5, 9 và 17 gặp mảng đầy và sao chép 1, 2, 4, 8 và 16 phần tử: 31 lần sao chép, ít hơn 2 × 17.',
    },
    {
      type: 'number',
      prompt: 'Sau 17 lần thêm đó, mảng gấp đôi còn bao nhiêu ô trống? (Sức chứa trừ size.)',
      answer: 15,
      unit: 'ô',
      hints: ['Lần thêm thứ 17 nhân đôi sức chứa từ 16 lên 32.'],
      solution: 'Sức chứa là 32 và size là 17, nên còn 32 − 17 = 15 ô trống.',
    },
    {
      type: 'number',
      prompt: 'Một mảng số nguyên 4 byte bắt đầu ở địa chỉ 1000. A[6] bắt đầu ở địa chỉ nào?',
      answer: 1024,
      hints: ['Địa chỉ = base + i × kích thước phần tử.'],
      solution:
        '1000 + 6 × 4 = 1024. Cùng một phép tính ấy dùng được cho mọi chỉ số, vì vậy truy cập theo chỉ số là O(1).',
    },
    {
      type: 'number',
      prompt:
        'Một mảng tăng từng ô một, bắt đầu từ sức chứa 1. 8 lần thêm sao chép bao nhiêu phần tử?',
      answer: 28,
      unit: 'lần sao chép',
      hints: [
        'Mọi lần thêm sau lần đầu đều gặp mảng đầy.',
        'Lần thêm thứ k sao chép k − 1 phần tử: 1 + 2 + … + 7.',
      ],
      solution:
        'Các lần thêm từ 2 đến 8 sao chép 1, 2, …, 7 phần tử: 7 × 8 / 2 = 28 lần sao chép. Với cùng 8 lần thêm, gấp đôi từ sức chứa 1 chỉ cần 1 + 2 + 4 = 7.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao đọc A[i] là O(1) dù mảng dài bao nhiêu?',
      options: [
        'Địa chỉ của nó là base + i × kích thước phần tử, tính trong một bước',
        'Máy tính kiểm tra mọi phần tử cùng lúc',
        'Mảng giữ một bảng chỉ mục đã sắp xếp của các phần tử',
        'Chỉ mảng ngắn mới đọc được trong O(1)',
      ],
      answer: 0,
      hints: ['Phần tử i nằm ở đâu so với phần tử 0?'],
      solution:
        'Các phần tử nằm sát nhau, nên địa chỉ của A[i] suy ra từ địa chỉ đầu bằng một phép nhân và một phép cộng.',
    },
  ],
  nextTeaser:
    'Gấp đôi có lúc tốn cả Θ(n) cho một lần thêm, vậy tính chung thì sao? Bài sau, Phân tích khấu hao cho mảng động, trả lời câu hỏi đó.',
};
