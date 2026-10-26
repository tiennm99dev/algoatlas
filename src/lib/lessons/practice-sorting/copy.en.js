/** @typedef {import('$lib/algo-engine/practice-sorting.js').RaceFrame} RaceFrame */
/** @typedef {import('$lib/algo-engine/practice-sorting.js').SortId} SortId */
/** @typedef {import('$lib/algo-engine/practice-sorting.js').Shape} Shape */
/** @typedef {import('$lib/algo-engine/practice-sorting.js').Constraint} Constraint */

const TAGS = 'abcdefghijklmnop';

/** @param {number} tag */
const tagName = (tag) => TAGS[tag] ?? String(tag + 1);

/** @type {Record<SortId, string>} */
const SORT_NAMES = {
  bubble: 'Bubble sort',
  insertion: 'Insertion sort',
  selection: 'Selection sort',
  merge: 'Merge sort',
  quick: 'Quicksort',
  heap: 'Heapsort',
};

/** @param {string[]} names */
const list = (names) =>
  names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** @param {number} k @param {string} one @param {string} many */
const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;

/** @param {number} p */
const ordinal = (p) => `${p}${p === 1 ? 'st' : p === 2 ? 'nd' : p === 3 ? 'rd' : 'th'}`;

export const en = {
  slug: 'practice-sorting',
  topic: 'sorting',
  level: 'Intermediate',
  title: 'Practice: choosing a sort',
  intro:
    'No sort wins everywhere. The best choice depends on the input’s shape (random, nearly sorted, reversed, full of repeats) and on what the job demands: stability, little extra memory, a worst-case guarantee or few writes. Here six sorts race on the same cards, one comparison per step, and a constraint picker shows which sorts fit a set of needs.',
  summary:
    'Race bubble, insertion, selection, merge, quick and heap sort on the same input, then match sorts to stability, memory and worst-case constraints.',
  instruction:
    'Pick an input shape or type your own cards, then step or play the race: each step, every running sort makes one more comparison. Read the totals table when they finish, then tick needs in the constraint picker to see which sorts fit.',
  shapeLabel: 'Input shape',
  shapes: /** @type {Record<Shape, string>} */ ({
    random: 'Random',
    'nearly-sorted': 'Nearly sorted',
    sorted: 'Sorted',
    reversed: 'Reversed',
    'few-unique': 'Few unique',
  }),
  sizeLabel: 'Size n',
  valuesLabel: 'Cards',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 42, 17, 88.',
    range: 'Every card must be from 0 to 99.',
    count: 'Type from 2 to 16 cards.',
  },
  sizeError: 'The size must be a whole number from 2 to 16.',
  sorts: SORT_NAMES,
  tagName,
  raceTitle: 'The race',
  tagNote:
    'A repeated key gets letters a, b, c above it in input order, so you can see whether a sort kept equal keys in order.',
  /** @param {number} comparisons @param {number} writes */
  laneStats: (comparisons, writes) =>
    `${plural(comparisons, 'comparison', 'comparisons')} · ${plural(writes, 'write', 'writes')}`,
  running: 'running',
  /** @param {number} place */
  finished: (place) => `✓ finished ${ordinal(place)}`,
  /** @param {string} name @param {string} status @param {number[]} keys */
  laneAria: (name, status, keys) => `${name}, ${status}: ${keys.join(', ')}`,
  legend: {
    compare: 'Just compared (merge sort: the slot just filled)',
    sorted: 'This sort has finished',
    tag: 'Order of equal keys in the input',
  },
  markers: { compare: '▾', sorted: '✓', tag: 'a b' },
  stats: { step: 'Step', length: 'Race length', running: 'Still running', cards: 'Cards' },
  /** @param {number} k @param {number} total */
  runningValue: (k, total) => `${k} of ${total}`,
  resultsTitle: 'Totals on this input',
  resultsAria: 'Each sort’s comparisons, writes, extra memory and stability on this input',
  resultsCols: ['Sort', 'Compares', 'Writes', 'Depth', 'Buffer', 'Stable here'],
  resultsNote:
    'Depth is the deepest recursion, buffer the extra cards held at once. A row fills in when its sort finishes.',
  pending: '…',
  /** @param {boolean | null} stable */
  stableHere: (stable) => (stable === null ? '– no repeats' : stable ? '✓ kept' : '✕ reordered'),
  pickerTitle: 'Constraint picker',
  pickerIntro: 'Tick what the job needs. A sort fits when it meets every ticked need.',
  constraints: /** @type {Record<Constraint, string>} */ ({
    stable: 'Stable: equal keys keep their order',
    'in-place': 'O(1) extra memory',
    average: 'O(n log n) time on average',
    worst: 'O(n log n) time even in the worst case',
    adaptive: 'O(n) time on already sorted input',
    'few-writes': 'Only O(n) writes',
  }),
  meets: '✓',
  fails: '✕',
  /** @param {string} name @param {boolean} fits @param {string[]} missing */
  fitAria: (name, fits, missing) =>
    fits ? `${name} fits` : `${name} does not fit: fails ${missing.join(', ')}`,
  constraintShort: /** @type {Record<Constraint, string>} */ ({
    stable: 'stable',
    'in-place': 'O(1) memory',
    average: 'average n log n',
    worst: 'worst n log n',
    adaptive: 'O(n) if sorted',
    'few-writes': 'O(n) writes',
  }),
  /** @param {string[]} names */
  matchSummary: (names) =>
    names.length === 0
      ? 'No sort in the race meets all of these needs. Drop one, or look for a hybrid such as Timsort or introsort.'
      : names.length === 6
        ? 'Every sort fits. Tick a need to narrow the choice.'
        : `${plural(names.length, 'sort fits', 'sorts fit')}: ${list(names)}.`,
  /** @param {RaceFrame} f */
  describe(f) {
    const n = f.lanes[0]?.items.length ?? 0;
    switch (f.kind) {
      case 'start':
        return `Six sorts each get their own copy of the same ${n} cards. Each step, every sort that is still running makes one more comparison, and the moves that follow it.`;
      case 'tick': {
        const left = f.lanes.filter((l) => !l.done).length;
        const head = `Step ${f.t}: every running sort has made ${plural(f.t, 'comparison', 'comparisons')}.`;
        if (f.finished.length === 0)
          return `${head} ${plural(left, 'sort is', 'sorts are')} still running.`;
        const who = list(f.finished.map((id) => SORT_NAMES[id]));
        const tail =
          left === 0
            ? 'Every sort is done.'
            : `${plural(left, 'sort is', 'sorts are')} still running.`;
        return `${head} ${who} ${f.finished.length === 1 ? 'finishes' : 'finish'} now. ${tail}`;
      }
      case 'done': {
        const first = f.lanes.filter((l) => l.place === 1);
        const worst = Math.max(...f.lanes.map((l) => l.comparisons));
        const last = f.lanes.filter((l) => l.comparisons === worst);
        const firstText = `${list(first.map((l) => SORT_NAMES[l.id]))} finished first with ${plural(first[0]?.comparisons ?? 0, 'comparison', 'comparisons')}`;
        if (first.length === f.lanes.length) return `All six sorted. ${firstText}: a dead heat.`;
        return `All six sorted. ${firstText}; ${list(last.map((l) => SORT_NAMES[l.id]))} needed ${plural(worst, 'comparison', 'comparisons')}. Try another shape: the order changes.`;
      }
    }
  },
  practiceTitle: 'Race questions',
  takeaways: [
    'Input shape decides the race. On sorted or nearly sorted input, insertion and bubble sort need only about n comparisons, while quicksort with the last card as pivot falls to n(n − 1)/2 and recurses n − 1 deep.',
    'Merge sort is stable and O(n log n) on every input, but it needs an extra buffer of n cards. Heapsort is O(n log n) with O(1) extra memory, but not stable.',
    'Stability matters when you sort by one key after another: a stable sort keeps the earlier order among equal keys. One input can prove a sort unstable, but never prove it stable.',
    'Selection sort makes n(n − 1)/2 comparisons on every input but at most n − 1 swaps, which helps when writes are expensive.',
    'Try it: run the Sorted shape at n = 16, then Reversed. Watch quicksort’s depth and insertion sort’s place swap between the two.',
  ],
  complexityHead: ['Sort', 'Worst-case time', 'Best case, memory and stability'],
  complexity: [
    ['Bubble sort (early exit)', 'O(n²)', 'O(n) on sorted input; O(1) extra; stable.'],
    ['Insertion sort', 'O(n²)', 'O(n) on sorted input; O(1) extra; stable.'],
    [
      'Selection sort',
      'O(n²)',
      'Always n(n − 1)/2 comparisons but at most n − 1 swaps; O(1) extra; not stable.',
    ],
    ['Merge sort', 'O(n log n)', 'The same on every input; O(n) buffer; stable.'],
    [
      'Quicksort (last pivot)',
      'O(n²)',
      'O(n log n) on average; O(log n) stack on average, O(n) at worst; not stable.',
    ],
    ['Heapsort', 'O(n log n)', 'O(n log n) on average too; O(1) extra; not stable.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'multi',
      prompt:
        'Run the race on the starting cards. Which sorts reorder an equal pair (the two 17s or the two 42s)?',
      options: Object.values(SORT_NAMES),
      answers: [2, 4, 5],
      hints: [
        'Step to the end and read the Stable here column.',
        'The letters above each repeated key show the order: a before b means kept.',
      ],
      solution:
        'Selection sort, quicksort and heapsort reorder an equal pair here: their long swaps carry a card over an equal one. Bubble, insertion and merge sort only ever move a card past a strictly larger or smaller one, so they are stable.',
    },
    {
      type: 'order',
      prompt:
        'On the starting cards, order these sorts by their number of comparisons, fewest first.',
      items: ['Heapsort', 'Merge sort', 'Insertion sort', 'Quicksort'],
      answer: [1, 3, 2, 0],
      hints: [
        'Play the race to the end and read the Compares column.',
        'The counts are 30, 36, 41 and 50.',
      ],
      solution:
        'Merge sort 30, quicksort 36, insertion sort 41, heapsort 50. Bubble and selection sort tie last with 66 = 12 × 11 / 2.',
    },
    {
      type: 'number',
      prompt:
        'Pick the Sorted shape with n = 16. How deep does quicksort’s recursion go (the Depth column)?',
      answer: 15,
      unit: 'levels',
      hints: [
        'With the last card as pivot, every partition of sorted cards leaves one side empty.',
        'Each call sorts a range one card shorter than its parent.',
      ],
      solution:
        'Depth 15 = n − 1, with 120 = 16 × 15 / 2 comparisons. Each pivot is the largest card in its range, so the range shrinks by one per call. This is quicksort’s worst case in both time and stack memory.',
    },
    {
      type: 'choice',
      prompt: 'Still on Sorted with n = 16: which sorts finish first?',
      options: [
        'Bubble sort and insertion sort, tied',
        'Merge sort',
        'Heapsort',
        'Quicksort and selection sort, tied',
      ],
      answer: 0,
      hints: [
        'Watch which lanes turn finished earliest.',
        'A sort that checks each neighbour pair once and finds nothing out of order stops after n − 1 comparisons.',
      ],
      solution:
        'Bubble and insertion sort both stop after n − 1 = 15 comparisons: bubble sort’s first pass makes no swap, and insertion sort stops each key after one comparison. Merge sort needs 32, heapsort 85, and quicksort and selection sort 120.',
    },
    {
      type: 'number',
      prompt: 'Pick the Reversed shape with n = 16. How many writes does bubble sort make?',
      answer: 240,
      unit: 'writes',
      hints: [
        'On reversed input every comparison finds an out-of-order pair.',
        'There are 16 × 15 / 2 = 120 comparisons, and each swap writes two slots.',
      ],
      solution:
        'All 120 comparisons lead to a swap of two slots: 240 writes. Selection sort on the same input makes the same 120 comparisons but only 16 writes.',
    },
    {
      type: 'number',
      prompt: 'Still on Reversed with n = 16: how many comparisons does merge sort make?',
      answer: 32,
      unit: 'comparisons',
      hints: [
        'In each merge, every card on the right is smaller than every card on the left.',
        'So each merge stops after as many comparisons as the right half has cards: 8 × 1 + 4 × 2 + 2 × 4 + 1 × 8.',
      ],
      solution:
        '8 × 1 + 4 × 2 + 2 × 4 + 1 × 8 = 32 comparisons over log₂ 16 = 4 levels. The worst case for merge sort is about n log₂ n = 64, so reversed input is easy for it.',
    },
    {
      type: 'choice',
      prompt:
        'You sort a million orders by date. Orders are already sorted by customer, and that order must hold within each date. The sort must never go quadratic. Use the constraint picker: which sort fits?',
      options: ['Quicksort', 'Heapsort', 'Merge sort', 'Insertion sort'],
      answer: 2,
      hints: [
        'Keeping the customer order among equal dates means the sort must be stable.',
        'Tick Stable and O(n log n) time even in the worst case.',
      ],
      solution:
        'Merge sort is the only stable sort here with an O(n log n) worst case. Quicksort and heapsort are not stable, and insertion sort is quadratic on most inputs.',
    },
    {
      type: 'choice',
      prompt:
        'A small device has almost no spare memory, and every sort must finish in O(n log n) time whatever the input. Which sort fits?',
      options: ['Merge sort', 'Heapsort', 'Quicksort', 'Selection sort'],
      answer: 1,
      hints: [
        'Tick O(1) extra memory and O(n log n) time even in the worst case.',
        'Merge sort’s buffer and quicksort’s stack both grow with n.',
      ],
      solution:
        'Heapsort sorts inside the array with O(1) extra memory and does O(n log n) work on every input. Merge sort needs an n-card buffer, quicksort can go quadratic and n deep, and selection sort is always quadratic.',
    },
    {
      type: 'choice',
      prompt:
        'A leaderboard is almost sorted after each round: only a few players swap places. You need a stable sort in place. Which is the best fit?',
      options: ['Insertion sort', 'Selection sort', 'Heapsort', 'Merge sort'],
      answer: 0,
      hints: [
        'Try the Nearly sorted shape and look at which sort finishes first.',
        'Tick Stable, O(1) extra memory and O(n) time on already sorted input.',
      ],
      solution:
        'Insertion sort is stable, in place, and does about n comparisons when only a few neighbours are out of order. Selection sort and heapsort are not stable, and merge sort needs a buffer.',
    },
  ],
  nextTeaser:
    'Next up: Linear search, the next chapter, where finding a value starts with a plain left-to-right scan.',
};
