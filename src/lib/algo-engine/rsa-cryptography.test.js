import { describe, expect, it } from 'vitest';
import {
  KEY_DIGITS,
  MAX_PRIME,
  RSA_PRESETS,
  attackPseudocode,
  attackTrace,
  euclidRows,
  gcd,
  isPrime,
  powerSteps,
  rsaPseudocode,
  rsaTrace,
  smallestExponent,
  trialYearsExponent,
  validExponent,
} from './rsa-cryptography.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** The power in exact arithmetic. @param {number} a @param {number} e @param {number} m */
function powExact(a, e, m) {
  return Number(BigInt(a) ** BigInt(e) % BigInt(m));
}

/** @template T @param {T[]} frames @returns {T} */
const end = (frames) => /** @type {T} */ (frames.at(-1));

const primes = Array.from({ length: MAX_PRIME - 2 }, (_, i) => i + 3).filter(isPrime);

describe('RSA trace', () => {
  it('gets the textbook values for p = 61, q = 53', () => {
    const f = end(rsaTrace(61, 53, 17, 65));
    expect(f.n).toBe(3233);
    expect(f.phi).toBe(3120);
    expect(f.d).toBe(2753);
    expect(f.c).toBe(2790);
    expect(f.recovered).toBe(65);
  });

  it('recovers every message for a small key, including multiples of p or q', () => {
    const [p, q, e] = [5, 11, 3];
    for (let M = 0; M < p * q; M++) {
      const f = end(rsaTrace(p, q, e, M));
      expect(f.recovered, `M = ${M}`).toBe(M);
      expect(f.c).toBe(powExact(M, e, p * q));
    }
  });

  it('round-trips on random keys and makes d a true inverse', () => {
    const rand = seeded(11);
    for (let round = 0; round < 200; round++) {
      const p = primes[Math.floor(rand() * primes.length)];
      let q = primes[Math.floor(rand() * primes.length)];
      if (q === p) q = p === 3 ? 5 : 3;
      const phi = (p - 1) * (q - 1);
      const e = smallestExponent(phi);
      const M = Math.floor(rand() * p * q);
      const f = end(rsaTrace(p, q, e, M));
      expect((e * /** @type {number} */ (f.d)) % phi).toBe(1);
      expect(f.d).toBeGreaterThan(0);
      expect(f.d).toBeLessThan(phi);
      expect(f.recovered).toBe(M);
    }
  });

  it('counts one squaring per bit and one multiplication per set bit', () => {
    const f = end(rsaTrace(3, 11, 3, 2));
    expect(f.d).toBe(7);
    // e = 11 in binary: 2 bits, both set. d = 111 in binary: 3 bits, all set.
    expect(f.multiplications).toBe(4 + 6);
  });

  it('reveals each value only from its own step', () => {
    const f = rsaTrace(61, 53, 17, 65);
    expect(f[0].n).toBeNull();
    expect(f.find((x) => x.kind === 'phi')?.d).toBeNull();
    expect(f.find((x) => x.kind === 'keys')?.c).toBeNull();
    expect(f.find((x) => x.kind === 'keys')?.d).toBe(2753);
    expect(f.find((x) => x.kind === 'cipher')?.recovered).toBeNull();
  });

  it('stays under the frame cap at the largest key', () => {
    for (const { p, q, e, M } of Object.values(RSA_PRESETS)) {
      expect(rsaTrace(p, q, e, M).length).toBeLessThan(400);
      expect(M).toBeLessThan(p * q);
      expect(validExponent(e, (p - 1) * (q - 1))).toBe(true);
    }
  });
});

describe('exponent helpers', () => {
  it('pick a valid smallest exponent for every toy φ', () => {
    for (const p of primes) {
      for (const q of primes) {
        if (p === q) continue;
        const phi = (p - 1) * (q - 1);
        expect(validExponent(smallestExponent(phi), phi)).toBe(true);
      }
    }
  });

  it('refuse a bad exponent', () => {
    expect(validExponent(1, 20)).toBe(false);
    expect(validExponent(20, 20)).toBe(false);
    expect(validExponent(4, 20)).toBe(false);
    expect(validExponent(2.5, 20)).toBe(false);
    expect(validExponent(3, 20)).toBe(true);
  });

  it('compute gcd and the Euclid table', () => {
    expect(gcd(3120, 17)).toBe(1);
    expect(gcd(20, 8)).toBe(4);
    const { rows, d } = euclidRows(17, 3120);
    expect(d).toBe(2753);
    expect(rows.at(-1)?.r).toBe(1);
    for (const row of rows) expect(Math.abs((row.t * 17 - row.r) % 3120)).toBe(0);
  });

  it('power steps agree with the exact power', () => {
    expect(powerSteps(65, 17, 3233).at(-1)?.result).toBe(powExact(65, 17, 3233));
    expect(powerSteps(2790, 2753, 3233).at(-1)?.result).toBe(65);
    expect(powerSteps(5, 13, 7).map((s) => s.multiplied)).toEqual([true, false, true, true]);
  });
});

describe('attack trace', () => {
  it('factors n, rebuilds d and reads the message', () => {
    const f = end(attackTrace(3233, 17, 2790));
    expect([f.p, f.q]).toEqual([53, 61]);
    expect(f.phi).toBe(3120);
    expect(f.d).toBe(2753);
    expect(f.M).toBe(65);
  });

  it('counts the trial divisions up to the smaller prime', () => {
    expect(end(attackTrace(3233, 17, 2790)).trials).toBe(1 + (53 - 1) / 2);
    expect(end(attackTrace(33, 3, 8)).trials).toBe(2);
    expect(end(attackTrace(33, 3, 8)).M).toBe(2);
  });

  it('breaks the key the owner built, whichever prime is smaller', () => {
    const rand = seeded(3);
    for (let round = 0; round < 60; round++) {
      const p = primes[Math.floor(rand() * primes.length)];
      let q = primes[Math.floor(rand() * primes.length)];
      if (q === p) q = p === 3 ? 5 : 3;
      const e = smallestExponent((p - 1) * (q - 1));
      const M = Math.floor(rand() * p * q);
      const owner = end(rsaTrace(p, q, e, M));
      const f = end(attackTrace(p * q, e, /** @type {number} */ (owner.c)));
      expect(f.M).toBe(M);
      expect(f.p).toBe(Math.min(p, q));
    }
  });

  it('stays under the frame cap', () => {
    expect(attackTrace(499 * 491, 17, 5).length).toBeLessThan(400);
  });
});

describe('factoring scale', () => {
  it('grows by a factor of ten every two digits', () => {
    expect(trialYearsExponent(22) - trialYearsExponent(20)).toBeCloseTo(1);
    expect(trialYearsExponent(6)).toBeLessThan(0);
    expect(trialYearsExponent(617)).toBeGreaterThan(290);
    expect(KEY_DIGITS).toContain(617);
  });
});

describe('frames', () => {
  it('start and end as the contract says', () => {
    for (const f of [rsaTrace(3, 11, 3, 2), attackTrace(33, 3, 8)]) {
      expect(f[0].kind).toBe('start');
      expect(f.at(-1)?.kind).toBe('done');
    }
  });

  it('do not alias each other', () => {
    const f = rsaTrace(61, 53, 17, 65);
    const i = f.findIndex((x) => x.kind === 'encrypt');
    const later = JSON.stringify(f[i + 1]);
    /** @type {any} */ (f[i].power).bits[0] = -1;
    f[i - 1].euclid[0].r = -1;
    expect(JSON.stringify(f[i + 1])).toBe(later);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of the RSA code', () => {
    const seen = new Set(rsaTrace(3, 11, 3, 2).flatMap((f) => f.lines));
    rsaPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });

  it('highlights every line of the attack code', () => {
    const seen = new Set(attackTrace(33, 3, 8).flatMap((f) => f.lines));
    attackPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
