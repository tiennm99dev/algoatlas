/** @typedef {import('$lib/algo-engine/min-cost-flow.js').HungarianFrame} HungarianFrame */

/** Name of row i (a worker). @param {number} i */
const rowName = (i) => String.fromCharCode(65 + i);
/** Name of column j (a job). @param {number} j */
const colName = (j) => String(j + 1);
/** A number with a true minus sign. @param {number} x */
const show = (x) => String(x).replace('-', '−');

/** @param {string[]} list */
const join = (list) =>
  list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;

/** @param {number} n @returns {number} */
const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

export const en = {
  slug: 'min-cost-flow',
  topic: 'flows',
  level: 'Advanced',
  title: 'Min-cost flow and the assignment problem',
  intro:
    'When every edge also has a cost per unit of flow, the question becomes: how do we send a required amount of flow as cheaply as possible? The assignment problem is the classic case: n workers, n jobs, a cost for each pair, and every worker needs a different job. The Hungarian algorithm solves it in O(n³) by adding one worker at a time along a cheapest augmenting path, guided by potentials on the rows and columns.',
  summary:
    'Watch the Hungarian algorithm adjust row and column potentials until a set of zero reduced costs gives the cheapest assignment.',
  instruction:
    'Step through and watch the reduced costs: each scan finds the smallest slack δ, the potentials u and v shift by δ, and a new 0 appears. Starred cells are the assignment. Edit the costs below the table, or pick “Greedy trap” to see why taking the cheapest cell first fails.',
  rowName,
  colName,
  show,
  presetLabel: 'Costs',
  presets: {
    jobs: 'Workers and jobs',
    trap: 'Greedy trap',
    five: 'Five by five',
  },
  sizeLabel: 'Size n',
  resetCosts: 'Reset costs',
  tableTitle: 'Reduced costs r(i, j) = c(i, j) − u[i] − v[j], with the potentials',
  tableAria:
    'Reduced cost table: one row per worker, one column per job, then the potentials u (last column) and v (row v), and the slack of each column outside the tree.',
  potentialU: 'u',
  potentialV: 'v',
  slackRow: 'slack',
  /** @param {string} row @param {string} col @param {string} value @param {string} state */
  cellLabel: (row, col, value, state) =>
    [`${row}, ${col}: ${value}`, state].filter(Boolean).join(', '),
  /** @param {number} j */
  colHead: (j) => `job ${colName(j)}`,
  /** @param {number} i */
  rowHead: (i) => `worker ${rowName(i)}`,
  costsTitle: 'Costs c(i, j)',
  /** @param {string} row @param {string} col */
  costAria: (row, col) => `Cost of worker ${row} on job ${col}`,
  /** @param {number} max */
  badCost: (max) => `A cost must be a whole number from 0 to ${max}. The old cost is kept.`,
  states: {
    assigned: 'assigned',
    flipped: 'flipped into the assignment now',
    read: 'read by this scan',
    picked: 'smallest slack',
    tree: 'in the tree',
    shifted: 'potential shifted now',
  },
  legend: {
    assigned: 'Assigned pair',
    flipped: 'Just flipped',
    read: 'Read by the scan',
    picked: 'Smallest slack δ',
    tree: 'Row or column in the tree',
    shifted: 'Potential shifted',
  },
  stats: {
    cost: 'Cost of the pairs',
    bound: 'Σ u + Σ v',
    rows: 'Rows assigned',
    reads: 'Reduced costs read',
  },
  /**
   * @param {HungarianFrame} f
   */
  describe(f) {
    const n = f.u.length;
    const rows = f.treeRows.map(rowName);
    const cols = f.treeCols.map(colName);
    const j = colName(f.pick);
    switch (f.kind) {
      case 'start':
        return 'All potentials start at 0, so every reduced cost equals its cost. Rows join one at a time, and each one is placed along a cheapest augmenting path.';
      case 'row':
        return `Add worker ${rowName(f.root)}. Its alternating tree starts as row ${rowName(f.root)} alone.`;
      case 'scan':
        return `Read row ${rowName(f.from)}’s reduced costs into the slack of each column outside the tree. The smallest slack is δ = ${show(f.delta)}, at column ${j} (from row ${rowName(f.via[f.pick])})${
          f.delta === 0 ? ': that edge is already tight, so the potentials stay.' : '.'
        }`;
      case 'adjust':
        return `Add δ = ${show(f.delta)} to u of row${rows.length > 1 ? 's' : ''} ${join(rows)}${
          cols.length
            ? ` and take it from v of column${cols.length > 1 ? 's' : ''} ${join(cols)}`
            : ''
        }. Tree edges stay at 0, no reduced cost goes below 0, and r(${rowName(f.via[f.pick])}, ${j}) becomes 0.`;
      case 'tight': {
        const r = rowName(/** @type {number} */ (f.treeRows.at(-1)));
        return `Column ${colName(/** @type {number} */ (f.treeCols.at(-1)))} joins the tree. It is assigned to row ${r}, so row ${r} joins too, and its edges are read next.`;
      }
      case 'free':
        return `Column ${colName(/** @type {number} */ (f.treeCols.at(-1)))} joins the tree and is free: a path of zero reduced costs leads to it from row ${rowName(f.root)}.`;
      case 'augment':
        return `Flip the path: ${join(f.path.map(([r, c]) => `${rowName(r)} → ${colName(c)}`))}. ${f.colOf.filter((x) => x >= 0).length} of ${n} rows assigned, cost ${f.cost}; Σ u + Σ v = ${show(f.bound)}.`;
      case 'done':
        return n
          ? `Done: ${join(f.colOf.map((c, r) => `${rowName(r)} → ${colName(c)}`))} costs ${f.cost}, and Σ u + Σ v = ${show(f.bound)} as well, which proves no assignment is cheaper. Brute force would compare ${factorial(n)} assignments.`
          : 'Nothing to assign.';
    }
  },
  takeaways: [
    'Min-cost flow puts a cost on each edge and asks for a flow of a given value with the least total cost. Successive shortest paths does it by always augmenting along a cheapest s → t path in the residual graph, where a backward arc refunds the cost (−cost).',
    'The assignment problem is the min-cost flow on s → workers → jobs → t with capacities 1: a perfect matching of least total cost.',
    'Potentials u and v make every reduced cost r(i, j) = c(i, j) − u[i] − v[j] non-negative, so the cheapest augmenting path can be found Dijkstra-style; each row added is one shortest path, so n rows cost O(n²) each and O(n³) in all.',
    'Every assignment costs Σ u + Σ v plus its reduced costs, which are at least 0. When the assignment uses only zero cells, its cost equals Σ u + Σ v, the lowest possible: that is the proof of optimality.',
    'Try it: on “Greedy trap”, add up the cheapest-cell-first assignment by hand, then step to the end and compare it with the Hungarian answer.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    [
      'Hungarian algorithm',
      'O(n³)',
      'n rows; each grows a tree in at most n steps, and each step updates n slacks.',
    ],
    ['Brute force', 'O(n · n!)', 'Every one of the n! assignments, each summed in O(n).'],
    [
      'Successive shortest paths',
      'O(F · E log V)',
      'F augmentations for a flow of value F, each one Dijkstra run on reduced costs.',
    ],
    ['Memory', 'O(n²)', 'The cost matrix, plus O(n) potentials, slacks and links.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'On “Workers and jobs”, what does the cheapest assignment cost?',
      answer: 13,
      tolerance: 0,
      hints: ['Step to the end and read the cost, or check Σ u + Σ v.'],
      solution: 'A → 2, B → 1, C → 3, D → 4 costs 2 + 6 + 1 + 4 = 13, and Σ u + Σ v = 18 − 5 = 13.',
    },
    {
      type: 'number',
      prompt:
        'On “Greedy trap”, take the cheapest cell left each time (crossing out its row and column). What does that assignment cost?',
      answer: 13,
      tolerance: 0,
      hints: [
        'The cheapest cell is A – 1 (cost 1). Which cells remain?',
        'Then C – 2 (cost 3), and B must take job 3.',
      ],
      solution:
        'A → 1 (1), C → 2 (3), B → 3 (9): 13. The Hungarian algorithm finds A → 2, B → 1, C → 3 for 2 + 2 + 4 = 8.',
    },
    {
      type: 'number',
      prompt: 'On “Workers and jobs”, when row C joins, what is δ at the first scan from row C?',
      answer: 1,
      tolerance: 0,
      hints: ['Row C’s reduced costs are 5, 8, 1, 8 at that point.'],
      solution:
        'u and v are still 0 for row C and every column, so its slacks are its costs 5, 8, 1, 8, and the smallest is 1 at column 3, which is taken by B.',
    },
    {
      type: 'number',
      prompt:
        'Successive shortest paths: an edge u → v with cost 5 per unit carries 2 units. What is the cost per unit of the backward arc v → u in the residual graph?',
      answer: -5,
      tolerance: 0,
      hints: ['Sending a unit back along v → u cancels a unit on u → v. What happens to the bill?'],
      solution:
        'Cancelling a unit of flow on u → v refunds its cost, so the backward arc costs −5. That is why the residual graph can have negative arcs, and why potentials are needed before Dijkstra can search it.',
    },
    {
      type: 'choice',
      prompt: 'Why is Σ u + Σ v never more than the cost of any assignment?',
      options: [
        'Because the potentials only ever decrease.',
        'Because each assignment costs Σ u + Σ v plus its reduced costs, and reduced costs are never negative.',
        'Because the algorithm stops as soon as Σ u + Σ v reaches the cost.',
        'Because u and v are the row and column minimums.',
      ],
      answer: 1,
      hints: ['Write c(i, j) = u[i] + v[j] + r(i, j) and add it over a whole assignment.'],
      solution:
        'An assignment uses each row and each column once, so its cost is Σ u + Σ v + Σ r over its cells, and every r ≥ 0. Equality needs all its cells at 0.',
    },
    {
      type: 'text',
      prompt: 'What is the running time of this Hungarian algorithm on an n × n matrix?',
      accept: ['O(n^3)', 'O(n³)', 'n^3', 'n³', 'O(n*n*n)'],
      hints: ['n rows, each grown in at most n steps of O(n) work.'],
      solution:
        'Each of the n rows adds at most n columns to its tree, and each addition updates n slacks: O(n³).',
    },
  ],
  nextTeaser:
    'Next up: Practice: flow modelling, where you turn word problems into flow networks, including vertex capacities.',
};
