import { describe, expect, it } from 'vitest';
import { GCD_PRESETS, MAX_VALUE, gcdPseudocode, gcdTrace } from './gcd-extended-euclid.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./gcd-extended-euclid.js').GcdFrame[]} frames */
const last = (frames) => /** @type {import('./gcd-extended-euclid.js').GcdFrame} */ (frames.at(-1));

/** The largest common divisor, read straight off the definition. @param {number} a @param {number} b */
function gcdByDefinition(a, b) {
  for (let d = Math.min(a, b); d > 1; d--) if (a % d === 0 && b % d === 0) return d;
  return 1;
}

/** @param {() => number} rand */
const value = (rand) => 1 + Math.floor(rand() * MAX_VALUE);

describe('extended Euclid trace', () => {
  it('finds the gcd and Bézout coefficients on random pairs', () => {
    const rand = seeded(7);
    for (let round = 0; round < 500; round++) {
      const [a, b] = [value(rand), value(rand)];
      const f = last(gcdTrace(a, b, 0));
      expect(f.g).toBe(gcdByDefinition(a, b));
      expect(a * /** @type {number} */ (f.x) + b * /** @type {number} */ (f.y)).toBe(f.g);
    }
  });

  it('computes the textbook table for 240 and 46', () => {
    const f = last(gcdTrace(240, 46, 10));
    expect(f.rows.map((row) => row.r)).toEqual([240, 46, 10, 6, 4, 2, 0]);
    expect(f.rows.map((row) => row.q)).toEqual([null, null, 5, 4, 1, 1, 2]);
    expect([f.g, f.x, f.y]).toEqual([2, -9, 47]);
    expect(f.divisions).toBe(5);
    expect(f.subtractions).toBe(13);
  });

  it('keeps r = s·a + t·b on every row', () => {
    const f = last(gcdTrace(233, 144, 1));
    for (const row of f.rows) expect(row.s * 233 + row.t * 144).toBe(row.r);
  });

  it('spends a first division on the swap when a < b', () => {
    const f = gcdTrace(46, 240, 10);
    expect(f[1].q).toBe(0);
    expect(f[1].squares).toEqual([]);
    expect(last(f).g).toBe(2);
    expect(last(f).divisions).toBe(6);
  });

  it('handles equal values and a value of one', () => {
    expect(last(gcdTrace(7, 7, 7)).g).toBe(7);
    expect(last(gcdTrace(7, 7, 7)).divisions).toBe(1);
    expect(last(gcdTrace(999, 1, 1)).subtractions).toBe(999);
    expect(last(gcdTrace(1, 1, 0)).g).toBe(1);
  });

  it('needs the most divisions on consecutive Fibonacci numbers', () => {
    const fib = last(gcdTrace(233, 144, 1)).divisions;
    expect(fib).toBe(11);
    for (let a = 1; a <= 233; a += 7) {
      for (let b = 1; b <= 144; b += 5) {
        expect(last(gcdTrace(a, b, 0)).divisions).toBeLessThanOrEqual(fib + 1);
      }
    }
  });
});

describe('tiling', () => {
  it('covers the rectangle with squares, leaving nothing, on random pairs', () => {
    const rand = seeded(11);
    for (let round = 0; round < 200; round++) {
      const [a, b] = [value(rand), value(rand)];
      const f = last(gcdTrace(a, b, 0));
      const area = f.squares.reduce((sum, sq) => sum + sq.side * sq.side, 0);
      expect(area).toBe(a * b);
      expect(f.rest.w * f.rest.h).toBe(0);
      for (const sq of f.squares) {
        expect(sq.x + sq.side).toBeLessThanOrEqual(a);
        expect(sq.y + sq.side).toBeLessThanOrEqual(b);
      }
      expect(f.squares.at(-1)?.side).toBe(f.g);
      expect(f.squares.length).toBe(f.subtractions);
    }
  });

  it('never overlaps two squares', () => {
    const { squares } = last(gcdTrace(240, 46, 10));
    for (const [i, p] of squares.entries()) {
      for (const q of squares.slice(i + 1)) {
        const apart =
          p.x + p.side <= q.x || q.x + q.side <= p.x || p.y + p.side <= q.y || q.y + q.side <= p.y;
        expect(apart).toBe(true);
      }
    }
  });
});

describe('linear Diophantine equations', () => {
  it('agrees with a brute-force search about whether a solution exists', () => {
    const rand = seeded(13);
    for (let round = 0; round < 200; round++) {
      const a = 1 + Math.floor(rand() * 30);
      const b = 1 + Math.floor(rand() * 30);
      const c = Math.floor(rand() * 121) - 60;
      let brute = false;
      for (let x = -40; x <= 40 && !brute; x++) brute = (c - a * x) % b === 0;
      expect(last(gcdTrace(a, b, c)).solvable).toBe(brute);
    }
  });

  it('gives solutions that satisfy the equation, for every k', () => {
    const rand = seeded(17);
    for (let round = 0; round < 200; round++) {
      const [a, b] = [value(rand), value(rand)];
      const g = /** @type {number} */ (last(gcdTrace(a, b, 0)).g);
      const c = g * (Math.floor(rand() * 41) - 20);
      const f = last(gcdTrace(a, b, c));
      const [x0, y0, dx, dy] = /** @type {number[]} */ ([f.x0, f.y0, f.stepX, f.stepY]);
      for (const k of [-3, -1, 0, 2, 5]) expect(a * (x0 + k * dx) + b * (y0 - k * dy)).toBe(c);
      const [sx, sy] = /** @type {number[]} */ ([f.smallX, f.smallY]);
      expect(a * sx + b * sy).toBe(c);
      expect(sx).toBeGreaterThanOrEqual(0);
      expect(sx).toBeLessThan(dx);
    }
  });

  it('solves the worked cases', () => {
    const seven = last(gcdTrace(7, 5, 3));
    expect([seven.smallX, seven.smallY]).toEqual([4, -5]);
    const classic = last(gcdTrace(240, 46, 10));
    expect([classic.x0, classic.y0]).toEqual([-45, 235]);
    expect([classic.smallX, classic.smallY]).toEqual([1, -5]);
    expect(last(gcdTrace(6, 9, 7)).solvable).toBe(false);
    const zero = last(gcdTrace(6, 9, 0));
    expect([zero.x0, zero.y0]).toEqual([0, 0]);
    expect(Object.is(zero.x0, 0)).toBe(true);
    expect(Object.is(zero.smallY, 0)).toBe(true);
  });

  it('handles a negative right-hand side', () => {
    const f = last(gcdTrace(7, 5, -3));
    expect(7 * /** @type {number} */ (f.smallX) + 5 * /** @type {number} */ (f.smallY)).toBe(-3);
  });
});

describe('frames', () => {
  it('start and end as the contract says, and stay small', () => {
    for (const { a, b, c } of Object.values(GCD_PRESETS)) {
      const f = gcdTrace(a, b, c);
      expect(f[0].kind).toBe('start');
      expect(f.at(-1)?.kind).toBe('done');
      expect(f.length).toBeLessThan(400);
    }
  });

  it('do not alias each other', () => {
    const f = gcdTrace(240, 46, 10);
    const later = JSON.stringify(f[2]);
    f[1].rows[0].r = -1;
    f[1].squares[0].side = -1;
    f[1].rest.w = -1;
    expect(JSON.stringify(f[2])).toBe(later);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line across the two outcomes', () => {
    const seen = new Set([...gcdTrace(240, 46, 10), ...gcdTrace(6, 9, 7)].flatMap((f) => f.lines));
    gcdPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
