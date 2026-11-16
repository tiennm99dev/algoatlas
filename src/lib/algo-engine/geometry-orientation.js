/**
 * Vectors and the orientation test on whole-number points. Whole numbers keep the cross product
 * exact, which is why the trace also repeats the sum in floating point for comparison.
 */
import { cross, dot, samePoint, sub, turnOf } from './plane-geometry.js';

/** @typedef {import('./plane-geometry.js').Point} Point */
/** @typedef {import('./plane-geometry.js').Turn} Turn */
/** @typedef {'acute' | 'right' | 'obtuse' | 'none'} AngleKind */

/**
 * @typedef {object} OrientationFrame
 * @property {'start' | 'u' | 'v' | 'dot' | 'cross' | 'precision' | 'done'} kind
 * @property {number[]} lines
 * @property {Point} a
 * @property {Point} b
 * @property {Point} c
 * @property {Point | null} u  b − a, once computed.
 * @property {Point | null} v  c − a, once computed.
 * @property {number | null} dot
 * @property {number | null} cross
 * @property {AngleKind | null} angle
 * @property {Turn | null} turn
 * @property {number | null} floatCross  The same sum on the points divided by 10, in floats.
 * @property {Turn | null} floatTurn  What the bare sign of `floatCross` says.
 * @property {Turn | null} epsilonTurn  What it says once values under EPSILON count as zero.
 * @property {number} multiplications
 */

/** The plane the lesson's points live on. */
export const GRID = { xMax: 12, yMax: 8 };

/** Below this size a float cross product counts as zero. */
export const EPSILON = 1e-9;

export const orientationPseudocode = [
  'function orient(a, b, c):',
  '  u = b − a',
  '  v = c − a',
  '  dot = u.x · v.x + u.y · v.y',
  '  cross = u.x · v.y − u.y · v.x',
  '  if cross > 0: return LEFT',
  '  if cross < 0: return RIGHT',
  '  return COLLINEAR',
];

/** @param {number} value @returns {AngleKind} */
const angleOf = (value) => (value > 0 ? 'acute' : value < 0 ? 'obtuse' : 'right');

/** Starting points for the widget, each showing one outcome. */
export const ORIENTATION_PRESETS = {
  left: { a: { x: 1, y: 1 }, b: { x: 5, y: 2 }, c: { x: 3, y: 6 } },
  right: { a: { x: 2, y: 6 }, b: { x: 7, y: 5 }, c: { x: 9, y: 1 } },
  collinear: { a: { x: 2, y: 1 }, b: { x: 6, y: 3 }, c: { x: 10, y: 5 } },
  rightAngle: { a: { x: 3, y: 2 }, b: { x: 9, y: 2 }, c: { x: 3, y: 7 } },
  obtuse: { a: { x: 6, y: 2 }, b: { x: 11, y: 3 }, c: { x: 2, y: 5 } },
  floatTrap: { a: { x: 0, y: 0 }, b: { x: 3, y: 1 }, c: { x: 9, y: 3 } },
};

/**
 * The orientation sum on the points read in tenths of a unit, as a program holding 0.3 and 0.1
 * would compute it.
 * @param {Point} a @param {Point} b @param {Point} c
 */
export function floatOrient(a, b, c) {
  return (
    (b.x / 10 - a.x / 10) * (c.y / 10 - a.y / 10) - (b.y / 10 - a.y / 10) * (c.x / 10 - a.x / 10)
  );
}

/**
 * One run of the test on three points: the two vectors, both products, then the verdict.
 * @param {Point} a @param {Point} b @param {Point} c
 * @returns {OrientationFrame[]}
 */
export function orientationTrace(a, b, c) {
  /** @type {OrientationFrame[]} */
  const frames = [];
  /** @type {Point | null} */
  let u = null;
  /** @type {Point | null} */
  let v = null;
  /** @type {number | null} */
  let dotValue = null;
  /** @type {number | null} */
  let crossValue = null;
  /** @type {AngleKind | null} */
  let angle = null;
  /** @type {Turn | null} */
  let turn = null;
  /** @type {number | null} */
  let floatCross = null;
  /** @type {Turn | null} */
  let floatTurn = null;
  /** @type {Turn | null} */
  let epsilonTurn = null;
  let multiplications = 0;

  /** @param {OrientationFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      lines,
      a: { ...a },
      b: { ...b },
      c: { ...c },
      u: u && { ...u },
      v: v && { ...v },
      dot: dotValue,
      cross: crossValue,
      angle,
      turn,
      floatCross,
      floatTurn,
      epsilonTurn,
      multiplications,
    });

  push('start', [0]);
  const first = sub(b, a);
  u = first;
  push('u', [1]);
  const second = sub(c, a);
  v = second;
  push('v', [2]);
  dotValue = dot(first, second);
  multiplications += 2;
  angle = samePoint(a, b) || samePoint(a, c) ? 'none' : angleOf(dotValue);
  push('dot', [3]);
  crossValue = cross(first, second);
  multiplications += 2;
  push('cross', [4]);
  floatCross = floatOrient(a, b, c);
  floatTurn = turnOf(floatCross);
  epsilonTurn = Math.abs(floatCross) < EPSILON ? 'collinear' : floatTurn;
  push('precision', [4]);
  turn = turnOf(crossValue);
  push('done', [turn === 'left' ? 5 : turn === 'right' ? 6 : 7]);
  return frames;
}
