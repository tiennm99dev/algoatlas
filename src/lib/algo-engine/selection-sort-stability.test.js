import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  equalKeyOrder,
  parseKeys,
  randomKeys,
  selectionPseudocode,
  selectionSortTrace,
  toCards,
} from './selection-sort-stability.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./selection-sort-stability.js').SelectionFrame[]} frames */
const finalKeys = (frames) => frames.at(-1)?.items.map((c) => c.key);

/**
 * Stable reference order: by key, ties by input position.
 * @param {number[]} keys
 */
const stableIds = (keys) =>
  toCards(keys)
    .slice()
    .sort((x, y) => x.key - y.key || x.id - y.id)
    .map((c) => c.id);

describe.each(/** @type {const} */ (['swap', 'shift']))('%s selection sort', (variant) => {
  const run = (/** @type {number[]} */ keys) => selectionSortTrace(toCards(keys), variant);

  it.each([[[]], [[7]], [[2, 1]], [[1, 2, 3, 4]], [[4, 3, 2, 1]], [[5, 5, 5, 5]]])(
    'sorts edge input %j',
    (keys) => {
      const frames = run(keys);
      expect(finalKeys(frames)).toEqual(keys.slice().sort((x, y) => x - y));
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
    },
  );

  it('matches Array.prototype.sort on 200 seeded random inputs', () => {
    const rand = seeded(11);
    for (let t = 0; t < 200; t++) {
      const keys = randomKeys(1 + Math.floor(rand() * MAX_N), rand);
      expect(finalKeys(run(keys))).toEqual(keys.slice().sort((x, y) => x - y));
    }
  });

  it('always does n(n − 1)/2 comparisons, whatever the input', () => {
    for (const keys of [
      [1, 2, 3, 4, 5, 6],
      [6, 5, 4, 3, 2, 1],
      [3, 3, 3, 3, 3, 3],
    ]) {
      expect(run(keys).at(-1)?.comparisons).toBe(15);
    }
  });

  it('writes nothing on sorted input', () => {
    expect(run([1, 2, 3, 4, 5]).at(-1)?.writes).toBe(0);
  });

  it('grows the sorted prefix by one slot per pass', () => {
    const frames = run([3, 4, 3, 1, 4, 2]);
    const ends = frames.filter((f) => f.kind === 'keep' || f.kind === variant);
    expect(ends.map((f) => f.sortedCount)).toEqual([1, 2, 3, 4, 5]);
    expect(frames.at(-1)?.sortedCount).toBe(6);
  });

  it('does not alias frames', () => {
    const frames = run([3, 1, 2]);
    const before = frames[2].items.map((c) => ({ ...c }));
    frames[1].items.reverse();
    frames[1].items[0].key = 99;
    expect(frames[2].items).toEqual(before);
  });
});

describe('stability', () => {
  it('the swap variant reorders equal keys when a swap jumps over one', () => {
    const last = selectionSortTrace(toCards([2, 2, 1]), 'swap').at(-1);
    expect(last?.items.map((c) => c.id)).toEqual([2, 1, 0]);
    expect(equalKeyOrder(last?.items ?? [])).toEqual([{ key: 2, tags: [1, 0], kept: false }]);
  });

  it('the shift variant matches a stable sort on 200 seeded inputs', () => {
    const rand = seeded(5);
    for (let t = 0; t < 200; t++) {
      const keys = randomKeys(2 + Math.floor(rand() * (MAX_N - 1)), rand);
      const last = selectionSortTrace(toCards(keys), 'shift').at(-1);
      expect(last?.items.map((c) => c.id)).toEqual(stableIds(keys));
      expect(equalKeyOrder(last?.items ?? []).every((g) => g.kept)).toBe(true);
    }
  });

  it('counts writes: two per swap, the shifted run plus one per rotation', () => {
    expect(selectionSortTrace(toCards([3, 4, 3, 1, 4, 2]), 'swap').at(-1)?.writes).toBe(4);
    expect(selectionSortTrace(toCards([3, 4, 3, 1, 4, 2]), 'shift').at(-1)?.writes).toBe(11);
    // Reversed input: the shift variant moves every card past every smaller one.
    expect(selectionSortTrace(toCards([4, 3, 2, 1]), 'shift').at(-1)?.writes).toBe(4 + 3 + 2);
  });
});

describe('cards and input', () => {
  it('tags equal keys in input order', () => {
    expect(toCards([5, 2, 5, 5]).map((c) => c.tag)).toEqual([0, 0, 1, 2]);
  });

  it('reports only repeated keys', () => {
    expect(equalKeyOrder(toCards([1, 2, 3]))).toEqual([]);
  });

  it('parses keys and refuses bad input', () => {
    expect(parseKeys('3, 4 3,1')).toEqual({ keys: [3, 4, 3, 1] });
    expect(parseKeys('3, x')).toEqual({ error: 'format' });
    expect(parseKeys('-1, 2')).toEqual({ error: 'format' });
    expect(parseKeys('100, 2')).toEqual({ error: 'range' });
    expect(parseKeys('5')).toEqual({ error: 'count' });
    expect(
      parseKeys(
        Array(MAX_N + 1)
          .fill('1')
          .join(','),
      ),
    ).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['swap', 'shift']))(
    '%s trace highlights every pseudocode line',
    (variant) => {
      const frames = selectionSortTrace(toCards([3, 1, 2, 4]), variant);
      const seen = new Set(frames.flatMap((f) => f.lines));
      expect([...seen].sort((x, y) => x - y)).toEqual(
        selectionPseudocode[variant].map((_, i) => i),
      );
    },
  );
});
