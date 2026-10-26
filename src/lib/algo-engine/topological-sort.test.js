import { describe, expect, it } from 'vitest';
import {
  backwardEdges,
  dfsTopoPseudocode,
  dfsTopoTrace,
  kahnPseudocode,
  kahnTrace,
} from './topological-sort.js';

/** Deterministic LCG so graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} seed */
function randomGraph(seed) {
  const rand = seeded(seed);
  const n = 1 + Math.floor(rand() * 6);
  const ids = Array.from({ length: n }, (_, i) => i * 3);
  const edges = [];
  const seen = new Set();
  // Mostly forward edges, so many graphs are DAGs and some have cycles.
  for (let k = 0; k < n * 1.5; k++) {
    let a = Math.floor(rand() * n);
    let b = Math.floor(rand() * n);
    if (a === b) continue;
    if (a > b && rand() < 0.85) [a, b] = [b, a];
    if (seen.has(`${a}>${b}`)) continue;
    seen.add(`${a}>${b}`);
    edges.push({ from: ids[a], to: ids[b] });
  }
  return { ids, edges };
}

/** @param {number} n @returns {number[][]} */
function permutations(n) {
  if (n === 0) return [[]];
  return permutations(n - 1).flatMap((p) =>
    Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]),
  );
}

/** Independent oracle: is any permutation a valid order? @param {{ids: number[], edges: {from: number, to: number}[]}} g */
function isAcyclic(g) {
  return permutations(g.ids.length).some((p) => backwardEdges(p, g) === 0);
}

/** @param {{ids: number[], edges: {from: number, to: number}[]}} g @param {number} a @param {number} b */
const hasEdge = (g, a, b) => g.edges.some((e) => e.from === g.ids[a] && e.to === g.ids[b]);

const dinner = {
  ids: [0, 1, 2, 3, 4, 5, 6],
  edges: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 5 },
    { from: 0, to: 4 },
    { from: 3, to: 4 },
    { from: 4, to: 6 },
    { from: 5, to: 6 },
  ],
};

describe('topological sort traces', () => {
  it('both methods sort exactly the acyclic graphs, with no backward edge', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const g = randomGraph(seed);
      const acyclic = isAcyclic(g);
      for (const trace of [kahnTrace, dfsTopoTrace]) {
        const last = trace(g).at(-1);
        expect(last?.kind, `seed ${seed} ${trace.name}`).toBe(acyclic ? 'done' : 'cycle');
        if (acyclic) {
          expect(last?.result.slice().sort((a, b) => a - b)).toEqual(g.ids.map((_, i) => i));
          expect(backwardEdges(/** @type {number[]} */ (last?.result), g)).toBe(0);
        }
      }
    }
  });

  it('DFS reports a real cycle and Kahn leaves only blocked vertices', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const g = randomGraph(seed);
      const dfs = dfsTopoTrace(g).at(-1);
      if (dfs?.kind === 'cycle') {
        const c = dfs.cycle;
        for (let i = 0; i < c.length; i++) {
          expect(hasEdge(g, c[i], c[(i + 1) % c.length]), `seed ${seed}`).toBe(true);
        }
      }
      const kahn = kahnTrace(g).at(-1);
      if (kahn?.kind === 'cycle') {
        for (const v of kahn.cycle) expect(kahn.indeg[v]).toBeGreaterThan(0);
      }
    }
  });

  it('peels the dinner graph in FIFO order with Kahn', () => {
    const last = kahnTrace(dinner).at(-1);
    expect(last?.result).toEqual([0, 3, 1, 4, 2, 5, 6]);
    expect(last?.edgesSeen).toBe(7);
  });

  it('reverses the finish order with DFS', () => {
    const frames = dfsTopoTrace(dinner);
    const last = frames.at(-1);
    expect(last?.order).toEqual([6, 5, 2, 1, 4, 0, 3]);
    expect(last?.result).toEqual([3, 0, 4, 1, 2, 5, 6]);
    expect(frames.filter((f) => f.kind === 'edge' && f.edgeKind === 'finished')).toHaveLength(2);
  });

  it('finds the two-vertex cycle', () => {
    const g = {
      ids: [0, 1],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 0 },
      ],
    };
    expect(dfsTopoTrace(g).at(-1)?.cycle).toEqual([0, 1]);
    expect(kahnTrace(g).at(-1)?.cycle).toEqual([0, 1]);
  });

  it('handles the empty graph and isolated vertices', () => {
    expect(kahnTrace({ ids: [], edges: [] }).at(-1)?.kind).toBe('done');
    expect(dfsTopoTrace({ ids: [], edges: [] }).at(-1)?.kind).toBe('done');
    expect(kahnTrace({ ids: [5, 2], edges: [] }).at(-1)?.result).toEqual([0, 1]);
    expect(dfsTopoTrace({ ids: [5, 2], edges: [] }).at(-1)?.result).toEqual([1, 0]);
  });

  it('does not alias frames', () => {
    for (const trace of [kahnTrace, dfsTopoTrace]) {
      const frames = trace(dinner);
      const before = JSON.stringify(frames[3]);
      frames[2].status[0] = 9;
      frames[2].order.push(9);
      frames[2].pending.push(9);
      frames[2].indeg[0] = 9;
      expect(JSON.stringify(frames[3])).toBe(before);
    }
  });
});

describe('pseudocode coverage', () => {
  /** @param {import('./topological-sort.js').TopoFrame[]} frames */
  const lines = (frames) => [...new Set(frames.flatMap((f) => f.lines))].sort((a, b) => a - b);
  const cyc = {
    ids: [0, 1, 2],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 1 },
    ],
  };

  it('highlights every Kahn line', () => {
    expect(lines([...kahnTrace(dinner), ...kahnTrace(cyc)])).toEqual(
      kahnPseudocode.map((_, i) => i),
    );
  });

  it('highlights every DFS line', () => {
    expect(lines([...dfsTopoTrace(dinner), ...dfsTopoTrace(cyc)])).toEqual(
      dfsTopoPseudocode.map((_, i) => i),
    );
  });
});
