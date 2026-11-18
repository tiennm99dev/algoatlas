/** @typedef {import('$lib/algo-engine/interval-scheduling.js').IntervalFrame} IntervalFrame */
/** @typedef {import('$lib/algo-engine/interval-scheduling.js').Rule} Rule */

/** Interval names: A, B, C, … in the typed order. @param {number} i */
const name = (i) => String.fromCharCode(65 + i);

/** @param {IntervalFrame} f @param {number} i */
const span = (f, i) => `${name(i)} [${f.intervals[i].start}, ${f.intervals[i].end})`;

/** @param {number} r */
const roomName = (r) => `R${r + 1}`;

/** @type {Record<Rule, string>} */
const SORT_KEY = {
  finish: 'thời điểm kết thúc',
  start: 'thời điểm bắt đầu',
  shortest: 'độ dài, ngắn trước',
  rooms: 'thời điểm bắt đầu',
};

export const vi = {
  slug: 'interval-scheduling',
  topic: 'greedy',
  level: 'Cơ bản',
  title: 'Lập lịch các đoạn',
  intro:
    'Nhiều yêu cầu cùng muốn dùng một phòng, mỗi yêu cầu trong một đoạn thời gian. Bài toán chọn hoạt động giữ lại nhiều yêu cầu không chồng nhau nhất có thể, và quy tắc tham lam (greedy) đúng là lặp đi lặp lại việc giữ yêu cầu tương thích kết thúc sớm nhất. Bài toán phân hoạch các đoạn hỏi điều ngược lại: cần ít nhất bao nhiêu phòng để chứa mọi yêu cầu?',
  summary:
    'Chạy từng bước thuật toán chọn hoạt động theo thời điểm kết thúc sớm nhất, xem quy tắc bắt đầu sớm nhất và ngắn nhất trước thua ra sao, rồi chia các đoạn vào ít phòng nhất.',
  instruction:
    'Nhập các đoạn dạng đầu-cuối hoặc nạp một mẫu có sẵn, chọn một quy tắc, rồi chạy từng bước. Mỗi hàng là một đoạn trên trục thời gian. Nạp “Bẫy ngắn nhất trước” và so sánh ba quy tắc chọn trong khung bên phải.',
  intervalsLabel: 'Các đoạn (đầu-cuối)',
  ruleLabel: 'Quy tắc tham lam',
  rules: {
    finish: 'Chọn: kết thúc sớm nhất',
    start: 'Chọn: bắt đầu sớm nhất',
    shortest: 'Chọn: ngắn nhất trước',
    rooms: 'Chia vào các phòng',
  },
  presetLabel: 'Các đoạn',
  presetPlaceholder: 'Nạp các đoạn…',
  presets: {
    classic: '11 hoạt động',
    shortTrap: 'Bẫy ngắn nhất trước',
    startTrap: 'Bẫy bắt đầu sớm nhất',
    lectures: 'Một ngày học',
  },
  random: 'Các đoạn ngẫu nhiên',
  errors: {
    format:
      'Hãy nhập các đoạn dạng đầu-cuối, ví dụ 1-4, 3-5. Các đoạn hợp lệ gần nhất đã được khôi phục.',
    range: 'Mọi thời điểm phải từ 0 đến 24. Các đoạn hợp lệ gần nhất đã được khôi phục.',
    order: 'Mỗi đoạn phải kết thúc sau khi bắt đầu. Các đoạn hợp lệ gần nhất đã được khôi phục.',
    count: 'Hãy dùng nhiều nhất 12 đoạn. Các đoạn hợp lệ gần nhất đã được khôi phục.',
  },
  newIntervalsNotice: 'Đã nạp các đoạn mới.',
  /** @param {string} rule */
  ruleNotice: (rule) => `Quy tắc: ${rule}. Quá trình chạy bắt đầu lại.`,
  name,
  roomName,
  /** @param {number} n */
  timelineAria: (n) => `Trục thời gian của ${n} đoạn, mỗi hàng một đoạn, theo thứ tự quét.`,
  /** @param {IntervalFrame} f @param {number} i @param {string} state */
  barLabel: (f, i, state) =>
    `${span(f, i)}${state ? `, ${state.toLowerCase()}` : ''}${f.room[i] >= 0 ? `, phòng ${roomName(f.room[i])}` : ''}`,
  lastFinishLabel: 'lastFinish',
  nowLabel: 'bây giờ',
  legend: {
    current: 'Đang quét',
    kept: 'Đã giữ hoặc đã xếp phòng',
    clash: 'Chồng với đoạn đang quét',
    skipped: 'Đã bỏ qua',
    freed: 'Đoạn cuối của phòng trống sớm nhất',
  },
  markers: { current: '?', kept: '✓', clash: '!', skipped: '✗', freed: '↺' },
  stats: {
    kept: 'Đã giữ',
    best: 'Nhiều nhất có thể',
    rooms: 'Số phòng',
    depth: 'Độ sâu',
    checks: 'Số lần kiểm tra chồng',
  },
  keptTitle: 'Đã chọn, theo thứ tự giữ',
  keptEmpty: 'chưa giữ đoạn nào',
  roomsTitle: 'Thời điểm kết thúc của các phòng (heap nhỏ nhất)',
  roomsEmpty: 'chưa mở phòng nào',
  /** @param {number} r @param {number} end */
  roomChip: (r, end) => `${roomName(r)}: ${end}`,
  compareTitle: 'Số đoạn giữ được trên các đoạn này',
  /** @param {number} k */
  compareRow: (k) => `${k} đoạn`,
  practiceTitle: 'Tự kiểm tra',
  /**
   * @param {IntervalFrame} f
   * @param {number} best  The most compatible intervals, from the earliest-finish rule.
   * @param {{depth: number, at: number}} deep
   */
  describe(f, best, deep) {
    const n = f.intervals.length;
    const rooms = f.rule === 'rooms';
    switch (f.kind) {
      case 'start':
        return rooms
          ? `Xếp cả ${n} đoạn vào các phòng sao cho không có hai đoạn nào trong cùng một phòng chồng nhau, dùng ít phòng nhất có thể. Các đoạn là nửa mở: [1, 4) và [4, 6) không chồng nhau.`
          : `Giữ lại nhiều nhất có thể trong ${n} đoạn sao cho không có hai đoạn nào chồng nhau. Các đoạn là nửa mở: [1, 4) và [4, 6) không chồng nhau.`;
      case 'sort':
        return `Sắp xếp theo ${SORT_KEY[f.rule]}: các hàng giờ theo thứ tự quét, ${f.order.map(name).join(', ')}.`;
      case 'consider': {
        const s = f.intervals[f.current].start;
        if (rooms) {
          if (f.freed < 0) return `${span(f, f.current)}: chưa có phòng nào mở.`;
          const end = f.roomEnds[f.freed];
          return `${span(f, f.current)}: phòng trống sớm nhất là ${roomName(f.freed)}, trống từ ${end}. ${end} ≤ ${s} không?`;
        }
        if (f.rule === 'finish') {
          if (f.lastFinish < 0)
            return `${span(f, f.current)}: chưa giữ đoạn nào, nên đoạn này vừa.`;
          return f.conflict < 0
            ? `${span(f, f.current)}: ${s} ≥ lastFinish ${f.lastFinish}, nên đoạn này bắt đầu sau khi mọi đoạn đã giữ kết thúc.`
            : `${span(f, f.current)}: ${s} < lastFinish ${f.lastFinish}, nên đoạn này chồng với ${span(f, f.conflict)}.`;
        }
        return f.conflict < 0
          ? `${span(f, f.current)} không chồng với đoạn nào trong ${f.chosen.length} đoạn đã giữ.`
          : `${span(f, f.current)} chồng với đoạn đã giữ ${span(f, f.conflict)}.`;
      }
      case 'pick':
        return f.rule === 'finish'
          ? `Giữ ${name(f.current)}; lastFinish thành ${f.lastFinish}. Đã giữ ${f.chosen.length} đoạn.`
          : `Giữ ${name(f.current)}. Đã giữ ${f.chosen.length} đoạn.`;
      case 'reject':
        return `Bỏ qua ${name(f.current)}: đoạn này chồng với ${name(f.conflict)}.`;
      case 'reuse': {
        const iv = f.intervals[f.current];
        return `Có: ${name(f.current)} vào phòng ${roomName(f.freed)}, phòng này giờ bận tới ${iv.end}.`;
      }
      case 'open': {
        const iv = f.intervals[f.current];
        const why =
          f.freed < 0
            ? ''
            : `Không: mọi phòng đều bận lúc ${iv.start}, và phòng trống sớm nhất là lúc ${f.roomEnds[f.freed]}. `;
        return `${why}Mở phòng ${roomName(f.room[f.current])} cho ${name(f.current)}. Đang mở ${f.roomEnds.length} phòng.`;
      }
      case 'done': {
        if (rooms) {
          return `${f.roomEnds.length} phòng chứa được mọi đoạn. Lúc ${deep.at}, có ${deep.depth} đoạn chồng nhau, nên không lịch nào dùng ít phòng hơn được: số phòng tham lam bằng độ sâu.`;
        }
        const kept = f.chosen.map(name).join(', ') || 'không có';
        const k = f.chosen.length;
        if (f.rule === 'finish') {
          return `Đã giữ ${k} đoạn: ${kept}. Mỗi lần chọn để lại nhiều thời gian nhất cho phần còn lại, nên không tập tương thích nào lớn hơn.`;
        }
        return k < best
          ? `Đã giữ ${k} đoạn: ${kept}. Kết thúc sớm nhất giữ được ${best}, nên quy tắc này không tối ưu: chỉ một phản ví dụ là đủ.`
          : `Đã giữ ${k} đoạn: ${kept}, bằng số đoạn mà kết thúc sớm nhất giữ được ở đây. Điều đó không chứng minh gì cho các đầu vào khác: hãy thử các mẫu bẫy.`;
      }
    }
  },
  takeaways: [
    'Chọn hoạt động: sắp xếp theo thời điểm kết thúc, rồi giữ mọi đoạn bắt đầu bằng hoặc sau thời điểm kết thúc của đoạn vừa giữ. Mỗi đoạn một phép so sánh, nên chi phí là phép sắp xếp O(n log n).',
    'Lập luận hoán đổi (exchange argument): gọi g là đoạn kết thúc sớm nhất. Trong một tập tối ưu bất kì, đổi đoạn đầu tiên của nó lấy g; g kết thúc không muộn hơn, nên không đoạn nào khác bị chồng và tập vẫn giữ nguyên kích thước. Lặp lại lập luận trên phần còn lại sẽ chứng minh cả tập tham lam là tối ưu.',
    'Những quy tắc nghe tự nhiên lại thất bại. Bắt đầu sớm nhất giữ một đoạn dài chắn mất nhiều đoạn ngắn; ngắn nhất trước giữ một đoạn ngắn chồng với hai đoạn tương thích với nhau.',
    'Phân hoạch các đoạn: quét theo thời điểm bắt đầu và dùng lại phòng trống sớm nhất, lưu trong một heap nhỏ nhất chứa các thời điểm kết thúc. Thuật toán chỉ mở phòng mới khi mọi phòng đều bận, nên số phòng bằng độ sâu, tức số đoạn chồng nhau nhiều nhất tại một thời điểm, và không lịch nào làm tốt hơn được.',
    'Nạp “Bẫy bắt đầu sớm nhất”, chạy từng bước với mỗi quy tắc chọn, rồi chuyển sang chia phòng: đoạn dài buộc phải dùng 2 phòng dù 3 đoạn ngắn vừa trong một phòng.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Sắp xếp theo thời điểm kết thúc hoặc bắt đầu',
      'O(n log n)',
      'Một phép sắp xếp so sánh trên n đoạn.',
    ],
    ['Lượt quét chọn hoạt động', 'O(n)', 'Mỗi đoạn một phép so sánh I.start với lastFinish.'],
    [
      'Phân hoạch bằng heap nhỏ nhất',
      'O(n log d)',
      'Mỗi đoạn một thao tác heap trên nhiều nhất d phòng, với d là độ sâu.',
    ],
    [
      'Kiểm tra mỗi đoạn với mọi đoạn đã giữ',
      'O(n²)',
      'Điều mà một quy tắc không sắp xếp theo thời điểm kết thúc cần làm để phát hiện chồng nhau.',
    ],
    ['Bộ nhớ thêm', 'O(n)', 'Thứ tự đã sắp xếp, danh sách đã chọn và heap.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Quy tắc kết thúc sớm nhất chạy trên 11 hoạt động 1-4, 3-5, 0-6, 5-7, 3-9, 5-9, 6-10, 8-11, 8-12, 2-14, 12-16. Nó giữ được bao nhiêu hoạt động?',
      answer: 4,
      unit: 'đoạn',
      hints: [
        'Đoạn đầu tiên được giữ là 1-4, đoạn kết thúc sớm nhất.',
        'Sau 1-4, đoạn tiếp theo bắt đầu từ 4 trở đi và kết thúc sớm nhất là 5-7.',
      ],
      solution: 'Nó giữ 1-4, 5-7, 8-11 và 12-16: 4 hoạt động. Nạp “11 hoạt động” để xem quá trình.',
    },
    {
      type: 'number',
      prompt: 'Cũng 11 hoạt động đó cần bao nhiêu phòng?',
      answer: 6,
      unit: 'phòng',
      hints: [
        'Đáp số là độ sâu: số đoạn chồng nhau nhiều nhất tại một thời điểm.',
        'Đếm các đoạn chứa thời điểm 8.',
      ],
      solution:
        'Lúc 8, các đoạn 3-9, 5-9, 6-10, 8-11, 8-12 và 2-14 cùng diễn ra, nên cần ít nhất 6 phòng, và cách chia tham lam dùng đúng 6.',
    },
    {
      type: 'choice',
      prompt: 'Thứ tự sắp xếp nào làm cho thuật toán chọn hoạt động tham lam tối ưu?',
      options: [
        'Thời điểm bắt đầu sớm nhất',
        'Độ dài ngắn nhất',
        'Thời điểm kết thúc sớm nhất',
        'Ít chồng nhau nhất',
      ],
      answer: 2,
      hints: [
        'Lần chọn đầu tiên nên để trống phần trục thời gian còn lại nhiều nhất có thể.',
        'Nạp các mẫu bẫy và so sánh khung bên phải.',
      ],
      solution:
        'Kết thúc sớm nhất để lại nhiều chỗ nhất cho phần còn lại, và lập luận hoán đổi chứng minh nó tối ưu. Bắt đầu sớm nhất và ngắn nhất trước đều có phản ví dụ nhỏ. Ít chồng nhau nhất nói chung cũng sai, dù phản ví dụ cần nhiều đoạn hơn.',
    },
    {
      type: 'number',
      prompt: 'Quy tắc bắt đầu sớm nhất chạy trên 0-10, 1-3, 4-6, 7-9. Nó giữ được bao nhiêu đoạn?',
      answer: 1,
      unit: 'đoạn',
      hints: [
        'Nó giữ 0-10 trước, vì 0 là thời điểm bắt đầu sớm nhất.',
        'Mọi đoạn còn lại đều nằm trong 0-10.',
      ],
      solution:
        'Nó giữ 0-10, và cả ba đoạn còn lại đều chồng với đoạn này, nên chỉ giữ được 1. Kết thúc sớm nhất giữ được 1-3, 4-6 và 7-9.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Mã hoá Huffman, dùng tham lam để dựng mã nhị phân ngắn nhất cho một văn bản.',
};
