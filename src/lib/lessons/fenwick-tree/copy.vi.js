/** @typedef {import('$lib/algo-engine/fenwick-tree.js').FenwickFrame} FenwickFrame */
/** @typedef {import('$lib/algo-engine/fenwick-tree.js').FenwickOp} FenwickOp */

/** A signed number with a Unicode minus. @param {number} x */
const signed = (x) => (x < 0 ? `−${-x}` : String(x));

/** An increment with its sign always shown. @param {number} x */
const plusMinus = (x) => (x < 0 ? `−${-x}` : `+${x}`);

/** @param {number} i */
const low = (i) => i & -i;

export const vi = {
  slug: 'fenwick-tree',
  topic: 'range-queries',
  level: 'Trung bình',
  title: 'Cây Fenwick',
  intro:
    'Cây Fenwick, còn gọi là cây chỉ số nhị phân (BIT), giữ được tổng tiền tố (prefix sum) ngay cả khi các giá trị thay đổi. Nó chỉ là một mảng, trong đó mỗi ô lưu tổng của một khối giá trị, và độ dài khối bằng bit 1 thấp nhất của chỉ số ô. Mỗi lần đọc hay cập nhật chỉ nhảy qua tối đa khoảng log₂ n ô.',
  summary:
    'Cập nhật giá trị và đọc tổng tiền tố trong O(log n) chỉ với một mảng, nhảy giữa các ô theo bit 1 thấp nhất của chỉ số.',
  instruction:
    'Chọn chỉ số bằng cách gõ vào hoặc bấm một ô của t, rồi bấm Tổng tiền tố, Cộng hoặc Tổng đoạn và chạy từng bước. Quan sát các cung: truy vấn xoá bit thấp nhất và nhảy sang trái, cập nhật cộng bit đó và nhảy sang phải. Các thanh cho biết mỗi ô cộng những giá trị nào.',
  valuesLabel: 'Giá trị',
  indexLabel: 'Chỉ số i',
  deltaLabel: 'Lượng thay đổi (delta)',
  fromLabel: 'Từ l',
  prefixButton: 'Tổng tiền tố đến i',
  addButton: 'Cộng delta vào i',
  rangeButton: 'Tổng đoạn l..i',
  undo: 'Hoàn tác',
  reset: 'Làm lại',
  valueErrors: {
    format: 'Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 3, −1, 4.',
    range: 'Mỗi giá trị phải nằm trong khoảng từ −99 đến 99.',
    count: 'Hãy gõ từ 1 đến 16 giá trị.',
  },
  /** @param {number} n */
  indexError: (n) => `Ở đây chỉ số đếm từ 1: hãy dùng một số nguyên từ 1 đến ${n}.`,
  deltaError: 'Lượng thay đổi phải là số nguyên từ −99 đến 99.',
  rangeError: 'Một đoạn cần l ≤ i. Hãy giảm Từ l hoặc tăng Chỉ số i.',
  logFull: 'Nhật kí đã đầy (8 thao tác). Hãy hoàn tác hoặc làm lại để tiếp tục.',
  pickHint: 'Bấm một ô của t để chọn chỉ số; phím mũi tên và Enter cũng dùng được.',
  /** @param {number} i @param {number} n */
  picked: (i, n) =>
    `Chỉ số ${i} = ${i.toString(2).padStart(n.toString(2).length, '0')}: t[${i}] là tổng của a[${i - low(i) + 1}..${i}], gồm ${low(i)} giá trị.`,
  treeAria:
    'Mảng Fenwick t, chỉ số 1 đứng đầu. Mỗi ô là tổng của khối giá trị mà thanh của nó chỉ ra.',
  treeName: 't',
  valuesName: 'a',
  stopLow: '0',
  stopHigh: '> n',
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'đang chạy',
  visitedTitle: 'Các ô của t mà thao tác này chạm tới',
  /** @param {FenwickOp} op */
  opChip: (op) => {
    if (op.type === 'add') return `add(${op.i}, ${signed(op.delta)})`;
    if (op.type === 'prefix') return `prefix(${op.i})`;
    return `range(${op.l}, ${op.r})`;
  },
  /** @param {number} i @param {number} v @param {number} start @param {string} state */
  cellLabel: (i, v, start, state) =>
    `t[${i}] = ${signed(v)}, tổng của a[${start}..${i}]${state ? `, ${state}` : ''}`,
  /** @param {number} i */
  bitsLine: (i) =>
    `i = ${i} = ${i.toString(2)}₂, lowbit(${i}) = ${low(i)}, t[${i}] là tổng của a[${i - low(i) + 1}..${i}]`,
  markers: { cursor: 'i', read: '+', write: '✎', done: '✓' },
  states: {
    active: 'nơi i đang trỏ tới',
    compare: 'được đọc',
    swap: 'vừa ghi',
    path: 'đã chạm tới',
    frontier: '',
    visited: '',
    sorted: '',
  },
  legend: {
    cursor: 'i Nơi i trỏ tới sau một bước nhảy',
    read: '+ Được cộng vào tổng',
    write: '✎ Vừa ghi',
    path: '✓ Thao tác này đã chạm tới',
  },
  stats: {
    reads: 'Số ô của t đã đọc (thao tác này)',
    writes: 'Số ô của t đã ghi (thao tác này)',
    sum: 'Tổng',
  },
  /**
   * What the same operation costs without a Fenwick tree: reading a plain array, or rewriting a
   * prefix-sum array after a change.
   * @param {FenwickOp | null} op @param {number} n
   */
  plainCost(op, n) {
    if (op === null) return { label: 'Nếu không có cây', cost: '—' };
    if (op.type === 'add') {
      return { label: 'Mảng tổng tiền tố phải ghi lại', cost: String(n - op.i + 1) };
    }
    if (op.type === 'prefix') return { label: 'Mảng thường phải đọc', cost: String(op.i) };
    return { label: 'Mảng thường phải đọc', cost: String(op.r - op.l + 1) };
  },
  /** @param {FenwickFrame} f */
  sumShown: (f) => (f.result !== null ? signed(f.result) : f.target !== null ? signed(f.sum) : '—'),
  practiceTitle: 'Tự kiểm tra',
  /** @param {FenwickFrame} f @param {number} n */
  describe(f, n) {
    switch (f.kind) {
      case 'start':
        return `Cả ${n} ô của t bắt đầu bằng 0. Khi dựng, ta đẩy mỗi ô vào ô cha của nó đúng một lần.`;
      case 'build-self':
        return `t[${f.cursor}] nhận a[${f.cursor}] = ${signed(f.a[f.cursor])}, nên giờ t[${f.cursor}] = ${signed(f.t[f.cursor])}.`;
      case 'build-push':
        return `Cha của ${f.from} là ${f.from} + lowbit(${f.from}) = ${f.to}: t[${f.to}] cộng thêm t[${f.from}] và thành ${signed(f.t[f.to])}.`;
      case 'add-start':
        return `add(${f.cursor}, ${signed(/** @type {{delta: number}} */ (f.op).delta)}): a[${f.cursor}] thay đổi, nên mọi ô có khối chứa ${f.cursor} cũng phải đổi theo.`;
      case 'add-visit':
        return `t[${f.cursor}] phủ a[${f.cursor - low(f.cursor) + 1}..${f.cursor}], khối này chứa giá trị vừa đổi. Cộng ${plusMinus(/** @type {{delta: number}} */ (f.op).delta)}: t[${f.cursor}] = ${signed(f.t[f.cursor])}.`;
      case 'add-jump':
        return f.to > n
          ? `i = ${f.from} + ${low(f.from)} = ${f.to}, vượt quá n = ${n}, nên phép cập nhật dừng sau ${f.writes} lần ghi.`
          : `Cộng bit thấp nhất: i = ${f.from} + ${low(f.from)} = ${f.to}, ô tiếp theo có khối chứa chỗ thay đổi.`;
      case 'query-start':
        return f.target === 0
          ? `prefix(0) là tiền tố rỗng, nên tổng bằng 0 và không ô nào được đọc.`
          : `prefix(${f.target}): bắt đầu với sum = 0 và i = ${f.target}.`;
      case 'query-visit':
        return `t[${f.cursor}] là tổng của a[${f.cursor - low(f.cursor) + 1}..${f.cursor}], bằng ${signed(f.t[f.cursor])}. Tổng hiện tại = ${signed(f.sum)}.`;
      case 'query-jump':
        return f.to === 0
          ? `Xoá bit thấp nhất: i = ${f.from} − ${low(f.from)} = 0, nên tiền tố đã đủ.`
          : `Xoá bit thấp nhất: i = ${f.from} − ${low(f.from)} = ${f.to}, điểm cuối của phần còn thiếu, a[1..${f.to}].`;
      case 'query-end':
        return `prefix(${f.target}) = ${signed(f.sum)}.`;
      case 'range-end': {
        const op = /** @type {{l: number, r: number}} */ (f.op);
        return `a[${op.l}..${op.r}] = prefix(${op.r}) − prefix(${op.l - 1}) = ${signed(/** @type {number} */ (f.upper))} − ${signed(f.sum)} = ${signed(/** @type {number} */ (f.result))}, đọc ${f.reads} ô của t.`;
      }
      case 'done':
        return `Xong: các thao tác đọc tổng cộng ${f.totalReads} ô và ghi ${f.totalWrites} ô của t, sau khi dựng bằng ${f.buildSteps} phép cộng.`;
    }
  },
  takeaways: [
    'lowbit(i) = i & −i là bit 1 thấp nhất của i. t[i] lưu tổng a[i − lowbit(i) + 1..i], nên ô lẻ chứa một giá trị còn t[8] chứa tám giá trị.',
    'prefix(i) cộng t[i] rồi xoá bit thấp nhất, tức là lùi về khối ngay trước khối vừa đọc. Số bước bằng số bit 1 của i.',
    'add(i, delta) cộng delta vào t[i] rồi cộng thêm bit thấp nhất, tức là tiến tới khối tiếp theo có chứa i. Bit thấp nhất lớn dần sau mỗi lần, nên có tối đa ⌊log₂ n⌋ + 1 bước.',
    'Tổng đoạn bằng prefix(r) − prefix(l − 1). Chính phép trừ này khiến cách làm đúng với tổng nhưng không dùng trực tiếp được cho min hay max, vì chúng không có phép ngược.',
    'Thử tổng tiền tố và cập nhật tại chỉ số 8 với 8 giá trị: prefix(8) chỉ đọc t[8], vì 8 = 1000₂ chỉ có một bit 1. Rồi thử chỉ số 7 = 0111₂, đọc 3 ô, và so với add tại 1, ghi 4 ô.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Dựng bằng cách đẩy lên cha', 'O(n)', 'Mỗi ô tự cộng vào ô cha duy nhất của nó đúng một lần.'],
    ['prefix(i)', 'O(log n)', 'Mỗi bit 1 của i một bước, tối đa ⌊log₂ n⌋ + 1 bước.'],
    ['add(i, delta)', 'O(log n)', 'Bit thấp nhất lớn dần sau mỗi bước nhảy, cho tới khi i vượt n.'],
    ['rangeSum(l, r)', 'O(log n)', 'Hai lượt đi tính tiền tố và một phép trừ.'],
    ['Bộ nhớ', 'O(n)', 'Một mảng n ô: không con trỏ, không thêm tầng nào.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 't[12] là tổng của bao nhiêu giá trị?',
      unit: 'giá trị',
      answer: 4,
      hints: ['12 = 1100₂. Hãy tìm bit 1 thấp nhất của nó.'],
      solution: 'lowbit(12) = 4, nên t[12] là tổng của 4 giá trị a[9..12].',
    },
    {
      type: 'number',
      prompt: 'Với a = [3, 1, 4, 1, 5, 9, 2, 6] (a[1] = 3), t[6] chứa giá trị nào?',
      answer: 14,
      hints: ['6 = 110₂, nên lowbit(6) = 2 và khối gồm hai giá trị.', 'Khối phủ a[5..6].'],
      solution: 't[6] = a[5] + a[6] = 5 + 9 = 14.',
    },
    {
      type: 'number',
      prompt: 'Cùng mảng đó. Tổng đoạn a[3..7] bằng bao nhiêu?',
      answer: 21,
      hints: [
        'Dùng prefix(7) − prefix(2).',
        'prefix(7) = t[7] + t[6] + t[4] = 2 + 14 + 9, còn prefix(2) = t[2].',
      ],
      solution:
        'prefix(7) = 25 và prefix(2) = 4, nên tổng bằng 25 − 4 = 21, đúng bằng 4 + 1 + 5 + 9 + 2.',
    },
    {
      type: 'number',
      prompt: 'prefix(13) đọc bao nhiêu ô của t?',
      unit: 'ô',
      answer: 3,
      hints: ['Viết 13 ở hệ nhị phân rồi đếm số bit 1.'],
      solution: '13 = 1101₂ có ba bit 1: ta đọc t[13], t[12] và t[8], rồi i về 0.',
    },
    {
      type: 'order',
      prompt: 'Sắp xếp theo đúng thứ tự các ô mà add(5, delta) ghi vào, với n = 16.',
      items: ['t[16]', 't[6]', 't[8]', 't[5]'],
      answer: [3, 1, 2, 0],
      hints: ['Bắt đầu từ i = 5 và liên tục cộng lowbit(i).'],
      solution:
        '5 + 1 = 6, 6 + 2 = 8, 8 + 8 = 16, và 16 + 16 = 32 đã vượt n. Vậy thứ tự là t[5], t[6], t[8], t[16].',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao cây Fenwick thông thường không trả lời được min trên một đoạn a[l..r] bất kì?',
      options: [
        'Phép min không có phép ngược, nên không thể lấy prefix(r) trừ prefix(l − 1)',
        'lowbit không dùng được với số âm',
        'Mảng sẽ cần 2n ô',
        'Tính min tốn hơn O(1)',
      ],
      answer: 0,
      hints: ['Bước nào biến hai đáp án tiền tố thành đáp án cho một đoạn?'],
      solution:
        'Tổng đoạn lấy prefix(r) trừ đi prefix(l − 1). Biết min của một tiền tố dài và của một tiền tố ngắn không cho ta min của phần ở giữa, nên cần một cấu trúc khác.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo: Cây phân đoạn, cấu trúc trả lời được cả min, max lẫn tổng trên đoạn và vẫn cho phép cập nhật.',
};
