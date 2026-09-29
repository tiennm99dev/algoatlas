import { describe, expect, it } from 'vitest';
import {
  HASH_SIZES,
  MAX_KEYS,
  MAX_LOAD,
  hashKey,
  hashPseudocode,
  hashTableTrace,
  makeKeys,
  parseKeys,
} from './hash-table.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @type {import('./hash-table.js').HashFn[]} */
const FNS = ['mod-prime', 'mod-pow2', 'multiply'];
const INITIAL = [12, 44, 13, 88, 23, 94, 11, 39, 20, 16];

describe('hashTableTrace invariants', () => {
  it('leaves every key in its bucket with load at most 0.75', () => {
    const rand = seeded(7);
    for (let run = 0; run < 200; run++) {
      const len = 1 + Math.floor(rand() * MAX_KEYS);
      // A small range forces duplicates.
      const keys = Array.from({ length: len }, () => Math.floor(rand() * (run % 2 ? 30 : 1000)));
      const fn = FNS[run % 3];
      const last = hashTableTrace(keys, fn).at(-1);
      expect(last?.kind).toBe('done');
      const { buckets, m } = /** @type {import('./hash-table.js').HashFrame} */ (last);
      buckets.forEach((chain, b) => {
        for (const key of chain) expect(hashKey(key, m, fn)).toBe(b);
      });
      expect(buckets.flat().length).toBe(new Set(keys).size);
      expect(last?.load).toBeLessThanOrEqual(MAX_LOAD);
    }
  });

  it('does not raise n for a duplicate and emits an update frame', () => {
    const frames = hashTableTrace([5, 9, 5], 'mod-prime');
    const update = frames.find((f) => f.kind === 'update');
    expect(update?.key).toBe(5);
    expect(frames.at(-1)?.n).toBe(2);
    expect(frames.filter((f) => f.kind === 'append')).toHaveLength(2);
  });

  it('keeps the key multiset and steps to the next size on every grow', () => {
    for (const fn of FNS) {
      const keys = makeKeys('random', MAX_KEYS, seeded(3));
      const frames = hashTableTrace(keys, fn);
      const sizes = [HASH_SIZES[fn][0]];
      frames.forEach((f, i) => {
        if (f.kind !== 'grown') return;
        const before = frames.findLast((g, j) => j < i && g.kind === 'grow');
        expect(before?.buckets.flat().sort()).toEqual(f.buckets.flat().sort());
        expect(f.m).toBe(HASH_SIZES[fn][sizes.length]);
        sizes.push(f.m);
        expect(f.pending).toEqual([]);
      });
      expect(sizes.length).toBeGreaterThan(1);
    }
  });

  it('charges a miss the chain length and a hit pos + 1', () => {
    const base = hashTableTrace(INITIAL, 'mod-prime');
    const before = base.at(-1)?.comparisons ?? 0;
    const miss = hashTableTrace(INITIAL, 'mod-prime', 62).at(-1);
    expect(miss?.kind).toBe('search-miss');
    expect((miss?.comparisons ?? 0) - before).toBe(miss?.buckets[miss.bucket].length);
    for (const key of INITIAL) {
      const hit = hashTableTrace(INITIAL, 'mod-prime', key).at(-1);
      expect(hit?.kind).toBe('search-hit');
      expect((hit?.comparisons ?? 0) - before).toBe((hit?.pos ?? -2) + 1);
    }
  });

  it('counts no comparisons or collisions during a rehash', () => {
    const frames = hashTableTrace(INITIAL, 'mod-prime');
    frames.forEach((f, i) => {
      if (f.kind === 'rehash' || f.kind === 'grow' || f.kind === 'grown') {
        expect(f.comparisons).toBe(frames[i - 1].comparisons);
        expect(f.collisions).toBe(frames[i - 1].collisions);
      }
    });
  });

  it('matches the documented result for the initial keys', () => {
    const last = hashTableTrace(INITIAL, 'mod-prime').at(-1);
    expect(last?.m).toBe(23);
    expect(last?.longest).toBe(2);
    expect(last?.buckets[16]).toEqual([39, 16]);
  });
});

describe('hashKey', () => {
  it('stays in [0, m) for every key and size', () => {
    for (const fn of FNS) {
      for (const m of HASH_SIZES[fn]) {
        for (let k = 0; k <= 999; k++) {
          const h = hashKey(k, m, fn);
          expect(Number.isInteger(h) && h >= 0 && h < m).toBe(true);
        }
      }
    }
  });
});

describe('multiples of 8', () => {
  it('pile into bucket 0 under a power-of-two size, not under a prime', () => {
    const keys = makeKeys('multiples-of-8', 10);
    const pow2 = hashTableTrace(keys, 'mod-pow2');
    for (const f of pow2) {
      if (f.kind === 'append' && f.m <= 8) expect(f.bucket).toBe(0);
    }
    expect(pow2.at(-1)?.m).toBe(16);
    expect(pow2.at(-1)?.longest).toBe(5);
    expect(hashTableTrace(keys, 'mod-prime').at(-1)?.longest).toBe(1);
  });
});

describe('frames', () => {
  it('are not aliased', () => {
    const frames = hashTableTrace(INITIAL, 'mod-prime');
    const next = JSON.stringify(frames[4].buckets);
    frames[3].buckets[0].push(999);
    expect(JSON.stringify(frames[4].buckets)).toBe(next);
  });

  it('stay within a few hundred at the size caps', () => {
    const keys = makeKeys('random', MAX_KEYS, seeded(5));
    for (const fn of FNS) {
      expect(hashTableTrace(keys, fn, keys[0]).length).toBeLessThan(400);
    }
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const keys = [...INITIAL, 12];
    const frames = [
      ...hashTableTrace(keys, 'mod-prime', 39),
      ...hashTableTrace(keys, 'mod-prime', 62),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(hashPseudocode.map((_, i) => i));
  });
});

describe('makeKeys', () => {
  it('builds each preset', () => {
    expect(makeKeys('sequential', 3)).toEqual([100, 101, 102]);
    expect(makeKeys('multiples-of-8', 4)).toEqual([0, 8, 16, 24]);
    const random = makeKeys('random', 24, seeded(9));
    expect(new Set(random).size).toBe(24);
    expect(random.every((k) => k >= 0 && k <= 999)).toBe(true);
  });
});

describe('parseKeys', () => {
  it('accepts whole numbers with loose spacing', () => {
    expect(parseKeys('5, 17,3')).toEqual({ keys: [5, 17, 3] });
  });

  it('rejects bad input', () => {
    expect(parseKeys('5,-3')).toEqual({ error: 'range' });
    expect(parseKeys('a,b')).toEqual({ error: 'format' });
    expect(parseKeys('')).toEqual({ error: 'format' });
    expect(parseKeys('1,2.5')).toEqual({ error: 'format' });
    expect(parseKeys(Array(25).fill('7').join(','))).toEqual({ error: 'count' });
  });
});
