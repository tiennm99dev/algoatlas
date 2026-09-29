/** @typedef {import('$lib/algo-engine/merge-quick-sort.js').DivideFrame} DivideFrame */

export const en = {
  slug: 'merge-quick-sort',
  topic: 'sorting',
  level: 'Intermediate',
  title: 'Merge sort & quicksort',
  intro:
    'Both break the O(n²) barrier by divide and conquer. Merge sort splits the array in half, sorts each half, and merges the two sorted runs. Quicksort picks a pivot, moves smaller values to its left, and sorts each side. While you step, bars outside the range a call is working on are dimmed.',
  summary:
    'Watch merge sort and quicksort split an array by divide and conquer, and see when quicksort degrades to O(n²).',
  instruction:
    'Pick an algorithm and a starting array, then step through. The stack panel shows which part of the array each call is working on. For quicksort, try each pivot rule on the sorted and reversed arrays.',
  algorithmLabel: 'Algorithm',
  algorithms: { merge: 'Merge sort', quick: 'Quicksort' },
  presetLabel: 'Starting array',
  presets: {
    random: 'Random',
    'nearly-sorted': 'Nearly sorted',
    reversed: 'Reversed',
    'few-unique': 'Few unique values',
  },
  sizeLabel: 'Size',
  shuffle: 'New array',
  pivotLabel: 'Pivot',
  pivots: { last: 'Last element', median3: 'Median of three', random: 'Random' },
  comparisons: 'Comparisons',
  moves: { merge: 'Writes', quick: 'Swaps' },
  depthLabel: 'Recursion depth',
  depthValue: /** @param {number} d @param {number} max */ (d, max) => `${d} (max ${max})`,
  stackTitle: { merge: 'Call stack (outermost first)', quick: 'Ranges still to sort' },
  stackEmpty: 'empty',
  rangeChip: /** @param {number} lo @param {number} hi */ (lo, hi) => `[${lo}–${hi}]`,
  compareTitle: 'Total cost on this array',
  compareRow: /** @param {number} c @param {number} s @param {string} moves */ (c, s, moves) =>
    `${c} comparisons · ${s} ${moves.toLowerCase()}`,
  /** @param {boolean|null} ok  null when the array has no equal values to keep in order */
  stableLabel: (ok) =>
    ok === null
      ? 'no equal values on this array'
      : ok
        ? 'equal values kept their order'
        : 'equal values were reordered',
  newArrayNotice: 'New array loaded.',
  /**
   * @param {number[]} values
   * @param {number} sortedCount
   * @param {[number, number]|null} range  the range the current call is working on
   */
  barsLabel(values, sortedCount, range) {
    const working = range ? ` Working on [${range[0]}–${range[1]}].` : '';
    return `Array: ${values.join(', ')}. ${sortedCount} of ${values.length} sorted.${working}`;
  },
  /**
   * @param {number[]} values
   * @param {string} [progress]  which buffer slots are next or already taken
   */
  auxLabel(values, progress = '') {
    return `Buffer: ${values.join(', ')}.${progress ? ` ${progress}` : ''}`;
  },
  /** @param {number|null} left @param {number|null} right @param {number} taken */
  bufferProgress(left, right, taken) {
    const next = [
      left === null ? '' : `Next from the left run: ${left}.`,
      right === null ? '' : `Next from the right run: ${right}.`,
    ]
      .filter(Boolean)
      .join(' ');
    return `${taken} taken. ${next}`.trim();
  },
  legend: {
    compare: 'Comparing',
    write: 'Writing or swapping',
    pivot: 'Pivot',
    run: 'Merged run',
    head: 'Next from each buffer run',
    taken: 'Already taken from the buffer',
    sorted: 'In final position',
  },
  markers: { compare: '?', write: '⇄', pivot: 'P', sorted: '✓', run: '▬', head: '↑', taken: '✕' },
  /**
   * @param {DivideFrame} f
   * @param {'merge'|'quick'} algo
   */
  describe(f, algo) {
    const v = (/** @type {number} */ i) => f.items[i]?.value;
    const [lo, hi] = f.range ?? [0, 0];
    const mid = Math.floor((lo + hi) / 2);
    const [x, y] = f.focus;
    switch (f.kind) {
      case 'start':
        return algo === 'merge'
          ? 'Merge sort splits every range in half until single elements remain. A one-element range is already sorted, so it takes no step.'
          : 'Quicksort partitions each range around a pivot. A range of one element is already in place, so it takes no step.';
      case 'split':
        return `Split [${lo}–${hi}] at ${mid}: sort the left half, then the right.`;
      case 'copy':
        return `Both halves of [${lo}–${hi}] are sorted. Copy them into the buffer, then merge back into the array.`;
      case 'take': {
        const right = f.lines.includes(6) || (f.lines.includes(8) && !f.lines.includes(9));
        const why = f.lines.includes(6)
          ? 'the left run is used up'
          : f.lines.includes(7)
            ? 'the right run is used up'
            : right
              ? 'it is smaller than the left head'
              : 'the left head is not larger (ties go left)';
        return `Write ${v(x)} to slot ${x} from the ${right ? 'right' : 'left'} run: ${why}.`;
      }
      case 'merged':
        return `Merged [${lo}–${hi}] into one sorted run.`;
      case 'call':
        return `Sort [${lo}–${hi}].`;
      case 'pivot':
        return x === f.pivot
          ? `The pivot ${v(f.pivot)} is already at the end of [${lo}–${hi}].`
          : `Move the chosen pivot to the end of [${lo}–${hi}]; it is now ${v(f.pivot)}.`;
      case 'scan':
        return f.swapped
          ? `${v(x)} ≤ pivot ${v(y)}: it belongs on the low side.`
          : `${v(x)} > pivot ${v(y)}: leave it on the high side.`;
      case 'swap':
        return `Swap slots ${x} and ${y} to grow the low side.`;
      case 'place':
        return `The pivot ${v(x)} lands at index ${x}, its final position. Sort the ranges on each side.`;
      case 'done':
        return `Sorted with ${f.comparisons} comparisons and ${f.swaps} ${algo === 'merge' ? 'writes' : 'swaps'}.`;
    }
  },
  takeaways: [
    'Merge sort always costs about n·log₂ n comparisons: log₂ n levels of splitting, and each level merges n elements.',
    'Merge sort is stable because a tie takes from the left run. Quicksort is not: a partition swap can jump over an equal value.',
    'With the last element as pivot, quicksort is quadratic on sorted, reversed, or all-equal input: the recursion goes n levels deep. Median-of-three fixes sorted input but not all-equal input, which needs a three-way partition.',
    'Merge sort pays for its guarantee with an O(n) buffer. Quicksort partitions in place and needs only its call stack, which stays O(log n) if it recurses into the smaller side first.',
    'Try quicksort with the “Last element” pivot on a “Reversed” array, then switch the pivot to “Median of three”: the recursion depth drops sharply.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    ['Time, merge', 'O(n log n)', 'log₂ n levels, n writes per level.'],
    ['Time, quick typical', 'O(n log n)', 'A good pivot splits the range into two similar halves.'],
    [
      'Time, quick worst',
      'O(n²)',
      'A pivot that is always the smallest or largest leaves one side empty.',
    ],
    [
      'Extra memory',
      'O(n) / O(log n)',
      'Merge needs a buffer; quicksort needs only its call stack.',
    ],
  ],
  nextTeaser:
    'Next up: binary search. Once an array is sorted, finding a value takes about log₂ n steps.',
};
