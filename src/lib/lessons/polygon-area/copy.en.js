/** @typedef {import('$lib/algo-engine/polygon-area.js').PolygonFrame} PolygonFrame */
/** @typedef {import('$lib/algo-engine/polygon-area.js').Point} Point */

/** @param {number} v */
const num = (v) => String(v).replace('-', '−');
/** @param {number} v */
const signed = (v) => (v > 0 ? `+${v}` : num(v));
/** @param {Point} p */
const pt = (p) => `(${p.x}, ${p.y})`;
/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'polygon-area',
  topic: 'geometry',
  level: 'Intermediate',
  title: 'Polygon area and point in polygon',
  intro:
    'Walk once around a polygon’s edges and you can answer two questions. The shoelace formula adds one signed term per edge to get the area and the direction of travel. Ray casting and the winding number count how the edges pass a point to say whether it is inside.',
  summary:
    'Compute polygon area with the shoelace formula, and test a point by ray casting and by winding number on a polygon you edit.',
  instruction:
    'Choose a method and drag the vertices. Press empty ground to add a vertex, or use the fields below. In shoelace mode, watch each edge’s signed triangle from the origin add up to the area. In the other two, drag Q and count what the edges do. Load the star: the two tests disagree.',
  methodLabel: 'Method',
  methods: { shoelace: 'Shoelace area', ray: 'Ray casting', winding: 'Winding number' },
  presetLabel: 'Example',
  presets: {
    rectangle: 'Rectangle',
    lShape: 'L shape',
    clockwise: 'Clockwise triangle',
    notch: 'Notched kite',
    throughVertex: 'Ray through a vertex',
    star: 'Five-pointed star',
  },
  fields: { x: 'x', y: 'y' },
  addVertex: 'Add vertex',
  removeVertex: 'Remove selected',
  /** @param {number} i @param {number} x @param {number} y */
  vertexLabel: (i, x, y) => `Vertex ${i} at (${x}, ${y})`,
  /** @param {number} x @param {number} y */
  queryLabel: (x, y) => `Query point Q at (${x}, ${y})`,
  planeLabel:
    'An editable polygon on a coordinate plane. Arrow keys move between points; Shift + arrow moves one, Enter selects one and Delete removes a vertex.',
  /** @param {number} xMax @param {number} yMax */
  coordError: (xMax, yMax) =>
    `x must be a whole number from 0 to ${xMax}, and y from 0 to ${yMax}.`,
  /** @param {number} max */
  fullError: (max) => `A polygon here can have at most ${max} vertices.`,
  /** @param {number} min */
  minError: (min) => `A polygon needs at least ${min} vertices.`,
  occupiedError: 'A vertex is already there.',
  selectFirst: 'Select a vertex first: press it, or focus it and press Enter.',
  legend: {
    current: 'Edge being read',
    positive: 'Positive term: triangle from the origin',
    negative: 'Negative term',
    polygon: 'The polygon',
    ray: 'Dashed: the ray from Q',
    crossing: '× Ray crosses an edge',
    up: 'Upward edge: w + 1',
    down: 'Downward edge: w − 1',
  },
  selfCrossing:
    'This outline crosses itself, so the shoelace sum counts each region by how many times it is wound, not its plain area.',
  tableTitles: {
    shoelace: 'Terms, one per edge',
    ray: 'Edges against the ray',
    winding: 'Edges passing Q',
  },
  tableHeads: {
    edge: 'Edge',
    shoelace: ['Term', 'Sum'],
    ray: ['Crosses?', 'Count'],
    winding: ['Change', 'w'],
  },
  rowEmpty: 'No edge read yet.',
  /** @param {number} i @param {number} j */
  edgeName: (i, j) => `${i} → ${j}`,
  /** @param {import('$lib/algo-engine/polygon-area.js').EdgeRow} r */
  rowValue: (r) => {
    if (r.result === 'term') return signed(r.value);
    if (r.result === 'boundary') return 'On edge';
    if (r.result === 'cross') return 'Yes';
    if (r.result === 'up') return '+1';
    if (r.result === 'down') return '−1';
    return '–';
  },
  /** @param {number} v */
  rowTotal: num,
  stats: {
    area: 'Area',
    sum: 'Sum so far',
    direction: 'Vertices run',
    location: 'Q is',
    crossings: 'Ray crossings',
    winding: 'Winding number w',
    edges: 'Edges read',
    vertices: 'Vertices',
  },
  pending: '…',
  directions: { ccw: 'Counter-clockwise', cw: 'Clockwise', flat: 'No area' },
  locations: { inside: 'Inside', outside: 'Outside', boundary: 'On the boundary' },
  /** @param {number} v */
  num,
  workedTitle: 'Worked example: the triangle (1, 1), (5, 1), (3, 4)',
  workedSteps: [
    'Edge 0 → 1: 1 · 1 − 5 · 1 = −4, so the sum is −4.',
    'Edge 1 → 2: 5 · 4 − 3 · 1 = 17, so the sum is 13.',
    'Edge 2 → 0: 3 · 1 − 1 · 4 = −1, so the sum is 12.',
    'The sum is positive, so the vertices run counter-clockwise. The area is |12| / 2 = 6.',
    'Is (3, 2) inside? Its ray to the right crosses only the edge from (5, 1) to (3, 4), at x = 13/3. One crossing is odd, so it is inside.',
  ],
  /** @param {PolygonFrame} f */
  describe: (f) => {
    const n = f.polygon.length;
    if (f.kind === 'start') {
      if (f.method === 'shoelace') return `${n} vertices. Start the sum at 0 and walk the edges.`;
      if (f.method === 'ray')
        return `Send a ray from Q ${pt(f.query)} to the right. Start outside, and flip at each crossing.`;
      return `Stand at Q ${pt(f.query)} and start with w = 0. Upward edges passing on the right add 1, and downward ones subtract 1.`;
    }
    const edge = f.edge === null ? null : f.rows[f.rows.length - 1];
    if (f.kind === 'edge' && edge) {
      const a = f.polygon[edge.i];
      const b = f.polygon[edge.j];
      const name = `Edge ${edge.i} → ${edge.j}`;
      if (edge.result === 'term')
        return `${name}: ${num(a.x)} · ${num(b.y)} − ${num(b.x)} · ${num(a.y)} = ${num(edge.value)}. The sum is now ${num(f.sum)}.`;
      if (edge.result === 'cross') return `${name} crosses the ray to the right of Q.`;
      if (edge.result === 'up')
        return `${name} goes upward past Q on the right: w = ${num(f.winding)}.`;
      if (edge.result === 'down')
        return `${name} goes downward past Q on the right: w = ${num(f.winding)}.`;
      if (a.y > f.query.y === b.y > f.query.y)
        return `${name} stays on one side of Q’s height. Skip it.`;
      return `${name} passes Q’s height on the left of Q. Skip it.`;
    }
    if (f.kind === 'toggle')
      return `That makes ${plural(f.crossings, 'crossing', 'crossings')}, so the running answer is now ${f.inside ? 'inside' : 'outside'}.`;
    if (f.method === 'shoelace') {
      const way =
        f.direction === 'ccw'
          ? 'positive: the vertices run counter-clockwise'
          : f.direction === 'cw'
            ? 'negative: the vertices run clockwise'
            : 'zero: the polygon encloses no net area';
      return `The sum ${num(f.sum)} is ${way}. Area = |${num(f.sum)}| / 2 = ${f.area}.`;
    }
    if (f.location === 'boundary') {
      const last = f.rows[f.rows.length - 1];
      return `Q ${pt(f.query)} lies on edge ${last.i} → ${last.j}, so it is on the boundary.`;
    }
    if (f.method === 'ray')
      return `${plural(f.crossings, 'crossing', 'crossings')} in all, which is ${
        f.crossings % 2 ? 'odd' : 'even'
      }: Q is ${f.location}.`;
    return `w = ${num(f.winding)}, which is ${f.winding === 0 ? 'zero' : 'not zero'}: Q is ${f.location}.`;
  },
  takeaways: [
    'Shoelace: add x_i · y_(i+1) − x_(i+1) · y_i around the polygon, and halve the size of the sum. Each term is twice the signed area of the triangle from the origin to that edge.',
    'The sign of the sum gives the direction: positive is counter-clockwise, negative is clockwise. Reversing the vertices flips it and keeps the area.',
    'Ray casting: from Q go right and count crossings. Odd is inside, even is outside. Count an edge only for heights from its lower end up to but not including its upper end, so a vertex on the ray counts once.',
    'Winding number: add 1 for each upward edge passing Q on the right, and subtract 1 for each downward one. Q is inside when w is not 0. For a polygon that does not cross itself, both tests agree.',
    'Load the star and compare the methods at its centre: the ray sees an even count and says outside, while w = −2 says inside. Now drag Q into a point of the star, where they agree.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    [
      'Shoelace area',
      'O(n) time, O(1) memory',
      'One term per edge, with whole-number arithmetic throughout.',
    ],
    ['Ray casting', 'O(n) time, O(1) memory', 'One constant-time check per edge.'],
    [
      'Winding number',
      'O(n) time, O(1) memory',
      'Also one check per edge, using an orientation test.',
    ],
    [
      'Point in convex polygon',
      'O(log n) time',
      'Binary search over the fan of triangles from one vertex.',
    ],
  ],
  nextTeaser:
    'Next, Convex hull wraps a cloud of points in the smallest convex polygon by popping off concave turns.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'What is the area of the polygon (0, 0), (4, 0), (4, 3), (0, 3)?',
      answer: 12,
      hints: ['Add x_i · y_(i+1) − x_(i+1) · y_i for each edge.', 'The terms are 0, 12, 12 and 0.'],
      solution:
        'The sum is 0 + 12 + 12 + 0 = 24, so the area is 24 / 2 = 12, as width times height confirms.',
    },
    {
      type: 'number',
      prompt: 'What is the shoelace sum, before halving, of the triangle (2, 2), (5, 7), (10, 2)?',
      answer: -40,
      hints: [
        'Keep the sign.',
        'The terms are 2 · 7 − 5 · 2 = 4, then 5 · 2 − 10 · 7 = −60, then 10 · 2 − 2 · 2 = 16.',
      ],
      solution:
        '4 − 60 + 16 = −40. It is negative because the vertices run clockwise, and the area is 20.',
    },
    {
      type: 'choice',
      prompt: 'A shoelace sum comes out as −56. What do you know?',
      options: [
        'The area is 56 and the vertices run counter-clockwise',
        'The area is 28 and the vertices run clockwise',
        'The polygon has a mistake, since area cannot be negative',
      ],
      answer: 1,
      hints: ['The area is half the size of the sum. The sign is the direction.'],
      solution:
        '|−56| / 2 = 28, and a negative sum means clockwise. The sign is information, not an error.',
    },
    {
      type: 'number',
      prompt:
        'Take the L shape (1, 1), (9, 1), (9, 3), (4, 3), (4, 7), (1, 7) and Q = (0, 5). How many edges does the ray from Q going right cross?',
      answer: 2,
      hints: [
        'Only edges spanning height 5 count.',
        'They are the two vertical edges, at x = 4 and x = 1.',
      ],
      solution:
        'The edges at x = 4 and x = 1 both span height 5 and lie right of Q. Two crossings is even, so Q is outside.',
    },
    {
      type: 'choice',
      prompt:
        'Q sits at the centre of a five-pointed star drawn in one stroke. What do the two tests say?',
      options: [
        'Both say inside',
        'Both say outside',
        'Ray casting says outside, and the winding number says inside',
        'Ray casting says inside, and the winding number says outside',
      ],
      answer: 2,
      hints: [
        'At the centre the outline winds around Q twice.',
        'Two windings means an even number of crossings.',
      ],
      solution:
        'The ray crosses an even number of edges, so even-odd says outside. The winding number is ±2, which is not zero, so it says inside. They differ only on outlines that cross themselves.',
    },
  ],
};
