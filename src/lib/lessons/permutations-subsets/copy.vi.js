/** @typedef {import('$lib/algo-engine/permutations-subsets.js').GenFrame} GenFrame */
/** @typedef {import('$lib/algo-engine/permutations-subsets.js').GenMode} GenMode */
/** @typedef {import('$lib/algo-engine/permutations-subsets.js').GenNode} GenNode */

/** @param {string} s */
const shown = (s) => (s === '' ? '∅' : s);

export const vi = {
  slug: 'permutations-subsets',
  topic: 'backtracking',
  level: 'Trung bình',
  title: 'Hoán vị, tổ hợp và tập con',
  intro:
    'Hoán vị, tổ hợp và tập con là ba thứ kinh điển cần liệt kê, và chỉ một hàm đệ quy là lo được cả ba: chọn một phần tử, gọi đệ quy, rồi bỏ chọn nó. Chúng chỉ khác nhau ở chỗ một lời gọi được chọn những phần tử nào tiếp theo. Hoán vị được dùng bất kì phần tử nào chưa dùng, còn tổ hợp và tập con chỉ nhìn về phía sau phần tử vừa chọn, nhờ vậy {A, B} không xuất hiện lần thứ hai dưới dạng {B, A}.',
  summary:
    'Chạy từng bước một bộ sinh khi nó chọn và bỏ chọn các phần tử để liệt kê mọi hoán vị, tổ hợp hoặc tập con, có và không có phần tử trùng.',
  instruction:
    'Chọn thứ cần sinh rồi chạy từng bước: cây cho thấy mỗi lần chọn, và mục “Kết quả” được điền dần mỗi khi đệ quy tới một đầu ra. Nhập các phần tử của bạn, rồi thử những phần tử lặp lại như A A B và đổi mục “Phần tử lặp lại” để so sánh số kết quả.',
  modeLabel: 'Sinh',
  modes: { perm: 'Hoán vị', comb: 'Tổ hợp', subset: 'Tập con' },
  uniqueLabel: 'Phần tử lặp lại',
  uniques: { on: 'Bỏ qua bản trùng', off: 'Liệt kê tất cả' },
  itemsLabel: 'Các phần tử',
  kLabel: 'Kích thước k',
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    abc: 'Hoán vị của A B C',
    aab: 'Hoán vị của A A B',
    five: 'Chọn 3 trong 5',
    twins: 'Tập con của 1 2 2',
  },
  /** @param {number} max */
  itemsError: (max) =>
    `Hãy nhập từ 1 đến ${max} phần tử, cách nhau bởi dấu cách, mỗi phần tử gồm một hoặc hai chữ cái hay chữ số.`,
  /** @param {number} n */
  kError: (n) => `k phải là số nguyên từ 0 đến ${n}.`,
  itemsTitle: 'Các phần tử, đã sắp xếp',
  itemsAria:
    'Các phần tử theo thứ tự đã sắp xếp. Phần tử nằm trên đường đi hiện tại được đánh dấu.',
  /** @param {number} i @param {string} v @param {boolean} on */
  itemCell: (i, v, on) => `Phần tử ${v} ở chỉ số ${i}${on ? ', nằm trên đường đi' : ''}`,
  treeTitle: 'Cây đệ quy',
  treeNote:
    'Mỗi vòng tròn là một lời gọi và ghi phần tử mà nó đã chọn. ★ đánh dấu lời gọi đã cho ra một đầu ra.',
  treeAria: 'Cây đệ quy của bộ sinh, được dựng dần khi chạy.',
  rootLabel: '∅',
  /** @param {GenNode} n */
  nodeLabel: (n) =>
    `Lời gọi với đường đi ${shown(n.path)}${n.output ? ', đã cho ra một đầu ra' : ''}${n.open ? ', vẫn đang chạy' : ''}.`,
  outputMark: '★',
  legend: {
    active: 'Đang xử lí',
    open: 'Đường đi hiện tại',
    finished: 'Đã trả về',
    output: 'Đã cho ra một đầu ra',
  },
  stats: {
    results: 'Kết quả',
    calls: 'Số lời gọi',
    copied: 'Số phần tử đã chép',
    skipped: 'Số bản trùng đã bỏ qua',
  },
  /** @param {GenMode} mode @param {number} count */
  countNote: (mode, count) =>
    ({
      perm: `n! = ${count} nếu mọi phần tử đều khác nhau.`,
      comb: `C(n, k) = ${count} nếu mọi phần tử đều khác nhau.`,
      subset: `2ⁿ = ${count} nếu mọi phần tử đều khác nhau.`,
    })[mode],
  pathTitle: 'Đường đi hiện tại',
  pathEmpty: 'Rỗng.',
  resultsTitle: 'Kết quả',
  resultsEmpty: 'Chưa có.',
  /** @param {string} s */
  output: (s) => shown(s),
  /** @param {GenFrame} f */
  describe(f) {
    const item = f.at >= 0 ? f.items[f.at] : '';
    const now = f.path.map((i) => f.items[i]).join(' ');
    switch (f.kind) {
      case 'start':
        return f.mode === 'comb'
          ? `Sinh mọi cách chọn ${f.k} trong ${f.items.length} phần tử. Các phần tử đã được sắp xếp, nên những phần tử bằng nhau đứng cạnh nhau.`
          : `Sinh mọi ${f.mode === 'perm' ? 'hoán vị' : 'tập con'} của ${f.items.length} phần tử. Các phần tử đã được sắp xếp, nên những phần tử bằng nhau đứng cạnh nhau.`;
      case 'pick':
        return `Chọn ${item}. Đường đi giờ là ${now}.`;
      case 'emit':
        return `Đưa ra một bản sao của đường đi: ${shown(now)}. Bản sao đó tốn ${f.path.length} phần tử.`;
      case 'unpick':
        return `Bỏ chọn ${item}, để đường đi lại là ${shown(now)}, rồi thử phần tử tiếp theo.`;
      case 'skip':
        return `Bỏ qua ${item} này: ở tầng này, ${item} đứng trước nó đã được thử rồi, nên nó chỉ lặp lại đúng các kết quả cũ.`;
      case 'cut':
        return `Dừng vòng lặp này: từ ${item} trở đi, không còn đủ phần tử để đạt ${f.k}.`;
      case 'done':
        return `Xong: ${f.outputs.length} kết quả từ ${f.calls} lời gọi, đã chép ${f.copied} phần tử.`;
    }
  },
  takeaways: [
    'Một hàm đệ quy, ba quy tắc. Hoán vị thử mọi phần tử chưa dùng, nhờ một mảng used[]. Tổ hợp và tập con chỉ thử các phần tử đứng sau phần tử vừa chọn, nhờ một chỉ số start, nên mỗi tập chỉ xuất hiện theo một thứ tự.',
    'Tập con cho ra đầu ra ở mọi lời gọi. Tổ hợp chỉ cho ra khi đường đi đủ kích thước k, còn hoán vị chỉ khi đường đi đủ kích thước n.',
    'Để tránh bản trùng, hãy sắp xếp trước, rồi ở mỗi tầng bỏ qua phần tử bằng phần tử đứng trước nó. Với hoán vị, chỉ bỏ qua khi bản đứng trước chưa được dùng, nghĩa là các phần tử bằng nhau luôn được chọn theo cùng một thứ tự tương đối.',
    'Chi phí phụ thuộc vào đầu ra: công việc tăng theo lượng kết quả sinh ra. Có n! hoán vị độ dài n, nên không cách nào liệt kê chúng với ít hơn n · n! lần ghi phần tử. Chậm ở đây không phải do thuật toán dở, mà do đáp án quá lớn.',
    'Sinh hoán vị của A A B với “Liệt kê tất cả”, rồi với “Bỏ qua bản trùng”. Số kết quả giảm từ 6 còn 3, tức là 3!/2!. Giờ hãy đoán số kết quả cho A A B B, rồi kiểm tra lại.',
  ],
  complexityHead: ['Sinh', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Hoán vị', 'O(n · n!)', 'n! kết quả độ dài n, và tổng cộng nhiều nhất e · n! lời gọi.'],
    ['Tổ hợp', 'O(k · C(n, k))', 'C(n, k) kết quả độ dài k; không lời gọi nào bị phí.'],
    ['Tập con', 'O(n · 2ⁿ)', '2ⁿ kết quả, mỗi kết quả một lời gọi, độ dài trung bình n/2.'],
    ['Bộ nhớ', 'O(n)', 'Đường đi và ngăn xếp lời gọi, không tính các kết quả đã lưu.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'A B C D có bao nhiêu hoán vị?',
      answer: 24,
      unit: 'hoán vị',
      hints: ['Có bốn cách cho vị trí đầu, rồi ba, rồi hai, rồi một.'],
      solution: '4! = 4 · 3 · 2 · 1 = 24.',
    },
    {
      type: 'number',
      prompt: 'A A B B có bao nhiêu hoán vị khác nhau?',
      answer: 6,
      unit: 'hoán vị',
      hints: [
        'Nhập A A B B và dùng “Bỏ qua bản trùng”.',
        'Chia 4! cho số cách hoán đổi các bản lặp của mỗi phần tử.',
      ],
      solution:
        '4!/(2! · 2!) = 24/4 = 6: AABB, ABAB, ABBA, BAAB, BABA, BBAA. Với “Liệt kê tất cả”, mỗi hoán vị này xuất hiện 4 lần.',
    },
    {
      type: 'number',
      prompt: 'Có bao nhiêu cách chọn 3 phần tử từ A B C D E?',
      answer: 10,
      unit: 'cách',
      hints: ['Nạp ví dụ “Chọn 3 trong 5”.', 'C(5, 3) = 5!/(3! · 2!).'],
      solution: 'C(5, 3) = 120/(6 · 2) = 10.',
    },
    {
      type: 'number',
      prompt: 'Các phần tử 1 2 2 có bao nhiêu tập con khác nhau, tính cả tập rỗng?',
      answer: 6,
      unit: 'tập con',
      hints: [
        'Nạp ví dụ “Tập con của 1 2 2”.',
        'Chọn số lượng số 1 (0 hoặc 1) và số lượng số 2 (0, 1 hoặc 2).',
      ],
      solution:
        '2 · 3 = 6: ∅, 1, 1 2, 1 2 2, 2, 2 2. “Liệt kê tất cả” cho 2³ = 8, vì 1 2 và 2 mỗi tập xuất hiện hai lần.',
    },
    {
      type: 'number',
      prompt: 'Khi sinh các hoán vị của A B C, hàm đệ quy thực hiện bao nhiêu lời gọi?',
      answer: 16,
      unit: 'lời gọi',
      hints: ['Đếm số nút của cây, từng tầng một.'],
      solution: 'Các tầng có 1, 3, 6 và 6 lời gọi, cộng lại là 16.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao tổ hợp lặp từ một chỉ số start thay vì từ 0?',
      options: [
        'Để vòng lặp chạy nhanh hơn trên đầu vào đã sắp xếp.',
        'Để mỗi tập chỉ được dựng một lần, theo thứ tự chỉ số tăng dần.',
        'Vì phần tử đầu tiên luôn phải có mặt.',
        'Để đường đi tốn ít bộ nhớ hơn.',
      ],
      answer: 1,
      hints: ['Chuyện gì xảy ra với {A, B} và {B, A}?'],
      solution:
        'Chỉ nhìn về phía sau nghĩa là mỗi tập được dựng theo đúng một thứ tự. Lặp từ 0 sẽ cho ra cả {A, B} lẫn {B, A} như thể chúng khác nhau.',
    },
    {
      type: 'multi',
      prompt: 'Những khẳng định nào về việc bỏ qua bản trùng là đúng? Chọn mọi phương án đúng.',
      options: [
        'Các phần tử phải được sắp xếp, hoặc ít nhất các phần tử bằng nhau phải đứng cạnh nhau, thì phép kiểm tra mới đúng.',
        'Nó xoá kết quả sau khi đã sinh ra, nên tốn hơn.',
        'Nó chặn cả một nhánh trước khi nhánh đó được khám phá.',
        'Phép kiểm tra so sánh a[i] với a[i − 1].',
      ],
      answers: [0, 2, 3],
      hints: ['Cách làm này có bao giờ sinh ra bản trùng ngay từ đầu không?'],
      solution:
        'Quy tắc cần các phần tử bằng nhau đứng cạnh nhau, so sánh hai phần tử kề nhau, và chặn nhánh từ trước. Dùng một tập lưu các kết quả đã gặp thì mới là xoá sau, và tốn hơn nhiều.',
    },
    {
      type: 'text',
      prompt: 'Thời gian liệt kê mọi hoán vị của n phần tử là bao nhiêu, theo kí hiệu O lớn?',
      accept: ['O(n·n!)', 'O(n n!)', 'O(n * n!)', 'O(n!·n)', 'n·n!', 'n n!', 'Θ(n·n!)'],
      hints: ['Có bao nhiêu kết quả, và mỗi kết quả dài bao nhiêu?'],
      solution: 'n! kết quả độ dài n, mỗi kết quả được chép một lần: O(n · n!).',
    },
  ],
  nextTeaser:
    'Bài sau đưa quay lui vào những bài toán có ràng buộc chặt: bài toán N quân hậu và Sudoku.',
};
