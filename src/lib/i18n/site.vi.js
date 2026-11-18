export const site = {
  title: 'TinTưởng',
  tagline: 'Học cấu trúc dữ liệu và thuật toán bằng cách chạy từng bước',
  description:
    'TinTưởng là chuyến tham quan có tương tác qua các cấu trúc dữ liệu và thuật toán. Mỗi bài chạy thuật toán thật trên đầu vào do em chọn: tiến từng bước, lùi lại và xem chi phí tăng dần.',
};

export const hub = {
  topicsTitle: 'Chủ đề',
  howTitle: 'Mỗi bài học diễn ra thế nào',
  how: [
    { title: 'Chạy', body: 'Thuật toán thật chạy trên đầu vào của em và ghi lại mọi bước.' },
    {
      title: 'Đi từng bước',
      body: 'Phát, tạm dừng, lùi lại hoặc kéo thanh bước, kèm dòng mã giả tương ứng được tô sáng.',
    },
    {
      title: 'Thay đổi',
      body: 'Sửa đầu vào và xem số bước tăng hay giảm ra sao.',
    },
  ],
  /**
   * The topic title lower-cased mid-sentence, except a leading acronym ("BFS", "DSU").
   * @param {string} topic
   */
  startCta: (topic) =>
    `Bắt đầu với ${/^\p{Lu}{2}/u.test(topic) ? topic : topic.charAt(0).toLowerCase() + topic.slice(1)}`,
  /** @param {number} level */
  levelLabel: (level) => `Phần ${level}`,
  /** @param {number} ready @param {number} planned */
  lessonCount: (ready, planned) => `${ready}/${planned} bài đã sẵn sàng`,
  comingSoon: 'Sắp ra mắt',
};

export const glossary = {
  title: 'Thuật ngữ',
  lead: 'Nghĩa tiếng Việt và giải thích ngắn gọn của các thuật ngữ trong bài học.',
  searchLabel: 'Tìm thuật ngữ',
  /** @param {number} n */
  found: (n) => (n === 0 ? 'Không tìm thấy thuật ngữ nào.' : `Tìm thấy ${n} thuật ngữ`),
  jumpLabel: 'Đến chữ cái',
  /** @param {number} n */
  count: (n) => `${n} thuật ngữ`,
  meaning: 'Nghĩa:',
  learnedIn: 'Học ở:',
  seeAlso: 'Xem thêm:',
  lessonTitle: 'Thuật ngữ trong bài',
  viewAll: 'Xem tất cả thuật ngữ',
  homeBody:
    'Tra nghĩa tiếng Việt của stack, queue, hash table, BFS và các thuật ngữ khác, kèm bài học giải thích từng thuật ngữ.',
  empty: 'Thuật ngữ đang được cập nhật.',
};

export const stub = {
  /** @type {Record<import('$lib/curriculum/index.js').LessonKind, string>} */
  kinds: { theory: 'Lý thuyết', practice: 'Luyện tập', review: 'Ôn tập' },
  /** @param {string} title */
  metaDescription: (title) => `${title} là bài học TinTưởng đã lên kế hoạch nhưng chưa viết.`,
  notice: 'Bài này đã có trong kế hoạch nhưng chưa được viết. Dưới đây là những gì bài sẽ có.',
  keyIdeasTitle: 'Bài này sẽ có',
  interactiveTitle: 'Phần tương tác dự kiến',
};

export const moved = {
  title: 'Bài học đã chuyển chỗ',
  body: 'Bài học giờ nằm ở địa chỉ mới. Trình duyệt sẽ tự đưa em đến đó.',
  link: 'Đến bài học',
};

export const notFound = {
  title: 'Không tìm thấy trang',
  body: 'Đường dẫn có thể đã cũ hoặc bị gõ sai. Mọi bài học đều cách trang chủ một cú nhấp chuột.',
  home: 'Về trang chủ TinTưởng',
  /** @param {number} status */
  other: (status) => `Đã có lỗi xảy ra (mã ${status}). Hãy thử tải lại trang.`,
};

export const lessonChrome = {
  backToTopic: /** @param {string} title */ (title) => `Các bài trong ${title}`,
  backToHub: 'Tất cả chủ đề',
  pseudocodeTitle: 'Mã giả',
  takeawaysTitle: 'Ghi nhớ',
  complexityTitle: 'Độ phức tạp',
  complexityNote:
    'O(…) cho biết số bước tăng thế nào theo kích thước đầu vào n; các hằng số được bỏ qua.',
  tryIt: 'Thử xem:',
  lessonNavLabel: 'Điều hướng bài học',
  previous: 'Bài trước',
  next: 'Bài sau',
  complexityHead: ['Trường hợp', 'Chi phí', 'Vì sao'],
  navLabel: 'Điều hướng chính',
  skipLink: 'Bỏ qua đến nội dung',
  sourceLink: 'Mã nguồn',
};

/** Lesson difficulty within a topic, as the hubs and the lesson header show it. */
export const lessonLevels = ['Cơ bản', 'Trung bình', 'Nâng cao'];

export const controls = {
  groupLabel: 'Điều khiển phát',
  first: 'Về bước đầu',
  back: 'Bước trước',
  play: 'Phát',
  replay: 'Phát lại',
  pause: 'Tạm dừng',
  step: 'Bước tiếp',
  last: 'Đến bước cuối',
  speed: 'Tốc độ',
  scrub: 'Bước',
  stepOf: /** @param {number} i @param {number} n */ (i, n) => `Bước ${i}/${n}`,
  stoppedAt: /** @param {number} i @param {number} n */ (i, n) =>
    i === n ? `Đã xong ở bước ${n}/${n}.` : `Đã dừng ở bước ${i}/${n}.`,
  shortcuts:
    'Phím tắt: mũi tên trái và phải để lùi hoặc tiến một bước; phím cách để phát hoặc tạm dừng sau khi em nhấp vào hình minh hoạ. Tốc độ 1× là một bước mỗi giây.',
};

export const practice = {
  title: 'Luyện tập',
  /** @param {number} solved @param {number} total */
  progress: (solved, total) => `Đã giải ${solved}/${total}`,
  /** @param {number} i @param {number} n */
  questionOf: (i, n) => `Câu ${i}/${n}`,
  solved: 'Đã giải',
  check: 'Kiểm tra',
  answerLabel: 'Câu trả lời của em',
  /** @param {string} unit */
  unitHint: (unit) => `Đơn vị: ${unit}`,
  /** @param {number} shown @param {number} total */
  showHint: (shown, total) => (shown === 0 ? 'Xem gợi ý' : `Gợi ý tiếp (${shown}/${total})`),
  /** @param {number} i @param {number} n */
  hintTitle: (i, n) => `Gợi ý ${i}/${n}`,
  showSolution: 'Xem lời giải',
  solutionTitle: 'Lời giải',
  resetProgress: 'Làm lại từ đầu',
  orderListLabel: 'Sắp xếp các mục',
  /** @param {string} item */
  moveUp: (item) => `Đưa “${item}” lên`,
  /** @param {string} item */
  moveDown: (item) => `Đưa “${item}” xuống`,
  /** @param {string} item @param {number} at @param {number} n */
  moved: (item, at, n) => `“${item}” giờ ở vị trí ${at}/${n}.`,
  pickAll: 'Chọn mọi phương án đúng.',
  /** @type {Record<import('$lib/components/answer-check.js').CheckReason, string>} */
  feedback: {
    correct: 'Đúng rồi!',
    empty: 'Em hãy trả lời trước khi kiểm tra.',
    incomplete: 'Hãy xếp đủ mọi mục rồi mới kiểm tra.',
    invalid: 'Hãy nhập một số, ví dụ 42 hoặc 3,5.',
    unit: 'Giá trị đúng rồi, nhưng đơn vị chưa đúng.',
    wrong: 'Chưa đúng, thử lại nhé. Em có thể mở gợi ý.',
  },
};

/** Spoken names of the three linear containers. */
const containerNames = { stack: 'Stack', queue: 'Queue', deque: 'Deque' };

export const visuals = {
  /** Default spoken names for the shared state palette; lessons may pass their own labels. */
  states: {
    compare: 'đang so sánh',
    swap: 'vừa ghi',
    sorted: 'đã xong',
    active: 'đang xét',
    frontier: 'đang chờ',
    visited: 'đã thăm',
    path: 'trên đường đi',
    pruned: 'đã cắt tỉa',
  },
  scroller: 'Hình vẽ, cuộn ngang được',
  /** @param {number} i @param {string} value @param {string} state */
  cell: (i, value, state) => `Chỉ số ${i}: ${value}${state ? `, ${state}` : ''}`,
  /** @param {string} name @param {number} i */
  pointer: (name, i) => `${name} ở ${i}`,
  /** @param {string} label @param {number} from @param {number} to */
  window: (label, from, to) => `${label} phủ từ ${from} đến ${to - 1}`,
  nullLabel: 'null',
  /** @param {string[]} labels @param {boolean} doubly @param {boolean} circular */
  listSummary: (labels, doubly, circular) =>
    `Linked list ${doubly ? 'đôi' : 'đơn'}${circular ? ', vòng' : ''}: ${labels.length === 0 ? 'rỗng' : labels.join(' → ')}`,
  top: 'đỉnh',
  bottom: 'đáy',
  front: 'đầu',
  back: 'cuối',
  /** @param {'stack' | 'queue' | 'deque'} kind @param {string[]} labels */
  containerSummary: (kind, labels) =>
    labels.length === 0
      ? `${containerNames[kind]} đang rỗng.`
      : kind === 'stack'
        ? `Stack, từ đáy lên đỉnh: ${labels.join(', ')}.`
        : `${containerNames[kind]}, từ đầu đến cuối: ${labels.join(', ')}.`,
  emptyTree: 'Cây đang rỗng.',
  /** @param {string} label @param {string} state @param {number} depth */
  treeNode: (label, state, depth) => `${label}, độ sâu ${depth}${state ? `, ${state}` : ''}`,
  treeKeys:
    'Phím mũi tên di chuyển giữa các nút: lên để đến cha, xuống để đến con đầu tiên, trái và phải để đến nút anh em.',
  /** @param {number} i @param {string} value */
  heapSlot: (i, value) => `Ô ${i}: ${value}`,
  heapSorted: 'đã xếp',
  /** @param {number[]} values @param {number} size */
  heapSummary: (values, size) =>
    size === 0
      ? 'Heap đang rỗng.'
      : `Heap gồm ${size} phần tử, dạng mảng: ${values.slice(0, size).join(', ')}.`,
  /** @param {number} i @param {number} parent */
  ufParent: (i, parent) => (i === parent ? `${i} là gốc` : `cha của ${i} là ${parent}`),
  /** @param {number} sets @param {number} n */
  ufSummary: (sets, n) => `${n} phần tử thuộc ${sets} tập.`,
  parentRow: 'cha',
  /** @param {number} r @param {number} c @param {string} value @param {string} state */
  dpCell: (r, c, value, state) =>
    `Hàng ${r}, cột ${c}: ${value === '' ? 'trống' : value}${state ? `, ${state}` : ''}`,
  dpKeys: 'Phím mũi tên di chuyển giữa các ô; Home và End nhảy đến đầu và cuối hàng.',
  graph: {
    tools: 'Công cụ sửa',
    move: 'Chọn',
    connect: 'Nối',
    remove: 'Xoá',
    addNode: 'Thêm đỉnh',
    weight: 'Trọng số cạnh mới',
    /** @param {string} label @param {string} state @param {number} degree */
    node: (label, state, degree) => `Đỉnh ${label}, ${degree} cạnh${state ? `, ${state}` : ''}`,
    /** @param {number} nodes @param {number} edges @param {boolean} directed */
    summary: (nodes, edges, directed) =>
      `Đồ thị ${directed ? 'có hướng' : 'vô hướng'} gồm ${nodes} đỉnh và ${edges} cạnh.`,
    keys: 'Dùng Tab để đến các đỉnh, rồi dùng phím mũi tên để di chuyển giữa chúng và Enter để dùng công cụ đang chọn. Giữ Shift kèm phím mũi tên để dịch đỉnh một chút.',
    /** @param {string} label */
    pickTarget: (label) => `Từ ${label}: chọn đỉnh để nối hoặc bỏ nối.`,
    /** @param {string[]} ends @param {boolean} directed */
    removeEdge: ([a, b], directed) =>
      directed ? `Xoá cạnh từ ${a} đến ${b}` : `Xoá cạnh giữa ${a} và ${b}`,
    full: 'Đồ thị đã đầy.',
    selfLoop: 'Một cạnh cần hai đỉnh khác nhau.',
  },
};
