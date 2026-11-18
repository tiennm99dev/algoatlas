/** @typedef {import('$lib/algo-engine/sets-maps-counting.js').CountFrame} CountFrame */
/** @typedef {import('$lib/algo-engine/sets-maps-counting.js').CountMode} CountMode */

/** @param {string} w */
const q = (w) => `“${w}”`;

/** @param {string[]} words */
const listWords = (words) =>
  words.length <= 1
    ? words.map(q).join('')
    : `${words.slice(0, -1).map(q).join(', ')} và ${q(words[words.length - 1])}`;

export const vi = {
  slug: 'sets-maps-counting',
  topic: 'structures',
  level: 'Cơ bản',
  title: 'Tập hợp, ánh xạ và đếm tần suất',
  intro:
    'Phần lớn chương trình dùng bảng băm qua hai giao diện. Tập hợp (set) trả lời câu hỏi “x có ở đây không?”; ánh xạ (map) lưu một giá trị cho mỗi khoá, chẳng hạn một từ đã xuất hiện bao nhiêu lần. Cả hai đều tốn trung bình O(1) cho mỗi thao tác, nên chỉ một lượt duyệt qua dòng n từ là đếm xong tất cả trong O(n).',
  summary:
    'Cho một dòng từ chảy vào một ánh xạ băm để đếm và một tập hợp băm để phát hiện từ lặp lại, rồi so sánh một lần tra bảng băm cho mỗi từ với việc quét một danh sách.',
  instruction:
    'Gõ vài từ hoặc chọn một bộ mẫu, chọn Ánh xạ hoặc Tập hợp, rồi đi từng bước qua dòng từ. Mỗi từ được tra đúng một lần: ánh xạ tăng số đếm của nó, tập hợp báo nó là từ lặp lại. Quan sát danh sách tần suất được sắp xếp lại khi số đếm thay đổi, và so sánh số lần tra bảng băm với số phép so sánh mà một danh sách thường cần.',
  takeaways: [
    'Tập hợp lưu mỗi khoá đúng một lần và trả lời câu hỏi “có thuộc không”: thêm, xoá và kiểm tra đều tốn trung bình O(1).',
    'Ánh xạ lưu một giá trị cho mỗi khoá. Đếm tần suất là ứng dụng kinh điển: count[w] = count[w] + 1 nếu w đã là khoá, ngược lại count[w] = 1.',
    'Một lượt duyệt với ánh xạ băm đếm n từ trong trung bình O(n). Một danh sách các từ khác nhau quét từ đầu tốn tới d phép so sánh cho mỗi từ, tổng cộng O(n · d).',
    'Bảng băm không giữ thứ tự: muốn liệt kê từ theo tần suất, hãy sắp xếp d mục sau khi đếm xong, tốn O(d log d).',
    'Nạp bộ “Ăn quả nhớ kẻ trồng cây” ở chế độ Tập hợp và tìm từ đầu tiên bị lặp lại, rồi chuyển sang Ánh xạ để xem những từ nào cùng có số đếm cao nhất.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'contains, add (tập hợp)',
      'O(1)',
      'Trung bình: băm một lần rồi đi một chuỗi ngắn hoặc một dải dò ngắn.',
    ],
    [
      'get, put (ánh xạ)',
      'O(1)',
      'Trung bình: cùng một phép tra cứu, có thêm giá trị cất cạnh khoá.',
    ],
    ['Đếm n từ', 'O(n)', 'Trung bình: một lần tra và một lần ghi cho mỗi từ.'],
    ['Làm bằng danh sách', 'O(n · d)', 'Mỗi từ có thể phải so sánh với cả d từ khác nhau.'],
    ['Bộ nhớ', 'O(d)', 'Một mục cho mỗi từ khác nhau.'],
  ],
  nextTeaser:
    'Bài tiếp theo, Luyện tập: bài toán về băm, dùng ánh xạ băm để giải bài tổng hai số và gom nhóm các từ đảo chữ chỉ trong một lượt duyệt.',

  modeLabel: 'Cấu trúc',
  modes: { map: 'Ánh xạ (đếm)', set: 'Tập hợp (đã gặp)' },
  presetLabel: 'Bộ mẫu',
  presetPlaceholder: 'Nạp một bộ mẫu…',
  presets: {
    'lua-nep': 'Lúa nếp là lúa nếp làng',
    'an-qua': 'Ăn quả nhớ kẻ trồng cây',
    'noi-dong': 'Nồi đồng nấu ốc',
  },
  wordsLabel: 'Các từ',
  wordErrors: {
    empty: 'Hãy gõ ít nhất một từ gồm các chữ cái.',
    count: 'Chỉ dùng tối đa 40 từ.',
    length: 'Mỗi từ chỉ được có tối đa 12 chữ cái.',
  },
  streamTitle: 'Dòng từ',
  streamStates: {
    active: 'đang đọc, từ mới',
    sorted: 'đang đọc, đã gặp trước đó',
    done: 'đã đọc',
  },
  mapTitle: 'count, sắp theo tần suất',
  setTitle: 'seen, theo thứ tự được thêm',
  emptyMap: 'rỗng',
  /** @param {string} word @param {number} c */
  entryLabel: (word, c) => `${word}: ${c}`,
  stats: {
    distinct: 'Số từ khác nhau',
    lookups: 'Số lần tra bảng băm',
    listCompares: 'Số phép so sánh khi quét danh sách',
    repeats: 'Số từ lặp lại',
    firstRepeat: 'Từ lặp lại đầu tiên',
  },
  none: '–',
  legend: {
    active: 'Khoá mới, vừa thêm',
    sorted: 'Khoá đã có, tìm thấy',
    visited: 'Từ đã đọc',
  },
  marks: { active: '+', sorted: '✓' },

  /** @param {CountFrame} f @param {CountMode} mode */
  describe(f, mode) {
    const w = q(f.word);
    const d = f.entries.length;
    switch (f.kind) {
      case 'start':
        return mode === 'map'
          ? 'Ánh xạ count đang rỗng. Mỗi từ sẽ tốn một lần tra bảng băm.'
          : 'Tập hợp seen đang rỗng. Mỗi từ sẽ tốn một lần tra bảng băm.';
      case 'read':
        return `Đọc ${w}, từ thứ ${f.index + 1}. Nó ${mode === 'map' ? 'đã là khoá của count' : 'đã có trong seen'} chưa?`;
      case 'hit': {
        const c = f.entries.find((e) => e.word === f.word)?.count ?? 0;
        if (mode === 'map') return `Rồi: count[${w}] tăng từ ${c - 1} lên ${c}.`;
        return f.firstRepeat === f.word && f.repeats === 1
          ? `Rồi: ${w} đã có trong seen. Đây là từ lặp lại đầu tiên.`
          : `Rồi: ${w} đã có trong seen, nên nó là từ lặp lại.`;
      }
      case 'miss':
        return mode === 'map'
          ? `Chưa: thêm ${w} với số đếm 1. Ánh xạ giờ có ${d} khoá.`
          : `Chưa: thêm ${w} vào seen. Tập hợp giờ có ${d} từ.`;
      case 'done': {
        if (d === 0) return 'Dòng từ đang rỗng.';
        if (mode === 'set')
          return `Xong. Có ${d} từ khác nhau trong ${f.lookups} từ; ${f.repeats} từ là từ lặp lại.`;
        const top = f.entries[0].count;
        const best = f.entries.filter((e) => e.count === top).map((e) => e.word);
        const each = best.length > 1 ? 'mỗi từ ' : '';
        return `Xong. ${f.lookups} từ, ${d} từ khác nhau. Xuất hiện nhiều nhất: ${listWords(best)}, ${each}${top} lần.`;
      }
    }
  },

  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Câu “lúa nếp là lúa nếp làng lúa lên lớp lớp lòng nàng lâng lâng” có bao nhiêu từ khác nhau?',
      answer: 9,
      unit: 'từ',
      hints: ['“lúa” xuất hiện 3 lần; “nếp”, “lớp” và “lâng” mỗi từ 2 lần.'],
      solution:
        '14 từ gồm lúa, nếp, là, làng, lên, lớp, lòng, nàng và lâng: 9 từ khác nhau, nên 5 trong 14 từ là từ lặp lại. Nạp bộ “Lúa nếp là lúa nếp làng” để kiểm tra.',
    },
    {
      type: 'text',
      prompt:
        'Đọc câu “ăn quả nhớ kẻ trồng cây ăn khoai nhớ kẻ cho dây mà trồng” từ trái sang, từ nào là từ đầu tiên đã có sẵn trong tập hợp lúc được đọc?',
      accept: ['ăn', '“ăn”', '"ăn"'],
      hints: ['Sáu từ đầu tiên đều khác nhau.'],
      solution:
        'ăn, quả, nhớ, kẻ, trồng và cây đều là từ mới. Từ thứ bảy, “ăn”, đã có trong tập hợp: đó là từ lặp lại đầu tiên. Nạp bộ “Ăn quả nhớ kẻ trồng cây” ở chế độ Tập hợp để xem.',
    },
    {
      type: 'number',
      prompt:
        'Với câu “nồi đồng nấu ốc nồi đất nấu ếch”, một danh sách các từ khác nhau quét từ đầu sẽ thực hiện tổng cộng bao nhiêu phép so sánh? (Một từ mới được so sánh với mọi từ trong danh sách; một từ đã biết dừng lại ở vị trí của nó.)',
      answer: 19,
      unit: 'phép so sánh',
      hints: [
        'Sáu từ mới lần lượt tốn 0, 1, 2, 3, 4 và 5 phép so sánh.',
        '“nồi” lần hai được tìm thấy ở vị trí 1, còn “nấu” lần hai ở vị trí 3.',
      ],
      solution:
        'Các từ mới: 0 + 1 + 2 + 3 + 4 + 5 = 15. Các từ lặp lại: 1 cho “nồi” và 3 cho “nấu”. Tổng là 19, so với chỉ 8 lần tra bảng băm. Nạp bộ “Nồi đồng nấu ốc” để kiểm tra.',
    },
    {
      type: 'number',
      prompt:
        'Trong câu “ăn quả nhớ kẻ trồng cây…”, có bao nhiêu từ khác nhau cùng có số đếm cao nhất?',
      answer: 4,
      unit: 'từ',
      hints: ['Không từ nào xuất hiện ba lần.'],
      solution:
        'ăn, nhớ, kẻ và trồng mỗi từ xuất hiện hai lần; mọi từ khác chỉ một lần. Vậy có 4 từ cùng đạt số đếm cao nhất là 2.',
    },
    {
      type: 'choice',
      prompt:
        'Một máy chủ phải từ chối mọi yêu cầu có mã số đã xử lí rồi, ngoài ra không cần gì thêm. Cấu trúc nào hợp nhất?',
      options: [
        'Một tập hợp băm chứa các mã đã xử lí',
        'Một ánh xạ băm từ mã sang số đếm',
        'Một danh sách mã đã sắp xếp',
      ],
      answer: 0,
      hints: ['Câu hỏi duy nhất cần trả lời là “mã này đã gặp chưa?”'],
      solution:
        'Chỉ cần kiểm tra có thuộc hay không, nên một tập hợp là đủ: kiểm tra và thêm đều tốn trung bình O(1). Ánh xạ sẽ lưu một giá trị chẳng ai đọc, còn danh sách đã sắp xếp cần O(log n) cho mỗi lần tìm và O(n) cho mỗi lần chèn.',
    },
  ],
};
