import { describe, expect, it } from 'vitest';
import {
  answerPseudocode,
  answerTrace,
  capRange,
  feasible,
  makeWeights,
  packDays,
  parseWeights,
} from './binary-search-on-answer.js';

/** Seeded LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Smallest capacity found by trying every one upward: the oracle. @param {number[]} w @param {number} d */
function scanUp(w, d) {
  for (let c = 1; ; c++) if (feasible(w, c, d)) return c;
}

/** @param {number[]} w @param {number} d */
const last = (w, d) =>
  /** @type {import('./binary-search-on-answer.js').AnswerFrame} */ (answerTrace(w, d).at(-1));

describe('packDays and feasible', () => {
  it('packs greedily in order', () => {
    expect(packDays([3, 2, 2, 4, 1, 4], 6)).toEqual([
      [3, 2],
      [2, 4],
      [1, 4],
    ]);
    expect(packDays([3, 2, 2, 4, 1, 4], 5)).toEqual([[3, 2], [2], [4, 1], [4]]);
  });

  it('is monotone in the capacity', () => {
    const rand = seeded(11);
    for (let t = 0; t < 40; t++) {
      const w = makeWeights(1 + Math.floor(rand() * 10), rand);
      const d = 1 + Math.floor(rand() * w.length);
      const { lo, hi } = capRange(w);
      const row = [];
      for (let c = 1; c <= hi; c++) row.push(feasible(w, c, d));
      const first = row.indexOf(true);
      expect(row.slice(first).every(Boolean)).toBe(true);
      expect(first + 1).toBeGreaterThanOrEqual(lo);
    }
  });

  it('refuses a capacity below the heaviest parcel', () => {
    expect(feasible([2, 9], 8, 5)).toBe(false);
  });
});

describe('answerTrace', () => {
  it('matches the upward scan on random inputs', () => {
    const rand = seeded(3);
    for (let t = 0; t < 200; t++) {
      const w = makeWeights(1 + Math.floor(rand() * 10), rand);
      const d = 1 + Math.floor(rand() * w.length);
      expect(last(w, d).answer).toBe(scanUp(w, d));
    }
  });

  it('solves the opening example: capacity 6 for 3 days', () => {
    expect(last([3, 2, 2, 4, 1, 4], 3)).toMatchObject({ answer: 6, checks: 4, reads: 24 });
  });

  it('gives max(w) when every parcel may have its own day and sum(w) for one day', () => {
    expect(last([5, 1, 7, 2], 4).answer).toBe(7);
    expect(last([5, 1, 7, 2], 1).answer).toBe(15);
  });

  it('needs no check for a single parcel', () => {
    const frames = answerTrace([9], 1);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(frames[1]).toMatchObject({ answer: 9, checks: 0 });
  });

  it('checks at most ceil(log2(range size)) capacities', () => {
    const rand = seeded(5);
    for (let t = 0; t < 100; t++) {
      const w = makeWeights(10, rand);
      const d = 1 + Math.floor(rand() * 10);
      const { lo, hi } = capRange(w);
      expect(last(w, d).checks).toBeLessThanOrEqual(Math.ceil(Math.log2(hi - lo + 1)));
    }
  });

  it('keeps lo ≤ hi, tests mid inside the window, and the window always holds the answer', () => {
    const w = [7, 2, 5, 10, 8];
    const answer = scanUp(w, 2);
    for (const f of answerTrace(w, 2)) {
      expect(f.lo).toBeLessThanOrEqual(answer);
      expect(f.hi).toBeGreaterThanOrEqual(answer);
      if (f.kind === 'probe') expect(f.mid >= f.lo && f.mid < f.hi).toBe(true);
    }
    expect(last(w, 2).answer).toBe(18);
  });

  it('records every check with its verdict', () => {
    const f = last([3, 2, 2, 4, 1, 4], 3);
    expect(f.checked).toEqual([
      { cap: 10, ok: true },
      { cap: 7, ok: true },
      { cap: 5, ok: false },
      { cap: 6, ok: true },
    ]);
  });

  it('does not alias frames to each other', () => {
    const frames = answerTrace([3, 2, 2, 4, 1, 4], 3);
    const check = frames.findIndex((f) => f.kind === 'check');
    frames[check].checked.push({ cap: 99, ok: true });
    frames[check].days[0].push(99);
    expect(frames[check + 1].checked.some((c) => c.cap === 99)).toBe(false);
    expect(frames.at(-1)?.days[0]).not.toContain(99);
  });
});

describe('parseWeights', () => {
  it('reads valid weights and rejects the rest', () => {
    expect(parseWeights('3, 2 2,4')).toEqual({ values: [3, 2, 2, 4] });
    expect(parseWeights('3, a')).toEqual({ error: 'format' });
    expect(parseWeights('0, 3')).toEqual({ error: 'range' });
    expect(parseWeights('16')).toEqual({ error: 'range' });
    expect(parseWeights('')).toEqual({ error: 'count' });
    expect(parseWeights(Array(11).fill('1').join(' '))).toEqual({ error: 'count' });
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = answerTrace([3, 2, 2, 4, 1, 4], 3);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((p, q) => p - q)).toEqual(answerPseudocode.map((_, i) => i));
  });
});
