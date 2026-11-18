/** @typedef {import('$lib/algo-engine/sorting.js').SortFrame} SortFrame */

export const vi = {
  slug: 'bubble-insertion-sort',
  topic: 'sorting',
  level: 'Cơ bản',
  title: 'Sắp xếp nổi bọt và sắp xếp chèn',
  intro:
    'Đây là hai cách sắp xếp đơn giản nhất: sắp xếp nổi bọt liên tục đổi chỗ hai phần tử kề nhau đang sai thứ tự, còn sắp xếp chèn nới dần một đoạn đầu đã sắp xếp, mỗi lần thêm một lá bài. Cả hai đều tốn O(n²) trong trường hợp xấu nhất, nhưng chạy rất khác nhau trên dữ liệu gần như đã sắp xếp.',
  summary:
    'So sánh từng bước sắp xếp nổi bọt và sắp xếp chèn, và xem vì sao cả hai đều tốn O(n²) nhưng chạy khác nhau trên dữ liệu gần như đã sắp xếp.',
  instruction:
    'Chọn một thuật toán và một mảng ban đầu, rồi bấm phát hoặc đi từng bước. Đổi thuật toán trên cùng mảng đó và so sánh tổng chi phí nhé.',
  algorithmLabel: 'Thuật toán',
  algorithms: { bubble: 'Sắp xếp nổi bọt', insertion: 'Sắp xếp chèn' },
  presetLabel: 'Mảng ban đầu',
  presets: {
    random: 'Ngẫu nhiên',
    'nearly-sorted': 'Gần như đã sắp xếp',
    reversed: 'Đảo ngược',
    'few-unique': 'Ít giá trị khác nhau',
  },
  sizeLabel: 'Kích thước',
  shuffle: 'Mảng mới',
  comparisons: 'Số lần so sánh',
  swaps: { bubble: 'Số lần đổi chỗ', insertion: 'Số lần dời' },
  compareTitle: 'Tổng chi phí trên mảng này',
  compareRow: /** @param {number} c @param {number} s @param {string} moves */ (c, s, moves) =>
    `${c} lần so sánh · ${s} ${moves.replace(/^Số /, '').toLowerCase()}`,
  /** @param {number[]} values @param {number} sortedCount */
  barsLabel(values, sortedCount) {
    return `Mảng: ${values.join(', ')}. Đã xếp xong ${sortedCount}/${values.length} phần tử.`;
  },
  legend: {
    compare: 'Đang so sánh',
    swap: 'Đang đổi chỗ',
    key: 'Khoá đang được chèn',
    sorted: 'Đã xếp xong',
  },
  markers: { compare: '?', swap: '⇄', sorted: '✓' },
  /**
   * @param {SortFrame} f
   * @param {'bubble'|'insertion'} algo
   */
  describe(f, algo) {
    const v = (/** @type {number} */ i) => f.items[i]?.value;
    const [i, j] = f.focus;
    switch (f.kind) {
      case 'start':
        return algo === 'bubble'
          ? 'Mỗi lượt, ta đi từ trái sang phải và đẩy giá trị lớn nhất còn lại về cuối mảng.'
          : 'Riêng phần tử đầu tiên đã là một đoạn đầu được sắp xếp. Mỗi bước, ta chèn phần tử tiếp theo vào đoạn đó.';
      case 'pass-start':
        return `Lượt mới: đẩy giá trị lớn nhất trong các chỉ số 0–${i} về chỉ số ${i}.`;
      case 'pick':
        return `Lấy ${v(i)} làm khoá và trượt nó sang trái vào đoạn đầu đã sắp xếp.`;
      case 'compare':
        return f.swapped
          ? `${v(i)} > ${v(j)}: sai thứ tự.`
          : `${v(i)} ≤ ${v(j)}: đã đúng thứ tự${algo === 'insertion' ? ', nên khoá dừng ở đây' : ''}.`;
      case 'swap':
        return algo === 'bubble'
          ? `Đã đổi chỗ: ${v(j)} sang phải.`
          : `Đã dời ${v(j)} sang phải; khoá lùi sang trái một ô.`;
      case 'pass':
        return f.focus.length
          ? `Xong lượt: ${v(i)} đã về đúng vị trí cuối cùng.`
          : 'Cả một lượt không đổi chỗ lần nào: mảng đã được sắp xếp, nên ta dừng sớm.';
      case 'place':
        return `Khoá dừng ở chỉ số ${i}. ${f.sorted.length} phần tử đầu tiên đã được sắp xếp.`;
      case 'done':
        return `Đã sắp xếp xong với ${f.comparisons} lần so sánh và ${f.swaps} ${algo === 'bubble' ? 'lần đổi chỗ' : 'lần dời'}.`;
    }
  },
  takeaways: [
    'Cả hai thuật toán chỉ so sánh và đổi chỗ hai phần tử kề nhau, nên cả hai đều ổn định (stable): các giá trị bằng nhau giữ nguyên thứ tự ban đầu.',
    'Thử “Đảo ngược”: mọi cặp đều sai thứ tự, nên cả hai phải đổi chỗ n(n−1)/2 lần, đó là trường hợp xấu nhất.',
    'Thử “Gần như đã sắp xếp”: sắp xếp chèn gần như không phải dời gì, còn sắp xếp nổi bọt dừng sớm ngay khi một lượt không đổi chỗ lần nào. Vì thế các thư viện sắp xếp thực tế dùng sắp xếp chèn cho đầu vào nhỏ hoặc gần như đã sắp xếp.',
    'Cả hai đều sắp xếp tại chỗ (in-place), chỉ tốn thêm O(1) bộ nhớ.',
  ],
  complexity: [
    ['Tốt nhất', 'O(n)', 'Mảng đã sắp xếp: một lượt gồm n−1 lần so sánh, không đổi chỗ lần nào.'],
    ['Trung bình', 'O(n²)', 'Khoảng một nửa số cặp phần tử đang sai thứ tự.'],
    ['Xấu nhất', 'O(n²)', 'Mảng đảo ngược: mọi cặp phần tử đều phải đổi chỗ một lần.'],
  ],
  nextTeaser:
    'Bài tiếp theo là sắp xếp chọn và tính ổn định: một thuật toán ghi rất ít, và câu hỏi khi nào các khoá bằng nhau giữ được thứ tự.',
};
