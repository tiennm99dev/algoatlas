import { describe, expect, it } from 'vitest';
import {
  MAX_OPS,
  MAX_SIZE,
  binaryHeapTrace,
  heapPseudocode,
  isHeap,
  makeHeapOps,
  parentOf,
  sizeAfter,
} from './binary-heaps.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./binary-heaps.js').HeapOp} HeapOp */
/** @typedef {import('./binary-heaps.js').HeapKind} HeapKind */

/**
 * An independent oracle: a sorted list serves the same removals as a heap.
 * @param {HeapOp[]} ops @param {HeapKind} heap
 */
function oracle(ops, heap) {
  /** @type {number[]} */
  const items = [];
  /** @type {number[]} */
  const out = [];
  for (const op of ops) {
    if (op.type === 'insert') items.push(op.value);
    else if (items.length) {
      items.sort((x, y) => (heap === 'min' ? x - y : y - x));
      out.push(/** @type {number} */ (items.shift()));
    }
  }
  return { out, rest: items.sort((x, y) => x - y) };
}

/** @param {() => number} rand @returns {HeapOp[]} */
function randomOps(rand) {
  /** @type {HeapOp[]} */
  const ops = [];
  let n = 0;
  while (ops.length < MAX_OPS) {
    if (n < MAX_SIZE && (n === 0 || rand() < 0.6)) {
      ops.push({ type: 'insert', value: Math.floor(rand() * 100) });
      n++;
    } else {
      ops.push({ type: 'extract' });
      n--;
    }
  }
  return ops;
}

describe('binary heap trace', () => {
  it.each(/** @type {HeapKind[]} */ (['min', 'max']))(
    'serves the same values as a sorted list (%s-heap)',
    (heap) => {
      const rand = seeded(heap === 'min' ? 5 : 9);
      for (let t = 0; t < 150; t++) {
        const ops = randomOps(rand);
        const frames = binaryHeapTrace(ops, heap);
        const want = oracle(ops, heap);
        const last = /** @type {import('./binary-heaps.js').BinaryHeapFrame} */ (frames.at(-1));
        expect(last.out).toEqual(want.out);
        expect(last.values.slice().sort((x, y) => x - y)).toEqual(want.rest);
        expect(last.values).toHaveLength(sizeAfter(ops));
      }
    },
  );

  it('keeps heap order after every operation', () => {
    const rand = seeded(2);
    for (const heap of /** @type {HeapKind[]} */ (['min', 'max'])) {
      const frames = binaryHeapTrace(randomOps(rand), heap);
      frames.forEach((f, i) => {
        const next = frames[i + 1];
        if (next && next.opIndex !== f.opIndex) expect(isHeap(f.values, heap)).toBe(true);
      });
    }
  });

  it('handles edge cases: no ops, one value, extract from empty, duplicates', () => {
    expect(binaryHeapTrace([]).map((f) => f.kind)).toEqual(['start', 'done']);
    const one = binaryHeapTrace([{ type: 'insert', value: 7 }, { type: 'extract' }]);
    expect(one.map((f) => f.kind)).toEqual([
      'start',
      'insert',
      'up-root',
      'extract',
      'returned',
      'done',
    ]);
    expect(one.at(-1)?.out).toEqual([7]);
    const empty = binaryHeapTrace([{ type: 'extract' }]);
    expect(empty[1].kind).toBe('empty');
    expect(empty.at(-1)?.out).toEqual([]);
    const dup = binaryHeapTrace([
      { type: 'insert', value: 4 },
      { type: 'insert', value: 4 },
    ]);
    // An equal value does not move up: heap order allows ties.
    expect(dup.at(-1)?.swaps).toBe(0);
    expect(dup.find((f) => f.kind === 'up-compare')?.stop).toBe(true);
  });

  it('sifts a new minimum all the way to the root', () => {
    const ops = makeHeapOps('build');
    const frames = binaryHeapTrace(ops.slice(0, 9), 'min');
    // 5 enters at slot 7 and climbs past 17 and 8 (slots 3, 1, 0).
    expect(frames.at(-1)?.values).toEqual([5, 8, 30, 17, 25, 91, 63, 42, 50]);
    const climb = frames.filter((f) => f.opIndex === 7 && f.kind === 'up-swap');
    expect(climb.map((f) => f.node)).toEqual([3, 1, 0]);
  });

  it('counts comparisons and swaps exactly', () => {
    // Ascending inserts never move in a min-heap: one comparison each after the first.
    const sorted = binaryHeapTrace(makeHeapOps('sorted'), 'min').at(-1);
    expect(sorted?.comparisons).toBe(9);
    expect(sorted?.swaps).toBe(0);
    // In a max-heap every ascending insert climbs to the root: ⌊log₂(i + 1)⌋ swaps for slot i.
    const climbing = binaryHeapTrace(makeHeapOps('sorted'), 'max').at(-1);
    const expected = Array.from({ length: 10 }, (_, i) => Math.floor(Math.log2(i + 1))).reduce(
      (s, x) => s + x,
      0,
    );
    expect(climbing?.swaps).toBe(expected);
  });

  it('drains in sorted order', () => {
    const last = binaryHeapTrace(makeHeapOps('drain'), 'min').at(-1);
    expect(last?.out).toEqual([3, 7, 12, 31, 45, 56, 88]);
    const lastMax = binaryHeapTrace(makeHeapOps('drain'), 'max').at(-1);
    expect(lastMax?.out).toEqual([88, 56, 45, 31, 12, 7, 3]);
  });

  it('builds random presets within the limits', () => {
    const ops = makeHeapOps('random', seeded(4));
    expect(ops.length).toBeLessThanOrEqual(MAX_OPS);
    expect(sizeAfter(ops)).toBeLessThanOrEqual(MAX_SIZE);
  });

  it('stays under 400 frames at the caps', () => {
    /** @type {HeapOp[]} */
    const ops = [];
    for (let i = 0; i < MAX_SIZE; i++) ops.push({ type: 'insert', value: 99 - i });
    while (ops.length < MAX_OPS) ops.push({ type: 'extract' });
    expect(binaryHeapTrace(ops, 'min').length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = binaryHeapTrace(makeHeapOps('build'));
    const before = frames[6].values.slice();
    frames[5].values.reverse();
    frames[5].out.push(1);
    expect(frames[6].values).toEqual(before);
  });

  it('finds the parent slot', () => {
    expect([1, 2, 3, 4, 9, 10].map(parentOf)).toEqual([0, 0, 1, 1, 4, 4]);
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {HeapKind[]} */ (['min', 'max']))('highlights every line (%s)', (heap) => {
    const frames = [
      ...binaryHeapTrace(makeHeapOps('drain'), heap),
      ...binaryHeapTrace(makeHeapOps('build'), heap),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(heapPseudocode(heap).map((_, i) => i));
  });
});
