/** @typedef {import('$lib/algo-engine/lup-decomposition.js').LupFrame} LupFrame */
/** @typedef {import('$lib/algo-engine/rational.js').Frac} Frac */

/** A fraction as text: 3, −7/5. @param {Frac} f */
const fracText = (f) => {
  const sign = f.num < 0 ? '−' : '';
  const top = Math.abs(f.num);
  return f.den === 1 ? `${sign}${top}` : `${sign}${top}/${f.den}`;
};

/** @param {(Frac | null)[]} v */
const vector = (v) => `(${v.map((f) => (f ? fracText(f) : '?')).join(', ')})`;

export const en = {
  slug: 'lup-decomposition',
  topic: 'algebraic-randomised',
  level: 'Intermediate',
  title: 'Matrix operations: LUP decomposition',
  intro:
    'Gaussian elimination solves A·x = b by clearing each column below a pivot. Keeping the multipliers it used, instead of throwing them away, factors A into a lower triangle L and an upper triangle U. With row swaps recorded in a permutation P, this LUP decomposition P·A = L·U costs O(n³) once, after which every right-hand side b is solved by two triangular substitutions in O(n²).',
  summary:
    'Factor a matrix into P·A = L·U by Gaussian elimination with partial pivoting, then solve A·x = b by forward and back substitution.',
  instruction:
    'Edit A and b or pick an example, then step. Each column picks a pivot, swaps it up if needed, and clears the entries below it; the multipliers stay in place as L. Then forward substitution finds y and back substitution finds x. Switch off pivoting on “Needs a row swap” to see plain LU fail.',
  fields: { size: 'Size n', pivoting: 'Pivoting' },
  pivotingOptions: { lup: 'Partial (LUP)', lu: 'None (LU)' },
  presetLabel: 'Example',
  presets: {
    clrs: 'CLRS example (3×3)',
    zeroPivot: 'Needs a row swap',
    twoByTwo: 'Small 2×2',
    fourByFour: 'Plain LU works (4×4)',
    singular: 'Singular matrix',
  },
  inputTitle: 'Your system A · x = b',
  /** @param {number} r @param {number} c */
  cellAria: (r, c) => `A row ${r}, column ${c}`,
  /** @param {number} r */
  rhsAria: (r) => `b row ${r}`,
  /** @param {number} max */
  entryError: (max) => `Each entry must be a whole number from −${max} to ${max}.`,
  workTitle: 'Working matrix: L below the diagonal, U on and above',
  /** @param {number} r @param {number} c @param {string} value @param {string} role */
  workCell: (r, c, value, role) => `Row ${r}, column ${c}: ${value}${role ? `, ${role}` : ''}`,
  workAria: 'The working matrix',
  roles: {
    pivot: 'pivot',
    searched: 'pivot candidate',
    updated: 'just updated',
    l: 'entry of L',
    u: 'entry of U',
    '': '',
  },
  markers: { pivot: '▲', searched: '?', updated: '✱', l: 'L', u: 'U', '': '' },
  legend: {
    pivot: '▲ Pivot',
    searched: '? Pivot candidate',
    updated: '✱ Row being updated',
    l: 'L Multiplier (final)',
    u: 'U Row of U (final)',
  },
  vectorsTitle: 'Vectors',
  vectorNames: { perm: 'π', b: 'b', y: 'y', x: 'x' },
  vectorHints: {
    perm: 'row i of P·A is row π[i] of A',
    b: 'the right-hand side',
    y: 'solves L·y = P·b',
    x: 'solves U·x = y, so A·x = b',
  },
  factorsTitle: 'The factors: P · A = L · U',
  factorNames: { P: 'P', L: 'L', U: 'U' },
  /** @param {string} name */
  factorAria: (name) => `The matrix ${name}`,
  stats: {
    swaps: 'Row swaps',
    factorOps: 'Operations to factor',
    solveOps: 'Operations to solve',
    column: 'Column k',
  },
  noColumn: '—',
  fracText,
  /** @param {LupFrame} f */
  describe(f) {
    const n = f.size;
    switch (f.kind) {
      case 'start':
        return `Factor the ${n}×${n} matrix so that P·A = L·U, then solve A·x = b. ${f.pivoting ? 'Partial pivoting takes the entry of largest absolute value in each column as the pivot.' : 'Without pivoting, the pivot is always the diagonal entry a[k][k].'}`;
      case 'pivot': {
        const value = fracText(f.a[f.row][f.k]);
        if (!f.pivoting)
          return `Column ${f.k}: the pivot is the diagonal entry a[${f.k}][${f.k}] = ${value}.`;
        return `Column ${f.k}: the largest |a[i][${f.k}]| for i ≥ ${f.k} is ${value}, in row ${f.row}.${f.row === f.k ? ' It is already on the diagonal, so no swap is needed.' : ''}`;
      }
      case 'stuck':
        return f.pivoting
          ? `Every entry of column ${f.k} from row ${f.k} down is 0, so A is singular: it has no inverse, and A·x = b has no unique solution.`
          : `The pivot a[${f.k}][${f.k}] is 0, so plain LU cannot divide by it and stops. Partial pivoting would swap in a non-zero entry from below, if there is one.`;
      case 'swap':
        return `Swap rows ${f.k} and ${f.row}, and record the swap in π = (${f.perm.join(', ')}).`;
      case 'eliminate': {
        const mult = fracText(/** @type {Frac} */ (f.multiplier));
        return `Row ${f.row}: l = a[${f.row}][${f.k}] / a[${f.k}][${f.k}] = ${mult}. Subtract ${mult} × row ${f.k} from row ${f.row} to clear column ${f.k}, and store l where the zero would go.`;
      }
      case 'factored':
        return `Factoring is done: L is the multipliers below the diagonal with 1s on it, U is the upper triangle, and P·A = L·U.`;
      case 'forward':
        return `Forward substitution, L·y = P·b: y[${f.row}] = b[π[${f.row}]] minus the earlier y’s times row ${f.row} of L = ${fracText(/** @type {Frac} */ (f.y[f.row]))}.`;
      case 'back':
        return `Back substitution, U·x = y: x[${f.row}] = (y[${f.row}] minus the later x’s times row ${f.row} of U) / u[${f.row}][${f.row}] = ${fracText(/** @type {Frac} */ (f.x[f.row]))}.`;
      case 'done':
        if (f.failed)
          return f.pivoting
            ? 'Stopped: a singular matrix has no LUP decomposition with a non-zero U diagonal, so there is no unique x.'
            : 'Stopped on a zero pivot. Switch to partial pivoting and run it again.';
        return `x = ${vector(f.x)}. Factoring took ${f.factorOps} operations (about n³/3); solving took ${f.solveOps} (about n²), so another b would reuse L, U and P cheaply.`;
    }
  },
  takeaways: [
    'Gaussian elimination clears column k below the pivot by subtracting l = a[i][k] / a[k][k] times row k from each row i. The cleared rows end as U, an upper triangular matrix.',
    'Each multiplier l is stored where its zero would go, below the diagonal. Those entries with 1s on the diagonal form L, and A = L·U whenever no pivot is zero.',
    'A zero pivot breaks plain LU even for an invertible matrix, and a tiny one magnifies rounding errors. Partial pivoting swaps up the row with the largest |a[i][k]|, recording swaps in π, so P·A = L·U. If the whole column is 0, A is singular.',
    'To solve A·x = b, solve L·y = P·b top down, then U·x = y bottom up. Factoring costs Θ(n³) once; each solve costs only Θ(n²).',
    'Try “Needs a row swap” with pivoting off, then on: the same invertible matrix fails, then factors with two swaps.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'LUP decomposition',
      'Θ(n³)',
      'Column k updates an (n − k − 1)² block, about n³/3 multiplications in all.',
    ],
    ['Forward substitution', 'Θ(n²)', 'Row i of L·y = P·b uses the i values above it.'],
    ['Back substitution', 'Θ(n²)', 'Row i of U·x = y uses the n − i − 1 values below it.'],
    ['Pivot search', 'Θ(n²)', 'One scan of the column below the diagonal per k.'],
    ['Memory', 'Θ(n²)', 'L and U share the matrix’s own array; π takes n more numbers.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Load the CLRS example and step to the end. What is x[0]? Give it as a decimal.',
      answer: -1.4,
      tolerance: 0.001,
      hints: [
        'Read the x vector on the last step: x[0] is written as a fraction, so divide it out.',
      ],
      solution:
        'The solution is x = (−7/5, 11/5, 3/5), so x[0] = −7/5 = −1.4. Check row 0: 1·(−7/5) + 2·(11/5) + 0 = 15/5 = 3.',
    },
    {
      type: 'number',
      prompt:
        'Load “Needs a row swap” with partial pivoting and step to the end. How many row swaps does it make?',
      answer: 2,
      unit: 'swaps',
      hints: ['Column 0’s largest entry is 2, in row 2. Then look at column 1 after the update.'],
      solution:
        'Column 0 swaps row 2 up (|2| is largest). After clearing, column 1 holds 1/2 in row 1 and 2 in row 2, so it swaps again: 2 swaps.',
    },
    {
      type: 'choice',
      prompt: 'Why does LUP pick the entry with the largest absolute value as the pivot?',
      options: [
        'Dividing by a zero or tiny pivot fails or magnifies rounding errors',
        'It makes U symmetric',
        'It lowers the cost from Θ(n³) to Θ(n²)',
        'It is the only way to make L lower triangular',
      ],
      answer: 0,
      hints: ['Each multiplier is a[i][k] divided by the pivot.'],
      solution:
        'A zero pivot cannot be divided by at all, and a tiny one makes huge multipliers that amplify rounding error. The largest pivot keeps every multiplier within [−1, 1].',
    },
    {
      type: 'text',
      prompt: 'What does it cost to solve A·x = b for a new b once P, L and U are known?',
      accept: ['Θ(n²)', 'O(n^2)', 'theta(n^2)', 'n^2'],
      hints: ['Two triangular solves, each row using the values found before it.'],
      solution:
        'Forward substitution and back substitution each touch every entry of a triangle once: Θ(n²).',
    },
    {
      type: 'order',
      prompt: 'Put the steps of solving A·x = b with LUP in order.',
      items: ['Back substitution: U·x = y', 'Factor P·A = L·U', 'Forward substitution: L·y = P·b'],
      answer: [1, 2, 0],
      hints: ['You need the factors before you can solve with them.'],
      solution:
        'First factor once, then solve the lower triangle for y top down, then the upper triangle for x bottom up.',
    },
  ],
  nextTeaser:
    'Next up: Linear programming and the simplex method, which walks the corners of a feasible region to optimise a linear objective.',
};
