import { describe, expect, it } from 'vitest';
import { VARIANTS, primPseudocode, primTrace } from './prim.js';

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
 * Kruskal with a plain union-find, as an independent oracle: the weight of a minimum spanning
 * tree of the component that holds vertex s, and that component’s size.
 * @param {number} n @param {{from: number, to: number, weight?: number}[]} edges @param {number} s
 */
function oracle(n, edges, s) {
  const p = [...Array(n).keys()];
  /** @param {number} x @returns {number} */
  const find = (x) => (p[x] === x ? x : (p[x] = find(p[x])));
  /** @type {{a: number, b: number, w: number}[]} */
  const tree = [];
  for (const e of edges.toSorted((x, y) => (x.weight ?? 1) - (y.weight ?? 1))) {
    const a = find(e.from);
    const b = find(e.to);
    if (a === b) continue;
    p[a] = b;
    tree.push({ a: e.from, b: e.to, w: e.weight ?? 1 });
  }
  const root = find(s);
  const size = [...Array(n).keys()].filter((v) => find(v) === root).length;
  const weight = tree.filter((t) => find(t.a) === root).reduce((sum, t) => sum + t.w, 0);
  return { weight, size };
}

describe('prim with a heap of crossing edges', () => {
  it('grows the MST of the starting graph from A and skips stale edges', () => {
    const frames = primTrace({ ids: IDS, edges: EDGES, start: 0, variant: 'heap' });
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'add',
      'push',
      'push',
      'add',
      'push',
      'push',
      'stale',
      'add',
      'push',
      'push',
      'stale',
      'add',
      'push',
      'add',
      'done',
    ]);
    const last = frames.at(-1);
    expect(last?.weight).toBe(18);
    expect(last?.added).toEqual([0, 1, 2, 3, 4, 5]);
    expect(last?.parentEdge).toEqual([-1, 0, 2, 3, 6, 8]);
    expect(last?.pushes).toBe(9);
    expect(last?.pops).toBe(7);
    expect(last?.stale).toBe(2);
    expect(last?.heap.map((e) => e.edge).sort()).toEqual([5, 7]);
    expect(frames.find((f) => f.kind === 'stale')?.edge).toBe(1);
  });

  it('keeps the heap ordered by weight in every frame', () => {
    for (const f of primTrace({ ids: IDS, edges: EDGES, start: 3, variant: 'heap' }))
      f.heap.forEach((e, i) => {
        if (i > 0) expect(f.heap[(i - 1) >> 1].w).toBeLessThanOrEqual(e.w);
      });
  });
});

describe('prim with an array of keys', () => {
  it('builds the same tree and scans V(V − 1)/2 keys on a connected graph', () => {
    const frames = primTrace({ ids: IDS, edges: EDGES, start: 0, variant: 'array' });
    const last = frames.at(-1);
    expect(last?.weight).toBe(18);
    expect(last?.parentEdge).toEqual([-1, 0, 2, 3, 6, 8]);
    expect(last?.comparisons).toBe(15);
    expect(last?.pushes).toBe(0);
    const improve = frames.find((f) => f.kind === 'improve' && f.neighbor === 2 && f.current === 1);
    expect(improve?.before).toBe(4);
    expect(improve?.key[2]).toBe(2);
  });

  it('stops at an unreachable vertex', () => {
    const frames = primTrace({
      ids: [0, 1, 2],
      edges: [{ from: 0, to: 1, weight: 4 }],
      start: 0,
      variant: 'array',
    });
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'add',
      'improve',
      'add',
      'unreachable',
      'done',
    ]);
    expect(frames.at(-1)?.inTree).toEqual([true, true, false]);
  });
});

describe('prim on sparse and dense graphs', () => {
  it('needs fewer comparisons with the array once almost every pair is joined', () => {
    /** @type {{from: number, to: number, weight: number}[]} */
    const complete = [];
    for (let u = 0; u < 6; u++)
      for (let v = u + 1; v < 6; v++)
        complete.push({ from: u, to: v, weight: ((u * 7 + v * 5) % 9) + 1 });
    /** @param {'heap' | 'array'} variant */
    const cost = (variant) =>
      primTrace({ ids: IDS, edges: complete, start: 0, variant }).at(-1)?.comparisons ?? 0;
    expect(cost('array')).toBe(15);
    expect(cost('heap')).toBeGreaterThan(cost('array'));
  });
});

describe('prim on edge cases', () => {
  it('handles no vertices, one vertex and a missing start', () => {
    for (const variant of VARIANTS) {
      expect(primTrace({ ids: [], edges: [], start: 0, variant }).map((f) => f.kind)).toEqual([
        'start',
        'done',
      ]);
      expect(primTrace({ ids: [4], edges: [], start: 0, variant }).at(-1)?.added).toEqual([0]);
      expect(primTrace({ ids: [4], edges: [], start: 3, variant }).at(-1)?.added).toEqual([]);
    }
  });

  it('defaults weights to 1 and numbers vertices by sorted id', () => {
    const last = primTrace({ ids: [9, 2], edges: [{ from: 9, to: 2 }], start: 1 }).at(-1);
    expect(last?.weight).toBe(1);
    expect(last?.added).toEqual([1, 0]);
  });

  it('matches Kruskal on random graphs, for both variants and any start', () => {
    const rand = seeded(29);
    for (let t = 0; t < 80; t++) {
      const n = 1 + Math.floor(rand() * 8);
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = u + 1; v < n; v++)
          if (rand() < 0.5) edges.push({ from: u, to: v, weight: 1 + Math.floor(rand() * 9) });
      const s = Math.floor(rand() * n);
      const want = oracle(n, edges, s);
      for (const variant of VARIANTS) {
        const frames = primTrace({ ids: [...Array(n).keys()], edges, start: s, variant });
        const last = frames.at(-1);
        expect(last?.weight).toBe(want.weight);
        expect(last?.added.length).toBe(want.size);
        expect(frames.length).toBeLessThan(400);
      }
    }
  });

  it('frames do not alias', () => {
    const frames = primTrace({ ids: IDS, edges: EDGES, start: 0, variant: 'heap' });
    frames[1].inTree[5] = true;
    frames[1].heap.push({ w: 0, edge: 0, from: 0, to: 0 });
    expect(frames[2].inTree[5]).toBe(false);
    expect(frames[2].heap.some((e) => e.w === 0)).toBe(false);
    const arr = primTrace({ ids: IDS, edges: EDGES, start: 0, variant: 'array' });
    arr[1].key[3] = -1;
    expect(arr[2].key[3]).not.toBe(-1);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of the heap version', () => {
    const frames = primTrace({ ids: IDS, edges: EDGES, start: 0, variant: 'heap' });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(primPseudocode.heap.map((_, i) => i));
  });

  it('highlights every line of the array version', () => {
    const frames = [
      ...primTrace({ ids: IDS, edges: EDGES, start: 0, variant: 'array' }),
      ...primTrace({ ids: [0, 1], edges: [], start: 0, variant: 'array' }),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(primPseudocode.array.map((_, i) => i));
  });
});
