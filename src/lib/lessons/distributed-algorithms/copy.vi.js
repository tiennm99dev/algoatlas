/** @typedef {import('$lib/algo-engine/distributed-algorithms.js').FloodFrame} FloodFrame */

/** 'A', 'A và B', 'A, B và C'. @param {string[]} items */
const list = (items) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} và ${items.at(-1)}`;

export const vi = {
  slug: 'distributed-algorithms',
  topic: 'computation-models',
  level: 'Trung bình',
  title: 'Thuật toán phân tán',
  intro:
    'Trong một hệ phân tán, mỗi nút là một máy riêng, chỉ thấy trạng thái của chính nó và các thông điệp từ những nút kề. Trong mô hình đồng bộ, các nút cùng tiến theo từng vòng: gửi, nhận, cập nhật. Bầu ra một thủ lĩnh là bài toán kinh điển đầu tiên, và FloodMax giải nó trong D vòng, đồng thời dựng luôn một cây BFS (duyệt theo chiều rộng) trên đường đi.',
  summary:
    'Xem FloodMax bầu thủ lĩnh qua từng vòng trên một mạng do em vẽ, đếm số thông điệp của nó, và thấy vì sao các nút giống hệt nhau không thể phá vỡ đối xứng.',
  instruction:
    'Chạy từng vòng: các liên kết được tô sáng mang thông điệp của vòng này, còn ghi chú dưới mỗi nút cho biết ID của nó và ID lớn nhất nó đã thấy. Vẽ mạng của riêng em bằng các công cụ, xáo trộn ID, cho mọi ID bằng nhau, hoặc chuyển sang chỉ gửi khi có thay đổi rồi so số thông điệp.',
  presetLabel: 'Mạng',
  presets: { ring: 'Vòng', path: 'Đường thẳng', tree: 'Cây', mesh: 'Lưới' },
  variantLabel: 'Gửi',
  variants: { change: 'Chỉ khi thay đổi', every: 'Mọi vòng' },
  idsLabel: 'ID',
  idModes: { unique: 'Khác nhau', equal: 'Bằng nhau hết' },
  shuffle: 'Xáo trộn ID',
  graphAria: 'Mạng các nút. Vẽ nó bằng các công cụ.',
  /** @param {number} uid @param {number} max */
  note: (uid, max) => (uid === max ? `id ${uid}` : `id ${uid}, max ${max}`),
  /** @param {string} name @param {number} uid @param {number} max @param {string} state */
  nodeLabel: (name, uid, max, state) =>
    `Nút ${name}, ID ${uid}, ID lớn nhất đã thấy ${max}${state ? `, ${state}` : ''}`,
  states: {
    leader: 'thủ lĩnh',
    sending: 'đang gửi ở vòng này',
    updated: 'vừa biết một ID lớn hơn ở vòng này',
    knows: 'đã biết giá trị lớn nhất cuối cùng',
  },
  markers: { leader: '★', updated: '↑' },
  legend: {
    sending: 'Đang gửi ở vòng này',
    updated: '↑ Vừa biết một ID lớn hơn',
    knows: 'Đã biết giá trị lớn nhất cuối cùng',
    leader: '★ Thủ lĩnh',
    message: 'Liên kết đang mang thông điệp',
    tree: 'Liên kết của cây BFS (tới nút cha)',
  },
  messagesTitle: 'Thông điệp ở vòng này',
  messagesEmpty: 'Không có thông điệp.',
  hotMessage: 'được giữ làm giá trị lớn nhất mới',
  /** @param {string} from @param {string} to @param {number} value */
  message: (from, to, value) => `${from} → ${to}: ${value}`,
  stats: {
    round: 'Vòng / D',
    thisRound: 'Thông điệp ở vòng này',
    sent: 'Tổng số thông điệp',
    leaders: 'Số thủ lĩnh',
  },
  /** @param {number} r @param {number} d */
  round: (r, d) => `${r} / ${d}`,
  /**
   * @param {FloodFrame} f @param {string[]} names @param {number[]} uids
   * @param {'every'|'change'} variant
   */
  describe(f, names, uids, variant) {
    const leaders = f.leaders.map((i) => names[i]);
    switch (f.kind) {
      case 'start':
        if (names.length === 0) return 'Mạng đang trống: hãy thêm một nút bằng các công cụ.';
        return f.rounds === 0
          ? 'Không có hai nút nào được nối với nhau, nên không có vòng nào: mỗi nút chỉ biết chính nó.'
          : `Mỗi nút chỉ biết ID của chính nó và các nút kề. Đường kính là D = ${f.rounds}, nên mọi nút chạy ${f.rounds} vòng.`;
      case 'send':
        if (variant === 'every' || f.round === 1)
          return `Vòng ${f.round}: ${f.senders.length} nút gửi ID lớn nhất của mình tới mọi nút kề: ${f.messages.length} thông điệp.`;
        return f.senders.length === 0
          ? `Vòng ${f.round}: vòng trước không có giá trị lớn nhất nào đổi, nên mọi nút đều im lặng.`
          : `Vòng ${f.round}: chỉ ${f.senders.length} nút có giá trị lớn nhất vừa đổi ở vòng trước mới gửi: ${f.messages.length} thông điệp.`;
      case 'receive':
        if (f.updated.length === 0) return `Vòng ${f.round}: không nút nào nghe thấy ID lớn hơn.`;
        return `Vòng ${f.round}: ${list(f.updated.map((v) => `${names[v]} biết ${f.max[v]} từ ${names[f.parent[v]]}`))}.`;
      case 'decide':
        if (leaders.length === 0) return 'Không có nút, cũng không có thủ lĩnh.';
        if (leaders.length === 1)
          return `Sau ${f.rounds} vòng, ${leaders[0]} chưa nghe thấy ID nào lớn hơn ID ${uids[f.leaders[0]]} của chính nó, nên nó tự nhận là thủ lĩnh. Mọi nút khác đã thấy một ID lớn hơn và biết mình không phải thủ lĩnh.`;
        if (new Set(uids).size === 1)
          return `Cả ${names.length} nút đều chỉ thấy ID ${uids[0]}, nên nút nào cũng tự nhận là thủ lĩnh. Các nút giống hệt nhau chạy cùng một chương trình thì mãi giống hệt nhau: không có ID phân biệt (hoặc yếu tố ngẫu nhiên) thì không thể phá vỡ đối xứng.`;
        return `${list(leaders)} đều tự nhận là thủ lĩnh: mạng bị tách thành ${leaders.length} mảnh, và một ID không thể đi từ mảnh này sang mảnh khác.`;
      case 'done':
        if (leaders.length !== 1)
          return `Xong sau ${f.sent} thông điệp: có ${leaders.length} thủ lĩnh, nên cuộc bầu thất bại.`;
        return `Xong: ${leaders[0]} làm thủ lĩnh sau ${f.sent} thông điệp trong ${f.rounds} vòng. Các liên kết cha in đậm tạo thành một cây BFS gốc ${leaders[0]}: độ sâu của mỗi nút chính là vòng mà nó biết được ${f.max[f.leaders[0]]}.`;
    }
  },
  takeaways: [
    'Trong mô hình đồng bộ, mọi nút đi theo từng vòng: gửi cho các nút kề, nhận, cập nhật. Thời gian được đếm bằng số vòng, còn chi phí bằng số thông điệp.',
    'FloodMax: mỗi nút chuyển tiếp ID lớn nhất nó đã thấy; sau D vòng (D là đường kính), ID đó đã tới mọi nút, và nút có ID của chính mình lớn nhất là thủ lĩnh.',
    'ID lớn nhất tới một nút ở khoảng cách d đúng vào vòng d, nên chỉ cần nhớ ai gửi nó đầu tiên là dựng được một cây BFS gốc ở thủ lĩnh, không tốn thêm thông điệp nào.',
    'Bầu thủ lĩnh cần một cách phá vỡ đối xứng. Các nút có ID bằng nhau chạy cùng một chương trình sẽ mãi ở cùng một trạng thái; chính ID phân biệt hoặc lựa chọn ngẫu nhiên mới phân biệt được chúng.',
    'Thử xem: trên mạng Đường thẳng, so số thông điệp giữa Mọi vòng và Chỉ khi thay đổi. Rồi chọn Bằng nhau hết và xem nút nào cũng đòi làm thủ lĩnh.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Số vòng', 'D, đường kính', 'Mỗi vòng một ID đi được một bước, và nút xa nhất cách D bước.'],
    [
      'Số thông điệp, mọi vòng',
      '2|E| · D',
      'Mỗi vòng, mỗi nút gửi cho từng nút kề: hai thông điệp trên mỗi liên kết.',
    ],
    [
      'Số thông điệp, chỉ khi thay đổi',
      'Nhiều nhất 2|E| · D, thường ít hơn nhiều',
      'Một nút chỉ gửi sau khi giá trị lớn nhất của nó tăng, và nó tăng được nhiều nhất D lần.',
    ],
    ['Bộ nhớ mỗi nút', 'O(log n) bit', 'ID lớn nhất tới lúc này, liên kết cha và một bộ đếm vòng.'],
    [
      'Cây BFS',
      'Có sẵn nhờ cuộc bầu',
      'Nút đầu tiên gửi giá trị lớn nhất cuối cùng ở gần thủ lĩnh hơn một bước.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Mở mạng Đường thẳng với Gửi đặt là Chỉ khi thay đổi. Cuộc bầu tốn tổng cộng bao nhiêu thông điệp?',
      answer: 19,
      unit: 'thông điệp',
      hints: ['Bấm Đến bước cuối rồi đọc Tổng số thông điệp.'],
      solution:
        'Lần lượt từng vòng có 10, 5, 3, 1 và 0 thông điệp: chỉ những nút có giá trị lớn nhất vừa tăng mới gửi tiếp. Với Mọi vòng thì sẽ là 5 vòng × 10 = 50.',
    },
    {
      type: 'number',
      prompt:
        'Trên mạng Cây, nút sâu nhất của cây BFS sâu bao nhiêu, tức là nút cuối cùng biết ID của thủ lĩnh ở vòng nào?',
      answer: 4,
      unit: 'vòng',
      hints: [
        'Chạy từng bước tới khi không nút nào còn hiện ↑, hoặc đọc D: vòng cuối cùng chính là tầng sâu nhất.',
      ],
      solution:
        'Thủ lĩnh có ID 9; hai nút ở cuối nhánh xa cách nó 4 bước, nên chúng biết 9 ở vòng 4, cũng chính là D.',
    },
    {
      type: 'choice',
      prompt: 'Trên mạng Vòng, chọn Bằng nhau hết cho các ID. Điều gì xảy ra?',
      options: [
        'Nút có nhiều nút kề nhất thắng',
        'Nút nào cũng tự nhận là thủ lĩnh',
        'Không nút nào tự nhận là thủ lĩnh',
        'Nút đầu tiên trong hình vẽ thắng',
      ],
      answer: 1,
      hints: ['Mọi nút bắt đầu ở cùng một trạng thái và nhận cùng những thông điệp.'],
      solution:
        'Mọi nút giữ giống hệt nhau qua từng vòng: mỗi nút chỉ thấy ID của chính nó, nên nút nào cũng tự nhận là thủ lĩnh. Muốn phá vỡ đối xứng cần ID phân biệt hoặc yếu tố ngẫu nhiên.',
    },
  ],
  nextTeaser:
    'Bài sau, Thuật toán không phụ thuộc cache, đếm số lần chuyển khối giữa bộ nhớ đệm và bộ nhớ chính.',
};
