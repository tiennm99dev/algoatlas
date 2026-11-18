/** @typedef {import('$lib/algo-engine/combinatorics.js').PascalFrame} PascalFrame */
/** @typedef {import('$lib/algo-engine/combinatorics.js').LucasFrame} LucasFrame */
/** @typedef {import('$lib/algo-engine/combinatorics.js').BracketFrame} BracketFrame */

/** Numbers that mirror the widget use plain programming notation, with no grouping. */
/** @param {number} n */
const big = (n) => String(n);

export const vi = {
  slug: 'combinatorics',
  topic: 'number-theory',
  level: 'Trung bình',
  title: 'Tổ hợp: hệ số nhị thức và số Catalan',
  intro:
    'C(n, k), đọc là “tổ hợp chập k của n”, đếm số cách chọn k phần tử từ n phần tử. Tam giác Pascal dựng mọi C(n, k) chỉ bằng phép cộng, nên đáp số “mod p” trong bài thi không bao giờ cần đến số khổng lồ. Bảng giai thừa và định lí Lucas vươn tới những n vượt xa mọi bảng. Các số Catalan, rút ra thẳng từ tam giác, đếm dãy ngoặc cân bằng, cây nhị phân và nhiều hình dạng khác.',
  summary:
    'Dựng tam giác Pascal, tính tổ hợp chập k của n theo modulo một số nguyên tố bằng bảng giai thừa và định lí Lucas, rồi đếm dãy ngoặc cân bằng bằng số Catalan.',
  instruction:
    'Chọn một chế độ xem. Ở tam giác Pascal, chạy qua từng phép cộng, nhập modulo p để xem p chia hết những ô nào, rồi chọn một ô để đọc ý nghĩa của nó. Ở C(n, k) mod p, xem n và k tách thành các chữ số cơ số p. Ở dãy ngoặc Catalan, theo dõi đường đi lên xuống nhưng không bao giờ xuống dưới đường mốc, và xem mỗi dãy hoàn chỉnh biến thành một cây nhị phân.',
  modeLegend: 'Chế độ xem',
  modes: {
    pascal: 'Tam giác Pascal',
    lucas: 'C(n, k) mod p',
    brackets: 'Dãy ngoặc Catalan',
  },
  presetLabel: 'Ví dụ',
  fields: {
    rows: 'Hàng cuối N',
    p: 'Số nguyên tố p',
    modulus: 'Modulo p',
    n: 'n',
    k: 'k',
    pairs: 'Số cặp ngoặc n',
  },
  viewLegend: 'Ô hiển thị',
  views: { exact: 'Giá trị đúng', mod: 'Số dư mod p' },
  pascalPresets: {
    small: 'Hàng 0 đến 6, mod 2',
    sierpinski: 'Hàng 0 đến 15, mod 2',
    primeRow: 'Hàng 7, mod 7',
  },
  lucasPresets: {
    single: 'C(10, 3) mod 13',
    lucas: 'C(1000, 300) mod 13',
    zero: 'C(6, 2) mod 3',
    parity: 'C(12, 4) mod 2',
    huge: 'C(10⁹, 5·10⁸) mod 1009',
  },
  /** @param {number} max */
  rowsError: (max) => `Hàng cuối phải là số nguyên từ 0 đến ${max}.`,
  /** @param {number} max */
  modulusError: (max) => `Modulo phải là số nguyên từ 2 đến ${max}.`,
  /** @param {number} max */
  numberError: (max) => `n và k phải là số nguyên từ 0 đến ${big(max)}.`,
  /** @param {number} max */
  primeError: (max) => `p phải là số nguyên tố không lớn hơn ${big(max)}.`,
  /** @param {number} max */
  pairsError: (max) => `Số cặp ngoặc phải là số nguyên từ 0 đến ${max}.`,

  triangleTitle: 'C[n][k]: hàng là n, cột là k',
  /** @param {number} p */
  triangleAria: (p) => `Tam giác Pascal, đánh dấu các bội của ${p}.`,
  /**
   * @param {number} n @param {number} k @param {string} shown @param {string} state
   */
  cellLabel: (n, k, shown, state) =>
    `C(${n}, ${k})${shown ? ` hiện ${shown}` : ', chưa điền'}${state ? `, ${state}` : ''}`,
  cellStates: {
    current: 'đang điền',
    read: 'dùng cho phép cộng này',
    multiple: 'chia hết cho p',
    mirror: 'ô đối xứng với ô đang chọn',
    plain: '',
  },
  cellMarkers: { current: '▲', read: '+', multiple: '÷', mirror: '↔', plain: '' },
  legend: {
    current: '▲ Đang điền',
    read: '+ Dùng cho phép cộng này',
    multiple: '÷ Chia hết cho p',
    mirror: '↔ Đối xứng với ô đang chọn',
  },
  selectedTitle: 'Ô đang chọn',
  selectedEmpty: 'Chọn một ô đã điền để đọc nó đếm gì.',
  /**
   * @param {number} n @param {number} k @param {number} value
   */
  selectedCount: (n, k, value) =>
    `C(${n}, ${k}) = ${big(value)}: số cách chọn ${k} phần tử từ ${n} phần tử.`,
  /** @param {number} n @param {number} k */
  selectedMirror: (n, k) =>
    n === 2 * k
      ? 'Ô này nằm giữa hàng, nên đối xứng với chính nó.'
      : `Chọn ${k} phần tử cũng là bỏ ra ${n - k} phần tử, nên C(${n}, ${k}) = C(${n}, ${n - k}).`,
  /** @param {number} n @param {number} k @param {number} a @param {number} b */
  selectedSum: (n, k, a, b) =>
    `Phần tử thứ ${n} hoặc bị bỏ ra, hoặc được chọn: C(${n - 1}, ${k}) + C(${n - 1}, ${k - 1}) = ${big(a)} + ${big(b)}.`,
  selectedEdge: 'Cạnh của tam giác: chỉ có một cách chọn không gì cả hoặc chọn tất cả.',
  pascalStats: {
    additions: 'Số phép cộng',
    filled: 'Số ô đã điền',
    multiples: 'Chia hết cho p',
    rowSum: 'Tổng hàng đầy đủ cuối cùng',
  },
  /** @param {number} r @param {number} sum */
  rowSumNote: (r, sum) => `Hàng ${r}: 2^${r} = ${big(sum)}`,
  rowSumEmpty: '—',
  /** @param {PascalFrame} f @param {number} p @param {boolean} reduced */
  describePascal(f, p, reduced) {
    switch (f.kind) {
      case 'start':
        return `Dựng các hàng 0 đến ${f.N} của tam giác. Mỗi ô sẽ bằng tổng hai ô phía trên nó.`;
      case 'edge':
        return f.n === 0
          ? 'C(0, 0) = 1: có một cách chọn không gì từ không gì.'
          : `Hàng ${f.n} bắt đầu và kết thúc bằng 1, vì C(${f.n}, 0) = C(${f.n}, ${f.n}) = 1.`;
      case 'add': {
        const a = /** @type {number} */ (f.table[f.n - 1][f.k - 1]);
        const b = /** @type {number} */ (f.table[f.n - 1][f.k]);
        const sum = a + b;
        return reduced
          ? `C(${f.n}, ${f.k}) ≡ ${a % p} + ${b % p} ≡ ${sum % p} (mod ${p}). Lấy dư ngay khi cộng giữ mọi số nhỏ hơn p.`
          : `C(${f.n}, ${f.k}) = C(${f.n - 1}, ${f.k - 1}) + C(${f.n - 1}, ${f.k}) = ${a} + ${b} = ${sum}.`;
      }
      case 'done':
        return `Xong: ${f.filled} ô với ${f.additions} phép cộng, tổng cộng khoảng N²/2. Giờ hãy chọn một ô.`;
    }
  },

  digitsTitle: 'n và k ở cơ số p, chữ số thấp nhất trước',
  digitsEmpty: 'Chạy một bước để đọc chữ số đầu tiên.',
  digitsNone: 'n và k đều bằng 0, nên không có chữ số nào để đọc.',
  digitsHead: { pos: 'Chữ số', ni: 'nᵢ', ki: 'kᵢ', term: 'C(nᵢ, kᵢ) mod p' },
  /** @param {number} ni @param {number} ki */
  termZero: (ni, ki) => `0, vì ${ki} > ${ni}`,
  termWaiting: '…',
  currentRow: '→',
  formulaTitle: 'Bước này',
  /** @param {LucasFrame} f */
  lucasFormula(f) {
    if (f.kind === 'multiply') {
      return `fact[${f.ni}]·inv[${f.ki}]·inv[${f.ni - f.ki}] = ${f.factN}·${f.invK}·${f.invD} ≡ ${f.term}`;
    }
    if (f.kind === 'done' && f.result !== 0)
      return `C(${big(f.n0)}, ${big(f.k0)}) ≡ ${f.result} (mod ${f.p})`;
    if (f.result === 0 && f.kind !== 'start') {
      return `C(${big(f.n0)}, ${big(f.k0)}) ≡ 0 (mod ${f.p})`;
    }
    return `C(n, k) ≡ ∏ C(nᵢ, kᵢ) (mod ${f.p})`;
  },
  lucasStats: {
    result: 'Kết quả hiện tại',
    digits: 'Số chữ số đã đọc',
    table: 'Số phần tử mỗi bảng',
    pascal: 'Số ô cả tam giác cần',
  },
  /** @param {LucasFrame} f */
  describeLucas(f) {
    switch (f.kind) {
      case 'start':
        if (f.n0 === 0 && f.k0 === 0) {
          return `Tính C(0, 0) mod ${f.p}. n và k đều bằng 0, nên không có chữ số nào và kết quả giữ nguyên là 1.`;
        }
        if (f.k0 > f.n0) {
          return `Tính C(${big(f.n0)}, ${big(f.k0)}) mod ${f.p}. Vì k > n nên không có cách chọn nào, và các chữ số sẽ cho thấy điều đó: phải có một chữ số của k lớn hơn.`;
        }
        return f.n0 < f.p
          ? `Tính C(${big(f.n0)}, ${big(f.k0)}) mod ${f.p}. Vì n < p nên một chữ số là đủ: đây chính là công thức giai thừa thông thường, với phép chia thay bằng nghịch đảo.`
          : `Tính C(${big(f.n0)}, ${big(f.k0)}) mod ${f.p}. Ở đây n ≥ p, nên fact[n] sẽ bằng 0 và công thức thông thường không dùng được. Định lí Lucas làm việc trên các chữ số cơ số ${f.p} thay vào đó.`;
      case 'digit':
        return `Chữ số ${f.rows.length - 1}: nᵢ = ${big(f.n)} mod ${f.p} = ${f.ni} và kᵢ = ${big(f.k)} mod ${f.p} = ${f.ki}.`;
      case 'zero':
        return `kᵢ = ${f.ki} lớn hơn nᵢ = ${f.ni}, nên C(${f.ni}, ${f.ki}) = 0 và cả tích bằng 0.`;
      case 'multiply':
        return `C(${f.ni}, ${f.ki}) ≡ ${f.term}, nên result = ${f.before}·${f.term} mod ${f.p} = ${f.result}. Bỏ chữ số này khỏi n và k.`;
      case 'done':
        return f.rows.length === 0
          ? `C(0, 0) mod ${f.p} = 1, không có chữ số nào để đọc.`
          : `C(${big(f.n0)}, ${big(f.k0)}) mod ${f.p} = ${f.result}, từ ${f.rows.length} chữ số cơ số ${f.p}.`;
    }
  },

  pathTitle: 'Dãy ngoặc dưới dạng đường đi: ( đi lên, ) đi xuống',
  /** @param {string} prefix */
  pathAria: (prefix) => `Đường đi của dãy ngoặc ${prefix || 'chưa có ngoặc nào'}.`,
  baseline: 'đường mốc',
  emptyPrefix: 'rỗng',
  treeTitle: 'Dãy cuối cùng dưới dạng cây nhị phân, theo mẫu (trái)phải',
  treeAria: 'Cây nhị phân của dãy vừa in ra.',
  treeEmpty: 'Hoàn thành một dãy để xem cây của nó.',
  treeNone: 'Không có cặp ngoặc nào thì cây không có nút nào.',
  foundTitle: 'Các dãy đã in ra',
  foundEmpty: 'chưa có',
  catalanTitle: 'Các số Catalan C₀, C₁, C₂, …',
  bracketStats: {
    found: 'Số dãy tìm được',
    calls: 'Số lần gọi generate',
    all: 'Mọi cách sắp: C(2n, n)',
    bad: 'Xuống dưới mốc: C(2n, n + 1)',
    catalan: 'Cₙ = hiệu hai số trên',
  },
  /** @param {BracketFrame} f */
  describeBrackets(f) {
    switch (f.kind) {
      case 'start':
        return f.n === 0
          ? 'Không có cặp ngoặc nào thì dãy rỗng là dãy cân bằng duy nhất.'
          : `Liệt kê mọi dãy ngoặc cân bằng gồm ${f.n} cặp. Chỉ được thêm ) khi còn ( chưa đóng, nên đường đi không bao giờ xuống dưới đường mốc.`;
      case 'open':
        return `open = ${f.open - 1} < ${f.n}, nên thêm (. Tiền tố giờ là ${f.prefix}.`;
      case 'close':
        return f.dropped > 0
          ? `Lùi lại ${f.dropped} kí tự, rồi rẽ sang nhánh còn lại: thêm ). Tiền tố giờ là ${f.prefix}.`
          : `Đã dùng hết ${f.n} dấu ( và close = ${f.close - 1} < ${f.open}, nên thêm ). Tiền tố giờ là ${f.prefix}.`;
      case 'emit':
        return `Đã đặt đủ ${2 * f.n} dấu ngoặc: in ra ${f.prefix || 'dãy rỗng'}. Thế là được ${f.found.length} dãy.`;
      case 'done':
        return `Xong: ${f.found.length} dãy, đúng bằng Cₙ theo công thức.`;
    }
  },

  takeaways: [
    'C(n, k) = C(n − 1, k − 1) + C(n − 1, k): phần tử thứ n hoặc được chọn, hoặc bị bỏ ra. Chỉ một quy tắc ấy điền kín cả tam giác, và nó đúng theo mọi modulo, nguyên tố hay không.',
    'Với một giá trị mà n < p, dùng C(n, k) = n!·(k!)⁻¹·((n − k)!)⁻¹ mod p, với các nghịch đảo lấy từ định lí Fermat nhỏ. Phép chia không có nghĩa trực tiếp theo modulo p, nên nghịch đảo thay cho nó.',
    'Khi n ≥ p, n! chứa thừa số p và công thức hỏng. Định lí Lucas cứu nó: viết n và k ở cơ số p, khi đó C(n, k) ≡ ∏ C(nᵢ, kᵢ) (mod p).',
    'Cₙ = C(2n, n) − C(2n, n + 1) = C(2n, n)/(n + 1). Có C(2n, n) cách sắp, và lấy đối xứng phần hỏng của một đường đi xuống dưới đường mốc ghép mỗi cách hỏng với đúng một trong C(2n, n + 1) đường.',
    'Thử “Hàng 0 đến 15, mod 2” và chạy đến bước cuối: các ô không đánh dấu, tức các ô lẻ, vẽ nên tam giác Sierpiński. Rồi thử n = 3 ở chế độ Catalan và thấy cũng 5 dãy ấy dưới dạng cây nhị phân.',
  ],
  complexityHead: ['Phương pháp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Tam giác Pascal',
      'O(n²) thời gian, O(n²) bộ nhớ',
      'Mỗi ô một phép cộng. Chỉ giữ hàng cuối thì bộ nhớ còn O(n), và dùng được với mọi modulo.',
    ],
    [
      'Bảng giai thừa',
      'O(n) để dựng, O(1) mỗi truy vấn',
      'Hai mảng đến n, với một lần luỹ thừa Fermat cho nghịch đảo lớn nhất. Cần số nguyên tố p > n.',
    ],
    [
      'Định lí Lucas',
      'O(p) để dựng, O(log_p n) mỗi truy vấn',
      'Các bảng dưới p, rồi mỗi chữ số cơ số p một lần tra O(1). Cần p nguyên tố, và đủ nhỏ để dựng bảng.',
    ],
    [
      'Liệt kê dãy ngoặc cân bằng',
      'O(n·Cₙ) thời gian, O(n) ngăn xếp',
      'Mỗi dãy trong Cₙ dãy in ra gồm 2n kí tự, và quy tắc không bao giờ dẫn vào ngõ cụt.',
    ],
    [
      'Chỉ tính Cₙ',
      'O(n)',
      'Một hệ số nhị thức, hoặc O(n²) theo hệ thức truy hồi Cₙ₊₁ = Σ Cᵢ·Cₙ₋ᵢ, không cần phép chia.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Dùng tam giác, có bao nhiêu cách chọn 3 bài học trong 7 bài?',
      answer: 35,
      unit: 'cách',
      hints: ['Đặt hàng cuối là 7 và đọc hàng 7, cột 3 ở bước cuối.'],
      solution: 'C(7, 3) = C(6, 2) + C(6, 3) = 15 + 20 = 35.',
    },
    {
      type: 'number',
      prompt: 'Chọn ví dụ “C(1000, 300) mod 13” và chạy đến bước cuối. Kết quả là bao nhiêu?',
      answer: 10,
      hints: [
        'Ở cơ số 13, 1000 có các chữ số 5, 11, 12 và 300 có các chữ số 1, 10, 1, từ cao xuống thấp.',
        'Nhân C(5, 1), C(11, 10) và C(12, 1), lấy dư cho 13.',
      ],
      solution:
        'C(5, 1)·C(11, 10)·C(12, 1) = 5·11·12 = 660, mà 660 = 50·13 + 10, nên đáp số là 10.',
    },
    {
      type: 'choice',
      prompt: 'Không tính ra, C(12, 4) chẵn hay lẻ? Dùng định lí Lucas với p = 2.',
      options: ['Lẻ', 'Chẵn'],
      answer: 0,
      hints: [
        'Ở hệ nhị phân, 12 là 1100 và 4 là 0100. Có bit nào của k lớn hơn bit cùng vị trí của n không?',
      ],
      solution:
        'Không bit nào của 4 vượt bit tương ứng của 12, nên mọi thừa số bằng 1 và kết quả là 1 mod 2: số lẻ. Thật vậy, C(12, 4) = 495.',
    },
    {
      type: 'number',
      prompt: 'Tính C₄ bằng C(8, 4) − C(8, 5).',
      answer: 14,
      hints: ['Đọc hai giá trị ở hàng 8 của tam giác.'],
      solution:
        'C(8, 4) = 70 và C(8, 5) = 56, nên C₄ = 70 − 56 = 14. Chế độ Catalan với n = 4 liệt kê đủ cả 14 dãy.',
    },
    {
      type: 'multi',
      prompt: 'Những thứ nào được đếm bởi C₃ = 5?',
      options: [
        'Các dãy ngoặc cân bằng gồm 3 cặp',
        'Các cây nhị phân có 3 nút',
        'Các cách chia một ngũ giác lồi thành tam giác',
        'Các tập con của một tập 5 phần tử',
      ],
      answers: [0, 1, 2],
      hints: ['Đặt n = 3 ở chế độ Catalan và đếm. Một tập 5 phần tử có bao nhiêu tập con?'],
      solution:
        'Dãy ngoặc cân bằng, cây nhị phân có n nút và cách chia đa giác (n + 2) cạnh thành tam giác đều được đếm bởi Cₙ. Một tập 5 phần tử có 2⁵ = 32 tập con.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, mật mã khoá công khai và RSA, ghép ƯCLN, nghịch đảo và luỹ thừa nhanh thành một ổ khoá ai cũng khoá được nhưng chỉ bạn mở được.',
};
