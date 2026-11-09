import { cross, inBox, orient, sub } from './geometry-orientation.js';

/**
 * Whether two closed segments meet, decided from orientation signs alone, and where. Inputs are
 * whole-number points, so every sign is exact; the only division is the final position.
 */

/** @typedef {import('./geometry-orientation.js').Point} Point */
/** @typedef {'cross' | 'touch' | 'overlap' | 'none'} Outcome */

/**
 * @typedef {object} SegmentFrame
 * @property {'start' | 'orient' | 'straddle' | 'onSegment' | 'vectors' | 'shared' | 'parameter' | 'point' | 'done'} kind
 * @property {number[]} lines
 * @property {Point} a
 * @property {Point} b
 * @property {Point} c
 * @property {Point} d
 * @property {(number | null)[]} o  The orientation values o1 to o4; null until computed.
 * @property {number | null} at  Which of o1 to o4 this step works on, as 0 to 3.
 * @property {boolean | null} passed  Whether this step's check passed.
 * @property {boolean} hit  Whether a check has found that the segments meet.
 * @property {Outcome | null} outcome
 * @property {Point | null} r  b − a.
 * @property {Point | null} s  d − c.
 * @property {{ num: number, den: number } | null} t  How far along ab they meet, lowest terms.
 * @property {Point | null} point  Where they meet, when it is one point.
 * @property {[Point, Point] | null} shared  The stretch they share, when collinear.
 * @property {number} tests  Orientation tests so far.
 * @property {number} boxChecks  On-segment box checks so far.
 */

/** The plane the lesson's segments live on. */
export const GRID = { xMax: 12, yMax: 8 };

export const segmentPseudocode = [
  'function intersect(a, b, c, d):',
  '  o1 = orient(c, d, a)',
  '  o2 = orient(c, d, b)',
  '  o3 = orient(a, b, c)',
  '  o4 = orient(a, b, d)',
  '  hit = o1 · o2 < 0 and o3 · o4 < 0',
  '  hit = hit or (o1 = 0 and a in box(c, d))',
  '  hit = hit or (o2 = 0 and b in box(c, d))',
  '  hit = hit or (o3 = 0 and c in box(a, b))',
  '  hit = hit or (o4 = 0 and d in box(a, b))',
  '  if not hit: return NONE',
  '  r = b − a;  s = d − c',
  '  if r × s = 0: return middle two of the sorted endpoints',
  '  t = ((c − a) × s) / (r × s)',
  '  return a + t · r',
];

/** Segments for the widget, one per case worth seeing. */
export const SEGMENT_PRESETS = {
  crossing: { a: { x: 1, y: 1 }, b: { x: 9, y: 6 }, c: { x: 2, y: 7 }, d: { x: 8, y: 1 } },
  tee: { a: { x: 1, y: 2 }, b: { x: 9, y: 2 }, c: { x: 5, y: 2 }, d: { x: 5, y: 7 } },
  overlap: { a: { x: 1, y: 1 }, b: { x: 7, y: 4 }, c: { x: 3, y: 2 }, d: { x: 11, y: 6 } },
  endToEnd: { a: { x: 1, y: 1 }, b: { x: 5, y: 3 }, c: { x: 5, y: 3 }, d: { x: 9, y: 5 } },
  gap: { a: { x: 1, y: 1 }, b: { x: 3, y: 2 }, c: { x: 7, y: 4 }, d: { x: 11, y: 6 } },
  parallel: { a: { x: 1, y: 2 }, b: { x: 9, y: 4 }, c: { x: 1, y: 5 }, d: { x: 9, y: 7 } },
  lineOnly: { a: { x: 1, y: 1 }, b: { x: 5, y: 3 }, c: { x: 8, y: 1 }, d: { x: 8, y: 7 } },
};

/** @param {number} a @param {number} b @returns {number} */
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/**
 * Sorts by x, then y. Four collinear endpoints in this order have the shared stretch, if any, at
 * positions 1 and 2.
 * @param {Point} p @param {Point} q
 */
const byXY = (p, q) => p.x - q.x || p.y - q.y;

/**
 * @param {Point} a @param {Point} b @param {Point} c @param {Point} d
 * @returns {SegmentFrame[]}
 */
export function segmentTrace(a, b, c, d) {
  /** @type {SegmentFrame[]} */
  const frames = [];
  /** @type {(number | null)[]} */
  const o = [null, null, null, null];
  /** @type {number | null} */
  let at = null;
  /** @type {boolean | null} */
  let passed = null;
  let hit = false;
  /** @type {Outcome | null} */
  let outcome = null;
  /** @type {Point | null} */
  let r = null;
  /** @type {Point | null} */
  let s = null;
  /** @type {{ num: number, den: number } | null} */
  let t = null;
  /** @type {Point | null} */
  let point = null;
  /** @type {[Point, Point] | null} */
  let shared = null;
  let tests = 0;
  let boxChecks = 0;

  /** @param {SegmentFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      lines,
      a: { ...a },
      b: { ...b },
      c: { ...c },
      d: { ...d },
      o: o.slice(),
      at,
      passed,
      hit,
      outcome,
      r: r && { ...r },
      s: s && { ...s },
      t: t && { ...t },
      point: point && { ...point },
      shared: shared && [{ ...shared[0] }, { ...shared[1] }],
      tests,
      boxChecks,
    });

  push('start', [0]);

  const tests4 = [
    [c, d, a],
    [c, d, b],
    [a, b, c],
    [a, b, d],
  ];
  const values = tests4.map(([p, q, x]) => orient(p, q, x));
  values.forEach((value, i) => {
    at = i;
    o[i] = value;
    tests++;
    push('orient', [i + 1]);
  });

  at = null;
  const [o1, o2, o3, o4] = values;
  const proper = Math.sign(o1) * Math.sign(o2) < 0 && Math.sign(o3) * Math.sign(o4) < 0;
  hit = proper;
  passed = proper;
  push('straddle', [5]);

  const boxes = [
    [c, d, a],
    [c, d, b],
    [a, b, c],
    [a, b, d],
  ];
  boxes.forEach(([p, q, x], i) => {
    at = i;
    const zero = values[i] === 0;
    if (zero) boxChecks++;
    passed = zero && inBox(p, q, x);
    hit = hit || passed;
    push('onSegment', [6 + i]);
  });
  at = null;
  passed = null;

  if (!hit) {
    outcome = 'none';
    push('done', [10]);
    return frames;
  }

  const rv = sub(b, a);
  const sv = sub(d, c);
  r = rv;
  s = sv;
  push('vectors', [11]);

  const den = cross(rv, sv);
  if (den === 0) {
    const sorted = [a, b, c, d].toSorted(byXY);
    const from = sorted[1];
    const to = sorted[2];
    if (from.x === to.x && from.y === to.y) {
      outcome = 'touch';
      point = { ...from };
    } else {
      outcome = 'overlap';
      shared = [{ ...from }, { ...to }];
    }
    push('shared', [12]);
    push('done', [12]);
    return frames;
  }

  const num = cross(sub(c, a), sv);
  const g = gcd(num, den) || 1;
  const sign = den < 0 ? -1 : 1;
  t = { num: (sign * num) / g + 0, den: (sign * den) / g };
  push('parameter', [13]);
  point = { x: a.x + (num * rv.x) / den, y: a.y + (num * rv.y) / den };
  outcome = proper ? 'cross' : 'touch';
  push('point', [14]);
  push('done', [14]);
  return frames;
}
