/** @typedef {import('$lib/algo-engine/two-pointers.js').PointerFrame} PointerFrame */
/** @typedef {import('$lib/algo-engine/two-pointers.js').PointerMode} PointerMode */

export const vi = {
  slug: 'two-pointers',
  topic: 'arrays-strings',
  level: 'Cơ bản',
  title: 'Hai con trỏ',
  intro:
    'Kĩ thuật hai con trỏ (two pointers) giữ hai chỉ số trên cùng một mảng và cho chúng tiến lại gần nhau, nên mỗi bước loại hẳn ít nhất một phần tử. Trên mảng đã sắp xếp, cách này tìm được một cặp có tổng cho trước chỉ trong một lượt, O(n), thay vì xét cả n(n − 1)/2 cặp. Cũng lối đi hội tụ ấy phân hoạch một mảng ngay tại chỗ, không cần thêm bộ nhớ.',
  summary:
    'Dời lo và hi vào giữa một mảng đã sắp xếp để tìm cặp có tổng bằng đích, rồi dùng i và j để phân hoạch một mảng tại chỗ quanh một giá trị chốt (pivot).',
  instruction:
    'Chọn “Tổng một cặp” hoặc “Phân hoạch”, nhập các giá trị cùng đích hoặc chốt, rồi chạy từng bước. Với “Tổng một cặp”, để ý con trỏ nào dời đi khi tổng quá nhỏ hay quá lớn và ô nào bị loại. Với “Phân hoạch”, để ý i và j khép lại gần nhau và đổi chỗ những cặp nằm sai phía.',
  modeLegend: 'Bài toán',
  modes: /** @type {Record<PointerMode, string>} */ ({
    pair: 'Tổng một cặp',
    partition: 'Phân hoạch',
  }),
  valuesLabel: 'Các giá trị',
  targetLabel: 'Đích T',
  pivotLabel: 'Chốt p',
  randomButton: 'Giá trị ngẫu nhiên',
  valueErrors: {
    format: 'Hãy nhập các số nguyên, cách nhau bởi dấu phẩy hoặc dấu cách, ví dụ 4, 1, 7.',
    range: 'Mỗi giá trị phải nằm trong khoảng từ −99 đến 99.',
    count: 'Hãy nhập từ 2 đến 16 giá trị.',
  },
  targetError: 'Đích phải là số nguyên từ −198 đến 198.',
  pivotError: 'Chốt phải là số nguyên từ −99 đến 99.',
  sortedNote:
    '“Tổng một cặp” cần mảng đã sắp xếp, nên các giá trị được hiển thị theo thứ tự tăng dần.',
  arrayTitle: 'Mảng a',
  arrayAria: 'Mảng, chỉ số 0 trước',
  pointerNames: /** @type {Record<PointerMode, [string, string]>} */ ({
    pair: ['lo', 'hi'],
    partition: ['i', 'j'],
  }),
  windowLess: '< p',
  windowMore: '≥ p',
  markers: { out: '×', less: '<', more: '≥', found: '✓' },
  /** @param {number} i @param {number} v @param {string} state */
  cellLabel: (i, v, state) => `Chỉ số ${i}: ${v}${state ? `, ${state}` : ''}`,
  states: {
    read: 'đang đọc',
    out: 'đã bị loại',
    found: 'thuộc cặp cần tìm',
    less: 'đã xếp bên trái, nhỏ hơn p',
    more: 'đã xếp bên phải, không nhỏ hơn p',
    swapped: 'vừa đổi chỗ',
  },
  legend: {
    read: 'Đang đọc',
    out: '× Đã bị loại',
    found: '✓ Cặp cần tìm',
    less: '< Đã xếp bên trái (< p)',
    more: '≥ Đã xếp bên phải (≥ p)',
    swapped: 'Vừa đổi chỗ',
  },
  sumTitle: 'Tổng hiện tại',
  /** @param {number} a @param {number} b @param {number} s @param {number} t */
  sumLine: (a, b, s, t) => `${a} + ${b} = ${s} ${s === t ? '=' : s < t ? '<' : '>'} ${t}`,
  stats: {
    sums: 'Số tổng đã xét',
    pairs: 'Số cặp nếu vét cạn',
    reads: 'Số lần so sánh với p',
    swaps: 'Số lần đổi chỗ',
    n: 'Độ dài n',
    result: 'Kết quả',
  },
  /** @param {[number, number] | null} found */
  pairResult: (found) => (found ? `(${found[0]}, ${found[1]})` : 'không có'),
  pending: '—',
  practiceTitle: 'Tự kiểm tra',
  /** @param {PointerFrame} f */
  describe(f) {
    const a = f.items;
    switch (f.kind) {
      case 'start':
        return f.mode === 'pair'
          ? `Mảng đã sắp xếp gồm ${a.length} phần tử. Ta tìm hai giá trị có tổng bằng ${f.target}: lo bắt đầu ở 0, hi ở ${a.length - 1}.`
          : `Phân hoạch ${a.length} giá trị quanh p = ${f.target}: i bắt đầu ở 0, j ở ${a.length - 1}.`;
      case 'sum':
        return `a[${f.left}] + a[${f.right}] = ${a[f.left]} + ${a[f.right]} = ${f.sum}.`;
      case 'found':
        return `${f.sum} bằng đích ${f.target}: cặp cần tìm nằm ở chỉ số ${f.left} và ${f.right}.`;
      case 'move-left':
        return `${f.sum} < ${f.target}: ngay cả số ghép cặp lớn nhất còn lại, a[${f.right}], cũng quá nhỏ đối với a[${f.left - 1}], nên ta loại a[${f.left - 1}] và dời lo đến ${f.left}.`;
      case 'move-right':
        return `${f.sum} > ${f.target}: ngay cả số ghép cặp nhỏ nhất còn lại, a[${f.left}], cũng quá lớn đối với a[${f.right + 1}], nên ta loại a[${f.right + 1}] và dời hi đến ${f.right}.`;
      case 'missing':
        return `lo và hi đã gặp nhau: mọi giá trị đều bị loại, nên không có hai giá trị nào có tổng bằng ${f.target}.`;
      case 'keep-left':
        return `a[${f.left - 1}] = ${a[f.left - 1]} < ${f.target}: nó đã ở đúng bên trái. Dời i đến ${f.left}.`;
      case 'keep-right':
        return `a[${f.left}] = ${a[f.left]} không nhỏ hơn ${f.target}, nhưng a[${f.right + 1}] = ${a[f.right + 1]} ≥ ${f.target} đã ở đúng bên phải. Dời j đến ${f.right}.`;
      case 'swap': {
        const [i, j] = /** @type {[number, number]} */ (f.swapped);
        return `a[${i}] ≥ ${f.target} và a[${j}] < ${f.target} đều nằm sai phía: đổi chỗ chúng để được ${a[i]} và ${a[j]}, rồi dời i đến ${f.left} và j đến ${f.right}.`;
      }
      case 'done':
        if (f.mode === 'pair')
          return f.found
            ? `Xong: ${a[f.found[0]]} + ${a[f.found[1]]} = ${f.target} sau ${f.checks} tổng; vét cạn có thể cần đến ${(a.length * (a.length - 1)) / 2}.`
            : `Xong: không có cặp nào sau ${f.checks} tổng, nhiều nhất là n − 1 = ${a.length - 1}; vét cạn phải xét ${(a.length * (a.length - 1)) / 2} cặp.`;
        return `Xong: i đã vượt qua j. a[0..${f.boundary}) chứa ${f.boundary} giá trị < ${f.target}, còn a[${f.boundary}..${a.length}) chứa phần còn lại, sau ${f.swaps} lần đổi chỗ và không cần mảng phụ.`;
    }
  },
  takeaways: [
    'Hai con trỏ hội tụ bắt đầu ở hai đầu và tiến vào giữa. Mỗi bước dời một con trỏ, nên lối đi kết thúc sau nhiều nhất n − 1 bước: thời gian O(n), bộ nhớ thêm O(1).',
    'Trên mảng đã sắp xếp, nếu a[lo] + a[hi] quá nhỏ thì a[lo] không thể thuộc cặp nào (số ghép cặp lớn nhất còn lại của nó là a[hi]), nên lo dời sang phải. Nếu tổng quá lớn, hi dời sang trái vì lí do tương tự.',
    'Chỉ một quy tắc đó thay cho n(n − 1)/2 lần kiểm tra khi thử mọi cặp. Sắp xếp trước tốn O(n log n), vẫn nhanh hơn O(n²).',
    'Cùng ý tưởng ấy phân hoạch tại chỗ: i bỏ qua các giá trị đã đúng bên trái, j bỏ qua các giá trị đã đúng bên phải, còn một cặp nằm sai phía thì đổi chỗ.',
    'Thử “Tổng một cặp” với một đích không cặp nào đạt được, chẳng hạn 99: hai con trỏ gặp nhau sau đúng n − 1 tổng, trường hợp xấu nhất.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Tổng một cặp, đầu vào đã sắp xếp',
      'O(n)',
      'Mỗi tổng loại một phần tử: nhiều nhất n − 1 tổng.',
    ],
    ['Tổng một cặp, đầu vào chưa sắp xếp', 'O(n log n)', 'Sắp xếp trước, rồi đi một lượt O(n).'],
    ['Tổng một cặp, vét cạn', 'Θ(n²)', 'Mọi cặp: n(n − 1)/2 tổng.'],
    [
      'Phân hoạch tại chỗ',
      'O(n)',
      'i và j cộng lại chỉ đi hết mảng một lần; nhiều nhất n/2 lần đổi chỗ.',
    ],
    ['Bộ nhớ thêm', 'O(1)', 'Hai chỉ số; mảng được sửa ngay tại chỗ.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Tìm trong a = [1, 3, 4, 6, 8, 11] một cặp có tổng 10. Có bao nhiêu tổng được xét?',
      answer: 5,
      unit: 'tổng',
      hints: [
        'Bắt đầu với 1 + 11 = 12, quá lớn, nên hi dời sang trái.',
        'Các tổng lần lượt là 12, 9, 11, 9, rồi 10.',
      ],
      solution:
        '1 + 11 = 12 > 10 (hi sang trái), 1 + 8 = 9 < 10 (lo sang phải), 3 + 8 = 11 > 10 (hi sang trái), 3 + 6 = 9 < 10 (lo sang phải), 4 + 6 = 10: tìm thấy sau 5 tổng.',
    },
    {
      type: 'number',
      prompt:
        'Một mảng đã sắp xếp gồm 10 giá trị không có cặp nào có tổng T. Cách tìm bằng hai con trỏ xét bao nhiêu tổng?',
      answer: 9,
      unit: 'tổng',
      hints: ['Mỗi tổng dời đúng một con trỏ, và vòng lặp dừng khi lo = hi.'],
      solution:
        'Hai con trỏ ban đầu cách nhau 9 và mỗi lần kiểm tra thu hẹp khoảng cách đi 1, nên có 9 tổng được xét, tức n − 1. Vét cạn sẽ phải xét 10 × 9 / 2 = 45 cặp.',
    },
    {
      type: 'choice',
      prompt: 'Trên mảng đã sắp xếp, a[lo] + a[hi] < T. Vì sao dời lo sang phải là an toàn?',
      options: [
        'a[hi] là số ghép cặp lớn nhất còn lại của a[lo], vậy mà vẫn quá nhỏ',
        'a[lo] là giá trị nhỏ nhất, nên không bao giờ thuộc cặp nào',
        'Dời hi sang trái sẽ làm tổng lớn hơn',
        'Cặp cần tìm chắc chắn chứa a[hi]',
      ],
      answer: 0,
      hints: ['Những giá trị nào còn ghép được với a[lo]? Chúng đều ≤ a[hi].'],
      solution:
        'Mọi giá trị còn trong khoảng đều ≤ a[hi], nên a[lo] cộng với bất kì giá trị nào trong đó cũng ≤ a[lo] + a[hi] < T. a[lo] không thuộc cặp nào và có thể bị loại.',
    },
    {
      type: 'number',
      prompt: 'Phân hoạch [7, 2, 9, 4, 1] quanh p = 5 bằng i và j. Có bao nhiêu lần đổi chỗ?',
      answer: 2,
      unit: 'lần đổi chỗ',
      hints: [
        'Đầu tiên a[0] = 7 không nhỏ hơn 5, còn a[4] = 1 thì nhỏ hơn 5.',
        'Sau lần đổi chỗ đó, i bỏ qua 2 và dừng ở 9, còn j dừng ở 4.',
      ],
      solution:
        'Đổi chỗ 7 và 1 → [1, 2, 9, 4, 7]; i bỏ qua 2; đổi chỗ 9 và 4 → [1, 2, 4, 9, 7]; giờ i = 3 > j = 2. Hai lần đổi chỗ, và hàm trả về 3.',
    },
    {
      type: 'text',
      prompt: 'Thời gian chạy của cách tìm cặp bằng hai con trỏ trên mảng đã sắp xếp là bao nhiêu?',
      accept: ['O(n)', 'Θ(n)', 'n', 'tuyến tính', 'linear'],
      hints: ['Đếm xem một con trỏ có thể dời bao nhiêu lần.'],
      solution: 'Nhiều nhất n − 1 tổng, mỗi tổng O(1): O(n).',
    },
  ],
  nextTeaser:
    'Bài sau, Cửa sổ trượt, cho hai con trỏ cùng đi về một hướng để theo dõi một đoạn liên tiếp của mảng.',
};
