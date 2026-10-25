import { describe, expect, it } from 'vitest';
import {
  BUCKETS,
  SNIPPETS,
  countOps,
  doublingSizes,
  doublingTrace,
  gradePlacement,
} from './practice-complexity.js';

/** @typedef {import('./practice-complexity.js').SnippetId} SnippetId */

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} n */
const log2floor = (n) => Math.floor(Math.log2(n));
/** @param {number} n */
const log2ceil = (n) => Math.ceil(Math.log2(n));
/** @param {number} n */
function fibonacci(n) {
  let [a, b] = [0, 1];
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}

/** Closed forms, derived by hand, as the oracle for the counted runs. @type {Record<SnippetId, (n: number) => number>} */
const closed = {
  formula: () => 1,
  halving: (n) => log2floor(n),
  single: (n) => n,
  'fixed-inner': (n) => 10 * n,
  nested: (n) => n * n,
  triangle: (n) => (n * (n + 1)) / 2,
  loglinear: (n) => n * log2ceil(n),
  geometric: (n) => 2 ** (log2floor(n) + 1) - 1,
  split: (n) => n * Math.log2(n),
  fib: (n) => 2 * fibonacci(n + 1) - 1,
};

describe('countOps', () => {
  it.each(SNIPPETS.map((s) => [s.id]))(
    '%s matches its closed form on every doubling size',
    (id) => {
      const snippet = /** @type {SnippetId} */ (id);
      for (const n of doublingSizes(snippet)) expect(countOps(snippet, n)).toBe(closed[snippet](n));
    },
  );

  it('matches the closed forms on random n where they hold for any n', () => {
    const rand = seeded(3);
    for (let k = 0; k < 20; k++) {
      const n = 1 + Math.floor(rand() * 300);
      for (const id of /** @type {SnippetId[]} */ ([
        'formula',
        'halving',
        'single',
        'fixed-inner',
        'nested',
        'triangle',
        'loglinear',
        'geometric',
      ]))
        expect(countOps(id, n)).toBe(closed[id](n));
    }
  });

  it('counts the values the practice questions use', () => {
    expect(countOps('triangle', 64)).toBe(2080);
    expect(countOps('geometric', 1024)).toBe(2047);
    expect(countOps('fib', 16)).toBe(3193);
    expect(countOps('split', 1024) / countOps('split', 512)).toBeCloseTo(2.2222, 3);
    expect(countOps('loglinear', 1024)).toBe(10240);
    expect(countOps('halving', 1024)).toBe(10);
    expect(countOps('single', 1024)).toBe(1024);
  });
});

describe('doublingTrace', () => {
  it('records n, count, ratio and difference for each doubling', () => {
    const frames = doublingTrace('nested');
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    const rows = frames.at(-1)?.rows ?? [];
    expect(rows.map((r) => r.n)).toEqual([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]);
    expect(rows[0].ratio).toBeNull();
    expect(rows[0].diff).toBeNull();
    for (const r of rows.slice(1)) expect(r.ratio).toBe(4);
  });

  it('shows the ratio signature of each class', () => {
    /** @param {SnippetId} id */
    const lastRow = (id) =>
      /** @type {import('./practice-complexity.js').DoublingRow} */ (
        doublingTrace(id).at(-1)?.rows.at(-1)
      );
    expect(lastRow('formula').ratio).toBe(1);
    expect(lastRow('halving').diff).toBe(1);
    expect(lastRow('single').ratio).toBe(2);
    expect(lastRow('loglinear').ratio).toBeCloseTo((10 / 9) * 2, 6);
    expect(lastRow('fib').ratio).toBeGreaterThan(40);
  });

  it('leaves the ratio empty after a zero count', () => {
    const rows = doublingTrace('halving').at(-1)?.rows ?? [];
    expect(rows[0].count).toBe(0);
    expect(rows[1].ratio).toBeNull();
    expect(rows[1].diff).toBe(1);
  });

  it('caps the exponential snippet at n = 16 and stays small', () => {
    expect(doublingSizes('fib')).toEqual([1, 2, 4, 8, 16]);
    for (const s of SNIPPETS) expect(doublingTrace(s.id).length).toBeLessThan(400);
  });
});

describe('gradePlacement', () => {
  it('marks right, wrong and unplaced cards', () => {
    const { verdicts, right, total } = gradePlacement({ nested: 'n2', halving: 'n', fib: null });
    expect(verdicts.nested).toBe('right');
    expect(verdicts.halving).toBe('wrong');
    expect(verdicts.fib).toBe('unplaced');
    expect(verdicts.single).toBe('unplaced');
    expect(right).toBe(1);
    expect(total).toBe(SNIPPETS.length);
  });

  it('gives full marks for the answer key and uses every bucket', () => {
    const key = Object.fromEntries(SNIPPETS.map((s) => [s.id, s.bucket]));
    expect(gradePlacement(key).right).toBe(SNIPPETS.length);
    expect(new Set(SNIPPETS.map((s) => s.bucket))).toEqual(new Set(BUCKETS));
  });
});

describe('frame independence', () => {
  it('does not share rows between frames', () => {
    const frames = doublingTrace('single');
    frames[2].rows[0].count = 99;
    expect(frames[3].rows[0].count).toBe(1);
  });
});

describe('pseudocode coverage', () => {
  it.each(SNIPPETS.map((s) => [s.id]))('%s trace highlights every line', (id) => {
    const snippet = SNIPPETS.find((s) => s.id === id);
    const seen = new Set(doublingTrace(/** @type {SnippetId} */ (id)).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(snippet?.code.map((_, i) => i));
  });
});
