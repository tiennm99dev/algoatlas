import { describe, expect, it } from 'vitest';
import { MAX_N, SPACE_ALGOS, peakWords, spacePseudocode, spaceTrace } from './space-complexity.js';

/** @typedef {import('./space-complexity.js').SpaceAlgo} SpaceAlgo */
/** @typedef {import('./space-complexity.js').SpaceFrame} SpaceFrame */

/** @param {SpaceAlgo} algo @param {number} n */
const last = (algo, n) => /** @type {SpaceFrame} */ (spaceTrace(algo, n).at(-1));

/** Independent oracle for the recursion depth of bits(n). @param {number} n */
function bitsDepth(n) {
  let d = 1;
  while (n >= 2) {
    n = Math.floor(n / 2);
    d++;
  }
  return d;
}

const sizes = Array.from({ length: MAX_N }, (_, k) => k + 1);

describe('results', () => {
  it.each(sizes)('computes the right answers for n = %i', (n) => {
    expect(last('sum-rec', n).value).toBe((n * (n + 1)) / 2);
    expect(last('sum-loop', n).value).toBe((n * (n + 1)) / 2);
    expect(last('bits-rec', n).value).toBe(n.toString(2).length);
    const reversed = Array.from({ length: n }, (_, k) => n - k);
    expect(last('reverse-copy', n).copy).toEqual(reversed);
    expect(last('reverse-in-place', n).input).toEqual(reversed);
    expect(last('reverse-copy', n).input).toEqual(reversed.slice().reverse());
  });
});

describe('memory', () => {
  it.each(SPACE_ALGOS.flatMap((a) => sizes.map((n) => [a, n])))(
    '%s with n = %i peaks at the closed form',
    (algo, n) => {
      const a = /** @type {SpaceAlgo} */ (algo);
      const frames = spaceTrace(a, Number(n));
      expect(Math.max(...frames.map((f) => f.words))).toBe(peakWords(a, Number(n)));
      expect(frames.at(-1)?.peak).toBe(peakWords(a, Number(n)));
    },
  );

  it('stacks n + 1 frames for sum(n) and ⌊log₂ n⌋ + 1 for bits(n)', () => {
    for (const n of sizes) {
      expect(last('sum-rec', n).maxDepth).toBe(n + 1);
      expect(last('bits-rec', n).maxDepth).toBe(bitsDepth(n));
      expect(last('sum-loop', n).maxDepth).toBe(1);
    }
  });

  it('empties the stack at the end and keeps the copy on the heap', () => {
    for (const a of SPACE_ALGOS) expect(last(a, 6).stack).toEqual([]);
    expect(last('reverse-copy', 6).heapWords).toBe(6);
    expect(last('reverse-in-place', 6).heapWords).toBe(0);
  });

  it('shows the deepest stack of sum(3) bottom to top', () => {
    const deepest = spaceTrace('sum-rec', 3).find((f) => f.kind === 'base');
    expect(deepest?.stack.map((f) => f.arg)).toEqual([3, 2, 1, 0]);
    expect(deepest?.stackWords).toBe(8);
  });

  it('swaps ⌊n/2⌋ times in place', () => {
    expect(spaceTrace('reverse-in-place', 7).filter((f) => f.kind === 'swap')).toHaveLength(3);
    expect(spaceTrace('reverse-in-place', 1).filter((f) => f.kind === 'swap')).toHaveLength(0);
  });

  it('starts with start and ends with done, under 400 frames', () => {
    for (const a of SPACE_ALGOS) {
      const frames = spaceTrace(a, MAX_N);
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
      expect(frames.length).toBeLessThan(400);
    }
  });
});

describe('frame independence', () => {
  it('does not share stacks or arrays between frames', () => {
    const frames = spaceTrace('reverse-copy', 4);
    const k = frames.findIndex((f) => f.kind === 'step');
    /** @type {any[]} */ (frames[k].copy)[0] = 99;
    /** @type {number[]} */ (frames[k].input)[0] = 99;
    frames[k].stack[0].words = 99;
    expect(frames[k + 1].copy?.[0]).not.toBe(99);
    expect(frames[k + 1].input?.[0]).toBe(1);
    expect(frames[k + 1].stack[0].words).toBe(4);
  });
});

describe('pseudocode coverage', () => {
  it.each(SPACE_ALGOS)('%s trace highlights every pseudocode line', (a) => {
    const frames = spaceTrace(a, 4);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(spacePseudocode[a].map((_, i) => i));
  });
});
