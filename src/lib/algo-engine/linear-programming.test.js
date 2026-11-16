import { describe, expect, it } from 'vitest';
import { fadd, fcmp, fmul, frac, fvalue } from './lup-decomposition.js';
import {
  LP_PRESETS,
  MAX_COEF,
  MAX_CONSTRAINTS,
  MAX_RHS,
  clipLine,
  feasibleCorners,
  regionPolygon,
  simplexPseudocode,
  simplexTrace,
  viewSize,
} from './linear-programming.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./linear-programming.js').LpFrame} LpFrame */
/** @typedef {import('./linear-programming.js').Constraint} Constraint */

/** @param {LpFrame[]} frames */
const last = (frames) => /** @type {LpFrame} */ (frames.at(-1));

/**
 * Whether the objective grows without bound: some extreme ray d ≥ 0 of the region’s recession
 * cone (A·d ≤ 0) has c·d > 0. In two dimensions those rays are the axes or run along a
 * constraint’s boundary line.
 * @param {number[]} c @param {Constraint[]} cons
 */
function unboundedOracle(c, cons) {
  const candidates = [
    [1, 0],
    [0, 1],
    ...cons.flatMap(({ a1, a2 }) => [
      [a2, -a1],
      [-a2, a1],
    ]),
  ];
  return candidates.some(
    ([dx, dy]) =>
      dx >= 0 &&
      dy >= 0 &&
      (dx > 0 || dy > 0) &&
      cons.every(({ a1, a2 }) => a1 * dx + a2 * dy <= 0) &&
      c[0] * dx + c[1] * dy > 0,
  );
}

/** The best objective over the corners. @param {number[]} c @param {Constraint[]} cons */
function bestCorner(c, cons) {
  return feasibleCorners(cons)
    .map((p) => fadd(fmul(frac(c[0]), p.x), fmul(frac(c[1]), p.y)))
    .reduce((best, v) => (fcmp(v, best) > 0 ? v : best));
}

describe('simplex trace', () => {
  it('walks the classic example corner to corner', () => {
    const { c, cons } = LP_PRESETS.classic;
    const frames = simplexTrace(c, cons);
    const f = last(frames);
    expect(f.status).toBe('optimal');
    expect(f.path.map((p) => [fvalue(p.x), fvalue(p.y)])).toEqual([
      [0, 0],
      [3, 0],
      [3, 1],
    ]);
    expect(f.z).toEqual(frac(11));
    expect(f.dual).toEqual([frac(2), frac(0), frac(1)]);
    expect(f.pivots).toBe(2);
    expect(frames.find((g) => g.kind === 'enter')?.entering).toBe(0);
    expect(frames.find((g) => g.kind === 'leave')?.ratios).toEqual([frac(4), frac(9), frac(3)]);
  });

  it('makes a degenerate pivot that changes the basis but not the corner', () => {
    const { c, cons } = LP_PRESETS.degenerate;
    const f = last(simplexTrace(c, cons));
    expect(f.path.map((p) => [fvalue(p.x), fvalue(p.y)])).toEqual([
      [0, 0],
      [0, 0],
      [2, 2],
    ]);
    expect(f.z).toEqual(frac(6));
    expect(f.dual).toEqual([frac(1, 2), frac(3, 2)]);
  });

  it('reports an unbounded objective', () => {
    const { c, cons } = LP_PRESETS.unbounded;
    const f = last(simplexTrace(c, cons));
    expect(f.status).toBe('unbounded');
    expect(f.dual).toBeNull();
    expect(simplexTrace(c, cons).some((g) => g.kind === 'unbounded' && g.entering === 0)).toBe(
      true,
    );
  });

  it('stops at once when no direction improves', () => {
    const f = simplexTrace([-1, 0], [{ a1: 1, a2: 1, b: 3 }]);
    expect(f.map((g) => g.kind)).toEqual(['start', 'optimal', 'done']);
    expect(last(f).z).toEqual(frac(0));
  });

  it('agrees with checking every corner, and the duals certify the optimum', () => {
    const rand = seeded(17);
    const pick = (/** @type {number} */ lo, /** @type {number} */ hi) =>
      lo + Math.floor(rand() * (hi - lo + 1));
    let unbounded = 0;
    for (let round = 0; round < 600; round++) {
      const m = pick(1, MAX_CONSTRAINTS);
      const cons = Array.from({ length: m }, () => ({
        a1: pick(-MAX_COEF, MAX_COEF),
        a2: pick(-MAX_COEF, MAX_COEF),
        b: pick(0, MAX_RHS),
      }));
      const c = [pick(-MAX_COEF, MAX_COEF), pick(-MAX_COEF, MAX_COEF)];
      const f = last(simplexTrace(c, cons));
      expect(f.status).not.toBe('running');
      if (unboundedOracle(c, cons)) {
        unbounded++;
        expect(f.status).toBe('unbounded');
        continue;
      }
      expect(f.status).toBe('optimal');
      expect(f.z).toEqual(bestCorner(c, cons));
      const dual = /** @type {import('./lup-decomposition.js').Frac[]} */ (f.dual);
      dual.forEach((y) => expect(fcmp(y, frac(0))).toBeGreaterThanOrEqual(0));
      const dualZ = dual.reduce((s, y, i) => fadd(s, fmul(y, frac(cons[i].b))), frac(0));
      expect(dualZ).toEqual(f.z);
      for (const [j, key] of /** @type {const} */ ([
        [0, 'a1'],
        [1, 'a2'],
      ])) {
        const lhs = dual.reduce((s, y, i) => fadd(s, fmul(y, frac(cons[i][key]))), frac(0));
        expect(fcmp(lhs, frac(c[j]))).toBeGreaterThanOrEqual(0);
      }
    }
    expect(unbounded).toBeGreaterThan(30);
  });
});

describe('feasible region', () => {
  it('lists the corners of the classic example', () => {
    const corners = feasibleCorners(LP_PRESETS.classic.cons).map((p) => [fvalue(p.x), fvalue(p.y)]);
    expect(corners).toHaveLength(5);
    for (const v of [
      [0, 0],
      [3, 0],
      [3, 1],
      [1.5, 2.5],
      [0, 3],
    ])
      expect(corners).toContainEqual(v);
  });

  it('clips the region to the drawing box and sizes the view', () => {
    const poly = regionPolygon(LP_PRESETS.classic.cons, 6, 6);
    expect(poly).toHaveLength(5);
    expect(viewSize(LP_PRESETS.classic.cons)).toEqual({ xMax: 5, yMax: 5 });
    expect(viewSize(LP_PRESETS.single.cons)).toEqual({ xMax: 11, yMax: 7 });
    expect(regionPolygon(LP_PRESETS.unbounded.cons, 8, 8).length).toBeGreaterThanOrEqual(4);
  });
});

describe('clipLine', () => {
  it('cuts a boundary line to the drawing box', () => {
    expect(clipLine(1, 1, 4, 6, 6)).toEqual({ x1: 0, y1: 4, x2: 4, y2: 0 });
    expect(clipLine(1, 0, 3, 6, 6)).toEqual({ x1: 3, y1: 0, x2: 3, y2: 6 });
    expect(clipLine(1, 1, 20, 6, 6)).toBeNull();
    expect(clipLine(0, 0, 5, 6, 6)).toBeNull();
  });
});

describe('frames', () => {
  it('start and end as the contract says, and stay small', () => {
    for (const { c, cons } of Object.values(LP_PRESETS)) {
      const f = simplexTrace(c, cons);
      expect(f[0].kind).toBe('start');
      expect(f.at(-1)?.kind).toBe('done');
      expect(f.length).toBeLessThan(400);
    }
  });

  it('do not alias each other', () => {
    const f = simplexTrace(LP_PRESETS.classic.c, LP_PRESETS.classic.cons);
    const later = JSON.stringify(f[3]);
    f[2].rows[0][0].num = 99;
    f[2].cost[0].num = 99;
    f[2].basis[0] = 99;
    f[2].path.push({ x: frac(9), y: frac(9) });
    f[2].cons[0].a1 = 99;
    expect(JSON.stringify(f[3])).toBe(later);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line across an optimal and an unbounded run', () => {
    const seen = new Set(
      [LP_PRESETS.classic, LP_PRESETS.unbounded].flatMap(({ c, cons }) =>
        simplexTrace(c, cons).flatMap((f) => f.lines),
      ),
    );
    simplexPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
