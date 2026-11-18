import { describe, expect, it } from 'vitest';
import { indexPairs } from './plain-edges.js';
import { vi as m } from '$lib/lessons/approximation-algorithms/copy.vi.js';
import {
  COVER_PRESETS,
  MAX_NODES,
  coverTrace,
  greedyPseudocode,
  harmonic,
  matchingPseudocode,
  optimumCover,
} from './approximation-algorithms.js';

/** @typedef {import('./approximation-algorithms.js').CoverFrame} CoverFrame */
/** @typedef {import('./approximation-algorithms.js').PlainEdge} PlainEdge */

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} n @param {number} p @param {() => number} rand @returns {PlainEdge[]} */
function randomEdges(n, p, rand) {
  /** @type {PlainEdge[]} */
  const edges = [];
  for (let u = 0; u < n; u++)
    for (let v = u + 1; v < n; v++) if (rand() < p) edges.push({ from: u, to: v });
  return edges;
}

/** The smallest cover size, by a recursion independent of the engine. */
/** @param {[number, number][]} pairs @returns {number} */
function minCover(pairs) {
  if (pairs.length === 0) return 0;
  const [u, v] = pairs[0];
  const without = (/** @type {number} */ x) => pairs.filter(([a, b]) => a !== x && b !== x);
  return 1 + Math.min(minCover(without(u)), minCover(without(v)));
}

/** @param {[number, number][]} pairs @param {number[]} cover */
const covers = (pairs, cover) => pairs.every(([u, v]) => cover.includes(u) || cover.includes(v));

/** @param {{ids: number[], edges: PlainEdge[]}} g @param {'matching'|'greedy'} alg */
const last = (g, alg) => /** @type {CoverFrame} */ (coverTrace(g, alg).at(-1));

/** @param {(typeof COVER_PRESETS)[number]} p */
const graphOf = (p) => ({
  ids: p.spots.map((_, i) => i),
  edges: p.pairs.map(([from, to]) => ({ from, to })),
});
const preset = (/** @type {string} */ key) =>
  graphOf(/** @type {(typeof COVER_PRESETS)[number]} */ (COVER_PRESETS.find((p) => p.key === key)));

describe('vertex cover approximations', () => {
  it('both covers are valid and within their guarantees on random graphs', () => {
    const rand = seeded(17);
    for (let t = 0; t < 150; t++) {
      const n = 1 + Math.floor(rand() * MAX_NODES);
      const g = { ids: [...Array(n).keys()], edges: randomEdges(n, rand(), rand) };
      const { pairs } = indexPairs(g.ids, g.edges);
      const opt = minCover(pairs);
      const match = last(g, 'matching');
      const greedy = last(g, 'greedy');
      expect(match.optimum).toHaveLength(opt);
      expect(covers(pairs, match.optimum)).toBe(true);
      expect(covers(pairs, match.cover)).toBe(true);
      expect(covers(pairs, greedy.cover)).toBe(true);
      expect(match.cover).toHaveLength(2 * match.matching.length);
      expect(match.matching.length).toBeLessThanOrEqual(opt);
      expect(match.cover.length).toBeLessThanOrEqual(2 * opt);
      expect(greedy.cover.length).toBeGreaterThanOrEqual(opt);
      const deg = Array.from({ length: n }, (_, v) => pairs.filter((e) => e.includes(v)).length);
      expect(greedy.cover.length).toBeLessThanOrEqual(harmonic(Math.max(0, ...deg)) * opt + 1e-9);
      expect(match.covered.every(Boolean)).toBe(true);
    }
  });

  it('matching edges share no vertex and the matching is maximal', () => {
    const rand = seeded(23);
    for (let t = 0; t < 60; t++) {
      const n = 2 + Math.floor(rand() * 8);
      const g = { ids: [...Array(n).keys()], edges: randomEdges(n, 0.4, rand) };
      const f = last(g, 'matching');
      const ends = f.matching.flatMap((i) => f.edges[i]);
      expect(new Set(ends).size).toBe(ends.length);
      for (const [u, v] of f.edges) expect(ends.includes(u) || ends.includes(v)).toBe(true);
    }
  });

  it('runs the examples where each rule does worst', () => {
    expect(last(preset('spider'), 'matching').cover).toHaveLength(6);
    expect(last(preset('spider'), 'greedy').cover).toEqual([0, 1, 2, 3]);
    expect(last(preset('spider'), 'greedy').optimum).toEqual([1, 2, 3]);
    expect(last(preset('star'), 'matching').cover).toEqual([0, 1]);
    expect(last(preset('star'), 'greedy').cover).toEqual([0]);
    expect(last(preset('path'), 'matching').cover).toHaveLength(6);
    expect(last(preset('path'), 'greedy').cover).toHaveLength(3);
  });

  it('greedy takes a vertex with the most uncovered edges, ties to the lowest', () => {
    const frames = coverTrace(preset('spider'), 'greedy');
    for (let i = 1; i < frames.length; i++) {
      const f = frames[i];
      if (f.kind !== 'pick') continue;
      const before = frames[i - 1].degree;
      expect(f.gain).toBe(Math.max(...before));
      expect(before.indexOf(f.gain)).toBe(f.vertex);
    }
  });

  it('counts the steps', () => {
    expect(last(preset('spider'), 'matching').looked).toBe(6);
    expect(last(preset('spider'), 'greedy').looked).toBe(4 * 7);
  });

  it('handles no edges, one vertex, loops and repeated edges', () => {
    const empty = last({ ids: [0, 1], edges: [] }, 'greedy');
    expect(empty.cover).toEqual([]);
    expect(empty.optimum).toEqual([]);
    expect(last({ ids: [4], edges: [{ from: 4, to: 4 }] }, 'matching').cover).toEqual([]);
    const { pairs } = indexPairs(
      [9, 2],
      [
        { from: 9, to: 2 },
        { from: 2, to: 9 },
      ],
    );
    expect(pairs).toEqual([[1, 0]]);
    expect(optimumCover(2, pairs)).toHaveLength(1);
  });

  it('keeps frames independent', () => {
    const frames = coverTrace(preset('spider'), 'matching');
    frames[1].cover.push(99);
    frames[1].covered[5] = true;
    frames[1].edges[0][0] = 99;
    expect(frames[2].cover).not.toContain(99);
    expect(frames[2].covered[5]).toBe(false);
    expect(frames[2].edges[0][0]).toBe(0);
  });

  it('stays under the frame budget at the cap', () => {
    const g = { ids: [...Array(MAX_NODES).keys()], edges: randomEdges(MAX_NODES, 1, () => 0) };
    for (const alg of /** @type {const} */ (['matching', 'greedy'])) {
      const frames = coverTrace(g, alg);
      expect(frames.length).toBeLessThan(400);
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
    }
  });

  it('computes H(d)', () => {
    expect(harmonic(0)).toBe(0);
    expect(harmonic(3)).toBeCloseTo(11 / 6);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of both algorithms', () => {
    for (const [alg, code] of /** @type {const} */ ([
      ['matching', matchingPseudocode],
      ['greedy', greedyPseudocode],
    ])) {
      const frames = COVER_PRESETS.flatMap((p) => coverTrace(graphOf(p), alg));
      const seen = new Set(frames.flatMap((f) => f.lines));
      expect([...seen].sort((a, b) => a - b)).toEqual(code.map((_, i) => i));
    }
  });
});

describe('quiz answers', () => {
  it('match the engine', () => {
    /** @param {number} i */
    const answer = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    expect(last(preset('spider'), 'matching').cover).toHaveLength(answer(0));
    expect(last(preset('spider'), 'greedy').cover).toHaveLength(answer(1));
    const star = last(preset('star'), 'matching');
    expect(star.cover.length / star.optimum.length).toBe(answer(2));
    // Greedy set cover on the sets of the last question.
    const sets = [
      [1, 2, 3, 4],
      [1, 3, 5],
      [2, 4, 6],
    ];
    const left = new Set([1, 2, 3, 4, 5, 6]);
    let picks = 0;
    while (left.size) {
      const best = sets.reduce((a, b) =>
        b.filter((x) => left.has(x)).length > a.filter((x) => left.has(x)).length ? b : a,
      );
      for (const x of best) left.delete(x);
      picks++;
    }
    expect(picks).toBe(answer(4));
  });
});
