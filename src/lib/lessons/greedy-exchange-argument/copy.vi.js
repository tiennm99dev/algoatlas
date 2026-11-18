/** @typedef {import('$lib/algo-engine/greedy-exchange-argument.js').ChangeFrame} ChangeFrame */

/**
 * A payment as a sum, largest coin first: 4 + 1 + 1.
 * @param {number[]} coins @param {number[]} taken
 */
function sum(coins, taken) {
  const parts = coins.flatMap((c, k) => Array(taken[k]).fill(c));
  return parts.length ? parts.join(' + ') : 'không đồng nào';
}

export const vi = {
  slug: 'greedy-exchange-argument',
  topic: 'greedy',
  level: 'Cơ bản',
  title: 'Lựa chọn tham lam và lập luận hoán đổi',
  intro:
    'Thuật toán tham lam (greedy) dựng đáp án từng lựa chọn một và không bao giờ rút lại lựa chọn nào: ở mỗi bước, nó chọn thứ trông tốt nhất ngay lúc đó. Ví dụ kinh điển là trả một số tiền bằng ít đồng xu nhất, bằng cách luôn lấy đồng lớn nhất còn vừa. Cách này nhanh và đơn giản, nhưng chỉ đúng khi bài toán có tính chất lựa chọn tham lam, và lập luận hoán đổi (exchange argument) là cách chứng minh tính chất đó.',
  summary:
    'Chạy từng bước thuật toán đổi tiền tham lam, so sánh với số đồng xu ít nhất thật sự, và tìm những số tiền mà lựa chọn tham lam thất bại.',
  instruction:
    'Chọn một bộ đồng xu hoặc tự nhập, đặt số tiền, rồi chạy từng bước. Khung bên phải cho biết số đồng xu ít nhất có thể. Bấm “Chạy từng bước phản ví dụ nhỏ nhất” để nạp một số tiền mà tham lam thua.',
  coinsLabel: 'Các đồng xu',
  amountLabel: 'Số tiền',
  presetLabel: 'Bộ đồng xu',
  presetPlaceholder: 'Nạp một bộ đồng xu…',
  presets: {
    tricky: '1, 3, 4',
    us: 'Đồng xu Mỹ: 1, 5, 10, 25',
    vnd: 'Tiền giấy Việt Nam (×1000 ₫)',
    sevenTen: '1, 7, 10',
    noOne: 'Không có đồng 1: 3, 5',
  },
  errors: {
    format:
      'Hãy nhập các mệnh giá nguyên, cách nhau bởi dấu phẩy hoặc dấu cách. Bộ đồng xu hợp lệ gần nhất đã được khôi phục.',
    range: 'Mỗi đồng xu phải từ 1 đến 100. Bộ đồng xu hợp lệ gần nhất đã được khôi phục.',
    count: 'Hãy dùng nhiều nhất 8 loại đồng xu. Bộ đồng xu hợp lệ gần nhất đã được khôi phục.',
  },
  amountError: 'Số tiền phải là số nguyên từ 1 đến 200. Số tiền hợp lệ gần nhất đã được khôi phục.',
  newCoinsNotice: 'Đã nạp bộ đồng xu mới.',
  /** @param {number} x */
  counterNotice: (x) => `Đã nạp số tiền ${x}: số nhỏ nhất mà tham lam không tối ưu.`,
  /** @param {number[]} coins @param {number} rest */
  coinsAria: (coins, rest) => `Các đồng xu: ${coins.join(', ')}. Còn phải trả: ${rest}.`,
  /** @param {number} coin @param {number} taken @param {string} state */
  coinLabel: (coin, taken, state) =>
    `Đồng ${coin}${state ? `, ${state.toLowerCase()}` : ''}${taken ? `, đã lấy ${taken} lần` : ''}`,
  coinPointer: 'c',
  legend: {
    trying: 'Đồng đang thử',
    taken: 'Đã lấy ít nhất một lần',
    skipped: 'Quá lớn so với số còn lại',
  },
  markers: { trying: '?', taken: '×q', skipped: '✗' },
  /** @param {number} q */
  takenMark: (q) => `×${q}`,
  stats: {
    rest: 'Còn phải trả',
    greedy: 'Số đồng theo tham lam',
    best: 'Số đồng ít nhất',
    verdict: 'Kết luận',
  },
  none: '—',
  verdicts: {
    optimal: 'Tham lam tối ưu',
    worse: 'Tham lam dùng quá nhiều đồng',
    stuck: 'Tham lam bị kẹt',
    impossible: 'Không có cách trả nào',
    pending: 'Đang chạy',
  },
  greedyTitle: 'Cách trả theo tham lam đến giờ',
  bestTitle: 'Một cách trả ít đồng nhất (quy hoạch động)',
  emptyPay: 'chưa có đồng nào',
  noPay: 'không trả được số tiền này',
  counterTitle: 'Tìm phản ví dụ',
  /** @param {number} n @param {number} limit */
  counterSummary: (n, limit) =>
    n === 0
      ? `Với bộ đồng xu này, tham lam tối ưu cho mọi số tiền từ 1 đến ${limit}.`
      : `Tham lam không tối ưu cho ${n} số tiền trong khoảng từ 1 đến ${limit}.`,
  /** @param {{amount: number, greedy: number, best: number, stuck: boolean}} c */
  counterChip: (c) =>
    c.stuck
      ? `${c.amount}: bị kẹt, tốt nhất ${c.best}`
      : `${c.amount}: ${c.greedy} so với ${c.best}`,
  counterChipsTitle: 'Số tiền: số đồng theo tham lam so với ít nhất',
  counterEmpty: 'không có phản ví dụ',
  smallest: 'Chạy từng bước phản ví dụ nhỏ nhất',
  practiceTitle: 'Tự kiểm tra',
  /** @param {ChangeFrame} f */
  describe(f) {
    const c = f.at >= 0 ? f.coins[f.at] : 0;
    switch (f.kind) {
      case 'start':
        return `Trả ${f.amount} bằng ít đồng nhất có thể từ ${f.coins.join(', ')}. Quy tắc tham lam: luôn lấy đồng lớn nhất còn vừa.`;
      case 'sort':
        return `Sắp xếp các đồng xu từ lớn đến nhỏ: ${f.coins.join(', ')}.`;
      case 'try':
        return `Đồng ${c}: ⌊${f.rest} / ${c}⌋ = ${f.q}, nên ${f.q === 0 ? 'đồng này không vừa' : `vừa ${f.q} đồng ${c}`}.`;
      case 'take':
        return `Lấy ${f.q} × ${c}. ${f.rest === 0 ? 'Không còn gì phải trả.' : `Còn phải trả ${f.rest}.`}`;
      case 'skip':
        return f.rest === 0
          ? `Bỏ qua ${c}: số tiền đã trả xong.`
          : `Bỏ qua ${c}: đồng này lớn hơn ${f.rest} còn phải trả.`;
      case 'fail':
        return `Đã thử hết mọi đồng mà vẫn còn ${f.rest} chưa trả: tham lam bị kẹt, vì không có đồng nào đủ nhỏ.`;
      case 'done': {
        const paid = sum(f.coins, f.taken);
        const best = sum(f.coins, f.bestTaken);
        switch (f.verdict) {
          case 'optimal':
            return `Tham lam trả ${f.amount} = ${paid}, ${f.count} đồng, và không cách trả nào dùng ít hơn. Đúng với số tiền này, nhưng điều đó không chứng minh nó đúng với mọi số tiền: hãy thử tìm phản ví dụ.`;
          case 'worse':
            return `Tham lam trả ${f.amount} = ${paid}, ${f.count} đồng, nhưng ${best} chỉ dùng ${f.best}. Ở một bước nào đó, đồng lớn nhất còn vừa lại là lựa chọn sai, nên bộ đồng xu này không có tính chất lựa chọn tham lam.`;
          case 'stuck':
            return `Tham lam bị kẹt với ${f.rest} chưa trả, trong khi ${f.amount} = ${best} trả được bằng ${f.best} đồng. Lấy đồng lớn nhất trước là lựa chọn sai.`;
          case 'impossible':
            return `Không tổ hợp nào của các đồng xu này trả được ${f.amount}, nên cả tham lam lẫn mọi cách khác đều không làm được.`;
          default:
            return '';
        }
      }
    }
  },
  takeaways: [
    'Thuật toán tham lam đưa ra lựa chọn tốt nhất tại chỗ, giữ nguyên lựa chọn đó và giải phần còn lại. Nó không bao giờ quay lui, nên thường chạy nhanh: đổi tiền với k đồng xu đã sắp xếp chỉ cần k phép chia.',
    'Tham lam đúng khi bài toán có tính chất lựa chọn tham lam (có một lời giải tối ưu bắt đầu bằng lựa chọn tham lam) và có cấu trúc con tối ưu (optimal substructure), tức phần còn lại là một bản nhỏ hơn của cùng bài toán.',
    'Lập luận hoán đổi chứng minh tính chất lựa chọn tham lam: lấy một lời giải tối ưu bất kì không bắt đầu bằng lựa chọn tham lam, đổi một phần của nó lấy lựa chọn tham lam, rồi chỉ ra kết quả vẫn hợp lệ và không tệ hơn. Với 1, 5, 10, 25, một cách trả tối ưu không bao giờ chứa năm đồng 1, hai đồng 5, ba đồng 10, hoặc hai đồng 10 cùng một đồng 5, nên hễ x ≥ 25 thì trong đó phải có đồng 25.',
    'Chỉ một phản ví dụ là đủ cho thấy tham lam thất bại. Với 1, 3, 4, tham lam trả 6 = 4 + 1 + 1, ba đồng, trong khi 3 + 3 chỉ dùng hai; với 3, 5, nó bị kẹt ở 9 dù 3 + 3 + 3 trả được. Khi đó quy hoạch động tìm ra giá trị nhỏ nhất thật sự.',
    'Nạp “1, 7, 10” và chạy từng bước phản ví dụ nhỏ nhất, rồi nạp bộ tiền giấy Việt Nam: việc tìm kiếm không thấy số tiền nào tới 200 mà tham lam thua. Khi có đồng 1, phản ví dụ nhỏ nhất (nếu có) luôn nhỏ hơn tổng hai đồng lớn nhất, nên chỉ cần tìm trong một khoảng ngắn là trả lời được câu hỏi.',
  ],
  complexityHead: ['Phương pháp', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Đổi tiền tham lam, các đồng đã sắp xếp',
      'Thời gian O(k)',
      'Mỗi đồng một phép chia ⌊x / c⌋, bất kể số tiền.',
    ],
    ['Sắp xếp các đồng xu', 'O(k log k)', 'Làm một lần, trước vòng lặp.'],
    [
      'Số đồng ít nhất bằng quy hoạch động',
      'Thời gian O(k · x), bộ nhớ O(x)',
      'Mỗi số tiền 1..x thử từng đồng xu làm đồng cuối cùng.',
    ],
    [
      'Tìm phản ví dụ tới L',
      'O(k · L)',
      'Một bảng QHĐ cho 1..L, và mỗi số tiền một lần chạy tham lam O(k).',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Với các đồng 1, 3 và 4, tham lam dùng bao nhiêu đồng để trả 6?',
      answer: 3,
      unit: 'đồng',
      hints: ['Tham lam lấy đồng lớn nhất còn vừa trước: 4.', 'Sau đồng 4, còn lại 2.'],
      solution:
        'Tham lam lấy 4, rồi 3 không vừa với 2 còn lại, nên nó lấy 1 + 1: 4 + 1 + 1 là 3 đồng. Cách trả tốt nhất 3 + 3 chỉ dùng 2.',
    },
    {
      type: 'number',
      prompt: 'Số tiền nhỏ nhất mà tham lam không tối ưu với các đồng 1, 7 và 10 là bao nhiêu?',
      answer: 14,
      hints: [
        'Tìm một số tiền mà hai đồng 7 trả vừa đúng.',
        'Nạp “1, 7, 10” và đọc ô đầu tiên của phần tìm phản ví dụ.',
      ],
      solution:
        'Mọi số tiền tới 13 đều được trả tối ưu, nhưng 14 = 10 + 1 + 1 + 1 + 1 khiến tham lam dùng 5 đồng, trong khi 7 + 7 chỉ cần 2.',
    },
    {
      type: 'choice',
      prompt: 'Với bộ đồng xu nào thì đổi tiền tham lam tối ưu cho mọi số tiền?',
      options: ['1, 3, 4', '1, 5, 6, 9', '1, 5, 10, 25', '1, 7, 10'],
      answer: 2,
      hints: [
        'Ba trong bốn bộ có một phản ví dụ nhỏ: thử 6, 11 và 14.',
        'Chạy phần tìm phản ví dụ trên từng bộ.',
      ],
      solution:
        '1, 5, 10, 25 là bộ chuẩn tắc: lập luận hoán đổi cho thấy một cách trả tối ưu không bao giờ cần nhiều đồng nhỏ hơn cách trả tham lam. 1, 3, 4 thất bại ở 6, 1, 5, 6, 9 ở 11 (9 + 1 + 1 so với 6 + 5) và 1, 7, 10 ở 14.',
    },
    {
      type: 'choice',
      prompt: 'Tham lam làm gì khi trả 9 bằng các đồng 3 và 5?',
      options: [
        'Trả 3 + 3 + 3',
        'Trả 5 + 3 và bị kẹt với 1 chưa trả',
        'Trả 5 + 5 và trả dư',
        'Báo rằng không trả được 9, và điều đó đúng',
      ],
      answer: 1,
      hints: ['Tham lam lấy ⌊9 / 5⌋ đồng 5 trước.', 'Sau đó nó lấy ⌊4 / 3⌋ đồng 3.'],
      solution:
        'Tham lam lấy một đồng 5 và một đồng 3, rồi còn 1 và không đồng nào vừa. 9 trả được, bằng 3 + 3 + 3, nên lựa chọn tham lam lấy đồng 5 là một sai lầm mà nó không thể sửa lại.',
    },
    {
      type: 'order',
      prompt: 'Xếp các bước của một lập luận hoán đổi theo đúng thứ tự.',
      items: [
        'Kết luận rằng có một lời giải tối ưu chọn lựa chọn tham lam',
        'Lấy một lời giải tối ưu bất kì không chọn lựa chọn tham lam',
        'Chỉ ra lời giải mới vẫn hợp lệ và không tệ hơn',
        'Đổi một phần của nó lấy lựa chọn tham lam',
      ],
      answer: [1, 3, 2, 0],
      hints: [
        'Bạn bắt đầu từ một lời giải mà bạn biết là tối ưu.',
        'Phép đổi diễn ra trước khi bạn kiểm tra rằng không có gì tệ đi.',
      ],
      solution:
        'Bắt đầu từ một lời giải tối ưu tuỳ ý, đổi một phần của nó lấy lựa chọn tham lam, kiểm tra kết quả hợp lệ và không tốn hơn, rồi kết luận rằng tồn tại một lời giải tối ưu bắt đầu bằng lựa chọn tham lam.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo, Lập lịch các đoạn, dùng đúng lập luận hoán đổi này để chọn nhiều đoạn không giao nhau nhất.',
};
