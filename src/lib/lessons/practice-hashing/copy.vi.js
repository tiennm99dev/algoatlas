/** @typedef {import('$lib/algo-engine/practice-hashing.js').HashPracticeFrame} HashPracticeFrame */

/** @param {string} w */
const q = (w) => `“${w}”`;

/** @param {number} v Signed numbers use a true minus sign. */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

export const vi = {
  slug: 'practice-hashing',
  topic: 'structures',
  level: 'Trung bình',
  title: 'Luyện tập: bài toán về hash',
  intro:
    'Hai bài toán kinh điển mà một ánh xạ dùng hash (băm) giải được chỉ trong một lượt duyệt. Bài tổng hai số (two-sum) hỏi hai số có tổng bằng một giá trị đích: thay vì thử mọi cặp, ta nhớ từng số đã đi qua và hỏi xem số còn lại của cặp đã có chưa. Bài gom nhóm từ đảo chữ (anagram) cho mỗi từ một khoá là “các chữ cái của nó, đã sắp xếp”, nên những từ có cùng bộ chữ cái rơi vào cùng một danh sách.',
  summary:
    'Chạy bài tổng hai số và bài gom nhóm từ đảo chữ trên đầu vào của em, xem ánh xạ hash sau mỗi bước, rồi dùng trình chạy để trả lời các câu hỏi.',
  instruction:
    'Chọn một bài toán, gõ đầu vào hoặc nạp một bộ mẫu, rồi đi từng bước. Khung ánh xạ hiện mọi mục sau mỗi bước, mục đang được đọc hoặc ghi sẽ được tô sáng. Dùng trình chạy để trả lời các câu hỏi bên dưới.',
  takeaways: [
    'Tổng hai số trong một lượt duyệt: với mỗi nums[i], tra need = target − nums[i] trong một ánh xạ từ giá trị sang chỉ số. Tìm thấy thì có ngay cặp số; không thấy thì lưu nums[i]. Trung bình tốn O(n) thời gian và bộ nhớ, so với O(n²) của hai vòng lặp lồng nhau.',
    'Hãy tra trước rồi mới lưu: nếu không, một phần tử có thể ghép cặp với chính nó, như 5 + 5 = 10 khi chỉ có một số 5.',
    'Lần tra ở chỉ số i xét xong i cặp cùng lúc: mọi cặp (j, i) với j < i. Vì thế n lần tra phủ hết n(n − 1)/2 cặp.',
    'Gom nhóm theo khoá: ánh xạ mỗi phần tử sang một khoá mà các phần tử “bằng nhau” cùng chia sẻ (với từ đảo chữ là các chữ cái đã sắp xếp), rồi nối phần tử vào danh sách của khoá đó. Sắp xếp một từ k chữ cái tốn O(k log k), nên n từ tốn O(n · k log k).',
    'Nạp bộ “Giá trị lặp lại” và đi từng bước, rồi gõ nums là 5 và target là 10, kiểm tra rằng số 5 không bị ghép với chính nó.',
  ],
  complexityHead: ['Bài toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Tổng hai số, ánh xạ hash',
      'O(n)',
      'Thời gian trung bình: mỗi số một lần tra và nhiều nhất một lần lưu. Ánh xạ dùng O(n) bộ nhớ.',
    ],
    [
      'Tổng hai số, hai vòng lặp',
      'O(n²)',
      'Có tới n(n − 1)/2 cặp được kiểm tra lần lượt, chỉ tốn thêm O(1) bộ nhớ.',
    ],
    [
      'Gom nhóm từ đảo chữ',
      'O(n·k log k)',
      'Trung bình: sắp xếp mỗi từ có tối đa k chữ cái, rồi tra ánh xạ một lần.',
    ],
    ['Bộ nhớ, từ đảo chữ', 'O(n·k)', 'Mỗi từ được lưu một lần, trong nhóm của nó.'],
  ],
  nextTeaser:
    'Bài tiếp theo, Đệ quy cơ bản, chuyển sang những hàm tự gọi chính mình và cách chúng chia một bài toán thành các bài toán con nhỏ hơn.',

  problemLabel: 'Bài toán',
  problems: { 'two-sum': 'Tổng hai số', anagrams: 'Gom nhóm từ đảo chữ' },
  presetLabel: 'Bộ mẫu',
  presetPlaceholder: 'Nạp một bộ mẫu…',
  presets: {
    'two-sum': {
      classic: 'Kinh điển',
      late: 'Cặp ở cuối',
      repeat: 'Giá trị lặp lại',
      none: 'Không có cặp',
    },
    anagrams: { classic: 'eat, tea, tan…', listen: 'listen, silent…' },
  },
  numsLabel: 'nums (cách nhau bằng dấu phẩy)',
  targetLabel: 'target',
  wordsLabel: 'Các từ',
  numsErrors: {
    format: 'nums phải là các số nguyên cách nhau bằng dấu phẩy.',
    range: 'Mỗi số phải nằm trong khoảng từ −99 đến 99.',
    count: 'Chỉ dùng tối đa 12 số.',
  },
  targetError: 'target phải là số nguyên trong khoảng từ −198 đến 198.',
  wordErrors: {
    empty: 'Hãy gõ ít nhất một từ.',
    format: 'Các từ chỉ được chứa chữ cái từ a đến z.',
    count: 'Chỉ dùng tối đa 12 từ.',
    length: 'Mỗi từ chỉ được có tối đa 8 chữ cái.',
  },
  arrayLabel: 'nums',
  /** @param {number[]} nums */
  arrayAria: (nums) => `nums: ${nums.map(num).join(', ')}.`,
  wordsTitle: 'Các từ',
  wordsHot: 'từ đang xét',
  mapTitles: {
    'two-sum': 'seen: giá trị → chỉ số',
    anagrams: 'groups: chữ cái đã sắp → các từ',
  },
  mapHead: { 'two-sum': ['giá trị', 'chỉ số'], anagrams: ['khoá', 'các từ'] },
  mapEmpty: 'rỗng',
  mapStates: {
    compare: 'đang được tra',
    active: 'vừa ghi',
    sorted: 'số còn lại của cặp, đã tìm thấy',
  },
  stats: {
    lookups: 'Số lần tra ánh xạ',
    covered: 'Số cặp đã xét xong',
    entries: 'Số mục trong ánh xạ',
    result: 'Kết quả',
    groups: 'Số nhóm',
  },
  none: '–',
  noPair: 'không có cặp',
  /** @param {number[]} pair */
  pairText: (pair) => `(${pair[0]}, ${pair[1]})`,
  pointerI: 'i',
  legend: {
    compare: 'Khoá đang được tra',
    active: 'Mục vừa ghi',
    sorted: 'Đã tìm thấy cặp',
  },
  marks: { compare: '?', active: '+', sorted: '✓' },

  /**
   * @param {HashPracticeFrame} f
   * @param {{nums: number[], target: number, words: string[]}} input
   */
  describe(f, input) {
    const i = f.index;
    if (f.problem === 'two-sum') {
      const x = input.nums[i];
      const t = num(input.target);
      switch (f.kind) {
        case 'start':
          return `Map seen đang rỗng. Tìm hai số trong nums có tổng bằng ${t}.`;
        case 'look':
          return `i = ${i}: nums[${i}] = ${num(x)}, nên need = ${t} − ${x < 0 ? `(${num(x)})` : x} = ${num(f.need)}. ${num(f.need)} có trong seen không?`;
        case 'found': {
          const [j] = f.pair;
          return `Có: seen[${num(f.need)}] = ${j}. nums[${j}] + nums[${i}] = ${num(input.nums[j])} + ${x < 0 ? `(${num(x)})` : x} = ${t}. Trả về (${j}, ${i}).`;
        }
        case 'store':
          return `Không. Lưu seen[${num(x)}] = ${i} rồi đi tiếp.`;
        case 'none':
          return `Không có hai số nào có tổng bằng ${t}: ${f.lookups} lần tra đã xét xong cả ${f.covered} cặp.`;
        case 'done':
          return f.pair.length
            ? `Xong: (${f.pair[0]}, ${f.pair[1]}) sau ${f.lookups} lần tra, đã xét xong ${f.covered} cặp.`
            : 'Xong: không có cặp nào.';
      }
    }
    const w = input.words[i];
    switch (f.kind) {
      case 'start':
        return 'Map groups đang rỗng. Những từ có cùng bộ chữ cái đã sắp xếp sẽ dùng chung một khoá.';
      case 'key':
        return `Sắp xếp chữ cái của ${q(w)} được ${q(f.sortedKey)}. ${q(f.sortedKey)} có trong groups không?`;
      case 'join': {
        const size = f.entries.find((e) => e.key === f.sortedKey)?.value.split(', ').length ?? 0;
        return `Có: nối ${q(w)} vào groups[${q(f.sortedKey)}], giờ nhóm này có ${size} từ.`;
      }
      case 'new':
        return `Không: tạo groups[${q(f.sortedKey)}] = [${q(w)}].`;
      case 'done':
        return `Xong: ${input.words.length} từ thuộc ${f.entries.length} nhóm.`;
      default:
        return '';
    }
  },

  practiceTitle: 'Luyện tập với trình chạy',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Tổng hai số với nums = 2, 7, 11, 15 và target là 9. Cặp số được tìm thấy ở chỉ số i nào?',
      answer: 1,
      hints: ['Ở i = 0, need = 7, và seen vẫn còn rỗng.'],
      solution:
        'Ở i = 0 ánh xạ đang rỗng, nên 2 được lưu lại. Ở i = 1, need = 9 − 7 = 2, có trong seen với chỉ số 0: kết quả là (0, 1), tìm thấy ở i = 1. Nạp bộ “Kinh điển” để kiểm tra.',
    },
    {
      type: 'number',
      prompt:
        'Nạp bộ “Cặp ở cuối” (nums = 3, 9, 1, 6, 12, 4, target là 16). Có bao nhiêu lần tra ánh xạ trước khi kết quả được trả về?',
      answer: 6,
      unit: 'lần',
      hints: ['Số còn lại của cặp với 4 là 12, được lưu ở chỉ số 4.'],
      solution:
        'Mọi số cho tới 12 đều tra trượt (các giá trị need là 13, 7, 15, 10 và 4 đều chưa được lưu), và lần tra thứ sáu, need = 16 − 4 = 12, thì trúng. Sáu lần tra xét xong cả 15 cặp trong sáu số.',
    },
    {
      type: 'text',
      prompt:
        'Nạp bộ “Giá trị lặp lại” (nums = 5, 3, 5, target là 10). Cặp chỉ số nào được trả về? Hãy viết dạng j, i.',
      accept: ['0, 2', '(0, 2)', '0 2', '[0, 2]', '0,2'],
      hints: ['Ở i = 0 ánh xạ đang rỗng, nên số 5 đầu tiên không thể ghép với chính nó.'],
      solution:
        'Ở i = 0, need = 5 nhưng seen đang rỗng, nên seen[5] = 0. Ở i = 1, need = 7 tra trượt. Ở i = 2, need = 5 có trong seen với chỉ số 0: kết quả là (0, 2).',
    },
    {
      type: 'number',
      prompt:
        'Nạp bộ “Không có cặp” (nums = 1, 2, 4, 8, target là 20). Cuối cùng seen chứa bao nhiêu mục?',
      answer: 4,
      unit: 'mục',
      hints: ['Lần tra nào cũng trượt, nên số nào cũng được lưu.'],
      solution:
        'Không có hai số nào trong 1, 2, 4 và 8 có tổng bằng 20, nên cả bốn lần tra đều trượt và cả bốn số đều được lưu. Bốn lần tra đó đã xét xong cả 6 cặp.',
    },
    {
      type: 'number',
      prompt: 'Gom nhóm các từ đảo chữ trong eat, tea, tan, ate, nat, bat. Có bao nhiêu nhóm?',
      answer: 3,
      unit: 'nhóm',
      hints: ['Sắp xếp chữ cái của từng từ: eat → aet, tan → ant, bat → abt.'],
      solution:
        'eat, tea và ate cùng khoá aet; tan và nat cùng khoá ant; bat đứng riêng với khoá abt. Vậy có 3 nhóm. Nạp bộ “eat, tea, tan…” để kiểm tra.',
    },
    {
      type: 'text',
      prompt: 'Khi gom nhóm từ đảo chữ, từ “listen” có khoá là gì?',
      accept: ['eilnst', '“eilnst”', '"eilnst"'],
      hints: ['Viết các chữ cái của nó theo thứ tự bảng chữ cái.'],
      solution:
        'Các chữ cái l, i, s, t, e, n sau khi sắp xếp là e, i, l, n, s, t: khoá là eilnst, dùng chung với silent, enlist, tinsel và inlets.',
    },
    {
      type: 'choice',
      prompt:
        'Một biến thể lưu seen[nums[i]] = i trước rồi mới tra need. Với nums = 5, 1 và target là 10 thì có gì sai?',
      options: [
        'Không sai gì: kết quả vẫn là “không có cặp”',
        'Nó trả về (0, 0): số 5 bị ghép với chính nó',
        'Nó bỏ sót một cặp có thật',
      ],
      answer: 1,
      hints: ['Ở i = 0, seen chứa gì khi need = 5 được tra?'],
      solution:
        'Lưu trước sẽ đặt 5 → 0 vào seen, rồi lần tra need = 10 − 5 = 5 tìm thấy chính chỉ số 0, trả về (0, 0). Tra trước rồi mới lưu thì i chỉ được ghép với một j đứng trước nó.',
    },
  ],
};
