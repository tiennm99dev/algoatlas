/** @typedef {import('$lib/algo-engine/segment-intersection.js').SegmentFrame} SegmentFrame */
/** @typedef {import('$lib/algo-engine/segment-intersection.js').Point} Point */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');

/** A coordinate with at most two decimals; `≈` says when it was rounded. */
/** @param {number} v */
export const coord = (v) => {
  const rounded = Math.round(v * 100) / 100;
  return `${Math.abs(rounded - v) > 1e-9 ? '≈ ' : ''}${num(rounded)}`;
};

/** @param {Point} p */
const pt = (p) => `(${coord(p.x)}, ${coord(p.y)})`;

const NAMES = ['o1', 'o2', 'o3', 'o4'];
const TESTED = ['a', 'b', 'c', 'd'];
const LINE = ['cd', 'cd', 'ab', 'ab'];

/** @param {number | null} v */
const side = (v) => (v === null ? '' : v > 0 ? 'left' : v < 0 ? 'right' : 'on the line');

export const en = {
  slug: 'segment-intersection',
  topic: 'geometry',
  level: 'Intermediate',
  title: 'Segment intersection',
  intro:
    'Do two segments meet? Solving for the crossing point means division and special cases for parallel lines. Four orientation tests decide it exactly: the segments cross when each one’s ends lie on opposite sides of the other. A collinear end needs one extra check, and only then do you divide to find where.',
  summary:
    'Decide whether two segments meet from four orientation signs, including collinear cases, then compute the intersection point.',
  instruction:
    'Drag any end point, or focus one and press Shift + an arrow key. The segments turn red when they meet, with an × at the spot. Step through to see o1 to o4 one at a time, then load the collinear examples, where all four signs are zero.',
  presetLabel: 'Example',
  presets: {
    crossing: 'Proper crossing',
    tee: 'T junction',
    overlap: 'Collinear overlap',
    endToEnd: 'Collinear, end to end',
    gap: 'Collinear with a gap',
    parallel: 'Parallel',
    lineOnly: 'Lines cross, segments don’t',
  },
  /** @param {string} name @param {number} x @param {number} y */
  pointLabel: (name, x, y) => `End point ${name} at (${x}, ${y})`,
  planeLabel:
    'Two segments, AB and CD, on a coordinate plane. Arrow keys move between the end points; Shift + arrow moves one.',
  legend: {
    idle: 'Segment, not known to meet',
    hit: 'Segments meet',
    line: 'Dashed: the line tested against',
    tested: 'End point being tested',
    shared: 'Shared stretch',
    point: '× Where they meet',
  },
  tableTitle: 'Orientation signs',
  tableHeads: { name: 'Test', value: 'Value', side: 'Side' },
  /** @param {number} i */
  testName: (i) => `${NAMES[i]}: ${TESTED[i]} against ${LINE[i]}`,
  /** @param {number} v */
  value: num,
  side,
  pending: '…',
  stats: {
    verdict: 'Result',
    tests: 'Orientation tests',
    boxChecks: 'Box checks',
    t: 't along ab',
    where: 'Where',
  },
  outcomes: {
    cross: 'Proper crossing',
    touch: 'They touch',
    overlap: 'They overlap',
    none: 'No intersection',
  },
  /** @param {{ num: number, den: number }} t */
  fraction: (t) => (t.den === 1 ? num(t.num) : `${num(t.num)} / ${t.den}`),
  pt,
  /** @param {Point} p @param {Point} q */
  stretch: (p, q) => `${pt(p)} to ${pt(q)}`,
  none: '—',
  workedTitle: 'Worked example: a = (0, 0), b = (6, 3), c = (0, 3), d = (6, 0)',
  workedSteps: [
    'Are a and b on opposite sides of cd? o1 = orient(c, d, a) = −18 and o2 = orient(c, d, b) = 18. Opposite signs.',
    'Are c and d on opposite sides of ab? o3 = orient(a, b, c) = 18 and o4 = orient(a, b, d) = −18. Opposite signs again, so the segments cross.',
    'r = b − a = (6, 3) and s = d − c = (6, −3), so r × s = −18 − 18 = −36.',
    '(c − a) × s = (0, 3) × (6, −3) = 0 − 18 = −18, so t = −18 / −36 = 1/2.',
    'The point is a + t · r = (0, 0) + ½ · (6, 3) = (3, 1.5).',
  ],
  /** @param {SegmentFrame} f */
  describe: (f) => {
    switch (f.kind) {
      case 'start':
        return `Segment ab from ${pt(f.a)} to ${pt(f.b)}, and cd from ${pt(f.c)} to ${pt(f.d)}. Do they meet?`;
      case 'orient': {
        const i = /** @type {number} */ (f.at);
        const v = /** @type {number} */ (f.o[i]);
        return `${NAMES[i]} = ${num(v)}: ${TESTED[i]} is ${
          v === 0 ? 'on the line through' : `on the ${side(v)} of`
        } ${LINE[i]}.`;
      }
      case 'straddle':
        return f.passed
          ? 'a and b are on opposite sides of cd, and c and d are on opposite sides of ab. They cross.'
          : 'The ends do not straddle both ways, so there is no proper crossing. A collinear end could still touch.';
      case 'onSegment': {
        const i = /** @type {number} */ (f.at);
        if (f.o[i] !== 0) return `${NAMES[i]} is not 0, so ${TESTED[i]} is not on ${LINE[i]}.`;
        return f.passed
          ? `${NAMES[i]} = 0 and ${TESTED[i]} is inside the box of ${LINE[i]}: ${TESTED[i]} lies on the segment.`
          : `${NAMES[i]} = 0, but ${TESTED[i]} is outside the box of ${LINE[i]}: on the line, past the segment.`;
      }
      case 'vectors':
        return `They meet. Directions: r = ${pt(/** @type {Point} */ (f.r))} and s = ${pt(/** @type {Point} */ (f.s))}.`;
      case 'shared':
        return f.shared
          ? `r × s = 0, so they are parallel and on one line. The sorted middle ends give the shared stretch, ${pt(f.shared[0])} to ${pt(f.shared[1])}.`
          : `r × s = 0, and the sorted middle ends coincide: they share the single point ${pt(/** @type {Point} */ (f.point))}.`;
      case 'parameter':
        return `t = ((c − a) × s) / (r × s) = ${en.fraction(/** @type {{ num: number, den: number }} */ (f.t))}, the fraction of the way along ab.`;
      case 'point':
        return `a + t · r = ${pt(/** @type {Point} */ (f.point))}.`;
      case 'done':
        if (f.outcome === 'none') return 'No check passed, so the segments do not meet.';
        if (f.outcome === 'overlap')
          return `The segments overlap from ${pt(/** @type {[Point, Point]} */ (f.shared)[0])} to ${pt(/** @type {[Point, Point]} */ (f.shared)[1])}.`;
        return f.outcome === 'cross'
          ? `The segments cross at ${pt(/** @type {Point} */ (f.point))}.`
          : `The segments touch at ${pt(/** @type {Point} */ (f.point))}.`;
    }
  },
  takeaways: [
    'Segments cross properly exactly when o1 and o2 have opposite signs and o3 and o4 have opposite signs. Both pairs matter: one alone only says a line is crossed.',
    'An orientation of 0 means an end is on the other segment’s line. It is on the segment only if it is also inside that segment’s bounding box.',
    'When all four are 0, the segments are collinear: sort the four ends, and the middle two are the shared stretch if the segments really overlap.',
    'The yes-or-no answer needs no division. Only the position does, as t = ((c − a) × s) / (r × s), so keep it as a fraction when you need it exact.',
    'Load “Lines cross, segments don’t” and step: o3 and o4 differ, but o1 and o2 do not. Now drag B past the line of CD and watch both pairs differ.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'Do they meet?',
      'O(1) time, O(1) memory',
      'Four orientation tests and at most four box checks.',
    ],
    ['Where do they meet?', 'O(1) time', 'Two more cross products and one division.'],
    [
      'All pairs among n segments',
      'O(n²) time',
      'One constant-time test per pair; a sweep line does better when few meet.',
    ],
  ],
  nextTeaser:
    'Next, Polygon area and point in polygon turns edges into an area sum and a ray test.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Segments from (0, 0) to (6, 3) and from (0, 3) to (6, 0) cross. What is the y coordinate of the crossing?',
      answer: 1.5,
      hints: [
        'Use t = ((c − a) × s) / (r × s).',
        't works out to 1/2. Then read y from a + t · r.',
      ],
      solution:
        'r = (6, 3), s = (6, −3), r × s = −36 and (c − a) × s = −18, so t = 1/2. The point is (3, 1.5).',
    },
    {
      type: 'multi',
      prompt: 'Which of these segments meet the segment from (0, 0) to (4, 0)?',
      options: ['(2, 0) to (2, 3)', '(5, 0) to (8, 0)', '(1, 1) to (3, 1)', '(4, 0) to (6, 2)'],
      answers: [0, 3],
      hints: [
        'A touch at one end point still counts as meeting.',
        'The second one is on the same line, but past the end.',
      ],
      solution:
        'The first touches at (2, 0), and the last touches at (4, 0). The second is collinear with a gap, and the third is parallel.',
    },
    {
      type: 'choice',
      prompt:
        'For a = (1, 1), b = (5, 3), c = (8, 1) and d = (8, 7), o3 and o4 have opposite signs. What can you conclude?',
      options: [
        'The segments cross',
        'c and d are on opposite sides of the line through a and b, but you still need o1 and o2',
        'The segments are collinear',
      ],
      answer: 1,
      hints: ['o3 and o4 only compare c and d with the line through a and b.'],
      solution:
        'One straddle only says the line through ab passes between c and d. Here a and b are both left of cd, so the segments do not meet.',
    },
    {
      type: 'number',
      prompt:
        'Segments from (1, 1) to (7, 4) and from (3, 2) to (11, 6) overlap. What is the x coordinate of the point where the shared stretch ends on the right?',
      answer: 7,
      hints: [
        'They are collinear, so sort the four ends by x.',
        'Sorted x values are 1, 3, 7, 11. Take the middle two.',
      ],
      solution: 'The middle two ends are (3, 2) and (7, 4), so the shared stretch ends at x = 7.',
    },
    {
      type: 'choice',
      prompt: 'Why does an orientation of 0 need a bounding-box check as well?',
      options: [
        'Because the cross product may have rounded to 0',
        'Because 0 only says the point is on the infinite line, not on the segment',
        'Because the box check is faster than the orientation test',
      ],
      answer: 1,
      hints: ['What does orient see: the segment, or the line through it?'],
      solution:
        'orient compares a point with a whole line. A point on that line can still be past either end of the segment, which the box check rules out.',
    },
  ],
};
