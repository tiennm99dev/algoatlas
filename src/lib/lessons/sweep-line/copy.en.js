/** @typedef {import('$lib/algo-engine/sweep-line.js').SweepFrame} SweepFrame */
/** @typedef {import('$lib/algo-engine/sweep-line.js').SweepEvent} SweepEvent */
/** @typedef {import('$lib/algo-engine/sweep-line.js').SweepHit} SweepHit */
/** @typedef {import('$lib/algo-engine/sweep-line.js').Point} Point */

/** @param {number} v */
const coord = (v) => {
  const rounded = Math.round(v * 100) / 100;
  return `${Math.abs(rounded - v) > 1e-9 ? '≈ ' : ''}${String(rounded).replace('-', '−')}`;
};
/** @param {Point} p */
const pt = (p) => `(${coord(p.x)}, ${coord(p.y)})`;
/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'sweep-line',
  topic: 'geometry',
  level: 'Advanced',
  title: 'Sweep line algorithms',
  intro:
    'Testing every pair of n segments costs n(n − 1)/2 checks, yet two segments can only meet where a vertical line passes through both. So slide such a line left to right, stopping only at end points, and keep just the segments under it: the active set. A 2D problem becomes a sequence of small 1D updates.',
  summary:
    'Sweep a vertical line over segments you drag, watch events and the active set, and find intersections with far fewer pair tests.',
  instruction:
    'Step through to move the line from event to event, and watch the active set change. Drag any end point, or focus one and press Shift + an arrow key. Load “Long parallel segments” and compare the pair tests of the two methods.',
  methodLabel: 'Method',
  methods: { any: 'Any crossing', all: 'All crossings' },
  presetLabel: 'Example',
  presets: {
    crossing: 'Some crossings',
    disjoint: 'No crossings',
    parallel: 'Long parallel segments',
    mesh: 'Grid of crossings',
    touching: 'Touching at an end',
  },
  addSegment: 'Add segment',
  /** @param {string} name @param {number} x @param {number} y */
  pointLabel: (name, x, y) => `End of segment ${name} at (${x}, ${y})`,
  planeLabel:
    'Segments on a coordinate plane with a vertical sweep line. Arrow keys move between end points; Shift + arrow moves one and Delete removes its segment.',
  /** @param {number} max */
  fullError: (max) => `Use at most ${max} segments.`,
  minError: 'Keep at least one segment.',
  legend: {
    sweep: 'Sweep line',
    active: 'Active: under the line',
    pair: 'Pair being tested',
    hit: 'They meet',
    done: 'Passed by the line',
    point: '× Where they meet',
  },
  activeTitle: 'Active set, lowest first',
  activeEmpty: 'empty',
  eventsTitle: 'Events, left to right',
  eventsEmpty: 'not sorted yet',
  hitsTitle: 'Meetings found',
  hitsEmpty: 'none yet',
  /** @param {SweepEvent} e @param {(id: number) => string} name */
  eventChip: (e, name) => `${e.type === 'start' ? '+' : '−'}${name(e.id)} x=${e.x}`,
  /** @param {SweepHit} h @param {(id: number) => string} name */
  hitChip: (h, name) => `${name(h.i)} × ${name(h.j)} ${pt(h.at)}`,
  compareTitle: 'Pair tests on these segments',
  compareRows: { any: 'Any crossing', all: 'All crossings', brute: 'Every pair' },
  stats: {
    x: 'Sweep line x',
    active: 'Active now',
    tests: 'Pair tests',
    hits: 'Meetings found',
    answer: 'Do any meet?',
  },
  pending: '…',
  yes: 'Yes',
  no: 'No',
  workedTitle:
    'Worked example: A from (0, 0) to (4, 0), B from (1, 2) to (3, 2), C from (5, 1) to (6, 1)',
  workedSteps: [
    'Sorted events: +A at x = 0, +B at 1, −B at 3, −A at 4, +C at 5, −C at 6.',
    'x = 0: A enters. The active set is A, and there is no neighbour to test.',
    'x = 1: B enters above A. They are neighbours, so test them: no meeting.',
    'x = 3: B leaves. It had no neighbour above, so nothing new becomes adjacent.',
    'x = 4: A leaves. x = 5 and 6: C enters and leaves alone. That is one pair test instead of three, and no segment meets another.',
  ],
  /**
   * @param {SweepFrame} f
   * @param {(id: number) => string} name
   */
  describe: (f, name) => {
    const event = f.eventAt >= 0 ? f.events[f.eventAt] : null;
    switch (f.kind) {
      case 'start':
        return `${plural(f.segments.length, 'segment', 'segments')}. All pairs would take ${(f.segments.length * (f.segments.length - 1)) / 2} tests.`;
      case 'sort':
        return `Sort the ${f.events.length} end points by x, with starts before ends on a tie, so segments touching at one x are under the line together.`;
      case 'arrive': {
        const e = /** @type {SweepEvent} */ (event);
        return e.type === 'start'
          ? `The line reaches x = ${e.x}, where ${name(e.id)} starts.`
          : `The line reaches x = ${e.x}, where ${name(e.id)} ends.`;
      }
      case 'insert':
        return `${name(/** @type {SweepEvent} */ (event).id)} joins the active set, which now holds ${plural(f.active.length, 'segment', 'segments')}.`;
      case 'check': {
        const [i, j] = /** @type {[number, number]} */ (f.pair);
        return f.pairHit
          ? `Test ${name(i)} and ${name(j)}: they meet at ${pt(f.hits[f.hits.length - 1].at)}.`
          : `Test ${name(i)} and ${name(j)}: they do not meet.`;
      }
      case 'remove':
        return `${name(/** @type {SweepEvent} */ (event).id)} leaves the active set, which now holds ${plural(f.active.length, 'segment', 'segments')}.`;
      case 'found': {
        const hit = f.hits[f.hits.length - 1];
        return `Found one: ${name(hit.i)} and ${name(hit.j)} meet. This method can stop here.`;
      }
      case 'done':
        if (f.method === 'any') {
          return f.hits.length
            ? `Stopped after ${plural(f.pairTests, 'pair test', 'pair tests')}: at least one pair meets.`
            : `No segments meet. That took only ${plural(f.pairTests, 'pair test', 'pair tests')}.`;
        }
        return `All done: ${plural(f.hits.length, 'meeting', 'meetings')} found with ${plural(f.pairTests, 'pair test', 'pair tests')}.`;
    }
  },
  takeaways: [
    'A sweep turns geometry into events: sort the x coordinates of all end points, then handle them in order. Nothing changes between two events.',
    'The active set holds the segments under the line. Each segment enters once and leaves once, so there are 2n events and 2n updates.',
    'Any crossing (Shamos-Hoey): keep the active set ordered by height in a balanced tree. Before the first crossing, two segments that meet must become neighbours, so testing neighbours on each insert and remove is enough: O(n log n).',
    'All crossings needs more. Testing each new segment against the whole active set is simple and correct, but it is O(n²) when everything overlaps. Bentley-Ottmann adds crossing points as events and swaps neighbours there, for O((n + k) log n) with k crossings.',
    'Load “Long parallel segments”: 8 segments give 28 tests for all crossings, but far fewer for any crossing. Then drag one end across its neighbour, and watch the first method stop early.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    ['All pairs, no sweep', 'O(n²) time', 'One constant-time test for each of n(n − 1)/2 pairs.'],
    [
      'Any crossing (Shamos-Hoey)',
      'O(n log n) time, O(n) memory',
      '2n events, each with a tree update and at most two neighbour tests.',
    ],
    [
      'All crossings, this lesson’s version',
      'O(n log n + a) time',
      'Sorting, plus a tests in total, where a counts pairs that overlap in x. Worst case a is about n².',
    ],
    [
      'All crossings (Bentley-Ottmann)',
      'O((n + k) log n) time',
      'Crossings become events in a priority queue, each swapping two neighbours.',
    ],
  ],
  nextTeaser:
    'Next, Range trees and orthogonal range search answer which points lie in a rectangle, using a tree of trees.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many events does a sweep over 5 segments have?',
      answer: 10,
      unit: 'events',
      hints: ['Each segment has a start and an end.'],
      solution: 'Two per segment: 5 · 2 = 10.',
    },
    {
      type: 'number',
      prompt: 'Without a sweep, how many pairs must be tested among 8 segments?',
      answer: 28,
      unit: 'pairs',
      hints: ['n(n − 1) / 2.'],
      solution: '8 · 7 / 2 = 28.',
    },
    {
      type: 'number',
      prompt:
        'Segments A from (0, 0) to (4, 0), B from (1, 2) to (3, 2) and C from (5, 1) to (6, 1) are swept. What is the largest size the active set reaches?',
      answer: 2,
      unit: 'segments',
      hints: [
        'Write the x range of each segment.',
        'A covers 0 to 4, B covers 1 to 3 and C covers 5 to 6.',
      ],
      solution:
        'A and B overlap in x, while C starts after both have ended. So at most 2 are active at once.',
    },
    {
      type: 'choice',
      prompt: 'When a start and an end share one x, why is the start handled first?',
      options: [
        'It makes the sort faster',
        'So that segments touching at that x are both active and get tested',
        'Because ends never matter',
      ],
      answer: 1,
      hints: ['Imagine one segment ending exactly where another begins.'],
      solution:
        'If the end went first, the segment would leave before the new one arrived, and a touch at that point would never be tested.',
    },
    {
      type: 'choice',
      prompt: 'Why can the any-crossing sweep test only neighbours in the active set?',
      options: [
        'Because segments far apart in height can never meet',
        'Because until the first crossing the order is unchanged, and just before two segments meet they must be adjacent',
        'Because a balanced tree can only reach neighbours',
      ],
      answer: 1,
      hints: ['What lies between two segments right before they touch?'],
      solution:
        'Just left of the first meeting point nothing lies between the two segments, so they have become neighbours by an insert or a remove, and were tested then.',
    },
    {
      type: 'text',
      prompt: 'What is the running time of the any-crossing sweep on n segments, in big-O?',
      accept: ['O(n log n)', 'n log n'],
      hints: ['2n events, each with a balanced tree operation.'],
      solution:
        'O(n log n): sorting takes that long, and each of the 2n events does a tree update and at most two constant-time tests.',
    },
  ],
};
