import { describe, expect, it } from 'vitest';
import {
  MAX_BATCH,
  MAX_E,
  MAX_SIZE_BITS,
  MAX_V,
  MAX_W,
  ROUNDS,
  dijkstraOps,
  dijkstraPseudocode,
  dijkstraRace,
  fibExtract,
  heapLevels,
  leaders,
  makeGraph,
  maxEdges,
  mixPseudocode,
  mixRace,
  opCost,
  vebLevels,
} from './practice-advanced-heaps.js';

/** @typedef {import('./practice-advanced-heaps.js').WeightedEdge} WeightedEdge */
/** @typedef {import('./practice-advanced-heaps.js').RaceFrame} RaceFrame */

/**
 * An independent oracle: Bellman–Ford distances from vertex 0.
 * @param {number} v @param {WeightedEdge[]} edges
 */
function bellmanFord(v, edges) {
  const dist = Array(v).fill(Infinity);
  dist[0] = 0;
  for (let i = 0; i < v - 1; i++)
    for (const e of edges)
      if (dist[e.from] + e.weight < dist[e.to]) dist[e.to] = dist[e.from] + e.weight;
  return dist;
}

describe('cost model', () => {
  it('charges a binary heap its levels', () => {
    expect([1, 2, 3, 4, 7, 8, 1024].map(heapLevels)).toEqual([1, 2, 2, 3, 3, 4, 11]);
  });

  it('charges a Fibonacci extract-min D(n) + 1 with D(n) = ⌊log_φ n⌋', () => {
    // log_φ 2 ≈ 1.44, log_φ 1024 ≈ 14.4, log_φ 2²⁰ ≈ 28.8.
    expect([1, 2, 3, 1024, 2 ** 20].map(fibExtract)).toEqual([1, 2, 3, 15, 29]);
    // φ¹⁰ ≈ 123 ≤ 144 < φ¹¹ ≈ 199, so D(144) = 10.
    expect(fibExtract(144)).toBe(11);
  });

  it('charges a vEB tree log₂ log₂ u + 1 levels', () => {
    expect([4, 8, 16, 32].map(vebLevels)).toEqual([3, 4, 5, 6]);
    expect(opCost('insert', 1024, 16)).toEqual({ binary: 11, fibonacci: 1, veb: 5 });
    expect(opCost('extract', 1024, 16)).toEqual({ binary: 11, fibonacci: 15, veb: 5 });
    expect(opCost('decrease', 1024, 8)).toEqual({ binary: 11, fibonacci: 1, veb: 4 });
  });
});

describe('Dijkstra race', () => {
  it('builds connected graphs with the asked number of edges', () => {
    for (const [v, e] of [
      [4, 3],
      [4, 12],
      [12, 40],
      [MAX_V, MAX_E],
    ]) {
      const edges = makeGraph(v, e, MAX_W, 7);
      expect(edges).toHaveLength(Math.min(e, maxEdges(v)));
      expect(new Set(edges.map((x) => `${x.from}>${x.to}`)).size).toBe(edges.length);
      expect(edges.every((x) => x.from !== x.to && x.weight >= 1 && x.weight <= MAX_W)).toBe(true);
      expect(bellmanFord(v, edges).every(Number.isFinite)).toBe(true);
    }
    expect(makeGraph(12, 40, 20, 2)).toEqual(makeGraph(12, 40, 20, 2));
  });

  it('extracts every vertex at its shortest distance, in order', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const v = 4 + (seed % 20);
      const edges = makeGraph(v, Math.min(maxEdges(v), 3 * v), 1 + (seed % 30), seed);
      const ops = dijkstraOps(v, edges);
      const dist = bellmanFord(v, edges);
      const extracts = ops.filter((op) => op.type === 'extract');
      expect(extracts).toHaveLength(v);
      for (const op of extracts) expect(op.key).toBe(dist[op.vertex]);
      const keys = extracts.map((op) => op.key);
      expect(keys).toEqual(keys.toSorted((a, b) => a - b));
      expect(ops.filter((op) => op.type === 'insert')).toHaveLength(v);
      expect(ops.filter((op) => op.type === 'decrease').length).toBeLessThanOrEqual(edges.length);
    }
  });

  it('charges every operation at the queue size of the moment', () => {
    const ops = dijkstraOps(12, makeGraph(12, 40, 20, 2));
    const frames = dijkstraRace(ops, 16);
    let size = 0;
    /** @type {import('./practice-advanced-heaps.js').Costs} */
    const sum = { binary: 0, fibonacci: 0, veb: 0 };
    ops.forEach((op, i) => {
      if (op.type === 'insert') size++;
      const want = opCost(op.type, size, 16);
      if (op.type === 'extract') size--;
      expect(frames[i + 1].step).toEqual(want);
      expect(frames[i + 1].size).toBe(size);
      sum.binary += want.binary;
      sum.fibonacci += want.fibonacci;
      sum.veb += want.veb;
    });
    const last = /** @type {RaceFrame} */ (frames.at(-1));
    expect(last.total).toEqual(sum);
    expect(last.total).toEqual({ binary: 80, fibonacci: 60, veb: 145 });
    expect(last.counts).toEqual({ insert: 12, extract: 12, decrease: 5 });
    expect(last.maxKey).toBe(27);
    expect(leaders(last)).toEqual(['fibonacci']);
  });

  it('drops the vEB tree when a key does not fit', () => {
    const ops = dijkstraOps(12, makeGraph(12, 40, 20, 2));
    expect(dijkstraRace(ops, 4).at(-1)?.fits).toBe(false);
    expect(dijkstraRace(ops, 8).at(-1)?.fits).toBe(true);
    const frames = dijkstraRace(ops, 4);
    // It fits until the first key of 16 or more arrives.
    const first = frames.findIndex((f) => !f.fits);
    expect(frames[first].key).toBeGreaterThanOrEqual(16);
    expect(frames.slice(0, first).every((f) => f.maxKey < 16)).toBe(true);
  });

  it('stays under 400 frames at the caps', () => {
    for (let seed = 1; seed < 20; seed++) {
      const frames = dijkstraRace(dijkstraOps(MAX_V, makeGraph(MAX_V, MAX_E, MAX_W, seed)), 32);
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('handles a path graph with no decrease-key', () => {
    const edges = [
      { from: 0, to: 1, weight: 3 },
      { from: 1, to: 2, weight: 4 },
    ];
    const frames = dijkstraRace(dijkstraOps(3, edges), 4);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'insert',
      'extract',
      'insert',
      'extract',
      'insert',
      'extract',
      'done',
    ]);
    expect(frames.at(-1)?.size).toBe(0);
    expect(frames.at(-1)?.maxKey).toBe(7);
  });
});

describe('operation mix race', () => {
  it('runs one step per non-empty batch with exact totals', () => {
    const frames = mixRace({ sizeBits: 10, inserts: 4, decreases: 8, extracts: 4 }, 16);
    expect(frames).toHaveLength(2 + 3 * ROUNDS);
    const last = /** @type {RaceFrame} */ (frames.at(-1));
    expect(last.total).toEqual({ binary: 1760, fibonacci: 720, veb: 800 });
    expect(last.counts).toEqual({ insert: 40, extract: 40, decrease: 80 });
    expect(frames[1]).toMatchObject({ kind: 'insert', round: 1, batch: 4 });
    expect(frames[1].step).toEqual({ binary: 44, fibonacci: 4, veb: 20 });
  });

  it('crowns a different queue for each workload', () => {
    /** @param {number} sizeBits @param {number} i @param {number} d @param {number} x @param {number} b */
    const lead = (sizeBits, i, d, x, b) =>
      leaders(
        /** @type {RaceFrame} */ (
          mixRace({ sizeBits, inserts: i, decreases: d, extracts: x }, b).at(-1)
        ),
      );
    expect(lead(10, 4, 0, 4, 16)).toEqual(['veb']);
    expect(lead(10, 4, 20, 4, 16)).toEqual(['fibonacci']);
    expect(lead(10, 0, 0, 4, 16)).toEqual(['veb']);
    // Without the vEB tree, extract-only work favours the binary heap.
    expect(lead(10, 0, 0, 4, 8)).toEqual(['binary']);
    expect(
      mixRace({ sizeBits: 10, inserts: 0, decreases: 0, extracts: 4 }, 16).at(-1)?.total,
    ).toEqual({ binary: 440, fibonacci: 600, veb: 200 });
  });

  it('drops the vEB tree when n exceeds u', () => {
    const at = (/** @type {number} */ sizeBits, /** @type {number} */ b) =>
      mixRace({ sizeBits, inserts: 1, decreases: 0, extracts: 1 }, b).at(-1)?.fits;
    expect(at(16, 16)).toBe(true);
    expect(at(17, 16)).toBe(false);
    expect(at(MAX_SIZE_BITS, 32)).toBe(true);
  });

  it('handles an empty mix and ties', () => {
    const empty = mixRace({ sizeBits: 4, inserts: 0, decreases: 0, extracts: 0 }, 4);
    expect(empty.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(leaders(/** @type {RaceFrame} */ (empty.at(-1)))).toEqual([
      'binary',
      'fibonacci',
      'veb',
    ]);
    expect(
      mixRace(
        { sizeBits: MAX_SIZE_BITS, inserts: MAX_BATCH, decreases: MAX_BATCH, extracts: MAX_BATCH },
        32,
      ).length,
    ).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = mixRace({ sizeBits: 10, inserts: 4, decreases: 8, extracts: 4 }, 16);
    const before = JSON.stringify(frames[3]);
    frames[2].total.binary = -1;
    frames[2].counts.insert = -1;
    frames[2].step.veb = -1;
    expect(JSON.stringify(frames[3])).toBe(before);
    const dij = dijkstraRace(dijkstraOps(6, makeGraph(6, 12, 9, 3)), 8);
    const next = JSON.stringify(dij[3]);
    dij[2].total.fibonacci = -1;
    expect(JSON.stringify(dij[3])).toBe(next);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every Dijkstra line', () => {
    const frames = dijkstraRace(dijkstraOps(12, makeGraph(12, 40, 20, 2)), 16);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(dijkstraPseudocode.map((_, i) => i));
  });

  it('highlights every mix line', () => {
    const frames = mixRace({ sizeBits: 10, inserts: 4, decreases: 8, extracts: 4 }, 16);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(mixPseudocode.map((_, i) => i));
  });
});
