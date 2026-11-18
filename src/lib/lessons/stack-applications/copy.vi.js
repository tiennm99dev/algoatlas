/** @typedef {import('$lib/algo-engine/stack-applications.js').AppFrame} AppFrame */

import { formatNumber } from '$lib/algo-engine/stack-applications.js';

/** @param {AppFrame} f */
const top = (f) => f.stack[f.stack.length - 1];
/** @param {AppFrame} f */
const tok = (f) => f.tokens[f.pos];
/** Character position, counted from 1 for people. @param {AppFrame} f */
const At = (f) => `Kí tự thứ ${f.pos + 1}`;

const PAIR = /** @type {Record<string, string>} */ ({ ')': '(', ']': '[', '}': '{' });

export const vi = {
  slug: 'stack-applications',
  topic: 'stacks-queues',
  level: 'Trung bình',
  title: 'Ứng dụng của stack',
  intro:
    'Hễ việc dở dang gần nhất phải xong trước, stack (ngăn xếp) là lựa chọn hợp. Bộ kiểm tra dấu ngoặc push mọi dấu ngoặc mở và pop nó khi gặp dấu đóng tương ứng; máy tính biểu thức hậu tố (postfix) push các số và để mỗi toán tử pop hai toán hạng của nó; còn chính call stack (ngăn xếp lời gọi) của máy tính push một khung cho mỗi lần gọi hàm và pop nó khi hàm trả về.',
  summary:
    'Kiểm tra dấu ngoặc, tính biểu thức hậu tố và theo dõi call stack của hàm đệ quy, mỗi lần một push hoặc một pop.',
  instruction:
    'Chọn một việc, tự nhập dãy ngoặc, biểu thức hậu tố hoặc n, rồi chạy từng bước. Theo dõi stack bên cạnh đầu vào: thử mẫu “Bắt chéo” để thấy một dấu đóng gặp nhầm dấu mở, và mẫu “Dài hơn” để thấy mỗi toán tử pop hai giá trị và push lại một.',
  modeLabel: 'Việc cần làm',
  modes: {
    brackets: 'Kiểm tra dấu ngoặc',
    postfix: 'Tính biểu thức hậu tố',
    calls: 'Call stack',
  },
  bracketsLabel: 'Xâu có dấu ngoặc',
  postfixLabel: 'Biểu thức hậu tố',
  nLabel: 'n cho fact(n)',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presetNames: {
    nested: 'Lồng nhau',
    code: 'Giống mã lệnh',
    crossed: 'Bắt chéo',
    open: 'Còn mở',
    extra: 'Thừa dấu đóng',
    simple: 'Đơn giản',
    longer: 'Dài hơn',
    divide: 'Phép chia',
    missing: 'Thiếu toán hạng',
    leftover: 'Thừa giá trị',
  },
  inputTitle: 'Đầu vào, đọc từ trái sang phải',
  stackTitle: 'Stack',
  callTitle: 'Call stack (đỉnh = lời gọi đang chạy)',
  /** @param {string[]} tokens @param {number} pos */
  inputLabel: (tokens, pos) =>
    `Đầu vào ${tokens.join(' ')}${pos >= 0 ? `, đang đọc kí hiệu thứ ${pos + 1}: ${tokens[pos]}` : ''}.`,
  stats: {
    pushes: 'Số lần push',
    pops: 'Số lần pop',
    depth: 'Stack cao nhất',
    verdict: 'Kết quả',
  },
  verdicts: {
    running: '…',
    balanced: 'cân đối',
    unbalanced: 'không cân đối',
    error: 'lỗi',
  },
  bracketErrors: { count: 'Chỉ dùng tối đa 24 kí tự.' },
  postfixErrors: {
    empty: 'Hãy nhập một biểu thức, ví dụ 3 4 + 2 *.',
    format: 'Chỉ dùng số nguyên và + − × ÷ (hoặc - * /), cách nhau bằng dấu cách.',
    range: 'Các số phải từ 0 đến 99.',
    count: 'Chỉ dùng tối đa 15 kí hiệu.',
  },
  nError: 'n phải là số nguyên từ 1 đến 8.',
  states: { active: 'đang đọc', visited: 'đã đọc', swap: 'lỗi ở đây' },
  markers: { active: '▸', swap: '×' },
  legend: {
    active: 'Đang đọc',
    visited: 'Đã đọc',
    swap: 'Phát hiện lỗi ở đây',
    pushed: 'Vừa push (+)',
  },
  /** @param {AppFrame} f */
  verdict(f) {
    if (f.ok === null) return vi.verdicts.running;
    if (f.mode === 'brackets') return f.ok ? vi.verdicts.balanced : vi.verdicts.unbalanced;
    if (f.mode === 'calls') return `fact = ${f.value}`;
    return f.ok ? formatNumber(/** @type {number} */ (f.value)) : vi.verdicts.error;
  },
  /** @param {AppFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return f.mode === 'brackets'
          ? 'Stack ban đầu rỗng. Đọc xâu từ trái sang phải.'
          : f.mode === 'postfix'
            ? 'Stack ban đầu rỗng. Đọc các kí hiệu từ trái sang phải.'
            : 'Chương trình gọi fact. Mỗi lời gọi có một khung riêng trên call stack.';
      case 'skip':
        return `${At(f)} là “${tok(f)}”, không phải dấu ngoặc: bỏ qua.`;
      case 'push':
        return `${At(f)} là ${tok(f)}, một dấu ngoặc mở: push nó. Nó chờ dấu đóng tương ứng.`;
      case 'match':
        return `${At(f)} là ${tok(f)}, còn đỉnh là ${PAIR[tok(f)]}: hai dấu khớp nhau, nên pop.`;
      case 'mismatch':
        return `${At(f)} là ${tok(f)}, nhưng đỉnh là ${top(f)}: nó không đóng được dấu mở gần nhất. Không cân đối.`;
      case 'close-empty':
        return `${At(f)} là ${tok(f)}, nhưng stack đang rỗng: không có dấu mở nào chờ nó. Không cân đối.`;
      case 'leftover':
        return f.mode === 'brackets'
          ? `Xâu đã hết mà còn ${f.stack.length} dấu mở chưa bao giờ được đóng: ${f.stack.join(' ')}. Không cân đối.`
          : `Hết kí hiệu mà stack còn ${f.stack.length} giá trị, không phải một: thiếu một toán tử.`;
      case 'balanced':
        return 'Xâu đã hết và stack rỗng: mọi dấu ngoặc đều được đóng bằng dấu tương ứng. Cân đối.';
      case 'push-number':
        return `${tok(f)} là một số: push nó.`;
      case 'pop-operands':
        return `${tok(f)} là một toán tử: pop b = ${f.popped[0]}, rồi a = ${f.popped[1]}.`;
      case 'apply':
        return `Push a ${tok(f)} b = ${top(f)}. Một giá trị thay cho hai.`;
      case 'too-few':
        return `${tok(f)} cần hai giá trị, nhưng stack chỉ có ${f.stack.length}. Biểu thức không phải biểu thức hậu tố hợp lệ.`;
      case 'div-zero':
        return `${tok(f)} sẽ chia cho 0. Biểu thức không có giá trị.`;
      case 'result':
        return `Đã đọc hết các kí hiệu và còn đúng một giá trị: đáp số là ${top(f)}.`;
      case 'call': {
        const n = f.stack.length;
        const k = Number(top(f).slice(5, -1));
        if (n > 1)
          return `${f.stack[n - 2]} tạm dừng ở “n × fact(n − 1)” và gọi ${top(f)}: push một khung mới lên đỉnh.`;
        return k === 1
          ? 'Gọi fact(1): push khung của nó.'
          : `Gọi ${top(f)}: push khung của nó. Nó chưa trả lời được cho đến khi fact(${k - 1}) trả về.`;
      }
      case 'base':
        return 'fact(1) gặp trường hợp cơ sở: trả về 1 và pop khung của nó. Quyền điều khiển quay về khung bên dưới.';
      case 'return': {
        const k = Number(f.popped[0].slice(5, -1));
        return `${f.popped[0]} chạy tiếp: ${k} × ${formatNumber(/** @type {number} */ (f.value) / k)} = ${f.value}. Trả về giá trị đó và pop khung.`;
      }
      case 'done':
        return f.mode === 'calls'
          ? `Xong. Call stack lại rỗng và fact = ${f.value}. Nó từng sâu ${f.maxDepth} khung.`
          : `Xong. ${f.pushes} lần push, ${f.pops} lần pop, cùng lúc có nhiều nhất ${f.maxDepth} phần tử trên stack.`;
    }
  },
  takeaways: [
    'Dãy ngoặc cân đối khi mỗi dấu đóng khớp với dấu mở gần nhất còn đang mở và cuối cùng không còn dấu nào mở: push dấu mở, pop khi gặp dấu đóng khớp với nó.',
    'Kiểm tra dấu ngoặc thất bại theo ba cách: dấu đóng gặp nhầm dấu mở, dấu đóng thấy stack rỗng, hoặc cuối cùng vẫn còn dấu mở.',
    'Biểu thức hậu tố đặt toán tử sau các toán hạng, nên không cần dấu ngoặc hay quy tắc thứ tự phép tính: push các số, còn mỗi toán tử pop b rồi a và push a op b.',
    'Mỗi lần gọi hàm push một khung chứa n riêng của lời gọi đó; mỗi lần trả về thì pop khung. Đệ quy quá sâu sẽ hết chỗ trên stack: tràn stack.',
    'Nhập “(a[b)]” và tìm đúng kí tự làm nó thất bại, rồi tính “2 3 4 * +” và “2 3 + 4 *” để so sánh.',
  ],
  complexityHead: ['Việc', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Kiểm tra dấu ngoặc, n kí tự', 'O(n)', 'Mỗi kí tự một lần push hoặc pop.'],
    [
      'Tính biểu thức hậu tố, n kí hiệu',
      'O(n)',
      'Mỗi số một lần push; mỗi toán tử hai lần pop và một lần push.',
    ],
    ['Call stack của fact(n)', 'O(n)', 'Push n khung, mỗi khung pop một lần.'],
    ['Bộ nhớ thêm', 'O(n)', 'Stack có thể cùng lúc chứa mọi dấu mở, mọi số hay mọi khung.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Tính giá trị biểu thức hậu tố 6 2 3 + ×.',
      answer: 30,
      hints: ['Push 6, 2, 3. Dấu + pop 3 và 2.', 'Sau đó × pop 5 và 6.'],
      solution:
        'Push 6, 2 và 3. + pop b = 3, a = 2 rồi push 5. × pop b = 5, a = 6 rồi push 30. Còn lại một giá trị: 30.',
    },
    {
      type: 'multi',
      prompt: 'Những xâu nào cân đối?',
      options: ['{[()]}', '([)]', '(()', '()[]{}'],
      answers: [0, 3],
      hints: ['Mỗi dấu đóng phải khớp với dấu mở gần nhất còn đang mở.'],
      solution:
        '{[()]} và ()[]{} đóng mọi dấu mở theo đúng thứ tự. Trong ([)] thì ) gặp [ ở đỉnh; trong (() có một dấu ( không bao giờ được đóng.',
    },
    {
      type: 'number',
      prompt:
        'Kiểm tra (([]){}) bằng bộ kiểm tra dấu ngoặc. Cùng lúc stack chứa nhiều nhất bao nhiêu dấu mở?',
      answer: 3,
      unit: 'dấu mở',
      hints: ['Theo dõi chiều cao stack sau mỗi kí tự.'],
      solution: 'Chiều cao sau từng kí tự: 1, 2, 3, 2, 1, 2, 1, 0. Nhiều nhất là 3, sau ( ( [.',
    },
    {
      type: 'order',
      prompt: 'Sắp xếp các kí hiệu để viết (2 + 3) × 4 dưới dạng hậu tố.',
      items: ['×', '2', '+', '4', '3'],
      answer: [1, 4, 2, 3, 0],
      hints: [
        'Trong biểu thức hậu tố, toán tử đứng ngay sau hai toán hạng của nó.',
        'Tổng được tính trước.',
      ],
      solution: '2 3 + 4 ×: dấu + đứng sau hai toán hạng 2 và 3, rồi push 4 và × nhân tổng với 4.',
    },
    {
      type: 'number',
      prompt: 'Khi fact(5) chạy, call stack lúc sâu nhất có bao nhiêu khung?',
      answer: 5,
      unit: 'khung',
      hints: ['fact(5) gọi fact(4), fact(4) gọi fact(3), cứ thế tiếp tục.'],
      solution:
        'fact(5), fact(4), fact(3), fact(2) và fact(1) cùng chờ một lúc trước khi fact(1) trả về: 5 khung.',
    },
  ],
  nextTeaser:
    'Bài sau, Stack đơn điệu và queue đơn điệu, giữ stack luôn tăng hoặc luôn giảm để tìm phần tử lớn hơn kế tiếp trong O(n).',
};
