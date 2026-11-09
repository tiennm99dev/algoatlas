/** @typedef {import('$lib/algo-engine/convex-hull.js').HullFrame} HullFrame */
/** @typedef {import('$lib/algo-engine/convex-hull.js').HullPoint} HullPoint */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');
/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'convex-hull',
  topic: 'geometry',
  level: 'Intermediate',
  title: 'Convex hull',
  intro:
    'The convex hull is the smallest convex polygon around a set of points, the shape a rubber band snaps to. Sort the points, then walk them with a stack: whenever the newest three make a turn that is not left, the middle one cannot be a corner, so pop it. Each point is pushed once and popped at most once, so after an O(n log n) sort the scan is only O(n).',
  summary:
    'Build the convex hull of points you place with Graham scan or Andrew’s monotone chain, and watch concave turns get popped off.',
  instruction:
    'Choose an algorithm and step. Every test shows the turn second → top → p, and a turn that is not left pops the top. Then drag a point, press empty ground to add one, or press Random. Dragging a corner inward shows the hull change at once.',
  methodLabel: 'Algorithm',
  methods: { graham: 'Graham scan', monotone: 'Monotone chain' },
  presetLabel: 'Example',
  presets: {
    cloud: 'Point cloud',
    square: 'Square with points on its edges',
    allOnHull: 'Every point a corner',
    zigzag: 'Zigzag',
    line: 'All on one line',
  },
  fields: { x: 'x', y: 'y' },
  addPoint: 'Add point',
  removePoint: 'Remove selected',
  random: 'Random',
  /** @param {string} name @param {number} x @param {number} y */
  pointLabel: (name, x, y) => `Point ${name} at (${x}, ${y})`,
  planeLabel:
    'A cloud of points on a coordinate plane. Arrow keys move between points; Shift + arrow moves one, Enter selects one and Delete removes it.',
  /** @param {number} xMax @param {number} yMax */
  coordError: (xMax, yMax) =>
    `x must be a whole number from 0 to ${xMax}, and y from 0 to ${yMax}.`,
  /** @param {number} max */
  fullError: (max) => `Use at most ${max} points.`,
  minError: 'Keep at least one point.',
  occupiedError: 'A point is already there.',
  selectFirst: 'Select a point first: press it, or focus it and press Enter.',
  legend: {
    chain: 'Chain on the stack',
    lower: 'Finished lower chain',
    hull: 'Finished hull',
    current: 'p, the point being added',
    popped: 'Popped: not a corner',
    test: 'Turn being tested',
  },
  /** @param {number} rank */
  rankNote: (rank) => `#${rank}`,
  stackTitle: 'Stack, bottom to top',
  stackEmpty: 'empty',
  orderTitle: 'Scan order',
  orderEmpty: 'not sorted yet',
  compareTitle: 'Both algorithms on these points',
  compareHeads: { method: 'Algorithm', tests: 'Tests', pops: 'Pops' },
  stats: {
    hull: 'Hull corners',
    points: 'Points',
    tests: 'Orientation tests',
    pushes: 'Pushes',
    pops: 'Pops',
  },
  pending: '…',
  workedTitle: 'Worked example: Graham scan on (0, 0), (4, 0), (4, 1), (5, 3)',
  workedSteps: [
    'The pivot is (0, 0), the lowest point. By angle around it, the rest are (4, 0), (4, 1), (5, 3).',
    'Push (0, 0) and (4, 0). With only one point below, no test is needed yet.',
    'Next is (4, 1). orient((0, 0), (4, 0), (4, 1)) = 4 > 0, a left turn, so push it.',
    'Next is (5, 3). orient((4, 0), (4, 1), (5, 3)) = −1 < 0, a right turn, so pop (4, 1).',
    'orient((0, 0), (4, 0), (5, 3)) = 12 > 0, a left turn, so push (5, 3). The hull is (0, 0), (4, 0), (5, 3).',
  ],
  /**
   * @param {HullFrame} f
   * @param {(id: number) => string} name
   */
  describe: (f, name) => {
    switch (f.kind) {
      case 'start':
        return `${plural(f.points.length, 'point', 'points')} to wrap.`;
      case 'pivot':
        return f.pivot === null
          ? 'There are no points, so there is no pivot.'
          : `The pivot is ${name(f.pivot)}: the lowest point, so it must be a corner.`;
      case 'sort':
        return f.method === 'graham'
          ? 'Sort the rest by angle around the pivot, using orientation tests instead of angles. Ties go nearest first.'
          : 'Sort the points by x, then by y. The first and last are certainly corners.';
      case 'pass':
        return f.chain === 'lower'
          ? 'First pass, left to right: this builds the lower chain.'
          : 'Second pass, right to left: this builds the upper chain over the same points.';
      case 'consider':
        return `Next is ${name(/** @type {number} */ (f.current))}. Check the turn it makes with the top of the stack.`;
      case 'test': {
        const [second, top, p] = /** @type {[number, number, number]} */ (f.triple);
        const value = /** @type {number} */ (f.cross);
        const route = `${name(second)} → ${name(top)} → ${name(p)}`;
        return value > 0
          ? `${route}: cross ${num(value)} > 0, a left turn. Keep ${name(top)}.`
          : `${route}: cross ${num(value)} ${value === 0 ? '= 0, straight on' : '< 0, a right turn'}. ${name(top)} is not a corner.`;
      }
      case 'pop':
        return `Pop ${name(/** @type {number} */ (f.popped[f.popped.length - 1]))}. It lies inside or on the hull.`;
      case 'push':
        return `Push ${name(f.stack[f.stack.length - 1])}. The stack has ${plural(f.stack.length, 'point', 'points')}.`;
      case 'done': {
        const hull = /** @type {number[]} */ (f.hull);
        if (hull.length === 0) return 'No points, so no hull.';
        return `The hull has ${plural(hull.length, 'corner', 'corners')}: ${hull.map(name).join(', ')}, counter-clockwise. That took ${plural(f.tests, 'test', 'tests')} and ${plural(f.pops, 'pop', 'pops')}.`;
      }
    }
  },
  takeaways: [
    'Both algorithms sort, then scan with a stack that pops every top making a non-left turn. Only the sort order differs: by angle around a pivot, or by x and then y.',
    'The monotone chain runs the scan twice, once for the lower chain and once for the upper, then joins them. It needs no angle comparison, which makes it the easier one to write without bugs.',
    'Each point is pushed once per pass and popped at most once, so the scan is O(n). The sort is the O(n log n) part, and in general it cannot be beaten, because a hull algorithm can be used to sort.',
    'Popping on cross ≤ 0 drops points that are collinear with an edge. To keep them, pop only on cross < 0, and take care with ties on the last ray of a Graham scan.',
    'Load “Every point a corner”: Graham scan pops nothing, yet the monotone chain still pops, because its lower pass pushes the upper corners before they are popped. Then load the zigzag and compare the pops of both methods on the same points.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    ['Sort', 'O(n log n) time', 'By angle around the pivot, or by x then y.'],
    [
      'Scan',
      'O(n) time',
      'Each point is pushed once per pass and popped at most once, so there are at most about 2n tests per pass.',
    ],
    ['Memory', 'O(n)', 'The sorted order and the stack.'],
    [
      'Whole algorithm',
      'O(n log n)',
      'Sorting dominates. On points already sorted, the scan alone is O(n).',
    ],
  ],
  nextTeaser:
    'Next, Sweep line algorithms move a vertical line across the plane and keep only the active set of segments in view.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'How many corners does the hull of (0, 0), (4, 0), (4, 4), (0, 4), (2, 2), (2, 0) have?',
      answer: 4,
      unit: 'corners',
      hints: ['(2, 2) is inside.', '(2, 0) is on an edge, so it is not a corner.'],
      solution:
        'Only the four outer points are corners. (2, 2) is interior, and (2, 0) is collinear with (0, 0) and (4, 0), so a pop on cross ≤ 0 removes it.',
    },
    {
      type: 'number',
      prompt:
        'The stack is (0, 0), (4, 0), (4, 1), and the next point in Graham order is (5, 3). How many points get popped?',
      answer: 1,
      unit: 'points',
      hints: ['Test (4, 0) → (4, 1) → (5, 3) first.', 'Then test (0, 0) → (4, 0) → (5, 3).'],
      solution:
        'orient((4, 0), (4, 1), (5, 3)) = −1, so pop (4, 1). orient((0, 0), (4, 0), (5, 3)) = 12 > 0, so stop. That is one pop.',
    },
    {
      type: 'choice',
      prompt: 'A test finds orient(second, top, p) = 0. With the usual ≤ 0 rule, what happens?',
      options: [
        'p is skipped',
        'top is popped, since it sits on the straight line from second to p',
        'The scan stops',
      ],
      answer: 1,
      hints: ['Is a point in the middle of a straight stretch a corner?'],
      solution:
        'Cross 0 means second, top and p are in line, with top between them in scan order. It is not a corner, so it goes.',
    },
    {
      type: 'text',
      prompt:
        'What is the total running time of the monotone chain on n unsorted points, in big-O?',
      accept: ['O(n log n)', 'n log n'],
      hints: ['Sorting costs more than scanning.'],
      solution:
        'O(n log n): the sort costs that much, and each scan is only O(n) because each point is pushed once and popped at most once.',
    },
    {
      type: 'order',
      prompt: 'Put the steps of the monotone chain in order.',
      items: [
        'Build the upper chain, scanning right to left',
        'Sort the points by x, then y',
        'Join the chains, dropping each one’s last point',
        'Build the lower chain, scanning left to right',
      ],
      answer: [1, 3, 0, 2],
      hints: ['The sort comes first, and joining comes last.'],
      solution:
        'Sort, lower chain, upper chain, then join. The chains share their two end points, which is why each drops its last.',
    },
  ],
};
