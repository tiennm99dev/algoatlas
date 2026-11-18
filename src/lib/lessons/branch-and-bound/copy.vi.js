/** @typedef {import('$lib/algo-engine/branch-and-bound.js').BnbFrame} BnbFrame */
/** @typedef {import('$lib/algo-engine/branch-and-bound.js').BnbNode} BnbNode */
/** @typedef {import('$lib/algo-engine/branch-and-bound.js').BnbItem} BnbItem */

/** At most two decimals, with no trailing zeros. @param {number} v */
const num = (v) => String(Math.round(v * 100) / 100);

export const vi = {
  slug: 'branch-and-bound',
  topic: 'backtracking',
  level: 'Nâng cao',
  title: 'Nhánh cận',
  intro:
    'Quay lui thông thường cắt tỉa một nhánh khi nhánh đó phạm luật. Trong bài toán tối ưu, một nhánh có thể không phạm luật nào mà vẫn vô ích, vì nó không bao giờ vượt được đáp án tốt nhất đã tìm thấy. Nhánh cận (branch and bound) gán cho mỗi nút một cận, tức một giới hạn lạc quan cho mọi thứ đi tới được từ nút đó, và loại nút ngay khi giới hạn ấy không thể vượt đáp án tốt nhất hiện có.',
  summary:
    'Giải bài toán cái túi 0/1 bằng nhánh cận, và xem các nút bị cắt tỉa khi cận của chúng không thể vượt giá trị tốt nhất đã tìm được.',
  instruction:
    'Chạy từng bước phép tìm kiếm và so sánh cận của mỗi nút mới với ô “Tốt nhất hiện có”. Đổi mục “Thứ tự tìm kiếm” và so sánh ô “Số nút đã tạo”. Nhập các đồ vật của bạn thành cặp khối lượng:giá trị, hoặc bấm (hay nhấn Enter) vào một nút để nhảy tới lúc nút đó được tạo.',
  /** @param {number} capacity */
  problem: (capacity) =>
    `Xếp đồ vật vào một cái túi sức chứa ${capacity} sao cho tổng giá trị lớn nhất. Mỗi vật hoặc lấy nguyên cả, hoặc không lấy.`,
  orderLabel: 'Thứ tự tìm kiếm',
  orders: { best: 'Tốt nhất trước', depth: 'Theo chiều sâu' },
  itemsLabel: 'Các vật, khối lượng:giá trị',
  capacityLabel: 'Sức chứa',
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    classic: 'Bốn vật',
    greedy: 'Tham lam chưa đủ',
    order: 'Thứ tự quan trọng',
  },
  /** @param {number} maxItems @param {number} maxNumber */
  itemsError: (maxItems, maxNumber) =>
    `Hãy nhập từ 1 đến ${maxItems} vật dạng khối lượng:giá trị, mỗi số là số nguyên từ 1 đến ${maxNumber}.`,
  /** @param {number} max */
  capacityError: (max) => `Sức chứa phải là số nguyên từ 1 đến ${max}.`,
  itemsTitle: 'Các vật, giá trị trên khối lượng lớn nhất đứng trước',
  itemHead: {
    name: 'Vật',
    weight: 'Khối lượng',
    value: 'Giá trị',
    ratio: 'Giá trị / khối lượng',
  },
  /** @param {number} v */
  ratio: (v) => num(v),
  treeTitle: 'Cây tìm kiếm',
  treeNote:
    'Mỗi vòng tròn ghi giá trị đã xếp tới lúc đó, còn “≤” bên dưới là cận: giá trị lớn nhất mà mọi cách xếp tiếp có thể đạt. Một cạnh lấy một vật (+) hoặc bỏ nó (−).',
  treeAria: 'Cây tìm kiếm của bài toán cái túi, được dựng dần khi chạy.',
  /** @param {BnbItem} item @param {boolean} took */
  edge: (item, took) => `${took ? '+' : '−'}${item.name}`,
  /** @param {number} bound */
  boundNote: (bound) => `≤${Math.round(bound * 10) / 10}`,
  overNote: 'quá tải',
  /** @param {BnbNode} n */
  nodeLabel: (n) => {
    const state = {
      frontier: 'đang chờ trong biên',
      active: 'đang xử lí',
      expanded: 'đã mở rộng',
      pruned: 'đã cắt tỉa',
      over: 'vượt sức chứa',
    }[n.status];
    return `Nút có giá trị ${n.value}, khối lượng ${n.weight}, cận ${num(n.bound)}, ${state}.`;
  },
  markers: { best: '★', pruned: '✂', over: '×' },
  legend: {
    active: 'Đang xử lí',
    frontier: 'Đang chờ trong biên',
    expanded: 'Đã mở rộng',
    best: 'Tốt nhất hiện có',
    path: 'Cách xếp tốt nhất',
    pruned: 'Đã cắt tỉa, hoặc × vượt sức chứa',
  },
  stats: {
    best: 'Tốt nhất hiện có',
    made: 'Số nút đã tạo',
    expanded: 'Đã mở rộng',
    pruned: 'Đã cắt tỉa',
  },
  /** @param {number} plain */
  plainNote: (plain) => `Nếu không có cận: ${plain}.`,
  frontierTitle: 'Biên, nút sắp lấy đứng đầu',
  frontierEmpty: 'Rỗng.',
  /** @param {BnbNode} n */
  frontierChip: (n) => `${n.value} ≤${num(n.bound)}`,
  packingTitle: 'Cách xếp tốt nhất hiện có',
  packingEmpty: 'Chưa xếp gì.',
  /** @param {BnbFrame} f */
  describe(f) {
    const n = f.current >= 0 ? f.nodes[f.current] : null;
    const decided = n && n.level > 0 ? f.items[n.level - 1].name : '';
    const branch = n && n.took ? `Lấy ${decided}` : `Bỏ ${decided}`;
    switch (f.kind) {
      case 'start':
        return `Bắt đầu ở gốc. Khi chưa quyết định gì, cận là ${num(n?.bound ?? 0)}: xếp các vật theo thứ tự, rồi lấy một phần của vật đầu tiên không vừa. Không cách xếp nào vượt được con số này.`;
      case 'pop':
        return f.order === 'best'
          ? `Cận lớn nhất trong biên là ${num(n?.bound ?? 0)}, lớn hơn giá trị tốt nhất ${f.best}. Mở rộng nút này.`
          : `Lấy nút mới nhất, có cận ${num(n?.bound ?? 0)}, lớn hơn giá trị tốt nhất ${f.best}. Mở rộng nó.`;
      case 'prunePop':
        return `Cận ${num(n?.bound ?? 0)} của nút này không còn vượt giá trị tốt nhất ${f.best}. Giá trị tốt nhất đã tăng trong lúc nút chờ. Cắt tỉa nó.`;
      case 'over':
        return `${branch}: khối lượng ${n?.weight} vượt sức chứa ${f.capacity}. Loại nhánh này.`;
      case 'better':
        return `${branch}: giá trị ${n?.value} là giá trị tốt nhất mới, vì cách xếp này vừa túi khi bỏ hết các vật còn lại.`;
      case 'push':
        return `${branch}: giá trị ${n?.value}, cận ${num(n?.bound ?? 0)}. Cận vượt giá trị tốt nhất ${f.best}, nên thêm nút vào biên.`;
      case 'pruneChild':
        return `${branch}: cận ${num(n?.bound ?? 0)} không thể vượt giá trị tốt nhất ${f.best}. Cắt tỉa nó, cùng mọi thứ bên dưới.`;
      case 'done':
        return `Biên đã rỗng, nên ${f.best} là giá trị tối ưu. Đã tạo ${f.nodes.length} nút, mở rộng ${f.expanded}, cắt tỉa ${f.pruned}.`;
    }
  },
  takeaways: [
    'Cận là một giới hạn lạc quan cho cả một cây con. Khi tìm giá trị lớn nhất, đó là cận trên, và một nút bị cắt tỉa khi cận không lớn hơn giá trị tốt nhất hiện có. Khi tìm giá trị nhỏ nhất thì làm ngược lại: dùng cận dưới, và cắt tỉa khi cận không nhỏ hơn giá trị tốt nhất.',
    'Một cận tốt vừa rẻ vừa sát. Cận của bài toán cái túi nới lỏng luật “chỉ lấy nguyên vật” để cho phép lấy một phần của một vật, và bài toán đã nới lỏng được giải bằng một quy tắc tham lam trong O(n). Nới lỏng một luật là cách thường dùng để có cận.',
    'Phép cắt tỉa chỉ an toàn nếu cận không bao giờ quá thấp. Một cận đánh giá thấp có thể vứt bỏ đáp án thật mà không để lại dấu hiệu nào.',
    'Thứ tự tìm kiếm thay đổi lượng công việc, không thay đổi đáp án. Tìm theo kiểu tốt nhất trước không bao giờ mở rộng một nút có cận nhỏ hơn giá trị tối ưu, nhưng biên của nó có thể phình to. Tìm theo chiều sâu chỉ giữ khoảng một đường đi, và tới được một đáp án đầy đủ đầu tiên rất nhanh.',
    'Nạp ví dụ “Thứ tự quan trọng” và đổi mục “Thứ tự tìm kiếm”: số nút đã tạo đi từ 27 lên 71, và 121 nếu không có cận. Rồi tăng giá trị của một vật cho tới khi giá trị tối ưu thay đổi, và xem những nhánh nào được mở ra.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Sắp xếp các vật', 'O(n log n)', 'Chỉ làm một lần, để cận đọc các vật theo thứ tự.'],
    ['Một lần tính cận', 'O(n)', 'Một lượt tham lam qua các vật chưa quyết định.'],
    ['Số nút, xấu nhất', 'O(2ⁿ)', 'Một cận yếu cắt được ít, nên vẫn là hàm mũ.'],
    ['Bộ nhớ, tốt nhất trước', 'Xấu nhất O(2ⁿ)', 'Biên có thể chứa rất nhiều nút đang chờ.'],
    [
      'Bộ nhớ, theo chiều sâu',
      'O(n)',
      'Nhiều nhất một đường đi, mỗi tầng một nút anh em đang chờ.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Các vật khối lượng:giá trị 2:40, 3:50, 5:100, 4:95 và sức chứa 8. Cận ở gốc bằng bao nhiêu?',
      answer: 175,
      hints: [
        'Sắp xếp theo giá trị trên khối lượng: 4:95, rồi 2:40 và 5:100 (cùng bằng 20), rồi 3:50.',
        'Lấy nguyên vật khi còn vừa, rồi lấy một phần của vật tiếp theo.',
      ],
      solution:
        'Lấy 4:95 và 2:40, được khối lượng 6 và giá trị 135. Còn trống 2, nên thêm 2/5 của 5:100, tức là 40. Cận là 135 + 40 = 175.',
    },
    {
      type: 'number',
      prompt: 'Với cùng các vật đó, giá trị lớn nhất thật sự xếp vừa túi là bao nhiêu?',
      answer: 150,
      hints: ['Nạp ví dụ “Bốn vật” và chạy tới bước cuối.'],
      solution:
        'Hai vật 5:100 và 3:50 nặng đúng 8, cho giá trị 150. Cận 175 là một ước lượng cao hơn thực tế, và cận được phép như vậy.',
    },
    {
      type: 'number',
      prompt: 'Các vật 6:60, 5:45, 5:45 và sức chứa 10. Cận ở gốc bằng bao nhiêu?',
      answer: 96,
      hints: ['Lấy nguyên 6:60, rồi xem phần nào của 5:45 còn vừa.'],
      solution:
        'Sau 6:60 còn trống 4, nên thêm 4/5 của 45, tức là 36. Cận là 60 + 36 = 96. Giá trị tối ưu là 90, từ hai vật 5:45, còn cách tham lam lấy nguyên vật chỉ dừng ở 60.',
    },
    {
      type: 'number',
      prompt: 'Nạp ví dụ “Thứ tự quan trọng” với “Tốt nhất trước”. Có bao nhiêu nút được tạo?',
      answer: 27,
      unit: 'nút',
      hints: ['Chạy tới bước cuối và đọc ô “Số nút đã tạo”.'],
      solution: 'Kiểu tốt nhất trước tạo 27 nút và mở rộng 13 nút, rồi dừng với giá trị tối ưu 87.',
    },
    {
      type: 'number',
      prompt: 'Cùng ví dụ đó với “Theo chiều sâu”. Có bao nhiêu nút được tạo?',
      answer: 71,
      unit: 'nút',
      hints: ['Đổi mục “Thứ tự tìm kiếm” và đọc ô “Số nút đã tạo”.'],
      solution:
        'Kiểu theo chiều sâu tạo 71 nút và mở rộng 35 nút. Nó tìm được cùng giá trị tối ưu 87, nhưng phải đào sâu vào những nhánh mà một giá trị tốt nhất cao hơn lẽ ra đã cắt tỉa.',
    },
    {
      type: 'choice',
      prompt: 'Một nút có cận 120 và giá trị tốt nhất hiện có là 120. Phép tìm kiếm nên làm gì?',
      options: [
        'Mở rộng nó, vì giá trị của nó vẫn có thể tăng.',
        'Cắt tỉa nó, vì không gì bên dưới nó vượt được 120.',
        'Đặt nó trở lại và thử sau.',
        'Thay giá trị tốt nhất bằng 120.',
      ],
      answer: 1,
      hints: ['Mục tiêu là vượt giá trị tốt nhất, không phải bằng nó.'],
      solution:
        'Mọi thứ bên dưới đều không quá 120, nên tốt lắm thì cũng chỉ bằng. Một đáp án tối ưu là đủ, nên cắt tỉa nó.',
    },
    {
      type: 'multi',
      prompt:
        'Những điều nào làm nên một cận tốt cho bài toán tìm giá trị lớn nhất? Chọn mọi phương án đúng.',
      options: [
        'Nó không bao giờ nhỏ hơn giá trị tốt nhất thật sự của cây con.',
        'Nó rẻ để tính.',
        'Nó gần với giá trị tốt nhất thật sự.',
        'Nó phải là giá trị mà một cách xếp thật đạt được.',
      ],
      answers: [0, 1, 2],
      hints: ['Cận phân số 175 không đạt được, vậy mà vẫn dùng tốt.'],
      solution:
        'Đúng đắn, rẻ và sát là những điều quan trọng. Cận không cần đạt được: cận phân số thường là không đạt được.',
    },
    {
      type: 'text',
      prompt: 'Trong kiểu tìm tốt nhất trước, cấu trúc dữ liệu nào giữ biên?',
      accept: [
        'hàng đợi ưu tiên',
        'một hàng đợi ưu tiên',
        'heap',
        'heap lớn nhất',
        'max-heap',
        'priority queue',
        'binary heap',
      ],
      hints: ['Nó phải trả lại nhanh nút có cận lớn nhất.'],
      solution:
        'Một hàng đợi ưu tiên (priority queue), thường là một heap nhị phân với khoá là cận.',
    },
  ],
  nextTeaser:
    'Bài sau là phần luyện tập: bài toán quay lui, nơi bạn tự tìm trạng thái và bước huỷ cho từng bài.',
};
