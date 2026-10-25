/** @typedef {import('$lib/algo-engine/two-pointers.js').PointerFrame} PointerFrame */
/** @typedef {import('$lib/algo-engine/two-pointers.js').PointerMode} PointerMode */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

export const en = {
  slug: 'two-pointers',
  topic: 'arrays-strings',
  level: 'Beginner',
  title: 'Two pointers',
  intro:
    'Two pointers keep two indices into one array and move them towards each other, so each step rules out at least one element for good. On a sorted array that finds a pair with a given sum in one pass, O(n) instead of checking all n(n − 1)/2 pairs. The same converging walk partitions an array in place with no extra memory.',
  summary:
    'Move lo and hi inward over a sorted array to find a pair with a target sum, then use i and j to partition an array in place around a pivot.',
  instruction:
    'Pick Pair sum or Partition, type the values and a target or pivot, then step. In Pair sum, watch which pointer moves when the sum is too small or too large and which cells are ruled out. In Partition, watch i and j close in and swap the misplaced pairs.',
  modeLegend: 'Problem',
  modes: /** @type {Record<PointerMode, string>} */ ({
    pair: 'Pair sum',
    partition: 'Partition',
  }),
  valuesLabel: 'Values',
  targetLabel: 'Target T',
  pivotLabel: 'Pivot p',
  randomButton: 'Random values',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 4, 1, 7.',
    range: 'Every value must be from −99 to 99.',
    count: 'Type from 2 to 16 values.',
  },
  targetError: 'The target must be a whole number from −198 to 198.',
  pivotError: 'The pivot must be a whole number from −99 to 99.',
  sortedNote: 'Pair sum needs a sorted array, so the values are shown sorted ascending.',
  arrayTitle: 'Array a',
  arrayAria: 'The array, index 0 first',
  pointerNames: /** @type {Record<PointerMode, [string, string]>} */ ({
    pair: ['lo', 'hi'],
    partition: ['i', 'j'],
  }),
  windowLess: '< p',
  windowMore: '≥ p',
  markers: { out: '×', less: '<', more: '≥', found: '✓' },
  /** @param {number} i @param {number} v @param {string} state */
  cellLabel: (i, v, state) => `Index ${i}: ${v}${state ? `, ${state}` : ''}`,
  states: {
    read: 'being read',
    out: 'ruled out',
    found: 'part of the pair',
    less: 'placed left, less than p',
    more: 'placed right, at least p',
    swapped: 'just swapped',
  },
  legend: {
    read: 'Read now',
    out: '× Ruled out',
    found: '✓ The pair',
    less: '< Placed left (< p)',
    more: '≥ Placed right (≥ p)',
    swapped: 'Just swapped',
  },
  sumTitle: 'Current sum',
  /** @param {number} a @param {number} b @param {number} s @param {number} t */
  sumLine: (a, b, s, t) => `${a} + ${b} = ${s} ${s === t ? '=' : s < t ? '<' : '>'} ${t}`,
  stats: {
    sums: 'Sums checked',
    pairs: 'Pairs by brute force',
    reads: 'Comparisons with p',
    swaps: 'Swaps',
    n: 'Length n',
    result: 'Result',
  },
  /** @param {[number, number] | null} found */
  pairResult: (found) => (found ? `(${found[0]}, ${found[1]})` : 'none'),
  pending: '—',
  practiceTitle: 'Check yourself',
  /** @param {PointerFrame} f */
  describe(f) {
    const a = f.items;
    switch (f.kind) {
      case 'start':
        return f.mode === 'pair'
          ? `Sorted array of ${a.length}. Looking for two values that add up to ${f.target}: lo starts at 0, hi at ${a.length - 1}.`
          : `Partition ${a.length} values around p = ${f.target}: i starts at 0, j at ${a.length - 1}.`;
      case 'sum':
        return `a[${f.left}] + a[${f.right}] = ${a[f.left]} + ${a[f.right]} = ${f.sum}.`;
      case 'found':
        return `${f.sum} equals the target ${f.target}: the pair is at indices ${f.left} and ${f.right}.`;
      case 'move-left':
        return `${f.sum} < ${f.target}: even the largest partner left, a[${f.right}], is too small for a[${f.left - 1}], so rule it out and move lo to ${f.left}.`;
      case 'move-right':
        return `${f.sum} > ${f.target}: even the smallest partner left, a[${f.left}], is too large for a[${f.right + 1}], so rule it out and move hi to ${f.right}.`;
      case 'missing':
        return `lo and hi met: every value has been ruled out, so no two values add up to ${f.target}.`;
      case 'keep-left':
        return `a[${f.left - 1}] = ${a[f.left - 1]} < ${f.target}: it already belongs on the left. Move i to ${f.left}.`;
      case 'keep-right':
        return `a[${f.left}] = ${a[f.left]} is not < ${f.target}, but a[${f.right + 1}] = ${a[f.right + 1]} ≥ ${f.target} already belongs on the right. Move j to ${f.right}.`;
      case 'swap': {
        const [i, j] = /** @type {[number, number]} */ (f.swapped);
        return `a[${i}] ≥ ${f.target} and a[${j}] < ${f.target} are both on the wrong side: swap them to get ${a[i]} and ${a[j]}, then move i to ${f.left} and j to ${f.right}.`;
      }
      case 'done':
        if (f.mode === 'pair')
          return f.found
            ? `Done: ${a[f.found[0]]} + ${a[f.found[1]]} = ${f.target} after ${plural(f.checks, 'sum')}; brute force could need ${(a.length * (a.length - 1)) / 2}.`
            : `Done: no pair after ${plural(f.checks, 'sum')}, n − 1 = ${a.length - 1} at most; brute force checks ${(a.length * (a.length - 1)) / 2} pairs.`;
        return `Done: i passed j. a[0..${f.boundary}) holds the ${plural(f.boundary, 'value')} < ${f.target} and a[${f.boundary}..${a.length}) the rest, after ${plural(f.swaps, 'swap')} and no extra array.`;
    }
  },
  takeaways: [
    'Converging pointers start at both ends and move inward. Each step moves one pointer, so the walk ends after at most n − 1 steps: O(n) time, O(1) extra memory.',
    'On a sorted array, if a[lo] + a[hi] is too small, a[lo] cannot be in any pair (its biggest partner left is a[hi]), so lo moves right. If the sum is too large, hi moves left for the same reason.',
    'That one rule replaces the n(n − 1)/2 checks of trying every pair. Sorting first costs O(n log n), which still beats O(n²).',
    'The same idea partitions in place: i skips values that already belong on the left, j skips values that already belong on the right, and a pair on the wrong sides is swapped.',
    'Try Pair sum with a target no pair can reach, such as 99: the pointers meet after exactly n − 1 sums, the worst case.',
  ],
  complexityHead: ['Task', 'Cost', 'Why'],
  complexity: [
    ['Pair sum, sorted input', 'O(n)', 'Each sum rules out one element: at most n − 1 sums.'],
    ['Pair sum, unsorted input', 'O(n log n)', 'Sort first, then one O(n) walk.'],
    ['Pair sum, brute force', 'Θ(n²)', 'Every pair: n(n − 1)/2 sums.'],
    ['Partition in place', 'O(n)', 'i and j together cross the array once; at most n/2 swaps.'],
    ['Extra memory', 'O(1)', 'Two indices; the array is changed in place.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Search a = [1, 3, 4, 6, 8, 11] for a pair with sum 10. How many sums are checked?',
      answer: 5,
      unit: 'sums',
      hints: [
        'Start with 1 + 11 = 12, which is too large, so hi moves left.',
        'The sums are 12, 9, 11, 9, then 10.',
      ],
      solution:
        '1 + 11 = 12 > 10 (hi left), 1 + 8 = 9 < 10 (lo right), 3 + 8 = 11 > 10 (hi left), 3 + 6 = 9 < 10 (lo right), 4 + 6 = 10: found after 5 sums.',
    },
    {
      type: 'number',
      prompt:
        'A sorted array of 10 values has no pair with sum T. How many sums does the two-pointer search check?',
      answer: 9,
      unit: 'sums',
      hints: ['Each sum moves exactly one pointer, and the loop stops when lo = hi.'],
      solution:
        'The pointers start 9 apart and every check closes the gap by 1, so 9 sums are checked, n − 1. Brute force would check 10 × 9 / 2 = 45 pairs.',
    },
    {
      type: 'choice',
      prompt: 'On a sorted array, a[lo] + a[hi] < T. Why is it safe to move lo right?',
      options: [
        'a[hi] is the largest partner left for a[lo], and even it is too small',
        'a[lo] is the smallest value, so it can never be in a pair',
        'Moving hi left would make the sum larger',
        'The pair must contain a[hi]',
      ],
      answer: 0,
      hints: ['Which values can still be paired with a[lo]? They are all ≤ a[hi].'],
      solution:
        'Every value still in range is ≤ a[hi], so a[lo] plus any of them is ≤ a[lo] + a[hi] < T. a[lo] is in no pair and can be ruled out.',
    },
    {
      type: 'number',
      prompt: 'Partition [7, 2, 9, 4, 1] around p = 5 with i and j. How many swaps are made?',
      answer: 2,
      unit: 'swaps',
      hints: [
        'First a[0] = 7 is not < 5 while a[4] = 1 is < 5.',
        'After that swap, i skips 2 and stops at 9 while j stops at 4.',
      ],
      solution:
        'Swap 7 and 1 → [1, 2, 9, 4, 7]; i skips 2; swap 9 and 4 → [1, 2, 4, 9, 7]; now i = 3 > j = 2. Two swaps, and the function returns 3.',
    },
    {
      type: 'text',
      prompt: 'What is the running time of the two-pointer pair search on an already sorted array?',
      accept: ['O(n)', 'Θ(n)', 'n', 'linear'],
      hints: ['Count how many times a pointer can move.'],
      solution: 'At most n − 1 sums, each O(1): O(n).',
    },
  ],
  nextTeaser:
    'Next up: Sliding window, where two pointers move the same way and carry a running sum along.',
};
