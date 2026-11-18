/** @typedef {import('$lib/algo-engine/practice-recursion.js').HanoiFrame} HanoiFrame */
/** @typedef {import('$lib/algo-engine/practice-recursion.js').HanoiCall} HanoiCall */
/** @typedef {import('$lib/algo-engine/practice-recursion.js').SubsetFrame} SubsetFrame */
/** @typedef {import('$lib/algo-engine/practice-recursion.js').CallStatus} CallStatus */

const PEGS = ['A', 'B', 'C'];

/** @param {HanoiCall} c */
const hanoiName = (c) => `hanoi(${c.n}, ${PEGS[c.from]}, ${PEGS[c.to]}, ${PEGS[c.via]})`;

/** @param {number[]} chosen @param {string[]} items */
const setText = (chosen, items) => `{${chosen.map((i) => items[i]).join(', ')}}`;

/** @param {number} i @param {number[]} chosen @param {string[]} items */
const subsetName = (i, chosen, items) => `subsets(${i}, ${setText(chosen, items)})`;

export const vi = {
  slug: 'practice-recursion',
  topic: 'recursion',
  level: 'Trung bình',
  title: 'Luyện tập: tư duy đệ quy',
  intro:
    'Tư duy đệ quy nghĩa là tin vào lời gọi nhỏ hơn. Để chuyển một tháp n đĩa, hãy giả sử bạn đã chuyển được n − 1 đĩa, và cả kế hoạch chỉ gói gọn trong ba dòng. Để liệt kê mọi tập con, ta quyết định một phần tử, bỏ nó hoặc lấy nó, rồi để lời gọi nhỏ hơn liệt kê phần còn lại.',
  summary:
    'Giải bài toán tháp Hà Nội và sinh mọi tập con bằng đệ quy, kèm cây lời gọi và ngăn xếp lời gọi (call stack) bên cạnh.',
  instruction:
    'Chọn một bài toán, đặt số đĩa hoặc các phần tử, rồi chạy từng bước. Cây lời gọi cho thấy mọi lời gọi: lời gọi đang chạy, các lời gọi đang chờ trên ngăn xếp và các lời gọi đã xong. Dùng bàn cọc và cây để trả lời các câu hỏi bên dưới.',
  problemLabel: 'Bài toán',
  problems: { hanoi: 'Tháp Hà Nội', subsets: 'Tập con' },
  disksLabel: 'Số đĩa',
  itemsLabel: 'Các phần tử',
  /** @param {number} max */
  disksError: (max) => `Hãy dùng số đĩa nguyên từ 1 đến ${max}.`,
  itemErrors: {
    format: 'Hãy dùng các chữ cái hoặc chữ số đơn, ví dụ a, b, c.',
    count: 'Hãy dùng từ 1 đến 5 phần tử.',
    duplicate: 'Mỗi phần tử chỉ được xuất hiện một lần.',
  },
  pegs: PEGS,
  roles: { from: 'nguồn', to: 'đích', via: 'trung gian' },
  /** @param {number[][]} pegs */
  boardAria: (pegs) =>
    pegs
      .map(
        (disks, p) =>
          `Cọc ${PEGS[p]}: ${disks.length === 0 ? 'trống' : `các đĩa ${disks.join(', ')}, từ dưới lên`}.`,
      )
      .join(' '),
  boardTitle: 'Bàn cọc',
  chosenTitle: 'Các phần tử đã quyết định',
  /** @param {string[]} items @param {number[]} chosen @param {number} i */
  chosenAria: (items, chosen, i) =>
    `Các phần tử ${items.join(', ')}. Đã lấy: ${setText(chosen, items)}.${i >= 0 && i < items.length ? ` Đang quyết định ${items[i]}.` : ''}`,
  treeTitle: 'Cây lời gọi',
  /** @param {number} done @param {number} total */
  treeAria: (done, total) => `Cây lời gọi: đã xong ${done}/${total} lời gọi.`,
  /** @param {CallStatus} s */
  statusText: (s) =>
    ({
      '': 'chưa được gọi',
      active: 'đang chạy',
      waiting: 'đang chờ trên ngăn xếp',
      done: 'đã xong',
    })[s],
  hanoiName,
  subsetName,
  setText,
  stats: {
    moves: 'Số bước chuyển',
    calls: 'Số lời gọi',
    depth: 'Độ sâu ngăn xếp',
    outputs: 'Số tập con đã in',
  },
  /** @param {number} done @param {number} total */
  ofTotal: (done, total) => `${done}/${total}`,
  stackTitle: 'Ngăn xếp lời gọi (ngoài cùng ở trên)',
  stackEmpty: 'rỗng',
  outputsTitle: 'Kết quả in ra, theo thứ tự',
  outputsEmpty: 'chưa có gì',
  legend: {
    active: 'Đang chạy',
    waiting: 'Đang chờ trên ngăn xếp',
    done: 'Đã xong',
    output: 'In ra một tập con',
    idle: 'Chưa được gọi',
    moved: 'Đĩa vừa chuyển',
    taken: 'Đã lấy',
    left: 'Đã bỏ',
    deciding: 'Đang quyết định',
  },
  markers: {
    active: '▶',
    waiting: '…',
    done: '✓',
    output: '★',
    moved: '▶',
    taken: '+',
    left: '−',
    deciding: '?',
  },
  /**
   * @param {HanoiFrame} f
   * @param {HanoiCall[]} calls
   */
  describeHanoi(f, calls) {
    const c = calls[f.call];
    const total = calls[0]?.n ?? 0;
    switch (f.kind) {
      case 'start':
        return `Chuyển cả ${total} đĩa từ cọc A sang cọc C, mỗi lần một đĩa, không bao giờ đặt đĩa lớn lên trên đĩa nhỏ.`;
      case 'call':
        return c.n === 1
          ? `Gọi ${hanoiName(c)}: chỉ một đĩa, đây là trường hợp cơ sở.`
          : `Gọi ${hanoiName(c)}. Tin vào lời gọi nhỏ hơn: trước hết cất ${c.n - 1} đĩa trên cùng sang ${PEGS[c.via]}.`;
      case 'move': {
        const mv = /** @type {NonNullable<HanoiFrame['move']>} */ (f.move);
        const where = `đĩa ${mv.disk} từ ${PEGS[mv.from]} sang ${PEGS[mv.to]}`;
        return c.n === 1
          ? `Chuyển ${where} (bước chuyển ${f.moves}). ${hanoiName(c)} đã xong.`
          : `${c.n === 2 ? 'Đĩa nhỏ hơn đã' : `${c.n - 1} đĩa nhỏ hơn đã`} được cất ở ${PEGS[c.via]}, nên chuyển ${where} (bước chuyển ${f.moves}). Giờ đưa ${c.n === 2 ? 'nó' : 'chúng'} trở lại lên trên.`;
      }
      case 'return':
        return `${hanoiName(c)} đã xong: ${c.n} đĩa đã chuyển từ ${PEGS[c.from]} sang ${PEGS[c.to]}.`;
      case 'done':
        return `Đã giải: ${total} đĩa trong ${f.moves} bước chuyển, đúng bằng 2${sup(total)} − 1, ít nhất có thể.`;
    }
  },
  /**
   * @param {SubsetFrame} f
   * @param {string[]} items
   */
  describeSubsets(f, items) {
    const all = 2 ** items.length;
    switch (f.kind) {
      case 'start':
        return `Liệt kê mọi tập con của {${items.join(', ')}}: với mỗi phần tử, trước hết bỏ nó, sau đó lấy nó.`;
      case 'call':
        return `Gọi ${subsetName(f.i, f.chosen, items)}: quyết định ${items[f.i]}. Trước hết bỏ nó.`;
      case 'take':
        return `Quay lại ${subsetName(f.i, f.chosen, items)}: đã liệt kê xong mọi tập con không có ${items[f.i]}. Giờ lấy ${items[f.i]}.`;
      case 'output':
        return `i = n, mọi phần tử đã được quyết định: in ra ${setText(f.chosen, items)}, tập con thứ ${f.outputs.length}/${all}.`;
      case 'done':
        return `Xong: đủ ${all} tập con sau ${f.calls} lời gọi.`;
    }
  },
  takeaways: [
    'Tin vào lời gọi nhỏ hơn: viết bước cho n với giả sử lời gọi cho n − 1 đã chạy đúng, rồi đảm bảo trường hợp cơ sở đúng.',
    'Tháp Hà Nội cần T(n) = 2·T(n − 1) + 1 bước chuyển, tức 2ⁿ − 1. Đĩa k được chuyển 2ⁿ⁻ᵏ lần, nên đĩa nhỏ nhất cứ cách một bước lại chuyển một lần.',
    'Mỗi tập con là một đường đi gồm n lựa chọn lấy hoặc bỏ, nên có 2ⁿ tập con và cây lời gọi có 2ⁿ⁺¹ − 1 lời gọi.',
    'Cả hai đệ quy chỉ sâu n tầng (n + 1 với tập con), nên ngăn xếp vẫn nhỏ dù khối lượng công việc tăng theo hàm mũ.',
    'Thử tháp Hà Nội với 4 rồi 5 đĩa và xem đĩa 1 đi đâu đầu tiên: câu trả lời phụ thuộc vào n chẵn hay lẻ.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Tháp Hà Nội, số bước chuyển',
      'Θ(2ⁿ)',
      'T(n) = 2·T(n − 1) + 1 cho 2ⁿ − 1 bước chuyển; không lời giải nào ít bước hơn.',
    ],
    ['Tháp Hà Nội, bộ nhớ', 'O(n)', 'Mỗi lúc có nhiều nhất n lời gọi trên ngăn xếp.'],
    [
      'Tập con, thời gian',
      'O(n·2ⁿ)',
      '2ⁿ⁺¹ − 1 lời gọi, và mỗi kết quả trong 2ⁿ kết quả in ra tới n phần tử.',
    ],
    [
      'Tập con, bộ nhớ',
      'O(n²)',
      'Sâu n + 1 lời gọi, mỗi lời gọi giữ một bản sao chosen riêng. Dùng chung một danh sách, hoàn tác sau mỗi lời gọi, thì giảm còn O(n).',
    ],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Lời giải đệ quy cần bao nhiêu bước chuyển cho 5 đĩa?',
      answer: 31,
      unit: 'bước chuyển',
      hints: [
        'Đặt “Số đĩa” là 5 và chạy đến bước cuối.',
        'Moves(n) = 2·Moves(n − 1) + 1, với Moves(1) = 1.',
      ],
      solution:
        'Moves(n) = 2ⁿ − 1, nên 2⁵ − 1 = 31: 15 bước để cất bốn đĩa, 1 bước cho đĩa 5, 15 bước để đưa chúng trở lại.',
    },
    {
      type: 'number',
      prompt: 'Với 4 đĩa, đĩa 1 (đĩa nhỏ nhất) được chuyển bao nhiêu lần?',
      answer: 8,
      unit: 'lần',
      hints: ['Đếm các lần chuyển đĩa 1 trên bàn cọc, hoặc xem số thứ tự các bước chuyển của nó.'],
      solution:
        'Đĩa k được chuyển 2ⁿ⁻ᵏ lần, nên đĩa 1 được chuyển 2³ = 8 lần: mọi bước chuyển mang số lẻ trong 15 bước.',
    },
    {
      type: 'choice',
      prompt: 'Với 4 đĩa đi từ A sang C, ở bước chuyển đầu tiên đĩa 1 đi đâu?',
      options: ['Cọc B', 'Cọc C', 'Đĩa 1 không được chuyển đầu tiên'],
      answer: 0,
      hints: [
        'Đặt “Số đĩa” là 4 và chạy vài bước.',
        'hanoi(4, A, C, B) trước hết gọi hanoi(3, A, B, C), lời gọi này gọi hanoi(2, A, C, B)…',
      ],
      solution:
        'Các lời gọi luân phiên cọc đích: hanoi(3, A, B, C), hanoi(2, A, C, B), hanoi(1, A, B, C). Vậy đĩa 1 đi sang B trước. Với số đĩa lẻ, nó đi sang C trước.',
    },
    {
      type: 'number',
      prompt: 'Với 3 đĩa, đĩa nào thực hiện bước chuyển thứ 4?',
      answer: 3,
      hints: ['Đặt “Số đĩa” là 3 và chạy cho tới khi “Số bước chuyển” hiện 4.'],
      solution:
        '3 bước chuyển đầu cất đĩa 1 và 2 ở B, nên bước 4 là đĩa lớn nhất, đĩa 3, đi từ A sang C. Đó là bước chính giữa trong 7 bước.',
    },
    {
      type: 'number',
      prompt: 'Giải 4 đĩa cần bao nhiêu lời gọi hanoi, tính cả lời gọi đầu tiên?',
      answer: 15,
      unit: 'lời gọi',
      hints: ['Đọc ô “Số lời gọi” ở bước cuối, hoặc đếm các nút của cây lời gọi.'],
      solution:
        'Calls(n) = 1 + 2·Calls(n − 1) với Calls(1) = 1, nên Calls(4) = 15. Khi trường hợp cơ sở là n = 1, mỗi lời gọi thực hiện đúng một bước chuyển.',
    },
    {
      type: 'number',
      prompt: 'Tập {a, b, c, d} có bao nhiêu tập con, tính cả tập rỗng?',
      answer: 16,
      unit: 'tập con',
      hints: ['Chuyển sang “Tập con”, nhập a, b, c, d rồi chạy đến bước cuối.'],
      solution:
        'Mỗi phần tử trong 4 phần tử hoặc bị bỏ, hoặc được lấy: 2 × 2 × 2 × 2 = 2⁴ = 16 tập con.',
    },
    {
      type: 'choice',
      prompt: 'Với các phần tử a, b, c, tập con nào được in ra thứ 4?',
      options: ['{a}', '{b, c}', '{c}', '{a, b}'],
      answer: 1,
      hints: ['Mỗi lời gọi bỏ phần tử của nó trước rồi mới lấy. Hãy xem danh sách kết quả in ra.'],
      solution:
        'Thứ tự là {}, {c}, {b}, {b, c}, {a}, {a, c}, {a, b}, {a, b, c}: đếm nhị phân với a là bit cao nhất. Tập thứ 4 là {b, c}.',
    },
    {
      type: 'number',
      prompt: 'Liệt kê các tập con của 3 phần tử cần bao nhiêu lời gọi?',
      answer: 15,
      unit: 'lời gọi',
      hints: ['Đếm các nút của cây lời gọi cho a, b, c.'],
      solution:
        'Cây lời gọi là cây nhị phân đầy đủ với 2³ = 8 lá (mỗi lá một tập con) và 7 lời gọi bên trong: 2⁴ − 1 = 15 lời gọi.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Cây nhị phân và thuật ngữ, mở đầu phần cây: gốc, lá, cha, con và chiều cao.',
};

/** @param {number} n */
function sup(n) {
  return String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);
}
