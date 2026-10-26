import { equalKeyOrder } from '$lib/algo-engine/selection-sort-stability.js';

/** @typedef {import('$lib/algo-engine/selection-sort-stability.js').SelectionFrame} SelectionFrame */
/** @typedef {import('$lib/algo-engine/selection-sort-stability.js').Card} Card */

const TAGS = 'abcdefghij';

/** @param {number} tag */
const tagName = (tag) => TAGS[tag] ?? String(tag + 1);

/** @param {Card | undefined} c */
const card = (c) => (c ? `${c.key}${tagName(c.tag)}` : '');

export const en = {
  slug: 'selection-sort-stability',
  topic: 'sorting',
  level: 'Beginner',
  title: 'Selection sort and stability',
  intro:
    'Selection sort scans the unsorted part for the smallest card and puts it at the front, one slot per pass. It sorts in place with very few writes, but its long swaps can jump one card over an equal one. A sort that keeps equal keys in their original order is called stable.',
  summary:
    'Step through selection sort on cards with repeated keys and see why the classic swap version is not stable, while a shifting version is.',
  instruction:
    'Type some keys with repeats, or press Random, then step through. Cards with the same key get letters a, b, c in input order. Watch the letters at the end, then switch to the shifting version and compare.',
  variantLabel: 'Version',
  variants: { swap: 'Swap (classic)', shift: 'Shift (stable)' },
  keysLabel: 'Keys',
  randomButton: 'Random',
  keyErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 3, 1, 3.',
    range: 'Every key must be from 0 to 99.',
    count: 'Type from 2 to 10 keys.',
  },
  cardsTitle: 'Cards',
  /** @param {Card[]} items @param {number} sortedCount */
  cardsAria: (items, sortedCount) =>
    `Cards in order: ${items.map(card).join(', ')}. ${sortedCount} of ${items.length} in final place.`,
  /** @param {Card} c @param {string} role */
  cardLabel: (c, role) => `Key ${c.key}, card ${tagName(c.tag)}${role ? `, ${role}` : ''}`,
  tagName,
  tagNote: 'Same key, same number; the letter and colour show which came first in the input.',
  stats: {
    comparisons: 'Comparisons',
    writes: 'Slots written',
    sorted: 'Sorted prefix',
    pairs: 'n(n − 1)/2',
  },
  equalTitle: 'Equal keys, left to right',
  equalEmpty: 'No key repeats.',
  /** @param {number} key @param {number[]} tags */
  equalRow: (key, tags) => `${key}: ${tags.map(tagName).join(' → ')}`,
  /** @param {boolean} kept */
  equalVerdict: (kept) => (kept ? '✓ input order' : '✕ reordered'),
  compareTitle: 'Total cost on these keys',
  /** @param {number} c @param {number} w */
  compareRow: (c, w) => `${c} comparisons · ${w} slots written`,
  /** @param {boolean|null} ok  null when no key repeats */
  stableLabel: (ok) =>
    ok === null
      ? 'no repeated keys to check'
      : ok
        ? 'equal keys kept their order'
        : 'equal keys were reordered',
  legend: {
    current: 'Slot this pass fills',
    min: 'Smallest so far',
    compare: 'Being compared',
    moved: 'Just moved',
    sorted: 'Final place',
  },
  markers: { current: 'i', min: 'min', compare: 'j', moved: '⇄', sorted: '✓' },
  roles: {
    current: 'slot to fill',
    min: 'smallest so far',
    compare: 'being compared',
    moved: 'just moved',
    sorted: 'in final place',
  },
  /** @param {SelectionFrame} f */
  describe(f) {
    const at = (/** @type {number} */ k) => card(f.items[k]);
    switch (f.kind) {
      case 'start':
        return f.items.length < 2
          ? 'One card is already sorted.'
          : `${f.items.length} cards. Each pass finds the smallest card in the unsorted part and moves it to the front of that part.`;
      case 'pass':
        return `Pass ${f.i + 1}: fill slot ${f.i}. Start with min = ${f.i} (${at(f.i)}).`;
      case 'compare':
        return f.smaller
          ? `${at(f.j)} < the old minimum: min moves to slot ${f.j}.`
          : `${at(f.j)} is not smaller than ${at(f.min)}: min stays at slot ${f.min}.`;
      case 'keep':
        return `The smallest card, ${at(f.i)}, is already in slot ${f.i}. Nothing moves.`;
      case 'swap':
        return f.from - f.i > 1
          ? `Swap slots ${f.i} and ${f.from}: ${at(f.i)} goes to the front, and ${at(f.from)} jumps to slot ${f.from}, over every card in between.`
          : `Swap slots ${f.i} and ${f.from}: ${at(f.i)} goes to the front, and ${at(f.from)} moves one slot right.`;
      case 'shift': {
        const moved = f.from - f.i;
        const which =
          moved === 1
            ? `the card in slot ${f.i}`
            : `the ${moved} cards in slots ${f.i} to ${f.from - 1}`;
        return `Take ${at(f.i)} out of slot ${f.from}, shift ${which} one slot right, and put it in slot ${f.i}. No card jumps over another.`;
      }
      case 'done': {
        const totals = `Sorted with ${f.comparisons} ${f.comparisons === 1 ? 'comparison' : 'comparisons'} and ${f.writes} ${f.writes === 1 ? 'slot' : 'slots'} written.`;
        const groups = equalKeyOrder(f.items);
        if (groups.length === 0) return `${totals} No key repeats, so stability cannot show.`;
        const bad = groups.find((g) => !g.kept);
        return bad
          ? `${totals} Not stable here: key ${bad.key} now reads ${bad.tags.map(tagName).join(', ')}.`
          : `${totals} Every repeated key kept its input order.`;
      }
    }
  },
  takeaways: [
    'Selection sort always does n(n − 1)/2 comparisons, even on sorted input: each pass must look at every unsorted card to be sure it found the minimum.',
    'It writes very little: at most n − 1 swaps. That helps when writing is much more expensive than reading.',
    'It is in place: apart from a few variables, it needs no memory beyond the array itself.',
    'A sort is stable when equal keys keep their input order. The classic swap is not stable, because a long swap can carry a card past an equal one. Shifting instead of swapping makes it stable, at the cost of more writes.',
    'Try the keys 2, 2, 1: the swap version ends with 2b before 2a. Then switch to the shift version.',
  ],
  complexityHead: ['Resource', 'Cost', 'Why'],
  complexity: [
    [
      'Comparisons, any input',
      'O(n²)',
      'Exactly n(n − 1)/2: pass i scans all n − 1 − i later cards.',
    ],
    ['Writes, swap version', 'O(n)', 'At most one swap per pass, so at most 2(n − 1) slots.'],
    ['Writes, shift version', 'O(n²)', 'Reversed input shifts every card past every smaller one.'],
    ['Extra memory', 'O(1)', 'In place: only i, j, min and one held card.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'How many key comparisons does selection sort make on 8 cards that are already sorted?',
      answer: 28,
      unit: 'comparisons',
      hints: [
        'Selection sort cannot stop early: every pass scans the rest of the array.',
        'The passes compare 7, 6, 5, … , 1 times.',
      ],
      solution:
        'Pass 1 compares 7 times, pass 2 compares 6 times, and so on down to 1: 7 + 6 + … + 1 = 8 × 7 / 2 = 28. Sorted input does not help.',
    },
    {
      type: 'choice',
      prompt: 'Run the swap version on the cards 2a, 2b, 1. What is the final order?',
      options: ['1, 2a, 2b', '1, 2b, 2a', '2a, 2b, 1', '2b, 1, 2a'],
      answer: 1,
      hints: [
        'Pass 1 finds the minimum 1 in slot 2 and swaps it with slot 0.',
        'After that swap, which 2 is in slot 2?',
      ],
      solution:
        'Pass 1 swaps slots 0 and 2: 1, 2b, 2a. Pass 2 compares 2a with 2b; 2a is not smaller, so nothing moves. The result 1, 2b, 2a has the two 2s in the wrong order, so the swap version is not stable.',
    },
    {
      type: 'number',
      prompt: 'At most how many swaps does the swap version make on 10 cards?',
      answer: 9,
      unit: 'swaps',
      hints: ['Count the passes. Each pass makes at most one swap.'],
      solution:
        'There are n − 1 = 9 passes (the last card is in place once the others are), and each makes at most one swap, so at most 9.',
    },
    {
      type: 'multi',
      prompt: 'Which of these sorts, as shown in this course, are stable?',
      options: [
        'Bubble sort',
        'Insertion sort',
        'Selection sort with swaps',
        'Merge sort',
        'Quicksort (Lomuto partition)',
      ],
      answers: [0, 1, 3],
      hints: [
        'A sort is stable when it only ever moves a card past cards with a different key.',
        'Bubble and insertion sort only swap neighbours that are strictly out of order.',
      ],
      solution:
        'Bubble and insertion sort only swap neighbours when the left one is strictly larger, and merge sort takes from the left run on ties, so all three are stable. Selection sort with swaps and Lomuto quicksort make long swaps that can jump over an equal key.',
    },
  ],
  nextTeaser:
    'Next up: merge sort and quicksort, two divide-and-conquer sorts that break the O(n²) barrier.',
};
