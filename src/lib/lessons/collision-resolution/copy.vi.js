/** @typedef {import('$lib/algo-engine/collision-resolution.js').CollisionFrame} CollisionFrame */
/** @typedef {import('$lib/algo-engine/collision-resolution.js').ProbeMethod} ProbeMethod */

/** @type {Record<ProbeMethod, string>} */
const METHOD_NAMES = {
  linear: 'dò tuyến tính',
  quadratic: 'dò bậc hai',
  double: 'băm kép',
};

export const vi = {
  slug: 'collision-resolution',
  topic: 'structures',
  level: 'Cơ bản',
  title: 'Xử lí va chạm: móc nối và địa chỉ mở',
  intro:
    'Hai khoá rất hay băm vào cùng một ngăn. Móc nối (separate chaining) giữ một danh sách ở mỗi ngăn; địa chỉ mở (open addressing) cất mọi khoá ngay trong bảng và, khi va chạm, dò sang các ô khác theo một thứ tự cố định. Hãy đổ cùng một bộ khoá vào cả hai loại bảng rồi so sánh xem khoá nằm ở đâu và mỗi lần tra cứu tốn bao nhiêu.',
  summary:
    'Chèn cùng một bộ khoá vào bảng móc nối và bảng địa chỉ mở đặt cạnh nhau, rồi so sánh dò tuyến tính, dò bậc hai và băm kép.',
  instruction:
    'Chọn một cách dò và một bộ khoá, rồi đi từng bước. Mỗi khoá được chèn vào bảng móc nối trước (cột trái), rồi vào bảng dò (cột phải). Quan sát dãy dò khi ô gốc đã có khoá, sau đó tìm một khoá và so sánh chi phí của một lần tìm trượt ở hai bảng.',
  takeaways: [
    'Móc nối không bao giờ hết chỗ: các khoá va chạm dùng chung một danh sách, và phép tra cứu chỉ đi dọc danh sách đó.',
    'Địa chỉ mở giữ mọi khoá trong bảng. Khi va chạm, nó thử lần lượt các ô h(k) + f(i) với i = 1, 2, …, và phép tìm dừng ở khoá cần tìm hoặc ở ô trống đầu tiên.',
    'Dò tuyến tính (linear probing, f(i) = i) tạo ra những dải ô đã có khoá rất dài, gọi là cụm sơ cấp; khoá nào rơi vào một dải cũng làm dải đó dài thêm.',
    'Dò bậc hai (quadratic probing, f(i) = i²) nhảy ra khỏi các dải, nhưng các khoá cùng ô gốc vẫn đi chung một đường dò, và nó có thể bỏ sót ô trống: với 11 ô, nó chỉ tới được 6 ô.',
    'Băm kép (double hashing, f(i) = i · h₂(k)) cho mỗi khoá một bước nhảy riêng, nên các khoá cùng ô gốc đi những đường khác nhau. Nạp bộ “Cùng ô gốc” rồi chuyển qua lại giữa ba cách dò để thấy điều đó.',
  ],
  complexityHead: ['Thao tác', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Tìm kiếm, móc nối',
      'O(1 + α)',
      'Trung bình: băm một lần rồi đi dọc một chuỗi, có độ dài trung bình bằng hệ số tải α = n/m.',
    ],
    [
      'Tìm trượt, địa chỉ mở',
      '1/(1 − α)',
      'Số lần dò kì vọng khi băm đều: mỗi lần dò gặp ô trống với xác suất ít nhất 1 − α.',
    ],
    [
      'Xấu nhất, mọi cách',
      'O(n)',
      'Mọi khoá có thể cùng nằm trong một chuỗi hoặc cùng một đường dò.',
    ],
    [
      'Bộ nhớ',
      'O(m + n)',
      'Móc nối tốn thêm một nút danh sách cho mỗi khoá; địa chỉ mở chỉ dùng m ô, nên cần n ≤ m.',
    ],
  ],
  nextTeaser:
    'Bài tiếp theo, Hệ số tải và băm lại, cho thấy bảng biết khi nào cần lớn lên và vì sao gấp đôi kích thước vẫn rẻ.',

  methodLabel: 'Cách dò',
  methods: {
    linear: 'Tuyến tính',
    quadratic: 'Bậc hai',
    double: 'Băm kép',
  },
  methodNames: METHOD_NAMES,
  presetLabel: 'Bộ mẫu',
  presetPlaceholder: 'Nạp một bộ mẫu…',
  presets: {
    mixed: 'Hỗn hợp',
    cluster: 'Ô gốc dồn cụm',
    'same-home': 'Cùng ô gốc',
    random: 'Ngẫu nhiên',
  },
  newKeys: 'Bộ khoá mới',
  keysLabel: 'Các khoá (cách nhau bằng dấu phẩy)',
  searchLabel: 'Tìm khoá',
  searchButton: 'Tìm',
  searchDropped: 'Phép tìm đã bị xoá vì bộ khoá hoặc cách dò vừa thay đổi.',
  keyErrors: {
    format: 'Các khoá phải là số nguyên từ 0 đến 99, cách nhau bằng dấu phẩy.',
    range: 'Các khoá phải là số nguyên từ 0 đến 99.',
    count: 'Chỉ dùng tối đa 10 khoá, để bảng 11 ô luôn còn chỗ.',
    duplicate: 'Mỗi khoá chỉ được xuất hiện một lần.',
  },
  tableLabel: 'Hai bảng, so từng ô',
  head: {
    slot: 'Ô',
    chaining: 'Móc nối',
  },
  /** @param {ProbeMethod} method */
  probingHead: (method) => `Địa chỉ mở (${METHOD_NAMES[method]})`,
  homeMark: 'h',
  homeLabel: 'ô gốc của khoá đang xét',
  empty: 'trống',
  formulas: {
    linear: 's = (h(k) + i) mod 11',
    quadratic: 's = (h(k) + i²) mod 11',
    double: 's = (h(k) + i · h₂(k)) mod 11, h₂(k) = 7 − (k mod 7)',
  },
  sequenceTitle: 'Dãy dò của khoá đang xét',
  sequenceEmpty: 'chưa dò lần nào',
  sequenceHot: 'lần dò mới nhất',
  /** @param {number} slot @param {number} i */
  sequenceChip: (slot, i) => `i=${i}: ${slot}`,
  stats: {
    chainCompares: 'Số lần so sánh trong chuỗi',
    probes: 'Số ô đã dò',
    longest: 'Chuỗi dài nhất',
    emptySlots: 'Số ô trống',
    failed: 'Số khoá không dò được chỗ',
  },
  legend: {
    compare: 'Đang so sánh, hoặc đã dò nhưng có khoá (va chạm)',
    active: 'Vừa thêm',
    sorted: 'Tìm thấy',
    frontier: 'Ô trống làm phép tìm dừng lại',
  },
  marks: { compare: '?', collision: '×', active: '+', sorted: '✓', frontier: '○' },
  chipStates: {
    compare: 'đang so sánh',
    collision: 'đã dò, có khoá: va chạm',
    active: 'vừa thêm',
    sorted: 'tìm thấy',
    frontier: 'ô trống làm phép tìm dừng lại',
  },

  /** @param {CollisionFrame} f @param {ProbeMethod} method */
  describe(f, method) {
    const { key: k, home, slot, attempt: i } = f;
    const chain = home >= 0 ? f.chains[home] : [];
    const name = METHOD_NAMES[method];
    switch (f.kind) {
      case 'start':
        return `Hai bảng rỗng, mỗi bảng 11 ô. Cột trái dùng móc nối, cột phải dùng ${name}.`;
      case 'hash': {
        const head = f.search ? `Tìm ${k}` : `Chèn ${k}`;
        const step =
          method === 'double'
            ? ` Bước nhảy của nó là h₂(${k}) = 7 − (${k} mod 7) = ${f.step}.`
            : '';
        return `${head}: h(${k}) = ${k} mod 11 = ${home}.${step}`;
      }
      case 'chain-compare':
        return `Móc nối: so sánh ${k} với ${chain[f.pos]}, khoá thứ ${f.pos + 1} của chuỗi ${home}.`;
      case 'chain-add':
        return chain.length === 1
          ? `Móc nối: chuỗi ${home} đang trống, nên ${k} mở đầu chuỗi.`
          : `Móc nối: va chạm. Nối ${k} vào chuỗi ${home}, giờ chuỗi có ${chain.length} khoá.`;
      case 'probe':
        return f.search
          ? `Lần dò i = ${i}: ô ${slot} chứa ${f.slots[slot]}, không phải ${k}. Dò tiếp.`
          : i === 10
            ? `Lần dò i = 10: ô ${slot} chứa ${f.slots[slot]}. Va chạm, và đó là lần dò cuối cùng.`
            : `Lần dò i = ${i}: ô ${slot} chứa ${f.slots[slot]}. Va chạm, nên thử i = ${i + 1}.`;
      case 'place':
        return i === 0
          ? `Lần dò i = 0: ô ${slot} trống, nên ${k} vào đúng ô gốc của nó.`
          : `Lần dò i = ${i}: ô ${slot} trống. ${k} vào ô này sau ${i} lần va chạm.`;
      case 'fail': {
        const free = f.slots.filter((s) => s === null).length;
        return `Cả 11 lần dò đều gặp ô đã có khoá, nên không đặt được ${k}, dù vẫn còn ${free} ô trống.`;
      }
      case 'chain-hit':
        return `Móc nối: tìm thấy ${k} trong chuỗi ${home} sau ${f.pos + 1} phép so sánh.`;
      case 'chain-miss':
        return `Móc nối: ${k} không có trong chuỗi ${home}. Lần tìm trượt tốn ${chain.length} phép so sánh, tức cả chuỗi.`;
      case 'probe-hit':
        return `Dò: tìm thấy ${k} ở ô ${slot} sau ${i + 1} lần dò.`;
      case 'probe-miss':
        return slot >= 0
          ? `Dò: ô ${slot} trống, nên ${k} không có trong bảng. Lần tìm trượt tốn ${i + 1} lần dò.`
          : `Dò: cả 11 lần dò đều gặp khoá khác mà không gặp ô trống nào, nên ${k} không có trong bảng.`;
      case 'done':
        return `Xong. Móc nối thực hiện ${f.chainCompares} phép so sánh; ${name} đã xem ${f.probes} ô${f.failed ? ` và không đặt được ${f.failed} khoá` : ''}.`;
    }
  },

  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Dò tuyến tính, 11 ô, h(k) = k mod 11. Chèn 12, 13, 14, rồi 1 vào một bảng rỗng. Khoá 1 nằm ở ô nào?',
      answer: 4,
      hints: [
        '12, 13 và 14 nằm đúng ô gốc của chúng: các ô 1, 2 và 3.',
        'Ô gốc của 1 là ô 1; mỗi lần dò tiến thêm một ô.',
      ],
      solution:
        'h(1) = 1 đã có 12, ô 2 có 13, ô 3 có 14, còn ô 4 trống: khoá 1 vào ô 4 sau 3 lần va chạm. Nạp bộ “Ô gốc dồn cụm” với dò tuyến tính để xem tận mắt.',
    },
    {
      type: 'number',
      prompt: 'Băm kép với h₂(k) = 7 − (k mod 7). Ô 8 và ô 2 đã có khoá. Khoá 30 nằm ở ô nào?',
      answer: 7,
      hints: [
        'h(30) = 30 mod 11 = 8 và h₂(30) = 7 − 2 = 5.',
        'Các lần dò là 8, 8 + 5, 8 + 10, … mod 11.',
      ],
      solution:
        'Lần dò 0 là ô 8 (có khoá), lần dò 1 là (8 + 5) mod 11 = 2 (có khoá), lần dò 2 là (8 + 10) mod 11 = 7, ô này trống. Nạp bộ “Hỗn hợp” với băm kép để kiểm tra.',
    },
    {
      type: 'number',
      prompt:
        'Nạp bộ “Cùng ô gốc” với dò tuyến tính: 0, 11, 22, 33, 44, 55 và 66 lấp đầy các ô từ 0 đến 6. Phép tìm 77 dò bao nhiêu ô rồi mới dừng?',
      answer: 8,
      unit: 'ô',
      hints: [
        '77 mod 11 = 0, nên phép tìm bắt đầu ở ô 0.',
        'Một lần tìm trượt dừng ở ô trống đầu tiên.',
      ],
      solution:
        'Các ô 0 đến 6 chứa khoá khác và ô 7 trống, nên phép tìm dò 8 ô rồi báo không tìm thấy. Móc nối sẽ phải so sánh 77 với cả 7 khoá của chuỗi 0.',
    },
    {
      type: 'choice',
      prompt: 'Cách nào có thể không đặt được một khoá dù bảng 11 ô vẫn còn ô trống?',
      options: ['Dò tuyến tính', 'Dò bậc hai', 'Băm kép với kích thước bảng nguyên tố'],
      answer: 1,
      hints: ['Hãy liệt kê i² mod 11 với i = 0, 1, …, 10.'],
      solution:
        'i² mod 11 chỉ nhận các giá trị 0, 1, 4, 9, 5 và 3, nên dò bậc hai chỉ ghé 6 trong 11 ô. Dò tuyến tính ghé đủ mọi ô, băm kép cũng vậy vì bước nhảy không bao giờ bằng 0 và 11 là số nguyên tố.',
    },
  ],
};
