/** @typedef {import('$lib/algo-engine/practice-backtracking.js').WordFrame} WordFrame */
/** @typedef {import('$lib/algo-engine/practice-backtracking.js').SumFrame} SumFrame */
/** @typedef {import('$lib/algo-engine/practice-backtracking.js').SumNode} SumNode */

export const vi = {
  slug: 'practice-backtracking',
  topic: 'backtracking',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán quay lui',
  intro:
    'Hai bài toán kinh điển dùng cùng ba thao tác theo những cách khác nhau. Bài tìm từ trong lưới đi trên một lưới chữ cái, đánh dấu mỗi ô nó bước qua và xoá dấu khi lùi lại. Bài tổng tổ hợp chọn những số có thể lặp lại, và cắt tỉa ngay khi một số quá lớn. Hãy tự tìm trạng thái và bước huỷ cho từng bài, rồi kiểm tra lại bằng hình minh hoạ.',
  summary:
    'Chạy bài tìm từ trong lưới, khám phá và lùi lại từng chữ cái, và bài tổng tổ hợp, cắt tỉa những số quá lớn không còn vừa.',
  instruction:
    'Với “Tìm từ trong lưới”, nhập một từ rồi chạy từng bước: đường đi dài ra theo các chữ cái khớp và lùi lại ở ngõ cụt. Bấm (hay nhấn Enter) vào một ô để nhảy tới lần đầu ô đó được kiểm tra. Với “Tổng tổ hợp”, nhập dãy số và tổng của bạn, rồi xem cây lớn dần và các kết quả được điền vào. Dùng hình minh hoạ để trả lời các câu hỏi bên dưới.',
  modeLabel: 'Bài toán',
  modes: { word: 'Tìm từ trong lưới', sum: 'Tổng tổ hợp' },
  gridLabel: 'Các hàng của lưới',
  wordLabel: 'Từ',
  candidatesLabel: 'Các số',
  totalLabel: 'Tổng',
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  wordPresets: {
    found: 'ABCCED, có',
    absent: 'ABCB, không có',
    retreat: 'Nhiều ngõ cụt',
    trap: 'Quá nhiều đường đi',
  },
  /** @type {Record<string, string>} */
  sumPresets: {
    seven: '2 3 6 7, tổng 7',
    eight: '2 3 5, tổng 8',
    none: 'Không có tổ hợp nào',
    ten: '1 2, tổng 10',
  },
  /** @param {number} max */
  gridError: (max) =>
    `Hãy nhập từ 1 đến ${max} hàng dài bằng nhau, mỗi hàng tối đa ${max} chữ cái, cách nhau bởi dấu cách.`,
  /** @param {number} max */
  wordError: (max) => `Từ phải gồm từ 1 đến ${max} chữ cái từ A đến Z.`,
  /** @param {number} maxN @param {number} maxV */
  candidatesError: (maxN, maxV) =>
    `Hãy nhập từ 1 đến ${maxN} số nguyên khác nhau, mỗi số từ 1 đến ${maxV}.`,
  /** @param {number} max */
  totalError: (max) => `Tổng phải là số nguyên từ 1 đến ${max}.`,
  gridTitle: 'Lưới chữ cái',
  /** @param {number} rows @param {number} cols */
  gridAria: (rows, cols) => `Lưới chữ cái, ${rows} hàng, ${cols} cột.`,
  /** @param {number} r @param {number} c @param {string} letter @param {string} state */
  gridCell: (r, c, letter, state) => `Hàng ${r}, cột ${c}: ${letter}${state ? `, ${state}` : ''}`,
  neverChecked: 'Phép tìm kiếm chưa bao giờ tới ô đó, nên không có bước nào để nhảy tới.',
  gridNote:
    'Một đường đi đi lên, xuống, sang trái hoặc sang phải, và dùng mỗi ô nhiều nhất một lần.',
  cellStates: {
    now: 'đang kiểm tra',
    path: 'nằm trên đường đi',
    wrong: 'sai chữ cái',
    used: 'đã nằm trên đường đi',
    back: 'vừa rời khỏi',
    found: 'thuộc từ cần tìm',
  },
  marks: { wrong: '×', used: '↺', back: '←' },
  wordLegend: {
    now: 'Đang kiểm tra',
    path: 'Nằm trên đường đi, đánh số theo thứ tự',
    wrong: '× sai chữ cái, ↺ đã dùng rồi',
    back: '← vừa lùi khỏi',
    found: 'Từ đã tìm thấy',
  },
  wordStripTitle: 'Từ',
  wordStripAria: 'Từ cần tìm, các chữ cái đã khớp được đánh dấu.',
  /** @param {number} i @param {string} letter @param {boolean} on */
  wordCell: (i, letter, on) => `Chữ cái ${i}: ${letter}${on ? ', đã khớp' : ''}`,
  wordPointer: 'k',
  matchMark: '✓',
  stats: {
    checked: 'Số ô đã kiểm tra',
    retreats: 'Số lần lùi',
    matched: 'Số chữ cái đã khớp',
    result: 'Kết quả',
    calls: 'Số lời gọi',
    stops: 'Số lần dừng sớm',
    remaining: 'Còn thiếu',
    solutions: 'Số tổ hợp',
  },
  wordResults: {
    searching: 'Đang tìm',
    found: 'Đã tìm thấy',
    absent: 'Không tìm thấy',
    cutoff: 'Quá dài',
  },
  sumTitle: 'Các số, đã sắp xếp',
  sumAria: 'Các số, đã sắp xếp. Mỗi số được dùng bao nhiêu lần cũng được.',
  /** @param {number} i @param {number} v @param {number} times */
  sumCell: (i, v, times) => `Số ${v} ở chỉ số ${i}, đã dùng ${times} lần`,
  treeTitle: 'Cây đệ quy',
  treeNote: 'Mỗi vòng tròn ghi phần còn thiếu. Cạnh cho biết số nào đã được chọn.',
  treeAria: 'Cây đệ quy của bài tổng tổ hợp, được dựng dần khi chạy.',
  /** @param {SumNode} n */
  nodeLabel: (n) =>
    `Lời gọi còn thiếu ${n.remaining}${n.hit ? ', vừa đúng tổng' : ''}${n.open ? ', vẫn đang chạy' : ''}.`,
  hitMark: '★',
  sumLegend: {
    active: 'Đang xử lí',
    open: 'Đường đi hiện tại',
    finished: 'Đã trả về',
    hit: 'Đạt đúng tổng',
  },
  pathTitle: 'Đang chọn',
  pathEmpty: 'Chưa chọn số nào.',
  solutionsTitle: 'Các tổ hợp đã tìm được',
  solutionsEmpty: 'Chưa có.',
  /** @param {number[]} s */
  solution: (s) => s.join(' + '),
  /** @param {WordFrame} f */
  describeWord(f) {
    const want = f.word[f.k];
    const cell = `(${f.r}, ${f.c})`;
    switch (f.kind) {
      case 'start':
        return `Tìm ${f.word} trong lưới. Lần lượt thử từng ô làm chữ cái đầu tiên.`;
      case 'match':
        return `Ô ${cell} chứa ${want}, chữ cái thứ ${f.k + 1}/${f.word.length}. Đánh dấu ô đã dùng và thử các ô kề nó để tìm ${f.word[f.k + 1]}.`;
      case 'wrong':
        return `Ô ${cell} chứa ${f.grid[f.r][f.c]}, nhưng ở đây từ cần ${want}. Quay lại.`;
      case 'used':
        return `Ô ${cell} đã nằm trên đường đi, mà mỗi ô chỉ được dùng một lần. Quay lại.`;
      case 'retreat':
        return `Không ô kề nào của ${cell} viết tiếp được từ. Xoá dấu của nó để đường đi khác còn dùng được, rồi lùi lại.`;
      case 'found':
        return `Ô ${cell} chứa chữ cái cuối, ${want}. Cả từ đã nằm trên đường đi.`;
      case 'done':
        if (f.found) return `${f.word} có trong lưới, sau khi kiểm tra ${f.checked} ô.`;
        return f.cutoff
          ? `Dừng ở đây: phép tìm kiếm này có quá nhiều đường đi để hiển thị. Nó đã kiểm tra ${f.checked} ô mà chưa có đáp án.`
          : `${f.word} không có trong lưới. Mọi đường đi đều đã được thử: kiểm tra ${f.checked} ô, lùi ${f.retreats} lần.`;
    }
  },
  /** @param {SumFrame} f */
  describeSum(f) {
    const v = f.at >= 0 ? f.candidates[f.at] : 0;
    switch (f.kind) {
      case 'start':
        return `Tìm mọi tổ hợp của các số này có tổng bằng ${f.total}. Một số có thể được dùng nhiều lần.`;
      case 'pick':
        return `Chọn ${v}, còn thiếu ${f.remaining}. Lời gọi tiếp theo được chọn lại ${v}, nhưng không được chọn số nào đứng trước nó.`;
      case 'hit':
        return `Vừa đúng ${f.total}. Ghi lại ${f.path.join(' + ')} rồi quay lại.`;
      case 'stop':
        return `${v} lớn hơn phần còn thiếu ${f.remaining}. Các số đã được sắp xếp, nên mọi số phía sau cũng vậy. Dừng vòng lặp này.`;
      case 'unpick':
        return `Bỏ chọn ${v}, trở lại còn thiếu ${f.remaining}, rồi thử số tiếp theo.`;
      case 'done':
        return f.cutoff
          ? `Dừng ở đây: đầu vào này có quá nhiều tổ hợp để hiển thị. Tới giờ đã tìm được ${f.solutions.length} tổ hợp.`
          : `Xong: ${f.solutions.length} tổ hợp từ ${f.calls} lời gọi.`;
    }
  },
  takeaways: [
    'Trạng thái là những gì một lời gọi cần biết. Bài tìm từ cần ô hiện tại, chỉ số chữ cái và các dấu đã dùng. Bài tổng tổ hợp cần chỉ số bắt đầu, phần còn thiếu và đường đi.',
    'Mỗi lần đánh dấu đều cần bước huỷ của nó. Trong bài tìm từ, phải xoá dấu của ô trên đường lùi về, nếu không một đường đi sau thật sự cần ô đó sẽ thất bại mà không rõ vì sao.',
    'Tránh bản trùng là nhờ chỉ số bắt đầu. Truyền i chứ không phải i + 1 là điều cho phép một số lặp lại, và không bao giờ quay về các số đứng trước giúp 2 + 2 + 3 không xuất hiện thêm dưới dạng 2 + 3 + 2.',
    'Những phép kiểm tra rẻ làm trước luôn đáng công. Sắp xếp giúp một phép so sánh dừng được cả vòng lặp, và trong bài tìm từ, đếm chữ cái trước sẽ loại ngay một từ mà lưới không thể ghép thành, không cần đi bước nào.',
    'Nạp ví dụ “Quá nhiều đường đi” và chạy tới bước cuối: phép tìm kiếm bỏ cuộc mà không có đáp án, dù lưới không hề có chữ C nào. Rồi đổi từ thành AAAAAAAA và xem một đường đi thật xuất hiện nhanh thế nào.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Tìm từ, thời gian',
      'O(m · n · 3ᴸ)',
      'm · n điểm bắt đầu; sau bước đầu, mỗi chữ cái của một từ độ dài L có nhiều nhất 3 hướng mới.',
    ],
    [
      'Tìm từ, bộ nhớ',
      'O(L)',
      'Ngăn xếp lời gọi và đường đi giữ nhiều nhất L ô, cộng thêm các dấu.',
    ],
    [
      'Tổng tổ hợp, thời gian',
      'hàm mũ theo T / min',
      'Độ sâu đạt tới tổng chia cho số nhỏ nhất, và mỗi tầng có một lựa chọn.',
    ],
    ['Tổng tổ hợp, bộ nhớ', 'O(T / min)', 'Đường đi sâu nhất dài bằng tổng chia cho số nhỏ nhất.'],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Lưới ABCE, SFCS, ADEE với từ ABCB. Phép tìm kiếm lùi lại bao nhiêu lần? Các ô kề được thử theo thứ tự phải, xuống, trái, lên.',
      answer: 4,
      unit: 'lần lùi',
      hints: ['Nạp ví dụ “ABCB, không có” và đọc ô “Số lần lùi” ở bước cuối.'],
      solution:
        'Bốn lần. Đường đi A, B, C tới chữ C ở (0, 2), nơi không ô kề nào là một chữ B còn trống, nên nó lùi lại. Không ô kề nào khác viết tiếp được từ, nên B rồi chữ A đầu tiên cũng lùi lại. Chữ A còn lại, ở (2, 0), khớp chữ cái đầu nhưng không có B bên cạnh, nên cũng lùi lại.',
    },
    {
      type: 'number',
      prompt: 'Cùng lưới đó với từ ABCCED. Tổng cộng có bao nhiêu ô được kiểm tra?',
      answer: 9,
      unit: 'ô',
      hints: ['Nạp ví dụ “ABCCED, có” và đọc ô “Số ô đã kiểm tra”.'],
      solution:
        'Chín ô: 6 ô của từ, và 3 lần thử sai dọc đường. Không có lần lùi nào, vì thứ tự thử bên phải trước tình cờ dẫn thẳng tới đáp án.',
    },
    {
      type: 'multi',
      prompt: 'Lưới ABCE, SFCS, ADEE. Những từ nào tìm được? Chọn mọi phương án đúng.',
      options: ['SEE', 'ABCB', 'ABFS', 'ASADF'],
      answers: [0, 2, 3],
      hints: ['Nhập từng từ và chạy tới bước cuối.', 'Một ô không được dùng hai lần.'],
      solution:
        'SEE và ABFS có trong lưới, còn ASADF đi xuống cột đầu tiên, sang phải, rồi đi lên. ABCB sẽ cần chữ B ở (0, 1) hai lần.',
    },
    {
      type: 'number',
      prompt: 'Các số 2, 3, 6, 7 và tổng 7. Có bao nhiêu tổ hợp?',
      answer: 2,
      unit: 'tổ hợp',
      hints: ['Nạp ví dụ đó và chạy tới bước cuối.'],
      solution: 'Hai: 2 + 2 + 3 và 7. Phép tìm kiếm thực hiện 10 lời gọi để tìm ra chúng.',
    },
    {
      type: 'number',
      prompt: 'Các số 2, 3, 5 và tổng 8. Có bao nhiêu tổ hợp?',
      answer: 3,
      unit: 'tổ hợp',
      hints: ['Nạp ví dụ đó và đọc danh sách kết quả.'],
      solution: 'Ba: 2 + 2 + 2 + 2, 2 + 3 + 3 và 3 + 5.',
    },
    {
      type: 'number',
      prompt: 'Các số 1, 2 và tổng 10. Có bao nhiêu tổ hợp?',
      answer: 6,
      unit: 'tổ hợp',
      hints: ['Nghĩ xem dùng bao nhiêu số 2: từ 0 đến 5.'],
      solution:
        'Số lượng số 2 có thể là 0, 1, 2, 3, 4 hoặc 5, còn lại là các số 1. Vậy có 6 tổ hợp.',
    },
    {
      type: 'choice',
      prompt:
        'Trong bài tìm từ, chuyện gì sai nếu không bao giờ xoá dấu của ô khi đường đi lùi lại?',
      options: [
        'Phép tìm kiếm chạy mãi không dừng.',
        'Một đường đi sau cần ô đó bị từ chối, nên có thể bỏ sót một từ có thật.',
        'Một ô có thể được dùng hai lần trên cùng một đường đi.',
        'Không sao cả, vì dù sao mỗi ô cũng chỉ được thăm một lần.',
      ],
      answer: 1,
      hints: ['Nạp ví dụ “Nhiều ngõ cụt” và nghĩ về các ô của một điểm bắt đầu thất bại.'],
      solution:
        'Dấu có nghĩa là “nằm trên đường đi hiện tại”. Nếu để nguyên, nó chặn cả những đường đi hoàn toàn hợp lệ, và phép tìm kiếm báo là không có từ trong khi từ đó có thật.',
    },
    {
      type: 'choice',
      prompt: 'Trong bài tổng tổ hợp, điều gì thay đổi nếu lời gọi truyền i + 1 thay vì i?',
      options: [
        'Mỗi số được dùng nhiều nhất một lần.',
        'Vẫn ra đúng các tổ hợp đó, chỉ nhanh hơn.',
        'Các tổ hợp xuất hiện theo nhiều thứ tự.',
        'Phép tìm kiếm không cần các số đã sắp xếp nữa.',
      ],
      answer: 0,
      hints: ['Lời gọi tiếp theo được chọn những số nào?'],
      solution: 'Lời gọi tiếp theo bắt đầu sau số này, nên không bao giờ chọn lại được số đó.',
    },
    {
      type: 'order',
      prompt: 'Xếp các thao tác trong một bước tìm từ ở một ô chứa đúng chữ cái.',
      items: ['Thử từng ô kề', 'Xoá dấu của ô', 'Đánh dấu ô đã dùng'],
      answer: [2, 0, 1],
      hints: ['Chọn, khám phá, bỏ chọn.'],
      solution: 'Đánh dấu (chọn), thử các ô kề (khám phá), xoá dấu (bỏ chọn).',
    },
  ],
  nextTeaser:
    'Chủ đề sau chuyển sang cây nhị phân tìm kiếm, mở đầu bằng câu hỏi: vì sao cân bằng quan trọng.',
};
