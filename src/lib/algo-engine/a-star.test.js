import { describe, expect, it } from 'vitest';
import { bfsGridTrace, neighbors, randomWalls } from './graph.js';
import { HEURISTICS, aStarPseudocode, aStarTrace, compareHeuristics, heuristic } from './a-star.js';

/** Deterministic LCG so wall layouts are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const ROWS = 10;
const COLS = 16;
const at = (/** @type {number} */ r, /** @type {number} */ c) => r * COLS + c;

/** The lesson's default grid: a bar along row 3 and a wall down column 9. */
function lessonGrid() {
  const walls = new Set();
  for (let c = 3; c <= 9; c++) walls.add(at(3, c));
  for (let r = 3; r <= 8; r++) walls.add(at(r, 9));
  return { rows: ROWS, cols: COLS, walls, start: at(4, 2), goal: at(4, 13) };
}

/** @param {ReturnType<typeof lessonGrid>} grid @param {import('./a-star.js').Heuristic} h */
const run = (grid, h) => aStarTrace({ ...grid, heuristic: h });

describe('heuristic', () => {
  it('is 0, the Manhattan distance, or three times it', () => {
    expect(heuristic('zero', at(0, 0), at(4, 13), COLS)).toBe(0);
    expect(heuristic('manhattan', at(0, 0), at(4, 13), COLS)).toBe(17);
    expect(heuristic('triple', at(0, 0), at(4, 13), COLS)).toBe(51);
    expect(heuristic('manhattan', at(4, 13), at(4, 13), COLS)).toBe(0);
  });
});

describe('aStarTrace', () => {
  it('finds a shortest path with h = 0 and with Manhattan, matching BFS', () => {
    const rand = seeded(7);
    for (let i = 0; i < 60; i++) {
      const walls = randomWalls(8, 10, 0.3, [0, 79], rand);
      const grid = { rows: 8, cols: 10, walls, start: 0, goal: 79 };
      const bfs = bfsGridTrace(grid).at(-1);
      for (const h of /** @type {const} */ (['zero', 'manhattan'])) {
        const last = aStarTrace({ ...grid, heuristic: h }).at(-1);
        expect(last?.kind).toBe(bfs?.kind === 'found' ? 'found' : 'no-path');
        expect(last?.path.length).toBe(bfs?.path.length);
      }
    }
  });

  it('never returns a path shorter than BFS, and always a valid one', () => {
    const rand = seeded(11);
    for (let i = 0; i < 40; i++) {
      const walls = randomWalls(8, 10, 0.3, [0, 79], rand);
      const grid = { rows: 8, cols: 10, walls, start: 0, goal: 79 };
      const best = bfsGridTrace(grid).at(-1)?.path.length ?? 0;
      const last = aStarTrace({ ...grid, heuristic: 'triple' }).at(-1);
      if (last?.kind !== 'found') continue;
      expect(last.path.length).toBeGreaterThanOrEqual(best);
      expect(last.path[0]).toBe(0);
      expect(last.path.at(-1)).toBe(79);
      for (let j = 1; j < last.path.length; j++) {
        expect(walls.has(last.path[j])).toBe(false);
        expect(neighbors(last.path[j - 1], 8, 10)).toContain(last.path[j]);
      }
    }
  });

  it('expands far fewer cells with Manhattan than with h = 0 on the lesson grid', () => {
    const cmp = compareHeuristics(lessonGrid());
    expect(cmp).toEqual({
      zero: { expanded: 118, steps: 15 },
      manhattan: { expanded: 36, steps: 15 },
      triple: { expanded: 39, steps: 21 },
    });
  });

  it('expands cells in non-decreasing f with a consistent heuristic', () => {
    for (const h of /** @type {const} */ (['zero', 'manhattan'])) {
      const grid = lessonGrid();
      const last = run(grid, h).at(-1);
      const fs = (last?.closed ?? []).map(
        (c) => (last?.g[c] ?? 0) + heuristic(h, c, grid.goal, COLS),
      );
      for (let i = 1; i < fs.length; i++) expect(fs[i]).toBeGreaterThanOrEqual(fs[i - 1]);
    }
  });

  it('keeps the open set ordered by f, then by h', () => {
    for (const f of run(lessonGrid(), 'manhattan')) {
      for (let i = 1; i < f.open.length; i++) {
        const [, g0, h0] = f.open[i - 1];
        const [, g1, h1] = f.open[i];
        expect(g0 + h0 < g1 + h1 || (g0 + h0 === g1 + h1 && h0 <= h1)).toBe(true);
      }
    }
  });

  it('counts pushes and closes the goal last', () => {
    const frames = run(lessonGrid(), 'manhattan');
    const last = frames.at(-1);
    expect(last?.kind).toBe('found');
    expect(last?.pushes).toBe(1 + frames.filter((f) => f.kind === 'push').length);
    expect(last?.closed.at(-1)).toBe(lessonGrid().goal);
  });

  it('starts at the goal and reports a sealed goal', () => {
    const grid = { ...lessonGrid(), goal: at(4, 2) };
    expect(run(grid, 'manhattan').at(-1)?.path).toEqual([at(4, 2)]);
    const sealed = lessonGrid();
    for (const c of [at(3, 13), at(5, 13), at(4, 12), at(4, 14)]) sealed.walls.add(c);
    const last = run(sealed, 'manhattan').at(-1);
    expect(last?.kind).toBe('no-path');
    expect(last?.path).toEqual([]);
  });

  it('stays under 400 frames for every heuristic on the lesson grid and an open grid', () => {
    for (const h of HEURISTICS) {
      expect(run(lessonGrid(), h).length).toBeLessThan(400);
      expect(run({ ...lessonGrid(), walls: new Set() }, h).length).toBeLessThan(400);
    }
  });

  it('frames do not alias', () => {
    const frames = run(lessonGrid(), 'manhattan');
    frames[3].g[0] = 99;
    frames[3].open.length = 0;
    frames[3].closed.push(99);
    expect(frames[4].g[0]).toBe(-1);
    expect(frames[4].open.length).toBeGreaterThan(0);
    expect(frames[4].closed).not.toContain(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const sealed = lessonGrid();
    for (const c of [at(3, 13), at(5, 13), at(4, 12), at(4, 14)]) sealed.walls.add(c);
    const frames = [
      ...run(lessonGrid(), 'zero'),
      ...run(lessonGrid(), 'triple'),
      ...run(sealed, 'manhattan'),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(aStarPseudocode.map((_, i) => i));
  });
});
