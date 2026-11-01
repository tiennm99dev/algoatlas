import { describe, expect, it } from 'vitest';
import {
  BOAT_LIMIT,
  MAX_N,
  PSEUDOCODE,
  PUZZLES,
  bruteAnswer,
  parseValues,
  puzzleTrace,
  randomCase,
  ruleAnswer,
  testRule,
} from './practice-greedy.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * Fewest jumps by a table filled from the right: an oracle independent of the BFS.
 * @param {number[]} a
 */
function tableJumps(a) {
  const n = a.length;
  const best = Array(n).fill(Infinity);
  best[n - 1] = 0;
  for (let i = n - 2; i >= 0; i--) {
    for (let len = 1; len <= a[i] && i + len < n; len++)
      best[i] = Math.min(best[i], 1 + best[i + len]);
  }
  return best[0] === Infinity ? -1 : best[0];
}

describe('brute-force answers', () => {
  it('agree with an independent table for the jump puzzles', () => {
    const rand = seeded(2);
    for (let t = 0; t < 200; t++) {
      const a = randomCase('jumps', rand);
      expect(bruteAnswer('jumps', a)).toBe(tableJumps(a));
      expect(bruteAnswer('reach', a)).toBe(tableJumps(a) >= 0 ? 1 : 0);
    }
  });

  it('count boats on known cases', () => {
    expect(bruteAnswer('boats', [1, 2, 8, 9])).toBe(2);
    expect(bruteAnswer('boats', [5, 5, 5])).toBe(2);
    expect(bruteAnswer('boats', [9, 9])).toBe(2);
    expect(bruteAnswer('boats', [3, 7])).toBe(1);
  });
});

describe.each(PUZZLES)('the right rule for %s', (puzzle) => {
  it('matches brute force on many random inputs', () => {
    const rand = seeded(7);
    for (let t = 0; t < 300; t++) {
      const a = randomCase(puzzle, rand);
      expect(ruleAnswer(puzzle, 'right', a)).toBe(bruteAnswer(puzzle, a));
    }
    expect(testRule(puzzle, 'right', seeded(3))).toEqual({ tested: 200, failed: 0, first: null });
  });

  it('starts at start, ends at done, stays small and keeps frames independent', () => {
    const big = Array.from({ length: MAX_N }, (_, i) => (puzzle === 'boats' ? 1 + (i % 9) : 1));
    for (const rule of /** @type {const} */ (['right', 'wrong'])) {
      const input = big.slice();
      const frames = puzzleTrace(puzzle, rule, input);
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
      expect(frames.length).toBeLessThan(400);
      input[0] = 5;
      expect(frames[0].values[0]).toBe(big[0]);
      frames[1].values[0] = 77;
      frames[1].path.push(77);
      frames[1].boats.push([77]);
      expect(frames[2].values[0]).not.toBe(77);
      expect(frames[2].path).not.toContain(77);
      expect(frames[2].boats.flat()).not.toContain(77);
    }
  });
});

describe('the wrong rules', () => {
  it('fail on the textbook counterexamples', () => {
    expect(ruleAnswer('reach', 'wrong', [2, 3, 0, 1, 4])).toBe(0);
    expect(ruleAnswer('reach', 'right', [2, 3, 0, 1, 4])).toBe(1);
    expect(ruleAnswer('jumps', 'wrong', [2, 3, 1, 1, 4])).toBe(3);
    expect(ruleAnswer('jumps', 'right', [2, 3, 1, 1, 4])).toBe(2);
    expect(ruleAnswer('boats', 'wrong', [1, 2, 8, 9])).toBe(3);
    expect(ruleAnswer('boats', 'right', [1, 2, 8, 9])).toBe(2);
  });

  it.each(PUZZLES)('are caught by random testing for %s', (puzzle) => {
    const report = testRule(puzzle, 'wrong', seeded(11));
    expect(report.failed).toBeGreaterThan(0);
    const first = report.first;
    if (!first) throw new Error('no counterexample');
    expect(ruleAnswer(puzzle, 'wrong', first.values)).toBe(first.got);
    expect(bruteAnswer(puzzle, first.values)).toBe(first.want);
    expect(first.got).not.toBe(first.want);
  });

  it('never use fewer jumps or boats than the best', () => {
    const rand = seeded(19);
    for (let t = 0; t < 200; t++) {
      const a = randomCase('jumps', rand);
      const got = ruleAnswer('jumps', 'wrong', a);
      if (got >= 0) expect(got).toBeGreaterThanOrEqual(bruteAnswer('jumps', a));
      const w = randomCase('boats', rand);
      expect(ruleAnswer('boats', 'wrong', w)).toBeGreaterThanOrEqual(bruteAnswer('boats', w));
    }
  });
});

describe('trace details', () => {
  it('tracks the farthest reach and stops at an unreachable cell', () => {
    const frames = puzzleTrace('reach', 'right', [3, 2, 1, 0, 4]);
    expect(frames.filter((f) => f.kind === 'scan').map((f) => f.reach)).toEqual([3, 3, 3, 3]);
    const stuck = frames.find((f) => f.kind === 'stuck');
    expect(stuck?.i).toBe(4);
    expect(frames.at(-1)?.result).toBe(0);
  });

  it('jumps by layers for the fewest jumps', () => {
    const frames = puzzleTrace('jumps', 'right', [2, 3, 1, 1, 4]);
    expect(frames.filter((f) => f.kind === 'jump').map((f) => [f.i, f.end, f.count])).toEqual([
      [0, 2, 1],
      [2, 4, 2],
    ]);
  });

  it('records the cells the longest-jump rule lands on', () => {
    expect(puzzleTrace('jumps', 'wrong', [2, 3, 1, 1, 4]).at(-1)?.path).toEqual([0, 2, 3, 4]);
  });

  it('sorts the boats input and lists each boat', () => {
    const done = puzzleTrace('boats', 'right', [8, 1, 9, 2]).at(-1);
    expect(done?.values).toEqual([1, 2, 8, 9]);
    expect(done?.boats).toEqual([
      [3, 0],
      [2, 1],
    ]);
    for (const b of done?.boats ?? []) {
      expect(b.reduce((s, k) => s + (done?.values[k] ?? 0), 0)).toBeLessThanOrEqual(BOAT_LIMIT);
    }
  });
});

describe('parsing values', () => {
  it('reads small whole numbers and refuses bad input', () => {
    expect(parseValues('2, 3 1', 'reach')).toEqual({ values: [2, 3, 1] });
    expect(parseValues('0 1', 'jumps')).toEqual({ values: [0, 1] });
    expect(parseValues('0 1', 'boats')).toEqual({ error: 'range' });
    expect(parseValues('1 10', 'reach')).toEqual({ error: 'range' });
    expect(parseValues('a', 'reach')).toEqual({ error: 'format' });
    expect(parseValues('1', 'reach')).toEqual({ error: 'count' });
    expect(parseValues(Array(13).fill('1').join(' '), 'boats')).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  const INPUTS = {
    reach: [
      [2, 3, 0, 1, 4],
      [3, 2, 1, 0, 4],
      [1, 1, 1],
    ],
    jumps: [
      [2, 3, 1, 1, 4],
      [1, 0, 1],
    ],
    boats: [
      [1, 2, 8, 9],
      [9, 9, 1, 1],
    ],
  };
  it.each(PUZZLES)('%s highlights every line of both rules', (puzzle) => {
    for (const rule of /** @type {const} */ (['right', 'wrong'])) {
      const seen = new Set(
        INPUTS[puzzle].flatMap((a) => puzzleTrace(puzzle, rule, a).flatMap((f) => f.lines)),
      );
      expect([...seen].sort((x, y) => x - y)).toEqual(PSEUDOCODE[puzzle][rule].map((_, i) => i));
    }
  });
});
