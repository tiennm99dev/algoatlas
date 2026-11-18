/** @typedef {import('$lib/algo-engine/kruskal.js').KruskalFrame} KruskalFrame */
/** @typedef {{u: number, v: number, w: number}} EdgeInfo */

/** @param {EdgeInfo | undefined} e @param {string[]} names */
const edgeName = (e, names) => (e ? `${names[e.u] ?? '?'} — ${names[e.v] ?? '?'}` : '');
/** @param {EdgeInfo | undefined} e @param {string[]} names */
const edgeWithWeight = (e, names) => (e ? `${edgeName(e, names)} (trọng số ${e.w})` : '');

export const vi = {
  slug: 'kruskal',
  topic: 'mst',
  level: 'Trung bình',
  title: 'Thuật toán Kruskal',
  intro:
    'Thuật toán Kruskal dựng cây khung nhỏ nhất (MST) bằng cách sắp xếp các cạnh từ nhẹ đến nặng rồi lấy mỗi cạnh nối hai cây khác nhau. Một cạnh có hai đầu đã nằm trong cùng một cây sẽ khép một chu trình, nên ta bỏ qua nó. Cấu trúc tập hợp rời nhau (DSU) trả lời câu hỏi “cùng một cây không?” trong thời gian gần như hằng số, nên phần tốn kém nhất là sắp xếp: O(E log E).',
  summary:
    'Đưa danh sách cạnh đã sắp xếp vào một đồ thị do bạn vẽ và xem DSU nhận các cạnh nối hai cây, loại các cạnh sẽ khép chu trình.',
  instruction:
    'Đi từng bước qua danh sách cạnh đã sắp xếp ở bên phải. Mỗi cạnh được nhận sẽ hợp hai cây trong rừng DSU; mỗi cạnh bị loại có hai đầu chung một gốc. Đổi một trọng số trong bảng, hoặc vẽ cạnh mới bằng công cụ Nối, để thay đổi thứ tự.',
  resetGraph: 'Khôi phục đồ thị',
  randomWeights: 'Trọng số ngẫu nhiên',
  graphAria: 'Đồ thị vô hướng có trọng số. Mỗi đỉnh có một dấu cho biết gốc của cây DSU chứa nó.',
  edgesTitle: 'Trọng số các cạnh',
  /** @param {string} name */
  weightAria: (name) => `Trọng số cạnh ${name}`,
  noEdges: 'Chưa có cạnh nào. Dùng công cụ Nối để vẽ một cạnh.',
  /** @param {number} max */
  badWeight: (max) => `Trọng số phải là số nguyên từ 1 đến ${max}. Trọng số cũ được giữ nguyên.`,
  sortedTitle: 'Các cạnh theo thứ tự đã sắp xếp',
  sortedAria:
    'Các cạnh được sắp xếp theo trọng số, kèm việc thuật toán Kruskal đã làm với mỗi cạnh.',
  noSorted: 'Không có cạnh nào để sắp xếp.',
  status: { tree: 'đã nhận', cycle: 'bị loại', current: 'đang xét', pending: 'đang chờ' },
  /** @param {string} edge @param {number} w @param {string} status */
  sortedItem: (edge, w, status) => `${edge}, trọng số ${w}, ${status}`,
  forestTitle: 'Rừng DSU (hợp theo hạng, nén đường đi)',
  /** @param {number} sets */
  forestAria: (sets) => `Rừng DSU gồm ${sets} cây.`,
  noVertices: 'Không có đỉnh nào.',
  /** @param {number} r */
  rankNote: (r) => `r${r}`,
  /** @param {string} name @param {string} parent */
  forestNode: (name, parent) => (parent === name ? `${name} là gốc` : `${name}, cha là ${parent}`),
  stats: {
    considered: 'Số cạnh đã xét',
    accepted: 'Đã nhận',
    rejected: 'Bị loại',
    components: 'Số cây trong rừng',
    finds: 'Số lần gọi find',
    weight: 'Trọng số cây',
  },
  legend: {
    ends: 'Hai đầu của cạnh đang xét',
    root: 'Gốc của cây chứa đỉnh',
    edgeAccept: 'Cạnh đang được nhận',
    edgeReject: 'Cạnh đang bị loại',
    tree: 'Cạnh của cây',
    rejected: 'Cạnh bị loại',
    rank: 'r = hạng',
    marks: '→ đang xét, ✓ đã nhận, ✗ bị loại',
  },
  /** @param {string} name @param {string} root @param {boolean} end */
  vertexLabel: (name, root, end) =>
    [`Đỉnh ${name}`, `thuộc cây của ${root}`, end ? 'đầu của cạnh đang xét' : '']
      .filter(Boolean)
      .join(', '),
  /**
   * @param {KruskalFrame} f
   * @param {string[]} names
   * @param {EdgeInfo[]} info
   */
  describe(f, names, info) {
    const e = info[f.edge];
    const n = f.parent.length;
    switch (f.kind) {
      case 'start':
        if (!n) return 'Đồ thị không có đỉnh nào.';
        if (!f.sorted.length)
          return 'Không có cạnh nào để sắp xếp. Mỗi đỉnh vẫn là một cây riêng. Hãy vẽ cạnh bằng công cụ Nối.';
        return `Sắp xếp ${f.sorted.length} cạnh theo trọng số: ${f.sorted.map((k) => `${edgeName(info[k], names)} ${info[k].w}`).join(', ')}. Ban đầu mỗi đỉnh là một cây riêng.`;
      case 'accept':
        return `Cạnh ${edgeWithWeight(e, names)}: find(${names[f.u]}) = ${names[f.ru]} và find(${names[f.v]}) = ${names[f.rv]} là hai gốc khác nhau, nên cạnh nối hai cây. Nhận cạnh và hợp hai cây. Trọng số cây giờ là ${f.weight}.`;
      case 'reject':
        return `Cạnh ${edgeWithWeight(e, names)}: find(${names[f.u]}) = find(${names[f.v]}) = ${names[f.ru]}, nên hai đầu đã nằm trong cùng một cây. Thêm cạnh này sẽ khép một chu trình. Bỏ qua.`;
      case 'stop': {
        const left = f.sorted.length - f.considered;
        return `Cây đã có V − 1 = ${f.accepted} cạnh, nên mọi đỉnh đều được nối. Dừng: ${left} cạnh còn lại không bao giờ được xét.`;
      }
      case 'done':
        if (!n) return 'Không có gì để làm.';
        return f.components > 1
          ? `Đã hết cạnh mà vẫn còn ${f.components} cây, nên đồ thị không liên thông. ${f.accepted} cạnh đã nhận tạo thành một rừng khung nhỏ nhất có trọng số ${f.weight}.`
          : `Xong: cây khung nhỏ nhất có ${f.accepted} cạnh và trọng số ${f.weight}, tìm được sau ${f.finds} lần gọi find.`;
    }
  },
  takeaways: [
    'Thuật toán Kruskal sắp xếp các cạnh theo trọng số và lấy lần lượt từ nhẹ đến nặng. Một cạnh được nhận khi hai đầu thuộc hai cây khác nhau, và bị loại khi chúng cùng một cây.',
    'Mỗi cạnh được nhận là cạnh nhẹ nhất đi qua lát cắt giữa cây của nó và phần còn lại của đồ thị, nên theo tính chất lát cắt (cut property), cạnh đó thuộc một cây khung nhỏ nhất.',
    'DSU giữ các cây: find(u) = find(v) nghĩa là u và v đã được nối. Với hợp theo hạng (union by rank) và nén đường đi (path compression), mỗi thao tác tốn gần như O(1) (hàm Ackermann ngược).',
    'Sắp xếp tốn O(E log E), cũng là O(E log V) vì E < V². Vòng lặp có thể dừng ngay khi đã nhận V − 1 cạnh; trên đồ thị không liên thông, nó chạy hết cạnh và trả về một rừng khung nhỏ nhất.',
    'Thử xem: tăng D — E từ 7 lên 10 rồi chạy lại từng bước. Lúc này C — E (8) là cạnh nhẹ nhất nối {A, B, C, D} với {E, F}, nên nó thế chỗ D — E.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Sắp xếp các cạnh',
      'O(E log E)',
      'Sắp xếp so sánh E cạnh. Vì E < V² nên log E < 2 log V, do đó đây cũng là O(E log V).',
    ],
    [
      'DSU trên mọi cạnh',
      'O(E α(V))',
      'Hai lần find cho mỗi cạnh và nhiều nhất V − 1 lần hợp; với hợp theo hạng và nén đường đi, mỗi lần tốn α(V), trên thực tế không quá 4.',
    ],
    [
      'Tổng cộng',
      'O(E log E)',
      'Sắp xếp chiếm phần lớn. Nếu các cạnh đã được sắp xếp sẵn, chi phí là O(E α(V)).',
    ],
    ['Bộ nhớ', 'O(V + E)', 'Danh sách cạnh đã sắp xếp, cùng một cha và một hạng cho mỗi đỉnh.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'order',
      prompt:
        'Trên đồ thị ban đầu, hãy xếp các cạnh được nhận theo đúng thứ tự thuật toán Kruskal nhận chúng.',
      items: ['A — B (3)', 'B — D (5)', 'E — F (1)', 'D — E (7)', 'B — C (2)'],
      answer: [2, 4, 0, 1, 3],
      hints: [
        'Thuật toán Kruskal lấy cạnh theo trọng số tăng dần; các cạnh được nhận giữ nguyên thứ tự đó.',
      ],
      solution:
        'Theo trọng số: E — F 1, B — C 2, A — B 3, A — C 4 (bị loại), B — D 5, C — D 6 (bị loại), D — E 7. Các cạnh được nhận theo thứ tự là E — F, B — C, A — B, B — D, D — E.',
    },
    {
      type: 'number',
      prompt:
        'Trên đồ thị ban đầu, thuật toán Kruskal lấy bao nhiêu cạnh từ danh sách đã sắp xếp trước khi dừng?',
      answer: 7,
      unit: 'cạnh',
      tolerance: 0,
      hints: [
        'Thuật toán dừng khi cây có V − 1 = 5 cạnh. Nhớ đếm cả các cạnh bị loại trên đường đi.',
      ],
      solution:
        'Năm cạnh được nhận cộng hai cạnh bị loại (A — C và C — D) là 7. Cây đã đủ sau D — E, nên C — E và D — F không bao giờ được xét.',
    },
    {
      type: 'number',
      prompt:
        'Đổi trọng số của D — E thành 10 rồi chạy lại thuật toán Kruskal. Cây khung nhỏ nhất mới có trọng số bao nhiêu?',
      answer: 19,
      tolerance: 0,
      hints: [
        'Bốn cạnh được nhận đầu tiên không đổi. Giờ cạnh nào là cạnh nhẹ nhất tới được E hoặc F?',
      ],
      solution:
        'E — F 1, B — C 2, A — B 3 và B — D 5 được nhận như trước. Sau đó C — D 6 bị loại và C — E 8 nối {A, B, C, D} với {E, F}: 1 + 2 + 3 + 5 + 8 = 19.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao thuật toán Kruskal dùng DSU thay vì tìm kiếm trên đồ thị để kiểm tra mỗi cạnh?',
      options: [
        'Tìm kiếm sẽ cho kết quả sai trên đồ thị có trọng số.',
        'find(u) = find(v) trả lời “đã được nối chưa?” trong gần như O(1), còn một lần tìm kiếm tốn O(V) cho mỗi cạnh.',
        'DSU sắp xếp các cạnh như một tác dụng phụ.',
        'DSU làm cây nhẹ hơn.',
      ],
      answer: 1,
      hints: ['Cả hai cho cùng một câu trả lời. Hãy so chi phí của chúng trên E cạnh.'],
      solution:
        'Tìm kiếm trên các cạnh của cây cũng cho biết u và v đã được nối chưa, nhưng mỗi lần tốn O(V), tổng cộng O(E·V). DSU với hợp theo hạng và nén đường đi chỉ tốn α(V) cho mỗi thao tác.',
    },
    {
      type: 'text',
      prompt: 'Thời gian chạy của thuật toán Kruskal là bao nhiêu, theo kí hiệu O lớn?',
      accept: ['O(E log E)', 'O(E log V)', 'E log E', 'E log V', 'O(m log m)', 'O(m log n)'],
      hints: ['Bước nào chậm hơn: sắp xếp các cạnh hay các thao tác DSU?'],
      solution:
        'Sắp xếp các cạnh tốn O(E log E) = O(E log V), còn phần việc DSU chỉ là O(E α(V)), nên tổng cộng là O(E log E).',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, thuật toán Prim, nuôi cây khung nhỏ nhất từ một đỉnh, mỗi lần thêm cạnh nhẹ nhất rời khỏi cây.',
};
