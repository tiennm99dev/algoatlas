import { describe, expect, it } from 'vitest';
import { bfsGridTrace, neighbors, randomWalls } from './graph.js';

describe('neighbors', () => {
  it('stays inside the grid', () => {
    expect(neighbors(0, 3, 3)).toEqual([1, 3]);
    expect(neighbors(4, 3, 3)).toEqual([1, 5, 7, 3]);
    expect(neighbors(8, 3, 3)).toEqual([5, 7]);
  });

  it('does not wrap across row edges', () => {
    expect(neighbors(2, 3, 3)).not.toContain(3);
    expect(neighbors(3, 3, 3)).not.toContain(2);
  });
});

describe('bfsGridTrace', () => {
  it('finds a Manhattan-length path on an open grid', () => {
    const last = bfsGridTrace({ rows: 5, cols: 5, walls: new Set(), start: 0, goal: 24 }).at(-1);
    expect(last?.kind).toBe('found');
    expect(last?.path).toHaveLength(9);
    expect(last?.path[0]).toBe(0);
    expect(last?.path.at(-1)).toBe(24);
  });

  it('routes around walls with a shortest, contiguous path', () => {
    // 0 1 2
    // # # 5
    // 6 7 8   goal 6 must go 0→1→2→5→8→7→6
    const walls = new Set([3, 4]);
    const last = bfsGridTrace({ rows: 3, cols: 3, walls, start: 0, goal: 6 }).at(-1);
    expect(last?.path).toEqual([0, 1, 2, 5, 8, 7, 6]);
    for (let i = 1; i < (last?.path.length ?? 0); i++) {
      expect(neighbors(last?.path[i - 1] ?? -1, 3, 3)).toContain(last?.path[i]);
    }
  });

  it('reports no path when the goal is sealed off', () => {
    const walls = new Set([1, 3]);
    const last = bfsGridTrace({ rows: 2, cols: 2, walls, start: 0, goal: 3 }).at(-1);
    expect(last?.kind).toBe('no-path');
  });

  it('visits cells in non-decreasing distance order', () => {
    const frames = bfsGridTrace({ rows: 6, cols: 6, walls: new Set([7, 8, 9]), start: 0, goal: 35 });
    const order = frames.filter((f) => f.kind === 'dequeue').map((f) => f.dist[f.current]);
    expect(order.every((d, i) => i === 0 || order[i - 1] <= d)).toBe(true);
  });

  it('treats start == goal as found immediately', () => {
    const last = bfsGridTrace({ rows: 2, cols: 2, walls: new Set(), start: 1, goal: 1 }).at(-1);
    expect(last?.path).toEqual([1]);
  });
});

describe('randomWalls', () => {
  it('never walls the kept cells', () => {
    const walls = randomWalls(4, 4, 1, [0, 15]);
    expect(walls.has(0)).toBe(false);
    expect(walls.has(15)).toBe(false);
    expect(walls.size).toBe(14);
  });

  it('density 0 leaves the grid open', () => {
    expect(randomWalls(4, 4, 0, []).size).toBe(0);
  });
});
