import { describe, expect, it } from 'vitest';
import {
  MAX_N,
  NIL,
  floydPseudocode,
  floydTrace,
  inputNext,
  parseValues,
  randomValues,
  reversePseudocode,
  reverseTrace,
  walkValues,
} from './linked-list-techniques.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./linked-list-techniques.js').TechFrame} TechFrame */

/**
 * Oracle: the first node seen twice when walking from the head (a hash set), or NIL.
 * @param {number} n @param {number} cycleTo
 */
function firstRepeat(n, cycleTo) {
  const next = inputNext(n, cycleTo);
  const seen = new Set();
  let s = n ? 0 : NIL;
  while (s !== NIL) {
    if (seen.has(s)) return s;
    seen.add(s);
    s = next[s];
  }
  return NIL;
}

describe('reversal trace', () => {
  it('reverses lists of every length up to the cap', () => {
    const rand = seeded(2);
    for (let n = 0; n <= MAX_N; n++) {
      const values = randomValues(n, rand);
      const last = /** @type {TechFrame} */ (reverseTrace(values).at(-1));
      expect(walkValues(last)).toEqual(values.slice().reverse());
      expect(last.kind).toBe('done');
    }
  });

  it('flips exactly one arrow per node and leaves the old head pointing at null', () => {
    const frames = reverseTrace([1, 2, 3, 4]);
    const last = /** @type {TechFrame} */ (frames.at(-1));
    expect(last.moves).toBe(4);
    expect(last.steps).toBe(4);
    expect(last.next).toEqual([NIL, 0, 1, 2]);
    expect(last.head).toBe(3);
    expect(frames.filter((f) => f.kind === 'flip')).toHaveLength(4);
  });

  it('handles the empty list and a single node', () => {
    expect(reverseTrace([]).map((f) => f.kind)).toEqual(['start', 'done']);
    const one = /** @type {TechFrame} */ (reverseTrace([7]).at(-1));
    expect(walkValues(one)).toEqual([7]);
  });

  it('keeps duplicates in reversed order', () => {
    const last = /** @type {TechFrame} */ (reverseTrace([5, 5, 2, 5]).at(-1));
    expect(walkValues(last)).toEqual([5, 2, 5, 5]);
  });

  it('never aliases next arrays between frames', () => {
    const frames = reverseTrace([1, 2, 3]);
    frames[1].next[0] = 42;
    expect(frames[2].next[0]).not.toBe(42);
  });
});

describe('Floyd cycle detection trace', () => {
  it('finds the cycle start for every list shape up to the cap', () => {
    for (let n = 0; n <= MAX_N; n++) {
      for (let c = -1; c < n; c++) {
        const frames = floydTrace(randomValues(n, seeded(n + c + 3)), c);
        const last = /** @type {TechFrame} */ (frames.at(-1));
        expect(last.entry).toBe(firstRepeat(n, c));
        expect(frames.some((f) => f.kind === 'no-cycle')).toBe(c === NIL);
      }
    }
  });

  it('meets within one lap: phase-1 steps never exceed the list length', () => {
    for (let n = 1; n <= MAX_N; n++) {
      for (let c = 0; c < n; c++) {
        const frames = floydTrace(randomValues(n, seeded(9)), c);
        const meet = /** @type {TechFrame} */ (frames.find((f) => f.kind === 'meet'));
        expect(meet.steps).toBeLessThanOrEqual(n);
        // The hare has walked twice as far as the tortoise when they meet.
        expect(meet.moves).toBe(3 * meet.steps);
      }
    }
  });

  it('takes μ phase-2 steps, the length of the tail before the cycle', () => {
    const frames = floydTrace([3, 1, 4, 1, 5, 9, 2], 2);
    const meet = /** @type {TechFrame} */ (frames.find((f) => f.kind === 'meet'));
    const last = /** @type {TechFrame} */ (frames.at(-1));
    expect(last.entry).toBe(2);
    expect(last.steps - meet.steps).toBe(2);
  });

  it('stops after ⌊n / 2⌋ steps on a list without a cycle', () => {
    for (const n of [1, 2, 5, 6]) {
      const frames = floydTrace(randomValues(n, seeded(4)), NIL);
      expect(frames.at(-1)?.steps).toBe(Math.floor(n / 2));
    }
  });

  it('handles a self-loop on the last node and a cycle through the head', () => {
    expect(floydTrace([1, 2, 3], 2).at(-1)?.entry).toBe(2);
    const full = floydTrace([1, 2, 3], 0);
    expect(full.at(-1)?.entry).toBe(0);
    expect(full.some((f) => f.kind === 'move2')).toBe(false);
  });
});

describe('input parsing', () => {
  it('reads commas or spaces and refuses bad lists', () => {
    expect(parseValues('3, 1 4,1')).toEqual({ values: [3, 1, 4, 1] });
    expect(parseValues('  ')).toEqual({ error: 'empty' });
    expect(parseValues('1 2 3 4 5 6 7 8 9 10 11')).toEqual({ error: 'count' });
    expect(parseValues('1, x')).toEqual({ error: 'format' });
    expect(parseValues('1, -2')).toEqual({ error: 'format' });
    expect(parseValues('1, 100')).toEqual({ error: 'range' });
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['reverse', () => reverseTrace([1, 2, 3]), reversePseudocode],
    ['floyd', () => [...floydTrace([1, 2, 3, 4], 1), ...floydTrace([1, 2], NIL)], floydPseudocode],
  ])('%s trace highlights every pseudocode line', (_, run, code) => {
    const seen = new Set(run().flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(code.map((_, i) => i));
  });
});
