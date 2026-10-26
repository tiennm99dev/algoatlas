import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  STACK_LIMIT,
  recursionPseudocode,
  recursionTrace,
  withoutBaseCase,
} from './recursion-basics.js';

/** @param {number} n */
function factorial(n) {
  let p = 1;
  for (let k = 2; k <= n; k++) p *= k;
  return p;
}

/** @param {number} n */
function fibonacci(n) {
  let [a, b] = [0, 1];
  for (let k = 0; k < n; k++) [a, b] = [b, a + b];
  return a;
}

describe('factorial trace', () => {
  it('returns n! for every allowed n', () => {
    for (let n = 0; n <= MAX_N.fact; n++) {
      const last = recursionTrace('fact', n).at(-1);
      expect(last?.kind).toBe('done');
      expect(last?.result).toBe(factorial(n));
    }
  });

  it('makes one call per level and stacks them all', () => {
    for (const n of [0, 1, 2, 5, 12]) {
      const last = recursionTrace('fact', n).at(-1);
      expect(last?.callCount).toBe(Math.max(n, 1));
      expect(last?.maxDepth).toBe(Math.max(n, 1));
      expect(last?.depth).toBe(0);
    }
  });

  it('pushes on a call and pops on a return', () => {
    const frames = recursionTrace('fact', 3);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'call',
      'call',
      'call',
      'base',
      'resume',
      'return',
      'resume',
      'return',
      'done',
    ]);
    expect(frames.map((f) => f.depth)).toEqual([0, 1, 2, 3, 3, 2, 2, 1, 1, 0]);
    const resume = frames[5];
    expect(resume.value).toBe(1);
    expect(resume.from).toBe(1);
    expect(resume.stack.at(-1)).toMatchObject({ n: 2, a: 1, line: 3 });
    expect(frames[6].value).toBe(2);
  });

  it('builds a chain of calls in the call tree', () => {
    const calls = recursionTrace('fact', 4).at(-1)?.calls ?? [];
    expect(calls.map((c) => [c.n, c.parent, c.result])).toEqual([
      [4, null, 24],
      [3, 0, 6],
      [2, 1, 2],
      [1, 2, 1],
    ]);
  });
});

describe('fibonacci trace', () => {
  it('returns fib(n) for every allowed n', () => {
    for (let n = 0; n <= MAX_N.fib; n++) {
      expect(recursionTrace('fib', n).at(-1)?.result).toBe(fibonacci(n));
    }
  });

  it('makes 2·fib(n + 1) − 1 calls and goes n deep', () => {
    for (let n = 0; n <= MAX_N.fib; n++) {
      const last = recursionTrace('fib', n).at(-1);
      expect(last?.callCount).toBe(2 * fibonacci(n + 1) - 1);
      expect(last?.maxDepth).toBe(Math.max(n, 1));
    }
  });

  it('calls fib(n − 1) before fib(n − 2) and repeats subproblems', () => {
    const calls = recursionTrace('fib', 4).at(-1)?.calls ?? [];
    expect(calls.map((c) => c.n)).toEqual([4, 3, 2, 1, 0, 1, 2, 1, 0]);
    expect(calls.filter((c) => c.n === 2)).toHaveLength(2);
  });

  it('keeps every trace under 400 frames at the cap', () => {
    expect(recursionTrace('fib', MAX_N.fib).length).toBeLessThan(400);
    expect(recursionTrace('fact', MAX_N.fact).length).toBeLessThan(400);
  });
});

describe('without a base case', () => {
  it.each([
    ['fact', 3],
    ['fib', 5],
  ])('%s overflows the stack', (fn, n) => {
    const frames = recursionTrace(/** @type {'fact'|'fib'} */ (fn), n, false);
    const overflow = frames.find((f) => f.kind === 'overflow');
    expect(overflow?.depth).toBe(STACK_LIMIT);
    expect(overflow?.value).toBe(n - STACK_LIMIT);
    expect(frames.some((f) => f.kind === 'base')).toBe(false);
    const last = frames.at(-1);
    expect(last?.kind).toBe('done');
    expect(last?.overflow).toBe(true);
    expect(last?.result).toBeNull();
    expect(last?.callCount).toBe(STACK_LIMIT);
    expect(last?.stack).toEqual([]);
  });

  it('cuts the base-case lines out of the pseudocode', () => {
    const lines = withoutBaseCase(recursionPseudocode.fact);
    expect(lines).toHaveLength(recursionPseudocode.fact.length);
    expect(lines[2]).not.toContain('return 1');
    expect(lines[3]).toBe(recursionPseudocode.fact[3]);
  });
});

describe('frames', () => {
  it('do not alias each other', () => {
    const frames = recursionTrace('fib', 3);
    const before = JSON.stringify(frames[3]);
    frames[2].stack[0].n = 99;
    frames[2].calls[0].result = 99;
    frames[2].lines.push(9);
    expect(JSON.stringify(frames[3])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['fact', 'fib']))('%s highlights every line', (fn) => {
    const used = new Set(recursionTrace(fn, 4).flatMap((f) => f.lines));
    recursionPseudocode[fn].forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
