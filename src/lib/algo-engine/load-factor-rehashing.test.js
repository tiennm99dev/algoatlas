import { describe, expect, it } from 'vitest';
import {
  ADD_STEP,
  MAX_INSERTS,
  START_M,
  keySequence,
  loadPseudocode,
  loadTrace,
} from './load-factor-rehashing.js';

/** @type {import('./load-factor-rehashing.js').Threshold[]} */
const THRESHOLDS = [0.5, 0.75, 1, null];
/** @type {import('./load-factor-rehashing.js').Growth[]} */
const GROWTHS = ['double', 'add'];

/**
 * Sizes and costs computed straight from the rule, without building chains.
 * @param {number} count
 * @param {import('./load-factor-rehashing.js').Threshold} threshold
 * @param {import('./load-factor-rehashing.js').Growth} growth
 */
function oracle(count, threshold, growth) {
  let m = START_M;
  let moves = 0;
  let grows = 0;
  for (let n = 1; n <= count; n++) {
    if (threshold !== null && n / m > threshold) {
      m = growth === 'double' ? m * 2 : m + ADD_STEP;
      moves += n;
      grows++;
    }
  }
  return { m, moves, grows, work: count + moves };
}

describe('loadTrace', () => {
  it('matches the oracle for every setting and count', () => {
    for (const t of THRESHOLDS) {
      for (const g of GROWTHS) {
        for (let count = 0; count <= MAX_INSERTS; count++) {
          const last = loadTrace(count, t, g).at(-1);
          const want = oracle(count, t, g);
          expect(last?.kind).toBe('done');
          expect(last?.m).toBe(want.m);
          expect(last?.moves).toBe(want.moves);
          expect(last?.grows).toBe(want.grows);
          expect(last?.work).toBe(want.work);
          expect(last?.costs.reduce((a, b) => a + b, 0)).toBe(want.work);
          if (t !== null) expect(last?.load).toBeLessThanOrEqual(t);
        }
      }
    }
  });

  it('keeps every key in chain k mod m after each resize', () => {
    for (const g of GROWTHS) {
      const frames = loadTrace(MAX_INSERTS, 0.75, g);
      for (const f of frames.filter((x) => x.kind === 'rehashed' || x.kind === 'done')) {
        f.buckets.forEach((chain, b) => chain.forEach((k) => expect(k % f.m).toBe(b)));
        expect(f.buckets.flat().sort()).toEqual(keySequence(f.n).sort());
      }
    }
  });

  it('moves every key once per resize, one frame each', () => {
    const frames = loadTrace(24, 0.75, 'double');
    const grows = frames.filter((f) => f.kind === 'grow');
    expect(grows.map((f) => [f.m, f.nextM, f.pending.length])).toEqual([
      [4, 8, 4],
      [8, 16, 7],
      [16, 32, 13],
    ]);
    expect(frames.filter((f) => f.kind === 'move')).toHaveLength(24);
    const last = frames.at(-1);
    expect(last?.work).toBe(48);
    expect(last?.costs.filter((c) => c > 1)).toEqual([5, 8, 14]);
  });

  it('costs one step per insert when it never resizes, and chains grow', () => {
    const last = loadTrace(32, null, 'double').at(-1);
    expect(last?.m).toBe(4);
    expect(last?.work).toBe(32);
    expect(last?.load).toBe(8);
    expect(last?.longest).toBeGreaterThanOrEqual(8);
  });

  it('keeps doubling under 3 steps per insert but lets adding grow faster', () => {
    for (const t of [0.5, 0.75, 1]) {
      const dbl = loadTrace(MAX_INSERTS, /** @type {0.5} */ (t), 'double').at(-1);
      const add = loadTrace(MAX_INSERTS, /** @type {0.5} */ (t), 'add').at(-1);
      expect((dbl?.work ?? 0) / MAX_INSERTS).toBeLessThan(3);
      expect(add?.work).toBeGreaterThan(dbl?.work ?? 0);
    }
  });

  it('handles zero and one insert', () => {
    expect(loadTrace(0, 0.75, 'double').map((f) => f.kind)).toEqual(['start', 'done']);
    const one = loadTrace(1, 0.75, 'double');
    expect(one.map((f) => f.kind)).toEqual(['start', 'insert', 'check', 'done']);
    expect(one.at(-1)?.load).toBe(0.25);
  });
});

describe('keySequence', () => {
  it('gives distinct keys in range, the same every call', () => {
    const keys = keySequence(MAX_INSERTS);
    expect(new Set(keys).size).toBe(MAX_INSERTS);
    expect(keys.every((k) => k >= 0 && k <= 999)).toBe(true);
    expect(keySequence(5)).toEqual(keys.slice(0, 5));
  });
});

describe('frames', () => {
  it('are not aliased', () => {
    const frames = loadTrace(10, 0.75, 'double');
    const next = JSON.stringify([frames[6].buckets, frames[6].costs, frames[6].pending]);
    frames[5].buckets[0].push(999);
    frames[5].costs.push(999);
    frames[5].pending.push(999);
    expect(JSON.stringify([frames[6].buckets, frames[6].costs, frames[6].pending])).toBe(next);
  });

  it('stay under 400 at the insert cap', () => {
    for (const t of THRESHOLDS) {
      for (const g of GROWTHS) expect(loadTrace(MAX_INSERTS, t, g).length).toBeLessThan(400);
    }
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    for (const g of GROWTHS) {
      const seen = new Set(loadTrace(10, 0.75, g).flatMap((f) => f.lines));
      expect([...seen].sort((a, b) => a - b)).toEqual(loadPseudocode[g].map((_, i) => i));
    }
  });
});
