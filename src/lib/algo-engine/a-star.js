/**
 * A* search on a 4-connected grid where every step costs 1. The open set is a plain array kept
 * sorted by f = g + h, ties broken by the smaller h (the entry closer to the goal), then by
 * insertion order, so traces are deterministic. Like the Dijkstra lesson it pushes a new entry
 * instead of lowering an old one and skips stale entries when they surface; a closed cell is
 * never reopened.
 *
 * With h = 0 this is exactly Dijkstra. With the Manhattan distance, which never overestimates
 * the remaining cost on this grid (admissible) and drops by at most 1 per step (consistent),
 * the first path to the goal is a shortest one. Three times the Manhattan distance
 * overestimates, so A* may settle for a longer path while expanding fewer cells.
 */
import { neighbors } from './graph.js';

/** @typedef {import('./graph.js').Grid} Grid */
/** @typedef {'zero' | 'manhattan' | 'triple'} Heuristic */

export const HEURISTICS = /** @type {Heuristic[]} */ (['zero', 'manhattan', 'triple']);

/**
 * @typedef {object} AStarFrame
 * @property {'start'|'pop'|'stale'|'push'|'found'|'no-path'} kind
 * @property {number} current   Cell just popped, -1 when none.
 * @property {number} touched   Neighbour just pushed, -1 when none.
 * @property {boolean} improved On 'push': it lowered an already known g.
 * @property {number[]} g       Best known cost from the start per cell, -1 unknown.
 * @property {number[]} closed  Cells expanded, in order.
 * @property {[number, number, number][]} open  [cell, g, h] entries, next to pop first.
 * @property {number[]} path    Start → goal once found.
 * @property {number} pushes    Entries pushed so far, the start included.
 * @property {number[]} lines
 */

export const aStarPseudocode = [
  'g[*] = ∞; g[start] = 0; open = [(f = h(start), start)]',
  'while open is not empty:',
  '  cell = open.popMin()            // smallest f = g + h; ties: smaller h',
  '  if cell is closed: continue     // stale entry',
  '  close cell; if cell == goal: walk parents back; stop',
  '  for each open neighbour n of cell that is not closed:',
  '    if g[cell] + 1 < g[n]:',
  '      g[n] = g[cell] + 1; parent[n] = cell; open.push((g[n] + h(n), n))',
  'no path — goal is walled off',
];

/**
 * The heuristic value of a cell: an estimate of the cost still to go.
 * @param {Heuristic} kind
 * @param {number} cell
 * @param {number} goal
 * @param {number} cols
 */
export function heuristic(kind, cell, goal, cols) {
  if (kind === 'zero') return 0;
  const d =
    Math.abs(Math.floor(cell / cols) - Math.floor(goal / cols)) +
    Math.abs((cell % cols) - (goal % cols));
  return kind === 'triple' ? 3 * d : d;
}

/**
 * @param {Grid & { heuristic: Heuristic }} input
 * @returns {AStarFrame[]}
 */
export function aStarTrace({ rows, cols, walls, start, goal, heuristic: kind }) {
  const size = rows * cols;
  const h = (/** @type {number} */ c) => heuristic(kind, c, goal, cols);
  const g = new Array(size).fill(-1);
  const parent = new Array(size).fill(-1);
  const isClosed = new Array(size).fill(false);
  /** @type {number[]} */
  const closed = [];
  /** @type {[number, number, number][]} */
  const open = [[start, 0, h(start)]];
  g[start] = 0;
  let pushes = 1;

  /** @type {AStarFrame[]} */
  const frames = [];
  /** @param {Pick<AStarFrame, 'kind'|'lines'> & Partial<AStarFrame>} f */
  const push = (f) =>
    frames.push({
      current: -1,
      touched: -1,
      improved: false,
      path: [],
      ...f,
      g: g.slice(),
      closed: closed.slice(),
      open: open.map(([c, gc, hc]) => [c, gc, hc]),
      pushes,
    });

  push({ kind: 'start', lines: [0] });
  while (open.length) {
    const [cell, gc] = /** @type {[number, number, number]} */ (open.shift());
    if (isClosed[cell] || gc > g[cell]) {
      push({ kind: 'stale', current: cell, lines: [1, 2, 3] });
      continue;
    }
    isClosed[cell] = true;
    closed.push(cell);
    if (cell === goal) {
      const path = [];
      for (let at = goal; at !== -1; at = parent[at]) path.push(at);
      push({ kind: 'found', current: cell, path: path.reverse(), lines: [1, 2, 4] });
      return frames;
    }
    push({ kind: 'pop', current: cell, lines: [1, 2, 3, 4] });
    for (const next of neighbors(cell, rows, cols)) {
      if (walls.has(next) || isClosed[next]) continue;
      const ng = g[cell] + 1;
      if (g[next] !== -1 && ng >= g[next]) continue;
      const improved = g[next] !== -1;
      g[next] = ng;
      parent[next] = cell;
      const hn = h(next);
      const f = ng + hn;
      // Insert after every entry that pops first: smaller f, or equal f and h no larger.
      let at = open.length;
      while (
        at > 0 &&
        (open[at - 1][1] + open[at - 1][2] > f ||
          (open[at - 1][1] + open[at - 1][2] === f && open[at - 1][2] > hn))
      )
        at--;
      open.splice(at, 0, [next, ng, hn]);
      pushes++;
      push({ kind: 'push', current: cell, touched: next, improved, lines: [5, 6, 7] });
    }
  }
  push({ kind: 'no-path', lines: [1, 8] });
  return frames;
}

/**
 * Runs every heuristic on one grid, for the comparison panel.
 * @param {Grid} grid
 * @returns {Record<Heuristic, { expanded: number, steps: number | null }>}
 */
export function compareHeuristics(grid) {
  /** @type {Record<string, { expanded: number, steps: number | null }>} */
  const out = {};
  for (const kind of HEURISTICS) {
    const last = /** @type {AStarFrame} */ (aStarTrace({ ...grid, heuristic: kind }).at(-1));
    out[kind] = {
      expanded: last.closed.length,
      steps: last.path.length ? last.path.length - 1 : null,
    };
  }
  return /** @type {Record<Heuristic, { expanded: number, steps: number | null }>} */ (out);
}
