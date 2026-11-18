/** @typedef {import('$lib/algo-engine/practice-flows.js').ModelFrame} ModelFrame */
/** @typedef {import('$lib/algo-engine/practice-flows.js').ModelCheck} ModelCheck */
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
  slug: 'practice-flows',
  topic: 'flows',
  level: 'Nâng cao',
  title: 'Luyện tập: mô hình hoá bằng luồng',
  intro:
    'Phần lớn bài toán luồng không được cho sẵn dưới dạng một mạng. Chúng đến dưới dạng một câu chuyện về nông trại, bộ định tuyến, học sinh hay xe tải, và việc chính là dựng mạng: cái gì chảy, bắt đầu và kết thúc ở đâu, và giới hạn nào trở thành sức chứa. Khi mô hình đã đúng, thuật toán luồng cực đại nào cũng cho ra đáp số, còn lát cắt nhỏ nhất cho biết điều gì giới hạn đáp số đó.',
  summary:
    'Biến các bài toán có lời văn thành mạng luồng với siêu đỉnh phát, siêu đỉnh thu, tách đỉnh và sức chứa bằng 1, rồi kiểm tra mô hình và giải bằng luồng cực đại.',
  instruction:
    'Chọn một câu chuyện và đọc kĩ. Ở chế độ “Dựng”, thêm, xoá và nối lại các cạnh, đặt sức chứa cho chúng đến khi hình vẽ mô tả đúng câu chuyện, rồi bấm “Kiểm tra mô hình”. Chuyển sang “Chạy” và chạy từng bước Edmonds-Karp trên hình vẽ của em; các cạnh đánh dấu ✂ ở cuối là thứ giới hạn đáp số.',
  scenarioLabel: 'Câu chuyện',
  scenarios: {
    supply: {
      name: 'Nông trại và chợ',
      labels: ['S', 'F', 'G', 'D', 'P', 'Q', 'T'],
      story:
        'Hai nông trại F và G mỗi ngày thu hoạch 9 và 7 tấn rau. Xe tải chở rau theo các đường một chiều có giới hạn mỗi ngày: F → D 5, F → P 3, G → D 6 và G → Q 2, rồi từ kho D → P 4 và D → Q 6. Chợ P bán được 8 tấn mỗi ngày, chợ Q bán được 9 tấn. Mỗi ngày có thể đưa tối đa bao nhiêu tấn rau đến các chợ? S và T là các đỉnh dự phòng cho mô hình của em.',
      tip: 'Có hai nơi phát và hai nơi nhận: nối S đến mỗi nông trại với sức chứa bằng sản lượng thu hoạch, và nối mỗi chợ đến T với sức chứa bằng lượng chợ bán được.',
    },
    routers: {
      name: 'Bộ định tuyến có giới hạn',
      labels: ['S', 'A', 'A′', 'B', 'B′', 'T'],
      story:
        'Máy chủ S truyền dữ liệu đến T qua hai bộ định tuyến A và B. Các đường truyền chịu được, tính bằng Mbit/s: S → A 8, S → B 6, A → B 4, A → T 5 và B → T 9. Bộ định tuyến A chuyển tiếp được tổng cộng tối đa 6 Mbit/s, còn B tối đa 7. Tổng tốc độ cao nhất là bao nhiêu? A′ và B′ là các đỉnh dự phòng cho mô hình của em.',
      tip: 'Giới hạn trên một đỉnh chưa phải là cạnh. Tách A thành A → A′ với sức chứa 6: các đường đi vào A vẫn nối vào A, các đường đi ra từ A thì xuất phát từ A′. Làm tương tự với B.',
    },
    clubs: {
      name: 'Học sinh và câu lạc bộ',
      labels: ['S', 'X', 'Y', 'Z', 'C', 'R', 'T'],
      story:
        'Ba học sinh X, Y và Z đăng kí vào câu lạc bộ cờ vua C và câu lạc bộ rô-bốt R. X và Z thích cả hai câu lạc bộ, Y chỉ thích cờ vua. X và Z có thời gian cho hai câu lạc bộ, Y chỉ cho một. Câu lạc bộ cờ vua còn 2 chỗ, rô-bốt còn 3 chỗ. Không ai vào một câu lạc bộ hai lần. Có thể có tối đa bao nhiêu lượt đăng kí? S và T là các đỉnh dự phòng cho mô hình của em.',
      tip: 'Một đơn vị luồng là một lượt đăng kí. S → học sinh mang số câu lạc bộ học sinh đó được vào, học sinh → câu lạc bộ mang 1 (tối đa một lần), câu lạc bộ → T mang số chỗ còn trống.',
    },
    convoys: {
      name: 'Xe tải trên đường chung',
      labels: ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'T'],
      story:
        'Các xe tải rời kho S đến thành phố T theo các đường một chiều; số vẽ trên mỗi đường là chiều dài tính bằng km. Để an toàn, không có hai xe nào được đi chung một con đường. Có thể cho tối đa bao nhiêu xe đi được?',
      tip: 'Chiều dài không giới hạn số xe đi qua. “Mỗi đường tối đa một lần” nghĩa là sức chứa 1 trên mọi con đường, và luồng cực đại đếm số đường đi không chung cạnh.',
    },
  },
  viewLabel: 'Chế độ',
  views: { build: 'Dựng', run: 'Chạy' },
  checkModel: 'Kiểm tra mô hình',
  showModel: 'Xem một mô hình đúng',
  resetDrawing: 'Đặt lại hình vẽ',
  tipTitle: 'Bí rồi? Xem mẹo',
  storyTitle: 'Câu chuyện',
  editor: {
    graphAria: 'Bảng vẽ mô hình: một đồ thị có hướng, trọng số của mỗi cạnh là sức chứa.',
    edgesTitle: 'Sức chứa',
    noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
    /** @param {string} name */
    capacityAria: (name) => `Sức chứa của cạnh ${name}`,
  },
  /** @param {number} max */
  badCapacity: (max) => `Sức chứa phải là số nguyên từ 1 đến ${max}. Sức chứa cũ được giữ lại.`,
  /** @param {number} max */
  clipped: (max) => `Sức chứa lớn hơn ${max} được giảm xuống ${max}.`,
  shownModel: 'Đây là một mô hình đúng. Chuyển sang Chạy để xem luồng cực đại trên đó.',
  boardAria:
    'Mô hình của em khi luồng cực đại đang chạy. Mỗi cạnh ghi luồng / sức chứa; sau khi chạy xong, phía chứa đỉnh phát của lát cắt nhỏ nhất được tô bóng.',
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Đỉnh ${name}`, state].filter(Boolean).join(', '),
  /** @param {string} u @param {string} v @param {number} f @param {number} c @param {string} state */
  edgeTitle: (u, v, f, c, state) =>
    [`Cạnh ${u} → ${v}: luồng ${f}/${c}`, state].filter(Boolean).join(', '),
  /** @param {number} f @param {number} c */
  flowLabel: (f, c) => `${f}/${c}`,
  /** @param {number} f @param {number} c */
  cutLabel: (f, c) => `✂ ${f}/${c}`,
  states: {
    source: 'đỉnh phát',
    sink: 'đỉnh thu',
    sSide: 'phía S của lát cắt',
    onPath: 'trên đường vừa đẩy',
    cut: 'cạnh cắt',
    full: 'bão hoà',
    carries: 'đang có luồng',
  },
  legend: {
    sSide: 'S vẫn đến được (phía của lát cắt)',
    path: 'Đường vừa đẩy',
    full: 'Bão hoà',
    carries: 'Đang có luồng',
    cut: 'Cạnh cắt: giới hạn đáp số',
  },
  stats: {
    value: 'Luồng của mô hình',
    paths: 'Số đường tăng luồng',
    edges: 'Số cạnh đã vẽ',
    cut: 'Sức chứa lát cắt',
  },
  check: {
    title: 'Kiểm tra mô hình',
    idle: 'Dựng mô hình, rồi bấm “Kiểm tra mô hình”.',
    /** @param {number} answer */
    ok: (answer) =>
      `Mô hình đúng. Luồng cực đại của nó, ${answer}, là đáp số cho câu hỏi trong câu chuyện.`,
    /** @param {ModelCheck} c */
    summary: (c) =>
      `Chưa đúng: ${[
        c.missing.length && `thiếu ${c.missing.length} cạnh`,
        c.extra.length && `${c.extra.length} cạnh câu chuyện không cần`,
        c.wrong.length && `${c.wrong.length} sức chứa sai`,
      ]
        .filter(Boolean)
        .join(', ')}.`,
    extraTitle: 'Không cần',
    wrongTitle: 'Sai sức chứa',
    /** @param {string} name @param {number} got */
    wrong: (name, got) => `${name} (${got})`,
  },
  /**
   * @param {ModelFrame} f
   * @param {string[]} names
   * @param {{ s: string, t: string, vertices: number }} ends
   * @param {{ name: string, cap: number }[]} edgeInfo  Per input edge.
   */
  describe(f, names, { s, t, vertices }, edgeInfo) {
    if (!f.valid) return 'Mô hình cần có cả S và T. Bấm “Đặt lại hình vẽ” để lấy lại đỉnh đã xoá.';
    switch (f.kind) {
      case 'start':
        return `Mô hình của em có ${vertices} đỉnh và ${edgeInfo.length} cạnh. Giờ Edmonds-Karp đẩy luồng từ ${s} đến ${t} theo các đường ngắn nhất còn trống.`;
      case 'augment':
        return `Đã đẩy ${f.bottleneck} theo ${route(f.path, names)}. Luồng đến lúc này: ${f.value}.`;
      case 'maxflow': {
        const parts = f.cut.map((k) => edgeInfo[k]);
        const side = names.filter((_, v) => f.side[v]);
        return parts.length
          ? `Không còn đường nào từ ${s} đến ${t} còn trống. ${s} vẫn đến được {${side.join(', ')}}; các cạnh đầy ${join(parts.map((p) => p.name))} đi ra khỏi phía đó, tạo thành lát cắt nhỏ nhất ${parts.map((p) => p.cap).join(' + ')} = ${f.cutCapacity}. Chúng giới hạn đáp số.`
          : `Không cạnh nào đi ra khỏi {${side.join(', ')}}, tập các đỉnh ${s} đến được, nên không có gì đi được từ ${s} đến ${t}. Hãy nối chúng lại.`;
      }
      case 'done':
        return `Mô hình của em mang được tối đa ${f.value}. Nếu mô hình đúng, đó là đáp số của câu chuyện; bấm “Kiểm tra mô hình” để đối chiếu.`;
    }
  },
  takeaways: [
    'Để mô hình hoá một câu chuyện thành luồng, hãy hỏi: cái gì di chuyển (hàng hoá, dữ liệu, người, xe tải), bắt đầu và kết thúc ở đâu, và điều gì giới hạn nó. Mỗi giới hạn trở thành một sức chứa, và một đơn vị luồng là một đơn vị của đáp số.',
    'Nhiều nơi phát hoặc nhiều nơi nhận: thêm một siêu đỉnh phát S nối đến mỗi nơi phát với sức chứa bằng lượng cung, và một siêu đỉnh thu T nhận cạnh từ mỗi nơi nhận với sức chứa bằng lượng cầu.',
    'Sức chứa c trên đỉnh v: tách v thành v và v′, nối bằng v → v′ có sức chứa c. Các cạnh đi vào v vẫn nối vào v, các cạnh đi ra từ v thì xuất phát từ v′, nên mọi luồng qua v đều phải đi qua đúng cạnh đó. Tách mọi đỉnh chỉ tốn thêm V đỉnh và V cạnh.',
    'Những luật như “tối đa một lần” trở thành sức chứa 1: học sinh → câu lạc bộ trong bài toán phân công, hoặc mọi con đường khi đếm các đường đi không chung cạnh. Khi đó luồng cực đại đếm số lựa chọn hoặc số đường đi, còn lát cắt nhỏ nhất chỉ ra chỗ nghẽn.',
    'Thử xem: trên “Bộ định tuyến có giới hạn”, chạy hình vẽ như ban đầu (14), rồi tách A và B. Đáp số giảm còn 12 và lát cắt đi qua A → A′, tức giới hạn của bộ định tuyến A.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Dựng mô hình',
      'O(V + E)',
      'Một đỉnh cho mỗi địa điểm, cộng S, T và các bản sao khi tách; một cạnh cho mỗi tuyến đường và mỗi giới hạn.',
    ],
    ['Tách mọi đỉnh', '2V đỉnh, E + V cạnh', 'Mỗi lần tách thêm một đỉnh v′ và một cạnh v → v′.'],
    [
      'Luồng cực đại',
      'O(V·E²)',
      'Edmonds-Karp trên mô hình; dùng Dinic trong O(V²·E) cho mô hình lớn hơn.',
    ],
    [
      'Sức chứa bằng 1',
      'O(f·E), f ≤ V',
      'Mỗi đường tăng luồng thêm 1, và có tối đa deg(s) đường đi ra từ đỉnh phát.',
    ],
    ['Bộ nhớ', 'O(V + E)', 'Mô hình, các luồng trên đó và các cung thặng dư.'],
  ],
  practiceTitle: 'Mô hình hoá và giải',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Nông trại và chợ: dựng mô hình và chạy. Mỗi ngày có thể đưa bao nhiêu tấn rau đến các chợ?',
      answer: 15,
      unit: 'tấn',
      tolerance: 0,
      hints: [
        'Thêm S → F 9, S → G 7, P → T 8 và Q → T 9, rồi chuyển sang Chạy.',
        'Vào P được tối đa F → P 3 + D → P 4 = 7, vào Q được tối đa G → Q 2 + D → Q 6 = 8.',
      ],
      solution:
        'Luồng cực đại của mô hình là 15. Không thể nhiều hơn: P nhận được tối đa 3 + 4 = 7 và Q tối đa 2 + 6 = 8, nên các đường vào chợ giới hạn tổng ở 15 dù các nông trại thu hoạch 16 và các chợ bán được 17. Lần chạy đánh dấu một lát cắt nhỏ nhất khác có cùng giá trị: S → G 7, F → D 5 và F → P 3.',
    },
    {
      type: 'number',
      prompt:
        'Bộ định tuyến có giới hạn: chạy hình vẽ như ban đầu, chưa sửa gì. Luồng cực đại báo được là bao nhiêu?',
      answer: 14,
      unit: 'Mbit/s',
      tolerance: 0,
      hints: ['Bấm “Đặt lại hình vẽ”, chuyển sang Chạy và chạy đến bước cuối.'],
      solution:
        'Không có giới hạn trên bộ định tuyến thì đáp số là 14: S → A mang 8 (5 đi thẳng đến T, 3 đi tiếp sang B) và S → B mang 6, nên B → T mang 9. Kết quả này sai với câu chuyện, vì bộ định tuyến A phải chuyển tiếp 8 và B phải chuyển tiếp 9.',
    },
    {
      type: 'number',
      prompt:
        'Giờ hãy tách A và B như mẹo đã nói (A → A′ 6, B → B′ 7) rồi chạy lại. Tổng tốc độ cao nhất là bao nhiêu?',
      answer: 12,
      unit: 'Mbit/s',
      tolerance: 0,
      hints: [
        'Các đường đi ra từ A phải xuất phát từ A′: A′ → B 4 và A′ → T 5. Đường đi ra từ B xuất phát từ B′: B′ → T 9.',
        'A chuyển tiếp được tối đa 6: 5 đến T và 1 sang B.',
      ],
      solution:
        'A chuyển tiếp 6 (5 đến T, 1 sang B) và B chuyển tiếp 6 + 1 = 7, đúng giới hạn của nó. 5 + 7 = 12, và lát cắt S → B 6 + A → A′ 6 = 12 chứng tỏ không thể nhiều hơn.',
    },
    {
      type: 'multi',
      prompt:
        'Trong mô hình bộ định tuyến đúng, ở cuối lần chạy, những cạnh nào được đánh dấu ✂ là lát cắt nhỏ nhất?',
      options: ['S → A', 'S → B', 'A → A′', 'B → B′', 'A′ → T'],
      answers: [1, 2],
      hints: ['Chạy đến cuối trên mô hình đúng; nút “Xem một mô hình đúng” sẽ nạp nó.'],
      solution:
        'S vẫn đến được A (S → A còn trống 2), nhưng A → A′ đã đầy, nên S = {S, A}. Các cạnh đi ra khỏi tập này là S → B (6) và A → A′ (6): 6 + 6 = 12, đúng bằng luồng cực đại. Giới hạn của bộ định tuyến A và đường truyền vào B là chỗ nghẽn.',
    },
    {
      type: 'number',
      prompt: 'Học sinh và câu lạc bộ: có thể có tối đa bao nhiêu lượt đăng kí?',
      answer: 4,
      unit: 'lượt',
      tolerance: 0,
      hints: [
        'S → X 2, S → Y 1, S → Z 2; mỗi câu lạc bộ được thích có một cạnh sức chứa 1; C → T 2 và R → T 3.',
        'Câu lạc bộ rô-bốt có 3 chỗ nhưng chỉ X và Z thích nó.',
      ],
      solution:
        'Cờ vua nhận 2 trong số X, Y và Z, rô-bốt nhận X và Z, nên 2 + 2 = 4. Lát cắt mà lần chạy tìm được là X → R, Z → R và C → T: 1 + 1 + 2 = 4.',
    },
    {
      type: 'number',
      prompt: 'Xe tải trên đường chung: có thể cho tối đa bao nhiêu xe đi được?',
      answer: 2,
      unit: 'xe',
      tolerance: 0,
      hints: [
        'Đặt mọi sức chứa bằng 1; chiều dài không quan trọng.',
        'Mọi tuyến đi từ nửa bên trái sang nửa bên phải đều dùng A → D hoặc C → F.',
      ],
      solution:
        'Với sức chứa 1 trên mọi con đường, luồng cực đại là 2, chẳng hạn S → A → D → T và S → C → F → T. Lát cắt {A → D, C → F} cho thấy xe thứ ba sẽ phải đi lại một trong hai con đường đó. Chạy hình vẽ với chiều dài làm sức chứa sẽ ra 12, con số không có ý nghĩa gì ở đây.',
    },
    {
      type: 'choice',
      prompt: 'Đỉnh v chỉ cho đi qua tối đa c đơn vị. Làm sao đưa giới hạn đó vào một mạng luồng?',
      options: [
        'Cho mọi cạnh đi vào v sức chứa c.',
        'Cho mọi cạnh đi ra từ v sức chứa c.',
        'Tách v thành v và v′ nối bằng v → v′ có sức chứa c; các cạnh vào v giữ nguyên, các cạnh ra từ v xuất phát từ v′.',
        'Thêm một cạnh v → t có sức chứa c.',
      ],
      answer: 2,
      hints: ['Giới hạn đặt trên tổng lượng đi qua v, không phải trên một cạnh nào.'],
      solution:
        'Mọi luồng qua v đều phải đi qua cạnh duy nhất v → v′, nên sức chứa c của nó giới hạn tổng lượng. Giới hạn riêng từng cạnh vẫn để nhiều cạnh cộng lại mang nhiều hơn c.',
    },
    {
      type: 'number',
      prompt:
        'Một mạng có 9 đỉnh và 14 cạnh. Em tách 4 đỉnh để gán sức chứa cho chúng. Mạng mới có bao nhiêu cạnh?',
      answer: 18,
      unit: 'cạnh',
      tolerance: 0,
      hints: [
        'Tách đỉnh chuyển cạnh từ v sang v′ nhưng không bỏ cạnh nào; mỗi lần tách thêm một cạnh.',
      ],
      solution:
        'Mỗi lần tách thêm cạnh v → v′ và đỉnh v′, nên có 14 + 4 = 18 cạnh (và 9 + 4 = 13 đỉnh).',
    },
  ],
  nextTeaser:
    'Bài sau, QHĐ bitmask và bài toán người du lịch dùng bitmask (mặt nạ bit) để ghi nhớ những thành phố đã đi qua.',
};
