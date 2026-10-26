import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  buildHeapTrace,
  buildPseudocode,
  depthOf,
  isMinHeap,
  levelCaps,
  makeBuildValues,
  parseBuildValues,
} from './build-heap.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./build-heap.js').BuildMethod} BuildMethod */
/** @typedef {import('./build-heap.js').BuildHeapFrame} BuildHeapFrame */
const METHODS = /** @type {BuildMethod[]} */ (['bottom-up', 'one-by-one']);

/** @param {number[]} values @param {BuildMethod} method */
const last = (values, method) =>
  /** @type {BuildHeapFrame} */ (buildHeapTrace(values, method).at(-1));
/** @param {number[]} values */
const sorted = (values) => values.slice().sort((x, y) => x - y);

describe('build heap trace', () => {
  it.each(METHODS)('builds a valid min-heap of the same values (%s)', (method) => {
    const rand = seeded(method === 'bottom-up' ? 3 : 8);
    for (let t = 0; t < 200; t++) {
      const n = Math.floor(rand() * (MAX_N + 1));
      const values = Array.from({ length: n }, () => Math.floor(rand() * 20));
      const f = last(values, method);
      expect(isMinHeap(f.values)).toBe(true);
      expect(sorted(f.values)).toEqual(sorted(values));
      expect(f.levelMoves.reduce((s, x) => s + x, 0)).toBe(f.swaps);
    }
  });

  it.each(METHODS)('handles empty, single and equal input (%s)', (method) => {
    expect(buildHeapTrace([], method).map((f) => f.kind)).toEqual(['start', 'done']);
    expect(buildHeapTrace([4], method).map((f) => f.kind)).toEqual(['start', 'done']);
    expect(last([4, 4, 4, 4, 4], method).swaps).toBe(0);
  });

  it('builds the textbook heap bottom-up', () => {
    expect(last([9, 4, 7, 1, 8, 2, 6], 'bottom-up').values).toEqual([1, 4, 2, 9, 8, 7, 6]);
    expect(last([9, 4, 7, 1, 8, 2, 6], 'one-by-one').values).toEqual([1, 4, 2, 9, 8, 7, 6]);
    expect(last([5, 3, 8, 1], 'bottom-up').values).toEqual([1, 3, 8, 5]);
  });

  it('moves nothing on an already sorted array', () => {
    const asc = makeBuildValues('ascending', 15);
    for (const method of METHODS) expect(last(asc, method).swaps).toBe(0);
    // Bottom-up still compares: two per node with two children, one for slot 6’s pair too.
    expect(last(asc, 'bottom-up').comparisons).toBe(14);
    expect(last(asc, 'one-by-one').comparisons).toBe(14);
  });

  it('meets the per-level caps exactly on descending input', () => {
    for (const n of [7, 15, 31]) {
      const desc = makeBuildValues('descending', n);
      for (const method of METHODS) {
        const f = last(desc, method);
        const caps = levelCaps(n, method);
        const bound = caps.reduce((s, c) => s + c.nodes * c.cap, 0);
        expect(f.swaps).toBe(bound);
        caps.forEach((c) => expect(f.levelMoves[c.depth]).toBe(c.nodes * c.cap));
      }
    }
    // n = 31: bottom-up 26 swaps (n − log₂(n + 1)), one by one 98.
    expect(last(makeBuildValues('descending', 31), 'bottom-up').swaps).toBe(26);
    expect(last(makeBuildValues('descending', 31), 'one-by-one').swaps).toBe(98);
  });

  it('never exceeds the per-level caps and stays below 2n swaps bottom-up', () => {
    const rand = seeded(21);
    for (let t = 0; t < 200; t++) {
      const n = 2 + Math.floor(rand() * (MAX_N - 1));
      const values = Array.from({ length: n }, () => Math.floor(rand() * 100));
      for (const method of METHODS) {
        const f = last(values, method);
        levelCaps(n, method).forEach((c) =>
          expect(f.levelMoves[c.depth]).toBeLessThanOrEqual(c.nodes * c.cap),
        );
      }
      expect(last(values, 'bottom-up').swaps).toBeLessThan(2 * n);
    }
  });

  it('counts level sizes', () => {
    expect(levelCaps(10, 'bottom-up')).toEqual([
      { depth: 0, nodes: 1, cap: 3 },
      { depth: 1, nodes: 2, cap: 2 },
      { depth: 2, nodes: 4, cap: 1 },
      { depth: 3, nodes: 3, cap: 0 },
    ]);
    expect([0, 1, 2, 3, 6, 7, 14, 15].map(depthOf)).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
  });

  it('starts bottom-up at the last internal node', () => {
    const frames = buildHeapTrace(makeBuildValues('random', 10, seeded(1)), 'bottom-up');
    expect(frames.find((f) => f.kind === 'sift')?.start).toBe(4);
    expect(frames.filter((f) => f.kind === 'sift').map((f) => f.start)).toEqual([4, 3, 2, 1, 0]);
  });

  it('stays under 400 frames at the size cap', () => {
    for (const method of METHODS) {
      expect(buildHeapTrace(makeBuildValues('descending', MAX_N), method).length).toBeLessThan(400);
    }
  });

  it('does not alias frames', () => {
    const frames = buildHeapTrace([9, 4, 7, 1, 8, 2, 6]);
    const before = frames[3].values.slice();
    const moves = frames[3].levelMoves.slice();
    frames[2].values.reverse();
    frames[2].levelMoves[0] = 99;
    expect(frames[3].values).toEqual(before);
    expect(frames[3].levelMoves).toEqual(moves);
  });
});

describe('parseBuildValues', () => {
  it('reads values and refuses bad input', () => {
    expect(parseBuildValues('4 10, 3')).toEqual({ values: [4, 10, 3] });
    expect(parseBuildValues('4, x')).toEqual({ error: 'format' });
    expect(parseBuildValues('4, 100')).toEqual({ error: 'range' });
    expect(parseBuildValues('4')).toEqual({ error: 'count' });
    expect(
      parseBuildValues(
        Array(MAX_N + 1)
          .fill('1')
          .join(' '),
      ),
    ).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it.each(METHODS)('highlights every line (%s)', (method) => {
    const frames = [
      ...buildHeapTrace([9, 4, 7, 1, 8, 2, 6], method),
      ...buildHeapTrace([1, 2, 3, 4], method),
      ...buildHeapTrace([5, 1, 9, 7], method),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(buildPseudocode(method).map((_, i) => i));
  });
});
