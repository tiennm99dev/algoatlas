import { inBox, orient } from './geometry-orientation.js';

/**
 * Three walks over a polygon's edges on whole-number points: the shoelace sum for area, and ray
 * casting and the winding number for point in polygon. Both point tests use one half-open rule,
 * an edge covers the heights from its lower end up to but not including its upper end, so a ray
 * through a vertex counts it exactly once.
 */

/** @typedef {import('./geometry-orientation.js').Point} Point */
/** @typedef {'shoelace' | 'ray' | 'winding'} PolygonMethod */
/** @typedef {'inside' | 'outside' | 'boundary'} Location */
/** @typedef {'term' | 'cross' | 'skip' | 'up' | 'down' | 'boundary'} EdgeResult */

/**
 * One row of the side table: an edge walked and what it contributed.
 * @typedef {object} EdgeRow
 * @property {number} i
 * @property {number} j
 * @property {EdgeResult} result
 * @property {number} value  The shoelace term, or the change to the crossing or winding count.
 * @property {number} total  The running sum, crossing count or winding number after this edge.
 */

/**
 * @typedef {object} PolygonFrame
 * @property {PolygonMethod} method
 * @property {'start' | 'edge' | 'toggle' | 'done'} kind
 * @property {number[]} lines
 * @property {Point[]} polygon
 * @property {Point} query
 * @property {number | null} edge  Index of the edge's first vertex.
 * @property {EdgeRow[]} rows
 * @property {EdgeResult | null} result
 * @property {number} sum  Shoelace sum so far.
 * @property {number | null} area
 * @property {'ccw' | 'cw' | 'flat' | null} direction
 * @property {number} crossings  Ray crossings so far.
 * @property {boolean} inside  Ray casting's running answer.
 * @property {number} winding
 * @property {Point[]} hits  Where the ray has crossed an edge so far.
 * @property {Location | null} location
 * @property {number} edgesWalked
 */

/** The plane the lesson's polygons live on. */
export const GRID = { xMax: 12, yMax: 8 };
export const MIN_VERTICES = 3;
export const MAX_VERTICES = 12;

export const shoelacePseudocode = [
  'function area(p):',
  '  sum = 0',
  '  for i = 0 to n − 1:',
  '    j = (i + 1) mod n',
  '    sum = sum + p[i].x · p[j].y − p[j].x · p[i].y',
  '  return |sum| / 2',
];

export const rayPseudocode = [
  'function locate(q, p):',
  '  inside = false',
  '  for each edge (a, b) of p:',
  '    if q on segment ab: return BOUNDARY',
  '    if (a.y > q.y) ≠ (b.y > q.y) and crossing is right of q:',
  '      inside = not inside',
  '  return inside',
];

export const windingPseudocode = [
  'function locate(q, p):',
  '  w = 0',
  '  for each edge (a, b) of p:',
  '    if q on segment ab: return BOUNDARY',
  '    if a.y ≤ q.y and b.y > q.y and orient(a, b, q) > 0: w = w + 1',
  '    else if a.y > q.y and b.y ≤ q.y and orient(a, b, q) < 0: w = w − 1',
  '  return w ≠ 0',
];

/** Polygons for the widget, in vertex order, each with a query point that shows something. */
export const POLYGON_PRESETS = {
  rectangle: {
    polygon: [
      { x: 2, y: 1 },
      { x: 8, y: 1 },
      { x: 8, y: 6 },
      { x: 2, y: 6 },
    ],
    query: { x: 5, y: 3 },
  },
  lShape: {
    polygon: [
      { x: 1, y: 1 },
      { x: 9, y: 1 },
      { x: 9, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 7 },
      { x: 1, y: 7 },
    ],
    query: { x: 6, y: 5 },
  },
  clockwise: {
    polygon: [
      { x: 2, y: 2 },
      { x: 5, y: 7 },
      { x: 10, y: 2 },
    ],
    query: { x: 5, y: 3 },
  },
  notch: {
    polygon: [
      { x: 1, y: 1 },
      { x: 6, y: 3 },
      { x: 11, y: 1 },
      { x: 6, y: 8 },
    ],
    query: { x: 6, y: 2 },
  },
  throughVertex: {
    polygon: [
      { x: 6, y: 1 },
      { x: 10, y: 4 },
      { x: 6, y: 7 },
      { x: 2, y: 4 },
    ],
    query: { x: 4, y: 4 },
  },
  star: {
    polygon: [
      { x: 6, y: 8 },
      { x: 8, y: 0 },
      { x: 2, y: 5 },
      { x: 10, y: 5 },
      { x: 4, y: 0 },
    ],
    query: { x: 6, y: 3 },
  },
};

/** @param {Point} p @param {Point} q */
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

/** The twice-signed area of the polygon: positive when its vertices run counter-clockwise. */
/** @param {Point[]} polygon */
export function shoelaceSum(polygon) {
  let sum = 0;
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length];
    sum += p.x * q.y - q.x * p.y;
  });
  return sum;
}

/**
 * Where a new vertex goes: into the edge it lengthens the least, so a press near an edge bends
 * that edge instead of tying the outline in a knot.
 * @param {Point[]} polygon @param {Point} p
 * @returns {Point[]}
 */
export function insertVertex(polygon, p) {
  let best = 0;
  let bestCost = Infinity;
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    const cost = dist(a, p) + dist(p, b) - dist(a, b);
    if (cost < bestCost - 1e-9) {
      bestCost = cost;
      best = i;
    }
  });
  return [...polygon.slice(0, best + 1), { ...p }, ...polygon.slice(best + 1)];
}

/**
 * Whether the outline crosses or folds back on itself, in which case the shoelace sum counts
 * regions by how often they are wound, not their plain area.
 * @param {Point[]} polygon
 */
export function selfIntersects(polygon) {
  const n = polygon.length;
  /** @param {Point} a @param {Point} b @param {Point} c @param {Point} d */
  const meet = (a, b, c, d) => {
    const [o1, o2, o3, o4] = [orient(c, d, a), orient(c, d, b), orient(a, b, c), orient(a, b, d)];
    if (Math.sign(o1) * Math.sign(o2) < 0 && Math.sign(o3) * Math.sign(o4) < 0) return true;
    return (
      (o1 === 0 && inBox(c, d, a)) ||
      (o2 === 0 && inBox(c, d, b)) ||
      (o3 === 0 && inBox(a, b, c)) ||
      (o4 === 0 && inBox(a, b, d))
    );
  };
  for (let i = 0; i < n; i++) {
    const [a, b, c] = [polygon[i], polygon[(i + 1) % n], polygon[(i + 2) % n]];
    // Two neighbouring edges share b, so they only overlap if c doubles back along ba.
    const backX = (a.x - b.x) * (c.x - b.x);
    const backY = (a.y - b.y) * (c.y - b.y);
    if (orient(a, b, c) === 0 && backX + backY > 0) return true;
    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i) continue;
      if (meet(a, b, polygon[j], polygon[(j + 1) % n])) return true;
    }
  }
  return false;
}

/**
 * @param {PolygonMethod} method
 * @param {Point[]} polygon
 * @param {Point} query
 * @returns {PolygonFrame[]}
 */
export function polygonTrace(method, polygon, query) {
  /** @type {PolygonFrame[]} */
  const frames = [];
  /** @type {EdgeRow[]} */
  const rows = [];
  /** @type {Point[]} */
  const hits = [];
  /** @type {number | null} */
  let edge = null;
  /** @type {EdgeResult | null} */
  let result = null;
  let sum = 0;
  /** @type {number | null} */
  let area = null;
  /** @type {PolygonFrame['direction']} */
  let direction = null;
  let crossings = 0;
  let inside = false;
  let winding = 0;
  /** @type {Location | null} */
  let location = null;
  let edgesWalked = 0;

  /** @param {PolygonFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      method,
      kind,
      lines,
      polygon: polygon.map((p) => ({ ...p })),
      query: { ...query },
      edge,
      rows: rows.map((r) => ({ ...r })),
      result,
      sum,
      area,
      direction,
      crossings,
      inside,
      winding,
      hits: hits.map((p) => ({ ...p })),
      location,
      edgesWalked,
    });

  const n = polygon.length;
  push('start', [0, 1]);

  if (method === 'shoelace') {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const term = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
      sum += term;
      edge = i;
      result = 'term';
      edgesWalked++;
      rows.push({ i, j, result, value: term, total: sum });
      push('edge', [2, 3, 4]);
    }
    edge = null;
    result = null;
    area = Math.abs(sum) / 2;
    direction = sum > 0 ? 'ccw' : sum < 0 ? 'cw' : 'flat';
    push('done', [5]);
    return frames;
  }

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = polygon[i];
    const b = polygon[j];
    const side = orient(a, b, query);
    edge = i;
    edgesWalked++;

    if (side === 0 && inBox(a, b, query)) {
      result = 'boundary';
      rows.push({ i, j, result, value: 0, total: method === 'ray' ? crossings : winding });
      location = 'boundary';
      push('done', [2, 3]);
      return frames;
    }

    if (method === 'ray') {
      const straddles = a.y > query.y !== b.y > query.y;
      // An upward edge has q on its left when the crossing is right of q, a downward one on its right.
      const rightOfQ = straddles && (b.y > a.y ? side > 0 : side < 0);
      result = rightOfQ ? 'cross' : 'skip';
      if (rightOfQ) crossings++;
      rows.push({ i, j, result, value: rightOfQ ? 1 : 0, total: crossings });
      if (rightOfQ) {
        hits.push({
          x: a.x + ((query.y - a.y) * (b.x - a.x)) / (b.y - a.y),
          y: query.y,
        });
      }
      push('edge', [2, 3, 4]);
      if (rightOfQ) {
        inside = !inside;
        push('toggle', [5]);
      }
    } else {
      const up = a.y <= query.y && b.y > query.y && side > 0;
      const down = !up && a.y > query.y && b.y <= query.y && side < 0;
      result = up ? 'up' : down ? 'down' : 'skip';
      winding += up ? 1 : down ? -1 : 0;
      rows.push({ i, j, result, value: up ? 1 : down ? -1 : 0, total: winding });
      push('edge', up ? [2, 3, 4] : [2, 3, 4, 5]);
    }
  }

  edge = null;
  result = null;
  location = (method === 'ray' ? inside : winding !== 0) ? 'inside' : 'outside';
  push('done', [6]);
  return frames;
}
