import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  RAM_PROGRAMS,
  expectedOps,
  ramPseudocode,
  ramTrace,
  triangular,
} from './algorithms-ram-model.js';

/** Independent oracle: add 1..n by hand. @param {number} n */
function sumByHand(n) {
  let s = 0;
  for (let k = 1; k <= n; k++) s += k;
  return s;
}

describe('ramTrace results', () => {
  it.each([0, 1, 2, 7, 10, MAX_N])('loop and formula agree with the oracle for n = %i', (n) => {
    expect(ramTrace('loop', n).at(-1)?.result).toBe(sumByHand(n));
    expect(ramTrace('formula', n).at(-1)?.result).toBe(sumByHand(n));
    expect(triangular(n)).toBe(sumByHand(n));
  });

  it.each([0, 1, 2, 7, MAX_N])('the off-by-one loop stops one short for n = %i', (n) => {
    expect(ramTrace('buggy', n).at(-1)?.result).toBe(sumByHand(Math.max(0, n - 1)));
  });

  it('starts with start and ends with done', () => {
    for (const p of RAM_PROGRAMS) {
      const frames = ramTrace(p, 4);
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
    }
  });
});

describe('ramTrace step counts', () => {
  it.each(RAM_PROGRAMS.flatMap((p) => [0, 1, 2, 5, 13, MAX_N].map((n) => [p, n])))(
    '%s with n = %i matches the closed form',
    (p, n) => {
      const last = /** @type {import('./algorithms-ram-model.js').RamFrame} */ (
        ramTrace(/** @type {import('./algorithms-ram-model.js').RamProgram} */ (p), Number(n)).at(
          -1,
        )
      );
      expect(last.total).toBe(
        expectedOps(/** @type {import('./algorithms-ram-model.js').RamProgram} */ (p), Number(n)),
      );
    },
  );

  it('splits the loop’s 5n + 4 steps by kind', () => {
    const last = ramTrace('loop', 10).at(-1);
    expect(last?.ops).toEqual({ assign: 22, compare: 11, arith: 20, ret: 1 });
  });

  it('runs the loop test n + 1 times and the formula in 5 steps', () => {
    expect(ramTrace('loop', 6).filter((f) => f.kind === 'test')).toHaveLength(7);
    expect(ramTrace('formula', 1000).at(-1)?.total).toBe(5);
  });

  it('sums each frame’s delta into the running total', () => {
    const frames = ramTrace('loop', 5);
    for (let k = 1; k < frames.length; k++)
      expect(frames[k].total).toBe(frames[k - 1].total + frames[k].delta);
  });

  it('keeps every frame within 400 frames at the cap', () => {
    expect(ramTrace('loop', MAX_N).length).toBeLessThan(400);
  });
});

describe('frame independence', () => {
  it('does not share vars, ops or line arrays between frames', () => {
    const frames = ramTrace('loop', 3);
    frames[2].vars.s = 99;
    frames[2].ops.assign = 99;
    frames[2].lines.push(5);
    frames[2].reads.push('x');
    expect(frames[3].vars.s).not.toBe(99);
    expect(frames[3].ops.assign).not.toBe(99);
    expect(frames[3].lines).toEqual([3]);
    expect(frames[3].reads).toEqual(['i', 'n']);
  });
});

describe('pseudocode coverage', () => {
  it.each(RAM_PROGRAMS)('%s trace highlights every pseudocode line', (p) => {
    const frames = ramTrace(p, 4);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(ramPseudocode[p].map((_, i) => i));
  });
});
