/** @typedef {import('$lib/algo-engine/regular-expressions-nfa.js').NfaFrame} NfaFrame */

/** @param {number[]} set */
const setText = (set) => `{${set.join(', ')}}`;

export const vi = {
  slug: 'regular-expressions-nfa',
  topic: 'string-algorithms',
  level: 'Nâng cao',
  title: 'Biểu thức chính quy và mô phỏng NFA',
  intro:
    'Một biểu thức chính quy (regular expression) mô tả cả một tập xâu. Phép dựng Thompson biến biểu thức thành một đồ thị trạng thái nhỏ, gọi là ô-tô-mát hữu hạn không đơn định (NFA), trong đó có thể đi theo các cạnh ε mà không cần đọc gì. Theo dõi tập các trạng thái mà máy có thể đang ở giúp kiểm tra mọi xâu trong O(n · m), kể cả với những mẫu khiến cách so khớp quay lui tốn thời gian hàm mũ.',
  summary:
    'Dựng một NFA từ biểu thức chính quy bằng phép dựng Thompson và kiểm tra xâu bằng cách mô phỏng tập trạng thái đang hoạt động.',
  instruction:
    'Gõ một biểu thức chính quy và một đầu vào, rồi chạy từng bước. Đồ thị lớn dần, mỗi chữ cái và mỗi phép toán thêm một mảnh. Sau đó mỗi chữ cái đưa các trạng thái đang hoạt động đi theo những cạnh khớp, và các cạnh ε lan chúng ra xa hơn. Chọn “Bẫy quay lui” và so hai con số đếm bước.',
  regexLabel: 'Biểu thức chính quy',
  inputLabel: 'Đầu vào (có thể để trống)',
  presetLabel: 'Ví dụ',
  syntax:
    'Chữ cái a đến z, . thay cho chữ cái bất kì, | nghĩa là hoặc, * + ? để lặp, và ( ) để nhóm.',
  presets: {
    classic: '(a|b)*abb',
    choice: '(cat|dog)s?',
    optional: 'colou?r',
    dead: 'Ngõ cụt',
    blowup: 'Bẫy quay lui',
  },
  /** @param {number} regex @param {number} input */
  fieldErrors: (regex, input) => ({
    empty: 'Hãy gõ một biểu thức chính quy.',
    format: 'Chỉ dùng chữ cái a đến z và . | * + ? ( ).',
    length: `Biểu thức dài tối đa ${regex} kí tự.`,
    paren: 'Các dấu ngoặc không khớp nhau.',
    branch: 'Mỗi bên của | và mỗi cặp ngoặc đều cần có nội dung bên trong.',
    repeat: 'Hãy đặt một chữ cái hoặc một nhóm trước * + hoặc ?.',
    stacked: 'Mỗi lần chỉ dùng một trong * + ?; muốn lặp tiếp thì bọc nhóm trong ngoặc.',
    inputFormat: 'Đầu vào chỉ dùng chữ cái a đến z, không có dấu cách.',
    inputLength: `Đầu vào dài tối đa ${input} chữ cái.`,
  }),
  boardTitle: 'NFA',
  /** @param {string} regex @param {number} n */
  boardAria: (regex, n) => `NFA của ${regex}, gồm ${n} trạng thái.`,
  boardNote:
    'Mũi tên từ bên trái chỉ trạng thái bắt đầu, còn vòng kép chỉ trạng thái chấp nhận. Mỗi cạnh đọc chữ cái ghi trên nó; cạnh ε không đọc gì.',
  /** @param {number} id @param {string} role @param {boolean} accept @param {boolean} start */
  stateLabel: (id, role, accept, start) =>
    `Trạng thái ${id}${start ? ', bắt đầu' : ''}${accept ? ', chấp nhận' : ''}${role ? `, ${role}` : ''}`,
  /** @param {number} from @param {number} to @param {string} label @param {boolean} taken */
  edgeLabel: (from, to, label, taken) =>
    `Cạnh từ ${from} đến ${to} theo ${label}${taken ? ', vừa đi qua' : ''}`,
  states: { active: 'đang hoạt động', fresh: 'vừa tới', accept: 'chấp nhận và đang hoạt động' },
  markers: { active: '●', fresh: '+', accept: '✓' },
  legend: {
    active: '● Trạng thái đang hoạt động',
    fresh: '+ Vừa tới',
    accept: '✓ Chấp nhận và đang hoạt động',
    edge: 'Cạnh đậm: vừa đi qua',
  },
  inputTitle: 'Đầu vào',
  inputAria: 'Xâu đầu vào, từng chữ cái một.',
  inputEmpty: 'Đầu vào trống, nên chỉ tập trạng thái bắt đầu quyết định kết quả.',
  inputMarker: '↓',
  /** @param {number} i @param {string} letter @param {boolean} now */
  inputCell: (i, letter, now) => `Đầu vào vị trí ${i}: ${letter}${now ? ', đang đọc' : ''}`,
  stats: {
    states: 'Số trạng thái của NFA',
    edges: 'Số cạnh của NFA',
    active: 'Số trạng thái đang hoạt động',
    checks: 'Số cạnh đã xét',
    backtrack: 'Số lần thử của cách quay lui',
    verdict: 'Kết luận',
  },
  /** @param {number} n */
  overCap: (n) => `trên ${n}`,
  verdicts: { pending: '—', yes: 'chấp nhận', no: 'từ chối' },
  setTitle: 'Tập đang hoạt động sau mỗi chữ cái',
  setEmpty: 'chưa đọc gì',
  /** @param {{letter: string, set: number[]}} h */
  setChip: (h) => `${h.letter} → ${setText(h.set)}`,
  pieces: {
    char: 'một cạnh chữ cái đến một trạng thái mới',
    any: 'một cạnh nhận chữ cái bất kì',
    cat: '',
    alt: 'các cạnh ε đi vào từng nhánh và đi ra một trạng thái mới',
    star: 'một vòng quay lại và một đường vòng qua, để nó có thể lặp hoặc bị bỏ qua',
    plus: 'một vòng quay lại, để nó có thể lặp nhưng phải xảy ra ít nhất một lần',
    opt: 'một đường vòng qua, để nó có thể bị bỏ qua',
  },
  /** @param {NfaFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `Dựng NFA của ${f.regex}, bắt đầu từ một trạng thái.`;
      case 'build': {
        const piece = /** @type {NonNullable<NfaFrame['piece']>} */ (f.piece);
        return `${piece.text}: thêm ${this.pieces[piece.type]}. Giờ NFA có ${piece.states} trạng thái.`;
      }
      case 'ready':
        return `Trước khi đọc gì, đi theo mọi cạnh ε từ trạng thái bắt đầu: tập đang hoạt động là ${setText(f.set)}.`;
      case 'read':
        return f.fresh.length > 0
          ? `Đọc ${f.letter}: các cạnh nhận ${f.letter} dẫn đến ${setText(f.fresh)}.`
          : `Đọc ${f.letter}: không trạng thái đang hoạt động nào có cạnh nhận chữ này.`;
      case 'closure':
        return f.fresh.length > 0
          ? `Đi theo các cạnh ε từ đó, thêm được ${setText(f.fresh)}. Tập đang hoạt động là ${setText(f.set)}.`
          : `Không cạnh ε nào thêm được trạng thái mới. Tập đang hoạt động là ${setText(f.set)}.`;
      case 'dead':
        return 'Tập đang hoạt động đã rỗng, nên dù đọc phần còn lại thế nào cũng không thể thành công.';
      case 'done':
        return f.accepted
          ? `Trạng thái chấp nhận đang hoạt động, nên ${f.input === '' ? 'đầu vào trống' : f.input} được chấp nhận, sau khi xét ${f.edgeChecks} cạnh.`
          : `Trạng thái chấp nhận không hoạt động, nên ${f.input === '' ? 'đầu vào trống' : f.input} bị từ chối, sau khi xét ${f.edgeChecks} cạnh.`;
    }
  },
  takeaways: [
    'Biểu thức chính quy có ba phép toán cốt lõi: ghép nối, lựa chọn bằng | và lặp bằng *. Hai dạng + và ? là cách viết tắt dựng từ chúng.',
    'Phép dựng Thompson dựng NFA từng mảnh: mỗi chữ cái một cạnh và mỗi phép toán vài cạnh ε, nên m kí hiệu tạo ra tối đa 2m trạng thái.',
    'Có thể đi theo cạnh ε mà không đọc chữ cái nào. Bao đóng ε của một tập là mọi trạng thái tới được theo cách đó.',
    'Phép mô phỏng giữ một tập trạng thái thay vì đoán một đường đi: di chuyển theo chữ cái, rồi lấy bao đóng. Mỗi chữ cái tốn tối đa hai lượt qua các cạnh.',
    'Chọn “Bẫy quay lui”, rồi thêm hoặc bớt chữ cái ở đầu vào: số lần thử của cách quay lui tăng gấp đôi sau mỗi chữ cái, còn số cạnh đã xét chỉ tăng thêm một lượng cố định.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Dựng NFA', 'O(m)', 'Mỗi kí hiệu của biểu thức một mảnh, mỗi mảnh có kích thước cố định.'],
    [
      'Mô phỏng',
      'O(n · m)',
      'Với mỗi chữ cái trong n chữ cái, mỗi cạnh được xét tối đa hai lần, một lần để di chuyển và một lần cho bao đóng, và có O(m) cạnh.',
    ],
    [
      'So khớp quay lui',
      'Hàm mũ trong trường hợp xấu nhất',
      'Một mẫu nhập nhằng như (a|a)*b thử lại cả hai nhánh ở mỗi chữ cái, nên tốn khoảng 2ⁿ lần thử; nhiều nhánh hơn còn tệ hơn.',
    ],
    ['Bộ nhớ', 'O(m)', 'Đồ thị, cộng một tập đang hoạt động chứa nhiều nhất tất cả trạng thái.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Phép dựng này tạo ra bao nhiêu trạng thái cho a*?',
      answer: 4,
      unit: 'trạng thái',
      hints: ['Gõ a* vào phần tương tác rồi đọc ô số liệu.'],
      solution:
        'Trạng thái vào, rồi trạng thái bắt đầu bên trong và trạng thái sau a, rồi một trạng thái ra mới: tổng cộng bốn.',
    },
    {
      type: 'number',
      prompt: 'a|b có bao nhiêu cạnh ε?',
      answer: 4,
      unit: 'cạnh',
      hints: ['Hai cạnh đi vào các nhánh và hai cạnh đi ra khỏi chúng.'],
      solution: 'Mỗi nhánh có một cạnh ε đi vào và một cạnh ε đi ra: 2 + 2 = 4.',
    },
    {
      type: 'number',
      prompt: 'Trước khi đọc chữ cái nào, a|b có bao nhiêu trạng thái đang hoạt động?',
      answer: 3,
      unit: 'trạng thái',
      hints: ['Bắt đầu ở trạng thái bắt đầu, rồi đi theo mọi cạnh ε.'],
      solution:
        'Trạng thái bắt đầu và hai trạng thái đầu nhánh tới được qua cạnh ε: ba trạng thái.',
    },
    {
      type: 'multi',
      prompt: '(a|b)*abb chấp nhận những xâu nào sau đây?',
      options: ['abb', 'aabb', 'abab', 'babb', 'ab'],
      answers: [0, 1, 3],
      hints: ['Biểu thức này nghĩa là mọi xâu gồm a và b kết thúc bằng abb.'],
      solution: 'abb, aabb và babb đều kết thúc bằng abb. abab và ab thì không.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao phép mô phỏng tránh được sự bùng nổ hàm mũ của cách quay lui?',
      options: [
        'Nó thử các nhánh theo một thứ tự khéo hơn.',
        'Nó gộp mọi cách đi tới một trạng thái thành một phần tử duy nhất của tập.',
        'Nó chỉ chạy được với các mẫu không có phép lặp.',
      ],
      answer: 1,
      hints: ['Một trạng thái có thể xuất hiện trong tập bao nhiêu lần?'],
      solution:
        'Dù có bao nhiêu đường đi tới một trạng thái, nó chỉ vào tập một lần, nên công việc cho mỗi chữ cái bị chặn bởi kích thước của đồ thị.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Nén dữ liệu: mã loạt dài, Huffman và LZW, so sánh ba cách viết cùng một văn bản bằng ít bit hơn.',
};
