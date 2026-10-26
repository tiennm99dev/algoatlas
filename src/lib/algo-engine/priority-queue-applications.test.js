import { describe, expect, it } from 'vitest';
import {
  MAX_K,
  MAX_LISTS,
  MAX_LIST_LEN,
  MAX_STREAM,
  formatLists,
  makeLists,
  makeStream,
  mergePseudocode,
  mergeTrace,
  parseLists,
  parseStream,
  topKPseudocode,
  topKTrace,
} from './priority-queue-applications.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {{value: number, list: number}[]} heap */
function isMinHeapOfHeads(heap) {
  for (let i = 1; i < heap.length; i++) {
    const p = heap[Math.floor((i - 1) / 2)];
    if (heap[i].value < p.value) return false;
  }
  return true;
}

describe('merge k sorted lists', () => {
  it('matches a sort of all values on random lists', () => {
    const rand = seeded(6);
    for (let t = 0; t < 200; t++) {
      const k = 2 + Math.floor(rand() * (MAX_LISTS - 1));
      const lists = Array.from({ length: k }, () =>
        Array.from({ length: Math.floor(rand() * (MAX_LIST_LEN + 1)) }, () =>
          Math.floor(rand() * 30),
        ).sort((x, y) => x - y),
      );
      const frames = mergeTrace(lists);
      const all = lists.flat().sort((x, y) => x - y);
      expect(frames.at(-1)?.out.map((e) => e.value)).toEqual(all);
      for (const f of frames) {
        expect(f.heap.length).toBeLessThanOrEqual(k);
        expect(isMinHeapOfHeads(f.heap)).toBe(true);
        // At most one entry per list sits in the heap.
        expect(new Set(f.heap.map((e) => e.list)).size).toBe(f.heap.length);
      }
    }
  });

  it('keeps equal values in list order and handles empty lists', () => {
    const out = mergeTrace([[2, 5], [], [2, 3]]).at(-1)?.out;
    expect(out).toEqual([
      { value: 2, list: 0 },
      { value: 2, list: 2 },
      { value: 3, list: 2 },
      { value: 5, list: 0 },
    ]);
    expect(mergeTrace([[], []]).map((f) => f.kind)).toEqual([
      'start',
      'exhausted',
      'exhausted',
      'done',
    ]);
  });

  it('pops every value once and pushes every value once', () => {
    const lists = [
      [1, 4, 9],
      [2, 3, 8],
      [5, 6, 7],
    ];
    const frames = mergeTrace(lists);
    expect(frames.filter((f) => f.kind === 'pop')).toHaveLength(9);
    expect(frames.filter((f) => f.kind === 'seed' || f.kind === 'push')).toHaveLength(9);
    expect(frames.at(-1)?.heapOps).toBe(18);
    // Seeding three heads compares twice; the first pop sifts 5 below 2 with one more.
    expect(frames.find((f) => f.kind === 'pop')?.comparisons).toBe(3);
  });

  it('counts comparisons exactly for two lists', () => {
    // With two entries, a push compares once and a pop of the pair compares once (one child).
    const frames = mergeTrace([[1], [2]]);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'seed',
      'seed',
      'pop',
      'exhausted',
      'pop',
      'exhausted',
      'done',
    ]);
    expect(frames.at(-1)?.comparisons).toBe(1);
  });

  it('does not alias frames', () => {
    const frames = mergeTrace([
      [1, 4],
      [2, 3],
    ]);
    const before = JSON.stringify(frames[3]);
    frames[2].heap[0].value = 99;
    frames[2].out.push({ value: 0, list: 0 });
    frames[2].heads[0] = 9;
    expect(JSON.stringify(frames[3])).toBe(before);
  });

  it('stays under 400 frames at the caps', () => {
    const lists = Array.from({ length: MAX_LISTS }, () =>
      Array.from({ length: MAX_LIST_LEN }, (_, i) => i),
    );
    expect(mergeTrace(lists).length).toBeLessThan(400);
  });
});

describe('top k', () => {
  it('keeps the k largest values on random streams', () => {
    const rand = seeded(12);
    for (let t = 0; t < 200; t++) {
      const k = 1 + Math.floor(rand() * MAX_K);
      const stream = Array.from({ length: Math.floor(rand() * (MAX_STREAM + 1)) }, () =>
        Math.floor(rand() * 40),
      );
      const heap = topKTrace(stream, k).at(-1)?.heap ?? [];
      const want = stream
        .slice()
        .sort((x, y) => y - x)
        .slice(0, k);
      expect(heap.slice().sort((x, y) => y - x)).toEqual(want);
      if (heap.length === k) expect(heap[0]).toBe(want[k - 1]);
    }
  });

  it('pushes, replaces and skips on a known stream', () => {
    const frames = topKTrace([5, 1, 9, 3, 7, 2, 8], 3);
    expect(frames.filter((f) => f.kind !== 'read').map((f) => f.kind)).toEqual([
      'start',
      'push',
      'push',
      'push',
      'replace',
      'replace',
      'skip',
      'replace',
      'done',
    ]);
    const replaces = frames.filter((f) => f.kind === 'replace');
    expect(replaces.map((f) => [f.value, f.evicted])).toEqual([
      [3, 1],
      [7, 3],
      [8, 5],
    ]);
    expect(frames.at(-1)?.heap).toEqual([7, 8, 9]);
    expect(frames.at(-1)?.heapOps).toBe(6);
  });

  it('counts one comparison per skipped value once the heap is full', () => {
    // A rising stream of k = 1: every later value replaces the minimum after one comparison.
    expect(topKTrace([1, 2, 3, 4], 1).at(-1)?.comparisons).toBe(3);
    expect(topKTrace([4, 3, 2, 1], 1).at(-1)?.comparisons).toBe(3);
  });

  it('handles an empty stream', () => {
    expect(topKTrace([], 3).map((f) => f.kind)).toEqual(['start', 'done']);
  });

  it('does not alias frames', () => {
    const frames = topKTrace([5, 1, 9, 3], 2);
    const before = frames[5].heap.slice();
    frames[4].heap.reverse();
    expect(frames[5].heap).toEqual(before);
  });

  it('stays under 400 frames at the caps', () => {
    expect(topKTrace(makeStream(seeded(2)).concat([1, 2, 3, 4]), MAX_K).length).toBeLessThan(400);
  });
});

describe('parsing and presets', () => {
  it('reads lists and refuses bad ones', () => {
    expect(parseLists('1, 4, 9 / 2 3 8; 5')).toEqual({ lists: [[1, 4, 9], [2, 3, 8], [5]] });
    expect(parseLists('1, x / 2')).toEqual({ error: 'format' });
    expect(parseLists('1 / / 2')).toEqual({ error: 'format' });
    expect(parseLists('1, 100 / 2')).toEqual({ error: 'range' });
    expect(parseLists('1, 2, 3')).toEqual({ error: 'count' });
    expect(parseLists('1 / 2 / 3 / 4 / 5 / 6')).toEqual({ error: 'count' });
    expect(parseLists('1 2 3 4 5 6 7 / 2')).toEqual({ error: 'length' });
    expect(parseLists('3, 1 / 2')).toEqual({ error: 'unsorted' });
    expect(formatLists([[1, 4], [2]])).toBe('1, 4 / 2');
  });

  it('reads a stream and refuses bad ones', () => {
    expect(parseStream('5 1, 9')).toEqual({ values: [5, 1, 9] });
    expect(parseStream('')).toEqual({ error: 'format' });
    expect(parseStream('5, 120')).toEqual({ error: 'range' });
    expect(
      parseStream(
        Array(MAX_STREAM + 1)
          .fill('1')
          .join(' '),
      ),
    ).toEqual({ error: 'count' });
  });

  it('makes valid random input', () => {
    const lists = makeLists(seeded(3));
    expect(parseLists(formatLists(lists))).toEqual({ lists });
    expect(makeStream(seeded(3))).toHaveLength(12);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every merge line', () => {
    const frames = mergeTrace([
      [1, 4, 9],
      [2, 3, 8],
      [5, 6, 7],
    ]);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(mergePseudocode.map((_, i) => i));
  });

  it('highlights every top-k line', () => {
    const frames = topKTrace([5, 1, 9, 3, 7, 2, 8], 3);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(topKPseudocode.map((_, i) => i));
  });
});
