import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  groupsOf,
  momSelect,
  parseSelectValues,
  selectPseudocode,
  selectTrace,
} from './quickselect.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} n @param {() => number} rand @param {number} [max] */
const randomArray = (n, rand, max = 99) =>
  Array.from({ length: n }, () => Math.floor(rand() * (max + 1)));

/** @param {number} n @param {() => number} rand */
function distinctArray(n, rand) {
  const pool = Array.from({ length: 100 }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** @param {number[]} a @param {number} k */
const oracle = (a, k) => a.slice().sort((x, y) => x - y)[k - 1];

const RULES = /** @type {const} */ (['last', 'random', 'mom']);

describe.each(RULES)('quickselect with the %s pivot', (rule) => {
  it('finds every rank on random arrays, duplicates included', () => {
    const rand = seeded(5);
    for (let t = 0; t < 40; t++) {
      const n = 2 + (t % (MAX_N - 1));
      const input = randomArray(n, rand, t % 3 === 0 ? 5 : 99);
      for (let k = 1; k <= n; k++) {
        const done = selectTrace(input, k, rule, seeded(t + k)).at(-1);
        expect(done?.kind).toBe('done');
        expect(done?.values[done.answer]).toBe(oracle(input, k));
        expect(done?.answer).toBe(k - 1);
      }
    }
  });

  it('leaves the values a permutation of the input', () => {
    const input = [9, 3, 7, 3, 1, 8, 2];
    const done = selectTrace(input, 4, rule, seeded(2)).at(-1);
    expect(done?.values.slice().sort()).toEqual(input.slice().sort());
  });

  it('keeps every value left of the answer ≤ it and every value right ≥ it', () => {
    const input = distinctArray(17, seeded(9));
    const done = /** @type {import('./quickselect.js').SelectFrame} */ (
      selectTrace(input, 6, rule, seeded(1)).at(-1)
    );
    const x = done.values[done.answer];
    expect(done.values.slice(0, done.answer).every((v) => v <= x)).toBe(true);
    expect(done.values.slice(done.answer + 1).every((v) => v >= x)).toBe(true);
  });

  it('stays under 400 frames on sorted and reversed input at the cap', () => {
    const sorted = Array.from({ length: MAX_N }, (_, i) => i * 3);
    for (const input of [sorted, sorted.slice().reverse()]) {
      for (const k of [1, MAX_N / 2, MAX_N]) {
        expect(selectTrace(input, k, rule, seeded(3)).length).toBeLessThan(400);
      }
    }
  });

  it('highlights every pseudocode line', () => {
    const inputs = [
      [5, 1, 9, 3, 7, 2, 8, 6, 4, 0, 11, 13],
      [3, 1, 2],
      [1, 2, 3, 4],
    ];
    const frames = inputs.flatMap((input) =>
      [1, 2, input.length].flatMap((k) => selectTrace(input, k, rule, seeded(k))),
    );
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(selectPseudocode(rule).map((_, i) => i));
  });
});

describe('quickselect costs', () => {
  it('is quadratic for the minimum of sorted input with the last pivot', () => {
    const input = Array.from({ length: 10 }, (_, i) => i + 1);
    const done = selectTrace(input, 1, 'last').at(-1);
    expect(done?.comparisons).toBe(45);
    expect(done?.sizes).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2]);
    expect(done?.swaps).toBe(0);
  });

  it('finds the answer in one round when the first pivot lands on slot k − 1', () => {
    const done = selectTrace([4, 1, 5, 2, 3], 3, 'last').at(-1);
    expect(done?.sizes).toEqual([5]);
    expect(done?.comparisons).toBe(4);
  });

  it('counts median-of-medians pivot work in the comparisons', () => {
    const frames = selectTrace(distinctArray(20, seeded(4)), 10, 'mom');
    const done = frames.at(-1);
    expect(done?.pivotComparisons).toBeGreaterThan(0);
    const scans = frames.filter((f) => f.kind === 'scan').length;
    expect(done?.comparisons).toBe(scans + (done?.pivotComparisons ?? 0));
  });

  it('discards a guaranteed share with a median-of-medians pivot', () => {
    const rand = seeded(8);
    for (let t = 0; t < 30; t++) {
      const n = 5 * (2 + (t % 3));
      const input = distinctArray(n, rand);
      const medians = selectTrace(input, 1, 'mom').find((f) => f.kind === 'medians');
      if (!medians) throw new Error('no medians frame');
      const x = medians.values[medians.pivot];
      const m = medians.groups.length;
      const half = Math.ceil(m / 2);
      expect(medians.values.filter((v) => v <= x).length).toBeGreaterThanOrEqual(3 * half);
      expect(medians.values.filter((v) => v >= x).length).toBeGreaterThanOrEqual(
        3 * (m - half + 1),
      );
    }
  });

  it('records the discarded slots and the next live range', () => {
    const frames = selectTrace([6, 2, 8, 1, 9, 3, 5], 2, 'last');
    const discard = frames.find((f) => f.kind === 'discard');
    // Pivot 5 lands at slot 3; rank 2 is to its left, so slots 3..6 go.
    expect(discard?.cut).toEqual([3, 6]);
    expect([discard?.lo, discard?.hi]).toEqual([0, 2]);
  });
});

describe('median of medians helpers', () => {
  it('selects every rank like sorting does', () => {
    const rand = seeded(12);
    for (let t = 0; t < 30; t++) {
      const input = randomArray(1 + Math.floor(rand() * 120), rand, t % 2 ? 20 : 999);
      for (const k of [1, Math.ceil(input.length / 2), input.length]) {
        expect(momSelect(input, k).value).toBe(oracle(input, k));
      }
    }
  });

  it('cuts a range into groups of 5 with their lower medians', () => {
    const a = [9, 1, 7, 3, 5, 8, 2, 6];
    const { groups } = groupsOf(a, 0, 7);
    expect(groups.map((g) => [g.from, g.to, a[g.median]])).toEqual([
      [0, 5, 5],
      [5, 8, 6],
    ]);
  });
});

describe('quickselect frames', () => {
  it('starts at start and ends at done', () => {
    const frames = selectTrace([3, 1, 2], 2);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('keeps frames independent of each other and of the input', () => {
    const input = [5, 4, 3, 2, 1, 0, 9, 8];
    const frames = selectTrace(input, 3, 'mom');
    input[0] = 77;
    expect(frames[0].values[0]).toBe(5);
    const g = frames.findIndex((f) => f.kind === 'groups');
    frames[g].values[0] = -1;
    frames[g].groups[0].median = -1;
    frames[g].sizes[0] = -1;
    expect(frames[g + 1].values[0]).toBe(5);
    expect(frames[g + 1].groups[0].median).not.toBe(-1);
    expect(frames[g + 1].sizes[0]).toBe(8);
  });
});

describe('parsing values', () => {
  it('reads commas and spaces and refuses bad input', () => {
    expect(parseSelectValues('3, 1 2')).toEqual({ values: [3, 1, 2] });
    expect(parseSelectValues('a')).toEqual({ error: 'format' });
    expect(parseSelectValues('1 100')).toEqual({ error: 'range' });
    expect(parseSelectValues('1')).toEqual({ error: 'count' });
    expect(parseSelectValues(Array(21).fill('2').join(','))).toEqual({ error: 'count' });
  });
});
