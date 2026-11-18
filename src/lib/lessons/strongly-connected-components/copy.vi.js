/** @typedef {import('$lib/algo-engine/strongly-connected-components.js').SccFrame} SccFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);
/** @param {string[]} names @param {number[]} list */
const join = (names, list) => list.map((i) => nm(names, i)).join(', ');

export const vi = {
  slug: 'strongly-connected-components',
  topic: 'advanced-graphs',
  level: 'Trung bình',
  title: 'Thành phần liên thông mạnh',
  intro:
    'Trong đồ thị có hướng, hai đỉnh liên thông mạnh khi mỗi đỉnh đều đi tới được đỉnh kia. Đồ thị tách thành các thành phần liên thông mạnh (strongly connected component, SCC): những nhóm lớn nhất mà trong đó mọi đỉnh đều tới được mọi đỉnh khác. Thu mỗi SCC lại thành một đỉnh, phần còn lại là DAG rút gọn (condensation), hoàn toàn không có chu trình. Thuật toán Tarjan và thuật toán Kosaraju đều tìm các SCC trong O(V + E).',
  summary:
    'Tìm các thành phần liên thông mạnh của một đồ thị có hướng bằng giá trị low của thuật toán Tarjan hoặc hai lượt duyệt của thuật toán Kosaraju, rồi thu chúng lại thành DAG rút gọn.',
  instruction:
    'Chọn Tarjan hoặc Kosaraju rồi đi từng bước. Thuật toán Tarjan ghi tin/low cho mỗi đỉnh và lấy ra một thành phần khi low bằng tin; thuật toán Kosaraju ghi thứ tự hoàn tất, rồi đi theo các cạnh theo chiều ngược lại. Ở bước cuối, DAG rút gọn hiện ra bên dưới đồ thị. Dùng công cụ Nối để thêm một cạnh như F → A và xem hai thành phần nhập làm một.',
  algoLabel: 'Thuật toán',
  algos: { tarjan: 'Tarjan (low-link)', kosaraju: 'Kosaraju (hai lượt)' },
  resetGraph: 'Khôi phục đồ thị',
  graphAria: 'Đồ thị có hướng cần tìm các thành phần liên thông mạnh.',
  condensedTitle: 'DAG rút gọn',
  condensedAria: 'DAG rút gọn: mỗi thành phần liên thông mạnh là một đỉnh.',
  condensedWait:
    'Hãy đi tới bước cuối: khi mọi đỉnh đã có thành phần, mỗi thành phần được thu lại thành một đỉnh ở đây.',
  /** @param {number} k @param {number} e */
  condensedSummary: (k, e) =>
    `${k} thành phần và ${e} cạnh giữa chúng. Không còn chu trình nào: mọi chu trình của đồ thị đều nằm gọn trong một thành phần.`,
  /** @param {number} c */
  compName: (c) => `C${c}`,
  /** @param {number} c @param {string} members */
  compLabel: (c, members) => `Thành phần C${c}: ${members}`,
  stackLabel: 'Stack SCC (đỉnh stack trước)',
  callLabel: 'Call stack (đỉnh stack trước)',
  finishTitle: 'Thứ tự hoàn tất của lượt 1 (từ đầu đến cuối)',
  compsLabel: 'Các thành phần đã tìm thấy',
  emptyText: 'rỗng',
  hotLabel: 'mới nhất',
  /** @param {number} c @param {string} members */
  compChip: (c, members) => `C${c}: ${members}`,
  stats: {
    comps: 'Số thành phần',
    edges: 'Số cạnh đã xét',
    time: 'Số đỉnh đã thăm',
    pass: 'Lượt',
  },
  legend: {
    current: 'Đang xử lí',
    open: 'Trên đường DFS hoặc trong stack',
    waiting: 'Đã hoàn tất, chờ gốc của nó trong stack',
    finished: 'Đã hoàn tất ở lượt 1',
    popped: 'Thành phần vừa hoàn chỉnh',
    done: 'Thuộc một thành phần (số ở góc)',
    edge: 'Cạnh đang xét',
    inside: 'Cạnh nằm trong một thành phần',
  },
  states: {
    current: 'đang xét',
    open: 'trong stack',
    path: 'trên đường DFS',
    waiting: 'đã hoàn tất, vẫn trong stack',
    finished: 'đã hoàn tất',
    popped: 'vừa hoàn chỉnh',
  },
  /** @param {number} tin @param {number} low */
  tinLow: (tin, low) => `${tin}/${low}`,
  /** @param {number} k */
  finishNote: (k) => `xong ${k}`,
  /** @param {number} tin @param {number} low */
  tinLowLabel: (tin, low) => `tin ${tin}, low ${low}`,
  /** @param {number} k */
  finishLabel: (k) => `hoàn tất thứ ${k}`,
  /** @param {string} name @param {string} state @param {string} detail @param {number} comp */
  vertexLabel: (name, state, detail, comp) =>
    [`Đỉnh ${name}`, state, detail, comp > 0 ? `thành phần C${comp}` : '']
      .filter(Boolean)
      .join(', '),
  /**
   * @param {SccFrame} f
   * @param {string[]} names
   * @param {'tarjan' | 'kosaraju'} algo
   */
  describe(f, names, algo) {
    const u = nm(names, f.current);
    const v = nm(names, f.other);
    switch (f.kind) {
      case 'start':
        return algo === 'tarjan'
          ? 'Ban đầu chưa đỉnh nào được thăm. Ta chạy một lần DFS theo thứ tự chữ cái, gán cho mỗi đỉnh thời điểm phát hiện tin và giá trị low.'
          : 'Lượt 1: chạy DFS theo thứ tự chữ cái và ghi lại mỗi đỉnh khi nó hoàn tất.';
      case 'enter':
        if (algo === 'kosaraju' && f.pass === 2) return `${u} vào thành phần C${f.count}.`;
        return algo === 'tarjan'
          ? `Thăm ${u}: tin = low = ${f.tin[f.current]}. Đẩy ${u} vào stack.`
          : `Thăm ${u}, đỉnh thứ ${f.tin[f.current] + 1} được phát hiện.`;
      case 'edge':
        if (algo === 'kosaraju' && f.pass === 2)
          return f.edgeKind === 'tree'
            ? `Cạnh ${v} → ${u} đi vào ${u}, nên trên đồ thị đảo chiều ${u} tới được ${v}: ${v} chưa có thành phần, thêm nó vào C${f.count}.`
            : `Cạnh ${v} → ${u} đảo chiều tới ${v}, đỉnh đã có thành phần. Bỏ qua.`;
        if (f.edgeKind === 'tree') return `Cạnh ${u} → ${v}: ${v} chưa được thăm, nên ta thăm nó.`;
        if (f.edgeKind === 'stack')
          return `Cạnh ${u} → ${v}: ${v} vẫn còn trong stack, nên ${u} quay ngược lên được tới nó. low[${u}] = min(low, tin[${v}]) = ${f.low[f.current]}.`;
        return algo === 'tarjan'
          ? `Cạnh ${u} → ${v}: ${v} đã thuộc một thành phần hoàn chỉnh, nên cạnh này rời khỏi thành phần của ${u}. Bỏ qua.`
          : `Cạnh ${u} → ${v}: ${v} đã được thăm. Không cần làm gì.`;
      case 'return':
        return `Quay về từ ${v} đến ${u}: low[${u}] = min(low[${u}], low[${v}]) = ${f.low[f.current]}.`;
      case 'keep':
        return `${u} đã xét xong nhưng low[${u}] = ${f.low[f.current]} < tin[${u}] = ${f.tin[f.current]}: nó tới được một đỉnh cũ hơn trong stack, nên ${u} ở lại đó và sau này vào thành phần của đỉnh ấy.`;
      case 'root':
        return algo === 'tarjan'
          ? `low[${u}] = tin[${u}] = ${f.tin[f.current]}: ${u} là gốc của một thành phần. Lấy ${join(names, f.popped)} ra làm C${f.count}.`
          : `Thành phần C${f.count} đã hoàn chỉnh: ${join(names, f.popped)}.`;
      case 'finish':
        return `${u} không còn đỉnh kề nào chưa thăm: nó hoàn tất thứ ${f.finished.length}.`;
      case 'transpose':
        return `Lượt 1 kết thúc: thứ tự hoàn tất ${join(names, f.finished)}. Giờ đảo chiều mọi cạnh và lấy các đỉnh từ đỉnh hoàn tất sau cùng ngược về đỉnh đầu tiên.`;
      case 'seed':
        return `${u} hoàn tất muộn nhất trong các đỉnh còn lại và chưa có thành phần: bắt đầu C${f.count} từ nó.`;
      case 'skip':
        return `${u} đã có thành phần. Bỏ qua.`;
      case 'done':
        return `Xong: ${f.count} thành phần. ${
          algo === 'tarjan'
            ? 'Thuật toán Tarjan tìm thấy các thành phần không có cạnh ra trước, tức theo thứ tự ngược của một thứ tự tô-pô trên DAG rút gọn.'
            : 'Thuật toán Kosaraju tìm thấy các thành phần nguồn trước, tức theo một thứ tự tô-pô trên DAG rút gọn.'
        }`;
    }
  },
  takeaways: [
    'Một SCC là tập đỉnh lớn nhất mà mọi đỉnh trong đó đều tới được nhau. Mỗi đỉnh thuộc đúng một SCC, và mọi chu trình có hướng đều nằm gọn trong một SCC.',
    'Thuật toán Tarjan chạy một lần DFS (duyệt theo chiều sâu). low[u] là tin nhỏ nhất mà cây con của u tới được qua một cạnh đi vào một đỉnh còn trong stack (ngăn xếp). Khi low[u] = tin[u], u là gốc và phần stack phía trên nó là một SCC.',
    'Thuật toán Kosaraju chạy hai lượt DFS: một lượt trên đồ thị để lấy thời điểm hoàn tất, một lượt trên đồ thị đảo chiều, mỗi lần bắt đầu từ đỉnh hoàn tất muộn nhất còn lại. Mỗi lần bắt đầu ở lượt 2 gom đúng một SCC.',
    'Thu mỗi SCC lại thành một đỉnh, ta được DAG rút gọn, luôn là một DAG. Thuật toán Tarjan tìm các đỉnh của nó theo thứ tự tô-pô ngược, thuật toán Kosaraju theo thứ tự tô-pô.',
    'Thử xem: thêm cạnh F → A. Lúc này A, B, C, D, E và F tới được nhau, nên hai thành phần nhập làm một và DAG rút gọn chỉ còn hai đỉnh.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian, Tarjan',
      'O(V + E)',
      'Một lần DFS: mỗi đỉnh được đẩy vào và lấy ra một lần, mỗi cạnh được xét một lần.',
    ],
    [
      'Thời gian, Kosaraju',
      'O(V + E)',
      'Hai lượt DFS cộng với việc dựng danh sách cạnh đảo chiều, mỗi phần đều tuyến tính.',
    ],
    [
      'DAG rút gọn',
      'O(V + E)',
      'Xem mỗi cạnh một lần: giữ cạnh khi hai đầu thuộc hai SCC khác nhau.',
    ],
    [
      'Bộ nhớ',
      'O(V + E)',
      'tin, low và thành phần cho mỗi đỉnh, stack, và đồ thị đảo chiều cho thuật toán Kosaraju.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Đồ thị ban đầu có bao nhiêu thành phần liên thông mạnh?',
      answer: 3,
      unit: 'thành phần',
      hints: ['Tìm các chu trình có hướng: mỗi chu trình nằm gọn trong một thành phần.'],
      solution:
        'Ba: A → B → C → A, D → E → F → D và G ⇄ H. Các cạnh B → D và G → F chỉ đi một chiều, nên chúng không nhập thành phần nào.',
    },
    {
      type: 'number',
      prompt: 'Chạy thuật toán Tarjan trên đồ thị ban đầu. Khi C xét xong, low[C] bằng bao nhiêu?',
      answer: 0,
      hints: ['C được thăm thứ ba (tin 2) và có cạnh C → A.', 'Lúc đó A vẫn còn trong stack.'],
      solution:
        'A ở trong stack với tin 0, nên cạnh C → A đặt low[C] = min(2, 0) = 0. Giá trị đó truyền lên B và A, và A lấy A, B, C ra làm một thành phần.',
    },
    {
      type: 'choice',
      prompt:
        'Trên đồ thị ban đầu, lượt thứ hai của thuật toán Kosaraju gom thành phần nào đầu tiên?',
      options: ['{A, B, C}', '{D, E, F}', '{G, H}'],
      answer: 2,
      hints: ['Lượt 2 bắt đầu từ đỉnh hoàn tất sau cùng ở lượt 1.'],
      solution:
        'Lượt 1 hoàn tất theo thứ tự C, F, E, D, B, A, H, G. G hoàn tất sau cùng, và đi theo các cạnh đảo chiều từ G chỉ tới được H, nên {G, H} đến trước. Đó là một thành phần nguồn của DAG rút gọn.',
    },
    {
      type: 'number',
      prompt: 'Thêm cạnh F → A. Còn lại bao nhiêu thành phần?',
      answer: 2,
      unit: 'thành phần',
      hints: ['Giờ A có tới được F không, và F có tới được A không?'],
      solution:
        'A → B → D → E → F → A là một chu trình mới, nên {A, B, C} và {D, E, F} nhập thành một thành phần sáu đỉnh. Cùng với {G, H}, còn lại hai thành phần.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, cầu và đỉnh khớp, dùng cùng ý tưởng tin/low để tìm những cạnh và đỉnh mà bỏ đi sẽ làm đồ thị vô hướng bị tách rời.',
};
