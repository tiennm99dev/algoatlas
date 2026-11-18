/** @typedef {import('$lib/algo-engine/union-by-rank-path-compression.js').RankFrame} RankFrame */
/** @typedef {import('$lib/algo-engine/union-by-rank-path-compression.js').RankOp} RankOp */

/** @param {number} k */
const links = (k) => `${k} liên kết`;

export const vi = {
  slug: 'union-by-rank-path-compression',
  topic: 'union-find',
  level: 'Trung bình',
  title: 'Hợp theo hạng và nén đường đi',
  intro:
    'Một rừng union-find thông thường có thể mọc thành một chuỗi dài, và khi đó mỗi lần find phải leo hết chuỗi ấy. Hai thay đổi nhỏ sửa được điều này: hợp theo hạng (union by rank) treo cây thấp hơn dưới cây cao hơn, còn nén đường đi (path compression) cho mọi phần tử mà một lần find đi ngang qua trỏ thẳng vào gốc. Kết hợp lại, mỗi thao tác chỉ tốn α(n), hàm Ackermann ngược, một hàm không vượt quá 4 với mọi đầu vào vừa với vũ trụ của chúng ta.',
  summary:
    'Bật, tắt hợp theo hạng và nén đường đi, xem một chuỗi cao bị dẹt xuống, và so sánh chi phí find của cả bốn cách thiết lập trên cùng các thao tác.',
  instruction:
    'Chọn một quy tắc hợp và bật hoặc tắt nén đường đi, rồi chạy từng bước. Mẫu Chuỗi dựng một đường chín liên kết bằng các phép hợp thông thường; hãy xem find(0) leo hết đường rồi làm dẹt nó. Bấm vào một nút, hoặc chọn nó rồi nhấn Enter, để chạy find trên nút đó. Bảng chạy cùng một nhật kí thao tác dưới cả bốn cách thiết lập.',
  ruleLabel: 'Quy tắc hợp',
  rules: { plain: 'Thông thường', rank: 'Theo hạng' },
  compressLabel: 'Nén đường đi',
  compressOptions: { off: 'Tắt', on: 'Bật' },
  aLabel: 'a',
  bLabel: 'b',
  union: 'Hợp a và b',
  find: 'Tìm gốc của a',
  undo: 'Hoàn tác',
  reset: 'Đặt lại',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Mở một mẫu…',
  presets: { chain: 'Chuỗi', mixed: 'Hỗn hợp', random: 'Ngẫu nhiên' },
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'đang chạy',
  /** @param {RankOp} op */
  opChip: (op) => (op.type === 'find' ? `find(${op.a})` : `union(${op.a}, ${op.b})`),
  /** @param {number} r */
  rankNote: (r) => `r${r}`,
  stats: {
    opSteps: 'Số liên kết đã đi (thao tác này)',
    steps: 'Số liên kết đã đi (tổng)',
    height: 'Cây cao nhất (số liên kết)',
    writes: 'Số ô được nén trỏ lại',
  },
  compareTitle: 'Cùng một nhật kí dưới mỗi cách thiết lập',
  compareHead: ['Thiết lập', 'Số liên kết đã đi', 'Cây cao nhất'],
  variants: {
    plain: 'Thông thường, không nén',
    rank: 'Chỉ hợp theo hạng',
    compress: 'Chỉ nén đường đi',
    both: 'Cả hai',
  },
  shownLabel: '(đang hiển thị)',
  logFull: 'Nhật kí đã đầy (16 thao tác). Hãy hoàn tác hoặc đặt lại để làm tiếp.',
  elementError: 'Phần tử phải là số nguyên từ 0 đến 9.',
  legend: {
    current: 'find đang ở đây',
    climbed: 'Đã leo qua',
    root: 'Gốc',
    moved: 'Đã trỏ lại vào gốc',
    linked: 'Vừa treo dưới gốc kia',
    operand: 'Toán hạng a hoặc b, chưa thăm',
    rank: 'r = hạng (khi bật hợp theo hạng)',
  },
  markers: { current: '?', climbed: '↑', root: '✓', moved: '*', linked: '↓' },
  /** @param {RankFrame} f @param {boolean} compress */
  describe(f, compress) {
    const op = f.op;
    const start = f.path[0];
    const r = f.path.at(-1) ?? -1;
    const prev = f.path.length > 1 ? f.path[f.path.length - 2] : f.current;
    switch (f.kind) {
      case 'start':
        return `Mỗi phần tử là gốc của chính nó với hạng 0. Có ${f.sets} tập.`;
      case 'visit':
        return op?.type === 'find'
          ? `find(${start}): bắt đầu ở ${start}.`
          : `Tìm gốc của ${f.side} = ${start}: bắt đầu ở ${start}.`;
      case 'climb':
        return `parent[${prev}] = ${f.current}, nên leo lên ${f.current}.`;
      case 'root':
        return `parent[${r}] = ${r}: ${r} là gốc, tới được sau ${links(f.path.length - 1)}.${
          compress && f.path.length > 2 ? ' Giờ ta nén đường đi.' : ''
        }`;
      case 'compress': {
        const old = f.path[f.path.indexOf(f.current) + 1];
        return `Nén đường đi: ${f.current} từng trỏ vào ${old}; giờ nó trỏ thẳng vào gốc ${r}.`;
      }
      case 'found':
        if (compress && f.moved.length > 0)
          return `Mọi phần tử trên đường đi giờ đều trỏ vào ${r}, nên lần find tiếp theo từ đây chỉ leo 1 liên kết. Trả về ${r}.`;
        if (compress) return `Đường đi đã dẹt sẵn, nên không có gì thay đổi. Trả về ${r}.`;
        return `Trả về ${r}. Không nén thì đường đi vẫn như cũ, nên đường leo từ ${start} vẫn giữ nguyên ${links(f.path.length - 1)}.`;
      case 'same-set':
        return `Cả hai gốc đều là ${f.ra}: ${op?.a} và ${op?.b} đã ở cùng một tập.`;
      case 'swap':
        return `Gốc ${f.rb} của a có hạng ${f.rank[f.rb]}, nhỏ hơn hạng ${f.rank[f.ra]} của gốc ${f.ra} của b, nên đổi chỗ hai gốc: gốc hạng thấp hơn ${f.rb} sẽ treo dưới ${f.ra}.`;
      case 'link':
        return `Gán parent[${f.rb}] = ${f.ra}. Hai tập đã gộp thành một: còn ${f.sets} tập.`;
      case 'rank-up':
        return `Hai hạng bằng nhau, nên cây sau khi gộp có thể cao thêm một tầng: rank[${f.ra}] thành ${f.rank[f.ra]}.`;
      case 'done':
        return `Xong: ${f.sets} tập, cây cao nhất dài ${links(f.height)}, đã đi qua ${links(f.steps)} và trỏ lại ${f.writes} ô.`;
    }
  },
  takeaways: [
    'Hợp theo hạng: mỗi gốc giữ một hạng, là một cận trên của chiều cao cây. Gốc có hạng nhỏ hơn treo dưới gốc kia; chỉ khi hai hạng bằng nhau thì hạng của gốc mới tăng thêm một.',
    'Một cây có gốc hạng r chứa ít nhất 2^r phần tử, nên hạng, và cùng với nó là chiều cao, không bao giờ vượt quá log₂ n. Mỗi lần find tốn O(log n) ngay cả khi không nén.',
    'Nén đường đi: khi find tới gốc, nó cho mọi phần tử nó vừa đi qua trỏ thẳng vào gốc. Công sức chỉ phải trả một lần; các lần find sau từ đường ấy chỉ leo một liên kết.',
    'Dùng cả hai, mọi dãy m thao tác trên n phần tử tốn O(m α(n)), với α là hàm Ackermann ngược. α(n) ≤ 4 với mọi n trong thực tế, nên mỗi thao tác coi như tốn thời gian hằng số. Phép nén có thể làm cây thấp đi; các hạng được giữ nguyên, làm cận trên.',
    'Thử “Chuỗi” với quy tắc thông thường: so sánh 17 liên kết khi tắt nén với 10 liên kết khi bật nén, rồi chuyển sang Theo hạng và xem chuỗi không bao giờ hình thành.',
  ],
  complexityHead: ['Thiết lập', 'Chi phí mỗi thao tác', 'Vì sao'],
  complexity: [
    [
      'Hợp thông thường, không nén',
      'O(n) xấu nhất',
      'Những phép hợp kém may mắn dựng nên một chuỗi n − 1 liên kết.',
    ],
    ['Chỉ hợp theo hạng', 'O(log n)', 'Hạng r cần ít nhất 2^r phần tử, nên chiều cao ≤ log₂ n.'],
    [
      'Chỉ nén đường đi',
      'O(log n) khấu hao',
      'Những lần leo dài làm dẹt mọi thứ chúng chạm qua, nên không thể lặp lại thường xuyên.',
    ],
    ['Hạng và nén', 'O(α(n)) khấu hao', 'Cận của Tarjan; α(n) ≤ 4 với mọi n vừa với bộ nhớ.'],
    ['Bộ nhớ', 'O(n)', 'Mỗi phần tử một ô parent và một ô rank.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Mở Chuỗi với quy tắc thông thường và bật nén đường đi. Lần find thứ hai, find(1), leo qua bao nhiêu liên kết?',
      answer: 1,
      unit: 'liên kết',
      hints: ['Lần find(0) đầu tiên leo hết chuỗi. Phép nén làm gì với mọi phần tử nó đi qua?'],
      solution:
        'find(0) cho các phần tử từ 0 đến 7 trỏ thẳng vào gốc 9 (8 vốn đã trỏ vào đó). Vì vậy find(1) chỉ leo một liên kết, thay vì 8 liên kết khi không nén.',
    },
    {
      type: 'number',
      prompt:
        'Mở Hỗn hợp. Với quy tắc thông thường và không nén, mọi thao tác của nó đi qua tổng cộng bao nhiêu liên kết?',
      answer: 13,
      unit: 'liên kết',
      hints: ['Đọc bảng: hàng đầu tiên chạy nhật kí khi tắt cả hai mẹo.'],
      solution:
        'Rừng thông thường mọc ra đường bốn liên kết 3 → 2 → 0 → 4 → 8, và các lần find leo tổng cộng 13 liên kết. Dùng cả hai mẹo, cùng nhật kí ấy chỉ tốn 8.',
    },
    {
      type: 'number',
      prompt:
        'Với hợp theo hạng, trên 10 phần tử của chúng ta, một gốc có thể đạt hạng lớn nhất là bao nhiêu?',
      answer: 3,
      hints: [
        'Một gốc hạng r có ít nhất 2^r phần tử trong cây của nó.',
        'Tìm r lớn nhất sao cho 2^r ≤ 10.',
      ],
      solution:
        'Hạng r cần ít nhất 2^r phần tử, và 2^3 = 8 ≤ 10 < 16 = 2^4. Nên hạng, và cả chiều cao, không quá 3. Mẫu Hỗn hợp đạt đúng mức đó: gốc 4 kết thúc với hạng 3.',
    },
    {
      type: 'text',
      prompt:
        'Dùng cả hai mẹo, một dãy m thao tác tốn O(m · f(n)). Hãy gọi tên f, hàm tăng chậm đến mức trong thực tế không vượt quá 4.',
      accept: [
        'α(n)',
        'alpha(n)',
        'α',
        'alpha',
        'hàm Ackermann ngược',
        'Ackermann ngược',
        'hàm ngược Ackermann',
        'inverse Ackermann',
        'inverse Ackermann function',
      ],
      hints: ['Đó là hàm ngược của một hàm nổi tiếng tăng nhanh hơn mọi tháp luỹ thừa.'],
      solution:
        'Hàm Ackermann ngược α(n). Tarjan đã chứng minh cận O(m α(n)), và cận này là chặt với cấu trúc này.',
    },
  ],
  nextTeaser:
    'Bài sau là Luyện tập: bài toán hợp và tìm, nơi bạn dùng cấu trúc vừa tối ưu để đếm thành phần và phát hiện chu trình.',
};
