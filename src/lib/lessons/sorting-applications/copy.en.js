import { isCorrectMerge, mergedBlocks } from '$lib/algo-engine/sorting-applications.js';

/** @typedef {import('$lib/algo-engine/sorting-applications.js').MergeFrame} MergeFrame */
/** @typedef {import('$lib/algo-engine/sorting-applications.js').DedupFrame} DedupFrame */
/** @typedef {import('$lib/algo-engine/sorting-applications.js').Comparator} Comparator */

/** @param {{start: number, end: number}} x */
const span = (x) => `${x.start}–${x.end}`;

/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'sorting-applications',
  topic: 'sorting',
  level: 'Intermediate',
  title: 'Sorting applications',
  intro:
    'Many problems get easy once the data is sorted, because sorting puts related items next to each other. Overlapping intervals become neighbours, so one scan merges them; equal values become neighbours, so one scan removes repeats. The key you sort by is chosen with a comparator, and the wrong one gives a wrong answer.',
  summary:
    'Merge overlapping intervals and remove duplicates with one scan after a sort, and see how the comparator decides whether the scan is correct.',
  instruction:
    'In Merge intervals, edit the intervals or keep the example, then step through with each sort key. On the example, only sorting by start gives the correct blocks. In Remove duplicates, watch each value compared with its left neighbour.',
  modeLabel: 'Problem',
  modes: { merge: 'Merge intervals', dedup: 'Remove duplicates' },
  comparatorLabel: 'Sort by',
  comparators: { start: 'Start', end: 'End', none: 'No sort' },
  /** @type {Record<Comparator, string>} */
  comparatorCode: {
    start: 'compare(x, y) = x.start − y.start, ties by x.end − y.end',
    end: 'compare(x, y) = x.end − y.end, ties by x.start − y.start',
    none: 'no comparator: the input order is kept',
  },
  comparatorNote:
    'A comparator returns a negative number when x goes first, zero for a tie and a positive number when y goes first.',
  intervalsLabel: 'Intervals (start-end, hours 0 to 24)',
  valuesLabel: 'Values (0 to 99)',
  intervalErrors: {
    format: 'Type intervals as start-end pairs separated by commas, for example 1-3, 2-6.',
    range: 'Each interval needs start < end, with hours from 0 to 24.',
    count: 'Type from 2 to 8 intervals.',
  },
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 7, 3, 7.',
    range: 'Every value must be from 0 to 99.',
    count: 'Type from 2 to 14 values.',
  },
  timelineTitle: 'Intervals in scan order',
  blocksTitle: 'Merged blocks',
  /** @param {{start: number, end: number}[]} list */
  timelineAria: (list) => `Intervals in scan order: ${list.map(span).join(', ')}.`,
  /** @param {{start: number, end: number}[]} list */
  blocksAria: (list) =>
    list.length === 0 ? 'No blocks yet.' : `Merged blocks: ${list.map(span).join(', ')}.`,
  span,
  /** @param {number} k */
  blockMarker: (k) => `B${k + 1}`,
  valuesTitle: 'Values in scan order',
  outTitle: 'Distinct values',
  valuesAria: 'Values in scan order',
  outAria: 'Distinct values',
  outEmpty: 'none yet',
  stats: {
    checks: 'Checks',
    blocks: 'Blocks',
    intervals: 'Intervals',
    distinct: 'Distinct values',
    pairs: 'Pairs, without sorting',
  },
  verdict: {
    right: '✓ correct merge',
    wrong: '✕ wrong merge',
  },
  legend: {
    current: 'Being scanned',
    scanned: 'Already scanned',
    open: 'Open block',
    closed: 'Finished block',
    kept: 'Kept',
    skipped: 'Skipped repeat',
  },
  markers: { current: '▶', kept: '✓', skipped: '✕' },
  states: { current: 'being scanned', kept: 'kept', skipped: 'skipped' },
  /** @param {number} i @param {number} value @param {string} state */
  cellLabel: (i, value, state) => `Slot ${i}: ${value}${state ? `, ${state}` : ''}`,
  /**
   * @param {MergeFrame} f
   * @param {Comparator} by
   */
  describeMerge(f, by) {
    const x = f.items[f.i];
    const last = f.blocks.at(-1);
    const prev = f.blocks.at(-2);
    switch (f.kind) {
      case 'start':
        return `${f.items.length} intervals in input order. The scan can only see the block it is building, so overlapping intervals must arrive next to each other.`;
      case 'sorted':
        return by === 'start'
          ? 'Sorted by start: an interval can now only overlap the block just before it.'
          : by === 'end'
            ? 'Sorted by end. An early-starting long interval may now come late: watch whether the scan still catches every overlap.'
            : 'Not sorted: the scan reads the intervals in input order.';
      case 'open':
        return `Open the first block with ${span(x)}.`;
      case 'extend':
        return `${span(x)} starts at ${x.start}, not after the block’s end: they overlap, so the block becomes ${last ? span(last) : ''}.`;
      case 'new':
        return `${span(x)} starts at ${x.start}, after the block ends at ${prev ? prev.end : ''}: a gap, so open a new block.`;
      case 'done': {
        const n = f.blocks.length;
        const head = `${count(n, 'block', 'blocks')} after ${count(f.checks, 'check', 'checks')}: ${f.blocks.map(span).join(', ')}.`;
        return isCorrectMerge(f.items, f.blocks)
          ? `${head} This is the correct merge.`
          : `${head} Wrong: the correct merge is ${mergedBlocks(f.items).map(span).join(', ')}. Without a sort by start, the scan can join intervals that do not overlap, or miss an overlap with a block it has already left.`;
      }
    }
  },
  /** @param {DedupFrame} f */
  describeDedup(f) {
    const a = f.items;
    const n = a.length;
    switch (f.kind) {
      case 'start':
        return `${n} values. Sort them first, so equal values sit side by side.`;
      case 'sorted':
        return `Sorted: ${a.join(', ')}. Every repeat is now right after a copy of itself.`;
      case 'keep':
        return f.i === 0
          ? `Keep a[0] = ${a[0]}: the first value is always new.`
          : `a[${f.i}] = ${a[f.i]} differs from a[${f.i - 1}] = ${a[f.i - 1]}: keep it.`;
      case 'skip':
        return `a[${f.i}] = ${a[f.i]} equals a[${f.i - 1}]: skip the repeat.`;
      case 'done':
        return `${count(f.out.length, 'distinct value', 'distinct values')} after ${count(f.checks, 'check', 'checks')}. Without sorting, comparing every pair would take ${(n * (n - 1)) / 2}.`;
    }
  },
  takeaways: [
    'Sorting first is a common pattern: pay O(n log n) once, then solve the problem in one O(n) scan.',
    'To remove duplicates, sort and compare each value with its left neighbour: n − 1 checks instead of n(n − 1)/2 pairs.',
    'To merge intervals, sort by start. Then each interval either overlaps the current block, which grows, or starts after it, which opens a new block.',
    'A comparator decides the order. It returns a negative number, zero or a positive number, and a tie-break (by end when starts are equal) makes the order fully defined.',
    'Switch the sort key to End on the example: the interval 2–6 arrives after 4–5 has opened its own block, so the scan never joins it to 1–3.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    ['Sort', 'O(n log n)', 'Any good comparison sort, such as merge sort.'],
    ['Merge scan', 'O(n)', 'One overlap check per interval after the first.'],
    ['Dedup scan', 'O(n)', 'One comparison with the left neighbour per value.'],
    ['Dedup without sorting', 'O(n²)', 'Every pair of values may need a comparison.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt:
        'Merge the intervals 1-3, 2-6, 8-10, 15-18. Type the blocks as start-end pairs, separated by commas.',
      accept: ['1-6, 8-10, 15-18', '1-6 8-10 15-18', '1-6,8-10,15-18', '[1-6, 8-10, 15-18]'],
      hints: [
        'They are already sorted by start.',
        '2-6 starts before 1-3 ends, so those two join.',
      ],
      solution:
        '1-3 opens a block; 2-6 starts at 2 ≤ 3, so the block grows to 1-6. 8-10 starts after 6: new block. 15-18 starts after 10: new block. Result: 1-6, 8-10, 15-18.',
    },
    {
      type: 'number',
      prompt:
        'After sorting 10 values, how many neighbour comparisons does the duplicate scan make?',
      answer: 9,
      unit: 'checks',
      hints: ['Every value except the first is compared with the one on its left.'],
      solution:
        'n − 1 = 9 checks. Comparing every pair without sorting would take 10 × 9 / 2 = 45.',
    },
    {
      type: 'choice',
      prompt: 'Which comparator sorts intervals by start, breaking ties by end?',
      options: [
        '(x, y) => x.start − y.start || x.end − y.end',
        '(x, y) => x.end − y.end || x.start − y.start',
        '(x, y) => x.start < y.start',
        '(x, y) => y.start − x.start',
      ],
      answer: 0,
      hints: [
        'A comparator returns a number: negative when x goes first.',
        'When x.start − y.start is 0, the || falls through to the tie-break.',
      ],
      solution:
        'x.start − y.start is negative when x starts first, so x goes first. When the starts are equal it is 0, and || moves on to x.end − y.end. Returning a boolean is not a valid comparator, and y.start − x.start sorts in descending order.',
    },
    {
      type: 'number',
      prompt:
        'Sort 1-3, 2-6, 4-5 by end, then run the merge scan. How many blocks does it report? (The correct answer would be 1.)',
      answer: 2,
      unit: 'blocks',
      hints: [
        'By end the order is 1-3, 4-5, 2-6.',
        '4-5 starts after 3, so it opens a new block before 2-6 arrives.',
      ],
      solution:
        'Order by end: 1-3, 4-5, 2-6. 1-3 opens a block; 4-5 starts at 4 > 3, so a new block; 2-6 starts at 2 ≤ 5 and joins the second block. The scan reports 2 blocks, but 2-6 overlaps both, so all three should be one block 1-6.',
    },
  ],
  nextTeaser:
    'Next up: practice choosing a sort, racing several algorithms on inputs of different shapes.',
};
