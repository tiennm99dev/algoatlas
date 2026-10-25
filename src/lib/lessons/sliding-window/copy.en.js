/** @typedef {import('$lib/algo-engine/sliding-window.js').WindowFrame} WindowFrame */
/** @typedef {import('$lib/algo-engine/sliding-window.js').WindowMode} WindowMode */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

export const en = {
  slug: 'sliding-window',
  topic: 'arrays-strings',
  level: 'Intermediate',
  title: 'Sliding window',
  intro:
    'A sliding window is a run of consecutive elements, a[l..r), that moves across an array while a running total follows it. When the window moves, only the element that enters and the element that leaves change the total, so each step costs O(1) instead of adding the whole window up again. That turns many “best subarray” questions from O(n·k) or O(n²) into one O(n) scan.',
  summary:
    'Slide a fixed window to find the largest sum of k values, or grow and shrink a variable window to find the shortest run with sum at least S, with the running sum updated in O(1) per step.',
  instruction:
    'Pick Fixed or Variable, type the values and k or S, then step. Watch the bracket move: + marks the value added to the sum, − the value taken away. Compare the updates counter with the brute-force cost.',
  modeLegend: 'Window',
  modes: /** @type {Record<WindowMode, string>} */ ({
    fixed: 'Fixed size k',
    variable: 'Shortest with sum ≥ S',
  }),
  valuesLabel: 'Values',
  kLabel: 'Window k',
  sLabel: 'Target S',
  randomButton: 'Random values',
  valueErrors: {
    format: 'Type whole numbers from 0 to 99, separated by commas or spaces.',
    range: 'Every value must be from 0 to 99.',
    count: 'Type from 1 to 20 values.',
  },
  /** @param {number} n */
  kError: (n) => `k must be a whole number from 1 to ${n}, the number of values.`,
  sError: 'S must be a whole number from 1 to 1980.',
  arrayTitle: 'Array a',
  arrayAria: 'The array, index 0 first',
  /** @param {number} sum */
  windowLabel: (sum) => `sum ${sum}`,
  bestLabel: 'best',
  pointerL: 'l',
  pointerR: 'r',
  markers: { enter: '+', leave: '−', best: '✓' },
  /** @param {number} i @param {number} v @param {string} state */
  cellLabel: (i, v, state) => `Index ${i}: ${v}${state ? `, ${state}` : ''}`,
  states: {
    inside: 'in the window',
    enter: 'just added to the sum',
    leave: 'just taken out of the sum',
    best: 'in the best window',
  },
  legend: {
    inside: 'In the window',
    enter: '+ Just added',
    leave: '− Just taken out',
    best: '✓ Best window',
  },
  updateTitle: 'Running sum',
  /** @param {WindowFrame} f */
  updateLine: (f) => {
    const a = f.items;
    const before =
      f.sum - (f.entering >= 0 ? a[f.entering] : 0) + (f.leaving >= 0 ? a[f.leaving] : 0);
    const plus = f.entering >= 0 ? ` + ${a[f.entering]}` : '';
    const minus = f.leaving >= 0 ? ` − ${a[f.leaving]}` : '';
    return plus || minus ? `${before}${plus}${minus} = ${f.sum}` : `${f.sum}`;
  },
  stats: {
    sum: 'Window sum',
    best: 'Best so far',
    bestLength: 'Shortest so far',
    updates: 'Sum updates',
    brute: 'Brute force',
    shrinks: 'Left moves',
  },
  /** @param {number} n @param {number} k */
  bruteFixed: (n, k) => (n - k + 1) * k,
  /** @param {number} n */
  bruteVariable: (n) => (n * (n + 1)) / 2,
  bruteNoteFixed: 'Additions to sum every window from scratch: (n − k + 1) × k.',
  bruteNoteVariable: 'Subarrays to try one by one: n(n + 1)/2.',
  none: 'none',
  pending: '—',
  practiceTitle: 'Check yourself',
  /** @param {WindowFrame} f */
  describe(f) {
    const a = f.items;
    switch (f.kind) {
      case 'start':
        return f.mode === 'fixed'
          ? `Find the largest sum of ${f.target} consecutive values among ${a.length}. Start by adding up the first window.`
          : `Find the shortest run of consecutive values with sum ≥ ${f.target}. The window starts empty at l = 0.`;
      case 'fill':
        return `Add a[${f.entering}] = ${a[f.entering]}: the first window’s sum is ${f.sum} so far.`;
      case 'first':
        return `The first window a[0..${f.right}) sums to ${f.sum}. That is the best so far.`;
      case 'slide':
        return `Slide right: add a[${f.entering}] = ${a[f.entering]} and take out a[${f.leaving}] = ${a[f.leaving]}, so the sum is ${f.sum}${f.improved ? `, a new best` : `, not more than the best ${f.best}`}.`;
      case 'expand':
        return `Grow on the right: add a[${f.entering}] = ${a[f.entering]}, sum ${f.sum}${f.sum >= f.target ? ` ≥ ${f.target}` : ` < ${f.target}, keep growing`}.`;
      case 'record':
        return `Sum ${f.sum} ≥ ${f.target} with length ${f.right - f.left}${f.improved ? ': the shortest so far' : `, not shorter than ${f.best}`}. Now try to shrink from the left.`;
      case 'shrink':
        return `Take out a[${f.leaving}] = ${a[f.leaving]} and move l to ${f.left}: sum ${f.sum}.`;
      case 'done':
        if (f.mode === 'fixed')
          return `Done: the best window is a[${f.bestFrom}..${f.bestTo}) with sum ${f.best}, after ${plural(f.updates, 'update')} instead of ${(a.length - f.target + 1) * f.target}.`;
        return f.best === 0
          ? `Done: no run of values reaches ${f.target}, even the whole array. ${plural(f.updates, 'update')}.`
          : `Done: the shortest window is a[${f.bestFrom}..${f.bestTo}), length ${f.best}. Each value entered once and left at most once: ${plural(f.updates, 'update')}.`;
    }
  },
  takeaways: [
    'A window is a run a[l..r) of consecutive elements. Keep a running aggregate (here a sum) for it, and update it from the elements that enter and leave instead of recomputing.',
    'Fixed window of size k: one O(k) setup, then each slide adds a[r] and subtracts a[r − k]. All n − k + 1 windows cost k + 2(n − k) updates, O(n), instead of (n − k + 1) × k.',
    'Variable window: move r to grow the window until it is good enough, then move l to shrink it while it stays good. Both ends only move right, so the whole scan is O(n).',
    'Shrinking is only safe when growing never makes things worse: with values ≥ 0 a longer window never has a smaller sum. With negative values, use prefix sums instead.',
    'Try the variable window on 2, 3, 1, 2, 4, 3 with S = 7: l moves 5 times, and the answer 4, 3 appears only in the last steps.',
  ],
  complexityHead: ['Task', 'Cost', 'Why'],
  complexity: [
    ['Fixed window, all positions', 'O(n)', 'k additions to start, then 2 updates per slide.'],
    ['Fixed window, recomputed', 'O(n·k)', 'n − k + 1 windows of k additions each.'],
    ['Variable window', 'O(n)', 'r moves n times and l at most n times.'],
    ['All subarrays, brute force', 'O(n²)', 'n(n + 1)/2 subarrays to try.'],
    ['Extra memory', 'O(1)', 'l, r, the running sum and the best.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'What is the largest sum of 3 consecutive values in [2, 1, 5, 1, 3, 2]?',
      answer: 9,
      hints: ['The windows sum to 8, 7, 9 and 6.'],
      solution:
        '2 + 1 + 5 = 8, then 8 + 1 − 2 = 7, then 7 + 3 − 1 = 9, then 9 + 2 − 5 = 6. The best is 9, from 5, 1, 3.',
    },
    {
      type: 'number',
      prompt:
        'A fixed window of k = 4 slides over n = 10 values. How many sum updates (additions and subtractions of one element) does it make?',
      answer: 16,
      unit: 'updates',
      hints: ['The first window needs k additions; each of the n − k slides needs 2 updates.'],
      solution:
        '4 + 2 × (10 − 4) = 16 updates. Recomputing every window would take (10 − 4 + 1) × 4 = 28 additions.',
    },
    {
      type: 'number',
      prompt: 'What is the length of the shortest run in [2, 3, 1, 2, 4, 3] with sum ≥ 7?',
      answer: 2,
      hints: ['Look near the end of the array.'],
      solution: '4 + 3 = 7 has length 2, and no single value reaches 7.',
    },
    {
      type: 'number',
      prompt: 'In that same search (S = 7), how many times does the left end l move?',
      answer: 5,
      unit: 'moves',
      hints: [
        'Run it in the widget with the variable window and watch the “Left moves” counter.',
        'l moves once when r = 3, twice when r = 4 and twice when r = 5.',
      ],
      solution:
        'At r = 3 the sum 8 lets l move to 1; at r = 4 the sum 10 lets l move to 3; at r = 5 the sum 9 lets l move to 5. That is 1 + 2 + 2 = 5 moves, never more than n.',
    },
    {
      type: 'choice',
      prompt: 'Why is the variable window O(n) even though it has a loop inside a loop?',
      options: [
        'l and r only move right, so each element enters once and leaves at most once',
        'The inner loop runs at most once per outer step',
        'The array is sorted first',
        'The window never holds more than k values',
      ],
      answer: 0,
      hints: ['Count the moves of l over the whole run, not per value of r.'],
      solution:
        'The inner loop can run many times for one r, but every run moves l right and l never passes n. So the inner loop runs at most n times in total, and the scan is O(n).',
    },
  ],
  nextTeaser:
    'Next up: Prefix sums and difference arrays, which answer any range sum with two lookups.',
};
