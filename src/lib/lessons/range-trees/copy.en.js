/** @typedef {import('$lib/algo-engine/range-trees.js').RangeFrame} RangeFrame */
/** @typedef {import('$lib/algo-engine/range-trees.js').RangeNode} RangeNode */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {RangeFrame} f @param {number} id */
const nodeOf = (f, id) => /** @type {RangeNode} */ (f.nodes.find((n) => n.id === id));

export const en = {
  slug: 'range-trees',
  topic: 'geometry',
  level: 'Advanced',
  title: 'Range trees and orthogonal range search',
  intro:
    'An orthogonal range query asks which points lie in an axis-parallel rectangle [x1, x2] × [y1, y2]. Checking every point costs O(n) per query. A range tree is a tree of trees: a balanced search tree on x whose every node also keeps its own points sorted by y, so a query touches only O(log n) nodes and binary searches O(log n) lists.',
  summary:
    'Drag a query rectangle over points and step through a two-level range tree: a search on x, canonical subtrees, and binary searches on y.',
  instruction:
    'Step through the query and watch the search on x reach the split node, then walk one path on each side. Drag a rectangle corner (1 or 2), type its bounds, or drag a point. Compare the nodes visited with the brute-force count.',
  presetLabel: 'Example',
  presets: {
    scatter: 'Scattered points',
    diagonal: 'Points on a diagonal',
    column: 'Many points with the same x',
    empty: 'No x in range',
  },
  random: 'Random',
  queryTitle: 'Query rectangle',
  fields: { x1: 'x1', x2: 'x2', y1: 'y1', y2: 'y2', x: 'x', y: 'y' },
  addPoint: 'Add point',
  removePoint: 'Remove selected',
  /** @param {number} xMax @param {number} yMax */
  queryError: (xMax, yMax) =>
    `Bounds must be whole numbers with 0 ≤ x1 ≤ x2 ≤ ${xMax} and 0 ≤ y1 ≤ y2 ≤ ${yMax}.`,
  /** @param {number} xMax @param {number} yMax */
  coordError: (xMax, yMax) =>
    `x must be a whole number from 0 to ${xMax}, and y from 0 to ${yMax}.`,
  /** @param {number} max */
  fullError: (max) => `Use at most ${max} points.`,
  minError: 'Keep at least one point.',
  occupiedError: 'A point is already there.',
  selectFirst: 'Select a point first: press it, or focus it and press Enter.',
  cornerError: 'The rectangle’s corners cannot be removed. Drag them instead.',
  /** @param {string} name @param {number} x @param {number} y @param {string} role */
  pointLabel: (name, x, y, role) => `Point ${name} at (${x}, ${y})${role ? `, ${role}` : ''}`,
  /** @param {string} name @param {number} x @param {number} y */
  cornerLabel: (name, x, y) => `Corner ${name} of the query rectangle at (${x}, ${y})`,
  planeLabel:
    'Points and a query rectangle on a coordinate plane. Arrow keys move between points and the two corners; Shift + arrow moves one, Enter selects a point and Delete removes it.',
  treeLabel: 'The primary tree on x. Each node stores one point and the y-list of its subtree.',
  /** @param {string} name @param {number} x @param {number} y @param {string[]} roles */
  nodeLabel: (name, x, y, roles) =>
    `Node ${name} at (${x}, ${y})${roles.length ? `: ${roles.join(', ')}` : ''}`,
  roles: {
    current: 'acted on now',
    split: 'split node',
    canonical: 'root of a canonical subtree',
    searching: 'in the subtree being searched',
    inCanonical: 'inside a canonical subtree',
    visited: 'checked on a path',
    reported: 'reported',
    excluded: 'excluded by the y search',
  },
  legend: {
    current: 'Node acted on now; the dashed line is its x',
    visited: 'Checked one by one on a path',
    searching: 'Subtree being binary searched',
    canonical: 'Canonical subtree, already searched',
    reported: '✓ Reported: inside the rectangle',
    excluded: 'Excluded by a y search',
    rect: 'Query rectangle',
    markers: 'S split node · C canonical subtree root',
  },
  markers: { split: 'S', canonical: 'C', reported: '✓' },
  treeTitle: 'Primary tree on x',
  /** @param {string} name */
  listTitle: (name) => `ys(${name}): its subtree sorted by y`,
  listIdle: 'No binary search at this step.',
  /** @param {string} name */
  listAria: (name) => `The y values of the subtree of ${name}, sorted, with the matching run.`,
  listWindow: 'y in range',
  reportedTitle: 'Reported points',
  reportedEmpty: 'none yet',
  stats: {
    reported: 'Reported',
    brute: 'Brute-force checks',
    visited: 'Nodes visited',
    searches: 'Binary searches',
    comparisons: 'y comparisons',
    storage: 'y-list entries (memory)',
  },
  workedTitle: 'Worked example: “Scattered points” with the rectangle [3, 10] × [2, 6]',
  workedSteps: [
    'The root M (6, 8) has x = 6 in [3, 10], so M is the split node at once. Its y = 8 is above 6, so M is skipped.',
    'Left path, toward x1 = 3. D (4, 4) has x ≥ 3: report D, then everything right of D has x between 4 and 6, so binary search ys(F) = E(1), F(5) for y in [2, 6]. F is reported.',
    'Go left to B (2, 2): x = 2 < 3, so B and its left subtree are out; go right to C (3, 7). x fits but y = 7 does not, and C has no children.',
    'Right path, toward x2 = 10. J (10, 5) has x ≤ 10: report J, then binary search ys(H) = I(2), G(3), H(7). I and G are reported, H is not.',
    'Go right to L (12, 6), then left to K (11, 1): both have x > 10. The answer is D, F, J, I and G: 5 points, from 7 nodes visited and 2 binary searches.',
  ],
  /**
   * @param {RangeFrame} f
   * @param {(id: number) => string} name
   */
  describe(f, name) {
    const { x1, x2, y1, y2 } = f.query;
    const cur = f.current === null ? null : nodeOf(f, f.current);
    switch (f.kind) {
      case 'start':
        return `${plural(f.points.length, 'point', 'points')}. Find those in [${x1}, ${x2}] × [${y1}, ${y2}].`;
      case 'build':
        return f.root === null
          ? 'There are no points, so the tree is empty.'
          : `The tree is built once: the median by x, ${name(f.root)}, at the top and each half below it. Every node also keeps its subtree sorted by y, ${plural(f.storage, 'entry', 'entries')} in all: O(n log n) memory.`;
      case 'descend': {
        if (!cur) return '';
        const go = f.turn === 'right' ? 'right' : 'left';
        if (f.side === null)
          return cur.x < x1
            ? `${name(cur.id)}.x = ${cur.x} < x1 = ${x1}: it and its left subtree are out of range. Go ${go}.`
            : `${name(cur.id)}.x = ${cur.x} > x2 = ${x2}: it and its right subtree are out of range. Go ${go}.`;
        if (f.side === 'left')
          return cur.x >= x1
            ? `The right subtree of ${name(cur.id)} is done. Keep walking left, toward x1.`
            : `${name(cur.id)}.x = ${cur.x} < x1 = ${x1}: it and its left subtree are out. Go right.`;
        return cur.x <= x2
          ? `The left subtree of ${name(cur.id)} is done. Keep walking right, toward x2.`
          : `${name(cur.id)}.x = ${cur.x} > x2 = ${x2}: it and its right subtree are out. Go left.`;
      }
      case 'split':
        return `${name(/** @type {number} */ (f.split))}.x = ${cur?.x} lies in [${x1}, ${x2}]: the searches for x1 and x2 part here. This is the split node.`;
      case 'none':
        return `The search fell off the tree: no point has x in [${x1}, ${x2}], so the answer is empty.`;
      case 'check': {
        if (!cur) return '';
        const reported = f.reported.includes(cur.id);
        return reported
          ? `${name(cur.id)} (${cur.x}, ${cur.y}): x fits, and y = ${cur.y} is in [${y1}, ${y2}]. Report it.`
          : `${name(cur.id)} (${cur.x}, ${cur.y}): x fits, but y = ${cur.y} is not in [${y1}, ${y2}]. Skip it.`;
      }
      case 'search': {
        const s = /** @type {NonNullable<RangeFrame['search']>} */ (f.search);
        const found = s.hi - s.lo;
        return `Every point under ${name(s.node)} has x in range, so this subtree is canonical. Binary search its y-list instead of visiting it: ${plural(found, 'point', 'points')} with y in [${y1}, ${y2}], in ${plural(s.comparisons, 'comparison', 'comparisons')}.`;
      }
      case 'turn': {
        const split = name(/** @type {number} */ (f.split));
        if (f.current === null)
          return `${split} has no ${f.side} child, so the ${f.side} path is empty.`;
        return f.side === 'left'
          ? `Now walk the left path from ${name(f.current)}, toward x1 = ${x1}. Everything here has x ≤ ${x2}.`
          : `Now walk the right path from ${name(f.current)}, toward x2 = ${x2}. Everything here has x ≥ ${x1}.`;
      }
      case 'done':
        return `Done: ${plural(f.reported.length, 'point', 'points')} found, from ${plural(f.visited.length, 'node', 'nodes')} visited and ${plural(f.searches, 'binary search', 'binary searches')}. Brute force checks all ${f.points.length}.`;
    }
  },
  takeaways: [
    'Search x1 and x2 down the primary tree on x together until they part at the split node. Below it, one path runs toward x1 and one toward x2.',
    'Each path node with x in range is checked on its own. The subtree hanging off it on the inner side lies wholly inside [x1, x2]: a canonical subtree. There are O(log n) of them, and they cover exactly the points with x in range.',
    'A canonical subtree is not visited. Its node stores its points sorted by y, so two binary searches find the ones with y in [y1, y2]. That is O(log n) searches of O(log n) each: O(log² n + k) for k answers.',
    'A point sits in at most one y-list per level, so the lists take O(n log n) memory. Fractional cascading links each list to its children’s lists, so after one binary search at the split node each step costs O(1): the query drops to O(log n + k).',
    'Load “Scattered points” and drag corner 2 left to x = 5. The root M falls outside [3, 5], so the search on x goes left first and D becomes the split node. The brute-force count stays at n.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    [
      'Build',
      'O(n log n) time',
      'Sort by x and by y once; each level then merges its children’s y-lists in linear time.',
    ],
    [
      'Memory',
      'O(n log n)',
      'Each point is in the y-list of its own node and of every node above it: at most one per level.',
    ],
    [
      'Query',
      'O(log² n + k)',
      'Two paths of O(log n) nodes, and a binary search of O(log n) in each canonical subtree.',
    ],
    [
      'Query with fractional cascading',
      'O(log n + k)',
      'One binary search at the split node; pointers then give each child list’s position in O(1).',
    ],
    ['Brute force', 'O(n) per query', 'Check every point against both ranges.'],
  ],
  nextTeaser:
    'Next, Practice: geometry problems turns orientation tests and convex hulls into problems you solve, with exact comparisons checked step by step.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Load “Scattered points” with the rectangle [3, 10] × [2, 6]. How many points does the query report?',
      answer: 5,
      unit: 'points',
      hints: [
        'Press Last step and read the Reported card.',
        'Or check by hand: x from 3 to 10 and y from 2 to 6.',
      ],
      solution:
        'D (4, 4), F (6, 5), G (7, 3), I (9, 2) and J (10, 5) fit both ranges. C (3, 7), H (8, 7) and M (6, 8) fit x but are too high, and E (5, 1) is too low.',
    },
    {
      type: 'number',
      prompt:
        'A range tree holds 15 points in a perfectly balanced primary tree of 4 levels (1, 2, 4 and 8 nodes). How many entries do all its y-lists hold together?',
      answer: 49,
      unit: 'entries',
      hints: [
        'A node’s y-list holds its whole subtree.',
        'Count per level instead: counting the root as level 1, a node at level d has a subtree of 2^(5 − d) − 1 points.',
      ],
      solution:
        'The root’s list has 15 entries, the two at level 2 have 7 each, the four at level 3 have 3 each and the eight leaves 1 each: 15 + 14 + 12 + 8 = 49. Each point is counted once per node above or at it, at most once per level, so the total is O(n log n).',
    },
    {
      type: 'choice',
      prompt:
        'On the left path, node u has u.x ≥ x1. Why can the query binary search ys(u.right) instead of visiting that subtree?',
      options: [
        'Because every point in u.right has y in [y1, y2]',
        'Because every point in u.right has x between u.x and the split node’s x, so inside [x1, x2]',
        'Because u.right is always a leaf',
      ],
      answer: 1,
      hints: ['Where does u.right sit in x order, relative to u and to the split node?'],
      solution:
        'u.right holds points with x from u.x up to the split node’s x. Those are ≥ x1 and ≤ x2, so only y still needs checking, and the sorted y-list answers that by binary search.',
    },
    {
      type: 'text',
      prompt:
        'What is the query time of a 2D range tree without fractional cascading, with k answers?',
      accept: ['O(log² n + k)', 'O(log^2 n + k)', 'log² n + k', 'O(k + log² n)'],
      hints: ['O(log n) canonical subtrees, each searched in O(log n).'],
      solution:
        'O(log² n + k): O(log n) binary searches of O(log n) each, plus the k points reported.',
    },
    {
      type: 'choice',
      prompt: 'What does fractional cascading change?',
      options: [
        'It shrinks the memory to O(n)',
        'It replaces the O(log n) binary searches with one, so a query costs O(log n + k)',
        'It lets the tree handle 3D queries for free',
      ],
      answer: 1,
      hints: ['It adds pointers from each list to its children’s lists.'],
      solution:
        'Each entry points to where its y value falls in the children’s lists. After one binary search at the split node, following a pointer costs O(1), so the query is O(log n + k). Memory stays O(n log n).',
    },
  ],
};
