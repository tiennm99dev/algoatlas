import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  SPARSE_OPS,
  floorLog2,
  foldRange,
  parseSparseValues,
  sparsePseudocode,
  sparseTrace,
} from './sparse-table.js';
import { gcd } from '$lib/algo-engine/number-theory.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {() => number} rand @param {number} n */
const randomValues = (rand, n) => Array.from({ length: n }, () => Math.floor(rand() * 100));

/** Table cells for an array of n: the sum over k of n − 2^k + 1. @param {number} n */
function expectedCells(n) {
  let total = 0;
  for (let k = 0; 1 << k <= n; k++) total += n - (1 << k) + 1;
  return total;
}

describe('sparse table queries', () => {
  it.each(['min', 'max', 'gcd'])(
    'answers every range of random arrays like a linear scan with %s',
    (op) => {
      const rand = seeded(11);
      for (const n of [1, 2, 3, 7, 8, 13, 16]) {
        const a = randomValues(rand, n);
        for (let l = 0; l < n; l++) {
          for (let r = l; r < n; r++) {
            const last = sparseTrace(a, l, r, /** @type {'min'} */ (op)).at(-1);
            expect(last?.result).toBe(foldRange(a, l, r, /** @type {'min'} */ (op)));
          }
        }
      }
    },
  );

  it('handles duplicates and an all-zero gcd', () => {
    expect(sparseTrace([4, 4, 4, 4], 0, 3, 'min').at(-1)?.result).toBe(4);
    expect(sparseTrace([0, 0, 0], 0, 2, 'gcd').at(-1)?.result).toBe(0);
    expect(sparseTrace([0, 12, 18], 0, 2, 'gcd').at(-1)?.result).toBe(6);
  });

  it('uses two blocks that cover the range exactly and always overlap', () => {
    const a = [5, 2, 4, 7, 1, 3, 6, 8];
    for (let l = 0; l < a.length; l++) {
      for (let r = l; r < a.length; r++) {
        const last = /** @type {import('./sparse-table.js').SparseFrame} */ (
          sparseTrace(a, l, r, 'min').at(-1)
        );
        const size = 1 << last.level;
        expect(last.leftAt).toBe(l);
        expect(last.rightAt + size - 1).toBe(r);
        expect(last.rightAt).toBeLessThanOrEqual(last.leftAt + size);
        expect(last.overlap).toBeGreaterThan(0);
        expect(last.overlap).toBe(2 * size - (r - l + 1));
      }
    }
  });

  it('counts the overlap twice under sum, which is why sum cannot use it', () => {
    const a = [5, 2, 4, 7, 1, 3, 6, 8];
    const last = /** @type {import('./sparse-table.js').SparseFrame} */ (
      sparseTrace(a, 1, 6, 'sum').at(-1)
    );
    // Blocks a[1..4] and a[3..6] share a[3] and a[4].
    expect(last.truth).toBe(2 + 4 + 7 + 1 + 3 + 6);
    expect(last.result).toBe(last.truth + 7 + 1);
  });
});

describe('sparse table costs', () => {
  it.each([1, 2, 5, 8, 16])('fills the expected cells for n = %i', (n) => {
    const a = Array.from({ length: n }, (_, i) => i);
    const last = /** @type {import('./sparse-table.js').SparseFrame} */ (
      sparseTrace(a, 0, n - 1, 'max').at(-1)
    );
    expect(last.filled).toBe(expectedCells(n));
    expect(last.merges).toBe(expectedCells(n) - n);
    expect(last.table.flat().filter((v) => v !== null)).toHaveLength(expectedCells(n));
  });

  it('reads exactly two cells for any query', () => {
    const a = [9, 1, 8, 2, 7, 3, 6, 4];
    expect(sparseTrace(a, 0, 7, 'min').at(-1)?.reads).toBe(2);
    expect(sparseTrace(a, 3, 3, 'min').at(-1)?.reads).toBe(2);
  });

  it('keeps the trace small at the size cap', () => {
    const a = Array.from({ length: MAX_N }, (_, i) => i);
    expect(sparseTrace(a, 0, MAX_N - 1, 'min').length).toBeLessThan(60);
  });
});

describe('sparse table helpers', () => {
  it('computes floor of log base 2', () => {
    expect([1, 2, 3, 4, 7, 8, 16].map(floorLog2)).toEqual([0, 1, 1, 2, 2, 3, 4]);
  });

  it('computes gcd with zero', () => {
    expect(gcd(0, 5)).toBe(5);
    expect(gcd(12, 18)).toBe(6);
  });

  it('parses values and names each kind of refusal', () => {
    expect(parseSparseValues('3, 1 4')).toEqual({ values: [3, 1, 4] });
    expect(parseSparseValues('')).toEqual({ error: 'format' });
    expect(parseSparseValues('3, x')).toEqual({ error: 'format' });
    expect(parseSparseValues('100')).toEqual({ error: 'range' });
    expect(parseSparseValues(Array(17).fill(1).join(' '))).toEqual({ error: 'count' });
  });
});

describe('sparse table frames', () => {
  it('starts and ends with the agreed kinds', () => {
    const frames = sparseTrace([1, 2, 3], 0, 2, 'min');
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });

  it('does not alias the input or other frames', () => {
    const input = [3, 1, 2, 5];
    const frames = sparseTrace(input, 0, 3, 'min');
    const before = JSON.stringify(frames[2]);
    frames[1].items[0] = 99;
    frames[1].table[0][0] = 99;
    expect(JSON.stringify(frames[2])).toBe(before);
    expect(input).toEqual([3, 1, 2, 5]);
  });

  it('offers every operation', () => {
    for (const op of SPARSE_OPS) {
      expect(sparseTrace([1, 2], 0, 1, op).at(-1)?.result).not.toBeNull();
    }
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const seen = new Set(sparseTrace([5, 2, 4, 7], 0, 2, 'min').flatMap((f) => f.lines));
    sparsePseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
