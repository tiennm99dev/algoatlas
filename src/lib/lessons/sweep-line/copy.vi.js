/** @typedef {import('$lib/algo-engine/sweep-line.js').SweepFrame} SweepFrame */
/** @typedef {import('$lib/algo-engine/sweep-line.js').SweepEvent} SweepEvent */
/** @typedef {import('$lib/algo-engine/sweep-line.js').SweepHit} SweepHit */
/** @typedef {import('$lib/algo-engine/sweep-line.js').Point} Point */

/** @param {number} v */
const coord = (v) => {
  const rounded = Math.round(v * 100) / 100;
  return `${Math.abs(rounded - v) > 1e-9 ? '≈ ' : ''}${String(rounded).replace('-', '−')}`;
};
/** @param {Point} p */
const pt = (p) => `(${coord(p.x)}, ${coord(p.y)})`;
export const vi = {
  slug: 'sweep-line',
  topic: 'geometry',
  level: 'Nâng cao',
  title: 'Thuật toán đường quét',
  intro:
    'Kiểm tra mọi cặp trong n đoạn thẳng tốn n(n − 1)/2 phép kiểm tra, trong khi hai đoạn chỉ có thể giao nhau ở chỗ một đường thẳng đứng đi qua cả hai. Vậy ta trượt một đường như thế từ trái sang phải, chỉ dừng ở các đầu mút, và chỉ giữ những đoạn nằm dưới nó: tập đang xét. Đó là ý tưởng của đường quét (sweep line). Một bài toán hai chiều trở thành một dãy các cập nhật nhỏ một chiều.',
  summary:
    'Quét một đường thẳng đứng qua các đoạn thẳng bạn kéo, theo dõi các sự kiện và tập đang xét, rồi tìm các giao điểm với số phép kiểm tra cặp ít hơn nhiều.',
  instruction:
    'Đi từng bước để dời đường quét từ sự kiện này sang sự kiện khác, và xem tập đang xét thay đổi. Kéo một đầu mút bất kì, hoặc chọn một đầu mút rồi nhấn Shift + phím mũi tên. Chọn ví dụ “Các đoạn dài song song” và so sánh số phép kiểm tra cặp của hai phương pháp.',
  methodLabel: 'Phương pháp',
  methods: { any: 'Có giao điểm nào không', all: 'Tìm mọi giao điểm' },
  presetLabel: 'Ví dụ',
  presets: {
    crossing: 'Có vài giao điểm',
    disjoint: 'Không có giao điểm',
    parallel: 'Các đoạn dài song song',
    mesh: 'Lưới giao điểm',
    touching: 'Chạm nhau ở đầu mút',
  },
  addSegment: 'Thêm đoạn thẳng',
  /** @param {string} name @param {number} x @param {number} y */
  pointLabel: (name, x, y) => `Đầu mút của đoạn ${name} ở (${x}, ${y})`,
  planeLabel:
    'Các đoạn thẳng trên mặt phẳng toạ độ cùng một đường quét thẳng đứng. Phím mũi tên chuyển giữa các đầu mút; Shift + mũi tên dời một đầu mút, Delete xoá đoạn chứa nó.',
  /** @param {number} max */
  fullError: (max) => `Chỉ dùng nhiều nhất ${max} đoạn thẳng.`,
  minError: 'Cần giữ lại ít nhất một đoạn thẳng.',
  legend: {
    sweep: 'Đường quét',
    active: 'Đang xét: nằm dưới đường quét',
    pair: 'Cặp đang kiểm tra',
    hit: 'Giao nhau',
    done: 'Đường quét đã đi qua',
    point: '× Giao điểm',
  },
  activeTitle: 'Tập đang xét, thấp nhất trước',
  activeEmpty: 'rỗng',
  eventsTitle: 'Các sự kiện, từ trái sang phải',
  eventsEmpty: 'chưa sắp xếp',
  hitsTitle: 'Các giao điểm đã tìm thấy',
  hitsEmpty: 'chưa có',
  /** @param {SweepEvent} e @param {(id: number) => string} name */
  eventChip: (e, name) => `${e.type === 'start' ? '+' : '−'}${name(e.id)} x=${e.x}`,
  /** @param {SweepHit} h @param {(id: number) => string} name */
  hitChip: (h, name) => `${name(h.i)} × ${name(h.j)} ${pt(h.at)}`,
  compareTitle: 'Số phép kiểm tra cặp trên các đoạn này',
  compareRows: {
    any: 'Có giao điểm nào không',
    all: 'Tìm mọi giao điểm',
    brute: 'Xét mọi cặp',
  },
  stats: {
    x: 'Hoành độ x của đường quét',
    active: 'Số đoạn đang xét',
    tests: 'Số phép kiểm tra cặp',
    hits: 'Số giao điểm đã tìm',
    answer: 'Có cặp nào giao nhau?',
  },
  pending: '…',
  yes: 'Có',
  no: 'Không',
  workedTitle: 'Ví dụ mẫu: A từ (0, 0) đến (4, 0), B từ (1, 2) đến (3, 2), C từ (5, 1) đến (6, 1)',
  workedSteps: [
    'Các sự kiện sau khi sắp xếp: +A tại x = 0, +B tại 1, −B tại 3, −A tại 4, +C tại 5, −C tại 6.',
    'x = 0: A vào. Tập đang xét là A, chưa có đoạn kề nào để kiểm tra.',
    'x = 1: B vào, nằm trên A. Hai đoạn kề nhau nên ta kiểm tra chúng: không giao nhau.',
    'x = 3: B ra. Phía trên B không có đoạn kề nào, nên không có cặp mới nào trở thành kề nhau.',
    'x = 4: A ra. x = 5 và 6: C vào rồi ra một mình. Tổng cộng chỉ một phép kiểm tra cặp thay vì ba, và không có hai đoạn nào giao nhau.',
  ],
  /**
   * @param {SweepFrame} f
   * @param {(id: number) => string} name
   */
  describe: (f, name) => {
    const event = f.eventAt >= 0 ? f.events[f.eventAt] : null;
    switch (f.kind) {
      case 'start':
        return `${f.segments.length} đoạn thẳng. Xét mọi cặp sẽ tốn ${(f.segments.length * (f.segments.length - 1)) / 2} phép kiểm tra.`;
      case 'sort':
        return `Sắp xếp ${f.events.length} đầu mút theo x; nếu hoà thì đầu bắt đầu đứng trước đầu kết thúc, để các đoạn chạm nhau tại cùng một x cùng nằm dưới đường quét.`;
      case 'arrive': {
        const e = /** @type {SweepEvent} */ (event);
        return e.type === 'start'
          ? `Đường quét đến x = ${e.x}, nơi ${name(e.id)} bắt đầu.`
          : `Đường quét đến x = ${e.x}, nơi ${name(e.id)} kết thúc.`;
      }
      case 'insert':
        return `${name(/** @type {SweepEvent} */ (event).id)} vào tập đang xét, giờ tập có ${f.active.length} đoạn.`;
      case 'check': {
        const [i, j] = /** @type {[number, number]} */ (f.pair);
        return f.pairHit
          ? `Kiểm tra ${name(i)} và ${name(j)}: chúng giao nhau tại ${pt(f.hits[f.hits.length - 1].at)}.`
          : `Kiểm tra ${name(i)} và ${name(j)}: chúng không giao nhau.`;
      }
      case 'remove':
        return `${name(/** @type {SweepEvent} */ (event).id)} rời tập đang xét, giờ tập có ${f.active.length} đoạn.`;
      case 'found': {
        const hit = f.hits[f.hits.length - 1];
        return `Tìm thấy một cặp: ${name(hit.i)} và ${name(hit.j)} giao nhau. Phương pháp này có thể dừng ở đây.`;
      }
      case 'done':
        if (f.method === 'any') {
          return f.hits.length
            ? `Dừng sau ${f.pairTests} phép kiểm tra cặp: có ít nhất một cặp giao nhau.`
            : `Không có hai đoạn nào giao nhau. Chỉ tốn ${f.pairTests} phép kiểm tra cặp.`;
        }
        return `Xong: tìm thấy ${f.hits.length} giao điểm với ${f.pairTests} phép kiểm tra cặp.`;
    }
  },
  takeaways: [
    'Đường quét biến bài hình học thành các sự kiện: sắp xếp hoành độ x của mọi đầu mút, rồi xử lí lần lượt. Giữa hai sự kiện liên tiếp, không có gì thay đổi.',
    'Tập đang xét chứa các đoạn nằm dưới đường quét. Mỗi đoạn vào một lần và ra một lần, nên có 2n sự kiện và 2n lần cập nhật.',
    'Có giao điểm nào không (thuật toán Shamos-Hoey): giữ tập đang xét theo thứ tự độ cao trong một cây cân bằng. Trước giao điểm đầu tiên, hai đoạn sắp giao nhau phải trở thành kề nhau, nên chỉ cần kiểm tra các đoạn kề nhau sau mỗi lần thêm và xoá: O(n log n).',
    'Tìm mọi giao điểm thì cần nhiều hơn. Kiểm tra mỗi đoạn mới với cả tập đang xét thì đơn giản và đúng, nhưng tốn O(n²) khi mọi đoạn chồng lên nhau theo x. Thuật toán Bentley-Ottmann thêm các giao điểm làm sự kiện và đổi chỗ hai đoạn kề nhau tại đó, đạt O((n + k) log n) với k giao điểm.',
    'Chọn “Các đoạn dài song song”: 8 đoạn cần 28 phép kiểm tra để tìm mọi giao điểm, nhưng ít hơn nhiều để biết có giao điểm nào không. Sau đó kéo một đầu mút vượt qua đoạn kề, và xem phương pháp thứ nhất dừng sớm.',
  ],
  complexityHead: ['Phương pháp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Xét mọi cặp, không quét',
      'Thời gian O(n²)',
      'Mỗi cặp trong n(n − 1)/2 cặp một phép kiểm tra thời gian hằng.',
    ],
    [
      'Có giao điểm nào không (Shamos-Hoey)',
      'Thời gian O(n log n), bộ nhớ O(n)',
      '2n sự kiện, mỗi sự kiện một lần cập nhật cây và nhiều nhất hai phép kiểm tra đoạn kề.',
    ],
    [
      'Tìm mọi giao điểm, phiên bản trong bài này',
      'Thời gian O(n log n + a)',
      'Sắp xếp, cộng tổng cộng a phép kiểm tra, với a là số cặp chồng lên nhau theo x. Trường hợp xấu nhất a khoảng n².',
    ],
    [
      'Tìm mọi giao điểm (Bentley-Ottmann)',
      'Thời gian O((n + k) log n)',
      'Các giao điểm trở thành sự kiện trong một hàng đợi ưu tiên, mỗi sự kiện đổi chỗ hai đoạn kề nhau.',
    ],
  ],
  nextTeaser:
    'Bài sau dựng cây đoạn nhiều chiều và tìm kiếm trong hình chữ nhật: trả lời nhanh câu hỏi những điểm nào nằm trong một hình chữ nhật.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Một lần quét qua 5 đoạn thẳng có bao nhiêu sự kiện?',
      answer: 10,
      unit: 'sự kiện',
      hints: ['Mỗi đoạn có một đầu bắt đầu và một đầu kết thúc.'],
      solution: 'Mỗi đoạn hai sự kiện: 5 · 2 = 10.',
    },
    {
      type: 'number',
      prompt: 'Không dùng đường quét, phải kiểm tra bao nhiêu cặp trong 8 đoạn thẳng?',
      answer: 28,
      unit: 'cặp',
      hints: ['n(n − 1) / 2.'],
      solution: '8 · 7 / 2 = 28.',
    },
    {
      type: 'number',
      prompt:
        'Quét các đoạn A từ (0, 0) đến (4, 0), B từ (1, 2) đến (3, 2) và C từ (5, 1) đến (6, 1). Tập đang xét lớn nhất có bao nhiêu đoạn?',
      answer: 2,
      unit: 'đoạn',
      hints: [
        'Viết khoảng x của từng đoạn.',
        'A phủ từ 0 đến 4, B phủ từ 1 đến 3 và C phủ từ 5 đến 6.',
      ],
      solution:
        'A và B chồng lên nhau theo x, còn C bắt đầu sau khi cả hai đã kết thúc. Vậy cùng lúc có nhiều nhất 2 đoạn đang xét.',
    },
    {
      type: 'choice',
      prompt: 'Khi một đầu bắt đầu và một đầu kết thúc có cùng x, vì sao xử lí đầu bắt đầu trước?',
      options: [
        'Để sắp xếp nhanh hơn',
        'Để các đoạn chạm nhau tại x đó cùng nằm trong tập đang xét và được kiểm tra',
        'Vì các đầu kết thúc không quan trọng',
      ],
      answer: 1,
      hints: ['Hãy tưởng tượng một đoạn kết thúc đúng chỗ một đoạn khác bắt đầu.'],
      solution:
        'Nếu đầu kết thúc đi trước, đoạn cũ đã rời đi trước khi đoạn mới đến, và chỗ chạm nhau tại điểm đó sẽ không bao giờ được kiểm tra.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao phương pháp “có giao điểm nào không” chỉ cần kiểm tra các đoạn kề nhau trong tập đang xét?',
      options: [
        'Vì các đoạn cách xa nhau về độ cao không bao giờ giao nhau',
        'Vì trước giao điểm đầu tiên thứ tự không đổi, và ngay trước khi hai đoạn giao nhau chúng phải kề nhau',
        'Vì cây cân bằng chỉ truy cập được các phần tử kề nhau',
      ],
      answer: 1,
      hints: ['Ngay trước khi hai đoạn chạm nhau, giữa chúng có gì?'],
      solution:
        'Ngay bên trái giao điểm đầu tiên, không có gì nằm giữa hai đoạn, nên chúng đã trở thành kề nhau sau một lần thêm hoặc xoá, và đã được kiểm tra lúc đó.',
    },
    {
      type: 'text',
      prompt:
        'Thời gian chạy của phương pháp “có giao điểm nào không” trên n đoạn thẳng là bao nhiêu, viết theo kí hiệu O lớn?',
      accept: ['O(n log n)', 'n log n'],
      hints: ['2n sự kiện, mỗi sự kiện một thao tác trên cây cân bằng.'],
      solution:
        'O(n log n): bước sắp xếp tốn chừng đó, và mỗi sự kiện trong 2n sự kiện làm một lần cập nhật cây cùng nhiều nhất hai phép kiểm tra thời gian hằng.',
    },
  ],
};
