/** @typedef {import('$lib/algo-engine/quickselect.js').SelectFrame} SelectFrame */
/** @typedef {import('$lib/algo-engine/quickselect.js').PivotRule} PivotRule */

/** 1st, 2nd, 3rd, 4th, … @param {number} n */
function ordinal(n) {
  const rem = n % 100;
  const suffix = rem >= 11 && rem <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  return `${n}${suffix}`;
}

/** @param {number} x @param {string} word */
const plural = (x, word) => `${x} ${word}${x === 1 ? '' : 's'}`;

export const en = {
  slug: 'quickselect',
  topic: 'divide-and-conquer',
  level: 'Advanced',
  title: 'Quickselect and median of medians',
  intro:
    'The k-th order statistic is the value that would sit at slot k − 1 if the array were sorted: k = 1 is the minimum, k = ⌈n/2⌉ the median. Quickselect finds it without sorting. It partitions around a pivot like quicksort, then keeps only the side that holds slot k − 1, so every round throws part of the array away.',
  summary:
    'Step through quickselect as each partition discards one side, and compare the last-value, random and median-of-medians pivots on the same input.',
  instruction:
    'Type values and the rank k, pick a pivot rule, then step. Faded slots are discarded for good. Try the sorted array with k = 1 under each pivot rule and compare the rounds and comparisons.',
  valuesLabel: 'Values',
  kLabel: 'k (rank)',
  ruleLabel: 'Pivot',
  rules: { last: 'Last value', random: 'Random', mom: 'Median of medians' },
  presetLabel: 'Starting array',
  presetPlaceholder: 'Load an array…',
  presets: {
    example: 'Example',
    sorted: 'Sorted',
    reversed: 'Reversed',
    duplicates: 'Repeated values',
  },
  shuffle: 'Random array',
  errors: {
    format: 'Type whole numbers separated by commas or spaces. The last valid array is back.',
    range: 'Keep every value between 0 and 99. The last valid array is back.',
    count: 'Use between 2 and 20 values. The last valid array is back.',
  },
  /** @param {number} n */
  kError: (n) => `k must be a whole number from 1 to ${n}. The last valid k is back.`,
  newArrayNotice: 'New array loaded.',
  /** @param {string} rule */
  ruleNotice: (rule) => `Pivot rule: ${rule}. The trace starts again.`,
  /** @param {number[]} values @param {number} lo @param {number} hi */
  arrayAria: (values, lo, hi) => `Array: ${values.join(', ')}. Live range [${lo}–${hi}].`,
  /** @param {number} at */
  groupLabel: (at) => `g${at + 1}`,
  legend: {
    pivot: 'Pivot',
    compare: 'Compared with the pivot',
    swap: 'Swapped',
    low: 'Low side: ≤ pivot',
    median: 'Group median',
    answer: 'Answer',
    faded: 'Faded: discarded',
  },
  markers: { pivot: 'P', compare: '?', swap: '⇄', low: '≤', median: 'm', answer: '✓' },
  targetPointer: 'k−1',
  stats: {
    comparisons: 'Comparisons',
    swaps: 'Swaps',
    rounds: 'Rounds',
    live: 'Live values',
  },
  sizesTitle: 'Live values at the start of each round',
  sizesEmpty: 'no round yet',
  compareTitle: 'Comparisons on this input',
  /** @param {number} c */
  compareRow: (c) => `${c} comparisons`,
  /** @param {number} n */
  sortRow: (n) => `≈ ${Math.round(n * Math.log2(n))} (n·log₂ n)`,
  sortLabel: 'Sort first, then index',
  /** @param {number} pivotCost */
  pivotCost: (pivotCost) => `${pivotCost} of them spent choosing pivots`,
  practiceTitle: 'Check yourself',
  /**
   * @param {SelectFrame} f
   * @param {PivotRule} rule
   */
  describe(f, rule) {
    const v = (/** @type {number} */ i) => f.values[i];
    const size = f.hi - f.lo + 1;
    switch (f.kind) {
      case 'start':
        return `Find the ${ordinal(f.k)} smallest of ${f.values.length} values. In sorted order it would sit at slot ${f.k - 1}. Each round puts one pivot in its sorted place and discards the side that cannot hold slot ${f.k - 1}.`;
      case 'round':
        return `Round ${f.sizes.length}: ${plural(size, 'value')} still live in [${f.lo}–${f.hi}].`;
      case 'groups':
        return `Cut [${f.lo}–${f.hi}] into ${plural(f.groups.length, 'group')} of at most 5, sort each and take its lower median: ${f.groups.map((g) => v(g.median)).join(', ')}.`;
      case 'medians':
        return `The median of the ${plural(f.groups.length, 'median')} is ${v(f.pivot)}, found by a recursive selection. About 3/10 of the live values are ≤ ${v(f.pivot)} and as many are ≥ it, so no round keeps more than about 7/10 of them.`;
      case 'pivot':
        if (rule === 'last') return `The pivot is the last live value, ${v(f.pivot)}.`;
        if (rule === 'random')
          return `A random slot gave the pivot ${v(f.pivot)}. It moves to the end of the range.`;
        return `The median of medians ${v(f.pivot)} moves to the end of the range as the pivot.`;
      case 'scan':
        return f.low
          ? `${v(f.j)} ≤ pivot ${v(f.pivot)}: it joins the low side.`
          : `${v(f.j)} > pivot ${v(f.pivot)}: it stays on the high side.`;
      case 'swap':
        return `Swap slots ${f.i} and ${f.j} to grow the low side.`;
      case 'place':
        return `The pivot ${v(f.placed)} lands at slot ${f.placed}, its sorted place: the live values left of it are ≤ ${v(f.placed)}, the ones right of it are larger.`;
      case 'discard': {
        const [from, to] = /** @type {[number, number]} */ (f.cut);
        const side = f.k - 1 < f.placed ? 'left' : 'right';
        return `Slot ${f.k - 1} is ${side} of slot ${f.placed}, so discard [${from}–${to}], ${plural(to - from + 1, 'value')} with the pivot. ${plural(size, 'value')} stay live.`;
      }
      case 'found':
        return f.placed === f.answer
          ? `The pivot landed exactly on slot ${f.k - 1}: the ${ordinal(f.k)} smallest is ${v(f.answer)}.`
          : `Only slot ${f.answer} is still live, so it holds the answer: ${v(f.answer)}.`;
      case 'done': {
        const extra =
          rule === 'mom' ? ` (${f.pivotComparisons} of them spent choosing pivots)` : '';
        return `The ${ordinal(f.k)} smallest is ${v(f.answer)}, found in ${plural(f.sizes.length, 'round')} with ${plural(f.comparisons, 'comparison')}${extra}. The array was never fully sorted.`;
      }
    }
  },
  takeaways: [
    'The k-th order statistic is the value at slot k − 1 of the sorted array. Sorting finds it in O(n log n), but selection needs only O(n).',
    'Quickselect partitions like quicksort and then keeps one side only. A random pivot keeps a constant fraction on average, so the expected work is n + n/2 + n/4 + … = O(n).',
    'A fixed pivot can be the worst choice every time: the last value of a sorted array discards only itself, so finding the minimum costs (n − 1) + (n − 2) + … + 1 = Θ(n²).',
    'Median of medians picks the pivot from groups of 5: take each group’s median, then the median of those. At least about 3n/10 values lie on each side, so T(n) ≤ T(n/5) + T(7n/10) + O(n) = O(n) in the worst case. Its constant is larger, and many equal values need a three-way partition to keep the guarantee.',
    'Load “Sorted”, set k = 1 and step to the end under each pivot rule: the last-value pivot needs 11 rounds and 66 comparisons, median of medians 3 rounds and 36, half of them spent choosing pivots.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    [
      'Quickselect, random pivot',
      'O(n) expected',
      'Each round keeps a constant fraction on average, a geometric series.',
    ],
    ['Quickselect, worst pivot', 'O(n²)', 'A pivot at one end of the range discards only itself.'],
    [
      'Median of medians',
      'O(n) worst case',
      'T(n) ≤ T(n/5) + T(7n/10) + O(n), and 1/5 + 7/10 < 1.',
    ],
    ['Sort, then index', 'O(n log n)', 'It orders every value, more than the question needs.'],
    [
      'Extra memory',
      'O(1) or O(log n)',
      'The loop partitions in place; the recursive median search needs a call stack.',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'With the last value as pivot, how many comparisons does quickselect make to find the minimum (k = 1) of the sorted array 1, 2, …, 10?',
      answer: 45,
      unit: 'comparisons',
      hints: [
        'The pivot is always the largest live value, so only the pivot is discarded.',
        'The rounds compare 9, 8, 7, … values with the pivot.',
      ],
      solution:
        'Each round scans every live value but the pivot, then discards just the pivot: 9 + 8 + … + 1 = 45 comparisons. Type 1, 2, …, 10 into Values with k = 1 and the last-value pivot to check it on the widget.',
    },
    {
      type: 'choice',
      prompt:
        'Why is randomized quickselect O(n) expected while randomized quicksort is O(n log n)?',
      options: [
        'Quickselect uses a better partition',
        'Quickselect recurses into only one side, so the work shrinks geometrically',
        'Quickselect never compares equal values',
        'Quickselect sorts only the first k values',
      ],
      answer: 1,
      hints: [
        'Quicksort works on both sides of every pivot.',
        'Sum the sizes of the ranges quickselect still has to scan.',
      ],
      solution:
        'Quicksort pays n per level for about log n levels. Quickselect follows one side only, so the scanned sizes are about n, n/2, n/4, … in expectation, which sum to O(n).',
    },
    {
      type: 'number',
      prompt:
        '25 distinct values are cut into 5 groups of 5. At least how many values are ≤ the median of medians x?',
      answer: 9,
      unit: 'values',
      hints: [
        'x is the 3rd smallest of the 5 group medians, so 3 medians are ≤ x (x among them).',
        'Each of those groups has 3 values ≤ its median.',
      ],
      solution:
        'Three groups have a median ≤ x, and each of them has 3 values ≤ its median, so at least 3 · 3 = 9 values are ≤ x. By the same argument at least 9 are ≥ x, so whichever side a round keeps holds at most 25 − 9 = 16 values.',
    },
    {
      type: 'text',
      prompt:
        'Solve the median-of-medians recurrence T(n) = T(n/5) + T(7n/10) + n. Give T(n) in O-notation.',
      accept: ['O(n)', 'Θ(n)', 'n', 'linear'],
      hints: [
        'The two calls together get 1/5 + 7/10 = 9/10 of the input.',
        'The level costs are n, 9n/10, 81n/100, …, a geometric series.',
      ],
      solution:
        'Level i of the recursion tree costs at most (9/10)ⁱ n, so the total is at most n · 1 / (1 − 9/10) = 10n = O(n).',
    },
    {
      type: 'order',
      prompt: 'Put one round of quickselect in order.',
      items: [
        'Discard the side that cannot hold slot k − 1',
        'Choose a pivot and move it to the end of the range',
        'Compare the pivot’s slot p with k − 1',
        'Partition the range around the pivot',
      ],
      answer: [1, 3, 2, 0],
      hints: [
        'The pivot must be chosen before anything is compared with it.',
        'You can only compare p with k − 1 once the pivot has its final slot.',
      ],
      solution:
        'Choose the pivot, partition so it lands at its sorted slot p, compare p with k − 1 (stop if equal), and discard the other side.',
    },
  ],
  nextTeaser:
    'Next up: Karatsuba and Strassen, which multiply numbers and matrices with fewer recursive products than the schoolbook method.',
};
