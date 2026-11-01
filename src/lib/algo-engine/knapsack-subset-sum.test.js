import { describe, expect, it } from 'vitest';
import {
  KNAP_PRESETS,
  MAX_CAPACITY,
  MAX_ITEMS,
  capacityBits,
  formatItems,
  greedyValue,
  knapPseudocode,
  knapTrace,
  parseCapacity,
  parseItems,
} from './knapsack-subset-sum.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** @typedef {import('./knapsack-subset-sum.js').KnapItem} KnapItem */

/** Best value over every subset that fits. @param {KnapItem[]} items @param {number} cap */
function knapsackBrute(items, cap) {
  let best = 0;
  for (let mask = 0; mask < 1 << items.length; mask++) {
    let w = 0;
    let v = 0;
    items.forEach((it, k) => {
      if (mask & (1 << k)) {
        w += it.weight;
        v += it.value;
      }
    });
    if (w <= cap && v > best) best = v;
  }
  return best;
}

/** Is some subset exactly this heavy? @param {KnapItem[]} items @param {number} target */
function subsetBrute(items, target) {
  for (let mask = 0; mask < 1 << items.length; mask++) {
    let w = 0;
    items.forEach((it, k) => {
      if (mask & (1 << k)) w += it.weight;
    });
    if (w === target) return 1;
  }
  return 0;
}

/** Best value when items may repeat. @param {KnapItem[]} items @param {number} cap @returns {number} */
function unboundedBrute(items, cap) {
  let best = 0;
  for (const it of items)
    if (it.weight <= cap) best = Math.max(best, it.value + unboundedBrute(items, cap - it.weight));
  return best;
}

/** @param {() => number} rand @returns {{items: KnapItem[], capacity: number}} */
function randomCase(rand) {
  const n = 1 + Math.floor(rand() * MAX_ITEMS);
  const items = Array.from({ length: n }, () => ({
    weight: 1 + Math.floor(rand() * 8),
    value: Math.floor(rand() * 20),
  }));
  return { items, capacity: Math.floor(rand() * 11) };
}

const SMALL = KNAP_PRESETS.knapsack[0];
const TRAP = KNAP_PRESETS.knapsack[1];
const SINGLE = KNAP_PRESETS.knapsack[2];

describe('0/1 knapsack table', () => {
  it('matches every subset by brute force and names items that fit', () => {
    const rand = seeded(11);
    for (let t = 0; t < 80; t++) {
      const { items, capacity } = randomCase(rand);
      const last = knapTrace('knapsack', 'table', items, capacity).at(-1);
      expect(last?.result).toBe(knapsackBrute(items, capacity));
      const picked = (last?.picked ?? []).map((i) => items[i - 1]);
      expect(picked.reduce((s, it) => s + it.weight, 0)).toBeLessThanOrEqual(capacity);
      expect(picked.reduce((s, it) => s + it.value, 0)).toBe(last?.result);
    }
  });

  it('takes items 2 and 3 on the four-item example', () => {
    const last = knapTrace('knapsack', 'table', SMALL.items, SMALL.capacity).at(-1);
    expect(last?.result).toBe(9);
    expect(last?.picked).toEqual([2, 3]);
    expect(last?.shown[3][6]).toBe(6);
    expect(last?.filled).toBe(5 * 8);
  });

  it('fills a known table for one item', () => {
    const frames = knapTrace('knapsack', 'table', [{ weight: 2, value: 3 }], 3);
    expect(frames.at(-1)?.shown).toEqual([
      [0, 0, 0, 0],
      [0, 0, 3, 3],
    ]);
    const fills = frames.filter((f) => f.kind === 'fill');
    expect(fills.map((f) => [f.c, f.fits, f.take, f.took])).toEqual([
      [0, false, null, false],
      [1, false, null, false],
      [2, true, 3, true],
      [3, true, 3, true],
    ]);
  });

  it('walks back one step per item, ending in row 0', () => {
    const last = knapTrace('knapsack', 'table', SMALL.items, SMALL.capacity).at(-1);
    expect(last?.path).toEqual([
      [4, 7],
      [3, 7],
      [2, 3],
      [1, 0],
      [0, 0],
    ]);
  });

  it('beats the greedy rule on the trap', () => {
    const last = knapTrace('knapsack', 'table', TRAP.items, TRAP.capacity).at(-1);
    expect(last?.result).toBe(22);
    expect(greedyValue(TRAP.items, TRAP.capacity)).toBe(16);
  });

  it('handles capacity 0 and an item too heavy to fit', () => {
    const items = [{ weight: 5, value: 9 }];
    expect(knapTrace('knapsack', 'table', items, 0).at(-1)?.result).toBe(0);
    const last = knapTrace('knapsack', 'table', items, 3).at(-1);
    expect(last?.result).toBe(0);
    expect(last?.picked).toEqual([]);
  });
});

describe('subset sum table', () => {
  it('matches brute force and names items with the exact sum', () => {
    const rand = seeded(12);
    for (let t = 0; t < 80; t++) {
      const { items, capacity } = randomCase(rand);
      const last = knapTrace('subset', 'table', items, capacity).at(-1);
      expect(last?.result).toBe(subsetBrute(items, capacity));
      const sum = (last?.picked ?? []).reduce((s, i) => s + items[i - 1].weight, 0);
      if (last?.result) expect(sum).toBe(capacity);
      else expect(last?.picked).toEqual([]);
    }
  });

  it('answers the two examples', () => {
    const [yes, even] = KNAP_PRESETS.subset;
    expect(knapTrace('subset', 'table', yes.items, yes.capacity).at(-1)?.result).toBe(1);
    const no = knapTrace('subset', 'table', even.items, even.capacity);
    expect(no.at(-1)?.result).toBe(0);
    expect(no.some((f) => f.kind === 'trace')).toBe(false);
  });

  it('matches knapsack with each value equal to its weight', () => {
    const rand = seeded(13);
    for (let t = 0; t < 40; t++) {
      const { items, capacity } = randomCase(rand);
      const same = items.map((it) => ({ weight: it.weight, value: it.weight }));
      const best = knapTrace('knapsack', 'table', same, capacity).at(-1)?.result;
      expect(best === capacity ? 1 : 0).toBe(subsetBrute(items, capacity));
    }
  });
});

describe('one-row layouts', () => {
  it('downward agrees with the full table for both problems', () => {
    const rand = seeded(14);
    for (let t = 0; t < 60; t++) {
      const { items, capacity } = randomCase(rand);
      for (const p of /** @type {const} */ (['knapsack', 'subset'])) {
        const down = knapTrace(p, 'row-down', items, capacity).at(-1);
        expect(down?.result).toBe(knapTrace(p, 'table', items, capacity).at(-1)?.result);
        expect(down?.reuses).toBe(0);
      }
    }
  });

  it('upward solves the problem where items repeat', () => {
    const rand = seeded(15);
    for (let t = 0; t < 40; t++) {
      const { items, capacity } = randomCase(rand);
      expect(knapTrace('knapsack', 'row-up', items, capacity).at(-1)?.result).toBe(
        unboundedBrute(items, capacity),
      );
    }
  });

  it('upward uses one item three times and is flagged', () => {
    const frames = knapTrace('knapsack', 'row-up', SINGLE.items, SINGLE.capacity);
    const last = frames.at(-1);
    expect(last?.result).toBe(9);
    expect(last?.correct).toBe(3);
    expect(last?.reuses).toBe(3);
    expect(frames.filter((f) => f.reused).map((f) => f.c)).toEqual([4, 5, 6]);
    expect(knapTrace('knapsack', 'row-down', SINGLE.items, SINGLE.capacity).at(-1)?.result).toBe(3);
  });

  it('sweeps in the named direction over cells that fit', () => {
    const down = knapTrace('knapsack', 'row-down', [{ weight: 2, value: 1 }], 4);
    expect(down.filter((f) => f.kind === 'fill').map((f) => f.c)).toEqual([4, 3, 2]);
    const up = knapTrace('knapsack', 'row-up', [{ weight: 2, value: 1 }], 4);
    expect(up.filter((f) => f.kind === 'fill').map((f) => f.c)).toEqual([2, 3, 4]);
    expect(down[0].table).toHaveLength(1);
  });

  it('counts the row writes', () => {
    const last = knapTrace('knapsack', 'row-down', [{ weight: 2, value: 1 }], 4).at(-1);
    expect(last?.filled).toBe(5 + 3);
  });
});

describe('parsing', () => {
  it('reads pairs for knapsack and plain weights for subset sum', () => {
    expect(parseItems('knapsack', ' 2:3, 3:4 ')).toEqual({
      items: [
        { weight: 2, value: 3 },
        { weight: 3, value: 4 },
      ],
    });
    expect(parseItems('subset', '3 4')).toEqual({
      items: [
        { weight: 3, value: 3 },
        { weight: 4, value: 4 },
      ],
    });
  });

  it('refuses bad lists', () => {
    expect(parseItems('knapsack', '2')).toEqual({ error: 'format' });
    expect(parseItems('subset', '2:3')).toEqual({ error: 'format' });
    expect(parseItems('knapsack', '')).toEqual({ error: 'count' });
    expect(parseItems('subset', '1,2,3,4,5,6,7')).toEqual({ error: 'count' });
    expect(parseItems('subset', '0')).toEqual({ error: 'range' });
    expect(parseItems('knapsack', '100:1')).toEqual({ error: 'range' });
    expect(parseItems('knapsack', '1:100')).toEqual({ error: 'range' });
  });

  it('reads the capacity in range only', () => {
    expect(parseCapacity(' 7 ')).toBe(7);
    expect(parseCapacity('0')).toBe(0);
    expect(parseCapacity('')).toBeNull();
    expect(parseCapacity('2.5')).toBeNull();
    expect(parseCapacity(String(MAX_CAPACITY + 1))).toBeNull();
  });

  it('formats back what it reads', () => {
    expect(formatItems('knapsack', SMALL.items)).toBe('1:1, 3:4, 4:5, 5:7');
    expect(formatItems('subset', KNAP_PRESETS.subset[1].items)).toBe('2, 4, 6, 8');
  });

  it('counts the bits of the capacity', () => {
    expect([0, 1, 3, 4, 7, 8, 15].map(capacityBits)).toEqual([1, 1, 2, 3, 3, 4, 4]);
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const items = SMALL.items.map((it) => ({ ...it }));
    const frames = knapTrace('knapsack', 'table', items, SMALL.capacity);
    const before = JSON.stringify(frames[3]);
    frames[2].shown[0][0] = 99;
    frames[2].table[0][0] = 99;
    frames[2].lines.push(9);
    frames[2].items[0].weight = 99;
    frames.at(-1)?.path.push([9, 9]);
    frames.at(-1)?.picked.push(9);
    expect(JSON.stringify(frames[3])).toBe(before);
    expect(items[0].weight).toBe(1);
    expect(frames.at(-2)?.picked).not.toContain(9);
  });

  it('start and end with the named kinds', () => {
    for (const layout of /** @type {const} */ (['table', 'row-down', 'row-up'])) {
      const frames = knapTrace('knapsack', layout, SMALL.items, SMALL.capacity);
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
    }
  });

  it('stay under 400 frames at the cap', () => {
    const items = Array.from({ length: MAX_ITEMS }, () => ({ weight: 1, value: 1 }));
    for (const layout of /** @type {const} */ (['table', 'row-down', 'row-up']))
      expect(knapTrace('knapsack', layout, items, MAX_CAPACITY).length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  const cases = /** @type {const} */ ([
    ['knapsack', 'table', SMALL],
    ['knapsack', 'row-down', SMALL],
    ['knapsack', 'row-up', SMALL],
    ['subset', 'table', KNAP_PRESETS.subset[0]],
    ['subset', 'row-down', KNAP_PRESETS.subset[0]],
    ['subset', 'row-up', KNAP_PRESETS.subset[0]],
  ]);
  it.each(cases)('%s %s highlights every line', (p, layout, preset) => {
    const used = new Set(
      knapTrace(p, layout, preset.items, preset.capacity).flatMap((f) => f.lines),
    );
    knapPseudocode[p][layout].forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
