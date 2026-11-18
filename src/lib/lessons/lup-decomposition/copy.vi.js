/** @typedef {import('$lib/algo-engine/lup-decomposition.js').LupFrame} LupFrame */
/** @typedef {import('$lib/algo-engine/rational.js').Frac} Frac */

/** A fraction as text: 3, −7/5. @param {Frac} f */
const fracText = (f) => {
  const sign = f.num < 0 ? '−' : '';
  const top = Math.abs(f.num);
  return f.den === 1 ? `${sign}${top}` : `${sign}${top}/${f.den}`;
};

/** @param {(Frac | null)[]} v */
const vector = (v) => `(${v.map((f) => (f ? fracText(f) : '?')).join(', ')})`;

export const vi = {
  slug: 'lup-decomposition',
  topic: 'algebraic-randomised',
  level: 'Trung bình',
  title: 'Phép toán ma trận: phân tích LUP',
  intro:
    'Phép khử Gauss giải A·x = b bằng cách khử mọi phần tử nằm dưới chốt (pivot) trong từng cột. Nếu giữ lại các hệ số nhân đã dùng thay vì bỏ đi, ta phân tích được A thành một ma trận tam giác dưới L và một ma trận tam giác trên U. Ghi các lần đổi hàng vào một hoán vị P, ta có phân tích LUP P·A = L·U, tốn O(n³) một lần duy nhất; sau đó mỗi vế phải b chỉ cần hai lần thế trên ma trận tam giác, mất O(n²).',
  summary:
    'Phân tích ma trận thành P·A = L·U bằng khử Gauss có chọn chốt theo cột, rồi giải A·x = b bằng thế xuôi và thế ngược.',
  instruction:
    'Sửa A và b hoặc chọn một ví dụ, rồi chạy từng bước. Ở mỗi cột, ta chọn một chốt, đổi hàng chứa nó lên nếu cần, rồi khử các phần tử bên dưới; các hệ số nhân nằm lại đúng chỗ và tạo thành L. Sau đó thế xuôi tìm y và thế ngược tìm x. Tắt chọn chốt ở ví dụ “Cần đổi hàng” để xem LU thường thất bại nhé.',
  fields: { size: 'Cỡ n', pivoting: 'Chọn chốt' },
  pivotingOptions: { lup: 'Theo cột (LUP)', lu: 'Không (LU)' },
  presetLabel: 'Ví dụ',
  presets: {
    clrs: 'Ví dụ trong CLRS (3×3)',
    zeroPivot: 'Cần đổi hàng',
    twoByTwo: 'Ma trận nhỏ 2×2',
    fourByFour: 'LU thường vẫn chạy (4×4)',
    singular: 'Ma trận suy biến',
  },
  inputTitle: 'Hệ của em A · x = b',
  /** @param {number} r @param {number} c */
  cellAria: (r, c) => `A hàng ${r}, cột ${c}`,
  /** @param {number} r */
  rhsAria: (r) => `b hàng ${r}`,
  /** @param {number} max */
  entryError: (max) => `Mỗi phần tử phải là số nguyên từ −${max} đến ${max}.`,
  workTitle: 'Ma trận làm việc: L nằm dưới đường chéo, U nằm trên và trên đường chéo',
  /** @param {number} r @param {number} c @param {string} value @param {string} role */
  workCell: (r, c, value, role) => `Hàng ${r}, cột ${c}: ${value}${role ? `, ${role}` : ''}`,
  workAria: 'Ma trận làm việc',
  roles: {
    pivot: 'chốt',
    searched: 'ứng viên làm chốt',
    updated: 'vừa cập nhật',
    l: 'phần tử của L',
    u: 'phần tử của U',
    '': '',
  },
  markers: { pivot: '▲', searched: '?', updated: '✱', l: 'L', u: 'U', '': '' },
  legend: {
    pivot: '▲ Chốt',
    searched: '? Ứng viên làm chốt',
    updated: '✱ Hàng đang cập nhật',
    l: 'L Hệ số nhân (đã chốt)',
    u: 'U Hàng của U (đã chốt)',
  },
  vectorsTitle: 'Các vectơ',
  vectorNames: { perm: 'π', b: 'b', y: 'y', x: 'x' },
  vectorHints: {
    perm: 'hàng i của P·A là hàng π[i] của A',
    b: 'vế phải',
    y: 'nghiệm của L·y = P·b',
    x: 'nghiệm của U·x = y, nên A·x = b',
  },
  factorsTitle: 'Các nhân tử: P · A = L · U',
  factorNames: { P: 'P', L: 'L', U: 'U' },
  /** @param {string} name */
  factorAria: (name) => `Ma trận ${name}`,
  stats: {
    swaps: 'Số lần đổi hàng',
    factorOps: 'Số phép tính để phân tích',
    solveOps: 'Số phép tính để giải',
    column: 'Cột k',
  },
  noColumn: '—',
  fracText,
  /** @param {LupFrame} f */
  describe(f) {
    const n = f.size;
    switch (f.kind) {
      case 'start':
        return `Phân tích ma trận ${n}×${n} sao cho P·A = L·U, rồi giải A·x = b. ${f.pivoting ? 'Chọn chốt theo cột lấy phần tử có giá trị tuyệt đối lớn nhất trong mỗi cột làm chốt.' : 'Khi không chọn chốt, chốt luôn là phần tử trên đường chéo a[k][k].'}`;
      case 'pivot': {
        const value = fracText(f.a[f.row][f.k]);
        if (!f.pivoting)
          return `Cột ${f.k}: chốt là phần tử trên đường chéo a[${f.k}][${f.k}] = ${value}.`;
        return `Cột ${f.k}: |a[i][${f.k}]| lớn nhất với i ≥ ${f.k} là ${value}, ở hàng ${f.row}.${f.row === f.k ? ' Nó đã nằm trên đường chéo nên không cần đổi hàng.' : ''}`;
      }
      case 'stuck':
        return f.pivoting
          ? `Mọi phần tử của cột ${f.k} từ hàng ${f.k} trở xuống đều bằng 0, nên A suy biến: A không có ma trận nghịch đảo, và A·x = b không có nghiệm duy nhất.`
          : `Chốt a[${f.k}][${f.k}] bằng 0, nên LU thường không chia được cho nó và phải dừng. Chọn chốt theo cột sẽ đổi lên một phần tử khác 0 từ bên dưới, nếu có.`;
      case 'swap':
        return `Đổi chỗ hàng ${f.k} và hàng ${f.row}, rồi ghi lần đổi vào π = (${f.perm.join(', ')}).`;
      case 'eliminate': {
        const mult = fracText(/** @type {Frac} */ (f.multiplier));
        return `Hàng ${f.row}: l = a[${f.row}][${f.k}] / a[${f.k}][${f.k}] = ${mult}. Lấy hàng ${f.row} trừ ${mult} × hàng ${f.k} để khử cột ${f.k}, và cất l vào chỗ lẽ ra là số 0.`;
      }
      case 'factored':
        return `Phân tích xong: L gồm các hệ số nhân dưới đường chéo và các số 1 trên đường chéo, U là phần tam giác trên, và P·A = L·U.`;
      case 'forward':
        return `Thế xuôi, L·y = P·b: y[${f.row}] = b[π[${f.row}]] trừ đi các y phía trước nhân với hàng ${f.row} của L = ${fracText(/** @type {Frac} */ (f.y[f.row]))}.`;
      case 'back':
        return `Thế ngược, U·x = y: x[${f.row}] = (y[${f.row}] trừ đi các x phía sau nhân với hàng ${f.row} của U) / u[${f.row}][${f.row}] = ${fracText(/** @type {Frac} */ (f.x[f.row]))}.`;
      case 'done':
        if (f.failed)
          return f.pivoting
            ? 'Đã dừng: ma trận suy biến không có phân tích LUP với đường chéo của U khác 0, nên không có x duy nhất.'
            : 'Đã dừng vì gặp chốt bằng 0. Hãy chuyển sang chọn chốt theo cột rồi chạy lại.';
        return `x = ${vector(f.x)}. Phân tích tốn ${f.factorOps} phép tính (khoảng n³/3); giải tốn ${f.solveOps} phép tính (khoảng n²), nên với một b khác ta dùng lại L, U và P rất rẻ.`;
    }
  },
  takeaways: [
    'Khử Gauss xoá cột k bên dưới chốt bằng cách lấy mỗi hàng i trừ l = a[i][k] / a[k][k] lần hàng k. Các hàng đã khử cuối cùng tạo thành U, một ma trận tam giác trên.',
    'Mỗi hệ số nhân l được cất vào chỗ của số 0 nó tạo ra, bên dưới đường chéo. Các phần tử đó cùng các số 1 trên đường chéo tạo thành L, và A = L·U khi không có chốt nào bằng 0.',
    'Một chốt bằng 0 làm LU thường hỏng ngay cả với ma trận khả nghịch, còn một chốt rất nhỏ làm sai số làm tròn phình to. Chọn chốt theo cột đổi lên hàng có |a[i][k]| lớn nhất, ghi lần đổi vào π, nên P·A = L·U. Nếu cả cột bằng 0 thì A suy biến.',
    'Để giải A·x = b, giải L·y = P·b từ trên xuống, rồi U·x = y từ dưới lên. Phân tích tốn Θ(n³) một lần; mỗi lần giải chỉ tốn Θ(n²).',
    'Thử “Cần đổi hàng” khi tắt chọn chốt, rồi bật lên: cùng một ma trận khả nghịch, lúc đầu thất bại, sau đó phân tích được với hai lần đổi hàng.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Phân tích LUP',
      'Θ(n³)',
      'Cột k cập nhật một khối (n − k − 1)², tổng cộng khoảng n³/3 phép nhân.',
    ],
    ['Thế xuôi', 'Θ(n²)', 'Hàng i của L·y = P·b dùng i giá trị phía trên nó.'],
    ['Thế ngược', 'Θ(n²)', 'Hàng i của U·x = y dùng n − i − 1 giá trị phía dưới nó.'],
    ['Tìm chốt', 'Θ(n²)', 'Mỗi k quét một lần phần cột dưới đường chéo.'],
    ['Bộ nhớ', 'Θ(n²)', 'L và U dùng chung mảng của chính ma trận; π tốn thêm n số.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chọn ví dụ trong CLRS rồi chạy đến bước cuối. x[0] bằng bao nhiêu? Viết dưới dạng số thập phân.',
      answer: -1.4,
      tolerance: 0.001,
      hints: ['Đọc vectơ x ở bước cuối: x[0] được viết dưới dạng phân số, hãy chia ra.'],
      solution:
        'Nghiệm là x = (−7/5, 11/5, 3/5), nên x[0] = −7/5 = −1,4. Kiểm tra hàng 0: 1·(−7/5) + 2·(11/5) + 0 = 15/5 = 3.',
    },
    {
      type: 'number',
      prompt:
        'Chọn “Cần đổi hàng” với chọn chốt theo cột rồi chạy đến bước cuối. Có bao nhiêu lần đổi hàng?',
      answer: 2,
      unit: 'lần đổi',
      hints: ['Phần tử lớn nhất của cột 0 là 2, ở hàng 2. Sau đó xem cột 1 sau khi cập nhật.'],
      solution:
        'Cột 0 đổi hàng 2 lên (|2| lớn nhất). Sau khi khử, cột 1 có 1/2 ở hàng 1 và 2 ở hàng 2, nên lại đổi hàng: 2 lần đổi.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao LUP chọn phần tử có giá trị tuyệt đối lớn nhất làm chốt?',
      options: [
        'Chia cho một chốt bằng 0 hoặc rất nhỏ sẽ thất bại hoặc phóng đại sai số làm tròn',
        'Nó làm U đối xứng',
        'Nó giảm chi phí từ Θ(n³) xuống Θ(n²)',
        'Đó là cách duy nhất để L là ma trận tam giác dưới',
      ],
      answer: 0,
      hints: ['Mỗi hệ số nhân là a[i][k] chia cho chốt.'],
      solution:
        'Không thể chia cho một chốt bằng 0, còn một chốt rất nhỏ tạo ra hệ số nhân khổng lồ làm sai số làm tròn lớn lên. Chốt lớn nhất giữ mọi hệ số nhân trong đoạn [−1, 1].',
    },
    {
      type: 'text',
      prompt: 'Khi đã biết P, L và U, giải A·x = b với một b mới tốn bao nhiêu?',
      accept: ['Θ(n²)', 'O(n^2)', 'theta(n^2)', 'n^2'],
      hints: ['Hai lần giải hệ tam giác, mỗi hàng dùng các giá trị đã tìm trước nó.'],
      solution:
        'Thế xuôi và thế ngược, mỗi lần chạm vào mỗi phần tử của một tam giác đúng một lần: Θ(n²).',
    },
    {
      type: 'order',
      prompt: 'Sắp xếp các bước giải A·x = b bằng LUP theo đúng thứ tự.',
      items: ['Thế ngược: U·x = y', 'Phân tích P·A = L·U', 'Thế xuôi: L·y = P·b'],
      answer: [1, 2, 0],
      hints: ['Em cần có các nhân tử trước khi giải với chúng.'],
      solution:
        'Trước hết phân tích một lần, rồi giải hệ tam giác dưới để tìm y từ trên xuống, rồi giải hệ tam giác trên để tìm x từ dưới lên.',
    },
  ],
  nextTeaser:
    'Bài sau là quy hoạch tuyến tính và phương pháp đơn hình: đi từ đỉnh này sang đỉnh khác của miền chấp nhận được để tìm giá trị tốt nhất.',
};
