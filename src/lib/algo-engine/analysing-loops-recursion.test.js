import { describe, expect, it } from 'vitest';
import {
  MAX_NODES,
  nodeCount,
  recursionPseudocode,
  recursionTrace,
  subtreeCost,
  treeCase,
  treeRoots,
  validRecurrence,
} from './analysing-loops-recursion.js';

/** Independent oracle: evaluate the recurrence directly. @param {number} a @param {number} b @param {number} d @param {number} n @returns {number} */
function T(a, b, d, n) {
  return n === 1 ? 1 : a * T(a, b, d, n / b) + n ** d;
}

/** @param {import('$lib/components/tree-layout.js').TreeNode[]} roots */
function countNodes(roots) {
  /** @param {import('$lib/components/tree-layout.js').TreeNode | null} t @returns {number} */
  const go = (t) => (t ? 1 + (t.children ?? []).reduce((s, c) => s + go(c), 0) : 0);
  return roots.reduce((s, r) => s + go(r), 0);
}

/** @type {import('./analysing-loops-recursion.js').Recurrence[]} */
const valid = [];
for (let a = 1; a <= 4; a++)
  for (let b = 2; b <= 4; b++)
    for (let d = 0; d <= 2; d++)
      for (let k = 1; k <= 6; k++) if (validRecurrence({ a, b, d, k })) valid.push({ a, b, d, k });

describe('recursionTrace totals', () => {
  it('covers many recurrences', () => {
    expect(valid.length).toBeGreaterThan(80);
  });

  it.each(valid)('sums the levels to T(n) for %o', (r) => {
    const frames = recursionTrace(r);
    const last = /** @type {import('./analysing-loops-recursion.js').RecursionFrame} */ (
      frames.at(-1)
    );
    expect(last.total).toBe(T(r.a, r.b, r.d, r.b ** r.k));
    expect(last.levels).toHaveLength(r.k + 1);
    expect(last.levels.reduce((s, l) => s + l.cost, 0)).toBe(last.total);
  });

  it('evaluates one call’s subtree', () => {
    expect(subtreeCost({ a: 2, b: 2, d: 1, k: 4 }, 4)).toBe(12);
    expect(subtreeCost({ a: 2, b: 2, d: 1, k: 4 }, 1)).toBe(1);
    expect(subtreeCost({ a: 3, b: 2, d: 1, k: 3 }, 8)).toBe(T(3, 2, 1, 8));
  });

  it('gives merge sort n log₂ n + n for n = 16', () => {
    const last = recursionTrace({ a: 2, b: 2, d: 1, k: 4 }).at(-1);
    expect(last?.total).toBe(16 * 4 + 16);
    expect(last?.levels.map((l) => l.cost)).toEqual([16, 16, 16, 16, 16]);
    expect(last?.treeCase).toBe('equal');
  });

  it('gives binary search log₂ n + 1 for n = 32', () => {
    const last = recursionTrace({ a: 1, b: 2, d: 0, k: 5 }).at(-1);
    expect(last?.total).toBe(6);
    expect(last?.treeCase).toBe('equal');
  });

  it('names the dominating levels', () => {
    expect(treeCase({ a: 1, b: 2, d: 1, k: 3 })).toBe('root');
    expect(treeCase({ a: 4, b: 2, d: 1, k: 3 })).toBe('leaves');
    expect(treeCase({ a: 4, b: 2, d: 2, k: 3 })).toBe('equal');
  });

  it('refuses trees larger than the cap and bad parameters', () => {
    expect(nodeCount(4, 3)).toBe(85);
    expect(validRecurrence({ a: 4, b: 2, d: 1, k: 3 })).toBe(true);
    expect(validRecurrence({ a: 4, b: 2, d: 1, k: 4 })).toBe(false);
    expect(validRecurrence({ a: 2, b: 2, d: 1, k: 6 })).toBe(false);
    expect(validRecurrence({ a: 0, b: 2, d: 1, k: 2 })).toBe(false);
    expect(validRecurrence({ a: 2, b: 1, d: 1, k: 2 })).toBe(false);
    expect(validRecurrence({ a: 2, b: 2, d: 1.5, k: 2 })).toBe(false);
  });
});

describe('recursionTrace frames', () => {
  it('alternates summing and expanding, then the leaves', () => {
    const kinds = recursionTrace({ a: 2, b: 2, d: 1, k: 2 }).map((f) => f.kind);
    expect(kinds).toEqual(['start', 'level', 'expand', 'level', 'expand', 'leaves', 'done']);
  });

  it('draws exactly the levels expanded so far', () => {
    const frames = recursionTrace({ a: 3, b: 2, d: 1, k: 3 });
    expect(countNodes(treeRoots(frames[0]))).toBe(1);
    expect(countNodes(treeRoots(frames[2]))).toBe(4);
    expect(countNodes(treeRoots(/** @type {any} */ (frames.at(-1))))).toBe(40);
    expect(nodeCount(3, 3)).toBeLessThanOrEqual(MAX_NODES);
  });

  it('marks the level being summed and the new subproblems', () => {
    const frames = recursionTrace({ a: 2, b: 2, d: 1, k: 2 });
    const [root] = treeRoots(frames[3]);
    expect(root.state).toBe('visited');
    expect(root.children?.[0]?.state).toBe('active');
    const [root2] = treeRoots(frames[4]);
    expect(root2.children?.[0]?.children?.[0]?.state).toBe('frontier');
    expect(root2.children?.[0]?.children?.[0]?.label).toBe('1');
  });

  it('does not share level rows between frames', () => {
    const frames = recursionTrace({ a: 2, b: 2, d: 1, k: 2 });
    frames[3].levels[0].cost = -1;
    frames[3].rec.a = 9;
    expect(frames[4].levels[0].cost).toBe(4);
    expect(frames[4].rec.a).toBe(2);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = recursionTrace({ a: 2, b: 2, d: 1, k: 2 });
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(recursionPseudocode.map((_, i) => i));
  });
});
