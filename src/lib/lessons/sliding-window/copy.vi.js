/** @typedef {import('$lib/algo-engine/sliding-window.js').WindowFrame} WindowFrame */
/** @typedef {import('$lib/algo-engine/sliding-window.js').WindowMode} WindowMode */

export const vi = {
  slug: 'sliding-window',
  topic: 'arrays-strings',
  level: 'Trung bình',
  title: 'Cửa sổ trượt',
  intro:
    'Cửa sổ trượt (sliding window) là một đoạn các phần tử liên tiếp, a[l..r), di chuyển dọc theo mảng, kèm theo một tổng chạy đi cùng nó. Khi cửa sổ dịch đi, chỉ phần tử vừa vào và phần tử vừa ra làm tổng thay đổi, nên mỗi bước tốn O(1) thay vì cộng lại cả cửa sổ. Nhờ vậy, nhiều câu hỏi kiểu “đoạn con tốt nhất” giảm từ O(n·k) hoặc O(n²) xuống một lượt quét O(n).',
  summary:
    'Trượt một cửa sổ cố định để tìm tổng lớn nhất của k giá trị, hoặc nới rộng rồi thu hẹp một cửa sổ thay đổi để tìm đoạn ngắn nhất có tổng ít nhất S, với tổng chạy được cập nhật trong O(1) mỗi bước.',
  instruction:
    'Chọn “Cố định” hoặc “Thay đổi”, nhập các giá trị cùng k hoặc S, rồi chạy từng bước. Để ý dấu ngoặc di chuyển: + đánh dấu giá trị được cộng vào tổng, − đánh dấu giá trị bị trừ đi. So sánh bộ đếm số lần cập nhật với chi phí vét cạn.',
  modeLegend: 'Cửa sổ',
  modes: /** @type {Record<WindowMode, string>} */ ({
    fixed: 'Cố định, độ dài k',
    variable: 'Ngắn nhất có tổng ≥ S',
  }),
  valuesLabel: 'Các giá trị',
  kLabel: 'Cửa sổ k',
  sLabel: 'Đích S',
  randomButton: 'Giá trị ngẫu nhiên',
  valueErrors: {
    format: 'Hãy nhập các số nguyên từ 0 đến 99, cách nhau bởi dấu phẩy hoặc dấu cách.',
    range: 'Mỗi giá trị phải nằm trong khoảng từ 0 đến 99.',
    count: 'Hãy nhập từ 1 đến 20 giá trị.',
  },
  /** @param {number} n */
  kError: (n) => `k phải là số nguyên từ 1 đến ${n}, tức số giá trị đã nhập.`,
  sError: 'S phải là số nguyên từ 1 đến 1980.',
  arrayTitle: 'Mảng a',
  arrayAria: 'Mảng, chỉ số 0 trước',
  /** @param {number} sum */
  windowLabel: (sum) => `tổng ${sum}`,
  bestLabel: 'tốt nhất',
  pointerL: 'l',
  pointerR: 'r',
  markers: { enter: '+', leave: '−', best: '✓' },
  /** @param {number} i @param {number} v @param {string} state */
  cellLabel: (i, v, state) => `Chỉ số ${i}: ${v}${state ? `, ${state}` : ''}`,
  states: {
    inside: 'trong cửa sổ',
    enter: 'vừa được cộng vào tổng',
    leave: 'vừa bị trừ khỏi tổng',
    best: 'trong cửa sổ tốt nhất',
  },
  legend: {
    inside: 'Trong cửa sổ',
    enter: '+ Vừa cộng vào',
    leave: '− Vừa trừ đi',
    best: '✓ Cửa sổ tốt nhất',
  },
  updateTitle: 'Tổng chạy',
  /** @param {WindowFrame} f */
  updateLine: (f) => {
    const a = f.items;
    const before =
      f.sum - (f.entering >= 0 ? a[f.entering] : 0) + (f.leaving >= 0 ? a[f.leaving] : 0);
    const plus = f.entering >= 0 ? ` + ${a[f.entering]}` : '';
    const minus = f.leaving >= 0 ? ` − ${a[f.leaving]}` : '';
    return plus || minus ? `${before}${plus}${minus} = ${f.sum}` : `${f.sum}`;
  },
  stats: {
    sum: 'Tổng cửa sổ',
    best: 'Tốt nhất đến giờ',
    bestLength: 'Ngắn nhất đến giờ',
    updates: 'Số lần cập nhật tổng',
    brute: 'Vét cạn',
    shrinks: 'Số lần dời l',
  },
  /** @param {number} n @param {number} k */
  bruteFixed: (n, k) => (n - k + 1) * k,
  /** @param {number} n */
  bruteVariable: (n) => (n * (n + 1)) / 2,
  bruteNoteFixed: 'Số phép cộng nếu tính lại tổng mọi cửa sổ từ đầu: (n − k + 1) × k.',
  bruteNoteVariable: 'Số mảng con phải thử lần lượt: n(n + 1)/2.',
  none: 'không có',
  pending: '—',
  practiceTitle: 'Tự kiểm tra',
  /** @param {WindowFrame} f */
  describe(f) {
    const a = f.items;
    switch (f.kind) {
      case 'start':
        return f.mode === 'fixed'
          ? `Tìm tổng lớn nhất của ${f.target} giá trị liên tiếp trong ${a.length} giá trị. Bắt đầu bằng cách cộng cửa sổ đầu tiên.`
          : `Tìm đoạn ngắn nhất gồm các giá trị liên tiếp có tổng ≥ ${f.target}. Cửa sổ bắt đầu rỗng ở l = 0.`;
      case 'fill':
        return `Cộng a[${f.entering}] = ${a[f.entering]}: tổng của cửa sổ đầu tiên đến giờ là ${f.sum}.`;
      case 'first':
        return `Cửa sổ đầu tiên a[0..${f.right}) có tổng ${f.sum}. Đó là tốt nhất đến giờ.`;
      case 'slide':
        return `Trượt sang phải: cộng a[${f.entering}] = ${a[f.entering]} và trừ a[${f.leaving}] = ${a[f.leaving]}, nên tổng là ${f.sum}${f.improved ? `, tốt nhất mới` : `, không hơn tốt nhất ${f.best}`}.`;
      case 'expand':
        return `Nới rộng bên phải: cộng a[${f.entering}] = ${a[f.entering]}, tổng ${f.sum}${f.sum >= f.target ? ` ≥ ${f.target}` : ` < ${f.target}, nới tiếp`}.`;
      case 'record':
        return `Tổng ${f.sum} ≥ ${f.target} với độ dài ${f.right - f.left}${f.improved ? ': ngắn nhất đến giờ' : `, không ngắn hơn ${f.best}`}. Giờ thử thu hẹp từ bên trái.`;
      case 'shrink':
        return `Trừ a[${f.leaving}] = ${a[f.leaving]} và dời l đến ${f.left}: tổng ${f.sum}.`;
      case 'done':
        if (f.mode === 'fixed')
          return `Xong: cửa sổ tốt nhất là a[${f.bestFrom}..${f.bestTo}) với tổng ${f.best}, sau ${f.updates} lần cập nhật thay vì ${(a.length - f.target + 1) * f.target}.`;
        return f.best === 0
          ? `Xong: không đoạn nào đạt tới ${f.target}, kể cả cả mảng. ${f.updates} lần cập nhật.`
          : `Xong: cửa sổ ngắn nhất là a[${f.bestFrom}..${f.bestTo}), độ dài ${f.best}. Mỗi giá trị vào một lần và ra nhiều nhất một lần: ${f.updates} lần cập nhật.`;
    }
  },
  takeaways: [
    'Cửa sổ là một đoạn a[l..r) gồm các phần tử liên tiếp. Giữ một giá trị tổng hợp chạy (ở đây là tổng) cho nó, và cập nhật từ các phần tử vào và ra thay vì tính lại.',
    'Cửa sổ cố định độ dài k: một lần khởi tạo O(k), rồi mỗi lần trượt cộng a[r] và trừ a[r − k]. Cả n − k + 1 cửa sổ tốn k + 2(n − k) lần cập nhật, O(n), thay vì (n − k + 1) × k.',
    'Cửa sổ thay đổi: dời r để nới rộng cửa sổ cho đến khi nó đạt yêu cầu, rồi dời l để thu hẹp khi nó vẫn còn đạt. Cả hai đầu chỉ đi sang phải, nên cả lượt quét là O(n).',
    'Chỉ thu hẹp được khi nới rộng không bao giờ làm kết quả tệ đi: với các giá trị ≥ 0, cửa sổ dài hơn không bao giờ có tổng nhỏ hơn. Khi có giá trị âm, hãy dùng tổng tiền tố (prefix sum).',
    'Thử cửa sổ thay đổi trên 2, 3, 1, 2, 4, 3 với S = 7: l dời 5 lần, và đáp án 4, 3 chỉ hiện ra ở mấy bước cuối.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Cửa sổ cố định, mọi vị trí',
      'O(n)',
      'k phép cộng lúc đầu, rồi 2 lần cập nhật mỗi lần trượt.',
    ],
    ['Cửa sổ cố định, tính lại từ đầu', 'O(n·k)', 'n − k + 1 cửa sổ, mỗi cửa sổ k phép cộng.'],
    ['Cửa sổ thay đổi', 'O(n)', 'r dời n lần và l dời nhiều nhất n lần.'],
    ['Mọi mảng con, vét cạn', 'O(n²)', 'Phải thử n(n + 1)/2 mảng con.'],
    ['Bộ nhớ thêm', 'O(1)', 'l, r, tổng chạy và giá trị tốt nhất.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Tổng lớn nhất của 3 giá trị liên tiếp trong [2, 1, 5, 1, 3, 2] là bao nhiêu?',
      answer: 9,
      hints: ['Các cửa sổ có tổng 8, 7, 9 và 6.'],
      solution:
        '2 + 1 + 5 = 8, rồi 8 + 1 − 2 = 7, rồi 7 + 3 − 1 = 9, rồi 9 + 2 − 5 = 6. Tốt nhất là 9, từ 5, 1, 3.',
    },
    {
      type: 'number',
      prompt:
        'Một cửa sổ cố định k = 4 trượt trên n = 10 giá trị. Nó cập nhật tổng (cộng hoặc trừ một phần tử) bao nhiêu lần?',
      answer: 16,
      unit: 'lần cập nhật',
      hints: ['Cửa sổ đầu tiên cần k phép cộng; mỗi lần trong n − k lần trượt cần 2 lần cập nhật.'],
      solution:
        '4 + 2 × (10 − 4) = 16 lần cập nhật. Tính lại mọi cửa sổ sẽ tốn (10 − 4 + 1) × 4 = 28 phép cộng.',
    },
    {
      type: 'number',
      prompt: 'Đoạn ngắn nhất trong [2, 3, 1, 2, 4, 3] có tổng ≥ 7 dài bao nhiêu?',
      answer: 2,
      hints: ['Hãy nhìn gần cuối mảng.'],
      solution: '4 + 3 = 7 có độ dài 2, và không giá trị đơn lẻ nào đạt 7.',
    },
    {
      type: 'number',
      prompt: 'Cũng trong lần tìm đó (S = 7), đầu trái l dời bao nhiêu lần?',
      answer: 5,
      unit: 'lần dời',
      hints: [
        'Chạy nó trong phần tương tác với cửa sổ thay đổi và theo dõi bộ đếm “Số lần dời l”.',
        'l dời một lần khi r = 3, hai lần khi r = 4 và hai lần khi r = 5.',
      ],
      solution:
        'Ở r = 3, tổng 8 cho phép l dời đến 1; ở r = 4, tổng 10 cho phép l dời đến 3; ở r = 5, tổng 9 cho phép l dời đến 5. Tổng cộng 1 + 2 + 2 = 5 lần dời, không bao giờ quá n.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao cửa sổ thay đổi là O(n) dù có một vòng lặp lồng trong vòng lặp khác?',
      options: [
        'l và r chỉ đi sang phải, nên mỗi phần tử vào một lần và ra nhiều nhất một lần',
        'Vòng lặp trong chạy nhiều nhất một lần cho mỗi bước của vòng lặp ngoài',
        'Mảng được sắp xếp trước',
        'Cửa sổ không bao giờ chứa quá k giá trị',
      ],
      answer: 0,
      hints: ['Đếm số lần dời l trong cả lượt chạy, đừng đếm theo từng giá trị của r.'],
      solution:
        'Vòng lặp trong có thể chạy nhiều lần cho một r, nhưng mỗi lần chạy đều dời l sang phải và l không bao giờ vượt n. Vậy vòng lặp trong chạy tổng cộng nhiều nhất n lần, và lượt quét là O(n).',
    },
  ],
  nextTeaser:
    'Khi mảng có giá trị âm, cửa sổ không còn thu hẹp an toàn. Bài sau, Tổng tiền tố và mảng hiệu, trả lời mọi truy vấn đoạn trong O(1).',
};
