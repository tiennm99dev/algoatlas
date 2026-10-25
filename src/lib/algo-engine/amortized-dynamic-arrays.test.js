import { describe, expect, it } from 'vitest';
import {
  MAX_APPENDS,
  MAX_CHARGE,
  MIN_CHARGE,
  aggregateCost,
  appendPseudocode,
  appendTrace,
  appendedValue,
} from './amortized-dynamic-arrays.js';

/** @typedef {import('./amortized-dynamic-arrays.js').AppendFrame} AppendFrame */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * Independent oracle: append k costs 1, plus k − 1 copies when k − 1 is a power of 2
 * (the capacity is then full).
 * @param {number} n
 */
function oracleCosts(n) {
  const out = [];
  for (let k = 1; k <= n; k++) {
    const full = k > 1 && ((k - 1) & (k - 2)) === 0;
    out.push(1 + (full ? k - 1 : 0));
  }
  return out;
}

/** @param {number} n @param {number} c */
const last = (n, c) => /** @type {AppendFrame} */ (appendTrace(n, c).at(-1));

const rand = seeded(5);
const cases = [
  [0, 3],
  [1, 3],
  [2, 2],
  [5, 2],
  [16, 3],
  [17, 3],
  [MAX_APPENDS, MIN_CHARGE],
  [MAX_APPENDS, MAX_CHARGE],
  ...Array.from({ length: 8 }, () => [
    1 + Math.floor(rand() * MAX_APPENDS),
    MIN_CHARGE + Math.floor(rand() * (MAX_CHARGE - MIN_CHARGE + 1)),
  ]),
];

describe('appends', () => {
  it.each(cases)('n = %i, c = %i: costs match the oracle and the aggregate count', (n, c) => {
    const f = last(n, c);
    expect(f.costs).toEqual(oracleCosts(n));
    const agg = aggregateCost(n);
    expect(f.writes).toBe(agg.writes);
    expect(f.copies).toBe(agg.copies);
    expect(f.total).toBe(agg.total);
    expect(f.total).toBeLessThanOrEqual(Math.max(0, 3 * n - 2));
    expect(f.cells.slice(0, n)).toEqual(Array.from({ length: n }, (_, i) => appendedValue(i + 1)));
    expect(f.capacity).toBe(n <= 1 ? 1 : 2 ** Math.ceil(Math.log2(n)));
  });

  it.each(cases)('n = %i, c = %i: the bank is charged minus spent', (n, c) => {
    for (const f of appendTrace(n, c)) {
      expect(f.bank).toBe(f.charged - f.total);
      expect(f.banks.at(-1)).toBe(f.bank);
    }
  });

  it('never goes into debt with a charge of 3 or more', () => {
    for (const c of [3, 4]) {
      for (const f of appendTrace(MAX_APPENDS, c)) expect(f.bank).toBeGreaterThanOrEqual(0);
      expect(last(MAX_APPENDS, c).firstDebt).toBe(-1);
    }
  });

  it('first goes into debt on append 5 with a charge of 2, and on append 2 with 1', () => {
    expect(last(MAX_APPENDS, 2).firstDebt).toBe(5);
    expect(last(MAX_APPENDS, 1).firstDebt).toBe(2);
    expect(last(4, 2).firstDebt).toBe(-1);
  });

  it('costs 31 for 16 appends and leaves 17 coins at a charge of 3', () => {
    const f = last(16, 3);
    expect(f.total).toBe(31);
    expect(f.bank).toBe(17);
    expect(Math.max(...f.costs)).toBe(9);
  });

  it('keeps the old block next to the new one while copying', () => {
    const frames = appendTrace(3, 3);
    const copy = /** @type {AppendFrame} */ (frames.findLast((f) => f.kind === 'copy'));
    expect(copy.old).toEqual([1, 2]);
    expect(copy.cells).toEqual([1, 2, null, null]);
    const grown = /** @type {AppendFrame} */ (frames.findLast((f) => f.kind === 'grown'));
    expect(grown.old).toBeNull();
  });

  it('starts with start, ends with done and stays under 400 frames', () => {
    const frames = appendTrace(MAX_APPENDS, MAX_CHARGE);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.length).toBeLessThan(400);
  });
});

describe('frame independence', () => {
  it('does not share arrays between frames', () => {
    const frames = appendTrace(3, 3);
    const k = frames.findIndex((f) => f.kind === 'copy');
    frames[k].cells[0] = 99;
    /** @type {(number|null)[]} */ (frames[k].old)[0] = 99;
    frames[k].costs[0] = 99;
    frames[k].banks[0] = 99;
    expect(frames[k + 1].cells[0]).toBe(1);
    expect(frames[k + 1].costs[0]).toBe(1);
    expect(frames[k + 1].banks[0]).toBe(0);
    expect(appendTrace(3, 3)[k].old?.[0]).toBe(1);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line on a run that resizes', () => {
    const seen = new Set(appendTrace(3, 3).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(appendPseudocode.map((_, i) => i));
  });
});
