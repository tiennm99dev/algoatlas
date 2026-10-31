import { describe, expect, it } from 'vitest';
import { cycleFrom, indexEdges } from './weighted-edges.js';

describe('indexEdges', () => {
  it('numbers vertices by ascending id and keeps the edge order', () => {
    const { n, list } = indexEdges(
      [30, 10, 20],
      [
        { from: 10, to: 20, weight: 4 },
        { from: 20, to: 30 },
        { from: 30, to: 10, weight: -2 },
      ],
    );
    expect(n).toBe(3);
    expect(list).toEqual([
      { u: 0, v: 1, w: 4, edge: 0 },
      { u: 1, v: 2, w: 1, edge: 1 },
      { u: 2, v: 0, w: -2, edge: 2 },
    ]);
  });

  it('leaves out loops and edges to unknown ids, keeping input positions', () => {
    const { list } = indexEdges(
      [1, 2],
      [
        { from: 1, to: 1 },
        { from: 1, to: 9 },
        { from: 2, to: 1, weight: 3 },
      ],
    );
    expect(list).toEqual([{ u: 1, v: 0, w: 3, edge: 2 }]);
  });
});

describe('cycleFrom', () => {
  it('lands on the cycle and lists it in edge order, smallest vertex first', () => {
    // 0 → 1 → 2 → 3 → 1: parent links point backwards along the edges.
    expect(cycleFrom([-1, 3, 1, 2], 2, 4)).toEqual([1, 2, 3]);
    // The same cycle reached from another vertex reads the same way.
    expect(cycleFrom([-1, 3, 1, 2], 3, 4)).toEqual([1, 2, 3]);
  });

  it('is empty when the parent links never close a cycle', () => {
    expect(cycleFrom([-1, 0], 1, 2)).toEqual([]);
    expect(cycleFrom([-1, 0, 1], 2, 3)).toEqual([]);
  });
});
