import { describe, expect, it } from 'vitest';
import { kruskalPseudocode, kruskalTrace } from './kruskal.js';

/** Deterministic LCG so random graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const IDS = [0, 1, 2, 3, 4, 5];
const EDGES = [
  { from: 0, to: 1, weight: 3 },
  { from: 0, to: 2, weight: 4 },
  { from: 1, to: 2, weight: 2 },
  { from: 1, to: 3, weight: 5 },
  { from: 2, to: 3, weight: 6 },
  { from: 2, to: 4, weight: 8 },
  { from: 3, to: 4, weight: 7 },
  { from: 3, to: 5, weight: 9 },
  { from: 4, to: 5, weight: 1 },
];

/**
 * Prim’s algorithm with an O(V²) scan on an adjacency matrix, as an independent oracle: the
 * total weight of a minimum spanning forest.
 * @param {number} n @param {{from: number, to: number, weight?: number}[]} edges
 */
function primWeight(n, edges) {
  const w = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  for (const e of edges) {
    const x = e.weight ?? 1;
    if (x < w[e.from][e.to]) w[e.from][e.to] = w[e.to][e.from] = x;
  }
  const done = new Array(n).fill(false);
  const key = new Array(n).fill(Infinity);
  let total = 0;
  for (let round = 0; round < n; round++) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!done[v] && (u < 0 || key[v] < key[u])) u = v;
    if (key[u] === Infinity) key[u] = 0;
    done[u] = true;
    total += key[u];
    for (let v = 0; v < n; v++) if (!done[v] && w[u][v] < key[v]) key[v] = w[u][v];
  }
  return total;
}

describe('kruskal', () => {
  it('builds the MST of the starting graph and stops early', () => {
    const frames = kruskalTrace({ ids: IDS, edges: EDGES });
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'accept',
      'accept',
      'accept',
      'reject',
      'accept',
      'reject',
      'accept',
      'stop',
      'done',
    ]);
    const last = frames.at(-1);
    expect(last?.sorted).toEqual([8, 2, 0, 1, 3, 4, 6, 5, 7]);
    expect(last?.weight).toBe(18);
    expect(last?.status).toEqual([
      'tree',
      'cycle',
      'tree',
      'tree',
      'cycle',
      '',
      'tree',
      '',
      'tree',
    ]);
    expect(last?.hops).toBe(5);
    expect(last?.considered).toBe(7);
    expect(last?.accepted).toBe(5);
    expect(last?.rejected).toBe(2);
    expect(last?.finds).toBe(14);
    expect(last?.components).toBe(1);
  });

  it('rejects A — C because A and C already share a root', () => {
    const frames = kruskalTrace({ ids: IDS, edges: EDGES });
    const reject = frames.find((f) => f.kind === 'reject');
    expect(reject?.edge).toBe(1);
    expect(reject?.ru).toBe(reject?.rv);
  });

  it('keeps union by rank: ranks stay at most log₂ V', () => {
    const rand = seeded(9);
    for (let t = 0; t < 30; t++) {
      const n = 1 + Math.floor(rand() * 8);
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = u + 1; v < n; v++)
          if (rand() < 0.6) edges.push({ from: u, to: v, weight: 1 + Math.floor(rand() * 9) });
      for (const f of kruskalTrace({ ids: [...Array(n).keys()], edges }))
        for (const r of f.rank) expect(2 ** r).toBeLessThanOrEqual(n);
    }
  });

  it('returns a spanning forest on a disconnected graph', () => {
    const frames = kruskalTrace({
      ids: [0, 1, 2, 3],
      edges: [
        { from: 0, to: 1, weight: 2 },
        { from: 2, to: 3 },
      ],
    });
    const last = frames.at(-1);
    expect(last?.weight).toBe(3);
    expect(last?.components).toBe(2);
    expect(frames.some((f) => f.kind === 'stop')).toBe(false);
  });

  it('handles no vertices, one vertex and no edges', () => {
    expect(kruskalTrace({ ids: [], edges: [] }).map((f) => f.kind)).toEqual(['start', 'done']);
    expect(kruskalTrace({ ids: [4], edges: [] }).map((f) => f.kind)).toEqual(['start', 'done']);
    expect(
      kruskalTrace({ ids: [4, 7], edges: [{ from: 7, to: 4 }] })
        .at(-1)
        ?.status.join(),
    ).toBe('tree');
  });

  it('breaks weight ties by input order', () => {
    const last = kruskalTrace({
      ids: [0, 1, 2],
      edges: [
        { from: 0, to: 1, weight: 1 },
        { from: 1, to: 2, weight: 1 },
        { from: 0, to: 2, weight: 1 },
      ],
    }).at(-1);
    expect(last?.status).toEqual(['tree', 'tree', '']);
  });

  it('matches an O(V²) Prim on random graphs', () => {
    const rand = seeded(41);
    for (let t = 0; t < 80; t++) {
      const n = 1 + Math.floor(rand() * 8);
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = u + 1; v < n; v++)
          if (rand() < 0.5) edges.push({ from: u, to: v, weight: 1 + Math.floor(rand() * 20) });
      const frames = kruskalTrace({ ids: [...Array(n).keys()], edges });
      const last = frames.at(-1);
      expect(last?.weight).toBe(primWeight(n, edges));
      expect(last?.accepted).toBe(n - (last?.components ?? 0));
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('frames do not alias', () => {
    const frames = kruskalTrace({ ids: IDS, edges: EDGES });
    frames[1].parent[0] = 5;
    frames[1].status[0] = 'cycle';
    expect(frames[2].parent[0]).not.toBe(5);
    expect(frames[2].status[0]).toBe('');
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = kruskalTrace({ ids: IDS, edges: EDGES });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(kruskalPseudocode.map((_, i) => i));
  });
});
