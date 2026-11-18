/** @typedef {import('$lib/algo-engine/load-factor-rehashing.js').LoadFrame} LoadFrame */
/** @typedef {import('$lib/algo-engine/load-factor-rehashing.js').Growth} Growth */
/** @typedef {import('$lib/algo-engine/load-factor-rehashing.js').Threshold} Threshold */

/** @param {number} x */
const fixed2 = (x) => x.toFixed(2);

/** @type {Record<Growth, string>} */
const GROWTH_TEXT = { double: 'gấp đôi m', add: 'thêm 4 bucket' };

export const vi = {
  slug: 'load-factor-rehashing',
  topic: 'structures',
  level: 'Trung bình',
  title: 'Hệ số tải và rehash',
  intro:
    'Hệ số tải (load factor) α = n/m, tức số khoá trên mỗi bucket (ngăn), quyết định một chuỗi hay một dải dò dài bao nhiêu. Bảng giữ α nhỏ bằng cách lớn lên: khi α vượt một ngưỡng, bảng cấp phát thêm bucket và rehash (băm lại) mọi khoá vào đó. Một lần đổi kích thước thì tốn, nhưng nếu bảng gấp đôi, tổng chi phí vẫn chỉ là O(1) cho mỗi lần chèn.',
  summary:
    'Chèn khoá vào một bảng móc nối, xem đồng hồ hệ số tải vượt ngưỡng và kích hoạt rehash, rồi so sánh chi phí khấu hao của cách gấp đôi với cách thêm một số bucket cố định.',
  instruction:
    'Chọn số khoá cần chèn, ngưỡng đổi kích thước và quy tắc mở rộng, rồi đi từng bước. Mỗi lần đồng hồ vượt ngưỡng, bảng lớn lên và mọi khoá lần lượt được dời. Biểu đồ cột cho biết mỗi lần chèn tốn bao nhiêu bước: hãy để ý các cột vọt lên và giá trị trung bình.',
  takeaways: [
    'Hệ số tải α = n/m là độ dài trung bình của một chuỗi. Với móc nối, phép tìm tốn O(1 + α), nên bảng phải giữ α bị chặn.',
    'Khi α vượt ngưỡng, bảng cấp phát các bucket mới và rehash mọi khoá: k mod m thay đổi khi m thay đổi, nên không khoá nào được ở nguyên chỗ cũ.',
    'Một lần đổi kích thước dời cả n khoá, nhưng gấp đôi khiến việc đổi kích thước hiếm khi xảy ra: tổng số lần dời là n/2 + n/4 + … < 2n, nên n lần chèn tốn dưới 3n bước, tức O(1) khấu hao mỗi lần.',
    'Thêm cố định 4 bucket thì cứ vài lần chèn lại phải đổi kích thước, và mỗi lần đổi dời toàn bộ khoá đang có, nên số lần dời tăng như n²: trung bình O(n) mỗi lần chèn.',
    'Ngưỡng thấp hơn cho chuỗi ngắn hơn nhưng tốn bộ nhớ hơn. Chọn 32 lần chèn và chuyển qua lại giữa “Gấp đôi” và “Thêm 4”, rồi thử “Không bao giờ” và xem chuỗi dài nhất.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Chèn, không đổi kích thước', 'O(1)', 'Trung bình: hash một lần rồi nối vào một chuỗi ngắn.'],
    ['Một lần đổi kích thước', 'O(n)', 'Mọi khoá được rehash vào bảng mới.'],
    [
      'n lần chèn, gấp đôi',
      'O(n)',
      'Tính tổng, nên mỗi lần chèn tốn O(1) khấu hao: số lần dời tạo thành một cấp số nhân nhỏ hơn 2n.',
    ],
    [
      'n lần chèn, thêm 4',
      'O(n²)',
      'Tính tổng: cứ vài lần chèn lại đổi kích thước một lần, mỗi lần dời mọi khoá đang có.',
    ],
    ['Bộ nhớ', 'O(n + m)', 'Khi gấp đôi, m luôn chỉ lớn hơn n một hằng số lần.'],
  ],
  nextTeaser:
    'Bài tiếp theo, Thiết kế hàm hash, tìm hiểu điều gì làm một hàm hash rải khoá đều và vì sao chọn hàm ngẫu nhiên lại an toàn.',

  countLabel: 'Số lần chèn',
  thresholdLabel: 'Ngưỡng đổi kích thước',
  thresholds: { 0.5: '0.5', 0.75: '0.75', 1: '1', never: 'Không bao giờ' },
  growthLabel: 'Cách mở rộng',
  growths: { double: 'Gấp đôi', add: 'Thêm 4' },
  gaugeLabel: 'Hệ số tải',
  /** @param {number} n @param {number} m @param {Threshold} t */
  gaugeText: (n, m, t) =>
    `α = ${n}/${m} = ${fixed2(n / m)}${t === null ? ', không bao giờ đổi kích thước' : `, ngưỡng ${t}`}`,
  gaugeOver: 'vượt ngưỡng',
  thresholdMark: 'ngưỡng',
  bucketsLabel: 'Các bucket',
  bucketPrefix: 'Bucket',
  emptyBucket: 'trống',
  /** @param {number} to */
  growingTo: (to) => `Đang rehash vào ${to} bucket`,
  pendingTitle: 'Chờ được dời',
  pendingEmpty: 'không còn',
  costsLabel: 'Số bước mỗi lần chèn đã tốn',
  /** @param {number[]} costs */
  costsAria: (costs) =>
    costs.length === 0
      ? 'Chưa chèn lần nào.'
      : `Số bước của từng lần chèn, theo thứ tự: ${costs.join(', ')}.`,
  /** @param {number} work @param {number} n */
  average: (work, n) =>
    n === 0 ? 'Trung bình: –' : `Trung bình: ${work}/${n} = ${fixed2(work / n)} bước mỗi lần chèn`,
  stats: {
    n: 'Số khoá n',
    m: 'Số bucket m',
    work: 'Tổng số bước',
    perInsert: 'Số bước mỗi lần chèn',
    grows: 'Số lần đổi kích thước',
    longest: 'Chuỗi dài nhất',
  },
  none: '–',
  legend: {
    active: 'Vừa chèn',
    frontier: 'Vừa được dời khi rehash',
    swap: 'Lần chèn phải trả giá cho một lần đổi kích thước',
  },
  marks: { active: '+', frontier: '→', swap: '!' },
  chipStates: { active: 'vừa chèn', frontier: 'vừa được dời' },

  /** @param {LoadFrame} f @param {Threshold} t @param {Growth} g */
  describe(f, t, g) {
    switch (f.kind) {
      case 'start':
        return t === null
          ? 'Một bảng rỗng có 4 bucket và không bao giờ đổi kích thước.'
          : `Một bảng rỗng có 4 bucket. Bảng lớn lên bằng cách ${GROWTH_TEXT[g]} khi α vượt ${t}.`;
      case 'insert':
        return `Chèn ${f.key} vào chuỗi ${f.key} mod ${f.m} = ${f.bucket}. Giờ n = ${f.n}. Tốn một bước.`;
      case 'check':
        if (t === null)
          return `α = ${f.n}/${f.m} = ${fixed2(f.load)}. Bảng này không bao giờ đổi kích thước, nên các chuỗi cứ dài thêm.`;
        return f.over
          ? `α = ${f.n}/${f.m} = ${fixed2(f.load)} > ${t}: đến lúc mở rộng.`
          : `α = ${f.n}/${f.m} = ${fixed2(f.load)} ≤ ${t}: chưa cần đổi kích thước.`;
      case 'grow':
        return `Cấp phát ${f.nextM} bucket bằng cách ${GROWTH_TEXT[g]}. Cả ${f.n} khoá phải dời, vì k mod ${f.nextM} khác k mod ${f.m}.`;
      case 'move':
        return `Dời ${f.moved} sang chuỗi ${f.moved} mod ${f.m} = ${f.movedTo}. Còn ${f.pending.length} khoá đang chờ.`;
      case 'rehashed': {
        const cost = f.costs[f.costs.length - 1];
        return `Đã rehash xong: α giảm còn ${f.n}/${f.m} = ${fixed2(f.load)}. Lần chèn này tốn 1 + ${cost - 1} = ${cost} bước.`;
      }
      case 'done':
        return f.n === 0
          ? 'Chưa chèn khoá nào.'
          : `${f.n} lần chèn tốn ${f.work} bước, có ${f.grows} lần đổi kích thước: trung bình ${fixed2(f.work / f.n)} bước mỗi lần chèn.`;
    }
  },

  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Một bảng móc nối chứa 12 khoá trong 16 bucket. Hệ số tải α của nó bằng bao nhiêu?',
      answer: 0.75,
      tolerance: 0.001,
      hints: ['α = n / m.'],
      solution: 'α = n/m = 12/16 = 0.75: trung bình mỗi bucket có ba phần tư khoá.',
    },
    {
      type: 'number',
      prompt:
        'Bắt đầu với 4 bucket, gấp đôi khi α > 0.75, và chèn 24 khoá. Tổng cộng các lần đổi kích thước dời bao nhiêu khoá?',
      answer: 24,
      unit: 'khoá',
      hints: [
        'Bảng lớn lên khi n = 4 (4/4 > 0.75), n = 7 (7/8) và n = 13 (13/16).',
        'Mỗi lần đổi kích thước dời mọi khoá đang có lúc đó.',
      ],
      solution:
        'Bảng đổi kích thước khi n = 4, 7 và 13, dời 4 + 7 + 13 = 24 khoá. Cộng 24 lần chèn là 48 bước, đúng 2 bước mỗi lần chèn. Chọn 24 lần chèn, ngưỡng 0.75 và “Gấp đôi” để kiểm tra.',
    },
    {
      type: 'number',
      prompt:
        'Bắt đầu với 4 bucket, thêm 4 bucket khi α > 1, và chèn 20 khoá. Tổng cộng các lần chèn tốn bao nhiêu bước, nếu tính 1 bước cho mỗi lần chèn và 1 bước cho mỗi khoá bị dời?',
      answer: 64,
      unit: 'bước',
      hints: [
        'Bảng đổi kích thước khi n = 5, 9, 13 và 17.',
        'Cộng 20 lần chèn với số khoá bị dời.',
      ],
      solution:
        'Các lần đổi kích thước dời 5 + 9 + 13 + 17 = 44 khoá, nên tổng là 20 + 44 = 64 bước, tức 3,2 bước mỗi lần chèn, và trung bình này còn tăng theo n. Chọn 20 lần chèn, ngưỡng 1 và “Thêm 4” để kiểm tra.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao đổi kích thước kiểu gấp đôi chỉ tốn O(1) khấu hao mỗi lần chèn, dù một lần đổi tốn O(n)?',
      options: [
        'Mỗi lần đổi kích thước chỉ dời những khoá bị va chạm',
        'Sau một lần đổi kích thước dời n khoá, phải có khoảng n lần chèn rẻ nữa mới tới lần đổi tiếp theo, và chúng trả cho các lần dời đó',
        'Rehash không phụ thuộc vào số lượng khoá',
      ],
      answer: 1,
      hints: ['Khi m gấp đôi, giữa hai lần đổi kích thước có bao nhiêu lần chèn?'],
      solution:
        'Một lần đổi kích thước dời mọi khoá, nhưng gấp đôi để lại chỗ cho rất nhiều lần chèn rẻ trước lần đổi tiếp theo. Số lần dời tạo thành chuỗi n + n/2 + n/4 + … < 2n, nên n lần chèn tốn dưới 3n bước.',
    },
  ],
};
