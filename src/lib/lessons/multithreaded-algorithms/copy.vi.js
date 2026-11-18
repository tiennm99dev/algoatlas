/** @typedef {import('$lib/algo-engine/multithreaded-algorithms.js').ScheduleFrame} ScheduleFrame */
/** @typedef {import('$lib/algo-engine/multithreaded-algorithms.js').Strand} Strand */
/** @typedef {import('$lib/algo-engine/multithreaded-algorithms.js').Dag} Dag */
/** @typedef {import('$lib/algo-engine/multithreaded-algorithms.js').StrandState} StrandState */

/** At most two decimals, with no trailing zeros. @param {number} v */
const num = (v) => String(Math.round(v * 100) / 100);

/** @param {Strand} s */
const strandName = (s) => {
  switch (s.kind) {
    case 'leaf':
      return `P-FIB(${s.arg}) trả về`;
    case 'fork':
      return `P-FIB(${s.arg}) spawn`;
    case 'join':
      return `P-FIB(${s.arg}) cộng`;
    case 'base':
      return `trường hợp cơ sở [${s.arg}]`;
    case 'split':
      return `chia ${s.arg}–${s.end}`;
    case 'merge':
      return `trộn ${s.arg}–${s.end}`;
  }
};

/** @type {Record<StrandState, string>} */
const STATE_NAMES = {
  waiting: 'đang chờ đầu vào',
  ready: 'sẵn sàng',
  running: 'đang chạy',
  done: 'đã xong',
};

export const vi = {
  slug: 'multithreaded-algorithms',
  topic: 'computation-models',
  level: 'Trung bình',
  title: 'Thuật toán đa luồng',
  intro:
    'Một chương trình đa luồng nói rõ phần nào được chạy song song bằng hai từ khoá: spawn bắt đầu một lời gọi có thể chạy song song với hàm cha, còn sync chờ mọi lời gọi đã spawn chạy xong. Một lần chạy của nó là một DAG gồm các mạch lệnh, và hai con số dự đoán tốc độ của nó trên mọi máy: khối lượng công việc (work) T₁, tức tổng thời gian của mọi mạch, và độ dài đường găng (span) T∞, tức đường đi dài nhất qua DAG.',
  summary:
    'Lập lịch DAG tính toán của P-FIB hoặc của sắp xếp trộn song song trên 1 đến 8 bộ xử lí, và xem work, span cùng cận Brent quyết định thời gian chạy ra sao.',
  instruction:
    'Chọn một chương trình và kích thước của nó, đặt số bộ xử lí P, rồi chạy từng bước lịch tham lam. Ở mỗi bước, mỗi bộ xử lí chạy một bước của một mạch; P1, P2, … cho biết bộ nào chạy mạch nào. So số bước với work, span và bảng hệ số tăng tốc.',
  programLabel: 'Chương trình',
  programs: { fib: 'P-FIB(n)', mergesort: 'Sắp xếp trộn song song' },
  /** @param {'fib'|'mergesort'} program */
  sizeLabel: (program) => (program === 'fib' ? 'n' : 'Số phần tử n'),
  processorsLabel: 'Số bộ xử lí P',
  criticalLabel: 'Hiện một đường găng',
  dagTitle: 'DAG tính toán',
  /** @param {Dag} dag */
  dagAria: (dag) =>
    `DAG tính toán gồm ${dag.strands.length} mạch: work ${dag.work}, span ${dag.span}.`,
  /** @param {Strand} s */
  short: (s) => {
    switch (s.kind) {
      case 'leaf':
        return String(s.arg);
      case 'fork':
        return `F${s.arg}`;
      case 'join':
        return `J${s.arg}`;
      case 'base':
        return String(s.arg);
      case 'split':
        return 'S';
      case 'merge':
        return `M${s.end - s.arg + 1}`;
    }
  },
  strandName,
  /** @param {Strand} s @param {StrandState} state @param {number} left @param {number} proc @param {boolean} critical */
  strandLabel: (s, state, left, proc, critical) =>
    `${strandName(s)}: ${s.cost} bước, ${STATE_NAMES[state]}${state === 'running' ? ` trên bộ xử lí ${proc + 1}, còn ${left} bước` : ''}${critical ? ', trên đường găng' : ''}.`,
  /** @param {number} proc */
  procMarker: (proc) => `P${proc + 1}`,
  markers: { ready: '○', done: '✓' },
  legend: {
    running: 'P1 Đang chạy trên bộ xử lí 1',
    ready: '○ Sẵn sàng, đang chờ bộ xử lí',
    done: '✓ Đã xong',
    waiting: 'Đang chờ đầu vào',
    critical: 'Một đường găng (span)',
  },
  legendNote:
    'F là rẽ nhánh (spawn), J là hợp nhánh (sync), S là chia, M8 trộn 8 phần tử trong 8 bước.',
  stats: {
    work: 'Work T₁',
    span: 'Span T∞',
    parallelism: 'Độ song song T₁/T∞',
    time: 'Bước / T_P',
    usage: 'Bận / rảnh',
    brent: 'Brent: T₁/P + T∞',
  },
  /** @param {number} t @param {number} total */
  time: (t, total) => `${t} / ${total}`,
  /** @param {number} busy @param {number} idle */
  usage: (busy, idle) => `${busy} / ${idle}`,
  num,
  speedupTitle: 'Hệ số tăng tốc theo số bộ xử lí',
  speedupHead: ['P', 'T_P', 'T₁/T_P'],
  currentRow: '◀',
  /** @param {ScheduleFrame} f @param {Dag} dag */
  describe(f, dag) {
    switch (f.kind) {
      case 'start':
        return `${dag.strands.length} mạch: work T₁ = ${dag.work}, span T∞ = ${dag.span}, nên không lịch nào trên ${f.p} bộ xử lí có thể chạy ít hơn max(T₁/P, T∞) = ${num(Math.max(dag.work / f.p, dag.span))} bước.`;
      case 'step': {
        const runs = f.running
          .map((id) => `P${f.proc[id] + 1} chạy ${strandName(dag.strands[id])}`)
          .join('; ');
        const idle = f.p - f.running.length;
        const tail =
          f.ready > 0
            ? ` ${f.ready} mạch sẵn sàng đang chờ bộ xử lí.`
            : idle > 0
              ? ` ${idle} bộ xử lí rảnh: không còn mạch nào sẵn sàng.`
              : '';
        return `Bước ${f.t}: ${runs}.${tail}`;
      }
      case 'done':
        return `Xong sau T_P = ${f.t} bước trên ${f.p} bộ xử lí, hệ số tăng tốc ${num(dag.work / f.t)}. Định luật work T_P ≥ T₁/P = ${num(dag.work / f.p)}, định luật span T_P ≥ T∞ = ${dag.span}, và cận Brent T_P ≤ T₁/P + T∞ = ${num(dag.work / f.p + dag.span)}.`;
    }
  },
  takeaways: [
    'spawn cho một lời gọi chạy song song với phần mã phía sau nó; sync chờ mọi lời gọi con đã spawn. Bỏ cả hai từ khoá đi thì còn lại đúng chương trình tuần tự thông thường.',
    'Work T₁ là thời gian chạy trên một bộ xử lí, còn span T∞ là thời gian chạy trên vô số bộ xử lí. Mọi lịch trên P bộ xử lí đều cần T_P ≥ T₁/P (định luật work) và T_P ≥ T∞ (định luật span).',
    'Bộ lập lịch tham lam, không bao giờ để một bộ xử lí rảnh khi còn mạch sẵn sàng, xong trong vòng T₁/P + T∞ bước, nên chậm hơn lịch tốt nhất không quá 2 lần. Hệ số tăng tốc tăng gần như tuyến tính khi P còn nhỏ hơn nhiều so với độ song song T₁/T∞.',
    'Sắp xếp trộn với các lời gọi đệ quy được spawn có work Θ(n log n) nhưng span Θ(n), vì riêng phép trộn tuần tự ở gốc đã mất n bước; độ song song của nó chỉ là Θ(log n). Trộn song song giảm span xuống Θ(log³ n).',
    'Thử xem: chạy sắp xếp trộn song song trên 16 phần tử và tăng P từ 1 lên 8. Hệ số tăng tốc chững lại gần độ song song 2.71, còn P-FIB(7) vẫn tiếp tục tăng.',
  ],
  complexityHead: ['Đại lượng', 'Chi phí', 'Vì sao'],
  complexity: [
    [
      'Work của P-FIB(n)',
      'Θ(φⁿ)',
      'Cùng các lời gọi như bản tuần tự, mỗi lời gọi tốn một số bước không đổi.',
    ],
    [
      'Span của P-FIB(n)',
      'Θ(n)',
      'Đường đi dài nhất rẽ nhánh xuống n tầng rồi hợp nhánh quay lên.',
    ],
    [
      'Sắp xếp trộn, trộn tuần tự',
      'Work Θ(n log n), span Θ(n)',
      'Hai nửa chạy song song, nhưng mỗi phép trộn là một mạch dài: n + n/2 + … ≤ 2n.',
    ],
    [
      'Sắp xếp trộn, trộn song song',
      'Work Θ(n log n), span Θ(log³ n)',
      'Chia mỗi phép trộn theo trung vị và tìm kiếm nhị phân cho một phép trộn có span Θ(log² n).',
    ],
    [
      'Lịch tham lam',
      'T_P ≤ T₁/P + T∞',
      'Mỗi bước hoặc giữ cả P bộ xử lí bận, hoặc chạy mọi mạch sẵn sàng, làm span còn lại ngắn đi.',
    ],
  ],
  practiceTitle: 'Tự kiểm tra',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Chọn P-FIB với n = 6. Span T∞ của nó là bao nhiêu?',
      answer: 11,
      unit: 'bước',
      hints: ['Đọc ô Span T∞, hoặc đếm các mạch trên đường găng được tô sáng.'],
      solution:
        'Span thoả T∞(n) = T∞(n − 1) + 2 với T∞(1) = 1: mỗi tầng một lần rẽ nhánh và một lần hợp nhánh, nên T∞(6) = 2 · 6 − 1 = 11.',
    },
    {
      type: 'number',
      prompt:
        'Chạy sắp xếp trộn song song trên 16 phần tử với P = 4. Lịch tham lam mất bao nhiêu bước?',
      answer: 45,
      unit: 'bước',
      hints: [
        'Đặt các thanh trượt rồi bấm Đến bước cuối, hoặc đọc hàng P = 4 của bảng hệ số tăng tốc.',
      ],
      solution:
        'T_P = 45. Định luật work cho ít nhất 95/4 = 23.75 và định luật span cho ít nhất 35; cận Brent đảm bảo nhiều nhất 95/4 + 35 = 58.75.',
    },
    {
      type: 'choice',
      prompt:
        'Sắp xếp trộn song song trên 16 phần tử chỉ đạt hệ số tăng tốc 2.5 trên 8 bộ xử lí. Điều gì giới hạn nó?',
      options: [
        'Hai lời gọi đệ quy không thể chạy cùng lúc',
        'Span: các phép trộn tuần tự dọc đường găng mất 16 + 8 + 4 + 2 bước',
        'Bộ lập lịch để bộ xử lí rảnh trong khi vẫn còn mạch sẵn sàng',
        'Work tăng lên khi thêm bộ xử lí',
      ],
      answer: 1,
      hints: ['Bật đường găng và xem nó đi qua những mạch nào.'],
      solution:
        'Không lịch nào nhanh hơn span T∞ = 35, và 30 bước trong số đó là các phép trộn trên đường găng. Độ song song T₁/T∞ = 95/35 ≈ 2.71 chặn trên hệ số tăng tốc, dù chạy bao nhiêu bộ xử lí.',
    },
  ],
  nextTeaser:
    'Bài sau, Thuật toán phân tán, chuyển sang nhiều máy riêng rẽ chỉ trao đổi với nhau qua thông điệp.',
};
