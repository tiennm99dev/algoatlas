import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  pairSumTrace,
  parseValues,
  partitionTrace,
  pointerPseudocode,
  randomValues,
} from './two-pointers.js';

/** @typedef {import('./two-pointers.js').PointerFrame} PointerFrame */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {PointerFrame[]} frames */
const last = (frames) => /** @type {PointerFrame} */ (frames.at(-1));

/** Brute-force oracle: does any pair of distinct positions sum to t? @param {number[]} a @param {number} t */
function hasPair(a, t) {
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++) if (a[i] + a[j] === t) return true;
  return false;
}

/** @param {number[]} a */
const sorted = (a) => a.slice().sort((x, y) => x - y);

const rand = seeded(3);
const randomCases = Array.from({ length: 40 }, () => {
  const n = 2 + Math.floor(rand() * (MAX_N - 1));
  const a = randomValues(n, rand);
  return { a, t: 2 + Math.floor(rand() * 80) };
});

describe('pair sum', () => {
  it.each([
    { a: [1, 3, 4, 6, 8, 11], t: 10 },
    { a: [1, 3, 4, 6, 8, 11], t: 100 },
    { a: [5, 5], t: 10 },
    { a: [5, 5], t: 9 },
    { a: [2, 2, 2, 2], t: 4 },
    { a: [-7, -3, 0, 4, 9], t: 1 },
    ...randomCases,
  ])('agrees with brute force on $a, T = $t', ({ a, t }) => {
    const frames = pairSumTrace(a, t);
    const f = last(frames);
    expect(f.items).toEqual(sorted(a));
    expect(f.found !== null).toBe(hasPair(a, t));
    if (f.found) {
      const [lo, hi] = f.found;
      expect(lo).toBeLessThan(hi);
      expect(f.items[lo] + f.items[hi]).toBe(t);
    }
    expect(f.checks).toBeLessThanOrEqual(a.length - 1);
    expect(frames[0].kind).toBe('start');
    expect(f.kind).toBe('done');
  });

  it('checks 5 sums to find 10 in [1, 3, 4, 6, 8, 11]', () => {
    const frames = pairSumTrace([1, 3, 4, 6, 8, 11], 10);
    expect(last(frames).checks).toBe(5);
    expect(last(frames).found).toEqual([2, 3]);
    expect(frames.filter((f) => f.kind === 'sum').map((f) => f.sum)).toEqual([12, 9, 11, 9, 10]);
  });

  it('checks exactly n − 1 sums when no pair exists', () => {
    expect(last(pairSumTrace([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 100)).checks).toBe(9);
    expect(last(pairSumTrace([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0)).checks).toBe(9);
  });

  it('sorts the input without changing it', () => {
    const a = [9, 1, 5];
    pairSumTrace(a, 6);
    expect(a).toEqual([9, 1, 5]);
  });
});

describe('partition', () => {
  it.each([
    { a: [7, 2, 9, 4, 1], p: 5 },
    { a: [1, 2, 3], p: 10 },
    { a: [1, 2, 3], p: 0 },
    { a: [5, 5, 5, 5], p: 5 },
    { a: [3, 8], p: 5 },
    { a: [8, 3], p: 5 },
    ...randomCases.map(({ a, t }) => ({ a, p: t % 40 })),
  ])('splits $a around $p in place', ({ a, p }) => {
    const f = last(partitionTrace(a, p));
    const b = f.boundary;
    expect(b).toBe(a.filter((v) => v < p).length);
    expect(f.items.slice(0, b).every((v) => v < p)).toBe(true);
    expect(f.items.slice(b).every((v) => v >= p)).toBe(true);
    expect(sorted(f.items)).toEqual(sorted(a));
    expect(f.swaps).toBeLessThanOrEqual(Math.floor(a.length / 2));
    expect(f.checks).toBeLessThanOrEqual(2 * a.length);
  });

  it('makes 2 swaps and returns 3 on [7, 2, 9, 4, 1] with p = 5', () => {
    const frames = partitionTrace([7, 2, 9, 4, 1], 5);
    const f = last(frames);
    expect(f.items).toEqual([1, 2, 4, 9, 7]);
    expect(f.swaps).toBe(2);
    expect(f.boundary).toBe(3);
    expect(frames.filter((x) => x.kind === 'swap').map((x) => x.swapped)).toEqual([
      [0, 4],
      [2, 3],
    ]);
  });

  it('makes no swaps on an array that is already split', () => {
    expect(last(partitionTrace([1, 2, 8, 9], 5)).swaps).toBe(0);
  });
});

describe('parsing', () => {
  it('reads commas, spaces and Unicode minus signs', () => {
    expect(parseValues('3, 1 −4,2')).toEqual({ values: [3, 1, -4, 2] });
  });
  it('rejects bad input', () => {
    expect(parseValues('')).toEqual({ error: 'format' });
    expect(parseValues('1, x')).toEqual({ error: 'format' });
    expect(parseValues('1.5, 2')).toEqual({ error: 'format' });
    expect(parseValues('1, 100')).toEqual({ error: 'range' });
    expect(parseValues('7')).toEqual({ error: 'count' });
    expect(parseValues(Array.from({ length: MAX_N + 1 }, () => '1').join(','))).toEqual({
      error: 'count',
    });
  });
});

describe('frame independence', () => {
  it('does not share arrays between frames', () => {
    const frames = partitionTrace([7, 2, 9, 4, 1], 5);
    const k = frames.findIndex((f) => f.kind === 'swap');
    frames[k - 1].items[0] = 99;
    /** @type {[number, number]} */ (frames[k].swapped)[0] = 99;
    expect(frames[k].items[0]).toBe(1);
    expect(frames[k + 1].swapped).toBeNull();
    expect(partitionTrace([7, 2, 9, 4, 1], 5)[k].swapped).toEqual([0, 4]);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of the pair search', () => {
    const frames = [...pairSumTrace([1, 3, 4, 6, 8, 11], 10), ...pairSumTrace([1, 2], 9)];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(pointerPseudocode.pair.map((_, i) => i));
  });

  it('highlights every line of the partition', () => {
    const seen = new Set(partitionTrace([7, 2, 9, 4, 1], 5).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(pointerPseudocode.partition.map((_, i) => i));
  });
});
