import { describe, expect, it } from 'vitest';
import {
  MAX_INTERVALS,
  MAX_VALUES,
  dedupPseudocode,
  dedupTrace,
  formatIntervals,
  isCorrectMerge,
  mergePseudocode,
  mergeTrace,
  mergedBlocks,
  parseIntervals,
  parseValues,
} from './sorting-applications.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {string} text */
const intervals = (text) => {
  const parsed = parseIntervals(text);
  if ('error' in parsed) throw new Error(parsed.error);
  return parsed.intervals;
};

/** @param {import('./sorting-applications.js').MergeFrame[]} frames */
const blocksOf = (frames) =>
  frames
    .at(-1)
    ?.blocks.map((b) => `${b.start}-${b.end}`)
    .join(', ');

/**
 * Union of hours covered, as an independent oracle for the merged blocks.
 * @param {{start: number, end: number}[]} list
 */
function covered(list) {
  const set = new Set();
  for (const x of list) for (let t = x.start; t < x.end; t++) set.add(t);
  return [...set].sort((a, b) => a - b);
}

/** @param {() => number} rand */
function randomIntervals(rand) {
  const n = 2 + Math.floor(rand() * (MAX_INTERVALS - 1));
  return Array.from({ length: n }, (_, id) => {
    const start = Math.floor(rand() * 20);
    return { id, start, end: start + 1 + Math.floor(rand() * 4) };
  });
}

describe('merging intervals', () => {
  const sample = intervals('8-10, 1-3, 15-18, 2-6, 4-5, 12-16');

  it('merges correctly when sorted by start', () => {
    const frames = mergeTrace(sample, 'start');
    expect(blocksOf(frames)).toBe('1-6, 8-10, 12-18');
    expect(frames.at(-1)?.checks).toBe(sample.length - 1);
    expect(isCorrectMerge(sample, frames.at(-1)?.blocks ?? [])).toBe(true);
  });

  it('goes wrong when sorted by end or not sorted at all', () => {
    const byEnd = mergeTrace(sample, 'end');
    expect(blocksOf(byEnd)).toBe('1-3, 4-6, 8-10, 12-18');
    expect(isCorrectMerge(sample, byEnd.at(-1)?.blocks ?? [])).toBe(false);
    const unsorted = mergeTrace(sample, 'none');
    expect(blocksOf(unsorted)).toBe('8-10, 15-18');
    expect(isCorrectMerge(sample, unsorted.at(-1)?.blocks ?? [])).toBe(false);
  });

  it('merges touching intervals and keeps nested ones inside', () => {
    expect(blocksOf(mergeTrace(intervals('1-3, 3-5'), 'start'))).toBe('1-5');
    expect(blocksOf(mergeTrace(intervals('1-10, 2-3, 4-5'), 'start'))).toBe('1-10');
  });

  it('matches the covered hours of the input on 200 seeded inputs', () => {
    const rand = seeded(9);
    for (let t = 0; t < 200; t++) {
      const list = randomIntervals(rand);
      const blocks = mergeTrace(list, 'start').at(-1)?.blocks ?? [];
      expect(covered(blocks)).toEqual(covered(list));
      for (let k = 1; k < blocks.length; k++) {
        expect(blocks[k].start).toBeGreaterThan(blocks[k - 1].end);
      }
      expect(blocks.map((b) => [b.start, b.end])).toEqual(
        mergedBlocks(list).map((b) => [b.start, b.end]),
      );
    }
  });

  it('shows the input order at start and the sorted order after', () => {
    const frames = mergeTrace(sample, 'start');
    expect(frames[0].items.map((x) => x.id)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(frames[1].kind).toBe('sorted');
    expect(frames[1].items.map((x) => x.start)).toEqual([1, 2, 4, 8, 12, 15]);
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('records which intervals each block absorbed', () => {
    const done = mergeTrace(sample, 'start').at(-1);
    expect(done?.blocks[0].ids).toEqual([1, 3, 4]);
  });

  it('does not alias frames', () => {
    const frames = mergeTrace(sample, 'start');
    const before = frames[4].blocks.map((b) => ({ ...b, ids: b.ids.slice() }));
    frames[3].blocks[0].end = 99;
    frames[3].blocks[0].ids.push(9);
    expect(frames[4].blocks).toEqual(before);
  });

  it('parses and formats intervals', () => {
    expect(formatIntervals(intervals('1-3 2–6'))).toBe('1-3, 2-6');
    expect(parseIntervals('1-3, x')).toEqual({ error: 'format' });
    expect(parseIntervals('3-1, 4-5')).toEqual({ error: 'range' });
    expect(parseIntervals('3-3, 4-5')).toEqual({ error: 'range' });
    expect(parseIntervals('3-30, 4-5')).toEqual({ error: 'range' });
    expect(parseIntervals('1-2')).toEqual({ error: 'count' });
    expect(
      parseIntervals(
        Array(MAX_INTERVALS + 1)
          .fill('1-2')
          .join(','),
      ),
    ).toEqual({
      error: 'count',
    });
  });
});

describe('removing duplicates', () => {
  it('keeps each value once after sorting', () => {
    const frames = dedupTrace([7, 3, 9, 3, 7, 1, 9, 9]);
    expect(frames.at(-1)?.out).toEqual([1, 3, 7, 9]);
    expect(frames.at(-1)?.checks).toBe(7);
    expect(frames.filter((f) => f.kind === 'skip')).toHaveLength(4);
  });

  it('matches a Set on 200 seeded inputs with n − 1 checks', () => {
    const rand = seeded(4);
    for (let t = 0; t < 200; t++) {
      const n = 2 + Math.floor(rand() * (MAX_VALUES - 1));
      const values = Array.from({ length: n }, () => Math.floor(rand() * 8));
      const last = dedupTrace(values).at(-1);
      expect(last?.out).toEqual([...new Set(values)].sort((a, b) => a - b));
      expect(last?.checks).toBe(n - 1);
    }
  });

  it('does not alias frames', () => {
    const frames = dedupTrace([2, 1, 2]);
    const before = frames[3].out.slice();
    frames[2].out.push(42);
    expect(frames[3].out).toEqual(before);
  });

  it('parses values', () => {
    expect(parseValues('3 3, 1')).toEqual({ values: [3, 3, 1] });
    expect(parseValues('3, a')).toEqual({ error: 'format' });
    expect(parseValues('3, 100')).toEqual({ error: 'range' });
    expect(parseValues('3')).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['start', 'end', 'none']))(
    'merge sorted by %s highlights every line',
    (by) => {
      const seen = new Set(mergeTrace(intervals('1-3, 2-6, 8-10'), by).flatMap((f) => f.lines));
      expect([...seen].sort((x, y) => x - y)).toEqual(mergePseudocode[by].map((_, i) => i));
    },
  );

  it('dedup highlights every line', () => {
    const seen = new Set(dedupTrace([2, 1, 2]).flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(dedupPseudocode.map((_, i) => i));
  });
});
