import { describe, expect, it } from 'vitest';
import {
  CENTROID_PRESETS,
  MAX_K,
  centroidLevels,
  centroidPseudocode,
  centroidTrace,
  makeCentroidPreset,
  pairsAtDistance,
} from './centroid-decomposition.js';
import {
  MAX_NODES,
  childrenOf,
  isRootedTree,
  lettered,
  randomParents,
} from './lca-binary-lifting.js';

/** Deterministic LCG so random trees are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./centroid-decomposition.js').CentroidFrame} CentroidFrame */

/** Largest part left when x is removed from the nodes `alive`, by flood fill. @param {number[]} parent @param {Set<number>} alive @param {number} x */
function largestPart(parent, alive, x) {
  const kids = childrenOf(parent);
  const adj = kids.map((cs, v) => (parent[v] >= 0 ? [parent[v], ...cs] : cs));
  const seen = new Set([x]);
  let best = 0;
  for (const y of adj[x]) {
    if (!alive.has(y) || seen.has(y)) continue;
    let count = 0;
    const stack = [y];
    seen.add(y);
    while (stack.length) {
      const z = /** @type {number} */ (stack.pop());
      count++;
      for (const w of adj[z])
        if (alive.has(w) && !seen.has(w)) {
          seen.add(w);
          stack.push(w);
        }
    }
    best = Math.max(best, count);
  }
  return best;
}

const sample = makeCentroidPreset('sample');

describe('centroid decomposition trace', () => {
  it('counts the pairs at distance K like an all-pairs BFS', () => {
    const rand = seeded(6);
    for (let trial = 0; trial < 25; trial++) {
      const parent = randomParents(1 + Math.floor(rand() * MAX_NODES), rand);
      for (const k of [1, 2, 3, 5, MAX_K]) {
        expect(centroidTrace(lettered(parent), k).at(-1)?.pairs).toBe(pairsAtDistance(parent, k));
      }
    }
  });

  it('picks a true centroid for every piece and removes every node once', () => {
    const rand = seeded(9);
    for (let trial = 0; trial < 25; trial++) {
      const parent = randomParents(1 + Math.floor(rand() * MAX_NODES), rand);
      const frames = centroidTrace(lettered(parent), 2);
      const removes = frames.filter((f) => f.kind === 'remove');
      expect(new Set(removes.map((f) => f.c)).size).toBe(parent.length);
      for (const f of frames.filter((g) => g.kind === 'centroid')) {
        const alive = new Set(f.piece);
        expect(largestPart(parent, alive, f.c) * 2).toBeLessThanOrEqual(f.piece.length);
        expect(Math.max(0, ...f.parts)).toBe(largestPart(parent, alive, f.c));
        expect(f.parts.reduce((a, b) => a + b, 0)).toBe(f.piece.length - 1);
      }
      const done = /** @type {CentroidFrame} */ (frames.at(-1));
      expect(centroidLevels(done)).toBeLessThanOrEqual(Math.floor(Math.log2(parent.length)) + 1);
      expect(done.ctParent.filter((p) => p === -1)).toHaveLength(1);
    }
  });

  it('decomposes the sample: B first, after walking from A', () => {
    const frames = centroidTrace(sample, 3);
    expect(frames.slice(0, 4).map((f) => f.kind)).toEqual([
      'start',
      'component',
      'walk',
      'centroid',
    ]);
    const first = /** @type {CentroidFrame} */ (frames.find((f) => f.kind === 'centroid'));
    expect(first.c).toBe(1);
    expect(first.parts).toEqual([6, 5, 2]);
    expect(frames.find((f) => f.kind === 'count')?.added).toBe(10);
    const done = /** @type {CentroidFrame} */ (frames.at(-1));
    expect(done.pairs).toBe(16);
    expect(done.work).toBe(41);
    expect(centroidLevels(done)).toBe(4);
    expect(done.ctParent[1]).toBe(-1);
    expect(done.ctParent[5]).toBe(1);
  });

  it('splits a path in the middle every time', () => {
    const frames = centroidTrace(makeCentroidPreset('path'), 4);
    const order = frames.filter((f) => f.kind === 'remove').map((f) => f.c);
    expect(order.slice(0, 3)).toEqual([7, 3, 1]);
    expect(centroidLevels(/** @type {CentroidFrame} */ (frames.at(-1)))).toBe(4);
  });

  it('handles one node, a star and a K beyond the diameter', () => {
    const one = centroidTrace(lettered([-1]), 1);
    expect(one.map((f) => f.kind)).toEqual([
      'start',
      'component',
      'centroid',
      'count',
      'remove',
      'done',
    ]);
    expect(centroidTrace(makeCentroidPreset('star'), 2).at(-1)?.pairs).toBe(28);
    expect(centroidTrace(sample, MAX_K).at(-1)?.pairs).toBe(0);
  });

  it('keeps traces under 400 frames at the size cap', () => {
    for (let seed = 1; seed < 6; seed++) {
      const parent = randomParents(MAX_NODES, seeded(seed));
      expect(centroidTrace(lettered(parent), 3).length).toBeLessThan(400);
    }
    expect(
      centroidTrace(lettered(Array.from({ length: MAX_NODES }, (_, i) => i - 1)), 3).length,
    ).toBeLessThan(400);
  });

  it('does not alias frames and rejects bad input', () => {
    const frames = centroidTrace(sample, 3);
    const [a, b] = [frames[1], frames[2]];
    a.removed[0] = true;
    a.piece.push(99);
    a.pending.push([99]);
    expect(b.removed[0]).toBe(false);
    expect(b.piece).not.toContain(99);
    expect(b.pending).toHaveLength(0);
    expect(() => centroidTrace(sample, 0)).toThrow();
    expect(() => centroidTrace({ labels: ['A'], parent: [0] }, 1)).toThrow();
  });

  it('builds valid presets', () => {
    for (const p of CENTROID_PRESETS)
      expect(isRootedTree(makeCentroidPreset(p, seeded(4)))).toBe(true);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const seen = new Set(centroidTrace(sample, 3).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(centroidPseudocode.map((_, i) => i));
  });
});
