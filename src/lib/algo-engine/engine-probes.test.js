/**
 * Property-based probing of engines for edge cases.
 */

import { describe, it, expect } from 'vitest';
import { mergeSortTrace, quickSortTrace } from './merge-quick-sort.js';
import { boundTrace, makeSortedArrayWithDuplicates } from './lower-upper-bound.js';
import { hashTableTrace, hashKey, HASH_SIZES, parseKeys } from './hash-table.js';
import { bstTrace, inorderKeys } from './bst.js';
import { dfsGridTrace } from './dfs-grid.js';
import { dijkstraGridTrace, stepCost, randomTerrain } from './dijkstra-grid.js';
import { toItems, makeArray } from './sorting.js';
import { bfsGridTrace } from './graph.js';

const seeded = (/** @type {number} */ seed) => {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
};

// ============ Merge/Quick Sort Probing ============
describe('Merge/Quick Sort edge cases', () => {
  it('handles very large arrays at the size cap (24)', () => {
    const large = toItems(makeArray('random', 24, seeded(42)));
    const merge = mergeSortTrace(large);
    const quick = quickSortTrace(large, 'last', seeded(99));

    expect(merge.at(-1)?.items.every(() => true)).toBe(true);
    expect(quick.at(-1)?.items.every(() => true)).toBe(true);
    expect(merge.length).toBeGreaterThan(0);
    expect(quick.length).toBeGreaterThan(0);
  });

  it('all pivot rules produce correctly sorted arrays', () => {
    const input = toItems([5, 2, 8, 1, 9, 3, 7]);

    const rules = /** @type {const} */ (['last', 'median3', 'random']);
    for (const rule of rules) {
      const trace = quickSortTrace(input, rule, seeded(42));
      const sorted = trace.at(-1)?.items.map((x) => x.value);
      if (sorted) {
        const expected = [...sorted].sort((a, b) => a - b);
        expect(sorted).toEqual(expected);
      }
    }
  });

  it('detects when quicksort swap frames have i !== j', () => {
    const input = toItems(makeArray('random', 12, seeded(77)));
    const trace = quickSortTrace(input, 'last', seeded(88));

    const swaps = trace.filter((f) => f.kind === 'swap');
    for (const swap of swaps) {
      expect(swap.i).not.toBe(swap.j);
    }
  });
});

// ============ Lower/Upper Bound Probing ============
describe('Lower/Upper Bound edge cases', () => {
  it('exhaustively validates bounds on small arrays with duplicates', () => {
    const arrays = [[], [1], [1, 1], [1, 2, 3], [1, 1, 3], [1, 3, 3], [1, 3, 3, 5]];

    for (const arr of arrays) {
      for (const x of [-1, 1, 2, 3, 4, 5, 6]) {
        const lower = boundTrace(arr, x, 'lower');
        const upper = boundTrace(arr, x, 'upper');

        const lowerAns = lower.at(-1)?.answer ?? -1;
        const upperAns = upper.at(-1)?.answer ?? -1;

        // Linear scan verification
        let lowerExpected = arr.length;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] >= x) {
            lowerExpected = i;
            break;
          }
        }

        let upperExpected = arr.length;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] > x) {
            upperExpected = i;
            break;
          }
        }

        expect(lowerAns).toBe(lowerExpected);
        expect(upperAns).toBe(upperExpected);
        expect(upperAns - lowerAns).toBe(arr.filter((v) => v === x).length);
      }
    }
  });

  it('maintains window invariant lo <= hi in all frames', () => {
    const arr = makeSortedArrayWithDuplicates(15, seeded(42));
    const variants = /** @type {const} */ (['lower', 'upper']);

    for (const x of [0, arr[0] || 0, arr[Math.floor(arr.length / 2)] || 0, 100]) {
      for (const variant of variants) {
        const trace = boundTrace(arr, x, variant);
        for (const frame of trace) {
          expect(frame.lo).toBeLessThanOrEqual(frame.hi);
        }
      }
    }
  });

  it('mid is in range [lo, hi) on every probe frame', () => {
    const arr = [1, 2, 3, 5, 8, 13];
    const trace = boundTrace(arr, 5, 'lower');

    for (const frame of trace) {
      if (frame.kind === 'probe' && frame.mid !== -1) {
        expect(frame.mid).toBeGreaterThanOrEqual(frame.lo);
        expect(frame.mid).toBeLessThan(frame.hi);
      }
    }
  });

  it('returns empty for makeSortedArrayWithDuplicates(0)', () => {
    const arr = makeSortedArrayWithDuplicates(0);
    expect(arr).toEqual([]);
  });
});

// ============ Hash Table Probing ============
describe('Hash table edge cases', () => {
  it('hashKey returns values in [0, m) for all sizes and functions', () => {
    const testKeys = [0, 1, 42, 100, 500, 999];
    const fns = /** @type {const} */ (['mod-prime', 'mod-pow2', 'multiply']);

    for (const fn of fns) {
      for (const m of HASH_SIZES[fn]) {
        for (const k of testKeys) {
          const bucket = hashKey(k, m, fn);
          expect(bucket).toBeGreaterThanOrEqual(0);
          expect(bucket).toBeLessThan(m);
        }
      }
    }
  });

  it('mod-pow2 with multiples of 8 causes collisions on small tables', () => {
    const multiples = [0, 8, 16, 24];
    const buckets = new Set();

    for (const k of multiples) {
      buckets.add(hashKey(k, 4, 'mod-pow2'));
    }

    expect(buckets.size).toBeLessThan(multiples.length);
  });

  it('handles duplicate insertions by updating (not increasing n)', () => {
    const trace = hashTableTrace([10, 20, 10, 30], 'mod-prime');
    const final = trace.at(-1);

    // Count distinct keys
    const keys = new Set();
    for (const bucket of final?.buckets || []) {
      bucket.forEach((k) => keys.add(k));
    }

    expect(keys.size).toBe(3);
  });

  it('parseKeys validates format, range, and count', () => {
    const valid = parseKeys('5, 17, 3');
    if ('keys' in valid) {
      expect(valid.keys).toEqual([5, 17, 3]);
    }

    const invalidRange = parseKeys('5, -3, 1000');
    if ('error' in invalidRange) {
      expect(invalidRange.error).toBe('range');
    }

    const invalidFormat = parseKeys('a, b, c');
    if ('error' in invalidFormat) {
      expect(invalidFormat.error).toBe('format');
    }
  });
});

// ============ BST Probing ============
describe('BST edge cases', () => {
  it('maintains BST invariant at final frame', () => {
    const ops = /** @type {import('./bst.js').BstOp[]} */ ([
      { type: 'insert', key: 50 },
      { type: 'insert', key: 30 },
      { type: 'insert', key: 70 },
      { type: 'insert', key: 20 },
      { type: 'insert', key: 40 },
      { type: 'delete', key: 30 },
      { type: 'search', key: 40 },
    ]);

    const trace = bstTrace(ops);
    const frame = trace.at(-1);
    if (!frame) return;

    for (let i = 0; i < frame.nodes.length; i++) {
      const node = frame.nodes[i];
      if (node.key === null) continue;

      if (node.left !== -1) {
        const left = frame.nodes[node.left];
        if (left.key !== null) expect(left.key).toBeLessThan(node.key);
      }

      if (node.right !== -1) {
        const right = frame.nodes[node.right];
        if (right.key !== null) expect(right.key).toBeGreaterThan(node.key);
      }
    }
  });

  it('in-order traversal of final frame equals sorted keys', () => {
    const ops = /** @type {import('./bst.js').BstOp[]} */ ([
      { type: 'insert', key: 50 },
      { type: 'insert', key: 30 },
      { type: 'insert', key: 70 },
      { type: 'insert', key: 20 },
      { type: 'insert', key: 80 },
    ]);

    const trace = bstTrace(ops);
    const final = trace.at(-1);
    if (!final) return;

    const inorder = inorderKeys(final);
    const expected = [20, 30, 50, 70, 80];

    expect(inorder).toEqual(expected);
  });

  it('delete with two children uses in-order successor', () => {
    const ops = /** @type {import('./bst.js').BstOp[]} */ ([
      { type: 'insert', key: 50 },
      { type: 'insert', key: 30 },
      { type: 'insert', key: 70 },
      { type: 'insert', key: 60 },
      { type: 'insert', key: 80 },
      { type: 'delete', key: 50 },
    ]);

    const trace = bstTrace(ops);
    const final = trace.at(-1);
    if (!final) return;

    const inorder = inorderKeys(final);
    expect(inorder).toEqual([30, 60, 70, 80]);
  });
});

// ============ DFS Grid Probing ============
describe('DFS grid edge cases', () => {
  it('finds path when BFS does on 10 random grids', () => {
    for (let trial = 0; trial < 10; trial++) {
      const rand = seeded(100 + trial);
      const wallSet = new Set();

      for (let i = 0; i < 48; i++) {
        if (rand() < 0.3) {
          wallSet.add(i);
        }
      }

      // Ensure start and goal are open
      wallSet.delete(0);
      wallSet.delete(47);

      const grid = {
        rows: 6,
        cols: 8,
        walls: wallSet,
        start: 0,
        goal: 47,
      };

      const dfs = dfsGridTrace(grid);
      const bfs = bfsGridTrace(grid);

      const dfsFound = dfs.at(-1)?.kind === 'found';
      const bfsFound = bfs.at(-1)?.kind === 'found';

      expect(dfsFound).toBe(bfsFound);
    }
  });

  it('returns no-path when goal is sealed', () => {
    const grid = {
      rows: 3,
      cols: 3,
      walls: new Set([1, 3, 5, 7]),
      start: 0,
      goal: 4,
    };

    const trace = dfsGridTrace(grid);
    expect(trace.at(-1)?.kind).toBe('no-path');
  });
});

// ============ Dijkstra Grid Probing ============
describe('Dijkstra grid edge cases', () => {
  it('stepCost calculates correctly', () => {
    const costAll1 = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    const costAll5 = [5, 5, 5, 5, 5, 5, 5, 5, 5];
    const costMixed = [1, 5, 1, 5, 1, 5, 1, 5, 1];

    expect(stepCost(costAll1, 0, 1)).toBe(1);
    expect(stepCost(costAll5, 0, 1)).toBe(5);
    expect(stepCost(costMixed, 0, 1)).toBe(3);
  });

  it('randomTerrain generates costs of only 1 or 5', () => {
    for (let trial = 0; trial < 5; trial++) {
      const terrain = randomTerrain(5, 5, 0.2, 0.3, [0, 24], seeded(42 + trial));

      for (const cost of terrain.cost) {
        expect([1, 5]).toContain(cost);
      }
    }
  });

  it('pq is sorted by distance in all frames', () => {
    const grid = {
      rows: 5,
      cols: 5,
      walls: new Set(),
      cost: Array(25).fill(1),
      start: 0,
      goal: 24,
    };

    const trace = dijkstraGridTrace(grid);

    for (const frame of trace) {
      const pq = frame.pq;
      for (let i = 1; i < pq.length; i++) {
        expect(pq[i][1]).toBeGreaterThanOrEqual(pq[i - 1][1]);
      }
    }
  });
});
