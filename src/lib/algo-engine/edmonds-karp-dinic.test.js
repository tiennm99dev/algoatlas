import { describe, expect, it } from 'vitest';
import {
  MAX_CAPACITY,
  MAX_NODES,
  dinicPseudocode,
  edmondsKarpPseudocode,
  phaseFlowTrace,
} from './edmonds-karp-dinic.js';

/** Deterministic LCG so random networks are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {[number, number, number][]} list */
const net = (list) => list.map(([from, to, weight]) => ({ from, to, weight }));
/** @param {number} n */
const range = (n) => [...Array(n).keys()];

const CLASSIC = net([
  [0, 1, 16],
  [0, 2, 13],
  [2, 1, 4],
  [1, 3, 12],
  [3, 2, 9],
  [2, 4, 14],
  [4, 3, 7],
  [3, 5, 20],
  [4, 5, 4],
]);
const LAYERS = net([
  [0, 1, 4],
  [0, 2, 3],
  [0, 3, 5],
  [1, 4, 3],
  [2, 4, 2],
  [2, 5, 2],
  [3, 5, 4],
  [4, 6, 6],
  [5, 6, 4],
  [1, 2, 2],
]);

/**
 * Oracle: the minimum s-t cut over every split of the vertices.
 * @param {number} n @param {{from: number, to: number, weight: number}[]} edges
 * @param {number} s @param {number} t
 */
function minCut(n, edges, s, t) {
  let best = Infinity;
  for (let mask = 0; mask < 1 << n; mask++) {
    if (!(mask & (1 << s)) || mask & (1 << t)) continue;
    let cut = 0;
    for (const e of edges) if (mask & (1 << e.from) && !(mask & (1 << e.to))) cut += e.weight;
    best = Math.min(best, cut);
  }
  return best;
}

/**
 * Whether t can be reached from s through arcs with room that go up one level.
 * @param {number} n @param {{from: number, to: number, weight: number}[]} edges
 * @param {number[]} flow @param {number[]} level @param {number} s @param {number} t
 */
function levelPathExists(n, edges, flow, level, s, t) {
  const seen = new Array(n).fill(false);
  const stack = [s];
  seen[s] = true;
  while (stack.length) {
    const u = /** @type {number} */ (stack.pop());
    edges.forEach((e, k) => {
      /** @type {[number, number, number][]} */
      const arcs = [
        [e.from, e.to, e.weight - flow[k]],
        [e.to, e.from, flow[k]],
      ];
      for (const [a, b, room] of arcs)
        if (a === u && room > 0 && level[b] === level[a] + 1 && !seen[b]) {
          seen[b] = true;
          stack.push(b);
        }
    });
  }
  return seen[t];
}

describe('Edmonds-Karp', () => {
  it('augments along shortest paths on the textbook network', () => {
    const frames = phaseFlowTrace({
      ids: range(6),
      edges: CLASSIC,
      source: 0,
      sink: 5,
      method: 'ek',
    });
    const bfs = frames.filter((f) => f.kind === 'bfs');
    expect(bfs.map((f) => f.path.map((a) => a.to))).toEqual([
      [1, 3, 5],
      [2, 4, 5],
      [2, 4, 3, 5],
    ]);
    expect(bfs.map((f) => f.bottleneck)).toEqual([12, 4, 7]);
    const last = frames.at(-1);
    expect(last?.value).toBe(23);
    expect(last?.searches).toBe(4);
    expect(last?.augmentations).toBe(3);
    expect(last?.checks).toBe(66);
  });

  it('never uses the middle edge of the zigzag network', () => {
    const edges = net([
      [0, 1, 20],
      [0, 2, 20],
      [1, 2, 1],
      [1, 3, 20],
      [2, 3, 20],
    ]);
    const frames = phaseFlowTrace({ ids: range(4), edges, source: 0, sink: 3, method: 'ek' });
    expect(frames.at(-1)?.augmentations).toBe(2);
    expect(frames.at(-1)?.flow).toEqual([20, 20, 0, 20, 20]);
  });
});

describe('Dinic', () => {
  it('needs two phases on the textbook network', () => {
    const frames = phaseFlowTrace({
      ids: range(6),
      edges: CLASSIC,
      source: 0,
      sink: 5,
      method: 'dinic',
    });
    const phases = frames.filter((f) => f.kind === 'bfs');
    expect(phases.map((f) => f.level)).toEqual([
      [0, 1, 1, 2, 2, 3],
      [0, 1, 1, 3, 2, 4],
    ]);
    expect(frames.filter((f) => f.kind === 'blocked').map((f) => f.phaseFlow)).toEqual([16, 7]);
    expect(frames.filter((f) => f.kind === 'dead').map((f) => f.at)).toEqual([1, 4, 2, 1, 4, 2]);
    const last = frames.at(-1);
    expect(last?.value).toBe(23);
    expect(last?.searches).toBe(3);
    expect(last?.dead).toEqual([]);
  });

  it('pushes every shortest path of a layered network in one phase', () => {
    const ek = phaseFlowTrace({ ids: range(7), edges: LAYERS, source: 0, sink: 6, method: 'ek' });
    const dinic = phaseFlowTrace({
      ids: range(7),
      edges: LAYERS,
      source: 0,
      sink: 6,
      method: 'dinic',
    });
    expect(ek.at(-1)?.value).toBe(9);
    expect(dinic.at(-1)?.value).toBe(9);
    expect(ek.at(-1)?.searches).toBe(5);
    expect(dinic.at(-1)?.searches).toBe(2);
    expect(dinic.at(-1)?.checks).toBe(63);
  });

  it('handles an unreachable sink and equal ends', () => {
    const none = phaseFlowTrace({
      ids: range(3),
      edges: net([[1, 2, 4]]),
      source: 0,
      sink: 2,
      method: 'dinic',
    });
    expect(none.map((f) => f.kind)).toEqual(['start', 'none', 'done']);
    const same = phaseFlowTrace({ ids: range(2), edges: [], source: 0, sink: 0, method: 'ek' });
    expect(same.map((f) => f.kind)).toEqual(['start', 'done']);
  });
});

describe('both methods', () => {
  it('match the minimum cut, keep path lengths rising and block every phase', () => {
    const rand = seeded(41);
    for (let t = 0; t < 150; t++) {
      const n = 2 + Math.floor(rand() * (MAX_NODES - 1));
      /** @type {{from: number, to: number, weight: number}[]} */
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = 0; v < n; v++)
          if (u !== v && rand() < 0.4)
            edges.push({ from: u, to: v, weight: 1 + Math.floor(rand() * MAX_CAPACITY) });
      const want = minCut(n, edges, 0, n - 1);
      const input = { ids: range(n), edges, source: 0, sink: n - 1 };
      const ek = phaseFlowTrace({ ...input, method: 'ek' });
      const dinic = phaseFlowTrace({ ...input, method: 'dinic' });
      expect(ek.at(-1)?.value).toBe(want);
      expect(dinic.at(-1)?.value).toBe(want);
      expect(ek.length).toBeLessThan(400);
      expect(dinic.length).toBeLessThan(400);
      const lengths = ek.filter((f) => f.kind === 'bfs').map((f) => f.path.length);
      expect(lengths).toEqual(lengths.toSorted((a, b) => a - b));
      const depths = dinic.filter((f) => f.kind === 'bfs').map((f) => f.level[n - 1]);
      for (let i = 1; i < depths.length; i++) expect(depths[i]).toBeGreaterThan(depths[i - 1]);
      expect(depths.length).toBeLessThanOrEqual(n - 1);
      for (const f of dinic.filter((x) => x.kind === 'blocked'))
        expect(levelPathExists(n, edges, f.flow, f.level, 0, n - 1)).toBe(false);
    }
  });

  it('stay under 400 frames on a dense network at the caps', () => {
    /** @type {{from: number, to: number, weight: number}[]} */
    const edges = [];
    for (let u = 0; u < MAX_NODES; u++)
      for (let v = 0; v < MAX_NODES; v++)
        if (u !== v) edges.push({ from: u, to: v, weight: 1 + ((u * 7 + v * 3) % MAX_CAPACITY) });
    for (const method of /** @type {const} */ (['ek', 'dinic'])) {
      const frames = phaseFlowTrace({
        ids: range(MAX_NODES),
        edges,
        source: 0,
        sink: MAX_NODES - 1,
        method,
      });
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('frames do not alias', () => {
    const frames = phaseFlowTrace({
      ids: range(6),
      edges: CLASSIC,
      source: 0,
      sink: 5,
      method: 'dinic',
    });
    frames[1].level[0] = 99;
    frames[1].flow[0] = 99;
    frames[2].path[0].to = 99;
    expect(frames[2].level[0]).toBe(0);
    expect(frames[2].flow[0]).not.toBe(99);
    expect(frames[3].path[0].to).not.toBe(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every Edmonds-Karp line', () => {
    const frames = phaseFlowTrace({
      ids: range(6),
      edges: CLASSIC,
      source: 0,
      sink: 5,
      method: 'ek',
    });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(edmondsKarpPseudocode.map((_, i) => i));
  });

  it('highlights every Dinic line', () => {
    const frames = phaseFlowTrace({
      ids: range(6),
      edges: CLASSIC,
      source: 0,
      sink: 5,
      method: 'dinic',
    });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(dinicPseudocode.map((_, i) => i));
  });
});
