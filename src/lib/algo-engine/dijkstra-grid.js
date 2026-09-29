/**
 * Dijkstra's algorithm with lazy deletion on a 4-connected grid with mud. The priority
 * queue is a plain array kept sorted by (d, insertion order), so traces are deterministic.
 */
import { neighbors } from './graph.js';

/** @typedef {import('./graph.js').Grid} Grid */
/** @typedef {Grid & {cost: number[]}} WeightedGrid */

/**
 * @typedef {object} DijkstraFrame
 * @property {'start'|'pop'|'stale'|'relax'|'found'|'no-path'} kind
 * @property {number} current   Cell just popped, -1 when none.
 * @property {number} popped    d of the popped entry, -1 when none.
 * @property {number} touched   Neighbor just relaxed, -1 when none.
 * @property {number[]} dist    Best known cost per cell, -1 unknown.
 * @property {number[]} settled Cells finalised, in pop order.
 * @property {[number, number][]} pq  [cell, d] pairs, cheapest first.
 * @property {number[]} path
 * @property {boolean} improved On 'relax': it lowered an already known dist.
 * @property {number[]} lines
 * @property {number} relaxations  Running total.
 * @property {number} maxQueue     Largest pq length so far.
 */

export const MUD_COST = 5;

export const dijkstraPseudocode = [
  'dist[*] = infinity; dist[start] = 0; pq = [(0, start)]',
  'while pq is not empty:',
  '  (d, cell) = pq.popMin()',
  '  if d > dist[cell]: continue                 // stale entry',
  '  if cell == goal: walk parents back; stop',
  '  for each open neighbor of cell:',
  '    nd = d + step(cell, neighbor)     // average of the two cells’ costs',
  '    if nd < dist[neighbor]:',
  '      dist[neighbor] = nd; parent[neighbor] = cell; pq.push((nd, neighbor))',
  'no path — goal is walled off',
];

/**
 * A step costs the average of the two cells it joins: 1 on open ground, 3 onto or off
 * mud, 5 inside mud.
 * @param {number[]} cost
 * @param {number} a
 * @param {number} b
 */
export function stepCost(cost, a, b) {
  return (cost[a] + cost[b]) / 2;
}

/**
 * @param {number[]} path Cells in order.
 * @param {number[]} cost
 * @returns {number} Sum of step costs, 0 for a single cell.
 */
export function pathCost(path, cost) {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += stepCost(cost, path[i - 1], path[i]);
  return total;
}

/**
 * @param {WeightedGrid} grid
 * @returns {DijkstraFrame[]}
 */
export function dijkstraGridTrace({ rows, cols, walls, start, goal, cost }) {
  const size = rows * cols;
  const dist = new Array(size).fill(-1);
  const parent = new Array(size).fill(-1);
  /** @type {number[]} */
  const settled = [];
  /** Sorted by d, then by push order. @type {[number, number][]} */
  const pq = [[start, 0]];
  dist[start] = 0;
  let relaxations = 0;
  let maxQueue = 1;

  /** @type {DijkstraFrame[]} */
  const frames = [];
  /** @param {Pick<DijkstraFrame, 'kind'|'current'|'popped'|'touched'|'path'|'improved'|'lines'>} f */
  const push = (f) =>
    frames.push({
      ...f,
      dist: dist.slice(),
      settled: settled.slice(),
      pq: pq.map(([c, d]) => [c, d]),
      relaxations,
      maxQueue,
    });
  const base = { current: -1, popped: -1, touched: -1, path: [], improved: false };

  push({ ...base, kind: 'start', lines: [0] });
  while (pq.length) {
    const [cell, d] = /** @type {[number, number]} */ (pq.shift());
    if (d > dist[cell]) {
      push({ ...base, kind: 'stale', current: cell, popped: d, lines: [1, 2, 3] });
      continue;
    }
    settled.push(cell);
    push({ ...base, kind: 'pop', current: cell, popped: d, lines: [1, 2, 3] });
    if (cell === goal) {
      const path = [];
      for (let at = goal; at !== -1; at = parent[at]) path.push(at);
      push({ ...base, kind: 'found', current: cell, popped: d, path: path.reverse(), lines: [4] });
      return frames;
    }
    for (const next of neighbors(cell, rows, cols)) {
      if (walls.has(next)) continue;
      const nd = d + stepCost(cost, cell, next);
      if (dist[next] !== -1 && nd >= dist[next]) continue;
      const improved = dist[next] !== -1;
      dist[next] = nd;
      parent[next] = cell;
      // Insert after every entry with d <= nd so equal costs keep insertion order.
      let at = pq.length;
      while (at > 0 && pq[at - 1][1] > nd) at--;
      pq.splice(at, 0, [next, nd]);
      maxQueue = Math.max(maxQueue, pq.length);
      relaxations++;
      push({
        ...base,
        kind: 'relax',
        current: cell,
        popped: d,
        touched: next,
        improved,
        lines: [5, 6, 7, 8],
      });
    }
  }
  push({ ...base, kind: 'no-path', lines: [1, 9] });
  return frames;
}

/**
 * Scatter walls and mud. Cells in `keep` stay open ground; costs are only 1 or 5.
 * @param {number} rows
 * @param {number} cols
 * @param {number} wallDensity 0..1
 * @param {number} mudDensity 0..1, applied to cells that are not walls
 * @param {number[]} keep
 * @param {() => number} [rand]
 * @returns {{walls: Set<number>, cost: number[]}}
 */
export function randomTerrain(rows, cols, wallDensity, mudDensity, keep, rand = Math.random) {
  const walls = new Set();
  const cost = new Array(rows * cols).fill(1);
  for (let cell = 0; cell < rows * cols; cell++) {
    if (keep.includes(cell)) continue;
    if (rand() < wallDensity) walls.add(cell);
    else if (rand() < mudDensity) cost[cell] = MUD_COST;
  }
  return { walls, cost };
}
