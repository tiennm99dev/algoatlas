/** @typedef {import('$lib/algo-engine/longest-increasing-subsequence.js').LisFrame} LisFrame */
/** @typedef {import('$lib/algo-engine/longest-increasing-subsequence.js').LisMethod} LisMethod */

/** @param {number} n */
const num = (n) => String(n).replace('-', '−');
/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'longest-increasing-subsequence',
  topic: 'dynamic-programming',
  level: 'Intermediate',
  title: 'Longest increasing subsequence',
  intro:
    'A subsequence keeps some of the values in their original order, not necessarily next to each other. The longest increasing subsequence (LIS) is the longest one whose values strictly rise. The classic DP lets L[i] be the longest that ends at a[i] and checks every earlier j, which costs O(n²); patience sorting deals the values onto piles and finds each pile by binary search, which costs O(n log n).',
  summary:
    'Find the longest increasing subsequence with the O(n²) DP, then with patience-sorting piles and binary search, and rebuild it at the end.',
  instruction:
    'Step the O(n²) DP and watch L[i] grow each time an earlier, smaller value extends a run. Then switch to patience sorting: each value goes on the leftmost pile whose top is at least as big, and the number of piles is the answer. Compare the comparison counts on the same input.',
  methodLabel: 'Method',
  methods: { dp: 'O(n²) DP', patience: 'Patience sorting' },
  valuesLabel: 'Sequence',
  exampleButton: 'Load the example',
  /** @param {number} max @param {number} abs */
  valueErrors: (max, abs) => ({
    format: 'Type whole numbers separated by commas or spaces, for example 3, 1, 4, 1, 5.',
    count: `Type from 1 to ${max} numbers.`,
    range: `Each number must be from −${abs} to ${abs}.`,
  }),
  sequenceTitle: 'Sequence',
  /** @param {number[]} v */
  sequenceAria: (v) => `Sequence ${v.map(num).join(', ')}.`,
  /** @param {number} i @param {number} v @param {string} state */
  valueLabel: (i, v, state) => `a[${i}] = ${num(v)}${state ? `, ${state}` : ''}`,
  states: {
    current: 'handled now',
    compare: 'compared now',
    lis: 'in the rebuilt subsequence',
    extend: 'extends the run',
  },
  tableTitle: 'L and prev (p)',
  tableAria:
    'For each index: the longest increasing subsequence ending there and its previous index.',
  rowHeaders: ['L', 'p'],
  noPrev: '–',
  /** @param {number} i @param {number|null} L @param {number} prev @param {string} state */
  tableCell: (i, L, prev, state) =>
    `Index ${i}: ${L === null ? 'not reached' : `L = ${L}, prev = ${prev < 0 ? 'none' : prev}`}${state ? `, ${state}` : ''}`,
  pilesTitle: 'Piles',
  pilesEmpty: 'No piles yet.',
  /** @param {number} k */
  pileName: (k) => `Pile ${k}`,
  /** @param {number} k @param {number[]} v @param {string} state */
  pileAria: (k, v, state) =>
    `Pile ${k}, bottom to top: ${v.map(num).join(', ')}${state ? `, ${state}` : ''}.`,
  pileStates: { probe: 'top compared now', placed: 'gets the value now' },
  topsTitle: 'Pile tops (binary search)',
  topsAria: 'Top card of each pile, left to right; they are always increasing.',
  topsEmpty: 'No pile tops yet.',
  pointers: { i: 'i', j: 'j', lo: 'lo', hi: 'hi', mid: 'mid' },
  legend: {
    current: 'Handled now',
    compare: 'Compared now',
    extend: 'Extends the run',
    lis: 'In the rebuilt LIS',
  },
  markers: { current: '▶', compare: '?', extend: '+', lis: '★' },
  stats: {
    comparisons: 'Comparisons',
    length: 'LIS length',
  },
  lisTitle: 'Rebuilt subsequence',
  lisEmpty: 'Rebuilt at the end of the run.',
  /** @param {LisFrame} f */
  describe(f) {
    const a = f.values;
    const v = (/** @type {number} */ k) => num(a[k]);
    switch (f.kind) {
      case 'start':
        return f.method === 'dp'
          ? `Find the LIS of ${plural(a.length, 'value', 'values')}. L[i] will be the length of the longest increasing subsequence that ends at a[i].`
          : `Deal ${plural(a.length, 'value', 'values')} onto piles, left to right. A value goes on the leftmost pile whose top is at least as big, so each pile falls from bottom to top and the tops rise from left to right.`;
      case 'begin':
        return `Index ${f.i}, value ${v(f.i)}: on its own it is a run of length 1, so L[${f.i}] = 1. Now check every earlier value.`;
      case 'compare': {
        const why =
          a[f.j] >= a[f.i]
            ? `${v(f.j)} is not smaller than ${v(f.i)}, so it cannot come before it`
            : `${v(f.j)} < ${v(f.i)}, but L[${f.j}] + 1 = ${(f.L[f.j] ?? 0) + 1} does not beat L[${f.i}] = ${f.L[f.i]}`;
        return `Compare a[${f.j}] = ${v(f.j)} with a[${f.i}] = ${v(f.i)}: ${why}.`;
      }
      case 'extend':
        return `${v(f.j)} < ${v(f.i)}, so ${v(f.i)} can follow the run ending at index ${f.j}: L[${f.i}] = L[${f.j}] + 1 = ${f.L[f.i]}, prev[${f.i}] = ${f.j}.`;
      case 'best':
        return `Every L[i] is known. The largest is L[${f.i}] = ${f.L[f.i]}, so a longest increasing subsequence ends at a[${f.i}] = ${v(f.i)}.`;
      case 'take':
        return f.piles.length
          ? `Take a[${f.i}] = ${v(f.i)}. Binary search the ${plural(f.piles.length, 'pile top', 'pile tops')} for the leftmost top ≥ ${v(f.i)}.`
          : `Take a[${f.i}] = ${v(f.i)}. There are no piles yet.`;
      case 'probe': {
        const top = a[/** @type {number} */ (f.piles[f.mid].at(-1))];
        return top >= a[f.i]
          ? `Search piles ${f.lo} to ${f.hi - 1}: the top of pile ${f.mid} is ${num(top)} ≥ ${v(f.i)}, so the answer is pile ${f.mid} or one to its left.`
          : `Search piles ${f.lo} to ${f.hi - 1}: the top of pile ${f.mid} is ${num(top)} < ${v(f.i)}, so look to the right of it.`;
      }
      case 'newpile':
        return f.pile === 0
          ? `Start pile 0 with ${v(f.i)}.`
          : `Every top is smaller than ${v(f.i)}: start pile ${f.pile} on the right. It points back to ${v(f.prev[f.i])}, the top of pile ${f.pile - 1}, so a run of length ${f.pile + 1} now ends at ${v(f.i)}.`;
      case 'place':
        return f.pile === 0
          ? `Put ${v(f.i)} on pile 0: it is the new smallest top.`
          : `Put ${v(f.i)} on pile ${f.pile}, covering a bigger top. It points back to ${v(f.prev[f.i])}, the top of pile ${f.pile - 1}.`;
      case 'trace':
        return f.method === 'dp'
          ? `Add a[${f.i}] = ${v(f.i)} to the front of the subsequence, then follow prev[${f.i}]${f.prev[f.i] < 0 ? ': none, so the run starts here' : ` to index ${f.prev[f.i]}`}.`
          : `Add ${v(f.i)} to the front of the subsequence, then follow its back pointer${f.prev[f.i] < 0 ? ': none, so the run starts here' : ` to ${v(f.prev[f.i])}`}.`;
      case 'done':
        return `The LIS has length ${f.length}: ${f.lis.map(v).join(', ')}. That took ${plural(f.comparisons, 'comparison', 'comparisons')}${f.method === 'patience' ? `, and the ${plural(f.piles.length, 'pile', 'piles')} match the length` : ''}.`;
    }
  },
  takeaways: [
    'L[i], the longest increasing subsequence ending at a[i], is 1 plus the largest L[j] over earlier j with a[j] < a[i]. Fixing the end point is what makes the subproblems relate.',
    'The answer is the largest L[i], not L[n − 1]: the best run may end anywhere. prev[i] lets you walk back and rebuild it.',
    'Checking every earlier j costs n(n − 1)/2 comparisons: O(n²).',
    'Patience sorting keeps the pile tops increasing, so a binary search finds each value’s pile in O(log n). The number of piles equals the LIS length, and back pointers to the pile on the left rebuild one LIS.',
    'Load the example and compare the two methods: 45 comparisons against 17. Then type a falling sequence such as 9, 7, 5, 3, 1 and watch everything land on one pile.',
  ],
  complexityHead: ['Method', 'Cost', 'Why'],
  complexity: [
    ['O(n²) DP, time', 'O(n²)', 'Each i compares with all i earlier values: n(n − 1)/2 in all.'],
    [
      'Patience sorting, time',
      'O(n log n)',
      'n values, each placed by a binary search over at most n pile tops.',
    ],
    [
      'Memory, both',
      'O(n)',
      'L and prev, or the piles and back pointers, hold one entry per value.',
    ],
    [
      'Rebuilding the LIS',
      'O(length)',
      'Follow prev or the back pointers from the last value of the run.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How long is the longest increasing subsequence of 3, 1, 4, 1, 5, 9, 2, 6?',
      answer: 4,
      hints: [
        'Type the sequence and step either method to the end.',
        'Try 1, 4, 5, 9 or 3, 4, 5, 6.',
      ],
      solution:
        'L = 1, 1, 2, 1, 3, 4, 2, 4. The largest is 4, for example 3, 4, 5, 9. No run of 5 exists: patience sorting ends with 4 piles.',
    },
    {
      type: 'number',
      prompt: 'How many piles does patience sorting build for 5, 2, 8, 6, 3, 6, 9, 7?',
      answer: 4,
      unit: 'piles',
      hints: ['Switch to patience sorting, type the sequence and step to the end.'],
      solution:
        'The piles end as [5, 2], [8, 6, 3], [6], [9, 7]: 4 piles, so the LIS has length 4, for example 2, 3, 6, 7.',
    },
    {
      type: 'number',
      prompt: 'How many comparisons does the O(n²) DP make on 10 values?',
      answer: 45,
      unit: 'comparisons',
      hints: ['Index i is compared with the i values before it.'],
      solution: '0 + 1 + 2 + … + 9 = 10·9/2 = 45, whatever the values are.',
    },
    {
      type: 'choice',
      prompt:
        'Patience sorting puts a value on the leftmost pile whose top is ≥ the value. Why ≥ and not >?',
      options: [
        'It makes the binary search faster.',
        'Equal values then share a pile, so they never count as increasing: the subsequence stays strict.',
        'It makes no difference to the answer.',
        'So that every pile has the same height.',
      ],
      answer: 1,
      hints: ['Type 2, 2, 2 and count the piles.'],
      solution:
        'With ≥, an equal value covers the top it equals instead of starting a new pile to its right. Two equal values can never be on piles k and k + 1, so they never form part of the same increasing run. With > you would compute the longest non-decreasing subsequence.',
    },
    {
      type: 'multi',
      prompt: 'Which statements about the piles are always true during patience sorting?',
      options: [
        'The pile tops increase from left to right.',
        'Each pile falls from bottom to top.',
        'The top cards, read left to right, are an LIS.',
        'The number of piles is the length of the LIS so far.',
      ],
      answers: [0, 1, 3],
      hints: [
        'Load the example and look at the tops after 3 is dealt: are 3, 21, 33, 41, 60, 80 a subsequence in the original order?',
      ],
      solution:
        'A value only covers a top at least as big, so piles fall and tops rise, and a new pile appears exactly when a value beats every top. But the tops need not be in sequence order: at the end of the example the top of pile 0 is 3, the last value. That is why back pointers rebuild the LIS.',
    },
  ],
  nextTeaser:
    'Next up: longest common subsequence and edit distance, which compare two sequences with a 2D table over their prefixes.',
};
