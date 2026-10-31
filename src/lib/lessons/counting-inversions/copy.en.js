/** @typedef {import('$lib/algo-engine/counting-inversions.js').InversionFrame} InversionFrame */

/** @param {number} x @param {string} word */
const plural = (x, word) => `${x} ${word}${x === 1 ? '' : 's'}`;

/** Pairs a check of every pair reads. @param {number} n */
const allPairs = (n) => (n * (n - 1)) / 2;

export const en = {
  slug: 'counting-inversions',
  topic: 'divide-and-conquer',
  level: 'Intermediate',
  title: 'Counting inversions',
  intro:
    'An inversion is a pair of positions i < j whose values are out of order, a[i] > a[j]. The count says how far an array is from sorted, and it compares two rankings of the same items. Checking every pair costs O(n²); merge sort counts them all in O(n log n) while it sorts.',
  summary:
    'Step through merge sort extended to count inversions: every time a value crosses from the right run ahead of the left run, it adds one inversion per value it jumps over.',
  instruction:
    'Type values or load a starting array, then step through. Watch the merge: when a value is taken from R, every value still waiting in L is larger, so the count grows by |L| − i at once.',
  valuesLabel: 'Values',
  presetLabel: 'Starting array',
  presetPlaceholder: 'Load an array…',
  presets: {
    example: 'Example',
    sorted: 'Sorted',
    reversed: 'Reversed',
    nearly: 'Nearly sorted',
    duplicates: 'Repeated values',
  },
  shuffle: 'Random array',
  errors: {
    format: 'Type whole numbers separated by commas or spaces. The last valid array is back.',
    range: 'Keep every value between 0 and 99. The last valid array is back.',
    count: 'Use between 2 and 16 values. The last valid array is back.',
  },
  newArrayNotice: 'New array loaded.',
  /** @param {number[]} values @param {[number, number] | null} range */
  arrayAria: (values, range) =>
    `Array: ${values.join(', ')}.${range ? ` Working on [${range[0]}–${range[1]}].` : ''}`,
  /** @param {string} name @param {number[]} values @param {number} next */
  bufferAria: (name, values, next) =>
    values.length === 0
      ? `${name}: empty.`
      : `${name}: ${values.join(', ')}. ${next < values.length ? `Next: ${values[next]}.` : 'Used up.'}`,
  leftTitle: 'L, the sorted left half',
  rightTitle: 'R, the sorted right half',
  bufferIdle: 'L and R fill when a merge starts.',
  windowLeft: 'left',
  windowRight: 'right',
  legend: {
    head: 'Next value of L or R',
    moved: 'Written to the array now',
    jumped: 'Jumped over: one inversion each',
    written: 'Already written in this merge',
    sorted: 'Sorted',
    faded: 'Faded: outside the call, already taken, or stale',
  },
  markers: { head: '↑', moved: '↓', jumped: '>', written: '✓', sorted: '✓' },
  stats: {
    inversions: 'Inversions',
    comparisons: 'Comparisons',
    cross: 'Cross pairs in this merge',
    brute: 'Pairs a check of every pair reads',
  },
  /** @param {InversionFrame} f */
  crossStat: (f) => (f.call ? String(f.call.cross) : '—'),
  pairsTitle: 'Inversions found, latest first',
  pairsEmpty: 'none yet',
  /** @param {number} big @param {number} small */
  pairChip: (big, small) => `${big} > ${small}`,
  stackTitle: 'Call stack (outermost first)',
  stackEmpty: 'empty',
  /** @param {number} lo @param {number} hi */
  rangeChip: (lo, hi) => `[${lo}–${hi}]`,
  practiceTitle: 'Check yourself',
  /** @param {InversionFrame} f */
  describe(f) {
    const [lo, hi] = f.range ?? [0, 0];
    switch (f.kind) {
      case 'start':
        return `Count the pairs i < j with a[i] > a[j]. Checking every pair would read ${allPairs(f.values.length)} pairs; merge sort finds them while it sorts.`;
      case 'split':
        return `Split [${lo}–${hi}] at ${f.mid}: count the inversions inside the left half, then inside the right half.`;
      case 'copy': {
        const c = /** @type {NonNullable<InversionFrame['call']>} */ (f.call);
        return `Both halves of [${lo}–${hi}] are sorted, with ${c.left} and ${c.right} inversions inside them. Copy them into L and R and merge, counting the pairs that cross.`;
      }
      case 'take-left': {
        const v = f.left[f.i - 1];
        if (f.j === f.right.length)
          return `R is used up: write ${v} to slot ${f.k}. No value from R jumps it, so +0.`;
        return `L[${f.i - 1}] = ${v} ≤ R[${f.j}] = ${f.right[f.j]}: write ${v} to slot ${f.k}. Ties go left, so equal values never count. +0.`;
      }
      case 'take-right': {
        const v = f.right[f.j - 1];
        if (f.i === f.left.length)
          return `L is used up: write ${v} to slot ${f.k}. Nothing is left to jump over, so +0.`;
        const jumped = f.left.slice(f.i);
        return `R[${f.j - 1}] = ${v} < L[${f.i}] = ${f.left[f.i]}: write ${v} to slot ${f.k}. It jumps ahead of the ${plural(f.gained, 'value')} still in L (${jumped.join(', ')}), each one an inversion: +${f.gained}.`;
      }
      case 'merged': {
        const c = /** @type {NonNullable<InversionFrame['call']>} */ (f.call);
        return `Merged [${lo}–${hi}]: ${c.left} left + ${c.right} right + ${c.cross} cross = ${c.left + c.right + c.cross} inversions in this range.`;
      }
      case 'done': {
        const lead = `${plural(f.inversions, 'inversion')}, found with ${plural(f.comparisons, 'comparison')}. A check of every pair reads ${allPairs(f.values.length)} pairs.`;
        if (f.inversions === 0) return `${lead} The array was already sorted.`;
        if (f.inversions === allPairs(f.values.length))
          return `${lead} Every pair is inverted: the array was in strictly decreasing order.`;
        return lead;
      }
    }
  },
  takeaways: [
    'An inversion is a pair i < j with a[i] > a[j]. A sorted array has 0 and a strictly decreasing one has the most, n(n − 1)/2. Bubble sort makes exactly one swap per inversion, and insertion sort one shift per inversion.',
    'Divide: every inversion lies inside the left half, inside the right half, or crosses between them. Sorting each half recursively counts the first two kinds.',
    'Combine: in the merge, when R[j] is taken while L still holds |L| − i values, all of them are larger than R[j] and sit before it, so add |L| − i at once instead of checking each pair.',
    'Ties take from L, so equal values are never counted. The merge does O(n) work per level and there are log₂ n levels, so the total is O(n log n), against O(n²) for checking every pair.',
    'Load “Reversed” and step to the end: every one of the 66 pairs is an inversion, yet the merges count them all with only 20 comparisons.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    [
      'Merge-sort count',
      'O(n log n)',
      'log₂ n levels; each level merges n values and adds every cross batch in one step.',
    ],
    ['Check every pair', 'O(n²)', 'n(n − 1)/2 pairs, each compared once.'],
    ['Listing the pairs too', 'O(n log n + I)', 'Writing out I inversions costs one step each.'],
    ['Extra memory', 'O(n)', 'The L and R copies of one merge, plus a log₂ n call stack.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many inversions does [2, 4, 1, 3, 5] have?',
      answer: 3,
      unit: 'inversions',
      hints: [
        'For each value, count the smaller values to its right.',
        '2 has one smaller value after it, 4 has two.',
      ],
      solution:
        'The inverted pairs are (2, 1), (4, 1) and (4, 3). 1, 3 and 5 have nothing smaller after them, so the total is 3.',
    },
    {
      type: 'number',
      prompt:
        'Merging L = [2, 5, 9] with R = [1, 6, 7], how many cross inversions does the merge add?',
      answer: 5,
      unit: 'inversions',
      hints: [
        '1 is taken first, while all three values of L are still waiting.',
        'When 6 and 7 are taken, only 9 is left in L.',
      ],
      solution:
        'Taking 1 jumps 2, 5 and 9 (+3). Then 2 and 5 go down from L. Taking 6 jumps 9 (+1), and taking 7 jumps 9 (+1). The total is 3 + 1 + 1 = 5: the pairs (2, 1), (5, 1), (9, 1), (9, 6) and (9, 7).',
    },
    {
      type: 'number',
      prompt: 'What is the largest number of inversions an array of 10 distinct values can have?',
      answer: 45,
      unit: 'inversions',
      hints: ['It is reached when every pair is out of order.', 'There are n(n − 1)/2 pairs.'],
      solution:
        'A strictly decreasing array inverts every pair, and 10 values form 10 · 9 / 2 = 45 pairs.',
    },
    {
      type: 'choice',
      prompt: 'Why does the merge take from L when L[i] equals R[j]?',
      options: [
        'It makes the merge faster',
        'Equal values are not inversions, and taking R first would count L[i] as jumped over',
        'R must always be used up first',
        'It does not matter for the count',
      ],
      answer: 1,
      hints: [
        'An inversion needs a[i] > a[j], strictly.',
        'Taking R[j] adds |L| − i, and L[i] is one of those values.',
      ],
      solution:
        'Taking R[j] first would add |L| − i, which includes L[i] = R[j], an equal pair that is not an inversion. Taking from L first never counts it.',
    },
    {
      type: 'text',
      prompt: 'What is the running time of counting inversions with merge sort, in O-notation?',
      accept: ['O(n log n)', 'n log n', 'Θ(n log n)', 'O(nlogn)'],
      hints: [
        'The recurrence is the same as merge sort’s.',
        'T(n) = 2T(n/2) + n, master theorem case 2.',
      ],
      solution:
        'Counting adds only O(1) work to each step of the merge, so T(n) = 2T(n/2) + Θ(n) = Θ(n log n), the same as merge sort.',
    },
  ],
  nextTeaser:
    'Next up: Quickselect and median of medians, which find the k-th smallest value without sorting the whole array.',
};
