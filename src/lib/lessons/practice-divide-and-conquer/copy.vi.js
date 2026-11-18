/** @typedef {import('$lib/algo-engine/practice-divide-and-conquer.js').DcFrame} DcFrame */
/** @typedef {import('$lib/algo-engine/practice-divide-and-conquer.js').Problem} Problem */
/** @typedef {import('$lib/algo-engine/practice-divide-and-conquer.js').Part} Part */

/** A value with a real minus sign. @param {number} v */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

/** @param {Problem} _p @param {number | null} v */
const value = (_p, v) => (v === null ? 'không có' : num(v));

/** @param {number} lo @param {number} hi */
const range = (lo, hi) => `[${lo}, ${hi}]`;

/** @param {DcFrame} f */
function verdict(f) {
  return f.ok
    ? `✓ Đúng với ${range(f.lo, f.hi)}.`
    : `✕ Sai: đáp án đúng của ${range(f.lo, f.hi)} là ${value(f.problem, f.expected)}.`;
}

/** @param {number[]} a @param {number} from @param {number} to */
const sum = (a, from, to) => a.slice(from, to + 1).reduce((s, v) => s + v, 0);

export const vi = {
  slug: 'practice-divide-and-conquer',
  topic: 'divide-and-conquer',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán chia để trị',
  intro:
    'Trong chia để trị (divide and conquer), bước chia và các lời gọi đệ quy hầu như lúc nào cũng giống nhau: cắt đoạn tại mid rồi giải cả hai nửa. Phần việc thật sự, và gần như mọi lỗi, nằm ở bước kết hợp. Ở đây em tự dựng bước kết hợp cho hai bài toán kinh điển, đoạn con có tổng lớn nhất và phần tử chiếm đa số, kiểm tra nó trên dữ liệu mẫu, rồi chạy từng bước để tìm lời gọi đầu tiên mà nó trả lời sai.',
  summary:
    'Dựng bước kết hợp cho bài toán đoạn con có tổng lớn nhất và phần tử chiếm đa số, kiểm tra trên các mảng mẫu, rồi chạy từng bước đệ quy để xem lời gọi nào sai.',
  instruction:
    'Chọn một bài toán, bật hoặc tắt từng phần của bước kết hợp, rồi đọc danh sách Kiểm tra trên dữ liệu mẫu. Bấm vào một mẫu để nạp nó, rồi chạy từng bước: dấu ✕ trên cây đệ quy đánh dấu lời gọi trả về giá trị sai cho chính đoạn của nó. Hãy nhảy đến lời gọi sai đầu tiên để xem vì sao.',
  takeaways: [
    'Mỗi lời gọi trả lời câu hỏi cho chính đoạn của nó, nên bước kết hợp phải biến đáp án của hai nửa thành đáp án cho cả đoạn. Hãy kiểm tra nó trên từng lời gọi, chứ không chỉ trên kết quả cuối cùng.',
    'Đoạn con có tổng lớn nhất: đoạn tốt nhất nằm trong nửa trái (L), trong nửa phải (R), hoặc vắt qua mid. Một đoạn vắt qua mid là một hậu tố của nửa trái nối với một tiền tố của nửa phải, nên C = hậu tố tốt nhất + tiền tố tốt nhất và đáp án là max(L, R, C). Thiếu C thì mọi đoạn tốt nhất vắt qua mid đều bị bỏ sót.',
    'Phần tử chiếm đa số: một giá trị chiếm quá nửa một đoạn thì chiếm quá nửa ít nhất một trong hai nửa, nên chỉ L và R có thể thắng. Không ứng viên nào chắc chắn thắng, nên phải đếm từng ứng viên trên cả đoạn và chỉ giữ khi số lần xuất hiện vượt quá nửa; đúng một nửa thì không phải đa số.',
    'Cả hai bước kết hợp đều đọc đoạn một lần, nên T(n) = 2T(n/2) + O(n) = O(n log n). Phép quét của Kadane và thuật toán bỏ phiếu Boyer–Moore giải hai bài toán ấy trong O(n), và một bản tóm tắt bốn giá trị cho mỗi nửa (tổng, tiền tố tốt nhất, hậu tố tốt nhất, đoạn tốt nhất) cũng cho một cách chia để trị O(n) cho bài toán đoạn con có tổng lớn nhất.',
    'Qua được mọi mẫu chưa phải là chứng minh. Chỉ dùng C cho bài toán đoạn con có tổng lớn nhất: bốn mẫu vẫn qua, vậy mà cây cho thấy có lời gọi sai trên tất cả các mẫu. Sau đó hãy tìm mẫu bắt được lỗi.',
  ],
  complexityHead: ['Cách làm', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Đoạn con có tổng lớn nhất, chia để trị',
      'O(n log n)',
      'T(n) = 2T(n/2) + O(n): C cần một lần quét từ mid ra hai phía.',
    ],
    [
      'Phần tử chiếm đa số, chia để trị',
      'O(n log n)',
      'T(n) = 2T(n/2) + O(n): đếm L và R đọc đoạn một lần.',
    ],
    [
      'Kadane / Boyer–Moore',
      'O(n)',
      'Một lượt quét từ trái sang phải, mỗi thuật toán giữ O(1) trạng thái.',
    ],
    ['Vét cạn', 'O(n²)', 'Tính tổng mọi đoạn con, hoặc đếm mọi giá trị.'],
    ['Bộ nhớ thêm', 'O(log n)', 'Call stack (ngăn xếp lời gọi) sâu khoảng log₂ n lời gọi.'],
  ],
  nextTeaser:
    'Bài sau mở chủ đề tham lam (greedy): lựa chọn tham lam và lập luận hoán đổi, cách chứng minh rằng chọn cái tốt nhất trước mắt vẫn dẫn đến đáp án tối ưu.',
  problemLabel: 'Bài toán',
  /** @type {Record<Problem, string>} */
  problems: { 'max-subarray': 'Đoạn con có tổng lớn nhất', majority: 'Phần tử chiếm đa số' },
  /** @type {Record<Problem, string>} */
  goals: {
    'max-subarray':
      'Trả về tổng lớn nhất của một đoạn khác rỗng gồm các ô liền nhau trong a[lo..hi]. Nếu mọi giá trị đều âm thì đó là giá trị đơn lẻ lớn nhất.',
    majority:
      'Trả về giá trị chiếm quá nửa a[lo..hi], hoặc không có nếu không giá trị nào như vậy. Đúng một nửa là chưa đủ.',
  },
  valuesLabel: 'Mảng (tối đa 16 số nguyên)',
  randomArray: 'Mảng ngẫu nhiên',
  combineTitle: 'Bước kết hợp của em',
  /** @type {Record<Problem, Partial<Record<Part, string>>>} */
  parts: {
    'max-subarray': {
      left: 'L: tổng tốt nhất bên trong nửa trái',
      right: 'R: tổng tốt nhất bên trong nửa phải',
      cross: 'C: hậu tố tốt nhất của nửa trái + tiền tố tốt nhất của nửa phải',
      total: 'T: tổng của cả đoạn',
    },
    majority: {
      left: 'Thử L, phần tử đa số của nửa trái',
      right: 'Thử R, phần tử đa số của nửa phải',
      count: 'Đếm x trên cả đoạn; chỉ trả về x khi nó chiếm quá nửa',
    },
  },
  /** @type {Record<Problem, string>} */
  combineHint: {
    'max-subarray': 'Lời gọi trả về số lớn nhất trong các số hạng em chọn.',
    majority:
      'Lời gọi trả về ứng viên được chọn đầu tiên vượt qua phép kiểm tra, nếu không thì trả về không có.',
  },
  errors: {
    format: 'Hãy nhập các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 4, −1, 2.',
    range: 'Mỗi giá trị phải từ −99 đến 99.',
    count: 'Hãy nhập từ 1 đến 16 giá trị.',
  },
  jumpWrong: 'Nhảy đến lời gọi sai đầu tiên',
  noWrong: 'Trên mảng này chưa lời gọi nào trả về giá trị sai.',
  samplesTitle: 'Kiểm tra trên dữ liệu mẫu',
  yourArray: 'Mảng của em',
  /** @param {number} k */
  sampleName: (k) => `Mẫu ${k}`,
  /** @param {number} pass @param {number} total */
  samplesSummary: (pass, total) =>
    pass === total
      ? `Bước kết hợp của em qua cả ${total}/${total} mảng. Hãy chạy từng bước trên chúng nữa: qua được vẫn có thể giấu một lời gọi sai.`
      : `Bước kết hợp của em qua ${pass}/${total} mảng.`,
  expectedLabel: 'đáp án đúng',
  gotLabel: 'của em',
  /** @param {string} name @param {number[]} a @param {Problem} p @param {number | null} exp @param {number | null} got @param {boolean} ok */
  sampleAria: (name, a, p, exp, got, ok) =>
    `${name}: ${a.map(num).join(', ')}. Đáp án đúng ${value(p, exp)}, của em ${value(p, got)}, ${ok ? 'đạt' : 'chưa đạt'}. Nạp mẫu này.`,
  pass: '✓',
  fail: '✕',
  /** @param {Problem} p @param {number | null} v */
  value,
  num,
  /** @param {number} n */
  treeLabel: (n) => `Cây đệ quy của các lời gọi trên ${n} giá trị, mỗi nút là một đoạn.`,
  /** @param {number} lo @param {number} hi @param {string} state @param {string} result */
  callLabel: (lo, hi, state, result) =>
    `Lời gọi ${range(lo, hi)}: ${state}${result ? `, trả về ${result}` : ''}.`,
  /** @param {number} lo @param {number} hi */
  note: (lo, hi) => (lo === hi ? String(lo) : `${lo}–${hi}`),
  /** @param {number[]} a @param {number} lo @param {number} hi */
  arrayLabel: (a, lo, hi) =>
    lo < 0
      ? `Mảng: ${a.map(num).join(', ')}.`
      : `Mảng: ${a.map(num).join(', ')}. Lời gọi hiện tại xử lí ${range(lo, hi)}.`,
  callStates: {
    active: 'đang chạy',
    frontier: 'đang chờ hai nửa',
    sorted: 'đúng với đoạn của nó',
    swap: 'sai với đoạn của nó',
    '': 'chưa được gọi',
  },
  markers: { active: '▶', frontier: '…', sorted: '✓', swap: '✕', compare: '·' },
  legend: {
    active: 'Lời gọi đang chạy',
    frontier: 'Đang chờ hai nửa',
    sorted: 'Trả về giá trị đúng cho đoạn của nó',
    swap: 'Trả về giá trị sai cho đoạn của nó',
    idle: 'Chưa được gọi',
    compare: 'Thuộc đoạn vắt qua mid tốt nhất, hoặc là một bản của ứng viên đang được đếm',
  },
  windows: { left: 'trái', right: 'phải', suffix: 'hậu tố', prefix: 'tiền tố' },
  stats: {
    calls: 'Số lời gọi',
    reads: 'Số ô đã đọc',
    returned: 'Đáp án của em',
    expected: 'Đáp án đúng',
  },
  pending: '—',
  stackTitle: 'Các lời gọi đang mở, ngoài cùng trước',
  stackEmpty: 'không có',
  /** @param {string} id */
  stackChip: (id) => `[${id.replace('-', ', ')}]`,
  practiceTitle: 'Câu hỏi về bước kết hợp',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Đoạn con có tổng lớn nhất, bước kết hợp chỉ có max(L, R), Mẫu 1 (−2, 1, −3, 4, −1, 2, 1, −5, 4). Bước kết hợp của em trả về bao nhiêu cho cả mảng?',
      answer: 4,
      hints: [
        'Đây là bước kết hợp trang mở ra lúc đầu. Đọc ô Đáp án của em sau bước cuối.',
        'Không có C, mọi đáp án đều là một ô đơn lẻ hoặc một đoạn không bao giờ vắt qua một mid nào.',
      ],
      solution:
        '4. Đoạn tốt nhất là 4, −1, 2, 1 = 6, ở các chỉ số 3–6, và nó vắt qua mid = 4 của lời gọi ngoài cùng. max(L, R) không bao giờ dựng được đoạn đó, nên giá trị tốt nhất nó giữ được là ô 4 đơn lẻ.',
    },
    {
      type: 'choice',
      prompt:
        'Vẫn bước kết hợp và mẫu đó. Lời gọi nào là lời gọi đầu tiên trả về giá trị sai cho chính đoạn của nó?',
      options: ['[0, 1]', '[3, 4]', '[5, 6]', '[0, 8]'],
      answer: 2,
      hints: ['Bấm Nhảy đến lời gọi sai đầu tiên.', 'Tìm một đoạn hai ô mà cả hai ô đều dương.'],
      solution:
        '[5, 6]: nó chứa 2 và 1, nên đoạn tốt nhất là 2 + 1 = 3, nhưng max(L, R) = max(2, 1) = 2. [0, 1] (−2, 1) và [3, 4] (4, −1) đều đúng, vì đoạn tốt nhất của chúng chỉ gồm một ô.',
    },
    {
      type: 'choice',
      prompt:
        'Đoạn con có tổng lớn nhất, chỉ chọn C. Bốn mẫu vẫn cho đáp án cuối cùng đúng. Mẫu nào bắt được lỗi?',
      options: ['Mẫu 1', 'Mẫu 2', 'Mẫu 3', 'Mẫu 4', 'Mẫu 5'],
      answer: 2,
      hints: [
        'Chỉ chọn C rồi đọc dấu ✕ trong Kiểm tra trên dữ liệu mẫu.',
        'C luôn lấy ít nhất một ô từ mỗi nửa. Khi nào một ô đơn lẻ lại tốt hơn?',
      ],
      solution:
        'Mẫu 3 (−8, −3, −6, −2, −5, −4), toàn số âm. Đoạn tốt nhất là ô −2 đơn lẻ, nhưng C luôn nối ít nhất một ô từ mỗi nửa, nên lời gọi ngoài cùng trả về C = −6 + (−2) = −8. Ở các mẫu khác, đoạn tốt nhất vắt qua mid ngoài cùng, nên đáp án cuối cùng vẫn đúng dù các lời gọi nhỏ hơn bị sai.',
    },
    {
      type: 'number',
      prompt:
        'Phần tử chiếm đa số với bước kết hợp đúng (L, R và đếm), Mẫu 1 (3, 3, 4, 2, 4, 4, 2, 4, 4). Cả lượt chạy đọc bao nhiêu ô?',
      answer: 38,
      unit: 'ô',
      hints: [
        'Chọn cả ba phần, đi đến bước cuối, rồi đọc ô Số ô đã đọc.',
        'Mỗi lá trong 9 lá đọc một ô; mỗi lời gọi có chia mà vẫn còn ứng viên thì đọc cả đoạn của nó một lần.',
      ],
      solution:
        '38: 9 lá đọc 9 ô, và 8 lời gọi có chia đếm trên các đoạn gồm 9, 5, 3, 2, 2, 4, 2 và 2 ô, thêm 29 ô nữa. Khoảng n ô mỗi tầng qua khoảng log₂ n tầng: đúng O(n log n) của hệ thức truy hồi.',
    },
    {
      type: 'choice',
      prompt: 'Phần tử chiếm đa số, chọn R và đếm nhưng không chọn L. Bước kết hợp sai ở mẫu nào?',
      options: ['Mẫu 1', 'Mẫu 2', 'Mẫu 3', 'Mẫu 4', 'Mẫu 5'],
      answer: 1,
      hints: [
        'Đọc dấu ✕ trong Kiểm tra trên dữ liệu mẫu.',
        'Tìm một mẫu có phần tử đa số chỉ nằm ở nửa trái.',
      ],
      solution:
        'Mẫu 2 (4, 4, 4, 1, 2): nửa trái [0, 2] toàn là 4, nửa phải [3, 4] không có phần tử đa số. Chỉ thử R thì lời gọi ngoài cùng không có ứng viên nào và trả về không có, dù 4 chiếm 3 trên 5 ô.',
    },
    {
      type: 'number',
      prompt:
        'Phần tử chiếm đa số, chọn L và R nhưng không đếm. Đáp án cuối cùng vẫn đúng ở bao nhiêu trong năm mẫu?',
      answer: 2,
      unit: 'mẫu',
      hints: [
        'Bỏ chọn phần đếm rồi đọc danh sách Kiểm tra trên dữ liệu mẫu.',
        'Không đếm thì một lời gọi trả về L bất cứ khi nào nửa trái có phần tử đa số, kể cả khi nó không chiếm đa số trên cả đoạn.',
      ],
      solution:
        '2: Mẫu 2 và Mẫu 3 qua được vì ứng viên của nửa trái tình cờ cũng là phần tử đa số của cả mảng. Mẫu 1 trả về 3, Mẫu 4 trả về 1 và Mẫu 5 trả về 1, đều sai.',
    },
    {
      type: 'multi',
      prompt: 'Những bước kết hợp nào đúng cho bài toán đoạn con có tổng lớn nhất trên mọi mảng?',
      options: ['max(L, R)', 'max(L, R, C)', 'max(L, R, C, T)', 'max(C)', 'max(L, R, T)'],
      answers: [1, 2],
      hints: [
        'Thử từng cách trên các mẫu và vài mảng ngẫu nhiên, rồi tìm dấu ✕ trên cây.',
        'T là một đoạn vắt qua mid, chính là cả đoạn. Nó có bao giờ lớn hơn C không?',
      ],
      solution:
        'max(L, R, C) bao quát cả ba nơi đoạn tốt nhất có thể nằm. Thêm T không thay đổi gì, vì cả đoạn cũng là một hậu tố của nửa trái nối với một tiền tố của nửa phải, nên T ≤ C. max(L, R) và max(L, R, T) bỏ sót các đoạn vắt qua mid, còn max(C) bỏ sót các đoạn nằm gọn trong một nửa.',
    },
    {
      type: 'text',
      prompt:
        'Cả hai bước kết hợp đúng đều đọc đoạn một lần, nên T(n) = 2T(n/2) + n. Thời gian chạy theo kí hiệu O lớn là bao nhiêu?',
      accept: ['O(n log n)', 'n log n', 'Θ(n log n)', 'O(nlogn)', 'O(n log2 n)'],
      hints: [
        'a = 2, b = 2, nên n^(log_b a) = n.',
        'f(n) = n khớp với nó: trường hợp 2 của định lí thợ.',
      ],
      solution:
        'a = b = 2 cho n^(log₂ 2) = n, khớp với f(n) = n, nên trường hợp 2 thêm một thừa số log: Θ(n log n).',
    },
  ],
  /** @param {DcFrame} f @param {number[]} a */
  describe(f, a) {
    const p = f.problem;
    const name = p === 'max-subarray' ? 'best' : 'major';
    switch (f.kind) {
      case 'start':
        return `Gọi ${name}(0, ${a.length - 1}) trên ${a.length} giá trị. Mỗi lời gọi chia đoạn của nó tại mid, giải cả hai nửa, rồi chạy bước kết hợp của em.`;
      case 'split':
        return `${name}(${f.lo}, ${f.hi}): chia tại mid = ${f.mid} thành ${range(f.lo, f.mid)} và ${range(f.mid + 1, f.hi)}, rồi giải nửa trái trước.`;
      case 'base':
        return `${range(f.lo, f.hi)} chỉ có một ô, nên return a[${f.lo}] = ${num(a[f.lo])}. ${verdict(f)}`;
      case 'measure': {
        const [s, m] = /** @type {[number, number]} */ (f.suffix);
        const [m1, e] = /** @type {[number, number]} */ (f.prefix);
        return `Quay lại ${range(f.lo, f.hi)} với L = ${value(p, f.L)} và R = ${value(p, f.R)}. Hậu tố tốt nhất a[${s}..${m}] = ${num(sum(a, s, m))}, tiền tố tốt nhất a[${m1}..${e}] = ${num(sum(a, m1, e))}, nên C = ${num(/** @type {number} */ (f.C))}; T = ${num(/** @type {number} */ (f.T))}.`;
      }
      case 'count': {
        const len = f.hi - f.lo + 1;
        const parts = [];
        if (f.countL >= 0) parts.push(`L = ${value(p, f.L)} xuất hiện ${f.countL} lần`);
        if (f.countR >= 0) parts.push(`R = ${value(p, f.R)} xuất hiện ${f.countR} lần`);
        return `Quay lại ${range(f.lo, f.hi)}: đếm trên cả ${len} ô. ${parts.join(', ')}. Phần tử đa số cần xuất hiện nhiều hơn ${len / 2} lần.`;
      }
      case 'combine': {
        if (p === 'max-subarray') {
          const head = f.picked
            ? `Bước kết hợp của em trả về ${num(/** @type {number} */ (f.result))}, lấy từ ${f.picked}.`
            : 'Bước kết hợp của em không có số hạng nào, nên nó không trả về gì.';
          return `${head} ${verdict(f)}`;
        }
        const back =
          f.countL < 0 && f.countR < 0
            ? `Quay lại ${range(f.lo, f.hi)} với L = ${value(p, f.L)} và R = ${value(p, f.R)}. `
            : '';
        const head = f.picked
          ? `${back}Trả về ${f.picked} = ${value(p, f.result)}.`
          : `${back}Không ứng viên nào vượt qua phép kiểm tra, nên trả về không có.`;
        return `${head} ${verdict(f)}`;
      }
      case 'done': {
        const got = value(p, f.result);
        if (!f.ok) {
          return `Bước kết hợp của em trả về ${got} cho cả mảng, nhưng đáp án đúng là ${value(p, f.expected)}. Lời gọi sai đầu tiên là [${f.firstWrong.replace('-', ', ')}].`;
        }
        return f.firstWrong
          ? `Bước kết hợp của em trả về ${got}, đúng đáp án, nhưng lời gọi [${f.firstWrong.replace('-', ', ')}] đã sai trên đường đi. Mảng này chưa bắt được lỗi; một mảng khác sẽ bắt được.`
          : `Bước kết hợp của em trả về ${got}, đúng đáp án, và mọi lời gọi đều đúng với chính đoạn của nó.`;
      }
    }
    return '';
  },
};
