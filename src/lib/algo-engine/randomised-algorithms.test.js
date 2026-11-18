import { describe, expect, it } from 'vitest';
import { lcg } from './seeded-random.js';
import {
  MAX_N,
  MAX_VALUE,
  QUICK_PRESETS,
  expectedComparisons,
  histogram,
  quicksortPseudocode,
  quicksortRun,
  quicksortTrace,
  worstComparisons,
} from './randomised-algorithms.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./randomised-algorithms.js').QuickFrame[]} frames */
const last = (frames) =>
  /** @type {import('./randomised-algorithms.js').QuickFrame} */ (frames.at(-1));

/** @param {import('./randomised-algorithms.js').QuickFrame} f */
const valuesOf = (f) => f.items.map((it) => it.value);

describe('randomised quicksort trace', () => {
  it('always sorts, whatever the coin flips (Las Vegas)', () => {
    const rand = seeded(4);
    for (let round = 0; round < 300; round++) {
      const n = 1 + Math.floor(rand() * MAX_N);
      const values = Array.from({ length: n }, () => Math.floor(rand() * (MAX_VALUE + 1)));
      for (const rule of /** @type {const} */ (['random', 'last'])) {
        const f = last(quicksortTrace(values, rule, seeded(round)));
        expect(valuesOf(f)).toEqual(values.slice().sort((a, b) => a - b));
        expect(f.placed.every(Boolean)).toBe(true);
      }
    }
  });

  it('keeps each item’s identity while sorting', () => {
    const f = last(quicksortTrace([5, 5, 1], 'last', seeded(1)));
    expect(f.items.map((it) => it.id).sort()).toEqual([0, 1, 2]);
  });

  it('counts n(n − 1)/2 comparisons for the last-element pivot on sorted input', () => {
    const sorted = QUICK_PRESETS.sorted;
    expect(last(quicksortTrace(sorted, 'last')).comparisons).toBe(worstComparisons(16));
    expect(last(quicksortTrace(sorted, 'last')).maxDepth).toBe(15);
    expect(last(quicksortTrace([1, 2, 3, 4], 'last')).comparisons).toBe(6);
    expect(last(quicksortTrace([7], 'random')).comparisons).toBe(0);
  });

  it('agrees with the fast counter for the same coin flips', () => {
    const rand = seeded(8);
    for (let round = 0; round < 200; round++) {
      const n = 2 + Math.floor(rand() * (MAX_N - 1));
      const values = Array.from({ length: n }, () => Math.floor(rand() * 20));
      for (const rule of /** @type {const} */ (['random', 'last'])) {
        const run = quicksortRun(values, rule, lcg(round));
        expect(run.sorted).toBe(true);
        expect(run.comparisons).toBe(last(quicksortTrace(values, rule, lcg(round))).comparisons);
      }
    }
  });

  it('averages close to 2(n + 1)Hₙ − 4n on distinct keys, for any input order', () => {
    const rand = lcg(12345);
    for (const values of [QUICK_PRESETS.sorted, QUICK_PRESETS.shuffled, QUICK_PRESETS.reversed]) {
      let total = 0;
      const runs = 20000;
      for (let t = 0; t < runs; t++) total += quicksortRun(values, 'random', rand).comparisons;
      expect(Math.abs(total / runs - expectedComparisons(16))).toBeLessThan(0.5);
    }
    expect(expectedComparisons(1)).toBe(0);
    expect(expectedComparisons(2)).toBeCloseTo(1, 9);
    expect(expectedComparisons(3)).toBeCloseTo(8 / 3, 9);
    expect(expectedComparisons(16)).toBeCloseTo(50.945, 2);
  });

  it('makes exactly the comparisons of each partition', () => {
    // Each call on length L compares L − 1 times, so a fixed pivot sequence is predictable.
    const f = quicksortTrace([3, 1, 2], 'last');
    expect(f.filter((g) => g.kind === 'compare')).toHaveLength(last(f).comparisons);
    expect(last(f).comparisons).toBe(2);
  });
});

describe('histogram', () => {
  it('bins whole-number samples', () => {
    expect(histogram([], 10)).toEqual({ from: 0, width: 1, counts: [] });
    expect(histogram([5, 5, 6, 8], 10)).toEqual({ from: 5, width: 1, counts: [2, 1, 0, 1] });
    const h = histogram([40, 41, 60, 79], 10);
    expect(h.width).toBe(4);
    expect(h.counts.reduce((s, c) => s + c, 0)).toBe(4);
    expect(h.counts.length).toBeLessThanOrEqual(10);
  });
});

describe('frames', () => {
  it('start and end as the contract says, and stay under 400 at the cap', () => {
    for (const values of Object.values(QUICK_PRESETS)) {
      for (const rule of /** @type {const} */ (['random', 'last'])) {
        const f = quicksortTrace(values, rule, seeded(3));
        expect(f[0].kind).toBe('start');
        expect(f.at(-1)?.kind).toBe('done');
        expect(f.length).toBeLessThan(400);
      }
    }
    expect(quicksortTrace(Array(MAX_N).fill(5), 'random', seeded(1)).length).toBeLessThan(400);
  });

  it('do not alias each other', () => {
    const f = quicksortTrace(QUICK_PRESETS.small, 'random', seeded(2));
    const later = JSON.stringify(f[3]);
    f[2].items[0].value = 999;
    f[2].placed[0] = true;
    expect(JSON.stringify(f[3])).toBe(later);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const seen = new Set(
      quicksortTrace(QUICK_PRESETS.small, 'random', seeded(5)).flatMap((f) => f.lines),
    );
    quicksortPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
