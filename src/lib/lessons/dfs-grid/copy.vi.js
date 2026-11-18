/** @typedef {import('$lib/algo-engine/dfs-grid.js').DfsFrame} DfsFrame */
import { gridCopy } from '../grid-copy.vi.js';

export const vi = {
  ...gridCopy,
  slug: 'dfs-grid',
  topic: 'graphs',
  level: 'Trung bình',
  title: 'Duyệt theo chiều sâu trên lưới',
  intro:
    'Duyệt theo chiều sâu (DFS) lao theo một hành lang xa nhất có thể và chỉ lùi lại khi bị kẹt. Nó đến được mọi ô mà BFS đến được, nhưng đường đầu tiên nó tìm tới đích thường không phải đường ngắn nhất.',
  summary:
    'Xem DFS lao sâu vào từng hành lang trên lưới do bạn vẽ, rồi so đường nó tìm được với đường ngắn nhất của BFS.',
  instruction:
    'Vẽ tường bằng cách bấm hoặc kéo trên lưới, hoặc nhấn Enter ở ô đang chọn. Dời điểm xuất phát và đích, rồi cho chạy. Con số trên mỗi ô là thứ tự ô đó được thăm. So sánh đường DFS với đường ngắn nhất của BFS.',
  randomMaze: 'Tường ngẫu nhiên',
  clearWalls: 'Xoá hết tường',
  stackLabel: 'Ngăn xếp (đỉnh trước)',
  stackEmpty: 'rỗng',
  hotLabel: 'vừa đẩy vào',
  visitedLabel: 'Số ô đã thăm',
  pathLabel: 'Độ dài đường DFS',
  bfsLabel: 'Đường ngắn nhất của BFS',
  legend: {
    start: 'Điểm xuất phát',
    goal: 'Đích',
    wall: 'Tường',
    frontier: 'Trong ngăn xếp',
    visited: 'Đã thăm',
    current: 'Đang xét',
    stale: 'Bản cũ, bỏ qua',
    path: 'Đường DFS',
  },
  /** @param {number} order */
  visitNote(order) {
    return order >= 1 ? `thăm thứ ${order}` : '';
  },
  /** @param {DfsFrame} f @param {number} cols */
  describe(f, cols) {
    const at = (/** @type {number} */ c) => vi.coord(c, cols);
    switch (f.kind) {
      case 'start':
        return 'Đẩy điểm xuất phát vào ngăn xếp.';
      case 'pop':
        return `Lấy ${at(f.current)} ra khỏi đỉnh ngăn xếp và thăm nó (lần thăm thứ ${f.order[f.current]}).`;
      case 'skip':
        return `${at(f.current)} đã được thăm rồi: đây là một bản cũ, nên ta bỏ qua.`;
      case 'push':
        return `Đẩy ${at(f.touched)} vào ngăn xếp: ô trống và chưa được thăm.`;
      case 'found':
        return `Đã tới đích. Lần theo parent ngược về cho ta một đường đi dài ${f.path.length - 1} bước.`;
      case 'no-path':
        return 'Ngăn xếp đã rỗng mà vẫn chưa tới đích — tường đã chặn kín đường.';
    }
  },
  takeaways: [
    'DFS chính là BFS dùng ngăn xếp (stack) thay cho hàng đợi: ô được phát hiện gần nhất sẽ được khám phá tiếp theo.',
    'Một ô có thể bị đẩy vào ngăn xếp nhiều lần trước khi được thăm. Đánh dấu đã thăm khi lấy ô ra, và bỏ qua các bản cũ, giúp mỗi liên kết cha luôn đúng.',
    'Đường đầu tiên DFS tìm được phụ thuộc vào thứ tự xét các ô kề, không phụ thuộc khoảng cách. Trên lưới này nó có thể dài hơn đường BFS rất nhiều.',
    'DFS chỉ giữ nhánh đang đi và các ô kề đang chờ (kể cả bản trùng), nên nó là nền tảng của việc sinh mê cung, phát hiện chu trình và sắp xếp tô-pô.',
    'Thử bấm “Tường ngẫu nhiên”, rồi so độ dài đường DFS với đường ngắn nhất của BFS ở hai bộ đếm.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian',
      'O(V + E)',
      'Với V ô và E cạnh nối các ô trống kề nhau, mỗi ô được thăm một lần, và mỗi cạnh gây ra nhiều nhất một lần đẩy từ mỗi đầu.',
    ],
    [
      'Bộ nhớ',
      'O(V + E)',
      'Ngăn xếp có thể giữ một bản trùng cho mỗi cạnh cho đến khi các bản cũ bị bỏ qua.',
    ],
  ],
  nextTeaser:
    'Bài sau dùng chính phép duyệt này để đếm các vùng tách rời: thành phần liên thông và loang.',
};
