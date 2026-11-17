/** @typedef {import('$lib/algo-engine/multithreaded-algorithms.js').ScheduleFrame} ScheduleFrame */
/** @typedef {import('$lib/algo-engine/multithreaded-algorithms.js').Strand} Strand */
/** @typedef {import('$lib/algo-engine/multithreaded-algorithms.js').Dag} Dag */
/** @typedef {import('$lib/algo-engine/multithreaded-algorithms.js').StrandState} StrandState */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** At most two decimals, with no trailing zeros. @param {number} v */
const num = (v) => String(Math.round(v * 100) / 100);

/** @param {Strand} s */
const strandName = (s) => {
  switch (s.kind) {
    case 'leaf':
      return `P-FIB(${s.arg}) returns`;
    case 'fork':
      return `P-FIB(${s.arg}) spawns`;
    case 'join':
      return `P-FIB(${s.arg}) adds`;
    case 'base':
      return `base case [${s.arg}]`;
    case 'split':
      return `split ${s.arg}–${s.end}`;
    case 'merge':
      return `merge ${s.arg}–${s.end}`;
  }
};

/** @type {Record<StrandState, string>} */
const STATE_NAMES = {
  waiting: 'waiting for its inputs',
  ready: 'ready',
  running: 'running',
  done: 'done',
};

export const en = {
  slug: 'multithreaded-algorithms',
  topic: 'computation-models',
  level: 'Intermediate',
  title: 'Multithreaded algorithms',
  intro:
    'A multithreaded program says what may run in parallel with two keywords: spawn starts a call that can run alongside its parent, and sync waits for every spawned call to finish. Its run is a DAG of strands, and two numbers predict its speed on any machine: the work T₁, the total of all strands, and the span T∞, the longest path through the DAG.',
  summary:
    'Schedule the computation DAG of P-FIB or a parallel merge sort on 1 to 8 processors and watch work, span and Brent’s bound decide the running time.',
  instruction:
    'Pick a program and its size, set the processors P, and step through the greedy schedule. Each step every processor runs one step of a strand; P1, P2, … mark who runs what. Compare the step count with the work, the span and the speedup table.',
  programLabel: 'Program',
  programs: { fib: 'P-FIB(n)', mergesort: 'Parallel merge sort' },
  /** @param {'fib'|'mergesort'} program */
  sizeLabel: (program) => (program === 'fib' ? 'n' : 'Elements n'),
  processorsLabel: 'Processors P',
  criticalLabel: 'Show a critical path',
  dagTitle: 'Computation DAG',
  /** @param {Dag} dag */
  dagAria: (dag) =>
    `Computation DAG with ${plural(dag.strands.length, 'strand', 'strands')}: work ${dag.work}, span ${dag.span}.`,
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
    `${strandName(s)}: ${plural(s.cost, 'step', 'steps')}, ${STATE_NAMES[state]}${state === 'running' ? ` on processor ${proc + 1}, ${left} left` : ''}${critical ? ', on the critical path' : ''}.`,
  /** @param {number} proc */
  procMarker: (proc) => `P${proc + 1}`,
  markers: { ready: '○', done: '✓' },
  legend: {
    running: 'P1 Running on processor 1',
    ready: '○ Ready, waiting for a processor',
    done: '✓ Done',
    waiting: 'Waiting for its inputs',
    critical: 'A critical path (span)',
  },
  legendNote: 'F forks (spawn), J joins (sync), S splits, M8 merges 8 elements in 8 steps.',
  stats: {
    work: 'Work T₁',
    span: 'Span T∞',
    parallelism: 'Parallelism T₁/T∞',
    time: 'Step / T_P',
    usage: 'Busy / idle',
    brent: 'Brent: T₁/P + T∞',
  },
  /** @param {number} t @param {number} total */
  time: (t, total) => `${t} / ${total}`,
  /** @param {number} busy @param {number} idle */
  usage: (busy, idle) => `${busy} / ${idle}`,
  num,
  speedupTitle: 'Speedup by processors',
  speedupHead: ['P', 'T_P', 'T₁/T_P'],
  currentRow: '◀',
  /** @param {ScheduleFrame} f @param {Dag} dag */
  describe(f, dag) {
    switch (f.kind) {
      case 'start':
        return `${plural(dag.strands.length, 'strand', 'strands')}: work T₁ = ${dag.work}, span T∞ = ${dag.span}, so no schedule on ${plural(f.p, 'processor', 'processors')} can take fewer than max(T₁/P, T∞) = ${num(Math.max(dag.work / f.p, dag.span))} steps.`;
      case 'step': {
        const runs = f.running
          .map((id) => `P${f.proc[id] + 1} runs ${strandName(dag.strands[id])}`)
          .join('; ');
        const idle = f.p - f.running.length;
        const tail =
          f.ready > 0
            ? ` ${plural(f.ready, 'ready strand waits', 'ready strands wait')} for a processor.`
            : idle > 0
              ? ` ${plural(idle, 'processor idles', 'processors idle')}: nothing else is ready.`
              : '';
        return `Step ${f.t}: ${runs}.${tail}`;
      }
      case 'done':
        return `Done in T_P = ${f.t} steps on ${plural(f.p, 'processor', 'processors')}, a speedup of ${num(dag.work / f.t)}. Work law T_P ≥ T₁/P = ${num(dag.work / f.p)}, span law T_P ≥ T∞ = ${dag.span}, and Brent’s bound T_P ≤ T₁/P + T∞ = ${num(dag.work / f.p + dag.span)}.`;
    }
  },
  takeaways: [
    'spawn lets a call run in parallel with the code after it; sync waits for all spawned children. Removing both keywords leaves the ordinary serial program.',
    'Work T₁ is the time on one processor and span T∞ the time on unboundedly many. Any schedule on P processors needs T_P ≥ T₁/P (work law) and T_P ≥ T∞ (span law).',
    'A greedy scheduler, which never leaves a processor idle while a strand is ready, finishes within T₁/P + T∞ steps, so it is within a factor of 2 of the best schedule. Speedup grows almost linearly while P is well below the parallelism T₁/T∞.',
    'Merge sort with spawned recursive calls has work Θ(n log n) but span Θ(n), because the serial merge at the root alone takes n steps; its parallelism is only Θ(log n). Merging in parallel cuts the span to Θ(log³ n).',
    'Try it: run parallel merge sort on 16 elements and raise P from 1 to 8. The speedup levels off near the parallelism of 2.71, while P-FIB(7) keeps gaining.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    [
      'P-FIB(n) work',
      'Θ(φⁿ)',
      'The same calls as the serial version, each a constant number of steps.',
    ],
    ['P-FIB(n) span', 'Θ(n)', 'The longest path forks down n levels and joins back up.'],
    [
      'Merge sort, serial merge',
      'Work Θ(n log n), span Θ(n)',
      'The two halves run in parallel, but each merge is one long strand: n + n/2 + … ≤ 2n.',
    ],
    [
      'Merge sort, parallel merge',
      'Work Θ(n log n), span Θ(log³ n)',
      'Splitting each merge by a median and binary search gives a merge of span Θ(log² n).',
    ],
    [
      'Greedy schedule',
      'T_P ≤ T₁/P + T∞',
      'Each step either keeps all P processors busy or runs every ready strand, which shortens the remaining span.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Pick P-FIB with n = 6. What is its span T∞?',
      answer: 11,
      unit: 'steps',
      hints: ['Read Span T∞, or count the strands on the highlighted critical path.'],
      solution:
        'The span satisfies T∞(n) = T∞(n − 1) + 2 with T∞(1) = 1: one fork and one join per level, so T∞(6) = 2 · 6 − 1 = 11.',
    },
    {
      type: 'number',
      prompt:
        'Run parallel merge sort on 16 elements with P = 4. How many steps does the greedy schedule take?',
      answer: 45,
      unit: 'steps',
      hints: ['Set the sliders and press Last step, or read the row P = 4 of the speedup table.'],
      solution:
        'T_P = 45. The work law gives at least 95/4 = 23.75 and the span law at least 35; Brent’s bound promises at most 95/4 + 35 = 58.75.',
    },
    {
      type: 'choice',
      prompt:
        'Parallel merge sort on 16 elements has a speedup of only 2.5 on 8 processors. What limits it?',
      options: [
        'The two recursive calls cannot run at the same time',
        'The span: the serial merges along the critical path take 16 + 8 + 4 + 2 steps',
        'The scheduler leaves processors idle while strands are ready',
        'The work grows when more processors are added',
      ],
      answer: 1,
      hints: ['Turn on the critical path and look at which strands it passes through.'],
      solution:
        'No schedule beats the span T∞ = 35, and 30 of those steps are the merges on the critical path. The parallelism T₁/T∞ = 95/35 ≈ 2.71 caps the speedup, however many processors run.',
    },
  ],
  nextTeaser:
    'Next up: distributed algorithms, where machines on a network exchange messages round by round to elect a leader.',
};
