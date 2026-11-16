import { describe, expect, it } from 'vitest';
import {
  HLD_PRESETS,
  decompose,
  hldPseudocode,
  hldQueryStart,
  hldTrace,
  makeHldPreset,
  pathNodes,
  pathRanges,
  sumTree,
} from './heavy-light-decomposition.js';
import { MAX_NODES, depthsOf, isRootedTree, randomParents } from './lca-binary-lifting.js';

/** Deterministic LCG so random trees are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number[]} parent @param {() => number} rand */
const withValues = (parent, rand) => ({
  labels: parent.map((_, i) => String(i)),
  parent,
  value: parent.map(() => Math.floor(rand() * 10)),
});

/** Path sum by collecting both root paths, an oracle independent of depths. @param {number[]} parent @param {number[]} value @param {number} u @param {number} v */
function oracleSum(parent, value, u, v) {
  const up = (/** @type {number} */ x) => {
    const out = [];
    for (let y = x; y >= 0; y = parent[y]) out.push(y);
    return out;
  };
  const a = up(u);
  const b = new Set(up(v));
  const meet = /** @type {number} */ (a.find((x) => b.has(x)));
  let s = 0;
  for (let y = u; y !== meet; y = parent[y]) s += value[y];
  for (let y = v; y !== meet; y = parent[y]) s += value[y];
  return s + value[meet];
}

const sample = makeHldPreset('sample');

describe('heavy-light decomposition', () => {
  it('gives every chain a block of consecutive positions, heavy child next', () => {
    const rand = seeded(4);
    for (let trial = 0; trial < 30; trial++) {
      const parent = randomParents(1 + Math.floor(rand() * MAX_NODES), rand);
      const d = decompose(parent);
      expect([...d.pos].sort((a, b) => a - b)).toEqual(parent.map((_, i) => i));
      parent.forEach((p, v) => {
        if (d.heavy[v] >= 0) {
          expect(d.pos[d.heavy[v]]).toBe(d.pos[v] + 1);
          expect(d.head[d.heavy[v]]).toBe(d.head[v]);
        }
        if (p >= 0 && d.heavy[p] !== v) expect(d.head[v]).toBe(v);
      });
    }
  });

  it('crosses at most log₂ n light edges on any root path', () => {
    const rand = seeded(8);
    for (let trial = 0; trial < 30; trial++) {
      const n = 2 + Math.floor(rand() * 60);
      /** @type {number[]} */
      const parent = [-1];
      for (let v = 1; v < n; v++) parent.push(Math.floor(rand() * v));
      const d = decompose(parent);
      parent.forEach((_, v) => {
        let light = 0;
        for (let x = v; x > 0; x = parent[x]) if (d.heavy[parent[x]] !== x) light++;
        expect(light).toBeLessThanOrEqual(Math.floor(Math.log2(n)));
      });
    }
  });

  it('sums every path like the oracle', () => {
    const rand = seeded(13);
    for (let trial = 0; trial < 10; trial++) {
      const t = withValues(randomParents(1 + Math.floor(rand() * MAX_NODES), rand), rand);
      for (let u = 0; u < t.parent.length; u++)
        for (let v = 0; v < t.parent.length; v++) {
          const done = hldTrace(t, u, v).at(-1);
          expect(done?.sum).toBe(oracleSum(t.parent, t.value, u, v));
          expect(done?.pathNodes).toBe(pathNodes(t.parent, u, v).length);
        }
    }
  });

  it('splits the sample query M – L into three chain ranges', () => {
    const frames = hldTrace(sample.tree, sample.u, sample.v);
    const done = /** @type {import('./heavy-light-decomposition.js').HldFrame} */ (frames.at(-1));
    expect(done.sum).toBe(34);
    expect(done.pathNodes).toBe(8);
    expect(done.ranges.map((r) => [r.from, r.to])).toEqual([
      [14, 14],
      [11, 12],
      [0, 4],
    ]);
    expect(done.visits).toBe(done.ranges.reduce((s, r) => s + r.visits, 0));
    expect(frames.slice(hldQueryStart(frames)).map((f) => f.kind)).toEqual([
      'query',
      'range',
      'range',
      'last',
      'done',
    ]);
  });

  it('answers a path inside one chain with a single range', () => {
    const { tree, u, v } = makeHldPreset('path');
    const done = hldTrace(tree, u, v).at(-1);
    expect(done?.ranges).toHaveLength(1);
    expect(done?.sum).toBe(1 + 8 + 2 + 8 + 1 + 8 + 2);
  });

  it('sizes in post-order and places nodes heavy child first', () => {
    const frames = hldTrace(sample.tree, 0, 0);
    const sized = frames.filter((f) => f.kind === 'size').map((f) => f.current);
    expect(sized.at(-1)).toBe(0);
    expect(sized.slice(0, 2)).toEqual([12, 7]);
    const placed = frames.filter((f) => f.kind === 'place');
    expect(placed.map((f) => f.current).slice(0, 5)).toEqual([0, 1, 3, 7, 12]);
    expect(placed.map((f) => f.via).slice(0, 2)).toEqual(['root', 'heavy']);
    expect(frames.at(-1)?.size[0]).toBe(15);
  });

  it('counts segment-tree visits and writes', () => {
    const seg = sumTree([1, 2, 3, 4]);
    expect(seg.query(0, 3)).toEqual({ sum: 10, visits: 1 });
    expect(seg.query(1, 2)).toEqual({ sum: 5, visits: 7 });
    expect(seg.set(2, 10)).toBe(3);
    expect(seg.query(0, 3).sum).toBe(17);
  });

  it('builds valid presets and stays far under 400 frames', () => {
    for (const p of HLD_PRESETS) {
      const { tree, u, v } = makeHldPreset(p, seeded(3));
      expect(isRootedTree(tree)).toBe(true);
      expect(hldTrace(tree, u, v).length).toBeLessThan(400);
    }
    const big = withValues(randomParents(MAX_NODES, seeded(1)), seeded(2));
    expect(depthsOf(big.parent)).toHaveLength(MAX_NODES);
    expect(hldTrace(big, 15, 1).length).toBeLessThan(400);
  });

  it('does not alias frames and rejects bad input', () => {
    const frames = hldTrace(sample.tree, sample.u, sample.v);
    const last = /** @type {import('./heavy-light-decomposition.js').HldFrame} */ (frames.at(-1));
    const before = frames.at(-2);
    last.ranges[0].sum = 99;
    last.pos[0] = 99;
    expect(before?.ranges[0].sum).toBe(8);
    expect(before?.pos[0]).toBe(0);
    expect(() => hldTrace({ ...sample.tree, value: [1] }, 0, 0)).toThrow();
    expect(() => hldTrace(sample.tree, 0, 40)).toThrow();
  });

  it('lists a range per chain change', () => {
    const d = decompose(sample.tree.parent);
    expect(pathRanges(d, sample.tree.parent, 12, 11).map((r) => r.last)).toEqual([
      false,
      false,
      true,
    ]);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [
      ...hldTrace(sample.tree, sample.u, sample.v),
      ...hldTrace(sample.tree, sample.v, sample.u),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(hldPseudocode.map((_, i) => i));
  });
});
