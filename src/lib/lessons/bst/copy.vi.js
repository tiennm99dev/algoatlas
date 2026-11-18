/** @typedef {import('$lib/algo-engine/bst.js').BstFrame} BstFrame */
/** @typedef {import('$lib/algo-engine/bst.js').BstOp} BstOp */

export const vi = {
  slug: 'bst',
  topic: 'trees',
  level: 'Trung bình',
  title: 'Cây nhị phân tìm kiếm',
  intro:
    'Cây nhị phân tìm kiếm (binary search tree) đặt mọi khoá nhỏ hơn một nút ở bên trái nút đó và mọi khoá lớn hơn ở bên phải. Tìm kiếm, chèn và xoá đều chỉ đi theo một đường từ gốc xuống, nên chi phí của chúng bằng chiều cao của cây.',
  summary:
    'Chèn, tìm và xoá khoá trong cây nhị phân tìm kiếm, và xem việc chèn theo thứ tự tăng dần biến cây thành một danh sách.',
  instruction:
    'Gõ một khoá rồi chèn, tìm hoặc xoá nó, sau đó chạy từng bước đường đi. Mở mẫu thứ tự tăng dần để thấy cây nghiêng hẳn thành một danh sách. Hoàn tác bỏ thao tác gần nhất.',
  keyLabel: 'Khoá',
  insert: 'Chèn',
  search: 'Tìm',
  remove: 'Xoá',
  undo: 'Hoàn tác',
  reset: 'Đặt lại',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Mở một mẫu…',
  presets: { balanced: 'Thứ tự cân bằng', sorted: 'Thứ tự tăng dần', random: 'Ngẫu nhiên' },
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác gần nhất',
  treeScroller: 'Hình vẽ cây, cuộn ngang được',
  /** @param {BstOp} op */
  opChip: (op) =>
    `${op.type === 'insert' ? vi.insert : op.type === 'search' ? vi.search : vi.remove} ${op.key}`,
  stats: { comparisons: 'Số lần so sánh (thao tác này)', height: 'Chiều cao', size: 'Số khoá' },
  /** @param {number} h */
  balanced: (h) => `Chiều cao nếu cân bằng hoàn hảo: ${h}`,
  full: 'Cây đã đầy (15 khoá).',
  logFull: 'Nhật kí đã đầy (40 thao tác). Hãy hoàn tác hoặc đặt lại để làm tiếp.',
  keyError: 'Khoá phải là số nguyên từ 0 đến 99.',
  emptyTree: 'Cây đang rỗng.',
  /** @param {number[]} keys @param {number} h @param {number | null} root @param {number} ideal */
  treeLabel: (keys, h, root, ideal) =>
    `Cây gồm ${keys.length} khoá, chiều cao ${h}. Theo thứ tự: ${keys.join(', ')}.` +
    (root === null ? '' : ` Gốc ${root}. Nếu cân bằng, chiều cao sẽ là ${ideal}.`),
  /** @param {number} key @param {string} state */
  nodeLabel: (key, state) => (state ? `Khoá ${key}, ${state}` : `Khoá ${key}`),
  states: {
    compare: 'đang so sánh',
    path: 'trên đường đi',
    found: 'đã tìm thấy',
    new: 'mới thêm',
    removing: 'đang xoá',
    successor: 'phần tử kế tiếp',
  },
  markers: { path: '', compare: '?', found: '✓', new: '+', removing: '×', successor: 'S' },
  legend: {
    compare: 'Đang so sánh',
    path: 'Trên đường đi',
    found: 'Đã tìm thấy',
    new: 'Mới thêm',
    removing: 'Đang xoá',
    successor: 'Phần tử kế tiếp',
  },
  /** @param {BstFrame} f */
  describe(f) {
    const key = f.op?.key ?? 0;
    const nodeKey = f.current >= 0 ? f.nodes[f.current].key : null;
    switch (f.kind) {
      case 'start':
        return vi.emptyTree;
      case 'visit':
        return `So sánh ${key} với ${nodeKey}.`;
      case 'go-left':
        return `${key} < ${nodeKey}, nên đi sang trái.`;
      case 'go-right':
        return `${key} > ${nodeKey}, nên đi sang phải.`;
      case 'insert':
        return `Đường đi đã rơi ra khỏi cây: gắn ${key} vào làm một lá mới.`;
      case 'found':
        return f.op?.type === 'delete'
          ? `Đã tìm thấy ${key}, nút cần xoá.`
          : `Đã tìm thấy ${key} sau ${f.comparisons} lần so sánh.`;
      case 'dup':
        return `${key} đã có trong cây, nên bỏ qua phép chèn.`;
      case 'missing':
        return `${key} không có trong cây.`;
      case 'successor':
        return `Nút có hai con: tìm khoá nhỏ nhất trong cây con phải, đó là ${f.nodes[f.succ].key}.`;
      case 'relink':
        return f.succ >= 0
          ? `Chép khoá kế tiếp ${f.nodes[f.succ].key} vào nút đang giữ ${key}.`
          : `Nút có nhiều nhất một con: cha của nó giờ trỏ thẳng qua ${key} tới con đó.`;
      case 'remove':
        return `Nút đã gỡ ra không còn nữa. Cây còn ${f.size} khoá.`;
      case 'done':
        return `Cây có ${f.size} khoá, chiều cao ${f.height}.`;
    }
  },
  takeaways: [
    'Mỗi lần so sánh loại bỏ cả một cây con, nên mỗi thao tác tốn một bước cho mỗi tầng: O(chiều cao).',
    'Chèn các khoá theo thứ tự tăng dần thì khoá mới nào cũng đi sang phải: cây thành một danh sách có chiều cao n. Các cây cân bằng như cây AVL và cây đỏ đen dùng phép quay để tránh điều này.',
    'Xoá một nút có hai con thì chép phần tử kế tiếp của nó (khoá nhỏ nhất trong cây con phải) vào, rồi xoá phần tử kế tiếp. Nút đó có nhiều nhất một con, nên lần xoá thứ hai rất dễ.',
    'Duyệt giữa (trái, nút, phải) thăm các khoá theo thứ tự tăng dần.',
    'Thử mẫu “Thứ tự tăng dần”: khoá nào cũng đi sang phải và chiều cao tăng tới n, nên mỗi thao tác tốn O(n).',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Thời gian, khi cân bằng', 'O(log n)', 'Chiều cao giữ ở khoảng log₂ n.'],
    ['Thời gian, xấu nhất', 'O(n)', 'Chèn theo thứ tự tăng dần dựng nên một nhánh dài duy nhất.'],
    ['Bộ nhớ', 'O(n)', 'Mỗi khoá một nút.'],
  ],
  nextTeaser:
    'Bài sau, Cây nhiều nhánh và đệ quy trên cây, cho mỗi nút bao nhiêu con cũng được và giải bài toán bằng một lần đệ quy.',
};
