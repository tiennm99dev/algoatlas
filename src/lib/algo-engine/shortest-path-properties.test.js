import { describe, expect, it } from 'vitest';
import {
  MAX_OPS,
  relaxPseudocode,
  relaxationTrace,
  shortestDistances,
  treePath,
} from './shortest-path-properties.js';

/** Deterministic LCG so random graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const EDGES = [
  { from: 0, to: 1, weight: 6 },
  { from: 0, to: 2, weight: 2 },
  { from: 2, to: 1, weight: 3 },
  { from: 1, to: 3, weight: 2 },
  { from: 2, to: 3, weight: 7 },
  { from: 3, to: 4, weight: 1 },
  { from: 2, to: 4, weight: 9 },
];

/**
 * Shortest distances by trying every simple path (fine for tiny graphs).
 * @param {number} n @param {{from: number, to: number, weight: number}[]} edges @param {number} s
 */
function bruteForce(n, edges, s) {
  const best = new Array(n).fill(Infinity);
  const seen = new Array(n).fill(false);
  /** @param {number} u @param {number} w */
  const walk = (u, w) => {
    best[u] = Math.min(best[u], w);
    seen[u] = true;
    for (const e of edges) if (e.from === u && !seen[e.to]) walk(e.to, w + e.weight);
    seen[u] = false;
  };
  walk(s, 0);
  return best;
}

/** @param {() => number} rand */
function randomGraph(rand) {
  const n = 2 + Math.floor(rand() * 5);
  const edges = [];
  for (let u = 0; u < n; u++)
    for (let v = 0; v < n; v++)
      if (u !== v && rand() < 0.4) edges.push({ from: u, to: v, weight: Math.floor(rand() * 10) });
  return { n, edges };
}

describe('relaxation trace', () => {
  it('reaches the true distances after relaxing the edge list in a good order', () => {
    const frames = relaxationTrace({ n: 5, edges: EDGES, source: 0, ops: [0, 1, 2, 3, 4, 5, 6] });
    const last = frames.at(-1);
    expect(last?.kind).toBe('done');
    expect(last?.dist).toEqual([0, 5, 2, 7, 8]);
    expect(last?.parent).toEqual([-1, 2, 0, 1, 3]);
    expect(last?.relaxations).toBe(7);
    expect(last?.updates).toBe(5);
    expect(last?.exact).toBe(5);
  });

  it('leaves wrong or infinite labels after one pass in reverse order', () => {
    const frames = relaxationTrace({ n: 5, edges: EDGES, source: 0, ops: [6, 5, 4, 3, 2, 1, 0] });
    const last = frames.at(-1);
    expect(last?.dist).toEqual([0, 6, 2, Infinity, Infinity]);
    expect(last?.updates).toBe(2);
    expect(last?.exact).toBe(2);
  });

  it('makes d[D] exact with four relaxations along its shortest path', () => {
    const last = relaxationTrace({ n: 5, edges: EDGES, source: 0, ops: [1, 2, 3, 5] }).at(-1);
    expect(last?.dist[4]).toBe(8);
    expect(last?.relaxations).toBe(4);
  });

  it('reports the comparison of every relaxation', () => {
    const frames = relaxationTrace({ n: 5, edges: EDGES, source: 0, ops: [0, 2, 1, 2] });
    const relax = frames.filter((f) => f.kind === 'relax');
    expect(relax.map((f) => [f.before, f.candidate, f.improved])).toEqual([
      [Infinity, 6, true],
      [6, Infinity, false],
      [Infinity, 2, true],
      [6, 5, true],
    ]);
  });

  it('handles an empty sequence and a single vertex', () => {
    expect(relaxationTrace({ n: 1, edges: [], source: 0, ops: [] }).map((f) => f.kind)).toEqual([
      'start',
      'done',
    ]);
  });

  it('caps the sequence length', () => {
    const ops = new Array(MAX_OPS + 10).fill(0);
    const frames = relaxationTrace({ n: 5, edges: EDGES, source: 0, ops });
    expect(frames.at(-1)?.relaxations).toBe(MAX_OPS);
  });

  it('never lets a label go up or below the true distance', () => {
    const rand = seeded(11);
    for (let t = 0; t < 40; t++) {
      const { n, edges } = randomGraph(rand);
      const truth = bruteForce(n, edges, 0);
      const ops = Array.from({ length: 20 }, () => Math.floor(rand() * edges.length));
      const frames = relaxationTrace({ n, edges, source: 0, ops });
      for (let i = 1; i < frames.length; i++)
        for (let v = 0; v < n; v++) {
          expect(frames[i].dist[v]).toBeLessThanOrEqual(frames[i - 1].dist[v]);
          expect(frames[i].dist[v]).toBeGreaterThanOrEqual(truth[v]);
        }
    }
  });

  it('matches brute force after n - 1 passes over the edge list', () => {
    const rand = seeded(5);
    for (let t = 0; t < 40; t++) {
      const { n, edges } = randomGraph(rand);
      const pass = edges.map((_, k) => k);
      const ops = Array.from({ length: n - 1 }, () => pass).flat();
      const last = relaxationTrace({ n, edges, source: 0, ops: ops.slice(0, MAX_OPS) }).at(-1);
      if (ops.length <= MAX_OPS) expect(last?.dist).toEqual(bruteForce(n, edges, 0));
      expect(shortestDistances(n, edges, 0)).toEqual(bruteForce(n, edges, 0));
    }
  });

  it('frames do not alias', () => {
    const frames = relaxationTrace({ n: 5, edges: EDGES, source: 0, ops: [0, 1] });
    frames[0].dist[1] = 42;
    frames[0].parent[1] = 42;
    expect(frames[1].dist[1]).toBe(6);
    expect(frames[1].parent[1]).toBe(0);
  });
});

describe('tree path', () => {
  it('follows parents back to the source', () => {
    expect(treePath([-1, 2, 0, 1, 3], 0, 4)).toEqual([0, 2, 1, 3, 4]);
    expect(treePath([-1, -1, 0], 0, 1)).toEqual([]);
    expect(treePath([-1], 0, 0)).toEqual([0]);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = relaxationTrace({ n: 5, edges: EDGES, source: 0, ops: [0, 0] });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(relaxPseudocode.map((_, i) => i));
  });
});
