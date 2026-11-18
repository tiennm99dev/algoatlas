/** @typedef {import('$lib/algo-engine/binary-search-on-answer.js').AnswerFrame} AnswerFrame */

export const vi = {
  slug: 'binary-search-on-answer',
  topic: 'searching',
  level: 'Trung bình',
  title: 'Tìm kiếm nhị phân trên đáp án',
  intro:
    'Đôi khi không có mảng đã sắp xếp nào để tìm, chỉ có một câu hỏi trả lời có hoặc không: “tải trọng c có làm được không?”. Khi mọi c lớn hơn một giá trị làm được cũng làm được, các câu trả lời tạo thành một dải ô sai rồi tới các ô đúng, và tìm kiếm nhị phân tìm ra ranh giới mà không phải thử từng c.',
  summary:
    'Tìm tải trọng xe nhỏ nhất chở hết mọi kiện hàng trong D ngày, bằng cách chia đôi khoảng tải trọng với một phép kiểm tra khả thi.',
  instruction:
    'Các kiện hàng đi theo đúng thứ tự, mỗi ngày một chuyến xe. Sửa khối lượng hoặc số ngày D, rồi chạy từng bước: mỗi bước thử tải trọng ở giữa bằng một cách xếp hàng tham lam và bỏ đi một nửa dải. Đánh dấu “Hiện mọi đáp án” để thấy cả dải sai rồi đúng.',
  takeaways: [
    'Ta tìm trên các giá trị chứ không phải trên vị trí: ứng viên là các tải trọng từ max(w) đến sum(w), và không cần dựng mảng nào chứa chúng.',
    'Cách này đúng vì vị từ đơn điệu (monotone predicate). Nếu tải trọng c chở hết trong D ngày thì mọi c′ > c cũng vậy, nên dải gồm toàn sai, rồi toàn đúng.',
    'Mỗi bước tốn một phép kiểm tra khả thi, ở đây là cách xếp hàng tham lam (greedy) O(n). Ta chỉ cần khoảng log₂(sum(w) − max(w) + 1) lần kiểm tra thay vì một lần cho mỗi tải trọng.',
    'Chọn hai đầu sao cho đầu thấp có thể không đạt còn đầu cao chắc chắn đạt, rồi giữ bất biến đó: hi = mid khi mid đạt, lo = mid + 1 khi mid không đạt.',
    'Thử khối lượng 15, 15, 15, 15, 15, 15, 15, 15, 15, 15 với D = 1: có 136 ứng viên, mà chỉ 7 lần kiểm tra đã tìm ra 150.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Một lần kiểm tra khả thi', 'O(n)', 'Cách xếp tham lam đọc mỗi kiện hàng một lần.'],
    [
      'Tìm kiếm nhị phân trên tải trọng',
      'O(n log S)',
      'Nhiều nhất khoảng log₂ S lần kiểm tra: khoảng từ max(w) đến sum(w) có không quá S = sum(w) tải trọng.',
    ],
    [
      'Thử lần lượt mọi tải trọng tăng dần',
      'O(n · S)',
      'Có thể tới S lần kiểm tra trước giá trị đúng đầu tiên.',
    ],
    ['Bộ nhớ', 'O(1)', 'lo, hi, mid và khối lượng đang chất.'],
  ],
  nextTeaser:
    'Nếu hàm không đơn điệu mà tăng rồi giảm, ta vẫn thu hẹp được khoảng tìm bằng hai điểm thử. Bài sau là Tìm kiếm tam phân.',
  weightsLabel: 'Khối lượng kiện hàng',
  daysLabel: 'Số ngày D',
  tryLabel: 'Thử một tải trọng',
  newParcels: 'Kiện hàng mới',
  revealLabel: 'Hiện mọi đáp án',
  valueErrors: {
    format: 'Hãy nhập các số nguyên cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 7, 2, 5.',
    range: 'Mọi khối lượng phải từ 1 đến 15.',
    count: 'Hãy nhập từ 1 đến 10 khối lượng.',
  },
  /** @param {number} n */
  daysError: (n) => `D phải là số nguyên từ 1 đến ${n}, tức số kiện hàng.`,
  /** @param {number} lo @param {number} hi */
  tryError: (lo, hi) => `Hãy thử một tải trọng từ ${lo} đến ${hi}.`,
  stripTitle: 'feasible(c) với mọi tải trọng ứng viên c',
  /** @param {number} lo @param {number} hi @param {number} wlo @param {number} whi */
  stripLabel: (lo, hi, wlo, whi) =>
    `Tải trọng từ ${lo} đến ${hi}. Còn khả năng: ${wlo} đến ${whi}. Dưới ${wlo} không đạt, từ ${whi} trở lên đạt.`,
  legend: {
    active: 'Tải trọng đang thử (mid)',
    no: 'Không đạt: dưới lo',
    yes: 'Đạt: từ hi trở lên',
    sorted: 'Nhỏ nhất mà đạt',
    tested: 'Đã kiểm tra',
    revealed: 'Hiện ra nhờ “Hiện mọi đáp án”',
  },
  markers: { no: '✕', yes: '✓', tested: '●' },
  packTitle: 'Kiểm tra khả thi',
  /** @param {number} c */
  packHeading: (c) => `Xếp hàng tham lam với tải trọng ${c}`,
  packEmpty: 'Cách xếp hàng sẽ hiện ra khi một tải trọng được kiểm tra.',
  /** @param {number} day @param {number[]} parcels @param {number} c */
  dayLabel: (day, parcels, c) =>
    `Ngày ${day}: ${parcels.join(' + ')} = ${parcels.reduce((s, x) => s + x, 0)} trên ${c}`,
  /** @param {number} used @param {number} limit @param {boolean} ok */
  verdict: (used, limit, ok) =>
    `${used} ngày ${ok ? '≤' : '>'} D = ${limit}: ${ok ? '✓ đạt' : '✕ không đạt'}`,
  dayShort: 'Ngày',
  stats: {
    checks: 'Số lần kiểm tra khả thi',
    reads: 'Số lần đọc kiện hàng',
    linear: 'Số lần kiểm tra nếu thử dần từ max(w)',
    range: 'Số tải trọng ứng viên',
  },
  pending: '—',
  testedTitle: 'Các tải trọng đã thử',
  testedEmpty: 'Chưa có',
  /** @param {number} cap @param {boolean} ok */
  testedChip: (cap, ok) => `${cap} ${ok ? '✓' : '✕'}`,
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Các kiện hàng ban đầu 7, 2, 5, 10, 8, 4, 9, 3 với D = 3. Lần tìm thực hiện bao nhiêu lần kiểm tra khả thi?',
      answer: 5,
      unit: 'lần',
      hints: [
        'Chạy tới bước cuối rồi đọc thẻ Số lần kiểm tra khả thi.',
        'Khoảng 10 đến 48 có 39 tải trọng, và ⌈log₂ 39⌉ = 6 là số lần nhiều nhất có thể cần.',
      ],
      solution:
        'Lần tìm thử 29 ✓, 19 ✓, 14 ✕, 17 ✕ và 18 ✓: 5 lần kiểm tra. Thử dần từ 10 trở lên thì cần 9 lần mới tới 18.',
    },
    {
      type: 'number',
      prompt:
        'Giữ nguyên các kiện hàng và đặt D = 2. Tải trọng nhỏ nhất chở hết mọi kiện là bao nhiêu?',
      answer: 24,
      hints: [
        'Đổi Số ngày D thành 2 rồi chạy tới bước cuối.',
        'Hai ngày nghĩa là chia hàng thành một phần trái và một phần phải; phần nặng hơn quyết định đáp án.',
      ],
      solution:
        '24: ngày 1 chở 7 + 2 + 5 + 10 = 24 và ngày 2 chở 8 + 4 + 9 + 3 = 24. Với tải trọng 23, cách xếp tham lam cần tới ngày thứ ba.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao lần tìm có thể bắt đầu từ lo = max(w) thay vì từ 1?',
      options: [
        'Tải trọng nhỏ hơn kiện nặng nhất không bao giờ chở được kiện đó, nên mọi c như thế đều không đạt.',
        'Vì max(w) luôn là đáp án.',
        'Vì tìm kiếm nhị phân cần lo là một luỹ thừa của 2.',
        'Vì vị từ luôn sai tại max(w).',
      ],
      answer: 0,
      hints: [
        'Đặt D bằng số kiện hàng và xem đáp án trở thành gì.',
        'Nếu c nhỏ hơn kiện nặng nhất thì kiện đó sẽ ra sao?',
      ],
      solution:
        'Không ngày nào chở được kiện nặng hơn c, nên mọi c < max(w) đều không khả thi. Bản thân max(w) có thể đạt (khi D lớn) hoặc không, nên nó là một đầu thấp hợp lệ của cửa sổ.',
    },
    {
      type: 'choice',
      prompt: 'Tính chất nào của feasible(c) làm cho tìm kiếm nhị phân trên đáp án đúng?',
      options: [
        'Nó tính nhanh.',
        'Nó đơn điệu: một khi đã đúng thì đúng với mọi c lớn hơn.',
        'Nó đúng với đúng một giá trị c.',
        'Các khối lượng đã được sắp xếp.',
      ],
      answer: 1,
      hints: [
        'Đánh dấu “Hiện mọi đáp án” và nhìn hình dạng của dải.',
        'Chia đôi chỉ dùng được nếu một phép thử cho biết về cả một phía của cửa sổ.',
      ],
      solution:
        'Đơn điệu: một tải trọng đạt thì mọi tải trọng lớn hơn còn dư chỗ. Nên dải có dạng sai…sai đúng…đúng, và một phép thử tại mid loại được cả một nửa. Các khối lượng không cần sắp xếp.',
    },
  ],
  /** @param {AnswerFrame} f @param {number} limit */
  describe(f, limit) {
    switch (f.kind) {
      case 'start':
        return `Ứng viên chạy từ ${f.lo}, kiện nặng nhất, đến ${f.hi}, tức mọi kiện trong một ngày. Tải trọng ${f.hi} chắc chắn đạt, nên đáp án nằm trong [${f.lo}, ${f.hi}].`;
      case 'probe':
        return `Đáp án nằm trong [${f.lo}, ${f.hi}]. Thử tải trọng ở giữa, mid = ${f.mid}.`;
      case 'check':
        return `Với tải trọng ${f.mid}, cách xếp tham lam cần ${f.days.length} ngày, ${f.ok ? 'không quá' : 'nhiều hơn'} D = ${limit}. feasible(${f.mid}) là ${f.ok ? 'true' : 'false'}.`;
      case 'go-left':
        return `${f.mid} đạt, nên đáp án nhiều nhất là ${f.mid}: hi = ${f.hi}. Mọi tải trọng lớn hơn cũng đạt.`;
      case 'go-right':
        return `${f.mid} không đạt, mọi tải trọng nhỏ hơn cũng vậy: lo = ${f.lo}.`;
      case 'done':
        return `lo = hi = ${f.answer}. Tải trọng nhỏ nhất chở hết mọi kiện trong ${limit} ngày là ${f.answer}, tìm ra sau ${f.checks} lần kiểm tra.`;
    }
  },
};
