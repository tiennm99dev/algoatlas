/** @typedef {import('$lib/algo-engine/eulerian-paths.js').EulerFrame} EulerFrame */

/** @param {string[]} names @param {number} i */
const nm = (names, i) => names[i] ?? String(i);
/** @param {string[]} names @param {number[]} list */
const join = (names, list) => list.map((i) => nm(names, i)).join(', ');

export const vi = {
  slug: 'eulerian-paths',
  topic: 'advanced-graphs',
  level: 'Trung bình',
  title: 'Đường đi và chu trình Euler',
  intro:
    'Đường đi Euler (Euler path) đi qua mỗi cạnh của đồ thị đúng một lần; chu trình Euler (Euler circuit) là đường đi Euler kết thúc ở chính nơi nó bắt đầu. Năm 1736, với bài toán bảy cây cầu ở Königsberg, Euler chỉ ra rằng câu trả lời chỉ phụ thuộc vào bậc của các đỉnh: một đồ thị liên thông có chu trình Euler khi mọi bậc đều chẵn, và có đường đi Euler khi có đúng hai đỉnh bậc lẻ. Sau đó thuật toán Hierholzer vẽ được một đường như vậy trong O(V + E).',
  summary:
    'Kiểm tra điều kiện về bậc, rồi xem thuật toán Hierholzer đi qua mỗi cạnh một lần, ghép các chu trình rẽ nhánh vào thành đường đi hoặc chu trình Euler.',
  instruction:
    'Đi từng bước: cây bút đi dọc các cạnh chưa dùng cho tới khi bị kẹt, rồi lùi lại, ghi các đỉnh vào lộ trình, và bắt đầu một nhánh rẽ ở bất kì chỗ nào còn cạnh chưa dùng. Dưới mỗi đỉnh là số cạnh chưa dùng của nó. Dùng công cụ Xoá hoặc Nối để đổi đồ thị, ví dụ bỏ G — E để có một đường đi Euler không phải chu trình.',
  resetGraph: 'Khôi phục đồ thị',
  graphAria: 'Đồ thị vô hướng đang được vẽ đường đi Euler.',
  stackLabel: 'Stack (đỉnh stack ở cuối)',
  routeLabel: 'Lộ trình, theo thứ tự lấy ra',
  pathLabel: 'Đường đi Euler',
  emptyText: 'rỗng',
  hotLabel: 'mới nhất',
  startMark: 'XP',
  stats: {
    used: 'Số cạnh đã dùng',
    odd: 'Số đỉnh bậc lẻ',
    depth: 'Độ sâu stack',
    detours: 'Số nhánh rẽ đã ghép',
  },
  legend: {
    pen: 'Bút (đỉnh stack)',
    stack: 'Trong stack',
    done: 'Trên lộ trình đã xong',
    odd: 'Bậc lẻ',
    trail: 'Cạnh đã đi, vẫn còn trong stack',
    route: 'Cạnh trên lộ trình đã xong',
    edge: 'Cạnh vừa đi hoặc vừa lấy ra',
  },
  states: {
    pen: 'bút ở đây',
    stack: 'trong stack',
    done: 'trên lộ trình',
    odd: 'bậc lẻ',
    start: 'xuất phát',
  },
  /** @param {number} d */
  degNote: (d) => `bậc ${d}`,
  /** @param {number} k */
  leftNote: (k) => `còn ${k}`,
  /** @param {string} name @param {string[]} states @param {string} note */
  vertexLabel: (name, states, note) => [`Đỉnh ${name}`, ...states, note].filter(Boolean).join(', '),
  /** @param {string[]} names @param {number[]} path */
  arrows: (names, path) => path.map((v) => nm(names, v)).join(' → '),
  /**
   * @param {EulerFrame} f
   * @param {string[]} names
   */
  describe(f, names) {
    const u = nm(names, f.current);
    const v = nm(names, f.other);
    switch (f.kind) {
      case 'start':
        return `Đếm bậc: ${f.odd.length === 0 ? 'mọi bậc đều chẵn' : `${f.odd.length} đỉnh bậc lẻ (${join(names, f.odd)})`}.`;
      case 'pick':
        return f.circuit
          ? `Mọi bậc đều chẵn và các cạnh liên thông với nhau, nên có chu trình Euler. Bắt đầu ở ${u}.`
          : `Có đúng hai đỉnh bậc lẻ, ${join(names, f.odd)}: có đường đi Euler và nó phải nối hai đỉnh này. Bắt đầu ở ${u}.`;
      case 'walk':
        return f.detour
          ? `${u} vẫn còn cạnh chưa dùng: bắt đầu một chu trình rẽ nhánh ở đây theo ${u} — ${v}. Nó sẽ được ghép vào lộ trình tại ${u}.`
          : `Đi theo ${u} — ${v} và đẩy ${v} vào stack. ${u} còn ${f.left[f.current]} cạnh chưa dùng.`;
      case 'pop':
        return f.stack.length === 0
          ? `${u} không còn cạnh chưa dùng: lấy nó ra. Stack đã rỗng và mọi cạnh đều nằm trên lộ trình.`
          : `${u} không còn cạnh chưa dùng: lấy nó ra, ghi vào lộ trình. Lùi về ${nm(names, f.stack[f.stack.length - 1])}.`;
      case 'done':
        if (f.reason === 'empty')
          return 'Không có cạnh nào để vẽ. Hãy dùng công cụ Nối để vẽ vài cạnh.';
        if (f.reason === 'odd')
          return `${f.odd.length} đỉnh có bậc lẻ (${join(names, f.odd)}). Một đường đi vào rồi lại ra khỏi mọi đỉnh ở giữa, nên chỉ hai đầu của nó được phép có bậc lẻ: không có đường đi Euler.`;
        if (f.reason === 'disconnected')
          return 'Các bậc thoả điều kiện, nhưng các cạnh rơi vào nhiều hơn một mảnh liên thông, nên không một lần đi nào dùng hết được chúng.';
        return `Xong. Đọc ngược lộ trình, ta được ${f.circuit ? 'chu trình' : 'đường đi'} Euler ${f.path.map((x) => nm(names, x)).join(' → ')}, dùng cả ${f.used} cạnh, mỗi cạnh một lần.`;
    }
  },
  takeaways: [
    'Mỗi lần đi qua một đỉnh dùng hai cạnh của nó, một cạnh vào và một cạnh ra. Vì vậy một đường khép kín qua mọi cạnh cần mọi bậc đều chẵn, còn một đường mở cần đúng hai đỉnh bậc lẻ, chính là hai đầu của nó.',
    'Với đồ thị liên thông (không tính các đỉnh cô lập), điều kiện về bậc cũng là đủ: có chu trình Euler khi mọi bậc đều chẵn, có đường đi Euler khi có đúng hai đỉnh bậc lẻ.',
    'Thuật toán Hierholzer đi cho tới khi bị kẹt, điều chỉ có thể xảy ra ở nơi đường đi phải kết thúc. Khi lùi lại, nó bắt đầu một nhánh rẽ ở bất kì đỉnh nào còn cạnh chưa dùng, và nhánh rẽ đó được ghép vào lộ trình ngay tại đỉnh ấy.',
    'Trên đồ thị có hướng, điều kiện cho chu trình là bậc vào = bậc ra ở mọi đỉnh; cho đường đi thì có một đỉnh nhiều hơn một cạnh ra và một đỉnh khác nhiều hơn một cạnh vào.',
    'Thử xem: bỏ G — E. E và G thành bậc lẻ, bút bắt đầu ở E và lộ trình kết thúc ở G, thành một đường đi chứ không phải chu trình.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Kiểm tra bậc',
      'O(V + E)',
      'Đếm mỗi cạnh ở cả hai đầu, rồi kiểm tra tính liên thông một lần.',
    ],
    [
      'Hierholzer',
      'O(V + E)',
      'Mỗi cạnh được đi một lần, và mỗi đỉnh có một con trỏ bỏ qua các cạnh đã dùng, không bao giờ lùi lại.',
    ],
    [
      'Bộ nhớ',
      'O(V + E)',
      'Danh sách kề, một dấu “đã dùng” cho mỗi cạnh, stack (ngăn xếp) và lộ trình.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Đồ thị ban đầu có bao nhiêu đỉnh bậc lẻ?',
      answer: 0,
      unit: 'đỉnh',
      hints: ['Đọc nhãn bậc ở bước đầu tiên.'],
      solution:
        'C và E có bậc 4, mọi đỉnh khác có bậc 2. Không có đỉnh bậc lẻ nào nên đồ thị có chu trình Euler.',
    },
    {
      type: 'text',
      prompt:
        'Đi tới bước cuối trên đồ thị ban đầu. Thuật toán Hierholzer cho chu trình Euler nào? Gõ các chữ cái, cách nhau bằng dấu phẩy.',
      accept: ['A, B, C, D, E, F, G, E, C, A', 'ABCDEFGECA', 'A B C D E F G E C A'],
      hints: [
        'Lộ trình được ghi theo thứ tự lấy ra: A, C, E, G, F, E, D, C, B, A.',
        'Hãy đọc ngược lại.',
      ],
      solution:
        'Bút bị kẹt ở A sau A → B → C → A, rẽ nhánh C → D → E → C, rồi E → F → G → E. Đảo ngược thứ tự lấy ra A, C, E, G, F, E, D, C, B, A ta được A, B, C, D, E, F, G, E, C, A.',
    },
    {
      type: 'number',
      prompt: 'Trên đồ thị ban đầu, có bao nhiêu chu trình rẽ nhánh được ghép vào?',
      answer: 2,
      unit: 'nhánh rẽ',
      hints: ['Mỗi lần bút đi tiếp sau một lần lấy ra là bắt đầu một nhánh rẽ.'],
      solution:
        'Một ở C (C → D → E → C) và một ở E (E → F → G → E), đúng như bộ đếm “Số nhánh rẽ đã ghép” cho thấy.',
    },
    {
      type: 'choice',
      prompt: 'Bỏ cạnh G — E. Điều gì xảy ra?',
      options: [
        'Không còn đường đi Euler nào nữa.',
        'Có đường đi Euler từ E đến G, nhưng không có chu trình.',
        'Chu trình Euler vẫn còn, chỉ ngắn hơn.',
        'Đồ thị không còn liên thông.',
      ],
      answer: 1,
      hints: ['Bậc của những đỉnh nào thay đổi, và chúng có thành lẻ không?'],
      solution:
        'E giảm xuống bậc 3 và G xuống bậc 1: có đúng hai đỉnh bậc lẻ. Có đường đi Euler, và nó phải bắt đầu ở một đỉnh trong hai đỉnh đó và kết thúc ở đỉnh còn lại.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, bài toán 2-SAT, biến các mệnh đề logic thành một đồ thị kéo theo và giải nó bằng các thành phần liên thông mạnh.',
};
