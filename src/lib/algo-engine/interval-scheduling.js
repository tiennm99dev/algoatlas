/**
 * Interval scheduling on half-open intervals [start, end): two intervals clash when each starts
 * before the other ends, so [1, 4) and [4, 6) fit together.
 *
 * - Activity selection keeps as many pairwise compatible intervals as possible. The greedy
 *   rule scans the intervals in one sorted order and keeps each that clashes with none kept so
 *   far. Sorting by finish time is optimal; sorting by start time or by length is not, and the
 *   trace shows those rules too so a learner can watch them lose.
 * - Interval partitioning puts every interval in a room with no clash inside a room, using as
 *   few rooms as possible. Scanning by start time and reusing the room that frees up earliest
 *   (a min-heap of finish times) opens exactly as many rooms as the most intervals that overlap
 *   at one moment, the depth.
 *
 * Sorts are stable, so ties keep the typed order.
 */

export const MAX_N = 12;
export const MAX_T = 24;

/** @typedef {'finish' | 'start' | 'shortest' | 'rooms'} Rule */
export const RULES = /** @type {Rule[]} */ (['finish', 'start', 'shortest', 'rooms']);

/**
 * @typedef {object} Interval
 * @property {number} start
 * @property {number} end  Greater than start.
 */

/**
 * @typedef {object} IntervalFrame
 * @property {'start'|'sort'|'consider'|'pick'|'reject'|'reuse'|'open'|'done'} kind
 * @property {Rule} rule
 * @property {Interval[]} intervals  In the typed order; indices below refer to it.
 * @property {number[]} order  Interval indices in scan order (typed order on 'start').
 * @property {number} at  Position in `order` being scanned, -1 outside the loop.
 * @property {number} current  The interval scanned now, -1 outside the loop.
 * @property {number[]} chosen  Selection: kept intervals, in the order they were kept.
 * @property {number[]} rejected  Selection: skipped intervals.
 * @property {number} conflict  On 'consider' and 'reject': a kept interval that clashes, -1 when none.
 * @property {number} lastFinish  Earliest-finish rule: the end of the last kept interval, -1 before.
 * @property {number[]} room  Partitioning: the room of each interval, -1 before it is placed.
 * @property {number[]} roomEnds  Partitioning: the finish time of the last interval in each room.
 * @property {number} freed  Partitioning, on 'consider' and 'reuse': the room that frees earliest, -1 when none.
 * @property {number} checks  Clash checks so far: I against a chosen interval, or min(free) against I.start.
 * @property {number[]} lines
 */

/** @type {Record<Exclude<Rule, 'rooms'>, string>} */
const SORT_LINE = {
  finish: '  sort intervals by finish time',
  start: '  sort intervals by start time',
  shortest: '  sort intervals by length, shortest first',
};

/** @param {Rule} rule */
export function intervalPseudocode(rule) {
  if (rule === 'rooms') {
    return [
      'partition(intervals):',
      '  sort intervals by start time',
      '  free = empty min-heap of room finish times',
      '  for each interval I in that order:',
      '    if free is not empty and min(free) ≤ I.start:',
      '      reuse that room: its finish time becomes I.end',
      '    else: open a new room with finish time I.end',
      '  return the number of rooms  // the depth',
    ];
  }
  const finish = rule === 'finish';
  return [
    'select(intervals):',
    SORT_LINE[rule],
    finish ? '  chosen = []; lastFinish = −∞' : '  chosen = []',
    '  for each interval I in that order:',
    finish
      ? '    if I.start ≥ lastFinish:  // clashes with no chosen one'
      : '    if I clashes with no interval in chosen:',
    finish ? '      add I to chosen; lastFinish = I.end' : '      add I to chosen',
    '    else: skip I',
    '  return chosen',
  ];
}

/** @param {Interval} a @param {Interval} b */
export const clash = (a, b) => a.start < b.end && b.start < a.end;

/**
 * Reads intervals typed as `start-end` (or `start–end`), separated by commas or spaces.
 * @param {string} text
 * @returns {{intervals: Interval[]} | {error: 'format'|'range'|'order'|'count'}}
 */
export function parseIntervals(text) {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((t) => /^\d+[-–]\d+$/.test(t))) {
    return { error: 'format' };
  }
  const intervals = tokens.map((t) => {
    const [start, end] = t.split(/[-–]/).map(Number);
    return { start, end };
  });
  if (intervals.some((iv) => iv.end > MAX_T)) return { error: 'range' };
  if (intervals.some((iv) => iv.end <= iv.start)) return { error: 'order' };
  if (intervals.length > MAX_N) return { error: 'count' };
  return { intervals };
}

/** @param {Interval[]} intervals */
export const formatIntervals = (intervals) =>
  intervals.map((iv) => `${iv.start}-${iv.end}`).join(', ');

/**
 * The most intervals that contain one moment, and the earliest such moment (always a start).
 * @param {Interval[]} intervals
 */
export function deepest(intervals) {
  let depth = 0;
  let at = -1;
  for (const iv of intervals) {
    const d = intervals.filter((o) => o.start <= iv.start && iv.start < o.end).length;
    if (d > depth || (d === depth && iv.start < at)) {
      depth = d;
      at = iv.start;
    }
  }
  return { depth, at };
}

/**
 * Scan order for a rule: indices sorted stably by its key.
 * @param {Interval[]} intervals @param {Rule} rule
 */
export function scanOrder(intervals, rule) {
  /** @param {Interval} iv */
  const key = (iv) =>
    rule === 'finish' ? iv.end : rule === 'shortest' ? iv.end - iv.start : iv.start;
  return intervals.map((_, i) => i).sort((a, b) => key(intervals[a]) - key(intervals[b]) || a - b);
}

/**
 * @param {Interval[]} input
 * @param {Rule} rule
 * @returns {IntervalFrame[]}
 */
export function intervalTrace(input, rule) {
  const intervals = input.map((iv) => ({ ...iv }));
  const n = intervals.length;
  const order = scanOrder(intervals, rule);
  /** @type {IntervalFrame[]} */
  const frames = [];
  /** @type {number[]} */
  const chosen = [];
  /** @type {number[]} */
  const rejected = [];
  const room = Array(n).fill(-1);
  /** @type {number[]} */
  const roomEnds = [];
  let lastFinish = -1;
  let checks = 0;
  let sortedYet = false;

  /** @param {Pick<IntervalFrame, 'kind'|'lines'> & Partial<IntervalFrame>} f */
  const push = (f) =>
    frames.push({
      at: -1,
      current: -1,
      conflict: -1,
      freed: -1,
      ...f,
      rule,
      intervals: intervals.map((iv) => ({ ...iv })),
      order: sortedYet ? order.slice() : intervals.map((_, i) => i),
      chosen: chosen.slice(),
      rejected: rejected.slice(),
      lastFinish,
      room: room.slice(),
      roomEnds: roomEnds.slice(),
      checks,
    });

  push({ kind: 'start', lines: [0] });
  sortedYet = true;
  push({ kind: 'sort', lines: [1, 2] });

  for (let at = 0; at < n; at++) {
    const i = order[at];
    const iv = intervals[i];
    if (rule === 'rooms') {
      // The heap's minimum: the room that frees earliest, lowest number on ties.
      let freed = -1;
      for (let r = 0; r < roomEnds.length; r++) {
        if (freed < 0 || roomEnds[r] < roomEnds[freed]) freed = r;
      }
      if (freed >= 0) checks++;
      push({ kind: 'consider', lines: [3, 4], at, current: i, freed });
      if (freed >= 0 && roomEnds[freed] <= iv.start) {
        room[i] = freed;
        roomEnds[freed] = iv.end;
        push({ kind: 'reuse', lines: [5], at, current: i, freed });
      } else {
        room[i] = roomEnds.length;
        roomEnds.push(iv.end);
        push({ kind: 'open', lines: [6], at, current: i, freed });
      }
      continue;
    }
    let conflict = -1;
    if (rule === 'finish') {
      checks++;
      if (iv.start < lastFinish) conflict = /** @type {number} */ (chosen.at(-1));
    } else {
      for (const c of chosen) {
        checks++;
        if (clash(iv, intervals[c])) {
          conflict = c;
          break;
        }
      }
    }
    push({ kind: 'consider', lines: [3, 4], at, current: i, conflict });
    if (conflict < 0) {
      chosen.push(i);
      if (rule === 'finish') lastFinish = iv.end;
      push({ kind: 'pick', lines: [5], at, current: i });
    } else {
      rejected.push(i);
      push({ kind: 'reject', lines: [6], at, current: i, conflict });
    }
  }
  push({ kind: 'done', lines: [7] });
  return frames;
}
