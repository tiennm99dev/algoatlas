import { describe, expect, it } from 'vitest';
import {
  MAX_COUNT_KEY,
  MAX_N,
  MAX_RADIX_KEY,
  countingPseudocode,
  countingSortTrace,
  digitAt,
  parseKeys,
  radixPseudocode,
  radixSortTrace,
  randomKeys,
} from './counting-radix-sort.js';
import { toItems } from './sorting.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Stable reference: by value, ties by input slot. @param {number[]} values */
const stableIds = (values) =>
  toItems(values)
    .sort((x, y) => x.value - y.value || x.id - y.id)
    .map((it) => it.id);

/** @param {import('./counting-radix-sort.js').CountingFrame[]} frames */
const countingOut = (frames) => frames.at(-1)?.output.map((it) => it?.id);
/** @param {import('./counting-radix-sort.js').RadixFrame[]} frames */
const radixOut = (frames) => frames.at(-1)?.items.map((it) => it.id);

describe('counting sort', () => {
  it.each([[[0]], [[3, 3, 3]], [[0, 9]], [[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]], [[1, 2, 3]]])(
    'sorts edge input %j stably',
    (values) => {
      const frames = countingSortTrace(toItems(values));
      expect(countingOut(frames)).toEqual(stableIds(values));
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
    },
  );

  it('matches a stable sort on 200 seeded random inputs', () => {
    const rand = seeded(7);
    for (let t = 0; t < 200; t++) {
      const values = randomKeys(1 + Math.floor(rand() * MAX_N), MAX_COUNT_KEY, rand);
      expect(countingOut(countingSortTrace(toItems(values)))).toEqual(stableIds(values));
    }
  });

  it('turns tallies into end positions, as in the textbook example', () => {
    const frames = countingSortTrace(toItems([2, 5, 3, 0, 2, 3, 0, 3]));
    const tallied = frames.filter((f) => f.kind === 'count').at(-1);
    expect(tallied?.count).toEqual([2, 0, 2, 3, 0, 1]);
    const summed = frames.filter((f) => f.kind === 'prefix').at(-1);
    expect(summed?.count).toEqual([2, 2, 4, 7, 7, 8]);
    // The last 3 is placed first, into slot 6.
    expect(frames.find((f) => f.kind === 'place')?.pos).toBe(6);
  });

  it('takes n + k + n steps', () => {
    const last = countingSortTrace(toItems([2, 5, 3, 0, 2, 3, 0, 3])).at(-1);
    expect(last?.steps).toBe(8 + 5 + 8);
  });

  it('does not alias frames', () => {
    const frames = countingSortTrace(toItems([1, 0, 1]));
    const before = frames[2].count.slice();
    frames[1].count[0] = 99;
    expect(frames[2].count).toEqual(before);
    const placed = frames.filter((f) => f.kind === 'place');
    const out = placed[1].output.slice();
    placed[0].output.reverse();
    expect(placed[1].output).toEqual(out);
  });
});

describe('radix sort', () => {
  it.each([[[0, 0]], [[7]], [[999, 0]], [[5, 50, 500]], [[321, 123, 213, 132, 312, 231]]])(
    'sorts edge input %j stably',
    (values) => {
      expect(radixOut(radixSortTrace(toItems(values)))).toEqual(stableIds(values));
    },
  );

  it('matches a stable sort on 200 seeded random inputs', () => {
    const rand = seeded(3);
    for (let t = 0; t < 200; t++) {
      const values = randomKeys(1 + Math.floor(rand() * MAX_N), MAX_RADIX_KEY, rand);
      expect(radixOut(radixSortTrace(toItems(values)))).toEqual(stableIds(values));
    }
  });

  it('runs one pass per digit of the largest key and moves 2n per pass', () => {
    const values = [170, 45, 75, 90, 802, 24, 2, 66];
    const frames = radixSortTrace(toItems(values));
    expect(frames.at(-1)?.passes).toBe(3);
    expect(frames.at(-1)?.moves).toBe(3 * 2 * values.length);
    const firstCollect = frames.find((f) => f.kind === 'collect');
    expect(firstCollect?.items.map((it) => it.value)).toEqual([170, 90, 802, 2, 24, 45, 75, 66]);
    expect(radixSortTrace(toItems([4, 0, 9])).at(-1)?.passes).toBe(1);
  });

  it('drops each item into the bucket of its current digit', () => {
    for (const f of radixSortTrace(toItems([170, 45, 75, 2]))) {
      if (f.kind === 'drop') {
        expect(f.buckets[f.digit].at(-1)?.id).toBe(f.items[f.i].id);
        expect(f.digit).toBe(digitAt(f.items[f.i].value, f.place));
      }
    }
  });

  it('does not alias frames', () => {
    const frames = radixSortTrace(toItems([12, 3, 45]));
    const before = frames[3].buckets.map((b) => b.slice());
    frames[2].buckets[2].push({ id: 9, value: 9 });
    expect(frames[3].buckets).toEqual(before);
  });
});

describe('input', () => {
  it('parses keys against a limit', () => {
    expect(parseKeys('3 1, 2', 9)).toEqual({ values: [3, 1, 2] });
    expect(parseKeys('3, 12', 9)).toEqual({ error: 'range' });
    expect(parseKeys('3, 12', 999)).toEqual({ values: [3, 12] });
    expect(parseKeys('3, -1', 9)).toEqual({ error: 'format' });
    expect(parseKeys('3', 9)).toEqual({ error: 'count' });
  });

  it('reads decimal digits', () => {
    expect([digitAt(802, 1), digitAt(802, 10), digitAt(802, 100), digitAt(7, 100)]).toEqual([
      2, 0, 8, 0,
    ]);
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['counting', () => countingSortTrace(toItems([2, 0, 1, 2])), countingPseudocode],
    ['radix', () => radixSortTrace(toItems([21, 3, 12])), radixPseudocode],
  ])('%s trace highlights every pseudocode line', (_, trace, code) => {
    const seen = new Set(trace().flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(code.map((__, i) => i));
  });
});
