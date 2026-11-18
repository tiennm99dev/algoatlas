/** @typedef {import('$lib/algo-engine/lcs-edit-distance.js').StringDpFrame} StringDpFrame */
/** @typedef {import('$lib/algo-engine/lcs-edit-distance.js').StringDpMode} StringDpMode */
/** @typedef {import('$lib/algo-engine/lcs-edit-distance.js').StringDpOp} StringDpOp */

/** @param {StringDpOp} o */
const opLabel = (o) =>
  ({
    keep: `giữ ${o.from}`,
    replace: `${o.from} → ${o.to}`,
    delete: `xoá ${o.from}`,
    insert: `chèn ${o.to}`,
  })[o.op];

export const vi = {
  slug: 'lcs-edit-distance',
  topic: 'dynamic-programming',
  level: 'Trung bình',
  title: 'Dãy con chung dài nhất và khoảng cách sửa',
  intro:
    'Để so sánh hai xâu, ta cho mỗi ô ứng với một cặp tiền tố: i chữ cái đầu của a và j chữ cái đầu của b. Dãy con chung dài nhất (LCS) hỏi cả hai xâu cùng giữ được bao nhiêu chữ cái theo đúng thứ tự; khoảng cách sửa (edit distance) hỏi cần ít nhất bao nhiêu phép chèn, xoá và thay để biến xâu này thành xâu kia. Cả hai đều lấp một bảng (m + 1) × (n + 1) từ ba ô lân cận, rồi đi ngược từ góc bảng để đọc ra chính lời giải.',
  summary:
    'Lấp bảng hai chiều trên các cặp tiền tố cho dãy con chung dài nhất và khoảng cách sửa, rồi truy vết cách căn chỉnh tối ưu từ góc bảng.',
  instruction:
    'Chọn LCS hoặc khoảng cách sửa, gõ hai từ rồi chạy từng bước. Mỗi ô đọc ô phía trên, ô bên trái và ô chéo phía trên bên trái; mũi tên có dấu ✓ là lựa chọn được giữ. Sau ô cuối cùng, đường đi ngược từ góc dưới bên phải sẽ sáng lên và cho thấy các chữ cái chung hoặc các phép sửa.',
  modeLabel: 'Bài toán',
  modes: { lcs: 'LCS', edit: 'Khoảng cách sửa' },
  aLabel: 'Từ a (hàng)',
  bLabel: 'Từ b (cột)',
  presetLabel: 'Ví dụ',
  presets: { clrs: 'ABCBDAB, BDCABA', kitten: 'KITTEN, SITTING', sunday: 'SUNDAY, SATURDAY' },
  /** @param {number} max */
  wordErrors: (max) => ({
    format: 'Chỉ dùng các chữ cái từ A đến Z, không có dấu cách.',
    length: `Mỗi từ có nhiều nhất ${max} chữ cái.`,
  }),
  empty: 'ε',
  tableTitle: 'Bảng trên các tiền tố',
  /** @param {StringDpMode} mode */
  tableNote: (mode) =>
    mode === 'lcs'
      ? 'Ô (i, j) là độ dài LCS của i chữ cái đầu của a và j chữ cái đầu của b. ε là tiền tố rỗng.'
      : 'Ô (i, j) là khoảng cách sửa từ i chữ cái đầu của a đến j chữ cái đầu của b. ε là tiền tố rỗng.',
  /** @param {StringDpMode} mode @param {string} a @param {string} b */
  tableAria: (mode, a, b) =>
    `Bảng ${mode === 'lcs' ? 'LCS' : 'khoảng cách sửa'}: các hàng là tiền tố của ${a || 'từ rỗng'}, các cột là tiền tố của ${b || 'từ rỗng'}.`,
  /**
   * @param {string} a
   * @param {string} b
   * @param {number} i
   * @param {number} j
   * @param {number|null} v
   * @param {string} state
   */
  cellLabel: (a, b, i, j, v, state) =>
    `${a.slice(0, i) || 'ε'} với ${b.slice(0, j) || 'ε'}: ${v === null ? 'trống' : v}${state ? `, ${state}` : ''}`,
  cellStates: {
    current: 'vừa lấp',
    kept: 'được đọc và được giữ',
    read: 'được đọc',
    path: 'trên đường đi ngược',
    answer: 'đáp án',
  },
  legend: {
    current: 'Vừa lấp',
    read: 'Được ô này đọc',
    kept: 'Lựa chọn được giữ',
    path: 'Đường đi ngược từ góc bảng',
    answer: 'Đáp án',
  },
  markers: { current: '●', read: '○', kept: '✓', path: '◆', answer: '★' },
  stats: { filled: 'Số ô đã lấp', result: 'Đáp án' },
  resultPending: '…',
  commonTitle: 'Dãy con chung',
  commonEmpty: 'Đọc ra trong lúc đi ngược.',
  alignTitle: 'Căn chỉnh',
  alignEmpty: 'Đọc ra trong lúc đi ngược.',
  alignAria: 'Căn chỉnh hai từ, dấu gạch ngang là chỗ trống.',
  gap: '–',
  opNames: { keep: 'giữ', replace: 'thay', delete: 'xoá', insert: 'chèn' },
  opLabel,
  /** @param {StringDpFrame} f */
  describe(f) {
    const lcs = f.mode === 'lcs';
    const T = lcs ? 'L' : 'D';
    const ca = f.a[f.i - 1];
    const cb = f.b[f.j - 1];
    const cell = (/** @type {number} */ i, /** @type {number} */ j) => `${T}[${i}][${j}]`;
    switch (f.kind) {
      case 'start':
        return lcs
          ? `Tìm dãy con chung dài nhất của ${f.a || 'ε'} và ${f.b || 'ε'}. Bảng có ${f.a.length + 1} × ${f.b.length + 1} ô, mỗi ô ứng với một cặp tiền tố.`
          : `Tìm số phép sửa ít nhất để biến ${f.a || 'ε'} thành ${f.b || 'ε'}. Bảng có ${f.a.length + 1} × ${f.b.length + 1} ô, mỗi ô ứng với một cặp tiền tố.`;
      case 'base':
        return lcs
          ? 'Trường hợp cơ sở: hàng 0 và cột 0 đều bằng 0, vì tiền tố rỗng không có chữ cái chung nào với bất kì xâu nào.'
          : 'Trường hợp cơ sở: D[i][0] = i, xoá cả i chữ cái, và D[0][j] = j, chèn cả j chữ cái.';
      case 'fill': {
        const here = cell(f.i, f.j);
        const v = f.table[f.i][f.j];
        if (f.match)
          return lcs
            ? `a[${f.i}] = b[${f.j}] = ${ca}: trùng nhau. Nối dài đường chéo: ${here} = ${cell(f.i - 1, f.j - 1)} + 1 = ${v}.`
            : `a[${f.i}] = b[${f.j}] = ${ca}: giữ lại, không tốn gì. ${here} = ${cell(f.i - 1, f.j - 1)} = ${v}.`;
        const o = Object.fromEntries(f.options.map((x) => [x.move, x.value]));
        if (lcs) {
          const pick = f.move === 'up' ? `bỏ ${ca} khỏi a` : `bỏ ${cb} khỏi b`;
          return `${ca} ≠ ${cb}: một trong hai không thuộc LCS. Bỏ ${ca} → ${o.up}, bỏ ${cb} → ${o.left}. Giữ giá trị lớn hơn (${pick}): ${here} = ${v}.`;
        }
        const pick = { diag: `thay ${ca} bằng ${cb}`, up: `xoá ${ca}`, left: `chèn ${cb}` }[
          /** @type {'diag'|'up'|'left'} */ (f.move)
        ];
        return `${ca} ≠ ${cb}: thay ${ca} bằng ${cb} → ${o.diag}, xoá ${ca} → ${o.up}, chèn ${cb} → ${o.left}. Rẻ nhất: ${pick}, nên ${here} = ${v}.`;
      }
      case 'trace': {
        const here = cell(f.i, f.j);
        if (lcs)
          return f.move === 'diag'
            ? `Ở ${here}: ${ca} trùng nhau, nên nó thuộc LCS. Đi chéo lên.`
            : `Ở ${here}: ${ca} ≠ ${cb}. Đi ${f.move === 'up' ? 'lên, bỏ ' + ca : 'sang trái, bỏ ' + cb}, về phía ô mà ô này đã chép giá trị.`;
        if (f.move === 'diag')
          return f.match
            ? `Ở ${here}: giữ ${ca}. Đi chéo lên.`
            : `Ở ${here}: thay ${ca} bằng ${cb}. Đi chéo lên.`;
        return f.move === 'up'
          ? `Ở ${here}: xoá ${ca}. Đi lên.`
          : `Ở ${here}: chèn ${cb}. Đi sang trái.`;
      }
      case 'done':
        if (lcs)
          return f.result
            ? `LCS có độ dài ${f.result}: ${f.common}. Đường đi ngược đi chéo ở mọi chỗ trùng nhau.`
            : 'Hai từ không có chữ cái chung nào, nên LCS rỗng.';
        return `${f.a || 'ε'} thành ${f.b || 'ε'} sau ${f.result} phép sửa${
          f.result
            ? `: ${f.ops
                .filter((o) => o.op !== 'keep')
                .map(opLabel)
                .join(', ')}`
            : ''
        }.`;
    }
  },
  takeaways: [
    'Bảng hai chiều trên các tiền tố: ô (i, j) giải bài toán cho a[1..i] và b[1..j], nên (m + 1)(n + 1) ô bao trọn mọi bài toán con, với hàng 0 và cột 0 dành cho tiền tố rỗng.',
    'Mỗi ô hỏi chuyện gì xảy ra với hai chữ cái cuối a[i] và b[j]: nếu trùng nhau thì dùng ô chéo; nếu không, LCS bỏ một trong hai, còn khoảng cách sửa trả 1 để chèn, xoá hoặc thay.',
    'Lấp từng hàng một là được, vì mỗi ô chỉ đọc ô phía trên, ô bên trái và ô chéo phía trên bên trái.',
    'Truy vết đường đi: đi ngược từ góc bảng theo những lựa chọn đã tạo ra mỗi giá trị. Các bước chéo ở chỗ trùng nhau ghép thành LCS; các bước đi của khoảng cách sửa cho ra các phép sửa.',
    'Nạp KITTEN và SITTING ở cả hai chế độ: LCS là ITTN dài 4 và khoảng cách sửa là 3. Với hai xâu dài m và n, khoảng cách sửa ít nhất là |m − n| và nhiều nhất là max(m, n); kiểm tra cả hai điều đó với SUNDAY và SATURDAY.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Thời gian, cả hai bài', 'O(m·n)', '(m + 1)(n + 1) ô, mỗi ô đọc nhiều nhất 3 ô lân cận.'],
    ['Bộ nhớ, cả bảng', 'O(m·n)', 'Giữ lại mọi ô thì đường đi ngược mới dựng lại được lời giải.'],
    [
      'Bộ nhớ, chỉ cần giá trị',
      'O(min(m, n))',
      'Mỗi hàng chỉ đọc hàng ngay trên nó, nên khi chỉ cần con số thì hai hàng là đủ.',
    ],
    [
      'Đi ngược',
      'O(m + n)',
      'Mỗi bước đi lên, sang trái hoặc cả hai, nên kết thúc trong vòng m + n bước.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Dãy con chung dài nhất của AGGTAB và GXTXAYB dài bao nhiêu?',
      answer: 4,
      unit: 'chữ cái',
      hints: ['Chọn LCS, gõ hai từ rồi chạy đến bước cuối.'],
      solution: 'L[6][7] = 4. Đường đi ngược cho ra GTAB, có mặt trong cả hai từ theo đúng thứ tự.',
    },
    {
      type: 'number',
      prompt: 'Khoảng cách sửa từ HORSE đến ROS là bao nhiêu?',
      answer: 3,
      unit: 'phép sửa',
      hints: [
        'Chọn Khoảng cách sửa, gõ HORSE và ROS rồi chạy đến bước cuối.',
        'Hai độ dài chênh nhau 2, nên cần ít nhất 2 phép sửa.',
      ],
      solution: 'D[5][3] = 3: thay H bằng R, xoá R, xoá E. HORSE → RORSE → ROSE → ROS.',
    },
    {
      type: 'number',
      prompt: 'Bảng cho ABCBDAB và BDCABA có bao nhiêu ô, tính cả hàng 0 và cột 0?',
      answer: 56,
      unit: 'ô',
      hints: ['Mỗi tiền tố của a có một hàng, kể cả tiền tố rỗng: m + 1 hàng.'],
      solution: '(7 + 1) × (6 + 1) = 8 × 7 = 56 ô, trong đó 14 ô là trường hợp cơ sở.',
    },
    {
      type: 'choice',
      prompt: 'Trong khoảng cách sửa, vì sao D[i][0] = i?',
      options: [
        'Vì i chữ cái đầu luôn trùng nhau.',
        'Biến i chữ cái thành từ rỗng cần đúng i phép xoá.',
        'Vì phép chèn không tốn gì.',
        'Đó chỉ là quy ước, không có ý nghĩa gì.',
      ],
      answer: 1,
      hints: ['Cột 0 ứng với tiền tố rỗng của b.'],
      solution:
        'D[i][0] so sánh a[1..i] với từ rỗng. Không giữ hay thay được chữ cái nào, nên cả i chữ cái đều phải bị xoá. Tương tự, D[0][j] = j phép chèn.',
    },
    {
      type: 'order',
      prompt:
        'Đường đi ngược cho KITTEN → SITTING đọc các phép sửa từ cuối lên. Hãy xếp chúng theo thứ tự trong xâu, từ đầu đến cuối.',
      items: ['chèn G', 'thay E bằng I', 'thay K bằng S'],
      answer: [2, 1, 0],
      hints: ['Nạp ví dụ KITTEN ở chế độ Khoảng cách sửa rồi chạy đến bước cuối.'],
      solution:
        'K → S ở đầu (SITTEN), rồi E → I (SITTIN), rồi chèn G ở cuối (SITTING): 3 phép sửa.',
    },
    {
      type: 'text',
      prompt: 'Thời gian chạy của mỗi bảng với hai xâu dài m và n là bao nhiêu?',
      accept: ['O(mn)', 'O(m·n)', 'O(m*n)', 'O(nm)', 'Θ(mn)'],
      hints: ['Đếm số ô và công việc cho mỗi ô.'],
      solution: '(m + 1)(n + 1) ô, mỗi ô tốn O(1): O(mn).',
    },
  ],
  nextTeaser:
    'Bài sau, Cái túi 0/1 và tổng tập con, thêm một chiều sức chứa để quyết định lấy hay bỏ từng món đồ.',
};
