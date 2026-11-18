import { describe, expect, it } from 'vitest';
import {
  MAX_NODES,
  MAX_OPS,
  PRACTICE_PRESETS,
  formatOps,
  makePracticePreset,
  parseOps,
  practicePseudocode,
  practiceTrace,
} from './practice-tree-techniques.js';
import { isRootedTree, lettered, randomParents } from './rooted-tree.js';
import { en as m } from '$lib/lessons/practice-tree-techniques/copy.en.js';

/** Deterministic LCG so random trees are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Path by ancestor sets, an oracle independent of the engine. @param {number[]} parent @param {number} u @param {number} v */
function oraclePath(parent, u, v) {
  const up = (/** @type {number} */ x) => {
    const out = [];
    for (let y = x; y >= 0; y = parent[y]) out.push(y);
    return out;
  };
  const a = up(u);
  const b = up(v);
  const meet = /** @type {number} */ (a.find((x) => b.includes(x)));
  return [...a.slice(0, a.indexOf(meet) + 1), ...b.slice(0, b.indexOf(meet)).reverse()];
}

/** @typedef {import('./practice-tree-techniques.js').TreeOpFrame} TreeOpFrame */

const sample = makePracticePreset('sample');
const caterpillar = makePracticePreset('caterpillar');

describe('tree query runner', () => {
  it('answers sums, distances and sets like a direct oracle', () => {
    const rand = seeded(21);
    for (let trial = 0; trial < 15; trial++) {
      const n = 1 + Math.floor(rand() * MAX_NODES);
      const tree = {
        ...lettered(randomParents(n, rand)),
        value: Array.from({ length: n }, () => Math.floor(rand() * 10)),
      };
      const values = tree.value.slice();
      /** @type {import('./practice-tree-techniques.js').TreeOp[]} */
      const ops = [];
      for (let i = 0; i < MAX_OPS; i++) {
        const u = Math.floor(rand() * n);
        const v = Math.floor(rand() * n);
        const r = rand();
        ops.push(
          r < 0.4
            ? { type: 'sum', u, v }
            : r < 0.75
              ? { type: 'dist', u, v }
              : { type: 'set', u, x: Math.floor(rand() * 10) },
        );
      }
      const frames = practiceTrace(tree, ops);
      ops.forEach((op, i) => {
        const f = /** @type {TreeOpFrame} */ (frames[i + 1]);
        if (op.type === 'set') {
          values[op.u] = op.x;
          expect(f.values).toEqual(values);
          return;
        }
        const path = oraclePath(tree.parent, op.u, op.v);
        expect(f.path).toEqual(path);
        expect(f.naive).toBe(path.length);
        expect(f.answer).toBe(
          op.type === 'sum' ? path.reduce((s, x) => s + values[x], 0) : path.length - 1,
        );
      });
    }
  });

  it('counts the sample workload’s work both ways', () => {
    const frames = practiceTrace(sample.tree, sample.ops);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'sum',
      'dist',
      'set',
      'sum',
      'dist',
      'done',
    ]);
    expect(frames.slice(1, 6).map((f) => f.answer)).toEqual([34, 7, 0, 33, 8]);
    expect(frames[1].ranges).toHaveLength(3);
    expect(frames[1].hld).toBe(29);
    expect(frames[2].hld).toBe(3 + 3);
    expect(frames[3].hld).toBe(5);
    const done = /** @type {TreeOpFrame} */ (frames.at(-1));
    expect([done.naiveTotal, done.hldTotal]).toEqual([34, 75]);
  });

  it('runs the caterpillar workload the questions quote', () => {
    const frames = practiceTrace(caterpillar.tree, caterpillar.ops);
    expect(frames[1].ranges).toHaveLength(2);
    expect(frames.slice(1, 6).map((f) => [f.naive, f.hld])).toEqual([
      [15, 20],
      [15, 5],
      [4, 30],
      [1, 5],
      [15, 20],
    ]);
    expect(frames.at(-1)?.naiveTotal).toBe(50);
  });

  it('keeps the stored answers of the practice questions true', () => {
    const s = practiceTrace(sample.tree, sample.ops);
    const c = practiceTrace(caterpillar.tree, caterpillar.ops);
    const [q1, q2, q3, q4, q5] = m.practice;
    expect(q1.type === 'number' && q1.answer).toBe(s[4].answer);
    expect(q2.type === 'number' && q2.answer).toBe(s[5].answer);
    expect(q3.type === 'number' && q3.answer).toBe(c[1].ranges.length);
    expect(q4.type === 'number' && q4.answer).toBe(c.at(-1)?.naiveTotal);
    const cheaper = c.slice(1, 5).flatMap((f, i) => (f.naive < f.hld ? [i] : []));
    expect(q5.type === 'multi' && q5.answers).toEqual(cheaper);
  });

  it('parses, formats and refuses operations', () => {
    const labels = sample.tree.labels;
    const r = parseOps(' sum m l ;dist K O\nset d 0 ', labels);
    expect('ops' in r && formatOps(r.ops, labels)).toBe('sum M L, dist K O, set D 0');
    expect(parseOps('', labels)).toEqual({ error: 'empty' });
    expect(parseOps('add A B', labels)).toEqual({ error: 'format' });
    expect(parseOps('sum A', labels)).toEqual({ error: 'format' });
    expect(parseOps('sum A B C', labels)).toEqual({ error: 'format' });
    expect(parseOps('sum A Z', labels)).toEqual({ error: 'node' });
    expect(parseOps('set A 10', labels)).toEqual({ error: 'value' });
    expect(parseOps('set A -1', labels)).toEqual({ error: 'value' });
    expect(
      parseOps(
        Array(MAX_OPS + 1)
          .fill('sum A B')
          .join(','),
        labels,
      ),
    ).toEqual({
      error: 'many',
    });
  });

  it('builds valid presets and does not alias frames', () => {
    for (const p of PRACTICE_PRESETS) {
      const { tree, ops } = makePracticePreset(p, seeded(5));
      expect(isRootedTree(tree)).toBe(true);
      expect(tree.parent.length).toBeLessThanOrEqual(MAX_NODES);
      expect(practiceTrace(tree, ops).length).toBe(ops.length + 2);
    }
    const frames = practiceTrace(sample.tree, sample.ops);
    frames[1].values[0] = 99;
    frames[1].path.push(99);
    expect(frames[2].values[0]).toBe(3);
    expect(frames[2].path).not.toContain(99);
    expect(() => practiceTrace(sample.tree, [{ type: 'sum', u: 0, v: 40 }])).toThrow();
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const seen = new Set(practiceTrace(sample.tree, sample.ops).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(practicePseudocode.map((_, i) => i));
  });
});
