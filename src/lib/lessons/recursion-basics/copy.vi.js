/** @typedef {import('$lib/algo-engine/recursion-basics.js').BasicsFrame} BasicsFrame */
/** @typedef {import('$lib/algo-engine/recursion-basics.js').RecursionFn} RecursionFn */
/** @typedef {import('$lib/algo-engine/recursion-basics.js').StackRecord} StackRecord */

/** @param {RecursionFn} fn @param {number|string} n */
const callName = (fn, n) => `${fn}(${n})`;

/** @param {number} n */
const signed = (n) => String(n).replace('-', '−');

export const vi = {
  slug: 'recursion-basics',
  topic: 'recursion',
  level: 'Cơ bản',
  title: 'Đệ quy cơ bản',
  intro:
    'Một hàm đệ quy giải bài toán bằng cách tự gọi chính nó trên một bản nhỏ hơn của bài toán. Hàm cần một trường hợp cơ sở (base case), tức đầu vào đủ nhỏ để trả lời ngay, và một trường hợp đệ quy đưa mỗi lời gọi tiến dần về trường hợp cơ sở. Mỗi lời gọi có một khung riêng trên call stack (ngăn xếp lời gọi), và các khung được lấy ra theo thứ tự ngược với lúc đẩy vào.',
  summary:
    'Chạy từng bước hàm giai thừa và hàm Fibonacci, xem call stack đẩy vào một khung ở mỗi lời gọi và lấy khung ra ở mỗi lần trả về.',
  instruction:
    'Chọn một hàm và một giá trị n, rồi chạy từng bước. Quan sát call stack lớn dần cho tới khi một trường hợp cơ sở trả lời, rồi nhỏ lại khi từng hàm gọi chạy tiếp với giá trị vừa nhận. Bỏ chọn “Trường hợp cơ sở” để xem chuyện gì xảy ra khi thiếu nó.',
  fnLabel: 'Hàm',
  fns: { fact: 'Giai thừa', fib: 'Fibonacci' },
  nLabel: 'n',
  baseLabel: 'Trường hợp cơ sở',
  /** @param {RecursionFn} fn @param {number} max */
  nError: (fn, max) => `Với ${fn}(n), n phải là số nguyên từ 0 đến ${max}.`,
  /** @param {boolean} on */
  baseNotice: (on) =>
    on
      ? 'Đã khôi phục trường hợp cơ sở: đệ quy dừng khi n ≤ 1.'
      : 'Đã bỏ trường hợp cơ sở: giờ không gì dừng được đệ quy. Em chạy tiếp và xem stack nhé.',
  stats: {
    calls: 'Số lời gọi',
    depth: 'Độ sâu stack',
    result: 'Kết quả',
  },
  /** @param {number} d @param {number} max */
  depthValue: (d, max) => `${d} (tối đa ${max})`,
  resultPending: '…',
  resultOverflow: 'sập',
  stackTitle: 'Call stack (đỉnh ở trên)',
  stackEmpty: 'Stack đang rỗng.',
  /** @param {number} limit */
  stackLimit: (limit) => `Chứa được ${limit} khung`,
  treeTitle: 'Cây lời gọi',
  treeEmpty: 'Chưa có lời gọi nào.',
  /** @param {RecursionFn} fn @param {number} n @param {number} calls */
  treeAria: (fn, n, calls) => `Cây lời gọi của ${callName(fn, n)}: đã có ${calls} lời gọi.`,
  /**
   * @param {RecursionFn} fn
   * @param {number} n
   * @param {number|null} result
   * @param {'active'|'waiting'|'returned'|'lost'} status
   */
  nodeAria: (fn, n, result, status) =>
    `${callName(fn, signed(n))}, ${
      {
        active: 'đang chạy',
        waiting: 'đang chờ trên stack',
        returned: `đã trả về ${result}`,
        lost: 'mất khi chương trình sập',
      }[status]
    }`,
  status: {
    active: 'đang chạy',
    waiting: 'đang chờ',
  },
  /**
   * Locals of one stack frame, `?` for a value not known yet.
   * @param {RecursionFn} fn
   * @param {StackRecord} r
   */
  locals(fn, r) {
    const q = (/** @type {number|null} */ v) => (v === null ? '?' : String(v));
    const n = `n = ${signed(r.n)}`;
    return fn === 'fact' ? `${n}, r = ${q(r.a)}` : `${n}, a = ${q(r.a)}, b = ${q(r.b)}`;
  },
  /** @param {number} line */
  atLine: (line) => `dòng ${line + 1}`,
  callName,
  legend: {
    active: 'Đang chạy (ở đỉnh call stack)',
    waiting: 'Đang chờ lời gọi mà nó tạo ra',
    returned: 'Đã trả về; ghi chú cho biết giá trị',
    lost: 'Không bao giờ trả về: mất khi chương trình sập',
  },
  markers: { active: '▶', waiting: '…', returned: '✓', lost: '✕' },
  /** @param {BasicsFrame} f */
  describe(f) {
    const name = (/** @type {number} */ k) => callName(f.fn, signed(k));
    const top = f.stack.at(-1);
    switch (f.kind) {
      case 'start':
        return f.withBase
          ? `Sẵn sàng gọi ${name(f.n)}. Mỗi lời gọi sẽ đẩy một khung riêng vào stack.`
          : `Sẵn sàng gọi ${name(f.n)} khi đã bỏ trường hợp cơ sở.`;
      case 'call': {
        const check = f.withBase
          ? ` ${signed(f.value ?? 0)} ≤ 1 không?`
          : ' Không có trường hợp cơ sở nào để kiểm tra.';
        return `Gọi ${name(f.value ?? 0)}: đẩy vào một khung với n = ${signed(f.value ?? 0)}. Stack sâu ${f.depth} khung.${check}`;
      }
      case 'base':
        return `${top?.n} ≤ 1, trường hợp cơ sở: ${name(top?.n ?? 0)} trả về ${f.value} mà không tự gọi lại, và khung của nó được lấy ra khỏi stack.`;
      case 'resume': {
        const local = f.fn === 'fib' && top?.line === 4 ? 'b' : f.fn === 'fib' ? 'a' : 'r';
        return `${name(f.from ?? 0)} trả về ${f.value}. Quay lại ${name(top?.n ?? 0)}, hàm này chạy tiếp với ${local} = ${f.value}.`;
      }
      case 'return': {
        const sum =
          f.fn === 'fact'
            ? `${top?.n} × ${top?.a} = ${f.value}`
            : `a + b = ${top?.a} + ${top?.b} = ${f.value}`;
        return `${name(top?.n ?? 0)} = ${sum}. Trả về ${f.value} và lấy khung ra.`;
      }
      case 'overflow':
        return `Gọi ${name(f.value ?? 0)} sẽ cần khung thứ ${f.depth + 1}, nhưng stack chỉ chứa được ${f.depth}: tràn stack (stack overflow). Không có trường hợp cơ sở thì các lời gọi không bao giờ dừng.`;
      case 'done':
        return f.overflow
          ? `Chương trình sập vì tràn stack sau ${f.callCount} lời gọi. Đệ quy cần một trường hợp cơ sở chắc chắn đạt tới được.`
          : `${name(f.n)} = ${f.result} sau ${f.callCount} lời gọi. Stack sâu nhất ${f.maxDepth} khung và giờ đã rỗng trở lại.`;
    }
  },
  takeaways: [
    'Mọi đệ quy đều có một trường hợp cơ sở trả lời ngay và một trường hợp đệ quy tự gọi lại trên đầu vào nhỏ hơn.',
    'Mỗi lời gọi đẩy vào một khung chứa n và các biến cục bộ của riêng nó. Hàm gọi phải chờ lời gọi nó tạo ra trả về, nên các khung được lấy ra theo thứ tự ngược lại.',
    'fact(n) tạo n lời gọi và xếp chồng n khung: thời gian O(n) và bộ nhớ O(n), dù trong mã không có mảng nào.',
    'fib(n) tự gọi hai lần, nên tạo ra 2·fib(n + 1) − 1 lời gọi và giải đi giải lại cùng một bài toán con: fib(2) chạy 3 lần bên trong fib(5).',
    'Bỏ chọn “Trường hợp cơ sở” rồi chạy đến bước cuối: stack đầy và chương trình sập. Sau đó so sánh cây lời gọi của fib(6) với fact(6).',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['fact(n), thời gian', 'O(n)', 'n lời gọi, mỗi lời gọi làm một phép nhân.'],
    ['fact(n), bộ nhớ', 'O(n)', 'Ở điểm sâu nhất, cả n khung cùng nằm trên stack.'],
    [
      'fib(n), thời gian',
      'O(φⁿ) ≈ O(1.618ⁿ)',
      'Mỗi tầng có hai lời gọi: tổng cộng 2·fib(n + 1) − 1 lời gọi.',
    ],
    [
      'fib(n), bộ nhớ',
      'O(n)',
      'Mỗi lúc chỉ có một đường đi của cây lời gọi, fib(n) → fib(n − 1) → … → fib(1), nằm trên stack.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'fib(5) tạo ra tất cả bao nhiêu lời gọi, tính cả lời gọi đầu tiên?',
      answer: 15,
      unit: 'lời gọi',
      hints: [
        'Chạy Fibonacci với n = 5 và đọc ô “Số lời gọi” ở bước cuối.',
        'Hoặc đếm: calls(n) = 1 + calls(n − 1) + calls(n − 2), với calls(0) = calls(1) = 1.',
      ],
      solution:
        'calls(2) = 3, calls(3) = 5, calls(4) = 9, calls(5) = 1 + 9 + 5 = 15, đúng bằng 2·fib(6) − 1 = 2·8 − 1.',
    },
    {
      type: 'number',
      prompt: 'Ở điểm sâu nhất của fact(6), trên stack có bao nhiêu khung?',
      answer: 6,
      unit: 'khung',
      hints: ['fact(6) gọi fact(5), fact(5) gọi fact(4), … cho tới trường hợp cơ sở fact(1).'],
      solution:
        'fact(6), fact(5), fact(4), fact(3), fact(2) và fact(1) cùng đang chờ: 6 khung. Không lời gọi nào trả về trước trường hợp cơ sở.',
    },
    {
      type: 'number',
      prompt: 'Khi tính fib(5), fib(2) được gọi bao nhiêu lần?',
      answer: 3,
      unit: 'lần',
      hints: ['Tìm các nút mang nhãn 2 trong cây lời gọi của fib(5).'],
      solution:
        'fib(5) gọi fib(4) và fib(3); fib(4) gọi fib(3) và fib(2); mỗi fib(3) gọi fib(2) một lần. Vậy có 1 + 2 = 3 lời gọi fib(2).',
    },
    {
      type: 'order',
      prompt: 'Xếp các khung của fact(3) theo thứ tự chúng được lấy ra khỏi stack.',
      items: ['fact(3)', 'fact(1)', 'fact(2)'],
      answer: [1, 2, 0],
      hints: [
        'Một khung được lấy ra khi lời gọi của nó trả về. Lời gọi nào trả về được trước tiên?',
      ],
      solution:
        'fact(1) là trường hợp cơ sở nên trả về đầu tiên, rồi fact(2) trả về 2 × 1 = 2, rồi fact(3) trả về 3 × 2 = 6: ngược với thứ tự đẩy vào.',
    },
    {
      type: 'choice',
      prompt: 'Chuyện gì xảy ra nếu bỏ trường hợp cơ sở khỏi fact(n)?',
      options: [
        'Hàm trả về 0, vì các lời gọi đi tới fact(0).',
        'Hàm gọi fact(n − 1), fact(n − 2), … mãi mãi, cho tới khi tràn stack.',
        'Hàm trả về n, vì chỉ lời gọi đầu tiên chạy.',
        'Không có gì thay đổi: phép nhân sẽ làm hàm dừng.',
      ],
      answer: 1,
      hints: ['Bỏ chọn “Trường hợp cơ sở” rồi chạy đến bước cuối.'],
      solution:
        'Không gì dừng được các lời gọi: fact(0) gọi fact(−1), fact(−1) gọi fact(−2), cứ thế mãi. Mỗi lời gọi đẩy vào một khung, nên chương trình sập khi stack đầy.',
    },
  ],
  nextTeaser:
    'Bài sau, Đệ quy và quy nạp, cho em thấy cách chứng minh một vòng lặp hay một hàm đệ quy luôn đúng.',
};
