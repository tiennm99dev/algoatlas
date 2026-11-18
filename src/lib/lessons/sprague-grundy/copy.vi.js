/** @typedef {import('$lib/algo-engine/sprague-grundy.js').GrundyFrame} GrundyFrame */

/** A set of whole numbers in braces. @param {number[]} values */
const braces = (values) => `{${values.length ? ` ${values.join(', ')} ` : ' '}}`;

/** Pile numbers start at 1 for people. @param {number} i */
const pileName = (i) => `đống ${i + 1}`;

/** @param {{ pile: number, take: number }} w */
const moveText = (w) => `bốc ${w.take} viên sỏi từ ${pileName(w.pile)}`;

export const vi = {
  slug: 'sprague-grundy',
  topic: 'algebraic-randomised',
  level: 'Nâng cao',
  title: 'Lí thuyết trò chơi: Nim và Sprague-Grundy',
  intro:
    'Trong trò Nim, hai người lần lượt bốc bao nhiêu viên sỏi tuỳ ý từ một đống, và ai không còn nước đi thì thua. Một thế cờ là thua với người sắp đi đúng khi XOR các kích thước đống bằng 0, nên em thắng được nếu luôn đi sao cho XOR về 0. Định lí Sprague-Grundy mở rộng điều này cho mọi trò chơi công bằng (impartial game): gán cho mỗi đống số Grundy của nó, tức giá trị nhỏ nhất không đạt được sau một nước đi, rồi XOR các số đó thay cho kích thước đống.',
  summary:
    'Tính số Grundy bằng mex, XOR chúng qua các đống, rồi chơi Nim hoặc trò bốc sỏi có giới hạn với một máy luôn tìm ra nước thắng.',
  instruction:
    'Nhập các đống và chọn luật, rồi chạy từng bước qua các số Grundy g(0), g(1), … và XOR của các đống. Bên dưới, hãy chơi với máy: bấm vào một viên sỏi để bốc nó cùng mọi viên bên phải nó, hoặc chọn một đống và số viên. Theo dõi hàng XOR: nước đi làm nó về 0 là nước thắng.',
  fields: { piles: 'Các đống', rule: 'Luật', moves: 'Số viên được bốc S' },
  rules: { nim: 'Nim: bốc bao nhiêu cũng được', subtraction: 'Bốc một số trong S' },
  presetLabel: 'Ví dụ',
  presets: {
    classic: 'Nim 3, 4, 5',
    balanced: 'Nim 1, 2, 3 (thua)',
    subtraction: 'Bốc 1, 3 hoặc 4',
    big: 'Nim, năm đống',
  },
  /** @param {number} minP @param {number} maxP @param {number} max */
  pilesError: (minP, maxP, max) =>
    `Hãy nhập từ ${minP} đến ${maxP} kích thước đống trong khoảng 0 đến ${max}, ngăn cách bằng dấu phẩy hoặc dấu cách.`,
  /** @param {number} maxM @param {number} max */
  movesError: (maxM, max) =>
    `Hãy nhập từ 1 đến ${maxM} số viên được bốc, khác nhau, trong khoảng 1 đến ${max}, ngăn cách bằng dấu phẩy hoặc dấu cách.`,
  tableTitle: 'Số Grundy g(x)',
  /** @param {(number | null)[]} g */
  tableAria: (g) => `Số Grundy: ${g.map((v, x) => `g(${x}) = ${v ?? 'chưa biết'}`).join(', ')}`,
  unknown: '?',
  pointerX: 'x',
  pointerFrom: 'x − s',
  /** @param {number[]} seen */
  seenText: (seen) => `seen = ${braces(seen)}`,
  markers: { active: '●', compare: '←', done: '' },
  legend: {
    active: '● x, kích thước đang tính',
    compare: '← g(x − s), đạt được khi bốc s viên',
    done: 'Đã tính',
  },
  stats: {
    lookups: 'Số giá trị đã đọc, g(x − s)',
    positions: 'Số kích thước đã tính',
    xor: 'X = XOR các g(h)',
    verdict: 'Người sắp đi',
  },
  verdicts: { win: 'thắng', lose: 'thua', open: '—' },
  /** @param {GrundyFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `${f.piles.length} đống: ${f.piles.join(', ')}. ${f.rule === 'nim' ? 'Mỗi nước đi bốc bao nhiêu viên sỏi cũng được từ một đống.' : `Mỗi nước đi bốc ${f.moves.join(', ')} viên sỏi từ một đống.`} Trước hết tính g(x) với x = 0 đến ${Math.max(...f.piles)}.`;
      case 'position':
        return f.x === 0
          ? 'Một đống 0 viên sỏi không có nước đi nào, nên seen vẫn rỗng.'
          : `Tính g(${f.x}): gom số Grundy của mọi đống đạt được sau một nước đi.`;
      case 'look':
        return `Bốc ${f.take} viên thì còn lại ${f.x - f.take} viên, với g(${f.x - f.take}) = ${f.g[f.x - f.take]}. seen = ${braces(f.seen)}.`;
      case 'mex':
        return `Số tự nhiên nhỏ nhất không thuộc ${braces(f.seen)} là ${f.g[f.x]}, nên g(${f.x}) = ${f.g[f.x]}.${f.g[f.x] === 0 ? ' Mọi nước đi từ đây đều đến một giá trị khác 0: nếu đứng riêng, đây là một đống thua.' : ''}`;
      case 'pile': {
        const h = f.piles[f.pile];
        return `Đống ${f.pile + 1} có ${h} viên sỏi, g(${h}) = ${f.g[h]}. X = X xor ${f.g[h]} = ${f.xor}.`;
      }
      case 'done':
        return f.xor !== 0
          ? `X = ${f.xor} ≠ 0, nên người sắp đi thắng. ${f.wins.length === 1 ? 'Nước thắng' : 'Các nước thắng'}: ${f.wins.map((w) => moveText(w)).join('; ')}.`
          : 'X = 0, nên người sắp đi thua: mọi nước đi đều làm X khác 0, và người kia luôn đưa được X về 0.';
    }
  },

  gameTitle: 'Chơi với máy',
  /** @param {number} i @param {number} h @param {number} g */
  pileLabel: (i, h, g) => `Đống ${i + 1}: ${h} viên sỏi, g = ${g}`,
  /** @param {number} i @param {number} take */
  stoneAria: (i, take) => `Bốc ${take} viên sỏi từ đống ${i + 1}`,
  bitsHead: ['Đống', 'h', 'g(h)', 'g(h) ở hệ nhị phân'],
  xorRow: 'XOR',
  /** @param {number} x */
  xorAria: (x) => `XOR các số Grundy: ${x}`,
  pileField: 'Đống',
  /** @param {number} i */
  pileOption: (i) => `Đống ${i + 1}`,
  takeField: 'Bốc',
  takeButton: 'Bốc',
  hintButton: 'Xem nước thắng',
  restart: 'Chơi lại',
  /** @param {number} x */
  yourTurn: (x) =>
    x !== 0
      ? `Đến lượt em. X = ${x} ≠ 0, nên em có thể thắng: hãy tìm nước đi làm X = 0.`
      : 'Đến lượt em. X = 0, nên mọi nước đi đều để lại X ≠ 0, và máy luôn tìm ra nước đáp trả thắng.',
  noMoves:
    'Không đống nào còn nước đi hợp lệ, nên em, người sắp đi, thua. Hãy đổi các đống hoặc chơi lại.',
  /** @param {{ pile: number, take: number }[]} wins */
  hint: (wins) =>
    wins.length
      ? `${wins.length === 1 ? 'Nước thắng' : 'Các nước thắng'}: ${wins.map((w) => moveText(w)).join('; ')}.`
      : 'Từ đây không có nước nào thắng: X đã bằng 0, nên em bốc thế nào thì máy cũng đưa được X về 0.',
  /** @param {{ pile: number, take: number }} you @param {{ pile: number, take: number }} it @param {number} x */
  reply: (you, it, x) =>
    `Em ${moveText(you)}. Máy ${moveText(it)}. ${x !== 0 ? `X = ${x} ≠ 0, nên em vẫn có thể thắng.` : 'X = 0, nên nếu chơi tốt nhất thì máy thắng từ đây.'}`,
  /** @param {{ pile: number, take: number }} you */
  youWin: (you) => `Em ${moveText(you)}, và máy hết nước đi. Em thắng rồi!`,
  /** @param {{ pile: number, take: number }} you @param {{ pile: number, take: number }} it */
  youLose: (you, it) => `Em ${moveText(you)}. Máy ${moveText(it)} và em hết nước đi. Máy thắng.`,
  /** @param {number} i @param {number[]} takes */
  illegal: (i, takes) =>
    takes.length
      ? `Từ đống ${i + 1}, em được bốc ${takes.join(', ')} viên sỏi.`
      : `Đống ${i + 1} không có nước đi hợp lệ.`,
  /** @param {number} max */
  takeError: (max) => `Hãy bốc một số nguyên viên sỏi từ 1 đến ${max}.`,
  over: 'Ván đã kết thúc. Hãy chơi lại để chơi tiếp.',

  takeaways: [
    'Theo luật chơi thường, một thế là thua (thế P) khi mọi nước đi đều dẫn đến một thế thắng, và là thắng (thế N) khi có một nước đi dẫn đến một thế thua. Thế không còn nước đi nào là thế thua.',
    'Số Grundy g(x) = mex{ g(y) : y đạt được từ x }, trong đó mex là số tự nhiên nhỏ nhất vắng mặt trong tập. g = 0 đúng tại các thế thua.',
    'Định lí Sprague-Grundy: tổng của các trò chơi độc lập có giá trị bằng XOR các số Grundy của chúng. Người sắp đi thắng đúng khi X ≠ 0, bằng cách đưa một đống từ g(h) về g(h) xor X.',
    'Trong Nim, g(h) = h, nên phép thử chính là XOR các kích thước đống. Trong trò “bốc 1, 3 hoặc 4”, các giá trị lặp lại 0 1 0 1 2 3 2 với chu kì 7.',
    'Thử “Nim 1, 2, 3 (thua)”: em đi trước với X = 0, và dù làm gì thì máy cũng đưa X về 0 rồi thắng.',
  ],
  complexityHead: ['Việc', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Số Grundy g(0) … g(N)',
      'O(N · |S|)',
      'Mỗi kích thước đọc g(x − s) với mọi số viên được bốc, rồi tìm mex trong O(|S|).',
    ],
    ['Số Grundy trong Nim', 'O(N²) theo bảng, O(1) nhờ g(h) = h', 'Một đống x viên có x nước đi.'],
    ['Ai thắng, k đống', 'O(k)', 'Mỗi đống một phép XOR khi đã biết các giá trị g.'],
    [
      'Một nước thắng',
      'O(k · |S|)',
      'Thử mỗi số viên được bốc trên mỗi đống và tìm g = g(h) xor X.',
    ],
    ['Bộ nhớ', 'O(N)', 'Bảng các giá trị g.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Trong Nim với các đống 3, 4 và 5, X, tức XOR các kích thước đống, bằng bao nhiêu?',
      answer: 2,
      hints: ['Ở hệ nhị phân: 011, 100 và 101. XOR từng cột.'],
      solution: '011 xor 100 = 111, và 111 xor 101 = 010, nên X = 2 và người sắp đi thắng.',
    },
    {
      type: 'number',
      prompt: 'Vẫn với Nim 3, 4, 5: cần bốc bao nhiêu viên từ đống 3 viên để còn lại X = 0?',
      answer: 2,
      unit: 'viên',
      hints: ['Đưa đống 3 viên về 3 xor X viên.'],
      solution: '3 xor 2 = 1, nên để lại 1 viên: bốc 2. Khi đó 1 xor 4 xor 5 = 0.',
    },
    {
      type: 'choice',
      prompt: 'Nim với các đống 1, 2 và 3, và đến lượt em. Nếu hai bên chơi tốt nhất thì sao?',
      options: [
        'Em thắng, bằng cách bốc hết đống 3 viên',
        'Em thua: X = 0, nên nước đi nào cũng trao chiến thắng cho đối thủ',
        'Em thắng, bằng cách bốc 1 viên từ đống 2 viên',
        'Ván hoà',
      ],
      answer: 1,
      hints: ['Tính 1 xor 2 xor 3.'],
      solution:
        '1 xor 2 xor 3 = 0, một thế thua cho người sắp đi. Nim không có hoà: luôn có người bốc viên sỏi cuối cùng.',
    },
    {
      type: 'number',
      prompt:
        'Trong trò mà mỗi nước đi bốc 1, 3 hoặc 4 viên, g(5) bằng bao nhiêu? Dùng ví dụ “Bốc 1, 3 hoặc 4” để kiểm tra.',
      answer: 3,
      hints: ['Từ 5 ta đến 4, 2 và 1, với các giá trị g là 2, 0 và 1.'],
      solution: 'seen = { 2, 0, 1 }, và số tự nhiên nhỏ nhất còn thiếu là 3, nên g(5) = 3.',
    },
    {
      type: 'multi',
      prompt:
        'Cũng trong trò “bốc 1, 3 hoặc 4” với một đống, những kích thước ban đầu nào làm người sắp đi thua?',
      options: ['2', '3', '6', '7', '9'],
      answers: [0, 3, 4],
      hints: ['Một đống đơn lẻ thua đúng khi g(h) = 0. Chạy đến cuối bảng của ví dụ.'],
      solution:
        'g chạy 0 1 0 1 2 3 2 0 1 0 … với h = 0, 1, 2, …, nên g = 0 tại 2, 7 và 9, còn g(3) = 1 và g(6) = 2.',
    },
  ],
  nextTeaser:
    'Tiếp theo là bài luyện tập: bài toán đại số và ngẫu nhiên, nơi em tự dựng ma trận cho một hệ thức truy hồi và nhân số lớn bằng tích chập.',
};
