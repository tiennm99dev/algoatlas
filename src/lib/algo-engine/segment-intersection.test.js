import { describe, expect, it } from 'vitest';
import { GRID, SEGMENT_PRESETS, segmentPseudocode, segmentTrace } from './segment-intersection.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {{x: number, y: number}} P */

/** Whether p is on closed segment ab: the two distances to its ends add up to its length. */
/** @param {P} a @param {P} b @param {P} p */
function latticeOn(a, b, p) {
  const gap = Math.hypot(p.x - a.x, p.y - a.y) + Math.hypot(p.x - b.x, p.y - b.y);
  return Math.abs(gap - Math.hypot(b.x - a.x, b.y - a.y)) < 1e-9;
}

/** Solves the two parametric equations directly; parallel pairs are searched on the lattice. */
/** @param {P} a @param {P} b @param {P} c @param {P} d */
function oracle(a, b, c, d) {
  const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (den !== 0) {
    const tn = (c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x);
    const un = (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
    const [t, u] = den > 0 ? [tn, un] : [-tn, -un];
    const size = Math.abs(den);
    return t >= 0 && t <= size && u >= 0 && u <= size;
  }
  return [a, b].some((p) => latticeOn(c, d, p)) || [c, d].some((p) => latticeOn(a, b, p));
}

/** @param {import('./segment-intersection.js').SegmentFrame[]} frames */
const last = (frames) =>
  /** @type {import('./segment-intersection.js').SegmentFrame} */ (frames.at(-1));

describe('segment intersection trace', () => {
  it.each(
    /** @type {[keyof typeof SEGMENT_PRESETS, string][]} */ ([
      ['crossing', 'cross'],
      ['tee', 'touch'],
      ['overlap', 'overlap'],
      ['endToEnd', 'touch'],
      ['gap', 'none'],
      ['parallel', 'none'],
      ['lineOnly', 'none'],
    ]),
  )('reads preset %s as %s', (name, outcome) => {
    const { a, b, c, d } = SEGMENT_PRESETS[name];
    expect(last(segmentTrace(a, b, c, d)).outcome).toBe(outcome);
  });

  it('finds the crossing point with an exact parameter', () => {
    const f = last(segmentTrace({ x: 0, y: 0 }, { x: 6, y: 3 }, { x: 0, y: 3 }, { x: 6, y: 0 }));
    expect(f.point).toEqual({ x: 3, y: 1.5 });
    expect(f.t).toEqual({ num: 1, den: 2 });
  });

  it('reports the shared stretch of collinear overlaps', () => {
    const { a, b, c, d } = SEGMENT_PRESETS.overlap;
    expect(last(segmentTrace(a, b, c, d)).shared).toEqual([c, b]);
  });

  it('reports the single point of a collinear end-to-end touch', () => {
    const { a, b, c, d } = SEGMENT_PRESETS.endToEnd;
    const f = last(segmentTrace(a, b, c, d));
    expect(f.point).toEqual(b);
    expect(f.shared).toBeNull();
  });

  it('handles a segment shrunk to one point', () => {
    const p = { x: 3, y: 3 };
    expect(last(segmentTrace(p, p, { x: 1, y: 1 }, { x: 5, y: 5 })).outcome).toBe('touch');
    expect(last(segmentTrace(p, p, { x: 1, y: 0 }, { x: 5, y: 0 })).outcome).toBe('none');
    expect(last(segmentTrace(p, p, p, p)).outcome).toBe('touch');
  });

  it('counts four orientation tests, and box checks only for zeros', () => {
    const cross = SEGMENT_PRESETS.crossing;
    expect(last(segmentTrace(cross.a, cross.b, cross.c, cross.d)).tests).toBe(4);
    expect(last(segmentTrace(cross.a, cross.b, cross.c, cross.d)).boxChecks).toBe(0);
    const gap = SEGMENT_PRESETS.gap;
    expect(last(segmentTrace(gap.a, gap.b, gap.c, gap.d)).boxChecks).toBe(4);
    const tee = SEGMENT_PRESETS.tee;
    expect(last(segmentTrace(tee.a, tee.b, tee.c, tee.d)).boxChecks).toBe(1);
  });

  it('agrees with solving the equations on random small inputs', () => {
    const rand = seeded(3);
    /** @returns {P} */
    const point = () => ({ x: Math.floor(rand() * 7), y: Math.floor(rand() * 7) });
    for (let t = 0; t < 4000; t++) {
      const [a, b, c, d] = [point(), point(), point(), point()];
      const f = last(segmentTrace(a, b, c, d));
      expect(f.outcome !== 'none', JSON.stringify({ a, b, c, d })).toBe(oracle(a, b, c, d));
      if (f.point) {
        expect(latticeOn(a, b, f.point)).toBe(true);
        expect(latticeOn(c, d, f.point)).toBe(true);
      }
    }
  });

  it('does not alias frames or the input', () => {
    const { a, b, c, d } = SEGMENT_PRESETS.crossing;
    const frames = segmentTrace(a, b, c, d);
    frames[0].a.x = 99;
    frames[1].o[0] = 99;
    expect(frames[1].a.x).toBe(a.x);
    expect(frames[2].o[0]).not.toBe(99);
    expect(a.x).toBe(1);
  });

  it('keeps coordinates on the plane in every preset', () => {
    for (const { a, b, c, d } of Object.values(SEGMENT_PRESETS)) {
      for (const p of [a, b, c, d]) {
        expect(p.x).toBeLessThanOrEqual(GRID.xMax);
        expect(p.y).toBeLessThanOrEqual(GRID.yMax);
      }
    }
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line across a hit, a miss and a collinear overlap', () => {
    const frames = /** @type {(keyof typeof SEGMENT_PRESETS)[]} */ ([
      'crossing',
      'gap',
      'overlap',
    ]).flatMap((name) => {
      const { a, b, c, d } = SEGMENT_PRESETS[name];
      return segmentTrace(a, b, c, d);
    });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(segmentPseudocode.map((_, i) => i));
  });
});
