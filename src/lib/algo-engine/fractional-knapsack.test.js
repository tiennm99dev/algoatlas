import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  bestJobProfit,
  densityOrder,
  formatItems,
  formatJobs,
  jobsPseudocode,
  jobsTrace,
  knapsackPseudocode,
  knapsackTrace,
  parseItems,
  parseJobs,
  zeroOne,
} from './fractional-knapsack.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./fractional-knapsack.js').Item} Item */
/** @typedef {import('./fractional-knapsack.js').Job} Job */

/**
 * The fractional optimum by linear-programming duality: min over λ ≥ 0 of
 * λ·W + Σ max(0, vᵢ − λ·wᵢ). The function is convex and piecewise linear, so its minimum sits
 * at λ = 0 or at some ratio vᵢ / wᵢ.
 * @param {Item[]} items @param {number} W
 */
function dualBound(items, W) {
  const lambdas = [0, ...items.map((it) => it.value / it.weight)];
  return Math.min(
    ...lambdas.map(
      (l) => l * W + items.reduce((s, it) => s + Math.max(0, it.value - l * it.weight), 0),
    ),
  );
}

/** Best 0/1 value by trying every subset. @param {Item[]} items @param {number} W */
function brute01(items, W) {
  let best = 0;
  for (let mask = 0; mask < 1 << items.length; mask++) {
    const pick = items.filter((_, i) => mask & (1 << i));
    if (pick.reduce((s, it) => s + it.weight, 0) <= W) {
      best = Math.max(
        best,
        pick.reduce((s, it) => s + it.value, 0),
      );
    }
  }
  return best;
}

/** @param {number} n @param {() => number} rand @returns {Item[]} */
const randomItems = (n, rand) =>
  Array.from({ length: n }, () => ({
    value: 1 + Math.floor(rand() * 120),
    weight: 1 + Math.floor(rand() * 30),
  }));

/** @param {number} n @param {() => number} rand @returns {Job[]} */
const randomJobs = (n, rand) =>
  Array.from({ length: n }, () => ({
    profit: 1 + Math.floor(rand() * 100),
    deadline: 1 + Math.floor(rand() * 5),
  }));

const CLRS = [
  { value: 60, weight: 10 },
  { value: 100, weight: 20 },
  { value: 120, weight: 30 },
];

const JOBS = [
  { profit: 100, deadline: 2 },
  { profit: 19, deadline: 1 },
  { profit: 27, deadline: 2 },
  { profit: 25, deadline: 1 },
  { profit: 15, deadline: 3 },
];

describe('fractional knapsack', () => {
  it('packs 240 from the textbook items with capacity 50, two thirds of the last', () => {
    const done = knapsackTrace(CLRS, 50).at(-1);
    expect(done?.total).toBe(240);
    expect(done?.taken).toEqual([10, 20, 20]);
    expect(done?.packed).toEqual([0, 1, 2]);
    expect(done?.room).toBe(0);
  });

  it('reaches the linear-programming optimum on random inputs', () => {
    const rand = seeded(5);
    for (let t = 0; t < 60; t++) {
      const items = randomItems(1 + (t % MAX_N), rand);
      const W = 1 + Math.floor(rand() * 120);
      const done = knapsackTrace(items, W).at(-1);
      if (!done) throw new Error('empty trace');
      expect(done.total).toBeCloseTo(dualBound(items, W), 9);
      const used = done.taken.reduce((s, x) => s + x, 0);
      expect(used).toBe(
        Math.min(
          W,
          items.reduce((s, it) => s + it.weight, 0),
        ),
      );
      // At most one item is cut.
      expect(done.taken.filter((x, i) => x > 0 && x < items[i].weight).length).toBeLessThanOrEqual(
        1,
      );
    }
  });

  it('stops at the first item once the knapsack is full', () => {
    const frames = knapsackTrace(CLRS, 25);
    expect(frames.some((f) => f.kind === 'full')).toBe(true);
    expect(frames.at(-1)?.scanned).toBe(3);
    expect(frames.at(-1)?.total).toBe(60 + 100 * (15 / 20));
  });

  it('takes everything when it all fits', () => {
    const done = knapsackTrace(CLRS, 200).at(-1);
    expect(done?.total).toBe(280);
    expect(done?.room).toBe(140);
  });

  it('sorts by value per weight exactly and stably', () => {
    expect(densityOrder(CLRS)).toEqual([0, 1, 2]);
    expect(
      densityOrder([
        { value: 1, weight: 3 },
        { value: 2, weight: 6 },
        { value: 1, weight: 1 },
      ]),
    ).toEqual([2, 0, 1]);
  });

  it('shows the 0/1 greedy losing and checks the 0/1 table against brute force', () => {
    expect(zeroOne(CLRS, 50)).toEqual({ greedy: 160, best: 220 });
    const rand = seeded(17);
    for (let t = 0; t < 40; t++) {
      const items = randomItems(1 + (t % 8), rand);
      const W = 1 + Math.floor(rand() * 80);
      const r = zeroOne(items, W);
      expect(r.best).toBe(brute01(items, W));
      expect(r.greedy).toBeLessThanOrEqual(r.best);
      expect(r.best).toBeLessThanOrEqual(dualBound(items, W) + 1e-9);
    }
  });

  it('starts at start, ends at done and keeps frames independent', () => {
    const items = CLRS.map((it) => ({ ...it }));
    const frames = knapsackTrace(items, 50);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    items[0].value = 1;
    expect(frames[0].items[0].value).toBe(60);
    const k = frames.findIndex((f) => f.kind === 'take');
    frames[k].taken[0] = 99;
    frames[k].packed.push(9);
    frames[k].items[1].weight = 1;
    expect(frames[k + 1].taken[0]).toBe(10);
    expect(frames[k + 1].packed).toEqual([0]);
    expect(frames[k + 1].items[1].weight).toBe(20);
  });
});

describe('job sequencing with deadlines', () => {
  it('earns 142 on the classic five jobs', () => {
    const done = jobsTrace(JOBS).at(-1);
    expect(done?.slots).toEqual([2, 0, 4]);
    expect(done?.profit).toBe(142);
    expect(done?.skipped).toEqual([3, 1]);
  });

  it('matches the best feasible subset on random inputs', () => {
    const rand = seeded(8);
    for (let t = 0; t < 60; t++) {
      const jobs = randomJobs(1 + (t % 9), rand);
      const done = jobsTrace(jobs).at(-1);
      if (!done) throw new Error('empty trace');
      expect(done.profit).toBe(bestJobProfit(jobs));
      done.slots.forEach((j, t0) => {
        if (j >= 0) expect(jobs[j].deadline).toBeGreaterThanOrEqual(t0 + 1);
      });
    }
  });

  it('probes slots from the deadline down and counts each probe', () => {
    const frames = jobsTrace(JOBS);
    const considers = frames.filter((f) => f.kind === 'consider');
    expect(considers.map((f) => f.probed)).toEqual([[2], [2, 1], [1], [1], [3]]);
    expect(frames.at(-1)?.probes).toBe(6);
    const crowded = jobsTrace([
      { profit: 9, deadline: 3 },
      { profit: 8, deadline: 3 },
      { profit: 7, deadline: 3 },
    ]);
    expect(crowded.filter((f) => f.kind === 'consider').map((f) => f.probed)).toEqual([
      [3],
      [3, 2],
      [3, 2, 1],
    ]);
  });

  it('starts at start, ends at done, stays small and keeps frames independent', () => {
    const frames = jobsTrace(JOBS);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    expect(jobsTrace(randomJobs(MAX_N, seeded(3))).length).toBeLessThan(400);
    const k = frames.findIndex((f) => f.kind === 'place');
    frames[k].slots[1] = 7;
    frames[k].jobs[0].profit = 1;
    expect(frames[k + 1].slots[1]).toBe(0);
    expect(frames[k + 1].jobs[0].profit).toBe(100);
  });
});

describe('parsing', () => {
  it('reads value/weight and profit/deadline pairs and refuses bad ones', () => {
    expect(parseItems('60/10, 100/20 120/30')).toEqual({ items: CLRS });
    expect(parseItems('60-10')).toEqual({ error: 'format' });
    expect(parseItems('0/10')).toEqual({ error: 'value' });
    expect(parseItems('5/100')).toEqual({ error: 'weight' });
    expect(parseItems(Array(11).fill('1/1').join(' '))).toEqual({ error: 'count' });
    expect(parseJobs('100/2 19/1')).toEqual({ jobs: JOBS.slice(0, 2) });
    expect(parseJobs('5/0')).toEqual({ error: 'deadline' });
    expect(parseJobs('5/11')).toEqual({ error: 'deadline' });
    expect(formatItems(CLRS)).toBe('60/10, 100/20, 120/30');
    expect(formatJobs(JOBS.slice(0, 2))).toBe('100/2, 19/1');
  });
});

describe('pseudocode coverage', () => {
  it('highlights every knapsack line', () => {
    const frames = [knapsackTrace(CLRS, 50), knapsackTrace(CLRS, 25)].flat();
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(knapsackPseudocode.map((_, i) => i));
  });

  it('highlights every job line', () => {
    const seen = new Set(jobsTrace(JOBS).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(jobsPseudocode.map((_, i) => i));
  });
});
