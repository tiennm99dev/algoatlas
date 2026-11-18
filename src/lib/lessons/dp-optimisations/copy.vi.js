/** @typedef {import('$lib/algo-engine/dp-optimisations.js').HullFrame} HullFrame */
/** @typedef {import('$lib/algo-engine/dp-optimisations.js').Line} Line */

/** @param {number} id */
const name = (id) => `L${id + 1}`;
/** A number with at most two decimals. @param {number} x */
const num = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2)).replace('-', '−');
/** @param {Line} l */
const formula = (l) => {
  const slope = l.m === 0 ? '' : l.m === 1 ? 'x' : l.m === -1 ? '−x' : `${num(l.m)}x`;
  if (!slope) return `y = ${num(l.b)}`;
  if (l.b === 0) return `y = ${slope}`;
  return `y = ${slope} ${l.b < 0 ? '−' : '+'} ${Math.abs(l.b)}`;
};
/** Where two lines cross. @param {Line} a @param {Line} b */
const cross = (a, b) => (b.b - a.b) / (a.m - b.m);

export const vi = {
  slug: 'dp-optimisations',
  topic: 'advanced-dp',
  level: 'Nâng cao',
  title: 'Tối ưu quy hoạch động',
  intro:
    'Nhiều công thức chuyển của quy hoạch động (dynamic programming) lấy giá trị nhỏ nhất qua mọi trạng thái trước đó, nên tốn O(n²) hoặc hơn. Khi chi phí có hình dạng đặc biệt, một cấu trúc dữ liệu hoặc một lập luận về thứ tự giúp bỏ qua phần lớn ứng viên. Kĩ thuật bao lồi (convex hull trick) xử lí các chi phí dạng dp[j] + b[j]·x[i]: mỗi trạng thái trước đó là một đường thẳng, và chỉ những đường thuộc đường bao dưới mới có thể thắng.',
  summary:
    'Tăng tốc công thức chuyển QHĐ bằng kĩ thuật bao lồi, hàng đợi đơn điệu, QHĐ chia để trị và tối ưu Knuth.',
  instruction:
    'Nhập các đường thẳng dạng cặp “hệ số góc tung độ gốc” và các giá trị x cần truy vấn, hoặc chọn một ví dụ, rồi chạy từng bước. Các đường được thêm theo hệ số góc; đường nào bị đường mới làm cho vô dụng sẽ bị lấy ra và vẽ nét đứt. Đường đậm là đường bao dưới, và các truy vấn đi dọc theo nó bằng một con trỏ chỉ dịch sang phải.',
  linesLabel: 'Các đường thẳng (m b, …)',
  queriesLabel: 'Các giá trị x cần truy vấn',
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    cap: 'Sáu đường, có một cặp song song',
    useless: 'Năm đường, có một đường vô dụng',
    touch: 'Một đường chỉ chạm đường bao',
  },
  randomLines: 'Đường thẳng ngẫu nhiên',
  /**
   * @param {number} maxLines @param {number} slope @param {number} lo @param {number} hi
   * @param {number} maxQueries @param {number} xMax
   */
  errors: (maxLines, slope, lo, hi, maxQueries, xMax) => ({
    lines: {
      format:
        'Viết mỗi đường thẳng bằng hai số nguyên, hệ số góc rồi đến tung độ gốc, ví dụ “2 1, −1 13”.',
      count: `Hãy nhập từ 1 đến ${maxLines} đường thẳng.`,
      range: `Hệ số góc từ −${slope} đến ${slope}, tung độ gốc từ ${lo} đến ${hi}.`,
    },
    queries: {
      format: 'Viết các giá trị x cần truy vấn bằng số nguyên.',
      count: `Hãy nhập từ 1 đến ${maxQueries} giá trị x khác nhau.`,
      range: `Mỗi x phải từ 0 đến ${xMax}.`,
    },
  }),
  /** @param {number} n */
  plotLabel: (n) =>
    `Đồ thị ${n} đường thẳng y = m·x + b với x từ 0 đến 10, đường bao dưới được vẽ đậm.`,
  name,
  formula,
  /** @param {number} y */
  markLabel: (y) => num(y),
  legend: {
    current: 'Đường vừa thêm',
    compare: 'Các đường đang so sánh',
    hull: 'Trên bao lồi; đường của con trỏ đậm màu hơn',
    removed: 'Không bao giờ thấp nhất, nét đứt: bị lấy ra hoặc bỏ qua (✕ trong danh sách)',
    pending: 'Chưa thêm, nét đứt',
    envelope: 'Đường bao dưới, nét đậm',
    query: 'x truy vấn, đường đứng nét đứt; đáp án là các chấm có nhãn',
  },
  stats: {
    checks: 'Số lần kiểm tra bao',
    moves: 'Số lần dời con trỏ',
    compares: 'Số lần so sánh của con trỏ',
    naive: 'Thử mọi đường tại mọi x',
  },
  hullTitle: 'Bao lồi, từ trái sang phải',
  hullEmpty: 'Rỗng',
  linesTitle: 'Các đường thẳng',
  /** @param {Line} l @param {boolean} gone */
  lineChip: (l, gone) => `${name(l.id)}: ${formula(l)}${gone ? ' ✕' : ''}`,
  answersTitle: 'Đáp án',
  answersRows: ['x', 'min'],
  answersAria: 'Bảng các giá trị x truy vấn và giá trị y nhỏ nhất tìm được tại mỗi x.',
  /** @param {HullFrame} f */
  describe(f) {
    const byId = new Map(f.pool.map((l) => [l.id, l]));
    const line = (/** @type {number} */ id) => /** @type {Line} */ (byId.get(id));
    const x = f.queries[f.q];
    switch (f.kind) {
      case 'start':
        return `${f.pool.length} đường thẳng và ${f.queries.length} truy vấn: với mỗi x, tìm đường thấp nhất. Trong QHĐ, mỗi đường là một trạng thái j trước đó, có hệ số góc b[j] và tung độ gốc dp[j].`;
      case 'sort':
        return `Sắp xếp theo hệ số góc, lớn nhất trước: ${f.pool.map((l) => name(l.id)).join(', ')}. Ở xa về bên phải, đường có hệ số góc nhỏ hơn luôn thấp hơn, nên mỗi đường mới chiếm lấy đầu bên phải.`;
      case 'consider':
        return `Thêm ${name(f.cur)}: ${formula(line(f.cur))}.`;
      case 'skip': {
        const last = line(f.hull[f.hull.length - 1]);
        return `${name(f.cur)} song song với ${name(last.id)} và không thấp hơn, nên nó không bao giờ là đường thấp nhất. Bỏ qua nó.`;
      }
      case 'check': {
        const [a, b, c] = f.triple.map(line);
        return f.pops
          ? `${name(b.id)} vô dụng: ${name(c.id)} cắt ${name(a.id)} tại x = ${num(cross(a, c))}, không nằm sau x = ${num(cross(a, b))}, chỗ mà ${name(b.id)} lẽ ra bắt đầu thấp nhất. Lấy ${name(b.id)} ra.`
          : `${name(b.id)} ở lại: nó thấp nhất từ x = ${num(cross(a, b))} cho tới khi ${name(c.id)} thay thế tại x = ${num(cross(b, c))}.`;
      }
      case 'push':
        return `Đẩy ${name(f.cur)} vào. Bao lồi giờ là ${f.hull.map(name).join(', ')}.`;
      case 'advance': {
        const [prev, cur] = [line(f.hull[f.p - 1]), line(f.hull[f.p])];
        return `Tại x = ${x}, ${name(cur.id)} cho ${num(cur.m * x + cur.b)}, không lớn hơn ${num(prev.m * x + prev.b)} của ${name(prev.id)}: dời con trỏ sang phải, và không bao giờ lùi lại.`;
      }
      case 'answer': {
        const cur = line(f.hull[f.p]);
        const next = f.p + 1 < f.hull.length ? line(f.hull[f.p + 1]) : null;
        const stay = next
          ? ` ${name(next.id)} cho ${num(next.m * x + next.b)}, cao hơn, nên con trỏ đứng yên.`
          : '';
        return `Tại x = ${x}, đường thấp nhất là ${name(cur.id)}: ${num(f.answers[f.q] ?? 0)}.${stay}`;
      }
      case 'done':
        return `Có ${f.queries.length} đáp án sau ${f.checks} lần kiểm tra bao và ${f.compares} lần so sánh của con trỏ, so với ${f.pool.length * f.queries.length} lần nếu thử mọi đường tại mọi x.`;
    }
  },
  takeaways: [
    'Kĩ thuật bao lồi: công thức chuyển dp[i] = min theo j của dp[j] + b[j]·x[i] là tìm đường thấp nhất tại x[i]. Chỉ giữ đường bao dưới. Khi các hệ số góc được thêm theo thứ tự và các truy vấn cũng theo thứ tự, mỗi đường được đẩy vào và lấy ra một lần, còn con trỏ chỉ dịch sang phải: tổng cộng O(n) thay cho O(n²).',
    'Hàng đợi đơn điệu (monotonic queue): dp[i] = min của dp[j] trên một cửa sổ trượt i − k ≤ j < i. Giữ một hàng đợi hai đầu (deque) các ứng viên có giá trị tăng dần; một giá trị mới hơn và nhỏ hơn làm các giá trị cũ vô dụng mãi mãi. O(n) thay cho O(n·k).',
    'QHĐ chia để trị: khi điểm chia tốt nhất opt(i) không bao giờ giảm khi i tăng, ta giải i ở giữa trước và chỉ tìm ở mỗi nửa về phía của nó so với opt(mid). Mỗi tầng tốn O(n log n) thay cho O(n²).',
    'Tối ưu Knuth: với QHĐ trên đoạn mà điểm chia tốt nhất thoả opt[i][j − 1] ≤ opt[i][j] ≤ opt[i + 1][j], mỗi ô chỉ tìm giữa điểm chia của hai ô bên cạnh, và tổng công việc rút gọn thành O(n²) thay cho O(n³).',
    'Chọn ví dụ có một đường vô dụng, rồi đổi tung độ gốc của nó thành 8: đường bao lõm xuống và đường đó gia nhập bao lồi.',
  ],
  complexityHead: ['Kĩ thuật', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Bao lồi, đã sắp xếp',
      'O(n + q)',
      'Mỗi đường được đẩy vào và lấy ra một lần; con trỏ chỉ dịch sang phải.',
    ],
    [
      'Bao lồi, truy vấn theo thứ tự bất kì',
      'O((n + q) log n)',
      'Tìm kiếm nhị phân trên đường bao cho mỗi x.',
    ],
    ['Hàng đợi đơn điệu', 'O(n)', 'Mỗi chỉ số vào và ra khỏi hàng đợi hai đầu một lần.'],
    [
      'QHĐ chia để trị',
      'O(k · n log n)',
      'opt đơn điệu, nên mỗi mức đệ quy quét O(n) cho mỗi tầng.',
    ],
    ['Tối ưu Knuth', 'O(n²)', 'Các khoảng điểm chia trên một đường chéo cộng lại chỉ còn O(n).'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Trong ví dụ “Sáu đường, có một cặp song song”, giá trị y nhỏ nhất tại x = 3 là bao nhiêu?',
      answer: 6,
      hints: ['Chạy tới bước cuối và đọc bảng “Đáp án” tại x = 3.'],
      solution: 'L2: y = x + 3 thấp nhất trong khoảng x = 2 đến x = 4, và cho 3 + 3 = 6.',
    },
    {
      type: 'choice',
      prompt: 'Trong ví dụ “Năm đường, có một đường vô dụng”, đường nào bị lấy ra?',
      options: ['L1: y = −x + 14', 'L2: y = x + 4', 'L3: y = 10', 'L4: y = 2x + 1'],
      answer: 2,
      hints: ['Chạy tới khi một lần kiểm tra báo “Lấy … ra”.'],
      solution:
        'L3: y = 10. L1 cắt L2 tại x = 5, nơi cả hai đều bằng 9, thấp hơn 10, nên L3 không bao giờ thấp nhất một cách thực sự.',
    },
    {
      type: 'number',
      prompt:
        'Trong ví dụ “Một đường chỉ chạm đường bao”, có bao nhiêu đường còn lại trên bao lồi?',
      answer: 2,
      unit: 'đường',
      hints: ['Chạy tới bước cuối và đọc danh sách bao lồi.'],
      solution:
        'Chỉ còn L4: y = x + 1 và L1: y = −2x + 12. Khi L2 vào, nó cắt L4 tại x = 4, đúng chỗ L3 lẽ ra bắt đầu thấp nhất, nên L3 chỉ chạm đường bao tại một điểm: khi bằng nhau thì lấy ra. Sau đó L1 cắt L4 tại x ≈ 3,67, trước khi L2 bắt đầu thấp nhất, nên L2 cũng bị lấy ra.',
    },
    {
      type: 'choice',
      prompt: 'Kĩ thuật tối ưu nào hợp với dp[i] = a[i] + min(dp[i − k], …, dp[i − 1])?',
      options: ['Kĩ thuật bao lồi', 'Hàng đợi đơn điệu', 'Tối ưu Knuth', 'QHĐ trên mặt nạ bit'],
      answer: 1,
      hints: ['Các ứng viên tạo thành một cửa sổ trượt.'],
      solution:
        'Đây là giá trị nhỏ nhất trên cửa sổ trượt: giữ một hàng đợi hai đầu các chỉ số có giá trị dp tăng dần, tổng cộng O(n).',
    },
    {
      type: 'choice',
      prompt:
        'Kĩ thuật tối ưu nào hợp với dp[i] = min theo j < i của dp[j] + b[j]·x[i], khi b giảm dần?',
      options: ['Kĩ thuật bao lồi', 'Hàng đợi đơn điệu', 'QHĐ chia để trị', 'QHĐ chữ số'],
      answer: 0,
      hints: ['Đọc dp[j] + b[j]·x như một đường thẳng theo x.'],
      solution:
        'Mỗi j là đường thẳng y = b[j]·x + dp[j], và dp[i] là đường thấp nhất tại x[i]: đó là kĩ thuật bao lồi.',
    },
    {
      type: 'text',
      prompt: 'Tối ưu Knuth đưa QHĐ trên đoạn từ O(n³) xuống còn bao nhiêu?',
      accept: ['O(n^2)', 'O(n²)', 'n^2'],
      hints: ['Các khoảng điểm chia của mỗi đường chéo cộng lại được O(n).'],
      solution:
        'O(n²): có n đường chéo, và các khoảng điểm chia của mỗi đường chéo cộng lại chỉ còn O(n).',
    },
  ],
  nextTeaser:
    'Bài sau là phần luyện tập: bài toán QHĐ nâng cao, nơi bạn tự chọn trạng thái và kĩ thuật cho từng đề.',
};
