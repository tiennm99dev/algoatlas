/** @typedef {import('$lib/algo-engine/searching.js').SearchFrame} SearchFrame */

export const vi = {
  slug: 'binary-search',
  topic: 'searching',
  level: 'Cơ bản',
  title: 'Tìm kiếm nhị phân',
  intro:
    'Trong một mảng đã sắp xếp, chỉ một phép so sánh đã cho biết giá trị cần tìm nằm ở nửa nào. Bỏ nửa kia đi rồi lặp lại: một triệu phần tử chỉ cần nhiều nhất 20 phép so sánh.',
  summary:
    'Chia đôi mảng đã sắp xếp sau mỗi phép so sánh, rồi tự điều khiển ở chế độ “Bạn tự làm” và thử thắng tìm kiếm nhị phân.',
  instruction:
    'Chế độ Xem chạy thuật toán từng bước. Chế độ Bạn tự làm cho bạn tự chọn ô để đọc: thử xem bạn có thắng được tìm kiếm nhị phân không.',
  modeLabel: 'Chế độ',
  modes: { watch: 'Xem', drive: 'Bạn tự làm' },
  targetLabel: 'Giá trị cần tìm',
  sizeLabel: 'Kích thước',
  newArray: 'Mảng mới',
  randomPresent: 'Giá trị có trong mảng',
  randomAbsent: 'Giá trị không có trong mảng',
  arrayLabel: 'Mảng đã sắp xếp',
  /** @param {number} i @param {number} v @param {'open'|'out'|'found'} state */
  cellLabel: (i, v, state) =>
    `Chỉ số ${i}, giá trị ${v}${state === 'out' ? ', đã loại' : state === 'found' ? ', đã tìm thấy' : ''}`,
  legend: {
    mid: 'Điểm giữa đang đọc',
    found: 'Đã tìm thấy',
    out: 'Đã loại',
    probed: 'Bạn đã đọc',
  },
  foundMarker: '✓',
  binaryCount: 'Số lần đọc của tìm kiếm nhị phân',
  linearCount: 'Số lần đọc của tìm kiếm tuần tự',
  yourCount: 'Số lần bạn đọc',
  /** @param {SearchFrame} f @param {number[]} a @param {number} target */
  describe(f, a, target) {
    switch (f.kind) {
      case 'start':
        return `Ta tìm ${target}. Cả mảng, chỉ số ${f.lo}–${f.hi}, vẫn còn khả năng chứa nó.`;
      case 'mid':
        return `Điểm giữa của ${f.lo}–${f.hi} là chỉ số ${f.mid}. Đọc a[${f.mid}] = ${a[f.mid]}.`;
      case 'found':
        return `a[${f.mid}] = ${target}. Tìm thấy sau ${f.comparisons} lần đọc.`;
      case 'go-right':
        return `${a[f.mid]} < ${target}, nên giá trị cần tìm chỉ có thể ở bên phải. lo = ${f.lo}.`;
      case 'go-left':
        return `${a[f.mid]} > ${target}, nên giá trị cần tìm chỉ có thể ở bên trái. hi = ${f.hi}.`;
      case 'not-found':
        return `lo (${f.lo}) đã vượt qua hi (${f.hi}): không còn ô nào để xét. ${target} không có trong mảng.`;
    }
  },
  drive: {
    prompt:
      'Chọn một ô bất kì còn khả năng chứa giá trị (bấm vào ô, hoặc dùng Tab tới ô rồi nhấn Enter) để đọc giá trị của nó.',
    higher: /** @param {number} v @param {number} t */ (v, t) =>
      `${v} < ${t}: mọi ô bên trái chỗ này đều bị loại.`,
    lower: /** @param {number} v @param {number} t */ (v, t) =>
      `${v} > ${t}: mọi ô bên phải chỗ này đều bị loại.`,
    found: /** @param {number} n @param {number} best */ (n, best) =>
      n <= best
        ? `Tìm thấy sau ${n} lần đọc, giỏi ngang tìm kiếm nhị phân (${best}).`
        : `Tìm thấy sau ${n} lần đọc. Tìm kiếm nhị phân chỉ cần ${best}. Bạn có luôn chọn ô ở giữa không?`,
    missing: /** @param {number} n @param {number} best */ (n, best) =>
      `Sau ${n} lần đọc thì không còn ô nào: giá trị cần tìm không có trong mảng. Tìm kiếm nhị phân chứng minh được điều đó sau ${best} lần.`,
    restart: 'Thử lại',
  },
  takeaways: [
    'Tìm kiếm nhị phân chỉ dùng được trên dữ liệu đã sắp xếp: chính phép so sánh cho ta biết nên bỏ nửa nào.',
    'Mỗi lần đọc chia đôi số ứng viên, nên chi phí nhiều nhất là ⌊log₂ n⌋ + 1 lần đọc. Mảng dài gấp đôi chỉ thêm một bước.',
    'Chọn đúng điểm giữa mới bảo đảm được cận đó. Đọc lệch tâm có thể gặp may, nhưng trường hợp xấu nhất lại tệ hơn.',
    'Cẩn thận lỗi lệch một: vòng lặp chạy khi lo ≤ hi, và cửa sổ dời tới mid ± 1, không bao giờ dời tới mid.',
    'Thử chế độ “Bạn tự làm”: tự đọc các ô và xem bạn có tìm ra giá trị với ít lần đọc hơn tìm kiếm nhị phân không.',
  ],
  complexity: [
    ['Tốt nhất', 'O(1)', 'Điểm giữa đầu tiên chính là giá trị cần tìm.'],
    ['Xấu nhất', 'O(log n)', 'Cửa sổ chia đôi sau mỗi bước cho tới khi rỗng.'],
    ['Tìm kiếm tuần tự', 'O(n)', 'Không sắp xếp thì phải đọc mọi phần tử.'],
  ],
  nextTeaser:
    'Khi mảng có giá trị lặp lại, ta thường cần vị trí đầu tiên hoặc vị trí ngay sau cùng của nó. Bài sau học Cận dưới và cận trên.',
};
