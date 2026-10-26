import { describe, expect, it } from 'vitest';
import {
  cleanEdges,
  degrees,
  representationsPseudocode,
  representationsTrace,
} from './graph-representations.js';

/** Deterministic LCG so graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} seed */
function randomGraph(seed) {
  const rand = seeded(seed);
  const n = 1 + Math.floor(rand() * 8);
  const ids = Array.from({ length: n }, (_, i) => i * 2 + 1);
  const edges = [];
  for (let k = 0; k < n * 2; k++) {
    edges.push({
      from: ids[Math.floor(rand() * n)],
      to: ids[Math.floor(rand() * n)],
      weight: 1 + Math.floor(rand() * 9),
    });
  }
  return { ids, edges };
}

/**
 * Independent oracle: the matrix from a set of (u, v) pairs.
 * @param {number[]} ids @param {{from: number, to: number, weight?: number}[]} edges
 * @param {boolean} directed @param {boolean} weighted
 */
function oracleMatrix(ids, edges, directed, weighted) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const m = sorted.map(() => sorted.map(() => 0));
  for (const e of edges) {
    const u = sorted.indexOf(e.from);
    const v = sorted.indexOf(e.to);
    const w = weighted ? (e.weight ?? 1) : 1;
    m[u][v] = w;
    if (!directed) m[v][u] = w;
  }
  return m;
}

describe('cleanEdges', () => {
  it('drops self loops and duplicates', () => {
    const e = [
      { from: 0, to: 0 },
      { from: 0, to: 1 },
      { from: 0, to: 1 },
    ];
    expect(cleanEdges(e, true)).toEqual([{ from: 0, to: 1 }]);
  });

  it('keeps both directions when directed, only the first when undirected', () => {
    const e = [
      { from: 2, to: 1, weight: 4 },
      { from: 1, to: 2, weight: 7 },
    ];
    expect(cleanEdges(e, true)).toHaveLength(2);
    expect(cleanEdges(e, false)).toEqual([{ from: 2, to: 1, weight: 4 }]);
  });
});

describe('representations trace', () => {
  it('matches the oracle matrix and keeps lists and matrix in sync', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const directed of [true, false]) {
        for (const weighted of [true, false]) {
          const g = randomGraph(seed);
          const edges = cleanEdges(g.edges, directed);
          const last = representationsTrace({ ids: g.ids, edges, directed, weighted }).at(-1);
          if (!last) throw new Error('empty trace');
          expect(last.matrix).toEqual(oracleMatrix(g.ids, edges, directed, weighted));
          // Every nonzero matrix cell is exactly one list entry with the same weight.
          last.matrix.forEach((row, u) =>
            row.forEach((w, v) => {
              const hits = last.lists[u].filter((e) => e.to === v);
              expect(hits.length, `seed ${seed}`).toBe(w === 0 ? 0 : 1);
              if (w) expect(hits[0].weight).toBe(w);
            }),
          );
        }
      }
    }
  });

  it('counts E writes when directed and 2E when undirected', () => {
    const ids = [0, 1, 2, 3];
    const edges = [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 0 },
    ];
    const d = representationsTrace({ ids, edges, directed: true, weighted: false }).at(-1);
    const u = representationsTrace({ ids, edges, directed: false, weighted: false }).at(-1);
    expect(d?.listEntries).toBe(3);
    expect(d?.matrixWrites).toBe(3);
    expect(u?.listEntries).toBe(6);
    expect(u?.matrix.flat().filter(Boolean)).toHaveLength(6);
    expect(degrees(/** @type {any} */ (u).lists)).toEqual([2, 2, 2, 0]);
  });

  it('stores weights, or 1 when unweighted', () => {
    const ids = [0, 1];
    const edges = [{ from: 0, to: 1, weight: 5 }];
    expect(
      representationsTrace({ ids, edges, directed: true, weighted: true }).at(-1)?.matrix,
    ).toEqual([
      [0, 5],
      [0, 0],
    ]);
    expect(
      representationsTrace({ ids, edges, directed: false, weighted: false }).at(-1)?.matrix,
    ).toEqual([
      [0, 1],
      [1, 0],
    ]);
  });

  it('handles an empty graph and a single vertex', () => {
    expect(
      representationsTrace({ ids: [], edges: [], directed: false, weighted: false }).map(
        (f) => f.kind,
      ),
    ).toEqual(['start', 'done']);
    const one = representationsTrace({ ids: [4], edges: [], directed: true, weighted: false });
    expect(one.at(-1)?.matrix).toEqual([[0]]);
    expect(one.at(-1)?.lists).toEqual([[]]);
  });

  it('maps sparse ids to rows in ascending order', () => {
    const last = representationsTrace({
      ids: [9, 2, 5],
      edges: [{ from: 9, to: 2 }],
      directed: true,
      weighted: false,
    }).at(-1);
    expect(last?.lists).toEqual([[], [], [{ to: 0, weight: 1 }]]);
  });

  it('does not alias frames', () => {
    const frames = representationsTrace({
      ids: [0, 1, 2],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
      ],
      directed: false,
      weighted: false,
    });
    const before = JSON.stringify(frames[2]);
    frames[1].matrix[0][2] = 99;
    frames[1].lists[0].push({ to: 2, weight: 9 });
    expect(JSON.stringify(frames[2])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = representationsTrace({
      ids: [0, 1],
      edges: [{ from: 0, to: 1 }],
      directed: false,
      weighted: true,
    });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(representationsPseudocode.map((_, i) => i));
  });
});
