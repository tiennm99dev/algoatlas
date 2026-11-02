import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  SIEVE_PRESETS,
  crossingCount,
  sievePseudocode,
  sieveTrace,
} from './sieve-factorisation.js';

/** @typedef {import('./sieve-factorisation.js').SieveFrame} SieveFrame */
/** @param {SieveFrame[]} frames */
const last = (frames) => /** @type {SieveFrame} */ (frames.at(-1));

/** The smallest factor, read straight off the definition. @param {number} v */
function smallestFactor(v) {
  for (let d = 2; d * d <= v; d++) if (v % d === 0) return d;
  return v;
}

describe('sieve trace', () => {
  it('finds exactly the primes up to n, for every n', () => {
    for (let n = 2; n <= MAX_N; n++) {
      const expected = [];
      for (let v = 2; v <= n; v++) if (smallestFactor(v) === v) expected.push(v);
      for (const from of /** @type {const} */ (['square', 'double'])) {
        expect(last(sieveTrace(n, 2, from)).primes).toEqual(expected);
      }
    }
  });

  it('fills the smallest prime factor of every number', () => {
    const { spf } = last(sieveTrace(MAX_N, 2));
    for (let v = 2; v <= MAX_N; v++) expect(spf[v]).toBe(smallestFactor(v));
    expect(spf[0]).toBe(0);
    expect(spf[1]).toBe(0);
  });

  it('factorises every x into primes in rising order', () => {
    for (let x = 2; x <= MAX_N; x++) {
      const { factors, rest, primes } = last(sieveTrace(MAX_N, x));
      expect(factors.reduce((p, f) => p * f, 1)).toBe(x);
      expect(rest).toBe(1);
      expect(factors).toEqual(factors.slice().sort((a, b) => a - b));
      for (const f of factors) expect(primes).toContain(f);
    }
    expect(last(sieveTrace(60, 60)).factors).toEqual([2, 2, 3, 5]);
    expect(last(sieveTrace(100, 97)).factors).toEqual([97]);
  });

  it('counts crossings on known inputs', () => {
    const square = last(sieveTrace(30, 30, 'square'));
    expect(square.crossings).toBe(24);
    expect(square.repeats).toBe(5);
    const double = last(sieveTrace(30, 30, 'double'));
    expect(double.crossings).toBe(28);
    expect(double.repeats).toBe(9);
    expect(crossingCount(30, 'square')).toBe(24);
    expect(crossingCount(30, 'double')).toBe(28);
  });

  it('crosses out each composite at least once, and nothing else', () => {
    const f = last(sieveTrace(100, 2));
    for (let v = 2; v <= 100; v++) expect(f.crossed[v]).toBe(smallestFactor(v) !== v);
    expect(f.crossings - f.repeats).toBe(100 - 1 - 25);
  });

  it('starts each prime’s crossing at p·p', () => {
    const f = sieveTrace(50, 2);
    const firsts = f.filter((x) => x.kind === 'prime').map((x) => x.s);
    expect(firsts).toEqual([4, 9, 25, 49]);
  });

  it('stops at the square root', () => {
    const f = sieveTrace(100, 2);
    const reached = f.filter((x) => x.kind === 'prime' || x.kind === 'skip').map((x) => x.p);
    expect(reached).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('handles the smallest inputs', () => {
    const f = last(sieveTrace(2, 2));
    expect(f.primes).toEqual([2]);
    expect(f.factors).toEqual([2]);
    expect(f.crossings).toBe(0);
    expect(last(sieveTrace(3, 3)).primes).toEqual([2, 3]);
  });

  it('stays within the frame budget at the cap', () => {
    for (const from of /** @type {const} */ (['square', 'double'])) {
      expect(sieveTrace(MAX_N, 192, from).length).toBeLessThan(400);
    }
  });
});

describe('frames', () => {
  it('start and end as the contract says', () => {
    for (const { n, x } of Object.values(SIEVE_PRESETS)) {
      const f = sieveTrace(n, x);
      expect(f[0].kind).toBe('start');
      expect(f.at(-1)?.kind).toBe('done');
    }
  });

  it('do not alias each other', () => {
    const f = sieveTrace(30, 30);
    const later = JSON.stringify(f[3]);
    f[2].spf[4] = -1;
    f[2].crossed[4] = false;
    f[2].primes.push(-1);
    f[2].factors.push(-1);
    expect(JSON.stringify(f[3])).toBe(later);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const seen = new Set(sieveTrace(30, 30).flatMap((f) => f.lines));
    sievePseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
