import { orient } from './geometry-orientation.js';

/**
 * Two convex hull algorithms on whole-number points. Both sort, then scan with a stack that pops
 * every top making a non-left turn. Popping on a zero cross product too drops collinear points,
 * so the result holds only true corners, in counter-clockwise order.
 */

/**
 * @typedef {object} HullPoint
 * @property {number} id
 * @property {number} x
 * @property {number} y
 */

/** @typedef {'graham' | 'monotone'} HullMethod */

/**
 * @typedef {object} HullFrame
 * @property {HullMethod} method
 * @property {'start' | 'pivot' | 'sort' | 'pass' | 'consider' | 'test' | 'pop' | 'push' | 'done'} kind
 * @property {number[]} lines
 * @property {HullPoint[]} points
 * @property {number | null} pivot  Graham's anchor point.
 * @property {number[]} order  Point ids in scan order, once sorted.
 * @property {number[]} stack  The chain being built, bottom to top.
 * @property {number[]} lower  The finished lower chain, in the second pass of the monotone chain.
 * @property {'lower' | 'upper' | null} chain
 * @property {number | null} current  The point being considered.
 * @property {[number, number, number] | null} triple  second, top and p of the turn just tested.
 * @property {number | null} cross  That turn's cross product.
 * @property {number[]} popped  Points popped so far in this pass.
 * @property {number[] | null} hull  The finished hull, counter-clockwise.
 * @property {number} tests  Orientation tests while scanning.
 * @property {number} pushes
 * @property {number} pops
 */

/** The plane the lesson's points live on. */
export const GRID = { xMax: 12, yMax: 8 };
export const MAX_POINTS = 24;

export const grahamPseudocode = [
  'function grahamScan(points):',
  '  pivot = lowest point, leftmost on a tie',
  '  sort the rest by angle around pivot, nearest first on a tie',
  '  for each p in that order, after pivot:',
  '    while size ≥ 2 and orient(second, top, p) ≤ 0:',
  '      pop',
  '    push p',
  '  return the stack',
];

export const monotonePseudocode = [
  'function monotoneChain(points):',
  '  sort points by x, then y',
  '  for each pass: left to right, then right to left:',
  '    chain = empty',
  '    for each p in the pass’s order:',
  '      while size ≥ 2 and orient(second, top, p) ≤ 0:',
  '        pop',
  '      push p',
  '  return both chains, each without its last point',
];

/** @param {[number, number][]} coords @returns {HullPoint[]} */
const toPoints = (coords) => coords.map(([x, y], id) => ({ id, x, y }));

/** Point clouds for the widget. */
export const HULL_PRESETS = {
  cloud: toPoints([
    [1, 2],
    [3, 1],
    [4, 4],
    [6, 2],
    [2, 6],
    [5, 7],
    [7, 5],
    [9, 1],
    [10, 4],
    [8, 7],
    [11, 6],
    [6, 4],
  ]),
  square: toPoints([
    [2, 1],
    [10, 1],
    [10, 7],
    [2, 7],
    [6, 1],
    [10, 4],
    [5, 4],
    [7, 3],
  ]),
  allOnHull: toPoints([
    [6, 0],
    [9, 1],
    [11, 3],
    [11, 5],
    [9, 7],
    [6, 8],
    [3, 7],
    [1, 5],
    [1, 3],
    [3, 1],
  ]),
  zigzag: toPoints([
    [0, 1],
    [2, 4],
    [4, 2],
    [6, 5],
    [8, 3],
    [10, 6],
    [12, 4],
  ]),
  line: toPoints([
    [1, 1],
    [3, 2],
    [5, 3],
    [7, 4],
    [11, 6],
  ]),
};

/**
 * Distinct whole-number points on the plane.
 * @param {number} n
 * @param {() => number} [rand]
 * @returns {HullPoint[]}
 */
export function randomPoints(n, rand = Math.random) {
  const count = Math.min(n, MAX_POINTS);
  /** @type {HullPoint[]} */
  const out = [];
  while (out.length < count) {
    const x = Math.floor(rand() * (GRID.xMax + 1));
    const y = Math.floor(rand() * (GRID.yMax + 1));
    if (!out.some((p) => p.x === x && p.y === y)) out.push({ id: out.length, x, y });
  }
  return out;
}

/** Keeps the first point at each position; a hull cannot use a corner twice. */
/** @param {HullPoint[]} points */
function distinct(points) {
  const seen = new Set();
  return points.filter((p) => {
    const key = `${p.x},${p.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * @param {HullMethod} method
 * @param {HullPoint[]} input
 * @returns {HullFrame[]}
 */
export function hullTrace(method, input) {
  const points = distinct(input);
  /** @type {Map<number, HullPoint>} */
  const byId = new Map(points.map((p) => [p.id, p]));
  /** @param {number} id */
  const at = (id) => /** @type {HullPoint} */ (byId.get(id));

  /** @type {HullFrame[]} */
  const frames = [];
  /** @type {number | null} */
  let pivot = null;
  /** @type {number[]} */
  let order = [];
  /** @type {number[]} */
  let stack = [];
  /** @type {number[]} */
  let lower = [];
  /** @type {'lower' | 'upper' | null} */
  let chain = null;
  /** @type {number | null} */
  let current = null;
  /** @type {[number, number, number] | null} */
  let triple = null;
  /** @type {number | null} */
  let cross = null;
  /** @type {number[]} */
  let popped = [];
  /** @type {number[] | null} */
  let hull = null;
  let tests = 0;
  let pushes = 0;
  let pops = 0;

  /** @param {HullFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      method,
      kind,
      lines,
      points: points.map((p) => ({ ...p })),
      pivot,
      order: order.slice(),
      stack: stack.slice(),
      lower: lower.slice(),
      chain,
      current,
      triple: triple && [triple[0], triple[1], triple[2]],
      cross,
      popped: popped.slice(),
      hull: hull && hull.slice(),
      tests,
      pushes,
      pops,
    });

  /**
   * One scan: every point in `sequence` is pushed, after popping the tops it makes a non-left
   * turn with. The line numbers differ between the two pseudocodes.
   * @param {number[]} sequence
   * @param {{ loop: number, test: number, pop: number, push: number }} l
   */
  function scan(sequence, l) {
    for (const id of sequence) {
      current = id;
      triple = null;
      cross = null;
      push('consider', [l.loop]);
      while (stack.length >= 2) {
        const second = stack[stack.length - 2];
        const top = stack[stack.length - 1];
        triple = [second, top, id];
        cross = orient(at(second), at(top), at(id));
        tests++;
        push('test', [l.test]);
        if (cross > 0) break;
        stack.pop();
        popped.push(top);
        pops++;
        push('pop', [l.pop]);
      }
      triple = null;
      cross = null;
      stack.push(id);
      pushes++;
      push('push', [l.push]);
    }
    current = null;
  }

  push('start', [0]);

  if (method === 'graham') {
    const first = points.reduce(
      (best, p) => (p.y < best.y || (p.y === best.y && p.x < best.x) ? p : best),
      points[0],
    );
    if (first) pivot = first.id;
    push('pivot', [1]);
    const rest = points.filter((p) => p !== first);
    const sorted = rest.toSorted((p, q) => {
      const side = orient(first, p, q);
      if (side !== 0) return -side;
      return Math.hypot(p.x - first.x, p.y - first.y) - Math.hypot(q.x - first.x, q.y - first.y);
    });
    order = first ? [first.id, ...sorted.map((p) => p.id)] : [];
    push('sort', [2]);
    if (first) {
      stack = [first.id];
      pushes++;
      scan(
        sorted.map((p) => p.id),
        { loop: 3, test: 4, pop: 5, push: 6 },
      );
    }
    hull = stack.slice();
    push('done', [7]);
    return frames;
  }

  const sorted = points.toSorted((p, q) => p.x - q.x || p.y - q.y);
  order = sorted.map((p) => p.id);
  push('sort', [1]);
  chain = 'lower';
  push('pass', [2, 3]);
  const lines = { loop: 4, test: 5, pop: 6, push: 7 };
  scan(order, lines);
  lower = stack.slice();
  stack = [];
  popped = [];
  chain = 'upper';
  push('pass', [2, 3]);
  scan(order.toReversed(), lines);
  // Each chain ends where the other starts. One point or none leaves nothing to drop.
  hull = order.length < 2 ? order.slice() : [...lower.slice(0, -1), ...stack.slice(0, -1)];
  chain = null;
  push('done', [8]);
  return frames;
}

/** The scan costs of both algorithms on one input, for the comparison card. */
/** @param {HullPoint[]} points */
export function hullCosts(points) {
  /** @param {HullMethod} method */
  const last = (method) => /** @type {HullFrame} */ (hullTrace(method, points).at(-1));
  const graham = last('graham');
  const monotone = last('monotone');
  return {
    graham: { tests: graham.tests, pops: graham.pops },
    monotone: { tests: monotone.tests, pops: monotone.pops },
  };
}
