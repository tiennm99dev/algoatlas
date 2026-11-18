/** @typedef {import('$lib/algo-engine/stacks.js').StackFrame} StackFrame */
/** @typedef {import('$lib/algo-engine/stacks.js').StackOp} StackOp */

/** @param {StackFrame} f */
const topValue = (f) => f.items[f.items.length - 1];

export const vi = {
  slug: 'stacks',
  topic: 'stacks-queues',
  level: 'Cơ bản',
  title: 'Ngăn xếp',
  intro:
    'Ngăn xếp (stack) giống một chồng đĩa: bạn đặt đĩa lên trên cùng và lấy đĩa từ trên cùng, nên đĩa vào sau sẽ ra trước (LIFO). Nó chỉ có ba thao tác push, pop và peek, và thao tác nào cũng chỉ chạm vào đỉnh, nên mỗi thao tác tốn O(1) dù ngăn xếp có ba phần tử hay ba triệu phần tử.',
  summary:
    'Thực hiện push, pop và peek trên ngăn xếp cài đặt bằng mảng hoặc danh sách liên kết, và xem con trỏ đỉnh dịch đi từng bước.',
  instruction:
    'Nhập một giá trị rồi push, pop hoặc peek, sau đó chạy từng bước. Đổi qua lại giữa mảng và danh sách liên kết để thấy cùng một ngăn xếp được lưu theo hai cách, và push quá sáu ô của mảng để thấy tràn ngăn xếp.',
  implLabel: 'Cách cài đặt',
  impls: { array: 'Mảng (6 ô)', linked: 'Danh sách liên kết' },
  valueLabel: 'Giá trị',
  push: 'push',
  pop: 'pop',
  peek: 'peek',
  undo: 'Hoàn tác',
  reset: 'Làm lại',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presets: {
    plates: 'Ba chiếc đĩa',
    overflow: 'Push khi đã đầy',
    underflow: 'Pop khi đã rỗng',
    random: 'Ngẫu nhiên',
  },
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác đang chạy',
  platesTitle: 'Ngăn xếp (chồng đĩa)',
  arrayTitle: 'Mảng a[0..5]',
  listTitle: 'Danh sách liên kết, đỉnh ở đầu',
  /** @param {StackOp} op */
  opChip: (op) => (op.type === 'push' ? `push(${op.value})` : `${op.type}()`),
  stats: {
    size: 'Kích thước',
    top: 'Chỉ số top',
    topValue: 'Giá trị ở đỉnh',
    pushes: 'Số lần push',
    pops: 'Số lần pop',
    result: 'Giá trị trả về',
  },
  none: '–',
  nullLabel: 'null',
  valueError: 'Giá trị phải là số nguyên từ 0 đến 99.',
  logFull: 'Danh sách thao tác đã đầy (16 thao tác). Hãy hoàn tác hoặc làm lại để tiếp tục.',
  drawingFull:
    'Hình vẽ chỉ chứa được 8 nút. Hãy pop trước đã: ngăn xếp liên kết thật chỉ dừng khi hết bộ nhớ.',
  /** @param {number[]} items */
  stackLabel: (items) =>
    items.length === 0
      ? 'Ngăn xếp đang rỗng.'
      : `Ngăn xếp, từ đáy lên đỉnh: ${items.join(', ')}. Đỉnh là ${items[items.length - 1]}.`,
  /** @param {(number | null)[]} slots @param {number} top */
  arrayLabel: (slots, top) =>
    `Mảng gồm ${slots.length} ô, top = ${top}: ${slots
      .map((v, i) => `a[${i}] ${v === null ? 'chưa dùng' : i <= top ? v : `${v} (cũ)`}`)
      .join(', ')}.`,
  /** @param {number[]} topFirst @param {number | null} fresh */
  listLabel: (topFirst, fresh) =>
    `${fresh === null ? '' : `Nút mới ${fresh}, chưa được nối vào. `}${
      topFirst.length === 0
        ? 'top là null'
        : `Danh sách liên kết từ đỉnh: ${topFirst.join(' → ')} → null`
    }`,
  states: { active: 'vừa push', compare: 'đang đọc', sorted: 'đã trả về' },
  markers: { active: '+', compare: '?', sorted: '✓' },
  legend: {
    active: 'Vừa push',
    compare: 'Đỉnh đang được đọc',
    sorted: 'Giá trị được trả về',
    stale: 'Ô cũ nằm trên top (làm mờ)',
  },
  /** @param {StackFrame} f */
  describe(f) {
    const v = f.op?.value;
    switch (f.kind) {
      case 'start':
        return f.impl === 'array'
          ? 'Một ngăn xếp rỗng trong mảng 6 ô: top = −1, nên chưa ô nào được dùng.'
          : 'Một ngăn xếp liên kết rỗng: top là null.';
      case 'check-full':
        return f.top === 5
          ? `push(${v}): top = 5 = capacity − 1. Mọi ô đều đã có giá trị.`
          : `push(${v}): top = ${f.top}, nhỏ hơn 5, nên vẫn còn chỗ.`;
      case 'overflow':
        return `Tràn ngăn xếp: ${v} không còn chỗ để vào. Ngăn xếp giữ nguyên.`;
      case 'push':
        return `top tăng lên ${f.top} và a[${f.top}] = ${v}. Chỉ ghi một ô, không phần tử nào khác bị dời.`;
      case 'create':
        return f.items.length === 0
          ? `Tạo một nút cho ${v}. top là null, nên con trỏ kế tiếp của nút là null.`
          : `Tạo một nút cho ${v} và cho con trỏ kế tiếp của nút trỏ tới đỉnh hiện tại, ${topValue(f)}.`;
      case 'link':
        return `top = node: ${v} giờ nằm ở đỉnh. Không nút nào khác bị dời.`;
      case 'check-empty':
        return f.items.length === 0
          ? `pop(): top là ${f.impl === 'array' ? '−1' : 'null'}, nên ngăn xếp đang rỗng.`
          : `pop(): đỉnh là ${topValue(f)}, nên có phần tử để lấy.`;
      case 'underflow':
        return `Ngăn xếp rỗng: không có gì để ${f.op?.type}. Ngăn xếp giữ nguyên.`;
      case 'pop':
        return f.impl === 'array'
          ? `Đọc ${f.result} từ a[${f.top + 1}] rồi giảm top xuống ${f.top}. Giá trị vẫn nằm trong ô, nhưng vì ở trên top nên không còn được tính.`
          : `Đọc ${f.result} rồi dời top sang nút kế tiếp${f.items.length ? `, ${topValue(f)}` : ', null'}. Trả về ${f.result}.`;
      case 'peek':
        return `peek() trả về ${f.result}, phần tử ở đỉnh, mà không lấy nó ra.`;
      case 'done':
        return f.items.length === 0
          ? `Xong. Ngăn xếp rỗng sau ${f.pushes} lần push và ${f.pops} lần pop.`
          : `Xong. Ngăn xếp có ${f.items.length} phần tử, ${topValue(f)} ở đỉnh.`;
    }
  },
  takeaways: [
    'Ngăn xếp là vào sau ra trước (LIFO): push đặt một giá trị lên đỉnh, pop lấy phần tử ở đỉnh ra, peek đọc nó mà không lấy ra.',
    'Mọi thao tác chỉ chạm vào đỉnh, nên push, pop và peek đều là O(1) với mọi kích thước.',
    'Trong mảng, một chỉ số top làm hết việc: push là top = top + 1 rồi a[top] = v; pop đọc a[top] rồi top = top − 1. Mảng đầy thì bị tràn.',
    'Trong danh sách liên kết, nút đầu chính là đỉnh: push nối một nút mới vào phía trước, pop dời top sang nút ngay sau nó. Nó lớn dần cho đến khi hết bộ nhớ.',
    'Push 3, 8 và 5, rồi pop ba lần: các giá trị trở ra theo thứ tự 5, 8, 3. Sau đó chọn mẫu “Push khi đã đầy” và so sánh hai cách cài đặt.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['push, pop, peek', 'O(1)', 'Chỉ đọc hoặc ghi ô hay nút ở đỉnh.'],
    ['Tìm một giá trị', 'O(n)', 'Ngăn xếp không cho xem bên dưới đỉnh; muốn xem thì phải pop.'],
    ['Bộ nhớ, mảng', 'O(capacity)', 'Số ô cố định, dùng hay không cũng chiếm chỗ; đầy là tràn.'],
    ['Bộ nhớ, danh sách liên kết', 'O(n)', 'Mỗi phần tử một nút, kèm một con trỏ tới nút kế tiếp.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Bắt đầu với một ngăn xếp rỗng. Chạy push(3), push(8), pop(), push(5), push(1), pop(), pop(). Giá trị nào đang ở đỉnh?',
      answer: 3,
      hints: [
        'Viết ngăn xếp từ đáy lên đỉnh sau mỗi thao tác.',
        'pop luôn lấy ra giá trị của lần push gần nhất mà giá trị đó vẫn còn trong ngăn xếp.',
      ],
      solution:
        'Sau push(3), push(8): [3, 8]. pop() lấy 8 ra: [3]. push(5), push(1): [3, 5, 1]. pop() lấy 1 ra, pop() lấy 5 ra: [3]. Đỉnh là 3.',
    },
    {
      type: 'choice',
      prompt: 'Ngăn xếp mảng có 6 ô và top = 5. Chuyện gì xảy ra khi gọi push(7)?',
      options: [
        'Tràn ngăn xếp: không còn ô trống',
        'top thành 6 và a[6] = 7',
        'Phần tử ở đáy bị bỏ đi để lấy chỗ',
      ],
      answer: 0,
      hints: ['Các ô là a[0] đến a[5]. Khi top = 5 thì những ô nào đang được dùng?'],
      solution:
        'top = 5 nghĩa là từ a[0] đến a[5] đều đang được dùng, còn a[6] không tồn tại. push báo tràn và giữ nguyên ngăn xếp.',
    },
    {
      type: 'number',
      prompt: 'Một ngăn xếp mảng có top = 3. Sau pop(), pop(), push(4), top bằng bao nhiêu?',
      answer: 2,
      hints: ['Mỗi lần pop giảm top đi 1; mỗi lần push tăng top thêm 1.'],
      solution: '3 − 1 − 1 + 1 = 2. Số 4 được ghi vào a[2].',
    },
    {
      type: 'multi',
      prompt: 'Những thao tác nào là O(1) trên một ngăn xếp có n phần tử?',
      options: ['push', 'pop', 'peek', 'tìm xem 42 có nằm đâu đó trong ngăn xếp không'],
      answers: [0, 1, 2],
      hints: ['Thao tác nào chỉ nhìn vào đỉnh?'],
      solution:
        'push, pop và peek chỉ chạm vào đỉnh. Tìm một giá trị có thể phải xem mọi phần tử: O(n).',
    },
  ],
  nextTeaser:
    'Ngăn xếp lấy ra ở cùng đầu với đầu thêm vào. Bài sau, Hàng đợi và hàng đợi hai đầu, lấy ra ở đầu kia: vào trước ra trước.',
};
