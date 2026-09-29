import { describe, expect, it } from 'vitest';
import {
  bubblePseudocode,
  bubbleSortTrace,
  insertionPseudocode,
  insertionSortTrace,
  makeArray,
  toItems,
} from './sorting.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./sorting.js').SortFrame[]} frames */
const finalValues = (frames) => frames.at(-1)?.items.map((it) => it.value);

describe.each([
  ['bubble', bubbleSortTrace],
  ['insertion', insertionSortTrace],
])('%s sort trace', (_, trace) => {
  it('ends sorted with every index marked sorted', () => {
    const values = makeArray('random', 20, seeded(7));
    const frames = trace(toItems(values));
    expect(finalValues(frames)).toEqual(values.slice().sort((a, b) => a - b));
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.at(-1)?.sorted).toHaveLength(20);
  });

  it('keeps item identity so bars can animate', () => {
    const frames = trace(toItems([3, 1, 2]));
    const ids = frames.at(-1)?.items.map((it) => it.id).sort();
    expect(ids).toEqual([0, 1, 2]);
  });

  it('handles empty and single-element input', () => {
    expect(finalValues(trace([]))).toEqual([]);
    expect(finalValues(trace(toItems([5])))).toEqual([5]);
  });

  it('is stable for equal keys', () => {
    const frames = trace(toItems([2, 1, 2, 1]));
    const ids = frames.at(-1)?.items.map((it) => it.id);
    expect(ids).toEqual([1, 3, 0, 2]);
  });

  it('never decreases running counters', () => {
    const frames = trace(toItems(makeArray('reversed', 10)));
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i].comparisons).toBeGreaterThanOrEqual(frames[i - 1].comparisons);
      expect(frames[i].swaps).toBeGreaterThanOrEqual(frames[i - 1].swaps);
    }
  });
});

describe('complexity counters', () => {
  it('bubble sort exits after one pass on sorted input', () => {
    const frames = bubbleSortTrace(toItems([1, 2, 3, 4, 5]));
    expect(frames.at(-1)?.comparisons).toBe(4);
    expect(frames.at(-1)?.swaps).toBe(0);
  });

  it('reversed input costs n(n-1)/2 swaps for both sorts', () => {
    const items = toItems(makeArray('reversed', 8));
    expect(bubbleSortTrace(items).at(-1)?.swaps).toBe(28);
    expect(insertionSortTrace(items).at(-1)?.swaps).toBe(28);
  });

  it('insertion sort does n-1 comparisons on sorted input', () => {
    const frames = insertionSortTrace(toItems([1, 2, 3, 4, 5, 6]));
    expect(frames.at(-1)?.comparisons).toBe(5);
  });
});

describe('makeArray', () => {
  it('produces the requested length for every preset', () => {
    for (const preset of /** @type {const} */ (['random', 'nearly-sorted', 'reversed', 'few-unique'])) {
      expect(makeArray(preset, 12, seeded(3))).toHaveLength(12);
    }
  });

  it('reversed is strictly descending', () => {
    const a = makeArray('reversed', 10);
    expect(a.every((v, i) => i === 0 || a[i - 1] > v)).toBe(true);
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['bubble', bubbleSortTrace, bubblePseudocode],
    ['insertion', insertionSortTrace, insertionPseudocode],
  ])('%s trace highlights every pseudocode line', (_, trace, code) => {
    // Random input reaches the swap paths; sorted input reaches bubble's early exit.
    const frames = [...trace(toItems([5, 1, 4, 2, 3])), ...trace(toItems([1, 2, 3]))];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(code.map((_, i) => i));
  });
});

describe('insertion sort shading', () => {
  it('keeps the shifted element shaded and only the key unshaded', () => {
    const swap = insertionSortTrace(toItems([1, 3, 2])).find((f) => f.kind === 'swap');
    // [1, 2, 3] after shifting 3 right; key 2 sits at index 1.
    expect(swap?.sorted).toEqual([0, 2]);
  });
});

describe('makeArray edge sizes', () => {
  it('returns a real value for a single element in every preset', () => {
    for (const preset of /** @type {const} */ (['random', 'nearly-sorted', 'reversed', 'few-unique'])) {
      const a = makeArray(preset, 1, seeded(2));
      expect(a).toHaveLength(1);
      expect(Number.isFinite(a[0])).toBe(true);
    }
  });
});
