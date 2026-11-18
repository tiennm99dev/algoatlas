/** @typedef {import('$lib/algo-engine/rabin-karp.js').RabinKarpFrame} RabinKarpFrame */

export const vi = {
  slug: 'rabin-karp',
  topic: 'string-algorithms',
  level: 'Trung bình',
  title: 'Hash xâu và thuật toán Rabin-Karp',
  intro:
    'So hai xâu theo từng kí tự thì chậm, còn so hai số chỉ mất một bước. Hàm hash (hàm băm) đa thức biến một xâu thành một số, và rolling hash (băm cuộn) trượt số đó dọc văn bản với chi phí hằng số cho mỗi vị trí. Rabin-Karp tìm kiếm bằng cách so các số này, và chỉ đọc từng kí tự khi hai số bằng nhau.',
  summary:
    'Trượt một rolling hash đa thức trên văn bản, và xem vì sao hai giá trị hash bằng nhau có thể là khớp thật hoặc chỉ là khớp giả.',
  instruction:
    'Gõ văn bản và mẫu, rồi chạy từng bước. Giá trị hash của mỗi cửa sổ hiện ở hàng dưới cùng của bảng, còn khung bên cạnh ghi phép cập nhật cuộn bằng số. Hãy giảm số modulo hoặc chọn mẫu “Cơ số tồi” để tạo ra các lần khớp giả, khi giá trị hash bằng nhau mà các kí tự lại khác.',
  textLabel: 'Văn bản',
  patternLabel: 'Mẫu',
  baseLabel: 'Cơ số b',
  modLabel: 'Modulo q',
  presetLabel: 'Ví dụ',
  presets: {
    plain: 'Va chạm ngẫu nhiên',
    collide: 'Cơ số tồi',
    repeats: 'Toàn kí tự lặp',
    large: 'Modulo lớn',
  },
  /** @param {number} maxText @param {number} maxPattern */
  fieldErrors: (maxText, maxPattern) => ({
    empty: 'Hãy gõ ít nhất một chữ cái.',
    format: 'Chỉ dùng chữ cái a đến z, không có dấu cách.',
    textLength: `Văn bản dài tối đa ${maxText} chữ cái.`,
    patternLength: `Mẫu dài tối đa ${maxPattern} chữ cái.`,
  }),
  /** @param {number} max */
  baseError: (max) => `Cơ số phải là số nguyên từ 2 đến ${max}.`,
  /** @param {number} max */
  modError: (max) => `Modulo phải là số nguyên từ 2 đến ${max}.`,
  boardTitle: 'Cửa sổ trên văn bản',
  rows: { text: 'T', pattern: 'P', hash: '#' },
  boardNote:
    'Hàng # ghi giá trị hash của cửa sổ bắt đầu ở cột đó. Các chữ cái được tính là a = 1, b = 2, … z = 26.',
  /** @param {string} text @param {string} pattern */
  boardAria: (text, pattern) => `Văn bản ${text}, mẫu ${pattern} nằm dưới cửa sổ hiện tại.`,
  /** @param {string} rowName @param {number} c @param {string} value @param {string} state */
  cellLabel: (rowName, c, value, state) =>
    `${rowName} cột ${c}: ${value || 'trống'}${state ? `, ${state}` : ''}`,
  rowNames: { text: 'Văn bản', pattern: 'Mẫu', hash: 'Giá trị hash' },
  states: {
    window: 'trong cửa sổ',
    hashing: 'đang hash',
    read: 'đang so sánh',
    match: 'khớp thật',
    miss: 'kí tự khác nhau',
    spurious: 'khớp giả',
  },
  markers: { window: '', hashing: '#', read: '?', match: '✓', miss: '✗', spurious: '~' },
  legend: {
    window: 'Trong cửa sổ',
    hashing: 'Đang hash',
    read: 'Đang so sánh',
    match: 'Khớp thật',
    miss: 'Kí tự khác nhau',
    spurious: 'Khớp giả',
  },
  stats: {
    checks: 'Số lần so giá trị hash',
    reads: 'Số lần so kí tự',
    matches: 'Số lần khớp',
    spurious: 'Số lần khớp giả',
    naive: 'Số lần so kí tự của cách so trực tiếp',
    hashWork: 'Số kí tự đã hash, kiểu cuộn',
    scratch: 'Số kí tự đã hash, tính lại từ đầu mỗi lần',
    expected: 'Số lần khớp giả kì vọng do ngẫu nhiên',
  },
  hashTitle: 'Giá trị hash',
  patternHash: 'hash(P)',
  windowHash: 'hash(cửa sổ)',
  rollTitle: 'Cập nhật cuộn',
  /** @param {RabinKarpFrame} f */
  rollLine(f) {
    if (!f.roll) return 'Mỗi lần trượt sẽ được tính ra ở đây.';
    const { out, in: incoming, before, after } = f.roll;
    return `(${f.base} · (${before} − ${out}·${f.high}) + ${incoming}) mod ${f.mod} = ${after}`;
  },
  rollKey: 'Một chữ cái ở đây mang giá trị của nó, từ a = 1 đến z = 26.',
  matchesTitle: 'Khớp tại',
  matchesEmpty: 'chưa có',
  /** @param {RabinKarpFrame} f */
  describe(f) {
    const m = f.pattern.length;
    const w = f.text.slice(f.shift, f.shift + m);
    switch (f.kind) {
      case 'start':
        return `Tìm ${f.pattern} trong ${f.text}, với cơ số ${f.base} và modulo ${f.mod}.`;
      case 'high':
        return `Chữ cái đầu của một cửa sổ có trọng số b^(m − 1) = ${f.base}^${m - 1}, tức ${f.high} theo modulo ${f.mod}.`;
      case 'hash-letter':
        return `Đưa chữ cái ở vị trí ${f.at} vào ${f.windowHash === null ? 'hash(P)' : 'cả hai giá trị hash'}: nhân với ${f.base} rồi cộng giá trị của chữ. hash(P) = ${f.patternHash}${f.windowHash === null ? '' : `, hash(cửa sổ) = ${f.windowHash}`}.`;
      case 'too-long':
        return 'Mẫu dài hơn văn bản, nên không có cửa sổ nào.';
      case 'check':
        return f.equal
          ? `Cửa sổ ${w} ở vị trí ${f.shift} có giá trị hash ${f.windowHash}, bằng hash(P). Đó mới chỉ là dấu hiệu, nên ta kiểm tra từng kí tự.`
          : `Cửa sổ ${w} ở vị trí ${f.shift} có giá trị hash ${f.windowHash}, khác ${f.patternHash}. Nó không thể khớp, và ta không cần đọc kí tự nào.`;
      case 'verify':
        return f.equal
          ? `T[${f.shift + f.at}] = ${f.text[f.shift + f.at]} bằng P[${f.at}].`
          : `T[${f.shift + f.at}] = ${f.text[f.shift + f.at]} khác P[${f.at}] = ${f.pattern[f.at]}.`;
      case 'match':
        return `Mọi kí tự đều trùng: ${f.pattern} xuất hiện ở vị trí ${f.shift}.`;
      case 'spurious':
        return `Khớp giả: ${w} có cùng giá trị hash với ${f.pattern} nhưng kí tự khác. Bước kiểm tra đã tránh được một câu trả lời sai.`;
      case 'roll':
        return `Trượt một vị trí: bỏ ${f.roll?.out}, nhân với ${f.base}, cộng ${f.roll?.in}. Giá trị hash mới là ${f.roll?.after}, không cần đọc lại các kí tự ở giữa.`;
      case 'done':
        return `Xong: ${f.matches.length} lần khớp và ${f.spurious.length} lần khớp giả, sau ${f.hashChecks} lần so giá trị hash và ${f.letterReads} lần so kí tự.`;
    }
  },
  takeaways: [
    'Hàm hash đa thức coi một xâu là một số viết theo cơ số b: h = s[0]·b^(m−1) + … + s[m−1], tất cả lấy modulo q.',
    'Trượt một vị trí là bỏ số hạng của chữ cái đầu, nhân với b rồi cộng chữ cái mới, nên mỗi lần trượt tốn O(1) thay vì O(m).',
    'Hai xâu khác nhau có thể cùng giá trị hash. Với q nguyên tố và b ngẫu nhiên, hai xâu cho trước dài m va chạm với xác suất không quá (m − 1)/q, nên người ta thường ước lượng khoảng 1/q cho mỗi cửa sổ.',
    'Hai giá trị hash bằng nhau phải được xác nhận bằng cách đọc kí tự. Chọn q nguyên tố sẽ giúp ích, còn một cơ số là bội của q làm hỏng tất cả: chỉ còn chữ cái cuối được tính.',
    'Thử mẫu “Cơ số tồi”, rồi tăng modulo lên 101: các lần khớp giả biến mất, kéo theo những lần so kí tự bị phí.',
  ],
  complexityHead: ['Trường hợp', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Chuẩn bị', 'O(m)', 'Hash mẫu và cửa sổ đầu tiên, mỗi lần một chữ cái.'],
    [
      'Tìm kiếm, kì vọng',
      'O(n + m)',
      'Mỗi cửa sổ tốn một lần trượt O(1) và một lần so giá trị hash, ít báo động giả khi q lớn.',
    ],
    [
      'Xấu nhất',
      'O(n · m)',
      'Mọi cửa sổ đều có giá trị hash bằng nhau, như khi toàn kí tự lặp, và lần nào cũng phải xác nhận đủ m chữ cái.',
    ],
    ['Bộ nhớ', 'O(1)', 'Chỉ hai giá trị hash và b^(m − 1), ngoài chính các xâu.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với a = 1, b = 2, c = 3, cơ số 10 và modulo 1000, giá trị hash của abc là bao nhiêu?',
      answer: 123,
      hints: ['Cộng 1·10², 2·10¹ và 3·10⁰.'],
      solution: '1·100 + 2·10 + 3 = 123, nhỏ hơn modulo, nên giá trị hash là 123.',
    },
    {
      type: 'number',
      prompt:
        'Vẫn cơ số và modulo đó. Cửa sổ abc có giá trị hash 123. Dùng phép cập nhật cuộn để tìm giá trị hash của bcd, với d = 4.',
      answer: 234,
      hints: ['Ở đây high = 10² = 100. Tính 10 · (123 − 1 · 100) + 4.'],
      solution: 'Bỏ chữ a: 123 − 1·100 = 23. Dịch: 23·10 = 230. Cộng d: 230 + 4 = 234.',
    },
    {
      type: 'number',
      prompt:
        'Chọn mẫu “Cơ số tồi” (văn bản abcbabaacab, mẫu aba, cơ số 10, modulo 5) rồi chạy đến bước cuối. Có bao nhiêu lần khớp giả?',
      answer: 3,
      unit: 'lần',
      hints: [
        'Cơ số 10 là bội của 5, nên theo modulo 5 mọi số hạng đều triệt tiêu, trừ chữ cái cuối.',
      ],
      solution:
        'Chỉ chữ cái cuối được tính, nên một cửa sổ có giá trị hash trùng khi nó kết thúc bằng một chữ cái có giá trị chia 5 dư 1, mà trong các chữ cái ở đây chỉ có a. Các cửa sổ cba ở 2, baa ở 5 và aca ở 7 là khớp giả; aba ở 4 là lần khớp thật duy nhất.',
    },
    {
      type: 'choice',
      prompt:
        'Chọn mẫu “Toàn kí tự lặp”. Vì sao ở đây Rabin-Karp mất lợi thế so với cách so trực tiếp?',
      options: [
        'Phép cập nhật cuộn không chạy được với các chữ cái lặp lại',
        'Mọi cửa sổ đều khớp thật, nên ở mọi vị trí đều phải xác nhận đủ m chữ cái',
        'Modulo quá nhỏ đối với văn bản này',
        'Giá trị hash của một chữ cái lặp lại luôn bằng 0',
      ],
      answer: 1,
      hints: ['Xem mỗi cửa sổ gây ra bao nhiêu lần so kí tự.'],
      solution:
        'Mọi cửa sổ đều khớp, nên không cửa sổ nào được bỏ qua nhờ giá trị hash, và mỗi cửa sổ tốn m lần so kí tự: tổng cộng Θ(n · m). Nguyên nhân không phải báo động giả, vì ở đây không có lần khớp giả nào.',
    },
    {
      type: 'number',
      prompt:
        'Một văn bản có 1002 chữ cái và mẫu dài 3, nên có 1000 cửa sổ. Với q = 101, em dự đoán có khoảng bao nhiêu lần khớp giả do ngẫu nhiên, làm tròn đến số nguyên gần nhất?',
      answer: 10,
      tolerance: 0.5,
      unit: 'lần',
      hints: ['Mỗi cửa sổ trùng một giá trị hash cho trước khoảng một lần trong q lần thử.'],
      solution:
        '1000 cửa sổ × 1/101 ≈ 9,9, tức khoảng 10. Tăng q lên khoảng một triệu thì con số này còn khoảng 0,001.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Hàm tiền tố và thuật toán KMP, tìm mẫu mà không bao giờ phải lùi lại trên văn bản, kể cả trong trường hợp xấu nhất.',
};
