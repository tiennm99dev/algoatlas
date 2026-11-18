/** @typedef {import('$lib/algo-engine/amortized-analysis.js').CounterFrame} CounterFrame */
/** @typedef {'aggregate' | 'accounting' | 'potential'} AmortizedMethod */

/** Bits from the highest down, as written on paper. @param {number[]} bits */
const binary = (bits) => bits.slice().reverse().join('');

/** Whole numbers as they are, others to two decimals. @param {number} x */
const num = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2));

export const vi = {
  slug: 'amortized-analysis',
  topic: 'complexity',
  level: 'Nâng cao',
  title: 'Phân tích khấu hao: gộp, kế toán, thế năng',
  intro:
    'Có những thao tác thường rẻ nhưng thỉnh thoảng lại rất đắt: một lần tăng bộ đếm nhị phân có thể lật mọi bit. Phân tích khấu hao (amortized analysis) chặn trên tổng chi phí của cả một dãy thao tác, nên bước đắt hiếm hoi được bù bằng rất nhiều bước rẻ. Khác với phân tích trường hợp trung bình, nó không dùng xác suất: cận đúng với mọi dãy thao tác.',
  summary:
    'Tăng một bộ đếm nhị phân từng bước, trong khi các đồng xu tín dụng nằm trên các bit 1 và một đồ thị thế năng theo dõi chúng, để thấy vì sao m lần tăng tốn ít hơn 2m lần lật bit.',
  instruction:
    'Đặt số bit k và số lần tăng m, rồi chạy từng bước. Mỗi lần lật 1 → 0 tiêu đồng xu trên bit đó; mỗi lần lật 0 → 1 tốn 1 xu và để lại một đồng xu mới. Đổi phương pháp để đọc cùng một lần chạy theo cách đếm gộp, theo một quỹ tín dụng hay theo một hàm thế năng (potential function).',
  bitsLabel: 'Số bit k',
  opsLabel: 'Số lần tăng m',
  bitsError: 'k phải là số nguyên từ 2 đến 8.',
  opsError: 'm phải là số nguyên từ 1 đến 64.',
  methodLegend: 'Phương pháp',
  methods: /** @type {Record<AmortizedMethod, string>} */ ({
    aggregate: 'Gộp',
    accounting: 'Kế toán',
    potential: 'Thế năng',
  }),
  counterTitle: 'Bộ đếm A (bit cao nhất ở bên trái)',
  counterAria: 'Các bit của bộ đếm, bit cao nhất trước',
  pointerI: 'i',
  coin: '¢',
  /** @param {number} bit @param {number} b @param {boolean} coin @param {string} state */
  bitLabel: (bit, b, coin, state) =>
    `Bit ${bit}: ${b}${coin ? ', đang giữ một đồng xu' : ''}${state ? `, ${state}` : ''}`,
  /** @param {number[]} bits @param {number} value */
  valueLine: (bits, value) => `${binary(bits)}₂ = ${value}`,
  legend: {
    coin: 'Bit 1 đang giữ một đồng xu tín dụng',
    reset: 'Vừa đặt lại 1 → 0 (đã tiêu xu)',
    set: 'Vừa bật 0 → 1 (xu mới)',
  },
  states: { reset: 'vừa đặt lại', set: 'vừa bật' },
  chartTitle: 'Chi phí mỗi lần tăng và thế năng Φ',
  chartScroller: 'Biểu đồ chi phí, cuộn ngang được',
  /** @param {number} done @param {number} m @param {number} total @param {number} phi */
  chartLabel: (done, m, total, phi) =>
    `Biểu đồ cột chi phí thực của các lần tăng 1 đến ${done} trong ${m} lần, tổng ${total} lần lật, cùng một đường cho thế năng Φ, hiện bằng ${phi}.`,
  chartLegend: {
    cost: 'Chi phí thực cₜ (số lần lật)',
    now: 'Lần tăng đang chạy',
    phi: 'Thế năng Φₜ (số bit 1)',
  },
  axisOps: 'Lần tăng t →',
  stats: {
    op: 'Lần tăng',
    opCost: 'Số lần lật ở lần tăng này',
    total: 'Tổng số lần lật',
    bound: 'Cận 2t',
    phi: 'Φ (số bit 1 = số xu)',
    worst: 'Lần tăng đắt nhất',
  },
  aggregate: {
    title: 'Gộp: đếm số lần lật của từng bit',
    tableAria: 'Số lần lật của mỗi bit đến giờ, cạnh công thức ⌊t/2ⁱ⌋',
    cols: ['số lần lật', '⌊t/2ⁱ⌋'],
    /** @param {number} i */
    row: (i) => `bit ${i}`,
    /**
     * @param {number} t  Finished increments.
     * @param {number} bound  Σ ⌊t/2ⁱ⌋, the flips of those t increments.
     * @param {number} total  Flips so far, including the increment running now.
     */
    sum: (t, bound, total) => {
      const running =
        total > bound ? ` Lần tăng ${t + 1} đang chạy và đến giờ đã lật ${total - bound} lần.` : '';
      return t === 0
        ? `Bit i lật một lần sau mỗi 2ⁱ lần tăng, nên sau t lần tăng nó đã lật ⌊t/2ⁱ⌋ lần.${running}`
        : `Sau ${t} lần tăng: Σ ⌊${t}/2ⁱ⌋ = ${bound} < 2 × ${t} = ${2 * t} lần lật, trung bình ${num(bound / t)} lần cho mỗi lần tăng.${running}`;
    },
  },
  accounting: {
    title: 'Kế toán: một quỹ tín dụng',
    rule: 'Thu 2 xu cho mỗi lần tăng có bật một bit: 1 xu trả cho lần lật 0 → 1 và 1 xu nằm lại trên bit 1 mới để sau này trả cho lần đặt lại nó. Lần tràn số thu 0 xu: mọi lần đặt lại của nó đã được trả trước.',
    charged: 'Đã thu',
    spent: 'Đã tiêu (số lần lật)',
    bank: 'Còn trong quỹ',
    /** @param {number} charged @param {number} spent @param {number} bank */
    balance: (charged, spent, bank) =>
      `${charged} − ${spent} = ${bank} xu, mỗi bit 1 một đồng. Quỹ không bao giờ âm, nên chi phí thật không vượt quá ${charged} xu đã thu.`,
  },
  potential: {
    title: 'Thế năng: Φ = số bit 1',
    /** @param {CounterFrame} f */
    formula: (f) => {
      if (f.op === 0)
        return 'ĉ = c + ΔΦ: chi phí khấu hao bằng chi phí thực cộng độ thay đổi của Φ.';
      const finished = f.amortized.length === f.op;
      const c = f.opCost;
      const d = f.phi - f.phiBefore;
      return finished
        ? `Lần tăng ${f.op}: ĉ = c + ΔΦ = ${c} + (${f.phi} − ${f.phiBefore}) = ${c + d}.`
        : `Lần tăng ${f.op} đến giờ: c = ${c}, Φ ${f.phiBefore} → ${f.phi}.`;
    },
    /** @param {CounterFrame} f */
    sum: (f) => {
      const done = f.amortized.length;
      if (done === 0) return 'Φ₀ = 0 và Φ không bao giờ âm, nên Σ c ≤ Σ ĉ.';
      const hat = f.amortized.reduce((s, a) => s + a, 0);
      return `Σ ĉ = ${hat} = Σ c + Φ − Φ₀ = ${f.total} + ${f.phi} − 0. Vì Φ ≥ 0 nên Σ c ≤ ${hat} ≤ 2 × ${done}.`;
    },
  },
  practiceTitle: 'Tự kiểm tra',
  /** @param {CounterFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `Bộ đếm ${f.k} bit đang là ${binary(f.bits)}: không có bit 1, không có xu, Φ = 0. Ta sẽ tăng ${f.m} lần.`;
      case 'call':
        return `Lần tăng ${f.op}: bắt đầu từ bit 0 của ${binary(f.bits)} (giá trị ${f.value}).`;
      case 'reset':
        return `Bit ${f.i} bằng 1: đặt lại về 0 và tiêu đồng xu của nó. Lần tăng này đến giờ đã lật ${f.opCost} lần.`;
      case 'set':
        return `Bit ${f.i} bằng 0: bật lên 1, trả 1 xu và để lại 1 xu trên nó. Lần tăng ${f.op} tốn ${f.opCost} lần lật, chi phí khấu hao ${f.amortized[f.op - 1]}; bộ đếm giờ là ${f.value}.`;
      case 'overflow':
        return `Cả ${f.k} bit đều là 1: mỗi bit được đặt lại bằng chính đồng xu của nó và bộ đếm quay về 0. Chi phí ${f.opCost}, chi phí khấu hao 0, vì Φ giảm ${f.k}.`;
      case 'done': {
        const worst = Math.max(...f.costs);
        return `Xong: ${f.m} lần tăng tốn tổng cộng ${f.total} lần lật, ít hơn 2m = ${2 * f.m}, dù riêng một lần tăng đã tốn ${worst}. Mỗi lần tăng có chi phí khấu hao O(1).`;
      }
    }
  },
  takeaways: [
    'Chi phí khấu hao là tổng chi phí ÷ số thao tác trên dãy thao tác xấu nhất, không dùng đến xác suất: một lần tăng có thể tốn k lần lật, nhưng m lần tăng từ 0 không bao giờ tốn quá 2m.',
    'Phương pháp gộp: đếm trực tiếp tổng chi phí. Bit i lật ⌊m/2ⁱ⌋ lần, và Σ ⌊m/2ⁱ⌋ < m(1 + ½ + ¼ + …) = 2m.',
    'Phương pháp kế toán: thu mỗi thao tác một khoản cố định, ở đây là 2, và cất phần dư thành tín dụng trên dữ liệu; tín dụng cất giữ không bao giờ được âm. Mỗi bit 1 giữ đồng xu sẽ trả cho lần đặt lại nó.',
    'Phương pháp thế năng: định nghĩa Φ ≥ 0 với Φ₀ = 0 và tính ĉ = c + ΔΦ. Ở đây Φ = số bit 1 cho ĉ = 2 với mọi lần tăng, và Σ c = Σ ĉ − Φₘ ≤ 2m.',
    'Thử k = 4, m = 16 và xem lần tăng thứ 16: lần tràn số tốn 4 lần lật trong khi đường thế năng rơi từ 4 xuống 0, nên chi phí khấu hao của nó là 0.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Một lần tăng, trường hợp xấu nhất',
      'Θ(k)',
      'Nó có thể lật cả k bit: 0111…1 → 1000…0, hoặc một lần tràn số.',
    ],
    ['m lần tăng từ 0', 'Tổng Θ(m)', 'Σ ⌊m/2ⁱ⌋ < 2m lần lật (phương pháp gộp).'],
    ['Một lần tăng, khấu hao', 'O(1)', 'ĉ = c + ΔΦ ≤ 2 với Φ = số bit 1.'],
    ['Bộ nhớ', 'Θ(k)', 'k bit; các đồng xu và Φ chỉ có trong phép phân tích.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Một bộ đếm 8 bit bắt đầu từ 0. 16 lần tăng đầu tiên tốn tổng cộng bao nhiêu lần lật?',
      answer: 31,
      unit: 'lần lật',
      hints: [
        'Bit i lật ⌊16/2ⁱ⌋ lần. Đặt k = 8, m = 16 và xem bảng của phương pháp gộp.',
        '16 + 8 + 4 + 2 + 1 + 0 + 0 + 0.',
      ],
      solution:
        'Bit 0 lật 16 lần, bit 1 lật 8 lần, bit 2 lật 4 lần, bit 3 lật hai lần và bit 4 lật một lần: 31 lần lật, vừa dưới 2 × 16 = 32.',
    },
    {
      type: 'number',
      prompt:
        'Với Φ = số bit 1, một lần tăng đặt lại ba bit 1 rồi bật một bit 0. Chi phí khấu hao c + ΔΦ của nó là bao nhiêu?',
      answer: 2,
      hints: [
        'Chi phí thực là 3 lần đặt lại + 1 lần bật = 4.',
        'Φ mất ba bit 1 và thêm một: ΔΦ = −2.',
      ],
      solution:
        'c = 4 và ΔΦ = 1 − 3 = −2, nên ĉ = 4 − 2 = 2, bằng mọi lần tăng không tràn số khác.',
    },
    {
      type: 'number',
      prompt: 'Một lần tăng của bộ đếm 8 bit tốn nhiều nhất bao nhiêu lần lật?',
      answer: 8,
      unit: 'lần lật',
      hints: ['Hãy nghĩ đến 01111111 → 10000000.'],
      solution:
        '01111111 → 10000000 đặt lại bảy bit và bật một bit: 8 lần lật. Lần tràn số 11111111 → 00000000 cũng tốn 8. Một lần tăng tốn Θ(k), dù chi phí khấu hao chỉ là O(1).',
    },
    {
      type: 'number',
      prompt: 'Đặt k = 8 và m = 64. 64 lần tăng tốn tổng cộng bao nhiêu lần lật?',
      answer: 127,
      unit: 'lần lật',
      hints: ['Cộng ⌊64/2ⁱ⌋ với i từ 0 đến 7.', '64 + 32 + 16 + 8 + 4 + 2 + 1 + 0.'],
      solution: '64 + 32 + 16 + 8 + 4 + 2 + 1 + 0 = 127 lần lật, dưới cận 2m = 128.',
    },
    {
      type: 'choice',
      prompt: 'Trong phương pháp kế toán, vì sao quỹ tín dụng không bao giờ âm?',
      options: [
        'Mỗi bit 1 giữ đúng một đồng xu, và chỉ bit 1 mới bị đặt lại',
        'Trong mô hình RAM, đặt lại bit không tốn gì',
        'Mỗi lần tăng lật nhiều nhất hai bit',
        'Bộ đếm bắt đầu với một đồng xu trên mỗi bit',
      ],
      answer: 0,
      hints: ['Những lần lật nào tiêu xu, và các đồng xu đó nằm ở đâu?'],
      solution:
        'Một đồng xu được để lại trên bit khi bit đó thành 1, và lần lật 1 → 0 tiêu đúng đồng xu trên bit ấy. Vì vậy quỹ luôn bằng số bit 1, không bao giờ âm.',
    },
  ],
  nextTeaser:
    'Đến lúc tự tay áp dụng mọi công cụ của chủ đề. Bài sau là Luyện tập: ước lượng thời gian chạy của mười đoạn mã.',
};
