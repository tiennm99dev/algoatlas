/**
 * A toy word-RAM machine running three programs that compute 1 + 2 + … + n: a loop, the
 * closed formula n(n + 1)/2, and a loop with an off-by-one bug. Every primitive operation
 * (assignment, comparison, arithmetic, return) costs one step, so the trace tallies the exact
 * step count of each run.
 */

export const MAX_N = 30;

/** @typedef {'loop' | 'formula' | 'buggy'} RamProgram */

export const RAM_PROGRAMS = /** @type {const} */ (['loop', 'formula', 'buggy']);

export const loopSumPseudocode = [
  'sumTo(n):',
  '  s = 0',
  '  i = 1',
  '  while i ≤ n:',
  '    s = s + i',
  '    i = i + 1',
  '  return s',
];

export const formulaSumPseudocode = ['sumTo(n):', '  s = n × (n + 1) / 2', '  return s'];

export const buggySumPseudocode = [
  'sumTo(n):',
  '  s = 0',
  '  i = 1',
  '  while i < n:',
  '    s = s + i',
  '    i = i + 1',
  '  return s',
];

/** @type {Record<RamProgram, string[]>} */
export const ramPseudocode = {
  loop: loopSumPseudocode,
  formula: formulaSumPseudocode,
  buggy: buggySumPseudocode,
};

/**
 * @typedef {object} RamOps
 * @property {number} assign
 * @property {number} compare
 * @property {number} arith
 * @property {number} ret
 */

/**
 * @typedef {object} RamFrame
 * @property {'start'|'init-s'|'init-i'|'test'|'add'|'step'|'compute'|'return'|'done'} kind
 * @property {RamProgram} program
 * @property {number} n
 * @property {{n: number, s: number | null, i: number | null}} vars  null: not assigned yet.
 * @property {string[]} reads   Variables this step reads.
 * @property {string[]} writes  Variables this step writes.
 * @property {boolean | null} test  The loop condition's value on a test step.
 * @property {RamOps} ops  Running tally by kind.
 * @property {number} delta  Primitive operations this step performed.
 * @property {number} total
 * @property {number | null} result  The returned value, once returned.
 * @property {number[]} lines
 */

/** The right answer, 1 + 2 + … + n. @param {number} n */
export const triangular = (n) => (n * (n + 1)) / 2;

/**
 * Closed-form step count of each program, matching the trace's final total.
 * @param {RamProgram} program
 * @param {number} n
 */
export function expectedOps(program, n) {
  if (program === 'formula') return 5;
  if (program === 'loop') return 5 * n + 4;
  return n <= 1 ? 4 : 5 * n - 1;
}

/**
 * @param {RamProgram} program
 * @param {number} n  0 ≤ n ≤ MAX_N.
 * @returns {RamFrame[]}
 */
export function ramTrace(program, n) {
  /** @type {RamFrame[]} */
  const frames = [];
  /** @type {RamFrame['vars']} */
  const vars = { n, s: null, i: null };
  const ops = { assign: 0, compare: 0, arith: 0, ret: 0 };
  /** @type {number | null} */
  let result = null;

  /**
   * @param {RamFrame['kind']} kind @param {number[]} lines
   * @param {{reads?: string[], writes?: string[], test?: boolean | null, delta?: Partial<RamOps>}} [opt]
   */
  function push(kind, lines, opt = {}) {
    const d = opt.delta ?? {};
    ops.assign += d.assign ?? 0;
    ops.compare += d.compare ?? 0;
    ops.arith += d.arith ?? 0;
    ops.ret += d.ret ?? 0;
    const delta = (d.assign ?? 0) + (d.compare ?? 0) + (d.arith ?? 0) + (d.ret ?? 0);
    frames.push({
      kind,
      program,
      n,
      vars: { ...vars },
      reads: (opt.reads ?? []).slice(),
      writes: (opt.writes ?? []).slice(),
      test: opt.test ?? null,
      ops: { ...ops },
      delta,
      total: ops.assign + ops.compare + ops.arith + ops.ret,
      result,
      lines: lines.slice(),
    });
  }

  push('start', [0]);
  if (program === 'formula') {
    vars.s = triangular(n);
    push('compute', [1], { reads: ['n'], writes: ['s'], delta: { arith: 3, assign: 1 } });
    result = vars.s;
    push('return', [2], { reads: ['s'], delta: { ret: 1 } });
    push('done', [2]);
    return frames;
  }

  vars.s = 0;
  push('init-s', [1], { writes: ['s'], delta: { assign: 1 } });
  vars.i = 1;
  push('init-i', [2], { writes: ['i'], delta: { assign: 1 } });
  for (;;) {
    const i = /** @type {number} */ (vars.i);
    const go = program === 'loop' ? i <= n : i < n;
    push('test', [3], { reads: ['i', 'n'], test: go, delta: { compare: 1 } });
    if (!go) break;
    vars.s = /** @type {number} */ (vars.s) + i;
    push('add', [4], { reads: ['s', 'i'], writes: ['s'], delta: { arith: 1, assign: 1 } });
    vars.i = i + 1;
    push('step', [5], { reads: ['i'], writes: ['i'], delta: { arith: 1, assign: 1 } });
  }
  result = vars.s;
  push('return', [6], { reads: ['s'], delta: { ret: 1 } });
  push('done', [6]);
  return frames;
}
