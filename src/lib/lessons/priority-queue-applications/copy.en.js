/** @typedef {import('$lib/algo-engine/priority-queue-applications.js').MergeFrame} MergeFrame */
/** @typedef {import('$lib/algo-engine/priority-queue-applications.js').TopKFrame} TopKFrame */

/** @param {number} n */
const ordinal = (n) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

/** @param {number} j */
const listName = (j) => 'ABCDE'[j] ?? String(j + 1);

export const en = {
  slug: 'priority-queue-applications',
  topic: 'heaps',
  level: 'Intermediate',
  title: 'Priority queue applications',
  intro:
    'A priority queue hands out the most urgent item first, and a binary heap makes every push and pop O(log n). Many problems become easy once you ask, “which item should go next?”: merging k sorted lists, keeping the k largest values of a stream, and running events in time order.',
  summary:
    'Merge k sorted lists by pulling the smallest head from a min-heap, and keep the top k values of a stream with a min-heap of size k, step by step.',
  instruction:
    'Pick a problem. For Merge, type sorted lists separated by / and watch each pop take the smallest head and push the next value of the same list. For Top k, type a stream and a k and watch values enter only when they beat the heap’s minimum.',
  problemLabel: 'Problem',
  problems: { merge: 'Merge k sorted lists', 'top-k': 'Top k largest' },
  listsLabel: 'Sorted lists, separated by /',
  streamLabel: 'Stream',
  kLabel: 'k',
  newInputButton: 'New input',
  newInputNotice: 'New input loaded.',
  listErrors: {
    format:
      'Type whole numbers in each list, and separate the lists with /, for example 1, 4 / 2, 3.',
    range: 'Every value must be from 0 to 99.',
    count: 'Type from 2 to 5 lists.',
    length: 'Each list holds at most 6 values.',
    unsorted: 'Each list must be sorted from small to large.',
  },
  streamErrors: {
    format: 'Type whole numbers separated by commas or spaces.',
    range: 'Every value must be from 0 to 99.',
    count: 'The stream holds at most 16 values.',
  },
  kError: 'k must be a whole number from 1 to 6.',
  listName,
  /** @param {number} j @param {number[]} values */
  listAria: (j, values) => `List ${listName(j)}: ${values.join(', ') || 'empty'}.`,
  /** @param {number} i @param {number} value @param {string} state */
  cellLabel: (i, value, state) => `Position ${i}: ${value}${state ? `, ${state}` : ''}`,
  /** @param {number} i @param {number} value @param {number} list @param {string} state */
  outCellLabel: (i, value, list, state) =>
    `Position ${i}: ${value} from list ${listName(list)}, ${state}`,
  headPointer: 'head',
  nextPointer: 'next',
  listsTitle: 'Input lists',
  heapTitle: 'Min-heap',
  /** @param {string[]} labels */
  heapAria: (labels) =>
    labels.length === 0 ? 'The heap is empty.' : `Min-heap as an array: ${labels.join(', ')}.`,
  /** @param {number} value @param {number} list */
  entryLabel: (value, list) => `${value} from list ${listName(list)}`,
  /** @param {number} i @param {string} label @param {string} state */
  slotLabel: (i, label, state) => `Slot ${i}: ${label}${state ? `, ${state}` : ''}`,
  outTitle: 'Merged output',
  outAria: (/** @type {number[]} */ values) =>
    values.length === 0 ? 'Output: empty.' : `Output: ${values.join(', ')}.`,
  streamTitle: 'Stream',
  streamAria: (/** @type {number[]} */ values) => `Stream: ${values.join(', ') || 'empty'}.`,
  states: {
    active: 'acted on now',
    frontier: 'in the heap',
    visited: 'done',
    compare: 'the heap’s minimum',
    sorted: 'in the output',
  },
  legendMerge: {
    active: 'Just pushed or popped',
    frontier: 'Head waiting in the heap',
    visited: 'Already merged',
    sorted: 'Output, marked with the list it came from',
  },
  outMarker: 'A–E',
  legendTopK: {
    active: 'Value read now, or where it settled',
    compare: 'Heap minimum: the kth largest so far',
    visited: 'Already read',
  },
  markers: { active: '▶', frontier: 'h', visited: '✓', sorted: '✓', compare: 'min' },
  stats: {
    comparisons: 'Comparisons',
    heapOps: 'Heap pushes and pops',
    n: 'Values n',
    k: 'Lists k',
    kTop: 'k',
    /** @param {number} n @param {number} k */
    bound: (n, k) => `n·log₂ k for n = ${n}, k = ${k}`,
  },
  resultTitle: 'Top k, largest first',
  resultEmpty: 'none yet',
  /** @param {MergeFrame} f @param {number[][]} lists */
  describeMerge(f, lists) {
    const name = listName(f.list);
    switch (f.kind) {
      case 'start':
        return `Merge ${lists.length} sorted lists of ${lists.flat().length} values. Only the heads can be next, so put each list’s head into a min-heap.`;
      case 'seed':
        return `Push ${f.value}, the head of list ${name}.`;
      case 'pop':
        return `Pop the smallest head, ${f.value} from list ${name}, and append it to the output.`;
      case 'push':
        return `List ${name} moves on: push its next value, ${f.value}. The heap again holds one head per unfinished list.`;
      case 'exhausted':
        return `List ${name} has no more values, so nothing replaces it. The heap shrinks.`;
      case 'done':
        return `Merged ${f.out.length} values with ${f.heapOps} heap operations and ${f.comparisons} comparisons. The heap never held more than ${lists.length} entries.`;
    }
  },
  /** @param {TopKFrame} f @param {number} k */
  describeTopK(f, k) {
    switch (f.kind) {
      case 'start':
        return `Keep the ${k} largest values in a min-heap of size ${k}. Its minimum is the smallest of the winners, the one to beat.`;
      case 'read':
        return `Read ${f.value}.`;
      case 'push':
        return `The heap holds fewer than ${k} values, so push ${f.value}.`;
      case 'replace':
        return `${f.value} > the minimum ${f.evicted}: drop ${f.evicted}, put ${f.value} at the root and sift it down.`;
      case 'skip':
        return `${f.value} ≤ the minimum ${f.heap[0]}: it cannot be among the ${k} largest. Skip it.`;
      case 'done':
        return f.heap.length === 0
          ? 'The stream was empty.'
          : `Done. The heap holds the ${f.heap.length} largest values, and its root ${f.heap[0]} is the ${f.heap.length === k ? `${ordinal(k)} largest` : 'smallest of them'}.`;
    }
  },
  takeaways: [
    'Reach for a priority queue whenever the question is “which item next?” and the candidates change as you go.',
    'Merging k sorted lists only ever needs the k heads. Pop the smallest, push its successor: n pops and n pushes on a heap of size k cost O(n log k).',
    'For the k largest of a stream, keep a min-heap of size k: its root is the bar to beat. That is O(n log k) time and O(k) memory, even when the stream is too long to store.',
    'Event simulation keeps future events in a min-heap keyed by time; popping the earliest event and pushing the events it causes always processes them in time order. Dijkstra’s shortest paths works the same way.',
    'Try a stream that only rises, like 1, 2, 3, … with k = 3: every value after the third replaces the root. A falling stream skips everything after the third.',
  ],
  complexityHead: ['Task', 'Cost', 'Why'],
  complexity: [
    [
      'Merge k lists, n values',
      'O(n log k)',
      'Each value is pushed and popped once on a heap of at most k.',
    ],
    [
      'Merge by repeated scanning',
      'O(n·k)',
      'Finding the smallest of k heads by a scan costs k per value.',
    ],
    [
      'Top k of n values',
      'O(n log k)',
      'One comparison per value, plus a sift of O(log k) when it enters.',
    ],
    [
      'Top k by sorting',
      'O(n log n)',
      'Sorting everything does more work and needs all n values in memory.',
    ],
    ['Memory', 'O(k)', 'The heap holds one entry per list, or the k winners.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Merge the lists 1, 4, 9 / 2, 3, 8 / 5, 6, 7. Which value does the fourth pop return?',
      answer: 4,
      hints: ['The output of a merge is the sorted order of all values.', 'Sorted: 1, 2, 3, 4, …'],
      solution:
        'Pops return 1, 2, 3, 4, … in sorted order. The fourth pop takes 4 from the first list, after 3 was popped and 8 pushed.',
    },
    {
      type: 'choice',
      prompt: 'To keep the 10 largest values of a long stream, which heap do you keep?',
      options: [
        'A max-heap of all values seen',
        'A min-heap of size 10',
        'A max-heap of size 10',
        'A min-heap of all values seen',
      ],
      answer: 1,
      hints: [
        'A newcomer must beat the weakest of the current winners. Which heap shows that one?',
      ],
      solution:
        'A min-heap of size 10 keeps the smallest winner at the root, so one comparison decides whether a new value enters. A heap of everything costs O(n) memory.',
    },
    {
      type: 'number',
      prompt:
        'Top 3 of the stream 5, 1, 9, 3, 7, 2, 8 with a min-heap of size 3: how many values replace the root?',
      answer: 3,
      unit: 'values',
      hints: [
        'The first three values fill the heap: 1, 5, 9 with root 1.',
        'Then compare 3, 7, 2, 8 with the current root each time.',
      ],
      solution:
        '3 > 1 replaces 1 (root 3); 7 > 3 replaces 3 (root 5); 2 ≤ 5 is skipped; 8 > 5 replaces 5. Three replacements; the heap ends as 7, 8, 9.',
    },
    {
      type: 'order',
      prompt:
        'A simulation keeps events in a min-heap by time. It holds “bus at 9”, “alarm at 7” and “mail at 8”. Popping “alarm at 7” schedules “coffee at 10”. In what order are the events processed?',
      items: ['bus at 9', 'coffee at 10', 'alarm at 7', 'mail at 8'],
      answer: [2, 3, 0, 1],
      hints: ['Each pop takes the earliest time in the heap, including events added later.'],
      solution:
        'Alarm (7) first; it adds coffee (10). Then mail (8), bus (9) and coffee (10): always the earliest pending time.',
    },
  ],
  nextTeaser:
    'Next up: Practice: heap problems, keeping a running median with two heaps and finding the k closest points.',
};
