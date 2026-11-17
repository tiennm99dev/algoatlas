import { describe, expect, it } from 'vitest';
import {
  MODELS,
  SCENARIOS,
  evaluate,
  initialParams,
  matchPseudocode,
  matchTrace,
  scenario,
} from './practice-computation-models.js';

describe('scenario costs', () => {
  it('give each card parameters inside their ranges and a known model', () => {
    for (const s of SCENARIOS) {
      expect(MODELS).toContain(s.model);
      expect(s.candidates.length).toBeGreaterThanOrEqual(2);
      for (const p of s.params) {
        expect(p.initial).toBeGreaterThanOrEqual(p.min);
        expect(p.initial).toBeLessThanOrEqual(p.max);
      }
    }
  });

  it('sum: one chunk per core beats the plain loop and matches it on one core', () => {
    const n = 2 ** 20;
    expect(evaluate('sum', { logN: 20, p: 8 }).costs).toEqual([
      { id: 'loop', cost: n - 1 },
      { id: 'forkJoin', cost: Math.ceil((n - 1) / 8) + 20 },
      { id: 'chunks', cost: n / 8 - 1 + 3 },
    ]);
    expect(evaluate('sum', { logN: 20, p: 1 }).best).toEqual(['loop', 'chunks']);
  });

  it('sort: the cheapest algorithm depends on the number of cores', () => {
    expect(evaluate('sort', { logN: 20, p: 1 }).best).toEqual(['serial']);
    const many = evaluate('sort', { logN: 20, p: 16 });
    expect(many.best).toEqual(['parallelMerge']);
    expect(many.costs[2].cost).toBe((20 * 2 ** 20) / 16 + 8000);
  });

  it('transpose: the recursive order needs only a tall cache', () => {
    const tall = evaluate('transpose', { logN: 12, logB: 6, logM: 14 });
    expect(tall.costs.map((c) => c.cost)).toEqual([2 ** 24 + 2 ** 18, 2 ** 19]);
    expect(tall.best).toEqual(['recursive']);
    // M < B²: both orders fall back to about one transfer per element.
    expect(evaluate('transpose', { logN: 12, logB: 8, logM: 14 }).best).toEqual([
      'rows',
      'recursive',
    ]);
    // M ≥ N · B: the plain loop is ideal too.
    expect(evaluate('transpose', { logN: 12, logB: 6, logM: 20 }).best).toEqual([
      'rows',
      'recursive',
    ]);
  });

  it('online cards: break-even and LRU have the best competitive ratios', () => {
    const servers = evaluate('servers', { b: 24 });
    expect(servers.best).toEqual(['breakEven']);
    expect(servers.costs[1].cost).toBeCloseTo(2 - 1 / 24);
    expect(servers.costs[2].cost).toBe(Infinity);
    expect(evaluate('webCache', { k: 16 }).best).toEqual(['lru']);
  });

  it('election: FloodMax on a ring sends half the messages of flooding every ID', () => {
    for (let n = 3; n <= 64; n++) {
      const { costs, best } = evaluate('election', { n });
      expect(costs[0].cost).toBe(2 * n * Math.floor(n / 2));
      expect(costs[1].cost).toBe(2 * n * n);
      expect(best).toEqual(['floodMax']);
    }
  });

  it('refuses an unknown card', () => {
    expect(() => scenario('nope')).toThrow();
  });
});

describe('match trace', () => {
  it('checks the model, costs each candidate and gives the verdict', () => {
    const s = scenario('sort');
    const frames = matchTrace('sort', initialParams(s), {
      model: 'parallel',
      algorithm: 'serialMerge',
    });
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'model',
      'cost',
      'cost',
      'cost',
      'verdict',
      'done',
    ]);
    expect(frames[1].modelOk).toBe(true);
    expect(frames[3].costs.map((c) => c.id)).toEqual(['serial', 'serialMerge']);
    expect(frames[3].candidate).toBe('serialMerge');
    expect(frames[5].best).toEqual(['parallelMerge']);
    expect(frames[5].algorithmOk).toBe(false);
  });

  it('marks a wrong model and a right algorithm', () => {
    const frames = matchTrace('webCache', { k: 4 }, { model: 'external', algorithm: 'lru' });
    expect(frames[1].modelOk).toBe(false);
    expect(frames.at(-1)?.algorithmOk).toBe(true);
  });

  it('records frames that do not alias each other', () => {
    const frames = matchTrace('sum', { logN: 10, p: 2 }, { model: 'parallel', algorithm: 'loop' });
    frames[4].costs[0].cost = -1;
    expect(frames[5].costs[0].cost).toBe(1023);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const frames = matchTrace('sum', { logN: 10, p: 2 }, { model: 'parallel', algorithm: 'loop' });
    const seen = new Set(frames.flatMap((f) => f.lines));
    matchPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
