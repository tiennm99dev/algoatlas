import { describe, expect, it } from 'vitest';
import {
  BUG_LINE,
  INDUCTION_PROGRAMS,
  MAX_N,
  buggyPseudocode,
  inductionPseudocode,
  inductionTrace,
  parseValues,
} from './recursion-induction.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {() => number} rand */
function randomArray(rand) {
  const n = 1 + Math.floor(rand() * MAX_N);
  return Array.from({ length: n }, () => Math.floor(rand() * 41) - 20);
}

/** @param {number[]} a */
const total = (a) => a.reduce((s, v) => s + v, 0);

/** @param {import('./recursion-induction.js').InductionFrame[]} frames */
const last = (frames) =>
  /** @type {import('./recursion-induction.js').InductionFrame} */ (frames.at(-1));

const INPUTS = [
  [5],
  [3, 3, 3],
  [5, -2, 9, 1, -7, 4],
  [-4, -9, -1, -6],
  [1, 2, 3, 4],
  [9, 7, 4, 2, 0],
];

describe('correct programs', () => {
  it.each(INPUTS)('pass every check on %j', (...a) => {
    for (const program of INDUCTION_PROGRAMS) {
      const end = last(inductionTrace(program, a));
      expect(end.failed, program).toBe(0);
      expect(end.correct, program).toBe(true);
    }
  });

  it('agree with an oracle on random arrays', () => {
    const rand = seeded(11);
    for (let t = 0; t < 40; t++) {
      const a = randomArray(rand);
      expect(last(inductionTrace('sum', a)).acc).toBe(total(a));
      expect(last(inductionTrace('recursive', a)).acc).toBe(total(a));
      expect(last(inductionTrace('max', a)).acc).toBe(Math.max(...a));
      expect(last(inductionTrace('insertion', a)).items).toEqual(a.slice().sort((p, q) => p - q));
    }
  });

  it('check the loop invariant on entry, after each iteration and on exit', () => {
    const end = last(inductionTrace('sum', [4, 1, 3]));
    expect(end.log.map((e) => [e.phase, e.at])).toEqual([
      ['init', 0],
      ['maintain', 1],
      ['maintain', 2],
      ['maintain', 3],
      ['end', 3],
    ]);
    expect(end.passed).toBe(5);
  });

  it('leave the invariant unchecked in the middle of the body', () => {
    const frames = inductionTrace('sum', [4, 1]);
    const body = frames.filter((f) => f.kind === 'body');
    expect(body.map((f) => [f.acc, f.expected, f.holds])).toEqual([
      [4, 0, null],
      [5, 4, null],
    ]);
  });

  it('check the base case and every inductive step of the recursive sum', () => {
    const frames = inductionTrace('recursive', [2, 5, 1]);
    expect(Math.max(...frames.map((f) => f.stack.length))).toBe(4);
    expect(last(frames).log.map((e) => [e.phase, e.at])).toEqual([
      ['base', 0],
      ['step', 1],
      ['step', 2],
      ['step', 3],
    ]);
    expect(frames.filter((f) => f.kind === 'step').map((f) => f.acc)).toEqual([2, 7, 8]);
  });
});

describe('buggy programs', () => {
  it('sum fails at initialization unless a[0] is 0', () => {
    const end = last(inductionTrace('sum', [5, 2, 3], true));
    expect(end.log[0]).toEqual({ phase: 'init', at: 1, holds: false });
    expect(end.passed).toBe(0);
    expect(end.correct).toBe(false);
    const lucky = last(inductionTrace('sum', [0, 2, 3], true));
    expect(lucky.failed).toBe(0);
    expect(lucky.correct).toBe(true);
  });

  it('max holds at initialization and fails in maintenance', () => {
    const end = last(inductionTrace('max', [3, 8, 1], true));
    expect(end.log.map((e) => e.holds)).toEqual([true, false, false, false]);
    expect(end.acc).toBe(1);
    expect(end.correct).toBe(false);
  });

  it('insertion sort only fails when a key belongs in slot 0', () => {
    const sorted = last(inductionTrace('insertion', [1, 2, 3, 4], true));
    expect(sorted.failed).toBe(0);
    const end = last(inductionTrace('insertion', [4, 2, 3], true));
    expect(end.items).toEqual([4, 2, 3]);
    expect(end.log.map((e) => e.holds)).toEqual([true, false, false, false]);
    expect(end.disorder).toBe(0);
    expect(end.correct).toBe(false);
  });

  it('recursive sum breaks every claim after a wrong base case', () => {
    const end = last(inductionTrace('recursive', [2, 5], true));
    expect(end.failed).toBe(3);
    expect(end.acc).toBe(8);
    expect(end.correct).toBe(false);
  });

  it('changes exactly one line of the pseudocode', () => {
    for (const program of INDUCTION_PROGRAMS) {
      const good = inductionPseudocode[program];
      const bad = buggyPseudocode[program];
      expect(bad).toHaveLength(good.length);
      const differ = good.map((line, i) => (line === bad[i] ? -1 : i)).filter((i) => i >= 0);
      expect(differ).toEqual([BUG_LINE[program]]);
    }
  });
});

describe('parseValues', () => {
  it('reads whole numbers separated by commas or spaces', () => {
    expect(parseValues('3, −2  7')).toEqual({ values: [3, -2, 7] });
  });

  it('refuses bad input', () => {
    expect(parseValues('3, x')).toEqual({ error: 'format' });
    expect(parseValues('1.5')).toEqual({ error: 'format' });
    expect(parseValues('')).toEqual({ error: 'count' });
    expect(parseValues('1 2 3 4 5 6 7 8 9 10 11')).toEqual({ error: 'count' });
    expect(parseValues('100')).toEqual({ error: 'range' });
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const input = [3, 1, 2];
    const frames = inductionTrace('insertion', input);
    const before = JSON.stringify(frames[2]);
    frames[1].items[0] = 99;
    frames[1].log.push({ phase: 'end', at: 0, holds: false });
    expect(JSON.stringify(frames[2])).toBe(before);
    expect(input).toEqual([3, 1, 2]);
  });

  it('start and end with start and done, under 400 frames at the cap', () => {
    const big = Array.from({ length: MAX_N }, (_, i) => MAX_N - i);
    for (const program of INDUCTION_PROGRAMS) {
      const frames = inductionTrace(program, big);
      expect(frames[0].kind).toBe('start');
      expect(last(frames).kind).toBe('done');
      expect(frames.length).toBeLessThan(400);
    }
  });
});

describe('pseudocode coverage', () => {
  it.each(INDUCTION_PROGRAMS)('%s highlights every line', (program) => {
    const used = new Set(inductionTrace(program, [3, 1, 2]).flatMap((f) => f.lines));
    inductionPseudocode[program].forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
