/** @typedef {import('$lib/algo-engine/fast-fourier-transform.js').FftFrame} FftFrame */
/** @typedef {import('$lib/algo-engine/fast-fourier-transform.js').Complex} Complex */

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/** @param {number} k */
const sup = (k) => [...String(k)].map((d) => SUP[Number(d)]).join('');
/** @param {number} k */
const sub = (k) => [...String(k)].map((d) => SUB[Number(d)]).join('');

/** Two decimals at most, and never −0. @param {number} x */
const r2 = (x) => {
  const v = Math.round(x * 100) / 100;
  return v === 0 ? 0 : v;
};

/** @param {number} v */
const signed = (v) => (v < 0 ? `−${-v}` : String(v));

/**
 * A complex number rounded to two decimals: 3, −1.41i, 0.71 − 0.71i.
 * @param {Complex} z
 */
const complex = (z) => {
  const re = r2(z.re);
  const im = r2(z.im);
  if (im === 0) return signed(re);
  const imText = Math.abs(im) === 1 ? 'i' : `${Math.abs(im)}i`;
  if (re === 0) return im < 0 ? `−${imText}` : imText;
  return `${signed(re)} ${im < 0 ? '−' : '+'} ${imText}`;
};

/**
 * A polynomial from its coefficients, constant term first: 3 + 7x + 2x².
 * @param {number[]} coeffs
 */
const poly = (coeffs) => {
  const terms = coeffs
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c !== 0)
    .map(({ c, i }) => {
      const size = Math.abs(c) === 1 && i > 0 ? '' : String(Math.abs(c));
      const power = i === 0 ? '' : i === 1 ? 'x' : `x${sup(i)}`;
      return { neg: c < 0, text: `${size}${power}` };
    });
  if (terms.length === 0) return '0';
  return terms
    .map((t, j) => (j === 0 ? `${t.neg ? '−' : ''}${t.text}` : `${t.neg ? '−' : '+'} ${t.text}`))
    .join(' ');
};

/** A polynomial’s value at x = 10, exact however long it is. @param {number[]} coeffs */
const atTen = (coeffs) =>
  coeffs
    .reduceRight((acc, c) => acc * 10n + BigInt(c), 0n)
    .toString()
    .replace('-', '−');

/** ω_n^k written with sub- and superscripts. @param {number} n @param {number} k */
const omega = (n, k) => `ω${sub(n)}${sup(k)}`;

export const vi = {
  slug: 'fast-fourier-transform',
  topic: 'algebraic-randomised',
  level: 'Nâng cao',
  title: 'Biến đổi Fourier nhanh',
  intro:
    'Nhân hai đa thức theo từng cặp hệ số tốn O(n²) bước. Một đa thức bậc nhỏ hơn n cũng được xác định hoàn toàn bởi giá trị của nó tại n điểm, và các giá trị thì nhân từng điểm một trong O(n). Biến đổi Fourier nhanh (FFT) chọn n điểm đó là n căn bậc n của đơn vị trong số phức, nhờ vậy nó tính giá trị đa thức trong O(n log n) bằng cách tách đa thức thành nửa chẵn và nửa lẻ; cùng mẹo đó chạy ngược lại để lấy lại các hệ số.',
  summary:
    'Nhân đa thức trong O(n log n): tính giá trị cả hai đa thức tại các căn của đơn vị bằng sơ đồ cánh bướm, nhân các giá trị, rồi biến đổi ngược.',
  instruction:
    'Nhập hệ số của A và B (hệ số tự do trước) hoặc chọn một ví dụ, rồi chạy từng bước. Sơ đồ cánh bướm điền mỗi giai đoạn một cột: mỗi cánh bướm đọc u và v, nhân v với hệ số xoay w trên đường tròn, rồi ghi u + w·v và u − w·v. Theo dõi ba lần biến đổi, rồi so sánh “Số cánh bướm” với “Số phép nhân kiểu thủ công” nhé.',
  fields: { a: 'Hệ số của A', b: 'Hệ số của B' },
  fieldHint: 'hệ số tự do trước',
  presetLabel: 'Ví dụ',
  presets: {
    linear: '(1 + 2x)(3 + x)',
    square: '(1 + x + x²)²',
    cubes: 'Hai đa thức bậc ba',
    carry: '123 × 456 theo từng chữ số',
    longest: 'Mỗi đa thức tám hạng tử (n = 16)',
  },
  /** @param {number} maxN @param {number} maxAbs */
  coeffError: (maxN, maxAbs) =>
    `Hãy nhập từ 1 đến ${maxN} số nguyên trong khoảng −${maxAbs} đến ${maxAbs}, ngăn cách bằng dấu phẩy hoặc dấu cách.`,
  polyTitle: 'Các đa thức',
  /** @param {string} name @param {number[]} coeffs */
  polyLine: (name, coeffs) => `${name}(x) = ${poly(coeffs)}`,
  phaseTitles: {
    a: 'Biến đổi A: giá trị tại các căn của đơn vị',
    b: 'Biến đổi B: giá trị tại các căn của đơn vị',
    inverse: 'Biến đổi ngược: trở lại hệ số',
    '': 'Sơ đồ cánh bướm',
  },
  /** @param {number} n */
  diagramAria: (n) => `Sơ đồ cánh bướm với n = ${n}`,
  inputColumn: 'Đầu vào',
  /** @param {number} s */
  stageColumn: (s) => `Giai đoạn ${s}, len ${2 ** s}`,
  /** @param {FftFrame['phase']} phase @param {number} src */
  inputName: (phase, src) =>
    phase === 'a' ? `a${sub(src)}` : phase === 'b' ? `b${sub(src)}` : `C(ω${sup(src)})`,
  /** @param {FftFrame['phase']} phase @param {number} row @param {boolean} scaled */
  outputName: (phase, row, scaled) =>
    phase === 'a'
      ? `A(ω${sup(row)})`
      : phase === 'b'
        ? `B(ω${sup(row)})`
        : scaled
          ? `c${sub(row)}`
          : `n·c${sub(row)}`,
  roles: { u: 'u', v: 'v', plus: 'u + t', minus: 'u − t' },
  /** @param {number} col @param {number} row @param {string} value @param {string} role */
  nodeLabel: (col, row, value, role) =>
    `Cột ${col}, hàng ${row}: ${value || 'chưa tính'}${role ? `, ${role}` : ''}`,
  legend: {
    input: 'u, v: đầu vào của cánh bướm',
    output: 'u ± t: đầu ra của cánh bướm',
    done: 'giá trị đã tính',
    empty: '… chưa tính',
  },
  circleTitle: 'Hệ số xoay trên đường tròn đơn vị',
  /** @param {number} n */
  circleAria: (n) => `Các căn bậc ${n} của đơn vị trên đường tròn đơn vị`,
  /** @param {number} n @param {number} k @param {Complex} w */
  twiddleText: (n, k, w) => `w = ${omega(n, k)} = ${complex(w)}`,
  noTwiddle: 'Bước này không có cánh bướm nào.',
  /** @param {number} n @param {number} k @param {boolean} hot */
  rootLabel: (n, k, hot) => `${omega(n, k)}${hot ? ', hệ số xoay đang dùng' : ''}`,
  valuesTitle: 'Giá trị tại các căn của đơn vị',
  valuesHead: { k: 'k', a: 'A(ωᵏ)', b: 'B(ωᵏ)', c: 'C(ωᵏ)' },
  pending: '…',
  resultTitle: 'Tích C(x) = A(x) · B(x)',
  resultPending: 'chạy đến bước cuối',
  stats: {
    n: 'n (số điểm)',
    butterflies: 'Số cánh bướm',
    naive: 'Số phép nhân kiểu thủ công',
    stage: 'Giai đoạn',
  },
  noStage: '—',
  complex,
  /** @param {FftFrame} f */
  describe(f) {
    const deg = f.a.length + f.b.length - 2;
    switch (f.kind) {
      case 'start':
        return `C = A · B có bậc ${deg}, nên có ${deg + 1} hệ số và cần ngần ấy điểm. Luỹ thừa nhỏ nhất của 2 đủ chứa chúng là n = ${f.n}. Kế hoạch: biến đổi A, biến đổi B, nhân các giá trị, rồi biến đổi ngược.`;
      case 'reorder':
        if (f.phase === 'inverse')
          return `Biến đổi ngược: chạy lại đúng các cánh bướm trên các giá trị C(ωᵏ), dùng ω⁻¹ thay cho ω. Trước hết xếp chúng theo thứ tự đảo bit.`;
        return `Biến đổi ${f.phase === 'a' ? 'A' : 'B'}: xếp ${f.n} hệ số của nó (thêm số 0 ở phía trên cho đủ) theo thứ tự đảo bit: ${f.order.join(', ')}. Sau đó mỗi giai đoạn gộp hai khối kề nhau thành khối dài gấp đôi.`;
      case 'butterfly': {
        const prev = f.columns[f.stage - 1];
        const cur = f.columns[f.stage];
        const u = /** @type {Complex} */ (prev[f.top]);
        const out = /** @type {Complex} */ (cur[f.top]);
        const t = { re: out.re - u.re, im: out.im - u.im };
        return `Giai đoạn ${f.stage}, len ${2 ** f.stage}: w = ${omega(f.n, f.root)} = ${complex(/** @type {Complex} */ (f.twiddle))}. u = ${complex(u)}, t = w · v = ${complex(t)}. Hàng ${f.top} nhận u + t = ${complex(out)}, hàng ${f.bottom} nhận u − t = ${complex(/** @type {Complex} */ (cur[f.bottom]))}.`;
      }
      case 'pointwise': {
        const fa = /** @type {Complex[]} */ (f.fa);
        const fb = /** @type {Complex[]} */ (f.fb);
        const pr = /** @type {Complex[]} */ (f.prod);
        return `Cả hai lần biến đổi đã xong. Nhân từng cặp giá trị: C(ωᵏ) = A(ωᵏ) · B(ωᵏ), chỉ ${f.n} phép nhân. Với k = 0 (x = 1): ${complex(fa[0])} · ${complex(fb[0])} = ${complex(pr[0])}.`;
      }
      case 'scale':
        return `Biến đổi ngược trả về n lần mỗi hệ số, nên chia mọi giá trị cho n = ${f.n}.`;
      case 'done': {
        const c = /** @type {number[]} */ (f.result);
        return `Làm tròn để bỏ sai số dấu phẩy động rất nhỏ: C(x) = ${poly(c)}. Kiểm tra tại x = 10: ${atTen(f.a)} × ${atTen(f.b)} = ${atTen(c)}.`;
      }
    }
  },
  poly,
  takeaways: [
    'Một đa thức bậc nhỏ hơn n được xác định bởi n hệ số của nó, hoặc tương đương, bởi giá trị tại n điểm phân biệt. Ở dạng giá trị, nhân hai đa thức chỉ là n phép nhân.',
    'FFT tính giá trị tại các căn bậc n của đơn vị ωᵏ = e^(2πik/n). Cách tách A(x) = A_chẵn(x²) + x·A_lẻ(x²) dùng được vì bình phương các căn bậc n chính là các căn bậc n/2, nên mỗi nửa là một bài toán cỡ một nửa.',
    'Mỗi cánh bướm ghép một cặp: y[top] = u + w·v và y[bottom] = u − w·v, dựa vào ωᵏ⁺ⁿᐟ² = −ωᵏ. Có log₂ n giai đoạn, mỗi giai đoạn n/2 cánh bướm: O(n log n).',
    'Biến đổi ngược chính là thuật toán đó với ω⁻¹ và một phép chia cho n ở cuối. Ba lần biến đổi cùng n phép nhân từng điểm cho ta tích trong O(n log n), so với O(n²) của cách nhân thủ công.',
    'Thử “123 × 456 theo từng chữ số”: các chữ số là hệ số, và phép kiểm tra tại x = 10 chính là phép nhân thông thường. Các thư viện số lớn nhân những số nguyên khổng lồ theo cách này, rồi xử lí phần nhớ.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Nhân thủ công', 'O(n²)', 'Mọi hệ số của A gặp mọi hệ số của B.'],
    [
      'Một lần FFT',
      'O(n log n)',
      'log₂ n giai đoạn, mỗi giai đoạn n/2 cánh bướm, mỗi cánh bướm một phép nhân số phức và hai phép cộng.',
    ],
    ['Nhân từng điểm', 'O(n)', 'Một phép nhân cho mỗi căn của đơn vị.'],
    ['Cả phép nhân', 'O(n log n)', 'Hai lần biến đổi xuôi, n phép nhân và một lần biến đổi ngược.'],
    ['Bộ nhớ', 'O(n)', 'Bản lặp làm tại chỗ trên một mảng n giá trị.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'A có 5 hệ số và B có 6 hệ số. FFT dùng n bằng bao nhiêu cho tích của chúng?',
      answer: 16,
      hints: ['Tích có 5 + 6 − 1 hệ số; n là luỹ thừa nhỏ nhất của 2 không nhỏ hơn số đó.'],
      solution: 'C có 10 hệ số, và luỹ thừa nhỏ nhất của 2 không nhỏ hơn 10 là 16.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Hai đa thức bậc ba” rồi chạy đến bước cuối. Cả phép nhân cần bao nhiêu cánh bướm?',
      answer: 36,
      unit: 'cánh bướm',
      hints: [
        'n = 8, nên mỗi lần biến đổi có log₂ 8 = 3 giai đoạn, mỗi giai đoạn 8/2 = 4 cánh bướm. Có ba lần biến đổi.',
      ],
      solution:
        'Mỗi lần biến đổi làm 3 · 4 = 12 cánh bướm, và A, B cùng lần biến đổi ngược cho 36.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao FFT tính giá trị tại các căn của đơn vị thay vì tại 0, 1, 2, …, n − 1?',
      options: [
        'Bình phương của chúng là các căn bậc n/2 của đơn vị, nên mỗi bài toán cỡ một nửa chỉ cần một nửa số điểm',
        'Không thể dùng số thực làm điểm tính giá trị',
        'Căn của đơn vị làm mọi giá trị đều là số nguyên',
        'Chúng giúp khỏi phải biến đổi ngược',
      ],
      answer: 0,
      hints: ['Nghĩ xem cách tách chẵn–lẻ A_chẵn(x²) + x·A_lẻ(x²) cần điều gì.'],
      solution:
        'Cách tách tính A_chẵn và A_lẻ tại bình phương của các điểm. Với các căn bậc n của đơn vị, những bình phương đó chỉ gồm n/2 giá trị phân biệt, chính là các căn bậc n/2, nên đệ quy chia đôi gọn gàng. Các điểm thường như 0 … n − 1 có tới n bình phương phân biệt.',
    },
    {
      type: 'text',
      prompt:
        'Chọn “(1 + 2x)(3 + x)” rồi chạy đến bước cuối. C(x) bằng gì? Viết theo dạng 1 + 2x + 3x^2.',
      accept: ['3 + 7x + 2x^2', '3+7x+2x²', '2x^2 + 7x + 3'],
      hints: ['Nhân tay để kiểm tra: 1·3, rồi 1·x + 2x·3, rồi 2x·x.'],
      solution: '(1 + 2x)(3 + x) = 3 + x + 6x + 2x² = 3 + 7x + 2x².',
    },
    {
      type: 'multi',
      prompt: 'Những khẳng định nào về ω₈ = e^(2πi/8) là đúng?',
      options: ['ω₈⁴ = −1', 'ω₈² = i', '(ω₈)² = ω₄', 'ω₈⁸ = 0'],
      answers: [0, 1, 2],
      hints: ['Mỗi lần nâng luỹ thừa, ω₈ quay thêm 45°. Nhìn đường tròn bên cạnh sơ đồ với n = 8.'],
      solution:
        'ω₈⁴ là nửa vòng, bằng −1; ω₈² là một phần tư vòng, bằng i; và bình phương một căn bậc 8 cho một căn bậc 4, nên ω₈² = ω₄. ω₈⁸ là trọn một vòng, bằng 1 chứ không phải 0.',
    },
  ],
  nextTeaser:
    'Bài sau là phép toán ma trận: phân tích LUP, cách giải hệ phương trình tuyến tính bằng khử Gauss có đổi hàng.',
};
