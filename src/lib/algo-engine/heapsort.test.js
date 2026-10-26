import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  heapsortPseudocode,
  heapsortTrace,
  isMaxHeap,
  parseHeapValues,
} from './heapsort.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number[]} values */
const sortedCopy = (values) => values.slice().sort((x, y) => x - y);

/** @param {number[]} values */
const lastBuild = (values) =>
  /** @type {import('./heapsort.js').HeapFrame} */ (
    heapsortTrace(values)
      .filter((f) => f.phase === 'build')
      .at(-1)
  );

describe('heapsort trace', () => {
  it.each([[[]], [[7]], [[2, 1]], [[1, 2, 3, 4, 5]], [[5, 4, 3, 2, 1]], [[4, 4, 4, 4]]])(
    'sorts edge input %j',
    (values) => {
      const frames = heapsortTrace(values);
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
      expect(frames.at(-1)?.values).toEqual(sortedCopy(values));
      expect(frames.at(-1)?.size).toBe(0);
    },
  );

  it('matches Array.prototype.sort on 200 seeded random arrays', () => {
    const rand = seeded(11);
    for (let t = 0; t < 200; t++) {
      const n = Math.floor(rand() * (MAX_N + 1));
      const values = Array.from({ length: n }, () => Math.floor(rand() * 100));
      expect(heapsortTrace(values).at(-1)?.values).toEqual(sortedCopy(values));
    }
  });

  it('builds the textbook max-heap', () => {
    expect(lastBuild([4, 1, 3, 2, 16, 9, 10, 14, 8, 7]).values).toEqual([
      16, 14, 10, 8, 7, 9, 3, 2, 4, 1,
    ]);
    expect(lastBuild([4, 10, 3, 5, 1]).values).toEqual([10, 5, 3, 4, 1]);
  });

  it('keeps the heap property on every extract and a sorted tail behind it', () => {
    const rand = seeded(3);
    const values = Array.from({ length: MAX_N }, () => Math.floor(rand() * 100));
    for (const f of heapsortTrace(values)) {
      if (f.kind === 'extract' || f.kind === 'done') {
        const tail = f.values.slice(f.size + 1);
        expect(tail).toEqual(sortedCopy(tail));
        if (f.size < f.values.length) {
          expect(f.values.slice(0, f.size).every((v) => v <= f.values[f.size])).toBe(true);
        }
      }
    }
    const firstExtract = heapsortTrace(values).find((f) => f.kind === 'extract');
    // The swap that starts the sort phase is applied, so the heap is built before it.
    expect(isMaxHeap(lastBuild(values).values)).toBe(true);
    expect(firstExtract?.values[values.length - 1]).toBe(Math.max(...values));
  });

  it('does no swaps while building an already valid heap', () => {
    const last = lastBuild([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(last.swaps).toBe(0);
    // Seven internal nodes; the six with two children cost 2 comparisons, slot 6's children too.
    expect(last.comparisons).toBe(14);
  });

  it('stays within 2n·log₂ n comparisons', () => {
    for (let n = 2; n <= MAX_N; n++) {
      const rand = seeded(n);
      const values = Array.from({ length: n }, () => Math.floor(rand() * 100));
      expect(heapsortTrace(values).at(-1)?.comparisons).toBeLessThanOrEqual(2 * n * Math.log2(n));
    }
  });

  it('stays under 400 frames at the size cap', () => {
    const ascending = Array.from({ length: MAX_N }, (_, i) => i + 1);
    expect(heapsortTrace(ascending).length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = heapsortTrace([5, 3, 8, 1, 9, 2]);
    const before = frames[2].values.slice();
    frames[1].values.reverse();
    expect(frames[2].values).toEqual(before);
  });
});

describe('parseHeapValues', () => {
  it('reads values and refuses bad input', () => {
    expect(parseHeapValues('4 10, 3')).toEqual({ values: [4, 10, 3] });
    expect(parseHeapValues('4, ten')).toEqual({ error: 'format' });
    expect(parseHeapValues('4, 100')).toEqual({ error: 'range' });
    expect(parseHeapValues('4')).toEqual({ error: 'count' });
    expect(
      parseHeapValues(
        Array(MAX_N + 1)
          .fill('1')
          .join(' '),
      ),
    ).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [...heapsortTrace([4, 10, 3, 5, 1]), ...heapsortTrace([1, 2, 3, 4, 5, 6, 7])];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(heapsortPseudocode.map((_, i) => i));
  });
});
