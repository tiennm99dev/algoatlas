/** @typedef {import('$lib/algo-engine/tree-traversals.js').TraversalFrame} TraversalFrame */
/** @typedef {import('$lib/algo-engine/tree-traversals.js').TraversalOrder} TraversalOrder */

/** @type {Record<TraversalOrder, string>} */
const ORDER_NAMES = {
  pre: 'Duyệt trước',
  in: 'Duyệt giữa',
  post: 'Duyệt sau',
  level: 'Duyệt theo tầng',
};

export const vi = {
  slug: 'tree-traversals',
  topic: 'trees',
  level: 'Cơ bản',
  title: 'Duyệt cây',
  intro:
    'Phép duyệt cây thăm mỗi nút đúng một lần. Duyệt trước (preorder) thăm một nút trước các cây con của nó, duyệt giữa (inorder) thăm nút ở giữa hai cây con, duyệt sau (postorder) thăm nút sau cùng; còn duyệt theo tầng (level order) quét cây lần lượt từng tầng. Cách nào cũng chạy trong O(n), và mỗi thứ tự trả lời những câu hỏi khác nhau.',
  summary:
    'Chạy từng bước duyệt trước, duyệt giữa, duyệt sau và duyệt theo tầng bằng một ngăn xếp hoặc hàng đợi tường minh, và xem mỗi nút nhận số thứ tự thăm của nó.',
  instruction:
    'Chọn một cách duyệt rồi chạy từng bước. Mỗi nút đã thăm được ghi số thứ tự ở góc. Sửa cây theo thứ tự mảng (dấu - cho ô trống) hoặc mở một mẫu, rồi đổi cách duyệt để so các con số trên cùng một cây.',
  orderLabel: 'Cách duyệt',
  orders: ORDER_NAMES,
  treeLabel: 'Cây (thứ tự mảng, - cho ô trống)',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Mở một mẫu…',
  presets: {
    letters: 'Chữ cái',
    expression: 'Biểu thức (a + b) × (c − d)',
    chain: 'Chuỗi lệch trái',
    perfect: 'Cây hoàn hảo, 15 nút',
  },
  treeErrors: {
    empty: 'Hãy nhập ít nhất là gốc.',
    count: 'Dùng tối đa 15 ô (bốn tầng).',
    format: 'Nhãn gồm 1 hoặc 2 chữ cái, chữ số hoặc phép toán; dùng - cho ô trống.',
    duplicate: 'Mỗi nhãn chỉ được xuất hiện một lần.',
    orphan: 'Nút nào cũng cần có cha: ô i treo dưới ô ⌊(i − 1) / 2⌋, nên ô đó phải có nút.',
  },
  treeTitle: 'Cây',
  /** @param {string[]} visited @param {number} total */
  treeAria: (visited, total) =>
    `Cây nhị phân gồm ${total} nút. Đã thăm: ${visited.length === 0 ? 'chưa có' : visited.join(', ')}.`,
  /** @param {string} label @param {number | null} n @param {string} state */
  nodeLabel: (label, n, state) =>
    [`Nút ${label}`, n === null ? 'chưa thăm' : `thăm thứ ${n}`, state].filter(Boolean).join(', '),
  states: { active: 'đang xét', frontier: 'đang chờ trong ngăn xếp hoặc hàng đợi' },
  markers: { active: '▶', frontier: '…' },
  legend: {
    active: 'Đang xét',
    frontier: 'Đang chờ trong ngăn xếp hoặc hàng đợi',
    visited: 'Đã thăm (số = thứ tự thăm)',
    idle: 'Chưa tới',
  },
  /** @param {TraversalOrder} order */
  workTitle: (order) =>
    order === 'level' ? 'Hàng đợi (đầu hàng → cuối hàng)' : 'Ngăn xếp (đáy → đỉnh)',
  /** @param {string} label @param {boolean} visit */
  workItem: (label, visit) => (visit ? `visit ${label}` : label),
  workLegend: {
    expand: 'expand: khám phá cây con này',
    visit: 'visit: xuất ra khi được lấy ra',
  },
  /** @param {TraversalOrder} order @param {string[]} items */
  workAria: (order, items) =>
    `${order === 'level' ? 'Hàng đợi, từ đầu đến cuối' : 'Ngăn xếp, từ đáy lên đỉnh'}: ${items.length === 0 ? 'rỗng' : items.join(', ')}.`,
  outputTitle: 'Đầu ra, theo thứ tự thăm',
  outputEmpty: 'chưa có gì',
  stats: {
    visited: 'Đã thăm',
    pushes: 'Số lần push',
    pops: 'Số lần pop',
    peak: 'Kích thước lớn nhất',
  },
  /** @param {number} a @param {number} b */
  ofTotal: (a, b) => `${a}/${b}`,
  allTitle: 'Cả bốn thứ tự trên cây này',
  allHidden: 'Chạy đến bước cuối để so cả bốn thứ tự.',
  recursiveTitle: 'Dạng đệ quy',
  /** @type {Record<TraversalOrder, string[]>} */
  recursive: {
    pre: ['pre(node):', '  if node rỗng: return', '  output(node)', '  pre(left); pre(right)'],
    in: ['in(node):', '  if node rỗng: return', '  in(left)', '  output(node); in(right)'],
    post: ['post(node):', '  if node rỗng: return', '  post(left); post(right)', '  output(node)'],
    level: [
      'Duyệt theo tầng không có dạng đệ quy ngắn gọn:',
      'hàng đợi giữ đúng thứ tự từng tầng,',
      'điều mà ngăn xếp lời gọi không làm được.',
    ],
  },
  /** @param {TraversalFrame} f @param {(string | null)[]} slots */
  describe(f, slots) {
    const at = f.current >= 0 ? String(slots[f.current]) : '';
    const L = 2 * f.current + 1;
    const R = 2 * f.current + 2;
    const kid = (/** @type {number} */ i) => (slots[i] ? String(slots[i]) : null);
    const kids = [kid(L), kid(R)].filter(Boolean);
    switch (f.kind) {
      case 'start':
        return f.order === 'level'
          ? `${ORDER_NAMES.level}: đưa gốc ${slots[0]} vào hàng đợi.`
          : `${ORDER_NAMES[f.order]}: đẩy “expand ${slots[0]}”, tức cả cây, vào ngăn xếp.`;
      case 'expand': {
        const parts = {
          pre: `thăm ${at} trước, rồi cây con trái, rồi cây con phải`,
          in: `cây con trái trước, rồi thăm ${at}, rồi cây con phải`,
          post: `cây con trái, rồi cây con phải, và thăm ${at} sau cùng`,
        }[/** @type {'pre'|'in'|'post'} */ (f.order)];
        return `Lấy “expand ${at}” ra. Đẩy các phần của nó vào theo thứ tự ngược để khi lấy ra sẽ là: ${parts}.${kids.length === 0 ? ` ${at} không có con, nên chỉ đẩy “visit ${at}”.` : ''}`;
      }
      case 'visit':
        return f.order === 'level'
          ? `Lấy ${at} ra khỏi hàng đợi và xuất nó: lượt thăm thứ ${f.output.length}.`
          : `Lấy “visit ${at}” ra và xuất nó: lượt thăm thứ ${f.output.length}.`;
      case 'enqueue':
        return `Đưa các con của ${at} (${kids.join(', ')}) vào cuối hàng, để tầng sau chờ phía sau tầng này.`;
      case 'done':
        return `Xong: thứ tự ${ORDER_NAMES[f.order].toLowerCase()} là ${f.output.map((i) => slots[i]).join(' ')}. Mỗi nút được thăm đúng một lần.`;
    }
  },
  takeaways: [
    'Duyệt trước (nút, trái, phải) sao chép hoặc in một cây từ trên xuống. Duyệt giữa (trái, nút, phải) liệt kê cây nhị phân tìm kiếm theo thứ tự tăng dần. Duyệt sau (trái, phải, nút) làm xong các con trước, nên hợp để xoá một cây hoặc tính kích thước và chiều cao.',
    'Trên cây biểu thức, duyệt trước cho kí pháp tiền tố, duyệt giữa cho kí pháp trung tố quen thuộc (không có ngoặc), còn duyệt sau cho kí pháp hậu tố mà máy tính dùng ngăn xếp tính được.',
    'Đệ quy ghi nhớ vị trí đang làm trên ngăn xếp lời gọi. Một ngăn xếp tường minh làm đúng việc ấy: đẩy các phần của một nút vào theo thứ tự ngược thì chúng được lấy ra theo đúng thứ tự. Giữa ba cách duyệt theo chiều sâu, chỉ có vị trí của “visit node” là khác nhau.',
    'Duyệt theo tầng thay ngăn xếp bằng hàng đợi: vào trước, ra trước nên các tầng giữ đúng thứ tự. Đó chính là duyệt theo chiều rộng (BFS) trên cây.',
    'Thử chuỗi lệch trái: ngăn xếp lớn dần theo chiều cao, còn hàng đợi không bao giờ chứa quá một nút. Trên cây hoàn hảo, hàng đợi lớn tới cỡ tầng rộng nhất, tức 8.',
  ],
  complexityHead: ['Cách duyệt', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Cả bốn cách, thời gian', 'O(n)', 'Mỗi nút được đẩy vào và lấy ra một số lần không đổi.'],
    [
      'Trước, giữa, sau: bộ nhớ',
      'O(h)',
      'Ngăn xếp chỉ chứa vài phần tử cho mỗi tầng trên đường đi hiện tại.',
    ],
    [
      'Theo tầng: bộ nhớ',
      'O(w)',
      'Hàng đợi chứa nhiều nhất khoảng một tầng, tới w = n / 2 trên cây hoàn hảo.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt:
        'Mở mẫu “Chữ cái” (A; B và C ở dưới A; D và E dưới B; F là con phải của C). Gõ thứ tự duyệt sau của cây, các chữ cách nhau bằng dấu cách.',
      accept: ['D E B F C A', 'DEBFCA', 'D, E, B, F, C, A'],
      hints: [
        'Cây con trái, cây con phải, rồi mới đến nút.',
        'Chọn Duyệt sau rồi chạy đến bước cuối.',
      ],
      solution:
        'Duyệt sau cây con của B cho D E B, cây con của C cho F C, và A đứng cuối: D E B F C A.',
    },
    {
      type: 'choice',
      prompt: 'Cách duyệt nào trên cây nhị phân tìm kiếm liệt kê các khoá theo thứ tự tăng dần?',
      options: ['Duyệt trước', 'Duyệt giữa', 'Duyệt sau', 'Duyệt theo tầng'],
      answer: 1,
      hints: ['Mọi khoá nhỏ hơn nằm ở cây con trái, mọi khoá lớn hơn nằm ở cây con phải.'],
      solution:
        'Duyệt giữa thăm hết cây con trái (mọi khoá nhỏ hơn), rồi đến nút, rồi cây con phải (mọi khoá lớn hơn), nên các khoá ra theo thứ tự đã sắp xếp.',
    },
    {
      type: 'order',
      prompt:
        'Xếp cây biểu thức (a + b) × (c − d) theo thứ tự duyệt sau, đúng thứ tự mà máy tính dùng ngăn xếp tính nó.',
      items: ['×', 'a', '+', 'b', 'c', '−', 'd'],
      answer: [1, 3, 2, 4, 6, 5, 0],
      hints: ['Mở mẫu Biểu thức và chọn Duyệt sau.'],
      solution:
        'Thứ tự duyệt sau là a b + c d − ×: cả hai toán hạng đứng trước phép toán của chúng, nên máy tính dùng ngăn xếp có thể đẩy a và b vào, thực hiện +, và cứ thế tiếp tục.',
    },
  ],
  nextTeaser:
    'Bài sau, Cây nhị phân tìm kiếm, dùng chính thứ tự duyệt giữa để giữ các khoá luôn được sắp xếp.',
};
