/** @typedef {import('$lib/algo-engine/algorithms-ram-model.js').RamFrame} RamFrame */
/** @typedef {import('$lib/algo-engine/algorithms-ram-model.js').RamProgram} RamProgram */

export const vi = {
  slug: 'algorithms-ram-model',
  topic: 'complexity',
  level: 'Cơ bản',
  title: 'Thuật toán và mô hình RAM',
  intro:
    'Thuật toán (algorithm) là một dãy hữu hạn các bước chính xác, biến mọi đầu vào hợp lệ thành đầu ra đúng. Để so sánh các thuật toán mà không cần bấm giờ, ta chạy chúng trên một chiếc máy tưởng tượng là máy RAM theo từ máy (word-RAM), nơi mỗi thao tác cơ bản tốn đúng một bước, rồi đếm số bước.',
  summary:
    'Đếm các bước cơ bản của một vòng lặp trên chiếc máy word-RAM đơn giản, và thấy rằng chương trình đúng và chương trình nhanh là hai mục tiêu khác nhau.',
  instruction:
    'Chọn một chương trình và một giá trị n, rồi chạy từng bước. Quan sát các ô nhớ được đọc (Đ) và được ghi (G), và tổng số bước tăng dần sau mỗi dòng.',
  nLabel: 'n',
  programLegend: 'Chương trình',
  programs: /** @type {Record<RamProgram, string>} */ ({
    loop: 'Vòng lặp',
    formula: 'Công thức',
    buggy: 'Vòng lặp lỗi',
  }),
  nError: 'n phải là số nguyên từ 0 đến 30.',
  memoryTitle: 'Bộ nhớ (mỗi biến một từ máy)',
  unset: '—',
  /** @param {string} name @param {string} value @param {string} state */
  cellLabel: (name, value, state) => `${name} = ${value}${state ? `, ${state}` : ''}`,
  states: { read: 'vừa đọc', write: 'vừa ghi' },
  markers: { read: 'Đ', write: 'G' },
  legend: { read: 'Được đọc ở bước này', write: 'Được ghi ở bước này' },
  stats: {
    assign: 'Phép gán',
    compare: 'Phép so sánh',
    arith: 'Phép tính số học',
    ret: 'Lệnh trả về',
    total: 'Tổng số bước cơ bản',
  },
  /** @param {number} d */
  thisStep: (d) => `Bước này: +${d}`,
  formulaTitle: 'Số bước của chương trình này',
  /** @type {Record<RamProgram, string>} */
  formulas: { loop: '5n + 4', formula: '5 (không phụ thuộc n)', buggy: '5n − 1 (n ≥ 1)' },
  /** @param {number} n @param {number} ops */
  atN: (n, ops) => `n = ${n}: ${ops} bước`,
  resultTitle: 'Kiểm tra kết quả',
  /** @param {number} expected */
  expectedLine: (expected) => `Đáp án đúng 1 + … + n = ${expected}`,
  /** @param {number} got @param {boolean} ok */
  resultLine: (got, ok) => (ok ? `Trả về ${got}: đúng ✓` : `Trả về ${got}: sai ✗`),
  pending: 'Chưa trả về.',
  practiceTitle: 'Tự kiểm tra',
  /** @param {RamFrame} f */
  describe(f) {
    const v = f.vars;
    switch (f.kind) {
      case 'start':
        return f.program === 'formula'
          ? `Gọi sumTo(${f.n}). Bản dùng công thức không có vòng lặp.`
          : `Gọi sumTo(${f.n}). Bộ nhớ đang giữ n = ${f.n}; s và i chưa có giá trị.`;
      case 'init-s':
        return 'Gán s = 0: một phép gán.';
      case 'init-i':
        return 'Gán i = 1: một phép gán.';
      case 'test': {
        const op = f.program === 'loop' ? '≤' : '<';
        return f.test
          ? `Kiểm tra ${v.i} ${op} ${f.n}: đúng, nên ta chạy thân vòng lặp. Một phép so sánh.`
          : `Kiểm tra ${v.i} ${op} ${f.n}: sai, nên ta thoát vòng lặp. Một phép so sánh.`;
      }
      case 'add':
        return `s = s + i cho s = ${v.s}: một phép cộng và một phép gán.`;
      case 'step':
        return `i = i + 1 cho i = ${v.i}: một phép cộng và một phép gán.`;
      case 'compute':
        return `s = ${f.n} × ${f.n + 1} / 2 = ${v.s}: ba phép tính số học và một phép gán, dù n bằng bao nhiêu.`;
      case 'return':
        return `Trả về s = ${v.s}: một bước.`;
      case 'done':
        return `Xong sau ${f.total} bước cơ bản.`;
    }
  },
  takeaways: [
    'Thuật toán là một dãy hữu hạn các bước chính xác, rõ ràng, luôn kết thúc với đầu ra đúng cho mọi đầu vào hợp lệ.',
    'Mô hình word-RAM tính một bước cho mỗi thao tác cơ bản trên một từ máy dài ít nhất log₂ n bit: phép gán, phép so sánh, phép tính số học, một lần đọc bộ nhớ hay một lệnh nhảy. Chiếc máy đơn giản này gộp mỗi lần đọc biến vào thao tác dùng biến đó. Đếm số bước giúp đo thuật toán mà không phụ thuộc vào máy tính cụ thể.',
    'Vòng lặp tốn 5n + 4 bước, nên chi phí của nó tăng tỉ lệ với n; công thức thì luôn tốn 5 bước.',
    'Tính đúng đắn phải đặt lên trước: vòng lặp lỗi còn nhanh hơn một chút, nhưng nó trả về đáp án sai, nên tốc độ đó chẳng có giá trị gì.',
    'Thử n = 30 với Vòng lặp, rồi với Công thức: 154 bước so với 5 bước, và khoảng cách còn nới rộng thêm với mỗi lần tăng n.',
  ],
  complexityHead: ['Chương trình', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Vòng lặp, thời gian', 'O(n)', 'Thân vòng lặp chạy n lần; mỗi lượt tốn 5 bước.'],
    ['Công thức, thời gian', 'O(1)', 'Năm bước, dù n bằng bao nhiêu.'],
    ['Cả hai, bộ nhớ', 'O(1)', 'Một số cố định các từ máy: n, s và i.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chương trình Vòng lặp tốn bao nhiêu bước cơ bản khi n = 7? Hãy đếm mọi phép gán, phép so sánh, phép tính số học và lệnh trả về.',
      answer: 39,
      unit: 'bước',
      hints: [
        'Có hai phép gán trước vòng lặp và một lệnh trả về sau vòng lặp.',
        'Phép kiểm tra chạy n + 1 = 8 lần; mỗi lượt trong 7 lượt có 2 phép cộng và 2 phép gán.',
      ],
      solution: '2 + 8 lần kiểm tra + 7 × 4 + 1 = 39 bước, khớp với 5n + 4 = 5 × 7 + 4.',
    },
    {
      type: 'multi',
      prompt: 'Trong mô hình word-RAM, những thao tác nào dưới đây tốn đúng một bước?',
      options: [
        'Cộng hai từ máy',
        'So sánh hai từ máy',
        'Đọc A[i] từ bộ nhớ',
        'Sắp xếp một mảng gồm n từ máy',
      ],
      answers: [0, 1, 2],
      hints: ['Một bước là một thao tác cơ bản của máy trên một số cố định các từ máy.'],
      solution:
        'Cộng, so sánh và đọc một từ máy là các thao tác cơ bản. Sắp xếp n từ máy là cả một thuật toán gồm nhiều bước, nên không thể tính là một bước.',
    },
    {
      type: 'choice',
      prompt:
        'Với n = 10, vòng lặp lỗi tốn 49 bước còn vòng lặp đúng tốn 54 bước. Bạn nên dùng chương trình nào?',
      options: [
        'Vòng lặp lỗi, vì nó nhanh hơn',
        'Vòng lặp đúng, vì một đáp án sai dù nhanh cũng vô ích',
        'Cái nào cũng được, vì cả hai đều là O(n)',
      ],
      answer: 1,
      hints: ['So sánh xem mỗi chương trình trả về gì khi n = 10.'],
      solution:
        'Vòng lặp lỗi trả về 45 thay vì 55. Hiệu quả chỉ đáng bàn giữa các thuật toán đúng, nên hãy dùng vòng lặp đúng (hoặc tốt hơn nữa là công thức).',
    },
  ],
  nextTeaser:
    'Đếm từng bước thì quá chi li. Bài sau, Kí hiệu tiệm cận: O lớn, Omega, Theta, chỉ giữ lại tốc độ tăng của chi phí.',
};
