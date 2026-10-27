import { describe, expect, it } from 'vitest';
import { MAX_NODES, floydPseudocode, floydWarshallTrace, pathOf } from './floyd-warshall.js';

/** Deterministic LCG so random graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const IDS = [0, 1, 2, 3];
/** @param {number} db  Weight of D → B. */
const edgesWith = (db) => [
  { from: 0, to: 2, weight: -2 },
  { from: 2, to: 3, weight: 2 },
  { from: 3, to: 1, weight: db },
  { from: 1, to: 0, weight: 4 },
  { from: 1, to: 2, weight: 3 },
];

/**
 * Bellman-Ford from every source as an independent oracle; null when a negative cycle exists.
 * @param {number} n @param {{from: number, to: number, weight: number}[]} edges
 */
function oracle(n, edges) {
  const rows = [];
  for (let s = 0; s < n; s++) {
    const d = new Array(n).fill(Infinity);
    d[s] = 0;
    for (let r = 0; r < n - 1; r++)
      for (const e of edges) if (d[e.from] + e.weight < d[e.to]) d[e.to] = d[e.from] + e.weight;
    if (edges.some((e) => d[e.from] + e.weight < d[e.to])) return null;
    rows.push(d);
  }
  return rows;
}

describe('Floyd-Warshall', () => {
  it('finds every pair on the starting graph', () => {
    const last = floydWarshallTrace({ ids: IDS, edges: edgesWith(-1) }).at(-1);
    expect(last?.kind).toBe('done');
    expect(last?.dist).toEqual([
      [0, -1, -2, 0],
      [4, 0, 2, 4],
      [5, 1, 0, 2],
      [3, -1, 1, 0],
    ]);
    expect(last?.comparisons).toBe(64);
  });

  it('allows one more intermediate vertex per phase', () => {
    const frames = floydWarshallTrace({ ids: IDS, edges: edgesWith(-1) });
    const afterA = frames.find((f) => f.kind === 'phase' && f.k === 1);
    expect(afterA?.dist[1][2]).toBe(2);
    const first = frames.find((f) => f.kind === 'improve');
    expect([first?.k, first?.i, first?.j, first?.before, first?.via]).toEqual([0, 1, 2, 3, 2]);
  });

  it('reconstructs paths from the next matrix', () => {
    const last = floydWarshallTrace({ ids: IDS, edges: edgesWith(-1) }).at(-1);
    const next = /** @type {number[][]} */ (last?.next);
    expect(pathOf(next, 3, 0)).toEqual([3, 1, 0]);
    expect(pathOf(next, 0, 1)).toEqual([0, 2, 3, 1]);
    expect(pathOf(next, 2, 2)).toEqual([2]);
    expect(
      pathOf(
        [
          [0, -1],
          [-1, 1],
        ],
        0,
        1,
      ),
    ).toEqual([]);
  });

  it('reports a negative cycle on the diagonal', () => {
    const last = floydWarshallTrace({ ids: IDS, edges: edgesWith(-5) }).at(-1);
    expect(last?.kind).toBe('negative');
    expect(last?.negative).toEqual([0, 1, 2, 3]);
  });

  it('handles empty, single-vertex and edgeless graphs', () => {
    expect(floydWarshallTrace({ ids: [], edges: [] }).map((f) => f.kind)).toEqual([
      'start',
      'done',
    ]);
    const last = floydWarshallTrace({ ids: [3, 8], edges: [{ from: 8, to: 3 }] }).at(-1);
    expect(last?.dist).toEqual([
      [0, Infinity],
      [1, 0],
    ]);
  });

  it('keeps the lightest of parallel edges', () => {
    const last = floydWarshallTrace({
      ids: [0, 1],
      edges: [
        { from: 0, to: 1, weight: 5 },
        { from: 0, to: 1, weight: 2 },
      ],
    }).at(-1);
    expect(last?.dist[0][1]).toBe(2);
  });

  it('matches Bellman-Ford from every source on random graphs', () => {
    const rand = seeded(29);
    let negative = 0;
    for (let t = 0; t < 120; t++) {
      const n = 1 + Math.floor(rand() * MAX_NODES);
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = 0; v < n; v++)
          if (u !== v && rand() < 0.35)
            edges.push({ from: u, to: v, weight: Math.floor(rand() * 15) - 3 });
      const frames = floydWarshallTrace({ ids: [...Array(n).keys()], edges });
      const last = /** @type {import('./floyd-warshall.js').FloydFrame} */ (frames.at(-1));
      expect(frames.length).toBeLessThan(400);
      const want = oracle(n, edges);
      if (!want) {
        negative++;
        expect(last.kind).toBe('negative');
        continue;
      }
      expect(last.kind).toBe('done');
      expect(last.dist).toEqual(want);
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const p = pathOf(last.next, i, j);
          if (want[i][j] === Infinity) {
            expect(p).toEqual([]);
            continue;
          }
          let w = 0;
          for (let s = 1; s < p.length; s++)
            w += Math.min(
              ...edges.filter((e) => e.from === p[s - 1] && e.to === p[s]).map((e) => e.weight),
            );
          expect(w).toBe(want[i][j]);
        }
    }
    expect(negative).toBeGreaterThan(5);
  });

  it('frames do not alias', () => {
    const frames = floydWarshallTrace({ ids: IDS, edges: edgesWith(-1) });
    frames[0].dist[0][1] = 42;
    frames[0].next[0][1] = 42;
    expect(frames[1].dist[0][1]).toBe(Infinity);
    expect(frames[1].next[0][1]).toBe(-1);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [
      ...floydWarshallTrace({ ids: IDS, edges: edgesWith(-1) }),
      ...floydWarshallTrace({ ids: IDS, edges: edgesWith(-5) }),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(floydPseudocode.map((_, i) => i));
  });
});
