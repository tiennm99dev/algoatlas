import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  makeMonoValues,
  monoPseudocode,
  monoTrace,
  parseMonoValues,
} from './monotonic-stack-queue.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Brute force: first strictly greater value to the right, −1 when none. @param {number[]} a */
const nextGreater = (a) => a.map((v, i) => a.slice(i + 1).find((w) => w > v) ?? -1);

/** Brute force: the maximum of every window of k values. @param {number[]} a @param {number} k */
const windowMax = (a, k) =>
  Array.from({ length: a.length - k + 1 }, (_, i) => Math.max(...a.slice(i, i + k)));

/** @param {number} n @param {() => number} rand */
const randomValues = (n, rand) => Array.from({ length: n }, () => 1 + Math.floor(rand() * 9));

describe('next greater element', () => {
  it('matches brute force on random arrays, duplicates included', () => {
    const rand = seeded(21);
    for (let run = 0; run < 200; run++) {
      const a = randomValues(1 + Math.floor(rand() * MAX_N), rand);
      expect(monoTrace('next-greater', a).at(-1)?.answer, a.join(',')).toEqual(nextGreater(a));
    }
  });

  it('pushes every index once and pops each at most once', () => {
    const rand = seeded(5);
    for (let run = 0; run < 50; run++) {
      const a = randomValues(MAX_N, rand);
      const last = /** @type {import('./monotonic-stack-queue.js').MonoFrame} */ (
        monoTrace('next-greater', a).at(-1)
      );
      expect(last.pushes).toBe(a.length);
      expect(last.pops).toBeLessThanOrEqual(a.length);
      expect(last.comparisons).toBeLessThanOrEqual(2 * a.length);
    }
  });

  it('counts exact work on falling and rising input', () => {
    const falling = monoTrace('next-greater', [9, 8, 6, 5]).at(-1);
    expect(falling?.pops).toBe(0);
    expect(falling?.comparisons).toBe(3);
    expect(falling?.answer).toEqual([-1, -1, -1, -1]);
    const rising = monoTrace('next-greater', [1, 2, 3, 5]).at(-1);
    expect(rising?.pops).toBe(3);
    expect(rising?.comparisons).toBe(3);
    expect(rising?.answer).toEqual([2, 3, 5, -1]);
  });

  it('keeps stack values non-increasing from bottom to top on every frame', () => {
    const a = makeMonoValues('mixed');
    for (const f of monoTrace('next-greater', a)) {
      for (let j = 1; j < f.held.length; j++)
        expect(a[f.held[j - 1]]).toBeGreaterThanOrEqual(a[f.held[j]]);
    }
  });

  it('handles a single value', () => {
    expect(monoTrace('next-greater', [5]).at(-1)?.answer).toEqual([-1]);
  });
});

describe('sliding window maximum', () => {
  it('matches brute force for every k on random arrays', () => {
    const rand = seeded(13);
    for (let run = 0; run < 100; run++) {
      const a = randomValues(1 + Math.floor(rand() * MAX_N), rand);
      for (let k = 1; k <= a.length; k++)
        expect(monoTrace('window-max', a, k).at(-1)?.answer).toEqual(windowMax(a, k));
    }
  });

  it('keeps deque values strictly decreasing and inside the window', () => {
    const a = makeMonoValues('mixed');
    const k = 3;
    for (const f of monoTrace('window-max', a, k)) {
      for (let j = 1; j < f.held.length; j++)
        expect(a[f.held[j - 1]]).toBeGreaterThan(a[f.held[j]]);
      if (f.kind === 'emit') expect(f.held[0]).toBeGreaterThan(f.i - k);
    }
  });

  it('expires the front once it leaves the window', () => {
    const frames = monoTrace('window-max', [9, 8, 7, 6], 2);
    const expires = frames.filter((f) => f.kind === 'expire');
    expect(expires.map((f) => f.popped[0])).toEqual([0, 1]);
    expect(frames.at(-1)?.answer).toEqual([9, 8, 7]);
  });

  it('with k = 1 every window is one value', () => {
    expect(monoTrace('window-max', [3, 1, 2], 1).at(-1)?.answer).toEqual([3, 1, 2]);
  });
});

describe('frames and input', () => {
  it('never alias arrays between frames', () => {
    const frames = monoTrace('next-greater', [1, 2, 3]);
    frames[2].held.push(99);
    frames[2].answer[0] = 99;
    expect(frames[3].held).not.toContain(99);
    expect(frames[3].answer[0]).not.toBe(99);
  });

  it('stays small at the size cap', () => {
    const a = randomValues(MAX_N, seeded(2));
    expect(monoTrace('window-max', a, 3).length).toBeLessThanOrEqual(400);
    expect(monoTrace('next-greater', a).length).toBeLessThanOrEqual(400);
  });

  it('parses values and rejects bad ones', () => {
    expect(parseMonoValues('4, 2 7')).toEqual({ values: [4, 2, 7] });
    expect(parseMonoValues('4, x')).toEqual({ error: 'format' });
    expect(parseMonoValues('0 5')).toEqual({ error: 'range' });
    expect(parseMonoValues(Array(13).fill('1').join(','))).toEqual({ error: 'count' });
  });

  it('builds presets', () => {
    expect(makeMonoValues('mixed')).toEqual([4, 2, 7, 3, 1, 5, 8, 6]);
    const random = makeMonoValues('random', seeded(1));
    expect(random).toHaveLength(10);
    expect(Math.min(...random)).toBeGreaterThanOrEqual(1);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every next-greater line', () => {
    const seen = new Set(monoTrace('next-greater', [2, 5, 1]).flatMap((f) => f.lines));
    expect([...seen].sort()).toEqual(monoPseudocode['next-greater'].map((_, i) => i));
  });

  it('highlights every window-max line', () => {
    const seen = new Set(monoTrace('window-max', [5, 3, 4, 1], 2).flatMap((f) => f.lines));
    expect([...seen].sort()).toEqual(monoPseudocode['window-max'].map((_, i) => i));
  });
});
