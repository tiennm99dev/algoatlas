/** @typedef {import('$lib/algo-engine/build-heap.js').BuildHeapFrame} BuildHeapFrame */

export const en = {
  slug: 'build-heap',
  topic: 'heaps',
  level: 'Intermediate',
  title: 'Building a heap in linear time',
  intro:
    'To turn n values into a heap you could insert them one at a time, at O(log n) each. Bottom-up heapify does better: it treats the array as a tree, skips the leaves and sifts every other node down, from the last parent back to the root. The whole build costs only O(n), because most nodes sit near the bottom and can only sink a level or two.',
  summary:
    'Step through bottom-up heapify and one-by-one inserts on the same array, with a per-level table that shows why the bottom-up build costs O(n).',
  instruction:
    'Type up to 31 values or pick a size and a starting array, then step through. Switch between Bottom-up and One by one and compare the swap counts. In the level table, watch where the work lands: most nodes sit on the bottom levels.',
  methodLabel: 'Method',
  methods: { 'bottom-up': 'Bottom-up', 'one-by-one': 'One by one' },
  valuesLabel: 'Values',
  presetLabel: 'Starting array',
  presets: { random: 'Random', ascending: 'Ascending', descending: 'Descending' },
  sizeLabel: 'Size',
  newArrayButton: 'New array',
  newArrayNotice: 'New array loaded.',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 9, 4, 7.',
    range: 'Every value must be from 0 to 99.',
    count: 'Type from 2 to 31 values.',
  },
  heapTitle: 'Array as a tree',
  /** @param {number[]} values @param {number} region @param {'bottom-up'|'one-by-one'} method */
  heapAria: (values, region, method) =>
    method === 'bottom-up'
      ? `Array as a tree: ${values.join(', ')}.`
      : `Heap so far: ${values.slice(0, region).join(', ') || 'empty'}. Waiting: ${values.slice(region).join(', ') || 'none'}.`,
  arrayAria: (/** @type {number[]} */ values) => `Array: ${values.join(', ')}.`,
  /** @param {number} i @param {number} value @param {string} state */
  slotLabel: (i, value, state) => `Slot ${i}: ${value}${state ? `, ${state}` : ''}`,
  states: {
    active: 'being sifted',
    frontier: 'chosen child',
    compare: 'compared',
    swap: 'swapped',
    visited: 'root of a finished heap',
    waiting: 'not inserted yet',
  },
  legend: {
    active: 'Value being sifted',
    frontier: 'Chosen child',
    compare: 'Compared',
    swap: 'Swapped',
    visited: 'Root of a finished sub-heap',
  },
  waitingLegend: 'Faded: not in the heap yet (one by one)',
  markers: { active: 'i', frontier: 'c', compare: '?', swap: '⇄', visited: '✓' },
  stats: {
    comparisons: 'Comparisons',
    swaps: 'Swaps',
    /** @param {number} n */
    bottomUp: (n) => `Bottom-up total on these ${n}`,
    /** @param {number} n */
    oneByOne: (n) => `One by one total on these ${n}`,
  },
  levelsTitle: 'Swaps by level of the sift’s start',
  levelHead: ['Level', 'Nodes', 'Max each', 'Bound', 'Swaps'],
  /** @param {number} d */
  levelName: (d) => (d === 0 ? '0 (root)' : String(d)),
  totalRow: 'Total',
  /** @param {'bottom-up'|'one-by-one'} method */
  levelsNote: (method) =>
    method === 'bottom-up'
      ? 'A node can sink at most to the bottom, so the deepest levels, which hold most of the nodes, can move least.'
      : 'A new value can climb at most to the root, so the deepest levels, which hold most of the nodes, can move most.',
  /** @param {BuildHeapFrame} f */
  describe(f) {
    const v = (/** @type {number} */ i) => f.values[i];
    const n = f.values.length;
    switch (f.kind) {
      case 'start':
        if (n < 2) return 'One value is already a heap.';
        return f.method === 'bottom-up'
          ? `Slots ${Math.floor(n / 2)} to ${n - 1} are leaves, and a leaf is already a heap. Sift down each parent from slot ${Math.floor(n / 2) - 1} back to slot 0.`
          : 'Slot 0 alone is a heap. Add slots 1, 2, 3, … one at a time and sift each up, as if inserting it.';
      case 'sift':
        return f.method === 'bottom-up'
          ? `Sift down slot ${f.start} (${v(f.start)}). Both of its subtrees are already heaps.`
          : `Insert slot ${f.start} (${v(f.start)}) into the heap of slots 0 to ${f.start - 1} by sifting it up.`;
      case 'children': {
        const [l, r] = f.focus;
        return r === undefined
          ? `Slot ${f.node} has one child, ${v(l)} at slot ${l}.`
          : `Children of slot ${f.node}: ${v(l)} and ${v(r)}. The smaller is ${v(f.other)} at slot ${f.other}.`;
      }
      case 'compare':
        return f.stop
          ? `${v(f.other)} ≥ ${v(f.node)}: the parent is already the smallest. Stop.`
          : `${v(f.other)} < ${v(f.node)}: the child is smaller, so they swap.`;
      case 'swap':
        return `Swap: ${v(f.node)} sinks to slot ${f.node}.`;
      case 'leaf':
        return `Slot ${f.node} is a leaf, so the sift ends.`;
      case 'up-compare':
        return f.stop
          ? `${v(f.node)} ≥ its parent ${v(f.other)}: heap order holds. Stop.`
          : `${v(f.node)} < its parent ${v(f.other)}: it must climb.`;
      case 'up-swap':
        return `Swap: ${v(f.node)} climbs to slot ${f.node}.`;
      case 'up-root':
        return `${v(0)} reached the root: it is the smallest so far.`;
      case 'done':
        return `The array is a min-heap after ${f.swaps} ${f.swaps === 1 ? 'swap' : 'swaps'} and ${f.comparisons} ${f.comparisons === 1 ? 'comparison' : 'comparisons'}.`;
    }
  },
  takeaways: [
    'Bottom-up heapify skips the leaves, about half the array, and sifts each parent down from slot ⌊n/2⌋ − 1 back to 0. When a slot is sifted, both its subtrees are already heaps.',
    'A sift-down costs at most the node’s height. Half the nodes have height 0, a quarter height 1, an eighth height 2, … so the total is n·(1/4 + 2/8 + 3/16 + …) < n swaps: O(n).',
    'Inserting one by one is O(n log n) in the worst case, because the many deep nodes are exactly the ones that may climb the farthest.',
    'The O(n) build is why heapsort’s first phase is cheap, and why a priority queue built from a known list should heapify rather than insert.',
    'Try the Descending array at size 31 in both methods: bottom-up makes 26 swaps, one by one makes 98, and each level fills its bound exactly.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'Bottom-up build',
      'O(n)',
      'Σ (nodes at height h) × h ≤ Σ n/2^(h+1) × h < n swaps, two comparisons each.',
    ],
    [
      'One-by-one build, worst case',
      'O(n log n)',
      'About n/2 values sit on the bottom level and each may climb log₂ n levels.',
    ],
    [
      'One-by-one build, already a heap',
      'O(n)',
      'Each insert makes one comparison and stops at once.',
    ],
    ['Extra memory', 'O(1)', 'Both methods work inside the array.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Bottom-up heapify of 20 values: which slot is sifted down first?',
      answer: 9,
      hints: ['Leaves need no work. The first slot sifted is ⌊n/2⌋ − 1.'],
      solution:
        '⌊20/2⌋ − 1 = 9. Its left child is slot 19, the last slot; slots 10 to 19 are leaves.',
    },
    {
      type: 'text',
      prompt:
        'Heapify 9, 4, 7, 1, 8, 2, 6 into a min-heap bottom-up. Type the array after the build, separated by commas.',
      accept: ['1, 4, 2, 9, 8, 7, 6', '1 4 2 9 8 7 6', '[1, 4, 2, 9, 8, 7, 6]', '1,4,2,9,8,7,6'],
      hints: [
        'Sift slot 2, then slot 1, then slot 0.',
        'Slot 2 (7) swaps with 2; slot 1 (4) swaps with 1; then 9 sinks from the root two levels.',
      ],
      solution:
        'Slot 2: 7 swaps with its smaller child 2 → 9, 4, 2, 1, 8, 7, 6. Slot 1: 4 swaps with 1 → 9, 1, 2, 4, 8, 7, 6. Slot 0: 9 swaps with 1, then with 4 → 1, 4, 2, 9, 8, 7, 6.',
    },
    {
      type: 'number',
      prompt:
        'A full heap of 15 values has levels 0 to 3. What is the most swaps bottom-up heapify can make in total?',
      answer: 11,
      unit: 'swaps',
      hints: [
        'A node at level d can sink at most 3 − d levels.',
        'Levels 0, 1, 2 hold 1, 2 and 4 nodes; level 3 holds the 8 leaves.',
      ],
      solution:
        '1·3 + 2·2 + 4·1 + 8·0 = 11. Inserting one by one could need 0 + 2·1 + 4·2 + 8·3 = 34.',
    },
    {
      type: 'choice',
      prompt: 'Why is bottom-up heapify O(n) and not O(n log n)?',
      options: [
        'Each sift-down is O(1).',
        'Most nodes are near the bottom, where a sift-down is short; only a few nodes can sink far.',
        'It skips half the nodes, and n/2 · log n is O(n).',
        'It only works on arrays that are almost sorted.',
      ],
      answer: 1,
      hints: ['How far can a node sink, and how many nodes have that much room?'],
      solution:
        'A sift-down costs up to the node’s height. Half the nodes are leaves (height 0) and a quarter have height 1; only the root has height log₂ n. The sum Σ h · n/2^(h+1) stays below n. Skipping the leaves alone would still leave n/2 · log n.',
    },
  ],
  nextTeaser:
    'Next up: priority queue applications, where a min-heap merges k sorted lists, keeps the top k values and schedules events.',
};
