/**
 * BFS or DFS over a 4-connected grid from one or more sources, optionally stopping at a goal.
 * Cells are row-major indices (`r * cols + c`).
 *
 * - BFS starts with every source in the queue at distance 0 (multi-source BFS), marks a cell
 *   seen when it is enqueued, and so labels each cell with its distance to the nearest source.
 * - DFS starts with every source on the stack at depth 0, marks a cell visited when it is
 *   popped and skips stale copies; its label is the depth along the path DFS happened to take,
 *   which is often longer than the true distance.
 */

export const ROWS = 8;
export const COLS = 12;
/** Most sources the lesson allows at once. */
export const MAX_SOURCES = 4;

/**
 * @typedef {object} TraversalInput
 * @property {number} rows
 * @property {number} cols
 * @property {Set<number>} walls
 * @property {number[]} sources
 * @property {number} goal  -1 to explore every reachable cell.
 * @property {'bfs'|'dfs'} algo
 */

/**
 * @typedef {object} TraversalFrame
 * @property {'start'|'take'|'skip'|'add'|'found'|'done'} kind
 * @property {number} current   Cell taken from the frontier, -1 when none.
 * @property {number} touched   Neighbour just added, -1 when none.
 * @property {number[]} frontier Queue front first, or stack bottom first (duplicates possible).
 * @property {number[]} label   BFS distance or DFS depth per cell, -1 when not labelled yet.
 * @property {number} visits    Cells expanded so far.
 * @property {number} adds      Cells added to the frontier so far (sources included).
 * @property {number[]} path    Source → goal once the goal is reached, else [].
 * @property {number[]} lines
 */

export const bfsPseudocode = [
  'queue = every source; dist[source] = 0; mark the sources seen',
  'while queue is not empty:',
  '  cell = queue.dequeue()',
  '  if cell == goal: walk parents back; stop',
  '  for each neighbour n of cell (up, right, down, left):',
  '    if n is open and not seen:',
  '      mark n seen; dist[n] = dist[cell] + 1; parent[n] = cell; queue.enqueue(n)',
  'queue empty: every reachable cell has its distance',
];

export const dfsPseudocode = [
  'stack = every source, each at depth 0',
  'while stack is not empty:',
  '  (cell, depth, from) = stack.pop()',
  '  if cell is already visited: continue      // stale copy',
  '  visit cell; label[cell] = depth; parent[cell] = from',
  '  if cell == goal: walk parents back; stop',
  '  for each neighbour n of cell (left, down, right, up):',
  '    if n is open and not visited: stack.push((n, depth + 1, cell))',
  'stack empty: every reachable cell is visited',
];

/**
 * @param {number} cell @param {number} rows @param {number} cols
 * @returns {number[]} In up, right, down, left order.
 */
export function gridNeighbours(cell, rows, cols) {
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
 * @param {TraversalInput} input
 * @returns {TraversalFrame[]}
 */
export function traversalTrace(input) {
  return input.algo === 'bfs' ? bfs(input) : dfs(input);
}

/** @param {number[]} parent @param {number} goal */
function walkBack(parent, goal) {
  const path = [];
  for (let at = goal; at !== -1; at = parent[at]) path.push(at);
  return path.reverse();
}

/** @param {TraversalInput} input @returns {TraversalFrame[]} */
function bfs({ rows, cols, walls, sources, goal }) {
  const size = rows * cols;
  const label = new Array(size).fill(-1);
  const parent = new Array(size).fill(-1);
  /** @type {number[]} */
  const queue = [];
  let head = 0;
  let visits = 0;
  let adds = 0;
  for (const s of sources) {
    if (label[s] !== -1 || walls.has(s)) continue;
    label[s] = 0;
    queue.push(s);
    adds++;
  }
  /** @type {TraversalFrame[]} */
  const frames = [];
  /** @param {Pick<TraversalFrame, 'kind'|'current'|'touched'|'path'|'lines'>} f */
  const push = (f) =>
    frames.push({ ...f, frontier: queue.slice(head), label: label.slice(), visits, adds });

  push({ kind: 'start', current: -1, touched: -1, path: [], lines: [0] });
  while (head < queue.length) {
    const cell = queue[head++];
    visits++;
    push({ kind: 'take', current: cell, touched: -1, path: [], lines: [1, 2] });
    if (cell === goal) {
      push({ kind: 'found', current: cell, touched: -1, path: walkBack(parent, goal), lines: [3] });
      return frames;
    }
    for (const n of gridNeighbours(cell, rows, cols)) {
      if (walls.has(n) || label[n] !== -1) continue;
      label[n] = label[cell] + 1;
      parent[n] = cell;
      queue.push(n);
      adds++;
      push({ kind: 'add', current: cell, touched: n, path: [], lines: [4, 5, 6] });
    }
  }
  push({ kind: 'done', current: -1, touched: -1, path: [], lines: [1, 7] });
  return frames;
}

/** @param {TraversalInput} input @returns {TraversalFrame[]} */
function dfs({ rows, cols, walls, sources, goal }) {
  const size = rows * cols;
  const label = new Array(size).fill(-1);
  const parent = new Array(size).fill(-1);
  /** @type {{cell: number, depth: number, from: number}[]} */
  const stack = [];
  // Reversed so the first source ends on top and is explored first.
  for (const s of sources.toReversed()) {
    if (!walls.has(s)) stack.push({ cell: s, depth: 0, from: -1 });
  }
  let visits = 0;
  let adds = stack.length;

  /** @type {TraversalFrame[]} */
  const frames = [];
  /** @param {Pick<TraversalFrame, 'kind'|'current'|'touched'|'path'|'lines'>} f */
  const push = (f) =>
    frames.push({
      ...f,
      frontier: stack.map((e) => e.cell),
      label: label.slice(),
      visits,
      adds,
    });

  push({ kind: 'start', current: -1, touched: -1, path: [], lines: [0] });
  while (stack.length > 0) {
    const { cell, depth, from } = /** @type {{cell: number, depth: number, from: number}} */ (
      stack.pop()
    );
    if (label[cell] !== -1) {
      push({ kind: 'skip', current: cell, touched: -1, path: [], lines: [1, 2, 3] });
      continue;
    }
    label[cell] = depth;
    parent[cell] = from;
    visits++;
    push({ kind: 'take', current: cell, touched: -1, path: [], lines: [1, 2, 3, 4] });
    if (cell === goal) {
      push({ kind: 'found', current: cell, touched: -1, path: walkBack(parent, goal), lines: [5] });
      return frames;
    }
    // Reversed so "up" ends on top of the stack and is explored first.
    for (const n of gridNeighbours(cell, rows, cols).toReversed()) {
      if (walls.has(n) || label[n] !== -1) continue;
      stack.push({ cell: n, depth: depth + 1, from: cell });
      adds++;
      push({ kind: 'add', current: cell, touched: n, path: [], lines: [6, 7] });
    }
  }
  push({ kind: 'done', current: -1, touched: -1, path: [], lines: [1, 8] });
  return frames;
}

/**
 * Both searches on one puzzle, summarised for the comparison panel.
 * @param {Omit<TraversalInput, 'algo'>} input
 */
export function compareSearches(input) {
  const b = /** @type {TraversalFrame} */ (bfs({ ...input, algo: 'bfs' }).at(-1));
  const d = /** @type {TraversalFrame} */ (dfs({ ...input, algo: 'dfs' }).at(-1));
  // With no goal, DFS labels every reachable cell; count those above the true distance.
  let wrong = 0;
  let farthest = 0;
  for (let i = 0; i < b.label.length; i++) {
    if (b.label[i] > farthest) farthest = b.label[i];
    if (d.label[i] > b.label[i] && b.label[i] !== -1) wrong++;
  }
  return {
    bfs: { visits: b.visits, steps: b.path.length ? b.path.length - 1 : null },
    dfs: { visits: d.visits, steps: d.path.length ? d.path.length - 1 : null },
    farthest,
    wrong,
  };
}
