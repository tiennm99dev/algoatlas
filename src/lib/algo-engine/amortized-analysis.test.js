import { describe, expect, it } from 'vitest';
import {
  MAX_BITS,
  MAX_OPS,
  MIN_BITS,
  aggregateFlips,
  counterTrace,
  incrementPseudocode,
} from './amortized-analysis.js';

/** @typedef {import('./amortized-analysis.js').CounterFrame} CounterFrame */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} x */
function popcount(x) {
  let c = 0;
  for (; x; x >>= 1) c += x & 1;
  return c;
}

/** Independent oracle: an increment costs the bits that differ between v and v + 1 mod 2ᵏ. @param {number} k @param {number} m */
function oracleCosts(k, m) {
  const out = [];
  for (let v = 0; v < m; v++) out.push(popcount((v % 2 ** k) ^ ((v + 1) % 2 ** k)));
  return out;
}

/** @param {number} k @param {number} m */
const last = (k, m) => /** @type {CounterFrame} */ (counterTrace(k, m).at(-1));

const rand = seeded(7);
const cases = [
  [MIN_BITS, 1],
  [4, 16],
  [4, 15],
  [3, 20],
  [MAX_BITS, MAX_OPS],
  ...Array.from({ length: 8 }, () => [
    MIN_BITS + Math.floor(rand() * (MAX_BITS - MIN_BITS + 1)),
    1 + Math.floor(rand() * MAX_OPS),
  ]),
];

describe('counter', () => {
  it.each(cases)('k = %i, m = %i: costs and final value match the oracle', (k, m) => {
    const f = last(k, m);
    expect(f.costs).toEqual(oracleCosts(k, m));
    expect(f.value).toBe(m % 2 ** k);
    expect(f.total).toBe(aggregateFlips(m, k));
    expect(f.total).toBeLessThan(2 * m);
    expect(f.flips).toEqual(Array.from({ length: k }, (_, i) => Math.floor(m / 2 ** i)));
  });

  it.each(cases)('k = %i, m = %i: credits and potential stay in balance', (k, m) => {
    for (const f of counterTrace(k, m)) {
      expect(f.phi).toBe(f.bits.filter((b) => b === 1).length);
      expect(f.charged - f.total).toBe(f.phi);
      expect(f.potentials.at(-1)).toBe(f.phi);
    }
    const f = last(k, m);
    for (const [t, a] of f.amortized.entries()) {
      expect(a).toBe(f.costs[t] + f.potentials[t + 1] - f.potentials[t]);
      expect(a).toBe((t + 1) % 2 ** k === 0 ? 0 : 2);
    }
  });

  it('pays k flips on overflow and wraps to zero', () => {
    const frames = counterTrace(4, 16);
    const over = frames.filter((f) => f.kind === 'overflow');
    expect(over).toHaveLength(1);
    expect(over[0].opCost).toBe(4);
    expect(over[0].value).toBe(0);
    expect(over[0].amortized.at(-1)).toBe(0);
  });

  it('costs three resets plus one set going from 0111 to 1000', () => {
    const f = counterTrace(4, 8).find((x) => x.op === 8 && x.kind === 'set');
    expect(f?.kind).toBe('set');
    expect(f?.opCost).toBe(4);
    expect(f?.phiBefore).toBe(3);
    expect(f?.phi).toBe(1);
  });

  it('starts with start, ends with done and stays under 400 frames', () => {
    const frames = counterTrace(MAX_BITS, MAX_OPS);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.length).toBeLessThan(400);
    expect(counterTrace(MIN_BITS, MAX_OPS).length).toBeLessThan(400);
  });
});

describe('frame independence', () => {
  it('does not share arrays between frames', () => {
    const frames = counterTrace(4, 3);
    const k = frames.findIndex((f) => f.kind === 'set');
    frames[k].bits[0] = 9;
    frames[k].flips[0] = 9;
    frames[k].costs[0] = 9;
    frames[k].potentials[0] = 9;
    expect(frames[k + 1].bits[0]).toBe(1);
    expect(frames[k + 1].flips[0]).toBe(1);
    expect(frames[k + 1].costs[0]).toBe(1);
    expect(frames[k + 1].potentials[0]).toBe(0);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line when the run includes an overflow', () => {
    const seen = new Set(counterTrace(2, 4).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(incrementPseudocode.map((_, i) => i));
  });
});
