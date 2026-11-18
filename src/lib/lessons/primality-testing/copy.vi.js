/** @typedef {import('$lib/algo-engine/primality-testing.js').PrimalityFrame} PrimalityFrame */

/** Numbers that mirror the widget use plain programming notation, with no grouping. */
/** @param {number} v */
const big = (v) => String(v);

export const vi = {
  slug: 'primality-testing',
  topic: 'number-theory',
  level: 'Nâng cao',
  title: 'Kiểm tra số nguyên tố',
  intro:
    'Một số lớn có phải số nguyên tố không? Chia thử trả lời chắc chắn nhưng tốn khoảng √n bước. Phép thử Fermat kiểm tra a^(n−1) ≡ 1 (mod n) với vài cơ số; chỉ cần sai một lần là chứng minh được n là hợp số mà không cần tìm ra ước nào, thế nhưng các số Carmichael vẫn lọt qua. Miller-Rabin soi thêm các lần bình phương trên đường tới a^(n−1), lấp được kẽ hở ấy và dẫn tới phép thử được dùng trong thực tế.',
  summary:
    'Kiểm tra tính nguyên tố bằng chia thử, phép thử Fermat và Miller-Rabin, theo dõi nhân chứng và cơ số nói dối ở từng cơ số.',
  instruction:
    'Chọn phương pháp, một số và vài cơ số rồi chạy từng bước. Mỗi hàng của bảng là một cơ số, và hàng kết thúc bằng ✗ là một nhân chứng chứng minh n là hợp số. Chọn 561 với Fermat, nơi mọi cơ số đã chọn đều nói dối, rồi chuyển sang Miller-Rabin và xem cơ số 2 bắt được nó.',
  methodLabel: 'Phương pháp',
  methods: { trial: 'Chia thử', fermat: 'Fermat', miller: 'Miller-Rabin' },
  fields: { n: 'Số n', bases: 'Các cơ số a' },
  presetLabel: 'Ví dụ',
  presets: {
    smallPrime: 'Số nguyên tố: 97',
    semiprime: '9991 = 97 · 103',
    carmichael: 'Carmichael: 561',
    fools: 'Giả nguyên tố mạnh: 2047',
    billion: 'Số nguyên tố: 10⁹ + 7',
    mersenne: 'Số nguyên tố: 2³¹ − 1',
  },
  /** @param {number} max */
  nError: (max) => `n phải là số nguyên từ 2 đến ${big(max)}.`,
  /** @param {number} maxBase @param {number} maxBases */
  basesErrors: (maxBase, maxBases) => ({
    format: 'Nhập các cơ số là số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách.',
    range: `Mỗi cơ số phải từ 2 đến ${big(maxBase)}.`,
    count: `Dùng từ 1 đến ${maxBases} cơ số.`,
  }),
  roundsTitle: {
    fermat: 'Mỗi cơ số một hàng: a^(n − 1) mod n',
    miller: 'Mỗi cơ số một hàng: x, rồi mỗi lần lấy x²',
  },
  trialTitle: 'Chia thử đến √n',
  /** @param {PrimalityFrame} f */
  decomposition: (f) => `n − 1 = ${f.n - 1} = 2^${f.s} · ${f.d}`,
  decompositionWaiting: 'Đang chờ tách n − 1',
  baseHead: 'a',
  valuesHead: 'x',
  outcomeHead: 'Kết quả',
  outcomes: {
    pass: '✓ qua',
    witness: '✗ nhân chứng',
    skip: '– bỏ qua',
    running: '…',
  },
  minusOne: '= n − 1',
  rowsEmpty: 'Chưa thử cơ số nào.',
  skippedNote: 'Chia thử không dùng cơ số.',
  /** @param {number} d @param {number} limit */
  trialProgress: (d, limit) => `d = ${big(d)}, tối đa ${big(limit)}`,
  trialWaiting: 'Đang chờ bắt đầu',
  recentTitle: 'Các ước vừa thử',
  recentEmpty: 'chưa có',
  legend: {
    current: 'x vừa tính',
    good: 'x = 1 hoặc n − 1: qua',
    bad: 'Nhân chứng: n là hợp số',
  },
  stats: {
    verdict: 'Kết luận',
    cost: { trial: 'Số phép chia', fermat: 'Số phép nhân', miller: 'Số phép nhân' },
    tested: 'Số cơ số đã thử',
    liars: {
      fermat: 'Cơ số nói dối Fermat trong mọi cơ số',
      miller: 'Cơ số nói dối mạnh trong mọi cơ số',
    },
    divisor: 'Ước tìm được',
    limit: 'd lớn nhất cần thử',
  },
  verdicts: {
    pending: '…',
    prime: 'Số nguyên tố',
    composite: 'Hợp số',
    probable: 'Có lẽ là số nguyên tố',
    unknown: 'Chưa kiểm tra',
  },
  /** @param {number} liars @param {number} bases */
  liarValue: (liars, bases) => `${liars}/${bases}`,
  liarsNone: 'không áp dụng',
  /** @param {PrimalityFrame} f */
  describe(f) {
    const { n, d, s, limit, divisor, method } = f;
    const round = f.rounds.at(-1);
    const a = round?.a;
    const x = round?.values.at(-1);
    switch (f.kind) {
      case 'start':
        return method === 'trial'
          ? `${big(n)} có phải số nguyên tố không? Tìm một ước đến √n.`
          : method === 'fermat'
            ? `${big(n)} có phải số nguyên tố không? Nếu phải, mọi cơ số a đều cho a^${big(n - 1)} ≡ 1 (mod n).`
            : `${big(n)} có phải số nguyên tố không? Nếu phải, căn bậc hai duy nhất của 1 theo modulo n là 1 và n − 1.`;
      case 'small':
        return `${n} là 2 hoặc 3, đều là số nguyên tố.`;
      case 'even':
        return `${big(n)} là số chẵn lớn hơn 2, nên chia hết cho 2 và là hợp số.`;
      case 'try':
        return `Chưa có ước nào trong các số lẻ đến ${big(d)}. Tiếp tục khi d·d ≤ ${big(n)}.`;
      case 'divisor':
        return `${big(n)} = ${big(divisor)} · ${big(n / divisor)}, nên đó là hợp số. Mất ${f.divisions} lần thử.`;
      case 'decompose':
        return `Tách các thừa số 2: ${big(n - 1)} = 2^${s} · ${big(d)}, nên a^(n−1) có được từ a^${big(d)} sau ${s} lần bình phương.`;
      case 'skip':
        return `Cơ số ${a} nằm ngoài khoảng 2 đến n − 2 nên không cho biết gì. Bỏ qua.`;
      case 'power':
        return method === 'fermat'
          ? `Cơ số ${a}: a^${big(n - 1)} mod ${big(n)} = ${big(Number(x))}.`
          : `Cơ số ${a}: x = a^${big(d)} mod ${big(n)} = ${big(Number(x))}.`;
      case 'square':
        return `Bình phương: x = ${big(Number(x))}${x === 1 ? '. Giá trị x trước đó là một căn bậc hai của 1 khác ±1, điều mà số nguyên tố không thể có' : ''}.`;
      case 'pass':
        return method === 'fermat'
          ? `Cơ số ${a} cho 1, nên qua. Đó chưa phải chứng minh: một hợp số n cũng có thể qua.`
          : `Cơ số ${a} qua: ở đây x bằng ${x === 1 ? '1' : 'n − 1'}, đúng như khi n là số nguyên tố.`;
      case 'witness':
        return method === 'fermat'
          ? `a^${big(n - 1)} khác 1, nên ${a} là nhân chứng và ${big(n)} là hợp số, dù chưa tìm ra ước nào.`
          : `Sau mọi lần bình phương, x không bao giờ bằng n − 1, nên ${a} là nhân chứng và ${big(n)} là hợp số.`;
      case 'verdict':
        if (method === 'trial') {
          return `Không d nào đến ${big(limit)} chia hết ${big(n)}, nên nó là số nguyên tố, sau ${f.divisions} lần thử.`;
        }
        if (f.verdict === 'unknown')
          return 'Không có cơ số dùng được, nên phép thử không kết luận được gì.';
        return f.verdict === 'prime'
          ? `Các cơ số 2, 3, 5 và 7 đều qua, và điều đó đủ để kết luận mọi n nhỏ hơn 3\u00a0215\u00a0031\u00a0751: ${big(n)} là số nguyên tố.`
          : `Mọi cơ số đều qua, nên ${big(n)} có lẽ là số nguyên tố. Qua được là bằng chứng, chưa phải chứng minh.`;
      case 'done':
        return `Xong: ${this.verdicts[f.verdict ?? 'pending'].toLowerCase()}, dùng ${
          method === 'trial' ? `${f.divisions} phép chia` : `${f.multiplications} phép nhân`
        }.`;
    }
  },
  takeaways: [
    'Chia thử cho kết quả chắc chắn, và nếu có ước thì ước ấy phải xuất hiện trước √n. Với một số 19 chữ số, như vậy đã là hàng tỉ bước.',
    'Định lí Fermat nhỏ: với n nguyên tố và a không chia hết cho n, a^(n−1) ≡ 1 (mod n). Nếu điều này sai với một a nào đó thì a là nhân chứng, và n là hợp số dù chưa biết ước nào.',
    'Các số Carmichael như 561 qua phép thử Fermat với mọi cơ số nguyên tố cùng nhau với chúng, nên thêm vòng thử không phải lúc nào cũng có ích.',
    'Miller-Rabin thêm một kiểm tra: x² ≡ 1 mà x khác ±1 thì n là hợp số. Một hợp số n chỉ qua được với nhiều nhất một phần tư số cơ số, nên k vòng thử ngẫu nhiên sai với xác suất không quá 4⁻ᵏ.',
    'Chọn 561 với Miller-Rabin, đọc ô cơ số nói dối, rồi thử 2047 với cơ số 2 và 3 để thấy một cơ số bị lừa còn cơ số sau bắt được.',
  ],
  complexityHead: ['Phương pháp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Chia thử',
      'O(√n)',
      'Hợp số n có một ước không quá √n. Chính xác, nhưng bó tay với số 100 chữ số.',
    ],
    [
      'Fermat, k cơ số',
      'O(k log n)',
      'Mỗi cơ số một lần luỹ thừa nhanh, khoảng 2·log₂ n phép nhân. Số Carmichael có thể đánh lừa nó.',
    ],
    [
      'Miller-Rabin, k cơ số',
      'O(k log n)',
      'Mỗi cơ số một lần luỹ thừa nhanh, thêm tối đa s lần bình phương. Với cơ số ngẫu nhiên, xác suất sai không quá 4⁻ᵏ.',
    ],
    ['Bộ nhớ', 'O(1)', 'Chỉ cần x và các bộ đếm. Trang này giữ lại các hàng để bạn đọc.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Chạy chia thử với 9991. Ước đầu tiên tìm được là bao nhiêu?',
      answer: 97,
      hints: ['Chọn ví dụ “9991 = 97 · 103” với Chia thử và chạy đến bước cuối.'],
      solution:
        'Vòng lặp thử các số lẻ d từ 3. Không số nào chia hết 9991 cho tới d = 97, vì 9991 = 97 · 103 và cả hai thừa số đều là số nguyên tố.',
    },
    {
      type: 'number',
      prompt: 'Với n = 561, Miller-Rabin viết n − 1 = 2^s · d với d lẻ. s bằng bao nhiêu?',
      answer: 4,
      hints: ['Chia đôi 560 liên tục cho đến khi được số lẻ, và đếm số lần chia.'],
      solution: '560 → 280 → 140 → 70 → 35 là bốn lần chia đôi, nên 560 = 2⁴ · 35.',
    },
    {
      type: 'multi',
      prompt: 'Chạy phép thử Fermat với 561 = 3 · 11 · 17. Những cơ số nào là nhân chứng?',
      options: ['2', '3', '5', '7', '11'],
      answers: [1, 4],
      hints: ['Thử các cơ số trong hình minh hoạ, hoặc tự hỏi cơ số nào có ước chung với 561.'],
      solution:
        '561 là số Carmichael, nên mọi cơ số nguyên tố cùng nhau với nó đều qua. Chỉ 3 và 11, có ước chung với 561, là không qua.',
    },
    {
      type: 'choice',
      prompt: 'Phép thử Fermat cho biết 341 qua với cơ số 2. Điều đó chứng minh gì?',
      options: [
        '341 là số nguyên tố',
        '341 là hợp số',
        'Không gì chắc chắn: 341 = 11 · 31 vẫn qua cơ số 2, và cơ số 3 mới lộ ra',
      ],
      answer: 2,
      hints: ['Qua được chỉ là bằng chứng. Thử cơ số 3 trong hình minh hoạ.'],
      solution:
        'Qua được không bao giờ chứng minh tính nguyên tố. 341 = 11 · 31 là số giả nguyên tố Fermat với cơ số 2, và 3³⁴⁰ mod 341 = 56 làm nó lộ ra.',
    },
    {
      type: 'number',
      prompt: 'Chạy Miller-Rabin với 2047, cơ số 2 và 3. Cơ số nào là nhân chứng?',
      answer: 3,
      hints: ['Chọn ví dụ “Giả nguyên tố mạnh: 2047” và đọc hàng cuối.'],
      solution:
        '2047 = 23 · 89 là số giả nguyên tố mạnh với cơ số 2, nên cơ số 2 qua. Cơ số 3 là nhân chứng.',
    },
    {
      type: 'text',
      prompt: 'Chi phí của chia thử với n, viết bằng kí hiệu O lớn, là gì?',
      accept: ['O(√n)', 'O(sqrt(n))', 'O(sqrt n)', 'O(n^0.5)', '√n', 'sqrt(n)'],
      hints: ['Nếu n = p·q với p ≤ q, thì p lớn được đến đâu?'],
      solution: 'Hợp số n có một ước không quá √n, nên vòng lặp chạy nhiều nhất khoảng √n / 2 lần.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, tổ hợp: hệ số nhị thức và số Catalan, đếm số cách chọn bằng tam giác Pascal và đếm các dãy ngoặc cân bằng.',
};
