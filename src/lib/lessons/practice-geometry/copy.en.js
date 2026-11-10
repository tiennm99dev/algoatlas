/** @typedef {import('$lib/algo-engine/practice-geometry.js').GeoFrame} GeoFrame */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');
/** @param {number} v */
const dec = (v) => {
  const rounded = Math.round(v * 100) / 100;
  return `${Math.abs(rounded - v) > 1e-9 ? '≈ ' : ''}${rounded}`;
};
/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'practice-geometry',
  topic: 'geometry',
  level: 'Advanced',
  title: 'Practice: geometry problems',
  intro:
    'Geometry code goes wrong in two ways: a comparison that rounds the wrong way, and a problem solved by brute force when a convex hull would do. This sandbox runs three classic problems on points you place. Before each step, predict the exact whole number it computes, and Check moves on only when you are right.',
  summary:
    'Place points and predict exact cross products, shoelace sums and squared distances in three hull and orientation problems, checked step by step.',
  instruction:
    'Pick a problem, then drag points, press empty ground to add one, or load an example. At each step, type the value under “Your turn” and press Check, or press Next step to see it. Then answer the questions below with the sandbox.',
  puzzleLabel: 'Problem',
  puzzles: {
    side: 'Which side of line AB?',
    fence: 'Area inside the shortest fence',
    diameter: 'Farthest pair of points',
  },
  presetLabel: 'Example',
  presets: { field: 'Field', square: 'Square with inner points', triangle: 'Triangle' },
  random: 'Random',
  fields: { x: 'x', y: 'y' },
  addPoint: 'Add point',
  removePoint: 'Remove selected',
  /** @param {string} name @param {number} x @param {number} y @param {string} role */
  pointLabel: (name, x, y, role) => `Point ${name} at (${x}, ${y})${role ? `, ${role}` : ''}`,
  planeLabel:
    'Points on a coordinate plane. Arrow keys move between points; Shift + arrow moves one, Enter selects one and Delete removes it.',
  /** @param {number} xMax @param {number} yMax */
  coordError: (xMax, yMax) =>
    `x must be a whole number from 0 to ${xMax}, and y from 0 to ${yMax}.`,
  /** @param {number} max */
  fullError: (max) => `Use at most ${max} points.`,
  /** @param {number} min */
  minError: (min) => `Keep at least ${min} points.`,
  occupiedError: 'A point is already there.',
  selectFirst: 'Select a point first: press it, or focus it and press Enter.',
  roles: {
    lineEnd: 'an end of line AB',
    current: 'being checked',
    left: 'left of A → B',
    right: 'right of A → B',
    on: 'on line AB',
    corner: 'a hull corner',
    pair: 'in the pair being compared',
    best: 'in the farthest pair so far',
  },
  notes: { left: 'L', right: 'R', on: '0' },
  legend: {
    side: [
      ['active', 'A and B: the line A → B'],
      ['compare', 'p, the point being checked'],
      ['frontier', 'L: left, cross > 0'],
      ['visited', 'R: right, cross < 0'],
      ['path', '0: on the line, cross = 0'],
    ],
    fence: [
      ['sorted', 'Hull corners and fence'],
      ['compare', 'Edge being summed'],
    ],
    diameter: [
      ['sorted', 'Hull corners'],
      ['compare', 'Pair being compared'],
      ['path', 'Farthest pair so far'],
    ],
  },
  /** @param {number} d2 */
  bestLabel: (d2) => `d² = ${d2}`,
  askTitle: 'Your turn',
  askLabels: {
    side: 'cross(B − A, p − A)',
    fence: 'twice after this edge',
    diameter: 'd² of this pair',
  },
  askCheck: 'Check',
  askIdle: 'Nothing to work out at this step. Press Next step.',
  askDone: 'Finished. Move a point or pick another problem.',
  askEmpty: 'Type a whole number first.',
  /** @param {number} value */
  askRight: (value) => `Correct: ${num(value)}.`,
  /** @param {GeoFrame} f @param {(id: number) => string} name */
  askWrong(f, name) {
    if (f.puzzle === 'side')
      return 'Not quite. With u = B − A and v = p − A, compute u.x · v.y − u.y · v.x.';
    const [p, q] = /** @type {[number, number]} */ (f.edge);
    if (f.puzzle === 'fence')
      return `Not quite. Add x${name(p)} · y${name(q)} − x${name(q)} · y${name(p)} to twice = ${num(f.twice)}.`;
    return `Not quite. Square the x difference and the y difference of ${name(p)} and ${name(q)}, then add them.`;
  },
  listTitles: { left: 'Left (L)', right: 'Right (R)', on: 'On the line (0)', hull: 'Hull corners' },
  listEmpty: 'none yet',
  stats: {
    left: 'Left',
    right: 'Right',
    on: 'On the line',
    corners: 'Hull corners',
    twice: 'Twice the area',
    area: 'Area',
    perimeter: 'Fence length',
    best: 'Largest d²',
    distance: 'Distance √d²',
    pairs: 'Pairs compared',
    brute: 'Pairs by brute force',
    correct: 'Your right answers',
    wrong: 'Your wrong answers',
  },
  pending: '…',
  /**
   * @param {GeoFrame} f
   * @param {(id: number) => string} name
   */
  describe(f, name) {
    const pt = (/** @type {number} */ id) => {
      const p = /** @type {{x: number, y: number}} */ (f.points.find((q) => q.id === id));
      return `${name(id)} (${p.x}, ${p.y})`;
    };
    switch (f.kind) {
      case 'start':
        if (f.puzzle === 'side') {
          const [a, b] = /** @type {[number, number]} */ (f.line);
          return `Line A → B runs from ${pt(a)} to ${pt(b)}. Sort the other ${plural(f.brute, 'point', 'points')} by the sign of an exact cross product.`;
        }
        return f.puzzle === 'fence'
          ? `The shortest fence around ${plural(f.points.length, 'point', 'points')} is their convex hull. Find the area it encloses.`
          : `Find the two points farthest apart among ${plural(f.points.length, 'point', 'points')}. Brute force compares all ${f.brute} pairs.`;
      case 'read':
        return `p = ${pt(/** @type {number} */ (f.current))}. What is cross(B − A, p − A)?`;
      case 'classify': {
        const c = /** @type {number} */ (f.value);
        const p = name(/** @type {number} */ (f.current));
        if (c === 0)
          return `cross = 0 exactly, so ${p} is on the line. With whole numbers this zero is exact; in floating point it might come out as a tiny ± value.`;
        return `cross = ${num(c)} ${c > 0 ? '> 0' : '< 0'}, so ${p} is ${c > 0 ? 'left' : 'right'} of A → B.`;
      }
      case 'hull':
        return f.puzzle === 'fence'
          ? `The hull has ${plural(/** @type {number[]} */ (f.hull).length, 'corner', 'corners')}: ${/** @type {number[]} */ (f.hull).map(name).join(', ')}. Inner points never touch the fence.`
          : `The two farthest points are always hull corners, so only the ${plural(/** @type {number[]} */ (f.hull).length, 'corner', 'corners')} need comparing.`;
      case 'edge': {
        const [p, q] = /** @type {[number, number]} */ (f.edge);
        return `Edge ${pt(p)} → ${pt(q)}. Its shoelace term is x${name(p)} · y${name(q)} − x${name(q)} · y${name(p)}. What is twice now?`;
      }
      case 'add':
        return `The term is ${num(/** @type {number} */ (f.value))}, so twice = ${num(f.twice)}. The fence is ${dec(f.perimeter)} long so far.`;
      case 'pair': {
        const [p, q] = /** @type {[number, number]} */ (f.edge);
        return `Compare ${pt(p)} and ${pt(q)}. What is their squared distance d²?`;
      }
      case 'compare': {
        const [p, q] = /** @type {[number, number]} */ (f.edge);
        const d = /** @type {number} */ (f.value);
        const isBest = f.bestPair && f.bestPair[0] === p && f.bestPair[1] === q;
        return isBest
          ? `d² = ${d} is the largest so far: ${name(p)} and ${name(q)} are the new farthest pair.`
          : `d² = ${d} is not larger than ${f.best}, so the farthest pair stays.`;
      }
      case 'done':
        if (f.puzzle === 'side')
          return `${f.sides.left.length} left, ${f.sides.right.length} right and ${f.sides.on.length} on the line, from ${plural(f.steps, 'exact test', 'exact tests')}.`;
        if (f.puzzle === 'fence')
          return `twice = ${num(f.twice)}, so the area is ${dec(f.twice / 2)}, inside a fence ${dec(f.perimeter)} long. Halving only at the end keeps every step exact.`;
        if (!f.bestPair) return 'Fewer than two points: no pair to compare.';
        return `The farthest pair is ${name(f.bestPair[0])} and ${name(f.bestPair[1])}: d² = ${f.best}, distance ${dec(Math.sqrt(f.best))}. The square root is taken once, at the end, from ${plural(f.steps, 'pair', 'pairs')} instead of ${f.brute}.`;
    }
  },
  takeaways: [
    'With whole-number coordinates, cross products, shoelace terms and squared distances are whole numbers too, so every comparison is exact. Compare them with 0 or with each other, never through division, angles or square roots.',
    'A cross product of exactly 0 means collinear. Floating-point inputs need an epsilon instead, and then “on the line” becomes a judgement call; whole numbers avoid it.',
    'The convex hull answers many questions: the shortest fence around points, the largest area they enclose, and the farthest pair, which is always two hull corners.',
    'Comparing d² instead of d gives the same order, because squaring is increasing for distances ≥ 0. Take one square root at the end, only for display.',
    'Load “Field” in the farthest-pair problem and compare the pairs checked with the brute-force count. Then drag an inner point outside the hull: the pairs compared follow the new number of hull corners, while the brute-force count stays the same.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    ['Which side of a line', 'O(n) time', 'One exact cross product per point.'],
    [
      'Area inside the fence',
      'O(n log n) time',
      'The hull costs O(n log n); the shoelace sum over its h corners is O(h).',
    ],
    [
      'Farthest pair, corners only',
      'O(n log n + h²) time',
      'Build the hull, then compare all h(h − 1)/2 corner pairs. Rotating calipers bring this to O(n log n).',
    ],
    ['Farthest pair, brute force', 'O(n²) time', 'Compares all n(n − 1)/2 pairs.'],
    ['Memory', 'O(n)', 'The points, the hull and a few running totals.'],
  ],
  nextTeaser:
    'Next, Flow networks and Ford-Fulkerson push as much flow as possible from a source to a sink along augmenting paths.',
  practiceTitle: 'Solve with the sandbox',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Load “Field” and pick “Which side of line AB?”. How many points other than A and B lie exactly on the line?',
      answer: 2,
      unit: 'points',
      hints: [
        'Step through, or press Last step and read the “On the line” card.',
        'A point is on the line when its cross product is exactly 0.',
      ],
      solution:
        'D (5, 3) and G (9, 5) both give cross = 0: with B − A = (10, 5), D − A = (4, 2) gives 10 · 2 − 5 · 4 = 0, and G − A = (8, 4) gives 10 · 4 − 5 · 8 = 0.',
    },
    {
      type: 'number',
      prompt: 'Still on “Field” and line AB, what is cross(B − A, C − A) for C at (2, 5)?',
      answer: 35,
      hints: ['B − A = (10, 5) and C − A = (1, 4).', 'Compute 10 · 4 − 5 · 1.'],
      solution:
        'B − A = (10, 5), C − A = (1, 4), so cross = 10 · 4 − 5 · 1 = 35 > 0: C is left of A → B.',
    },
    {
      type: 'number',
      prompt:
        'Load “Field” and pick “Area inside the shortest fence”. What area does the fence enclose?',
      answer: 46.5,
      unit: 'square units',
      hints: ['The last step shows twice the area.', 'twice = 93, and only then divide by 2.'],
      solution:
        'The hull is A, E, H, B, F, C. Its shoelace terms are −7, 6, 38, 53, 6 and −3, which add to twice = 93, so the area is 46.5.',
    },
    {
      type: 'number',
      prompt:
        'Load “Field” and pick “Farthest pair of points”. What is the largest squared distance d²?',
      answer: 125,
      hints: ['The farthest pair is two hull corners.', 'Try A (1, 1) and B (11, 6).'],
      solution:
        'A and B are 10 apart in x and 5 in y: d² = 100 + 25 = 125, and no other corner pair beats it. The distance is √125 ≈ 11.18.',
    },
    {
      type: 'number',
      prompt:
        'In the same farthest-pair run on “Field”, how many pairs does the hull method compare? (Brute force compares 36.)',
      answer: 15,
      unit: 'pairs',
      hints: ['Count the hull corners first: h of them.', 'It compares h(h − 1)/2 pairs.'],
      solution:
        'The hull has 6 corners, so 6 · 5 / 2 = 15 pairs, against 9 · 8 / 2 = 36 for all 9 points.',
    },
    {
      type: 'choice',
      prompt: 'Why does the farthest-pair search compare d² instead of the distance d?',
      options: [
        'd² is always smaller, so it is faster to compare',
        'd² is a whole number for whole-number points, so the comparison is exact, and it orders pairs exactly as d does',
        'The distance d can be negative',
      ],
      answer: 1,
      hints: ['What does a square root do to a whole number like 125?'],
      solution:
        'Squaring is increasing for d ≥ 0, so d² ranks pairs the same way. It avoids √, which turns whole numbers into rounded floats, and it is cheaper.',
    },
    {
      type: 'multi',
      prompt: 'With whole-number coordinates, which of these tests are exact?',
      options: [
        'The sign of cross(B − A, p − A)',
        'Comparing two squared distances',
        'Comparing two slopes computed as dy / dx',
        'Comparing two angles from atan2',
      ],
      answers: [0, 1],
      hints: ['Which ones use only +, − and ×?'],
      solution:
        'Cross products and squared distances use only +, − and ×, so they stay whole numbers. Division can round, fails on vertical lines, and atan2 returns rounded floats.',
    },
  ],
};
