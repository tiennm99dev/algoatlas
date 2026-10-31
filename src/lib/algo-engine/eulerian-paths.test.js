import { describe, expect, it } from 'vitest';
import { MAX_NODES, eulerPseudocode, eulerTrace } from './eulerian-paths.js';

/** Deterministic LCG so graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} n @param {number} p @param {() => number} rand */
function randomGraph(n, p, rand) {
  const edges = [];
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) if (rand() < p) edges.push({ from: a, to: b });
  }
  return { ids: Array.from({ length: n }, (_, i) => i), edges };
}

/**
 * Independent oracle: does any walk use every edge exactly once? Plain backtracking from
 * every start vertex, fine for the small graphs used here.
 * @param {number} n @param {{from: number, to: number}[]} edges
 */
function hasEulerPath(n, edges) {
  if (edges.length === 0) return false;
  const used = new Array(edges.length).fill(false);
  /** @param {number} u @param {number} count @returns {boolean} */
  const go = (u, count) => {
    if (count === edges.length) return true;
    for (let k = 0; k < edges.length; k++) {
      if (used[k]) continue;
      const e = edges[k];
      const v = e.from === u ? e.to : e.to === u ? e.from : -1;
      if (v < 0) continue;
      used[k] = true;
      if (go(v, count + 1)) return true;
      used[k] = false;
    }
    return false;
  };
  for (let s = 0; s < n; s++) if (go(s, 0)) return true;
  return false;
}

/**
 * The path walks real edges and uses each one exactly once.
 * @param {number[]} path @param {{from: number, to: number}[]} edges
 */
function checkPath(path, edges) {
  const left = edges.map((e) => [Math.min(e.from, e.to), Math.max(e.from, e.to)].join('-'));
  for (let i = 0; i + 1 < path.length; i++) {
    const key = [Math.min(path[i], path[i + 1]), Math.max(path[i], path[i + 1])].join('-');
    const at = left.indexOf(key);
    expect(at, `step ${path[i]} — ${path[i + 1]}`).toBeGreaterThanOrEqual(0);
    left.splice(at, 1);
  }
  expect(left).toEqual([]);
}

// The lesson's starting graph: triangles A B C, C D E and E F G, chained at C and E.
const LESSON = {
  ids: [0, 1, 2, 3, 4, 5, 6],
  edges: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 2 },
    { from: 4, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 4 },
  ],
};

describe('euler trace', () => {
  it('finds an Euler path exactly when backtracking finds one, and the path is valid', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const g = randomGraph(2 + (seed % 5), 0.5, seeded(seed));
      const last = /** @type {import('./eulerian-paths.js').EulerFrame} */ (eulerTrace(g).at(-1));
      const exists = hasEulerPath(g.ids.length, g.edges);
      expect(last.reason === '', `seed ${seed}`).toBe(exists);
      if (exists) {
        checkPath(last.path, g.edges);
        if (last.circuit) expect(last.path[0]).toBe(last.path.at(-1));
        else expect(last.odd).toContain(last.path[0]);
      }
    }
  });

  it('traces the lesson circuit with two detours', () => {
    const frames = eulerTrace(LESSON);
    const last = frames.at(-1);
    expect(last?.path).toEqual([0, 1, 2, 3, 4, 5, 6, 4, 2, 0]);
    expect(last?.route).toEqual([0, 2, 4, 6, 5, 4, 3, 2, 1, 0]);
    expect(last?.circuit).toBe(true);
    expect(last?.detours).toBe(2);
    expect(frames.filter((f) => f.kind === 'walk')).toHaveLength(9);
    expect(frames.filter((f) => f.kind === 'pop')).toHaveLength(10);
    expect(frames.filter((f) => f.detour).map((f) => f.current)).toEqual([2, 4]);
    expect(last?.routeEdges).toHaveLength(9);
  });

  it('starts an Euler path at an odd vertex', () => {
    // Drop G — E: E and G become odd, so the path runs from E to G.
    const g = { ids: LESSON.ids, edges: LESSON.edges.slice(0, 8) };
    const last = eulerTrace(g).at(-1);
    expect(last?.odd).toEqual([4, 6]);
    expect(last?.start).toBe(4);
    expect(last?.path[0]).toBe(4);
    expect(last?.path.at(-1)).toBe(6);
    expect(last?.circuit).toBe(false);
  });

  it('refuses graphs that fail the degree or connectivity test', () => {
    const star = {
      ids: [0, 1, 2, 3],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 0, to: 3 },
      ],
    };
    expect(eulerTrace(star).at(-1)?.reason).toBe('odd');
    const split = {
      ids: [0, 1, 2, 3, 4, 5],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 0 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 3 },
      ],
    };
    expect(eulerTrace(split).at(-1)?.reason).toBe('disconnected');
    expect(eulerTrace({ ids: [0, 1], edges: [] }).at(-1)?.reason).toBe('empty');
    expect(eulerTrace(star).map((f) => f.kind)).toEqual(['start', 'done']);
  });

  it('ignores isolated vertices in the connectivity test', () => {
    const g = { ids: [0, 1, 2], edges: [{ from: 1, to: 2 }] };
    expect(eulerTrace(g).at(-1)?.path).toEqual([1, 2]);
  });

  it('uses every edge once: walks equal edges, pops equal walks + 1', () => {
    const g = randomGraph(MAX_NODES, 1, () => 0);
    const frames = eulerTrace(g);
    // K8 has odd degrees everywhere, so take K7 plus an isolated vertex instead.
    expect(frames.at(-1)?.reason).toBe('odd');
    const k7 = { ids: g.ids, edges: g.edges.filter((e) => e.from < 7 && e.to < 7) };
    const run = eulerTrace(k7);
    expect(run.filter((f) => f.kind === 'walk')).toHaveLength(21);
    expect(run.filter((f) => f.kind === 'pop')).toHaveLength(22);
    expect(run.length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = eulerTrace(LESSON);
    const before = JSON.stringify(frames[4]);
    frames[3].stack.push(9);
    frames[3].left[0] = 9;
    frames[3].trail.push(9);
    frames[3].route.push(9);
    expect(JSON.stringify(frames[4])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const seen = new Set(eulerTrace(LESSON).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(eulerPseudocode.map((_, i) => i));
  });
});
