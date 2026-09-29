import { describe, expect, it } from 'vitest';
import {
  binarySearchTrace,
  decide,
  linearSearchComparisons,
  makeSortedArray,
} from './searching.js';

const a = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];

describe('binarySearchTrace', () => {
  it('finds every present element', () => {
    for (const [i, v] of a.entries()) {
      const last = binarySearchTrace(a, v).at(-1);
      expect(last?.kind).toBe('found');
      expect(last?.mid).toBe(i);
    }
  });

  it('reports absent targets, including below and above the range', () => {
    for (const v of [1, 3, 100]) {
      expect(binarySearchTrace(a, v).at(-1)?.kind).toBe('not-found');
    }
  });

  it('never reads more than floor(log2 n) + 1 elements', () => {
    const big = makeSortedArray(1000);
    const bound = Math.floor(Math.log2(big.length)) + 1;
    for (const v of [big[0], big[999], big[500], -1, 1e9]) {
      expect(binarySearchTrace(big, v).at(-1)?.comparisons).toBeLessThanOrEqual(bound);
    }
  });

  it('shrinks the window every iteration', () => {
    const frames = binarySearchTrace(a, 91).filter((f) => f.kind === 'mid');
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i].hi - frames[i].lo).toBeLessThan(frames[i - 1].hi - frames[i - 1].lo);
    }
  });

  it('handles an empty array', () => {
    expect(binarySearchTrace([], 4).at(-1)?.kind).toBe('not-found');
  });
});

describe('decide', () => {
  it('points toward the target', () => {
    expect(decide(a, 4, 16)).toBe('found');
    expect(decide(a, 4, 50)).toBe('go-right');
    expect(decide(a, 4, 3)).toBe('go-left');
  });
});

describe('linearSearchComparisons', () => {
  it('counts reads up to the hit, or the whole array on a miss', () => {
    expect(linearSearchComparisons(a, 2)).toBe(1);
    expect(linearSearchComparisons(a, 91)).toBe(10);
    expect(linearSearchComparisons(a, 4)).toBe(10);
  });
});

describe('makeSortedArray', () => {
  it('is strictly increasing', () => {
    const s = makeSortedArray(50);
    expect(s.every((v, i) => i === 0 || s[i - 1] < v)).toBe(true);
  });
});
