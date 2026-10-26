/**
 * Step traces for two problems that sorting turns into one left-to-right scan. Merging
 * intervals: once intervals are sorted by start, each one either overlaps the block being
 * built or starts a new block. Removing duplicates: once values are sorted, equal values sit
 * side by side, so one comparison with the previous value finds every repeat. The interval
 * sort takes a comparator, so the learner can see a wrong key give a wrong answer.
 */

/** @typedef {{id: number, start: number, end: number}} Interval */
/** @typedef {{start: number, end: number, ids: number[]}} Block */
/** @typedef {'start'|'end'|'none'} Comparator */

/**
 * @typedef {object} MergeFrame
 * @property {'start'|'sorted'|'open'|'extend'|'new'|'done'} kind
 * @property {Interval[]} items  The intervals in scan order (after the sort, from 'sorted' on).
 * @property {Block[]} blocks  Merged blocks so far, the last one still open.
 * @property {number} i  Interval scanned by this step; -1 when none.
 * @property {number} checks  Overlap checks so far.
 * @property {number[]} lines
 */

/**
 * @typedef {object} DedupFrame
 * @property {'start'|'sorted'|'keep'|'skip'|'done'} kind
 * @property {number[]} items  The values in scan order (sorted from 'sorted' on).
 * @property {number[]} kept  Indices of items kept so far.
 * @property {number[]} out  The distinct values so far.
 * @property {number} i  Item scanned by this step; -1 when none.
 * @property {number} checks  Comparisons with the previous value so far.
 * @property {number[]} lines
 */

export const MAX_INTERVALS = 8;
export const MAX_TIME = 24;
export const MAX_VALUES = 14;
export const MAX_VALUE = 99;

/** @type {Record<Comparator, string>} */
const SORT_LINE = {
  start: 'sort intervals by start, ties by end',
  end: 'sort intervals by end, ties by start',
  none: 'no sort: keep the input order',
};

/** @param {Comparator} by */
const mergeLines = (by) => [
  SORT_LINE[by],
  'out = [first interval]; last = its block',
  'for each next interval x:',
  '  if x.start <= last.end: last.end = max(last.end, x.end)',
  '  else: append x to out   // a gap: new block',
  'done: out holds the merged blocks',
];

/** The merge scan, with the first line naming the sort key. @type {Record<Comparator, string[]>} */
export const mergePseudocode = {
  start: mergeLines('start'),
  end: mergeLines('end'),
  none: mergeLines('none'),
};

export const dedupPseudocode = [
  'sort a   // repeats become neighbours',
  'out = [a[0]]',
  'for i = 1 to n - 1:',
  '  if a[i] != a[i - 1]: append a[i] to out',
  '  else: skip a[i]   // same as its left neighbour',
  'done: out holds each value once',
];

/** @type {Record<Exclude<Comparator, 'none'>, (x: Interval, y: Interval) => number>} */
export const COMPARATORS = {
  start: (x, y) => x.start - y.start || x.end - y.end,
  end: (x, y) => x.end - y.end || x.start - y.start,
};

/**
 * Reads intervals typed as start-end pairs, for example "1-3, 2-6".
 * @param {string} text
 * @returns {{intervals: Interval[]} | {error: 'format'|'range'|'count'}}
 */
export function parseIntervals(text) {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  if (tokens.length === 0) return { error: 'format' };
  /** @type {Interval[]} */
  const intervals = [];
  for (const [id, t] of tokens.entries()) {
    const match = /^(\d+)[-–](\d+)$/.exec(t);
    if (!match) return { error: 'format' };
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start >= end || end > MAX_TIME) return { error: 'range' };
    intervals.push({ id, start, end });
  }
  if (intervals.length < 2 || intervals.length > MAX_INTERVALS) return { error: 'count' };
  return { intervals };
}

/** @param {Interval[]} intervals */
export function formatIntervals(intervals) {
  return intervals.map((x) => `${x.start}-${x.end}`).join(', ');
}

/**
 * The correct merge, as an oracle: blocks of overlapping (or touching) intervals.
 * @param {Interval[]} intervals
 * @returns {{start: number, end: number}[]}
 */
export function mergedBlocks(intervals) {
  const sorted = intervals.slice().sort(COMPARATORS.start);
  /** @type {{start: number, end: number}[]} */
  const out = [];
  for (const x of sorted) {
    const last = out.at(-1);
    if (last && x.start <= last.end) last.end = Math.max(last.end, x.end);
    else out.push({ start: x.start, end: x.end });
  }
  return out;
}

/**
 * Whether a scan's blocks are the correct merge of its intervals.
 * @param {Interval[]} intervals
 * @param {{start: number, end: number}[]} blocks
 */
export function isCorrectMerge(intervals, blocks) {
  const want = mergedBlocks(intervals);
  return (
    want.length === blocks.length &&
    want.every((w, k) => w.start === blocks[k].start && w.end === blocks[k].end)
  );
}

/**
 * @param {Interval[]} input
 * @param {Comparator} by
 * @returns {MergeFrame[]}
 */
export function mergeTrace(input, by) {
  const items = by === 'none' ? input.slice() : input.slice().sort(COMPARATORS[by]);
  /** @type {Block[]} */
  const blocks = [];
  /** @type {MergeFrame[]} */
  const frames = [];
  let checks = 0;
  let shown = input;

  /** @param {Pick<MergeFrame, 'kind'|'lines'> & Partial<MergeFrame>} f */
  const push = (f) =>
    frames.push({
      i: -1,
      ...f,
      items: shown.map((x) => ({ ...x })),
      blocks: blocks.map((b) => ({ ...b, ids: b.ids.slice() })),
      checks,
    });

  push({ kind: 'start', lines: [] });
  shown = items;
  push({ kind: 'sorted', lines: [0] });
  for (let i = 0; i < items.length; i++) {
    const x = items[i];
    const last = blocks.at(-1);
    if (!last) {
      blocks.push({ start: x.start, end: x.end, ids: [x.id] });
      push({ kind: 'open', lines: [1], i });
      continue;
    }
    checks++;
    if (x.start <= last.end) {
      last.end = Math.max(last.end, x.end);
      last.ids.push(x.id);
      push({ kind: 'extend', lines: [2, 3], i });
    } else {
      blocks.push({ start: x.start, end: x.end, ids: [x.id] });
      push({ kind: 'new', lines: [2, 4], i });
    }
  }
  push({ kind: 'done', lines: [5] });
  return frames;
}

/**
 * Reads whole numbers from 0 to MAX_VALUE.
 * @param {string} text
 * @returns {{values: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseValues(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v > MAX_VALUE)) return { error: 'range' };
  if (values.length < 2 || values.length > MAX_VALUES) return { error: 'count' };
  return { values };
}

/**
 * @param {number[]} input
 * @returns {DedupFrame[]}
 */
export function dedupTrace(input) {
  const a = input.slice().sort((x, y) => x - y);
  /** @type {number[]} */
  const kept = [];
  /** @type {DedupFrame[]} */
  const frames = [];
  let checks = 0;
  let shown = input;

  /** @param {Pick<DedupFrame, 'kind'|'lines'> & Partial<DedupFrame>} f */
  const push = (f) =>
    frames.push({
      i: -1,
      ...f,
      items: shown.slice(),
      kept: kept.slice(),
      out: kept.map((k) => a[k]),
      checks,
    });

  push({ kind: 'start', lines: [] });
  shown = a;
  push({ kind: 'sorted', lines: [0] });
  for (let i = 0; i < a.length; i++) {
    if (i === 0) {
      kept.push(0);
      push({ kind: 'keep', lines: [1], i });
      continue;
    }
    checks++;
    if (a[i] !== a[i - 1]) {
      kept.push(i);
      push({ kind: 'keep', lines: [2, 3], i });
    } else {
      push({ kind: 'skip', lines: [2, 4], i });
    }
  }
  push({ kind: 'done', lines: [5] });
  return frames;
}
