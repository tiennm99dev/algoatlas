/** @typedef {import('$lib/algo-engine/binary-heaps.js').BinaryHeapFrame} BinaryHeapFrame */
/** @typedef {import('$lib/algo-engine/binary-heaps.js').HeapOp} HeapOp */
/** @typedef {import('$lib/algo-engine/binary-heaps.js').HeapKind} HeapKind */

/** @param {HeapKind} h */
const word = (h) => (h === 'min' ? 'smallest' : 'largest');
/** @param {HeapKind} h */
const lt = (h) => (h === 'min' ? '<' : '>');
/** @param {HeapKind} h */
const ge = (h) => (h === 'min' ? '≥' : '≤');

export const en = {
  slug: 'binary-heaps',
  topic: 'heaps',
  level: 'Beginner',
  title: 'Binary heaps',
  intro:
    'A binary heap is a complete binary tree where every parent comes before its children: in a min-heap no child is smaller than its parent, so the smallest value always sits at the root. Because the tree is complete, it packs into an array with no pointers at all. Insert and remove-the-top each walk one root-to-leaf path, so both cost O(log n).',
  summary:
    'Insert into and extract from a binary min-heap or max-heap step by step, with the tree and its array drawn side by side as values sift up and down.',
  instruction:
    'Type a value and press Insert (or Enter), or press Extract min. Each operation joins the log; step through it and watch the same slots move in the tree and in the array. Switch to a max-heap to flip the order, or click a slot to see its parent and children.',
  valueLabel: 'Value',
  insert: 'Insert',
  /** @param {HeapKind} h */
  extract: (h) => (h === 'min' ? 'Extract min' : 'Extract max'),
  undo: 'Undo',
  reset: 'Reset',
  heapLabel: 'Heap type',
  heaps: { min: 'Min-heap', max: 'Max-heap' },
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    build: 'Insert 9, extract 1',
    drain: 'Insert 7, extract all',
    sorted: 'Ascending inserts',
    random: 'Random',
  },
  valueError: 'Type a whole number from 0 to 99.',
  full: 'The heap holds at most 15 values here. Extract one first.',
  emptyError: 'The heap is empty, so there is nothing to extract.',
  logFull: 'The log holds 24 operations. Undo or reset to try more.',
  heapTitle: 'Heap as a tree and as an array',
  /** @param {number[]} values @param {HeapKind} h */
  heapAria: (values, h) =>
    values.length === 0
      ? 'The heap is empty.'
      : `${h === 'min' ? 'Min' : 'Max'}-heap of ${values.length}, array: ${values.join(', ')}.`,
  /** @param {number} i @param {number} n */
  slotInfo: (i, n) => {
    const kids = [2 * i + 1, 2 * i + 2].filter((c) => c < n);
    const parent =
      i === 0 ? 'it is the root' : `parent ⌊(${i} − 1)/2⌋ = ${Math.floor((i - 1) / 2)}`;
    const children =
      kids.length === 0
        ? 'no children (a leaf)'
        : `children 2·${i} + 1 = ${2 * i + 1}${kids.length === 2 ? ` and 2·${i} + 2 = ${2 * i + 2}` : ''}`;
    return `Slot ${i}: ${parent}; ${children}.`;
  },
  slotHint: 'Click or press Enter on a slot to see its parent and children.',
  stats: {
    size: 'Size',
    height: 'Height (levels below the root)',
    comparisons: 'Comparisons',
    swaps: 'Swaps',
    /** @param {HeapKind} h */
    top: (h) => (h === 'min' ? 'Top: the minimum' : 'Top: the maximum'),
  },
  noTop: '—',
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'running now',
  /** @param {HeapOp} op @param {HeapKind} h */
  opChip: (op, h) => (op.type === 'insert' ? `+${op.value}` : h === 'min' ? 'min' : 'max'),
  outTitle: 'Removed, in order',
  outEmpty: 'nothing yet',
  legend: {
    active: 'Value being sifted',
    frontier: 'Chosen child',
    compare: 'Compared',
    swap: 'Swapped',
    sorted: 'Settled in place',
  },
  markers: { active: 'i', frontier: 'c', compare: '?', swap: '⇄', sorted: '✓' },
  /** @param {BinaryHeapFrame} f */
  describe(f) {
    const v = (/** @type {number} */ i) => f.values[i];
    const h = f.heap;
    switch (f.kind) {
      case 'start':
        return `An empty ${h}-heap. Every parent must be ${h === 'min' ? '≤' : '≥'} its children, so the ${word(h)} value will sit at the root.`;
      case 'insert':
        return `Insert ${f.value}: put it in the next free slot, ${f.node}, so the tree stays complete. Then sift it up.`;
      case 'up-compare':
        return f.stop
          ? `${v(f.node)} ${ge(h)} its parent ${v(f.other)} at slot ${f.other}: heap order holds. Stop.`
          : `${v(f.node)} ${lt(h)} its parent ${v(f.other)} at slot ${f.other}: they are out of order.`;
      case 'up-swap':
        return `Swap: ${v(f.node)} moves up to slot ${f.node}, ${v(f.other)} moves down to slot ${f.other}.`;
      case 'up-root':
        return `${v(0)} reached the root: it is the new ${word(h)} value.`;
      case 'empty':
        return 'The heap is empty, so there is nothing to extract.';
      case 'extract':
        return f.values.length === 0
          ? `Take the root ${f.value}. It was the only value, so the heap is now empty.`
          : `Take the root ${f.value}, the ${word(h)} value. Move the last value, ${v(0)}, into the root so the tree stays complete, then sift it down.`;
      case 'down-children': {
        const [l, r] = f.focus;
        return r === undefined
          ? `Slot ${f.node} has one child, ${v(l)} at slot ${l}.`
          : `Children of slot ${f.node}: ${v(l)} and ${v(r)}. The ${h === 'min' ? 'smaller' : 'larger'} is ${v(f.other)} at slot ${f.other}.`;
      }
      case 'down-compare':
        return f.stop
          ? `${v(f.other)} ${ge(h)} ${v(f.node)}: the child does not belong above its parent. Stop.`
          : `${v(f.other)} ${lt(h)} ${v(f.node)}: the child belongs above, so they swap.`;
      case 'down-swap':
        return `Swap: ${v(f.node)} moves down to slot ${f.node} and keeps sifting.`;
      case 'down-leaf':
        return `Slot ${f.node} has no children, so the sift ends.`;
      case 'returned':
        return `Return ${f.value}. The heap now holds ${f.values.length} ${f.values.length === 1 ? 'value' : 'values'}.`;
      case 'done':
        return `All operations done: ${f.comparisons} ${f.comparisons === 1 ? 'comparison' : 'comparisons'} and ${f.swaps} ${f.swaps === 1 ? 'swap' : 'swaps'}.`;
    }
  },
  takeaways: [
    'Heap property: every parent comes before its children (≤ in a min-heap, ≥ in a max-heap), so the top value sits at the root. Siblings have no order between them.',
    'A heap is a complete tree, filled level by level from the left, so it lives in an array: slot i has children 2i + 1 and 2i + 2 and parent ⌊(i − 1)/2⌋.',
    'Insert puts the value in the next free slot and sifts it up; extract moves the last value to the root and sifts it down. Each walks at most ⌊log₂ n⌋ levels.',
    'Peeking at the top is O(1); a heap is the usual way to build a priority queue.',
    'Try the Insert 7, extract all preset: the removed values come out sorted. That is heapsort in a nutshell.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Peek at the top', 'O(1)', 'The top value is always at slot 0.'],
    [
      'Insert',
      'O(log n)',
      'One sift up from a leaf, at most ⌊log₂ n⌋ swaps; random values usually climb only a level or two.',
    ],
    ['Extract the top', 'O(log n)', 'One sift down from the root, two comparisons per level.'],
    ['Find any other value', 'O(n)', 'Heap order says nothing about where a non-top value sits.'],
    ['Memory', 'O(n)', 'The array itself; no pointers, since positions encode the tree.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'In a 0-based array heap, which slot is the parent of slot 11?',
      answer: 5,
      hints: ['The parent of slot i is ⌊(i − 1)/2⌋.'],
      solution: '⌊(11 − 1)/2⌋ = 5. Check: the children of slot 5 are 2·5 + 1 = 11 and 12.',
    },
    {
      type: 'choice',
      prompt: 'Which array is a valid min-heap?',
      options: ['3, 5, 4, 9, 6, 8', '3, 5, 4, 2, 6, 8', '5, 3, 4, 9, 6, 8', '3, 9, 4, 5, 6, 8'],
      answer: 0,
      hints: [
        'Check every slot against its parent: slots 1 and 2 under 0, slots 3 and 4 under 1, slot 5 under 2.',
      ],
      solution:
        '3, 5, 4, 9, 6, 8: 5 and 4 are ≥ 3, 9 and 6 are ≥ 5, 8 ≥ 4. The others fail: 2 sits under 5, 3 sits under 5 at the root, and 5 and 6 sit under 9.',
    },
    {
      type: 'text',
      prompt:
        'Insert 1 into the min-heap 2, 4, 3, 7, 5. Type the array after the sift up, separated by commas.',
      accept: ['1, 4, 2, 7, 5, 3', '1 4 2 7 5 3', '[1, 4, 2, 7, 5, 3]', '1,4,2,7,5,3'],
      hints: [
        '1 goes into slot 5. Its parent is slot ⌊4/2⌋ = 2.',
        'After swapping with 3 at slot 2, compare with the root 2.',
      ],
      solution:
        '1 enters slot 5: 2, 4, 3, 7, 5, 1. It is smaller than its parent 3 (slot 2), so they swap: 2, 4, 1, 7, 5, 3. It is smaller than the root 2, so they swap: 1, 4, 2, 7, 5, 3.',
    },
    {
      type: 'text',
      prompt:
        'Extract the minimum from the min-heap 1, 4, 2, 7, 5, 3. Type the array after the sift down, separated by commas.',
      accept: ['2, 4, 3, 7, 5', '2 4 3 7 5', '[2, 4, 3, 7, 5]', '2,4,3,7,5'],
      hints: [
        'Remove 1 and move the last value, 3, into the root.',
        'The root’s children are 4 and 2; the smaller is 2.',
      ],
      solution:
        'Removing 1 and moving 3 to the root gives 3, 4, 2, 7, 5. The smaller child is 2 < 3, so they swap: 2, 4, 3, 7, 5. Slot 2 now has no children, so the sift ends.',
    },
  ],
  nextTeaser:
    'Next up: building a heap in linear time, where heapifying a whole array bottom-up costs only O(n).',
};
