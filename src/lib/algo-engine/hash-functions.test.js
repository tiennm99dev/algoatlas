import { describe, expect, it } from 'vitest';
import {
  BUCKETS,
  MAX_KEYS,
  P,
  drawAB,
  expectedPairs,
  fixedHash,
  hashFnPseudocode,
  hashFnTrace,
  makeKeys,
  universalHash,
} from './hash-functions.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @type {import('./hash-functions.js').FixedHash[]} */
const FNS = ['mod', 'multiply'];

/**
 * Counts colliding pairs by checking every pair of keys.
 * @param {number[]} buckets
 */
function pairsByBruteForce(buckets) {
  let pairs = 0;
  for (let i = 0; i < buckets.length; i++)
    for (let j = i + 1; j < buckets.length; j++) if (buckets[i] === buckets[j]) pairs++;
  return pairs;
}

describe('hashFnTrace', () => {
  it('matches direct counts and pair checks on random keys', () => {
    const rand = seeded(5);
    for (let run = 0; run < 60; run++) {
      const keys = makeKeys('random', 1 + (run % MAX_KEYS), 'mod', rand);
      const { a, b } = drawAB(rand);
      for (const fn of FNS) {
        const last = hashFnTrace(keys, fn, a, b).at(-1);
        const lb = keys.map((k) => fixedHash(k, fn));
        const rb = keys.map((k) => ((a * k + b) % 1009) % 16);
        expect(last?.kind).toBe('done');
        expect(last?.n).toBe(keys.length);
        for (let i = 0; i < BUCKETS; i++) {
          expect(last?.left[i]).toBe(lb.filter((x) => x === i).length);
          expect(last?.right[i]).toBe(rb.filter((x) => x === i).length);
        }
        expect(last?.leftPairs).toBe(pairsByBruteForce(lb));
        expect(last?.rightPairs).toBe(pairsByBruteForce(rb));
      }
    }
  });

  it('handles no keys and one key', () => {
    expect(hashFnTrace([], 'mod', 1, 0).map((f) => f.kind)).toEqual(['start', 'done']);
    const last = hashFnTrace([37], 'mod', 1, 0).at(-1);
    expect(last?.left[5]).toBe(1);
    expect(last?.right[5]).toBe(1);
    expect(last?.leftPairs).toBe(0);
  });

  it('puts an attack on the fixed hash into one bucket and lets the universal hash spread it', () => {
    for (const fn of FNS) {
      const keys = makeKeys('attack', 32, fn);
      expect(keys.every((k) => fixedHash(k, fn) === 0)).toBe(true);
      const last = hashFnTrace(keys, fn, 389, 120).at(-1);
      expect(last?.left[0]).toBe(32);
      expect(last?.leftPairs).toBe(496);
      expect(last?.rightPairs).toBeLessThan(expectedPairs(32));
    }
    expect(makeKeys('attack', 4, 'mod')).toEqual([0, 16, 32, 48]);
  });
});

describe('universal family', () => {
  it('makes any two distinct keys collide for at most 1/m of the pairs (a, b)', () => {
    for (const [x, y] of [
      [0, 16],
      [16, 32],
      [5, 999],
    ]) {
      let collide = 0;
      let total = 0;
      for (let a = 1; a < P; a++) {
        for (let b = 0; b < P; b++) {
          total++;
          if (universalHash(x, a, b) === universalHash(y, a, b)) collide++;
        }
      }
      expect(collide / total).toBeLessThanOrEqual(1 / BUCKETS);
    }
  });

  it('draws a and b in range', () => {
    const rand = seeded(2);
    for (let i = 0; i < 200; i++) {
      const { a, b } = drawAB(rand);
      expect(a >= 1 && a < P && b >= 0 && b < P).toBe(true);
    }
  });

  it('works out the textbook example', () => {
    // ((3 · 100 + 5) mod 1009) mod 16 = 305 mod 16 = 1.
    expect(universalHash(100, 3, 5)).toBe(1);
    expect(expectedPairs(32)).toBe(31);
  });
});

describe('fixedHash', () => {
  it('stays in range', () => {
    for (const fn of FNS) {
      for (let k = 0; k <= 999; k++) {
        const h = fixedHash(k, fn);
        expect(Number.isInteger(h) && h >= 0 && h < BUCKETS).toBe(true);
      }
    }
  });
});

describe('makeKeys', () => {
  it('builds each set', () => {
    expect(makeKeys('sequential', 3, 'mod')).toEqual([100, 101, 102]);
    const random = makeKeys('random', MAX_KEYS, 'mod', seeded(3));
    expect(new Set(random).size).toBe(MAX_KEYS);
    expect(makeKeys('attack', 99, 'multiply')).toHaveLength(MAX_KEYS);
  });
});

describe('frames', () => {
  it('are not aliased', () => {
    const frames = hashFnTrace(makeKeys('sequential', 8, 'mod'), 'mod', 389, 120);
    const next = JSON.stringify([frames[3].left, frames[3].right]);
    frames[2].left[0] = 99;
    frames[2].right[0] = 99;
    expect(JSON.stringify([frames[3].left, frames[3].right])).toBe(next);
  });

  it('stay under 400 at the key cap', () => {
    expect(hashFnTrace(makeKeys('sequential', MAX_KEYS, 'mod'), 'mod', 1, 0).length).toBeLessThan(
      400,
    );
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    for (const fn of FNS) {
      const seen = new Set(hashFnTrace([1, 2], fn, 1, 0).flatMap((f) => f.lines));
      expect([...seen].sort((a, b) => a - b)).toEqual(hashFnPseudocode[fn].map((_, i) => i));
    }
  });
});
