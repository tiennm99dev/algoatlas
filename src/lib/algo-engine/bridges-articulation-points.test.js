import { describe, expect, it } from 'vitest';
import { MAX_NODES, cutPseudocode, cutTrace } from './bridges-articulation-points.js';

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
 * Number of connected components after dropping a vertex or an edge (brute force).
 * @param {number} n @param {{from: number, to: number}[]} edges @param {number} skipV @param {number} skipE
 */
function components(n, edges, skipV, skipE) {
  const parent = Array.from({ length: n }, (_, i) => i);
  /** @param {number} x @returns {number} */
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  edges.forEach((e, k) => {
    if (k === skipE || e.from === skipV || e.to === skipV) return;
    parent[find(e.from)] = find(e.to);
  });
  let count = 0;
  for (let v = 0; v < n; v++) if (v !== skipV && find(v) === v) count++;
  return count;
}

/** @param {{ids: number[], edges: {from: number, to: number}[]}} g */
function oracle(g) {
  const n = g.ids.length;
  const base = components(n, g.edges, -1, -1);
  const bridges = g.edges.flatMap((_, k) => (components(n, g.edges, -1, k) > base ? [k] : []));
  const cuts = g.ids.filter((v) => components(n, g.edges, v, -1) > base);
  return { bridges, cuts };
}

// The lesson's starting graph: two triangles sharing C, a bridge E — F, a triangle F, G, H.
const LESSON = {
  ids: [0, 1, 2, 3, 4, 5, 6, 7],
  edges: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 2 },
    { from: 4, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 7 },
    { from: 7, to: 5 },
  ],
};

describe('cut trace', () => {
  it('finds the same bridges and articulation points as brute-force removal', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const g = randomGraph(1 + (seed % MAX_NODES), 0.3, seeded(seed));
      const last = cutTrace(g).at(-1);
      const want = oracle(g);
      expect(
        last?.bridges.toSorted((a, b) => a - b),
        `seed ${seed}`,
      ).toEqual(want.bridges);
      expect(last?.cuts, `seed ${seed}`).toEqual(want.cuts);
    }
  });

  it('labels the lesson graph', () => {
    const last = cutTrace(LESSON).at(-1);
    expect(last?.tin).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(last?.low).toEqual([0, 0, 0, 2, 2, 5, 5, 5]);
    expect(last?.bridges).toEqual([6]);
    expect(last?.cuts).toEqual([2, 4, 5]);
    expect(last?.tree).toEqual([0, 1, 3, 4, 6, 7, 8]);
    expect(last?.backEdges.toSorted((a, b) => a - b)).toEqual([2, 5, 9]);
  });

  it('examines every edge from both ends', () => {
    expect(cutTrace(LESSON).at(-1)?.checks).toBe(2 * LESSON.edges.length);
  });

  it('treats the root by its number of tree children', () => {
    // A path B — A — C rooted at A: A has two children, so it is a cut vertex.
    const path = {
      ids: [0, 1, 2],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
      ],
    };
    const frames = cutTrace(path);
    expect(frames.find((f) => f.kind === 'root')?.isCut).toBe(true);
    expect(frames.at(-1)?.cuts).toEqual([0]);
    expect(frames.at(-1)?.bridges).toEqual([0, 1]);
    // A triangle: one child, no cut vertex, no bridge.
    const tri = {
      ids: [0, 1, 2],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 0 },
      ],
    };
    expect(cutTrace(tri).at(-1)?.cuts).toEqual([]);
    expect(cutTrace(tri).at(-1)?.bridges).toEqual([]);
  });

  it('handles an empty graph, a lone vertex and separate trees', () => {
    expect(cutTrace({ ids: [], edges: [] }).map((f) => f.kind)).toEqual(['start', 'done']);
    expect(cutTrace({ ids: [3], edges: [] }).map((f) => f.kind)).toEqual([
      'start',
      'enter',
      'root',
      'done',
    ]);
    const two = {
      ids: [0, 1, 2, 3],
      edges: [
        { from: 0, to: 1 },
        { from: 2, to: 3 },
      ],
    };
    expect(cutTrace(two).at(-1)?.bridges).toEqual([0, 1]);
    expect(cutTrace(two).filter((f) => f.kind === 'root')).toHaveLength(2);
  });

  it('stays under 400 frames on a complete graph at the size cap', () => {
    const g = randomGraph(MAX_NODES, 1, () => 0);
    expect(cutTrace(g).length).toBeLessThan(400);
    expect(cutTrace(g).at(-1)?.bridges).toEqual([]);
  });

  it('does not alias frames', () => {
    const frames = cutTrace(LESSON);
    const before = JSON.stringify(frames[4]);
    frames[3].tin[0] = 9;
    frames[3].low[0] = 9;
    frames[3].tree.push(9);
    frames[3].cuts.push(9);
    expect(JSON.stringify(frames[4])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const path = {
      ids: [0, 1, 2, 3],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 3, to: 0 },
      ],
    };
    const seen = new Set([...cutTrace(path), ...cutTrace(LESSON)].flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(cutPseudocode.map((_, i) => i));
  });
});
