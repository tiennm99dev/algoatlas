/** @typedef {import('$lib/algo-engine/dijkstra-grid.js').DijkstraFrame} DijkstraFrame */
import { gridCopy } from '../grid-copy.vi.js';

export const vi = {
  ...gridCopy,
  slug: 'dijkstra-grid',
  topic: 'shortest-paths',
  level: 'Trung bình',
  title: 'Thuật toán Dijkstra trên lưới',
  intro:
    'Khi có bước đi tốn hơn bước khác, đường đi ít bước nhất không còn là đường rẻ nhất. Thuật toán Dijkstra luôn mở rộng ô rẻ nhất đang biết, nên khi chạm tới đích, nó đã tìm được đường rẻ nhất. Một bước đi tốn bằng trung bình chi phí của hai ô nó nối: 1 trên đất trống, 5 khi đi trong bùn, 3 khi bước vào hoặc ra khỏi bùn.',
  summary:
    'Xem thuật toán Dijkstra tìm đường rẻ nhất qua một lưới có bùn, và hiểu vì sao một ô chỉ được chốt khi nó được lấy ra khỏi hàng đợi.',
  instruction:
    'Bấm hoặc kéo trên lưới để vẽ tường và bùn, hoặc nhấn Enter ở ô đang chọn. Dời điểm xuất phát và đích, rồi bấm phát. Các con số là chi phí rẻ nhất đang biết để đến từng ô.',
  tools: {
    wall: gridCopy.tools.wall,
    mud: 'Bùn',
    start: gridCopy.tools.start,
    goal: gridCopy.tools.goal,
  },
  randomTerrain: 'Địa hình ngẫu nhiên',
  clearTerrain: 'Xoá địa hình',
  hotLabel: 'vừa đẩy vào',
  pqLabel: 'Hàng đợi ưu tiên (rẻ nhất ra trước)',
  pqEmpty: 'rỗng',
  /** A stale entry costs more than the cell's best known cost now. @param {number} cell @param {number} cols @param {number} d @param {boolean} stale */
  pqChip(cell, cols, d, stale) {
    return `${vi.coord(cell, cols)} ${d}${stale ? ' (cũ)' : ''}`;
  },
  settledLabel: 'Đã chốt',
  relaxLabel: 'Số lần nới lỏng',
  costLabel: 'Chi phí đường đi Dijkstra',
  compareTitle: 'Ít bước nhất hay rẻ nhất',
  /** @param {number} steps @param {number} cost */
  bfsRoute(steps, cost) {
    return `Đường BFS: ${steps} bước, chi phí ${cost}`;
  },
  /** @param {number} steps @param {number} cost */
  dijkstraRoute(steps, cost) {
    return `Đường Dijkstra: ${steps} bước, chi phí ${cost}`;
  },
  legend: {
    start: 'Điểm xuất phát',
    goal: 'Đích',
    wall: 'Tường',
    frontier: 'Trong hàng đợi',
    visited: 'Đã chốt',
    current: 'Đang mở rộng',
    stale: 'Bản cũ, bỏ qua',
    path: 'Đường đi Dijkstra',
    mud: 'Bùn (chi phí 5)',
  },
  /** The hatch that marks mud is visual only, so the label states the cost. @param {boolean} mud */
  mudNote(mud) {
    return mud ? 'bùn, chi phí 5' : '';
  },
  /** @param {number} dist */
  costNote(dist) {
    return dist >= 0 ? `chi phí tốt nhất ${dist}` : '';
  },
  /** Confirmations for keyboard edits, which recolor a cell without changing the narration. */
  edits: {
    ...gridCopy.edits,
    mudAdded: /** @param {string} at */ (at) => `Đã thêm bùn ở ${at}.`,
    mudRemoved: /** @param {string} at */ (at) => `Đã bỏ bùn ở ${at}.`,
    terrainCleared: 'Bùn ở ô đó đã được dọn.',
  },
  /** @param {DijkstraFrame} f @param {number} cols */
  describe(f, cols) {
    const at = (/** @type {number} */ c) => vi.coord(c, cols);
    switch (f.kind) {
      case 'start':
        return 'Đưa điểm xuất phát vào hàng đợi với chi phí 0.';
      case 'pop':
        return `Lấy ${at(f.current)} ra với chi phí ${f.popped}. Trong hàng đợi không còn gì rẻ hơn, nên chi phí của ô này đã chốt.`;
      case 'stale':
        return `Lấy ${at(f.current)} ra với chi phí ${f.popped}, nhưng từ đó ta đã tìm được đường rẻ hơn là ${f.dist[f.current]}: đây là bản cũ, bỏ qua.`;
      case 'relax': {
        const step = f.dist[f.touched] - f.popped;
        const sum = `${f.popped} + ${step}${step > 1 ? ' (bước có bùn)' : ''} = ${f.dist[f.touched]}`;
        return f.improved
          ? `Đi qua ${at(f.current)} đến được ${at(f.touched)} với ${sum}, rẻ hơn trước. Đẩy một mục mới vào; mục cũ sẽ thành bản cũ.`
          : `${at(f.touched)} còn trống và chưa ai đến — chi phí là ${sum} qua ${at(f.current)}. Đẩy nó vào.`;
      }
      case 'found':
        return `Đã đến đích với chi phí ${f.popped}. Đường đi có ${f.path.length - 1} bước.`;
      case 'no-path':
        return 'Hàng đợi đã rỗng mà vẫn chưa đến được đích — tường đã chặn kín.';
    }
  },
  takeaways: [
    'Hàng đợi ưu tiên (priority queue) thay cho hàng đợi của BFS: ô có chi phí đang biết nhỏ nhất luôn được lấy ra trước.',
    'Một ô chỉ chốt khi được lấy ra, không phải khi được chạm tới lần đầu. Ở giữa vẫn có thể xuất hiện đường rẻ hơn; hãy xem chi phí của đích giảm xuống trước khi nó được chốt.',
    'Thay vì giảm khoá của một mục đã nằm trong hàng đợi, cách cài đặt này đẩy một mục mới vào và bỏ qua mục cũ khi nó nổi lên.',
    'Khi mọi chi phí bằng nhau, thuật toán Dijkstra loang theo đúng các vòng như BFS. Chi phí âm làm nó sai; khi đó cần thuật toán Bellman-Ford.',
    'Thử vẽ một dải bùn chắn ngang đường thẳng: đường đi sẽ uốn vòng qua mỗi khi đi vòng rẻ hơn lội qua.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian',
      'O((V + E) log V)',
      'Với V ô, E cạnh giữa các ô trống kề nhau và một heap nhị phân, mỗi lần đẩy vào hay lấy ra tốn O(log V), và mỗi lần nới lỏng có tối đa một lần đẩy vào.',
    ],
    ['Bộ nhớ', 'O(V + E)', 'Hàng đợi có thể chứa một mục cho mỗi lần nới lỏng, kể cả các bản cũ.'],
  ],
  nextTeaser:
    'Lưới chỉ là một loại đồ thị. Bài sau là thuật toán Dijkstra trên đồ thị tổng quát, với heap nhị phân và cạnh có trọng số bất kì không âm.',
};
