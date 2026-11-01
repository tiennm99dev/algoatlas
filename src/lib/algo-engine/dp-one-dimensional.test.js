import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INPUT,
  MAX_AMOUNT,
  MAX_COIN,
  MAX_HOUSE,
  MAX_HOUSES,
  MAX_STAIRS,
  oneDimPseudocode,
  oneDimTrace,
  parseOneDimList,
} from './dp-one-dimensional.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** @param {Partial<import('./dp-one-dimensional.js').OneDimInput>} over */
const input = (over) => ({ ...DEFAULT_INPUT, ...over });

/**
 * Ways to climb n steps, counted by listing every sequence of 1s and 2s.
 * @param {number} n
 * @returns {number}
 */
function waysBrute(n) {
  if (n < 0) return 0;
  if (n === 0) return 1;
  return waysBrute(n - 1) + waysBrute(n - 2);
}

/** Fewest coins by breadth-first search over amounts. @param {number[]} coins @param {number} a */
function coinsBrute(coins, a) {
  const seen = new Set([0]);
  let level = [0];
  for (let k = 0; level.length; k++) {
    if (level.includes(a)) return k;
    /** @type {number[]} */
    const next = [];
    for (const s of level)
      for (const c of coins)
        if (s + c <= a && !seen.has(s + c)) {
          seen.add(s + c);
          next.push(s + c);
        }
    level = next;
  }
  return Infinity;
}

/** Best robbery over every set of houses with no two neighbours. @param {number[]} h */
function robBrute(h) {
  let best = 0;
  for (let mask = 0; mask < 1 << h.length; mask++) {
    if (mask & (mask << 1)) continue;
    let sum = 0;
    for (let i = 0; i < h.length; i++) if (mask & (1 << i)) sum += h[i];
    best = Math.max(best, sum);
  }
  return best;
}

describe('climbing stairs', () => {
  it('counts the ways for every allowed n', () => {
    for (let n = 0; n <= MAX_STAIRS; n++) {
      const last = oneDimTrace('stairs', input({ n })).at(-1);
      expect(last?.result).toBe(waysBrute(n));
    }
  });

  it('reads two cells per fill after the base cases', () => {
    const frames = oneDimTrace('stairs', input({ n: 5 }));
    expect(frames.at(-1)?.lookups).toBe(8);
    expect(frames.at(-1)?.filled).toBe(6);
    const fill = frames.find((f) => f.kind === 'fill');
    expect(fill?.candidates.map((c) => c.from)).toEqual([1, 0]);
    expect(fill?.chosen).toBe(-1);
    expect(oneDimTrace('stairs', input({ n: 0 })).map((f) => f.kind)).toEqual([
      'start',
      'base',
      'done',
    ]);
  });
});

describe('coin change', () => {
  it('finds 2 coins for 6 with 1, 3 and 4, where greedy needs 3', () => {
    const last = oneDimTrace('coins', input({})).at(-1);
    expect(last?.result).toBe(2);
    expect(last?.picks).toEqual([3, 3]);
    expect(last?.path).toEqual([6, 3, 0]);
    expect(last?.dp).toEqual([0, 1, 2, 1, 1, 2, 2]);
    expect(last?.lookups).toBe(13);
  });

  it('matches breadth-first search on random coin sets', () => {
    const rand = seeded(11);
    for (let t = 0; t < 60; t++) {
      const coins = Array.from({ length: 1 + (t % 4) }, () => 1 + Math.floor(rand() * MAX_COIN));
      const amount = Math.floor(rand() * (MAX_AMOUNT + 1));
      const last = oneDimTrace('coins', input({ coins, amount })).at(-1);
      expect(last?.result).toBe(coinsBrute(coins, amount));
      if (last?.result !== Infinity) {
        expect(last?.picks.reduce((s, c) => s + c, 0)).toBe(amount);
        expect(last?.picks).toHaveLength(/** @type {number} */ (last?.result));
      }
    }
  });

  it('marks impossible amounts with infinity', () => {
    const frames = oneDimTrace('coins', input({ coins: [4, 2, 4], amount: 3 }));
    expect(frames[1].input.coins).toEqual([2, 4]);
    expect(frames.at(-1)?.dp).toEqual([0, Infinity, 1, Infinity]);
    expect(frames.at(-1)?.picks).toEqual([]);
    const first = frames.find((f) => f.kind === 'fill');
    expect(first?.candidates).toEqual([]);
    expect(first?.lines).toEqual([2, 3]);
  });
});

describe('house robber', () => {
  it('robs houses 1, 3 and 5 of 2, 7, 9, 3, 1 for 12', () => {
    const last = oneDimTrace('robber', input({})).at(-1);
    expect(last?.result).toBe(12);
    expect(last?.dp).toEqual([0, 2, 7, 11, 11, 12]);
    expect(last?.picks).toEqual([1, 3, 5]);
  });

  it('matches every non-adjacent subset on random streets', () => {
    const rand = seeded(3);
    const cases = [[5], [0], [0, 0], [1, 9], [9, 1, 1, 9]];
    for (let t = 0; t < 50; t++)
      cases.push(
        Array.from({ length: 1 + (t % MAX_HOUSES) }, () => Math.floor(rand() * (MAX_HOUSE + 1))),
      );
    for (const houses of cases) {
      const last = oneDimTrace('robber', input({ houses })).at(-1);
      expect(last?.result).toBe(robBrute(houses));
      const picks = last?.picks ?? [];
      expect(picks.reduce((s, i) => s + houses[i - 1], 0)).toBe(last?.result);
      for (let k = 1; k < picks.length; k++) expect(picks[k] - picks[k - 1]).toBeGreaterThan(1);
    }
  });
});

describe('parseOneDimList', () => {
  const limits = { min: 1, max: 10, count: 4 };
  it('reads commas and spaces', () => {
    expect(parseOneDimList('1, 3  4', limits)).toEqual({ values: [1, 3, 4] });
  });
  it('refuses bad input', () => {
    expect(parseOneDimList('1, a', limits)).toEqual({ error: 'format' });
    expect(parseOneDimList('-1', limits)).toEqual({ error: 'format' });
    expect(parseOneDimList(' ', limits)).toEqual({ error: 'count' });
    expect(parseOneDimList('1 2 3 4 5', limits)).toEqual({ error: 'count' });
    expect(parseOneDimList('0', limits)).toEqual({ error: 'range' });
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const inp = input({ houses: [3, 1, 4] });
    const frames = oneDimTrace('robber', inp);
    const before = JSON.stringify(frames[3]);
    frames[2].dp[0] = 99;
    frames[2].candidates[0].value = 99;
    frames[2].input.houses[0] = 99;
    frames[2].lines.push(9);
    inp.houses[0] = 42;
    expect(JSON.stringify(frames[3])).toBe(before);
  });

  it('stay short at the caps', () => {
    expect(oneDimTrace('coins', input({ amount: MAX_AMOUNT })).length).toBeLessThan(400);
    expect(oneDimTrace('stairs', input({ n: MAX_STAIRS })).length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['stairs', 'coins', 'robber']))('%s highlights every line', (p) => {
    const used = new Set(oneDimTrace(p, DEFAULT_INPUT).flatMap((f) => f.lines));
    oneDimPseudocode[p].forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
