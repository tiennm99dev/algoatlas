import { equalKeyOrder } from '$lib/algo-engine/selection-sort-stability.js';

/** @typedef {import('$lib/algo-engine/selection-sort-stability.js').SelectionFrame} SelectionFrame */
/** @typedef {import('$lib/algo-engine/selection-sort-stability.js').Card} Card */

const TAGS = 'abcdefghij';

/** @param {number} tag */
const tagName = (tag) => TAGS[tag] ?? String(tag + 1);

/** @param {Card | undefined} c */
const card = (c) => (c ? `${c.key}${tagName(c.tag)}` : '');

export const vi = {
  slug: 'selection-sort-stability',
  topic: 'sorting',
  level: 'Cơ bản',
  title: 'Sắp xếp chọn và tính ổn định',
  intro:
    'Sắp xếp chọn quét phần chưa sắp xếp để tìm lá bài nhỏ nhất rồi đưa nó lên đầu phần đó, mỗi lượt lấp một ô. Thuật toán sắp xếp tại chỗ (in-place) và ghi rất ít, nhưng những lần đổi chỗ xa có thể đưa một lá bài nhảy qua một lá có khoá bằng nó. Một thuật toán sắp xếp giữ các khoá bằng nhau theo đúng thứ tự ban đầu được gọi là ổn định (stable).',
  summary:
    'Đi từng bước sắp xếp chọn trên các lá bài có khoá lặp lại, và xem vì sao bản đổi chỗ kinh điển không ổn định, còn bản dời thì ổn định.',
  instruction:
    'Gõ vài khoá có lặp lại, hoặc bấm Ngẫu nhiên, rồi đi từng bước. Các lá bài cùng khoá được gắn chữ a, b, c theo thứ tự trong đầu vào. Để ý các chữ ở cuối, rồi chuyển sang bản dời và so sánh nhé.',
  variantLabel: 'Phiên bản',
  variants: { swap: 'Đổi chỗ (kinh điển)', shift: 'Dời (ổn định)' },
  keysLabel: 'Các khoá',
  randomButton: 'Ngẫu nhiên',
  keyErrors: {
    format: 'Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 3, 1, 3.',
    range: 'Mọi khoá phải nằm trong khoảng 0–99.',
    count: 'Hãy gõ từ 2 đến 10 khoá.',
  },
  cardsTitle: 'Các lá bài',
  /** @param {Card[]} items @param {number} sortedCount */
  cardsAria: (items, sortedCount) =>
    `Các lá bài theo thứ tự: ${items.map(card).join(', ')}. ${sortedCount}/${items.length} lá đã ở vị trí cuối cùng.`,
  /** @param {Card} c @param {string} role */
  cardLabel: (c, role) => `Khoá ${c.key}, lá ${tagName(c.tag)}${role ? `, ${role}` : ''}`,
  tagName,
  tagNote: 'Cùng khoá thì cùng số; chữ và màu cho biết lá nào đứng trước trong đầu vào.',
  stats: {
    comparisons: 'Số lần so sánh',
    writes: 'Số ô đã ghi',
    sorted: 'Đoạn đầu đã sắp xếp',
    pairs: 'n(n − 1)/2',
  },
  equalTitle: 'Các khoá bằng nhau, từ trái sang phải',
  equalEmpty: 'Không có khoá nào lặp lại.',
  /** @param {number} key @param {number[]} tags */
  equalRow: (key, tags) => `${key}: ${tags.map(tagName).join(' → ')}`,
  /** @param {boolean} kept */
  equalVerdict: (kept) => (kept ? '✓ đúng thứ tự đầu vào' : '✕ bị đảo thứ tự'),
  compareTitle: 'Tổng chi phí trên các khoá này',
  /** @param {number} c @param {number} w */
  compareRow: (c, w) => `${c} lần so sánh · ${w} ô đã ghi`,
  /** @param {boolean|null} ok  null when no key repeats */
  stableLabel: (ok) =>
    ok === null
      ? 'không có khoá lặp lại để kiểm tra'
      : ok
        ? 'các khoá bằng nhau giữ nguyên thứ tự'
        : 'các khoá bằng nhau bị đảo thứ tự',
  legend: {
    current: 'Ô mà lượt này lấp',
    min: 'Nhỏ nhất đến giờ',
    compare: 'Đang so sánh',
    moved: 'Vừa di chuyển',
    sorted: 'Vị trí cuối cùng',
  },
  markers: { current: 'i', min: 'min', compare: 'j', moved: '⇄', sorted: '✓' },
  roles: {
    current: 'ô cần lấp',
    min: 'nhỏ nhất đến giờ',
    compare: 'đang so sánh',
    moved: 'vừa di chuyển',
    sorted: 'đã ở vị trí cuối cùng',
  },
  /** @param {SelectionFrame} f */
  describe(f) {
    const at = (/** @type {number} */ k) => card(f.items[k]);
    switch (f.kind) {
      case 'start':
        return f.items.length < 2
          ? 'Chỉ có một lá bài thì đã được sắp xếp.'
          : `Có ${f.items.length} lá bài. Mỗi lượt, ta tìm lá nhỏ nhất trong phần chưa sắp xếp và đưa nó lên đầu phần đó.`;
      case 'pass':
        return `Lượt ${f.i + 1}: lấp ô ${f.i}. Bắt đầu với min = ${f.i} (${at(f.i)}).`;
      case 'compare':
        return f.smaller
          ? `${at(f.j)} < giá trị nhỏ nhất cũ: min chuyển sang ô ${f.j}.`
          : `${at(f.j)} không nhỏ hơn ${at(f.min)}: min vẫn ở ô ${f.min}.`;
      case 'keep':
        return `Lá nhỏ nhất, ${at(f.i)}, đã nằm sẵn ở ô ${f.i}. Không có gì di chuyển.`;
      case 'swap':
        return f.from - f.i > 1
          ? `Đổi chỗ ô ${f.i} và ô ${f.from}: ${at(f.i)} lên đầu, còn ${at(f.from)} nhảy tới ô ${f.from}, qua mọi lá ở giữa.`
          : `Đổi chỗ ô ${f.i} và ô ${f.from}: ${at(f.i)} lên đầu, còn ${at(f.from)} lùi sang phải một ô.`;
      case 'shift': {
        const moved = f.from - f.i;
        const which =
          moved === 1 ? `lá ở ô ${f.i}` : `${moved} lá ở các ô ${f.i} đến ${f.from - 1}`;
        return `Lấy ${at(f.i)} ra khỏi ô ${f.from}, dời ${which} sang phải một ô, rồi đặt nó vào ô ${f.i}. Không lá nào nhảy qua lá khác.`;
      }
      case 'done': {
        const totals = `Đã sắp xếp xong với ${f.comparisons} lần so sánh và ${f.writes} ô đã ghi.`;
        const groups = equalKeyOrder(f.items);
        if (groups.length === 0)
          return `${totals} Không có khoá nào lặp lại, nên chưa thấy được tính ổn định.`;
        const bad = groups.find((g) => !g.kept);
        return bad
          ? `${totals} Ở đây không ổn định: khoá ${bad.key} giờ đọc là ${bad.tags.map(tagName).join(', ')}.`
          : `${totals} Mọi khoá lặp lại đều giữ đúng thứ tự đầu vào.`;
      }
    }
  },
  takeaways: [
    'Sắp xếp chọn luôn làm n(n − 1)/2 phép so sánh, kể cả khi đầu vào đã sắp xếp: mỗi lượt phải xem mọi lá chưa sắp xếp mới chắc đã tìm được giá trị nhỏ nhất.',
    'Thuật toán ghi rất ít: nhiều nhất n − 1 lần đổi chỗ. Điều này có lợi khi ghi tốn kém hơn đọc nhiều.',
    'Thuật toán sắp xếp tại chỗ: ngoài vài biến, nó không cần thêm bộ nhớ nào ngoài chính mảng.',
    'Một thuật toán sắp xếp là ổn định khi các khoá bằng nhau giữ thứ tự đầu vào. Bản đổi chỗ kinh điển không ổn định, vì một lần đổi chỗ xa có thể đưa một lá vượt qua lá bằng nó. Dời thay vì đổi chỗ sẽ làm thuật toán ổn định, đổi lại phải ghi nhiều hơn.',
    'Thử các khoá 2, 2, 1: bản đổi chỗ kết thúc với 2b đứng trước 2a. Sau đó chuyển sang bản dời.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    ['So sánh, mọi đầu vào', 'O(n²)', 'Đúng n(n − 1)/2: lượt i quét hết n − 1 − i lá phía sau.'],
    ['Ghi, bản đổi chỗ', 'O(n)', 'Mỗi lượt nhiều nhất một lần đổi chỗ, nên nhiều nhất 2(n − 1) ô.'],
    ['Ghi, bản dời', 'O(n²)', 'Đầu vào đảo ngược dời mỗi lá qua mọi lá nhỏ hơn nó.'],
    ['Bộ nhớ thêm', 'O(1)', 'Tại chỗ: chỉ cần i, j, min và một lá đang cầm.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Sắp xếp chọn làm bao nhiêu phép so sánh khoá trên 8 lá bài đã được sắp xếp sẵn?',
      answer: 28,
      unit: 'lần so sánh',
      hints: [
        'Sắp xếp chọn không thể dừng sớm: lượt nào cũng quét hết phần còn lại của mảng.',
        'Các lượt so sánh lần lượt 7, 6, 5, … , 1 lần.',
      ],
      solution:
        'Lượt 1 so sánh 7 lần, lượt 2 so sánh 6 lần, cứ thế đến 1: 7 + 6 + … + 1 = 8 × 7 / 2 = 28. Đầu vào đã sắp xếp không giúp được gì.',
    },
    {
      type: 'choice',
      prompt: 'Chạy bản đổi chỗ trên các lá 2a, 2b, 1. Thứ tự cuối cùng là gì?',
      options: ['1, 2a, 2b', '1, 2b, 2a', '2a, 2b, 1', '2b, 1, 2a'],
      answer: 1,
      hints: [
        'Lượt 1 tìm được giá trị nhỏ nhất 1 ở ô 2 và đổi chỗ nó với ô 0.',
        'Sau lần đổi chỗ đó, lá 2 nào nằm ở ô 2?',
      ],
      solution:
        'Lượt 1 đổi chỗ ô 0 và ô 2: 1, 2b, 2a. Lượt 2 so sánh 2a với 2b; 2a không nhỏ hơn, nên không có gì di chuyển. Kết quả 1, 2b, 2a có hai lá 2 sai thứ tự, nên bản đổi chỗ không ổn định.',
    },
    {
      type: 'number',
      prompt: 'Trên 10 lá bài, bản đổi chỗ làm nhiều nhất bao nhiêu lần đổi chỗ?',
      answer: 9,
      unit: 'lần đổi chỗ',
      hints: ['Đếm số lượt. Mỗi lượt đổi chỗ nhiều nhất một lần.'],
      solution:
        'Có n − 1 = 9 lượt (lá cuối tự về đúng chỗ khi các lá khác đã xong), và mỗi lượt đổi chỗ nhiều nhất một lần, nên nhiều nhất 9 lần.',
    },
    {
      type: 'multi',
      prompt:
        'Trong các thuật toán sắp xếp dưới đây, theo cách trình bày trong khoá học này, những thuật toán nào ổn định?',
      options: [
        'Sắp xếp nổi bọt',
        'Sắp xếp chèn',
        'Sắp xếp chọn bằng đổi chỗ',
        'Sắp xếp trộn',
        'Sắp xếp nhanh (phân hoạch Lomuto)',
      ],
      answers: [0, 1, 3],
      hints: [
        'Một thuật toán sắp xếp ổn định khi nó chỉ đưa một lá vượt qua những lá có khoá khác.',
        'Sắp xếp nổi bọt và sắp xếp chèn chỉ đổi chỗ hai phần tử kề nhau khi chúng sai thứ tự hẳn.',
      ],
      solution:
        'Sắp xếp nổi bọt và sắp xếp chèn chỉ đổi chỗ hai phần tử kề nhau khi phần tử bên trái lớn hơn hẳn, còn sắp xếp trộn lấy từ đoạn bên trái khi hai giá trị bằng nhau, nên cả ba đều ổn định. Sắp xếp chọn bằng đổi chỗ và sắp xếp nhanh Lomuto có những lần đổi chỗ xa, có thể nhảy qua một khoá bằng nhau.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo là sắp xếp trộn và sắp xếp nhanh: hai cách chia để trị vượt qua giới hạn O(n²).',
};
