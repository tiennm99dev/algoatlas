import { describe, expect, it } from 'vitest';
import {
  D_VALUES,
  MAX_A,
  MAX_B,
  MAX_K,
  MIN_B,
  P_VALUES,
  compareExponent,
  directCost,
  dominantLevels,
  levelState,
  masterCase,
  masterPseudocode,
  masterTrace,
  nodeCount,
  validRecurrence,
} from './master-theorem.js';

/** @param {number} a @param {number} b @param {number} d @param {number} [p] @param {number} [k] */
const rec = (a, b, d, p = 0, k = 3) => ({ a, b, d, p, k });

/** Every valid recurrence in the input space. */
function allRecurrences() {
  const out = [];
  for (let a = 1; a <= MAX_A; a++)
    for (let b = MIN_B; b <= MAX_B; b++)
      for (const d of D_VALUES)
        for (const p of P_VALUES)
          for (let k = 1; k <= MAX_K; k++) {
            const r = { a, b, d, p, k };
            if (validRecurrence(r)) out.push(r);
          }
  return out;
}

describe('master theorem cases', () => {
  it.each([
    ['binary search', rec(1, 2, 0), 2],
    ['merge sort', rec(2, 2, 1), 2],
    ['Karatsuba', rec(3, 2, 1), 1],
    ['Strassen', rec(7, 2, 2), 1],
    ['schoolbook matrices', rec(8, 2, 2), 1],
    ['two halves, quadratic work', rec(2, 2, 2), 3],
    ['square root work', rec(2, 4, 0.5), 2],
    ['n log n work', rec(2, 2, 1, 1), 2],
    ['n / log n work', rec(2, 2, 1, -1), 'gap'],
    ['one third, linear', rec(1, 3, 1), 3],
    ['four quarters, √n', rec(4, 4, 0.5), 1],
    ['n² / log n above the critical exponent', rec(2, 2, 2, -1), 3],
  ])('%s', (_, r, expected) => {
    expect(masterCase(r)).toBe(expected);
  });

  it('compares d with log_b a exactly, matching floating point away from ties', () => {
    for (const r of allRecurrences()) {
      const diff = r.d - Math.log(r.a) / Math.log(r.b);
      const cmp = compareExponent(r);
      if (Math.abs(diff) > 1e-9) expect(cmp).toBe(Math.sign(diff));
      else expect(cmp).toBe(0);
    }
  });
});

describe('master theorem trace', () => {
  it('sums the levels to exactly T(n) evaluated from the recurrence', () => {
    for (const r of allRecurrences()) {
      const done = masterTrace(r).at(-1);
      const n = r.b ** r.k;
      expect(done?.n).toBe(n);
      const exact = directCost(r, n);
      expect(Math.abs((done?.total ?? 0) - exact) / exact).toBeLessThan(1e-12);
    }
  });

  it('lists aⁱ calls of size n/bⁱ per level and aᵏ leaves', () => {
    const done = masterTrace(rec(3, 2, 1, 0, 3)).at(-1);
    expect(done?.levels.map((l) => [l.calls, l.size, l.cost])).toEqual([
      [1, 8, 8],
      [3, 4, 12],
      [9, 2, 18],
      [27, 1, 27],
    ]);
    expect(done?.total).toBe(65);
  });

  it('gives merge sort equal levels of n and the n log n total', () => {
    const done = masterTrace(rec(2, 2, 1, 0, 4)).at(-1);
    expect(done?.levels.map((l) => l.cost)).toEqual([16, 16, 16, 16, 16]);
    expect(done?.total).toBe(16 * 4 + 16);
  });

  it('runs start, k levels, leaves, exponent, compare, verdict, done', () => {
    const frames = masterTrace(rec(2, 2, 1, 0, 3));
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'level',
      'level',
      'level',
      'leaves',
      'exponent',
      'compare',
      'verdict',
      'done',
    ]);
    expect(frames[0].c).toBeNull();
    expect(frames[5].c).toBeCloseTo(1);
    expect(frames[5].cmp).toBeNull();
    expect(frames[6].cmp).toBe(0);
    expect(frames[6].verdict).toBeNull();
    expect(frames[7].verdict).toBe(2);
  });

  it('reports the level ratio a / b^d', () => {
    expect(masterTrace(rec(2, 2, 2)).at(-1)?.ratio).toBe(0.5);
    expect(masterTrace(rec(4, 2, 1)).at(-1)?.ratio).toBe(2);
  });

  it('keeps frames independent of each other and of the input', () => {
    const input = rec(2, 2, 1, 0, 3);
    const frames = masterTrace(input);
    input.a = 7;
    expect(frames[0].rec.a).toBe(2);
    frames[3].levels[0].cost = -1;
    frames[3].rec.b = 9;
    expect(frames[4].levels[0].cost).toBe(8);
    expect(frames[4].rec.b).toBe(2);
  });

  it('keeps every valid input under 20 frames and inside the node cap', () => {
    for (const r of allRecurrences()) {
      expect(masterTrace(r).length).toBeLessThan(20);
      expect(nodeCount(r.a, r.k)).toBeLessThanOrEqual(85);
    }
  });
});

describe('master theorem validation', () => {
  it('rejects values outside the ranges and trees too big to draw', () => {
    expect(validRecurrence(rec(2, 2, 1))).toBe(true);
    expect(validRecurrence(rec(0, 2, 1))).toBe(false);
    expect(validRecurrence(rec(9, 2, 1))).toBe(false);
    expect(validRecurrence(rec(2, 1, 1))).toBe(false);
    expect(validRecurrence(rec(2, 5, 1))).toBe(false);
    expect(validRecurrence(rec(2, 2, 0.7))).toBe(false);
    expect(validRecurrence(rec(2, 2, 1, 3))).toBe(false);
    expect(validRecurrence(rec(2.5, 2, 1))).toBe(false);
    expect(validRecurrence(rec(8, 2, 2, 0, 3))).toBe(false);
    expect(validRecurrence(rec(8, 2, 2, 0, 2))).toBe(true);
  });
});

describe('master theorem colouring', () => {
  it('marks the dominant levels per case', () => {
    expect(dominantLevels(1, 3)).toEqual([3]);
    expect(dominantLevels(3, 3)).toEqual([0]);
    expect(dominantLevels(2, 2)).toEqual([0, 1, 2]);
    expect(dominantLevels('gap', 2)).toEqual([]);
  });

  it('recolours the tree once the verdict is in', () => {
    const frames = masterTrace(rec(4, 2, 1, 0, 2));
    const level1 = frames[2];
    expect([0, 1, 2].map((l) => levelState(level1, l))).toEqual(['visited', 'active', '']);
    const done = /** @type {import('./master-theorem.js').MasterFrame} */ (frames.at(-1));
    expect([0, 1, 2].map((l) => levelState(done, l))).toEqual(['', '', 'sorted']);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line across the four verdicts', () => {
    const frames = [rec(4, 2, 1), rec(2, 2, 1), rec(2, 2, 2), rec(2, 2, 1, -1)].flatMap((r) =>
      masterTrace(r),
    );
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(masterPseudocode.map((_, i) => i));
  });
});
