import { describe, expect, it } from 'vitest';
import {
  MAX_NODES,
  cyclePseudocode,
  cycleTrace,
  failurePseudocode,
  failureTrace,
} from './practice-advanced-graphs.js';

/** Deterministic LCG so graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} n @param {number} p @param {() => number} rand @param {boolean} directed */
function randomGraph(n, p, rand, directed) {
  const edges = [];
  for (let a = 0; a < n; a++) {
    for (let b = directed ? 0 : a + 1; b < n; b++)
      if (a !== b && rand() < p) edges.push({ from: a, to: b });
  }
  return { ids: Array.from({ length: n }, (_, i) => i), edges };
}

/**
 * Oracle: who reaches whom, by repeated relaxation over the edge list.
 * @param {number} n @param {{from: number, to: number}[]} edges @param {boolean} directed
 * @param {number} skip  A vertex to leave out, or -1.
 */
function reach(n, edges, directed, skip) {
  const r = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j));
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of edges) {
      if (e.from === skip || e.to === skip) continue;
      for (const [a, b] of directed
        ? [[e.from, e.to]]
        : [
            [e.from, e.to],
            [e.to, e.from],
          ]) {
        for (let s = 0; s < n; s++) {
          if (r[s][a] && !r[s][b]) {
            r[s][b] = true;
            changed = true;
          }
        }
      }
    }
  }
  return r;
}

// The network of the lesson: triangle A B C, hub D with a leaf E, triangle F G H.
const NETWORK = {
  ids: [0, 1, 2, 3, 4, 5, 6, 7],
  edges: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 3, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 7 },
    { from: 7, to: 5 },
  ],
};

// The modules of the lesson: A → B means A needs B. Cycles C → D → E → C and F ⇄ G.
const MODULES = {
  ids: [0, 1, 2, 3, 4, 5, 6],
  edges: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 2 },
    { from: 0, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 5 },
    { from: 3, to: 6 },
  ],
};

describe('failure trace', () => {
  it('splits the network into the parts a reachability oracle finds', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const g = randomGraph(1 + (seed % MAX_NODES), 0.3, seeded(seed), false);
      const failed = seed % (g.ids.length + 1) === g.ids.length ? -1 : seed % g.ids.length;
      const last = /** @type {import('./practice-advanced-graphs.js').FailureFrame} */ (
        failureTrace({ ...g, failed }).at(-1)
      );
      const r = reach(g.ids.length, g.edges, false, failed);
      for (const a of g.ids) {
        if (a === failed) {
          expect(last.part[a]).toBe(-1);
          continue;
        }
        for (const b of g.ids) {
          if (b === failed) continue;
          expect(last.part[a] === last.part[b], `seed ${seed}`).toBe(r[a][b]);
        }
      }
      const all = reach(g.ids.length, g.edges, false, -1);
      expect(last.before).toBe(
        g.ids.filter((v) => g.ids.every((u) => u >= v || !all[u][v])).length,
      );
    }
  });

  it('counts the parts left by each failure in the lesson network', () => {
    /** @param {number} failed */
    const parts = (failed) => failureTrace({ ...NETWORK, failed }).at(-1)?.parts;
    expect(NETWORK.ids.map(parts)).toEqual([1, 1, 2, 3, 1, 2, 1, 1]);
    expect(parts(-1)).toBe(1);
    expect(failureTrace({ ...NETWORK, failed: 3 }).at(-1)?.sizes).toEqual([3, 1, 3]);
    expect(failureTrace({ ...NETWORK, failed: 5 }).at(-1)?.sizes).toEqual([5, 2]);
  });

  it('checks every working link from both ends', () => {
    // Failing D drops its 3 links; the 6 left are each checked twice.
    expect(failureTrace({ ...NETWORK, failed: 3 }).at(-1)?.checks).toBe(12);
    expect(failureTrace({ ...NETWORK, failed: -1 }).at(-1)?.checks).toBe(18);
  });

  it('handles an empty network and a lone node', () => {
    expect(failureTrace({ ids: [], edges: [], failed: -1 }).map((f) => f.kind)).toEqual([
      'start',
      'done',
    ]);
    const one = failureTrace({ ids: [4], edges: [], failed: 4 });
    expect(one.map((f) => f.kind)).toEqual(['start', 'fail', 'done']);
    expect(one.at(-1)?.parts).toBe(0);
  });

  it('does not alias frames', () => {
    const frames = failureTrace({ ...NETWORK, failed: 3 });
    const before = JSON.stringify(frames[3]);
    frames[2].part[0] = 9;
    frames[2].sizes.push(9);
    frames[2].queue.push(9);
    expect(JSON.stringify(frames[3])).toBe(before);
  });
});

describe('cycle trace', () => {
  it('reports exactly the modules that lie on a cycle', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const g = randomGraph(1 + (seed % MAX_NODES), 0.2, seeded(seed), true);
      const last = /** @type {import('./practice-advanced-graphs.js').CycleFrame} */ (
        cycleTrace(g).at(-1)
      );
      const r = reach(g.ids.length, g.edges, true, -1);
      const onCycle = g.ids.filter((v) => g.ids.some((u) => u !== v && r[v][u] && r[u][v]));
      expect(
        last.cycles.flat().sort((a, b) => a - b),
        `seed ${seed}`,
      ).toEqual(onCycle);
      if (last.cycles.length === 0) {
        // A build order puts every dependency before the module that needs it.
        const at = new Map(last.order.map((v, i) => [v, i]));
        for (const e of g.edges)
          expect(/** @type {number} */ (at.get(e.to))).toBeLessThan(
            /** @type {number} */ (at.get(e.from)),
          );
      }
    }
  });

  it('finds the two cycles of the lesson modules', () => {
    const last = cycleTrace(MODULES).at(-1);
    expect(last?.cycles).toEqual([
      [5, 6],
      [2, 3, 4],
    ]);
    expect(last?.count).toBe(4);
    expect(last?.checks).toBe(MODULES.edges.length);
  });

  it('marks modules that need a cycle as blocked, and only those', () => {
    const blocked = cycleTrace(MODULES)
      .filter((f) => f.kind === 'scc')
      .map((f) => [f.current, f.blocked]);
    // A needs B and F, B needs the cycle C D E: all blocked.
    expect(blocked).toEqual([
      [6, true],
      [2, true],
      [1, true],
      [0, true],
    ]);
    const free = cycleTrace({ ids: [0, 1, 2], edges: [{ from: 0, to: 1 }] });
    expect(free.filter((f) => f.kind === 'scc').map((f) => f.blocked)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('gives a build order once the cycles are broken', () => {
    // Drop E → C and G → F.
    const g = { ids: MODULES.ids, edges: MODULES.edges.filter((_, k) => k !== 4 && k !== 7) };
    const last = cycleTrace(g).at(-1);
    expect(last?.cycles).toEqual([]);
    expect(last?.order).toEqual([4, 6, 3, 2, 1, 5, 0]);
  });

  it('stays under 400 frames on a complete graph at the size cap', () => {
    const g = randomGraph(MAX_NODES, 1, () => 0, true);
    expect(cycleTrace(g).length).toBeLessThan(400);
    expect(
      failureTrace({ ...randomGraph(MAX_NODES, 1, () => 0, false), failed: -1 }).length,
    ).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = cycleTrace(MODULES);
    const before = JSON.stringify(frames[3]);
    frames[2].tin[0] = 9;
    frames[2].stack.push(9);
    frames[2].comp[0] = 9;
    expect(JSON.stringify(frames[3])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it('the failure trace highlights every line', () => {
    const seen = new Set(failureTrace({ ...NETWORK, failed: 3 }).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(failurePseudocode.map((_, i) => i));
  });

  it('the cycle trace highlights every line', () => {
    const seen = new Set(cycleTrace(MODULES).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(cyclePseudocode.map((_, i) => i));
  });
});
