/** @typedef {import('$lib/algo-engine/p-np-reductions.js').ReductionFrame} ReductionFrame */

/** @param {string[]} names @param {number[]} set */
const setText = (names, set) => (set.length ? `{${set.map((i) => names[i]).join(', ')}}` : '{ }');

export const vi = {
  slug: 'p-np-reductions',
  topic: 'intractability',
  level: 'Nâng cao',
  title: 'P, NP và phép quy dẫn',
  intro:
    'Lí thuyết độ phức tạp phân loại các bài toán quyết định (decision problem), tức những câu hỏi có câu trả lời “có” hoặc “không”. Lớp P gồm các bài toán máy tính trả lời được trong thời gian đa thức. Lớp NP gồm các bài toán mà câu trả lời “có” kiểm tra được trong thời gian đa thức khi được đưa kèm một chứng chỉ (certificate). Một phép quy dẫn (reduction) biến mọi thể hiện của bài toán này thành một thể hiện của bài toán kia có cùng câu trả lời, và đó là cách ta so sánh độ khó của hai bài toán.',
  summary:
    'Quy dẫn CLIQUE về TẬP ĐỘC LẬP bằng cách dựng đồ thị bù theo từng cặp đỉnh, rồi kiểm tra một chứng chỉ bằng bộ kiểm chứng chạy trong thời gian đa thức.',
  instruction:
    'Chạy từng bước phép quy dẫn khi nó điền H, đồ thị bù của G, từng cặp một; sau đó xem bộ kiểm chứng kiểm tra chứng chỉ S của bạn. Bấm vào các đỉnh để thêm vào hoặc bỏ khỏi S, đổi k, chọn một ví dụ, hoặc sửa G bằng các công cụ vẽ và xem H thay đổi theo.',
  problemsTitle: 'Hai bài toán quyết định',
  /** @param {number} k */
  cliqueQuestion: (k) => `CLIQUE: G có ${k} đỉnh đôi một nối với nhau không?`,
  /** @param {number} k */
  indepQuestion: (k) =>
    `TẬP ĐỘC LẬP: H có ${k} đỉnh mà không hai đỉnh nào nối với nhau bằng một cạnh không?`,
  kLabel: 'k',
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    clique: 'Clique bốn đỉnh',
    house: 'Ngôi nhà',
    cycle: 'Chu trình năm đỉnh',
  },
  /** @param {number} n */
  kError: (n) => `k phải là số nguyên từ 1 đến ${n}, tức số đỉnh.`,
  certLabel: 'Chứng chỉ S',
  certNote:
    'Bấm vào một đỉnh để đưa nó vào S hoặc bỏ nó ra. S là bằng chứng đi kèm một câu trả lời “có”.',
  /** @param {string} name @param {boolean} on */
  certButton: (name, on) => `${name}${on ? ' ✓' : ''}`,
  /** @param {string} name @param {boolean} on */
  certAria: (name, on) => `Đỉnh ${name}, ${on ? 'thuộc' : 'không thuộc'} chứng chỉ`,
  graphTitle: 'G, thể hiện của CLIQUE',
  graphAria: 'Đồ thị G, đầu vào của CLIQUE.',
  complementTitle: 'H, thể hiện của TẬP ĐỘC LẬP',
  complementAria: 'Đồ thị H, đồ thị bù của G, do phép quy dẫn dựng nên.',
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => (state ? `Đỉnh ${name}, ${state}` : `Đỉnh ${name}`),
  states: { cert: 'thuộc chứng chỉ S', pair: 'thuộc cặp đang xét' },
  markers: { cert: 'S' },
  legend: {
    pair: 'Cặp đang xét',
    cert: 'S Thuộc chứng chỉ',
    checked: 'Cặp đã được bộ kiểm chứng xác nhận',
    added: 'Cạnh phép quy dẫn thêm vào H',
  },
  stats: {
    mapSteps: 'Số cặp đã quy dẫn',
    checks: 'Số lần kiểm tra của bộ kiểm chứng',
    subsets: 'Số tập con một phép tìm kiếm phải thử',
    answer: 'Câu trả lời, cho cả hai bài toán',
  },
  /** @param {number} n */
  mapNote: (n) => `n(n − 1)/2 = ${n}`,
  /** @param {number} n @param {number} k */
  subsetNote: (n, k) => `C(${n}, ${k}), mọi tập gồm k đỉnh`,
  verdicts: { accept: 'chấp nhận', reject: 'bác bỏ', '': 'chưa có' },
  /** @param {boolean} yes @param {string[]} names @param {number[]} witness */
  answer: (yes, names, witness) => (yes ? `có, ví dụ ${setText(names, witness)}` : 'không'),
  verifierTitle: 'Bộ kiểm chứng',
  /** @param {ReductionFrame} f */
  verdict: (f) => {
    if (f.verdict === 'accept') return 'S được chấp nhận.';
    if (f.verdict === 'reject') return 'S bị bác bỏ.';
    return 'Đang chờ phép quy dẫn chạy xong.';
  },
  /** @param {ReductionFrame} f @param {string[]} names */
  describe(f, names) {
    const p = f.pair ? `${names[f.pair[0]]} – ${names[f.pair[1]]}` : '';
    const yes = f.largest >= f.k;
    switch (f.kind) {
      case 'start':
        return `Đầu vào là G và k = ${f.k}. Phép quy dẫn tạo H có cùng ${f.n} đỉnh và chưa có cạnh nào.`;
      case 'keep':
        return `${p} là một cạnh của G, nên H không có cạnh ở đó. Hai đỉnh nối nhau trong G có thể cùng nằm trong một clique, nên trong H chúng phải được phép cùng nằm trong một tập độc lập.`;
      case 'add':
        return `${p} không phải cạnh của G, nên thêm nó vào H. Hai đỉnh này không bao giờ cùng nằm trong một clique của G, và cạnh trong H ngăn chúng cùng nằm trong một tập độc lập.`;
      case 'mapped':
        return `H hoàn chỉnh sau ${f.mapSteps} cặp, và k vẫn là ${f.k}. Một tập đỉnh bất kì là clique của G khi và chỉ khi nó độc lập trong H, nên hai câu hỏi có cùng câu trả lời.`;
      case 'small':
        return `S ${setText(names, f.cert)} có ${f.cert.length} đỉnh, ít hơn k = ${f.k}. Bộ kiểm chứng bác bỏ nó ngay.`;
      case 'pairOk':
        return `${p} là một cạnh của G, nên không phải cạnh của H. Cặp này ổn.`;
      case 'pairBad':
        return `${p} không phải cạnh của G, nên S không phải một clique và không độc lập trong H. Bộ kiểm chứng bác bỏ S. Điều đó không nói gì về các tập khác: ${yes ? 'vẫn có một clique cỡ k' : 'ở đây cũng không có clique nào cỡ k'}.`;
      case 'accept':
        return `Mọi cặp trong S ${setText(names, f.cert)} đều nối nhau trong G: một clique gồm ${f.cert.length} đỉnh, kiểm tra bằng ${f.checks} phép thử. Bộ kiểm chứng chấp nhận, và S cũng là một tập độc lập của H.`;
      case 'done':
        return `Xong. Phép quy dẫn xét ${f.mapSteps} cặp và bộ kiểm chứng làm ${f.checks} phép thử, cả hai đều đa thức. Tìm S mà không có chứng chỉ có thể phải thử hết ${f.subsets} tập gồm ${f.k} đỉnh. Cả hai câu trả lời đều là ${yes ? '“có”' : '“không”'}: clique lớn nhất của G có ${f.largest} đỉnh.`;
    }
  },
  takeaways: [
    'Một bài toán quyết định có câu trả lời “có” hoặc “không”, như “G có clique gồm k đỉnh không?”. Bài toán tối ưu trở thành bài toán quyết định khi thêm một ngưỡng k, và hai dạng khó như nhau, chỉ sai khác một thừa số đa thức.',
    'P là tập các bài toán quyết định giải được trong thời gian đa thức. NP là tập các bài toán mà câu trả lời “có” luôn có một chứng chỉ để bộ kiểm chứng kiểm tra trong thời gian đa thức. Mọi bài toán thuộc P đều thuộc NP; P có bằng NP hay không là câu hỏi mở nổi tiếng.',
    'Một phép quy dẫn A ≤ₚ B biến mỗi thể hiện của A, trong thời gian đa thức, thành một thể hiện của B có cùng câu trả lời. Khi đó một thuật toán nhanh cho B cho ta một thuật toán nhanh cho A, nên B khó ít nhất bằng A.',
    'Chiều quy dẫn rất quan trọng. Muốn chứng minh B khó, hãy quy dẫn một bài toán đã biết là khó về B, đừng bao giờ quy dẫn B về nó.',
    'Nạp ví dụ “Ngôi nhà”: chứng chỉ {A, B, D} bị bác bỏ, nhưng câu trả lời vẫn là “có”. Thay D bằng C rồi chạy lại để xem bộ kiểm chứng chấp nhận {A, B, C}.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Quy dẫn G thành H', 'O(n²)', 'Xét một lần mỗi cặp trong n(n − 1)/2 cặp.'],
    ['Kiểm chứng một chứng chỉ', 'O(k²)', 'Mỗi cặp trong k đỉnh của S là một lần tra cạnh.'],
    [
      'Tìm kiếm khi không có chứng chỉ',
      'O(C(n, k) · k²)',
      'Thử mọi tập gồm k đỉnh và kiểm chứng từng tập.',
    ],
    ['Bộ nhớ', 'O(n²)', 'H có thể có tới n(n − 1)/2 cạnh.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'G có 6 đỉnh. Phép quy dẫn xét bao nhiêu cặp?',
      answer: 15,
      unit: 'cặp',
      hints: ['Mỗi cặp không thứ tự một lần: n(n − 1)/2.'],
      solution:
        '6 · 5 / 2 = 15 cặp, bất kể các cạnh ra sao. Nạp “Clique bốn đỉnh” và đọc ô “Số cặp đã quy dẫn”.',
    },
    {
      type: 'number',
      prompt: 'Trong ví dụ “Clique bốn đỉnh”, G có 9 cạnh. H có bao nhiêu cạnh?',
      answer: 6,
      unit: 'cạnh',
      hints: ['Trong 15 cặp, H có cạnh đúng ở những chỗ G không có cạnh.'],
      solution: '15 cặp − 9 cạnh của G = 6 cạnh trong H.',
    },
    {
      type: 'number',
      prompt:
        'Chứng chỉ là một clique gồm 5 đỉnh. Bộ kiểm chứng làm bao nhiêu phép thử cặp trước khi chấp nhận?',
      answer: 10,
      unit: 'phép thử',
      hints: ['Nó kiểm tra mỗi cặp trong S một lần.'],
      solution: '5 · 4 / 2 = 10 phép thử, tức O(k²): đa thức.',
    },
    {
      type: 'choice',
      prompt: 'Có một phép quy dẫn A ≤ₚ B và B thuộc P. Suy ra điều gì?',
      options: [
        'A thuộc P.',
        'B là NP-đầy đủ.',
        'A khó hơn B.',
        'Không suy ra gì, trừ khi B cũng quy dẫn được về A.',
      ],
      answer: 0,
      hints: ['Biến một thể hiện của A thành một thể hiện của B, rồi dùng thuật toán nhanh của B.'],
      solution:
        'Quy dẫn trong thời gian đa thức, rồi giải B trong thời gian đa thức. Tổng cộng vẫn là đa thức, nên A thuộc P.',
    },
    {
      type: 'multi',
      prompt: 'Câu nào dưới đây là bài toán quyết định? Chọn mọi phương án đúng.',
      options: [
        'G có clique gồm ít nhất 4 đỉnh không?',
        'Tìm clique lớn nhất của G.',
        'Có đường đi qua mọi thành phố với độ dài không quá 100 không?',
        'Đường đi ngắn nhất qua mọi thành phố dài bao nhiêu?',
      ],
      answers: [0, 2],
      hints: ['Một bài toán quyết định chỉ trả lời “có” hoặc “không”.'],
      solution:
        'Câu thứ nhất và câu thứ ba hỏi “có” hay “không”. Hai câu còn lại đòi một đối tượng hoặc một con số; thêm một ngưỡng k sẽ biến chúng thành bài toán quyết định.',
    },
  ],
  nextTeaser:
    'Bài sau đi tìm những bài toán khó nhất trong NP: NP-đầy đủ, nơi mọi bài toán NP đều quy dẫn được về.',
};
