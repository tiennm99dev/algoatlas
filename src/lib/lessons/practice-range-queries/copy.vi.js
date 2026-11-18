/** @typedef {import('$lib/algo-engine/practice-range-queries.js').StructureId} StructureId */
/** @typedef {import('$lib/algo-engine/practice-range-queries.js').WorkloadFrame} WorkloadFrame */
/** @typedef {import('$lib/algo-engine/practice-range-queries.js').WorkloadOp} WorkloadOp */

/** @type {Record<StructureId, string>} */
const NAMES = {
  plain: 'Mảng thường',
  prefix: 'Prefix sum',
  sparse: 'Sparse table',
  fenwick: 'Fenwick tree',
  segment: 'Segment tree',
  sqrt: 'Chia căn',
};

const IDS = /** @type {StructureId[]} */ (Object.keys(NAMES));

/** A count in programming notation, so a typed copy of it is a valid answer. @param {number} x */
const count = (x) => String(x);

/** @param {string[]} parts */
const list = (parts) =>
  parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} và ${parts.at(-1)}`;

/** @param {WorkloadOp} op */
function opText(op) {
  if (op.type === 'set') return `Gán a[${op.i}] = ${op.v}`;
  return `${op.type === 'sum' ? 'Tổng' : 'Giá trị nhỏ nhất'} của a[${op.l}..${op.r}]`;
}

export const vi = {
  slug: 'practice-range-queries',
  topic: 'range-queries',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán truy vấn đoạn',
  intro:
    'Không có cấu trúc truy vấn đoạn nào thắng ở mọi nơi. Cấu trúc phù hợp phụ thuộc vào tập thao tác: mảng có thay đổi không, em cần tổng hay giá trị nhỏ nhất, các đoạn dài bao nhiêu và có bao nhiêu truy vấn. Hãy dựng một tập thao tác ở đây, chạy nó qua sáu cấu trúc và đếm xem mỗi cấu trúc thật sự chạm tới bao nhiêu số.',
  summary:
    'Dựng một tập thao tác gồm tổng trên đoạn, min trên đoạn và gán điểm, rồi so chi phí của mảng thường, prefix sum, sparse table, Fenwick tree, segment tree và chia căn.',
  instruction:
    'Chọn một bộ có sẵn hoặc tự đặt số lượng thao tác và kích thước mảng, tổng chi phí hiện ra ngay. Lùi lại hoặc tua về đầu để xem từng thao tác một, và tự gõ thao tác để thử riêng một trường hợp. Dùng hình tương tác để trả lời các câu hỏi bên dưới.',
  sizeLabel: 'Kích thước mảng n',
  sumsLabel: 'Tổng trên đoạn',
  minsLabel: 'Min trên đoạn',
  setsLabel: 'Gán điểm',
  rangesLabel: 'Độ dài đoạn',
  rangeSizes: { any: 'Bất kì', short: 'Tối đa 8', long: 'Ít nhất n / 2' },
  newRanges: 'Đoạn mới',
  presetLabel: 'Bộ có sẵn',
  presetPlaceholder: 'Nạp một bộ có sẵn…',
  presets: {
    staticSums: 'Tổng, mảng không đổi',
    sumsAndSets: 'Tổng và gán',
    staticMins: 'Min, mảng không đổi',
    minsAndSets: 'Min và gán',
    everything: 'Tổng, min và gán',
    shortRanges: 'Đoạn ngắn và gán',
  },
  opsLabel: 'Các thao tác',
  opsAria:
    'Các thao tác: s cho tổng trên đoạn, m cho min trên đoạn, mỗi thao tác kèm một đoạn như 2-9, hoặc u cho phép gán, như u4=50.',
  opsHelp: 's tổng, m min, u gán, chỉ số từ 0 và tính cả hai đầu: s2-9 m0-5 u4=50',
  run: 'Chạy',
  sizeError: 'Kích thước mảng phải là số nguyên từ 4 đến 1024.',
  sizeTooSmall:
    'Một số thao tác đã gõ vượt quá kích thước đó. Hãy sửa chúng trước, hoặc nạp một bộ có sẵn.',
  countError: 'Mỗi số lượng phải là số nguyên, tổng cộng từ 1 đến 300 thao tác.',
  opErrors: {
    empty: 'Hãy gõ ít nhất một thao tác.',
    format: 'Hãy viết mỗi thao tác như s2-9 (tổng), m2-9 (min) hoặc u4=50 (gán).',
    count: 'Hãy dùng tối đa 300 thao tác.',
    range: 'Đoạn phải đi từ trái sang phải và mọi chỉ số phải nằm trong mảng.',
    value: 'Giá trị mới phải từ 0 đến 99.',
  },
  structures: NAMES,
  costTitle: 'Số lần chạm đến giờ',
  costHelp:
    'Một lần chạm là đọc hoặc ghi một số đã lưu, hoặc thăm một nút của cây. Xem giá trị hiện tại của a[i] thì không tính.',
  barBuild: 'dựng',
  barWork: 'thao tác',
  barCut: 'thanh bị cắt ở mức gấp ba tổng rẻ nhất',
  barCutMark: '»',
  cheapestMark: '★',
  cheapestWord: 'rẻ nhất',
  outMark: '✕',
  outWord: 'bị loại',
  /** @type {Record<StructureId, string>} */
  outWhy: {
    plain: '',
    prefix: 'không thể trừ đi để ra giá trị nhỏ nhất',
    sparse: 'các khối chồng nhau sẽ tính một số ô hai lần trong tổng',
    fenwick: 'Fenwick tree thông thường chỉ trừ các tiền tố',
    segment: '',
    sqrt: '',
  },
  stats: {
    thisOp: 'thao tác này',
    worst: 'xấu nhất',
    build: 'dựng',
    work: 'thao tác',
    slots: 'số đã lưu',
    size: 'Kích thước mảng',
    ops: 'Số thao tác',
    answer: 'Đáp án',
    cheapest: 'Rẻ nhất',
  },
  noValue: '—',
  rangeTitle: 'Thao tác này rơi vào đâu',
  rangeIdle: 'Bước này không có thao tác nào.',
  rangeRead: 'các ô mà truy vấn phủ',
  rangeWrite: 'ô mà phép gán thay đổi',
  /** @param {WorkloadOp} op */
  rangeCaption(op) {
    if (op.type === 'set') return `${opText(op)}: một ô thay đổi.`;
    return `${opText(op)}: ${count(op.r - op.l + 1)} ô.`;
  },
  /** @param {WorkloadOp} op @param {number} n */
  rangeLabel: (op, n) => `${opText(op)} trong một mảng ${count(n)} ô.`,
  opsTitle: 'Tập thao tác, quanh bước này',
  opsEmpty: 'không có',
  opsHotLabel: 'thao tác hiện tại',
  /** @param {WorkloadFrame} f */
  describe(f) {
    const stats = f.stats;
    if (f.kind === 'start') {
      return `${count(f.n)} ô và chưa dựng gì. Bấm bước tiếp theo để dựng mọi cấu trúc.`;
    }
    if (f.kind === 'build') {
      return `Đã dựng, tính bằng số lần chạm: ${IDS.map((id) => `${NAMES[id]} ${count(stats[id].build)}`).join(', ')}.`;
    }
    if (f.kind === 'done') {
      const best = stats[f.cheapest[0]].total;
      const out = IDS.filter((id) => stats[id].out).map((id) => NAMES[id]);
      const left = out.length > 0 ? ` Bị loại: ${list(out)}.` : '';
      return `Rẻ nhất: ${list(f.cheapest.map((id) => NAMES[id]))} với ${count(best)} lần chạm.${left}`;
    }
    const op = /** @type {WorkloadOp} */ (f.op);
    const head = f.truth === null ? `${opText(op)}.` : `${opText(op)} bằng ${count(f.truth)}.`;
    const spent = IDS.filter((id) => !stats[id].out).map(
      (id) => `${NAMES[id]} ${count(stats[id].cost)}`,
    );
    const dropped =
      f.dropped.length > 0
        ? ` ${list(f.dropped.map((id) => NAMES[id]))} không trả lời được nên bị loại.`
        : '';
    return `${head} Số lần chạm: ${spent.join(', ')}.${dropped}`;
  },
  takeaways: [
    'Hãy hỏi hai câu trước. Mảng có thay đổi không? Em cần tổng, giá trị nhỏ nhất hay cả hai? Với mảng không bao giờ đổi, prefix sum (tổng tiền tố) và sparse table (bảng thưa) khó bị đánh bại, nhưng phép gán làm hỏng cả hai.',
    'Với tổng kèm gán điểm, hãy chọn Fenwick tree (cây chỉ số nhị phân). Nó tốn O(log n) như segment tree (cây phân đoạn) nhưng đi qua các chuỗi ngắn, nên chạm tới ít hơn nhiều, và chỉ cần một mảng nhỏ cùng vài dòng mã.',
    'Với min trên đoạn kèm gán, hoặc bất cứ thứ gì Fenwick tree không trừ được, hãy chọn segment tree. Nó dùng được với mọi phép gộp, và một cây có thể giữ cả tổng lẫn giá trị nhỏ nhất.',
    'Hằng số và chi phí dựng đều quan trọng. Với mảng nhỏ hoặc đoạn ngắn, mảng thường có thể thắng tất cả, và vài truy vấn có thể không bù lại được chi phí dựng đắt. Kí hiệu O lớn cho biết chi phí tăng thế nào, không cho biết ai thắng ở kích thước đầu vào của em.',
    'Nạp bộ “Min và gán” với n = 1024 và ghi lại cấu trúc thắng, rồi giảm n xuống 16. Sau đó đặt lại n = 1024, nạp “Tổng và gán” và chuyển dần số tổng sang số phép gán: khi còn khoảng 50 tổng, chia căn vượt Fenwick tree.',
  ],
  complexityHead: ['Cấu trúc', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Mảng thường', 'Không cần dựng, truy vấn O(n), gán O(1)', 'Nó đọc mọi ô trong đoạn.'],
    [
      'Prefix sum',
      'Dựng O(n), tổng O(1), gán O(n)',
      'Một tổng là hiệu của hai phần tử, còn một phép gán làm đổi mọi phần tử phía sau.',
    ],
    [
      'Sparse table',
      'Dựng O(n log n), min O(1), gán O(n log n)',
      'Hai khối chồng nhau trả lời được min; cách sửa đơn giản sau một phép gán là dựng lại toàn bộ.',
    ],
    [
      'Fenwick tree',
      'Dựng O(n), tổng O(log n), gán O(log n)',
      'Mỗi lượt đi xoá hoặc cộng bit 1 thấp nhất của chỉ số.',
    ],
    [
      'Segment tree',
      'Dựng O(n), mọi truy vấn O(log n), gán O(log n)',
      'Một đoạn tách thành tối đa hai nút mỗi tầng, và một phép gán ghi lại một đường đi từ gốc.',
    ],
    [
      'Chia căn',
      'Dựng O(n), mọi truy vấn O(√n), gán O(1) với tổng, O(√n) với min',
      'Một truy vấn đọc các ô lẻ và các khối nguyên; sau một phép gán phải đọc lại để tính min của khối.',
    ],
    [
      'Bộ nhớ ngoài mảng',
      'Từ không có gì đến O(n log n)',
      'Chia căn giữ khoảng √n số, prefix sum và hai loại cây giữ O(n), còn sparse table giữ O(n log n).',
    ],
  ],
  nextTeaser:
    'Bài tiếp theo: Trie, cây lưu các xâu theo từng kí tự để tìm theo tiền tố thật nhanh.',
  practiceTitle: 'Bài luyện tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Giữ n = 1024 và nạp bộ “Tổng và gán”, gồm 150 thao tác mỗi loại. Fenwick tree tốn tổng cộng bao nhiêu lần chạm, tính cả khi dựng?',
      answer: 4435,
      unit: 'lần chạm',
      hints: ['Nhảy tới bước cuối và đọc con số trên thẻ của Fenwick tree.'],
      solution:
        'Dựng tốn 2047 lần chạm và 300 thao tác tốn 2388, tổng cộng 4435. Tức khoảng 8 lần chạm mỗi thao tác, gần với log₂ 1024 = 10.',
    },
    {
      type: 'number',
      prompt:
        'Với cùng tập thao tác, segment tree tốn nhiều hơn Fenwick tree bao nhiêu lần chạm? Cả hai đều tốn O(log n) mỗi thao tác.',
      answer: 4154,
      unit: 'lần chạm',
      hints: [
        'Lấy hiệu của hai tổng ở bước cuối.',
        'Ở đây chi phí dựng của hai cây bằng nhau, nên toàn bộ phần chênh lệch đến từ các thao tác.',
      ],
      solution:
        'Segment tree tốn tổng cộng 8589 và Fenwick tree 4435, chênh lệch 4154. Cùng một bậc tăng, nhưng một truy vấn trên segment tree thăm nhiều nút hơn hẳn số ô trên một chuỗi Fenwick.',
    },
    {
      type: 'choice',
      prompt: 'Giữ n = 1024 và nạp bộ “Min và gán”. Cấu trúc nào rẻ nhất?',
      options: ['Mảng thường', 'Sparse table', 'Segment tree', 'Chia căn'],
      answer: 2,
      hints: ['Prefix sum và Fenwick tree đã bị loại. So tổng trên bốn thẻ còn lại.'],
      solution:
        'Segment tree tốn 8589 lần chạm và chia căn 12404. Mảng thường tốn 50480 cho các lần duyệt, còn sparse table hơn 1,3 triệu vì mỗi phép gán trong 150 phép gán đều dựng lại cả 9228 ô.',
    },
    {
      type: 'choice',
      prompt: 'Vẫn nạp bộ “Min và gán” và giảm n xuống 16. Giờ cấu trúc nào rẻ nhất, và vì sao?',
      options: [
        'Segment tree, vì O(log n) luôn thắng O(n)',
        'Mảng thường, vì duyệt vài ô rẻ hơn đi trên cây',
        'Sparse table, vì truy vấn của nó chỉ đọc hai ô',
        'Chia căn, vì mỗi khối chỉ có một ô',
      ],
      answer: 1,
      hints: ['Đọc các tổng khi n = 16. Thẻ nào có dấu sao?'],
      solution:
        'Mảng thường tốn tổng cộng 1075 lần chạm, chia căn 1455 và segment tree 2299. Với 16 ô, một lần duyệt trung bình đọc khoảng 6 ô, còn một truy vấn trên segment tree thăm khoảng 10 nút. Kí hiệu O lớn mô tả tốc độ tăng, không mô tả đầu vào nhỏ.',
    },
    {
      type: 'multi',
      prompt: 'Giữ n = 1024 và nạp bộ “Tổng, min và gán”. Những cấu trúc nào trụ lại tới cuối?',
      options: [
        'Mảng thường',
        'Prefix sum',
        'Sparse table',
        'Fenwick tree',
        'Segment tree',
        'Chia căn',
      ],
      answers: [0, 4, 5],
      hints: ['Một cấu trúc bị loại ở truy vấn đầu tiên nó không trả lời được. Tìm các dấu ✕.'],
      solution:
        'Prefix sum và Fenwick tree không trả lời được min trên đoạn, còn các khối chồng nhau của sparse table không cộng được tổng. Mảng thường, segment tree và chia căn xử lý được cả hai, và segment tree rẻ nhất trong số đó.',
    },
    {
      type: 'number',
      prompt:
        'Giữ n = 1024 và gõ đúng một thao tác u0=5. Fenwick tree tốn bao nhiêu lần chạm cho thao tác này?',
      answer: 11,
      unit: 'lần chạm',
      hints: [
        'Bên trong, cây đếm chỉ số từ 1, nên chỉ số 0 là vị trí 1 của nó. Đi tới bước có thao tác đó và đọc mục “thao tác này”.',
        'Mỗi bước nhảy cộng thêm bit 1 thấp nhất: 1, 2, 4, 8, …',
      ],
      solution:
        'Lượt đi thăm 1, 2, 4, 8, 16, 32, 64, 128, 256, 512 và 1024: 11 lần ghi. Prefix sum tốn 1024 lần ghi cho cùng phép gán đó, vì mọi phần tử trừ phần tử đầu tiên đều đổi.',
    },
    {
      type: 'text',
      prompt:
        'Giữ n = 1024 và nạp bộ “Đoạn ngắn và gán”, trong đó không đoạn nào dài quá 8 ô. Cấu trúc nào thắng?',
      accept: ['mảng thường', 'mảng', 'một mảng thường', 'plain array', 'array'],
      hints: ['So chi phí duyệt tối đa 8 ô với chi phí đi trên một cây.'],
      solution:
        'Mảng thường tốn tổng cộng 863 lần chạm: tối đa 8 lần đọc mỗi truy vấn và một lần ghi mỗi phép gán, không phải dựng gì. Mọi cấu trúc khác còn trụ lại đều tốn nhiều hơn chỉ riêng cho việc dựng.',
    },
  ],
};
