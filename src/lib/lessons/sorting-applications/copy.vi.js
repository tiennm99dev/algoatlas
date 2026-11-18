import { isCorrectMerge, mergedBlocks } from '$lib/algo-engine/sorting-applications.js';

/** @typedef {import('$lib/algo-engine/sorting-applications.js').MergeFrame} MergeFrame */
/** @typedef {import('$lib/algo-engine/sorting-applications.js').DedupFrame} DedupFrame */
/** @typedef {import('$lib/algo-engine/sorting-applications.js').Comparator} Comparator */

/** @param {{start: number, end: number}} x */
const span = (x) => `${x.start}–${x.end}`;

/** @param {number} n @param {string} unit */
const count = (n, unit) => `${n} ${unit}`;

export const vi = {
  slug: 'sorting-applications',
  topic: 'sorting',
  level: 'Trung bình',
  title: 'Ứng dụng của sắp xếp',
  intro:
    'Nhiều bài toán trở nên dễ khi dữ liệu đã được sắp xếp, vì sắp xếp đặt các phần tử liên quan cạnh nhau. Các đoạn chồng lên nhau sẽ đứng kề nhau, nên một lần quét là gộp được chúng; các giá trị bằng nhau đứng kề nhau, nên một lần quét là bỏ được các giá trị lặp lại. Tiêu chí sắp xếp được chọn bằng một hàm so sánh, và chọn sai hàm thì kết quả cũng sai.',
  summary:
    'Gộp các đoạn chồng nhau và loại bỏ giá trị trùng lặp bằng một lần quét sau khi sắp xếp, và xem hàm so sánh quyết định lần quét đó đúng hay sai ra sao.',
  instruction:
    'Ở bài Gộp các đoạn, sửa các đoạn hoặc giữ ví dụ có sẵn, rồi đi từng bước với từng tiêu chí sắp xếp. Trên ví dụ này, chỉ sắp xếp theo điểm đầu mới cho các khối đúng. Ở bài Loại bỏ giá trị trùng, để ý mỗi giá trị được so sánh với phần tử bên trái nó.',
  modeLabel: 'Bài toán',
  modes: { merge: 'Gộp các đoạn', dedup: 'Loại bỏ giá trị trùng' },
  comparatorLabel: 'Sắp xếp theo',
  comparators: { start: 'Điểm đầu', end: 'Điểm cuối', none: 'Không sắp xếp' },
  /** @type {Record<Comparator, string>} */
  comparatorCode: {
    start: 'compare(x, y) = x.start − y.start, bằng nhau thì x.end − y.end',
    end: 'compare(x, y) = x.end − y.end, bằng nhau thì x.start − y.start',
    none: 'không có hàm so sánh: giữ nguyên thứ tự đầu vào',
  },
  comparatorNote:
    'Hàm so sánh trả về số âm khi x đứng trước, 0 khi hai bên ngang nhau, và số dương khi y đứng trước.',
  intervalsLabel: 'Các đoạn (đầu-cuối, giờ 0–24)',
  valuesLabel: 'Các giá trị (0–99)',
  intervalErrors: {
    format: 'Hãy gõ các đoạn dạng đầu-cuối, cách nhau bằng dấu phẩy, ví dụ 1-3, 2-6.',
    range: 'Mỗi đoạn cần có điểm đầu < điểm cuối, với giờ từ 0 đến 24.',
    count: 'Hãy gõ từ 2 đến 8 đoạn.',
  },
  valueErrors: {
    format: 'Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 7, 3, 7.',
    range: 'Mọi giá trị phải nằm trong khoảng 0–99.',
    count: 'Hãy gõ từ 2 đến 14 giá trị.',
  },
  timelineTitle: 'Các đoạn theo thứ tự quét',
  blocksTitle: 'Các khối đã gộp',
  /** @param {{start: number, end: number}[]} list */
  timelineAria: (list) => `Các đoạn theo thứ tự quét: ${list.map(span).join(', ')}.`,
  /** @param {{start: number, end: number}[]} list */
  blocksAria: (list) =>
    list.length === 0 ? 'Chưa có khối nào.' : `Các khối đã gộp: ${list.map(span).join(', ')}.`,
  span,
  /** @param {number} k */
  blockMarker: (k) => `K${k + 1}`,
  valuesTitle: 'Các giá trị theo thứ tự quét',
  outTitle: 'Các giá trị khác nhau',
  valuesAria: 'Các giá trị theo thứ tự quét',
  outAria: 'Các giá trị khác nhau',
  outEmpty: 'chưa có',
  stats: {
    checks: 'Số lần kiểm tra',
    blocks: 'Số khối',
    intervals: 'Số đoạn',
    distinct: 'Số giá trị khác nhau',
    pairs: 'Số cặp, nếu không sắp xếp',
  },
  verdict: {
    right: '✓ gộp đúng',
    wrong: '✕ gộp sai',
  },
  legend: {
    current: 'Đang quét',
    scanned: 'Đã quét',
    open: 'Khối đang mở',
    closed: 'Khối đã xong',
    kept: 'Giữ lại',
    skipped: 'Bỏ qua vì lặp lại',
  },
  markers: { current: '▶', kept: '✓', skipped: '✕', open: '…', closed: '✓' },
  states: { current: 'đang quét', kept: 'giữ lại', skipped: 'bỏ qua' },
  /** @param {number} i @param {number} value @param {string} state */
  cellLabel: (i, value, state) => `Ô ${i}: ${value}${state ? `, ${state}` : ''}`,
  /**
   * @param {MergeFrame} f
   * @param {Comparator} by
   */
  describeMerge(f, by) {
    const x = f.items[f.i];
    const last = f.blocks.at(-1);
    const prev = f.blocks.at(-2);
    switch (f.kind) {
      case 'start':
        return `${f.items.length} đoạn theo thứ tự đầu vào. Lần quét chỉ nhìn thấy khối đang dựng, nên các đoạn chồng nhau phải đến kề nhau.`;
      case 'sorted':
        return by === 'start'
          ? 'Đã sắp xếp theo điểm đầu: giờ một đoạn chỉ có thể chồng lên khối ngay trước nó.'
          : by === 'end'
            ? 'Đã sắp xếp theo điểm cuối. Một đoạn dài bắt đầu sớm giờ có thể đến muộn: để ý xem lần quét có còn bắt được mọi chỗ chồng nhau không.'
            : 'Không sắp xếp: lần quét đọc các đoạn theo thứ tự đầu vào.';
      case 'open':
        return `Mở khối đầu tiên với ${span(x)}.`;
      case 'extend':
        // Without a sort by start, x can end before the block starts: the scan still joins it.
        return last && x.end < last.start
          ? `${span(x)} bắt đầu ở ${x.start}, không sau điểm cuối của khối, nên lần quét gộp nó vào khối. Nhưng nó kết thúc trước khi khối bắt đầu ở ${last.start}: thật ra chúng không chồng nhau, và khối vẫn là ${span(last)}.`
          : `${span(x)} bắt đầu ở ${x.start}, không sau điểm cuối của khối: chúng chồng nhau, nên khối thành ${last ? span(last) : ''}.`;
      case 'new':
        return `${span(x)} bắt đầu ở ${x.start}, sau khi khối kết thúc ở ${prev ? prev.end : ''}: có khoảng trống, nên mở một khối mới.`;
      case 'done': {
        const n = f.blocks.length;
        const head = `${count(n, 'khối')} sau ${count(f.checks, 'lần kiểm tra')}: ${f.blocks.map(span).join(', ')}.`;
        return isCorrectMerge(f.items, f.blocks)
          ? `${head} Đây là cách gộp đúng.`
          : `${head} Sai: cách gộp đúng là ${mergedBlocks(f.items).map(span).join(', ')}. Nếu không sắp xếp theo điểm đầu, lần quét có thể gộp những đoạn không chồng nhau, hoặc bỏ sót chỗ chồng với một khối nó đã đi qua.`;
      }
    }
  },
  /** @param {DedupFrame} f */
  describeDedup(f) {
    const a = f.items;
    const n = a.length;
    switch (f.kind) {
      case 'start':
        return `${n} giá trị. Sắp xếp chúng trước, để các giá trị bằng nhau đứng cạnh nhau.`;
      case 'sorted':
        return `Đã sắp xếp: ${a.join(', ')}. Mỗi giá trị lặp lại giờ đứng ngay sau một bản của chính nó.`;
      case 'keep':
        return f.i === 0
          ? `Giữ a[0] = ${a[0]}: giá trị đầu tiên luôn là giá trị mới.`
          : `a[${f.i}] = ${a[f.i]} khác a[${f.i - 1}] = ${a[f.i - 1]}: giữ lại.`;
      case 'skip':
        return `a[${f.i}] = ${a[f.i]} bằng a[${f.i - 1}]: bỏ qua giá trị lặp lại.`;
      case 'done':
        return `${count(f.out.length, 'giá trị khác nhau')} sau ${count(f.checks, 'lần kiểm tra')}. Nếu không sắp xếp, so sánh mọi cặp sẽ tốn ${(n * (n - 1)) / 2} lần.`;
    }
  },
  takeaways: [
    'Sắp xếp trước là một mẫu hay gặp: trả O(n log n) một lần, rồi giải bài toán bằng một lần quét O(n).',
    'Để loại bỏ giá trị trùng, hãy sắp xếp rồi so sánh mỗi giá trị với phần tử bên trái nó: n − 1 lần kiểm tra thay vì n(n − 1)/2 cặp.',
    'Để gộp các đoạn, hãy sắp xếp theo điểm đầu. Khi đó mỗi đoạn hoặc chồng lên khối hiện tại, làm khối dài ra, hoặc bắt đầu sau khối đó, mở ra một khối mới.',
    'Hàm so sánh quyết định thứ tự. Nó trả về số âm, 0 hoặc số dương, và một quy tắc phân xử khi bằng nhau (theo điểm cuối khi điểm đầu bằng nhau) làm thứ tự được xác định hoàn toàn.',
    'Đổi tiêu chí sắp xếp sang Điểm cuối trên ví dụ: đoạn 2–6 đến sau khi 4–5 đã mở khối riêng, nên lần quét không bao giờ gộp nó với 1–3.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Sắp xếp',
      'O(n log n)',
      'Một thuật toán sắp xếp bằng so sánh tốt bất kì, như merge sort (sắp xếp trộn).',
    ],
    ['Quét để gộp', 'O(n)', 'Một lần kiểm tra chồng nhau cho mỗi đoạn sau đoạn đầu.'],
    ['Quét để loại trùng', 'O(n)', 'Một lần so sánh với phần tử bên trái cho mỗi giá trị.'],
    ['Loại trùng không sắp xếp', 'O(n²)', 'Có thể phải so sánh mọi cặp giá trị.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt:
        'Gộp các đoạn 1-3, 2-6, 8-10, 15-18. Gõ các khối dạng đầu-cuối, cách nhau bằng dấu phẩy.',
      accept: ['1-6, 8-10, 15-18', '1-6 8-10 15-18', '1-6,8-10,15-18', '[1-6, 8-10, 15-18]'],
      hints: [
        'Các đoạn đã được sắp xếp theo điểm đầu.',
        '2-6 bắt đầu trước khi 1-3 kết thúc, nên hai đoạn đó gộp lại.',
      ],
      solution:
        '1-3 mở một khối; 2-6 bắt đầu ở 2 ≤ 3, nên khối dài ra thành 1-6. 8-10 bắt đầu sau 6: khối mới. 15-18 bắt đầu sau 10: khối mới. Kết quả: 1-6, 8-10, 15-18.',
    },
    {
      type: 'number',
      prompt:
        'Sau khi sắp xếp 10 giá trị, lần quét loại trùng làm bao nhiêu phép so sánh với phần tử kề bên?',
      answer: 9,
      unit: 'lần kiểm tra',
      hints: ['Mọi giá trị trừ giá trị đầu tiên đều được so sánh với giá trị bên trái nó.'],
      solution:
        'n − 1 = 9 lần kiểm tra. Nếu không sắp xếp, so sánh mọi cặp sẽ tốn 10 × 9 / 2 = 45 lần.',
    },
    {
      type: 'choice',
      prompt: 'Hàm so sánh nào sắp xếp các đoạn theo điểm đầu, bằng nhau thì theo điểm cuối?',
      options: [
        '(x, y) => x.start − y.start || x.end − y.end',
        '(x, y) => x.end − y.end || x.start − y.start',
        '(x, y) => x.start < y.start',
        '(x, y) => y.start − x.start',
      ],
      answer: 0,
      hints: [
        'Hàm so sánh trả về một số: số âm khi x đứng trước.',
        'Khi x.start − y.start bằng 0, toán tử || chuyển sang quy tắc phân xử.',
      ],
      solution:
        'x.start − y.start âm khi x bắt đầu trước, nên x đứng trước. Khi hai điểm đầu bằng nhau, nó bằng 0, và || chuyển sang x.end − y.end. Trả về giá trị đúng/sai không phải là một hàm so sánh hợp lệ, còn y.start − x.start sắp xếp theo thứ tự giảm dần.',
    },
    {
      type: 'number',
      prompt:
        'Sắp xếp 1-3, 2-6, 4-5 theo điểm cuối, rồi chạy lần quét gộp. Nó báo bao nhiêu khối? (Đáp án đúng lẽ ra là 1.)',
      answer: 2,
      unit: 'khối',
      hints: [
        'Theo điểm cuối, thứ tự là 1-3, 4-5, 2-6.',
        '4-5 bắt đầu sau 3, nên nó mở một khối mới trước khi 2-6 đến.',
      ],
      solution:
        'Thứ tự theo điểm cuối: 1-3, 4-5, 2-6. 1-3 mở một khối; 4-5 bắt đầu ở 4 > 3, nên mở khối mới; 2-6 bắt đầu ở 2 ≤ 5 và gộp vào khối thứ hai. Lần quét báo 2 khối, nhưng 2-6 chồng lên cả hai, nên cả ba lẽ ra phải là một khối 1-6.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo là bài luyện tập: chọn thuật toán sắp xếp phù hợp cho từng kiểu dữ liệu.',
};
