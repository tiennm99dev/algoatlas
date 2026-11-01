import { describe, expect, it } from 'vitest';
import { MAX_N, fibPseudocode, fibTrace } from './memoization-tabulation.js';

/** @param {number} n */
function fibonacci(n) {
  let [a, b] = [0, 1];
  for (let k = 0; k < n; k++) [a, b] = [b, a + b];
  return a;
}

const MODES = /** @type {const} */ (['plain', 'memo', 'table']);

describe('every mode', () => {
  it.each(MODES)('%s returns fib(n) for every allowed n', (mode) => {
    for (let n = 0; n <= MAX_N; n++) {
      const frames = fibTrace(mode, n);
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
      expect(frames.at(-1)?.result).toBe(fibonacci(n));
    }
  });

  it.each(MODES)('%s stays under 400 frames at the cap', (mode) => {
    expect(fibTrace(mode, MAX_N).length).toBeLessThan(400);
  });
});

describe('plain recursion', () => {
  it('makes 2·fib(n + 1) − 1 calls and fib(n + 1) − 1 additions', () => {
    for (let n = 0; n <= MAX_N; n++) {
      const last = /** @type {import('./memoization-tabulation.js').FibFrame} */ (
        fibTrace('plain', n).at(-1)
      );
      expect(last.callCount).toBe(2 * fibonacci(n + 1) - 1);
      expect(last.additions).toBe(Math.max(0, fibonacci(n + 1) - 1));
      expect(last.hits).toBe(0);
    }
  });

  it('works out the same subproblem many times and stores nothing', () => {
    const last = fibTrace('plain', 5).at(-1);
    // fib(k) is computed fib(6 − k) times for k ≥ 1; fib(0) fib(4) times.
    expect(last?.computed).toEqual([3, 5, 3, 2, 1, 1]);
    expect(last?.table.every((v) => v === null)).toBe(true);
  });
});

describe('memoization', () => {
  it('makes 2n − 1 calls, n − 2 lookups and n − 1 additions', () => {
    for (let n = 2; n <= MAX_N; n++) {
      const last = fibTrace('memo', n).at(-1);
      expect(last?.callCount).toBe(2 * n - 1);
      expect(last?.hits).toBe(n - 2);
      expect(last?.additions).toBe(n - 1);
    }
    expect(fibTrace('memo', 0).at(-1)?.callCount).toBe(1);
    expect(fibTrace('memo', 1).at(-1)?.callCount).toBe(1);
  });

  it('works out each subproblem once and fills the whole table', () => {
    const last = fibTrace('memo', 6).at(-1);
    expect(last?.computed).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(last?.table).toEqual([0, 1, 1, 2, 3, 5, 8]);
  });

  it('turns the repeated calls into cached leaves', () => {
    const calls = fibTrace('memo', 4).at(-1)?.calls ?? [];
    expect(calls.map((c) => [c.n, c.cached])).toEqual([
      [4, false],
      [3, false],
      [2, false],
      [1, false],
      [0, false],
      [1, true],
      [2, true],
    ]);
    const hit = fibTrace('memo', 4).find((f) => f.kind === 'hit');
    expect(hit).toMatchObject({ k: 1, cell: 1, value: 1 });
  });
});

describe('tabulation', () => {
  it('makes no calls and n − 1 additions', () => {
    for (let n = 0; n <= MAX_N; n++) {
      const last = fibTrace('table', n).at(-1);
      expect(last?.callCount).toBe(0);
      expect(last?.calls).toEqual([]);
      expect(last?.additions).toBe(Math.max(0, n - 1));
    }
  });

  it('fills the table left to right from the two cells before', () => {
    const fills = fibTrace('table', 5).filter((f) => f.kind === 'fill');
    expect(fills.map((f) => [f.cell, f.reads, f.value])).toEqual([
      [2, [1, 0], 1],
      [3, [2, 1], 2],
      [4, [3, 2], 3],
      [5, [4, 3], 5],
    ]);
    expect(fills[1].table).toEqual([0, 1, 1, 2, null, null]);
  });
});

describe('frames', () => {
  it('do not alias each other', () => {
    const frames = fibTrace('memo', 4);
    const before = JSON.stringify(frames[4]);
    frames[3].calls[0].result = 99;
    frames[3].table[0] = 99;
    frames[3].computed[0] = 99;
    frames[3].stack.push(9);
    frames[3].lines.push(9);
    expect(JSON.stringify(frames[4])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it.each(MODES)('%s highlights every line', (mode) => {
    const used = new Set(fibTrace(mode, 4).flatMap((f) => f.lines));
    fibPseudocode[mode].forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
