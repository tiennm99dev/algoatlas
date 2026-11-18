/** @typedef {import('$lib/algo-engine/modular-inverse-crt.js').ModFrame} ModFrame */
/** @typedef {import('$lib/algo-engine/modular-inverse-crt.js').ModClock} ModClock */

/** Plain text for a number that may be negative. @param {number} v */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

export const vi = {
  slug: 'modular-inverse-crt',
  topic: 'number-theory',
  level: 'Trung bình',
  title: 'Nghịch đảo modulo và định lí số dư Trung Hoa',
  intro:
    'Nghịch đảo của a theo modulo m là số x thoả mãn a·x ≡ 1 (mod m): đó là cách “chia” khi ta chỉ có số dư. Nó tồn tại khi và chỉ khi ƯCLN(a, m) = 1. Có nghịch đảo, ta còn giải được nhiều đồng dư thức cùng lúc: định lí số dư Trung Hoa nói rằng các số dư theo những modulo đôi một nguyên tố cùng nhau xác định đúng một số theo modulo tích của chúng.',
  summary:
    'Tìm nghịch đảo modulo bằng thuật toán Euclid mở rộng hoặc định lí Fermat, rồi ghép từng đồng dư thức một cho đến khi mọi đồng hồ chỉ đúng số dư của nó.',
  instruction:
    'Ở chế độ “Giải hệ”, nhập các đồng dư thức như 2 mod 3, 3 mod 5 rồi chạy từng bước. Kim của mỗi đồng hồ chỉ giá trị ứng viên theo modulo của đồng hồ đó, còn ◆ đánh dấu chỗ kim phải chỉ tới. Để ý khi đi từng bước: cộng thêm M không làm xê dịch đồng hồ nào đã khớp. Ở chế độ “Nghịch đảo”, xem kim rơi về 1, và so sánh hai phương pháp.',
  taskLabel: 'Bài toán',
  tasks: { crt: 'Giải hệ', inverse: 'Nghịch đảo' },
  methodLabel: 'Phương pháp',
  methods: { euclid: 'Euclid mở rộng', fermat: 'Fermat' },
  fields: { a: 'Số a', m: 'Modulo m', system: 'Các đồng dư thức, dạng r mod m' },
  presetLabel: 'Ví dụ',
  inversePresets: {
    simple: '3 mod 7',
    noInverse: '4 mod 6: không có nghịch đảo',
    bigPrime: '1234 mod 9973',
  },
  crtPresets: {
    sunTzu: 'Tôn Tử: đáp số 23',
    four: 'Bốn đồng hồ',
    shared: 'Các modulo có ước chung',
    conflict: 'Vô nghiệm',
  },
  /** @param {number} max */
  aError: (max) => `a phải là số nguyên từ 0 đến ${max}.`,
  /** @param {number} max */
  mError: (max) => `m phải là số nguyên từ 2 đến ${max}.`,
  primeError: 'Phương pháp Fermat cần modulo là số nguyên tố. Với số này, hãy dùng Euclid mở rộng.',
  /** @param {number} maxM @param {number} maxR @param {number} maxN */
  systemErrors: (maxM, maxR, maxN) => ({
    format: 'Viết mỗi đồng dư thức dạng r mod m, cách nhau bằng dấu phẩy, ví dụ 2 mod 3, 3 mod 5.',
    range: `Mỗi modulo phải từ 2 đến ${maxM}, và mỗi số dư không quá ${maxR}.`,
    count: `Dùng tối đa ${maxN} đồng dư thức.`,
  }),
  clocksTitle: 'Đồng hồ: mỗi modulo một chiếc',
  inverseClockTitle: 'Đồng hồ modulo m: kim chỉ a·x',
  /** @param {ModClock} c @param {string} role */
  clockAria: (c, role) =>
    `Đồng hồ modulo ${c.m}: kim đang chỉ ${c.value}, cần chỉ ${c.goal}. ${role}`,
  clockRoles: {
    aligned: 'Đã khớp',
    merged: 'Đã ghép: luôn giữ khớp',
    now: 'Đang giải',
    later: 'Đang chờ',
  },
  clockMarkers: { aligned: '✓', merged: '✓', now: '→', later: '·' },
  /** @param {ModClock} c */
  clockCaption: (c) => `x ≡ ${c.goal} (mod ${c.m})`,
  /** @param {ModClock} c */
  inverseCaption: (c) => `a·x ≡ ${c.value} (mod ${c.m})`,
  legend: {
    goal: '◆ Chỗ kim phải chỉ tới',
    aligned: '✓ Kim đã đúng vạch',
    now: '→ Đang giải',
    later: '· Đang chờ',
  },
  /** Text for a table cell, so a negative number reads with a typographic minus. @param {number|string|null} v */
  cellText: (v) => (typeof v === 'number' ? num(v) : String(v ?? '')),
  tableTitle: {
    euclid: 'Mọi hàng giữ r ≡ t·a (mod m)',
    fermat: 'Bình phương dần tới a^(p − 2)',
    crt: 'Đã ghép đến giờ: x ≡ R (mod M)',
  },
  tableHead: {
    euclid: ['r', 'q', 't'],
    fermat: ['e', 'bit', 'y', 'x'],
    crt: ['đồng hồ', 'R', 'M'],
  },
  /** @param {string} name */
  tableAria: (name) => `Bảng tính: ${name}.`,
  /** @param {string} head @param {number} row @param {string} value @param {string} state */
  tableCell: (head, row, value, state) =>
    `Hàng ${row}, ${head}: ${value || 'trống'}${state ? `, ${state}` : ''}`,
  cellStates: { fresh: 'hàng mới nhất', answer: 'cho đáp số', bad: 'khác 1' },
  cellMarkers: { fresh: '+', answer: '★', bad: '✗' },
  stats: {
    inverse: 'Nghịch đảo x',
    check: 'a·x mod m',
    rounds: { euclid: 'Số phép chia', fermat: 'Số vòng lặp' },
    gcd: 'ƯCLN(a, m)',
    multiplications: 'Số phép nhân',
    candidate: 'Ứng viên x',
    M: 'Bước nhảy M',
    walked: 'Số bước đã đi',
    solution: 'Nghiệm',
  },
  statNone: 'không có',
  /** @param {ModFrame} f */
  solutionValue(f) {
    if (f.solvable === null) return '…';
    return f.solvable ? `${f.R} mod ${f.M}` : this.statNone;
  },
  /** @param {ModFrame} f */
  describe(f) {
    return f.mode === 'crt'
      ? this.describeSystem(f)
      : f.mode === 'euclid'
        ? this.describeEuclid(f)
        : this.describeFermat(f);
  },
  /** @param {ModFrame} f */
  describeEuclid(f) {
    const { a, m, g, inverse } = f;
    const row = /** @type {number[]} */ (f.rows.at(-1));
    const answerRow = /** @type {number[]} */ (f.rows.at(-2));
    switch (f.kind) {
      case 'start':
        return `Tìm x sao cho ${a}·x ≡ 1 (mod ${m}). Hai hàng đầu là ${m} ≡ 0·a và ${a % m} ≡ 1·a.`;
      case 'step':
        return `q = ${row[1]}, nên hàng mới là r = ${row[0]}, t = ${num(row[2])}. Nghĩa là ${num(row[2])}·a ≡ ${row[0]} (mod ${m}), đúng chỗ kim đang chỉ.`;
      case 'found':
        return `Số dư khác 0 cuối cùng là 1, nên ${num(answerRow[2])}·a ≡ 1 (mod ${m}). Lấy dư, nghịch đảo là x = ${inverse}.`;
      case 'none':
        return `ƯCLN(${a}, ${m}) = ${g}, khác 1. Mọi a·x mod ${m} đều là bội của ${g}, nên kim không bao giờ chỉ tới 1: không có nghịch đảo.`;
      default:
        return inverse === null
          ? `Xong: ${a} không có nghịch đảo theo modulo ${m}, vì hai số có chung ước ${g}.`
          : `Xong: ${a}·${inverse} ≡ 1 (mod ${m}), sau ${f.steps} phép chia.`;
    }
  },
  /** @param {ModFrame} f */
  describeFermat(f) {
    const { a, m, inverse } = f;
    const row = /** @type {number[]} */ (f.rows.at(-1));
    switch (f.kind) {
      case 'start':
        if (a % m === 0) return `Tìm nghịch đảo của ${a} theo modulo ${m} bằng định lí Fermat.`;
        return `${m} là số nguyên tố, nên a^${m - 1} ≡ 1 (mod ${m}) và a^${m - 2} chính là nghịch đảo. Ta tính nó bằng bình phương liên tiếp, bắt đầu từ e = ${m - 2}.`;
      case 'bit':
        return row[1] === 1
          ? `e = ${row[0]} lẻ, nên x nhân thêm y = ${row[2]} và thành ${row[3]}. Bình phương y và chia đôi e.`
          : `e = ${row[0]} chẵn, nên x giữ nguyên ${row[3]}. Bình phương y và chia đôi e.`;
      case 'found':
        return `e bằng 0, nên x = a^${m - 2} mod ${m} = ${inverse}. Thử lại: ${a % m}·${inverse} mod ${m} = 1.`;
      case 'none':
        return `${a} ≡ 0 (mod ${m}), mà 0 thì không có nghịch đảo.`;
      default:
        return inverse === null
          ? `Xong: ${a} không có nghịch đảo theo modulo ${m}.`
          : `Xong: nghịch đảo là ${inverse}, sau ${f.multiplications} phép nhân.`;
    }
  },
  /** @param {ModFrame} f */
  describeSystem(f) {
    const { R, M, g, u, t, k } = f;
    const c = f.next >= 0 ? f.system[f.next] : null;
    switch (f.kind) {
      case 'start':
        return `Bắt đầu với đồng dư thức đầu tiên: x ≡ ${R} (mod ${M}). Ứng viên là ${R}.`;
      case 'merge':
        return `Tiếp theo: x ≡ ${c?.r} (mod ${c?.m}). Mọi ứng viên ${R} + k·${M} đều giữ nguyên các đồng hồ đã ghép, vì ${M} là bội của các modulo của chúng. Ở đây ƯCLN(${M}, ${c?.m}) = ${g}.`;
      case 'conflict':
        return `R + k·M luôn dư ${R % g} khi chia cho ${g}, nhưng đồng dư thức này cần dư ${Number(c?.r) % g}. Không ứng viên nào khớp được, nên hệ vô nghiệm.`;
      case 'inverse':
        return t === 0
          ? `Đồng hồ modulo ${c?.m} đã đúng vạch, nên không cần bước nào.`
          : `Nghịch đảo của ${M / g} theo modulo ${Number(c?.m) / g} là ${u}, nên đồng hồ cần t = ${t} bước, mỗi bước ${M}. Đi từng bước để thấy điều đó.`;
      case 'walk':
        return k === t
          ? `k = ${k}: x = ${f.candidate}. Đồng hồ modulo ${c?.m} dừng đúng ở ${c?.r}, như nghịch đảo đã dự đoán, còn các đồng hồ đã ghép không hề nhúc nhích.`
          : `k = ${k}: x = ${f.candidate}. Chỉ đồng hồ modulo ${c?.m} quay.`;
      case 'combine':
        return `Đã ghép: x ≡ ${R} (mod ${M}). Bước nhảy mới ${M} là bội chung nhỏ nhất của các modulo đến giờ.`;
      default:
        return f.solvable
          ? `Xong: x ≡ ${R} (mod ${M}). Nghiệm không âm nhỏ nhất là ${R}, và mọi đồng hồ đều chỉ đúng vạch.`
          : 'Xong: các đồng dư thức mâu thuẫn nhau, nên không số nào thoả mãn tất cả.';
    }
  },
  takeaways: [
    'a có nghịch đảo theo modulo m khi và chỉ khi ƯCLN(a, m) = 1. Nếu hai số có chung ước g, mọi a·x mod m đều là bội của g và không bao giờ bằng 1.',
    'Thuật toán Euclid mở rộng tìm nghịch đảo từ a·x + m·y = 1 và dùng được với mọi modulo. Định lí Fermat cho a^(p − 2), nhưng chỉ khi modulo p là số nguyên tố.',
    'Định lí số dư Trung Hoa: các modulo đôi một nguyên tố cùng nhau cho đúng một nghiệm theo modulo tích của chúng. Các modulo có ước chung g có thể mâu thuẫn; khi không mâu thuẫn, nghiệm lặp lại theo bội chung nhỏ nhất của chúng.',
    'Ghép từng đồng dư thức một. Cộng thêm M hiện tại giữ các đồng hồ đã ghép luôn khớp, nên x = R + t·M chỉ còn phải chỉnh đồng hồ tiếp theo, và nghịch đảo cho ngay t mà không phải đi từng bước.',
    'Thử ví dụ “Tôn Tử”, rồi đổi 2 mod 7 thành 3 mod 7 và xem đáp số chuyển về đâu. Sau đó thử “Vô nghiệm” và đọc lí do không bước nào được đi.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Nghịch đảo bằng Euclid',
      'O(log m)',
      'Vẫn những phép chia như khi tính ƯCLN(a, m), và dùng được với mọi modulo.',
    ],
    [
      'Nghịch đảo bằng Fermat',
      'O(log p)',
      'Luỹ thừa nhanh với số mũ p − 2. Modulo phải là số nguyên tố.',
    ],
    [
      'Hệ gồm k đồng dư thức',
      'O(k log M)',
      'Mỗi lần ghép cần một ƯCLN và một nghịch đảo, với M là modulo cuối cùng.',
    ],
    [
      'Đi từng bước thay vì dùng nghịch đảo',
      'O(m) mỗi lần ghép',
      'Có thể phải thử tới m ứng viên cho đồng hồ tiếp theo: làm tay thì ổn, nhưng chậm khi modulo lớn.',
    ],
    ['Bộ nhớ', 'O(k)', 'Các đồng dư thức, cộng thêm R và M.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Nghịch đảo của 3 theo modulo 7 là bao nhiêu?',
      answer: 5,
      hints: [
        'Thử 3·1, 3·2, 3·3, … theo modulo 7 cho đến khi được 1, hoặc chạy bài toán Nghịch đảo.',
      ],
      solution: '3·5 = 15 = 2·7 + 1, nên 3·5 ≡ 1 (mod 7).',
    },
    {
      type: 'multi',
      prompt: 'Những số nào có nghịch đảo theo modulo 12?',
      options: ['5', '6', '7', '9'],
      answers: [0, 2],
      hints: [
        'Một số có nghịch đảo theo modulo 12 khi và chỉ khi nó không có ước chung nào với 12.',
      ],
      solution:
        'ƯCLN(5, 12) = 1 và ƯCLN(7, 12) = 1, nên hai số đó có nghịch đảo. ƯCLN(6, 12) = 6 và ƯCLN(9, 12) = 3, nên hai số kia thì không.',
    },
    {
      type: 'number',
      prompt: 'Theo Fermat, nghịch đảo của 2 theo modulo 11 là 2⁹ mod 11. Số đó là bao nhiêu?',
      answer: 6,
      hints: ['2⁹ = 512. Chia cho 11, hoặc chạy phương pháp Fermat với a = 2 và m = 11.'],
      solution: '512 = 46·11 + 6, nên nghịch đảo là 6. Thử lại: 2·6 = 12 ≡ 1 (mod 11).',
    },
    {
      type: 'number',
      prompt:
        'Bài toán của Tôn Tử: x chia 3 dư 2, chia 5 dư 3 và chia 7 dư 2. Số nguyên dương x nhỏ nhất như vậy là bao nhiêu?',
      answer: 23,
      hints: ['Chọn ví dụ Tôn Tử và chạy đến bước cuối.'],
      solution:
        '2 mod 3 và 3 mod 5 ghép thành 8 mod 15. Rồi 8, 23: 23 mod 7 = 2, nên x = 23, và các nghiệm lặp lại sau mỗi 105.',
    },
    {
      type: 'choice',
      prompt: 'Hệ x ≡ 1 (mod 4), x ≡ 2 (mod 6) có nghiệm không?',
      options: [
        'Có, vì mỗi đồng dư thức đều có nghiệm',
        'Không, vì đồng dư thức đầu buộc x lẻ còn đồng dư thức sau buộc x chẵn',
        'Có, nhưng chỉ theo modulo 24',
      ],
      answer: 1,
      hints: ['4 và 6 có chung ước 2. Mỗi đồng dư thức nói gì về x theo modulo 2?'],
      solution:
        'x ≡ 1 (mod 4) buộc x là số lẻ, còn x ≡ 2 (mod 6) buộc x là số chẵn. Không số nào vừa lẻ vừa chẵn.',
    },
    {
      type: 'number',
      prompt:
        'Hệ x ≡ 1 (mod 4), x ≡ 3 (mod 6) có nghiệm. Các nghiệm lặp lại theo modulo bao nhiêu?',
      answer: 12,
      hints: ['Chọn ví dụ “Các modulo có ước chung” và đọc M ở bước cuối.'],
      solution:
        'Hai modulo có chung ước 2, nên nghiệm lặp lại sau mỗi BCNN(4, 6) = 12, chứ không phải 24. Nghiệm nhỏ nhất là x = 9.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, sàng Eratosthenes và phân tích thừa số, tìm mọi số nguyên tố đến n chỉ bằng cách gạch bỏ bội.',
};
