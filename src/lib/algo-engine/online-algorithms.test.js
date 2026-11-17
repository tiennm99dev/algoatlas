import { describe, expect, it } from 'vitest';
import {
  MAX_BUY,
  MAX_DAYS,
  competitiveRatio,
  loopRequests,
  pagingPseudocode,
  pagingTrace,
  ratioCurve,
  skiCost,
  skiPseudocode,
  skiTrace,
} from './online-algorithms.js';

/** Deterministic LCG so random sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * Fewest faults any eviction rule can make, by trying every choice (small inputs only).
 * @param {string[]} req @param {number} k
 */
function bruteOpt(req, k) {
  /** @param {number} t @param {string[]} cache @returns {number} */
  const go = (t, cache) => {
    if (t === req.length) return 0;
    const p = req[t];
    if (cache.includes(p)) return go(t + 1, cache);
    if (cache.length < k) return 1 + go(t + 1, [...cache, p]);
    let best = Infinity;
    for (let i = 0; i < cache.length; i++) {
      best = Math.min(
        best,
        1 +
          go(
            t + 1,
            cache.map((x, j) => (j === i ? p : x)),
          ),
      );
    }
    return best;
  };
  return go(0, []);
}

/** LRU faults from a plain recency list. @param {string[]} req @param {number} k */
function lruFaults(req, k) {
  /** @type {string[]} */
  const list = [];
  let faults = 0;
  for (const p of req) {
    const i = list.indexOf(p);
    if (i >= 0) list.splice(i, 1);
    else {
      faults++;
      if (list.length === k) list.shift();
    }
    list.push(p);
  }
  return faults;
}

/** FIFO faults from a plain queue. @param {string[]} req @param {number} k */
function fifoFaults(req, k) {
  /** @type {string[]} */
  const queue = [];
  let faults = 0;
  for (const p of req) {
    if (queue.includes(p)) continue;
    faults++;
    if (queue.length === k) queue.shift();
    queue.push(p);
  }
  return faults;
}

/** @param {() => number} rand @param {number} length @param {number} pages */
const randomRequests = (rand, length, pages) =>
  Array.from({ length }, () => String.fromCharCode(65 + Math.floor(rand() * pages)));

describe('ski rental', () => {
  it('charges rent until day k and b on day k', () => {
    expect(skiCost(10, 10, 3)).toBe(3);
    expect(skiCost(10, 10, 10)).toBe(19);
    expect(skiCost(10, 10, 25)).toBe(19);
    expect(skiCost(10, 0, 25)).toBe(25);
    expect(skiCost(10, 1, 1)).toBe(10);
  });

  it('gives the break-even plan a ratio of 2 − 1/b', () => {
    for (let b = 2; b <= MAX_BUY; b++) {
      expect(competitiveRatio(b, b)).toBeCloseTo(2 - 1 / b);
      expect(Math.max(...ratioCurve(b, b))).toBeCloseTo(2 - 1 / b);
    }
  });

  it('finds no plan better than break-even, and worst cases on the purchase day', () => {
    for (let b = 2; b <= MAX_BUY; b++) {
      for (let k = 1; k <= MAX_DAYS; k++) {
        const worst = Math.max(...ratioCurve(b, k, Math.max(MAX_DAYS, k + b)));
        expect(worst).toBeCloseTo(competitiveRatio(b, k));
        expect(worst).toBeGreaterThanOrEqual(competitiveRatio(b, b) - 1e-9);
      }
    }
    expect(competitiveRatio(10, 0)).toBe(Infinity);
  });

  it('traces each day with the running cost and the optimum so far', () => {
    const frames = skiTrace(4, 3, 6, true);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'day',
      'day',
      'day',
      'day',
      'day',
      'day',
      'done',
    ]);
    expect(frames.at(-1)?.actions).toEqual(['rent', 'rent', 'buy', 'own', 'own', 'own']);
    expect(frames.map((f) => f.cost)).toEqual([0, 1, 2, 6, 6, 6, 6, 6]);
    expect(frames.map((f) => f.opt)).toEqual([0, 1, 2, 3, 4, 4, 4, 4]);
    expect(frames.at(-1)?.over).toBe(true);
    expect(skiTrace(4, 3, 0, false).map((f) => f.kind)).toEqual(['start', 'done']);
  });

  it('records frames that do not alias each other', () => {
    const frames = skiTrace(5, 0, 3, false);
    frames[1].actions.push('buy');
    expect(frames[2].actions).toEqual(['rent', 'rent']);
  });
});

describe('paging', () => {
  it('matches independent LRU and FIFO counts and a brute-force optimum', () => {
    const rand = seeded(9);
    for (let trial = 0; trial < 150; trial++) {
      const k = 1 + Math.floor(rand() * 3);
      const req = randomRequests(rand, 1 + Math.floor(rand() * 9), 2 + Math.floor(rand() * 3));
      const end = pagingTrace(req, k).at(-1)?.policies;
      expect(end?.lru.faults).toBe(lruFaults(req, k));
      expect(end?.fifo.faults).toBe(fifoFaults(req, k));
      expect(end?.opt.faults).toBe(bruteOpt(req, k));
    }
  });

  it('keeps LRU within k times the optimum', () => {
    const rand = seeded(4);
    for (let trial = 0; trial < 300; trial++) {
      const k = 1 + Math.floor(rand() * 5);
      const req = randomRequests(rand, 1 + Math.floor(rand() * 30), 1 + Math.floor(rand() * 8));
      const end = pagingTrace(req, k).at(-1)?.policies;
      expect(end?.opt.faults).toBeLessThanOrEqual(end?.lru.faults ?? 0);
      expect(end?.lru.faults).toBeLessThanOrEqual(k * (end?.opt.faults ?? 0));
    }
  });

  it('makes LRU fault on every request of a loop over k + 1 pages', () => {
    const req = loopRequests(3, 12);
    expect(req.join('')).toBe('ABCDABCDABCD');
    const end = pagingTrace(req, 3).at(-1)?.policies;
    expect(end?.lru.faults).toBe(12);
    expect(end?.fifo.faults).toBe(12);
    expect(end?.opt.faults).toBe(6);
  });

  it('shows Belady’s anomaly: FIFO can fault more with a bigger cache', () => {
    const req = 'ABCDABEABCDE'.split('');
    expect(pagingTrace(req, 3).at(-1)?.policies.fifo.faults).toBe(9);
    expect(pagingTrace(req, 4).at(-1)?.policies.fifo.faults).toBe(10);
  });

  it('reports hits, slots and evictions per request', () => {
    const frames = pagingTrace('ABAC'.split(''), 2);
    expect(frames[3].policies.lru).toMatchObject({ hit: true, slot: 0, evicted: null });
    // LRU drops B (used at step 2), FIFO drops A (loaded first).
    expect(frames[4].policies.lru).toMatchObject({ hit: false, evicted: 'B', slots: ['A', 'C'] });
    expect(frames[4].policies.fifo).toMatchObject({ evicted: 'A', slots: ['C', 'B'] });
    expect(frames[4].policies.opt.faults).toBe(3);
  });

  it('records frames that do not alias each other', () => {
    const frames = pagingTrace('ABC'.split(''), 2);
    frames[1].policies.lru.slots[1] = 'Z';
    expect(frames[2].policies.lru.slots).toEqual(['A', 'B']);
  });
});

describe('pseudocode coverage', () => {
  it('ski rental highlights every line', () => {
    const seen = new Set(skiTrace(3, 2, 4, true).flatMap((f) => f.lines));
    skiPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });

  it('paging highlights every line', () => {
    const seen = new Set(pagingTrace('ABAC'.split(''), 2).flatMap((f) => f.lines));
    pagingPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
