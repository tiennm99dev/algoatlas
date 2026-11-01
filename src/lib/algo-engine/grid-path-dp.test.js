import { describe, expect, it } from 'vitest';
import { en as copy } from '$lib/lessons/grid-path-dp/copy.en.js';
import {
  GRID_PRESETS,
  MAX_COST,
  MAX_SIDE,
  WALL,
  cycleCost,
  greedyCost,
  gridPseudocode,
  gridTrace,
  openPaths,
  parseSide,
  resizeGrid,
  toggleWall,
} from './grid-path-dp.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Every open right-and-down path, each as its total cost. @param {number[][]} grid */
function allPaths(grid) {
  /** @type {number[]} */
  const totals = [];
  const m = grid.length;
  const n = grid[0].length;
  /** @param {number} r @param {number} c @param {number} sum */
  const walk = (r, c, sum) => {
    if (r >= m || c >= n || grid[r][c] === WALL) return;
    const next = sum + grid[r][c];
    if (r === m - 1 && c === n - 1) {
      totals.push(next);
      return;
    }
    walk(r + 1, c, next);
    walk(r, c + 1, next);
  };
  walk(0, 0, 0);
  return totals;
}

/** @param {() => number} rand */
function randomGrid(rand) {
  const m = 1 + Math.floor(rand() * 5);
  const n = 1 + Math.floor(rand() * 5);
  return Array.from({ length: m }, () =>
    Array.from({ length: n }, () => (rand() < 0.2 ? WALL : 1 + Math.floor(rand() * MAX_COST))),
  );
}

const preset = (/** @type {string} */ key) =>
  /** @type {number[][]} */ (GRID_PRESETS.find((p) => p.key === key)?.grid);

describe('counting paths', () => {
  it('matches a walk over every path', () => {
    const rand = seeded(31);
    for (let t = 0; t < 80; t++) {
      const grid = randomGrid(rand);
      expect(gridTrace('count', grid).at(-1)?.result).toBe(allPaths(grid).length);
    }
  });

  it('gives the binomial coefficient on an open grid', () => {
    for (const [m, n] of [
      [1, 1],
      [1, 5],
      [3, 7],
      [4, 4],
      [MAX_SIDE, MAX_SIDE],
    ]) {
      const grid = Array.from({ length: m }, () => Array(n).fill(1));
      expect(gridTrace('count', grid).at(-1)?.result).toBe(openPaths(m, n));
    }
    expect(openPaths(3, 7)).toBe(28);
    expect(openPaths(MAX_SIDE, MAX_SIDE)).toBe(3432);
  });

  it('answers the examples', () => {
    expect(gridTrace('count', preset('pillar')).at(-1)?.result).toBe(2);
    expect(gridTrace('count', preset('open')).at(-1)?.result).toBe(28);
    const maze = gridTrace('count', preset('maze')).at(-1);
    expect(maze?.result).toBe(7);
    expect(maze?.table[3]).toEqual([1, 0, 2, 4, 7]);
  });

  it('fills a known table and counts the reads', () => {
    const last = gridTrace('count', [
      [1, 1],
      [1, WALL],
    ]).at(-1);
    expect(last?.table).toEqual([
      [1, 1],
      [1, 0],
    ]);
    expect(last?.result).toBe(0);
    expect(last?.filled).toBe(4);
    expect(last?.reads).toBe(2);
  });

  it('reads two neighbours inside the grid and one on its edges', () => {
    const grid = [
      [1, 1],
      [1, 1],
    ];
    const fills = gridTrace('count', grid).filter((f) => f.kind === 'fill');
    expect(fills.map((f) => f.options.map((o) => o.move))).toEqual([
      ['left'],
      ['up'],
      ['up', 'left'],
    ]);
  });

  it('has no paths when the start is a wall', () => {
    const frames = gridTrace('count', [
      [WALL, 1],
      [1, 1],
    ]);
    expect(frames[1].kind).toBe('wall');
    expect(frames.at(-1)?.result).toBe(0);
  });
});

describe('minimum path sum', () => {
  it('matches the cheapest of every path and rebuilds one of that cost', () => {
    const rand = seeded(32);
    for (let t = 0; t < 80; t++) {
      const grid = randomGrid(rand);
      const totals = allPaths(grid);
      const last = gridTrace('min', grid).at(-1);
      expect(last?.result).toBe(totals.length ? Math.min(...totals) : Infinity);
      if (!totals.length) {
        expect(last?.path).toEqual([]);
        continue;
      }
      const cells = last?.path ?? [];
      expect(cells[0]).toEqual([grid.length - 1, grid[0].length - 1]);
      expect(cells.at(-1)).toEqual([0, 0]);
      expect(cells).toHaveLength(grid.length + grid[0].length - 1);
      expect(cells.reduce((s, [r, c]) => s + grid[r][c], 0)).toBe(last?.result);
    }
  });

  it('answers the examples', () => {
    const last = gridTrace('min', preset('costs')).at(-1);
    expect(last?.result).toBe(7);
    expect(last?.table).toEqual([
      [1, 4, 5],
      [2, 7, 6],
      [6, 8, 7],
    ]);
  });

  it('beats the cheaper-next walk on the trap', () => {
    const grid = preset('trap');
    expect(gridTrace('min', grid).at(-1)?.result).toBe(9);
    expect(greedyCost(grid)).toBe(14);
  });

  it('never beats any walk, and is stuck only behind walls', () => {
    const rand = seeded(33);
    for (let t = 0; t < 60; t++) {
      const grid = randomGrid(rand);
      const walk = greedyCost(grid);
      if (walk === null) continue;
      expect(walk).toBeGreaterThanOrEqual(
        /** @type {number} */ (gridTrace('min', grid).at(-1)?.result),
      );
    }
    expect(
      greedyCost([
        [1, WALL],
        [WALL, 1],
      ]),
    ).toBeNull();
    expect(greedyCost([[WALL]])).toBeNull();
  });

  it('marks a cell behind walls as unreachable', () => {
    const frames = gridTrace('min', [
      [1, WALL],
      [WALL, 1],
    ]);
    expect(frames.at(-1)?.table[1][1]).toBe(Infinity);
    expect(frames.at(-1)?.result).toBe(Infinity);
    expect(frames.some((f) => f.kind === 'trace')).toBe(false);
  });

  it('keeps the cell above on a tie', () => {
    const fills = gridTrace('min', [
      [1, 1],
      [1, 1],
    ]).filter((f) => f.kind === 'fill');
    expect(fills.at(-1)?.move).toBe('up');
  });
});

describe('grid edits', () => {
  it('toggles a wall without changing the input', () => {
    const grid = preset('costs');
    const walled = toggleWall(grid, 1, 1);
    expect(walled[1][1]).toBe(WALL);
    expect(grid[1][1]).toBe(5);
    expect(toggleWall(walled, 1, 1)[1][1]).toBe(1);
  });

  it('cycles the cost and wraps', () => {
    expect(cycleCost([[1]], 0, 0)).toEqual([[2]]);
    expect(cycleCost([[MAX_COST]], 0, 0)).toEqual([[1]]);
    expect(cycleCost([[WALL]], 0, 0)).toEqual([[1]]);
  });

  it('resizes and keeps the overlap', () => {
    expect(resizeGrid([[3, WALL]], 2, 3)).toEqual([
      [3, WALL, 1],
      [1, 1, 1],
    ]);
    expect(resizeGrid(preset('costs'), 1, 2)).toEqual([[1, 3]]);
  });

  it('reads sides in range only', () => {
    expect(parseSide(' 4 ')).toBe(4);
    expect(parseSide('0')).toBeNull();
    expect(parseSide('')).toBeNull();
    expect(parseSide('2.5')).toBeNull();
    expect(parseSide(String(MAX_SIDE + 1))).toBeNull();
  });
});

describe('stored practice answers', () => {
  it('agree with the engine', () => {
    /** @param {number} k */
    const answer = (k) => /** @type {{answer: number}} */ (copy.practice[k]).answer;
    expect(gridTrace('count', preset('open')).at(-1)?.result).toBe(answer(0));
    expect(gridTrace('count', preset('pillar')).at(-1)?.result).toBe(answer(1));
    expect(gridTrace('count', preset('maze')).at(-1)?.result).toBe(answer(2));
    expect(gridTrace('min', preset('costs')).at(-1)?.result).toBe(answer(3));
    const trap = preset('trap');
    expect(
      /** @type {number} */ (greedyCost(trap)) -
        /** @type {number} */ (gridTrace('min', trap).at(-1)?.result),
    ).toBe(answer(4));
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const grid = preset('costs').map((r) => r.slice());
    const frames = gridTrace('min', grid);
    const before = JSON.stringify(frames[3]);
    frames[2].table[0][0] = 99;
    frames[2].grid[0][0] = 99;
    frames[2].lines.push(9);
    frames.at(-1)?.path.push([9, 9]);
    frames.at(-1)?.path[0].push(9);
    expect(JSON.stringify(frames[3])).toBe(before);
    expect(grid[0][0]).toBe(1);
    expect(frames.at(-2)?.path[0]).toHaveLength(2);
  });

  it('start and end with the named kinds', () => {
    const frames = gridTrace('count', [[1]]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'first', 'done']);
    expect(frames.at(-1)?.result).toBe(1);
  });

  it('stay under 400 frames at the cap', () => {
    const grid = Array.from({ length: MAX_SIDE }, () => Array(MAX_SIDE).fill(1));
    expect(gridTrace('min', grid).length).toBeLessThan(400);
  });
});

describe('pseudocode coverage', () => {
  it('count highlights every line', () => {
    const used = new Set(gridTrace('count', preset('maze')).flatMap((f) => f.lines));
    gridPseudocode.count.forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
  it('min highlights every line', () => {
    const used = new Set(gridTrace('min', preset('maze')).flatMap((f) => f.lines));
    gridPseudocode.min.forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
