import { describe, expect, it } from 'vitest';
import { fabs, fadd, fcmp, fdiv, fmul, frac, fsub, fvalue, isZero } from './rational.js';

describe('exact fractions', () => {
  it('keeps lowest terms with a positive denominator', () => {
    expect(frac(6, -8)).toEqual({ num: -3, den: 4 });
    expect(frac(0, -5)).toEqual({ num: 0, den: 1 });
    expect(Object.is(frac(0, -5).num, -0)).toBe(false);
    expect(() => frac(1, 0)).toThrow();
  });

  it('adds, subtracts, multiplies and divides exactly', () => {
    const half = frac(1, 2);
    const third = frac(1, 3);
    expect(fadd(half, third)).toEqual(frac(5, 6));
    expect(fsub(third, half)).toEqual(frac(-1, 6));
    expect(fmul(half, frac(2, 3))).toEqual(third);
    expect(fdiv(half, third)).toEqual(frac(3, 2));
  });

  it('compares, takes absolute values and converts to a number', () => {
    expect(fcmp(frac(2, 3), frac(3, 4))).toBeLessThan(0);
    expect(fcmp(frac(2, 4), frac(1, 2))).toBe(0);
    expect(fabs(frac(-7, 5))).toEqual(frac(7, 5));
    expect(isZero(fsub(frac(1, 2), frac(2, 4)))).toBe(true);
    expect(fvalue(frac(3, 4))).toBe(0.75);
  });
});
