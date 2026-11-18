/** @typedef {import('$lib/algo-engine/practice-stacks-queues.js').PracticeFrame} PracticeFrame */
/** @typedef {import('$lib/algo-engine/practice-stacks-queues.js').PracticeOp} PracticeOp */

/** @param {number[]} s */
const topOf = (s) => s[s.length - 1];

/** @param {PracticeOp} op */
const opChip = (op) =>
  op.type === 'enqueue' || op.type === 'push'
    ? `${op.type}(${op.value})`
    : op.type === 'get-min'
      ? 'getMin()'
      : `${op.type}()`;

export const vi = {
  slug: 'practice-stacks-queues',
  topic: 'stacks-queues',
  level: 'Trung bình',
  title: 'Luyện tập: stack và queue',
  intro:
    'Hai bài kinh điển trong phỏng vấn, biến một cấu trúc thành cấu trúc khác. Queue (hàng đợi) dựng từ hai stack (ngăn xếp) chỉ đổ hộp vào (inbox) sang hộp ra (outbox) khi hộp ra đã cạn, nên mỗi phần tử chỉ được chuyển một lần và dequeue tốn O(1) khấu hao. Stack giữ giá trị nhỏ nhất (min-stack) giữ thêm một stack các giá trị nhỏ nhất bên cạnh stack chính, nên getMin cũng là O(1).',
  summary:
    'Dựng queue từ hai stack và một stack luôn biết giá trị nhỏ nhất, chạy qua từng lần push, pop và chuyển phần tử, rồi dùng hộp thử nghiệm để trả lời câu hỏi.',
  instruction:
    'Chọn một bài toán, nhập một giá trị và thêm thao tác (hoặc chọn một mẫu), rồi chạy từng bước. Để ý lúc các phần tử được đổ từ inbox sang outbox, và so sánh số thao tác stack với số thao tác queue. Dùng hộp thử nghiệm để trả lời các câu hỏi bên dưới.',
  problemLabel: 'Bài toán',
  problems: {
    'two-stack-queue': 'Queue từ hai stack',
    'min-stack': 'Stack giữ giá trị nhỏ nhất',
  },
  valueLabel: 'Giá trị',
  buttons: {
    enqueue: 'enqueue',
    dequeue: 'dequeue',
    push: 'push',
    pop: 'pop',
    'get-min': 'getMin',
  },
  undo: 'Hoàn tác',
  reset: 'Làm lại',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presets: {
    'two-stack-queue': { mixed: 'Lẫn lộn', burst: 'Năm vào, năm ra' },
    'min-stack': { mixed: 'Giá trị nhỏ nhất lặp lại', falling: 'Push giảm dần' },
  },
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác đang chạy',
  opChip,
  stackTitles: {
    'two-stack-queue': ['inbox (enqueue push vào đây)', 'outbox (dequeue pop từ đây)'],
    'min-stack': ['main, stack chính', 'mins (đỉnh = giá trị nhỏ nhất)'],
  },
  /** @param {string} name @param {number[]} items */
  stackLabel: (name, items) =>
    items.length === 0
      ? `${name}: rỗng.`
      : `${name}, từ đáy lên đỉnh: ${items.join(', ')}. Đỉnh là ${topOf(items)}.`,
  stats: {
    stackOps: 'Số lần push và pop stack',
    transfers: 'Số phần tử đã đổ',
    queueOps: 'Số thao tác queue',
    perOp: 'Thao tác stack cho mỗi thao tác queue',
    size: 'Số phần tử trong main',
    min: 'Giá trị nhỏ nhất hiện tại',
    result: 'Giá trị trả về',
  },
  none: '–',
  valueError: 'Giá trị phải là số nguyên từ 0 đến 99.',
  logFull: 'Danh sách thao tác đã đầy (16 thao tác). Hãy hoàn tác hoặc làm lại để tiếp tục.',
  full: 'Hình vẽ chỉ chứa được 8 phần tử. Hãy bỏ bớt một phần tử trước.',
  states: { active: 'vừa push', swap: 'vừa chuyển', sorted: 'đã trả về' },
  markers: { active: '+', swap: '→', sorted: '✓' },
  legend: {
    active: 'Vừa push',
    swap: 'Vừa đổ từ inbox sang',
    sorted: 'Giá trị nhỏ nhất hiện tại',
  },
  /** @param {PracticeFrame} f */
  describe(f) {
    const v = f.op?.value;
    switch (f.kind) {
      case 'start':
        return f.problem === 'two-stack-queue'
          ? 'Cả hai stack đều rỗng. enqueue push vào inbox; dequeue pop từ outbox.'
          : 'Cả hai stack đều rỗng. Đỉnh của mins luôn là giá trị nhỏ nhất của stack chính.';
      case 'enqueue':
        return `enqueue(${v}): push ${v} vào inbox. Một thao tác stack.`;
      case 'check':
        return f.right.length > 0
          ? `dequeue(): outbox đang có ${f.right.length} phần tử, nên không cần đổ.`
          : f.left.length > 0
            ? 'dequeue(): outbox rỗng, nên đổ cả inbox sang.'
            : 'dequeue(): outbox rỗng, inbox cũng rỗng.';
      case 'transfer':
        return `Pop ${f.moved} từ inbox rồi push nó vào outbox. Việc đổ đảo ngược thứ tự, nên phần tử cũ nhất nằm trên đỉnh.`;
      case 'empty':
        return f.problem === 'two-stack-queue'
          ? 'Cả hai stack đều rỗng: queue rỗng, không có gì để dequeue.'
          : `Stack chính rỗng: không có gì để ${f.op?.type === 'pop' ? 'pop' : 'lấy giá trị nhỏ nhất'}.`;
      case 'dequeue':
        return `Pop ${f.result} từ outbox và trả về: đó là phần tử cũ nhất trong queue.`;
      case 'push-main':
        return `push(${v}): push ${v} vào stack chính.`;
      case 'push-min':
        return f.right.length === 1
          ? `mins đang rỗng, nên ${v} là giá trị nhỏ nhất: push nó vào mins.`
          : `${v} ≤ giá trị nhỏ nhất cũ ${f.right[f.right.length - 2]}: push nó vào mins. Nó là giá trị nhỏ nhất mới.`;
      case 'skip-min':
        return `${v} > giá trị nhỏ nhất ${topOf(f.right)}: mins giữ nguyên.`;
      case 'pop-main':
        return `pop(): pop ${f.result} khỏi stack chính.`;
      case 'pop-min':
        return `${f.result} là giá trị nhỏ nhất (đỉnh của mins), nên pop cả mins. Giá trị nhỏ nhất giờ là ${f.right.length ? topOf(f.right) : 'không xác định: stack rỗng'}.`;
      case 'keep-min':
        return `${f.result} không phải đỉnh của mins, ${topOf(f.right)}, nên mins giữ nguyên.`;
      case 'get-min':
        return `getMin() đọc đỉnh của mins: ${f.result}. Không cần tìm kiếm.`;
      case 'done':
        return f.problem === 'two-stack-queue'
          ? `Xong. ${f.done} thao tác queue tốn ${f.stackOps} thao tác stack: mỗi phần tử được push và pop nhiều nhất hai lần.`
          : `Xong. Stack chính có ${f.left.length} phần tử${f.left.length ? `, giá trị nhỏ nhất ${topOf(f.right)}` : ''}.`;
    }
  },
  takeaways: [
    'Hai stack tạo thành một queue: push vào inbox, pop từ outbox, và chỉ đổ inbox sang outbox khi outbox rỗng. Việc đổ đảo ngược thứ tự, biến vào sau ra trước (LIFO) thành vào trước ra trước (FIFO).',
    'Một lần dequeue có thể chuyển n phần tử, nhưng cả đời mỗi phần tử chỉ được đổ nhiều nhất một lần, nên một chuỗi thao tác tốn nhiều nhất 4 thao tác stack cho mỗi phần tử: O(1) khấu hao.',
    'Stack giữ giá trị nhỏ nhất có thêm một stack thứ hai, mins, với đỉnh là giá trị nhỏ nhất hiện tại. Push v vào mins khi v ≤ đỉnh của nó; pop mins khi giá trị bị pop bằng đỉnh của nó.',
    'Dùng ≤, không dùng <: với <, push bản sao thứ hai của giá trị nhỏ nhất rồi pop nó sẽ làm mất giá trị nhỏ nhất.',
    'Chọn mẫu “Năm vào, năm ra” và đếm số phần tử được đổ ở mỗi lần dequeue; rồi thử stack giữ giá trị nhỏ nhất với push 5, 3, 3 và hai lần pop.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['enqueue (hai stack)', 'O(1)', 'Một lần push vào inbox.'],
    [
      'dequeue (hai stack)',
      'O(1) khấu hao',
      'Mỗi phần tử được đổ một lần; một lần đổ n phần tử là O(n).',
    ],
    [
      'push, pop, getMin (stack giữ giá trị nhỏ nhất)',
      'O(1)',
      'Nhiều nhất một lần push hoặc pop trên mỗi stack; getMin chỉ đọc một đỉnh.',
    ],
    ['Bộ nhớ', 'O(n)', 'Mỗi phần tử nằm trong một stack; mins chứa nhiều nhất n giá trị.'],
  ],
  practiceTitle: 'Luyện tập với hộp thử nghiệm',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Queue từ hai stack: enqueue 1, 2, 3, dequeue, enqueue 4, rồi dequeue ba lần. Tổng cộng có bao nhiêu phần tử được đổ từ inbox sang outbox?',
      answer: 4,
      unit: 'phần tử',
      hints: [
        'Lần dequeue đầu tiên thấy outbox rỗng và đổ cả ba phần tử.',
        'Số 4 chờ trong inbox cho đến khi outbox rỗng lần nữa.',
      ],
      solution:
        'Lần dequeue đầu đổ 3, 2, 1 (3 phần tử). Hai lần dequeue tiếp theo pop 2 và 3 từ outbox mà không cần đổ. Lần cuối thấy outbox rỗng và đổ số 4: 3 + 1 = 4. Chọn mẫu “Lẫn lộn” để kiểm tra.',
    },
    {
      type: 'number',
      prompt:
        'Với cùng chuỗi thao tác đó, tổng cộng có bao nhiêu lần push và pop trên stack? Tính mỗi lần đổ là một lần pop và một lần push.',
      answer: 16,
      unit: 'thao tác',
      hints: ['4 lần enqueue, 4 lần đổ và 4 lần dequeue.'],
      solution:
        '4 lần push của enqueue + 4 lần đổ × 2 + 4 lần pop của dequeue = 4 + 8 + 4 = 16, tức 2 cho mỗi thao tác queue.',
    },
    {
      type: 'number',
      prompt:
        'Enqueue 10, 20, 30, 40, 50, rồi dequeue năm lần. Lần dequeue đầu tiên đổ bao nhiêu phần tử?',
      answer: 5,
      unit: 'phần tử',
      hints: ['Ở lần dequeue đầu tiên, outbox đang rỗng.'],
      solution:
        'Cả 5 phần tử đều ở trong inbox, nên lần dequeue đầu đổ hết. Bốn lần dequeue còn lại không đổ gì: 5 lần đổ cho 5 lần dequeue.',
    },
    {
      type: 'text',
      prompt: 'Chi phí khấu hao của một lần dequeue trong queue hai stack là bao nhiêu?',
      accept: [
        'O(1)',
        'O(1) khấu hao',
        'hằng số',
        'thời gian hằng số',
        'O(1) amortized',
        'amortized O(1)',
        'O(1) amortised',
        'amortised O(1)',
      ],
      hints: ['Đếm xem trong cả đời mình một phần tử có thể bị đổ bao nhiêu lần.'],
      solution:
        'O(1): mỗi phần tử được push và pop tổng cộng nhiều nhất hai lần, nên n thao tác cộng lại tốn O(n), dù một lần dequeue có thể đổ O(n) phần tử.',
    },
    {
      type: 'number',
      prompt:
        'Stack giữ giá trị nhỏ nhất: push 5, 3, 7, 3, rồi pop một lần. getMin() trả về bao nhiêu?',
      answer: 3,
      hints: [
        'Theo dõi mins: những lần push nào ≤ đỉnh của nó?',
        'Số 3 bị pop bằng đỉnh của mins, nên một số 3 rời khỏi mins.',
      ],
      solution:
        'mins thành 5, 3, 3 (bỏ qua 7; số 3 thứ hai ≤ 3). Pop 3 thì pop một số 3 khỏi mins, còn lại 5, 3. getMin() trả về 3. Chọn mẫu “Giá trị nhỏ nhất lặp lại” để kiểm tra.',
    },
    {
      type: 'number',
      prompt: 'Stack giữ giá trị nhỏ nhất: push 4, 6, 2, 8. mins có bao nhiêu giá trị?',
      answer: 2,
      unit: 'giá trị',
      hints: ['Chỉ những giá trị ≤ giá trị nhỏ nhất hiện tại mới vào mins.'],
      solution: '4 vào (mins đang rỗng), bỏ qua 6, 2 vào, bỏ qua 8: mins là 4, 2.',
    },
    {
      type: 'choice',
      prompt:
        'Một stack giữ giá trị nhỏ nhất chỉ push vào mins khi v < mins.top (nhỏ hơn hẳn). Sau push 3, push 3, pop thì có gì sai?',
      options: [
        'mins thành rỗng, nên getMin thất bại dù 3 vẫn còn trong stack',
        'Không có gì sai',
        'getMin trả về số 3 đã bị pop hai lần',
      ],
      answer: 0,
      hints: ['Với <, số 3 thứ hai không được push vào mins.', 'Rồi lần pop thấy 3 = mins.top.'],
      solution:
        'mins chỉ chứa một số 3. Pop số 3 thứ hai khớp với mins.top nên pop nó, để mins rỗng trong khi stack chính vẫn còn 3. Dùng ≤ thì mỗi bản sao giữ một số 3 trên mins.',
    },
  ],
  nextTeaser:
    'Stack và queue chỉ cho xem ở hai đầu. Bài sau, Hash table, tìm một khoá bất kì trong O(1) trung bình.',
};
