import { describe, expect, it } from 'vitest';
import {
  GROWTH_KEYS,
  MAX_N,
  asymptoticPseudocode,
  asymptoticTrace,
  evalPoly,
  growth,
  polyOrder,
  verdictOf,
  witness,
} from './asymptotic-notation.js';

/** @typedef {import('./asymptotic-notation.js').Poly} Poly */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @type {Poly[]} */
const polys = [
  { a: 3, b: 20, c: 50 },
  { a: 0, b: 7, c: 0 },
  { a: 0, b: 1, c: 1000 },
  { a: 0, b: 0, c: 5 },
  { a: 1, b: 0, c: 0 },
  { a: 10, b: 100, c: 1000 },
];

describe('verdicts', () => {
  it('compares growth orders', () => {
    expect(verdictOf({ a: 3, b: 20, c: 50 }, 'n2')).toBe('theta');
    expect(verdictOf({ a: 3, b: 20, c: 50 }, 'exp')).toBe('big-o');
    expect(verdictOf({ a: 3, b: 20, c: 50 }, 'nlogn')).toBe('omega');
    expect(verdictOf({ a: 0, b: 7, c: 9 }, 'n')).toBe('theta');
    expect(verdictOf({ a: 0, b: 7, c: 9 }, 'nlogn')).toBe('big-o');
    expect(verdictOf({ a: 0, b: 0, c: 9 }, 'n')).toBe('big-o');
  });

  it('names the dominant term', () => {
    expect(polyOrder({ a: 1, b: 100, c: 1000 })).toBe('n2');
    expect(polyOrder({ a: 0, b: 1, c: 1000 })).toBe('n');
    expect(polyOrder({ a: 0, b: 0, c: 1 })).toBe('1');
    expect(polyOrder({ a: 0, b: 0, c: 0 })).toBeNull();
  });

  it.each(polys.flatMap((p) => GROWTH_KEYS.map((g) => [p, g])))(
    'witness constants hold for %o against %s up to n = 300',
    (p, g) => {
      const poly = /** @type {Poly} */ (p);
      const bound = /** @type {import('./asymptotic-notation.js').GrowthKey} */ (g);
      const w = witness(poly, bound);
      for (let n = 1; n <= 300; n++) {
        const f = evalPoly(poly, n);
        const gn = growth[bound](n);
        if (w.upper !== null && n >= /** @type {number} */ (w.upperFrom))
          expect(f).toBeLessThanOrEqual(w.upper * gn + 1e-9);
        if (w.lower !== null) expect(f).toBeGreaterThanOrEqual(w.lower * gn - 1e-9);
      }
    },
  );

  it('agrees with the ratio trend far out (an independent oracle)', () => {
    const rand = seeded(11);
    for (let k = 0; k < 40; k++) {
      /** @type {Poly} */
      const p = {
        a: Math.floor(rand() * 3),
        b: Math.floor(rand() * 50),
        c: 1 + Math.floor(rand() * 500),
      };
      for (const g of GROWTH_KEYS) {
        // 2ⁿ overflows a double past n ≈ 1000, so it is sampled nearer.
        const [n1, n2] = g === 'exp' ? [100, 200] : [1e5, 1e7];
        const r1 = evalPoly(p, n1) / growth[g](n1);
        const r2 = evalPoly(p, n2) / growth[g](n2);
        const v = verdictOf(p, g);
        if (v === 'big-o') expect(r2).toBeLessThan(r1);
        else if (v === 'omega') expect(r2).toBeGreaterThan(r1);
        else expect(Math.abs(r2 - r1)).toBeLessThan(0.01 * r1 + 1e-9);
      }
    }
  });
});

describe('asymptoticTrace', () => {
  it('evaluates n = 1..N once each, between start and done', () => {
    const frames = asymptoticTrace({ a: 3, b: 20, c: 50 }, 'n2', 10);
    expect(frames).toHaveLength(12);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.at(-1)?.verdict).toBe('theta');
    expect(frames[3].n).toBe(3);
    expect(frames[3].f).toBe(3 * 9 + 60 + 50);
    expect(frames[3].ratio).toBeCloseTo(137 / 9);
    expect(frames[3].points.map((p) => p.n)).toEqual([1, 2, 3]);
  });

  it('has no ratio where n log n is zero', () => {
    const frames = asymptoticTrace({ a: 0, b: 1, c: 0 }, 'nlogn', 4);
    expect(frames[1].g).toBe(0);
    expect(frames[1].ratio).toBeNull();
    expect(frames[2].ratio).toBeCloseTo(1);
  });

  it('measures the leading term’s share of f', () => {
    const frames = asymptoticTrace({ a: 1, b: 10, c: 0 }, 'n2', 10);
    // 100 / (100 + 100) at n = 10.
    expect(frames[10].leadShare).toBeCloseTo(0.5);
  });

  it('stays small at the cap', () => {
    expect(asymptoticTrace({ a: 1, b: 1, c: 1 }, 'exp', MAX_N).length).toBeLessThan(400);
  });

  it('does not share points between frames', () => {
    const frames = asymptoticTrace({ a: 1, b: 0, c: 0 }, 'n', 4);
    frames[2].points[0].f = -1;
    frames[2].points[0].g.n = -1;
    frames[2].lines.push(9);
    expect(frames[3].points[0].f).toBe(1);
    expect(frames[3].points[0].g.n).toBe(1);
    expect(frames[3].lines).toEqual([1, 2, 3]);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line across the three verdicts', () => {
    const frames = [
      ...asymptoticTrace({ a: 1, b: 0, c: 0 }, 'n2', 3),
      ...asymptoticTrace({ a: 1, b: 0, c: 0 }, 'exp', 3),
      ...asymptoticTrace({ a: 1, b: 0, c: 0 }, 'n', 3),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(asymptoticPseudocode.map((_, i) => i));
  });
});
