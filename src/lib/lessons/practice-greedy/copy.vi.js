/** @typedef {import('$lib/algo-engine/practice-greedy.js').PuzzleFrame} PuzzleFrame */
/** @typedef {import('$lib/algo-engine/practice-greedy.js').Puzzle} Puzzle */

/**
 * An answer in words: yes or no, a number of jumps, or a number of boats.
 * @param {Puzzle} puzzle @param {number} x
 */
function answer(puzzle, x) {
  if (puzzle === 'reach') return x === 1 ? 'có' : 'không';
  if (puzzle === 'jumps') return x < 0 ? 'không tới được' : `${x} bước nhảy`;
  return `${x} thuyền`;
}

/** @param {PuzzleFrame} f */
function describeBoats(f) {
  const boat = /** @type {number[]} */ (f.boats.at(-1));
  const w = boat.map((k) => f.values[k]);
  const left = f.values.length - f.boats.flat().length;
  if (f.rule === 'right') {
    if (w.length === 2) {
      return `Thuyền ${f.count}: người nặng nhất, ${w[0]}, chở theo người nhẹ nhất, ${w[1]}: ${w[0] + w[1]} ≤ 10.`;
    }
    return left === 0
      ? `Thuyền ${f.count}: ${w[0]} là người cuối cùng và đi một mình.`
      : `Thuyền ${f.count}: người nặng nhất, ${w[0]}, đi một mình, vì ngay cả người nhẹ nhất còn lại cũng không vừa đi cùng.`;
  }
  if (w.length === 2) return `Thuyền ${f.count}: hai người nhẹ nhất, ${w[0]} và ${w[1]}, đi chung.`;
  return left === 0
    ? `Thuyền ${f.count}: ${w[0]} là người cuối cùng và đi một mình.`
    : `Thuyền ${f.count}: ${w[0]} đi một mình, vì người nhẹ tiếp theo không vừa đi cùng.`;
}

export const vi = {
  slug: 'practice-greedy',
  topic: 'greedy',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán tham lam',
  intro:
    'Một quy tắc tham lam (greedy) rất dễ nghĩ ra và cũng rất dễ sai. Thói quen làm việc nên có là: phát biểu quy tắc, săn phản ví dụ trên các trường hợp ngẫu nhiên nhỏ, rồi mới thử chứng minh nó bằng lập luận hoán đổi (exchange argument) hoặc bằng cách chỉ ra nó luôn dẫn trước. Mỗi thẻ bên dưới có một quy tắc đúng và một quy tắc chỉ nghe có vẻ đúng.',
  summary:
    'Chọn một câu đố tham lam, chạy từng bước một quy tắc trên đầu vào của bạn, và kiểm tra nó với đáp án vét cạn trên 200 trường hợp ngẫu nhiên để chứng minh hoặc bác bỏ nó.',
  instruction:
    'Chọn một thẻ và một quy tắc, nhập đầu vào hoặc giữ ví dụ, rồi chạy từng bước. Bấm “Kiểm tra trên 200 trường hợp ngẫu nhiên” để so sánh quy tắc với vét cạn, rồi nạp phản ví dụ ngắn nhất tìm được.',
  cardsLabel: 'Câu đố',
  cards: {
    reach: {
      title: 'Trò chơi nhảy',
      goal: 'a[i] là bước nhảy xa nhất từ ô i. Xuất phát từ ô 0, bạn có tới được ô cuối không?',
    },
    jumps: {
      title: 'Ít bước nhảy nhất',
      goal: 'Vẫn các ô và bước nhảy đó. Cần ít nhất bao nhiêu bước nhảy để tới ô cuối?',
    },
    boats: {
      title: 'Thuyền',
      goal: 'Mỗi thuyền chở nhiều nhất hai người và tổng khối lượng nhiều nhất là 10. Cần ít nhất bao nhiêu thuyền để chở hết mọi người?',
    },
  },
  ruleLabel: 'Quy tắc tham lam',
  rules: {
    reach: { right: 'Theo dõi điểm xa nhất tới được', wrong: 'Luôn nhảy xa nhất' },
    jumps: { right: 'Nhảy khi hết tầm', wrong: 'Luôn nhảy xa nhất' },
    boats: { right: 'Nặng nhất đi với nhẹ nhất', wrong: 'Hai người nhẹ nhất đi chung' },
  },
  valuesLabel: { reach: 'Độ dài bước nhảy', jumps: 'Độ dài bước nhảy', boats: 'Khối lượng' },
  errors: {
    format:
      'Hãy nhập các số nguyên, cách nhau bởi dấu phẩy hoặc dấu cách. Đầu vào hợp lệ gần nhất đã được khôi phục.',
    range: {
      reach: 'Mỗi độ dài bước nhảy phải từ 0 đến 9. Đầu vào hợp lệ gần nhất đã được khôi phục.',
      jumps: 'Mỗi độ dài bước nhảy phải từ 0 đến 9. Đầu vào hợp lệ gần nhất đã được khôi phục.',
      boats: 'Mỗi khối lượng phải từ 1 đến 9. Đầu vào hợp lệ gần nhất đã được khôi phục.',
    },
    count: 'Hãy dùng từ 2 đến 12 giá trị. Đầu vào hợp lệ gần nhất đã được khôi phục.',
  },
  /** @param {string} rule */
  ruleNotice: (rule) => `Quy tắc: ${rule}. Quá trình chạy bắt đầu lại.`,
  counterNotice: 'Đã nạp phản ví dụ: hãy chạy từng bước để xem quy tắc sai ở đâu.',
  random: 'Đầu vào ngẫu nhiên',
  newInputNotice: 'Đã nạp đầu vào mới.',
  answer,
  /** @param {number} i @param {number} value @param {string} state */
  cellLabel: (i, value, state) => `Ô ${i}: ${value}${state ? `, ${state.toLowerCase()}` : ''}`,
  /** @param {number} weight @param {number} boat 0-based, -1 before boarding @param {string} state */
  personLabel: (weight, boat, state) =>
    `Khối lượng ${weight}${boat >= 0 ? `, thuyền ${boat + 1}` : ''}${state ? `, ${state.toLowerCase()}` : ''}`,
  /** @param {number[]} values */
  stripAria: (values) => `Các ô: ${values.join(', ')}.`,
  pointers: { i: 'i', end: 'end', far: 'far' },
  reachWindow: 'reach',
  /** @param {number} k */
  boatMark: (k) => `b${k + 1}`,
  legend: {
    current: 'Đang xét',
    reachable: 'Đã biết là tới được',
    scanned: 'Đã quét',
    path: 'Đã đặt chân',
    stuck: 'Bị kẹt ở đây',
    boat: 'Trên thuyền vừa xếp',
    done: 'Trên một thuyền trước',
    goal: 'Đã tới ô cuối',
  },
  markers: {
    current: '?',
    reachable: '·',
    scanned: '✓',
    path: '•',
    stuck: '✗',
    boat: '',
    done: '',
    goal: '★',
  },
  boatMarkerNote: 'b1, b2, …: số thứ tự thuyền',
  stats: {
    got: 'Đáp án của quy tắc',
    want: 'Đáp án đúng',
    reach: 'Điểm xa nhất tới được',
    jumps: 'Số bước nhảy đến giờ',
    boats: 'Số thuyền đến giờ',
  },
  pending: '…',
  boatsTitle: 'Các thuyền',
  boatsEmpty: 'chưa có thuyền nào',
  /** @param {number[]} w */
  boatChip: (w) => w.join(' + '),
  testTitle: 'Chứng minh hoặc bác bỏ quy tắc',
  test: 'Kiểm tra trên 200 trường hợp ngẫu nhiên',
  untested: 'Chưa kiểm tra. Mỗi trường hợp ngẫu nhiên có từ 2 đến 8 giá trị.',
  /** @param {number} tested */
  passed: (tested) =>
    `Đúng cả ${tested} trường hợp ngẫu nhiên. Đó là bằng chứng, chưa phải chứng minh: hãy đọc phần Ghi nhớ để thấy lập luận khiến nó chắc chắn đúng.`,
  /** @param {number} failed @param {number} tested */
  failed: (failed, tested) => `Sai ${failed}/${tested} trường hợp ngẫu nhiên.`,
  /** @param {Puzzle} puzzle @param {number[]} values @param {number} got @param {number} want */
  counterexample: (puzzle, values, got, want) =>
    `Phản ví dụ ngắn nhất: ${values.join(', ')}. Quy tắc cho ${answer(puzzle, got)}, đáp án đúng là ${answer(puzzle, want)}.`,
  loadCounter: 'Nạp phản ví dụ',
  practiceTitle: 'Câu đố giải bằng hình minh hoạ',
  /** @param {PuzzleFrame} f @param {number} want */
  describe(f, want) {
    const a = f.values;
    if (f.kind === 'done') {
      const got = answer(f.puzzle, f.result);
      return f.result === want
        ? `Quy tắc cho đáp án ${got}, đúng với đầu vào này.`
        : `Quy tắc cho đáp án ${got}, nhưng đáp án đúng là ${answer(f.puzzle, want)}: đây là một phản ví dụ, nên quy tắc này sai.`;
    }
    if (f.puzzle === 'boats') {
      if (f.kind === 'start') {
        return `Chở ${a.length} người bằng các thuyền chở được nhiều nhất hai người và tổng khối lượng nhiều nhất là 10.`;
      }
      if (f.kind === 'sort') return `Sắp xếp các khối lượng: ${a.join(', ')}.`;
      return describeBoats(f);
    }
    if (f.rule === 'wrong') {
      if (f.kind === 'start') return 'Xuất phát từ ô 0 và luôn nhảy bước xa nhất mà ô cho phép.';
      if (f.kind === 'stuck') return `Ô ${f.i} chứa 0: quy tắc bị kẹt ở đó.`;
      const from = /** @type {number} */ (f.path.at(-2));
      return `Nhảy ${f.i - from} từ ô ${from} đến ô ${f.i}${f.i === a.length - 1 ? ', ô cuối' : ''}. Đã nhảy ${f.count} bước.`;
    }
    if (f.puzzle === 'reach') {
      switch (f.kind) {
        case 'start':
          return 'Quét các ô từ trái sang và giữ reach, ô xa nhất đã biết là tới được. Ô 0 tới được.';
        case 'scan':
          return `Ô ${f.i} tới được (${f.i} ≤ reach). Từ ô này có thể tới ${f.i + a[f.i]}, nên reach = ${f.reach}.`;
        case 'stuck':
          return `Ô ${f.i} > reach ${f.reach}: không ô nào phía trước đi xa được đến thế, nên ô ${f.i} và mọi ô sau nó đều ngoài tầm.`;
        default:
          return '';
      }
    }
    switch (f.kind) {
      case 'start':
        return 'Quét các ô mà bước nhảy hiện tại phủ tới và nhớ far, ô xa nhất mà một ô bất kì trong số đó tới được. Khi lượt quét vượt qua end, cần thêm một bước nhảy.';
      case 'scan':
        return `Ô ${f.i} tới được ${f.i + a[f.i]}, nên far = ${f.reach}.`;
      case 'jump':
        return `Ô ${f.i} là cuối tầm mà ${f.count - 1} bước nhảy phủ tới, nên thực hiện bước nhảy ${f.count}: nó có thể đáp xuống bất kì đâu, tới tận ô ${f.end}.`;
      case 'stuck':
        return `Tầm dừng ở ô ${f.i} và không ô nào trong đó vượt qua được ${f.i}: không tới được ô cuối.`;
      default:
        return '';
    }
  },
  takeaways: [
    'Trước khi chứng minh một quy tắc tham lam, hãy thử bác bỏ nó: các trường hợp ngẫu nhiên nhỏ, đối chiếu với vét cạn, tìm ra hầu hết các quy tắc sai chỉ trong vài giây.',
    'Trò chơi nhảy: các ô tới được luôn tạo thành một tiền tố 0..reach, vì một ô nhảy tới được ô j thì cũng nhảy được mọi bước ngắn hơn. Nên chỉ một lượt quét làm tăng dần reach là trả lời được câu hỏi trong O(n). Luôn nhảy bước xa nhất có thể đáp xuống một ô 0 mà bước ngắn hơn lẽ ra đã vượt qua.',
    'Ít bước nhảy nhất: các ô tới được sau k bước nhảy cũng tạo thành một đoạn, và đoạn tiếp theo kết thúc ở ô xa nhất mà một ô bất kì trong đó tới được. Chỉ nhảy khi hết tầm chính là duyệt theo chiều rộng (BFS) theo từng tầng, nên nó “luôn dẫn trước” mọi kế hoạch khác và tối ưu trong O(n).',
    'Thuyền: người nặng nhất đằng nào cũng cần một thuyền. Nếu có ai đi chung được với người đó thì người nhẹ nhất đi chung được, và đổi người nhẹ nhất vào chỗ ngồi đó không bao giờ làm hại một cặp khác: đó là lập luận hoán đổi. Ghép hai người nhẹ nhất sẽ phí những người nhẹ mà người nặng cần đến.',
    'Chọn “Thuyền” với “Hai người nhẹ nhất đi chung”, bấm nút kiểm tra, nạp phản ví dụ và chạy từng bước, rồi chuyển sang “Nặng nhất đi với nhẹ nhất” trên cùng đầu vào.',
  ],
  complexityHead: ['Quy tắc', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Trò chơi nhảy, điểm xa nhất', 'O(n)', 'Một lượt quét, mỗi ô một phép max.'],
    ['Ít bước nhảy nhất, theo tầng', 'O(n)', 'Một lượt quét; một bước nhảy được đếm khi hết tầm.'],
    [
      'Thuyền, nặng nhất với nhẹ nhất',
      'O(n log n)',
      'Phép sắp xếp; lượt hai con trỏ (two pointers) chỉ O(n).',
    ],
    [
      'Vét cạn dùng để kiểm tra',
      'O(9n) hoặc hàm mũ',
      'Duyệt theo chiều rộng qua mọi bước nhảy, hoặc thử mọi cách ghép cặp mọi người.',
    ],
    [
      'Kiểm tra ngẫu nhiên',
      'số lần thử × vét cạn',
      'Rẻ trên các trường hợp nhỏ, cũng là nơi phản ví dụ hay ẩn nấp.',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt: 'Chạy “Luôn nhảy xa nhất” trên trò chơi nhảy 2, 3, 0, 1, 4. Chuyện gì xảy ra?',
      options: [
        'Nó tới ô cuối sau 2 bước nhảy',
        'Nó tới ô cuối sau 3 bước nhảy',
        'Nó đáp xuống ô 0 ở ô 2 và bị kẹt',
        'Nó trả lời không, và điều đó đúng',
      ],
      answer: 2,
      hints: [
        'Từ ô 0, bước nhảy xa nhất dài 2.',
        'Nhập 2, 3, 0, 1, 4 vào thẻ “Trò chơi nhảy” rồi chạy đến bước cuối.',
      ],
      solution:
        'Nó nhảy từ ô 0 đến ô 2, ô này chứa 0, nên nó trả lời không. Quy tắc điểm xa nhất thấy ô 1 tới được ô 4 và trả lời có.',
    },
    {
      type: 'number',
      prompt: '“Luôn nhảy xa nhất” dùng bao nhiêu bước nhảy trên 2, 3, 1, 1, 4?',
      answer: 3,
      unit: 'bước nhảy',
      hints: ['Nó đáp xuống ô 2 và ô 3 trước khi tới ô cuối.', 'Dùng thẻ “Ít bước nhảy nhất”.'],
      solution:
        'Nó đi 0 → 2 → 3 → 4, 3 bước nhảy, nhưng 0 → 1 → 4 chỉ cần 2: một bước nhảy đầu ngắn hơn có thể dẫn đi xa hơn.',
    },
    {
      type: 'number',
      prompt: 'Cần ít nhất bao nhiêu bước nhảy để tới ô cuối của 2, 3, 0, 1, 4?',
      answer: 2,
      unit: 'bước nhảy',
      hints: [
        'Bước nhảy đầu tiên phủ ô 1 và ô 2.',
        'Chọn “Nhảy khi hết tầm” rồi chạy đến bước cuối.',
      ],
      solution:
        'Một bước nhảy tới được ô 1 và ô 2; ô 1 tới được ô 4, nên bước nhảy thứ hai đáp xuống ô cuối: 2 bước nhảy.',
    },
    {
      type: 'number',
      prompt: '“Hai người nhẹ nhất đi chung” dùng bao nhiêu thuyền cho các khối lượng 1, 2, 8, 9?',
      answer: 3,
      unit: 'thuyền',
      hints: ['Nó xếp 1 và 2 vào thuyền đầu tiên.', '8 và 9 cộng lại nặng hơn 10.'],
      solution:
        '1 + 2 đi chung một thuyền, rồi 8 và 9 mỗi người cần một thuyền riêng: 3 thuyền. Nặng nhất đi với nhẹ nhất xếp 9 + 1 và 8 + 2, chỉ 2 thuyền.',
    },
    {
      type: 'multi',
      prompt:
        'Những quy tắc nào qua được mọi lần kiểm tra ngẫu nhiên? Hãy kiểm tra từng quy tắc bằng hình minh hoạ.',
      options: [
        'Trò chơi nhảy: theo dõi điểm xa nhất tới được',
        'Trò chơi nhảy: luôn nhảy xa nhất',
        'Ít bước nhảy nhất: nhảy khi hết tầm',
        'Ít bước nhảy nhất: luôn nhảy xa nhất',
        'Thuyền: nặng nhất đi với nhẹ nhất',
        'Thuyền: hai người nhẹ nhất đi chung',
      ],
      answers: [0, 2, 4],
      hints: [
        'Mỗi thẻ có đúng một quy tắc đúng.',
        'Bấm “Kiểm tra trên 200 trường hợp ngẫu nhiên” cho từng quy tắc.',
      ],
      solution:
        'Điểm xa nhất, nhảy theo từng tầng và nặng nhất đi với nhẹ nhất đều qua, và mỗi quy tắc đều có chứng minh. Các quy tắc nhảy xa nhất và quy tắc hai người nhẹ nhất thất bại trên những đầu vào ngắn như 2, 3, 0, 1, 4 và 1, 2, 8, 9.',
    },
    {
      type: 'text',
      prompt: 'Thời gian chạy của quy tắc điểm xa nhất trên n ô là bao nhiêu, viết theo kí hiệu O?',
      accept: ['O(n)', 'Θ(n)', 'n', 'tuyến tính', 'linear'],
      hints: [
        'Đếm xem mỗi ô được xét bao nhiêu lần.',
        'Không có phép sắp xếp nào và không có vòng lặp lồng.',
      ],
      solution: 'Một lượt quét từ trái sang phải, mỗi ô một phép max: O(n).',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Đệ quy có nhớ và lập bảng, mở đầu quy hoạch động bằng cách ghi nhớ các bài toán con đã giải.',
};
