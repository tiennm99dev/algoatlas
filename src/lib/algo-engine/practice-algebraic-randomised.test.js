import { describe, expect, it } from 'vitest';
import {
  BIG_PRESETS,
  MAX_COEFF,
  MAX_DIGITS,
  MAX_ORDER,
  PSEUDOCODE,
  RECURRENCE_PRESETS,
  bigTrace,
  digitsOf,
  parseBig,
  recurrenceByLoop,
  recurrenceTrace,
  transitionMatrix,
} from './practice-algebraic-randomised.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @template T @param {T[]} frames @returns {T} */
const last = (frames) => /** @type {T} */ (frames.at(-1));

describe('recurrence to matrix', () => {
  it('puts the coefficients, a shifted identity and the constant row in place', () => {
    expect(transitionMatrix({ coeffs: [2, 3], constant: 5, initial: [1, 1] })).toEqual([
      [2n, 3n, 5n],
      [1n, 0n, 0n],
      [0n, 0n, 1n],
    ]);
    expect(transitionMatrix({ coeffs: [1, 1, 1], constant: 0, initial: [0, 0, 1] })).toEqual([
      [1n, 1n, 1n],
      [1n, 0n, 0n],
      [0n, 1n, 0n],
    ]);
    expect(transitionMatrix({ coeffs: [7], constant: 0, initial: [3] })).toEqual([[7n]]);
  });

  it('agrees with running the recurrence term by term', () => {
    const rand = seeded(4);
    for (let round = 0; round < 200; round++) {
      const k = 1 + Math.floor(rand() * MAX_ORDER);
      const rec = {
        coeffs: Array.from({ length: k }, () => Math.floor(rand() * (MAX_COEFF + 1))),
        constant: rand() < 0.5 ? 0 : Math.floor(rand() * (MAX_COEFF + 1)),
        initial: Array.from({ length: k }, () => Math.floor(rand() * (MAX_COEFF + 1))),
      };
      const n = Math.floor(rand() * 300);
      const mod = 2 + Math.floor(rand() * 1_000_000);
      expect(last(recurrenceTrace(rec, n, mod)).answer).toBe(recurrenceByLoop(rec, n, mod));
    }
  });

  it('knows a few famous values', () => {
    const fib = RECURRENCE_PRESETS.fibonacci.rec;
    expect(last(recurrenceTrace(fib, 90, 1_000_000_007)).answer).toBe(
      String(2880067194370816120n % 1_000_000_007n),
    );
    expect(last(recurrenceTrace(fib, 0, 7)).answer).toBe('0');
    expect(last(recurrenceTrace(fib, 1, 7)).answer).toBe('1');
    // A huge index stays a handful of products: 2⁵⁰ has 51 bits.
    expect(last(recurrenceTrace(fib, 2 ** 50, 1_000_000_007)).matrixProducts).toBe(51);
  });

  it('counts one product per set bit and one square per bit after the first', () => {
    const fib = RECURRENCE_PRESETS.fibonacci.rec;
    for (const n of [1, 2, 7, 100, 1_000_000]) {
      const bits = n.toString(2);
      const ones = [...bits].filter((d) => d === '1').length;
      expect(last(recurrenceTrace(fib, n, 1_000_000_007)).matrixProducts).toBe(
        ones + bits.length - 1,
      );
    }
    expect(last(recurrenceTrace(fib, 0, 7)).matrixProducts).toBe(0);
  });

  it('keeps R = M^covered and P = M^power as it goes', () => {
    const rec = RECURRENCE_PRESETS.constant.rec;
    for (const f of recurrenceTrace(rec, 45, 1_000_000_007)) {
      if (f.kind === 'start' || f.kind === 'row') continue;
      // A multiply frame has used the low bit of e but not yet halved it.
      const left = f.kind === 'multiply' ? f.e - 1 : f.e;
      expect(f.covered + left * f.power).toBe(45);
    }
  });

  it('stays well under 400 frames at the largest index', () => {
    const f = recurrenceTrace(RECURRENCE_PRESETS.tribonacci.rec, 1_000_000_000_000_000, 97);
    expect(f.length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = recurrenceTrace(RECURRENCE_PRESETS.constant.rec, 10, 97);
    const a = frames[6];
    const b = frames[7];
    a.r[0][0] = 'x';
    a.p[0][0] = 'x';
    a.matrix[0][0] = 'x';
    expect(b.r[0][0]).not.toBe('x');
    expect(b.p[0][0]).not.toBe('x');
    expect(b.matrix[0][0]).not.toBe('x');
  });
});

describe('big-number multiplication', () => {
  it('multiplies like BigInt does', () => {
    const rand = seeded(8);
    for (let round = 0; round < 300; round++) {
      /** @param {number} len */
      const num = (len) =>
        String(BigInt(Math.floor(rand() * 10 ** Math.min(len, 15))) * 1000n + BigInt(round))
          .slice(0, len)
          .replace(/^0+(?=\d)/, '');
      const x = num(1 + Math.floor(rand() * MAX_DIGITS));
      const y = num(1 + Math.floor(rand() * MAX_DIGITS));
      expect(last(bigTrace(x, y)).answer).toBe(String(BigInt(x) * BigInt(y)));
    }
    expect(last(bigTrace('0', '987')).answer).toBe('0');
    expect(last(bigTrace('9', '9')).answer).toBe('81');
  });

  it('builds the convolution and counts len(a) · len(b) digit products', () => {
    const f = last(bigTrace(...BIG_PRESETS.small));
    expect(f.c).toEqual([32, 52, 61, 60, 34, 16, 5]);
    expect(f.products).toBe(16);
    expect(last(bigTrace(...BIG_PRESETS.long)).products).toBe(144);
    for (const g of bigTrace(...BIG_PRESETS.carries).filter((x) => x.kind === 'conv')) {
      expect(g.terms.every(([i, j]) => i + j === g.k)).toBe(true);
    }
  });

  it('reads whole numbers and refuses others', () => {
    expect(parseBig('1,234')).toBe('1234');
    expect(parseBig('0')).toBe('0');
    expect(parseBig('012')).toBeNull();
    expect(parseBig('12a')).toBeNull();
    expect(parseBig('1'.repeat(MAX_DIGITS + 1))).toBeNull();
    expect(digitsOf('120')).toEqual([0, 2, 1]);
  });

  it('does not alias frames', () => {
    const frames = bigTrace('99', '99');
    const a = frames[2];
    const b = frames[3];
    a.c.push(1);
    a.digits.push(1);
    a.terms.push([9, 9]);
    expect(b.c).toHaveLength(3);
    expect(b.terms).not.toContainEqual([9, 9]);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of both problems', () => {
    const rec = new Set();
    for (const f of recurrenceTrace(RECURRENCE_PRESETS.constant.rec, 10, 97))
      f.lines.forEach((l) => rec.add(l));
    for (let i = 0; i < PSEUDOCODE.recurrence.length; i++) expect(rec.has(i)).toBe(true);
    const big = new Set();
    for (const f of bigTrace(...BIG_PRESETS.carries)) f.lines.forEach((l) => big.add(l));
    for (let i = 0; i < PSEUDOCODE.bignum.length; i++) expect(big.has(i)).toBe(true);
  });
});
