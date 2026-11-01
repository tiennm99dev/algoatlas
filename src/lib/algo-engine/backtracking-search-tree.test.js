import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/backtracking-search-tree/copy.en.js';
import {
  MAX_N,
  SEARCH_PRESETS,
  fullTreeSize,
  parseTarget,
  parseValues,
  searchPseudocode,
  searchTrace,
} from './backtracking-search-tree.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** Every subset adding up to the goal, from counting bitmasks, as sorted strings. */
/** @param {number[]} values @param {number} target */
function oracle(values, target) {
  const n = values.length;
  /** @type {string[]} */
  const found = [];
  for (let mask = 0; mask < 2 ** n; mask++) {
    const picked = values.filter((_, i) => mask & (1 << i));
    if (picked.reduce((a, b) => a + b, 0) === target) found.push(picked.join(','));
  }
  return found.sort();
}

/** @param {number[]} values @param {number} target @param {import('./backtracking-search-tree.js').PruneMode} mode */
const last = (values, target, mode) =>
  /** @type {import('./backtracking-search-tree.js').SearchFrame} */ (
    searchTrace(values, target, mode).at(-1)
  );
/** @param {import('./backtracking-search-tree.js').SearchFrame} f */
const solved = (f) => f.solutions.map((s) => s.join(',')).sort();

describe('search tree', () => {
  it('finds the two subsets of the first example in every mode', () => {
    for (const mode of /** @type {const} */ (['off', 'over', 'both'])) {
      expect(last([3, 5, 2, 4], 7, mode).solutions).toEqual([
        [3, 4],
        [5, 2],
      ]);
    }
  });

  it('agrees with an exhaustive oracle on random inputs, whatever the pruning', () => {
    const rand = seeded(11);
    for (let t = 0; t < 40; t++) {
      const n = 1 + Math.floor(rand() * MAX_N);
      const values = Array.from({ length: n }, () => 1 + Math.floor(rand() * 9));
      const target = 1 + Math.floor(rand() * 20);
      for (const mode of /** @type {const} */ (['off', 'over', 'both'])) {
        expect(solved(last(values, target, mode))).toEqual(oracle(values, target));
      }
    }
  });

  it('counts every node of the full tree with pruning off', () => {
    expect(last([3, 5, 2, 4], 7, 'off').visited).toBe(fullTreeSize(4));
    expect(last([3, 5, 2, 4], 7, 'off').pruned).toBe(0);
    expect(fullTreeSize(4)).toBe(31);
  });

  it('never visits more nodes as pruning gets stronger', () => {
    for (const p of SEARCH_PRESETS) {
      const off = last(p.values, p.target, 'off').visited;
      const over = last(p.values, p.target, 'over').visited;
      const both = last(p.values, p.target, 'both').visited;
      expect(over).toBeLessThanOrEqual(off);
      expect(both).toBeLessThanOrEqual(over);
    }
  });

  it('walks one straight path when the target needs every number', () => {
    const f = last([1, 2, 3, 4, 5], 15, 'both');
    expect(f.solutions).toEqual([[1, 2, 3, 4, 5]]);
    // Each of the five levels adds a kept node and a skip branch cut at once.
    expect(f.visited).toBe(11);
    expect(f.pruned).toBe(5);
  });

  it('stops at the root when the numbers cannot reach the target', () => {
    const f = last([2, 4], 50, 'both');
    expect(f.visited).toBe(1);
    expect(f.pruned).toBe(1);
    expect(f.solutions).toEqual([]);
  });

  it('handles one number', () => {
    expect(last([4], 4, 'off').solutions).toEqual([[4]]);
    expect(last([4], 5, 'off').solutions).toEqual([]);
  });

  it('undoes every choice before it tries the other branch', () => {
    const frames = searchTrace([3, 5, 2], 5, 'off');
    for (const f of frames) {
      const onPath = f.chosen.reduce((a, at) => a + f.values[at], 0);
      if (f.kind !== 'done') expect(onPath).toBe(f.sum);
    }
    expect(frames.at(-1)?.chosen).toEqual([]);
  });

  it('keeps frames independent of each other and of the input', () => {
    const values = [3, 5, 2];
    const frames = searchTrace(values, 5, 'both');
    const nodeStatus = frames[2].nodes[0].status;
    frames[1].nodes[0].status = 'dead';
    frames[1].values[0] = 99;
    frames[1].chosen.push(99);
    expect(frames[2].nodes[0].status).toBe(nodeStatus);
    expect(frames[2].values[0]).toBe(3);
    expect(frames[2].chosen).not.toContain(99);
    expect(values).toEqual([3, 5, 2]);
  });

  it('stays under the frame budget at the size cap', () => {
    const frames = searchTrace([1, 1, 1, 1, 1], 100, 'off');
    expect(frames.length).toBeLessThan(400);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });
});

describe('input', () => {
  it('reads numbers and refuses bad ones', () => {
    expect(parseValues('3, 5 2')).toEqual([3, 5, 2]);
    expect(parseValues('')).toBeNull();
    expect(parseValues('0 1')).toBeNull();
    expect(parseValues('1 2 3 4 5 6')).toBeNull();
    expect(parseValues('21')).toBeNull();
    expect(parseValues('1.5')).toBeNull();
    expect(parseTarget('7')).toBe(7);
    expect(parseTarget('0')).toBeNull();
    expect(parseTarget('101')).toBeNull();
    expect(parseTarget('x')).toBeNull();
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['off', 'over', 'both']))(
    '%s trace highlights every pseudocode line',
    (mode) => {
      const frames = [...searchTrace([3, 5, 2, 4], 7, mode), ...searchTrace([2, 4], 50, mode)];
      const seen = new Set(frames.flatMap((f) => f.lines));
      expect([...seen].sort((a, b) => a - b)).toEqual(searchPseudocode[mode].map((_, i) => i));
    },
  );
});

describe('quiz answers', () => {
  it('match the engine', () => {
    /** @param {number} i */
    const answer = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    expect(last([3, 5, 2, 4], 7, 'off').visited).toBe(answer(0));
    expect(last([3, 5, 2, 4], 7, 'over').visited).toBe(answer(1));
    expect(last([3, 5, 2, 4], 7, 'both').visited).toBe(answer(2));
    expect(last([8, 7, 6, 5, 4], 9, 'both').solutions).toEqual([[5, 4]]);
    expect(last([8, 7, 6, 5, 4], 9, 'both').visited).toBe(answer(3));
  });
});
