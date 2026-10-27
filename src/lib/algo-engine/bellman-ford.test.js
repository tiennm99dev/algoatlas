import { describe, expect, it } from 'vitest';
import { MAX_NODES, bellmanFordPseudocode, bellmanFordTrace, cycleFrom } from './bellman-ford.js';

/** Deterministic LCG so random graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

// S A B C D, listed in an order that needs more than one round.
const IDS = [0, 1, 2, 3, 4];
/** @param {number} da  Weight of D → A. */
const edgesWith = (da) => [
  { from: 3, to: 4, weight: 3 },
  { from: 2, to: 3, weight: -2 },
  { from: 1, to: 2, weight: 2 },
  { from: 0, to: 1, weight: 6 },
  { from: 0, to: 2, weight: 7 },
  { from: 1, to: 3, weight: 5 },
  { from: 2, to: 4, weight: -3 },
  { from: 4, to: 1, weight: da },
];

/**
 * Floyd-Warshall oracle: distances from s, and whether a negative cycle is reachable from s.
 * @param {number} n @param {{from: number, to: number, weight: number}[]} edges @param {number} s
 */
function oracle(n, edges, s) {
  const d = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)),
  );
  for (const e of edges) d[e.from][e.to] = Math.min(d[e.from][e.to], e.weight);
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  const negative = d[s].some((x, v) => x < Infinity && d[v][v] < 0);
  return { dist: d[s], negative };
}

describe('Bellman-Ford', () => {
  it('stops early after a round with no change', () => {
    const frames = bellmanFordTrace({ ids: IDS, edges: edgesWith(4), source: 0 });
    const last = frames.at(-1);
    expect(last?.kind).toBe('done');
    expect(last?.dist).toEqual([0, 6, 7, 5, 4]);
    expect(last?.parent).toEqual([-1, 0, 0, 2, 2]);
    expect(frames.find((f) => f.kind === 'early')?.round).toBe(3);
    expect(last?.table).toEqual([
      [0, Infinity, Infinity, Infinity, Infinity],
      [0, 6, 7, 11, 4],
      [0, 6, 7, 5, 4],
      [0, 6, 7, 5, 4],
    ]);
    expect(last?.relaxations).toBe(24);
    expect(last?.updates).toBe(5);
  });

  it('needs fewer rounds when the edges come in a good order', () => {
    const good = [3, 4, 2, 5, 1, 6, 0, 7].map((k) => edgesWith(4)[k]);
    const frames = bellmanFordTrace({ ids: IDS, edges: good, source: 0 });
    expect(frames.find((f) => f.kind === 'early')?.round).toBe(2);
    expect(frames.at(-1)?.dist).toEqual([0, 6, 7, 5, 4]);
  });

  it('flags a negative cycle in round V and names it', () => {
    const frames = bellmanFordTrace({ ids: IDS, edges: edgesWith(-1), source: 0 });
    const last = frames.at(-1);
    expect(last?.kind).toBe('cycle');
    expect(last?.round).toBe(5);
    expect(last?.edge).toBe(1);
    expect(last?.cycle).toEqual([1, 2, 4]);
    expect(last?.table).toHaveLength(6);
    expect(last?.table[4]).toEqual([0, -3, 1, 1, -2]);
  });

  it('runs the round-V check and passes when the last round still changed', () => {
    // A chain listed backwards needs all V − 1 rounds.
    const edges = [
      { from: 2, to: 3, weight: 1 },
      { from: 1, to: 2, weight: 1 },
      { from: 0, to: 1, weight: 1 },
    ];
    const frames = bellmanFordTrace({ ids: [0, 1, 2, 3], edges, source: 0 });
    expect(frames.some((f) => f.kind === 'early')).toBe(false);
    expect(frames.filter((f) => f.kind === 'ok')).toHaveLength(3);
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.at(-1)?.dist).toEqual([0, 1, 2, 3]);
  });

  it('handles a lone vertex, unreachable vertices and default weights', () => {
    expect(bellmanFordTrace({ ids: [4], edges: [], source: 0 }).at(-1)?.kind).toBe('done');
    const last = bellmanFordTrace({
      ids: [5, 9, 7],
      edges: [{ from: 5, to: 7 }],
      source: 0,
    }).at(-1);
    expect(last?.dist).toEqual([0, 1, Infinity]);
  });

  it('agrees with Floyd-Warshall on random graphs', () => {
    const rand = seeded(13);
    let cycles = 0;
    for (let t = 0; t < 120; t++) {
      const n = 1 + Math.floor(rand() * MAX_NODES);
      /** @type {{from: number, to: number, weight: number}[]} */
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = 0; v < n; v++)
          if (u !== v && rand() < 0.3)
            edges.push({ from: u, to: v, weight: Math.floor(rand() * 14) - 4 });
      const s = Math.floor(rand() * n);
      const frames = bellmanFordTrace({ ids: [...Array(n).keys()], edges, source: s });
      const last = /** @type {import('./bellman-ford.js').BellmanFordFrame} */ (frames.at(-1));
      const want = oracle(n, edges, s);
      expect(frames.length).toBeLessThan(400);
      if (want.negative) {
        cycles++;
        expect(last.kind).toBe('cycle');
        // The reported cycle is a real cycle of edges with negative total weight.
        let total = 0;
        last.cycle.forEach((a, i) => {
          const b = last.cycle[(i + 1) % last.cycle.length];
          const w = Math.min(
            ...edges.filter((e) => e.from === a && e.to === b).map((e) => e.weight),
          );
          expect(Number.isFinite(w)).toBe(true);
          total += w;
        });
        expect(total).toBeLessThan(0);
      } else {
        expect(last.kind).toBe('done');
        expect(last.dist).toEqual(want.dist);
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
    const frames = bellmanFordTrace({ ids: [...Array(MAX_NODES).keys()], edges, source: 0 });
    expect(frames.length).toBeLessThan(400);
  });

  it('frames do not alias', () => {
    const frames = bellmanFordTrace({ ids: IDS, edges: edgesWith(4), source: 0 });
    frames[2].table[1][1] = 99;
    frames[2].dist[0] = 99;
    expect(frames[3].table[1][1]).not.toBe(99);
    expect(frames[3].dist[0]).toBe(0);
  });
});

describe('cycle walk', () => {
  it('lands on the cycle and lists it in edge order', () => {
    // 0 → 1 → 2 → 3 → 1: parent links point backwards along the edges.
    expect(cycleFrom([-1, 3, 1, 2], 2, 4)).toEqual([1, 2, 3]);
    expect(cycleFrom([-1, 0], 1, 2)).toEqual([]);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [
      ...bellmanFordTrace({ ids: IDS, edges: edgesWith(4), source: 0 }),
      ...bellmanFordTrace({ ids: IDS, edges: edgesWith(-1), source: 0 }),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(bellmanFordPseudocode.map((_, i) => i));
  });
});
