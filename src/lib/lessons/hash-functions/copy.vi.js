/** @typedef {import('$lib/algo-engine/hash-functions.js').HashFnFrame} HashFnFrame */
/** @typedef {import('$lib/algo-engine/hash-functions.js').FixedHash} FixedHash */

/** @type {Record<FixedHash, string>} */
const FIXED_NAMES = { mod: 'k mod 16', multiply: 'phương pháp nhân' };

export const vi = {
  slug: 'hash-functions',
  topic: 'structures',
  level: 'Trung bình',
  title: 'Thiết kế hàm băm',
  intro:
    'Bảng băm chỉ nhanh khi hàm băm (hash function) rải khoá đều: mục tiêu là khoá nào cũng có khả năng rơi vào mọi ngăn như nhau. Hàm cố định nào cũng có những đầu vào va chạm hết với nhau, và một kẻ tấn công biết hàm đó có thể gửi đúng những khoá ấy. Băm phổ quát (universal hashing) chọn hàm một cách ngẫu nhiên lúc tạo bảng, nên tính trung bình không có đầu vào nào là xấu.',
  summary:
    'Băm cùng một bộ khoá bằng một hàm cố định và một hàm phổ quát rút ngẫu nhiên, rồi so sánh biểu đồ số khoá mỗi ngăn và số cặp va chạm.',
  instruction:
    'Chọn một hàm băm cố định và một bộ khoá, rồi đi từng bước. Mỗi khoá rơi vào một cột ở bên trái (hàm cố định) và một cột ở bên phải (hàm phổ quát). Nạp bộ “Tấn công” để gửi những khoá mà kẻ tấn công đã chọn nhằm vào hàm cố định, rồi rút a và b mới và xem bên phải vẫn được rải đều.',
  takeaways: [
    'Một hàm băm tốt rải khoá đều: mỗi ngăn trong m ngăn nhận khoảng n/m khoá, nên các chuỗi vẫn ngắn và số cặp va chạm kì vọng vào khoảng C(n, 2)/m.',
    'Hàm băm cố định nào cũng dồn ít nhất 1/m số khoá có thể có vào cùng một ngăn. Kẻ tấn công biết hàm có thể chỉ gửi những khoá đó và biến mọi lần tra cứu thành O(n).',
    'Khi m là luỹ thừa của 2, k mod m chỉ dùng các bit thấp của k: những khoá là bội của 16 đều rơi vào ngăn 0.',
    'Băm phổ quát rút ngẫu nhiên hàm h(k) = ((a·k + b) mod p) mod m với p là số nguyên tố lớn hơn mọi khoá. Khi đó hai khoá khác nhau bất kì va chạm với xác suất không quá 1/m, dù các khoá là gì. Có lần rút xui với vài bộ khoá, nhưng tính trung bình thì không lần nào xui.',
    'Nạp bộ “Tấn công” với k mod 16, rồi gõ a = 3 và b = 5: lần rút này tình cờ xấu với các bội của 16. Bấm “Đổi a, b” vài lần và so sánh số cặp va chạm với giá trị kì vọng.',
  ],
  complexityHead: ['Hàm băm và bộ khoá', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Đều (lí tưởng)',
      'O(1 + α)',
      'Phép tìm kì vọng: mỗi khoá rơi vào một ngăn bất kì với xác suất 1/m, độc lập với nhau.',
    ],
    [
      'Phổ quát, bộ khoá cố định bất kì',
      'O(1 + α)',
      'Phép tìm kì vọng: theo lựa chọn ngẫu nhiên của a, b, mỗi cặp va chạm với xác suất ≤ 1/m.',
    ],
    [
      'Cố định, khoá do kẻ tấn công chọn',
      'O(n)',
      'Phép tìm: kẻ tấn công chọn các khoá cùng chung một ngăn, nên một chuỗi chứa hết tất cả.',
    ],
    ['Tính h(k)', 'O(1)', 'Một phép nhân, một phép cộng và hai phép lấy dư.'],
  ],
  nextTeaser:
    'Bài tiếp theo, Tập hợp, ánh xạ và đếm tần suất, dùng bảng băm để trả lời “x có ở đây không?” và đếm số lần xuất hiện chỉ trong một lượt duyệt.',

  fixedLabel: 'Hàm băm cố định',
  fixedOptions: { mod: 'k mod 16', multiply: 'Phương pháp nhân' },
  fixedNames: FIXED_NAMES,
  keysLabel: 'Bộ khoá',
  keySets: { attack: 'Tấn công', sequential: 'Liên tiếp', random: 'Ngẫu nhiên' },
  countLabel: 'Số lượng',
  newKeys: 'Bộ khoá mới',
  aLabel: 'a',
  bLabel: 'b',
  drawButton: 'Đổi a, b',
  abError: 'a phải là số nguyên từ 1 đến 1008, còn b là số nguyên từ 0 đến 1008.',
  /** @param {FixedHash} fn */
  leftTitle: (fn) => `Cố định: ${FIXED_NAMES[fn]}`,
  /** @param {number} a @param {number} b */
  rightTitle: (a, b) => `Phổ quát: ((${a}·k + ${b}) mod 1009) mod 16`,
  /** @param {string} title @param {number[]} counts */
  histogramAria: (title, counts) =>
    `${title}. Số khoá mỗi ngăn, từ ngăn 0 đến 15: ${counts.join(', ')}.`,
  bucketAxis: 'Các ngăn 0 đến 15, từ trái sang phải',
  /** @param {number} pairs */
  pairsLine: (pairs) => `Số cặp va chạm: ${pairs}`,
  /** @param {number} n @param {number} e */
  expectedLine: (n, e) =>
    `Một hàm băm thật sự ngẫu nhiên có kì vọng C(${n}, 2)/16 = ${Number.isInteger(e) ? e : e.toFixed(1)} cặp va chạm.`,
  stats: {
    leftMax: 'Ngăn đầy nhất, cố định',
    rightMax: 'Ngăn đầy nhất, phổ quát',
    leftEmpty: 'Số ngăn trống, cố định',
    rightEmpty: 'Số ngăn trống, phổ quát',
  },
  keysTitle: 'Các khoá theo thứ tự',
  keysHot: 'khoá đang được băm',
  legend: { active: 'Ngăn vừa nhận khoá' },
  marks: { active: '+' },

  /** @param {HashFnFrame} f @param {FixedHash} fn @param {number} a @param {number} b */
  describe(f, fn, a, b) {
    const k = f.key;
    switch (f.kind) {
      case 'start':
        return `Hai biểu đồ rỗng, mỗi biểu đồ 16 ngăn. Trái: ${FIXED_NAMES[fn]}. Phải: băm phổ quát với a = ${a}, b = ${b}.`;
      case 'hash': {
        const left =
          fn === 'mod' ? `${k} mod 16 = ${f.lb}` : `⌊16 · frac(${k} · 0.618…)⌋ = ${f.lb}`;
        return `Khoá ${k}: ${left}; ((${a}·${k} + ${b}) mod 1009) mod 16 = ${f.rb}.`;
      }
      case 'count':
        return `Ngăn ${f.lb} bên trái giờ có ${f.left[f.lb]} khoá; ngăn ${f.rb} bên phải có ${f.right[f.rb]} khoá.`;
      case 'done':
        return `Đã băm ${f.n} khoá. Số cặp va chạm: ${f.leftPairs} với hàm băm cố định, ${f.rightPairs} với hàm băm phổ quát.`;
    }
  },

  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Băm các khoá 0, 16, 32, 48 và 64 bằng k mod 16. Có bao nhiêu cặp va chạm?',
      answer: 10,
      unit: 'cặp',
      hints: ['Cả năm khoá đều rơi vào cùng một ngăn.', 'Đếm số cặp trong 5 khoá: C(5, 2).'],
      solution:
        'Khoá nào cũng là bội của 16, nên cả năm đều rơi vào ngăn 0, và mọi cặp đều va chạm: C(5, 2) = 5 · 4 / 2 = 10. Nạp bộ “Tấn công” với 5 khoá để kiểm tra.',
    },
    {
      type: 'number',
      prompt: 'Với a = 3, b = 5, p = 1009 và m = 16, khoá 100 vào ngăn nào?',
      answer: 1,
      hints: ['Trước hết tính 3 · 100 + 5 = 305, rồi lấy mod 1009, rồi lấy mod 16.'],
      solution:
        '305 mod 1009 = 305, và 305 = 19 · 16 + 1, nên khoá vào ngăn 1. Gõ a = 3 và b = 5 rồi đi tới một khoá để thấy đúng phép tính này.',
    },
    {
      type: 'number',
      prompt:
        'Băm phổ quát đặt 32 khoá vào 16 ngăn. Số cặp va chạm kì vọng nhiều nhất là bao nhiêu?',
      answer: 31,
      unit: 'cặp',
      hints: ['Có C(32, 2) cặp, và mỗi cặp va chạm với xác suất không quá 1/16.'],
      solution:
        'C(32, 2) = 32 · 31 / 2 = 496 cặp, mỗi cặp va chạm với xác suất không quá 1/16, nên kì vọng không quá 496/16 = 31 cặp. Nếu cả 32 khoá chung một ngăn thì sẽ là đủ 496 cặp.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao a và b được rút ngẫu nhiên lúc tạo bảng, thay vì cố định sẵn trong mã?',
      options: [
        'Số ngẫu nhiên làm phép tính nhanh hơn',
        'Để không bộ khoá nào chọn trước là xấu tính trung bình: kẻ tấn công không biết được khoá nào sẽ va chạm',
        'Để bảng không bao giờ có va chạm',
      ],
      answer: 1,
      hints: ['Nghĩ về các khoá tấn công: ai chọn chúng, và chọn lúc nào?'],
      solution:
        'Hàm cố định nào cũng có một bộ khoá xấu. Rút hàm ngẫu nhiên sau khi các khoá đã cố định khiến mọi cặp va chạm với xác suất không quá 1/m, nên chi phí kì vọng là O(1 + α) với mọi đầu vào. Va chạm vẫn xảy ra, chỉ là hiếm.',
    },
  ],
};
