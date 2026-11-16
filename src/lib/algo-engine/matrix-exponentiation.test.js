import { describe, expect, it } from 'vitest';
import {
  MATRIX_PRESETS,
  MAX_EXACT_N,
  MAX_MODULUS,
  MAX_N,
  RECURRENCES,
  matrixPowPseudocode,
  matrixPowTrace,
  recurrenceByLoop,
  transitionMatrix,
} from './matrix-exponentiation.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./matrix-exponentiation.js').MatrixPowFrame[]} frames */
const last = (frames) =>
  /** @type {import('./matrix-exponentiation.js').MatrixPowFrame} */ (frames.at(-1));

/**
 * Fibonacci numbers by fast doubling, an independent route to F(n) mod m:
 * F(2k) = F(k)·(2F(k+1) − F(k)) and F(2k+1) = F(k)² + F(k+1)².
 * @param {bigint} n @param {bigint} m
 * @returns {[bigint, bigint]} F(n) and F(n + 1)
 */
function fibPair(n, m) {
  if (n === 0n) return [0n, 1n % m];
  const [a, b] = fibPair(n / 2n, m);
  const c = (a * ((2n * b - a + m) % m)) % m;
  const d = (a * a + b * b) % m;
  return n % 2n === 0n ? [c, d] : [d, (c + d) % m];
}

/** Plain matrix power by repeated multiplication. @param {bigint[][]} M @param {number} n */
function slowPower(M, n) {
  /** @type {bigint[][]} */
  let R = M.map((row, i) => row.map((_, j) => (i === j ? 1n : 0n)));
  for (let t = 0; t < n; t++)
    R = R.map((row) => M[0].map((_, j) => row.reduce((s, x, q) => s + x * M[q][j], 0n)));
  return R.map((row) => row.map(String));
}

describe('matrix exponentiation trace', () => {
  it('gets the known Fibonacci numbers', () => {
    const fib = RECURRENCES.fibonacci;
    expect(last(matrixPowTrace(fib, 0, null)).answer).toBe('0');
    expect(last(matrixPowTrace(fib, 1, null)).answer).toBe('1');
    expect(last(matrixPowTrace(fib, 2, null)).answer).toBe('1');
    expect(last(matrixPowTrace(fib, 10, null)).answer).toBe('55');
    expect(last(matrixPowTrace(fib, 90, null)).answer).toBe('2880067194370816120');
    const f1000 = last(matrixPowTrace(fib, 1000, null)).answer;
    expect(f1000).toHaveLength(209);
    expect(f1000.startsWith('43466557686937456435')).toBe(true);
  });

  it('agrees with running the recurrence forward, exact and modular', () => {
    const rand = seeded(7);
    for (const rec of Object.values(RECURRENCES)) {
      for (let round = 0; round < 40; round++) {
        const n = Math.floor(rand() * 400);
        const mod = 2 + Math.floor(rand() * (MAX_MODULUS - 2));
        expect(last(matrixPowTrace(rec, n, null)).answer).toBe(recurrenceByLoop(rec, n, null));
        expect(last(matrixPowTrace(rec, n, mod)).answer).toBe(recurrenceByLoop(rec, n, mod));
      }
    }
    expect(last(matrixPowTrace(RECURRENCES.pell, 10, null)).answer).toBe('2378');
    expect(last(matrixPowTrace(RECURRENCES.tribonacci, 20, null)).answer).toBe('35890');
  });

  it('agrees with fast doubling for huge n', () => {
    const rand = seeded(11);
    for (let round = 0; round < 30; round++) {
      const n = Math.floor(rand() * MAX_N);
      const mod = 2 + Math.floor(rand() * (MAX_MODULUS - 2));
      const [fn] = fibPair(BigInt(n), BigInt(mod));
      expect(last(matrixPowTrace(RECURRENCES.fibonacci, n, mod)).answer).toBe(fn.toString());
    }
  });

  it('keeps R = M^covered and P = M^power on every frame', () => {
    const M = transitionMatrix(RECURRENCES.tribonacci.coeffs);
    for (const f of matrixPowTrace(RECURRENCES.tribonacci, 45, null)) {
      expect(f.r).toEqual(slowPower(M, f.covered));
      expect(f.p).toEqual(slowPower(M, f.power));
    }
    expect(last(matrixPowTrace(RECURRENCES.tribonacci, 45, null)).covered).toBe(45);
  });

  it('builds the transition matrix and start vector', () => {
    const f = matrixPowTrace(RECURRENCES.tribonacci, 5, null)[0];
    expect(f.matrix).toEqual([
      ['1', '1', '1'],
      ['1', '0', '0'],
      ['0', '1', '0'],
    ]);
    expect(f.start).toEqual(['1', '0', '0']);
    expect(f.r).toEqual([
      ['1', '0', '0'],
      ['0', '1', '0'],
      ['0', '0', '1'],
    ]);
  });

  it('counts one square per bit after the first and one product per set bit', () => {
    const fib = RECURRENCES.fibonacci;
    expect(last(matrixPowTrace(fib, 10, null)).matrixProducts).toBe(5);
    expect(last(matrixPowTrace(fib, 10, null)).scalarProducts).toBe(40);
    expect(last(matrixPowTrace(fib, 1000, null)).matrixProducts).toBe(15);
    expect(last(matrixPowTrace(fib, 1, null)).matrixProducts).toBe(1);
    expect(last(matrixPowTrace(fib, 0, null)).matrixProducts).toBe(0);
    expect(last(matrixPowTrace(fib, 255, 97)).matrixProducts).toBe(15);
    expect(last(matrixPowTrace(RECURRENCES.tribonacci, 20, null)).scalarProducts).toBe(6 * 27);
  });

  it('keeps entries below the modulus and reports digit growth when exact', () => {
    const f = last(matrixPowTrace(RECURRENCES.fibonacci, MAX_N, MAX_MODULUS));
    for (const row of f.r) for (const x of row) expect(BigInt(x) < BigInt(MAX_MODULUS)).toBe(true);
    expect(f.digits).toBeLessThanOrEqual(10);
    expect(last(matrixPowTrace(RECURRENCES.fibonacci, MAX_EXACT_N, null)).digits).toBe(209);
  });
});

describe('recurrenceByLoop', () => {
  it('returns the initial values below the order', () => {
    expect(recurrenceByLoop(RECURRENCES.tribonacci, 0, null)).toBe('0');
    expect(recurrenceByLoop(RECURRENCES.tribonacci, 2, null)).toBe('1');
    expect(recurrenceByLoop(RECURRENCES.fibonacci, 10, 7)).toBe('6');
  });
});

describe('frames', () => {
  it('start and end as the contract says, and stay small at the caps', () => {
    for (const { rec, n, mod } of Object.values(MATRIX_PRESETS)) {
      const f = matrixPowTrace(RECURRENCES[rec], n, mod);
      expect(f[0].kind).toBe('start');
      expect(f.at(-1)?.kind).toBe('done');
    }
    expect(matrixPowTrace(RECURRENCES.tribonacci, MAX_N, MAX_MODULUS).length).toBeLessThan(400);
    expect(matrixPowTrace(RECURRENCES.fibonacci, 2 ** 50 - 1, MAX_MODULUS).length).toBeLessThan(
      400,
    );
  });

  it('do not alias each other', () => {
    const f = matrixPowTrace(RECURRENCES.fibonacci, 13, null);
    const later = JSON.stringify(f[3]);
    f[2].r[0][0] = 'x';
    f[2].p[1][1] = 'x';
    f[2].bits[0] = -1;
    f[2].used.push(-1);
    f[2].matrix[0][0] = 'x';
    expect(JSON.stringify(f[3])).toBe(later);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const seen = new Set(matrixPowTrace(RECURRENCES.fibonacci, 13, null).flatMap((f) => f.lines));
    matrixPowPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
