import { describe, expect, it } from 'vitest';
import {
  MAX_SIDE,
  hopcroftKarpPseudocode,
  kuhnPseudocode,
  matchingTrace,
  neighbours,
} from './bipartite-matching.js';

/** Deterministic LCG so random graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./bipartite-matching.js').Pair} Pair */

/** A: 1 2, B: 1, C: 2 3, D: 3 4 (0-based below): the last augmenting path is 7 edges long. */
/** @type {Pair[]} */
const CHAIN = [
  [0, 0],
  [0, 1],
  [1, 0],
  [2, 1],
  [2, 2],
  [3, 2],
  [3, 3],
];
/** A, B and C all want 1; only C and D reach 2 and 3. */
/** @type {Pair[]} */
const HALL = [
  [0, 0],
  [1, 0],
  [2, 0],
  [2, 1],
  [2, 2],
  [3, 1],
];

/**
 * Oracle: maximum matching size by DP over the set of right vertices used.
 * @param {number} left @param {number} right @param {Pair[]} edges
 */
function bruteSize(left, right, edges) {
  const adj = neighbours(left, right, edges);
  /** @type {Map<string, number>} */
  const memo = new Map();
  /** @param {number} u @param {number} used @returns {number} */
  const best = (u, used) => {
    if (u === left) return 0;
    const key = `${u},${used}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let b = best(u + 1, used);
    for (const r of adj[u])
      if (!(used & (1 << r))) b = Math.max(b, 1 + best(u + 1, used | (1 << r)));
    memo.set(key, b);
    return b;
  };
  return best(0, 0);
}

/**
 * Checks the final matching uses real edges and is consistent both ways.
 * @param {import('./bipartite-matching.js').MatchFrame} f @param {Pair[]} edges
 */
function checkMatching(f, edges) {
  let size = 0;
  f.matchL.forEach((r, l) => {
    if (r < 0) return;
    size++;
    expect(f.matchR[r]).toBe(l);
    expect(edges.some(([a, b]) => a === l && b === r)).toBe(true);
  });
  expect(f.matchR.filter((l) => l >= 0)).toHaveLength(size);
  return size;
}

describe('Kuhn', () => {
  it('re-routes earlier matches along augmenting paths', () => {
    const frames = matchingTrace({ left: 4, right: 4, edges: CHAIN, method: 'kuhn' });
    const flips = frames.filter((f) => f.kind === 'flip').map((f) => f.path);
    expect(flips).toEqual([
      [0, 0],
      [1, 0, 0, 1],
      [2, 2],
      [3, 3],
    ]);
    const last = frames.at(-1);
    expect(last?.matchL).toEqual([1, 0, 2, 3]);
    expect(last?.size).toBe(4);
    expect(last?.checks).toBe(16);
    expect(frames.filter((f) => f.kind === 'skip').length).toBeGreaterThan(0);
  });

  it('leaves a vertex unmatched when no augmenting path starts there', () => {
    const frames = matchingTrace({ left: 4, right: 3, edges: HALL, method: 'kuhn' });
    expect(frames.filter((f) => f.kind === 'fail').map((f) => f.root)).toEqual([1]);
    expect(frames.at(-1)?.size).toBe(3);
    expect(frames.at(-1)?.matchL).toEqual([0, -1, 2, 1]);
  });
});

describe('Hopcroft-Karp', () => {
  it('flips disjoint shortest paths phase by phase', () => {
    const frames = matchingTrace({ left: 4, right: 4, edges: CHAIN, method: 'hk' });
    const phases = frames.filter((f) => f.kind === 'phase');
    expect(phases.map((f) => f.length)).toEqual([1, 7]);
    expect(phases[1].layer).toEqual([1, 0, 2, 3]);
    expect(frames.filter((f) => f.kind === 'flip').map((f) => f.path)).toEqual([
      [0, 0],
      [2, 1],
      [3, 2],
      [1, 0, 0, 1, 2, 2, 3, 3],
    ]);
    expect(frames.filter((f) => f.kind === 'blocked').map((f) => f.phasePaths)).toEqual([3, 1]);
    const last = frames.at(-1);
    expect(last?.size).toBe(4);
    expect(last?.phases).toBe(2);
    expect(frames.at(-2)?.kind).toBe('none');
  });

  it('handles empty sides and no edges', () => {
    for (const method of /** @type {const} */ (['kuhn', 'hk'])) {
      expect(matchingTrace({ left: 0, right: 3, edges: [], method }).at(-1)?.size).toBe(0);
      const none = matchingTrace({ left: 2, right: 2, edges: [], method });
      expect(none.at(-1)?.matchL).toEqual([-1, -1]);
    }
    expect(
      neighbours(2, 2, [
        [0, 1],
        [0, 1],
        [5, 0],
        [1, 9],
      ]),
    ).toEqual([[1], []]);
  });
});

describe('both methods', () => {
  it('agree with a brute-force maximum on random graphs', () => {
    const rand = seeded(17);
    for (let t = 0; t < 200; t++) {
      const left = 1 + Math.floor(rand() * MAX_SIDE);
      const right = 1 + Math.floor(rand() * MAX_SIDE);
      /** @type {Pair[]} */
      const edges = [];
      const p = 0.15 + rand() * 0.5;
      for (let l = 0; l < left; l++)
        for (let r = 0; r < right; r++) if (rand() < p) edges.push([l, r]);
      const want = bruteSize(left, right, edges);
      for (const method of /** @type {const} */ (['kuhn', 'hk'])) {
        const frames = matchingTrace({ left, right, edges, method });
        const last = /** @type {import('./bipartite-matching.js').MatchFrame} */ (frames.at(-1));
        expect(last.size).toBe(want);
        expect(checkMatching(last, edges)).toBe(want);
        expect(frames.length).toBeLessThan(400);
        // Every flipped path alternates and ends at a vertex that was free.
        frames.forEach((f, i) => {
          if (f.kind !== 'flip') return;
          const before = frames[i - 1];
          expect(f.path.length % 2).toBe(0);
          expect(before.matchL[f.path[0]]).toBe(-1);
          expect(before.matchR[/** @type {number} */ (f.path.at(-1))]).toBe(-1);
        });
      }
    }
  });

  it('stay under 400 frames on a complete graph at the cap', () => {
    /** @type {Pair[]} */
    const edges = [];
    for (let l = 0; l < MAX_SIDE; l++) for (let r = 0; r < MAX_SIDE; r++) edges.push([l, r]);
    for (const method of /** @type {const} */ (['kuhn', 'hk'])) {
      const frames = matchingTrace({ left: MAX_SIDE, right: MAX_SIDE, edges, method });
      expect(frames.at(-1)?.size).toBe(MAX_SIDE);
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('frames do not alias', () => {
    const frames = matchingTrace({ left: 4, right: 4, edges: CHAIN, method: 'kuhn' });
    frames[2].matchL[0] = 99;
    frames[2].path.push(99);
    frames[2].visited[0] = true;
    expect(frames[3].matchL[0]).not.toBe(99);
    expect(frames[3].path).not.toContain(99);
    expect(frames[1].visited[0]).toBe(false);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every Kuhn line', () => {
    const frames = [
      ...matchingTrace({ left: 4, right: 4, edges: CHAIN, method: 'kuhn' }),
      ...matchingTrace({ left: 4, right: 3, edges: HALL, method: 'kuhn' }),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(kuhnPseudocode.map((_, i) => i));
  });

  it('highlights every Hopcroft-Karp line', () => {
    const frames = matchingTrace({ left: 4, right: 3, edges: HALL, method: 'hk' });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(hopcroftKarpPseudocode.map((_, i) => i));
  });
});
