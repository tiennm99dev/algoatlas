/** @typedef {import('$lib/algo-engine/linear-programming.js').LpFrame} LpFrame */
/** @typedef {import('$lib/algo-engine/linear-programming.js').Constraint} Constraint */
/** @typedef {import('$lib/algo-engine/rational.js').Frac} Frac */

const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/** A fraction as text: 3, −7/5. @param {Frac} f */
const fracText = (f) => {
  const sign = f.num < 0 ? '−' : '';
  const top = Math.abs(f.num);
  return f.den === 1 ? `${sign}${top}` : `${sign}${top}/${f.den}`;
};

/** x, y, then the slacks s₁, s₂, … @param {number} j */
const varName = (j) => (j === 0 ? 'x' : j === 1 ? 'y' : `s${SUB[j - 1]}`);

/** a₁x + a₂y as text, skipping zero terms: 3x + 2y, x − y, 4y. @param {number} p @param {number} q */
const linear = (p, q) => {
  const terms = [
    { k: p, v: 'x' },
    { k: q, v: 'y' },
  ].filter((t) => t.k !== 0);
  if (terms.length === 0) return '0';
  return terms
    .map((t, i) => {
      const size = Math.abs(t.k) === 1 ? '' : String(Math.abs(t.k));
      const sign = t.k < 0 ? (i === 0 ? '−' : ' − ') : i === 0 ? '' : ' + ';
      return `${sign}${size}${t.v}`;
    })
    .join('');
};

/** @param {Frac} x @param {Frac} y */
const point = (x, y) => `(${fracText(x)}, ${fracText(y)})`;

export const vi = {
  slug: 'linear-programming',
  topic: 'algebraic-randomised',
  level: 'Nâng cao',
  title: 'Quy hoạch tuyến tính và phương pháp đơn hình',
  intro:
    'Một bài toán quy hoạch tuyến tính (linear programming) tìm giá trị lớn nhất của một hàm mục tiêu tuyến tính như 3x + 2y trên tập các điểm thoả một danh sách bất đẳng thức tuyến tính, gọi là miền chấp nhận được. Miền đó là một đa giác lồi (một khối đa diện khi có nhiều chiều hơn), và luôn có một điểm tối ưu nằm ở một đỉnh. Phương pháp đơn hình bắt đầu ở một đỉnh rồi xoay theo các cạnh sang một đỉnh kề tốt hơn, cho đến khi không cạnh nào làm hàm mục tiêu tăng nữa.',
  summary:
    'Tìm giá trị lớn nhất của hàm mục tiêu tuyến tính trên một đa giác chấp nhận được bằng phương pháp đơn hình, xoay từ đỉnh này sang đỉnh khác, rồi đọc giá đối ngẫu từ bảng đơn hình cuối cùng.',
  instruction:
    'Sửa hàm mục tiêu và các ràng buộc hoặc chọn một ví dụ, rồi chạy từng bước. Đa giác tô màu là miền chấp nhận được; mỗi phép xoay đưa dấu ★ sang một đỉnh kề theo một cạnh, và đường nét đứt là đường mức z = hằng số đi qua đỉnh đó. Hãy xem hàng chi phí rút gọn chọn biến vào, còn cột tỉ số chọn biến ra.',
  fields: { c1: 'c₁ (x)', c2: 'c₂ (y)' },
  objectiveTitle: 'Tìm max z = c₁x + c₂y',
  constraintsTitle: 'Với các ràng buộc (x, y ≥ 0)',
  /** @param {number} i */
  constraintAria: (i) => `Ràng buộc ${i + 1}`,
  coefLabels: { a1: 'a₁', a2: 'a₂', b: 'b' },
  /** @param {number} i @param {string} part */
  coefAria: (i, part) => `Ràng buộc ${i + 1}, ${part}`,
  addConstraint: 'Thêm ràng buộc',
  /** @param {number} i */
  removeConstraint: (i) => `Bỏ ràng buộc ${i + 1}`,
  removeText: 'Bỏ',
  presetLabel: 'Ví dụ',
  presets: {
    classic: 'Ba ràng buộc',
    degenerate: 'Khởi đầu suy biến',
    flat: 'Nhiều điểm tối ưu',
    unbounded: 'Không bị chặn',
    single: 'Một ràng buộc',
  },
  /** @param {number} max */
  coefError: (max) => `Các hệ số phải là số nguyên từ −${max} đến ${max}.`,
  /** @param {number} max */
  rhsError: (max) =>
    `Mỗi b phải là số nguyên từ 0 đến ${max}, để gốc toạ độ là một đỉnh chấp nhận được.`,
  /** @param {number} max */
  tooMany: (max) => `Bài này giữ nhiều nhất ${max} ràng buộc để hình vẽ vẫn dễ đọc.`,
  tooFew: 'Cần ít nhất một ràng buộc.',
  planeTitle: 'Miền chấp nhận được và đường đi của phương pháp đơn hình',
  /** @param {number} n */
  planeAria: (n) => `Miền chấp nhận được có ${n} đỉnh`,
  /** @param {string} name @param {Frac} x @param {Frac} y @param {string} role */
  cornerLabel: (name, x, y, role) => `Đỉnh ${name} ${point(x, y)}${role ? `, ${role}` : ''}`,
  cornerRoles: { now: 'đỉnh hiện tại', visited: 'đã thăm', best: 'tối ưu', '': '' },
  cornerMarkers: { now: '★', best: '★' },
  /** @param {Frac} x @param {Frac} y */
  cornerNote: (x, y) => point(x, y),
  /** @param {number} i */
  lineLabel: (i) => String(i + 1),
  /** @param {Frac} z */
  levelLabel: (z) => `z = ${fracText(z)}`,
  legend: {
    region: 'Miền chấp nhận được',
    now: '★ Đỉnh hiện tại',
    path: '→ Đường đi đơn hình',
    best: '★ Đỉnh tối ưu',
    level: '- - Đường mức z = hằng số',
  },
  tableauTitle: 'Bảng đơn hình',
  tableauHead: { basis: 'Cơ sở', b: 'b', ratio: 'b / aₑ' },
  costRow: 'Chi phí rút gọn',
  zCell: 'z',
  noRatio: '—',
  markers: { enter: '↓', leave: '←', pivot: '●' },
  tableauLegend: '↓ cột biến vào · ← hàng biến ra · ● phần tử xoay',
  stats: { z: 'Mục tiêu z', corner: 'Đỉnh (x, y)', pivots: 'Số phép xoay', status: 'Trạng thái' },
  status: { running: 'đang tìm', optimal: 'tối ưu', unbounded: 'không bị chặn' },
  dualTitle: 'Tính đối ngẫu',
  /** @param {Constraint[]} cons */
  dualProblem: (cons) =>
    `Bài toán đối ngẫu: tìm min ${cons.map((c, i) => `${c.b}·y${SUB[i + 1]}`).join(' + ')} với Aᵀy ≥ c, y ≥ 0.`,
  /** @param {Frac[]} dual @param {Frac} z */
  dualValues: (dual, z) =>
    `y = (${dual.map(fracText).join(', ')}), và b·y = ${fracText(z)} = z: hai giá trị mục tiêu bằng nhau chứng tỏ cả hai lời giải đều tối ưu.`,
  dualPending: 'Giá đối ngẫu hiện ra khi phương pháp dừng ở một điểm tối ưu.',
  dualNone:
    'Bài toán gốc không bị chặn thì bài toán đối ngẫu vô nghiệm: không bộ giá nào chặn được z.',
  fracText,
  varName,
  linear,
  /** @param {Constraint} c */
  constraintText: (c) => `${linear(c.a1, c.a2)} ≤ ${c.b}`,
  /** @param {LpFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `Tìm max z = ${linear(f.c[0], f.c[1])}. Bắt đầu ở đỉnh (0, 0): x và y bằng 0, và mỗi biến bù sᵢ = bᵢ chiếm trọn ràng buộc của nó. z = 0.`;
      case 'enter': {
        const v = varName(f.entering);
        return `${v} có chi phí rút gọn dương lớn nhất, ${fracText(f.cost[f.entering])}: mỗi đơn vị ${v} làm z tăng chừng ấy. ${v} vào cơ sở.`;
      }
      case 'leave': {
        const ratio = /** @type {Frac} */ (f.ratios[f.leaving]);
        const out = varName(f.basis[f.leaving]);
        const zero = ratio.num === 0;
        return `Phép thử tỉ số: ${varName(f.entering)} tăng được cho đến khi một biến cơ sở chạm 0. Tỉ số nhỏ nhất là ${fracText(ratio)}, ở hàng ${f.leaving + 1}, nên ${out} ra khỏi cơ sở.${zero ? ' Tỉ số bằng 0: một phép xoay suy biến đổi cơ sở nhưng không đổi đỉnh.' : ''}`;
      }
      case 'pivot':
        return `Xoay: ${varName(f.entering)} vào và ${varName(f.left)} ra. Các hàng được biến đổi để cột của ${varName(f.entering)} thành cột đơn vị. Giờ ta ở đỉnh ${point(f.x, f.y)} với z = ${fracText(f.z)}.`;
      case 'optimal': {
        const tie = f.cost.some((cst, j) => cst.num === 0 && !f.basis.includes(j));
        return `Không chi phí rút gọn nào dương, nên không cạnh nào từ đỉnh này làm z tăng: ${point(f.x, f.y)} là tối ưu với z = ${fracText(f.z)}.${tie ? ' Một biến ngoài cơ sở có chi phí rút gọn bằng 0 nghĩa là một đỉnh kề cũng cho cùng giá trị.' : ''}`;
      }
      case 'unbounded':
        return `${varName(f.entering)} sẽ làm z tăng, nhưng cột của nó không có phần tử dương nào, nên không ràng buộc nào chặn được nó: z tăng mãi dọc theo cạnh đó.`;
      case 'done':
        return f.status === 'optimal'
          ? `Tối ưu z = ${fracText(f.z)} tại ${point(f.x, f.y)} sau ${f.pivots} phép xoay. Giá đối ngẫu y = (${(f.dual ?? []).map(fracText).join(', ')}) cũng cho b·y = ${fracText(f.z)}.`
          : 'Bài toán không bị chặn: nó không có giá trị lớn nhất.';
    }
  },
  takeaways: [
    'Mỗi bất đẳng thức a₁x + a₂y ≤ b giữ lại một nửa mặt phẳng; cùng với x, y ≥ 0, chúng cắt ra một miền chấp nhận được lồi. Các đường mức z = hằng số song song với nhau, nên điểm tốt nhất là chỗ đường mức cuối cùng rời khỏi miền: một đỉnh.',
    'Phương pháp đơn hình thêm một biến bù sᵢ ≥ 0 vào mỗi ràng buộc để biến nó thành phương trình. Một cơ sở (mỗi hàng một biến) ứng với một đỉnh; hàng chi phí rút gọn cho biết biến ngoài cơ sở nào sẽ làm z tăng.',
    'Một phép xoay đưa vào biến có chi phí rút gọn dương và, nhờ phép thử tỉ số, bỏ ra hàng cạn trước tiên. Ta đi theo một cạnh sang đỉnh kề có z không nhỏ hơn; tỉ số bằng 0 cho một phép xoay suy biến đứng yên tại chỗ.',
    'Có những đầu vào buộc phương pháp xoay số lần theo hàm mũ, nhưng trong thực tế phương pháp đơn hình chỉ cần ít phép xoay. Chi phí rút gọn cuối cùng của các biến bù, đổi dấu, chính là giá đối ngẫu y: b·y bằng z tối ưu (đối ngẫu mạnh), một bằng chứng rằng đáp án là tối ưu.',
    'Thử “Không bị chặn”, rồi đổi c₁ thành −3: cùng miền đó giờ có điểm tối ưu tại (0, 2), vì hàm mục tiêu không còn hướng theo một cạnh dài vô tận.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Một phép xoay',
      'O(m·(n + m))',
      'Mỗi phần tử của bảng m hàng, n + m cột được cập nhật một lần.',
    ],
    [
      'Số phép xoay',
      'hàm mũ trong trường hợp xấu nhất',
      'Khối lập phương Klee–Minty đi qua cả 2ⁿ đỉnh, nhưng đầu vào thường gặp chỉ cần vài lần m phép xoay.',
    ],
    [
      'Phương pháp đa thức',
      'đa thức',
      'Phương pháp ellipsoid và phương pháp điểm trong giải quy hoạch tuyến tính trong thời gian đa thức.',
    ],
    ['Bộ nhớ', 'O(m·(n + m))', 'Bảng đơn hình, mỗi ràng buộc thêm một cột biến bù.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Chọn “Ba ràng buộc” rồi chạy đến bước cuối. z tối ưu bằng bao nhiêu?',
      answer: 11,
      hints: ['Đường đi là (0, 0) → (3, 0) → (3, 1). Tính 3x + 2y tại đỉnh cuối.'],
      solution:
        'z = 3·3 + 2·1 = 11 tại (3, 1). Mọi đỉnh khác cho giá trị nhỏ hơn: (3/2, 5/2) cho 19/2.',
    },
    {
      type: 'number',
      prompt:
        'Trong “Ba ràng buộc”, phép thử tỉ số đầu tiên so sánh b / a của x ở từng hàng. Tỉ số nhỏ nhất là bao nhiêu?',
      answer: 3,
      hints: ['Các hàng là x + y ≤ 4, x + 3y ≤ 9 và x ≤ 3, nên các tỉ số là 4/1, 9/1 và 3/1.'],
      solution: 'min(4, 9, 3) = 3, từ x ≤ 3, nên biến bù s₃ của hàng đó ra và x trở thành 3.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao phương pháp đơn hình chỉ cần xét các đỉnh của miền chấp nhận được?',
      options: [
        'Hàm mục tiêu tuyến tính trên một đa giác lồi đạt giá trị lớn nhất tại một đỉnh, nếu giá trị đó tồn tại',
        'Hàm mục tiêu không xác định bên trong miền',
        'Đỉnh là những điểm duy nhất có toạ độ nguyên',
        'Các cạnh của miền không bao giờ chấp nhận được',
      ],
      answer: 0,
      hints: ['Hình dung đường mức z = hằng số trượt ngang qua đa giác.'],
      solution:
        'Các đường mức song song với nhau, và đường cuối cùng còn chạm đa giác thì chạm nó tại một đỉnh (hoặc dọc cả một cạnh, mà cạnh đó cũng chứa đỉnh). Vì vậy chỉ cần kiểm tra các đỉnh.',
    },
    {
      type: 'multi',
      prompt: 'Chọn “Khởi đầu suy biến” rồi chạy qua từng bước. Những khẳng định nào đúng?',
      options: [
        'Phép xoay đầu tiên vẫn đứng ở đỉnh (0, 0)',
        'Điểm tối ưu là (2, 2) với z = 6',
        'Phương pháp không cần phép xoay nào',
        'Giá đối ngẫu là (1/2, 3/2)',
      ],
      answers: [0, 1, 3],
      hints: ['Ràng buộc x − y ≤ 0 có b = 0, nên tỉ số của nó với x bằng 0.'],
      solution:
        'x vào với tỉ số 0 từ x − y ≤ 0, một phép xoay suy biến giữ x = 0. Sau đó y vào và đường đi đến (2, 2) với z = 2·2 + 2 = 6. Giá đối ngẫu là (1/2, 3/2), và 0·1/2 + 4·3/2 = 6.',
    },
    {
      type: 'text',
      prompt:
        'Với “Ba ràng buộc”, giá đối ngẫu là y = (2, 0, 1). Ràng buộc nào không chặt tại điểm tối ưu? Trả lời bằng bất đẳng thức của nó, ví dụ x + y ≤ 4.',
      accept: ['x + 3y ≤ 9', 'x+3y≤9', 'x + 3y <= 9', 'ràng buộc 2', 'ràng buộc thứ hai'],
      hints: [
        'Độ lệch bù: ràng buộc có giá đối ngẫu dương phải chặt, còn ràng buộc còn dư thì có giá 0.',
      ],
      solution:
        'Tại (3, 1), x + 3y = 6 < 9, nên ràng buộc thứ hai còn dư và giá đối ngẫu của nó bằng 0. Hai ràng buộc kia chặt: 3 + 1 = 4 và x = 3.',
    },
  ],
  nextTeaser:
    'Bài sau là thuật toán ngẫu nhiên: tung đồng xu để chọn chốt, và vì sao điều đó giữ thời gian chạy kì vọng ở mức O(n log n).',
};
