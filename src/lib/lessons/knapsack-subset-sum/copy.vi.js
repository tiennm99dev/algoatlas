/** @typedef {import('$lib/algo-engine/knapsack-subset-sum.js').KnapFrame} KnapFrame */
/** @typedef {import('$lib/algo-engine/knapsack-subset-sum.js').KnapProblem} KnapProblem */
/** @typedef {import('$lib/algo-engine/knapsack-subset-sum.js').KnapLayout} KnapLayout */

/** @param {number[]} items */
const names = (items) => items.map((i) => `món ${i}`).join(', ');
/** @param {number} v */
const yesNo = (v) => (v ? 'true' : 'false');

export const vi = {
  slug: 'knapsack-subset-sum',
  topic: 'dynamic-programming',
  level: 'Trung bình',
  title: 'Cái túi 0/1 và tổng tập con',
  intro:
    'Các món đồ không cắt nhỏ được, nên lựa chọn tốt nhất cho một món phụ thuộc vào chỗ trống mà các món khác để lại. Vì thế bảng có thêm một chiều sức chứa: ô (i, c) là đáp án cho i món đầu tiên với sức chứa c, và mỗi ô chỉ quyết định lấy hay bỏ món i. Bài tổng tập con dùng đúng bảng đó, chỉ thay các giá trị bằng true và false.',
  summary:
    'Lấp bảng cái túi (knapsack) và bảng tổng tập con theo món đồ và sức chứa, xem từng lựa chọn lấy hay bỏ, rồi thu bảng lại còn một hàng.',
  instruction:
    'Kéo thanh trượt Món và Sức chứa, hoặc bấm vào một ô, để đọc lựa chọn lấy hay bỏ của ô đó; chạy từng bước để xem bảng được lấp. Sau đó chuyển Bộ nhớ sang Một hàng, đi xuống và Một hàng, đi lên: so sánh đáp án với đáp án 0/1 thật.',
  problemLabel: 'Bài toán',
  problems: { knapsack: 'Cái túi 0/1', subset: 'Tổng tập con' },
  layoutLabel: 'Bộ nhớ',
  layouts: {
    table: 'Cả bảng',
    'row-down': 'Một hàng, đi xuống',
    'row-up': 'Một hàng, đi lên',
  },
  itemsLabel: {
    knapsack: 'Các món, khối lượng:giá trị',
    subset: 'Các khối lượng',
  },
  capacityLabel: { knapsack: 'Sức chứa W', subset: 'Tổng cần đạt T' },
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    small: 'Bốn món, W = 7',
    trap: 'Bẫy tham lam, W = 5',
    single: 'Một món, W = 6',
    yes: '3, 34, 4, 12, 5, 2, T = 9',
    even: '2, 4, 6, 8, T = 7',
  },
  /**
   * @param {number} maxItems
   * @param {number} maxWeight
   * @param {number} maxValue
   * @param {number} maxCapacity
   */
  errors: (maxItems, maxWeight, maxValue, maxCapacity) => ({
    format: {
      knapsack: 'Hãy viết mỗi món dưới dạng khối lượng:giá trị, ví dụ 2:3, 3:4.',
      subset: 'Hãy viết các số nguyên cách nhau bởi dấu phẩy, ví dụ 3, 4, 5.',
    },
    count: `Hãy gõ từ 1 đến ${maxItems} món.`,
    range: `Khối lượng từ 1 đến ${maxWeight} và giá trị từ 0 đến ${maxValue}.`,
    capacity: `Sức chứa phải là số nguyên từ 0 đến ${maxCapacity}.`,
  }),
  sliderItem: 'Món i',
  sliderCapacity: 'Sức chứa c',
  /** @param {number} i @param {number} c */
  sliderValue: (i, c) => `Ô (${i}, ${c})`,
  tableTitle: { table: 'Bảng theo món đồ và sức chứa', row: 'Một hàng theo sức chứa' },
  /** @param {KnapProblem} p @param {KnapLayout} layout */
  tableNote: (p, layout) => {
    if (layout !== 'table')
      return p === 'knapsack'
        ? 'dp[c] là giá trị lớn nhất với sức chứa c, dùng các món đã xét đến giờ.'
        : 'dp[c] cho biết các món đã xét đến giờ có tạo được khối lượng đúng bằng c không. T là true, F là false.';
    return p === 'knapsack'
      ? 'Các hàng là i món đầu tiên, các cột là sức chứa c. Ô (i, c) là giá trị lớn nhất mà chúng xếp vừa vào c.'
      : 'Các hàng là i món đầu tiên, các cột là tổng c. Ô (i, c) cho biết có một số món trong đó nặng đúng bằng c không. T là true, F là false.';
  },
  /** @param {number} v */
  boolCell: (v) => (v ? 'T' : 'F'),
  rowName: 'dp',
  /** @param {KnapProblem} p @param {number} n @param {number} w */
  tableAria: (p, n, w) =>
    `Bảng ${p === 'knapsack' ? 'cái túi' : 'tổng tập con'} cho ${n} món và sức chứa ${w}.`,
  /** @param {string} name @param {number} c @param {number|string|null} v @param {string} state */
  cellLabel: (name, c, v, state) =>
    `${name}, sức chứa ${c}: ${v === null ? 'trống' : v}${state ? `, ${state}` : ''}`,
  /** @param {number} i */
  rowLabel: (i) => (i === 0 ? 'không có món nào' : `các món 1 đến ${i}`),
  cellStates: {
    current: 'vừa lấp',
    read: 'được đọc',
    kept: 'được đọc và được giữ',
    reused: 'được đọc, đã chứa món này',
    path: 'trên đường đi ngược',
    answer: 'đáp án',
  },
  legend: {
    current: 'Vừa lấp',
    read: 'Được ô này đọc',
    kept: 'Lựa chọn được giữ',
    reused: 'Được đọc, đã chứa món này',
    path: 'Đường đi ngược từ đáp án',
    answer: 'Đáp án',
  },
  markers: { current: '●', read: '○', kept: '✓', reused: '!', path: '◆', answer: '★' },
  choiceTitle: 'Lấy hay bỏ',
  choiceEmpty: 'Chạy tới một ô, hoặc chọn một ô bằng thanh trượt.',
  choiceNoFit: 'không vừa',
  /** @param {KnapFrame} f */
  choiceSkip: (f) =>
    f.layout === 'table'
      ? `Bỏ: ${f.problem === 'knapsack' ? 'K' : 'S'}[${f.i - 1}][${f.c}]`
      : `Bỏ: dp[${f.c}]`,
  /** @param {KnapFrame} f */
  choiceTake: (f) => {
    const w = f.items[f.i - 1].weight;
    if (f.layout === 'table') {
      const cell = `${f.problem === 'knapsack' ? 'K' : 'S'}[${f.i - 1}][${f.fits ? f.c - w : '–'}]`;
      return f.problem === 'knapsack' ? `Lấy: ${cell} + ${f.items[f.i - 1].value}` : `Lấy: ${cell}`;
    }
    return f.problem === 'knapsack'
      ? `Lấy: dp[${f.c - w}] + ${f.items[f.i - 1].value}`
      : `Lấy: dp[${f.c - w}]`;
  },
  /** @param {KnapProblem} p @param {number|null} v */
  choiceValue: (p, v) => (v === null ? '' : p === 'knapsack' ? String(v) : v ? 'T' : 'F'),
  choiceKept: '✓ được giữ',
  itemsTitle: 'Các món',
  itemHead: { item: 'Món', weight: 'Khối lượng', value: 'Giá trị', state: 'Trạng thái' },
  itemStates: { now: '● đang xét', taken: '✓ đã lấy' },
  pickedTitle: 'Các món đã lấy',
  pickedEmpty: 'Được nêu tên khi đi ngược.',
  /** @param {number} i */
  pickedChip: (i) => `món ${i}`,
  noWalkTitle: 'Các món đã lấy',
  noWalk: 'Một hàng không nêu được tên các món: các hàng trước đã mất.',
  stats: {
    filled: 'Số ô đã lấp',
    updates: 'Số ô đã ghi',
    answer: 'Đáp án',
    correct: 'Đáp án 0/1 thật',
    greedy: 'Tham lam theo giá trị/khối lượng',
    memory: 'Số ô trong bộ nhớ',
    reuses: 'Số lần dùng lại món',
    bits: 'Số bit để viết T',
  },
  pending: '…',
  /** @param {KnapProblem} p @param {number|null} v */
  answerText: (p, v) => (v === null ? '…' : p === 'knapsack' ? String(v) : v ? 'Có' : 'Không'),
  /** @param {KnapProblem} p @param {number} n @param {number} w @param {number} bits */
  pseudoNote: (p, n, w, bits) => {
    const name = p === 'knapsack' ? 'W' : 'T';
    const note = `Giả đa thức: viết ${name} = ${w} cần ${bits} bit, còn cả bảng có ${(n + 1) * (w + 1)} ô.`;
    if (w === 0) return note;
    const longer = 2 * w + 1;
    return `${note} Thêm một bit nữa, ${name} = ${longer}, cho ${(n + 1) * (longer + 1)} ô.`;
  },
  /** @param {KnapFrame} f */
  describe(f) {
    const knap = f.problem === 'knapsack';
    const row = f.layout !== 'table';
    const T = knap ? 'K' : 'S';
    const item = f.items[f.i - 1];
    const here = row ? `dp[${f.c}]` : `${T}[${f.i}][${f.c}]`;
    switch (f.kind) {
      case 'start':
        return knap
          ? `Xếp ${f.items.length} món vào sức chứa ${f.capacity} để được giá trị lớn nhất. Mỗi món được lấy nguyên cả món, nhiều nhất một lần.`
          : `Có thể chọn một số trong ${f.items.length} món này để nặng đúng bằng ${f.capacity} không? Mỗi món dùng nhiều nhất một lần.`;
      case 'base':
        if (row)
          return knap
            ? 'Trường hợp cơ sở: trước khi xét món nào, mọi sức chứa đều có giá trị 0.'
            : 'Trường hợp cơ sở: trước khi xét món nào, chỉ đạt được tổng 0.';
        return knap
          ? 'Trường hợp cơ sở: hàng 0 không có món nào, nên mọi sức chứa đều có giá trị 0.'
          : 'Trường hợp cơ sở: không có món nào thì chỉ đạt được tổng 0, ứng với tập rỗng.';
      case 'item':
        return item.weight > f.capacity
          ? `Món ${f.i} nặng ${item.weight}, hơn ${f.capacity}, nên lượt này không ghi gì.`
          : `Món ${f.i}, khối lượng ${item.weight}: quét c ${f.layout === 'row-down' ? `từ ${f.capacity} xuống ${item.weight}` : `từ ${item.weight} lên ${f.capacity}`}.`;
      case 'fill': {
        if (!f.fits)
          return `Món ${f.i} nặng ${item.weight}, hơn c = ${f.c}: không vừa, nên bỏ. ${here} = ${knap ? f.skip : yesNo(f.skip)}.`;
        if (!knap) {
          if (f.skip)
            return `${here}: tổng ${f.c} đã đạt được mà không cần món ${f.i}. Ô vẫn là true.`;
          return f.took
            ? `${here}: lấy món ${f.i}, vì tổng ${f.c} − ${item.weight} = ${f.c - item.weight} đã đạt được.${f.reused ? ' Nhưng tổng đó đã dùng món này rồi, nên món này đang bị dùng hai lần.' : ''}`
            : `${here}: dù bỏ hay lấy món ${f.i} cũng không đạt được ${f.c}. Ô vẫn là false.`;
        }
        const offer = `Bỏ → ${f.skip}, lấy → ${f.take}.`;
        if (!f.took) return `${offer} Lấy món ${f.i} không tốt hơn, nên bỏ: ${here} = ${f.skip}.`;
        return `${offer} Lấy món ${f.i}: ${here} = ${f.take}.${f.reused ? ` Nhưng dp[${f.c - item.weight}] đã chứa món ${f.i}, nên món này đang bị dùng lại.` : ''}`;
      }
      case 'trace':
        return f.took
          ? `Ở ${T}[${f.i}][${f.c}]: giá trị khác hàng trên, nên món ${f.i} đã được lấy. Đi lên và sang trái một đoạn bằng khối lượng của nó, ${item.weight}.`
          : `Ở ${T}[${f.i}][${f.c}]: giống hàng trên, nên món ${f.i} đã bị bỏ. Đi thẳng lên.`;
      case 'done': {
        if (row) {
          const answer = knap
            ? `dp[${f.capacity}] = ${f.result}`
            : `dp[${f.capacity}] = ${yesNo(/** @type {number} */ (f.result))}`;
          if (f.result === f.correct)
            return `${answer}, đúng là đáp án thật, chỉ với ${f.capacity + 1} ô.${f.reuses ? ` Trên đường đi có món bị dùng lại (${f.reuses} lần), nhưng đáp án lần này tình cờ vẫn khớp.` : ''}`;
          return `${answer}, nhưng đáp án 0/1 thật là ${knap ? f.correct : yesNo(f.correct)}. Đi lên đã đọc những ô đã chứa món đó, tức là giải bài toán cho phép một món được lặp lại.`;
        }
        if (!knap)
          return f.result
            ? `Có: ${names(f.picked)} nặng đúng bằng ${f.capacity}.`
            : `Không có tập con nào nặng đúng bằng ${f.capacity}.`;
        return f.picked.length
          ? `Giá trị lớn nhất là ${f.result}: ${names(f.picked)}.`
          : 'Không món nào vừa, nên giá trị lớn nhất là 0.';
      }
    }
  },
  takeaways: [
    'Sức chứa là một phần của trạng thái: K[i][c] là giá trị lớn nhất từ i món đầu tiên với chỗ trống c. Món i hoặc bị bỏ, K[i−1][c], hoặc được lấy, K[i−1][c − w[i]] + v[i]; giá trị lớn hơn thắng.',
    'Tổng tập con là cùng bảng đó với true và false: S[i][c] = S[i−1][c] or S[i−1][c − w[i]]. Nó cũng là bài cái túi với mỗi giá trị bằng khối lượng của món: đáp án là có khi giá trị lớn nhất bằng T.',
    'O(nW) là thời gian giả đa thức. Nó là đa thức theo giá trị của W, nhưng viết W chỉ cần khoảng log₂ W bit, nên mỗi bit thêm vào có thể làm bảng to gấp đôi. Nói chung cả hai bài đều NP-khó, và bảng này chỉ dùng được khi W nhỏ.',
    'Mỗi hàng chỉ đọc hàng ngay trên, nên một hàng là đủ nếu c chạy từ W xuống: khi đó dp[c − w] vẫn là giá trị cũ. Đi lên sẽ đọc phải giá trị vừa cập nhật bởi chính món này, tức là giải bài toán cho dùng mỗi món không giới hạn số lần. Một hàng cho ra giá trị nhưng không còn cho biết các món.',
    'Nạp ví dụ một món, khối lượng 2 và giá trị 3 với W = 6, rồi thử từng cách dùng Bộ nhớ. Đi xuống cho 3; đi lên cho 9, ba bản sao của cùng một món. Sau đó nạp bẫy tham lam: cách tham lam (greedy) xếp được 16 nhưng bảng tìm ra 22.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Thời gian', 'O(nW)', '(n + 1)(W + 1) ô, mỗi ô so sánh hai phương án.'],
    [
      'Thời gian theo số bit đầu vào',
      'O(n · 2^b)',
      'Khi W được viết bằng b bit thì W có thể lớn cỡ 2^b, nên chi phí là giả đa thức.',
    ],
    ['Bộ nhớ, cả bảng', 'O(nW)', 'Mọi hàng được giữ lại, nên đường đi ngược nêu được tên các món.'],
    ['Bộ nhớ, một hàng', 'O(W)', 'Mỗi hàng chỉ đọc hàng ngay trên; c chạy đi xuống.'],
    ['Đi ngược', 'O(n)', 'Mỗi món một bước, từ hàng n về hàng 0.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Các món 1:1, 3:4, 4:5, 5:7 (khối lượng:giá trị) và sức chứa 7. Tổng giá trị lớn nhất là bao nhiêu?',
      answer: 9,
      unit: 'giá trị',
      hints: ['Nạp ví dụ Bốn món rồi chạy đến bước cuối.'],
      solution:
        'K[4][7] = 9: lấy món 2 và món 3, khối lượng 3 + 4 = 7, giá trị 4 + 5. Món nặng nhất cùng món 1 chỉ cho 7 + 1 = 8.',
    },
    {
      type: 'number',
      prompt: 'Trong cùng bảng đó, K[3][6], dùng các món 1 đến 3 và sức chứa 6, bằng bao nhiêu?',
      answer: 6,
      unit: 'giá trị',
      hints: ['Đặt thanh trượt ở Món 3 và Sức chứa 6.', 'So sánh K[2][6] với K[2][2] + 5.'],
      solution:
        'Bỏ món 3: K[2][6] = 5, từ món 1 và món 2. Lấy món 3: K[2][2] + 5 = 1 + 5 = 6. Vậy K[3][6] = 6.',
    },
    {
      type: 'number',
      prompt: 'Cả bảng cho 6 món và sức chứa 15 có bao nhiêu ô?',
      answer: 112,
      unit: 'ô',
      hints: ['Tính cả hàng 0 và cột 0: (n + 1)(W + 1).'],
      solution: '(6 + 1) × (15 + 1) = 7 × 16 = 112 ô.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao O(nW) được gọi là giả đa thức?',
      options: [
        'Vì đôi khi bảng cho đáp án sai.',
        'Vì W là một giá trị: viết nó chỉ cần khoảng log₂ W bit, nên chi phí có thể tăng theo hàm mũ của độ dài đầu vào.',
        'Vì thời gian chạy không phụ thuộc vào n.',
        'Vì bảng cần một lựa chọn ngẫu nhiên.',
      ],
      answer: 1,
      hints: ['So sánh độ lớn của W với độ dài khi viết nó ra.'],
      solution:
        'Kích thước đầu vào tính theo số bit của W, khoảng log₂ W, trong khi bảng có khoảng W cột. Mỗi bit thêm vào có thể làm công việc tăng gấp đôi, nên thời gian chỉ là đa thức theo giá trị của W.',
    },
    {
      type: 'number',
      prompt:
        'Một món, khối lượng 2 và giá trị 3, với W = 6. Bảng một hàng trả lời bao nhiêu nếu c chạy đi lên?',
      answer: 9,
      unit: 'giá trị',
      hints: ['Nạp ví dụ Một món rồi chọn Một hàng, đi lên.'],
      solution:
        'dp[2] = 3, rồi dp[4] = dp[2] + 3 = 6 và dp[6] = dp[4] + 3 = 9: ba bản sao của một món chỉ được dùng một lần. Đi xuống cho đáp án đúng là 3.',
    },
    {
      type: 'number',
      prompt:
        'Các món 1:6, 2:10, 3:12 và W = 5. Bảng tìm được giá trị nhiều hơn cách tham lam theo giá trị trên khối lượng bao nhiêu?',
      answer: 6,
      unit: 'giá trị',
      hints: ['Nạp ví dụ Bẫy tham lam rồi đọc hai số liệu.'],
      solution:
        'Cách tham lam lấy món 1 và món 2 được 16, sau đó món 3 không còn vừa. Bảng lấy món 2 và món 3 được 22, nên nhiều hơn 6.',
    },
    {
      type: 'choice',
      prompt: 'Có thể chọn một số trong 2, 4, 6, 8 để tổng bằng 7 không?',
      options: [
        'Có, S[4][7] là true.',
        'Không: tổng các số chẵn luôn là số chẵn, và S[4][7] là false.',
      ],
      answer: 1,
      hints: ['Nạp ví dụ 2, 4, 6, 8 rồi đọc cột 7.'],
      solution:
        'Cột 7 là false ở mọi hàng. Chỉ các tổng chẵn mới thành true, mà 7 là số lẻ, nên không tập con nào được.',
    },
    {
      type: 'text',
      prompt: 'Bộ nhớ của phiên bản một hàng là bao nhiêu, viết theo W?',
      accept: ['O(W)', 'Θ(W)', 'W'],
      hints: ['Hàng đó có bao nhiêu ô?'],
      solution:
        'Một hàng gồm W + 1 ô: O(W), giảm từ O(nW). Giá trị còn giữ được; các món thì không.',
    },
  ],
  nextTeaser:
    'Bài sau, QHĐ trên đoạn, cho mỗi ô ứng với một đoạn [i, j] và thử mọi điểm chia, như trong nhân chuỗi ma trận và cắt thanh.',
};
