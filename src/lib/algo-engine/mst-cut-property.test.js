import { describe, expect, it } from 'vitest';
import {
  cutPseudocode,
  cutTrace,
  cyclePseudocode,
  cycleTrace,
  minimumSpanningForest,
} from './mst-cut-property.js';

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
const LEFT = [true, true, true, false, false, false];

/**
 * Every spanning tree by brute force over edge subsets, as an independent oracle: returns the
 * smallest total weight and, per edge, whether some minimum spanning tree uses it.
 * @param {number} n @param {{from: number, to: number, weight?: number}[]} edges
 */
function bruteForce(n, edges) {
  let best = Infinity;
  /** @type {number[][]} */
  let trees = [];
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
    if (!ok) continue;
    const w = chosen.reduce((s, k) => s + (edges[k].weight ?? 1), 0);
    if (w < best) {
      best = w;
      trees = [chosen];
    } else if (w === best) trees.push(chosen);
  }
  const used = edges.map((_, k) => trees.some((t) => t.includes(k)));
  return { best, used };
}

/** @param {() => number} rand */
function randomGraph(rand) {
  const n = 2 + Math.floor(rand() * 5);
  const edges = [];
  for (let u = 0; u < n; u++) edges.push({ from: u, to: (u + 1) % n, weight: 1 });
  edges.length = n - 1;
  for (let u = 0; u < n; u++)
    for (let v = u + 2; v < n; v++) if (rand() < 0.5) edges.push({ from: u, to: v, weight: 1 });
  for (const e of edges) e.weight = 1 + Math.floor(rand() * 6);
  return { n, edges };
}

describe('cut scan', () => {
  it('finds the lightest edge across the starting cut', () => {
    const frames = cutTrace({ ids: IDS, edges: EDGES, side: LEFT });
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'inside',
      'inside',
      'inside',
      'best',
      'heavier',
      'heavier',
      'inside',
      'inside',
      'inside',
      'done',
    ]);
    const last = frames.at(-1);
    expect(last?.best).toBe(3);
    expect(last?.crossing).toEqual([3, 4, 5]);
    expect(last?.ties).toEqual([3]);
    expect(last?.checked).toBe(9);
  });

  it('keeps the first of tied edges and lists the ties', () => {
    const edges = [
      { from: 0, to: 1, weight: 2 },
      { from: 0, to: 2, weight: 2 },
      { from: 1, to: 2, weight: 1 },
    ];
    const last = cutTrace({ ids: [0, 1, 2], edges, side: [true, false, false] }).at(-1);
    expect(last?.best).toBe(0);
    expect(last?.ties).toEqual([0, 1]);
  });

  it('reports no crossing edge for an empty side or a disconnected split', () => {
    const none = cutTrace({ ids: IDS, edges: EDGES, side: [] }).at(-1);
    expect(none?.best).toBe(-1);
    expect(none?.crossing).toEqual([]);
    const split = cutTrace({
      ids: [0, 1, 2, 3],
      edges: [
        { from: 0, to: 1 },
        { from: 2, to: 3 },
      ],
      side: [true, true, false, false],
    }).at(-1);
    expect(split?.best).toBe(-1);
    expect(cutTrace({ ids: [], edges: [], side: [] }).map((f) => f.kind)).toEqual([
      'start',
      'done',
    ]);
  });

  it('always names an edge some MST uses (brute force)', () => {
    const rand = seeded(5);
    for (let t = 0; t < 80; t++) {
      const { n, edges } = randomGraph(rand);
      const side = Array.from({ length: n }, () => rand() < 0.5);
      side[0] = true;
      side[n - 1] = false;
      const last = cutTrace({ ids: [...Array(n).keys()], edges, side }).at(-1);
      const { used } = bruteForce(n, edges);
      expect(last?.best).toBeGreaterThanOrEqual(0);
      for (const k of last?.ties ?? []) expect(used[k]).toBe(true);
    }
  });
});

describe('cycle test', () => {
  it('finds the lighter route that makes C — D the heaviest edge on a cycle', () => {
    const frames = cycleTrace({ ids: IDS, edges: EDGES, edge: 4 });
    const last = frames.at(-1);
    expect(last?.verdict).toBe('cycle');
    expect(last?.path).toEqual([2, 1, 3]);
    expect(frames.find((f) => f.kind === 'found')?.edge).toBe(3);
  });

  it('leaves D — E as the lightest edge across the reached set', () => {
    const last = cycleTrace({ ids: IDS, edges: EDGES, edge: 6 }).at(-1);
    expect(last?.verdict).toBe('cut');
    expect(last?.reached).toEqual([true, true, true, true, false, false]);
    expect(last?.path).toEqual([]);
  });

  it('ignores edges as heavy as the tested one', () => {
    const edges = [
      { from: 0, to: 1, weight: 2 },
      { from: 1, to: 2, weight: 2 },
      { from: 0, to: 2, weight: 2 },
    ];
    const frames = cycleTrace({ ids: [0, 1, 2], edges, edge: 2 });
    expect(frames.at(-1)?.verdict).toBe('cut');
    expect(frames.filter((f) => f.kind === 'heavy').length).toBe(2);
  });

  it('handles a missing edge', () => {
    expect(cycleTrace({ ids: [0], edges: [], edge: 0 }).map((f) => f.kind)).toEqual([
      'start',
      'done',
    ]);
  });

  it('says “in some MST” exactly when brute force does', () => {
    const rand = seeded(11);
    for (let t = 0; t < 60; t++) {
      const { n, edges } = randomGraph(rand);
      const { used } = bruteForce(n, edges);
      edges.forEach((_, k) => {
        const frames = cycleTrace({ ids: [...Array(n).keys()], edges, edge: k });
        expect(frames.at(-1)?.verdict).toBe(used[k] ? 'cut' : 'cycle');
        expect(frames.length).toBeLessThan(400);
      });
    }
  });

  it('frames do not alias', () => {
    const frames = cycleTrace({ ids: IDS, edges: EDGES, edge: 4 });
    frames[0].reached[5] = true;
    frames[0].queue.push(9);
    expect(frames[1].reached[5]).toBe(false);
    expect(frames[1].queue).not.toContain(9);
    const cut = cutTrace({ ids: IDS, edges: EDGES, side: LEFT });
    cut[5].crossing.push(99);
    expect(cut[6].crossing).not.toContain(99);
  });
});

describe('minimum spanning forest', () => {
  it('matches brute force and counts components', () => {
    expect(minimumSpanningForest(IDS, EDGES)).toEqual({
      tree: [8, 2, 0, 3, 6],
      weight: 18,
      components: 1,
    });
    const rand = seeded(23);
    for (let t = 0; t < 40; t++) {
      const { n, edges } = randomGraph(rand);
      expect(minimumSpanningForest([...Array(n).keys()], edges).weight).toBe(
        bruteForce(n, edges).best,
      );
    }
    expect(minimumSpanningForest([0, 1], []).components).toBe(2);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of the cut scan', () => {
    const frames = cutTrace({ ids: IDS, edges: EDGES, side: LEFT });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(cutPseudocode.map((_, i) => i));
  });

  it('highlights every line of the cycle test', () => {
    const frames = [
      ...cycleTrace({ ids: IDS, edges: EDGES, edge: 4 }),
      ...cycleTrace({ ids: IDS, edges: EDGES, edge: 6 }),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(cyclePseudocode.map((_, i) => i));
  });
});
