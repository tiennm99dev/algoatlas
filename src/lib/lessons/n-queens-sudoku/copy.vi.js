/** @typedef {import('$lib/algo-engine/n-queens-sudoku.js').QueensFrame} QueensFrame */
/** @typedef {import('$lib/algo-engine/n-queens-sudoku.js').SudokuFrame} SudokuFrame */
/** @typedef {import('$lib/algo-engine/n-queens-sudoku.js').SudokuReject} SudokuReject */

/** @param {number[]} xs */
const listOf = (xs) =>
  xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} và ${xs[xs.length - 1]}`;

export const vi = {
  slug: 'n-queens-sudoku',
  topic: 'backtracking',
  level: 'Trung bình',
  title: 'Bài toán N quân hậu và Sudoku',
  intro:
    'Bài toán N quân hậu và Sudoku là những bài toán ràng buộc: điền các lựa chọn sao cho không luật nào bị phạm. Quay lui rất hợp với chúng, vì có thể kiểm tra luật ngay lúc vừa chọn. Một xung đột ở vài ô đầu tiên loại bỏ mọi bàn cờ lẽ ra sẽ bắt đầu như vậy, mà không cần dựng bàn nào cả.',
  summary:
    'Đặt quân hậu lên bàn cờ và điền chữ số vào lưới Sudoku, rồi xem phép tìm kiếm lùi lại ngay khi một ràng buộc không thoả.',
  instruction:
    'Chạy từng bước bài N quân hậu và xem một quân hậu bị rút lại mỗi khi một hàng không còn ô an toàn. Đổi n, hoặc bấm (hay nhấn Enter) vào một ô ở hàng trên cùng để giữ quân hậu đầu tiên ở đó. Với Sudoku, bấm vào một ô để đổi chữ số của nó, rồi chạy từng bước để xem phép tìm kiếm giải lưới của em.',
  modeLabel: 'Câu đố',
  modes: { queens: 'N quân hậu', sudoku: 'Sudoku' },
  nLabel: 'Kích thước bàn cờ n',
  goalLabel: 'Dừng sau',
  goals: { first: 'Lời giải đầu tiên', all: 'Mọi lời giải' },
  presetLabel: 'Lưới',
  /** @type {Record<string, string>} */
  presets: {
    small: 'Nhỏ, 4 × 4',
    empty: 'Trống, 4 × 4',
    nine: 'Cỡ chuẩn, 9 × 9',
    clash: 'Gợi ý mâu thuẫn',
  },
  resetGrid: 'Khôi phục lưới',
  /** @param {number} max */
  sizeError: (max) => `Kích thước bàn cờ phải là số nguyên từ 1 đến ${max}.`,
  /** @param {number} max */
  allError: (max) =>
    `Chế độ “Mọi lời giải” chỉ dùng được tới n = ${max}. Lớn hơn nữa thì lượt chạy quá dài để xem từng bước.`,
  topRowOnly: 'Chỉ ô ở hàng trên cùng, hàng 0, mới giữ được quân hậu đầu tiên.',
  queensTitle: 'Bàn cờ',
  sudokuTitle: 'Lưới Sudoku',
  /** @param {number} n */
  queensAria: (n) => `Bàn cờ ${n} × ${n} ô.`,
  /** @param {number} n */
  sudokuAria: (n) => `Lưới Sudoku ${n} × ${n} ô.`,
  queenText: '♛',
  removedText: '♕',
  rejectedText: '×',
  attackedText: '·',
  heldMark: '◆',
  /** @param {number} r @param {number} c @param {string} what */
  squareLabel: (r, c, what) => `Hàng ${r}, cột ${c}: ${what}.`,
  squareStates: {
    queen: 'có một quân hậu',
    placed: 'có một quân hậu vừa được đặt',
    removed: 'quân hậu vừa bị rút lại',
    rejected: 'đã thử, và bị khống chế',
    attacked: 'bị một quân hậu phía trên khống chế',
    free: 'trống',
  },
  /** @param {number} r @param {number} c @param {number} v @param {boolean} clue */
  cellLabel: (r, c, v, clue) =>
    `Hàng ${r}, cột ${c}: ${v === 0 ? 'trống' : `${v}${clue ? ', cho sẵn' : ''}`}.`,
  queensNote:
    'Các quân hậu được đặt lần lượt từng hàng. Dấu chấm đánh dấu ô bị một quân hậu phía trên khống chế, còn ◆ đánh dấu ô ở hàng trên cùng đang giữ quân hậu đầu tiên.',
  sudokuNote:
    'Chữ số in đậm là chữ số cho sẵn. Phép tìm kiếm điền vào ô trống đầu tiên, từ trái sang phải và từ trên xuống dưới.',
  legend: {
    placed: 'Vừa đặt',
    kept: 'Đã đặt trước đó',
    removed: 'Vừa rút lại',
    rejected: 'Đã thử và bị loại',
    solved: 'Đã giải xong',
  },
  stats: {
    placed: 'Đã đặt',
    removed: 'Đã rút lại',
    tested: { queens: 'Số ô đã thử', sudoku: 'Số chữ số đã thử' },
    solutions: 'Số lời giải',
    result: 'Kết quả',
    naive: 'Số bàn cờ nếu không kiểm tra',
  },
  results: {
    searching: 'Đang tìm',
    solved: 'Đã giải xong',
    none: 'Không có lời giải',
    cutoff: 'Quá dài',
  },
  solutionsTitle: 'Các lời giải: cột của quân hậu ở mỗi hàng',
  solutionsEmpty: 'Chưa có.',
  /** @param {number[]} s */
  solution: (s) => s.join(' '),
  rejectedTitle: 'Vừa bị loại',
  rejectedEmpty: 'Bước này không loại gì.',
  /** @param {SudokuReject} x */
  rejectChip: (x) =>
    `${x.digit}: đã có trong ${{ row: 'hàng', column: 'cột', box: 'khối' }[x.why] ?? x.why}`,
  /** @param {QueensFrame} f */
  describeQueens(f) {
    const cols = (/** @type {number[]} */ xs) => `cột ${listOf(xs)}`;
    switch (f.kind) {
      case 'start':
        return f.fixed === null
          ? `Đặt ${f.n} quân hậu lên bàn cờ ${f.n} × ${f.n} này sao cho không hai quân nào chung hàng, cột hay đường chéo. Điền lần lượt từng hàng.`
          : `Đặt ${f.n} quân hậu lên bàn cờ này, với quân đầu tiên giữ ở cột ${f.fixed}. Điền lần lượt từng hàng.`;
      case 'place':
        return f.rejected.length
          ? `Hàng ${f.row}: ${cols(f.rejected)} bị khống chế nên bỏ qua. Cột ${f.col} an toàn. Đặt một quân hậu ở đó.`
          : `Hàng ${f.row}: cột ${f.col} an toàn. Đặt một quân hậu ở đó.`;
      case 'dead':
        return `Hàng ${f.row}: cột nào cũng bị khống chế. Bàn cờ này không thể hoàn thành, nên lùi về hàng ${f.row - 1}.`;
      case 'remove':
        return `Không cách nào thành công với quân hậu ở hàng ${f.row}, cột ${f.col}. Rút nó lại và thử cột tiếp theo.`;
      case 'solved':
        return `Đã điền đủ ${f.n} hàng. Lời giải ${f.solutions.length}: ${f.solutions[f.solutions.length - 1].join(' ')}.`;
      case 'done':
        if (f.solutions.length === 0)
          return `Không có lời giải cho n = ${f.n}${f.fixed === null ? '' : ` khi quân hậu đầu tiên ở cột ${f.fixed}`}. Mọi cách đặt quân hậu đều thất bại.`;
        return f.goal === 'first'
          ? `Đã tìm được lời giải đầu tiên, sau khi thử ${f.tested} ô và rút lại ${f.removed} quân hậu.`
          : `Đã tìm đủ ${f.solutions.length} lời giải, sau khi thử ${f.tested} ô.`;
    }
  },
  /** @param {SudokuFrame} f */
  describeSudoku(f) {
    const refused = f.rejected.length
      ? ` ${listOf(f.rejected.map((x) => x.digit))} đã bị trùng.`
      : '';
    switch (f.kind) {
      case 'start':
        return `Điền lưới sao cho mỗi hàng, mỗi cột và mỗi khối chứa mỗi chữ số từ 1 đến ${f.grid.length} đúng một lần.`;
      case 'place':
        return `Ô (${f.r}, ${f.c}):${refused} ${f.digit} hợp lệ, nên ghi vào rồi đi tiếp.`;
      case 'dead':
        return `Ô (${f.r}, ${f.c}): không chữ số nào còn lại hợp lệ.${refused} Lùi lại.`;
      case 'remove':
        return `Không cách nào thành công với ${f.digit} ở ô (${f.r}, ${f.c}). Xoá nó đi và thử chữ số tiếp theo.`;
      case 'solved':
        return 'Không còn ô trống nào, và mọi lần điền đều qua được phép kiểm tra: đã giải xong.';
      case 'clash':
        return `Các gợi ý đã phạm luật sẵn: chữ số ${f.digit} ở ô (${f.r}, ${f.c}) xuất hiện hai lần trong một hàng, cột hoặc khối. Không phép tìm kiếm nào sửa được điều đó.`;
      case 'done':
        if (f.solved)
          return `Đã giải xong, sau khi thử ${f.tested} chữ số và xoá ${f.removed} chữ số.`;
        if (f.cutoff)
          return 'Dừng ở đây: phép tìm kiếm cần nhiều bước hơn mức mà bản ghi này hiển thị được. Hãy thêm gợi ý rồi chạy lại.';
        return f.placed === 0 && f.tested === 0
          ? 'Không có lời giải: các gợi ý mâu thuẫn nhau, nên phép tìm kiếm không bao giờ bắt đầu.'
          : 'Không có lời giải: lựa chọn nào cũng dẫn tới xung đột.';
    }
  },
  takeaways: [
    'Kiểm tra ràng buộc ngay lúc đặt cũng chính là cắt tỉa: nó loại bỏ mọi bàn cờ hoàn chỉnh lẽ ra sẽ bắt đầu như vậy. Nếu không kiểm tra, bài 8 quân hậu có 8⁸ = 16 777 216 bàn cờ, và lời giải đầu tiên theo thứ tự là bàn thứ 1 299 852. Phép tìm kiếm ở đây tới được nó chỉ sau khi thử 876 ô.',
    'Đặt và huỷ phải là hai thao tác ngược hẳn nhau. Với N quân hậu, nghĩa là phải xoá cờ đánh dấu của cột và của cả hai đường chéo. Bất kì trạng thái nào còn sót lại cũng âm thầm làm hỏng các nhánh sau.',
    'Phép kiểm tra nhanh là nhờ trạng thái được lưu sẵn. Hai đường chéo ứng với r − c và r + c, nên mỗi cột và mỗi đường chéo một cờ đánh dấu là trả lời được “ô này có bị khống chế không?” trong O(1).',
    'Chọn thứ tự tốt tạo ra khác biệt lớn. Các chương trình giải Sudoku thường điền tiếp ô bị ràng buộc nhiều nhất, tức ô còn ít chữ số hợp lệ nhất, nên thất bại sớm hơn và cắt tỉa sớm hơn. Thứ tự đơn giản từ trái sang phải của bài này dễ theo dõi hơn, nhưng chậm hơn.',
    'Đặt n bằng 8 và đọc ô “Số ô đã thử”. Rồi bấm vào cột 3 của hàng trên cùng và so sánh. Em đoán nước đi đầu tiên nào là tốt nhất?',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'N quân hậu, xấu nhất',
      'O(n!)',
      'Mỗi cột cũng như mỗi hàng chỉ có một quân hậu: nhiều nhất n! bàn cờ.',
    ],
    [
      'Một lần kiểm tra an toàn',
      'O(1)',
      'Có cờ đánh dấu cho mỗi cột và mỗi đường chéo, không phải quét.',
    ],
    [
      'N quân hậu, bộ nhớ',
      'O(n)',
      'Các quân hậu đã đặt, các cờ đánh dấu và call stack (ngăn xếp lời gọi).',
    ],
    [
      'Sudoku, xấu nhất',
      'O(sᵉ)',
      'e ô trống, mỗi ô s chữ số, nhưng trong thực tế các phép kiểm tra cắt bớt rất mạnh.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Bài toán 4 quân hậu có bao nhiêu lời giải?',
      answer: 2,
      unit: 'lời giải',
      hints: ['Đặt n bằng 4 và chọn “Mọi lời giải”, rồi chạy tới bước cuối.'],
      solution:
        'Hai lời giải: 1 3 0 2 và 2 0 3 1, ghi bằng cột của quân hậu ở mỗi hàng. Lời giải này là ảnh qua gương của lời giải kia.',
    },
    {
      type: 'number',
      prompt: 'Bài toán 6 quân hậu có bao nhiêu lời giải?',
      answer: 4,
      unit: 'lời giải',
      hints: ['Đặt n bằng 6 và chọn “Mọi lời giải”.', 'Nó có ít hơn 10 lời giải của n = 5.'],
      solution:
        'Bốn. Số lời giải không phải lúc nào cũng tăng theo n: n = 5 có 10, n = 6 có 4, còn n = 2 và n = 3 thì không có lời giải nào.',
    },
    {
      type: 'number',
      prompt: 'Với n = 4, dừng ở lời giải đầu tiên, có bao nhiêu lần một quân hậu bị rút lại?',
      answer: 4,
      unit: 'quân hậu',
      hints: ['Đọc ô “Đã rút lại” ở bước cuối.'],
      solution:
        'Bốn. Quân hậu đầu tiên bắt đầu ở cột 0, nơi không cách nào thành công. Ba quân hậu bị rút lại trong nhánh đó, rồi tới chính quân đầu tiên, sau đó cột 1 dẫn thẳng tới 1 3 0 2.',
    },
    {
      type: 'number',
      prompt: 'Với n = 8, dừng ở lời giải đầu tiên, có bao nhiêu ô được thử?',
      answer: 876,
      unit: 'ô',
      hints: ['Đặt n bằng 8, giữ “Lời giải đầu tiên” và đọc ô “Số ô đã thử”.'],
      solution:
        'Phép tìm kiếm thử 876 ô, đặt 113 quân hậu và rút lại 105 quân, rồi dừng ở 0 4 7 5 2 6 1 3. Nếu không kiểm tra, lời giải này là bàn thứ 1 299 852 theo cùng thứ tự, nên hơn một triệu bàn cờ thu lại còn chưa tới một nghìn lần thử.',
    },
    {
      type: 'number',
      prompt:
        'Một quân hậu đứng ở hàng 2, cột 5. Nó nằm trên đường chéo xuống-phải mang số r − c bằng bao nhiêu?',
      answer: -3,
      hints: ['Lấy số hàng trừ số cột.'],
      solution: 'r − c = 2 − 5 = −3. Mọi ô trên đường chéo đó đều cho cùng giá trị này.',
    },
    {
      type: 'order',
      prompt: 'Xếp các thao tác cho một ô của bài N quân hậu, khi ô đó đã qua phép kiểm tra.',
      items: [
        'Xoá cờ đánh dấu của cột và đường chéo',
        'Bật cờ đánh dấu của cột và đường chéo',
        'Giải hàng tiếp theo',
      ],
      answer: [1, 2, 0],
      hints: ['Đặt, khám phá, rồi huỷ.'],
      solution: 'Bật cờ đánh dấu (đặt), giải hàng tiếp theo (khám phá), rồi xoá cờ đánh dấu (huỷ).',
    },
    {
      type: 'multi',
      prompt: 'Các phép kiểm tra trong một bước của Sudoku xét những gì? Chọn mọi phương án đúng.',
      options: ['Hàng của ô', 'Cột của ô', 'Khối của ô', 'Hai đường chéo lớn của lưới'],
      answers: [0, 1, 2],
      hints: ['Sudoku cổ điển có ba loại luật.'],
      solution:
        'Hàng, cột và khối. Hai đường chéo lớn chỉ được tính trong một biến thể gọi là Sudoku X.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao điền bài N quân hậu lần lượt từng hàng lại có ích?',
      options: [
        'Nó tự làm cho luật về hàng luôn đúng, nên chỉ cần kiểm tra cột và đường chéo.',
        'Nó bảo đảm lần thử đầu tiên thành công.',
        'Nó làm bài toán chạy trong thời gian đa thức.',
        'Nó khiến ta không phải huỷ các lần đặt.',
      ],
      answer: 0,
      hints: ['Mỗi hàng đúng một quân hậu thì luật nào không bao giờ bị phạm?'],
      solution:
        'Mỗi hàng một quân hậu nghĩa là hai quân không bao giờ chung hàng. Điều đó bỏ được một luật và thu hẹp lựa chọn từ n² ô xuống còn n ô cho mỗi quân hậu.',
    },
  ],
  nextTeaser:
    'Bài sau đưa quay lui sang bài toán tối ưu, giữ lại đáp án tốt nhất và cắt bỏ nhánh không thể vượt nó: nhánh cận.',
};
