import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  bruteForceInversions,
  inversionPseudocode,
  inversionTrace,
  parseInversionValues,
} from './counting-inversions.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} n @param {() => number} rand @param {number} [max] */
const randomArray = (n, rand, max = 99) =>
  Array.from({ length: n }, () => Math.floor(rand() * (max + 1)));

/** @param {number[]} a */
const finish = (a) =>
  /** @type {import('./counting-inversions.js').InversionFrame} */ (inversionTrace(a).at(-1));

describe('counting inversions', () => {
  it.each([
    ['two in order', [1, 2], 0],
    ['two swapped', [2, 1], 1],
    ['sorted', [1, 2, 3, 4, 5, 6, 7, 8], 0],
    ['reversed', [8, 7, 6, 5, 4, 3, 2, 1], 28],
    ['all equal', [5, 5, 5, 5], 0],
    ['lesson example', [3, 7, 1, 8, 5, 2, 6, 4], 14],
    ['duplicates', [2, 3, 2, 1, 3, 1], 8],
  ])('%s', (_, input, expected) => {
    expect(bruteForceInversions(input)).toBe(expected);
    expect(finish(input).inversions).toBe(expected);
  });

  it('matches the brute-force count on random arrays of every size', () => {
    const rand = seeded(11);
    for (let n = 2; n <= MAX_N; n++) {
      for (let t = 0; t < 20; t++) {
        const input = randomArray(n, rand, t % 2 ? 9 : 99);
        const done = finish(input);
        expect(done.inversions).toBe(bruteForceInversions(input));
        expect(done.pairs).toHaveLength(done.inversions);
        expect(done.values).toEqual(input.slice().sort((x, y) => x - y));
      }
    }
  });

  it('lists exactly the inverted pairs as (larger, smaller) values', () => {
    const input = [3, 1, 2];
    const pairs = finish(input)
      .pairs.map(([x, y]) => `${x}>${y}`)
      .sort();
    expect(pairs).toEqual(['3>1', '3>2']);
  });

  it('adds |L| − i on every take from the right', () => {
    const frames = inversionTrace([2, 5, 9, 1, 6, 7]);
    const top = frames.filter(
      (f) => f.kind === 'take-right' && f.range?.[1] === 5 && f.range[0] === 0,
    );
    expect(top.map((f) => f.gained)).toEqual([3, 1, 1]);
    expect(frames.at(-1)?.inversions).toBe(5);
  });

  it('counts n − 1 comparisons for a sorted power-of-two array per level', () => {
    // On sorted input every merge exhausts the left run first: |L| comparisons per merge.
    const done = finish([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(done.comparisons).toBe(4 * 1 + 2 * 2 + 1 * 4);
    const rev = finish([8, 7, 6, 5, 4, 3, 2, 1]);
    expect(rev.comparisons).toBe(12);
  });

  it('splits a call tally into left, right and cross inversions', () => {
    const merged = inversionTrace([3, 7, 1, 8, 5, 2, 6, 4]).filter((f) => f.kind === 'merged');
    const top = merged.at(-1);
    expect(top?.call).toEqual({ left: 2, right: 3, cross: 9 });
  });

  it('starts and ends with start and done frames', () => {
    const frames = inversionTrace([2, 1]);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'split',
      'copy',
      'take-right',
      'take-left',
      'merged',
      'done',
    ]);
  });

  it('keeps traces under 150 frames at the cap', () => {
    expect(inversionTrace(randomArray(MAX_N, seeded(3))).length).toBeLessThan(150);
  });

  it('keeps frames independent of each other and of the input', () => {
    const input = [4, 3, 2, 1];
    const frames = inversionTrace(input);
    input[0] = 99;
    expect(frames[0].values[0]).toBe(4);
    const take = frames.findIndex((f) => f.kind === 'take-right');
    frames[take].values[0] = -1;
    frames[take].left[0] = -1;
    frames[take].pairs[0][0] = -1;
    expect(frames[take + 1].values[0]).not.toBe(-1);
    expect(frames[take + 1].left[0]).not.toBe(-1);
    expect(frames[take + 1].pairs[0][0]).toBe(4);
  });
});

describe('parsing values', () => {
  it('reads commas and spaces and refuses bad input', () => {
    expect(parseInversionValues('3, 1 2')).toEqual({ values: [3, 1, 2] });
    expect(parseInversionValues('')).toEqual({ error: 'format' });
    expect(parseInversionValues('1, x')).toEqual({ error: 'format' });
    expect(parseInversionValues('1, -2')).toEqual({ error: 'format' });
    expect(parseInversionValues('1, 100')).toEqual({ error: 'range' });
    expect(parseInversionValues('1')).toEqual({ error: 'count' });
    expect(parseInversionValues(Array(17).fill('1').join(' '))).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const seen = new Set(inversionTrace([3, 7, 1, 8, 5]).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(inversionPseudocode.map((_, i) => i));
  });
});
