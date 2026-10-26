import { describe, expect, it } from 'vitest';
import {
  DUMMY,
  MAX_LEN,
  NIL,
  layoutPractice,
  mergePseudocode,
  mergeTrace,
  middlePseudocode,
  middleTrace,
  nthPseudocode,
  nthTrace,
  parseList,
  randomSorted,
  resultValues,
} from './practice-linked-lists.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./practice-linked-lists.js').PracticeFrame} PracticeFrame */
/** @param {PracticeFrame[]} frames */
const last = (frames) => /** @type {PracticeFrame} */ (frames.at(-1));

/**
 * Oracle for the comparison count of a two-pointer merge.
 * @param {number[]} a @param {number[]} b
 */
function mergeComparisons(a, b) {
  let i = 0;
  let j = 0;
  let c = 0;
  while (i < a.length && j < b.length) {
    c++;
    if (a[i] <= b[j]) i++;
    else j++;
  }
  return c;
}

describe('merge two sorted lists', () => {
  it('matches a sort of the concatenation on random lists', () => {
    const rand = seeded(8);
    for (let run = 0; run < 60; run++) {
      const a = randomSorted(1 + Math.floor(rand() * MAX_LEN), rand);
      const b = randomSorted(1 + Math.floor(rand() * MAX_LEN), rand);
      const f = last(mergeTrace(a, b));
      expect(resultValues(f)).toEqual([...a, ...b].sort((x, y) => x - y));
      expect(f.comparisons).toBe(mergeComparisons(a, b));
    }
  });

  it('is stable: ties take the node from A first', () => {
    const frames = mergeTrace([2, 5], [2, 5]);
    const f = last(frames);
    const order = [];
    for (let s = f.dummyNext; s !== NIL; s = f.next[s]) order.push(s);
    expect(order).toEqual([0, 2, 1, 3]);
  });

  it('attaches the rest of the longer list with a single write', () => {
    const f = last(mergeTrace([1, 2, 3], [4, 5, 6]));
    expect(f.comparisons).toBe(3);
    expect(f.writes).toBe(4);
    expect(resultValues(f)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('lays the merged part along the middle row with what is left above and below', () => {
    const frames = mergeTrace([1, 4], [2, 3]);
    expect(layoutPractice(frames[0])).toEqual([
      { id: DUMMY, col: 0, row: 1 },
      { id: 0, col: 1, row: 0 },
      { id: 1, col: 2, row: 0 },
      { id: 2, col: 1, row: 2 },
      { id: 3, col: 2, row: 2 },
    ]);
    const take = /** @type {PracticeFrame} */ (frames.find((f) => f.kind === 'take-a'));
    expect(layoutPractice(take)).toContainEqual({ id: 0, col: 1, row: 1 });
    expect(layoutPractice(last(frames)).every((c) => c.row === 1)).toBe(true);
  });
});

describe('find the middle', () => {
  it('stops on index ⌊n / 2⌋ after ⌊n / 2⌋ rounds', () => {
    for (let n = 1; n <= MAX_LEN; n++) {
      const list = Array.from({ length: n }, (_, i) => i * 10);
      const f = last(middleTrace(list));
      expect(f.slow).toBe(Math.floor(n / 2));
      expect(f.moves).toBe(3 * Math.floor(n / 2));
    }
  });
});

describe('remove the nth node from the end', () => {
  it('matches an array splice for every valid n', () => {
    const rand = seeded(4);
    for (let len = 1; len <= MAX_LEN; len++) {
      const list = Array.from({ length: len }, () => Math.floor(rand() * 100));
      for (let n = 1; n <= len; n++) {
        const f = last(nthTrace(list, n));
        const want = list.slice();
        want.splice(len - n, 1);
        expect(resultValues(f)).toEqual(want);
        expect(f.removed).toBe(len - n);
        expect(f.moves).toBe(n + 2 * (len - n));
      }
    }
  });

  it('removes the head through the dummy node', () => {
    const f = last(nthTrace([5, 8, 13], 3));
    expect(f.dummyNext).toBe(1);
    expect(resultValues(f)).toEqual([8, 13]);
  });

  it('drops the unlinked node below the row before the node it points at', () => {
    const frames = nthTrace([5, 8, 13, 21, 34], 2);
    const unlink = /** @type {PracticeFrame} */ (frames.find((f) => f.kind === 'unlink'));
    expect(unlink.wrote).toBe(2);
    expect(layoutPractice(unlink)).toContainEqual({ id: 3, col: 3.5, row: 1 });
  });

  it('never aliases next arrays between frames', () => {
    const frames = nthTrace([1, 2, 3], 1);
    frames[0].next[0] = 42;
    expect(frames[1].next[0]).toBe(1);
  });
});

describe('input parsing', () => {
  it('requires sorted lists only when asked', () => {
    expect(parseList('1, 3, 3 7', true)).toEqual({ values: [1, 3, 3, 7] });
    expect(parseList('3, 1', true)).toEqual({ error: 'unsorted' });
    expect(parseList('3, 1', false)).toEqual({ values: [3, 1] });
    expect(parseList('', false)).toEqual({ error: 'empty' });
    expect(parseList('1 2 3 4 5 6 7 8 9', false)).toEqual({ error: 'count' });
    expect(parseList('1, 2.5', false)).toEqual({ error: 'format' });
    expect(parseList('1, 120', false)).toEqual({ error: 'range' });
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['merge', () => [...mergeTrace([1, 4], [2, 3]), ...mergeTrace([5], [1])], mergePseudocode],
    ['middle', () => middleTrace([1, 2, 3, 4]), middlePseudocode],
    ['nth', () => nthTrace([1, 2, 3, 4], 2), nthPseudocode],
  ])('%s trace highlights every pseudocode line', (_, run, code) => {
    const seen = new Set(run().flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(code.map((_, i) => i));
  });
});
