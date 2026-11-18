import { describe, expect, it } from 'vitest';
import {
  MAX_NODES,
  childrenOf,
  depthsOf,
  isRootedTree,
  lettered,
  randomParents,
  removeSubtree,
} from './rooted-tree.js';
import {
  LOG,
  PRESETS,
  eulerLca,
  eulerTour,
  liftingPseudocode,
  liftingTrace,
  makeLiftPreset,
  naiveLca,
  pathUp,
  queryStart,
} from './lca-binary-lifting.js';

/** Deterministic LCG so random trees are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Ancestor sets, an oracle independent of depths. @param {number[]} parent @param {number} u @param {number} v */
function oracleLca(parent, u, v) {
  const seen = new Set();
  for (let x = u; x >= 0; x = parent[x]) seen.add(x);
  for (let x = v; x >= 0; x = parent[x]) if (seen.has(x)) return x;
  return -1;
}

/** The 2^k-th ancestor by walking, the root standing in for anything above it. @param {number[]} parent @param {number} x @param {number} steps */
function walkUp(parent, x, steps) {
  let y = x;
  for (let i = 0; i < steps && parent[y] >= 0; i++) y = parent[y];
  return y;
}

const family = makeLiftPreset('family').tree;

describe('binary lifting trace', () => {
  it('fills every jump-table cell with the 2^k-th ancestor', () => {
    const rand = seeded(3);
    for (let trial = 0; trial < 20; trial++) {
      const parent = randomParents(1 + Math.floor(rand() * MAX_NODES), rand);
      const frames = liftingTrace(lettered(parent), 0, 0);
      const up = /** @type {number[][]} */ (frames.at(-1)?.up);
      for (let k = 0; k < LOG; k++)
        parent.forEach((_, x) => expect(up[k][x]).toBe(walkUp(parent, x, 2 ** k)));
      expect(frames.at(-1)?.cells).toBe(LOG * parent.length);
    }
  });

  it('answers every pair like the ancestor-set oracle', () => {
    const rand = seeded(11);
    for (let trial = 0; trial < 12; trial++) {
      const parent = randomParents(2 + Math.floor(rand() * (MAX_NODES - 1)), rand);
      for (let u = 0; u < parent.length; u++)
        for (let v = 0; v < parent.length; v++) {
          const want = oracleLca(parent, u, v);
          expect(liftingTrace(lettered(parent), u, v).at(-1)?.answer).toBe(want);
          expect(naiveLca(parent, u, v)).toBe(want);
          expect(eulerLca(parent, u, v).node).toBe(want);
        }
    }
  });

  it('handles a single node, a node with itself and an ancestor pair', () => {
    expect(liftingTrace(lettered([-1]), 0, 0).at(-1)?.answer).toBe(0);
    const self = liftingTrace(family, 7, 7);
    expect(self.at(-1)?.answer).toBe(7);
    expect(self.some((f) => f.kind === 'same')).toBe(true);
    const ancestor = liftingTrace(family, 1, 13);
    expect(ancestor.at(-1)?.answer).toBe(1);
    expect(ancestor.find((f) => f.kind === 'level')?.swapped).toBe(true);
  });

  it('walks the family query: lift N by 2, hold at 2, jump at 1, answer B', () => {
    const frames = liftingTrace(family, 13, 8);
    const query = frames.slice(queryStart(frames));
    expect(query.map((f) => f.kind)).toEqual([
      'query',
      'level',
      'skip',
      'skip',
      'lift',
      'skip',
      'apart',
      'hold',
      'hold',
      'hold',
      'jump',
      'answer',
      'done',
    ]);
    const done = /** @type {import('./lca-binary-lifting.js').LiftFrame} */ (frames.at(-1));
    expect(done.answer).toBe(1);
    expect(done.d).toBe(2);
    // One read for the lift, two per pair comparison, one for the final up[0].
    expect(done.reads).toBe(1 + 2 * LOG + 1);
    expect(done.moves).toBe(3);
  });

  it('lifts a 16-node path by 8, 4, 2 and 1', () => {
    const { tree, u, v } = makeLiftPreset('path');
    const frames = liftingTrace(tree, u, v);
    expect(frames.filter((f) => f.kind === 'lift').map((f) => f.k)).toEqual([3, 2, 1, 0]);
    expect(frames.at(-1)?.answer).toBe(0);
    expect(frames.at(-1)?.moves).toBe(4);
  });

  it('keeps the trace under 400 frames at the size cap', () => {
    const parent = randomParents(MAX_NODES, seeded(5));
    expect(liftingTrace(lettered(parent), MAX_NODES - 1, 1).length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = liftingTrace(family, 13, 8);
    const a = frames[1];
    const b = frames[2];
    a.up[1][0] = 99;
    a.depth[0] = 99;
    a.lines.push(99);
    expect(b.up[1][0]).not.toBe(99);
    expect(b.depth[0]).toBe(0);
    expect(b.lines).not.toContain(99);
  });

  it('rejects a broken parent list and an out-of-range query', () => {
    expect(() => liftingTrace({ labels: ['A', 'B'], parent: [-1, 1] }, 0, 1)).toThrow();
    expect(() => liftingTrace(family, 0, 20)).toThrow();
  });
});

describe('Euler tour', () => {
  it('lists 2n − 1 entries with each first visit in place', () => {
    const { tour, first } = eulerTour(family.parent);
    expect(tour).toHaveLength(2 * family.parent.length - 1);
    first.forEach((i, x) => expect(tour[i]).toBe(x));
    expect(tour.slice(0, 6)).toEqual([0, 1, 3, 6, 3, 7]);
  });

  it('finds the shallowest entry between the first visits', () => {
    const r = eulerLca(family.parent, 13, 8);
    expect(r.node).toBe(1);
    expect(r.lo).toBeLessThan(r.hi);
    const depth = depthsOf(family.parent);
    for (let i = r.lo; i <= r.hi; i++)
      expect(depth[r.tour[i]]).toBeGreaterThanOrEqual(depth[r.node]);
  });
});

describe('tree model', () => {
  it('removes a whole subtree, keeps names and reports the old indices', () => {
    const { tree, keep } = removeSubtree(family, 3);
    expect(tree.labels).toEqual(['A', 'B', 'C', 'E', 'F', 'I', 'J', 'K', 'M']);
    expect(keep).toEqual([0, 1, 2, 4, 5, 8, 9, 10, 12]);
    expect(isRootedTree(tree)).toBe(true);
    expect(childrenOf(tree.parent)[1]).toEqual([3]);
    expect(removeSubtree(family, 0).tree.parent).toEqual(family.parent);
  });

  it('reads paths up to an ancestor and builds valid presets', () => {
    expect(pathUp(family.parent, 13, 1)).toEqual([13, 11, 7, 3, 1]);
    for (const p of PRESETS) {
      const { tree, u, v } = makeLiftPreset(p, seeded(9));
      expect(isRootedTree(tree)).toBe(true);
      expect(u).toBeLessThan(tree.parent.length);
      expect(v).toBeLessThan(tree.parent.length);
      expect(u).not.toBe(v);
    }
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [...liftingTrace(family, 13, 8), ...liftingTrace(family, 1, 13)];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(liftingPseudocode.map((_, i) => i));
  });
});
