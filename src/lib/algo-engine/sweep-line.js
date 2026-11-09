import { segmentTrace } from './segment-intersection.js';

/**
 * A vertical line sweeps left to right, stopping only at segment end points. Only segments under
 * the line can meet each other there, so it tests far fewer pairs than all n(n − 1)/2.
 *
 * `any` is the Shamos-Hoey test: the active set is kept ordered by height at the line, and until
 * the first intersection two segments that meet must become neighbours in that order first, so
 * testing neighbours alone is enough. It stops at the first hit. `all` reports every meeting by
 * testing each arriving segment against the whole active set, so it never misses one but costs
 * up to O(n²) tests when everything overlaps in x.
 *
 * Heights are compared by cross-multiplying whole numbers, so no fraction is ever rounded.
 */

/** @typedef {import('./geometry-orientation.js').Point} Point */
/** @typedef {'any' | 'all'} SweepMethod */

/**
 * @typedef {object} SweepSegment
 * @property {number} id
 * @property {Point} p
 * @property {Point} q
 */

/**
 * @typedef {object} SweepEvent
 * @property {number} x
 * @property {'start' | 'end'} type
 * @property {number} id
 */

/**
 * @typedef {object} SweepHit
 * @property {number} i
 * @property {number} j
 * @property {Point} at  The meeting point, or the first point of a shared stretch.
 */

/**
 * @typedef {object} SweepFrame
 * @property {SweepMethod} method
 * @property {'start' | 'sort' | 'arrive' | 'insert' | 'check' | 'remove' | 'found' | 'done'} kind
 * @property {number[]} lines
 * @property {SweepSegment[]} segments
 * @property {SweepEvent[]} events
 * @property {number} eventAt  Index of the current event, or −1.
 * @property {number | null} x  The sweep line's position.
 * @property {number[]} active  Ids under the line, lowest first.
 * @property {number[]} finished  Ids the line has passed.
 * @property {[number, number] | null} pair  The pair being tested.
 * @property {boolean | null} pairHit
 * @property {SweepHit[]} hits
 * @property {number} pairTests
 */

/** The plane the lesson's segments live on. */
export const GRID = { xMax: 12, yMax: 8 };
export const MAX_SEGMENTS = 8;

export const anyPseudocode = [
  'function anyCrossing(segments):',
  '  sort end points by x, starts before ends on a tie',
  '  active = empty, ordered by height at the sweep line',
  '  for each event in order:',
  '    if the event starts s:',
  '      insert s into active',
  '      if s meets its neighbour above or below: return true',
  '    else (the event ends s):',
  '      if the neighbours above and below s meet: return true',
  '      remove s from active',
  '  return false',
];

export const allPseudocode = [
  'function allCrossings(segments):',
  '  sort end points by x, starts before ends on a tie',
  '  active = empty',
  '  for each event in order:',
  '    if the event starts s:',
  '      for each t in active:',
  '        if s meets t: report (s, t)',
  '      add s to active',
  '    else (the event ends s):',
  '      remove s from active',
  '  return the reports',
];

/** @param {[number, number, number, number][]} list @returns {SweepSegment[]} */
const toSegments = (list) =>
  list.map(([x1, y1, x2, y2], id) => ({ id, p: { x: x1, y: y1 }, q: { x: x2, y: y2 } }));

/** Segments for the widget. */
export const SWEEP_PRESETS = {
  crossing: toSegments([
    [1, 2, 7, 3],
    [2, 7, 6, 5],
    [4, 1, 11, 6],
    [8, 7, 12, 2],
  ]),
  disjoint: toSegments([
    [1, 1, 5, 2],
    [3, 4, 8, 3],
    [6, 6, 11, 7],
    [7, 1, 11, 2],
  ]),
  parallel: toSegments([
    [0, 0, 11, 1],
    [1, 1, 12, 2],
    [0, 2, 11, 3],
    [1, 3, 12, 4],
    [0, 4, 11, 5],
    [1, 5, 12, 6],
    [0, 6, 11, 7],
    [1, 7, 12, 8],
  ]),
  mesh: toSegments([
    [1, 2, 11, 2],
    [1, 4, 11, 4],
    [1, 6, 11, 6],
    [3, 1, 3, 7],
    [6, 1, 6, 7],
    [9, 1, 9, 7],
  ]),
  touching: toSegments([
    [1, 2, 6, 2],
    [6, 2, 11, 6],
    [8, 1, 11, 2],
  ]),
};

/** The segment added for each free id when the learner presses Add segment. */
export const SPARE_SEGMENTS = toSegments([
  [2, 0, 6, 1],
  [7, 8, 11, 8],
  [0, 8, 3, 7],
  [9, 0, 12, 1],
  [4, 8, 7, 7],
  [0, 3, 2, 5],
  [10, 3, 12, 4],
  [5, 3, 7, 4],
]);

/**
 * Left end first; a vertical segment runs from its lower end.
 * @param {SweepSegment} s
 * @returns {{ left: Point, right: Point }}
 */
function ends(s) {
  const flip = s.p.x > s.q.x || (s.p.x === s.q.x && s.p.y > s.q.y);
  return flip ? { left: s.q, right: s.p } : { left: s.p, right: s.q };
}

/**
 * The height of a segment at x as a fraction with a positive denominator. A vertical segment is
 * read at its lower end, where it enters the order.
 * @param {SweepSegment} s
 * @param {number} x
 */
function heightAt(s, x) {
  const { left, right } = ends(s);
  const dx = right.x - left.x;
  if (dx === 0) return { num: left.y, den: 1 };
  return { num: left.y * dx + (x - left.x) * (right.y - left.y), den: dx };
}

/**
 * Which is lower at x, exactly; ties go to the smaller id.
 * @param {SweepSegment} s
 * @param {SweepSegment} t
 * @param {number} x
 */
function compareAt(s, t, x) {
  const a = heightAt(s, x);
  const b = heightAt(t, x);
  return a.num * b.den - b.num * a.den || s.id - t.id;
}

/**
 * Every end point as an event, ordered by x with starts before ends, so segments that only touch
 * at one x are still under the line together.
 * @param {SweepSegment[]} segments
 * @returns {SweepEvent[]}
 */
export function sweepEvents(segments) {
  /** @type {SweepEvent[]} */
  const events = segments.flatMap((s) => {
    const { left, right } = ends(s);
    return /** @type {SweepEvent[]} */ ([
      { x: left.x, type: 'start', id: s.id },
      { x: right.x, type: 'end', id: s.id },
    ]);
  });
  const rank = { start: 0, end: 1 };
  const byId = new Map(segments.map((s) => [s.id, s]));
  return events.sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.type !== b.type) return rank[a.type] - rank[b.type];
    const sa = /** @type {SweepSegment} */ (byId.get(a.id));
    const sb = /** @type {SweepSegment} */ (byId.get(b.id));
    return compareAt(sa, sb, a.x);
  });
}

/**
 * Where two segments meet, or null.
 * @param {SweepSegment} s
 * @param {SweepSegment} t
 * @returns {Point | null}
 */
export function meetingPoint(s, t) {
  const f = /** @type {import('./segment-intersection.js').SegmentFrame} */ (
    segmentTrace(s.p, s.q, t.p, t.q).at(-1)
  );
  if (f.outcome === 'none') return null;
  return f.point ?? /** @type {[Point, Point]} */ (f.shared)[0];
}

/**
 * @param {SweepMethod} method
 * @param {SweepSegment[]} segments
 * @returns {SweepFrame[]}
 */
export function sweepTrace(method, segments) {
  const byId = new Map(segments.map((s) => [s.id, s]));
  /** @param {number} id */
  const get = (id) => /** @type {SweepSegment} */ (byId.get(id));

  /** @type {SweepFrame[]} */
  const frames = [];
  /** @type {SweepEvent[]} */
  let events = [];
  let eventAt = -1;
  /** @type {number | null} */
  let x = null;
  /** @type {number[]} */
  let active = [];
  /** @type {number[]} */
  const finished = [];
  /** @type {[number, number] | null} */
  let pair = null;
  /** @type {boolean | null} */
  let pairHit = null;
  /** @type {SweepHit[]} */
  const hits = [];
  let pairTests = 0;

  /** @param {SweepFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      method,
      kind,
      lines,
      segments: segments.map((s) => ({ id: s.id, p: { ...s.p }, q: { ...s.q } })),
      events: events.map((e) => ({ ...e })),
      eventAt,
      x,
      active: active.slice(),
      finished: finished.slice(),
      pair: pair && [pair[0], pair[1]],
      pairHit,
      hits: hits.map((h) => ({ ...h, at: { ...h.at } })),
      pairTests,
    });

  /**
   * Tests one pair and records the frame.
   * @param {number} i @param {number} j @param {number} line
   * @returns {boolean} Whether they meet.
   */
  function check(i, j, line) {
    pair = [i, j];
    const point = meetingPoint(get(i), get(j));
    pairHit = point !== null;
    pairTests++;
    if (point) hits.push({ i: Math.min(i, j), j: Math.max(i, j), at: point });
    push('check', [line]);
    return point !== null;
  }

  /** The active set in height order at the line. */
  const resort = () => {
    const at = /** @type {number} */ (x);
    active = active.toSorted((s, t) => compareAt(get(s), get(t), at));
  };

  push('start', [0]);
  events = sweepEvents(segments);
  push('sort', [1, 2]);

  for (let e = 0; e < events.length; e++) {
    const event = events[e];
    eventAt = e;
    x = event.x;
    pair = null;
    pairHit = null;
    resort();

    if (method === 'any') {
      if (event.type === 'start') {
        push('arrive', [3, 4]);
        active = [...active, event.id];
        resort();
        push('insert', [5]);
        const at = active.indexOf(event.id);
        const neighbours = [active[at + 1], active[at - 1]].filter((id) => id !== undefined);
        for (const other of neighbours) {
          if (check(event.id, other, 6)) {
            push('found', [6]);
            push('done', [6]);
            return frames;
          }
        }
      } else {
        push('arrive', [3, 7]);
        const at = active.indexOf(event.id);
        const [below, above] = [active[at - 1], active[at + 1]];
        if (below !== undefined && above !== undefined && check(below, above, 8)) {
          push('found', [8]);
          push('done', [8]);
          return frames;
        }
        pair = null;
        pairHit = null;
        active = active.filter((id) => id !== event.id);
        finished.push(event.id);
        push('remove', [9]);
      }
    } else if (event.type === 'start') {
      push('arrive', [3, 4]);
      for (const other of active.slice()) check(event.id, other, 6);
      pair = null;
      pairHit = null;
      active = [...active, event.id];
      resort();
      push('insert', [5, 7]);
    } else {
      push('arrive', [3, 8]);
      active = active.filter((id) => id !== event.id);
      finished.push(event.id);
      push('remove', [9]);
    }
  }

  eventAt = -1;
  pair = null;
  pairHit = null;
  push('done', [10]);
  return frames;
}
