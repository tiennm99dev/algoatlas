import { orient } from './geometry-orientation.js';

/**
 * Three problem runners on one set of whole-number points, each with a value for the learner to
 * predict before it is revealed. Which side: the exact cross product puts every point left of,
 * right of or on line AB. Fence: the convex hull is the shortest fence around every point, and
 * the shoelace sum over its corners gives the area it encloses. Farthest pair: the two points
 * farthest apart are both hull corners, so only corner pairs are compared, by squared distance.
 * Whole numbers keep every comparison exact: no division, no square root, no epsilon.
 */

/**
 * @typedef {object} GeoPoint
 * @property {number} id
 * @property {number} x
 * @property {number} y
 */

/** @typedef {'side' | 'fence' | 'diameter'} Puzzle */

/**
 * @typedef {object} GeoFrame
 * @property {'start' | 'read' | 'classify' | 'hull' | 'edge' | 'add' | 'pair' | 'compare' | 'done'} kind
 * @property {Puzzle} puzzle
 * @property {number[]} lines
 * @property {GeoPoint[]} points
 * @property {[number, number] | null} line  A and B, the two points with the lowest ids.
 * @property {number | null} current  The point being classified.
 * @property {{ left: number[], right: number[], on: number[] }} sides
 * @property {number[] | null} hull  Hull corners, counter-clockwise, once built.
 * @property {[number, number] | null} edge  The hull edge or corner pair at hand.
 * @property {number[]} done  Indices of hull edges already summed, or pairs already compared.
 * @property {number | null} value  The value just revealed: a cross product, a shoelace term or d².
 * @property {number} twice  Twice the enclosed area so far.
 * @property {number} perimeter  Fence length so far.
 * @property {number} best  The largest d² so far, −1 before any pair.
 * @property {[number, number] | null} bestPair
 * @property {number} steps  Points classified, edges summed or pairs compared.
 * @property {number} brute  What the plain method costs: pairs of all points for the farthest pair.
 * @property {number | null} ask  The value the next step reveals, for the learner to predict.
 */

/** The plane the lesson’s points live on. */
export const GRID = { xMax: 12, yMax: 8 };
export const MIN_POINTS = 3;
export const MAX_POINTS = 12;

export const PUZZLES = /** @type {Puzzle[]} */ (['side', 'fence', 'diameter']);

/** @type {Record<Puzzle, string[]>} */
export const PSEUDOCODE = {
  side: [
    'for each point p other than A and B:',
    '  c = cross(B − A, p − A)   // whole numbers: exact',
    '  if c > 0: p is left of A → B',
    '  else if c < 0: p is right of A → B',
    '  else: p is on the line   // c = 0 exactly, no epsilon',
    'return the three groups',
  ],
  fence: [
    'hull = monotoneChain(points)   // corners, counter-clockwise',
    'twice = 0, perimeter = 0',
    'for each hull edge (pᵢ, pᵢ₊₁):',
    '  twice = twice + (xᵢ · yᵢ₊₁ − xᵢ₊₁ · yᵢ)',
    '  perimeter = perimeter + |pᵢ pᵢ₊₁|',
    'area = twice / 2',
  ],
  diameter: [
    'hull = monotoneChain(points)',
    'best = −1',
    'for each pair (p, q) of hull corners:',
    '  d² = (px − qx)² + (py − qy)²   // no square root',
    '  if d² > best: best = d², pair = (p, q)',
    'return pair, with distance √best',
  ],
};

/** @param {[number, number][]} coords @returns {GeoPoint[]} */
const toPoints = (coords) => coords.map(([x, y], id) => ({ id, x, y }));

/** Point sets for the sandbox. */
export const GEO_PRESETS = {
  field: toPoints([
    [1, 1],
    [11, 6],
    [2, 5],
    [5, 3],
    [8, 1],
    [4, 7],
    [9, 5],
    [10, 2],
    [6, 6],
  ]),
  square: toPoints([
    [2, 1],
    [10, 1],
    [10, 7],
    [2, 7],
    [6, 4],
    [4, 3],
    [8, 5],
    [6, 1],
  ]),
  triangle: toPoints([
    [0, 0],
    [12, 0],
    [6, 8],
    [6, 3],
    [3, 4],
    [9, 4],
  ]),
};

/**
 * Distinct whole-number points on the plane.
 * @param {number} n
 * @param {() => number} [rand]
 * @returns {GeoPoint[]}
 */
export function randomPoints(n, rand = Math.random) {
  const count = Math.max(MIN_POINTS, Math.min(n, MAX_POINTS));
  /** @type {GeoPoint[]} */
  const out = [];
  while (out.length < count) {
    const x = Math.floor(rand() * (GRID.xMax + 1));
    const y = Math.floor(rand() * (GRID.yMax + 1));
    if (!out.some((p) => p.x === x && p.y === y)) out.push({ id: out.length, x, y });
  }
  return out;
}

/** Squared distance: a whole number for whole-number points, so it compares exactly. */
/** @param {GeoPoint} p @param {GeoPoint} q */
export const dist2 = (p, q) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2;

/**
 * Andrew’s monotone chain: the hull corners counter-clockwise, collinear points left out.
 * @param {GeoPoint[]} points  Distinct positions.
 * @returns {number[]}
 */
export function hullOf(points) {
  const sorted = points.toSorted((p, q) => p.x - q.x || p.y - q.y);
  if (sorted.length < 3) return sorted.map((p) => p.id);
  /** @param {GeoPoint[]} seq */
  const chain = (seq) => {
    /** @type {GeoPoint[]} */
    const out = [];
    for (const p of seq) {
      while (out.length >= 2 && orient(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    return out;
  };
  const lower = chain(sorted);
  const upper = chain(sorted.toReversed());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)].map((p) => p.id);
}

/**
 * Where the line through a and b enters and leaves the plane, for drawing it edge to edge.
 * @param {{x: number, y: number}} a @param {{x: number, y: number}} b
 */
export function lineAcross(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let lo = -Infinity;
  let hi = Infinity;
  /** @param {number} p @param {number} d @param {number} max */
  const clip = (p, d, max) => {
    if (d === 0) return;
    const t1 = (0 - p) / d;
    const t2 = (max - p) / d;
    lo = Math.max(lo, Math.min(t1, t2));
    hi = Math.min(hi, Math.max(t1, t2));
  };
  clip(a.x, dx, GRID.xMax);
  clip(a.y, dy, GRID.yMax);
  return { x1: a.x + lo * dx, y1: a.y + lo * dy, x2: a.x + hi * dx, y2: a.y + hi * dy };
}

/** The two points with the lowest ids: A and B of the side puzzle. */
/** @param {GeoPoint[]} points @returns {[GeoPoint, GeoPoint]} */
export function lineEnds(points) {
  const [a, b] = points.toSorted((p, q) => p.id - q.id);
  return [a, b];
}

/** @param {Puzzle} puzzle @param {GeoPoint[]} points */
function makeState(puzzle, points) {
  return {
    puzzle,
    points,
    /** @type {[number, number] | null} */
    line: null,
    /** @type {number | null} */
    current: null,
    sides: {
      left: /** @type {number[]} */ ([]),
      right: /** @type {number[]} */ ([]),
      on: /** @type {number[]} */ ([]),
    },
    /** @type {number[] | null} */
    hull: null,
    /** @type {[number, number] | null} */
    edge: null,
    /** @type {number[]} */
    done: [],
    /** @type {number | null} */
    value: null,
    twice: 0,
    perimeter: 0,
    best: -1,
    /** @type {[number, number] | null} */
    bestPair: null,
    steps: 0,
    brute: 0,
  };
}

/** @typedef {ReturnType<typeof makeState>} State */

/** @param {State} s @param {GeoFrame['kind']} kind @param {number[]} lines @param {number | null} [ask] @returns {GeoFrame} */
const snap = (s, kind, lines, ask = null) => ({
  ...s,
  kind,
  lines,
  ask,
  points: s.points.map((p) => ({ ...p })),
  line: s.line && [s.line[0], s.line[1]],
  sides: { left: s.sides.left.slice(), right: s.sides.right.slice(), on: s.sides.on.slice() },
  hull: s.hull && s.hull.slice(),
  edge: s.edge && [s.edge[0], s.edge[1]],
  done: s.done.slice(),
  bestPair: s.bestPair && [s.bestPair[0], s.bestPair[1]],
});

/**
 * Classifies every point against line A → B by the sign of the exact cross product.
 * @param {GeoPoint[]} points  At least two, at distinct positions.
 * @returns {GeoFrame[]}
 */
export function sideTrace(points) {
  const s = makeState('side', points);
  const [a, b] = lineEnds(points);
  s.line = [a.id, b.id];
  s.brute = points.length - 2;
  /** @type {GeoFrame[]} */
  const frames = [snap(s, 'start', [0])];
  for (const p of points.toSorted((u, v) => u.id - v.id)) {
    if (p.id === a.id || p.id === b.id) continue;
    const c = orient(a, b, p);
    s.current = p.id;
    s.value = null;
    frames.push(snap(s, 'read', [0, 1], c));
    s.value = c;
    s.steps++;
    if (c > 0) s.sides.left.push(p.id);
    else if (c < 0) s.sides.right.push(p.id);
    else s.sides.on.push(p.id);
    frames.push(snap(s, 'classify', [c > 0 ? 2 : c < 0 ? 3 : 4]));
  }
  s.current = null;
  s.value = null;
  frames.push(snap(s, 'done', [5]));
  return frames;
}

/**
 * The hull as the shortest fence, and the area it encloses by the shoelace sum.
 * @param {GeoPoint[]} points
 * @returns {GeoFrame[]}
 */
export function fenceTrace(points) {
  const s = makeState('fence', points);
  /** @type {Map<number, GeoPoint>} */
  const byId = new Map(points.map((p) => [p.id, p]));
  /** @param {number} id */
  const at = (id) => /** @type {GeoPoint} */ (byId.get(id));
  /** @type {GeoFrame[]} */
  const frames = [snap(s, 'start', [0])];
  const hull = hullOf(points);
  s.hull = hull;
  s.brute = hull.length;
  frames.push(snap(s, 'hull', [0, 1]));
  hull.forEach((id, i) => {
    const p = at(id);
    const q = at(hull[(i + 1) % hull.length]);
    const term = p.x * q.y - q.x * p.y + 0;
    s.edge = [p.id, q.id];
    s.value = null;
    frames.push(snap(s, 'edge', [2], s.twice + term));
    s.value = term;
    s.twice += term;
    s.perimeter += Math.sqrt(dist2(p, q));
    s.steps++;
    s.done.push(i);
    frames.push(snap(s, 'add', [3, 4]));
  });
  s.edge = null;
  s.value = null;
  frames.push(snap(s, 'done', [5]));
  return frames;
}

/**
 * The farthest pair of points, comparing only hull corners and only squared distances.
 * @param {GeoPoint[]} points
 * @returns {GeoFrame[]}
 */
export function diameterTrace(points) {
  const s = makeState('diameter', points);
  /** @type {Map<number, GeoPoint>} */
  const byId = new Map(points.map((p) => [p.id, p]));
  /** @param {number} id */
  const at = (id) => /** @type {GeoPoint} */ (byId.get(id));
  s.brute = (points.length * (points.length - 1)) / 2;
  /** @type {GeoFrame[]} */
  const frames = [snap(s, 'start', [0])];
  const hull = hullOf(points);
  s.hull = hull;
  frames.push(snap(s, 'hull', [0, 1]));
  let k = 0;
  for (let i = 0; i < hull.length; i++) {
    for (let j = i + 1; j < hull.length; j++) {
      const d = dist2(at(hull[i]), at(hull[j]));
      s.edge = [hull[i], hull[j]];
      s.value = null;
      frames.push(snap(s, 'pair', [2], d));
      s.value = d;
      s.steps++;
      if (d > s.best) {
        s.best = d;
        s.bestPair = [hull[i], hull[j]];
      }
      s.done.push(k++);
      frames.push(snap(s, 'compare', [3, 4]));
    }
  }
  s.edge = null;
  s.value = null;
  frames.push(snap(s, 'done', [5]));
  return frames;
}

/** @param {Puzzle} puzzle @param {GeoPoint[]} points */
export function puzzleTrace(puzzle, points) {
  if (puzzle === 'side') return sideTrace(points);
  if (puzzle === 'fence') return fenceTrace(points);
  return diameterTrace(points);
}
