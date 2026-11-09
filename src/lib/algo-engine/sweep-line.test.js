import { describe, expect, it } from 'vitest';
import {
  GRID,
  MAX_SEGMENTS,
  SPARE_SEGMENTS,
  SWEEP_PRESETS,
  allPseudocode,
  anyPseudocode,
  meetingPoint,
  sweepEvents,
  sweepTrace,
} from './sweep-line.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./sweep-line.js').SweepSegment} SweepSegment */
/** @typedef {import('./sweep-line.js').SweepFrame} SweepFrame */

/** @param {SweepFrame[]} frames */
const last = (frames) => /** @type {SweepFrame} */ (frames.at(-1));

/** @param {{x: number, y: number}} a @param {{x: number, y: number}} b @param {{x: number, y: number}} p */
function latticeOn(a, b, p) {
  const gap = Math.hypot(p.x - a.x, p.y - a.y) + Math.hypot(p.x - b.x, p.y - b.y);
  return Math.abs(gap - Math.hypot(b.x - a.x, b.y - a.y)) < 1e-9;
}

/** Whether two segments meet, from the parametric equations; parallel pairs by their ends. */
/** @param {SweepSegment} s @param {SweepSegment} t */
function meets(s, t) {
  const [a, b, c, d] = [s.p, s.q, t.p, t.q];
  const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (den !== 0) {
    const tn = (c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x);
    const un = (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
    const [v, u] = den > 0 ? [tn, un] : [-tn, -un];
    const size = Math.abs(den);
    return v >= 0 && v <= size && u >= 0 && u <= size;
  }
  return [a, b].some((p) => latticeOn(c, d, p)) || [c, d].some((p) => latticeOn(a, b, p));
}

/** Every meeting pair by brute force, as sorted "i-j" keys. */
/** @param {SweepSegment[]} segs */
function brutePairs(segs) {
  const out = [];
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      if (meets(segs[i], segs[j])) out.push(`${segs[i].id}-${segs[j].id}`);
    }
  }
  return out.sort();
}

/** @param {() => number} rand @param {number} n @param {number} span */
function randomSegments(rand, n, span) {
  /** @type {SweepSegment[]} */
  const out = [];
  for (let id = 0; id < n; id++) {
    const c = () => Math.floor(rand() * span);
    out.push({ id, p: { x: c(), y: c() }, q: { x: c(), y: c() } });
  }
  return out;
}

describe('sweep events', () => {
  it('makes two per segment, ordered by x with starts first on a tie', () => {
    const events = sweepEvents(SWEEP_PRESETS.touching);
    expect(events).toHaveLength(6);
    for (let i = 1; i < events.length; i++) {
      expect(events[i].x).toBeGreaterThanOrEqual(events[i - 1].x);
    }
    const atSix = events.filter((e) => e.x === 6).map((e) => e.type);
    expect(atSix).toEqual(['start', 'end']);
  });

  it('accepts ends given right to left', () => {
    const events = sweepEvents([{ id: 0, p: { x: 5, y: 1 }, q: { x: 2, y: 3 } }]);
    expect(events.map((e) => [e.x, e.type])).toEqual([
      [2, 'start'],
      [5, 'end'],
    ]);
  });
});

describe('any-crossing sweep', () => {
  it('stops at the first hit', () => {
    const f = last(sweepTrace('any', SWEEP_PRESETS.crossing));
    expect(f.hits).toHaveLength(1);
    expect(f.kind).toBe('done');
    expect(f.eventAt).toBeGreaterThanOrEqual(0);
    expect(f.eventAt).toBeLessThan(f.events.length - 1);
  });

  it('finds nothing on disjoint and parallel segments', () => {
    expect(last(sweepTrace('any', SWEEP_PRESETS.disjoint)).hits).toEqual([]);
    expect(last(sweepTrace('any', SWEEP_PRESETS.parallel)).hits).toEqual([]);
  });

  it('agrees with brute force on random small inputs, degenerate ones included', () => {
    const rand = seeded(13);
    for (let t = 0; t < 4000; t++) {
      const segs = randomSegments(rand, 2 + Math.floor(rand() * 6), 3 + Math.floor(rand() * 6));
      const f = last(sweepTrace('any', segs));
      expect(f.hits.length > 0, JSON.stringify(segs)).toBe(brutePairs(segs).length > 0);
      for (const hit of f.hits) expect(meets(segs[hit.i], segs[hit.j])).toBe(true);
    }
  });

  it('tests only about two pairs per segment when nothing meets', () => {
    const f = last(sweepTrace('any', SWEEP_PRESETS.parallel));
    expect(f.pairTests).toBeLessThanOrEqual(3 * SWEEP_PRESETS.parallel.length);
    expect(f.pairTests).toBeLessThan(28);
  });
});

describe('all-crossings sweep', () => {
  it('reports every crossing of the mesh', () => {
    const f = last(sweepTrace('all', SWEEP_PRESETS.mesh));
    expect(f.hits).toHaveLength(9);
    expect(f.eventAt).toBe(-1);
    expect(f.active).toEqual([]);
    expect(f.finished).toHaveLength(6);
  });

  it('matches brute force pair for pair on random inputs', () => {
    const rand = seeded(29);
    for (let t = 0; t < 1500; t++) {
      const segs = randomSegments(rand, 2 + Math.floor(rand() * 7), 3 + Math.floor(rand() * 7));
      const f = last(sweepTrace('all', segs));
      const found = f.hits.map((h) => `${Math.min(h.i, h.j)}-${Math.max(h.i, h.j)}`).sort();
      expect(found, JSON.stringify(segs)).toEqual(brutePairs(segs));
    }
  });

  it('tests every pair when all overlap in x, and none when none do', () => {
    expect(last(sweepTrace('all', SWEEP_PRESETS.parallel)).pairTests).toBe(28);
    const apart = [
      { id: 0, p: { x: 0, y: 0 }, q: { x: 1, y: 0 } },
      { id: 1, p: { x: 3, y: 0 }, q: { x: 4, y: 0 } },
      { id: 2, p: { x: 6, y: 0 }, q: { x: 7, y: 0 } },
    ];
    expect(last(sweepTrace('all', apart)).pairTests).toBe(0);
  });
});

describe('active set', () => {
  it('lists segments lowest first at the line', () => {
    const frames = sweepTrace('all', SWEEP_PRESETS.parallel);
    const widest = frames.reduce((a, b) => (b.active.length > a.active.length ? b : a));
    expect(widest.active).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('handles one segment and a vertical segment', () => {
    const one = [{ id: 0, p: { x: 2, y: 2 }, q: { x: 2, y: 6 } }];
    expect(last(sweepTrace('any', one)).hits).toEqual([]);
    expect(last(sweepTrace('all', one)).finished).toEqual([0]);
  });

  it('reports a shared stretch from its first point', () => {
    const lap = [
      { id: 0, p: { x: 1, y: 1 }, q: { x: 5, y: 1 } },
      { id: 1, p: { x: 3, y: 1 }, q: { x: 7, y: 1 } },
    ];
    expect(meetingPoint(lap[0], lap[1])).toEqual({ x: 3, y: 1 });
  });

  it('keeps every spare and preset on the plane, with room for the spares', () => {
    expect(SPARE_SEGMENTS.length).toBeGreaterThanOrEqual(MAX_SEGMENTS);
    for (const segs of [...Object.values(SWEEP_PRESETS), SPARE_SEGMENTS]) {
      for (const s of segs) {
        for (const p of [s.p, s.q]) {
          expect(p.x).toBeLessThanOrEqual(GRID.xMax);
          expect(p.y).toBeLessThanOrEqual(GRID.yMax);
        }
      }
    }
  });

  it('does not alias frames or the input', () => {
    const segs = SWEEP_PRESETS.crossing;
    const frames = sweepTrace('all', segs);
    frames[0].segments[0].p.x = 99;
    expect(frames[1].segments[0].p.x).toBe(segs[0].p.x);
    expect(segs[0].p.x).toBe(1);
    const at = frames.findIndex((f) => f.active.length > 0);
    frames[at].active[0] = 99;
    expect(frames[at + 1].active[0]).not.toBe(99);
  });

  it('stays within the frame budget at the largest input', () => {
    expect(sweepTrace('all', SWEEP_PRESETS.parallel).length).toBeLessThan(120);
    expect(sweepTrace('any', SWEEP_PRESETS.parallel).length).toBeLessThan(120);
  });
});

describe('pseudocode coverage', () => {
  it.each(
    /** @type {['any' | 'all', string[]][]} */ ([
      ['any', anyPseudocode],
      ['all', allPseudocode],
    ]),
  )('%s highlights every line', (method, code) => {
    const frames = [
      ...sweepTrace(method, SWEEP_PRESETS.crossing),
      ...sweepTrace(method, SWEEP_PRESETS.disjoint),
      ...sweepTrace(method, SWEEP_PRESETS.parallel),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(code.map((_, i) => i));
  });
});
