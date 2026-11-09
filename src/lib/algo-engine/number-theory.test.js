import { describe, expect, it } from 'vitest';
import { gcd, isPrime, powMod } from './number-theory.js';

describe('gcd', () => {
  it('finds the greatest common divisor', () => {
    expect(gcd(12, 18)).toBe(6);
    expect(gcd(17, 5)).toBe(1);
    expect(gcd(7, 0)).toBe(7);
    expect(gcd(0, 0)).toBe(0);
  });
});

describe('isPrime', () => {
  it('tells primes from the rest', () => {
    expect([1, 2, 3, 4, 17, 21, 97].map(isPrime)).toEqual([
      false,
      true,
      true,
      false,
      true,
      false,
      true,
    ]);
    expect(isPrime(2.5)).toBe(false);
    expect(isPrime(-7)).toBe(false);
  });
});

describe('powMod', () => {
  it('raises to a power modulo m', () => {
    expect(powMod(3, 4, 7)).toBe(81 % 7);
    expect(powMod(2, 10, 1000)).toBe(24);
    expect(powMod(5, 0, 13)).toBe(1);
    expect(powMod(5, 3, 1)).toBe(0);
  });

  it('agrees with plain powers', () => {
    const bad = [];
    for (let a = 0; a < 12; a++)
      for (let e = 0; e < 8; e++)
        for (const m of [2, 7, 11, 97]) if (powMod(a, e, m) !== a ** e % m) bad.push([a, e, m]);
    expect(bad).toEqual([]);
  });
});
