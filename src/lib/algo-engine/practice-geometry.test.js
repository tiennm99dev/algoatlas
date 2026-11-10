import { describe, expect, it } from 'vitest';
import {
  GEO_PRESETS,
  GRID,
  MAX_POINTS,
  MIN_POINTS,
  PSEUDOCODE,
  PUZZLES,
  diameterTrace,
  dist2,
  fenceTrace,
  hullOf,
  lineAcross,
  puzzleTrace,
  randomPoints,
  sideTrace,
} from './practice-geometry.js';

/** @typedef {import('./practice-geometry.js').GeoPoint} GeoPoint */
/** @typedef {import('./practice-geometry.js').GeoFrame} GeoFrame */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {GeoFrame[]} frames */
const last = (frames) => /** @type {GeoFrame} */ (frames.at(-1));

/** Hull corners by brute force: p → q is an edge when nothing lies right of it or past its ends. */
/** @param {GeoPoint[]} points */
function bruteCorners(points) {
  const corners = new Set();
  for (const p of points) {
    for (const q of points) {
      if (p === q) continue;
      const ok = points.every((r) => {
        if (r === p || r === q) return true;
        const c = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
        if (c !== 0) return c > 0;
        const t = (r.x - p.x) * (q.x - p.x) + (r.y - p.y) * (q.y - p.y);
        return t > 0 && t < dist2(p, q);
      });
      if (ok) {
        corners.add(p.id);
        corners.add(q.id);
      }
    }
  }
  return [...corners].sort((a, b) => a - b);
}

/** @param {GeoPoint[]} points */
function bruteFarthest(points) {
  let best = -1;
  for (const p of points) for (const q of points) best = Math.max(best, dist2(p, q));
  return best;
}

describe('hull', () => {
  it('matches brute force on random clouds, counter-clockwise', () => {
    const rand = seeded(9);
    for (let t = 0; t < 200; t++) {
      const points = randomPoints(MIN_POINTS + Math.floor(rand() * 10), rand);
      const hull = hullOf(points);
      expect(hull.toSorted((a, b) => a - b)).toEqual(bruteCorners(points));
      const at = (/** @type {number} */ id) => /** @type {GeoPoint} */ (points[id]);
      if (hull.length >= 3)
        for (let i = 0; i < hull.length; i++) {
          const [a, b, c] = [0, 1, 2].map((k) => at(hull[(i + k) % hull.length]));
          expect((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)).toBeGreaterThan(0);
        }
    }
  });

  it('keeps only the two ends of points on one line', () => {
    const line = [
      { id: 0, x: 0, y: 0 },
      { id: 1, x: 2, y: 1 },
      { id: 2, x: 4, y: 2 },
    ];
    expect(hullOf(line).toSorted()).toEqual([0, 2]);
  });
});

describe('which side', () => {
  it('splits the field preset into left, right and on', () => {
    const end = last(sideTrace(GEO_PRESETS.field));
    expect(end.line).toEqual([0, 1]);
    expect(end.sides).toEqual({ left: [2, 5, 8], right: [4, 7], on: [3, 6] });
    expect(end.steps).toBe(7);
  });

  it('asks for the exact cross product and then reveals it', () => {
    const frames = sideTrace(GEO_PRESETS.field);
    const read = frames.filter((f) => f.kind === 'read');
    expect(read.map((f) => f.ask)).toEqual([35, 0, -35, 45, 0, -35, 25]);
    for (const f of read) {
      const next = frames[frames.indexOf(f) + 1];
      expect(f.value).toBeNull();
      expect(next.kind).toBe('classify');
      expect(next.value).toBe(f.ask);
    }
  });

  it('agrees with the cross product sign on random clouds', () => {
    const rand = seeded(3);
    for (let t = 0; t < 100; t++) {
      const points = randomPoints(MIN_POINTS + Math.floor(rand() * 10), rand);
      const [a, b] = points;
      const { sides } = last(sideTrace(points));
      for (const p of points.slice(2)) {
        const c = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
        const group = c > 0 ? sides.left : c < 0 ? sides.right : sides.on;
        expect(group).toContain(p.id);
      }
      expect(sides.left.length + sides.right.length + sides.on.length).toBe(points.length - 2);
    }
  });
});

describe('fence', () => {
  it('sums twice the area and the perimeter of the field preset', () => {
    const frames = fenceTrace(GEO_PRESETS.field);
    const end = last(frames);
    expect(end.hull).toEqual([0, 4, 7, 1, 5, 2]);
    expect(end.twice).toBe(93);
    expect(end.steps).toBe(6);
    expect(frames.filter((f) => f.kind === 'edge').map((f) => f.ask)).toEqual([
      -7, -1, 37, 90, 96, 93,
    ]);
  });

  it('gives the square preset area 48 and perimeter 28', () => {
    const end = last(fenceTrace(GEO_PRESETS.square));
    expect(end.twice / 2).toBe(48);
    expect(end.perimeter).toBeCloseTo(28, 9);
  });

  it('matches a fan of triangles on random clouds', () => {
    const rand = seeded(21);
    for (let t = 0; t < 100; t++) {
      const points = randomPoints(MIN_POINTS + Math.floor(rand() * 10), rand);
      const end = last(fenceTrace(points));
      const h = /** @type {number[]} */ (end.hull).map((id) => points[id]);
      let fan = 0;
      for (let i = 1; i + 1 < h.length; i++)
        fan +=
          (h[i].x - h[0].x) * (h[i + 1].y - h[0].y) - (h[i].y - h[0].y) * (h[i + 1].x - h[0].x);
      expect(end.twice).toBe(fan);
    }
  });
});

describe('farthest pair', () => {
  it('finds A and B in the field preset with 15 of 36 pairs', () => {
    const end = last(diameterTrace(GEO_PRESETS.field));
    expect(end.best).toBe(125);
    expect(end.bestPair).toEqual([0, 1]);
    expect(end.steps).toBe(15);
    expect(end.brute).toBe(36);
  });

  it('matches brute force over every pair on random clouds', () => {
    const rand = seeded(13);
    for (let t = 0; t < 150; t++) {
      const points = randomPoints(MIN_POINTS + Math.floor(rand() * 10), rand);
      const frames = diameterTrace(points);
      const end = last(frames);
      expect(end.best).toBe(bruteFarthest(points));
      const h = /** @type {number[]} */ (end.hull).length;
      expect(end.steps).toBe((h * (h - 1)) / 2);
      expect(frames.length).toBeLessThan(400);
    }
  });
});

describe('frames', () => {
  it.each(PUZZLES)('%s starts and ends right and does not alias', (puzzle) => {
    const frames = puzzleTrace(puzzle, GEO_PRESETS.field);
    expect(frames[0].kind).toBe('start');
    expect(last(frames).kind).toBe('done');
    const [a, b] = [frames[2], frames[3]];
    a.points[0].x = 99;
    a.sides.left.push(99);
    a.done.push(99);
    a.hull?.push(99);
    expect(b.points[0].x).not.toBe(99);
    expect(b.sides.left).not.toContain(99);
    expect(b.done).not.toContain(99);
    expect(b.hull ?? []).not.toContain(99);
  });
});

describe('line across the plane', () => {
  it('runs from edge to edge through both points', () => {
    const l = lineAcross({ x: 1, y: 1 }, { x: 11, y: 6 });
    expect(l).toEqual({ x1: 0, y1: 0.5, x2: 12, y2: 6.5 });
    const v = lineAcross({ x: 3, y: 2 }, { x: 3, y: 5 });
    expect(v).toEqual({ x1: 3, y1: 0, x2: 3, y2: GRID.yMax });
  });
});

describe('random points', () => {
  it('are distinct and capped', () => {
    const points = randomPoints(40, seeded(2));
    expect(points).toHaveLength(MAX_POINTS);
    expect(new Set(points.map((p) => `${p.x},${p.y}`)).size).toBe(MAX_POINTS);
    expect(randomPoints(1, seeded(2))).toHaveLength(MIN_POINTS);
  });
});

describe('pseudocode coverage', () => {
  it.each(PUZZLES)('%s highlights every line', (puzzle) => {
    const frames = puzzleTrace(puzzle, GEO_PRESETS.field);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(PSEUDOCODE[puzzle].map((_, i) => i));
  });
});
