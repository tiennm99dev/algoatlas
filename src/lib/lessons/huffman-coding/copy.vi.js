/** @typedef {import('$lib/algo-engine/huffman-coding.js').HuffFrame} HuffFrame */
/** @typedef {import('$lib/algo-engine/huffman-coding.js').HuffNode} HuffNode */

/**
 * The symbols under a node, left to right: a leaf is its symbol, a merged node joins its leaves.
 * @param {HuffNode[]} nodes @param {number} id @returns {string}
 */
function leaves(nodes, id) {
  const n = nodes[id];
  return n.left < 0 ? n.symbol : leaves(nodes, n.left) + leaves(nodes, n.right);
}

/** A tree as `fe (14)`. @param {HuffFrame} f @param {number} id */
const tree = (f, id) => `${leaves(f.nodes, id)} (${f.nodes[id].weight})`;

/** @param {number} x */
const twoPlaces = (x) => x.toFixed(2);

export const vi = {
  slug: 'huffman-coding',
  topic: 'greedy',
  level: 'Trung bình',
  title: 'Mã hoá Huffman',
  intro:
    'Mã có độ dài cố định tốn cùng một số bit cho mọi kí hiệu. Mã hoá Huffman cho các kí hiệu hay gặp mã ngắn và các kí hiệu hiếm gặp mã dài, đồng thời giữ cho mã là mã phi tiền tố: không mã nào là phần đầu của mã khác, nên một xâu bit giải mã được mà không cần dấu ngăn cách. Quy tắc tham lam (greedy) của nó, gộp hai cây có tần suất nhỏ nhất, dựng nên bộ mã có tổng số bit ít nhất có thể.',
  summary:
    'Xem thuật toán Huffman lặp đi lặp lại việc gộp hai cây nhẹ nhất, đọc mã của từng kí hiệu trên cây, và so sánh số bit với mã có độ dài cố định.',
  instruction:
    'Nhập các cặp kí hiệu:số lần, đếm chữ cái của một văn bản, hoặc nạp một ví dụ, rồi chạy từng bước. Hàng đợi được vẽ từ nhẹ đến nặng; mỗi lần gộp cộng trọng số của nó vào tổng số bit. Chọn một nút để nhảy đến lần gộp tạo ra nó, hoặc một lá để nhảy đến bước đọc mã của lá đó. Đếm “abracadabra” và so sánh số bit với mã có độ dài cố định.',
  frequenciesLabel: 'Tần suất (kí hiệu:số lần)',
  textLabel: 'Hoặc đếm chữ cái của',
  presetLabel: 'Ví dụ',
  presetPlaceholder: 'Nạp tần suất…',
  presets: {
    textbook: 'Ví dụ trong sách: a:45 … f:5',
    equal: 'Bốn tần suất bằng nhau',
    skewed: 'Luỹ thừa của 2',
    vowels: 'Nguyên âm tiếng Anh',
  },
  errors: {
    format:
      'Hãy nhập các cặp như a:45, b:13, mỗi dấu hai chấm đứng sau đúng một kí tự. Tần suất hợp lệ gần nhất đã được khôi phục.',
    range: 'Mỗi số lần phải từ 1 đến 999. Tần suất hợp lệ gần nhất đã được khôi phục.',
    duplicate: 'Mỗi kí hiệu chỉ ghi một lần. Tần suất hợp lệ gần nhất đã được khôi phục.',
    count: 'Hãy dùng từ 2 đến 10 kí hiệu khác nhau. Tần suất hợp lệ gần nhất đã được khôi phục.',
    empty: 'Hãy nhập một văn bản để đếm chữ cái.',
    long: 'Văn bản dài tối đa 200 kí tự.',
  },
  newFrequenciesNotice: 'Đã nạp tần suất mới.',
  /** @param {number} n */
  countedNotice: (n) => `Đã đếm được ${n} kí tự khác nhau; dấu cách hiện thành ␣.`,
  /** @param {number} n */
  treeAria: (n) => `Rừng Huffman gồm ${n} cây, nhẹ nhất trước.`,
  /** @param {string} name @param {number} weight @param {string} code @param {string} state */
  nodeLabel: (name, weight, code, state) =>
    `${name}, trọng số ${weight}${code ? `, mã ${code}` : ''}${state ? `, ${state.toLowerCase()}` : ''}`,
  legend: {
    picked: 'Một trong hai cây nhẹ nhất',
    made: 'Nút vừa gộp',
    path: 'Đường đi tới lá đang được đọc mã',
    coded: 'Lá đã có mã',
  },
  markers: { picked: '↓', made: '+', path: '→', coded: '✓' },
  stats: {
    merges: 'Số lần gộp',
    bits: 'Số bit Huffman',
    fixed: 'Số bit mã cố định',
    average: 'Số bit mỗi kí hiệu',
  },
  queueTitle: 'Hàng đợi, nhẹ nhất trước',
  queueEmpty: 'rỗng',
  tableTitle: 'Bảng mã',
  tableHead: { symbol: 'Kí hiệu', freq: 'Số lần', code: 'Mã', bits: 'Số bit' },
  pending: '…',
  /** @param {number} width */
  fixedNote: (width) => `mỗi kí hiệu ${width} bit`,
  practiceTitle: 'Tự kiểm tra',
  /** @param {HuffFrame} f */
  describe(f) {
    const leafCount = f.nodes.filter((n) => n.left < 0).length;
    switch (f.kind) {
      case 'start':
        return `${leafCount} kí hiệu, mỗi kí hiệu là một cây một lá trong hàng đợi, nhẹ nhất trước: ${f.queue.map((id) => tree(f, id)).join(', ')}.`;
      case 'pick': {
        const [x, y] = f.picked;
        return `Lấy hai cây nhẹ nhất: ${tree(f, x)} và ${tree(f, y)}.`;
      }
      case 'merge': {
        const z = f.nodes[f.made];
        return `Gộp chúng dưới một nút có trọng số ${z.weight}: cạnh trái là 0, cạnh phải là 1. Mọi kí hiệu bên dưới nút này dài thêm một bit, tức cộng thêm ${z.weight} bit. Còn ${f.queue.length} cây.`;
      }
      case 'code': {
        const leaf = f.nodes[f.leaf];
        const code = f.codes[f.leaf];
        return `${leaf.symbol}: đi theo các cạnh từ gốc xuống, đọc được ${code}, ${code.length} bit × ${leaf.weight} = ${code.length * leaf.weight} bit.`;
      }
      case 'done': {
        const total = f.nodes.filter((n) => n.left < 0).reduce((s, n) => s + n.weight, 0);
        const width = Math.ceil(Math.log2(leafCount));
        return `Xong: tổng cộng ${f.cost} bit, trung bình ${twoPlaces(f.cost / total)} bit mỗi kí hiệu, so với ${width * total} bit nếu dùng mã cố định ${width} bit. Không mã phi tiền tố nào làm tốt hơn.`;
      }
    }
  },
  twoPlaces,
  takeaways: [
    'Một mã phi tiền tố là một cây nhị phân có các kí hiệu ở lá: mã của một kí hiệu là đường đi từ gốc, 0 cho trái và 1 cho phải. Vì không kí hiệu nào nằm trên đường đi của kí hiệu khác, một xâu bit được giải mã từ trái sang phải mà không cần dấu ngăn cách.',
    'Chi phí của một bộ mã là Σ tần suất × độ dài mã. Mỗi lần gộp đẩy mọi kí hiệu dưới nút mới xuống sâu thêm một tầng, nên tổng chi phí cũng bằng tổng trọng số của các nút đã gộp.',
    'Lựa chọn tham lam: trong một cây tối ưu nào đó, hai kí hiệu có tần suất nhỏ nhất là hai lá anh em ở tầng sâu nhất, vì đổi một kí hiệu nằm sâu hơn với một kí hiệu hiếm hơn không bao giờ làm tăng số bit. Gộp chúng rồi giải bài toán nhỏ hơn khi đó là an toàn; đó là lập luận hoán đổi (exchange argument) đứng sau thuật toán Huffman.',
    'Với một heap nhỏ nhất, n − 1 lần gộp tốn O(n log n). Các tần suất bằng nhau trên số kí hiệu là luỹ thừa của 2 cho một cây cân bằng, không tốt hơn mã cố định; các tần suất lệch nhiều như luỹ thừa của 2 cho các mã dài 1, 2, 3, … bit.',
    'Đếm “abracadabra”: Huffman cần 23 bit, trong khi mã cố định 3 bit cần 33. Sau đó nạp “Bốn tần suất bằng nhau” và xem hai chi phí trùng nhau.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Dựng hàng đợi', 'O(n)', 'Vun heap từ n lá.'],
    [
      'Các lần gộp',
      'O(n log n)',
      'n − 1 lần gộp, mỗi lần hai extractMin và một insert trên heap có nhiều nhất n cây.',
    ],
    ['Đọc các mã', 'O(n · L)', 'Mỗi lá một lượt đi từ gốc xuống; L là độ dài mã dài nhất.'],
    ['Mã hoá một văn bản m kí hiệu', 'O(m · L)', 'Tra mã của từng kí hiệu rồi ghi các bit của nó.'],
    ['Bộ nhớ thêm', 'O(n)', 'Cây có n lá và n − 1 nút gộp.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Thuật toán Huffman chạy trên a:45, b:13, c:12, d:16, e:9, f:5. Cả văn bản sau khi mã hoá chiếm bao nhiêu bit?',
      answer: 224,
      unit: 'bit',
      hints: ['Cộng trọng số của mọi nút gộp.', 'Các lần gộp tạo ra 14, 25, 30, 55 và 100.'],
      solution:
        '14 + 25 + 30 + 55 + 100 = 224 bit, bằng đúng Σ f · độ dài: 45·1 + 13·3 + 12·3 + 16·3 + 9·4 + 5·4. Mã cố định 3 bit cần 300.',
    },
    {
      type: 'number',
      prompt: 'Mã Huffman của “abracadabra” dùng bao nhiêu bit cho cả từ?',
      answer: 23,
      unit: 'bit',
      hints: [
        'Số lần xuất hiện là a:5, b:2, r:2, c:1, d:1.',
        'Nhập abracadabra vào ô văn bản rồi chạy đến bước cuối.',
      ],
      solution:
        'Các lần gộp tạo ra 2 (c + d), 4 (b + r), 6 và 11, nên chi phí là 2 + 4 + 6 + 11 = 23 bit: a được 1 bit, bốn kí hiệu còn lại mỗi kí hiệu 3 bit. Mã cố định 3 bit cần 11 × 3 = 33.',
    },
    {
      type: 'number',
      prompt:
        'Trong ví dụ a:45, b:13, c:12, d:16, e:9, f:5, mã của f, kí hiệu hiếm nhất, dài bao nhiêu bit?',
      answer: 4,
      unit: 'bit',
      hints: [
        'f nằm trong lần gộp đầu tiên, và trong mọi lần gộp phía trên nó.',
        'Đếm số lần gộp trên đường đi từ f lên gốc.',
      ],
      solution:
        'f gộp với e (14), rồi với d (30), rồi với cây 25 (55), rồi với a (100): bốn cạnh, nên mã 1100 của nó có 4 bit.',
    },
    {
      type: 'text',
      prompt: 'Với mã phi tiền tố a = 0, c = 100, b = 101, hãy giải mã xâu bit 0101100.',
      accept: ['abc'],
      hints: [
        'Đọc từ trái sang và dừng ngay khi các bit đã đọc tạo thành một mã.',
        '0 đã là một mã đầy đủ.',
      ],
      solution:
        '0 là a, rồi 101 là b, rồi 100 là c: abc. Với mã phi tiền tố, bạn không bao giờ phải đoán một mã kết thúc ở đâu.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao thuật toán Huffman gộp hai cây có tần suất nhỏ nhất trước?',
      options: [
        'Vì chúng dễ tìm nhất trong hàng đợi',
        'Vì có một bộ mã tối ưu nhận chúng làm hai lá anh em ở tầng sâu nhất',
        'Vì cách đó giữ cho cây cân bằng',
        'Vì cách đó làm mọi mã dài bằng nhau',
      ],
      answer: 1,
      hints: ['Các lá sâu nhất nhận các mã dài nhất.', 'Hãy nghĩ xem kí hiệu nào nên chịu mã dài.'],
      solution:
        'Lập luận hoán đổi cho thấy đưa hai kí hiệu hiếm nhất vào cặp lá anh em sâu nhất không bao giờ làm tăng số bit, nên có một cây tối ưu nhận chúng làm anh em. Gộp chúng trước là một lựa chọn tham lam an toàn.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Cái túi phân số và lập lịch có hạn chót, áp dụng tham lam cho hai bài toán chọn lựa quen thuộc.',
};
