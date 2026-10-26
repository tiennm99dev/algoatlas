import { describe, expect, it } from 'vitest';
import {
  DOMAIN,
  EPSILONS,
  SHAPES,
  isUnimodal,
  makeFunction,
  roundsNeeded,
  ternaryPseudocode,
  ternaryTrace,
} from './ternary-search.js';

/** Seeded LCG so random peaks are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * Brute-force maximiser on a fine grid: the oracle.
 * @param {(x: number) => number} f @param {number} [a] @param {number} [b] @param {number} [steps]
 */
function gridArgmax(f, a = DOMAIN[0], b = DOMAIN[1], steps = 60000) {
  let best = a;
  for (let i = 0; i <= steps; i++) {
    const x = a + ((b - a) * i) / steps;
    if (f(x) > f(best)) best = x;
  }
  return best;
}

/** @param {(x: number) => number} f @param {number} eps */
const run = (f, eps) =>
  /** @type {import('./ternary-search.js').TernaryFrame} */ (
    ternaryTrace(f, DOMAIN[0], DOMAIN[1], eps).at(-1)
  );

describe('ternaryTrace', () => {
  it('lands within ε of the peak of every unimodal shape', () => {
    const rand = seeded(9);
    for (const shape of SHAPES.filter(isUnimodal)) {
      for (let t = 0; t < 25; t++) {
        const p = 0.5 + rand() * 5;
        const f = makeFunction(shape, p);
        for (const eps of EPSILONS) {
          const x = run(f, eps).answer;
          expect(Math.abs(x - gridArgmax(f))).toBeLessThanOrEqual(eps / 2 + 1e-3);
          expect(Math.abs(x - p)).toBeLessThanOrEqual(eps / 2 + 1e-9);
        }
      }
    }
  });

  it('keeps the peak inside [lo, hi] on every frame', () => {
    const f = makeFunction('tent', 4.2);
    for (const fr of ternaryTrace(f, 0, 6, 0.001)) {
      expect(fr.lo).toBeLessThanOrEqual(4.2);
      expect(fr.hi).toBeGreaterThanOrEqual(4.2);
      if (fr.kind === 'probe') expect(fr.lo < fr.m1 && fr.m1 < fr.m2 && fr.m2 < fr.hi).toBe(true);
    }
  });

  it('can miss the higher peak of a function that is not unimodal', () => {
    const f = makeFunction('two-peaks', 0);
    const x = run(f, 0.01).answer;
    expect(Math.abs(gridArgmax(f) - 0.8)).toBeLessThan(0.01);
    expect(Math.abs(x - 4)).toBeLessThan(0.05);
    expect(f(x)).toBeLessThan(f(0.8));
  });

  it('shrinks the width to two thirds per round and makes two evaluations per round', () => {
    const f = makeFunction('parabola', 2.6);
    const frames = ternaryTrace(f, 0, 6, 0.01);
    const cuts = frames.filter((fr) => fr.kind === 'cut-left' || fr.kind === 'cut-right');
    let width = 6;
    for (const c of cuts) {
      width = (width * 2) / 3;
      expect(c.hi - c.lo).toBeCloseTo(width, 9);
    }
    const last = /** @type {import('./ternary-search.js').TernaryFrame} */ (frames.at(-1));
    expect(last.iterations).toBe(cuts.length);
    expect(last.evaluations).toBe(2 * cuts.length);
  });

  it('runs the predicted number of rounds', () => {
    const f = makeFunction('bell', 3);
    for (const eps of EPSILONS) expect(run(f, eps).iterations).toBe(roundsNeeded(6, eps));
    expect([0.5, 0.1, 0.01, 0.001].map((e) => roundsNeeded(6, e))).toEqual([7, 11, 16, 22]);
  });

  it('stops at once when the interval is already narrow enough', () => {
    const frames = ternaryTrace(makeFunction('tent', 3), 2.9, 3.0, 0.5);
    expect(frames.map((fr) => fr.kind)).toEqual(['start', 'done']);
    expect(frames[1].answer).toBeCloseTo(2.95, 9);
  });

  it('starts with start, ends with one done frame carrying the answer', () => {
    const frames = ternaryTrace(makeFunction('parabola', 1), 0, 6, 0.1);
    expect(frames[0].kind).toBe('start');
    expect(frames.filter((fr) => fr.kind === 'done')).toHaveLength(1);
    expect(frames.slice(0, -1).every((fr) => Number.isNaN(fr.answer))).toBe(true);
  });

  it('keeps traces short at the smallest ε', () => {
    expect(ternaryTrace(makeFunction('parabola', 3), 0, 6, 0.001).length).toBeLessThan(400);
  });

  it('does not alias frames to each other', () => {
    const frames = ternaryTrace(makeFunction('parabola', 3), 0, 6, 0.5);
    frames[1].lines.push(99);
    expect(frames[2].lines).not.toContain(99);
    expect(new Set(frames.map((fr) => fr.lines)).size).toBe(frames.length);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [1, 5].flatMap((p) => ternaryTrace(makeFunction('tent', p), 0, 6, 0.5));
    const seen = new Set(frames.flatMap((fr) => fr.lines));
    expect([...seen].sort((p, q) => p - q)).toEqual(ternaryPseudocode.map((_, i) => i));
  });
});
