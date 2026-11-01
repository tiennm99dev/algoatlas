import { describe, expect, it } from 'vitest';
import {
  MAX_ABS,
  MAX_N,
  SRTBOT_PRESETS,
  parseSrtbotValues,
  srtbotPseudocode,
  srtbotTrace,
} from './srtbot-framework.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Best bowling score by brute force: try every set of non-overlapping neighbour pairs, then
 * hit every other pin worth more than zero.
 * @param {number[]} v
 */
function bowlingBrute(v) {
  const n = v.length;
  let best = 0;
  for (let mask = 0; mask < 1 << Math.max(0, n - 1); mask++) {
    if (mask & (mask << 1)) continue;
    let score = 0;
    const used = Array(n).fill(false);
    for (let i = 0; i + 1 < n; i++)
      if (mask & (1 << i)) {
        score += v[i] * v[i + 1];
        used[i] = used[i + 1] = true;
      }
    for (let i = 0; i < n; i++) if (!used[i] && v[i] > 0) score += v[i];
    best = Math.max(best, score);
  }
  return best;
}

/** @param {number[]} a */
function maxSubBrute(a) {
  let best = -Infinity;
  for (let i = 0; i < a.length; i++) {
    let sum = 0;
    for (let j = i; j < a.length; j++) best = Math.max(best, (sum += a[j]));
  }
  return best;
}

/** @param {() => number} rand @param {number} n */
const randomValues = (rand, n) =>
  Array.from({ length: n }, () => Math.floor(rand() * (2 * MAX_ABS + 1)) - MAX_ABS);

describe('bowling', () => {
  it('scores the MIT row at 104', () => {
    const last = srtbotTrace('bowling', SRTBOT_PRESETS.bowling).at(-1);
    expect(last?.answer).toBe(104);
    expect(last?.table).toEqual([104, 104, 103, 102, 101, 44, 20, 17, 2, 2, 0]);
  });

  it('matches brute force on edge and random rows', () => {
    const rand = seeded(5);
    const cases = [[5], [-5], [-3, -4], [0, 0, 0], [9, 9, 9, 9], [-1, 2, -3, 4, -5]];
    for (let t = 0; t < 40; t++) cases.push(randomValues(rand, 1 + (t % MAX_N)));
    for (const v of cases) expect(srtbotTrace('bowling', v).at(-1)?.answer).toBe(bowlingBrute(v));
  });

  it('fills from B[n] down to B[0] and compares two or three options', () => {
    const frames = srtbotTrace('bowling', [2, -3, 4]);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'subproblems',
      'relation',
      'order',
      'base',
      'compute',
      'compute',
      'compute',
      'original',
      'done',
    ]);
    const computes = frames.filter((f) => f.kind === 'compute');
    expect(computes.map((f) => f.cell)).toEqual([2, 1, 0]);
    expect(computes.map((f) => f.options.length)).toEqual([2, 3, 3]);
    // B(1) = max(B(2), −3 + B(2), −3·4 + B(3)) = max(4, 1, −12) = 4, by skipping.
    expect(computes[1].options.map((o) => o.value)).toEqual([4, 1, -12]);
    expect(computes[1].chosen).toBe(0);
    expect(frames.at(-1)?.work).toBe(8);
    expect(frames.at(-1)?.filled).toBe(4);
  });
});

describe('maximum subarray', () => {
  it('finds 6 on the classic array, ending at index 6', () => {
    const last = srtbotTrace('maxsub', SRTBOT_PRESETS.maxsub).at(-1);
    expect(last?.answer).toBe(6);
    expect(last?.answerCells).toEqual([6]);
    expect(last?.table).toEqual([-2, 1, -2, 4, 3, 5, 6, 1, 5]);
  });

  it('matches brute force on edge and random arrays', () => {
    const rand = seeded(9);
    const cases = [[7], [-7], [-3, -1, -2], [1, 2, 3], [5, -9, 5]];
    for (let t = 0; t < 40; t++) cases.push(randomValues(rand, 1 + (t % MAX_N)));
    for (const a of cases) expect(srtbotTrace('maxsub', a).at(-1)?.answer).toBe(maxSubBrute(a));
  });

  it('does two comparisons per subproblem after the base case', () => {
    const last = srtbotTrace('maxsub', [1, -2, 3, 4]).at(-1);
    expect(last?.work).toBe(6);
    expect(last?.filled).toBe(4);
    expect(last?.order).toEqual([0, 1, 2, 3]);
  });
});

describe('parseSrtbotValues', () => {
  it('reads commas, spaces and minus signs', () => {
    expect(parseSrtbotValues('3, −1  2,-4')).toEqual({ values: [3, -1, 2, -4] });
  });

  it('refuses bad input', () => {
    expect(parseSrtbotValues('1, x')).toEqual({ error: 'format' });
    expect(parseSrtbotValues('1.5')).toEqual({ error: 'format' });
    expect(parseSrtbotValues('')).toEqual({ error: 'count' });
    expect(parseSrtbotValues('1 '.repeat(MAX_N + 1))).toEqual({ error: 'count' });
    expect(parseSrtbotValues('10')).toEqual({ error: 'range' });
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const input = [1, 2, 3];
    const frames = srtbotTrace('bowling', input);
    const before = JSON.stringify(frames[6]);
    frames[5].table[0] = 99;
    frames[5].values[0] = 99;
    frames[5].options[0].uses.push(9);
    frames[5].lines.push(9);
    input[0] = 50;
    expect(JSON.stringify(frames[6])).toBe(before);
    expect(frames[0].values[0]).toBe(1);
  });

  it('stay short at the cap', () => {
    expect(srtbotTrace('bowling', Array(MAX_N).fill(1)).length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['bowling', 'maxsub']))('%s highlights every line', (p) => {
    const used = new Set(srtbotTrace(p, SRTBOT_PRESETS[p]).flatMap((f) => f.lines));
    srtbotPseudocode[p].forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
