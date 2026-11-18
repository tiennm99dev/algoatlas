/** @typedef {import('$lib/algo-engine/rsa-cryptography.js').RsaFrame} RsaFrame */
/** @typedef {import('$lib/algo-engine/rsa-cryptography.js').AttackFrame} AttackFrame */

/** Numbers that mirror the widget use plain programming notation, with no grouping. */
/** @param {number} n */
const big = (n) => String(n);

export const vi = {
  slug: 'rsa-cryptography',
  topic: 'number-theory',
  level: 'Trung bình',
  title: 'Mật mã khoá công khai và RSA',
  intro:
    'Trong mật mã khoá công khai, ai cũng có thể khoá một thông điệp bằng chiếc khoá em công bố, nhưng chỉ khoá bí mật của em mới mở được. RSA dựng ổ khoá ấy từ hai sự thật: tính luỹ thừa theo modulo n thì nhanh, còn tách n = p·q ra thừa số thì khó. Bài này chạy toàn bộ cơ chế trên các số nguyên tố nhỏ, rồi để kẻ tấn công phá khoá, cho thấy kích thước khoá thật bảo vệ ta trước điều gì.',
  summary:
    'Tạo một khoá RSA đồ chơi từ hai số nguyên tố nhỏ, mã hoá và giải mã một số bằng luỹ thừa modulo, rồi đóng vai kẻ tấn công phân tích n để thấy vì sao khoá thật phải rất lớn.',
  instruction:
    'Chọn hai số nguyên tố p và q, số mũ e và thông điệp M, rồi chạy qua từng bước tạo khoá, mã hoá và giải mã. M phải trở về nguyên vẹn. Sau đó chuyển sang vai kẻ tấn công: chỉ dùng các giá trị công khai, thử chia cho đến khi n tách ra, rồi so sánh số lần chia thử với bảng kích thước khoá thật.',
  modeLegend: 'Chế độ xem',
  modes: { owner: 'Chủ khoá và người gửi', attacker: 'Kẻ tấn công' },
  presetLabel: 'Ví dụ',
  presets: {
    classic: 'p = 61, q = 53',
    tiny: 'p = 3, q = 11',
    multiple: 'M là bội của p',
    largest: 'Khoá đồ chơi lớn nhất',
  },
  fields: { p: 'Số nguyên tố p', q: 'Số nguyên tố q', e: 'Số mũ e', M: 'Thông điệp M' },
  /** @param {number} min @param {number} max */
  primeError: (min, max) => `p và q phải là hai số nguyên tố khác nhau, từ ${min} đến ${max}.`,
  /** @param {number} phi */
  exponentError: (phi) =>
    `e phải lớn hơn 1, nhỏ hơn φ = ${big(phi)}, và không có ước chung nào với φ.`,
  /** @param {number} n */
  messageError: (n) => `M phải là số nguyên từ 0 đến n − 1 = ${big(n - 1)}.`,
  /** @param {number} e */
  exponentChanged: (e) => `Hai số nguyên tố này không hợp với e cũ, nên e được đổi thành ${e}.`,
  /** @param {number} M */
  messageChanged: (M) => `M không còn nhỏ hơn n mới, nên được lấy dư thành ${M}.`,

  publicTitle: 'Công khai: ai cũng thấy',
  privateTitle: 'Bí mật: chỉ chủ khoá biết',
  messageTitle: 'Thông điệp',
  labels: {
    n: 'n',
    e: 'e',
    p: 'p',
    q: 'q',
    phi: 'φ',
    d: 'd',
    M: 'M',
    c: 'c',
    recovered: 'M′',
  },
  unknown: '?',
  justFound: '← mới',
  euclidTitle: 'Euclid mở rộng: mọi hàng giữ r ≡ t·e (mod φ)',
  euclidHead: { q: 'Thương', r: 'r', t: 't' },
  powerTitle: {
    encrypt: 'Mã hoá: các bit của e, đọc từ phải sang',
    decrypt: 'Giải mã: các bit của d, đọc từ phải sang',
  },
  /** @param {number} exponent */
  bitsAria: (exponent) => `Số mũ ${exponent} ở hệ nhị phân.`,
  /** @param {number} weight @param {number} bit @param {string} state */
  bitLabel: (weight, bit, state) =>
    `Bit có trọng số 2 mũ ${weight}: ${bit}${state ? `, ${state}` : ''}`,
  bitStates: { current: 'đang đọc', used: 'đã nhân vào', skipped: 'bỏ qua', waiting: '' },
  bitMarkers: { current: '▲', used: '✓', skipped: '·', waiting: '' },
  bitPointer: 'đọc',
  legend: {
    current: '▲ Đang đọc',
    used: '✓ Bằng 1: nhân vào',
    skipped: '· Bằng 0: bỏ qua',
  },
  stats: {
    multiplications: 'Số phép nhân modulo',
    check: 'e·d mod φ',
    match: 'M′ = M?',
    size: 'Số chữ số của n',
  },
  matchYes: '✓ đúng',
  matchNo: '✗ sai',
  matchWaiting: '—',
  checkWaiting: '—',
  /** @param {RsaFrame} f */
  describe(f) {
    const { p, q, e, M, n, phi, d, c, recovered, power } = f;
    switch (f.kind) {
      case 'start':
        return `Chủ khoá chọn hai số nguyên tố bí mật, p = ${p} và q = ${q}.`;
      case 'modulus':
        return `n = ${p}·${q} = ${big(/** @type {number} */ (n))}. Chỉ một phép nhân, và n có thể công khai.`;
      case 'phi':
        return `φ = (${p} − 1)·(${q} − 1) = ${big(/** @type {number} */ (phi))}. Nó đếm các số nhỏ hơn n không có ước chung với n, và muốn tính nó phải biết p và q.`;
      case 'public':
        return `Chọn e = ${e}: nó không có ước chung với φ, nên có nghịch đảo theo modulo φ.`;
      case 'euclid': {
        const row = f.euclid[f.euclid.length - 1];
        return f.euclid.length === 2
          ? `Chạy Euclid mở rộng với φ và e. Hai hàng đầu là r = φ với t = 0, và r = e với t = 1.`
          : `Thương ${row.q} cho r = ${row.r} và t = ${String(row.t).replace('-', '−')}.${row.r === 1 ? ' Số dư bằng 1, nên t là nghịch đảo của e.' : ''}`;
      }
      case 'private':
        return `d = ${big(/** @type {number} */ (d))}, là t cuối cùng lấy dư cho φ. Thử lại: e·d ≡ 1 (mod φ).`;
      case 'keys':
        return `Công bố (n, e) = (${big(/** @type {number} */ (n))}, ${e}). Giữ d, và huỷ hoặc giấu kín p, q và φ. Tạo khoá xong.`;
      case 'encrypt':
      case 'decrypt': {
        const step = /** @type {NonNullable<RsaFrame['power']>} */ (power);
        const name = f.kind === 'encrypt' ? 'e' : 'd';
        return step.multiplied
          ? `Bit ${step.k} của ${name} bằng 1: result = ${big(step.before)}·${big(step.x)} mod n = ${big(step.result)}. Rồi bình phương x.`
          : `Bit ${step.k} của ${name} bằng 0: giữ result = ${big(step.result)}, và bình phương x = ${big(step.x)}.`;
      }
      case 'cipher':
        return `Người gửi chỉ dùng khoá công khai: c = ${big(M)}^${e} mod n = ${big(/** @type {number} */ (c))}. Đây là thứ được gửi đi trên đường truyền.`;
      case 'recovered':
        return `Chủ khoá tính c^d mod n = ${big(/** @type {number} */ (recovered))}.`;
      case 'done':
        return `M′ = ${big(/** @type {number} */ (recovered))} bằng đúng M = ${big(M)}. Vì e·d ≡ 1 (mod φ), nâng lên luỹ thừa e rồi luỹ thừa d sẽ trả lại thông điệp.`;
    }
  },

  attackIntro: 'Kẻ tấn công chỉ thấy n, e và c, và phải tách được n.',
  attackTitle: 'Chia thử với n',
  /** @param {AttackFrame} f */
  attackLine: (f) =>
    f.candidate === 0 ? `n = ${big(f.n)}` : `${big(f.n)} mod ${f.candidate} = ${f.remainder}`,
  recovered: { p: 'p', q: 'q', phi: 'φ', d: 'd', M: 'M' },
  attackStats: {
    trials: 'Số lần chia thử',
    owner: 'Số phép nhân để tạo n',
  },
  /** @param {AttackFrame} f */
  describeAttack(f) {
    switch (f.kind) {
      case 'start':
        return `Công khai: n = ${big(f.n)}, e = ${f.e}, c = ${big(f.c)}. Không gì khác. Tìm một ước của n bằng cách thử chia lần lượt.`;
      case 'try':
        return f.remainder === 0
          ? `${big(f.n)} mod ${f.candidate} = 0. Cuối cùng cũng tìm ra một ước!`
          : `${big(f.n)} mod ${f.candidate} = ${f.remainder}, nên ${f.candidate} không phải ước.`;
      case 'found':
        return `p = ${f.p} và q = ${big(f.n)}/${f.p} = ${f.q}. Mất ${f.trials} lần chia thử, so với đúng một phép nhân của chủ khoá.`;
      case 'private':
        return `Biết p và q, ta có φ = ${big(/** @type {number} */ (f.phi))}, và Euclid mở rộng cho d = ${big(/** @type {number} */ (f.d))}: chính là khoá bí mật.`;
      case 'done':
        return `c^d mod n = ${big(/** @type {number} */ (f.M))}. Thông điệp đã bị đọc và khoá đã bị phá. Điều này chỉ làm được vì n quá nhỏ.`;
    }
  },
  scaleTitle: 'Chia thử tăng thế nào, với tốc độ một tỉ phép chia mỗi giây',
  scaleHead: { digits: 'Số chữ số của n', trials: 'Số lần thử', time: 'Thời gian' },
  /** @param {number} digits */
  scaleName: (digits) => {
    if (digits === 309) return '309 (RSA-1024)';
    if (digits === 617) return '617 (RSA-2048)';
    return String(digits);
  },
  /** @param {number} digits */
  scaleTrials: (digits) => `≈ 10^${Math.round(digits / 2 - Math.log10(2))}`,
  /** @param {number} digits @param {number} exponent */
  scaleTime: (digits, exponent) => {
    if (exponent >= 0) return `≈ 10^${Math.round(exponent)} năm`;
    const seconds = 10 ** (digits / 2 - Math.log10(2) - 9);
    return seconds < 1 ? 'dưới một giây' : `≈ ${Math.round(seconds)} giây`;
  },
  scaleNote:
    'Kẻ tấn công có những phương pháp tốt hơn chia thử nhiều. Sàng trường số tổng quát đã phân tích được số RSA-250 gồm 250 chữ số vào năm 2020, tốn khoảng 2700 năm tính toán của một lõi CPU. RSA-2048 vẫn nằm ngoài tầm với của nó rất xa, dù một máy tính lượng tử đủ lớn chạy thuật toán Shor sẽ phá được RSA.',

  takeaways: [
    'Tạo khoá: chọn hai số nguyên tố p và q, đặt n = p·q và φ = (p − 1)(q − 1), chọn e nguyên tố cùng nhau với φ, rồi tính d = e⁻¹ mod φ bằng Euclid mở rộng. Công bố (n, e) và giữ d.',
    'Mã hoá bằng c = M^e mod n và giải mã bằng M = c^d mod n. Luỹ thừa nhanh làm mỗi việc trong O(log e) hoặc O(log d) phép nhân, kể cả với số rất lớn.',
    'Nó đúng vì e·d = 1 + t·φ, và định lí Euler cho M^φ ≡ 1 (mod n) khi M không có ước chung với n. Định lí số dư Trung Hoa lo nốt các thông điệp còn lại.',
    'Độ an toàn dựa trên khoảng cách: nhân p với q chỉ là một bước, nhưng mọi cách cổ điển đã biết để tìm lại chúng từ một n lớn đều quá chậm. Ai phân tích được n thì tính được φ và d. RSA thật còn thêm phần đệm ngẫu nhiên (OAEP), vì không có nó thì hai thông điệp giống nhau cho hai bản mã giống nhau.',
    'Thử “Khoá đồ chơi lớn nhất”, rồi chuyển sang vai kẻ tấn công: đếm số lần chia thử, và đọc xem bảng tăng gấp mười lần thế nào sau mỗi hai chữ số của n.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Tạo n và φ', 'O(1) phép nhân', 'Mỗi số một phép nhân, bất kể số nguyên tố lớn đến đâu.'],
    ['Tính d', 'O(log φ)', 'Euclid mở rộng làm số dư giảm ít nhất một nửa sau mỗi hai phép chia.'],
    [
      'Mã hoá hoặc giải mã',
      'O(log e) hoặc O(log d) phép nhân',
      'Bình phương liên tiếp tốn một hoặc hai phép nhân cho mỗi bit của số mũ, và mọi số luôn nhỏ hơn n.',
    ],
    [
      'Phân tích n bằng chia thử',
      'O(√n), khoảng 10^(D/2) với D chữ số',
      'Đa thức theo n nhưng mũ theo độ dài của n, mà độ dài chính là thứ kích thước khoá đo.',
    ],
    ['Bộ nhớ', 'O(log n)', 'Chỉ vài số cỡ n. Trang này giữ lại các hàng để hiển thị.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Chọn ví dụ “p = 3, q = 11”, với e = 3. Số mũ bí mật d là bao nhiêu?',
      answer: 7,
      hints: ['φ = 2·10 = 20. Tìm d nhỏ hơn 20 sao cho 3·d ≡ 1 (mod 20).'],
      solution: '3·7 = 21 = 1·20 + 1, nên d = 7.',
    },
    {
      type: 'number',
      prompt: 'Dùng cùng khoá đó, n = 33 và e = 3, cho thông điệp M = 4. Bản mã c là bao nhiêu?',
      answer: 31,
      hints: ['Tính 4³ rồi lấy dư cho 33. Em có thể nhập M = 4 để kiểm tra.'],
      solution: '4³ = 64 = 1·33 + 31, nên c = 31. Giải mã 31⁷ mod 33 lại được 4.',
    },
    {
      type: 'number',
      prompt: 'Chọn ví dụ “p = 61, q = 53” với M = 65 và chạy đến bước có bản mã. c là bao nhiêu?',
      answer: 2790,
      hints: ['Chạy đến khi thẻ Công khai hiện c.'],
      solution: '65¹⁷ mod 3233 = 2790, và 2790²⁷⁵³ mod 3233 trả lại 65.',
    },
    {
      type: 'multi',
      prompt: 'Chủ khoá phải giữ bí mật những giá trị nào?',
      options: ['n', 'e', 'd', 'p', 'φ', 'c'],
      answers: [2, 3, 4],
      hints: ['Thứ gì giúp tính ra d thì phải giữ bí mật.'],
      solution:
        'd mở được thông điệp, còn p hoặc φ đều dẫn thẳng tới d. n và e là khoá công khai, còn c được gửi công khai.',
    },
    {
      type: 'number',
      prompt:
        'Ở vai kẻ tấn công với “p = 61, q = 53”, tính số 2 rồi đến các số lẻ, cần bao nhiêu lần chia thử để tách n?',
      answer: 27,
      unit: 'lần chia thử',
      hints: ['Kẻ tấn công dừng ở số nguyên tố nhỏ hơn, 53. Chạy đến bước cuối và đọc thẻ.'],
      solution: 'Thử 2, rồi 3, 5, …, 53, tức 26 số lẻ: tổng cộng 27 lần thử.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao không dùng được e = 4 khi φ = 20?',
      options: [
        'ƯCLN(4, 20) ≠ 1, nên 4 không có nghịch đảo theo modulo 20 và không có d',
        'e luôn phải là số nguyên tố',
        'e phải lớn hơn n',
        'e chẵn làm mã hoá quá chậm',
      ],
      answer: 0,
      hints: ['Euclid mở rộng cần điều gì để tìm được d?'],
      solution:
        'd chỉ tồn tại khi ƯCLN(e, φ) = 1. Nói chung e không cần là số nguyên tố (e = 9 dùng được khi φ = 20), nhưng phải nguyên tố cùng nhau với φ.',
    },
    {
      type: 'order',
      prompt: 'Xếp các bước tạo khoá theo đúng thứ tự.',
      items: [
        'Tính d = e⁻¹ mod φ',
        'Chọn hai số nguyên tố p và q',
        'Tính φ',
        'Chọn e',
        'Công bố (n, e)',
      ],
      answer: [1, 2, 3, 0, 4],
      hints: ['Mỗi bước dùng kết quả của bước trước.'],
      solution: 'p và q cho φ. φ giới hạn lựa chọn e. e và φ cho d. Chỉ khi đó mới công bố (n, e).',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, luyện tập: bài toán lí thuyết số, cho em tự tính từng tổng ước và từng phép đếm theo số dư.',
};
