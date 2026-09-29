import { describe, expect, it } from 'vitest';
import {
  mergePseudocode,
  mergeSortTrace,
  quickPseudocode,
  quickSortTrace,
} from './merge-quick-sort.js';
import { makeArray, toItems } from './sorting.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./merge-quick-sort.js').PivotRule} PivotRule */

/** @type {[string, (v: number[]) => import('./merge-quick-sort.js').DivideFrame[]][]} */
const SORTS = [
  ['merge', (v) => mergeSortTrace(toItems(v))],
  ['quick last', (v) => quickSortTrace(toItems(v), 'last')],
  ['quick median3', (v) => quickSortTrace(toItems(v), 'median3')],
  ['quick random', (v) => quickSortTrace(toItems(v), 'random', seeded(3))],
];

/** @param {number} n */
const ascending = (n) => Array.from({ length: n }, (_, i) => i + 1);

describe.each(SORTS)('%s trace', (_, trace) => {
  const edge = [[], [7], [2, 1], ascending(9), ascending(9).reverse(), [4, 4, 4, 4, 4]];

  it.each(edge)('sorts edge input %j', (...values) => {
    const frames = trace(values);
    expect(frames.at(-1)?.items.map((it) => it.value)).toEqual(
      values.slice().sort((x, y) => x - y),
    );
  });

  it('matches Array.prototype.sort on 200 seeded random arrays', () => {
    const rand = seeded(11);
    for (let t = 0; t < 200; t++) {
      const n = Math.floor(rand() * 25);
      const values = Array.from({ length: n }, () => Math.floor(rand() * 20));
      const frames = trace(values);
      expect(frames.at(-1)?.items.map((it) => it.value)).toEqual(
        values.slice().sort((x, y) => x - y),
      );
    }
  });

  it('keeps every frame a permutation of the input ids', () => {
    for (const values of [
      makeArray('random', 16, seeded(2)),
      makeArray('few-unique', 18, seeded(5)),
    ]) {
      const ids = values.map((_, i) => i);
      for (const f of trace(values)) {
        expect(f.items.map((it) => it.id).sort((x, y) => x - y)).toEqual(ids);
      }
    }
  });

  it('starts and ends with an empty stack and never recurses deeper than n', () => {
    const values = makeArray('random', 14, seeded(8));
    const frames = trace(values);
    expect(frames[0].stack).toEqual([]);
    expect(frames.at(-1)?.stack).toEqual([]);
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.every((f) => f.depth <= values.length)).toBe(true);
    expect(frames.at(-1)?.sorted).toHaveLength(14);
  });

  it('does not alias frames', () => {
    const frames = trace([5, 3, 8, 1, 9, 2]);
    const before = frames[2].items.slice();
    frames[1].items.reverse();
    expect(frames[2].items).toEqual(before);
  });

  it('keeps every lines index inside the pseudocode', () => {
    const code = trace === SORTS[0][1] ? mergePseudocode : quickPseudocode;
    const frames = trace([5, 1, 4, 2, 3, 9, 7]);
    expect(frames.flatMap((f) => f.lines).every((l) => l >= 0 && l < code.length)).toBe(true);
  });
});

describe('merge sort', () => {
  it('is stable: equal values keep ascending ids', () => {
    const frames = mergeSortTrace(toItems(makeArray('few-unique', 20, seeded(4))));
    const items = frames.at(-1)?.items ?? [];
    for (let i = 1; i < items.length; i++) {
      if (items[i - 1].value === items[i].value) {
        expect(items[i - 1].id).toBeLessThan(items[i].id);
      }
    }
  });

  it('writes n * log2(n) times for powers of two', () => {
    expect(mergeSortTrace(toItems(makeArray('random', 8, seeded(1)))).at(-1)?.swaps).toBe(24);
    expect(mergeSortTrace(toItems(makeArray('random', 16, seeded(1)))).at(-1)?.swaps).toBe(64);
  });

  it('never exceeds n * ceil(log2 n) comparisons', () => {
    for (let n = 2; n <= 24; n++) {
      const last = mergeSortTrace(toItems(makeArray('random', n, seeded(n)))).at(-1);
      expect(last?.comparisons).toBeLessThanOrEqual(n * Math.ceil(Math.log2(n)));
    }
  });

  it('shows the buffer only between copy and merged', () => {
    const frames = mergeSortTrace(toItems([4, 2, 3, 1]));
    for (const f of frames) {
      expect(f.aux !== null).toBe(f.kind === 'copy' || f.kind === 'take');
    }
    expect(frames.find((f) => f.kind === 'take')?.aux).toHaveLength(2);
  });

  it('records finished runs and pops the stack on merged', () => {
    const frames = mergeSortTrace(toItems([4, 2, 3, 1]));
    const firstMerged = frames.find((f) => f.kind === 'merged');
    expect(firstMerged?.runs).toEqual([[0, 1]]);
    expect(firstMerged?.stack).toEqual([[0, 3]]);
    const lastMerged = frames.filter((f) => f.kind === 'merged').at(-1);
    expect(lastMerged?.runs).toEqual([[0, 3]]);
  });
});

describe('quicksort', () => {
  it('is quadratic on sorted input with the last element as pivot', () => {
    const frames = quickSortTrace(toItems(ascending(12)), 'last');
    expect(frames.at(-1)?.comparisons).toBe(66);
    expect(frames.at(-1)?.maxDepth).toBe(11);
    const median = quickSortTrace(toItems(ascending(12)), 'median3');
    expect(median.at(-1)?.comparisons).toBeLessThan(66);
  });

  it('marks every index sorted at done', () => {
    const last = quickSortTrace(
      toItems(makeArray('random', 15, seeded(6))),
      'random',
      seeded(9),
    ).at(-1);
    expect([...(last?.sorted ?? [])].sort((x, y) => x - y)).toEqual(
      ascending(15).map((v) => v - 1),
    );
  });

  it('only emits swap frames for real swaps', () => {
    const swaps = quickSortTrace(toItems(makeArray('random', 20, seeded(3))), 'last').filter(
      (f) => f.kind === 'swap',
    );
    expect(swaps.length).toBeGreaterThan(0);
    expect(swaps.every((f) => f.i !== f.j)).toBe(true);
  });

  it('is deterministic for a seeded random pivot', () => {
    const values = makeArray('random', 16, seeded(12));
    const run = () => quickSortTrace(toItems(values), 'random', seeded(21));
    expect(run()).toEqual(run());
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['merge', mergeSortTrace, mergePseudocode],
    ['quick', quickSortTrace, quickPseudocode],
  ])('%s trace highlights every pseudocode line', (_, trace, code) => {
    // The first input reaches every merge branch; the second adds a sorted range.
    const frames = [...trace(toItems([5, 1, 4, 2, 3])), ...trace(toItems([1, 2, 3]))];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(code.map((_, i) => i));
  });
});
