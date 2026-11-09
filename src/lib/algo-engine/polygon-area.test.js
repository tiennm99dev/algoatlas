import { describe, expect, it } from 'vitest';
import {
  GRID,
  POLYGON_PRESETS,
  insertVertex,
  polygonTrace,
  rayPseudocode,
  selfIntersects,
  shoelacePseudocode,
  shoelaceSum,
  windingPseudocode,
} from './polygon-area.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {{x: number, y: number}} P */

/** @param {import('./polygon-area.js').PolygonFrame[]} frames */
const last = (frames) => /** @type {import('./polygon-area.js').PolygonFrame} */ (frames.at(-1));

/** The trapezoid form of the signed area: an independent way to write the same quantity. */
/** @param {P[]} poly */
function trapezoidSum(poly) {
  let sum = 0;
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    sum += (p.x - q.x) * (p.y + q.y);
  });
  return sum;
}

/** The winding number from the angles swept around q, for q off the outline. */
/** @param {P} q @param {P[]} poly */
function windingByAngles(q, poly) {
  let total = 0;
  poly.forEach((p, i) => {
    const r = poly[(i + 1) % poly.length];
    let d = Math.atan2(r.y - q.y, r.x - q.x) - Math.atan2(p.y - q.y, p.x - q.x);
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    total += d;
  });
  return Math.round(total / (2 * Math.PI)) + 0;
}

/** @param {P} q @param {P[]} poly */
function onOutline(q, poly) {
  return poly.some((p, i) => {
    const r = poly[(i + 1) % poly.length];
    const gap = Math.hypot(q.x - p.x, q.y - p.y) + Math.hypot(q.x - r.x, q.y - r.y);
    return Math.abs(gap - Math.hypot(r.x - p.x, r.y - p.y)) < 1e-9;
  });
}

/** @param {() => number} rand @param {number} n */
function randomPolygon(rand, n) {
  /** @type {P[]} */
  const out = [];
  while (out.length < n) {
    const p = {
      x: Math.floor(rand() * (GRID.xMax + 1)),
      y: Math.floor(rand() * (GRID.yMax + 1)),
    };
    if (!out.some((o) => o.x === p.x && o.y === p.y)) out.push(p);
  }
  return out;
}

describe('shoelace trace', () => {
  it.each(
    /** @type {[keyof typeof POLYGON_PRESETS, number, string][]} */ ([
      ['rectangle', 30, 'ccw'],
      ['lShape', 28, 'ccw'],
      ['clockwise', 20, 'cw'],
    ]),
  )('finds the area of %s', (name, area, direction) => {
    const { polygon, query } = POLYGON_PRESETS[name];
    const f = last(polygonTrace('shoelace', polygon, query));
    expect(f.area).toBe(area);
    expect(f.direction).toBe(direction);
    expect(f.edgesWalked).toBe(polygon.length);
  });

  it('gives each edge its term and a running sum', () => {
    const { polygon, query } = POLYGON_PRESETS.rectangle;
    const f = last(polygonTrace('shoelace', polygon, query));
    expect(f.rows.map((r) => r.value)).toEqual([-6, 40, 36, -10]);
    expect(f.rows.map((r) => r.total)).toEqual([-6, 34, 70, 60]);
  });

  it('agrees with the trapezoid form on random polygons', () => {
    const rand = seeded(9);
    for (let t = 0; t < 300; t++) {
      const poly = randomPolygon(rand, 3 + Math.floor(rand() * 8));
      expect(shoelaceSum(poly)).toBe(trapezoidSum(poly));
    }
  });

  it('flips the sign and keeps the area when the vertices reverse', () => {
    const { polygon } = POLYGON_PRESETS.lShape;
    expect(shoelaceSum(polygon.toReversed())).toBe(-shoelaceSum(polygon));
  });

  it('reads a flat polygon as area 0', () => {
    const flat = [
      { x: 1, y: 1 },
      { x: 3, y: 3 },
      { x: 5, y: 5 },
    ];
    const f = last(polygonTrace('shoelace', flat, { x: 0, y: 0 }));
    expect(f.area).toBe(0);
    expect(f.direction).toBe('flat');
  });
});

describe('ray casting and winding traces', () => {
  it.each(
    /** @type {[keyof typeof POLYGON_PRESETS, string, string, number, number][]} */ ([
      ['rectangle', 'inside', 'inside', 1, 1],
      ['lShape', 'outside', 'outside', 0, 0],
      ['clockwise', 'inside', 'inside', 1, -1],
      ['notch', 'outside', 'outside', 2, 0],
      ['throughVertex', 'inside', 'inside', 1, 1],
    ]),
  )('locates the query of %s', (name, byRay, byWinding, crossings, winding) => {
    const { polygon, query } = POLYGON_PRESETS[name];
    const ray = last(polygonTrace('ray', polygon, query));
    const wind = last(polygonTrace('winding', polygon, query));
    expect(ray.location).toBe(byRay);
    expect(wind.location).toBe(byWinding);
    expect(ray.crossings).toBe(crossings);
    expect(wind.winding).toBe(winding);
  });

  it('splits the two rules on a star: even crossings, winding number two', () => {
    const { polygon, query } = POLYGON_PRESETS.star;
    const ray = last(polygonTrace('ray', polygon, query));
    const wind = last(polygonTrace('winding', polygon, query));
    expect(ray.location).toBe('outside');
    expect(ray.crossings % 2).toBe(0);
    expect(wind.location).toBe('inside');
    expect(Math.abs(wind.winding)).toBe(2);
  });

  it('stops at once for a point on the outline', () => {
    const { polygon } = POLYGON_PRESETS.rectangle;
    for (const method of /** @type {const} */ (['ray', 'winding'])) {
      const onEdge = last(polygonTrace(method, polygon, { x: 5, y: 1 }));
      expect(onEdge.location).toBe('boundary');
      expect(onEdge.edgesWalked).toBe(1);
      expect(last(polygonTrace(method, polygon, polygon[2])).location).toBe('boundary');
    }
  });

  it('records where the ray crosses, right of the query', () => {
    const { polygon, query } = POLYGON_PRESETS.notch;
    const f = last(polygonTrace('ray', polygon, query));
    expect(f.hits).toHaveLength(2);
    expect(f.hits[0]).toEqual({ x: 8.5, y: 2 });
    for (const hit of f.hits) expect(hit.x).toBeGreaterThan(query.x);
  });

  it('agrees with angle sums, and parity with winding, on random polygons', () => {
    const rand = seeded(21);
    let checked = 0;
    for (let t = 0; t < 1500; t++) {
      const poly = randomPolygon(rand, 3 + Math.floor(rand() * 7));
      const q = {
        x: Math.floor(rand() * (GRID.xMax + 1)),
        y: Math.floor(rand() * (GRID.yMax + 1)),
      };
      const ray = last(polygonTrace('ray', poly, q));
      const wind = last(polygonTrace('winding', poly, q));
      if (onOutline(q, poly)) {
        expect(ray.location).toBe('boundary');
        expect(wind.location).toBe('boundary');
        continue;
      }
      checked++;
      const expected = windingByAngles(q, poly);
      expect(wind.winding, JSON.stringify({ q, poly })).toBe(expected);
      expect(ray.crossings % 2).toBe(Math.abs(expected) % 2);
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('stays within the frame budget at the largest polygon', () => {
    const big = randomPolygon(seeded(4), 12);
    for (const method of /** @type {const} */ (['shoelace', 'ray', 'winding'])) {
      expect(polygonTrace(method, big, { x: 6, y: 4 }).length).toBeLessThan(40);
    }
  });

  it('does not alias frames or the input', () => {
    const { polygon, query } = POLYGON_PRESETS.notch;
    const frames = polygonTrace('ray', polygon, query);
    frames[0].polygon[0].x = 99;
    expect(frames[1].polygon[0].x).toBe(polygon[0].x);
    frames[1].rows[0].value = 99;
    expect(frames[2].rows[0].value).not.toBe(99);
    expect(polygon[0].x).toBe(1);
  });
});

describe('editing helpers', () => {
  it('inserts a new vertex into the nearest edge', () => {
    const { polygon } = POLYGON_PRESETS.rectangle;
    const next = insertVertex(polygon, { x: 5, y: 0 });
    expect(next).toHaveLength(5);
    expect(next[1]).toEqual({ x: 5, y: 0 });
    expect(selfIntersects(next)).toBe(false);
    const after = insertVertex(polygon, { x: 1, y: 3 });
    expect(after[4]).toEqual({ x: 1, y: 3 });
  });

  it('spots a crossing outline', () => {
    expect(selfIntersects(POLYGON_PRESETS.rectangle.polygon)).toBe(false);
    expect(selfIntersects(POLYGON_PRESETS.lShape.polygon)).toBe(false);
    expect(selfIntersects(POLYGON_PRESETS.star.polygon)).toBe(true);
    expect(
      selfIntersects([
        { x: 0, y: 0 },
        { x: 4, y: 4 },
        { x: 4, y: 0 },
        { x: 0, y: 4 },
      ]),
    ).toBe(true);
  });

  it('spots an outline that doubles back on itself', () => {
    expect(
      selfIntersects([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 3 },
      ]),
    ).toBe(true);
  });
});

describe('pseudocode coverage', () => {
  it.each(
    /** @type {['shoelace' | 'ray' | 'winding', string[]][]} */ ([
      ['shoelace', shoelacePseudocode],
      ['ray', rayPseudocode],
      ['winding', windingPseudocode],
    ]),
  )('%s highlights every line', (method, code) => {
    const frames = /** @type {(keyof typeof POLYGON_PRESETS)[]} */ ([
      'rectangle',
      'clockwise',
    ]).flatMap((name) => {
      const { polygon, query } = POLYGON_PRESETS[name];
      return polygonTrace(method, polygon, query);
    });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(code.map((_, i) => i));
  });
});
