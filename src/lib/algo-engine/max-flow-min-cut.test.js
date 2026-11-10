import { describe, expect, it } from 'vitest';
import {
  MAX_CAPACITY,
  MAX_NODES,
  cutCapacity,
  minCutPseudocode,
  minCutTrace,
} from './max-flow-min-cut.js';

/** Deterministic LCG so random networks are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {[number, number, number][]} list */
const net = (list) => list.map(([from, to, weight]) => ({ from, to, weight }));
/** @param {number} n */
const range = (n) => [...Array(n).keys()];

const CLASSIC = net([
  [0, 1, 16],
  [0, 2, 13],
  [2, 1, 4],
  [1, 3, 12],
  [3, 2, 9],
  [2, 4, 14],
  [4, 3, 7],
  [3, 5, 20],
  [4, 5, 4],
]);
// Three minimum cuts of capacity 7: source sides {S}, {S, A} and {S, A, B}.
const TIES = net([
  [0, 1, 4],
  [0, 2, 3],
  [1, 2, 2],
  [1, 3, 2],
  [2, 3, 5],
]);

/**
 * Oracle: the smallest cut capacity over every split, and the smallest source side among the
 * splits that reach it.
 * @param {number} n @param {{from: number, to: number, weight: number}[]} edges
 * @param {number} s @param {number} t
 */
function bruteCut(n, edges, s, t) {
  let best = Infinity;
  /** @type {number[]} */
  let sides = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    if (!(mask & (1 << s)) || mask & (1 << t)) continue;
    const inS = range(n).map((v) => (mask & (1 << v)) !== 0);
    const c = cutCapacity(range(n), edges, inS);
    if (c < best) [best, sides] = [c, [mask]];
    else if (c === best) sides.push(mask);
  }
  // The minimum cuts are closed under intersection, so the smallest side is their AND.
  const smallest = sides.reduce((a, m) => a & m, (1 << n) - 1);
  return { best, smallest: range(n).map((v) => (smallest & (1 << v)) !== 0) };
}

describe('cut capacity', () => {
  it('adds only the edges leaving the source side', () => {
    expect(cutCapacity(range(6), CLASSIC, [true, true, true, false, true, false])).toBe(23);
    expect(cutCapacity(range(6), CLASSIC, [true, false, false, false, false, false])).toBe(29);
    expect(cutCapacity(range(6), CLASSIC, [true, true, false, false, false, false])).toBe(25);
  });
});

describe('max-flow min-cut', () => {
  it('reads the minimum cut of the textbook network out of the residual graph', () => {
    const frames = minCutTrace({ ids: range(6), edges: CLASSIC, source: 0, sink: 5 });
    const last = frames.at(-1);
    expect(last?.value).toBe(23);
    expect(last?.side).toEqual([true, true, true, false, true, false]);
    expect(last?.cut).toEqual([3, 6, 8]);
    expect(last?.cutCapacity).toBe(23);
    const visits = frames.filter((f) => f.kind === 'visit');
    expect(visits.map((f) => [f.at, f.found])).toEqual([
      [0, [1, 2]],
      [1, []],
      [2, [4]],
      [4, []],
    ]);
    // Cut edges are saturated; the edge C → B going back from T to S carries nothing.
    for (const k of last?.cut ?? []) expect(last?.flow[k]).toBe(CLASSIC[k].weight);
    expect(last?.flow[4]).toBe(0);
  });

  it('finds the minimum cut with the smallest source side when there is a tie', () => {
    const last = minCutTrace({ ids: range(4), edges: TIES, source: 0, sink: 3 }).at(-1);
    expect(last?.side).toEqual([true, false, false, false]);
    expect(last?.cut).toEqual([0, 1]);
    expect(cutCapacity(range(4), TIES, [true, true, true, false])).toBe(7);
  });

  it('handles an unreachable sink and equal ends', () => {
    const frames = minCutTrace({ ids: range(3), edges: net([[0, 1, 4]]), source: 0, sink: 2 });
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'maxflow',
      'visit',
      'visit',
      'cut',
      'done',
    ]);
    expect(frames.at(-1)?.cutCapacity).toBe(0);
    const same = minCutTrace({ ids: range(2), edges: [], source: 1, sink: 1 });
    expect(same.map((f) => f.kind)).toEqual(['start', 'done']);
  });

  it('agrees with a brute-force minimum cut on random networks', () => {
    const rand = seeded(7);
    for (let t = 0; t < 150; t++) {
      const n = 2 + Math.floor(rand() * (MAX_NODES - 1));
      /** @type {{from: number, to: number, weight: number}[]} */
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = 0; v < n; v++)
          if (u !== v && rand() < 0.4)
            edges.push({ from: u, to: v, weight: 1 + Math.floor(rand() * MAX_CAPACITY) });
      const frames = minCutTrace({ ids: range(n), edges, source: 0, sink: n - 1 });
      const last = /** @type {import('./max-flow-min-cut.js').MinCutFrame} */ (frames.at(-1));
      const want = bruteCut(n, edges, 0, n - 1);
      expect(last.value).toBe(want.best);
      expect(last.cutCapacity).toBe(want.best);
      expect(last.side).toEqual(want.smallest);
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('frames do not alias', () => {
    const frames = minCutTrace({ ids: range(6), edges: CLASSIC, source: 0, sink: 5 });
    frames[1].flow[0] = 99;
    frames[5].side[0] = false;
    frames[5].queue.push(99);
    expect(frames[2].flow[0]).not.toBe(99);
    expect(frames[6].side[0]).toBe(true);
    expect(frames[6].queue).not.toContain(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = minCutTrace({ ids: range(6), edges: CLASSIC, source: 0, sink: 5 });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(minCutPseudocode.map((_, i) => i));
  });
});
