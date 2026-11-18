/** @typedef {import('$lib/algo-engine/cache-oblivious-algorithms.js').TransposeFrame} TransposeFrame */
/** @typedef {import('$lib/algo-engine/cache-oblivious-algorithms.js').TransposeSetup} TransposeSetup */

/** 'A', 'A và B', 'A, B và C'. @param {string[]} items */
const list = (items) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} và ${items.at(-1)}`;

export const vi = {
  slug: 'cache-oblivious-algorithms',
  topic: 'computation-models',
  level: 'Nâng cao',
  title: 'Thuật toán không phụ thuộc cache',
  intro:
    'Trên máy thật, đọc một từ nhớ từ bộ nhớ chính sẽ kéo theo cả một khối B từ nhớ liền kề, còn cache chỉ giữ được M từ nhớ. Khi dữ liệu lớn, số lần chuyển khối quyết định thời gian chạy nhiều hơn hẳn số lệnh. Một thuật toán không phụ thuộc cache giữ số lần chuyển khối thấp với mọi B và M mà không cần biết hai giá trị đó: nó chia bài toán theo kiểu đệ quy cho tới khi các mảnh vừa với cache.',
  summary:
    'Chuyển vị một ma trận qua một cache LRU nhỏ và đếm số lần chuyển khối của vòng lặp theo từng hàng, so với thứ tự đệ quy không phụ thuộc cache và cách lưu theo thứ tự Z.',
  instruction:
    'Chạy từng bước phép chuyển vị B = Aᵀ. Các khung viền là khối bộ nhớ, ô tô màu nằm trong cache, còn ✗ đánh dấu một lần truy cập phải nạp khối của nó. Đổi thứ tự, cách lưu, N, B và kích thước cache, rồi so số lần chuyển khối với mức lí tưởng 2N²/B.',
  orderLabel: 'Thứ tự',
  orders: { rows: 'Theo từng hàng', recursive: 'Đệ quy' },
  layoutLabel: 'Cách lưu',
  layouts: { row: 'Theo hàng', z: 'Thứ tự Z' },
  sizeLabel: 'N',
  blockLabel: 'Khối B',
  cacheLabel: 'Cache C (số khối)',
  /** @param {number} c @param {number} b */
  cacheNote: (c, b) => `M = C · B = ${c * b} từ nhớ`,
  /** @param {'A'|'B'} name @param {number} n */
  matrixTitle: (name, n) => (name === 'A' ? `A (${n} × ${n}), đọc` : `B = Aᵀ, ghi`),
  /** @param {'A'|'B'} name @param {number} cached @param {number} total */
  matrixAria: (name, cached, total) =>
    `Ma trận ${name}: ${total} khối, ${cached} khối trong cache.`,
  /** @param {'A'|'B'} name @param {number} i @param {number} j @param {number} block @param {string} state */
  cellLabel: (name, i, j, block, state) =>
    `${name}[${i}][${j}], khối ${name}${block}${state ? `, ${state}` : ''}`,
  states: {
    now: 'đang truy cập',
    cached: 'khối của nó đang trong cache',
    done: 'đã chép',
    miss: 'trượt cache',
    hit: 'trúng cache',
  },
  markers: { miss: '✗', hit: '✓', done: '·' },
  legend: {
    now: 'Đang truy cập: ✗ trượt, ✓ trúng',
    cached: 'Khối đang trong cache',
    done: '· Đã chép',
    block: 'Một khối bộ nhớ gồm B từ nhớ',
  },
  cacheTitle: 'Cache, khối lâu chưa dùng nhất đứng trước',
  cacheEmpty: 'Trống.',
  hotBlock: 'đang dùng',
  /** @param {'A'|'B'} name @param {number} k */
  blockName: (name, k) => `${name}${k}`,
  stats: {
    copied: 'Số phần tử đã chép',
    transfers: 'Số lần chuyển khối',
    split: 'Số lần trượt trên A / trên B',
    ideal: 'Lí tưởng 2N²/B',
  },
  /** @param {number} a @param {number} b */
  split: (a, b) => `${a} / ${b}`,
  /**
   * @param {TransposeFrame} f @param {TransposeSetup} s
   * @param {(id: number) => string} name  Block id to its name.
   */
  describe(f, s, name) {
    const total = f.missA + f.missB;
    const ideal = (2 * s.n * s.n) / s.block;
    switch (f.kind) {
      case 'start':
        return `Chép mọi A[i][j] sang B[j][i]. Mỗi ma trận gồm ${(s.n * s.n) / s.block} khối, mỗi khối ${s.block} từ nhớ, còn cache chứa được ${s.cache} khối. Thứ tự nào cũng phải nạp mỗi khối ít nhất một lần: ${ideal} lần chuyển khối.`;
      case 'copy': {
        const read = f.hitA ? 'trúng cache' : 'trượt cache, nên phải nạp khối của nó';
        const write = f.hitB ? 'trúng cache' : 'trượt cache, nên phải nạp khối của nó';
        const out = f.evicted.length
          ? ` Bị đẩy ra: ${list(f.evicted.map(name))}, khối lâu chưa dùng nhất.`
          : '';
        return `B[${f.j}][${f.i}] = A[${f.i}][${f.j}]: phép đọc ${read}; phép ghi ${write}.${out}`;
      }
      case 'done': {
        const verdict =
          total === ideal
            ? 'đúng mức lí tưởng: mỗi khối được nạp đúng một lần.'
            : `gấp ${(total / ideal).toFixed(2).replace('.', ',')} lần mức lí tưởng ${ideal}: một số khối bị đẩy ra rồi lại phải nạp lại.`;
        return `Xong: đã chép ${s.n * s.n} phần tử với ${total} lần chuyển khối, ${verdict}`;
      }
    }
  },
  takeaways: [
    'Mô hình bộ nhớ ngoài đếm số lần chuyển khối: bộ nhớ di chuyển theo từng khối B từ nhớ, và cache giữ được M từ nhớ. Quét n từ nhớ tốn khoảng n/B lần chuyển khối, không phải n.',
    'Theo từng hàng, phép chuyển vị đọc A dọc theo hàng nhưng lại ghi B theo cột. Trừ khi cache giữ được một khối cho mỗi hàng nó ghi, mỗi lần ghi phải nạp một khối mà chỉ dùng một từ nhớ trong đó: khoảng N² lần chuyển khối thay vì N²/B.',
    'Phép chuyển vị đệ quy chia đôi cạnh dài hơn cho tới khi các mảnh vừa với cache, dù B và M là bao nhiêu. Khi một mảnh đã vừa, mỗi khối của nó chỉ được nạp một lần, nên chỉ cần O(N²/B) lần chuyển khối với giả thiết cache cao M ≥ B².',
    'Một cách lưu đệ quy như thứ tự Z đặt mỗi góc phần tư liền nhau trong bộ nhớ, nên một hình vuông nhỏ chỉ là vài khối trọn vẹn; với cách lưu này, phép chuyển vị đệ quy đạt mức lí tưởng ngay cả với cache rất nhỏ.',
    'Thử xem: với N = 8 và B = 4, tăng cache từ 2 lên 16 khối ở mỗi thứ tự. Theo từng hàng cần 11 khối mới đạt 32 lần chuyển khối; thứ tự đệ quy cần 7, và chỉ 2 với thứ tự Z.',
  ],
  complexityHead: ['Thuật toán', 'Số lần chuyển khối', 'Vì sao'],
  complexity: [
    [
      'Quét n từ nhớ',
      'Θ(n/B + 1)',
      'Mỗi khối được nạp một lần và mọi từ nhớ trong đó đều được dùng.',
    ],
    [
      'Chuyển vị, theo từng hàng',
      'Θ(N²) khi M < N · B',
      'Mỗi lần ghi theo cột của B chạm vào một khối mới, và khối đó bị đẩy ra trước khi tới cột sau.',
    ],
    [
      'Chuyển vị, đệ quy',
      'Θ(N²/B) khi M ≥ B²',
      'Các ma trận con cỡ B × B vừa với cache, nên mỗi khối chỉ được nạp O(1) lần.',
    ],
    [
      'Merge sort so với sắp xếp phễu (funnelsort)',
      'Θ((n/B) log₂(n/M)) so với Θ((n/B) log_{M/B}(n/B))',
      'Phép trộn nhiều đường theo kiểu đệ quy dùng hết cache mà không cần biết kích thước của nó.',
    ],
    ['Bộ nhớ', 'Hai ma trận N × N', 'Cache chỉ sao chép các khối; nó không thêm chỗ lưu trữ mới.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Với thiết lập ban đầu (Theo từng hàng, Theo hàng, N = 8, B = 4, C = 4), phép chuyển vị tốn bao nhiêu lần chuyển khối?',
      answer: 80,
      unit: 'lần',
      hints: ['Bấm Đến bước cuối rồi đọc Số lần chuyển khối.'],
      solution:
        'Các phép đọc A trượt một lần cho mỗi khối, tức 16 lần; mỗi phép trong 64 phép ghi B đi theo cột và đều trượt, vì 4 khối trong cache không giữ nổi một khối cho mỗi hàng trong 8 hàng của B. 16 + 64 = 80, so với mức lí tưởng 32.',
    },
    {
      type: 'number',
      prompt:
        'Chuyển sang thứ tự Đệ quy và giữ cách lưu Theo hàng. Cache C nhỏ nhất (tính bằng số khối) là bao nhiêu để phép chuyển vị giảm xuống đúng mức lí tưởng 32 lần chuyển khối?',
      answer: 7,
      unit: 'khối',
      hints: ['Kéo thanh trượt cache lên từng khối một và đọc Số lần chuyển khối ở bước cuối.'],
      solution:
        'C = 4 cho 56, 5 cho 48, 6 cho 44 và 7 cho 32. Một ma trận con 4 × 4 chạm vào 4 khối của A và 4 khối của B, nhưng không cùng lúc cả 8: hai hàng đầu của A đã xong trước khi đọc hai hàng cuối, nên mỗi lúc chỉ dùng 6 khối. LRU cần thêm một khối nữa, vì với 6 khối nó đẩy ra một khối của B còn đang cần thay vì một khối của A đã xong; với 7 khối, khối bị đẩy ra luôn là khối đã xong, nên mỗi khối chỉ được nạp một lần.',
    },
    {
      type: 'choice',
      prompt: 'Giờ chọn cách lưu Thứ tự Z với thứ tự Đệ quy và C = 2. Điều gì xảy ra?',
      options: [
        'Vẫn cần 56 lần chuyển khối',
        'Đạt đúng mức lí tưởng 32 lần chuyển khối',
        'Cần nhiều lần chuyển khối hơn cách theo từng hàng',
        'Không chạy được với chỉ 2 khối',
      ],
      answer: 1,
      hints: ['Trong thứ tự Z, một hình vuông 2 × 2 ô là một khối 4 từ nhớ.'],
      solution:
        'Mỗi hình vuông 2 × 2 của A là một khối, và ảnh chuyển vị của nó trong B cũng là một khối. Phép đệ quy làm xong một hình vuông rồi mới đi tiếp, nên chỉ cần một khối cho mỗi ma trận: 16 + 16 = 32.',
    },
  ],
  nextTeaser:
    'Bài sau, Thuật toán trực tuyến và phân tích cạnh tranh, phải quyết định ngay mà chưa biết đầu vào phía sau.',
};
