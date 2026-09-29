/**
 * Iterative depth-first search over the same 4-connected grid as BFS. Each stack
 * entry remembers which cell pushed it, and a cell is only marked visited when it
 * is popped, so stale duplicates are skipped and parent links stay correct.
 */
import { neighbors } from './graph.js';

/** @typedef {import('./graph.js').Grid} Grid */

/**
 * @typedef {object} DfsFrame
 * @property {'start'|'pop'|'push'|'skip'|'found'|'no-path'} kind
 * @property {number} current   Cell just popped, -1 when none.
 * @property {number} touched   Neighbor just pushed, -1 when none.
 * @property {number[]} stack   Cells on the stack, top last (duplicates possible).
 * @property {number[]} order   Visit number per cell, starting at 1; -1 unvisited.
 * @property {number[]} path    start→goal once found, else [].
 * @property {number[]} lines
 * @property {number} visited   Running count of visited cells.
 */

export const dfsPseudocode = [
  'stack = [(start, none)]',
  'while stack is not empty:',
  '  (cell, from) = stack.pop()',
  '  if cell is already visited: continue      // stale duplicate',
  '  visited.add(cell); parent[cell] = from',
  '  if cell == goal: walk parents back; stop',
  '  for each neighbor of cell (left, down, right, up):',
  '    if neighbor is open and not visited: stack.push((neighbor, cell))',
  'no path — goal is walled off',
];

/**
 * @param {Grid} grid
 * @returns {DfsFrame[]}
 */
export function dfsGridTrace({ rows, cols, walls, start, goal }) {
  const size = rows * cols;
  const order = new Array(size).fill(-1);
  const parent = new Array(size).fill(-1);
  /** @type {{cell: number, from: number}[]} */
  const stack = [{ cell: start, from: -1 }];
  let visited = 0;

  /** @type {DfsFrame[]} */
  const frames = [];
  /** @param {Omit<DfsFrame, 'stack'|'order'|'visited'>} f */
  const push = (f) =>
    frames.push({ ...f, stack: stack.map((e) => e.cell), order: order.slice(), visited });

  push({ kind: 'start', current: -1, touched: -1, path: [], lines: [0] });
  while (stack.length > 0) {
    const entry = /** @type {{cell: number, from: number}} */ (stack.pop());
    const cell = entry.cell;
    if (order[cell] !== -1) {
      push({ kind: 'skip', current: cell, touched: -1, path: [], lines: [1, 2, 3] });
      continue;
    }
    order[cell] = ++visited;
    parent[cell] = entry.from;
    push({ kind: 'pop', current: cell, touched: -1, path: [], lines: [1, 2, 3, 4] });
    if (cell === goal) {
      const path = [];
      for (let at = goal; at !== -1; at = parent[at]) path.push(at);
      push({ kind: 'found', current: cell, touched: -1, path: path.reverse(), lines: [5] });
      return frames;
    }
    // Reversed so the first neighbor in BFS order ("up") ends on top and pops first.
    for (const next of neighbors(cell, rows, cols).slice().reverse()) {
      if (walls.has(next) || order[next] !== -1) continue;
      stack.push({ cell: next, from: cell });
      push({ kind: 'push', current: cell, touched: next, path: [], lines: [6, 7] });
    }
  }
  push({ kind: 'no-path', current: -1, touched: -1, path: [], lines: [1, 8] });
  return frames;
}
