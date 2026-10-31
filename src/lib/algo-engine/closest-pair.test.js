import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  bruteForceClosest,
  closestPseudocode,
  closestTrace,
  dist2,
  parsePoints,
} from './closest-pair.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Distinct random points. @param {number} n @param {() => number} rand @param {number} [span] */
function randomPoints(n, rand, span = 100) {
  /** @type {Map<string, {id: number, x: number, y: number}>} */
  const seen = new Map();
  while (seen.size < n) {
    const x = Math.floor(rand() * span);
    const y = Math.floor(rand() * span);
    if (!seen.has(`${x},${y}`)) seen.set(`${x},${y}`, { id: seen.size, x, y });
  }
  return [...seen.values()];
}

/** @param {{id: number, x: number, y: number}[]} pts */
const finish = (pts) =>
  /** @type {import('./closest-pair.js').ClosestFrame} */ (closestTrace(pts).at(-1));

const EXAMPLE = [
  [10, 80],
  [22, 30],
  [35, 62],
  [41, 15],
  [48, 50],
  [53, 52],
  [62, 85],
  [70, 25],
  [82, 60],
  [90, 10],
].map(([x, y], id) => ({ id, x, y }));

describe('closest pair', () => {
  it('matches checking every pair on random point sets', () => {
    const rand = seeded(17);
    for (let t = 0; t < 300; t++) {
      const n = 2 + (t % (MAX_N - 1));
      const pts = randomPoints(n, rand, t % 3 === 0 ? 12 : 100);
      const done = finish(pts);
      const oracle = bruteForceClosest(pts);
      expect(done.d2).toBe(oracle.d2);
      const [a, b] = /** @type {[number, number]} */ (done.pair);
      expect(dist2(pts[a], pts[b])).toBe(oracle.d2);
      expect(done.best2).toBe(oracle.d2);
    }
  });

  it('finds the pair that crosses the dividing line in the example', () => {
    const frames = closestTrace(EXAMPLE);
    const done = frames.at(-1);
    expect(done?.d2).toBe(29);
    expect(done?.pair?.slice().sort()).toEqual([4, 5]);
    const top = frames.find((f) => f.kind === 'combine' && f.range?.[0] === 0 && f.range[1] === 9);
    expect(top?.line).toBe(53);
    expect(top?.d2).toBe(13 * 13 + 12 * 12);
    const strip = frames.find((f) => f.kind === 'strip' && f.range?.[1] === 9 && f.range[0] === 0);
    expect(strip?.strip).toEqual([3, 7, 4, 5, 6]);
  });

  it('handles two points, three points and points on one vertical line', () => {
    expect(finish(EXAMPLE.slice(0, 2)).d2).toBe(12 * 12 + 50 * 50);
    expect(finish(EXAMPLE.slice(0, 3)).checks).toBe(3);
    const column = [0, 7, 9, 20, 26, 40, 41].map((y, id) => ({ id, x: 5, y }));
    expect(finish(column).d2).toBe(1);
  });

  it('compares each strip point with at most 7 later points', () => {
    const rand = seeded(3);
    for (let t = 0; t < 100; t++) {
      const frames = closestTrace(randomPoints(MAX_N, rand, t % 2 ? 20 : 100));
      /** @type {Map<string, number>} */
      const per = new Map();
      for (const f of frames) {
        if (f.kind !== 'strip-check' || !f.checking) continue;
        const key = `${f.range}:${f.checking[0]}`;
        per.set(key, (per.get(key) ?? 0) + 1);
      }
      for (const c of per.values()) expect(c).toBeLessThanOrEqual(7);
    }
  });

  it('checks fewer pairs than all pairs on spread-out points', () => {
    const pts = Array.from({ length: 16 }, (_, i) => ({ id: i, x: i * 6, y: (i * 37) % 97 }));
    expect(finish(pts).checks).toBeLessThan((16 * 15) / 2);
  });

  it('starts, sorts by x and ends with done', () => {
    const frames = closestTrace([
      { id: 0, x: 9, y: 1 },
      { id: 1, x: 2, y: 3 },
    ]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'sort', 'base', 'brute', 'return', 'done']);
    expect(frames[0].points.map((p) => p.id)).toEqual([0, 1]);
    expect(frames[1].points.map((p) => p.id)).toEqual([1, 0]);
  });

  it('stays under 300 frames at the cap', () => {
    const rand = seeded(5);
    for (let t = 0; t < 30; t++) {
      expect(closestTrace(randomPoints(MAX_N, rand, t % 2 ? 10 : 100)).length).toBeLessThan(300);
    }
  });

  it('keeps frames independent of each other and of the input', () => {
    const input = EXAMPLE.map((p) => ({ ...p }));
    const frames = closestTrace(input);
    input[0].x = 0;
    expect(frames[0].points[0].x).toBe(10);
    const s = frames.findIndex((f) => f.kind === 'strip');
    frames[s].points[0].x = -5;
    frames[s].strip.push(99);
    frames[s].stack[0][0] = -1;
    expect(frames[s + 1].points[0].x).not.toBe(-5);
    expect(frames[s + 1].strip).not.toContain(99);
    expect(frames[s + 1].stack[0][0]).toBe(0);
  });
});

describe('parsing points', () => {
  it('reads pairs with or without brackets', () => {
    expect(parsePoints('(3, 4) (10, 2)')).toEqual({
      points: [
        { id: 0, x: 3, y: 4 },
        { id: 1, x: 10, y: 2 },
      ],
    });
    expect(parsePoints('3,4; 10,2')).toEqual(parsePoints('(3, 4) (10, 2)'));
  });

  it('refuses bad input', () => {
    expect(parsePoints('')).toEqual({ error: 'format' });
    expect(parsePoints('3, 4, 5')).toEqual({ error: 'format' });
    expect(parsePoints('(3, x)')).toEqual({ error: 'format' });
    expect(parsePoints('(3, 4) (100, 2)')).toEqual({ error: 'range' });
    expect(parsePoints('(3, 4)')).toEqual({ error: 'count' });
    expect(parsePoints('(3, 4) (3, 4)')).toEqual({ error: 'duplicate' });
    const many = Array.from({ length: 17 }, (_, i) => `(${i}, ${i})`).join(' ');
    expect(parsePoints(many)).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const seen = new Set(closestTrace(EXAMPLE).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(closestPseudocode.map((_, i) => i));
  });
});
