import { describe, expect, it } from 'vitest';
import { boundPseudocode, boundTrace, makeSortedArrayWithDuplicates } from './lower-upper-bound.js';

/** Seeded LCG so random arrays are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number[]} a @param {number} x @param {'lower'|'upper'} v */
const answerOf = (a, x, v) => /** @type {number} */ (boundTrace(a, x, v).at(-1)?.answer);

/** Every non-decreasing array of length 0-5 over {1,2,3}. */
function* allArrays() {
  /** @param {number[]} prefix @returns {Generator<number[]>} */
  function* extend(prefix) {
    yield prefix;
    if (prefix.length === 5) return;
    for (let v = prefix.at(-1) ?? 1; v <= 3; v++) yield* extend([...prefix, v]);
  }
  yield* extend([]);
}

describe('boundTrace', () => {
  it('matches a linear scan for every small array and target', () => {
    for (const a of allArrays()) {
      for (let x = 0; x <= 4; x++) {
        const lower = a.findIndex((v) => v >= x);
        const upper = a.findIndex((v) => v > x);
        const lo = answerOf(a, x, 'lower');
        const up = answerOf(a, x, 'upper');
        expect(lo).toBe(lower === -1 ? a.length : lower);
        expect(up).toBe(upper === -1 ? a.length : upper);
        expect(up - lo).toBe(a.filter((v) => v === x).length);
      }
    }
  });

  it('answers 0 for an empty array', () => {
    expect(answerOf([], 5, 'lower')).toBe(0);
    expect(answerOf([], 5, 'upper')).toBe(0);
  });

  it('keeps lo <= hi and probes inside the window', () => {
    const a = [2, 5, 5, 5, 8, 11, 11, 14, 17, 17, 17, 17, 20, 23, 26];
    for (const variant of /** @type {const} */ (['lower', 'upper'])) {
      for (const f of boundTrace(a, 17, variant)) {
        expect(f.lo).toBeLessThanOrEqual(f.hi);
        if (f.kind === 'probe') {
          expect(f.mid).toBeGreaterThanOrEqual(f.lo);
          expect(f.mid).toBeLessThan(f.hi);
        }
      }
    }
  });

  it('ends with exactly one done frame that carries the answer', () => {
    const frames = boundTrace([1, 2, 2, 4], 2, 'lower');
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.at(-1)?.answer).toBeGreaterThanOrEqual(0);
    expect(frames.filter((f) => f.kind === 'done')).toHaveLength(1);
    expect(frames.slice(0, -1).every((f) => f.answer === -1)).toBe(true);
  });

  it('never reads more than ceil(log2(n + 1)) cells', () => {
    for (let n = 0; n <= 64; n++) {
      const a = makeSortedArrayWithDuplicates(n, seeded(n + 1));
      const cap = Math.ceil(Math.log2(n + 1));
      for (const x of [0, a[Math.floor(n / 2)] ?? 0, 999]) {
        for (const variant of /** @type {const} */ (['lower', 'upper'])) {
          expect(boundTrace(a, x, variant).at(-1)?.comparisons).toBeLessThanOrEqual(cap);
        }
      }
    }
  });

  it('gives 0 below every value and n above every value', () => {
    const a = [4, 4, 6, 9];
    for (const variant of /** @type {const} */ (['lower', 'upper'])) {
      expect(answerOf(a, 1, variant)).toBe(0);
      expect(answerOf(a, 99, variant)).toBe(a.length);
    }
  });

  it('handles a run of equal values touching either end', () => {
    expect([answerOf([3, 3, 3, 5], 3, 'lower'), answerOf([3, 3, 3, 5], 3, 'upper')]).toEqual([
      0, 3,
    ]);
    expect([answerOf([1, 3, 3, 3], 3, 'lower'), answerOf([1, 3, 3, 3], 3, 'upper')]).toEqual([
      1, 4,
    ]);
  });

  it('does not alias frames to each other', () => {
    const frames = boundTrace([1, 2, 3], 2, 'lower');
    expect(new Set(frames.map((f) => f.lines)).size).toBe(frames.length);
  });
});

describe('makeSortedArrayWithDuplicates', () => {
  it('returns n non-decreasing values, deterministically', () => {
    const a = makeSortedArrayWithDuplicates(24, seeded(5));
    expect(a).toHaveLength(24);
    for (let i = 1; i < a.length; i++) expect(a[i]).toBeGreaterThanOrEqual(a[i - 1]);
    expect(makeSortedArrayWithDuplicates(24, seeded(5))).toEqual(a);
    expect(makeSortedArrayWithDuplicates(0)).toEqual([]);
  });

  it('produces duplicates for some seed', () => {
    const a = makeSortedArrayWithDuplicates(24, seeded(2));
    expect(new Set(a).size).toBeLessThan(a.length);
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['lower', 'upper']))(
    '%s trace highlights every pseudocode line',
    (variant) => {
      const a = [2, 5, 5, 5, 8, 11, 11, 14, 17, 17, 17, 17, 20, 23, 26];
      const frames = [17, 1, 99].flatMap((x) => boundTrace(a, x, variant));
      const seen = new Set(frames.flatMap((f) => f.lines));
      expect([...seen].sort((p, q) => p - q)).toEqual(boundPseudocode[variant].map((_, i) => i));
    },
  );

  it('the two pseudocode arrays differ only at the test line', () => {
    const diff = boundPseudocode.lower.flatMap((l, i) => (l === boundPseudocode.upper[i] ? [] : i));
    expect(diff).toEqual([3]);
  });
});
