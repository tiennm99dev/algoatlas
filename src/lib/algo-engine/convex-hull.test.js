import { describe, expect, it } from 'vitest';
import { orient } from './geometry-orientation.js';
import {
  GRID,
  HULL_PRESETS,
  MAX_POINTS,
  grahamPseudocode,
  hullCosts,
  hullTrace,
  monotonePseudocode,
  randomPoints,
} from './convex-hull.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./convex-hull.js').HullPoint} HullPoint */
/** @typedef {import('./convex-hull.js').HullFrame} HullFrame */

/** @param {HullFrame[]} frames */
const last = (frames) => /** @type {HullFrame} */ (frames.at(-1));

/** @param {HullPoint} a @param {HullPoint} b @param {HullPoint} c @param {HullPoint} p */
function inTriangle(a, b, c, p) {
  if (orient(a, b, c) === 0) return false;
  const s = [orient(a, b, p), orient(b, c, p), orient(c, a, p)];
  return !(s.some((v) => v > 0) && s.some((v) => v < 0));
}

/** @param {HullPoint} a @param {HullPoint} b @param {HullPoint} p */
function betweenOnLine(a, b, p) {
  return orient(a, b, p) === 0 && (p.x - a.x) * (p.x - b.x) <= 0 && (p.y - a.y) * (p.y - b.y) <= 0;
}

/**
 * A point is a corner of the hull exactly when no triangle or segment of the other points
 * covers it, checked by brute force over every triple.
 * @param {HullPoint[]} points
 */
function extremePoints(points) {
  return points
    .filter((p) => {
      const others = points.filter((q) => q !== p);
      for (let i = 0; i < others.length; i++) {
        for (let j = i + 1; j < others.length; j++) {
          if (betweenOnLine(others[i], others[j], p)) return false;
          for (let k = j + 1; k < others.length; k++) {
            if (inTriangle(others[i], others[j], others[k], p)) return false;
          }
        }
      }
      return true;
    })
    .map((p) => p.id)
    .sort((a, b) => a - b);
}

describe.each(/** @type {['graham' | 'monotone'][]} */ ([['graham'], ['monotone']]))(
  '%s trace',
  (method) => {
    it('matches the brute-force corners on random clouds, turning left all the way', () => {
      const rand = seeded(17);
      for (let t = 0; t < 400; t++) {
        const n = 1 + Math.floor(rand() * 14);
        const points = randomPoints(n, rand);
        const hull = /** @type {number[]} */ (last(hullTrace(method, points)).hull);
        expect(
          hull.toSorted((a, b) => a - b),
          JSON.stringify(points),
        ).toEqual(extremePoints(points));
        if (hull.length >= 3) {
          const at = (/** @type {number} */ id) =>
            /** @type {HullPoint} */ (points.find((p) => p.id === id));
          hull.forEach((id, i) => {
            const b = at(hull[(i + 1) % hull.length]);
            const c = at(hull[(i + 2) % hull.length]);
            expect(orient(at(id), b, c)).toBeGreaterThan(0);
          });
        }
      }
    });

    it('handles no points, one point and two points', () => {
      expect(last(hullTrace(method, [])).hull).toEqual([]);
      expect(last(hullTrace(method, [{ id: 0, x: 3, y: 3 }])).hull).toEqual([0]);
      const two = last(
        hullTrace(method, [
          { id: 0, x: 3, y: 3 },
          { id: 1, x: 5, y: 1 },
        ]),
      );
      expect(two.hull?.toSorted()).toEqual([0, 1]);
    });

    it('keeps only the two ends of collinear points', () => {
      const hull = last(hullTrace(method, HULL_PRESETS.line)).hull;
      expect(hull?.toSorted((a, b) => a - b)).toEqual([0, 4]);
    });

    it('drops duplicates', () => {
      const hull = last(
        hullTrace(method, [
          { id: 0, x: 1, y: 1 },
          { id: 1, x: 1, y: 1 },
          { id: 2, x: 5, y: 1 },
          { id: 3, x: 3, y: 4 },
        ]),
      ).hull;
      expect(hull?.toSorted((a, b) => a - b)).toEqual([0, 2, 3]);
    });

    it('drops the points on an edge of the square', () => {
      const hull = last(hullTrace(method, HULL_PRESETS.square)).hull;
      expect(hull?.toSorted((a, b) => a - b)).toEqual([0, 1, 2, 3]);
    });

    it('never pops more than it pushed', () => {
      const f = last(hullTrace(method, HULL_PRESETS.cloud));
      expect(f.pops).toBeLessThanOrEqual(f.pushes);
    });

    it('does not alias frames or the input', () => {
      const points = HULL_PRESETS.cloud;
      const frames = hullTrace(method, points);
      frames[0].points[0].x = 99;
      expect(frames[1].points[0].x).toBe(points[0].x);
      const withStack = frames.findIndex((f) => f.stack.length > 1);
      frames[withStack].stack[0] = 99;
      expect(frames[withStack + 1].stack[0]).not.toBe(99);
      expect(points[0].x).toBe(1);
    });

    it('stays within the frame budget at the largest cloud', () => {
      const points = randomPoints(MAX_POINTS, seeded(2));
      expect(hullTrace(method, points).length).toBeLessThan(400);
    });
  },
);

describe('scan costs', () => {
  it('counts Graham on a convex quadrilateral: two tests, no pops, four pushes', () => {
    const square = [
      { id: 0, x: 0, y: 0 },
      { id: 1, x: 4, y: 0 },
      { id: 2, x: 4, y: 4 },
      { id: 3, x: 0, y: 4 },
    ];
    const f = last(hullTrace('graham', square));
    expect(f.tests).toBe(2);
    expect(f.pops).toBe(0);
    expect(f.pushes).toBe(4);
    expect(f.hull).toEqual([0, 1, 2, 3]);
  });

  it('pops once on a concave turn', () => {
    const f = last(
      hullTrace('graham', [
        { id: 0, x: 0, y: 0 },
        { id: 1, x: 4, y: 0 },
        { id: 2, x: 4, y: 1 },
        { id: 3, x: 5, y: 3 },
      ]),
    );
    expect(f.pops).toBe(1);
  });

  it('compares both on the same input', () => {
    const costs = hullCosts(HULL_PRESETS.cloud);
    expect(costs.graham.tests).toBe(last(hullTrace('graham', HULL_PRESETS.cloud)).tests);
    expect(costs.monotone.tests).toBe(last(hullTrace('monotone', HULL_PRESETS.cloud)).tests);
  });
});

describe('random points', () => {
  it('stays on the plane, distinct and capped', () => {
    const points = randomPoints(100, seeded(8));
    expect(points).toHaveLength(MAX_POINTS);
    expect(new Set(points.map((p) => `${p.x},${p.y}`)).size).toBe(MAX_POINTS);
    for (const p of points) {
      expect(p.x).toBeLessThanOrEqual(GRID.xMax);
      expect(p.y).toBeLessThanOrEqual(GRID.yMax);
    }
  });
});

describe('pseudocode coverage', () => {
  it.each(
    /** @type {['graham' | 'monotone', string[]][]} */ ([
      ['graham', grahamPseudocode],
      ['monotone', monotonePseudocode],
    ]),
  )('%s highlights every line', (method, code) => {
    const frames = hullTrace(method, HULL_PRESETS.cloud);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(code.map((_, i) => i));
  });
});
