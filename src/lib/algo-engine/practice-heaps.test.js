import { describe, expect, it } from 'vitest';
import {
  MAX_K,
  MAX_POINTS,
  MAX_STREAM,
  closestPseudocode,
  closestTrace,
  dist2,
  formatPoints,
  makeMedianStream,
  makePoints,
  medianPseudocode,
  medianTrace,
  parseMedianStream,
  parsePoints,
} from './practice-heaps.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Median by sorting a prefix: the oracle. @param {number[]} values */
function sortedMedian(values) {
  const s = values.slice().sort((x, y) => x - y);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

describe('running median', () => {
  it('matches the sorted median after every value', () => {
    const rand = seeded(4);
    for (let t = 0; t < 200; t++) {
      const n = Math.floor(rand() * (MAX_STREAM + 1));
      const stream = Array.from({ length: n }, () => Math.floor(rand() * 30));
      const frames = medianTrace(stream);
      expect(frames.at(-1)?.medians).toEqual(
        stream.map((_, i) => sortedMedian(stream.slice(0, i + 1))),
      );
      for (const f of frames) {
        // Balance: low holds as many as high or one more, and every low value ≤ every high value.
        if (f.kind === 'median') {
          expect(f.low.length - f.high.length).toBeGreaterThanOrEqual(0);
          expect(f.low.length - f.high.length).toBeLessThanOrEqual(1);
          if (f.high.length) expect(Math.max(...f.low)).toBeLessThanOrEqual(Math.min(...f.high));
          expect(f.low[0]).toBe(Math.max(...f.low));
          if (f.high.length) expect(f.high[0]).toBe(Math.min(...f.high));
        }
      }
    }
  });

  it('records the slot a pushed or moved value settles in, even among equal values', () => {
    const rand = seeded(9);
    for (let t = 0; t < 100; t++) {
      const stream = Array.from({ length: MAX_STREAM }, () => Math.floor(rand() * 4));
      const frames = medianTrace(stream);
      for (let i = 1; i < frames.length; i++) {
        const f = frames[i];
        const side =
          f.kind === 'push-low' || f.kind === 'move-down'
            ? 'low'
            : f.kind === 'push-high' || f.kind === 'move-up'
              ? 'high'
              : null;
        if (!side) {
          expect(f.slot).toBe(-1);
          continue;
        }
        expect(f[side][f.slot]).toBe(f.value);
        // A push or a move adds exactly one value to that side.
        const before = frames[i - 1][side];
        expect(f[side]).toHaveLength(before.length + 1);
      }
    }
    // The third 4 lands in slot 1 of low, behind an equal 4 at the root.
    const equal = medianTrace([4, 4, 4]);
    expect(equal.filter((f) => f.kind === 'push-low').map((f) => f.slot)).toEqual([0, 1, 1]);
  });

  it('moves values between the heaps on a known stream', () => {
    const frames = medianTrace([1, 2, 3, 4, 5]);
    expect(frames.at(-1)?.moves).toBe(2);
    expect(frames.filter((f) => f.kind === 'move-down').map((f) => f.value)).toEqual([2, 3]);
    expect(frames.at(-1)?.medians).toEqual([1, 1.5, 2, 2.5, 3]);
    expect(frames.at(-1)?.low).toEqual([3, 1, 2]);
    expect(frames.at(-1)?.high).toEqual([4, 5]);
    // Each value is pushed once, and each move is a pop and a push.
    expect(frames.at(-1)?.heapOps).toBe(5 + 2 * 2);
  });

  it('moves up when low grows too big', () => {
    const frames = medianTrace([5, 1]);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'read',
      'push-low',
      'median',
      'read',
      'push-low',
      'move-up',
      'median',
      'done',
    ]);
    expect(frames.at(-1)?.median).toBe(3);
  });

  it('handles an empty stream and duplicates', () => {
    expect(medianTrace([]).map((f) => f.kind)).toEqual(['start', 'done']);
    expect(medianTrace([4, 4, 4, 4]).at(-1)?.medians).toEqual([4, 4, 4, 4]);
  });

  it('does not alias frames', () => {
    const frames = medianTrace([5, 15, 1, 3]);
    const before = JSON.stringify(frames[6]);
    frames[5].low.push(99);
    frames[5].high.push(99);
    frames[5].medians.push(99);
    expect(JSON.stringify(frames[6])).toBe(before);
  });

  it('stays under 400 frames at the cap', () => {
    const stream = Array.from({ length: MAX_STREAM }, (_, i) => i);
    expect(medianTrace(stream).length).toBeLessThan(400);
  });
});

describe('k closest points', () => {
  it('keeps the k closest points, earlier first on ties', () => {
    const rand = seeded(9);
    for (let t = 0; t < 200; t++) {
      const points = makePoints(rand).slice(0, 1 + Math.floor(rand() * 8));
      const k = 1 + Math.floor(rand() * MAX_K);
      const frames = closestTrace(points, k);
      const want = points
        .map((p, index) => ({ index, d2: dist2(p) }))
        .sort((a, b) => a.d2 - b.d2 || a.index - b.index)
        .slice(0, k)
        .map((e) => e.index)
        .sort((a, b) => a - b);
      const kept = (frames.at(-1)?.heap ?? []).map((e) => e.index).sort((a, b) => a - b);
      expect(kept).toEqual(want);
      for (const f of frames) {
        for (let i = 1; i < f.heap.length; i++) {
          expect(f.heap[i].d2).toBeLessThanOrEqual(f.heap[Math.floor((i - 1) / 2)].d2);
        }
      }
      expect(frames.at(-1)?.rejected.length).toBe(Math.max(0, points.length - k));
    }
  });

  it('pushes, replaces and skips on a known set', () => {
    const points = [
      { x: 1, y: 2 },
      { x: 3, y: 1 },
      { x: -2, y: -2 },
      { x: 0, y: 1 },
      { x: 2, y: -3 },
    ];
    const frames = closestTrace(points, 2);
    expect(frames.filter((f) => f.kind !== 'read').map((f) => f.kind)).toEqual([
      'start',
      'push',
      'push',
      'replace',
      'replace',
      'skip',
      'done',
    ]);
    expect(frames.filter((f) => f.kind === 'replace').map((f) => f.evicted)).toEqual([1, 2]);
    expect(frames.at(-1)?.heap).toEqual([
      { index: 0, d2: 5 },
      { index: 3, d2: 1 },
    ]);
    expect(frames.at(-1)?.rejected).toEqual([1, 2, 4]);
    // One comparison when the second push sifts up, one per later point against the root,
    // and one sift comparison for each replace.
    expect(frames.at(-1)?.comparisons).toBe(1 + 3 + 2);
  });

  it('skips a point tied with the farthest kept one', () => {
    const frames = closestTrace(
      [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      1,
    );
    expect(frames.at(-1)?.heap).toEqual([{ index: 0, d2: 1 }]);
  });

  it('does not alias frames', () => {
    const frames = closestTrace(makePoints(seeded(2)), 3);
    const before = JSON.stringify(frames[5]);
    frames[4].heap.push({ index: 9, d2: 0 });
    frames[4].rejected.push(9);
    expect(JSON.stringify(frames[5])).toBe(before);
  });

  it('stays under 400 frames at the cap', () => {
    const points = Array.from({ length: MAX_POINTS }, (_, i) => ({ x: i - 6, y: 9 - i }));
    expect(closestTrace(points, MAX_K).length).toBeLessThan(400);
  });
});

describe('parsing and presets', () => {
  it('reads a stream', () => {
    expect(parseMedianStream('5 15, 1')).toEqual({ values: [5, 15, 1] });
    expect(parseMedianStream('5, -1')).toEqual({ error: 'format' });
    expect(parseMedianStream('5, 100')).toEqual({ error: 'range' });
    expect(
      parseMedianStream(
        Array(MAX_STREAM + 1)
          .fill('1')
          .join(' '),
      ),
    ).toEqual({
      error: 'count',
    });
  });

  it('reads points', () => {
    expect(parsePoints('(1, 2) (-3,0)')).toEqual({
      points: [
        { x: 1, y: 2 },
        { x: -3, y: 0 },
      ],
    });
    expect(parsePoints('(\u22122, 1) (0, \u22125)')).toEqual({
      points: [
        { x: -2, y: 1 },
        { x: 0, y: -5 },
      ],
    });
    expect(parsePoints('(1, 2) 7')).toEqual({ error: 'format' });
    expect(parsePoints('')).toEqual({ error: 'format' });
    expect(parsePoints('(10, 2)')).toEqual({ error: 'range' });
    expect(parsePoints('(1, 2) (1, 2)')).toEqual({ error: 'duplicate' });
    const many = Array.from(
      { length: MAX_POINTS + 1 },
      (_, i) => `(${(i % 11) - 5}, ${Math.floor(i / 11)})`,
    ).join(' ');
    expect(parsePoints(many)).toEqual({ error: 'count' });
    const points = makePoints(seeded(5));
    expect(parsePoints(formatPoints(points))).toEqual({ points });
    expect(makeMedianStream(seeded(5))).toHaveLength(9);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every running-median line', () => {
    const frames = [...medianTrace([5, 1, 9, 2, 8]), ...medianTrace([1, 2, 3])];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(medianPseudocode.map((_, i) => i));
  });

  it('highlights every k-closest line', () => {
    const frames = closestTrace(
      [
        { x: 1, y: 2 },
        { x: 3, y: 1 },
        { x: -2, y: -2 },
        { x: 0, y: 1 },
        { x: 2, y: -3 },
      ],
      2,
    );
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(closestPseudocode.map((_, i) => i));
  });
});
