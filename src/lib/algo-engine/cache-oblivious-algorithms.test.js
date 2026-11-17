import { describe, expect, it } from 'vitest';
import {
  BLOCK_SIZES,
  SIZES,
  addressOf,
  blockBoxes,
  blockOf,
  recursivePseudocode,
  rowsPseudocode,
  transposeTrace,
  visitOrder,
} from './cache-oblivious-algorithms.js';

/** @typedef {import('./cache-oblivious-algorithms.js').TransposeSetup} TransposeSetup */

/**
 * Misses of an LRU cache of `c` blocks on a sequence of block ids, counted with recency stamps.
 * @param {number[]} seq @param {number} c
 */
function lruMisses(seq, c) {
  /** @type {Map<number, number>} */
  const stamp = new Map();
  let misses = 0;
  seq.forEach((b, t) => {
    if (!stamp.has(b)) {
      misses++;
      if (stamp.size === c) {
        let oldest = -1;
        let when = Infinity;
        for (const [k, v] of stamp) if (v < when) [oldest, when] = [k, v];
        stamp.delete(oldest);
      }
    }
    stamp.set(b, t);
  });
  return misses;
}

/** @param {TransposeSetup} s */
function accesses(s) {
  return visitOrder(s.order, s.n).flatMap(({ i, j }) => [
    blockOf(s, 'A', i, j),
    blockOf(s, 'B', j, i),
  ]);
}

/** @param {TransposeSetup} s */
const last = (s) =>
  /** @type {import('./cache-oblivious-algorithms.js').TransposeFrame} */ (
    transposeTrace(s).at(-1)
  );

describe('layouts', () => {
  it('give every cell its own address', () => {
    for (const n of SIZES) {
      for (const layout of /** @type {const} */ (['row', 'z'])) {
        const seen = new Set();
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) seen.add(addressOf(layout, n, i, j));
        expect(seen.size).toBe(n * n);
        expect(Math.max(...seen)).toBe(n * n - 1);
      }
    }
  });

  it('stores each quadrant contiguously in Z order', () => {
    // The top-left 2 × 2 square of a 4 × 4 matrix is the first four words.
    expect([
      addressOf('z', 4, 0, 0),
      addressOf('z', 4, 0, 1),
      addressOf('z', 4, 1, 0),
      addressOf('z', 4, 1, 1),
    ]).toEqual([0, 1, 2, 3]);
    expect(addressOf('z', 4, 0, 2)).toBe(4);
    expect(addressOf('z', 4, 2, 0)).toBe(8);
  });

  it('draws every block as a box of exactly B cells', () => {
    const s = /** @type {TransposeSetup} */ ({
      n: 8,
      block: 8,
      cache: 4,
      order: 'rows',
      layout: 'z',
    });
    for (const m of /** @type {const} */ (['A', 'B'])) {
      const boxes = blockBoxes(s, m);
      expect(boxes).toHaveLength(8);
      for (const b of boxes) expect((b.bottom - b.top + 1) * (b.right - b.left + 1)).toBe(8);
    }
  });
});

describe('transpose traces', () => {
  it('visit every cell exactly once in both orders', () => {
    for (const order of /** @type {const} */ (['rows', 'recursive'])) {
      const cells = visitOrder(order, 8).map(({ i, j }) => i * 8 + j);
      expect(new Set(cells).size).toBe(64);
    }
    expect(
      visitOrder('recursive', 4)
        .slice(0, 4)
        .map(({ i, j }) => [i, j]),
    ).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]);
  });

  it('count the same misses as an independent LRU simulation', () => {
    for (const n of SIZES) {
      for (const block of BLOCK_SIZES.filter((b) => b <= n)) {
        for (const cache of [2, 3, 5, 8, 16]) {
          for (const order of /** @type {const} */ (['rows', 'recursive'])) {
            for (const layout of /** @type {const} */ (['row', 'z'])) {
              const s = { n, block, cache, order, layout };
              const f = last(s);
              expect(f.missA + f.missB).toBe(lruMisses(accesses(s), cache));
              expect(f.copied).toBe(n * n);
              expect(f.missA + f.missB).toBeGreaterThanOrEqual((2 * n * n) / block);
            }
          }
        }
      }
    }
  });

  it('show the row-by-row loop missing on every write of B when the cache is small', () => {
    const f = last({ n: 8, block: 4, cache: 4, order: 'rows', layout: 'row' });
    expect(f.missA).toBe(16);
    expect(f.missB).toBe(64);
    // With room for a whole column of B's blocks plus one of A's, it reaches the ideal.
    const big = last({ n: 8, block: 4, cache: 17, order: 'rows', layout: 'row' });
    expect(big.missA + big.missB).toBe(32);
  });

  it('reach 2N²/B transfers with the recursive order once the cache is tall enough', () => {
    for (const n of SIZES) {
      for (const block of BLOCK_SIZES.filter((b) => b <= n)) {
        const z = last({ n, block, cache: 4, order: 'recursive', layout: 'z' });
        expect(z.missA + z.missB).toBe((2 * n * n) / block);
        const row = last({ n, block, cache: 2 * block, order: 'recursive', layout: 'row' });
        expect(row.missA + row.missB).toBe((2 * n * n) / block);
      }
    }
  });

  it('keep at most C blocks and report evictions', () => {
    const frames = transposeTrace({ n: 8, block: 2, cache: 3, order: 'rows', layout: 'row' });
    for (const f of frames) expect(f.cache.length).toBeLessThanOrEqual(3);
    const evictions = frames.reduce((sum, f) => sum + f.evicted.length, 0);
    const end = frames[frames.length - 1];
    expect(evictions).toBe(end.missA + end.missB - end.cache.length);
    expect(frames[0].kind).toBe('start');
    expect(end.kind).toBe('done');
  });

  it('record frames that do not alias each other', () => {
    const frames = transposeTrace({ n: 4, block: 2, cache: 2, order: 'rows', layout: 'row' });
    frames[1].cache.push(99);
    frames[1].lines.push(99);
    expect(frames[2].cache).not.toContain(99);
    expect(frames[2].lines).not.toContain(99);
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['rows', rowsPseudocode],
    ['recursive', recursivePseudocode],
  ])('%s highlights every line', (order, code) => {
    const frames = transposeTrace({
      n: 4,
      block: 2,
      cache: 4,
      order: /** @type {import('./cache-oblivious-algorithms.js').Traversal} */ (order),
      layout: 'row',
    });
    const seen = new Set(frames.flatMap((f) => f.lines));
    code.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
