/** @typedef {import('$lib/algo-engine/recursion-induction.js').InductionFrame} InductionFrame */
/** @typedef {import('$lib/algo-engine/recursion-induction.js').InductionProgram} InductionProgram */
/** @typedef {import('$lib/algo-engine/recursion-induction.js').CheckPhase} CheckPhase */
/** @typedef {import('$lib/algo-engine/recursion-induction.js').CheckEntry} CheckEntry */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');
/** @param {number[]} values */
const list = (values) => values.map(num).join(', ');

/**
 * The comparison a check makes, as a sentence fragment.
 * @param {InductionFrame} f
 */
function compare(f) {
  const k = f.prefix;
  const acc = num(f.acc ?? 0);
  const expected = num(f.expected ?? 0);
  switch (f.program) {
    case 'sum':
      return k === 0
        ? `s = ${acc}, và tổng của không giá trị nào là 0`
        : k === 1
          ? `s = ${acc}, và a[0] = ${expected}`
          : `s = ${acc}, và tổng ${k} giá trị đầu là ${expected}`;
    case 'max':
      return k === 1
        ? `m = ${acc}, và a[0] = ${expected}`
        : `m = ${acc}, và giá trị lớn nhất trong ${k} giá trị đầu là ${expected}`;
    case 'recursive':
      return k === 0
        ? `sum(a, 0) trả về ${acc}, và tổng của không giá trị nào là 0`
        : k === 1
          ? `sum(a, 1) trả về ${acc}, và a[0] = ${expected}`
          : `sum(a, ${k}) trả về ${acc}, và tổng ${k} giá trị đầu là ${expected}`;
    case 'insertion': {
      const p = f.disorder;
      if (p >= 0) {
        return `a[${p}] = ${num(f.items[p])} > a[${p + 1}] = ${num(f.items[p + 1])}, nên a[0..${k - 1}] chưa được sắp xếp`;
      }
      return k === 1
        ? `a[0] = ${num(f.items[0])} đứng một mình nên đã được sắp xếp`
        : `a[0..${k - 1}] = ${list(f.items.slice(0, k))} đã được sắp xếp`;
    }
  }
}

/** @param {boolean|null} holds */
const verdict = (holds) => (holds ? 'đúng ✓' : 'bị phá vỡ ✗');

const programs = {
  sum: 'Vòng lặp tính tổng',
  max: 'Vòng lặp tìm max',
  insertion: 'Insertion sort',
  recursive: 'Tổng đệ quy',
};

export const vi = {
  slug: 'recursion-induction',
  topic: 'recursion',
  level: 'Trung bình',
  title: 'Đệ quy và quy nạp',
  intro:
    'Làm sao biết một vòng lặp hay một hàm đệ quy đúng với mọi đầu vào, chứ không chỉ với những đầu vào em đã thử? Bất biến vòng lặp (loop invariant) là một mệnh đề đúng trước khi vòng lặp bắt đầu và vẫn đúng sau mỗi lần lặp, nên khi thoát vòng lặp nó cho biết việc đã xong. Hàm đệ quy được chứng minh theo cùng cách, bằng quy nạp: chứng minh trường hợp cơ sở (base case), rồi chứng minh mỗi lời gọi đúng miễn là lời gọi nhỏ hơn mà nó tạo ra đúng.',
  summary:
    'Kiểm tra một bất biến vòng lặp trước và sau mỗi lần lặp, và chứng minh một hàm đệ quy bằng quy nạp, kèm các phiên bản có lỗi làm hỏng lập luận.',
  instruction:
    'Chọn một chương trình và một mảng, rồi chạy từng bước. Mỗi lần kiểm tra cho thấy bất biến, các giá trị được so sánh và bất biến có đúng không. Chọn “Thêm một lỗi” để sửa sai một dòng và xem lập luận hỏng ở đâu.',
  programLabel: 'Chương trình',
  programs,
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn…',
  presets: {
    mixed: 'Lẫn lộn',
    negative: 'Toàn số âm',
    sorted: 'Đã sắp xếp',
    reversed: 'Đảo ngược',
    zeroFirst: 'Bắt đầu bằng 0',
  },
  valuesLabel: 'Mảng a',
  buggyLabel: 'Thêm một lỗi',
  valueErrors: {
    format: 'Hãy nhập các số nguyên cách nhau bởi dấu phẩy, ví dụ 5, −2, 9.',
    count: 'Hãy dùng từ 1 đến 10 giá trị.',
    range: 'Mỗi giá trị phải nằm trong khoảng từ −99 đến 99.',
  },
  /** @param {boolean} on @param {string} program */
  bugNotice: (on, program) =>
    on
      ? `Một dòng của “${program}” giờ bị sai: dòng đó được đánh dấu “lỗi” trong mã giả.`
      : `“${program}” đã đúng trở lại.`,
  invariantTitle: { loop: 'Bất biến vòng lặp', recursive: 'Mệnh đề P(k), chứng minh bằng quy nạp' },
  invariants: {
    sum: 's = a[0] + … + a[i − 1]: s là tổng của i giá trị đầu',
    max: 'm = max(a[0], …, a[i − 1]): m là giá trị lớn nhất trong i giá trị đầu',
    insertion: 'a[0..i − 1] chứa i giá trị đầu của đầu vào, theo thứ tự đã sắp xếp',
    recursive: 'sum(a, k) trả về a[0] + … + a[k − 1], tổng của k giá trị đầu',
  },
  phases: {
    init: 'Khởi tạo',
    maintain: 'Duy trì',
    end: 'Kết thúc',
    base: 'Trường hợp cơ sở',
    step: 'Bước quy nạp',
  },
  notChecked: 'Không kiểm tra ở bước này',
  /** @param {boolean} holds */
  holdsBadge: (holds) => (holds ? '✓ đúng' : '✗ bị phá vỡ'),
  compare,
  checksTitle: 'Các lần kiểm tra đến giờ',
  checksEmpty: 'chưa có',
  /** @param {CheckEntry} e */
  checkChip(e) {
    const mark = e.holds ? '✓' : '✗';
    if (e.phase === 'base' || e.phase === 'step') return `P(${e.at}) ${mark}`;
    const tag = e.phase === 'init' ? 'đầu' : e.phase === 'end' ? 'thoát' : 'lặp';
    return `${tag} i=${e.at} ${mark}`;
  },
  stats: {
    passed: 'Số lần đúng',
    failed: 'Số lần sai',
    result: 'Đáp số',
  },
  resultPending: '…',
  /** @param {boolean} ok */
  resultNote: (ok) => (ok ? 'đúng' : 'sai'),
  /** @param {number} k */
  prefixLabel: (k) => (k === 0 ? 'rỗng' : `${k} giá trị đầu`),
  pointerI: 'i',
  pointerK: 'k',
  stackTitle: 'Các lời gọi trên stack',
  stackEmpty: 'rỗng',
  /** @param {number} k */
  callChip: (k) => `sum(a, ${k})`,
  /** @param {number[]} values @param {number} prefix */
  arrayAria: (values, prefix) =>
    `Mảng a: ${list(values)}. Bất biến bao phủ ${prefix === 0 ? 'không giá trị nào' : `từ a[0] đến a[${prefix - 1}]`}.`,
  legend: {
    covered: 'Nằm trong phạm vi bất biến hoặc mệnh đề',
    current: 'Đang được xử lí',
    disorder: 'Sai thứ tự',
  },
  markers: { covered: '▬', current: '▶', disorder: '!' },
  /** @param {InductionFrame} f */
  describe(f) {
    const name = programs[f.program];
    switch (f.kind) {
      case 'start':
        return f.program === 'recursive'
          ? `Mục tiêu: sum(a, ${f.items.length}) trả về tổng của cả ${f.items.length} giá trị. Ta chứng minh mệnh đề P(k) với mọi k bằng quy nạp: trước hết là P(0), rồi đến “P(k − 1) đúng ⇒ P(k) đúng”.`
          : `Mục tiêu: “${name}” đúng với mọi đầu vào. Lập luận dựa trên bất biến vòng lặp: ta kiểm tra nó trước lần lặp đầu tiên, sau mỗi lần lặp và khi thoát.`;
      case 'init':
        return `Khởi tạo, trước lần lặp đầu tiên (i = ${f.i}): ${compare(f)}. Bất biến ${verdict(f.holds)}.`;
      case 'body':
        if (f.program === 'insertion') {
          return `Lần lặp với i = ${f.i}: chèn key = ${num(f.key ?? 0)} vào phần đã sắp xếp, dời ${f.moved} giá trị sang phải. Chưa kiểm tra: i vẫn là ${f.i}.`;
        }
        return f.program === 'sum'
          ? `Lần lặp với i = ${f.i}: s = s + a[${f.i}] = ${num(f.acc ?? 0)}. Giữa một lần lặp, bất biến có thể tạm bị phá vỡ: s đã cộng a[${f.i}] nhưng i vẫn là ${f.i}, nên ở đây ta không kiểm tra.`
          : `Lần lặp với i = ${f.i}: so sánh a[${f.i}] = ${num(f.items[f.i])} với m, được m = ${num(f.acc ?? 0)}. Ta chưa kiểm tra cho tới khi i tăng lên.`;
      case 'check':
        return `Duy trì, sau lần lặp (i = ${f.i}): ${compare(f)}. Bất biến ${verdict(f.holds)}.`;
      case 'exit': {
        const n = f.items.length;
        const tail = f.holds
          ? 'Với i = n, bất biến chính là mục tiêu.'
          : `Bất biến bị phá vỡ, nên lập luận không chứng minh được gì, và đáp số ${f.correct ? 'chỉ tình cờ đúng' : 'bị sai'}.`;
        return `Kết thúc, vòng lặp dừng ở i = n = ${n}: ${compare(f)}. ${tail}`;
      }
      case 'call':
        return f.i === 0
          ? 'Gọi sum(a, 0): k = 0, trường hợp cơ sở.'
          : `Gọi sum(a, ${f.i}). Lời gọi này cần sum(a, ${f.i - 1}) trước, nên thêm một khung được đẩy vào stack.`;
      case 'base':
        return `Trường hợp cơ sở: ${compare(f)}. P(0) ${verdict(f.holds)}.`;
      case 'step': {
        const k = f.i;
        const prev = f.log.at(-2);
        const shaky =
          prev && !prev.holds
            ? ` Giả thiết P(${k - 1}) sai, nên bước này dựa trên một mệnh đề đã hỏng.`
            : '';
        return `Bước quy nạp cho P(${k}): r = sum(a, ${k - 1}), rồi cộng a[${k - 1}] = ${num(f.items[k - 1])}. Giờ ${compare(f)}. P(${k}) ${verdict(f.holds)}.${shaky}`;
      }
      case 'done': {
        const answer = f.program === 'insertion' ? list(f.items) : num(f.acc ?? 0);
        const checks =
          f.failed > 0
            ? `${f.failed}/${f.passed + f.failed} lần kiểm tra bị sai.`
            : f.buggy
              ? `Cả ${f.passed} lần kiểm tra đều đúng trên đầu vào này, nhưng lỗi vẫn còn đó: lập luận phải đúng với mọi đầu vào, và trên những đầu vào khác, dòng lỗi sẽ phá vỡ bất biến.`
              : `Cả ${f.passed} lần kiểm tra đều đúng, nên lập luận đứng vững với đầu vào này và, theo đúng cách suy luận ấy, với mọi đầu vào.`;
        const wrong = f.correct
          ? ''
          : ` Đáp số đúng là ${f.program === 'insertion' ? 'mảng đã sắp xếp' : num(f.expected ?? 0)}.`;
        return `Xong: đáp số là ${answer}. ${checks}${wrong}`;
      }
    }
  },
  takeaways: [
    'Bất biến vòng lặp là một mệnh đề về các biến của vòng lặp, đúng trước lần lặp đầu tiên (khởi tạo) và vẫn đúng sau mỗi lần lặp (duy trì).',
    'Khi thoát (kết thúc), bất biến cộng với điều kiện dừng, ở đây là i = n, cho đúng kết quả em muốn.',
    'Quy nạp chứng minh đệ quy theo cùng cách: chứng minh trường hợp cơ sở, rồi giả sử lời gọi nhỏ hơn đúng và chỉ ra lời gọi hiện tại cũng đúng.',
    'Chạy qua các phép thử không phải là chứng minh. Bản insertion sort (sắp xếp chèn) có lỗi vẫn đúng với mọi đầu vào đã sắp xếp, và bản tính tổng có lỗi vẫn đúng mỗi khi a[0] = 0; trên những đầu vào đó, mọi lần kiểm tra cũng đều đúng. Chỉ lập luận, vốn phải đúng với mọi đầu vào, mới loại được các lỗi.',
    'Chọn “Thêm một lỗi” cho Insertion sort, rồi thử các mẫu “Đã sắp xếp” và “Đảo ngược”: mẫu nào làm lộ lỗi, và ở lần lặp nào?',
  ],
  complexityHead: ['Chương trình', 'Thời gian / bộ nhớ', 'Vì sao'],
  complexity: [
    [
      'Vòng lặp tính tổng hoặc tìm max',
      'O(n) / O(1)',
      'Một lượt duyệt qua a. Bất biến chỉ là lập luận; nó không tốn gì khi chương trình chạy.',
    ],
    ['Insertion sort', 'O(n²) / O(1)', 'Chèn a[i] có thể phải dời cả i giá trị đứng trước nó.'],
    [
      'Tổng đệ quy',
      'O(n) / O(n)',
      'n + 1 lời gọi, tất cả cùng nằm trên stack (ngăn xếp) ở điểm sâu nhất.',
    ],
    [
      'Kiểm tra bất biến ở mỗi lần lặp',
      'O(n²) / O(1)',
      'Mỗi lần trong n lần kiểm tra phải quét lại tới n giá trị: hữu ích lúc kiểm thử, nhưng quá chậm để giữ lại.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'multi',
      prompt: 'Ba điều nào cùng nhau chứng minh một vòng lặp đúng nhờ bất biến?',
      options: [
        'Bất biến đúng trước lần lặp đầu tiên.',
        'Bất biến vẫn đúng ở giữa mọi lần lặp.',
        'Nếu bất biến đúng trước một lần lặp thì nó đúng sau lần lặp đó.',
        'Khi thoát, bất biến cùng điều kiện dừng cho ra kết quả.',
        'Thân vòng lặp chạy ít nhất một lần.',
      ],
      answers: [0, 2, 3],
      hints: ['Khởi tạo, duy trì, kết thúc.'],
      solution:
        'Khởi tạo, duy trì và kết thúc. Bất biến có thể tạm bị phá vỡ giữa một lần lặp (hãy xem s trong vòng lặp tính tổng), và một vòng lặp không chạy lần nào vẫn được khởi tạo cùng kết thúc bao quát.',
    },
    {
      type: 'choice',
      prompt:
        'Khi bật lỗi, insertion sort dùng “j > 0” thay cho “j >= 0”. Đầu vào nào qua được mọi lần kiểm tra?',
      options: ['4, 3, 2, 1', '1, 2, 3, 4', '2, 1', '3, 1, 2'],
      answer: 1,
      hints: [
        'Nhập từng mảng, chọn “Thêm một lỗi” rồi chạy đến bước cuối.',
        'Lỗi chỉ có tác dụng khi một khoá phải dời tới tận ô 0.',
      ],
      solution:
        'Với 1, 2, 3, 4, không khoá nào nhỏ hơn a[0], nên không khoá nào cần ô 0 và lỗi không bao giờ lộ ra. Ở các mảng còn lại, một giá trị nhỏ hơn đến sau và bị kẹt ở ô 1.',
    },
    {
      type: 'number',
      prompt:
        'Khi bật lỗi, trường hợp cơ sở của tổng đệ quy trả về 1. Với a = 5, −2, 9, hàm trả về bao nhiêu?',
      answer: 13,
      hints: [
        'Mỗi tầng cộng thêm một giá trị vào kết quả tầng bên dưới trả về.',
        'Nạp mảng, chọn “Thêm một lỗi” rồi chạy đến bước cuối.',
      ],
      solution:
        'sum(a, 0) = 1, rồi 1 + 5 = 6, 6 − 2 = 4, 4 + 9 = 13. Tổng thật là 12: một trường hợp cơ sở sai đưa cùng một sai số vào mọi mệnh đề phía trên nó.',
    },
    {
      type: 'number',
      prompt:
        'Quy nạp chứng minh được 1 + 3 + 5 + … + (2n − 1) = n². Vậy 1 + 3 + 5 + … + 19 bằng bao nhiêu?',
      answer: 100,
      hints: ['19 = 2n − 1, nên n = 10.'],
      solution:
        'Có n = 10 số lẻ tính tới 19, nên tổng là 10² = 100. Trường hợp cơ sở: 1 = 1². Bước quy nạp: n² + (2n + 1) = (n + 1)².',
    },
  ],
  nextTeaser:
    'Bài tiếp theo là Luyện tập: tư duy đệ quy, nơi em tự viết và lần theo các hàm đệ quy.',
};
