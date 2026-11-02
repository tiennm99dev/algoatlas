import { describe, expect, it } from 'vitest';
import {
  CRT_PRESETS,
  MAX_CONGRUENCES,
  MAX_CRT_MODULUS,
  crtPseudocode,
  crtTrace,
  euclidInverseTrace,
  euclidPseudocode,
  fermatInverseTrace,
  fermatPseudocode,
  formatSystem,
  isPrime,
  parseSystem,
} from './modular-inverse-crt.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./modular-inverse-crt.js').ModFrame} ModFrame */
/** @param {ModFrame[]} frames */
const last = (frames) => /** @type {ModFrame} */ (frames.at(-1));

/** The inverse found by trying every candidate. @param {number} a @param {number} m */
function inverseByHand(a, m) {
  for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
  return null;
}

/** The smallest solution found by trying every number. @param {{r: number, m: number}[]} system */
function solveByHand(system) {
  const limit = system.reduce((p, c) => p * c.m, 1);
  for (let x = 0; x < limit; x++) if (system.every(({ r, m }) => x % m === r % m)) return x;
  return null;
}

/** @param {{r: number, m: number}[]} system */
function lcmOf(system) {
  const gcd = (/** @type {number} */ p, /** @type {number} */ q) => {
    while (q) [p, q] = [q, p % q];
    return p;
  };
  return system.reduce((l, c) => (l * c.m) / gcd(l, c.m), 1);
}

const SUN_TZU = [
  { r: 2, m: 3 },
  { r: 3, m: 5 },
  { r: 2, m: 7 },
];

describe('inverse by extended Euclid', () => {
  it('agrees with trying every candidate', () => {
    for (let m = 2; m <= 60; m++) {
      for (let a = 0; a <= m + 3; a++) {
        expect(last(euclidInverseTrace(a, m)).inverse, `${a} mod ${m}`).toBe(
          inverseByHand(a % m, m),
        );
      }
    }
  });

  it('keeps r ≡ t·a (mod m) on every row', () => {
    const [a, m] = [1234, 9973];
    for (const row of last(euclidInverseTrace(a, m)).rows) {
      const [r, , t] = /** @type {number[]} */ (row);
      expect((((t * a) % m) + m) % m).toBe(r % m);
    }
  });

  it('moves the clock’s hand to 1 when an inverse exists', () => {
    const f = last(euclidInverseTrace(3, 7));
    expect(f.inverse).toBe(5);
    expect(f.clocks[0]).toMatchObject({ m: 7, goal: 1, value: 1, aligned: true });
  });

  it('reports a shared factor', () => {
    const f = euclidInverseTrace(4, 6);
    expect(last(f).inverse).toBe(null);
    expect(last(f).g).toBe(2);
    expect(f.some((x) => x.kind === 'none')).toBe(true);
    expect(last(euclidInverseTrace(0, 7)).inverse).toBe(null);
    expect(last(euclidInverseTrace(0, 7)).g).toBe(7);
  });

  it('counts divisions', () => {
    expect(last(euclidInverseTrace(3, 7)).steps).toBe(2);
  });
});

describe('inverse by Fermat', () => {
  it('agrees with trying every candidate on primes', () => {
    for (const p of [2, 3, 5, 7, 11, 13, 31, 97, 101]) {
      for (let a = 0; a < p; a++) {
        expect(last(fermatInverseTrace(a, p)).inverse, `${a} mod ${p}`).toBe(inverseByHand(a, p));
      }
    }
    expect(last(fermatInverseTrace(1234, 9973)).inverse).toBe(inverseByHand(1234, 9973));
  });

  it('counts one multiplication per bit plus one per set bit of p − 2', () => {
    expect(last(fermatInverseTrace(3, 7)).multiplications).toBe(5);
    expect(last(fermatInverseTrace(3, 7)).steps).toBe(3);
  });

  it('refuses zero', () => {
    const f = fermatInverseTrace(14, 7);
    expect(f.map((x) => x.kind)).toEqual(['start', 'none', 'done']);
  });

  it('matches Euclid on a prime modulus', () => {
    for (const [a, p] of [
      [5, 101],
      [100, 9973],
      [2, 3],
    ]) {
      expect(last(fermatInverseTrace(a, p)).inverse).toBe(last(euclidInverseTrace(a, p)).inverse);
    }
  });
});

describe('isPrime', () => {
  it('sorts the small numbers', () => {
    const primes = Array.from({ length: 30 }, (_, i) => i).filter(isPrime);
    expect(primes).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
  });
});

describe('chinese remainder trace', () => {
  it('solves the Sun Tzu system', () => {
    const f = last(crtTrace(SUN_TZU));
    expect(f.solvable).toBe(true);
    expect([f.R, f.M]).toEqual([23, 105]);
    expect(f.clocks.every((c) => c.aligned)).toBe(true);
  });

  it('agrees with brute force on random systems, coprime or not', () => {
    const rand = seeded(3);
    for (let round = 0; round < 500; round++) {
      const size = 1 + Math.floor(rand() * MAX_CONGRUENCES);
      const system = Array.from({ length: size }, () => {
        const m = 2 + Math.floor(rand() * (round % 2 ? 11 : 6));
        return { r: Math.floor(rand() * 40), m };
      });
      const f = last(crtTrace(system));
      const brute = solveByHand(system);
      if (brute === null) {
        expect(f.solvable).toBe(false);
      } else {
        expect(f.solvable).toBe(true);
        expect(f.R).toBe(brute);
        expect(f.M).toBe(lcmOf(system));
      }
    }
  });

  it('merges moduli with a common factor into their least common multiple', () => {
    const f = last(
      crtTrace([
        { r: 1, m: 4 },
        { r: 3, m: 6 },
      ]),
    );
    expect([f.R, f.M]).toEqual([9, 12]);
  });

  it('stops at a contradiction', () => {
    const f = crtTrace([
      { r: 1, m: 4 },
      { r: 2, m: 6 },
    ]);
    expect(last(f).solvable).toBe(false);
    expect(f.at(-2)?.kind).toBe('conflict');
  });

  it('keeps the merged clocks aligned on every frame of the walk', () => {
    for (const f of crtTrace([
      { r: 1, m: 3 },
      { r: 4, m: 5 },
      { r: 6, m: 7 },
      { r: 10, m: 11 },
    ])) {
      for (const c of f.clocks) if (c.role === 'merged') expect(c.aligned).toBe(true);
    }
  });

  it('lands the walk on the k the inverse predicted', () => {
    const f = crtTrace(SUN_TZU);
    expect(f.filter((x) => x.kind === 'walk').map((x) => x.candidate)).toEqual([5, 8, 23]);
    expect(f.filter((x) => x.kind === 'combine').map((x) => [x.t, x.R])).toEqual([
      [2, 8],
      [1, 23],
    ]);
    expect(last(f).steps).toBe(3);
  });

  it('handles one congruence and reduces remainders', () => {
    const f = last(crtTrace([{ r: 10, m: 4 }]));
    expect([f.R, f.M, f.solvable]).toEqual([2, 4, true]);
    expect(f.system).toEqual([{ r: 2, m: 4 }]);
  });
});

describe('parseSystem', () => {
  it('reads and writes the system', () => {
    const parsed = parseSystem(CRT_PRESETS.sunTzu);
    expect(parsed).toEqual({ system: SUN_TZU });
    expect(formatSystem(SUN_TZU)).toBe(CRT_PRESETS.sunTzu);
    expect(parseSystem(' 1 MOD 4 ,3%6')).toEqual({
      system: [
        { r: 1, m: 4 },
        { r: 3, m: 6 },
      ],
    });
  });

  it('reports each failure', () => {
    expect(parseSystem('')).toEqual({ error: 'format' });
    expect(parseSystem('2 mod')).toEqual({ error: 'format' });
    expect(parseSystem('-2 mod 3')).toEqual({ error: 'format' });
    expect(parseSystem('2 mod 1')).toEqual({ error: 'range' });
    expect(parseSystem(`2 mod ${MAX_CRT_MODULUS + 1}`)).toEqual({ error: 'range' });
    expect(parseSystem('1 mod 2,1 mod 3,1 mod 5,1 mod 7,1 mod 11')).toEqual({ error: 'count' });
  });
});

describe('frames', () => {
  it('start and end as the contract says, and stay small at the caps', () => {
    for (const trace of [euclidInverseTrace(3, 7), fermatInverseTrace(3, 7)]) {
      expect(trace[0].kind).toBe('start');
      expect(trace.at(-1)?.kind).toBe('done');
    }
    const worst = crtTrace([
      { r: 28, m: 29 },
      { r: 26, m: 27 },
      { r: 24, m: 25 },
      { r: 22, m: 23 },
    ]);
    expect(worst[0].kind).toBe('start');
    expect(worst.at(-1)?.kind).toBe('done');
    expect(worst.length).toBeLessThan(400);
  });

  it('do not alias each other', () => {
    const f = euclidInverseTrace(3, 7);
    const later = JSON.stringify(f[2]);
    f[1].rows[0][0] = -1;
    f[1].clocks[0].value = -1;
    expect(JSON.stringify(f[2])).toBe(later);
    const c = crtTrace(SUN_TZU);
    const after = JSON.stringify(c[2]);
    c[1].system[0].r = -1;
    c[1].clocks[0].value = -1;
    c[1].rows[0][1] = -1;
    expect(JSON.stringify(c[2])).toBe(after);
  });
});

describe('pseudocode coverage', () => {
  /** @param {string[]} code @param {ModFrame[][]} traces */
  const covers = (code, traces) => {
    const seen = new Set(traces.flat().flatMap((f) => f.lines));
    code.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  };

  it('highlights every line of Euclid', () => {
    covers(euclidPseudocode, [euclidInverseTrace(3, 7), euclidInverseTrace(4, 6)]);
  });

  it('highlights every line of Fermat', () => {
    covers(fermatPseudocode, [fermatInverseTrace(3, 7)]);
  });

  it('highlights every line of the system', () => {
    covers(crtPseudocode, [
      crtTrace([
        { r: 2, m: 3 },
        { r: 3, m: 5 },
      ]),
      crtTrace([
        { r: 1, m: 4 },
        { r: 2, m: 6 },
      ]),
    ]);
  });
});
