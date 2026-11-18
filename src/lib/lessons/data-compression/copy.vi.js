/** @typedef {import('$lib/algo-engine/data-compression.js').CompressionFrame} CompressionFrame */
import { lettersOf } from '$lib/algo-engine/data-compression.js';

export const vi = {
  slug: 'data-compression',
  topic: 'string-algorithms',
  level: 'Trung bình',
  title: 'Nén dữ liệu: mã loạt dài, Huffman và LZW',
  intro:
    'Văn bản nén được vì nó lặp lại, nhưng có nhiều kiểu lặp lại. Mã hoá loạt dài (run-length encoding) gộp một chữ cái lặp liền nhau, mã Huffman cho chữ cái hay gặp một mã ngắn, còn LZW dựng một từ điển các xâu đã gặp. Chạy cả ba trên cùng một văn bản cho thấy mỗi cách nhìn thấy gì và bỏ sót gì.',
  summary:
    'Nén một văn bản bằng mã hoá loạt dài, mã Huffman và LZW song song, và xem số bit cùng từ điển lớn dần.',
  instruction:
    'Gõ một văn bản và chạy từng bước. Đầu tiên cây Huffman được dựng từ số lần xuất hiện của các chữ cái. Sau đó mỗi chữ cái đi qua cả ba bộ nén cùng lúc, và các thanh cho thấy số bit mỗi cách đã dùng. Hãy thử văn bản có loạt dài, rồi văn bản lặp lại mà không có loạt, và xem thanh nào ngắn nhất.',
  textLabel: 'Văn bản',
  presetLabel: 'Ví dụ',
  presets: {
    runs: 'Loạt dài',
    skewed: 'Chữ cái không đều',
    repeats: 'Lặp lại, không có loạt',
    classic: 'to be or not to be',
    flat: 'Mọi chữ cái đều khác nhau',
  },
  /** @param {number} max */
  fieldErrors: (max) => ({
    empty: 'Hãy gõ ít nhất một chữ cái.',
    format: 'Chỉ dùng chữ cái a đến z, không có dấu cách.',
    length: `Văn bản dài tối đa ${max} chữ cái.`,
  }),
  textTitle: 'Văn bản',
  textAria: 'Văn bản đang được nén, từng chữ cái một.',
  textMarker: '↓',
  /** @param {number} i @param {string} c @param {string} state */
  textCell: (i, c, state) => `Chữ cái ${i}: ${c}${state ? `, ${state}` : ''}`,
  textStates: { now: 'đang đọc', past: 'đã đọc' },
  barsTitle: 'Số bit đã dùng đến giờ',
  bars: {
    raw: 'Không nén, 8 bit mỗi chữ cái',
    run: 'Loạt dài, 16 bit mỗi loạt',
    huff: 'Huffman, theo độ dài mã',
    lzw: 'LZW, 9 bit mỗi mã',
  },
  /** @param {number} n */
  bitsValue: (n) => `${n} bit`,
  runTitle: 'Mã hoá loạt dài',
  runNote: 'Mỗi loạt tốn một chữ cái và một số đếm: 8 + 8 bit.',
  runChips: 'Các loạt đã ghi, dạng chữ cái × số lần',
  runEmpty: 'chưa có',
  /** @param {import('$lib/algo-engine/data-compression.js').LetterRun} r */
  runChip: (r) => `${r.letter} × ${r.count}`,
  /** @param {import('$lib/algo-engine/data-compression.js').LetterRun | null} r */
  openRun: (r) => (r ? `Loạt đang mở: ${r.letter} × ${r.count}` : 'Không có loạt đang mở'),
  huffTitle: 'Mã Huffman',
  huffNote:
    'Số dưới mỗi nút là số lần xuất hiện của nó. Cạnh trái là 0 và cạnh phải là 1. Chi phí gửi bảng mã không được tính.',
  /** @param {string} letter @param {string} code */
  huffChip: (letter, code) => `${letter} = ${code}`,
  huffChips: 'Các mã',
  huffEmpty: 'chưa có cho đến khi dựng xong cây',
  streamTitle: 'Dòng bit',
  streamEmpty: 'chưa ghi gì',
  treeAria: 'Rừng Huffman đang gộp dần thành một cây.',
  /** @param {string} label @param {string} note @param {string} state */
  treeNode: (label, note, state) =>
    `${label || 'Cây đã gộp'}, số lần ${note}${state ? `, ${state}` : ''}`,
  treeStates: { merged: 'vừa gộp' },
  treeMarker: '★',
  treeLegend: '★ Vừa gộp',
  lzwTitle: 'LZW',
  lzwNote:
    'Từ điển bắt đầu với đủ 256 kí tự đơn, mã từ 0 đến 255, và thêm một mục sau mỗi mã được ghi ra, trừ mã cuối cùng. Bộ giải mã tự dựng lại từ điển, nên không bao giờ phải gửi nó.',
  /** @param {string} w */
  lzwCurrent: (w) => (w ? `Xâu w đang lớn dần: ${w}` : 'Xâu w đang rỗng'),
  lzwOutput: 'Các mã đã ghi',
  lzwOutputEmpty: 'chưa có',
  /** @param {import('$lib/algo-engine/data-compression.js').LzwEntry} e */
  lzwChip: (e) => `${e.code} (${e.text})`,
  lzwDict: 'Các mục đã thêm vào từ điển',
  lzwDictEmpty: 'chưa có',
  /** @param {import('$lib/algo-engine/data-compression.js').LzwEntry} e */
  dictChip: (e) => `${e.code} = ${e.text}`,
  /** @param {CompressionFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return 'Huffman cần biết số lần xuất hiện của các chữ cái trước khi ghi được gì, nên ta dựng cây của nó trước. Ban đầu mỗi chữ cái là một cây riêng.';
      case 'merge': {
        const made = f.forest.find((t) => t.id === f.merged);
        return made
          ? `Gộp hai cây nhẹ nhất thành ${lettersOf(made)}, với số lần ${made.weight}.`
          : '';
      }
      case 'codes':
        return 'Chỉ còn một cây. Mã của mỗi chữ cái là đường đi từ gốc đến nó, nên chữ cái hay gặp nằm gần gốc sẽ có mã ngắn.';
      case 'ready':
        return 'Giờ đọc văn bản, từng chữ cái một, qua cả ba bộ nén.';
      case 'read': {
        const c = f.text[f.i];
        const run = f.runEmitted
          ? `Loạt dài đóng một loạt và mở loạt mới cho ${c}.`
          : f.i === 0
            ? `Loạt dài mở một loạt ${c}.`
            : `Loạt dài kéo dài loạt ${c}.`;
        const code = `Huffman ghi ${f.codes[c]}.`;
        const last = f.dictionary.at(-1);
        const lzw =
          f.codeEmitted && last
            ? `LZW ghi ${f.output.at(-1)?.code}, thêm ${last.text} với mã ${last.code}, rồi bắt đầu lại từ ${c}.`
            : `LZW đã biết ${f.w}, nên tiếp tục mở rộng.`;
        return `${c}: ${run} ${code} ${lzw}`;
      }
      case 'flush':
        return 'Văn bản đã hết. Loạt dài ghi loạt đang mở, còn LZW ghi mã của w.';
      case 'done':
        return `Xong. Không nén ${f.rawBits} bit, loạt dài ${f.runBits}, Huffman ${f.huffBits}, LZW ${f.lzwBits}, với ${f.dictionary.length} mục đã thêm vào từ điển.`;
    }
  },
  takeaways: [
    'Mã hoá loạt dài lưu (chữ cái, số lần). Nó rất tốt với các loạt dài, và làm văn bản không có loạt nào phình gấp đôi.',
    'Mã Huffman cho mỗi chữ cái một mã phi tiền tố theo tần suất: không mã nào là phần đầu của mã khác, nên giải mã dòng bit không cần dấu ngăn cách.',
    'LZW ghi mã của xâu dài nhất mà nó biết, rồi thêm xâu đó nối với chữ cái kế tiếp vào từ điển. Từ điển lớn dần theo văn bản.',
    'Bộ giải mã LZW dựng lại đúng từ điển đó chỉ từ các mã, nên không phải gửi thêm gì.',
    'Thử “Lặp lại, không có loạt” và “Mọi chữ cái đều khác nhau”: Huffman chỉ thấy số lần xuất hiện của chữ cái, còn LZW thấy cả các xâu lặp lại, và khi không có gì lặp thì LZW còn tốn hơn không nén.',
  ],
  complexityHead: ['Cách nén', 'Chi phí', 'Vì sao'],
  complexity: [
    ['Mã hoá loạt dài', 'O(n)', 'Một lượt, so mỗi chữ cái với chữ cái ngay trước.'],
    [
      'Mã Huffman',
      'O(n + k log k)',
      'Đếm n chữ cái, gộp k − 1 lần bằng một heap gồm k cây, rồi mỗi chữ cái tra bảng một lần.',
    ],
    [
      'LZW',
      'O(n)',
      'Mỗi chữ cái tra từ điển một lần, trong thời gian hằng số kì vọng khi từ điển là hash table (bảng băm) hoặc trie.',
    ],
    ['Bộ nhớ', 'O(k) hoặc O(n)', 'Một bảng k chữ cái cho Huffman; tối đa n mục cho LZW.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Với 16 bit mỗi loạt, mã hoá loạt dài dùng bao nhiêu bit cho aaabbc?',
      answer: 48,
      unit: 'bit',
      hints: ['Đếm số loạt trước.'],
      solution: 'Có ba loạt, a × 3, b × 2 và c × 1, nên 3 × 16 = 48 bit.',
    },
    {
      type: 'number',
      prompt: 'Không tính bảng mã, mã Huffman dùng bao nhiêu bit cho aabbbcccc?',
      answer: 14,
      unit: 'bit',
      hints: ['Gộp a (2) với b (3) trước. Rồi c (4) gộp với chúng.'],
      solution:
        'c có mã 1 bit; a và b mỗi chữ có mã 2 bit. Tổng là 4 × 1 + 2 × 2 + 3 × 2 = 14 bit.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao một dòng bit Huffman giải mã được mà không cần dấu ngăn cách?',
      options: [
        'Mọi mã đều có cùng độ dài.',
        'Không mã nào là phần đầu của mã khác, nên một mã kết thúc ngay khi nó đủ.',
        'Bộ giải mã đọc từ phần đầu tệp xem mỗi chữ cái cần bao nhiêu bit.',
      ],
      answer: 1,
      hints: ['Nghĩ về việc đi trên cây từ gốc, từng bit một.'],
      solution:
        'Mã là phi tiền tố: chữ cái chỉ nằm ở lá, nên tới một lá là chắc chắn hết mã, và bit tiếp theo lại bắt đầu từ gốc.',
    },
    {
      type: 'number',
      prompt: 'LZW ghi ra bao nhiêu mã cho abab?',
      answer: 3,
      unit: 'mã',
      hints: ['Gõ abab vào phần tương tác rồi chạy từng bước.'],
      solution:
        'Nó ghi a và thêm ab, ghi b và thêm ba, rồi mở rộng thành ab có trong từ điển và ghi nó ở cuối: ba mã.',
    },
    {
      type: 'number',
      prompt: 'Với 9 bit mỗi mã, LZW dùng bao nhiêu bit cho abababab?',
      answer: 45,
      unit: 'bit',
      hints: ['Lần theo các mã: a, b, ab, aba, rồi chữ b cuối.'],
      solution:
        'Nó ghi a, b, ab, aba và b. Đó là 5 mã, nên 5 × 9 = 45 bit, so với 64 bit khi không nén.',
    },
    {
      type: 'choice',
      prompt: 'Với abcdefgh, mọi chữ cái đều khác nhau, cách nào tốn nhiều bit nhất?',
      options: ['Loạt dài', 'Huffman', 'LZW'],
      answer: 0,
      hints: ['Mỗi chữ cái là một loạt riêng.'],
      solution:
        'Tám loạt tốn 128 bit. LZW ghi 8 mã, tốn 72 bit, còn Huffman cho mỗi chữ cái 3 bit, tốn 24 bit.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Luyện tập: bài toán xâu, cho em chọn đúng thuật toán so khớp cho từng tình huống.',
};
