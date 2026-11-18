/** @typedef {import('$lib/algo-engine/graph.js').BfsFrame} BfsFrame */
import { gridCopy } from '../grid-copy.vi.js';

export const vi = {
  ...gridCopy,
  slug: 'bfs-grid',
  topic: 'graphs',
  level: 'Cơ bản',
  title: 'Duyệt theo chiều rộng trên lưới',
  intro:
    'Duyệt theo chiều rộng (BFS) khám phá đồ thị theo từng vòng: trước hết là mọi ô cách điểm xuất phát một bước, rồi mọi ô cách hai bước, và cứ thế. Nhờ thứ tự ấy, lần đầu tiên chạm tới đích, BFS đã tìm được một đường đi ngắn nhất.',
  summary:
    'Xem BFS lan ra theo từng vòng trên lưới do bạn vẽ, và hiểu vì sao đường đầu tiên nó tìm tới đích là một đường ngắn nhất.',
  instruction:
    'Vẽ tường bằng cách bấm hoặc kéo trên lưới, hoặc nhấn Enter ở ô đang chọn. Dời điểm xuất phát và đích, rồi cho phép tìm kiếm chạy. Con số trên mỗi ô là khoảng cách từ điểm xuất phát đến ô đó.',
  randomMaze: 'Tường ngẫu nhiên',
  clearWalls: 'Xoá hết tường',
  queueLabel: 'Hàng đợi (đầu hàng trước)',
  queueEmpty: 'rỗng',
  discoveredLabel: 'Số ô đã phát hiện',
  pathLabel: 'Độ dài đường BFS',
  legend: {
    start: 'Điểm xuất phát',
    goal: 'Đích',
    wall: 'Tường',
    frontier: 'Trong hàng đợi',
    visited: 'Đã thăm',
    current: 'Đang xét',
    path: 'Đường BFS',
  },
  /** @param {number} dist */
  distanceNote(dist) {
    return dist >= 0 ? `khoảng cách ${dist}` : '';
  },
  /** @param {BfsFrame} f @param {number} cols */
  describe(f, cols) {
    const at = (/** @type {number} */ c) => vi.coord(c, cols);
    switch (f.kind) {
      case 'start':
        return 'Đưa điểm xuất phát vào hàng đợi với khoảng cách 0.';
      case 'dequeue':
        return `Lấy ${at(f.current)} ra khỏi đầu hàng, khoảng cách ${f.dist[f.current]}.`;
      case 'enqueue':
        return `${at(f.touched)} trống và chưa được thấy — ghi khoảng cách ${f.dist[f.touched]} rồi đưa vào hàng đợi.`;
      case 'found':
        return `Đã tới đích. Lần theo parent ngược về cho ta một đường đi ngắn nhất dài ${f.path.length - 1} bước.`;
      case 'no-path':
        return 'Hàng đợi đã rỗng mà vẫn chưa tới đích — tường đã chặn kín đường.';
    }
  },
  takeaways: [
    'Bí quyết nằm cả ở hàng đợi (queue): vào trước ra trước, nên các ô được xét theo thứ tự khoảng cách tăng dần.',
    'Đánh dấu một ô là đã thăm ngay khi đưa nó vào hàng đợi — không phải khi lấy nó ra — để nó không vào hàng đợi hai lần.',
    'BFS chỉ tìm được đường đi ngắn nhất khi mọi bước có cùng chi phí. Với cạnh có trọng số, bạn cần thuật toán Dijkstra.',
    'Đổi hàng đợi thành ngăn xếp (stack), ta được duyệt theo chiều sâu (DFS): vẫn đến được mọi ô, nhưng đường đầu tiên nó tìm hiếm khi là đường ngắn nhất.',
    'Thử vẽ một bức tường chắn ngang lưới, chừa một khe hở: các vòng lách qua khe và đường ngắn nhất uốn quanh bức tường.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian',
      'O(V + E)',
      'Với V ô và E cạnh nối các ô trống kề nhau, mỗi ô vào hàng đợi nhiều nhất một lần, và mỗi cạnh được xét nhiều nhất hai lần — một lần từ mỗi đầu.',
    ],
    ['Bộ nhớ', 'O(V)', 'Tập đã thăm và hàng đợi, mỗi thứ có thể chứa mọi ô.'],
  ],
  nextTeaser:
    'Bài sau đổi hàng đợi thành ngăn xếp: duyệt theo chiều sâu trên lưới lao sâu vào từng hành lang trước khi quay lui.',
};
