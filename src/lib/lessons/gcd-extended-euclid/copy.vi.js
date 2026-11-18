/** @typedef {import('$lib/algo-engine/gcd-extended-euclid.js').GcdFrame} GcdFrame */

/** A signed term for an equation, so 240·(−9) reads with a typographic minus. */
/** @param {number} v */
const signed = (v) => (v < 0 ? `(−${-v})` : String(v));

/** Plain text for a number that may be negative. @param {number} v */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

export const vi = {
  slug: 'gcd-extended-euclid',
  topic: 'number-theory',
  level: 'Cơ bản',
  title: 'ƯCLN và thuật toán Euclid mở rộng',
  intro:
    'Ước chung lớn nhất (ƯCLN) của hai số là số lớn nhất chia hết cả hai. Thuật toán Euclid tìm nó chỉ bằng vài phép chia, vì ƯCLN(a, b) = ƯCLN(b, a mod b). Ghi chép thêm một chút, ta còn viết được ƯCLN dưới dạng a·x + b·y. Chính các hệ số này giúp giải phương trình nghiệm nguyên, và về sau cho ta nghịch đảo modulo.',
  summary:
    'Chạy thuật toán Euclid như việc cắt một hình chữ nhật thành các hình vuông, đọc ra hệ số Bézout và giải a·x + b·y = c trong tập số nguyên.',
  instruction:
    'Nhập a, b và c rồi chạy từng bước. Mỗi phép chia cắt vài hình vuông khỏi hình chữ nhật và thêm một hàng vào bảng. Để ý những hình vuông cuối cùng: cạnh của chúng chính là ƯCLN, và chúng lát kín được cả hình chữ nhật. So sánh ví dụ “Hai số Fibonacci liên tiếp” với “Số thứ nhất chia hết cho số thứ hai” để thấy lúc cần nhiều phép chia nhất và ít nhất.',
  fields: { a: 'a', b: 'b', c: 'c trong a·x + b·y = c' },
  presetLabel: 'Ví dụ',
  presets: {
    classic: '240 và 46',
    fibonacci: 'Hai số Fibonacci liên tiếp',
    tall: 'a nhỏ hơn b',
    multiple: 'Số thứ nhất chia hết cho số thứ hai',
    noSolution: 'Không có nghiệm nguyên',
  },
  /** @param {number} max */
  valueError: (max) => `a và b phải là số nguyên từ 1 đến ${max}.`,
  /** @param {number} max */
  cError: (max) => `c phải là số nguyên từ −${max} đến ${max}.`,
  boardTitle: 'Cắt hình chữ nhật thành các hình vuông',
  boardScroll: 'Hình chữ nhật, cuộn được khi quá cao',
  /** @param {number} a @param {number} b @param {number} count @param {number} left */
  boardAria: (a, b, count, left) =>
    `Hình chữ nhật rộng ${a}, cao ${b}, đã cắt ${count} hình vuông, phần còn lại có diện tích ${left}.`,
  /** @param {number} side @param {number} step @param {string} state */
  squareLabel: (side, step, state) =>
    `Hình vuông cạnh ${side}, cắt ở phép chia ${step}${state ? `, ${state}` : ''}`,
  /** @param {number} w @param {number} h */
  restLabel: (w, h) => `Phần còn phải cắt, ${w} × ${h}`,
  /** @param {number} w @param {number} h */
  restText: (w, h) => `${w} × ${h}`,
  states: { fresh: 'vừa cắt', earlier: 'cắt từ trước', final: 'cạnh bằng ƯCLN' },
  markers: { fresh: '+', earlier: '', final: '★', rest: '' },
  legend: {
    fresh: '+ Cắt ở phép chia này',
    earlier: 'Cắt từ trước',
    final: '★ Cạnh bằng ƯCLN',
    rest: 'Nét đứt: phần còn phải cắt',
  },
  /** Text for a table cell, so a negative number reads with a typographic minus. @param {number|string|null} v */
  cellText: (v) => (typeof v === 'number' ? num(v) : String(v ?? '')),
  tableTitle: 'Bảng tính: mọi hàng đều có r = s·a + t·b',
  tableHead: ['r', 'q', 's', 't'],
  /** @param {number} a @param {number} b */
  tableAria: (a, b) => `Bảng thuật toán Euclid mở rộng cho a = ${a} và b = ${b}.`,
  /** @param {string} head @param {number} row @param {string} value @param {string} state */
  tableCell: (head, row, value, state) =>
    `Hàng ${row}, ${head}: ${value || 'trống'}${state ? `, ${state}` : ''}`,
  cellStates: { used: 'dùng cho phép chia này', fresh: 'hàng mới', answer: 'kết quả' },
  cellMarkers: { used: '÷', fresh: '+', answer: '★' },
  stats: {
    divisions: 'Số phép chia',
    subtractions: 'Số hình vuông đã cắt (phép trừ)',
    g: 'ƯCLN(a, b)',
    bezout: 'Hệ số Bézout x, y',
  },
  /** @param {GcdFrame} f */
  bezoutValue: (f) => (f.g === null ? '—' : `${num(Number(f.x))}, ${num(Number(f.y))}`),
  equationTitle: 'Nghiệm nguyên',
  /** @param {GcdFrame} f */
  equation(f) {
    return `${f.a}x + ${f.b}y = ${num(f.c)}`;
  },
  /** @param {GcdFrame} f */
  solutionText(f) {
    if (f.solvable === null) return 'Đang chờ tìm ƯCLN.';
    if (!f.solvable) return `Vô nghiệm: ${f.g} không chia hết ${num(f.c)}.`;
    if (f.stepX === null) return `Một nghiệm: x = ${num(Number(f.x0))}, y = ${num(Number(f.y0))}.`;
    return `x = ${num(Number(f.x0))} + ${f.stepX}k, y = ${num(Number(f.y0))} − ${f.stepY}k. Nghiệm có x không âm nhỏ nhất: x = ${f.smallX}, y = ${num(Number(f.smallY))}.`;
  },
  /** @param {GcdFrame} f */
  describe(f) {
    const { a, b, c, g, x, y, q, r0, r1 } = f;
    switch (f.kind) {
      case 'start':
        return `Tìm ƯCLN(${a}, ${b}). Hàng 0 và hàng 1 ghi ${a} = 1·a + 0·b và ${b} = 0·a + 1·b.`;
      case 'divide':
        return q === 0
          ? `${r0} nhỏ hơn ${r1} nên q = 0: không cắt được hình vuông nào, phép chia này chỉ đổi chỗ hai số.`
          : `${r0} = ${q}·${r1} + ${r0 - q * r1}, nên ta cắt ${q} hình vuông cạnh ${r1}.`;
      case 'update': {
        const row = f.rows.at(-1);
        return `Hàng mới: r = ${r1}, s = ${num(Number(row?.s))}, t = ${num(Number(row?.t))}. Hàng này vẫn giữ r = s·a + t·b, và ${r1 === 0 ? 'r đã về 0' : `ƯCLN(${r0}, ${r1}) vẫn là ƯCLN ban đầu`}.`;
      }
      case 'gcd':
        return `Số dư bằng 0 nên ƯCLN(${a}, ${b}) = ${g}: các hình vuông cuối có cạnh ${g}. Hàng của nó cho ${a}·${signed(Number(x))} + ${b}·${signed(Number(y))} = ${g}.`;
      case 'none':
        return `Mọi a·x + b·y đều là bội của ${g}, còn ${num(c)} thì không. Vậy ${a}x + ${b}y = ${num(c)} không có nghiệm nguyên.`;
      case 'solve':
        return `${g} chia hết ${num(c)}, nên ta nhân đẳng thức Bézout với ${num(c / Number(g))}: x₀ = ${num(Number(f.x0))} và y₀ = ${num(Number(f.y0))}.`;
      case 'general':
        return `Cộng ${f.stepX} vào x và bớt ${f.stepY} ở y thì tổng không đổi, nên phương trình có vô số nghiệm. Một nghiệm là x = ${f.smallX}, y = ${num(Number(f.smallY))}.`;
      case 'done':
        return f.solvable
          ? `Xong: ƯCLN = ${g} sau ${f.divisions} phép chia, trong khi chỉ dùng phép trừ thì cần ${f.subtractions} lần. Phương trình có nghiệm.`
          : `Xong: ƯCLN = ${g} sau ${f.divisions} phép chia, trong khi chỉ dùng phép trừ thì cần ${f.subtractions} lần. Phương trình vô nghiệm.`;
    }
  },
  takeaways: [
    'ƯCLN(a, b) = ƯCLN(b, a mod b), vì cặp a, b và cặp b, a mod b có đúng cùng các ước chung. Lặp lại đến khi số dư bằng 0; số dư khác 0 cuối cùng là ƯCLN.',
    'Mỗi phép chia gộp nhiều phép trừ một lúc, nên thuật toán chạy nhanh: cứ hai phép chia thì số dư giảm ít nhất một nửa. Hai số Fibonacci liên tiếp là trường hợp xấu nhất.',
    'Bézout: ƯCLN luôn viết được dưới dạng a·x + b·y. Bảng tính tìm x và y bằng cách giữ r = s·a + t·b đúng ở mọi hàng.',
    'a·x + b·y = c có nghiệm nguyên khi và chỉ khi ƯCLN(a, b) chia hết c. Từ một nghiệm, mọi nghiệm khác là x₀ + k·b/g và y₀ − k·a/g.',
    'Thử a = 233, b = 144 rồi a = 252, b = 84. Đọc ô Số phép chia ở cả hai lần, và xem các hình vuông cuối lát kín từng hình chữ nhật ra sao.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thuật toán Euclid',
      'O(log min(a, b))',
      'Cứ sau hai phép chia, số lớn hơn giảm ít nhất một nửa, nên các số nhỏ đi rất nhanh.',
    ],
    [
      'Chỉ dùng phép trừ',
      'O(max(a, b) / g)',
      'Mỗi hình vuông là một phép trừ: với a = 999 và b = 1 là 999 hình vuông, so với 1 phép chia.',
    ],
    [
      'Euclid mở rộng',
      'O(log min(a, b))',
      'Vẫn những phép chia ấy, mỗi lần chỉ thêm một lượng việc cố định để tính s và t.',
    ],
    ['Bộ nhớ', 'O(1)', 'Chỉ cần giữ hai hàng. Trang này giữ hết các hàng để bạn đọc lại.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'ƯCLN(252, 105) bằng bao nhiêu?',
      answer: 21,
      hints: ['Chia: 252 = 2·105 + 42. Giờ tìm ƯCLN(105, 42).'],
      solution:
        '252 = 2·105 + 42, rồi 105 = 2·42 + 21, rồi 42 = 2·21 + 0. Số dư khác 0 cuối cùng là 21.',
    },
    {
      type: 'number',
      prompt:
        'Chọn ví dụ “240 và 46” rồi chạy đến bước cuối. Hình chữ nhật được chia thành bao nhiêu hình vuông?',
      answer: 13,
      unit: 'hình vuông',
      hints: ['Cộng cột q, hoặc đọc ô Số hình vuông ở bước cuối.'],
      solution:
        'Các thương là 5, 4, 1, 1 và 2, mỗi thương q cắt q hình vuông: 5 + 4 + 1 + 1 + 2 = 13.',
    },
    {
      type: 'number',
      prompt: 'ƯCLN(240, 46) = 2 và 240·(−9) + 46·y = 2. y bằng bao nhiêu?',
      answer: 47,
      hints: ['Tính 240·(−9) trước, rồi hỏi 46·y phải bằng bao nhiêu.'],
      solution:
        '240·(−9) = −2160, nên 46·y = 2162 và y = 47. Hàng có r = 2 trong bảng cũng cho kết quả này.',
    },
    {
      type: 'choice',
      prompt: 'Phương trình 6x + 9y = 7 có nghiệm nguyên không?',
      options: [
        'Có, vì 6 và 9 đều dương',
        'Không, vì ƯCLN(6, 9) = 3 không chia hết 7',
        'Có, nhưng chỉ khi x âm',
      ],
      answer: 1,
      hints: ['Dù x và y là gì, 6x + 9y luôn là bội của một số nào đó.'],
      solution:
        '6x và 9y đều là bội của 3, nên tổng của chúng cũng vậy. 7 không phải bội của 3, nên không có số nguyên nào thoả mãn.',
    },
    {
      type: 'number',
      prompt: 'Trong các nghiệm nguyên của 7x + 5y = 3, giá trị x không âm nhỏ nhất là bao nhiêu?',
      answer: 4,
      hints: [
        'Nhập a = 7, b = 5, c = 3 vào hình minh hoạ và chạy đến bước cuối, hoặc thử x = 0, 1, 2, … và tìm lúc phần còn lại là bội của 5.',
      ],
      solution:
        'x = 0, 1, 2, 3 để lại 3, −4, −11, −18, không số nào là bội của 5. x = 4 để lại 3 − 28 = −25 = 5·(−5), nên x = 4 và y = −5.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, số học đồng dư và luỹ thừa nhanh, dùng phép chia lấy dư để tính aᵉ mod m chỉ trong vài chục bước.',
};
