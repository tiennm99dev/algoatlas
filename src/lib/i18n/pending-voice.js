/**
 * Topics whose lesson copy still uses the old voice ("bạn") or the old Vietnamese names of the
 * terms now written in English, and may still carry a lesson title from before those names
 * changed. Tests skip only those checks for lessons in these topics; every other check still
 * runs. Whoever moves a topic to the new voice and terms removes its line in the same commit,
 * and the last one removes this module and its imports.
 */
export const pendingTopics = new Set([
  // One topic per line, a blank line between, so parallel removals merge cleanly.
  'complexity',

  'arrays-strings',

  'sorting',

  'searching',

  'linked-lists',

  'stacks-queues',

  'structures',

  'recursion',

  'trees',

  'heaps',

  'graphs',

  'review-foundations',

  'shortest-paths',

  'union-find',

  'mst',

  'advanced-graphs',

  'greedy',

  'dynamic-programming',

  'backtracking',

  'balanced-bst',

  'review-core',

  'flows',

  'advanced-dp',

  'tree-techniques',

  'intractability',

  'advanced-heaps',

  'computation-models',

  'review-advanced',
]);

/**
 * Lesson titles from before the English-term rename, by slug. A lesson in a pending topic may
 * still use its old title, and a pending lesson's teaser may still name the next lesson by it.
 * @type {Record<string, string>}
 */
export const previousTitles = {
  'prefix-sums': 'Tổng tiền tố và mảng hiệu',
  'bubble-insertion-sort': 'Sắp xếp nổi bọt và sắp xếp chèn',
  'selection-sort-stability': 'Sắp xếp chọn và tính ổn định',
  'merge-quick-sort': 'Sắp xếp trộn và sắp xếp nhanh',
  heapsort: 'Sắp xếp vun đống',
  'counting-radix-sort': 'Sắp xếp đếm và sắp xếp theo cơ số',
  'singly-linked-lists': 'Danh sách liên kết đơn',
  'doubly-circular-lists': 'Danh sách liên kết đôi và danh sách liên kết vòng',
  'linked-list-techniques': 'Kĩ thuật trên danh sách liên kết',
  'practice-linked-lists': 'Luyện tập: bài toán danh sách liên kết',
  stacks: 'Ngăn xếp',
  'queues-deques': 'Hàng đợi và hàng đợi hai đầu',
  'stack-applications': 'Ứng dụng của ngăn xếp',
  'monotonic-stack-queue': 'Ngăn xếp đơn điệu và hàng đợi đơn điệu',
  'practice-stacks-queues': 'Luyện tập: ngăn xếp và hàng đợi',
  'hash-table': 'Bảng băm',
  'load-factor-rehashing': 'Hệ số tải và băm lại',
  'hash-functions': 'Thiết kế hàm băm',
  'practice-hashing': 'Luyện tập: bài toán về băm',
  'priority-queue-applications': 'Ứng dụng của hàng đợi ưu tiên',
  'bfs-grid': 'Duyệt theo chiều rộng trên lưới',
  'dfs-grid': 'Duyệt theo chiều sâu trên lưới',
  'disjoint-set-union': 'Tập hợp rời nhau',
  'practice-union-find': 'Luyện tập: bài toán hợp và tìm',
  'sparse-table': 'Bảng thưa',
  'fenwick-tree': 'Cây Fenwick',
  'segment-tree': 'Cây phân đoạn',
  'lazy-propagation': 'Cập nhật lười',
  'rabin-karp': 'Băm xâu và thuật toán Rabin-Karp',
  'bitmask-dp': 'QHĐ trên mặt nạ bit và bài toán người du lịch',
  'universal-perfect-hashing': 'Băm phổ quát và băm hoàn hảo',
};
