import { describe, expect, it } from 'vitest';
import {
  MAX_CAPACITY,
  MAX_NODES,
  flowNetwork,
  fordFulkersonPseudocode,
  fordFulkersonTrace,
  residualAdjacency,
} from './ford-fulkerson.js';

/** Deterministic LCG so random networks are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {[number, number, number][]} list */
const net = (list) => list.map(([from, to, weight]) => ({ from, to, weight }));

// S A B C D T: the textbook network with maximum flow 23.
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
const IDS6 = [0, 1, 2, 3, 4, 5];
// S A B T: depth-first search first takes S → A → B → T and must cancel A → B later.
const CANCEL = net([
  [0, 1, 1],
  [0, 2, 1],
  [1, 2, 1],
  [1, 3, 1],
  [2, 3, 1],
]);

/**
 * Oracle: the minimum s-t cut over every split of the vertices (equal to the maximum flow).
 * @param {number} n @param {{from: number, to: number, weight: number}[]} edges
 * @param {number} s @param {number} t
 */
function minCut(n, edges, s, t) {
  let best = Infinity;
  for (let mask = 0; mask < 1 << n; mask++) {
    if (!(mask & (1 << s)) || mask & (1 << t)) continue;
    let cut = 0;
    for (const e of edges)
      if (e.from !== e.to && mask & (1 << e.from) && !(mask & (1 << e.to))) cut += e.weight;
    best = Math.min(best, cut);
  }
  return best;
}

/**
 * Checks capacity limits and conservation of a flow.
 * @param {number} n @param {{from: number, to: number, weight: number}[]} edges
 * @param {number[]} flow @param {number} s @param {number} t
 */
function checkFlow(n, edges, flow, s, t) {
  const net = new Array(n).fill(0);
  edges.forEach((e, k) => {
    expect(flow[k]).toBeGreaterThanOrEqual(0);
    expect(flow[k]).toBeLessThanOrEqual(e.weight);
    net[e.from] -= flow[k];
    net[e.to] += flow[k];
  });
  net.forEach((x, v) => {
    if (v !== s && v !== t) expect(x).toBe(0);
  });
  return net[t];
}

describe('flow network helpers', () => {
  it('pairs every edge with its reverse arc, sorted by the far end', () => {
    const { n, list } = flowNetwork(
      [0, 1, 2],
      net([
        [0, 2, 3],
        [0, 1, 4],
        [1, 1, 2],
      ]),
    );
    expect(list).toEqual([
      { u: 0, v: 2, cap: 3, edge: 0 },
      { u: 0, v: 1, cap: 4, edge: 1 },
    ]);
    const adj = residualAdjacency(n, list);
    expect(adj[0].map((a) => a.to)).toEqual([1, 2]);
    expect(adj[2]).toEqual([{ i: 0, forward: false, from: 2, to: 0 }]);
  });
});

describe('Ford-Fulkerson', () => {
  it('finds the maximum flow of the textbook network, cancelling flow once', () => {
    const frames = fordFulkersonTrace({ ids: IDS6, edges: CLASSIC, source: 0, sink: 5 });
    const last = frames.at(-1);
    expect(last?.kind).toBe('done');
    expect(last?.value).toBe(23);
    expect(last?.augmentations).toBe(4);
    expect(last?.flow).toEqual([12, 11, 0, 12, 0, 11, 7, 19, 4]);
    const paths = frames.filter((f) => f.kind === 'path');
    expect(paths.map((f) => f.bottleneck)).toEqual([4, 8, 4, 7]);
    expect(paths[2].path.map((a) => [a.from, a.to, a.forward])).toEqual([
      [0, 2, true],
      [2, 3, false],
      [3, 5, true],
    ]);
    expect(frames.find((f) => f.kind === 'none')?.seen).toEqual([0, 1, 2, 4]);
    expect(last?.checks).toBe(67);
  });

  it('undoes a bad first choice through a backward arc', () => {
    const frames = fordFulkersonTrace({ ids: [0, 1, 2, 3], edges: CANCEL, source: 0, sink: 3 });
    const paths = frames.filter((f) => f.kind === 'path');
    expect(paths.map((f) => f.path.map((a) => a.to))).toEqual([
      [1, 2, 3],
      [2, 1, 3],
    ]);
    expect(paths[1].path[1].forward).toBe(false);
    expect(frames.at(-1)?.flow).toEqual([1, 1, 0, 1, 1]);
    expect(frames.at(-1)?.value).toBe(2);
  });

  it('handles no path, a missing sink and a source equal to the sink', () => {
    const none = fordFulkersonTrace({
      ids: [0, 1, 2],
      edges: net([[1, 2, 5]]),
      source: 0,
      sink: 2,
    });
    expect(none.map((f) => f.kind)).toEqual(['start', 'none', 'done']);
    expect(none.at(-1)?.value).toBe(0);
    const same = fordFulkersonTrace({ ids: [0, 1], edges: net([[0, 1, 5]]), source: 1, sink: 1 });
    expect(same.map((f) => f.kind)).toEqual(['start', 'done']);
    const lone = fordFulkersonTrace({ ids: [4], edges: [], source: 0, sink: 3 });
    expect(lone.map((f) => f.kind)).toEqual(['start', 'done']);
  });

  it('agrees with the minimum cut on random networks and keeps a valid flow', () => {
    const rand = seeded(29);
    for (let t = 0; t < 150; t++) {
      const n = 2 + Math.floor(rand() * (MAX_NODES - 1));
      /** @type {{from: number, to: number, weight: number}[]} */
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = 0; v < n; v++)
          if (u !== v && rand() < 0.4)
            edges.push({ from: u, to: v, weight: 1 + Math.floor(rand() * MAX_CAPACITY) });
      const ids = [...Array(n).keys()];
      const frames = fordFulkersonTrace({ ids, edges, source: 0, sink: n - 1 });
      const last = /** @type {import('./ford-fulkerson.js').FordFulkersonFrame} */ (frames.at(-1));
      expect(last.value).toBe(minCut(n, edges, 0, n - 1));
      expect(checkFlow(n, edges, last.flow, 0, n - 1)).toBe(last.value);
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('stays under 400 frames on a dense network at the caps', () => {
    /** @type {{from: number, to: number, weight: number}[]} */
    const edges = [];
    for (let u = 0; u < MAX_NODES; u++)
      for (let v = 0; v < MAX_NODES; v++)
        if (u !== v) edges.push({ from: u, to: v, weight: MAX_CAPACITY });
    const ids = [...Array(MAX_NODES).keys()];
    const frames = fordFulkersonTrace({ ids, edges, source: 0, sink: MAX_NODES - 1 });
    expect(frames.at(-1)?.value).toBe((MAX_NODES - 1) * MAX_CAPACITY);
    expect(frames.length).toBeLessThan(400);
  });

  it('frames do not alias', () => {
    const frames = fordFulkersonTrace({ ids: IDS6, edges: CLASSIC, source: 0, sink: 5 });
    frames[1].flow[0] = 99;
    frames[1].seen[0] = 99;
    frames[1].path[0].to = 99;
    expect(frames[2].flow[0]).not.toBe(99);
    expect(frames[2].seen[0]).toBe(0);
    expect(frames[2].path[0].to).not.toBe(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = fordFulkersonTrace({ ids: IDS6, edges: CLASSIC, source: 0, sink: 5 });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(fordFulkersonPseudocode.map((_, i) => i));
  });
});
