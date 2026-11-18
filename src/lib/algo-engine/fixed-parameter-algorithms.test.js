import { describe, expect, it } from 'vitest';
import { indexPairs } from './plain-edges.js';
import { vi as m } from '$lib/lessons/fixed-parameter-algorithms/copy.vi.js';
import {
  FPT_PRESETS,
  MAX_K,
  MAX_NODES,
  fptPseudocode,
  fptTrace,
  subsetsUpTo,
} from './fixed-parameter-algorithms.js';

/** @typedef {import('./fixed-parameter-algorithms.js').FptFrame} FptFrame */
/** @typedef {import('./fixed-parameter-algorithms.js').PlainEdge} PlainEdge */

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

/** The smallest cover size, by trying every subset. */
/** @param {number} n @param {[number, number][]} pairs */
function minCover(n, pairs) {
  let best = n;
  for (let mask = 0; mask < 1 << n; mask++) {
    let bits = 0;
    for (let x = mask; x; x &= x - 1) bits++;
    if (bits < best && pairs.every(([u, v]) => mask & (1 << u) || mask & (1 << v))) best = bits;
  }
  return best;
}

/** @param {Parameters<typeof fptTrace>[0]} input */
const last = (input) => /** @type {FptFrame} */ (fptTrace(input).at(-1));

/** @param {string} key @param {Partial<{k: number, kernel: boolean}>} [over] */
function preset(key, over = {}) {
  const p = /** @type {(typeof FPT_PRESETS)[number]} */ (FPT_PRESETS.find((x) => x.key === key));
  return {
    ids: p.spots.map((_, i) => i),
    edges: p.pairs.map(([from, to]) => ({ from, to })),
    k: over.k ?? p.k,
    kernel: over.kernel ?? p.kernel,
  };
}

describe('bounded search tree for vertex cover', () => {
  it('answers like brute force, with and without the kernel', () => {
    const rand = seeded(13);
    for (let t = 0; t < 150; t++) {
      const n = 1 + Math.floor(rand() * MAX_NODES);
      const edges = randomEdges(n, rand(), rand);
      const ids = [...Array(n).keys()];
      const { pairs } = indexPairs(ids, edges);
      const opt = minCover(n, pairs);
      const k = Math.floor(rand() * (MAX_K + 1));
      const want = opt <= k ? 'yes' : 'no';
      for (const kernel of [false, true]) {
        const f = last({ ids, edges, k, kernel });
        expect(f.answer).toBe(want);
        if (want === 'yes') {
          expect(f.cover.length).toBeLessThanOrEqual(k);
          expect(f.covered.every(Boolean)).toBe(true);
        }
      }
    }
  });

  it('never goes deeper than k or makes more than 2^(k+1) − 1 nodes', () => {
    const rand = seeded(29);
    for (let t = 0; t < 80; t++) {
      const n = 2 + Math.floor(rand() * (MAX_NODES - 1));
      const edges = randomEdges(n, 0.5, rand);
      const k = Math.floor(rand() * (MAX_K + 1));
      const f = last({ ids: [...Array(n).keys()], edges, k, kernel: false });
      expect(f.nodes.length).toBeLessThanOrEqual(2 ** (k + 1) - 1);
      for (const node of f.nodes) {
        let depth = 0;
        for (let p = node.parent; p >= 0; p = f.nodes[p].parent) depth++;
        expect(depth).toBeLessThanOrEqual(k);
        expect(node.budget).toBe(k - depth);
      }
    }
  });

  it('the kernel leaves at most k² edges, or answers no', () => {
    const rand = seeded(31);
    for (let t = 0; t < 80; t++) {
      const n = 2 + Math.floor(rand() * (MAX_NODES - 1));
      const edges = randomEdges(n, 0.6, rand);
      const k = Math.floor(rand() * (MAX_K + 1));
      const frames = fptTrace({ ids: [...Array(n).keys()], edges, k, kernel: true });
      const ready = frames.find((f) => f.kind === 'kernel');
      if (ready) {
        expect(ready.covered.filter((c) => !c).length).toBeLessThanOrEqual(ready.budget ** 2);
      } else {
        expect(frames.at(-1)?.answer).toBe('no');
      }
    }
  });

  it('runs the examples', () => {
    const yes = last(preset('yes'));
    expect(yes.answer).toBe('yes');
    expect(yes.cover).toEqual([1, 2, 3]);
    expect(yes.nodes).toHaveLength(15);
    expect(last(preset('no')).nodes).toHaveLength(7);
    const kernelNo = fptTrace(preset('no', { kernel: true }));
    expect(kernelNo.map((f) => f.kind)).toEqual(['start', 'forced', 'tooBig', 'done']);
    const stars = last(preset('stars'));
    expect(stars.forced).toEqual([0, 1]);
    expect(stars.answer).toBe('yes');
    expect(stars.nodes).toHaveLength(1);
    expect(last(preset('stars', { kernel: false })).answer).toBe('yes');
  });

  it('answers no at once when a vertex has edges and k is 0', () => {
    const frames = fptTrace({ ids: [0, 1], edges: [{ from: 0, to: 1 }], k: 0, kernel: true });
    expect(frames.map((f) => f.kind)).toEqual(['start', 'overBudget', 'done']);
    expect(last({ ids: [0, 1], edges: [{ from: 0, to: 1 }], k: 0, kernel: false }).answer).toBe(
      'no',
    );
  });

  it('handles a graph with no edges', () => {
    const f = last({ ids: [3], edges: [], k: 0, kernel: false });
    expect(f.answer).toBe('yes');
    expect(f.cover).toEqual([]);
  });

  it('counts the sets brute force would try', () => {
    expect(subsetsUpTo(7, 3)).toBe(1 + 7 + 21 + 35);
    expect(subsetsUpTo(2, 5)).toBe(4);
    expect(subsetsUpTo(10, 0)).toBe(1);
  });

  it('keeps frames independent', () => {
    const frames = fptTrace(preset('yes'));
    frames[2].nodes[0].budget = 99;
    frames[2].cover.push(99);
    frames[2].edges[0][0] = 99;
    expect(frames[3].nodes[0].budget).toBe(3);
    expect(frames[3].cover).not.toContain(99);
    expect(frames[3].edges[0][0]).toBe(0);
  });

  it('stays under the frame budget at the cap', () => {
    const ids = [...Array(MAX_NODES).keys()];
    const frames = fptTrace({
      ids,
      edges: randomEdges(MAX_NODES, 1, () => 0),
      k: MAX_K,
      kernel: false,
    });
    expect(frames.length).toBeLessThan(400);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const frames = [
      ...FPT_PRESETS.flatMap((p) => fptTrace(preset(p.key))),
      ...fptTrace(preset('no', { kernel: true })),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(fptPseudocode.map((_, i) => i));
  });
});

describe('quiz answers', () => {
  it('match the engine', () => {
    /** @param {number} i */
    const answer = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    expect(2 ** (4 + 1) - 1).toBe(answer(0));
    expect(last(preset('no')).nodes).toHaveLength(answer(1));
    expect(last(preset('yes')).nodes).toHaveLength(answer(2));
  });
});
