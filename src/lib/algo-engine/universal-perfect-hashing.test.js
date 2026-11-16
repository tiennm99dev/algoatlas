import { describe, expect, it } from 'vitest';
import {
  HASH_PRESETS,
  MAX_KEY,
  MAX_N,
  P,
  collidingPairs,
  exactMeanPairs,
  fixedPairs,
  hashOf,
  lookup,
  pairBound,
  perfectHashPseudocode,
  perfectHashTrace,
  sampleDraw,
} from './universal-perfect-hashing.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./universal-perfect-hashing.js').PerfectFrame[]} frames */
const last = (frames) =>
  /** @type {import('./universal-perfect-hashing.js').PerfectFrame} */ (frames.at(-1));

/** Distinct random keys in 0 … p − 1. @param {() => number} rand @param {number} n */
function randomKeys(rand, n) {
  const set = new Set();
  while (set.size < n) set.add(Math.floor(rand() * (MAX_KEY + 1)));
  return [...set];
}

/** Brute-force colliding pairs: compare every pair. @param {number[]} keys @param {(k: number) => number} h */
function pairsByHand(keys, h) {
  let c = 0;
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) if (h(keys[i]) === h(keys[j])) c++;
  return c;
}

describe('universal hash family', () => {
  it('counts colliding pairs like a pairwise check', () => {
    const rand = seeded(3);
    for (let round = 0; round < 200; round++) {
      const keys = randomKeys(rand, 2 + Math.floor(rand() * (MAX_N - 1)));
      const a = 1 + Math.floor(rand() * (P - 1));
      const b = Math.floor(rand() * P);
      const h = (/** @type {number} */ k) => hashOf(k, a, b, keys.length);
      expect(collidingPairs(keys, h)).toBe(pairsByHand(keys, h));
    }
  });

  it('collides any two distinct keys for at most 1/m of its functions', () => {
    for (const [x, y, m] of [
      [0, 9, 9],
      [10, 22, 4],
      [3, 100, 2],
      [50, 51, 12],
    ]) {
      let hits = 0;
      for (let a = 1; a < P; a++)
        for (let b = 0; b < P; b++) if (hashOf(x, a, b, m) === hashOf(y, a, b, m)) hits++;
      expect(hits / ((P - 1) * P)).toBeLessThanOrEqual(1 / m);
    }
  });

  it('keeps the exact average of colliding pairs under n(n − 1)/(2m)', () => {
    for (const keys of Object.values(HASH_PRESETS)) {
      expect(exactMeanPairs(keys)).toBeLessThanOrEqual(pairBound(keys.length));
    }
    expect(fixedPairs(HASH_PRESETS.attack)).toBe(45);
    expect(pairBound(10)).toBe(4.5);
  });

  it('samples Σ nⱼ² as n plus twice the colliding pairs', () => {
    const rand = seeded(5);
    for (let t = 0; t < 50; t++) {
      const s = sampleDraw(HASH_PRESETS.textbook, rand);
      expect(s.sumSquares).toBe(9 + 2 * s.pairs);
    }
  });
});

describe('two-level perfect hashing trace', () => {
  it('stores every key with no collisions and finds only stored keys', () => {
    const rand = seeded(11);
    for (let round = 0; round < 150; round++) {
      const keys = randomKeys(rand, 2 + Math.floor(rand() * (MAX_N - 1)));
      const f = last(perfectHashTrace(keys, seeded(round)));
      const n = keys.length;
      expect(f.kind).toBe('done');
      expect(f.sumSquares).toBeLessThan(4 * n);
      expect(f.buckets.flat().sort((x, y) => x - y)).toEqual(keys.slice().sort((x, y) => x - y));
      expect(f.slots).toBe(f.sumSquares);
      for (let j = 0; j < n; j++) {
        const t = f.tables[j];
        expect(t.m).toBe(f.buckets[j].length ** 2);
        expect(t.slots.filter((s) => s !== null).length).toBe(f.buckets[j].length);
        if (t.m > 0) expect(t.done).toBe(true);
      }
      for (let k = 0; k <= MAX_KEY; k++) expect(lookup(f, k).found).toBe(keys.includes(k));
    }
  });

  it('places each key in bucket h(k) and counts Σ nⱼ² as it goes', () => {
    const frames = perfectHashTrace(HASH_PRESETS.textbook, seeded(7));
    for (const f of frames.filter((x) => x.kind === 'place')) {
      expect(f.j).toBe(hashOf(f.key, f.a, f.b, 9));
      expect(f.sumSquares).toBe(f.buckets.reduce((s, row) => s + row.length ** 2, 0));
    }
    const checks = frames.filter((x) => x.kind === 'check');
    expect(checks.at(-1)?.accepted).toBe(true);
    expect(checks.slice(0, -1).every((c) => !c.accepted)).toBe(true);
    expect(last(frames).firstDraws).toBe(checks.length);
  });

  it('redraws a bucket after a collision', () => {
    // Two keys 1 apart in a bucket of 4 slots collide under many functions; over many seeds
    // some bucket needs a second draw, and the collide frame names the key already there.
    let seen = false;
    for (let s = 0; s < 40 && !seen; s++) {
      const frames = perfectHashTrace(HASH_PRESETS.attack, seeded(s));
      const hit = frames.find((f) => f.kind === 'collide');
      if (hit) {
        seen = true;
        expect(hit.tables[hit.j].slots[hit.slot]).toBe(hit.clash);
        const after = frames[frames.indexOf(hit) + 1];
        expect(after.kind).toBe('second');
        expect(after.tables[after.j].draws).toBe(hit.tables[hit.j].draws + 1);
      }
    }
    expect(seen).toBe(true);
  });

  it('still finishes when the coin never changes, through the in-order search', () => {
    const frames = perfectHashTrace([1, 2, 3, 4], () => 0);
    const f = last(frames);
    expect(f.kind).toBe('done');
    for (const k of [1, 2, 3, 4]) expect(lookup(f, k).found).toBe(true);
  });

  it('keeps traces short at the size cap', () => {
    const rand = seeded(9);
    for (let s = 0; s < 100; s++) {
      expect(perfectHashTrace(randomKeys(rand, MAX_N), seeded(s)).length).toBeLessThan(400);
    }
  });

  it('does not alias frames', () => {
    const frames = perfectHashTrace(HASH_PRESETS.textbook, seeded(1));
    const a = frames[3];
    const b = frames[4];
    a.buckets[0].push(999);
    a.tables[0].slots.push(999);
    a.keys.push(999);
    expect(b.buckets[0]).not.toContain(999);
    expect(b.tables[0].slots).not.toContain(999);
    expect(b.keys).not.toContain(999);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const used = new Set();
    for (let s = 0; s < 40; s++) {
      for (const f of perfectHashTrace(HASH_PRESETS.attack, seeded(s)))
        f.lines.forEach((l) => used.add(l));
    }
    for (let i = 0; i < perfectHashPseudocode.length; i++) expect(used.has(i)).toBe(true);
  });
});
