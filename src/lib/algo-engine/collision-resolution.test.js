import { describe, expect, it } from 'vitest';
import {
  M,
  MAX_KEYS,
  collisionPseudocode,
  collisionTrace,
  homeOf,
  makeKeys,
  parseKeys,
  probeSlot,
  stepOf,
} from './collision-resolution.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @type {import('./collision-resolution.js').ProbeMethod[]} */
const METHODS = ['linear', 'quadratic', 'double'];

/** Offsets written out by hand, independent of probeSlot. */
const OFFSET = {
  linear: (/** @type {number} */ k, /** @type {number} */ i) => i,
  quadratic: (/** @type {number} */ k, /** @type {number} */ i) => i * i,
  double: (/** @type {number} */ k, /** @type {number} */ i) => i * (7 - (k % 7)),
};

/**
 * Open addressing written directly from the textbook loop.
 * @param {number[]} keys
 * @param {import('./collision-resolution.js').ProbeMethod} method
 */
function oracle(keys, method) {
  /** @type {(number | null)[]} */
  const table = Array(11).fill(null);
  let probes = 0;
  let failed = 0;
  for (const k of keys) {
    let ok = false;
    for (let i = 0; i < 11; i++) {
      probes++;
      const s = (k + OFFSET[method](k, i)) % 11;
      if (table[s] === null) {
        table[s] = k;
        ok = true;
        break;
      }
    }
    if (!ok) failed++;
  }
  const chains = Array.from({ length: 11 }, () => /** @type {number[]} */ ([]));
  let compares = 0;
  for (const k of keys) {
    compares += chains[k % 11].length;
    chains[k % 11].push(k);
  }
  return { table, probes, failed, chains, compares };
}

/** @param {() => number} rand @param {number} n */
function randomKeys(rand, n) {
  const seen = new Set();
  while (seen.size < n) seen.add(Math.floor(rand() * 100));
  return [...seen];
}

describe('collisionTrace', () => {
  it('matches the oracle for every method on random keys', () => {
    const rand = seeded(11);
    for (let run = 0; run < 150; run++) {
      const keys = randomKeys(rand, run % (MAX_KEYS + 1));
      for (const method of METHODS) {
        const last = collisionTrace(keys, method).at(-1);
        const want = oracle(keys, method);
        expect(last?.kind).toBe('done');
        expect(last?.slots).toEqual(want.table);
        expect(last?.probes).toBe(want.probes);
        expect(last?.failed).toBe(want.failed);
        expect(last?.chains).toEqual(want.chains);
        expect(last?.chainCompares).toBe(want.compares);
        expect((last?.placed ?? 0) + (last?.failed ?? 0)).toBe(keys.length);
      }
    }
  });

  it('handles an empty key list', () => {
    const frames = collisionTrace([], 'linear');
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(frames[1].slots.every((s) => s === null)).toBe(true);
  });

  it('places one key at its home with one probe and no comparison', () => {
    const last = collisionTrace([25], 'double').at(-1);
    expect(last?.slots[3]).toBe(25);
    expect(last?.probes).toBe(1);
    expect(last?.chainCompares).toBe(0);
  });

  it('builds a primary cluster under linear probing', () => {
    const last = collisionTrace(makeKeys('cluster'), 'linear').at(-1);
    expect(last?.slots).toEqual([null, 12, 13, 14, 1, 2, 23, 34, 15, null, null]);
    expect(last?.probes).toBe(29);
    expect(last?.longest).toBe(4);
  });

  it('lets quadratic probing fail on keys with one home while double hashing spreads them', () => {
    const keys = makeKeys('same-home');
    const quad = collisionTrace(keys, 'quadratic');
    expect(quad.at(-1)?.failed).toBe(1);
    const fail = quad.find((f) => f.kind === 'fail');
    expect(fail?.key).toBe(66);
    // i² mod 11 reaches only six offsets: 0, 1, 4, 9, 5, 3.
    expect(
      quad.filter((f) => f.key === 66 && (f.kind === 'probe' || f.kind === 'place')),
    ).toHaveLength(11);
    const dbl = collisionTrace(keys, 'double').at(-1);
    expect(dbl?.failed).toBe(0);
    expect(dbl?.probes).toBe(13);
    expect(dbl?.chains[0]).toEqual(keys);
  });

  it('charges a search hit and a search miss correctly in both tables', () => {
    const keys = makeKeys('mixed');
    const base = collisionTrace(keys, 'linear').at(-1);
    const miss = collisionTrace(keys, 'linear', 34);
    const last = miss.at(-1);
    expect(miss.some((f) => f.kind === 'chain-miss')).toBe(true);
    // Chain 1 holds 1 and 67; the probe walks 1, 2, 3, 4 (taken) and stops at empty slot 5.
    expect((last?.chainCompares ?? 0) - (base?.chainCompares ?? 0)).toBe(2);
    expect((last?.probes ?? 0) - (base?.probes ?? 0)).toBe(5);
    expect(miss.at(-2)?.kind).toBe('probe-miss');
    expect(miss.at(-2)?.slot).toBe(5);

    const hit = collisionTrace(keys, 'linear', 67);
    expect(hit.find((f) => f.kind === 'chain-hit')?.pos).toBe(1);
    const probeHit = hit.find((f) => f.kind === 'probe-hit');
    expect(probeHit?.slot).toBe(4);
    expect(probeHit?.attempt).toBe(3);
  });

  it('reports a miss after probing every slot of a full sequence', () => {
    // Quadratic probing from home 0 sees only taken slots, so the lookup runs out of probes.
    const keys = makeKeys('same-home');
    const frames = collisionTrace(keys, 'quadratic', 77);
    const last = frames.at(-2);
    expect(last?.kind).toBe('probe-miss');
    expect(last?.slot).toBe(-1);
  });
});

describe('probeSlot', () => {
  it('stays in range and double hashing visits every slot', () => {
    for (let k = 0; k <= 99; k++) {
      expect(stepOf(k)).toBeGreaterThanOrEqual(1);
      expect(stepOf(k)).toBeLessThanOrEqual(7);
      const seen = new Set();
      for (let i = 0; i < M; i++) {
        for (const method of METHODS) {
          const s = probeSlot(k, i, method);
          expect(s >= 0 && s < M).toBe(true);
        }
        seen.add(probeSlot(k, i, 'double'));
      }
      expect(seen.size).toBe(M);
      expect(probeSlot(k, 0, 'quadratic')).toBe(homeOf(k));
    }
  });
});

describe('frames', () => {
  it('are not aliased', () => {
    const frames = collisionTrace(makeKeys('mixed'), 'linear');
    const chains = JSON.stringify(frames[5].chains);
    const slots = JSON.stringify(frames[5].slots);
    frames[4].chains[0].push(99);
    frames[4].slots[0] = 99;
    expect(JSON.stringify(frames[5].chains)).toBe(chains);
    expect(JSON.stringify(frames[5].slots)).toBe(slots);
  });

  it('stay under 400 at the key cap', () => {
    const keys = Array.from({ length: MAX_KEYS }, (_, i) => i * 11);
    for (const method of METHODS) {
      expect(collisionTrace(keys, method, 99).length).toBeLessThan(400);
    }
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    for (const method of METHODS) {
      const frames = [
        ...collisionTrace(makeKeys('same-home'), method, 77),
        ...collisionTrace(makeKeys('mixed'), method, 67),
      ];
      const seen = new Set(frames.flatMap((f) => f.lines));
      const all = collisionPseudocode[method].map((_, i) => i);
      // Only quadratic probing can run out of slots before the table is full.
      const want = method === 'quadratic' ? all : all.filter((i) => i !== 8);
      expect([...seen].sort((a, b) => a - b)).toEqual(want);
    }
  });
});

describe('makeKeys and parseKeys', () => {
  it('builds the presets', () => {
    expect(makeKeys('same-home').every((k) => k % 11 === 0)).toBe(true);
    const random = makeKeys('random', seeded(4));
    expect(new Set(random).size).toBe(8);
    expect(random.every((k) => k >= 0 && k <= 99)).toBe(true);
  });

  it('accepts and rejects key lists', () => {
    expect(parseKeys('5, 16,27')).toEqual({ keys: [5, 16, 27] });
    expect(parseKeys('5,100')).toEqual({ error: 'range' });
    expect(parseKeys('a')).toEqual({ error: 'format' });
    expect(parseKeys('1,2,3,4,5,6,7,8,9,10,11')).toEqual({ error: 'count' });
    expect(parseKeys('4, 4')).toEqual({ error: 'duplicate' });
  });
});
