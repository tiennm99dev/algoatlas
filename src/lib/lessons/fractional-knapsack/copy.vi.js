import { gcd } from '$lib/algo-engine/number-theory.js';
/** @typedef {import('$lib/algo-engine/fractional-knapsack.js').KnapFrame} KnapFrame */
/** @typedef {import('$lib/algo-engine/fractional-knapsack.js').JobFrame} JobFrame */

/** Names A, B, C, … in the typed order. @param {number} i */
const name = (i) => String.fromCharCode(65 + i);

/** A number with at most two decimals: 240, 66.67. @param {number} x */
const num = (x) => String(Math.round(x * 100) / 100);

/** A reduced fraction p/q, or 1 for a whole item. @param {number} p @param {number} q */
function fraction(p, q) {
  if (p === q) return '1';
  const g = gcd(p, q);
  return `${p / g}/${q / g}`;
}

export const vi = {
  slug: 'fractional-knapsack',
  topic: 'greedy',
  level: 'Trung bình',
  title: 'Cái túi phân số và lập lịch có hạn chót',
  intro:
    'Hai bài toán mà chỉ một lần sắp xếp và một lượt duyệt là cho đáp án tốt nhất. Trong bài toán cái túi phân số, bạn được cắt nhỏ đồ vật, nên ta xếp vào túi các vật có giá trị trên mỗi ki-lô-gam cao nhất trước và chỉ cắt vật cuối cùng. Trong bài toán lập lịch công việc có hạn chót, mỗi việc chiếm một ô thời gian và chỉ được trả công nếu xong đúng hạn, nên ta nhận các việc có lợi nhuận cao nhất trước, mỗi việc xếp muộn nhất có thể.',
  summary:
    'Xếp đầy cái túi theo giá trị trên mỗi đơn vị khối lượng, chỉ lấy một phần của vật cuối, rồi xếp các việc dài một đơn vị theo lợi nhuận vào ô trống muộn nhất trước hạn chót của chúng.',
  instruction:
    'Chọn một bài toán, nhập các vật hoặc các việc, hoặc nạp một ví dụ, rồi chạy từng bước. Với cái túi, hãy xem thanh đầy dần và vật cuối bị cắt; so sánh các số 0/1 bên dưới phần thống kê. Với lập lịch, hãy xem mỗi việc dò các ô từ hạn chót của nó trở xuống.',
  problemLabel: 'Bài toán',
  problems: { knapsack: 'Cái túi phân số', jobs: 'Công việc có hạn chót' },
  itemsLabel: 'Các vật (giá trị/khối lượng)',
  capacityLabel: 'Sức chứa W',
  jobsLabel: 'Các việc (lợi nhuận/hạn chót)',
  presetLabel: 'Ví dụ',
  presetPlaceholder: 'Nạp một ví dụ…',
  presets: {
    knapsack: {
      textbook: 'Ví dụ trong sách: W = 50',
      pantry: 'Sáu vật: W = 40',
      roomy: 'Vừa hết: W = 100',
    },
    jobs: { classic: 'Năm việc', crowded: 'Chung một hạn chót', urgent: 'Nhiều việc hạn 1' },
  },
  errors: {
    format:
      'Hãy nhập các cặp như 60/10, cách nhau bởi dấu phẩy hoặc dấu cách. Đầu vào hợp lệ gần nhất đã được khôi phục.',
    value: 'Mỗi giá trị và lợi nhuận phải từ 1 đến 999. Đầu vào hợp lệ gần nhất đã được khôi phục.',
    weight: 'Mỗi khối lượng phải từ 1 đến 99. Đầu vào hợp lệ gần nhất đã được khôi phục.',
    deadline: 'Mỗi hạn chót phải từ 1 đến 10. Đầu vào hợp lệ gần nhất đã được khôi phục.',
    count: 'Hãy dùng nhiều nhất 10 vật hoặc việc. Đầu vào hợp lệ gần nhất đã được khôi phục.',
  },
  capacityError:
    'Sức chứa phải là số nguyên từ 1 đến 200. Giá trị hợp lệ gần nhất đã được khôi phục.',
  newInputNotice: 'Đã nạp ví dụ mới.',
  name,
  num,
  fraction,
  /** @param {number} capacity @param {number} room */
  barAria: (capacity, room) => `Cái túi sức chứa ${capacity}, còn trống ${room}.`,
  /** @param {string} item @param {string} part @param {number} weight */
  pieceLabel: (item, part, weight) =>
    `${item}: ${part === '1' ? 'cả vật' : part}, khối lượng ${weight}`,
  /** @param {number} n */
  slotsAria: (n) => `${n} ô thời gian, từ 1 đến ${n}.`,
  slotRow: 'Việc',
  emptySlot: '·',
  legend: {
    current: 'Đang quét',
    packed: 'Đã lấy cả vật hoặc đã xếp',
    cut: 'Bị cắt: chỉ vừa một phần',
    probed: 'Ô đã dò, đã có việc',
  },
  markers: { current: '?', packed: '✓', cut: '½', probed: '✗' },
  table: {
    item: 'Vật',
    value: 'Giá trị',
    weight: 'Khối lượng',
    density: 'Giá trị/khối lượng',
    taken: 'Đã lấy',
    job: 'Việc',
    profit: 'Lợi nhuận',
    deadline: 'Hạn chót',
    status: 'Ô',
  },
  tableTitle: { knapsack: 'Các vật theo thứ tự quét', jobs: 'Các việc theo thứ tự quét' },
  status: { waiting: '—', skipped: 'bỏ qua', none: '0' },
  stats: {
    room: 'Còn trống',
    total: 'Giá trị đã xếp',
    scanned: 'Số vật đã quét',
    profit: 'Lợi nhuận',
    placed: 'Số việc đã xếp',
    probes: 'Số lần dò ô',
    best: 'Tốt nhất có thể',
  },
  zeroOneTitle: 'Nếu không được cắt vật (0/1)',
  /** @param {number} greedy @param {number} best */
  zeroOne: (greedy, best) =>
    `Tham lam theo giá trị/khối lượng xếp được ${greedy}; tốt nhất là ${best}${greedy < best ? ', nên tham lam thua' : ''}.`,
  practiceTitle: 'Tự kiểm tra',
  /** @param {KnapFrame} f */
  describeKnapsack(f) {
    const it = f.current >= 0 ? f.items[f.current] : null;
    const n = f.items.length;
    switch (f.kind) {
      case 'start':
        return `Xếp vào cái túi sức chứa ${f.capacity} từ ${n} vật sao cho tổng giá trị lớn nhất. Được lấy một phần bất kì của một vật, với đúng phần đó của giá trị.`;
      case 'sort':
        return `Sắp xếp theo giá trị trên mỗi đơn vị khối lượng, cao nhất trước: ${f.order.map((i) => `${name(i)} (${num(f.items[i].value / f.items[i].weight)})`).join(', ')}.`;
      case 'consider':
        if (!it) return '';
        return it.weight <= f.room
          ? `${name(f.current)}: giá trị ${it.value}, khối lượng ${it.weight}, ${num(it.value / it.weight)} mỗi đơn vị. Còn trống ${f.room} đơn vị, nên vừa cả vật.`
          : `${name(f.current)}: giá trị ${it.value}, khối lượng ${it.weight}, ${num(it.value / it.weight)} mỗi đơn vị. Chỉ còn trống ${f.room} đơn vị, nên phải cắt vật này.`;
      case 'take': {
        if (!it) return '';
        const t = f.taken[f.current];
        const part = fraction(t, it.weight);
        return part === '1'
          ? `Lấy cả ${name(f.current)}: +${it.value}. Giá trị ${num(f.total)}, còn trống ${f.room} đơn vị.`
          : `Lấy ${part} của ${name(f.current)}: ${t} trong ${it.weight} đơn vị, được ${it.value} · ${part} = ${num((it.value * t) / it.weight)}. Túi đã đầy với giá trị ${num(f.total)}.`;
      }
      case 'full':
        return `Túi đã đầy, nên dừng: ${name(f.current)} và mọi vật sau nó đều ở ngoài.`;
      case 'done': {
        const cut = f.packed.find((i) => f.taken[i] < f.items[i].weight);
        if (cut !== undefined) {
          return `Xong: giá trị ${num(f.total)}, chỉ cắt ${name(cut)}, còn ${fraction(f.taken[cut], f.items[cut].weight)}. Không cách xếp nào tốt hơn, vì mỗi đơn vị chỗ trống đều chứa giá trị trên đơn vị tốt nhất còn lại.`;
        }
        return f.room > 0
          ? `Mọi vật đều vừa nguyên vẹn: giá trị ${num(f.total)}, còn dư ${f.room} đơn vị.`
          : `Mọi vật đều vừa nguyên vẹn và lấp đầy túi vừa khít: giá trị ${num(f.total)}.`;
      }
    }
  },
  /** @param {JobFrame} f @param {number} best */
  describeJobs(f, best) {
    const j = f.current >= 0 ? f.jobs[f.current] : null;
    switch (f.kind) {
      case 'start':
        return `Xếp lịch ${f.jobs.length} việc, mỗi việc dài một ô thời gian, vào các ô từ 1 đến ${f.slots.length}. Một việc chỉ được trả lợi nhuận nếu nằm ở ô không muộn hơn hạn chót của nó.`;
      case 'sort':
        return `Sắp xếp theo lợi nhuận, cao nhất trước: ${f.order.map((i) => `${name(i)} (${f.jobs[i].profit})`).join(', ')}.`;
      case 'consider': {
        if (!j) return '';
        const free = f.slots[(f.probed.at(-1) ?? 1) - 1] < 0;
        return free
          ? `${name(f.current)}: lợi nhuận ${j.profit}, hạn chót ${j.deadline}. Dò các ô từ ${j.deadline} trở xuống: ô ${f.probed.at(-1)} là ô trống muộn nhất.`
          : `${name(f.current)}: lợi nhuận ${j.profit}, hạn chót ${j.deadline}. Các ô ${f.probed.join(', ')} đều đã có việc.`;
      }
      case 'place':
        return `Đặt ${name(f.current)} vào ô ${f.slot}, muộn nhất có thể để giữ các ô sớm còn trống. Lợi nhuận ${f.profit}.`;
      case 'skip':
        return `Bỏ qua ${name(f.current)}: mọi ô tới hạn chót của nó đều đã có một việc lợi nhuận cao hơn.`;
      case 'done':
        return `Xong: lợi nhuận ${f.profit}${f.profit === best ? ', cao nhất mà một lịch bất kì có thể đạt' : ''}. Bỏ qua: ${f.skipped.map(name).join(', ') || 'không có'}.`;
    }
  },
  takeaways: [
    'Cái túi phân số: sắp xếp theo giá trị trên mỗi đơn vị khối lượng rồi đổ các vật vào, tốt nhất trước. Khi đó mỗi đơn vị sức chứa đều giữ giá trị trên đơn vị tốt nhất còn có, nên kết quả tối ưu, và chỉ vật cuối cùng bị cắt.',
    'Cũng quy tắc tham lam (greedy) đó lại thất bại với bài toán cái túi 0/1 (knapsack), nơi không được cắt vật: trên các vật của ví dụ trong sách, nó xếp được 160, trong khi 100 + 120 = 220 vẫn vừa. Bài toán cái túi 0/1 cần quy hoạch động (dynamic programming).',
    'Lập lịch công việc: nhận các việc theo lợi nhuận, cao nhất trước, mỗi việc vào ô trống muộn nhất không quá hạn chót. Xếp một việc muộn giúp giữ các ô sớm cho những việc có hạn chót gấp.',
    'Trực giác về matroid: một họ các tập “độc lập”, trong đó mọi tập con của một tập độc lập cũng độc lập, và một tập độc lập nhỏ hơn luôn có thể thêm một phần tử của một tập độc lập lớn hơn. Các tập việc cùng kịp hạn chót tạo thành một matroid, và trên mọi matroid, quy tắc tham lam theo trọng số đều tối ưu. Các tập vật vừa cái túi thì không: bước hoán đổi thất bại.',
    'Nạp “Ví dụ trong sách: W = 50” và chạy đến bước cuối: giá trị là 240 với 2/3 của C. Sau đó đọc dòng 0/1 bên dưới phần thống kê, và thử sức chứa 60, khi không phải cắt vật nào.',
  ],
  complexityHead: ['Bước', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Sắp xếp các vật hoặc các việc',
      'O(n log n)',
      'Một phép sắp xếp so sánh; giá trị trên khối lượng được so sánh bằng nhân chéo.',
    ],
    [
      'Lượt duyệt cái túi phân số',
      'O(n)',
      'Mỗi vật được xét một lần, và lượt duyệt dừng khi túi đầy.',
    ],
    [
      'Lập lịch công việc, quét các ô',
      'O(n · d)',
      'Mỗi việc dò nhiều nhất d ô từ hạn chót trở xuống; một rừng tập hợp rời nhau (DSU) trên các ô đưa chi phí về gần O(n).',
    ],
    [
      'Cái túi 0/1, quy hoạch động',
      'O(n · W)',
      'Một lượt tham lam không còn đủ; phải thử mọi sức chứa.',
    ],
    ['Bộ nhớ thêm', 'O(n + d)', 'Thứ tự đã sắp xếp, lượng đã lấy và các ô.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Các vật 60/10, 100/20, 120/30 (giá trị/khối lượng) và sức chứa 50. Cái túi phân số đạt giá trị bao nhiêu?',
      answer: 240,
      hints: [
        'Giá trị trên mỗi đơn vị là 6, 5 và 4, nên lấy theo đúng thứ tự đó.',
        'Sau hai vật đầu, còn trống 20 đơn vị cho vật nặng 30.',
      ],
      solution:
        'Lấy cả A (60) và B (100), rồi 20/30 = 2/3 của C, được 120 · 2/3 = 80: 60 + 100 + 80 = 240.',
    },
    {
      type: 'text',
      prompt: 'Cũng cái túi đó, phần nào của vật C được lấy?',
      accept: ['2/3', '20/30', '0.67', '0,67', '0.667', '0,667', 'hai phần ba'],
      hints: ['C nặng 30.', 'A và B dùng hết 30 trong 50 đơn vị.'],
      solution: 'Còn trống 20 đơn vị và C nặng 30, nên lấy được 20/30 = 2/3 của nó.',
    },
    {
      type: 'number',
      prompt:
        'Giờ không được cắt vật. Quy tắc tham lam theo giá trị trên khối lượng xếp được bao nhiêu với cùng các vật và sức chứa đó?',
      answer: 160,
      hints: [
        'Nó vẫn lấy cả A và B như trước.',
        'C không còn vừa nguyên vẹn trong 20 đơn vị còn lại.',
      ],
      solution:
        'Tham lam xếp A + B = 160 và phải bỏ C. Cách xếp 0/1 tốt nhất là B + C = 220, nên tham lam không tối ưu khi không được cắt vật.',
    },
    {
      type: 'number',
      prompt:
        'Các việc (lợi nhuận/hạn chót) 100/2, 19/1, 27/2, 25/1, 15/3, mỗi việc dài một ô. Lập lịch tham lam thu được lợi nhuận bao nhiêu?',
      answer: 142,
      hints: [
        'Nhận các việc theo thứ tự 100, 27, 25, 19, 15.',
        'Việc 100 chiếm ô 2, nên việc 27 chiếm ô 1.',
      ],
      solution:
        'Việc 100 vào ô 2, việc 27 vào ô 1, việc 25 và 19 (hạn chót 1) thấy ô 1 đã có việc, và việc 15 vào ô 3: 100 + 27 + 15 = 142.',
    },
    {
      type: 'choice',
      prompt:
        'Vì sao tham lam theo trọng số giải được bài toán lập lịch công việc nhưng không giải được cái túi 0/1?',
      options: [
        'Vì hạn chót của các việc là số nguyên',
        'Vì các tập việc khả thi tạo thành một matroid; các tập vừa cái túi thì không',
        'Vì lập lịch sắp xếp theo lợi nhuận, còn cái túi sắp xếp theo khối lượng',
        'Vì cái túi có nhiều vật hơn số ô',
      ],
      answer: 1,
      hints: [
        'Trên một matroid, quy tắc tham lam theo trọng số luôn tối ưu.',
        'Với W = 35, tập chứa một vật nặng 30 có thêm được một vật của tập lớn hơn gồm hai vật nặng 10 không?',
      ],
      solution:
        'Các tập việc cùng kịp hạn chót thoả tính chất hoán đổi của matroid: một tập nhỏ hơn như vậy luôn nhận thêm được một việc từ tập lớn hơn. Các tập vừa cái túi phá vỡ tính chất này: với W = 35, tập chứa một vật nặng 30 không nhận thêm được vật nào của tập lớn hơn gồm hai vật nặng 10. Thiếu tính chất đó, tham lam có thể thua, như 160 so với 220 cho thấy.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo là Luyện tập: bài toán tham lam, nơi bạn tự phân biệt quy tắc tham lam đúng và sai.',
};
