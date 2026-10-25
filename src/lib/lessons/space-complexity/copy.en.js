/** @typedef {import('$lib/algo-engine/space-complexity.js').SpaceFrame} SpaceFrame */
/** @typedef {import('$lib/algo-engine/space-complexity.js').SpaceAlgo} SpaceAlgo */

/** @type {Record<SpaceAlgo, string>} */
const CLASS = {
  'sum-rec': 'Θ(n): one frame per value from n down to 0',
  'bits-rec': 'Θ(log n): n halves at every call',
  'sum-loop': 'Θ(1): one frame, whatever n is',
  'reverse-copy': 'Θ(n): the copy B needs n words',
  'reverse-in-place': 'Θ(1): only i, j and t, so it works in place',
};

/** @param {number} k @param {string} word */
const plural = (k, word) => `${k} ${word}${k === 1 ? '' : 's'}`;

export const en = {
  slug: 'space-complexity',
  topic: 'complexity',
  level: 'Intermediate',
  title: 'Space complexity',
  intro:
    'Algorithms use memory as well as time. Space complexity counts the extra memory an algorithm needs beyond its input, the auxiliary space, and that includes the call stack: every recursive call that has not returned yet still holds a frame.',
  summary:
    'Watch a memory bar grow with the call stack of a recursive function, and compare it with a loop, a copy, and an in-place reversal.',
  instruction:
    'Pick a program and n, then step. Each call pushes a frame onto the stack and the memory bar grows; each return pops one. Compare the peak of recursive sum with bits, the loop, and the two reversals.',
  nLabel: 'n',
  algoLabel: 'Program',
  algos: /** @type {Record<SpaceAlgo, string>} */ ({
    'sum-rec': 'sum(n), recursive',
    'bits-rec': 'bits(n), halving recursion',
    'sum-loop': 'sumLoop(n), a loop',
    'reverse-copy': 'reversedCopy(A), into a new array',
    'reverse-in-place': 'reverseInPlace(A), two pointers',
  }),
  nError: 'n must be a whole number from 1 to 12.',
  memoryTitle: 'Memory in use (words)',
  /** @param {number} used @param {number} scale */
  memoryLabel: (used, scale) =>
    `Memory bar: ${used} of ${scale} words in use. The scale is the largest peak of the five programs for this n.`,
  /** @param {string} fn @param {number | 'A'} arg @param {number} words */
  frameChip: (fn, arg, words) => `${fn}(${arg}) · ${words}w`,
  heapChip: (/** @type {number} */ words) => `B · ${words}w`,
  /** @param {string} fn @param {number | 'A'} arg */
  frameName: (fn, arg) => `${fn}(${arg})`,
  stackTitle: 'Call stack',
  stackAria: 'Call stack, top frame is the running call',
  arrayA: 'Input A (not counted)',
  arrayB: 'Heap array B',
  pointerI: 'i',
  pointerJ: 'j',
  legend: {
    frame: 'Stack frame',
    top: 'Running frame (top)',
    heap: 'Heap (new array)',
    peak: 'Peak so far',
  },
  arrayLegend: { compare: 'Read', swap: 'Written (swapped or copied)', sorted: 'Filled in B' },
  stats: {
    words: 'Words in use',
    peak: 'Peak words',
    depth: 'Stack depth',
    maxDepth: 'Deepest stack',
  },
  classTitle: 'Auxiliary space',
  classes: CLASS,
  /** @param {SpaceAlgo} algo @param {number} n @param {number} peak */
  peakFormula: (algo, n, peak) =>
    ({
      'sum-rec': `(n + 1) frames × 2 words = ${peak}`,
      'bits-rec': `(⌊log₂ ${n}⌋ + 1) frames × 2 words = ${peak}`,
      'sum-loop': `1 frame × 4 words = ${peak}`,
      'reverse-copy': `4-word frame + n = ${n} heap words = ${peak}`,
      'reverse-in-place': `1 frame × 5 words = ${peak}`,
    })[algo],
  practiceTitle: 'Check yourself',
  /** @param {SpaceFrame} f */
  describe(f) {
    const top = f.stack[f.stack.length - 1];
    switch (f.kind) {
      case 'start':
        return `Nothing on the stack yet. Run with n = ${f.n}.`;
      case 'call':
        return `Call ${top.fn}(${top.arg}): push a frame of ${top.words} words. Depth ${f.stack.length}, ${f.words} words in use.`;
      case 'base':
        return `${top.fn}(${top.arg}) is the base case and returns ${f.value} without another call. The stack is at its deepest: ${plural(f.stack.length, 'frame')}.`;
      case 'return':
        if (f.stack.length === 0) {
          const what =
            f.algo === 'reverse-in-place'
              ? 'Return'
              : f.algo === 'reverse-copy'
                ? 'Return B (it stays on the heap as the output)'
                : `Return ${f.value}`;
          return `${what} and pop the last frame: ${f.words} words in use.`;
        }
        return `Return ${f.value} to ${f.stack[f.stack.length - 1].fn}(${f.stack[f.stack.length - 1].arg}) and pop a frame: ${f.words} words in use.`;
      case 'init':
        return f.algo === 'sum-loop'
          ? 's = 0. The loop will reuse this one frame: no new memory per pass.'
          : `i = 0, j = ${f.j}. Two indices and a temporary t, all in one frame.`;
      case 'alloc':
        return `Allocate B: ${f.n} new words on the heap. Memory in use jumps to ${f.words} words.`;
      case 'step':
        return f.algo === 'sum-loop'
          ? `i = ${f.i}: s = ${f.value}. Still ${f.words} words.`
          : `B[${f.n - 1 - f.i}] = A[${f.i}] = ${f.input?.[f.i]}.`;
      case 'swap':
        return `Swap A[${f.i}] and A[${f.j}] through t, inside A itself.`;
      case 'move':
        return `Move inward: i = ${f.i}, j = ${f.j}.`;
      case 'exit':
        return `i ≥ j: every pair is swapped and A is reversed, with no extra array.`;
      case 'done':
        return `Done. Peak ${f.peak} words, deepest stack ${plural(f.maxDepth, 'frame')}: ${CLASS[f.algo]}.`;
    }
  },
  takeaways: [
    'Space complexity counts auxiliary memory: the words an algorithm needs beyond its input, as a function of n.',
    'Every call that has not returned keeps a frame on the call stack, so recursion depth is memory: sum(n) holds n + 1 frames at its deepest, Θ(n), while bits(n) halves n and holds only ⌊log₂ n⌋ + 1, Θ(log n).',
    'A loop reuses one frame, so the same sum costs Θ(1) space as a loop. Time stays Θ(n) either way.',
    'An in-place algorithm rearranges its input using only Θ(1) extra words (insertion sort, heapsort, two-pointer reversal); building a new array of n elements costs Θ(n).',
    'Try n = 12 with sum(n) and then bits(n): 26 words against 8, and the gap keeps growing with n.',
  ],
  complexityHead: ['Program', 'Space', 'Why'],
  complexity: [
    ['sum(n), recursive', 'Θ(n)', 'n + 1 frames on the stack at the deepest point.'],
    ['bits(n), halving', 'Θ(log n)', 'n halves each call: ⌊log₂ n⌋ + 1 frames.'],
    ['sumLoop(n)', 'Θ(1)', 'One frame reused by every pass.'],
    ['reversedCopy(A)', 'Θ(n)', 'A new array B of n words.'],
    ['reverseInPlace(A)', 'Θ(1)', 'Swaps inside A with i, j and t.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Each frame of the recursive sum(n) holds 2 words. What is its peak memory for n = 10?',
      answer: 22,
      unit: 'words',
      hints: [
        'At the base case, the calls sum(10), sum(9), …, sum(0) are all on the stack.',
        'That is n + 1 = 11 frames.',
      ],
      solution: 'sum(10) down to sum(0) is 11 frames at once, 11 × 2 = 22 words.',
    },
    {
      type: 'number',
      prompt: 'How many frames are on the stack at the deepest point of bits(1000)?',
      answer: 10,
      unit: 'frames',
      hints: ['Follow the argument: 1000, 500, 250, 125, …', 'The answer is ⌊log₂ 1000⌋ + 1.'],
      solution:
        '1000 → 500 → 250 → 125 → 62 → 31 → 15 → 7 → 3 → 1 is 10 calls, matching ⌊log₂ 1000⌋ + 1 = 9 + 1 = 10.',
    },
    {
      type: 'choice',
      prompt: 'What is the auxiliary space of reverseInPlace(A) on an array of n elements?',
      options: ['Θ(1)', 'Θ(log n)', 'Θ(n)'],
      answer: 0,
      hints: ['Does the memory bar grow when you raise n?', 'The input A itself is not counted.'],
      solution:
        'It uses one frame with i, j, t and a return address, 5 words for any n, so Θ(1). The array A is input, not auxiliary space.',
    },
    {
      type: 'multi',
      prompt: 'Which of these work in place (Θ(1) auxiliary space, ignoring the call stack)?',
      options: [
        'Insertion sort',
        'Reversing an array with two pointers',
        'Heapsort',
        'Merge sort that merges into a buffer array',
      ],
      answers: [0, 1, 2],
      hints: ['Look for an array of n extra elements.'],
      solution:
        'Insertion sort, two-pointer reversal and heapsort only move elements inside the input. Array merge sort copies into a buffer of n elements, so it needs Θ(n) extra space.',
    },
  ],
  nextTeaser:
    'Next up: amortized analysis, where an occasional expensive step is paid for by many cheap ones.',
};
