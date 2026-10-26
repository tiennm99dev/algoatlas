import { describe, expect, it } from 'vitest';
import {
  COLS,
  ROWS,
  bfsPseudocode,
  compareSearches,
  dfsPseudocode,
  gridNeighbours,
  traversalTrace,
} from './practice-graph-traversal.js';

/** Deterministic LCG so grids are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * Independent oracle: distances by repeated relaxation (Bellman-Ford style) until stable.
 * @param {number} rows @param {number} cols @param {Set<number>} walls @param {number[]} sources
 */
function oracleDistances(rows, cols, walls, sources) {
  const dist = new Array(rows * cols).fill(Infinity);
  for (const s of sources) if (!walls.has(s)) dist[s] = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (let c = 0; c < rows * cols; c++) {
      if (walls.has(c)) continue;
      for (const n of gridNeighbours(c, rows, cols)) {
        if (!walls.has(n) && dist[n] + 1 < dist[c]) {
          dist[c] = dist[n] + 1;
          changed = true;
        }
      }
    }
  }
  return dist.map((d) => (d === Infinity ? -1 : d));
}

/** @param {number} seed */
function randomPuzzle(seed) {
  const rand = seeded(seed);
  const rows = 5;
  const cols = 7;
  const walls = new Set();
  for (let c = 0; c < rows * cols; c++) if (rand() < 0.3) walls.add(c);
  const k = 1 + Math.floor(rand() * 3);
  /** @type {number[]} */
  const sources = [];
  for (let i = 0; i < k; i++) {
    const s = Math.floor(rand() * rows * cols);
    walls.delete(s);
    if (!sources.includes(s)) sources.push(s);
  }
  let goal = rand() < 0.5 ? -1 : Math.floor(rand() * rows * cols);
  if (sources.includes(goal)) goal = -1;
  walls.delete(goal);
  return { rows, cols, walls, sources, goal };
}

/** @param {string[]} map */
function parse(map) {
  const walls = new Set();
  /** @type {number[]} */
  const sources = [];
  let goal = -1;
  map.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      const i = r * row.length + c;
      if (ch === '#') walls.add(i);
      if (ch === 'S') sources.push(i);
      if (ch === 'G') goal = i;
    }),
  );
  return { rows: map.length, cols: map[0].length, walls, sources, goal };
}

const seeds = Array.from({ length: 80 }, (_, i) => i + 1);

describe('traversal trace', () => {
  it('BFS labels match the oracle distances when flooding', () => {
    for (const seed of seeds) {
      const p = { ...randomPuzzle(seed), goal: -1 };
      const last = traversalTrace({ ...p, algo: 'bfs' }).at(-1);
      expect(last?.label, `seed ${seed}`).toEqual(
        oracleDistances(p.rows, p.cols, p.walls, p.sources),
      );
    }
  });

  it('DFS reaches the same cells with labels never below the true distance', () => {
    for (const seed of seeds) {
      const p = { ...randomPuzzle(seed), goal: -1 };
      const last = traversalTrace({ ...p, algo: 'dfs' }).at(-1);
      const truth = oracleDistances(p.rows, p.cols, p.walls, p.sources);
      last?.label.forEach((d, i) => {
        expect(d === -1, `seed ${seed} cell ${i}`).toBe(truth[i] === -1);
        expect(d).toBeGreaterThanOrEqual(truth[i]);
      });
      expect(last?.visits).toBe(truth.filter((d) => d >= 0).length);
    }
  });

  it('both searches return a valid path, and the BFS one is shortest', () => {
    for (const seed of seeds) {
      const p = randomPuzzle(seed);
      if (p.goal < 0) continue;
      const truth = oracleDistances(p.rows, p.cols, p.walls, p.sources);
      for (const algo of /** @type {('bfs' | 'dfs')[]} */ (['bfs', 'dfs'])) {
        const last = traversalTrace({ ...p, algo }).at(-1);
        if (truth[p.goal] === -1) {
          expect(last?.kind).toBe('done');
          continue;
        }
        expect(last?.kind).toBe('found');
        const path = /** @type {number[]} */ (last?.path);
        expect(p.sources).toContain(path[0]);
        expect(path.at(-1)).toBe(p.goal);
        for (let i = 1; i < path.length; i++) {
          expect(gridNeighbours(path[i - 1], p.rows, p.cols)).toContain(path[i]);
          expect(p.walls.has(path[i])).toBe(false);
        }
        if (algo === 'bfs') expect(path.length - 1).toBe(truth[p.goal]);
        else expect(path.length - 1).toBeGreaterThanOrEqual(truth[p.goal]);
      }
    }
  });

  it('counts visits and path lengths on the open field', () => {
    const field = parse(['S...........', ...Array(6).fill('............'), 'G...........']);
    const c = compareSearches(field);
    expect(c.bfs).toEqual({ visits: 36, steps: 7 });
    expect(c.dfs).toEqual({ visits: 90, steps: 89 });
  });

  it('counts multi-source labels DFS gets wrong', () => {
    // Two sources at the ends of a corridor: BFS meets in the middle. DFS runs from the first
    // source all the way along, reaching the second source before its own copy is popped.
    const corridor = parse(['S.....S']);
    const c = compareSearches(corridor);
    expect(c.farthest).toBe(3);
    const dfs = traversalTrace({ ...corridor, algo: 'dfs' }).at(-1);
    expect(dfs?.label).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(c.wrong).toBe(3);
  });

  it('handles a lone source and a walled-in goal', () => {
    const lone = traversalTrace({ ...parse(['S']), algo: 'bfs' });
    expect(lone.map((f) => f.kind)).toEqual(['start', 'take', 'done']);
    const sealed = parse(['S.#G']);
    expect(traversalTrace({ ...sealed, algo: 'dfs' }).at(-1)?.kind).toBe('done');
  });

  it('stays under 400 frames on an open grid at full size', () => {
    for (const algo of /** @type {('bfs' | 'dfs')[]} */ (['bfs', 'dfs'])) {
      const frames = traversalTrace({
        rows: ROWS,
        cols: COLS,
        walls: new Set(),
        sources: [0, 11, 84, 95],
        goal: -1,
        algo,
      });
      expect(frames.length).toBeLessThan(400);
    }
  });

  it('does not alias frames', () => {
    for (const algo of /** @type {('bfs' | 'dfs')[]} */ (['bfs', 'dfs'])) {
      const frames = traversalTrace({ ...parse(['S..', '...']), algo });
      const before = JSON.stringify(frames[3]);
      frames[2].label[5] = 99;
      frames[2].frontier.push(99);
      expect(JSON.stringify(frames[3])).toBe(before);
    }
  });
});

describe('pseudocode coverage', () => {
  /** @param {import('./practice-graph-traversal.js').TraversalFrame[]} frames */
  const lines = (frames) => [...new Set(frames.flatMap((f) => f.lines))].sort((a, b) => a - b);
  const reach = parse(['S..', '..G']);
  const flood = { ...parse(['S..', '...']), goal: -1 };

  it('highlights every BFS line', () => {
    const frames = [
      ...traversalTrace({ ...reach, algo: 'bfs' }),
      ...traversalTrace({ ...flood, algo: 'bfs' }),
    ];
    expect(lines(frames)).toEqual(bfsPseudocode.map((_, i) => i));
  });

  it('highlights every DFS line', () => {
    const frames = [
      ...traversalTrace({ ...reach, algo: 'dfs' }),
      ...traversalTrace({ ...flood, algo: 'dfs' }),
    ];
    expect(lines(frames)).toEqual(dfsPseudocode.map((_, i) => i));
  });
});
