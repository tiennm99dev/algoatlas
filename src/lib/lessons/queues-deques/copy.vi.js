/** @typedef {import('$lib/algo-engine/queues-deques.js').DequeFrame} DequeFrame */
/** @typedef {import('$lib/algo-engine/queues-deques.js').DequeOp} DequeOp */

/** @param {DequeOp} op */
const opName = (op) =>
  op.type === 'push-back'
    ? `enqueue(${op.value})`
    : op.type === 'pop-front'
      ? 'dequeue()'
      : op.type === 'push-front'
        ? `pushFront(${op.value})`
        : 'popBack()';

/** @param {boolean} wrapped */
const wrapNote = (wrapped) => (wrapped ? ' Chỉ số chạy quá ô 7 nên quay vòng về đầu.' : '');

export const vi = {
  slug: 'queues-deques',
  topic: 'stacks-queues',
  level: 'Cơ bản',
  title: 'Queue và deque',
  intro:
    'Queue (hàng đợi) giống dòng người xếp hàng mua vé: người mới đứng vào cuối hàng, người ở đầu hàng được phục vụ và rời đi, nên ai vào trước thì ra trước (FIFO). Bộ đệm vòng lưu queue trong một mảng cố định có cuối nối vòng về đầu, nên cả hai đầu đều dịch chuyển trong O(1) và không phần tử nào phải dời. Deque (hàng đợi hai đầu) cho phép thêm và lấy ra ở cả hai đầu.',
  summary:
    'Thực hiện enqueue và dequeue trên bộ đệm vòng, xem head và tail quay vòng quanh vòng tròn, rồi dùng thêm các thao tác ở cả hai đầu của deque.',
  instruction:
    'Nhập một giá trị rồi enqueue, hoặc dequeue, sau đó chạy từng bước. Chọn mẫu “Quay vòng” để thấy chỉ số cuối queue chạy quá ô 7 sang ô 0, và dùng pushFront, popBack để dùng chính bộ đệm đó như một deque.',
  valueLabel: 'Giá trị',
  queueGroup: 'Queue (FIFO)',
  dequeGroup: 'Thêm cho deque',
  ops: {
    'push-back': 'enqueue',
    'pop-front': 'dequeue',
    'push-front': 'pushFront',
    'pop-back': 'popBack',
  },
  undo: 'Hoàn tác',
  reset: 'Làm lại',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presets: {
    queue: 'Queue ngắn',
    wrap: 'Quay vòng',
    deque: 'Cả hai đầu',
    full: 'Thêm khi đã đầy',
    random: 'Ngẫu nhiên',
  },
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác đang chạy',
  ringTitle: 'Bộ đệm vòng, 8 ô',
  rowTitle: 'Queue theo thứ tự, từ đầu đến cuối',
  headLabel: 'head',
  tailLabel: 'tail',
  opChip: opName,
  stats: {
    size: 'Kích thước',
    head: 'head',
    tail: 'tail = (head + size) mod 8',
    wraps: 'Số lần quay vòng',
    ringShifts: 'Số lần dời, bộ đệm vòng',
    naiveShifts: 'Số lần dời, mảng thường',
    result: 'Giá trị trả về',
  },
  none: '–',
  valueError: 'Giá trị phải là số nguyên từ 0 đến 99.',
  logFull: 'Danh sách thao tác đã đầy (20 thao tác). Hãy hoàn tác hoặc làm lại để tiếp tục.',
  /** @param {DequeFrame} f */
  ringLabel: (f) =>
    `Bộ đệm vòng gồm 8 ô, head = ${f.head}, tail = ${f.tail}, size = ${f.size}. ${
      f.items.length ? `Từ đầu đến cuối: ${f.items.join(', ')}.` : 'Bộ đệm đang rỗng.'
    }`,
  /** @param {number} i @param {number | null} v @param {boolean} inUse @param {string} state */
  slotTitle: (i, v, inUse, state) =>
    [
      `Ô ${i}`,
      v === null
        ? 'chưa từng dùng'
        : inUse
          ? `chứa ${v}`
          : `giá trị cũ ${v}, không nằm trong queue`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  states: { active: 'vừa ghi', sorted: 'vừa đọc', compare: 'đã kiểm tra' },
  markers: { active: '+', sorted: '✓', compare: '?' },
  legend: {
    frontier: 'Trong queue',
    active: 'Vừa ghi',
    sorted: 'Vừa đọc và trả về',
    stale: 'Ô cũ, không nằm trong queue (làm mờ)',
  },
  /** @param {DequeFrame} f */
  describe(f) {
    const op = f.op;
    switch (f.kind) {
      case 'start':
        return 'Một bộ đệm vòng rỗng: head = 0 và size = 0, nên tail cũng bằng 0.';
      case 'check': {
        const o = /** @type {DequeOp} */ (op);
        const adding = o.type === 'push-back' || o.type === 'push-front';
        return adding
          ? `${opName(o)}: size = ${f.size}${f.size === 8 ? ', bộ đệm đã đầy.' : ', nên còn ô trống.'}`
          : `${opName(o)}: size = ${f.size}${f.size === 0 ? ', bộ đệm đang rỗng.' : ', nên có phần tử để lấy.'}`;
      }
      case 'full':
        return `Đầy: cả 8 ô đều đang dùng, nên ${op?.value} bị từ chối. Để ý lúc này head = tail, giống hệt khi rỗng; chính size giúp phân biệt hai trường hợp.`;
      case 'empty':
        return 'Rỗng: không có gì để lấy ra. Bộ đệm giữ nguyên.';
      case 'push-back':
        return `Ghi ${op?.value} vào ô ${f.at}, chỗ của tail cũ, và tăng size lên ${f.size}. Giờ tail là ${f.tail}.${wrapNote(f.wrapped)}`;
      case 'pop-front':
        return `Đọc ${f.result} từ ô ${f.at} rồi dời head đến ${f.head}. Không phần tử nào phải dời: nếu là mảng thường thì ${f.size} phần tử đã phải dời sang trái.${wrapNote(f.wrapped)}`;
      case 'push-front':
        return `Lùi head về ô ${f.head} rồi ghi ${op?.value} vào đó. Đây là đầu queue mới, không phải dời gì.${f.wrapped ? ' Lùi từ ô 0 thì quay vòng về ô 7.' : ''}`;
      case 'pop-back':
        return `Đọc ${f.result} từ ô ${f.at}, phần tử ở cuối queue, rồi giảm size xuống ${f.size}. head không đổi.${f.wrapped ? ' Chỉ số ô cuối queue đã quay vòng qua 7.' : ''}`;
      case 'done':
        return f.size === 0
          ? 'Xong. Queue đang rỗng.'
          : `Xong. Có ${f.size} phần tử, từ đầu đến cuối: ${f.items.join(', ')}.`;
    }
  },
  takeaways: [
    'Queue là vào trước ra trước (FIFO): enqueue thêm vào cuối queue, dequeue lấy ra ở đầu queue.',
    'Lấy ra từ a[0] của một mảng thường thì mọi phần tử còn lại phải dời sang trái: O(n). Bộ đệm vòng chỉ dời chỉ số head: O(1).',
    'Chỉ số quay vòng theo mod C: ô sau ô C − 1 là ô 0. Phần tử cuối queue nằm ở (head + size − 1) mod C, còn ô trống kế tiếp ở (head + size) mod C.',
    'Deque có thêm pushFront (head lùi một ô, từ 0 quay vòng về C − 1) và popBack, đều là O(1), nên nó dùng được cả như stack (ngăn xếp) lẫn như queue.',
    'Chọn mẫu “Quay vòng” rồi chạy đến bước cuối: đếm xem mảng thường phải dời bao nhiêu lần, còn bộ đệm vòng dời bao nhiêu lần.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['enqueue, dequeue (bộ đệm vòng)', 'O(1)', 'Ghi hoặc đọc một ô, dời một chỉ số theo mod C.'],
    ['pushFront, popBack (deque)', 'O(1)', 'Như trên, ở đầu kia của vòng.'],
    ['dequeue từ mảng thường', 'O(n)', 'Mọi phần tử còn lại dời sang trái một ô.'],
    [
      'Bộ nhớ',
      'O(C)',
      'C ô, dùng hay không cũng chiếm chỗ; bộ đệm co giãn được thì gấp đôi C khi đầy.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Một bộ đệm vòng có C = 8 ô, head = 6 và size = 3. Lần enqueue tiếp theo sẽ ghi vào ô nào?',
      answer: 1,
      hints: ['Ô trống kế tiếp ở cuối queue là (head + size) mod C.'],
      solution:
        '(6 + 3) mod 8 = 9 mod 8 = 1. Các phần tử nằm ở ô 6, 7 và 0, nên phần tử tiếp theo vào ô 1.',
    },
    {
      type: 'number',
      prompt:
        'Bắt đầu với queue rỗng. Enqueue 4, 7, 2, rồi dequeue hai lần, rồi enqueue 9. Giá trị nào ở đầu queue?',
      answer: 2,
      hints: ['dequeue lấy ra giá trị cũ nhất còn trong queue.'],
      solution:
        'Sau các lần enqueue, queue là 4, 7, 2. Hai lần dequeue lấy 4 và 7 ra, còn lại 2. Enqueue 9 thêm nó vào phía sau: 2, 9. Đầu hàng là 2.',
    },
    {
      type: 'choice',
      prompt: 'Với C = 8, head = 0 và size = 0, pushFront(5) làm head thay đổi thế nào?',
      options: ['head thành 7', 'head thành 1', 'head giữ nguyên 0 và các phần tử dời sang phải'],
      answer: 0,
      hints: ['pushFront lùi head một ô, theo mod C.'],
      solution:
        'head = (0 − 1 + 8) mod 8 = 7. Số 5 được ghi vào ô 7 và trở thành đầu queue; không phải dời gì.',
    },
    {
      type: 'number',
      prompt:
        'Một mảng thường chứa 6 phần tử, đầu queue ở a[0]. Khi dequeue một phần tử thì phải dời bao nhiêu phần tử?',
      answer: 5,
      unit: 'phần tử',
      hints: ['Sau khi bỏ a[0], mọi phần tử còn lại phải dời một ô về phía đầu queue.'],
      solution:
        '5 phần tử còn lại mỗi phần tử dời sang trái một ô, để a[0] lại là đầu queue. Bộ đệm vòng thì chỉ cần dời head.',
    },
  ],
  nextTeaser:
    'Stack nhìn thì đơn giản nhưng có mặt ở khắp nơi. Bài sau, Ứng dụng của stack, dùng nó để kiểm tra dấu ngoặc và tính giá trị biểu thức.',
};
