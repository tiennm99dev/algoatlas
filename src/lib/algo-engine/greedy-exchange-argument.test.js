import { describe, expect, it } from 'vitest';
import {
  MAX_AMOUNT,
  MAX_COINS,
  changePseudocode,
  changeTrace,
  counterexamples,
  fewestCoins,
  greedyCoins,
  parseCoins,
  verdictOf,
} from './greedy-exchange-argument.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * Fewest coins by trying every count of every coin: an oracle independent of the DP table.
 * @param {number[]} coins @param {number} x
 */
function bruteFewest(coins, x) {
  /** @param {number} k @param {number} rest @returns {number} */
  const go = (k, rest) => {
    if (rest === 0) return 0;
    if (k === coins.length) return Infinity;
    let best = Infinity;
    for (let q = 0; q * coins[k] <= rest; q++)
      best = Math.min(best, q + go(k + 1, rest - q * coins[k]));
    return best;
  };
  return go(0, x);
}

/** @param {() => number} rand */
function randomCoins(rand) {
  const n = 1 + Math.floor(rand() * 4);
  const set = new Set(rand() < 0.7 ? [1] : []);
  while (set.size < n) set.add(2 + Math.floor(rand() * 20));
  return [...set].sort((a, b) => b - a);
}

describe('greedy change trace', () => {
  it('matches the oracle on the coin count and pays exactly when it can', () => {
    const rand = seeded(3);
    for (let t = 0; t < 60; t++) {
      const coins = randomCoins(rand);
      const x = 1 + Math.floor(rand() * 60);
      const done = changeTrace(coins, x).at(-1);
      if (!done) throw new Error('empty trace');
      const best = bruteFewest(coins, x);
      expect(done.best).toBe(best === Infinity ? -1 : best);
      const paid = done.taken.reduce((s, q, k) => s + q * done.coins[k], 0);
      expect(paid + done.rest).toBe(x);
      const bestPaid = done.bestTaken.reduce((s, q, k) => s + q * done.coins[k], 0);
      if (best !== Infinity) expect(bestPaid).toBe(x);
      expect(done.bestTaken.reduce((s, q) => s + q, 0)).toBe(best === Infinity ? 0 : best);
      expect(done.verdict).toBe(verdictOf(coins, x));
    }
  });

  it('is optimal for 1, 5, 10, 25 and not for 1, 3, 4 at 6', () => {
    const us = changeTrace([25, 10, 5, 1], 63).at(-1);
    expect(us?.taken).toEqual([2, 1, 0, 3]);
    expect(us?.verdict).toBe('optimal');
    const bad = changeTrace([1, 3, 4], 6).at(-1);
    expect(bad?.coins).toEqual([4, 3, 1]);
    expect(bad?.taken).toEqual([1, 0, 2]);
    expect(bad?.count).toBe(3);
    expect(bad?.best).toBe(2);
    expect(bad?.bestTaken).toEqual([0, 2, 0]);
    expect(bad?.verdict).toBe('worse');
  });

  it('gets stuck without a 1 coin even when change exists, and reports impossible amounts', () => {
    const frames = changeTrace([5, 3], 9);
    expect(frames.some((f) => f.kind === 'fail')).toBe(true);
    expect(frames.at(-1)?.rest).toBe(1);
    expect(frames.at(-1)?.verdict).toBe('stuck');
    expect(changeTrace([5, 3], 7).at(-1)?.verdict).toBe('impossible');
  });

  it('makes one division per coin', () => {
    const done = changeTrace([1, 2, 5, 10, 20, 50], 88).at(-1);
    expect(done?.divisions).toBe(6);
    expect(done?.count).toBe(6);
  });

  it('stays small at the caps', () => {
    const coins = [100, 50, 20, 10, 5, 3, 2, 1].slice(0, MAX_COINS);
    expect(changeTrace(coins, MAX_AMOUNT).length).toBeLessThan(400);
  });

  it('starts at start, ends at done and keeps frames independent', () => {
    const input = [1, 3, 4];
    const frames = changeTrace(input, 6);
    expect(frames[0].kind).toBe('start');
    expect(frames[0].coins).toEqual([1, 3, 4]);
    expect(frames.at(-1)?.kind).toBe('done');
    input[0] = 99;
    expect(frames[0].coins[0]).toBe(1);
    const take = frames.findIndex((f) => f.kind === 'take');
    frames[take].taken[0] = 50;
    frames[take].coins[0] = 50;
    expect(frames[take + 1].taken[0]).toBe(1);
    expect(frames[take + 1].coins[0]).toBe(4);
  });
});

describe('counterexample search', () => {
  it('finds none for canonical systems', () => {
    expect(counterexamples([25, 10, 5, 1])).toEqual([]);
    expect(counterexamples([50, 20, 10, 5, 2, 1])).toEqual([]);
  });

  it('lists the amounts where greedy loses, smallest first', () => {
    const found = counterexamples([4, 3, 1], 20);
    expect(found[0]).toEqual({ amount: 6, greedy: 3, best: 2, stuck: false });
    for (const c of found) {
      expect(c.greedy).toBe(greedyCoins([4, 3, 1], c.amount).count);
      expect(c.best).toBe(bruteFewest([4, 3, 1], c.amount));
    }
    expect(counterexamples([10, 7, 1])[0].amount).toBe(14);
    expect(counterexamples([9, 6, 5, 1])[0].amount).toBe(11);
  });

  it('marks stuck amounts when there is no 1 coin', () => {
    expect(counterexamples([5, 3], 12)).toEqual([
      { amount: 6, greedy: 1, best: 2, stuck: true },
      { amount: 9, greedy: 2, best: 3, stuck: true },
      { amount: 11, greedy: 2, best: 3, stuck: true },
      { amount: 12, greedy: 2, best: 4, stuck: true },
    ]);
  });

  it('agrees with the oracle on random systems', () => {
    const rand = seeded(11);
    for (let t = 0; t < 20; t++) {
      const coins = randomCoins(rand);
      const found = new Set(counterexamples(coins, 40).map((c) => c.amount));
      for (let x = 1; x <= 40; x++) {
        const best = bruteFewest(coins, x);
        const g = greedyCoins(coins, x);
        const loses = best !== Infinity && (g.rest > 0 || g.count > best);
        expect(found.has(x)).toBe(loses);
      }
    }
  });

  it('builds one fewest payment or none', () => {
    expect(fewestCoins([4, 3, 1], 6)).toEqual({ count: 2, taken: [0, 2, 0] });
    expect(fewestCoins([5, 3], 7)).toBeNull();
  });
});

describe('parsing coins', () => {
  it('reads commas and spaces, drops repeats and sorts largest first', () => {
    expect(parseCoins('1, 3 4 3')).toEqual({ coins: [4, 3, 1] });
    expect(parseCoins('x')).toEqual({ error: 'format' });
    expect(parseCoins('0 5')).toEqual({ error: 'range' });
    expect(parseCoins('101')).toEqual({ error: 'range' });
    expect(parseCoins('1 2 3 4 5 6 7 8 9')).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const frames = [changeTrace([4, 3, 1], 6), changeTrace([5, 3], 9)].flat();
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(changePseudocode.map((_, i) => i));
  });
});
