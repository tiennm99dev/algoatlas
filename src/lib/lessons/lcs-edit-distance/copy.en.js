/** @typedef {import('$lib/algo-engine/lcs-edit-distance.js').StringDpFrame} StringDpFrame */
/** @typedef {import('$lib/algo-engine/lcs-edit-distance.js').StringDpMode} StringDpMode */
/** @typedef {import('$lib/algo-engine/lcs-edit-distance.js').StringDpOp} StringDpOp */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {StringDpOp} o */
const opLabel = (o) =>
  ({
    keep: `keep ${o.from}`,
    replace: `${o.from} → ${o.to}`,
    delete: `delete ${o.from}`,
    insert: `insert ${o.to}`,
  })[o.op];

export const en = {
  slug: 'lcs-edit-distance',
  topic: 'dynamic-programming',
  level: 'Intermediate',
  title: 'Longest common subsequence and edit distance',
  intro:
    'To compare two strings, let a cell stand for a pair of prefixes: the first i letters of a and the first j letters of b. The longest common subsequence (LCS) asks how many letters both keep in order; edit distance asks how few inserts, deletes and replaces turn one into the other. Both fill an (m + 1) × (n + 1) table from three neighbours, then walk back from the corner to read the answer itself.',
  summary:
    'Fill the 2D table over prefixes for longest common subsequence and edit distance, then trace the optimal alignment back from the corner.',
  instruction:
    'Pick LCS or edit distance, type two words and step. Each cell reads the cells above, to the left and diagonally up-left; the arrow marked ✓ is the one it keeps. After the last cell, the walk back from the bottom-right corner lights the path and spells out the common letters or the edits.',
  modeLabel: 'Problem',
  modes: { lcs: 'LCS', edit: 'Edit distance' },
  aLabel: 'Word a (rows)',
  bLabel: 'Word b (columns)',
  presetLabel: 'Example',
  presets: { clrs: 'ABCBDAB, BDCABA', kitten: 'KITTEN, SITTING', sunday: 'SUNDAY, SATURDAY' },
  /** @param {number} max */
  wordErrors: (max) => ({
    format: 'Use letters A to Z only, with no spaces.',
    length: `A word may have at most ${max} letters.`,
  }),
  empty: 'ε',
  tableTitle: 'Table over prefixes',
  /** @param {StringDpMode} mode */
  tableNote: (mode) =>
    mode === 'lcs'
      ? 'Cell (i, j) is the LCS length of the first i letters of a and the first j letters of b. ε is the empty prefix.'
      : 'Cell (i, j) is the edit distance from the first i letters of a to the first j letters of b. ε is the empty prefix.',
  /** @param {StringDpMode} mode @param {string} a @param {string} b */
  tableAria: (mode, a, b) =>
    `${mode === 'lcs' ? 'LCS' : 'Edit distance'} table: rows are prefixes of ${a || 'the empty word'}, columns are prefixes of ${b || 'the empty word'}.`,
  /**
   * @param {string} a
   * @param {string} b
   * @param {number} i
   * @param {number} j
   * @param {number|null} v
   * @param {string} state
   */
  cellLabel: (a, b, i, j, v, state) =>
    `${a.slice(0, i) || 'ε'} vs ${b.slice(0, j) || 'ε'}: ${v === null ? 'empty' : v}${state ? `, ${state}` : ''}`,
  cellStates: {
    current: 'filled now',
    kept: 'read, and kept',
    read: 'read',
    path: 'on the walk back',
    answer: 'the answer',
  },
  legend: {
    current: 'Filled now',
    read: 'Read by this cell',
    kept: 'The option it keeps',
    path: 'Walk back from the corner',
    answer: 'The answer',
  },
  markers: { current: '●', read: '○', kept: '✓', path: '◆', answer: '★' },
  stats: { filled: 'Cells filled', result: 'Answer' },
  resultPending: '…',
  commonTitle: 'Common subsequence',
  commonEmpty: 'Read off during the walk back.',
  alignTitle: 'Alignment',
  alignEmpty: 'Read off during the walk back.',
  alignAria: 'Alignment of the two words, with a dash for a gap.',
  gap: '–',
  opNames: { keep: 'keep', replace: 'replace', delete: 'delete', insert: 'insert' },
  opLabel,
  /** @param {StringDpFrame} f */
  describe(f) {
    const lcs = f.mode === 'lcs';
    const T = lcs ? 'L' : 'D';
    const ca = f.a[f.i - 1];
    const cb = f.b[f.j - 1];
    const cell = (/** @type {number} */ i, /** @type {number} */ j) => `${T}[${i}][${j}]`;
    switch (f.kind) {
      case 'start':
        return lcs
          ? `Find the longest common subsequence of ${f.a || 'ε'} and ${f.b || 'ε'}. The table has ${f.a.length + 1} × ${f.b.length + 1} cells, one per pair of prefixes.`
          : `Find the fewest edits that turn ${f.a || 'ε'} into ${f.b || 'ε'}. The table has ${f.a.length + 1} × ${f.b.length + 1} cells, one per pair of prefixes.`;
      case 'base':
        return lcs
          ? 'Base cases: row 0 and column 0 are 0, because an empty prefix has no letters in common with anything.'
          : 'Base cases: D[i][0] = i, deleting all i letters, and D[0][j] = j, inserting all j letters.';
      case 'fill': {
        const here = cell(f.i, f.j);
        const v = f.table[f.i][f.j];
        if (f.match)
          return lcs
            ? `a[${f.i}] = b[${f.j}] = ${ca}: a match. Extend the diagonal: ${here} = ${cell(f.i - 1, f.j - 1)} + 1 = ${v}.`
            : `a[${f.i}] = b[${f.j}] = ${ca}: keep it for free. ${here} = ${cell(f.i - 1, f.j - 1)} = ${v}.`;
        const o = Object.fromEntries(f.options.map((x) => [x.move, x.value]));
        if (lcs) {
          const pick = f.move === 'up' ? `drop ${ca} from a` : `drop ${cb} from b`;
          return `${ca} ≠ ${cb}: one of them is not in the LCS. Drop ${ca} → ${o.up}, drop ${cb} → ${o.left}. Keep the larger (${pick}): ${here} = ${v}.`;
        }
        const pick = { diag: `replace ${ca} by ${cb}`, up: `delete ${ca}`, left: `insert ${cb}` }[
          /** @type {'diag'|'up'|'left'} */ (f.move)
        ];
        return `${ca} ≠ ${cb}: replace ${ca} by ${cb} → ${o.diag}, delete ${ca} → ${o.up}, insert ${cb} → ${o.left}. Cheapest: ${pick}, so ${here} = ${v}.`;
      }
      case 'trace': {
        const here = cell(f.i, f.j);
        if (lcs)
          return f.move === 'diag'
            ? `At ${here}: ${ca} matches, so it is in the LCS. Step diagonally.`
            : `At ${here}: ${ca} ≠ ${cb}. Step ${f.move === 'up' ? 'up, dropping ' + ca : 'left, dropping ' + cb}, towards the cell this one copied.`;
        if (f.move === 'diag')
          return f.match
            ? `At ${here}: keep ${ca}. Step diagonally.`
            : `At ${here}: replace ${ca} by ${cb}. Step diagonally.`;
        return f.move === 'up'
          ? `At ${here}: delete ${ca}. Step up.`
          : `At ${here}: insert ${cb}. Step left.`;
      }
      case 'done':
        if (lcs)
          return f.result
            ? `The LCS has length ${f.result}: ${f.common}. The walk back took the diagonal at every match.`
            : 'The words share no letter, so the LCS is empty.';
        return `${f.a || 'ε'} becomes ${f.b || 'ε'} in ${plural(/** @type {number} */ (f.result), 'edit', 'edits')}${
          f.result
            ? `: ${f.ops
                .filter((o) => o.op !== 'keep')
                .map(opLabel)
                .join(', ')}`
            : ''
        }.`;
    }
  },
  takeaways: [
    'A 2D table over prefixes: cell (i, j) solves the problem for a[1..i] and b[1..j], so (m + 1)(n + 1) cells cover every subproblem, with row and column 0 for the empty prefix.',
    'Each cell asks what happens to the last letters a[i] and b[j]: a match uses the diagonal; otherwise LCS drops one of them, and edit distance pays 1 to insert, delete or replace.',
    'Filling row by row works because every cell reads only the cells above, to the left and up-left.',
    'Path reconstruction: walk back from the corner along the choices that made each value. The diagonals at matches spell the LCS; the moves of edit distance spell the edits.',
    'Load KITTEN and SITTING in both modes: LCS ITTN has length 4 and the distance is 3. For strings of lengths m and n, the distance is at least |m − n| and at most max(m, n); check both on SUNDAY and SATURDAY.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    ['Time, both', 'O(m·n)', '(m + 1)(n + 1) cells, each reading at most 3 neighbours.'],
    [
      'Memory, full table',
      'O(m·n)',
      'Keeping every cell is what lets the walk back rebuild the answer.',
    ],
    [
      'Memory, value only',
      'O(min(m, n))',
      'Each row reads only the row above, so two rows are enough when only the number is needed.',
    ],
    ['Walk back', 'O(m + n)', 'Every step moves up, left or both, so it ends within m + n steps.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How long is the longest common subsequence of AGGTAB and GXTXAYB?',
      answer: 4,
      unit: 'letters',
      hints: ['Pick LCS, type the two words and step to the end.'],
      solution: 'L[6][7] = 4. The walk back spells GTAB, which is in both words in order.',
    },
    {
      type: 'number',
      prompt: 'What is the edit distance from HORSE to ROS?',
      answer: 3,
      unit: 'edits',
      hints: [
        'Pick Edit distance, type HORSE and ROS and step to the end.',
        'The lengths differ by 2, so at least 2 edits are needed.',
      ],
      solution: 'D[5][3] = 3: replace H by R, delete R, delete E. HORSE → RORSE → ROSE → ROS.',
    },
    {
      type: 'number',
      prompt:
        'How many cells does the table for ABCBDAB and BDCABA have, counting row and column 0?',
      answer: 56,
      unit: 'cells',
      hints: ['There is one row per prefix of a, including the empty one: m + 1 rows.'],
      solution: '(7 + 1) × (6 + 1) = 8 × 7 = 56 cells, 14 of them base cases.',
    },
    {
      type: 'choice',
      prompt: 'In edit distance, why is D[i][0] = i?',
      options: [
        'Because the first i letters always match.',
        'Turning i letters into the empty word needs exactly i deletes.',
        'Because inserting is free.',
        'It is a convention with no meaning.',
      ],
      answer: 1,
      hints: ['Column 0 stands for the empty prefix of b.'],
      solution:
        'D[i][0] compares a[1..i] with the empty word. Nothing can be kept or replaced, so every one of the i letters must be deleted. Likewise D[0][j] = j inserts.',
    },
    {
      type: 'order',
      prompt:
        'The walk back for KITTEN → SITTING reads the edits from the end. Put them in string order, start to finish.',
      items: ['insert G', 'replace E by I', 'replace K by S'],
      answer: [2, 1, 0],
      hints: ['Load the KITTEN example in Edit distance mode and step to the end.'],
      solution:
        'K → S at the start (SITTEN), then E → I (SITTIN), then insert G at the end (SITTING): 3 edits.',
    },
    {
      type: 'text',
      prompt: 'What is the running time of either table for strings of lengths m and n?',
      accept: ['O(mn)', 'O(m·n)', 'O(m*n)', 'O(nm)', 'Θ(mn)'],
      hints: ['Count the cells and the work per cell.'],
      solution: '(m + 1)(n + 1) cells with O(1) work each: O(mn).',
    },
  ],
  nextTeaser:
    'Next up: 0/1 knapsack and subset sum, where the second dimension of the table is the remaining capacity rather than a second string.',
};
