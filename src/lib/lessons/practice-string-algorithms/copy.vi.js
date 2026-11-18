/** @typedef {import('$lib/algo-engine/practice-string-algorithms.js').MatcherId} MatcherId */
/** @typedef {import('$lib/algo-engine/practice-string-algorithms.js').SearchFrame} SearchFrame */
/** @typedef {import('$lib/algo-engine/practice-string-algorithms.js').StructureFrame} StructureFrame */

/** @type {Record<MatcherId, string>} */
const NAMES = {
  naive: 'Quét trực tiếp',
  rabin: 'Rabin-Karp',
  kmp: 'KMP',
  boyer: 'Boyer-Moore',
  z: 'Hàm Z',
};

/** @param {string[]} parts */
const list = (parts) =>
  parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} và ${parts.at(-1)}`;

/**
 * What the current step of one matcher did.
 * @param {SearchFrame} f
 * @param {MatcherId} id
 */
function stepText(f, id) {
  const r = f.runs[id];
  const { text: T, pattern: P } = f;
  const j = r.patternAt;
  const i = r.textAt;
  const verdict = r.equal ? 'bằng nhau' : 'khác nhau';
  /** @param {number} at */
  const inP = (at) => P[at] ?? '$';
  switch (r.kind) {
    case 'table':
      return `Bảng bước nhảy: chữ ${P[j]} xa nhất bên phải gặp đến giờ ở vị trí ${j}.`;
    case 'build':
      return `Chuẩn bị: so P[${j}] = ${inP(j)} với vị trí ${r.selfAt}, ${inP(r.selfAt)}: ${verdict}.`;
    case 'hash-letter':
      return j >= 0
        ? `P[${j}] = ${P[j]} được đưa vào giá trị băm của mẫu, giờ là ${r.hash}.`
        : `T[${i}] = ${T[i]} được đưa vào giá trị băm của cửa sổ đầu tiên, giờ là ${r.hash}.`;
    case 'hash-check':
      return r.equal
        ? `Cửa sổ ở vị trí ${r.shift} có giá trị băm ${r.hash}, bằng với P. Kiểm tra các kí tự của nó.`
        : `Cửa sổ ở vị trí ${r.shift} có giá trị băm ${r.hash}, còn P là ${r.target}. Không cần đọc kí tự nào.`;
    case 'verify':
      if (r.found >= 0) return `P[${j}] = ${P[j]} bằng T[${i}]: khớp thật ở vị trí ${r.found}.`;
      return r.spurious
        ? `P[${j}] = ${P[j]} khác T[${i}] = ${T[i]}: một lần khớp giả, hai giá trị băm va chạm.`
        : `P[${j}] = ${P[j]} bằng T[${i}]. Kiểm tra tiếp.`;
    case 'roll-out':
      return `T[${i}] = ${T[i]} rời khỏi cửa sổ.`;
    case 'roll-in':
      return `T[${i}] = ${T[i]} đi vào: cửa sổ ở vị trí ${r.shift} giờ có giá trị băm ${r.hash}.`;
    case 'compare':
      if (j === P.length) {
        return r.found >= 0
          ? `Dấu $ sau P chặn đoạn khớp tại T[${i}]. Cả ${P.length} kí tự đều trùng, nên P xuất hiện ở vị trí ${r.found}.`
          : `Dấu $ sau P chặn đoạn khớp tại T[${i}].`;
      }
      return r.found >= 0
        ? `So P[${j}] = ${P[j]} với T[${i}] = ${T[i]}: bằng nhau, và P xuất hiện ở vị trí ${r.found}.`
        : `So P[${j}] = ${P[j]} với T[${i}] = ${T[i]}: ${verdict}.`;
    default:
      return '';
  }
}

/** Where a centre of T sits in a text of n letters. @param {number} i @param {number} n */
const spot = (i, n) => {
  if (i % 2 === 1) return `chữ cái ${(i - 1) / 2}`;
  if (i === 0) return 'đầu xâu';
  return i === 2 * n ? 'cuối xâu' : `khe trước chữ cái ${i / 2}`;
};

/** The palindrome of the text a centre stands for. @param {string} s @param {number} c @param {number} r */
const palindrome = (s, c, r) => s.slice((c - r) / 2, (c - r) / 2 + r);

export const vi = {
  slug: 'practice-string-algorithms',
  topic: 'string-algorithms',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán xâu',
  intro:
    'Với bài toán xâu, chọn đúng công cụ là được thưởng. Thuật toán so khớp nào thắng còn tuỳ vào văn bản và mẫu, còn các câu hỏi về đoạn lặp và hình ảnh soi gương có những lời giải tuyến tính riêng. Ở đây bạn cho năm thuật toán so khớp chạy đua trên văn bản của mình, rồi đọc chính văn bản đó để tìm chu kì và các xâu đối xứng.',
  summary:
    'Cho năm thuật toán so khớp xâu chạy đua trên văn bản của bạn và đếm số bước, rồi đọc chính văn bản đó để tìm chu kì và các xâu đối xứng.',
  instruction:
    'Chọn một mẫu có sẵn hoặc gõ văn bản và mẫu, kết quả đếm cuối cùng hiện ra ngay. Quay về đầu và chạy từng bước để xem mỗi nhịp của mọi thuật toán, và bấm vào một hàng để theo dõi thuật toán đó. Chuyển sang Chu kì và xâu đối xứng để đọc văn bản theo cách khác. Dùng phần tương tác để trả lời các câu hỏi bên dưới.',
  modeLabel: 'Chế độ',
  modes: { search: 'Đua các thuật toán so khớp', structure: 'Chu kì và xâu đối xứng' },
  textLabel: 'Văn bản',
  patternLabel: 'Mẫu',
  presetLabel: 'Mẫu có sẵn',
  presets: {
    english: 'Văn bản thường ngày',
    repeats: 'Chỉ một chữ cái',
    tail: 'Chỉ khác chữ cái cuối',
    head: 'Chỉ khác chữ cái đầu',
    periodic: 'Một khối lặp lại',
    dna: 'Bảng chữ cái bốn chữ',
    palindrome: 'Một xâu đối xứng dài',
  },
  /** @param {number} maxText @param {number} maxPattern */
  fieldErrors: (maxText, maxPattern) => ({
    empty: 'Hãy gõ ít nhất một chữ cái.',
    format: 'Chỉ dùng chữ cái a đến z, không có dấu cách.',
    textLength: `Văn bản dài tối đa ${maxText} chữ cái.`,
    patternLength: `Mẫu dài tối đa ${maxPattern} chữ cái.`,
    patternTooLong: 'Mẫu không được dài hơn văn bản.',
  }),
  matchers: NAMES,
  raceTitle: 'Số bước đến giờ',
  raceHelp:
    'Một bước là một lần so kí tự, một lần đưa kí tự vào hàm băm, một lần so giá trị băm hoặc một lần ghi kí tự vào bảng bước nhảy. Mỗi nhịp tiêu một bước của mọi thuật toán chưa xong.',
  /** @param {string} name */
  watchLabel: (name) => `Theo dõi ${name}`,
  barPrep: 'chuẩn bị',
  barSearch: 'tìm kiếm',
  stats: {
    prep: 'chuẩn bị',
    search: 'tìm kiếm',
    matches: 'lần khớp',
    steps: 'Số bước',
    prepTotal: 'Chuẩn bị',
    found: 'Số lần khớp tìm được',
    spurious: 'Số lần khớp giả, Rabin-Karp',
    period: 'Chu kì nhỏ nhất',
    repeats: 'Số khối trọn vẹn',
    longest: 'Xâu đối xứng dài nhất',
    palindromes: 'Số xâu con đối xứng',
    piComparisons: 'Hàm tiền tố',
    tryPeriods: 'Thử từng chu kì',
    palComparisons: 'Manacher',
    tryCentres: 'Mở rộng từng tâm',
  },
  noValue: '—',
  finishedMark: '✓',
  finishedWord: 'đã xong',
  cheapestMark: '★',
  cheapestWord: 'tốn ít nhất',
  /** @param {string} name */
  boardTitle: (name) => `Những gì ${name} đọc`,
  boardRows: { text: 'T', pattern: 'P' },
  /** @param {string} name @param {string} text @param {string} pattern @param {number} shift */
  boardAria: (name, text, pattern, shift) =>
    shift < 0
      ? `${name} đang chuẩn bị mẫu ${pattern} trên văn bản ${text}.`
      : `${name} đặt mẫu ${pattern} ở vị trí ${shift} của văn bản ${text}.`,
  searchRoles: {
    equal: 'Bằng nhau',
    miss: 'Khác nhau',
    read: 'Đọc để băm hoặc để điền bảng bước nhảy',
    found: 'Nằm trong một lần khớp',
  },
  searchMarkers: { equal: '✓', miss: '✗', read: '#', found: '★' },
  matchesTitle: 'Khớp tại',
  matchesEmpty: 'chưa có',
  /** @param {string} row @param {number} c @param {string} value @param {string} state */
  cellLabel: (row, c, value, state) =>
    `${row} ${c}: ${value === '' ? 'trống' : value}${state ? `, ${state}` : ''}`,
  /**
   * @param {SearchFrame} f
   * @param {MatcherId} id  The matcher being watched.
   */
  describeSearch(f, id) {
    const r = f.runs[id];
    if (f.kind === 'start') {
      return `Cả năm thuật toán bắt đầu trên ${f.text.length} chữ cái với một mẫu dài ${f.pattern.length}. Đang theo dõi ${NAMES[id]}.`;
    }
    if (f.kind === 'done') {
      const best = f.runs[f.cheapest[0]].steps;
      return `Tốn ít nhất: ${list(f.cheapest.map((x) => NAMES[x]))} với ${best} bước. Mọi thuật toán đều tìm được ${r.matches.length} lần khớp.`;
    }
    if (r.finished) {
      return `${NAMES[id]} đã xong sau ${r.steps} bước. Các thuật toán còn lại vẫn chạy tiếp.`;
    }
    return stepText(f, id);
  },
  structureRows: { text: 'S', pi: 'π', odd: 'lẻ', even: 'chẵn' },
  /** @param {string} text */
  structureAria: (text) => `Hàm tiền tố và độ dài các xâu đối xứng của ${text}.`,
  structureTitle: 'Văn bản, các viền và các xâu đối xứng của nó',
  structureHelp:
    'π[i] là viền dài nhất của S[0..i]. “lẻ” là xâu đối xứng dài nhất có tâm ở chữ cái đó, “chẵn” là xâu dài nhất có tâm ở khe ngay trước nó.',
  structureRowNames: {
    text: 'Chữ cái',
    pi: 'Độ dài viền tại',
    odd: 'Xâu đối xứng tâm ở chữ cái',
    even: 'Xâu đối xứng tâm ở khe trước',
  },
  structureRoles: {
    now: 'Vừa tính',
    border: 'Một viền',
    period: 'Một chu kì',
    palindrome: 'Xâu đối xứng này',
    best: 'Dài nhất đến giờ',
  },
  structureMarkers: { now: '•', border: '=', period: '|', palindrome: '↔', best: '★' },
  costsTitle: 'Số lần so sánh, và chi phí của cách vét cạn',
  periodsTitle: 'Mọi chu kì',
  periodsEmpty: 'chưa biết',
  longestTitle: 'Xâu đối xứng dài nhất đến giờ',
  /** @param {StructureFrame} f */
  describeStructure(f) {
    const S = f.text;
    const n = S.length;
    switch (f.kind) {
      case 'start':
        return `Đọc ${S} hai lượt: lượt đầu tìm các viền và chu kì, lượt sau tìm các xâu đối xứng.`;
      case 'pi': {
        const border = f.value > 0 ? `“${S.slice(0, f.value)}”` : 'rỗng';
        const falls = f.falls > 0 ? ` sau ${f.falls} lần nhảy lùi` : '';
        return `π[${f.i}] = ${f.value}${falls}: viền dài nhất của S[0..${f.i}] là ${border}.`;
      }
      case 'period': {
        const head = `π[${n - 1}] = ${n - f.period}, nên chu kì nhỏ nhất là ${n} − ${n - f.period} = ${f.period}.`;
        if (f.repeats > 1) {
          return `${head} Nó chia hết ${n}, nên S là “${S.slice(0, f.period)}” lặp lại ${f.repeats} lần.`;
        }
        return f.period === n
          ? `${head} S không có viền, nên không lặp lại gì.`
          : `${head} Nó không chia hết ${n}, nên khối cuối bị cắt ngắn.`;
      }
      case 'centre': {
        const known = f.reused > 0 ? `biết sẵn ${f.reused} nhờ soi gương, ` : '';
        const spent = `${known}${f.read} lần so sánh`;
        return f.value > 0
          ? `Tâm ở ${spot(f.i, n)}: ${spent}, và xâu đối xứng là “${palindrome(S, f.i, f.value)}”, độ dài ${f.value}.`
          : `Tâm ở ${spot(f.i, n)}: ${spent}, và không có xâu đối xứng.`;
      }
      case 'done':
        return `Xâu đối xứng dài nhất: “${palindrome(S, f.bestCentre, f.best)}”, độ dài ${f.best}, trong tổng số ${f.palindromes} xâu con đối xứng. Chu kì nhỏ nhất: ${f.period}.`;
    }
  },
  /** @param {StructureFrame} f */
  bestText: (f) => (f.best > 0 ? palindrome(f.text, f.bestCentre, f.best) : ''),
  takeaways: [
    'Với văn bản thường ngày có nhiều chữ cái khác nhau, các bước nhảy của Boyer-Moore thắng: nó có thể đọc ít kí tự hơn độ dài văn bản, và mẫu càng dài thì nhảy càng xa.',
    'Với văn bản lặp nhiều, KMP và hàm Z là lựa chọn an toàn. Cả hai không bao giờ đi lùi trên văn bản, nên chỉ quanh 2n bước, trong khi quét trực tiếp hoặc Boyer-Moore chỉ dùng kí tự xấu có thể tới n · m.',
    'Rabin-Karp thua trong cuộc đua với một mẫu, vì nó phải trả giá cho giá trị băm của mọi cửa sổ. Nó có chỗ đứng khi giá trị băm làm được việc khác: nhiều mẫu cùng độ dài, hoặc so hai xâu con trong O(1).',
    'Hàm tiền tố trả lời các câu hỏi về chu kì: chu kì nhỏ nhất là n − π[n − 1], và văn bản là một khối lặp lại đúng khi chu kì đó chia hết n và nhỏ hơn n. Thuật toán Manacher cho tâm của mọi xâu đối xứng trong O(n).',
    'Chọn “Chỉ khác chữ cái cuối”, rồi “Chỉ khác chữ cái đầu”. Cùng những chữ cái đó mà Boyer-Moore và quét trực tiếp đổi chỗ cho nhau. Sau đó gõ một cặp của riêng bạn và đoán người thắng trước khi đọc kết quả.',
  ],
  complexityHead: ['Công cụ', 'Chi phí', 'Khi nào nên dùng'],
  complexity: [
    [
      'Quét trực tiếp',
      'O(n · m) xấu nhất, khoảng O(n) với văn bản ngẫu nhiên',
      'Văn bản ngắn và tìm kiếm một lần. Không cần chuẩn bị và không tốn thêm bộ nhớ.',
    ],
    [
      'Rabin-Karp',
      'O(n + m) kì vọng, O(n · m) xấu nhất',
      'Nhiều mẫu cùng độ dài, hoặc kiểm tra hai xâu con bằng nhau, nhờ các giá trị băm giữ trong một tập hoặc bảng.',
    ],
    [
      'KMP',
      'O(n + m), bộ nhớ O(m)',
      'Một mẫu với bảo đảm về thời gian, hoặc văn bản đến dần như một luồng dữ liệu, vì nó không bao giờ lùi lại.',
    ],
    [
      'Boyer-Moore, quy tắc kí tự xấu',
      'Khoảng O(n / m) khi tốt nhất, O(n · m) xấu nhất',
      'Mẫu dài trên bảng chữ cái lớn. Quy tắc hậu tố tốt của thuật toán đầy đủ, cùng cải tiến của Galil, đưa trường hợp xấu nhất về O(n + m).',
    ],
    [
      'Hàm Z',
      'O(n + m), bộ nhớ O(n + m)',
      'So mọi vị trí với một tiền tố, đồng thời cho một cách tìm kiếm ngắn gọn.',
    ],
    [
      'Aho-Corasick',
      'O(tổng độ dài mẫu + n + số lần báo)',
      'Nhiều mẫu cùng lúc, độ dài bất kì, trong một lượt qua văn bản.',
    ],
    [
      'Mảng hậu tố',
      'Dựng O(n log n) hoặc tốt hơn, mỗi truy vấn O(m log n)',
      'Một văn bản cố định với nhiều truy vấn đến sau.',
    ],
    ['Hàm tiền tố, cho chu kì', 'O(n)', 'Viền và chu kì: chu kì nhỏ nhất là n − π[n − 1].'],
    ['Manacher', 'O(n)', 'Xâu đối xứng dài nhất, hoặc đếm mọi xâu con đối xứng.'],
  ],
  nextTeaser:
    'Bài tiếp theo, ƯCLN và thuật toán Euclid mở rộng, mở đầu phần số học với cách tìm ước chung lớn nhất và các hệ số Bézout.',
  practiceTitle: 'Bài luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Chọn “Văn bản thường ngày”. Boyer-Moore tốn tổng cộng bao nhiêu bước?',
      answer: 15,
      unit: 'bước',
      hints: ['Kết quả đếm cuối cùng hiện ở hàng Boyer-Moore ngay khi nạp mẫu có sẵn.'],
      solution:
        'Nó tốn 4 bước để ghi các chữ cái của lazy vào bảng bước nhảy và 11 bước so kí tự: tổng cộng 15. Quét trực tiếp tốn 35, nên Boyer-Moore đọc chưa đến một phần ba văn bản 35 chữ cái.',
    },
    {
      type: 'number',
      prompt:
        'Vẫn với “Văn bản thường ngày”, Rabin-Karp chậm nhất. Nó gặp bao nhiêu lần khớp giả? Hàm băm ở đây dùng cơ số 31, modulo 101.',
      answer: 1,
      unit: 'lần',
      hints: [
        'Đọc ô “Số lần khớp giả”, rồi quay về đầu và theo dõi Rabin-Karp để tìm lần đó.',
        'Khớp giả là một cửa sổ có giá trị băm bằng giá trị băm của mẫu dù các kí tự khác nhau.',
      ],
      solution:
        'Một lần: cửa sổ kbro ở vị trí 7 có giá trị băm 27, bằng với lazy. So chữ cái đầu tiên là lộ ra ngay. Modulo nhỏ như 101 khiến chuyện này dễ xảy ra, còn trong thực tế modulo lớn hơn nhiều.',
    },
    {
      type: 'choice',
      prompt:
        'Chọn “Chỉ khác chữ cái cuối”, tìm aaab trong aaaa…. Thuật toán nào thắng, và vì sao?',
      options: [
        'Quét trực tiếp, vì nó không cần chuẩn bị',
        'Boyer-Moore, vì ở mỗi vị trí, lần so sánh đầu tiên của nó rơi đúng vào chữ cái khác biệt',
        'KMP, vì nó không bao giờ lùi lại trên văn bản',
        'Rabin-Karp, vì các giá trị băm không bao giờ bằng nhau',
      ],
      answer: 1,
      hints: ['So các hàng, rồi theo dõi Boyer-Moore vài nhịp.'],
      solution:
        'Boyer-Moore tốn 41 bước. Nó bắt đầu từ bên phải, nên chữ b thất bại ngay ở mọi vị trí. Quét trực tiếp lần nào cũng đọc ba chữ cái bằng nhau trước và tốn 148, còn KMP tốn 82.',
    },
    {
      type: 'choice',
      prompt: 'Giờ chọn “Chỉ khác chữ cái đầu”, tìm baaa trong aaaa…. Thuật toán nào về cuối?',
      options: ['Quét trực tiếp', 'Rabin-Karp', 'KMP', 'Boyer-Moore', 'Hàm Z'],
      answer: 3,
      hints: ['Boyer-Moore so từ bên phải. Nó gặp chữ b ở đâu trong baaa?'],
      solution:
        'Boyer-Moore tốn 152 bước: nó khớp ba chữ a rồi mới thất bại ở chữ b, và chỉ nhảy được 1 vì a nằm ở cuối baaa. Quét trực tiếp lần nào cũng thất bại ngay ở chữ cái đầu và thắng với 37. Chỉ dùng kí tự xấu thì trường hợp xấu nhất là O(n · m).',
    },
    {
      type: 'multi',
      prompt:
        'Chọn “Chỉ một chữ cái”, nơi mọi vị trí đều khớp. Những thuật toán nào vượt quá 100 bước?',
      options: ['Quét trực tiếp', 'Rabin-Karp', 'KMP', 'Boyer-Moore', 'Hàm Z'],
      answers: [0, 1, 3],
      hints: ['Đọc các tổng. Thuật toán nào phải đọc lại cùng những chữ cái ở mọi vị trí?'],
      solution:
        'Quét trực tiếp tốn 148 và Boyer-Moore 152, vì đọc đủ 4 chữ cái ở mỗi vị trí trong 37 vị trí. Rabin-Karp tốn 265, vì mỗi cửa sổ còn phải đi qua hàm băm. KMP (43) và hàm Z (83) dùng lại những gì đã biết, nên các lần khớp không làm chúng tốn thêm.',
    },
    {
      type: 'text',
      prompt:
        'Chọn “Một khối lặp lại”, 36 chữ cái của abc, tìm abcabc. Thuật toán nào tốn ít nhất?',
      accept: ['kmp', 'knuth-morris-pratt', 'knuth morris pratt'],
      hints: ['Tìm dấu ★ ở bước cuối.'],
      solution:
        'KMP, với 41 bước: 5 bước dựng π và đúng 36 bước để đọc văn bản một lần. Sau mỗi lần khớp, nó lùi về π[5] = 3 thay vì bắt đầu lại. Boyer-Moore tốn 72 và quét trực tiếp 86.',
    },
    {
      type: 'number',
      prompt:
        'Chuyển sang Chu kì và xâu đối xứng rồi gõ abaabaabaab. Chu kì nhỏ nhất của văn bản này là bao nhiêu?',
      answer: 3,
      hints: [
        'Nhảy đến bước cuối và đọc ô “Chu kì nhỏ nhất”.',
        'Công thức là n − π[n − 1], và ở đây π[10] = 8.',
      ],
      solution:
        'n − π[n − 1] = 11 − 8 = 3: aba lặp lại. Vì 3 không chia hết 11, khối cuối bị cắt ngắn và ô “Số khối trọn vẹn” ghi 1. Thêm một chữ a nữa thì văn bản thành aba lặp lại bốn lần.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Một xâu đối xứng dài” và giữ chế độ Chu kì và xâu đối xứng. Xâu đối xứng dài nhất dài bao nhiêu?',
      answer: 10,
      unit: 'chữ cái',
      hints: ['Đọc ô “Xâu đối xứng dài nhất”. Đáp án có độ dài chẵn.'],
      solution:
        'geeksskeeg có 10 chữ cái. Tâm của nó là khe giữa hai chữ s, đó là lí do thuật toán Manacher chèn # quanh mọi chữ cái: khi đó xâu đối xứng độ dài lẻ hay chẵn đều có tâm.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Chỉ một chữ cái” ở chế độ Chu kì và xâu đối xứng. Mở rộng từng tâm từ 0 tốn bao nhiêu lần so sánh, trong khi thuật toán Manacher tốn 79?',
      answer: 1600,
      unit: 'lần',
      hints: ['Đọc dòng “Mở rộng từng tâm” trong phần số lần so sánh.'],
      solution:
        'Mở rộng mọi tâm tốn 1600 lần, tăng theo n². Thuật toán Manacher tốn 79, vì bên trong xâu đối xứng đã biết, vị trí soi gương cho mỗi bán kính mới gần như miễn phí.',
    },
    {
      type: 'number',
      prompt:
        'Gõ aaaa ở chế độ Chu kì và xâu đối xứng. Có bao nhiêu xâu con của nó là xâu đối xứng, tính riêng từng vị trí?',
      answer: 10,
      unit: 'xâu con',
      hints: [
        'Đọc ô “Số xâu con đối xứng”.',
        'Mọi xâu con của aaaa đều đối xứng. 4 chữ cái có bao nhiêu xâu con?',
      ],
      solution:
        'Bốn xâu dài 1, ba xâu dài 2, hai xâu dài 3 và một xâu dài 4: 10. Mỗi tâm có bán kính P đóng góp ⌈P / 2⌉ xâu đối xứng, nên một lần chạy Manacher đếm được tất cả.',
    },
    {
      type: 'choice',
      prompt:
        'Bạn phải quét một tệp nhật kí dài để tìm 500 cụm từ bị cấm có độ dài khác nhau, tất cả trong một lượt. Công cụ nào phù hợp nhất?',
      options: [
        'Boyer-Moore, chạy một lần cho mỗi cụm từ',
        'Rabin-Karp',
        'Aho-Corasick',
        'Manacher',
      ],
      answer: 2,
      hints: [
        'Một ô-tô-mát có thể theo dõi mọi cụm từ cùng lúc. Bài nào đã dựng một ô-tô-mát như vậy?',
      ],
      solution:
        'Aho-Corasick dựng một trie của các cụm từ có liên kết thất bại và đọc tệp nhật kí một lần, trong O(tổng độ dài cụm từ + n + số lần báo). Chạy một thuật toán so khớp cho từng cụm từ tốn 500 lượt, còn cửa sổ của Rabin-Karp mỗi lần chỉ dùng được một độ dài.',
    },
  ],
};
