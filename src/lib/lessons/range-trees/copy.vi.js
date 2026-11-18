/** @typedef {import('$lib/algo-engine/range-trees.js').RangeFrame} RangeFrame */
/** @typedef {import('$lib/algo-engine/range-trees.js').RangeNode} RangeNode */

/** @param {RangeFrame} f @param {number} id */
const nodeOf = (f, id) => /** @type {RangeNode} */ (f.nodes.find((n) => n.id === id));

export const vi = {
  slug: 'range-trees',
  topic: 'geometry',
  level: 'Nâng cao',
  title: 'Cây đoạn nhiều chiều và tìm kiếm trong hình chữ nhật',
  intro:
    'Truy vấn hình chữ nhật (orthogonal range query) hỏi những điểm nào nằm trong một hình chữ nhật có cạnh song song với các trục, [x1, x2] × [y1, y2]. Kiểm tra từng điểm tốn O(n) cho mỗi truy vấn. Cây đoạn nhiều chiều (range tree) là một cây của các cây: một cây tìm kiếm cân bằng theo x, trong đó mỗi nút còn giữ các điểm của cây con mình đã sắp xếp theo y, nên một truy vấn chỉ chạm tới O(log n) nút và tìm kiếm nhị phân trên O(log n) danh sách.',
  summary:
    'Kéo một hình chữ nhật truy vấn trên các điểm và đi từng bước qua cây đoạn hai tầng: tìm kiếm theo x, các cây con chính tắc và các lần tìm kiếm nhị phân theo y.',
  instruction:
    'Đi từng bước qua truy vấn và xem phép tìm kiếm theo x đi tới nút tách, rồi đi theo một đường ở mỗi bên. Kéo một góc hình chữ nhật (1 hoặc 2), nhập toạ độ biên, hoặc kéo một điểm. So sánh số nút đã thăm với số lần kiểm tra khi vét cạn.',
  presetLabel: 'Ví dụ',
  presets: {
    scatter: 'Các điểm rải rác',
    diagonal: 'Các điểm trên đường chéo',
    column: 'Nhiều điểm cùng x',
    empty: 'Không có x nào trong khoảng',
  },
  random: 'Ngẫu nhiên',
  queryTitle: 'Hình chữ nhật truy vấn',
  fields: { x1: 'x1', x2: 'x2', y1: 'y1', y2: 'y2', x: 'x', y: 'y' },
  addPoint: 'Thêm điểm',
  removePoint: 'Xoá điểm đang chọn',
  /** @param {number} xMax @param {number} yMax */
  queryError: (xMax, yMax) =>
    `Các biên phải là số nguyên với 0 ≤ x1 ≤ x2 ≤ ${xMax} và 0 ≤ y1 ≤ y2 ≤ ${yMax}.`,
  /** @param {number} xMax @param {number} yMax */
  coordError: (xMax, yMax) => `x phải là số nguyên từ 0 đến ${xMax}, còn y từ 0 đến ${yMax}.`,
  /** @param {number} max */
  fullError: (max) => `Chỉ dùng nhiều nhất ${max} điểm.`,
  minError: 'Cần giữ lại ít nhất một điểm.',
  occupiedError: 'Ở đó đã có một điểm.',
  selectFirst: 'Hãy chọn một điểm trước: nhấn vào nó, hoặc chọn nó bằng bàn phím rồi nhấn Enter.',
  cornerError: 'Không xoá được góc của hình chữ nhật. Hãy kéo nó thay vì xoá.',
  /** @param {string} name @param {number} x @param {number} y @param {string} role */
  pointLabel: (name, x, y, role) => `Điểm ${name} ở (${x}, ${y})${role ? `, ${role}` : ''}`,
  /** @param {string} name @param {number} x @param {number} y */
  cornerLabel: (name, x, y) => `Góc ${name} của hình chữ nhật truy vấn ở (${x}, ${y})`,
  planeLabel:
    'Các điểm và một hình chữ nhật truy vấn trên mặt phẳng toạ độ. Phím mũi tên chuyển giữa các điểm và hai góc; Shift + mũi tên dời một điểm, Enter chọn một điểm và Delete xoá điểm đó.',
  treeLabel: 'Cây chính theo x. Mỗi nút lưu một điểm và danh sách y của cây con của nó.',
  /** @param {string} name @param {number} x @param {number} y @param {string[]} roles */
  nodeLabel: (name, x, y, roles) =>
    `Nút ${name} ở (${x}, ${y})${roles.length ? `: ${roles.join(', ')}` : ''}`,
  roles: {
    current: 'đang xử lí',
    split: 'nút tách',
    canonical: 'gốc của một cây con chính tắc',
    searching: 'thuộc cây con đang tìm kiếm',
    inCanonical: 'nằm trong một cây con chính tắc',
    visited: 'đã kiểm tra trên đường đi',
    reported: 'đã ghi nhận',
    excluded: 'bị loại khi tìm theo y',
  },
  legend: {
    current: 'Nút đang xử lí; nét đứt là toạ độ x của nó',
    visited: 'Được kiểm tra từng nút trên đường đi',
    searching: 'Cây con đang tìm kiếm nhị phân',
    canonical: 'Cây con chính tắc, đã tìm kiếm',
    reported: '✓ Đã ghi nhận: nằm trong hình chữ nhật',
    excluded: 'Bị loại khi tìm theo y',
    rect: 'Hình chữ nhật truy vấn',
    markers: 'S nút tách · C gốc cây con chính tắc',
  },
  markers: { split: 'S', canonical: 'C', reported: '✓' },
  treeTitle: 'Cây chính theo x',
  /** @param {string} name */
  listTitle: (name) => `ys(${name}): cây con của nó, sắp xếp theo y`,
  listIdle: 'Bước này không có tìm kiếm nhị phân.',
  /** @param {string} name */
  listAria: (name) => `Các giá trị y của cây con gốc ${name}, đã sắp xếp, cùng đoạn khớp.`,
  listWindow: 'y nằm trong khoảng',
  reportedTitle: 'Các điểm đã ghi nhận',
  reportedEmpty: 'chưa có',
  stats: {
    reported: 'Đã ghi nhận',
    brute: 'Số lần kiểm tra khi vét cạn',
    visited: 'Số nút đã thăm',
    searches: 'Số lần tìm kiếm nhị phân',
    comparisons: 'Số phép so sánh y',
    storage: 'Số phần tử trong các danh sách y (bộ nhớ)',
  },
  workedTitle: 'Ví dụ mẫu: “Các điểm rải rác” với hình chữ nhật [3, 10] × [2, 6]',
  workedSteps: [
    'Gốc M (6, 8) có x = 6 thuộc [3, 10], nên M là nút tách ngay từ đầu. y = 8 của nó lớn hơn 6, nên bỏ qua M.',
    'Đường bên trái, hướng về x1 = 3. D (4, 4) có x ≥ 3: ghi nhận D, khi đó mọi điểm bên phải D có x từ 4 đến 6, nên tìm kiếm nhị phân ys(F) = E(1), F(5) với y thuộc [2, 6]. F được ghi nhận.',
    'Sang trái tới B (2, 2): x = 2 < 3, nên B và cây con trái của nó bị loại; sang phải tới C (3, 7). x thoả nhưng y = 7 thì không, và C không có con.',
    'Đường bên phải, hướng về x2 = 10. J (10, 5) có x ≤ 10: ghi nhận J, rồi tìm kiếm nhị phân ys(H) = I(2), G(3), H(7). I và G được ghi nhận, H thì không.',
    'Sang phải tới L (12, 6), rồi sang trái tới K (11, 1): cả hai đều có x > 10. Đáp án là D, F, J, I và G: 5 điểm, sau khi thăm 7 nút và 2 lần tìm kiếm nhị phân.',
  ],
  /**
   * @param {RangeFrame} f
   * @param {(id: number) => string} name
   */
  describe(f, name) {
    const { x1, x2, y1, y2 } = f.query;
    const cur = f.current === null ? null : nodeOf(f, f.current);
    switch (f.kind) {
      case 'start':
        return `${f.points.length} điểm. Tìm các điểm nằm trong [${x1}, ${x2}] × [${y1}, ${y2}].`;
      case 'build':
        return f.root === null
          ? 'Không có điểm nào, nên cây rỗng.'
          : `Cây được dựng một lần: trung vị theo x, ${name(f.root)}, ở trên cùng, mỗi nửa ở bên dưới. Mỗi nút còn giữ cây con của nó đã sắp xếp theo y, tổng cộng ${f.storage} phần tử: bộ nhớ O(n log n).`;
      case 'descend': {
        if (!cur) return '';
        const go = f.turn === 'right' ? 'phải' : 'trái';
        if (f.side === null)
          return cur.x < x1
            ? `${name(cur.id)}.x = ${cur.x} < x1 = ${x1}: nút này và cây con trái của nó nằm ngoài khoảng. Sang ${go}.`
            : `${name(cur.id)}.x = ${cur.x} > x2 = ${x2}: nút này và cây con phải của nó nằm ngoài khoảng. Sang ${go}.`;
        if (f.side === 'left')
          return cur.x >= x1
            ? `Cây con phải của ${name(cur.id)} đã xong. Tiếp tục đi sang trái, hướng về x1.`
            : `${name(cur.id)}.x = ${cur.x} < x1 = ${x1}: nút này và cây con trái của nó bị loại. Sang phải.`;
        return cur.x <= x2
          ? `Cây con trái của ${name(cur.id)} đã xong. Tiếp tục đi sang phải, hướng về x2.`
          : `${name(cur.id)}.x = ${cur.x} > x2 = ${x2}: nút này và cây con phải của nó bị loại. Sang trái.`;
      }
      case 'split':
        return `${name(/** @type {number} */ (f.split))}.x = ${cur?.x} thuộc [${x1}, ${x2}]: hai phép tìm x1 và x2 tách nhau ở đây. Đây là nút tách.`;
      case 'none':
        return `Phép tìm kiếm đã đi ra ngoài cây: không điểm nào có x thuộc [${x1}, ${x2}], nên đáp án rỗng.`;
      case 'check': {
        if (!cur) return '';
        const reported = f.reported.includes(cur.id);
        return reported
          ? `${name(cur.id)} (${cur.x}, ${cur.y}): x thoả, và y = ${cur.y} thuộc [${y1}, ${y2}]. Ghi nhận điểm này.`
          : `${name(cur.id)} (${cur.x}, ${cur.y}): x thoả, nhưng y = ${cur.y} không thuộc [${y1}, ${y2}]. Bỏ qua.`;
      }
      case 'search': {
        const s = /** @type {NonNullable<RangeFrame['search']>} */ (f.search);
        const found = s.hi - s.lo;
        return `Mọi điểm dưới ${name(s.node)} đều có x trong khoảng, nên cây con này là chính tắc. Tìm kiếm nhị phân trên danh sách y của nó thay vì thăm từng nút: ${found} điểm có y thuộc [${y1}, ${y2}], sau ${s.comparisons} phép so sánh.`;
      }
      case 'turn': {
        const split = name(/** @type {number} */ (f.split));
        const side = f.side === 'left' ? 'trái' : 'phải';
        if (f.current === null) return `${split} không có con ${side}, nên đường bên ${side} rỗng.`;
        return f.side === 'left'
          ? `Giờ đi theo đường bên trái từ ${name(f.current)}, hướng về x1 = ${x1}. Mọi điểm ở đây có x ≤ ${x2}.`
          : `Giờ đi theo đường bên phải từ ${name(f.current)}, hướng về x2 = ${x2}. Mọi điểm ở đây có x ≥ ${x1}.`;
      }
      case 'done':
        return `Xong: tìm thấy ${f.reported.length} điểm, sau khi thăm ${f.visited.length} nút và ${f.searches} lần tìm kiếm nhị phân. Vét cạn phải kiểm tra cả ${f.points.length} điểm.`;
    }
  },
  takeaways: [
    'Tìm x1 và x2 cùng lúc trên cây chính theo x cho đến khi hai phép tìm tách nhau ở nút tách. Bên dưới nút đó, một đường đi về phía x1 và một đường đi về phía x2.',
    'Mỗi nút trên đường đi có x trong khoảng được kiểm tra riêng. Cây con treo ở phía trong của nút nằm trọn trong [x1, x2]: đó là một cây con chính tắc. Có O(log n) cây con như vậy, và chúng phủ đúng các điểm có x trong khoảng.',
    'Ta không thăm cây con chính tắc. Nút gốc của nó lưu các điểm đã sắp xếp theo y, nên hai lần tìm kiếm nhị phân tìm ra các điểm có y thuộc [y1, y2]. Tức là O(log n) lần tìm, mỗi lần O(log n): tổng cộng O(log² n + k) với k đáp án.',
    'Mỗi điểm nằm trong nhiều nhất một danh sách y ở mỗi tầng, nên các danh sách tốn bộ nhớ O(n log n). Kĩ thuật xếp tầng phân đoạn (fractional cascading) nối mỗi danh sách với danh sách của các con, nên sau một lần tìm kiếm nhị phân ở nút tách, mỗi bước chỉ tốn O(1): truy vấn giảm còn O(log n + k).',
    'Chọn “Các điểm rải rác” rồi kéo góc 2 sang trái tới x = 5. Gốc M nằm ngoài [3, 5], nên phép tìm theo x sang trái trước và D trở thành nút tách. Số lần kiểm tra khi vét cạn vẫn là n.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Dựng cây',
      'Thời gian O(n log n)',
      'Sắp xếp theo x và theo y một lần; sau đó mỗi tầng trộn danh sách y của các con trong thời gian tuyến tính.',
    ],
    [
      'Bộ nhớ',
      'O(n log n)',
      'Mỗi điểm có mặt trong danh sách y của chính nút nó và của mọi nút phía trên: nhiều nhất một lần mỗi tầng.',
    ],
    [
      'Truy vấn',
      'O(log² n + k)',
      'Hai đường đi gồm O(log n) nút, và một lần tìm kiếm nhị phân O(log n) trong mỗi cây con chính tắc.',
    ],
    [
      'Truy vấn với xếp tầng phân đoạn',
      'O(log n + k)',
      'Một lần tìm kiếm nhị phân ở nút tách; sau đó con trỏ cho vị trí trong danh sách của mỗi con trong O(1).',
    ],
    ['Vét cạn', 'O(n) mỗi truy vấn', 'Kiểm tra từng điểm với cả hai khoảng.'],
  ],
  nextTeaser:
    'Tiếp theo là bài luyện tập: bài toán hình học, nơi em tự dự đoán từng con số trong ba bài toán: điểm nằm phía nào của đường thẳng, diện tích trong hàng rào ngắn nhất và cặp điểm xa nhau nhất.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chọn “Các điểm rải rác” với hình chữ nhật [3, 10] × [2, 6]. Truy vấn ghi nhận bao nhiêu điểm?',
      answer: 5,
      unit: 'điểm',
      hints: [
        'Nhấn “Đến bước cuối” rồi đọc ô “Đã ghi nhận”.',
        'Hoặc tự kiểm tra: x từ 3 đến 10 và y từ 2 đến 6.',
      ],
      solution:
        'D (4, 4), F (6, 5), G (7, 3), I (9, 2) và J (10, 5) thoả cả hai khoảng. C (3, 7), H (8, 7) và M (6, 8) thoả x nhưng quá cao, còn E (5, 1) quá thấp.',
    },
    {
      type: 'number',
      prompt:
        'Một cây đoạn nhiều chiều chứa 15 điểm trong cây chính cân bằng hoàn hảo gồm 4 tầng (1, 2, 4 và 8 nút). Tất cả các danh sách y chứa tổng cộng bao nhiêu phần tử?',
      answer: 49,
      unit: 'phần tử',
      hints: [
        'Danh sách y của một nút chứa toàn bộ cây con của nó.',
        'Hãy đếm theo từng tầng: coi gốc là tầng 1, một nút ở tầng d có cây con gồm 2^(5 − d) − 1 điểm.',
      ],
      solution:
        'Danh sách của gốc có 15 phần tử, hai nút ở tầng 2 mỗi nút có 7, bốn nút ở tầng 3 mỗi nút có 3 và tám lá mỗi lá có 1: 15 + 14 + 12 + 8 = 49. Mỗi điểm được đếm một lần cho mỗi nút ở trên hoặc tại nó, nhiều nhất một lần mỗi tầng, nên tổng là O(n log n).',
    },
    {
      type: 'choice',
      prompt:
        'Trên đường bên trái, nút u có u.x ≥ x1. Vì sao truy vấn có thể tìm kiếm nhị phân trên ys(u.right) thay vì thăm cây con đó?',
      options: [
        'Vì mọi điểm trong u.right đều có y thuộc [y1, y2]',
        'Vì mọi điểm trong u.right đều có x nằm giữa u.x và x của nút tách, nên thuộc [x1, x2]',
        'Vì u.right luôn là một lá',
      ],
      answer: 1,
      hints: ['Theo thứ tự x, u.right nằm ở đâu so với u và với nút tách?'],
      solution:
        'u.right chứa các điểm có x từ u.x tới x của nút tách. Các giá trị này ≥ x1 và ≤ x2, nên chỉ còn phải kiểm tra y, và danh sách y đã sắp xếp trả lời điều đó bằng tìm kiếm nhị phân.',
    },
    {
      type: 'text',
      prompt:
        'Thời gian truy vấn của cây đoạn hai chiều không dùng xếp tầng phân đoạn, với k đáp án, là bao nhiêu?',
      accept: ['O(log² n + k)', 'O(log^2 n + k)', 'log² n + k', 'O(k + log² n)'],
      hints: ['O(log n) cây con chính tắc, mỗi cây tìm kiếm trong O(log n).'],
      solution:
        'O(log² n + k): O(log n) lần tìm kiếm nhị phân, mỗi lần O(log n), cộng thêm k điểm được ghi nhận.',
    },
    {
      type: 'choice',
      prompt: 'Kĩ thuật xếp tầng phân đoạn thay đổi điều gì?',
      options: [
        'Nó giảm bộ nhớ xuống O(n)',
        'Nó thay O(log n) lần tìm kiếm nhị phân bằng một lần, nên một truy vấn tốn O(log n + k)',
        'Nó giúp cây xử lí truy vấn ba chiều mà không tốn thêm gì',
      ],
      answer: 1,
      hints: ['Nó thêm con trỏ từ mỗi danh sách tới danh sách của các con.'],
      solution:
        'Mỗi phần tử trỏ tới vị trí giá trị y của nó trong danh sách của các con. Sau một lần tìm kiếm nhị phân ở nút tách, đi theo một con trỏ chỉ tốn O(1), nên truy vấn là O(log n + k). Bộ nhớ vẫn là O(n log n).',
    },
  ],
};
