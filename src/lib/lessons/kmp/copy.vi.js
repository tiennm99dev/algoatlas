/** @typedef {import('$lib/algo-engine/kmp.js').KmpFrame} KmpFrame */

export const vi = {
  slug: 'kmp',
  topic: 'string-algorithms',
  level: 'Trung bình',
  title: 'Hàm tiền tố và thuật toán KMP',
  intro:
    'Khi cách tìm trực tiếp thất bại sau khi đã khớp vài kí tự, nó bắt đầu lại và đọc lại các kí tự đó. Knuth-Morris-Pratt thì không bao giờ làm vậy: hàm tiền tố (prefix function) của mẫu cho biết phần vừa khớp còn giữ được bao nhiêu để làm đầu của một lần khớp mới. Nhờ đó văn bản chỉ được đọc một lượt, tổng cộng O(n + m).',
  summary:
    'Dựng hàm tiền tố của một mẫu, rồi xem KMP lùi theo nó khi gặp kí tự không khớp mà không phải đi ngược trên văn bản.',
  instruction:
    'Gõ văn bản và mẫu, rồi chạy từng bước. Trước hết mẫu được so với chính nó để điền hàng π. Khi tìm kiếm, hàng mẫu nhảy sang phải lúc không khớp, còn cột đang đọc thì đứng yên. Hãy để ý các ô ↩: đó là phần viền giúp giữ lại các kí tự đã khớp.',
  textLabel: 'Văn bản',
  patternLabel: 'Mẫu',
  presetLabel: 'Ví dụ',
  presets: {
    classic: 'Khớp một phần',
    border: 'Viền dài',
    overlap: 'Các lần khớp chồng nhau',
    repeats: 'Kí tự lặp lại',
  },
  /** @param {number} maxText @param {number} maxPattern */
  fieldErrors: (maxText, maxPattern) => ({
    empty: 'Hãy gõ ít nhất một chữ cái.',
    format: 'Chỉ dùng chữ cái a đến z, không có dấu cách.',
    textLength: `Văn bản dài tối đa ${maxText} chữ cái.`,
    patternLength: `Mẫu dài tối đa ${maxPattern} chữ cái.`,
  }),
  boardTitle: { build: 'Mẫu so với chính nó', search: 'Mẫu so với văn bản' },
  rows: { top: { build: 'P', search: 'T' }, under: 'P' },
  /** @param {string} top @param {string} pattern */
  boardAria: (top, pattern) => `${top}, với mẫu ${pattern} đặt thẳng hàng bên dưới.`,
  piTitle: 'Hàm tiền tố',
  piRows: { letter: 'P', pi: 'π' },
  piNote: 'π[i] là độ dài của tiền tố thực sự dài nhất của P[0..i] đồng thời là hậu tố của nó.',
  /** @param {string} pattern */
  piAria: (pattern) => `Hàm tiền tố của ${pattern}.`,
  /** @param {string} rowName @param {number} c @param {string} value @param {string} state */
  cellLabel: (rowName, c, value, state) =>
    `${rowName} cột ${c}: ${value || 'trống'}${state ? `, ${state}` : ''}`,
  rowNames: { top: 'Hàng trên', under: 'Hàng mẫu', letter: 'Kí tự của mẫu', pi: 'Giá trị π' },
  states: {
    matched: 'đã khớp đến giờ',
    read: 'đang đọc',
    equal: 'kí tự bằng nhau',
    miss: 'kí tự khác nhau',
    border: 'viền được giữ sau khi nhảy',
    found: 'khớp toàn bộ',
  },
  markers: { matched: '=', read: '?', equal: '✓', miss: '✗', border: '↩', found: '★' },
  legend: {
    matched: 'Đã khớp đến giờ',
    read: 'Đang đọc',
    equal: 'Kí tự bằng nhau',
    miss: 'Kí tự khác nhau',
    border: 'Viền được giữ sau khi nhảy',
    found: 'Khớp toàn bộ',
  },
  stats: {
    i: 'Chỉ số i',
    k: 'Số kí tự đã khớp',
    build: 'Số lần so sánh khi dựng π',
    comparisons: 'Số lần so sánh khi tìm',
    falls: 'Số lần nhảy lùi',
    naive: 'Số lần so sánh của cách tìm trực tiếp',
  },
  /** @param {number} n */
  bound: (n) => `Với văn bản này, phần tìm kiếm không bao giờ vượt quá 2n = ${2 * n} lần so sánh.`,
  matchesTitle: 'Khớp tại',
  matchesEmpty: 'chưa có',
  /** @param {KmpFrame} f */
  describe(f) {
    const { text: T, pattern: P, i, k } = f;
    const top = f.phase === 'build' ? 'P' : 'T';
    const topAt = f.phase === 'build' ? P[i] : T[i];
    switch (f.kind) {
      case 'start':
        return `Trước hết tính hàm tiền tố của ${P}. π[0] luôn bằng 0: tiền tố thực sự của một xâu một kí tự là xâu rỗng.`;
      case 'build-compare':
      case 'compare': {
        const compared = `So ${top}[${i}] = ${topAt} với P[${k}] = ${P[k]}`;
        if (f.equal) return `${compared}: bằng nhau, nên đã khớp ${k + 1} kí tự.`;
        return k === 0
          ? `${compared}: khác nhau, và chưa có gì khớp, nên ta sang kí tự kế tiếp.`
          : `${compared}: khác nhau, trong khi vừa khớp được ${k} kí tự.`;
      }
      case 'build-fall':
      case 'fall':
        if (k === 0)
          return `Nhảy lùi: π[${f.fallFrom - 1}] = 0. Không phần nào của đoạn đã khớp có thể làm đầu một lần khớp, nên dời P sang phải ${f.fallFrom} ô. Chỉ số i vẫn ở ${i}.`;
        return `Nhảy lùi: π[${f.fallFrom - 1}] = ${k}. ${k} kí tự cuối của đoạn đã khớp cũng là ${k} kí tự đầu của P, nên ta giữ chúng lại và dời P sang phải ${f.fallFrom - k} ô. Chỉ số i vẫn ở ${i}.`;
      case 'build-store':
        return `Vậy π[${i}] = ${k}: ${i + 1} kí tự đầu của P có viền dài ${k}.`;
      case 'search-start':
        return `π đã sẵn sàng. Giờ ta quét ${T} từ trái sang, chưa khớp kí tự nào.`;
      case 'match':
        return `Cả ${P.length} kí tự đều khớp: ${P} xuất hiện ở vị trí ${i - P.length + 1}.`;
      case 'advance':
        return `Để bắt được các lần khớp chồng nhau, ta lùi về π[${f.fallFrom - 1}] = ${k} rồi quét tiếp.`;
      case 'done':
        return `Xong: ${f.matches.length} lần khớp với ${f.comparisons} lần so sánh, và i chưa bao giờ đi lùi.`;
    }
  },
  takeaways: [
    'π[i], còn gọi là hàm thất bại (failure function), là độ dài tiền tố thực sự dài nhất của P[0..i] đồng thời là hậu tố của nó: viền (border) dài nhất của nó.',
    'Sau một lần không khớp khi đã khớp q kí tự, ta đã biết các kí tự đó mà không cần đọc lại văn bản, nên q có thể nhảy thẳng về π[q − 1].',
    'Chỉ số trên văn bản chỉ tiến lên. Mỗi lần so sánh hoặc làm i tăng, hoặc làm q giảm, mà q không thể giảm nhiều lần hơn số lần nó tăng, nên phần tìm kiếm tốn tối đa 2n lần so sánh.',
    'Dựng π cũng chính là thuật toán đó, với mẫu tự tìm trong chính nó, nên tốn O(m).',
    'Thử mẫu “Kí tự lặp lại”: so số lần so sánh của cách tìm trực tiếp với số ở đây, rồi gõ một mẫu không có tiền tố lặp lại và xem mọi lần nhảy đều về 0.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Dựng π', 'O(m)', 'k tăng tối đa 1 cho mỗi kí tự, và mỗi lần nhảy lùi làm nó giảm.'],
    [
      'Tìm kiếm',
      'O(n)',
      'i không bao giờ lùi, và q giảm không nhiều lần hơn số lần nó tăng: tối đa 2n lần so sánh.',
    ],
    [
      'Bộ nhớ',
      'O(m)',
      'Một giá trị π cho mỗi kí tự của mẫu; văn bản thậm chí có thể là một luồng dữ liệu.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Với P = abcabd, π[4], giá trị ứng với tiền tố abcab, bằng bao nhiêu?',
      answer: 2,
      hints: ['Tìm tiền tố thực sự dài nhất của abcab đồng thời là hậu tố của nó.'],
      solution:
        'ab vừa là tiền tố vừa là hậu tố của abcab. Các ứng viên dài hơn đều không được: abc khác cab, và abca khác bcab. Vậy π[4] = 2.',
    },
    {
      type: 'number',
      prompt: 'Với P = aabaaab, π[6] bằng bao nhiêu? Hãy gõ mẫu vào phần tương tác để kiểm tra.',
      answer: 3,
      hints: ['Kiểm tra xem aab, ba kí tự đầu, có đồng thời là phần cuối của aabaaab không.'],
      solution:
        'aab vừa là hậu tố vừa là tiền tố của aabaaab. Không có viền nào dài hơn, nên π[6] = 3.',
    },
    {
      type: 'number',
      prompt:
        'Tìm với P = ababd, bốn kí tự đầu khớp còn kí tự thứ năm không khớp. Sau khi nhảy lùi, còn bao nhiêu kí tự được giữ là đã khớp?',
      answer: 2,
      unit: 'kí tự',
      hints: ['Với q = 4, bước nhảy đi đến π[3], viền dài nhất của abab.'],
      solution: 'π[3] = 2 vì ab là một viền của abab, nên q thành 2 và P dời sang phải 2 ô.',
    },
    {
      type: 'number',
      prompt:
        'Chọn mẫu “Kí tự lặp lại” rồi chạy đến bước cuối. Phần tìm kiếm dùng ít hơn cách tìm trực tiếp bao nhiêu lần so sánh?',
      answer: 33,
      unit: 'lần',
      hints: ['Đọc hai ô số liệu ở bước cuối rồi trừ.'],
      solution:
        'Cách tìm trực tiếp tốn 60 lần so sánh còn phần tìm kiếm của KMP tốn 27, nên ít hơn 60 − 27 = 33 lần.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao phần tìm kiếm không cần đọc lại các kí tự vừa khớp?',
      options: [
        'Chúng được lưu trong một hash table',
        'Các kí tự đó trùng với một phần đã biết của mẫu, nên π đã cho biết chúng chồng lên nhau thế nào',
        'Văn bản được sắp xếp trước',
        'Một lần không khớp nghĩa là không lần khớp nào sau đó có thể chồng lên chúng',
      ],
      answer: 1,
      hints: ['Em biết gì về các kí tự của văn bản vừa khớp?'],
      solution:
        'Các kí tự văn bản vừa khớp chính là P[0..q), nên mọi điều về cách chúng chồng lên nhau đều là tính chất của mẫu, đã được tính trước trong π.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Thuật toán Boyer-Moore, so mẫu từ phải sang trái và có thể nhảy qua phần lớn văn bản mà không cần đọc.',
};
