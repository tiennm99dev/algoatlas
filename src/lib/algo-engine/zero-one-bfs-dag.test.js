import { describe, expect, it } from 'vitest';
import {
  dagLongPseudocode,
  dagShortPseudocode,
  dagTrace,
  topologicalOrder,
  zeroOnePseudocode,
  zeroOneTrace,
} from './zero-one-bfs-dag.js';

/** Deterministic LCG so random graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

// S A B C D E T
const ZERO_ONE = [
  { from: 0, to: 1, weight: 1 },
  { from: 0, to: 2, weight: 0 },
  { from: 2, to: 1, weight: 1 },
  { from: 2, to: 3, weight: 0 },
  { from: 1, to: 4, weight: 0 },
  { from: 3, to: 4, weight: 1 },
  { from: 3, to: 5, weight: 1 },
  { from: 4, to: 6, weight: 1 },
  { from: 5, to: 6, weight: 0 },
];

// R S T X Y Z
const DAG = [
  { from: 0, to: 1, weight: 5 },
  { from: 0, to: 2, weight: 3 },
  { from: 1, to: 2, weight: 2 },
  { from: 1, to: 3, weight: 6 },
  { from: 2, to: 3, weight: 7 },
  { from: 2, to: 4, weight: 4 },
  { from: 2, to: 5, weight: 2 },
  { from: 3, to: 4, weight: -1 },
  { from: 3, to: 5, weight: 1 },
  { from: 4, to: 5, weight: -2 },
];

/**
 * Best path weight from s to every vertex by trying every path (graphs here are acyclic or
 * small). Uses only simple paths, which is exact without negative cycles.
 * @param {number} n @param {{from: number, to: number, weight: number}[]} edges @param {number} s
 * @param {boolean} longest
 */
function bruteForce(n, edges, s, longest = false) {
  const best = new Array(n).fill(longest ? -Infinity : Infinity);
  const onPath = new Array(n).fill(false);
  /** @param {number} u @param {number} w */
  const walk = (u, w) => {
    best[u] = longest ? Math.max(best[u], w) : Math.min(best[u], w);
    onPath[u] = true;
    for (const e of edges) if (e.from === u && !onPath[e.to]) walk(e.to, w + e.weight);
    onPath[u] = false;
  };
  walk(s, 0);
  return best;
}

describe('0-1 BFS', () => {
  it('finds the distances of the starting graph', () => {
    const last = zeroOneTrace({ n: 7, edges: ZERO_ONE, source: 0 }).at(-1);
    expect(last?.dist).toEqual([0, 1, 0, 0, 1, 1, 1]);
    expect(last?.parent).toEqual([-1, 0, 0, 2, 3, 3, 5]);
  });

  it('pushes 0-edges to the front and 1-edges to the back', () => {
    const frames = zeroOneTrace({ n: 7, edges: ZERO_ONE, source: 0 });
    const improves = frames.filter((f) => f.kind === 'improve');
    expect(improves.map((f) => [f.neighbor, f.front, f.deque.map((e) => e.v)])).toEqual([
      [1, false, [1]],
      [2, true, [2, 1]],
      [3, true, [3, 1]],
      [4, false, [1, 4]],
      [5, false, [1, 4, 5]],
      [6, false, [5, 6]],
      [6, true, [6, 6]],
    ]);
    const last = frames.at(-1);
    expect(last?.pushFront).toBe(3);
    expect(last?.pushBack).toBe(4);
    expect(last?.pops).toBe(8);
    expect(frames.filter((f) => f.kind === 'skip').map((f) => f.current)).toEqual([6]);
  });

  it('keeps the deque sorted with at most two distinct labels', () => {
    const rand = seeded(9);
    for (let t = 0; t < 60; t++) {
      const n = 1 + Math.floor(rand() * 8);
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = 0; v < n; v++)
          if (u !== v && rand() < 0.35)
            edges.push({ from: u, to: v, weight: rand() < 0.5 ? 0 : 1 });
      const frames = zeroOneTrace({ n, edges, source: 0 });
      expect(frames.at(-1)?.dist).toEqual(bruteForce(n, edges, 0));
      for (const f of frames) {
        const labels = f.deque.map((e) => e.d);
        expect(labels).toEqual(labels.toSorted((a, b) => a - b));
        if (labels.length) expect((labels.at(-1) ?? 0) - labels[0]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('handles a lone source and a source outside the graph', () => {
    expect(zeroOneTrace({ n: 1, edges: [], source: 0 }).map((f) => f.kind)).toEqual([
      'start',
      'pop',
      'done',
    ]);
    expect(zeroOneTrace({ n: 2, edges: [], source: 5 }).at(-1)?.dist).toEqual([Infinity, Infinity]);
  });

  it('frames do not alias', () => {
    const frames = zeroOneTrace({ n: 7, edges: ZERO_ONE, source: 0 });
    frames[1].deque.push({ v: 99, d: 0 });
    frames[1].dist[0] = 99;
    expect(frames[2].deque.some((e) => e.v === 99)).toBe(false);
    expect(frames[2].dist[0]).toBe(0);
  });
});

describe('DAG shortest and longest paths', () => {
  it('relaxes in topological order and skips unreachable vertices', () => {
    const frames = dagTrace({ n: 6, edges: DAG, source: 1 });
    expect(frames[0].order).toEqual([0, 1, 2, 3, 4, 5]);
    const last = frames.at(-1);
    expect(last?.dist).toEqual([Infinity, 0, 2, 6, 5, 3]);
    expect(last?.parent).toEqual([-1, -1, 1, 1, 3, 4]);
    expect(frames.filter((f) => f.kind === 'skip').map((f) => f.current)).toEqual([0]);
    expect(last?.relaxations).toBe(8);
  });

  it('finds longest paths by flipping the comparison', () => {
    const last = dagTrace({ n: 6, edges: DAG, source: 1, longest: true }).at(-1);
    expect(last?.dist).toEqual([-Infinity, 0, 2, 9, 8, 10]);
    expect(last?.parent).toEqual([-1, -1, 1, 2, 3, 3]);
  });

  it('matches brute force on random DAGs with negative weights', () => {
    const rand = seeded(21);
    for (let t = 0; t < 60; t++) {
      const n = 1 + Math.floor(rand() * 7);
      // A random permutation decides which way edges point, so the graph is acyclic.
      const rank = [...Array(n).keys()].sort(() => rand() - 0.5);
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = 0; v < n; v++)
          if (rank[u] < rank[v] && rand() < 0.4)
            edges.push({ from: u, to: v, weight: Math.floor(rand() * 21) - 8 });
      const s = Math.floor(rand() * n);
      expect(dagTrace({ n, edges, source: s }).at(-1)?.dist).toEqual(bruteForce(n, edges, s));
      expect(dagTrace({ n, edges, source: s, longest: true }).at(-1)?.dist).toEqual(
        bruteForce(n, edges, s, true),
      );
      const order = /** @type {number[]} */ (topologicalOrder(n, edges));
      for (const e of edges) expect(order.indexOf(e.from)).toBeLessThan(order.indexOf(e.to));
    }
  });

  it('reports a cycle instead of an order', () => {
    const edges = [
      { from: 0, to: 1, weight: 1 },
      { from: 1, to: 0, weight: 1 },
    ];
    expect(topologicalOrder(2, edges)).toBeNull();
    expect(dagTrace({ n: 2, edges, source: 0 }).map((f) => f.kind)).toEqual(['cycle']);
  });

  it('frames do not alias', () => {
    const frames = dagTrace({ n: 6, edges: DAG, source: 1 });
    frames[1].dist[1] = 99;
    frames[1].order.push(99);
    expect(frames[2].dist[1]).toBe(0);
    expect(frames[2].order).toHaveLength(6);
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['0-1 BFS', zeroOnePseudocode, zeroOneTrace({ n: 7, edges: ZERO_ONE, source: 0 })],
    ['DAG shortest', dagShortPseudocode, dagTrace({ n: 6, edges: DAG, source: 1 })],
    ['DAG longest', dagLongPseudocode, dagTrace({ n: 6, edges: DAG, source: 1, longest: true })],
  ])('%s trace highlights every pseudocode line', (_, code, frames) => {
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(code.map((__, i) => i));
  });
});
