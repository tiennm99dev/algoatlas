/** @typedef {import('$lib/algo-engine/practice-mst.js').BottleneckFrame} BottleneckFrame */
/** @typedef {import('$lib/algo-engine/practice-mst.js').SecondBestFrame} SecondBestFrame */
/** @typedef {import('$lib/algo-engine/practice-mst.js').TreeVerdict} TreeVerdict */
/** @typedef {{u: number, v: number, w: number}} EdgeInfo */

/** @param {EdgeInfo | undefined} e @param {string[]} names */
const edgeName = (e, names) => (e ? `${names[e.u] ?? '?'} — ${names[e.v] ?? '?'}` : '');
/** @param {EdgeInfo | undefined} e @param {string[]} names */
const withWeight = (e, names) => (e ? `${edgeName(e, names)} (${e.w})` : '');

export const vi = {
  slug: 'practice-mst',
  topic: 'mst',
  level: 'Nâng cao',
  title: 'Luyện tập: bài toán cây khung nhỏ nhất',
  intro:
    'Cây khung nhỏ nhất (MST) không chỉ trả lời câu hỏi “mạng rẻ nhất”. Đường đi giữa hai đỉnh trên cây là một đường đi nút cổ chai nhỏ nhất (minimum bottleneck path): đường có cạnh nặng nhất nhẹ nhất có thể. Và chỉ một lần đổi một cạnh của cây lấy một cạnh ngoài cây là ra cây khung tốt nhì (second-best spanning tree). Hãy đoán cây trên đồ thị em tự sửa, rồi kiểm tra.',
  summary:
    'Đoán một cây khung nhỏ nhất rồi kiểm tra, sau đó tìm đường đi nút cổ chai nhỏ nhất và cây khung tốt nhì trên đồ thị do em sửa.',
  instruction:
    'Ở chế độ Đoán, đánh dấu các cạnh em nghĩ tạo thành cây khung nhỏ nhất rồi bấm “Kiểm tra cây của em”. Nếu cây chưa đúng, trang sẽ gợi ý một phép đổi làm cây nhẹ hơn. Chế độ Nút cổ chai và Tốt nhì đi từng bước qua thuật toán; đổi trọng số hoặc hai đầu mút rồi chạy lại từng bước.',
  modeLabel: 'Bài toán',
  modes: { predict: 'Đoán MST', bottleneck: 'Đường nút cổ chai', second: 'Cây tốt nhì' },
  sourceLabel: 'Từ',
  targetLabel: 'Đến',
  check: 'Kiểm tra cây của em',
  clear: 'Xoá cây của em',
  resetGraph: 'Khôi phục đồ thị',
  graphAria: 'Đồ thị vô hướng có trọng số cho các bài toán cây khung nhỏ nhất.',
  edgesTitle: 'Các cạnh: trọng số, và cạnh có trong cây của em không',
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  /** @param {string} name */
  pickAria: (name) => `Cạnh ${name} trong cây của em`,
  noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
  /** @param {number} max */
  badWeight: (max) => `Trọng số phải là số nguyên từ 1 đến ${max}. Trọng số cũ được giữ nguyên.`,
  predictHelp:
    'Đánh dấu các cạnh bên dưới để dựng cây của em. Cạnh được đánh dấu có màu vàng. Phép kiểm tra cho biết đó có phải cây khung không, và có phải cây khung nhỏ nhất không.',
  /** @param {number} count @param {number} need @param {number} weight */
  pickedSummary: (count, need, weight) => `Đã chọn ${count}/${need} cạnh, tổng trọng số ${weight}.`,
  /**
   * @param {TreeVerdict} v
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  verdict(v, names, info) {
    switch (v.kind) {
      case 'disconnected':
        return 'Đồ thị này không liên thông, nên không có cây khung. Hãy nối mọi đỉnh trước đã.';
      case 'cycle':
        return `Chưa phải cây: ${withWeight(info[v.closing], names)} khép một chu trình với các cạnh khác của em. Cây thì không có chu trình.`;
      case 'size':
        return `Cây khung trên ${v.need + 1} đỉnh có đúng ${v.need} cạnh. Em đã chọn ${v.count} cạnh, không tạo chu trình, nên ${v.count < v.need ? 'vẫn còn đỉnh chưa được nối' : 'không thể có thêm một cạnh'}.`;
      case 'heavier': {
        const add = info[v.add];
        const drop = info[v.drop];
        return `Đây là một cây khung có trọng số ${v.weight}, nhưng nhỏ nhất là ${v.best}. Gợi ý: ${withWeight(add, names)} khép một chu trình với cây của em, trên đó ${withWeight(drop, names)} nặng hơn. Đổi hai cạnh này để bớt ${drop.w - add.w}.`;
      }
      case 'minimum':
        return `Đúng rồi: đây là một cây khung nhỏ nhất, trọng số ${v.weight}. Không cạnh nào ngoài cây nhẹ hơn cạnh nặng nhất của cây trên chu trình mà nó sẽ khép.`;
    }
  },
  legend: {
    picked: 'Cạnh trong cây của em',
    swapIn: 'Cạnh gợi ý thêm vào',
    flagged: 'Cạnh gợi ý bỏ đi, hoặc cạnh khép chu trình',
    skipNow: 'Cạnh đang bị bỏ qua',
    source: 'Từ (s) và đến (t)',
    tree: 'Trong rừng hoặc trong MST',
    rejected: 'Bị bỏ qua: sẽ khép chu trình',
    now: 'Cạnh đang xét',
    path: 'Đường đi, hoặc chu trình của phép đổi đang thử',
    drop: 'Cạnh nặng nhất trên đường đó (bị bỏ)',
    add: 'Cạnh được thêm bởi phép đổi',
    pathVertex: 'Đỉnh trên đường đi',
  },
  sortedTitle: 'Các cạnh theo thứ tự đã sắp xếp',
  emptyText: 'không có',
  hotLabel: 'đang xét',
  /** @param {EdgeInfo} e @param {string[]} names @param {string} mark */
  sortedChip: (e, names, mark) => `${edgeName(e, names)} ${e.w}${mark ? ` ${mark}` : ''}`,
  marks: { tree: '✓', cycle: '✗' },
  candidatesTitle: 'Các phép đổi đã thử (thêm, bỏ → trọng số)',
  /** @param {EdgeInfo} add @param {EdgeInfo} drop @param {number} w @param {string[]} names */
  swapChip: (add, drop, w, names) => `+${edgeName(add, names)} −${edgeName(drop, names)} → ${w}`,
  stats: {
    picked: 'Số cạnh đã chọn',
    yourWeight: 'Trọng số cây của em',
    considered: 'Số cạnh đã xét',
    bottleneck: 'Nút cổ chai',
    pathEdges: 'Số cạnh trên đường đi',
    mst: 'Trọng số MST',
    checked: 'Số cạnh ngoài T đã thử',
    best: 'Trọng số cây tốt nhì',
  },
  none: '—',
  /** @param {number} x */
  show: (x) => (x === Infinity ? '—' : String(x)),
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Đỉnh ${name}`, state].filter(Boolean).join(', '),
  states: { source: 'điểm đầu', target: 'điểm cuối', onPath: 'trên đường đi' },
  /**
   * @param {BottleneckFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  describeBottleneck(f, names, info) {
    const s = names[f.source] ?? '';
    const t = names[f.target] ?? '';
    const e = info[f.edge];
    const route = f.path.map((v) => names[v]).join(' → ');
    switch (f.kind) {
      case 'start':
        return `Tìm một đường đi từ ${s} đến ${t} có cạnh nặng nhất nhẹ nhất có thể. Ta lấy các cạnh từ nhẹ đến nặng, như thuật toán Kruskal, cho tới khi ${s} và ${t} nằm trong cùng một cây.`;
      case 'reject':
        return `Cạnh ${withWeight(e, names)}: hai đầu đã nằm trong cùng một cây. Bỏ qua.`;
      case 'accept':
        return `Cạnh ${withWeight(e, names)} nối hai cây. ${s} và ${t} vẫn còn tách rời.`;
      case 'joined':
        return `Cạnh ${withWeight(e, names)} nối cây của ${s} với cây của ${t}. Mọi cạnh nhẹ hơn đều đã được thử, nên không đường nào tốt hơn: nút cổ chai là ${e?.w}.`;
      case 'done':
        if (f.source === f.target && f.source >= 0)
          return `${s} vừa là điểm đầu vừa là điểm cuối: đường đi rỗng và nút cổ chai bằng 0.`;
        if (!f.path.length) return `Không tới được ${t} từ ${s}: hoàn toàn không có đường đi.`;
        return `Đường đi nút cổ chai nhỏ nhất: ${route}. Cạnh nặng nhất của nó nặng ${f.bottleneck}. Đây cũng là đường đi giữa ${s} và ${t} trên cây khung nhỏ nhất.`;
    }
  },
  /**
   * @param {SecondBestFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  describeSecond(f, names, info) {
    const e = info[f.edge];
    const drop = info[f.drop];
    switch (f.kind) {
      case 'start':
        return f.mst === Infinity
          ? 'Đồ thị không liên thông, nên hoàn toàn không có cây khung.'
          : `Cây khung nhỏ nhất T nặng ${f.mst}. Cây tốt nhì khác T đúng một phép đổi: thêm một cạnh ngoài T và bỏ cạnh nặng nhất trên chu trình mà nó khép.`;
      case 'better':
        return `Thêm ${withWeight(e, names)}: đường đi trên T giữa hai đầu của nó có cạnh nặng nhất là ${withWeight(drop, names)}. ${f.mst} − ${drop.w} + ${e.w} = ${f.candidate}, phép đổi tốt nhất đến giờ.`;
      case 'worse':
        return `Thêm ${withWeight(e, names)}: bỏ ${withWeight(drop, names)}, cạnh nặng nhất trên đường đi của nó trong T. ${f.mst} − ${drop.w} + ${e.w} = ${f.candidate}, không nhẹ hơn ${f.best}.`;
      case 'done':
        if (f.mst === Infinity) return 'Không có cây khung, nên cũng không có cây tốt nhì.';
        if (f.bestAdd < 0)
          return 'Mọi cạnh đều thuộc T: bản thân đồ thị là một cây, nên nó chỉ có một cây khung.';
        return `Cây khung tốt nhì: thêm ${withWeight(info[f.bestAdd], names)}, bỏ ${withWeight(info[f.bestDrop], names)}, trọng số ${f.best}.${f.best === f.mst ? ' Nó nặng bằng T: đồ thị này có nhiều hơn một cây khung nhỏ nhất.' : ''}`;
    }
  },
  takeaways: [
    'Một cây là nhỏ nhất khi và chỉ khi không cạnh nào ngoài cây nhẹ hơn cạnh nặng nhất của cây trên chu trình mà nó khép. Nếu có, đổi hai cạnh đó sẽ được một cây nhẹ hơn.',
    'Đường đi nút cổ chai nhỏ nhất: chạy thuật toán Kruskal cho tới khi s và t gặp nhau. Cạnh nối chúng là nút cổ chai, và đường đi giữa s và t trên bất kì cây khung nhỏ nhất nào cũng đạt được nó.',
    'Cây khung tốt nhì: nó khác MST đúng một phép đổi. Với mỗi cạnh ngoài cây, bỏ cạnh nặng nhất trên đường đi của nó trong cây: O(V) cho mỗi cạnh, tổng cộng O(V·E), hoặc O(E log V) nếu dùng nhảy nhị phân (binary lifting).',
    'Nếu trọng số cây tốt nhì bằng trọng số MST, thì MST không duy nhất. Khi mọi trọng số đều khác nhau, MST là duy nhất.',
    'Thử xem: ở chế độ Đoán, chọn C — E thay cho D — E rồi kiểm tra. Sau đó thử Đường nút cổ chai từ A đến C: đường đi qua B tốt hơn cạnh trực tiếp.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Kiểm tra một cây đã đoán',
      'O(V·E)',
      'DSU tìm chu trình; sau đó mỗi cạnh ngoài cây đi theo đường của nó trong cây, O(V), để tìm phép đổi nhẹ hơn.',
    ],
    [
      'Đường đi nút cổ chai nhỏ nhất',
      'O(E log E)',
      'Thuật toán Kruskal sắp xếp các cạnh và dừng ngay khi s và t chung một cây; đường đi cuối cùng chỉ cần một lần tìm kiếm, O(V).',
    ],
    [
      'Cây khung tốt nhì',
      'O(V·E)',
      'Một MST, rồi đi một đường cho mỗi cạnh ngoài cây. Dùng nhảy nhị phân trên cây thì còn O(E log V).',
    ],
    ['Bộ nhớ', 'O(V + E)', 'Danh sách cạnh, các mảng của DSU và danh sách kề của cây.'],
  ],
  practiceTitle: 'Bài tập',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Trên đồ thị ban đầu, nút cổ chai nhỏ nhất giữa A và F là bao nhiêu, tức trọng số nhỏ nhất có thể của cạnh nặng nhất trên một đường đi?',
      answer: 7,
      tolerance: 0,
      hints: [
        'Chọn “Đường nút cổ chai”, Từ A, Đến F, rồi đi từng bước cho tới khi hai cây nối với nhau.',
        'Mọi đường đi tới F đều phải dùng E — F hoặc D — F; để tới E hoặc F từ bên trái, em cần D — E, C — E hoặc D — F.',
      ],
      solution:
        'Thuật toán Kruskal nhận E — F 1, B — C 2, A — B 3, B — D 5 rồi D — E 7, cạnh nối cây của A với cây của F. Đường A → B → D → E → F có cạnh nặng nhất là 7, và mọi cạnh nhẹ hơn đều đã được nhận, nên không đường nào tốt hơn.',
    },
    {
      type: 'number',
      prompt:
        'Nút cổ chai nhỏ nhất giữa A và C là bao nhiêu? (Cẩn thận: có cạnh trực tiếp A — C trọng số 4.)',
      answer: 3,
      tolerance: 0,
      hints: ['Một đường đi được phép dùng nhiều cạnh hơn nếu cạnh nào cũng nhẹ hơn.'],
      solution:
        'A → B → C dùng A — B 3 và B — C 2, nên cạnh nặng nhất là 3, nhẹ hơn cạnh trực tiếp A — C 4. Đó chính là đường A–C trên cây khung nhỏ nhất.',
    },
    {
      type: 'number',
      prompt: 'Cây khung tốt nhì của đồ thị ban đầu có trọng số bao nhiêu?',
      answer: 19,
      tolerance: 0,
      hints: ['Chọn “Cây tốt nhì” rồi đi từng bước: mỗi cạnh ngoài cây đề xuất một phép đổi.'],
      solution:
        'MST nặng 18. Các phép đổi cho: thêm A — C bỏ A — B → 19; thêm C — D bỏ B — D → 19; thêm C — E bỏ D — E → 19; thêm D — F bỏ D — E → 20. Nhẹ nhất là 19.',
    },
    {
      type: 'multi',
      prompt: 'Những phép đổi đơn nào biến MST của đồ thị ban đầu thành một cây có trọng số 19?',
      options: [
        'Thêm A — C, bỏ A — B',
        'Thêm C — D, bỏ B — D',
        'Thêm C — E, bỏ D — E',
        'Thêm D — F, bỏ D — E',
      ],
      answers: [0, 1, 2],
      hints: ['Trọng số mới = 18 − (trọng số bị bỏ) + (trọng số được thêm).'],
      solution:
        '18 − 3 + 4 = 19, 18 − 5 + 6 = 19 và 18 − 7 + 8 = 19. Thêm D — F (9) và bỏ D — E (7) cho 20.',
    },
    {
      type: 'number',
      prompt:
        'Tăng B — D từ 5 lên 9 rồi đoán cây khung nhỏ nhất mới. Cây đó nặng bao nhiêu? Kiểm tra bằng nút “Kiểm tra cây của em”.',
      answer: 19,
      tolerance: 0,
      hints: ['Chỉ cách nối tới D thay đổi. Giờ cạnh nào là cách rẻ nhất để tới D từ {A, B, C}?'],
      solution:
        'E — F 1, B — C 2 và A — B 3 vẫn giữ. Giờ D được nối bằng C — D 6, còn D — E 7 vẫn nối E và F: 1 + 2 + 3 + 6 + 7 = 19.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao đường đi giữa s và t trên cây khung nhỏ nhất là một đường đi nút cổ chai nhỏ nhất?',
      options: [
        'Vì đường đi trên MST luôn là đường đi ngắn nhất.',
        'Nếu có một đường s–t mà mọi cạnh đều nhẹ hơn cạnh nặng nhất f của đường trên MST, thì bỏ f sẽ tách cây làm hai, và đổi f lấy một cạnh nhẹ hơn của đường đó đi qua chỗ tách sẽ cho một cây khung nhẹ hơn.',
        'Vì MST dùng cạnh nhẹ nhất của đồ thị.',
        'Không phải vậy: cần thuật toán Dijkstra cho đường đi nút cổ chai.',
      ],
      answer: 1,
      hints: ['Bỏ cạnh nặng nhất của cây trên đường đi. Việc đó làm gì với cây?'],
      solution:
        'Bỏ f sẽ tách cây thành hai phần, s ở một phía và t ở phía kia. Mọi đường s–t đều phải đi qua lát cắt đó. Nếu mọi cạnh của đường đều nhẹ hơn f, một trong số chúng đi qua lát cắt, và đổi f lấy cạnh đó cho một cây khung nhẹ hơn cây nhỏ nhất, điều không thể xảy ra. Đường đi trên MST không phải lúc nào cũng ngắn nhất: A → B → C có tổng 5, còn A — C chỉ 4.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, thành phần liên thông mạnh, chuyển sang đồ thị có hướng: nhóm các đỉnh mà từ mỗi đỉnh đều đi tới được mọi đỉnh khác trong nhóm.',
};
