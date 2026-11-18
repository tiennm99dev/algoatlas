/** @typedef {import('$lib/algo-engine/centroid-decomposition.js').CentroidFrame} CentroidFrame */

/** Half of n, in Vietnamese notation (decimal comma) when n is odd. @param {number} n */
const half = (n) => String(n / 2).replace('.', ',');

export const vi = {
  slug: 'centroid-decomposition',
  topic: 'tree-techniques',
  level: 'Nâng cao',
  title: 'Phân rã trọng tâm',
  intro:
    'Trọng tâm (centroid) của cây là một nút mà khi bỏ nó đi, không mảnh nào còn lại chứa quá một nửa số nút của cây. Bỏ trọng tâm, rồi làm y như vậy với từng mảnh còn lại: các trọng tâm tạo thành một cây mới có độ sâu O(log n). Mọi đường đi trong cây ban đầu đi qua đúng một trọng tâm cao nhất, nên các câu hỏi về mọi đường đi, chẳng hạn có bao nhiêu cặp nút cách nhau đúng K cạnh, được chia thành những phần nhỏ.',
  summary:
    'Tìm trọng tâm của cây do em dựng, bỏ nó đi, đệ quy vào các mảnh và xem cây trọng tâm lớn dần trong khi các cặp nút cách nhau K cạnh được đếm.',
  instruction:
    'Chạy từng bước: mỗi mảnh được tính kích thước, một lượt đi bộ tiến vào con nào chứa quá một nửa mảnh, và nút nơi lượt đi dừng lại là trọng tâm. Trọng tâm đếm các cặp đi qua nó, bị bỏ đi, rồi các phần còn lại lần lượt được phân rã. Đổi K, chọn một mẫu, hoặc chọn một nút để thêm con hay xoá cây con của nó.',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presets: {
    sample: 'Cây mẫu',
    path: 'Đường thẳng 15 nút',
    star: 'Hình sao',
    random: 'Ngẫu nhiên',
  },
  kLabel: 'Khoảng cách K',
  addChild: 'Thêm con',
  remove: 'Xoá cây con',
  undo: 'Hoàn tác',
  /** @param {string} label */
  selectedText: (label) => `Đang chọn: ${label}`,
  errors: {
    /** @param {number} max */
    full: (max) => `Cây đã đầy (${max} nút). Hãy xoá một cây con trước.`,
    root: 'Gốc phải giữ lại: hãy xoá một cây con của nó, hoặc chọn một mẫu.',
    /** @param {number} max */
    k: (max) => `K là số cạnh, một số nguyên từ 1 đến ${max}.`,
  },
  treeTitle: 'Cây',
  /** @param {number} n */
  treeAria: (n) => `Cây gồm ${n} nút; các trọng tâm đã bỏ được tô xám.`,
  centroidTreeTitle: 'Cây trọng tâm',
  centroidTreeAria:
    'Cây trọng tâm dựng được đến lúc này: mỗi trọng tâm nằm trên các trọng tâm của những phần của nó.',
  /** @param {string} label @param {number} level @param {boolean} current */
  centroidNodeLabel: (label, level, current) =>
    `Trọng tâm ${label}, tầng ${level}${current ? ', vừa bị bỏ' : ''}`,
  centroidTreeEmpty: 'Chưa bỏ trọng tâm nào.',
  /** @param {number | null} size */
  sizeNote: (size) => (size === null ? '' : `s${size}`),
  /** @param {number | null} d */
  distNote: (d) => (d === null ? '' : `d${d}`),
  /** @param {number} level */
  levelNote: (level) => `t${level}`,
  noteKey:
    'Dưới mỗi nút: s = kích thước cây con trong mảnh, d = khoảng cách tới trọng tâm, t = tầng trong cây trọng tâm.',
  /** @param {string} label @param {string} state @param {string} note */
  nodeLabel: (label, state, note) => [`Nút ${label}`, note, state].filter(Boolean).join(', '),
  states: {
    walk: 'lượt đi đang ở đây',
    centroid: 'trọng tâm của mảnh này',
    piece: 'thuộc mảnh đang xử lí',
    pending: 'thuộc một mảnh đang chờ đến lượt',
    removed: 'đã bị bỏ trước đó vì là trọng tâm',
  },
  spoken: {
    /** @param {number} s */
    size: (s) => `kích thước cây con ${s}`,
    /** @param {number} d */
    dist: (d) => `cách trọng tâm ${d}`,
    /** @param {number} l */
    level: (l) => `tầng ${l} trong cây trọng tâm`,
  },
  markers: { active: '▶', sorted: '★', frontier: '…' },
  legend: {
    active: '▶ Lượt đi về phía nặng',
    sorted: '★ Trọng tâm',
    frontier: '… Đang chờ trong một mảnh sau',
    pruned: 'Đã bỏ trước đó (cạnh nét đứt là cạnh đã cắt)',
    selected: 'Đang chọn (vòng xanh mòng két đậm)',
  },
  pendingTitle: 'Các mảnh đang chờ (mảnh tiếp theo ở cuối)',
  pendingEmpty: 'không có',
  stats: {
    pairs: 'Số cặp cách nhau K',
    removed: 'Số trọng tâm đã bỏ',
    levels: 'Số tầng cây trọng tâm',
    work: 'Tổng số nút đã tính kích thước',
  },
  /** @param {CentroidFrame} f @param {string[]} labels */
  describe(f, labels) {
    const L = (/** @type {number} */ x) => labels[x];
    const total = f.piece.length;
    const n = f.removed.length;
    switch (f.kind) {
      case 'start':
        return `Phân rã cả cây, ${n} nút, và trên đường đi đếm các cặp nút cách nhau đúng K = ${f.k} cạnh.`;
      case 'component':
        return `Mảnh tiếp theo: ${total} nút, gốc tại ${L(f.piece[0])}. Tính kích thước mọi cây con bên trong nó; trọng tâm không để lại phần nào lớn hơn ${half(total)}.`;
      case 'walk':
        return `${L(f.c)} chứa ${f.size[f.c]} nút, nhiều hơn một nửa của ${total}: trọng tâm phải nằm trong đó. Đi tới ${L(f.c)}.`;
      case 'centroid':
        return total === 1
          ? `${L(f.c)} đứng một mình trong mảnh của nó, nên nó là trọng tâm của chính nó.`
          : `Không con nào của ${L(f.c)} chứa quá một nửa mảnh (${half(total)}), phần còn lại phía trên nó cũng vậy. ${L(f.c)} là trọng tâm: bỏ nó đi còn lại các phần ${f.parts.join(', ')}.`;
      case 'count':
        return `Khoảng cách từ ${L(f.c)} ghi dưới các nút. Số cặp qua ${L(f.c)} cách nhau ${f.k}, thuộc hai phần khác nhau hoặc gồm chính ${L(f.c)}: +${f.added}, đến giờ có ${f.pairs} cặp.`;
      case 'remove': {
        const p = /** @type {number} */ (f.ctParent[f.c]);
        const where =
          p < 0
            ? 'gốc của cây trọng tâm'
            : `một con của ${L(p)} trong cây trọng tâm, ở tầng ${f.level[f.c]}`;
        return `Bỏ ${L(f.c)}: nó trở thành ${where}. Giờ có ${f.pending.length} mảnh đang chờ.`;
      }
      case 'done': {
        const levels = Math.max(0, ...f.level.map((l) => (l === null ? 0 : l + 1)));
        return `Xong: cây trọng tâm có ${levels} tầng cho ${n} nút, và tổng số nút được tính kích thước trong mọi mảnh là ${f.work}. Số cặp cách nhau đúng ${f.k} cạnh: ${f.pairs}.`;
      }
    }
  },
  takeaways: [
    'Trọng tâm là một nút mà khi bỏ đi, không phần nào còn quá một nửa số nút. Cây nào cũng có trọng tâm: bắt đầu từ đâu cũng được, cứ bước vào con nào chứa quá một nửa, cho đến khi không còn con nào như vậy.',
    'Bỏ trọng tâm rồi đệ quy vào từng phần sẽ dựng nên cây trọng tâm. Mỗi phần có nhiều nhất một nửa số nút, nên cây trọng tâm có nhiều nhất log₂ n + 1 tầng.',
    'Mỗi nút được tính kích thước một lần ở mỗi tầng chứa nó, nên cả quá trình phân rã tốn O(n log n).',
    'Mọi đường đi có đúng một trọng tâm cao nhất nằm trên nó, đó là trọng tâm bị bỏ đầu tiên chạm vào đường đi. Đếm các đường đi qua mỗi trọng tâm, nối hai phần khác nhau, sẽ đếm mỗi đường đi đúng một lần.',
    'Chọn mẫu “Đường thẳng 15 nút”: trọng tâm luôn là nút ở giữa, nên cây trọng tâm là cây nhị phân cân bằng hoàn hảo 4 tầng. Rồi thử Hình sao với K = 2: một trọng tâm làm hết việc đếm.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Tìm một trọng tâm',
      'O(kích thước mảnh)',
      'Một lượt tính kích thước, rồi đi xuống theo nhiều nhất một đường đi.',
    ],
    [
      'Cả quá trình phân rã',
      'O(n log n)',
      'Mỗi nút được tính kích thước trong nhiều nhất log₂ n + 1 mảnh, mỗi tầng một mảnh.',
    ],
    ['Độ sâu cây trọng tâm', 'O(log n)', 'Mỗi tầng làm kích thước mảnh giảm ít nhất một nửa.'],
    [
      'Đếm các cặp cách nhau K',
      'O(n log n)',
      'Ở mỗi trọng tâm, mỗi nút trong mảnh một khoảng cách và một lần tra bảng.',
    ],
    ['Đếm cặp theo cách thô', 'O(n²)', 'Chạy BFS từ mọi nút.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt: 'Nút nào là trọng tâm đầu tiên của Cây mẫu?',
      options: ['A', 'B', 'D', 'F'],
      answer: 1,
      hints: [
        'Cây con của B chứa 8 trong 14 nút: nhiều hơn một nửa.',
        'Có con nào của B chứa quá 7 nút không?',
      ],
      solution:
        'Từ gốc A, B chứa 8 > 7 nút, nên lượt đi tới B. Các con của B chứa 5 và 2 nút, còn phần phía trên B chứa 14 − 8 = 6 nút: tất cả đều không quá 7. B là trọng tâm.',
    },
    {
      type: 'number',
      prompt: 'Cây trọng tâm của Đường thẳng 15 nút có bao nhiêu tầng?',
      answer: 4,
      unit: 'tầng',
      hints: ['Mỗi trọng tâm là nút ở giữa mảnh của nó.', '15 → 7 → 3 → 1 nút.'],
      solution:
        'Nút ở giữa chia 15 nút thành hai đường thẳng 7 nút, rồi 3, rồi 1: bốn tầng, H ở trên cùng.',
    },
    {
      type: 'number',
      prompt: 'Trong Hình sao (một tâm, 8 lá), có bao nhiêu cặp nút cách nhau đúng 2 cạnh?',
      answer: 28,
      unit: 'cặp',
      hints: ['Hai nút cách nhau 2 cạnh khi và chỉ khi cả hai đều là lá.', 'Chọn 2 trong 8 lá.'],
      solution:
        'Hai lá bất kì nối với nhau qua tâm, nên số cặp là 8 × 7 / 2 = 28, tất cả được tìm thấy ở trọng tâm đầu tiên.',
    },
  ],
  nextTeaser:
    'Bài sau, Luyện tập: bài toán cây nâng cao, dùng các kĩ thuật vừa học để trả lời truy vấn đường đi và truy vấn khoảng cách trên cây.',
};
