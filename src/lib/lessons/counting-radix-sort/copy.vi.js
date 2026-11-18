/** @typedef {import('$lib/algo-engine/counting-radix-sort.js').CountingFrame} CountingFrame */
/** @typedef {import('$lib/algo-engine/counting-radix-sort.js').RadixFrame} RadixFrame */

/** @param {number} place */
const placeName = (place) =>
  ({ 1: 'hàng đơn vị', 10: 'hàng chục', 100: 'hàng trăm' })[place] ?? `hàng ${place}`;

export const vi = {
  slug: 'counting-radix-sort',
  topic: 'sorting',
  level: 'Trung bình',
  title: 'Counting sort và radix sort',
  intro:
    'Khi các khoá là số nguyên nhỏ, ta có thể sắp xếp mà không cần so sánh chúng. Counting sort (sắp xếp đếm) đếm xem mỗi khoá xuất hiện bao nhiêu lần rồi tính ra khối của từng khoá bắt đầu ở đâu. Radix sort (sắp xếp theo cơ số) chạy một lượt sắp xếp ổn định cho từng chữ số, bắt đầu từ chữ số hàng đơn vị. Cả hai đều chạy trong thời gian tuyến tính khi các khoá ngắn.',
  summary:
    'Đi từng bước qua các lần đếm và tổng cộng dồn của counting sort, rồi xem radix sort chia số vào các ngăn theo chữ số qua từng lượt, mà không cần so sánh hai khoá nào.',
  instruction:
    'Chọn một thuật toán, gõ các khoá hoặc bấm Ngẫu nhiên, rồi đi từng bước. Với counting sort, để ý hàng count chuyển từ số lần đếm thành vị trí cuối khối. Với radix sort, để ý mỗi số rơi vào ngăn ứng với chữ số được gạch chân.',
  algorithmLabel: 'Thuật toán',
  algorithms: { counting: 'Counting sort', radix: 'Radix sort' },
  keysLabel: { counting: 'Các khoá (0–9)', radix: 'Các khoá (0–999)' },
  randomButton: 'Ngẫu nhiên',
  keyErrors: {
    format: 'Hãy gõ các số nguyên, cách nhau bằng dấu phẩy hoặc dấu cách, ví dụ 2, 5, 3.',
    range: {
      counting: 'Ở đây counting sort nhận các khoá từ 0 đến 9.',
      radix: 'Mọi khoá phải nằm trong khoảng 0–999.',
    },
    count: 'Hãy gõ từ 2 đến 12 khoá.',
  },
  inputTitle: 'Đầu vào a',
  countTitle: 'count, đánh chỉ số theo khoá',
  outputTitle: 'Đầu ra out',
  arrayTitle: 'Mảng a',
  bucketsTitle: 'Các ngăn theo chữ số',
  /** @param {number} place */
  digitNote: (place) =>
    place ? `Chữ số ${placeName(place)} được gạch chân; nó quyết định ngăn.` : '',
  inputAria: 'Mảng đầu vào a',
  countAria: 'Mảng count, mỗi khoá một ô',
  outputAria: 'Mảng đầu ra',
  arrayAria: 'Mảng a',
  /** @param {number} d @param {number[]} values */
  bucketAria: (d, values) => `Ngăn ${d}: ${values.length === 0 ? 'rỗng' : values.join(', ')}`,
  tagNote: 'Các chữ a, b, c phân biệt các khoá bằng nhau theo thứ tự đầu vào.',
  stats: {
    steps: 'Số bước lặp',
    budget: 'n + k + n',
    passes: 'Số lượt',
    moves: 'Số lần di chuyển',
    perPass: 'Mỗi lượt di chuyển: n vào, n ra',
  },
  legend: {
    read: 'Đang đọc',
    write: 'Vừa ghi',
    done: 'Đã đặt',
    drop: 'Đang thả vào ngăn (dấu: chữ số của nó)',
    dropped: 'Đã nằm trong ngăn',
    arrived: 'Vừa gom về hoặc vừa thả',
    sorted: 'Đã xếp xong',
  },
  markers: { read: '?', write: '⇄', done: '✓', dropped: '↓', arrived: '⇄', sorted: '✓' },
  states: {
    read: 'đang đọc',
    write: 'vừa ghi',
    done: 'đã đặt',
    dropped: 'đã nằm trong ngăn',
    sorted: 'đã xếp xong',
  },
  /** @param {number} i @param {string} value @param {string} state */
  cellLabel: (i, value, state) =>
    `Ô ${i}: ${value === '' ? 'trống' : value}${state ? `, ${state}` : ''}`,
  /**
   * @param {CountingFrame} f
   * @param {(id: number) => string} tag  letter of an item among equal keys
   */
  describeCounting(f, tag) {
    const k = f.count.length - 1;
    switch (f.kind) {
      case 'start':
        return `Khoá lớn nhất là ${k}, nên count có ${k + 1} ô, đều bằng 0. Không có hai khoá nào được so sánh với nhau.`;
      case 'count':
        return `a[${f.i}] = ${f.v}: tăng count[${f.v}] thêm một, giờ nó bằng ${f.count[f.v]}.`;
      case 'prefix':
        return `count[${f.v}] += count[${f.v - 1}]: có ${f.count[f.v]} khoá ≤ ${f.v}, nên khối các số ${f.v} kết thúc ngay trước ô ${f.count[f.v]}.`;
      case 'place': {
        const item = f.input[f.i];
        return `a[${f.i}] = ${item.value}${tag(item.id)}: count[${f.v}] giảm còn ${f.pos}, nên nó vào out[${f.pos}], ô trống cuối cùng trong khối của nó.`;
      }
      case 'done':
        return `Đã sắp xếp xong sau ${f.steps} bước lặp: n = ${f.input.length} bước đếm, k = ${k} bước cộng dồn, n bước đặt. Các khoá bằng nhau giữ đúng thứ tự đầu vào.`;
    }
  },
  /** @param {RadixFrame} f */
  describeRadix(f) {
    switch (f.kind) {
      case 'start': {
        const max = Math.max(0, ...f.items.map((it) => it.value));
        return `Khoá lớn nhất, ${max}, có ${String(max).length} chữ số, nên radix sort chạy đúng chừng ấy lượt, bắt đầu từ chữ số hàng đơn vị.`;
      }
      case 'pass':
        return `Lượt ${f.passes}: sắp xếp theo chữ số ${placeName(f.place)}. Bắt đầu với mười ngăn rỗng.`;
      case 'drop': {
        const x = f.items[f.i].value;
        return `${x} có chữ số ${placeName(f.place)} là ${f.digit}: thêm nó vào cuối ngăn ${f.digit}.`;
      }
      case 'collect':
        return `Đọc lần lượt các ngăn 0 đến 9 trở lại vào a. Trong mỗi ngăn, các số giữ đúng thứ tự chúng được thả vào, nên kết quả của các chữ số trước không bị phá.`;
      case 'done':
        return `Đã sắp xếp xong sau ${f.passes} lượt và ${f.moves} lần di chuyển, mà không so sánh hai khoá nào.`;
    }
  },
  takeaways: [
    'Counting sort dùng mỗi khoá làm chỉ số mảng: đếm các khoá, rồi tổng cộng dồn biến count[v] thành vị trí cuối của khối dành cho khoá v.',
    'Đặt các phần tử từ phải sang trái, mỗi phần tử vào ô trống cuối cùng trong khối của nó, sẽ giữ các khoá bằng nhau đúng thứ tự đầu vào: counting sort ổn định (stable).',
    'Thuật toán tốn O(n + k) thời gian và bộ nhớ, với k là khoá lớn nhất, nên chỉ có lợi khi k không lớn hơn n quá nhiều.',
    'Radix sort chạy một lượt ổn định cho mỗi chữ số, từ chữ số thấp nhất trở lên. Với d chữ số, nó tốn O(d·(n + 10)), tức tuyến tính khi d là một hằng số nhỏ. Nó không bị cận n log n giới hạn, vì nó không bao giờ so sánh hai khoá.',
    'Thử radix sort trên 21, 12, 22, 11: sau lượt hàng đơn vị, thứ tự trông có vẻ sai, nhưng lượt hàng chục giữ nguyên thứ tự các số có cùng chữ số hàng chục và hoàn tất công việc.',
  ],
  complexityHead: ['Thuật toán', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Counting sort, thời gian',
      'O(n + k)',
      'Một lượt để đếm, k bước để cộng dồn, một lượt để đặt.',
    ],
    ['Counting sort, bộ nhớ', 'O(n + k)', 'Mảng count và một mảng đầu ra riêng.'],
    [
      'Radix sort, thời gian',
      'O(d·(n + b))',
      'd lượt theo chữ số, mỗi lượt đụng tới n phần tử và b = 10 ngăn.',
    ],
    ['Radix sort, bộ nhớ', 'O(n + b)', 'Các ngăn giữ mỗi phần tử một lần trong mỗi lượt.'],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Counting sort trên 2, 5, 3, 0, 2, 3, 0, 3. Sau vòng lặp cộng dồn, count[3] bằng bao nhiêu?',
      answer: 7,
      hints: [
        'Trước hết là số lần đếm: hai số 0, không có số 1, hai số 2, ba số 3.',
        'count[3] là số khoá ≤ 3.',
      ],
      solution:
        'Số lần đếm của các khoá 0 đến 5 là 2, 0, 2, 3, 0, 1. Các tổng cộng dồn là 2, 2, 4, 7, 7, 8, nên count[3] = 7: có bảy khoá ≤ 3, và các số 3 lấp các ô 4 đến 6.',
    },
    {
      type: 'text',
      prompt:
        'Radix sort trên 170, 45, 75, 90, 802, 24, 2, 66. Gõ mảng sau lượt đầu tiên (chữ số hàng đơn vị), các số cách nhau bằng dấu phẩy.',
      accept: [
        '170, 90, 802, 2, 24, 45, 75, 66',
        '170 90 802 2 24 45 75 66',
        '170,90,802,2,24,45,75,66',
        '[170, 90, 802, 2, 24, 45, 75, 66]',
      ],
      hints: [
        'Ngăn 0 nhận 170 và 90, ngăn 2 nhận 802 và 2, theo đúng thứ tự đó.',
        'Rồi đến ngăn 4 (24), ngăn 5 (45, 75) và ngăn 6 (66).',
      ],
      solution:
        'Theo chữ số hàng đơn vị: ngăn 0 giữ 170, 90; ngăn 2 giữ 802, 2; ngăn 4 giữ 24; ngăn 5 giữ 45, 75; ngăn 6 giữ 66. Nối lại: 170, 90, 802, 2, 24, 45, 75, 66.',
    },
    {
      type: 'number',
      prompt: 'Radix sort chạy bao nhiêu lượt trên 1000 khoá từ 0 đến 999?',
      answer: 3,
      unit: 'lượt',
      hints: ['Số lượt phụ thuộc vào số chữ số của khoá lớn nhất, không phụ thuộc vào n.'],
      solution:
        '999 có ba chữ số thập phân, nên có ba lượt: hàng đơn vị, hàng chục, hàng trăm. Mỗi lượt đụng tới cả 1000 khoá.',
    },
    {
      type: 'choice',
      prompt: 'Vì sao mỗi lượt của radix sort phải ổn định?',
      options: [
        'Để các khoá có cùng chữ số ở lượt này giữ nguyên thứ tự mà các chữ số thấp hơn, ở các lượt trước, đã xếp',
        'Để lượt đó tốn ít bộ nhớ hơn',
        'Để có thể đọc các ngăn theo thứ tự bất kì',
        'Tính ổn định không quan trọng với radix sort',
      ],
      answer: 0,
      hints: ['Nghĩ về 21 và 22 ở lượt hàng chục: cả hai đều có chữ số hàng chục là 2.'],
      solution:
        'Sau lượt hàng đơn vị, 21 đứng trước 22. Ở lượt hàng chục, hai số có cùng chữ số, và một lượt ổn định giữ 21 đứng trước. Một lượt không ổn định có thể đổi chỗ chúng và phá kết quả của lượt hàng đơn vị.',
    },
  ],
  nextTeaser:
    'Bài tiếp theo là ứng dụng của sắp xếp: những bài toán trở nên dễ hơn hẳn khi dữ liệu đã được sắp xếp.',
};
