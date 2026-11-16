import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/p-np-reductions/copy.en.js';
import {
  MAX_NODES,
  REDUCTION_PRESETS,
  choose,
  indexGraph,
  largestClique,
  reductionPseudocode,
  reductionTrace,
} from './p-np-reductions.js';

/** @typedef {import('./p-np-reductions.js').ReductionFrame} ReductionFrame */
/** @typedef {import('./p-np-reductions.js').PlainEdge} PlainEdge */

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

/** Whether `set` is independent in the edge list, by direct search. */
/** @param {number[]} set @param {[number, number][]} edges */
const independent = (set, edges) => !edges.some(([u, v]) => set.includes(u) && set.includes(v));

/** The largest independent set by trying every subset. @param {number} n @param {[number, number][]} edges */
function largestIndependent(n, edges) {
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    const set = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) set.push(i);
    if (independent(set, edges)) best = Math.max(best, set.length);
  }
  return best;
}

/** @param {Parameters<typeof reductionTrace>[0]} input */
const last = (input) => /** @type {ReductionFrame} */ (reductionTrace(input).at(-1));

/** @param {(typeof REDUCTION_PRESETS)[number]} p */
const inputOf = (p) => ({
  ids: p.spots.map((_, i) => i),
  edges: p.pairs.map(([from, to]) => ({ from, to })),
  k: p.k,
  cert: p.cert,
});

const preset = (/** @type {string} */ key) =>
  /** @type {(typeof REDUCTION_PRESETS)[number]} */ (REDUCTION_PRESETS.find((p) => p.key === key));

describe('clique to independent set reduction', () => {
  it('builds the complement, so cliques of G are independent sets of H', () => {
    const rand = seeded(5);
    for (let t = 0; t < 80; t++) {
      const n = 1 + Math.floor(rand() * MAX_NODES);
      const edges = randomEdges(n, rand(), rand);
      const f = last({ ids: [...Array(n).keys()], edges, k: 1, cert: [] });
      expect(f.edges.length + f.built.length).toBe((n * (n - 1)) / 2);
      for (const [u, v] of f.built) {
        expect(f.edges.some(([a, b]) => a === u && b === v)).toBe(false);
      }
      expect(largestIndependent(n, f.built)).toBe(f.largest);
      expect(f.mapSteps).toBe((n * (n - 1)) / 2);
    }
  });

  it('finds the largest clique of each example', () => {
    expect(last(inputOf(preset('clique'))).largest).toBe(4);
    expect(last(inputOf(preset('house'))).largest).toBe(3);
    expect(last(inputOf(preset('cycle'))).largest).toBe(2);
    expect(largestClique(0, [])).toEqual([]);
  });

  it('verifies a clique certificate with k(k − 1)/2 tests', () => {
    const f = last(inputOf(preset('clique')));
    expect(f.verdict).toBe('accept');
    expect(f.checks).toBe(6);
    expect(f.checked).toHaveLength(6);
  });

  it('rejects a set that is not a clique at the first missing edge', () => {
    const frames = reductionTrace(inputOf(preset('house')));
    const bad = /** @type {ReductionFrame} */ (frames.find((f) => f.kind === 'pairBad'));
    expect(bad.pair).toEqual([0, 3]);
    expect(bad.checks).toBe(2);
    expect(frames.at(-1)?.verdict).toBe('reject');
  });

  it('rejects a certificate smaller than k without testing pairs', () => {
    const f = last(inputOf(preset('cycle')));
    expect(f.verdict).toBe('reject');
    expect(f.checks).toBe(0);
    expect(reductionTrace(inputOf(preset('cycle'))).some((x) => x.kind === 'small')).toBe(true);
  });

  it('accepts exactly the certificates that are cliques of size at least k', () => {
    const rand = seeded(9);
    for (let t = 0; t < 120; t++) {
      const n = 2 + Math.floor(rand() * 5);
      const edges = randomEdges(n, 0.6, rand);
      const cert = [...Array(n).keys()].filter(() => rand() < 0.5);
      const k = 1 + Math.floor(rand() * n);
      const { pairs } = indexGraph([...Array(n).keys()], edges);
      const clique = cert.every((u) =>
        cert.every((v) => u >= v || pairs.some(([a, b]) => a === u && b === v)),
      );
      const want = cert.length >= k && clique ? 'accept' : 'reject';
      expect(last({ ids: [...Array(n).keys()], edges, k, cert }).verdict).toBe(want);
    }
  });

  it('numbers vertices by sorted id and ignores loops and repeated edges', () => {
    const { n, pairs } = indexGraph(
      [7, 3, 5],
      [
        { from: 7, to: 3 },
        { from: 3, to: 7 },
        { from: 5, to: 5 },
      ],
    );
    expect(n).toBe(3);
    expect(pairs).toEqual([[0, 2]]);
  });

  it('counts the k-subsets a search would try', () => {
    expect(choose(6, 4)).toBe(15);
    expect(choose(8, 4)).toBe(70);
    expect(choose(3, 5)).toBe(0);
    expect(last(inputOf(preset('clique'))).subsets).toBe(15);
  });

  it('handles one vertex and an empty certificate', () => {
    const f = last({ ids: [0], edges: [], k: 1, cert: [] });
    expect(f.mapSteps).toBe(0);
    expect(f.verdict).toBe('reject');
    expect(f.largest).toBe(1);
    expect(last({ ids: [0], edges: [], k: 1, cert: [0] }).verdict).toBe('accept');
  });

  it('keeps frames independent', () => {
    const frames = reductionTrace(inputOf(preset('clique')));
    frames[3].built.push([9, 9]);
    frames[3].cert.push(9);
    frames[3].edges[0][0] = 9;
    expect(frames[4].built).not.toContainEqual([9, 9]);
    expect(frames[4].cert).not.toContain(9);
    expect(frames[4].edges[0][0]).toBe(0);
  });

  it('stays under the frame budget at the cap', () => {
    const ids = [...Array(MAX_NODES).keys()];
    const frames = reductionTrace({
      ids,
      edges: randomEdges(MAX_NODES, 1, () => 0),
      k: MAX_NODES,
      cert: ids,
    });
    expect(frames.length).toBeLessThan(400);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const frames = REDUCTION_PRESETS.flatMap((p) => reductionTrace(inputOf(p)));
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(reductionPseudocode.map((_, i) => i));
  });
});

describe('quiz answers', () => {
  it('match the engine', () => {
    /** @param {number} i */
    const answer = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    const clique = last(inputOf(preset('clique')));
    expect(clique.mapSteps).toBe(answer(0));
    expect(clique.edges).toHaveLength(9);
    expect(clique.built).toHaveLength(answer(1));
    const five = [...Array(5).keys()];
    const full = randomEdges(5, 1, () => 0);
    expect(last({ ids: five, edges: full, k: 5, cert: five }).checks).toBe(answer(2));
  });
});
