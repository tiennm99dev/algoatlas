/** @typedef {import('$lib/algo-engine/manacher.js').ManacherFrame} ManacherFrame */
import { palindromeAt } from '$lib/algo-engine/manacher.js';

export const vi = {
  slug: 'manacher',
  topic: 'string-algorithms',
  level: 'Trung bình',
  title: 'Thuật toán Manacher',
  intro:
    'Cách đơn giản để tìm xâu đối xứng (palindrome) dài nhất là mở rộng từ mọi tâm, tốn O(n²) với văn bản lặp nhiều. Thuật toán Manacher nhận ra rằng phần bên trong một xâu đối xứng giống như soi gương, nên một tâm nằm trong một xâu đối xứng đã biết thì đã biết sẵn phần lớn bán kính của nó. Chỉ một ý tưởng đó cho ra mọi bán kính đối xứng trong O(n).',
  summary:
    'Tìm xâu con đối xứng dài nhất trong thời gian tuyến tính bằng cách chép bán kính từ vị trí soi gương bên trong xâu đối xứng vươn xa nhất.',
  instruction:
    'Gõ một xâu và chạy từng bước. Mỗi cung phía trên các chữ cái là một xâu đối xứng, và dải ▭ đánh dấu xâu vươn xa nhất. Khi i rơi vào trong dải, bán kính của nó bắt đầu từ vị trí soi gương m, và không kí tự nào phải đọc cho phần đó. Hãy so số lần so sánh với số lần của cách mở rộng trực tiếp.',
  textLabel: 'Xâu',
  presetLabel: 'Ví dụ',
  presets: {
    nested: 'Đối xứng lồng nhau',
    even: 'Một xâu đối xứng độ dài chẵn',
    repeats: 'Chỉ một chữ cái',
    none: 'Không lặp',
  },
  /** @param {number} max */
  fieldErrors: (max) => ({
    empty: 'Hãy gõ ít nhất một chữ cái.',
    format: 'Chỉ dùng chữ cái a đến z, không có dấu cách.',
    length: `Xâu dài tối đa ${max} chữ cái.`,
  }),
  boardTitle: 'Bán kính đối xứng vẽ thành cung',
  /** @param {string} s */
  boardAria: (s) =>
    `Các cung trên dạng đã chèn dấu ngăn cách của ${s}, mỗi cung ứng với một xâu đối xứng tìm được.`,
  boardNote:
    'Các dấu # nằm giữa các chữ cái, nên một xâu đối xứng độ dài chẵn như abba cũng có tâm. P[i] là bán kính tại i trong T và bằng độ dài của xâu đối xứng trong S.',
  rowP: 'P',
  rowIndex: 'i',
  /** @param {number} c @param {string} letter @param {string} p @param {string} state */
  cellLabel: (c, letter, p, state) =>
    `Vị trí ${c}: ${letter}${p ? `, bán kính ${p}` : ''}${state ? `, ${state}` : ''}`,
  states: {
    current: 'tâm i',
    mirror: 'vị trí soi gương của i',
    band: 'trong xâu đối xứng vươn xa nhất',
    equal: 'kí tự bằng nhau',
    miss: 'kí tự khác nhau',
    best: 'xâu đối xứng dài nhất',
  },
  markers: { current: 'i', mirror: 'm', band: '', equal: '✓', miss: '✗', best: '★' },
  legend: {
    current: 'i Tâm hiện tại',
    mirror: 'm Vị trí soi gương của i',
    band: '▭ Xâu đối xứng vươn xa nhất',
    equal: '✓ Kí tự bằng nhau',
    miss: '✗ Kí tự khác nhau',
    best: '★ Dài nhất tìm được',
  },
  centreMark: 'C',
  rightMark: 'R',
  arcs: {
    done: 'Cung mảnh: một bán kính đã tính xong',
    current: 'Cung đậm: bán kính của i',
    mirror: 'Cung nét đứt: bán kính của vị trí soi gương',
  },
  stats: {
    i: 'Tâm i',
    band: 'Tâm C, đầu phải R',
    comparisons: 'Số lần so kí tự',
    reused: 'Bán kính dùng lại không cần đọc',
    naive: 'Số lần so sánh của cách mở rộng trực tiếp',
    best: 'Độ dài lớn nhất',
  },
  /** @param {number} c @param {number} r */
  bandValue: (c, r) => (r === 0 ? '—' : `${c}, ${r}`),
  answerTitle: 'Xâu đối xứng dài nhất đến giờ',
  answerEmpty: 'chưa có',
  /** @param {ManacherFrame} f */
  answer: (f) => palindromeAt(f.s, f.bestCentre, f.best),
  /** @param {ManacherFrame} f */
  describe(f) {
    const { t, i, value, c, r } = f;
    const left = i - value - 1;
    const right = i + value + 1;
    switch (f.kind) {
      case 'start':
        return `Chèn # vào giữa các chữ cái: T = ${t}. Giờ mọi xâu đối xứng đều có một tâm, dù độ dài của nó lẻ hay chẵn.`;
      case 'outside':
        if (r === 0)
          return `Chưa có xâu đối xứng nào vươn quá i = ${i}, nên bắt đầu từ bán kính 0.`;
        return i === r
          ? `i = ${i} nằm ở đầu phải R, nên chưa biết gì: bắt đầu từ bán kính 0.`
          : `i = ${i} nằm ngoài xâu đối xứng vươn xa nhất, nên chưa biết gì: bắt đầu từ bán kính 0.`;
      case 'inside':
        return `i = ${i} nằm trong xâu đối xứng quanh ${c}, nên nó soi gương với vị trí ${f.mirror}. Bắt đầu từ min(R − i, P[${f.mirror}]) = min(${r - i}, ${f.p[f.mirror]}) = ${value}, không cần đọc các kí tự đó.`;
      case 'compare':
        return f.equal
          ? `T[${left}] = T[${right}] = ${t[left]}, nên bán kính tăng lên ${value + 1}.`
          : `T[${left}] = ${t[left]} khác T[${right}] = ${t[right]}, nên bán kính giữ nguyên ${value}.`;
      case 'box':
        return `Xâu đối xứng này vươn xa hơn sang phải, nên C = ${c} và R = ${r}.`;
      case 'store':
        return `P[${i}] = ${value}.`;
      case 'best':
        return `Dài nhất mới: bán kính ${value} ứng với ${palindromeAt(f.s, i, value)} trong S, độ dài ${value}.`;
      case 'done':
        return `Xong: xâu đối xứng dài nhất là ${palindromeAt(f.s, f.bestCentre, f.best)}, độ dài ${f.best}, sau ${f.comparisons} lần so sánh.`;
    }
  },
  takeaways: [
    'Chèn # vào giữa các chữ cái giúp mọi xâu đối xứng, độ dài lẻ hay chẵn, đều có đúng một tâm trong T. Khi đó bán kính P[i] bằng độ dài của xâu đối xứng trong S.',
    'Bên trong một xâu đối xứng tâm C, vị trí i soi gương sang 2C − i, và các kí tự quanh hai vị trí đó giống hệt nhau.',
    'Vì vậy P[i] bắt đầu từ min(R − i, P[2C − i]). Giới hạn này quan trọng: vượt quá R thì vị trí soi gương không chứng minh được gì.',
    'Mỗi lần so sánh khớp đẩy R sang phải, và R không bao giờ lùi, nên tổng số lần so sánh là tuyến tính.',
    'Thử “Chỉ một chữ cái” và “Không lặp”: so số lần so sánh với cách mở rộng trực tiếp và để ý xem bao nhiêu phần bán kính được dùng lại.',
  ],
  complexityHead: ['Cách làm', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Manacher',
      'O(n)',
      'Mỗi lần so sánh khớp đẩy R sang phải, và mỗi tâm có nhiều nhất một lần so sánh thất bại: tổng cộng tối đa 2|T|, với |T| = 2n + 1.',
    ],
    [
      'Mở rộng từ mọi tâm',
      'O(n²)',
      'Một văn bản chỉ có một chữ cái khiến mỗi tâm mở rộng xa hết mức có thể.',
    ],
    [
      'Kiểm tra mọi xâu con',
      'O(n³)',
      'Có khoảng n²/2 xâu con, và kiểm tra một xâu tốn đến n bước.',
    ],
    ['Bộ nhớ', 'O(n)', 'Xâu đã chèn dấu ngăn cách và một bán kính cho mỗi vị trí.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Với S = abba, xâu đã chèn dấu ngăn cách T dài bao nhiêu?',
      answer: 9,
      unit: 'kí tự',
      hints: ['Có một dấu # ở trước, ở giữa và ở sau các chữ cái: 2n + 1 kí tự.'],
      solution: 'T = #a#b#b#a#, gồm 2 × 4 + 1 = 9 kí tự.',
    },
    {
      type: 'number',
      prompt: 'Với S = abba, bán kính P[4], tại dấu # ở giữa T, bằng bao nhiêu?',
      answer: 4,
      unit: 'kí tự',
      hints: ['Mở rộng từ giữa #a#b#b#a# chừng nào hai bên còn khớp.'],
      solution: 'Toàn bộ T đối xứng quanh chỉ số 4, nên bán kính là 4: bằng đúng độ dài của abba.',
    },
    {
      type: 'number',
      prompt:
        'Xâu đối xứng vươn xa nhất có C = 7 và R = 12. Vị trí soi gương của i = 9 là bao nhiêu?',
      answer: 5,
      unit: 'vị trí',
      hints: ['Vị trí soi gương là 2C − i.'],
      solution: '2 × 7 − 9 = 5.',
    },
    {
      type: 'number',
      prompt:
        'Với C = 7, R = 12 và i = 9, vị trí soi gương có P = 1. Trước khi đọc kí tự nào, i bắt đầu từ bán kính bao nhiêu?',
      answer: 1,
      unit: 'kí tự',
      hints: ['Dùng min(R − i, P[2C − i]).'],
      solution: 'min(12 − 9, 1) = min(3, 1) = 1.',
    },
    {
      type: 'text',
      prompt: 'Xâu đối xứng dài nhất trong xabbay là gì?',
      accept: ['abba'],
      hints: ['Chọn “Một xâu đối xứng độ dài chẵn” rồi chạy đến bước cuối.'],
      solution:
        'abba, độ dài 4. Tâm của nó là dấu # giữa hai chữ b, đó là lí do T cần các dấu ngăn cách.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Chỉ một chữ cái” rồi chạy đến bước cuối. So với cách mở rộng trực tiếp, vị trí soi gương tiết kiệm được bao nhiêu lần so sánh?',
      answer: 49,
      unit: 'lần',
      hints: ['Đọc hai ô số liệu ở bước cuối rồi trừ.'],
      solution:
        'Với aaaaaaaa, cách mở rộng trực tiếp tốn 64 lần so sánh trên T, mỗi bước mở rộng từ mỗi tâm một lần. Ở đây Manacher chỉ tốn 15, nên tiết kiệm được 49 lần.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Biểu thức chính quy và mô phỏng NFA, dựng một ô-tô-mát từ biểu thức em gõ và theo dõi tập trạng thái khi đọc từng kí tự.',
};
