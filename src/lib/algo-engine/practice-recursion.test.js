import { describe, expect, it } from 'vitest';
import {
  MAX_DISKS,
  MAX_ITEMS,
  hanoiCalls,
  hanoiTrace,
  parseItems,
  practiceRecursionPseudocode,
  subsetCalls,
  subsetsTrace,
} from './practice-recursion.js';

/** @param {import('./practice-recursion.js').HanoiFrame[]} frames */
const movesOf = (frames) =>
  frames.flatMap((f) => (f.move ? [[f.move.disk, f.move.from, f.move.to]] : []));

/**
 * Plays the moves on fresh pegs and fails on an illegal one.
 * @param {number} n
 * @param {number[][]} moves
 */
function replay(n, moves) {
  /** @type {number[][]} */
  const pegs = [Array.from({ length: n }, (_, i) => n - i), [], []];
  for (const [disk, from, to] of moves) {
    expect(pegs[from].at(-1)).toBe(disk);
    const below = pegs[to].at(-1);
    if (below !== undefined) expect(below).toBeGreaterThan(disk);
    pegs[to].push(/** @type {number} */ (pegs[from].pop()));
  }
  return pegs;
}

describe('towers of Hanoi trace', () => {
  it('moves every tower to the last peg with legal moves in 2ⁿ − 1 moves', () => {
    for (let n = 1; n <= MAX_DISKS; n++) {
      const frames = hanoiTrace(n);
      const moves = movesOf(frames);
      expect(moves).toHaveLength(2 ** n - 1);
      const pegs = replay(n, moves);
      expect(pegs).toEqual([[], [], Array.from({ length: n }, (_, i) => n - i)]);
      expect(frames.at(-1)?.pegs).toEqual(pegs);
      expect(frames.at(-1)?.calls).toBe(2 ** n - 1);
      expect(frames.at(-1)?.maxDepth).toBe(n);
    }
  });

  it('gives the classic three-disk solution', () => {
    expect(movesOf(hanoiTrace(3))).toEqual([
      [1, 0, 2],
      [2, 0, 1],
      [1, 2, 1],
      [3, 0, 2],
      [1, 1, 0],
      [2, 1, 2],
      [1, 0, 2],
    ]);
  });

  it('moves disk k exactly 2^(n − k) times', () => {
    const moves = movesOf(hanoiTrace(5));
    for (let k = 1; k <= 5; k++) {
      expect(moves.filter(([d]) => d === k)).toHaveLength(2 ** (5 - k));
    }
  });

  it('matches its call ids to the static call tree', () => {
    const calls = hanoiCalls(3);
    expect(calls.map((c) => [c.n, c.from, c.to, c.parent])).toEqual([
      [3, 0, 2, null],
      [2, 0, 1, 0],
      [1, 0, 2, 1],
      [1, 2, 1, 1],
      [2, 1, 2, 0],
      [1, 1, 0, 4],
      [1, 0, 2, 4],
    ]);
    const frames = hanoiTrace(3);
    for (const f of frames.filter((x) => x.kind === 'call')) {
      expect(f.status[f.call]).toBe('active');
      expect(
        calls[f.call].parent === null || f.status[calls[f.call].parent ?? 0] === 'waiting',
      ).toBe(true);
    }
    expect(frames.at(-1)?.status.every((s) => s === 'done')).toBe(true);
    expect(frames[0].status.every((s) => s === '')).toBe(true);
  });

  it('stays under 400 frames at the cap', () => {
    expect(hanoiTrace(MAX_DISKS).length).toBeLessThan(400);
  });
});

describe('subsets trace', () => {
  /** @param {number[][]} subsets */
  const key = (subsets) => subsets.map((s) => s.join('')).sort();

  it('outputs all 2ⁿ subsets exactly once', () => {
    for (let n = 1; n <= MAX_ITEMS; n++) {
      const last = subsetsTrace(n).at(-1);
      const all = Array.from({ length: 2 ** n }, (_, mask) =>
        Array.from({ length: n }, (_, i) => i).filter((i) => mask & (1 << (n - 1 - i))),
      );
      expect(last?.outputs).toHaveLength(2 ** n);
      expect(key(last?.outputs ?? [])).toEqual(key(all));
      expect(last?.calls).toBe(2 ** (n + 1) - 1);
      expect(last?.maxDepth).toBe(n + 1);
    }
  });

  it('leaves an item out before taking it', () => {
    expect(subsetsTrace(3).at(-1)?.outputs).toEqual([
      [],
      [2],
      [1],
      [1, 2],
      [0],
      [0, 2],
      [0, 1],
      [0, 1, 2],
    ]);
  });

  it('matches its call ids to the static call tree', () => {
    const calls = subsetCalls(2);
    expect(calls.map((c) => [c.i, c.chosen, c.branch])).toEqual([
      [0, [], null],
      [1, [], 'out'],
      [2, [], 'out'],
      [2, [1], 'in'],
      [1, [0], 'in'],
      [2, [0], 'out'],
      [2, [0, 1], 'in'],
    ]);
    for (const f of subsetsTrace(2).filter((x) => x.call >= 0)) {
      expect(f.chosen).toEqual(calls[f.call].chosen);
      expect(f.i).toBe(calls[f.call].i);
    }
  });

  it('stays under 400 frames at the cap', () => {
    expect(subsetsTrace(MAX_ITEMS).length).toBeLessThan(400);
  });
});

describe('parseItems', () => {
  it('reads letters and digits, separated or not', () => {
    expect(parseItems('a, b c')).toEqual({ items: ['a', 'b', 'c'] });
    expect(parseItems('xyz')).toEqual({ items: ['x', 'y', 'z'] });
  });

  it('refuses bad input', () => {
    expect(parseItems('a, +')).toEqual({ error: 'format' });
    expect(parseItems('')).toEqual({ error: 'count' });
    expect(parseItems('abcdef')).toEqual({ error: 'count' });
    expect(parseItems('a b a')).toEqual({ error: 'duplicate' });
  });
});

describe('frames', () => {
  it('do not alias each other', () => {
    const h = hanoiTrace(2);
    const before = JSON.stringify(h[2]);
    h[1].pegs[0].push(9);
    h[1].status[0] = 'done';
    expect(JSON.stringify(h[2])).toBe(before);
    const s = subsetsTrace(2);
    const after = JSON.stringify(s[4]);
    s[3].outputs.push([9]);
    s[3].chosen.push(9);
    expect(JSON.stringify(s[4])).toBe(after);
  });
});

describe('pseudocode coverage', () => {
  it('hanoi highlights every line', () => {
    const used = new Set(hanoiTrace(2).flatMap((f) => f.lines));
    practiceRecursionPseudocode.hanoi.forEach((_, i) =>
      expect(used.has(i), `line ${i}`).toBe(true),
    );
  });

  it('subsets highlights every line', () => {
    const used = new Set(subsetsTrace(2).flatMap((f) => f.lines));
    practiceRecursionPseudocode.subsets.forEach((_, i) =>
      expect(used.has(i), `line ${i}`).toBe(true),
    );
  });
});
