/** @typedef {import('$lib/algo-engine/heavy-light-decomposition.js').HldFrame} HldFrame */

export const vi = {
  slug: 'heavy-light-decomposition',
  topic: 'tree-techniques',
  level: 'Nâng cao',
  title: 'Phân rã nặng nhẹ',
  intro:
    'Phân rã nặng nhẹ (heavy-light decomposition, HLD) cắt cây thành các chuỗi sao cho mọi đường đi chỉ đi qua O(log n) chuỗi. Đánh số các nút theo từng chuỗi thì mỗi chuỗi thành một khối liền nhau của mảng, nên một truy vấn trên đường đi (tổng, giá trị lớn nhất, cập nhật) trở thành vài truy vấn đoạn trên một segment tree (cây phân đoạn).',
  summary:
    'Tách cây của chính em thành các chuỗi nặng, rồi xem một truy vấn tổng trên đường đi được chia thành vài đoạn liên tiếp của segment tree.',
  instruction:
    'Chạy từng bước qua hai lượt duyệt: lượt đầu tính kích thước mọi cây con và chọn con nặng của mỗi nút (H trên cạnh), lượt thứ hai đánh số các nút để mỗi chuỗi là một khối. Sau đó chọn u và v rồi xem truy vấn leo lên từng chuỗi, mỗi lần một đoạn. Chọn một nút để đổi giá trị, thêm con hoặc xoá nó.',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presets: {
    sample: 'Cây mẫu',
    binary: 'Cây nhị phân đầy đủ',
    path: 'Đường thẳng',
    random: 'Ngẫu nhiên',
  },
  uLabel: 'u',
  vLabel: 'v',
  valueLabel: 'Giá trị',
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
    value: (max) => `Giá trị là số nguyên từ 0 đến ${max}.`,
  },
  treeTitle: 'Cây',
  /** @param {number} n */
  treeAria: (n) => `Cây có gốc gồm ${n} nút; H đánh dấu cạnh nặng.`,
  heavyMark: 'H',
  /** @param {number} value @param {number | null} pos */
  note: (value, pos) => (pos === null ? `${value}` : `${value} #${pos}`),
  noteKey: 'Dưới mỗi nút: giá trị của nó, rồi #vị trí của nó trong mảng nền.',
  /** @param {string} label @param {number} value @param {number | null} pos @param {string} head @param {string} state */
  nodeLabel: (label, value, pos, head, state) =>
    [
      `Nút ${label}`,
      `giá trị ${value}`,
      pos === null ? '' : `vị trí ${pos} trên chuỗi ${head}`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  states: {
    active: 'đang xử lí',
    visited: 'đã xong',
    head: 'đầu chuỗi',
    u: 'u ở đây',
    v: 'v ở đây',
    both: 'cả u và v đều ở đây',
    range: 'thuộc đoạn đang cộng',
    summed: 'đã cộng',
  },
  markers: { head: '◆', active: '▶' },
  legend: {
    active: '▶ Đang xử lí, hoặc đoạn đang cộng (u, v đánh dấu hai đầu)',
    visited: 'Đã tính kích thước hoặc đã đánh số',
    path: 'Đã cộng trên đường đi',
    head: '◆ Đầu chuỗi',
    heavy: 'H trên một cạnh: cạnh nặng (tới con lớn nhất)',
    selected: 'Đang chọn (vòng xanh mòng két đậm)',
  },
  arrayTitle: 'Mảng nền theo thứ tự vị trí: mỗi chuỗi là một khối',
  arrayAria: 'Giá trị các nút theo thứ tự vị trí, các đoạn đã cộng được đóng ngoặc.',
  arrayEmpty: 'Còn trống cho đến khi lượt duyệt thứ hai đánh số các nút.',
  /** @param {string} label @param {number} value */
  cellLabel: (label, value) => `${label}, giá trị ${value}`,
  /** @param {string} head */
  windowLabel: (head) => `chuỗi ${head}`,
  chainsTitle: 'Các chuỗi (đầu chuỗi trước)',
  chainsEmpty: 'chưa đánh số',
  stats: {
    sum: 'Tổng trên đường đi',
    ranges: 'Số đoạn trên chuỗi',
    visits: 'Số nút segment tree',
    walk: 'Số nút trên đường đi',
  },
  notYet: '?',
  /** @param {HldFrame} f @param {string[]} labels */
  describe(f, labels) {
    const L = (/** @type {number} */ x) => labels[x];
    const at = (/** @type {number} */ p) => f.pos.indexOf(p);
    switch (f.kind) {
      case 'start':
        return 'Lượt duyệt thứ nhất (dfs1): tính kích thước mọi cây con từ lá trở lên, và chọn con nặng của mỗi nút.';
      case 'size': {
        const h = /** @type {number} */ (f.heavy[f.current]);
        if (h < 0) return `${L(f.current)} là lá: kích thước 1, không có con nặng.`;
        const others =
          /** @type {number} */ (f.size[f.current]) - 1 - /** @type {number} */ (f.size[h]) > 0;
        return `${L(f.current)} có kích thước ${f.size[f.current]}. Con lớn nhất của nó là ${L(h)} (kích thước ${f.size[h]}), nên ${L(f.current)}–${L(h)} là cạnh nặng${others ? '; các cạnh tới những con còn lại là cạnh nhẹ' : ''}.`;
      }
      case 'place': {
        const x = f.current;
        const p = f.pos[x];
        if (f.via === 'root')
          return `Lượt duyệt thứ hai (dfs2): gốc ${L(x)} mở đầu chuỗi thứ nhất ở vị trí ${p}.`;
        if (f.via === 'heavy')
          return `${L(x)} là con nặng: nó nối tiếp chuỗi ${L(/** @type {number} */ (f.head[x]))} ở vị trí ${p}, ngay sau cha của nó.`;
        return `${L(x)} treo trên một cạnh nhẹ: nó mở đầu một chuỗi mới ở vị trí ${p}.`;
      }
      case 'query':
        return `Giờ mỗi chuỗi là một khối vị trí. Cộng các giá trị trên đường đi ${L(f.u)} – ${L(f.v)} (${f.pathNodes} nút).`;
      case 'range': {
        const r = f.ranges[f.ranges.length - 1];
        const low = at(r.to);
        const span = r.from === r.to ? `chỉ ${L(low)}` : `từ ${L(r.head)} xuống ${L(low)}`;
        return `${f.swapped ? 'Đổi chỗ u và v trước. ' : ''}head[u] = ${L(r.head)} sâu ít nhất bằng head[v] = ${L(/** @type {number} */ (f.head[f.v]))}, nên cộng các vị trí ${r.from}..${r.to} (${span}): +${r.sum}. Rồi u nhảy qua cạnh nhẹ phía trên ${L(r.head)} đến ${L(f.u)}.`;
      }
      case 'last': {
        const r = f.ranges[f.ranges.length - 1];
        return `${L(at(r.from))} và ${L(at(r.to))} giờ đã cùng một chuỗi${f.swapped ? ' (đã đổi chỗ để u là nút ở trên)' : ''}: cộng các vị trí ${r.from}..${r.to}: +${r.sum}.`;
      }
      case 'done':
        return `Tổng trên đường đi = ${f.ranges.map((r) => r.sum).join(' + ')} = ${f.sum}, từ ${f.ranges.length} đoạn và ${f.visits} nút segment tree. Đi dọc đường đi từng nút một thì phải đọc ${f.pathNodes} nút.`;
    }
  },
  takeaways: [
    'Con nặng của một nút là con có cây con lớn nhất; cạnh tới nó là cạnh nặng, mọi cạnh khác là cạnh nhẹ.',
    'Bên dưới một cạnh nhẹ, cây con có nhiều nhất một nửa số nút của cây con phía trên, nên đường đi từ gốc qua nhiều nhất log₂ n cạnh nhẹ và mọi đường đi gặp O(log n) chuỗi.',
    'Đánh số con nặng trước thì mỗi chuỗi có một khối vị trí liên tiếp, nên một segment tree trên mảng đó phục vụ mọi chuỗi: một truy vấn đường đi tốn O(log n) đoạn × O(log n) mỗi đoạn = O(log² n).',
    'Truy vấn leo lên từ đầu có đầu chuỗi sâu hơn, cộng khối của chuỗi đó, rồi nhảy qua cạnh nhẹ phía trên đầu chuỗi, cho đến khi hai đầu nằm trên cùng một chuỗi.',
    'Chọn mẫu Đường thẳng: cả cây là một chuỗi, nên truy vấn nào cũng chỉ là một đoạn. Rồi chọn Cây nhị phân đầy đủ và truy vấn hai lá: bốn đoạn.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Phân rã (hai lượt duyệt)', 'O(n)', 'Mỗi lượt duyệt thăm mọi nút một lần.'],
    ['Dựng segment tree', 'O(n)', 'Mỗi vị trí một lá, mỗi nút trong một phép cộng.'],
    [
      'Truy vấn đường đi',
      'O(log² n)',
      'O(log n) đoạn trên chuỗi, mỗi đoạn là một truy vấn segment tree O(log n).',
    ],
    ['Cập nhật một điểm', 'O(log n)', 'Một lá của segment tree và các tổ tiên của nó.'],
    [
      'Đi dọc đường đi theo cách thô',
      'O(n)',
      'Mỗi nút trên đường đi một bước; một đường đi dài chiếm gần hết cây.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trong Cây mẫu có bao nhiêu chuỗi?',
      answer: 6,
      unit: 'chuỗi',
      hints: [
        'Mỗi chuỗi có một đầu chuỗi, đánh dấu ◆.',
        'Đếm gốc cộng với mọi nút đi tới qua một cạnh nhẹ.',
      ],
      solution:
        'Các đầu chuỗi là A, C, E, F, I và L: gốc cộng với năm con nhẹ. Các chuỗi là A–B–D–H–M, C–G–K, E, F–J–N–O, I và L.',
    },
    {
      type: 'number',
      prompt: 'Trong Cây mẫu, tổng các giá trị trên đường đi M – L là bao nhiêu?',
      answer: 34,
      hints: [
        'Chạy đến cuối truy vấn và cộng các đoạn lại.',
        'Các đoạn cộng lại thành 8 + 6 + 20.',
      ],
      solution:
        'Chỉ L (+8), rồi C..G (+6), rồi A..M trên chuỗi thứ nhất (+20): 8 + 6 + 20 = 34. Đường đi M, H, D, B, A, C, G, L có các giá trị 9 + 6 + 1 + 1 + 3 + 4 + 2 + 8 = 34.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao đường đi từ gốc xuống một nút qua nhiều nhất log₂ n cạnh nhẹ?',
      options: [
        'Cạnh nhẹ luôn ngắn hơn cạnh nặng.',
        'Mỗi lần đi xuống qua một cạnh nhẹ, kích thước cây con giảm ít nhất một nửa.',
        'Mỗi nút có nhiều nhất hai con.',
        'Segment tree có log₂ n tầng.',
      ],
      answer: 1,
      hints: ['So sánh cây con của một con nhẹ với cây con của cha nó.'],
      solution:
        'Anh em nặng lớn ít nhất bằng con nhẹ c, nên 2·size(c) < size(cha). Mỗi cạnh nhẹ trên đường đi xuống làm kích thước giảm một nửa, mà một kích thước không thể giảm một nửa quá log₂ n lần.',
    },
  ],
  nextTeaser:
    'Phân rã nặng nhẹ chia đường đi theo chuỗi. Bài sau, Phân rã trọng tâm, chia chính cây theo trọng tâm để đếm mọi đường đi.',
};
