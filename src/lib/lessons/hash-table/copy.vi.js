/** @typedef {import('$lib/algo-engine/hash-table.js').HashFrame} HashFrame */
/** @typedef {import('$lib/algo-engine/hash-table.js').HashFn} HashFn */

/** @param {number} c */
const plural = (c) => `${c} phép so sánh`;

export const vi = {
  slug: 'hash-table',
  topic: 'structures',
  level: 'Cơ bản',
  title: 'Bảng băm',
  intro:
    'Bảng băm (hash table) biến một khoá thành số hiệu của một ngăn, nên muốn tìm khoá ta chỉ cần xem một danh sách ngắn thay vì cả tập dữ liệu. Hãy xem các khoá rơi vào ngăn, va chạm nhau, rồi được rải đều lại khi bảng lớn lên.',
  summary:
    'Xem các khoá được băm vào ngăn, va chạm nhau và được băm lại khi bảng lớn lên, rồi hiểu vì sao phép tra cứu trung bình vẫn chỉ tốn O(1).',
  instruction:
    'Chọn một hàm băm và một bộ khoá, rồi đi từng bước qua các lần chèn. Khi bảng đầy hơn 75%, kích thước bảng tăng gấp đôi và mọi khoá được băm lại. Sau đó thử tìm một khoá có trong bảng hoặc không có.',
  takeaways: [
    'Móc nối (chaining) giữ mọi khoá có cùng giá trị băm trong một danh sách ở mỗi ngăn. Phép tra cứu chỉ đi dọc danh sách đó.',
    'Hệ số tải n/m quyết định độ dài trung bình của một chuỗi. Mở rộng bảng khi hệ số tải vượt 0.75 giữ cho phép tra cứu trung bình là O(1), và tính trên toàn bộ các lần mở rộng, mỗi khoá trung bình chỉ bị dời O(1) lần.',
    'Kích thước bảng tồi có thể làm hỏng một hàm băm trông có vẻ tốt: với m là luỹ thừa của 2, k mod m chỉ giữ lại mấy bit cuối, nên các bội của 8 đều dồn vào vài ngăn giống nhau. Chọn m nguyên tố, hoặc dùng phương pháp nhân, sẽ rải chúng ra.',
    'Tìm một khoá không có trong bảng phải đi hết cả chuỗi; tìm thấy thì dừng ngay ở vị trí của khoá.',
    'Thử chọn “Bội của 8” với “k mod m, m = 2ᵖ”, rồi chuyển sang “k mod m, m nguyên tố”: cùng các khoá đó nhưng không còn dồn vào vài ngăn nữa.',
  ],
  complexityHead: ['Trường hợp', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Tra cứu, trung bình', 'O(1)', 'Các chuỗi vẫn ngắn khi hệ số tải bị chặn.'],
    ['Tra cứu, xấu nhất', 'O(n)', 'Mọi khoá đều băm vào cùng một ngăn.'],
    [
      'Mở rộng (băm lại)',
      'O(n) một lần, O(1) khấu hao',
      'Gấp đôi kích thước giúp chia chi phí băm lại cho các lần chèn đã làm đầy bảng.',
    ],
  ],
  nextTeaser:
    'Bài tiếp theo, Xử lí va chạm: móc nối và địa chỉ mở, so sánh hai cách cất các khoá rơi vào cùng một ngăn.',

  hashLabel: 'Hàm băm',
  hashes: {
    'mod-prime': 'k mod m, m nguyên tố',
    'mod-pow2': 'k mod m, m = 2ᵖ',
    multiply: 'Phương pháp nhân',
  },
  /** @param {HashFn} fn @param {number} size */
  formula(fn, size) {
    return fn === 'multiply' ? `h(k) = ⌊${size} · frac(k · 0.618…)⌋` : `h(k) = k mod ${size}`;
  },
  presetLabel: 'Bộ khoá',
  presets: {
    random: 'Ngẫu nhiên',
    sequential: 'Liên tiếp',
    'multiples-of-8': 'Bội của 8',
    custom: 'Tự nhập',
  },
  customLabel: 'Các khoá (cách nhau bằng dấu phẩy)',
  countLabel: 'Số lượng',
  newKeys: 'Bộ khoá mới',
  newKeysLoaded: 'Đã nạp bộ khoá mới.',
  searchLabel: 'Tìm khoá',
  searchButton: 'Tìm',
  searchDropped: 'Phép tìm đã bị xoá vì bảng vừa thay đổi.',
  keyErrors: {
    format: 'Các khoá phải là số nguyên từ 0 đến 999, cách nhau bằng dấu phẩy.',
    range: 'Các khoá phải là số nguyên từ 0 đến 999.',
    count: 'Chỉ dùng tối đa 24 khoá.',
  },
  stats: {
    comparisons: 'Số lần so sánh',
    collisions: 'Số va chạm',
    load: 'Hệ số tải',
    longest: 'Chuỗi dài nhất',
    size: 'Kích thước bảng',
  },
  bucketsLabel: 'Các ngăn',
  bucketPrefix: 'Ngăn',
  pendingLabel: 'Chờ băm lại',
  pendingEmpty: 'không còn khoá nào',
  emptyBucket: 'trống',
  legend: {
    compare: 'Đang so sánh',
    hit: 'Tìm thấy',
    new: 'Vừa thêm',
    moving: 'Vừa dời',
  },
  /** Visible marks that accompany the chip colors. */
  marks: { compare: '?', hit: '✓', new: '+', moved: '→' },
  /** Spoken state of a highlighted chip. */
  chipStates: {
    compare: 'đang so sánh',
    hit: 'tìm thấy',
    new: 'vừa thêm',
    moved: 'vừa dời',
  },

  /** @param {HashFrame} f */
  describe(f) {
    const { key, bucket: b, pos, n, m, load } = f;
    const chain = b >= 0 ? f.buckets[b] : [];
    const search = f.lines.includes(6);
    switch (f.kind) {
      case 'start':
        return `Bắt đầu với một bảng rỗng gồm ${m} ngăn.`;
      case 'hash':
        return search ? `Tìm ${key}: băm vào ngăn ${b}.` : `Băm ${key} vào ngăn ${b}.`;
      case 'walk':
        return `So sánh ${key} với ${chain[pos]} ở vị trí ${pos} của chuỗi ${b}.`;
      case 'append':
        return chain.length === 1
          ? `Ngăn ${b} đang trống, nên ${key} mở đầu chuỗi của ngăn này.`
          : `Va chạm: ngăn ${b} đã có ${chain.length - 1} khoá. Nối ${key} vào cuối chuỗi.`;
      case 'update':
        return `${key} đã có trong chuỗi ${b}, nên ta cập nhật ngay tại chỗ.`;
      case 'grow':
        return `Hệ số tải ${load.toFixed(2)} đã vượt 0.75. Mở rộng bảng và băm lại cả ${n} khoá.`;
      case 'rehash':
        return `Băm lại ${f.moved} vào ngăn ${b} trong ${m} ngăn. Còn ${f.pending.length} khoá đang chờ.`;
      case 'grown':
        return `Bảng giờ có ${m} ngăn và hệ số tải ${load.toFixed(2)}.`;
      case 'search-hit':
        return `Tìm thấy ${key} ở vị trí ${pos} của chuỗi ${b} sau ${plural(pos + 1)}.`;
      case 'search-miss':
        return `${key} không có trong chuỗi ${b}: tốn ${plural(chain.length)}.`;
      case 'done':
        return `Đã chèn ${n} khoá vào ${m} ngăn. Hệ số tải ${load.toFixed(2)}.`;
    }
  },
};
