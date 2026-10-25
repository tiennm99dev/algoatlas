/** @typedef {import('$lib/algo-engine/prefix-sums.js').PrefixFrame} PrefixFrame */
/** @typedef {import('$lib/algo-engine/prefix-sums.js').PrefixMode} PrefixMode */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

/** A signed number with a Unicode minus. @param {number} x */
const signed = (x) => (x < 0 ? `−${-x}` : String(x));

/** Subtracting a negative reads better in brackets. @param {number} x */
const term = (x) => (x < 0 ? `(${signed(x)})` : String(x));

export const en = {
  slug: 'prefix-sums',
  topic: 'arrays-strings',
  level: 'Intermediate',
  title: 'Prefix sums and difference arrays',
  intro:
    'A prefix-sum array P stores the running totals of a: P[i] is the sum of the first i elements. After one O(n) pass, the sum of any range a[l..r] is P[r + 1] − P[l], two lookups in O(1). Run the idea backwards and you get a difference array, which adds a value to a whole range by changing just two entries.',
  summary:
    'Build the prefix-sum row of an array, pick any range to see its sum as one subtraction of two lookups, and apply range updates through a difference array.',
  instruction:
    'In Range sum, type the values, then click two cells of a (or type l and r) to choose a range and see P[r + 1] − P[l]. Step back to watch P being built. In Range update, type updates as “l r v” and watch each one touch only two cells of D before one pass rebuilds the array.',
  modeLegend: 'Task',
  modes: /** @type {Record<PrefixMode, string>} */ ({
    prefix: 'Range sum',
    difference: 'Range update',
  }),
  valuesLabel: 'Values',
  lLabel: 'From l',
  rLabel: 'To r',
  updatesLabel: 'Updates (l r v, …)',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 3, −1, 4.',
    range: 'Every value must be from −99 to 99.',
    count: 'Type from 1 to 16 values.',
  },
  /** @param {number} n */
  rangeError: (n) => `l and r must be whole numbers with 0 ≤ l ≤ r ≤ ${n - 1}.`,
  updateErrors: {
    format: 'Write each update as three whole numbers “l r v”, separated by commas.',
    range: 'Each update needs 0 ≤ l ≤ r < n and v from −99 to 99.',
    count: 'Use at most 6 updates.',
  },
  pickHint: 'Click a cell of a to start a range, then another to end it. Enter works too.',
  /** @param {number} i */
  pickFirst: (i) => `Range starts at ${i}. Pick the cell where it ends.`,
  arrayTitle: 'Array a',
  arrayAria: 'Array a, index 0 first',
  prefixTitle: 'Prefix sums P (P[i] = a[0] + … + a[i − 1])',
  prefixAria: 'Prefix sums P, index 0 first',
  diffTitle: 'Difference array D',
  diffAria: 'Difference array D, index 0 first',
  outTitle: 'Rebuilt array b (prefix sums of D)',
  outAria: 'Rebuilt array b, index 0 first',
  empty: '·',
  /** @param {number} l @param {number} r */
  rangeWindow: (l, r) => `a[${l}..${r}]`,
  /** @param {number} v */
  updateWindow: (v) => `+${signed(v)}`.replace('+−', '−'),
  markers: { plus: '+', minus: '−' },
  /** @param {string} name @param {number} i @param {number | null} v @param {string} state */
  cellLabel: (name, i, v, state) =>
    `${name}[${i}]: ${v === null ? 'not filled yet' : signed(v)}${state ? `, ${state}` : ''}`,
  states: {
    read: 'read',
    written: 'just written',
    plus: 'added',
    minus: 'subtracted',
    range: 'in the range',
  },
  legend: {
    range: 'In the range or update',
    read: 'Read',
    written: 'Just written',
    lookups: '+ / − The two lookups',
  },
  /** @param {number} l @param {number} r @param {number} hi @param {number} lo @param {number} result */
  queryLine: (l, r, hi, lo, result) =>
    `a[${l}] + … + a[${r}] = P[${r + 1}] − P[${l}] = ${signed(hi)} − ${term(lo)} = ${signed(result)}`,
  /** @param {number[]} b */
  checkLine: (b) => `Updated array: ${b.map(signed).join(', ')}`,
  stats: {
    build: 'Additions so far',
    lookups: 'Lookups in P',
    naive: 'Reads without P',
    result: 'Range sum',
    writes: 'D cells changed',
    naiveWrites: 'Writes done directly',
    updates: 'Updates',
  },
  pending: '—',
  practiceTitle: 'Check yourself',
  /** @param {PrefixFrame} f */
  describe(f) {
    const a = f.items;
    const n = a.length;
    switch (f.kind) {
      case 'start':
        return f.mode === 'prefix'
          ? `Build P for ${plural(n, 'value')}: P[0] = 0, the sum of no elements. Then answer the sum of a[${f.l}..${f.r}].`
          : `Build the difference array D of ${plural(n, 'value')}, apply the updates to D, then rebuild.`;
      case 'build':
        return `P[${f.at + 1}] = P[${f.at}] + a[${f.at}] = ${signed(/** @type {number} */ (f.prefix[f.at]))} + ${term(a[f.at])} = ${signed(/** @type {number} */ (f.prefix[f.at + 1]))}.`;
      case 'query':
        return `Sum of a[${f.l}..${f.r}] = P[${f.r + 1}] − P[${f.l}] = ${signed(/** @type {number} */ (f.result))}: two lookups instead of ${plural(f.naive, 'read')}.`;
      case 'diff':
        return f.at === 0
          ? `D[0] = a[0] = ${signed(a[0])}.`
          : `D[${f.at}] = a[${f.at}] − a[${f.at - 1}] = ${signed(a[f.at])} − ${term(a[f.at - 1])} = ${signed(/** @type {number} */ (f.diff[f.at]))}.`;
      case 'update-left':
        return `Update ${f.update + 1}: add ${signed(f.value)} to a[${f.l}..${f.r}]. D[${f.l}] gets ${signed(f.value)}, so every rebuilt value from ${f.l} on rises by ${signed(f.value)}.`;
      case 'update-right':
        return f.skipped
          ? `r + 1 = ${f.r + 1} = n: the range runs to the end, so nothing needs cancelling. 1 cell changed instead of ${f.r - f.l + 1}.`
          : `D[${f.r + 1}] loses ${signed(f.value)}, cancelling the rise from ${f.r + 1} on. 2 cells changed instead of ${f.r - f.l + 1}.`;
      case 'rebuild':
        return f.at === 0
          ? `b[0] = D[0] = ${signed(/** @type {number} */ (f.out[0]))}.`
          : `b[${f.at}] = b[${f.at - 1}] + D[${f.at}] = ${signed(/** @type {number} */ (f.out[f.at - 1]))} + ${term(/** @type {number} */ (f.diff[f.at]))} = ${signed(/** @type {number} */ (f.out[f.at]))}.`;
      case 'done':
        return f.mode === 'prefix'
          ? `Done: any other range now costs two lookups too, because P is already built.`
          : `Done: ${plural(f.writes, 'cell')} of D changed instead of ${plural(f.naive, 'element write')}, plus one rebuild pass of ${plural(n, 'step')}.`;
    }
  },
  takeaways: [
    'P has n + 1 entries: P[0] = 0 and P[i + 1] = P[i] + a[i]. Building it is one O(n) pass.',
    'The sum of a[l..r] is P[r + 1] − P[l]: everything up to r, minus everything before l. That is O(1) per query, so q queries cost O(n + q) instead of O(n·q).',
    'Off-by-one care: P is shifted by one from a. The empty prefix P[0] = 0 is what makes ranges that start at 0 work with the same formula.',
    'A difference array D[i] = a[i] − a[i − 1] runs the idea backwards: a is the prefix sum of D. Adding v to a[l..r] is D[l] += v and D[r + 1] −= v, then one pass rebuilds a.',
    'Try Range update with 0, 0, 0, 0, 0, 0 and the updates 1 3 5, 2 5 2: D changes in only three cells, and the rebuild gives 0, 5, 7, 7, 2, 2.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Build P', 'O(n)', 'One addition per element.'],
    ['Range sum a[l..r]', 'O(1)', 'P[r + 1] − P[l]: two lookups and a subtraction.'],
    ['Range sum without P', 'O(r − l + 1)', 'Read every element of the range.'],
    ['Range update via D', 'O(1)', 'Change D[l] and D[r + 1] only.'],
    ['q updates, then read a', 'O(n + q)', 'q times O(1), then one O(n) rebuild.'],
    ['Memory', 'O(n)', 'P has n + 1 entries; D has n.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'For a = [3, 1, 4, 1, 5, 9, 2, 6], what is P[5]?',
      answer: 14,
      hints: ['P[5] is the sum of the first five elements, a[0] to a[4].'],
      solution: 'P[5] = 3 + 1 + 4 + 1 + 5 = 14. Note the shift: P[5] does not include a[5].',
    },
    {
      type: 'number',
      prompt: 'Using P for the same array, what is a[2] + a[3] + a[4] + a[5]?',
      answer: 19,
      hints: ['The range is l = 2 to r = 5, so look up P[6] and P[2].', 'P[6] = 23 and P[2] = 4.'],
      solution: 'P[6] − P[2] = 23 − 4 = 19, which matches 4 + 1 + 5 + 9.',
    },
    {
      type: 'text',
      prompt: 'Once P is built, what is the running time of one range-sum query?',
      accept: ['O(1)', 'Θ(1)', 'constant', 'constant time', '1'],
      hints: ['How many entries of P does a query read?'],
      solution: 'Two lookups and one subtraction, whatever the range length: O(1).',
    },
    {
      type: 'number',
      prompt:
        'a = [0, 0, 0, 0, 0, 0]. Add 5 to a[1..3], then add 2 to a[2..5], through a difference array. What is D[4]?',
      answer: -5,
      hints: [
        'The first update changes D[1] by +5 and D[4] by −5.',
        'The second update changes D[2] by +2; its r + 1 = 6 is past the end.',
      ],
      solution:
        'D starts as all zeros. The first update gives D[1] = 5 and D[4] = −5; the second gives D[2] = 2 and touches nothing else. So D[4] = −5, and the rebuild gives 0, 5, 7, 7, 2, 2.',
    },
    {
      type: 'choice',
      prompt:
        'You must apply q range updates to an array of n values, then read the whole array once. What does a difference array cost?',
      options: ['O(n + q)', 'O(n·q)', 'O(q log n)', 'O(n²)'],
      answer: 0,
      hints: ['Each update changes two entries of D; the rebuild is one pass.'],
      solution:
        'q updates at O(1) each plus one O(n) prefix-sum pass: O(n + q). Updating every element of every range directly can cost O(n·q).',
    },
  ],
  nextTeaser:
    'Next up: String basics and manipulation, where you see why building a string by repeated concatenation can be quadratic.',
};
