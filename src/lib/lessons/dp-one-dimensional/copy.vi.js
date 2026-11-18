/** @typedef {import('$lib/algo-engine/dp-one-dimensional.js').OneDimFrame} OneDimFrame */
/** @typedef {import('$lib/algo-engine/dp-one-dimensional.js').OneDimProblem} OneDimProblem */
/** @typedef {import('$lib/algo-engine/dp-one-dimensional.js').OneDimCandidate} OneDimCandidate */

/** @param {number|null} v */
const show = (v) => (v === null ? '' : v === Infinity ? '∞' : String(v));
/** @param {string[]} items */
const list = (items) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} và ${items.at(-1)}`;

export const vi = {
  slug: 'dp-one-dimensional',
  topic: 'dynamic-programming',
  level: 'Cơ bản',
  title: 'QHĐ một chiều: leo cầu thang, đổi tiền, ăn trộm nhà',
  intro:
    'Nhiều lời giải quy hoạch động (dynamic programming) chỉ cần một hàng ô: dp[i] là đáp án cho một tiền tố của đầu vào, tức i bậc đầu tiên, số tiền i hoặc i ngôi nhà đầu tiên. Mỗi ô được dựng từ vài ô bên trái nó, nên lấp hàng từ trái sang phải luôn có sẵn những gì cần. Cùng một hàng có thể dùng để đếm (có bao nhiêu cách) hoặc tối ưu (ít đồng xu nhất, nhiều tiền nhất); chỉ cách kết hợp các ô là thay đổi.',
  summary:
    'Lấp một hàng ô QHĐ từ trái sang phải cho các bài leo cầu thang, đổi tiền và ăn trộm nhà, có mũi tên chỉ tới các ô mà mỗi ô đọc.',
  instruction:
    'Chọn một bài toán, sửa đầu vào rồi chạy từng bước: các mũi tên cho biết ô hiện tại đọc những ô nào phía trước, và mũi tên đậm có dấu ✓ là lựa chọn thắng. Ở bước cuối, chuỗi các lựa chọn thắng cho thấy những đồng xu hay ngôi nhà nào tạo nên đáp án.',
  problemLabel: 'Bài toán',
  problems: { stairs: 'Leo cầu thang', coins: 'Đổi tiền', robber: 'Ăn trộm nhà' },
  stepsLabel: 'Số bậc n',
  coinsLabel: 'Các đồng xu',
  amountLabel: 'Số tiền',
  housesLabel: 'Các ngôi nhà',
  /** @param {OneDimProblem} p */
  problemText: (p) =>
    ({
      stairs:
        'Đếm số cách leo n bậc thang khi mỗi lần bước lên 1 hoặc 2 bậc. dp[i] = số cách tới bậc i.',
      coins:
        'Tạo ra số tiền với ít đồng xu nhất; mỗi loại đồng xu dùng bao nhiêu lần cũng được. dp[a] = số đồng xu ít nhất có tổng bằng a.',
      robber:
        'Trộm các ngôi nhà dọc một con phố để được nhiều tiền nhất, nhưng không bao giờ trộm hai nhà kề nhau. dp[i] = số tiền nhiều nhất lấy từ các nhà 1 đến i.',
    })[p],
  errors: {
    /** @param {number} max */
    steps: (max) => `n phải là số nguyên từ 0 đến ${max}.`,
    /** @param {number} max */
    amount: (max) => `Số tiền phải là số nguyên từ 0 đến ${max}.`,
    /** @param {number} count @param {number} max */
    coins: (count, max) =>
      `Hãy gõ từ 1 đến ${count} mệnh giá, mỗi mệnh giá từ 1 đến ${max}, ví dụ 1, 3, 4.`,
    /** @param {number} count @param {number} max */
    houses: (count, max) =>
      `Hãy gõ từ 1 đến ${count} giá trị ngôi nhà, mỗi giá trị từ 0 đến ${max}, ví dụ 2, 7, 9, 3, 1.`,
  },
  rowTitle: 'Hàng QHĐ',
  /** @param {OneDimProblem} p @param {number} filled @param {number} size */
  rowAria: (p, filled, size) =>
    `Hàng QHĐ cho bài ${{ stairs: 'leo cầu thang', coins: 'đổi tiền', robber: 'ăn trộm nhà' }[p]}: đã lấp ${filled}/${size} ô.`,
  /** @param {OneDimProblem} p @param {number} i @param {number|null} v @param {string} state */
  cellLabel: (p, i, v, state) =>
    `dp[${i}]${p === 'robber' && i > 0 ? ` (nhà ${i})` : ''}: ${v === null ? 'trống' : v === Infinity ? 'không thể' : v}${state ? `, ${state}` : ''}`,
  houseRow: 'h',
  cellStates: {
    current: 'vừa lấp',
    read: 'đang đọc',
    chosen: 'được lựa chọn thắng đọc',
    base: 'trường hợp cơ sở',
    answer: 'đáp án',
    path: 'trên chuỗi tốt nhất',
  },
  legend: {
    current: 'Vừa lấp',
    read: 'Đang đọc',
    chosen: 'Lựa chọn thắng',
    path: 'Chuỗi các lựa chọn tốt nhất',
    answer: 'Đáp án',
  },
  markers: { current: '●', read: '○', chosen: '✓', path: '◆', answer: '★' },
  /** @param {OneDimProblem} p @param {OneDimCandidate} c */
  arcLabel: (p, c) =>
    p === 'stairs'
      ? c.tag === 'one'
        ? '+1'
        : '+2'
      : p === 'coins'
        ? `xu ${c.coin}`
        : c.tag === 'skip'
          ? 'bỏ qua'
          : `trộm ${c.coin}`,
  infinity: '∞',
  stats: {
    filled: 'Số ô đã lấp',
    lookups: 'Số ô đã đọc',
    result: 'Đáp án',
  },
  resultPending: '…',
  picksTitle: { coins: 'Các đồng xu đã dùng', robber: 'Các nhà bị trộm' },
  picksEmpty: 'Hiện ở bước cuối.',
  picksNone: 'Không có.',
  /** @param {OneDimProblem} p @param {number} k */
  pickLabel: (p, k) => (p === 'coins' ? String(k) : `nhà ${k}`),
  /** @param {OneDimFrame} f */
  describe(f) {
    const p = f.problem;
    switch (f.kind) {
      case 'start':
        return {
          stairs: `Đếm số cách leo ${f.input.n} bậc. Hàng có một ô cho mỗi bậc, từ dp[0] đến dp[${f.input.n}].`,
          coins: `Tạo số tiền ${f.input.amount} từ các đồng xu ${list(f.input.coins.map(String))} với ít đồng xu nhất. Hàng có một ô cho mỗi số tiền, từ dp[0] đến dp[${f.input.amount}].`,
          robber: `Trộm ${f.input.houses.length} ngôi nhà để được nhiều tiền nhất mà không trộm hai nhà kề nhau. dp[i] là số tiền tốt nhất từ i nhà đầu tiên.`,
        }[p];
      case 'base':
        return {
          stairs:
            f.written.length > 1
              ? 'Trường hợp cơ sở: dp[0] = 1, cách duy nhất để không leo bậc nào, và dp[1] = 1, một bước duy nhất.'
              : 'Trường hợp cơ sở: dp[0] = 1, cách duy nhất để không leo bậc nào.',
          coins: 'Trường hợp cơ sở: dp[0] = 0. Không cần đồng xu nào để có số tiền 0.',
          robber: `Trường hợp cơ sở: dp[0] = 0 khi không có nhà nào, và dp[1] = h[1] = ${f.input.houses[0]}: chỉ có một nhà thì trộm nhà đó.`,
        }[p];
      case 'fill': {
        const i = f.cell;
        const v = show(f.dp[i]);
        const c = f.candidates;
        if (p === 'stairs')
          return `Bước cuối cùng lên bậc ${i} là bước 1 bậc (từ ${i - 1}) hoặc 2 bậc (từ ${i - 2}). Cộng cả hai: dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${c[0].value} + ${c[1].value} = ${v}.`;
        if (p === 'coins') {
          if (c.length === 0)
            return `Không có đồng xu nào nhỏ hơn hoặc bằng ${i}, nên dp[${i}] = ∞: không tạo được ${i}.`;
          const tries = c.map((x) => `xu ${x.coin} → dp[${x.from}] + 1 = ${show(x.value)}`);
          return f.chosen < 0
            ? `Thử lần lượt từng đồng xu làm đồng cuối: ${tries.join('; ')}. Tất cả đều không thể, nên dp[${i}] = ∞.`
            : `Thử lần lượt từng đồng xu làm đồng cuối: ${tries.join('; ')}. Ít nhất là ${v}, với xu ${c[f.chosen].coin} ở cuối.`;
        }
        const h = f.input.houses[i - 1];
        return `Nhà ${i}: bỏ qua và giữ dp[${i - 1}] = ${c[0].value}, hoặc trộm để được ${h} + dp[${i - 2}] = ${c[1].value}. ${f.chosen === 1 ? 'Trộm nhà này' : 'Bỏ qua nhà này'}: dp[${i}] = ${v}.`;
      }
      case 'done': {
        const r = show(f.result);
        if (p === 'stairs')
          return `Có ${r} cách leo ${f.input.n} bậc, sau ${f.lookups} lần đọc ô. Bài đếm cộng các lựa chọn lại thay vì chọn một.`;
        if (p === 'coins')
          return f.result === Infinity
            ? `dp[${f.input.amount}] = ∞: các đồng xu này không tạo được ${f.input.amount}.`
            : `Số tiền ${f.input.amount} cần ${f.result} đồng xu: ${f.picks.join(' + ')}. Lần ngược các lựa chọn thắng từ dp[${f.input.amount}] sẽ ra các đồng xu.`;
        return f.picks.length
          ? `Nhiều nhất là ${r}, khi trộm ${list(f.picks.map((k) => `nhà ${k}`))}. Lần ngược các lựa chọn thắng từ dp[${f.input.houses.length}] sẽ ra các ngôi nhà.`
          : `Nhiều nhất là ${r}: mọi ngôi nhà đều trống.`;
      }
    }
  },
  takeaways: [
    'Trạng thái là một tiền tố: dp[i] là đáp án cho i bậc đầu tiên, số tiền i hoặc i nhà đầu tiên, nên n + 1 ô bao trọn mọi bài toán con.',
    'Công thức chuyển đi từ các trạng thái nhỏ hơn: mỗi ô chỉ đọc các ô bên trái, nên lấp từ trái sang phải là một thứ tự hợp lệ.',
    'Bài đếm kết hợp các lựa chọn bằng phép +, như leo cầu thang; bài tối ưu chọn cái tốt nhất bằng min hoặc max, như đổi tiền và ăn trộm nhà.',
    'Ghi nhớ lựa chọn nào thắng ở mỗi ô, em có thể lần ngược từ đáp án để dựng lại các đồng xu hay ngôi nhà, chứ không chỉ có con số.',
    'Thử các đồng xu 1, 3, 4 với số tiền 6: cách tham lam (greedy) lấy 4 + 1 + 1, nhưng hàng QHĐ tìm ra 3 + 3. Sau đó đổi các đồng xu thành 2, 5 và số tiền thành 3.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Leo cầu thang, thời gian', 'O(n)', 'n + 1 ô, mỗi ô đọc 2 ô trước đó.'],
    ['Đổi tiền, thời gian', 'O(A · k)', 'A + 1 ô cho số tiền A, mỗi ô thử tối đa k đồng xu.'],
    ['Ăn trộm nhà, thời gian', 'O(n)', 'n + 1 ô, mỗi ô so sánh bỏ qua và trộm.'],
    [
      'Bộ nhớ',
      'O(n), hoặc O(1)',
      'Hàng có n + 1 ô; leo cầu thang và ăn trộm nhà chỉ đọc hai ô cuối, nên hai biến là đủ. Đổi tiền cần max(coin) ô cuối.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Có bao nhiêu cách leo 6 bậc thang, mỗi lần bước 1 hoặc 2 bậc?',
      answer: 13,
      unit: 'cách',
      hints: [
        'Chọn Leo cầu thang, đặt n = 6 rồi chạy đến bước cuối.',
        'dp[i] = dp[i − 1] + dp[i − 2], bắt đầu bằng 1, 1.',
      ],
      solution: 'dp = 1, 1, 2, 3, 5, 8, 13, nên có 13 cách.',
    },
    {
      type: 'number',
      prompt: 'Với các đồng xu 1, 3 và 4, cần ít nhất bao nhiêu đồng xu để có 6?',
      answer: 2,
      unit: 'đồng xu',
      hints: [
        'Chọn Đổi tiền với đầu vào mặc định rồi chạy đến bước cuối.',
        'Cách tham lam lấy đồng xu lớn nhất trước. 4 + 1 + 1 có phải tốt nhất không?',
      ],
      solution:
        'dp = 0, 1, 2, 1, 1, 2, 2. dp[6] = 1 + min(dp[5], dp[3], dp[2]) = 1 + 1 = 2, với 3 + 3. Cách tham lam sẽ dùng 3 đồng xu.',
    },
    {
      type: 'number',
      prompt:
        'Với các đồng xu 1, 3, 4 và số tiền 6, bài đổi tiền đọc tất cả bao nhiêu ô phía trước?',
      answer: 13,
      unit: 'ô',
      hints: ['Đọc “Số ô đã đọc” ở bước cuối, hoặc đếm số đồng xu vừa với mỗi số tiền.'],
      solution:
        'Số tiền 1 và 2 mỗi số vừa một đồng xu, số tiền 3 vừa hai, còn 4, 5 và 6 vừa cả ba: 1 + 1 + 2 + 3 + 3 + 3 = 13.',
    },
    {
      type: 'number',
      prompt:
        'Tên trộm lấy được nhiều nhất bao nhiêu từ các nhà 2, 7, 9, 3, 1 nếu không trộm hai nhà kề nhau?',
      answer: 12,
      hints: ['Chọn Ăn trộm nhà với đầu vào mặc định.'],
      solution: 'dp = 0, 2, 7, 11, 11, 12. Tốt nhất là 12, khi trộm các nhà 1, 3 và 5 (2 + 9 + 1).',
    },
    {
      type: 'choice',
      prompt: 'Trong ba bài toán, bài nào là bài đếm chứ không phải bài tối ưu?',
      options: ['Leo cầu thang', 'Đổi tiền', 'Ăn trộm nhà'],
      answer: 0,
      hints: ['Hệ thức truy hồi nào dùng phép + giữa các lựa chọn thay vì min hay max?'],
      solution:
        'Leo cầu thang cộng số cách qua cả hai lựa chọn, dp[i − 1] + dp[i − 2]. Đổi tiền lấy giá trị nhỏ nhất còn ăn trộm nhà lấy giá trị lớn nhất, chỉ giữ lựa chọn tốt nhất.',
    },
  ],
  nextTeaser:
    'Bài sau, Dãy con tăng dài nhất, vẫn dùng một hàng ô, nhưng mỗi ô phải nhìn lại mọi ô trước nó, rồi ta tăng tốc bằng tìm kiếm nhị phân.',
};
