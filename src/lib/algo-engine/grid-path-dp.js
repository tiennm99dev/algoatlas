/**
 * Step traces for dynamic programs over a grid, moving only right or down from the top-left
 * cell (0, 0) to the bottom-right cell (m − 1, n − 1). Cells are 0-based. A cell holds 0 for a
 * wall, or its cost from 1 to 9.
 *
 * - Counting: P[r][c] = number of paths reaching the cell. A wall holds 0, the start holds 1,
 *   and any other cell adds the cell above and the cell to its left.
 * - Minimum path sum: B[r][c] = cheapest total cost of a path to the cell, its own cost and the
 *   start's included. A wall holds ∞, and so does a cell no path reaches. The cell above wins
 *   a tie. Walking back along the smaller neighbour rebuilds one cheapest path.
 *
 * The table fills row by row, because each cell reads only cells above and to its left.
 */

/** @typedef {'count'|'min'} GridMode */
/** @typedef {'up'|'left'} GridMove */
/** @typedef {[number, number]} GridCell */

/**
 * @typedef {object} GridFrame
 * @property {'start'|'wall'|'first'|'fill'|'trace'|'done'} kind
 * @property {GridMode} mode
 * @property {number[][]} grid
 * @property {(number|null)[][]} table  null while not filled; Infinity is ∞.
 * @property {number} r  Current row, -1 for none.
 * @property {number} c  Current column, -1 for none.
 * @property {{move: GridMove, value: number}[]} options  fill: the neighbours read.
 * @property {GridMove|null} move  fill, min: the winner; trace: the step taken back.
 * @property {GridCell[]} path  Walk back: the cells visited so far, in order from the goal.
 * @property {number} filled  Cells filled so far.
 * @property {number} reads  Neighbour cells read so far.
 * @property {number|null} result  Paths, or the cheapest cost; Infinity when no path exists.
 * @property {number[]} lines
 */

export const WALL = 0;
export const MAX_SIDE = 8;
export const MAX_COST = 9;

/** @type {{key: string, grid: number[][]}[]} */
export const GRID_PRESETS = [
  {
    key: 'maze',
    grid: [
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 1, 1, 1],
    ],
  },
  {
    key: 'pillar',
    grid: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ],
  },
  {
    key: 'open',
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    key: 'costs',
    grid: [
      [1, 3, 1],
      [1, 5, 1],
      [4, 2, 1],
    ],
  },
  {
    key: 'trap',
    grid: [
      [1, 2, 9],
      [5, 9, 9],
      [1, 1, 1],
    ],
  },
];

/** @type {Record<GridMode, string[]>} */
export const gridPseudocode = {
  count: [
    'paths(grid[0..m-1][0..n-1]):',
    '  for r = 0 to m-1: for c = 0 to n-1:',
    '    if grid[r][c] is a wall: P[r][c] = 0',
    '    else if r == 0 and c == 0: P[0][0] = 1',
    '    else: P[r][c] = P[r-1][c] + P[r][c-1]   // off the grid counts 0',
    '  return P[m-1][n-1]',
  ],
  min: [
    'minCost(grid[0..m-1][0..n-1]):',
    '  for r = 0 to m-1: for c = 0 to n-1:',
    '    if grid[r][c] is a wall: B[r][c] = ∞',
    '    else if r == 0 and c == 0: B[0][0] = grid[0][0]',
    '    else: B[r][c] = grid[r][c] + min(B[r-1][c], B[r][c-1])   // off the grid is ∞',
    '  walk back from B[m-1][n-1] along the smaller neighbour',
    '  return B[m-1][n-1]',
  ],
};

/**
 * Reads a grid side, a whole number from 1 to MAX_SIDE.
 * @param {string} text
 * @returns {number|null}
 */
export function parseSide(text) {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n < 1 || n > MAX_SIDE ? null : n;
}

/**
 * The same grid at a new size: the overlap stays and new cells cost 1.
 * @param {number[][]} grid
 * @param {number} rows
 * @param {number} cols
 * @returns {number[][]}
 */
export function resizeGrid(grid, rows, cols) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => grid[r]?.[c] ?? 1),
  );
}

/**
 * A wall becomes an open cell of cost 1, and any open cell becomes a wall.
 * @param {number[][]} grid
 * @param {number} r
 * @param {number} c
 * @returns {number[][]}
 */
export function toggleWall(grid, r, c) {
  return grid.map((row, y) =>
    row.map((v, x) => (y === r && x === c ? (v === WALL ? 1 : WALL) : v)),
  );
}

/**
 * Raises a cell's cost by one, wrapping from MAX_COST to 1. A wall opens at cost 1.
 * @param {number[][]} grid
 * @param {number} r
 * @param {number} c
 * @returns {number[][]}
 */
export function cycleCost(grid, r, c) {
  return grid.map((row, y) =>
    row.map((v, x) => (y === r && x === c ? (v >= MAX_COST ? 1 : v + 1) : v)),
  );
}

/**
 * How many right-and-down paths an open grid has: C(m + n − 2, m − 1). Brute force would have
 * to walk every one of them.
 * @param {number} rows
 * @param {number} cols
 */
export function openPaths(rows, cols) {
  let result = 1;
  for (let k = 1; k <= rows - 1; k++) result = (result * (cols - 1 + k)) / k;
  return Math.round(result);
}

/**
 * The cost of always stepping to the cheaper of the next two open cells (down on a tie), or
 * null when that walk gets stuck against walls.
 * @param {number[][]} grid
 * @returns {number|null}
 */
export function greedyCost(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  if (grid[0][0] === WALL) return null;
  let [r, c] = [0, 0];
  let total = grid[0][0];
  while (r < rows - 1 || c < cols - 1) {
    const down = r + 1 < rows ? grid[r + 1][c] : WALL;
    const right = c + 1 < cols ? grid[r][c + 1] : WALL;
    if (down === WALL && right === WALL) return null;
    if (right === WALL || (down !== WALL && down <= right)) r++;
    else c++;
    total += grid[r][c];
  }
  return total;
}

/**
 * @param {GridMode} mode
 * @param {number[][]} grid
 * @returns {GridFrame[]}
 */
export function gridTrace(mode, grid) {
  const m = grid.length;
  const n = grid[0].length;
  const counting = mode === 'count';
  /** @type {(number|null)[][]} */
  const table = Array.from({ length: m }, () => Array(n).fill(null));
  /** @type {(GridMove|null)[][]} */
  const moves = Array.from({ length: m }, () => Array(n).fill(null));
  /** @type {GridFrame[]} */
  const frames = [];
  /** @type {GridCell[]} */
  const path = [];
  let filled = 0;
  let reads = 0;

  /** @param {Pick<GridFrame, 'kind'|'lines'> & Partial<GridFrame>} f */
  const push = (f) =>
    frames.push({
      r: -1,
      c: -1,
      move: null,
      result: null,
      ...f,
      options: (f.options ?? []).map((o) => ({ ...o })),
      lines: f.lines.slice(),
      mode,
      grid: grid.map((row) => row.slice()),
      table: table.map((row) => row.slice()),
      path: path.map((p) => /** @type {GridCell} */ ([p[0], p[1]])),
      filled,
      reads,
    });

  push({ kind: 'start', lines: [0] });

  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++) {
      filled++;
      if (grid[r][c] === WALL) {
        table[r][c] = counting ? 0 : Infinity;
        push({ kind: 'wall', lines: [1, 2], r, c });
        continue;
      }
      if (r === 0 && c === 0) {
        table[r][c] = counting ? 1 : grid[r][c];
        push({ kind: 'first', lines: [1, 3], r, c });
        continue;
      }
      /** @type {{move: GridMove, value: number}[]} */
      const options = [];
      if (r > 0) options.push({ move: 'up', value: /** @type {number} */ (table[r - 1][c]) });
      if (c > 0) options.push({ move: 'left', value: /** @type {number} */ (table[r][c - 1]) });
      reads += options.length;
      let move = null;
      if (counting) {
        table[r][c] = options.reduce((s, o) => s + o.value, 0);
      } else {
        const best = options.reduce((a, b) => (b.value < a.value ? b : a));
        table[r][c] = best.value === Infinity ? Infinity : grid[r][c] + best.value;
        move = best.value === Infinity ? null : best.move;
      }
      moves[r][c] = move;
      push({ kind: 'fill', lines: [1, 4], r, c, options, move });
    }

  const result = /** @type {number} */ (table[m - 1][n - 1]);
  if (!counting && result !== Infinity) {
    let [r, c] = [m - 1, n - 1];
    path.push([r, c]);
    while (r > 0 || c > 0) {
      const move = /** @type {GridMove} */ (moves[r][c]);
      const [fr, fc] = [r, c];
      if (move === 'up') r--;
      else c--;
      path.push([r, c]);
      push({ kind: 'trace', lines: [5], r: fr, c: fc, move });
    }
  }

  push({ kind: 'done', lines: counting ? [5] : [5, 6], result });
  return frames;
}
