/** @typedef {import('$lib/algo-engine/knapsack-subset-sum.js').KnapFrame} KnapFrame */
/** @typedef {import('$lib/algo-engine/knapsack-subset-sum.js').KnapProblem} KnapProblem */
/** @typedef {import('$lib/algo-engine/knapsack-subset-sum.js').KnapLayout} KnapLayout */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** @param {number[]} items */
const names = (items) => items.map((i) => `item ${i}`).join(', ');
/** @param {number} v */
const yesNo = (v) => (v ? 'true' : 'false');

export const en = {
  slug: 'knapsack-subset-sum',
  topic: 'dynamic-programming',
  level: 'Intermediate',
  title: '0/1 knapsack and subset sum',
  intro:
    'Items cannot be cut, so the best choice for one item depends on how much room the others leave. The table therefore gets a capacity dimension: cell (i, c) answers the problem for the first i items and capacity c, and each cell decides only whether to take or skip item i. Subset sum is the same table with true and false instead of values.',
  summary:
    'Fill the knapsack and subset sum tables over items and capacity, see each take or skip choice, and shrink the table to one row.',
  instruction:
    'Drag the Item and Capacity sliders, or click a cell, to read that cell’s take or skip choice; step to watch the table fill. Then switch Memory to One row, downward, and to One row, upward: compare the answer with the true 0/1 answer.',
  problemLabel: 'Problem',
  problems: { knapsack: '0/1 knapsack', subset: 'Subset sum' },
  layoutLabel: 'Memory',
  layouts: {
    table: 'Full table',
    'row-down': 'One row, downward',
    'row-up': 'One row, upward',
  },
  itemsLabel: {
    knapsack: 'Items, weight:value',
    subset: 'Weights',
  },
  capacityLabel: { knapsack: 'Capacity W', subset: 'Target T' },
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    small: 'Four items, W = 7',
    trap: 'Greedy trap, W = 5',
    single: 'One item, W = 6',
    yes: '3, 34, 4, 12, 5, 2, T = 9',
    even: '2, 4, 6, 8, T = 7',
  },
  /**
   * @param {number} maxItems
   * @param {number} maxWeight
   * @param {number} maxValue
   * @param {number} maxCapacity
   */
  errors: (maxItems, maxWeight, maxValue, maxCapacity) => ({
    format: {
      knapsack: 'Write each item as weight:value, for example 2:3, 3:4.',
      subset: 'Write whole numbers separated by commas, for example 3, 4, 5.',
    },
    count: `Type 1 to ${maxItems} items.`,
    range: `Weights run from 1 to ${maxWeight} and values from 0 to ${maxValue}.`,
    capacity: `The capacity must be a whole number from 0 to ${maxCapacity}.`,
  }),
  sliderItem: 'Item i',
  sliderCapacity: 'Capacity c',
  /** @param {number} i @param {number} c */
  sliderValue: (i, c) => `Cell (${i}, ${c})`,
  tableTitle: { table: 'Table over items and capacity', row: 'One row over capacity' },
  /** @param {KnapProblem} p @param {KnapLayout} layout */
  tableNote: (p, layout) => {
    if (layout !== 'table')
      return p === 'knapsack'
        ? 'dp[c] is the most value at capacity c, using the items handled so far.'
        : 'dp[c] says whether the items handled so far can weigh exactly c. T is true, F is false.';
    return p === 'knapsack'
      ? 'Rows are the first i items, columns are the capacity c. Cell (i, c) is the most value they can pack into c.'
      : 'Rows are the first i items, columns are the sum c. Cell (i, c) says whether some of them weigh exactly c. T is true, F is false.';
  },
  /** @param {number} v */
  boolCell: (v) => (v ? 'T' : 'F'),
  rowName: 'dp',
  /** @param {KnapProblem} p @param {number} n @param {number} w */
  tableAria: (p, n, w) =>
    `${p === 'knapsack' ? 'Knapsack' : 'Subset sum'} table for ${plural(n, 'item', 'items')} and capacity ${w}.`,
  /** @param {string} name @param {number} c @param {number|string|null} v @param {string} state */
  cellLabel: (name, c, v, state) =>
    `${name}, capacity ${c}: ${v === null ? 'empty' : v}${state ? `, ${state}` : ''}`,
  /** @param {number} i */
  rowLabel: (i) => (i === 0 ? 'no items' : `items 1 to ${i}`),
  cellStates: {
    current: 'filled now',
    read: 'read',
    kept: 'read, and kept',
    reused: 'read, already holds this item',
    path: 'on the walk back',
    answer: 'the answer',
  },
  legend: {
    current: 'Filled now',
    read: 'Read by this cell',
    kept: 'The option it keeps',
    reused: 'Read, already holds this item',
    path: 'Walk back from the answer',
    answer: 'The answer',
  },
  markers: { current: '●', read: '○', kept: '✓', reused: '!', path: '◆', answer: '★' },
  choiceTitle: 'Take or skip',
  choiceEmpty: 'Step to a cell, or pick one with the sliders.',
  choiceNoFit: 'does not fit',
  /** @param {KnapFrame} f */
  choiceSkip: (f) =>
    f.layout === 'table'
      ? `Skip: ${f.problem === 'knapsack' ? 'K' : 'S'}[${f.i - 1}][${f.c}]`
      : `Skip: dp[${f.c}]`,
  /** @param {KnapFrame} f */
  choiceTake: (f) => {
    const w = f.items[f.i - 1].weight;
    if (f.layout === 'table') {
      const cell = `${f.problem === 'knapsack' ? 'K' : 'S'}[${f.i - 1}][${f.fits ? f.c - w : '–'}]`;
      return f.problem === 'knapsack'
        ? `Take: ${cell} + ${f.items[f.i - 1].value}`
        : `Take: ${cell}`;
    }
    return f.problem === 'knapsack'
      ? `Take: dp[${f.c - w}] + ${f.items[f.i - 1].value}`
      : `Take: dp[${f.c - w}]`;
  },
  /** @param {KnapProblem} p @param {number|null} v */
  choiceValue: (p, v) => (v === null ? '' : p === 'knapsack' ? String(v) : v ? 'T' : 'F'),
  choiceKept: '✓ kept',
  itemsTitle: 'Items',
  itemHead: { item: 'Item', weight: 'Weight', value: 'Value', state: 'State' },
  itemStates: { now: '● now', taken: '✓ taken' },
  pickedTitle: 'Items taken',
  pickedEmpty: 'Named by the walk back.',
  /** @param {number} i */
  pickedChip: (i) => `item ${i}`,
  noWalkTitle: 'Items taken',
  noWalk: 'One row cannot name the items: the earlier rows are gone.',
  stats: {
    filled: 'Cells filled',
    updates: 'Cells written',
    answer: 'Answer',
    correct: 'True 0/1 answer',
    greedy: 'Greedy by value/weight',
    memory: 'Cells in memory',
    reuses: 'Items used again',
    bits: 'Bits to write T',
  },
  pending: '…',
  /** @param {KnapProblem} p @param {number|null} v */
  answerText: (p, v) => (v === null ? '…' : p === 'knapsack' ? String(v) : v ? 'Yes' : 'No'),
  /** @param {number} n @param {number} w @param {number} bits @param {number} w2 */
  pseudoNote: (n, w, bits, w2) =>
    `Pseudo-polynomial: W = ${w} takes ${plural(bits, 'bit', 'bits')} to write and the table has ${(n + 1) * (w + 1)} cells. One more bit, W = ${w2}, gives ${(n + 1) * (w2 + 1)}.`,
  /** @param {KnapFrame} f */
  describe(f) {
    const knap = f.problem === 'knapsack';
    const row = f.layout !== 'table';
    const T = knap ? 'K' : 'S';
    const item = f.items[f.i - 1];
    const here = row ? `dp[${f.c}]` : `${T}[${f.i}][${f.c}]`;
    switch (f.kind) {
      case 'start':
        return knap
          ? `Pack ${plural(f.items.length, 'item', 'items')} into capacity ${f.capacity} for the most value. Each item is taken whole, at most once.`
          : `Can some of these ${plural(f.items.length, 'item', 'items')} weigh exactly ${f.capacity}? Each is used at most once.`;
      case 'base':
        if (row)
          return knap
            ? 'Base case: before any item, every capacity holds value 0.'
            : 'Base case: before any item, only the sum 0 is reachable.';
        return knap
          ? 'Base case: row 0 has no items, so every capacity holds value 0.'
          : 'Base case: with no items only the sum 0 is reachable, the empty subset.';
      case 'item':
        return item.weight > f.capacity
          ? `Item ${f.i} weighs ${item.weight}, more than ${f.capacity}, so this pass writes nothing.`
          : `Item ${f.i}, weight ${item.weight}: sweep c ${f.layout === 'row-down' ? `from ${f.capacity} down to ${item.weight}` : `from ${item.weight} up to ${f.capacity}`}.`;
      case 'fill': {
        if (!f.fits)
          return `Item ${f.i} weighs ${item.weight}, more than c = ${f.c}: it does not fit, so skip it. ${here} = ${knap ? f.skip : yesNo(f.skip)}.`;
        if (!knap) {
          if (f.skip)
            return `${here}: the sum ${f.c} is already reachable without item ${f.i}. It stays true.`;
          return f.took
            ? `${here}: take item ${f.i}, because the sum ${f.c} − ${item.weight} = ${f.c - item.weight} was reachable.${f.reused ? ' But that sum already used this item, so it is being used twice.' : ''}`
            : `${here}: neither skipping nor taking item ${f.i} reaches ${f.c}. It stays false.`;
        }
        const offer = `Skip → ${f.skip}, take → ${f.take}.`;
        if (!f.took)
          return `${offer} Taking item ${f.i} is no better, so skip: ${here} = ${f.skip}.`;
        return `${offer} Take item ${f.i}: ${here} = ${f.take}.${f.reused ? ` But dp[${f.c - item.weight}] already holds item ${f.i}, so it is being used again.` : ''}`;
      }
      case 'trace':
        return f.took
          ? `At ${T}[${f.i}][${f.c}]: the value differs from the row above, so item ${f.i} was taken. Move up and left by its weight, ${item.weight}.`
          : `At ${T}[${f.i}][${f.c}]: same as the row above, so item ${f.i} was skipped. Move straight up.`;
      case 'done': {
        if (row) {
          const answer = knap
            ? `dp[${f.capacity}] = ${f.result}`
            : `dp[${f.capacity}] = ${yesNo(/** @type {number} */ (f.result))}`;
          if (f.result === f.correct)
            return `${answer}, which is the true answer, from just ${f.capacity + 1} cells.${f.reuses ? ` Items were used again on the way (${f.reuses} times), yet this answer happens to match.` : ''}`;
          return `${answer}, but the true 0/1 answer is ${knap ? f.correct : yesNo(f.correct)}. Going upward read cells that already held the item, which solves the problem where items can repeat.`;
        }
        if (!knap)
          return f.result
            ? `Yes: ${names(f.picked)} weigh exactly ${f.capacity}.`
            : `No subset weighs exactly ${f.capacity}.`;
        return f.picked.length
          ? `The best value is ${f.result}: ${names(f.picked)}.`
          : 'Nothing fits, so the best value is 0.';
      }
    }
  },
  takeaways: [
    'The capacity is part of the state: K[i][c] is the best value from the first i items with room c. Item i is either skipped, K[i−1][c], or taken, K[i−1][c − w[i]] + v[i]; the larger one wins.',
    'Subset sum is the same table with true and false: S[i][c] = S[i−1][c] or S[i−1][c − w[i]]. It is also knapsack with each value equal to its weight: the answer is yes when the best value equals T.',
    'O(nW) is pseudo-polynomial. It is polynomial in the value of W, but W takes only about log₂ W bits to write, so each extra bit can double the table. Both problems are NP-hard in general, and this table is practical only while W is small.',
    'Each row reads only the row above, so one row is enough if c runs from W down: dp[c − w] is then still the old value. Going up would read this item’s own update, which solves the unbounded problem instead. One row gives the value but no longer the items.',
    'Load the one-item example, weight 2 and value 3 with W = 6, and try each Memory setting. Down gives 3; up gives 9, three copies of one item. Then load the greedy trap: greedy packs 16 but the table finds 22.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    ['Time', 'O(nW)', '(n + 1)(W + 1) cells, each comparing two options.'],
    [
      'Time in input bits',
      'O(n · 2^b)',
      'W can be about 2^b when it is written in b bits, so the cost is pseudo-polynomial.',
    ],
    ['Memory, full table', 'O(nW)', 'Every row stays, so the walk back can name the items.'],
    ['Memory, one row', 'O(W)', 'Each row reads only the one above; c runs downward.'],
    ['Walk back', 'O(n)', 'One step per item, from row n to row 0.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Items 1:1, 3:4, 4:5, 5:7 (weight:value) and capacity 7. What is the best total value?',
      answer: 9,
      unit: 'value',
      hints: ['Load the Four items example and step to the end.'],
      solution:
        'K[4][7] = 9: take items 2 and 3, weight 3 + 4 = 7, value 4 + 5. The heaviest item with item 1 gives only 7 + 1 = 8.',
    },
    {
      type: 'number',
      prompt: 'In the same table, what is K[3][6], using items 1 to 3 and capacity 6?',
      answer: 6,
      unit: 'value',
      hints: ['Set the sliders to Item 3 and Capacity 6.', 'Compare K[2][6] with K[2][2] + 5.'],
      solution:
        'Skip item 3: K[2][6] = 5, from items 1 and 2. Take it: K[2][2] + 5 = 1 + 5 = 6. So K[3][6] = 6.',
    },
    {
      type: 'number',
      prompt: 'How many cells does a full table have for 6 items and capacity 15?',
      answer: 112,
      unit: 'cells',
      hints: ['Count row 0 and column 0 as well: (n + 1)(W + 1).'],
      solution: '(6 + 1) × (15 + 1) = 7 × 16 = 112 cells.',
    },
    {
      type: 'choice',
      prompt: 'Why is O(nW) called pseudo-polynomial?',
      options: [
        'Because the table sometimes gives a wrong answer.',
        'Because W is a value: writing it takes only about log₂ W bits, so the cost can be exponential in the input’s length.',
        'Because the running time does not depend on n.',
        'Because the table needs a random choice.',
      ],
      answer: 1,
      hints: ['Compare how large W is with how long it takes to write down.'],
      solution:
        'The input size counts the bits of W, about log₂ W, while the table has about W columns. Each extra bit can double the work, so the time is polynomial only in the value of W.',
    },
    {
      type: 'number',
      prompt:
        'One item, weight 2 and value 3, with W = 6. What does the one-row table answer if c runs upward?',
      answer: 9,
      unit: 'value',
      hints: ['Load the One item example and choose One row, upward.'],
      solution:
        'dp[2] = 3, then dp[4] = dp[2] + 3 = 6 and dp[6] = dp[4] + 3 = 9: three copies of an item allowed only once. Going downward gives the true answer, 3.',
    },
    {
      type: 'number',
      prompt:
        'Items 1:6, 2:10, 3:12 and W = 5. How much more value does the table find than greedy by value per weight?',
      answer: 6,
      unit: 'value',
      hints: ['Load the Greedy trap example and read the two stats.'],
      solution:
        'Greedy takes items 1 and 2 for 16, and then item 3 no longer fits. The table takes items 2 and 3 for 22, so it finds 6 more.',
    },
    {
      type: 'choice',
      prompt: 'Can some of 2, 4, 6, 8 sum to 7?',
      options: [
        'Yes, S[4][7] is true.',
        'No: every sum of even numbers is even, and S[4][7] is false.',
      ],
      answer: 1,
      hints: ['Load the 2, 4, 6, 8 example and read column 7.'],
      solution:
        'Column 7 stays false in every row. Only even sums become true, and 7 is odd, so no subset works.',
    },
    {
      type: 'text',
      prompt: 'What is the memory cost of the one-row version, as a function of W?',
      accept: ['O(W)', 'Θ(W)', 'W'],
      hints: ['How many cells does the row have?'],
      solution:
        'One row of W + 1 cells: O(W), down from O(nW). The value survives; the items do not.',
    },
  ],
  nextTeaser:
    'Next up: Interval DP, where a cell stands for a whole stretch of the input and the choice is where to split it.',
};
