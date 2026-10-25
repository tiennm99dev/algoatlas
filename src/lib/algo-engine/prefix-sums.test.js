import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  MAX_UPDATES,
  applyDirectly,
  differenceTrace,
  formatUpdates,
  parsePrefixValues,
  parseUpdates,
  prefixPseudocode,
  prefixTrace,
} from './prefix-sums.js';

/** @typedef {import('./prefix-sums.js').PrefixFrame} PrefixFrame */
/** @typedef {import('./prefix-sums.js').RangeUpdate} RangeUpdate */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {PrefixFrame[]} frames */
const last = (frames) => /** @type {PrefixFrame} */ (frames.at(-1));

/** @param {number[]} a @param {number} l @param {number} r */
const loopSum = (a, l, r) => {
  let t = 0;
  for (let i = l; i <= r; i++) t += a[i];
  return t;
};

const rand = seeded(13);
/** @param {number} lo @param {number} hi */
const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const randomArrays = Array.from({ length: 25 }, () =>
  Array.from({ length: int(1, MAX_N) }, () => int(-99, 99)),
);

describe('prefix sums', () => {
  it('answers every range of a random array like a loop does', () => {
    for (const a of randomArrays) {
      const P = /** @type {number[]} */ (last(prefixTrace(a, 0, 0)).prefix);
      for (let i = 0; i <= a.length; i++) expect(P[i]).toBe(loopSum(a, 0, i - 1));
      for (let l = 0; l < a.length; l++)
        for (let r = l; r < a.length; r++)
          expect(last(prefixTrace(a, l, r)).result).toBe(loopSum(a, l, r));
    }
  });

  it('gives P[5] = 14 and a[2..5] = 23 − 4 = 19 for [3, 1, 4, 1, 5, 9, 2, 6]', () => {
    const f = last(prefixTrace([3, 1, 4, 1, 5, 9, 2, 6], 2, 5));
    expect(f.prefix).toEqual([0, 3, 4, 8, 9, 14, 23, 25, 31]);
    expect(f.result).toBe(19);
    expect(f.lookups).toBe(2);
    expect(f.naive).toBe(4);
    expect(f.additions).toBe(9);
  });

  it('fills P one entry per build frame', () => {
    const frames = prefixTrace([5, -2, 7], 0, 2);
    const builds = frames.filter((f) => f.kind === 'build');
    expect(builds.map((f) => f.prefix.filter((x) => x !== null).length)).toEqual([2, 3, 4]);
    expect(frames[0].kind).toBe('start');
    expect(last(frames).kind).toBe('done');
    expect(last(frames).result).toBe(10);
  });
});

describe('difference array', () => {
  it('agrees with applying every update directly', () => {
    for (const a of randomArrays) {
      const n = a.length;
      /** @type {RangeUpdate[]} */
      const updates = Array.from({ length: int(0, MAX_UPDATES) }, () => {
        const l = int(0, n - 1);
        return { l, r: int(l, n - 1), v: int(-99, 99) };
      });
      const f = last(differenceTrace(a, updates));
      expect(f.out).toEqual(applyDirectly(a, updates));
      expect(f.writes).toBeLessThanOrEqual(2 * updates.length);
      expect(f.naive).toBe(updates.reduce((t, u) => t + u.r - u.l + 1, 0));
    }
  });

  it('turns two updates on zeros into D = [0, 5, 2, 0, −5, 0]', () => {
    const frames = differenceTrace(
      [0, 0, 0, 0, 0, 0],
      [
        { l: 1, r: 3, v: 5 },
        { l: 2, r: 5, v: 2 },
      ],
    );
    const f = last(frames);
    expect(f.diff).toEqual([0, 5, 2, 0, -5, 0]);
    expect(f.out).toEqual([0, 5, 7, 7, 2, 2]);
    expect(f.writes).toBe(3);
    const skip = frames.filter((x) => x.kind === 'update-right').map((x) => x.skipped);
    expect(skip).toEqual([false, true]);
  });

  it('rebuilds the original array when there are no updates', () => {
    const a = [4, -1, 7, 7, 0];
    const f = last(differenceTrace(a, []));
    expect(f.diff).toEqual([4, -5, 8, 0, -7]);
    expect(f.out).toEqual(a);
  });
});

describe('parsing', () => {
  it('reads values with Unicode minus signs', () => {
    expect(parsePrefixValues('3, −1 4')).toEqual({ values: [3, -1, 4] });
    expect(parsePrefixValues('')).toEqual({ error: 'format' });
    expect(parsePrefixValues('3, 100')).toEqual({ error: 'range' });
    expect(parsePrefixValues(Array.from({ length: MAX_N + 1 }, () => '1').join(','))).toEqual({
      error: 'count',
    });
  });

  it('reads and writes updates', () => {
    expect(parseUpdates('1 3 5, 2 5 −2', 6)).toEqual({
      updates: [
        { l: 1, r: 3, v: 5 },
        { l: 2, r: 5, v: -2 },
      ],
    });
    expect(parseUpdates('  ', 6)).toEqual({ updates: [] });
    expect(parseUpdates('1 3', 6)).toEqual({ error: 'format' });
    expect(parseUpdates('3 1 5', 6)).toEqual({ error: 'range' });
    expect(parseUpdates('1 6 5', 6)).toEqual({ error: 'range' });
    expect(
      parseUpdates(Array.from({ length: MAX_UPDATES + 1 }, () => '0 0 1').join(';'), 2),
    ).toEqual({ error: 'count' });
    expect(formatUpdates([{ l: 1, r: 3, v: -2 }])).toBe('1 3 -2');
  });
});

describe('frame independence', () => {
  it('does not share arrays between frames', () => {
    const frames = differenceTrace([1, 2, 3], [{ l: 0, r: 1, v: 4 }]);
    frames[1].diff[0] = 99;
    frames[1].out[0] = 99;
    frames[1].items[0] = 99;
    expect(frames[2].diff[0]).toBe(1);
    expect(frames[2].items[0]).toBe(1);
    const p = prefixTrace([1, 2], 0, 1);
    p[1].prefix[0] = 99;
    expect(p[2].prefix[0]).toBe(0);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of the prefix sums', () => {
    const seen = new Set(prefixTrace([1, 2, 3], 0, 1).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(prefixPseudocode.prefix.map((_, i) => i));
  });

  it('highlights every line of the difference array', () => {
    const seen = new Set(
      differenceTrace([1, 2, 3], [{ l: 0, r: 1, v: 4 }]).flatMap((f) => f.lines),
    );
    expect([...seen].sort((a, b) => a - b)).toEqual(prefixPseudocode.difference.map((_, i) => i));
  });
});
