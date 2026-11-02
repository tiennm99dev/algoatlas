import { describe, expect, it } from 'vitest';
import {
  MAX_BASE,
  MAX_EXPONENT,
  MAX_MODULUS,
  POW_PRESETS,
  powPseudocode,
  powTrace,
  powerDigits,
} from './modular-exponentiation.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./modular-exponentiation.js').PowFrame[]} frames */
const last = (frames) =>
  /** @type {import('./modular-exponentiation.js').PowFrame} */ (frames.at(-1));

/** The power by repeated multiplication, in exact arithmetic. @param {number} a @param {number} e @param {number} m */
function powerByHand(a, e, m) {
  let out = 1n % BigInt(m);
  for (let i = 0; i < e; i++) out = (out * BigInt(a)) % BigInt(m);
  return Number(out);
}

describe('binary exponentiation trace', () => {
  it('agrees with repeated multiplication on random inputs', () => {
    const rand = seeded(5);
    for (let round = 0; round < 400; round++) {
      const a = Math.floor(rand() * MAX_BASE);
      const e = Math.floor(rand() * 2000);
      const m = 1 + Math.floor(rand() * MAX_MODULUS);
      expect(last(powTrace(a, e, m)).result).toBe(powerByHand(a, e, m));
    }
  });

  it('gets the known value of 2 to the power 10^9 and stays in range at the caps', () => {
    expect(last(powTrace(2, 1_000_000_000, 1_000_000_007)).result).toBe(140625001);
    expect(last(powTrace(MAX_BASE, MAX_EXPONENT, MAX_MODULUS)).result).toBeGreaterThanOrEqual(0);
  });

  it('obeys Fermat’s little theorem for a prime modulus', () => {
    for (const a of [1, 2, 3, 12, 999]) {
      expect(last(powTrace(a, 1_000_000_006, 1_000_000_007)).result).toBe(1);
    }
    expect(last(powTrace(7, 12, 13)).result).toBe(1);
  });

  it('handles the edge cases', () => {
    expect(last(powTrace(5, 0, 7)).result).toBe(1);
    expect(last(powTrace(0, 0, 7)).result).toBe(1);
    expect(last(powTrace(0, 5, 7)).result).toBe(0);
    expect(last(powTrace(5, 3, 1)).result).toBe(0);
    expect(last(powTrace(5, 0, 1)).result).toBe(0);
    expect(last(powTrace(5, 0, 7)).bits).toEqual([0]);
    expect(last(powTrace(14, 2, 7)).result).toBe(0);
  });

  it('counts one multiplication per bit plus one per set bit', () => {
    expect(last(powTrace(3, 13, 7)).multiplications).toBe(7);
    expect(last(powTrace(2, 1024, 1000)).multiplications).toBe(12);
    expect(last(powTrace(5, 255, 1000)).multiplications).toBe(16);
    expect(last(powTrace(5, 0, 7)).multiplications).toBe(0);
    expect(last(powTrace(2, 1_000_000_000, 1_000_000_007)).multiplications).toBe(43);
  });

  it('keeps result ≡ a^covered and x ≡ a^(2^k) on every frame', () => {
    const [a, m] = [3, 1009];
    for (const f of powTrace(a, 45, m)) {
      expect(f.result).toBe(powerByHand(a, f.covered, m));
      for (const row of f.rows) expect(row.x).toBe(powerByHand(a, row.power, m));
    }
    expect(last(powTrace(a, 45, m)).covered).toBe(45);
  });

  it('reads the bits of the exponent', () => {
    const f = last(powTrace(3, 13, 7));
    expect(f.bits).toEqual([1, 1, 0, 1]);
    expect(f.rows.map((row) => row.bit)).toEqual([1, 0, 1, 1]);
    expect(f.used).toEqual([1, 4, 8]);
  });

  it('reports the size of the largest product, far below the full power', () => {
    const f = last(powTrace(2, 1_000_000_000, 1_000_000_007));
    expect(f.productDigits).toBeLessThanOrEqual(19);
    expect(powerDigits(2, 1_000_000_000)).toBe(301029996);
  });
});

describe('powerDigits', () => {
  it('matches the digits of the exact power', () => {
    for (const [a, e] of [
      [2, 10],
      [10, 3],
      [999, 7],
      [7, 100],
      [100, 2],
      [1000, 5],
      [3, 1],
      [12, 0],
    ]) {
      expect(powerDigits(a, e)).toBe((BigInt(a) ** BigInt(e)).toString().length);
    }
    expect(powerDigits(0, 5)).toBe(1);
    expect(powerDigits(1, 5)).toBe(1);
  });
});

describe('frames', () => {
  it('start and end as the contract says, and stay small at the caps', () => {
    for (const { a, e, m } of Object.values(POW_PRESETS)) {
      const f = powTrace(a, e, m);
      expect(f[0].kind).toBe('start');
      expect(f.at(-1)?.kind).toBe('done');
    }
    expect(powTrace(MAX_BASE, 2 ** 29 - 1, MAX_MODULUS).length).toBeLessThan(400);
    expect(powTrace(MAX_BASE, MAX_EXPONENT, MAX_MODULUS).length).toBeLessThan(400);
  });

  it('do not alias each other', () => {
    const f = powTrace(3, 13, 7);
    const later = JSON.stringify(f[3]);
    f[2].rows[0].x = -1;
    f[2].bits[0] = -1;
    f[2].used.push(-1);
    expect(JSON.stringify(f[3])).toBe(later);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const seen = new Set(powTrace(3, 13, 7).flatMap((f) => f.lines));
    powPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
