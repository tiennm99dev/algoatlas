/** @typedef {import('$lib/algo-engine/lazy-propagation.js').LazyFrame} LazyFrame */
/** @typedef {import('$lib/algo-engine/lazy-propagation.js').LazyOp} LazyOp */

/** A signed number with a Unicode minus. @param {number} x */
const show = (x) => (x < 0 ? `−${-x}` : String(x));

/** An increment with its sign always shown. @param {number} x */
const plusMinus = (x) => (x < 0 ? `−${-x}` : `+${x}`);

/** @param {number} lo @param {number} hi */
const range = (lo, hi) => `[${lo}, ${hi}]`;

export const vi = {
  slug: 'lazy-propagation',
  topic: 'range-queries',
  level: 'Nâng cao',
  title: 'Cập nhật lười',
  intro:
    'Cây phân đoạn (segment tree) thông thường chỉ đổi từng giá trị một, nên cộng vào cả một đoạn có thể chạm tới 2n − 1 nút. Cập nhật lười (lazy propagation) dừng lại ở các nút nằm trọn trong đoạn và để lại một nhãn ghi “các con của nút này vẫn còn nợ lượng này”. Nhãn chỉ đi xuống khi một thao tác sau cần đi sâu hơn nút đó, nên cả cập nhật đoạn lẫn truy vấn đoạn đều tốn O(log n).',
  summary:
    'Cộng vào cả một đoạn trong O(log n) bằng cách để lại nhãn chờ trên cây phân đoạn, và xem nhãn chỉ được đẩy xuống khi một truy vấn cần đi sâu hơn.',
  instruction:
    'Chọn một đoạn bằng cách bấm hai ô hoặc gõ l và r, rồi bấm Cộng x vào đoạn hoặc Truy vấn tổng và chạy từng bước. Con số ở góc một nút là nhãn chờ của nó. So mảng thật với các lá: chúng lệch nhau dần cho tới khi một truy vấn đẩy nhãn xuống.',
  valuesLabel: 'Giá trị',
  lLabel: 'Từ l',
  rLabel: 'Đến r',
  xLabel: 'Cộng x',
  queryButton: 'Truy vấn tổng',
  addButton: 'Cộng x vào đoạn',
  undo: 'Hoàn tác',
  reset: 'Làm lại',
  valueErrors: {
    format: 'Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 3, −1, 4.',
    range: 'Mỗi giá trị phải nằm trong khoảng từ −99 đến 99.',
    count: 'Hãy gõ từ 1 đến 12 giá trị.',
  },
  /** @param {number} n */
  rangeError: (n) => `l và r phải là số nguyên với 0 ≤ l ≤ r ≤ ${n - 1}.`,
  xError: 'x phải là số nguyên từ −99 đến 99.',
  logFull: 'Nhật kí đã đầy (8 thao tác). Hãy hoàn tác hoặc làm lại để tiếp tục.',
  pickHint: 'Bấm một ô để bắt đầu đoạn, rồi bấm ô khác để kết thúc. Phím Enter cũng dùng được.',
  /** @param {number} i */
  pickFirst: (i) => `Đoạn bắt đầu ở ${i}. Hãy chọn ô kết thúc đoạn.`,
  /** @param {number} l @param {number} r */
  picked: (l, r) => `Đã chọn đoạn ${range(l, r)}. Giờ hãy bấm Truy vấn tổng hoặc Cộng x vào đoạn.`,
  treeScroller: 'Hình vẽ cây, cuộn ngang được',
  treeTitle: 'Cây phân đoạn: tổng ở trong nút, đoạn ở dưới, nhãn chờ ở góc',
  /** @param {number} n @param {number} waiting */
  treeAria: (n, waiting) => `Cây phân đoạn trên ${n} giá trị, có ${waiting} nhãn chờ.`,
  arrayTitle: 'Mảng thật sự lúc này',
  arrayAria: 'Mảng thật, chỉ số 0 đứng đầu',
  leavesTitle: 'Giá trị các lá đang lưu',
  /** @param {number} stale */
  leavesAria: (stale) =>
    `Các lá của cây, chỉ số 0 đứng đầu. ${stale} lá đang chậm hơn giá trị thật.`,
  unbuilt: '·',
  show,
  /** @param {number} tag */
  tagText: (tag) => plusMinus(tag),
  /** @param {string} name @param {number} i @param {number} v @param {string} state */
  cellLabel: (name, i, v, state) => `${name} ${i} = ${show(v)}${state ? `, ${state}` : ''}`,
  /** @param {number} lo @param {number} hi @param {string} value @param {number} tag @param {string} state */
  nodeLabel: (lo, hi, value, tag, state) =>
    `Nút trên ${range(lo, hi)}, tổng ${value}${tag !== 0 ? `, nhãn chờ ${plusMinus(tag)}` : ''}${state ? `, ${state}` : ''}`,
  /** @param {LazyOp} op */
  opChip: (op) =>
    op.type === 'add' ? `add(${op.l}, ${op.r}, ${show(op.x)})` : `query(${op.l}, ${op.r})`,
  /** @param {number} lo @param {number} hi @param {number} tag */
  pendingChip: (lo, hi, tag) => `${range(lo, hi)} ${plusMinus(tag)}`,
  pendingTitle: 'Nhãn chờ',
  opsTitle: 'Các thao tác',
  opsEmpty: 'không có',
  opsHotLabel: 'đang chạy',
  markers: { cover: '✓', split: '↓', outside: '✕', write: '✎', merge: 'm', push: '⇣', stale: '…' },
  states: {
    cover: 'nằm trọn trong đoạn',
    split: 'nằm một phần, phải tách',
    outside: 'nằm ngoài đoạn',
    written: 'vừa ghi giá trị',
    received: 'vừa nhận nhãn',
    pushing: 'đang đẩy nhãn xuống',
    merged: 'đang cộng hai con',
    pending: 'nhãn đang chờ',
    stale: 'chậm hơn giá trị thật',
  },
  legend: {
    pending: '+x Nhãn đang chờ; … lá chậm hơn',
    cover: '✓ Nằm trọn trong đoạn',
    split: '↓ Nằm một phần',
    outside: '✕ Nằm ngoài',
    merge: '⇣ Đang đẩy xuống; m đang cộng hai con',
    write: '✎ Tổng vừa ghi',
  },
  stats: {
    visits: 'Số nút đã thăm',
    pushes: 'Số lần đẩy xuống',
    writes: 'Số tổng nút đã đổi',
    eager: 'Số thay đổi nếu không dùng nhãn',
    result: 'Đáp án truy vấn',
  },
  pending: '—',
  practiceTitle: 'Tự kiểm tra',
  /** @param {LazyFrame} f */
  describe(f) {
    const span = f.spans.find((s) => s.v === f.node);
    const here = span ? range(span.lo, span.hi) : '';
    const op = f.op;
    const asked = op ? range(op.l, op.r) : '';
    switch (f.kind) {
      case 'start':
        return `Dựng các tổng trên ${f.items.length} giá trị. Chưa nút nào có nhãn.`;
      case 'build-leaf':
        return `Lá ${here} lưu ${show(/** @type {number} */ (f.value))}.`;
      case 'build-pull':
        return `Nút ${here} cộng hai con: ${show(/** @type {number} */ (f.value))}.`;
      case 'split':
        return f.tag[f.node] !== 0
          ? `Nút ${here} chỉ nằm một phần trong ${asked}, nên thao tác phải đi xuống dưới nó. Nhãn ${plusMinus(f.tag[f.node])} của nó phải đi xuống trước.`
          : `Nút ${here} chỉ nằm một phần trong ${asked}. Nút không có nhãn, nên ta đi thẳng xuống hai con.`;
      case 'push': {
        const left = f.spans.find((s) => s.v === f.pushedTo[0]);
        const right = f.spans.find((s) => s.v === f.pushedTo[1]);
        return `Đẩy ${plusMinus(f.pushed)} xuống: ${left ? range(left.lo, left.hi) : ''} và ${right ? range(right.lo, right.hi) : ''} nhận nhãn, và nhãn của nút này được xoá. Đến lúc này hai con mới thấy lượng đó.`;
      }
      case 'outside':
        return `Nút ${here} nằm ngoài ${asked}: không có gì phải làm ở đây, và nhãn nó đang giữ (nếu có) tiếp tục chờ.`;
      case 'apply': {
        const x = op?.type === 'add' ? op.x : 0;
        const len = span ? span.hi - span.lo + 1 : 0;
        return len === 1
          ? `Lá ${here} nằm trong ${asked}: tổng của nó thay đổi ${plusMinus(x)}. Lá không có con, nên không cần nhãn.`
          : `Nút ${here} nằm trọn trong ${asked}: tổng của nó thay đổi ${plusMinus(x)} × ${len}, và nhãn tăng thêm ${plusMinus(x)}. Dừng ở đây: không chạm tới gì bên dưới.`;
      }
      case 'pull':
        return `Đi ngược lên: nút ${here} cộng hai con và giờ lưu ${show(/** @type {number} */ (f.value))}.`;
      case 'cover':
        return f.tag[f.node] !== 0
          ? `Nút ${here} nằm trọn trong ${asked}: tổng ${show(/** @type {number} */ (f.value))} của nó đã tính cả nhãn của chính nó, nên không cần đẩy xuống.`
          : `Nút ${here} nằm trọn trong ${asked}: trả về tổng ${show(/** @type {number} */ (f.value))} của nó.`;
      case 'return':
        return `Nút ${here} cộng các kết quả mà hai con trả về: ${show(/** @type {number} */ (f.value))}.`;
      case 'answer':
        return `Tổng của ${asked} là ${show(/** @type {number} */ (f.result))}, sau ${f.pushes} lần đẩy xuống. Các nhãn ở chỗ khác vẫn đang chờ.`;
      case 'done':
        return `Xong: các lần cập nhật và đẩy xuống đã đổi tổng của ${f.totalWrites} nút; nếu không dùng nhãn, riêng các lần cập nhật đã phải đổi ${f.totalEager} nút.`;
    }
  },
  takeaways: [
    'Một nút nằm trọn trong đoạn cập nhật sẽ đổi tổng của chính nó thêm x · (hi − lo + 1) và cộng x vào nhãn. Nó dừng ở đó, nên chỉ khoảng 2 log₂ n nút nhận thay đổi.',
    'Nhãn có nghĩa là “tổng của tôi đã đúng, nhưng các con của tôi chưa nhận lượng này”. Tổng của một nút đã tính cả nhãn của chính nó, nên truy vấn dừng ở nút đó đọc được giá trị đúng mà không cần đẩy xuống.',
    'Luôn đẩy nhãn xuống trước khi đi xuống dưới một nút, cả khi cập nhật lẫn khi truy vấn. Nếu không, một nút con sẽ trả về tổng cũ, hoặc bước cộng ngược lên sẽ ghi đè thay đổi bằng giá trị cũ.',
    'Sau khi đệ quy, phép cập nhật tính lại sum[v] từ hai con. Ở đây các nhãn cộng dồn được, nhưng loại nhãn khác cần cẩn thận: nhãn “gán cả đoạn bằng x” ghi đè nhãn đang chờ chứ không cộng vào.',
    'Thử add(0, 7, 5) trên 8 giá trị: chỉ 1 nút thay đổi thay vì 15, và mọi lá đều chậm hơn mảng thật. Rồi chạy query(5, 5) và xem nhãn đi xuống theo một đường đi trong khi nửa trái vẫn giữ nhãn.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Dựng cây', 'O(n)', '2n − 1 nút, mỗi nút tính một lần.'],
    [
      'Cộng vào đoạn',
      'O(log n)',
      'Mỗi tầng thăm tối đa bốn nút; chỉ các nút đó thay đổi hoặc đẩy nhãn.',
    ],
    ['Cộng vào đoạn không dùng nhãn', 'O(n)', 'Mọi nút chứa một giá trị của đoạn đều thay đổi.'],
    ['Tổng trên đoạn', 'O(log n)', 'Cùng cách đi đó, đẩy nhãn xuống trên đường đi.'],
    ['Đẩy xuống', 'O(1)', 'Hai con thay đổi, mỗi con cần một phép nhân và một phép cộng.'],
    ['Bộ nhớ', 'O(n)', 'Mỗi nút một tổng và một nhãn.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Với 8 giá trị, add(0, 7, 5) đổi tổng của bao nhiêu nút?',
      unit: 'nút',
      answer: 1,
      hints: ['Gốc phủ cả mảng, và nó nằm trọn trong đoạn.'],
      solution:
        'Gốc nằm trọn trong đoạn, nên nó đổi tổng của mình và nhận nhãn +5. Không chạm tới gì bên dưới. Nếu không dùng nhãn, cả 15 nút đều phải đổi.',
    },
    {
      type: 'number',
      prompt:
        'Bắt đầu từ a = [1, 2, 3, 4, 5, 6, 7, 8]. Sau add(0, 7, 5) rồi add(4, 7, 2), nút trên [4, 7] giữ nhãn bao nhiêu?',
      answer: 7,
      hints: [
        'Lần cập nhật thứ hai phải đi xuống dưới gốc, nên gốc đẩy +5 xuống hai con trước.',
        'Sau đó [4, 7] nằm trọn trong lần cập nhật thứ hai.',
      ],
      solution: 'Lần đẩy cho [4, 7] nhãn +5. Lần cập nhật thứ hai cộng thêm 2: 5 + 2 = 7.',
    },
    {
      type: 'number',
      prompt: 'Cùng trạng thái đó. Nút trên [4, 7] lưu tổng bằng bao nhiêu?',
      answer: 54,
      hints: ['Tổng ban đầu của nó là 5 + 6 + 7 + 8 = 26.', 'Cả 4 giá trị của nó đều tăng 7.'],
      solution: '26 + 7 × 4 = 54.',
    },
    {
      type: 'number',
      prompt: 'Cùng trạng thái đó. query(5, 5) thực hiện bao nhiêu lần đẩy xuống?',
      unit: 'lần',
      answer: 2,
      hints: [
        'Đường đi là gốc, [4, 7], [4, 5], [5].',
        'Lúc này nhãn của gốc bằng 0, và lá thì không có gì để đẩy.',
      ],
      solution:
        'Gốc không có nhãn. [4, 7] đẩy +7 xuống [4, 5] và [6, 7], rồi [4, 5] đẩy +7 xuống hai lá của nó. Vậy là 2 lần đẩy, và đáp án là 6 + 7 = 13.',
    },
    {
      type: 'choice',
      prompt: 'Một truy vấn dừng ở một nút nằm trọn trong đoạn và đang giữ nhãn. Nó nên làm gì?',
      options: [
        'Trả về tổng của nút: tổng đó đã tính cả nhãn của chính nó',
        'Cộng nhãn × độ dài vào tổng, rồi trả về',
        'Đẩy nhãn xuống trước, rồi trả về tổng',
        'Đi xuống tận các lá và cộng chúng lại',
      ],
      answer: 0,
      hints: ['Khi nút nhận nhãn, tổng của chính nó đã ra sao?'],
      solution:
        'Áp một nhãn sẽ đổi ngay tổng của chính nút đó. Nhãn chỉ là phần nợ các con. Cộng thêm lần nữa sẽ tính hai lần, còn đẩy xuống là việc thừa.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao phép cập nhật phải đẩy nhãn xuống trước khi đi vào các con?',
      options: [
        'Nếu không, tổng của nút con bị cũ, và bước cộng ngược lên sẽ ghi đè nút cha bằng một tổng sai',
        'Vì một nhãn chỉ giữ được một giá trị',
        'Vì các lá luôn phải khớp với mảng thật',
        'Để giữ cho cây cân bằng',
      ],
      answer: 0,
      hints: ['Sau khi đệ quy, sum[v] = sum[2v] + sum[2v + 1]. Nếu hai con thiếu nhãn thì sao?'],
      solution:
        'Bước cộng ngược lên tính lại sum[v] từ hai con. Nếu chúng vẫn thiếu nhãn của v, tổng đó sẽ thiếu phần ấy. Các lá được phép chậm hơn, như hình tương tác cho thấy, miễn là các nút phía trên giữ phần chênh lệch.',
    },
    {
      type: 'text',
      prompt: 'Một lần cộng vào đoạn với cập nhật lười tốn bao nhiêu, viết bằng kí hiệu O?',
      accept: ['O(log n)', 'log n', 'Θ(log n)', 'O(logn)', 'logn'],
      hints: ['Mỗi tầng, đường đi thăm bao nhiêu nút?'],
      solution: 'Tối đa bốn nút mỗi tầng, qua khoảng log₂ n tầng: O(log n).',
    },
  ],
  nextTeaser:
    'Bài tiếp theo: Chia căn và thuật toán Mo, chia mảng thành các khối cỡ √n để trả lời truy vấn đoạn theo cách khác.',
};
