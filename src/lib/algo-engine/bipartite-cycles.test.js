import { describe, expect, it } from 'vitest';
import {
  bipartitePseudocode,
  bipartiteTrace,
  directedCyclePseudocode,
  directedCycleTrace,
  undirectedCyclePseudocode,
  undirectedCycleTrace,
} from './bipartite-cycles.js';

/** Deterministic LCG so graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {{ids: number[], edges: {from: number, to: number}[]}} G */

/** @param {number} seed @returns {G} */
function randomGraph(seed) {
  const rand = seeded(seed);
  const n = 1 + Math.floor(rand() * 7);
  const ids = Array.from({ length: n }, (_, i) => 10 - i);
  const edges = [];
  const m = Math.floor(rand() * (n + 2));
  for (let k = 0; k < m; k++) {
    edges.push({ from: ids[Math.floor(rand() * n)], to: ids[Math.floor(rand() * n)] });
  }
  return { ids, edges };
}

/** Distinct undirected pairs as index pairs, self loops dropped. @param {G} g */
function pairs(g, directed = false) {
  const sorted = g.ids.slice().sort((a, b) => a - b);
  const set = new Set();
  /** @type {[number, number][]} */
  const out = [];
  for (const e of g.edges) {
    let a = sorted.indexOf(e.from);
    let b = sorted.indexOf(e.to);
    if (a === b) continue;
    if (!directed && a > b) [a, b] = [b, a];
    if (set.has(`${a}>${b}`)) continue;
    set.add(`${a}>${b}`);
    out.push([a, b]);
  }
  return { n: sorted.length, out };
}

/** Oracle: try every two-colouring. @param {G} g */
function isBipartite(g) {
  const { n, out } = pairs(g);
  for (let mask = 0; mask < 1 << n; mask++) {
    if (out.every(([a, b]) => ((mask >> a) & 1) !== ((mask >> b) & 1))) return true;
  }
  return false;
}

/** Oracle: a forest has exactly n − components edges. @param {G} g */
function hasUndirectedCycle(g) {
  const { n, out } = pairs(g);
  const parent = Array.from({ length: n }, (_, i) => i);
  /** @param {number} x @returns {number} */
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const [a, b] of out) {
    if (find(a) === find(b)) return true;
    parent[find(a)] = find(b);
  }
  return false;
}

/** Oracle: repeatedly delete vertices with no incoming edge. @param {G} g */
function hasDirectedCycle(g) {
  const { n, out } = pairs(g, true);
  const alive = new Set(Array.from({ length: n }, (_, i) => i));
  let changed = true;
  while (changed) {
    changed = false;
    for (const v of alive) {
      if (!out.some(([a, b]) => b === v && alive.has(a))) {
        alive.delete(v);
        changed = true;
      }
    }
  }
  return alive.size > 0;
}

/** @param {G} g @param {number[]} cycle @param {boolean} directed */
function isRealCycle(g, cycle, directed) {
  const { out } = pairs(g, directed);
  /** @param {number} a @param {number} b */
  const joined = (a, b) =>
    out.some(([x, y]) => (x === a && y === b) || (!directed && x === b && y === a));
  return (
    new Set(cycle).size === cycle.length &&
    cycle.length >= (directed ? 2 : 3) &&
    cycle.every((v, i) => joined(v, cycle[(i + 1) % cycle.length]))
  );
}

const seeds = Array.from({ length: 150 }, (_, i) => i + 1);

describe('two-colouring', () => {
  it('agrees with brute force and finds an odd cycle when it fails', () => {
    for (const seed of seeds) {
      const g = randomGraph(seed);
      const last = bipartiteTrace(g).at(-1);
      const ok = isBipartite(g);
      expect(last?.kind, `seed ${seed}`).toBe(ok ? 'done' : 'conflict');
      if (ok) {
        const { out } = pairs(g);
        for (const [a, b] of out) expect(last?.colour[a]).not.toBe(last?.colour[b]);
        expect(last?.colour.every((c) => c === 1 || c === 2)).toBe(true);
      } else {
        const cycle = /** @type {number[]} */ (last?.cycle);
        expect(cycle.length % 2, `seed ${seed}`).toBe(1);
        expect(isRealCycle(g, cycle, false), `seed ${seed}`).toBe(true);
      }
    }
  });

  it('finds the 5-cycle in a pentagon', () => {
    const g = {
      ids: [0, 1, 2, 3, 4],
      edges: [0, 1, 2, 3, 4].map((i) => ({ from: i, to: (i + 1) % 5 })),
    };
    const last = bipartiteTrace(g).at(-1);
    expect(last?.cycle).toEqual([0, 1, 2, 3, 4]);
    expect([last?.current, last?.other]).toEqual([2, 3]);
  });

  it('colours an even cycle with alternating sides', () => {
    const g = {
      ids: [0, 1, 2, 3],
      edges: [0, 1, 2, 3].map((i) => ({ from: i, to: (i + 1) % 4 })),
    };
    const last = bipartiteTrace(g).at(-1);
    expect(last?.colour).toEqual([1, 2, 1, 2]);
    // Each of the 4 edges is examined from both ends.
    expect(last?.checks).toBe(8);
  });
});

describe('cycle checks', () => {
  it('undirected DFS agrees with union-find and reports a real cycle', () => {
    for (const seed of seeds) {
      const g = randomGraph(seed);
      const last = undirectedCycleTrace(g).at(-1);
      expect(last?.kind === 'cycle', `seed ${seed}`).toBe(hasUndirectedCycle(g));
      if (last?.kind === 'cycle') expect(isRealCycle(g, last.cycle, false)).toBe(true);
    }
  });

  it('directed DFS agrees with the peeling oracle and reports a real cycle', () => {
    for (const seed of seeds) {
      const g = randomGraph(seed);
      const last = directedCycleTrace(g).at(-1);
      expect(last?.kind === 'cycle', `seed ${seed}`).toBe(hasDirectedCycle(g));
      if (last?.kind === 'cycle') expect(isRealCycle(g, last.cycle, true)).toBe(true);
    }
  });

  it('tells a directed diamond (no cycle) from the same undirected graph (a cycle)', () => {
    const diamond = {
      ids: [0, 1, 2, 3],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 3 },
      ],
    };
    const d = directedCycleTrace(diamond);
    expect(d.at(-1)?.kind).toBe('done');
    expect(d.filter((f) => f.edgeKind === 'finished')).toHaveLength(1);
    expect(undirectedCycleTrace(diamond).at(-1)?.cycle).toEqual([0, 1, 3, 2]);
  });

  it('skips the parent edge in an undirected path and finds no cycle', () => {
    const path = {
      ids: [0, 1, 2],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
      ],
    };
    const frames = undirectedCycleTrace(path);
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.filter((f) => f.edgeKind === 'parent')).toHaveLength(2);
  });

  it('treats a two-way pair as a cycle only when directed', () => {
    const pair = {
      ids: [0, 1],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 0 },
      ],
    };
    expect(directedCycleTrace(pair).at(-1)?.cycle).toEqual([0, 1]);
    expect(undirectedCycleTrace(pair).at(-1)?.kind).toBe('done');
    expect(bipartiteTrace(pair).at(-1)?.kind).toBe('done');
  });

  it('handles the empty graph', () => {
    for (const trace of [bipartiteTrace, undirectedCycleTrace, directedCycleTrace]) {
      expect(trace({ ids: [], edges: [] }).map((f) => f.kind)).toEqual(['start', 'done']);
    }
  });

  it('does not alias frames', () => {
    const g = {
      ids: [0, 1, 2],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
      ],
    };
    for (const trace of [bipartiteTrace, undirectedCycleTrace, directedCycleTrace]) {
      const frames = trace(g);
      const before = JSON.stringify(frames[2]);
      frames[1].colour[0] = 9;
      frames[1].pending.push(9);
      frames[1].used.push(9);
      frames[1].tree.push(9);
      expect(JSON.stringify(frames[2])).toBe(before);
    }
  });
});

describe('pseudocode coverage', () => {
  /** @param {import('./bipartite-cycles.js').TwoColourFrame[]} frames */
  const lines = (frames) => [...new Set(frames.flatMap((f) => f.lines))].sort((a, b) => a - b);
  const triangleAndTail = {
    ids: [0, 1, 2, 3],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 3, to: 2 },
    ],
  };
  const square = {
    ids: [0, 1, 2, 3],
    edges: [0, 1, 2, 3].map((i) => ({ from: i, to: (i + 1) % 4 })),
  };
  const triangle = {
    ids: [0, 1, 2],
    edges: [0, 1, 2].map((i) => ({ from: i, to: (i + 1) % 3 })),
  };

  it('highlights every two-colouring line', () => {
    expect(lines([...bipartiteTrace(square), ...bipartiteTrace(triangle)])).toEqual(
      bipartitePseudocode.map((_, i) => i),
    );
  });

  it('highlights every undirected cycle line', () => {
    const path = { ids: [0, 1], edges: [{ from: 0, to: 1 }] };
    expect(lines([...undirectedCycleTrace(path), ...undirectedCycleTrace(triangle)])).toEqual(
      undirectedCyclePseudocode.map((_, i) => i),
    );
  });

  it('highlights every directed cycle line', () => {
    expect(
      lines([...directedCycleTrace(triangleAndTail), ...directedCycleTrace(triangle)]),
    ).toEqual(directedCyclePseudocode.map((_, i) => i));
  });
});
