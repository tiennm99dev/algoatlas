import { describe, expect, it } from 'vitest';
import {
  LIS_EXAMPLE,
  MAX_ABS,
  MAX_N,
  lisPseudocode,
  lisTrace,
  parseLisValues,
} from './longest-increasing-subsequence.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Longest strictly increasing subsequence length over every subset. @param {number[]} a */
function lisBrute(a) {
  let best = 0;
  for (let mask = 1; mask < 1 << a.length; mask++) {
    let last = -Infinity;
    let len = 0;
    let ok = true;
    for (let i = 0; i < a.length && ok; i++)
      if (mask & (1 << i)) {
        ok = a[i] > last;
        last = a[i];
        len++;
      }
    if (ok) best = Math.max(best, len);
  }
  return best;
}

/** @param {number[]} a @param {number[]} idx */
function isIncreasing(a, idx) {
  return idx.every((k, t) => t === 0 || (k > idx[t - 1] && a[k] > a[idx[t - 1]]));
}

const METHODS = /** @type {const} */ (['dp', 'patience']);

describe.each(METHODS)('%s', (method) => {
  it('rebuilds a longest increasing subsequence of the example', () => {
    const last = lisTrace(method, LIS_EXAMPLE).at(-1);
    expect(last?.kind).toBe('done');
    expect(last?.length).toBe(6);
    // The DP keeps the first best predecessor; patience keeps the pile top it last saw.
    expect(last?.lis.map((k) => LIS_EXAMPLE[k])).toEqual(
      method === 'dp' ? [10, 22, 33, 50, 60, 80] : [10, 22, 33, 41, 60, 80],
    );
  });

  it('matches brute force on edge and random inputs', () => {
    const rand = seeded(method === 'dp' ? 4 : 8);
    const cases = [[5], [1, 1, 1], [1, 2, 3, 4], [4, 3, 2, 1], [2, 2, 3, 3, 1, 4]];
    for (let t = 0; t < 60; t++)
      cases.push(Array.from({ length: 1 + (t % MAX_N) }, () => Math.floor(rand() * 21) - 10));
    for (const a of cases) {
      const last = lisTrace(method, a).at(-1);
      expect(last?.length).toBe(lisBrute(a));
      expect(last?.lis).toHaveLength(lisBrute(a));
      expect(isIncreasing(a, last?.lis ?? [])).toBe(true);
    }
  });

  it('stays under 400 frames at the cap', () => {
    expect(
      lisTrace(
        method,
        Array.from({ length: MAX_N }, (_, i) => i),
      ).length,
    ).toBeLessThan(400);
  });
});

describe('O(n²) DP', () => {
  it('compares every pair once', () => {
    for (const n of [1, 2, 5, MAX_N]) {
      const a = Array.from({ length: n }, (_, i) => (i * 7) % 5);
      expect(lisTrace('dp', a).at(-1)?.comparisons).toBe((n * (n - 1)) / 2);
    }
  });

  it('keeps L and prev for each end point', () => {
    const last = lisTrace('dp', [3, 1, 4, 1, 5]).at(-1);
    expect(last?.L).toEqual([1, 1, 2, 1, 3]);
    expect(last?.prev).toEqual([-1, -1, 0, -1, 2]);
  });
});

describe('patience sorting', () => {
  it('keeps one pile and one comparison per value on a falling sequence', () => {
    const last = lisTrace('patience', [9, 7, 5, 3, 1]).at(-1);
    expect(last?.piles).toEqual([[0, 1, 2, 3, 4]]);
    expect(last?.comparisons).toBe(4);
  });

  it('binary searches the pile tops with half-open bounds', () => {
    const frames = lisTrace('patience', [1, 5, 9, 4]);
    const probes = frames.filter((f) => f.kind === 'probe' && f.i === 3);
    expect(probes.map((f) => [f.lo, f.hi, f.mid])).toEqual([
      [0, 3, 1],
      [0, 1, 0],
    ]);
    const place = frames.find((f) => f.kind === 'place' && f.i === 3);
    expect(place?.pile).toBe(1);
    expect(place?.prev[3]).toBe(0);
    expect(frames.at(-1)?.piles).toEqual([[0], [1, 3], [2]]);
  });

  it('puts equal values on the same pile, so the subsequence is strict', () => {
    expect(lisTrace('patience', [2, 2, 2]).at(-1)?.piles).toEqual([[0, 1, 2]]);
  });
});

describe('parseLisValues', () => {
  it('reads commas, spaces and minus signs', () => {
    expect(parseLisValues('3, −1 4')).toEqual({ values: [3, -1, 4] });
  });
  it('refuses bad input', () => {
    expect(parseLisValues('1, b')).toEqual({ error: 'format' });
    expect(parseLisValues('')).toEqual({ error: 'count' });
    expect(parseLisValues('1 '.repeat(MAX_N + 1))).toEqual({ error: 'count' });
    expect(parseLisValues(String(MAX_ABS + 1))).toEqual({ error: 'range' });
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const input = [3, 1, 2];
    const frames = lisTrace('patience', input);
    const before = JSON.stringify(frames[4]);
    frames[3].piles[0].push(9);
    frames[3].values[0] = 9;
    frames[3].prev[0] = 9;
    frames[3].L[0] = 9;
    frames[3].lines.push(9);
    input[0] = 42;
    expect(JSON.stringify(frames[4])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it.each(METHODS)('%s highlights every line', (method) => {
    const used = new Set(lisTrace(method, LIS_EXAMPLE).flatMap((f) => f.lines));
    lisPseudocode[method].forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
