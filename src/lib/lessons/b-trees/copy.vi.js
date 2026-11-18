/** @typedef {import('$lib/algo-engine/b-trees.js').BFrame} BFrame */
/** @typedef {import('$lib/algo-engine/b-trees.js').BOp} BOp */

export const vi = {
  slug: 'b-trees',
  topic: 'balanced-bst',
  level: 'Trung bình',
  title: 'Cây B',
  intro:
    'Cây B lưu nhiều khoá trong mỗi nút và mỗi nút có nhiều con, nên cây chỉ sâu vài tầng. Nút nào tràn thì tách đôi và đẩy khoá trung vị lên trên, nút nào thiếu khoá thì mượn hoặc gộp, và mọi lá luôn ở cùng một độ sâu. Cơ sở dữ liệu và hệ thống tệp dùng cây B vì mỗi nút vừa một khối đĩa, mà đọc một khối mới là việc tốn thời gian.',
  summary:
    'Chèn và xoá khoá trên cây B bậc 3, 4 hoặc 5, xem các nút tách dần lên trên, mượn khoá và gộp lại, đồng thời đếm số lần đọc nút.',
  instruction:
    'Chọn bậc, gõ một khoá, rồi chèn, tìm hoặc xoá. Chạy từng bước để xem từng lần đọc nút, rồi một lần tách đẩy khoá trung vị lên, hoặc một lần mượn hay gộp khi một nút thiếu khoá. Đổi bậc để dựng lại cùng dãy thao tác và so sánh chiều cao.',
  orderLabel: 'Bậc m (số con nhiều nhất của một nút)',
  orderOption: (/** @type {number} */ m) => String(m),
  keyLabel: 'Khoá',
  insert: 'Chèn',
  search: 'Tìm',
  remove: 'Xoá',
  undo: 'Hoàn tác',
  reset: 'Đặt lại',
  presetLabel: 'Dãy có sẵn',
  presetPlaceholder: 'Chọn một dãy có sẵn…',
  presets: {
    grow: 'Khoá tăng dần, tách dần lên',
    mixed: 'Khoá lẫn lộn',
    merge: 'Xoá phải gộp và mượn',
    random: 'Ngẫu nhiên',
  },
  full: 'Cây đã đầy (20 khoá).',
  logFull: 'Danh sách thao tác đã đầy (24 thao tác). Hãy hoàn tác hoặc đặt lại để làm tiếp.',
  keyError: 'Khoá phải là số nguyên từ 0 đến 99.',
  emptyTree: 'Cây đang rỗng.',
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác hiện tại',
  /** @param {BOp} op */
  opChip: (op) =>
    `${op.type === 'insert' ? vi.insert : op.type === 'search' ? vi.search : vi.remove} ${op.key}`,
  stats: {
    reads: 'Số lần đọc nút (thao tác này)',
    scanned: 'Số khoá đã so sánh (thao tác này)',
    splits: 'Số lần tách (tất cả)',
    fixes: 'Số lần gộp + mượn (tất cả)',
    height: 'Chiều cao (số tầng)',
    size: 'Số khoá',
  },
  /** @param {number} order @param {number} n @param {number} h */
  facts: (order, n, h) =>
    n === 0
      ? `Bậc ${order}: mỗi nút có nhiều nhất ${order - 1} khoá, và mọi nút trừ gốc có ít nhất ${Math.ceil(order / 2) - 1} khoá.`
      : `Bậc ${order}: mỗi nút có nhiều nhất ${order - 1} khoá, và mọi nút trừ gốc có ít nhất ${Math.ceil(order / 2) - 1} khoá. Với chiều cao ${h}, bậc này chứa được tới ${order ** h - 1} khoá. Một cây nhị phân chứa ${n} khoá cần ít nhất ${Math.ceil(Math.log2(n + 1))} tầng.`,
  legend: {
    read: '? đang đọc',
    path: 'đã đọc trước đó',
    found: '✓ đã tìm thấy',
    changed: '* vừa thay đổi',
    broken: '! thừa hoặc thiếu khoá',
    partner: '+ nút khác cùng tham gia',
    moved: 'Khoá vừa dời chỗ',
  },
  markers: { read: '?', changed: '*', found: '✓', broken: '!', partner: '+', path: '' },
  roleNames: {
    read: 'đang đọc',
    changed: 'vừa thay đổi',
    found: 'đã tìm thấy',
    broken: 'vượt giới hạn trên hoặc dưới',
    partner: 'nút khác cùng tham gia',
    path: 'đã đọc trước đó',
  },
  /** @param {number[][]} rows @param {number} order @param {number} h */
  treeLabel: (rows, order, h) =>
    `Cây B bậc ${order}, chiều cao ${h}. ${rows.map((row, i) => `Tầng ${i + 1}: ${row.join(', ')}.`).join(' ')}`,
  /** @param {number[]} keys @param {string} role */
  nodeLabel: (keys, role) => `Nút ${keys.join(', ') || 'không có khoá'}${role ? `, ${role}` : ''}`,
  /** @param {BFrame} f */
  describe(f) {
    const key = f.op?.key ?? 0;
    const least = Math.ceil(f.order / 2) - 1;
    switch (f.kind) {
      case 'start':
        return vi.emptyTree;
      case 'read':
        return `Đọc một nút (lần đọc thứ ${f.reads} của thao tác này) và duyệt các khoá trong đó để tìm ${key}.`;
      case 'found':
        return f.op?.type === 'delete'
          ? `Đã tìm thấy ${key}, khoá cần xoá.`
          : `Đã tìm thấy ${key} sau ${f.reads} lần đọc nút.`;
      case 'missing':
        return `${key} không có trong cây.`;
      case 'dup':
        return `${key} đã có trong cây, nên lệnh chèn bị bỏ qua.`;
      case 'place':
        return `Thêm ${key} vào lá, đúng thứ tự khoá. Ở đây lá chỉ nhận thêm khoá; cây mọc thêm từ phía trên.`;
      case 'overflow':
        return `Nút này đang chứa ${f.order} khoá, thừa một khoá so với bậc ${f.order}. Nó phải tách đôi.`;
      case 'split':
        return `Tách: ${f.moved} được đẩy lên nút cha, và các khoá ở hai bên thành hai nút. Giờ nút cha cũng có thể bị tràn.`;
      case 'new-root':
        return `Không có nút cha, nên ${f.moved} trở thành gốc mới. Đây là cách duy nhất để chiều cao tăng, nhờ đó mọi lá luôn cùng độ sâu.`;
      case 'swap-in':
        return `${key} nằm ở một nút trong. Thay nó bằng khoá liền trước ${f.moved}, khoá lớn nhất bên trái nó, vốn nằm ở một lá.`;
      case 'remove':
        return `Xoá khoá khỏi lá.`;
      case 'underflow':
        return `Nút này có ít hơn ${least} khoá mà bậc ${f.order} yêu cầu. Hãy nhìn sang các nút anh em của nó.`;
      case 'borrow':
        return `Một nút anh em dư được một khoá: ${f.moved} được đẩy lên nút cha, còn khoá ngăn cách cũ dời xuống nút đang thiếu.`;
      case 'merge':
        return `Không nút anh em nào dư khoá: gộp với một nút anh em, kéo khoá ngăn cách ${f.moved} từ nút cha xuống. Giờ nút cha cũng có thể bị thiếu khoá.`;
      case 'shrink':
        return `Gốc không còn khoá nào, nên con duy nhất của nó trở thành gốc. Đây là cách duy nhất để chiều cao giảm.`;
      case 'done':
        return f.size === 0
          ? vi.emptyTree
          : `Cây có ${f.size} khoá trong ${f.height} tầng, và mọi lá đều ở cùng một độ sâu.`;
    }
  },
  takeaways: [
    'Một nút bậc m có tối đa m con và m − 1 khoá. Mọi nút trừ gốc giữ ít nhất ⌈m/2⌉ − 1 khoá, nên các nút luôn đủ đầy để có ích.',
    'Nút có m khoá thì tách: khoá trung vị được đẩy lên, các khoá ở mỗi bên thành hai nút. Việc tách có thể lan dần lên, và chỉ khi gốc tách thì cây mới thêm một tầng; vì thế mọi lá luôn cùng độ sâu.',
    'Một lần xoá làm một nút thiếu khoá thì nút đó mượn khoá qua nút cha nếu một nút anh em dư khoá. Nếu không, nó gộp với một nút anh em và kéo khoá ngăn cách xuống; chỉ khi gốc rỗng thì cây mới mất một tầng.',
    'Chiều cao vào khoảng logₘ n, nên với bậc thực tế 1000, một tỉ khoá chỉ cần 3 hoặc 4 tầng. Mỗi tầng là một lần đọc khối đĩa, chậm hơn nhiều so với các phép so sánh khoá bên trong khối; đó là lí do cơ sở dữ liệu và hệ thống tệp dùng cây B và các biến thể của nó.',
    'Thử “Khoá tăng dần, tách dần lên” ở bậc 3, rồi đổi sang bậc 5: cùng 7 khoá chiếm 3 tầng, rồi chỉ còn 2, và lần chèn cuối ở bậc 3 tách lan đến tận gốc mới.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Tìm kiếm: số lần đọc nút', 'O(logₘ n)', 'Mỗi tầng một nút, và cây bậc m thấp đúng như thế.'],
    [
      'Tìm kiếm: số phép so sánh',
      'O(m logₘ n) = O(log n) khi m cố định',
      'Duyệt tối đa m − 1 khoá trong mỗi nút được đọc.',
    ],
    [
      'Chèn',
      'O(logₘ n) lần ghi nút',
      'Một lượt đi xuống, rồi mỗi tầng tách nhiều nhất một lần trên đường về.',
    ],
    [
      'Xoá',
      'O(logₘ n) lần ghi nút',
      'Một lượt đi xuống, rồi mỗi tầng nhiều nhất một lần mượn hoặc gộp.',
    ],
    ['Bộ nhớ', 'O(n)', 'Trừ gốc, các nút luôn đầy ít nhất khoảng một nửa.'],
  ],
  nextTeaser:
    'Bài sau là treap và skip list: hai cấu trúc dùng sự ngẫu nhiên thay cho quy tắc cân bằng chặt chẽ mà vẫn đạt thời gian lôgarit kì vọng.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chèn 10, 20, 30, 40, 50, 60, 70 vào một cây B bậc 3. Chiều cao cuối cùng của cây là bao nhiêu tầng?',
      answer: 3,
      unit: 'tầng',
      hints: [
        'Mở “Khoá tăng dần, tách dần lên” ở bậc 3 và đọc chiều cao ở bước cuối.',
        'Ở bậc 3, cây cao h chứa nhiều nhất 3ʰ − 1 khoá.',
      ],
      solution:
        'Cây cuối cùng có gốc 40, tầng hai là 20 và 60, các lá là 10, 30, 50, 70. Tức là 3 tầng, dù ở bậc 3, 7 khoá có thể vừa trong 2 tầng: chèn theo thứ tự tăng dần để lại phần lớn các nút trống một nửa.',
    },
    {
      type: 'number',
      prompt: 'Cũng lượt chạy đó tốn tổng cộng bao nhiêu lần tách?',
      answer: 4,
      unit: 'lần tách',
      hints: [
        'Đọc ô “Số lần tách (tất cả)” ở bước cuối.',
        'Thêm 70 làm một lá tách, rồi đến nút cha của nó.',
      ],
      solution:
        'Khoá 30 làm một lá tách một lần, khoá 50 làm một lá tách một lần, và khoá 70 làm một lá tách rồi gốc bị tràn cũng tách, sinh ra gốc mới. Tổng là 1 + 1 + 2 = 4.',
    },
    {
      type: 'choice',
      prompt: 'Một lá của cây bậc 3 đang chứa 10 và 20, rồi khoá 30 được chèn vào. Điều gì xảy ra?',
      options: [
        '20 được đẩy lên nút cha; 10 và 30 thành hai lá riêng',
        '30 được đẩy lên nút cha; 10 và 20 vẫn ở chung',
        '10 được đẩy lên nút cha; 20 và 30 vẫn ở chung',
        'Lá giữ cả ba khoá cho đến lần chèn sau',
      ],
      answer: 0,
      hints: [
        'Ở bậc 3, một nút chỉ được chứa 2 khoá.',
        'Khoá nào giữ cho hai bên đều đúng thứ tự?',
      ],
      solution:
        'Ba khoá là thừa một, nên nút tách quanh khoá trung vị 20. Nút cha nhận 20, còn 10 và 30 nằm ở hai bên nó, đúng như thứ tự tìm kiếm đòi hỏi.',
    },
    {
      type: 'number',
      prompt: 'Một cây B bậc 3 cao 3 chứa được nhiều nhất bao nhiêu khoá?',
      answer: 26,
      unit: 'khoá',
      hints: [
        'Nút đầy có 2 khoá và 3 con. Đếm số nút ở mỗi tầng: 1, 3, 9.',
        'Như vậy có 13 nút, mỗi nút 2 khoá.',
      ],
      solution: '1 + 3 + 9 = 13 nút × 2 khoá = 26, đúng với công thức chung mʰ − 1 = 3³ − 1.',
    },
    {
      type: 'number',
      prompt:
        'Một cây B thực tế có bậc 1001. Với chiều cao 3, nó chứa được nhiều nhất bao nhiêu khoá?',
      answer: 1003003000,
      unit: 'khoá',
      hints: ['Dùng công thức mʰ − 1.'],
      solution:
        '1001³ − 1 = 1 003 003 000. Vậy chỉ với 3 lần đọc khối, ta tới được bất kì khoá nào trong khoảng một tỉ khoá, trong khi cây nhị phân cần khoảng 30 tầng.',
    },
    {
      type: 'number',
      prompt: 'Một nút không phải gốc của cây B bậc 5 được chứa ít nhất bao nhiêu khoá?',
      answer: 2,
      unit: 'khoá',
      hints: ['Số khoá tối thiểu là ⌈m/2⌉ − 1.'],
      solution: '⌈5/2⌉ − 1 = 3 − 1 = 2. Ít hơn thế thì nút phải mượn hoặc gộp.',
    },
    {
      type: 'number',
      prompt:
        'Mở “Xoá phải gộp và mượn” ở bậc 3. Xoá 70 tốn bao nhiêu lần gộp, tính đến trước khi lần xoá tiếp theo bắt đầu?',
      answer: 2,
      unit: 'lần gộp',
      hints: [
        'Chạy đến khung hình ngay trước khi “Xoá 40” bắt đầu và đọc ô số liệu.',
        'Một lần gộp cũng có thể làm nút cha thiếu khoá.',
      ],
      solution:
        'Lá 70 trống và gộp với lá 50 cùng khoá ngăn cách 60. Việc đó để nút cha không còn khoá nào, nên nút cha gộp với nút anh em của nó và khoá 40 của gốc. Gốc rỗng sau đó bị bỏ, nên chiều cao giảm từ 3 xuống 2.',
    },
    {
      type: 'order',
      prompt:
        'Một nút của cây B vừa bị thiếu khoá sau một lần xoá. Sắp xếp các việc cần thử theo đúng thứ tự.',
      items: [
        'Gộp với một nút anh em và khoá ngăn cách giữa hai nút',
        'Kiểm tra xem có nút anh em nào dư khoá không',
        'Nếu gốc rỗng, cho con duy nhất của nó làm gốc mới',
        'Mượn một khoá qua nút cha',
      ],
      answer: [1, 3, 0, 2],
      hints: ['Gộp là phương án dự phòng, và nó có thể đẩy vấn đề lên trên.'],
      solution:
        'Trước hết kiểm tra các nút anh em, và mượn nếu có nút dư khoá. Nếu không thì gộp. Lần gộp lấy một khoá của nút cha, nên vấn đề có thể leo lên, và có thể kết thúc bằng việc gốc rỗng, khi đó con của gốc thay chỗ nó.',
    },
    {
      type: 'multi',
      prompt: 'Vì sao trên đĩa, cơ sở dữ liệu chuộng cây B hơn cây nhị phân tìm kiếm?',
      options: [
        'Một nút lấp đầy một khối đĩa, nên mỗi lần đọc khối mang về nhiều khoá',
        'Ít tầng nghĩa là ít lần đọc khối chậm',
        'So sánh khoá bên trong một nút rẻ hơn nhiều so với đọc một khối',
        'Chúng tốn ít bộ nhớ hơn vì nút trong không chứa khoá',
      ],
      answers: [0, 1, 2],
      hints: ['Bước nào chậm trên đĩa?', 'Các nút trong của cây B ở đây vẫn có chứa khoá.'],
      solution:
        'Chi phí đáng kể là số lần đọc khối. Một nút rộng gói trọn một khối, nên cây chỉ cần ít tầng, và việc duyệt bên trong khối gần như không tốn gì so với lần đọc. Cây B cũng lưu khoá ở nút trong, và cây B+, vốn để dữ liệu ở lá, vẫn dùng khoá ở nút trong làm khoá ngăn cách.',
    },
  ],
};
