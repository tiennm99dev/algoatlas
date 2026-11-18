/** @typedef {import('$lib/algo-engine/merge-quick-sort.js').DivideFrame} DivideFrame */

/**
 * Whether equal values kept their input order. Equal values end up adjacent, so the first
 * adjacent pair whose ids descend is a reordering. Null when no value repeats.
 * @param {DivideFrame['items']} items
 * @returns {{stable: true}|{stable: false, earlier: {id: number, value: number}, later: {id: number, value: number}}|null}
 */
function stability(items) {
  const pairs = items.slice(1).map((it, i) => [items[i], it]);
  const equal = pairs.filter(([a, b]) => a.value === b.value);
  if (equal.length === 0) return null;
  const bad = equal.find(([a, b]) => a.id > b.id);
  return bad ? { stable: false, earlier: bad[1], later: bad[0] } : { stable: true };
}

export const vi = {
  slug: 'merge-quick-sort',
  topic: 'sorting',
  level: 'Trung bình',
  title: 'Sắp xếp trộn và sắp xếp nhanh',
  intro:
    'Cả hai đều vượt qua giới hạn O(n²) nhờ chia để trị (divide and conquer). Sắp xếp trộn chia đôi mảng, sắp xếp từng nửa rồi trộn hai đoạn đã sắp xếp. Sắp xếp nhanh (quicksort) chọn một chốt (pivot), đưa các giá trị nhỏ hơn sang bên trái nó rồi sắp xếp từng bên. Khi bạn đi từng bước, các cột nằm ngoài đoạn mà lời gọi hiện tại đang xử lí sẽ mờ đi.',
  summary:
    'Xem sắp xếp trộn và sắp xếp nhanh chia mảng theo kiểu chia để trị, và xem khi nào sắp xếp nhanh tụt xuống O(n²).',
  instruction:
    'Chọn một thuật toán và một mảng ban đầu, rồi đi từng bước. Khung ngăn xếp cho biết mỗi lời gọi đang xử lí phần nào của mảng. Với sắp xếp nhanh, thử từng quy tắc chọn chốt trên mảng đã sắp xếp và mảng đảo ngược nhé.',
  algorithmLabel: 'Thuật toán',
  algorithms: { merge: 'Sắp xếp trộn', quick: 'Sắp xếp nhanh' },
  presetLabel: 'Mảng ban đầu',
  presets: {
    random: 'Ngẫu nhiên',
    sorted: 'Đã sắp xếp',
    'nearly-sorted': 'Gần như đã sắp xếp',
    reversed: 'Đảo ngược',
    'few-unique': 'Ít giá trị khác nhau',
  },
  sizeLabel: 'Kích thước',
  shuffle: 'Mảng mới',
  pivotLabel: 'Chốt',
  pivots: { last: 'Phần tử cuối', median3: 'Trung vị của ba', random: 'Ngẫu nhiên' },
  /** @param {string} rule  the label of the pivot rule just chosen */
  pivotNotice: (rule) => `Quy tắc chọn chốt: ${rule}. Đã dựng lại cả hai lần chạy.`,
  comparisons: 'Số lần so sánh',
  moves: { merge: 'Số lần ghi', quick: 'Số lần đổi chỗ' },
  depthLabel: 'Độ sâu đệ quy',
  /** @param {number} d @param {number} max @param {number} n  array size, for the balanced-tree reference */
  depthValue: (d, max, n) => `${d} (tối đa ${max}, cân bằng ≈ ${Math.ceil(Math.log2(n))})`,
  stackTitle: { merge: 'Ngăn xếp lời gọi (ngoài cùng trước)', quick: 'Các đoạn còn phải sắp xếp' },
  stackEmpty: 'rỗng',
  rangeChip: /** @param {number} lo @param {number} hi */ (lo, hi) => `[${lo}–${hi}]`,
  compareTitle: 'Tổng chi phí trên mảng này',
  compareRow: /** @param {number} c @param {number} s @param {string} moves */ (c, s, moves) =>
    `${c} lần so sánh · ${s} ${moves.replace(/^Số /, '').toLowerCase()}`,
  /** @param {boolean|null} ok  null when the array has no equal values to keep in order */
  stableLabel: (ok) =>
    ok === null
      ? 'mảng này không có giá trị bằng nhau'
      : ok
        ? 'các giá trị bằng nhau giữ nguyên thứ tự'
        : 'các giá trị bằng nhau bị đảo thứ tự',
  newArrayNotice: 'Đã nạp mảng mới.',
  bufferCaption:
    'Vùng đệm: bản sao của đoạn đang được trộn. ↑ là phần tử tiếp theo của mỗi đoạn, ✕ là đã ghi lại vào mảng.',
  stability,
  /**
   * @param {number[]} values
   * @param {number} sortedCount
   * @param {[number, number]|null} range  the range the current call is working on
   */
  barsLabel(values, sortedCount, range) {
    const working = range ? ` Đang xử lí [${range[0]}–${range[1]}].` : '';
    return `Mảng: ${values.join(', ')}. Đã xếp xong ${sortedCount}/${values.length} phần tử.${working}`;
  },
  /**
   * @param {number[]} values
   * @param {string} [progress]  which buffer slots are next or already taken
   */
  auxLabel(values, progress = '') {
    if (values.length === 0) return 'Vùng đệm: rỗng.';
    return `Vùng đệm: ${values.join(', ')}.${progress ? ` ${progress}` : ''}`;
  },
  /** @param {number|null} left @param {number|null} right @param {number} taken */
  bufferProgress(left, right, taken) {
    const next = [
      left === null ? '' : `Tiếp theo của đoạn trái: ${left}.`,
      right === null ? '' : `Tiếp theo của đoạn phải: ${right}.`,
    ]
      .filter(Boolean)
      .join(' ');
    return `Đã lấy ${taken}. ${next}`.trim();
  },
  legend: {
    compare: 'Đang so sánh',
    write: { merge: 'Đang ghi vào mảng', quick: 'Đang đổi chỗ' },
    lowSide: '≤ chốt, phía thấp',
    pivot: 'Chốt',
    run: 'Đoạn đã trộn',
    head: 'Tiếp theo của mỗi đoạn trong vùng đệm',
    taken: 'Đã lấy khỏi vùng đệm',
    sorted: 'Ở vị trí cuối cùng',
  },
  markers: { compare: '?', write: '⇄', pivot: 'P', sorted: '✓', run: '▬', head: '↑', taken: '✕' },
  /**
   * @param {DivideFrame} f
   * @param {'merge'|'quick'} algo
   */
  describe(f, algo) {
    const v = (/** @type {number} */ i) => f.items[i]?.value;
    const [lo, hi] = f.range ?? [0, 0];
    const mid = Math.floor((lo + hi) / 2);
    const [x, y] = f.focus;
    switch (f.kind) {
      case 'start':
        return algo === 'merge'
          ? 'Sắp xếp trộn chia đôi mọi đoạn cho đến khi chỉ còn từng phần tử. Đoạn một phần tử đã được sắp xếp, nên không tốn bước nào.'
          : 'Sắp xếp nhanh phân hoạch mỗi đoạn quanh một chốt. Đoạn một phần tử đã đứng đúng chỗ, nên không tốn bước nào.';
      case 'split':
        return `Chia [${lo}–${hi}] tại ${mid}: sắp xếp nửa trái, rồi đến nửa phải.`;
      case 'copy':
        return `Cả hai nửa của [${lo}–${hi}] đã được sắp xếp. Chép chúng vào vùng đệm, rồi trộn ngược vào mảng.`;
      case 'take': {
        const right = f.lines.includes(6) || (f.lines.includes(8) && !f.lines.includes(9));
        const why = f.lines.includes(6)
          ? 'đoạn trái đã hết'
          : f.lines.includes(7)
            ? 'đoạn phải đã hết'
            : right
              ? 'nó nhỏ hơn đầu đoạn trái'
              : 'đầu đoạn trái không lớn hơn (bằng nhau thì lấy bên trái)';
        return `Ghi ${v(x)} vào ô ${x} từ đoạn ${right ? 'phải' : 'trái'}: ${why}.`;
      }
      case 'merged':
        return `Đã trộn [${lo}–${hi}] thành một đoạn đã sắp xếp. Bỏ vùng đệm đi.`;
      case 'call':
        return `Sắp xếp [${lo}–${hi}].`;
      case 'pivot':
        return x === f.pivot
          ? `Chốt ${v(f.pivot)} đã nằm sẵn ở cuối [${lo}–${hi}].`
          : `Đưa chốt đã chọn về cuối [${lo}–${hi}]; chốt giờ là ${v(f.pivot)}.`;
      case 'scan':
        return f.swapped
          ? `${v(x)} ≤ chốt ${v(y)}: nó thuộc phía thấp.`
          : `${v(x)} > chốt ${v(y)}: để nó ở phía cao.`;
      case 'swap':
        return `Đổi chỗ ô ${x} và ô ${y} để nới rộng phía thấp.`;
      case 'place':
        return `Chốt ${v(x)} dừng ở chỉ số ${x}, vị trí cuối cùng của nó. Sắp xếp các đoạn ở hai bên.`;
      case 'done': {
        const totals = `Đã sắp xếp xong với ${f.comparisons} lần so sánh và ${f.swaps} ${algo === 'merge' ? 'lần ghi' : 'lần đổi chỗ'}.`;
        const s = stability(f.items);
        if (s === null) return totals;
        if (s.stable) return `${totals} Các giá trị bằng nhau giữ nguyên thứ tự.`;
        return `${totals} Các giá trị bằng nhau bị đảo thứ tự: ${s.earlier.value} (ban đầu đứng thứ ${s.earlier.id + 1}) giờ đứng sau ${s.later.value} (ban đầu đứng thứ ${s.later.id + 1}).`;
      }
    }
  },
  takeaways: [
    'Sắp xếp trộn luôn tốn khoảng n·log₂ n phép so sánh: có log₂ n tầng chia đôi, và mỗi tầng trộn n phần tử.',
    'Sắp xếp trộn ổn định (stable) vì khi bằng nhau nó lấy từ đoạn trái. Sắp xếp nhanh thì không: một lần đổi chỗ khi phân hoạch có thể nhảy qua một giá trị bằng nó.',
    'Nếu lấy phần tử cuối làm chốt, sắp xếp nhanh tốn thời gian bậc hai trên đầu vào đã sắp xếp, đảo ngược hoặc toàn giá trị bằng nhau: đệ quy sâu tới n tầng. Trung vị của ba chữa được đầu vào đã sắp xếp nhưng không chữa được đầu vào toàn giá trị bằng nhau; trường hợp đó cần phân hoạch ba nhánh.',
    'Sắp xếp trộn trả giá cho sự bảo đảm của nó bằng một vùng đệm O(n). Sắp xếp nhanh phân hoạch tại chỗ (in-place) và chỉ cần ngăn xếp lời gọi (call stack), giữ ở mức O(log n) nếu nó đệ quy vào phía nhỏ hơn trước.',
    'Thử sắp xếp nhanh với chốt “Phần tử cuối” trên mảng “Đảo ngược”, rồi đổi chốt sang “Trung vị của ba”: độ sâu đệ quy giảm mạnh.',
  ],
  complexityHead: ['Tài nguyên', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Thời gian, sắp xếp trộn', 'O(n log n)', 'log₂ n tầng, mỗi tầng n lần ghi.'],
    [
      'Thời gian, sắp xếp nhanh thường gặp',
      'O(n log n)',
      'Một chốt tốt chia đoạn thành hai nửa gần bằng nhau.',
    ],
    [
      'Thời gian, sắp xếp nhanh xấu nhất',
      'O(n²)',
      'Chốt luôn là giá trị nhỏ nhất hoặc lớn nhất thì một bên luôn rỗng.',
    ],
    [
      'Bộ nhớ thêm',
      'O(n) / O(log n)',
      'Sắp xếp trộn cần vùng đệm; sắp xếp nhanh chỉ cần ngăn xếp lời gọi.',
    ],
  ],
  nextTeaser:
    'Bài tiếp theo là sắp xếp vun đống: một cách đạt O(n log n) tại chỗ nhờ heap lớn nhất.',
};
