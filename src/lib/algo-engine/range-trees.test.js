import { describe, expect, it } from 'vitest';
import {
  GRID,
  MAX_POINTS,
  RANGE_PRESETS,
  buildRangeTree,
  inRect,
  randomPoints,
  rangeTreePseudocode,
  rangeTreeTrace,
} from './range-trees.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {import('./range-trees.js').RangeFrame[]} frames */
const found = (frames) =>
  /** @type {import('./range-trees.js').RangeFrame} */ (frames.at(-1)).reported.toSorted(
    (a, b) => a - b,
  );

/** @param {import('./range-trees.js').RangePoint[]} points @param {import('./range-trees.js').RangeQuery} q */
const oracle = (points, q) =>
  inRect(points, q)
    .map((p) => p.id)
    .sort((a, b) => a - b);

/** @param {() => number} rand */
function randomQuery(rand) {
  const xs = [Math.floor(rand() * (GRID.xMax + 1)), Math.floor(rand() * (GRID.xMax + 1))];
  const ys = [Math.floor(rand() * (GRID.yMax + 1)), Math.floor(rand() * (GRID.yMax + 1))];
  return {
    x1: Math.min(...xs),
    x2: Math.max(...xs),
    y1: Math.min(...ys),
    y2: Math.max(...ys),
  };
}

describe('range tree build', () => {
  it('keeps x order in the tree and every subtree’s points in each y-list', () => {
    const points = RANGE_PRESETS.scatter.points;
    const { root, nodes } = buildRangeTree(points);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(nodes).toHaveLength(points.length);
    /** @param {number | null} id @returns {number[]} */
    const inorder = (id) => {
      if (id === null) return [];
      const n = /** @type {import('./range-trees.js').RangeNode} */ (byId.get(id));
      return [...inorder(n.left), id, ...inorder(n.right)];
    };
    const xs = inorder(root).map((id) => points[id].x);
    expect(xs).toEqual(xs.toSorted((a, b) => a - b));
    for (const n of nodes) {
      const sub = inorder(n.id);
      expect(n.ys.toSorted((a, b) => a - b)).toEqual(sub.toSorted((a, b) => a - b));
      const ys = n.ys.map((id) => points[id].y);
      expect(ys).toEqual(ys.toSorted((a, b) => a - b));
    }
  });

  it('is balanced: depth ⌊log₂ n⌋ + 1 at the cap', () => {
    const points = randomPoints(MAX_POINTS, seeded(4));
    const { root, nodes } = buildRangeTree(points);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    /** @param {number | null} id @returns {number} */
    const depth = (id) => {
      if (id === null) return 0;
      const n = /** @type {import('./range-trees.js').RangeNode} */ (byId.get(id));
      return 1 + Math.max(depth(n.left), depth(n.right));
    };
    expect(depth(root)).toBe(4);
  });

  it('builds nothing from no points', () => {
    expect(buildRangeTree([])).toEqual({ root: null, nodes: [] });
  });
});

describe('range tree query', () => {
  it.each(Object.entries(RANGE_PRESETS))('finds the brute-force answer on %s', (_, preset) => {
    expect(found(rangeTreeTrace(preset.points, preset.query))).toEqual(
      oracle(preset.points, preset.query),
    );
  });

  it('matches brute force on random points and rectangles', () => {
    const rand = seeded(11);
    for (let t = 0; t < 300; t++) {
      const points = randomPoints(1 + Math.floor(rand() * MAX_POINTS), rand);
      const q = randomQuery(rand);
      const frames = rangeTreeTrace(points, q);
      const last = /** @type {import('./range-trees.js').RangeFrame} */ (frames.at(-1));
      expect(found(frames)).toEqual(oracle(points, q));
      expect(new Set(last.reported).size).toBe(last.reported.length);
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('handles many points with the same x', () => {
    const { points, query } = RANGE_PRESETS.column;
    expect(found(rangeTreeTrace(points, query))).toEqual([1, 2]);
    expect(found(rangeTreeTrace(points, { x1: 6, x2: 6, y1: 0, y2: 8 }))).toEqual([0, 1, 2, 3, 4]);
  });

  it('ends at a null split node when no x fits', () => {
    const { points, query } = RANGE_PRESETS.empty;
    const frames = rangeTreeTrace(points, query);
    expect(frames.map((f) => f.kind)).toContain('none');
    expect(found(frames)).toEqual([]);
  });

  it('answers on no points and one point', () => {
    const all = { x1: 0, x2: GRID.xMax, y1: 0, y2: GRID.yMax };
    expect(found(rangeTreeTrace([], all))).toEqual([]);
    expect(found(rangeTreeTrace([{ id: 0, x: 3, y: 3 }], all))).toEqual([0]);
    expect(found(rangeTreeTrace([{ id: 0, x: 3, y: 3 }], { ...all, y2: 2 }))).toEqual([]);
  });

  it('starts and ends with start and done', () => {
    const frames = rangeTreeTrace(RANGE_PRESETS.scatter.points, RANGE_PRESETS.scatter.query);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });
});

describe('range tree costs', () => {
  it('counts storage as the sum of the y-list lengths', () => {
    // Nine points on the diagonal: depths 1, 2, 2, 3, 3, 3, 3, 4, 4 sum to 25.
    const frames = rangeTreeTrace(RANGE_PRESETS.diagonal.points, RANGE_PRESETS.diagonal.query);
    expect(frames[0].storage).toBe(25);
  });

  it('a query covering everything walks the outermost paths', () => {
    const points = RANGE_PRESETS.scatter.points;
    const frames = rangeTreeTrace(points, { x1: 0, x2: 12, y1: 0, y2: 8 });
    const last = /** @type {import('./range-trees.js').RangeFrame} */ (frames.at(-1));
    // The root splits at once. Each path runs down to the outermost leaf and takes every
    // inner subtree hanging off it whole: here two on each side.
    expect(last.split).toBe(frames[1].root);
    expect(last.searches).toBe(4);
    expect(last.canonical).toHaveLength(4);
    expect(last.reported).toHaveLength(points.length);
  });

  it('visits at most two root-to-leaf paths', () => {
    const rand = seeded(5);
    for (let t = 0; t < 100; t++) {
      const points = randomPoints(MAX_POINTS, rand);
      const last = /** @type {import('./range-trees.js').RangeFrame} */ (
        rangeTreeTrace(points, randomQuery(rand)).at(-1)
      );
      expect(last.visited.length).toBeLessThanOrEqual(2 * 4);
      expect(last.searches).toBeLessThanOrEqual(2 * 3);
    }
  });
});

describe('range tree frames', () => {
  it('do not alias each other', () => {
    const frames = rangeTreeTrace(RANGE_PRESETS.scatter.points, RANGE_PRESETS.scatter.query);
    const a = frames[3];
    const b = frames[4];
    a.reported.push(99);
    a.visited.push(99);
    a.nodes[0].ys.push(99);
    a.points[0].x = 99;
    expect(b.reported).not.toContain(99);
    expect(b.visited).not.toContain(99);
    expect(b.nodes[0].ys).not.toContain(99);
    expect(b.points[0].x).not.toBe(99);
  });

  it('show the search window over the subtree’s y-list', () => {
    const frames = rangeTreeTrace(RANGE_PRESETS.scatter.points, RANGE_PRESETS.scatter.query);
    const s = frames.find((f) => f.kind === 'search');
    expect(s?.search).not.toBeNull();
    const search = /** @type {import('./range-trees.js').RangeSearch} */ (s?.search);
    const ys = search.list.map((id) => RANGE_PRESETS.scatter.points[id].y);
    const { y1, y2 } = RANGE_PRESETS.scatter.query;
    expect(ys.slice(search.lo, search.hi).every((y) => y1 <= y && y <= y2)).toBe(true);
    expect(ys.slice(0, search.lo).every((y) => y < y1)).toBe(true);
    expect(ys.slice(search.hi).every((y) => y > y2)).toBe(true);
  });
});

describe('random points', () => {
  it('are distinct, on the grid and capped', () => {
    const points = randomPoints(40, seeded(2));
    expect(points).toHaveLength(MAX_POINTS);
    expect(new Set(points.map((p) => `${p.x},${p.y}`)).size).toBe(MAX_POINTS);
    expect(points.every((p) => p.x <= GRID.xMax && p.y <= GRID.yMax)).toBe(true);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line over a found and an empty query', () => {
    const frames = [
      ...rangeTreeTrace(RANGE_PRESETS.scatter.points, RANGE_PRESETS.scatter.query),
      ...rangeTreeTrace(RANGE_PRESETS.empty.points, RANGE_PRESETS.empty.query),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(rangeTreePseudocode.map((_, i) => i));
  });
});
