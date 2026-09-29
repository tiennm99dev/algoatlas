/**
 * Breadth-first search over a 4-connected grid. Cells are row-major
 * indices (`r * cols + c`) so frames stay flat, cheap arrays.
 */

/**
 * @typedef {object} Grid
 * @property {number} rows
 * @property {number} cols
 * @property {Set<number>} walls
 * @property {number} start
 * @property {number} goal
 */

/**
 * @typedef {object} BfsFrame
 * @property {'start'|'dequeue'|'enqueue'|'found'|'no-path'} kind
 * @property {number} current   Cell being expanded, -1 when none.
 * @property {number} touched   Neighbor just enqueued, -1 when none.
 * @property {number[]} queue   Frontier, front first.
 * @property {number[]} dist    Distance from start per cell, -1 unvisited.
 * @property {number[]} path    Shortest path start→goal once found.
 * @property {number[]} lines
 */

export const bfsPseudocode = [
  'queue = [start]; visited = {start}',
  'while queue is not empty:',
  '  cell = queue.dequeue()',
  '  if cell == goal: walk parents back; stop',
  '  for each neighbor of cell (up, right, down, left):',
  '    if neighbor is open and not visited:',
  '      visited.add(neighbor); parent[neighbor] = cell; queue.enqueue(neighbor)',
  'no path — goal is walled off',
];

/**
 * @param {number} cell
 * @param {number} rows
 * @param {number} cols
 * @returns {number[]} In up, right, down, left order.
 */
export function neighbors(cell, rows, cols) {
  const r = Math.floor(cell / cols);
  const c = cell % cols;
  const out = [];
  if (r > 0) out.push(cell - cols);
  if (c < cols - 1) out.push(cell + 1);
  if (r < rows - 1) out.push(cell + cols);
  if (c > 0) out.push(cell - 1);
  return out;
}

/**
 * @param {Grid} grid
 * @returns {BfsFrame[]}
 */
export function bfsGridTrace({ rows, cols, walls, start, goal }) {
  const dist = new Array(rows * cols).fill(-1);
  const parent = new Array(rows * cols).fill(-1);
  /** @type {number[]} */
  const queue = [start];
  let head = 0;
  dist[start] = 0;

  /** @type {BfsFrame[]} */
  const frames = [];
  /** @param {Omit<BfsFrame, 'queue'|'dist'>} f */
  const push = (f) => frames.push({ ...f, queue: queue.slice(head), dist: dist.slice() });

  push({ kind: 'start', current: -1, touched: -1, path: [], lines: [0] });
  while (head < queue.length) {
    const cell = queue[head++];
    push({ kind: 'dequeue', current: cell, touched: -1, path: [], lines: [1, 2] });
    if (cell === goal) {
      const path = [];
      for (let at = goal; at !== -1; at = parent[at]) path.push(at);
      push({ kind: 'found', current: cell, touched: -1, path: path.reverse(), lines: [3] });
      return frames;
    }
    for (const next of neighbors(cell, rows, cols)) {
      if (walls.has(next) || dist[next] !== -1) continue;
      dist[next] = dist[cell] + 1;
      parent[next] = cell;
      queue.push(next);
      push({ kind: 'enqueue', current: cell, touched: next, path: [], lines: [4, 5, 6] });
    }
  }
  push({ kind: 'no-path', current: -1, touched: -1, path: [], lines: [1, 7] });
  return frames;
}

/**
 * Scatter walls at the given density, never covering the cells in `keep`.
 * @param {number} rows
 * @param {number} cols
 * @param {number} density 0..1
 * @param {number[]} keep
 * @param {() => number} [rand]
 * @returns {Set<number>}
 */
export function randomWalls(rows, cols, density, keep, rand = Math.random) {
  const walls = new Set();
  for (let cell = 0; cell < rows * cols; cell++) {
    if (!keep.includes(cell) && rand() < density) walls.add(cell);
  }
  return walls;
}
