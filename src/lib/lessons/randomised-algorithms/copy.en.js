/** @typedef {import('$lib/algo-engine/randomised-algorithms.js').QuickFrame} QuickFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** One decimal place. @param {number} x */
const oneDp = (x) => (Math.round(x * 10) / 10).toFixed(1);

export const en = {
  slug: 'randomised-algorithms',
  topic: 'algebraic-randomised',
  level: 'Intermediate',
  title: 'Randomised algorithms',
  intro:
    'A randomised algorithm flips coins as it runs. A Las Vegas algorithm, such as randomised quicksort, always returns the right answer but its running time is random; a Monte Carlo algorithm, such as the Miller–Rabin primality test, always runs fast but may be wrong with a small probability. Picking the pivot at random means no fixed input is bad: every input sorts in expected O(n log n) time.',
  summary:
    'Randomised quicksort as a Las Vegas algorithm: run it many times, plot the comparisons, and compare the average with the expected 2(n + 1)Hₙ − 4n.',
  instruction:
    'Type a list or pick one, choose the pivot rule and step through one run. Then press “Run 100 times” and watch the histogram of comparisons: with random pivots it clusters near the expected value whatever the input order. Switch to “Last element” on the sorted list to see every run hit the worst case.',
  fields: { values: 'Values', rule: 'Pivot' },
  rules: { random: 'Random', last: 'Last element' },
  presetLabel: 'Example',
  presets: {
    shuffled: 'Shuffled (16)',
    sorted: 'Sorted (16)',
    reversed: 'Reversed (16)',
    small: 'Small (6)',
  },
  /** @param {number} minN @param {number} maxN @param {number} max */
  valuesError: (minN, maxN, max) =>
    `Type ${minN} to ${maxN} whole numbers from 0 to ${max}, separated by commas or spaces.`,
  reroll: 'New random run',
  runMany: (/** @type {number} */ k) => `Run ${k} times`,
  clear: 'Clear runs',
  /** @param {number} max */
  runsFull: (max) =>
    `The histogram holds at most ${max.toLocaleString('en-US')} runs. Clear it to start again.`,
  barsTitle: 'One run, step by step',
  /** @param {number[]} values */
  barsAria: (values) => `Bars for the values ${values.join(', ')}`,
  barStates: {
    pivot: 'P',
    compare: '?',
    left: '≤',
    right: '>',
    placed: '✓',
    '': '',
  },
  legend: {
    pivot: 'P Pivot x',
    compare: '? Being compared',
    left: '≤ At most x',
    right: '> Greater than x',
    placed: '✓ In its final place',
  },
  stats: {
    comparisons: 'Comparisons this run',
    swaps: 'Swaps',
    depth: 'Deepest call',
    expected: 'Expected, distinct keys',
    worst: 'Worst case n(n − 1)/2',
  },
  histTitle: 'Comparisons over many runs',
  /** @param {number} runs */
  histAria: (runs) => `Histogram of comparison counts over ${runs} runs`,
  /** @param {number} from @param {number} to @param {number} count */
  binLabel: (from, to, count) =>
    `${from === to ? from : `${from} to ${to}`} comparisons: ${plural(count, 'run', 'runs')}`,
  histEmpty: 'Press “Run 100 times” to start sampling.',
  histMean: '▲ mean of the runs',
  histExpected: '◆ expected value',
  runStats: {
    runs: 'Runs',
    mean: 'Mean',
    min: 'Fewest',
    max: 'Most',
    correct: 'Sorted correctly',
  },
  /** @param {number} x */
  oneDp,
  /** @param {number} ok @param {number} runs */
  correctText: (ok, runs) => `${ok} of ${runs}`,
  /** @param {QuickFrame} f @param {number} pivot */
  describe(f, pivot) {
    switch (f.kind) {
      case 'start':
        return `Sort ${f.items.length} values with ${f.rule === 'random' ? 'a uniformly random pivot' : 'the last element as the pivot'} in every call.`;
      case 'call':
        return `Partition positions ${f.lo} to ${f.hi} (call depth ${f.depth}).`;
      case 'pick':
        return f.rule === 'random'
          ? `The coin picks position ${f.picked}: swap it to the end, so the pivot is x = ${pivot}.`
          : `The pivot is the last element, x = ${pivot}.`;
      case 'compare': {
        const v = f.items[f.j].value;
        return f.goesLeft
          ? `Compare ${v} with x = ${pivot}: ${v} ≤ ${pivot}, so it joins the left part.`
          : `Compare ${v} with x = ${pivot}: ${v} > ${pivot}, so it stays in the right part.`;
      }
      case 'swap':
        return `Grow the left part to position ${f.i} and swap the element into it.`;
      case 'place':
        return `Swap the pivot ${pivot} into position ${f.i + 1}, its final place; then sort the two sides.`;
      case 'done':
        return `Sorted with ${plural(f.comparisons, 'comparison', 'comparisons')} and a deepest call of ${f.maxDepth}. ${f.rule === 'random' ? 'Another run may take a different number, but the output is always sorted.' : 'Every run on this input takes exactly the same steps.'}`;
    }
  },
  takeaways: [
    'Las Vegas algorithms are always correct and have random running time; Monte Carlo algorithms have bounded running time and a small chance of a wrong answer. Repeating a Monte Carlo test k times can shrink that chance to (1/2)ᵏ or lower.',
    'With a fixed pivot rule, some input is always bad: the last-element rule makes n(n − 1)/2 comparisons on sorted input. A random pivot moves the randomness from the input into the algorithm, so no input is bad on purpose.',
    'Expected analysis: elements zᵢ < zⱼ are compared only if one of them is the first pivot drawn from zᵢ … zⱼ, which happens with probability 2/(j − i + 1). Summing over pairs gives 2(n + 1)Hₙ − 4n ≈ 1.39 n log₂ n comparisons.',
    'The worst case is still n(n − 1)/2, but it needs a run of very unlucky coin flips, and the histogram shows how rarely that happens.',
    'Try “Sorted (16)” with “Last element”, run 100 times, then switch to “Random”: the spike at 120 becomes a hump near 51.',
  ],
  complexityHead: ['Case', 'Cost', 'Why'],
  complexity: [
    [
      'Expected, any input',
      'O(n log n)',
      'Linearity of expectation over pairs: the sum of 2/(j − i + 1) is 2(n + 1)Hₙ − 4n.',
    ],
    [
      'Worst case',
      'O(n²)',
      'Every pivot drawn is the smallest or largest left; the chance falls fast as n grows.',
    ],
    [
      'Fixed last pivot, sorted input',
      'Θ(n²)',
      'Each call removes only the pivot, so lengths n, n − 1, … 2 cost n(n − 1)/2.',
    ],
    ['Memory', 'O(log n) expected', 'The recursion depth, which is also random.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt: 'Randomised quicksort is which kind of randomised algorithm?',
      options: [
        'Las Vegas: always correct, random running time',
        'Monte Carlo: fixed running time, may be wrong',
        'Neither, because it is deterministic',
        'Both at once',
      ],
      answer: 0,
      hints: ['Does any run ever return an unsorted list?'],
      solution:
        'Every run returns the sorted list; only the number of comparisons changes. That makes it Las Vegas.',
    },
    {
      type: 'number',
      prompt:
        'Load “Sorted (16)” with the “Last element” pivot and step to the end. How many comparisons does it make?',
      answer: 120,
      unit: 'comparisons',
      hints: ['Each call removes only the pivot: 15 + 14 + … + 1.'],
      solution: 'The partitions compare 15, 14, …, 1 times, which is 16 · 15 / 2 = 120.',
    },
    {
      type: 'number',
      prompt:
        'What is the expected number of comparisons for n = 16 distinct keys, 2(n + 1)Hₙ − 4n, to one decimal place?',
      answer: 50.9,
      tolerance: 0.05,
      hints: ['H₁₆ ≈ 3.3807. The “Expected” card shows the value too.'],
      solution: '2 · 17 · 3.3807 − 64 ≈ 114.94 − 64 = 50.9.',
    },
    {
      type: 'multi',
      prompt: 'Which of these are Monte Carlo algorithms?',
      options: [
        'The Miller–Rabin primality test',
        'Randomised quicksort',
        'Karger’s random-contraction minimum cut',
        'Randomised selection (quickselect)',
      ],
      answers: [0, 2],
      hints: ['Ask of each one: can it ever return a wrong answer?'],
      solution:
        'Miller–Rabin may call a composite prime, and one run of Karger’s algorithm may miss the minimum cut. Quicksort and quickselect always return the right answer, so they are Las Vegas.',
    },
    {
      type: 'number',
      prompt:
        'For 3 distinct keys, what is the probability that the smallest and the largest are ever compared? Give it as a decimal.',
      answer: 2 / 3,
      tolerance: 0.01,
      hints: ['They are compared only if one of them is the first pivot chosen among all three.'],
      solution:
        'The pair spans 3 keys, so the probability is 2 / (3 − 1 + 1) = 2/3: if the middle key is the first pivot, the two end up on different sides and are never compared.',
    },
  ],
  nextTeaser:
    'Next up: Universal and perfect hashing, where a randomly drawn hash function keeps collisions rare for every set of keys.',
};
