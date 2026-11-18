/** @typedef {import('$lib/algo-engine/universal-perfect-hashing.js').PerfectFrame} PerfectFrame */

/** Two decimal places, without trailing zeros. @param {number} x */
const twoDp = (x) => String(Math.round(x * 100) / 100);

/** The working of one hash value. @param {number} k @param {number} a @param {number} b @param {number} m @param {number} p */
const working = (k, a, b, m, p) =>
  `((${a}·${k} + ${b}) mod ${p}) mod ${m} = ${(a * k + b) % p} mod ${m} = ${((a * k + b) % p) % m}`;

export const vi = {
  slug: 'universal-perfect-hashing',
  topic: 'algebraic-randomised',
  level: 'Nâng cao',
  title: 'Universal hashing và perfect hashing',
  intro:
    'Hàm hash (hàm băm) cố định nào cũng có một tập khoá xấu rơi hết vào cùng một ô, và kẻ phá biết hàm đó có thể gửi đúng tập khoá ấy. Universal hashing (băm phổ quát) rút ngẫu nhiên hàm hash từ một họ mà trong đó hai khoá va chạm với xác suất không quá 1/m, nên tính trung bình thì tập khoá nào cũng tốt. Dùng nó ở hai tầng, ta dựng được một hash table (bảng băm) theo kiểu perfect hashing (băm hoàn hảo) cho một tập khoá cố định: không có va chạm nào, tra cứu mất O(1) ngay cả trong trường hợp xấu nhất, và chỉ tốn O(n) bộ nhớ.',
  summary:
    'Rút hàm hash từ họ phổ quát ((a·k + b) mod p) mod m, lấy trung bình số va chạm qua nhiều lần rút, và dựng từng bước một hash table hoàn hảo hai tầng.',
  instruction:
    'Nhập tối đa 12 khoá hoặc chọn một ví dụ, rồi chạy từng bước quá trình dựng bảng: tầng thứ nhất rải các khoá vào n bucket (ngăn), và mỗi bucket được một bảng không va chạm gồm nⱼ² ô. Bấm “Rút 100 hàm” để lấy trung bình số va chạm qua các lần rút ngẫu nhiên và so với hàm hash cố định k mod n; ví dụ “Tấn công” là một tập khoá được dựng riêng để đánh bại hàm cố định đó.',
  fields: { keys: 'Các khoá', lookup: 'Tra một khoá' },
  presetLabel: 'Ví dụ',
  presets: {
    textbook: 'Sách giáo khoa (9)',
    attack: 'Tấn công k mod n (10)',
    small: 'Nhỏ (4)',
  },
  /** @param {number} minN @param {number} maxN @param {number} max */
  keysError: (minN, maxN, max) =>
    `Hãy nhập từ ${minN} đến ${maxN} số nguyên khác nhau trong khoảng 0 đến ${max}, ngăn cách bằng dấu phẩy hoặc dấu cách.`,
  /** @param {number} max */
  lookupError: (max) => `Hãy tra một số nguyên từ 0 đến ${max}.`,
  lookupButton: 'Tra cứu',
  lookupWait: 'Hãy chạy đến bước cuối của quá trình dựng trước đã: tra cứu dùng bảng đã dựng xong.',
  /** @param {number} k @param {number} j @param {number} slot @param {boolean} found */
  lookupResult: (k, j, slot, found) =>
    slot < 0
      ? `${k} được hash vào bucket ${j}, bucket này rỗng: ${k} không có trong bảng. Chỉ cần một lần hash.`
      : `${k} được hash vào bucket ${j}, rồi vào ô ${slot} của bucket: ${found ? `tìm thấy ${k}` : `${k} không ở đó, nên nó không có trong bảng`}. Hai lần hash và một phép so sánh, dù tập khoá là gì.`,
  reroll: 'Dựng ngẫu nhiên lần khác',
  family: 'Họ hàm: h(k) = ((a·k + b) mod p) mod m, với p = 101',
  /** @param {number} a @param {number} b @param {number} n */
  firstLevel: (a, b, n) => `; tầng thứ nhất a = ${a}, b = ${b}, m = ${n}`,
  tableTitle: 'Bảng hai tầng',
  /** @param {number} n */
  tableAria: (n) => `${n} bucket của tầng thứ nhất, mỗi bucket có các ô của tầng thứ hai`,
  /** @param {number} j @param {number} count */
  bucketLabel: (j, count) => `Bucket ${j}, ${count} khoá`,
  /** @param {number} m @param {number} a @param {number} b */
  secondParams: (m, a, b) => `m = ${m}, a = ${a}, b = ${b}`,
  emptyBucket: 'rỗng',
  emptySlot: '·',
  /** @param {number} s @param {number | null} key @param {string} state */
  slotLabel: (s, key, state) =>
    `Ô ${s}: ${key === null ? 'trống' : key}${state ? `, ${state}` : ''}`,
  roleNames: {
    placed: 'vừa đặt vào',
    clash: 'va chạm',
    done: 'bucket đã xong',
    '': '',
  },
  roleMarkers: { placed: '→', clash: '✗', done: '✓', '': '' },
  legend: {
    placed: '→ Vừa đặt vào',
    clash: '✗ Va chạm: rút lại',
    done: '✓ Bucket đã xong, không va chạm',
  },
  stats: {
    firstDraws: 'Số lần rút ở tầng một',
    sumSquares: 'Σ nⱼ² (phải < 4n)',
    secondDraws: 'Số lần rút ở tầng hai',
    slots: 'Tổng số ô, n + Σ mⱼ',
  },
  /** @param {number} sum @param {number} n */
  sumText: (sum, n) => `${sum} / ${4 * n}`,
  sampleTitle: 'Số va chạm qua nhiều lần rút ngẫu nhiên (m = n)',
  /** @param {number} k */
  sampleMany: (k) => `Rút ${k} hàm`,
  clear: 'Xoá các lần rút',
  /** @param {number} max */
  samplesFull: (max) => `Mẫu giữ nhiều nhất ${max} lần rút. Hãy xoá để bắt đầu lại.`,
  sampleEmpty: 'Bấm “Rút 100 hàm” để bắt đầu lấy mẫu.',
  /** @param {number} draws */
  histAria: (draws) => `Biểu đồ tần suất số cặp va chạm qua ${draws} lần rút`,
  /** @param {number} pairs @param {number} count */
  binLabel: (pairs, count) => `${pairs} cặp va chạm: ${count} lần rút`,
  histMarks: '▲ trung bình các lần rút   ◆ cận của universal hashing   ✗ hàm cố định k mod n',
  sampleStats: {
    draws: 'Số lần rút',
    mean: 'Số cặp va chạm trung bình',
    exact: 'Trung bình chính xác, cả 10 100 hàm',
    bound: 'Cận n(n − 1)/(2m)',
    fixed: 'Hàm cố định k mod n',
    good: 'Số lần rút có Σ nⱼ² < 4n',
  },
  twoDp,
  /** @param {number} good @param {number} draws */
  goodText: (good, draws) => `${good}/${draws}`,
  /** @param {PerfectFrame} f @param {number} p */
  describe(f, p) {
    const n = f.keys.length;
    switch (f.kind) {
      case 'start':
        return `Dựng hash table hoàn hảo cho ${n} khoá: trước hết rải chúng vào ${n} bucket, rồi cho mỗi bucket một bảng riêng không có va chạm.`;
      case 'draw':
        return f.fallback
          ? `Thử nhiều lần vẫn chưa rút được hàm tốt, nên ta lấy hàm tốt đầu tiên theo thứ tự: a = ${f.a}, b = ${f.b}.`
          : `Rút ngẫu nhiên một hàm cho tầng thứ nhất: a = ${f.a}, b = ${f.b}. Các bucket của nó lúc đầu đều rỗng.`;
      case 'place':
        return `h(${f.key}) = ${working(f.key, f.a, f.b, n, p)}: đặt ${f.key} vào bucket ${f.j}. Giờ Σ nⱼ² bằng ${f.sumSquares}.`;
      case 'check':
        return f.accepted
          ? `Σ nⱼ² = ${f.sumSquares} < 4n = ${4 * n}: giữ hàm này. Tầng thứ hai sẽ dùng ${f.sumSquares} ô.`
          : `Σ nⱼ² = ${f.sumSquares} ≥ 4n = ${4 * n}: quá nhiều khoá dồn chung bucket, nên rút lại. Điều này xảy ra với xác suất dưới 1/2.`;
      case 'second': {
        const t = f.tables[f.j];
        const size = f.buckets[f.j].length;
        return f.fallback
          ? `Bucket ${f.j}: thử nhiều lần vẫn chưa rút được hàm tốt, nên ta lấy hàm không va chạm đầu tiên theo thứ tự: a = ${t.a}, b = ${t.b}.`
          : `Bucket ${f.j} chứa ${size} khoá, nên được ${size}² = ${t.m} ô. Rút a = ${t.a}, b = ${t.b} (lần rút thứ ${t.draws} cho bucket này).`;
      }
      case 'slot': {
        const t = f.tables[f.j];
        return `h${f.j}(${f.key}) = ${working(f.key, t.a, t.b, t.m, p)}: ô ${f.slot} còn trống, nên ${f.key} vào đó.`;
      }
      case 'collide': {
        const t = f.tables[f.j];
        return `h${f.j}(${f.key}) = ${working(f.key, t.a, t.b, t.m, p)}, nhưng ô ${f.slot} đã chứa ${f.clash}: va chạm. Bỏ hàm này và rút lại.`;
      }
      case 'fits':
        return `Mọi khoá của bucket ${f.j} đều có ô riêng, nên bucket ${f.j} đã xong.`;
      case 'done':
        return `Dựng xong sau ${f.firstDraws} lần rút ở tầng một và ${f.secondDraws} lần rút ở tầng hai, dùng ${n} + ${f.slots} = ${n + f.slots} ô. Không có hai khoá nào chung một ô: hãy tra thử một khoá bên dưới.`;
    }
  },
  takeaways: [
    'Một họ hàm hash là phổ quát khi hai khoá phân biệt bất kì va chạm dưới không quá 1/m số hàm trong họ. Họ ((a·k + b) mod p) mod m, với p nguyên tố, a ≠ 0 và các khoá nhỏ hơn p, là một họ như vậy.',
    'Rút hàm ngẫu nhiên lấy đi quyền kiểm soát của đầu vào: với mọi tập cố định gồm n khoá, số cặp va chạm kì vọng không quá n(n − 1)/(2m), nên mỗi chuỗi móc nối trung bình có O(1 + n/m) khoá.',
    'Với m = n², số cặp va chạm kì vọng dưới 1/2, nên một hàm ngẫu nhiên không gây va chạm nào với xác suất trên 1/2. Dùng cho tất cả các khoá cùng lúc thì quá tốn bộ nhớ, nhưng cho từng bucket nhỏ thì vừa đẹp.',
    'Perfect hashing hai tầng hash n khoá vào n bucket, rút lại cho đến khi Σ nⱼ² < 4n, rồi cho bucket j một bảng không va chạm gồm nⱼ² ô. Mỗi lần tra cứu là hai lần hash và một phép so sánh, và bộ nhớ dưới 5n ô.',
    'Thử “Tấn công k mod n”: hàm cố định dồn cả 10 khoá vào một bucket (45 cặp), trong khi 100 lần rút ngẫu nhiên trung bình chỉ khoảng 4 cặp, dưới cận 4,5.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Tra cứu, bảng hoàn hảo',
      'O(1) trong trường hợp xấu nhất',
      'Một lần hash ở tầng một, một lần hash ở tầng hai, một phép so sánh.',
    ],
    [
      'Tra cứu, universal hashing có móc nối',
      'O(1 + n/m) kì vọng',
      'Với mọi tập khoá, số khoá va chạm kì vọng trong một chuỗi không quá (n − 1)/m.',
    ],
    [
      'Dựng bảng hoàn hảo',
      'O(n) kì vọng',
      'Mỗi lần rút ở mỗi tầng thành công với xác suất trên 1/2, nên kì vọng cần ít hơn 2 lần rút, mỗi lần tốn O(cỡ).',
    ],
    ['Bộ nhớ, bảng hoàn hảo', 'O(n)', 'n bucket cộng Σ nⱼ² < 4n ô ở tầng hai.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với a = 3, b = 42, p = 101 và m = 9, h(75) = ((a·k + b) mod p) mod m bằng bao nhiêu?',
      answer: 2,
      hints: ['3 · 75 + 42 = 267. Lấy mod 101 trước, rồi mod 9.'],
      solution: '267 mod 101 = 65, và 65 mod 9 = 2, nên 75 vào bucket 2.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Tấn công k mod n”. Hàm cố định k mod n tạo ra bao nhiêu cặp va chạm trên tập này?',
      answer: 45,
      unit: 'cặp',
      hints: ['Mọi khoá đều là bội của 10 và n = 10. 10 khoá chung một ô tạo thành bao nhiêu cặp?'],
      solution: 'Cả 10 khoá rơi vào ô 0, nên mọi cặp đều va chạm: 10 · 9 / 2 = 45.',
    },
    {
      type: 'number',
      prompt:
        'Với 10 khoá đó trong m = 10 ô, tính phổ quát cho cận nào cho số cặp va chạm kì vọng?',
      answer: 4.5,
      unit: 'cặp',
      hints: ['Có 10 · 9 / 2 = 45 cặp, và mỗi cặp va chạm với xác suất không quá 1/m.'],
      solution: '45 cặp · 1/10 = 4.5. Trung bình chính xác trên cả 10 100 hàm vào khoảng 4,1.',
    },
    {
      type: 'number',
      prompt: 'Một bucket ở tầng thứ nhất nhận 3 khoá. Bảng tầng hai của nó có bao nhiêu ô?',
      answer: 9,
      unit: 'ô',
      hints: ['Tầng thứ hai dùng nⱼ² ô.'],
      solution: '3² = 9 ô, nên số cặp va chạm kì vọng không quá 3/9 = 1/3 < 1/2.',
    },
    {
      type: 'multi',
      prompt: 'Những khẳng định nào về hash table hoàn hảo hai tầng là đúng?',
      options: [
        'Một lần tra cứu tốn O(1) trong trường hợp xấu nhất',
        'Nó dùng O(n) bộ nhớ',
        'Chèn một khoá mới luôn tốn O(1)',
        'Mỗi lần rút ở tầng hai không gây va chạm với xác suất trên 1/2',
      ],
      answers: [0, 1, 3],
      hints: [
        'Bảng được dựng cho một tập khoá cố định. Một khoá mới có thể gây ra điều gì cho bucket của nó?',
      ],
      solution:
        'Tra cứu là hai lần hash và một phép so sánh, và bộ nhớ là n + Σ nⱼ² < 5n. Một khoá mới có thể va chạm trong bucket của nó và buộc phải dựng lại bucket đó, thậm chí cả bảng, nên perfect hashing hợp với tập khoá tĩnh.',
    },
  ],
  nextTeaser:
    'Bài sau là lí thuyết trò chơi: Nim và Sprague-Grundy, cách biết ai thắng chỉ bằng phép xor.',
};
