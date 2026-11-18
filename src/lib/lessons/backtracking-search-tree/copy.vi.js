/** @typedef {import('$lib/algo-engine/backtracking-search-tree.js').SearchFrame} SearchFrame */
/** @typedef {import('$lib/algo-engine/backtracking-search-tree.js').SearchNode} SearchNode */

export const vi = {
  slug: 'backtracking-search-tree',
  topic: 'backtracking',
  level: 'Cơ bản',
  title: 'Quay lui và cây tìm kiếm',
  intro:
    'Quay lui (backtracking) giải bài toán bằng cách chọn từng bước một, đi theo lựa chọn đó xa nhất có thể, rồi huỷ nó để thử lựa chọn tiếp theo. Mọi lựa chọn có thể tạo thành một cây, gọi là cây không gian trạng thái, và việc tìm kiếm là một lượt DFS (duyệt theo chiều sâu) trên cây đó. Cắt tỉa (pruning) là thứ làm cho cách này dùng được trong thực tế: hễ một nhánh chắc chắn không dẫn tới đáp án, cả cây con bên dưới nó bị bỏ qua.',
  summary:
    'Xem cây không gian trạng thái lớn dần khi bài tìm tổng tập con chọn, khám phá rồi bỏ chọn, và xem phép cắt tỉa cắt cụt cả những nhánh lớn.',
  instruction:
    'Chạy từng bước ví dụ và xem cây lớn dần, rồi đổi mục “Cắt tỉa” và so sánh ô “Số nút đã thăm”. Nhập dãy số và tổng cần đạt của em, hoặc bấm (hay nhấn Enter) vào một nút trên cây để nhảy tới lúc nút đó được thăm.',
  /** @param {number} target */
  problem: (target) =>
    `Tìm mọi tập con của các số dương này có tổng bằng ${target}. Mỗi tầng của cây quyết định một số: lấy nó (bên trái), hoặc bỏ nó (bên phải).`,
  pruneLabel: 'Cắt tỉa',
  prunes: { off: 'Tắt', over: 'Quá lớn', both: 'Quá lớn hoặc quá nhỏ' },
  numbersLabel: 'Các số',
  targetLabel: 'Tổng cần đạt',
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    two: 'Hai đáp án',
    big: 'Số lớn đứng trước',
    all: 'Cần dùng mọi số',
    none: 'Không có đáp án',
  },
  /** @param {number} maxN @param {number} maxV */
  numbersError: (maxN, maxV) => `Hãy nhập từ 1 đến ${maxN} số nguyên, mỗi số từ 1 đến ${maxV}.`,
  /** @param {number} max */
  targetError: (max) => `Tổng cần đạt phải là số nguyên từ 1 đến ${max}.`,
  treeTitle: 'Cây không gian trạng thái',
  treeNote:
    'Mỗi vòng tròn ghi tổng các số đã chọn tới lúc đó. Cạnh cho biết đã cộng thêm gì: +3 là đã lấy số 3, +0 là đã bỏ số đó.',
  treeAria: 'Cây không gian trạng thái của phép tìm kiếm, được dựng dần khi chạy.',
  /** @param {SearchNode} n */
  nodeLabel: (n) => {
    const state = {
      active: 'đang thăm',
      open: 'nằm trên đường đi hiện tại',
      finished: 'đã khám phá hết',
      pruned: 'đã cắt tỉa',
      found: 'là một đáp án',
      dead: 'là ngõ cụt',
    }[n.status];
    return `Nút ở độ sâu ${n.depth}, tổng ${n.sum}, ${state}.`;
  },
  markers: { found: '★', pruned: '✂', dead: '×' },
  legend: {
    active: 'Đang thăm',
    open: 'Nằm trên đường đi hiện tại',
    finished: 'Đã khám phá hết, × là ngõ cụt',
    found: 'Một đáp án',
    pruned: 'Đã cắt tỉa: không nút nào bên dưới được thăm',
  },
  numbersTitle: 'Các số',
  numbersAria: 'Các số. Số đã chọn được đánh dấu.',
  /** @param {number} i @param {number} v @param {boolean} on */
  numberCell: (i, v, on) => `Số ${v} ở chỉ số ${i}${on ? ', đã chọn' : ''}`,
  chosenMark: '✓',
  pointer: 'i',
  stats: {
    visited: 'Số nút đã thăm',
    pruned: 'Đã cắt tỉa',
    sum: 'Tổng hiện tại',
    solutions: 'Số đáp án tìm được',
  },
  chosenTitle: 'Đang chọn',
  chosenEmpty: 'Chưa chọn số nào.',
  solutionsTitle: 'Các đáp án',
  solutionsEmpty: 'Chưa có.',
  /** @param {number[]} s */
  solution: (s) => `{${s.join(', ')}}`,
  /** @param {SearchFrame} f */
  describe(f) {
    const v = f.values[f.depth];
    switch (f.kind) {
      case 'start':
        return `Bắt đầu ở gốc, chưa chọn gì. Mục tiêu: các tập con của ${f.values.length} số này có tổng bằng ${f.target}.`;
      case 'choose':
        return `Chọn ${v} và khám phá nhánh đó. Tổng giờ là ${f.sum}.`;
      case 'undo':
        return `Quay về từ nhánh đã lấy ${v}. Bỏ chọn nó, để trạng thái trở lại như trước: tổng ${f.sum}.`;
      case 'skip':
        return `Khám phá nhánh còn lại: bỏ ${v}. Tổng vẫn là ${f.sum}.`;
      case 'over':
        return `Cắt tỉa: tổng ${f.sum} đã vượt ${f.target}, mà mọi số đều dương, nên không nút nào bên dưới nút này thành công được. Quay lui.`;
      case 'short':
        return `Cắt tỉa: tổng ${f.sum} cộng mọi số còn lại, ${f.rest}, cũng chỉ được ${f.sum + f.rest}, nhỏ hơn ${f.target}. Không nút nào bên dưới nút này thành công được. Quay lui.`;
      case 'found':
        return `Mọi số đã được quyết định và tổng bằng ${f.target}. Ghi lại {${f.chosen.map((at) => f.values[at]).join(', ')}}, rồi quay lui để tìm thêm.`;
      case 'dead':
        return `Mọi số đã được quyết định, nhưng tổng là ${f.sum}, không phải ${f.target}. Ngõ cụt: quay lui.`;
      case 'done': {
        const found = f.solutions.length
          ? `Tìm được ${f.solutions.length} đáp án`
          : 'Không có tập con nào có tổng bằng tổng cần đạt';
        return `${found}, sau khi thăm ${f.visited} nút và cắt tỉa ${f.pruned} nút.`;
      }
    }
  },
  takeaways: [
    'Phép tìm kiếm quay lui nào cũng có cùng ba thao tác: chọn một phương án, khám phá mọi thứ theo sau nó, rồi bỏ chọn để phương án tiếp theo bắt đầu từ một trạng thái sạch.',
    'Cây không gian trạng thái có một nút cho mỗi lời giải dở dang. Phép tìm kiếm là một lượt DFS trên cây, nên nó chỉ lưu đường đi hiện tại, không lưu cả cây.',
    'Một phép cắt tỉa là một phép thử chứng minh được rằng bên dưới một nút không có đáp án nào. Bỏ qua một nút là bỏ qua mọi thứ bên dưới nó, vì thế một phép thử sớm có thể tiết kiệm hơn nhiều so với một phép thử muộn.',
    'Phép cắt tỉa không bao giờ được vứt bỏ một đáp án. “Tổng vượt quá tổng cần đạt” chỉ an toàn ở đây vì mọi số đều dương: nếu có số âm, một tổng quá lớn vẫn có thể giảm xuống lại.',
    'Nạp ví dụ “Cần dùng mọi số” và lần lượt đặt “Cắt tỉa” là Tắt, rồi Quá lớn, rồi Quá lớn hoặc quá nhỏ. Số nút đã thăm giữ ở 63, vẫn ở 63, rồi giảm còn 11. Phép thử nào đã làm việc, và vì sao?',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Thời gian, không cắt tỉa', 'O(2ⁿ)', 'Cây đầy đủ có 2ⁿ⁺¹ − 1 nút, mỗi nút tốn O(1).'],
    [
      'Thời gian, có cắt tỉa',
      'Xấu nhất O(2ⁿ)',
      'Cắt tỉa cắt được rất nhiều với nhiều đầu vào, nhưng có đầu vào cắt được ít, nên chặn trên trong trường hợp xấu nhất vẫn giữ nguyên.',
    ],
    ['Bộ nhớ', 'O(n)', 'Chỉ giữ đường đi hiện tại: nhiều nhất n khung gọi hàm và n số đã chọn.'],
    [
      'Ghi lại một đáp án',
      'O(n) mỗi lần',
      'Chép danh sách đã chọn. Phải là một bản sao, vì danh sách đó cứ thay đổi mãi.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Các số 3, 5, 2, 4 và tổng cần đạt 7, với “Cắt tỉa” là Tắt. Có bao nhiêu nút được thăm?',
      answer: 31,
      unit: 'nút',
      hints: ['Bốn số, mỗi số có hai phương án: một cây nhị phân đầy đủ có bao nhiêu nút?'],
      solution:
        'Các tầng có 1, 2, 4, 8 và 16 nút, nên có 2⁵ − 1 = 31 nút. Không cắt tỉa thì nút nào cũng được thăm, dù tổng cần đạt là bao nhiêu.',
    },
    {
      type: 'number',
      prompt: 'Cùng đầu vào đó, với “Cắt tỉa” là Quá lớn. Giờ có bao nhiêu nút được thăm?',
      answer: 25,
      unit: 'nút',
      hints: [
        'Chạy thử trong hình minh hoạ.',
        'Lựa chọn sớm nào vượt quá 7 đầu tiên? Bên dưới nó có bao nhiêu nút trong cây đầy đủ?',
      ],
      solution:
        'Có bốn nút vượt quá 7: 3 + 5 = 8 ở trên cao, và ba lá ({3, 2, 4}, {5, 2, 4}, {5, 4}). Chỉ nút đầu tiên tiết kiệm được gì đó, là 6 nút bên dưới nó, nên còn 31 − 6 = 25.',
    },
    {
      type: 'number',
      prompt: 'Cùng đầu vào đó, với Quá lớn hoặc quá nhỏ. Có bao nhiêu nút được thăm?',
      answer: 19,
      unit: 'nút',
      hints: ['Chạy thử trong hình minh hoạ và đọc ô “Số nút đã thăm” ở bước cuối.'],
      solution:
        'Phép thử thứ hai cắt các nhánh mà tổng không thể lên tới 7 với những số còn lại. Chẳng hạn, bỏ cả 3 lẫn 5 thì chỉ còn 2 + 4 = 6, nên nhánh đó bị loại ngay. Nhờ vậy 25 giảm còn 19.',
    },
    {
      type: 'number',
      prompt:
        'Nạp ví dụ “Số lớn đứng trước”, với các số 8, 7, 6, 5, 4 và tổng cần đạt 9. Khi bật Quá lớn hoặc quá nhỏ, có bao nhiêu nút được thăm?',
      answer: 29,
      unit: 'nút',
      hints: ['Cây đầy đủ có 63 nút.', 'Đọc ô “Số nút đã thăm” ở bước cuối.'],
      solution:
        'Mỗi cặp số lớn đã vượt 9 ngay, nên phần lớn cây bị loại. Phép tìm kiếm thăm 29 trong 63 nút và tìm được một đáp án, {5, 4}.',
    },
    {
      type: 'order',
      prompt: 'Xếp các thao tác trong một bước của phép tìm kiếm quay lui theo đúng thứ tự.',
      items: [
        'Bỏ lựa chọn, khôi phục trạng thái',
        'Gọi đệ quy cho phần còn lại',
        'Thêm một phương án vào các lựa chọn hiện tại',
      ],
      answer: [2, 1, 0],
      hints: ['Ba thao tác là chọn, khám phá, bỏ chọn.'],
      solution:
        'Chọn (thêm vào), khám phá (gọi đệ quy), bỏ chọn (gỡ ra). Bước cuối giúp phương án tiếp theo bắt đầu từ đúng trạng thái cũ.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao phép tìm kiếm ghi lại một bản sao của danh sách đã chọn chứ không ghi chính danh sách đó?',
      options: [
        'Bản sao lưu nhanh hơn.',
        'Danh sách thay đổi trong lúc tìm kiếm và rốt cuộc sẽ rỗng.',
        'Mỗi đáp án phải được sắp xếp trước.',
        'Đệ quy không trả về được danh sách.',
      ],
      answer: 1,
      hints: ['Mỗi bước bỏ chọn làm gì với danh sách?'],
      solution:
        'Chỉ có một danh sách, và mỗi lần bỏ chọn lại lấy một phần tử ra khỏi nó. Nếu chỉ lưu tham chiếu thì đáp án đã lưu đổi theo, và tới cuối mọi đáp án đều thành rỗng.',
    },
    {
      type: 'multi',
      prompt: 'Giả sử các số có thể âm. Những phép thử nào vẫn an toàn? Chọn mọi phương án đúng.',
      options: [
        'Dừng nếu tổng vượt quá tổng cần đạt',
        'Ở một lá, ghi lại các lựa chọn nếu tổng bằng tổng cần đạt',
        'Dừng nếu tổng vượt quá tổng cần đạt và không còn số âm nào phía sau',
      ],
      answers: [1, 2],
      hints: ['Một tổng lớn hơn tổng cần đạt có thể giảm xuống lại không?'],
      solution:
        'Phép thử thứ nhất giờ không an toàn: tổng 5 mà còn −3 ở phía sau thì giảm xuống 2. Phép thử ở lá thì luôn đúng. Phép thử thứ ba an toàn, vì không còn số âm thì tổng chỉ có thể tăng.',
    },
    {
      type: 'text',
      prompt: 'Phép tìm kiếm tốn thêm bao nhiêu bộ nhớ, không tính các đáp án nó ghi lại?',
      accept: ['O(n)', 'n', 'Θ(n)', 'tuyến tính', 'linear'],
      hints: ['Phép tìm kiếm chỉ giữ đường đi hiện tại. Đường đi đó dài tối đa bao nhiêu?'],
      solution:
        'Đường đi có nhiều nhất n tầng, nên tốn O(n): mỗi tầng một khung gọi hàm và một lựa chọn.',
    },
  ],
  nextTeaser: 'Bài sau dùng cùng ba thao tác đó để sinh mọi cấu hình: hoán vị, tổ hợp và tập con.',
};
