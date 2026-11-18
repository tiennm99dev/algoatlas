/** @typedef {import('$lib/algo-engine/two-sat.js').TwoSatFrame} TwoSatFrame */
/** @typedef {import('$lib/algo-engine/two-sat.js').Clause} Clause */

const SUB = '₀₁₂₃₄₅₆₇₈₉';
/** Name of variable x (0-based): x₁, x₂, …. @param {number} x */
const varName = (x) => `x${[...String(x + 1)].map((d) => SUB[Number(d)]).join('')}`;
/** Name of a literal: 2i is xᵢ₊₁, 2i + 1 is ¬xᵢ₊₁. @param {number} l */
const lit = (l) => `${l % 2 ? '¬' : ''}${varName(l >> 1)}`;
/** @param {Clause} c */
const clauseText = ([a, b]) => `(${lit(a)} ∨ ${lit(b)})`;
/** @param {number[]} list */
const lits = (list) => list.map(lit).join(', ');
/** @param {number} v */
const bool = (v) => (v === 1 ? 'true' : 'false');

export const vi = {
  slug: 'two-sat',
  topic: 'advanced-graphs',
  level: 'Nâng cao',
  title: 'Bài toán 2-SAT',
  intro:
    'Bài toán 2-SAT hỏi xem có cách gán giá trị đúng/sai cho các biến để thoả một công thức gồm các mệnh đề, mỗi mệnh đề có hai literal, ví dụ (x₁ ∨ ¬x₂); một literal là một biến hoặc phủ định của nó. Khi mỗi mệnh đề có ba literal, bài toán là NP-đầy đủ, nhưng với hai literal thì giải được trong thời gian tuyến tính: mỗi mệnh đề thành hai phép kéo theo, và các thành phần liên thông mạnh của đồ thị kéo theo (implication graph) thu được quyết định mọi thứ.',
  summary:
    'Dựng đồ thị kéo theo của một công thức 2-SAT do em sửa, tìm các thành phần liên thông mạnh của nó và đọc ra một phép gán thoả công thức từ thứ tự tô-pô của chúng.',
  instruction:
    'Sửa các mệnh đề: chọn từng literal trong danh sách của nó, thêm hoặc xoá mệnh đề, hoặc nạp một ví dụ. Đi từng bước: mỗi mệnh đề thêm hai cạnh kéo theo, thuật toán Tarjan tìm các thành phần (đánh số ở góc mỗi đỉnh), và mỗi biến được gán tuỳ theo thành phần của literal nào trong hai literal của nó được tìm thấy trước.',
  varsNote: 'Các biến từ x₁ đến x₄. Một literal là một biến hoặc phủ định ¬ của nó.',
  clausesTitle: 'Các mệnh đề (tất cả đều phải đúng)',
  /** @param {number} k */
  clauseAria: (k) => `Mệnh đề ${k + 1}`,
  /** @param {number} k @param {'first' | 'second'} side */
  literalAria: (k, side) =>
    `Mệnh đề ${k + 1}, literal ${side === 'first' ? 'thứ nhất' : 'thứ hai'}`,
  /** @param {number} k */
  removeAria: (k) => `Xoá mệnh đề ${k + 1}`,
  remove: 'Xoá',
  or: '∨',
  addClause: 'Thêm mệnh đề',
  satExample: 'Ví dụ có nghiệm',
  unsatExample: 'Ví dụ vô nghiệm',
  /** @param {number} max */
  full: (max) => `Công thức ở đây có tối đa ${max} mệnh đề. Hãy xoá bớt một mệnh đề trước.`,
  noClauses:
    'Không có mệnh đề nào: phép gán nào cũng được. Thêm một mệnh đề để xem các phép kéo theo của nó.',
  satisfied: 'đã thoả',
  graphAria:
    'Đồ thị kéo theo: mỗi literal là một đỉnh, mỗi mệnh đề (a ∨ b) cho hai cạnh ¬a → b và ¬b → a.',
  compsLabel: 'Các thành phần (theo thứ tự thuật toán Tarjan tìm thấy)',
  assignLabel: 'Phép gán',
  emptyText: 'chưa có',
  hotLabel: 'mới nhất',
  /** @param {number} c @param {number[]} members */
  compChip: (c, members) => `C${c}: ${lits(members)}`,
  /** @param {number} x @param {number} v */
  assignChip: (x, v) => `${varName(x)} = ${bool(v)}`,
  stats: {
    clauses: 'Số mệnh đề',
    edges: 'Số cạnh kéo theo',
    comps: 'Số thành phần',
    result: 'Kết quả',
  },
  results: { pending: '—', sat: 'Có nghiệm', unsat: 'Vô nghiệm' },
  legend: {
    added: 'Hai đầu của các cạnh vừa thêm',
    popped: 'Thành phần vừa tìm thấy',
    found: 'Thuộc một thành phần (số ở góc)',
    yes: 'Literal được gán đúng',
    conflict: 'x và ¬x cùng một thành phần',
    newEdge: 'Cạnh vừa thêm',
    inside: 'Cạnh nằm trong một thành phần',
  },
  states: {
    added: 'đầu của một cạnh mới',
    popped: 'vừa tìm thấy',
    yes: 'đúng',
    no: 'sai',
    conflict: 'cùng thành phần với phủ định của nó',
  },
  lit,
  clauseText,
  /** @param {string} name @param {string} state @param {number} comp */
  literalLabel: (name, state, comp) =>
    [`Literal ${name}`, state, comp > 0 ? `thành phần C${comp}` : ''].filter(Boolean).join(', '),
  /**
   * @param {TwoSatFrame} f
   * @param {Clause[]} clauses
   */
  describe(f, clauses) {
    switch (f.kind) {
      case 'start':
        return 'Mỗi literal là một đỉnh, chưa có cạnh nào. Mỗi mệnh đề (a ∨ b) sẽ thêm ¬a → b và ¬b → a: nếu một literal sai thì literal kia phải đúng.';
      case 'clause': {
        const c = clauses[f.clause];
        const [a, b] = c;
        if (f.added.length === 0)
          return `${clauseText(c)} không thêm gì mới${a === (b ^ 1) ? ': mệnh đề này luôn đúng' : ': các cạnh của nó đã có sẵn'}.`;
        return `${clauseText(c)}: nếu ${lit(a ^ 1)} thì ${lit(b)}, và nếu ${lit(b ^ 1)} thì ${lit(a)}. ${f.added.length === 1 ? 'Hai phép kéo theo này giống nhau, nên chỉ thêm một cạnh.' : 'Thêm cả hai cạnh.'}`;
      }
      case 'scc':
        return `Thuật toán Tarjan hoàn tất thành phần C${f.count}: ${lits(f.popped)}. Các literal này cùng đúng hoặc cùng sai.`;
      case 'conflict': {
        const x = f.variable;
        return `${varName(x)} và ¬${varName(x)} cùng nằm trong C${f.comp[2 * x]}: ${varName(x)} kéo theo ¬${varName(x)} và ngược lại, nên không giá trị nào của ${varName(x)} dùng được.`;
      }
      case 'assign': {
        const x = f.variable;
        const cx = f.comp[2 * x];
        const cn = f.comp[2 * x + 1];
        return f.value[x] === 1
          ? `C${cx} (${varName(x)}) được tìm thấy trước C${cn} (¬${varName(x)}), nên nó đứng sau trong thứ tự tô-pô: gán ${varName(x)} = true.`
          : `C${cn} (¬${varName(x)}) được tìm thấy trước C${cx} (${varName(x)}), nên ¬${varName(x)} đứng sau trong thứ tự tô-pô: gán ${varName(x)} = false.`;
      }
      case 'done':
        return f.sat
          ? `Có nghiệm: ${f.value.map((v, x) => `${varName(x)} = ${bool(v)}`).join(', ')}. Mệnh đề nào cũng có một literal đúng.`
          : `Vô nghiệm: các phép kéo theo buộc ${varName(f.variable)} phải bằng chính phủ định của nó.`;
    }
  },
  takeaways: [
    'Mệnh đề (a ∨ b) tương đương với hai phép kéo theo ¬a → b và ¬b → a. Mỗi literal một đỉnh và mỗi mệnh đề hai cạnh cho ta đồ thị kéo theo.',
    'Các literal trong cùng một thành phần liên thông mạnh kéo theo lẫn nhau, nên chúng phải cùng đúng hoặc cùng sai. Nếu x và ¬x chung một thành phần, công thức vô nghiệm; ngược lại, công thức có nghiệm.',
    'Để dựng phép gán, ta gán x đúng khi thành phần của x đứng sau thành phần của ¬x trong thứ tự tô-pô. Khi đó không literal đúng nào kéo theo một literal sai.',
    'Thuật toán Tarjan tìm các thành phần không có cạnh ra trước, nên “đứng sau trong thứ tự tô-pô” nghĩa là “được tìm thấy sớm hơn”: x đúng khi comp[x] < comp[¬x]. Cả lời giải tốn O(n + m) với n biến và m mệnh đề.',
    'Thử xem: thêm mệnh đề (¬x₁ ∨ ¬x₃) và xem x₁ chuyển thành sai; sau đó thêm (¬x₂ ∨ ¬x₃) thay vào, công thức trở nên vô nghiệm.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Đồ thị kéo theo',
      'O(n + m)',
      '2n đỉnh literal và tối đa 2m cạnh, chỉ cần duyệt các mệnh đề một lần.',
    ],
    ['Các SCC', 'O(n + m)', 'Chạy thuật toán Tarjan (hoặc Kosaraju) một lần trên đồ thị.'],
    ['Phép gán', 'O(n)', 'So hai số thứ tự thành phần cho mỗi biến.'],
    [
      'Bộ nhớ',
      'O(n + m)',
      'Đồ thị, cùng các nhãn và stack (ngăn xếp) của thuật toán Tarjan cho mỗi literal.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt: 'Mệnh đề (x₁ ∨ ¬x₂) thêm hai cạnh nào?',
      options: [
        'x₁ → ¬x₂ và ¬x₂ → x₁',
        '¬x₁ → ¬x₂ và x₂ → x₁',
        'x₁ → x₂ và x₂ → x₁',
        '¬x₁ → x₂ và ¬x₂ → ¬x₁',
      ],
      answer: 1,
      hints: ['Nếu x₁ sai thì literal nào phải đúng?'],
      solution:
        'Nếu x₁ sai thì ¬x₂ phải đúng: ¬x₁ → ¬x₂. Nếu ¬x₂ sai, tức x₂ đúng, thì x₁ phải đúng: x₂ → x₁.',
    },
    {
      type: 'number',
      prompt: 'Ví dụ có nghiệm có bao nhiêu thành phần liên thông mạnh?',
      answer: 4,
      unit: 'thành phần',
      hints: ['Đi từng bước cho tới khi bộ đếm “Số thành phần” thôi tăng.'],
      solution:
        'C1 = {¬x₄, x₃, x₂}, C2 = {x₁}, C3 = {¬x₁} và C4 = {¬x₃, x₄, ¬x₂}. C1 và C4 là ảnh phản chiếu của nhau, như các phủ định luôn vậy.',
    },
    {
      type: 'text',
      prompt:
        'Thuật toán báo phép gán nào cho ví dụ có nghiệm? Gõ bốn giá trị cho x₁ đến x₄, ví dụ T, F, F, T (T là đúng, F là sai).',
      accept: ['T, T, T, F', 'TTTF', 'true, true, true, false', '1, 1, 1, 0', '1110'],
      hints: ['So comp[x] với comp[¬x] cho mỗi biến: số nhỏ hơn thắng.'],
      solution:
        'x₁: C2 < C3, đúng. x₂: C1 < C4, đúng. x₃: C1 < C4, đúng. x₄: comp[x₄] = C4 > comp[¬x₄] = C1, sai. Vậy là T, T, T, F.',
    },
    {
      type: 'choice',
      prompt: 'Thêm mệnh đề (¬x₁ ∨ ¬x₃) vào ví dụ có nghiệm. Điều gì xảy ra?',
      options: [
        'Công thức trở nên vô nghiệm.',
        'x₁ thành sai; phần còn lại giữ nguyên.',
        'x₃ thành sai.',
        'Không có gì thay đổi.',
      ],
      answer: 1,
      hints: ['Các mệnh đề khác buộc x₃ đúng. Khi đó mệnh đề mới nói gì về x₁?'],
      solution:
        'Mọi phép gán thoả ví dụ đều có x₃ đúng, nên cạnh mới x₃ → ¬x₁ buộc x₁ sai. Lần chạy báo x₁ = false, x₂ = true, x₃ = true, x₄ = false, thoả mọi mệnh đề.',
    },
    {
      type: 'choice',
      prompt: 'Thay vào đó, thêm (¬x₂ ∨ ¬x₃) vào ví dụ có nghiệm. Điều gì xảy ra?',
      options: [
        'Có nghiệm với x₂ = false.',
        'Có nghiệm với x₃ = false.',
        'Vô nghiệm.',
        'Có nghiệm với mọi biến đều true.',
      ],
      answer: 2,
      hints: [
        '(¬x₂ ∨ x₃) và (¬x₂ ∨ ¬x₃) cùng nhau buộc x₂ sai. Hãy lần theo chuỗi kéo theo từ đó.',
      ],
      solution:
        'x₂ phải sai. Khi đó (x₄ ∨ x₂) buộc x₄, (¬x₃ ∨ ¬x₄) buộc ¬x₃, (x₁ ∨ x₃) buộc x₁, và (¬x₁ ∨ x₂) buộc x₂: mâu thuẫn. Cả tám literal rơi vào cùng một thành phần.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo là Luyện tập: bài toán đồ thị nâng cao, nơi em tìm nút mạng quan trọng và vòng phụ thuộc giữa các mô-đun.',
};
