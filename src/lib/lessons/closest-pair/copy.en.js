/** @typedef {import('$lib/algo-engine/closest-pair.js').ClosestFrame} ClosestFrame */

import { letter } from '$lib/components/graph-editor.js';

/** A squared distance as a plain distance. @param {number} d2 */
const fmt = (d2) => (d2 === Infinity ? '∞' : Math.sqrt(d2).toFixed(2));

/** @param {[number, number] | null} pair */
const pairText = (pair) => (pair ? `${letter(pair[0])}–${letter(pair[1])}` : 'none');

/** @param {number} x @param {string} word */
const plural = (x, word) => `${x} ${word}${x === 1 ? '' : 's'}`;

/** @param {number} n */
const allPairs = (n) => (n * (n - 1)) / 2;

export const en = {
  slug: 'closest-pair',
  topic: 'divide-and-conquer',
  level: 'Advanced',
  title: 'Closest pair of points',
  intro:
    'Given n points in the plane, find the two that are closest together. Checking every pair costs O(n²). Divide and conquer splits the points by a vertical line, solves each half, and then only has to look at a thin strip around the line, which brings the cost down to O(n log n).',
  summary:
    'Step through the divide-and-conquer closest-pair algorithm: split the points by x, solve each half, and check only the strip of width 2d around the dividing line.',
  instruction:
    'Click empty space on the plane to add a point and click a point to remove it, or type the points. Then step: watch the dividing line, the strip of width 2d, and how few pairs inside the strip are measured.',
  pointsLabel: 'Points (x, y)',
  presetLabel: 'Starting points',
  presetPlaceholder: 'Load points…',
  presets: {
    example: 'Example',
    crowded: 'Crowded strip',
    clusters: 'Two clusters',
  },
  shuffle: 'Random points',
  errors: {
    format:
      'Type points as x, y pairs, such as “(10, 80) (22, 30)”. The last valid points are back.',
    range: 'Keep every coordinate between 0 and 99. The last valid points are back.',
    count: 'Use between 2 and 16 points. The last valid points are back.',
    duplicate: 'Every point must be different. The last valid points are back.',
  },
  newPointsNotice: 'New points loaded.',
  /** @param {number} id @param {number} x @param {number} y */
  addedNotice: (id, x, y) => `Added point ${letter(id)} at (${x}, ${y}). The trace starts again.`,
  /** @param {number} x @param {number} y */
  removedNotice: (x, y) => `Removed the point at (${x}, ${y}). The trace starts again.`,
  fullNotice: 'The plane holds at most 16 points. Remove one first.',
  minNotice: 'Keep at least 2 points.',
  takenNotice: 'A point is already there.',
  /** @param {number} n */
  planeLabel: (n) =>
    `Plane with ${plural(n, 'point')}, x to the right and y up, from 0 to 99. Click empty space to add a point.`,
  /** @param {number} id @param {number} x @param {number} y @param {string} state */
  pointLabel: (id, x, y, state) =>
    `Point ${letter(id)} at (${x}, ${y})${state ? `, ${state}` : ''}. Press Enter to remove it.`,
  letter,
  states: /** @type {Record<string, string>} */ ({
    compare: 'being measured',
    sorted: 'in the best pair of this call',
    frontier: 'in the strip',
    path: 'in the closest pair',
  }),
  markers: /** @type {Record<string, string>} */ ({
    compare: '?',
    sorted: '★',
    frontier: 'S',
    path: '★',
  }),
  legend: {
    compare: 'Pair being measured',
    sorted: 'Best pair of this call',
    frontier: 'In the strip',
    path: 'Closest pair',
    line: 'Dividing line',
    band: 'Strip of width 2d',
    faded: 'Faded: outside this call',
  },
  stats: {
    checks: 'Distance computations',
    pairs: 'All pairs, n(n − 1)/2',
    d: 'd in this call',
    best: 'Best so far',
  },
  /** @param {number} d2 */
  fmt,
  pairText,
  stackTitle: 'Open calls (x-sorted positions)',
  stackEmpty: 'none',
  /** @param {number} lo @param {number} hi */
  rangeChip: (lo, hi) => `[${lo}–${hi}]`,
  practiceTitle: 'Check yourself',
  /** @param {ClosestFrame} f */
  describe(f) {
    const ids = (/** @type {number[]} */ list) => list.map((id) => letter(id)).join(', ');
    const [lo, hi] = f.range ?? [0, 0];
    const count = hi - lo + 1;
    switch (f.kind) {
      case 'start':
        return `Find the two closest of ${f.points.length} points. Checking every pair would take ${allPairs(f.points.length)} distance computations.`;
      case 'sort':
        return `Sort the points by x once: ${ids(f.points.map((p) => p.id))}. Every call works on a run of this order.`;
      case 'split': {
        const left = Math.floor(count / 2);
        return `Split these ${count} points at x = ${f.line}: solve the left ${left} and the right ${count - left} on their own.`;
      }
      case 'base':
        return `Only ${count} points: check every pair directly.`;
      case 'brute': {
        const [a, b] = /** @type {[number, number]} */ (f.checking);
        const v = f.closer ? 'the best in this call so far' : `not closer than d = ${fmt(f.d2)}`;
        return `dist(${letter(a)}, ${letter(b)}) = ${fmt(distOf(f, a, b))}: ${v}.`;
      }
      case 'combine':
        return `Both halves are solved: d = min(dL, dR) = ${fmt(f.d2)}, from ${pairText(f.pair)}. A closer pair would have to cross the line x = ${f.line}, so both its points lie within d of it.`;
      case 'strip':
        return f.strip.length < 2
          ? `The strip |x − ${f.line}| < ${fmt(f.d2)} holds ${plural(f.strip.length, 'point')}: no pair can cross the line closer than d.`
          : `The strip |x − ${f.line}| < ${fmt(f.d2)} holds ${f.strip.length} points, in y order: ${ids(f.strip)}. Each is checked only against the next points less than d higher.`;
      case 'strip-check': {
        const [a, b] = /** @type {[number, number]} */ (f.checking);
        const v = distOf(f, a, b);
        return f.closer
          ? `dist(${letter(a)}, ${letter(b)}) = ${fmt(v)} < d: a closer pair crosses the line, so d = ${fmt(f.d2)}.`
          : `dist(${letter(a)}, ${letter(b)}) = ${fmt(v)}, not less than d = ${fmt(f.d2)}.`;
      }
      case 'return':
        return `This call returns d = ${fmt(f.d2)}, from ${pairText(f.pair)}.`;
      case 'done':
        return `The closest pair is ${pairText(f.pair)} at distance ${fmt(f.d2)} (√${f.d2}), found with ${plural(f.checks, 'distance computation')} instead of ${allPairs(f.points.length)}.`;
    }
  },
  takeaways: [
    'Sort the points by x once. Each call splits its points at the median into a left and a right half by a vertical line, and solves both halves recursively.',
    'Let d = min(dL, dR). Any pair closer than d must cross the line, so both of its points lie less than d from it: only the strip of width 2d matters.',
    'In y order, a strip point only needs the next points less than d higher. Points on one side are at least d apart, so a d × 2d box holds at most 8 of them, and each point is checked against at most 7 others: the strip costs O(n).',
    'With the halves merged by y as in merge sort, T(n) = 2T(n/2) + O(n) = O(n log n). Sorting the strip again in every call gives O(n log² n); checking every pair is O(n²).',
    'Load “Crowded strip” and step through the top call: many points sit near the line, yet each strip point is measured against only a few neighbours above it.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    [
      'Divide and conquer, halves merged by y',
      'O(n log n)',
      'T(n) = 2T(n/2) + O(n): the strip check is linear.',
    ],
    [
      'Strip sorted again in every call',
      'O(n log² n)',
      'T(n) = 2T(n/2) + O(n log n), master theorem case 2.',
    ],
    ['Check every pair', 'O(n²)', 'n(n − 1)/2 distances.'],
    ['Extra memory', 'O(n)', 'The x-sorted copy, the strip, and a log₂ n call stack.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'On the Example points, step to the top call’s strip. How many points does the strip of width 2d around x = 53 hold?',
      answer: 5,
      unit: 'points',
      hints: [
        'After both halves, d = √313 ≈ 17.69.',
        'Count the points with 53 − 17.69 < x < 53 + 17.69, that is 35.31 < x < 70.69.',
      ],
      solution:
        'The points with x = 41, 48, 53, 62 and 70 are inside. The point at x = 35 misses by 0.31, because 18² = 324 is not less than 313.',
    },
    {
      type: 'number',
      prompt:
        'In the y-sorted strip, against at most how many later points must each point be checked?',
      answer: 7,
      unit: 'points',
      hints: [
        'Look at the d × 2d rectangle just above the point, split by the line.',
        'Each d/2 × d/2 square of it holds at most one point, because points on one side are at least d apart.',
      ],
      solution:
        'The d × 2d rectangle above a strip point splits into eight d/2 × d/2 squares, and each square holds at most one point. One of those points is the point itself, so at most 7 others need a check.',
    },
    {
      type: 'text',
      prompt:
        'Solve T(n) = 2T(n/2) + n, the cost when the halves are merged by y. Give the answer in O-notation.',
      accept: ['O(n log n)', 'n log n', 'Θ(n log n)', 'O(nlogn)'],
      hints: ['c = log₂ 2 = 1 matches f(n) = n.', 'Master theorem case 2 adds one log.'],
      solution: 'a = 2, b = 2, c = 1 and f(n) = Θ(n), so case 2 gives Θ(n log n).',
    },
    {
      type: 'choice',
      prompt: 'If every call sorts its strip by y from scratch, what does the algorithm cost?',
      options: ['O(n)', 'O(n log n)', 'O(n log² n)', 'O(n²)'],
      answer: 2,
      hints: [
        'Sorting the strip adds O(n log n) to f(n).',
        'T(n) = 2T(n/2) + n log n is case 2 with p = 1.',
      ],
      solution:
        'T(n) = 2T(n/2) + Θ(n log n) has f(n) = Θ(n¹ · log n) with c = 1, so case 2 gives Θ(n log² n). Passing the halves up already merged by y keeps the combine step at O(n).',
    },
    {
      type: 'choice',
      prompt: 'Why can the combine step ignore points farther than d from the dividing line?',
      options: [
        'They were already sorted by y',
        'A pair closer than d has both points less than d from the line',
        'They belong to no half',
        'Only the median point can be in a crossing pair',
      ],
      answer: 1,
      hints: [
        'A crossing pair has one point on each side.',
        'Its horizontal distance is at least the distance from either point to the line.',
      ],
      solution:
        'If p is left of the line and q right of it, then line − p.x ≤ q.x − p.x ≤ dist(p, q) < d, and the same for q. So both points of any closer crossing pair lie in the strip.',
    },
  ],
  nextTeaser:
    'Next up: Practice: divide and conquer problems, where you write the combine step for maximum subarray and majority element.',
};

/** Squared distance between two points of a frame, by id. @param {ClosestFrame} f @param {number} a @param {number} b */
function distOf(f, a, b) {
  const p = /** @type {{x: number, y: number}} */ (f.points.find((q) => q.id === a));
  const q = /** @type {{x: number, y: number}} */ (f.points.find((r) => r.id === b));
  return (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
}
