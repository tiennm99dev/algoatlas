/** @typedef {import('$lib/algo-engine/graph.js').BfsFrame} BfsFrame */
import { gridCopy } from '../grid-copy.vi.js';

export const vi = {
  ...gridCopy,
  slug: 'bfs-grid',
  topic: 'graphs',
  level: 'Cơ bản',
  title: 'BFS trên lưới',
  intro:
    'BFS (duyệt theo chiều rộng) khám phá đồ thị theo từng vòng: trước hết là mọi ô cách điểm xuất phát một bước, rồi mọi ô cách hai bước, và cứ thế. Nhờ thứ tự ấy, lần đầu tiên chạm tới đích, BFS đã tìm được một đường đi ngắn nhất.',
  summary:
    'Xem BFS lan ra theo từng vòng trên lưới do em vẽ, và hiểu vì sao đường đầu tiên nó tìm tới đích là một đường ngắn nhất.',
  instruction:
    'Vẽ tường bằng cách bấm hoặc kéo trên lưới, hoặc nhấn Enter ở ô đang chọn. Dời điểm xuất phát và đích, rồi cho phép tìm kiếm chạy. Con số trên mỗi ô là khoảng cách từ điểm xuất phát đến ô đó.',
  randomMaze: 'Tường ngẫu nhiên',
  clearWalls: 'Xoá hết tường',
  queueLabel: 'Queue (từ đầu đến cuối)',
  queueEmpty: 'rỗng',
  discoveredLabel: 'Số ô đã phát hiện',
  pathLabel: 'Độ dài đường BFS',
  legend: {
    start: 'Điểm xuất phát',
    goal: 'Đích',
    wall: 'Tường',
    frontier: 'Trong queue',
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
        return 'Đưa điểm xuất phát vào queue với khoảng cách 0.';
      case 'dequeue':
        return `Lấy ${at(f.current)} ra khỏi đầu queue, khoảng cách ${f.dist[f.current]}.`;
      case 'enqueue':
        return `${at(f.touched)} trống và chưa được thấy — ghi khoảng cách ${f.dist[f.touched]} rồi đưa vào queue.`;
      case 'found':
        return `Đã tới đích. Lần theo parent ngược về cho ta một đường đi ngắn nhất dài ${f.path.length - 1} bước.`;
      case 'no-path':
        return 'Queue đã rỗng mà vẫn chưa tới đích — tường đã chặn kín đường.';
    }
  },
  takeaways: [
    'Bí quyết nằm cả ở queue (hàng đợi): vào trước ra trước, nên các ô được xét theo thứ tự khoảng cách tăng dần.',
    'Đánh dấu một ô là đã thăm ngay khi đưa nó vào queue — không phải khi lấy nó ra — để nó không vào queue hai lần.',
    'BFS chỉ tìm được đường đi ngắn nhất khi mọi bước có cùng chi phí. Với cạnh có trọng số, em cần thuật toán Dijkstra.',
    'Đổi queue thành stack (ngăn xếp), ta được DFS (duyệt theo chiều sâu): vẫn đến được mọi ô, nhưng đường đầu tiên nó tìm hiếm khi là đường ngắn nhất.',
    'Thử vẽ một bức tường chắn ngang lưới, chừa một khe hở: các vòng lách qua khe và đường ngắn nhất uốn quanh bức tường.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian',
      'O(V + E)',
      'Với V ô và E cạnh nối các ô trống kề nhau, mỗi ô vào queue nhiều nhất một lần, và mỗi cạnh được xét nhiều nhất hai lần — một lần từ mỗi đầu.',
    ],
    ['Bộ nhớ', 'O(V)', 'Tập đã thăm và queue, mỗi thứ có thể chứa mọi ô.'],
  ],
  nextTeaser:
    'Bài sau đổi queue thành stack: DFS trên lưới lao sâu vào từng hành lang trước khi quay lui.',
};
