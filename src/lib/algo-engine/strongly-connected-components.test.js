import { describe, expect, it } from 'vitest';
import {
  MAX_NODES,
  condensation,
  kosarajuPseudocode,
  kosarajuTrace,
  tarjanPseudocode,
  tarjanTrace,
} from './strongly-connected-components.js';

/** Deterministic LCG so graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} n @param {number} p @param {() => number} rand */
function randomGraph(n, p, rand) {
  const edges = [];
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) if (a !== b && rand() < p) edges.push({ from: a, to: b });
  }
  return { ids: Array.from({ length: n }, (_, i) => i), edges };
}

/**
 * Independent oracle: two vertices share a component exactly when each reaches the other,
 * found by a reachability closure (Floyd–Warshall on booleans).
 * @param {{ids: number[], edges: {from: number, to: number}[]}} g
 */
function sameComponent(g) {
  const n = g.ids.length;
  const r = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j));
  for (const e of g.edges) r[e.from][e.to] = true;
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (r[i][k] && r[k][j]) r[i][j] = true;
  return (/** @type {number} */ a, /** @type {number} */ b) => r[a][b] && r[b][a];
}

// The lesson's starting graph: {A, B, C}, {D, E, F} and {G, H}.
const LESSON = {
  ids: [0, 1, 2, 3, 4, 5, 6, 7],
  edges: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
    { from: 1, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 5 },
    { from: 5, to: 3 },
    { from: 6, to: 5 },
    { from: 6, to: 7 },
    { from: 7, to: 6 },
  ],
};

describe.each([
  ['tarjan', tarjanTrace],
  ['kosaraju', kosarajuTrace],
])('%s', (name, trace) => {
  it('groups vertices like a reachability oracle', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const g = randomGraph(1 + (seed % MAX_NODES), 0.25, seeded(seed));
      const last = /** @type {import('./strongly-connected-components.js').SccFrame} */ (
        trace(g).at(-1)
      );
      const same = sameComponent(g);
      for (const a of g.ids) {
        expect(last.comp[a]).toBeGreaterThan(0);
        for (const b of g.ids)
          expect(last.comp[a] === last.comp[b], `seed ${seed}`).toBe(same(a, b));
      }
      expect(last.count).toBe(new Set(last.comp).size);
    }
  });

  it('handles an empty graph and a single vertex', () => {
    expect(trace({ ids: [], edges: [] }).at(-1)?.count).toBe(0);
    expect(trace({ ids: [5], edges: [] }).at(-1)?.comp).toEqual([1]);
  });

  it('examines every edge once per pass', () => {
    const passes = name === 'tarjan' ? 1 : 2;
    expect(trace(LESSON).at(-1)?.edgesSeen).toBe(LESSON.edges.length * passes);
  });

  it('stays under 400 frames on a complete graph at the size cap', () => {
    const g = randomGraph(MAX_NODES, 1, () => 0);
    expect(trace(g).length).toBeLessThan(400);
    expect(trace(g).at(-1)?.count).toBe(1);
  });

  it('does not alias frames', () => {
    const frames = trace(LESSON);
    const before = JSON.stringify(frames[3]);
    frames[2].comp[0] = 9;
    frames[2].tin[0] = 9;
    frames[2].stack.push(9);
    expect(JSON.stringify(frames[3])).toBe(before);
  });

  it('numbers the components so the condensation edges agree with its order', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const g = randomGraph(MAX_NODES, 0.2, seeded(seed));
      const last = /** @type {import('./strongly-connected-components.js').SccFrame} */ (
        trace(g).at(-1)
      );
      for (const [a, b] of condensation(g, last.comp).edges) {
        // Tarjan finds sinks first, Kosaraju sources first.
        if (name === 'tarjan') expect(a).toBeGreaterThan(b);
        else expect(a).toBeLessThan(b);
      }
    }
  });
});

describe('the lesson graph', () => {
  it('Tarjan pops {D, E, F}, then {A, B, C}, then {G, H}', () => {
    const frames = tarjanTrace(LESSON);
    const roots = frames.filter((f) => f.kind === 'root');
    expect(roots.map((f) => f.popped)).toEqual([
      [5, 4, 3],
      [2, 1, 0],
      [7, 6],
    ]);
    const last = frames.at(-1);
    expect(last?.tin).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(last?.low).toEqual([0, 0, 0, 3, 3, 3, 6, 6]);
  });

  it('Kosaraju finishes C, F, E, D, B, A, H, G and collects {G, H} first', () => {
    const frames = kosarajuTrace(LESSON);
    expect(frames.find((f) => f.kind === 'transpose')?.finished).toEqual([2, 5, 4, 3, 1, 0, 7, 6]);
    const roots = frames.filter((f) => f.kind === 'root');
    expect(roots.map((f) => f.popped)).toEqual([
      [6, 7],
      [0, 2, 1],
      [3, 5, 4],
    ]);
    expect(frames.filter((f) => f.kind === 'skip').length).toBe(5);
  });

  it('condenses into a DAG with two edges', () => {
    const last = /** @type {import('./strongly-connected-components.js').SccFrame} */ (
      kosarajuTrace(LESSON).at(-1)
    );
    expect(condensation(LESSON, last.comp)).toEqual({
      members: [
        [6, 7],
        [0, 1, 2],
        [3, 4, 5],
      ],
      edges: [
        [1, 3],
        [2, 3],
      ],
    });
  });

  it('ignores self loops and unknown ids', () => {
    const g = {
      ids: [0, 1],
      edges: [
        { from: 0, to: 0 },
        { from: 0, to: 9 },
      ],
    };
    expect(tarjanTrace(g).at(-1)?.edgesSeen).toBe(0);
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['tarjan', tarjanTrace, tarjanPseudocode],
    ['kosaraju', kosarajuTrace, kosarajuPseudocode],
  ])('%s highlights every pseudocode line', (_, trace, code) => {
    const seen = new Set(trace(LESSON).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(code.map((_, i) => i));
  });
});
