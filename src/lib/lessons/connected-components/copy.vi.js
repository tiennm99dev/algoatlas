/** @typedef {import('$lib/algo-engine/connected-components.js').ComponentsFrame} ComponentsFrame */

/** @param {number} cell @param {number} cols */
const coord = (cell, cols) => `(${Math.floor(cell / cols)},${cell % cols})`;

export const vi = {
  slug: 'connected-components',
  topic: 'graphs',
  level: 'Trung bình',
  title: 'Thành phần liên thông và loang',
  intro:
    'Một thành phần liên thông là một nhóm đỉnh lớn nhất mà trong đó đỉnh nào cũng đi được tới mọi đỉnh còn lại. Để tìm hết các thành phần, ta quét lần lượt các đỉnh và bắt đầu một lần BFS hay DFS từ mỗi đỉnh chưa có nhãn: lần tìm kiếm ấy, gọi là loang, gán nhãn cho đúng một thành phần. Trên một bản đồ đất và nước, mỗi thành phần là một hòn đảo.',
  summary:
    'Tô các hòn đảo trên bản đồ và xem phép loang gán nhãn cho từng thành phần liên thông, với 4 hoặc 8 hướng kề.',
  instruction:
    'Bấm hoặc kéo trên bản đồ để biến nước thành đất và ngược lại, hoặc nhấn Enter ở ô đang chọn. Chọn 4 hoặc 8 hướng, rồi chạy từng bước: phép quét tìm thấy một ô đất chưa có nhãn, và phép loang gán cho cả hòn đảo của nó một con số trước khi phép quét đi tiếp.',
  connectivityLabel: 'Ô kề',
  connectivity: { 4: '4 hướng', 8: '8 hướng' },
  randomMap: 'Bản đồ ngẫu nhiên',
  clearMap: 'Toàn nước',
  resetMap: 'Đặt lại bản đồ',
  gridLabel: 'Bản đồ. Dùng phím mũi tên để di chuyển, Enter để đổi ô đang chọn giữa đất và nước.',
  queueLabel: 'Hàng đợi loang (đầu hàng trước)',
  queueEmpty: 'rỗng',
  hotLabel: 'vừa gán nhãn',
  stats: {
    islands: 'Số đảo tìm được',
    labelled: 'Số ô đất đã gán nhãn',
    checks: 'Số lần xét ô kề',
    largest: 'Đảo lớn nhất',
  },
  legend: {
    water: 'Nước',
    land: 'Đất, chưa có nhãn',
    current: 'Đang xét',
    queued: 'Đã gán nhãn, đang trong hàng đợi',
    island: 'Đảo (ghi số của nó)',
  },
  states: {
    water: 'Nước',
    land: 'Đất, chưa có nhãn',
    current: 'đang xét',
    queued: 'trong hàng đợi',
  },
  /** @param {number} k */
  islandNote: (k) => `đảo ${k}`,
  /** @param {number} cell @param {number} cols @param {string} kind @param {string} note */
  cellLabel(cell, cols, kind, note) {
    const where = `Hàng ${Math.floor(cell / cols)}, cột ${cell % cols}`;
    return [where, kind, note].filter(Boolean).join(', ');
  },
  coord,
  edits: {
    /** @param {string} at */
    landAdded: (at) => `Đã thêm đất ở ${at}.`,
    /** @param {string} at */
    landRemoved: (at) => `Đã đổi ${at} thành nước.`,
  },
  /** @param {ComponentsFrame} f @param {number} cols */
  describe(f, cols) {
    const at = (/** @type {number} */ c) => coord(c, cols);
    switch (f.kind) {
      case 'start':
        return 'Chưa ô nào có nhãn. Quét bản đồ theo từng hàng.';
      case 'new-island':
        return `${at(f.current)} là đất chưa có nhãn: một hòn đảo mới. Gán nhãn ${f.count} và bắt đầu loang từ ô này.`;
      case 'expand':
        return `Lấy ${at(f.current)} ra khỏi hàng đợi và xét các ô kề của nó.`;
      case 'label':
        return `${at(f.touched)} là đất chưa có nhãn, kề với ${at(f.current)}: gán nhãn ${f.count} và đưa vào hàng đợi.`;
      case 'done':
        return `Quét xong: ${f.count} đảo, sau ${f.checks} lần xét ô kề.`;
    }
  },
  takeaways: [
    'Thành phần liên thông là một tập đỉnh lớn nhất có thể mà mọi đỉnh trong đó đều đi được tới nhau. Mỗi đỉnh thuộc đúng một thành phần.',
    'Loang là một lần BFS hay DFS xuất phát từ một ô: mọi ô nó tới được đều nhận cùng một nhãn, và nó dừng ở nước, tường và mép bản đồ.',
    'Đếm số đảo là một vòng quét bên ngoài cộng với phép loang: mỗi ô đất chưa có nhãn mở ra một hòn đảo mới, còn nhãn giúp phép quét không đếm một ô hai lần.',
    'Toàn bộ công việc tốn O(V + E): mỗi ô được gán nhãn một lần và mỗi cặp ô kề được xét từ mỗi phía. Trên lưới, đó là O(rows × cols).',
    'Thử xem: vẽ một chuỗi ô đất nối chéo nhau rồi chuyển giữa 4 và 8 hướng. Số đảo thay đổi, vì định nghĩa “kề” quyết định đồ thị.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian, đồ thị',
      'O(V + E)',
      'Phép quét đi qua mỗi đỉnh một lần, và mỗi lần loang xét mỗi cạnh từ cả hai đầu.',
    ],
    [
      'Thời gian, lưới',
      'O(rows × cols)',
      'Mỗi ô có nhiều nhất 4 (hoặc 8) ô kề, nên E chỉ bằng V nhân một hằng số.',
    ],
    [
      'Bộ nhớ',
      'O(V)',
      'Mỗi đỉnh một nhãn, cộng với hàng đợi loang, nơi không đỉnh nào xuất hiện hai lần.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trên bản đồ ban đầu với 4 hướng, phép quét tìm được bao nhiêu đảo?',
      answer: 9,
      unit: 'đảo',
      hints: ['Bấm Đến bước cuối rồi đọc bộ đếm Số đảo tìm được.'],
      solution:
        'Chín đảo: ba ô đơn nối chéo nhau ở gần bên trái được đếm riêng, vì với 4 hướng, hai ô chỉ chạm nhau ở góc không phải là hai ô kề.',
    },
    {
      type: 'number',
      prompt: 'Chuyển bản đồ ban đầu sang 8 hướng. Bây giờ có bao nhiêu đảo?',
      answer: 7,
      unit: 'đảo',
      hints: ['Những hòn đảo nào chỉ chạm nhau ở góc?'],
      solution: 'Chuỗi chéo (3,1), (4,2), (5,3) gộp thành một đảo 3 ô, nên còn 9 − 2 = 7 đảo.',
    },
    {
      type: 'number',
      prompt: 'Hòn đảo lớn nhất của bản đồ ban đầu có bao nhiêu ô?',
      answer: 7,
      unit: 'ô',
      hints: ['Theo dõi bộ đếm Đảo lớn nhất, hoặc đếm các ô cùng mang nhãn của hòn đảo to nhất.'],
      solution:
        'Hòn đảo quanh (5,7) đến (7,7) có 7 ô với cả hai quy tắc kề: (5,7), (5,8), (5,9), (6,6), (6,7), (6,9) và (7,7).',
    },
    {
      type: 'choice',
      prompt: 'Vì sao phép quét không bao giờ đếm một hòn đảo hai lần?',
      options: [
        'Nó chỉ bắt đầu loang từ những ô đất chưa có nhãn.',
        'Nó quét bản đồ từ cả hai đầu.',
        'Mỗi hòn đảo chắc chắn bắt đầu ở hàng đầu tiên.',
        'Nó quét lại từ đầu sau mỗi lần loang.',
      ],
      answer: 0,
      hints: ['Xem dòng 3 của mã giả.'],
      solution:
        'Lần loang đầu tiên đã gán nhãn cho mọi ô của hòn đảo. Khi phép quét sau đó gặp một ô khác của đảo, ô ấy đã có nhãn, nên không có lần loang mới nào bắt đầu.',
    },
  ],
  nextTeaser:
    'Bài sau chuyển sang đồ thị có hướng của các việc phải làm trước, làm sau: sắp xếp tô-pô tìm một thứ tự làm việc hợp lệ.',
};
