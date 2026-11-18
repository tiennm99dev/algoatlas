/** @typedef {import('$lib/algo-engine/amortized-dynamic-arrays.js').AppendFrame} AppendFrame */
/** @typedef {'accounting' | 'aggregate'} AppendMethod */

/** Whole numbers as they are, others to two decimals. @param {number} x */
const num = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2));

/** A signed coin count. @param {number} b */
const coins = (b) => (b < 0 ? `−${-b}` : String(b));

export const vi = {
  slug: 'amortized-dynamic-arrays',
  topic: 'arrays-strings',
  level: 'Trung bình',
  title: 'Phân tích khấu hao cho mảng động',
  intro:
    'Một mảng động gấp đôi khi đầy thì hầu hết các lần thêm vào cuối chỉ tốn 1 bước, nhưng lần thêm làm mảng đổi kích thước phải sao chép cả mảng. Phân tích khấu hao (amortized analysis) cho thấy các lần thêm đắt đỏ hiếm đến mức n lần thêm bất kì tốn tổng cộng dưới 3n bước, nên mỗi lần thêm là O(1) khấu hao. Ở đây không có xác suất nào: cận này đúng với mọi lần chạy.',
  summary:
    'Thu mỗi lần thêm một số xu cố định, tiêu một xu cho mỗi lần ghi và mỗi lần sao chép, rồi thấy rằng phí 3 xu giữ ống heo không bao giờ âm, còn tổng chi phí luôn dưới 3n.',
  instruction:
    'Đặt số lần thêm n và phí c cho mỗi lần thêm, rồi chạy từng bước. Mỗi lần ghi và mỗi lần sao chép lấy một xu từ ống heo. Thử c = 2 để thấy ống heo bị âm khi đổi kích thước; c = 3 thì không bao giờ. Chuyển sang “Tổng hợp” để cộng thẳng các chi phí đó.',
  appendsLabel: 'Số lần thêm n',
  chargeLabel: 'Phí c',
  appendsError: 'n phải là số nguyên từ 1 đến 64.',
  chargeError: 'c phải là số nguyên từ 1 đến 4.',
  methodLegend: 'Phương pháp',
  methods: /** @type {Record<AppendMethod, string>} */ ({
    accounting: 'Kế toán',
    aggregate: 'Tổng hợp',
  }),
  arrayTitle: 'Mảng A',
  newBlockTitle: 'Mảng A, đang sao chép sang khối gấp đôi',
  oldBlockTitle: 'Khối cũ',
  arrayAria: 'Các ô của mảng, chỉ số 0 trước',
  oldAria: 'Các ô của khối cũ đang được sao chép, chỉ số 0 trước',
  pointerSize: 'size',
  pointerI: 'i',
  spare: '·',
  /** @param {number} i @param {number | null} v @param {string} state */
  cellLabel: (i, v, state) =>
    `Chỉ số ${i}: ${v === null ? 'ô trống' : v}${state ? `, ${state}` : ''}`,
  states: { read: 'đang đọc để sao chép', written: 'vừa ghi, 1 xu' },
  legend: {
    read: 'Đọc từ khối cũ',
    written: 'Đang ghi (tiêu 1 xu)',
    spare: 'Ô trống (·)',
  },
  bankTitle: 'Ống heo',
  coin: 'xu',
  debt: 'Đang âm',
  chartTitle: 'Chi phí mỗi lần thêm và ống heo',
  chartScroller: 'Biểu đồ chi phí, cuộn ngang được',
  /** @param {number} done @param {number} n @param {number} total @param {number} bank */
  chartLabel: (done, n, total, bank) =>
    `Biểu đồ cột chi phí thật của các lần thêm từ 1 đến ${done} trong ${n} lần, tổng ${total} bước, kèm đường biểu diễn ống heo, hiện có ${coins(bank)} xu.`,
  chartLegend: {
    cost: 'Chi phí thật (ghi + sao chép)',
    now: 'Lần thêm đang chạy',
    bank: 'Ống heo sau mỗi lần thêm',
    charge: 'Phí c mỗi lần thêm',
  },
  axisOps: 'Lần thêm →',
  stats: {
    op: 'Lần thêm',
    opCost: 'Chi phí lần thêm này',
    total: 'Tổng chi phí',
    bound: 'Đã thu',
    bank: 'Ống heo',
    worst: 'Lần thêm đắt nhất',
  },
  accounting: {
    title: 'Kế toán: thu c, tiêu 1 cho mỗi bước',
    rule: 'Mỗi lần thêm bỏ c xu vào ống heo trước. Ghi phần tử mới tốn 1 xu, sao chép một phần tử khi đổi kích thước cũng tốn 1 xu. Nếu ống heo không bao giờ xuống dưới 0, chi phí thật nhiều nhất bằng c × n xu đã thu.',
    /** @param {number} charged @param {number} spent @param {number} bank */
    balance: (charged, spent, bank) => `Thu ${charged} − tiêu ${spent} = ${coins(bank)} xu.`,
    ok: 'Ống heo chưa lần nào xuống dưới 0, nên mọi lần thêm đến giờ đều được phí của chính nó trả đủ.',
    /** @param {number} op @param {number} c */
    broke: (op, c) =>
      `Ống heo bắt đầu âm ở lần thêm ${op}: phí ${c} xu quá ít để trả trước cho các lần sao chép.`,
    why: 'Vì sao 3 là đủ: mỗi phần tử mới trả 1 xu cho lần ghi của chính nó và để dành 2 xu — một xu để tự sao chép ở lần đổi kích thước sau, một xu để sao chép một phần tử cũ đã tiêu hết tiền để dành.',
  },
  aggregate: {
    title: 'Tổng hợp: cộng cả lượt chạy',
    /** @param {number} done @param {number} writes @param {number[]} resizes @param {number} copies @param {number} total */
    sum: (done, writes, resizes, copies, total) =>
      done === 0
        ? 'Tổng chi phí của n lần thêm = n lần ghi + số lần sao chép của mọi lần đổi kích thước. Mảng đổi kích thước ở các kích thước 1, 2, 4, 8, …'
        : `${done} lần thêm: ${writes} lần ghi + sao chép ${resizes.length ? resizes.join(' + ') : '0'} = ${writes} + ${copies} = ${total} bước.`,
    /** @param {number} done @param {number} total */
    bound: (done, total) =>
      done === 0
        ? 'Tổng sao chép 1 + 2 + 4 + … dừng dưới 2n, nên tổng chi phí dưới 3n.'
        : `${total} < 3 × ${done} = ${3 * done}, trung bình ${num(total / done)} bước mỗi lần thêm.`,
  },
  practiceTitle: 'Tự kiểm tra',
  /** @param {AppendFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `Một mảng động rỗng sức chứa 1 và một ống heo rỗng. Ta sẽ chạy ${f.n} lần thêm, mỗi lần thu ${f.charge} xu.`;
      case 'charge':
        return `Lần thêm ${f.op}: bỏ ${f.charge} xu vào ống heo, giờ ống heo có ${coins(f.bank)} xu.`;
      case 'allocate':
        return `Mảng đã đầy (${f.size}/${f.size}). Cấp phát một khối ${f.capacity} ô; cả ${f.size} phần tử phải được sao chép sang.`;
      case 'copy':
        return `Sao chép phần tử ${f.at}, tốn 1 xu. Ống heo: ${coins(f.bank)}${f.bank < 0 ? ' — đang âm!' : '.'}`;
      case 'grown':
        return `Đổi kích thước xong: sức chứa ${f.capacity}, ${f.opCost} lần sao chép được trả bằng tiền để dành.`;
      case 'write':
        return `Ghi ${f.cells[f.at]} vào A[${f.at}], tốn 1 xu. Lần thêm ${f.op} tốn ${f.opCost} bước; ống heo có ${coins(f.bank)} xu${f.bank < 0 ? ', đang âm' : ''}.`;
      case 'done': {
        const worst = f.costs.length ? Math.max(...f.costs) : 0;
        const verdict =
          f.firstDebt < 0
            ? `Ống heo chưa bao giờ xuống dưới 0, nên c = ${f.charge} trả đủ cho mọi lần thêm.`
            : `Ống heo bị âm ở lần thêm ${f.firstDebt}, nên c = ${f.charge} là chưa đủ.`;
        return `Xong: ${f.n} lần thêm tốn ${f.total} bước, dưới 3n = ${3 * f.n}, dù riêng một lần thêm đã tốn ${worst}. ${verdict}`;
      }
    }
  },
  takeaways: [
    'Chi phí khấu hao là tổng chi phí của một dãy thao tác chia cho độ dài dãy, xét dãy xấu nhất. Đó là một cam kết, không phải trung bình trên đầu vào ngẫu nhiên.',
    'Phương pháp tổng hợp: n lần thêm ghi n phần tử và sao chép 1 + 2 + 4 + … (các luỹ thừa của 2 nhỏ hơn n), ít hơn 2n, nên tổng dưới 3n và mỗi lần thêm là O(1) khấu hao.',
    'Phương pháp kế toán: thu mỗi lần thêm 3 xu. Một xu trả cho lần ghi, hai xu để dành cho lần đổi kích thước sau. Ống heo không bao giờ âm, nên tổng thật nhiều nhất là 3n.',
    'Chính việc gấp đôi làm nên điều này: lần đổi kích thước sau đắt gấp đôi lần trước nhưng cũng cách xa gấp đôi. Tăng thêm một số ô cố định thì n lần thêm tốn Θ(n²).',
    'Thử n = 64 với c = 2, rồi c = 3: với 2, ống heo âm ở lần thêm thứ 5; với 3, ống heo tụt về đúng 3 xu sau mỗi lần đổi kích thước nhưng không bao giờ dưới 0.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Một lần thêm, trường hợp xấu nhất',
      'Θ(n)',
      'Mảng đầy phải sao chép cả n phần tử sang khối mới.',
    ],
    [
      'n lần thêm từ mảng rỗng',
      'Θ(n) tổng cộng',
      'n lần ghi + 1 + 2 + 4 + … < 2n lần sao chép: dưới 3n.',
    ],
    [
      'Một lần thêm, khấu hao',
      'O(1)',
      'Phí 3 xu trả đủ mọi lần ghi và sao chép, ống heo không bao giờ âm.',
    ],
    ['Bộ nhớ', 'Θ(n)', 'Sức chứa nhỏ hơn 2n; các đồng xu chỉ có trong phép phân tích.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Một mảng động bắt đầu với sức chứa 1 và gấp đôi khi đầy. Tổng chi phí (ghi + sao chép) của 16 lần thêm là bao nhiêu?',
      answer: 31,
      unit: 'bước',
      hints: [
        'Các lần thêm thứ 2, 3, 5 và 9 gặp mảng đầy.',
        '16 lần ghi cộng 1 + 2 + 4 + 8 lần sao chép.',
      ],
      solution: '16 lần ghi + 15 lần sao chép = 31 bước, dưới 3 × 16 = 48.',
    },
    {
      type: 'number',
      prompt: 'Với phí 3 xu mỗi lần thêm, sau 16 lần thêm đó ống heo còn bao nhiêu xu?',
      answer: 17,
      unit: 'xu',
      hints: ['Số xu còn lại = đã thu − đã tiêu.'],
      solution:
        'Thu 3 × 16 = 48 xu và tiêu 31 xu, nên còn 17 xu. Đặt n = 16, c = 3 rồi xem ống heo để kiểm tra.',
    },
    {
      type: 'number',
      prompt: 'Nếu phí chỉ 2 xu mỗi lần thêm, ống heo bắt đầu âm ở lần thêm thứ mấy?',
      answer: 5,
      hints: [
        'Theo dõi ống heo: lần thêm 1 còn 1 xu, lần thêm 2 còn 1, lần thêm 3 còn 0.',
        'Lần thêm 5 phải sao chép 4 phần tử và ghi 1 phần tử.',
      ],
      solution:
        'Sau lần thêm 4, ống heo có 1 xu. Lần thêm 5 bỏ thêm 2 xu thành 3, rồi cần 4 lần sao chép và 1 lần ghi: 5 xu, nên ống heo kết thúc ở −2.',
    },
    {
      type: 'number',
      prompt: 'Trong 33 lần thêm, lần thêm đắt nhất tốn bao nhiêu?',
      answer: 33,
      unit: 'bước',
      hints: ['Lần đổi kích thước cuối cùng xảy ra ở lần thêm 33, khi mảng 32 ô đã đầy.'],
      solution:
        'Lần thêm 33 sao chép 32 phần tử và ghi 1: 33 bước. Một lần thêm có thể tốn Θ(n) dù chi phí khấu hao là O(1).',
    },
    {
      type: 'choice',
      prompt: 'Câu “thêm vào cuối là O(1) khấu hao” cam kết điều gì?',
      options: [
        'Mọi dãy n lần thêm tốn tổng cộng O(n)',
        'Từng lần thêm riêng lẻ đều tốn O(1)',
        'Trung bình trên đầu vào ngẫu nhiên, mỗi lần thêm tốn O(1)',
        'Sau vài lần thêm đầu, mảng không bao giờ đổi kích thước nữa',
      ],
      answer: 0,
      hints: ['Cận khấu hao nói về tổng của một dãy thao tác, không dùng xác suất.'],
      solution:
        'Nó chặn tổng: n lần thêm tốn nhiều nhất một hằng số nhân n, ở đây dưới 3n. Một lần thêm riêng lẻ vẫn có thể tốn Θ(n), và không cần giả thiết ngẫu nhiên nào.',
    },
  ],
  nextTeaser:
    'Bài sau, Hai con trỏ, dùng hai chỉ số cùng đi trên một mảng để giải trong một lượt những bài tưởng phải xét mọi cặp.',
};
