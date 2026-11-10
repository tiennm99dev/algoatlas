import { describe, expect, it } from 'vitest';
import { MAX_COST, MAX_N, hungarianPseudocode, hungarianTrace } from './min-cost-flow.js';

/** Deterministic LCG so random matrices are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const JOBS = [
  [9, 2, 7, 8],
  [6, 4, 3, 7],
  [5, 8, 1, 8],
  [7, 6, 9, 4],
];
const TRAP = [
  [1, 2, 9],
  [2, 9, 9],
  [9, 3, 4],
];

/**
 * Oracle: the cheapest assignment over every permutation.
 * @param {number[][]} c
 */
function brute(c) {
  const n = c.length;
  /** @param {number} i @param {number} used @returns {number} */
  const best = (i, used) => {
    if (i === n) return 0;
    let b = Infinity;
    for (let j = 0; j < n; j++)
      if (!(used & (1 << j))) b = Math.min(b, c[i][j] + best(i + 1, used | (1 << j)));
    return b;
  };
  return best(0, 0);
}

describe('Hungarian algorithm', () => {
  it('finds the cheapest assignment of the worked example', () => {
    const frames = hungarianTrace({ costs: JOBS });
    const last = frames.at(-1);
    expect(last?.colOf).toEqual([1, 0, 2, 3]);
    expect(last?.rowOf).toEqual([1, 0, 2, 3]);
    expect(last?.cost).toBe(13);
    expect(last?.bound).toBe(13);
    expect(last?.u).toEqual([4, 6, 4, 4]);
    expect(last?.v).toEqual([0, -2, -3, 0]);
    expect(last?.reads).toBe(21);
    // Row C re-routes B and then A: the flip assigns C → 3 and B → 1.
    expect(frames.filter((f) => f.kind === 'augment').map((f) => f.path)).toEqual([
      [[0, 1]],
      [[1, 2]],
      [
        [2, 2],
        [1, 0],
      ],
      [[3, 3]],
    ]);
    const firstC = frames.find((f) => f.kind === 'scan' && f.root === 2);
    expect(firstC?.slack).toEqual([5, 8, 1, 8]);
    expect(firstC?.delta).toBe(1);
    expect(firstC?.pick).toBe(2);
  });

  it('beats the cheapest-cell-first choice on the greedy trap', () => {
    const last = hungarianTrace({ costs: TRAP }).at(-1);
    expect(last?.colOf).toEqual([1, 0, 2]);
    expect(last?.cost).toBe(8);
    // A δ of 0 adds a column without moving the potentials.
    const frames = hungarianTrace({ costs: TRAP });
    const zero = frames.findIndex((f) => f.kind === 'scan' && f.delta === 0);
    expect(zero).toBeGreaterThan(0);
    expect(frames[zero + 1].kind).toBe('tight');
  });

  it('handles the smallest matrices and equal costs', () => {
    expect(hungarianTrace({ costs: [] }).map((f) => f.kind)).toEqual(['start', 'done']);
    expect(hungarianTrace({ costs: [[7]] }).at(-1)?.cost).toBe(7);
    const flat = hungarianTrace({
      costs: [
        [5, 5],
        [5, 5],
      ],
    }).at(-1);
    expect(flat?.cost).toBe(10);
    expect(flat?.colOf).toEqual([0, 1]);
  });

  it('agrees with brute force and keeps reduced costs non-negative', () => {
    const rand = seeded(23);
    for (let t = 0; t < 300; t++) {
      const n = 1 + Math.floor(rand() * MAX_N);
      const costs = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => Math.floor(rand() * (MAX_COST + 1))),
      );
      const frames = hungarianTrace({ costs });
      const last = /** @type {import('./min-cost-flow.js').HungarianFrame} */ (frames.at(-1));
      expect(last.cost).toBe(brute(costs));
      expect(last.bound).toBe(last.cost);
      expect(new Set(last.colOf).size).toBe(n);
      expect(frames.length).toBeLessThan(400);
      for (const f of frames) {
        expect(f.reduced.flat().every((x) => x >= 0)).toBe(true);
        f.colOf.forEach((c, r) => {
          if (c >= 0) expect(f.reduced[r][c]).toBe(0);
        });
      }
    }
  });

  it('frames do not alias', () => {
    const frames = hungarianTrace({ costs: JOBS });
    frames[3].u[0] = 99;
    frames[3].reduced[0][0] = 99;
    frames[3].slack[0] = 99;
    expect(frames[4].u[0]).not.toBe(99);
    expect(frames[4].reduced[0][0]).not.toBe(99);
    expect(frames[4].slack[0]).not.toBe(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = hungarianTrace({ costs: JOBS });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(hungarianPseudocode.map((_, i) => i));
  });
});
