import { describe, expect, it } from 'vitest';
import { arcLists, neighbourLists } from './graph-adjacency.js';

const ids = [30, 10, 20];
const edges = [
  { from: 10, to: 30 },
  { from: 10, to: 20 },
  { from: 20, to: 20 },
  { from: 30, to: 10 },
  { from: 10, to: 99 },
];

describe('arcLists', () => {
  it('lists directed arcs out and in, sorted by the other end then the edge', () => {
    const { n, out, inn } = arcLists(ids, edges, true);
    expect(n).toBe(3);
    expect(out).toEqual([
      [
        { to: 1, edge: 1 },
        { to: 2, edge: 0 },
      ],
      [],
      [{ to: 0, edge: 3 }],
    ]);
    expect(inn).toEqual([[{ to: 2, edge: 3 }], [{ to: 0, edge: 1 }], [{ to: 0, edge: 0 }]]);
  });

  it('puts an undirected edge in the lists of both ends', () => {
    const { out, inn } = arcLists(ids, edges, false);
    expect(neighbourLists(out)).toEqual([[1, 2, 2], [0], [0, 0]]);
    expect(out[2]).toEqual([
      { to: 0, edge: 0 },
      { to: 0, edge: 3 },
    ]);
    expect(inn).toEqual([[], [], []]);
  });
});
