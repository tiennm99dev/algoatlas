/** @typedef {import('$lib/algo-engine/practice-graph-traversal.js').TraversalFrame} TraversalFrame */

/** @param {number} cell @param {number} cols */
const coord = (cell, cols) => `(${Math.floor(cell / cols)},${cell % cols})`;

export const vi = {
  slug: 'practice-graph-traversal',
  topic: 'graphs',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán duyệt đồ thị',
  intro:
    'Phần lớn các câu đố trên lưới và đồ thị thực chất là một lần BFS (duyệt theo chiều rộng) hay DFS (duyệt theo chiều sâu) trá hình; kĩ năng nằm ở chỗ chọn đúng cách. BFS tìm đường đi ngắn nhất và khoảng cách khi mọi bước có cùng chi phí, và nó có thể xuất phát cùng lúc từ nhiều nguồn. DFS cũng chắc chắn đến được mọi ô, nhưng đường đầu tiên nó tìm được có thể dài hơn đường ngắn nhất rất nhiều.',
  summary:
    'Giải các câu đố trên lưới bằng BFS hoặc DFS, so sánh số ô mỗi cách thăm và độ dài đường đi của nó, và cho một lần BFS đa nguồn lan ra từ nhiều đám cháy cùng lúc.',
  instruction:
    'Mở một câu đố, chọn BFS hoặc DFS rồi chạy từng bước. Bảng so sánh chạy cả hai phép tìm kiếm trên cùng một lưới, để em thấy cách nào thăm ít ô hơn và cách nào tìm được đường ngắn hơn. Sửa lưới bằng các công cụ: tường, nguồn (tối đa 4) và đích; bấm lại vào đích để bỏ nó đi, khi đó phép tìm kiếm sẽ loang khắp bản đồ.',
  puzzleLabel: 'Câu đố',
  puzzles: { maze: 'Mê cung', field: 'Bãi trống', fire: 'Ba đám cháy' },
  algoLabel: 'Phép tìm kiếm',
  algos: { bfs: 'BFS (queue)', dfs: 'DFS (stack)' },
  toolLabel: 'Sửa',
  tools: { wall: 'Tường', source: 'Nguồn', goal: 'Đích' },
  gridLabel: 'Lưới câu đố. Dùng phím mũi tên để di chuyển, Enter để sửa ô đang chọn.',
  frontierLabel: { bfs: 'Queue (từ đầu đến cuối)', dfs: 'Stack (đỉnh trước)' },
  frontierEmpty: 'rỗng',
  hotLabel: 'vừa thêm',
  compareTitle: 'Cả hai phép tìm kiếm trên lưới này',
  compareHead: ['', 'BFS', 'DFS'],
  compareRows: {
    visits: 'Số ô đã thăm',
    steps: 'Độ dài đường đi',
  },
  floodRows: {
    farthest: 'Ô xa nhất (khoảng cách BFS)',
    wrong: 'Số nhãn DFS lớn hơn khoảng cách thật',
  },
  stats: {
    visits: 'Số ô đã thăm',
    adds: 'Số lần thêm vào biên',
    result: 'Độ dài đường đi',
    reach: 'Nhãn lớn nhất',
  },
  legend: {
    source: 'Nguồn',
    goal: 'Đích',
    wall: 'Tường',
    frontier: 'Trong biên',
    visited: 'Đã thăm (số = khoảng cách hoặc độ sâu)',
    current: 'Vừa lấy ra',
    stale: 'Bản cũ, bỏ qua',
    path: 'Đường đi tìm được',
  },
  states: {
    source: 'Nguồn',
    goal: 'Đích',
    wall: 'Tường',
    frontier: 'Trong biên',
    visited: 'Đã thăm',
    current: 'Vừa lấy ra',
    stale: 'Bản cũ, bỏ qua',
    path: 'Trên đường đi',
  },
  /** @param {number} d */
  labelNote: (d) => (d >= 0 ? `nhãn ${d}` : ''),
  /** @param {number} cell @param {number} cols @param {string} kind @param {string} note */
  cellLabel(cell, cols, kind, note) {
    const where = `Hàng ${Math.floor(cell / cols)}, cột ${cell % cols}`;
    return [where, kind, note].filter(Boolean).join(', ');
  },
  coord,
  edits: {
    /** @param {string} at */
    wallAdded: (at) => `Đã thêm tường ở ${at}.`,
    /** @param {string} at */
    wallRemoved: (at) => `Đã bỏ tường ở ${at}.`,
    /** @param {string} at */
    sourceAdded: (at) => `Đã thêm nguồn ở ${at}.`,
    /** @param {string} at */
    sourceRemoved: (at) => `Đã bỏ nguồn ở ${at}.`,
    /** @param {string} at */
    goalMoved: (at) => `Đã dời đích đến ${at}.`,
    goalRemoved: 'Đã bỏ đích: giờ phép tìm kiếm loang tới mọi ô đi tới được.',
    blocked: 'Ô đó đã có thứ khác. Nguồn, đích và tường không được nằm chung một ô.',
    tooManySources: 'Chỉ dùng tối đa 4 nguồn.',
    lastSource: 'Hãy giữ lại ít nhất một nguồn.',
  },
  /**
   * @param {TraversalFrame} f @param {number} cols @param {'bfs' | 'dfs'} algo
   * @param {number} sources @param {boolean} hasGoal
   */
  describe(f, cols, algo, sources, hasGoal) {
    const at = (/** @type {number} */ c) => coord(c, cols);
    const many = sources > 1;
    switch (f.kind) {
      case 'start':
        return algo === 'bfs'
          ? many
            ? `Đưa cả ${sources} nguồn vào queue với khoảng cách 0: một lần BFS lan ra từ tất cả các nguồn cùng lúc.`
            : 'Đưa nguồn vào queue với khoảng cách 0.'
          : many
            ? `Đẩy cả ${sources} nguồn vào stack với độ sâu 0.`
            : 'Đẩy nguồn vào stack với độ sâu 0.';
      case 'take':
        return algo === 'bfs'
          ? `Lấy ${at(f.current)} ra khỏi queue, khoảng cách ${f.label[f.current]}.`
          : `Lấy ${at(f.current)} ra khỏi stack và thăm nó ở độ sâu ${f.label[f.current]}.`;
      case 'skip':
        return `${at(f.current)} đã được thăm rồi: đây là một bản cũ, nên ta bỏ qua.`;
      case 'add':
        return algo === 'bfs'
          ? `Đưa ${at(f.touched)} vào queue với khoảng cách ${f.label[f.touched]}.`
          : `Đẩy ${at(f.touched)} vào stack: ô trống và chưa được thăm.`;
      case 'found':
        return `Đã tới đích sau ${f.visits} lần thăm. Đường đi ngược về dài ${f.path.length - 1} bước.`;
      case 'done':
        if (hasGoal) return 'Biên đã rỗng mà vẫn chưa tới đích: tường đã chặn kín đường.';
        return algo === 'bfs'
          ? 'Queue đã rỗng: mọi ô đi tới được đều có khoảng cách tới nguồn gần nhất.'
          : 'Stack đã rỗng: mọi ô đi tới được đều đã thăm, nhưng nhãn của nó chỉ là độ dài con đường DFS tình cờ đi qua.';
    }
  },
  takeaways: [
    'Đường đi ngắn nhất trên lưới hay đồ thị không có trọng số: dùng BFS. BFS xét các ô theo thứ tự khoảng cách, nên lần đầu tới đích, đường đi đã là ngắn nhất.',
    'Kiểm tra đi tới được, đếm vùng, hay khám phá mọi đường đi: cách nào cũng được, và DFS thường cho mã đơn giản hơn. Đường đầu tiên nó tìm tới đích có thể dài hơn đường ngắn nhất rất nhiều.',
    'BFS đa nguồn đưa mọi nguồn vào queue (hàng đợi) với khoảng cách 0. Khi đó chỉ một lần chạy O(rows × cols) đã cho mỗi ô khoảng cách tới nguồn gần nhất, thay vì chạy một lần BFS cho mỗi nguồn.',
    'Số ô phải thăm tuỳ vào lưới: DFS có thể may mắn chạm đích sớm, hoặc lang thang khắp bản đồ trước, còn BFS thăm mọi ô gần hơn đích.',
    'Thử xem: mở Bãi trống và so sánh hai độ dài đường đi, rồi mở Ba đám cháy và chuyển sang DFS để xem bao nhiêu nhãn bị sai.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'BFS hoặc DFS trên lưới',
      'O(rows × cols)',
      'Mỗi ô được thăm một lần và có nhiều nhất 4 ô kề cần xét.',
    ],
    [
      'BFS đa nguồn, k nguồn',
      'O(rows × cols)',
      'Mọi nguồn dùng chung một queue, nên chi phí không tăng theo k.',
    ],
    ['Mỗi nguồn một lần BFS', 'O(k × rows × cols)', 'Mỗi lần chạy có thể quét lại toàn bộ lưới.'],
    [
      'Bộ nhớ',
      'O(rows × cols)',
      'Nhãn và ô cha cho mỗi ô, cộng với queue hoặc stack (ngăn xếp); DFS có thể giữ các bản cũ.',
    ],
  ],
  practiceTitle: 'Luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Mở Mê cung và chạy BFS. Đường đi nó tìm được dài bao nhiêu bước?',
      answer: 24,
      unit: 'bước',
      hints: ['Chạy đến bước cuối; lời mô tả và bảng so sánh cho biết độ dài.'],
      solution:
        'BFS tới đích theo một đường dài 24 bước, và vì BFS khám phá theo khoảng cách, không có đường nào ngắn hơn.',
    },
    {
      type: 'number',
      prompt: 'Trên Mê cung, trước khi tới đích BFS thăm nhiều hơn DFS bao nhiêu ô?',
      answer: 27,
      unit: 'ô',
      hints: ['Đọc hàng Số ô đã thăm của bảng so sánh cho cả hai phép tìm kiếm.'],
      solution:
        'BFS thăm 52 ô còn DFS thăm 25 ô, chênh nhau 27. Các hành lang khiến DFS ít rẽ nhầm, và ở đây đường của nó cũng dài 24 bước, nhưng đó là may mắn chứ không được bảo đảm.',
    },
    {
      type: 'number',
      prompt: 'Mở Bãi trống. Đường đi DFS tìm được dài bao nhiêu bước?',
      answer: 89,
      unit: 'bước',
      hints: [
        'Chuyển sang DFS và chạy đến bước cuối, hoặc đọc hàng Độ dài đường đi.',
        'DFS chạy dọc hàng trên cùng, xuống theo mép phải, rồi uốn lượn qua lại.',
      ],
      solution:
        'DFS uốn lượn qua 90 ô và trả về một đường dài 89 bước. BFS tìm được đường 7 bước đi thẳng xuống theo mép trái.',
    },
    {
      type: 'number',
      prompt:
        'Mở Ba đám cháy. Mỗi phút, lửa lan sang các ô trống kề với mọi ô đang cháy. Sau bao nhiêu phút thì mọi ô đi tới được đều bốc cháy?',
      answer: 6,
      unit: 'phút',
      hints: [
        'Mỗi phút là một tầng của BFS, và cả ba đám cháy cùng bắt đầu trong queue với khoảng cách 0.',
        'Chạy BFS đến bước cuối và tìm nhãn khoảng cách lớn nhất.',
      ],
      solution:
        'BFS đa nguồn gán cho mỗi ô nhãn là phút ô đó bắt lửa. Nhãn lớn nhất là 6, nên cả bản đồ cháy hết sau 6 phút.',
    },
    {
      type: 'number',
      prompt:
        'Trên Ba đám cháy, chuyển sang DFS. Có bao nhiêu ô kết thúc với nhãn lớn hơn khoảng cách thật tới đám cháy gần nhất?',
      answer: 76,
      unit: 'ô',
      hints: ['Đọc hàng cuối của bảng so sánh.'],
      solution:
        'DFS gán cho 76 trong 84 ô trống một độ sâu lớn hơn khoảng cách BFS. Độ sâu của DFS đo con đường DFS tình cờ đi qua, không phải đường ngắn nhất.',
    },
    {
      type: 'choice',
      prompt:
        'Một câu đố hỏi số nước đi ít nhất để quân mã tới một ô trên bàn cờ trống. Phép tìm kiếm nào phù hợp?',
      options: [
        'DFS, vì nó tốn ít bộ nhớ hơn.',
        'BFS, vì mọi nước đi có cùng chi phí và nó tìm được số nước ít nhất.',
        'Cách nào cũng được; chúng luôn trả về cùng một đường đi.',
        'Không cách nào; chỉ thuật toán Dijkstra mới đếm được số nước đi.',
      ],
      answer: 1,
      hints: ['Câu hỏi có phải về đường đi ngắn nhất với các bước cùng chi phí không?'],
      solution:
        'Các nước đi của quân mã tạo thành một đồ thị không có trọng số và câu hỏi tìm đường đi ngắn nhất, đúng là thứ BFS cho ta. Thuật toán Dijkstra cũng làm được nhưng không cần thiết khi mọi bước đều tốn 1.',
    },
  ],
  nextTeaser:
    'Bài sau là Ôn tập: nền tảng, gom lại mảng, danh sách, stack, cây và đồ thị em đã học trong phần đầu.',
};
