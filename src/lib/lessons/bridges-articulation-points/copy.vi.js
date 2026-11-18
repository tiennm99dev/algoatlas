/** @typedef {import('$lib/algo-engine/bridges-articulation-points.js').CutFrame} CutFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);

export const vi = {
  slug: 'bridges-articulation-points',
  topic: 'advanced-graphs',
  level: 'Trung bình',
  title: 'Cầu và đỉnh khớp',
  intro:
    'Cầu (bridge) là cạnh mà bỏ đi sẽ làm đồ thị vô hướng mất liên thông; đỉnh khớp (articulation point) là đỉnh mà bỏ đi cũng làm vậy. Chúng là những điểm hỏng duy nhất của một mạng lưới: hỏng một chỗ là đứt. Chỉ một lần DFS (duyệt theo chiều sâu) là tìm được tất cả trong O(V + E): mỗi đỉnh được đánh số bằng thời điểm phát hiện tin, và ta tính low, điểm cao nhất mà cây con của đỉnh đó có thể quay ngược lên.',
  summary:
    'Chạy một lần DFS với nhãn tin và low để tìm mọi cầu và đỉnh khớp của một đồ thị vô hướng do em sửa.',
  instruction:
    'Đi từng bước qua phép DFS. Dưới mỗi đỉnh có tin/low; cạnh của cây DFS chuyển màu tím nhạt, cạnh ngược chuyển màu xanh dương. Khi DFS quay về từ v đến u, ta so low[v] với tin[u]: cầu chuyển màu đỏ, còn đỉnh khớp chuyển màu đỏ kèm dấu ĐK. Dùng công cụ Nối để thêm một cạnh như D — F và xem cầu biến mất.',
  resetGraph: 'Khôi phục đồ thị',
  graphAria: 'Đồ thị vô hướng đang được tìm cầu và đỉnh khớp.',
  pathLabel: 'Đường DFS (sâu nhất trước)',
  bridgesLabel: 'Cầu',
  cutsLabel: 'Đỉnh khớp',
  emptyText: 'chưa có',
  noneText: 'không có',
  hotLabel: 'vừa tìm thấy',
  cutMark: 'ĐK',
  stats: {
    bridges: 'Số cầu',
    cuts: 'Số đỉnh khớp',
    visited: 'Số đỉnh đã thăm',
    checks: 'Số lần xét cạnh',
  },
  legend: {
    current: 'Đang xử lí',
    path: 'Trên đường DFS',
    finished: 'Đã hoàn tất',
    cut: 'Đỉnh khớp (ĐK)',
    edge: 'Cạnh đang xét',
    tree: 'Cạnh của cây DFS',
    back: 'Cạnh ngược',
    bridge: 'Cầu',
  },
  states: {
    current: 'đang xét',
    path: 'trên đường DFS',
    finished: 'đã hoàn tất',
    cut: 'đỉnh khớp',
  },
  /** @param {number} tin @param {number} low */
  tinLow: (tin, low) => `${tin}/${low}`,
  /** @param {string} name @param {string[]} states @param {number} tin @param {number} low */
  vertexLabel: (name, states, tin, low) =>
    [`Đỉnh ${name}`, ...states, tin >= 0 ? `tin ${tin}, low ${low}` : '']
      .filter(Boolean)
      .join(', '),
  /** @param {string} a @param {string} b */
  edgeName: (a, b) => `${a} — ${b}`,
  /**
   * @param {CutFrame} f
   * @param {string[]} names
   */
  describe(f, names) {
    const u = nm(names, f.current);
    const v = nm(names, f.other);
    switch (f.kind) {
      case 'start':
        return 'Ban đầu chưa đỉnh nào được thăm. Ta chạy DFS theo thứ tự chữ cái và ghi tin/low cho mỗi đỉnh.';
      case 'enter':
        return f.current === f.root
          ? `Bắt đầu một cây DFS ở ${u}: tin = low = ${f.tin[f.current]}. ${u} là gốc của cây.`
          : `Vào ${u} từ ${nm(names, f.parent[f.current])}: tin = low = ${f.tin[f.current]}.`;
      case 'parent':
        return `${u} — ${v} là cạnh mà ta đã dùng để vào ${u}. Bỏ qua: quay lại theo chính cạnh đó không phải là một đường khác đi lên.`;
      case 'back':
        return `${u} — ${v} là cạnh ngược nối tới một tổ tiên: low[${u}] = min(low, tin[${v}]) = ${f.low[f.current]}.`;
      case 'down':
        return `${u} — ${v}: ${v} là một hậu duệ đã hoàn tất, nên cạnh ngược này đã được tính từ phía ${v}. Không có gì thay đổi.`;
      case 'tree':
        return `${v} chưa được thăm: ${u} — ${v} trở thành cạnh của cây DFS. Đi xuống ${v}.`;
      case 'return': {
        const head = `Quay về từ ${v} đến ${u}: low[${u}] = ${f.low[f.current]}. low[${v}] = ${f.low[f.other]}`;
        const t = f.tin[f.current];
        if (f.isBridge && f.isCut)
          return `${head} > tin[${u}] = ${t}: không đỉnh nào dưới ${v} quay ngược lên được ${u}, nên ${u} — ${v} là cầu và ${u} là đỉnh khớp.`;
        if (f.isBridge)
          return `${head} > tin[${u}] = ${t}: không đỉnh nào dưới ${v} quay ngược lên được ${u}, nên ${u} — ${v} là cầu. ${
            f.current === f.root
              ? `${u} là gốc, nên quy tắc cho gốc sẽ quyết định nó có phải đỉnh khớp không.`
              : `${u} đã là đỉnh khớp từ trước.`
          }`;
        if (f.isCut)
          return `${head} ≥ tin[${u}] = ${t}: cây con của ${v} tới được ${u} nhưng không cao hơn, nên bỏ ${u} sẽ tách cây con đó ra. ${u} là đỉnh khớp.`;
        if (f.low[f.other] >= t)
          return f.current === f.root
            ? `${head} ≥ tin[${u}] = ${t}, nhưng ${u} là gốc: quy tắc cho gốc sẽ quyết định.`
            : `${head} ≥ tin[${u}] = ${t}: ${u} đã là đỉnh khớp từ trước.`;
        return `${head} < tin[${u}] = ${t}: cây con của ${v} quay lên được cao hơn ${u}, nên ở đây cả cạnh lẫn ${u} đều không quan trọng.`;
      }
      case 'root':
        return f.isCut
          ? `${u} là gốc có ${f.children} con trên cây DFS. Các con chỉ gặp nhau được qua ${u}, nên ${u} là đỉnh khớp.`
          : `${u} là gốc có ${f.children} con trên cây DFS, nên bỏ nó đi không làm tách phần nào. Không phải đỉnh khớp.`;
      case 'done':
        return `Xong: ${f.bridges.length} cầu và ${f.cuts.length} đỉnh khớp, sau ${f.checks} lần xét cạnh.`;
    }
  },
  takeaways: [
    'DFS trên đồ thị vô hướng chỉ có cạnh của cây và cạnh ngược: mọi cạnh không thuộc cây đều nối một đỉnh với một tổ tiên của nó.',
    'low[u] là tin nhỏ nhất tới được từ cây con của u bằng các cạnh của cây đi xuống và một cạnh ngược đi lên. Nó được tính từ dưới lên khi DFS quay về.',
    'Cạnh u — v của cây là cầu khi và chỉ khi low[v] > tin[u]. Cạnh ngược không bao giờ là cầu, vì nó nằm trên một chu trình cùng các cạnh của cây.',
    'Một đỉnh u không phải gốc là đỉnh khớp khi có một con v với low[v] ≥ tin[u]; gốc là đỉnh khớp khi và chỉ khi nó có từ 2 con trở lên trên cây DFS. Một đỉnh có thể quan trọng dù không cầu nào chạm vào nó.',
    'Thử xem: thêm cạnh D — F. Cầu E — F giờ nằm trên một chu trình nên biến mất, và E không còn là đỉnh khớp.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian',
      'O(V + E)',
      'Một lần DFS: mỗi đỉnh được vào một lần và mỗi cạnh được xét từ cả hai đầu.',
    ],
    [
      'Vét cạn',
      'O(E · (V + E))',
      'Bỏ từng cạnh (hoặc từng đỉnh) rồi kiểm tra lại tính liên thông, mỗi phần tử lại tốn cả một lần tìm kiếm.',
    ],
    [
      'Bộ nhớ',
      'O(V)',
      'tin, low và cha cho mỗi đỉnh, cùng call stack (ngăn xếp lời gọi) của DFS sâu tối đa V.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Đồ thị ban đầu có bao nhiêu cầu?',
      answer: 1,
      unit: 'cầu',
      hints: [
        'Một cạnh nằm trên chu trình không bao giờ là cầu. Cạnh nào không nằm trên chu trình nào?',
      ],
      solution:
        'Chỉ E — F. Mọi cạnh khác đều nằm trên một trong các tam giác A B C, C D E hoặc F G H.',
    },
    {
      type: 'multi',
      prompt: 'Những đỉnh nào của đồ thị ban đầu là đỉnh khớp?',
      options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      answers: [2, 4, 5],
      hints: ['Hãy tưởng tượng bỏ một đỉnh đi: phần còn lại có bị tách ra không?'],
      solution:
        'C nối hai tam giác, còn E và F là hai đầu của cầu. Bỏ bất kì đỉnh nào khác thì phần còn lại vẫn liên thông.',
    },
    {
      type: 'number',
      prompt: 'Đi tới bước cuối. low[D] bằng bao nhiêu?',
      answer: 2,
      hints: ['Cây con của D gồm D, E, F, G, H. Cạnh ngược nào từ đó quay lên cao nhất?'],
      solution:
        'Cạnh ngược E — C tới được tin[C] = 2, và không đỉnh nào trong cây con của D lên cao hơn, nên low[D] = 2.',
    },
    {
      type: 'choice',
      prompt:
        'C là đỉnh khớp dù không cầu nào chạm vào nó. Phép kiểm tra nào, lúc quay về từ D, cho thấy điều đó?',
      options: [
        'low[D] = 2 > tin[C] = 2',
        'low[D] = 2 ≥ tin[C] = 2',
        'tin[D] = 3 > tin[C] = 2',
        'C có hai con trên cây DFS',
      ],
      answer: 1,
      hints: ['Phép kiểm tra cầu dùng dấu lớn hơn hẳn; phép kiểm tra đỉnh khớp thì không.'],
      solution:
        'low[D] = tin[C]: cây con của D quay lên được tới C nhưng không cao hơn, nên C — D không phải cầu (cạnh ngược E — C vòng qua nó), nhưng bỏ C sẽ tách cây con đó ra.',
    },
    {
      type: 'number',
      prompt: 'Dùng công cụ Nối để thêm cạnh D — F. Còn lại bao nhiêu cầu?',
      answer: 0,
      unit: 'cầu',
      hints: ['Giờ E — F có nằm trên một chu trình không?'],
      solution:
        'E — F — D — E là một chu trình, nên E — F không còn là cầu, và mọi cạnh đều nằm trên một chu trình nào đó: 0 cầu. C và F vẫn là đỉnh khớp.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, đường đi và chu trình Euler, tìm một đường đi qua mỗi cạnh đúng một lần, và cho biết khi nào đường như vậy tồn tại.',
};
