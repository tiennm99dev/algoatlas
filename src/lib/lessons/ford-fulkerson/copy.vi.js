/** @typedef {import('$lib/algo-engine/ford-fulkerson.js').FordFulkersonFrame} FordFulkersonFrame */
/** @typedef {import('$lib/algo-engine/ford-fulkerson.js').PathArc} PathArc */

/**
 * A path as vertex names joined by arrows; a backward step is drawn ⇠.
 * @param {PathArc[]} path @param {string[]} names
 */
const route = (path, names) =>
  path.length
    ? [names[path[0].from], ...path.map((a) => `${a.forward ? '→' : '⇠'} ${names[a.to]}`)].join(' ')
    : '';

/** @param {string[]} list */
const join = (list) =>
  list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} và ${list.at(-1)}`;

export const vi = {
  slug: 'ford-fulkerson',
  topic: 'flows',
  level: 'Trung bình',
  title: 'Mạng luồng và thuật toán Ford-Fulkerson',
  intro:
    'Mạng luồng là một đồ thị có hướng mà mỗi cạnh mang một sức chứa: lượng tối đa đi qua được trong một đơn vị thời gian, giống như nước chảy qua ống. Hàng hoá rời đỉnh phát s và đến đỉnh thu t, còn mọi đỉnh khác nhận vào bao nhiêu thì chuyển đi đúng bấy nhiêu. Thuật toán Ford-Fulkerson tìm luồng lớn nhất có thể bằng cách đẩy thêm luồng theo các đường tăng luồng (augmenting path) của đồ thị thặng dư (residual graph) cho đến khi không còn đường nào.',
  summary:
    'Đẩy luồng theo các đường tăng luồng của đồ thị thặng dư, huỷ những lựa chọn chưa tốt qua cung ngược và đạt luồng cực đại.',
  instruction:
    'Chạy từng bước và quan sát mỗi đường tăng luồng sáng lên, rồi lượng cổ chai của nó được đẩy dọc theo đường. Chuyển chế độ xem sang “Đồ thị thặng dư” để thấy các cung mà phép tìm kiếm thực sự đi qua, cung ngược vẽ nét đứt. Chọn “Huỷ luồng” để thấy một đường đi dùng một cạnh theo chiều ngược.',
  presetLabel: 'Mạng',
  presets: {
    classic: 'Mạng trong sách',
    cancel: 'Huỷ luồng',
    split: 'Hai lối đi',
  },
  sourceLabel: 'Đỉnh phát s',
  sinkLabel: 'Đỉnh thu t',
  viewLabel: 'Chế độ xem',
  views: { flow: 'Luồng / sức chứa', residual: 'Đồ thị thặng dư' },
  resetGraph: 'Đặt lại mạng',
  editTitle: 'Sửa mạng',
  editor: {
    graphAria: 'Trình sửa mạng: một đồ thị có hướng, trọng số của mỗi cạnh là sức chứa.',
    edgesTitle: 'Sức chứa',
    noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
    /** @param {string} name */
    capacityAria: (name) => `Sức chứa của cạnh ${name}`,
  },
  /** @param {number} max */
  badCapacity: (max) => `Sức chứa phải là số nguyên từ 1 đến ${max}. Sức chứa cũ được giữ lại.`,
  /** @param {number} max */
  clipped: (max) => `Sức chứa lớn hơn ${max} được giảm xuống ${max}.`,
  sameEnds: 'Đỉnh phát và đỉnh thu phải là hai đỉnh khác nhau. Lựa chọn cũ được giữ lại.',
  boardAria: {
    flow: 'Mạng luồng. Mỗi cạnh ghi luồng / sức chứa; mỗi đỉnh ghi luồng vào và luồng ra.',
    residual:
      'Đồ thị thặng dư. Cung liền u → v còn trống c − f; cung nét đứt v → u có thể huỷ f đơn vị luồng.',
  },
  /** @param {string} name @param {string} state @param {string} balance */
  vertexLabel: (name, state, balance) =>
    [`Đỉnh ${name}`, balance, state].filter(Boolean).join(', '),
  /** @param {string} u @param {string} v @param {number} f @param {number} c @param {string} state */
  edgeTitle: (u, v, f, c, state) =>
    [`Cạnh ${u} → ${v}: luồng ${f}/${c}`, state].filter(Boolean).join(', '),
  /** @param {string} u @param {string} v @param {number} room @param {boolean} forward @param {boolean} hot */
  arcTitle: (u, v, room, forward, hot) =>
    [
      forward ? `Cung ${u} → ${v}: còn trống ${room}` : `Cung ngược ${u} → ${v}: huỷ được ${room}`,
      hot ? 'trên đường tăng luồng' : '',
    ]
      .filter(Boolean)
      .join(', '),
  /** @param {number} f @param {number} c */
  flowLabel: (f, c) => `${f}/${c}`,
  /** @param {'source'|'sink'|'inner'} role @param {number} into @param {number} out */
  balance: (role, into, out) =>
    role === 'source' ? `ra ${out}` : role === 'sink' ? `vào ${into}` : `vào ${into} = ra ${out}`,
  states: {
    source: 'đỉnh phát',
    sink: 'đỉnh thu',
    onPath: 'trên đường tăng luồng',
    searched: 'phép tìm kiếm đã đến',
    forward: 'đường đi thêm luồng ở đây',
    backward: 'đường đi huỷ luồng ở đây',
    full: 'bão hoà',
    carries: 'đang có luồng',
  },
  legend: {
    onPath: 'Trên đường đi',
    searched: 'Phép tìm kiếm đã đến',
    forward: 'Đường đi thêm luồng',
    backward: 'Đường đi huỷ luồng',
    carries: 'Đang có luồng',
    full: 'Bão hoà (f = c)',
    dashed: 'Cung ngược',
  },
  stats: {
    value: 'Giá trị luồng',
    paths: 'Số đường tăng luồng',
    bottleneck: 'Cổ chai b',
    checks: 'Số lần xét cung',
  },
  pathTitle: 'Đường tăng luồng',
  emptyPath: 'chưa có',
  /** @param {string} u @param {string} v @param {boolean} forward */
  pathStep: (u, v, forward) => (forward ? `${u} → ${v}` : `${u} ⇠ ${v} (huỷ)`),
  /**
   * @param {FordFulkersonFrame} f
   * @param {string[]} names
   * @param {{ s: string, t: string }} ends
   */
  describe(f, names, { s, t }) {
    const back = f.path.filter((a) => !a.forward);
    const cancels = join(back.map((a) => `${names[a.to]} → ${names[a.from]}`));
    switch (f.kind) {
      case 'start':
        return `Mọi cạnh bắt đầu với luồng 0. Ta tìm một đường đi từ ${s} đến ${t} mà mọi cung trên đó còn trống.`;
      case 'path':
        return `DFS tìm được ${route(f.path, names)}. Phần trống nhỏ nhất trên đường là cổ chai b = ${f.bottleneck}.${
          back.length ? ` Bước vẽ ⇠ dùng ${cancels} theo chiều ngược.` : ''
        }`;
      case 'push':
        return `Đẩy ${f.bottleneck} dọc theo đường đi: cộng vào mỗi cạnh thuận${
          back.length ? ` và trừ bớt ở ${cancels}` : ''
        }. Giá trị luồng giờ là ${f.value}, và mọi đỉnh trừ ${s} và ${t} vẫn chuyển đi đúng lượng nhận vào.`;
      case 'none':
        return `Không còn đường nào từ ${s} đến ${t} còn trống: phép tìm kiếm chỉ đến được ${join(
          f.seen.map((v) => names[v]),
        )}. Không có đường tăng luồng nghĩa là luồng đã cực đại.`;
      case 'done':
        return f.augmentations
          ? `Xong sau ${f.augmentations} đường tăng luồng và ${f.checks} lần xét cung: luồng cực đại từ ${s} đến ${t} là ${f.value}.`
          : `Xong: không có luồng nào đi được từ ${s} đến ${t}, nên luồng cực đại là 0.`;
    }
  },
  takeaways: [
    'Một luồng tuân theo hai quy tắc: trên mọi cạnh 0 ≤ f ≤ c (sức chứa), và tại mọi đỉnh trừ s và t, luồng vào bằng luồng ra (bảo toàn luồng). Giá trị của luồng là tổng luồng ròng rời khỏi s.',
    'Đồ thị thặng dư cho biết những gì còn thay đổi được: cạnh u → v có c − f > 0 cho một cung thuận còn trống đúng chừng ấy, và cạnh đang mang f > 0 cho một cung ngược v → u có thể huỷ tối đa f.',
    'Đường tăng luồng là mọi đường đi s → t trong đồ thị thặng dư. Đẩy lượng cổ chai của nó vẫn giữ hai quy tắc và làm giá trị luồng tăng đúng bằng cổ chai.',
    'Cung ngược cho phép phương pháp sửa một lựa chọn chưa tốt lúc đầu, nên thứ tự tìm ra các đường đi không ngăn nó đạt cực đại. Với sức chứa nguyên, thuật toán dừng sau tối đa (luồng cực đại) lần đẩy.',
    'Thử xem: trên “Huỷ luồng”, tăng S → A lên 2 và đoán luồng cực đại mới trước khi chạy (đếm lượng có thể vào T), rồi xem chế độ thặng dư ở bước cuối.',
  ],
  complexityHead: ['Trường hợp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Thời gian, sức chứa nguyên',
      'O(E · |f*|)',
      'Mỗi lần tìm kiếm tốn O(V + E) và mỗi lần đẩy thêm ít nhất 1, nên có tối đa |f*| (giá trị luồng cực đại) lần tìm kiếm.',
    ],
    [
      'Thời gian, chọn đường kém',
      'Có thể rất lớn',
      'Hai đường đi không may có thể mỗi lần chỉ chuyển 1 đơn vị qua một cạnh ở giữa, nên mạng có sức chứa một triệu cần hai triệu lần đẩy; với sức chứa vô tỉ, phương pháp thậm chí có thể không dừng.',
    ],
    [
      'Bộ nhớ',
      'O(V + E)',
      'Một giá trị luồng cho mỗi cạnh, các cung thặng dư và dấu đánh của phép tìm kiếm.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Trên “Mạng trong sách”, chạy đến bước cuối. Luồng cực đại từ S đến T bằng bao nhiêu?',
      answer: 23,
      tolerance: 0,
      hints: [
        'Đọc giá trị luồng ở bước cuối, hoặc cộng luồng trên các cạnh đi vào T.',
        'C → T mang 19 và D → T mang 4.',
      ],
      solution:
        'Bốn đường tăng luồng đẩy 4, 8, 4 và 7, nên giá trị luồng là 23. Các cạnh vào T mang 19 + 4 = 23.',
    },
    {
      type: 'number',
      prompt:
        'Cạnh A → C có sức chứa 12 và đang mang 8 đơn vị. Trong đồ thị thặng dư, cung ngược C → A còn trống bao nhiêu?',
      answer: 8,
      tolerance: 0,
      hints: ['Cung ngược có thể huỷ lượng luồng mà cạnh đang mang.'],
      solution:
        'Cung thuận A → C còn trống 12 − 8 = 4, còn cung ngược C → A còn trống 8: một đường đi có thể huỷ cả 8 đơn vị.',
    },
    {
      type: 'choice',
      prompt:
        'Trên “Huỷ luồng”, DFS (duyệt theo chiều sâu) đầu tiên gửi 1 đơn vị theo S → A → B → T. Cạnh nào không mang luồng ở cuối?',
      options: ['S → A', 'A → B', 'A → T', 'B → T'],
      answer: 1,
      hints: ['Đường đi thứ hai là S → B ⇠ A → T.', 'Bước B ⇠ A huỷ đơn vị luồng trên A → B.'],
      solution:
        'Đường đi thứ hai dùng A → B theo chiều ngược và rút đơn vị luồng của nó, nên luồng cuối cùng đi S → A → T và S → B → T, không có gì trên A → B.',
    },
    {
      type: 'multi',
      prompt: 'Những khẳng định nào đúng với mọi luồng, ở mọi bước của thuật toán Ford-Fulkerson?',
      options: [
        'Mỗi cạnh mang không quá sức chứa của nó.',
        'Mọi đỉnh khác s và t nhận vào đúng bằng lượng gửi đi.',
        'Mọi cạnh đi ra từ s đều bão hoà.',
        'Giá trị luồng bằng luồng ròng đi vào t (vào trừ ra).',
      ],
      answers: [0, 1, 3],
      hints: ['Nhìn các ghi chú dưới các đỉnh trên “Mạng trong sách”.'],
      solution:
        'Sức chứa và bảo toàn luồng là hai quy tắc của một luồng, và bảo toàn luồng buộc luồng ròng ra khỏi s phải đến t thành luồng ròng đi vào. Cạnh ra từ s không nhất thiết đầy: ở cuối, S → A chỉ mang 12 trên 16.',
    },
  ],
  nextTeaser:
    'Bài sau, thuật toán Edmonds-Karp và Dinic chọn đường tăng luồng ngắn nhất bằng BFS (duyệt theo chiều rộng), nên số lần đẩy không còn phụ thuộc vào sức chứa.',
};
