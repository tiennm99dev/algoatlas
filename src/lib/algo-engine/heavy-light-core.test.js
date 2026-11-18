import { describe, expect, it } from 'vitest';
import { decompose, pathNodes, pathRanges, sumTree } from './heavy-light-core.js';
import { MAX_NODES, randomParents } from './rooted-tree.js';

/** Deterministic LCG so random trees are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

describe('heavy-light core', () => {
  it('gives every chain a block of consecutive positions, heavy child next', () => {
    const rand = seeded(4);
    for (let trial = 0; trial < 30; trial++) {
      const parent = randomParents(1 + Math.floor(rand() * MAX_NODES), rand);
      const d = decompose(parent);
      expect([...d.pos].sort((a, b) => a - b)).toEqual(parent.map((_, i) => i));
      parent.forEach((p, v) => {
        if (d.heavy[v] >= 0) {
          expect(d.pos[d.heavy[v]]).toBe(d.pos[v] + 1);
          expect(d.head[d.heavy[v]]).toBe(d.head[v]);
        }
        if (p >= 0 && d.heavy[p] !== v) expect(d.head[v]).toBe(v);
      });
    }
  });

  it('counts segment-tree visits and writes', () => {
    const seg = sumTree([1, 2, 3, 4]);
    expect(seg.query(0, 3)).toEqual({ sum: 10, visits: 1 });
    expect(seg.query(1, 2)).toEqual({ sum: 5, visits: 7 });
    expect(seg.set(2, 10)).toBe(3);
    expect(seg.query(0, 3).sum).toBe(17);
  });

  it('walks a path through the meeting node and splits it by chain', () => {
    const parent = [-1, 0, 1, 0, 3];
    expect(pathNodes(parent, 2, 4)).toEqual([2, 1, 0, 3, 4]);
    const d = decompose(parent);
    expect(pathRanges(d, parent, 2, 4).map((r) => [r.from, r.to])).toEqual([
      [3, 4],
      [0, 2],
    ]);
  });
});
