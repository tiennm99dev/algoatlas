/** @typedef {import('$lib/algo-engine/lower-upper-bound.js').BoundFrame} BoundFrame */

export const vi = {
  slug: 'lower-upper-bound',
  topic: 'searching',
  level: 'Trung bình',
  title: 'Cận dưới và cận trên',
  intro:
    'Tìm kiếm nhị phân trả lời được nhiều hơn câu “có ở đây không?”. Cận dưới là vị trí đầu tiên có giá trị lớn hơn hoặc bằng x; cận trên là vị trí đầu tiên có giá trị lớn hơn hẳn x. Mọi bản sao của x đều nằm giữa hai vị trí đó.',
  summary:
    'Dùng tìm kiếm nhị phân để tìm vị trí đầu tiên lớn hơn hoặc bằng x, hoặc lớn hơn x, rồi đếm số lần lặp của x trong O(log n).',
  instruction:
    'Chọn cận dưới hoặc cận trên và một giá trị cần tìm, rồi chạy từng bước. Cửa sổ là nửa mở: lo nằm trong cửa sổ, hi nằm ngay sau đầu cuối của nó. Khi tìm xong, một dấu mũ đánh dấu chỗ sẽ chèn x vào.',
  takeaways: [
    'Hai cận dùng cùng một vòng lặp. Chỉ phép thử trên a[mid] thay đổi: < cho cận dưới, ≤ cho cận trên.',
    'Cửa sổ [lo, hi) là nửa mở, nên ta thu hẹp bằng hi = mid chứ không phải mid − 1. Lẫn cách này với cửa sổ đóng của tìm kiếm nhị phân thường là lỗi lệch một kinh điển.',
    'Đáp án luôn là một vị trí chèn hợp lệ từ 0 đến n, kể cả khi x không có, nhỏ hơn mọi phần tử, hay lớn hơn mọi phần tử.',
    'upper − lower đếm số bản sao của x trong O(log n), không phải quét cả dãy giá trị bằng nhau.',
    'Không có lối thoát sớm khi gặp x, nên lần tìm nào cũng đọc khoảng log₂ n ô.',
    'Thử “Giá trị không có trong mảng”: lần tìm vẫn kết thúc ở một vị trí chèn hợp lệ, và cận dưới trùng cận trên.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Thời gian', 'O(log n)', 'Cửa sổ chia đôi sau mỗi lần đọc, không thoát sớm.'],
    ['Đếm x', 'O(log n)', 'Hai lần tìm: upper − lower.'],
    ['Bộ nhớ', 'O(1)', 'Chỉ cần lo, hi và mid.'],
  ],
  nextTeaser:
    'Cùng một vòng lặp đó còn tìm được đáp án của cả bài toán, khi phép thử là “đáp án này có đạt không?”. Đó là Tìm kiếm nhị phân trên đáp án.',
  variantLabel: 'Tìm',
  variants: { lower: 'Cận dưới', upper: 'Cận trên' },
  targetLabel: 'Giá trị cần tìm x',
  sizeLabel: 'Kích thước',
  newArray: 'Mảng mới',
  randomPresent: 'Giá trị có trong mảng',
  /** @param {number} n @param {number} x */
  newArrayNotice: (n, x) => `Mảng mới gồm ${n} giá trị. Giá trị cần tìm là ${x}.`,
  randomAbsent: 'Giá trị không có trong mảng',
  /** @param {number[]} values @param {number} lo @param {number} hi */
  arrayLabel: (values, lo, hi) => `Mảng đã sắp xếp: ${values.join(', ')}. Cửa sổ [${lo}, ${hi}).`,
  windowHint: 'Cửa sổ là nửa mở: [lo, hi) gồm lo và không gồm hi.',
  legend: {
    mid: 'Điểm giữa đang đọc',
    /** @param {string} test */
    left: (test) => `a[i] ${test} x đúng: bên trái lo`,
    /** @param {string} keep */
    right: (keep) => `a[i] ${keep} x: từ hi trở đi`,
    range: 'Các bản sao của x',
    answer: 'Đáp án',
  },
  readsLabel: 'Số lần đọc',
  ceilingLabel: 'Số lần đọc nhiều nhất',
  resultTitle: 'Kết quả',
  lowerLabel: 'Cận dưới',
  upperLabel: 'Cận trên',
  /** @param {number} x @param {number} c */
  countText: (x, c) => `${c} bản sao của ${x}`,
  pending: '—',
  /** @param {BoundFrame} f @param {number[]} a @param {number} x */
  describe(f, a, x) {
    const lower = f.variant === 'lower';
    const test = lower ? '<' : '≤';
    const keep = lower ? '≥' : '>';
    const name = lower ? 'cận dưới' : 'cận trên';
    switch (f.kind) {
      case 'start':
        return `Ta tìm ${name} của ${x} trong [0, ${a.length}).`;
      case 'probe':
        return `Điểm giữa của [${f.lo}, ${f.hi}) là chỉ số ${f.mid}. Đọc a[${f.mid}] = ${a[f.mid]} và thử ${a[f.mid]} ${test} ${x}.`;
      case 'go-right':
        return `${a[f.mid]} ${test} ${x} đúng, nên lo = ${f.lo}. Mọi phần tử bên trái lo đều ${test} ${x}.`;
      case 'go-left':
        return `${a[f.mid]} ${test} ${x} sai, nên hi = ${f.hi}. mid vẫn có thể là đáp án; mọi phần tử từ hi trở đi đều ${keep} ${x}.`;
      case 'done':
        return `Cửa sổ đã rỗng. ${lower ? 'Cận dưới' : 'Cận trên'} của ${x} là ${f.answer}.`;
    }
  },
};
