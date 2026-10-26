/** @typedef {import('$lib/algo-engine/heapsort.js').HeapFrame} HeapFrame */

export const en = {
  slug: 'heapsort',
  topic: 'sorting',
  level: 'Intermediate',
  title: 'Heapsort',
  intro:
    'Heapsort first rearranges the array into a max-heap, a binary tree stored in the array where every parent is at least as large as its children. The largest value then sits at the root, so it swaps the root to the end, shrinks the heap by one and repairs it. It is O(n log n) even in the worst case and needs no extra array.',
  summary:
    'Step through heapsort on a linked tree and array view: build a max-heap, then swap the maximum to the end and sift down until the array is sorted.',
  instruction:
    'Type up to 15 values, or pick a starting array and press New array for a fresh one, then step through. The tree and the array below it are the same data: slot i has children 2i + 1 and 2i + 2. Watch the faded sorted tail grow from the right.',
  valuesLabel: 'Values',
  presetLabel: 'Starting array',
  presets: {
    random: 'Random',
    sorted: 'Sorted',
    reversed: 'Reversed',
    'few-unique': 'Few unique values',
  },
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 4, 10, 3.',
    range: 'Every value must be from 0 to 99.',
    count: 'Type from 2 to 15 values.',
  },
  newArrayButton: 'New array',
  newArrayNotice: 'New array loaded.',
  heapTitle: 'Heap as a tree and as an array',
  /** @param {number[]} values @param {number} size */
  heapAria: (values, size) =>
    `Array: ${values.join(', ')}. Heap is slots 0 to ${size - 1}${size < values.length ? `; slots ${size} to ${values.length - 1} are sorted` : ''}.`,
  emptyHeapAria: (/** @type {number[]} */ values) => `Array: ${values.join(', ')}. All sorted.`,
  stats: {
    comparisons: 'Comparisons',
    swaps: 'Swaps',
    size: 'Heap size',
    phase: 'Phase',
  },
  phases: { build: 'Build heap', sort: 'Extract max' },
  /** @param {number} n */
  boundLabel: (n) => `2n·log₂ n for n = ${n}`,
  legend: {
    node: 'Being sifted down',
    child: 'Larger child',
    compare: 'Comparing',
    swap: 'Swapping',
    sorted: 'Sorted tail',
  },
  markers: { node: 'i', child: 'c', compare: '?', swap: '⇄', sorted: '✓' },
  /** @param {HeapFrame} f */
  describe(f) {
    const v = (/** @type {number} */ i) => f.values[i];
    const n = f.values.length;
    switch (f.kind) {
      case 'start':
        return n < 2
          ? 'One value is already sorted.'
          : `First turn the array into a max-heap, where every parent ≥ its children. Leaves are heaps on their own, so sift down each internal node from slot ${Math.floor(n / 2) - 1} back to slot 0.`;
      case 'sift':
        return f.phase === 'build'
          ? `Sift down slot ${f.node} (${v(f.node)}): its subtrees are already heaps.`
          : `Sift the new root ${v(0)} down to restore the heap of ${f.size}.`;
      case 'children': {
        const [l, r] = f.focus;
        return r === undefined
          ? `Slot ${f.node} has one child, ${v(l)} at slot ${l}.`
          : `Children of slot ${f.node}: ${v(l)} and ${v(r)}. The larger is ${v(f.child)} at slot ${f.child}.`;
      }
      case 'compare':
        return f.stop
          ? `${v(f.child)} ≤ ${v(f.node)}: the parent is not smaller, so heap order holds. Stop.`
          : `${v(f.child)} > ${v(f.node)}: the child is larger, so they swap.`;
      case 'swap':
        return `Swapped: ${v(f.node)} moves down to slot ${f.node} and keeps sifting.`;
      case 'leaf':
        return `Slot ${f.node} has no child inside the heap, so the sift ends.`;
      case 'extract':
        return `The root held the maximum, ${v(f.size)}. Swap it to slot ${f.size}, its final place. The heap shrinks to ${f.size}.`;
      case 'done':
        return `Sorted with ${f.comparisons} ${f.comparisons === 1 ? 'comparison' : 'comparisons'} and ${f.swaps} ${f.swaps === 1 ? 'swap' : 'swaps'}, all inside the array.`;
    }
  },
  takeaways: [
    'A max-heap stored in an array needs no pointers: slot i’s children are 2i + 1 and 2i + 2, and its parent is ⌊(i − 1)/2⌋.',
    'Building the heap bottom-up costs only O(n): most nodes sit near the bottom and sift down a level or two.',
    'Each of the n − 1 extracts swaps the root to the end and sifts down at most log₂ n levels, so heapsort is O(n log n) even in the worst case. Unlike quicksort, no input can make it quadratic.',
    'It sorts in place with O(1) extra memory, unlike merge sort, but it is not stable, and its jumps around the array make it slower than quicksort in practice.',
    'Try the Sorted preset: the build phase has to move almost every value, while the Reversed array is already a max-heap and builds with no swaps.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'Build the heap',
      'O(n)',
      'A node at height h sifts at most h levels; the sum over all nodes is below 2n.',
    ],
    ['One extract-max', 'O(log n)', 'One swap, then a sift down the height of the tree.'],
    [
      'Whole sort, worst case',
      'O(n log n)',
      'n − 1 extracts of O(log n) each; no input does worse.',
    ],
    [
      'Extra memory',
      'O(1)',
      'The heap lives in the array itself; the sorted tail grows behind it.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt:
        'Build a max-heap from 4, 10, 3, 5, 1 with the bottom-up method. Type the array after the build, separated by commas.',
      accept: ['10, 5, 3, 4, 1', '10 5 3 4 1', '[10, 5, 3, 4, 1]', '10,5,3,4,1'],
      hints: [
        'n = 5, so sift down slots 1 and then 0.',
        'Slot 1 (10) has children 5 and 1: it is already larger. Then sift slot 0 (4).',
      ],
      solution:
        'Slot 1 holds 10, larger than its children 5 and 1, so nothing moves. Slot 0 holds 4; its larger child is 10, so they swap: 10, 4, 3, 5, 1. Now 4 at slot 1 has children 5 and 1; 5 is larger, so they swap: 10, 5, 3, 4, 1.',
    },
    {
      type: 'number',
      prompt: 'In a 0-based array heap, which slot holds the left child of slot 4?',
      answer: 9,
      hints: ['The left child of slot i is 2i + 1.'],
      solution: '2 × 4 + 1 = 9. The right child is slot 10, and the parent of slot 4 is ⌊3/2⌋ = 1.',
    },
    {
      type: 'number',
      prompt: 'Building a heap of 10 values, which slot is sifted down first?',
      answer: 4,
      hints: [
        'Leaves need no work. The last slot with a child is the parent of the last slot.',
        'The last slot is 9, and its parent is ⌊(9 − 1)/2⌋.',
      ],
      solution:
        'The build starts at ⌊n/2⌋ − 1 = 4, the parent of slot 9. Slots 5 to 9 are leaves, which are already heaps.',
    },
    {
      type: 'choice',
      prompt:
        'Heapsort the cards 2a, 2b, 1, where the letter only marks input order. What is the final order?',
      options: ['1, 2a, 2b', '1, 2b, 2a', '2a, 2b, 1', '2b, 2a, 1'],
      answer: 1,
      hints: [
        'The input is already a max-heap: 2a at the root, children 2b and 1.',
        'The first extract swaps the root 2a with slot 2.',
      ],
      solution:
        'Extract 1 swaps 2a to slot 2: 1, 2b, 2a. Sifting 1 down swaps it with 2b: 2b, 1, 2a. Extract 2 swaps 2b to slot 1: 1, 2b, 2a. The two 2s ended in the wrong order, so heapsort is not stable.',
    },
  ],
  nextTeaser:
    'Next up: the comparison sort lower bound, which shows that no comparison sort can beat n log n.',
};
