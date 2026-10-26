import { describe, expect, it } from 'vitest';
import {
  linearPseudocode,
  linearSearchTrace,
  makeUnsortedArray,
  parseValues,
} from './linear-search.js';

/** Seeded LCG so random arrays are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const VARIANTS = /** @type {const} */ (['plain', 'sentinel']);

/** @param {number[]} a @param {number} x @param {'plain'|'sentinel'} v */
const last = (a, x, v) =>
  /** @type {import('./linear-search.js').LinearFrame} */ (linearSearchTrace(a, x, v).at(-1));

describe('linearSearchTrace', () => {
  it('returns the first index of x, or -1, like indexOf', () => {
    const rand = seeded(7);
    for (let n = 1; n <= 16; n++) {
      const a = Array.from({ length: n }, () => Math.floor(rand() * 6));
      for (let x = -1; x <= 6; x++) {
        for (const v of VARIANTS) expect(last(a, x, v).answer).toBe(a.indexOf(x));
      }
    }
  });

  it('finds the first of several copies', () => {
    for (const v of VARIANTS) expect(last([4, 7, 7, 2, 7], 7, v).answer).toBe(1);
  });

  it('handles an empty array', () => {
    expect(last([], 3, 'plain')).toMatchObject({ answer: -1, comparisons: 0, boundChecks: 1 });
    expect(last([], 3, 'sentinel')).toMatchObject({ answer: -1, comparisons: 1, boundChecks: 1 });
  });

  it('counts k + 1 comparisons and bound checks when x sits at index k', () => {
    const a = [31, 8, 52, 19, 77, 40];
    for (let k = 0; k < a.length; k++) {
      expect(last(a, a[k], 'plain')).toMatchObject({ comparisons: k + 1, boundChecks: k + 1 });
      expect(last(a, a[k], 'sentinel')).toMatchObject({ comparisons: k + 1, boundChecks: 1 });
    }
  });

  it('a miss costs n comparisons and n + 1 bound checks, or n + 1 and 1 with a sentinel', () => {
    const a = [31, 8, 52, 19, 77, 40];
    expect(last(a, 5, 'plain')).toMatchObject({
      kind: 'not-found',
      comparisons: 6,
      boundChecks: 7,
    });
    expect(last(a, 5, 'sentinel')).toMatchObject({
      kind: 'not-found',
      comparisons: 7,
      boundChecks: 1,
      i: 6,
    });
  });

  it('starts with start and ends with found or not-found', () => {
    for (const v of VARIANTS) {
      const frames = linearSearchTrace([3, 1, 2], 1, v);
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('found');
      expect(frames.slice(0, -1).every((f) => f.answer === -2)).toBe(true);
    }
  });

  it('marks only the matching comparison as a match', () => {
    const frames = linearSearchTrace([5, 9, 2], 2, 'plain').filter((f) => f.kind === 'compare');
    expect(frames.map((f) => f.match)).toEqual([false, false, true]);
  });

  it('does not alias frames to each other', () => {
    const frames = linearSearchTrace([1, 2, 3], 3, 'plain');
    frames[1].lines.push(99);
    expect(frames[2].lines).not.toContain(99);
    expect(new Set(frames.map((f) => f.lines)).size).toBe(frames.length);
  });
});

describe('parseValues', () => {
  it('reads commas and spaces', () => {
    expect(parseValues('3, 14 15,9')).toEqual({ values: [3, 14, 15, 9] });
  });

  it('rejects junk, out-of-range values and bad lengths', () => {
    expect(parseValues('3, x')).toEqual({ error: 'format' });
    expect(parseValues('3, 1.5')).toEqual({ error: 'format' });
    expect(parseValues('3, 100')).toEqual({ error: 'range' });
    expect(parseValues('')).toEqual({ error: 'count' });
    expect(parseValues(Array(17).fill('1').join(','))).toEqual({ error: 'count' });
  });
});

describe('makeUnsortedArray', () => {
  it('returns n two-digit values, deterministically', () => {
    const a = makeUnsortedArray(12, seeded(3));
    expect(a).toHaveLength(12);
    expect(a.every((v) => v >= 10 && v <= 99)).toBe(true);
    expect(makeUnsortedArray(12, seeded(3))).toEqual(a);
  });
});

describe('pseudocode coverage', () => {
  it.each(VARIANTS)('%s trace highlights every pseudocode line', (variant) => {
    const a = [31, 8, 52, 19];
    const frames = [52, 5].flatMap((x) => linearSearchTrace(a, x, variant));
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((p, q) => p - q)).toEqual(linearPseudocode[variant].map((_, i) => i));
  });
});
