import { describe, expect, it } from 'vitest';
import {
  MAX_OPS,
  N,
  VARIANTS,
  compareVariants,
  forestHeight,
  makeOps,
  rankPseudocode,
  rankTrace,
} from './union-by-rank-path-compression.js';

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./union-by-rank-path-compression.js').RankFrame} RankFrame @typedef {import('./union-by-rank-path-compression.js').RankOp} RankOp */

/** @param {RankFrame[]} frames */
const last = (frames) => /** @type {RankFrame} */ (frames.at(-1));

/** @param {number[]} parent @param {number} x */
const root = (parent, x) => {
  while (parent[x] !== x) x = parent[x];
  return x;
};

/** Groups as a canonical string, from any parent array. @param {number[]} parent */
const groups = (parent) => {
  /** @type {Map<number, number[]>} */
  const by = new Map();
  parent.forEach((_, i) => by.set(root(parent, i), [...(by.get(root(parent, i)) ?? []), i]));
  return JSON.stringify([...by.values()].sort((a, b) => a[0] - b[0]));
};

/** Quick-find oracle: one label per element, relabelled on every merge. @param {RankOp[]} ops */
function oracle(ops) {
  const label = Array.from({ length: N }, (_, i) => i);
  for (const op of ops) {
    if (op.type !== 'union') continue;
    const la = label[op.a];
    const lb = label[/** @type {number} */ (op.b)];
    if (la !== lb) for (let i = 0; i < N; i++) if (label[i] === lb) label[i] = la;
  }
  /** @type {Map<number, number[]>} */
  const by = new Map();
  label.forEach((l, i) => by.set(l, [...(by.get(l) ?? []), i]));
  return JSON.stringify([...by.values()].sort((a, b) => a[0] - b[0]));
}

/** @param {() => number} rand @returns {RankOp[]} */
function randomLog(rand) {
  const count = Math.floor(rand() * (MAX_OPS + 1));
  return Array.from({ length: count }, () => {
    const a = Math.floor(rand() * N);
    return rand() < 0.65 ? { type: 'union', a, b: Math.floor(rand() * N) } : { type: 'find', a };
  });
}

describe('union by rank and path compression trace', () => {
  it('builds the same sets as a quick-find oracle under every setting', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const ops = randomLog(seeded(seed));
      for (const v of VARIANTS) {
        const f = last(rankTrace(ops, v));
        expect(groups(f.parent)).toBe(oracle(ops));
        expect(f.sets).toBe(JSON.parse(oracle(ops)).length);
      }
    }
  });

  it('keeps rank an upper bound on height and the size at least 2^rank', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const ops = randomLog(seeded(seed));
      for (const compress of [false, true]) {
        for (const f of rankTrace(ops, { byRank: true, compress })) {
          f.parent.forEach((p, i) => {
            if (p !== i) return;
            const members = f.parent.filter((_, j) => root(f.parent, j) === i);
            expect(members.length).toBeGreaterThanOrEqual(2 ** f.rank[i]);
            const depth = Math.max(
              ...members.map((j) => {
                let d = 0;
                for (let x = j; f.parent[x] !== x; x = f.parent[x]) d++;
                return d;
              }),
            );
            expect(depth).toBeLessThanOrEqual(f.rank[i]);
          });
        }
      }
    }
  });

  it('points every walked element at the root after a compressing find', () => {
    const ops = makeOps('chain');
    const frames = rankTrace(ops.slice(0, 10), { byRank: false, compress: true });
    const f = last(frames);
    expect(f.parent).toEqual([9, 9, 9, 9, 9, 9, 9, 9, 9, 9]);
    expect(f.writes).toBe(8);
    expect(f.height).toBe(1);
  });

  it('counts links on the chain preset under each setting', () => {
    expect(compareVariants(makeOps('chain'))).toEqual([
      { key: 'plain', steps: 17, writes: 0, height: 9 },
      { key: 'rank', steps: 8, writes: 0, height: 1 },
      { key: 'compress', steps: 10, writes: 8, height: 1 },
      { key: 'both', steps: 8, writes: 0, height: 1 },
    ]);
  });

  it('counts links on the mixed preset under each setting', () => {
    expect(compareVariants(makeOps('mixed'))).toEqual([
      { key: 'plain', steps: 13, writes: 0, height: 4 },
      { key: 'rank', steps: 11, writes: 0, height: 3 },
      { key: 'compress', steps: 10, writes: 5, height: 3 },
      { key: 'both', steps: 8, writes: 3, height: 2 },
    ]);
  });

  it('swaps roots so the lower rank goes under, and raises rank only on ties', () => {
    const frames = rankTrace(
      [
        { type: 'union', a: 0, b: 1 },
        { type: 'union', a: 2, b: 0 },
      ],
      { byRank: true, compress: false },
    );
    expect(frames.filter((f) => f.kind === 'swap')).toHaveLength(1);
    expect(frames.filter((f) => f.kind === 'rank-up')).toHaveLength(1);
    const f = last(frames);
    expect(f.parent.slice(0, 3)).toEqual([0, 0, 0]);
    expect(f.rank.slice(0, 3)).toEqual([1, 0, 0]);
  });

  it('does nothing when both elements share a root, and handles an empty log', () => {
    const frames = rankTrace([{ type: 'union', a: 3, b: 3 }], { byRank: true, compress: true });
    expect(frames.some((f) => f.kind === 'same-set')).toBe(true);
    expect(last(frames).sets).toBe(N);
    expect(rankTrace([], VARIANTS[0]).map((f) => f.kind)).toEqual(['start', 'done']);
  });

  it('measures height', () => {
    expect(forestHeight([0, 0, 1, 2])).toBe(3);
    expect(forestHeight([0, 1])).toBe(0);
  });

  it('keeps random presets in range', () => {
    for (const op of makeOps('random', seeded(3))) {
      expect(op.a).toBeLessThan(N);
      if (op.type === 'union') expect(op.b).not.toBe(op.a);
    }
  });

  it('stays under 400 frames on long logs at the cap', () => {
    /** @type {RankOp[]} */
    const ops = makeOps('chain').slice(0, 9);
    while (ops.length < MAX_OPS) ops.push({ type: 'find', a: 0 });
    for (const v of VARIANTS) expect(rankTrace(ops, v).length).toBeLessThan(400);
    for (let seed = 1; seed <= 50; seed++) {
      const log = randomLog(seeded(seed));
      for (const v of VARIANTS) expect(rankTrace(log, v).length).toBeLessThan(400);
    }
  });

  it('does not alias frames', () => {
    const frames = rankTrace(makeOps('chain'), { byRank: false, compress: true });
    frames[0].parent[0] = 99;
    frames[0].rank[0] = 99;
    frames[1].path.push(99);
    expect(frames[1].parent[0]).toBe(0);
    expect(frames[1].rank[0]).toBe(0);
    expect(frames[2].path).not.toContain(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [
      ...rankTrace(makeOps('mixed'), { byRank: true, compress: true }),
      ...rankTrace(makeOps('chain'), { byRank: true, compress: false }),
      ...rankTrace(makeOps('chain'), { byRank: false, compress: true }),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(rankPseudocode.map((_, i) => i));
  });
});
