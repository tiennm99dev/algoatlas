import { describe, expect, it } from 'vitest';
import {
  DIGIT_PRESETS,
  MAX_LIMIT,
  MAX_TARGET,
  digitPseudocode,
  digitSum,
  digitTrace,
} from './digit-dp.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Counts by checking every number. @param {number} limit @param {number} target */
function brute(limit, target) {
  let count = 0;
  for (let x = 0; x <= limit; x++) if (digitSum(x) === target) count++;
  return count;
}

describe('digit DP', () => {
  it('counts the presets', () => {
    expect(DIGIT_PRESETS.map((p) => digitTrace(p.limit, p.target).at(-1)?.result)).toEqual([
      brute(345, 10),
      brute(1000, 5),
      brute(52817, 14),
    ]);
    expect(digitTrace(345, 10).at(-1)?.result).toBe(33);
  });

  it('matches checking every number', () => {
    const rand = seeded(51);
    const cases = [
      [0, 0],
      [0, 3],
      [9, 9],
      [10, 1],
      [99, 18],
      [100, 1],
      [MAX_LIMIT, 27],
    ];
    for (let t = 0; t < 60; t++)
      cases.push([Math.floor(rand() * 60000), Math.floor(rand() * (MAX_TARGET + 1))]);
    for (const [limit, target] of cases) {
      if (target > MAX_TARGET) continue;
      expect(digitTrace(limit, target).at(-1)?.result, `${limit}, ${target}`).toBe(
        brute(limit, target),
      );
    }
  });

  it('keeps one tight prefix that follows the digits of N', () => {
    const last = digitTrace(345, 10).at(-1);
    expect(last?.tight).toEqual([0, 3, 7, null]);
    expect(digitTrace(1234, 10).at(-1)?.tight).toEqual([0, 1, 3, 6, 10]);
    expect(digitTrace(1234, 10).at(-1)?.result).toBe(brute(1234, 10));
  });

  it('fills the loose counts row by row', () => {
    const last = digitTrace(345, 10).at(-1);
    expect(last?.table[1]).toEqual([1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
    // After two digits: loose 00..29 with sum ≤ 10 (29 has 11, dropped), plus 30..33 from the
    // tight 3 followed by a digit below 4.
    expect(last?.table[2].reduce((a, b) => (a ?? 0) + (b ?? 0), 0)).toBe(29 + 4);
  });

  it('counts transitions: ten per loose state and D + 1 for the tight one', () => {
    const frames = digitTrace(345, 10);
    const spreads = frames.filter((f) => f.kind === 'spread').length;
    expect(frames.at(-1)?.transitions).toBe(10 * spreads + (3 + 1) + (4 + 1) + (5 + 1));
  });

  it('handles N = 0 and S = 0', () => {
    expect(digitTrace(0, 0).at(-1)?.result).toBe(1);
    expect(digitTrace(0, 5).at(-1)?.result).toBe(0);
    expect(digitTrace(500, 0).at(-1)?.result).toBe(1);
  });
});

describe('frames', () => {
  it('do not alias each other', () => {
    const frames = digitTrace(345, 10);
    const before = JSON.stringify(frames[4]);
    frames[3].table[1][0] = 99;
    frames[3].tight[0] = 99;
    frames[3].digits[0] = 9;
    frames[3].lines.push(9);
    expect(JSON.stringify(frames[4])).toBe(before);
  });

  it('start and end with the named kinds and stay under 400 at the cap', () => {
    const frames = digitTrace(MAX_LIMIT, MAX_TARGET);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const used = new Set(digitTrace(345, 10).flatMap((f) => f.lines));
    digitPseudocode.forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
