/** @typedef {import('$lib/algo-engine/digit-dp.js').DigitFrame} DigitFrame */

/** @param {number} a @param {number} b */
const span = (a, b) => (a === b ? `tổng ${a}` : `các tổng ${a}..${b}`);

export const vi = {
  slug: 'digit-dp',
  topic: 'advanced-dp',
  level: 'Nâng cao',
  title: 'QHĐ chữ số',
  intro:
    'Có bao nhiêu số từ 0 đến N có tổng các chữ số đúng bằng S? Kiểm tra từng số tốn O(N), quá chậm khi N = 10¹⁸. QHĐ chữ số thay vào đó dựng các số theo từng chữ số, chỉ giữ những gì phần sau cần biết: tổng chữ số đến lúc này, và một cờ chặt (tight) cho biết tiền tố còn bằng tiền tố của N hay không. Khi còn chặt, chữ số tiếp theo bị giới hạn bởi chữ số tương ứng của N.',
  summary:
    'Đếm các số không vượt quá N có tổng chữ số cho trước bằng cách điền chữ số theo từng vị trí, với cờ chặt giới hạn mỗi chữ số bởi N.',
  instruction:
    'Nhập N và S, hoặc chọn một ví dụ, rồi chạy từng bước. Hàng trên cùng là N: ▲ đánh dấu tiền tố chặt vẫn còn bằng N. Hàng chữ số cho biết chữ số nào được phép đứng tiếp: ○ giữ tiền tố ở trạng thái lỏng, ▲ giữ nó chặt, ✕ bị chặn. Trong bảng, hàng i đếm các tiền tố lỏng gồm i chữ số theo tổng chữ số của chúng.',
  limitLabel: 'N',
  targetLabel: 'Tổng chữ số S',
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    small: 'N = 345, S = 10',
    round: 'N = 1000, S = 5',
    big: 'N = 52817, S = 14',
  },
  /** @param {number} max */
  limitError: (max) => `N phải là số nguyên từ 0 đến ${max}.`,
  /** @param {number} max */
  targetError: (max) => `S phải là số nguyên từ 0 đến ${max}.`,
  numberTitle: 'N, từng chữ số',
  /** @param {number} limit */
  numberAria: (limit) => `Các chữ số của N = ${limit}.`,
  /** @param {number} i @param {number} d @param {string} state */
  numberCell: (i, d, state) => `Vị trí ${i + 1}: chữ số ${d}${state ? `, ${state}` : ''}`,
  numberStates: { tight: 'vẫn chặt', current: 'đang điền', dead: 'tiền tố chặt đã bị loại' },
  choiceTitle: 'Chữ số tiếp theo',
  choiceAria: 'Các chữ số từ 0 đến 9 và chữ số nào được phép đứng tiếp.',
  /** @param {number} d @param {string} state */
  choiceCell: (d, state) => `Chữ số ${d}${state ? `: ${state}` : ''}`,
  choiceStates: {
    loose: 'được phép, tiền tố lỏng',
    tight: 'được phép, vẫn chặt',
    above: 'bị chặn, số sẽ vượt N',
    over: 'bị chặn, tổng sẽ vượt S',
  },
  tableTitle: 'Tiền tố lỏng cnt[s]',
  /** @param {number} len @param {number} target */
  tableAria: (len, target) =>
    `Bảng đếm các tiền tố lỏng, ${len + 1} hàng theo tổng chữ số từ 0 đến ${target}.`,
  /** @param {number} r */
  rowHead: (r) => `${r}`,
  tableNote:
    'Hàng i: các tiền tố gồm i chữ số đã nhỏ hơn N, đếm theo tổng chữ số. ▲ đánh dấu tiền tố chặt duy nhất, không được tính trong các số đếm.',
  /** @param {number} r @param {number} s @param {string} v @param {string} state */
  cellLabel: (r, s, v, state) =>
    `${r} chữ số, tổng ${s}: ${v === '' ? 'chưa điền' : v}${state ? `, ${state}` : ''}`,
  cellStates: {
    source: 'đang lan ra',
    target: 'nhận thêm',
    branch: 'nhận từ tiền tố chặt',
    tight: 'tiền tố chặt ở đây',
    answer: 'đáp án',
  },
  legend: {
    source: 'Đang lan ra',
    target: 'Nhận thêm số đếm',
    tight: 'Tiền tố chặt',
    over: 'Chữ số bị chặn',
    answer: 'Đáp án',
  },
  markers: { source: '●', target: '○', tight: '▲', over: '✕', answer: '★' },
  stats: {
    transitions: 'Số lựa chọn chữ số đã thử',
    answer: 'Số lượng số tìm được',
    brute: 'Số lượng số vét cạn phải kiểm tra',
    states: 'Số trạng thái trong bảng',
  },
  pending: '…',
  /** @param {DigitFrame} f */
  describe(f) {
    const D = f.digits[f.i];
    const len = f.digits.length;
    const S = f.target;
    switch (f.kind) {
      case 'start':
        return `Đếm các số từ 0 đến ${f.limit} có tổng chữ số bằng ${S}. Viết mỗi số với ${len} chữ số, thêm các số 0 ở đầu; chúng không làm tổng thay đổi.`;
      case 'init':
        return 'Trước chữ số đầu tiên, chưa có tiền tố lỏng nào. Tiền tố rỗng là tiền tố chặt, với tổng t = 0.';
      case 'position':
        return `Vị trí ${f.i + 1}: chữ số của N ở đây là ${D}. Mở một hàng mới cho các tiền tố gồm ${f.i + 1} chữ số.`;
      case 'spread': {
        const top = Math.min(f.s + 9, S);
        const cut =
          f.s + 9 > S
            ? ` Các tổng lớn hơn ${S} bị bỏ: thêm chữ số không bao giờ làm tổng nhỏ đi.`
            : '';
        return `Có ${f.from} tiền tố lỏng với tổng ${f.s}, đều đã nhỏ hơn N, nên mọi chữ số 0–9 đều được đứng tiếp: cộng ${f.from} vào ${span(f.s, top)}.${cut}`;
      }
      case 'branch': {
        const top = Math.min(f.s + D - 1, S);
        const reach = f.s > S ? 'không chữ số nào giữ tổng trong S' : `+1 vào ${span(f.s, top)}`;
        return `Tiền tố chặt (tổng ${f.s}) có thể nhận một chữ số nhỏ hơn ${D}, từ 0 đến ${D - 1}. Mỗi chữ số như vậy làm số nhỏ hơn N và tiền tố trở thành lỏng: ${reach}.`;
      }
      case 'stay': {
        const t = f.tight[f.i + 1];
        return t === null
          ? `Nhận đúng chữ số ${D} sẽ làm tổng chặt thành ${f.s + D} > ${S}, nên tiền tố chặt không thể đạt S nữa. Nó bị loại.`
          : `Hoặc tiền tố chặt nhận đúng chữ số ${D} và vẫn bằng tiền tố của N: t = ${f.s} + ${D} = ${t}.`;
      }
      case 'row':
        return `Hàng ${f.i + 1} đã xong: đến lúc này có ${f.table[f.i + 1][S] ?? 0} tiền tố lỏng có tổng bằng ${S}.`;
      case 'done': {
        const loose = f.table[len][S] ?? 0;
        return f.tight[len] === S
          ? `Có ${f.result ?? 0} số: ${loose} số lỏng có tổng ${S}, cộng thêm chính N, vì tiền tố chặt kết thúc với tổng ${S}.`
          : `Có ${f.result ?? 0} số từ 0 đến ${f.limit} có tổng chữ số ${S}: đó là giá trị cnt[${S}] ở hàng cuối.`;
      }
    }
  },
  takeaways: [
    'Dựng số theo từng vị trí, bắt đầu từ chữ số có nghĩa lớn nhất. Ta đếm tiền tố chứ không đếm số: mọi tiền tố có cùng trạng thái đều có cùng các khả năng phía sau.',
    'Cờ chặt cho biết tiền tố có còn bằng tiền tố của N hay không. Khi chặt: chữ số tiếp theo chỉ được tới chữ số của N, và chỉ đúng chữ số đó giữ cho tiền tố còn chặt. Khi lỏng: mọi chữ số 0–9 đều được phép, và tiền tố lỏng mãi mãi.',
    'Trạng thái ở đây là (vị trí, tổng chữ số, chặt). Có O(len · S) trạng thái, mỗi trạng thái 10 lựa chọn: khoảng 10 · 18 · 162 bước với N tới 10¹⁸, thay cho 10¹⁸ lần kiểm tra.',
    'Một đoạn L..R tính bằng hai lần đếm: f(R) − f(L − 1). Các tính chất khác chỉ làm đổi trạng thái: chữ số cuối cho điều kiện “không có hai chữ số kề nhau bằng nhau”, số dư cho điều kiện “chia hết cho 7”.',
    'Thử N = 999 và N = 1000 với cùng một S: thêm một chữ số làm có thêm một hàng, nhưng tiền tố chặt của 1000 bị loại ngay.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Thời gian', 'O(len · S · 10)', 'Mỗi vị trí lan tối đa S + 1 tổng lỏng qua 10 chữ số.'],
    [
      'Bộ nhớ',
      'O(S)',
      'Chỉ cần hàng hiện tại và hàng tiếp theo; trang này giữ tất cả để hiển thị.',
    ],
    ['Tiền tố chặt', 'O(len)', 'Một tiền tố, một tổng, tối đa 10 lựa chọn mỗi vị trí.'],
    ['Vét cạn', 'O(N · len)', 'Mọi số từ 0 đến N, mỗi số cộng từng chữ số.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Có bao nhiêu số từ 0 đến 345 có tổng chữ số bằng 10?',
      answer: 33,
      unit: 'số',
      hints: ['Nạp ví dụ đầu tiên và chạy tới bước cuối.'],
      solution:
        '33. Hàng cuối có 33 tiền tố lỏng với tổng 10, còn tiền tố chặt 3, 4 → 7 bị loại ở chữ số cuối vì 7 + 5 = 12 > 10, nên bản thân 345 không được tính.',
    },
    {
      type: 'number',
      prompt: 'Có bao nhiêu số từ 0 đến 1000 có tổng chữ số bằng 5?',
      answer: 21,
      unit: 'số',
      hints: ['Nạp N = 1000, S = 5.', 'Ba chữ số có tổng bằng 5: dùng phương pháp chia kẹo Euler.'],
      solution:
        '21. 1000 có tổng chữ số 1, nên chỉ 0..999 được tính: có C(7, 2) = 21 cách chọn ba chữ số có tổng bằng 5.',
    },
    {
      type: 'choice',
      prompt:
        'Tiền tố đến lúc này đang chặt và chữ số tiếp theo của N là 4. Những chữ số nào giữ cho nó còn chặt?',
      options: ['0, 1, 2 và 3', 'Chỉ 4', 'Mọi chữ số từ 0 đến 9', 'Từ 4 trở lên'],
      answer: 1,
      hints: ['Chặt nghĩa là bằng tiền tố của N.'],
      solution:
        'Chỉ có 4 giữ tiền tố bằng tiền tố của N. 0..3 làm nó nhỏ hơn nên nó thành lỏng; 5..9 sẽ vượt N nên bị chặn.',
    },
    {
      type: 'number',
      prompt:
        'Đếm các số từ 100 đến 345 có tổng chữ số bằng 10, dùng f(R) − f(L − 1). Biết f(99) bằng 9. Đáp án là bao nhiêu?',
      answer: 24,
      unit: 'số',
      hints: ['f(345) lấy từ ví dụ đầu tiên.', 'f(99) đếm 19, 28, …, 91.'],
      solution: 'f(345) − f(99) = 33 − 9 = 24.',
    },
    {
      type: 'text',
      prompt: 'QHĐ chữ số cần khoảng bao nhiêu bước cho N có len chữ số và tổng mục tiêu S?',
      accept: [
        'O(len·S·10)',
        'O(10·len·S)',
        'O(len*S*10)',
        'O(10*len*S)',
        'O(len S)',
        'O(len·S)',
        'O(len*S)',
        'O(S·len)',
        'O(S*len)',
      ],
      hints: ['Đếm số vị trí, số tổng và số lựa chọn chữ số.'],
      solution: 'len vị trí × (S + 1) tổng × 10 chữ số: O(len · S · 10).',
    },
  ],
  nextTeaser:
    'Bài sau tìm cách làm QHĐ chạy nhanh hơn: tối ưu quy hoạch động cắt bớt công thức chuyển nhờ cấu trúc của chính nó.',
};
