/** @typedef {import('$lib/algo-engine/aho-corasick.js').AcFrame} AcFrame */
import { prefixOf } from '$lib/algo-engine/aho-corasick.js';

/** A node by the prefix it stands for. @param {AcFrame} f @param {number} id */
const name = (f, id) => (id === 0 ? 'gốc' : `“${prefixOf(f.nodes, id)}”`);

export const vi = {
  slug: 'aho-corasick',
  topic: 'string-algorithms',
  level: 'Nâng cao',
  title: 'Thuật toán Aho-Corasick',
  intro:
    'Tìm nhiều mẫu lần lượt từng mẫu một thì phải lặp lại công việc cho mọi mẫu. Aho-Corasick đặt tất cả vào một trie và thêm các liên kết thất bại, nên khi không khớp, ta lùi về hậu tố dài nhất vẫn còn trong trie thay vì bắt đầu lại. Khi đó chỉ một lượt qua văn bản là tìm được mọi mẫu, dù có bao nhiêu mẫu đi nữa.',
  summary:
    'Dựng một trie có liên kết thất bại và liên kết đầu ra, rồi tìm nhiều mẫu trong một lượt qua văn bản, không phải quay lui.',
  instruction:
    'Gõ vài mẫu và một văn bản, rồi chạy từng bước. Đầu tiên trie lớn dần, sau đó các liên kết thất bại nét đứt được thêm theo thứ tự BFS (duyệt theo chiều rộng) nhờ một queue (hàng đợi), rồi trạng thái hiện tại đi trên trie khi văn bản được đọc. Khi không khớp, hãy xem nó đi theo một liên kết nét đứt thay vì lùi lại trên văn bản.',
  patternsLabel: 'Các mẫu (cách nhau bằng dấu phẩy hoặc dấu cách)',
  textLabel: 'Văn bản',
  presetLabel: 'Ví dụ',
  linksLegend: 'Liên kết thất bại được vẽ',
  linkModes: { useful: 'Ẩn các liên kết về gốc', all: 'Tất cả' },
  presets: {
    classic: 'he, she, his, hers',
    nested: 'Mẫu nằm trong mẫu',
    chain: 'Chuỗi lùi dài',
    codons: 'Cùng độ dài',
  },
  /** @param {number} words @param {number} len @param {number} text */
  fieldErrors: (words, len, text) => ({
    empty: 'Hãy gõ ít nhất một mẫu.',
    format: 'Chỉ dùng chữ cái a đến z.',
    count: `Dùng tối đa ${words} mẫu.`,
    length: `Mỗi mẫu dài tối đa ${len} chữ cái.`,
    duplicate: 'Mỗi mẫu chỉ được xuất hiện một lần.',
    textEmpty: 'Hãy gõ một văn bản để tìm.',
    textFormat: 'Văn bản chỉ dùng chữ cái a đến z, không có dấu cách.',
    textLength: `Văn bản dài tối đa ${text} chữ cái.`,
  }),
  boardTitle: 'Trie cùng các liên kết',
  /** @param {number} n */
  boardAria: (n) => `Trie gồm ${n} nút, có liên kết thất bại và liên kết đầu ra.`,
  textTitle: 'Văn bản',
  textAria: 'Văn bản đang được tìm, từng kí tự một.',
  boardNote:
    'Mỗi nút ứng với các chữ cái trên đường đi từ gốc đến nó. Nút không có mũi tên nào được vẽ thì liên kết thất bại trỏ về gốc, trừ khi chọn hiện mọi liên kết.',
  linkKinds: {
    tree: 'Cạnh của trie',
    fail: 'Liên kết thất bại, nét đứt',
    out: 'Liên kết đầu ra, nét chấm',
  },
  /** @param {string} prefix @param {string} fail @param {string} role @param {string} word */
  nodeLabel: (prefix, fail, role, word) =>
    `Nút ${prefix || 'gốc'}${word ? `, kết thúc mẫu ${word}` : ''}${fail ? `, thất bại về ${fail}` : ''}${role ? `, ${role}` : ''}`,
  states: {
    active: 'trạng thái hiện tại',
    parent: 'nút u',
    child: 'nút con v',
    chain: 'nút f trên chuỗi thất bại',
    queued: 'trong queue',
    found: 'đã báo',
  },
  markers: { active: '▶', parent: 'u', child: 'v', chain: 'f', queued: 'q', found: '★' },
  legend: {
    active: 'Trạng thái hiện tại hoặc nút mới',
    parent: 'Nút u',
    child: 'Nút con v',
    chain: 'Nút f trên chuỗi',
    queued: 'Trong queue',
    found: 'Mẫu đã báo',
  },
  wordEnd: '◎ Vòng kép: một mẫu kết thúc ở đây',
  textMarkers: { read: '↓', hit: '★' },
  /** @param {number} i @param {string} letter @param {string} state */
  textLabelOf: (i, letter, state) => `Văn bản vị trí ${i}: ${letter}${state ? `, ${state}` : ''}`,
  textStates: { read: 'đang đọc', hit: 'nằm trong lần khớp vừa báo' },
  stats: {
    nodes: 'Số nút của trie',
    state: 'Trạng thái hiện tại',
    edges: 'Quét: số cạnh đã đi',
    hops: 'Quét: số lần nhảy thất bại',
    naive: 'Số lần so sánh của cách tìm trực tiếp',
    matches: 'Số lần khớp tìm được',
  },
  /** @param {AcFrame} f */
  stateValue: (f) => (f.state < 0 ? '—' : f.state === 0 ? 'gốc' : prefixOf(f.nodes, f.state)),
  matchesTitle: 'Các lần khớp, dạng mẫu @ vị trí đầu',
  matchesEmpty: 'chưa có',
  /** @param {{word: string, start: number}} x */
  matchLabel: (x) => `${x.word} @ ${x.start}`,
  queueTitle: 'Queue của BFS',
  queueEmpty: 'rỗng',
  /** @param {AcFrame} f @param {number} id */
  queueLabel: (f, id) => prefixOf(f.nodes, id),
  /** @param {AcFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return 'Bắt đầu với một trie rỗng: chỉ có gốc.';
      case 'insert':
        return `Mẫu ${f.word}: chữ ${f.letter} dẫn đến ${name(f, f.v)}.`;
      case 'mark':
        return `Đánh dấu ${name(f, f.v)}: mẫu ${f.word} kết thúc ở đây.`;
      case 'seed':
        return 'Mọi nút con của gốc đều thất bại về gốc, vì tiền tố một chữ cái không có hậu tố nào ngắn hơn. Chúng được đưa vào queue đầu tiên.';
      case 'visit':
        return `Lấy ${name(f, f.u)} ra khỏi queue. Liên kết thất bại của nó đã biết, nên các nút con của nó có thể dùng.`;
      case 'child':
        return `Nút con ${name(f, f.v)} theo chữ ${f.letter}: bắt đầu tìm ở f = ${name(f, f.f)}, liên kết thất bại của nút cha.`;
      case 'hop':
        return `Ở đó không có cạnh ${f.letter}, nên f đi theo liên kết thất bại của nó đến ${name(f, f.f)}.`;
      case 'link': {
        const target = /** @type {number} */ (f.nodes[f.v].fail);
        const out = f.nodes[f.v].out;
        const outText = out === null ? '' : ` Liên kết đầu ra của nó trỏ đến ${name(f, out)}.`;
        return `${name(f, f.v)} thất bại về ${name(f, target)}, hậu tố thực sự dài nhất của nó có trong trie.${outText}`;
      }
      case 'scan':
        return `Các liên kết đã sẵn sàng. Đọc văn bản ${f.text} bắt đầu từ gốc.`;
      case 'read':
        return `Đọc kí tự ở vị trí ${f.i} của văn bản: ${f.letter}. Trạng thái là ${name(f, f.state)}.`;
      case 'fallback':
        return `Trạng thái cũ không có cạnh ${f.letter}, nên ta đi theo liên kết thất bại của nó đến ${name(f, f.state)}. Vị trí trên văn bản không lùi lại.`;
      case 'advance':
        return `Đi theo cạnh ${f.letter} đến ${name(f, f.state)}.`;
      case 'stay':
        return `Gốc cũng không có cạnh ${f.letter}, nên ở lại gốc và đọc tiếp.`;
      case 'report': {
        const word = /** @type {string} */ (f.nodes[f.v].word);
        return f.viaOut
          ? `Một liên kết đầu ra cho thấy ${word} cũng kết thúc ở đây, tại vị trí ${f.i} của văn bản.`
          : `Mẫu ${word} kết thúc ở đây, tại vị trí ${f.i} của văn bản.`;
      }
      case 'done':
        return `Xong: ${f.matches.length} lần khớp, với ${f.edges} cạnh đã đi và ${f.hops} lần nhảy thất bại trên ${f.text.length} chữ cái.`;
    }
  },
  takeaways: [
    'Một trie chứa tất cả các mẫu, nên các mẫu có chung tiền tố đi chung một đường và một lượt đi kiểm tra chúng cùng lúc.',
    'Liên kết thất bại của một nút trỏ đến hậu tố thực sự dài nhất của tiền tố ứng với nút đó mà cũng có trong trie: phần lớn nhất còn dùng được sau một lần không khớp.',
    'Các liên kết được đặt theo thứ tự BFS, vì liên kết thất bại luôn trỏ đến một nút nông hơn, mà liên kết của nút đó đã được biết.',
    'Liên kết đầu ra trỏ đến mẫu kế tiếp trên chuỗi thất bại, nên một mẫu nằm ẩn trong mẫu khác, như he trong she, cũng được báo.',
    'Thử “Mẫu nằm trong mẫu”, rồi so số lần nhảy thất bại với số lần so sánh của cách tìm trực tiếp trên một văn bản dài hơn do em tự gõ.',
  ],
  complexityHead: ['Phần', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Trie', 'O(L)', 'Một bước cho mỗi chữ cái của mọi mẫu, tổng cộng L.'],
    [
      'Liên kết thất bại và đầu ra',
      'O(L)',
      'Dọc theo mỗi mẫu, độ sâu của f giảm ít nhất một sau mỗi lần nhảy và tăng nhiều nhất một sau mỗi chữ cái, với bảng chữ cái cố định.',
    ],
    [
      'Tìm kiếm',
      'O(n + z)',
      'Độ sâu tăng tối đa một lần cho mỗi kí tự văn bản và mỗi lần nhảy làm nó giảm, nên tổng số lần nhảy không quá n. Mỗi lần khớp trong z lần tốn một bước đầu ra.',
    ],
    [
      'Tìm riêng từng mẫu',
      'O(kn + L)',
      'Chạy KMP cho từng mẫu thì phải đọc lại cả văn bản k lần; Aho-Corasick chỉ đọc một lần.',
    ],
    ['Bộ nhớ', 'O(L)', 'Một nút cho mỗi tiền tố khác nhau, cùng các cạnh và hai liên kết của nó.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'he, she, his và hers cần bao nhiêu nút trie, tính cả gốc?',
      answer: 10,
      unit: 'nút',
      hints: [
        'Đếm các tiền tố khác nhau: he và hers đi chung một đường, he và his chung nhau đến h.',
      ],
      solution:
        'Các tiền tố là h, he, her, hers, hi, his, s, sh và she: chín tiền tố, thêm gốc là mười.',
    },
    {
      type: 'text',
      prompt:
        'Trong trie của he, she, his và hers, liên kết thất bại của she trỏ đến đâu? Hãy gõ tiền tố đó.',
      accept: ['he'],
      hints: ['Liệt kê các hậu tố thực sự của she, dài nhất trước, rồi tra từng cái trong trie.'],
      solution:
        'Các hậu tố thực sự là he và e. Hậu tố dài nhất có trong trie là he, nên she thất bại về he.',
    },
    {
      type: 'number',
      prompt: 'Tìm he, she, his và hers trong ushers. Có bao nhiêu lần khớp được báo?',
      answer: 3,
      unit: 'lần',
      hints: ['Đổi văn bản của ví dụ kinh điển thành ushers rồi đọc bước cuối.'],
      solution:
        'she kết thúc ở vị trí 3, và he cũng kết thúc ở đó nhờ một liên kết đầu ra. hers kết thúc ở vị trí 5.',
    },
    {
      type: 'number',
      prompt:
        'Tìm a, aa và aaa trong aaaa. Có bao nhiêu lần khớp được báo, tính cả các lần chồng nhau?',
      answer: 9,
      unit: 'lần',
      hints: ['Đếm riêng số lần xuất hiện của từng mẫu.'],
      solution: 'a xuất hiện 4 lần, aa 3 lần và aaa 2 lần: 4 + 3 + 2 = 9.',
    },
    {
      type: 'number',
      prompt:
        'Với các mẫu abcd, bc, c và bcx, đọc văn bản abcx. Lượt quét nhảy thất bại bao nhiêu lần?',
      answer: 1,
      unit: 'lần',
      hints: [
        'Sau abc, chữ tiếp theo là x. abc có cạnh x không? Còn nút mà nó thất bại về thì sao?',
      ],
      solution:
        'abc không có cạnh x, nên nó đi theo liên kết thất bại đến bc. bc có cạnh x (từ bcx), nên một lần nhảy là đủ.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Mảng hậu tố và LCP, sắp xếp mọi hậu tố của một xâu và đo phần chung giữa các hậu tố kề nhau.',
};
