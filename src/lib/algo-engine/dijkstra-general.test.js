import { describe, expect, it } from 'vitest';
import { dijkstraPseudocode, dijkstraTrace, heapPop, heapPush } from './dijkstra-general.js';

/** Deterministic LCG so random graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const IDS = [0, 1, 2, 3, 4, 5];
const EDGES = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 1 },
  { from: 2, to: 1, weight: 2 },
  { from: 1, to: 3, weight: 5 },
  { from: 2, to: 3, weight: 8 },
  { from: 2, to: 4, weight: 10 },
  { from: 3, to: 4, weight: 2 },
  { from: 3, to: 5, weight: 6 },
  { from: 4, to: 5, weight: 3 },
];

/**
 * Floyd-Warshall on the undirected graph, as an independent oracle.
 * @param {number} n @param {{from: number, to: number, weight?: number}[]} edges @param {number} s
 */
function oracle(n, edges, s) {
  const d = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)),
  );
  for (const e of edges) {
    const w = e.weight ?? 1;
    d[e.from][e.to] = Math.min(d[e.from][e.to], w);
    d[e.to][e.from] = Math.min(d[e.to][e.from], w);
  }
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d[s];
}

describe('dijkstra on a general graph', () => {
  it('finds the distances and parents of the starting graph', () => {
    const frames = dijkstraTrace({ ids: IDS, edges: EDGES, source: 0 });
    const last = frames.at(-1);
    expect(last?.kind).toBe('done');
    expect(last?.dist).toEqual([0, 3, 1, 8, 10, 13]);
    expect(last?.parent).toEqual([-1, 2, 0, 1, 3, 4]);
    expect(last?.order).toEqual([0, 2, 1, 3, 4, 5]);
  });

  it('counts pushes, pops and stale entries', () => {
    const last = dijkstraTrace({ ids: IDS, edges: EDGES, source: 0 }).at(-1);
    expect(last?.pushes).toBe(10);
    expect(last?.pops).toBe(10);
    expect(last?.stale).toBe(4);
    expect(last?.relaxations).toBe(2 * EDGES.length);
    expect(last?.heap).toEqual([]);
  });

  it('skips the stale entry left behind by a shorter route', () => {
    const frames = dijkstraTrace({ ids: IDS, edges: EDGES, source: 0 });
    const firstStale = frames.find((f) => f.kind === 'stale');
    expect(firstStale?.popped).toEqual({ d: 4, v: 1 });
    expect(firstStale?.dist[1]).toBe(3);
  });

  it('keeps the heap ordered in every frame', () => {
    for (const f of dijkstraTrace({ ids: IDS, edges: EDGES, source: 3 })) {
      f.heap.forEach((e, i) => {
        if (i > 0) expect(f.heap[(i - 1) >> 1].d).toBeLessThanOrEqual(e.d);
      });
    }
  });

  it('leaves unreachable vertices at ∞ and handles one vertex', () => {
    const last = dijkstraTrace({
      ids: [0, 1, 2],
      edges: [{ from: 0, to: 1, weight: 0 }],
      source: 0,
    }).at(-1);
    expect(last?.dist).toEqual([0, 0, Infinity]);
    const one = dijkstraTrace({ ids: [7], edges: [], source: 0 });
    expect(one.map((f) => f.kind)).toEqual(['start', 'settle', 'done']);
    expect(dijkstraTrace({ ids: [], edges: [], source: 0 }).map((f) => f.kind)).toEqual([
      'start',
      'done',
    ]);
  });

  it('numbers vertices by sorted id and defaults weights to 1', () => {
    const last = dijkstraTrace({
      ids: [9, 4],
      edges: [{ from: 9, to: 4 }],
      source: 0,
    }).at(-1);
    expect(last?.dist).toEqual([0, 1]);
  });

  it('matches Floyd-Warshall on random graphs', () => {
    const rand = seeded(17);
    for (let t = 0; t < 60; t++) {
      const n = 1 + Math.floor(rand() * 8);
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = u + 1; v < n; v++)
          if (rand() < 0.45) edges.push({ from: u, to: v, weight: Math.floor(rand() * 12) });
      const s = Math.floor(rand() * n);
      const frames = dijkstraTrace({ ids: [...Array(n).keys()], edges, source: s });
      expect(frames.at(-1)?.dist).toEqual(oracle(n, edges, s));
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('frames do not alias', () => {
    const frames = dijkstraTrace({ ids: IDS, edges: EDGES, source: 0 });
    frames[1].dist[1] = 99;
    frames[1].heap.push({ d: 0, v: 0 });
    expect(frames[2].dist[1]).not.toBe(99);
    expect(frames[2].heap.some((e) => e.d === 0 && e.v === 0)).toBe(false);
  });
});

describe('binary heap', () => {
  it('pops entries in (distance, vertex) order', () => {
    const rand = seeded(3);
    /** @type {{d: number, v: number}[]} */
    const heap = [];
    const all = [];
    for (let i = 0; i < 30; i++) {
      const e = { d: Math.floor(rand() * 10), v: Math.floor(rand() * 5) };
      all.push(e);
      heapPush(heap, e);
    }
    const out = [];
    while (heap.length) out.push(heapPop(heap));
    expect(out).toEqual(all.toSorted((a, b) => a.d - b.d || a.v - b.v));
    expect(heapPop([])).toBeUndefined();
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = dijkstraTrace({ ids: IDS, edges: EDGES, source: 0 });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(dijkstraPseudocode.map((_, i) => i));
  });
});
