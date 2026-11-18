import { describe, expect, it } from 'vitest';
import { fadd, fcmp, fdiv, frac, fmul, fsub } from './rational.js';
import {
  LUP_PRESETS,
  MAX_ENTRY,
  MAX_SIZE,
  MIN_SIZE,
  luPseudocode,
  lupPseudocode,
  lupTrace,
  splitFactors,
} from './lup-decomposition.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./rational.js').Frac} Frac */
/** @typedef {import('./lup-decomposition.js').LupFrame} LupFrame */

/** @param {LupFrame[]} frames */
const last = (frames) => /** @type {LupFrame} */ (frames.at(-1));

/** Determinant by the Leibniz formula over all permutations. @param {number[][]} a */
function det(a) {
  const n = a.length;
  /** @param {number[]} perm @param {number[]} rest @returns {number} */
  const go = (perm, rest) => {
    if (rest.length === 0) {
      let inversions = 0;
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) if (perm[i] > perm[j]) inversions++;
      return (inversions % 2 ? -1 : 1) * perm.reduce((p, c, r) => p * a[r][c], 1);
    }
    return rest.reduce(
      (s, c) =>
        s +
        go(
          [...perm, c],
          rest.filter((x) => x !== c),
        ),
      0,
    );
  };
  return go(
    [],
    Array.from({ length: n }, (_, i) => i),
  );
}

/** @param {Frac[][]} p @param {Frac[][]} q */
const matMul = (p, q) =>
  p.map((row) => q[0].map((_, j) => row.reduce((s, v, t) => fadd(s, fmul(v, q[t][j])), frac(0))));

/** @param {() => number} rand @param {number} n */
function randomMatrix(rand, n) {
  return Array.from({ length: n }, () =>
    Array.from({ length: n }, () => Math.floor(rand() * (2 * MAX_ENTRY + 1)) - MAX_ENTRY),
  );
}

describe('fractions', () => {
  it('stay in lowest terms with a positive denominator', () => {
    expect(frac(6, -4)).toEqual({ num: -3, den: 2 });
    expect(frac(0, -5)).toEqual({ num: 0, den: 1 });
    expect(fadd(frac(1, 2), frac(1, 3))).toEqual({ num: 5, den: 6 });
    expect(fsub(frac(1, 2), frac(1, 2))).toEqual({ num: 0, den: 1 });
    expect(fdiv(frac(3, 4), frac(-3, 8))).toEqual({ num: -2, den: 1 });
    expect(fcmp(frac(2, 3), frac(3, 5))).toBeGreaterThan(0);
    expect(() => frac(1, 0)).toThrow();
  });
});

describe('LUP decomposition trace', () => {
  it('solves the CLRS example exactly', () => {
    const { a, b } = LUP_PRESETS.clrs;
    const f = last(lupTrace(a, b, true));
    expect(f.failed).toBe(false);
    expect(f.x).toEqual([frac(-7, 5), frac(11, 5), frac(3, 5)]);
    expect(f.perm).toEqual([2, 0, 1]);
    expect(f.swaps).toBe(2);
  });

  it('gives P·A = L·U and A·x = b on random invertible matrices, and refuses singular ones', () => {
    const rand = seeded(9);
    let singular = 0;
    for (let round = 0; round < 400; round++) {
      const n = MIN_SIZE + Math.floor(rand() * (MAX_SIZE - MIN_SIZE + 1));
      const a = randomMatrix(rand, n);
      if (round % 25 === 0) a[n - 1] = a[0].map((v) => 2 * v);
      const b = Array.from({ length: n }, () => Math.floor(rand() * 19) - 9);
      const f = last(lupTrace(a, b, true));
      if (det(a) === 0) {
        singular++;
        expect(f.failed).toBe(true);
        continue;
      }
      expect(f.failed).toBe(false);
      const { L, U, P } = splitFactors(f);
      const A = a.map((row) => row.map((v) => frac(v)));
      expect(matMul(P, A)).toEqual(matMul(L, U));
      const x = /** @type {Frac[]} */ (f.x);
      const ax = A.map((row) => row.reduce((s, v, j) => fadd(s, fmul(v, x[j])), frac(0)));
      expect(ax).toEqual(b.map((v) => frac(v)));
      for (let i = 1; i < n; i++)
        for (let j = 0; j < i; j++)
          expect(fcmp(f.a[i][j], frac(1)) <= 0 && fcmp(f.a[i][j], frac(-1)) >= 0).toBe(true);
    }
    expect(singular).toBeGreaterThan(10);
  });

  it('without pivoting fails on a zero pivot that partial pivoting avoids', () => {
    const { a, b } = LUP_PRESETS.zeroPivot;
    const plain = last(lupTrace(a, b, false));
    expect(plain.failed).toBe(true);
    expect(lupTrace(a, b, false).some((f) => f.kind === 'stuck' && f.k === 0)).toBe(true);
    const pivoted = last(lupTrace(a, b, true));
    expect(pivoted.failed).toBe(false);
    expect(pivoted.x).toEqual([frac(1), frac(1), frac(1)]);
  });

  it('without pivoting matches LUP when no pivot is zero, with no swaps', () => {
    const { a, b } = LUP_PRESETS.fourByFour;
    const plain = last(lupTrace(a, b, false));
    expect(plain.failed).toBe(false);
    expect(plain.swaps).toBe(0);
    expect(plain.perm).toEqual([0, 1, 2, 3]);
    expect(plain.x).toEqual([frac(1), frac(1), frac(1), frac(1)]);
    expect(plain.a).toEqual(
      [
        [2, 1, 1, 0],
        [2, 1, 1, 1],
        [4, 3, 2, 2],
        [3, 4, 1, 2],
      ].map((row) => row.map((v) => frac(v))),
    );
  });

  it('stops on a singular matrix', () => {
    const { a, b } = LUP_PRESETS.singular;
    const frames = lupTrace(a, b, true);
    expect(last(frames).failed).toBe(true);
    expect(frames.find((f) => f.kind === 'stuck')?.k).toBe(2);
  });

  it('counts the work: n³/3-ish to factor, n² to solve', () => {
    const { a, b } = LUP_PRESETS.fourByFour;
    const f = last(lupTrace(a, b, false));
    // Column k does (n − k − 1) divisions and (n − k − 1)² updates: 3 + 9, 2 + 4, 1 + 1.
    expect(f.factorOps).toBe(20);
    // Forward: 0 + 1 + 2 + 3 products; back: 3 + 2 + 1 + 0 products and 4 divisions.
    expect(f.solveOps).toBe(16);
    expect(
      last(
        lupTrace(
          [
            [1, 2],
            [3, 4],
          ],
          [5, 11],
          true,
        ),
      ).factorOps,
    ).toBe(2);
  });
});

describe('frames', () => {
  it('start and end as the contract says, and stay small at the caps', () => {
    for (const { a, b } of Object.values(LUP_PRESETS)) {
      for (const pivoting of [true, false]) {
        const f = lupTrace(a, b, pivoting);
        expect(f[0].kind).toBe('start');
        expect(f.at(-1)?.kind).toBe('done');
        expect(f.length).toBeLessThan(400);
      }
    }
  });

  it('do not alias each other', () => {
    const f = lupTrace(LUP_PRESETS.clrs.a, LUP_PRESETS.clrs.b, true);
    const later = JSON.stringify(f[3]);
    f[2].a[0][0].num = 99;
    f[2].perm[0] = 99;
    f[2].b[0].num = 99;
    expect(JSON.stringify(f[3])).toBe(later);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of both variants', () => {
    const { a, b } = LUP_PRESETS.clrs;
    const seen = new Set(lupTrace(a, b, true).flatMap((f) => f.lines));
    lupPseudocode.forEach((_, i) => expect(seen.has(i), `LUP line ${i}`).toBe(true));
    const plain = new Set(lupTrace(a, b, false).flatMap((f) => f.lines));
    luPseudocode.forEach((_, i) => expect(plain.has(i), `LU line ${i}`).toBe(true));
  });
});
