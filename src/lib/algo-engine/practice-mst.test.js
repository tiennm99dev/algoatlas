import { describe, expect, it } from 'vitest';
import {
  bottleneckPseudocode,
  bottleneckTrace,
  judgeTree,
  minimumTree,
  secondBestPseudocode,
  secondBestTrace,
} from './practice-mst.js';

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
const MST = [8, 2, 0, 3, 6];

/**
 * Every spanning tree by brute force over edge subsets: their edge sets and weights.
 * @param {number} n @param {{from: number, to: number, weight?: number}[]} edges
 */
function spanningTrees(n, edges) {
  /** @type {{edges: number[], weight: number}[]} */
  const out = [];
  for (let mask = 0; mask < 1 << edges.length; mask++) {
    const chosen = edges.map((_, k) => k).filter((k) => mask & (1 << k));
    if (chosen.length !== n - 1) continue;
    const p = [...Array(n).keys()];
    /** @param {number} x @returns {number} */
    const find = (x) => (p[x] === x ? x : (p[x] = find(p[x])));
    let ok = true;
    for (const k of chosen) {
      const a = find(edges[k].from);
      const b = find(edges[k].to);
      if (a === b) ok = false;
      p[a] = b;
    }
    if (ok)
      out.push({ edges: chosen, weight: chosen.reduce((s, k) => s + (edges[k].weight ?? 1), 0) });
  }
  return out;
}

/**
 * Smallest possible heaviest edge over all simple s → t paths, by trying every threshold.
 * @param {number} n @param {{from: number, to: number, weight?: number}[]} edges
 * @param {number} s @param {number} t
 */
function bottleneckOracle(n, edges, s, t) {
  if (s === t) return 0;
  const weights = [...new Set(edges.map((e) => e.weight ?? 1))].sort((a, b) => a - b);
  for (const limit of weights) {
    const seen = new Set([s]);
    const queue = [s];
    while (queue.length) {
      const x = /** @type {number} */ (queue.shift());
      for (const e of edges) {
        if ((e.weight ?? 1) > limit) continue;
        const y = e.from === x ? e.to : e.to === x ? e.from : -1;
        if (y >= 0 && !seen.has(y)) {
          seen.add(y);
          queue.push(y);
        }
      }
    }
    if (seen.has(t)) return limit;
  }
  return Infinity;
}

/** @param {() => number} rand */
function randomGraph(rand) {
  const n = 2 + Math.floor(rand() * 5);
  const edges = [];
  for (let u = 1; u < n; u++) edges.push({ from: Math.floor(rand() * u), to: u, weight: 1 });
  for (let u = 0; u < n; u++)
    for (let v = u + 1; v < n; v++)
      if (!edges.some((e) => e.from === u && e.to === v) && rand() < 0.4)
        edges.push({ from: u, to: v, weight: 1 });
  for (const e of edges) e.weight = 1 + Math.floor(rand() * 6);
  return { n, edges };
}

describe('minimum tree', () => {
  it('finds the MST of the starting graph and a forest when disconnected', () => {
    expect(minimumTree(IDS, EDGES)).toEqual({ tree: MST, weight: 18, components: 1 });
    expect(minimumTree([0, 1, 2], [{ from: 0, to: 1, weight: 2 }]).components).toBe(2);
  });
});

describe('judging a predicted tree', () => {
  it('accepts the MST in any order', () => {
    const v = judgeTree(IDS, EDGES, [6, 3, 0, 2, 8]);
    expect(v.kind).toBe('minimum');
    expect(v.weight).toBe(18);
  });

  it('names a cycle, a wrong size, and a lighter swap', () => {
    expect(judgeTree(IDS, EDGES, [0, 1, 2]).kind).toBe('cycle');
    expect(judgeTree(IDS, EDGES, [0, 1, 2]).closing).toBe(2);
    const few = judgeTree(IDS, EDGES, [0, 2]);
    expect([few.kind, few.count, few.need]).toEqual(['size', 2, 5]);
    const heavy = judgeTree(IDS, EDGES, [8, 2, 0, 3, 5]);
    expect(heavy).toMatchObject({ kind: 'heavier', weight: 19, best: 18, add: 6, drop: 5 });
  });

  it('refuses a disconnected graph', () => {
    expect(judgeTree([0, 1, 2], [{ from: 0, to: 1 }], [0]).kind).toBe('disconnected');
  });

  it('agrees with brute force on every spanning tree of random graphs', () => {
    const rand = seeded(7);
    for (let t = 0; t < 30; t++) {
      const { n, edges } = randomGraph(rand);
      const trees = spanningTrees(n, edges);
      const best = Math.min(...trees.map((x) => x.weight));
      for (const tree of trees) {
        const v = judgeTree([...Array(n).keys()], edges, tree.edges);
        expect(v.kind).toBe(tree.weight === best ? 'minimum' : 'heavier');
        if (v.kind === 'heavier') {
          const swapped = tree.edges.filter((k) => k !== v.drop).concat(v.add);
          const after = spanningTrees(n, edges).find(
            (x) => x.edges.length === swapped.length && swapped.every((k) => x.edges.includes(k)),
          );
          expect(after?.weight).toBeLessThan(tree.weight);
        }
      }
    }
  });
});

describe('minimum bottleneck path', () => {
  it('joins A and F at weight 7 along A, B, D, E, F', () => {
    const frames = bottleneckTrace({ ids: IDS, edges: EDGES, source: 0, target: 5 });
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'accept',
      'accept',
      'accept',
      'reject',
      'accept',
      'reject',
      'joined',
      'done',
    ]);
    const last = frames.at(-1);
    expect(last?.bottleneck).toBe(7);
    expect(last?.path).toEqual([0, 1, 3, 4, 5]);
    expect(last?.pathEdges).toEqual([0, 3, 6, 8]);
    expect(last?.considered).toBe(7);
  });

  it('beats the direct edge A — C with the route through B', () => {
    const last = bottleneckTrace({ ids: IDS, edges: EDGES, source: 0, target: 2 }).at(-1);
    expect(last?.bottleneck).toBe(3);
    expect(last?.path).toEqual([0, 1, 2]);
  });

  it('handles s = t, unreachable targets and a bad index', () => {
    expect(
      bottleneckTrace({ ids: IDS, edges: EDGES, source: 2, target: 2 }).at(-1)?.bottleneck,
    ).toBe(0);
    const cut = bottleneckTrace({
      ids: [0, 1, 2],
      edges: [{ from: 0, to: 1, weight: 4 }],
      source: 0,
      target: 2,
    }).at(-1);
    expect(cut?.bottleneck).toBe(Infinity);
    expect(cut?.path).toEqual([]);
    expect(
      bottleneckTrace({ ids: [], edges: [], source: 0, target: 0 }).map((f) => f.kind),
    ).toEqual(['start', 'done']);
  });

  it('matches a threshold search on random graphs', () => {
    const rand = seeded(13);
    for (let t = 0; t < 60; t++) {
      const { n, edges } = randomGraph(rand);
      const s = Math.floor(rand() * n);
      const g = Math.floor(rand() * n);
      const frames = bottleneckTrace({ ids: [...Array(n).keys()], edges, source: s, target: g });
      const last = frames.at(-1);
      expect(last?.bottleneck).toBe(bottleneckOracle(n, edges, s, g));
      for (const k of last?.pathEdges ?? [])
        expect(edges[k].weight).toBeLessThanOrEqual(last?.bottleneck ?? 0);
      expect(frames.length).toBeLessThan(400);
    }
  });
});

describe('second-best spanning tree', () => {
  it('swaps A — C in for A — B on the starting graph', () => {
    const frames = secondBestTrace({ ids: IDS, edges: EDGES });
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'better',
      'worse',
      'worse',
      'worse',
      'done',
    ]);
    expect(frames.slice(1, 5).map((f) => f.candidate)).toEqual([19, 19, 19, 20]);
    const last = frames.at(-1);
    expect(last).toMatchObject({ best: 19, bestAdd: 1, bestDrop: 0, mst: 18, checked: 4 });
    expect(frames[3].pathEdges).toEqual([2, 3, 6]);
    expect(frames[3].drop).toBe(6);
  });

  it('reports none for a tree and for a disconnected graph', () => {
    const tree = secondBestTrace({
      ids: [0, 1, 2],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
      ],
    });
    expect(tree.at(-1)?.best).toBe(Infinity);
    const split = secondBestTrace({ ids: [0, 1, 2], edges: [{ from: 0, to: 1 }] });
    expect(split.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(split.at(-1)?.mst).toBe(Infinity);
  });

  it('matches brute force on random graphs', () => {
    const rand = seeded(19);
    for (let t = 0; t < 60; t++) {
      const { n, edges } = randomGraph(rand);
      const last = secondBestTrace({ ids: [...Array(n).keys()], edges }).at(-1);
      const tree = /** @type {number[]} */ (last?.tree);
      const others = spanningTrees(n, edges).filter((x) => !x.edges.every((k) => tree.includes(k)));
      expect(last?.best).toBe(Math.min(Infinity, ...others.map((x) => x.weight)));
    }
  });

  it('frames do not alias', () => {
    const frames = secondBestTrace({ ids: IDS, edges: EDGES });
    frames[1].tree.push(99);
    frames[1].pathEdges.push(99);
    expect(frames[2].tree).not.toContain(99);
    expect(frames[2].pathEdges).not.toContain(99);
    const b = bottleneckTrace({ ids: IDS, edges: EDGES, source: 0, target: 5 });
    b[1].status[0] = 'cycle';
    b[1].parent[0] = 4;
    expect(b[2].status[0]).toBe('');
    expect(b[2].parent[0]).toBe(0);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of the bottleneck search', () => {
    const frames = bottleneckTrace({ ids: IDS, edges: EDGES, source: 0, target: 5 });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(bottleneckPseudocode.map((_, i) => i));
  });

  it('highlights every line of the second-best search', () => {
    const frames = secondBestTrace({ ids: IDS, edges: EDGES });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(secondBestPseudocode.map((_, i) => i));
  });
});
