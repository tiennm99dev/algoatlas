/** @typedef {import('$lib/algo-engine/practice-linked-lists.js').PracticeFrame} PracticeFrame */

/** A node id in narration: dummy, null, or the node's value. */
/** @param {PracticeFrame} f @param {number} id */
const v = (f, id) => (id === -2 ? 'dummy' : id === -1 ? 'null' : String(f.values[id]));

/** @param {PracticeFrame} f @param {number} id */
const after = (f, id) => (id === -2 ? f.dummyNext : id === -1 ? -1 : f.next[id]);

/** @param {PracticeFrame} f */
const listOf = (f) => {
  /** @type {number[]} */
  const out = [];
  let s = f.problem === 'middle' ? f.head : f.dummyNext;
  while (s !== -1 && out.length <= f.values.length) {
    out.push(f.values[s]);
    s = f.next[s];
  }
  return out;
};

export const vi = {
  slug: 'practice-linked-lists',
  topic: 'linked-lists',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán danh sách liên kết',
  intro:
    'Ba bài toán kinh điển, bài nào cũng giải bằng cách dời vài con trỏ dọc danh sách chứ không chép lại danh sách. Trộn hai danh sách đã sắp xếp bằng cách nối lại các nút của chúng phía sau một nút giả, tìm nút giữa bằng con trỏ chậm và con trỏ nhanh, và xoá nút thứ n tính từ cuối chỉ trong một lượt duyệt bằng cách giữ fast đi trước slow n nút.',
  summary:
    'Chạy từng bước phép trộn hai danh sách đã sắp xếp, phép tìm nút giữa và phép xoá nút thứ n tính từ cuối, trên các danh sách bạn tự nhập.',
  instruction:
    'Chọn một bài toán, nhập danh sách của bạn (và n), rồi chạy từng bước lời giải. Để ý nhãn con trỏ và mũi tên xanh ngọc, là con trỏ tới nút sau vừa được ghi ở bước đó. Dùng phần thử nghiệm này để trả lời các câu hỏi bên dưới.',
  problemLabel: 'Bài toán',
  problems: {
    merge: 'Trộn hai danh sách đã sắp xếp',
    middle: 'Tìm nút giữa',
    nth: 'Xoá nút thứ n từ cuối',
  },
  listALabel: 'Danh sách A',
  listBLabel: 'Danh sách B (đã sắp xếp)',
  listLabelSingle: 'Danh sách',
  listASortedLabel: 'Danh sách A (đã sắp xếp)',
  nLabel: 'n (tính từ cuối)',
  newLists: 'Danh sách ngẫu nhiên mới',
  scroller: 'Hình vẽ danh sách, cuộn ngang được',
  nullLabel: 'null',
  listErrors: {
    empty: 'Hãy nhập ít nhất một giá trị.',
    count: 'Hãy dùng nhiều nhất 8 giá trị.',
    format: 'Hãy ngăn cách các số nguyên bằng dấu phẩy hoặc dấu cách.',
    range: 'Giá trị phải từ 0 đến 99.',
    unsorted: 'Phép trộn cần mỗi danh sách được sắp xếp từ nhỏ đến lớn.',
  },
  sortedForMerge: 'Danh sách A đã được sắp xếp lại, vì phép trộn cần danh sách đã sắp xếp.',
  /** @param {number} len */
  nError: (len) => `n phải là số nguyên từ 1 đến ${len}, bằng độ dài danh sách.`,
  stats: {
    comparisons: 'Số lần so sánh',
    moves: 'Số lần dời con trỏ',
    writes: 'Số con trỏ tới nút sau đã ghi',
    result: 'Đáp án',
  },
  pending: '…',
  /** @param {PracticeFrame} f */
  answer(f) {
    if (f.kind !== 'done') return vi.pending;
    if (f.problem === 'middle') return f.slow === -1 ? 'null' : v(f, f.slow);
    if (f.problem === 'nth') return f.removed === -1 ? 'không có' : `đã xoá ${v(f, f.removed)}`;
    return listOf(f).join(' → ');
  },
  /** @param {PracticeFrame} f */
  diagramLabel(f) {
    const result = listOf(f);
    if (f.problem === 'merge')
      return `Đang trộn. Kết quả tới giờ, tính từ nút giả: ${result.length ? result.join(' → ') : 'rỗng'}.`;
    return `Danh sách liên kết ${result.join(' → ')} → null.`;
  },
  /** @param {string} label @param {string} state */
  nodeTitle: (label, state) =>
    [label === 'dummy' ? 'Nút giả' : `Nút ${label}`, state].filter(Boolean).join(', '),
  states: {
    visited: 'nút giả',
    sorted: 'đã vào kết quả',
    active: 'vừa được nối',
    frontier: 'slow ở đây',
    swap: 'đã gỡ ra',
    path: 'đáp án',
  },
  markers: { active: '+', swap: '×', path: '✓' },
  legend: {
    visited: 'Nút giả',
    sorted: 'Đã trộn',
    active: 'Vừa được nối',
    frontier: 'slow',
    swap: 'Đã gỡ ra',
    path: 'Đáp án',
    hot: 'Con trỏ tới nút sau vừa ghi',
  },
  /** @param {PracticeFrame} f @param {number} n */
  describe(f, n) {
    switch (f.kind) {
      case 'start':
        if (f.problem === 'merge')
          return `Nút giả cho danh sách trộn một điểm bắt đầu cố định, nên lần nối đầu tiên không cần trường hợp đặc biệt. a bắt đầu ở ${v(f, f.a)}, b ở ${v(f, f.b)}.`;
        if (f.problem === 'middle')
          return `slow và fast bắt đầu ở nút đầu, ${v(f, f.head)}. Mỗi lượt slow đi một bước, fast đi hai bước.`;
        return 'Đặt một nút giả trước nút đầu, để xoá nút đầu cũng giống như xoá mọi nút khác. fast và slow bắt đầu ở nút giả.';
      case 'take-a': {
        const taken = after(f, f.wrote);
        return `${v(f, taken)} ≤ ${v(f, f.b)}: nối tail → ${v(f, taken)} và cho a đi tiếp tới ${v(f, f.a)}.`;
      }
      case 'take-b': {
        const taken = after(f, f.wrote);
        return `${v(f, taken)} < ${v(f, f.a)}: nối tail → ${v(f, taken)} và cho b đi tiếp tới ${v(f, f.b)}.`;
      }
      case 'advance':
        return `tail dời tới ${v(f, f.tail)}, nút cuối của phần đã trộn.`;
      case 'attach':
        return `Một danh sách đã hết, nên nối tail vào phần còn lại của danh sách kia, ${v(f, after(f, f.tail))}. Một lần ghi là gắn được cả phần đó.`;
      case 'move':
        return `slow bước tới ${v(f, f.slow)}, fast nhảy hai bước tới ${v(f, f.fast)}.`;
      case 'gap':
        return `fast dời tới ${v(f, f.fast)}: giờ đã đi trước slow ${f.moves}/${n} bước.`;
      case 'slide':
        return `Cả hai cùng đi một bước: slow ở ${v(f, f.slow)}, fast ở ${v(f, f.fast)}. Khoảng cách vẫn là ${n}.`;
      case 'unlink':
        return `fast đang ở nút cuối, nên slow.next (${v(f, f.removed)}) là nút thứ ${n} tính từ cuối. slow.next = slow.next.next bỏ qua nút đó.`;
      case 'done':
        if (f.problem === 'merge')
          return `Đã trộn: ${listOf(f).join(' → ')}. ${f.comparisons} lần so sánh và không tạo nút mới nào.`;
        if (f.problem === 'middle') {
          const len = f.values.length;
          return len % 2 === 0
            ? `fast đã chạy quá cuối, nên slow đang ở nút giữa: ${v(f, f.slow)}, nút thứ hai trong hai nút giữa của ${len} nút.`
            : `fast đang ở nút cuối, nên slow đang ở nút giữa: ${v(f, f.slow)}, nút thứ ${f.slow + 1} trong ${len} nút.`;
        }
        return `Trả về dummy.next: ${listOf(f).join(' → ') || 'rỗng'}. Một lượt duyệt, ${f.moves} lần dời con trỏ.`;
    }
  },
  takeaways: [
    'Trộn: so sánh hai nút đầu, nối nút nhỏ hơn vào sau tail, rồi đi tiếp. Khi một danh sách hết, chỉ một lần ghi là gắn được phần còn lại của danh sách kia. Thời gian O(n + m), bộ nhớ thêm O(1).',
    'Có một nút giả đứng trước kết quả thì nút đầu không bao giờ là trường hợp đặc biệt: đáp án chỉ là nút đứng sau nút giả.',
    'Nút giữa: khi fast đã đi 2k nút thì slow mới đi k nút. Với độ dài chẵn, cách làm này dừng ở nút giữa thứ hai.',
    'Nút thứ n từ cuối: cho fast đi trước n bước, rồi cho cả hai cùng đi tới khi fast ở nút cuối. Lúc đó slow đứng ngay trước nút cần xoá, chỉ sau một lượt duyệt.',
    'Thử “Xoá nút thứ n từ cuối” với n bằng độ dài danh sách: nút giả giúp xoá nút đầu như mọi nút khác.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Trộn hai danh sách đã sắp xếp', 'O(n + m)', 'Mỗi bước nối một nút.'],
    ['Tìm nút giữa', 'O(n)', 'fast đi qua danh sách một lần.'],
    ['Xoá nút thứ n từ cuối', 'O(n)', 'Một lượt duyệt với khoảng cách cố định n.'],
    ['Bộ nhớ thêm', 'O(1)', 'Vài con trỏ; các nút được nối lại, không bao giờ bị chép.'],
  ],
  practiceTitle: 'Bài luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trộn A = 1, 4, 6 với B = 2, 3, 7. Phép trộn so sánh giá trị bao nhiêu lần?',
      answer: 5,
      unit: 'lần so sánh',
      hints: [
        'Mỗi nút được nối khi cả hai danh sách vẫn còn nút thì tốn một lần so sánh.',
        'Nhập hai danh sách vào phần thử nghiệm rồi đọc ô “Số lần so sánh” ở bước cuối.',
      ],
      solution:
        'Nó so sánh 1–2, 4–2, 4–3, 4–7 và 6–7, lần lượt nối 1, 2, 3, 4, 6. Khi đó A đã hết và 7 được gắn vào mà không cần so sánh: 5 lần so sánh.',
    },
    {
      type: 'number',
      prompt: 'Trộn A = 1, 2, 3 với B = 4, 5, 6. Lần này có bao nhiêu lần so sánh?',
      answer: 3,
      unit: 'lần so sánh',
      hints: ['Mọi nút của A đều nhỏ hơn mọi nút của B.'],
      solution:
        'Mỗi số 1, 2, 3 được so sánh với 4 rồi được nối. Khi đó A đã hết, nên cả B được gắn vào bằng một lần ghi: 3 lần so sánh.',
    },
    {
      type: 'number',
      prompt: 'Tìm nút giữa của 10, 20, 30, 40, 50, 60. slow dừng ở giá trị nào?',
      answer: 40,
      hints: [
        'Vòng lặp chạy khi fast và nút sau fast đều còn tồn tại.',
        'Độ dài chẵn thì có hai nút giữa.',
      ],
      solution:
        'fast đi qua 10, 30, 50, rồi tới null sau ba lượt, trong khi slow đi qua 20, 30, 40. Nó dừng ở 40, nút thứ hai trong hai nút giữa.',
    },
    {
      type: 'number',
      prompt: 'Một danh sách có 7 nút. Vòng lặp tìm nút giữa chạy bao nhiêu lượt?',
      answer: 3,
      unit: 'lượt',
      hints: ['Mỗi lượt fast đi hai nút và dừng ở nút cuối.'],
      solution:
        'fast đi từ nút 1 tới nút 3, 5 rồi 7. Ở nút 7, nút sau fast là null, nên vòng lặp dừng sau 3 lượt, khi slow ở nút 4.',
    },
    {
      type: 'number',
      prompt:
        'Xoá nút thứ 2 tính từ cuối của 5, 8, 13, 21, 34. Sau khi đã tạo khoảng cách, slow và fast cùng đi bao nhiêu lượt?',
      answer: 3,
      unit: 'lượt',
      hints: ['fast bắt đầu ở nút giả và đi trước 2 bước.', 'Vòng lặp dừng khi fast ở nút cuối.'],
      solution:
        'Sau khi tạo khoảng cách, fast ở 8. Hai con trỏ cùng đi 3 lần, tới khi fast ở 34 và slow ở 13. Rồi 13 trỏ thẳng tới 34, bỏ qua 21.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao lời giải xoá nút thứ n từ cuối cho cả hai con trỏ bắt đầu ở một nút giả mà không phải ở nút đầu?',
      options: [
        'Để vòng lặp chạy ít lần hơn',
        'Để xoá nút đầu không phải trường hợp đặc biệt: slow có thể dừng trước nút đầu',
        'Vì không đọc nút đầu hai lần được',
      ],
      answer: 1,
      hints: ['Thử n bằng độ dài danh sách trong phần thử nghiệm.'],
      solution:
        'Muốn xoá một nút thì cần nút đứng trước nó. Nút đầu không có nút nào đứng trước, trừ khi có một nút giả đứng trước. Có nút giả rồi thì slow dừng ở đó, và cho nút giả trỏ thẳng tới nút thứ hai là xoá được nút đầu.',
    },
    {
      type: 'order',
      prompt: 'Xếp các bước của “xoá nút thứ n tính từ cuối” theo đúng thứ tự.',
      items: [
        'cho slow trỏ thẳng qua nút cần xoá',
        'cho fast đi trước n bước',
        'cho cả hai cùng đi tới khi fast ở nút cuối',
        'đặt fast và slow ở một nút giả đứng trước nút đầu',
      ],
      answer: [3, 1, 2, 0],
      hints: ['Phải có khoảng cách trước rồi hai con trỏ mới cùng đi.'],
      solution:
        'Đặt cả hai ở nút giả, tạo khoảng cách n, cho cả hai trượt tới khi fast ở nút cuối, rồi gỡ nút đứng sau slow.',
    },
  ],
  nextTeaser:
    'Chủ đề sau dùng mảng và danh sách liên kết để dựng một cấu trúc dữ liệu rất quen thuộc: ngăn xếp.',
};
