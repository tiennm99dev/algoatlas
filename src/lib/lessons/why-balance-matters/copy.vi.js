/** @typedef {import('$lib/algo-engine/why-balance-matters.js').WhyBalanceFrame} WhyBalanceFrame */

/** Vietnamese names of the two rotation directions. */
const SIDE = /** @type {const} */ ({ left: 'trái', right: 'phải' });

export const vi = {
  slug: 'why-balance-matters',
  topic: 'balanced-bst',
  level: 'Cơ bản',
  title: 'Vì sao cân bằng quan trọng',
  intro:
    'Trên cây nhị phân tìm kiếm (BST), mỗi tầng tốn một bước, nên tốc độ phụ thuộc hoàn toàn vào chiều cao của cây. Chèn các khoá theo thứ tự tăng dần thì một BST thường suy biến thành một danh sách cao n tầng, còn cây cân bằng giữ chiều cao gần log₂ n nhờ những thao tác nhỏ tại chỗ gọi là phép quay.',
  summary:
    'Chèn cùng một dãy khoá vào một cây nhị phân tìm kiếm thường và một cây AVL, rồi so sánh chiều cao và số phép so sánh của hai cây.',
  instruction:
    'Gõ một dãy khoá hoặc chọn một dãy có sẵn, rồi chạy từng bước. Mỗi khoá được chèn vào BST thường trước, rồi vào cây AVL. Hãy xem cây thường nghiêng dần trong khi cây AVL tự quay, và so sánh các bộ đếm chiều cao và số phép so sánh.',
  keysLabel: 'Các khoá, theo thứ tự chèn',
  keysAria: 'Các khoá cần chèn, cách nhau bởi dấu phẩy',
  run: 'Chạy',
  resetLabel: 'Đặt lại',
  presetLabel: 'Dãy có sẵn',
  presetPlaceholder: 'Chọn một dãy có sẵn…',
  presets: {
    sorted: 'Tăng dần',
    reversed: 'Giảm dần',
    zigzag: 'Ziczac',
    balanced: 'Thứ tự vốn đã cân bằng',
    random: 'Ngẫu nhiên',
  },
  errors: {
    empty: 'Hãy gõ ít nhất một khoá.',
    format: 'Hãy dùng các số nguyên, cách nhau bởi dấu phẩy.',
    range: 'Các khoá phải nằm trong khoảng từ 0 đến 99.',
    duplicate: 'Mỗi khoá chỉ được xuất hiện một lần.',
    count: 'Dùng nhiều nhất 15 khoá.',
  },
  plainTitle: 'BST thường',
  avlTitle: 'Cây AVL',
  emptyTree: 'Cây đang rỗng.',
  heightWord: 'chiều cao',
  stats: {
    plainHeight: 'Chiều cao BST thường',
    avlHeight: 'Chiều cao cây AVL',
    plainComparisons: 'Số phép so sánh, BST thường',
    avlComparisons: 'Số phép so sánh, cây AVL',
    rotations: 'Số phép quay của cây AVL',
    ideal: 'Chiều cao nhỏ nhất có thể',
  },
  heightNote:
    'Chiều cao đếm số nút trên đường dài nhất tính từ gốc, nên cây chỉ có một nút thì cao 1.',
  legend: {
    added: 'Khoá mới',
    up: 'Được quay lên',
    down: 'Bị quay xuống',
  },
  markers: { added: '+', up: '↑', down: '↓' },
  /** @param {string} name @param {number} height @param {number[]} keys */
  treeLabel: (name, height, keys) =>
    `${name} gồm ${keys.length} khoá, chiều cao ${height}. Theo thứ tự giữa: ${keys.join(', ') || 'chưa có khoá nào'}.`,
  /** @param {string} key @param {string} state @param {number} depth */
  nodeLabel: (key, state, depth) => `Khoá ${key}${state ? `, ${state}` : ''}, độ sâu ${depth}`,
  nodeStates: { added: 'khoá mới', up: 'được quay lên', down: 'bị quay xuống' },
  /** @param {WhyBalanceFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return 'Cả hai cây đều bắt đầu rỗng. Bấm bước tiếp để chèn khoá đầu tiên vào mỗi cây.';
      case 'insert-plain':
        return f.plainWalk === 0
          ? `Khoá ${f.key} trở thành gốc của BST thường.`
          : `BST thường: ${f.key} đi xuống qua ${f.plainWalk} phép so sánh rồi thành một lá. Ngoài ra không có gì thay đổi, dù cây có hình dạng thế nào.`;
      case 'insert-avl':
        return f.avlWalk === 0
          ? `Khoá ${f.key} trở thành gốc của cây AVL.`
          : `Cây AVL: ${f.key} đi xuống qua ${f.avlWalk} phép so sánh rồi thành một lá. Giờ trên đường đi ngược lên, mỗi nút tổ tiên kiểm tra lại chiều cao của hai con.`;
      case 'rotate': {
        const r = /** @type {NonNullable<WhyBalanceFrame['rotation']>} */ (f.rotation);
        return r.prepares
          ? `Nhánh nặng bị gập vào trong, nên ta quay ${SIDE[r.direction]} tại ${r.pivot} trước: ${r.up} được đưa lên. Bước này nắn thẳng chỗ gập cho phép quay kế tiếp.`
          : `Chiều cao hai con lệch nhau 2, nên ta quay ${SIDE[r.direction]} tại ${r.pivot}: ${r.up} được đưa lên, ${r.pivot} bị đưa xuống. Chỉ vài liên kết thay đổi, và thứ tự giữa của các khoá vẫn tăng dần.`;
      }
      case 'done':
        return `Xong. BST thường cao ${f.plainHeight} và tốn ${f.plainComparisons} phép so sánh; cây AVL cao ${f.avlHeight} và tốn ${f.avlComparisons} phép so sánh, sau ${f.rotations} phép quay.`;
    }
  },
  takeaways: [
    'Tìm kiếm, chèn và xoá trên BST đều đi theo một đường từ gốc xuống lá, nên tốn O(chiều cao). Câu hỏi duy nhất là cây cao đến đâu.',
    'BST thường có hình dạng do thứ tự chèn quyết định. Dãy tăng dần, giảm dần hay ziczac đều dựng nên một nhánh dài cao n tầng: thực chất là một danh sách liên kết (linked list) tốn thêm bước, mỗi thao tác tốn O(n) và tổng cộng khoảng n²/2 phép so sánh.',
    'Cây cân bằng bảo đảm chiều cao O(log n). Không cây nhị phân nào chứa n khoá lại thấp hơn ⌈log₂(n + 1)⌉ tầng, và cây AVL luôn cao không quá khoảng 1,44 lần mức đó.',
    'Một phép quay đưa một nút con lên trên nút cha của nó và chuyển một cây con sang phía bên kia. Nó chỉ đổi một số hằng liên kết và không bao giờ làm đổi thứ tự giữa, nên cây vẫn là một BST hợp lệ.',
    'Thử dãy “Tăng dần”, rồi “Thứ tự vốn đã cân bằng”: với dãy đầu, BST thường cao 10 khi có 10 khoá; với dãy sau, cây chỉ cao 4 với 15 khoá và không cần phép quay nào.',
  ],
  complexityHead: ['Cây', 'Chi phí mỗi thao tác', 'Vì sao'],
  complexity: [
    [
      'BST thường, thứ tự thuận lợi',
      'O(log n)',
      'Chèn ngẫu nhiên cho độ sâu kì vọng gần 2 ln n, và chiều cao vẫn thuộc O(log n).',
    ],
    ['BST thường, thứ tự tăng dần', 'O(n)', 'Mỗi khoá đều thành con phải của khoá vừa chèn.'],
    ['Cây AVL, thứ tự bất kì', 'O(log n)', 'Chiều cao luôn dưới khoảng 1,44 log₂(n + 2).'],
    ['Một phép quay', 'O(1)', 'Chỉ một số hằng liên kết thay đổi, dù cây lớn đến đâu.'],
    ['Bộ nhớ', 'O(n)', 'Mỗi khoá một nút, cộng thêm một chiều cao lưu trong mỗi nút AVL.'],
  ],
  nextTeaser:
    'Bài sau đi sâu vào cây AVL: hệ số cân bằng, bốn trường hợp lệch và cách phép quay đơn, quay kép sửa chúng.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Chèn lần lượt 10, 20, 30, 40, 50, 60, 70, 80 vào một BST thường đang rỗng. Tất cả các lần chèn tốn tổng cộng bao nhiêu phép so sánh khoá?',
      answer: 28,
      unit: 'phép so sánh',
      hints: [
        'Mỗi khoá mới lớn hơn mọi khoá trước nó, nên nó đi hết nhánh phải.',
        'Khoá thứ k so sánh với k − 1 khoá đã có trong cây.',
      ],
      solution:
        'Các khoá lần lượt tốn 0, 1, 2, 3, 4, 5, 6 và 7 phép so sánh. Tổng là 0 + 1 + … + 7 = 28. Hãy gõ các khoá vào hình minh hoạ để đối chiếu với bộ đếm.',
    },
    {
      type: 'number',
      prompt:
        'Cũng tám khoá tăng dần đó được chèn vào một cây AVL. Chiều cao cuối cùng của cây là bao nhiêu?',
      answer: 4,
      hints: [
        'Chạy dãy khoá trong hình minh hoạ rồi đọc ô “Chiều cao cây AVL”.',
        'Bảy khoá vừa khít một cây hoàn hảo cao 3, nên khoá thứ tám mở ra tầng mới.',
      ],
      solution:
        'Các phép quay giữ cho cây đầy nhất có thể. Bảy khoá lấp đầy ba tầng, khoá thứ tám cần tầng thứ tư, nên chiều cao là 4, so với 8 của BST thường.',
    },
    {
      type: 'number',
      prompt:
        'Một cây nhị phân chứa 1000 khoá có chiều cao nhỏ nhất là bao nhiêu, nếu đếm số nút trên đường dài nhất?',
      answer: 10,
      hints: [
        'Một cây cao h chứa nhiều nhất 2ʰ − 1 khoá.',
        'Tìm h nhỏ nhất sao cho 2ʰ − 1 ≥ 1000.',
      ],
      solution:
        '2⁹ − 1 = 511 là chưa đủ, còn 2¹⁰ − 1 = 1023 là đủ, nên chiều cao nhỏ nhất là 10. Một BST thường chèn cùng các khoá theo thứ tự tăng dần thì cao 1000.',
    },
    {
      type: 'choice',
      prompt: 'Thứ tự chèn nào làm BST thường chứa các khoá từ 1 đến 7 thấp nhất?',
      options: [
        '1, 2, 3, 4, 5, 6, 7',
        '7, 6, 5, 4, 3, 2, 1',
        '4, 2, 6, 1, 3, 5, 7',
        '1, 7, 2, 6, 3, 5, 4',
      ],
      answer: 2,
      hints: ['Khoá được chèn đầu tiên sẽ làm gốc mãi mãi.', 'Khoá nào chia đôi đoạn từ 1 đến 7?'],
      solution:
        'Bắt đầu bằng khoá giữa 4, rồi đến khoá giữa của mỗi nửa là 2 và 6, ta dựng được một cây hoàn hảo cao 3. Ba thứ tự còn lại đều dựng một nhánh dài cao 7.',
    },
    {
      type: 'multi',
      prompt: 'Những điều nào đúng với một phép quay đơn?',
      options: [
        'Thứ tự giữa của các khoá vẫn giữ nguyên',
        'Nó chỉ đổi một số hằng liên kết',
        'Nó làm mọi nút trong cây đổi độ sâu',
        'Nó luôn làm cây thấp đi đúng một tầng',
      ],
      answers: [0, 1],
      hints: [
        'Một phép quay chỉ chạm vào hai nút và một cây con đổi cha.',
        'Thử quay một cây đã cân bằng xem nó có thấp đi không.',
      ],
      solution:
        'Phép quay giữ thứ tự BST và chỉ nối lại một số cố định con trỏ. Chỉ các nút và cây con bị dời mới đổi độ sâu, và quay sai chỗ còn có thể làm cây cao thêm, nên phải chọn chỗ quay dựa vào chiều cao.',
    },
    {
      type: 'number',
      prompt:
        'Chèn 4, 2, 6, 1, 3, 5, 7 vào phía cây AVL của hình minh hoạ. Cây tốn bao nhiêu phép quay?',
      answer: 0,
      unit: 'phép quay',
      hints: ['Mỗi khoá rơi vào một tầng mà các khoá trước đã cân bằng sẵn.'],
      solution:
        'Thứ tự này lấp cây theo từng tầng, nên không nút nào có hai con lệch nhau 2 về chiều cao. Ở đây việc cân bằng chỉ tốn công kiểm tra chiều cao, và cả hai cây đều tốn 10 phép so sánh như nhau.',
    },
  ],
};
