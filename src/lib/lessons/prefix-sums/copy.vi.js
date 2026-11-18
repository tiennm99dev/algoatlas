/** @typedef {import('$lib/algo-engine/prefix-sums.js').PrefixFrame} PrefixFrame */
/** @typedef {import('$lib/algo-engine/prefix-sums.js').PrefixMode} PrefixMode */

/** A signed number with a Unicode minus. @param {number} x */
const signed = (x) => (x < 0 ? `−${-x}` : String(x));

/** Subtracting a negative reads better in brackets. @param {number} x */
const term = (x) => (x < 0 ? `(${signed(x)})` : String(x));

export const vi = {
  slug: 'prefix-sums',
  topic: 'arrays-strings',
  level: 'Trung bình',
  title: 'Tổng tiền tố và mảng hiệu',
  intro:
    'Mảng tổng tiền tố (prefix sum) P lưu các tổng cộng dồn của a: P[i] là tổng của i phần tử đầu tiên. Sau một lượt O(n), tổng của một đoạn bất kì a[l..r] bằng P[r + 1] − P[l], chỉ hai lần tra trong O(1). Làm ngược ý tưởng ấy, ta có mảng hiệu, giúp cộng một giá trị vào cả một đoạn mà chỉ phải sửa hai ô.',
  summary:
    'Dựng hàng tổng tiền tố của một mảng, chọn một đoạn bất kì để thấy tổng của nó chỉ là một phép trừ giữa hai lần tra, và thực hiện cập nhật đoạn qua mảng hiệu.',
  instruction:
    'Ở “Tổng đoạn”, nhập các giá trị, rồi bấm vào hai ô của a (hoặc nhập l và r) để chọn đoạn và xem P[r + 1] − P[l]. Lùi lại từng bước để xem P được dựng ra sao. Ở “Cập nhật đoạn”, nhập các lần cập nhật dạng “l r v” và để ý mỗi lần chỉ chạm hai ô của D, trước khi một lượt duy nhất dựng lại mảng.',
  modeLegend: 'Bài toán',
  modes: /** @type {Record<PrefixMode, string>} */ ({
    prefix: 'Tổng đoạn',
    difference: 'Cập nhật đoạn',
  }),
  valuesLabel: 'Các giá trị',
  lLabel: 'Từ l',
  rLabel: 'Đến r',
  updatesLabel: 'Các lần cập nhật (l r v, …)',
  valueErrors: {
    format: 'Hãy nhập các số nguyên, cách nhau bởi dấu phẩy hoặc dấu cách, ví dụ 3, −1, 4.',
    range: 'Mỗi giá trị phải nằm trong khoảng từ −99 đến 99.',
    count: 'Hãy nhập từ 1 đến 16 giá trị.',
  },
  /** @param {number} n */
  rangeError: (n) => `l và r phải là số nguyên với 0 ≤ l ≤ r ≤ ${n - 1}.`,
  updateErrors: {
    format: 'Viết mỗi lần cập nhật thành ba số nguyên “l r v”, các lần cách nhau bởi dấu phẩy.',
    range: 'Mỗi lần cập nhật cần 0 ≤ l ≤ r < n và v từ −99 đến 99.',
    count: 'Dùng nhiều nhất 6 lần cập nhật.',
  },
  pickHint:
    'Bấm một ô của a để bắt đầu đoạn, rồi bấm ô khác để kết thúc. Phím Enter cũng dùng được.',
  /** @param {number} i */
  pickFirst: (i) => `Đoạn bắt đầu ở ${i}. Chọn ô nơi đoạn kết thúc.`,
  arrayTitle: 'Mảng a',
  arrayAria: 'Mảng a, chỉ số 0 trước',
  prefixTitle: 'Tổng tiền tố P (P[i] = a[0] + … + a[i − 1])',
  prefixAria: 'Tổng tiền tố P, chỉ số 0 trước',
  diffTitle: 'Mảng hiệu D',
  diffAria: 'Mảng hiệu D, chỉ số 0 trước',
  outTitle: 'Mảng dựng lại b (tổng tiền tố của D)',
  outAria: 'Mảng dựng lại b, chỉ số 0 trước',
  empty: '·',
  /** @param {number} l @param {number} r */
  rangeWindow: (l, r) => `a[${l}..${r}]`,
  /** @param {number} v */
  updateWindow: (v) => `+${signed(v)}`.replace('+−', '−'),
  markers: { plus: '+', minus: '−' },
  /** @param {string} name @param {number} i @param {number | null} v @param {string} state */
  cellLabel: (name, i, v, state) =>
    `${name}[${i}]: ${v === null ? 'chưa điền' : signed(v)}${state ? `, ${state}` : ''}`,
  states: {
    read: 'đang đọc',
    written: 'vừa ghi',
    plus: 'được cộng',
    minus: 'bị trừ',
    range: 'trong đoạn',
  },
  legend: {
    range: 'Trong đoạn hoặc lần cập nhật',
    read: 'Đang đọc',
    written: 'Vừa ghi',
    lookups: '+ / − Hai lần tra',
  },
  /** @param {number} l @param {number} r @param {number} hi @param {number} lo @param {number} result */
  queryLine: (l, r, hi, lo, result) =>
    `a[${l}] + … + a[${r}] = P[${r + 1}] − P[${l}] = ${signed(hi)} − ${term(lo)} = ${signed(result)}`,
  /** @param {number[]} b */
  checkLine: (b) => `Mảng sau cập nhật: ${b.map(signed).join(', ')}`,
  stats: {
    build: 'Số phép cộng đến giờ',
    lookups: 'Số lần tra P',
    naive: 'Số lần đọc nếu không có P',
    result: 'Tổng đoạn',
    writes: 'Số ô D bị sửa',
    naiveWrites: 'Số lần ghi nếu sửa trực tiếp',
    updates: 'Số lần cập nhật',
  },
  pending: '—',
  practiceTitle: 'Tự kiểm tra',
  /** @param {PrefixFrame} f */
  describe(f) {
    const a = f.items;
    const n = a.length;
    switch (f.kind) {
      case 'start':
        return f.mode === 'prefix'
          ? `Dựng P cho ${n} giá trị: P[0] = 0, tổng của không phần tử nào. Sau đó trả lời tổng của a[${f.l}..${f.r}].`
          : `Dựng mảng hiệu D của ${n} giá trị, áp các lần cập nhật lên D, rồi dựng lại mảng.`;
      case 'build':
        return `P[${f.at + 1}] = P[${f.at}] + a[${f.at}] = ${signed(/** @type {number} */ (f.prefix[f.at]))} + ${term(a[f.at])} = ${signed(/** @type {number} */ (f.prefix[f.at + 1]))}.`;
      case 'query':
        return `Tổng của a[${f.l}..${f.r}] = P[${f.r + 1}] − P[${f.l}] = ${signed(/** @type {number} */ (f.result))}: hai lần tra thay vì ${f.naive} lần đọc.`;
      case 'diff':
        return f.at === 0
          ? `D[0] = a[0] = ${signed(a[0])}.`
          : `D[${f.at}] = a[${f.at}] − a[${f.at - 1}] = ${signed(a[f.at])} − ${term(a[f.at - 1])} = ${signed(/** @type {number} */ (f.diff[f.at]))}.`;
      case 'update-left':
        return `Lần cập nhật ${f.update + 1}: cộng ${signed(f.value)} vào a[${f.l}..${f.r}]. D[${f.l}] được cộng ${signed(f.value)}, nên mọi giá trị dựng lại từ ${f.l} trở đi đều tăng ${signed(f.value)}.`;
      case 'update-right':
        return f.skipped
          ? `r + 1 = ${f.r + 1} = n: đoạn chạy đến cuối mảng, nên không cần bù trừ gì. Sửa 1 ô thay vì ${f.r - f.l + 1}.`
          : `D[${f.r + 1}] bị trừ ${signed(f.value)}, bù lại phần tăng từ ${f.r + 1} trở đi. Sửa 2 ô thay vì ${f.r - f.l + 1}.`;
      case 'rebuild':
        return f.at === 0
          ? `b[0] = D[0] = ${signed(/** @type {number} */ (f.out[0]))}.`
          : `b[${f.at}] = b[${f.at - 1}] + D[${f.at}] = ${signed(/** @type {number} */ (f.out[f.at - 1]))} + ${term(/** @type {number} */ (f.diff[f.at]))} = ${signed(/** @type {number} */ (f.out[f.at]))}.`;
      case 'done':
        return f.mode === 'prefix'
          ? `Xong: giờ mọi đoạn khác cũng chỉ tốn hai lần tra, vì P đã được dựng sẵn.`
          : `Xong: sửa ${f.writes} ô của D thay vì ${f.naive} lần ghi phần tử, cộng một lượt dựng lại ${n} bước.`;
    }
  },
  takeaways: [
    'P có n + 1 phần tử: P[0] = 0 và P[i + 1] = P[i] + a[i]. Dựng P chỉ cần một lượt O(n).',
    'Tổng của a[l..r] là P[r + 1] − P[l]: mọi thứ đến r, trừ mọi thứ trước l. Mỗi truy vấn là O(1), nên q truy vấn tốn O(n + q) thay vì O(n·q).',
    'Cẩn thận lệch một: P lệch một vị trí so với a. Chính tiền tố rỗng P[0] = 0 giúp các đoạn bắt đầu từ 0 dùng được cùng một công thức.',
    'Mảng hiệu D[i] = a[i] − a[i − 1] là ý tưởng làm ngược lại: a là tổng tiền tố của D. Cộng v vào a[l..r] chỉ là D[l] += v và D[r + 1] −= v, rồi một lượt dựng lại a.',
    'Thử “Cập nhật đoạn” với 0, 0, 0, 0, 0, 0 và các lần cập nhật 1 3 5, 2 5 2: D chỉ đổi ở ba ô, và mảng dựng lại là 0, 5, 7, 7, 2, 2.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Dựng P', 'O(n)', 'Mỗi phần tử một phép cộng.'],
    ['Tổng đoạn a[l..r]', 'O(1)', 'P[r + 1] − P[l]: hai lần tra và một phép trừ.'],
    ['Tổng đoạn khi không có P', 'O(r − l + 1)', 'Đọc mọi phần tử trong đoạn.'],
    ['Cập nhật đoạn qua D', 'O(1)', 'Chỉ sửa D[l] và D[r + 1].'],
    ['q lần cập nhật, rồi đọc a', 'O(n + q)', 'q lần O(1), rồi một lượt dựng lại O(n).'],
    ['Bộ nhớ', 'O(n)', 'P có n + 1 phần tử; D có n.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Với a = [3, 1, 4, 1, 5, 9, 2, 6], P[5] bằng bao nhiêu?',
      answer: 14,
      hints: ['P[5] là tổng của năm phần tử đầu, từ a[0] đến a[4].'],
      solution: 'P[5] = 3 + 1 + 4 + 1 + 5 = 14. Để ý độ lệch: P[5] không chứa a[5].',
    },
    {
      type: 'number',
      prompt: 'Dùng P của cùng mảng đó, a[2] + a[3] + a[4] + a[5] bằng bao nhiêu?',
      answer: 19,
      hints: ['Đoạn đi từ l = 2 đến r = 5, nên tra P[6] và P[2].', 'P[6] = 23 và P[2] = 4.'],
      solution: 'P[6] − P[2] = 23 − 4 = 19, khớp với 4 + 1 + 5 + 9.',
    },
    {
      type: 'text',
      prompt: 'Khi đã dựng xong P, thời gian chạy của một truy vấn tổng đoạn là bao nhiêu?',
      accept: ['O(1)', 'Θ(1)', 'hằng số', 'thời gian hằng số', 'constant', 'constant time', '1'],
      hints: ['Một truy vấn đọc bao nhiêu phần tử của P?'],
      solution: 'Hai lần tra và một phép trừ, dù đoạn dài bao nhiêu: O(1).',
    },
    {
      type: 'number',
      prompt:
        'a = [0, 0, 0, 0, 0, 0]. Cộng 5 vào a[1..3], rồi cộng 2 vào a[2..5], thông qua mảng hiệu. D[4] bằng bao nhiêu?',
      answer: -5,
      hints: [
        'Lần cập nhật thứ nhất sửa D[1] thêm +5 và D[4] thêm −5.',
        'Lần cập nhật thứ hai sửa D[2] thêm +2; r + 1 = 6 của nó đã vượt quá cuối mảng.',
      ],
      solution:
        'Ban đầu D toàn số 0. Lần cập nhật thứ nhất cho D[1] = 5 và D[4] = −5; lần thứ hai cho D[2] = 2 và không chạm ô nào khác. Vậy D[4] = −5, và mảng dựng lại là 0, 5, 7, 7, 2, 2.',
    },
    {
      type: 'choice',
      prompt:
        'Bạn phải áp q lần cập nhật đoạn lên một mảng n giá trị, rồi đọc cả mảng một lần. Dùng mảng hiệu thì tốn bao nhiêu?',
      options: ['O(n + q)', 'O(n·q)', 'O(q log n)', 'O(n²)'],
      answer: 0,
      hints: ['Mỗi lần cập nhật sửa hai phần tử của D; dựng lại là một lượt.'],
      solution:
        'q lần cập nhật, mỗi lần O(1), cộng một lượt tổng tiền tố O(n): O(n + q). Sửa trực tiếp mọi phần tử của mọi đoạn có thể tốn O(n·q).',
    },
  ],
  nextTeaser:
    'Mảng không chỉ chứa số. Bài sau, Xâu cơ bản và thao tác trên xâu, xem xâu như một mảng kí tự và đo chi phí của từng thao tác.',
};
