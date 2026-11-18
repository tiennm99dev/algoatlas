/** @typedef {import('$lib/algo-engine/sparse-table.js').SparseFrame} SparseFrame */
/** @typedef {import('$lib/algo-engine/sparse-table.js').SparseOp} SparseOp */

/** @param {SparseOp} op */
const opName = (op) => op;

export const vi = {
  slug: 'sparse-table',
  topic: 'range-queries',
  level: 'Trung bình',
  title: 'Bảng thưa',
  intro:
    'Bảng thưa (sparse table) trả lời câu hỏi “giá trị nhỏ nhất trên một đoạn” của một mảng không bao giờ thay đổi. Nó lưu sẵn đáp án cho mọi khối có độ dài là luỹ thừa của 2, rồi phủ một đoạn bất kì bằng hai khối như vậy. Hai khối có thể chồng lên nhau, nhưng với min thì điều đó vô hại, nên mỗi truy vấn chỉ tốn O(1).',
  summary:
    'Dựng bảng các khối độ dài luỹ thừa của 2 trong O(n log n), rồi trả lời truy vấn min, max hoặc ƯCLN trên đoạn trong O(1) bằng hai khối chồng nhau.',
  instruction:
    'Bấm vào hai ô của mảng (hoặc gõ l và r) để chọn một đoạn và xem hai khối phủ nó. Bấm vào một ô của bảng để xem nó lưu khối nào. Lùi lại từng bước để xem bảng được dựng ra sao, rồi chuyển sang Tổng để thấy vì sao phần chồng nhau làm sai kết quả.',
  opLegend: 'Phép toán',
  ops: /** @type {Record<SparseOp, string>} */ ({
    min: 'Min',
    max: 'Max',
    gcd: 'ƯCLN',
    sum: 'Tổng',
  }),
  valuesLabel: 'Giá trị',
  lLabel: 'Từ l',
  rLabel: 'Đến r',
  valueErrors: {
    format: 'Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 5, 2, 4.',
    range: 'Mỗi giá trị phải nằm trong khoảng từ 0 đến 99.',
    count: 'Hãy gõ từ 1 đến 16 giá trị.',
  },
  /** @param {number} n */
  rangeError: (n) => `l và r phải là số nguyên với 0 ≤ l ≤ r ≤ ${n - 1}.`,
  pickHint: 'Bấm một ô để bắt đầu đoạn, rồi bấm ô khác để kết thúc. Phím Enter cũng dùng được.',
  /** @param {number} i */
  pickFirst: (i) => `Đoạn bắt đầu ở ${i}. Hãy chọn ô kết thúc đoạn.`,
  arrayTitle: 'Mảng a',
  arrayAria: 'Mảng a, chỉ số 0 đứng đầu',
  tableTitle: 'Bảng st[k][i]: khối độ dài 2^k bắt đầu tại i',
  tableAria: 'Bảng thưa, mỗi hàng ứng với một k, mỗi cột ứng với một chỉ số bắt đầu i',
  tableHint: 'Bấm vào một ô để xem khối mà nó lưu. Dấu gạch nghĩa là khối đó không vừa trong mảng.',
  noBlock: '–',
  /** @param {number} k @param {number} i @param {number} n */
  noBlockNotice: (k, i, n) =>
    `Không có khối ở đây: khối độ dài ${1 << k} bắt đầu tại ${i} sẽ vượt quá cuối dãy ${n} giá trị.`,
  /** @param {number} k */
  rowHeader: (k) => `k=${k}`,
  /** @param {number} k */
  blockWindow: (k) => `2^${k}`,
  /** @param {number} l @param {number} r */
  rangeWindow: (l, r) => `a[${l}..${r}]`,
  /** @param {number} k @param {number} i */
  inspectWindow: (k, i) => `st[${k}][${i}]`,
  /** @param {number} k @param {number} i @param {number | null} value @param {SparseOp} op */
  inspectLine: (k, i, value, op) =>
    `st[${k}][${i}] phủ a[${i}..${i + (1 << k) - 1}], gồm ${1 << k} ô: ${opName(op)} = ${value === null ? 'chưa dựng' : value}.`,
  markers: { left: 'L', right: 'R', both: '×2' },
  /** @param {number} i @param {number} v @param {string} state */
  cellLabel: (i, v, state) => `a[${i}] = ${v}${state ? `, ${state}` : ''}`,
  /** @param {number} k @param {number} i @param {number | null} v @param {boolean} fits @param {string} state */
  tableCellLabel: (k, i, v, fits, state) =>
    !fits
      ? `st[${k}][${i}]: không có khối này`
      : `st[${k}][${i}]: ${v === null ? 'chưa điền' : v}${state ? `, ${state}` : ''}`,
  states: {
    both: 'thuộc cả hai khối',
    left: 'thuộc khối trái',
    right: 'thuộc khối phải',
    range: 'thuộc đoạn truy vấn',
    target: 'vừa điền',
    source: 'được đọc để điền',
    read: 'được truy vấn đọc',
  },
  legend: {
    range: 'Thuộc đoạn truy vấn',
    write: 'Ô vừa điền',
    source: 'Nửa khối được đọc để điền',
    block: 'L / R Hai khối của truy vấn',
    both: '×2 Thuộc cả hai khối',
  },
  stats: {
    filled: 'Số ô đã điền',
    merges: 'Số lần gộp khi dựng',
    reads: 'Số ô truy vấn đọc',
    naive: 'Số ô đọc nếu không có bảng',
    result: 'Đáp án truy vấn',
    truth: 'Đáp án đúng',
  },
  pending: '—',
  /** @param {SparseFrame} f */
  resultLine(f) {
    const size = 1 << f.level;
    return `a[${f.l}..${f.r}]: ${opName(f.op)}(st[${f.level}][${f.leftAt}], st[${f.level}][${f.rightAt}]) = ${opName(f.op)}(${f.leftValue}, ${f.rightValue}) = ${f.result}, khối độ dài ${size}.`;
  },
  practiceTitle: 'Tự kiểm tra',
  /** @param {SparseFrame} f */
  describe(f) {
    const size = f.level >= 0 ? 1 << f.level : 0;
    const name = opName(f.op);
    switch (f.kind) {
      case 'start':
        return `Dựng bảng cho ${f.items.length} giá trị với phép ${name}, rồi trả lời truy vấn a[${f.l}..${f.r}].`;
      case 'base':
        return `Tầng 0 gồm các khối độ dài 1, nên mỗi ô chính là giá trị tại đó.`;
      case 'cell': {
        const half = size / 2;
        return `st[${f.level}][${f.at}] phủ a[${f.at}..${f.at + size - 1}]: ${name}(st[${f.level - 1}][${f.at}], st[${f.level - 1}][${f.at + half}]) = ${name}(${f.table[f.level - 1][f.at]}, ${f.table[f.level - 1][f.at + half]}) = ${f.table[f.level][f.at]}.`;
      }
      case 'pick-k':
        return `Đoạn có ${f.r - f.l + 1} ô. Luỹ thừa của 2 lớn nhất không vượt quá độ dài này là 2^${f.level} = ${size}, nên k = ${f.level}.`;
      case 'left':
        return `Khối trái: st[${f.level}][${f.leftAt}] phủ a[${f.leftAt}..${f.leftAt + size - 1}] và lưu ${f.leftValue}.`;
      case 'right':
        return `Khối phải: st[${f.level}][${f.rightAt}] phủ a[${f.rightAt}..${f.rightAt + size - 1}] và lưu ${f.rightValue}. Hai khối chung nhau ${f.overlap} ô.`;
      case 'combine':
        if (f.op === 'sum' && f.result === f.truth) {
          return `Phép cộng cho ${f.leftValue} + ${f.rightValue} = ${f.result}, đúng chỉ vì ${f.overlap} ô chung ở đây cộng lại bằng 0. Chúng vẫn bị tính hai lần: phép cộng không luỹ đẳng.`;
        }
        return f.op === 'sum'
          ? `Phép cộng cho ${f.leftValue} + ${f.rightValue} = ${f.result}, nhưng tổng đúng là ${f.truth}: ${f.overlap} ô chung bị tính hai lần. Phép cộng không luỹ đẳng.`
          : `${name}(${f.leftValue}, ${f.rightValue}) = ${f.result}. Đọc ${f.overlap} ô chung hai lần không làm thay đổi gì, vì ${name}(x, x) = x.`;
      case 'done':
        if (f.op === 'sum' && f.result === f.truth) {
          return `Xong: 2 lần đọc và ra đáp án đúng ${f.result}, nhưng là do may: các ô chung cộng lại bằng 0 nên che mất việc tính hai lần. Với giá trị chung khác, kết quả sẽ sai.`;
        }
        return f.op === 'sum'
          ? `Xong: 2 lần đọc, đáp án sai ${f.result} thay vì ${f.truth}. Phép cộng cần cấu trúc khác, như tổng tiền tố hoặc cây Fenwick.`
          : `Xong: đáp án ${f.result} chỉ tốn 2 lần đọc thay vì ${f.r - f.l + 1} lần, và mọi đoạn khác cũng chỉ tốn 2 lần.`;
    }
  },
  takeaways: [
    'st[k][i] lưu đáp án cho 2^k ô bắt đầu tại i. Mỗi khối là hai khối nửa độ dài gộp lại: st[k][i] = op(st[k − 1][i], st[k − 1][i + 2^(k − 1)]).',
    'Một đoạn độ dài len luôn chứa vừa hai khối độ dài 2^k với k = ⌊log₂ len⌋: một khối bắt đầu tại l, một khối kết thúc tại r. Vì 2·2^k > len nên hai khối phủ kín đoạn, và chúng luôn chung nhau ít nhất một ô.',
    'Phần chồng nhau chỉ an toàn với phép toán luỹ đẳng (idempotent), tức op(x, x) = x: min, max, ƯCLN, AND và OR theo bit. Phép cộng và phép nhân tính các ô chung hai lần.',
    'Bảng là tĩnh. Đổi một giá trị có thể làm hỏng O(n) ô của bảng, và cách sửa đơn giản là dựng lại toàn bộ trong O(n log n), nên mảng hay thay đổi cần cây Fenwick hoặc cây phân đoạn.',
    'Thử phép Tổng trên đoạn l = 1, r = 6: hai khối a[1..4] và a[3..6] chung nhau a[3] và a[4]. Kết quả lớn hơn đúng bằng tổng hai giá trị đó. Sau đó chuyển lại về Min.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Dựng bảng', 'O(n log n)', 'Khoảng log₂ n tầng, mỗi tầng tối đa n ô, mỗi ô một lần gộp.'],
    ['Truy vấn (luỹ đẳng)', 'O(1)', 'Tính k, đọc hai ô rồi gộp chúng.'],
    ['Truy vấn bằng cách duyệt', 'O(r − l + 1)', 'Đọc mọi ô trong đoạn.'],
    ['Cập nhật một giá trị', 'O(n log n)', 'Dựng lại: nhiều khối có thể chứa ô vừa đổi.'],
    ['Bộ nhớ', 'O(n log n)', 'Mỗi tầng một hàng tối đa n ô.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Với một đoạn gồm 6 ô, truy vấn dùng k bằng bao nhiêu?',
      answer: 2,
      hints: ['Tìm luỹ thừa của 2 lớn nhất mà không vượt quá 6.'],
      solution: '2² = 4 ≤ 6 và 2³ = 8 > 6, nên k = ⌊log₂ 6⌋ = 2. Hai khối 4 ô phủ được 6 ô.',
    },
    {
      type: 'number',
      prompt: 'Với a = [5, 2, 4, 7, 1, 3, 6, 8] và phép Min, st[2][1] lưu giá trị nào?',
      answer: 1,
      hints: ['k = 2 nghĩa là khối gồm 4 ô. Khối bắt đầu tại chỉ số 1.', 'Khối phủ a[1..4].'],
      solution: 'st[2][1] phủ a[1..4] = 2, 4, 7, 1, có giá trị nhỏ nhất là 1.',
    },
    {
      type: 'number',
      prompt:
        'Cùng mảng đó, đoạn a[1..6], dùng phép Tổng thay cho Min. Tổng đúng là 23. Truy vấn trên bảng thưa trả về bao nhiêu?',
      answer: 31,
      hints: [
        'k = 2, nên hai khối là a[1..4] và a[3..6].',
        'Hai khối chung a[3] = 7 và a[4] = 1, hai giá trị này bị tính hai lần.',
      ],
      solution:
        'Hai khối lưu 2 + 4 + 7 + 1 = 14 và 7 + 1 + 3 + 6 = 17, nên truy vấn trả về 14 + 17 = 31. Đó là tổng đúng 23 cộng thêm phần chung 7 + 1. Nạp các giá trị này vào bảng tương tác và chọn Tổng để kiểm tra.',
    },
    {
      type: 'number',
      prompt: 'Với n = 16, bảng thưa điền tất cả bao nhiêu ô?',
      unit: 'ô',
      answer: 54,
      hints: [
        'Tầng k có n − 2^k + 1 ô.',
        'Các tầng là k = 0, 1, 2, 3, 4, lần lượt có 16, 15, 13, 9 và 1 ô.',
      ],
      solution:
        '16 + 15 + 13 + 9 + 1 = 54. So với 16 · log₂ 16 = 64, mức ước lượng trên O(n log n).',
    },
    {
      type: 'multi',
      prompt: 'Những phép toán nào dùng trực tiếp được hai khối chồng nhau?',
      options: ['Giá trị nhỏ nhất', 'Tổng', 'Ước chung lớn nhất', 'OR theo bit', 'Tích'],
      answers: [0, 2, 3],
      hints: ['Kiểm tra xem op(x, x) có bằng x hay không.'],
      solution:
        'min(x, x), ƯCLN(x, x) và x OR x đều bằng x, nên các ô chung vô hại. x + x và x · x nói chung khác x, nên tổng và tích tính phần chồng hai lần.',
    },
    {
      type: 'choice',
      prompt:
        'Một mảng nhận một lần cập nhật điểm xen giữa mỗi hai truy vấn min trên đoạn. Bảng thưa có phù hợp không?',
      options: [
        'Có: truy vấn là O(1), nên cập nhật không quan trọng',
        'Không: mỗi lần cập nhật có thể buộc dựng lại trong O(n log n), nên hãy dùng cây phân đoạn',
        'Có: một lần cập nhật chỉ đổi một ô của bảng',
        'Không: bảng thưa không trả lời được truy vấn min trên đoạn',
      ],
      answer: 1,
      hints: ['Một ô thuộc bao nhiêu khối?'],
      solution:
        'Ở tầng k, một ô thuộc tới 2^k khối, nên một lần cập nhật có thể làm hỏng nhiều ô của bảng. Bảng thưa hợp với dữ liệu tĩnh; cây phân đoạn xử lý cả cập nhật lẫn truy vấn trong O(log n).',
    },
  ],
  nextTeaser:
    'Bài tiếp theo: Cây Fenwick, cấu trúc vừa trả lời tổng trên đoạn vừa cho phép cập nhật, mỗi việc chỉ tốn O(log n).',
};
