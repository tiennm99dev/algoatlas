/** @typedef {import('$lib/algo-engine/permutations-subsets.js').GenFrame} GenFrame */
/** @typedef {import('$lib/algo-engine/permutations-subsets.js').GenMode} GenMode */
/** @typedef {import('$lib/algo-engine/permutations-subsets.js').GenNode} GenNode */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** @param {string} s */
const shown = (s) => (s === '' ? '∅' : s);

export const en = {
  slug: 'permutations-subsets',
  topic: 'backtracking',
  level: 'Intermediate',
  title: 'Permutations, combinations and subsets',
  intro:
    'Permutations, combinations and subsets are the three classic things to generate, and one recursion handles them all: pick an item, recurse, unpick it. They differ only in which items a call may pick next. Permutations may use any item not used yet, while combinations and subsets only look forward from the last one picked, which is what stops {A, B} from appearing a second time as {B, A}.',
  summary:
    'Step through a generator as it picks and unpicks items to list every permutation, combination or subset, with and without duplicates.',
  instruction:
    'Choose what to generate and step through it: the tree shows each pick, and Results fills in as the recursion reaches an output. Type your own items, then try repeated ones such as A A B and switch Repeated items to compare the number of results.',
  modeLabel: 'Generate',
  modes: { perm: 'Permutations', comb: 'Combinations', subset: 'Subsets' },
  uniqueLabel: 'Repeated items',
  uniques: { on: 'Skip duplicates', off: 'List all' },
  itemsLabel: 'Items',
  kLabel: 'Size k',
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    abc: 'Permutations of A B C',
    aab: 'Permutations of A A B',
    five: 'Choose 3 of 5',
    twins: 'Subsets of 1 2 2',
  },
  /** @param {number} max */
  itemsError: (max) =>
    `Enter 1 to ${max} items, separated by spaces, each one or two letters or digits.`,
  /** @param {number} n */
  kError: (n) => `k must be a whole number from 0 to ${n}.`,
  itemsTitle: 'Items, sorted',
  itemsAria: 'The items in sorted order. Items in the current path are marked.',
  /** @param {number} i @param {string} v @param {boolean} on */
  itemCell: (i, v, on) => `Item ${v} at index ${i}${on ? ', in the path' : ''}`,
  treeTitle: 'Recursion tree',
  treeNote: 'Each circle is one call and shows the item it picked. ★ marks a call that output.',
  treeAria: 'Recursion tree of the generator, built as it runs.',
  rootLabel: '∅',
  /** @param {GenNode} n */
  nodeLabel: (n) =>
    `Call with path ${shown(n.path)}${n.output ? ', produced an output' : ''}${n.open ? ', still running' : ''}.`,
  outputMark: '★',
  legend: {
    active: 'Acted on now',
    open: 'The current path',
    finished: 'Returned',
    output: 'Produced an output',
  },
  stats: {
    results: 'Results',
    calls: 'Calls',
    copied: 'Items copied',
    skipped: 'Duplicates skipped',
  },
  /** @param {GenMode} mode @param {number} count */
  countNote: (mode, count) =>
    ({
      perm: `n! = ${count} if every item is different.`,
      comb: `C(n, k) = ${count} if every item is different.`,
      subset: `2ⁿ = ${count} if every item is different.`,
    })[mode],
  pathTitle: 'Current path',
  pathEmpty: 'Empty.',
  resultsTitle: 'Results',
  resultsEmpty: 'None yet.',
  /** @param {string} s */
  output: (s) => shown(s),
  /** @param {GenFrame} f */
  describe(f) {
    const item = f.at >= 0 ? f.items[f.at] : '';
    const now = f.path.map((i) => f.items[i]).join(' ');
    switch (f.kind) {
      case 'start':
        return f.mode === 'comb'
          ? `Generate every choice of ${f.k} from ${f.items.length} items. The items are sorted, so equal ones sit together.`
          : `Generate every ${f.mode === 'perm' ? 'permutation' : 'subset'} of ${f.items.length} items. The items are sorted, so equal ones sit together.`;
      case 'pick':
        return `Pick ${item}. The path is now ${now}.`;
      case 'emit':
        return `Output a copy of the path: ${shown(now)}. That copy costs ${plural(f.path.length, 'item', 'items')}.`;
      case 'unpick':
        return `Unpick ${item}, so the path is ${shown(now)} again, and try the next item.`;
      case 'skip':
        return `Skip this ${item}: at this level, the ${item} before it was already tried, so it would only repeat the same results.`;
      case 'cut':
        return `Stop this loop: from ${item} on, too few items remain to reach ${f.k}.`;
      case 'done':
        return `Done: ${plural(f.outputs.length, 'result', 'results')} from ${plural(f.calls, 'call', 'calls')}, with ${plural(f.copied, 'item', 'items')} copied.`;
    }
  },
  takeaways: [
    'One recursion, three rules. Permutations try every unused item, using a used[] array. Combinations and subsets only try items after the last one picked, using a start index, so each set appears in one order only.',
    'Subsets output at every call. Combinations output only when the path reaches size k, and permutations only when it reaches size n.',
    'To avoid duplicates, sort first, then at each level skip an item equal to the one before it. For permutations, skip it only while the earlier copy is unused, which means equal items are always picked in the same relative order.',
    'The cost is output-sensitive: the work grows with what is produced. There are n! permutations of length n, so no method can list them in under n · n! item writes. Slowness here is not a bad algorithm, it is a big answer.',
    'Generate permutations of A A B with List all, then with Skip duplicates. Results falls from 6 to 3, which is 3!/2!. Now predict the count for A A B B, then check it.',
  ],
  complexityHead: ['Generating', 'Cost', 'Why'],
  complexity: [
    ['Permutations', 'O(n · n!)', 'n! results of length n, and at most e · n! calls in all.'],
    ['Combinations', 'O(k · C(n, k))', 'C(n, k) results of length k; no call is wasted.'],
    ['Subsets', 'O(n · 2ⁿ)', '2ⁿ results, one call each, and an average length of n/2.'],
    ['Memory', 'O(n)', 'The path and the call stack, not counting the stored results.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many permutations do A B C D have?',
      answer: 24,
      unit: 'permutations',
      hints: ['Four ways for the first place, then three, then two, then one.'],
      solution: '4! = 4 · 3 · 2 · 1 = 24.',
    },
    {
      type: 'number',
      prompt: 'How many distinct permutations do A A B B have?',
      answer: 6,
      unit: 'permutations',
      hints: ['Type A A B B and use Skip duplicates.', 'Divide 4! by the repeats of each item.'],
      solution:
        '4!/(2! · 2!) = 24/4 = 6: AABB, ABAB, ABBA, BAAB, BABA, BBAA. With List all, each of these would appear 4 times.',
    },
    {
      type: 'number',
      prompt: 'How many ways are there to choose 3 items from A B C D E?',
      answer: 10,
      unit: 'ways',
      hints: ['Load Choose 3 of 5.', 'C(5, 3) = 5!/(3! · 2!).'],
      solution: 'C(5, 3) = 120/(6 · 2) = 10.',
    },
    {
      type: 'number',
      prompt: 'How many distinct subsets do the items 1 2 2 have, the empty one included?',
      answer: 6,
      unit: 'subsets',
      hints: ['Load Subsets of 1 2 2.', 'Choose how many 1s (0 or 1) and how many 2s (0, 1 or 2).'],
      solution:
        '2 · 3 = 6: ∅, 1, 1 2, 1 2 2, 2, 2 2. List all gives 2³ = 8, because 1 2 and 2 each appear twice.',
    },
    {
      type: 'number',
      prompt: 'Generating the permutations of A B C, how many calls does the recursion make?',
      answer: 16,
      unit: 'calls',
      hints: ['Count the nodes of the tree, level by level.'],
      solution: 'The levels hold 1, 3, 6 and 6 calls, which adds up to 16.',
    },
    {
      type: 'choice',
      prompt: 'Why do combinations loop from a start index instead of from 0?',
      options: [
        'To make the loop faster on sorted input.',
        'So that a set can only be built in increasing index order, once.',
        'Because the first item must always be included.',
        'To use less memory for the path.',
      ],
      answer: 1,
      hints: ['What would happen with {A, B} and {B, A}?'],
      solution:
        'Looking only forward means a set is built in exactly one order. Looping from 0 would produce {A, B} and {B, A} as if they were different.',
    },
    {
      type: 'multi',
      prompt: 'Which statements about skipping duplicates are true? Pick all that apply.',
      options: [
        'The items must be sorted, or at least equal ones adjacent, for the check to work.',
        'It removes results after generating them, so it costs more.',
        'It stops a whole branch before it is explored.',
        'The check compares a[i] with a[i − 1].',
      ],
      answers: [0, 2, 3],
      hints: ['Does the method ever produce a duplicate in the first place?'],
      solution:
        'The rule needs equal items side by side, compares neighbours, and prevents the branch. A set of seen results would do the removing, at much greater cost.',
    },
    {
      type: 'text',
      prompt: 'What is the time to list all permutations of n items, in big O?',
      accept: ['O(n·n!)', 'O(n n!)', 'O(n * n!)', 'O(n!·n)', 'n·n!', 'n n!', 'Θ(n·n!)'],
      hints: ['How many results are there, and how long is each?'],
      solution: 'n! results of length n, each copied once: O(n · n!).',
    },
  ],
  nextTeaser:
    'Next up: N-queens and Sudoku, where constraint checks prune choices long before a board is full.',
};
