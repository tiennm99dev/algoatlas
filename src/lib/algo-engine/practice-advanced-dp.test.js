import { describe, expect, it } from 'vitest';
import { lcg } from './seeded-random.js';
import {
  DEFAULTS,
  PARAM,
  PROBLEMS,
  SIZE,
  growthSizes,
  makeInput,
  racePseudocode,
  solveFast,
  solveNaive,
} from './practice-advanced-dp.js';

/** @param {number} n @returns {number} */
const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

describe('naive and optimised solvers', () => {
  it('agree on every problem across sizes and inputs', () => {
    const rand = lcg(71);
    for (const problem of PROBLEMS)
      for (let t = 0; t < 25; t++) {
        const top = problem === 'tour' ? 8 : 300;
        const n = SIZE[problem].min + Math.floor(rand() * (top - SIZE[problem].min + 1));
        const param =
          problem === 'window'
            ? 1 + Math.floor(rand() * n)
            : problem === 'squares'
              ? Math.floor(rand() * (PARAM.squares.max + 1))
              : 0;
        const input = makeInput(problem, n, param, 1 + t);
        expect(solveFast(input).answer, `${problem} n=${n}`).toBe(solveNaive(input).answer);
      }
  });

  it('solves small cases by hand', () => {
    const frog = { problem: /** @type {const} */ ('window'), cities: [], param: 2 };
    expect(solveFast({ ...frog, values: [5, 1, 9, 1, 7] }).answer).toBe(5 + 1 + 1 + 7);
    expect(solveNaive({ ...frog, values: [5, 1, 9, 1, 7], param: 1 }).answer).toBe(23);
    const hop = { problem: /** @type {const} */ ('squares'), cities: [], values: [0, 1, 2, 3] };
    // C = 0: hop one stone at a time, 1 each. C = 10: one long hop of 9 + 10 beats 3·(1 + 10).
    expect(solveFast({ ...hop, param: 0 }).answer).toBe(3);
    expect(solveFast({ ...hop, param: 10 }).answer).toBe(19);
    const square = [
      { x: 0, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 0 },
    ];
    const tour = { problem: /** @type {const} */ ('tour'), values: [], param: 0, cities: square };
    expect(solveNaive(tour).answer).toBe(8);
    expect(solveFast(tour).answer).toBe(8);
  });

  it('counts the naive work by its formula', () => {
    const w = makeInput('window', 1000, 50, 1);
    expect(solveNaive(w).ops).toBe((49 * 50) / 2 + 950 * 50);
    const s = makeInput('squares', 2000, 100, 1);
    expect(solveNaive(s).ops).toBe((2000 * 1999) / 2);
    for (const n of [3, 5, 9]) {
      expect(solveNaive(makeInput('tour', n, 0, 1)).ops).toBe(factorial(n - 1) * n);
    }
  });

  it('keeps the optimised work linear, or 2ⁿ · n² for tours', () => {
    for (const n of [100, 1000, SIZE.window.max]) {
      const ops = solveFast(makeInput('window', n, Math.min(n - 1, 500), 3)).ops;
      expect(ops).toBeLessThanOrEqual(4 * n);
    }
    for (const n of [100, 1000, SIZE.squares.max])
      expect(solveFast(makeInput('squares', n, 50, 3)).ops).toBeLessThanOrEqual(4 * n);
    // Transitions of Held-Karp plus the n − 1 closing steps.
    expect(solveFast(makeInput('tour', 6, 0, 1)).ops).toBe(165 + 5);
  });

  it('makes the same input for the same number and a new one for another', () => {
    expect(makeInput('window', 10, 3, 4)).toEqual(makeInput('window', 10, 3, 4));
    expect(makeInput('window', 10, 3, 4).values).not.toEqual(makeInput('window', 10, 3, 5).values);
    const xs = makeInput('squares', 50, 0, 2).values;
    xs.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(xs[i]));
    expect(xs[0]).toBe(0);
  });

  it('picks growth sizes inside the limits', () => {
    expect(growthSizes('window', 2000)).toEqual([500, 1000, 2000]);
    expect(growthSizes('tour', 8)).toEqual([6, 7, 8]);
    expect(growthSizes('tour', 3)).toEqual([3]);
    expect(growthSizes('squares', 2)).toEqual([2]);
  });

  it('starts from sizes the naive method finishes quickly', () => {
    for (const p of PROBLEMS) {
      expect(DEFAULTS[p].n).toBeGreaterThanOrEqual(SIZE[p].min);
      expect(DEFAULTS[p].n).toBeLessThanOrEqual(SIZE[p].max);
      expect(racePseudocode[p].naive.length).toBeGreaterThan(0);
      expect(racePseudocode[p].fast.length).toBeGreaterThan(0);
    }
  });
});
