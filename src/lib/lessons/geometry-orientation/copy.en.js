/** @typedef {import('$lib/algo-engine/geometry-orientation.js').OrientationFrame} OrientationFrame */
/** @typedef {import('$lib/algo-engine/geometry-orientation.js').Point} Point */
/** @typedef {import('$lib/algo-engine/geometry-orientation.js').Turn} Turn */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');
/** @param {Point} p */
const pt = (p) => `(${num(p.x)}, ${num(p.y)})`;
/** @param {number} v */
const float = (v) => (v === 0 ? '0' : v.toExponential(2).replace(/-/g, '−'));

/** @param {number} v @returns {Turn} */
const exactTurn = (v) => (v > 0 ? 'left' : v < 0 ? 'right' : 'collinear');

/** @type {Record<Turn, string>} */
const TURN = { left: 'Left turn', right: 'Right turn', collinear: 'Collinear' };

export const en = {
  slug: 'geometry-orientation',
  topic: 'geometry',
  level: 'Beginner',
  title: 'Points, vectors and orientation',
  intro:
    'Almost all computational geometry reduces to one question: going from a to b, is c on the left, on the right, or straight ahead? The cross product answers it with two multiplications and a subtraction, with no angles and no division. On whole numbers the answer is exact, and on floats it can be wrong.',
  summary:
    'Compute dot and cross products on points you drag, read the orientation test from the sign, and see floats get it wrong.',
  instruction:
    'Drag A, B or C, or focus a point and press Shift + an arrow key to move it. The sign of the cross product and the turn update as you go. Step back to see the two vectors and each product on their own, then load the float trap.',
  presetLabel: 'Example',
  presets: {
    left: 'Left turn',
    right: 'Right turn',
    collinear: 'Collinear',
    rightAngle: 'Right angle',
    obtuse: 'Obtuse angle',
    floatTrap: 'Float trap',
  },
  /** @param {string} name @param {number} x @param {number} y */
  pointLabel: (name, x, y) => `Point ${name} at (${x}, ${y})`,
  planeLabel:
    'A coordinate plane with points A, B and C and the vectors from A. Arrow keys move between the points; Shift + arrow moves one.',
  legend: {
    u: 'u = b − a',
    v: 'v = c − a',
    left: 'Triangle: left turn',
    right: 'Triangle: right turn',
  },
  stats: {
    dot: 'Dot u · v',
    cross: 'Cross u × v',
    angle: 'Angle at a',
    area: 'Triangle area',
    turn: 'a → b → c',
    multiplications: 'Multiplications',
  },
  pending: '…',
  angles: {
    acute: 'Acute (dot > 0)',
    right: 'Right (dot = 0)',
    obtuse: 'Obtuse (dot < 0)',
    none: 'None: a zero vector',
  },
  turns: TURN,
  precisionTitle: 'The same points in tenths',
  precisionHint: 'Read each coordinate as x / 10, as a program holding 0.1 and 0.3 would.',
  precisionRows: {
    exact: 'Exact cross',
    float: 'Float cross, bare sign',
    epsilon: 'Float cross with |value| < 10⁻⁹ as 0',
  },
  precisionWrong: 'Floats get this one wrong.',
  precisionFine: 'Floats agree this time.',
  /** @param {number} crossValue */
  exactInTenths: (crossValue) => num(crossValue / 100),
  float,
  workedTitle: 'Worked example: a = (1, 1), b = (5, 2), c = (3, 6)',
  workedSteps: [
    'Subtract a from the other two: u = b − a = (4, 1) and v = c − a = (2, 5).',
    'Dot product: 4 · 2 + 1 · 5 = 13. It is positive, so the angle at a is acute.',
    'Cross product: 4 · 5 − 1 · 2 = 18. It is positive, so a → b → c turns left.',
    'The triangle’s area is half the size of the cross product: 18 / 2 = 9.',
  ],
  /** @param {OrientationFrame} f */
  describe: (f) => {
    switch (f.kind) {
      case 'start':
        return `Three points: a = ${pt(f.a)}, b = ${pt(f.b)}, c = ${pt(f.c)}. Going from a to b, where is c?`;
      case 'u':
        return `u = b − a = ${pt(/** @type {Point} */ (f.u))}: the direction from a to b.`;
      case 'v':
        return `v = c − a = ${pt(/** @type {Point} */ (f.v))}: the direction from a to c.`;
      case 'dot':
        if (f.angle === 'none')
          return `Dot = ${num(/** @type {number} */ (f.dot))}, but a vector is zero, so there is no angle at a.`;
        return `Dot = u.x · v.x + u.y · v.y = ${num(/** @type {number} */ (f.dot))}. Its sign tells the angle at a: ${
          f.angle === 'acute'
            ? 'positive, so acute'
            : f.angle === 'obtuse'
              ? 'negative, so obtuse'
              : 'zero, so a right angle'
        }.`;
      case 'cross':
        return `Cross = u.x · v.y − u.y · v.x = ${num(/** @type {number} */ (f.cross))}. Its size is twice the triangle’s area, and its sign is the answer.`;
      case 'precision':
        return f.floatTurn === exactTurn(/** @type {number} */ (f.cross))
          ? `In tenths the float sum gives ${float(/** @type {number} */ (f.floatCross))}, the same sign as the exact sum.`
          : `In tenths the float sum gives ${float(/** @type {number} */ (f.floatCross))}, but the exact answer is ${num(/** @type {number} */ (f.cross) / 100)}. Rounding changed the verdict.`;
      case 'done':
        if (f.turn === 'left')
          return `Cross ${num(/** @type {number} */ (f.cross))} > 0: c is on the left of a → b, a counter-clockwise turn.`;
        if (f.turn === 'right')
          return `Cross ${num(/** @type {number} */ (f.cross))} < 0: c is on the right of a → b, a clockwise turn.`;
        return 'Cross = 0: the three points are on one line, so the triangle has no area.';
    }
  },
  takeaways: [
    'Dot product u · v = u.x · v.x + u.y · v.y: its sign says whether the angle between the vectors is acute, right or obtuse.',
    'Cross product u × v = u.x · v.y − u.y · v.x: its sign says which way v turns from u, and its size is the area of the parallelogram they span.',
    'orient(a, b, c) is the cross product of b − a and c − a: positive is left, negative is right, zero is collinear.',
    'Work in whole numbers when you can: scale decimal inputs up to integers, and the cross product is exact. With coordinates below about 10⁹ it cannot overflow a 64-bit integer. An epsilon is only a fallback for real floats.',
    'Load the float trap: the exact answer is collinear, yet floats call it a right turn by about 10⁻¹⁷. Then nudge C by one cell and watch the sign flip for real.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Dot or cross product', 'O(1) time', 'Two multiplications and one addition or subtraction.'],
    [
      'Orientation test',
      'O(1) time, O(1) memory',
      'Two subtractions per vector, then one cross product.',
    ],
    [
      'Angle by atan2 instead',
      'O(1), but slower and inexact',
      'Trigonometry returns rounded floats, and the comparison needs care near ±π.',
    ],
  ],
  nextTeaser:
    'Next, Segment intersection uses four orientation tests to decide whether two segments meet.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'For a = (0, 0), b = (4, 1) and c = (1, 3), what is the cross product of b − a and c − a?',
      answer: 11,
      hints: ['u = (4, 1) and v = (1, 3).', 'u.x · v.y − u.y · v.x = 4 · 3 − 1 · 1.'],
      solution: 'u = (4, 1), v = (1, 3), so cross = 12 − 1 = 11. It is positive: a left turn.',
    },
    {
      type: 'choice',
      prompt:
        'Walking from a = (2, 2) to b = (6, 2), then on towards c = (6, 0), which way do you turn?',
      options: ['Left', 'Right', 'Straight on'],
      answer: 1,
      hints: [
        'Compute u = b − a and v = c − a.',
        'u = (4, 0), v = (4, −2). Find the sign of the cross product.',
      ],
      solution: 'Cross = 4 · (−2) − 0 · 4 = −8. It is negative, so c is on the right of a → b.',
    },
    {
      type: 'number',
      prompt: 'What is the dot product of u = (3, 4) and v = (4, −3)?',
      answer: 0,
      hints: ['u.x · v.x + u.y · v.y.'],
      solution:
        '3 · 4 + 4 · (−3) = 12 − 12 = 0. A zero dot product means the vectors are perpendicular.',
    },
    {
      type: 'number',
      prompt: 'What is the area of the triangle with corners (1, 1), (5, 1) and (2, 4)?',
      answer: 6,
      hints: ['The area is half the size of the cross product.', 'u = (4, 0) and v = (1, 3).'],
      solution: 'Cross = 4 · 3 − 0 · 1 = 12, so the area is 12 / 2 = 6.',
    },
    {
      type: 'choice',
      prompt:
        'Your points are in hundredths of a metre as decimals. What is the most reliable way to test for collinearity?',
      options: [
        'Compare the slopes (b.y − a.y) / (b.x − a.x) with ==',
        'Compare the cross product of the floats with 0 using ==',
        'Scale the coordinates to whole numbers and test the exact cross product',
      ],
      answer: 2,
      hints: [
        'Which of these can be off by rounding? Which one divides by zero on a vertical line?',
      ],
      solution:
        'Whole numbers give an exact cross product, so 0 means truly collinear. Slopes divide by zero on vertical lines, and float sums can round a true 0 into something tiny.',
    },
  ],
};
