import { describe, expect, it } from 'vitest';
import { bfsGridTrace, neighbors } from './graph.js';
import {
  MUD_COST,
  dijkstraGridTrace,
  dijkstraPseudocode,
  pathCost,
  randomTerrain,
  stepCost,
} from './dijkstra-grid.js';

/** Deterministic LCG so terrains are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const ROWS = 10;
const COLS = 16;
const at = (/** @type {number} */ r, /** @type {number} */ c) => r * COLS + c;

/** The default lesson terrain: a mud band between start and goal. */
function bandGrid() {
  const cost = new Array(ROWS * COLS).fill(1);
  for (let r = 2; r <= 7; r++) for (let c = 6; c <= 9; c++) cost[at(r, c)] = MUD_COST;
  return { rows: ROWS, cols: COLS, walls: new Set(), start: at(4, 2), goal: at(4, 13), cost };
}

/** A grid whose goal is walled in on all four sides. */
function sealedGrid() {
  const grid = bandGrid();
  grid.walls = new Set([at(3, 13), at(5, 13), at(4, 12), at(4, 14)]);
  return grid;
}

/** @param {import('./dijkstra-grid.js').WeightedGrid} g Reference shortest cost by relaxing every edge. */
function bellmanFord(g) {
  const size = g.rows * g.cols;
  const dist = new Array(size).fill(Infinity);
  dist[g.start] = 0;
  for (let pass = 0; pass < size; pass++) {
    let changed = false;
    for (let a = 0; a < size; a++) {
      if (g.walls.has(a) || dist[a] === Infinity) continue;
      for (const b of neighbors(a, g.rows, g.cols)) {
        if (g.walls.has(b)) continue;
        const nd = dist[a] + stepCost(g.cost, a, b);
        if (nd < dist[b]) {
          dist[b] = nd;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return dist[g.goal];
}

describe('stepCost and pathCost', () => {
  it('averages the two cells', () => {
    const cost = [1, 5, 5];
    expect(stepCost(cost, 0, 0)).toBe(1);
    expect(stepCost(cost, 0, 1)).toBe(3);
    expect(stepCost(cost, 1, 2)).toBe(5);
  });

  it('sums steps and is 0 for a single cell', () => {
    expect(pathCost([0], [1])).toBe(0);
    expect(pathCost([0, 1, 2], [1, 5, 5])).toBe(8);
  });
});

describe('dijkstraGridTrace', () => {
  it('matches a Bellman-Ford reference on random terrain', () => {
    const rand = seeded(7);
    for (let i = 0; i < 50; i++) {
      const start = 0;
      const goal = 47;
      const { walls, cost } = randomTerrain(6, 8, 0.2, 0.35, [start, goal], rand);
      const grid = { rows: 6, cols: 8, walls, start, goal, cost };
      const last = dijkstraGridTrace(grid).at(-1);
      const expected = bellmanFord(grid);
      if (expected === Infinity) expect(last?.kind).toBe('no-path');
      else {
        expect(last?.kind).toBe('found');
        expect(pathCost(last?.path ?? [], cost)).toBe(expected);
        expect(last?.dist[goal]).toBe(expected);
      }
    }
  });

  it('costs the BFS step count when every cell is open', () => {
    const rand = seeded(3);
    for (let i = 0; i < 10; i++) {
      const { walls } = randomTerrain(6, 8, 0.2, 0, [0, 47], rand);
      const grid = { rows: 6, cols: 8, walls, start: 0, goal: 47, cost: new Array(48).fill(1) };
      const d = dijkstraGridTrace(grid).at(-1);
      const b = bfsGridTrace(grid).at(-1);
      expect(d?.kind).toBe(b?.kind);
      if (d?.kind === 'found') expect(pathCost(d.path, grid.cost)).toBe((b?.path.length ?? 0) - 1);
    }
  });

  it('prefers a long detour to a short trip through mud on the band grid', () => {
    const grid = bandGrid();
    const last = dijkstraGridTrace(grid).at(-1);
    expect(pathCost(last?.path ?? [], grid.cost)).toBe(17);
    expect(last?.path.length).toBe(18);
    const bfsPath = bfsGridTrace(grid).at(-1)?.path ?? [];
    expect(bfsPath.length).toBe(12);
    expect(pathCost(bfsPath, grid.cost)).toBe(27);
  });

  it('finds a cheaper route to the goal after first pushing it', () => {
    // 0 1 2   mud at 1: straight across costs 6, the detour below costs 4.
    // 3 4 5
    // 6 7 8
    const cost = [1, 5, 1, 1, 1, 1, 1, 1, 1];
    const frames = dijkstraGridTrace({
      rows: 3,
      cols: 3,
      walls: new Set(),
      start: 0,
      goal: 2,
      cost,
    });
    const firstPush = frames.find((f) => f.kind === 'relax' && f.touched === 2);
    expect(firstPush?.dist[2]).toBe(6);
    const found = frames.findIndex((f) => f.kind === 'found');
    const better = frames.findIndex((f) => f.kind === 'relax' && f.touched === 2 && f.improved);
    expect(better).toBeGreaterThan(-1);
    expect(better).toBeLessThan(found);
    expect(frames[found].popped).toBe(4);
    expect(frames[found].path).toEqual([0, 3, 4, 5, 2]);
  });

  it('produces stale entries on the band grid', () => {
    expect(dijkstraGridTrace(bandGrid()).some((f) => f.kind === 'stale')).toBe(true);
  });

  it('returns contiguous, wall-free paths', () => {
    const rand = seeded(11);
    for (let i = 0; i < 20; i++) {
      const { walls, cost } = randomTerrain(6, 8, 0.25, 0.3, [0, 47], rand);
      const last = dijkstraGridTrace({ rows: 6, cols: 8, walls, start: 0, goal: 47, cost }).at(-1);
      if (last?.kind !== 'found') continue;
      expect(last.path[0]).toBe(0);
      expect(last.path.at(-1)).toBe(47);
      for (let j = 0; j < last.path.length; j++) {
        expect(walls.has(last.path[j])).toBe(false);
        if (j) expect(neighbors(last.path[j - 1], 6, 8)).toContain(last.path[j]);
      }
    }
  });

  it('reports no path when the goal is sealed off', () => {
    const last = dijkstraGridTrace(sealedGrid()).at(-1);
    expect(last?.kind).toBe('no-path');
    expect(last?.path).toEqual([]);
  });

  it('never changes the dist of a settled cell', () => {
    const frames = dijkstraGridTrace(bandGrid());
    for (let i = 1; i < frames.length; i++) {
      for (const cell of frames[i - 1].settled) {
        expect(frames[i].dist[cell]).toBe(frames[i - 1].dist[cell]);
      }
    }
  });

  it('keeps the queue sorted by cost in every frame', () => {
    for (const f of dijkstraGridTrace(bandGrid())) {
      for (let i = 1; i < f.pq.length; i++)
        expect(f.pq[i][1]).toBeGreaterThanOrEqual(f.pq[i - 1][1]);
    }
  });

  it('tracks running relaxation and queue-size totals', () => {
    const frames = dijkstraGridTrace(bandGrid());
    const last = frames.at(-1);
    expect(last?.relaxations).toBe(frames.filter((f) => f.kind === 'relax').length);
    expect(last?.maxQueue).toBe(Math.max(...frames.map((f) => f.pq.length)));
  });

  it('does not alias arrays between frames', () => {
    const frames = dijkstraGridTrace(bandGrid());
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i].dist).not.toBe(frames[i - 1].dist);
      expect(frames[i].settled).not.toBe(frames[i - 1].settled);
      expect(frames[i].pq).not.toBe(frames[i - 1].pq);
    }
    expect(frames[0].dist[bandGrid().start]).toBe(0);
    expect(frames[0].settled).toEqual([]);
    expect(frames[0].pq).toEqual([[bandGrid().start, 0]]);
  });
});

describe('randomTerrain', () => {
  it('uses only costs 1 and 5 and keeps the given cells open', () => {
    const rand = seeded(5);
    for (let i = 0; i < 20; i++) {
      const { walls, cost } = randomTerrain(6, 8, 0.4, 0.5, [0, 47], rand);
      expect(cost).toHaveLength(48);
      expect(cost.every((c) => c === 1 || c === MUD_COST)).toBe(true);
      for (const k of [0, 47]) {
        expect(walls.has(k)).toBe(false);
        expect(cost[k]).toBe(1);
      }
      for (const w of walls) expect(cost[w]).toBe(1);
    }
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [...dijkstraGridTrace(bandGrid()), ...dijkstraGridTrace(sealedGrid())];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(dijkstraPseudocode.map((_, i) => i));
  });
});

describe('trace size', () => {
  it('stays within a few hundred frames on the default and a dense terrain', () => {
    const band = dijkstraGridTrace(bandGrid());
    const { walls, cost } = randomTerrain(ROWS, COLS, 0.1, 0.5, [at(4, 2), at(4, 13)], seeded(9));
    const dense = dijkstraGridTrace({
      rows: ROWS,
      cols: COLS,
      walls,
      start: at(4, 2),
      goal: at(4, 13),
      cost,
    });
    console.info(`trace length: default ${band.length}, dense ${dense.length}`);
    expect(band.length).toBeLessThan(700);
    expect(dense.length).toBeLessThan(700);
  });
});
