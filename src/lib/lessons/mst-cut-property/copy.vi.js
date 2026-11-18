/** @typedef {import('$lib/algo-engine/mst-cut-property.js').CutFrame} CutFrame */
/** @typedef {import('$lib/algo-engine/mst-cut-property.js').CycleFrame} CycleFrame */
/** @typedef {{u: number, v: number, w: number}} EdgeInfo */

/** @param {EdgeInfo | undefined} e @param {string[]} names */
const edgeName = (e, names) => (e ? `${names[e.u] ?? '?'} — ${names[e.v] ?? '?'}` : '');
/** @param {EdgeInfo | undefined} e @param {string[]} names */
const edgeWithWeight = (e, names) => (e ? `${edgeName(e, names)} (trọng số ${e.w})` : '');
/** @param {string[]} list */
const set = (list) => `{${list.join(', ')}}`;

export const vi = {
  slug: 'mst-cut-property',
  topic: 'mst',
  level: 'Trung bình',
  title: 'Tính chất lát cắt và cây khung nhỏ nhất cơ bản',
  intro:
    'Cây khung của một đồ thị liên thông giữ lại mọi đỉnh và vừa đủ cạnh, đúng V − 1 cạnh, để nối tất cả các đỉnh mà không tạo chu trình. Cây khung nhỏ nhất (MST) là cây khung có tổng trọng số các cạnh nhỏ nhất. Hai quy tắc đơn giản quyết định cạnh nào thuộc cây đó: tính chất lát cắt (cut property) và tính chất chu trình (cycle property).',
  summary:
    'Chia đồ thị bằng một lát cắt do bạn chọn, tìm cạnh nhẹ nhất đi qua lát cắt, rồi kiểm tra một cạnh bất kì bằng tính chất chu trình.',
  instruction:
    'Ở chế độ Lát cắt, bấm vào một đỉnh (hoặc đưa tiêu điểm tới đỉnh rồi nhấn Enter) để chuyển nó sang phía bên kia lát cắt, rồi đi từng bước để tìm cạnh nhẹ nhất đi qua lát cắt. Ở chế độ Chu trình, chọn một cạnh cần kiểm tra và xem phép tìm kiếm trên các cạnh nhẹ hơn quyết định xem có cây khung nhỏ nhất nào dùng được cạnh đó không.',
  modeLabel: 'Tính chất',
  modes: { cut: 'Lát cắt', cycle: 'Chu trình' },
  testLabel: 'Cạnh cần kiểm tra',
  showMst: 'Hiện một cây khung nhỏ nhất',
  resetGraph: 'Khôi phục đồ thị',
  cutHelp: 'Bấm vào một đỉnh để chuyển nó sang phía bên kia lát cắt.',
  graphAria:
    'Đồ thị vô hướng có trọng số. Ở chế độ Lát cắt, mỗi đỉnh nằm ở phía S hoặc phía còn lại; chọn một đỉnh sẽ chuyển nó sang phía bên kia.',
  edgesTitle: 'Trọng số các cạnh',
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
  /** @param {number} max */
  badWeight: (max) => `Trọng số phải là số nguyên từ 1 đến ${max}. Trọng số cũ được giữ nguyên.`,
  crossingTitle: 'Các cạnh đi qua lát cắt đã tìm thấy',
  queueTitle: 'Hàng đợi tìm kiếm',
  emptyText: 'không có',
  hotLabel: 'nhẹ nhất đến giờ',
  /** @param {EdgeInfo} e @param {string[]} names */
  edgeChip: (e, names) => `${edgeName(e, names)} ${e.w}`,
  /** @param {EdgeInfo | undefined} e @param {string[]} names */
  edgeOption: (e, names) => edgeWithWeight(e, names),
  stats: {
    checked: 'Số cạnh đã xét',
    crossing: 'Số cạnh đi qua lát cắt',
    lightest: 'Trọng số nhỏ nhất đi qua lát cắt',
    reached: 'Số đỉnh đã tới',
    tested: 'Trọng số cạnh đang kiểm tra',
    mst: 'Trọng số MST',
    treeEdges: 'Số cạnh của một cây khung',
  },
  none: '—',
  /** @param {number} weight @param {number} components */
  mstValue: (weight, components) =>
    components > 1 ? `${weight} (rừng gồm ${components} cây)` : String(weight),
  legend: {
    sideS: 'Phía S của lát cắt',
    other: 'Phía còn lại',
    current: 'Đỉnh đang mở rộng',
    queued: 'Đã tới, đang trong hàng đợi',
    reached: 'Đã tới, đã xét xong',
    path: 'Đường nhẹ hơn từ a đến b',
    edgeNow: 'Cạnh đang xét',
    best: 'Cạnh nhẹ nhất đi qua lát cắt',
    crossing: 'Cạnh khác đi qua lát cắt',
    tested: 'Cạnh đang kiểm tra',
    used: 'Cạnh nhẹ hơn mà phép tìm kiếm đã dùng',
    mst: 'Cạnh của cây khung nhỏ nhất',
    ends: 'a và b: hai đầu của cạnh đang kiểm tra',
  },
  states: {
    sideS: 'phía S',
    other: 'phía còn lại',
    current: 'đang mở rộng',
    queued: 'trong hàng đợi',
    reached: 'đã tới',
    path: 'trên đường nhẹ hơn',
    a: 'điểm bắt đầu tìm a',
    b: 'đích b',
  },
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => [`Đỉnh ${name}`, state].filter(Boolean).join(', '),
  /**
   * @param {CutFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   * @param {boolean[]} side
   */
  describeCut(f, names, info, side) {
    const inS = names.filter((_, i) => side[i]);
    const e = info[f.edge];
    const best = info[f.best];
    switch (f.kind) {
      case 'start':
        if (!inS.length || inS.length === names.length)
          return 'Mọi đỉnh đều ở cùng một phía, nên không cạnh nào đi qua lát cắt này. Bấm vào một đỉnh để chuyển nó sang phía bên kia.';
        return `S = ${set(inS)}. Ta duyệt mọi cạnh và giữ lại cạnh nhẹ nhất có một đầu trong S, đầu kia ở ngoài S.`;
      case 'inside':
        return `Cạnh ${edgeWithWeight(e, names)}: cả hai đầu đều ${side[e.u] ? 'trong S' : 'ngoài S'}, nên cạnh không đi qua lát cắt. Bỏ qua.`;
      case 'best':
        return f.crossing.length === 1
          ? `Cạnh ${edgeWithWeight(e, names)} đi qua lát cắt. Đây là cạnh đầu tiên đi qua lát cắt, nên nó nhẹ nhất đến giờ.`
          : `Cạnh ${edgeWithWeight(e, names)} đi qua lát cắt và nhẹ hơn cạnh tốt nhất đến giờ. Nó trở thành cạnh tốt nhất mới.`;
      case 'heavier':
        return `Cạnh ${edgeWithWeight(e, names)} đi qua lát cắt, nhưng không nhẹ hơn ${edgeWithWeight(best, names)}. Giữ nguyên cạnh tốt nhất.`;
      case 'done': {
        if (!best) {
          if (!inS.length || inS.length === names.length)
            return 'Không cạnh nào đi qua một lát cắt có một phía rỗng. Hãy chuyển một đỉnh sang phía bên kia để có lát cắt thật.';
          return 'Không cạnh nào đi qua lát cắt này, nên hai phía không được nối với nhau: đồ thị không có cây khung.';
        }
        const others = f.ties.filter((k) => k !== f.best).map((k) => edgeName(info[k], names));
        return `Cạnh nhẹ nhất đi qua lát cắt là ${edgeWithWeight(best, names)}. Mọi cây khung đều cần một cạnh đi qua lát cắt để nối hai phía, và đổi cạnh đó lấy ${edgeName(best, names)} không bao giờ làm cây nặng hơn, nên có một cây khung nhỏ nhất chứa ${edgeName(best, names)}.${others.length ? ` ${others.join(', ')} có trọng số bằng nó: mỗi cạnh nhẹ nhất đi qua lát cắt đều thuộc một cây khung nhỏ nhất nào đó.` : ''}`;
      }
    }
  },
  /**
   * @param {CycleFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  describeCycle(f, names, info) {
    const t = info[f.target];
    const tn = edgeName(t, names);
    const a = names[f.a] ?? '';
    const b = names[f.b] ?? '';
    const x = names[f.current] ?? '';
    const y = names[f.neighbor] ?? '';
    const e = info[f.edge];
    const route = f.path.map((v) => names[v]).join(' → ');
    switch (f.kind) {
      case 'start':
        return t
          ? `Kiểm tra cạnh ${tn} (trọng số ${f.w}). Ta tìm từ ${a} và chỉ dùng các cạnh nhẹ hơn ${f.w}. Nếu tới được ${b}, đường đó cộng với ${tn} là một chu trình mà ${tn} là cạnh nặng nhất.`
          : 'Không có cạnh nào để kiểm tra. Hãy vẽ một cạnh bằng công cụ Nối.';
      case 'pop':
        return `Lấy ${x} ra khỏi đầu hàng đợi và xét các cạnh của nó.`;
      case 'heavy':
        return f.edge === f.target
          ? `Cạnh ${tn} là cạnh đang kiểm tra, nên phép tìm kiếm không được dùng nó.`
          : `Cạnh ${edgeWithWeight(e, names)} không nhẹ hơn ${f.w}, nên phép tìm kiếm không được dùng nó.`;
      case 'seen':
        return `Cạnh ${edgeWithWeight(e, names)} nhẹ hơn, nhưng ${y} đã được tới rồi.`;
      case 'follow':
        return `Cạnh ${edgeWithWeight(e, names)} nhẹ hơn ${f.w}: tới ${y} và đưa nó vào hàng đợi.`;
      case 'found':
        return `Cạnh ${edgeWithWeight(e, names)} tới được ${b}. Đường ${route} chỉ dùng các cạnh nhẹ hơn ${f.w}.`;
      case 'done':
        if (!t) return 'Không có gì để kiểm tra.';
        if (f.verdict === 'cycle')
          return `Tính chất chu trình: ${tn} (trọng số ${f.w}) nặng nhất, và nặng hơn hẳn mọi cạnh khác, trên chu trình ${route} → ${a}. Trong bất kì cây nào dùng nó, đổi nó lấy một cạnh nhẹ hơn của chu trình đó sẽ được cây nhẹ hơn, nên không cây khung nhỏ nhất nào chứa ${tn}.`;
        return `Phép tìm kiếm dừng mà không tới được ${b}. Các đỉnh đã tới ${set(names.filter((_, i) => f.reached[i]))} tạo thành một lát cắt mà ${tn} đi qua, và không cạnh nào đi qua lát cắt đó nhẹ hơn ${f.w}. Theo tính chất lát cắt, có một cây khung nhỏ nhất chứa ${tn}.`;
    }
  },
  takeaways: [
    'Cây khung của một đồ thị liên thông có V đỉnh luôn có đúng V − 1 cạnh và không có chu trình. Thêm bất kì cạnh nào khác sẽ khép đúng một chu trình; bỏ một cạnh của cây sẽ tách cây thành hai phần.',
    'Tính chất lát cắt: với mọi cách chia các đỉnh thành hai phía, một cạnh nhẹ nhất đi qua lát cắt thuộc một cây khung nhỏ nhất nào đó, và thuộc mọi cây khung nhỏ nhất khi nó nhẹ hơn hẳn các cạnh khác đi qua lát cắt.',
    'Tính chất chu trình: một cạnh nặng hơn hẳn mọi cạnh khác trên một chu trình nào đó không thuộc cây khung nhỏ nhất nào.',
    'Cả hai chứng minh đều là cùng một lập luận hoán đổi (exchange argument): đổi một cạnh lấy một cạnh khác qua cùng lát cắt hoặc trên cùng chu trình, tổng trọng số không thể giảm. Thuật toán Kruskal và thuật toán Prim chỉ là hai cách chọn lát cắt.',
    'Thử xem: ở chế độ Chu trình, kiểm tra D — E, rồi hạ C — E từ 8 xuống 6 và kiểm tra lại D — E. Lần này phép tìm kiếm tới được E, nên D — E bị loại khỏi mọi cây khung nhỏ nhất.',
  ],
  complexityHead: ['Phép kiểm tra', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Cạnh nhẹ nhất đi qua một lát cắt',
      'O(E)',
      'Xét mỗi cạnh một lần và so các cạnh đi qua lát cắt với cạnh tốt nhất đến giờ.',
    ],
    [
      'Cạnh a — b có thuộc một MST nào không?',
      'O(V + E)',
      'Một lần duyệt theo chiều rộng (BFS) từ a trên các cạnh nhẹ hơn w(a — b), thăm mỗi đỉnh và mỗi cạnh nhiều nhất một lần.',
    ],
    [
      'Kích thước cây khung',
      'V − 1 cạnh',
      'Một cây có V đỉnh luôn có V − 1 cạnh, dù trọng số thế nào.',
    ],
    ['Bộ nhớ', 'O(V + E)', 'Các danh sách kề, cùng các mảng phía, đã tới và hàng đợi.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Trên đồ thị ban đầu với S = {A, B, C}, cạnh nhẹ nhất đi qua lát cắt có trọng số bao nhiêu?',
      answer: 5,
      tolerance: 0,
      hints: [
        'Các cạnh đi qua lát cắt là các cạnh có một đầu trong {A, B, C}, đầu kia trong {D, E, F}.',
      ],
      solution:
        'Các cạnh đi qua lát cắt là B — D (5), C — D (6) và C — E (8). Nhẹ nhất là B — D, trọng số 5.',
    },
    {
      type: 'number',
      prompt: 'Mọi cây khung của đồ thị ban đầu có bao nhiêu cạnh?',
      answer: 5,
      unit: 'cạnh',
      tolerance: 0,
      hints: ['Một cây khung có V đỉnh thì có V − 1 cạnh.'],
      solution: 'Đồ thị có 6 đỉnh, nên mọi cây khung có 6 − 1 = 5 cạnh.',
    },
    {
      type: 'number',
      prompt:
        'Tổng trọng số của cây khung nhỏ nhất của đồ thị ban đầu là bao nhiêu? Dùng nút “Hiện một cây khung nhỏ nhất” để kiểm tra.',
      answer: 18,
      tolerance: 0,
      hints: [
        'Lấy các cạnh từ nhẹ đến nặng, bỏ qua cạnh nào sẽ khép chu trình, cho tới khi có 5 cạnh.',
      ],
      solution:
        'Lấy E — F (1), B — C (2), A — B (3); A — C (4) sẽ khép chu trình; lấy B — D (5); C — D (6) sẽ khép chu trình; lấy D — E (7). 1 + 2 + 3 + 5 + 7 = 18.',
    },
    {
      type: 'choice',
      prompt: 'Ở chế độ Chu trình, phép kiểm tra cho biết gì về C — D (trọng số 6)?',
      options: [
        'Nó thuộc mọi MST, vì đó là cạnh duy nhất nối C với D.',
        'Nó không thuộc MST nào: C → B → D chỉ dùng các cạnh nhẹ hơn, nên C — D là cạnh nặng nhất trên chu trình đó.',
        'Nó thuộc một MST nào đó, vì nó đi qua lát cắt {A, B, C}.',
        'Còn tuỳ phép tìm kiếm bắt đầu từ đâu.',
      ],
      answer: 1,
      hints: ['Tìm một đường từ C đến D chỉ dùng các cạnh nhẹ hơn 6.'],
      solution:
        'C — B (2) và B — D (5) đều nhẹ hơn 6, nên trên chu trình C → B → D → C, cạnh C — D nặng hơn hẳn các cạnh còn lại. Theo tính chất chu trình, không MST nào chứa C — D. Nó có đi qua lát cắt {A, B, C}, nhưng không phải cạnh nhẹ nhất đi qua lát cắt đó.',
    },
    {
      type: 'multi',
      prompt: 'Những cạnh nào sau đây của đồ thị ban đầu thuộc cây khung nhỏ nhất?',
      options: ['A — C (4)', 'B — D (5)', 'C — E (8)', 'D — E (7)'],
      answers: [1, 3],
      hints: [
        'Một cạnh bị loại khi có một đường gồm các cạnh nhẹ hơn hẳn nối hai đầu của nó (tính chất chu trình).',
      ],
      solution:
        'A — C bị loại (A — B 3 và B — C 2 nối A với C), C — E cũng bị loại (C — B, B — D, D — E đều nhẹ hơn 8). B — D là cạnh nhẹ nhất đi qua lát cắt {A, B, C}, còn D — E là cạnh nhẹ nhất đi qua lát cắt {A, B, C, D}, nên cả hai đều thuộc cây.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, thuật toán Kruskal, dựng cây khung nhỏ nhất bằng cách lấy các cạnh từ nhẹ đến nặng và bỏ qua mọi cạnh sẽ khép chu trình.',
};
