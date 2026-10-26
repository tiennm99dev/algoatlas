import { describe, expect, it } from 'vitest';
import { toCards } from './selection-sort-stability.js';
import {
  CONSTRAINTS,
  MAX_N,
  SHAPES,
  SORTS,
  SORT_FACTS,
  matchSorts,
  parseValues,
  racePseudocode,
  raceResults,
  raceTrace,
  runSort,
  shapeValues,
} from './practice-sorting.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {() => number} rand @param {number} n @param {number} max */
const randomValues = (rand, n, max) => Array.from({ length: n }, () => Math.floor(rand() * max));

/** A stable oracle: the built-in sort is stable, so equal keys keep their input order. */
const oracle = (/** @type {number[]} */ values) =>
  toCards(values)
    .slice()
    .sort((x, y) => x.key - y.key);

const INITIAL = [42, 17, 88, 17, 63, 5, 71, 42, 29, 94, 56, 8];
const tri = (/** @type {number} */ n) => (n * (n - 1)) / 2;

describe.each(SORTS.map((id) => [id]))('%s sort', (id) => {
  it('sorts random, duplicate, sorted, reversed and constant inputs', () => {
    const rand = seeded(11);
    const inputs = [
      [1, 0],
      [5, 5],
      [3, 1, 2],
      Array(9).fill(7),
      shapeValues('sorted', MAX_N),
      shapeValues('reversed', MAX_N),
      ...Array.from({ length: 40 }, (_, k) => randomValues(rand, 2 + (k % 15), k % 2 ? 5 : 100)),
    ];
    for (const values of inputs) {
      const run = runSort(id, toCards(values));
      expect(run.items.map((c) => c.key)).toEqual(oracle(values).map((c) => c.key));
      expect(run.items.map((c) => c.id).sort((x, y) => x - y)).toEqual(values.map((_, i) => i));
      expect(run.comparisons).toBe(run.events.length);
    }
  });

  it('matches its stability fact on inputs with repeated keys', () => {
    const rand = seeded(5);
    const verdicts = Array.from({ length: 60 }, () =>
      runSort(id, toCards(randomValues(rand, 10, 4))),
    ).map((r) => r.stable);
    if (SORT_FACTS[id].stable) expect(verdicts.every((v) => v === true)).toBe(true);
    else expect(verdicts).toContain(false);
  });
});

describe('cost counters', () => {
  it('counts n − 1 comparisons for the adaptive sorts on sorted input', () => {
    for (const n of [8, 16]) {
      const cards = toCards(shapeValues('sorted', n));
      for (const id of SORTS) {
        const run = runSort(id, cards);
        if (SORT_FACTS[id].adaptive) expect(run.comparisons).toBe(n - 1);
        else expect(run.comparisons).toBeGreaterThan(n - 1);
      }
    }
  });

  it('selection sort always compares n(n − 1)/2 pairs and writes at most 2(n − 1) slots', () => {
    const rand = seeded(3);
    for (let k = 0; k < 20; k++) {
      const values = randomValues(rand, 2 + (k % 15), 100);
      const run = runSort('selection', toCards(values));
      expect(run.comparisons).toBe(tri(values.length));
      expect(run.writes).toBeLessThanOrEqual(2 * (values.length - 1));
    }
  });

  it('gives the worst case for bubble and insertion sort on reversed input', () => {
    const cards = toCards(shapeValues('reversed', 16));
    const bubble = runSort('bubble', cards);
    const insertion = runSort('insertion', cards);
    expect(bubble.comparisons).toBe(120);
    expect(bubble.writes).toBe(240);
    expect(insertion.comparisons).toBe(120);
    expect(insertion.writes).toBe(120 + 15);
  });

  it('degrades quicksort with the last pivot on sorted input, stack depth n − 1', () => {
    const run = runSort('quick', toCards(shapeValues('sorted', 16)));
    expect(run.comparisons).toBe(120);
    expect(run.writes).toBe(0);
    expect(run.depth).toBe(15);
    expect(run.buffer).toBe(0);
  });

  it('gives merge sort log₂ n levels and an n-card buffer', () => {
    const sorted = runSort('merge', toCards(shapeValues('sorted', 16)));
    expect(sorted.comparisons).toBe(32);
    expect(sorted.depth).toBe(4);
    expect(sorted.buffer).toBe(16);
    const reversed = runSort('merge', toCards(shapeValues('reversed', 16)));
    expect(reversed.comparisons).toBe(32);
    expect(reversed.writes).toBe(64);
  });

  it('keeps the loop sorts and heapsort free of recursion and buffers', () => {
    for (const id of /** @type {const} */ (['bubble', 'insertion', 'selection', 'heap'])) {
      const run = runSort(id, toCards(INITIAL));
      expect(run.depth).toBe(0);
      expect(run.buffer).toBe(0);
    }
  });
});

describe('race trace', () => {
  it('runs until the slowest sort finishes, one comparison per step', () => {
    const frames = raceTrace(INITIAL);
    const results = raceResults(INITIAL);
    const slowest = Math.max(...results.map((r) => r.comparisons));
    expect(frames).toHaveLength(slowest + 2);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    for (const f of frames.slice(1, -1)) {
      expect(f.kind).toBe('tick');
      for (const lane of f.lanes) {
        const total = /** @type {(typeof results)[number]} */ (
          results.find((r) => r.id === lane.id)
        ).comparisons;
        expect(lane.comparisons).toBe(Math.min(f.t, total));
        expect(lane.done).toBe(f.t >= total);
      }
      expect(f.finished).toEqual(
        SORTS.filter((id) => results.some((r) => r.id === id && r.comparisons === f.t)),
      );
    }
  });

  it('ends with every lane sorted, its totals and its finishing place', () => {
    const done = /** @type {import('./practice-sorting.js').RaceFrame} */ (
      raceTrace(INITIAL).at(-1)
    );
    const want = oracle(INITIAL).map((c) => c.key);
    for (const lane of done.lanes) {
      const result = raceResults(INITIAL).find((r) => r.id === lane.id);
      expect(lane.items.map((c) => c.key)).toEqual(want);
      expect(lane.done).toBe(true);
      expect(lane.focus).toEqual([]);
      expect(lane.writes).toBe(result?.writes);
      expect(lane.place).toBe(result?.place);
    }
  });

  it('ranks by comparisons, then writes, with ties sharing a place', () => {
    const results = raceResults(shapeValues('sorted', 8));
    expect(results.map((r) => r.id)).toEqual([
      'bubble',
      'insertion',
      'merge',
      'heap',
      'selection',
      'quick',
    ]);
    expect(results.map((r) => r.place)).toEqual([1, 1, 3, 4, 5, 5]);
    expect(raceResults(INITIAL)[0]).toMatchObject({ id: 'merge', comparisons: 30, place: 1 });
  });

  it('stays under 125 frames at the size cap', () => {
    for (const shape of SHAPES)
      expect(raceTrace(shapeValues(shape, MAX_N, seeded(2))).length).toBeLessThanOrEqual(122);
  });

  it('does not alias frames or the input', () => {
    const values = INITIAL.slice();
    const frames = raceTrace(values);
    const before = frames[2].lanes[0].items.map((c) => c.key);
    frames[1].lanes[0].items.reverse();
    frames[1].lanes[0].focus.push(99);
    expect(frames[2].lanes[0].items.map((c) => c.key)).toEqual(before);
    expect(frames[2].lanes[0].focus).not.toContain(99);
    expect(values).toEqual(INITIAL);
  });
});

describe('constraints', () => {
  it('matches sorts to combined constraints', () => {
    expect(matchSorts([])).toEqual(SORTS);
    expect(matchSorts(['stable', 'worst'])).toEqual(['merge']);
    expect(matchSorts(['in-place', 'worst'])).toEqual(['heap']);
    expect(matchSorts(['stable', 'in-place', 'adaptive'])).toEqual(['bubble', 'insertion']);
    expect(matchSorts(['few-writes'])).toEqual(['selection']);
    expect(matchSorts(['average'])).toEqual(['merge', 'quick', 'heap']);
    expect(matchSorts(['stable', 'in-place', 'worst'])).toEqual([]);
  });

  it('has a fact for every sort and constraint', () => {
    for (const id of SORTS)
      for (const c of CONSTRAINTS) expect(typeof SORT_FACTS[id][c]).toBe('boolean');
  });

  it('marks only merge and quicksort as needing memory beyond O(1)', () => {
    for (const id of SORTS) {
      const run = runSort(id, toCards(shapeValues('sorted', 16)));
      expect(SORT_FACTS[id]['in-place']).toBe(run.depth === 0 && run.buffer === 0);
    }
  });
});

describe('input helpers', () => {
  it('parses values and refuses bad ones', () => {
    expect(parseValues('3, 1  2')).toEqual({ values: [3, 1, 2] });
    expect(parseValues('3, x')).toEqual({ error: 'format' });
    expect(parseValues('')).toEqual({ error: 'format' });
    expect(parseValues('3, -1')).toEqual({ error: 'format' });
    expect(parseValues('3, 100')).toEqual({ error: 'range' });
    expect(parseValues('3')).toEqual({ error: 'count' });
    expect(parseValues(Array(17).fill(1).join(' '))).toEqual({ error: 'count' });
  });

  it('builds each shape', () => {
    const sorted = shapeValues('sorted', 16);
    expect(sorted[0]).toBe(5);
    expect(sorted.at(-1)).toBe(95);
    expect(sorted.every((v, i) => i === 0 || sorted[i - 1] < v)).toBe(true);
    expect(shapeValues('reversed', 16)).toEqual(sorted.slice().reverse());
    const few = shapeValues('few-unique', 16, seeded(4));
    expect(few.every((v) => v >= 1 && v <= 4)).toBe(true);
    const nearly = shapeValues('nearly-sorted', 16, seeded(4));
    expect(nearly.slice().sort((x, y) => x - y)).toEqual(sorted);
    expect(nearly.filter((v, i) => v !== sorted[i]).length).toBeLessThanOrEqual(4);
    const random = shapeValues('random', 16, seeded(4));
    expect(random.slice().sort((x, y) => x - y)).toEqual(sorted);
    expect(shapeValues('random', 16, seeded(4))).toEqual(random);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line of the race loop', () => {
    const seen = new Set(raceTrace(INITIAL).flatMap((f) => f.lines));
    racePseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
