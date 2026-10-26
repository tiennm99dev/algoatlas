import { describe, expect, it } from 'vitest';
import {
  N_ITEMS,
  allRankings,
  decisionTree,
  lowerBound,
  orderOf,
  ranksOf,
  treeNodes,
  treeStats,
  walkPseudocode,
  walkTrace,
} from './comparison-sort-lower-bound.js';

const ALGOS = /** @type {const} */ (['insertion', 'selection']);

/** Sorts item indices by rank: the oracle a leaf must agree with. @param {number[]} ranks */
const oracle = (ranks) => ranks.map((_, i) => i).sort((x, y) => ranks[x] - ranks[y]);

describe('rankings', () => {
  it('lists all n! rankings once each', () => {
    for (const n of [0, 1, 2, 3, 4]) {
      const all = allRankings(n);
      expect(all).toHaveLength([1, 1, 2, 6, 24][n]);
      expect(new Set(all.map((r) => r.join())).size).toBe(all.length);
    }
  });

  it('converts between rankings and orders', () => {
    for (const r of allRankings(3)) expect(ranksOf(orderOf(r))).toEqual(r);
  });
});

describe.each(ALGOS)('%s decision tree', (algo) => {
  const root = decisionTree(algo);

  it('has one reachable leaf per input order and every leaf sorts correctly', () => {
    const leaves = treeNodes(root).filter((d) => d.kind === 'leaf');
    expect(leaves).toHaveLength(6);
    for (const ranks of allRankings(N_ITEMS)) {
      const done = walkTrace(root, ranks).at(-1);
      expect(done?.order).toEqual(oracle(ranks));
      expect(done?.possible).toBe(1);
    }
  });

  it('is at least ⌈log₂ 3!⌉ = 3 deep', () => {
    expect(treeStats(root).height).toBeGreaterThanOrEqual(lowerBound(3).bound);
  });

  it('keeps possible counts that split between the two children', () => {
    for (const d of treeNodes(root)) {
      if (d.kind === 'compare') {
        expect((d.yes?.possible ?? 0) + (d.no?.possible ?? 0)).toBe(d.possible);
      }
    }
  });

  it('walks from start through comparisons to a done leaf', () => {
    const frames = walkTrace(root, [0, 1, 2]);
    expect(frames[0].kind).toBe('start');
    expect(frames[0].possible).toBe(6);
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.slice(1, -1).every((f) => f.kind === 'compare')).toBe(true);
    expect(frames.at(-1)?.comparisons).toBe(frames.length - 2);
  });

  it('does not alias frames', () => {
    const frames = walkTrace(root, [2, 0, 1]);
    const before = frames[2].path.slice();
    frames[1].path.push('x');
    expect(frames[2].path).toEqual(before);
  });
});

describe('the two trees differ', () => {
  it('insertion sort needs only 2 comparisons on sorted input, never more than 3', () => {
    const root = decisionTree('insertion');
    expect(walkTrace(root, [0, 1, 2]).at(-1)?.comparisons).toBe(2);
    expect(treeStats(root)).toEqual({ leaves: 6, impossible: 0, height: 3, totalDepth: 16 });
  });

  it('selection sort always asks 3 questions and wastes two leaves', () => {
    const root = decisionTree('selection');
    for (const ranks of allRankings(3)) expect(walkTrace(root, ranks).at(-1)?.comparisons).toBe(3);
    expect(treeStats(root)).toEqual({ leaves: 6, impossible: 2, height: 3, totalDepth: 18 });
    // Its third question is sometimes already answered: one child can never be reached.
    const forced = treeNodes(root).filter((d) => d.kind === 'compare' && d.possible === 1);
    expect(forced).toHaveLength(2);
  });
});

describe('lowerBound', () => {
  it.each([
    [1, '1', 0],
    [2, '2', 1],
    [3, '6', 3],
    [4, '24', 5],
    [5, '120', 7],
    [10, '3628800', 22],
    [20, '2432902008176640000', 62],
  ])('n = %i: n! = %s, at least %i comparisons', (n, factorial, bound) => {
    const b = lowerBound(n);
    expect(b.factorial.toString()).toBe(factorial);
    expect(b.bound).toBe(bound);
    expect(2 ** b.bound).toBeGreaterThanOrEqual(Number(b.factorial));
  });

  it('stays below n·log₂ n', () => {
    for (let n = 2; n <= 20; n++) expect(lowerBound(n).log2).toBeLessThan(lowerBound(n).nLogN);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const root = decisionTree('insertion');
    const frames = allRankings(3).flatMap((r) => walkTrace(root, r));
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(walkPseudocode.map((_, i) => i));
  });
});
