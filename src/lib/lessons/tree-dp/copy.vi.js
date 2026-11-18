/** @typedef {import('$lib/algo-engine/tree-dp.js').TreeDpFrame} TreeDpFrame */
/** @typedef {import('$lib/algo-engine/tree-dp.js').TreeProblem} TreeProblem */

/** @param {number} v */
const node = (v) => String.fromCharCode(65 + v);

export const vi = {
  slug: 'tree-dp',
  topic: 'advanced-dp',
  level: 'Nâng cao',
  title: 'QHĐ trên cây',
  intro:
    'Một cây có gốc tách thành các cây con không dùng chung gì với nhau, nên đáp án của một nút có thể dựng từ đáp án của các con. Ta duyệt cây theo thứ tự duyệt sau (postorder), các con trước rồi mới tới cha, và giữ vài con số cho mỗi nút, chẳng hạn tổng tốt nhất khi chọn nút đó và khi bỏ nó. Kĩ thuật đổi gốc thêm một lượt thứ hai từ trên xuống, biến đáp án của một gốc thành đáp án cho mọi nút trong O(n).',
  summary:
    'Tính giá trị chọn và bỏ theo thứ tự duyệt sau để tìm tập độc lập có trọng số lớn nhất, và đổi gốc để có tổng khoảng cách của mọi nút trong O(n).',
  instruction:
    'Chọn một bài toán rồi chạy từng bước. Giá trị của mỗi nút hiện ngay bên dưới nút đó; ● là nút đang giải, ◇ là các nút đang chờ trên call stack (ngăn xếp lời gọi), ○ là nút con đang được gộp vào, và ✓ là cây con đã xong. Chọn một nút để đổi trọng số, thêm con hoặc xoá cây con của nó.',
  problemLabel: 'Bài toán',
  problems: { mis: 'Tập độc lập', reroot: 'Tổng khoảng cách (đổi gốc)' },
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    company: 'Tiệc công ty, 8 người',
    path: 'Đường thẳng 6 nút',
    star: 'Hình sao 6 nút',
  },
  randomTree: 'Cây ngẫu nhiên',
  addChild: 'Thêm con',
  removeSubtree: 'Xoá cây con',
  weightLabel: 'Trọng số',
  /** @param {number} max */
  fullError: (max) => `Cây đã có ${max} nút, nhiều nhất mà hình vẽ hiển thị được.`,
  rootError: 'Gốc phải ở lại: hãy xoá một cây con của nó.',
  selectFirst:
    'Hãy chọn một nút trước: bấm vào nó, hoặc dùng các phím mũi tên di chuyển tới rồi nhấn Enter.',
  /** @param {number} max */
  weightError: (max) => `Trọng số phải là số nguyên từ 0 đến ${max}.`,
  /** @param {TreeProblem} p @param {number} n */
  treeAria: (p, n) =>
    p === 'mis'
      ? `Cây gồm ${n} nút, mỗi nút có trọng số cùng giá trị chọn và bỏ.`
      : `Cây gồm ${n} nút, mỗi nút có kích thước cây con và các tổng khoảng cách.`,
  /** @param {string} name @param {number} w @param {TreeProblem} p @param {string} values @param {string} state */
  nodeLabel: (name, w, p, values, state) =>
    `Nút ${name}${p === 'mis' ? `, trọng số ${w}` : ''}${values ? `, ${values}` : ''}${state ? `, ${state}` : ''}`,
  /** @param {string} name @param {number} w */
  nodeText: (name, w) => `${name}:${w}`,
  /** @param {number|null} inc @param {number|null} exc */
  misNote: (inc, exc) => (inc === null ? '' : `${inc} | ${exc}`),
  /** @param {number|null} inc @param {number|null} exc */
  misSpoken: (inc, exc) => (inc === null ? '' : `chọn ${inc}, bỏ ${exc}`),
  /** @param {number|null} size @param {number|null} sub @param {number|null} all */
  rerootNote: (size, sub, all) =>
    all !== null ? `Σ${all}` : size === null ? '' : `${size} · ${sub}`,
  /** @param {number|null} size @param {number|null} sub @param {number|null} all */
  rerootSpoken: (size, sub, all) =>
    all !== null
      ? `tổng khoảng cách ${all}`
      : size === null
        ? ''
        : `kích thước ${size}, tổng phía dưới ${sub}`,
  /** @param {TreeProblem} p */
  noteKey: (p) =>
    p === 'mis'
      ? 'Dưới mỗi nút: chọn | bỏ. Nhãn của nút kết thúc bằng trọng số của nó.'
      : 'Dưới mỗi nút: kích thước · tổng khoảng cách phía dưới, rồi Σ là tổng khoảng cách tới mọi nút.',
  nodeStates: {
    current: 'đang giải',
    stack: 'trên call stack',
    child: 'nút con đang đọc',
    settled: 'cây con đã xong',
    picked: 'được chọn',
    out: 'bị bỏ',
    known: 'đã biết tổng khoảng cách',
    best: 'tâm tốt nhất',
  },
  legend: {
    current: 'Đang giải',
    stack: 'Đang chờ trên call stack',
    child: 'Nút con đang đọc',
    settled: 'Cây con đã xong',
    picked: 'Được chọn',
    out: 'Bị bỏ',
    known: 'Đã biết tổng khoảng cách',
    best: 'Tổng khoảng cách nhỏ nhất',
  },
  markers: {
    current: '●',
    stack: '◇',
    child: '○',
    settled: '✓',
    picked: '★',
    out: '–',
    known: '◆',
    best: '★',
  },
  tableTitle: { mis: 'Giá trị của từng nút', reroot: 'Giá trị của từng nút' },
  /** @type {Record<TreeProblem, string[]>} */
  rowHeads: { mis: ['inc', 'exc'], reroot: ['size', 'sub', 'all'] },
  /** @param {TreeProblem} p */
  tableAria: (p) =>
    p === 'mis'
      ? 'Bảng giá trị chọn và bỏ, mỗi cột một nút.'
      : 'Bảng kích thước cây con, tổng khoảng cách phía dưới và tổng khoảng cách tới mọi nút, mỗi cột một nút.',
  stats: {
    settled: 'Số cây con đã xong',
    edges: 'Số lần đi qua cạnh',
    answer: { mis: 'Tổng tốt nhất', reroot: 'Tổng nhỏ nhất' },
    naive: {
      mis: 'Số tập con vét cạn phải thử',
      reroot: 'Số lần đi qua cạnh, mỗi gốc một lần tìm',
    },
  },
  pending: '…',
  pickedTitle: { mis: 'Các nút được chọn', reroot: 'Tổng khoảng cách' },
  pickedEmpty: 'Đọc ngược lại sau khi đã giải xong gốc.',
  /** @param {number} v @param {number|null} all */
  sumChip: (v, all) => `${node(v)}: ${all}`,
  /** @param {TreeDpFrame} f */
  describe(f) {
    const mis = f.problem === 'mis';
    const v = node(f.v);
    const c = node(f.c);
    switch (f.kind) {
      case 'start':
        return mis
          ? `Chọn các nút có tổng trọng số lớn nhất sao cho không có hai nút được chọn nào nối với nhau bằng một cạnh. Cây có ${f.n} nút, gốc A.`
          : `Với mỗi nút, cộng khoảng cách (tính bằng số cạnh) từ nó tới cả ${f.n} nút. Ta giải với gốc A trước, rồi dời gốc.`;
      case 'enter':
        return mis
          ? `Giải ${v}: nếu chọn, riêng nó mang lại inc = ${f.weight[f.v]}; nếu bỏ, exc = 0.${f.parent.includes(f.v) ? ' Các con của nó được giải trước.' : ' Đây là một lá.'}`
          : `Vào ${v}: lúc này cây con của nó chỉ có mình ${v}, kích thước 1, tổng khoảng cách 0.`;
      case 'merge':
        return mis
          ? `Gộp ${c} vào (inc ${f.inc[f.c]}, exc ${f.exc[f.c]}). Nếu chọn ${v} thì phải bỏ ${c}: inc[${v}] += ${f.exc[f.c]} → ${f.inc[f.v]}. Nếu không, ${c} lấy giá trị tốt hơn của nó: exc[${v}] += ${Math.max(f.inc[f.c] ?? 0, f.exc[f.c] ?? 0)} → ${f.exc[f.v]}.`
          : `Gộp ${c} vào: ${f.size[f.c] ?? 0} nút của nó xa ${v} hơn một cạnh so với xa ${c}, nên sub[${v}] += ${f.sub[f.c]} + ${f.size[f.c]} → ${f.sub[f.v]}, kích thước → ${f.size[f.v]}.`;
      case 'settle':
        return mis
          ? `${v} đã xong: inc = ${f.inc[f.v]}, exc = ${f.exc[f.v]}. Nút cha chỉ cần đọc hai số này.`
          : `${v} đã xong: kích thước ${f.size[f.v]}, tổng khoảng cách phía dưới ${f.sub[f.v]}.`;
      case 'answer':
        return `Gốc quyết định: max(inc[A], exc[A]) = max(${f.inc[0]}, ${f.exc[0]}) = ${f.result}. Giờ ta đọc ngược lựa chọn từ trên xuống.`;
      case 'pick': {
        const p = f.parent[f.v];
        if (p >= 0 && f.taken[p]) return `${node(p)} được chọn, nên phải bỏ ${v}.`;
        return f.taken[f.v]
          ? `${v} được tự do và inc ${f.inc[f.v]} ≥ exc ${f.exc[f.v]}: chọn ${v}.`
          : `${v} được tự do nhưng exc ${f.exc[f.v]} > inc ${f.inc[f.v]}: bỏ ${v}.`;
      }
      case 'root':
        return `Khi A là gốc, tổng phía dưới A chính là tổng khoảng cách tới mọi nút: all[A] = ${f.all[0]}. Giờ ta dời gốc xuống dần, từng cạnh một.`;
      case 'move':
        return `Dời gốc từ ${v} sang ${c}: ${f.size[f.c] ?? 0} nút gần thêm một bước và ${f.n - (f.size[f.c] ?? 0)} nút xa thêm một bước. all[${c}] = ${f.all[f.v]} − ${f.size[f.c]} + ${f.n - (f.size[f.c] ?? 0)} = ${f.all[f.c]}.`;
      case 'done':
        return mis
          ? `Tổng tốt nhất là ${f.result}, từ các nút được chọn ${f.taken
              .map((t, i) => (t ? node(i) : ''))
              .filter(Boolean)
              .join(', ')}.`
          : `Sau hai lượt duyệt, ta biết mọi tổng khoảng cách. Tổng nhỏ nhất là ${f.result}, ở tâm của cây.`;
    }
  },
  takeaways: [
    'Chọn gốc cho cây rồi giải theo thứ tự duyệt sau: một nút chỉ xong sau khi mọi con của nó đã xong, và nút cha chỉ đọc vài con số từ nó.',
    'Tập độc lập: inc[v] = w[v] + Σ exc[c] và exc[v] = Σ max(inc[c], exc[c]). Hai con số cho mỗi nút thay cho 2ⁿ tập con mà vét cạn phải thử.',
    'Đọc ngược đáp án từ trên xuống: nút có cha được chọn thì phải bỏ; nút được tự do thì chọn khi inc[v] ≥ exc[v].',
    'Đổi gốc biến đáp án của một gốc thành đáp án của mọi gốc: dời gốc từ v sang con c làm size[c] nút gần thêm một bước và n − size[c] nút xa thêm một bước. Hai lượt duyệt, O(n), thay cho n lần tìm kiếm, O(n²).',
    'Chuyển sang hình sao, cho tâm trọng số lớn hơn tổng mọi lá rồi nhỏ hơn: xem exc[A] và inc[A] đổi chỗ cho nhau.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Lượt duyệt sau', 'O(n)', 'Mỗi nút được vào một lần và gộp vào cha một lần.'],
    ['Lượt đổi gốc', 'O(n)', 'Mỗi cạnh dời gốc một lần, trong O(1).'],
    ['Bộ nhớ', 'O(n)', 'Vài con số cho mỗi nút, cộng call stack có độ sâu h.'],
    ['Vét cạn tập', 'O(2ⁿ · n)', 'Mọi tập con, mỗi tập được kiểm tra với các cạnh.'],
    ['Tổng khoảng cách kiểu ngây thơ', 'O(n²)', 'Mỗi nút một lần BFS.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Trong ví dụ “Tiệc công ty”, tổng trọng số lớn nhất của một tập độc lập là bao nhiêu?',
      answer: 16,
      hints: ['Chạy tới bước cuối và đọc ô “Tổng tốt nhất”.'],
      solution:
        'Chọn A (3), E (6), F (1), G (3) và H (3): 16. B nặng 5 nhưng chặn E và F, hai nút này cộng lại được 7.',
    },
    {
      type: 'number',
      prompt:
        'Trong ví dụ “Đường thẳng 6 nút” (trọng số 4, 5, 4, 3, 6, 2), exc[A], tổng tốt nhất khi bỏ A, bằng bao nhiêu?',
      answer: 11,
      hints: ['Nạp “Đường thẳng 6 nút”, chạy tới khi A xong và đọc hàng exc.'],
      solution:
        'Khi bỏ A, đoạn B..F được tự do: B (5) và E (6) cho 11, nhiều hơn C và E (10) hoặc B, D, F (10).',
    },
    {
      type: 'choice',
      prompt: 'Vì sao phải giải cây theo thứ tự duyệt sau?',
      options: [
        'Vì gốc là nút nặng nhất.',
        'Vì giá trị của một nút được dựng từ giá trị đã xong của các con.',
        'Vì duyệt trước ghé ít nút hơn.',
        'Vì các lá có trọng số 0.',
      ],
      answer: 1,
      hints: ['Bước gộp đọc những ô nào?'],
      solution:
        'inc[v] và exc[v] cộng dồn giá trị của các con, nên mọi con phải xong trước: con trước cha chính là duyệt sau.',
    },
    {
      type: 'number',
      prompt:
        'Trong cây “Tiệc công ty”, tổng khoảng cách từ A là 11. Con D có cây con gồm 3 nút. Tổng khoảng cách từ D là bao nhiêu?',
      answer: 13,
      hints: [
        'Chuyển sang “Tổng khoảng cách” và chạy tới bước dời gốc từ A sang D.',
        'all[c] = all[v] − size[c] + (n − size[c]).',
      ],
      solution: '11 − 3 + (8 − 3) = 13: ba nút gần thêm, năm nút xa thêm.',
    },
    {
      type: 'text',
      prompt: 'Đổi gốc mất bao lâu để tìm tổng khoảng cách của cả n nút?',
      accept: ['O(n)', 'Θ(n)', 'n', 'tuyến tính', 'linear'],
      hints: ['Đếm số lượt duyệt và công việc trên mỗi cạnh.'],
      solution:
        'Một lượt duyệt sau và một lượt duyệt trước, mỗi lượt O(1) trên mỗi cạnh: tổng cộng O(n).',
    },
  ],
  nextTeaser:
    'Bài sau áp dụng QHĐ lên các chữ số của một số: QHĐ chữ số đếm những số thoả điều kiện mà không cần liệt kê chúng.',
};
