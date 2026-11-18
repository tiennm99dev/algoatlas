/** @typedef {import('$lib/algo-engine/bitmask-dp.js').TspFrame} TspFrame */

/** @param {number} c */
const city = (c) => String.fromCharCode(65 + c);
/** The cities of a mask as a set, such as {A, C, D}. @param {number} mask @param {number} n */
const setOf = (mask, n) => {
  const names = [];
  for (let c = 0; c < n; c++) if (mask & (1 << c)) names.push(city(c));
  return `{${names.join(', ')}}`;
};
/** The mask in binary, city A as the rightmost bit. @param {number} mask @param {number} n */
const bits = (mask, n) => mask.toString(2).padStart(n, '0');

export const vi = {
  slug: 'bitmask-dp',
  topic: 'advanced-dp',
  level: 'Nâng cao',
  title: 'QHĐ bitmask và bài toán người du lịch',
  intro:
    'Có những trạng thái quy hoạch động (dynamic programming) phải nhớ cả một tập hợp: những thành phố mà hành trình đã đi qua. Khi tập đủ nhỏ, ta lưu nó bằng các bit của một số nguyên, gọi là bitmask (mặt nạ bit): bit c bằng 1 khi thành phố c thuộc tập. Thuật toán Held-Karp dùng mỗi trạng thái cho một cặp (tập thành phố đã thăm, thành phố đang đứng) và giải bài toán người du lịch trong O(2ⁿ · n²), thay vì thử hết (n − 1)! hành trình.',
  summary:
    'Lưu tập thành phố đã thăm bằng một bitmask và giải bài toán người du lịch bằng thuật toán Held-Karp trong O(2ⁿ · n²).',
  instruction:
    'Kéo các thành phố trên lưới, thêm hoặc bớt vài thành phố, rồi chạy từng bước. Mỗi hàng của bảng là một mặt nạ: các bit sáng là những thành phố đã thăm. ● đánh dấu trạng thái đang được đọc, con đường nét đứt là thành phố ta thử thêm vào, còn ô có thể được cải thiện mang dấu ○, hoặc ✎ khi nó nhận một giá trị ngắn hơn.',
  presetLabel: 'Ví dụ',
  /** @type {Record<string, string>} */
  presets: {
    four: '4 thành phố',
    five: '5 thành phố',
    six: '6 thành phố',
  },
  addCity: 'Thêm thành phố',
  removeCity: 'Xoá thành phố',
  randomCities: 'Thành phố ngẫu nhiên',
  /** @param {number} max */
  fullError: (max) => `Đã có ${max} thành phố, nhiều nhất mà bảng này hiển thị được.`,
  /** @param {number} min */
  minError: (min) => `Một hành trình cần ít nhất ${min} thành phố.`,
  occupiedError: 'Chỗ đó đã có một thành phố khác.',
  noRoomError: 'Trên lưới không còn chỗ trống nào.',
  selectFirst:
    'Hãy chọn một thành phố trước: bấm vào nó, hoặc dùng Tab di chuyển tới rồi nhấn Enter.',
  planeLabel:
    'Lưới các thành phố. Kéo một thành phố hoặc giữ Shift và nhấn phím mũi tên để dời nó, nhấn Delete để xoá, và bấm vào chỗ trống để thêm thành phố.',
  /** @param {string} name @param {number} x @param {number} y @param {string} state */
  cityLabel: (name, x, y, state) => `Thành phố ${name} ở (${x}, ${y})${state ? `, ${state}` : ''}`,
  cityStates: {
    start: 'điểm xuất phát',
    route: 'trên đường đi',
    next: 'đang thử thêm',
    tour: 'trên hành trình',
  },
  distanceNote: 'Khoảng cách tính bằng số bước trên lưới: |Δx| + |Δy|.',
  distTitle: 'Khoảng cách d[i][j]',
  /** @param {number} n */
  distAria: (n) => `Bảng khoảng cách giữa ${n} thành phố.`,
  tableTitle: 'Trạng thái dp[mask][j]',
  /** @param {number} n */
  tableCaption: (n) =>
    `Đường đi ngắn nhất từ A qua đúng các thành phố có bit sáng, kết thúc ở thành phố j. Có ${2 ** (n - 1)} mặt nạ chứa A.`,
  maskHead: 'mask',
  bitsHead: 'bit của thành phố',
  /** @param {string} name */
  endHead: (name) => `j = ${name}`,
  /** @param {number} mask @param {number} n */
  maskLabel: (mask, n) => `Mặt nạ ${mask}, nhị phân ${bits(mask, n)}, đã thăm ${setOf(mask, n)}`,
  /** @param {string} name @param {boolean} on */
  bitLabel: (name, on) => `${name} ${on ? 'đã thăm' : 'chưa thăm'}`,
  outside: '·',
  /** @param {number} mask @param {number} j @param {number} n @param {string} v @param {string} state */
  cellLabel: (mask, j, n, v, state) =>
    `dp[${setOf(mask, n)}][${city(j)}]: ${v === '' ? 'chưa tới được' : v === '·' ? 'không phải trạng thái' : v}${state ? `, ${state}` : ''}`,
  cellStates: {
    read: 'đang đọc',
    target: 'có thể cải thiện',
    improved: 'vừa cải thiện',
    path: 'trên hành trình',
  },
  legend: {
    read: 'Trạng thái đang đọc',
    target: 'Trạng thái có thể được cải thiện',
    improved: 'Trạng thái vừa được cải thiện',
    path: 'Trên hành trình tốt nhất',
    lit: '1 Thành phố đã thăm (bit bằng 1)',
  },
  markers: { read: '●', target: '○', improved: '✎', path: '◆' },
  stats: {
    tries: 'Số lần chuyển đã thử',
    reached: 'Số trạng thái tới được',
    best: 'Hành trình ngắn nhất',
    tours: 'Số hành trình vét cạn phải đo',
  },
  pending: '…',
  routeTitle: 'Đường đi',
  /** @param {number[]} route */
  route: (route) => (route.length ? route.map(city).join(' → ') : '—'),
  /** @param {TspFrame} f */
  describe(f) {
    const mask = setOf(f.mask, f.n);
    switch (f.kind) {
      case 'start':
        return `Đi qua cả ${f.n} thành phố rồi quay về A theo hành trình ngắn nhất. Một trạng thái gồm tập thành phố đã thăm và thành phố đang đứng.`;
      case 'base':
        return `Mặt nạ 1 = ${bits(1, f.n)}: mới thăm A và đang đứng ở A, nên dp[{A}][A] = 0.`;
      case 'mask':
        if (f.mask === 1)
          return 'Mặt nạ 1, tập {A}: mở rộng trạng thái xuất phát bằng từng thành phố còn lại.';
        return `Mặt nạ ${f.mask} = ${bits(f.mask, f.n)}, tập ${mask}. Mọi tập nhỏ hơn đã tính xong nên các trạng thái của tập này đã chốt: ta mở rộng từng trạng thái thêm một thành phố mới.`;
      case 'try': {
        const next = setOf(f.mask | (1 << f.k), f.n);
        const step = f.dist[f.j][f.k];
        const verdict = f.improved
          ? f.old === null
            ? 'Đây là đường đi đầu tiên tới trạng thái đó.'
            : `Ngắn hơn ${f.old}, nên trạng thái được cải thiện.`
          : `Không ngắn hơn ${f.old}.`;
        return `Từ ${mask} đang ở ${city(f.j)}, đi tới ${city(f.k)}: ${(f.cand ?? 0) - step} + ${step} = ${f.cand} cho dp[${next}][${city(f.k)}]. ${verdict}`;
      }
      case 'close': {
        const verdict = f.improved
          ? f.old === null
            ? 'Đây là hành trình trọn vẹn đầu tiên.'
            : `Ngắn hơn ${f.old}, nên đây là hành trình tốt nhất đến lúc này.`
          : `Không ngắn hơn ${f.old}.`;
        return `Khép hành trình từ ${city(f.j)}: đã thăm mọi thành phố, ${(f.cand ?? 0) - f.dist[f.j][0]} + ${f.dist[f.j][0]} để về A = ${f.cand}. ${verdict}`;
      }
      case 'trace':
        return `Đọc ngược: đường đi tốt nhất qua ${mask} kết thúc ở ${city(f.j)} đến từ ${city(f.k)}. Bỏ ${city(f.j)} khỏi mặt nạ rồi đi tiếp từ ${city(f.k)}.`;
      case 'done':
        return `Hành trình ngắn nhất là ${f.tour.map(city).join(' → ')}, dài ${f.result}.`;
    }
  },
  takeaways: [
    'Một bitmask lưu một tập có tới khoảng 20 phần tử trong một số nguyên: bit c bằng 1 khi phần tử c thuộc tập. Thêm c bằng mask | 2ᶜ, kiểm tra bằng mask & 2ᶜ, và tập đầy đủ là 2ⁿ − 1.',
    'Trạng thái của Held-Karp là (mask, j): các thành phố đã thăm và thành phố đang đứng. Thứ tự đi qua các thành phố trước đó không còn quan trọng, chỉ cần biết là những thành phố nào, và chính điều đó gom (n − 1)! hành trình lại thành 2ⁿ · n trạng thái.',
    'dp[mask | 2ᵏ][k] = min theo j của dp[mask][j] + d[j][k]. Bật thêm một bit làm số lớn lên, nên duyệt mặt nạ theo thứ tự tăng dần sẽ tính xong mọi trạng thái trước khi nó được đọc.',
    'Thời gian O(2ⁿ · n²), bộ nhớ O(2ⁿ · n): ổn với n ≈ 20, vô vọng với 100. Vét cạn cần (n − 1)! hành trình: đã là 120 với 6 thành phố và hơn 10¹⁷ với 20 thành phố.',
    'Kéo một thành phố ra xa các thành phố khác rồi chạy tới cuối: xem những trạng thái nào được cải thiện, và hành trình tốt nhất đổi thứ tự ra sao để ghé thành phố đó.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Trạng thái',
      'O(2ⁿ · n)',
      'Mỗi tập thành phố đã thăm và mỗi thành phố đang đứng cho một trạng thái.',
    ],
    ['Thời gian', 'O(2ⁿ · n²)', 'Mỗi trạng thái thử mọi thành phố chưa thăm.'],
    [
      'Bộ nhớ',
      'O(2ⁿ · n)',
      'Cái bảng, cộng một thành phố liền trước cho mỗi trạng thái để dựng lại hành trình.',
    ],
    ['Vét cạn', 'O(n!)', '(n − 1)! thứ tự các thành phố sau A, mỗi thứ tự đo trong O(n).'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Các thành phố được đánh số A = 0, B = 1, C = 2, D = 3. Mặt nạ nào (viết ở hệ thập phân) biểu diễn tập {A, C, D}?',
      answer: 13,
      hints: ['Cộng 2ᶜ cho mỗi thành phố c thuộc tập.'],
      solution: '2⁰ + 2² + 2³ = 1 + 4 + 8 = 13, ở hệ nhị phân là 1101.',
    },
    {
      type: 'number',
      prompt: 'Nạp ví dụ 4 thành phố rồi chạy tới cuối. Hành trình ngắn nhất dài bao nhiêu?',
      answer: 20,
      unit: 'bước',
      hints: ['Đọc ô “Hành trình ngắn nhất” ở bước cuối.'],
      solution:
        'A → C → D → B → A: 5 + 6 + 4 + 5 = 20 bước trên lưới. Hai hành trình còn lại, mỗi hành trình đi được theo hai chiều, dài 26 và 28.',
    },
    {
      type: 'number',
      prompt: 'Với 6 thành phố, Held-Karp thử bao nhiêu lần chuyển trạng thái?',
      answer: 165,
      unit: 'lần',
      hints: [
        'Nạp ví dụ 6 thành phố và đọc ô “Số lần chuyển đã thử” ở bước cuối.',
        'Một mặt nạ gồm s thành phố có chứa A thì có s − 1 thành phố kết thúc và còn n − s thành phố để thêm.',
      ],
      solution:
        '5 lần từ {A}, rồi 5·1·4 + 10·2·3 + 10·3·2 + 5·4·1 = 20 + 60 + 60 + 20, nên tổng cộng là 165.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao có thể xử lí các mặt nạ theo thứ tự số tăng dần?',
      options: [
        'Vì mặt nạ nhỏ hơn chứa đường đi ngắn hơn.',
        'Vì mỗi lần chuyển đều bật thêm một bit, nên nó đi từ một mặt nạ tới một số lớn hơn.',
        'Vì thành phố A là bit 0.',
        'Vì khoảng cách có tính đối xứng.',
      ],
      answer: 1,
      hints: ['So sánh mask với mask | 2ᵏ khi bit k đang bằng 0.'],
      solution:
        'mask | 2ᵏ = mask + 2ᵏ > mask. Mỗi trạng thái chỉ được ghi bởi các trạng thái có mặt nạ nhỏ hơn, nên khi tới lượt nó thì giá trị đã chốt.',
    },
    {
      type: 'text',
      prompt: 'Thời gian chạy của Held-Karp với n thành phố là bao nhiêu?',
      accept: [
        'O(2^n n^2)',
        'O(2^n·n^2)',
        'O(2^n*n^2)',
        'O(n^2 2^n)',
        'O(n^2·2^n)',
        'O(n^2*2^n)',
        'O(2ⁿ n²)',
        'O(2ⁿ·n²)',
        'O(n²·2ⁿ)',
      ],
      hints: ['Đếm số trạng thái, rồi đếm công việc cho mỗi trạng thái.'],
      solution:
        'Có 2ⁿ · n trạng thái và mỗi trạng thái thử tối đa n thành phố tiếp theo: O(2ⁿ · n²).',
    },
  ],
  nextTeaser:
    'Bài sau chuyển trạng thái từ tập hợp sang cây: QHĐ trên cây gộp kết quả của các cây con lên nút cha.',
};
