/** @typedef {import('$lib/algo-engine/np-completeness.js').GadgetFrame} GadgetFrame */
/** @typedef {import('$lib/algo-engine/np-completeness.js').Formula} Formula */

/** True and false as the Vietnamese logic letters Đ (đúng) and S (sai). @param {boolean} b */
const tf = (b) => (b ? 'Đ' : 'S');

/** @param {Formula} f @param {boolean[]} a */
const assignmentText = (f, a) => f.vars.map((v, i) => `${v} = ${tf(a[i])}`).join(', ');

export const vi = {
  slug: 'np-completeness',
  topic: 'intractability',
  level: 'Nâng cao',
  title: 'NP-đầy đủ',
  intro:
    'Một bài toán là NP-khó khi mọi bài toán thuộc NP đều quy dẫn được về nó, và là NP-đầy đủ khi nó còn thuộc chính NP. Định lí Cook–Levin cho ta bài toán NP-đầy đủ đầu tiên, SAT. Từ đó, mỗi chứng minh NP-khó mới chỉ cần một phép quy dẫn (reduction) từ một bài toán đã biết là khó, nên các bài toán NP-đầy đủ đã biết tạo thành một tấm bản đồ nối với nhau bằng các mũi tên quy dẫn.',
  summary:
    'Đi theo bản đồ các bài toán NP-đầy đủ kinh điển, và chạy từng bước phép quy dẫn từ 3-SAT về phủ đỉnh trên một công thức do em nhập.',
  instruction:
    'Bấm vào một bài toán trên bản đồ để đọc vì sao nó NP-khó. Sau đó chạy từng bước phép quy dẫn từ 3-SAT về phủ đỉnh: nhập một công thức, đặt mỗi biến là đúng (Đ) hoặc sai (S), và xem tập phủ gồm k đỉnh dựng từ phép gán của em có phủ hết mọi cạnh hay không.',
  mapTitle: 'Bản đồ các bài toán NP-đầy đủ',
  mapNote:
    'Mũi tên A → B là một phép quy dẫn A ≤ₚ B, nên B khó ít nhất bằng A. Mũi tên được tô đậm là phép quy dẫn trong trình chạy bên dưới.',
  mapAria: 'Bản đồ các bài toán NP-đầy đủ kinh điển nối với nhau bằng các phép quy dẫn.',
  /** @type {Record<string, {name: string, question: string, why: string}>} */
  problems: {
    np: {
      name: 'Mọi bài toán thuộc NP',
      question:
        'Mọi bài toán quyết định mà câu trả lời “có” luôn có một chứng chỉ kiểm tra được trong thời gian đa thức.',
      why: 'Cook–Levin: chạy một bộ kiểm chứng thời gian đa thức trên đầu vào của nó tương đương với một mạch logic cỡ đa thức, và mạch đó viết được thành một công thức logic thoả được khi và chỉ khi có một chứng chỉ khiến bộ kiểm chứng chấp nhận.',
    },
    sat: {
      name: 'SAT',
      question: 'Có thể gán giá trị cho các biến của một công thức logic để nó đúng không?',
      why: 'Bài toán NP-đầy đủ đầu tiên (Cook 1971, Levin 1973). Nó thuộc NP, vì một phép gán chính là chứng chỉ, và mọi bài toán thuộc NP đều quy dẫn được về nó.',
    },
    threeSat: {
      name: '3-SAT',
      question:
        'Cũng câu hỏi đó, cho công thức ở dạng chuẩn hội (CNF) với đúng ba literal trong mỗi mệnh đề.',
      why: 'SAT ≤ₚ 3-SAT: viết lại công thức ở dạng CNF với các biến phụ mới, rồi tách các mệnh đề dài bằng thêm biến phụ và bù cho các mệnh đề ngắn. Với hai literal mỗi mệnh đề, bài toán thuộc P.',
    },
    vertexCover: {
      name: 'Phủ đỉnh',
      question: 'G có k đỉnh chạm tới mọi cạnh không?',
      why: '3-SAT ≤ₚ PHỦ ĐỈNH, chính là cấu kiện trong trình chạy: mỗi biến một cạnh, mỗi mệnh đề một tam giác, k = n + 2m.',
    },
    clique: {
      name: 'Clique',
      question: 'G có k đỉnh đôi một nối với nhau không?',
      why: '3-SAT ≤ₚ CLIQUE: mỗi literal của mỗi mệnh đề là một đỉnh, hai đỉnh được nối trừ khi chúng cùng một mệnh đề hoặc mâu thuẫn nhau; k là số mệnh đề.',
    },
    independentSet: {
      name: 'Tập độc lập',
      question: 'G có k đỉnh mà không hai đỉnh nào nối với nhau không?',
      why: 'CLIQUE ≤ₚ TẬP ĐỘC LẬP qua đồ thị bù, như ở bài trước. Ngoài ra, S độc lập khi và chỉ khi các đỉnh còn lại tạo thành một tập phủ đỉnh.',
    },
    setCover: {
      name: 'Phủ tập',
      question: 'Có thể chọn k tập trong các tập đã cho để cùng phủ mọi phần tử không?',
      why: 'PHỦ ĐỈNH ≤ₚ PHỦ TẬP: các phần tử là các cạnh, và mỗi đỉnh là tập các cạnh nó chạm tới.',
    },
    hamCycle: {
      name: 'Chu trình Hamilton',
      question: 'Có chu trình nào đi qua mỗi đỉnh đúng một lần không?',
      why: 'PHỦ ĐỈNH ≤ₚ CHU TRÌNH HAMILTON với một cấu kiện 12 đỉnh cho mỗi cạnh, như trong sách CLRS.',
    },
    tsp: {
      name: 'Người du lịch',
      question: 'Có hành trình qua mọi thành phố với tổng độ dài không quá L không?',
      why: 'CHU TRÌNH HAMILTON ≤ₚ TSP: chi phí 0 trên các cạnh của G, 1 trên các cặp còn lại, và L = 0.',
    },
    subsetSum: {
      name: 'Tổng tập con',
      question: 'Có một số trong các số đã cho cộng lại đúng bằng t không?',
      why: '3-SAT ≤ₚ TỔNG TẬP CON: các chữ số của mỗi số đánh dấu một biến và các mệnh đề nó làm đúng, với mục tiêu t đòi đúng một giá trị cho mỗi biến và một literal đúng cho mỗi mệnh đề.',
    },
    colouring: {
      name: 'Tô 3 màu',
      question:
        'Có thể tô các đỉnh bằng ba màu sao cho không cạnh nào nối hai đỉnh cùng màu không?',
      why: '3-SAT ≤ₚ TÔ 3 MÀU với một tam giác cố định ba màu đúng, sai và nền, cùng một cấu kiện OR cho mỗi mệnh đề. Với hai màu, bài toán thuộc P.',
    },
  },
  /** @param {string} name @param {boolean} on */
  mapNodeLabel: (name, on) => `${name}${on ? ', đang hiện bên dưới bản đồ' : ''}`,
  formulaLabel: 'Công thức 3-CNF',
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    satisfied: 'Một phép gán thoả',
    missed: 'Một phép gán trượt',
    unsatisfiable: 'Không phép gán nào thoả',
  },
  /** @param {number} maxClauses */
  formulaError: (maxClauses) =>
    `Hãy nhập từ 1 đến ${maxClauses} mệnh đề, mỗi mệnh đề đúng ba literal, dùng các biến từ a đến d, ví dụ (a ∨ ¬b ∨ c) ∧ (¬a ∨ b ∨ d).`,
  assignmentLabel: 'Phép gán',
  /** @param {string} name @param {boolean} value */
  valueButton: (name, value) => `${name} = ${tf(value)}`,
  /** @param {string} name @param {boolean} value */
  valueAria: (name, value) => `${name} đang ${value ? 'đúng' : 'sai'}; bấm để đảo giá trị`,
  graphTitle: 'Thể hiện phủ đỉnh G',
  graphAria:
    'Đồ thị G dựng từ công thức: mỗi biến một cặp đỉnh ở trên, mỗi mệnh đề một tam giác ở dưới.',
  /** @param {string} label @param {string} state */
  vertexLabel: (label, state) => (state ? `Đỉnh ${label}, ${state}` : `Đỉnh ${label}`),
  states: { current: 'đang xử lí', cover: 'thuộc tập phủ' },
  markers: { cover: '✓' },
  legend: {
    current: 'Đang xử lí',
    cover: '✓ Thuộc tập phủ',
    uncovered: 'Cạnh không có đầu mút nào trong tập phủ',
    edge: 'Cạnh vừa thêm',
  },
  stats: {
    vertices: 'Số đỉnh, 2n + 3m',
    edges: 'Số cạnh, n + 6m',
    k: 'Mục tiêu k = n + 2m',
    cover: 'Kích thước tập phủ',
    result: 'Kết quả',
  },
  /** @param {GadgetFrame} f */
  result: (f) => {
    if (f.kind === 'covered' || (f.kind === 'done' && f.uncovered.length === 0))
      return 'đã phủ hết: φ được thoả';
    if (f.kind === 'uncovered' || f.kind === 'done')
      return `${f.uncovered.length} cạnh chưa được phủ`;
    return 'chưa kiểm tra';
  },
  /** @param {GadgetFrame} f @param {Formula} formula */
  describe(f, formula) {
    const lit = (/** @type {{v: number, neg: boolean}} */ l) =>
      `${l.neg ? '¬' : ''}${formula.vars[l.v]}`;
    const clause = f.clause >= 0 ? formula.clauses[f.clause] : [];
    const name = f.variable >= 0 ? formula.vars[f.variable] : '';
    const n = formula.vars.length;
    const m = formula.clauses.length;
    switch (f.kind) {
      case 'start':
        return `φ có n = ${n} biến và m = ${m} mệnh đề. Phép quy dẫn dựng một đồ thị G và một số k sao cho G có tập phủ đỉnh gồm k đỉnh khi và chỉ khi φ thoả được.`;
      case 'variable':
        return `Biến ${name}: thêm hai đỉnh ${name} và ¬${name} cùng một cạnh nối chúng. Mọi tập phủ phải lấy ít nhất một trong hai đỉnh, nghĩa là chọn ${name} đúng hoặc sai.`;
      case 'clause':
        return `Mệnh đề ${f.clause + 1}, (${clause.map(lit).join(' ∨ ')}): thêm một tam giác. Mọi tập phủ phải lấy ít nhất hai trong ba đỉnh của nó.`;
      case 'link':
        return `Nối đỉnh tam giác ứng với ${linkLiteral(f, formula)} tới đỉnh của literal đó ở trên. Cạnh này chỉ được phủ từ phía trên nếu literal được chọn là đúng.`;
      case 'target':
        return `G có ${2 * n + 3 * m} đỉnh và ${n + 6 * m} cạnh, và k = n + 2m = ${f.k}: mỗi biến một đỉnh và mỗi tam giác hai đỉnh, ít nhất mà mọi tập phủ phải dùng. Phép quy dẫn đã xong, trong thời gian đa thức.`;
      case 'pickVar':
        return `${name} ${f.assignment[f.variable] ? 'đúng' : 'sai'}, nên lấy đỉnh ${f.assignment[f.variable] ? name : `¬${name}`}. Đỉnh đó phủ cạnh của biến.`;
      case 'pickClause':
        return `Mệnh đề ${f.clause + 1} có một literal đúng. Không lấy đỉnh tam giác của literal đó, vì đỉnh phía trên đã phủ cạnh nối, và lấy hai đỉnh còn lại.`;
      case 'unsat':
        return `Mệnh đề ${f.clause + 1} không có literal đúng nào. Ngân sách chỉ cho phép lấy hai đỉnh tam giác, nên đỉnh bị bỏ ra có một cạnh nối tới một đỉnh literal không thuộc tập phủ.`;
      case 'covered':
        return `Cả ${f.edges.length} cạnh đều được phủ bởi k = ${f.k} đỉnh, nên phép gán ${assignmentText(formula, f.assignment)} thoả φ.`;
      case 'uncovered':
        return `Có ${f.uncovered.length} cạnh chưa được phủ: phép gán này thất bại. ${f.witness ? `φ vẫn thoả được, ví dụ với ${assignmentText(formula, f.witness)}.` : 'Không phép gán nào thoả φ, nên G cũng không có tập phủ gồm k đỉnh.'}`;
      case 'done':
        return f.uncovered.length === 0
          ? `Xong. Một phép gán thoả cho ta một tập phủ gồm k đỉnh, và ngược lại một tập phủ gồm k đỉnh cũng cho lại một phép gán thoả: các literal đúng là những đỉnh biến mà nó lấy.`
          : `Xong. ${f.witness ? `Hãy thử ${assignmentText(formula, f.witness)}.` : 'Không phép gán nào dùng được: φ không thoả được, và G không có tập phủ đỉnh gồm k đỉnh.'}`;
    }
  },
  takeaways: [
    'NP-khó nghĩa là mọi bài toán thuộc NP đều quy dẫn được về nó. NP-đầy đủ nghĩa là vừa NP-khó vừa thuộc NP. Nếu có một bài toán NP-đầy đủ nào có thuật toán đa thức, thì P = NP.',
    'Định lí Cook–Levin chứng minh SAT là NP-đầy đủ từ con số không, bằng cách viết mọi bộ kiểm chứng thời gian đa thức thành một công thức. Mọi chứng minh về sau chỉ cần quy dẫn từ một bài toán đã biết là NP-đầy đủ.',
    'Muốn chứng minh một bài toán mới X là NP-đầy đủ: chỉ ra X thuộc NP bằng một bộ kiểm chứng, rồi quy dẫn một bài toán NP-đầy đủ đã biết về X, và chứng minh cả hai chiều: “có” biến thành “có”, và “không” biến thành “không”.',
    'Các cấu kiện (gadget) làm nên phép quy dẫn. Ở đây, một cạnh buộc mỗi biến phải chọn đúng hoặc sai, và một tam giác với ngân sách hai đỉnh buộc mỗi mệnh đề phải chứa một literal đúng.',
    'Nạp “Không phép gán nào thoả” và đảo a, b theo mọi tổ hợp: luôn còn một cạnh chưa được phủ. Sau đó đổi mệnh đề cuối thành (¬b ∨ ¬b ∨ a) và tìm một phép gán phủ hết mọi cạnh.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Dựng G',
      'O(n + m)',
      '2n + 3m đỉnh và n + 6m cạnh, một lượng cố định cho mỗi biến và mỗi mệnh đề.',
    ],
    ['Kiểm tra một tập phủ', 'O(n + m)', 'Xét mỗi cạnh một lần.'],
    [
      'Bước đi ngẫu nhiên Schöning cho 3-SAT',
      'O(1.334ⁿ)',
      'Một thuật toán ngẫu nhiên nhanh, nhưng vẫn là hàm mũ: chưa bài toán NP-đầy đủ nào có thuật toán đa thức đã biết.',
    ],
    ['Thử mọi phép gán', 'O(2ⁿ · m)', 'Điều trang này làm để biết φ có thoả được hay không.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Một công thức 3-CNF có 3 biến và 2 mệnh đề. G có bao nhiêu đỉnh?',
      answer: 12,
      unit: 'đỉnh',
      hints: ['Mỗi biến hai đỉnh, mỗi mệnh đề ba đỉnh.'],
      solution: '2 · 3 + 3 · 2 = 12 đỉnh.',
    },
    {
      type: 'number',
      prompt: 'Với 4 biến và 3 mệnh đề, mục tiêu k bằng bao nhiêu?',
      answer: 10,
      hints: ['k = n + 2m.'],
      solution: 'k = 4 + 2 · 3 = 10: mỗi cạnh biến một đỉnh và mỗi tam giác hai đỉnh.',
    },
    {
      type: 'number',
      prompt: 'Nạp “Một phép gán thoả”. G có bao nhiêu cạnh?',
      answer: 21,
      unit: 'cạnh',
      hints: ['Mỗi biến một cạnh, mỗi tam giác ba cạnh và mỗi mệnh đề ba cạnh nối: n + 6m.'],
      solution: 'n = 3 và m = 3, nên có 3 + 6 · 3 = 21 cạnh.',
    },
    {
      type: 'choice',
      prompt: 'Em muốn chứng minh một bài toán mới X là NP-khó. Em dựng phép quy dẫn nào?',
      options: [
        'Từ X về một bài toán NP-đầy đủ đã biết.',
        'Từ một bài toán NP-đầy đủ đã biết về X.',
        'Từ X về một bài toán thuộc P.',
        'Từ SAT về một bài toán thuộc P.',
      ],
      answer: 1,
      hints: ['Một phép quy dẫn A ≤ₚ B cho thấy B khó ít nhất bằng A.'],
      solution:
        'Quy dẫn một bài toán NP-đầy đủ đã biết về X. Khi đó một thuật toán nhanh cho X cũng giải nhanh được bài toán kia, nên X khó ít nhất bằng nó.',
    },
    {
      type: 'multi',
      prompt: 'Hai điều nào cùng nhau cho thấy X là NP-đầy đủ?',
      options: [
        'X có một bộ kiểm chứng thời gian đa thức.',
        'Một bài toán NP-đầy đủ đã biết quy dẫn được về X.',
        'X quy dẫn được về SAT.',
        'Chưa ai biết thuật toán đa thức nào cho X.',
      ],
      answers: [0, 1],
      hints: ['NP-đầy đủ nghĩa là thuộc NP và NP-khó.'],
      solution:
        'Bộ kiểm chứng đặt X vào NP; phép quy dẫn từ một bài toán NP-đầy đủ đã biết làm X thành NP-khó. X ≤ₚ SAT đúng với mọi bài toán thuộc NP, nên nó không thêm thông tin gì.',
    },
    {
      type: 'text',
      prompt: 'Định lí Cook–Levin chứng minh bài toán nào là NP-đầy đủ?',
      accept: [
        'SAT',
        'thoả được',
        'tính thoả được',
        'bài toán thoả được',
        'boolean satisfiability',
        'satisfiability',
        'CNF-SAT',
        'circuit SAT',
      ],
      hints: ['Nó nói về các công thức logic.'],
      solution:
        'SAT, bài toán tính thoả được của công thức logic: có phép gán nào làm công thức đúng không?',
    },
  ],
  nextTeaser:
    'Bài sau chấp nhận rằng lời giải tối ưu có thể quá đắt: thuật toán xấp xỉ tìm nhanh một lời giải đủ tốt, kèm bảo đảm về chất lượng.',
};

/**
 * The literal of the triangle vertex in a link frame.
 * @param {GadgetFrame} f @param {Formula} formula
 */
function linkLiteral(f, formula) {
  const t = (f.current[0] - 2 * formula.vars.length) % 3;
  const l = formula.clauses[f.clause][t];
  return `${l.neg ? '¬' : ''}${formula.vars[l.v]}`;
}
