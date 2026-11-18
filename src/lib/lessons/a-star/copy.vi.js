/** @typedef {import('$lib/algo-engine/a-star.js').AStarFrame} AStarFrame */
/** @typedef {import('$lib/algo-engine/a-star.js').Heuristic} Heuristic */
import { gridCopy } from '../grid-copy.vi.js';

export const vi = {
  ...gridCopy,
  slug: 'a-star',
  topic: 'shortest-paths',
  level: 'Nâng cao',
  title: 'Tìm kiếm A*',
  intro:
    'Thuật toán Dijkstra loang đều ra mọi hướng, kể cả hướng xa đích. Tìm kiếm A* thêm một hàm ước lượng h(n), tức là con số đoán chi phí còn lại từ n đến đích, và luôn mở rộng ô có f(n) = g(n) + h(n) nhỏ nhất, trong đó g(n) là chi phí đã đi. Với hàm ước lượng không bao giờ đoán quá, A* vẫn tìm được đường đi ngắn nhất mà mở rộng ít ô hơn nhiều.',
  summary:
    'So sánh số ô mà thuật toán Dijkstra và A* mở rộng trên lưới, và xem hàm ước lượng h quyết định cả tốc độ lẫn chất lượng đường đi ra sao.',
  instruction:
    'Chọn một hàm ước lượng rồi bấm phát. Chuyển con số trên ô giữa g, h và f để xem A* so sánh gì. Bảng so sánh chạy cả ba hàm ước lượng trên cùng lưới: vẽ tường, hoặc dời điểm xuất phát và đích, rồi xem các con số thay đổi.',
  heuristicLabel: 'Hàm ước lượng',
  heuristics: {
    zero: 'h = 0 (Dijkstra)',
    manhattan: 'Manhattan',
    triple: '3 × Manhattan',
  },
  numbersLabel: 'Số trên ô',
  numbers: { g: 'g', h: 'h', f: 'f' },
  clearWalls: 'Xoá tường',
  resetGrid: 'Đặt lại lưới',
  hotLabel: 'vừa đẩy vào',
  openLabel: 'Tập mở (mục đầu tiên ra trước)',
  openEmpty: 'rỗng',
  /** @param {string} at @param {number} g @param {number} h @param {boolean} stale */
  openChip: (at, g, h, stale) => `${at} f ${g + h} = ${g} + ${h}${stale ? ' (cũ)' : ''}`,
  stats: {
    expanded: 'Số ô đã mở rộng',
    pushes: 'Số lần đẩy vào',
    path: 'Độ dài đường đi',
  },
  compareTitle: 'Cả ba hàm ước lượng trên lưới này',
  compareHead: ['Hàm ước lượng', 'Đã mở rộng', 'Đường đi'],
  noPath: 'không có',
  legend: {
    start: 'Điểm xuất phát',
    goal: 'Đích',
    wall: 'Tường',
    frontier: 'Trong tập mở',
    closed: 'Đã mở rộng (đã đóng)',
    current: 'Đang mở rộng',
    path: 'Đường đi tìm được',
  },
  /** @param {string} which @param {number | null} value */
  numberNote: (which, value) => (value === null ? '' : `${which} ${value}`),
  /**
   * @param {AStarFrame} f
   * @param {number} cols
   * @param {Heuristic} kind
   * @param {(cell: number) => number} h
   */
  describe(f, cols, kind, h) {
    const at = (/** @type {number} */ c) => vi.coord(c, cols);
    const g = (/** @type {number} */ c) => f.g[c];
    const fOf = (/** @type {number} */ c) => `f = g + h = ${g(c)} + ${h(c)} = ${g(c) + h(c)}`;
    switch (f.kind) {
      case 'start': {
        const s = f.open[0]?.[0] ?? -1;
        return kind === 'zero'
          ? 'Đưa điểm xuất phát vào tập mở với g = 0. Khi h = 0 ở mọi nơi thì f = g, và A* chính là thuật toán Dijkstra.'
          : `Đưa điểm xuất phát vào tập mở với g = 0 và f = h(start) = ${h(s)}.`;
      }
      case 'pop':
        return `Lấy ${at(f.current)} ra với ${fOf(f.current)}, f nhỏ nhất trong tập mở, rồi đóng nó lại.`;
      case 'stale':
        return `Lấy ${at(f.current)} ra, nhưng ô này đã đóng hoặc từ đó đã được đến rẻ hơn: đây là bản cũ, bỏ qua.`;
      case 'push':
        return f.improved
          ? `Đi qua ${at(f.current)} đến được ${at(f.touched)} rẻ hơn: ${fOf(f.touched)}. Đẩy một mục mới vào.`
          : `${at(f.touched)}: g = ${g(f.current)} + 1 = ${g(f.touched)} và h = ${h(f.touched)}, nên f = ${g(f.touched) + h(f.touched)}. Đẩy nó vào.`;
      case 'found':
        return kind === 'triple'
          ? `Đã đến đích sau khi mở rộng ${f.closed.length} ô. Đường đi có ${f.path.length - 1} bước, nhưng 3 × Manhattan có thể đoán quá, nên đường này chưa chắc ngắn nhất.`
          : `Đã đến đích sau khi mở rộng ${f.closed.length} ô. Đường đi có ${f.path.length - 1} bước, và đó là một đường đi ngắn nhất vì h không bao giờ đoán quá.`;
      case 'no-path':
        return 'Tập mở đã rỗng mà vẫn chưa đến được đích: tường đã chặn kín.';
    }
  },
  takeaways: [
    'A* mở rộng ô có f = g + h nhỏ nhất: g là chi phí đã đi từ điểm xuất phát, h là ước lượng chi phí còn lại. Khi h = 0, A* chính là thuật toán Dijkstra.',
    'Một hàm ước lượng là chấp nhận được khi nó không bao giờ đoán quá chi phí còn lại thật; khi đó A* trả về một đường đi ngắn nhất. Trên lưới đi bốn hướng với mỗi bước tốn 1, khoảng cách Manhattan |Δhàng| + |Δcột| là chấp nhận được.',
    'Một hàm ước lượng là nhất quán khi h(n) ≤ cost(n, n′) + h(n′) với mọi bước đi. Khi đó f không bao giờ giảm dọc một đường đi, nên một ô đã đóng không bao giờ phải mở lại. Nhất quán kéo theo chấp nhận được; ở đây khoảng cách Manhattan có cả hai tính chất.',
    'Hàm ước lượng chấp nhận được mà càng sát thực tế thì càng mở rộng ít ô. Một hàm đoán quá, như 3 × Manhattan, lao thẳng về đích và có thể trả về đường dài hơn, có khi còn chẳng tiết kiệm được công.',
    'Thử xem: trên lưới ban đầu, so sánh cột Đã mở rộng của ba hàm ước lượng, rồi chạy từng bước với 3 × Manhattan để thấy nó lao vào cái túi dưới thanh chắn.',
  ],
  complexityHead: ['Trường hợp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Xấu nhất',
      'O((V + E) log V)',
      'Giống thuật toán Dijkstra với heap nhị phân (đống nhị phân): khi h = 0, hoặc hàm ước lượng không định hướng được gì, mọi ô đều có thể bị mở rộng.',
    ],
    [
      'Hàm ước lượng tốt',
      'Ít lần mở rộng hơn nhiều',
      'Chỉ các ô có f nhỏ hơn chi phí của đường đi ngắn nhất mới phải mở rộng; h càng gần khoảng cách thật thì các ô đó càng ít.',
    ],
    ['Bộ nhớ', 'O(V)', 'Mỗi ô một g, một cha và một cờ đã đóng, cộng với tập mở.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trên lưới ban đầu, h = 0 (Dijkstra) mở rộng tất cả bao nhiêu ô, tính cả ô đích?',
      answer: 118,
      unit: 'ô',
      tolerance: 0,
      hints: ['Đọc cột Đã mở rộng trong bảng so sánh, hoặc cho h = 0 chạy đến cuối.'],
      solution:
        'Thuật toán Dijkstra mở rộng 118 ô. Nó loang ra mọi hướng, kể cả hướng xa đích, cho đến khi tới lượt đích ở khoảng cách 15.',
    },
    {
      type: 'number',
      prompt:
        'Trên cùng lưới đó, A* với hàm ước lượng Manhattan mở rộng bao nhiêu ô, tính cả ô đích?',
      answer: 36,
      unit: 'ô',
      tolerance: 0,
      hints: ['Vẫn bảng đó, hàng Manhattan.'],
      solution:
        'Chỉ 36 ô, chưa đến một phần ba so với 118 ô của thuật toán Dijkstra, và đường đi vẫn là đường ngắn nhất, 15 bước.',
    },
    {
      type: 'number',
      prompt: 'Trên lưới ban đầu, đường đi mà 3 × Manhattan trả về dài bao nhiêu bước?',
      answer: 21,
      unit: 'bước',
      tolerance: 0,
      hints: ['Nó lao vào cái túi dưới thanh chắn và phải vòng qua chân tường.'],
      solution:
        'Nó trả về đường đi 21 bước, dài hơn đường ngắn nhất 6 bước. Hàm ước lượng đoán quá, nên A* tin nó quá mức và sa vào cái túi.',
    },
    {
      type: 'multi',
      prompt:
        'Trên lưới đi bốn hướng mà mỗi bước tốn 1, những hàm ước lượng nào là chấp nhận được? Chọn mọi phương án đúng.',
      options: [
        'h = 0',
        'Khoảng cách Manhattan',
        '3 × khoảng cách Manhattan',
        'Khoảng cách đường thẳng (khoảng cách Euclid)',
      ],
      answers: [0, 1, 3],
      hints: [
        'Chấp nhận được nghĩa là h(n) không bao giờ lớn hơn chi phí thật của đường rẻ nhất từ n đến đích.',
        'Mọi đường đi trên lưới cần ít nhất |Δhàng| + |Δcột| bước, và đường thẳng không bao giờ dài hơn con số đó.',
      ],
      solution:
        'h = 0, Manhattan và Euclid không bao giờ vượt quá chi phí còn lại thật, nên cả ba đều chấp nhận được; Manhattan là hàm sát thực tế nhất trong ba. 3 × Manhattan đoán quá: chỉ còn một bước đến đích mà nó nói 3.',
    },
  ],
  nextTeaser:
    'Đến lúc tự chọn công cụ. Bài sau là luyện tập: bài toán đường đi ngắn nhất, nơi em chọn đúng thuật toán cho từng tình huống.',
};
