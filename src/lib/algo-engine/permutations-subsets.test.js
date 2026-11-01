import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/permutations-subsets/copy.en.js';
import {
  GEN_PRESETS,
  MAX_ITEMS,
  choose,
  factorial,
  genPseudocode,
  genTrace,
  parseItems,
  parseK,
  plainCount,
  sortItems,
} from './permutations-subsets.js';

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./permutations-subsets.js').GenFrame} GenFrame */

/** @param {import('./permutations-subsets.js').GenMode} mode @param {string[]} items @param {{k?: number, unique?: boolean}} [o] */
const last = (mode, items, o) => /** @type {GenFrame} */ (genTrace(mode, items, o).at(-1));

/** Every index pick by plain counting, independent of the engine, as joined item labels. */
/** @param {string[]} items */
function allSubsets(items) {
  const sorted = sortItems(items);
  /** @type {string[]} */
  const all = [];
  for (let mask = 0; mask < 2 ** sorted.length; mask++) {
    all.push(sorted.filter((_, i) => mask & (1 << i)).join(' '));
  }
  return all;
}

/** @param {string[]} items @returns {string[]} */
function allPermutations(items) {
  if (items.length === 0) return [''];
  return items.flatMap((x, i) =>
    allPermutations(items.filter((_, j) => j !== i)).map((rest) => (rest ? `${x} ${rest}` : x)),
  );
}

const sorted = (/** @type {string[]} */ a) => a.slice().sort();
const distinct = (/** @type {string[]} */ a) => sorted([...new Set(a)]);

describe('permutations', () => {
  it('lists n! arrangements in lexicographic order', () => {
    expect(last('perm', ['A', 'B', 'C']).outputs).toEqual([
      'A B C',
      'A C B',
      'B A C',
      'B C A',
      'C A B',
      'C B A',
    ]);
  });

  it('matches an oracle, with and without the duplicate rule', () => {
    const rand = seeded(5);
    for (let t = 0; t < 25; t++) {
      const n = 1 + Math.floor(rand() * MAX_ITEMS.perm);
      const items = Array.from({ length: n }, () => 'ABC'[Math.floor(rand() * 3)]);
      const plain = last('perm', items, { unique: false }).outputs;
      expect(sorted(plain)).toEqual(sorted(allPermutations(sortItems(items))));
      const unique = last('perm', items, { unique: true }).outputs;
      expect(sorted(unique)).toEqual(distinct(allPermutations(sortItems(items))));
    }
  });

  it('shows each duplicate exactly once with the rule on', () => {
    expect(last('perm', ['A', 'A', 'B'], { unique: false }).outputs).toHaveLength(6);
    const f = last('perm', ['A', 'A', 'B'], { unique: true });
    expect(f.outputs).toEqual(['A A B', 'A B A', 'B A A']);
    expect(f.skipped).toBeGreaterThan(0);
  });

  it('makes the known number of calls on distinct items', () => {
    // Calls are Σ n!/(n−d)! over depths d: 1 + 3 + 6 + 6 for three items.
    expect(last('perm', ['A', 'B', 'C']).calls).toBe(16);
    expect(last('perm', ['A', 'B', 'C', 'D']).calls).toBe(65);
    expect(last('perm', ['A', 'B', 'C']).copied).toBe(18);
  });
});

describe('combinations', () => {
  it('lists the C(n, k) choices in order', () => {
    expect(last('comb', ['A', 'B', 'C', 'D'], { k: 2 }).outputs).toEqual([
      'A B',
      'A C',
      'A D',
      'B C',
      'B D',
      'C D',
    ]);
  });

  it('matches an oracle on random multisets', () => {
    const rand = seeded(9);
    for (let t = 0; t < 25; t++) {
      const n = 1 + Math.floor(rand() * MAX_ITEMS.comb);
      const items = Array.from({ length: n }, () => 'ABC'[Math.floor(rand() * 3)]);
      const k = Math.floor(rand() * (n + 1));
      const expected = allSubsets(items).filter((s) => (s ? s.split(' ').length : 0) === k);
      expect(sorted(last('comb', items, { k, unique: false }).outputs)).toEqual(sorted(expected));
      expect(sorted(last('comb', items, { k, unique: true }).outputs)).toEqual(distinct(expected));
    }
  });

  it('wastes no calls: each one leads to an output', () => {
    for (const k of [1, 2, 3, 4]) {
      const frames = genTrace('comb', ['A', 'B', 'C', 'D', 'E'], { k });
      const final = /** @type {GenFrame} */ (frames.at(-1));
      /** @param {number} id @returns {boolean} */
      const leadsToOutput = (id) =>
        final.nodes[id].output || final.nodes.some((c) => c.parent === id && leadsToOutput(c.id));
      expect(final.nodes.every((x) => leadsToOutput(x.id))).toBe(true);
    }
  });

  it('handles k = 0 and k = n', () => {
    expect(last('comb', ['A', 'B'], { k: 0 }).outputs).toEqual(['']);
    expect(last('comb', ['A', 'B'], { k: 2 }).outputs).toEqual(['A B']);
  });
});

describe('subsets', () => {
  it('lists 2ⁿ subsets with one call per subset', () => {
    const f = last('subset', ['A', 'B', 'C']);
    expect(f.outputs).toEqual(['', 'A', 'A B', 'A B C', 'A C', 'B', 'B C', 'C']);
    expect(f.calls).toBe(8);
    expect(f.copied).toBe(12);
  });

  it('matches an oracle on random multisets', () => {
    const rand = seeded(3);
    for (let t = 0; t < 25; t++) {
      const n = 1 + Math.floor(rand() * MAX_ITEMS.subset);
      const items = Array.from({ length: n }, () => '12'[Math.floor(rand() * 2)]);
      expect(sorted(last('subset', items, { unique: false }).outputs)).toEqual(
        sorted(allSubsets(items)),
      );
      expect(sorted(last('subset', items, { unique: true }).outputs)).toEqual(
        distinct(allSubsets(items)),
      );
    }
  });
});

describe('trace shape', () => {
  it('keeps frames independent', () => {
    const frames = genTrace('perm', ['A', 'B', 'C']);
    frames[1].nodes[0].label = 'Z';
    frames[1].path.push(9);
    frames[1].items[0] = 'Z';
    expect(frames[2].nodes[0].label).toBe('');
    expect(frames[2].path).not.toContain(9);
    expect(frames[2].items[0]).toBe('A');
  });

  it('starts and ends with the right kinds, and returns the path to empty', () => {
    const frames = genTrace('subset', ['A', 'B']);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.at(-1)?.path).toEqual([]);
  });

  it('stays under the frame budget at each cap', () => {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    expect(genTrace('perm', letters.slice(0, MAX_ITEMS.perm)).length).toBeLessThan(400);
    expect(genTrace('comb', letters, { k: 3 }).length).toBeLessThan(400);
    expect(genTrace('subset', letters).length).toBeLessThan(400);
  });
});

describe('helpers', () => {
  it('reads items and k', () => {
    expect(parseItems('a b c', 4)).toEqual(['a', 'b', 'c']);
    expect(parseItems('abc', 4)).toEqual(['a', 'b', 'c']);
    expect(parseItems('1, 2, 2', 4)).toEqual(['1', '2', '2']);
    expect(parseItems('', 4)).toBeNull();
    expect(parseItems('a b c d e', 4)).toBeNull();
    expect(parseItems('long word', 4)).toBeNull();
    expect(parseK('2', 3)).toBe(2);
    expect(parseK('0', 3)).toBe(0);
    expect(parseK('4', 3)).toBeNull();
    expect(parseK('x', 3)).toBeNull();
  });

  it('sorts numbers by value', () => {
    expect(sortItems(['10', '9', '2'])).toEqual(['2', '9', '10']);
  });

  it('counts arrangements', () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(4)).toBe(24);
    expect(choose(5, 2)).toBe(10);
    expect(choose(5, 6)).toBe(0);
    expect(plainCount('perm', 3, 0)).toBe(6);
    expect(plainCount('comb', 5, 3)).toBe(10);
    expect(plainCount('subset', 5, 0)).toBe(32);
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['perm', 'comb', 'subset']))(
    '%s trace highlights every pseudocode line',
    (mode) => {
      const frames = [
        ...genTrace(mode, ['A', 'A', 'B', 'C'], { k: 2 }),
        ...genTrace(mode, ['A', 'B', 'C'], { k: 2 }),
      ];
      const seen = new Set(frames.flatMap((f) => f.lines));
      expect([...seen].sort((a, b) => a - b)).toEqual(genPseudocode[mode].map((_, i) => i));
    },
  );
});

describe('presets', () => {
  it('all fit their mode cap', () => {
    for (const p of GEN_PRESETS) expect(p.items.length).toBeLessThanOrEqual(MAX_ITEMS[p.mode]);
  });
});

describe('quiz answers', () => {
  it('match the engine', () => {
    /** @param {number} i */
    const answer = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    expect(last('perm', ['A', 'B', 'C', 'D']).outputs).toHaveLength(answer(0));
    expect(last('perm', ['A', 'A', 'B', 'B'], { unique: true }).outputs).toHaveLength(answer(1));
    expect(last('comb', ['A', 'B', 'C', 'D', 'E'], { k: 3 }).outputs).toHaveLength(answer(2));
    expect(last('subset', ['1', '2', '2'], { unique: true }).outputs).toHaveLength(answer(3));
    expect(last('perm', ['A', 'B', 'C']).calls).toBe(answer(4));
  });
});
