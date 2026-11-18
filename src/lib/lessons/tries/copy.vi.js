/** @typedef {import('$lib/algo-engine/tries.js').TrieFrame} TrieFrame */
/** @typedef {import('$lib/algo-engine/tries.js').TrieOp} TrieOp */

export const vi = {
  slug: 'tries',
  topic: 'string-algorithms',
  level: 'Cơ bản',
  title: 'Trie',
  intro:
    'Trie (cây tiền tố) lưu một tập từ dưới dạng cây các chữ cái: mọi từ có cùng phần đầu thì đi chung một đường từ gốc. Tìm một từ chỉ đi qua một nút cho mỗi chữ cái, nên chi phí phụ thuộc vào độ dài của từ chứ không phụ thuộc vào số từ đang lưu.',
  summary:
    'Dựng trie qua từng từ, tìm kiếm trong cây và tự động hoàn thành một tiền tố bằng cách đi theo các đường chung.',
  instruction:
    'Gõ một từ và xem đường khớp với nó sáng lên trong cây. Chèn từ, tìm từ hoặc tự động hoàn thành, rồi xem từng bước của lượt đi. Bấm vào một nút bất kì để chép tiền tố của nút đó vào ô nhập. Nút Hoàn tác bỏ thao tác cuối cùng.',
  wordLabel: 'Từ hoặc tiền tố',
  insert: 'Chèn',
  search: 'Tìm',
  complete: 'Tự động hoàn thành',
  undo: 'Hoàn tác',
  reset: 'Xoá hết',
  presetLabel: 'Mẫu có sẵn',
  presetPlaceholder: 'Chọn một mẫu…',
  presets: {
    shared: 'Chung tiền tố',
    apart: 'Không chung gì',
    nested: 'Từ nằm trong từ',
  },
  opsTitle: 'Các thao tác',
  opsEmpty: 'chưa có',
  opsHotLabel: 'thao tác hiện tại',
  resultsTitle: 'Kết quả tự động hoàn thành',
  resultsEmpty: 'chưa có',
  rootLabel: 'ε',
  wordNote: 'từ',
  /** @param {TrieOp} op */
  opChip: (op) => `${vi[op.type]} ${op.word}`,
  stats: {
    steps: 'Số nút đã đi qua (thao tác này)',
    words: 'Số từ đã lưu',
    letters: 'Tổng số chữ cái của các từ',
    nodes: 'Số nút dưới gốc',
  },
  /** @param {number} letters @param {number} nodes */
  saved: (letters, nodes) =>
    `Dùng chung tiền tố tiết kiệm được ${letters - nodes} nút: nếu mỗi chữ cái một nút thì cần ${letters} nút.`,
  /** @param {number} max */
  wordErrors: (max) => ({
    empty: 'Hãy gõ một từ trước đã.',
    format: 'Chỉ dùng chữ cái a đến z, không có dấu cách.',
    length: `Một từ dài tối đa ${max} chữ cái.`,
  }),
  /** @param {number} max */
  full: (max) => `Trie đã đầy (${max} từ).`,
  /** @param {number} max */
  logFull: (max) =>
    `Danh sách thao tác đã đầy (${max} thao tác). Hãy hoàn tác hoặc xoá hết để làm tiếp.`,
  liveTitle: 'Theo những gì em gõ',
  /** @param {string} prefix @param {number} matched @param {string[]} words */
  live(prefix, matched, words) {
    if (prefix === '') return 'Gõ chữ cái để đi theo một đường từ gốc.';
    if (matched < prefix.length) {
      const read = prefix.slice(0, matched);
      return matched === 0
        ? `Không có từ nào bắt đầu bằng ${prefix[0]}.`
        : `“${read}” có trong trie, nhưng không từ nào đi tiếp bằng ${prefix[matched]}.`;
    }
    if (words.length === 0)
      return `“${prefix}” có trong trie, nhưng chưa có từ nào bắt đầu bằng nó.`;
    return `Có ${words.length} từ bắt đầu bằng “${prefix}”: ${words.join(', ')}.`;
  },
  /** @param {number} nodes @param {number} words */
  treeLabel: (nodes, words) =>
    `Trie gồm ${nodes} nút và ${words} từ. Nhấn Enter trên một nút để chép tiền tố của nó vào ô nhập.`,
  /** @param {string} prefix @param {boolean} isWord @param {string} state */
  nodeLabel(prefix, isWord, state) {
    const name = prefix === '' ? 'Gốc' : `Tiền tố ${prefix}`;
    return [name, isWord ? 'là một từ đã lưu' : '', state].filter(Boolean).join(', ');
  },
  states: {
    current: 'đang đọc',
    new: 'vừa tạo',
    found: 'từ kết thúc ở đây',
    missing: 'dừng ở đây',
    path: 'trên đường đi',
    subtree: 'nằm dưới tiền tố',
    typed: 'khớp với chữ em gõ',
  },
  markers: {
    current: '?',
    new: '+',
    found: '✓',
    missing: '✗',
    path: '•',
    subtree: '▾',
    typed: '›',
  },
  legend: {
    current: 'Đang đọc',
    new: 'Vừa tạo',
    found: 'Từ kết thúc ở đây',
    missing: 'Dừng ở đây',
    path: 'Trên đường đi',
    subtree: 'Nằm dưới tiền tố',
    typed: 'Khớp với chữ em gõ',
  },
  wordLegend: 'Chú thích “từ” đánh dấu nơi một từ đã lưu kết thúc.',
  /** @param {TrieFrame} f */
  describe(f) {
    const word = f.op?.word ?? '';
    const type = f.op?.type;
    const walked = f.path.length - 1;
    switch (f.kind) {
      case 'start':
        return 'Ban đầu trie chỉ có một gốc rỗng.';
      case 'begin':
        return type === 'insert'
          ? `Chèn ${word}: bắt đầu từ gốc.`
          : type === 'search'
            ? `Tìm ${word}: bắt đầu từ gốc.`
            : `Tự động hoàn thành ${word}: trước hết đi xuống đến cuối tiền tố.`;
      case 'follow':
        return `Chữ ${f.letter} đã có nút, nên ta đi theo nó: đường đi ghép thành “${word.slice(0, walked)}”.`;
      case 'create':
        return `Chưa có nút con cho ${f.letter}, nên ta tạo một nút: tiền tố “${word.slice(0, walked)}” lần đầu có trong trie.`;
      case 'mark':
        return `Đã đến chữ cái cuối: đánh dấu nút này là điểm kết thúc của từ ${word}.`;
      case 'dup':
        return `Nút của ${word} đã được đánh dấu, nên từ này đã có sẵn trong trie.`;
      case 'missing':
        return `Không có nút con cho ${f.letter}, nên không từ nào đã lưu bắt đầu bằng “${word.slice(0, walked + 1)}”. Dừng sau ${f.steps} nút.`;
      case 'found':
        return `Cả ${word.length} chữ cái đều khớp và nút có dấu kết thúc: ${word} đã được lưu.`;
      case 'prefix-only':
        return `Cả ${word.length} chữ cái đều khớp, nhưng nút không có dấu kết thúc: ${word} chỉ là tiền tố của những từ dài hơn, không phải một từ đã lưu.`;
      case 'subtree':
        return `Tiền tố kết thúc ở đây. Mọi từ bắt đầu bằng ${word} đều kết thúc ở nút này hoặc ở ${f.subtree.length - 1} nút bên dưới nó.`;
      case 'collect':
        return `Nút này có dấu kết thúc, nên ta báo từ ${f.results[f.results.length - 1]}.`;
      case 'collected':
        return `Tự động hoàn thành tìm được ${f.results.length} từ sau khi đi qua ${f.steps} nút.`;
      case 'done':
        return `Trie chứa ${f.wordCount} từ trong ${f.nodeCount - 1} nút dưới gốc.`;
    }
  },
  takeaways: [
    'Mỗi nút ứng với một tiền tố, và hai từ dùng chung nút đúng bằng đoạn mà chúng bắt đầu giống nhau.',
    'Chèn và tìm đi qua một nút cho mỗi chữ cái, nên tốn O(L) với một từ dài L, kể cả khi đang lưu một triệu từ.',
    'Dấu kết thúc từ rất quan trọng: một đường có thể tồn tại mà không có từ nào kết thúc ở đó, như “ca” trong trie chỉ chứa “car”.',
    'Tự động hoàn thành đi đến cuối tiền tố, rồi đọc các từ bên dưới theo thứ tự từ điển. Một hash table (bảng băm) chứa các từ không có lối tắt như vậy.',
    'Thử mẫu “Không chung gì” rồi đến “Chung tiền tố”: so số chữ cái được lưu với số nút đã dùng, và xem dùng chung tiết kiệm được bao nhiêu.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Chèn hoặc tìm', 'O(L)', 'Một nút cho mỗi chữ cái của từ, dù đang lưu bao nhiêu từ.'],
    ['Tự động hoàn thành', 'O(L + k)', 'Đi qua L chữ cái của tiền tố, rồi đọc k nút bên dưới nó.'],
    [
      'Bộ nhớ',
      'O(N · σ)',
      'Số nút N không vượt quá tổng số chữ cái đã lưu, mỗi nút có chỗ cho tối đa σ nút con khi các con được giữ trong một mảng.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Chèn tea, ten, team và to vào một trie rỗng. Trie có bao nhiêu nút, tính cả gốc?',
      answer: 7,
      unit: 'nút',
      hints: ['Đếm các tiền tố khác nhau: t, te, tea, …, cộng thêm tiền tố rỗng ứng với gốc.'],
      solution:
        'Các tiền tố khác rỗng và khác nhau là t, te, tea, ten, team và to, tức 6 nút. Thêm gốc là 7.',
    },
    {
      type: 'number',
      prompt: 'Một trie chỉ chứa car. Chèn card sẽ tạo bao nhiêu nút mới?',
      answer: 1,
      unit: 'nút',
      hints: ['Đi qua c, a, r trước. Trong bốn chữ cái, chữ nào chưa có nút?'],
      solution:
        'Đường c → a → r đã có sẵn, nên chỉ d cần một nút mới. Nút của r vẫn giữ dấu kết thúc từ của nó.',
    },
    {
      type: 'choice',
      prompt: 'Một trie chỉ chứa car và card. search(ca) trả về gì, và vì sao?',
      options: [
        'Tìm thấy, vì đường c → a có tồn tại',
        'Không tìm thấy, vì nút của a không có dấu kết thúc từ',
        'Không tìm thấy, vì đường c → a không tồn tại',
        'Tìm thấy, vì ca là tiền tố của một từ đã lưu',
      ],
      answer: 1,
      hints: [
        'Tìm kiếm và tự động hoàn thành đi cùng một đường. Ở cuối đường, tìm kiếm kiểm tra gì?',
      ],
      solution:
        'Đường có tồn tại, nhưng không từ nào kết thúc ở nút của a, nên tìm kiếm trả lời không tìm thấy. Một truy vấn tiền tố trên cùng lượt đi sẽ trả lời có.',
    },
    {
      type: 'order',
      prompt:
        'Một trie chứa cat, car, care và card. Xếp kết quả của complete(ca) theo thứ tự một lượt DFS (duyệt theo chiều sâu) báo ra, với các chữ cái theo thứ tự từ điển và một từ đứng trước những từ bắt đầu bằng nó.',
      items: ['cat', 'car', 'care', 'card'],
      answer: [1, 3, 2, 0],
      hints: ['Dưới nút của ca, r đứng trước t. Dưới nút của car, d đứng trước e.'],
      solution:
        'Lượt duyệt gặp r trước và báo car, rồi đi xuống d (card) và e (care), cuối cùng đến t (cat). Đó chính là thứ tự từ điển.',
    },
    {
      type: 'number',
      prompt:
        'Lưu stop, star và start. So với việc mỗi chữ cái một nút, dùng chung tiền tố tiết kiệm được bao nhiêu nút dưới gốc?',
      answer: 6,
      unit: 'nút',
      hints: ['Tổng số chữ cái là 4 + 4 + 5. Giờ hãy đếm các tiền tố khác rỗng và khác nhau.'],
      solution:
        'Các từ có tổng cộng 13 chữ cái. Các tiền tố khác nhau là s, st, sto, stop, sta, star và start, nên 7 nút là đủ: tiết kiệm 13 − 7 = 6 nút.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Hash xâu và thuật toán Rabin-Karp, tìm một mẫu trong văn bản bằng cách so giá trị hash của từng cửa sổ thay vì so từng kí tự.',
};
