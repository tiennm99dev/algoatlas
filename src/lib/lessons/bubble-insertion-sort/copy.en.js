/** @typedef {import('$lib/algo-engine/sorting.js').SortFrame} SortFrame */

export const en = {
  slug: 'bubble-insertion-sort',
  topic: 'sorting',
  level: 'Beginner',
  title: 'Bubble sort & insertion sort',
  intro:
    'Two of the simplest ways to sort: bubble sort keeps swapping neighbors that are out of order, insertion sort grows a sorted prefix one card at a time. Both are O(n²) in the worst case — but they behave very differently on data that is almost sorted.',
  instruction:
    'Pick an algorithm and a starting arrangement, then press play or step through. Switch algorithms on the same array and compare the totals.',
  algorithmLabel: 'Algorithm',
  algorithms: { bubble: 'Bubble sort', insertion: 'Insertion sort' },
  presetLabel: 'Starting array',
  presets: {
    random: 'Random',
    'nearly-sorted': 'Nearly sorted',
    reversed: 'Reversed',
    'few-unique': 'Few unique values',
  },
  sizeLabel: 'Size',
  shuffle: 'New array',
  comparisons: 'Comparisons',
  swaps: { bubble: 'Swaps', insertion: 'Shifts' },
  compareTitle: 'Total cost on this array',
  compareRow: /** @param {number} c @param {number} s @param {string} moves */ (c, s, moves) =>
    `${c} comparisons · ${s} ${moves.toLowerCase()}`,
  /** @param {number[]} values @param {number} sortedCount */
  barsLabel(values, sortedCount) {
    return `Array: ${values.join(', ')}. ${sortedCount} of ${values.length} sorted.`;
  },
  legend: { compare: 'Comparing', swap: 'Swapping', key: 'Key being inserted', sorted: 'Sorted' },
  markers: { compare: '?', swap: '⇄', sorted: '✓' },
  /**
   * @param {SortFrame} f
   * @param {'bubble'|'insertion'} algo
   */
  describe(f, algo) {
    const v = (/** @type {number} */ i) => f.items[i]?.value;
    const [i, j] = f.focus;
    switch (f.kind) {
      case 'start':
        return algo === 'bubble'
          ? 'Each pass walks left to right and bubbles the largest remaining value to the end.'
          : 'The first element on its own is a sorted prefix. Each step inserts the next element into it.';
      case 'pass-start':
        return `New pass: bubble the largest value among indices 0–${i} to index ${i}.`;
      case 'pick':
        return `Take ${v(i)} as the key and slide it left into the sorted prefix.`;
      case 'compare':
        return f.swapped
          ? `${v(i)} > ${v(j)}: out of order.`
          : `${v(i)} ≤ ${v(j)}: already in order${algo === 'insertion' ? ', so the key stops here' : ''}.`;
      case 'swap':
        return algo === 'bubble'
          ? `Swapped — ${v(j)} moves right.`
          : `Shifted ${v(j)} right; the key moves one slot left.`;
      case 'pass':
        return f.focus.length
          ? `Pass complete: ${v(i)} is now in its final position.`
          : 'A whole pass with no swaps — the array is already sorted, so we stop early.';
      case 'place':
        return `The key lands at index ${i}. The first ${f.sorted.length} elements are sorted.`;
      case 'done':
        return `Sorted with ${f.comparisons} comparisons and ${f.swaps} ${algo === 'bubble' ? 'swaps' : 'shifts'}.`;
    }
  },
  takeaways: [
    'Both algorithms only ever compare and swap neighbors, so both are stable: equal values keep their original order.',
    'Try "Reversed": every pair is out of order, so both make n(n−1)/2 swaps — the worst case.',
    'Try "Nearly sorted": insertion sort barely moves, and bubble sort exits early once a pass makes no swaps. This is why insertion sort is used for small or almost-sorted inputs inside real sort libraries.',
    'Both sort in place with O(1) extra memory.',
  ],
  complexity: [
    ['Best', 'O(n)', 'Already sorted: one pass of n−1 comparisons, no swaps.'],
    ['Average', 'O(n²)', 'About half of all pairs are out of order.'],
    ['Worst', 'O(n²)', 'Reversed: every pair of elements must swap once.'],
  ],
  nextTeaser:
    'Next up: merge sort and quicksort, two divide-and-conquer ways past O(n²) on the same array.',
};
