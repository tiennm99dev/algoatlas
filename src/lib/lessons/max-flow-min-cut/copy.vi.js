/** @typedef {import('$lib/algo-engine/max-flow-min-cut.js').MinCutFrame} MinCutFrame */
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

/** @param {string[]} list */
const set = (list) => `{${list.join(', ')}}`;

export const vi = {
  slug: 'max-flow-min-cut',
  topic: 'flows',
  level: 'Nâng cao',
  title: 'Định lí luồng cực đại, lát cắt nhỏ nhất',
  intro:
    'Một lát cắt s-t chia các đỉnh thành phía S chứa đỉnh phát và phía T chứa đỉnh thu. Mọi đơn vị luồng đều phải đi từ S sang T, nên không luồng nào lớn hơn sức chứa của bất kì lát cắt nào. Định lí luồng cực đại, lát cắt nhỏ nhất nói rằng hai đại lượng này gặp nhau: luồng lớn nhất bằng lát cắt nhỏ nhất, và đồ thị thặng dư (residual graph) cuối cùng chỉ ra lát cắt đó nằm ở đâu.',
  summary:
    'Tìm một luồng cực đại, tô bóng các đỉnh s còn đến được trong đồ thị thặng dư, rồi đọc ra một lát cắt nhỏ nhất có cùng giá trị.',
  instruction:
    'Chạy từng bước: luồng được tìm trước, rồi BFS (duyệt theo chiều rộng) tô bóng các đỉnh s còn đến được. Các cạnh đánh dấu ✂ ở cuối tạo thành lát cắt nhỏ nhất. Sau đó chọn “Lát cắt của em”, chuyển các đỉnh giữa hai phía và so sánh sức chứa của lát cắt em chọn với luồng cực đại.',
  presetLabel: 'Mạng',
  presets: {
    classic: 'Mạng trong sách',
    narrow: 'Eo hẹp ở giữa',
    ties: 'Nhiều lát cắt nhỏ nhất',
  },
  sourceLabel: 'Đỉnh phát s',
  sinkLabel: 'Đỉnh thu t',
  viewLabel: 'Chế độ xem',
  views: { flow: 'Luồng / sức chứa', residual: 'Đồ thị thặng dư', mine: 'Lát cắt của em' },
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
    flow: 'Mạng luồng. Mỗi cạnh ghi luồng / sức chứa; phía chứa đỉnh phát của lát cắt được tô bóng.',
    residual:
      'Đồ thị thặng dư. Cung liền còn trống c − f, cung nét đứt huỷ luồng; các đỉnh s đến được được tô bóng.',
    mine: 'Lát cắt của em. Các đỉnh tô bóng thuộc phía S; cạnh đi từ S sang T được ghi kèm sức chứa.',
  },
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Đỉnh ${name}`, state].filter(Boolean).join(', '),
  /** @param {string} u @param {string} v @param {number} f @param {number} c @param {string} state */
  edgeTitle: (u, v, f, c, state) =>
    [`Cạnh ${u} → ${v}: luồng ${f}/${c}`, state].filter(Boolean).join(', '),
  /** @param {string} u @param {string} v @param {number} room @param {boolean} forward */
  arcTitle: (u, v, room, forward) =>
    forward ? `Cung ${u} → ${v}: còn trống ${room}` : `Cung ngược ${u} → ${v}: huỷ được ${room}`,
  /** @param {string} u @param {string} v @param {number} c @param {boolean} crossing */
  mineTitle: (u, v, c, crossing) =>
    `Cạnh ${u} → ${v}: sức chứa ${c}${crossing ? ', đi từ S sang T' : ''}`,
  /** @param {number} f @param {number} c */
  flowLabel: (f, c) => `${f}/${c}`,
  /** @param {number} c */
  cutLabel: (c) => `✂ ${c}`,
  states: {
    source: 'đỉnh phát',
    sink: 'đỉnh thu',
    sSide: 'phía S',
    reached: 's đến được',
    now: 'vừa lấy ra khỏi queue',
    newly: 'vừa đến được',
    onPath: 'trên đường vừa đẩy',
    cut: 'cạnh cắt',
    full: 'bão hoà',
    carries: 'đang có luồng',
  },
  legend: {
    now: 'Vừa lấy ra khỏi queue',
    reached: 's đến được (phía S)',
    path: 'Đường vừa đẩy',
    cut: 'Cạnh cắt, S → T',
    dashed: 'Cung ngược',
    crossing: 'Đi từ S sang T',
  },
  stats: {
    value: 'Giá trị luồng',
    paths: 'Số đường tăng luồng',
    cut: 'Sức chứa lát cắt',
    edges: 'Số cạnh cắt',
  },
  queueTitle: 'Queue BFS',
  emptyQueue: 'rỗng',
  mine: {
    title: 'Lát cắt của em',
    help: 'Bấm vào một đỉnh để chuyển nó giữa phía S và phía T. s luôn ở phía S và t luôn ở phía T.',
    /** @param {string} name @param {boolean} inS */
    button: (name, inS) => `${name}: ${inS ? 'S' : 'T'}`,
    /** @param {string} name */
    aria: (name) => `${name} ở phía S`,
    crossingTitle: 'Các cạnh từ S sang T',
    none: 'không có',
    /** @param {number} c @param {number} best */
    verdict: (c, best) =>
      c === best
        ? `Sức chứa ${c} = luồng cực đại ${best}: một lát cắt nhỏ nhất.`
        : `Sức chứa ${c} > luồng cực đại ${best}: là một lát cắt, nhưng chưa nhỏ nhất.`,
    /** @param {string} name @param {number} c */
    edge: (name, c) => `${name} (${c})`,
  },
  /**
   * @param {MinCutFrame} f
   * @param {string[]} names
   * @param {{ s: string, t: string }} ends
   * @param {{ name: string, cap: number }[]} edgeInfo  Per input edge.
   */
  describe(f, names, { s, t }, edgeInfo) {
    const sSide = names.filter((_, v) => f.side[v]);
    switch (f.kind) {
      case 'start':
        return `Trước hết ta tìm một luồng cực đại từ ${s} đến ${t}; ở đây Edmonds-Karp đẩy luồng theo các đường tăng luồng (augmenting path) ngắn nhất.`;
      case 'augment':
        return `Đã đẩy ${f.bottleneck} theo ${route(f.path, names)}. Giá trị luồng: ${f.value}.`;
      case 'maxflow':
        return `Không còn đường nào từ ${s} đến ${t} còn trống, nên luồng có giá trị ${f.value} là cực đại. Giờ ta tìm các đỉnh ${s} còn đến được qua những cung còn trống.`;
      case 'visit':
        return f.found.length
          ? `Lấy ${names[f.at]} ra khỏi queue. Các cung còn trống của nó đến được ${join(f.found.map((v) => names[v]))}, các đỉnh này vào phía S.`
          : `Lấy ${names[f.at]} ra khỏi queue. Nó không đến được đỉnh mới nào: các cung của nó đã đầy hoặc dẫn ngược vào phía S.`;
      case 'cut': {
        const parts = f.cut.map((k) => edgeInfo[k]);
        return parts.length
          ? `S = ${set(sSide)}, còn T gồm các đỉnh còn lại. Các cạnh cắt ${join(parts.map((p) => p.name))} đều bão hoà, và các cạnh từ T về S không mang luồng, nên c(S, T) = ${parts.map((p) => p.cap).join(' + ')} = ${f.cutCapacity} = |f|.`
          : `S = ${set(sSide)}: không cạnh nào đi ra khỏi S, nên lát cắt có sức chứa 0, bằng đúng luồng.`;
      }
      case 'done':
        return f.side.some(Boolean)
          ? `Một lát cắt nhỏ nhất có sức chứa ${f.cutCapacity}, bằng luồng cực đại. Không lát cắt nào nhỏ hơn được, vì mọi đơn vị luồng đều đi qua mọi lát cắt.`
          : 'Hãy chọn hai đỉnh khác nhau làm đỉnh phát và đỉnh thu.';
    }
  },
  takeaways: [
    'Một lát cắt s-t (S, T) đặt s vào S và t vào T. Sức chứa c(S, T) của nó là tổng sức chứa các cạnh đi từ S sang T; các cạnh từ T về S không được tính.',
    'Với mọi luồng f và mọi lát cắt, |f| = (luồng S → T) − (luồng T → S) ≤ c(S, T). Vậy mọi lát cắt đều chặn trên mọi luồng.',
    'Khi không còn đường tăng luồng, gọi S là tập các đỉnh s đến được trong đồ thị thặng dư. Mỗi cạnh S → T đều đầy và mỗi cạnh T → S đều trống, nên |f| = c(S, T): luồng này cực đại và lát cắt này nhỏ nhất.',
    'Sau khi có luồng, phép tìm các đỉnh đến được chỉ tốn O(V + E). Khi có nhiều lát cắt nhỏ nhất, nó trả về lát cắt có phía S nhỏ nhất.',
    'Thử xem: trên “Nhiều lát cắt nhỏ nhất”, dùng “Lát cắt của em” để tìm mọi phía S có sức chứa bằng luồng cực đại 7.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Luồng cực đại',
      'O(V·E²)',
      'Dùng Edmonds-Karp; thuật toán luồng cực đại nào cũng được, Dinic chạy trong O(V²·E).',
    ],
    ['Tập đến được', 'O(V + E)', 'Một lần BFS qua các cung thặng dư còn trống.'],
    ['Cạnh cắt', 'O(E)', 'Một lượt duyệt các cạnh, giữ lại những cạnh đi từ S sang T.'],
    ['Bộ nhớ', 'O(V + E)', 'Luồng, các cung thặng dư và một dấu phía cho mỗi đỉnh.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Trên “Mạng trong sách”, dùng “Lát cắt của em” với S = {S, A}. Sức chứa của lát cắt này bằng bao nhiêu?',
      answer: 25,
      tolerance: 0,
      hints: [
        'Chỉ đếm các cạnh đi ra khỏi {S, A}. B → A đi vào tập này, nên không được tính.',
        'Các cạnh đi ra là S → B và A → C.',
      ],
      solution: 'S → B (13) + A → C (12) = 25, lớn hơn luồng cực đại 23.',
    },
    {
      type: 'number',
      prompt: 'Trên cùng mạng đó, lát cắt với S = {S} chỉ gồm một đỉnh có sức chứa bằng bao nhiêu?',
      answer: 29,
      tolerance: 0,
      hints: ['Cộng sức chứa các cạnh đi ra từ S.'],
      solution: 'S → A (16) + S → B (13) = 29.',
    },
    {
      type: 'multi',
      prompt:
        'Trên “Nhiều lát cắt nhỏ nhất”, luồng cực đại là 7. Những phía S nào cho lát cắt có sức chứa 7?',
      options: ['{S}', '{S, A}', '{S, B}', '{S, A, B}'],
      answers: [0, 1, 3],
      hints: [
        'Thử từng phương án bằng “Lát cắt của em”.',
        'Các cạnh đi qua {S, A} là S → B, A → B và A → T.',
      ],
      solution:
        '{S}: 4 + 3 = 7. {S, A}: 3 + 2 + 2 = 7. {S, B}: S → A 4 + B → T 5 = 9. {S, A, B}: 2 + 5 = 7. Ba trong bốn phương án là lát cắt nhỏ nhất.',
    },
    {
      type: 'choice',
      prompt:
        'Trên “Nhiều lát cắt nhỏ nhất”, phép tìm các đỉnh đến được trả về lát cắt nhỏ nhất nào?',
      options: ['{S}', '{S, A}', '{S, A, B}', 'Tuỳ vào thứ tự các cạnh'],
      answer: 0,
      hints: ['Sau khi có luồng cực đại, những cung nào ra khỏi S còn trống?'],
      solution:
        'Cả hai cạnh ra khỏi S đều bão hoà, nên BFS không đến được đỉnh nào và S = {S}. Phép tìm này luôn trả về lát cắt nhỏ nhất có phía S nhỏ nhất, dù bắt đầu từ luồng cực đại nào.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao không luồng nào lớn hơn sức chứa của một lát cắt s-t bất kì?',
      options: [
        'Vì Ford-Fulkerson dừng ở lát cắt đầu tiên nó gặp.',
        'Vì mọi đơn vị rời s đều phải đi từ S sang T, và các cạnh từ S sang T chứa được tối đa c(S, T).',
        'Vì các cạnh cắt luôn bão hoà.',
        'Vì một lát cắt có ít cạnh hơn một đường đi.',
      ],
      answer: 1,
      hints: ['Viết |f| bằng luồng đi qua lát cắt theo chiều thuận trừ luồng đi ngược lại.'],
      solution:
        '|f| = f(S → T) − f(T → S) ≤ f(S → T) ≤ c(S, T). Các cạnh cắt chỉ bão hoà khi luồng cực đại và lát cắt nhỏ nhất.',
    },
  ],
  nextTeaser:
    'Bài sau, ghép cặp trên đồ thị hai phía biến bài toán xếp cặp người với việc thành một mạng luồng có sức chứa bằng 1.',
};
