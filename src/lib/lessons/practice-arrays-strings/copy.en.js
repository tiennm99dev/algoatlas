/** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').PracticeFrame} PracticeFrame */
/** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').ProblemId} ProblemId */
/** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').Technique} Technique */
/** @typedef {import('$lib/algo-engine/practice-arrays-strings.js').Fit} Fit */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

/** A number with a true minus sign. @param {number} v */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

/** @param {PracticeFrame} f @param {number} i */
const P = (f, i) => num(/** @type {number} */ (f.aux?.[i]));

/** @param {PracticeFrame} f @param {string} name */
const at = (f, name) => f.pointers.find((p) => p.name === name)?.index ?? -1;

/** @type {Record<Technique, string>} */
const techniqueNames = {
  pointers: 'Two pointers',
  window: 'Sliding window',
  prefix: 'Prefix sums',
  brute: 'Brute force',
};

/** Why each technique does or does not fit each problem. @type {Record<ProblemId, Record<Technique, string>>} */
const why = {
  'pair-sum': {
    pointers:
      'The array is sorted, so a sum that is too small can only grow by moving lo right, and one that is too big by moving hi left. Each check rules out one value: at most n − 1 checks.',
    window:
      'The two values of a pair need not be next to each other, so there is no run of consecutive values to slide.',
    prefix: 'Prefix sums add up runs of consecutive values, but a pair is two single values.',
    brute: 'Trying every pair i < j always finds the answer, but needs up to n(n − 1)/2 checks.',
  },
  palindrome: {
    pointers:
      'A palindrome mirrors around its middle, so compare the two ends and walk inward: n/2 comparisons and no extra memory.',
    window: 'A palindrome compares opposite ends, not a run of neighbouring characters.',
    prefix: 'There is nothing to add up: the check compares characters.',
    brute:
      'Copying the string backwards and comparing works, but it costs n copies, up to n comparisons and O(n) extra memory.',
  },
  'max-window': {
    pointers:
      'Converging pointers throw away one end at a time, but here the k values must stay together and move as a block.',
    window:
      'All windows have length k, and sliding by one adds one value and removes one: O(1) per window.',
    prefix:
      'Each window sum is P[l + k] − P[l], so this is O(n) too, but it needs an extra array of n + 1 entries.',
    brute: 'Adding up every window from scratch works, but costs k additions per window: O(n·k).',
  },
  'shortest-window': {
    pointers:
      'Starting at both ends and moving inward cannot find a short run in the middle; the run needs both ends moving right.',
    window:
      'With values ≥ 0 a longer run never has a smaller sum, so grow on the right until the sum reaches S, then shrink from the left. Both ends move right only: O(n).',
    prefix:
      'P gives any run’s sum in one subtraction, but you still try O(n²) runs, so it is no faster than brute force, and it builds P first.',
    brute: 'For each start, add values until the sum reaches S: correct, but O(n²).',
  },
  'range-sums': {
    pointers:
      'The queries jump around the array; there is no pair of ends to move towards each other.',
    window:
      'A window slides forward step by step, but queries come in any order and with any length.',
    prefix:
      'Build P once in O(n); after that every query is one subtraction, P[r + 1] − P[l]: O(n + q).',
    brute: 'Adding each range from scratch works, but a query can cost n additions: O(q·n).',
  },
};

export const en = {
  slug: 'practice-arrays-strings',
  topic: 'arrays-strings',
  level: 'Intermediate',
  title: 'Practice: array and string problems',
  intro:
    'Most array and string problems in this chapter fall to one of three tricks: two pointers moving towards each other, a window sliding over a run of consecutive values, or prefix sums that answer any range in one subtraction. The skill is to see which one the problem calls for. Here you pick the technique, run it on the problem’s input, and compare its cost with the others.',
  summary:
    'Pick two pointers, a sliding window, prefix sums or brute force for five array and string problems, watch your choice run on the input, and compare the steps each technique needs.',
  instruction:
    'Pick a problem, read it, then pick a technique. If it fits, step through the run and watch the Steps card; if it does not, read why. The table on the right shows every technique’s steps on the same input. Edit the input to see the costs change.',
  problemLabel: 'Problem',
  problems: /** @type {Record<ProblemId, string>} */ ({
    'pair-sum': 'Pair with sum T',
    palindrome: 'Palindrome check',
    'max-window': 'Largest sum of k in a row',
    'shortest-window': 'Shortest run with sum ≥ S',
    'range-sums': 'Many range sums',
  }),
  statements: /** @type {Record<ProblemId, string>} */ ({
    'pair-sum': 'The array is sorted ascending. Find two positions i < j with a[i] + a[j] = T.',
    palindrome:
      'Does the string read the same forwards and backwards? Characters are compared exactly, so A and a differ.',
    'max-window': 'Find the largest sum of k consecutive values. Values may be negative.',
    'shortest-window':
      'Every value is ≥ 0. Find the length of the shortest run of consecutive values whose sum is at least S.',
    'range-sums': 'Answer every query (l, r) with the sum a[l] + … + a[r].',
  }),
  techniqueLegend: 'Technique',
  techniques: /** @type {Record<Technique, string>} */ ({
    pointers: 'Pointers',
    window: 'Window',
    prefix: 'Prefix',
    brute: 'Brute',
  }),
  techniqueNames,
  fits: /** @type {Record<Fit, string>} */ ({
    best: 'Best fit',
    works: 'Works, but not the best',
    no: 'Does not fit',
  }),
  fitMarks: /** @type {Record<Fit, string>} */ ({ best: '★', works: '✓', no: '✗' }),
  why,
  valuesLabels: /** @type {Record<ProblemId, string>} */ ({
    'pair-sum': 'Sorted values',
    palindrome: 'Text',
    'max-window': 'Values',
    'shortest-window': 'Values (≥ 0)',
    'range-sums': 'Values',
  }),
  targetLabels: /** @type {Partial<Record<ProblemId, string>>} */ ({
    'pair-sum': 'Target T',
    'max-window': 'Window k',
    'shortest-window': 'Target S',
  }),
  queriesLabel: 'Queries (l r, …)',
  sampleButton: 'Sample input',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces.',
    range: 'Every value must be from −99 to 99.',
    count: 'Type from 1 to 12 values.',
    unsorted: 'This problem gives a sorted array: type the values in ascending order.',
    negative: 'This problem needs every value to be 0 or more.',
    short: 'A pair needs at least two values.',
  },
  textErrors: {
    empty: 'Type at least one character.',
    long: 'Type at most 16 characters.',
  },
  queryErrors: {
    format: 'Write each query as two indices, l r, and separate queries with commas.',
    range: 'Each query needs 0 ≤ l ≤ r < n, the number of values.',
    count: 'Type from 1 to 6 queries.',
  },
  /** @param {ProblemId} problem @param {number} n */
  targetError: (problem, n) =>
    problem === 'pair-sum'
      ? 'T must be a whole number from −198 to 198.'
      : problem === 'max-window'
        ? `k must be a whole number from 1 to ${n}, the number of values.`
        : 'S must be a whole number from 1 to 1188.',
  arrayTitle: 'Input',
  arrayAria: 'The input, index 0 first',
  auxTitles: {
    prefix: 'Prefix sums P, P[i] = a[0] + … + a[i − 1]',
    reversed: 'Reversed copy r',
  },
  auxAria: {
    prefix: 'Prefix sums P, index 0 first',
    reversed: 'Reversed copy r, index 0 first',
  },
  spare: '·',
  /** @param {number} sum */
  rangeLabel: (sum) => `sum ${num(sum)}`,
  bestLabel: 'best',
  markers: { read: '◦', written: '+', answer: '✓', differ: '≠' },
  /** @param {number} i @param {number | string | null} v @param {string} state */
  cellLabel: (i, v, state) =>
    `Index ${i}: ${v === null ? 'not filled' : v}${state ? `, ${state}` : ''}`,
  states: {
    read: 'read now',
    written: 'just written',
    inside: 'in the range',
    answer: 'part of the answer',
    differ: 'does not match',
  },
  legend: {
    inside: 'In the range',
    read: '◦ Read now',
    written: '+ Just written',
    answer: '✓ Answer',
    differ: '≠ Mismatch',
  },
  stats: {
    steps: 'Steps',
    answer: 'Answer',
  },
  stepsNote:
    'Steps: one per pair sum or character comparison checked, element added or subtracted, P entry built or subtraction of two entries, and character copied.',
  compareTitle: 'Steps on this input',
  compareHead: ['Technique', 'Fit', 'Steps'],
  notApplicable: 'does not fit',
  noCode: 'No pseudocode: this technique does not fit the problem.',
  pending: '—',
  none: 'none',
  yes: 'yes',
  no: 'no',
  /** @param {PracticeFrame} f */
  answer(f) {
    switch (f.problem) {
      case 'pair-sum':
        if (f.verdict === null) return '—';
        return f.found ? `(${f.found[0]}, ${f.found[1]})` : 'none';
      case 'palindrome':
        return f.verdict === null ? '—' : f.verdict ? 'yes' : 'no';
      case 'max-window':
        return f.best === null ? '—' : num(f.best);
      case 'shortest-window':
        if (f.best !== null) return String(f.best);
        return f.kind === 'done' && f.fit !== 'no' ? 'none' : '—';
      case 'range-sums':
        return f.answers.some((v) => v !== null)
          ? f.answers.map((v) => (v === null ? '?' : num(v))).join(', ')
          : '—';
    }
  },
  practiceTitle: 'Practice',
  /** @param {PracticeFrame} f */
  describe(f) {
    const a = f.items;
    const T = num(f.target);
    if (f.fit === 'no')
      return `${techniqueNames[f.technique]} does not fit this problem. ${why[f.problem][f.technique]} Pick another technique.`;
    const v = /** @type {number} */ (f.value);
    const [from, to] = f.range ?? [-1, -1];
    const better = f.improved ? ', a new best' : '';
    switch (f.kind) {
      case 'start':
        switch (`${f.problem}/${f.technique}`) {
          case 'pair-sum/pointers':
            return `Find a pair with sum ${T}. Put lo on the first value and hi on the last.`;
          case 'pair-sum/brute':
            return `Find a pair with sum ${T} by trying every pair i < j in turn.`;
          case 'palindrome/pointers':
            return `Is “${a.join('')}” a palindrome? Put lo on the first character and hi on the last.`;
          case 'palindrome/brute':
            return `Is “${a.join('')}” a palindrome? First copy it backwards into a new string r.`;
          case 'max-window/window':
            return `Largest sum of ${f.target} in a row: add up the first window, then slide it.`;
          case 'max-window/prefix':
            return `Largest sum of ${f.target} in a row: build P first; then each window is one subtraction.`;
          case 'max-window/brute':
            return `Largest sum of ${f.target} in a row: add up every window from scratch.`;
          case 'shortest-window/window':
            return `Shortest run with sum ≥ ${T}: grow the window on the right, and shrink it from the left while the sum is big enough.`;
          case 'shortest-window/prefix':
            return `Shortest run with sum ≥ ${T}: build P, then for each start l try longer and longer runs.`;
          case 'shortest-window/brute':
            return `Shortest run with sum ≥ ${T}: for each start l, add values until the sum reaches ${T}.`;
          case 'range-sums/prefix':
            return `${plural(f.queries.length, 'query', 'queries')}: build P once, then answer each with one subtraction.`;
          default:
            return `${plural(f.queries.length, 'query', 'queries')}: add up each range from scratch.`;
        }
      case 'check': {
        const [i, j] = f.reads;
        const sum = `a[${i}] + a[${j}] = ${num(Number(a[i]))} + ${num(Number(a[j]))} = ${num(v)}`;
        if (f.cmp === 0) return `${sum} = T. Found the pair.`;
        if (f.technique === 'brute') return `${sum} ≠ ${T}: try the next pair.`;
        return f.cmp === -1
          ? `${sum} < ${T}: too small. a[hi] is the largest partner left for a[lo], so move lo right.`
          : `${sum} > ${T}: too big. a[lo] is the smallest partner left for a[hi], so move hi left.`;
      }
      case 'compare': {
        const [i, j] = f.reads.length === 2 ? f.reads : [f.reads[0], f.reads[0]];
        const left = `s[${i}] = “${a[i]}”`;
        const right = f.technique === 'brute' ? `r[${i}] = “${f.aux?.[i]}”` : `s[${j}] = “${a[j]}”`;
        return f.cmp === 0
          ? `${left} and ${right} match${f.technique === 'pointers' ? ': move both pointers inward.' : '.'}`
          : `${left} and ${right} differ, so the string is not a palindrome.`;
      }
      case 'copy': {
        const i = f.auxWrite;
        return `r[${i}] = s[${a.length - 1 - i}] = “${f.aux?.[i]}”.`;
      }
      case 'fill':
        return `Add a[${f.reads[0]}] = ${num(Number(a[f.reads[0]]))}: the first window’s sum is ${num(v)} so far.`;
      case 'first':
        return `The first window a[0..${f.target - 1}] sums to ${num(v)}, the best so far.`;
      case 'slide': {
        const [r, out] = f.reads;
        return `Slide right: add a[${r}] = ${num(Number(a[r]))} and take out a[${out}] = ${num(Number(a[out]))}, so the sum is ${num(v)}${better}.`;
      }
      case 'expand':
        return `Grow on the right: add a[${f.reads[0]}] = ${num(Number(a[f.reads[0]]))}, sum ${num(v)}${f.cmp === 1 ? ` ≥ ${T}` : ` < ${T}, keep growing`}.`;
      case 'record':
        return `Sum ${num(v)} ≥ ${T} with length ${to - from}${f.improved ? ': the shortest so far' : `, not shorter than ${f.best}`}. Now shrink from the left.`;
      case 'shrink':
        return `Take out a[${f.reads[0]}] = ${num(Number(a[f.reads[0]]))} and move l to ${at(f, 'l')}: sum ${num(v)}.`;
      case 'build': {
        const i = f.auxWrite - 1;
        return `P[${i + 1}] = P[${i}] + a[${i}] = ${P(f, i)} + ${num(Number(a[i]))} = ${P(f, i + 1)}.`;
      }
      case 'lookup': {
        const sub = `P[${to}] − P[${from}] = ${P(f, to)} − ${P(f, from)} = ${num(v)}`;
        if (f.problem === 'range-sums')
          return `Query ${f.query + 1}, a[${from}..${to - 1}]: ${sub}.`;
        if (f.problem === 'max-window') return `Window a[${from}..${to - 1}]: ${sub}${better}.`;
        return f.cmp === 1
          ? `Run a[${from}..${to - 1}]: ${sub} ≥ ${T}, length ${to - from}${f.improved ? ', the shortest so far' : ''}. Move on to the next start.`
          : `Run a[${from}..${to - 1}]: ${sub} < ${T}, try a longer run.`;
      }
      case 'sum':
        return f.problem === 'range-sums'
          ? `Query ${f.query + 1}, a[${from}..${to - 1}]: ${plural(to - from, 'addition')} from scratch give ${num(v)}.`
          : `Window a[${from}..${to - 1}] from scratch: ${plural(to - from, 'addition')} give ${num(v)}${better}.`;
      case 'add': {
        const r = to - 1;
        return `Start ${from}: add a[${r}] = ${num(Number(a[r]))}, sum ${num(v)}${f.cmp === 1 ? ` ≥ ${T}, length ${to - from}${f.improved ? ', the shortest so far' : ''}. Move on to the next start.` : ` < ${T}.`}`;
      }
      case 'done': {
        const steps = plural(f.steps, 'step');
        switch (f.problem) {
          case 'pair-sum':
            return f.found
              ? `Done: a[${f.found[0]}] + a[${f.found[1]}] = ${T}, after ${steps}.`
              : `Done: no pair sums to ${T}. ${steps}.`;
          case 'palindrome':
            return f.verdict
              ? `Done: “${a.join('')}” is a palindrome, after ${steps}.`
              : `Done: “${a.join('')}” is not a palindrome, after ${steps}.`;
          case 'max-window':
            return `Done: the best window is a[${f.bestFrom}..${f.bestTo - 1}] with sum ${num(/** @type {number} */ (f.best))}, after ${steps}.`;
          case 'shortest-window':
            return f.best === null
              ? `Done: no run reaches ${T}, not even the whole array. ${steps}.`
              : `Done: the shortest run is a[${f.bestFrom}..${f.bestTo - 1}], length ${f.best}, after ${steps}.`;
          case 'range-sums':
            return `Done: the answers are ${f.answers.map((x) => num(/** @type {number} */ (x))).join(', ')}, after ${steps}.`;
        }
      }
    }
  },
  takeaways: [
    'Ask what the answer is made of: two single positions (two pointers), one run of consecutive values (sliding window), or the sums of many ranges (prefix sums).',
    'Two pointers need a reason to throw away one end at every step: sorted order for a pair sum, mirror symmetry for a palindrome. For a pair sum that turns n(n − 1)/2 checks into at most n − 1.',
    'A sliding window needs a running total that updates in O(1). A variable window also needs a sum that never shrinks as the window grows, which values ≥ 0 guarantee.',
    'Prefix sums pay O(n) once and then answer any range in O(1). They shine with many queries, but they do not speed up a search that still tries O(n²) ranges.',
    'Try the shortest-run sample with all three techniques that work: 11 steps for the window, 17 for brute force and 23 for prefix sums. Then pick Pointers to read why it does not fit.',
  ],
  complexityHead: ['Problem and best technique', 'Cost', 'Why'],
  complexity: [
    [
      'Pair with sum T, sorted: two pointers',
      'O(n)',
      'Each check discards one end; trying every pair is O(n²).',
    ],
    [
      'Palindrome check: two pointers',
      'O(n)',
      'Compare the ends and walk inward with O(1) memory; a reversed copy needs O(n) memory.',
    ],
    [
      'Largest sum of k in a row: sliding window',
      'O(n)',
      'Two updates per slide; prefix sums are O(n) too but need n + 1 extra entries.',
    ],
    [
      'Shortest run with sum ≥ S: sliding window',
      'O(n)',
      'l and r only move right; trying every start is O(n²).',
    ],
    [
      'q range sums: prefix sums',
      'O(n + q)',
      'Build P once, then one subtraction per query; summing each range is O(q·n).',
    ],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Pair with sum T, sample input (1, 3, 4, 6, 8, 11, 15 and T = 14). How many pair sums does brute force check before it finds a pair?',
      answer: 10,
      unit: 'sums',
      hints: [
        'Pick Brute and step to the end, or watch the Steps card.',
        'It tries all 6 partners of a[0] first, then a[1] with a[2], a[3], a[4] and a[5].',
      ],
      solution:
        'a[0] = 1 fails with all 6 partners. Then 3 + 4, 3 + 6 and 3 + 8 fail and 3 + 11 = 14 is the 10th sum. Two pointers find the same pair after 3 sums: 1 + 15, 1 + 11 and 3 + 11.',
    },
    {
      type: 'number',
      prompt:
        'Two pointers on “racecar”: how many character comparisons does it make before it answers?',
      answer: 3,
      unit: 'comparisons',
      hints: ['Pick Palindrome check and Pointers. lo and hi stop when they meet in the middle.'],
      solution:
        'It compares s[0] with s[6], s[1] with s[5] and s[2] with s[4]; then lo = hi = 3 and the loop ends. The brute-force copy takes 7 copies and 7 comparisons, 14 steps.',
    },
    {
      type: 'number',
      prompt:
        'Largest sum of k = 3 in a row on the sample 4, −1, 2, 7, −3, 5, 1, −2. What is the largest sum?',
      answer: 9,
      hints: ['The window sums are 5, 8, 6, 9, 3 and 4.'],
      solution:
        'Sliding the window gives 5, then 5 + 7 − 4 = 8, 8 − 3 + 1 = 6, 6 + 5 − 2 = 9, 9 + 1 − 7 = 3 and 3 − 2 + 3 = 4. The best is 9, from 7, −3, 5.',
    },
    {
      type: 'number',
      prompt:
        'Shortest run with sum ≥ 7 on the sample 2, 3, 1, 2, 4, 3. How many steps do prefix sums take, building P included?',
      answer: 23,
      unit: 'steps',
      hints: [
        'Pick Prefix and step to the end.',
        'Building P costs 6 steps; then each start l tries runs until one reaches 7.',
      ],
      solution:
        '6 steps build P, then the starts try 4, 4, 3, 3, 2 and 1 runs: 17 subtractions, 23 in all. Brute force needs the same 17 additions without building P, and the sliding window needs only 11.',
    },
    {
      type: 'number',
      prompt:
        'Many range sums on the sample 3, −2, 5, 1, 4, −1, 2, 6. What is the answer to the query (2, 6)?',
      answer: 11,
      hints: ['Pick Prefix and step to the second query: P[7] − P[2].'],
      solution: 'P[7] = 12 and P[2] = 1, so the sum is 12 − 1 = 11, which is 5 + 1 + 4 − 1 + 2.',
    },
    {
      type: 'multi',
      prompt: 'Which techniques can solve “largest sum of k in a row”?',
      options: ['Two pointers', 'Sliding window', 'Prefix sums', 'Brute force'],
      answers: [1, 2, 3],
      hints: ['Try each technique on that problem and read its verdict.'],
      solution:
        'The sliding window is the best fit, prefix sums also work in O(n) with an extra array, and brute force works in O(n·k). Converging pointers do not keep k values together.',
    },
    {
      type: 'choice',
      prompt:
        'An app answers 100,000 range-sum queries on an array of 1,000,000 values that never changes. Which technique fits best?',
      options: ['Two pointers', 'Sliding window', 'Prefix sums', 'Brute force'],
      answer: 2,
      hints: ['Compare O(n + q) with O(q·n) for these sizes.'],
      solution:
        'Prefix sums cost about 1,000,000 steps to build and then one subtraction per query: about 1,100,000 steps. Summing each range could take up to 100,000 × 1,000,000 steps.',
    },
    {
      type: 'choice',
      prompt:
        'Why does the variable sliding window need values ≥ 0 for “shortest run with sum ≥ S”?',
      options: [
        'With a negative value, a longer run can have a smaller sum, so shrinking from the left may skip the answer',
        'Negative numbers cannot be added in O(1)',
        'The window must stay of fixed length k',
        'Prefix sums would be faster with negative values',
      ],
      answer: 0,
      hints: ['What does adding one more value do to the sum when values can be negative?'],
      solution:
        'With values ≥ 0, adding a value never lowers the sum and dropping one never raises it, so growing until the sum reaches S and then shrinking never skips a shorter answer. A negative value breaks that: dropping it raises the sum, and a longer run can have a smaller sum. Then a different method is needed, such as prefix sums with a monotonic deque.',
    },
  ],
  nextTeaser:
    'Next up: Bubble sort and insertion sort, the first sorting algorithms, where these array skills meet swaps and comparisons.',
};
