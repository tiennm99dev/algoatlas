import { describe, expect, it } from 'vitest';
import { MAX_NODES, johnsonPseudocode, johnsonTrace } from './johnson-algorithm.js';

/** Deterministic LCG so random graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const IDS = [0, 1, 2, 3, 4];
/**
 * The five-vertex example with negative edges; `dc` is the weight of D → C.
 * @param {number} dc
 */
const edgesWith = (dc) =>
  [
    [0, 1, 3],
    [0, 2, 8],
    [0, 4, -4],
    [1, 3, 1],
    [1, 4, 7],
    [2, 1, 4],
    [3, 0, 2],
    [3, 2, dc],
    [4, 3, 6],
  ].map(([from, to, weight]) => ({ from, to, weight }));

/**
 * Floyd-Warshall oracle: the distance matrix and whether any negative cycle exists.
 * @param {number} n @param {{from: number, to: number, weight: number}[]} edges
 */
function oracle(n, edges) {
  const d = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)),
  );
  for (const e of edges) d[e.from][e.to] = Math.min(d[e.from][e.to], e.weight);
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return { dist: d, negative: d.some((row, i) => row[i] < 0) };
}

/** @param {import('./johnson-algorithm.js').JohnsonFrame[]} frames */
const last = (frames) =>
  /** @type {import('./johnson-algorithm.js').JohnsonFrame} */ (frames.at(-1));

describe("Johnson's algorithm", () => {
  it('finds the potentials, the reweighted edges and every distance', () => {
    const frames = johnsonTrace({ ids: IDS, edges: edgesWith(-5) });
    const end = last(frames);
    expect(frames[0].kind).toBe('start');
    expect(end.kind).toBe('done');
    expect(end.h).toEqual([0, -1, -5, 0, -4]);
    expect(end.reweighted).toEqual([4, 13, 0, 0, 10, 0, 2, 0, 2]);
    expect(end.matrix).toEqual([
      [0, 1, -3, 2, -4],
      [3, 0, -4, 1, -1],
      [7, 4, 0, 5, 3],
      [2, -1, -5, 0, -2],
      [8, 5, 1, 6, 0],
    ]);
    expect(frames.find((f) => f.kind === 'bf-early')?.round).toBe(3);
  });

  it('counts the edge checks of both phases', () => {
    const end = last(johnsonTrace({ ids: IDS, edges: edgesWith(-5) }));
    // Three Bellman-Ford rounds over 5 edges from q plus the 9 edges of the graph.
    expect(end.bfChecks).toBe(3 * (5 + 9));
    // Each Dijkstra run checks every edge whose tail it settles; all vertices are reachable.
    expect(end.dijkstraChecks).toBe(5 * 9);
  });

  it('makes every reweighted edge non-negative', () => {
    const rand = seeded(5);
    for (let t = 0; t < 60; t++) {
      const n = 2 + Math.floor(rand() * (MAX_NODES - 1));
      /** @type {{from: number, to: number, weight: number}[]} */
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = u + 1; v < n; v++)
          if (rand() < 0.5) edges.push({ from: u, to: v, weight: Math.floor(rand() * 20) - 10 });
      const end = last(johnsonTrace({ ids: [...Array(n).keys()], edges }));
      expect(end.kind).toBe('done');
      for (const w of end.reweighted) expect(w).toBeGreaterThanOrEqual(0);
    }
  });

  it('stops at a negative cycle and names it', () => {
    const frames = johnsonTrace({ ids: IDS, edges: edgesWith(-6) });
    const cycle = frames.at(-2);
    expect(cycle?.kind).toBe('cycle');
    expect(cycle?.cycle).toEqual([1, 3, 2]);
    expect(last(frames).kind).toBe('done');
    expect(
      last(frames)
        .matrix.flat()
        .every((x) => x === null),
    ).toBe(true);
    expect(frames.some((f) => f.kind === 'reweight')).toBe(false);
  });

  it('leaves non-negative weights unchanged', () => {
    const edges = edgesWith(5).map((e) => ({ ...e, weight: Math.abs(e.weight) }));
    const end = last(johnsonTrace({ ids: IDS, edges }));
    expect(end.h).toEqual([0, 0, 0, 0, 0]);
    expect(end.reweighted).toEqual(edges.map((e) => e.weight));
  });

  it('handles an empty graph, a lone vertex and unreachable pairs', () => {
    expect(last(johnsonTrace({ ids: [], edges: [] })).kind).toBe('done');
    expect(last(johnsonTrace({ ids: [3], edges: [] })).matrix).toEqual([[0]]);
    const end = last(johnsonTrace({ ids: [5, 9, 7], edges: [{ from: 5, to: 7 }] }));
    expect(end.matrix).toEqual([
      [0, 1, Infinity],
      [Infinity, 0, Infinity],
      [Infinity, Infinity, 0],
    ]);
  });

  it('agrees with Floyd-Warshall on random graphs', () => {
    const rand = seeded(17);
    let cycles = 0;
    for (let t = 0; t < 150; t++) {
      const n = 1 + Math.floor(rand() * MAX_NODES);
      /** @type {{from: number, to: number, weight: number}[]} */
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = 0; v < n; v++)
          if (u !== v && rand() < 0.35)
            edges.push({ from: u, to: v, weight: Math.floor(rand() * 16) - 4 });
      const frames = johnsonTrace({ ids: [...Array(n).keys()], edges });
      const want = oracle(n, edges);
      expect(frames.length).toBeLessThan(400);
      if (want.negative) {
        cycles++;
        const found = /** @type {import('./johnson-algorithm.js').JohnsonFrame} */ (
          frames.find((f) => f.kind === 'cycle')
        );
        let total = 0;
        found.cycle.forEach((a, i) => {
          const b = found.cycle[(i + 1) % found.cycle.length];
          const w = Math.min(
            ...edges.filter((e) => e.from === a && e.to === b).map((e) => e.weight),
          );
          expect(Number.isFinite(w)).toBe(true);
          total += w;
        });
        expect(total).toBeLessThan(0);
      } else {
        expect(last(frames).matrix).toEqual(want.dist);
      }
    }
    expect(cycles).toBeGreaterThan(5);
  });

  it('stays under 400 frames on a complete graph at the size cap', () => {
    /** @type {{from: number, to: number, weight: number}[]} */
    const edges = [];
    for (let u = 0; u < MAX_NODES; u++)
      for (let v = 0; v < MAX_NODES; v++)
        if (u !== v) edges.push({ from: u, to: v, weight: v > u ? -1 : 50 });
    const frames = johnsonTrace({ ids: [...Array(MAX_NODES).keys()], edges });
    expect(last(frames).kind).toBe('done');
    expect(frames.length).toBeLessThan(400);
  });

  it('frames do not alias', () => {
    const frames = johnsonTrace({ ids: IDS, edges: edgesWith(-5) });
    const i = frames.findIndex((f) => f.kind === 'row');
    frames[i].matrix[0][1] = 99;
    frames[i].h[1] = 99;
    frames[i].dPrime[0] = 99;
    frames[i].reweighted[0] = 99;
    expect(frames[i + 1].matrix[0][1]).toBe(1);
    expect(frames[i + 1].h[1]).toBe(-1);
    expect(frames[i + 1].dPrime[0]).not.toBe(99);
    expect(frames[i + 1].reweighted[0]).toBe(4);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [
      ...johnsonTrace({ ids: IDS, edges: edgesWith(-5) }),
      ...johnsonTrace({ ids: IDS, edges: edgesWith(-6) }),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(johnsonPseudocode.map((_, i) => i));
  });
});
