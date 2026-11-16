/**
 * Whole-number plane geometry shared by the geometry lessons: vectors, the orientation test,
 * bounding boxes, squared distances and the convex hull by Andrew's monotone chain. Whole numbers
 * keep every comparison exact.
 */

/**
 * @typedef {object} Point
 * @property {number} x
 * @property {number} y
 */

/** @typedef {'left' | 'right' | 'collinear'} Turn */

/** @param {Point} a @param {Point} b @returns {Point} */
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });

/** Adding 0 turns a −0 into 0, so an exact zero always compares and prints as 0. */
/** @param {Point} u @param {Point} v */
export const dot = (u, v) => u.x * v.x + u.y * v.y + 0;

/** @param {Point} u @param {Point} v */
export const cross = (u, v) => u.x * v.y - u.y * v.x + 0;

/**
 * Twice the signed area of triangle abc: positive when a → b → c turns left, negative when it
 * turns right, zero when the three points are on one line.
 * @param {Point} a @param {Point} b @param {Point} c
 */
export const orient = (a, b, c) => cross(sub(b, a), sub(c, a));

/** @param {number} value @returns {Turn} */
export const turnOf = (value) => (value > 0 ? 'left' : value < 0 ? 'right' : 'collinear');

/**
 * Whether p sits in the bounding box of segment ab, which for a point already known to be on
 * the line through a and b means it is on the segment.
 * @param {Point} a @param {Point} b @param {Point} p
 */
export const inBox = (a, b, p) =>
  Math.min(a.x, b.x) <= p.x &&
  p.x <= Math.max(a.x, b.x) &&
  Math.min(a.y, b.y) <= p.y &&
  p.y <= Math.max(a.y, b.y);

/** @param {Point} p @param {Point} q */
export const samePoint = (p, q) => p.x === q.x && p.y === q.y;

/** Squared distance: a whole number for whole-number points, so it compares exactly. */
/** @param {Point} p @param {Point} q */
export const dist2 = (p, q) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2;

/**
 * Andrew’s monotone chain: the hull corners counter-clockwise, collinear points left out.
 * @param {Array<Point & { id: number }>} points  Distinct positions.
 * @returns {number[]}
 */
export function hullOf(points) {
  const sorted = points.toSorted((p, q) => p.x - q.x || p.y - q.y);
  if (sorted.length < 3) return sorted.map((p) => p.id);
  /** @param {Array<Point & { id: number }>} seq */
  const chain = (seq) => {
    /** @type {Array<Point & { id: number }>} */
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
