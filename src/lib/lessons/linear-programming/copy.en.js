/** @typedef {import('$lib/algo-engine/linear-programming.js').LpFrame} LpFrame */
/** @typedef {import('$lib/algo-engine/linear-programming.js').Constraint} Constraint */
/** @typedef {import('$lib/algo-engine/lup-decomposition.js').Frac} Frac */

const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/** A fraction as text: 3, −7/5. @param {Frac} f */
const fracText = (f) => {
  const sign = f.num < 0 ? '−' : '';
  const top = Math.abs(f.num);
  return f.den === 1 ? `${sign}${top}` : `${sign}${top}/${f.den}`;
};

/** x, y, then the slacks s₁, s₂, … @param {number} j */
const varName = (j) => (j === 0 ? 'x' : j === 1 ? 'y' : `s${SUB[j - 1]}`);

/** a₁x + a₂y as text, skipping zero terms: 3x + 2y, x − y, 4y. @param {number} p @param {number} q */
const linear = (p, q) => {
  const terms = [
    { k: p, v: 'x' },
    { k: q, v: 'y' },
  ].filter((t) => t.k !== 0);
  if (terms.length === 0) return '0';
  return terms
    .map((t, i) => {
      const size = Math.abs(t.k) === 1 ? '' : String(Math.abs(t.k));
      const sign = t.k < 0 ? (i === 0 ? '−' : ' − ') : i === 0 ? '' : ' + ';
      return `${sign}${size}${t.v}`;
    })
    .join('');
};

/** @param {Frac} x @param {Frac} y */
const point = (x, y) => `(${fracText(x)}, ${fracText(y)})`;

export const en = {
  slug: 'linear-programming',
  topic: 'algebraic-randomised',
  level: 'Advanced',
  title: 'Linear programming and the simplex method',
  intro:
    'A linear program maximises a linear objective such as 3x + 2y over the points that satisfy a list of linear inequalities, the feasible region. That region is a convex polygon (a polyhedron in more dimensions), and some optimum always sits at a corner. The simplex method starts at a corner and pivots along edges to a better neighbour until no edge improves the objective.',
  summary:
    'Maximise a linear objective over a feasible polygon with the simplex method, pivoting corner to corner, and read the dual prices off the final tableau.',
  instruction:
    'Edit the objective and the constraints or pick an example, then step. The shaded polygon is the feasible region; each pivot moves the ★ to a neighbouring corner along an edge, and the dashed line is the level line z = constant through it. Watch the reduced-cost row choose the entering variable and the ratio column choose the leaving one.',
  fields: { c1: 'c₁ (x)', c2: 'c₂ (y)' },
  objectiveTitle: 'Maximise z = c₁x + c₂y',
  constraintsTitle: 'Subject to (x, y ≥ 0)',
  /** @param {number} i */
  constraintAria: (i) => `Constraint ${i + 1}`,
  coefLabels: { a1: 'a₁', a2: 'a₂', b: 'b' },
  /** @param {number} i @param {string} part */
  coefAria: (i, part) => `Constraint ${i + 1}, ${part}`,
  addConstraint: 'Add constraint',
  /** @param {number} i */
  removeConstraint: (i) => `Remove constraint ${i + 1}`,
  removeText: 'Remove',
  presetLabel: 'Example',
  presets: {
    classic: 'Three constraints',
    degenerate: 'Degenerate start',
    flat: 'Tied optimum',
    unbounded: 'Unbounded',
    single: 'One constraint',
  },
  /** @param {number} max */
  coefError: (max) => `Coefficients must be whole numbers from −${max} to ${max}.`,
  /** @param {number} max */
  rhsError: (max) =>
    `Each b must be a whole number from 0 to ${max}, so that the origin is a feasible corner.`,
  /** @param {number} max */
  tooMany: (max) => `This lesson keeps at most ${max} constraints, so the picture stays readable.`,
  tooFew: 'At least one constraint is needed.',
  planeTitle: 'Feasible region and the simplex walk',
  /** @param {number} n */
  planeAria: (n) => `The feasible region with ${n} corners`,
  /** @param {string} name @param {Frac} x @param {Frac} y @param {string} role */
  cornerLabel: (name, x, y, role) => `Corner ${name} ${point(x, y)}${role ? `, ${role}` : ''}`,
  cornerRoles: { now: 'current corner', visited: 'visited', best: 'optimal', '': '' },
  cornerMarkers: { now: '★', best: '★' },
  /** @param {Frac} x @param {Frac} y */
  cornerNote: (x, y) => point(x, y),
  /** @param {number} i */
  lineLabel: (i) => String(i + 1),
  /** @param {Frac} z */
  levelLabel: (z) => `z = ${fracText(z)}`,
  legend: {
    region: 'Feasible region',
    now: '★ Current corner',
    path: '→ Simplex path',
    best: '★ Optimal corner',
    level: '- - Level line z = constant',
  },
  tableauTitle: 'Simplex tableau',
  tableauHead: { basis: 'Basis', b: 'b', ratio: 'b / aₑ' },
  costRow: 'Reduced cost',
  zCell: 'z',
  noRatio: '—',
  markers: { enter: '↓', leave: '←', pivot: '●' },
  tableauLegend: '↓ entering column · ← leaving row · ● pivot entry',
  stats: { z: 'Objective z', corner: 'Corner (x, y)', pivots: 'Pivots', status: 'Status' },
  status: { running: 'searching', optimal: 'optimal', unbounded: 'unbounded' },
  dualTitle: 'Duality',
  /** @param {Constraint[]} cons */
  dualProblem: (cons) =>
    `Dual: minimise ${cons.map((c, i) => `${c.b}·y${SUB[i + 1]}`).join(' + ')} subject to Aᵀy ≥ c, y ≥ 0.`,
  /** @param {Frac[]} dual @param {Frac} z */
  dualValues: (dual, z) =>
    `y = (${dual.map(fracText).join(', ')}), and b·y = ${fracText(z)} = z: equal objectives prove both are optimal.`,
  dualPending: 'The dual prices appear when the method stops at an optimum.',
  dualNone: 'An unbounded primal has an infeasible dual: no prices can bound z.',
  fracText,
  varName,
  linear,
  /** @param {Constraint} c */
  constraintText: (c) => `${linear(c.a1, c.a2)} ≤ ${c.b}`,
  /** @param {LpFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `Maximise z = ${linear(f.c[0], f.c[1])}. Start at the corner (0, 0): x and y are 0, and each slack sᵢ = bᵢ takes up all of its constraint. z = 0.`;
      case 'enter': {
        const v = varName(f.entering);
        return `${v} has the largest positive reduced cost, ${fracText(f.cost[f.entering])}: each unit of ${v} adds that much to z. ${v} enters the basis.`;
      }
      case 'leave': {
        const ratio = /** @type {Frac} */ (f.ratios[f.leaving]);
        const out = varName(f.basis[f.leaving]);
        const zero = ratio.num === 0;
        return `Ratio test: ${varName(f.entering)} can grow until some basic variable hits 0. The smallest ratio is ${fracText(ratio)}, in row ${f.leaving + 1}, so ${out} leaves.${zero ? ' The ratio is 0: a degenerate pivot changes the basis but not the corner.' : ''}`;
      }
      case 'pivot':
        return `Pivot: ${varName(f.entering)} enters and ${varName(f.left)} leaves. Rows are rescaled so ${varName(f.entering)}’s column becomes a unit column. Now at corner ${point(f.x, f.y)} with z = ${fracText(f.z)}.`;
      case 'optimal': {
        const tie = f.cost.some((cst, j) => cst.num === 0 && !f.basis.includes(j));
        return `No reduced cost is positive, so no edge from this corner improves z: ${point(f.x, f.y)} is optimal with z = ${fracText(f.z)}.${tie ? ' A reduced cost of 0 on a non-basic variable means a neighbouring corner ties.' : ''}`;
      }
      case 'unbounded':
        return `${varName(f.entering)} would improve z, but no entry of its column is positive, so no constraint ever stops it: z grows without bound along that edge.`;
      case 'done':
        return f.status === 'optimal'
          ? `Optimum z = ${fracText(f.z)} at ${point(f.x, f.y)} after ${f.pivots} ${f.pivots === 1 ? 'pivot' : 'pivots'}. The dual prices y = (${(f.dual ?? []).map(fracText).join(', ')}) give b·y = ${fracText(f.z)} too.`
          : 'The program is unbounded: it has no maximum.';
    }
  },
  takeaways: [
    'Each inequality a₁x + a₂y ≤ b keeps one side of a line; together with x, y ≥ 0 they cut out a convex feasible region. The objective’s level lines z = constant are parallel, so the best point is where the last level line leaves the region: a corner.',
    'The simplex method adds a slack sᵢ ≥ 0 to each constraint to make it an equation. A basis (one variable per row) is a corner; the reduced-cost row says which non-basic variable would raise z.',
    'A pivot brings in the variable with a positive reduced cost and, by the ratio test, removes the row that runs out first. That moves along an edge to a neighbouring corner with z at least as large; a ratio of 0 gives a degenerate pivot that stays put.',
    'Some inputs force exponentially many pivots, but in practice simplex takes few. The final reduced costs of the slacks, negated, are the dual prices y: b·y equals the optimal z (strong duality), a certificate that the answer is optimal.',
    'Try “Unbounded”, then change c₁ to −3: the same region now has an optimum at (0, 2), because the objective no longer points along an endless edge.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    ['One pivot', 'O(m·n)', 'Every entry of the m-row, (n + m)-column tableau is updated once.'],
    [
      'Number of pivots',
      'exponential worst case',
      'Klee–Minty cubes visit all 2ⁿ corners, but typical inputs need only a few times m pivots.',
    ],
    [
      'Polynomial methods',
      'polynomial',
      'Ellipsoid and interior-point methods solve linear programs in polynomial time.',
    ],
    ['Memory', 'O(m·(n + m))', 'The tableau, with one slack column per constraint.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Load “Three constraints” and step to the end. What is the optimal z?',
      answer: 11,
      hints: ['The walk goes (0, 0) → (3, 0) → (3, 1). Evaluate 3x + 2y at the last corner.'],
      solution:
        'z = 3·3 + 2·1 = 11 at (3, 1). Every other corner gives less: (1.5, 2.5) gives 9.5.',
    },
    {
      type: 'number',
      prompt:
        'In “Three constraints”, the first ratio test compares b / a for x in each row. What is the smallest ratio?',
      answer: 3,
      hints: ['The rows are x + y ≤ 4, x + 3y ≤ 9 and x ≤ 3, so the ratios are 4/1, 9/1 and 3/1.'],
      solution: 'min(4, 9, 3) = 3, from x ≤ 3, so that row’s slack s₃ leaves and x becomes 3.',
    },
    {
      type: 'choice',
      prompt: 'Why does the simplex method only ever look at corners of the feasible region?',
      options: [
        'A linear objective over a convex polygon reaches its maximum at a corner, if it has one',
        'The objective is undefined inside the region',
        'Corners are the only points with whole-number coordinates',
        'Edges of the region are never feasible',
      ],
      answer: 0,
      hints: ['Picture the level line z = constant sliding across the polygon.'],
      solution:
        'Level lines are parallel, and the last one touching the polygon touches it at a corner (or along a whole edge, which includes corners). So checking corners is enough.',
    },
    {
      type: 'multi',
      prompt: 'Load “Degenerate start” and step through. Which statements are true?',
      options: [
        'The first pivot stays at the corner (0, 0)',
        'The optimum is at (2, 2) with z = 6',
        'The method needs no pivots at all',
        'The dual prices are (1/2, 3/2)',
      ],
      answers: [0, 1, 3],
      hints: ['The constraint x − y ≤ 0 has b = 0, so its ratio for x is 0.'],
      solution:
        'x enters with ratio 0 from x − y ≤ 0, a degenerate pivot that keeps x = 0. Then y enters and the walk reaches (2, 2) with z = 2·2 + 2 = 6. The duals are (1/2, 3/2), and 0·1/2 + 4·3/2 = 6.',
    },
    {
      type: 'text',
      prompt:
        'For “Three constraints” the dual prices are y = (2, 0, 1). Which constraint is not tight at the optimum? Answer with its inequality, like x + y ≤ 4.',
      accept: ['x + 3y ≤ 9', 'x + 3y <= 9', 'constraint 2', 'the second'],
      hints: [
        'Complementary slackness: a constraint with a positive dual price must be tight, and a slack constraint has price 0.',
      ],
      solution:
        'At (3, 1), x + 3y = 6 < 9, so the second constraint has slack and its dual price is 0. The other two are tight: 3 + 1 = 4 and x = 3.',
    },
  ],
  nextTeaser:
    'Next up: Randomised algorithms, where coin flips make quicksort fast on every input in expectation.',
};
