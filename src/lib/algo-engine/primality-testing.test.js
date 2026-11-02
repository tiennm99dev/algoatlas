import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  PRIMALITY_PRESETS,
  fermatPseudocode,
  liarCounts,
  millerPseudocode,
  primalityTrace,
  trialPseudocode,
} from './primality-testing.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./primality-testing.js').PrimalityFrame} PrimalityFrame */
/** @param {PrimalityFrame[]} frames */
const last = (frames) => /** @type {PrimalityFrame} */ (frames.at(-1));

/** Primality read off the definition. @param {number} n */
function isPrimeByHand(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/** An exact power. @param {number} a @param {number} e @param {number} n */
function powerExact(a, e, n) {
  let out = 1n;
  for (let i = 0; i < e; i++) out = (out * BigInt(a)) % BigInt(n);
  return Number(out);
}

const FOUR = [2, 3, 5, 7];

describe('trial division', () => {
  it('agrees with the definition on every small n', () => {
    for (let n = 2; n <= 3000; n++) {
      const v = last(primalityTrace('trial', n)).verdict;
      expect(v, `n = ${n}`).toBe(isPrimeByHand(n) ? 'prime' : 'composite');
    }
  });

  it('finds the smallest divisor and counts the checks', () => {
    const f = last(primalityTrace('trial', 9991));
    expect(f.divisor).toBe(97);
    expect(f.divisions).toBe(48);
    expect(last(primalityTrace('trial', 100)).divisor).toBe(2);
    const big = last(primalityTrace('trial', 1_000_000_007));
    expect(big.verdict).toBe('prime');
    expect(big.divisions).toBe(15810);
  });

  it('shows a sample of the divisors when the run is long, within the frame budget', () => {
    const frames = primalityTrace('trial', MAX_N);
    expect(last(frames).verdict).toBe('prime');
    expect(frames.length).toBeLessThan(200);
    expect(frames.filter((f) => f.kind === 'try').length).toBeGreaterThan(50);
  });
});

describe('Fermat test', () => {
  it('never calls a prime composite', () => {
    for (let n = 2; n <= 1000; n++) {
      if (!isPrimeByHand(n)) continue;
      expect(last(primalityTrace('fermat', n, FOUR)).verdict).not.toBe('composite');
    }
  });

  it('computes a^(n−1) exactly', () => {
    const f = last(primalityTrace('fermat', 341, [3]));
    expect(f.rounds[0].values).toEqual([powerExact(3, 340, 341)]);
    expect(f.verdict).toBe('composite');
  });

  it('is fooled by a Carmichael number unless the base shares a factor', () => {
    const f = last(primalityTrace('fermat', 561, [2, 5, 7]));
    expect(f.verdict).toBe('probable');
    expect(f.rounds.map((r) => r.outcome)).toEqual(['pass', 'pass', 'pass']);
    expect(last(primalityTrace('fermat', 561, [3])).verdict).toBe('composite');
    expect(last(primalityTrace('fermat', 341, [2])).verdict).toBe('probable');
  });
});

describe('Miller-Rabin test', () => {
  it('agrees with the definition for every n up to 5000 with four bases', () => {
    for (let n = 2; n <= 5000; n++) {
      const v = last(primalityTrace('miller', n, FOUR)).verdict;
      expect(v, `n = ${n}`).toBe(isPrimeByHand(n) ? 'prime' : 'composite');
    }
  });

  it('agrees with the definition on random large n', () => {
    const rand = seeded(9);
    for (let round = 0; round < 60; round++) {
      const n = 3 + 2 * Math.floor(rand() * (MAX_N / 2 - 2));
      const v = last(primalityTrace('miller', n, FOUR)).verdict;
      expect(v, `n = ${n}`).toBe(isPrimeByHand(n) ? 'prime' : 'composite');
    }
  });

  it('catches the Carmichael number with a non-trivial square root of 1', () => {
    const f = last(primalityTrace('miller', 561, [2]));
    expect(f.verdict).toBe('composite');
    expect([f.s, f.d]).toEqual([4, 35]);
    expect(f.rounds[0].values).toEqual([263, 166, 67, 1]);
    expect(f.rounds[0].outcome).toBe('witness');
  });

  it('is fooled by a strong pseudoprime on one base, and caught by another', () => {
    expect(last(primalityTrace('miller', 2047, [2])).verdict).toBe('probable');
    expect(last(primalityTrace('miller', 2047, [2, 3])).verdict).toBe('composite');
  });

  it('says prime only with the four proving bases', () => {
    const three = last(primalityTrace('miller', 97, [2, 3, 5]));
    expect(three.verdict).toBe('probable');
    expect(three.proven).toBe(false);
    const four = last(primalityTrace('miller', 97, FOUR));
    expect(four.verdict).toBe('prime');
    expect(four.proven).toBe(true);
    expect(last(primalityTrace('miller', MAX_N, FOUR)).verdict).toBe('prime');
  });

  it('skips a base outside 2 to n − 2, and admits when none was tried', () => {
    const f = last(primalityTrace('miller', 5, [7]));
    expect(f.rounds[0].outcome).toBe('skip');
    expect(f.tested).toBe(0);
    expect(f.verdict).toBe('unknown');
    expect(last(primalityTrace('fermat', 5, [4])).verdict).toBe('unknown');
    const mixed = last(primalityTrace('miller', 7, FOUR));
    expect(mixed.rounds.map((r) => r.outcome)).toEqual(['pass', 'pass', 'pass', 'skip']);
    expect(mixed.verdict).toBe('prime');
  });

  it('counts squarings on top of the power', () => {
    const power = last(primalityTrace('miller', 97, [2]));
    expect(power.s).toBe(5);
    expect(power.d).toBe(3);
    expect(power.rounds[0].values).toEqual([8, 64, 22, 96]);
    expect(power.multiplications).toBe(7);
  });
});

describe('small and even numbers', () => {
  it('settles them before any base', () => {
    for (const method of /** @type {const} */ (['trial', 'fermat', 'miller'])) {
      expect(last(primalityTrace(method, 2, FOUR)).verdict).toBe('prime');
      expect(last(primalityTrace(method, 3, FOUR)).verdict).toBe('prime');
      const even = last(primalityTrace(method, 1_000_000, FOUR));
      expect(even.verdict).toBe('composite');
      expect(even.divisor).toBe(2);
      expect(even.rounds).toEqual([]);
    }
  });
});

describe('liarCounts', () => {
  it('matches a count by exact powers', () => {
    for (const n of [9, 15, 91, 341, 561]) {
      let fermat = 0;
      let miller = 0;
      for (let a = 2; a <= n - 2; a++) {
        if (powerExact(a, n - 1, n) === 1) fermat++;
        let [s, d] = [0, n - 1];
        while (d % 2 === 0) {
          d /= 2;
          s++;
        }
        let x = powerExact(a, d, n);
        let strong = x === 1 || x === n - 1;
        for (let i = 1; i < s && !strong; i++) {
          x = (x * x) % n;
          strong = x === n - 1;
        }
        if (strong) miller++;
      }
      expect(liarCounts(n)).toEqual({ bases: n - 3, fermat, miller });
    }
  });

  it('keeps strong liars to a quarter of the residues on odd composites', () => {
    for (let n = 9; n <= 1500; n += 2) {
      if (isPrimeByHand(n)) continue;
      const counts = /** @type {NonNullable<ReturnType<typeof liarCounts>>} */ (liarCounts(n));
      expect(counts.miller + 2, `n = ${n}`).toBeLessThanOrEqual((n - 1) / 4);
    }
  });

  it('reports no liars on a prime, where every passing base tells the truth', () => {
    for (const n of [5, 7, 97, 4999]) expect(liarCounts(n)).toBe(null);
  });

  it('declines even, tiny and very large n', () => {
    expect(liarCounts(100)).toBe(null);
    expect(liarCounts(3)).toBe(null);
    expect(liarCounts(1_000_000_007)).toBe(null);
  });
});

describe('frames', () => {
  it('start and end as the contract says, and stay within the budget', () => {
    for (const { n, bases } of Object.values(PRIMALITY_PRESETS)) {
      for (const method of /** @type {const} */ (['trial', 'fermat', 'miller'])) {
        const f = primalityTrace(method, n, bases);
        expect(f[0].kind).toBe('start');
        expect(f.at(-1)?.kind).toBe('done');
        expect(f.length).toBeLessThan(400);
      }
    }
    expect(primalityTrace('miller', 2 ** 30 + 1, [2, 3, 5, 7, 11, 13]).length).toBeLessThan(400);
  });

  it('do not alias each other', () => {
    const f = primalityTrace('miller', 561, [2]);
    const at = f.findIndex((x) => x.kind === 'power');
    const later = JSON.stringify(f[at + 1]);
    f[at].rounds[0].values[0] = -1;
    f[at].recent.push(-1);
    expect(JSON.stringify(f[at + 1])).toBe(later);
  });
});

describe('pseudocode coverage', () => {
  /** @param {string[]} code @param {PrimalityFrame[][]} traces */
  const covers = (code, traces) => {
    const seen = new Set(traces.flat().flatMap((f) => f.lines));
    code.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  };

  it('highlights every line of trial division', () => {
    covers(trialPseudocode, [
      primalityTrace('trial', 3),
      primalityTrace('trial', 4),
      primalityTrace('trial', 9),
      primalityTrace('trial', 97),
    ]);
  });

  it('highlights every line of Fermat', () => {
    covers(fermatPseudocode, [
      primalityTrace('fermat', 3, [2]),
      primalityTrace('fermat', 4, [2]),
      primalityTrace('fermat', 97, [2]),
      primalityTrace('fermat', 341, [3]),
    ]);
  });

  it('highlights every line of Miller-Rabin', () => {
    covers(millerPseudocode, [
      primalityTrace('miller', 3, [2]),
      primalityTrace('miller', 4, [2]),
      primalityTrace('miller', 7, [2]),
      primalityTrace('miller', 97, [2]),
      primalityTrace('miller', 561, [2]),
    ]);
  });
});
