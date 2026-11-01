import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/branch-and-bound/copy.en.js';
import {
  BNB_PRESETS,
  MAX_ITEMS,
  bnbPseudocode,
  bnbTrace,
  boundOf,
  formatItems,
  parseCapacity,
  parseItems,
  plainNodeCount,
  sortItems,
} from './branch-and-bound.js';

/** @typedef {import('./branch-and-bound.js').BnbFrame} BnbFrame */

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** The optimum from the classic knapsack table, independent of the engine. */
/** @param {[number, number][]} items @param {number} capacity */
function knapsackDp(items, capacity) {
  const dp = new Array(capacity + 1).fill(0);
  for (const [w, v] of items) {
    for (let c = capacity; c >= w; c--) dp[c] = Math.max(dp[c], dp[c - w] + v);
  }
  return dp[capacity];
}

/** @param {[number, number][]} items @param {number} capacity @param {'best'|'depth'} [order] */
const last = (items, capacity, order) =>
  /** @type {BnbFrame} */ (bnbTrace(items, capacity, order).at(-1));

const preset = (/** @type {string} */ key) =>
  /** @type {(typeof BNB_PRESETS)[number]} */ (BNB_PRESETS.find((p) => p.key === key));

describe('branch and bound', () => {
  it('reaches the table’s optimum in both orders on random inputs', () => {
    const rand = seeded(21);
    for (let t = 0; t < 120; t++) {
      const n = 1 + Math.floor(rand() * MAX_ITEMS);
      /** @type {[number, number][]} */
      const items = Array.from({ length: n }, () => [
        1 + Math.floor(rand() * 15),
        1 + Math.floor(rand() * 60),
      ]);
      const capacity = 1 + Math.floor(rand() * 30);
      const want = knapsackDp(items, capacity);
      expect(last(items, capacity, 'best').best).toBe(want);
      expect(last(items, capacity, 'depth').best).toBe(want);
    }
  });

  it('solves each example', () => {
    expect(last(preset('classic').items, 8, 'best').best).toBe(150);
    expect(last(preset('greedy').items, 10, 'best').best).toBe(90);
    expect(last(preset('order').items, 14, 'best').best).toBe(87);
  });

  it('never makes more nodes than backtracking with no bound', () => {
    const rand = seeded(4);
    for (let t = 0; t < 60; t++) {
      /** @type {[number, number][]} */
      const items = Array.from({ length: 6 }, () => [
        1 + Math.floor(rand() * 12),
        1 + Math.floor(rand() * 50),
      ]);
      const capacity = 5 + Math.floor(rand() * 25);
      const plain = plainNodeCount(items, capacity);
      expect(last(items, capacity, 'best').nodes.length).toBeLessThanOrEqual(plain);
      expect(last(items, capacity, 'depth').nodes.length).toBeLessThanOrEqual(plain);
    }
  });

  it('best-first expands only nodes whose bound is at least the optimum', () => {
    const rand = seeded(8);
    for (let t = 0; t < 60; t++) {
      /** @type {[number, number][]} */
      const items = Array.from({ length: 5 }, () => [
        1 + Math.floor(rand() * 12),
        1 + Math.floor(rand() * 50),
      ]);
      const capacity = 5 + Math.floor(rand() * 20);
      const f = last(items, capacity, 'best');
      for (const n of f.nodes) {
        if (n.status === 'expanded') expect(n.bound).toBeGreaterThanOrEqual(f.best);
      }
    }
  });

  it('every bound covers every packing that can be reached from its node', () => {
    const f = last(preset('order').items, 14, 'best');
    const items = f.items;
    for (const n of f.nodes) {
      if (n.status === 'over') continue;
      /** @param {number} level @param {number} value @param {number} weight @returns {number} */
      const bestBelow = (level, value, weight) => {
        if (level === items.length) return value;
        const skip = bestBelow(level + 1, value, weight);
        if (weight + items[level].weight > 14) return skip;
        return Math.max(
          skip,
          bestBelow(level + 1, value + items[level].value, weight + items[level].weight),
        );
      };
      expect(n.bound + 1e-9).toBeGreaterThanOrEqual(bestBelow(n.level, n.value, n.weight));
    }
  });

  it('takes the highest bound first, and the take branch first in depth-first', () => {
    for (const f of bnbTrace(preset('classic').items, 8, 'best')) {
      const bounds = f.frontier.map((id) => f.nodes[id].bound);
      expect(bounds).toEqual(bounds.slice().sort((a, b) => b - a));
    }
    const depth = bnbTrace(preset('classic').items, 8, 'depth');
    const pops = depth.filter((f) => f.kind === 'pop').map((f) => f.nodes[f.current]);
    expect(pops[1].took).toBe(true);
    expect(pops[1].parent).toBe(0);
  });

  it('handles one item, and an item too heavy to fit', () => {
    expect(last([[3, 7]], 3).best).toBe(7);
    const none = last([[5, 7]], 3);
    expect(none.best).toBe(0);
    expect(none.nodes.some((n) => n.status === 'over')).toBe(true);
  });

  it('counts the known classic run', () => {
    const f = last(preset('classic').items, 8, 'best');
    expect(f.nodes).toHaveLength(21);
    expect(f.expanded).toBe(10);
    expect(f.pruned).toBe(7);
    expect(plainNodeCount(preset('classic').items, 8)).toBe(27);
  });

  it('keeps frames independent', () => {
    const frames = bnbTrace(preset('classic').items, 8);
    frames[1].nodes[0].value = 999;
    frames[1].frontier.push(999);
    frames[1].items[0].value = 999;
    expect(frames[2].nodes[0].value).toBe(0);
    expect(frames[2].frontier).not.toContain(999);
    expect(frames[2].items[0].value).not.toBe(999);
  });

  it('stays under the frame budget at the cap', () => {
    /** @type {[number, number][]} */
    const same = Array.from({ length: MAX_ITEMS }, () => [1, 1]);
    expect(bnbTrace(same, 3, 'depth').length).toBeLessThan(400);
    expect(bnbTrace(same, 3, 'best').length).toBeLessThan(400);
    expect(bnbTrace(same, 3)[0].kind).toBe('start');
    expect(bnbTrace(same, 3).at(-1)?.kind).toBe('done');
  });
});

describe('bound and input', () => {
  it('computes the fractional bound', () => {
    const items = sortItems(preset('classic').items);
    expect(items.map((x) => x.name).join('')).toBe('DACB');
    expect(boundOf(items, 8, 0, 0, 0)).toBe(175);
    expect(boundOf(sortItems(preset('greedy').items), 10, 0, 0, 0)).toBe(96);
  });

  it('reads items and capacity, and refuses bad ones', () => {
    expect(parseItems('2:40 3:50')).toEqual([
      [2, 40],
      [3, 50],
    ]);
    expect(formatItems([[2, 40]])).toBe('2:40');
    expect(parseItems('')).toBeNull();
    expect(parseItems('2-40')).toBeNull();
    expect(parseItems('0:5')).toBeNull();
    expect(parseItems('100:5')).toBeNull();
    expect(parseItems('1:1 1:1 1:1 1:1 1:1 1:1 1:1')).toBeNull();
    expect(parseCapacity('8')).toBe(8);
    expect(parseCapacity('0')).toBeNull();
    expect(parseCapacity('x')).toBeNull();
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const frames = BNB_PRESETS.flatMap((p) => bnbTrace(p.items, p.capacity, 'best'));
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(bnbPseudocode.map((_, i) => i));
  });
});

describe('quiz answers', () => {
  it('match the engine', () => {
    /** @param {number} i */
    const answer = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    expect(last(preset('classic').items, 8).nodes[0].bound).toBe(answer(0));
    expect(last(preset('classic').items, 8).best).toBe(answer(1));
    expect(last(preset('greedy').items, 10).nodes[0].bound).toBe(answer(2));
    expect(last(preset('order').items, 14, 'best').nodes).toHaveLength(answer(3));
    expect(last(preset('order').items, 14, 'best').expanded).toBe(13);
    expect(last(preset('order').items, 14, 'depth').nodes).toHaveLength(answer(4));
    expect(last(preset('order').items, 14, 'depth').expanded).toBe(35);
    expect(plainNodeCount(preset('order').items, 14)).toBe(121);
  });
});
