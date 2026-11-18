/** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').PracticeFrame} PracticeFrame */
/** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').ProblemId} ProblemId */
/** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').Technique} Technique */
/** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').Fit} Fit */

/** A number with a true minus sign. @param {number} v */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

/** @param {PracticeFrame} f @param {number} i */
const P = (f, i) => num(/** @type {number} */ (f.aux?.[i]));

/** @param {PracticeFrame} f @param {string} name */
const at = (f, name) => f.pointers.find((p) => p.name === name)?.index ?? -1;

/** @type {Record<Technique, string>} */
const techniqueNames = {
  pointers: 'Hai con trỏ',
  window: 'Cửa sổ trượt',
  prefix: 'Prefix sum',
  brute: 'Vét cạn',
};

/** Why each technique does or does not fit each problem. @type {Record<ProblemId, Record<Technique, string>>} */
const why = {
  'pair-sum': {
    pointers:
      'Mảng đã sắp xếp, nên tổng quá nhỏ chỉ có thể tăng bằng cách dời lo sang phải, còn tổng quá lớn thì dời hi sang trái. Mỗi lần kiểm tra loại một giá trị: nhiều nhất n − 1 lần kiểm tra.',
    window:
      'Hai giá trị của một cặp không nhất thiết đứng cạnh nhau, nên không có đoạn giá trị liên tiếp nào để trượt.',
    prefix: 'Prefix sum cộng các đoạn giá trị liên tiếp, còn một cặp chỉ là hai giá trị đơn lẻ.',
    brute: 'Thử mọi cặp i < j luôn tìm ra đáp án, nhưng cần đến n(n − 1)/2 lần kiểm tra.',
  },
  palindrome: {
    pointers:
      'Xâu đối xứng giống nhau khi soi gương qua điểm giữa, nên so hai đầu rồi tiến vào trong: n/2 lần so sánh và không cần thêm bộ nhớ.',
    window: 'Xâu đối xứng so sánh hai đầu đối diện, không phải một đoạn kí tự kề nhau.',
    prefix: 'Không có gì để cộng: phép kiểm tra chỉ so sánh kí tự.',
    brute:
      'Chép ngược xâu rồi so sánh thì đúng, nhưng tốn n lần sao chép, đến n lần so sánh và O(n) bộ nhớ thêm.',
  },
  'max-window': {
    pointers:
      'Hai con trỏ hội tụ bỏ đi từng đầu một, nhưng ở đây k giá trị phải luôn đi liền với nhau như một khối.',
    window:
      'Mọi cửa sổ đều dài k, và trượt đi một ô chỉ cộng một giá trị và trừ một giá trị: O(1) cho mỗi cửa sổ.',
    prefix:
      'Tổng mỗi cửa sổ là P[l + k] − P[l], nên cách này cũng là O(n), nhưng cần thêm một mảng n + 1 phần tử.',
    brute: 'Cộng lại mọi cửa sổ từ đầu thì đúng, nhưng tốn k phép cộng cho mỗi cửa sổ: O(n·k).',
  },
  'shortest-window': {
    pointers:
      'Bắt đầu ở hai đầu rồi tiến vào trong không thể tìm ra một đoạn ngắn nằm ở giữa; đoạn ấy cần cả hai đầu cùng đi sang phải.',
    window:
      'Với các giá trị ≥ 0, đoạn dài hơn không bao giờ có tổng nhỏ hơn, nên nới rộng bên phải cho đến khi tổng đạt S, rồi thu hẹp từ bên trái. Cả hai đầu chỉ đi sang phải: O(n).',
    prefix:
      'P cho tổng của một đoạn bất kì chỉ bằng một phép trừ, nhưng em vẫn phải thử O(n²) đoạn, nên không nhanh hơn vét cạn mà còn phải dựng P trước.',
    brute: 'Với mỗi điểm đầu, cộng dần các giá trị cho đến khi tổng đạt S: đúng, nhưng O(n²).',
  },
  'range-sums': {
    pointers: 'Các truy vấn nhảy khắp mảng; không có cặp đầu mút nào để dời lại gần nhau.',
    window:
      'Cửa sổ trượt tiến dần từng bước, còn truy vấn đến theo thứ tự bất kì và với độ dài bất kì.',
    prefix:
      'Dựng P một lần trong O(n); sau đó mỗi truy vấn chỉ là một phép trừ, P[r + 1] − P[l]: O(n + q).',
    brute: 'Cộng lại từng đoạn từ đầu thì đúng, nhưng một truy vấn có thể tốn n phép cộng: O(q·n).',
  },
};

export const vi = {
  slug: 'practice-arrays-strings',
  topic: 'arrays-strings',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán về mảng và xâu',
  intro:
    'Phần lớn bài toán về mảng và xâu trong chủ đề này được giải bằng một trong ba mẹo: hai con trỏ (two pointers) tiến lại gần nhau, cửa sổ trượt (sliding window) đi qua một đoạn giá trị liên tiếp, hoặc prefix sum (tổng tiền tố) trả lời tổng một đoạn bất kì bằng một phép trừ. Kĩ năng cần rèn là nhận ra bài toán đòi hỏi mẹo nào. Ở đây em chọn kĩ thuật, chạy nó trên đầu vào của bài, rồi so sánh chi phí với các kĩ thuật khác.',
  summary:
    'Chọn hai con trỏ, cửa sổ trượt, prefix sum hoặc vét cạn cho năm bài toán về mảng và xâu, xem lựa chọn của em chạy trên đầu vào, và so sánh số bước mỗi kĩ thuật cần.',
  instruction:
    'Chọn một bài toán, đọc đề, rồi chọn một kĩ thuật. Nếu nó phù hợp, chạy từng bước và theo dõi thẻ “Số bước”; nếu không, đọc lí do. Bảng bên phải cho biết số bước của mọi kĩ thuật trên cùng đầu vào. Sửa đầu vào để thấy chi phí thay đổi.',
  problemLabel: 'Bài toán',
  problems: /** @type {Record<ProblemId, string>} */ ({
    'pair-sum': 'Cặp có tổng T',
    palindrome: 'Kiểm tra xâu đối xứng',
    'max-window': 'Tổng lớn nhất của k số liền nhau',
    'shortest-window': 'Đoạn ngắn nhất có tổng ≥ S',
    'range-sums': 'Nhiều truy vấn tổng đoạn',
  }),
  statements: /** @type {Record<ProblemId, string>} */ ({
    'pair-sum': 'Mảng đã sắp xếp tăng dần. Tìm hai vị trí i < j sao cho a[i] + a[j] = T.',
    palindrome:
      'Xâu có đọc xuôi và đọc ngược giống nhau không? Kí tự được so sánh chính xác, nên A và a là khác nhau.',
    'max-window': 'Tìm tổng lớn nhất của k giá trị liên tiếp. Các giá trị có thể âm.',
    'shortest-window':
      'Mọi giá trị đều ≥ 0. Tìm độ dài của đoạn giá trị liên tiếp ngắn nhất có tổng ít nhất là S.',
    'range-sums': 'Trả lời mọi truy vấn (l, r) bằng tổng a[l] + … + a[r].',
  }),
  techniqueLegend: 'Kĩ thuật',
  techniques: /** @type {Record<Technique, string>} */ ({
    pointers: 'Con trỏ',
    window: 'Cửa sổ',
    prefix: 'Tiền tố',
    brute: 'Vét cạn',
  }),
  techniqueNames,
  fits: /** @type {Record<Fit, string>} */ ({
    best: 'Phù hợp nhất',
    works: 'Dùng được, nhưng chưa tốt nhất',
    no: 'Không phù hợp',
  }),
  fitMarks: /** @type {Record<Fit, string>} */ ({ best: '★', works: '✓', no: '✗' }),
  why,
  valuesLabels: /** @type {Record<ProblemId, string>} */ ({
    'pair-sum': 'Các giá trị đã sắp xếp',
    palindrome: 'Văn bản',
    'max-window': 'Các giá trị',
    'shortest-window': 'Các giá trị (≥ 0)',
    'range-sums': 'Các giá trị',
  }),
  targetLabels: /** @type {Partial<Record<ProblemId, string>>} */ ({
    'pair-sum': 'Đích T',
    'max-window': 'Cửa sổ k',
    'shortest-window': 'Đích S',
  }),
  queriesLabel: 'Các truy vấn (l r, …)',
  sampleButton: 'Đầu vào mẫu',
  valueErrors: {
    format: 'Hãy nhập các số nguyên, cách nhau bởi dấu phẩy hoặc dấu cách.',
    range: 'Mỗi giá trị phải nằm trong khoảng từ −99 đến 99.',
    count: 'Hãy nhập từ 1 đến 12 giá trị.',
    unsorted: 'Bài toán này cho mảng đã sắp xếp: hãy nhập các giá trị theo thứ tự tăng dần.',
    negative: 'Bài toán này cần mọi giá trị đều từ 0 trở lên.',
    short: 'Một cặp cần ít nhất hai giá trị.',
  },
  textErrors: {
    empty: 'Hãy nhập ít nhất một kí tự.',
    long: 'Hãy nhập nhiều nhất 16 kí tự.',
  },
  queryErrors: {
    format: 'Viết mỗi truy vấn thành hai chỉ số l r, các truy vấn cách nhau bởi dấu phẩy.',
    range: 'Mỗi truy vấn cần 0 ≤ l ≤ r < n, với n là số giá trị.',
    count: 'Hãy nhập từ 1 đến 6 truy vấn.',
  },
  /** @param {ProblemId} problem @param {number} n */
  targetError: (problem, n) =>
    problem === 'pair-sum'
      ? 'T phải là số nguyên từ −198 đến 198.'
      : problem === 'max-window'
        ? `k phải là số nguyên từ 1 đến ${n}, tức số giá trị đã nhập.`
        : 'S phải là số nguyên từ 1 đến 1188.',
  arrayTitle: 'Đầu vào',
  arrayAria: 'Đầu vào, chỉ số 0 trước',
  auxTitles: {
    prefix: 'Prefix sum P, P[i] = a[0] + … + a[i − 1]',
    reversed: 'Bản chép ngược r',
  },
  auxAria: {
    prefix: 'Prefix sum P, chỉ số 0 trước',
    reversed: 'Bản chép ngược r, chỉ số 0 trước',
  },
  spare: '·',
  /** @param {number} sum */
  rangeLabel: (sum) => `tổng ${num(sum)}`,
  bestLabel: 'tốt nhất',
  markers: { read: '◦', written: '+', answer: '✓', differ: '≠' },
  /** @param {number} i @param {number | string | null} v @param {string} state */
  cellLabel: (i, v, state) =>
    `Chỉ số ${i}: ${v === null ? 'chưa điền' : v}${state ? `, ${state}` : ''}`,
  states: {
    read: 'đang đọc',
    written: 'vừa ghi',
    inside: 'trong đoạn',
    answer: 'thuộc đáp án',
    differ: 'không khớp',
  },
  legend: {
    inside: 'Trong đoạn',
    read: '◦ Đang đọc',
    written: '+ Vừa ghi',
    answer: '✓ Đáp án',
    differ: '≠ Không khớp',
  },
  stats: {
    steps: 'Số bước',
    answer: 'Đáp án',
  },
  stepsNote:
    'Số bước: tính một cho mỗi tổng cặp hay phép so sánh kí tự được kiểm tra, mỗi phần tử được cộng hoặc trừ, mỗi ô P được dựng hoặc mỗi phép trừ hai ô, và mỗi kí tự được sao chép.',
  compareTitle: 'Số bước trên đầu vào này',
  compareHead: ['Kĩ thuật', 'Mức phù hợp', 'Số bước'],
  notApplicable: 'không phù hợp',
  noCode: 'Không có mã giả: kĩ thuật này không phù hợp với bài toán.',
  pending: '—',
  none: 'không có',
  yes: 'có',
  no: 'không',
  /** @param {PracticeFrame} f */
  answer(f) {
    switch (f.problem) {
      case 'pair-sum':
        if (f.verdict === null) return '—';
        return f.found ? `(${f.found[0]}, ${f.found[1]})` : 'không có';
      case 'palindrome':
        return f.verdict === null ? '—' : f.verdict ? 'có' : 'không';
      case 'max-window':
        return f.best === null ? '—' : num(f.best);
      case 'shortest-window':
        if (f.best !== null) return String(f.best);
        return f.kind === 'done' && f.fit !== 'no' ? 'không có' : '—';
      case 'range-sums':
        return f.answers.some((v) => v !== null)
          ? f.answers.map((v) => (v === null ? '?' : num(v))).join(', ')
          : '—';
    }
  },
  practiceTitle: 'Luyện tập',
  /** @param {PracticeFrame} f */
  describe(f) {
    const a = f.items;
    const T = num(f.target);
    if (f.fit === 'no')
      return `${techniqueNames[f.technique]} không phù hợp với bài toán này. ${why[f.problem][f.technique]} Hãy chọn kĩ thuật khác.`;
    const v = /** @type {number} */ (f.value);
    const [from, to] = f.range ?? [-1, -1];
    const better = f.improved ? ', tốt nhất mới' : '';
    switch (f.kind) {
      case 'start':
        switch (`${f.problem}/${f.technique}`) {
          case 'pair-sum/pointers':
            return `Tìm một cặp có tổng ${T}. Đặt lo ở giá trị đầu tiên và hi ở giá trị cuối cùng.`;
          case 'pair-sum/brute':
            return `Tìm một cặp có tổng ${T} bằng cách lần lượt thử mọi cặp i < j.`;
          case 'palindrome/pointers':
            return `“${a.join('')}” có phải xâu đối xứng không? Đặt lo ở kí tự đầu tiên và hi ở kí tự cuối cùng.`;
          case 'palindrome/brute':
            return `“${a.join('')}” có phải xâu đối xứng không? Trước hết chép ngược nó sang một xâu mới r.`;
          case 'max-window/window':
            return `Tổng lớn nhất của ${f.target} số liền nhau: cộng cửa sổ đầu tiên, rồi trượt nó.`;
          case 'max-window/prefix':
            return `Tổng lớn nhất của ${f.target} số liền nhau: dựng P trước; sau đó mỗi cửa sổ chỉ là một phép trừ.`;
          case 'max-window/brute':
            return `Tổng lớn nhất của ${f.target} số liền nhau: cộng lại mọi cửa sổ từ đầu.`;
          case 'shortest-window/window':
            return `Đoạn ngắn nhất có tổng ≥ ${T}: nới rộng cửa sổ bên phải, và thu hẹp từ bên trái khi tổng còn đủ lớn.`;
          case 'shortest-window/prefix':
            return `Đoạn ngắn nhất có tổng ≥ ${T}: dựng P, rồi với mỗi điểm đầu l thử các đoạn dài dần.`;
          case 'shortest-window/brute':
            return `Đoạn ngắn nhất có tổng ≥ ${T}: với mỗi điểm đầu l, cộng dần các giá trị cho đến khi tổng đạt ${T}.`;
          case 'range-sums/prefix':
            return `${f.queries.length} truy vấn: dựng P một lần, rồi trả lời mỗi truy vấn bằng một phép trừ.`;
          default:
            return `${f.queries.length} truy vấn: cộng lại từng đoạn từ đầu.`;
        }
      case 'check': {
        const [i, j] = f.reads;
        const sum = `a[${i}] + a[${j}] = ${num(Number(a[i]))} + ${num(Number(a[j]))} = ${num(v)}`;
        if (f.cmp === 0) return `${sum} = T. Đã tìm thấy cặp.`;
        if (f.technique === 'brute') return `${sum} ≠ ${T}: thử cặp tiếp theo.`;
        return f.cmp === -1
          ? `${sum} < ${T}: quá nhỏ. a[hi] là số ghép cặp lớn nhất còn lại của a[lo], nên dời lo sang phải.`
          : `${sum} > ${T}: quá lớn. a[lo] là số ghép cặp nhỏ nhất còn lại của a[hi], nên dời hi sang trái.`;
      }
      case 'compare': {
        const [i, j] = f.reads.length === 2 ? f.reads : [f.reads[0], f.reads[0]];
        const left = `s[${i}] = “${a[i]}”`;
        const right = f.technique === 'brute' ? `r[${i}] = “${f.aux?.[i]}”` : `s[${j}] = “${a[j]}”`;
        return f.cmp === 0
          ? `${left} và ${right} khớp nhau${f.technique === 'pointers' ? ': dời cả hai con trỏ vào trong.' : '.'}`
          : `${left} và ${right} khác nhau, nên xâu không đối xứng.`;
      }
      case 'copy': {
        const i = f.auxWrite;
        return `r[${i}] = s[${a.length - 1 - i}] = “${f.aux?.[i]}”.`;
      }
      case 'fill':
        return `Cộng a[${f.reads[0]}] = ${num(Number(a[f.reads[0]]))}: tổng của cửa sổ đầu tiên đến giờ là ${num(v)}.`;
      case 'first':
        return `Cửa sổ đầu tiên a[0..${f.target - 1}] có tổng ${num(v)}, tốt nhất đến giờ.`;
      case 'slide': {
        const [r, out] = f.reads;
        return `Trượt sang phải: cộng a[${r}] = ${num(Number(a[r]))} và trừ a[${out}] = ${num(Number(a[out]))}, nên tổng là ${num(v)}${better}.`;
      }
      case 'expand':
        return `Nới rộng bên phải: cộng a[${f.reads[0]}] = ${num(Number(a[f.reads[0]]))}, tổng ${num(v)}${f.cmp === 1 ? ` ≥ ${T}` : ` < ${T}, nới tiếp`}.`;
      case 'record':
        return `Tổng ${num(v)} ≥ ${T} với độ dài ${to - from}${f.improved ? ': ngắn nhất đến giờ' : `, không ngắn hơn ${f.best}`}. Giờ thu hẹp từ bên trái.`;
      case 'shrink':
        return `Trừ a[${f.reads[0]}] = ${num(Number(a[f.reads[0]]))} và dời l đến ${at(f, 'l')}: tổng ${num(v)}.`;
      case 'build': {
        const i = f.auxWrite - 1;
        return `P[${i + 1}] = P[${i}] + a[${i}] = ${P(f, i)} + ${num(Number(a[i]))} = ${P(f, i + 1)}.`;
      }
      case 'lookup': {
        const sub = `P[${to}] − P[${from}] = ${P(f, to)} − ${P(f, from)} = ${num(v)}`;
        if (f.problem === 'range-sums')
          return `Truy vấn ${f.query + 1}, a[${from}..${to - 1}]: ${sub}.`;
        if (f.problem === 'max-window') return `Cửa sổ a[${from}..${to - 1}]: ${sub}${better}.`;
        return f.cmp === 1
          ? `Đoạn a[${from}..${to - 1}]: ${sub} ≥ ${T}, độ dài ${to - from}${f.improved ? ', ngắn nhất đến giờ' : ''}. Chuyển sang điểm đầu tiếp theo.`
          : `Đoạn a[${from}..${to - 1}]: ${sub} < ${T}, thử đoạn dài hơn.`;
      }
      case 'sum':
        return f.problem === 'range-sums'
          ? `Truy vấn ${f.query + 1}, a[${from}..${to - 1}]: ${to - from} phép cộng từ đầu cho ra ${num(v)}.`
          : `Cửa sổ a[${from}..${to - 1}] tính từ đầu: ${to - from} phép cộng cho ra ${num(v)}${better}.`;
      case 'add': {
        const r = to - 1;
        return `Điểm đầu ${from}: cộng a[${r}] = ${num(Number(a[r]))}, tổng ${num(v)}${f.cmp === 1 ? ` ≥ ${T}, độ dài ${to - from}${f.improved ? ', ngắn nhất đến giờ' : ''}. Chuyển sang điểm đầu tiếp theo.` : ` < ${T}.`}`;
      }
      case 'done': {
        const steps = `${f.steps} bước`;
        switch (f.problem) {
          case 'pair-sum':
            return f.found
              ? `Xong: a[${f.found[0]}] + a[${f.found[1]}] = ${T}, sau ${steps}.`
              : `Xong: không có cặp nào có tổng ${T}. ${steps}.`;
          case 'palindrome':
            return f.verdict
              ? `Xong: “${a.join('')}” là xâu đối xứng, sau ${steps}.`
              : `Xong: “${a.join('')}” không phải xâu đối xứng, sau ${steps}.`;
          case 'max-window':
            return `Xong: cửa sổ tốt nhất là a[${f.bestFrom}..${f.bestTo - 1}] với tổng ${num(/** @type {number} */ (f.best))}, sau ${steps}.`;
          case 'shortest-window':
            return f.best === null
              ? `Xong: không đoạn nào đạt tới ${T}, kể cả cả mảng. ${steps}.`
              : `Xong: đoạn ngắn nhất là a[${f.bestFrom}..${f.bestTo - 1}], độ dài ${f.best}, sau ${steps}.`;
          case 'range-sums':
            return `Xong: các đáp án là ${f.answers.map((x) => num(/** @type {number} */ (x))).join(', ')}, sau ${steps}.`;
        }
      }
    }
  },
  takeaways: [
    'Hãy hỏi đáp án được tạo nên từ gì: hai vị trí đơn lẻ (hai con trỏ), một đoạn giá trị liên tiếp (cửa sổ trượt), hay tổng của nhiều đoạn (prefix sum).',
    'Hai con trỏ cần một lí do để bỏ đi một đầu ở mỗi bước: thứ tự đã sắp xếp với bài tổng một cặp, tính đối xứng với xâu đối xứng. Với bài tổng một cặp, điều đó biến n(n − 1)/2 lần kiểm tra thành nhiều nhất n − 1.',
    'Cửa sổ trượt cần một tổng chạy cập nhật được trong O(1). Cửa sổ thay đổi còn cần tổng không bao giờ giảm khi cửa sổ nới rộng, điều mà các giá trị ≥ 0 bảo đảm.',
    'Prefix sum trả O(n) một lần rồi trả lời mọi đoạn trong O(1). Cách này toả sáng khi có nhiều truy vấn, nhưng không làm nhanh hơn một lần tìm kiếm vẫn phải thử O(n²) đoạn.',
    'Thử đầu vào mẫu của bài đoạn ngắn nhất với cả ba kĩ thuật dùng được: 11 bước cho cửa sổ, 17 cho vét cạn và 23 cho prefix sum. Rồi chọn “Con trỏ” để đọc lí do nó không phù hợp.',
  ],
  complexityHead: ['Bài toán và kĩ thuật tốt nhất', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Cặp có tổng T, mảng đã sắp xếp: hai con trỏ',
      'O(n)',
      'Mỗi lần kiểm tra bỏ đi một đầu; thử mọi cặp là O(n²).',
    ],
    [
      'Kiểm tra xâu đối xứng: hai con trỏ',
      'O(n)',
      'So hai đầu rồi tiến vào trong với bộ nhớ O(1); bản chép ngược cần bộ nhớ O(n).',
    ],
    [
      'Tổng lớn nhất của k số liền nhau: cửa sổ trượt',
      'O(n)',
      'Hai lần cập nhật mỗi lần trượt; prefix sum cũng O(n) nhưng cần thêm n + 1 ô.',
    ],
    [
      'Đoạn ngắn nhất có tổng ≥ S: cửa sổ trượt',
      'O(n)',
      'l và r chỉ đi sang phải; thử mọi điểm đầu là O(n²).',
    ],
    [
      'q truy vấn tổng đoạn: prefix sum',
      'O(n + q)',
      'Dựng P một lần, rồi một phép trừ cho mỗi truy vấn; cộng từng đoạn là O(q·n).',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Bài cặp có tổng T, đầu vào mẫu (1, 3, 4, 6, 8, 11, 15 và T = 14). Vét cạn kiểm tra bao nhiêu tổng cặp trước khi tìm thấy một cặp?',
      answer: 10,
      unit: 'tổng',
      hints: [
        'Chọn “Vét cạn” rồi chạy đến bước cuối, hoặc theo dõi thẻ “Số bước”.',
        'Nó thử cả 6 số ghép cặp của a[0] trước, rồi a[1] với a[2], a[3], a[4] và a[5].',
      ],
      solution:
        'a[0] = 1 thất bại với cả 6 số ghép cặp. Sau đó 3 + 4, 3 + 6 và 3 + 8 thất bại, còn 3 + 11 = 14 là tổng thứ 10. Hai con trỏ tìm ra cùng cặp ấy sau 3 tổng: 1 + 15, 1 + 11 và 3 + 11.',
    },
    {
      type: 'number',
      prompt: 'Hai con trỏ trên “abcdcba”: nó so sánh bao nhiêu lần kí tự trước khi trả lời?',
      answer: 3,
      unit: 'lần so sánh',
      hints: ['Chọn “Kiểm tra xâu đối xứng” và “Con trỏ”. lo và hi dừng khi gặp nhau ở giữa.'],
      solution:
        'Nó so s[0] với s[6], s[1] với s[5] và s[2] với s[4]; khi đó lo = hi = 3 và vòng lặp kết thúc. Cách vét cạn chép ngược tốn 7 lần sao chép và 7 lần so sánh, 14 bước.',
    },
    {
      type: 'number',
      prompt:
        'Tổng lớn nhất của k = 3 số liền nhau trên đầu vào mẫu 4, −1, 2, 7, −3, 5, 1, −2. Tổng lớn nhất là bao nhiêu?',
      answer: 9,
      hints: ['Tổng các cửa sổ là 5, 8, 6, 9, 3 và 4.'],
      solution:
        'Trượt cửa sổ cho 5, rồi 5 + 7 − 4 = 8, 8 − 3 + 1 = 6, 6 + 5 − 2 = 9, 9 + 1 − 7 = 3 và 3 − 2 + 3 = 4. Tốt nhất là 9, từ 7, −3, 5.',
    },
    {
      type: 'number',
      prompt:
        'Đoạn ngắn nhất có tổng ≥ 7 trên đầu vào mẫu 2, 3, 1, 2, 4, 3. Prefix sum tốn bao nhiêu bước, tính cả việc dựng P?',
      answer: 23,
      unit: 'bước',
      hints: [
        'Chọn “Tiền tố” rồi chạy đến bước cuối.',
        'Dựng P tốn 6 bước; sau đó mỗi điểm đầu l thử các đoạn cho đến khi một đoạn đạt 7.',
      ],
      solution:
        '6 bước dựng P, rồi các điểm đầu thử lần lượt 4, 4, 3, 3, 2 và 1 đoạn: 17 phép trừ, tổng cộng 23. Vét cạn cần đúng 17 phép cộng mà không phải dựng P, còn cửa sổ trượt chỉ cần 11.',
    },
    {
      type: 'number',
      prompt:
        'Nhiều truy vấn tổng đoạn trên đầu vào mẫu 3, −2, 5, 1, 4, −1, 2, 6. Đáp án của truy vấn (2, 6) là bao nhiêu?',
      answer: 11,
      hints: ['Chọn “Tiền tố” rồi chạy đến truy vấn thứ hai: P[7] − P[2].'],
      solution: 'P[7] = 12 và P[2] = 1, nên tổng là 12 − 1 = 11, đúng bằng 5 + 1 + 4 − 1 + 2.',
    },
    {
      type: 'multi',
      prompt: 'Những kĩ thuật nào giải được bài “tổng lớn nhất của k số liền nhau”?',
      options: ['Hai con trỏ', 'Cửa sổ trượt', 'Prefix sum', 'Vét cạn'],
      answers: [1, 2, 3],
      hints: ['Thử từng kĩ thuật trên bài toán đó và đọc nhận xét của nó.'],
      solution:
        'Cửa sổ trượt phù hợp nhất, prefix sum cũng dùng được trong O(n) với một mảng phụ, và vét cạn dùng được trong O(n·k). Hai con trỏ hội tụ không giữ k giá trị đi liền với nhau.',
    },
    {
      type: 'choice',
      prompt:
        'Một ứng dụng trả lời 100 000 truy vấn tổng đoạn trên một mảng 1 000 000 giá trị không bao giờ thay đổi. Kĩ thuật nào phù hợp nhất?',
      options: ['Hai con trỏ', 'Cửa sổ trượt', 'Prefix sum', 'Vét cạn'],
      answer: 2,
      hints: ['So sánh O(n + q) với O(q·n) ở các kích thước này.'],
      solution:
        'Prefix sum tốn khoảng 1 000 000 bước để dựng rồi một phép trừ cho mỗi truy vấn: khoảng 1 100 000 bước. Cộng từng đoạn có thể tốn đến 100 000 × 1 000 000 bước.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao cửa sổ trượt thay đổi cần các giá trị ≥ 0 cho bài “đoạn ngắn nhất có tổng ≥ S”?',
      options: [
        'Khi có giá trị âm, một đoạn dài hơn có thể có tổng nhỏ hơn, nên thu hẹp từ bên trái có thể bỏ sót đáp án',
        'Số âm không cộng được trong O(1)',
        'Cửa sổ phải giữ độ dài cố định k',
        'Prefix sum sẽ nhanh hơn khi có giá trị âm',
      ],
      answer: 0,
      hints: ['Khi các giá trị có thể âm, cộng thêm một giá trị thì tổng thay đổi thế nào?'],
      solution:
        'Với các giá trị ≥ 0, cộng thêm một giá trị không bao giờ làm tổng giảm và bỏ đi một giá trị không bao giờ làm tổng tăng, nên nới rộng đến khi tổng đạt S rồi thu hẹp không bao giờ bỏ sót đáp án ngắn hơn. Một giá trị âm phá vỡ điều đó: bỏ nó đi lại làm tổng tăng, và một đoạn dài hơn có thể có tổng nhỏ hơn. Khi ấy cần cách khác, chẳng hạn prefix sum kết hợp queue đơn điệu (hàng đợi đơn điệu).',
    },
  ],
  nextTeaser:
    'Chủ đề tiếp theo là sắp xếp. Bài sau, Bubble sort và insertion sort, mở đầu bằng hai cách sắp xếp đơn giản nhất.',
};
