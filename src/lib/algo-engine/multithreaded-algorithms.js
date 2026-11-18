/**
 * Fork-join programs as computation DAGs, and a greedy scheduler that runs a DAG on P
 * processors one time step at a time.
 *
 * A strand (a DAG node) is a run of instructions with no spawn or sync inside it; it costs a
 * whole number of time steps. An edge u → v means v may start only after u has finished.
 * Work T₁ is the total cost of all strands (the time on one processor); span T∞ is the cost of
 * the most expensive path (the time on unboundedly many processors).
 *
 * The scheduler is greedy: at every step it keeps each running strand on its processor, gives
 * each free processor a ready strand (smallest id first), and runs min(P, available) strands for
 * one step each. Any greedy schedule meets Brent's bound T_P ≤ T₁/P + T∞.
 */

/**
 * @typedef {'fib'|'mergesort'} Program
 * @typedef {'leaf'|'fork'|'join'|'base'|'split'|'merge'} StrandKind
 * @typedef {'waiting'|'ready'|'running'|'done'} StrandState
 */

/**
 * @typedef {object} Strand
 * @property {number} id
 * @property {StrandKind} kind
 * @property {number} arg  P-FIB: n. Merge sort: the first index p of the range.
 * @property {number} end  Merge sort: the last index r of the range; equal to `arg` otherwise.
 * @property {number} cost  Time steps the strand takes.
 * @property {number[]} preds  Strands that must finish first.
 * @property {number} x  Column for the drawing.
 * @property {number} y  Row for the drawing: the longest chain of strands above it.
 * @property {number[]} lines  Pseudocode lines this strand executes.
 */

/**
 * @typedef {object} Dag
 * @property {Program} program
 * @property {number} n
 * @property {Strand[]} strands  In a topological order: every pred has a smaller id.
 * @property {number} work  T₁
 * @property {number} span  T∞
 * @property {number[]} critical  Ids of one most expensive path, source to sink.
 * @property {number} cols
 * @property {number} rows
 */

/**
 * @typedef {object} ScheduleFrame
 * @property {'start'|'step'|'done'} kind
 * @property {number} t  Steps run so far.
 * @property {number} p  Processors.
 * @property {StrandState[]} states  By strand id.
 * @property {number[]} remaining  Steps each strand still needs.
 * @property {number[]} proc  The processor (from 0) running each strand this step, or -1.
 * @property {number[]} running  Strand ids run in this step, by processor.
 * @property {number[]} started  Strands that began this step.
 * @property {number} ready  Strands ready but left waiting this step for lack of a processor.
 * @property {number} busy  Processor-steps spent running strands so far.
 * @property {number} idle  Processor-steps spent idle so far.
 * @property {number} finished  Strands done so far.
 * @property {number[]} lines
 */

export const MIN_FIB = 2;
export const MAX_FIB = 7;
export const MIN_SORT = 2;
export const MAX_SORT = 16;
export const MAX_P = 8;

export const fibPseudocode = [
  'P-FIB(n):',
  '  if n ≤ 1: return n',
  '  x = spawn P-FIB(n − 1)',
  '  y = P-FIB(n − 2)',
  '  sync',
  '  return x + y',
];

export const mergeSortPseudocode = [
  'P-MERGE-SORT(A, p, r):',
  '  if p ≥ r: return',
  '  q = ⌊(p + r) / 2⌋',
  '  spawn P-MERGE-SORT(A, p, q)',
  '  P-MERGE-SORT(A, q + 1, r)',
  '  sync',
  '  MERGE(A, p, q, r)   ▹ tuần tự: r − p + 1 bước',
];

/** @param {Program} program */
export const programPseudocode = (program) =>
  program === 'fib' ? fibPseudocode : mergeSortPseudocode;

/**
 * The computation DAG of P-FIB(n) or of P-MERGE-SORT on n elements.
 * @param {Program} program
 * @param {number} n
 * @returns {Dag}
 */
export function buildDag(program, n) {
  /** @type {Strand[]} */
  const strands = [];
  let col = 0;
  /**
   * @param {StrandKind} kind @param {number} arg @param {number} end @param {number} cost
   * @param {number[]} preds @param {number[]} lines
   */
  const add = (kind, arg, end, cost, preds, lines) => {
    const s = { id: strands.length, kind, arg, end, cost, preds, x: 0, y: 0, lines };
    strands.push(s);
    return s;
  };

  /**
   * Builds one call; returns its first and last strands and its horizontal centre.
   * @param {number} a @param {number} b @param {number[]} preds
   * @returns {{first: Strand, last: Strand, x: number}}
   */
  const call = (a, b, preds) => {
    const leafCase = program === 'fib' ? a <= 1 : a >= b;
    if (leafCase) {
      const s = add(program === 'fib' ? 'leaf' : 'base', a, b, 1, preds, [0, 1]);
      s.x = col++;
      return { first: s, last: s, x: s.x };
    }
    const fork =
      program === 'fib'
        ? add('fork', a, a, 1, preds, [0, 2, 3])
        : add('split', a, b, 1, preds, [0, 2, 3, 4]);
    const q = Math.floor((a + b) / 2);
    const left = program === 'fib' ? call(a - 1, a - 1, [fork.id]) : call(a, q, [fork.id]);
    const right = program === 'fib' ? call(a - 2, a - 2, [fork.id]) : call(q + 1, b, [fork.id]);
    const join =
      program === 'fib'
        ? add('join', a, a, 1, [left.last.id, right.last.id], [4, 5])
        : add('merge', a, b, b - a + 1, [left.last.id, right.last.id], [5, 6]);
    const x = (left.x + right.x) / 2;
    fork.x = x;
    join.x = x;
    return { first: fork, last: join, x };
  };

  if (program === 'fib') call(n, n, []);
  else call(0, n - 1, []);

  /** Longest weighted path ending at each strand, and the pred it comes through. */
  const dist = Array(strands.length).fill(0);
  const via = Array(strands.length).fill(-1);
  for (const s of strands) {
    let best = 0;
    for (const p of s.preds) {
      if (dist[p] > best) {
        best = dist[p];
        via[s.id] = p;
      }
      s.y = Math.max(s.y, strands[p].y + 1);
    }
    dist[s.id] = best + s.cost;
  }
  const sink = strands.length - 1;
  /** @type {number[]} */
  const critical = [];
  for (let v = sink; v >= 0; v = via[v]) critical.unshift(v);
  return {
    program,
    n,
    strands,
    work: strands.reduce((sum, s) => sum + s.cost, 0),
    span: dist[sink],
    critical,
    cols: col,
    rows: strands[sink].y + 1,
  };
}

/**
 * Runs the greedy schedule on P processors; `onStep` sees the state after every step.
 * @param {Dag} dag
 * @param {number} p
 * @param {(s: {t: number, states: StrandState[], remaining: number[], proc: number[], running: number[], started: number[], ready: number, busy: number, idle: number, finished: number}) => void} [onStep]
 * @returns {number} T_P, the number of steps.
 */
function runSchedule(dag, p, onStep) {
  const { strands } = dag;
  const m = strands.length;
  const remaining = strands.map((s) => s.cost);
  const waitingOn = strands.map((s) => s.preds.length);
  /** @type {number[][]} */
  const succ = strands.map(() => []);
  for (const s of strands) for (const q of s.preds) succ[q].push(s.id);
  /** @type {StrandState[]} */
  const states = strands.map((s) => (s.preds.length === 0 ? 'ready' : 'waiting'));
  /** Processor slots: the strand each one is running, or -1. */
  const slots = Array(p).fill(-1);
  let t = 0;
  let busy = 0;
  let idle = 0;
  let finished = 0;
  while (finished < m) {
    t++;
    /** @type {number[]} */
    const started = [];
    for (let k = 0; k < p; k++) {
      if (slots[k] >= 0) continue;
      const next = states.indexOf('ready');
      if (next < 0) break;
      slots[k] = next;
      states[next] = 'running';
      started.push(next);
    }
    const proc = Array(m).fill(-1);
    /** @type {number[]} */
    const running = [];
    slots.forEach((id, k) => {
      if (id < 0) return;
      proc[id] = k;
      running.push(id);
      remaining[id]--;
    });
    busy += running.length;
    idle += p - running.length;
    const ready = states.filter((s) => s === 'ready').length;
    /** @type {number[]} */
    const freed = [];
    slots.forEach((id, k) => {
      if (id >= 0 && remaining[id] === 0) {
        states[id] = 'done';
        finished++;
        slots[k] = -1;
        freed.push(id);
      }
    });
    onStep?.({ t, states, remaining, proc, running, started, ready, busy, idle, finished });
    // Successors become ready only after this step, so they run from the next one.
    for (const id of freed) {
      for (const v of succ[id]) {
        waitingOn[v]--;
        if (waitingOn[v] === 0) states[v] = 'ready';
      }
    }
  }
  return t;
}

/**
 * T_P for the greedy schedule on P processors, without recording frames.
 * @param {Dag} dag
 * @param {number} p
 */
export const scheduleTime = (dag, p) => runSchedule(dag, p);

/**
 * The trace of the greedy schedule on P processors: one frame per time step.
 * @param {Dag} dag
 * @param {number} p
 * @returns {ScheduleFrame[]}
 */
export function scheduleTrace(dag, p) {
  const m = dag.strands.length;
  /** @type {ScheduleFrame[]} */
  const frames = [
    {
      kind: 'start',
      t: 0,
      p,
      states: dag.strands.map((s) => (s.preds.length === 0 ? 'ready' : 'waiting')),
      remaining: dag.strands.map((s) => s.cost),
      proc: Array(m).fill(-1),
      running: [],
      started: [],
      ready: 1,
      busy: 0,
      idle: 0,
      finished: 0,
      lines: [0],
    },
  ];
  runSchedule(dag, p, (s) => {
    const lines = [...new Set(s.running.flatMap((id) => dag.strands[id].lines))].sort(
      (a, b) => a - b,
    );
    frames.push({
      kind: 'step',
      t: s.t,
      p,
      states: s.states.slice(),
      remaining: s.remaining.slice(),
      proc: s.proc.slice(),
      running: s.running.slice(),
      started: s.started.slice(),
      ready: s.ready,
      busy: s.busy,
      idle: s.idle,
      finished: s.finished,
      lines,
    });
  });
  const last = frames[frames.length - 1];
  frames.push({
    ...last,
    kind: 'done',
    states: last.states.slice(),
    remaining: last.remaining.slice(),
    proc: Array(m).fill(-1),
    running: [],
    started: [],
    ready: 0,
    lines: last.lines.slice(),
  });
  return frames;
}
