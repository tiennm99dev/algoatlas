/** @typedef {import('$lib/algo-engine/practice-searching.js').DebugFrame} DebugFrame */
/** @typedef {import('$lib/algo-engine/practice-searching.js').Outcome} Outcome */
/** @typedef {import('$lib/algo-engine/practice-searching.js').Version} Version */

/** @type {Record<Outcome, string>} */
const OUTCOMES = {
  ok: 'đúng',
  miss: 'bỏ sót x',
  loop: 'lặp vô hạn',
  'out-of-bounds': 'đọc quá cuối mảng',
};

export const vi = {
  slug: 'practice-searching',
  topic: 'searching',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán tìm kiếm',
  intro:
    'Tìm kiếm nhị phân rất ngắn, và gần như mọi lỗi của nó đều nằm ở chỗ biên: điều kiện vòng lặp, cách cập nhật lo hoặc hi, hay giá trị ban đầu của hi. Ở đây có năm phiên bản của cùng một thuật toán, mỗi bản chỉ khác nhau một dòng. Chạy chúng trên mảng của bạn, thử mọi giá trị cần tìm cùng lúc, và xem chính xác bản nào lặp vô hạn, bỏ sót hay đọc quá cuối mảng.',
  summary:
    'Gỡ lỗi bốn bản tìm kiếm nhị phân chỉ khác bản đúng đúng một dòng ở biên: tìm những giá trị làm mỗi bản lặp vô hạn, bỏ sót hoặc đọc ra ngoài mảng.',
  instruction:
    'Chọn một phiên bản rồi chạy từng bước trên giá trị cần tìm. Hàng Mọi giá trị cần tìm chạy phiên bản đó với từng số nguyên, từ nhỏ hơn giá trị nhỏ nhất một đơn vị tới lớn hơn giá trị lớn nhất một đơn vị; bấm vào một ô để chọn giá trị đó. So sánh mã với phiên bản A, bản đúng.',
  takeaways: [
    'Trước hết hãy nhận ra vị từ đơn điệu. Trên mảng đã sắp xếp, “a[i] ≥ x” có dạng sai, sai, …, rồi đúng, đúng, …, và việc so sánh a[mid] với x là hỏi mid nằm ở phía nào của ranh giới đó. Mọi phép thử có hoặc không có dạng như vậy, trên chỉ số hay trên giá trị đáp án, đều tìm kiếm nhị phân được.',
    'while lo < hi trên cửa sổ đóng dừng sớm một ô: khi cửa sổ chỉ còn một ô, ô đó không bao giờ được đọc, nên nếu x nằm ở đó thì bị bỏ sót.',
    'Một phép cập nhật có thể giữ nguyên cửa sổ sẽ gây lặp vô hạn. lo = mid gây ra điều này khi hi ≤ lo + 1, vì khi đó floor((lo + hi) / 2) = lo; hi = mid gây ra khi lo = hi.',
    'Chọn một quy ước cửa sổ và dùng nó ở mọi chỗ: cửa sổ đóng [lo, hi] đi cùng hi = n − 1, while lo <= hi, lo = mid + 1 và hi = mid − 1. Sau đó thử các trường hợp biên: x nhỏ hơn mọi giá trị, lớn hơn mọi giá trị, ở ô đầu và ô cuối, và mảng chỉ có một phần tử.',
    'Thử mảng chỉ có số 5: mỗi bản lỗi sai đúng ở một trong ba giá trị cần tìm 4, 5 và 6.',
  ],
  complexityHead: ['Phiên bản', 'Chi phí', 'Vì sao'],
  complexity: [
    ['A (đúng)', 'O(log n)', 'Cửa sổ đóng mất ít nhất một nửa sau mỗi lượt; bộ nhớ O(1).'],
    ['B: while lo < hi', 'O(log n)', 'Nhanh nhưng sai: dừng ở cửa sổ một ô mà không đọc ô đó.'],
    [
      'C: lo = mid',
      'Không bị chặn',
      'Khi a[mid] < x và hi ≤ lo + 1 thì mid = lo, và lo = mid giữ nguyên cửa sổ.',
    ],
    [
      'D: hi = n',
      'O(log n)',
      'Nhanh nhưng không an toàn: khi x lớn hơn mọi giá trị, mid chạm tới n và đọc a[n].',
    ],
    [
      'E: else: hi = mid',
      'Không bị chặn',
      'Khi lo = hi và a[mid] > x, hi = mid giữ nguyên cửa sổ.',
    ],
  ],
  nextTeaser:
    'Chủ đề tiếp theo rời mảng để sang các nút nối với nhau bằng con trỏ, bắt đầu với Danh sách liên kết đơn.',
  versionLabel: 'Phiên bản',
  /** @param {Version} v */
  versionName: (v) => `Phiên bản ${v}`,
  valuesLabel: 'Mảng đã sắp xếp',
  targetLabel: 'Giá trị cần tìm x',
  newArray: 'Mảng mới',
  showChange: 'Hiện dòng bị thay đổi',
  /** @param {number} line @param {string} code */
  changeNote: (line, code) => `Dòng ${line} bị thay đổi: ${code.trim()}`,
  noChange: 'Phiên bản A là bản tìm kiếm đúng: không dòng nào bị thay đổi.',
  valueErrors: {
    format: 'Hãy nhập các số nguyên cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 3, 8, 12.',
    range: 'Mọi giá trị phải từ 0 đến 60.',
    count: 'Hãy nhập từ 1 đến 12 giá trị.',
    order: 'Tìm kiếm nhị phân cần đầu vào đã sắp xếp: hãy nhập các giá trị theo thứ tự không giảm.',
  },
  targetError: 'Giá trị cần tìm phải là số nguyên từ 0 đến 60.',
  /** @param {number[]} values @param {number} lo @param {number} hi */
  arrayLabel: (values, lo, hi) => `Mảng đã sắp xếp: ${values.join(', ')}. lo = ${lo}, hi = ${hi}.`,
  windowLabel: 'cửa sổ',
  legend: {
    compare: 'a[mid] đang được đọc',
    sorted: 'Chỉ số được trả về',
    visited: 'Ngoài cửa sổ [lo, hi]',
  },
  markers: { compare: '?', sorted: '✓' },
  outcomes: OUTCOMES,
  outcomeMarks: /** @type {Record<Outcome, string>} */ ({
    ok: '✓',
    miss: '✕',
    loop: '↻',
    'out-of-bounds': '⚠',
  }),
  targetsTitle: 'Mọi giá trị cần tìm',
  /** @param {number} x @param {Outcome} o */
  targetAria: (x, o) => `Giá trị ${x}: ${OUTCOMES[o]}`,
  /** @param {Version} v @param {number} bad @param {number} total */
  targetsSummary: (v, bad, total) =>
    bad === 0
      ? `Phiên bản ${v} đúng với cả ${total} giá trị cần tìm.`
      : `Phiên bản ${v} sai ở ${bad}/${total} giá trị cần tìm.`,
  stats: {
    probes: 'Số lần đọc',
    result: 'Trả về',
    verdict: 'Kết luận',
    broken: 'Số giá trị bị sai',
  },
  pending: '—',
  never: 'không bao giờ',
  /** @param {number} bad @param {number} total */
  brokenValue: (bad, total) => `${bad}/${total}`,
  statesTitle: '(lo, hi) ở đầu mỗi lượt',
  statesEmpty: 'Chưa có lượt nào',
  practiceTitle: 'Câu hỏi gỡ lỗi',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'multi',
      prompt:
        'Mảng ban đầu 3, 8, 12, 17, 21, 26, 30. Phiên bản B bỏ sót những giá trị nào có trong mảng (trả về −1 dù chúng có ở đó)?',
      options: ['3', '8', '12', '17', '21', '26', '30'],
      answers: [0, 2, 4, 6],
      hints: [
        'Chọn phiên bản B rồi đọc các ô ✕ ở hàng Mọi giá trị cần tìm.',
        'Một giá trị bị bỏ sót khi lần tìm chỉ chạm tới nó dưới dạng cửa sổ một ô lo = hi.',
      ],
      solution:
        '3, 12, 21 và 30, các giá trị ở chỉ số 0, 2, 4 và 6. Phiên bản B đọc 17 làm mid đầu tiên, 8 và 26 làm mid thứ hai, còn bốn giá trị kia chỉ được chạm tới dưới dạng cửa sổ một ô, lúc đó while lo < hi đã sai.',
    },
    {
      type: 'number',
      prompt:
        'Phiên bản C, mảng ban đầu, giá trị cần tìm 30. Lần chạy lặp lại một trạng thái (lo, hi). Trong trạng thái đó lo bằng bao nhiêu?',
      answer: 5,
      hints: [
        'Bấm giá trị 30 ở hàng Mọi giá trị cần tìm rồi chạy tới bước cuối.',
        'Đọc danh sách (lo, hi): lượt cuối là một trạng thái đã gặp trước đó.',
      ],
      solution:
        'lo = 5, hi = 6: mid = floor(11 / 2) = 5, a[5] = 26 < 30, và lo = mid đặt lo lại bằng 5. Cửa sổ không bao giờ hẹp lại, nên chỉ số 6 không bao giờ được đọc.',
    },
    {
      type: 'number',
      prompt:
        'Phiên bản E trên mảng ban đầu: với bao nhiêu trong 30 giá trị cần tìm thì nó lặp vô hạn?',
      answer: 22,
      unit: 'giá trị',
      hints: [
        'Chọn phiên bản E rồi đọc thẻ Số giá trị bị sai.',
        'Mọi giá trị không có trong mảng từ 2 đến 29 đều thu cửa sổ về một ô có giá trị lớn hơn x.',
      ],
      solution:
        '22: mọi giá trị từ 2 đến 29 không có trong mảng. Khi lo = hi và a[mid] > x, hi = mid giữ nguyên cửa sổ. Các giá trị có trong mảng được tìm thấy trước, còn 31 kết thúc khi lo vượt qua hi.',
    },
    {
      type: 'choice',
      prompt:
        'Phiên bản D (hi = n) sai ở đúng một giá trị cần tìm của mảng ban đầu. Đó là giá trị nào?',
      options: ['2', '3', '30', '31'],
      answer: 3,
      hints: [
        'Chọn phiên bản D và tìm ô ⚠.',
        'Cửa sổ phải vượt qua chỉ số cuối thì mid mới chạm tới n được.',
      ],
      solution:
        '31, giá trị lớn hơn mọi phần tử: lo tăng tới 7 = n, cửa sổ [7, 7] vẫn còn mở, và mid = 7 đọc a[7], quá cuối mảng một ô.',
    },
    {
      type: 'choice',
      prompt:
        'Nhập mảng chỉ có một giá trị 5. Phiên bản nào trả lời sai với chính giá trị cần tìm 5?',
      options: ['A', 'B', 'C', 'D', 'E'],
      answer: 1,
      hints: [
        'Nhập 5 làm mảng, rồi thử từng phiên bản với giá trị cần tìm 5.',
        'Chỉ có một giá trị thì ngay cửa sổ đầu tiên đã là một ô.',
      ],
      solution:
        'Phiên bản B: ngay từ đầu lo = hi = 0, nên while lo < hi không chạy lần nào và trả về −1. C và E chỉ sai với các giá trị không có là 6 và 4, còn D sai với 6.',
    },
    {
      type: 'multi',
      prompt:
        'Phép thử có hoặc không nào dưới đây đơn điệu trên khoảng đã cho, tức sai cho tới một điểm và đúng từ đó trở đi, để tìm kiếm nhị phân tìm được ranh giới?',
      options: [
        'a[i] ≥ x, với i từ 0 đến n − 1 trên mảng đã sắp xếp của trang này',
        'a[i] == x, với i từ 0 đến n − 1 trên cùng mảng đó',
        'k² ≥ 50, với số nguyên k từ 0 đến 50',
        'k chẵn, với số nguyên k từ 0 đến 50',
        'xe tải trọng c chở hết các kiện hàng trong D ngày, với c từ max(w) đến sum(w)',
      ],
      answers: [0, 2, 4],
      hints: [
        'Viết các câu trả lời của phép thử thành một hàng ✕ và ✓. Đơn điệu nghĩa là một dải ✕ rồi một dải ✓.',
        'a[i] == x chỉ đúng ở các bản sao của x, nên sau ô ✓ lại có thể là ✕.',
      ],
      solution:
        'a[i] ≥ x luôn đúng khi các giá trị đã sắp xếp đạt tới x; k² ≥ 50 trở thành đúng từ k = 8 và giữ nguyên; một tải trọng đạt thì mọi tải trọng lớn hơn còn dư chỗ. a[i] == x có dạng ✕ ✓ ✕ quanh các bản sao của x, còn “k chẵn” đổi qua đổi lại, nên cả hai đều không có một ranh giới duy nhất.',
    },
    {
      type: 'choice',
      prompt: 'Sửa một dòng nào thì phiên bản C trở nên đúng?',
      options: [
        'while lo < hi:',
        'if a[mid] < x: lo = mid + 1',
        'mid = floor((lo + hi) / 2) + 1',
        'else: hi = mid',
      ],
      answer: 1,
      hints: [
        'So sánh C với phiên bản A từng dòng một.',
        'Mọi phép cập nhật phải đưa lo hoặc hi vượt qua mid, vì mid vừa bị loại.',
      ],
      solution:
        'lo = mid + 1: a[mid] < x loại chính mid, nên cửa sổ tiếp theo bắt đầu sau nó và luôn hẹp lại. Đó đúng là phiên bản A.',
    },
  ],
  /** @param {DebugFrame} f @param {number[]} a @param {number} x */
  describe(f, a, x) {
    switch (f.kind) {
      case 'start':
        return `Phiên bản ${f.version}: tìm ${x} trong ${a.length} giá trị đã sắp xếp, bắt đầu với lo = ${f.lo} và hi = ${f.hi}.`;
      case 'probe':
        return `Cửa sổ [${f.lo}, ${f.hi}], mid = ${f.mid}. Đọc a[${f.mid}] = ${a[f.mid]} và so sánh với ${x}${a[f.mid] === x ? ': bằng nhau.' : '.'}`;
      case 'go-right':
        return `${a[f.mid]} < ${x}, nên lo = ${f.lo}.`;
      case 'go-left':
        return `${a[f.mid]} > ${x}, nên hi = ${f.hi}.`;
      case 'done':
        switch (f.outcome) {
          case 'ok':
            return f.answer >= 0
              ? `Trả về ${f.answer}: a[${f.answer}] = ${x}. Đúng, sau ${f.probes} lần đọc.`
              : `Điều kiện vòng lặp sai tại lo = ${f.lo}, hi = ${f.hi}, nên trả về −1. Đúng: ${x} không có trong mảng.`;
          case 'miss':
            return `Điều kiện vòng lặp sai tại lo = ${f.lo}, hi = ${f.hi}, nên trả về −1. Sai: ${x} nằm ở chỉ số ${a.indexOf(x)}, và ô đó chưa bao giờ được đọc.`;
          case 'loop':
            return `lo = ${f.lo}, hi = ${f.hi} là trạng thái lần chạy này đã gặp trước đó. Cùng trạng thái thì cùng các bước: vòng lặp không bao giờ kết thúc.`;
          case 'out-of-bounds':
            return `mid = ${f.mid} = n, nên đọc a[${f.mid}] là đọc quá cuối mảng. Nhiều ngôn ngữ sẽ báo lỗi và dừng ở đây; một số đọc phải giá trị rác.`;
        }
        return '';
    }
  },
};
