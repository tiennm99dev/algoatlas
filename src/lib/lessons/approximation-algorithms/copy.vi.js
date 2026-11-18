/** @typedef {import('$lib/algo-engine/approximation-algorithms.js').CoverFrame} CoverFrame */

/** At most two decimals, with no trailing zeros. @param {number} v */
const num = (v) => String(Math.round(v * 100) / 100);

/** @param {string[]} names @param {number[]} set */
const setText = (names, set) => (set.length ? `{${set.map((i) => names[i]).join(', ')}}` : '{ }');

export const vi = {
  slug: 'approximation-algorithms',
  topic: 'intractability',
  level: 'Nâng cao',
  title: 'Thuật toán xấp xỉ',
  intro:
    'Khi một bài toán là NP-khó, đáp án chính xác có thể tốn thời gian hàm mũ. Một thuật toán xấp xỉ chạy trong thời gian đa thức và chứng minh được rằng đáp án của nó không kém tối ưu quá một hệ số cố định, gọi là tỉ số xấp xỉ (approximation ratio). Phủ đỉnh (vertex cover) có một thuật toán 2-xấp xỉ đơn giản, còn thuật toán tham lam (greedy) cho phủ tập giữ được trong khoảng hệ số ln n.',
  summary:
    'So sánh thuật toán 2-xấp xỉ dựa trên ghép cặp và quy tắc tham lam cho bài toán phủ đỉnh với tối ưu thực sự, trên một đồ thị do bạn vẽ.',
  instruction:
    'Chọn một thuật toán rồi chạy từng bước. ◆ đánh dấu một tập phủ nhỏ nhất, tìm bằng vét cạn, nên hãy so sánh ô “Kích thước tập phủ” với ô “Tối ưu” trong lúc chạy. Tự vẽ đồ thị bằng các công cụ, hoặc nạp các ví dụ nơi mỗi thuật toán làm tệ nhất.',
  algorithmLabel: 'Thuật toán',
  algorithms: { matching: 'Ghép cặp, 2-xấp xỉ', greedy: 'Tham lam, nhiều cạnh nhất' },
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    spider: 'Con nhện',
    star: 'Hình sao',
    path: 'Đường thẳng',
  },
  graphAria: 'Đồ thị cần phủ. Vẽ nó bằng các công cụ.',
  /** @param {string} name @param {string} state */
  vertexLabel: (name, state) => (state ? `Đỉnh ${name}, ${state}` : `Đỉnh ${name}`),
  states: {
    current: 'đang xử lí',
    cover: 'thuộc tập phủ',
    optimum: 'thuộc một tập phủ nhỏ nhất',
  },
  markers: { optimum: '◆' },
  /** @param {number} d */
  degreeNote: (d) => `${d}`,
  legend: {
    current: 'Đang xử lí',
    cover: 'Thuộc tập phủ',
    optimum: '◆ Thuộc một tập phủ nhỏ nhất',
    matched: 'Cạnh ghép cặp',
    covered: 'Cạnh đã được phủ',
    edge: 'Cạnh đang đọc',
  },
  degreeHint: 'Với thuật toán tham lam, số dưới mỗi đỉnh đếm các cạnh chưa phủ chạm tới đỉnh đó.',
  stats: {
    cover: 'Kích thước tập phủ',
    optimum: 'Tối ưu',
    ratio: 'Tỉ số, tập phủ / tối ưu',
    matched: 'Số cạnh ghép cặp |M|',
    picks: 'Số lần tham lam chọn',
  },
  /** @param {number} m */
  matchedNote: (m) => `Vậy tối ưu ít nhất là ${m}.`,
  /** @param {number} delta @param {number} h */
  greedyNote: (delta, h) => `Bảo đảm H(${delta}) ≈ ${num(h)}.`,
  ratioNote: { matching: 'Bảo đảm không quá 2.', greedy: 'Bảo đảm không quá H(Δ).' },
  /** @param {number} c @param {number} opt */
  ratio: (c, opt) => (opt === 0 ? '—' : num(c / opt)),
  coverTitle: 'Tập phủ đến lúc này',
  coverEmpty: 'Rỗng.',
  /** @param {CoverFrame} f @param {string[]} names */
  describe(f, names) {
    const e = f.edge >= 0 ? f.edges[f.edge] : null;
    const pair = e ? `${names[e[0]]} – ${names[e[1]]}` : '';
    const opt = f.optimum.length;
    switch (f.kind) {
      case 'start':
        return f.edges.length === 0
          ? 'Đồ thị không có cạnh nào, nên tập rỗng đã phủ được nó.'
          : f.algorithm === 'matching'
            ? `Đọc lần lượt ${f.edges.length} cạnh, bắt đầu với tập phủ rỗng.`
            : `Bắt đầu với tập phủ rỗng. Mỗi vòng lấy đỉnh phủ được nhiều cạnh mới nhất.`;
      case 'take':
        return `Cả hai đầu của ${pair} đều chưa thuộc tập phủ. Lấy cả hai, ${names[e?.[0] ?? 0]} và ${names[e?.[1] ?? 0]}. Lời giải tối ưu cũng phải lấy ít nhất một trong hai, và không cạnh ghép cặp nào khác dùng chung hai đỉnh này.`;
      case 'skip':
        return `${pair} đã có một đầu thuộc tập phủ. Bỏ qua nó.`;
      case 'pick':
        return `${names[f.vertex]} chạm tới ${f.gain} cạnh chưa phủ, nhiều nhất trong mọi đỉnh. Lấy nó.`;
      case 'done':
        if (f.edges.length === 0) return 'Xong: tập phủ rỗng là tối ưu.';
        return f.algorithm === 'matching'
          ? `Mọi cạnh đã được phủ. Tập phủ có ${f.cover.length} = 2 · ${f.matching.length} đỉnh, và ${f.matching.length} cạnh ghép cặp buộc tối ưu phải có ít nhất ${f.matching.length} đỉnh. Tối ưu là ${opt}, nên tỉ số là ${num(f.cover.length / opt)}.`
          : `Mọi cạnh đã được phủ, bằng ${f.cover.length} đỉnh ${setText(names, f.cover)}. Tối ưu ${setText(names, f.optimum)} có ${opt} đỉnh, nên tỉ số là ${num(f.cover.length / opt)}.`;
    }
  },
  takeaways: [
    'Tỉ số xấp xỉ so sánh đáp án với tối ưu trong trường hợp xấu nhất: với bài toán tìm giá trị nhỏ nhất, tỉ số 2 nghĩa là đáp án không bao giờ lớn hơn hai lần tối ưu.',
    'Chứng minh một tỉ số cần một cận dưới dễ thấy của tối ưu. Với phủ đỉnh, đó là một ghép cặp: không hai cạnh nào của nó dùng chung đỉnh, nên mọi tập phủ cần ít nhất |M| đỉnh.',
    'Thuật toán tham lam cho phủ tập mỗi lần lấy tập phủ được nhiều phần tử chưa phủ nhất. Nó không kém tối ưu quá H(n) ≈ ln n lần, và không thuật toán đa thức nào làm tốt hơn đáng kể, trừ khi P = NP.',
    'Một quy tắc tham lam tự nhiên không phải lúc nào cũng tốt hơn. Với phủ đỉnh, tham lam theo bậc không có tỉ số hằng trong trường hợp xấu nhất, trong khi quy tắc ghép cặp đơn giản không bao giờ vượt quá 2.',
    'Nạp “Con nhện” và chuyển qua lại giữa hai thuật toán: ghép cặp lấy 6 đỉnh, tham lam lấy 4, so với tối ưu là 3. Sau đó nạp “Đường thẳng”, nơi tham lam tìm được tối ưu còn ghép cặp lấy gấp đôi.',
  ],
  complexityHead: ['Thuật toán', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Ghép cặp 2-xấp xỉ', 'O(V + E)', 'Một lượt duyệt qua các cạnh, với một cờ cho mỗi đỉnh.'],
    [
      'Tham lam theo bậc',
      'O(V · E)',
      'Tối đa V vòng, mỗi vòng đếm lại các cạnh chưa phủ; dùng hàng đợi theo ngăn sẽ đưa về O(V + E).',
    ],
    [
      'Tham lam cho phủ tập',
      'O(k · Σ|S|)',
      'Mỗi lần trong k lần chọn quét lại mọi tập; đáp án không kém tối ưu quá H(n) ≈ ln n lần.',
    ],
    [
      'Tối ưu chính xác ở đây',
      'O(2ⱽ · E)',
      'Vét cạn qua mọi tập con, chỉ làm được với đồ thị nhỏ như thế này.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Nạp “Con nhện” và chạy thuật toán ghép cặp. Tập phủ của nó có bao nhiêu đỉnh?',
      answer: 6,
      unit: 'đỉnh',
      hints: ['Chạy tới bước cuối và đọc ô “Kích thước tập phủ”.'],
      solution: 'Nó lấy A – B, C – F và D – G, nên có 6 đỉnh, đúng gấp đôi tối ưu là 3.',
    },
    {
      type: 'number',
      prompt: 'Cùng đồ thị đó với thuật toán tham lam. Tập phủ của nó có bao nhiêu đỉnh?',
      answer: 4,
      unit: 'đỉnh',
      hints: ['A có nhiều cạnh nhất, nên tham lam lấy nó trước.'],
      solution:
        'Tham lam lấy A (3 cạnh), rồi B, C và D cho ba chân nhện, nên có 4 đỉnh. Tối ưu {B, C, D} bỏ qua A.',
    },
    {
      type: 'number',
      prompt:
        'Nạp “Hình sao”, năm lá quanh một tâm, rồi chạy thuật toán ghép cặp. Tỉ số bằng bao nhiêu?',
      answer: 2,
      hints: ['Cạnh đầu tiên lấy tâm và một lá; tối ưu chỉ là riêng tâm.'],
      solution:
        'Tập phủ {A, B} cỡ 2 so với tối ưu {A} cỡ 1: tỉ số 2, mức tệ nhất mà bảo đảm cho phép.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao mọi tập phủ đỉnh đều lớn ít nhất bằng một ghép cặp M bất kì?',
      options: [
        'Tập phủ phải chứa mọi đỉnh của M.',
        'Các cạnh của M không dùng chung đỉnh, nên một đỉnh của tập phủ phủ được nhiều nhất một cạnh của M.',
        'Một ghép cặp luôn là ghép cặp cực đại.',
        'Vì |C| = 2|M|.',
      ],
      answer: 1,
      hints: ['Một đỉnh có thể chạm tới bao nhiêu cạnh ghép cặp?'],
      solution:
        'Mỗi đỉnh chạm tới nhiều nhất một cạnh của M, nên phủ |M| cạnh ghép cặp cần |M| đỉnh khác nhau.',
    },
    {
      type: 'number',
      prompt:
        'Phủ tập trên {1, 2, 3, 4, 5, 6} với S₁ = {1, 2, 3, 4}, S₂ = {1, 3, 5}, S₃ = {2, 4, 6}. Thuật toán tham lam chọn bao nhiêu tập?',
      answer: 3,
      unit: 'tập',
      hints: ['Tham lam lấy tập lớn nhất trước; sau đó chỉ còn 5 và 6.'],
      solution:
        'Tham lam lấy S₁ (4 phần tử mới), rồi S₂ (chỉ có 5) và S₃ (chỉ có 6): 3 tập. Tối ưu S₂, S₃ chỉ dùng 2.',
    },
  ],
  nextTeaser:
    'Bài sau tìm đáp án chính xác theo cách khác: thuật toán tham số cố định dồn phần hàm mũ vào một tham số k nhỏ.',
};
