import { describe, expect, it } from 'vitest';
import { lcg } from './seeded-random.js';

describe('lcg', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = lcg(42);
    const b = lcg(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it('follows the Numerical Recipes constants', () => {
    const rand = lcg(1);
    expect(rand()).toBe(1015568748 / 4294967296);
    expect(rand()).toBe(((1015568748 * 1664525 + 1013904223) % 4294967296) / 4294967296);
  });

  it('stays in [0, 1) and folds a seed into 32 bits', () => {
    const rand = lcg(7);
    for (let i = 0; i < 1000; i++) {
      const x = rand();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(lcg(-1)()).toBe(lcg(4294967295)());
  });
});
