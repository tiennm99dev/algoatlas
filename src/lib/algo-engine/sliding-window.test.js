import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  fixedWindowTrace,
  parseWindowValues,
  randomWindowValues,
  shortestWindowTrace,
  windowPseudocode,
} from './sliding-window.js';

/** @typedef {import('./sliding-window.js').WindowFrame} WindowFrame */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {WindowFrame[]} frames */
const last = (frames) => /** @type {WindowFrame} */ (frames.at(-1));

/** @param {number[]} a @param {number} from @param {number} to */
const sumOf = (a, from, to) => a.slice(from, to).reduce((x, y) => x + y, 0);

/** Brute-force oracle: the largest sum over every window of k. @param {number[]} a @param {number} k */
function bruteMax(a, k) {
  let best = -Infinity;
  for (let i = 0; i + k <= a.length; i++) best = Math.max(best, sumOf(a, i, i + k));
  return best;
}

/** Brute-force oracle: the shortest window with sum ≥ s, 0 for none. @param {number[]} a @param {number} s */
function bruteShortest(a, s) {
  let best = 0;
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j <= a.length; j++)
      if (sumOf(a, i, j) >= s && (best === 0 || j - i < best)) best = j - i;
  return best;
}

const rand = seeded(9);
const randomArrays = Array.from({ length: 30 }, () =>
  randomWindowValues(1 + Math.floor(rand() * MAX_N), rand),
);

describe('fixed window', () => {
  it.each([
    { a: [2, 1, 5, 1, 3, 2], k: 3 },
    { a: [4], k: 1 },
    { a: [1, 2, 3], k: 3 },
    { a: [0, 0, 0, 0], k: 2 },
    { a: [9, 1, 1, 1, 9], k: 1 },
    ...randomArrays.map((a, i) => ({ a, k: 1 + (i % a.length) })),
  ])('matches brute force on $a with k = $k', ({ a, k }) => {
    const frames = fixedWindowTrace(a, k);
    const f = last(frames);
    expect(f.best).toBe(bruteMax(a, k));
    expect(sumOf(a, f.bestFrom, f.bestTo)).toBe(f.best);
    expect(f.bestTo - f.bestFrom).toBe(k);
    expect(f.updates).toBe(k + 2 * (a.length - k));
    for (const x of frames) expect(x.sum).toBe(sumOf(a, x.left, x.right));
  });

  it('finds 9 in [2, 1, 5, 1, 3, 2] with k = 3 and keeps the first of equal windows', () => {
    const f = last(fixedWindowTrace([2, 1, 5, 1, 3, 2], 3));
    expect(f.best).toBe(9);
    expect([f.bestFrom, f.bestTo]).toEqual([2, 5]);
    const tie = last(fixedWindowTrace([5, 1, 5, 1], 2));
    expect([tie.bestFrom, tie.bestTo]).toEqual([0, 2]);
  });

  it('costs 16 updates for n = 10 and k = 4', () => {
    expect(last(fixedWindowTrace(randomWindowValues(10, seeded(2)), 4)).updates).toBe(16);
  });
});

describe('shortest window', () => {
  it.each([
    { a: [2, 3, 1, 2, 4, 3], s: 7 },
    { a: [1, 1, 1], s: 10 },
    { a: [7], s: 7 },
    { a: [0, 0, 5, 0], s: 5 },
    { a: [1, 4, 4], s: 4 },
    ...randomArrays.map((a, i) => ({ a, s: 1 + ((i * 7) % 40) })),
  ])('matches brute force on $a with S = $s', ({ a, s }) => {
    const frames = shortestWindowTrace(a, s);
    const f = last(frames);
    expect(f.best).toBe(bruteShortest(a, s));
    if (f.best > 0) {
      expect(f.bestTo - f.bestFrom).toBe(f.best);
      expect(sumOf(a, f.bestFrom, f.bestTo)).toBeGreaterThanOrEqual(s);
    } else expect(f.bestFrom).toBe(-1);
    expect(f.updates).toBeLessThanOrEqual(2 * a.length);
    expect(f.shrinks).toBeLessThanOrEqual(a.length);
    for (const x of frames) expect(x.sum).toBe(sumOf(a, x.left, x.right));
  });

  it('finds length 2 with 5 shrinks in [2, 3, 1, 2, 4, 3] for S = 7', () => {
    const f = last(shortestWindowTrace([2, 3, 1, 2, 4, 3], 7));
    expect(f.best).toBe(2);
    expect([f.bestFrom, f.bestTo]).toEqual([4, 6]);
    expect(f.shrinks).toBe(5);
    expect(f.updates).toBe(11);
  });
});

describe('parsing', () => {
  it('reads commas and spaces', () => {
    expect(parseWindowValues('2, 1 5,0')).toEqual({ values: [2, 1, 5, 0] });
  });
  it('rejects bad input', () => {
    expect(parseWindowValues(' ')).toEqual({ error: 'format' });
    expect(parseWindowValues('1, -2')).toEqual({ error: 'format' });
    expect(parseWindowValues('1, 100')).toEqual({ error: 'range' });
    expect(parseWindowValues(Array.from({ length: MAX_N + 1 }, () => '1').join(' '))).toEqual({
      error: 'count',
    });
  });
});

describe('frame independence', () => {
  it('does not share arrays between frames', () => {
    const frames = fixedWindowTrace([2, 1, 5], 2);
    frames[1].items[0] = 99;
    frames[1].lines.push(99);
    expect(frames[2].items[0]).toBe(2);
    expect(frames[2].lines).not.toContain(99);
  });

  it('marks entering and leaving cells only on their own frame', () => {
    const frames = fixedWindowTrace([2, 1, 5], 2);
    const slide = /** @type {WindowFrame} */ (frames.find((f) => f.kind === 'slide'));
    expect([slide.entering, slide.leaving]).toEqual([2, 0]);
    expect(last(frames).entering).toBe(-1);
    expect(last(frames).leaving).toBe(-1);
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['fixed', fixedWindowTrace([2, 1, 5, 1, 3, 2], 3), windowPseudocode.fixed],
    ['variable', shortestWindowTrace([2, 3, 1, 2, 4, 3], 7), windowPseudocode.variable],
  ])('%s window highlights every line', (_, frames, code) => {
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(code.map((_, i) => i));
  });
});
