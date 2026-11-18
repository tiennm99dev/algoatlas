/** @typedef {import('$lib/algo-engine/practice-advanced-graphs.js').FailureFrame} FailureFrame */
/** @typedef {import('$lib/algo-engine/practice-advanced-graphs.js').CycleFrame} CycleFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);
/** @param {string[]} names @param {number[]} list */
const join = (names, list) => list.map((i) => nm(names, i)).join(', ');

export const vi = {
  slug: 'practice-advanced-graphs',
  topic: 'advanced-graphs',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán đồ thị nâng cao',
  intro:
    'Hai câu hỏi đời thường thực ra là bài toán đồ thị trá hình. Bộ định tuyến nào mà hỏng thì mạng bị chia cắt? Đó là một đỉnh khớp (articulation point). Những mô-đun nào không bao giờ dựng được vì chúng cần lẫn nhau? Đó là một thành phần liên thông mạnh (strongly connected component) có nhiều hơn một mô-đun. Hãy làm hỏng các nút và phá vòng trên đồ thị em tự sửa, rồi trả lời các câu hỏi bên dưới.',
  summary:
    'Làm hỏng một nút mạng để xem những phần nào bị tách rời, và tìm các vòng phụ thuộc khiến không có thứ tự dựng.',
  instruction:
    'Ở chế độ Mạng, chọn nút bị hỏng trong danh sách hoặc bấm vào nó trên sơ đồ, rồi đi từng bước: phép loang đánh dấu từng phần vẫn còn hoạt động cùng nhau. Ở chế độ Phụ thuộc, đi từng bước qua phép tìm kiếm của thuật toán Tarjan để tìm các vòng; dùng công cụ Xoá trên một cạnh để phá vòng và có thứ tự dựng.',
  modeLabel: 'Bài toán',
  modes: { network: 'Mạng: làm hỏng một nút', deps: 'Phụ thuộc: tìm vòng' },
  failLabel: 'Nút bị hỏng',
  noFailure: 'không có',
  resetGraph: 'Khôi phục đồ thị',
  networkAria:
    'Mạng vô hướng gồm các bộ định tuyến; bấm vào một bộ định tuyến để chọn nó làm nút bị hỏng.',
  depsAria: 'Đồ thị phụ thuộc giữa các mô-đun; cạnh từ A đến B nghĩa là A cần B.',
  modulesTitle: 'Các mô-đun',
  /** Module names for the starting dependency graph, by vertex id. */
  modules: ['app', 'ui', 'api', 'auth', 'db', 'log', 'config'],
  partsLabel: 'Các phần vẫn hoạt động cùng nhau',
  queueLabel: 'Queue loang (đầu queue trước)',
  cyclesLabel: 'Các vòng phụ thuộc',
  orderLabel: 'Thứ tự dựng (từ đầu đến cuối)',
  stackLabel: 'Stack của thuật toán Tarjan (đỉnh stack trước)',
  emptyText: 'không có',
  noOrder: 'chưa có khi còn vòng',
  hotLabel: 'mới nhất',
  /** @param {number} k @param {string} members */
  partChip: (k, members) => `P${k}: ${members}`,
  stats: {
    before: 'Số mảnh lúc đầu',
    after: 'Số phần sau đó',
    largest: 'Phần lớn nhất',
    critical: 'Nút quan trọng?',
    comps: 'Số thành phần',
    onCycle: 'Số mô-đun trên vòng',
    cycles: 'Số vòng',
    buildable: 'Có thứ tự dựng?',
  },
  yes: 'có',
  no: 'không',
  pending: '—',
  legend: {
    failed: 'Nút bị hỏng',
    current: 'Đang xử lí',
    queued: 'Đã tới, đang trong queue',
    part: 'Thuộc một phần (số ở góc)',
    cycle: 'Trên một vòng phụ thuộc',
    stack: 'Trong stack của thuật toán Tarjan',
    single: 'Thành phần chỉ có một mô-đun',
    link: 'Liên kết đang xét',
    inside: 'Cạnh nằm trong một vòng',
  },
  states: {
    failed: 'bị hỏng',
    current: 'đang xét',
    queued: 'trong queue',
    cycle: 'trên một vòng',
    stack: 'trong stack',
    done: 'không thuộc vòng',
  },
  /** @param {number} k */
  partNote: (k) => `P${k}`,
  /** @param {number} tin @param {number} low */
  tinLow: (tin, low) => `${tin}/${low}`,
  /** @param {string} name @param {string} state @param {number} part */
  routerLabel: (name, state, part) =>
    [`Bộ định tuyến ${name}`, state, part > 0 ? `phần ${part}` : ''].filter(Boolean).join(', '),
  /** @param {string} name @param {string} module @param {string} state */
  moduleLabel: (name, module, state) =>
    [`Mô-đun ${name}${module ? ` (${module})` : ''}`, state].filter(Boolean).join(', '),
  /**
   * @param {FailureFrame} f
   * @param {string[]} names
   */
  describeFailure(f, names) {
    const u = nm(names, f.current);
    switch (f.kind) {
      case 'start':
        return `Toàn bộ mạng gồm ${f.before} mảnh ${f.before === 1 ? 'liên thông' : 'tách rời'}. ${f.failed >= 0 ? `Giờ làm hỏng ${nm(names, f.failed)}.` : 'Hãy chọn một nút để làm hỏng.'}`;
      case 'fail':
        return `${u} bị hỏng: bỏ nó cùng mọi liên kết của nó.`;
      case 'seed':
        return `${u} còn hoạt động và chưa thuộc phần nào: bắt đầu phần P${f.parts} từ nó.`;
      case 'expand':
        return `Lấy ${u} ra khỏi queue và xét các nút kề còn hoạt động của nó.`;
      case 'reach':
        return `${nm(names, f.other)} được nối với ${u}: nó vào phần P${f.parts}.`;
      case 'done': {
        const head = `${f.parts} phần vẫn hoạt động cùng nhau.`;
        if (f.failed < 0) return `${head} Hãy chọn một nút để làm hỏng rồi so sánh.`;
        return f.parts > f.before
          ? `${head} Nhiều hơn ${f.before} lúc đầu, nên ${nm(names, f.failed)} là nút quan trọng: một đỉnh khớp.`
          : `${head} Không nhiều hơn lúc đầu, nên ${nm(names, f.failed)} không phải nút quan trọng: mọi nút khác vẫn tới được đúng những nút như trước.`;
      }
    }
  },
  /**
   * @param {CycleFrame} f
   * @param {string[]} names
   */
  describeCycles(f, names) {
    const u = nm(names, f.current);
    switch (f.kind) {
      case 'start':
        return 'Chạy phép tìm SCC của thuật toán Tarjan: các mô-đun cần lẫn nhau sẽ rơi vào cùng một thành phần.';
      case 'enter':
        return `Thăm ${u}: tin = low = ${f.tin[f.current]}. Đẩy nó vào stack và đi theo những gì nó cần.`;
      case 'scc':
        return f.popped.length > 1
          ? `Thành phần ${join(names, f.popped)}: ${f.popped.length} mô-đun này cần lẫn nhau, tạo thành một vòng phụ thuộc. Không mô-đun nào trong số đó dựng trước được.`
          : f.blocked
            ? `Thành phần chỉ có ${u}: ${u} không nằm trên vòng nào, nhưng nó cần một mô-đun nằm trên vòng phụ thuộc, nên nó cũng không dựng được.`
            : `Thành phần chỉ có ${u}: mọi thứ nó cần đều đã được xếp chỗ, nên nó dựng được ngay.`;
      case 'done':
        return f.cycles.length
          ? `Xong: ${f.cycles.length} vòng phụ thuộc trên ${f.cycles.flat().length} mô-đun. Bỏ một cạnh của mỗi vòng để có thứ tự dựng.`
          : `Xong: không có vòng. Dựng theo thứ tự các thành phần hoàn tất: ${join(names, f.order)}.`;
    }
  },
  takeaways: [
    'Một nút là quan trọng, tức là đỉnh khớp, khi và chỉ khi bỏ nó đi sẽ tách mạng thành nhiều mảnh hơn. Đếm số mảnh bằng phép loang trước và sau là cách kiểm tra vét cạn.',
    'Cách vét cạn tốn một lần tìm kiếm cho mỗi nút, O(V · (V + E)). Phép DFS (duyệt theo chiều sâu) với giá trị low trong bài cầu và đỉnh khớp tìm mọi nút quan trọng chỉ trong một lượt O(V + E).',
    'Trong đồ thị phụ thuộc, một thành phần liên thông mạnh có từ hai mô-đun trở lên là một vòng: mỗi mô-đun cần một mô-đun khác bên trong nó, nên không mô-đun nào dựng trước được.',
    'Khi không có vòng, thuật toán Tarjan hoàn tất các thành phần không có cạnh ra trước, và đó chính là một thứ tự dựng: mỗi mô-đun đứng sau mọi thứ nó cần.',
    'Thử xem: làm hỏng D, rồi thêm liên kết E — F và làm hỏng D lần nữa. Chỉ một liên kết biến nút lá E thành một phần của một vòng, và D chia mạng thành hai phần thay vì ba.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Một lần hỏng', 'O(V + E)', 'Một lần loang qua các nút và liên kết còn hoạt động.'],
    [
      'Mọi lần hỏng, vét cạn',
      'O(V · (V + E))',
      'Mỗi nút một lần loang; phép DFS với giá trị low làm tất cả trong O(V + E).',
    ],
    [
      'Các vòng phụ thuộc',
      'O(V + E)',
      'Chạy phép tìm SCC của thuật toán Tarjan một lần trên các mô-đun.',
    ],
    [
      'Bộ nhớ',
      'O(V + E)',
      'Danh sách kề, một phần hoặc một thành phần cho mỗi nút, cùng queue (hàng đợi) hoặc stack (ngăn xếp).',
    ],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trong mạng ban đầu, làm hỏng bộ định tuyến D. Phần còn lại bị chia thành mấy phần?',
      answer: 3,
      unit: 'phần',
      hints: ['Chọn D trong danh sách “Nút bị hỏng” rồi bấm Đến bước cuối.'],
      solution:
        'D nối ba nhóm: tam giác A, B, C, nút lá E và tam giác F, G, H. Không có D thì chúng không tới được nhau: 3 phần.',
    },
    {
      type: 'multi',
      prompt: 'Những bộ định tuyến nào của mạng ban đầu là nút quan trọng?',
      options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      answers: [2, 3, 5],
      hints: ['Lần lượt làm hỏng từng bộ định tuyến và đọc ô “Nút quan trọng?”.'],
      solution:
        'C tách A và B ra, D chia mạng làm ba, còn F tách G và H ra. Mọi bộ định tuyến khác đều nằm trên một tam giác hoặc là nút lá E, nên phần còn lại vẫn liên thông.',
    },
    {
      type: 'number',
      prompt: 'Làm hỏng bộ định tuyến F. Phần lớn nhất còn lại có bao nhiêu bộ định tuyến?',
      answer: 5,
      unit: 'bộ định tuyến',
      hints: ['Đọc ô “Phần lớn nhất” ở bước cuối.'],
      solution:
        'A, B, C, D và E vẫn ở cùng nhau (5 bộ định tuyến); G và H tạo thành một phần gồm 2.',
    },
    {
      type: 'number',
      prompt:
        'Dùng công cụ Nối để thêm liên kết E — F, rồi làm hỏng D lần nữa. Giờ có bao nhiêu phần?',
      answer: 2,
      unit: 'phần',
      hints: ['Không có D, E còn tới được F, G và H không?'],
      solution:
        'E — F cho E thêm một lối ra, nên E, F, G và H vẫn ở cùng nhau. Chỉ A, B, C bị tách ra: 2 phần.',
    },
    {
      type: 'number',
      prompt:
        'Chuyển sang chế độ Phụ thuộc. Có bao nhiêu mô-đun của đồ thị ban đầu nằm trên một vòng phụ thuộc?',
      answer: 5,
      unit: 'mô-đun',
      hints: ['Đi tới bước cuối và đọc ô “Số mô-đun trên vòng”.'],
      solution:
        'api, auth và db cần lẫn nhau (C → D → E → C), còn log và config cần lẫn nhau (F ⇄ G): 3 + 2 = 5 mô-đun.',
    },
    {
      type: 'text',
      prompt:
        'Xoá các cạnh E → C và G → F. Thuật toán Tarjan cho thứ tự dựng nào? Gõ các chữ cái, cách nhau bằng dấu phẩy.',
      accept: ['E, G, D, C, B, F, A', 'EGDCBFA', 'E G D C B F A'],
      hints: [
        'Chuyển công cụ sửa đồ thị sang Xoá và bấm vào hai cạnh, rồi bấm Đến bước cuối.',
        'Các thành phần không có cạnh ra hoàn tất trước: db (E) không còn phụ thuộc nào.',
      ],
      solution:
        'Phép DFS từ A đi A → B → C → D → E. E không cần gì nên hoàn tất trước, rồi đến G (tới được từ D), rồi D, C và B. Quay về A, nó thăm F, mô-đun chỉ cần G, và A hoàn tất sau cùng: E, G, D, C, B, F, A.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, chia để trị và định lí thợ, cho em công thức để tính nhanh thời gian chạy của các thuật toán đệ quy chia bài toán thành nhiều phần.',
};
