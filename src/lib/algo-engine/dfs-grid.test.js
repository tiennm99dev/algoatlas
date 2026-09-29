import { describe, expect, it } from 'vitest';
import { bfsGridTrace, neighbors, randomWalls } from './graph.js';
import { dfsGridTrace, dfsPseudocode } from './dfs-grid.js';

/** Deterministic LCG so grids are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} rows @param {number} cols @param {number[]} walls @param {number} start @param {number} goal */
const grid = (rows, cols, walls, start, goal) => ({
  rows,
  cols,
  walls: new Set(walls),
  start,
  goal,
});

/** @param {number} seed */
function randomGrid(seed) {
  const rand = seeded(seed);
  const start = 0;
  const goal = 6 * 8 - 1;
  return grid(6, 8, [...randomWalls(6, 8, 0.3, [start, goal], rand)], start, goal);
}

const seeds = Array.from({ length: 50 }, (_, i) => i + 1);

describe('dfs grid trace', () => {
  it('finds a path exactly when BFS does', () => {
    for (const seed of seeds) {
      const g = randomGrid(seed);
      const dfs = dfsGridTrace(g).at(-1);
      const bfs = bfsGridTrace(g).at(-1);
      expect(dfs?.kind === 'found', `seed ${seed}`).toBe(bfs?.kind === 'found');
    }
  });

  it('returns contiguous paths that avoid walls and join start to goal', () => {
    for (const seed of seeds) {
      const g = randomGrid(seed);
      const last = dfsGridTrace(g).at(-1);
      if (last?.kind !== 'found') continue;
      const { path } = last;
      expect(path[0]).toBe(g.start);
      expect(path.at(-1)).toBe(g.goal);
      for (const cell of path) expect(g.walls.has(cell)).toBe(false);
      for (let i = 1; i < path.length; i++) {
        expect(neighbors(path[i - 1], g.rows, g.cols)).toContain(path[i]);
      }
    }
  });

  it('never beats the BFS shortest path', () => {
    for (const seed of seeds) {
      const g = randomGrid(seed);
      const dfs = dfsGridTrace(g).at(-1);
      const bfs = bfsGridTrace(g).at(-1);
      if (dfs?.kind !== 'found' || bfs?.kind !== 'found') continue;
      expect(dfs.path.length).toBeGreaterThanOrEqual(bfs.path.length);
    }
  });

  it('matches BFS on a 1xN corridor', () => {
    const g = grid(1, 9, [], 0, 8);
    expect(dfsGridTrace(g).at(-1)?.path).toEqual(bfsGridTrace(g).at(-1)?.path);
  });

  it('handles start equal to goal', () => {
    const frames = dfsGridTrace(grid(3, 3, [], 4, 4));
    expect(frames.map((f) => f.kind)).toEqual(['start', 'pop', 'found']);
    expect(frames.at(-1)?.path).toEqual([4]);
  });

  it('ends with no-path when the goal is sealed', () => {
    const frames = dfsGridTrace(grid(3, 3, [5, 7], 0, 8));
    expect(frames.at(-1)?.kind).toBe('no-path');
    expect(frames.at(-1)?.stack).toEqual([]);
  });

  it('numbers visits uniquely from 1 in pop order', () => {
    for (const seed of seeds) {
      const frames = dfsGridTrace(randomGrid(seed));
      const last = /** @type {import('./dfs-grid.js').DfsFrame} */ (frames.at(-1));
      const numbers = last.order.filter((n) => n >= 1).sort((a, b) => a - b);
      expect(numbers).toEqual(Array.from({ length: last.visited }, (_, i) => i + 1));
      const popped = frames.filter((f) => f.kind === 'pop').map((f) => last.order[f.current]);
      expect(popped).toEqual(Array.from({ length: last.visited }, (_, i) => i + 1));
    }
  });

  it('leaves an empty stack whenever the goal is not found', () => {
    for (const seed of seeds) {
      const last = dfsGridTrace(randomGrid(seed)).at(-1);
      if (last?.kind !== 'found') expect(last?.stack).toEqual([]);
    }
  });

  it('pops "up" first from the center of an open 3x3 grid', () => {
    const frames = dfsGridTrace(grid(3, 3, [], 4, 8));
    const pops = frames.filter((f) => f.kind === 'pop');
    expect(pops[1].current).toBe(1);
  });

  it('shows a skipped stale copy when the goal is sealed', () => {
    const frames = dfsGridTrace(grid(3, 3, [5, 7], 0, 8));
    expect(frames.filter((f) => f.kind === 'skip')).toHaveLength(1);
  });

  it('does not alias frames', () => {
    const frames = dfsGridTrace(grid(3, 3, [], 4, 8));
    const before = frames[3].stack.slice();
    frames[2].stack.push(99);
    frames[2].order[0] = 99;
    expect(frames[3].stack).toEqual(before);
    expect(frames[3].order[0]).not.toBe(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [
      ...dfsGridTrace(grid(3, 3, [5, 7], 0, 8)),
      ...dfsGridTrace(grid(3, 3, [], 0, 8)),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(dfsPseudocode.map((_, i) => i));
  });
});
