/** @typedef {import('$lib/algo-engine/longest-increasing-subsequence.js').LisFrame} LisFrame */
/** @typedef {import('$lib/algo-engine/longest-increasing-subsequence.js').LisMethod} LisMethod */

/** @param {number} n */
const num = (n) => String(n).replace('-', '−');
export const vi = {
  slug: 'longest-increasing-subsequence',
  topic: 'dynamic-programming',
  level: 'Trung bình',
  title: 'Dãy con tăng dài nhất',
  intro:
    'Một dãy con giữ lại một số giá trị theo đúng thứ tự ban đầu, không nhất thiết phải đứng cạnh nhau. Dãy con tăng dài nhất (LIS) là dãy con dài nhất có các giá trị tăng ngặt. Lời giải QHĐ kinh điển đặt L[i] là độ dài dãy con tăng dài nhất kết thúc ở a[i] và xét mọi j phía trước, tốn O(n²); cách sắp xếp kiểu xếp bài (patience sorting) chia các giá trị lên các chồng và tìm chồng cho mỗi giá trị bằng tìm kiếm nhị phân, tốn O(n log n).',
  summary:
    'Tìm dãy con tăng dài nhất bằng QHĐ O(n²), rồi bằng các chồng bài của cách xếp bài cùng tìm kiếm nhị phân, và dựng lại dãy con ở cuối.',
  instruction:
    'Chạy từng bước QHĐ O(n²) và xem L[i] tăng mỗi khi một giá trị nhỏ hơn ở phía trước nối dài được một dãy. Sau đó chuyển sang cách xếp bài: mỗi giá trị được đặt lên chồng trái nhất có lá trên cùng lớn hơn hoặc bằng nó, và số chồng chính là đáp án. So sánh số phép so sánh của hai cách trên cùng một đầu vào.',
  methodLabel: 'Cách làm',
  methods: { dp: 'QHĐ O(n²)', patience: 'Xếp bài' },
  valuesLabel: 'Dãy số',
  exampleButton: 'Nạp ví dụ',
  /** @param {number} max @param {number} abs */
  valueErrors: (max, abs) => ({
    format: 'Hãy gõ các số nguyên cách nhau bởi dấu phẩy hoặc dấu cách, ví dụ 3, 1, 4, 1, 5.',
    count: `Hãy gõ từ 1 đến ${max} số.`,
    range: `Mỗi số phải nằm trong khoảng từ −${abs} đến ${abs}.`,
  }),
  sequenceTitle: 'Dãy số',
  /** @param {number[]} v */
  sequenceAria: (v) => `Dãy số ${v.map(num).join(', ')}.`,
  /** @param {number} i @param {number} v @param {string} state */
  valueLabel: (i, v, state) => `a[${i}] = ${num(v)}${state ? `, ${state}` : ''}`,
  states: {
    current: 'đang xét',
    compare: 'đang so sánh',
    lis: 'thuộc dãy con dựng lại',
    extend: 'nối dài dãy',
  },
  tableTitle: 'L và prev (p)',
  tableAria: 'Với mỗi chỉ số: độ dài dãy con tăng dài nhất kết thúc ở đó và chỉ số đứng trước nó.',
  rowHeaders: ['L', 'p'],
  noPrev: '–',
  /** @param {number} i @param {number|null} L @param {number} prev @param {string} state */
  tableCell: (i, L, prev, state) =>
    `Chỉ số ${i}: ${L === null ? 'chưa tới' : `L = ${L}, prev = ${prev < 0 ? 'không có' : prev}`}${state ? `, ${state}` : ''}`,
  pilesTitle: 'Các chồng',
  pilesEmpty: 'Chưa có chồng nào.',
  /** @param {number} k */
  pileName: (k) => `Chồng ${k}`,
  /** @param {number} k @param {number[]} v @param {string} state */
  pileAria: (k, v, state) =>
    `Chồng ${k}, từ dưới lên trên: ${v.map(num).join(', ')}${state ? `, ${state}` : ''}.`,
  pileStates: { probe: 'lá trên cùng đang được so sánh', placed: 'vừa nhận giá trị' },
  topsTitle: 'Lá trên cùng của các chồng (tìm kiếm nhị phân)',
  topsAria: 'Lá trên cùng của mỗi chồng, từ trái sang phải; chúng luôn tăng dần.',
  topsEmpty: 'Chưa có lá trên cùng nào.',
  pointers: { i: 'i', j: 'j', lo: 'lo', hi: 'hi', mid: 'mid' },
  legend: {
    current: 'Đang xét',
    compare: 'Đang so sánh',
    extend: 'Nối dài dãy',
    lis: 'Thuộc LIS dựng lại',
  },
  markers: { current: '▶', compare: '?', extend: '+', lis: '★' },
  stats: {
    comparisons: 'Số lần so sánh',
    length: 'Độ dài LIS',
  },
  lisTitle: 'Dãy con dựng lại',
  lisEmpty: 'Được dựng lại khi chạy xong.',
  /** @param {LisFrame} f */
  describe(f) {
    const a = f.values;
    const v = (/** @type {number} */ k) => num(a[k]);
    switch (f.kind) {
      case 'start':
        return f.method === 'dp'
          ? `Tìm LIS của ${a.length} giá trị. L[i] sẽ là độ dài dãy con tăng dài nhất kết thúc ở a[i].`
          : `Chia ${a.length} giá trị lên các chồng, lần lượt từ trái sang phải. Mỗi giá trị được đặt lên chồng trái nhất có lá trên cùng lớn hơn hoặc bằng nó, nên không chồng nào tăng từ dưới lên trên, còn các lá trên cùng tăng từ trái sang phải.`;
      case 'begin':
        return `Chỉ số ${f.i}, giá trị ${v(f.i)}: riêng nó là một dãy dài 1, nên L[${f.i}] = 1. Giờ ta xét mọi giá trị phía trước.`;
      case 'compare': {
        const why =
          a[f.j] >= a[f.i]
            ? `${v(f.j)} không nhỏ hơn ${v(f.i)}, nên không thể đứng trước nó`
            : `${v(f.j)} < ${v(f.i)}, nhưng L[${f.j}] + 1 = ${(f.L[f.j] ?? 0) + 1} không vượt được L[${f.i}] = ${f.L[f.i]}`;
        return `So sánh a[${f.j}] = ${v(f.j)} với a[${f.i}] = ${v(f.i)}: ${why}.`;
      }
      case 'extend':
        return `${v(f.j)} < ${v(f.i)}, nên ${v(f.i)} có thể đứng sau dãy kết thúc ở chỉ số ${f.j}: L[${f.i}] = L[${f.j}] + 1 = ${f.L[f.i]}, prev[${f.i}] = ${f.j}.`;
      case 'best':
        return `Đã biết mọi L[i]. Lớn nhất là L[${f.i}] = ${f.L[f.i]}, nên có một dãy con tăng dài nhất kết thúc ở a[${f.i}] = ${v(f.i)}.`;
      case 'take':
        return f.piles.length
          ? `Lấy a[${f.i}] = ${v(f.i)}. Tìm kiếm nhị phân trên ${f.piles.length} lá trên cùng để tìm lá trái nhất ≥ ${v(f.i)}.`
          : `Lấy a[${f.i}] = ${v(f.i)}. Chưa có chồng nào.`;
      case 'probe': {
        const top = a[/** @type {number} */ (f.piles[f.mid].at(-1))];
        return top >= a[f.i]
          ? `Tìm trong các chồng ${f.lo} đến ${f.hi - 1}: lá trên cùng của chồng ${f.mid} là ${num(top)} ≥ ${v(f.i)}, nên đáp án là chồng ${f.mid} hoặc một chồng bên trái nó.`
          : `Tìm trong các chồng ${f.lo} đến ${f.hi - 1}: lá trên cùng của chồng ${f.mid} là ${num(top)} < ${v(f.i)}, nên ta tìm ở bên phải nó.`;
      }
      case 'newpile':
        return f.pile === 0
          ? `Mở chồng 0 với ${v(f.i)}.`
          : `Mọi lá trên cùng đều nhỏ hơn ${v(f.i)}: mở chồng ${f.pile} ở bên phải. Nó trỏ ngược về ${v(f.prev[f.i])}, lá trên cùng của chồng ${f.pile - 1}, nên giờ có một dãy dài ${f.pile + 1} kết thúc ở ${v(f.i)}.`;
      case 'place':
        return f.pile === 0
          ? `Đặt ${v(f.i)} lên chồng 0: nó là lá trên cùng nhỏ nhất mới.`
          : `Đặt ${v(f.i)} lên chồng ${f.pile}, đè lên một lá lớn hơn. Nó trỏ ngược về ${v(f.prev[f.i])}, lá trên cùng của chồng ${f.pile - 1}.`;
      case 'trace':
        return f.method === 'dp'
          ? `Thêm a[${f.i}] = ${v(f.i)} vào đầu dãy con, rồi theo prev[${f.i}]${f.prev[f.i] < 0 ? ': không có, nên dãy bắt đầu từ đây' : ` tới chỉ số ${f.prev[f.i]}`}.`
          : `Thêm ${v(f.i)} vào đầu dãy con, rồi theo con trỏ ngược của nó${f.prev[f.i] < 0 ? ': không có, nên dãy bắt đầu từ đây' : ` tới ${v(f.prev[f.i])}`}.`;
      case 'done':
        return `LIS có độ dài ${f.length}: ${f.lis.map(v).join(', ')}. Mất ${f.comparisons} lần so sánh${f.method === 'patience' ? `, và ${f.piles.length} chồng khớp với độ dài đó` : ''}.`;
    }
  },
  takeaways: [
    'L[i], độ dài dãy con tăng dài nhất kết thúc ở a[i], bằng 1 cộng L[j] lớn nhất trên các j phía trước có a[j] < a[i]. Chính việc cố định điểm kết thúc giúp các bài toán con liên hệ được với nhau.',
    'Đáp án là L[i] lớn nhất, không phải L[n − 1]: dãy tốt nhất có thể kết thúc ở bất kì đâu. prev[i] cho phép lần ngược để dựng lại nó.',
    'Xét mọi j phía trước tốn n(n − 1)/2 phép so sánh: O(n²).',
    'Cách xếp bài giữ các lá trên cùng tăng dần, nên tìm kiếm nhị phân tìm ra chồng của mỗi giá trị trong O(log n). Số chồng bằng độ dài LIS, và các con trỏ ngược về chồng bên trái dựng lại được một LIS.',
    'Nạp ví dụ và so sánh hai cách: 45 phép so sánh so với 17. Sau đó gõ một dãy giảm như 9, 7, 5, 3, 1 và xem mọi giá trị dồn về một chồng.',
  ],
  complexityHead: ['Cách làm', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'QHĐ O(n²), thời gian',
      'O(n²)',
      'Mỗi i so sánh với cả i giá trị phía trước: tổng cộng n(n − 1)/2.',
    ],
    [
      'Xếp bài, thời gian',
      'O(n log n)',
      'n giá trị, mỗi giá trị được đặt nhờ một lần tìm kiếm nhị phân trên tối đa n lá trên cùng.',
    ],
    [
      'Bộ nhớ, cả hai cách',
      'O(n)',
      'L và prev, hoặc các chồng và con trỏ ngược, giữ một mục cho mỗi giá trị.',
    ],
    ['Dựng lại LIS', 'O(độ dài)', 'Theo prev hoặc các con trỏ ngược từ giá trị cuối của dãy.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Dãy con tăng dài nhất của 3, 1, 4, 1, 5, 9, 2, 6 dài bao nhiêu?',
      answer: 4,
      hints: [
        'Gõ dãy số rồi chạy một trong hai cách đến bước cuối.',
        'Thử 1, 4, 5, 9 hoặc 3, 4, 5, 6.',
      ],
      solution:
        'L = 1, 1, 2, 1, 3, 4, 2, 4. Lớn nhất là 4, ví dụ 3, 4, 5, 9. Không có dãy nào dài 5: cách xếp bài kết thúc với 4 chồng.',
    },
    {
      type: 'number',
      prompt: 'Cách xếp bài tạo ra bao nhiêu chồng cho dãy 5, 2, 8, 6, 3, 6, 9, 7?',
      answer: 4,
      unit: 'chồng',
      hints: ['Chuyển sang cách xếp bài, gõ dãy số rồi chạy đến bước cuối.'],
      solution:
        'Các chồng cuối cùng là [5, 2], [8, 6, 3], [6], [9, 7]: 4 chồng, nên LIS dài 4, ví dụ 2, 3, 6, 7.',
    },
    {
      type: 'number',
      prompt: 'QHĐ O(n²) làm bao nhiêu phép so sánh trên 10 giá trị?',
      answer: 45,
      unit: 'phép so sánh',
      hints: ['Chỉ số i được so sánh với i giá trị đứng trước nó.'],
      solution: '0 + 1 + 2 + … + 9 = 10·9/2 = 45, dù các giá trị là gì.',
    },
    {
      type: 'choice',
      prompt:
        'Cách xếp bài đặt một giá trị lên chồng trái nhất có lá trên cùng ≥ giá trị đó. Vì sao dùng ≥ mà không dùng >?',
      options: [
        'Để tìm kiếm nhị phân nhanh hơn.',
        'Khi đó một giá trị bằng nhau sẽ đè lên lá đó thay vì mở chồng mới bên phải, nên các giá trị bằng nhau không bao giờ nối dài nhau: dãy con vẫn tăng ngặt.',
        'Không ảnh hưởng gì tới đáp án.',
        'Để mọi chồng cao bằng nhau.',
      ],
      answer: 1,
      hints: ['Gõ 2, 2, 2 rồi đếm số chồng.'],
      solution:
        'Với ≥, một giá trị chỉ mở chồng mới khi nó lớn hơn mọi lá trên cùng, và con trỏ ngược của nó trỏ tới một lá nhỏ hơn hẳn nó, nên mọi dãy dựng lại đều tăng ngặt. Với 2, 2, 2, mỗi số 2 đè lên số trước và chỉ có một chồng. Với >, mỗi số 2 sẽ mở một chồng mới bên phải chồng trước, và ta sẽ tính dãy con không giảm dài nhất.',
    },
    {
      type: 'multi',
      prompt: 'Những khẳng định nào về các chồng luôn đúng trong lúc xếp bài?',
      options: [
        'Các lá trên cùng tăng dần từ trái sang phải.',
        'Không chồng nào tăng từ dưới lên trên.',
        'Các lá trên cùng, đọc từ trái sang phải, tạo thành một LIS.',
        'Số chồng bằng độ dài LIS tính đến lúc đó.',
      ],
      answers: [0, 1, 3],
      hints: [
        'Nạp ví dụ và nhìn các lá trên cùng sau khi chia số 3: 3, 21, 33, 41, 60, 80 có phải là một dãy con theo thứ tự ban đầu không?',
      ],
      solution:
        'Một giá trị chỉ đè lên lá lớn hơn hoặc bằng nó, nên không chồng nào tăng và các lá trên cùng tăng ngặt, còn chồng mới xuất hiện đúng khi một giá trị vượt mọi lá trên cùng. Nhưng các lá trên cùng không nhất thiết theo thứ tự trong dãy: ở cuối ví dụ, lá trên cùng của chồng 0 là 3, giá trị cuối cùng. Vì thế ta cần con trỏ ngược để dựng lại LIS.',
    },
  ],
  nextTeaser:
    'Bài sau, Dãy con chung dài nhất và khoảng cách sửa, chuyển sang bảng hai chiều để so sánh hai xâu với nhau.',
};
