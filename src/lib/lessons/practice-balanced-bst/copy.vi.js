/** @typedef {import('$lib/algo-engine/practice-balanced-bst.js').RunnerFrame} RunnerFrame */
/** @typedef {import('$lib/algo-engine/practice-balanced-bst.js').RunnerOp} RunnerOp */

const NAMES = { bst: 'BST thường', avl: 'cây AVL', skip: 'skip list' };
const IDS = /** @type {const} */ (['bst', 'avl', 'skip']);

/** @param {RunnerFrame} f */
const costs = (f, field = /** @type {'cost'|'total'} */ ('cost')) =>
  IDS.map((id) => `${NAMES[id]} ${f[id][field]}`).join(', ');

/** @param {RunnerFrame} f */
function cheapest(f) {
  const best = Math.min(...IDS.map((id) => f[id].total));
  const winners = IDS.filter((id) => f[id].total === best).map((id) => NAMES[id]);
  return winners.length === 1 ? `${winners[0]} rẻ nhất` : `${winners.join(' và ')} cùng rẻ nhất`;
}

export const vi = {
  slug: 'practice-balanced-bst',
  topic: 'balanced-bst',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán cây cân bằng',
  intro:
    'Chọn cấu trúc có thứ tự nào là tuỳ vào việc nó thực sự phải làm. Hãy chạy cùng một dãy thao tác trên một BST thường, một cây AVL và một skip list, đếm số phép so sánh mỗi cấu trúc tốn, và xem khi nào cân bằng đáng đồng tiền, cũng như truy vấn thứ hạng tốn bao nhiêu khi có và khi không lưu số đếm.',
  summary:
    'Chạy một dãy thao tác trên BST thường, cây AVL và skip list, so sánh chi phí, và xem việc lưu số đếm giúp gì cho truy vấn thứ hạng.',
  instruction:
    'Chọn một dãy có sẵn hoặc tự gõ dãy của bạn, rồi chạy từng bước hoặc nhảy đến bước cuối để xem tổng. Đổi cách trả lời truy vấn thứ hạng, tung lại đồng xu cho skip list, và dùng hình minh hoạ để trả lời các câu hỏi bên dưới.',
  opsLabel: 'Các thao tác',
  opsAria:
    'Các thao tác: i là chèn, s là tìm, d là xoá, r là thứ hạng, mỗi chữ theo sau là một khoá từ 0 đến 99.',
  opsHelp: 'i chèn, s tìm, d xoá, r thứ hạng, rồi đến khoá: i5 i3 s5 r5 d3',
  run: 'Chạy',
  coins: 'Tung lại đồng xu',
  rankLabel: 'Truy vấn thứ hạng',
  rankModes: { walk: 'Không lưu số đếm', counted: 'Có lưu số đếm' },
  presetLabel: 'Dãy có sẵn',
  presetPlaceholder: 'Chọn một dãy có sẵn…',
  presets: {
    sorted: 'Chèn tăng dần',
    shuffled: 'Chèn xáo trộn',
    scoreboard: 'Bảng điểm có xếp hạng',
    window: 'Cửa sổ trượt',
    random: 'Ngẫu nhiên',
  },
  opErrors: {
    empty: 'Hãy gõ ít nhất một thao tác.',
    format:
      'Viết mỗi thao tác bằng một chữ cái (i, s, d hoặc r) và một khoá từ 0 đến 99, ví dụ i42.',
    count: 'Dùng nhiều nhất 40 thao tác.',
    full: 'Cùng lúc chỉ lưu được nhiều nhất 15 khoá, để các cây còn dễ đọc.',
  },
  structures: { bst: 'BST thường', avl: 'Cây AVL', skip: 'Skip list' },
  costTitle: 'Số phép so sánh đến lúc này',
  stats: {
    thisOp: 'thao tác này',
    worst: 'tệ nhất',
    height: 'chiều cao',
    levels: 'số tầng',
    keys: 'Số khoá đang lưu',
    rotations: 'Số phép quay của cây AVL',
    rank: 'Thứ hạng tìm được',
  },
  noRank: '—',
  heightWord: 'chiều cao',
  levelsWord: 'số tầng',
  /** @param {string} name @param {number} h @param {number[]} keys */
  treeLabel: (name, h, keys) =>
    `${name}, chiều cao ${h}. Theo thứ tự giữa: ${keys.join(', ') || 'chưa có khoá nào'}.`,
  emptyTree: 'Cây đang rỗng.',
  emptySkip: 'Skip list đang rỗng.',
  /** @param {string} key @param {string} state */
  nodeLabel: (key, state) => `Khoá ${key}${state ? `, ${state}` : ''}`,
  /** @param {number} level */
  levelHead: (level) => `T${level}`,
  /** @param {number} levels @param {string} list */
  skipLabel: (levels, list) => `Skip list gồm ${levels} tầng. Các cột: ${list}.`,
  /** @param {number} key @param {number} height */
  towerText: (key, height) => `${key} (cao ${height})`,
  roles: { compare: 'đang so sánh', added: 'mới', hit: 'đã tìm thấy' },
  markers: { compare: '?', added: '+', hit: '★' },
  opsTitle: 'Dãy thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác hiện tại',
  /** @param {RunnerOp} op */
  opChip: (op) => `${op.type[0]}${op.key}`,
  /** @param {RunnerFrame} f @param {boolean} counted */
  describe(f, counted) {
    if (f.kind === 'start') {
      return 'Chưa chạy gì cả. Hãy chạy từng bước qua dãy thao tác, hoặc nhảy đến bước cuối để xem tổng.';
    }
    if (f.kind === 'done') {
      return `Tổng: ${costs(f, 'total')}, nên ${cheapest(f)}.`;
    }
    const op = /** @type {RunnerOp} */ (f.op);
    const key = op.key;
    /** @type {string} */
    let head;
    switch (f.outcome) {
      case 'added':
        head = `Chèn ${key}.`;
        break;
      case 'dup':
        head = `${key} đã được lưu, nên lệnh chèn không làm thay đổi gì.`;
        break;
      case 'found':
        head = `Tìm ${key}: có.`;
        break;
      case 'removed':
        head = `Xoá ${key}.`;
        break;
      case 'ranked':
        head = counted
          ? `Thứ hạng của ${key} là ${f.rank}, tìm được bằng cách đi một đường và cộng dồn những gì đã bỏ qua.`
          : `Thứ hạng của ${key} là ${f.rank}, tìm được bằng cách so sánh các khoá theo thứ tự tăng dần.`;
        break;
      default:
        head =
          op.type === 'delete'
            ? `${key} không được lưu, nên lệnh xoá không làm thay đổi gì.`
            : `Tìm ${key}: không có.`;
    }
    const spin = f.opRotations > 0 ? ` Cây AVL cần ${f.opRotations} phép quay.` : '';
    return `${head} Số phép so sánh: ${costs(f)}.${spin}`;
  },
  takeaways: [
    'Chi phí của BST thường phụ thuộc vào thứ tự các khoá đến. Khoá tăng dần dựng thành một chuỗi, khi đó n lần chèn tốn n(n − 1) / 2 phép so sánh. Khoá xáo trộn cho một hình dạng gần tốt như cây cân bằng mà không cần phép quay nào.',
    'Cân bằng giống như mua bảo hiểm. Cây AVL giới hạn chiều cao ở khoảng 1,44 log₂ n với mọi đầu vào, và trả giá bằng các phép quay và một chiều cao lưu trong nút. Cây đỏ đen nới giới hạn ra 2 log₂(n + 1) và quay ít hơn sau mỗi lần cập nhật, nên hợp với các ánh xạ phải ghi nhiều.',
    'Skip list đạt cùng chi phí kì vọng mà không cần phép quay, và mã của nó ngắn. Chi phí phụ thuộc vào các lần tung đồng xu chứ không vào đầu vào, nên cùng một dãy thao tác có thể tốn hơn hoặc ít hơn cây cân bằng.',
    'Truy vấn thứ hạng cần một số đếm được lưu sẵn. Không có nó, cấu trúc nào ở đây cũng phải so sánh từng khoá một theo thứ tự tăng dần, tức O(n). Có kích thước cây con hoặc độ rộng liên kết thì chỉ cần một lượt đi O(log n), đổi lại mỗi nút phải giữ đúng thêm một số.',
    'Thử “Bảng điểm có xếp hạng” khi có và khi không lưu số đếm, rồi so sánh tổng. Sau đó tung lại đồng xu với “Chèn tăng dần” và xem tổng của skip list thay đổi bao nhiêu trong khi tổng của cây AVL vẫn giữ nguyên.',
  ],
  complexityHead: ['Cấu trúc hoặc truy vấn', 'Chi phí', 'Vì sao'],
  complexity: [
    ['BST thường, đầu vào tăng dần', 'O(n) mỗi thao tác', 'Cây là một chuỗi cao n.'],
    [
      'BST thường, đầu vào xáo trộn',
      'O(log n) kì vọng',
      'Thứ tự ngẫu nhiên cho độ sâu trung bình gần 2 ln n.',
    ],
    ['Cây AVL', 'O(log n) trường hợp xấu nhất', 'Chiều cao luôn dưới khoảng 1,44 log₂ n.'],
    [
      'Skip list',
      'O(log n) kì vọng',
      'Khoảng log₂ n tầng nhờ tung đồng xu cân đối, với mọi đầu vào.',
    ],
    ['Thứ hạng, không lưu số đếm', 'O(n)', 'Phải so sánh các khoá theo thứ tự tăng dần cho đến k.'],
    ['Thứ hạng, có lưu số đếm', 'O(log n)', 'Một lượt đi, mỗi nút đọc một số đếm đã lưu.'],
    [
      'Bộ nhớ',
      'O(n)',
      'Cả ba đều dùng mỗi khoá một nút; skip list trung bình có 2 liên kết mỗi khoá.',
    ],
  ],
  nextTeaser:
    'Tiếp theo là ôn tập: thuật toán cốt lõi, nơi bạn gom lại những gì đã học ở cả phần này qua một loạt câu hỏi.',
  practiceTitle: 'Bài luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Mở “Chèn tăng dần”. Qua cả dãy thao tác, BST thường tốn tổng cộng bao nhiêu phép so sánh?',
      answer: 170,
      unit: 'phép so sánh',
      hints: [
        'Nhảy đến bước cuối và đọc tổng của BST thường.',
        '15 lần chèn tốn 0 + 1 + … + 14, và mỗi lần tìm đi xuống dọc chuỗi.',
      ],
      solution:
        'Các lần chèn tốn 0 + 1 + … + 14 = 105 phép so sánh, và các lần tìm 15, 14, 13, 12 và 11 tốn 15 + 14 + 13 + 12 + 11 = 65, tổng là 170.',
    },
    {
      type: 'number',
      prompt:
        'Cũng với dãy đó, thao tác tốn nhất của cây AVL tốn bao nhiêu? Đó là giá trị “tệ nhất” trên thẻ của nó.',
      answer: 4,
      unit: 'phép so sánh',
      hints: ['Đọc thẻ của cây AVL ở bước cuối. So sánh chiều cao của nó với giá trị này.'],
      solution:
        'Cây AVL cuối cùng cao 4, nên không lượt đi nào so sánh quá 4 khoá. Giá trị tệ nhất của BST thường là 15, đúng bằng chiều cao của chuỗi.',
    },
    {
      type: 'choice',
      prompt: 'Mở “Chèn xáo trộn” và đến bước cuối. Cây nào tốn ít hơn tính tổng cộng?',
      options: [
        'BST thường',
        'Cây AVL',
        'Hai cây tốn đúng bằng nhau',
        'Còn tuỳ vào lần tung đồng xu',
      ],
      answer: 0,
      hints: ['Đọc cả hai tổng. Tung đồng xu chỉ ảnh hưởng đến skip list.'],
      solution:
        'BST thường tốn 57 so với 59 của cây AVL, và không cần phép quay nào. Với đầu vào xáo trộn, ở đây cân bằng không mang lại gì; vì thế nó là bảo hiểm cho những thứ tự xấu, chứ không phải món lợi miễn phí.',
    },
    {
      type: 'number',
      prompt:
        'Mở “Bảng điểm có xếp hạng”. Khi truy vấn thứ hạng dùng số đếm đã lưu thay vì không lưu, cây AVL tiết kiệm tổng cộng bao nhiêu phép so sánh?',
      answer: 50,
      unit: 'phép so sánh',
      hints: ['Đọc tổng của cây AVL ở bước cuối với từng cách thiết lập.'],
      solution:
        'Khi không lưu số đếm, tổng của cây AVL là 117, còn khi có là 67, tiết kiệm được 50. Mười truy vấn thứ hạng giảm từ 80 phép so sánh xuống 30, còn 37 phép so sánh cho các lần chèn thì không đổi.',
    },
    {
      type: 'number',
      prompt:
        'Mở “Cửa sổ trượt”, ở đó mỗi khi một khoá mới đến thì khoá cũ nhất rời đi. BST thường tốn tổng cộng bao nhiêu phép so sánh?',
      answer: 100,
      unit: 'phép so sánh',
      hints: ['Nhảy đến bước cuối và đọc tổng của BST thường.'],
      solution:
        'Nó tốn 100 so với 69 của cây AVL. Mọi khoá mới đều là khoá lớn nhất, nên các lần chèn đi hết chuỗi lệch phải, dù mỗi lần xoá ở tận cùng bên trái thì rẻ.',
    },
    {
      type: 'number',
      prompt: 'Gõ dãy i10 i20 i30 i40 i50 r35 rồi chạy. r35 báo thứ hạng bao nhiêu?',
      answer: 4,
      hints: ['Thứ hạng bằng 1 cộng số khoá nhỏ hơn. Khoá đó không cần có trong cấu trúc.'],
      solution:
        'Các khoá 10, 20 và 30 nhỏ hơn 35, nên thứ hạng là 3 + 1 = 4, đúng vị trí mà 35 sẽ đứng theo thứ tự tăng dần.',
    },
    {
      type: 'number',
      prompt:
        'Tổng của “Chèn tăng dần” bắt đầu bằng 0 + 1 + … + 14 cho 15 lần chèn. Nếu chèn 1000 khoá tăng dần, BST thường sẽ tốn bao nhiêu phép so sánh?',
      answer: 499500,
      unit: 'phép so sánh',
      hints: ['Tổng 0 + 1 + … + (n − 1) bằng n(n − 1) / 2.'],
      solution:
        '1000 × 999 / 2 = 499 500 phép so sánh. Cây AVL chỉ cần khoảng 1000 × log₂ 1000, tức chừng 10 000, vì thế n càng lớn thì cân bằng càng quan trọng.',
    },
    {
      type: 'choice',
      prompt:
        'Một trò chơi có bảng điểm trực tiếp. Điểm số thay đổi liên tục và người chơi hỏi “tôi đang đứng thứ mấy?”. Cấu trúc nào hợp nhất?',
      options: [
        'Một bảng băm (hash table) lưu điểm',
        'Một BST thường xếp theo điểm',
        'Một cây cân bằng có lưu kích thước cây con',
        'Một mảng đã sắp xếp',
      ],
      answer: 2,
      hints: [
        'Các truy vấn cần thứ tự, và cả cập nhật lẫn xếp hạng đều phải nhanh.',
        'Mảng đã sắp xếp tốn bao nhiêu cho mỗi lần cập nhật?',
      ],
      solution:
        'Cây cân bằng có lưu kích thước cây con làm cả cập nhật lẫn xếp hạng trong O(log n). Bảng băm không có thứ tự, mảng đã sắp xếp cần O(n) cho mỗi lần cập nhật, còn BST thường có thể thoái hoá thành một chuỗi.',
    },
    {
      type: 'multi',
      prompt: 'Những cặp nhu cầu và cấu trúc nào là hợp lí?',
      options: [
        'Chỉ mục trên đĩa, mỗi lần đọc nút đều chậm: cây B',
        'Tra cứu khớp chính xác, không cần thứ tự: bảng băm',
        'Khoá đến theo thứ tự tăng dần và phải tìm được: BST thường',
        'Một ánh xạ có thứ tự ngắn gọn, đơn giản, không phép quay: skip list',
      ],
      answers: [0, 1, 3],
      hints: ['Nghĩ xem mỗi cấu trúc có hình dạng thế nào với đầu vào tệ nhất của nó.'],
      solution:
        'Cây B gói nhiều khoá vào mỗi trang đĩa, bảng băm cho thời gian kì vọng O(1) khi không cần thứ tự, và skip list không cần phép quay. Đầu vào tăng dần chính là thứ biến BST thường thành một chuỗi.',
    },
  ],
};
