/** @typedef {import('$lib/algo-engine/best-worst-average-case.js').LinearFrame} LinearFrame */
/** @typedef {import('$lib/algo-engine/best-worst-average-case.js').CaseKind} CaseKind */

/** @param {number} x */
const num = (x) => x.toLocaleString('en-US', { maximumFractionDigits: 2 });

export const en = {
  slug: 'best-worst-average-case',
  topic: 'complexity',
  level: 'Beginner',
  title: 'Best, worst and average case',
  intro:
    'The same algorithm can be fast on one input and slow on another of the same size. Linear search finds the first element in one comparison but needs all n when the target is missing, so we describe its cost by case: best, worst, and average (expected).',
  summary:
    'Run linear search on best, worst and random targets, plot the comparison counts, and watch the average of random runs settle near (n + 1)/2.',
  instruction:
    'Edit the array and the target, or press Best case, Worst case or Random element, then step through the scan. Press Random element several times and compare the average of your runs with (n + 1)/2.',
  arrayLabel: 'Array (up to 12 numbers, 0–99)',
  targetLabel: 'Target x',
  search: 'Search',
  caseButtons: /** @type {Record<CaseKind, string>} */ ({
    best: 'Best case',
    worst: 'Worst case',
    random: 'Random element',
  }),
  clearRuns: 'Clear runs',
  arrayError: 'Type 1 to 12 whole numbers from 0 to 99, separated by commas or spaces.',
  targetError: 'The target must be a whole number from 0 to 99.',
  arrayAria: 'Array being searched',
  pointer: 'i',
  /** @param {number} i @param {string} value @param {string} state */
  cellLabel: (i, value, state) => `A[${i}] = ${value}${state ? `, ${state}` : ''}`,
  states: { compare: 'being compared', visited: 'not equal', sorted: 'found' },
  markers: { compare: '?', visited: '✗', sorted: '✓' },
  legend: { compare: 'Comparing now', visited: 'Checked, not equal', sorted: 'Found' },
  profileTitle: 'Comparisons for every possible outcome',
  /** @param {number} n */
  profileLabel: (n) =>
    `Bar chart: a target first found at index i costs i + 1 comparisons, from 1 at index 0 to ${n} at index ${n - 1}; an absent target costs ${n}. Average over found positions: ${num((n + 1) / 2)}.`,
  absent: 'none',
  axisIndex: 'index of x',
  /** @param {number} avg */
  averageLine: (avg) => `average ${num(avg)}`,
  thisRun: 'this run’s outcome',
  stats: {
    comparisons: 'Comparisons (this run)',
    best: 'Best case',
    worst: 'Worst case',
    average: 'Average, x in the array',
  },
  runsTitle: 'Your runs',
  runsEmpty: 'none yet',
  runsHot: 'latest run',
  /** @param {CaseKind | 'typed'} kind @param {number} x @param {number} c */
  runChip: (kind, x, c) => `${kind === 'typed' ? 'x' : kind} ${x}: ${c}`,
  /** @param {number} count @param {number} avg */
  randomAverage: (count, avg) =>
    count === 0
      ? 'No random runs yet.'
      : `Average of your ${count} random run${count === 1 ? '' : 's'}: ${num(avg)}`,
  num,
  practiceTitle: 'Check yourself',
  /** @param {LinearFrame} f */
  describe(f) {
    const n = f.values.length;
    switch (f.kind) {
      case 'start':
        return `Search for x = ${f.target} in ${n} elements, from left to right.`;
      case 'compare':
        return `Compare A[${f.i}] = ${f.values[f.i]} with ${f.target}: ${f.match ? 'equal' : 'not equal'}. Comparison ${f.comparisons}.`;
      case 'found':
        return `Found ${f.target} at index ${f.i}: return ${f.i}.`;
      case 'missing':
        return `${f.target} is not in the array: all ${n} elements were compared. Return −1.`;
      case 'done':
        return `This run cost ${f.comparisons} comparison${f.comparisons === 1 ? '' : 's'}. On ${n} elements the best case is 1, the worst ${n}, the average (n + 1)/2 = ${num((n + 1) / 2)}.`;
    }
  },
  takeaways: [
    'The cost depends on the input, not only on its size: linear search on n elements takes anywhere from 1 to n comparisons.',
    'Best case: the target is the first element, 1 comparison, Θ(1). It is rarely useful, because you cannot count on it.',
    'Worst case: the target is last or absent, n comparisons, Θ(n). It is a guarantee: no input of size n costs more, which is why it is the default.',
    'Average (expected) case needs a model of the inputs. If the target is equally likely to be at each position, the expected cost is (1 + 2 + … + n)/n = (n + 1)/2, still Θ(n).',
    'Try pressing Random element ten times: the average of your runs wanders around (n + 1)/2 and settles as the runs pile up.',
  ],
  complexityHead: ['Case', 'Cost', 'Why'],
  complexity: [
    ['Best', 'Θ(1)', 'x is A[0]: one comparison.'],
    ['Worst', 'Θ(n)', 'x is last or absent: n comparisons.'],
    ['Average, x present', 'Θ(n)', 'Equally likely positions: (n + 1)/2 comparisons on average.'],
    ['Memory', 'O(1)', 'Only the index i, whatever the case.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Linear search on n = 1,000 elements. The target is in the array, equally likely at each position. How many comparisons does it take on average?',
      answer: 500.5,
      unit: 'comparisons',
      hints: [
        'Position i costs i + 1 comparisons; each position has probability 1/n.',
        'The average of 1, 2, …, n is (n + 1)/2.',
      ],
      solution: '(1 + 2 + … + 1000)/1000 = (1000 × 1001 / 2)/1000 = 1001/2 = 500.5 comparisons.',
    },
    {
      type: 'multi',
      prompt:
        'Linear search on 8 distinct elements. Which targets cost the worst case of 8 comparisons?',
      options: [
        'The element at index 0',
        'The element at index 4',
        'The element at index 7',
        'A value that is not in the array',
      ],
      answers: [2, 3],
      hints: ['Use the bar chart: which bars reach the top?'],
      solution:
        'Index 7 costs 7 + 1 = 8 comparisons, and an absent value is compared with all 8 elements. Index 0 costs 1 and index 4 costs 5.',
    },
    {
      type: 'number',
      prompt:
        'Linear search on n = 9 elements. Half the time the target is absent; otherwise it is equally likely at each position. What is the expected number of comparisons?',
      answer: 7,
      unit: 'comparisons',
      hints: [
        'Absent costs n = 9. Present costs (n + 1)/2 = 5 on average.',
        'Weight each case by its probability, 1/2.',
      ],
      solution: 'E = ½ × 9 + ½ × 5 = 4.5 + 2.5 = 7 comparisons.',
    },
    {
      type: 'choice',
      prompt: 'Why is the worst case the usual way to state an algorithm’s running time?',
      options: [
        'It bounds the cost of every input of that size, so it is a guarantee',
        'It is the input that happens most often',
        'It is always equal to the average case',
      ],
      answer: 0,
      hints: ['Think of a deadline: which number can you promise to a user?'],
      solution:
        'No input of size n costs more than the worst case, so it is a promise that holds whatever the input. It need not be common, and it can differ a lot from the average (quicksort: n² against n log n).',
    },
  ],
  nextTeaser:
    'Next up: space complexity, which counts memory the way we have been counting steps, call stack included.',
};
