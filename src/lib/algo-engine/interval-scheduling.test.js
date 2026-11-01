import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  MAX_T,
  RULES,
  clash,
  deepest,
  formatIntervals,
  intervalPseudocode,
  intervalTrace,
  parseIntervals,
} from './interval-scheduling.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./interval-scheduling.js').Interval} Interval */

/** @param {number} n @param {() => number} rand @returns {Interval[]} */
function randomIntervals(n, rand) {
  return Array.from({ length: n }, () => {
    const start = Math.floor(rand() * 20);
    return { start, end: start + 1 + Math.floor(rand() * 6) };
  });
}

/** Largest compatible subset by trying every subset. @param {Interval[]} a */
function bruteMax(a) {
  let best = 0;
  for (let mask = 0; mask < 1 << a.length; mask++) {
    const pick = a.filter((_, i) => mask & (1 << i));
    const ok = pick.every((x, i) => pick.every((y, j) => i === j || !clash(x, y)));
    if (ok) best = Math.max(best, pick.length);
  }
  return best;
}

/** Depth by sweeping every half-unit moment. @param {Interval[]} a */
function sweepDepth(a) {
  let best = 0;
  for (let t = 0; t < MAX_T; t += 0.5) {
    best = Math.max(best, a.filter((iv) => iv.start <= t && t < iv.end).length);
  }
  return best;
}

const CLASSIC = [
  [1, 4],
  [3, 5],
  [0, 6],
  [5, 7],
  [3, 9],
  [5, 9],
  [6, 10],
  [8, 11],
  [8, 12],
  [2, 14],
  [12, 16],
].map(([start, end]) => ({ start, end }));

describe('activity selection', () => {
  it('earliest finish keeps a maximum compatible set', () => {
    const rand = seeded(4);
    for (let t = 0; t < 60; t++) {
      const input = randomIntervals(1 + (t % 10), rand);
      const done = intervalTrace(input, 'finish').at(-1);
      const kept = (done?.chosen ?? []).map((i) => input[i]);
      expect(kept.every((x, i) => kept.every((y, j) => i === j || !clash(x, y)))).toBe(true);
      expect(kept.length).toBe(bruteMax(input));
      expect((done?.chosen.length ?? 0) + (done?.rejected.length ?? 0)).toBe(input.length);
    }
  });

  it('the other rules stay compatible but can keep fewer', () => {
    const rand = seeded(9);
    for (const rule of /** @type {const} */ (['start', 'shortest'])) {
      for (let t = 0; t < 30; t++) {
        const input = randomIntervals(2 + (t % 8), rand);
        const kept = (intervalTrace(input, rule).at(-1)?.chosen ?? []).map((i) => input[i]);
        expect(kept.every((x, i) => kept.every((y, j) => i === j || !clash(x, y)))).toBe(true);
        expect(kept.length).toBeLessThanOrEqual(bruteMax(input));
      }
    }
    const shortTrap = [
      { start: 0, end: 5 },
      { start: 4, end: 7 },
      { start: 6, end: 11 },
    ];
    expect(intervalTrace(shortTrap, 'shortest').at(-1)?.chosen).toEqual([1]);
    expect(intervalTrace(shortTrap, 'finish').at(-1)?.chosen).toEqual([0, 2]);
    const startTrap = [
      { start: 0, end: 10 },
      { start: 1, end: 3 },
      { start: 4, end: 6 },
      { start: 7, end: 9 },
    ];
    expect(intervalTrace(startTrap, 'start').at(-1)?.chosen).toEqual([0]);
    expect(intervalTrace(startTrap, 'finish').at(-1)?.chosen).toEqual([1, 2, 3]);
  });

  it('keeps 4 of the classic 11 activities, with one check per activity', () => {
    const done = intervalTrace(CLASSIC, 'finish').at(-1);
    expect(done?.chosen.map((i) => CLASSIC[i])).toEqual([
      { start: 1, end: 4 },
      { start: 5, end: 7 },
      { start: 8, end: 11 },
      { start: 12, end: 16 },
    ]);
    expect(done?.checks).toBe(11);
    expect(done?.lastFinish).toBe(16);
  });

  it('lets touching intervals both stay', () => {
    const done = intervalTrace(
      [
        { start: 1, end: 4 },
        { start: 4, end: 6 },
      ],
      'finish',
    ).at(-1);
    expect(done?.chosen).toEqual([0, 1]);
  });

  it('names the kept interval a rejected one clashes with', () => {
    const frames = intervalTrace(CLASSIC, 'shortest');
    for (const f of frames.filter((x) => x.kind === 'reject')) {
      expect(f.chosen).toContain(f.conflict);
      expect(clash(f.intervals[f.current], f.intervals[f.conflict])).toBe(true);
    }
  });
});

describe('interval partitioning', () => {
  it('opens exactly as many rooms as the depth, with no clash inside a room', () => {
    const rand = seeded(21);
    for (let t = 0; t < 60; t++) {
      const input = randomIntervals(1 + (t % MAX_N), rand);
      const done = intervalTrace(input, 'rooms').at(-1);
      if (!done) throw new Error('empty trace');
      expect(done.roomEnds.length).toBe(sweepDepth(input));
      expect(deepest(input).depth).toBe(sweepDepth(input));
      for (let i = 0; i < input.length; i++) {
        for (let j = i + 1; j < input.length; j++) {
          if (done.room[i] === done.room[j]) expect(clash(input[i], input[j])).toBe(false);
        }
      }
    }
  });

  it('needs 6 rooms for the classic activities', () => {
    const done = intervalTrace(CLASSIC, 'rooms').at(-1);
    expect(done?.roomEnds.length).toBe(6);
    expect(deepest(CLASSIC)).toEqual({ depth: 6, at: 8 });
    expect(done?.room.every((r) => r >= 0)).toBe(true);
  });

  it('reuses the room that frees earliest', () => {
    const frames = intervalTrace(
      [
        { start: 0, end: 5 },
        { start: 1, end: 3 },
        { start: 4, end: 6 },
      ],
      'rooms',
    );
    const reuse = frames.find((f) => f.kind === 'reuse');
    expect(reuse?.freed).toBe(1);
    expect(frames.at(-1)?.room).toEqual([0, 1, 1]);
    expect(frames.at(-1)?.checks).toBe(2);
  });
});

describe('interval frames', () => {
  it.each(RULES)('%s starts at start, ends at done and keeps frames independent', (rule) => {
    const input = CLASSIC.map((iv) => ({ ...iv }));
    const frames = intervalTrace(input, rule);
    expect(frames[0].kind).toBe('start');
    expect(frames[0].order).toEqual(input.map((_, i) => i));
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.length).toBeLessThan(400);
    input[0].start = 9;
    expect(frames[0].intervals[0].start).toBe(1);
    const k = frames.findIndex((f) => f.kind === 'consider');
    frames[k].intervals[0].end = 99;
    frames[k].order[0] = 99;
    frames[k].room[0] = 99;
    expect(frames[k + 1].intervals[0].end).toBe(4);
    expect(frames[k + 1].order[0]).not.toBe(99);
    expect(frames[k + 1].room[0]).not.toBe(99);
  });
});

describe('parsing intervals', () => {
  it('reads start-end pairs and refuses bad input', () => {
    expect(parseIntervals('1-4, 3–5  0-6')).toEqual({
      intervals: [
        { start: 1, end: 4 },
        { start: 3, end: 5 },
        { start: 0, end: 6 },
      ],
    });
    expect(parseIntervals('1-4, x')).toEqual({ error: 'format' });
    expect(parseIntervals('3-25')).toEqual({ error: 'range' });
    expect(parseIntervals('5-5')).toEqual({ error: 'order' });
    expect(parseIntervals(Array(13).fill('1-2').join(','))).toEqual({ error: 'count' });
    expect(formatIntervals(CLASSIC.slice(0, 2))).toBe('1-4, 3-5');
  });
});

describe('pseudocode coverage', () => {
  it.each(RULES)('%s highlights every line', (rule) => {
    const seen = new Set(intervalTrace(CLASSIC, rule).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(intervalPseudocode(rule).map((_, i) => i));
  });
});
