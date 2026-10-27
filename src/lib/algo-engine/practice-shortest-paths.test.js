import { describe, expect, it } from 'vitest';
import {
  ALGOS,
  MAX_NODES,
  SCENARIOS,
  judge,
  pseudocode,
  recommend,
  shortestPathTrace,
} from './practice-shortest-paths.js';

/** Deterministic LCG so random graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {keyof typeof SCENARIOS} key */
const inputOf = (key) => ({
  ids: SCENARIOS[key].nodes.map((n) => n.id),
  edges: SCENARIOS[key].edges,
  source: SCENARIOS[key].source,
});

/**
 * Floyd-Warshall oracle: distances from s and whether a negative cycle is reachable from s.
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
  return { dist: d[s], negative: d[s].some((x, v) => x < Infinity && d[v][v] < 0) };
}

/** Fewest edges from s to every vertex, by plain BFS. @param {number} n @param {{from: number, to: number}[]} edges @param {number} s */
function hopOracle(n, edges, s) {
  const hops = new Array(n).fill(-1);
  hops[s] = 0;
  const queue = [s];
  while (queue.length) {
    const u = /** @type {number} */ (queue.shift());
    for (const e of edges)
      if (e.from === u && hops[e.to] < 0) ((hops[e.to] = hops[u] + 1), queue.push(e.to));
  }
  return hops;
}

/** @param {number} n @param {() => number} rand @param {number} lo @param {number} hi */
function randomGraph(n, rand, lo, hi) {
  /** @type {{from: number, to: number, weight: number}[]} */
  const edges = [];
  for (let u = 0; u < n; u++)
    for (let v = 0; v < n; v++)
      if (u !== v && rand() < 0.3)
        edges.push({ from: u, to: v, weight: lo + Math.floor(rand() * (hi - lo + 1)) });
  return edges;
}

describe('the three algorithms', () => {
  it('Bellman-Ford agrees with Floyd-Warshall, negative weights and cycles included', () => {
    const rand = seeded(3);
    let cycles = 0;
    for (let t = 0; t < 120; t++) {
      const n = 1 + Math.floor(rand() * MAX_NODES);
      const edges = randomGraph(n, rand, -4, 9);
      const s = Math.floor(rand() * n);
      const last = shortestPathTrace({
        ids: [...Array(n).keys()],
        edges,
        source: s,
        algo: 'bellman-ford',
      }).at(-1);
      const want = oracle(n, edges, s);
      if (want.negative) {
        cycles++;
        expect(last?.cycle.length).toBeGreaterThan(1);
      } else {
        expect(last?.cycle).toEqual([]);
        expect(last?.dist).toEqual(want.dist);
      }
    }
    expect(cycles).toBeGreaterThan(5);
  });

  it('Dijkstra agrees with Floyd-Warshall when no weight is negative', () => {
    const rand = seeded(5);
    for (let t = 0; t < 100; t++) {
      const n = 1 + Math.floor(rand() * MAX_NODES);
      const edges = randomGraph(n, rand, 0, 9);
      const s = Math.floor(rand() * n);
      const last = shortestPathTrace({
        ids: [...Array(n).keys()],
        edges,
        source: s,
        algo: 'dijkstra',
      }).at(-1);
      expect(last?.dist).toEqual(oracle(n, edges, s).dist);
    }
  });

  it('BFS finds the fewest edges, and is exact when every weight is equal', () => {
    const rand = seeded(7);
    for (let t = 0; t < 80; t++) {
      const n = 1 + Math.floor(rand() * MAX_NODES);
      const edges = randomGraph(n, rand, 3, 3);
      const s = Math.floor(rand() * n);
      const last = shortestPathTrace({
        ids: [...Array(n).keys()],
        edges,
        source: s,
        algo: 'bfs',
      }).at(-1);
      expect(last?.hops).toEqual(hopOracle(n, edges, s));
      expect(last?.dist).toEqual(oracle(n, edges, s).dist);
    }
  });

  it('stays under 400 frames on a complete graph at the size cap', () => {
    const rand = seeded(9);
    /** @type {{from: number, to: number, weight: number}[]} */
    const edges = [];
    for (let u = 0; u < MAX_NODES; u++)
      for (let v = 0; v < MAX_NODES; v++)
        if (u !== v) edges.push({ from: u, to: v, weight: Math.floor(rand() * 20) - 2 });
    for (const algo of ALGOS) {
      const frames = shortestPathTrace({
        ids: [...Array(MAX_NODES).keys()],
        edges,
        source: 0,
        algo,
      });
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('handles an empty graph and a lone vertex', () => {
    for (const algo of ALGOS) {
      expect(shortestPathTrace({ ids: [], edges: [], source: 0, algo }).at(-1)?.kind).toBe('done');
      expect(shortestPathTrace({ ids: [4], edges: [], source: 0, algo }).at(-1)?.dist).toEqual([0]);
    }
  });

  it('frames do not alias', () => {
    for (const algo of ALGOS) {
      const frames = shortestPathTrace({ ...inputOf('roads'), algo });
      frames[1].dist[0] = 99;
      frames[1].frontier.push({ v: 9, d: 9 });
      frames[1].settled.push(9);
      expect(frames[2].dist[0]).toBe(0);
      expect(frames[2].frontier.some((x) => x.v === 9)).toBe(false);
      expect(frames[2].settled).not.toContain(9);
    }
  });
});

describe('scenarios', () => {
  it('recommends BFS, Dijkstra, Bellman-Ford and Bellman-Ford', () => {
    expect(recommend(inputOf('moves'))).toBe('bfs');
    expect(recommend(inputOf('roads'))).toBe('dijkstra');
    expect(recommend(inputOf('cashback'))).toBe('bellman-ford');
    expect(recommend(inputOf('arbitrage'))).toBe('bellman-ford');
  });

  it('reaches 10 from 1 in 4 moves', () => {
    const last = shortestPathTrace({ ...inputOf('moves'), algo: 'bfs' }).at(-1);
    expect(last?.dist[9]).toBe(4);
  });

  it('judges every algorithm on every scenario', () => {
    /** @param {keyof typeof SCENARIOS} key */
    const verdicts = (key) =>
      ALGOS.map((a) => judge(inputOf(key), a, SCENARIOS[key].target).verdict);
    expect(verdicts('moves')).toEqual(['best', 'works', 'works']);
    expect(verdicts('roads')).toEqual(['wrong', 'best', 'works']);
    expect(verdicts('cashback')).toEqual(['wrong', 'wrong', 'best']);
    expect(verdicts('arbitrage')).toEqual(['wrong', 'wrong', 'best']);
  });

  it('shows how each wrong pick goes wrong', () => {
    const roads = judge(inputOf('roads'), 'bfs', 5);
    expect([roads.got[5], roads.truth[5]]).toEqual([12, 8]);
    const cash = judge(inputOf('cashback'), 'dijkstra', 4);
    expect([cash.got[4], cash.truth[4]]).toEqual([7, 6]);
    expect(judge(inputOf('arbitrage'), 'dijkstra', 4).negativeCycle).toBe(true);
    const cycle = shortestPathTrace({ ...inputOf('arbitrage'), algo: 'bellman-ford' }).at(-1);
    expect(cycle?.cycle).toEqual([1, 2, 3]);
  });

  it('counts the edges each algorithm looks at', () => {
    expect(ALGOS.map((a) => judge(inputOf('roads'), a, 5).checks)).toEqual([8, 8, 16]);
  });

  it('calls a right answer without a guarantee lucky', () => {
    // A negative edge that Dijkstra happens to handle: it reaches B before settling it.
    const input = {
      ids: [0, 1, 2],
      edges: [
        { from: 0, to: 1, weight: 5 },
        { from: 1, to: 2, weight: -1 },
      ],
      source: 0,
    };
    expect(judge(input, 'dijkstra', 2).verdict).toBe('lucky');
    // Unequal weights, but the fewest-edge path to T happens to be the cheapest one.
    const direct = {
      ids: [0, 1, 2],
      edges: [
        { from: 0, to: 1, weight: 2 },
        { from: 1, to: 2, weight: 2 },
        { from: 0, to: 2, weight: 3 },
      ],
      source: 0,
    };
    expect(judge(direct, 'bfs', 2).verdict).toBe('lucky');
    expect(judge(direct, 'bfs', 1).verdict).toBe('lucky');
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line of every algorithm', () => {
    for (const algo of ALGOS) {
      const frames = [
        ...shortestPathTrace({ ...inputOf('roads'), algo }),
        ...shortestPathTrace({ ...inputOf('arbitrage'), algo }),
        ...shortestPathTrace({ ...inputOf('moves'), algo }),
      ];
      const seen = new Set(frames.flatMap((f) => f.lines));
      expect(
        [...seen].sort((a, b) => a - b),
        algo,
      ).toEqual(pseudocode[algo].map((_, i) => i));
    }
  });
});
