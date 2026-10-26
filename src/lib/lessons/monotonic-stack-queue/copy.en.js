/** @typedef {import('$lib/algo-engine/monotonic-stack-queue.js').MonoFrame} MonoFrame */

/** A count with its noun, singular for 1. */
/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {MonoFrame} f @param {number} j */
const val = (f, j) => f.items[j];

/** Values of the held indices, in order. @param {MonoFrame} f */
const heldValues = (f) => f.held.map((j) => f.items[j]).join(', ');

export const en = {
  slug: 'monotonic-stack-queue',
  topic: 'stacks-queues',
  level: 'Advanced',
  title: 'Monotonic stack and queue',
  intro:
    'A monotonic stack or queue keeps its values in sorted order by throwing away every value that can no longer be an answer. Each new bar pops the shorter bars it beats, so finding every next greater element, or the maximum of every sliding window, takes one left-to-right pass: each index is pushed once and popped at most once, O(n) in total.',
  summary:
    'Watch a monotonic stack find next greater elements and a monotonic deque find sliding window maxima, with every push and pop counted.',
  instruction:
    'Pick a problem, type your own values (and k for the window), then step through. Watch a new bar pop the shorter bars from the stack, and compare the pushes and pops counters with 2n. Try “Rising” and “Falling” to see the extremes.',
  modeLabel: 'Problem',
  modes: { 'next-greater': 'Next greater element', 'window-max': 'Sliding window maximum' },
  valuesLabel: 'Values (1 to 99)',
  kLabel: 'Window k',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: { mixed: 'Mixed', falling: 'Falling', rising: 'Rising', random: 'Random' },
  barsTitle: 'The values, read left to right',
  stackTitle: 'Monotonic stack (indices)',
  dequeTitle: 'Monotonic deque (indices)',
  answerTitle: {
    'next-greater': 'answer[i]: next greater value (−1 for none)',
    'window-max': 'Window maximum, by window start',
  },
  unknown: '?',
  /** @param {MonoFrame} f */
  barsLabel: (f) =>
    `Values ${f.items.join(', ')}${f.i >= 0 ? `, reading index ${f.i} (${f.items[f.i]})` : ''}.`,
  /** @param {MonoFrame} f */
  heldLabel: (f) =>
    f.held.length === 0
      ? `The ${f.mode === 'next-greater' ? 'stack' : 'deque'} is empty.`
      : f.mode === 'next-greater'
        ? `Stack, bottom to top: ${f.held.map((j) => `index ${j} (${f.items[j]})`).join(', ')}.`
        : `Deque, front to back: ${f.held.map((j) => `index ${j} (${f.items[j]})`).join(', ')}.`,
  /** @param {MonoFrame} f */
  answerLabel: (f) =>
    `${f.mode === 'next-greater' ? 'Next greater answers' : 'Window maxima'}: ${f.answer
      .map((a) => (a === null ? 'not known yet' : a))
      .join(', ')}.`,
  /** @param {number} j @param {number} v */
  heldItem: (j, v) => `a[${j}]=${v}`,
  stats: {
    pushes: 'Pushes',
    pops: 'Pops',
    comparisons: 'Comparisons',
    bound: 'Pushes + pops, at most 2n',
  },
  valueErrors: {
    format: 'Separate whole numbers with commas or spaces.',
    range: 'Values must be from 1 to 99.',
    count: 'Use at most 12 values.',
  },
  /** @param {number} n */
  kError: (n) => `k must be a whole number from 1 to ${n}, the number of values.`,
  markers: { active: '▸', compare: '?', swap: '×' },
  legend: {
    active: 'Arriving value a[i]',
    compare: 'Compared with a[i]',
    swap: 'Popped',
    frontier: 'Held in the structure',
    outside: 'Outside the window (dimmed)',
    unread: 'Not read yet (dimmed)',
  },
  /** @param {MonoFrame} f */
  describe(f) {
    const v = f.i >= 0 ? val(f, f.i) : 0;
    const ng = f.mode === 'next-greater';
    switch (f.kind) {
      case 'start':
        return ng
          ? 'Scan left to right. The stack holds the indices still waiting for a greater value; their values never increase towards the top.'
          : `Scan left to right with windows of k = ${f.k}. The deque holds indices whose values decrease from front to back, so the front is the maximum.`;
      case 'read':
        return `a[${f.i}] = ${v} arrives.`;
      case 'compare': {
        const x = val(f, f.compared);
        const where = ng ? 'top' : 'back';
        if (ng)
          return f.smaller
            ? `The ${where} is a[${f.compared}] = ${x}, smaller than ${v}: ${v} is its next greater element.`
            : `The ${where} is a[${f.compared}] = ${x}, not smaller than ${v}: stop popping.`;
        return f.smaller
          ? `The ${where} is a[${f.compared}] = ${x} ≤ ${v}: while ${v} is in the window, ${x} can never be the maximum.`
          : `The ${where} is a[${f.compared}] = ${x} > ${v}: it may still be a maximum later, so stop.`;
      }
      case 'pop': {
        const j = f.popped[0];
        return ng
          ? `Pop index ${j} and record answer[${j}] = ${v}. It is gone for good.`
          : `Pop index ${j} (${val(f, j)}) from the back. It is gone for good.`;
      }
      case 'push':
        return `Push index ${f.i}. Values held now: ${heldValues(f)}${ng ? ', never increasing.' : ', decreasing.'}`;
      case 'expire': {
        const j = f.popped[0];
        return `Index ${j} has slid out of the window a[${f.i - f.k + 1}..${f.i}]: pop it from the front.`;
      }
      case 'emit': {
        const start = f.i - f.k + 1;
        return `The window a[${start}..${f.i}] is complete: its maximum is the front, a[${f.held[0]}] = ${val(f, f.held[0])}.`;
      }
      case 'leftover':
        return `The scan is over. Nothing greater came after ${f.held.length === 1 ? 'index' : 'indices'} ${f.held.join(', ')}: answer −1.`;
      case 'done': {
        const n = f.items.length;
        return `Done. ${count(f.pushes, 'push', 'pushes')} and ${count(f.pops, 'pop', 'pops')}: ${f.pushes + f.pops} ≤ 2n = ${2 * n}, so the whole scan is O(n).`;
      }
    }
  },
  takeaways: [
    'A monotonic stack or deque keeps its values sorted by popping, before each push, every value the new one makes useless.',
    'Next greater element: keep a stack whose values never increase. A new value pops every smaller one and is their answer; whatever is left at the end has none (−1).',
    'Sliding window maximum: keep a deque of decreasing values. Pop values ≤ the new one from the back, pop the front when it leaves the window, and read the maximum at the front.',
    'One step may pop many values, but each index is pushed once and popped at most once, so all n steps cost O(n) together: amortized O(1) each.',
    'Load “Rising” and then “Falling” for next greater elements: count the pops each time and see where the work goes.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    ['Next greater element', 'O(n)', 'n pushes and at most n pops in total.'],
    ['Sliding window maximum', 'O(n)', 'Each index enters the deque once and leaves at most once.'],
    [
      'One step, worst case',
      'O(n)',
      'A big value can pop many at once, but each only once: amortized O(1).',
    ],
    ['Brute force', 'O(n·k)', 'Rescans every window; O(n²) for next greater.'],
    ['Extra memory', 'O(n)', 'The stack can hold all n values; the deque at most k.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Values 4, 2, 7, 3, 1, 5, 8, 6. What is the next greater element of the 3 (index 3)?',
      answer: 5,
      hints: ['Look right of index 3 for the first value strictly bigger than 3.'],
      solution:
        'To the right of 3 come 1 (smaller) and then 5. In the run, the 5 arrives, pops 1 and then 3, recording 5 for both.',
    },
    {
      type: 'number',
      prompt: 'For the same values, how many pops does the next greater scan make in total?',
      answer: 6,
      unit: 'pops',
      hints: ['An index is popped exactly when it gets an answer other than −1.'],
      solution:
        'Answers are 7, 7, 8, 5, 5, 8, −1, −1. Six indices get a real answer, so six pops. Load “Mixed” to check.',
    },
    {
      type: 'number',
      prompt:
        'Values 4, 2, 7, 3, 1, 5, 8, 6 with k = 3. What is the maximum of the window that starts at index 3?',
      answer: 5,
      hints: ['That window is a[3..5].'],
      solution: 'a[3..5] = 3, 1, 5, so the maximum is 5. All window maxima: 7, 7, 7, 5, 8, 8.',
    },
    {
      type: 'choice',
      prompt: 'Why is the whole next greater scan O(n) even though one step can pop many values?',
      options: [
        'Each index is pushed once and popped at most once',
        'The stack never holds more than two values',
        'The values are sorted first',
      ],
      answer: 0,
      hints: ['Count the total pushes and pops over the whole run, not per step.'],
      solution:
        'There are n pushes and at most n pops in total, so the work over all steps is at most about 2n: amortized O(1) per value.',
    },
  ],
  nextTeaser:
    'Next up: practice with stacks and queues, building a queue from two stacks and a stack that knows its minimum.',
};
