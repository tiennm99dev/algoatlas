/** @typedef {import('$lib/algo-engine/interval-scheduling.js').IntervalFrame} IntervalFrame */
/** @typedef {import('$lib/algo-engine/interval-scheduling.js').Rule} Rule */

/** @param {number} x @param {string} word */
const plural = (x, word) => `${x} ${word}${x === 1 ? '' : 's'}`;

/** Interval names: A, B, C, … in the typed order. @param {number} i */
const name = (i) => String.fromCharCode(65 + i);

/** @param {IntervalFrame} f @param {number} i */
const span = (f, i) => `${name(i)} [${f.intervals[i].start}, ${f.intervals[i].end})`;

/** @param {number} r */
const roomName = (r) => `R${r + 1}`;

/** @type {Record<Rule, string>} */
const SORT_KEY = {
  finish: 'finish time',
  start: 'start time',
  shortest: 'length, shortest first',
  rooms: 'start time',
};

export const en = {
  slug: 'interval-scheduling',
  topic: 'greedy',
  level: 'Beginner',
  title: 'Interval scheduling',
  intro:
    'Many requests want the same room, each for an interval of time. Activity selection keeps as many non-clashing requests as possible, and the greedy rule that works is to keep, again and again, the compatible request that finishes earliest. Interval partitioning asks the opposite question: how few rooms hold every request?',
  summary:
    'Step through activity selection by earliest finish time, watch earliest-start and shortest-first lose, and partition intervals into the fewest rooms.',
  instruction:
    'Type intervals as start-end or load a preset, pick a rule, then step. Each row is one interval on the time line. Load “Shortest-first trap” and compare the three selection rules in the panel on the right.',
  intervalsLabel: 'Intervals (start-end)',
  ruleLabel: 'Greedy rule',
  rules: {
    finish: 'Select: earliest finish',
    start: 'Select: earliest start',
    shortest: 'Select: shortest first',
    rooms: 'Partition into rooms',
  },
  presetLabel: 'Intervals',
  presetPlaceholder: 'Load intervals…',
  presets: {
    classic: '11 activities',
    shortTrap: 'Shortest-first trap',
    startTrap: 'Earliest-start trap',
    lectures: 'A day of lectures',
  },
  random: 'Random intervals',
  errors: {
    format: 'Type intervals as start-end, for example 1-4, 3-5. The last valid intervals are back.',
    range: 'Keep every time between 0 and 24. The last valid intervals are back.',
    order: 'Every interval must end after it starts. The last valid intervals are back.',
    count: 'Use at most 12 intervals. The last valid intervals are back.',
  },
  newIntervalsNotice: 'New intervals loaded.',
  /** @param {string} rule */
  ruleNotice: (rule) => `Rule: ${rule}. The trace starts again.`,
  name,
  roomName,
  /** @param {number} n */
  timelineAria: (n) => `Time line of ${plural(n, 'interval')}, one per row, in scan order.`,
  /** @param {IntervalFrame} f @param {number} i @param {string} state */
  barLabel: (f, i, state) =>
    `${span(f, i)}${state ? `, ${state}` : ''}${f.room[i] >= 0 ? `, room ${roomName(f.room[i])}` : ''}`,
  lastFinishLabel: 'lastFinish',
  nowLabel: 'now',
  legend: {
    current: 'Scanned now',
    kept: 'Kept or placed',
    clash: 'Clashes with the scanned one',
    skipped: 'Skipped',
    freed: 'Last in the room that frees earliest',
  },
  markers: { current: '?', kept: '✓', clash: '!', skipped: '✗', freed: '↺' },
  stats: {
    kept: 'Kept',
    best: 'Most possible',
    rooms: 'Rooms',
    depth: 'Depth',
    checks: 'Clash checks',
  },
  keptTitle: 'Chosen, in the order kept',
  keptEmpty: 'nothing kept yet',
  roomsTitle: 'Room finish times (the min-heap)',
  roomsEmpty: 'no room open yet',
  /** @param {number} r @param {number} end */
  roomChip: (r, end) => `${roomName(r)}: ${end}`,
  compareTitle: 'Kept on these intervals',
  /** @param {number} k */
  compareRow: (k) => plural(k, 'interval'),
  practiceTitle: 'Check yourself',
  /**
   * @param {IntervalFrame} f
   * @param {number} best  The most compatible intervals, from the earliest-finish rule.
   * @param {{depth: number, at: number}} deep
   */
  describe(f, best, deep) {
    const n = f.intervals.length;
    const rooms = f.rule === 'rooms';
    switch (f.kind) {
      case 'start':
        return rooms
          ? `Put all ${plural(n, 'interval')} in rooms so that no two in one room clash, using as few rooms as possible. Intervals are half-open: [1, 4) and [4, 6) do not clash.`
          : `Keep as many of the ${plural(n, 'interval')} as possible with no two clashing. Intervals are half-open: [1, 4) and [4, 6) do not clash.`;
      case 'sort':
        return `Sort by ${SORT_KEY[f.rule]}: the rows now run in scan order, ${f.order.map(name).join(', ')}.`;
      case 'consider': {
        const s = f.intervals[f.current].start;
        if (rooms) {
          if (f.freed < 0) return `${span(f, f.current)}: no room is open yet.`;
          const end = f.roomEnds[f.freed];
          return `${span(f, f.current)}: the room that frees earliest is ${roomName(f.freed)}, free from ${end}. Is ${end} ≤ ${s}?`;
        }
        if (f.rule === 'finish') {
          if (f.lastFinish < 0) return `${span(f, f.current)}: nothing is kept yet, so it fits.`;
          return f.conflict < 0
            ? `${span(f, f.current)}: ${s} ≥ lastFinish ${f.lastFinish}, so it starts after every kept interval ends.`
            : `${span(f, f.current)}: ${s} < lastFinish ${f.lastFinish}, so it clashes with ${span(f, f.conflict)}.`;
        }
        return f.conflict < 0
          ? `${span(f, f.current)} clashes with none of the ${plural(f.chosen.length, 'kept interval')}.`
          : `${span(f, f.current)} clashes with the kept ${span(f, f.conflict)}.`;
      }
      case 'pick':
        return f.rule === 'finish'
          ? `Keep ${name(f.current)}; lastFinish becomes ${f.lastFinish}. ${plural(f.chosen.length, 'interval')} kept.`
          : `Keep ${name(f.current)}. ${plural(f.chosen.length, 'interval')} kept.`;
      case 'reject':
        return `Skip ${name(f.current)}: it clashes with ${name(f.conflict)}.`;
      case 'reuse': {
        const iv = f.intervals[f.current];
        return `Yes: ${name(f.current)} goes into ${roomName(f.freed)}, which is now busy until ${iv.end}.`;
      }
      case 'open': {
        const iv = f.intervals[f.current];
        const why =
          f.freed < 0
            ? ''
            : `No: every room is busy at ${iv.start}, and the earliest frees at ${f.roomEnds[f.freed]}. `;
        return `${why}Open room ${roomName(f.room[f.current])} for ${name(f.current)}. ${plural(f.roomEnds.length, 'room')} open.`;
      }
      case 'done': {
        if (rooms) {
          return `${plural(f.roomEnds.length, 'room')} hold every interval. At time ${deep.at}, ${plural(deep.depth, 'interval')} overlap, so no schedule can use fewer: the greedy count equals the depth.`;
        }
        const kept = f.chosen.map(name).join(', ') || 'none';
        const k = f.chosen.length;
        if (f.rule === 'finish') {
          return `Kept ${plural(k, 'interval')}: ${kept}. Each pick leaves the most time for the rest, so no compatible set is larger.`;
        }
        return k < best
          ? `Kept ${plural(k, 'interval')}: ${kept}. Earliest finish keeps ${best}, so this rule is not optimal: one counterexample is enough.`
          : `Kept ${plural(k, 'interval')}: ${kept}, as many as earliest finish here. That proves nothing about other inputs: try the trap presets.`;
      }
    }
  },
  takeaways: [
    'Activity selection: sort by finish time, then keep every interval that starts at or after the finish of the last one kept. One comparison per interval, so the cost is the O(n log n) sort.',
    'Exchange argument: let g be the interval that finishes first. In any optimal set, swap its first interval for g; g ends no later, so nothing else clashes and the set keeps its size. Repeating the argument on what is left proves the whole greedy set optimal.',
    'Natural rules fail. Earliest start keeps one long interval that blocks many short ones; shortest first keeps a short interval that clashes with two compatible ones.',
    'Interval partitioning: scan by start time and reuse the room that frees earliest, kept in a min-heap of finish times. It opens a new room only when every room is busy, so the room count equals the depth, the most intervals overlapping at one moment, which no schedule can beat.',
    'Load “Earliest-start trap”, step through it under each selection rule, then switch to rooms: the long interval forces 2 rooms although 3 short ones fit in one.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    ['Sort by finish or start time', 'O(n log n)', 'A comparison sort of n intervals.'],
    ['Activity selection scan', 'O(n)', 'One comparison of I.start with lastFinish per interval.'],
    [
      'Partitioning with a min-heap',
      'O(n log d)',
      'One heap operation per interval on at most d rooms, where d is the depth.',
    ],
    [
      'Checking each interval against every kept one',
      'O(n²)',
      'What a rule that is not sorted by finish time needs to test a clash.',
    ],
    ['Extra memory', 'O(n)', 'The sorted order, the chosen list and the heap.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Earliest finish runs on the 11 activities 1-4, 3-5, 0-6, 5-7, 3-9, 5-9, 6-10, 8-11, 8-12, 2-14, 12-16. How many does it keep?',
      answer: 4,
      unit: 'intervals',
      hints: [
        'The first one kept is 1-4, the earliest to finish.',
        'After 1-4 the next interval starting at 4 or later that finishes first is 5-7.',
      ],
      solution:
        'It keeps 1-4, 5-7, 8-11 and 12-16: 4 activities. Load “11 activities” to watch it.',
    },
    {
      type: 'number',
      prompt: 'How many rooms do the same 11 activities need?',
      answer: 6,
      unit: 'rooms',
      hints: [
        'The answer is the depth: the most intervals that overlap at one moment.',
        'Count the intervals that contain time 8.',
      ],
      solution:
        'At time 8, the intervals 3-9, 5-9, 6-10, 8-11, 8-12 and 2-14 all run, so at least 6 rooms are needed, and the greedy partition uses exactly 6.',
    },
    {
      type: 'choice',
      prompt: 'Which sort order makes the greedy activity selection optimal?',
      options: ['Earliest start time', 'Shortest length', 'Earliest finish time', 'Fewest clashes'],
      answer: 2,
      hints: [
        'The first pick should leave as much of the time line free as possible.',
        'Load the trap presets and compare the panel on the right.',
      ],
      solution:
        'Earliest finish leaves the most room for the rest, and the exchange argument proves it optimal. Earliest start and shortest first both have small counterexamples. Fewest clashes is also wrong in general, though the counterexample needs more intervals.',
    },
    {
      type: 'number',
      prompt: 'Earliest start runs on 0-10, 1-3, 4-6, 7-9. How many intervals does it keep?',
      answer: 1,
      unit: 'intervals',
      hints: [
        'It keeps 0-10 first, because 0 is the earliest start.',
        'Every other interval lies inside 0-10.',
      ],
      solution:
        'It keeps 0-10, and the other three all clash with it, so it keeps just 1. Earliest finish keeps 1-3, 4-6 and 7-9.',
    },
  ],
  nextTeaser:
    'Next up: Huffman coding, which builds the shortest prefix-free code by merging the two least frequent symbols again and again.',
};
