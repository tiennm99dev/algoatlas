import { describe, expect, it } from 'vitest';
import { indexPairs } from './plain-edges.js';

describe('indexPairs', () => {
  it('numbers vertices by sorted id and keeps edges in input order', () => {
    expect(
      indexPairs(
        [7, 3, 5],
        [
          { from: 7, to: 3 },
          { from: 3, to: 5 },
        ],
      ),
    ).toEqual({
      n: 3,
      pairs: [
        [2, 0],
        [0, 1],
      ],
    });
  });

  it('drops loops, unknown ids and repeated edges in either direction', () => {
    const { pairs } = indexPairs(
      [1, 2, 3],
      [
        { from: 1, to: 2 },
        { from: 2, to: 1 },
        { from: 3, to: 3 },
        { from: 1, to: 9 },
        { from: 2, to: 3 },
      ],
    );
    expect(pairs).toEqual([
      [0, 1],
      [1, 2],
    ]);
  });
});
