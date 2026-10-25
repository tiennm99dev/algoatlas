import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  averageFound,
  caseTarget,
  costProfile,
  linearSearchPseudocode,
  linearSearchTrace,
} from './best-worst-average-case.js';
import { linearSearchComparisons } from './searching.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number[]} values @param {number} target */
const last = (values, target) =>
  /** @type {import('./best-worst-average-case.js').LinearFrame} */ (
    linearSearchTrace(values, target).at(-1)
  );

describe('linearSearchTrace', () => {
  it('matches indexOf and the independent comparison count on random input', () => {
    const rand = seeded(5);
    for (let k = 0; k < 200; k++) {
      const n = 1 + Math.floor(rand() * MAX_N);
      const values = Array.from({ length: n }, () => Math.floor(rand() * 20));
      const target = Math.floor(rand() * 25);
      const f = last(values, target);
      expect(f.foundAt).toBe(values.indexOf(target));
      expect(f.comparisons).toBe(linearSearchComparisons(values, target));
    }
  });

  it('handles empty, single, duplicate and absent inputs', () => {
    expect(last([], 3)).toMatchObject({ foundAt: -1, comparisons: 0 });
    expect(last([3], 3)).toMatchObject({ foundAt: 0, comparisons: 1 });
    expect(last([4], 3)).toMatchObject({ foundAt: -1, comparisons: 1 });
    expect(last([5, 2, 2, 2], 2)).toMatchObject({ foundAt: 1, comparisons: 2 });
    expect(last([1, 2, 3, 4, 5], 9)).toMatchObject({ foundAt: -1, comparisons: 5 });
  });

  it('runs start, compares, then found or missing, then done', () => {
    expect(linearSearchTrace([4, 7, 1], 7).map((f) => f.kind)).toEqual([
      'start',
      'compare',
      'compare',
      'found',
      'done',
    ]);
    expect(linearSearchTrace([4, 7], 9).map((f) => f.kind)).toEqual([
      'start',
      'compare',
      'compare',
      'missing',
      'done',
    ]);
  });

  it('does not share the array between frames or with the input', () => {
    const input = [4, 7, 1];
    const frames = linearSearchTrace(input, 1);
    frames[1].values[0] = 99;
    frames[1].lines.push(4);
    expect(frames[2].values[0]).toBe(4);
    expect(frames[2].lines).toEqual([1, 2]);
    input[0] = 50;
    expect(frames[0].values[0]).toBe(4);
  });
});

describe('cases', () => {
  it('costs 1 for the best case and n for the worst', () => {
    const values = [8, 3, 0, 1, 5];
    expect(last(values, caseTarget(values, 'best')).comparisons).toBe(1);
    const worst = caseTarget(values, 'worst');
    expect(worst).toBe(2);
    expect(last(values, worst).comparisons).toBe(5);
  });

  it('picks a random element through the injected source', () => {
    const values = [10, 20, 30, 40];
    expect(caseTarget(values, 'random', () => 0.6)).toBe(30);
    expect(caseTarget(values, 'random', () => 0.99)).toBe(40);
  });

  it('builds the cost profile and its average', () => {
    expect(costProfile(4)).toEqual([1, 2, 3, 4, 4]);
    expect(averageFound(4)).toBe(2.5);
    const n = 9;
    const found = costProfile(n).slice(0, n);
    expect(found.reduce((s, c) => s + c, 0) / n).toBe(averageFound(n));
  });

  it('approaches (n + 1) / 2 over many random runs', () => {
    const values = [5, 9, 2, 7, 1, 3, 8, 6, 4, 0];
    const rand = seeded(9);
    let total = 0;
    const runs = 4000;
    for (let k = 0; k < runs; k++)
      total += last(values, caseTarget(values, 'random', rand)).comparisons;
    expect(total / runs).toBeCloseTo(averageFound(values.length), 0);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line across a hit and a miss', () => {
    const frames = [...linearSearchTrace([1, 2], 2), ...linearSearchTrace([1, 2], 5)];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(linearSearchPseudocode.map((_, i) => i));
  });
});
