/** @typedef {import('$lib/algo-engine/polygon-area.js').PolygonFrame} PolygonFrame */
/** @typedef {import('$lib/algo-engine/polygon-area.js').Point} Point */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');
/** @param {number} v */
const signed = (v) => (v > 0 ? `+${v}` : num(v));
/** @param {Point} p */
const pt = (p) => `(${p.x}, ${p.y})`;
export const vi = {
  slug: 'polygon-area',
  topic: 'geometry',
  level: 'Trung bình',
  title: 'Diện tích đa giác và điểm trong đa giác',
  intro:
    'Chỉ cần đi một vòng quanh các cạnh của đa giác là ta trả lời được hai câu hỏi. Công thức dây giày (shoelace formula) cộng một số hạng có dấu cho mỗi cạnh để ra diện tích và chiều đi vòng. Phương pháp chiếu tia (ray casting) và chỉ số vòng quay (winding number) đếm cách các cạnh đi qua một điểm để biết điểm đó có nằm trong đa giác không.',
  summary:
    'Tính diện tích đa giác bằng công thức dây giày, rồi kiểm tra một điểm bằng phương pháp chiếu tia và chỉ số vòng quay trên đa giác em tự sửa.',
  instruction:
    'Chọn một phương pháp rồi kéo các đỉnh. Nhấn vào chỗ trống để thêm đỉnh, hoặc dùng các ô nhập bên dưới. Ở chế độ dây giày, hãy xem tam giác có dấu từ gốc toạ độ tới mỗi cạnh cộng dồn thành diện tích. Ở hai chế độ còn lại, kéo Q và đếm xem các cạnh làm gì. Chọn ví dụ ngôi sao: hai phép kiểm tra cho kết quả khác nhau.',
  methodLabel: 'Phương pháp',
  methods: {
    shoelace: 'Diện tích theo công thức dây giày',
    ray: 'Chiếu tia',
    winding: 'Chỉ số vòng quay',
  },
  presetLabel: 'Ví dụ',
  presets: {
    rectangle: 'Hình chữ nhật',
    lShape: 'Hình chữ L',
    clockwise: 'Tam giác theo chiều kim đồng hồ',
    notch: 'Hình diều có khấc',
    throughVertex: 'Tia đi qua một đỉnh',
    star: 'Ngôi sao năm cánh',
  },
  fields: { x: 'x', y: 'y' },
  addVertex: 'Thêm đỉnh',
  removeVertex: 'Xoá đỉnh đang chọn',
  /** @param {number} i @param {number} x @param {number} y */
  vertexLabel: (i, x, y) => `Đỉnh ${i} ở (${x}, ${y})`,
  /** @param {number} x @param {number} y */
  queryLabel: (x, y) => `Điểm cần xét Q ở (${x}, ${y})`,
  planeLabel:
    'Một đa giác sửa được trên mặt phẳng toạ độ. Phím mũi tên chuyển giữa các điểm; Shift + mũi tên dời một điểm, Enter chọn một điểm và Delete xoá một đỉnh.',
  /** @param {number} xMax @param {number} yMax */
  coordError: (xMax, yMax) => `x phải là số nguyên từ 0 đến ${xMax}, còn y từ 0 đến ${yMax}.`,
  /** @param {number} max */
  fullError: (max) => `Đa giác ở đây có nhiều nhất ${max} đỉnh.`,
  /** @param {number} min */
  minError: (min) => `Đa giác cần ít nhất ${min} đỉnh.`,
  occupiedError: 'Ở đó đã có một đỉnh.',
  selectFirst: 'Hãy chọn một đỉnh trước: nhấn vào nó, hoặc chọn nó bằng bàn phím rồi nhấn Enter.',
  legend: {
    current: 'Cạnh đang đọc',
    positive: 'Số hạng dương: tam giác từ gốc toạ độ',
    negative: 'Số hạng âm',
    polygon: 'Đa giác',
    ray: 'Nét đứt: tia xuất phát từ Q',
    crossing: '× Tia cắt một cạnh',
    up: 'Cạnh đi lên: w + 1',
    down: 'Cạnh đi xuống: w − 1',
  },
  selfCrossing:
    'Đường viền này tự cắt chính nó, nên tổng dây giày tính mỗi vùng theo số lần được quấn quanh, chứ không phải diện tích thông thường.',
  tableTitles: {
    shoelace: 'Các số hạng, mỗi cạnh một số hạng',
    ray: 'Các cạnh so với tia',
    winding: 'Các cạnh đi qua Q',
  },
  tableHeads: {
    edge: 'Cạnh',
    shoelace: ['Số hạng', 'Tổng'],
    ray: ['Cắt?', 'Số lần'],
    winding: ['Thay đổi', 'w'],
  },
  rowEmpty: 'Chưa đọc cạnh nào.',
  /** @param {number} i @param {number} j */
  edgeName: (i, j) => `${i} → ${j}`,
  /** @param {import('$lib/algo-engine/polygon-area.js').EdgeRow} r */
  rowValue: (r) => {
    if (r.result === 'term') return signed(r.value);
    if (r.result === 'boundary') return 'Trên cạnh';
    if (r.result === 'cross') return 'Có';
    if (r.result === 'up') return '+1';
    if (r.result === 'down') return '−1';
    return '–';
  },
  /** @param {number} v */
  rowTotal: num,
  stats: {
    area: 'Diện tích',
    sum: 'Tổng hiện tại',
    direction: 'Chiều các đỉnh',
    location: 'Q nằm',
    crossings: 'Số lần tia cắt cạnh',
    winding: 'Chỉ số vòng quay w',
    edges: 'Số cạnh đã đọc',
    vertices: 'Số đỉnh',
  },
  pending: '…',
  directions: {
    ccw: 'Ngược chiều kim đồng hồ',
    cw: 'Theo chiều kim đồng hồ',
    flat: 'Không có diện tích',
  },
  locations: { inside: 'Bên trong', outside: 'Bên ngoài', boundary: 'Trên biên' },
  /** @param {number} v */
  num,
  workedTitle: 'Ví dụ mẫu: tam giác (1, 1), (5, 1), (3, 4)',
  workedSteps: [
    'Cạnh 0 → 1: 1 · 1 − 5 · 1 = −4, nên tổng là −4.',
    'Cạnh 1 → 2: 5 · 4 − 3 · 1 = 17, nên tổng là 13.',
    'Cạnh 2 → 0: 3 · 1 − 1 · 4 = −1, nên tổng là 12.',
    'Tổng dương nên các đỉnh đi ngược chiều kim đồng hồ. Diện tích là |12| / 2 = 6.',
    'Điểm (3, 2) có nằm trong không? Tia sang phải từ điểm này chỉ cắt cạnh từ (5, 1) đến (3, 4), tại x = 13/3. Một lần cắt là số lẻ, nên điểm nằm bên trong.',
  ],
  /** @param {PolygonFrame} f */
  describe: (f) => {
    const n = f.polygon.length;
    const where = () => vi.locations[f.location ?? 'outside'].toLowerCase();
    if (f.kind === 'start') {
      if (f.method === 'shoelace') return `${n} đỉnh. Bắt đầu với tổng bằng 0 rồi đi dọc các cạnh.`;
      if (f.method === 'ray')
        return `Chiếu một tia từ Q ${pt(f.query)} sang phải. Ban đầu coi như ở bên ngoài, và đổi trạng thái mỗi lần tia cắt một cạnh.`;
      return `Đứng tại Q ${pt(f.query)} và bắt đầu với w = 0. Mỗi cạnh đi lên qua bên phải Q cộng 1, mỗi cạnh đi xuống trừ 1.`;
    }
    const edge = f.edge === null ? null : f.rows[f.rows.length - 1];
    if (f.kind === 'edge' && edge) {
      const a = f.polygon[edge.i];
      const b = f.polygon[edge.j];
      const name = `Cạnh ${edge.i} → ${edge.j}`;
      if (edge.result === 'term')
        return `${name}: ${num(a.x)} · ${num(b.y)} − ${num(b.x)} · ${num(a.y)} = ${num(edge.value)}. Tổng giờ là ${num(f.sum)}.`;
      if (edge.result === 'cross') return `${name} cắt tia ở bên phải Q.`;
      if (edge.result === 'up') return `${name} đi lên qua bên phải Q: w = ${num(f.winding)}.`;
      if (edge.result === 'down') return `${name} đi xuống qua bên phải Q: w = ${num(f.winding)}.`;
      if (a.y > f.query.y === b.y > f.query.y)
        return `${name} nằm hẳn về một phía so với độ cao của Q. Bỏ qua.`;
      return `${name} đi qua độ cao của Q ở bên trái Q. Bỏ qua.`;
    }
    if (f.kind === 'toggle')
      return `Vậy là ${f.crossings} lần cắt, nên kết luận tạm thời giờ là ${f.inside ? 'bên trong' : 'bên ngoài'}.`;
    if (f.method === 'shoelace') {
      const way =
        f.direction === 'ccw'
          ? 'dương: các đỉnh đi ngược chiều kim đồng hồ'
          : f.direction === 'cw'
            ? 'âm: các đỉnh đi theo chiều kim đồng hồ'
            : 'bằng 0: đa giác không bao diện tích nào';
      return `Tổng ${num(f.sum)} ${way}. Diện tích = |${num(f.sum)}| / 2 = ${f.area}.`;
    }
    if (f.location === 'boundary') {
      const last = f.rows[f.rows.length - 1];
      return `Q ${pt(f.query)} nằm trên cạnh ${last.i} → ${last.j}, nên Q nằm trên biên.`;
    }
    if (f.method === 'ray')
      return `Tổng cộng ${f.crossings} lần cắt, là số ${
        f.crossings % 2 ? 'lẻ' : 'chẵn'
      }: Q nằm ${where()}.`;
    return `w = ${num(f.winding)}, ${f.winding === 0 ? 'bằng 0' : 'khác 0'}: Q nằm ${where()}.`;
  },
  takeaways: [
    'Công thức dây giày: cộng x_i · y_(i+1) − x_(i+1) · y_i quanh đa giác, rồi lấy một nửa độ lớn của tổng. Mỗi số hạng bằng hai lần diện tích có dấu của tam giác từ gốc toạ độ tới cạnh đó.',
    'Dấu của tổng cho biết chiều đi: dương là ngược chiều kim đồng hồ, âm là theo chiều kim đồng hồ. Đảo thứ tự các đỉnh thì dấu đổi, còn diện tích giữ nguyên.',
    'Chiếu tia: từ Q đi sang phải và đếm số lần cắt. Lẻ là bên trong, chẵn là bên ngoài. Chỉ tính một cạnh với các độ cao từ đầu dưới của nó trở lên, không tính đầu trên, để một đỉnh nằm trên tia chỉ được đếm một lần.',
    'Chỉ số vòng quay: cộng 1 cho mỗi cạnh đi lên qua bên phải Q, trừ 1 cho mỗi cạnh đi xuống. Q nằm trong khi w khác 0. Với đa giác không tự cắt, hai phép kiểm tra luôn cho cùng kết quả.',
    'Chọn ngôi sao và so sánh hai phương pháp tại tâm: tia đếm được số chẵn nên kết luận bên ngoài, còn w = −2 cho biết bên trong. Giờ kéo Q vào một cánh sao, nơi hai phương pháp đồng ý với nhau.',
  ],
  complexityHead: ['Phép toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Diện tích theo công thức dây giày',
      'Thời gian O(n), bộ nhớ O(1)',
      'Mỗi cạnh một số hạng, chỉ dùng phép tính trên số nguyên.',
    ],
    ['Chiếu tia', 'Thời gian O(n), bộ nhớ O(1)', 'Mỗi cạnh một phép kiểm tra thời gian hằng.'],
    [
      'Chỉ số vòng quay',
      'Thời gian O(n), bộ nhớ O(1)',
      'Cũng mỗi cạnh một phép kiểm tra, dùng phép kiểm tra hướng quay.',
    ],
    [
      'Điểm trong đa giác lồi',
      'Thời gian O(log n)',
      'Tìm kiếm nhị phân trên chùm tam giác toả ra từ một đỉnh.',
    ],
  ],
  nextTeaser:
    'Bài sau tìm bao lồi: đa giác lồi nhỏ nhất bao quanh một tập điểm, dựng bằng chính phép kiểm tra hướng quay.',
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Đa giác (0, 0), (4, 0), (4, 3), (0, 3) có diện tích bằng bao nhiêu?',
      answer: 12,
      hints: ['Cộng x_i · y_(i+1) − x_(i+1) · y_i cho mỗi cạnh.', 'Các số hạng là 0, 12, 12 và 0.'],
      solution:
        'Tổng là 0 + 12 + 12 + 0 = 24, nên diện tích là 24 / 2 = 12, khớp với chiều rộng nhân chiều cao.',
    },
    {
      type: 'number',
      prompt:
        'Tổng dây giày, trước khi chia đôi, của tam giác (2, 2), (5, 7), (10, 2) bằng bao nhiêu?',
      answer: -40,
      hints: [
        'Giữ nguyên dấu.',
        'Các số hạng là 2 · 7 − 5 · 2 = 4, rồi 5 · 2 − 10 · 7 = −60, rồi 10 · 2 − 2 · 2 = 16.',
      ],
      solution:
        '4 − 60 + 16 = −40. Tổng âm vì các đỉnh đi theo chiều kim đồng hồ, và diện tích là 20.',
    },
    {
      type: 'choice',
      prompt: 'Một tổng dây giày ra −56. Em biết được gì?',
      options: [
        'Diện tích là 56 và các đỉnh đi ngược chiều kim đồng hồ',
        'Diện tích là 28 và các đỉnh đi theo chiều kim đồng hồ',
        'Đa giác bị nhập sai, vì diện tích không thể âm',
      ],
      answer: 1,
      hints: ['Diện tích bằng một nửa độ lớn của tổng. Dấu là chiều đi.'],
      solution:
        '|−56| / 2 = 28, và tổng âm nghĩa là theo chiều kim đồng hồ. Dấu là thông tin, không phải lỗi.',
    },
    {
      type: 'number',
      prompt:
        'Xét hình chữ L (1, 1), (9, 1), (9, 3), (4, 3), (4, 7), (1, 7) và Q = (0, 5). Tia từ Q đi sang phải cắt bao nhiêu cạnh?',
      answer: 2,
      hints: [
        'Chỉ những cạnh trải qua độ cao 5 mới được tính.',
        'Đó là hai cạnh thẳng đứng, ở x = 4 và x = 1.',
      ],
      solution:
        'Các cạnh ở x = 4 và x = 1 đều trải qua độ cao 5 và nằm bên phải Q. Hai lần cắt là số chẵn, nên Q nằm bên ngoài.',
    },
    {
      type: 'choice',
      prompt:
        'Q nằm ở tâm một ngôi sao năm cánh vẽ bằng một nét liền. Hai phép kiểm tra cho kết quả gì?',
      options: [
        'Cả hai đều nói bên trong',
        'Cả hai đều nói bên ngoài',
        'Chiếu tia nói bên ngoài, còn chỉ số vòng quay nói bên trong',
        'Chiếu tia nói bên trong, còn chỉ số vòng quay nói bên ngoài',
      ],
      answer: 2,
      hints: [
        'Tại tâm, đường viền quấn quanh Q hai lần.',
        'Quấn hai vòng nghĩa là số lần cắt là số chẵn.',
      ],
      solution:
        'Tia cắt một số chẵn cạnh, nên quy tắc chẵn lẻ nói bên ngoài. Chỉ số vòng quay là ±2, khác 0, nên nó nói bên trong. Hai phép kiểm tra chỉ khác nhau trên những đường viền tự cắt.',
    },
  ],
};
