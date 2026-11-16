import { describe, expect, it } from 'vitest';
import {
  FFT_PRESETS,
  MAX_ABS,
  MAX_COEFFS,
  fftPseudocode,
  fftTrace,
  naiveProduct,
  reverseBits,
  rootOfUnity,
  sizeFor,
} from './fast-fourier-transform.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./fast-fourier-transform.js').FftFrame[]} frames */
const last = (frames) =>
  /** @type {import('./fast-fourier-transform.js').FftFrame} */ (frames.at(-1));

/** A polynomial’s value at a complex point, by Horner’s rule. @param {number[]} p @param {import('./fast-fourier-transform.js').Complex} z */
function evalAt(p, z) {
  let re = 0;
  let im = 0;
  for (let i = p.length - 1; i >= 0; i--) {
    [re, im] = [re * z.re - im * z.im + p[i], re * z.im + im * z.re];
  }
  return { re, im };
}

describe('FFT polynomial product', () => {
  it('matches the schoolbook product on random inputs', () => {
    const rand = seeded(3);
    for (let round = 0; round < 300; round++) {
      const la = 1 + Math.floor(rand() * MAX_COEFFS);
      const lb = 1 + Math.floor(rand() * MAX_COEFFS);
      const pick = () => Math.floor(rand() * (2 * MAX_ABS + 1)) - MAX_ABS;
      const a = Array.from({ length: la }, pick);
      const b = Array.from({ length: lb }, pick);
      expect(last(fftTrace(a, b)).result).toEqual(naiveProduct(a, b));
    }
  });

  it('handles the small and worst cases', () => {
    expect(last(fftTrace([3], [4])).result).toEqual([12]);
    expect(last(fftTrace([0], [5, 1])).result).toEqual([0, 0]);
    expect(last(fftTrace([1, 2], [3, 1])).result).toEqual([3, 7, 2]);
    expect(last(fftTrace([3, 2, 1], [6, 5, 4])).result).toEqual([18, 27, 28, 13, 4]);
    const nines = Array(MAX_COEFFS).fill(-MAX_ABS);
    expect(last(fftTrace(nines, nines)).result).toEqual(naiveProduct(nines, nines));
  });

  it('evaluates each polynomial at the n-th roots of unity', () => {
    const { a, b } = FFT_PRESETS.cubes;
    const f = last(fftTrace(a, b));
    const n = f.n;
    for (let k = 0; k < n; k++) {
      const w = rootOfUnity(k, n);
      const va = evalAt(a, w);
      const vb = evalAt(b, w);
      expect(f.fa?.[k].re).toBeCloseTo(va.re, 9);
      expect(f.fa?.[k].im).toBeCloseTo(va.im, 9);
      expect(f.fb?.[k].re).toBeCloseTo(vb.re, 9);
      expect(f.fb?.[k].im).toBeCloseTo(vb.im, 9);
    }
  });

  it('picks n and counts n/2 · log₂ n butterflies per transform', () => {
    expect(sizeFor(1)).toBe(1);
    expect(sizeFor(3)).toBe(4);
    expect(sizeFor(8)).toBe(8);
    expect(sizeFor(9)).toBe(16);
    expect(last(fftTrace([1, 2], [3, 1])).n).toBe(4);
    expect(last(fftTrace([1, 2], [3, 1])).butterflies).toBe(3 * 4);
    expect(last(fftTrace([1, 1, 1], [1, 1, 1])).n).toBe(8);
    expect(last(fftTrace([1, 1, 1], [1, 1, 1])).butterflies).toBe(3 * 12);
    const long = FFT_PRESETS.longest;
    expect(last(fftTrace(long.a, long.b)).butterflies).toBe(3 * 32);
    expect(last(fftTrace(long.a, long.b)).naive).toBe(64);
    expect(last(fftTrace([5], [7])).butterflies).toBe(0);
  });

  it('reverses bits', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((i) => reverseBits(i, 3))).toEqual([
      0, 4, 2, 6, 1, 5, 3, 7,
    ]);
    expect(fftTrace([1, 2, 3], [1, 1, 1])[1].order).toEqual([0, 4, 2, 6, 1, 5, 3, 7]);
  });

  it('fills each stage column pair by pair, with the twiddle of its block', () => {
    const frames = fftTrace([1, 2], [3, 1]);
    const firstStage2 = frames.find((f) => f.phase === 'a' && f.stage === 2);
    expect(firstStage2?.top).toBe(0);
    expect(firstStage2?.bottom).toBe(2);
    expect(firstStage2?.root).toBe(0);
    const second = frames[frames.indexOf(/** @type {any} */ (firstStage2)) + 1];
    expect(second.top).toBe(1);
    expect(second.bottom).toBe(3);
    expect(second.root).toBe(1);
    expect(second.twiddle).toEqual({ re: 0, im: 1 });
    const inverse = frames.filter((f) => f.phase === 'inverse' && f.stage === 2);
    expect(inverse[1].root).toBe(3);
  });

  it('shows A(1) = sum of coefficients in output 0', () => {
    const f = last(fftTrace([2, 0, -1, 3], [1, -2, 0, 4]));
    expect(f.fa?.[0]).toEqual({ re: 4, im: 0 });
    expect(f.fb?.[0]).toEqual({ re: 3, im: 0 });
    expect(f.prod?.[0]).toEqual({ re: 12, im: 0 });
  });
});

describe('frames', () => {
  it('start and end as the contract says, and stay small at the caps', () => {
    for (const { a, b } of Object.values(FFT_PRESETS)) {
      const f = fftTrace(a, b);
      expect(f[0].kind).toBe('start');
      expect(f.at(-1)?.kind).toBe('done');
      expect(f.length).toBeLessThan(400);
    }
  });

  it('do not alias each other', () => {
    const f = fftTrace([1, 2, 3], [4, 5]);
    const later = JSON.stringify(f[5]);
    const z = f[4].columns[0][0];
    if (z) z.re = 99;
    f[4].order[0] = 99;
    f[4].a[0] = 99;
    expect(JSON.stringify(f[5])).toBe(later);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const seen = new Set(fftTrace([1, 2], [3, 1]).flatMap((f) => f.lines));
    fftPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
