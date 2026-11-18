/** @typedef {import('$lib/algo-engine/linked-list-techniques.js').TechFrame} TechFrame */

/** A node's value for narration, or null. */
/** @param {TechFrame} f @param {number} slot */
const v = (f, slot) => (slot < 0 ? 'null' : String(f.values[slot]));

export const vi = {
  slug: 'linked-list-techniques',
  topic: 'linked-lists',
  level: 'Trung bình',
  title: 'Kĩ thuật trên linked list',
  intro:
    'Phần lớn bài toán trên linked list (danh sách liên kết) được giải bằng cách dời vài con trỏ thật cẩn thận chứ không phải chép lại các nút. Phép đảo ngược đưa ba con trỏ đi dọc danh sách (prev, curr và một con trỏ giữ phần còn lại) và lật từng mũi tên một; còn “rùa và thỏ” đi một bước và hai bước mỗi lượt để tìm nút giữa hoặc bắt được chu trình, tất cả chỉ tốn O(1) bộ nhớ thêm.',
  summary:
    'Đảo ngược linked list tại chỗ và phát hiện chu trình bằng “rùa và thỏ” của Floyd, từng bước một.',
  instruction:
    'Chọn một kĩ thuật, nhập các giá trị của danh sách, và với bài phát hiện chu trình thì chọn nút mà đuôi trỏ ngược về (hoặc bấm vào một nút). Chạy từng bước và để ý nhãn con trỏ: slow và fast chạy đua cho tới khi cùng dừng ở một nút.',
  algoLabel: 'Kĩ thuật',
  algos: { floyd: 'Phát hiện chu trình (Floyd)', reverse: 'Đảo ngược tại chỗ' },
  valuesLabel: 'Các giá trị',
  cycleLabel: 'Đuôi trỏ tới',
  noCycle: 'null (không có chu trình)',
  /** @param {number} i @param {number} value */
  cycleOption: (i, value) => `#${i} (${value})`,
  newList: 'Danh sách ngẫu nhiên mới',
  scroller: 'Hình vẽ danh sách, cuộn ngang được',
  nullLabel: 'null',
  valueErrors: {
    empty: 'Hãy nhập ít nhất một giá trị.',
    count: 'Hãy dùng nhiều nhất 10 giá trị.',
    format: 'Hãy ngăn cách các số nguyên bằng dấu phẩy hoặc dấu cách.',
    range: 'Giá trị phải từ 0 đến 99.',
  },
  /** @param {number[]} values @param {boolean} cyclic @param {number} cycleTo */
  listLabel: (values, cyclic, cycleTo) =>
    values.length === 0
      ? 'Danh sách rỗng.'
      : cyclic
        ? `Linked list ${values.join(' → ')}, và đuôi trỏ ngược về #${cycleTo} (${values[cycleTo]}), tạo thành một chu trình.`
        : `Linked list ${values.join(' → ')} → null.`,
  /** @param {number[]} done @param {number[]} rest */
  reverseLabel: (done, rest) =>
    `Phần đã đảo, tính từ prev: ${done.length ? done.join(' → ') + ' → null' : 'null'}. Phần còn lại, tính từ curr: ${rest.length ? rest.join(' → ') + ' → null' : 'null'}.`,
  /** @param {number} i @param {number} value @param {string} state */
  nodeTitle: (i, value, state) => [`#${i}: ${value}`, state].filter(Boolean).join(', '),
  stats: {
    reverse: { steps: 'Số vòng lặp', moves: 'Số mũi tên đã lật' },
    floyd: { steps: 'Số lượt', moves: 'Số lần dời con trỏ' },
    mu: 'Độ dài đoạn đuôi μ',
    lambda: 'Độ dài chu trình λ',
  },
  states: {
    active: 'curr',
    visited: 'đã đảo',
    frontier: 'nằm trên chu trình',
    sorted: 'điểm gặp nhau',
    path: 'điểm bắt đầu chu trình',
  },
  markers: { sorted: '✓', path: '★' },
  legend: {
    active: 'curr (đang được lật)',
    visited: 'Đã đảo',
    frontier: 'Nằm trên chu trình',
    sorted: 'Điểm gặp nhau',
    path: 'Điểm bắt đầu chu trình',
    hot: 'Con trỏ vừa ghi',
    target: 'Viền đậm: nút mà đuôi trỏ ngược về (bấm vào một nút để đổi)',
  },
  /** @param {TechFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        if (f.head === -1) return 'Danh sách rỗng.';
        return f.algo === 'reverse'
          ? `prev bắt đầu là null, curr bắt đầu ở nút đầu, ${v(f, f.curr)}.`
          : `slow và fast cùng bắt đầu ở nút đầu, ${v(f, f.head)}. Mỗi lượt slow đi một bước, fast đi hai bước.`;
      case 'save':
        return `Lưu next = curr.next (${v(f, f.nxt)}) trước khi mũi tên đi ra từ ${v(f, f.curr)} bị ghi đè.`;
      case 'flip':
        return `Lật mũi tên: ${v(f, f.curr)}.next = prev (${v(f, f.prev)}). Một lần ghi, không tạo nút mới.`;
      case 'advance':
        return f.curr === -1
          ? `prev dời tới ${v(f, f.prev)} và curr tới null: mọi mũi tên đã được lật.`
          : `prev dời tới ${v(f, f.prev)} và curr tới ${v(f, f.curr)}.`;
      case 'move':
        return `Lượt ${f.steps}: slow bước tới ${v(f, f.slow)}, fast nhảy hai bước tới ${v(f, f.fast)}.`;
      case 'meet':
        return `slow và fast gặp nhau ở ${v(f, f.met)} sau ${f.steps} lượt, vậy là có chu trình. Trong chu trình, mỗi lượt fast rút ngắn khoảng cách đúng một nút, nên nó không bao giờ nhảy vượt qua slow.`;
      case 'no-cycle':
        return `fast tới cuối danh sách sau ${f.steps} lượt: danh sách kết thúc bằng null thì không có chu trình.`;
      case 'reset':
        return 'Pha 2: đưa slow về nút đầu, giữ fast ở điểm gặp nhau. Giờ hai con trỏ cách điểm bắt đầu chu trình cùng một số bước.';
      case 'move2':
        return `Cả hai cùng đi một bước: slow ở ${v(f, f.slow)}, fast ở ${v(f, f.fast)}.`;
      case 'entry':
        return `Chúng gặp lại nhau ở #${f.entry} (${v(f, f.entry)}): đây là nơi chu trình bắt đầu.`;
      case 'done':
        if (f.algo === 'reverse')
          return f.head === -1
            ? 'Không có gì để đảo.'
            : `head = prev = ${v(f, f.head)}. Danh sách đã được đảo ngược sau ${f.moves} lần lật mũi tên, chỉ dùng thêm ba con trỏ.`;
        return f.entry >= 0
          ? `Chu trình bắt đầu ở #${f.entry} (${v(f, f.entry)}), tìm được sau ${f.moves} lần dời con trỏ, chỉ dùng thêm hai con trỏ.`
          : `Không có chu trình, biết được sau ${f.moves} lần dời con trỏ, chỉ dùng thêm hai con trỏ.`;
    }
  },
  takeaways: [
    'Phép đảo ngược giữ ba con trỏ: prev (phần đã đảo), curr (nút đang lật) và một con trỏ giữ phần còn lại, được lưu trước khi lật. Mỗi nút chỉ lật một lần: thời gian O(n), bộ nhớ O(1).',
    'Con trỏ nhanh và con trỏ chậm: khi fast đã đi 2k nút thì slow mới đi k nút. Dừng lại khi fast chạy quá cuối danh sách, lúc đó slow đang ở giữa.',
    'Phát hiện chu trình của Floyd: trong chu trình, mỗi lượt fast rút ngắn khoảng cách tới slow một nút, nên chúng gặp nhau trong vòng một vòng chạy. Nếu fast chạm null thì không có chu trình.',
    'Muốn tìm nơi chu trình bắt đầu, đưa một con trỏ về nút đầu rồi cho cả hai cùng đi từng bước một: chúng gặp nhau đúng ở điểm bắt đầu, sau μ bước, bằng độ dài đoạn đuôi.',
    'Thử cho đuôi trỏ về #0, rồi về nút cuối: xem slow và fast cần bao nhiêu lượt trong mỗi trường hợp.',
  ],
  complexityHead: ['Kĩ thuật', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Đảo ngược tại chỗ', 'O(n)', 'Một lượt duyệt; mỗi mũi tên lật một lần.'],
    [
      'Floyd: phát hiện chu trình',
      'O(n)',
      'Chúng gặp nhau trong vòng μ + λ lượt, nhiều nhất là n.',
    ],
    ['Floyd: tìm điểm bắt đầu chu trình', 'O(n)', 'Thêm μ bước cho cả hai con trỏ.'],
    ['Bộ nhớ thêm', 'O(1)', 'Phép đảo giữ ba con trỏ, Floyd giữ hai.'],
    ['Hash table lưu các nút đã thăm', 'Bộ nhớ O(n)', 'Cách đơn giản thay cho Floyd.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Đảo ngược tại chỗ một danh sách 6 nút. Thuật toán ghi đè bao nhiêu con trỏ tới nút sau?',
      answer: 6,
      unit: 'mũi tên',
      hints: [
        'Mỗi vòng lặp lật một mũi tên.',
        'Ngay cả nút đầu cũ cũng bị lật: giờ nó trỏ tới null.',
      ],
      solution:
        'Vòng lặp chạy một lần cho mỗi nút và mỗi lần cho curr trỏ về prev: 6 lần ghi. Mũi tên của nút đầu cũ thành null.',
    },
    {
      type: 'number',
      prompt:
        'Danh sách là 3 → 8 → 5 → 1 → 9 → 6 → 2 và đuôi trỏ ngược về #2 (5). Sau khi slow và fast gặp nhau, pha 2 cần bao nhiêu bước để tìm ra điểm bắt đầu chu trình?',
      answer: 2,
      unit: 'bước',
      hints: [
        'Pha 2 tốn μ bước: số nút đứng trước điểm bắt đầu chu trình.',
        'Đếm số nút đứng trước #2.',
      ],
      solution:
        'Có hai nút, 3 và 8, đứng trước điểm bắt đầu chu trình 5, nên μ = 2. slow đi 3 → 8 → 5, trong khi fast đi vòng quanh chu trình tới đúng nút đó.',
    },
    {
      type: 'number',
      prompt:
        'Một danh sách 9 nút kết thúc bằng null. Vòng lặp của Floyd chạy bao nhiêu lượt thì fast dừng?',
      answer: 4,
      unit: 'lượt',
      hints: [
        'Mỗi lượt fast đi hai nút, bắt đầu từ #0.',
        'Vòng lặp cần cả fast lẫn nút sau fast đều tồn tại.',
      ],
      solution:
        'fast đi qua #0, #2, #4, #6, #8. Ở #8, nút sau fast là null, nên vòng lặp dừng sau 4 lượt, khi slow đang ở #4, nút giữa.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao thuật toán Floyd hơn cách kiểm tra dễ nghĩ ra là “ghi nhớ mọi nút vào một hash table (bảng băm)”?',
      options: [
        'Nó nhanh hơn về mặt tiệm cận',
        'Nó chỉ cần hai con trỏ thay vì O(n) bộ nhớ thêm',
        'Nó chạy được trên danh sách không có chu trình, còn hash table thì không',
      ],
      answer: 1,
      hints: ['Cả hai đều tốn thời gian O(n). So sánh xem mỗi cách còn phải lưu gì.'],
      solution:
        'Cả hai đều chạy trong thời gian O(n), nhưng hash table lưu tới n nút, còn Floyd chỉ giữ slow và fast.',
    },
  ],
  nextTeaser:
    'Bài sau là phần luyện tập: bài toán linked list, gom cả chủ đề vào các câu hỏi ngắn.',
};
