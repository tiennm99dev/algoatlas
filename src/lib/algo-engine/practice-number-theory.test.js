import { describe, expect, it } from 'vitest';
import {
  MAX_DIVISOR_N,
  MAX_RANGE_N,
  MAX_VALUES,
  PSEUDOCODE,
  START,
  calculate,
  divisorsOf,
  divisorsTrace,
  inverseMod,
  pairsTrace,
  rangeSumTrace,
  subarraysTrace,
} from './practice-number-theory.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./practice-number-theory.js').PracticeFrame[]} frames */
const end = (frames) =>
  /** @type {import('./practice-number-theory.js').PracticeFrame} */ (frames.at(-1));

/** σ and τ by testing every number up to n. @param {number} n */
function bySearch(n) {
  let sigma = 0;
  let tau = 0;
  for (let d = 1; d <= n; d++) {
    if (n % d === 0) {
      sigma += d;
      tau++;
    }
  }
  return { sigma, tau };
}

/** @param {number[]} values @param {number} m */
function pairsBrute(values, m) {
  let out = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) if ((values[i] + values[j]) % m === 0) out++;
  }
  return out;
}

/** @param {number[]} values @param {number} m */
function subarraysBrute(values, m) {
  let out = 0;
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    for (let j = i; j < values.length; j++) {
      sum += values[j];
      if (sum % m === 0) out++;
    }
  }
  return out;
}

/** @param {() => number} rand @param {number} n */
const randomValues = (rand, n) => Array.from({ length: n }, () => Math.floor(rand() * 1000));

describe('divisors trace', () => {
  it('agrees with a search on every n up to 2000', () => {
    for (let n = 1; n <= 2000; n++) {
      const f = end(divisorsTrace(n));
      const want = bySearch(n);
      expect(f.total, `σ(${n})`).toBe(want.sigma);
      expect(f.tau, `τ(${n})`).toBe(want.tau);
      expect(f.divisors.length).toBe(want.tau);
      expect(f.divisors.reduce((a, b) => a + b, 0)).toBe(want.sigma);
    }
  });

  it('factors 360 into one table row per prime', () => {
    const f = end(divisorsTrace(360));
    expect(f.rows).toEqual([
      [2, 3, 15, 15],
      [3, 2, 13, 195],
      [5, 1, 6, 1170],
    ]);
    expect(f.tau).toBe(24);
  });

  it('handles 1, primes, squares and the cap', () => {
    expect(end(divisorsTrace(1)).total).toBe(1);
    expect(end(divisorsTrace(1)).tau).toBe(1);
    expect(end(divisorsTrace(999_999_937)).total).toBe(999_999_938);
    expect(end(divisorsTrace(999_999_937)).tau).toBe(2);
    expect(end(divisorsTrace(36)).tau).toBe(9);
    expect(end(divisorsTrace(MAX_DIVISOR_N)).total).toBe(2_497_558_338);
    expect(end(divisorsTrace(MAX_DIVISOR_N)).tau).toBe(100);
    expect(divisorsTrace(MAX_DIVISOR_N).length).toBeLessThan(400);
  });
});

describe('divisorsOf', () => {
  it('lists the divisors in order without repeating a square root', () => {
    expect(divisorsOf(1)).toEqual([1]);
    expect(divisorsOf(36)).toEqual([1, 2, 3, 4, 6, 9, 12, 18, 36]);
    expect(divisorsOf(13)).toEqual([1, 13]);
  });
});

describe('range sum trace', () => {
  it('agrees with summing σ(i) directly', () => {
    let want = 0;
    for (let N = 1; N <= MAX_RANGE_N; N++) {
      want += bySearch(N).sigma;
      expect(end(rangeSumTrace(N)).total, `N = ${N}`).toBe(want);
    }
  });

  it('counts one round per divisor and stays under the frame cap', () => {
    expect(end(rangeSumTrace(10)).total).toBe(87);
    expect(end(rangeSumTrace(10)).steps).toBe(10);
    expect(end(rangeSumTrace(10)).brute).toBe(55);
    expect(rangeSumTrace(MAX_RANGE_N).length).toBeLessThan(400);
  });
});

describe('pairs and subarrays traces', () => {
  it('agree with brute force on random lists', () => {
    const rand = seeded(9);
    for (let round = 0; round < 500; round++) {
      const values = randomValues(rand, 1 + Math.floor(rand() * MAX_VALUES));
      const m = 1 + Math.floor(rand() * 12);
      expect(end(pairsTrace(values, m)).total).toBe(pairsBrute(values, m));
      expect(end(subarraysTrace(values, m)).total).toBe(subarraysBrute(values, m));
    }
  });

  it('get the worked examples', () => {
    expect(end(pairsTrace(START.values, START.m)).total).toBe(5);
    expect(end(subarraysTrace(START.subValues, START.subM)).total).toBe(7);
  });

  it('handle one element, zeros and a modulus of one', () => {
    expect(end(pairsTrace([5], 3)).total).toBe(0);
    expect(end(subarraysTrace([3], 3)).total).toBe(1);
    expect(end(pairsTrace([0, 0, 0], 4)).total).toBe(3);
    expect(end(subarraysTrace([0, 0], 4)).total).toBe(3);
    expect(end(pairsTrace([1, 2, 3], 1)).total).toBe(3);
    expect(end(subarraysTrace([1, 2, 3], 1)).total).toBe(6);
  });

  it('report the brute-force cost', () => {
    expect(end(pairsTrace([1, 2, 3, 4], 2)).brute).toBe(6);
    expect(end(subarraysTrace([1, 2, 3, 4], 2)).brute).toBe(10);
    expect(end(pairsTrace([1, 2, 3, 4], 2)).steps).toBe(4);
  });
});

describe('asks', () => {
  it('always equal the total on the next frame', () => {
    const traces = [
      divisorsTrace(360),
      divisorsTrace(97),
      rangeSumTrace(10),
      pairsTrace(START.values, START.m),
      subarraysTrace(START.subValues, START.subM),
    ];
    for (const frames of traces) {
      let asked = 0;
      frames.forEach((f, i) => {
        if (f.ask === null) return;
        asked++;
        expect(f.ask).toBe(frames[i + 1].total);
      });
      expect(asked).toBeGreaterThan(0);
    }
  });
});

describe('calculator', () => {
  it('computes each operation', () => {
    expect(calculate('add', 5, 9, 7)).toEqual({ value: 0, inverse: null });
    expect(calculate('sub', 3, 5, 7)).toEqual({ value: 5, inverse: null });
    expect(calculate('mul', 1_000_000_000, 1_000_000_000, 1_000_000_007)).toEqual({
      value: 49,
      inverse: null,
    });
    expect(calculate('pow', 2, 1_000_000_000, 1_000_000_007)).toEqual({
      value: 140625001,
      inverse: null,
    });
    expect(calculate('pow', 5, 0, 1)).toEqual({ value: 0, inverse: null });
    expect(calculate('div', 5, 3, 7)).toEqual({ value: 4, inverse: 5 });
    expect(calculate('div', 1, 2, 4)).toEqual({ error: 'noInverse' });
    expect(calculate('div', 1, 0, 7)).toEqual({ error: 'noInverse' });
  });

  it('finds true inverses', () => {
    for (const m of [2, 7, 10, 97, 1000]) {
      for (let b = 1; b < 60; b++) {
        const inverse = inverseMod(b, m);
        if (inverse !== null) expect((b * inverse) % m).toBe(1 % m);
      }
    }
    expect(inverseMod(6, 9)).toBeNull();
  });
});

describe('frames', () => {
  it('start and end as the contract says', () => {
    for (const f of [
      divisorsTrace(12),
      rangeSumTrace(3),
      pairsTrace([1], 2),
      subarraysTrace([1], 2),
    ]) {
      expect(f[0].kind).toBe('start');
      expect(f.at(-1)?.kind).toBe('done');
    }
  });

  it('do not alias each other', () => {
    const f = pairsTrace([1, 2, 3], 3);
    const later = JSON.stringify(f[3]);
    f[2].seen[0] = -1;
    f[2].values[0] = -1;
    expect(JSON.stringify(f[3])).toBe(later);

    const g = divisorsTrace(360);
    const laterG = JSON.stringify(g[4]);
    g[3].rows.push([-1]);
    expect(JSON.stringify(g[4])).toBe(laterG);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of each runner', () => {
    /** @type {[keyof typeof PSEUDOCODE, import('./practice-number-theory.js').PracticeFrame[][]][]} */
    const cases = [
      ['divisors', [divisorsTrace(14)]],
      ['rangeSum', [rangeSumTrace(3)]],
      ['pairs', [pairsTrace([1, 2], 3)]],
      ['subarrays', [subarraysTrace([1, 2], 3)]],
    ];
    for (const [name, runs] of cases) {
      const seen = new Set(runs.flat().flatMap((f) => f.lines));
      PSEUDOCODE[name].forEach((_, i) => expect(seen.has(i), `${name} line ${i}`).toBe(true));
    }
  });
});
