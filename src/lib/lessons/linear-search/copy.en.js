/** @typedef {import('$lib/algo-engine/linear-search.js').LinearFrame} LinearFrame */
/** @typedef {import('$lib/algo-engine/linear-search.js').LinearVariant} LinearVariant */

/** @param {number} k @param {string} one @param {string} many */
const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;

export const en = {
  slug: 'linear-search',
  topic: 'searching',
  level: 'Beginner',
  title: 'Linear search',
  intro:
    'Linear search checks the cells one by one from the left until it meets the value it wants or runs out of cells. It needs no order at all, so it works on any array, but a miss costs a look at every cell.',
  summary:
    'Scan an unsorted array cell by cell, count the comparisons, and see how a sentinel removes the bound check from the loop.',
  instruction:
    'Type an array and a target, or click a cell to search for its value, then step through. Switch to Sentinel and compare the bound checks counter on the same input.',
  takeaways: [
    'Linear search is a sequential scan: compare a[0], a[1], a[2], … with x and stop at the first match. It returns the first copy when x repeats.',
    'It needs no sorting, so it is the only choice for unsorted data you search once.',
    'If x sits at index k it costs k + 1 comparisons. The worst case, x last or missing, reads all n cells: O(n).',
    'The plain loop pays for two tests per cell, i < n and a[i] == x. A sentinel, a copy of x placed after the last cell, guarantees the loop stops, so only one bound check is left, after the loop.',
    'Try “Missing target” in both variants: plain makes n comparisons and n + 1 bound checks, the sentinel n + 1 comparisons and just 1 bound check.',
  ],
  complexityHead: ['Case', 'Cost', 'Why'],
  complexity: [
    ['Best', 'O(1)', 'x is in the first cell: one comparison.'],
    ['Average (x present, any place equally likely)', 'O(n)', 'About (n + 1) / 2 comparisons.'],
    ['Worst (x last or missing)', 'O(n)', 'Every cell is compared once.'],
    ['Memory', 'O(1)', 'Only the index i; the sentinel needs one spare slot.'],
  ],
  nextTeaser:
    'Next up: binary search, which needs sorted input but throws away half of the cells with each comparison.',
  variantLabel: 'Variant',
  variants: /** @type {Record<LinearVariant, string>} */ ({
    plain: 'Plain',
    sentinel: 'Sentinel',
  }),
  valuesLabel: 'Array',
  targetLabel: 'Target x',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 31, 8, 52.',
    range: 'Every value must be from 0 to 99.',
    count: 'Type from 1 to 16 values.',
  },
  targetError: 'The target must be a whole number from 0 to 99.',
  newArray: 'New array',
  targetFirst: 'Target at the front',
  targetLast: 'Target at the end',
  targetMissing: 'Missing target',
  /** @param {number} x */
  pickedNotice: (x) => `Searching for ${x} now. Step forward to start the scan.`,
  selectHint: 'Click a cell, or focus it and press Enter, to search for its value.',
  /** @param {number[]} values @param {boolean} sentinel @param {number} x */
  arrayLabel: (values, sentinel, x) =>
    `Array: ${values.join(', ')}${sentinel ? `, then the sentinel ${x}` : ''}`,
  /** @param {number} i @param {number} v @param {string} state */
  cellLabel: (i, v, state) => `Index ${i}: ${v}${state ? `, ${state}` : ''}`,
  /** @param {number} i @param {number} x */
  sentinelLabel: (i, x) => `Index ${i}: sentinel copy of ${x}`,
  cellStates: {
    checked: 'checked, not x',
    compare: 'being compared',
    found: 'found',
  },
  legend: {
    compare: 'Being compared',
    visited: 'Checked, not x',
    sorted: 'Found',
    frontier: 'Sentinel slot a[n]',
  },
  markers: { compare: '?', visited: '✕', sorted: '✓', frontier: 'S' },
  stats: {
    comparisons: 'Key comparisons',
    boundChecks: 'Bound checks',
    total: 'Total tests',
    worst: 'Worst-case comparisons',
  },
  compareTitle: 'Both variants on this input',
  /** @param {number} comparisons @param {number} bounds */
  compareRow: (comparisons, bounds) =>
    `${plural(comparisons, 'comparison', 'comparisons')} + ${plural(bounds, 'bound check', 'bound checks')} = ${comparisons + bounds}`,
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Plain variant, starting array 31, 8, 52, 19, 77, 40, 63, 25, 90, 14 and target 63. How many key comparisons does the scan make?',
      answer: 7,
      unit: 'comparisons',
      hints: [
        'Step to the end and read the Key comparisons card.',
        '63 sits at index 6, and a scan that finds x at index k makes k + 1 comparisons.',
      ],
      solution:
        '63 is at index 6, so the scan compares a[0] to a[6]: 7 comparisons, with 7 bound checks before them.',
    },
    {
      type: 'number',
      prompt:
        'On the same 10-cell array, search for a missing target with the plain variant. How many tests does it make in total, comparisons plus bound checks?',
      answer: 21,
      unit: 'tests',
      hints: [
        'Press Missing target and read the Total tests card at the last step.',
        'Every cell costs one bound check and one comparison, and one more bound check (10 < 10) ends the loop.',
      ],
      solution:
        '10 comparisons and 11 bound checks: 21 tests. With a sentinel the same miss costs 11 comparisons and 1 bound check, 12 tests.',
    },
    {
      type: 'choice',
      prompt: 'Why can the sentinel loop drop the test i < n?',
      options: [
        'Because the array is sorted.',
        'Because a[n] holds a copy of x, so a[i] == x becomes true by i = n at the latest.',
        'Because the loop counts down from n to 0.',
        'Because it stops after n / 2 steps.',
      ],
      answer: 1,
      hints: [
        'Look at the extra slot marked S in the Sentinel variant.',
        'What stops the loop when x is missing from the real cells?',
      ],
      solution:
        'The copy of x after the last cell is a guaranteed match, so the scan can never run past index n. One bound check after the loop tells a real hit (i < n) from the sentinel (i = n).',
    },
    {
      type: 'text',
      prompt: 'What is the worst-case time of linear search on n cells, in big-O notation?',
      accept: ['O(n)'],
      hints: [
        'Pick a missing target and count how many cells are read.',
        'The count grows in step with n.',
      ],
      solution:
        'O(n): when x is last or missing, every one of the n cells is compared once. The sentinel saves bound checks, not comparisons, so it is still O(n).',
    },
  ],
  /** @param {LinearFrame} f @param {number[]} a @param {number} x */
  describe(f, a, x) {
    const n = a.length;
    const sentinel = f.variant === 'sentinel';
    switch (f.kind) {
      case 'start':
        return sentinel
          ? `Copy ${x} into the spare slot a[${n}] as a sentinel and set i = 0. The scan is now sure to stop.`
          : `Scan the ${n} cells from left to right for ${x}, starting at i = 0.`;
      case 'compare': {
        if (sentinel && f.i === n)
          return `i = ${n}: this is the sentinel, a copy of ${x}, so a[i] != x is false and the loop stops.`;
        const bound = sentinel ? '' : `Is ${f.i} < ${n}? Yes. `;
        return f.match
          ? `${bound}Compare a[${f.i}] = ${a[f.i]} with ${x}: equal, so the loop stops here.`
          : `${bound}Compare a[${f.i}] = ${a[f.i]} with ${x}: not equal, move on to i = ${f.i + 1}.`;
      }
      case 'found':
        return sentinel
          ? `The loop stopped at i = ${f.i}, and ${f.i} < ${n}, so this is a real copy: return ${f.i}.`
          : `Found ${x} at index ${f.i} after ${plural(f.comparisons, 'comparison', 'comparisons')}.`;
      case 'not-found':
        return sentinel
          ? `The loop stopped at i = ${n}: only the sentinel matched. ${x} is not in the array, return −1.`
          : `Is ${n} < ${n}? No: every cell was checked. ${x} is not in the array, return −1.`;
    }
  },
};
